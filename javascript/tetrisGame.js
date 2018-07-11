
/****************************************************************************************/
function GameBlock(blockName){

    function getBlockDefinitions(){

        function buildBlockDefinition(blockName, blockColor, rotationHexMaps){
            return {
                name: blockName,
                color: blockColor,
                rotations: rotationHexMaps
            };
        }

        return [
            buildBlockDefinition('I', 'FF0000', [0x0F00, 0x2222, 0x00F0, 0x4444]),
            buildBlockDefinition('J', '00FF00', [0x44C0, 0x8E00, 0x6440, 0x0E20]),
            buildBlockDefinition('L', '0000FF', [0x4460, 0x0E80, 0xC440, 0x2E00]),
            buildBlockDefinition('O', 'FFFF00', [0xCC00, 0xCC00, 0xCC00, 0xCC00]),
            buildBlockDefinition('S', 'FF00FF', [0x06C0, 0x8C40, 0x6C00, 0x4620]),
            buildBlockDefinition('T', '00FFFF', [0x0E40, 0x4C40, 0x4E00, 0x4640]),
            buildBlockDefinition('Z', '888888', [0x0C60, 0x4C80, 0xC600, 0x2640])
        ];
    }

    function buildRotationMatrices(rotationHexMaps){
        var rotations =  [undefined, undefined, undefined, undefined];
        for(r=0; r<4; r++){
            //console.log('rotation:'+r);
            rotations[r] = new Array(4);
            for(var y=0; y<4; y++){
                rotations[r][y] = new Array(4);
                for(var x=0; x<4; x++){
                    var shiftCount = 15 - y*4 - x;
                    //console.log('shift count:'+shiftCount);
                    var mask = 1 << shiftCount;
                    //console.log('mask:'+mask.toString(2));
                    rotations[r][y][x] = mask & rotationHexMaps[r] ? 1 : 0;
                }
            }
        }
        return rotations;
    }

    var def = getBlockDefinitions().find(function(value, index){
        return value.name == blockName
    });
    
    if(!def) throw Error('Unknown name:'+blockName);
    
    this.name = blockName;
    this.color = def.color;
    this.rotations = buildRotationMatrices(def.rotations);
}

GameBlock.prototype.toColorMatrix = function(rotationIndex){
    var rotation = this.rotations[rotationIndex];
    var matrix = [undefined,undefined,undefined,undefined]
    for(var y=0; y<4; y++){
        matrix[y] = [undefined,undefined,undefined,undefined]
        for(var x=0; x<4; x++){
            matrix[y][x] = rotation[y][x] ? this.color : undefined;
        }
    }
    return matrix;
}

GameBlock.prototype.copy = function(gameBlock){
    return new GameBlock(this.name);
}

/****************************************************************************************/
function BlockState(gameBlock, blockX, blockY, blockRotation){
    this.block = gameBlock;
    this.posX = blockX;
    this.posY = blockY;
    this.rotationIndex = blockRotation;
    
    this.currentRotation = function(){
        return this.block.rotations[this.rotationIndex];
    }
    this.copy = function(){
        return new BlockState(this.block.copy(), this.posX, this.posY, this.rotationIndex);
    }
}

/****************************************************************************************/
function BlockFactory(individualBlockCount){

    var available = [];

    function buildBlockSelection(){
        for(let i=0; i<individualBlockCount; i++){
            available.push(new GameBlock('I'));
            available.push(new GameBlock('J'));
            available.push(new GameBlock('L'));
            available.push(new GameBlock('O'));
            available.push(new GameBlock('S'));
            available.push(new GameBlock('T'));
            available.push(new GameBlock('Z'));
        }
    }

    buildBlockSelection();

    this.reset = function(){
        available = [];
        buildBlockSelection();
    }

    this.blockCount = function(){
        return available.length;
    }

    this.getBlock = function(){
        if(available.length == 0)
            buildBlockSelection();

        return available.splice(
            Math.round(Math.random()*available.length-1),
                1
        )[0];
    }
}

