class Ruleset{
    constructor(tileset, weights, layoutCount, population=6, defaultWeight=0.1){
        this.tileset = tileset;
        this.layoutCount = layoutCount;
        this.population = population;
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
                    p[tile] = this.normalizedWeights[wfc.id][x][y][tile];
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
        const layout = this.cppn.getLayoutAt(x,y,true,wfc.id);
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
            dict[tile] = this.normalizedWeights[wfc.id][x][y][tile];
        }
        const collapsedTile = int(weightedRandom(dict));
        //console.log(x,y,dict,collapsedTile);
        return collapsedTile;
    }

    precalculateNormWeights(size){
        this.normalizedWeights = new Array(this.population )
        for(let i = 0; i < this.population ; i++){
            this.normalizedWeights[i] = new Array(size);
            for(let j = 0; j < size; j++){
                this.normalizedWeights[i][j] = new Array(size);
            }
        }
        for(let l = 0; l < this.population; l++){
            for(let x = 0; x < size; x++){
                for(let y = 0; y < size; y++){
                    //TODO need multiple layouts for each wfc
                    const layout = this.cppn.getLayoutAt(x,y,false,this.wfcs[l].id);
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
                    this.normalizedWeights[l][x][y] = dict;
                }
            }
        }
    }


    drawRulesetDebug(x,y){
        let tileSize = this.tileset.tileSize;
        let offsetX = x;
        let offsetY = y;
        for(let wfc of this.wfcs){
            wfc.drawCurrentState(offsetX,offsetY);
            offsetY += tileSize*wfc.height + 20;
        }
        offsetX = tileSize*this.wfcs[0].width+20;
        this.tileset.drawTileset(offsetX,y);
        offsetX += ceil(sqrt(this.tileset.tileCount))* (tileSize+1) + 20;
        if(this.cppn){
            const layoutTileSize = 10;
            const offsetY = this.wfcs[0].height * (layoutTileSize)+10 + y;
            this.cppn.draw(offsetX,y,layoutTileSize,true);
            this.cppn.draw(offsetX,offsetY,layoutTileSize,false);
        }
    }

    draw(x,y, wfcIndex=0){
        this.wfcs[wfcIndex].drawCurrentState(x,y);
    }

    drawGrid(x,y, columns=5){
        this.columns = columns;
        const spacing = 25;
        const rects = {};
        for(let i = 0; i < this.population; i++){
            const width = this.tileset.tileSize * this.wfcs[i].width;
            const height = this.tileset.tileSize * this.wfcs[i].height;
            
            const offsetX = x + (i % columns) * (width + spacing);
            const offsetY = y + floor(i / columns) * (height + spacing);
            this.draw(offsetX, offsetY, i);
            
            rects[i] = { id: str(i), x: offsetX, y: offsetY, width: width, height: height };
        }
        return rects;
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
        
        this.cppn = new CPPN(3, this.layoutCount, size, this.population);
        this.size = size;
        this.wfcs = [];
        for(let i = 0; i < this.population; i++){
            this.wfcs.push(new WFC(size, size, this.tileset, i, tileHeuristicFunc, cellHeuristicFunc, i));
        }
        
        this.restart();
    }

    restart(parents = []){
        this.cppn.generateData();
        this.precalculateNormWeights(this.size);
        for(let wfc of this.wfcs){
            if(!parents.includes(wfc.id))
                wfc.restart();
        }
    }

    finishedSuccessfully(){
        for(let wfc of this.wfcs){
            if(!wfc.finishedSuccessfully()){
                return false;
            }
        }
        return true;
    }

    runStep(parents = []){
        for(let wfc of this.wfcs)
            if(!wfc.run(false))
                wfc.restart();
    }

    run(parents = []){
        for(let wfc of this.wfcs)
            if(!parents.includes(wfc.id))
                wfc.run(true);
    }

    getWFCIndexByCoords(x,y){
        const spacing = 25;
        const borderThickness = 8;
        const offset = 10;
        const imageSize = this.wfcs[0].width * this.tileset.tileSize;
        const columns = this.columns;
        const rows = ceil(this.population / columns);
        for(let i = 0; i < this.population; i++){
            const offsetX = offset + (i % columns) * (imageSize + spacing);
            const offsetY = offset + floor(i / columns) * (imageSize + spacing);
            if(x >= offsetX - borderThickness && x <= offsetX + imageSize + borderThickness &&
               y >= offsetY - borderThickness && y <= offsetY + imageSize + borderThickness){
                return i;
            }
        }
        return -1;
    }
}