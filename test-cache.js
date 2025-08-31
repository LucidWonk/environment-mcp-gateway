const fs = require('fs');
const path = require('path');
const cacheDir = '.semantic-cache';

const testData = {
  analysisResult: {
    filePath: '/test/path',
    language: 'C#',
    businessConcepts: [],
    businessRules: [],
    domainAnalysis: {
      primaryDomain: 'Test',
      confidence: 0.8,
      crossDomainDependencies: []
    },
    changeAnalysis: {
      changeType: 'modified',
      impactLevel: 'medium',
      affectedComponents: []
    }
  },
  timestamp: new Date().toISOString(),
  version: '1.0'
};

try {
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  
  const filename = path.join(cacheDir, 'test-cache-write.json');
  fs.writeFileSync(filename, JSON.stringify(testData, null, 2));
  console.log('Test cache file written to:', filename);
  console.log('File exists:', fs.existsSync(filename));
  
  // List cache directory contents
  const files = fs.readdirSync(cacheDir);
  console.log('Cache directory contents:', files);
} catch (error) {
  console.error('Error writing cache:', error);
}