// Diagnostic test for the failing image
// Copy and paste this into the browser console

(async function diagnoseImage() {
    console.log('🔍 Diagnosing the failing image...');
    
    const actualFilename = '40.+Ina+Garten+Parmesan+Chive+Smashed+Potatoes+MD+NEW.jpg';
    const filenameWithSpace = '40. +Ina+Garten+Parmesan+Chive+Smashed+Potatoes+MD+NEW.jpg';
    
    console.log('Testing different variations:');
    console.log('1. Without space after dot:', actualFilename);
    console.log('2. With space after dot:', filenameWithSpace);
    
    const testCases = [
        {
            name: 'Without space (current test)',
            filename: actualFilename,
            url: `images/new-images/${encodeURIComponent(actualFilename)}`
        },
        {
            name: 'With space (likely correct)',
            filename: filenameWithSpace,
            url: `images/new-images/${encodeURIComponent(filenameWithSpace)}`
        }
    ];
    
    for (const testCase of testCases) {
        console.log(`\n🧪 Testing: ${testCase.name}`);
        console.log(`   Filename: ${testCase.filename}`);
        console.log(`   URL: ${testCase.url}`);
        
        const result = await new Promise((resolve) => {
            const img = new Image();
            const start = Date.now();
            
            img.onload = () => {
                const time = Date.now() - start;
                console.log(`   ✅ SUCCESS (${time}ms) - ${img.naturalWidth}x${img.naturalHeight}`);
                resolve(true);
            };
            
            img.onerror = () => {
                const time = Date.now() - start;
                console.log(`   ❌ FAILED (${time}ms)`);
                resolve(false);
            };
            
            img.src = testCase.url;
        });
    }
    
    console.log('\n💡 If the "With space" version works, the issue is in your CSV/image data.');
    console.log('   Check your CSV file for the correct filename format.');
})();
