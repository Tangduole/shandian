const BACKEND_URL = process.env.BACKEND_URL || 'https://shandian-api.onrender.com';

export default async function handler(req, res) {
  const { method } = req;
  const url = req.url.replace(/^\/api/, '');

  try {
    const response = await fetch(`${BACKEND_URL}/api${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: method === 'GET' ? undefined : JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Backend unavailable', message: error.message });
  }
}
