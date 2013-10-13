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

function cgolAreCellsEqual(cell1, cell2) {
    return cell1 == cell2;
}

function cgolFlipCell(grid, x, y) {
    if (cgolIsCellAlive(grid[x][y])) {
        cgolSetCellDead(grid, x, y);
    }
    else {
        cgolSetCellAlive(grid, x, y);
    }
}

function cgolInitialize(cgolUniverse, pattern) {
    var setCell; // function to apply to each cell
    
    if (pattern == "random") {
        setCell = cgolSetCellRandom;
    }
    else {
        setCell = cgolSetCellDead;
    }

    for (var x = 0; x < cgolUniverse.gridSize.x; x++) {
        for (var y = 0; y < cgolUniverse.gridSize.y; y++) {
            setCell(cgolUniverse.grid, x, y);
            
            // create adjacent cell lookup table
            cgolUniverse.adjacentCellLOT[x][y] = new Array();
            for (var offX = -1; offX < 2; offX++) {
                for (var offY = -1; offY < 2; offY++) {
                    if (!(offX == 0 && offY == 0)) {
                        cgolUniverse.adjacentCellLOT[x][y].push({
                            adjacentX: (x + offX + cgolUniverse.gridSize.x)
                            % cgolUniverse.gridSize.x,
                            adjacentY: (y + offY + cgolUniverse.gridSize.y)
                            % cgolUniverse.gridSize.y
                        });
                    }
                }
            }
        }
    }
}

function cgolIsCellDead(cell) {
    return !cell;
}

function cgolIsCellAlive(cell) {
    return cell;
}

function cgolSetCellAlive(grid, x, y) {
    grid[x][y] = true;
}

function cgolSetCellDead(grid, x, y) {
    grid[x][y] = false;
}

function cgolSetCellRandom(grid, x, y) {
    if (Math.floor(Math.random()*5) == 0) {
        cgolSetCellAlive(grid, x, y);
    }
    else {
        cgolSetCellDead(grid, x, y);
    }
}

function cgolUpdateUniverse(cgolUniverse) {
    // update universe
    for (var x = 0; x < cgolUniverse.gridSize.x; x++) {
        for (var y = 0; y < cgolUniverse.gridSize.y; y++) {
            // count adjacent cells
            var adjacentCellCount = 0;
            var sufficientCount = false;
            
            for (var i = 0; i < cgolUniverse.adjacentCellLOT[x][y].length
                    && !sufficientCount; i++) {
                adjacentX = cgolUniverse.adjacentCellLOT[x][y][i].adjacentX;
                adjacentY = cgolUniverse.adjacentCellLOT[x][y][i].adjacentY;
                
                if (cgolIsCellAlive(
                        cgolUniverse.grid[adjacentX][adjacentY])) {
                    adjacentCellCount++;
                    if (adjacentCellCount > 3) {
                        sufficientCount = true;
                    }
                }
            }
            
            if (cgolIsCellAlive(golUniverse.grid[x][y])) {
                if (adjacentCellCount < 2 || adjacentCellCount > 3) {
                    cgolSetCellDead(cgolUniverse.nextGrid, x, y);
                }
                else {
                    cgolSetCellAlive(cgolUniverse.nextGrid, x, y);
                }
            }
            else {
                if (adjacentCellCount == 3) {
                    cgolSetCellAlive(cgolUniverse.nextGrid, x, y);
                }
                else {
                    cgolSetCellDead(cgolUniverse.nextGrid, x, y);
                }
            }
        }
    }
}

