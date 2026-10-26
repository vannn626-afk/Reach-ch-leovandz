export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  const { email } = req.body;
  try {
    const amRes = await fetch('https://am.neonode.my.id/api/send-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await amRes.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'API AM down' });
  }
                              }
