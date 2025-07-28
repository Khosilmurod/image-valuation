/**
 * TrialManager.js - Image Valuation Phase Management
 * Handles Phase 1 (passive viewing) and Phase 2 (memory/valuation) management
 */

// Add trial management methods to the ImageValuationExperiment class
Object.assign(ImageValuationExperiment.prototype, {
    
    // Helper function to escape CSV fields that contain commas or quotes
    escapeCSVField(field) {
        // Convert to string if not already
        const fieldStr = String(field || '');
        
        // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
        if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
            return '"' + fieldStr.replace(/"/g, '""') + '"';
        }
        return fieldStr;
    },
    
    startPhase1() {
        this.currentPhase = 1;
        this.phase1Timeline = [];
        this.phase1TimelineIndex = 0;
        this.attentionCheckCounter = 0;
        this.phase1StartTime = Date.now();
        
        // Build timeline: insert attention checks at correct positions
        const attentionPositions = this.experimentConfig.attentionChecks.phase1.positions;
        let imageIdx = 0;
        for (let i = 1; i <= this.phase1Images.length; i++) {
            // Insert image trial
            this.phase1Timeline.push({ type: 'image', image: this.phase1Images[imageIdx++] });
            // Insert attention check if needed (positions are 1-based, after image i)
            if (attentionPositions.includes(i)) {
                this.phase1Timeline.push({ type: 'attention', attentionIndex: this.attentionCheckCounter++ });
            }
        }
        this.attentionCheckCounter = 0; // reset for use in attention check logic
        this.showNextPhase1Step();
    },

    showNextPhase1Step() {
        if (this.phase1TimelineIndex >= this.phase1Timeline.length) {
            this.showPhase2Instructions();
            return;
        }
        const step = this.phase1Timeline[this.phase1TimelineIndex];
        if (step.type === 'image') {
            const image = step.image;
            this.imageDisplayStartTime = Date.now();
            // Calculate image number (exclude attention checks)
            const imageNumber = this.phase1Timeline.slice(0, this.phase1TimelineIndex + 1).filter(s => s.type === 'image').length;
            const totalImages = this.phase1Images.length;
            
            // Get image size and create image element
            const imageSize = this.experimentConfig.imageSizes[image.size];
            const imagePath = `images/old-images/${encodeURIComponent(image.filename)}`;
            const imageStyle = `max-width: ${imageSize}; max-height: ${imageSize}; width: auto; height: auto; display: block; margin: 0 auto; border-radius: 0; box-shadow: none; background: none;`;
            const imageElement = this.getImageElement(imagePath, `Food image ${image.id}`, imageStyle);
            
            // Show image with size reference lines
            document.body.innerHTML = `
                <div class="main-container" style="display: flex; align-items: center; justify-content: center; min-height: 100vh;">
                    <div style="text-align: center;">
                        <div class="size-reference-container">
                            ${imageElement}
                            <!-- Horizontal reference lines -->
                            <div class="size-reference-line horizontal" style="left: -40px; top: 0;"></div>
                            <div class="size-reference-line horizontal" style="left: -40px; bottom: 0;"></div>
                            <div class="size-reference-text vertical" style="left: -45px; top: 50%; transform: translateY(-50%);">10 cm</div>
                            
                            <!-- Vertical reference lines -->
                            <div class="size-reference-line vertical" style="left: 0; bottom: -40px;"></div>
                            <div class="size-reference-line vertical" style="right: 0; bottom: -40px;"></div>
                            <div class="size-reference-text" style="bottom: -45px; left: 50%; transform: translateX(-50%);">10 cm</div>
                        </div>
                        <div style="margin-top: 20px; font-size: 16px; color: #888;">Image ${imageNumber} of ${totalImages}</div>
                    </div>
                </div>`;
                
            setTimeout(() => {
                this.recordPhase1ImageData(image);
                this.phase1TimelineIndex++;
                this.showNextPhase1Step();
            }, this.experimentConfig.imageDisplayDuration);
        } else if (step.type === 'attention') {
            this.showPhase1AttentionCheck(step.attentionIndex);
        }
    },

    showPhase1AttentionCheck(attentionIndex) {
        // Phase 1 uses questions 0 and 1 (first 2 questions)
        const questionIndex = attentionIndex; // attentionIndex will be 0, 1 for Phase 1
        const question = this.attentionCheckQuestions[questionIndex];
        this.attentionCheckStartTime = Date.now();
        document.body.innerHTML = `
            <div class="main-container">
                <div class="instructions">
                    <h2>Attention Check</h2>
                    <div style="border: 1px solid #e5e5e5; padding: 2rem; border-radius: 4px; margin: 2rem 0; background: #fafafa;">
                        <p class="attention-question-prompt">
                            ${question.prompt}<br><span style='font-size: 15px; color: #555;'>${question.instruction}</span>
                        </p>
                        <div style="margin: 1rem 0;">
                            ${question.options.map((option, index) => `
                                <div style="margin: 0.5rem 0;">
                                    <label style="cursor: pointer; font-size: 16px;">
                                        <input type="radio" name="attentionResponse" value="${option}" style="margin-right: 0.5rem;">
                                        ${option}
                                    </label>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <button onclick="experiment.submitPhase1AttentionCheck(${attentionIndex})" class="next-button" id="submitAttentionBtn">
                        Continue
                    </button>
                </div>
            </div>`;
    },

    submitPhase1AttentionCheck(attentionIndex) {
        const selectedOption = document.querySelector('input[name="attentionResponse"]:checked');
        if (!selectedOption) {
            alert('Please select an answer to continue');
            return;
        }
        // Phase 1 uses questions 0 and 1
        const questionIndex = attentionIndex;
        const question = this.attentionCheckQuestions[questionIndex];
        const response = selectedOption.value;
        const correct = (response === question.correct_answer);
        const responseTime = (Date.now() - this.attentionCheckStartTime) / 1000;
        
        // Record attention check data (regardless of correctness)
        const attentionRow = [
            this.subjectId || 'unknown',      // participant_id
            'attention_check',                // entry_type
            this.currentPhase,                // phase
            '',                               // image_id
            '',                               // filename
            '',                               // image_size
            '',                               // image_type
            '',                               // memory_response
            '',                               // payment_response
            '',                               // confidence
            responseTime.toFixed(3),          // response_time
            this.escapeCSVField(question.id), // attention_check_id (escaped)
            this.escapeCSVField(response),    // attention_response (escaped)
            correct,                          // attention_correct
            '',                               // snack_preference
            '',                               // desire_to_eat
            '',                               // hunger
            '',                               // fullness
            '',                               // satisfaction
            '',                               // eating_capacity
            this.sessionId || '',             // session_id
            new Date().toISOString()          // timestamp
        ].join(',') + '\n';
        this.csvData.push(attentionRow);
        this.phase1TimelineIndex++;
        this.showNextPhase1Step();
    },

    recordPhase1ImageData(image) {
        const displayDuration = Date.now() - this.imageDisplayStartTime;
        
        // Record Phase 1 image viewing data
        const phase1Row = [
            this.subjectId || 'unknown',      // participant_id
            'phase1_image',                   // entry_type
            1,                                // phase
            image.id,                         // image_id
            this.escapeCSVField(image.filename), // filename (escaped)
            image.size,                       // image_size
            '',                               // image_type (not relevant for phase 1)
            '',                               // memory_response
            '',                               // payment_response
            '',                               // confidence
            (displayDuration / 1000).toFixed(3), // response_time (actual display duration)
            '',                               // attention_check_id
            '',                               // attention_response
            '',                               // attention_correct
            '',                               // snack_preference
            '',                               // desire_to_eat
            '',                               // hunger
            '',                               // fullness
            '',                               // satisfaction
            '',                               // eating_capacity
            this.sessionId || '',             // session_id
            new Date().toISOString()          // timestamp
        ].join(',') + '\n';
        
        this.csvData.push(phase1Row);
        console.log('csvData after phase1 push:', this.csvData);
        console.log(`Recorded Phase 1 image data: ${image.filename} (${image.size}) - ${displayDuration}ms`);
    },

    startPhase2() {
        this.currentPhase = 2;
        this.phase2Timeline = [];
        this.phase2TimelineIndex = 0;
        this.phase2StartTime = Date.now();
        this.attentionCheckCounter = 0;

        // Build timeline: insert attention checks at correct positions
        const attentionPositions = this.experimentConfig.attentionChecks.phase2.positions;
        let imageIdx = 0;
        for (let i = 1; i <= this.phase2Images.length; i++) {
            // Insert image trial
            this.phase2Timeline.push({ type: 'image', image: this.phase2Images[imageIdx++] });
            // Insert attention check if needed (positions are 1-based, after image i)
            if (attentionPositions.includes(i)) {
                this.phase2Timeline.push({ type: 'attention', attentionIndex: this.attentionCheckCounter++ });
            }
        }
        this.attentionCheckCounter = 0; // reset for use in attention check logic
        this.showNextPhase2Step();
    },

    showNextPhase2Step() {
        if (this.phase2TimelineIndex >= this.phase2Timeline.length) {
            this.showFinalQuestionsPage();
            return;
        }
        const step = this.phase2Timeline[this.phase2TimelineIndex];
        if (step.type === 'image') {
            const image = step.image;
            this.imageQuestionStartTime = Date.now();
            this.currentMemoryResponse = null;
            this.currentPaymentResponse = null;
            this.currentConfidence = null;
            this.sliderInteracted = false;
            this.paymentInteracted = false;
            const imageSize = this.experimentConfig.imageSizes[image.size];
            const imageFolder = image.isOld ? 'old-images' : 'new-images';
            
            // Calculate image number (exclude attention checks)
            const imageNumber = this.phase2Timeline.slice(0, this.phase2TimelineIndex + 1).filter(s => s.type === 'image').length;
            const totalImages = this.phase2Images.length;
            
            // Get preloaded image element
            const imagePath = `images/${imageFolder}/${encodeURIComponent(image.filename)}`;
            const imageStyle = `max-width: ${imageSize}; max-height: ${imageSize};`;
            const imageElement = this.getImageElement(imagePath, `Food image ${image.id}`, imageStyle);
            
            document.body.innerHTML = `
                <div class="main-container" style="display: flex; flex-direction: column; align-items: center; min-height: 100vh;">
                    <div class="instructions" style="width: 100%; max-width: 600px; margin: 0 auto;">
                        <div class="image-display medium-image" style="text-align: center; margin-bottom: 24px;">
                            ${imageElement}
                        </div>
                        <div class="question-container" style="display: flex; flex-direction: column; gap: 36px; align-items: center; margin: 1rem 0; padding: 1rem; border: 1px solid #e5e5e5; border-radius: 4px; background: #fafafa;">
                            <!-- Memory Question -->
                            <div style="margin-bottom: 0; text-align: center;">
                                <p style="font-weight: 600; margin-bottom: 12px; font-size: 17px; color: #222;">Have you seen this image before?</p>
                                <div style="display: flex; gap: 32px; justify-content: center;">
                                    <label style="cursor: pointer; font-size: 16px;">
                                        <input type="radio" name="memory" value="yes" style="margin-right: 0.5rem;"> Yes
                                    </label>
                                    <label style="cursor: pointer; font-size: 16px;">
                                        <input type="radio" name="memory" value="no" style="margin-right: 0.5rem;"> No
                                    </label>
                                </div>
                            </div>
                            <!-- Payment Question -->
                            <div style="margin-bottom: 0; text-align: center;">
                                <p style="font-weight: 600; margin-bottom: 12px; font-size: 17px; color: #222;">How much are you willing to pay for the item?</p>
                                <div style="margin: 0.1rem 0; width: 100%;">
                                    <input type="range" id="paymentSlider" min="0" max="4" value="2" step="0.25"
                                           style="width: 100%; accent-color: #1976d2; height: 4px; margin-bottom: 8px;" onchange="experiment.updatePayment(this.value)">
                                    <div style="display: flex; justify-content: space-between; font-size: 13px; margin-top: 0.1rem; color: #555;">
                                        <span>$0</span>
                                        <span id="paymentValue">$2.00</span>
                                        <span>$4</span>
                                    </div>
                                </div>
                            </div>
                            <!-- Confidence Question -->
                            <div style="margin-bottom: 0; text-align: center; width: 100%;">
                                <p style="font-weight: 600; margin-bottom: 12px; font-size: 17px; color: #222;">
                                    On a scale of 0–100, how confident are you in your willingness-to-pay choice?
                                </p>
                                <div style="margin: 0.1rem 0; width: 100%;">
                                    <input type="range" id="confidenceSlider" min="0" max="100" value="50" 
                                           style="width: 100%; accent-color: #1976d2; height: 4px; margin-bottom: 8px;" onchange="experiment.updateConfidence(this.value)">
                                    <div style="display: flex; justify-content: space-between; font-size: 13px; margin-top: 0.1rem; color: #555;">
                                        <span>0 (Not confident)</span>
                                        <span id="confidenceValue">50</span>
                                        <span>100 (Very confident)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style="text-align: center; margin-top: 32px;">
                            <small style="color: #666; display: block; margin-bottom: 10px; font-size: 15px;">
                                Image ${imageNumber} of ${totalImages}
                            </small>
                            <button onclick="experiment.submitPhase2Response()" class="next-button" id="submitBtn">
                                Continue
                            </button>
                        </div>
                    </div>
                </div>`;
                
            // Set initial values
            this.currentConfidence = 50;
            this.currentPaymentResponse = 2;
        } else if (step.type === 'attention') {
            this.showPhase2AttentionCheck(step.attentionIndex);
        }
    },

    showPhase2AttentionCheck(attentionIndex) {
        // Phase 2 uses questions 2, 3, and 4 (continuing after Phase 1)
        const questionIndex = attentionIndex + 2; // attentionIndex will be 0,1,2 → questions 2,3,4
        const question = this.attentionCheckQuestions[questionIndex];
        this.attentionCheckStartTime = Date.now();
        document.body.innerHTML = `
            <div class="main-container">
                <div class="instructions">
                    <h2>Attention Check</h2>
                    <div style="border: 1px solid #e5e5e5; padding: 2rem; border-radius: 4px; margin: 2rem 0; background: #fafafa;">
                        <p class="attention-question-prompt">
                            ${question.prompt}<br><span style='font-size: 15px; color: #555;'>${question.instruction}</span>
                        </p>
                        <div style="margin: 1rem 0;">
                            ${question.options.map((option, index) => `
                                <div style="margin: 0.5rem 0;">
                                    <label style="cursor: pointer; font-size: 16px;">
                                        <input type="radio" name="attentionResponse" value="${option}" style="margin-right: 0.5rem;">
                                        ${option}
                                    </label>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <button onclick="experiment.submitPhase2AttentionCheck(${attentionIndex})" class="next-button" id="submitAttentionBtn">
                        Continue
                    </button>
                </div>
            </div>`;
    },

    submitPhase2AttentionCheck(attentionIndex) {
        const selectedOption = document.querySelector('input[name="attentionResponse"]:checked');
        if (!selectedOption) {
            alert('Please select an answer to continue');
            return;
        }
        // Phase 2 uses questions 2, 3, and 4
        const questionIndex = attentionIndex + 2;
        const question = this.attentionCheckQuestions[questionIndex];
        const response = selectedOption.value;
        const correct = (response === question.correct_answer);
        const responseTime = (Date.now() - this.attentionCheckStartTime) / 1000;
        
        // Record attention check data (regardless of correctness)
        const attentionRow = [
            this.subjectId || 'unknown',      // participant_id
            'attention_check',                // entry_type
            this.currentPhase,                // phase
            '',                               // image_id
            '',                               // filename
            '',                               // image_size
            '',                               // image_type
            '',                               // memory_response
            '',                               // payment_response
            '',                               // confidence
            responseTime.toFixed(3),          // response_time
            this.escapeCSVField(question.id), // attention_check_id (escaped)
            this.escapeCSVField(response),    // attention_response (escaped)
            correct,                          // attention_correct
            '',                               // snack_preference
            '',                               // desire_to_eat
            '',                               // hunger
            '',                               // fullness
            '',                               // satisfaction
            '',                               // eating_capacity
            this.sessionId || '',             // session_id
            new Date().toISOString()          // timestamp
        ].join(',') + '\n';
        this.csvData.push(attentionRow);
        this.phase2TimelineIndex++;
        this.showNextPhase2Step();
    },

    submitPhase2Response() {
        // Get memory response
        const memoryResponse = document.querySelector('input[name="memory"]:checked');
        if (!memoryResponse) {
            alert('Please answer whether you have seen this image before');
            return;
        }
        // Get payment response from slider
        const paymentSlider = document.getElementById('paymentSlider');
        if (!paymentSlider || !this.paymentInteracted) {
            alert('Please set your payment amount using the slider');
            return;
        }
        // Check confidence slider interaction
        if (!this.sliderInteracted) {
            alert('Please set your confidence level using the slider');
            return;
        }
        const step = this.phase2Timeline[this.phase2TimelineIndex];
        const image = step.image;
        const responseTime = (Date.now() - this.imageQuestionStartTime) / 1000;
        
        // === DEBUG LOGGING ===
        console.log('=== PHASE2 RESPONSE DEBUG ===');
        console.log('Current phase2TimelineIndex:', this.phase2TimelineIndex);
        console.log('Recording phase2 response for image:', image);
        console.log('Total phase1Images loaded:', this.phase1Images?.length || 0);
        console.log('Total phase2Images loaded:', this.phase2Images?.length || 0);
        console.log('Phase1 image IDs:', this.phase1Images?.map(img => img.id) || []);
        console.log('Phase2 image IDs:', this.phase2Images?.map(img => img.id) || []);
        
        // Determine image type based on whether it was shown in phase1
        let imageType;
        const isOldImage = this.phase1Images.some(p1img => p1img.id === image.id);
        if (isOldImage) {
            imageType = 'old';
            console.log('✓ Identified as OLD image (was in phase1)');
        } else {
            imageType = 'new';
            console.log('✓ Identified as NEW image (not in phase1)');
        }
        
        console.log('Final image type:', imageType);
        console.log('Memory response:', memoryResponse.value);
        console.log('Payment response:', parseFloat(paymentSlider.value));
        console.log('Confidence:', this.currentConfidence);
        
        // Save response data in the requested CSV format
        const csvRow = [
            this.subjectId || 'unknown',      // participant_id
            'phase2_response',                // entry_type
            2,                                // phase
            image.id,                         // image_id
            this.escapeCSVField(image.filename), // filename (escaped)
            image.size,                       // image_size
            imageType,                        // image_type
            this.escapeCSVField(memoryResponse.value), // memory_response (escaped)
            parseFloat(paymentSlider.value),  // payment_response
            this.currentConfidence,           // confidence
            responseTime.toFixed(3),          // response_time
            '',                               // attention_check_id
            '',                               // attention_response
            '',                               // attention_correct
            '',                               // snack_preference
            '',                               // desire_to_eat
            '',                               // hunger
            '',                               // fullness
            '',                               // satisfaction
            '',                               // eating_capacity
            this.sessionId || '',             // session_id
            new Date().toISOString()          // timestamp
        ].join(',') + '\n';
        
        console.log('Generated CSV row:', csvRow);
        this.csvData.push(csvRow);
        console.log('csvData after phase2 push:', this.csvData);
        this.phase2TimelineIndex++;
        this.showNextPhase2Step();
    },

    updateConfidence(value) {
        this.currentConfidence = parseInt(value);
        this.sliderInteracted = true;
        document.getElementById('confidenceValue').textContent = value;
    },

    updatePayment(value) {
        this.currentPaymentResponse = parseFloat(value);
        this.paymentInteracted = true;
        // Format to show 2 decimal places for better readability
        const formattedValue = parseFloat(value).toFixed(2);
        document.getElementById('paymentValue').textContent = '$' + formattedValue;
    }
}); 