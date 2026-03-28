const Busboy = require('busboy');
const { put } = require('@vercel/blob');
const { randomUUID } = require('crypto');

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
/** Multipart overhead + meta JSON; keep below typical platform limits where possible */
const MAX_BODY_BYTES = Math.min(MAX_IMAGE_BYTES + 2 * 1024 * 1024, 12 * 1024 * 1024);

async function readRequestBody(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) {
      const err = new Error('BODY_TOO_LARGE');
      err.code = 'BODY_TOO_LARGE';
      throw err;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!rawToken || !String(rawToken).trim()) {
    return res.status(503).json({
      code: 'MISSING_BLOB_TOKEN',
      error:
        'Variable BLOB_READ_WRITE_TOKEN absente ou vide sur ce déploiement.',
      hint:
        'Vercel → Projet → Settings → Environment Variables : nom exactement BLOB_READ_WRITE_TOKEN (tout en majuscules, pas Blob_…). Coche Production, enregistre, puis Redeploy.',
    });
  }

  let rawBody;
  try {
    rawBody = await readRequestBody(req);
  } catch (e) {
    if (e.code === 'BODY_TOO_LARGE') {
      return res.status(413).json({ error: 'Payload too large' });
    }
    console.error('readRequestBody', e);
    return res.status(400).json({ error: 'Could not read request body' });
  }

  if (!rawBody.length) {
    return res.status(400).json({ error: 'Empty body' });
  }

  let bb;
  try {
    bb = Busboy({
      headers: req.headers,
      limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
    });
  } catch (e) {
    console.error('Busboy', e);
    return res.status(400).json({ error: 'Invalid multipart request (Content-Type)' });
  }

  return new Promise((resolve) => {
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      resolve();
    };

    let metaJson = '';
    const chunks = [];
    let imageMime = 'image/jpeg';
    let ext = 'jpg';

    bb.on('field', (name, val) => {
      if (name === 'meta') metaJson = typeof val === 'string' ? val : val.toString();
    });

    bb.on('file', (name, file, info) => {
      if (name !== 'image') {
        file.resume();
        return;
      }
      const mimeType = info.mimeType || '';
      if (mimeType.startsWith('image/')) {
        imageMime = mimeType;
        if (mimeType.includes('png')) ext = 'png';
        else if (mimeType.includes('webp')) ext = 'webp';
        else if (mimeType.includes('gif')) ext = 'gif';
        else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
      }
      file.on('data', (d) => chunks.push(d));
      file.on('limit', () => {
        if (!res.headersSent) res.status(413).json({ error: 'Image too large' });
        done();
      });
    });

    bb.on('error', (err) => {
      console.error(err);
      if (!res.headersSent) res.status(400).json({ error: 'Invalid multipart body' });
      done();
    });

    bb.on('finish', async () => {
      if (res.headersSent) {
        done();
        return;
      }
      try {
        if (!metaJson) {
          res.status(400).json({ error: 'Missing meta field' });
          return done();
        }
        let meta;
        try {
          meta = JSON.parse(metaJson);
        } catch {
          res.status(400).json({ error: 'Invalid meta JSON' });
          return done();
        }
        const buf = Buffer.concat(chunks);
        if (!buf.length) {
          res.status(400).json({ error: 'Missing image file' });
          return done();
        }
        if (buf.length > MAX_IMAGE_BYTES) {
          res.status(413).json({ error: 'Image too large' });
          return done();
        }

        const id = randomUUID();
        const pathBase = `puzzles/${id}`;
        const imagePath = `${pathBase}/image.${ext}`;
        const token = String(rawToken).trim();

        const imageBlob = await put(imagePath, buf, {
          access: 'public',
          contentType: imageMime,
          token,
        });

        const scenario = {
          ...meta,
          imageUrl: imageBlob.url,
          id,
          createdAt: new Date().toISOString(),
        };

        await put(`${pathBase}/scenario.json`, JSON.stringify(scenario), {
          access: 'public',
          contentType: 'application/json; charset=utf-8',
          token,
        });

        const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
        const host = (req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
        const shareUrl = host
          ? `${proto}://${host}/CadeauLuc.html?s=${encodeURIComponent(id)}`
          : `/CadeauLuc.html?s=${encodeURIComponent(id)}`;

        res.status(200).json({ id, shareUrl });
      } catch (e) {
        console.error(e);
        const msg = e && e.message ? String(e.message) : '';
        if (/private store|Cannot use public access/i.test(msg)) {
          res.status(503).json({
            code: 'BLOB_STORE_PRIVATE',
            error:
              'Le store Blob est privé : ce projet exige un store en accès public pour les images partagées.',
            hint:
              'Vercel → Storage → ouvre le store lié à ce token → accès public. Sinon crée un store Blob public, copie le nouveau token Read/Write, mets à jour BLOB_READ_WRITE_TOKEN, Redeploy.',
          });
        } else {
          res.status(500).json({
            code: 'BLOB_UPLOAD_FAILED',
            error: 'Upload failed',
            detail: process.env.VERCEL_ENV === 'development' ? msg : undefined,
          });
        }
      }
      done();
    });

    bb.end(rawBody);
  });
};
