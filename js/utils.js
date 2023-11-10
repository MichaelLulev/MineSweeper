'use strict'

function createMat(numRows, numCols, cellData, isCellDataFunc, ...args) {
    var mat = []
    for (var row = 0; row < numRows; row++) {
        mat[row] = []
        for (var col = 0; col < numCols; col++) {
            mat[row][col] = (isCellDataFunc) ? cellData(row, col, ...args) : cellData
        }
    }
    return mat
}

function forAllCells(mat, func, ...args) {
    const numRows = mat.length
    const newMat = []
    for (var row = 0; row < numRows; row++) {
        var currRow = mat[row]
        newMat[row] = forAllElements(currRow, func, ...args)
    }
    return newMat
}

function forAllElements(elements, func, ...args) {
    const newElements = []
    for (var i = 0; i < elements.length; i++) {
        var currElements = elements[i]
        newElements.push(func(currElements, ...args))
    }
    return newElements
}

function getCells(mat, func, rowIdxKey, colIdxKey) {
    const cellsCoords = getCellsCoords(mat, func, rowIdxKey, colIdxKey)
    const cells = []
    for (var i = 0; i < cellsCoords.length; i++) {
        var currCoords = cellsCoords[i]
        var row = currCoords[rowIdxKey]
        var col = currCoords[colIdxKey]
        var currCell = mat[row][col]
        cells.push(currCell)
    }
    return cells
}

function getCellsCoords(mat, checkFunction, rowIdxKey='i', colIdxKey='j') {
    const rows = mat.length
    const cols = mat[0].length
    const cellsCoords = []
    for (var row = 0; row < rows; row++) {
        for (var col = 0; col < cols; col++) {
            var currCell = mat[row][col]
            if (checkFunction(currCell)) {
                var coord = {}
                coord[rowIdxKey] = row
                coord[colIdxKey] = col
                cellsCoords.push(coord)
            }
        }
    }
    return cellsCoords
}

function countNeighbours(mat, rowIdx, colIdx, checkNeighbour, isNeighbourFunction, ...args) {
    const allNeighbouringCells = getAllNeighbouringCells(mat, rowIdx, colIdx)
    var neighbourCount = 0
    for (var i = 0; i < allNeighbouringCells.length; i++) {
        var currCell = allNeighbouringCells[i]
        if (isNeighbourFunction) neighbourCount += checkNeighbour(currCell, ...args) ? 1 : 0
        else neighbourCount += currCell === checkNeighbour ? 1 : 0
    }
    return neighbourCount
}

function getAllNeighbouringCells(mat, rowIdx, colIdx) {
    const neighbours = getCellsInRange(
        mat,
        rowIdx - 1,
        colIdx - 1,
        rowIdx + 1,
        colIdx + 1,
        cell => cell.row === rowIdx && cell.col === colIdx
    )
    return neighbours
}

function getCellsInRange(mat, startRowIdx, startColIdx, endRowIdx, endColIdx, checkExclude) {
    if (typeof checkExclude !== 'function') checkExclude = () => false
    const numRows = mat.length
    const numCols = mat[0].length
    startRowIdx = Math.max(startRowIdx, 0)
    startColIdx = Math.max(startColIdx, 0)
    endRowIdx = Math.min(endRowIdx, numRows - 1)
    endColIdx = Math.min(endColIdx, numCols - 1)
    const cellsInRange = []
    for (var row = startRowIdx; row <= endRowIdx; row++) {
        for (var col = startColIdx; col <= endColIdx; col++) {
            var currCell = mat[row][col]
            if (checkExclude(currCell)) continue
            cellsInRange.push(currCell)
        }
    }
    return cellsInRange
}

function removeRandomElement(elements) {
    if (elements.length === 0) return
    const randIdx = getRandomInt(0, elements.length)
    return elements.splice(randIdx, 1)[0]
}

function getRandomElements(elements, num) {
    const elementsCopy = elements.slice()
    const randomElements = []
    while (0 < num-- && 0 < elementsCopy.length) {
        var randomElement = removeRandomElement(elementsCopy)
        randomElements.push(randomElement)
    } 
    return randomElements
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min)
}

function getRandomIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}