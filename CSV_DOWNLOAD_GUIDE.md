# CSV Download System Guide

## Overview
The experiment now provides **three separate CSV downloads** for different phases of data collection, making it easier for researchers to analyze specific aspects of the experiment.

## How to Access Downloads

1. **Navigate to the protected URL** (provided by the research team)
2. **Enter the access password** when prompted
3. **Choose your download** from the three available options

## Available Downloads

### 📸 Phase 1 Data (Image Viewing)
**Filename**: `image-valuation_phase1_YYYY-MM-DD.csv`

**Fields Included**:
- `participant_id` - Unique participant identifier
- `phase` - Phase number (1)
- `image_id` - Image identifier
- `filename` - Image filename
- `image_size` - Image size (large/small)
- `response_time` - Time image was displayed
- `session_id` - Session identifier
- `timestamp` - When the data was recorded

**Use For**: Analyzing image viewing behavior during passive viewing

---

### 🧠 Phase 2 Data (Memory & Valuation)
**Filename**: `image-valuation_phase2_YYYY-MM-DD.csv`

**Fields Included**:
- `participant_id` - Unique participant identifier
- `phase` - Phase number (2)
- `image_id` - Image identifier
- `filename` - Image filename
- `image_size` - Image size (all medium in Phase 2)
- `image_type` - Whether image is "old" (from Phase 1) or "new"
- `memory_response` - "yes"/"no" for "Have you seen this before?"
- `payment_response` - Dollar amount willing to pay (0-4)
- `confidence` - Confidence in payment choice (0-100)
- `response_time` - Time taken to complete all questions
- `session_id` - Session identifier
- `timestamp` - When the data was recorded

**Use For**: Memory performance analysis, valuation behavior, confidence ratings

---

### 📋 Final Questionnaire
**Filename**: `image-valuation_final_questionnaire_YYYY-MM-DD.csv`

**Fields Included**:
- `participant_id` - Unique participant identifier
- `snack_preference` - "sweet"/"salty"/"both"/"neither"
- `desire_to_eat` - Current desire to eat (0-100)
- `hunger` - Current hunger level (0-100)
- `fullness` - Current fullness level (0-100)
- `satisfaction` - Current satisfaction level (0-100)
- `eating_capacity` - How much they can eat right now (0-100)
- `session_id` - Session identifier
- `timestamp` - When the questionnaire was completed

**Use For**: Understanding participant state, controlling for hunger/satiation effects

## Features

### Real-Time Record Counts
The download page shows how many records are available in each collection, updated in real-time.

### Smart Button States
- **Enabled**: Green buttons when data is available
- **Disabled**: Gray buttons when no data exists for that phase

### Password Protection
All downloads require the same password that protects the main results page.

### Automatic Filename Generation
Files are automatically named with the current date for easy organization.

## Data Analysis Tips

1. **Join Data**: Use `participant_id` and `session_id` to join data across phases
2. **Filter by Phase**: Phase 2 data includes both old and new images - filter by `image_type` as needed
3. **Data Quality**: Review response times and confidence ratings for data quality assessment
4. **Timing Analysis**: Use `response_time` fields for reaction time analyses
5. **Session Tracking**: `session_id` allows tracking of individual experiment sessions

## Troubleshooting

- **No Download Button**: If a button is grayed out, no data exists for that phase yet
- **Empty Files**: Check that participants have completed the respective phase
- **Password Issues**: Contact the research team if password doesn't work
- **File Format**: All files are standard CSV format compatible with Excel, R, Python, etc.

---

*Last Updated: [Current Date]*
*For technical support, contact the development team.* 