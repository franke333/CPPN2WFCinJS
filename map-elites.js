// TODO: Replace the placeholder fitness and descriptor evaluation methods with project-specific logic later.
// TODO: Review the generated Doxygen comments in this file manually later.

class Candidate{
    constructor(ruleset, wfc, player = null){
        this.ruleset = ruleset;
        this.wfc = wfc;
        this.id = wfc.id;
        this.player = player ? player.clone() : null;
        this.dataArgmax = this.player ? reshape(this.player.argmax_decisions, wfc.width, wfc.height) : null;
        this.dataNormalized = this.player ? reshape(this.player.decisions, wfc.width, wfc.height) : null;
        this.fitness = null;
        this.descriptorX = null;
        this.descriptorY = null;
        this.historical_id= -1;
    }

    getLayoutAt(x, y, argmaxed){
        if(argmaxed){
            return this.dataArgmax[x][y];
        }
        return this.dataNormalized[x][y];
    }
}

/** CPPN Map-Elites version */
class CPPN_ME extends CPPN {
    constructor(nin=3, nout=4, layoutsize=10, bucketsX=10, bucketsY=10) {
        super(nin, nout, layoutsize, bucketsX * bucketsY + 1);
        this.bucketsX = bucketsX;
        this.bucketsY = bucketsY;
        this.pop_size = bucketsX * bucketsY + 1; // +1 for new individual
        this.population = new Population(this.pop_size, this.size, this.size, this.genomeInputsN, this.genomeOutputN, false);
    }

    generateDataSingle(index){
        this.population.updateAliveSingle(index);
        this.dataArgmax[index] = reshape(this.population.population[index].argmax_decisions, this.size, this.size);
        this.dataNormalized[index] = reshape(this.population.population[index].decisions, this.size, this.size);
    }

    generateNewCandidate(init_mutations=10){
        let newCandidate = new Player(this.pop_size-1, this.size, this.size, this.genomeInputsN, this.genomeOutputN);
        newCandidate.brain.generateNetwork();
        for(let j = 0; j < init_mutations; j++){
            newCandidate.brain.mutate();
        }
        this.population.population[this.pop_size-1] = newCandidate;
        this.generateDataSingle(this.pop_size-1);

    }

    getElite(x,y){
        let index = y * this.bucketsX + x;
        return this.population.population[index];
    }

    assignElite(x,y,elite){
        let index = y * this.bucketsX + x;
        this.population.population[index] = elite;
    }

    getLayoutAtNewCandidate(x,y,argmaxed){
        if(argmaxed){
            return this.dataArgmax[this.candidate_index][x][y];
        }
        else{
            return this.dataNormalized[this.candidate_index][x][y];
        }
    }
}

class Ruleset_ME extends Ruleset {
    prepare(size, cellHeruistic){
        let bucketsX = 20;
        let bucketsY = 20;
        this.tileHeuristicFunc = (x,y,wfc) => weightedNormalizedCollapseHeuristic(x, y, wfc, this.normalizedWeights);
        this.cellHeuristicFunc = (wfc) => customHeuristic(cellHeruistic, wfc, this.normalizedWeights);
        this.cppn = new CPPN_ME(3, this.layoutCount, size, bucketsX, bucketsY);
        this.size = size;
        this.wfcs = new Array(bucketsX * bucketsY + 1); // +1 for new candidate
        for(let i = 0; i < this.wfcs.length; i++){
            this.wfcs[i] = null;
        }
        this.wfcs[this.wfcs.length - 1] = new WFC(this.size, this.size, this.tileset, this.tileHeuristicFunc, this.cellHeuristicFunc);
        this.candidate_index = bucketsX * bucketsY; // index of the new candidate in the population
        this.normalizedWeights = new Array(this.wfcs.length);
    }

    generateBrandNewCandidate(init_mutations=10){
        this.cppn.generateNewCandidate(init_mutations);
        this.precalculateNormWeightsSingle(this.size,this.candidate_index);
        this.wfcs[this.candidate_index] = new WFC(this.size, this.size, this.tileset, 10, this.tileHeuristicFunc, this.cellHeuristicFunc, this.candidate_index);
        this.wfcs[this.candidate_index].run(true);
        const player = this.cppn.population.population[this.candidate_index];
        return new Candidate(this, this.wfcs[this.candidate_index], player);
        
    }

    generateOffspringCandidate(parent1, parent2){
        //TODO correct crossover & mutation resulting in new candidate
        let p1player = parent1.player;
        let p2player = parent2.player;
        let child = null;
        if(random() < 0.5){
            child = p1player.crossover(p2player);
        }
        else{
            child = p1player.clone();
            child.brain.mutate();
        }
        this.cppn.population.population[this.candidate_index] = child;
        this.cppn.generateDataSingle(this.candidate_index);
        this.precalculateNormWeightsSingle(this.size,this.candidate_index);
        this.wfcs[this.candidate_index] = new WFC(this.size, this.size, this.tileset, 10, this.tileHeuristicFunc, this.cellHeuristicFunc, this.candidate_index);
        this.wfcs[this.candidate_index].run(true);
        return new Candidate(this, this.wfcs[this.candidate_index], child);
    }   
    
}

