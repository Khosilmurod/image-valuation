# Attention Check Question Distribution

## Current Implementation - NO REPEATS

### Phase 1 (Image Viewing Phase)
- **2 attention checks** at trial positions 35 and 70
- **Questions used:**
  - Position 35: Question #1 (attentionIndex 0 → questionIndex 0)
  - Position 70: Question #2 (attentionIndex 1 → questionIndex 1)

### Phase 2 (Memory & Valuation Phase)  
- **3 attention checks** at trial positions 40, 80, and 120
- **Questions used:**
  - Position 40: Question #3 (attentionIndex 0 → questionIndex 2)
  - Position 80: Question #4 (attentionIndex 1 → questionIndex 3)
  - Position 120: Question #5 (attentionIndex 2 → questionIndex 4)

### Total Distribution
- **5 unique questions used across entire experiment**
- **NO REPEATED QUESTIONS** between or within phases
- Each participant sees exactly 5 different attention checks

### Question Mapping
1. Question #1: "If 2+2=4, how many sides does a standard rectangle have? Please select 5..."
2. Question #2: "What color do you get when you mix red and white? Please select 'Blue'..."
3. Question #3: "What day comes after Sunday? Please select 'Tuesday'..."
4. Question #4: "How many days are in a week? Please select '7'..."
5. Question #5: "Which animal is known as the 'King of the Jungle'? Please select 'Dog'..."

## Fixed Implementation
- Phase 1: `questionIndex = attentionIndex` (uses 0, 1)
- Phase 2: `questionIndex = attentionIndex + 2` (uses 2, 3, 4)

**Result: ✅ No attention check questions are repeated across the entire experiment.**
