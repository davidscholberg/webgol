/**
 * @licstart  The following is the entire license notice for the 
 *  JavaScript code in this page.
 *
 * Copyright (C) 2013  David Scholberg <recombinant.vector@gmail.com>
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.  The code is distributed WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 *
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 */

var canvas = null;
var ctx = null;

var golUniverse = {
    cellSize: null,
    gridSize: {
        x: null,
        y: null
    },
    gridOffset: {
        x: null,
        y: null
    },
    grid: null,
    nextGrid: null,
    gridLineWidth: null,
    fps: null
}

var paused = true;
var intervalObject = null;

var editObject = {
    editMode: false,
    currentEditCell: {
        x: null,
        y: null
    },
    mouseDown: false
}

var musicIsOn = false;
var audioFiles = null;
var currentAudioFileIndex = null;

function golStart(initialState) {
    if (canvas == null) {
        canvas = document.getElementById("canvas");
    }

    if (canvas.getContext) {
        if (ctx == null) {
            ctx = canvas.getContext("2d");
            document.getElementById("canvasContainer").style.height =
                (document.getElementById("canvasContainer").offsetHeight
                - document.getElementById("menuContainer").offsetHeight)
                + 'px';
            
            ctx.canvas.width =
                document.getElementById("canvasContainer").offsetWidth;
            ctx.canvas.height =
                document.getElementById("canvasContainer").offsetHeight;
        }

        // initialize background
        eraseRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        golUniverse.gridLineWidth = 2;
        golUniverse.cellSize = 15;

        // set grid size, making room for outer gridlines
        golUniverse.gridSize.x = Math.floor(
            (ctx.canvas.width - golUniverse.gridLineWidth)
                / golUniverse.cellSize);
        golUniverse.gridSize.y = Math.floor(
            (ctx.canvas.height - golUniverse.gridLineWidth)
                / golUniverse.cellSize);

        golUniverse.gridOffset.x = Math.floor(
            ((ctx.canvas.width - golUniverse.gridLineWidth)
                % golUniverse.cellSize) / 2);
        golUniverse.gridOffset.y = Math.floor(
            ((ctx.canvas.height - golUniverse.gridLineWidth)
                % golUniverse.cellSize) / 2);

        if (golUniverse.grid == null) {
            golUniverse.grid = createEmpty2dArray(
                golUniverse.gridSize.x,
                golUniverse.gridSize.y);
        }

        if (golUniverse.nextGrid == null) {
            golUniverse.nextGrid = createEmpty2dArray(
                golUniverse.gridSize.x,
                golUniverse.gridSize.y);
        }

        initialState = typeof initialState !== 'undefined'
            ? initialState : "random";

        if (initialState == "random") {
            // initialize random world
            for (var i = 0; i < golUniverse.gridSize.x; i++) {
                for (var j = 0; j < golUniverse.gridSize.y; j++) {
                    golUniverse.grid[i][j] = Math.floor(Math.random()*5) == 0;
                    
                    // if this is a live cell, draw it
                    if (golUniverse.grid[i][j]) {
                        drawRect(
                            i * golUniverse.cellSize
                                + golUniverse.gridOffset.x,
                            j * golUniverse.cellSize
                                + golUniverse.gridOffset.y,
                            golUniverse.cellSize,
                            golUniverse.cellSize);
                    }
                }
            }

            if (editObject.editMode) {
                golToggleEdit();
            }
        }
        else if (initialState == "clear") {
            for (var i = 0; i < golUniverse.gridSize.x; i++) {
                for (var j = 0; j < golUniverse.gridSize.y; j++) {
                    golUniverse.grid[i][j] = false;
                }
            }

            if (!editObject.editMode) {
                golToggleEdit();
            }
            else {
                // draw gridlines again
                drawGridLines();
            }
        }

        if (golUniverse.fps == null) {
            golSetfps();
        }
    }
}

function createEmpty2dArray(x, y) {
    var grid = new Array(x);

    for (var i = 0; i < grid.length; i++) {
        grid[i] = new Array(y);
    }

    return grid;
}

