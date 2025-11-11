const http = require('http');

// Test the main page
const mainOptions = {
  hostname: 'localhost',
  port: 4174,
  path: '/',
  method: 'GET'
};

const mainReq = http.request(mainOptions, res => {
  console.log(`Main Page Status Code: ${res.statusCode}`);
  console.log(`Content-Type: ${res.headers['content-type']}`);
  console.log(`Content-Length: ${res.headers['content-length']}`);
  
  let data = '';
  res.on('data', chunk => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n=== HTML HEAD ===');
    const headEndIndex = data.indexOf('</head>');
    if (headEndIndex > 0) {
      console.log(data.substring(0, headEndIndex + 7));
    }
    
    console.log('\n=== CHECKING FOR ROOT ELEMENT ===');
    if (data.includes('id="root"')) {
      console.log('✓ Root element found in HTML');
    } else {
      console.log('✗ Root element NOT found in HTML');
    }
    
    console.log('\n=== CHECKING FOR SCRIPT TAGS ===');
    const scriptMatches = data.match(/<script[^>]*src=["'][^"']*["'][^>]*>/g);
    if (scriptMatches) {
      console.log(`Found ${scriptMatches.length} script tags:`);
      scriptMatches.forEach((script, i) => {
        console.log(`  ${i + 1}. ${script}`);
      });
    } else {
      console.log('No script tags with src found');
    }
    
    console.log('\n=== CHECKING FOR TITLE ===');
    const titleMatch = data.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) {
      console.log(`Title: ${titleMatch[1]}`);
    } else {
      console.log('No title found');
    }
  });
});

mainReq.on('error', error => {
  console.error('Main Page Error:', error);
});

mainReq.end();