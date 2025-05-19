class Cell{
    constructor(possibleTiles){
        this.possibleTiles = possibleTiles;
        this.tile = null;
    }

    possibleTilesToHash() {
        var hash = 0;
        for (var tile of this.possibleTiles) {
            hash += 2**tile;
        }
        return hash;
    }

    static cachedTileDict = {};

    draw(tileset,x,y){
        //TODO: single image
        if(this.tile != null){
            image(tileset.tiles[this.tile].image,x,y);
            return;
        }
        const hash = this.possibleTilesToHash();
        if(Cell.cachedTileDict.hasOwnProperty(hash)){
            image(Cell.cachedTileDict[hash],x,y);
            return;
        }
        let tile = createGraphics(tileset.tileSize,tileset.tileSize);
        tile.noSmooth();
        tile.pixelDensity(1);
        tile.loadPixels();
        for(let i=0;i<tileset.tileSize;i++){
            for(let j=0;j<tileset.tileSize;j++){
                for(let k=0;k<4;k++){
                    var avg_pixel = 0;
                    var count = 0;
                    for(let t of this.possibleTiles){
                        avg_pixel += tileset.tiles[t].image.pixels[(i+j*tileset.tileSize)*4+k];
                        count++;
                    }
                    tile.pixels[(i+j*tileset.tileSize)*4+k] = floor(avg_pixel*0.8/count);
                }
            }
        }
        tile.updatePixels();
        image(tile,x,y);
        Cell.cachedTileDict[this.possibleTilesToHash()] = tile;



    }
}

class WFC{
    constructor(width,height,tileset,nuking_limit=0,tileSelector=null,cellSelector=null){
        this.width = width;
        this.height = height;
        this.tileset = tileset;
        this.nuking = nuking_limit != 0;
        this.nuking_limit = nuking_limit;
        this.tileSelector = tileSelector || this._defaultCollapseHeuristic;
        this.cellSelector = cellSelector || this._defaultNextCellToCollapseHeuristic;

        
        this.restart();
    }

    restart(){
        this.map = [];
        this.nukemap = [];
        const allTiles = Array.from({ length: this.tileset.tileCount }, (_, i) => i);

        //stats
        this.nukesCount = 0;
        this.nukesRadiusSum = 0;

        for(var j=0;j<this.height;j++){
            this.map.push([]);
            if(this.nuking)
                this.nukemap.push(new Array(this.width).fill(0));
            for(var i=0;i<this.width;i++){
                this.map[j].push(new Cell(new Set(allTiles)));
            }
        }
    }

    _defaultCollapseHeuristic(x,y,wfc){
        // returns a random tile
        const possibleTiles = wfc.map[y][x].possibleTiles;
        return Array.from(possibleTiles)[floor(random(0,possibleTiles.size))];
    }

    _defaultNextCellToCollapseHeuristic(wfc){
        // returns a random cell with the least amount of possible tiles
        let minPossibleTiles = Infinity;
        let minCells = [];
        for(var j=0;j<this.height;j++){
            for(var i=0;i<this.width;i++){
                const cell = this.map[j][i];
                if(cell.tile != null){
                    continue;
                }
                if(cell.possibleTiles.size < minPossibleTiles){
                    minPossibleTiles = cell.possibleTiles.size;
                    minCells = [[i,j]];
                }
                else if(cell.possibleTiles.size == minPossibleTiles){
                    minCells.push([i,j]);
                }
            }
        }
        if(minCells.length == 0){
            return null;
        }
        return minCells[floor(random(0,minCells.length))];

    }

    tileExists(x,y){
        return x>=0 && x<this.width && y>=0 && y<this.height;
    }

    isTileValid(x,y,tile){
        const directions = [[1,0],[0,1],[-1,0],[0,-1]];
        const neededNeighbours = this.tileset.tiles[tile].neighbours;
        for (const i of [0,1,2,3]){
            const [dx,dy] = directions[i];
            const neededNeighbourTiles = neededNeighbours[i];
            if(this.tileExists(x+dx,y+dy)){
                if(this.map[y+dy][x+dx].possibleTiles.intersection(neededNeighbourTiles).size == 0){
                    return false;
                }
            }
        }
        return true;
    }

    drawCurrentState(){
        const gridlinesize = 0;
        for(var j=0;j<this.height;j++){
            for(var i=0;i<this.width;i++){
                this.map[j][i].draw(this.tileset,i*(gridlinesize+this.tileset.tileSize),j*(gridlinesize+this.tileset.tileSize));
            }
        }
    }

