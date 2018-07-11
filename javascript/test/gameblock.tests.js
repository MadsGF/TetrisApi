function runGameBlockTests(){

    function gameBlockTest(testName, result, matrix){
        appendTestResult('GameBlock', testName, result, matrix);
    }

    var blockI = new GameBlock('I');
    gameBlockTest('name is set', blockI.name == 'I', blockI.toColorMatrix(0));
    
    var blockZ = new GameBlock('Z');
    gameBlockTest('block named Z has color set to 888888', blockZ.color == '888888', blockZ.toColorMatrix(0));

    var blockS = new GameBlock('S');
    gameBlockTest('block named S has expected rotation[0]',
        JSON.stringify(blockS.rotations[0]) ==
        JSON.stringify(
            [   [0,0,0,0],
                [0,1,1,0],
                [1,1,0,0],
                [0,0,0,0] ]
        ),
        blockS.toColorMatrix(0)
    );
    gameBlockTest('block named S has expected rotation[1]',
        JSON.stringify(blockS.rotations[1]) ==
        JSON.stringify(
            [   [1,0,0,0],
                [1,1,0,0],
                [0,1,0,0],
                [0,0,0,0] ]
        ),
        blockS.toColorMatrix(1)
    );
    gameBlockTest('block named S has expected rotation[2]',
        JSON.stringify(blockS.rotations[2]) ==
        JSON.stringify(
            [   [0,1,1,0],
                [1,1,0,0],
                [0,0,0,0],
                [0,0,0,0] ]
        ),
        blockS.toColorMatrix(2)
    );
    gameBlockTest('block named S has expected rotation[3]',
        JSON.stringify(blockS.rotations[3]) ==
        JSON.stringify(
            [   [0,1,0,0],
                [0,1,1,0],
                [0,0,1,0],
                [0,0,0,0] ]
        ),
        blockS.toColorMatrix(3)
    );
    var blockSCopy = blockS.copy();
    gameBlockTest('block can be copied', 
        blockSCopy.name == 'S' && blockSCopy.color == 'FF00FF',
        blockSCopy.toColorMatrix(0)
    );
}

runGameBlockTests();