function golUpdate() {
    // update universe
    for (var i = 0; i < golUniverse.gridSize.x; i++) {
        for (var j = 0; j < golUniverse.gridSize.y; j++) {
            // count adjacent cells
            var adjacentCellCount = 0;
            var sufficientCount = false;
            
            for (var k = -1; k < 2 && !sufficientCount; k++) {
                for (var l = -1; l < 2 && !sufficientCount; l++) {
                    if (!(k == 0 && l == 0)) {
                        currentX = (i + k + golUniverse.gridSize.x)
                            % golUniverse.gridSize.x;
                        currentY = (j + l + golUniverse.gridSize.y)
                            % golUniverse.gridSize.y;
                        
                        if (golUniverse.grid[currentX][currentY]) {
                            adjacentCellCount++;
                            if (adjacentCellCount > 3) {
                                sufficientCount = true;
                            }
                        }
                    }
                }
            }

            if (golUniverse.grid[i][j]) {
                if (adjacentCellCount < 2 || adjacentCellCount > 3) {
                    golUniverse.nextGrid[i][j] = false;
                }
                else {
                    golUniverse.nextGrid[i][j] = true;
                }
            }
            else {
                if (adjacentCellCount == 3) {
                    golUniverse.nextGrid[i][j] = true;
                }
                else {
                    golUniverse.nextGrid[i][j] = false;
                }
            }
        }
    }

    // draw universe
    for (var i = 0; i < golUniverse.gridSize.x; i++) {
        for (var j = 0; j < golUniverse.gridSize.y; j++) {
            if (golUniverse.nextGrid[i][j] != golUniverse.grid[i][j]) {
                if (golUniverse.nextGrid[i][j]) {
                    drawRect(
                        i * golUniverse.cellSize + golUniverse.gridOffset.x,
                        j * golUniverse.cellSize + golUniverse.gridOffset.y,
                        golUniverse.cellSize,
                        golUniverse.cellSize);
                }
                else {
                    eraseRect(
                        i * golUniverse.cellSize + golUniverse.gridOffset.x,
                        j * golUniverse.cellSize + golUniverse.gridOffset.y,
                        golUniverse.cellSize,
                        golUniverse.cellSize);
                }
            }
        }
    }

    // swap grids
    var prevGrid = golUniverse.grid;
    golUniverse.grid = golUniverse.nextGrid;
    golUniverse.nextGrid = prevGrid; // keep old array
}

function golTogglePause() {
    paused = !paused;
    if (paused) {
        // stop update loop
        clearInterval(intervalObject);
        document.getElementById("togglePause").textContent = "Start";
    }
    else {
        if (editObject.editMode) {
            golToggleEdit();
        }
        // start update loop
        intervalObject = setInterval(golUpdate, 1000 / golUniverse.fps);
        document.getElementById("togglePause").textContent = "Stop";
    }
}

function golToggleMusic() {
    musicIsOn = !musicIsOn;
    if (musicIsOn) {
        if (audioFiles == null) {
            audioFiles = document.getElementsByTagName("audio");
            currentAudioFileIndex = 0;
        }

        audioFiles[currentAudioFileIndex].play();

        document.getElementById("toggleMusic").textContent = "Pause music";
    }
    else {
        audioFiles[currentAudioFileIndex].pause();
        document.getElementById("toggleMusic").textContent = "Play music";
    }
}

function playNextSong() {
    currentAudioFileIndex = (currentAudioFileIndex + 1) % audioFiles.length;
    audioFiles[currentAudioFileIndex].play();
}

function golToggleEdit() {
    editObject.editMode = !(editObject.editMode);
    
    if (editObject.editMode) {
        if (!paused) {
            golTogglePause();
        }

        drawGridLines();
        canvas.addEventListener('mousedown', mouseDownEditHandler, false);
        canvas.addEventListener('mousemove', mouseMoveEditHandler, false);
        canvas.addEventListener('mouseup', mouseUpEditHandler, false);
        canvas.addEventListener('mouseout', mouseOutEditHandler, false);
    }
    else {
        canvas.removeEventListener('mousedown', mouseDownEditHandler, false);
        canvas.removeEventListener('mousemove', mouseMoveEditHandler, false);
        canvas.removeEventListener('mouseup', mouseUpEditHandler, false);
        canvas.removeEventListener('mouseup', mouseOutEditHandler, false);
        
        // effectively erases gridlines
        drawAllCells();
    }
}

function mouseDownEditHandler(event) {
    var mousePos = getMousePosInCanvas(canvas, event);

    if (mousePos.x < golUniverse.gridOffset.x
        || mousePos.x >= golUniverse.cellSize * golUniverse.gridSize.x
            + golUniverse.gridOffset.x
        || mousePos.y < golUniverse.gridOffset.y
        || mousePos.y >= golUniverse.cellSize * golUniverse.gridSize.y
            + golUniverse.gridOffset.y) {
        return;
    }

    var currentEditCell = {x: null, y: null};
    
    currentEditCell.x = Math.floor(
        (mousePos.x - golUniverse.gridOffset.x)
        / golUniverse.cellSize);
    currentEditCell.y = Math.floor(
        (mousePos.y - golUniverse.gridOffset.y)
        / golUniverse.cellSize);

    golUniverse.grid[currentEditCell.x][currentEditCell.y]
        = !(golUniverse.grid[currentEditCell.x][currentEditCell.y]);

    if (golUniverse.grid[currentEditCell.x][currentEditCell.y]) {
        drawRect(
            currentEditCell.x * golUniverse.cellSize 
                + golUniverse.gridOffset.x + golUniverse.gridLineWidth / 2,
            currentEditCell.y * golUniverse.cellSize 
                + golUniverse.gridOffset.y + golUniverse.gridLineWidth / 2,
            golUniverse.cellSize - golUniverse.gridLineWidth,
            golUniverse.cellSize - golUniverse.gridLineWidth
            );
    }
    else {
        eraseRect(
            currentEditCell.x * golUniverse.cellSize 
                + golUniverse.gridOffset.x + golUniverse.gridLineWidth / 2,
            currentEditCell.y * golUniverse.cellSize 
                + golUniverse.gridOffset.y + golUniverse.gridLineWidth / 2,
            golUniverse.cellSize - golUniverse.gridLineWidth,
            golUniverse.cellSize - golUniverse.gridLineWidth
            );
    }

    editObject.currentEditCell = currentEditCell;
    editObject.mouseDown = true;
}

