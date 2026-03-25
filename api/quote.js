// Vercel Serverless Function - Yahoo Finance CORS Proxy
// 放在專案根目錄的 api/quote.js
// 瀏覽器呼叫 /api/quote?symbols=0050.TW,2330.TW

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'no-store');

  const { symbols } = req.query;
  if (!symbols) return res.status(400).json({ error: 'symbols required' });

  try {
    // Get crumb from Yahoo (server-side, no CORS issue)
    const crumbRes = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/plain' }
    });
    const crumb = crumbRes.ok ? (await crumbRes.text()).trim() : '';
    const cookie = crumbRes.headers.get('set-cookie') || '';

    // Fetch quotes with crumb + cookie
    const url = `https://query2.finance.yahoo.com/v7/finance/quote?formatted=false&lang=zh-TW&symbols=${encodeURIComponent(symbols)}${crumb ? '&crumb=' + encodeURIComponent(crumb) : ''}`;
    const qr = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json', 'Cookie': cookie }
    });
    if (!qr.ok) return res.status(qr.status).json({ error: 'Yahoo: ' + qr.status });
    const data = await qr.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
