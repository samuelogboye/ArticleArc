#!/usr/bin/env node

const https = require('https');
const http = require('http');

const checkEndpoint = (url) => {
  return new Promise((resolve) => {
    const client = url.startsWith('https://') ? https : http;
    const startTime = Date.now();
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        resolve({
          url,
          status: res.statusCode,
          responseTime: `${responseTime}ms`,
          success: res.statusCode >= 200 && res.statusCode < 300,
          data: data ? JSON.parse(data) : null
        });
      });
    });
    
    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      resolve({
        url,
        status: 'ERROR',
        responseTime: `${responseTime}ms`,
        success: false,
        error: error.message
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        url,
        status: 'TIMEOUT',
        responseTime: '10000ms+',
        success: false,
        error: 'Request timeout'
      });
    });
  });
};

const runHealthCheck = async () => {
  console.log('🔍 ArticleArc API Health Check\n');
  
  const baseUrl = process.env.API_URL || 'https://articlearcapi.samuelogboye.com';
  
  const endpoints = [
    '/',
    '/api/v1/health',
    '/api/v1/swagger-spec',
    '/api-docs'
  ];
  
  console.log(`Testing base URL: ${baseUrl}\n`);
  
  for (const endpoint of endpoints) {
    const url = `${baseUrl}${endpoint}`;
    const result = await checkEndpoint(url);
    
    const statusIcon = result.success ? '✅' : '❌';
    console.log(`${statusIcon} ${endpoint}`);
    console.log(`   Status: ${result.status} | Time: ${result.responseTime}`);
    
    if (result.success && result.data) {
      console.log(`   Message: ${result.data.message || 'N/A'}`);
    } else if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log('');
  }
  
  console.log('💡 Troubleshooting tips:');
  console.log('   - Ensure server is running and accessible');
  console.log('   - Check firewall/security group settings');
  console.log('   - Verify environment variables are set');
  console.log('   - Check server logs for errors');
};

if (require.main === module) {
  runHealthCheck();
}

module.exports = { checkEndpoint, runHealthCheck };