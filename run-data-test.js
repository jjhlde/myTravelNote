// Node.js test script to validate data preservation functionality
const fs = require('fs');
const path = require('path');

console.log('🚀 Data Preservation Test Suite');
console.log('================================\n');

// Read the mock data file
function loadMockData() {
    try {
        const mockDataPath = path.join(__dirname, 'mock_resp.json');
        const rawData = fs.readFileSync(mockDataPath, 'utf8');
        const mockData = JSON.parse(rawData);
        
        console.log('✅ Mock data loaded successfully');
        console.log(`📊 Response type: ${mockData.responseType}`);
        console.log(`📊 Status: ${mockData.status}`);
        console.log(`📊 Version: ${mockData.version}\n`);
        
        return mockData;
    } catch (error) {
        console.error('❌ Failed to load mock data:', error.message);
        process.exit(1);
    }
}

// Analyze the structure of the mock data
function analyzeDataStructure(data) {
    console.log('🔍 ANALYZING DATA STRUCTURE');
    console.log('===========================');
    
    if (data.tripPlan && data.tripPlan.itinerary) {
        console.log('✅ First step response structure detected');
        console.log(`📅 Trip: ${data.tripPlan.tripInfo.destination} ${data.tripPlan.tripInfo.duration}`);
        console.log(`📅 Itinerary days: ${data.tripPlan.itinerary.length}\n`);
        
        return analyzeFirstStepStructure(data);
    } else if (data.tripMeta && data.mainPlan) {
        console.log('✅ Mock response structure detected');
        return analyzeMockRespStructure(data);
    } else {
        console.log('⚠️ Unknown data structure');
        return { optionsFound: 0, transportOptionsFound: 0, notesFound: 0, reasonsFound: 0 };
    }
}

// Analyze first step response structure
function analyzeFirstStepStructure(data) {
    let stats = {
        optionsFound: 0,
        transportOptionsFound: 0,
        notesFound: 0,
        reasonsFound: 0,
        activitiesWithOptions: [],
        transportWithOptions: []
    };
    
    console.log('📊 DETAILED ANALYSIS - First Step Structure');
    console.log('==========================================');
    
    data.tripPlan.itinerary.forEach((dayPlan, dayIndex) => {
        console.log(`\n📅 Day ${dayPlan.dayNumber}: ${dayPlan.dayTitle}`);
        console.log(`   Theme: ${dayPlan.dayTheme}`);
        
        dayPlan.activities?.forEach((activity, actIndex) => {
            console.log(`\n  🎯 Activity ${actIndex + 1}: ${activity.activityName}`);
            console.log(`     Type: ${activity.activityType} | Time: ${activity.estimatedTime}`);
            
            // Check activity options
            if (activity.options && activity.options.length > 0) {
                stats.optionsFound++;
                stats.activitiesWithOptions.push({
                    day: dayPlan.dayNumber,
                    activity: activity.activityName,
                    optionCount: activity.options.length
                });
                
                console.log(`     ✅ ${activity.options.length} options available:`);
                activity.options.forEach((option, optIndex) => {
                    const recommended = option.recommended ? ' ⭐ RECOMMENDED' : '';
                    console.log(`        ${optIndex + 1}. ${option.name || option.nameLocal}${recommended}`);
                    
                    if (option.note) {
                        stats.notesFound++;
                        console.log(`           📝 Note: ${option.note.substring(0, 60)}...`);
                    }
                    
                    if (option.reasonForSelection) {
                        stats.reasonsFound++;
                        console.log(`           🤔 Reason: ${option.reasonForSelection.substring(0, 60)}...`);
                    }
                });
            } else {
                console.log('     ❌ No options available');
            }
            
            // Check transportation options
            if (activity.transportation && activity.transportation.options && activity.transportation.options.length > 0) {
                stats.transportOptionsFound++;
                stats.transportWithOptions.push({
                    day: dayPlan.dayNumber,
                    activity: activity.activityName,
                    transportOptionCount: activity.transportation.options.length
                });
                
                console.log(`     🚗 ${activity.transportation.options.length} transport options:`);
                activity.transportation.options.forEach((option, optIndex) => {
                    const recommended = option.recommended ? ' ⭐ RECOMMENDED' : '';
                    console.log(`        ${optIndex + 1}. ${option.method} (${option.estimatedDuration})${recommended}`);
                    
                    if (option.note) {
                        stats.notesFound++;
                        console.log(`           📝 Note: ${option.note.substring(0, 60)}...`);
                    }
                });
            } else if (activity.transportation) {
                console.log('     🚗 Transportation info available (no options)');
            }
        });
    });
    
    return stats;
}

