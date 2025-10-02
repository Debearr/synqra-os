const http = require('http');

const port = Number(process.env.PORT || 8080);

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', message: 'Hello from Node' }));
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on ${port}`);
});
