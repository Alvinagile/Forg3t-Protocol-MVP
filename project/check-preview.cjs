const http = require('http');

const options = {
  hostname: 'localhost',
  port: 4175,
  path: '/',
  method: 'GET'
};

const req = http.request(options, res => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', chunk => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response headers:', res.headers);
    console.log('First 500 characters of response:');
    console.log(data.substring(0, 500));
  });
});

req.on('error', error => {
  console.error('Error:', error);
});

req.end();