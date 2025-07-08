class Ruleset{
    constructor(tileset, weights, layoutCount, defaultWeight=0.1){
        this.tileset = tileset;
        this.layoutCount = layoutCount;
        this._createWeightDict(weights,defaultWeight,tileset.tileCount,layoutCount);
    }

    _createWeightDict(weights,defaultW,tileCount,layoutCount){
        this.weights = {};
        for(let i = 0; i < layoutCount; i++){
            this.weights[i] = new Array(tileCount).fill(defaultW);
        }
        for(const [layer, tileWeights] of Object.entries(weights)){
            for(const [tile, weight] of Object.entries(tileWeights)){
                this.weights[layer][tile] = weight;
            }
        }
        //normalize each layer
        return;
        for(let i = 0; i < layoutCount; i++){
            let sum = 0;
            for(let j = 0; j < tileCount; j++){
                sum += this.weights[i][j];
            }
            if(sum != 0){
                for(let j = 0; j < tileCount; j++){
                    this.weights[i][j] /= sum;
                }
            }
        }
    }

    shannonEntropy(weights) {
        //normalize props
        let sum = 0;
        for(const tile of Object.keys(weights)){
            sum += weights[tile];
        }
        if(sum != 0){
            for(const tile of Object.keys(weights)){
                weights[tile] /= sum;
            }
        }
        const entropy = -Object.values(weights).reduce((acc, p) => {
            if (p > 0) {
                return acc + p * Math.log(p);
            }
            return acc;
        }, 0);
        return entropy;
    }

    fandaEntropy(weights) {
        const entropy = weights.reduce((acc, p) => {
            return p > acc ? p : acc;
        }, 0);
        return entropy;
    }

    customHeuristic(entropy,wfc){
        let bextX = -1;
        let bextY = -1;
        let bestHeuristic = -Infinity;
        for(let x = 0; x < wfc.width; x++){
            for(let y = 0; y < wfc.height; y++){
                if(wfc.map[y][x].tile != null){
                    continue;
                }
                const possibleTiles = wfc.map[y][x].possibleTiles;
                //filter possible tiles
                let p = {};
                for(const tile of possibleTiles){
                    p[tile] = this.normalizedWeights[x][y][tile];
                }
                const h = entropy(Object.values(p));
                if(h > bestHeuristic){
                    bestHeuristic = h;
                    bextX = x;
                    bextY = y;
                }
            }
        }
        if(bextX == -1 || bextY == -1){
            return null;
        }
        return [bextX, bextY];
    }

    weightedArgmaxCollapseHeuristic(x,y,wfc){
        const possibleTiles = wfc.map[y][x].possibleTiles;
        const layout = this.cppn.getLayoutAt(x,y,true);
        let dict = {};
        for(const tile of possibleTiles){
            dict[tile] = this.weights[layout][tile];
        }
        return int(weightedRandom(dict));
    }

    weightedNormalizedCollapseHeursitic(x,y,wfc){
        const possibleTiles = wfc.map[y][x].possibleTiles;
        let dict = {};
        for(const tile of possibleTiles){
            dict[tile] = this.normalizedWeights[x][y][tile];
        }
        const collapsedTile = int(weightedRandom(dict));
        console.log(x,y,dict,collapsedTile);
        return collapsedTile;
    }

    precalculateNormWeights(size){
        this.normalizedWeights = new Array(size);
        for(let i = 0; i < size; i++){
            this.normalizedWeights[i] = new Array(size);
        }
        for(let x = 0; x < size; x++){
            for(let y = 0; y < size; y++){
                const layout = this.cppn.getLayoutAt(x,y,false);
                let dict = {};
                for(const tile of Array(this.tileset.tileCount).keys()){
                    dict[tile] = 0;
                    for(let i = 0; i < this.layoutCount; i++){
                        dict[tile] += this.weights[i][tile] * layout[i];
                    }
                }
                //normalize p
                let sum = 0;
                for(const tile of Object.keys(dict)){
                    sum += dict[tile];
                }
                if(sum != 0){
                    for(const tile of Object.keys(dict)){
                        dict[tile] /= sum;
                    }
                }
                this.normalizedWeights[x][y] = dict;
            }
        }
    }


    drawRulesetDebug(x,y){
        let tileSize = this.tileset.tileSize;
        let offsetX = x;
        if(this.wfc){
            this.wfc.drawCurrentState(x,y);
            offsetX = tileSize*this.wfc.width+20;
        }
        this.tileset.drawTileset(offsetX,y);
        offsetX += ceil(sqrt(this.tileset.tileCount))* (tileSize+1) + 20;
        if(this.cppn){
            const layoutTileSize = 10;
            const offsetY = this.wfc.height * (layoutTileSize)+10 + y;
            this.cppn.draw(offsetX,y,layoutTileSize,true);
            this.cppn.draw(offsetX,offsetY,layoutTileSize,false);
        }
    }

    draw(x,y){
        this.wfc.drawCurrentState(x,y);
    }

    prepare(size,tileHeuristic = 0,cellHeuristic = 0){
        let tileHeuristicFunc = null;
        if(tileHeuristic == 1){
            tileHeuristicFunc = this.weightedNormalizedCollapseHeursitic.bind(this);
        }
        else if(tileHeuristic == 2){
            tileHeuristicFunc = this.weightedArgmaxCollapseHeuristic.bind(this);
        }
        
        let cellHeuristicFunc = null;
        if(cellHeuristic == 1){
            cellHeuristicFunc = this.customHeuristic.bind(this,this.fandaEntropy.bind(this));
        }
        else if(cellHeuristic == 2){
            cellHeuristicFunc = this.customHeuristic.bind(this,this.shannonEntropy.bind(this));
        }
        
        this.cppn = new CPPN(3, this.layoutCount, size, 10);
        this.size = size;
        this.wfc = new WFC(size, size, this.tileset, 10, tileHeuristicFunc, cellHeuristicFunc);
        
        this.restart();
    }

    restart(){
        this.cppn.generateData();
        this.precalculateNormWeights(this.size);
        this.wfc.restart();
    }

    runStep(){
        return this.wfc.runstep();
    }

    run(){
        this.wfc.run(true);
    }
}