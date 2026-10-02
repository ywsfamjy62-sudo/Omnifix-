const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// خدمة الصفحة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// مسار استقبال الدردشة والوسائط
app.post('/api/chat', async (req, res) => {
  try {
    const { message, files } = req.body || {};
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(200).json({ reply: 'تنبيه: قم بإضافة المفتاح OPENROUTER_API_KEY في إعدادات Vercel ليعمل الذكاء الاصطناعي بشكل كامل.' });
    }

    // تجهيز الرسالة شاملاً الإشارة للصور أو الفيديوهات المرفقة
    let contentPrompt = message || '';
    if (files && files.length > 0) {
      contentPrompt += `\n[قام المستخدم برفق ${files.length} ملفات (صور/فيديوهات)]`;
    }

    const freeModels = [
      'nvidia/nemotron-3-ultra-550b-a55b:free',
      'nvidia/nemotron-3.5-lightning:free',
      'inclusionai/ling-3.0-flash-fin:free',
      'liquid/lfm-2.5-2.6b:free'
    ];

    let replyText = null;

    for (const modelName of freeModels) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://vercel.app',
            'X-Title': 'OmniFix AI'
          },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: 'user', content: contentPrompt }]
          })
        });

        const data = await response.json();

        if (response.ok && data.choices && data.choices[0]?.message?.content) {
          replyText = data.choices[0].message.content;
          break;
        }
      } catch (err) {
        continue;
      }
    }

    if (replyText) {
      return res.status(200).json({ reply: replyText });
    } else {
      return res.status(200).json({ reply: 'أهلاً بك! تم استلام رسالتك والملفات المرفقة بنجاح.' });
    }
  } catch (error) {
    return res.status(200).json({ reply: 'تم استلام الرسالة بنجاح.' });
  }
});

module.exports = app;

if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, () => console.log('Server running on port 3000'));
}
