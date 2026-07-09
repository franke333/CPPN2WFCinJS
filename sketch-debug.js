// TODO: Review the generated Doxygen comments in this file manually later.

DATA = dragon_warrior;

/**
 * Load the tileset image before setup runs.
 */
function preload() {
  tileset_image = loadImage(DATA.imagepath);
}

/**
 * Initialize the debug sketch state.
 */
function setup() {
  // run better on mobile devices
  pixelDensity(1);
  createCanvas(1600, 5000);
  randomSeed(18); //18, 108
  weights = DATA.weights;
  //Object.keys(weights).forEach((key) => {weights[key] = normalizeDict(weights[key]);});
  tileset = new Tileset(DATA.size,tileset_image);
  runWithHTMLData(false);
  rects = {};
  selected = [];
  needToRerun = true;
}

/**
 * Handle mouse clicks in the debug sketch canvas.
 */
function mousePressed() {
  for(const key of Object.keys(rects)){
    const r = rects[key];
    if(mouseX >= r.x && mouseX <= r.x + r.width && mouseY >= r.y && mouseY <= r.y + r.height){
      console.log("Clicked tile:", key);
      if(selected.includes(key)){
        selected = selected.filter(item => item !== key);
      }
      else{
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
  let seed = 0;
  if(useRandomSeed){
    seed = Math.floor(Math.random() * 1000000);
    document.getElementById("seed-input").value = seed;
  }
  else{
    seed = parseInt(document.getElementById("seed-input").value);
  }
  randomSeed(seed);
  const size = parseInt(document.getElementById("size-input").value);
  const cellHeuristic = parseInt(document.querySelector('input[name="heuristic-cell"]:checked').value);
  const tileHeuristic = parseInt(document.querySelector('input[name="heuristic-tile"]:checked').value);
  ruleset = new Ruleset(tileset,weights,3,12,0.001);
  ruleset.prepare(size,cellHeuristic,tileHeuristic);
  instant = document.getElementById("instant-run-checkbox").checked;
  needToRerun = true;
  selected = [];
  //loop();
  
}

/**
 * Mutate the current ruleset while preserving the selected parents.
 */
function mutate(){
  const parents = selected.map(id => parseInt(id));
  ruleset.evolve(parents);
  needToRerun = true;
}

/**
 * Draw the debug sketch frame.
 */
function draw() {  

  if(needToRerun){
    rerunRuleset();
  }
  drawSelection();
}

/**
 * Clear the canvas and rerun the ruleset for the current selection.
 */
function rerunRuleset(){
  const parents = selected.map(id => parseInt(id));
  background(0);
  noSmooth();
  ruleset.run(parents);
  rects = ruleset.drawGrid(10,10,4);
  ruleset.drawRulesetDebug(10,1200);
  needToRerun = false;
}

/**
 * Draw selection outlines around the currently selected WFCs.
 */
function drawSelection(){
  for(const r of Object.values(rects)){
    const thickness = 6;
    noFill();
    stroke(selected.includes(r.id) ? 255 : 0,0,0);
    strokeWeight(thickness);
    rect(r.x - thickness/2, r.y - thickness/2, r.width + thickness, r.height + thickness);
  }
}
