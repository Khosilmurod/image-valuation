// Minimal test to trigger the experiment flow and see debug output
const fetch = require('node-fetch');

async function testExperimentFlow() {
    console.log('Starting automated experiment test...');
    
    // Test Phase 1 data submission
    const phase1Data = [{
        participant_id: 'debug_test',
        phase: 1,
        image_id: 1,
        filename: 'test_image.jpg',
        image_size: 'large',
        response_time: 2.0,
        timestamp: new Date().toISOString()
    }];
    
    console.log('Submitting Phase 1 data...');
    const phase1Response = await fetch('http://localhost:3000/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            data: phase1Data,
            collection: 'phase1',
            format: 'json'
        })
    });
    
    console.log('Phase 1 response:', phase1Response.status);
    
    // Test Phase 2 data submission
    const phase2Data = [{
        participant_id: 'debug_test',
        phase: 2,
        image_id: 1,
        filename: 'test_image.jpg',
        image_size: 'medium',
        phase1_size: 'large',  // This should be preserved!
        image_type: 'old',
        memory_response: 'yes',
        payment_response: '2.50',
        confidence: 75,
        response_time: 3.5,
        timestamp: new Date().toISOString()
    }];
    
    console.log('Submitting Phase 2 data with phase1_size:', phase2Data[0].phase1_size);
    const phase2Response = await fetch('http://localhost:3000/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            data: phase2Data,
            collection: 'phase2',
            format: 'json'
        })
    });
    
    console.log('Phase 2 response:', phase2Response.status);
    console.log('Test complete - check server logs!');
}

testExperimentFlow().catch(console.error);
