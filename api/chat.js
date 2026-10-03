export default async function handler(req, res) {
  // إعدادات الهيدر لتفادي مشاكل CORS
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
    const { prompt, message, images } = req.body || {};
    const userQuery = prompt || message || "مرحباً";

    // قراءة مفتاح OpenAI من متغيرات البيئة في Vercel
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(200).json({ 
        reply: 'تنبيه: لم يتم العثور على مفتاح OPENAI_API_KEY. يرجى إضافة المفتاح في إعدادات Environment Variables على Vercel.' 
      });
    }

    // تجهيز محتوى الرسالة (نص + صور إن وجدت)
    const userContent = [];
    
    // إضافة النص
    userContent.push({
      type: "text",
      text: userQuery
    });

    // إضافة الصور إن تم إرفاقها من الواجهة
    if (images && Array.isArray(images)) {
      images.forEach(imgBase64 => {
        userContent.push({
          type: "image_url",
          image_url: {
            url: imgBase64
          }
        });
      });
    }

    // الاتصال بـ OpenAI API باستعمال نموذج gpt-4o
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'أنت مساعد OmniFix AI الذكي. تجيب باللغة العربية بأسلوب واضح ومفصل وشامل.'
          },
          {
            role: 'user',
            content: userContent
          }
        ],
        max_tokens: 1500
      })
    });

    const data = await response.json();

    if (response.ok && data.choices && data.choices[0]?.message?.content) {
      const aiReply = data.choices[0].message.content;
      return res.status(200).json({ reply: aiReply, text: aiReply });
    } else {
      const errorMsg = data.error?.message || 'حدث خطأ أثناء التواصل مع OpenAI.';
      return res.status(200).json({ reply: `خطأ من OpenAI: ${errorMsg}` });
    }

  } catch (error) {
    return res.status(200).json({ 
      reply: 'تعذر الاتصال بالسيرفر، يرجى التأكد من صحة المفتاح وإعادة المحاولة.' 
    });
  }
}
