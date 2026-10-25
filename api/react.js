export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ status: false, msg: 'Method not allowed.' });
  }

  const apiKey = process.env.REACT_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ status: false, msg: 'API belum dikonfigurasi. Tambahkan REACT_API_KEY di environment variables Vercel.' });
  }

  const { url, emojis } = req.body || {};
  if (typeof url !== 'string' || typeof emojis !== 'string' || !url.trim() || !emojis.trim()) {
    return res.status(400).json({ status: false, msg: 'Parameter url dan emojis wajib diisi.' });
  }

  let parsed;
  try { parsed = new URL(url); } catch {
    return res.status(400).json({ status: false, msg: 'URL tidak valid.' });
  }
  if (!['whatsapp.com', 'www.whatsapp.com'].includes(parsed.hostname) || !/^\/channel\/[^/]+\/[^/]+/i.test(parsed.pathname)) {
    return res.status(400).json({ status: false, msg: 'Gunakan link postingan WhatsApp Channel yang valid.' });
  }

  try {
    const upstream = await fetch('https://react.botwa.net/api/react', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify({ url: url.trim(), emojis: emojis.trim() }),
      signal: AbortSignal.timeout(25000)
    });
    const text = await upstream.text();
    let payload;
    try { payload = JSON.parse(text); } catch { payload = { status: false, msg: 'API upstream mengembalikan respons yang tidak bisa dibaca.' }; }
    return res.status(upstream.ok ? 200 : upstream.status).json(payload);
  } catch (error) {
    return res.status(502).json({ status: false, msg: 'Tidak dapat menghubungi React API. Coba lagi nanti.' });
  }
}
