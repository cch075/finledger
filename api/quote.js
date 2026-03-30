// Vercel Serverless Function - Yahoo Finance CORS Proxy
// 使用 CommonJS 語法（Vercel 預設格式）
// 放在 GitHub repo 根目錄的 api/quote.js

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'no-store');

  const { symbols } = req.query;
  if (!symbols) return res.status(400).json({ error: 'symbols required' });

  try {
    // 1. 取得 crumb（伺服器端，無 CORS 問題）
    const crumbRes = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    const crumb = crumbRes.ok ? (await crumbRes.text()).trim() : '';
    const cookie = crumbRes.headers.get('set-cookie') || '';

    // 2. 抓報價
    const url = `https://query2.finance.yahoo.com/v7/finance/quote?formatted=false&lang=zh-TW&symbols=${encodeURIComponent(symbols)}${crumb ? '&crumb=' + encodeURIComponent(crumb) : ''}`;
    const qr = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Cookie': cookie
      }
    });

    if (!qr.ok) return res.status(qr.status).json({ error: 'Yahoo HTTP ' + qr.status });
    const data = await qr.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
