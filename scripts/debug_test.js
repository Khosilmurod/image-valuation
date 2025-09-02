// Quick debug test to trace phase1_size field
console.log('Testing phase1_size data flow...');

// Test CSV row generation
const testPhase1Size = 'large';
const testImageId = 1;
const testImageSize = 'medium';

console.log('Test values:');
console.log('  testPhase1Size:', testPhase1Size);
console.log('  testImageId:', testImageId);
console.log('  testImageSize:', testImageSize);

// Simulate CSV row creation (from TrialManager)
const csvRowArray = [
    'test_participant',               // participant_id
    'phase2_response',                // entry_type
    2,                                // phase
    testImageId,                      // image_id
    'test_image.jpg',                 // filename
    testImageSize,                    // image_size
    testPhase1Size,                   // phase1_size (NEW FIELD) - INDEX 6
    'old',                            // image_type
    'yes',                            // memory_response
    '2.50',                           // payment_response
    75,                               // confidence
    '3.234',                          // response_time
    '',                               // attention_check_id
    '',                               // attention_response
    '',                               // attention_correct
    '',                               // snack_preference
    '',                               // desire_to_eat
    '',                               // hunger
    '',                               // fullness
    '',                               // satisfaction
    '',                               // eating_capacity
    'test_session',                   // session_id
    new Date().toISOString()          // timestamp
];

console.log('\nCSV Row Array:');
console.log('Index 6 (phase1_size):', csvRowArray[6]);
console.log('Full array:', csvRowArray);

const csvRow = csvRowArray.join(',') + '\n';
console.log('\nCSV Row String:');
console.log(csvRow);

// Test CSV parsing (from DataCollector)
function parseCSVRow(row) {
    const result = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < row.length) {
        const char = row[i];
        const nextChar = row[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote
                current += '"';
                i += 2;
            } else {
                // Start or end quotes
                inQuotes = !inQuotes;
                i++;
            }
        } else if (char === ',' && !inQuotes) {
            // End of field
            result.push(current);
            current = '';
            i++;
        } else {
            current += char;
            i++;
        }
    }
    
    result.push(current); // Add last field
    return result;
}

const parsedColumns = parseCSVRow(csvRow);
console.log('\nParsed columns:');
console.log('columns[6] (phase1_size):', parsedColumns[6]);
console.log('typeof columns[6]:', typeof parsedColumns[6]);
console.log('Full parsed array:', parsedColumns);

// Test JSON conversion
const jsonObj = {
    participant_id: parsedColumns[0] || '',
    phase: parseInt(parsedColumns[2]) || 2,
    image_id: parseInt(parsedColumns[3]) || null,
    filename: parsedColumns[4] || '',
    image_size: parsedColumns[5] || '',
    phase1_size: parsedColumns[6] || 'empty',
    image_type: parsedColumns[7] || '',
    memory_response: parsedColumns[8] || '',
    payment_response: parsedColumns[9] || '',
    confidence: parseFloat(parsedColumns[10]) || null,
    response_time: parseFloat(parsedColumns[11]) || null,
    timestamp: parsedColumns[22] || new Date().toISOString()
};

console.log('\nJSON Object:');
console.log('phase1_size in JSON:', jsonObj.phase1_size);
console.log('Has phase1_size property?', 'phase1_size' in jsonObj);
console.log('Full JSON object:', JSON.stringify(jsonObj, null, 2));

console.log('\n✅ Debug test complete');
