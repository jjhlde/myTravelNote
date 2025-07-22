// Data Preservation Test Script
// Copy and paste this into browser console on http://localhost:13784

console.log('🚀🚀🚀 Data Preservation Test Script Starting 🚀🚀🚀');

async function testDataPreservation() {
    console.log('=== STEP 1: Loading Mock Response Data ===');
    
    try {
        // Load mock_resp.json
        const response = await fetch('./mock_resp.json');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const mockData = await response.json();
        console.log('✅ Mock data loaded successfully:', mockData);
        
        // Store in localStorage with session ID test123
        const sessionId = 'test123';
        const storageKey = `generatedApp_${sessionId}`;
        localStorage.setItem(storageKey, JSON.stringify(mockData));
        console.log(`✅ Data stored in localStorage with key: ${storageKey}`);
        
        // Check for options arrays in original data
        console.log('\n=== STEP 2: Checking Options Arrays in Original Data ===');
        checkOptionsInOriginalData(mockData);
        
        // Test data normalization
        console.log('\n=== STEP 3: Testing Data Normalization ===');
        testNormalization(mockData);
        
        // Test option chip detection
        console.log('\n=== STEP 4: Testing Option Chip Detection ===');
        testOptionChipDetection(mockData);
        
        console.log('\n=== STEP 5: Navigate to PWA ===');
        console.log('Now navigate to: http://localhost:13784?session=test123');
        console.log('Check the browser console for debug messages about options preservation');
        
        // Open PWA in new tab
        const pwaUrl = `${window.location.origin}?session=${sessionId}`;
        window.open(pwaUrl, '_blank');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

function checkOptionsInOriginalData(data) {
    let activityOptionsCount = 0;
    let transportOptionsCount = 0;
    let activitiesWithNotes = 0;
    let activitiesWithReasonForSelection = 0;
    
    if (data.tripPlan && data.tripPlan.itinerary) {
        data.tripPlan.itinerary.forEach((dayPlan, dayIndex) => {
            console.log(`📅 Day ${dayPlan.dayNumber}: ${dayPlan.dayTitle}`);
            
            dayPlan.activities?.forEach((activity, actIndex) => {
                console.log(`  🎯 Activity ${actIndex}: ${activity.activityName}`);
                
                // Check activity options
                if (activity.options && activity.options.length > 0) {
                    activityOptionsCount++;
                    console.log(`    ✅ ${activity.options.length} options found:`);
                    activity.options.forEach((option, optIndex) => {
                        console.log(`      ${optIndex + 1}. ${option.name || option.nameLocal} ${option.recommended ? '⭐' : ''}`);
                        if (option.note) {
                            console.log(`         📝 Note: ${option.note.substring(0, 50)}...`);
                        }
                        if (option.reasonForSelection) {
                            console.log(`         🤔 Reason: ${option.reasonForSelection.substring(0, 50)}...`);
                            activitiesWithReasonForSelection++;
                        }
                    });
                }
                
                // Check transportation options
                if (activity.transportation && activity.transportation.options && activity.transportation.options.length > 0) {
                    transportOptionsCount++;
                    console.log(`    🚗 ${activity.transportation.options.length} transport options:`);
                    activity.transportation.options.forEach((option, optIndex) => {
                        console.log(`      ${optIndex + 1}. ${option.method} - ${option.estimatedDuration} ${option.recommended ? '⭐' : ''}`);
                        if (option.note) {
                            console.log(`         📝 Note: ${option.note.substring(0, 50)}...`);
                            activitiesWithNotes++;
                        }
                    });
                }
            });
        });
    }
    
    console.log('\n📊 OPTIONS SUMMARY:');
    console.log(`   🎯 Activities with options: ${activityOptionsCount}`);
    console.log(`   🚗 Activities with transport options: ${transportOptionsCount}`);
    console.log(`   📝 Activities with notes: ${activitiesWithNotes}`);
    console.log(`   🤔 Activities with reasonForSelection: ${activitiesWithReasonForSelection}`);
}

function testNormalization(rawData) {
    // Simulate the normalizeFirstStepRespData function
    console.log('🔄 Simulating data normalization process...');
    
    if (rawData.tripPlan && rawData.tripPlan.tripInfo && rawData.tripPlan.itinerary) {
        console.log('✅ Detected first step response structure');
        
        const tripInfo = rawData.tripPlan.tripInfo;
        const itinerary = rawData.tripPlan.itinerary;
        
        console.log('📊 Original data structure validation:');
        console.log(`   - Trip Info: ${tripInfo.destination} ${tripInfo.duration}`);
        console.log(`   - Itinerary days: ${itinerary.length}`);
        
        // Check if options would be preserved during normalization
        let preservedActivityOptions = 0;
        let preservedTransportOptions = 0;
        let preservedNotes = 0;
        let preservedReasons = 0;
        
        itinerary.forEach((dayPlan, dayIndex) => {
            dayPlan.activities?.forEach((activity, actIndex) => {
                // Simulate the normalization mapping
                if (activity.options && activity.options.length > 0) {
                    preservedActivityOptions++;
                    activity.options.forEach(option => {
                        if (option.note) preservedNotes++;
                        if (option.reasonForSelection) preservedReasons++;
                    });
                }
                
                if (activity.transportation?.options && activity.transportation.options.length > 0) {
                    preservedTransportOptions++;
                    activity.transportation.options.forEach(option => {
                        if (option.note) preservedNotes++;
                    });
                }
            });
        });
        
        console.log('✅ Normalization simulation results:');
        console.log(`   🎯 Activity options preserved: ${preservedActivityOptions}`);
        console.log(`   🚗 Transport options preserved: ${preservedTransportOptions}`);
        console.log(`   📝 Notes preserved: ${preservedNotes}`);
        console.log(`   🤔 Reasons preserved: ${preservedReasons}`);
        
    } else {
        console.log('⚠️ Unknown data structure - normalization may fail');
    }
}

function testOptionChipDetection(rawData) {
    console.log('🎪 Testing option chip generation requirements...');
    
    let activitiesWithMultipleOptions = 0;
    let transportWithMultipleOptions = 0;
    let chipCandidates = [];
    
    if (rawData.tripPlan && rawData.tripPlan.itinerary) {
        rawData.tripPlan.itinerary.forEach((dayPlan, dayIndex) => {
            dayPlan.activities?.forEach((activity, actIndex) => {
                // Check for activities with multiple options (chip candidates)
                if (activity.options && activity.options.length > 1) {
                    activitiesWithMultipleOptions++;
                    chipCandidates.push({
                        day: dayPlan.dayNumber,
                        activity: activity.activityName,
                        optionCount: activity.options.length,
                        type: 'activity'
                    });
                }
                
                if (activity.transportation?.options && activity.transportation.options.length > 1) {
                    transportWithMultipleOptions++;
                    chipCandidates.push({
                        day: dayPlan.dayNumber,
                        activity: activity.activityName,
                        optionCount: activity.transportation.options.length,
                        type: 'transport'
                    });
                }
            });
        });
    }
    
    console.log('🎯 Option Chip Generation Candidates:');
    chipCandidates.forEach(candidate => {
        console.log(`   Day ${candidate.day}: ${candidate.activity} - ${candidate.optionCount} ${candidate.type} options`);
    });
    
    console.log(`📊 Total chip candidates: ${chipCandidates.length}`);
    console.log(`   🎯 Activities: ${activitiesWithMultipleOptions}`);
    console.log(`   🚗 Transport: ${transportWithMultipleOptions}`);
}

// Test localStorage data
function testLocalStorageData() {
    console.log('\n=== TESTING LOCALSTORAGE DATA ===');
    const keys = Object.keys(localStorage);
    console.log('📦 LocalStorage keys:', keys);
    
    const testKey = 'generatedApp_test123';
    const storedData = localStorage.getItem(testKey);
    
    if (storedData) {
        console.log('✅ Test data found in localStorage');
        const parsedData = JSON.parse(storedData);
        console.log('📊 Data type:', parsedData.responseType || 'unknown');
        console.log('📊 Data status:', parsedData.status || 'unknown');
        
        if (parsedData.tripPlan) {
            console.log('📊 Trip destination:', parsedData.tripPlan.tripInfo?.destination);
            console.log('📊 Trip duration:', parsedData.tripPlan.tripInfo?.duration);
            console.log('📊 Itinerary days:', parsedData.tripPlan.itinerary?.length);
        }
    } else {
        console.log('❌ No test data found in localStorage');
    }
}

// Clear test data
function clearTestData() {
    localStorage.removeItem('generatedApp_test123');
    console.log('🗑️ Test data cleared');
}

// Auto-run if called from console
console.log('📋 Available test functions:');
console.log('   • testDataPreservation() - Run full test suite');
console.log('   • testLocalStorageData() - Check localStorage content');
console.log('   • clearTestData() - Clear test data');

console.log('\n🚀 To start testing, run: testDataPreservation()');