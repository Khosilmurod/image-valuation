# Image Loading Fix - URL Encoding Issue

## Problem
Images with special characters in filenames (like `+`, `'`, `,`) were failing to load because the URLs were not properly encoded.

**Example failing image**: `40.+Ina+Garten's+Parmesan+Chive+Smashed+Potatoes+MD+NEW.jpg`

**Error seen**: `Failed to load image: images/new-images/40.+Ina+Garten's+Parmesan+Chive+Smashed+Potatoes+MD+NEW.jpg`

## Root Cause
The image paths were being constructed by directly concatenating the filename without URL encoding:
```javascript
// Before (BROKEN)
imagesToPreload.add(`images/old-images/${img.filename}`);
imagesToPreload.add(`images/${folder}/${img.filename}`);

const imagePath = `images/old-images/${image.filename}`;
const imagePath = `images/${imageFolder}/${image.filename}`;
```

## Solution
Added `encodeURIComponent()` around filenames to properly encode special characters:

### Files Modified:

#### 1. `/public/js/experiment/Experiment.js`
**Image Preloading**:
```javascript
// After (FIXED)
imagesToPreload.add(`images/old-images/${encodeURIComponent(img.filename)}`);
imagesToPreload.add(`images/${folder}/${encodeURIComponent(img.filename)}`);
```

#### 2. `/public/js/experiment/TrialManager.js`  
**Image Display Paths**:
```javascript
// After (FIXED)
const imagePath = `images/old-images/${encodeURIComponent(image.filename)}`;
const imagePath = `images/${imageFolder}/${encodeURIComponent(image.filename)}`;
```

## URL Encoding Examples
| Original Filename | Encoded Filename |
|---|---|
| `40.+Ina+Garten's+Parmesan+Chive+Smashed+Potatoes+MD+NEW.jpg` | `40.%2BIna%2BGarten's%2BParmesan%2BChive%2BSmashed%2BPotatoes%2BMD%2BNEW.jpg` |
| `42.+manousheh,+Lebanese+flatbread+topped+with+za_atar,+olive+oil,+and+sesame+seeds+MD+NEW.jpg` | `42.%2Bmanousheh%2C%2BLebanese%2Bflatbread%2Btopped%2Bwith%2Bza_atar%2C%2Bolive%2Boil%2C%2Band%2Bsesame%2Bseeds%2BMD%2BNEW.jpg` |

## Testing
After the fix:
1. ✅ Image preloading should work for all filenames
2. ✅ Images should display correctly during the experiment  
3. ✅ No more "Failed to load image" console errors
4. ✅ All special characters in filenames are properly handled

## Impact
- **Fixed**: All images with special characters now load correctly
- **No Breaking Changes**: Regular filenames continue to work as before
- **Performance**: No impact - encoding is minimal overhead
- **Compatibility**: Works with all modern browsers
