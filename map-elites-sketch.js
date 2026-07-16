
DATA_ME = dragon_warrior;
WFC_SIZE = 24
EXPERIMENT_NAME = "avg+complexBound";
BINS = 24;

HEURISTICS = [maximumHeuristic, shannonEntropy];
HEUR_NAMES = [ "max","shannon"];

function preload(){
    tileset_image = loadImage(DATA_ME.imagepath);
    seed = 7;
    current_heuristic_id = -1;
}

/**
 * Create the canvas and initialize the archive visualization.
 */
function setup() {
    // iterate
    current_heuristic_id++;
    if(current_heuristic_id >= HEURISTICS.length){
        current_heuristic_id = 0;
        seed++;
    }

    let halfWiidth = WFC_SIZE*DATA_ME.size*2+40;
    createCanvas(2*halfWiidth, halfWiidth);
    pixelDensity(1);
    //seed = parseInt(document.getElementById("seed-input").value) || 42;
    RunCPPN2WFCMapElites(seed);
    //noLoop();
    maxFitness = 10;
    latest_candidate = null;
}


/**
 * Draw the current Map-Elites archive as a 2D grid.
 * Also displayes latest added elite on the side.
 */
function draw() {
    let downloadAt = []
    //let downloadAt = [500,2_000,4_000,6_000,8_000,10_000,12_000,16_000,24_000,32_000,40_000];
    let toggleRender = document.getElementById("toggle-render").checked;
    const runsPerFrame = toggleRender ? 1 : 8;
    for(let i = 0; i < runsPerFrame; i++){
        let parent1 = mapElites.getRandomElite();
        let parent2 = mapElites.getRandomElite();
        let child = ruleset.generateOffspringCandidate(parent1, parent2);
        if(mapElites.add(child)){
            latest_candidate = child;
            latest_candidate.historical_id = candidates_count;
        }
        candidates_count++;
    }
    if(downloadAt.includes(candidates_count)){
        DownloadAsCSV();
    }
    if(candidates_count >= downloadAt[downloadAt.length - 1]){
        //reset
        setup();
    }
    document.getElementById("candidates").textContent = candidates_count;

    background(18);
    stroke(48);
    strokeWeight(1);

    const cellWidth = width / mapElites.descriptorXBins / 2;
    const cellHeight = height / mapElites.descriptorYBins;

    for (let y = 0; y < mapElites.descriptorYBins; y++) {
        for (let x = 0; x < mapElites.descriptorXBins; x++) {
            const elite = mapElites.getElite(x, y);
            if (elite === null || elite === undefined) {
                fill(34);
            } else {
                let fitness = mapElites.getFitness(x, y);
                const brightness = constrain(map(fitness, 0, maxFitness, 70, 255), 70, 255);
                maxFitness = Math.max(maxFitness, fitness);
                fill(180, brightness, 110);
                console.log(`Elite at (${x}, ${y}): Fitness = ${fitness}, Brightness = ${brightness}`);
            }
            rect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
        }
    }

    // Draw latest candidate on right half
    if (latest_candidate !== null && toggleRender) {
        const rightStartX = width / 2;
        const rightWidth = width / 2;
        const rightHeight = height;
        
        latest_candidate.wfc.drawCurrentState(rightStartX+10, 0, rightWidth, rightHeight);
        drawCandidateCPPN(latest_candidate, width-(DATA_ME.size*WFC_SIZE), 0, DATA_ME.size, false);
        
        // Draw info text
        fill(255);
        textSize(14);
        textAlign(LEFT);
        let infoY = DATA_ME.size*WFC_SIZE + 20;
        text(`Latest Candidate ID: ${latest_candidate.historical_id}`, rightStartX + 10, infoY);
        text(`Descriptor X: ${latest_candidate.descriptorX?.toFixed(2) || 'N/A'}`, rightStartX + 10, infoY + 20);
        text(`Descriptor Y: ${latest_candidate.descriptorY?.toFixed(2) || 'N/A'}`, rightStartX + 10, infoY + 40);
        text(`Fitness: ${latest_candidate.fitness?.toFixed(2) || 'N/A'}`, rightStartX + 10, infoY + 60);
    }
}

/**
 * Draws the CPPN representation of a candidate.
 * @param {Candidate} candidate The candidate to draw.
 * @param {number} x The x-coordinate of the drawing area.
 * @param {number} y The y-coordinate of the drawing area.
 * @param {number} size The size of each cell in the drawing area.
 * @param {boolean} useArgmaxed Whether to use argmaxed layout.
 */
function drawCandidateCPPN(candidate, x, y, size, useArgmaxed = true){
    const colors = candidate.ruleset.cppn.colors;
    const gridSize = candidate.wfc.width;
    for(let j = 0; j < gridSize; j++){
        for(let k = 0; k < gridSize; k++){
            let r = 0;
            let g = 0;
            let b = 0;
            if(useArgmaxed){
                const tile = candidate.getLayoutAt(j, k, true);
                r = colors[tile][0];
                g = colors[tile][1];
                b = colors[tile][2];
            }
            else{
                const layout = candidate.getLayoutAt(j, k, false);
                for(let l = 0; l < layout.length; l++){
                    r += layout[l] * colors[l][0];
                    g += layout[l] * colors[l][1];
                    b += layout[l] * colors[l][2];
                }
            }
            fill(int(r), int(g), int(b));
            rect(x + j * size, y + k * size, size, size);
        }
    }
}

