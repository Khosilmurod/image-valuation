const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Global variable to cache the database connection
let cachedDb = null;

// Load server configuration
let serverConfig;
try {
    const configPath = path.join(process.cwd(), 'public', 'config.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    serverConfig = config.serverConfig;
} catch (error) {
    console.error('Error loading server configuration:', error);
}

const allowedFields = {
    phase1: [
        "participant_id", "phase", "image_id", "filename", "image_size", "phase1_size", "response_time", "session_id", "timestamp"
    ],
    phase2: [
        "participant_id", "phase", "image_id", "filename", "image_size", "phase1_size", "image_type", "memory_response", "payment_response", "confidence", "response_time", "session_id", "timestamp"
    ],
    final_questionnaire: [
        "participant_id", "snack_preference", "desire_to_eat", "hunger", "fullness", "satisfaction", "eating_capacity", "session_id", "timestamp"
    ]
};

async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }

    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is not defined');
    }

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    const db = client.db(serverConfig.database.name);
    cachedDb = db;
    return db;
}

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

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { data, collection, format } = req.body;
    
    if (!data) {
        return res.status(400).send('No data received.');
    }

    try {
        const db = await connectToDatabase();
        
        // Determine which collection to use
        let collectionName;
        if (collection === 'phase1') {
            collectionName = serverConfig.database.phase1_collection;
        } else if (collection === 'phase2') {
            collectionName = serverConfig.database.phase2_collection;
        } else if (collection === 'final_questionnaire') {
            collectionName = serverConfig.database.final_collection;
        } else {
            // Default to phase2 for backward compatibility
            collectionName = serverConfig.database.phase2_collection;
        }
        
        const resultsCollection = db.collection(collectionName);
        
        console.log(`Processing data submission to collection ${collectionName}`);
        console.log(`Data format: ${format || 'csv'}`);
        console.log(`Data type: ${Array.isArray(data) ? 'array' : typeof data}`);
        
        let entries = [];
        const errors = [];
        
        // Handle different data formats
        if (format === 'json' && Array.isArray(data)) {
            console.log('🚨 ENTERING JSON PROCESSING PATH');
            // Data is already an array of JSON objects
            console.log(`Processing ${data.length} JSON objects`);
            console.log('=== SAMPLE INPUT JSON OBJECT ===');
            console.log('First JSON object:', JSON.stringify(data[0], null, 2));
            console.log('Keys in first object:', Object.keys(data[0]));
            console.log('phase1_size in first object?', 'phase1_size' in data[0]);
            console.log('phase1_size value:', data[0]?.phase1_size);
            console.log('=== END SAMPLE ===');
            
            // For JSON format, we need to apply field filtering here
            console.log('🚨 ABOUT TO APPLY JSON FILTERING');
            entries = data.map(item => {
                const filteredItem = {};
                
                // Apply collection-specific field filtering
                let fieldsToInclude = [];
                if (collectionName === serverConfig.database.phase1_collection) {
                    fieldsToInclude = allowedFields.phase1;
                } else if (collectionName === serverConfig.database.phase2_collection) {
                    fieldsToInclude = allowedFields.phase2;
                } else if (collectionName === serverConfig.database.final_collection) {
                    fieldsToInclude = allowedFields.final_questionnaire;
                } else {
                    // Default to phase2 fields
                    fieldsToInclude = allowedFields.phase2;
                }
                
                console.log('🔥 JSON FILTERING DEBUG for collection:', collectionName);
                console.log('🔥 Fields to include:', fieldsToInclude);
                console.log('🔥 phase1_size in fieldsToInclude?', fieldsToInclude.includes('phase1_size'));
                
                // Copy only allowed fields
                fieldsToInclude.forEach(field => {
                    filteredItem[field] = item[field];
                });
                
                // Add server timestamp
                filteredItem.server_timestamp = new Date();
                
                console.log('🔥 Filtered item:', filteredItem);
                console.log('🔥 phase1_size in filtered item?', 'phase1_size' in filteredItem);
                console.log('🔥 phase1_size value in filtered item:', filteredItem.phase1_size);
                
                return filteredItem;
            });
            
            console.log('=== FINAL JSON PROCESSING RESULT ===');
            console.log('Sample processed entry:', JSON.stringify(entries[0], null, 2));
            console.log('=== END JSON PROCESSING ===');
            console.log('🚨 JSON PROCESSING COMPLETE');
        } else {
            // Handle CSV format (existing logic)
            const keys = serverConfig.csv.headers;
            console.log(`Processing CSV data: ${data.length} characters`);
            
            // Split data by newlines and filter out empty lines
            const rows = data.split('\n').filter(row => row.trim() !== '');
            console.log(`Found ${rows.length} data rows to process`);
            
            rows.forEach((row, index) => {
                try {
                    const values = parseCSVRow(row);
                    
                    if (values.length !== keys.length) {
                        const warning = `Row ${index + 1} has ${values.length} values but expected ${keys.length}`;
                        console.warn(warning);
                        errors.push(warning);
                    }
                    
                    const entry = {};
                    keys.forEach((key, keyIndex) => {
                        const value = values[keyIndex];
                        
                        // Convert numeric fields with proper validation
                        const numericFields = ['confidence', 'response_time', 'desire_to_eat', 'hunger', 'fullness', 'satisfaction', 'eating_capacity', 'image_id', 'phase'];
                        const booleanFields = [];
                        
                        if (numericFields.includes(key)) {
                            // Handle 'null' strings and convert to actual null
                            if (value === 'null' || value === '' || value === undefined) {
                                entry[key] = null;
                            } else {
                                const numValue = parseFloat(value);
                                entry[key] = isNaN(numValue) ? null : numValue;
                            }
                        } else if (booleanFields.includes(key)) {
                            // Handle boolean fields
                            if (value === 'true' || value === true) {
                                entry[key] = true;
                            } else if (value === 'false' || value === false) {
                                entry[key] = false;
                            } else {
                                entry[key] = null;
                            }
                        } else {
                            // String fields
                            entry[key] = value || '';
                        }
                    });
                    
                    // Add server timestamp
                    entry.server_timestamp = new Date();
                    
                    // Validate required fields
                    if (!entry.participant_id) {
                        errors.push(`Row ${index + 1}: Missing participant_id`);
                    }
                    
                    entries.push(entry);
                    
                } catch (parseError) {
                    const errorMsg = `Error parsing row ${index + 1}: ${parseError.message}`;
                    console.error(errorMsg);
                    errors.push(errorMsg);
                }
            });
        }

        console.log(`Successfully parsed ${entries.length} entries`);
        
        if (entries.length === 0) {
            return res.status(400).send('No valid entries to save');
        }

        // For CSV format, apply field filtering here (JSON format filtering is done above)
        let filteredEntries = entries;
        if (format !== 'json') {
            if (collectionName === serverConfig.database.phase1_collection) {
                filteredEntries = entries.map(e => {
                    const obj = {};
                    allowedFields.phase1.forEach(f => { obj[f] = e[f]; });
                    obj.server_timestamp = new Date();
                    return obj;
                });
            } else if (collectionName === serverConfig.database.phase2_collection) {
                console.log('=== PHASE2 CSV FILTERING DEBUG ===');
                console.log('Sample input entry before filtering:', entries[0]);
                console.log('phase1_size in input entry?', 'phase1_size' in entries[0]);
                console.log('phase1_size value:', entries[0]?.phase1_size);
                console.log('allowedFields.phase2:', allowedFields.phase2);
                
                filteredEntries = entries.map(e => {
                    const obj = {};
                    allowedFields.phase2.forEach(f => { obj[f] = e[f]; });
                    obj.server_timestamp = new Date();
                    return obj;
                });
                
                console.log('Sample filtered entry:', filteredEntries[0]);
                console.log('phase1_size in filtered entry?', 'phase1_size' in filteredEntries[0]);
                console.log('phase1_size final value:', filteredEntries[0]?.phase1_size);
                console.log('=== END PHASE2 CSV DEBUG ===');
            } else if (collectionName === serverConfig.database.final_collection) {
                filteredEntries = entries.map(e => {
                    const obj = {};
                    allowedFields.final_questionnaire.forEach(f => { obj[f] = e[f]; });
                    obj.server_timestamp = new Date();
                    return obj;
                });
            }
        }
        
        await resultsCollection.insertMany(filteredEntries);
        
        let responseMessage = `Data saved successfully. ${entries.length} entries processed.`;
        if (errors.length > 0) {
            responseMessage += ` ${errors.length} warnings logged.`;
        }
        
        res.status(200).send(responseMessage);
        
    } catch (err) {
        console.error('Error saving data to database:', err);
        return res.status(500).send(`Error saving data: ${err.message}`);
    }
} 