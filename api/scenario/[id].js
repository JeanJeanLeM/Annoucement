const { list } = require('@vercel/blob');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ code: 'METHOD_NOT_ALLOWED', error: 'Method not allowed' });
  }

  const id = req.query && req.query.id;
  if (!id || typeof id !== 'string' || !UUID_RE.test(id)) {
    return res.status(400).json({ code: 'INVALID_SCENARIO_ID', error: 'Invalid scenario id' });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({ code: 'STORAGE_NOT_CONFIGURED', error: 'Storage not configured' });
  }

  try {
    const { blobs } = await list({
      prefix: `puzzles/${id}/`,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    const scenarioBlob = blobs.find((b) => b.pathname.endsWith('scenario.json'));
    if (!scenarioBlob || !scenarioBlob.url) {
      return res.status(404).json({ code: 'SCENARIO_NOT_FOUND', error: 'Scenario not found' });
    }

    const r = await fetch(scenarioBlob.url);
    if (!r.ok) {
      return res.status(502).json({ code: 'SCENARIO_FETCH_FAILED', error: 'Failed to load scenario' });
    }

    const data = await r.json();
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ code: 'SERVER_ERROR', error: 'Server error' });
  }
};
