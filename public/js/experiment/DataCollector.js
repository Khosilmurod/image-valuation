/**
 * DataCollector.js - Image Valuation Data Collection and Export
 * Handles saving all experiment data, CSV generation, and finishing the experiment
 */

// Add data collection methods to the ImageValuationExperiment class
Object.assign(ImageValuationExperiment.prototype, {
    
    async finishExperiment() {
        // Comprehensive data validation before attempting to save
        if (!this.validateExperimentData()) {
            return;
        }

        console.log('csvData before filtering:', this.csvData); // DEBUG LOG

        document.body.innerHTML = `
            <div class="main-container">
                <div class="instructions">
                    <h2>Completing the experiment...</h2>
                    <p>Please wait while your data is being saved.</p>
                    <div style="margin-top: 1rem; color: #666;">
                        <small>Saving data for participant ${this.subjectId}...</small>
                    </div>
                </div>
            </div>`;

        try {
            // Use the original csvData for separation
            const comprehensiveData = this.csvData;
            console.log('csvData to be separated:', comprehensiveData); // DEBUG LOG
            console.log(`Attempting to save ${comprehensiveData.length} data entries for subject ${this.subjectId}`);
            console.log('Sample data entry:', comprehensiveData[0]);

            // Separate data by collection and save to each collection
            const saveResults = await this.saveDataToCollections(comprehensiveData);

            if (saveResults.success) {
                document.body.innerHTML = `
                    <div class="main-container">
                        <div class="instructions">
                            <h2>Thank You</h2>
                            <div style="border: 1px solid #e5e5e5; padding: 2rem; border-radius: 4px; margin: 2rem 0; background: #fafafa;">
                                <p style="font-size: 18px; margin-bottom: 1rem;">You have successfully completed the Image Valuation study.</p>
                                <p style="color: green; font-weight: bold;">Your responses have been successfully saved.</p>
                                <div style="margin-top: 1rem; color: #666; font-size: 14px;">
                                    <small>Participant ID: ${this.subjectId}</small><br>
                                    <small>Phase 1 data: ${saveResults.phase1Count} entries</small><br>
                                    <small>Phase 2 data: ${saveResults.phase2Count} entries</small><br>
                                    <small>Final questionnaire: ${saveResults.finalCount} entry</small>
                                </div>
                            </div>
                            <p>You may now close this window.</p>
                        </div>
                    </div>`;
            } else {
                throw new Error(`Save failed: ${saveResults.error}`);
            }
        } catch (err) {
            console.error('Error saving data:', err);
            this.showDataError(`There was an error saving your data: ${err.message}`);
        }
    },

    async saveDataToCollections(allData) {
        try {
            // Separate data by phase/collection using entry_type
            const phase1Data = [];
            const phase2Data = [];
            const finalData = [];
            const attentionCheckData = [];

            allData.forEach(row => {
                if (typeof row === 'string' && row.trim()) {
                    const columns = row.split(',');
                    // Phase 1: entry_type is 'phase1_image' ONLY
                    if (columns[1] === 'phase1_image') {
                        phase1Data.push(row);
                    }
                    // Phase 2: entry_type is 'phase2_response' ONLY
                    else if (columns[1] === 'phase2_response') {
                        phase2Data.push(row);
                    }
                    // Final: entry_type is 'final_questionnaire'
                    else if (columns[1] === 'final_questionnaire') {
                        finalData.push(row);
                    }
                    // Attention checks: entry_type is 'attention_check'
                    else if (columns[1] === 'attention_check') {
                        attentionCheckData.push(row);
                    }
                }
            });

            console.log('Data separation results:', {
                phase1Count: phase1Data.length,
                phase2Count: phase2Data.length,
                finalCount: finalData.length,
                attentionCheckCount: attentionCheckData.length
            });

            // Save to each collection separately
            const savePromises = [];

            // Helper to convert phase1 CSV rows to JSON objects with only the 7 required fields
            const convertPhase1ToJSON = (row) => {
                const columns = this.parseCSVRow(row);
                return {
                    participant_id: columns[0] || '',
                    phase: parseInt(columns[2]) || 1,
                    image_id: parseInt(columns[3]) || null,
                    filename: columns[4] || '',
                    image_size: columns[5] || '',
                    response_time: parseFloat(columns[10]) || null,
                    timestamp: columns[21] || new Date().toISOString()
                };
            };

            // Helper to convert phase2 CSV rows to JSON objects with only the needed fields
            const convertPhase2ToJSON = (row) => {
                const columns = this.parseCSVRow(row);
                return {
                    participant_id: columns[0] || '',
                    phase: parseInt(columns[2]) || 2,
                    image_id: parseInt(columns[3]) || null,
                    filename: columns[4] || '',
                    image_size: columns[5] || '',
                    image_type: columns[6] || '',
                    memory_response: columns[7] || '',
                    payment_response: columns[8] || '',
                    confidence: parseFloat(columns[9]) || null,
                    response_time: parseFloat(columns[10]) || null,
                    timestamp: columns[21] || new Date().toISOString()
                };
            };

            // Helper to convert attention check CSV rows to JSON objects
            const convertAttentionCheckToJSON = (row) => {
                const columns = this.parseCSVRow(row);
                const attentionCheckId = columns[11] || '';
                
                // Find the question details from the attention check questions
                let questionText = '';
                let correctAnswer = '';
                
                if (this.attentionCheckQuestions && attentionCheckId) {
                    const question = this.attentionCheckQuestions.find(q => q.id == attentionCheckId);
                    if (question) {
                        questionText = question.prompt || '';
                        correctAnswer = question.correct_answer || '';
                    }
                }
                
                return {
                    participant_id: columns[0] || '',
                    phase: parseInt(columns[2]) || 1,
                    attention_check_id: attentionCheckId,
                    question_text: questionText,
                    attention_response: columns[12] || '',
                    correct_answer: correctAnswer,
                    is_correct: columns[13] === 'true' || columns[13] === true,
                    response_time: parseFloat(columns[10]) || null,
                    session_id: columns[20] || '',
                    timestamp: columns[21] || new Date().toISOString()
                };
            };

            // Save Phase 1 data as JSON objects
            if (phase1Data.length > 0) {
                const phase1JSON = phase1Data.map(convertPhase1ToJSON);
                savePromises.push(
                    this.saveToCollection('phase1', phase1JSON)
                        .then(() => ({ collection: 'phase1', success: true, count: phase1Data.length }))
                        .catch(err => ({ collection: 'phase1', success: false, error: err.message }))
                );
            }

            // Save Phase 2 data as JSON objects
            if (phase2Data.length > 0) {
                const phase2JSON = phase2Data.map(convertPhase2ToJSON);
                savePromises.push(
                    this.saveToCollection('phase2', phase2JSON)
                        .then(() => ({ collection: 'phase2', success: true, count: phase2Data.length }))
                        .catch(err => ({ collection: 'phase2', success: false, error: err.message }))
                );
            }

            // Save attention check data as JSON objects
            if (attentionCheckData.length > 0) {
                const attentionCheckJSON = attentionCheckData.map(convertAttentionCheckToJSON);
                savePromises.push(
                    this.saveToCollection('attention_checks', attentionCheckJSON)
                        .then(() => ({ collection: 'attention_checks', success: true, count: attentionCheckData.length }))
                        .catch(err => ({ collection: 'attention_checks', success: false, error: err.message }))
                );
            }

            // Save final questionnaire data (keeping existing CSV format for now)
            if (finalData.length > 0) {
                savePromises.push(
                    this.saveToCollection('final_questionnaire', finalData)
                        .then(() => ({ collection: 'final_questionnaire', success: true, count: finalData.length }))
                        .catch(err => ({ collection: 'final_questionnaire', success: false, error: err.message }))
                );
            }

            // Wait for all saves to complete
            const results = await Promise.all(savePromises);
            const failedSaves = results.filter(r => !r.success);
            if (failedSaves.length > 0) {
                const errorMessages = failedSaves.map(r => `${r.collection}: ${r.error}`).join(', ');
                throw new Error(`Failed to save to collections: ${errorMessages}`);
            }

            // Return success summary
            return {
                success: true,
                phase1Count: phase1Data.length,
                phase2Count: phase2Data.length,
                finalCount: finalData.length,
                attentionCheckCount: attentionCheckData.length
            };
        } catch (err) {
            return { success: false, error: err.message };
        }
    },

    async saveToCollection(collection, data) {
        let requestBody;
        
        if (collection === 'phase1' || collection === 'phase2' || collection === 'attention_checks') {
            // For phase1, phase2, and attention_checks, send JSON array of objects
            requestBody = JSON.stringify({ 
                data: data, // data is already an array of JSON objects
                collection: collection,
                format: 'json'
            });
        } else {
            // For other collections, send CSV string (existing behavior)
            requestBody = JSON.stringify({ 
                data: data.join(''),
                collection: collection,
                format: 'csv'
            });
        }

        const response = await fetch('/api/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: requestBody,
        });

        const responseText = await response.text();
        console.log(`Save to ${collection} response:`, responseText);

        if (!response.ok) {
            throw new Error(`Server error: ${response.status} - ${responseText}`);
        }

        return responseText;
    },

    validateExperimentData() {
        // Check for subject ID
        if (!this.subjectId) {
            console.error('No subject ID!');
            this.showDataError('Subject ID is missing. Please contact the researcher.');
            return false;
        }

        // Check for collected data
        if (!this.csvData || this.csvData.length === 0) {
            console.error('No data to save!');
            this.showDataError('No experiment data was collected. Please contact the researcher.');
            return false;
        }

        // Validate expected data types
        const expectedEntryTypes = ['phase1_image', 'phase2_response', 'attention_check', 'final_questionnaire', 'session_info'];
        const foundEntryTypes = [];
        
        this.csvData.forEach(row => {
            if (typeof row === 'string' && row.trim()) {
                const columns = this.parseCSVRow(row);
                if (columns.length > 1) {
                    const entryType = columns[1]; // entry_type is second column
                    if (!foundEntryTypes.includes(entryType)) {
                        foundEntryTypes.push(entryType);
                    }
                }
            }
        });

        console.log('Data validation:', {
            subjectId: this.subjectId,
            totalRows: this.csvData.length,
            foundEntryTypes: foundEntryTypes,
            finalAnswers: !!this.finalAnswers
        });

        // Check for minimum required data
        if (!foundEntryTypes.includes('phase1_image')) {
            console.warn('No Phase 1 image data found');
        }
        if (!foundEntryTypes.includes('phase2_response')) {
            console.warn('No Phase 2 response data found');
        }

        return true;
    },

    prepareComprehensiveData() {
        const allData = [];

        // Process all collected CSV data with validation
        this.csvData.forEach((dataRow, index) => {
            if (typeof dataRow === 'string' && dataRow.trim()) {
                const cleanRow = dataRow.trim();
                const columns = this.parseCSVRow(cleanRow);
                const entryType = columns[1];
                let filteredRow = null;

                if (entryType === 'phase1_image') {
                    // Only keep relevant fields for phase1
                    filteredRow = [
                        columns[0], // participant_id
                        columns[2], // phase
                        columns[3], // image_id
                        columns[4], // filename
                        columns[5], // image_size
                        columns[10], // response_time
                        columns[20], // session_id
                        columns[21]  // timestamp
                    ].join(',') + '\n';
                } else if (entryType === 'phase2_response') {
                    // Only keep relevant fields for phase2
                    filteredRow = [
                        columns[0], // participant_id
                        columns[2], // phase
                        columns[3], // image_id
                        columns[4], // filename
                        columns[5], // image_size
                        columns[6], // image_type
                        columns[7], // memory_response
                        columns[8], // payment_response
                        columns[9], // confidence
                        columns[10], // response_time
                        columns[20], // session_id
                        columns[21]  // timestamp
                    ].join(',') + '\n';
                } else if (entryType === 'final_questionnaire') {
                    // Only keep relevant fields for final_questionnaire
                    filteredRow = [
                        columns[0], // participant_id
                        columns[14], // snack_preference
                        columns[15], // desire_to_eat
                        columns[16], // hunger
                        columns[17], // fullness
                        columns[18], // satisfaction
                        columns[19], // eating_capacity
                        columns[20], // session_id
                        columns[21]  // timestamp
                    ].join(',') + '\n';
                }

                if (filteredRow) {
                    allData.push(filteredRow);
                }
            }
        });

        // No need to add session metadata or attention checks
        console.log(`Prepared ${allData.length} filtered data entries`);
        console.log('Filtered allData:', allData); // DEBUG LOG
        return allData;
    },

    showDataError(message) {
        document.body.innerHTML = `
            <div class="main-container">
                <div class="instructions">
                    <h2>Data Save Error</h2>
                    <div style="border: 1px solid #e5e5e5; padding: 2rem; border-radius: 4px; margin: 2rem 0; background: #fff2f2; color: #d32f2f; border-left: 4px solid #d32f2f;">
                        <p style="font-weight: bold; margin-bottom: 1rem;">⚠️ Unable to save your data</p>
                        <p>${message}</p>
                        <div style="margin-top: 1.5rem; padding: 1rem; background: #f5f5f5; border-radius: 4px;">
                            <p style="font-weight: bold; margin-bottom: 0.5rem;">Debug Information:</p>
                            <p style="font-size: 12px; font-family: monospace; margin: 0;">
                                Participant ID: ${this.subjectId || 'MISSING'}<br>
                                Data entries collected: ${this.csvData?.length || 0}<br>
                                Final answers: ${this.finalAnswers ? 'Yes' : 'No'}<br>
                                Current phase: ${this.currentPhase || 'Unknown'}<br>
                                Session ID: ${this.sessionId || 'MISSING'}<br>
                                Timestamp: ${new Date().toISOString()}
                            </p>
                        </div>
                    </div>
                    <p>Please screenshot this message and contact the researcher immediately.</p>
                </div>
            </div>`;
    },

    // Helper method to parse CSV rows properly
    parseCSVRow(row) {
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
    },

    // Helper method to format and validate data entries
    formatDataEntry(entryType, data) {
        const baseEntry = {
            participant_id: this.subjectId || 'unknown',
            entry_type: entryType,
            timestamp: new Date().toISOString(),
            session_id: this.sessionId
        };

        const combinedEntry = { ...baseEntry, ...data };
        
        // Convert to CSV row
        const csvRow = Object.values(combinedEntry).map(value => {
            const str = String(value || '');
            // Escape CSV fields that contain commas, newlines, or quotes
            if (str.includes(',') || str.includes('\n') || str.includes('"')) {
                return '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
        }).join(',') + '\n';

        return csvRow;
    }
}); 