    collapse(x,y){
        const tileChosen = this.tileSelector(x,y,this);
        this.map[y][x].tile = tileChosen;
        this.map[y][x].possibleTiles = new Set([tileChosen]);
        return this.propagate(x,y);
    }

    propagate(x,y){
        const directions = [[1,0],[0,1],[-1,0],[0,-1]];
        const queue = [];
        for(const [dx,dy] of directions){
            queue.push([x+dx,y+dy]);
        }
        while(queue.length > 0){
            const [x,y] = queue.pop();
            if(!this.tileExists(x,y)){
                continue;
            }
            const cell = this.map[y][x];
            const validPossibleTiles = new Set();
            for(const tile of cell.possibleTiles){
                if(this.isTileValid(x,y,tile)){
                    validPossibleTiles.add(tile);
                }
            }
            if(validPossibleTiles.size == cell.possibleTiles.size){
                continue;
            }
            if(validPossibleTiles.size == 0){
                //console.error("No possible tiles for cell at ",x,y);
                return false;
            }
            cell.possibleTiles = validPossibleTiles;
            for(const [dx,dy] of directions){
                queue.push([x+dx,y+dy]);
            }
        }
        return true;
    }

    //its like propagate, but new superposition might appear which needs to be propagated
    //this is used for nuking
    propagate_extra(xys){
        const directions = [[1,0],[0,1],[-1,0],[0,-1]];
        const queue = [];

        const eqSet = (xs, ys) =>
            xs.size === ys.size &&
            [...xs].every((x) => ys.has(x));

        for(const [x,y] of xys){
            queue.push([x,y]);
        }
        while(queue.length > 0){
            const [x,y] = queue.pop();
            if(!this.tileExists(x,y)){
                continue;
            }
            if(this.map[y][x].tile != null)
                continue;
            const cell = this.map[y][x];
            const validPossibleTiles = new Set();
            for(const tile of this.tileset.tilesIDs){
                if(this.isTileValid(x,y,tile)){
                    validPossibleTiles.add(tile);
                }
            }
            if(eqSet(validPossibleTiles,cell.possibleTiles)){
                continue;
            }
            if(validPossibleTiles.size == 0){
                //console.error("No possible tiles for cell at ",x,y);
                return false;
            }
            cell.possibleTiles = validPossibleTiles;
            for(const [dx,dy] of directions){
                if(queue.some(([qx,qy]) => qx == x+dx && qy == y+dy)){
                    continue;
                }
                queue.push([x+dx,y+dy]);
            }
        }
        return true;
    }

    finishedSuccessfully(){
        for(var j=0;j<this.height;j++){
            for(var i=0;i<this.width;i++){
                if(this.map[j][i].tile == null){
                    return false;
                }
            }
        }
        return true;
    }

    nuke(x,y){
        const useManhattan = false;
        const currentNukeRange = this.nukemap[y][x] + 1;
        console.log("Nuking ",x,y," with range ",currentNukeRange);
        if(currentNukeRange > this.nuking_limit){
            return false;
        }
        const nuked = [];
        this.nukesCount++;
        this.nukesRadiusSum += currentNukeRange;

        for(var j=-currentNukeRange;j<=currentNukeRange;j++){
            for(var i=-currentNukeRange;i<=currentNukeRange;i++){
                if(useManhattan && abs(i)+abs(j) > r){
                    continue;
                }
                if(!this.tileExists(x+i,y+j)){
                    continue;
                }
                this.nukemap[y+j][x+i]++;
                nuked.push([x+i,y+j]);
                this.map[y+j][x+i].possibleTiles = new Set(this.tileset.tilesIDs);
                this.map[y+j][x+i].tile = null;
            }
        }
        const result = this.propagate_extra(nuked);
        if(!result)
            return this.nuke(x,y);
        return true;
    }

    runstep(){
        const cell = this.cellSelector(this);
        if(cell == null){
            return false;
        }
        const [x,y] = cell;
        const result = this.collapse(x,y);
        if(!result && this.nuking)
            return this.nuke(x,y);
        return result;
    }

    run(untilFinished = false){
        if(!untilFinished){
            while(this.runstep()){}
            return this.finishedSuccessfully();
        }

        while(!this.finishedSuccessfully()){
            this.restart();
            while(this.runstep()){}
        }
        return true;
    }

}