/**
 * A minimal 2D Map-Elites archive for visualizing elite coverage across descriptor space.
 */
class MapElites {
    /**
     * Create a 2D Map-Elites archive.
     *
     * @param {Function} descriptorX Method to compute the X descriptor value for a candidate.
     * @param {number} descriptorXBuckets Number of descriptor bins on the X axis.
     * @param {Function} descriptorY Method to compute the Y descriptor value for a candidate.
     * @param {number} descriptorYBuckets Number of descriptor bins on the Y axis.
     * @param {Function} evaluator Function to evaluate candidates.
     */
    constructor(descriptorX, descriptorXBins, descriptorY, descriptorYBins, evaluator) {
        this.descriptorX = descriptorX;
        this.descriptorY = descriptorY;
        this.descriptorXBins = descriptorXBins;
        this.descriptorYBins = descriptorYBins;
        this.evaluator = evaluator;

        // initialize the archive as a 2D array of nulls
        this.clear();
    }

    /**
     * Reset the archive to an empty state.
     */
    clear() {
        this.archive = new CPPN_ME(3,3,20,this.descriptorXBins, this.descriptorYBins);
        this.filledList = [];
        this.fitnesses = new Array(this.descriptorXBins * this.descriptorYBins).fill(0);
    }

    /**
     * Compute the fitness for a candidate.
     *
     * @param {*} candidate Candidate solution.
     * @returns {number|undefined} Fitness value.
     */
    evaluateFitness(candidate) {
        return this.evaluator(candidate);
    }

    getRandomElite(){
        if(this.filledList.length === 0){
            return null;
        }
        const [x, y] = random(this.filledList);
        return this.getElite(x, y);
    }

    /**
     * Compute the 2D descriptor for a candidate.
     *
     * @param {*} candidate Candidate solution.
     * @returns {Array<number>|undefined} Two descriptor values.
     */
    evaluateDescriptor(candidate) {
        // TODO: Implement descriptor evaluation for the generated map candidates.
        return [this.descriptorX(candidate), this.descriptorY(candidate)];
    }

    /**
     * Clamp a normalized value into a descriptor bin index.
     *
     * @param {number} value Normalized descriptor value.
     * @param {number} binCount Number of bins on the axis.
     * @returns {number} Bin index.
     */
    _toBin(value, binCount) {
        const normalized = constrain(value, 0, 0.999999);
        return floor(normalized * binCount);
    }

    /**
     * Convert a descriptor into archive coordinates.
     *
     * @param {Array<number>} descriptor Two normalized descriptor values.
     * @returns {Array<number>} Archive coordinates.
     */
    descriptorToCoords(descriptor) {
        const x = this._toBin(descriptor[0], this.descriptorXBins);
        const y = this._toBin(descriptor[1], this.descriptorYBins);
        return [x, y];
    }

    getFitness(x, y) {
        const elite = this.getElite(x, y);
        return elite ? this.fitnesses[x + y * this.descriptorXBins] : null;
    }

    /**
     * Insert a candidate into the archive if it improves the elite at its descriptor cell.
     *
     * @param {*} candidate Candidate solution.
     * @returns {boolean} True when the archive changed.
     */
    add(candidate) {
        const fitness = this.evaluateFitness(candidate);
        const descriptor = this.evaluateDescriptor(candidate);
        if (!Array.isArray(descriptor) || descriptor.length < 2) {
            return false;
        }
        if (fitness === undefined || fitness === null) {
            return false;
        }

        const [x, y] = this.descriptorToCoords(descriptor);
        const current = this.archive.getElite(x, y);
        if (current === null || current === undefined || fitness > this.getFitness(x, y)) {
            this.archive.assignElite(x, y, candidate);
            this.fitnesses[x + y * this.descriptorXBins] = fitness;
            this.filledList.push([x, y]);
            candidate.fitness = fitness;
            candidate.descriptorX = descriptor[0];
            candidate.descriptorY = descriptor[1];
            return true;
        }
        return false;
    }

    /**
     * Get the current elite at a descriptor cell.
     *
     * @param {number} x Descriptor X index.
     * @param {number} y Descriptor Y index.
     * @returns {*} The stored elite or null.
     */
    getElite(x, y) {
        if (x < 0 || x >= this.descriptorXBins || y < 0 || y >= this.descriptorYBins) {
            return null;
        }
        return this.archive.getElite(x, y);
    }

    getRandomElite() {
        if (this.filledList.length === 0) {
            return null;
        }
        const [x, y] = this.filledList[floor(random() * this.filledList.length)];
        return this.getElite(x, y);
    }

    /**
     * Count how many descriptor bins contain elites.
     *
     * @returns {number} Number of occupied cells.
     */
    occupiedCount() {
        let count = 0;
        for (let y = 0; y < this.descriptorYBins; y++) {
            for (let x = 0; x < this.descriptorXBins; x++) {
                if (this.archive.getElite(x, y) !== null) {
                    count++;
                }
            }
        }
        return count;
    }
}
