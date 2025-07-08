require('dotenv').config();
const { MongoClient } = require('mongodb');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

let db;
let serverConfig;

// Load server configuration from config.json
try {
    const configPath = path.join(__dirname, 'public', 'config.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    serverConfig = config.serverConfig;
    console.log('Server configuration loaded from config.json');
} catch (error) {
    console.error('Error loading server configuration:', error);
    process.exit(1);
}

// Add this near the top of the file, after serverConfig is loaded
const allowedFields = {
    phase1: [
        "participant_id", "phase", "image_id", "filename", "image_size", "response_time", "attention_check_id", "attention_response", "attention_correct", "session_id", "timestamp"
    ],
    phase2: [
        "participant_id", "phase", "image_id", "filename", "image_size", "image_type", "memory_response", "payment_response", "confidence", "response_time", "attention_check_id", "attention_response", "attention_correct", "session_id", "timestamp"
    ],
    final_questionnaire: [
        "participant_id", "snack_preference", "desire_to_eat", "hunger", "fullness", "satisfaction", "eating_capacity", "session_id", "timestamp"
    ]
};

// Middleware to parse JSON and URL-encoded data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from the current directory
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to serve config.json
app.get('/config.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'config.json'));
});

// Protected CSV download endpoint
app.get('/:urlPath', async (req, res) => {
    const requestedPath = req.params.urlPath;
    

    
    try {
        // Check if this path exists in settings collection
        const settingsCollection = db.collection('settings');
        
        const setting = await settingsCollection.findOne({ url: requestedPath });
        
        if (!setting) {
            // If no setting found, continue to normal static file serving
            return res.status(404).send('Page not found');
        }
        
        // If setting found, check for password in header or query
        const providedPassword = req.headers.authorization?.replace('Bearer ', '') || req.query.password;
        
        if (!providedPassword) {
            // Send password prompt HTML
            const passwordPromptHTML = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Access Protected</title>
                    <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                    <style>
                        * {
                            box-sizing: border-box;
                        }
                        
                        body {
                            font-family: 'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            margin: 0;
                            padding: 0;
                            background: #fff;
                            color: #333;
                            line-height: 1.6;
                            font-weight: 400;
                            font-size: 16px;
                            min-height: 100vh;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        
                        .main-container {
                            width: 100%;
                            max-width: 500px;
                            margin: 0 auto;
                            padding: 3rem;
                            background: #fff;
                            border-radius: 8px;
                            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                            text-align: center;
                        }
                        
                        h2 {
                            color: #333;
                            font-size: 24px;
                            font-weight: 600;
                            margin-bottom: 1rem;
                        }
                        
                        p {
                            color: #666;
                            margin-bottom: 2rem;
                        }
                        
                        input[type="password"] {
                            width: 100%;
                            padding: 12px 16px;
                            border: 1px solid #e5e5e5;
                            border-radius: 4px;
                            font-size: 16px;
                            font-family: inherit;
                            margin-bottom: 1.5rem;
                            background: #fff;
                        }
                        
                        input[type="password"]:focus {
                            outline: none;
                            border-color: #333;
                            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                        }
                        
                        .next-button {
                            background: #333;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            padding: 12px 24px;
                            font-size: 16px;
                            font-weight: 500;
                            font-family: inherit;
                            cursor: pointer;
                            transition: background-color 0.2s ease;
                            min-width: 150px;
                        }
                        
                        .next-button:hover {
                            background: #555;
                        }
                        
                        .next-button:disabled {
                            background: #ccc;
                            cursor: not-allowed;
                        }
                        
                        @media (max-width: 768px) {
                            .main-container {
                                padding: 2rem;
                                margin: 1rem;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="main-container">
                        <h2>Please Enter Your Information</h2>
                        
                        <div style="margin-bottom: 2rem;">
                            <label for="password" style="display: block; margin-bottom: 0.5rem; color: #333; font-weight: 500;">Password:</label>
                            <form onsubmit="submitPassword(event)" id="passwordForm">
                                <input 
                                    type="password" 
                                    id="password" 
                                    placeholder="Enter access password..." 
                                    required
                                    autocomplete="current-password"
                                    style="width: 100%; padding: 12px 16px; border: 1px solid #e5e5e5; border-radius: 4px; font-size: 16px; font-family: inherit; margin-bottom: 1.5rem; background: #fff;"
                                >
                                <br>
                                <button type="submit" class="next-button" id="submitBtn">
                                    Access Results
                                </button>
                            </form>
                        </div>
                    </div>
                    
                    <script>
                        function submitPassword(event) {
                            event.preventDefault();
                            const password = document.getElementById('password').value;
                            const submitBtn = document.getElementById('submitBtn');
                            
                            submitBtn.innerHTML = 'Verifying...';
                            submitBtn.disabled = true;
                            
                            window.location.href = window.location.pathname + '?password=' + encodeURIComponent(password);
                        }
                        
                        document.getElementById('password').focus();
                    </script>
                </body>
                </html>
            `;
            return res.send(passwordPromptHTML);
        }
        
        // Verify password
        if (providedPassword !== setting.password) {
            return res.status(401).send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Access Denied</title>
                    <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                    <style>
                        * {
                            box-sizing: border-box;
                        }
                        
                        body {
                            font-family: 'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            margin: 0;
                            padding: 0;
                            background: #fff;
                            color: #333;
                            line-height: 1.6;
                            font-weight: 400;
                            font-size: 16px;
                            min-height: 100vh;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        
                        .main-container {
                            width: 100%;
                            max-width: 500px;
                            margin: 0 auto;
                            padding: 3rem;
                            background: #fff;
                            border-radius: 8px;
                            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                            text-align: center;
                        }
                        
                        h2 {
                            color: #dc2626;
                            font-size: 24px;
                            font-weight: 600;
                            margin-bottom: 1rem;
                        }
                        
                        p {
                            color: #666;
                            margin-bottom: 2rem;
                        }
                        
                        .next-button {
                            background: #333;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            padding: 12px 24px;
                            font-size: 16px;
                            font-weight: 500;
                            font-family: inherit;
                            cursor: pointer;
                            transition: background-color 0.2s ease;
                            text-decoration: none;
                            display: inline-block;
                        }
                        
                        .next-button:hover {
                            background: #555;
                        }
                        
                        @media (max-width: 768px) {
                            .main-container {
                                padding: 2rem;
                                margin: 1rem;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="main-container">
                        <h2>Access Denied</h2>
                        <p>Incorrect password. Please try again.</p>
                        <a href="${req.path}" class="next-button">Try Again</a>
                    </div>
                </body>
                </html>
            `);
        }
        
        // Password correct, serve CSV data
        await serveCsvResults(res);
        
    } catch (error) {
        console.error('Error in protected route:', error);
        res.status(500).send('Internal server error');
    }
});

// Function to serve CSV results
async function serveCsvResults(res) {
    try {
        const resultsCollection = db.collection(serverConfig.database.collection);
        const results = await resultsCollection.find({}).sort({ timestamp: 1 }).toArray();
        
        if (results.length === 0) {
            return res.status(404).send('No results found');
        }
        
        // Generate CSV
        const header = serverConfig.csv.headers.join(',');
        
        const csvRows = results.map(result => {
            return serverConfig.csv.headers.map(header => {
                const value = result[header] || '';
                const fieldValue = header === 'timestamp' && result.timestamp ? result.timestamp.toISOString() : value;
                
                // Escape fields that contain commas or quotes
                if (typeof fieldValue === 'string' && (fieldValue.includes(',') || fieldValue.includes('"'))) {
                    return `"${fieldValue.replace(/"/g, '""')}"`;
                }
                return fieldValue;
            }).join(',');
        });
        
        const csvContent = [header, ...csvRows].join('\n');
        
        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${serverConfig.csv.filename_prefix}_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
        
    } catch (error) {
        console.error('Error generating CSV:', error);
        res.status(500).send('Error generating CSV file');
    }
}

// Function to properly parse CSV row (handles quoted fields)
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

// Endpoint to save data
app.post('/save', async (req, res) => {
    const { data, collection } = req.body;
    console.log('--- /save endpoint called ---');
    console.log('Request collection:', collection);
    console.log('Request data (first 500 chars):', data ? data.substring(0, 500) : 'NO DATA');
    if (!data) {
        return res.status(400).send('No data received.');
    }

    try {
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
        const keys = serverConfig.csv.headers;
        
        console.log(`Processing data submission: ${data.length} characters to collection ${collectionName}`);
        
        // Split data by newlines and filter out empty lines
        const rows = data.split('\n').filter(row => row.trim() !== '');
        console.log(`Found ${rows.length} data rows to process`);
        
        const entries = [];
        const errors = [];
        
        rows.forEach((row, index) => {
            try {
                const values = parseCSVRow(row);
                
                if (values.length !== keys.length) {
                    const warning = `Row ${index + 1} has ${values.length} values but expected ${keys.length}`;
                    console.warn(warning);
                    console.warn(`Row data: ${row}`);
                    errors.push(warning);
                }
                
                const entry = {};
                keys.forEach((key, keyIndex) => {
                    const value = values[keyIndex];
                    
                    // Convert numeric fields with proper validation
                    const numericFields = ['confidence', 'response_time', 'desire_to_eat', 'hunger', 'fullness', 'satisfaction', 'eating_capacity', 'image_id', 'phase'];
                    const booleanFields = ['attention_correct'];
                    
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
                // entry_type is not required for new format
                entries.push(entry);
                
            } catch (parseError) {
                const errorMsg = `Error parsing row ${index + 1}: ${parseError.message}`;
                console.error(errorMsg);
                console.error(`Problematic row: ${row}`);
                errors.push(errorMsg);
            }
        });

        console.log(`Successfully parsed ${entries.length} entries`);
        if (errors.length > 0) {
            console.warn(`Encountered ${errors.length} warnings/errors:`, errors);
        }

        // Log sample data for verification
        if (entries.length > 0) {
            console.log('Sample entry:', JSON.stringify(entries[0], null, 2));
            
            // Get participant info for logging
            const participantIds = [...new Set(entries.map(e => e.participant_id).filter(id => id))];
            console.log(`Data submission summary:`, {
                participants: participantIds,
                totalEntries: entries.length,
                warnings: errors.length
            });
        }

        let filteredEntries = entries;
        if (collectionName === serverConfig.database.phase1_collection) {
            filteredEntries = entries.map(e => {
                const obj = {};
                allowedFields.phase1.forEach(f => { obj[f] = e[f]; });
                obj.server_timestamp = new Date();
                return obj;
            });
        } else if (collectionName === serverConfig.database.phase2_collection) {
            filteredEntries = entries.map(e => {
                const obj = {};
                allowedFields.phase2.forEach(f => { obj[f] = e[f]; });
                obj.server_timestamp = new Date();
                return obj;
            });
        } else if (collectionName === serverConfig.database.final_collection) {
            // For final_questionnaire, extract relevant fields from 22-column format
            filteredEntries = entries.map(e => {
                const obj = {};
                allowedFields.final_questionnaire.forEach(f => { obj[f] = e[f]; });
                obj.server_timestamp = new Date();
                return obj;
            });
            console.log('Filtered final_questionnaire entries:', filteredEntries);
        }
        await resultsCollection.insertMany(filteredEntries);
        
        let responseMessage = `Data saved successfully. ${entries.length} entries processed.`;
        if (errors.length > 0) {
            responseMessage += ` ${errors.length} warnings logged.`;
        }
        
        res.status(200).send(responseMessage);
    } catch (err) {
        console.error('Error saving data to database:', err);
        console.error('Stack trace:', err.stack);
        return res.status(500).send(`Error saving data: ${err.message}`);
    }
});

async function connectToDb() {
    if (!MONGODB_URI) {
        throw new Error('MONGODB_URI is not defined in your .env file');
    }
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    db = client.db(serverConfig.database.name);
    console.log(`Using database: ${serverConfig.database.name}`);
}

connectToDb().then(() => {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
        console.log(`To run the experiment, open http://localhost:${port} in your browser.`);
    });
}).catch(err => {
    console.error('Failed to connect to the database', err);
    process.exit(1);
}); 