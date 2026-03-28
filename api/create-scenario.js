const Busboy = require('busboy');
const { put } = require('@vercel/blob');
const { randomUUID } = require('crypto');

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({ error: 'Storage not configured (BLOB_READ_WRITE_TOKEN)' });
  }

  return new Promise((resolve) => {
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      resolve();
    };

    const bb = Busboy({
      headers: req.headers,
      limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
    });

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
        const token = process.env.BLOB_READ_WRITE_TOKEN;

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
        res.status(500).json({ error: 'Upload failed' });
      }
      done();
    });

    req.pipe(bb);
  });
};
