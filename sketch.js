// TODO: Review the generated Doxygen comments in this file manually later.

DATA = dragon_warrior;

/**
 * Load the tileset image before setup runs.
 */
function preload() {
  tileset_image = loadImage(DATA.imagepath);
}

/**
 * Initialize the sketch and start the first generation.
 */
function setup() {
  createCanvas(1600, 1600);
  randomSeed(18); //18, 108
  weights = DATA.weights;
  //Object.keys(weights).forEach((key) => {weights[key] = normalizeDict(weights[key]);});
  runWithHTMLData(false);
}

/**
 * Handle mouse clicks in the sketch canvas.
 */
function mousePressed() {
}


/**
 * Rebuild the ruleset using the current HTML controls.
 *
 * @param {boolean} useRandomSeed True to generate a random seed.
 */
function runWithHTMLData(useRandomSeed = false) {
  let seed = 0;
  if(useRandomSeed){
    seed = Math.floor(Math.random() * 1000000);
    document.getElementById("seed-input").value = seed;
  }
  else{
    seed = parseInt(document.getElementById("seed-input").value);
  }
  const size = parseInt(document.getElementById("size-input").value);
  //TODO heuristic

  const cellHeuristic = parseInt(document.querySelector('input[name="heuristic-cell"]:checked').value);
  const tileHeuristic = parseInt(document.querySelector('input[name="heuristic-tile"]:checked').value);
  randomSeed(seed);
  ruleset = new Ruleset(new Tileset(DATA.size,tileset_image),weights,3,1,0.001);
  ruleset.prepare(size,cellHeuristic,tileHeuristic);
  instant = document.getElementById("instant-run-checkbox").checked;
  loop();
  
}

/**
 * Mutate the current ruleset.
 */
function mutate(){
  ruleset.cppn.mutate();
  ruleset.restart();
  loop();
}

/**
 * Draw the sketch frame.
 */
function draw() {
  noSmooth();
  background(0);
  
  if(instant){
    ruleset.run();
    //ruleset.draw(0,0);
    ruleset.drawRulesetDebug(0,0);
    noLoop();
  }
  else{
    if(!ruleset.runStep())
      ruleset.restart();
    ruleset.draw(0,0);
    if(ruleset.finishedSuccessfully()){
      noLoop();
    }
  }

}