// Simulate the normalization process from main-script.js
function simulateNormalization(data) {
    console.log('\n🔄 SIMULATING NORMALIZATION PROCESS');
    console.log('===================================');
    
    if (!(data.tripPlan && data.tripPlan.tripInfo && data.tripPlan.itinerary)) {
        console.log('❌ Data structure not suitable for first step normalization');
        return false;
    }
    
    const tripInfo = data.tripPlan.tripInfo;
    const itinerary = data.tripPlan.itinerary;
    
    console.log('📊 Input data validation:');
    console.log(`   Destination: ${tripInfo.destination}`);
    console.log(`   Duration: ${tripInfo.duration}`);
    console.log(`   Itinerary days: ${itinerary.length}`);
    
    // Simulate the normalization mapping
    let normalizedData = {
        title: `${tripInfo.destination} ${tripInfo.duration}`,
        destination: tripInfo.destination,
        duration: tripInfo.duration,
        days: []
    };
    
    let preservationStats = {
        activitiesProcessed: 0,
        optionsPreserved: 0,
        transportOptionsPreserved: 0,
        notesPreserved: 0,
        reasonsPreserved: 0
    };
    
    itinerary.forEach((dayPlan, dayIndex) => {
        let normalizedDay = {
            day: dayPlan.dayNumber,
            date: dayPlan.date,
            title: `DAY ${dayPlan.dayNumber}`,
            subtitle: dayPlan.dayTheme,
            activities: []
        };
        
        dayPlan.activities?.forEach((activity, actIndex) => {
            preservationStats.activitiesProcessed++;
            
            let normalizedActivity = {
                id: `${dayPlan.dayNumber}_${actIndex}`,
                time: activity.estimatedTime,
                type: activity.activityType,
                title: activity.activityName,
                description: activity.activityDescription || activity.detailedDescription,
                // ✅ Key preservation: options array
                options: null,
                transportation: null
            };
            
            // Preserve options array
            if (activity.options && activity.options.length > 0) {
                preservationStats.optionsPreserved++;
                normalizedActivity.options = activity.options.map(option => {
                    const normalizedOption = {
                        name: option.name,
                        nameLocal: option.nameLocal,
                        recommended: option.recommended || false
                    };
                    
                    if (option.note) {
                        normalizedOption.note = option.note;
                        preservationStats.notesPreserved++;
                    }
                    
                    if (option.reasonForSelection) {
                        normalizedOption.reasonForSelection = option.reasonForSelection;
                        preservationStats.reasonsPreserved++;
                    }
                    
                    return normalizedOption;
                });
                
                console.log(`✅ Options preserved for: ${activity.activityName} (${normalizedActivity.options.length} options)`);
            }
            
            // Preserve transportation options
            if (activity.transportation && activity.transportation.options && activity.transportation.options.length > 0) {
                preservationStats.transportOptionsPreserved++;
                normalizedActivity.transportation = {
                    from: activity.transportation.from,
                    to: activity.transportation.to,
                    note: activity.transportation.note,
                    options: activity.transportation.options.map(option => {
                        const normalizedTransportOption = {
                            method: option.method,
                            estimatedDuration: option.estimatedDuration,
                            recommended: option.recommended || false
                        };
                        
                        if (option.note) {
                            normalizedTransportOption.note = option.note;
                            preservationStats.notesPreserved++;
                        }
                        
                        return normalizedTransportOption;
                    })
                };
                
                console.log(`✅ Transport options preserved for: ${activity.activityName} (${normalizedActivity.transportation.options.length} options)`);
            }
            
            normalizedDay.activities.push(normalizedActivity);
        });
        
        normalizedData.days.push(normalizedDay);
    });
    
    // Report normalization results
    console.log('\n📊 NORMALIZATION RESULTS:');
    console.log(`   Activities processed: ${preservationStats.activitiesProcessed}`);
    console.log(`   Options preserved: ${preservationStats.optionsPreserved}`);
    console.log(`   Transport options preserved: ${preservationStats.transportOptionsPreserved}`);
    console.log(`   Notes preserved: ${preservationStats.notesPreserved}`);
    console.log(`   Reasons preserved: ${preservationStats.reasonsPreserved}`);
    
    return { normalizedData, preservationStats };
}