/****************************************************************************************/
function GameMap(rows, cols){
    this.board = undefined;

    this.resetMap = function(){
        this.board = new Array(rows);
        for(let i=0; i<rows; i++) {
            this.board[i] = new Array(cols);
        }
    }

    this.copy = function(){
        var copy = new GameMap(rows, cols);
        for(var row=0; row<this.board.length; row++){
            for(var col=0; col<this.board[row].length; col++){
                copy.board[row][col] = this.board[row][col];
            }
        }
        return copy;
    }

    this.resetMap();

    // blockPos: y=0 for top row, x=0 for leftmost col
    // callback: (x, y, mapValue, blockValue)
    this.eachBlockCell = function(blockState, callback){

        for(var y=0; y<4; y++){
            var mapY = blockState.posY + y;

            for(var x=0; x<4; x++){
                var mapX = blockState.posX + x;

                // mapValue
                var mapValue = undefined;
                if(mapX < 0 || mapX > cols-1) mapValue = "000000";
                else if(mapY > rows-1)  mapValue = "000000";
                else mapValue = this.board[mapY][mapX];

                // cellValue
                var blockCellHasValue = blockState.currentRotation()[y][x];      
                var blockCellValue = blockCellHasValue ? blockState.block.color : undefined;

                callback(x, y, mapValue, blockCellValue);
            }
        }
    }

    this.isValidPosition = function(blockState){
        var valid = true;
        function handleEach(x, y, mapValue, activePieceValue){
            if(!valid) return;

            if(mapValue != undefined && activePieceValue != undefined) valid = false;
        }

        this.eachBlockCell(blockState, handleEach);
        return valid;
    }

    this.mergeBlock = function(blockState){
        var that = this;
        this.eachBlockCell(blockState, 
            function(x, y, mapValue, blockValue){
                if(mapValue == undefined) // skip if map contains any value already
                    that.board[blockState.posY+y][blockState.posX+x] = blockValue; // Set to value or undefined
            });
    }

    this.removeFullLines = function(){
        var copy = this.copy();
        var rowsRemoved = 0;

        this.board = [];
        for(var y=rows-1; y>=0; y--){
            var allSet = true;
            for(var x=0; x<cols; x++){
                if(copy.board[y][x]==undefined){
                    allSet = false;
                    x = cols; // break
                }
            }
            if(!allSet) this.board.splice(0, 0, copy.board[y]);
            else rowsRemoved++;
        }
        for(var y=this.board.length; y<rows; y++)
            this.board.splice(0, 0, new Array(cols));

        return rowsRemoved;
    }
}

/****************************************************************************************/
var game = (function(){

    var blockFactory = new BlockFactory(5);

    const rows = 10;
    const cols = 10;
    const scoreRowMultiplier = 2;

    var gameMap, blockState;
    var score = 0;

    function resetMap(){
        gameMap = new GameMap(rows, cols);
        blockState = undefined;
        score = 0;
    }

    function spawnBlock(){
        blockState = new BlockState(
            blockFactory.getBlock(),
            Math.round(cols / 2) - 2,
            0,
            0
        );
    }

    function isValidPosition(){
        return gameMap.isValidPosition(blockState);
    }

    function canDropBlock(){
        if(!blockState) throw Error('No block');
        if(blockState.posY == rows-1) return false;
        blockState.posY++;
        var canDrop = isValidPosition();
        blockState.posY--;
        return canDrop;
    }

    function attemptStateChange(newState){
        var oldState = blockState;
        blockState = newState;
        if(!isValidPosition()){
            blockState = oldState;
        }
    }

    function calculateGameTickScore(rowsRemoved){
        var rowBaseScore = cols*10;
        if(rowsRemoved == 1) return rowBaseScore;
        else return rowsRemoved * rowBaseScore * scoreRowMultiplier;
    }

    resetMap();
    spawnBlock();

    return {
        getBoard: function(){
            var mapCopy = gameMap.copy();
            if(blockState){
                var blockCopy = blockState.copy();
                mapCopy.mergeBlock(blockCopy);
            }
            return mapCopy.board;
        },
        resetGame: function(){
            resetMap();
        },
        gameTick : function(){
            if(!blockState)
                spawnBlock();
            
            if(!isValidPosition())
                // game over
                return {
                    gameOver:true,
                    score:score
                };
            else{
                if(canDropBlock())
                    blockState.posY++;
                else{
                    gameMap.mergeBlock(blockState);
                    blockState = undefined;
                    var rowsRemoved = gameMap.removeFullLines();
                    score += calculateGameTickScore(rowsRemoved);
                    spawnBlock();
                }
            }
            return {
                gameOver:false,
                score:score
            };
        },
        moveLeft:function(){
            attemptStateChange(
                new BlockState(
                    blockState.block,
                    blockState.posX-1,
                    blockState.posY,
                    blockState.rotationIndex
                )
            );
        },
        moveRight:function(){
            attemptStateChange(
                new BlockState(
                    blockState.block,
                    blockState.posX+1,
                    blockState.posY,
                    blockState.rotationIndex
                )
            );
        },
        rotateLeft:function(){
            attemptStateChange(
                new BlockState(
                    blockState.block,
                    blockState.posX,
                    blockState.posY,
                    blockState.rotationIndex==0 ? 3 : blockState.rotationIndex-1
                )
            );
        },
        rotateRight:function(){
            attemptStateChange(
                new BlockState(
                    blockState.block,
                    blockState.posX,
                    blockState.posY,
                    blockState.rotationIndex==3 ? 0 : blockState.rotationIndex+1
                )
            );
        },
        moveDown:function(){

        }
    }
})();

//console.log(game.getMap());
