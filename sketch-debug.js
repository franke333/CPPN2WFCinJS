DATA = dragon_warrior;

function preload() {
  tileset_image = loadImage(DATA.imagepath);
}

function setup() {
  createCanvas(1600, 1600);
  randomSeed(18); //18, 108
  weights = DATA.weights;
  //Object.keys(weights).forEach((key) => {weights[key] = normalizeDict(weights[key]);});
  tileset = new Tileset(DATA.size,tileset_image);
  runWithHTMLData(false);
  rects = {};
  selected = [];
  needToRerun = true;
}

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
  ruleset = new Ruleset(tileset,weights,3,12,0.001);
  ruleset.prepare(size,cellHeuristic,tileHeuristic);
  instant = document.getElementById("instant-run-checkbox").checked;
  loop();
  
}

function mutate(){
  ruleset.cppn.mutate();
  ruleset.restart();
  needToRerun = true;
}

function draw() {  
  if(needToRerun){
    rerunRuleset();
  }
  drawSelection();
}

function rerunRuleset(){
  noSmooth();
  background(0);
  ruleset.run();
  rects = ruleset.drawGrid(10,10,4);
  needToRerun = false;
}

function drawSelection(){
  for(const r of Object.values(rects)){
    const thickness = 6;
    noFill();
    stroke(selected.includes(r.id) ? 255 : 0,0,0);
    strokeWeight(thickness);
    rect(r.x - thickness/2, r.y - thickness/2, r.width + thickness, r.height + thickness);
  }
}