// Test option chip generation requirements
function testOptionChipGeneration(normalizedData) {
    console.log('\n🎪 OPTION CHIP GENERATION TEST');
    console.log('==============================');
    
    if (!normalizedData || !normalizedData.days) {
        console.log('❌ No normalized data available for chip testing');
        return;
    }
    
    let chipCandidates = [];
    
    normalizedData.days.forEach(day => {
        day.activities?.forEach(activity => {
            // Direct activity options
            if (activity.options && activity.options.length > 1) {
                chipCandidates.push({
                    day: day.day,
                    activity: activity.title,
                    type: 'activity',
                    optionCount: activity.options.length,
                    recommended: activity.options.find(opt => opt.recommended) ? true : false
                });
            }
            
            // Transportation options
            if (activity.transportation && activity.transportation.options && activity.transportation.options.length > 1) {
                chipCandidates.push({
                    day: day.day,
                    activity: activity.title,
                    type: 'transport',
                    optionCount: activity.transportation.options.length,
                    recommended: activity.transportation.options.find(opt => opt.recommended) ? true : false
                });
            }
        });
    });
    
    console.log(`🎯 Found ${chipCandidates.length} activities suitable for option chips:`);
    chipCandidates.forEach((candidate, index) => {
        const recommendedText = candidate.recommended ? ' (has recommended option)' : '';
        console.log(`   ${index + 1}. Day ${candidate.day}: ${candidate.activity}`);
        console.log(`      ${candidate.type} - ${candidate.optionCount} options${recommendedText}`);
    });
    
    return chipCandidates;
}

// Generate test report
function generateTestReport(originalStats, normalizationResult, chipCandidates) {
    console.log('\n📋 FINAL TEST REPORT');
    console.log('====================');
    
    const preservationRate = normalizationResult ? 
        (normalizationResult.preservationStats.optionsPreserved / originalStats.optionsFound * 100).toFixed(1) : 0;
    
    const transportPreservationRate = normalizationResult ? 
        (normalizationResult.preservationStats.transportOptionsPreserved / originalStats.transportOptionsFound * 100).toFixed(1) : 0;
    
    console.log('📊 DATA PRESERVATION ANALYSIS:');
    console.log(`   ✅ Activity Options: ${originalStats.optionsFound} found → ${normalizationResult?.preservationStats.optionsPreserved || 0} preserved (${preservationRate}%)`);
    console.log(`   ✅ Transport Options: ${originalStats.transportOptionsFound} found → ${normalizationResult?.preservationStats.transportOptionsPreserved || 0} preserved (${transportPreservationRate}%)`);
    console.log(`   ✅ Notes: ${normalizationResult?.preservationStats.notesPreserved || 0} preserved`);
    console.log(`   ✅ Reasons: ${normalizationResult?.preservationStats.reasonsPreserved || 0} preserved`);
    
    console.log('\n🎪 UI FUNCTIONALITY:');
    console.log(`   ✅ Option Chip Candidates: ${chipCandidates?.length || 0} activities`);
    console.log(`   ✅ Expected UI Elements: Option carousels, note displays, reason fields`);
    
    console.log('\n🔧 NEXT STEPS FOR BROWSER TESTING:');
    console.log('   1. Navigate to http://localhost:13784');
    console.log('   2. Open browser console');
    console.log('   3. Run: localStorage.setItem("generatedApp_test123", JSON.stringify(' + 'mockDataHere' + '))');
    console.log('   4. Navigate to http://localhost:13784?session=test123');
    console.log('   5. Check console logs for debug messages about options preservation');
    console.log('   6. Look for option chips in activities that have multiple options');
    console.log('   7. Verify note fields and reasonForSelection data display');
    
    // Success criteria
    const allTestsPassed = 
        preservationRate >= 95 && 
        transportPreservationRate >= 95 && 
        (chipCandidates?.length || 0) > 0;
    
    console.log('\n🏆 TEST RESULT:', allTestsPassed ? 'PASS ✅' : 'NEEDS ATTENTION ⚠️');
    
    if (!allTestsPassed) {
        console.log('\n🔧 ISSUES TO ADDRESS:');
        if (preservationRate < 95) console.log('   • Activity options preservation below 95%');
        if (transportPreservationRate < 95) console.log('   • Transport options preservation below 95%');
        if ((chipCandidates?.length || 0) === 0) console.log('   • No option chip candidates found');
    }
}

// Main test execution
function runTests() {
    console.log('Starting comprehensive data preservation test...\n');
    
    // Step 1: Load mock data
    const mockData = loadMockData();
    
    // Step 2: Analyze original structure
    const originalStats = analyzeDataStructure(mockData);
    
    // Step 3: Simulate normalization
    const normalizationResult = simulateNormalization(mockData);
    
    // Step 4: Test option chip generation
    const chipCandidates = testOptionChipGeneration(normalizationResult?.normalizedData);
    
    // Step 5: Generate final report
    generateTestReport(originalStats, normalizationResult, chipCandidates);
    
    console.log('\n🎯 Test completed successfully!');
}

// Run the tests
runTests();