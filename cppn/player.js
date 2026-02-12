//The Player Class
//The interface between our 
//NeuralNetwork and the game 

// Changes made by: František Srb
class Player{
	constructor(id, width, height, genomeInputsN, genomeOutputN){
		this.brain = new Genome(genomeInputsN, genomeOutputN, id);
		this.fitness;

		this.score = 1;
		this.lifespan = 0;
		this.dead = false;
		
		this.decisions = []; //Current CPPN outputs
		this.vision = []; //Current input values
		this.argmax_decisions = []; //Current output values
		this.width = width; //Width of the layout
		this.height = height; //Height of the layout


		for(let x = 0; x < this.width; x++){
			for(let y = 0; y < this.height; y++){
				// distance from the center
				const r = Math.sqrt(Math.pow(x/width - 0.5, 2) + Math.pow(y/height - 0.5, 2));
				this.vision.push([x/width, y/width, r]);
			}
		}

	}

	clone() { //Returns a copy of this player
		let clone = new Player();
		clone.brain = this.brain.clone();
		clone.vision = this.vision.slice();
		return clone;
	}

	crossover(parent){ //Produce a child
		let child = new Player();
		child.brain = this.brain.crossover(parent.brain);
		child.vision = this.vision.slice();
		child.brain.mutate()
		return child;
	}


	//Game stuff
	// get inputs
	look(){
		//pass
	}

	//  ff nn
	think(){
		//TODO
		this.decisions.splice(0, this.decisions.length); //clear the decisions array
		for(let i = 0; i < this.vision.length; i++){
			let decision = this.brain.feedForward(this.vision[i]);
			//apply RELU
			for(let j = 0; j < decision.length; j++){
				if(decision[j] < 0)
					decision[j] = 0;
			}
			//normalize
			let sum = 0;
			for(let j = 0; j < decision.length; j++){
				sum += decision[j];
			}
			if(sum != 0)
				for(let j = 0; j < decision.length; j++){
					decision[j] /= sum;
				}

			this.decisions.push(decision);
		}
	}

	// get outputs
	move(){
		//TODO
		let argmax = (arr) => arr.indexOf(Math.max(...arr));
		this.argmax_decisions.splice(0, this.argmax_decisions.length); //clear the decisions array
		for(let i = 0; i < this.decisions.length; i++){
			this.argmax_decisions.push(argmax(this.decisions[i]));
		}
		
	}

	update(){
		//TODO
	}

	show(){
		push();
		// show the player
		pop();
	}

	calculateFitness(){ //Fitness function : adapt it to the needs of the
		this.fitness = this.score;
		this.fitness /= this.brain.calculateWeight();
	}
}