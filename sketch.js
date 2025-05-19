function preload() {
  tileset_image = loadImage('assets/dragonwarr_island.png');
  //tileset_image = loadImage('assets/dragon_warrior_map.png');
  //tileset_image = loadImage('assets/zelda.png');
  //tileset_image = loadImage('assets/pokemon.png');
}

function setup() {
  createCanvas(1000, 1000);
  randomSeed(18); //18, 108
  const weights = {
    0: {
      3: 1,

    },
    1: {
      4: 1,
      17: 1,
      1: 0.08,
      2: 0.05,
    },
    2: {
      5: 1,
      6: 0.02,
      7: 0.02,
      8: 0.015,
      9: 0.02,
      10: 0.015,
      11: 0.02,
      12: 0.015,
      13: 0.015,
      14: 0.015,
      15: 0.01,
      16: 0.01,
    }
  }
  ruleset = new Ruleset(new Tileset(16,tileset_image),weights,3,0.01);
  ruleset.prepare(20);
}

function mousePressed() {
  running = !running;

  redraw(); // Manually trigger a new draw() call when mouse is pressed
}

function draw() {
  noSmooth();
  background(0);
  const instant = false;
  
  if(instant){
    ruleset.run();
    ruleset.drawRulesetDebug(0,0);
    noLoop();
  }
  else{
    ruleset.runStep();
    ruleset.drawRulesetDebug(0,0);
    if(ruleset.wfc.finishedSuccessfully()){
      noLoop();
    }
  }

}
