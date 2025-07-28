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
        "participant_id", "phase", "image_id", "filename", "image_size", "response_time", "session_id", "timestamp"
    ],
    phase2: [
        "participant_id", "phase", "image_id", "filename", "image_size", "image_type", "memory_response", "payment_response", "confidence", "response_time", "session_id", "timestamp"
    ],
    final_questionnaire: [
        "participant_id", "snack_preference", "desire_to_eat", "hunger", "fullness", "satisfaction", "eating_capacity", "session_id", "timestamp"
    ],
    attention_checks: [
        "participant_id", "phase", "attention_check_id", "question_text", "attention_response", "correct_answer", "is_correct", "response_time", "session_id", "timestamp"
    ]
};

// Middleware to parse JSON and URL-encoded data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Endpoint to serve config.json
app.get('/config.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'config.json'));
});

// Protected CSV download endpoint (with URL path)
app.get('/:urlPath', async (req, res, next) => {
    const requestedPath = req.params.urlPath;
    
    try {
        // Check if this path exists in settings collection
        const settingsCollection = db.collection('settings');
        
        const setting = await settingsCollection.findOne({ url: requestedPath });
        
        if (setting) {
            // If setting found, this is a protected URL - check for password
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
                                min-width: 150px;
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
                            <p>The password you entered is incorrect.</p>
                            <a href="${req.path}" class="next-button">Try Again</a>
                        </div>
                    </body>
                    </html>
                `);
            }
            
            // Password correct, show download options
            await showDownloadOptions(res, req);
            
        } else {
            // If no setting found, serve the experiment normally (no password required)
            // This will serve static files from the public directory
            return next();
        }
        
    } catch (error) {
        console.error('Error in protected route:', error);
        res.status(500).send('Internal server error');
    }
});

// Root route - serve experiment directly (no password required)
app.get('/', (req, res) => {
    console.log('🔍 DEBUG: Root route accessed - serving experiment');
    // Serve the experiment page directly from public directory
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Individual collection download endpoints (with URL path)
app.get('/:urlPath/download/:collectionType', async (req, res) => {
    const requestedPath = req.params.urlPath;
    const collectionType = req.params.collectionType;
    
    try {
        // Check if this path exists in settings collection
        const settingsCollection = db.collection('settings');
        const setting = await settingsCollection.findOne({ url: requestedPath });
        
        if (!setting) {
            return res.status(404).send('Page not found');
        }
        
        // Check for password in header or query
        const providedPassword = req.headers.authorization?.replace('Bearer ', '') || req.query.password;
        
        if (!providedPassword || providedPassword !== setting.password) {
            return res.status(401).send('Unauthorized - Invalid or missing password');
        }
        
        // Password correct, serve CSV for the specific collection
        await serveCsvResults(res, collectionType);
        
    } catch (error) {
        console.error('Error in download route:', error);
        res.status(500).send('Internal server error');
    }
});

// Individual collection download endpoints (without URL path - for direct access)
app.get('/download/:collectionType', async (req, res) => {
    const collectionType = req.params.collectionType;
    
    console.log('🔍 DEBUG: Download route accessed');
    console.log('🔍 DEBUG: URL:', req.url);
    console.log('🔍 DEBUG: Path:', req.path);
    console.log('🔍 DEBUG: Collection type:', collectionType);
    console.log('🔍 DEBUG: Query params:', req.query);
    console.log('🔍 DEBUG: Headers:', req.headers);
    
    try {
        // Check for password in header or query
        const providedPassword = req.headers.authorization?.replace('Bearer ', '') || req.query.password;
        
        console.log('🔍 DEBUG: Provided password:', providedPassword ? 'YES' : 'NO');
        
        if (!providedPassword) {
            console.log('🔍 DEBUG: No password provided, returning 401');
            return res.status(401).send('Unauthorized - Password required');
        }
        
        // For direct access, we'll use a default password or check against any setting
        const settingsCollection = db.collection('settings');
        const settings = await settingsCollection.find({}).toArray();
        
        console.log('🔍 DEBUG: Found settings:', settings.length);
        
        // Default password for root access if no settings exist
        // PASSWORD FOR DATA DOWNLOAD: admin123
        const defaultPassword = 'admin123';
        
        let isValidPassword = false;
        
        if (settings.length === 0) {
            // No settings in database, use default password
            isValidPassword = (providedPassword === defaultPassword);
            console.log('🔍 DEBUG: Using default password validation');
        } else {
            // Check if password matches any setting
            const validSetting = settings.find(setting => setting.password === providedPassword);
            isValidPassword = !!validSetting;
            console.log('🔍 DEBUG: Valid setting found:', validSetting ? 'YES' : 'NO');
        }
        
        if (!isValidPassword) {
            console.log('🔍 DEBUG: Invalid password, returning 401');
            return res.status(401).send('Unauthorized - Invalid password');
        }
        
        // Password correct, serve CSV for the specific collection
        console.log('🔍 DEBUG: Password valid, serving CSV for:', collectionType);
        await serveCsvResults(res, collectionType);
        
    } catch (error) {
        console.error('🔍 DEBUG: Error in download route:', error);
        res.status(500).send('Internal server error');
    }
});

// Fix double-download path issue
app.get('/download/download/:collectionType', (req, res) => {
    const { collectionType } = req.params;
    const queryString = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    res.redirect(`/download/${collectionType}${queryString}`);
});

// Function to show download options page
async function showDownloadOptions(res, req) {
    try {
        // Get the URL path for proper routing
        const urlPath = req.params.urlPath;
        
        // Get the password from the request
        const providedPassword = req.headers.authorization?.replace('Bearer ', '') || req.query.password;
        
        // Determine the base URL for downloads
        const downloadBase = urlPath ? `/${urlPath}` : '';
        
        // Create the password parameter for URLs
        const passwordParam = providedPassword ? `?password=${encodeURIComponent(providedPassword)}` : '';
        
        // Get count of records in each collection
        const collections = [
            { name: serverConfig.database.phase1_collection, type: 'phase1', label: 'Phase 1 (Image Viewing)' },
            { name: serverConfig.database.phase2_collection, type: 'phase2', label: 'Phase 2 (Memory & Valuation)' },
            { name: serverConfig.database.final_collection, type: 'final_questionnaire', label: 'Final Questionnaire' },
            { name: serverConfig.database.attention_check_collection, type: 'attention_checks', label: 'Attention Checks' }
        ];
        
        let collectionCounts = {};
        
        for (const collection of collections) {
            try {
                const count = await db.collection(collection.name).countDocuments();
                collectionCounts[collection.type] = count;
                console.log(`Found ${count} records in ${collection.name} collection`);
            } catch (error) {
                console.warn(`Error counting documents in ${collection.name}:`, error.message);
                collectionCounts[collection.type] = 0;
            }
        }
        
        const downloadPageHTML = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Download Experiment Data</title>
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
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 3rem;
                        background: #fff;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                        text-align: center;
                    }
                    
                    h2 {
                        color: #333;
                        font-size: 28px;
                        font-weight: 600;
                        margin-bottom: 1rem;
                    }
                    
                    .description {
                        color: #666;
                        margin-bottom: 2rem;
                        font-size: 16px;
                    }
                    
                    .download-section {
                        margin: 2rem 0;
                        padding: 1.5rem;
                        border: 1px solid #e5e5e5;
                        border-radius: 8px;
                        background: #fafafa;
                    }
                    
                    .download-button {
                        background: #333;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        padding: 12px 24px;
                        font-size: 16px;
                        font-weight: 500;
                        font-family: inherit;
                        cursor: pointer;
                        transition: background-color 0.2s ease;
                        min-width: 200px;
                        text-decoration: none;
                        display: inline-block;
                        margin: 0.5rem;
                    }
                    
                    .download-button:hover {
                        background: #555;
                    }
                    
                    .download-button:disabled {
                        background: #ccc;
                        cursor: not-allowed;
                    }
                    
                    .record-count {
                        font-size: 14px;
                        color: #666;
                        margin-top: 0.5rem;
                    }
                    
                    .section-title {
                        font-size: 18px;
                        font-weight: 600;
                        color: #333;
                        margin-bottom: 1rem;
                    }
                    
                    .total-summary {
                        margin-top: 2rem;
                        padding: 1rem;
                        background: #e8f5e8;
                        border-radius: 6px;
                        border-left: 4px solid #28a745;
                    }
                    
                    @media (max-width: 768px) {
                        .main-container {
                            padding: 2rem;
                            margin: 1rem;
                        }
                        
                        .download-button {
                            min-width: 100%;
                            margin: 0.25rem 0;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="main-container">
                    <h2>📊 Experiment Data Downloads</h2>
                    <p class="description">
                        Choose which dataset to download. Each file contains data from a specific phase of the experiment.
                    </p>
                    
                    <div class="download-section">
                        <div class="section-title">${collections[0].label}</div>
                        <a href="${downloadBase}/download/phase1${passwordParam}" class="download-button" ${collectionCounts.phase1 === 0 ? 'style="background: #ccc; pointer-events: none;"' : ''}>
                            📸 Download Phase 1 Data
                        </a>
                        <div class="record-count">${collectionCounts.phase1} records available</div>
                    </div>
                    
                    <div class="download-section">
                        <div class="section-title">${collections[1].label}</div>
                        <a href="${downloadBase}/download/phase2${passwordParam}" class="download-button" ${collectionCounts.phase2 === 0 ? 'style="background: #ccc; pointer-events: none;"' : ''}>
                            🧠 Download Phase 2 Data
                        </a>
                        <div class="record-count">${collectionCounts.phase2} records available</div>
                    </div>
                    
                    <div class="download-section">
                        <div class="section-title">${collections[2].label}</div>
                        <a href="${downloadBase}/download/final_questionnaire${passwordParam}" class="download-button" ${collectionCounts.final_questionnaire === 0 ? 'style="background: #ccc; pointer-events: none;"' : ''}>
                            📋 Download Final Questionnaire
                        </a>
                        <div class="record-count">${collectionCounts.final_questionnaire} records available</div>
                    </div>
                    
                    <div class="download-section">
                        <div class="section-title">${collections[3].label}</div>
                        <a href="${downloadBase}/download/attention_checks${passwordParam}" class="download-button" ${collectionCounts.attention_checks === 0 ? 'style="background: #ccc; pointer-events: none;"' : ''}>
                            🎯 Download Attention Checks
                        </a>
                        <div class="record-count">${collectionCounts.attention_checks} records available</div>
                    </div>
                    
                    <div class="total-summary">
                        <strong>Total Records: ${Object.values(collectionCounts).reduce((a, b) => a + b, 0)}</strong>
                        <br>
                        <small>Last updated: ${new Date().toLocaleString()}</small>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        res.send(downloadPageHTML);
        
    } catch (error) {
        console.error('Error showing download options:', error);
        res.status(500).send('Error loading download options');
    }
}

// Serve static files from the current directory (after all API routes)
app.use(express.static(path.join(__dirname, 'public')));

// Debug catch-all route to see what requests are being made
app.use((req, res, next) => {
    console.log('🔍 DEBUG: Catch-all route - URL:', req.url);
    console.log('🔍 DEBUG: Method:', req.method);
    console.log('🔍 DEBUG: Path:', req.path);
    next();
});

// Function to serve CSV results for a specific collection
async function serveCsvResults(res, collectionType) {
    try {
        let collectionName;
        let fieldsToInclude = [];
        let filename;
        
        // Determine collection and fields based on type
        switch (collectionType) {
            case 'phase1':
                collectionName = serverConfig.database.phase1_collection;
                fieldsToInclude = ["participant_id", "phase", "image_id", "filename", "image_size", "response_time", "session_id", "timestamp"];
                filename = `${serverConfig.csv.filename_prefix}_phase1_${new Date().toISOString().split('T')[0]}.csv`;
                break;
            case 'phase2':
                collectionName = serverConfig.database.phase2_collection;
                fieldsToInclude = ["participant_id", "phase", "image_id", "filename", "image_size", "image_type", "memory_response", "payment_response", "confidence", "response_time", "session_id", "timestamp"];
                filename = `${serverConfig.csv.filename_prefix}_phase2_${new Date().toISOString().split('T')[0]}.csv`;
                break;
            case 'final_questionnaire':
                collectionName = serverConfig.database.final_collection;
                fieldsToInclude = ["participant_id", "snack_preference", "desire_to_eat", "hunger", "fullness", "satisfaction", "eating_capacity", "session_id", "timestamp"];
                filename = `${serverConfig.csv.filename_prefix}_final_questionnaire_${new Date().toISOString().split('T')[0]}.csv`;
                break;
            case 'attention_checks':
                collectionName = serverConfig.database.attention_check_collection;
                fieldsToInclude = ["participant_id", "phase", "attention_check_id", "question_text", "attention_response", "correct_answer", "is_correct", "response_time", "session_id", "timestamp"];
                filename = `${serverConfig.csv.filename_prefix}_attention_checks_${new Date().toISOString().split('T')[0]}.csv`;
                break;
            default:
                return res.status(400).send('Invalid collection type');
        }
        
        // Fetch data from the specific collection
        const results = await db.collection(collectionName)
            .find({})
            .sort({ timestamp: 1, server_timestamp: 1 })
            .toArray();
        
        if (results.length === 0) {
            return res.status(404).send(`No results found in ${collectionType} collection`);
        }
        
        console.log(`Exporting ${results.length} records from ${collectionType} collection`);
        
        // Generate CSV with relevant fields only
        const header = fieldsToInclude.join(',');
        
        const csvRows = results.map(result => {
            const rowValues = fieldsToInclude.map(headerField => {
                // Handle missing fields gracefully - if field doesn't exist in result, use empty string
                const value = result.hasOwnProperty(headerField) ? result[headerField] : '';
                let fieldValue = value;
                
                // Handle timestamp conversion
                if (headerField === 'timestamp') {
                    if (result.timestamp) {
                        fieldValue = result.timestamp instanceof Date ? result.timestamp.toISOString() : result.timestamp;
                        // Trim any newlines that might be in the timestamp
                        fieldValue = String(fieldValue).trim();
                    } else if (result.server_timestamp) {
                        fieldValue = result.server_timestamp instanceof Date ? result.server_timestamp.toISOString() : result.server_timestamp;
                        // Trim any newlines that might be in the timestamp
                        fieldValue = String(fieldValue).trim();
                    }
                }
                
                // Escape fields that contain commas or quotes
                if (typeof fieldValue === 'string' && (fieldValue.includes(',') || fieldValue.includes('"'))) {
                    return `"${fieldValue.replace(/"/g, '""')}"`;
                }
                return fieldValue;
            });
            
            const row = rowValues.join(',');
            return row;
        }).filter(row => {
            // Stricter filtering: Remove rows that are completely empty, just commas, or have no meaningful data
            const trimmed = row.trim();
            
            if (trimmed === '' || trimmed === ','.repeat(fieldsToInclude.length - 1)) {
                return false;
            }
            
            // For phase1 and phase2, ensure at least image_id and filename are present
            if (collectionType === 'phase1' || collectionType === 'phase2') {
                const values = row.split(',');
                const imageIdIndex = fieldsToInclude.indexOf('image_id');
                const filenameIndex = fieldsToInclude.indexOf('filename');
                
                if (imageIdIndex >= 0 && filenameIndex >= 0) {
                    const imageId = values[imageIdIndex];
                    const filename = values[filenameIndex];
                    // Filter out rows where image_id is empty/null and filename is empty
                    if ((!imageId || imageId === '' || imageId === 'null') && 
                        (!filename || filename === '' || filename === 'null')) {
                        return false;
                    }
                }
            }
            
            return true;
        });
        
        // Additional check: ensure we have valid rows after filtering
        if (csvRows.length === 0) {
            return res.status(404).send(`No valid data found in ${collectionType} collection after filtering`);
        }
        
        const csvContent = [header, ...csvRows].join('\n');
        
        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csvContent.trim()); // Ensure no trailing whitespace
        
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
app.post('/api/save', async (req, res) => {
    const { data, collection, format } = req.body;
    console.log('--- /api/save endpoint called ---');
    console.log('Request collection:', collection);
    console.log('Request format:', format || 'csv');
    
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
        } else if (collection === 'attention_checks') {
            collectionName = serverConfig.database.attention_check_collection;
        } else {
            // Default to phase2 for backward compatibility
            collectionName = serverConfig.database.phase2_collection;
        }
        const resultsCollection = db.collection(collectionName);
        
        let entries = [];
        let errors = [];

        if (format === 'json' && (collection === 'phase1' || collection === 'phase2' || collection === 'attention_checks')) {
            // Handle JSON format for phase1, phase2, and attention_checks
            console.log(`Processing ${collection} JSON data`);
            
            if (!Array.isArray(data)) {
                return res.status(400).send(`${collection} data must be an array of objects.`);
            }

            entries = data.map((entry, index) => {
                let cleanEntry;
                
                if (collection === 'phase1') {
                    // Phase1: only the 7 required fields
                    cleanEntry = {
                        participant_id: entry.participant_id || '',
                        phase: parseInt(entry.phase) || 1,
                        image_id: parseInt(entry.image_id) || null,
                        filename: entry.filename || '',
                        image_size: entry.image_size || '',
                        response_time: parseFloat(entry.response_time) || null,
                        timestamp: entry.timestamp || new Date().toISOString(),
                        server_timestamp: new Date()
                    };
                } else if (collection === 'phase2') {
                    // Phase2: only the needed fields (no attention check columns)
                    cleanEntry = {
                        participant_id: entry.participant_id || '',
                        phase: parseInt(entry.phase) || 2,
                        image_id: parseInt(entry.image_id) || null,
                        filename: entry.filename || '',
                        image_size: entry.image_size || '',
                        image_type: entry.image_type || '',
                        memory_response: entry.memory_response || '',
                        payment_response: parseFloat(entry.payment_response) || 0,
                        confidence: parseFloat(entry.confidence) || null,
                        response_time: parseFloat(entry.response_time) || null,
                        timestamp: entry.timestamp || new Date().toISOString(),
                        server_timestamp: new Date()
                    };
                } else if (collection === 'attention_checks') {
                    // Attention checks: structured data with validation fields
                    cleanEntry = {
                        participant_id: entry.participant_id || '',
                        phase: parseInt(entry.phase) || 1,
                        attention_check_id: entry.attention_check_id || '',
                        question_text: entry.question_text || '',
                        attention_response: entry.attention_response || '',
                        correct_answer: entry.correct_answer || '',
                        is_correct: Boolean(entry.is_correct),
                        response_time: parseFloat(entry.response_time) || null,
                        session_id: entry.session_id || '',
                        timestamp: entry.timestamp || new Date().toISOString(),
                        server_timestamp: new Date()
                    };
                }

                // Validate required fields
                if (!cleanEntry.participant_id) {
                    errors.push(`Entry ${index + 1}: Missing participant_id`);
                }

                return cleanEntry;
            });

            // Additional validation: Filter out entries that are clearly attention checks or malformed
            entries = entries.filter((entry, index) => {
                // For phase1: ensure we have valid image data
                if (collection === 'phase1') {
                    if (!entry.image_id || entry.image_id === null || entry.image_id === '') {
                        console.warn(`Filtering out phase1 entry ${index + 1}: missing image_id`);
                        return false;
                    }
                    if (!entry.filename || entry.filename === '') {
                        console.warn(`Filtering out phase1 entry ${index + 1}: missing filename`);
                        return false;
                    }
                }
                
                // For phase2: ensure we have valid response data
                if (collection === 'phase2') {
                    if (!entry.image_id || entry.image_id === null || entry.image_id === '') {
                        console.warn(`Filtering out phase2 entry ${index + 1}: missing image_id`);
                        return false;
                    }
                    if (!entry.filename || entry.filename === '') {
                        console.warn(`Filtering out phase2 entry ${index + 1}: missing filename`);
                        return false;
                    }
                    // Ensure we have at least one of the response fields
                    if ((!entry.memory_response || entry.memory_response === '') && 
                        (!entry.payment_response || entry.payment_response === 0)) {
                        console.warn(`Filtering out phase2 entry ${index + 1}: missing response data`);
                        return false;
                    }
                }
                
                // For attention_checks: ensure we have required fields
                if (collection === 'attention_checks') {
                    if (!entry.attention_check_id || entry.attention_check_id === '') {
                        console.warn(`Filtering out attention check entry ${index + 1}: missing attention_check_id`);
                        return false;
                    }
                    if (!entry.attention_response || entry.attention_response === '') {
                        console.warn(`Filtering out attention check entry ${index + 1}: missing attention_response`);
                        return false;
                    }
                }
                
                return true;
            });

            console.log(`Successfully processed ${entries.length} ${collection} entries after filtering`);
            if (errors.length > 0) {
                console.warn(`Encountered ${errors.length} warnings:`, errors);
            }

            // Log sample data for verification
            if (entries.length > 0) {
                console.log(`Sample ${collection} entry:`, JSON.stringify(entries[0], null, 2));
                
                const participantIds = [...new Set(entries.map(e => e.participant_id).filter(id => id))];
                console.log(`${collection} data submission summary:`, {
                    participants: participantIds,
                    totalEntries: entries.length,
                    warnings: errors.length
                });
            }

        } else {
            // Handle CSV format for other collections (existing logic)
            const keys = serverConfig.csv.headers;
            console.log(`Processing CSV data submission: ${data.length} characters to collection ${collectionName}`);
            
            // Split data by newlines and filter out empty lines
            const rows = data.split('\n').filter(row => row.trim() !== '');
            console.log(`Found ${rows.length} data rows to process`);
            
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
                    
                    // Additional validation: Filter out attention checks and malformed data
                    const entryType = entry.entry_type || '';
                    
                    // For phase1 collection: only allow phase1_image entries
                    if (collectionName === serverConfig.database.phase1_collection) {
                        if (entryType !== 'phase1_image') {
                            console.warn(`Filtering out non-phase1 entry: ${entryType}`);
                            return; // Skip this entry
                        }
                        // Ensure we have valid image data
                        if (!entry.image_id || entry.image_id === null || entry.image_id === '') {
                            console.warn(`Filtering out phase1 entry with missing image_id`);
                            return; // Skip this entry
                        }
                        if (!entry.filename || entry.filename === '') {
                            console.warn(`Filtering out phase1 entry with missing filename`);
                            return; // Skip this entry
                        }
                    }
                    
                    // For phase2 collection: only allow phase2_response entries
                    if (collectionName === serverConfig.database.phase2_collection) {
                        if (entryType !== 'phase2_response') {
                            console.warn(`Filtering out non-phase2 entry: ${entryType}`);
                            return; // Skip this entry
                        }
                        // Ensure we have valid response data
                        if (!entry.image_id || entry.image_id === null || entry.image_id === '') {
                            console.warn(`Filtering out phase2 entry with missing image_id`);
                            return; // Skip this entry
                        }
                        if (!entry.filename || entry.filename === '') {
                            console.warn(`Filtering out phase2 entry with missing filename`);
                            return; // Skip this entry
                        }
                        // Ensure we have at least one of the response fields
                        if ((!entry.memory_response || entry.memory_response === '') && 
                            (!entry.payment_response || entry.payment_response === 0)) {
                            console.warn(`Filtering out phase2 entry with missing response data`);
                            return; // Skip this entry
                        }
                    }
                    
                    entries.push(entry);
                    
                } catch (parseError) {
                    const errorMsg = `Error parsing row ${index + 1}: ${parseError.message}`;
                    console.error(errorMsg);
                    console.error(`Problematic row: ${row}`);
                    errors.push(errorMsg);
                }
            });

            console.log(`Successfully parsed ${entries.length} entries after filtering`);
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

            // Apply filtering for other collections (existing logic)
            if (collectionName === serverConfig.database.phase2_collection) {
                entries = entries.map(e => {
                    const obj = {};
                    allowedFields.phase2.forEach(f => { obj[f] = e[f]; });
                    obj.server_timestamp = new Date();
                    return obj;
                });
            } else if (collectionName === serverConfig.database.final_collection) {
                // For final_questionnaire, extract relevant fields from 22-column format
                entries = entries.map(e => {
                    const obj = {};
                    allowedFields.final_questionnaire.forEach(f => { obj[f] = e[f]; });
                    obj.server_timestamp = new Date();
                    return obj;
                });
                console.log('Filtered final_questionnaire entries:', entries);
            }
        }

        // Save to database
        await resultsCollection.insertMany(entries);
        
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