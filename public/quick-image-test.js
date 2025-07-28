// Quick Image Test Loader
// Paste this into the browser console to load and run image tests

(async function loadAndRunImageTest() {
    console.log('🧪 Loading Image Test Script...');
    
    try {
        // Load the test script dynamically
        const script = document.createElement('script');
        script.src = '/test-images.js';
        document.head.appendChild(script);
        
        // Wait for script to load
        await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
        });
        
        console.log('✅ Test script loaded successfully');
        
        // Now run the comprehensive test
        console.log('🚀 Starting comprehensive image test...');
        const tester = new ImageLoadingTest();
        await tester.runComprehensiveTest();
        
    } catch (error) {
        console.error('❌ Failed to load or run image tests:', error);
        
        // Fallback: Manual image test
        console.log('🔄 Trying manual image test...');
        await manualImageTest();
    }
})();

// Fallback manual test function
async function manualImageTest() {
    console.log('📝 Manual Image Loading Test');
    console.log('Testing problematic images with special characters...');
    
    const testImages = [
        {
            path: 'images/new-images/40.+Ina+Garten+Parmesan+Chive+Smashed+Potatoes+MD+NEW.jpg',
            encoded: 'images/new-images/' + encodeURIComponent('40.+Ina+Garten+Parmesan+Chive+Smashed+Potatoes+MD+NEW.jpg'),
            name: 'Ina Garten Potatoes'
        },
        {
            path: 'images/new-images/42.+manousheh,+Lebanese+flatbread+topped+with+za_atar,+olive+oil,+and+sesame+seeds+MD+NEW.jpg',
            encoded: 'images/new-images/' + encodeURIComponent('42.+manousheh,+Lebanese+flatbread+topped+with+za_atar,+olive+oil,+and+sesame+seeds+MD+NEW.jpg'),
            name: 'Lebanese Flatbread'
        },
        {
            path: 'images/new-images/46.+Smoked+Meatball+&+Mushroom+Toast+MD+NEW.jpg',
            encoded: 'images/new-images/' + encodeURIComponent('46.+Smoked+Meatball+&+Mushroom+Toast+MD+NEW.jpg'),
            name: 'Meatball Toast'
        }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const testImage of testImages) {
        console.log(`\n🔍 Testing: ${testImage.name}`);
        console.log(`   Original: ${testImage.path}`);
        console.log(`   Encoded:  ${testImage.encoded}`);
        
        // Test the encoded version
        const result = await testSingleImage(testImage.encoded, testImage.name);
        if (result.success) {
            passed++;
            console.log(`   ✅ PASSED (${result.loadTime}ms)`);
        } else {
            failed++;
            console.log(`   ❌ FAILED (${result.error})`);
        }
    }
    
    console.log(`\n📊 Manual Test Results:`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📈 Pass Rate: ${(passed / (passed + failed) * 100).toFixed(1)}%`);
}

// Helper function to test a single image
function testSingleImage(imagePath, name) {
    return new Promise((resolve) => {
        const img = new Image();
        const startTime = Date.now();
        
        img.onload = () => {
            const loadTime = Date.now() - startTime;
            resolve({
                success: true,
                loadTime,
                dimensions: { width: img.naturalWidth, height: img.naturalHeight }
            });
        };
        
        img.onerror = () => {
            const loadTime = Date.now() - startTime;
            resolve({
                success: false,
                loadTime,
                error: 'Failed to load image'
            });
        };
        
        // Timeout after 5 seconds
        setTimeout(() => {
            if (!img.complete) {
                resolve({
                    success: false,
                    loadTime: 5000,
                    error: 'Timeout'
                });
            }
        }, 5000);
        
        img.src = imagePath;
    });
}