function mouseMoveEditHandler(event) {
    if (!editObject.mouseDown) {
        return;
    }

    var mousePos = getMousePosInCanvas(canvas, event);
    
    if (mousePos.x < golUniverse.gridOffset.x
        || mousePos.x >= golUniverse.cellSize * golUniverse.gridSize.x
            + golUniverse.gridOffset.x
        || mousePos.y < golUniverse.gridOffset.y
        || mousePos.y >= golUniverse.cellSize * golUniverse.gridSize.y
            + golUniverse.gridOffset.y) {
        editObject.mouseDown = false;
        return;
    }

    var currentEditCell = {x: null, y: null};
    
    currentEditCell.x = Math.floor(
        (mousePos.x - golUniverse.gridOffset.x)
        / golUniverse.cellSize);
    currentEditCell.y = Math.floor(
        (mousePos.y - golUniverse.gridOffset.y)
        / golUniverse.cellSize);

    if (editObject.currentEditCell.x != currentEditCell.x
        || editObject.currentEditCell.y != currentEditCell.y) {
    
        golUniverse.grid[currentEditCell.x][currentEditCell.y]
            = !(golUniverse.grid[currentEditCell.x][currentEditCell.y]);

        if (golUniverse.grid[currentEditCell.x][currentEditCell.y]) {
            drawRect(
                currentEditCell.x * golUniverse.cellSize 
                    + golUniverse.gridOffset.x
                    + golUniverse.gridLineWidth / 2,
                currentEditCell.y * golUniverse.cellSize 
                    + golUniverse.gridOffset.y
                    + golUniverse.gridLineWidth / 2,
                golUniverse.cellSize - golUniverse.gridLineWidth,
                golUniverse.cellSize - golUniverse.gridLineWidth
                );
        }
        else {
            eraseRect(
                currentEditCell.x * golUniverse.cellSize 
                    + golUniverse.gridOffset.x
                    + golUniverse.gridLineWidth / 2,
                currentEditCell.y * golUniverse.cellSize 
                    + golUniverse.gridOffset.y
                    + golUniverse.gridLineWidth / 2,
                golUniverse.cellSize - golUniverse.gridLineWidth,
                golUniverse.cellSize - golUniverse.gridLineWidth
                );
        }

        editObject.currentEditCell = currentEditCell;
    }
}

function mouseUpEditHandler(event) {
    editObject.mouseDown = false;
}

function mouseOutEditHandler(event) {
    editObject.mouseDown = false;
}

function getMousePosInCanvas(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

function golSetfps() {
    var fpsInput = document.getElementById('fpsInput');

    if (golUniverse.fps == null) {
        golUniverse.fps = 20; // sane default
    }
    else if (fpsInput.value > 0) {
        golUniverse.fps = fpsInput.value;
    }
    
    fpsInput.value = golUniverse.fps;

    if (!paused) {
        clearInterval(intervalObject);
        intervalObject = setInterval(golUpdate, 1000 / golUniverse.fps);
    }
}

function drawGridLines() {
    for (var i = 0; i <= golUniverse.gridSize.x; i++) {
        drawGridLine(
            i * golUniverse.cellSize + golUniverse.gridOffset.x
                - golUniverse.gridLineWidth / 2,
            golUniverse.gridOffset.y,
            golUniverse.gridLineWidth,
            golUniverse.cellSize * golUniverse.gridSize.y);
    }

    for (var i = 0; i <= golUniverse.gridSize.y; i++) {
        drawGridLine(
            golUniverse.gridOffset.x,
            i * golUniverse.cellSize + golUniverse.gridOffset.y
                - golUniverse.gridLineWidth / 2,
            golUniverse.cellSize * golUniverse.gridSize.x,
            golUniverse.gridLineWidth);
    }
}

function drawAllCells() {
    eraseRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    for (var i = 0; i < golUniverse.gridSize.x; i++) {
        for (var j = 0; j < golUniverse.gridSize.y; j++) {
            if (golUniverse.grid[i][j]) {
                drawRect(
                    i * golUniverse.cellSize + golUniverse.gridOffset.x,
                    j * golUniverse.cellSize + golUniverse.gridOffset.y,
                    golUniverse.cellSize,
                    golUniverse.cellSize);
            }
            else {
                eraseRect(
                    i * golUniverse.cellSize + golUniverse.gridOffset.x,
                    j * golUniverse.cellSize + golUniverse.gridOffset.y,
                    golUniverse.cellSize,
                    golUniverse.cellSize);
            }
        }
    }
}

function drawGridLine(x, y, width, length) {
    ctx.fillStyle = "rgb(55,55,55)";
    ctx.fillRect (x, y, width, length);
}

function drawRect(x, y, width, length) {
    ctx.fillStyle = "rgb(0,200,200)";
    ctx.fillRect (x, y, width, length);
}

function eraseRect(x, y, width, length) {
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect (x, y, width, length);
}
