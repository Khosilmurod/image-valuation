/**
 * Pages.js - Image Valuation Experiment UI Pages
 * Handles welcome page, instructions, phase transitions, and final questions
 */

// Add page methods to the ImageValuationExperiment class
Object.assign(ImageValuationExperiment.prototype, {
    
    showWelcomePage() {
        document.body.innerHTML = `
            <div class="main-container">
                <div class="instructions">
                    <h2>Welcome to the Image Valuation Study</h2>
                    <div style="border: 1px solid #e5e5e5; padding: 2rem; border-radius: 4px; margin: 2rem 0; background: #fafafa;">
                        <p style="font-size: 18px; margin-bottom: 1rem;">
                            Thank you for participating in this research study.
                        </p>
                        <p>
                            This experiment consists of two phases where you will view food images and answer questions about them.
                        </p>
                        <p>
                            The entire study should take approximately 15-20 minutes to complete.
                        </p>
                    </div>
                    <p>Please enter your participant ID to begin:</p>
                    <div style="margin: 1rem 0;">
                        <input type="text" id="subjectIdInput" placeholder="Enter your ID..." 
                               style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; width: 200px; font-size: 16px;">
                    </div>
                    <button onclick="experiment.setSubjectIdAndStart()" class="next-button" id="startBtn">
                        Begin Experiment
                    </button>
                </div>
            </div>`;
        
        // Focus on input field
        document.getElementById('subjectIdInput').focus();
        
        // Allow Enter key to start
        document.getElementById('subjectIdInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.setSubjectIdAndStart();
            }
        });
    },

    setSubjectIdAndStart() {
        const subjectIdInput = document.getElementById('subjectIdInput');
        const subjectId = subjectIdInput.value.trim();
        
        if (!subjectId) {
            alert('Please enter your participant ID to continue.');
            subjectIdInput.focus();
            return;
        }
        
        this.subjectId = subjectId;
        console.log(`Subject ID set to: ${this.subjectId}`);
        
        // Start image preloading instead of going directly to Phase 1 instructions
        this.preloadImages();
    },

    showPhase1Instructions() {
        document.body.innerHTML = `
            <div class="main-container">
                <div class="instructions">
                    <h2>Phase 1: Image Viewing</h2>
                    <div style="border: 1px solid #e5e5e5; padding: 2rem; border-radius: 4px; margin: 2rem 0; background: #fafafa;">
                        <p style="font-size: 18px; margin-bottom: 1rem;">
                            In this phase, you will view ${this.experimentConfig.phase1.largeCount + this.experimentConfig.phase1.smallCount} food images.
                        </p>
                        <ul style="text-align: left; margin: 1rem 0; padding-left: 2rem;">
                            <li>Each image will be displayed for ${this.experimentConfig.imageDisplayDuration / 1000} seconds</li>
                            <li>Images will be shown in different sizes (${this.experimentConfig.phase1.largeCount} large, ${this.experimentConfig.phase1.smallCount} small)</li>
                            <li>Simply look at each image - no response is required</li>
                            ${this.experimentConfig.attentionChecks.enabled ? `<li>You will see ${this.experimentConfig.attentionChecks.phase1.count} attention check questions during this phase</li>` : ''}
                        </ul>
                        <p style="font-weight: bold; color: #333;">
                            Please pay attention to each image as you will see them again later.
                        </p>
                    </div>
                    <p>Press the button below when you're ready to begin Phase 1.</p>
                    <button onclick="experiment.startPhase1()" class="next-button">
                        Start Phase 1
                    </button>
                </div>
            </div>`;
    },

    showPhase2Instructions() {
        document.body.innerHTML = `
            <div class="main-container">
                <div class="instructions">
                    <h2>Phase 2: Memory and Valuation</h2>
                    <div style="border: 1px solid #e5e5e5; padding: 2rem; border-radius: 4px; margin: 2rem 0; background: #fafafa;">
                        <p style="font-size: 18px; margin-bottom: 1rem;">
                            You have finished looking through the test stimuli. Now you will see ${this.experimentConfig.phase2.oldImagesCount + this.experimentConfig.phase2.newImagesCount} images (${this.experimentConfig.phase2.oldImagesCount} old, ${this.experimentConfig.phase2.newImagesCount} new) and answer questions.
                        </p>
                        <p>For each image, you will answer three questions:</p>
                        <ul style="text-align: left; margin: 1rem 0; padding-left: 2rem;">
                            <li><strong>Memory:</strong> Have you seen this image before?</li>
                            <li><strong>Payment:</strong> How much are you willing to pay for this item?</li>
                            <li><strong>Confidence:</strong> How confident are you in your payment choice?</li>
                            ${this.experimentConfig.attentionChecks.enabled ? `<li><strong>Note:</strong> You will see ${this.experimentConfig.attentionChecks.phase2.count} attention check questions during this phase</li>` : ''}
                        </ul>
                        <p style="font-weight: bold; color: #333;">
                            Take your time - there is no time limit for this phase.
                        </p>
                    </div>
                    <p>Press the button below when you're ready to begin Phase 2.</p>
                    <button onclick="experiment.startPhase2()" class="next-button">
                        Start Phase 2
                    </button>
                </div>
            </div>`;
    },

    showFinalQuestionsPage() {
        document.body.innerHTML = `
            <div class="main-container">
                <div class="instructions">
                    <h2>Final Questions</h2>
                    <div style="border: 1px solid #e5e5e5; padding: 2rem; border-radius: 4px; margin: 2rem 0; background: #fafafa;">
                        <p style="font-size: 18px; margin-bottom: 1.5rem;">
                            Please answer these final questions about your preferences and current state.
                        </p>
                        
                        <!-- Snack Preference -->
                        <div style="margin-bottom: 2rem;">
                            <p style="font-weight: bold; margin-bottom: 0.5rem;">Do you prefer sweet or salty snacks?</p>
                            <div style="margin: 0.5rem 0;">
                                <label style="margin-right: 1rem;"><input type="radio" name="snackPref" value="neither"> Neither</label>
                                <label style="margin-right: 1rem;"><input type="radio" name="snackPref" value="both"> Both</label>
                                <label style="margin-right: 1rem;"><input type="radio" name="snackPref" value="salty"> Salty</label>
                                <label style="margin-right: 1rem;"><input type="radio" name="snackPref" value="sweet"> Sweet</label>
                            </div>
                        </div>

                        <!-- Desire to Eat -->
                        <div style="margin-bottom: 2rem;">
                            <p style="font-weight: bold; margin-bottom: 0.5rem;">How strong is your desire to eat right now?</p>
                            <div style="margin: 1rem 0;">
                                <input type="range" id="desireSlider" min="0" max="100" value="50" style="width: 100%;">
                                <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 0.25rem;">
                                    <span>Very weak</span>
                                    <span>Very strong</span>
                                </div>
                            </div>
                        </div>

                        <!-- Hunger -->
                        <div style="margin-bottom: 2rem;">
                            <p style="font-weight: bold; margin-bottom: 0.5rem;">How hungry do you feel?</p>
                            <div style="margin: 1rem 0;">
                                <input type="range" id="hungerSlider" min="0" max="100" value="50" style="width: 100%;">
                                <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 0.25rem;">
                                    <span>Not hungry at all</span>
                                    <span>As hungry as I've ever felt</span>
                                </div>
                            </div>
                        </div>

                        <!-- Fullness -->
                        <div style="margin-bottom: 2rem;">
                            <p style="font-weight: bold; margin-bottom: 0.5rem;">How full do you feel?</p>
                            <div style="margin: 1rem 0;">
                                <input type="range" id="fullnessSlider" min="0" max="100" value="50" style="width: 100%;">
                                <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 0.25rem;">
                                    <span>Not full at all</span>
                                    <span>Totally full</span>
                                </div>
                            </div>
                        </div>

                        <!-- Satisfaction -->
                        <div style="margin-bottom: 2rem;">
                            <p style="font-weight: bold; margin-bottom: 0.5rem;">How satisfied do you feel?</p>
                            <div style="margin: 1rem 0;">
                                <input type="range" id="satisfactionSlider" min="0" max="100" value="50" style="width: 100%;">
                                <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 0.25rem;">
                                    <span>Completely empty</span>
                                    <span>Cannot eat another bite</span>
                                </div>
                            </div>
                        </div>

                        <!-- Capacity to Eat -->
                        <div style="margin-bottom: 2rem;">
                            <p style="font-weight: bold; margin-bottom: 0.5rem;">How much do you think you can eat right now?</p>
                            <div style="margin: 1rem 0;">
                                <input type="range" id="capacitySlider" min="0" max="100" value="50" style="width: 100%;">
                                <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 0.25rem;">
                                    <span>Not at all</span>
                                    <span>A large amount</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <button onclick="experiment.submitFinalQuestions()" class="next-button" id="submitBtn">
                        Complete Experiment
                    </button>
                </div>
            </div>`;
    },

    submitFinalQuestions() {
        // Get snack preference
        const snackPref = document.querySelector('input[name="snackPref"]:checked');
        if (!snackPref) {
            alert('Please select your snack preference');
            return;
        }

        // Get slider values and validate they were moved from default
        const desireValue = document.getElementById('desireSlider').value;
        const hungerValue = document.getElementById('hungerSlider').value;
        const fullnessValue = document.getElementById('fullnessSlider').value;
        const satisfactionValue = document.getElementById('satisfactionSlider').value;
        const capacityValue = document.getElementById('capacitySlider').value;

        // Check if all sliders are still at default (50) - this might indicate user didn't interact
        const defaultValues = [desireValue, hungerValue, fullnessValue, satisfactionValue, capacityValue];
        const allDefaults = defaultValues.every(val => val === '50');
        
        if (allDefaults) {
            const confirmDefault = confirm('All your slider values are set to the middle position (50). Is this correct, or would you like to adjust them?');
            if (!confirmDefault) {
                return;
            }
        }

        // Collect all responses
        this.finalAnswers = {
            snackPreference: snackPref.value,
            desireToEat: parseInt(desireValue),
            hunger: parseInt(hungerValue),
            fullness: parseInt(fullnessValue),
            satisfaction: parseInt(satisfactionValue),
            eatingCapacity: parseInt(capacityValue)
        };

        // Add final questionnaire row to csvData (22-column format matching CSV headers)
        const row = [
            this.subjectId || 'unknown',       // participant_id
            'final_questionnaire',             // entry_type
            '',                                // phase
            '',                                // image_id
            '',                                // filename
            '',                                // image_size
            '',                                // image_type
            '',                                // memory_response
            '',                                // payment_response
            '',                                // confidence
            '',                                // response_time
            '',                                // attention_check_id
            '',                                // attention_response
            '',                                // attention_correct
            this.finalAnswers.snackPreference, // snack_preference
            this.finalAnswers.desireToEat,     // desire_to_eat
            this.finalAnswers.hunger,          // hunger
            this.finalAnswers.fullness,        // fullness
            this.finalAnswers.satisfaction,    // satisfaction
            this.finalAnswers.eatingCapacity,  // eating_capacity
            this.sessionId || '',              // session_id
            new Date().toISOString()           // timestamp
        ].join(',') + '\n';
        this.csvData.push(row);

        console.log('Final answers collected:', this.finalAnswers);
        
        // Add some visual feedback
        document.getElementById('submitBtn').innerHTML = 'Processing...';
        document.getElementById('submitBtn').disabled = true;
        
        this.finishExperiment();
    }
}); 