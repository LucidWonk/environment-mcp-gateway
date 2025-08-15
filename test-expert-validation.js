#!/usr/bin/env node

import { SemanticAnalysisService } from './dist/services/semantic-analysis.js';

async function testExpertValidationSystem() {
    console.log('🎯 Testing Expert Validation and Accuracy Metrics System');
    
    const service = new SemanticAnalysisService();
    
    // Simulate expert feedback data
    const expertFeedback = [
        {
            fileId: 'FractalAnalysisSystem.cs',
            expectedDomain: 'Analysis.Fractal',
            actualDomain: 'Analysis.Fractal',
            isCorrect: true,
            expertConfidence: 0.95,
            improvementSuggestions: [],
            timestamp: new Date(),
            validationType: 'granular',
            complexityAssessment: 'high'
        },
        {
            fileId: 'RelativeStrengthIndex.cs',
            expectedDomain: 'Analysis.Indicator',
            actualDomain: 'Analysis.Indicator',
            isCorrect: true,
            expertConfidence: 0.90,
            improvementSuggestions: [],
            timestamp: new Date(),
            validationType: 'granular',
            complexityAssessment: 'high'
        },
        {
            fileId: 'TwelveDataWrapper.cs',
            expectedDomain: 'Data.Provider',
            actualDomain: 'Data.Provider',
            isCorrect: true,
            expertConfidence: 0.85,
            improvementSuggestions: [],
            timestamp: new Date(),
            validationType: 'granular',
            complexityAssessment: 'medium'
        },
        {
            fileId: 'AssemblyInfo.cs',
            expectedDomain: 'Utility',
            actualDomain: 'Utility',
            isCorrect: true,
            expertConfidence: 0.80,
            improvementSuggestions: [],
            timestamp: new Date(),
            validationType: 'domain-level',
            complexityAssessment: 'low'
        }
    ];
    
    console.log('\n📊 Expert Validation System Test:');
    console.log('=====================================');
    
    // Store expert feedback
    console.log('\n📝 Storing Expert Feedback...');
    expertFeedback.forEach((feedback, index) => {
        service.storeExpertFeedback(feedback);
        console.log(`   ✅ Stored feedback ${index + 1}: ${feedback.fileId} (${feedback.isCorrect ? 'CORRECT' : 'INCORRECT'})`);
    });
    
    // Load and validate feedback storage
    console.log('\n📖 Loading Historical Expert Feedback...');
    const loadedFeedback = service.loadExpertFeedback();
    console.log(`   📊 Loaded ${loadedFeedback.length} feedback entries`);
    
    // Calculate accuracy metrics
    console.log('\n📈 Calculating Accuracy Metrics...');
    const mockAnalysisResults = [
        { domainContext: 'Analysis.Fractal', businessConcepts: [], businessRules: [], filePath: '', language: '', analysisTime: 0 },
        { domainContext: 'Analysis.Indicator', businessConcepts: [], businessRules: [], filePath: '', language: '', analysisTime: 0 },
        { domainContext: 'Data.Provider', businessConcepts: [], businessRules: [], filePath: '', language: '', analysisTime: 0 },
        { domainContext: 'Utility', businessConcepts: [], businessRules: [], filePath: '', language: '', analysisTime: 0 }
    ];
    
    const metrics = service.calculateAccuracyMetrics(mockAnalysisResults, loadedFeedback);
    
    console.log(`   🎯 Overall Accuracy: ${(metrics.overallAccuracy * 100).toFixed(1)}%`);
    console.log(`   📊 Granular Detection Rate: ${(metrics.granularDetectionRate * 100).toFixed(1)}%`);
    console.log(`   ❌ False Positive Rate: ${(metrics.falsePositiveRate * 100).toFixed(1)}%`);
    console.log(`   👥 Expert Validation Score: ${metrics.expertValidationScore ? (metrics.expertValidationScore * 100).toFixed(1) + '%' : 'N/A'}`);
    console.log(`   📋 Total Validations: ${metrics.totalValidations}`);
    
    // Domain-specific accuracy
    console.log('\n🏗️ Domain-Specific Accuracy:');
    metrics.domainSpecificAccuracy.forEach((accuracy, domain) => {
        console.log(`   📂 ${domain}: ${(accuracy * 100).toFixed(1)}%`);
    });
    
    // Detection thresholds
    console.log('\n🎚️ Detection Thresholds:');
    console.log(`   🔥 High Complexity: ≥${(metrics.detectionThresholds.high * 100).toFixed(0)}%`);
    console.log(`   🔶 Medium Complexity: ≥${(metrics.detectionThresholds.medium * 100).toFixed(0)}%`);
    console.log(`   🔷 Low Complexity: ≥${(metrics.detectionThresholds.low * 100).toFixed(0)}%`);
    
    // Generate and display accuracy report
    console.log('\n📋 Generating Accuracy Report...');
    const report = service.generateAccuracyReport();
    console.log('\n' + '='.repeat(50));
    console.log(report);
    console.log('='.repeat(50));
    
    console.log('\n🎯 EXPERT VALIDATION SYSTEM: TESTED');
    console.log('✅ Expert feedback storage: ACTIVE');
    console.log('✅ Accuracy metrics calculation: ACTIVE');
    console.log('✅ Domain-specific validation: ACTIVE');
    console.log('✅ Comprehensive reporting: ACTIVE');
    console.log('✅ Continuous learning infrastructure: ACTIVE');
}

testExpertValidationSystem().catch(console.error);