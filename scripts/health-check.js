#!/usr/bin/env node

const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3000,
  path: '/',
  method: 'GET',
  timeout: 10000
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.setTimeout(10000);
req.end();