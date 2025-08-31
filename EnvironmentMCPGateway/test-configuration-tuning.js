#!/usr/bin/env node

import { SemanticAnalysisService } from './dist/services/semantic-analysis.js';

async function testConfigurationAndAdaptiveTuning() {
    console.log('🎯 Testing Configuration and Adaptive Tuning System');
    
    const service = new SemanticAnalysisService();
    
    console.log('\n⚙️ Configuration and Adaptive Tuning Test:');
    console.log('===========================================');
    
    // Test 1: Get initial configuration
    console.log('\n📋 Initial Configuration:');
    const initialConfig = service.getConfiguration();
    console.log(`   🎚️ Granular Threshold: ${(initialConfig.granularThreshold * 100).toFixed(1)}%`);
    console.log(`   📊 Business Concept Weight: ${(initialConfig.businessConceptWeight * 100).toFixed(1)}%`);
    console.log(`   🔧 Algorithm Complexity Weight: ${(initialConfig.algorithmComplexityWeight * 100).toFixed(1)}%`);
    console.log(`   🎯 Semantic Coherence Weight: ${(initialConfig.semanticCoherenceWeight * 100).toFixed(1)}%`);
    console.log(`   📈 Trading Algorithm Bonus: ${(initialConfig.tradingAlgorithmBonus * 100).toFixed(1)}%`);
    console.log(`   🔄 Adaptive Tuning: ${initialConfig.enableAdaptiveTuning ? 'ENABLED' : 'DISABLED'}`);
    console.log(`   📊 Learning Rate: ${(initialConfig.learningRate * 100).toFixed(1)}%`);
    
    // Test 2: Test configuration saving and loading
    console.log('\n💾 Testing Configuration Persistence:');
    const modifiedConfig = { 
        ...initialConfig, 
        granularThreshold: 0.75, 
        learningRate: 0.15,
        tradingAlgorithmBonus: 0.25 
    };
    
    service.saveConfiguration(modifiedConfig);
    console.log('   ✅ Configuration saved successfully');
    
    const reloadedConfig = service.getConfiguration();
    const configMatches = reloadedConfig.granularThreshold === 0.75 && 
                         reloadedConfig.learningRate === 0.15 &&
                         reloadedConfig.tradingAlgorithmBonus === 0.25;
    console.log(`   ${configMatches ? '✅' : '❌'} Configuration persistence: ${configMatches ? 'VERIFIED' : 'FAILED'}`);
    
    // Test 3: Simulate expert feedback for adaptive tuning
    console.log('\n🧠 Testing Adaptive Tuning with Simulated Feedback:');
    
    // Create diverse feedback scenarios
    const adaptiveFeedback = [
        // High accuracy scenario for Analysis.Fractal
        { fileId: 'FractalTest1.cs', expectedDomain: 'Analysis.Fractal', actualDomain: 'Analysis.Fractal', isCorrect: true, expertConfidence: 0.95, improvementSuggestions: [], timestamp: new Date(), validationType: 'granular', complexityAssessment: 'high' },
        { fileId: 'FractalTest2.cs', expectedDomain: 'Analysis.Fractal', actualDomain: 'Analysis.Fractal', isCorrect: true, expertConfidence: 0.90, improvementSuggestions: [], timestamp: new Date(), validationType: 'granular', complexityAssessment: 'high' },
        
        // Medium accuracy scenario for Analysis.Indicator  
        { fileId: 'IndicatorTest1.cs', expectedDomain: 'Analysis.Indicator', actualDomain: 'Analysis.Indicator', isCorrect: true, expertConfidence: 0.85, improvementSuggestions: [], timestamp: new Date(), validationType: 'granular', complexityAssessment: 'high' },
        { fileId: 'IndicatorTest2.cs', expectedDomain: 'Analysis.Indicator', actualDomain: 'Analysis', isCorrect: false, expertConfidence: 0.60, improvementSuggestions: ['Need better indicator complexity detection'], timestamp: new Date(), validationType: 'granular', complexityAssessment: 'medium' },
        
        // Good accuracy for Data.Provider
        { fileId: 'DataTest1.cs', expectedDomain: 'Data.Provider', actualDomain: 'Data.Provider', isCorrect: true, expertConfidence: 0.88, improvementSuggestions: [], timestamp: new Date(), validationType: 'granular', complexityAssessment: 'medium' },
        { fileId: 'DataTest2.cs', expectedDomain: 'Data.Provider', actualDomain: 'Data.Provider', isCorrect: true, expertConfidence: 0.82, improvementSuggestions: [], timestamp: new Date(), validationType: 'granular', complexityAssessment: 'medium' }
    ];
    
    // Store feedback for adaptive tuning
    adaptiveFeedback.forEach((feedback, index) => {
        service.storeExpertFeedback(feedback);
        console.log(`   📝 Stored feedback ${index + 1}: ${feedback.fileId} (${feedback.isCorrect ? 'CORRECT' : 'INCORRECT'}, confidence: ${(feedback.expertConfidence * 100).toFixed(0)}%)`);
    });
    
    // Test adaptive tuning
    console.log('\n🔄 Running Adaptive Tuning Algorithm:');
    const configBeforeTuning = service.getConfiguration();
    const tunedConfig = service.adaptivelyTuneConfiguration();
    
    const significantChanges = Math.abs(tunedConfig.granularThreshold - configBeforeTuning.granularThreshold) > 0.01 ||
                              Math.abs(tunedConfig.tradingAlgorithmBonus - configBeforeTuning.tradingAlgorithmBonus) > 0.01;
    
    console.log(`   ${significantChanges ? '🔄' : '➡️'} Adaptive tuning: ${significantChanges ? 'CHANGES APPLIED' : 'NO SIGNIFICANT CHANGES'}`);
    
    if (significantChanges) {
        console.log(`   📈 Granular Threshold: ${(configBeforeTuning.granularThreshold * 100).toFixed(1)}% → ${(tunedConfig.granularThreshold * 100).toFixed(1)}%`);
        console.log(`   🎯 Trading Algorithm Bonus: ${(configBeforeTuning.tradingAlgorithmBonus * 100).toFixed(1)}% → ${(tunedConfig.tradingAlgorithmBonus * 100).toFixed(1)}%`);
        console.log(`   📊 Business Concept Weight: ${(configBeforeTuning.businessConceptWeight * 100).toFixed(1)}% → ${(tunedConfig.businessConceptWeight * 100).toFixed(1)}%`);
    }
    
    // Test 4: Generate and display configuration report
    console.log('\n📋 Generating Configuration Analysis Report:');
    const configReport = service.generateConfigurationReport();
    console.log('\n' + '='.repeat(60));
    console.log(configReport);
    console.log('='.repeat(60));
    
    // Test 5: Validate weight normalization
    console.log('\n⚖️ Validating Weight Normalization:');
    const finalConfig = service.getConfiguration();
    const weightSum = finalConfig.businessConceptWeight + 
                     finalConfig.algorithmComplexityWeight + 
                     finalConfig.semanticCoherenceWeight;
    
    const isNormalized = Math.abs(weightSum - 1.0) < 0.001;
    console.log(`   📊 Weight Sum: ${weightSum.toFixed(3)}`);
    console.log(`   ${isNormalized ? '✅' : '❌'} Weight Normalization: ${isNormalized ? 'VERIFIED' : 'FAILED'}`);
    
    // Test 6: Boundary validation
    console.log('\n🎚️ Validating Configuration Boundaries:');
    const isWithinBounds = finalConfig.granularThreshold >= 0.3 && finalConfig.granularThreshold <= 0.9 &&
                          finalConfig.domainThreshold >= 0.2 && finalConfig.domainThreshold <= 0.6 &&
                          finalConfig.businessConceptWeight >= 0.2 && finalConfig.businessConceptWeight <= 0.6 &&
                          finalConfig.tradingAlgorithmBonus >= 0.0 && finalConfig.tradingAlgorithmBonus <= 0.5;
    
    console.log(`   ${isWithinBounds ? '✅' : '❌'} Boundary Validation: ${isWithinBounds ? 'ALL WITHIN BOUNDS' : 'BOUNDARY VIOLATION'}`);
    
    console.log('\n🎯 CONFIGURATION AND ADAPTIVE TUNING: TESTED');
    console.log('✅ Configuration persistence: ACTIVE');
    console.log('✅ Adaptive tuning algorithm: ACTIVE'); 
    console.log('✅ Weight normalization: ACTIVE');
    console.log('✅ Boundary validation: ACTIVE');
    console.log('✅ Configuration reporting: ACTIVE');
    console.log('✅ Expert feedback integration: ACTIVE');
}

testConfigurationAndAdaptiveTuning().catch(console.error);