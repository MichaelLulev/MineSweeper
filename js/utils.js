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

function getEmptyCoords(mat, checkEmpty, rowIdxKey='i', colIdxKey='j') {
    const rows = mat.length
    const cols = mat[0].length
    const emptyCoords = []
    for (var row = 0; row < rows; row++) {
        for (var col = 0; col < cols; col++) {
            var currCell = mat[row][col]
            if (checkEmpty(currCell)) {
                var coord = {}
                coord[rowIdxKey] = row
                coord[colIdxKey] = col
                emptyCoords.push(coord)
            }
        }
    }
    return emptyCoords
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
    const numRows = mat.length
    const numCols = mat[0].length
    const startRowIdx = Math.max(0, rowIdx - 1)
    const startColIdx = Math.max(0, colIdx - 1)
    const endRowIdx = Math.min(rowIdx + 1, numRows - 1)
    const endColIdx = Math.min(colIdx + 1, numCols - 1)
    const neighbours = []
    for (var row = startRowIdx; row <= endRowIdx; row++) {
        for (var col = startColIdx; col <= endColIdx; col++) {
            if (row === rowIdx && col === colIdx) continue
            var currCell = mat[row][col]
            neighbours.push(currCell)
        }
    }
    return neighbours
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

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min)
}

function getRandomIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}