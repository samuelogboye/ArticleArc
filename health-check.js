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
        let parsedData = null;
        
        // Only try to parse as JSON if the content-type suggests it's JSON
        const contentType = res.headers['content-type'] || '';
        if (contentType.includes('application/json') && data.trim()) {
          try {
            parsedData = JSON.parse(data);
          } catch (parseError) {
            // If JSON parsing fails, just store the raw data
            parsedData = { raw: data.substring(0, 100) + (data.length > 100 ? '...' : '') };
          }
        } else if (data.trim()) {
          // For non-JSON responses, store a preview of the content
          parsedData = { 
            contentType: contentType,
            preview: data.substring(0, 100) + (data.length > 100 ? '...' : ''),
            size: data.length
          };
        }
        
        resolve({
          url,
          status: res.statusCode,
          responseTime: `${responseTime}ms`,
          success: res.statusCode >= 200 && res.statusCode < 300,
          data: parsedData,
          contentType: contentType
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
    '/api-docs/'
  ];
  
  console.log(`Testing base URL: ${baseUrl}\n`);
  
  for (const endpoint of endpoints) {
    const url = `${baseUrl}${endpoint}`;
    const result = await checkEndpoint(url);
    
    const statusIcon = result.success ? '✅' : '❌';
    console.log(`${statusIcon} ${endpoint}`);
    console.log(`  Status: ${result.status} | Time: ${result.responseTime}`);
    
    if (result.contentType) {
      console.log(`  Content-Type: ${result.contentType}`);
    }
    
    if (result.success && result.data) {
      if (result.data.message) {
        console.log(`  Message: ${result.data.message}`);
      } else if (result.data.preview) {
        console.log(`  Content Preview: ${result.data.preview}`);
        console.log(`  Size: ${result.data.size} bytes`);
      }
    } else if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
    
    console.log('');
  }
  
  // Special check for Swagger spec paths
  console.log('🔍 Checking Swagger specification...');
  try {
    const swaggerResult = await checkEndpoint(`${baseUrl}/api/v1/swagger-spec`);
    if (swaggerResult.success && swaggerResult.data) {
      if (swaggerResult.data.paths && Object.keys(swaggerResult.data.paths).length > 0) {
        console.log(`✅ Swagger spec contains ${Object.keys(swaggerResult.data.paths).length} API paths`);
        console.log('🎉 This should fix the Swagger UI routes display!\n');
      } else {
        console.log('❌ Swagger spec has no paths - this explains the empty Swagger UI\n');
      }
    }
  } catch (error) {
    console.log('⚠️  Could not check Swagger spec details\n');
  }
  
  console.log('💡 Troubleshooting tips:');
  console.log('  - Ensure server is running and accessible');
  console.log('  - Check firewall/security group settings');
  console.log('  - Verify environment variables are set');
  console.log('  - Check server logs for errors');
  console.log('  - After deployment, test: curl https://articlearcapi.samuelogboye.com/api/v1/swagger-spec');
};

if (require.main === module) {
  runHealthCheck();
}

module.exports = { checkEndpoint, runHealthCheck };