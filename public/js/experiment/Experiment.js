/**
 * Image Valuation Experiment - Main Class
 * Core experiment class definition with constructor and initialization
 */

class ImageValuationExperiment {
    constructor() {
        this.currentPhase = 1;
        this.currentImageIndex = 0;
        this.phase1Images = [];
        this.phase2Images = [];
        this.attentionCheckCounter = 0;
        this.csvData = [];
        this.experimentConfig = null;
        this.attentionCheckQuestions = null;
        this.subjectId = null;

        // Phase 1 state
        this.phase1StartTime = null;
        this.imageDisplayStartTime = null;
        
        // Phase 2 state  
        this.phase2StartTime = null;
        this.currentMemoryResponse = null;
        this.currentPaymentResponse = null;
        this.currentConfidence = null;
        this.sliderInteracted = false;
        this.imageQuestionStartTime = null;
        
        // Attention check state
        this.attentionCheckStartTime = null;
        
        // Final questions state
        this.finalAnswers = {};
        
        // Session tracking
        this.sessionId = `ses_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.sessionStartTime = new Date().toISOString();
        
        // Image preloading
        this.preloadedImages = {};
        this.imagesLoaded = false;
        
        console.log(`Experiment initialized with session ID: ${this.sessionId}`);
    }

    async init() {
        try {
            console.log('Loading experiment configuration...');
            const response = await fetch('/config.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const config = await response.json();
            this.experimentConfig = config.experimentConfig;
            this.attentionCheckQuestions = config.attentionCheckQuestions;
            
            console.log('Configuration loaded successfully:', {
                phase1Images: this.experimentConfig.phase1Images,
                phase2Images: this.experimentConfig.phase2Images,
                attentionChecks: this.experimentConfig.attentionChecks,
                questionsAvailable: this.attentionCheckQuestions.length
            });
            
            this.generateImageArrays();
            this.showWelcomePage();
        } catch (error) {
            console.error("Could not load experiment configuration:", error);
            this.showError("Could not load experiment configuration. Please contact the researcher.");
        }
    }

    generateImageArrays() {
        const phase1Config = this.experimentConfig.phase1;
        const phase2Config = this.experimentConfig.phase2;
        
        // Phase 1: Random selection from old-images with size distribution
        this.phase1Images = [];
        const oldImageFiles = this.getImageFilesFromFolder('old-images');
        const shuffledOldImages = this.shuffleArray([...oldImageFiles]);
        
        // Create large images
        for (let i = 0; i < phase1Config.largeCount; i++) {
            this.phase1Images.push({
                id: i + 1,
                filename: shuffledOldImages[i],
                size: 'large',
                phase: 1,
                originalIndex: i
            });
        }
        
        // Create small images
        for (let i = 0; i < phase1Config.smallCount; i++) {
            this.phase1Images.push({
                id: phase1Config.largeCount + i + 1,
                filename: shuffledOldImages[phase1Config.largeCount + i],
                size: 'small',
                phase: 1,
                originalIndex: phase1Config.largeCount + i
            });
        }
        
        // Shuffle Phase 1 images to mix large and small randomly
        this.phase1Images = this.shuffleArray([...this.phase1Images]);
        
        // Phase 2: Equal amounts of old images (from Phase 1) + new images, all medium size
        this.phase2Images = [];
        
        // Add old images from Phase 1 (all medium size)
        const phase1SelectedImages = [...this.phase1Images];
        for (let i = 0; i < phase2Config.oldImagesCount; i++) {
            this.phase2Images.push({
                ...phase1SelectedImages[i],
                size: 'medium', // Override size to medium for Phase 2
                phase: 2,
                isOld: true
            });
        }
        
        // Add new images from new-images folder (all medium size)
        const newImageFiles = this.getImageFilesFromFolder('new-images');
        const shuffledNewImages = this.shuffleArray([...newImageFiles]);
        
        for (let i = 0; i < phase2Config.newImagesCount; i++) {
            this.phase2Images.push({
                id: phase1Config.imagesPerTrial + i + 1,
                filename: shuffledNewImages[i],
                size: 'medium',
                phase: 2,
                isOld: false
            });
        }
        
        // Shuffle Phase 2 images
        this.phase2Images = this.shuffleArray([...this.phase2Images]);
        
        const phase1Total = phase1Config.largeCount + phase1Config.smallCount;
        const phase2Total = phase2Config.oldImagesCount + phase2Config.newImagesCount;
        console.log(`Generated ${this.phase1Images.length} Phase 1 images (${phase1Config.largeCount} large, ${phase1Config.smallCount} small) and ${this.phase2Images.length} Phase 2 images (${phase2Config.oldImagesCount} old, ${phase2Config.newImagesCount} new, all medium)`);
        console.log('Phase 1 images:', this.phase1Images.map(img => `${img.filename}(${img.size})`));
        console.log('Phase 2 images:', this.phase2Images.map(img => `${img.filename}(${img.isOld ? 'old' : 'new'})`));
    }

    getImageFilesFromFolder(folderName) {
        // This is a simplified approach - in a real implementation, you might want to
        // fetch the file list from the server or have it pre-defined
        // For now, we'll use a basic approach with common image extensions
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        
        // Since we can't dynamically read the folder, we'll need to handle this differently
        // For now, let's create a mapping based on the folder structure we observed
        const imageMappings = {
            'old-images': [
                '1.+4th+of+July++Drink+LG.jpg', '2.+Apple+Pie+Ice+Cream+Sandwiches+LG.jpg',
                '3.+Asian+Chicken+Salad+in+Crispy+Wonton+Cups+LG.jpg', '4.+Bourbon+Peaches+and+Cream+Popsicles+LG.jpg',
                '5.+Carrot+Cream+Cake+LG.jpg', '6.+Chicken+Florentine+Lazy+Lasagna+LG.jpg',
                '7.+Chocolate+Éclair+Cake+LG.jpg', '8.+cola-marinated+flank+steak+slices+and+Frito+chilaquiles+LG.jpg',
                '9.+French+onion+soup+LG.jpg', '10.+Fresh+Fruit+Frangipane+Tart+LG.jpg',
                '11.+fried+Nutella+banana+hand+pies+LG.jpg', '12.+Fruit+Cake+LG.jpg',
                '13.+fruit+salad.jpg', '14.+goi+cuon+(Vietnamese+summer+rolls)+LG.jpg',
                '15.+Greek+Panini+LG.jpg', '16.+Mexican+Haystacks+LG.jpg',
                '17.+okonomiyaki,+a+Japanese+savory+pancake+made+with+cabbage,+batter,+and+topped+with+bonito+flakes,.jpg',
                '18.+Pecan+Pie+LG.jpg', '19.+Poached+Pears+Belle+Helene+LG.jpg',
                '20.+Pomegranate,+Kale,+and+Wild+Rice+Salad+with+Walnuts+and+Feta+LG.jpg',
                '21.+Powdered+Chocolate+Cake+LG.jpg', '22.+purple+cake+LG.jpg',
                '23.+Quick+Boozy+Raspberry+Sauce+and+Cream+Puffs+LG.jpg', '24.+Smørrebrød,+an+open-faced+Danish+sandwich+LG.jpg',
                '25.+toasted+marshmallows+infused+with+bourbon+LG.jpg', '63.+watermelon+drink+3++1++no+letters.jpg',
                '79.+biscuit+snack+2+color.jpg', 'Apple+shortcake+2.jpg', 'Assorted+chips.jpg',
                'Baklava+2.jpg', 'Banana+coconut+pudding.jpg', 'Biltong+1.jpg',
                'Bingsu+1.jpg', 'Blueberry+lemonade+slushies+1.jpg', 'Botamochi.jpg',
                'Brioche+con+gelato+2.jpg', 'Chicken+pot+pie.jpg', 'Chocolate+chips,+ginger,+and+snickerdoodle+flavors+.jpg',
                'Chocolate+coconut+pie+with+dalgona+coffee+topping+1.jpg', 'Colorful+pork+buns.jpg', 'Cookie+apple+cream+puffs+2.jpg',
                'Cornpuffs.jpg', 'Crepe+2.jpg', 'Donut+milkshake+2.jpg',
                'Greek+pear+jelly+dusted+with+powdered+sugar.jpg', 'Honey+lavander+cookie+2.jpg', 'Ice+cream.jpg',
                'Indian+trail+mix.jpg', 'Ispahan,+a+rose+flavored+macaron+with+fresh+raspberries+2.jpg', 'Japanese+strawberry+shortcake+2.jpg',
                'Kahlua+brownie+pie+1.jpg', 'Korean+coffee++1.jpg', 'Lamingtons+2.jpg',
                'Machata+toffee.jpg', 'Matcha+basque+cheesecake+1.jpg', 'Mille+crepe+cake+1.jpg',
                'Mont+blanc+1.jpg', 'Mugwort+desserts++2.jpg', 'New+colorful+snowballs.jpg',
                'New+honey+bun.jpg', 'New+lemon+bars.jpg', 'New+vanilla+cookie.jpg',
                'Pepero+cake+1.jpg', 'Pièces+du+gâteau+2.jpg', 'Pineapple+green+smoothie+1.jpg',
                'Pizza+monkey+bread+1.jpg', 'Polar+bear+themed+cupcake.jpg', 'Rakugan+1.jpg',
                'Round+salty+finnish+licorice.jpg', 'Saltedcaramelapplemarshmallows+1.jpg', 'Slow+cooker+cheddar+bacon+beer+dip+1.jpg',
                'Strawberry,+cherry,+cream,+chocolate,+and+almond+butter+wafers.jpg', 'Sweet+glazed+colorful+dumplings.jpg', 'Sweet+salty+energy+bites+1.jpg',
                'Tim+tams+2.jpg', 'churro.jpg'
            ],
            'new-images': [
                '26.+arepas++MD+NEW.jpg',
                '27.+Bacon,+Egg,+and+Cheese+Eggo+Waffle+Sandwich+NEW.jpg',
                '28.+Blackberry+Lemon+Cheesecake+Bars+MD+NEW.jpg',
                '29.+Buffalo+Chicken+Salad+Puffs+MD+NEW.jpg',
                '30.+Cheesecake+Cake+Batter+Dip+MD+NEW.jpg',
                '31.+Chicken+Florentine+Calzones+MD+NEW.jpg',
                '32.+Chocolate-Dipped+Coffee+Ice+Cream+Glazed-Doughnut+Sandwiches+MD+NEW.jpg',
                '33.+Cinnamon+Roll+Waffles+MD+NEW.jpg',
                '34.+cream-stuffed+chocolate+chip+cookies+MD+NEW.jpg',
                '35.+Egyptian+koshary+MD+NEW.jpg',
                '36.+fruit+cream+pie+MD+new.jpg',
                '37.+graham+crackers+MD+NEW.jpg',
                '39.+ice+cream+sandwich+MD+NEW.jpg',
                '40.+Ina+Garten\'s+Parmesan+Chive+Smashed+Potatoes+MD+NEW.jpg',
                '41.+Macaroni+and+Cheese+Pie+with+a+Bacon+Lattice+New.jpg',
                '42.+manousheh,+Lebanese+flatbread+topped+with+za_atar,+olive+oil,+and+sesame+seeds+MD+NEW.jpg',
                '43.+Margarita+Popsicles+MD+NEW.jpg',
                '44.+Peanut+Butter+Caramel+Bars+MD+NEW.jpg',
                '45.+sinigang+Filipino+sour+soup+made+with+tamarind+broth+MD+NEW.jpg',
                '46.+Smoked+Meatball+&+Mushroom+Toast+MD+NEW.jpg',
                '47.+Spanakopita+MD+New.jpg',
                '48.+Spicy+Sausage+and+Potato+Soup+MD+NEW.jpg',
                '49.+vibrant+birthday-themed+drink+MD+NEW.jpg',
                '72. macroons.jpg',
                'Akara++bean+cakes++glazed+with+barbecue+sauce.jpg',
                'Akara++bean+cakes+.jpg',
                'Algerian+dessert,+in+a+clear+plastic+package.jpg',
                'Almonddessert.jpg',
                'Alternative+version+of+colorful+ice+cream.jpg',
                'Assidat+zgougou++1+.jpg',
                'Avacado+and+tomatoe+toast.jpg',
                'Baked+alaska.jpg',
                'Banoffee+pie.jpg',
                'Bitterballen+1.jpg',
                'Caramel+apple+cream+puffs+1.jpg',
                'Chicken,+beef,+and+pork+buns.jpg',
                'Chin+chin.jpg',
                'Chomchom+1.jpg',
                'Colorful+hot+dog+weiners.jpg',
                'Colorful+soft+candy.jpg',
                'Cookie+dough+bark+2.jpg',
                'Cornmeal+poundcake+2.jpg',
                'cracker snack.jpg',
                'Daigaku+imo+2.jpg',
                'Donut+flavored+slushie.jpg',
                'Dorayaki+1.jpg',
                'Egg+rolls+topped+with+hot+sauce.jpg',
                'Falooda+1.jpg',
                'Hanami+dango+1.jpg',
                'Himbasha.jpg',
                'Horchata+shake.jpg',
                'Imagawayaki+2.jpg',
                'Japanese+cheesecake+1.jpg',
                'Jawhara.jpg',
                'Kakigori+1.jpg',
                'Kanafeh+++1+.jpg',
                'Kitkat+2.jpg',
                'Korean+cinnamon+punch++sujeonggwa++1++1+.jpg',
                'Korean+honey+pastry++yakgwa++2++1+.jpg',
                'Magrood+a+traditional+libyan+pastry.jpg',
                'Makroudh.jpg',
                'Mauritian+gateaux+napolitaines.jpg',
                'Mexican+spiced+hot+chocolate+1.jpg',
                'Ramen+(New).jpg',
                'Raspberry+chocolate+mousse+1++2+.jpg',
                'Samosas+1.jpg',
                'Sfenj,+a+traditional+moroccan+doughnut.jpg',
                'Sfogliatelle.jpg',
                'Souffle+pancakes+2.jpg',
                'Sticky+toffee+pudding.jpg',
                'Strawberry+cheesecake+2.jpg',
                'Strawberry,+vanilla,+and+chocolate+wafers.jpg',
                'Taiyaki+1++1+.jpg',
                'Truffle+2.jpg',
                'Vanilla+pudding+or+yogurt.jpg',
                'Watermelon+drink+new.jpg'
            ]
        };
        
        return imageMappings[folderName] || [];
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    showError(message) {
        document.body.innerHTML = `
            <div class="main-container">
                <div class="instructions">
                    <h2>Error</h2>
                    <div style="border: 1px solid #e5e5e5; padding: 2rem; border-radius: 4px; margin: 2rem 0; background: #fafafa; color: red;">
                        <p>${message}</p>
                        <div style="margin-top: 1rem; color: #666; font-size: 12px;">
                            <small>Session ID: ${this.sessionId}</small>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    async preloadImages() {
        // Show loading screen
        this.showLoadingScreen();
        
        try {
            console.log('Starting image preloading...');
            
            // Collect all unique image paths that will be used in the experiment
            const imagesToPreload = new Set();
            
            // Add Phase 1 images
            this.phase1Images.forEach(img => {
                imagesToPreload.add(`images/old-images/${img.filename}`);
            });
            
            // Add Phase 2 images
            this.phase2Images.forEach(img => {
                const folder = img.isOld ? 'old-images' : 'new-images';
                imagesToPreload.add(`images/${folder}/${img.filename}`);
            });
            
            const imagePathsArray = Array.from(imagesToPreload);
            const totalImages = imagePathsArray.length;
            let loadedCount = 0;
            
            console.log(`Preloading ${totalImages} images...`);
            
            // Create promises for all image loads
            const loadPromises = imagePathsArray.map((imagePath, index) => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    
                    img.onload = () => {
                        this.preloadedImages[imagePath] = img;
                        loadedCount++;
                        
                        // Update progress
                        const progress = Math.round((loadedCount / totalImages) * 100);
                        this.updateLoadingProgress(progress, loadedCount, totalImages);
                        
                        resolve(img);
                    };
                    
                    img.onerror = () => {
                        console.warn(`Failed to load image: ${imagePath}`);
                        loadedCount++;
                        
                        // Still update progress even for failed images
                        const progress = Math.round((loadedCount / totalImages) * 100);
                        this.updateLoadingProgress(progress, loadedCount, totalImages);
                        
                        resolve(null); // Resolve with null instead of rejecting
                    };
                    
                    img.src = imagePath;
                });
            });
            
