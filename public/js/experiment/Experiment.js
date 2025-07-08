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
        
        console.log(`Experiment initialized with session ID: ${this.sessionId}`);
    }

    async init() {
        try {
            console.log('Loading experiment configuration...');
            const response = await fetch('config.json');
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
                '25.+toasted+marshmallows+infused+with+bourbon+LG.jpg', 'Colorful+pork+buns.jpg',
                'New+lemon+bars.jpg', 'Donut+milkshake+2.jpg', 'New+honey+bun.jpg',
                'Strawberry,+cherry,+cream,+chocolate,+and+almond+butter+wafers.jpg', 'Chicken+pot+pie.jpg',
                '63.+watermelon+drink+3++1++no+letters.jpg', 'Cornpuffs.jpg', 'churro.jpg',
                'New+colorful+snowballs.jpg', 'Ice+cream.jpg', '79.+biscuit+snack+2+color.jpg',
                'Sweet+salty+energy+bites+1.jpg', 'Mont+blanc+1.jpg', 'Slow+cooker+cheddar+bacon+beer+dip+1.jpg',
                'Pizza+monkey+bread+1.jpg', 'Rakugan+1.jpg', 'Pièces+du+gâteau+2.jpg',
                'Pepero+cake+1.jpg', 'Mugwort+desserts++2.jpg', 'Mille+crepe+cake+1.jpg',
                'Matcha+basque+cheesecake+1.jpg', 'Lamingtons+2.jpg', 'Ispahan,+a+rose+flavored+macaron+with+fresh+raspberries+2.jpg',
                'Sweet+glazed+colorful+dumplings.jpg', 'Polar+bear+themed+cupcake.jpg', 'Round+salty+finnish+licorice.jpg',
                'Machata+toffee.jpg', 'Chocolate+chips,+ginger,+and+snickerdoodle+flavors+.jpg', 'Assorted+chips.jpg',
                'Banana+coconut+pudding.jpg', 'Greek+pear+jelly+dusted+with+powdered+sugar.jpg', 'Saltedcaramelapplemarshmallows+1.jpg',
                'Kahlua+brownie+pie+1.jpg', 'Honey+lavander+cookie+2.jpg', 'Brioche+con+gelato+2.jpg',
                'Blueberry+lemonade+slushies+1.jpg', 'Indian+trail+mix.jpg', 'Pineapple+green+smoothie+1.jpg',
                'Tim+tams+2.jpg', 'Korean+coffee++1.jpg', 'Cookie+apple+cream+puffs+2.jpg',
                'Japanese+strawberry+shortcake+2.jpg', 'Chocolate+coconut+pie+with+dalgona+coffee+topping+1.jpg',
                'Crepe+2.jpg', 'Botamochi.jpg', 'Bingsu+1.jpg', 'Biltong+1.jpg',
                'Baklava+2.jpg', 'Apple+shortcake+2.jpg', 'New+vanilla+cookie.jpg'
            ],
            'new-images': [
                'Horchata+shake.jpg', 'Baked+alaska.jpg', 'Sfogliatelle.jpg', 'Sticky+toffee+pudding.jpg',
                'Banoffee+pie.jpg', 'Kanafeh+++1+.jpg', 'Dorayaki+1.jpg', 'Bitterballen+1.jpg',
                'Chomchom+1.jpg', 'Caramel+apple+cream+puffs+1.jpg', 'Cookie+dough+bark+2.jpg',
                'Cornmeal+poundcake+2.jpg', 'Daigaku+imo+2.jpg', 'Falooda+1.jpg',
                'Hanami+dango+1.jpg', 'Imagawayaki+2.jpg', 'Kitkat+2.jpg', 'Japanese+cheesecake+1.jpg',
                'Kakigori+1.jpg', 'Korean+cinnamon+punch++sujeonggwa++1++1+.jpg',
                'Korean+honey+pastry++yakgwa++2++1+.jpg', 'Raspberry+chocolate+mousse+1++2+.jpg',
                'Samosas+1.jpg', 'Souffle+pancakes+2.jpg', 'Strawberry+cheesecake+2.jpg',
                'Taiyaki+1++1+.jpg', 'Truffle+2.jpg', '72.+ macroons.jpg',
                'Strawberry,+vanilla,+and+chocolate+wafers.jpg', 'Akara++bean+cakes++glazed+with+barbecue+sauce.jpg',
                'Colorful+hot+dog+weiners.jpg', 'Mauritian+gateaux+napolitaines.jpg', 'Jawhara.jpg',
                'Mexican+spiced+hot+chocolate+1.jpg', 'Chin+chin.jpg', 'Magrood+a+traditional+libyan+pastry.jpg',
                'Watermelon+drink+new.jpg', 'Alternative+version+of+colorful+ice+cream.jpg', 'Donut+flavored+slushie.jpg',
                'Egg+rolls+topped+with+hot+sauce.jpg', 'Himbasha.jpg', 'Chicken,+beef,+and+pork+buns.jpg',
                'Akara++bean+cakes+.jpg', 'Vanilla+pudding+or+yogurt.jpg', 'Algerian+dessert,+in+a+clear+plastic+package.jpg',
                'Sfenj,+a+traditional+moroccan+doughnut.jpg', 'cracker+snack.jpg', 'Colorful+soft+candy.jpg',
                'Almonddessert.jpg', 'Assidat+zgougou++1+.jpg', 'Makroudh.jpg',
                '49.+vibrant+birthday-themed+drink+MD+NEW.jpg', '48.+Spicy+Sausage+and+Potato+Soup+MD+NEW.jpg',
                '47.+Spanakopita+MD+New.jpg', '46.+Smoked+Meatball+&+Mushroom+Toast+MD+NEW.jpg',
                '45.+sinigang+Filipino+sour+soup+made+with+tamarind+broth+MD+NEW.jpg', '44.+Peanut+Butter+Caramel+Bars+MD+NEW.jpg',
                '43.+Margarita+Popsicles+MD+NEW.jpg', '42.+manousheh,+Lebanese+flatbread+topped+with+za_atar,+olive+oil,+and+sesame+seeds+MD+NEW.jpg',
                '41.+Macaroni+and+Cheese+Pie+with+a+Bacon+Lattice+New.jpg', "40.+Ina+Garten's+Parmesan+Chive+Smashed+Potatoes+MD+NEW.jpg",
                '39.+ice+cream+sandwich+MD+NEW.jpg', 'Avacado+and+tomatoe+toast.jpg', '37.+graham+crackers+MD+NEW.jpg',
                '36.+fruit+cream+pie+MD+new.jpg', '35.+Egyptian+koshary+MD+NEW.jpg', '34.+cream-stuffed+chocolate+chip+cookies+MD+NEW.jpg',
                '33.+Cinnamon+Roll+Waffles+MD+NEW.jpg', '32.+Chocolate-Dipped+Coffee+Ice+Cream+Glazed-Doughnut+Sandwiches+MD+NEW.jpg',
                '31.+Chicken+Florentine+Calzones+MD+NEW.jpg', '30.+Cheesecake+Cake+Batter+Dip+MD+NEW.jpg',
                '29.+Buffalo+Chicken+Salad+Puffs+MD+NEW.jpg', '28.+Blackberry+Lemon+Cheesecake+Bars+MD+NEW.jpg',
                '27.+Bacon,+Egg,+and+Cheese+Eggo+Waffle+Sandwich+NEW.jpg', '26.+arepas++MD+NEW.jpg', 'Ramen+(New).jpg'
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
} 