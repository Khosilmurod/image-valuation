// Advanced filename diagnostic test
// This will test multiple apostrophe variations

(async function advancedDiagnosis() {
    console.log('🔍 Advanced Filename Diagnosis');
    console.log('Testing different apostrophe characters...\n');
    
    const baseFilename = '40.+Ina+Garten';
    const endFilename = 's+Parmesan+Chive+Smashed+Potatoes+MD+NEW.jpg';
    
    const apostropheVariations = [
        { name: 'Straight apostrophe', char: '\'' },
        { name: 'Smart quote (right)', char: ''' },
        { name: 'Smart quote (left)', char: ''' },
        { name: 'Grave accent', char: '`' },
        { name: 'Acute accent', char: '´' }
    ];
    
    console.log('Apostrophe variations to test:');
    apostropheVariations.forEach((variation, index) => {
        console.log(`${index + 1}. ${variation.name}: "${variation.char}" (Unicode: U+${variation.char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')})`);
    });
    
    console.log('\n🧪 Testing each variation:');
    
    let successful = [];
    
    for (const variation of apostropheVariations) {
        const filename = baseFilename + variation.char + endFilename;
        const url = `images/new-images/${encodeURIComponent(filename)}`;
        
        console.log(`\nTesting ${variation.name}:`);
        console.log(`  Filename: ${filename}`);
        console.log(`  URL: ${url}`);
        
        const result = await new Promise((resolve) => {
            const img = new Image();
            const start = Date.now();
            
            img.onload = () => {
                const time = Date.now() - start;
                console.log(`  ✅ SUCCESS! (${time}ms) - ${img.naturalWidth}x${img.naturalHeight}`);
                successful.push({
                    variation: variation.name,
                    char: variation.char,
                    filename,
                    loadTime: time
                });
                resolve(true);
            };
            
            img.onerror = () => {
                const time = Date.now() - start;
                console.log(`  ❌ Failed (${time}ms)`);
                resolve(false);
            };
            
            setTimeout(() => {
                console.log(`  ⏱️ Timeout`);
                resolve(false);
            }, 3000);
            
            img.src = url;
        });
    }
    
    console.log('\n📊 RESULTS:');
    if (successful.length > 0) {
        console.log('✅ Successful variations:');
        successful.forEach(s => {
            console.log(`  • ${s.variation}: "${s.char}" (${s.loadTime}ms)`);
            console.log(`    Filename: ${s.filename}`);
        });
        
        if (successful.length === 1) {
            console.log('\n💡 SOLUTION:');
            console.log(`Update your code to use: ${successful[0].char}`);
            console.log(`Correct filename: ${successful[0].filename}`);
        } else {
            console.log('\n⚠️ Multiple variations work - use the first one');
        }
    } else {
        console.log('❌ No variations worked');
        console.log('💡 The issue might be:');
        console.log('  • File doesn\'t exist');
        console.log('  • Different character encoding');
        console.log('  • Server configuration issue');
    }
})();
