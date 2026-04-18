const http = require('http');
const https = require('https');
const { URL } = require('url');

const PORT = 3001;
const TARGET = 'https://router.huggingface.co';

const server = http.createServer((req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  const targetUrl = new URL(req.url, TARGET);
  let body = [];

  req.on('data', (chunk) => body.push(chunk));
  req.on('end', () => {
    const proxyReq = https.request(
      targetUrl,
      {
        method: req.method,
        headers: {
          ...req.headers,
          host: targetUrl.host,
        },
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode, {
          ...proxyRes.headers,
          'Access-Control-Allow-Origin': '*',
        });
        proxyRes.pipe(res);
      },
    );

    proxyReq.on('error', (err) => {
      console.error('Proxy error:', err.message);
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Proxy error');
    });

    if (body.length) proxyReq.write(Buffer.concat(body));
    proxyReq.end();
  });
});

server.listen(PORT, () => {
  console.log(`CORS proxy listening on http://localhost:${PORT} → ${TARGET}`);
});
