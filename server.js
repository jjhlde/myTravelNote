const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 5000;

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain'
};

const server = http.createServer((req, res) => {
  // URL에서 쿼리 파라미터 제거
  let pathname;
  try {
    const parsedUrl = new URL(req.url, 'http://localhost');
    pathname = parsedUrl.pathname;
  } catch (e) {
    pathname = req.url.split('?')[0]; // Fallback
  }

  // 기본 경로 처리
  if (pathname === '/') {
    pathname = '/chatbot.html';
  } else if (pathname === '/test') {
    pathname = '/test-template-rendering.html';
  }

  const filePath = path.join(__dirname, pathname);
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>500 Internal Server Error</h1>');
      }
    } else {
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(data);
    }
  });
});

server.listen(PORT, () => {
  console.log(`✅ 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
  console.log(`📱 메인 페이지: http://localhost:${PORT}/chatbot.html`);
  console.log(`🧪 템플릿 테스트: http://localhost:${PORT}/test`);
  console.log(`🏠 랜딩 페이지: http://localhost:${PORT}/landing.html`);
  console.log(`🔧 기존 예제: http://localhost:${PORT}/main.html`);
});