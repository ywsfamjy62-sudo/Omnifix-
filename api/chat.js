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
      return res.status(200).json({ reply: 'تنبيه: يُرجى إدخال مفتاح OPENROUTER_API_KEY في إعدادات Vercel.' });
    }

    // نماذج ذكاء اصطناعي مجانية وسريعة
    const freeModels = [
      'meta-llama/llama-3.1-8b-instruct:free',
      'mistralai/mistral-7b-instruct:free',
      'qwen/qwen-2.5-7b-instruct:free'
    ];

    let replyText = null;

    for (const modelName of freeModels) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: 'system', content: 'أنت مساعد ذكي يتحدث اللغة العربية بأسلوب واضح ومباشر.' },
              { role: 'user', content: message || 'مرحباً' }
            ]
          })
        });

        const data = await response.json();
        if (response.ok && data.choices && data.choices[0]?.message?.content) {
          replyText = data.choices[0].message.content;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (replyText) {
      return res.status(200).json({ reply: replyText });
    } else {
      return res.status(200).json({ reply: 'أهلاً بك! استلمت رسالتك لكن السيرفر ينشغل حالياً، حاول مجدداً.' });
    }
  } catch (error) {
    return res.status(200).json({ reply: 'حدث خطأ غير متوقع في معالجة طلبك.' });
  }
}
