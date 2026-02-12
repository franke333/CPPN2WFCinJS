//The Population Class
//Here is where the power of all the classes
//comes together to destroy the game score records
class Population{
	constructor(size, width, height, genomeInputsN, genomeOutputN){
		this.population = [];
		this.bestPlayer;
		this.bestFitness = 0;

		this.generation = 0;
		this.matingPool = [];

		for(let i = 0; i < size; i++){
			this.population.push(new Player(i, width, height, genomeInputsN, genomeOutputN));
			//this.population[i].brain.generateNetwork();
			for(let j = 0; j < 10; j++){
				this.population[i].brain.mutate();
			}
		}
	}

	updateAlive(){
		for(let i = 0; i < this.population.length; i++){
			if(!this.population[i].dead){
				console.log("Updating player:", i);
				this.population[i].look();
				this.population[i].think();
				this.population[i].move();
				this.population[i].update();
				//this.population[i].show();
			}
		}
	}

	done(){
		for(let i = 0; i < this.population.length; i++){
			if(!this.population[i].dead){
				return false;
			}
		}
		
		return true;
	}
	
	naturalSelection(parents = []){
		//this.calculateFitness();
		console.log("Parents for next generation:", parents);
		let children = [];
		
		
		for(let i = 0; i < this.population.length; i++){
			//parents persist
			if(parents.includes(i))
				children.push(this.population[i].clone());
			else if(parents.length >= 2 && random() > 0.33){
				//crossover
				let parentAIndex = parents[Math.floor(random() * parents.length)];
				let parentBIndex = parents[Math.floor(random() * parents.length)];
				let parentA = this.population[parentAIndex];
				let parentB = this.population[parentBIndex];
				let child = parentA.crossover(parentB);
				children.push(child);
			}
			else{
				//mutation
				let parentIndex = Math.floor(random(this.population.length));
				let parent = this.population[parentIndex];
				let child = parent.clone();
				child.brain.mutate();
				children.push(child);
			}
		}


		this.population.splice(0, this.population.length);
		this.population = children.slice(0);
		this.generation++;
		this.population.forEach((element) => { 
			element.brain.generateNetwork();
		});	

		console.log("Generation " + this.generation);
	}

	calculateFitness(){
		let currentMax = 0;
		this.population.forEach((element) => { 
			element.calculateFitness();
			if(element.fitness > this.bestFitness){
				this.bestFitness = element.fitness;
				this.bestPlayer = element.clone();
				this.bestPlayer.brain.id = "BestGenome";
				this.bestPlayer.brain.draw();
			}

			if(element.fitness > currentMax)
				currentMax = element.fitness;
		});

		//Normalize
		this.population.forEach((element, elementN) => { 
			element.fitness /= currentMax;
		});
	}
}