            // Wait for all images to load (or fail)
            await Promise.all(loadPromises);
            
            this.imagesLoaded = true;
            console.log(`Image preloading completed. ${Object.keys(this.preloadedImages).length} images loaded successfully.`);
            
            // Show completion message briefly before continuing
            this.showLoadingComplete();
            
            // Wait a moment to show completion, then proceed
            setTimeout(() => {
                this.showPhase1Instructions();
            }, 1000);
            
        } catch (error) {
            console.error('Error during image preloading:', error);
            this.showError('Failed to load images. Please refresh the page and try again.');
        }
    }

    showLoadingScreen() {
        document.body.innerHTML = `
            <div class="main-container">
                <div class="instructions">
                    <h2>Loading Images</h2>
                    <div style="border: 1px solid #e5e5e5; padding: 2rem; border-radius: 4px; margin: 2rem 0; background: #fafafa;">
                        <p style="font-size: 18px; margin-bottom: 1rem;">
                            Please wait while we load the experiment images...
                        </p>
                        <div style="width: 100%; background-color: #e5e5e5; border-radius: 10px; overflow: hidden; margin: 1rem 0;">
                            <div id="progressBar" style="width: 0%; height: 20px; background-color: #1976d2; transition: width 0.3s ease-in-out;"></div>
                        </div>
                        <div id="progressText" style="text-align: center; color: #666; font-size: 14px;">
                            Loading images... 0% (0/0)
                        </div>
                    </div>
                    <p style="color: #888; font-size: 14px;">This may take a moment depending on your internet connection.</p>
                </div>
            </div>`;
    }

    updateLoadingProgress(progress, loaded, total) {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        if (progressText) {
            progressText.textContent = `Loading images... ${progress}% (${loaded}/${total})`;
        }
    }

    showLoadingComplete() {
        const progressText = document.getElementById('progressText');
        if (progressText) {
            progressText.textContent = '✓ All images loaded successfully!';
            progressText.style.color = '#2e7d32';
            progressText.style.fontWeight = 'bold';
        }
    }

    // Method to get preloaded image or fallback to regular loading
    getImageElement(imagePath, alt = '', style = '') {
        if (this.preloadedImages[imagePath]) {
            // Clone the preloaded image
            const img = this.preloadedImages[imagePath].cloneNode();
            img.alt = alt;
            if (style) {
                img.style.cssText = style;
            }
            return img.outerHTML;
        } else {
            // Fallback to regular image loading with error handling
            return `<img src="${imagePath}" alt="${alt}" style="${style}" 
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4gPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2Y1ZjVmNSIvPiA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPkltYWdlIEVycm9yPC90ZXh0PiA8L3N2Zz4=';">`;
        }
    }
} 