class CPPN {
    // nodes in, nodes out
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
        this.population.updateAlive();
        this.dataArgmax = null; // outputs, null if not generated yet
        this.dataNormalized = null; // outputs, null if not generated yet
        this.generateData();
    }

    generateData() {
        this.dataArgmax = new Array(this.pop_size);
        this.dataNormalized = new Array(this.pop_size);
        for(let i = 0; i < this.pop_size; i++){
            this.dataArgmax[i] = reshape(this.population.population[i].argmax_decisions, this.size, this.size);
            this.dataNormalized[i] = reshape(this.population.population[i].decisions, this.size, this.size);
        }
    }

    mutate(){
        this.population.population.forEach(player => {
            player.brain.mutate();
        });
        this.population.updateAlive();
        this.generateData();
    }

    getLayoutAt(x,y,argmaxed,pop=0){
        if(argmaxed){
            return this.dataArgmax[pop][x][y];
        }
        else{
            return this.dataNormalized[pop][x][y];
        }
    }



    draw(x,y,size,useArgmaxed=true){
        for(let i =0; i < this.pop_size; i++){
            for(let j = 0; j < this.size; j++){
                for(let k = 0; k < this.size; k++){
                    if(useArgmaxed){
                        let r = this.colors[this.dataArgmax[i][j][k]][0];
                        let g = this.colors[this.dataArgmax[i][j][k]][1];
                        let b = this.colors[this.dataArgmax[i][j][k]][2];
                        fill(r, g, b);
                        rect(x + j * size, y + k * size, size, size);
                    }
                    else{
                        let r=0, g=0, b=0;
                        for(let l = 0; l < this.genomeOutputN; l++){
                            r += this.dataNormalized[i][j][k][l] * this.colors[l][0];
                            g += this.dataNormalized[i][j][k][l] * this.colors[l][1];
                            b += this.dataNormalized[i][j][k][l] * this.colors[l][2];
                        }
                        fill(int(r), int(g), int(b));
                        rect(x + j * size, y + k * size, size, size);
                    }
                }
            }
            y += this.size*size + 20;
        }

    }
}