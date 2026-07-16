

DATA = PREPARED_BUNDLES.dragon_warrior; // default ruleset
bundle_images = {};

/**
 * Load the tileset image before setup runs.
 */
function preload() {
    for (const [bundleName, bundle] of Object.entries(PREPARED_BUNDLES)) {
        bundle_images[bundleName] = loadImage(bundle.imagepath);
    }
    tileset_image = bundle_images[DATA.name];
    tileset = null;
}

/**
 * Initialize the debug sketch state.
 */
function setup() {
    // run better on mobile devices
    pixelDensity(1);
    createCanvas(1800, 1800);
    randomSeed(18); //18, 108
    setupBundleSelect();
    syncSelectedBundle();
    //Object.keys(weights).forEach((key) => {weights[key] = normalizeDict(weights[key]);});
    generationCount = 1;
    resetsCount = 0;
    runWithHTMLData(false);
    rects = {};
    selected = [];
    needToRerun = true;
}

/**
 * Populate the bundle dropdown with the prepared bundle names.
 */
function setupBundleSelect() {
    const bundleSelect = document.getElementById("bundle-input");
    if (!bundleSelect || bundleSelect.options.length > 0) {
        return;
    }

    for (const bundleName of Object.keys(PREPARED_BUNDLES)) {
        const option = document.createElement("option");
        option.value = bundleName;
        option.textContent = PREPARED_BUNDLES[bundleName].name;
        bundleSelect.appendChild(option);
    }

    bundleSelect.value = DATA.name;
}

/**
 * Sync the active bundle from the dropdown into the sketch globals.
 */
function syncSelectedBundle() {
    const bundleSelect = document.getElementById("bundle-input");
    const selectedBundleName = bundleSelect ? bundleSelect.value : DATA.name;
    if (selectedBundleName === DATA.name && tileset !== null && tileset !== undefined) {
        return;
    }
    DATA = PREPARED_BUNDLES[selectedBundleName] || DATA;
    weights = DATA.weights;
    tileset_image = bundle_images[DATA.name] || tileset_image;
    tileset = new Tileset(DATA.size, tileset_image);
}

/**
 * Handle mouse clicks in the debug sketch canvas.
 */
function mousePressed() {
    for (const key of Object.keys(rects)) {
        const r = rects[key];
        if (mouseX >= r.x && mouseX <= r.x + r.width && mouseY >= r.y && mouseY <= r.y + r.height) {
            console.log("Clicked tile:", key);
            if (selected.includes(key)) {
                selected = selected.filter(item => item !== key);
            }
            else {
                selected.push(key);
            }
        }
    }
}


/**
 * Rebuild the ruleset using the current HTML controls.
 *
 * @param {boolean} useRandomSeed True to generate a random seed.
 */
function runWithHTMLData(useRandomSeed = false) {
    //TODO Add UI WARNING that geenerate button must be used to perform changes to heuristic or size or seed
    syncSelectedBundle();
    let seed = 0;
    if (useRandomSeed) {
        seed = Math.floor(Math.random() * 1000000);
        document.getElementById("seed-input").value = seed;
    }
    else {
        seed = parseInt(document.getElementById("seed-input").value);
    }
    randomSeed(seed);
    const size = parseInt(document.getElementById("size-input").value);
    const cellHeuristic = parseInt(document.querySelector('input[name="heuristic-cell"]:checked').value);
    const tileHeuristic = parseInt(document.querySelector('input[name="heuristic-tile"]:checked').value);
    let layouts = Object.keys(DATA.weights).length;
    ruleset = new Ruleset(tileset, weights, layouts, 10, 0.001);
    ruleset.prepare(size, tileHeuristic, cellHeuristic);
    needToRerun = true;
    selected = [];
    generationCount = 1;
    document.getElementById("generation-count").innerText = "Generation: " + generationCount;
    resetsCount++;
    document.getElementById("resets-count").innerText = "Resets: " + resetsCount;
    //loop();
    
}

/**
 * Mutate the current ruleset while preserving the selected parents.
 */
function mutate() {
    const parents = selected.map(id => parseInt(id));
    ruleset.evolve(parents);
    needToRerun = true;
    generationCount++;
    document.getElementById("generation-count").innerText = "Generation: " + generationCount;
}

/**
 * Draw the debug sketch frame.
 */
function draw() {  
    if (needToRerun) {
        rerunRuleset();
    }
    drawSelection();
}

/**
 * Clear the canvas and rerun the ruleset for the current selection.
 */
function rerunRuleset() {
    const parents = selected.map(id => parseInt(id));
    background(0);
    noSmooth();
    ruleset.run(parents);
    const xOffset = 32;
    let imageWidth = DATA.size * ruleset.size + 25;
    let columns = Math.floor((canvas.width - 2*xOffset) / imageWidth);
    columns = Math.min(columns,5);
    rects = ruleset.drawGrid(xOffset, 10, columns);
    needToRerun = false;
}

/**
 * Draw selection outlines around the currently selected WFCs.
 */
function drawSelection() {
    for (const r of Object.values(rects)) {
        const thickness = 6;
        noFill();
        stroke(selected.includes(r.id) ? 255 : 0, 0, 0);
        strokeWeight(thickness);
        rect(r.x - thickness / 2, r.y - thickness / 2, r.width + thickness, r.height + thickness);
    }
}
