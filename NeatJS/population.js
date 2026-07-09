// TODO: Review the generated Doxygen comments in this file manually later.

/**
 * Manage a population of players and apply selection across generations.
 */
class Population{
	/**
	 * Create a new population of players.
	 *
	 * @param {number} size Population size.
	 * @param {number} width Player layout width.
	 * @param {number} height Player layout height.
	 * @param {number} genomeInputsN Number of genome inputs.
	 * @param {number} genomeOutputN Number of genome outputs.
	 */
	constructor(size, width, height, genomeInputsN, genomeOutputN, fillPopulation=true){
		this.population = [];
		this.bestPlayer;
		this.bestFitness = 0;

		this.generation = 0;
		this.matingPool = [];

		if(fillPopulation)
			for(let i = 0; i < size; i++){
				this.population.push(new Player(i, width, height, genomeInputsN, genomeOutputN));
				//this.population[i].brain.generateNetwork();
				for(let j = 0; j < 10; j++){
					this.population[i].brain.mutate();
				}
			}
	}

	/**
	 * Advance every living player by one simulation tick.
	 */
	updateAliveAll(){
		for(let i = 0; i < this.population.length; i++){
			if(this.population[i] && !this.population[i].dead){
				console.log("Updating player:", i);
				//this.population[i].look();
				this.population[i].think();
				this.population[i].move();
				//this.population[i].update();
				//this.population[i].show();
			}
		}
	}

	updateAliveSingle(index){
		if(this.population[index] && !this.population[index].dead){
			console.log("Updating player:", index);
			this.population[index].think();
			this.population[index].move();
		}
	}

	/**
	 * Produce the next generation from a set of parents.
	 *
	 * @param {Array<number>} parents Parent indices to preserve or breed from.
	 */
	naturalSelection(parents = []){
		console.log("Parents for next generation:", parents);
		let children = [];
		
		
		for(let i = 0; i < this.population.length; i++){
			//parents persist
			if(parents.includes(i)){
				console.log("Parent persisting:", i);
				children.push(this.population[i]);
			}
			else if(parents.length >= 2 && random() > 0.5){
				
				//crossover
				let parentAIndex = parents[Math.floor(random() * parents.length)];
				let remainingParents = parents.filter((index) => index != parentAIndex);
				let parentBIndex = remainingParents[Math.floor(random() * remainingParents.length)];
				let parentA = this.population[parentAIndex];
				let parentB = this.population[parentBIndex];
				let child = parentA.crossover(parentB);
				children.push(child);
				console.log("Crossover for child:", i, "from parents:", parentAIndex, "and", parentBIndex);
			}
			else{
				
				//mutation
				let parentIndex = parents.length > 0 ? random(parents) : i;
				let parent = this.population[parentIndex];
				let child = parent.clone();
				child.brain.mutate();
				children.push(child);
				console.log("Mutation for child:", i);
			}
		}


		//this.population.splice(0, this.population.length);
		//this.population = children.slice(0);
		this.population = children;
		this.generation++;
		//this.population.forEach((element) => { 
		//	element.brain.generateNetwork();
		//});	

		console.log("Generation " + this.generation);
	}
}
