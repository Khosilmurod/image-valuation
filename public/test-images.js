/**
 * Image Loading Test - Validates all experiment images can be loaded
 * This test checks both old-images and new-images directories for loading issues
 */

class ImageLoadingTest {
    constructor() {
        this.config = null;
        this.results = {
            passed: [],
            failed: [],
            total: 0,
            summary: {}
        };
        this.testStartTime = null;
        this.testEndTime = null;
    }

    async init() {
        console.log('🧪 Starting Image Loading Test...');
        this.testStartTime = Date.now();
        
        try {
            // Load configuration
            const response = await fetch('/config.json');
            this.config = await response.json();
            console.log('✅ Configuration loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load configuration:', error);
            return false;
        }
        
        return true;
    }

    // Test a single image URL
    testImageLoad(imagePath, imageInfo) {
        return new Promise((resolve) => {
            const img = new Image();
            const startTime = Date.now();
            
            img.onload = () => {
                const loadTime = Date.now() - startTime;
                const result = {
                    path: imagePath,
                    status: 'success',
                    loadTime,
                    dimensions: { width: img.naturalWidth, height: img.naturalHeight },
                    ...imageInfo
                };
                this.results.passed.push(result);
                console.log(`✅ ${imagePath} (${loadTime}ms)`);
                resolve(result);
            };
            
            img.onerror = () => {
                const loadTime = Date.now() - startTime;
                const result = {
                    path: imagePath,
                    status: 'failed',
                    loadTime,
                    error: 'Failed to load image',
                    ...imageInfo
                };
                this.results.failed.push(result);
                console.error(`❌ ${imagePath} (${loadTime}ms)`);
                resolve(result);
            };
            
            // Set a timeout for very slow loading images
            setTimeout(() => {
                if (!img.complete) {
                    const result = {
                        path: imagePath,
                        status: 'timeout',
                        loadTime: 10000,
                        error: 'Image load timeout (10s)',
                        ...imageInfo
                    };
                    this.results.failed.push(result);
                    console.warn(`⏱️ ${imagePath} (timeout)`);
                    resolve(result);
                }
            }, 10000);
            
            img.src = imagePath;
        });
    }

    // Get all available images from directory using shared lists
    async getImagesFromDirectory(directory) {
        try {
            console.log(`🔍 Discovering images in ${directory} directory...`);
            
            // Use the shared image lists that the experiment uses
            const imageList = window.getImagesForDirectory(directory);
            
            if (!imageList || imageList.length === 0) {
                console.warn(`No images found for directory: ${directory}`);
                return [];
            }
            
            const knownImages = imageList.map((filename, index) => ({
                filename,
                id: index + 1,
                directory: directory
            }));
            
            console.log(`Found ${knownImages.length} images to test in ${directory}`);
            return knownImages;
            
        } catch (error) {
            console.error(`Failed to get images from ${directory}:`, error);
            return [];
        }
    }

    // Test URL encoding vs non-encoding
    async testUrlEncoding() {
        console.log('\n🔧 Testing URL Encoding...');
        
        const testFilename = '40.+Ina+Garten+Parmesan+Chive+Smashed+Potatoes+MD+NEW.jpg';
        const directory = 'new-images';
        
        console.log('Testing filename:', testFilename);
        
        // Test without encoding (should fail)
        const unencoded = `images/${directory}/${testFilename}`;
        console.log('❌ Unencoded URL:', unencoded);
        
        // Test with encoding (should work)
        const encoded = `images/${directory}/${encodeURIComponent(testFilename)}`;
        console.log('✅ Encoded URL:', encoded);
        
        // Test both
        const unencodedResult = await this.testImageLoad(unencoded, {
            filename: testFilename,
            encoding: 'none',
            directory
        });
        
        const encodedResult = await this.testImageLoad(encoded, {
            filename: testFilename, 
            encoding: 'encoded',
            directory
        });
        
        return { unencoded: unencodedResult, encoded: encodedResult };
    }

    // Run comprehensive test
    async runComprehensiveTest() {
        if (!await this.init()) {
            return;
        }
        
        console.log('\n🚀 Running Comprehensive Image Loading Test\n');
        
        // Test URL encoding first
        const encodingTest = await this.testUrlEncoding();
        
        // Test old-images directory
        console.log('\n📁 Testing old-images directory...');
        const oldImages = await this.getImagesFromDirectory('old-images');
        const oldImageTests = oldImages.map(img => {
            const encodedPath = `images/old-images/${encodeURIComponent(img.filename)}`;
            return this.testImageLoad(encodedPath, img);
        });
        
        // Test new-images directory
        console.log('\n📁 Testing new-images directory...');
        const newImages = await this.getImagesFromDirectory('new-images');
        const newImageTests = newImages.map(img => {
            const encodedPath = `images/new-images/${encodeURIComponent(img.filename)}`;
            return this.testImageLoad(encodedPath, img);
        });
        
        // Wait for all tests to complete
        const allTests = [...oldImageTests, ...newImageTests];
        this.results.total = allTests.length;
        
        console.log(`\n⏳ Testing ${this.results.total} images...`);
        await Promise.all(allTests);
        
        this.testEndTime = Date.now();
        this.generateReport();
    }

