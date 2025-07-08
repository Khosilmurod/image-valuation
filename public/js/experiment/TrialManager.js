/**
 * TrialManager.js - Image Valuation Phase Management
 * Handles Phase 1 (passive viewing) and Phase 2 (memory/valuation) management
 */

// Add trial management methods to the ImageValuationExperiment class
Object.assign(ImageValuationExperiment.prototype, {
    
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
            // Show image
            const imageSize = this.experimentConfig.imageSizes[image.size];
            document.body.innerHTML = `
                <div class="main-container" style="display: flex; align-items: center; justify-content: center; min-height: 100vh;">
                    <div style="text-align: center;">
                        <img src="images/old-images/${image.filename}"
                             alt="Food image ${image.id}"
                             style="max-width: ${imageSize}; max-height: ${imageSize}; width: auto; height: auto; display: block; margin: 0 auto; border-radius: 0; box-shadow: none; background: none;"
                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4gPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2Y1ZjVmNSIvPiA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPkZvb2QgJHtpbWFnZS5pZH08L3RleHQ+IDwvc3ZnPg==';">
                        <div style="margin-top: 18px; font-size: 17px; color: #444; font-family: Arial, sans-serif; letter-spacing: 0.01em;">Actual size: 10 cm × 10 cm | 300 kcal</div>
                        <div style="margin-top: 12px; font-size: 16px; color: #888;">Image ${imageNumber} of ${totalImages}</div>
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
        const question = this.attentionCheckQuestions[attentionIndex];
        this.attentionCheckStartTime = Date.now();
        document.body.innerHTML = `
            <div class="main-container">
                <div class="instructions">
                    <h2>Attention Check</h2>
                    <div style="border: 1px solid #e5e5e5; padding: 2rem; border-radius: 4px; margin: 2rem 0; background: #fafafa;">
                        <p style="font-size: 18px; margin-bottom: 1.5rem;">
                            ${question.prompt}
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
        const question = this.attentionCheckQuestions[attentionIndex];
        const response = selectedOption.value;
        const correct = (response === question.correct_answer);
        const responseTime = (Date.now() - this.attentionCheckStartTime) / 1000;
        if (!correct) {
            alert('That is not the correct answer. Please try again.');
            return;
        }
        // Record attention check data
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
            question.id,                      // attention_check_id
            response,                         // attention_response
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
            image.filename,                   // filename
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
            const imageSize = this.experimentConfig.imageSizes[image.size];
            const imageFolder = image.isOld ? 'old-images' : 'new-images';
            // Calculate image number (exclude attention checks)
            const imageNumber = this.phase2Timeline.slice(0, this.phase2TimelineIndex + 1).filter(s => s.type === 'image').length;
            const totalImages = this.phase2Images.length;
            document.body.innerHTML = `
                <div class="main-container" style="display: flex; flex-direction: column; align-items: center; min-height: 100vh;">
                    <div class="instructions" style="width: 100%; max-width: 600px; margin: 0 auto;">
                        <div style="text-align: center; margin-bottom: 32px;">
                            <img src="images/${imageFolder}/${image.filename}"
                                 alt="Food image ${image.id}"
                                 style="max-width: ${imageSize}; max-height: ${imageSize}"
                                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4gPHJlY3Qgd2lkdD0iMTAwJSIgZmlsbD0iI2Y1ZjVmNSIvPiA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPkZvb2QgJHtpbWFnZS5pZH08L3RleHQ+IDwvc3ZnPg==';">
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 36px; align-items: center;">
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
                                <div style="display: flex; gap: 18px; justify-content: center;">
                                    <label style="cursor: pointer; font-size: 16px;">
                                        <input type="radio" name="payment" value="0" style="margin-right: 0.5rem;"> $0
                                    </label>
                                    <label style="cursor: pointer; font-size: 16px;">
                                        <input type="radio" name="payment" value="1" style="margin-right: 0.5rem;"> $1
                                    </label>
                                    <label style="cursor: pointer; font-size: 16px;">
                                        <input type="radio" name="payment" value="2" style="margin-right: 0.5rem;"> $2
                                    </label>
                                    <label style="cursor: pointer; font-size: 16px;">
                                        <input type="radio" name="payment" value="3" style="margin-right: 0.5rem;"> $3
                                    </label>
                                    <label style="cursor: pointer; font-size: 16px;">
                                        <input type="radio" name="payment" value="4" style="margin-right: 0.5rem;"> $4
                                    </label>
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
        } else if (step.type === 'attention') {
            this.showPhase2AttentionCheck(step.attentionIndex);
        }
    },

    showPhase2AttentionCheck(attentionIndex) {
        const question = this.attentionCheckQuestions[attentionIndex];
        this.attentionCheckStartTime = Date.now();
        document.body.innerHTML = `
            <div class="main-container">
                <div class="instructions">
                    <h2>Attention Check</h2>
                    <div style="border: 1px solid #e5e5e5; padding: 2rem; border-radius: 4px; margin: 2rem 0; background: #fafafa;">
                        <p style="font-size: 18px; margin-bottom: 1.5rem;">
                            ${question.prompt}
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
        const question = this.attentionCheckQuestions[attentionIndex];
        const response = selectedOption.value;
        const correct = (response === question.correct_answer);
        const responseTime = (Date.now() - this.attentionCheckStartTime) / 1000;
        if (!correct) {
            alert('That is not the correct answer. Please try again.');
            return;
        }
        // Record attention check data
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
            question.id,                      // attention_check_id
            response,                         // attention_response
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
        // Get payment response
        const paymentResponse = document.querySelector('input[name="payment"]:checked');
        if (!paymentResponse) {
            alert('Please select how much you are willing to pay');
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
        // Save response data in the requested CSV format
        const csvRow = [
            this.subjectId || 'unknown',      // participant_id
            'phase2_response',                // entry_type
            2,                                // phase
            image.id,                         // image_id
            image.filename,                   // filename
            image.size,                       // image_size
            image.isOld ? 'old' : 'new',      // image_type
            memoryResponse.value,             // memory_response
            parseInt(paymentResponse.value),  // payment_response
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
        this.csvData.push(csvRow);
        console.log('csvData after phase2 push:', this.csvData);
        this.phase2TimelineIndex++;
        this.showNextPhase2Step();
    },

    updateConfidence(value) {
        this.currentConfidence = parseInt(value);
        this.sliderInteracted = true;
        document.getElementById('confidenceValue').textContent = value;
    }
}); 