export default async function handler(req, res) {
  // 1. Wajib POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { email, magicLink } = req.body;
  const action = req.query.action; // Ambil action dari URL (?action=send-link / ?action=verify)

  try {
    let amEndpoint = '';
    
    // 2. Deteksi action
    if (action === 'send-link') {
      amEndpoint = 'send-link';
    } else if (action === 'verify') {
      amEndpoint = 'verify-link';
    } else {
      return res.status(400).json({ success: false, message: 'Endpoint tidak valid.' });
    }

    // 3. Tembak API AM
    const amRes = await fetch(`https://am.neonode.my.id/api/${amEndpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action === 'send-link' ? { email } : { email, magicLink })
    });
    
    const data = await amRes.json();
    
    // 4. Return data asli dari API AM
    return res.status(200).json(data);
    
  } catch (err) {
    // 5. Handle jika API AM down / error jaringan
    return res.status(500).json({ 
        success: false, 
        message: 'Server API AM sedang down atau error.' 
    });
  }
                                   }
