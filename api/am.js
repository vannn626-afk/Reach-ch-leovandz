export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { email, magicLink } = req.body;
  const path = req.url;

  try {
    let amEndpoint = '';
    if (path.includes('send-link')) amEndpoint = 'send-link';
    else if (path.includes('verify')) amEndpoint = 'verify-link';

    const amRes = await fetch(`https://am.neonode.my.id/api/${amEndpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(path.includes('send-link') ? { email } : { email, magicLink })
    });
    const data = await amRes.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server Error / API Down' });
  }
}