    // Generate test report
    generateReport() {
        const duration = this.testEndTime - this.testStartTime;
        const passRate = (this.results.passed.length / this.results.total * 100).toFixed(1);
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 IMAGE LOADING TEST REPORT');
        console.log('='.repeat(60));
        
        console.log(`⏱️  Test Duration: ${duration}ms`);
        console.log(`📈 Total Images Tested: ${this.results.total}`);
        console.log(`✅ Passed: ${this.results.passed.length}`);
        console.log(`❌ Failed: ${this.results.failed.length}`);  
        console.log(`📊 Pass Rate: ${passRate}%`);
        
        if (this.results.failed.length > 0) {
            console.log('\n❌ FAILED IMAGES:');
            this.results.failed.forEach(failure => {
                console.log(`   • ${failure.path}`);
                console.log(`     Error: ${failure.error}`);
                console.log(`     Directory: ${failure.directory || 'unknown'}`);
            });
        }
        
        // Performance summary
        if (this.results.passed.length > 0) {
            const loadTimes = this.results.passed.map(r => r.loadTime);
            const avgLoadTime = (loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length).toFixed(0);
            const maxLoadTime = Math.max(...loadTimes);
            const minLoadTime = Math.min(...loadTimes);
            
            console.log('\n⚡ PERFORMANCE SUMMARY:');
            console.log(`   Average Load Time: ${avgLoadTime}ms`);
            console.log(`   Fastest Load: ${minLoadTime}ms`);
            console.log(`   Slowest Load: ${maxLoadTime}ms`);
        }
        
        // Special character analysis
        const specialCharImages = this.results.passed.concat(this.results.failed)
            .filter(img => /[+',&\s]/.test(img.filename || img.path));
        
        if (specialCharImages.length > 0) {
            console.log('\n🔤 SPECIAL CHARACTER ANALYSIS:');
            console.log(`   Images with special characters: ${specialCharImages.length}`);
            specialCharImages.forEach(img => {
                const status = img.status === 'success' ? '✅' : '❌';
                console.log(`   ${status} ${img.filename || img.path}`);
            });
        }
        
        console.log('\n' + '='.repeat(60));
        
        // Recommendations
        if (this.results.failed.length > 0) {
            console.log('💡 RECOMMENDATIONS:');
            console.log('   • Ensure all image files exist in their respective directories');
            console.log('   • Check that filenames match exactly (case-sensitive)');
            console.log('   • Verify URL encoding is working for special characters');
            console.log('   • Consider renaming files with problematic characters');
        } else {
            console.log('🎉 All images loaded successfully! Your experiment should run smoothly.');
        }
    }

    // Quick test for specific images
    async quickTest(imagePaths) {
        if (!await this.init()) {
            return;
        }
        
        console.log('🔍 Quick Image Test');
        console.log('Testing paths:', imagePaths);
        
        const tests = imagePaths.map((path, index) => 
            this.testImageLoad(path, { id: index + 1, type: 'quick-test' })
        );
        
        await Promise.all(tests);
        
        console.log('\n📊 Quick Test Results:');
        console.log(`✅ Passed: ${this.results.passed.length}`);
        console.log(`❌ Failed: ${this.results.failed.length}`);
        
        return this.results;
    }
}

// Usage Examples:
// 
// 1. Run comprehensive test:
// const tester = new ImageLoadingTest();
// tester.runComprehensiveTest();
//
// 2. Quick test specific images:
// const tester = new ImageLoadingTest();
// tester.quickTest([
//     'images/new-images/40.%2BIna%2BGarten%2BParmesan%2BChive%2BSmashed%2BPotatoes%2BMD%2BNEW.jpg',
//     'images/old-images/test.jpg'
// ]);

// Auto-run if this script is loaded directly
if (typeof window !== 'undefined') {
    // Make available globally for browser console
    window.ImageLoadingTest = ImageLoadingTest;
    
    // Add convenience functions
    window.testAllImages = async () => {
        const tester = new ImageLoadingTest();
        await tester.runComprehensiveTest();
    };
    
    window.testImage = async (path) => {
        const tester = new ImageLoadingTest();
        await tester.quickTest([path]);
    };
    
    console.log('🧪 Image Loading Test loaded!');
    console.log('Usage:');
    console.log('  testAllImages()     - Run comprehensive test');
    console.log('  testImage("path")   - Test single image');
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageLoadingTest;
}
