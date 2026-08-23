// ATLAS AI — Backend Proxy Sunucusu
// Bu sunucu, tarayıcıdan gelen sohbet isteklerini alır ve Anthropic API'ye
// gerçek API anahtarınızla iletir. API anahtarı asla tarayıcıya gönderilmez.

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error('HATA: .env dosyasında ANTHROPIC_API_KEY tanımlı değil.');
  console.error('Lütfen .env.example dosyasını .env olarak kopyalayıp anahtarınızı ekleyin.');
  process.exit(1);
}

app.use(cors()); // Geliştirme için açık; üretimde origin kısıtlayın (aşağıda not var)
app.use(express.json({ limit: '2mb' }));

// Basit sağlık kontrolü
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Sohbet uç noktası — HTML dosyasındaki fetch buraya istek atacak
app.post('/api/chat', async (req, res) => {
  try {
    const { system, messages, max_tokens } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages alanı zorunludur ve boş olamaz.' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: max_tokens || 1500,
        system: system || undefined,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API hatası:', data);
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (err) {
    console.error('Sunucu hatası:', err);
    res.status(500).json({ error: 'Sunucu tarafında bir hata oluştu.' });
  }
});

app.listen(PORT, () => {
  console.log(`ATLAS AI backend http://localhost:${PORT} adresinde çalışıyor`);
});