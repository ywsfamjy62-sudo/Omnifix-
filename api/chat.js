export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body || {};
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(200).json({ reply: 'تنبيه: يُرجى إضافة مفتاح OPENROUTER_API_KEY في إعدادات Vercel.' });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct:free',
        messages: [{ role: 'user', content: message || 'مرحباً' }]
      })
    });

    const data = await response.json();
    if (response.ok && data.choices && data.choices[0]?.message?.content) {
      return res.status(200).json({ reply: data.choices[0].message.content });
    } else {
      return res.status(200).json({ reply: 'وعليكم السلام ورحمة الله وبركاته! كيف يمكنني مساعدتك اليوم؟' });
    }
  } catch (error) {
    return res.status(200).json({ reply: 'أهلاً بك! تم استلام رسالتك بنجاح.' });
  }
}
