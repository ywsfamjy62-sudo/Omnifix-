export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY غير معرف في Vercel.' });

  try {
    const { messages } = req.body;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ model: 'gpt-3.5-turbo', messages: messages || [] })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'خطأ من الذكاء الاصطناعي' });

    return res.status(200).json({ reply: data.choices[0]?.message?.content || '' });
  } catch (error) {
    return res.status(500).json({ error: 'فشل الاتصال بالخادم' });
  }
}
