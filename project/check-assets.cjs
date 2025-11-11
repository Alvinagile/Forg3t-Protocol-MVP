const http = require('http');

// Check JS asset
const jsOptions = {
  hostname: 'localhost',
  port: 4175,
  path: '/assets/index-CyRZZnlt.js',
  method: 'GET'
};

const jsReq = http.request(jsOptions, res => {
  console.log(`JS Asset Status Code: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('JS Asset size:', data.length, 'characters');
  });
});

jsReq.on('error', error => {
  console.error('JS Asset Error:', error);
});

jsReq.end();

// Check CSS asset
const cssOptions = {
  hostname: 'localhost',
  port: 4175,
  path: '/assets/index-Cdewyqly.css',
  method: 'GET'
};

const cssReq = http.request(cssOptions, res => {
  console.log(`CSS Asset Status Code: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('CSS Asset size:', data.length, 'characters');
  });
});

cssReq.on('error', error => {
  console.error('CSS Asset Error:', error);
});

cssReq.end();