/**
 * Download the current Map-Elites archive as a CSV file.
 */
function DownloadAsCSV(){
    let csvContent = "";
    csvContent += `# Map Elites Data - Candidates: ${candidates_count}\n`;
    csvContent += `# Size: ${WFC_SIZE}, Image Path: ${DATA_ME.imagepath}, Seed: ${seed}\n`;
    csvContent += "DescriptorX,DescriptorY,Fitness\n";
    for (let y = 0; y < mapElites.descriptorYBins; y++) {
        for (let x = 0; x < mapElites.descriptorXBins; x++) {
            const elite = mapElites.getElite(x, y);
            if (elite !== null && elite !== undefined) {
                let fitness = mapElites.getFitness(x, y);
                csvContent += `${x},${y},${fitness}\n`;
            }
        }
    }

    // Use Blob/ObjectURL for robust downloads across browsers.
    const csvBlob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const csvUrl = URL.createObjectURL(csvBlob);
    let link = document.createElement("a");
    link.setAttribute("href", csvUrl);
    link.setAttribute("download", `ME_data_${DATA_ME.name}_${HEUR_NAMES[current_heuristic_id]}_${EXPERIMENT_NAME}_${candidates_count}_seed${seed}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(csvUrl);
}

/**
 * Calculates the average entropy of a candidate's layout.
 * @param {Candidate} candidate The candidate to evaluate.
 * @returns {number} The average entropy.
 */
function DescriptorAvgEntropy(candidate){
    let totalEntropy = 0;
    let count = 0;
    for(let x = 0; x < candidate.wfc.width; x++){
        for(let y = 0; y < candidate.wfc.height; y++){
            let weights = candidate.getLayoutAt(x, y, false);
            let entropy = shannonEntropy(Object.values(weights));
            totalEntropy += entropy;
            count++;
        }
    }
    console.log("DescriptorAvgEntropy:", totalEntropy / count);
    return totalEntropy / count;
}

/**
 * Calculates the difference between adjacent cells in a candidate's layout.
 * @param {Candidate} candidate The candidate to evaluate.
 * @returns {number} The boundary complexity.
 */
function DescriptorBoundaryComplexity(candidate){
    let boundaryComplexity = 0;
    for(let x = 0; x < candidate.wfc.width; x++){
        for(let y = 0; y < candidate.wfc.height; y++){
            let layout = candidate.getLayoutAt(x, y, false);

            if(x + 1 < candidate.wfc.width){
                let rightLayout = candidate.getLayoutAt(x + 1, y, false);
                let delta = 0;
                for(let i = 0; i < layout.length; i++){
                    let difference = layout[i] - rightLayout[i];
                    delta += difference * difference;
                }
                boundaryComplexity += delta;
            }

            if(y + 1 < candidate.wfc.height){
                let downLayout = candidate.getLayoutAt(x, y + 1, false);
                let delta = 0;
                for(let i = 0; i < layout.length; i++){
                    let difference = layout[i] - downLayout[i];
                    delta += difference * difference;
                }
                boundaryComplexity += delta;
            }
        }
    }
    boundaryComplexity /= (candidate.wfc.width * candidate.wfc.height) / 4;

    console.log("DescriptorBoundaryComplexity:", boundaryComplexity);
    return boundaryComplexity;
}



/**
 * Evaluates the agreement between a candidate's layout and the wfc output.
 * @param {Candidate} candidate The candidate to evaluate.
 * @returns {number} The agreement score.
 */
function EvaluatorAgreement(candidate){
    let agreement = 0.0;
    for(let x = 0; x < candidate.wfc.width; x++){
        for(let y = 0; y < candidate.wfc.height; y++){
            let tile_id = candidate.wfc.map[y][x].tile;
            if(tile_id == null){
                continue;
            }
            let cppnOutput = candidate.getLayoutAt(x, y, false);
            for(let [layout, weights] of Object.entries(DATA_ME.weights)){
                if(tile_id in weights)
                    agreement += cppnOutput[layout]
            }
        }
    }
    console.log("EvaluatorAgreement:", agreement);
    return agreement;
}

/**
 * Runs the CPPN2WFC Map-Elites algorithm.
 * @param {number} seed The random seed for reproducibility.
 */
function RunCPPN2WFCMapElites(seed = 42){

    randomSeed(seed);
    candidates_count = 0;
    mapElites = new MapElites(DescriptorBoundaryComplexity,BINS,DescriptorAvgEntropy,BINS,EvaluatorAgreement);
    tileset = new Tileset(DATA_ME.size,tileset_image);
    ruleset = new Ruleset_ME(tileset,DATA_ME.weights,3,1,0.001);
    ruleset.prepare(WFC_SIZE,HEURISTICS[current_heuristic_id]);
    for(let i = 0; i < 25; i++){
        let candidate = ruleset.generateBrandNewCandidate();
        let result = mapElites.add(candidate);
        console.log("Candidate added",i,":", result);
        candidates_count++;
    }
}