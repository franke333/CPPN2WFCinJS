//direction enum
var Direction = {
    RIGHT: 0,
    DOWN: 1,
    LEFT: 2,
    UP: 3
};

function oppositeDir(direction){
    return (direction + 2) % 4;
}

class Tile{
    constructor(image){
        this.image = image;
        this.hash = this.hashCode();
        this.id = -1;
        this.neighbours = [new Set(),new Set(),new Set(),new Set()];
    }
    hashCode(){
        let hash = 0;
        this.image.loadPixels();
        const size = this.image.width * this.image.height * 4;
        for(let i=0;i<size;i++)
            hash += this.image.pixels[i]*i*size;
        return hash;
    }
}

class Tileset {
    constructor(tileSize, tilesetImage){
        this.tileSize = tileSize;
        this.tilesetImage = tilesetImage;
        this.map = [];
        this.tiles = [];
        this.tilesIDs = [];
        this.tileDict = {};
        this.imageWidthInTiles = floor(this.tilesetImage.width / this.tileSize);
        this.imageHeightInTiles = floor(this.tilesetImage.height / this.tileSize);
        for(var j=0;j<this.imageHeightInTiles;j++){
            for(var i=0;i<this.imageWidthInTiles;i++){
                var tile = this.generateTile(i,j);
                if(tile.hash in this.tileDict){
                    tile = this.tileDict[tile.hash];
                }
                else{
                    this.tileDict[tile.hash] = tile;
                }
                this.map.push(tile);
            }
        }
        this.tileslength = this.imageWidthInTiles * this.imageHeightInTiles;
        this.idTiles();
        this.processNeighbours();
        this.tileCount = this.tiles.length;
    }
    
    generateTile(x,y){
        let tile = createGraphics(this.tileSize,this.tileSize);
        tile.noSmooth();
        tile.pixelDensity(1);
        tile.image(this.tilesetImage,0,0,this.tileSize,this.tileSize,x*this.tileSize,y*this.tileSize,this.tileSize,this.tileSize);
        return new Tile(tile);
    }

    idTiles(){
        let id = 0;
        for(let tile of Object.values(this.tileDict)){
            this.tiles.push(tile);
            tile.id = id;
            this.tilesIDs.push(id);
            id++;
        }
    }

    processNeighbours(){
        // horizontal
        for(var i = 0; i < this.imageWidthInTiles-1; i++){
            for(var j=0;j<this.imageHeightInTiles;j++){
                var tileLeft = this.map[j*this.imageWidthInTiles + i];
                var tileRight = this.map[j*this.imageWidthInTiles + i + 1];
                tileLeft.neighbours[Direction.RIGHT].add(tileRight.id);
                tileRight.neighbours[Direction.LEFT].add(tileLeft.id);
            }
        }
        // vertical
        for(var i = 0; i < this.imageWidthInTiles; i++){
            for(var j=0;j<this.imageHeightInTiles-1;j++){
                var tileUp = this.map[j*this.imageWidthInTiles + i];
                var tileDown = this.map[(j+1)*this.imageWidthInTiles + i];
                tileUp.neighbours[Direction.DOWN].add(tileDown.id);
                tileDown.neighbours[Direction.UP].add(tileUp.id);
            }
        }
    }

    /**
     * Display the tileset onto a place on the canvas.
     *
     * @param {number} x - The x-coordinate where the tileset should be drawn.
     * @param {number} y - The y-coordinate where the tileset should be drawn.
     * @param {number} perRow - The number of tiles to display per row. If -1, it will be calculated based on the number of tiles.
     * @param {boolean} displayIDs - Whether to display the IDs of the tiles.
     */
    drawTileset(x,y,perRow=-1,displayIDs=true){
        if(perRow == -1)
            perRow = ceil(sqrt(this.tilesIDs.length));
        
        for(var i=0;i<this.tilesIDs.length;i++){
            var tile = this.tiles[this.tilesIDs[i]];
            var tileX = x + (i % perRow) * (1+this.tileSize);
            var tileY = y + floor(i / perRow) * (1+this.tileSize);
            image(tile.image,tileX,tileY);
            if(displayIDs){
                fill(255,0,0);
                textSize(10);
                textAlign(CENTER,CENTER);
                text(tile.id,tileX+this.tileSize/2,tileY+this.tileSize/2);
            }
        }

    }
}

//debug function to compare two images
function compareImages(image1,image2){
    width = image1.width;
    height = image1.height;
    for(let i=0;i<width*height*4;i++){
        if(image1.pixels[i] != image2.pixels[i]){
            print(i,image1.pixels[i],image2.pixels[i]);
        }
    }
    print("done");
}
