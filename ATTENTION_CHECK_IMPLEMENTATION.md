# Attention Check Download & Tracking Implementation

## Changes Made

### 1. Added Attention Check Collection to Database Configuration
**File**: `public/config.json`
- Added `attention_check_collection: "attention_checks"` to database configuration

### 2. Enhanced Server Download System
**File**: `server.js`

#### Added Attention Check Collection Support:
- Added attention check fields to `allowedFields` object
- Added attention check collection to download dashboard
- Added attention check case to `serveCsvResults` function
- Added attention check HTML download button with 🎯 icon

#### Added API Save Support:
- Extended `/api/save` endpoint to handle `attention_checks` collection
- Added JSON processing for attention check data
- Added validation for attention check entries

### 3. Enhanced Data Collection System
**File**: `public/js/experiment/DataCollector.js`

#### Added Attention Check Data Separation:
- Extended `saveDataToCollections` to separate attention check data
- Added `convertAttentionCheckToJSON` helper function
- Enhanced attention check data with question text and correct answer lookup
- Added attention check save logic to collection system

#### Attention Check Data Structure:
```javascript
{
    participant_id: string,
    phase: number,
    attention_check_id: string,
    question_text: string,          // NEW: Full question text
    attention_response: string,
    correct_answer: string,         // NEW: Expected correct answer
    is_correct: boolean,           // NEW: Whether response was correct
    response_time: number,
    session_id: string,
    timestamp: string
}
```

### 4. Removed Attention Check Answer Validation
**File**: `public/js/experiment/TrialManager.js`

#### Updated Behavior:
- **REMOVED**: Alert popup for incorrect answers
- **REMOVED**: Prevention of progression for wrong answers
- **KEPT**: Tracking of correct/incorrect responses in data
- **RESULT**: Users can now proceed regardless of their attention check answer

**Before**: 
```javascript
if (!correct) {
    alert('That is not the correct answer. Please try again.');
    return;
}
```

**After**:
```javascript
// Record attention check data (regardless of correctness)
```

### 5. Download Dashboard Enhancement
**Features Added**:
- New download button for attention checks
- Real-time count of attention check records
- CSV export with filename pattern: `image-valuation_attention_checks_YYYY-MM-DD.csv`

## Key Features

### ✅ Non-Blocking Attention Check Tracking
- **No validation barrier**: Users proceed regardless of answer correctness
- **Complete tracking**: All responses recorded with correctness flag
- **Seamless experience**: No interruptions to experiment flow
- **Data integrity**: Full tracking of response patterns maintained

### ✅ Attention Check Answer Tracking
- **`is_correct` field**: Tracks whether user chose the correct answer
- **Question text**: Full question prompt stored with each response
- **Correct answer**: Expected answer stored for analysis
- **Response validation**: Server-side validation ensures data integrity

### ✅ Separate Collection & Download
- **Dedicated collection**: `attention_checks` collection in MongoDB
- **Separate CSV export**: Independent download from other experiment data
- **Password protection**: Same security as other downloads

### ✅ Enhanced Data Analysis
- **Performance tracking**: Response times for each attention check
- **Question mapping**: Full question details linked to responses  
- **Phase tracking**: Shows which experiment phase the check occurred in
- **Session linking**: Connected to participant session for full data context

## Usage

### For Researchers:
1. Visit the download page (`/[experiment-url]/download` or `/download`)
2. Enter the admin password (`admin123`)
3. Click "🎯 Download Attention Checks" button
4. CSV file includes all attention check responses with validation data

### For Participants:
- Attention checks appear during the experiment as before
- Any answer choice is accepted - no wrong answer alerts
- Experiment continues seamlessly regardless of response
- All responses are tracked for research analysis

### CSV Output Columns:
- `participant_id`: Unique participant identifier
- `phase`: Experiment phase (1 or 2)
- `attention_check_id`: Question ID from config
- `question_text`: Full question prompt
- `attention_response`: User's selected answer
- `correct_answer`: Expected correct answer
- `is_correct`: TRUE/FALSE if response was correct
- `response_time`: Time taken to respond (seconds)
- `session_id`: Session identifier
- `timestamp`: When response was recorded

## Data Flow

1. **User encounters attention check** → Question displayed from config
2. **Response recorded** → TrialManager saves with timing & correctness (no validation)
3. **Experiment continues** → No blocking regardless of answer choice
4. **Data separation** → DataCollector separates by entry_type
5. **Enhanced processing** → Question text & correct answer added
6. **MongoDB storage** → Saved to dedicated attention_checks collection
7. **CSV export** → Available via download dashboard

## Testing Verification

To verify the implementation:
1. Run an experiment session with attention checks
2. Choose both correct and incorrect responses intentionally
3. Verify that experiment continues seamlessly in both cases
4. Complete the experiment and access download page
5. Download attention check CSV and verify all responses are tracked with correct `is_correct` values
