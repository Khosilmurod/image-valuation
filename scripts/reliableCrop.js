const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function reliableCropImages() {
    const newImagesDir = './public/images/new-images';
    const outputDir = './public/images/new-images-final-cropped';
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const imageFiles = fs.readdirSync(newImagesDir).filter(file => 
        file.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)
    );
    
    console.log(`🎯 Reliable cropping for ${imageFiles.length} images...`);
    
    for (let i = 0; i < imageFiles.length; i++) {
        const filename = imageFiles[i];
        try {
            const inputPath = path.join(newImagesDir, filename);
            const outputPath = path.join(outputDir, filename);
            
            const image = sharp(inputPath);
            const originalMeta = await image.metadata();
            
            console.log(`\n📸 ${filename}`);
            console.log(`   Original: ${originalMeta.width}x${originalMeta.height}`);
            
            // Start with a conservative trim to remove obvious white padding
            const step1 = await image
                .trim({
                    background: { r: 250, g: 250, b: 250 }, // Very light gray/white
                    threshold: 25 // Conservative threshold
                })
                .toBuffer();
            
            const meta1 = await sharp(step1).metadata();
            console.log(`   Step 1:   ${meta1.width}x${meta1.height}`);
            
            // If significant padding was removed, try a slightly more aggressive pass
            const paddingRemoved = ((originalMeta.width * originalMeta.height) - (meta1.width * meta1.height)) / (originalMeta.width * originalMeta.height);
            
            let finalImage = step1;
            let finalMeta = meta1;
            
            if (paddingRemoved > 0.05) { // If more than 5% was padding
                console.log(`   🔍 Detected significant padding (${(paddingRemoved * 100).toFixed(1)}%), trying step 2...`);
                
                const step2 = await sharp(step1)
                    .trim({
                        background: { r: 245, g: 245, b: 245 },
                        threshold: 35
                    })
                    .toBuffer();
                
                const meta2 = await sharp(step2).metadata();
                console.log(`   Step 2:   ${meta2.width}x${meta2.height}`);
                
                // Only use step 2 if it's not too aggressive (didn't remove more than 50% total)
                const totalRemoved = ((originalMeta.width * originalMeta.height) - (meta2.width * meta2.height)) / (originalMeta.width * originalMeta.height);
                
                if (totalRemoved < 0.5) { // Safety check - don't remove more than 50%
                    finalImage = step2;
                    finalMeta = meta2;
                } else {
                    console.log(`   ⚠️  Step 2 too aggressive, keeping step 1`);
                }
            }
            
            // Save the final result
            await sharp(finalImage).toFile(outputPath);
            
            const totalReduction = ((originalMeta.width * originalMeta.height) - (finalMeta.width * finalMeta.height)) / (originalMeta.width * originalMeta.height) * 100;
            console.log(`   ✅ Final:   ${finalMeta.width}x${finalMeta.height} (${totalReduction.toFixed(1)}% reduction)`);
            
        } catch (error) {
            console.error(`❌ Error with ${filename}:`, error.message);
        }
    }
    
    console.log('\n🎉 Reliable cropping complete!');
}

reliableCropImages().catch(console.error);
