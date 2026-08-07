const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawn } = require('child_process');

const PORT = 5180;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  let url = req.url;
  const cleanUrl = url.split('?')[0];

  // Server-side Centralized Config APIs
  if (cleanUrl === '/api/config' && req.method === 'GET') {
    const configPath = path.join(__dirname, 'config.json');
    fs.readFile(configPath, 'utf8', (err, data) => {
      res.writeHead(200, { 
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      });
      if (err) {
        // Return default configuration
        res.end(JSON.stringify({
          apiUrl: 'https://script.google.com/macros/s/AKfycbzVgQlnwieHYH-tiZTlsT9GRAvEyTq7sPUa945XeTeMBKIavl-ksSW0gcgkDSjOmkrJ/exec',
          geminiApiKey: '',
          googleSheetId: ''
        }));
      } else {
        res.end(data);
      }
    });
    return;
  }

  if (cleanUrl === '/api/save-config' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const configData = JSON.parse(body);
        const configPath = path.join(__dirname, 'config.json');
        fs.writeFile(configPath, JSON.stringify(configData, null, 2), 'utf8', err => {
          res.writeHead(err ? 500 : 200, { 
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
          });
          if (err) {
            res.end(JSON.stringify({ success: false, error: 'Failed to write config file' }));
          } else {
            console.log('[CONFIG] Nueva configuración guardada en el servidor.');
            res.end(JSON.stringify({ success: true }));
          }
        });
      } catch (e) {
        res.writeHead(400, { 
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Folder redirects for trailing slash consistency
  if (cleanUrl === '/pagina-web') {
    res.writeHead(301, { 'Location': '/pagina-web/' });
    res.end();
    return;
  }
  if (cleanUrl === '/aplicativo') {
    res.writeHead(301, { 'Location': '/aplicativo/' });
    res.end();
    return;
  }
  if (cleanUrl === '/' || cleanUrl === '') {
    res.writeHead(301, { 'Location': '/aplicativo/' });
    res.end();
    return;
  }

  let filePath = '';
  if (cleanUrl.startsWith('/pagina-web/')) {
    const relativePart = cleanUrl.substring('/pagina-web/'.length) || 'index.html';
    filePath = path.join(__dirname, 'pagina-web', relativePart);
  } else if (cleanUrl.startsWith('/aplicativo/')) {
    const relativePart = cleanUrl.substring('/aplicativo/'.length) || 'index.html';
    filePath = path.join(__dirname, 'aplicativo', relativePart);
  } else {
    filePath = path.join(__dirname, 'pagina-web', cleanUrl);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, 'aplicativo', cleanUrl);
    }
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } else {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
});

server.on('error', (err) => {
  console.error('\n======================================================');
  console.error('❌ ERROR AL INICIAR EL SERVIDOR');
  console.error('======================================================');
  if (err.code === 'EADDRINUSE') {
    console.error(`El puerto ${PORT} ya está siendo utilizado por otra aplicación.`);
    console.error(`Por favor, cierra el proceso o terminal que usa el puerto ${PORT} y vuelve a intentarlo.`);
  } else {
    console.error('Ocurrió un error inesperado al levantar el servidor:');
    console.error(err);
  }
  console.error('======================================================\n');
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n======================================================');
  console.log('🗳️  Servidor de Conteo de Votos (Puerto ' + PORT + ')');
  console.log('======================================================\n');
  console.log(`💻 En esta PC (Localhost):`);
  console.log(`   📱 Aplicativo Móvil: http://localhost:${PORT}/aplicativo/\n`);
  console.log(`🌐 En la Red Local (Wi-Fi/LAN):`);
  console.log(`   📱 Aplicativo Móvil: http://0.0.0.0:${PORT}/aplicativo/\n`);
  console.log('======================================================\n');
});
