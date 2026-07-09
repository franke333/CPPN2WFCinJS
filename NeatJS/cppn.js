// TODO: Review the generated Doxygen comments in this file manually later.

/**
 * Generate and visualize CPPN layouts from a NEAT population.
 */
class CPPN {
    // nodes in, nodes out
    /**
     * Create a CPPN wrapper around a NEAT population.
     *
     * @param {number} nin Number of genome inputs.
     * @param {number} nout Number of genome outputs.
     * @param {number} layoutsize Width and height of the sampled layout.
     * @param {number} pop_size Number of genomes to manage.
     */
    constructor(nin=3, nout=4, layoutsize=10, pop_size=5) {
        this.genomeInputsN = nin;
        this.genomeOutputN = nout;
        this.showBest = true;
        this.colors = {
                0: [255, 0, 0],
                1: [0, 255, 0],
                2: [0, 0, 255],
                3: [255, 255, 0],
                4: [255, 0, 255],
                5: [0, 255, 255],
                6: [255, 128, 0],
                7: [255, 0, 128],
                8: [128, 255, 0],
                9: [0, 128, 255],
                10: [128, 0, 255],
                11: [255, 128, 128],
                12: [128, 255, 128],
                13: [128, 128, 255],
            };

        this.size = layoutsize;
        this.pop_size = pop_size;
        this.population = new Population(this.pop_size, this.size, this.size, this.genomeInputsN, this.genomeOutputN);
        this.population.updateAliveAll();
        this.dataArgmax = null; // outputs, null if not generated yet
        this.dataNormalized = null; // outputs, null if not generated yet
        this.generateData();
    }

    /**
     * Refresh cached argmax and normalized layout data from the population.
     */
    generateData() {
        this.dataArgmax = new Array(this.pop_size);
        this.dataNormalized = new Array(this.pop_size);
        for(let i = 0; i < this.pop_size; i++){
            if(!this.population.population[i]){
                this.dataArgmax[i] = null;
                this.dataNormalized[i] = null;
                continue;
            }
            this.dataArgmax[i] = reshape(this.population.population[i].argmax_decisions, this.size, this.size);
            this.dataNormalized[i] = reshape(this.population.population[i].decisions, this.size, this.size);
        }
    }

    /**
     * Mutate the population and regenerate the cached layout data.
     *
     * @param {Array<number>} parents Parent indices to preserve during selection.
     */
    mutate(parents = []){
        this.population.naturalSelection(parents);
        this.population.updateAliveAll();
        this.generateData();
    }

    /**
     * Read a layout value at the requested position.
     *
     * @param {number} x X coordinate.
     * @param {number} y Y coordinate.
     * @param {boolean} argmaxed True to read the argmax layout.
     * @param {number} pop Genome index.
     * @returns {number|Array<number>} The sampled layout value.
     */
    getLayoutAt(x,y,argmaxed,pop=0){
        if(argmaxed){
            return this.dataArgmax[pop][x][y];
        }
        else{
            return this.dataNormalized[pop][x][y];
        }
    }



    /**
     * Draw the cached layout grids to the canvas.
     *
     * @param {number} x X offset.
     * @param {number} y Y offset.
     * @param {number} size Cell size in pixels.
     * @param {boolean} useArgmaxed True to draw argmaxed layouts.
     */
    draw(x,y,size,useArgmaxed=true){
        stroke(0);
        strokeWeight(1);
        for(let i =0; i < this.pop_size; i++){
            this.drawSingle(x,y,size,useArgmaxed,i);
            y += this.size*size + 20;
        }    
    }

    drawSingle(x,y,size,useArgmaxed=true, pop=0){
        stroke(0);
        strokeWeight(1);
        for(let j = 0; j < this.size; j++){
            for(let k = 0; k < this.size; k++){
                let r=0, g=0, b=0;
                if(useArgmaxed){
                    r = this.colors[this.dataArgmax[pop][j][k]][0];
                    g = this.colors[this.dataArgmax[pop][j][k]][1];
                    b = this.colors[this.dataArgmax[pop][j][k]][2];
                }
                else{
                    for(let l = 0; l < this.genomeOutputN; l++){
                        r += this.dataNormalized[pop][j][k][l] * this.colors[l][0];
                        g += this.dataNormalized[pop][j][k][l] * this.colors[l][1];
                        b += this.dataNormalized[pop][j][k][l] * this.colors[l][2];
                    }
                }
                fill(int(r), int(g), int(b));
                rect(x + j * size, y + k * size, size, size);
            }
        }
    }
}