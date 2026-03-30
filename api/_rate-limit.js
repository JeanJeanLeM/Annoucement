/**
 * In-memory sliding-window rate limiter for Vercel Serverless.
 *
 * Limitations: state is per-instance (each cold start resets the window).
 * This is fine for blocking rapid-fire abuse; it is NOT a global distributed
 * rate limiter—add Vercel KV or an external store if you need that.
 */
module.exports = function rateLimit(options = {}) {
  const { windowMs = 60 * 60 * 1000, max = 5 } = options;
  const hits = new Map();

  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of hits) {
      const valid = timestamps.filter((t) => now - t < windowMs);
      if (valid.length === 0) hits.delete(key);
      else hits.set(key, valid);
    }
  }, windowMs);
  if (cleanup.unref) cleanup.unref();

  /**
   * @returns {boolean} `true` if the request is allowed, `false` if blocked
   *          (a 429 response is sent automatically when blocked).
   */
  return function check(req, res) {
    const ip = (
      req.headers['x-forwarded-for'] ||
      (req.socket && req.socket.remoteAddress) ||
      'unknown'
    )
      .split(',')[0]
      .trim();

    const now = Date.now();
    const timestamps = (hits.get(ip) || []).filter((t) => now - t < windowMs);

    if (timestamps.length >= max) {
      const retryAfterSec = Math.ceil((timestamps[0] + windowMs - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSec));
      res.status(429).json({
        code: 'RATE_LIMIT_EXCEEDED',
        error: 'Trop de créations de puzzles. Réessayez plus tard.',
        retryAfter: retryAfterSec,
      });
      return false;
    }

    timestamps.push(now);
    hits.set(ip, timestamps);
    return true;
  };
};
