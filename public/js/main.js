/**
 * main.js - Image Valuation Experiment Entry Point
 * 
 * This is the MAIN file that starts the entire Image Valuation Experiment.
 * It initializes the experiment when the page loads.
 * 
 * File Dependencies (loaded in this order):
 * 1. Experiment.js     - Core experiment class
 * 2. Pages.js          - UI pages (welcome, instructions, phase transitions)
 * 3. TrialManager.js   - Phase management and flow
 * 4. DataCollector.js  - Data saving and export
 * 5. main.js           - THIS FILE (starts everything)
 */

// Initialize experiment when page loads
const experiment = new ImageValuationExperiment();
window.experiment = experiment;
document.addEventListener('DOMContentLoaded', () => {
    experiment.init();
}); 