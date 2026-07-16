// TODO: Review the generated Doxygen comments in this file manually later.

/**
 * Coordinate a CPPN-driven WFC batch, including weight preparation and rendering.
 */
class Ruleset{
    /**
     * Create a ruleset for the given tileset and layout configuration.
     *
     * @param {Tileset} tileset Tileset used by the WFC instances.
     * @param {Object} weights Initial layout weights.
     * @param {number} layoutCount Number of layout channels.
     * @param {number} population Number of WFC instances to manage.
     * @param {number} defaultWeight Default weight used for missing entries.
     */
    constructor(tileset, weights, layoutCount, population=6, defaultWeight=0.1){
        this.tileset = tileset;
        this.layoutCount = layoutCount;
        this.population = population;
        this._createWeightDict(weights,defaultWeight,tileset.tileCount,layoutCount);
        this.normalizedWeights = new Array(this.population);
    }

    /**
     * Expand sparse weight data into a dense layout-by-tile dictionary.
     *
     * @param {Object} weights Sparse layout weights.
     * @param {number} defaultW Default weight value.
     * @param {number} tileCount Number of tiles.
     * @param {number} layoutCount Number of layouts.
     */
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

    /**
     * Precompute normalized weights for every WFC cell.
     *
     * @param {number} size Grid width and height.
     */
    precalculateNormWeightsAll(size){
        for(let i = 0; i < this.population ; i++){
            this.precalculateNormWeightsSingle(size,i);
        }
    }

    precalculateNormWeightsSingle(size,wfc_index){
        if(this.cppn.population.population[wfc_index] == null){
            this.normalizedWeights[wfc_index] = null;
            return;
        }

        this.normalizedWeights[wfc_index] = new Array(size);
        for(let j = 0; j < size; j++)
            this.normalizedWeights[wfc_index][j] = new Array(size);

        for(let x = 0; x < size; x++){
            for(let y = 0; y < size; y++){
                //TODO need multiple layouts for each wfc
                const layout = this.cppn.getLayoutAt(x,y,false,this.wfcs[wfc_index].id);
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
                this.normalizedWeights[wfc_index][x][y] = dict;
            }
        }
    }

    /**
     * Mutate the CPPN and restart the ruleset while keeping selected parents.
     *
     * @param {Array<number>} parents Indices of persistent parents.
     */
    evolve(parents){
        this.cppn.mutate(parents);
        this.restart(parents);
    }


    /**
     * Draw the current WFC grids, tileset, and CPPN debug views.
     *
     * @param {number} x X offset.
     * @param {number} y Y offset.
     */
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
            this.cppn.draw(offsetX+300,y,layoutTileSize,true);
            this.cppn.draw(offsetX,y,layoutTileSize,false);
        }
    }

    /**
     * Draw one WFC instance.
     *
     * @param {number} x X offset.
     * @param {number} y Y offset.
     * @param {number} wfcIndex WFC index to draw.
     */
    draw(x,y, wfcIndex=0){
        this.wfcs[wfcIndex].drawCurrentState(x,y);
    }

    /**
     * Draw all WFC instances in a grid layout and return their rectangles.
     *
     * @param {number} x X offset.
     * @param {number} y Y offset.
     * @param {number} columns Number of columns to use.
     * @returns {Object<number, {id: string, x: number, y: number, width: number, height: number}>} Hit rectangles for the rendered WFCs.
     */
    drawGrid(x,y, columns=5){
        this.columns = columns;
        const spacing = 16;
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

    /**
     * Build the CPPN and WFC instances, then initialize heuristics and weights.
     *
     * @param {number} size Grid size.
     * @param {number} tileHeuristic Tile heuristic selector.
     * @param {number} cellHeuristic Cell heuristic selector.
     */
    prepare(size,tileHeuristic = 0,cellHeuristic = 0){
        let tileHeuristicFunc = null;
        if(tileHeuristic == 1){
            tileHeuristicFunc = (x, y, wfc) => weightedNormalizedCollapseHeuristic(x, y, wfc, this.normalizedWeights);
        }
        else if(tileHeuristic == 2){
            tileHeuristicFunc = (x, y, wfc) => weightedArgmaxCollapseHeuristic(x, y, wfc, this.weights, this.cppn);
        }
        
        let cellHeuristicFunc = null;
        if(cellHeuristic == 1){
            cellHeuristicFunc = (wfc) => customHeuristic(maximumHeuristics, wfc, this.normalizedWeights);
        }
        else if(cellHeuristic == 2){
            cellHeuristicFunc = (wfc) => customHeuristic(shannonEntropy, wfc, this.normalizedWeights);
        }
        
        this.cppn = new CPPN(3, this.layoutCount, size, this.population);
        this.size = size;
        this.wfcs = [];
        for(let i = 0; i < this.population; i++){
            this.wfcs.push(new WFC(size, size, this.tileset, 3, tileHeuristicFunc, cellHeuristicFunc, i));
        }
        
        this.restart();
    }

    /**
     * Recompute weights and restart all non-parent WFC instances.
     *
     * @param {Array<number>} parents Indices of persistent parents.
     */
    restart(parents = []){
        //this.cppn.generateData();
        this.precalculateNormWeightsAll(this.size);
        for(let wfc of this.wfcs){
            if(!parents.includes(wfc.id))
                wfc.restart();
        }
    }

    /**
     * Check whether every managed WFC instance completed successfully.
     *
     * @returns {boolean} True if all WFCs have collapsed.
     */
    finishedSuccessfully(){
        for(let wfc of this.wfcs){
            if(!wfc.finishedSuccessfully()){
                return false;
            }
        }
        return true;
    }

    /**
     * Advance every WFC by one step, restarting failed instances.
     *
     * @param {Array<number>} parents Indices of persistent parents.
     */
    runStep(parents = []){
        for(let wfc of this.wfcs)
            if(!wfc.run(false))
                wfc.restart();
    }

    /**
     * Run every non-parent WFC until completion.
     *
     * @param {Array<number>} parents Indices of persistent parents.
     */
    run(parents = []){
        for(let wfc of this.wfcs)
            if(!parents.includes(wfc.id))
                wfc.run(true);
    }

    /**
     * Resolve a mouse coordinate to the corresponding WFC index.
     *
     * @param {number} x Mouse x-coordinate.
     * @param {number} y Mouse y-coordinate.
     * @returns {number} The matching WFC index or -1.
     */
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