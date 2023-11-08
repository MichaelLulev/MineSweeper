'use strict'

const NUM_ROWS = 4
const NUM_COLS = 4
const NUM_MINES = 4

const CLS_MINE_BOARD = 'mine-board'
const CLS_CELL = 'mine-board-cell'
const CLS_MINE = 'mine-board-cell-mine'
const CLS_EMPTY = 'mine-board-cell-empty'
const CLS_HIDDEN = 'mine-board-cell-hidden'
const CLS_FIRST_CELL = 'mine-board-cell-first'

var gMineBoard
var gIsSafe


function onInit() {
    document.addEventListener('contextmenu', ev => ev.preventDefault())
    gIsSafe = true
    gMineBoard = createMat(NUM_ROWS, NUM_ROWS, createBoardCell, true)
    console.log(gMineBoard)
    renderMineBoard()
}

function createBoardCell(row, col) {
    const cell = {
        isSafe: false,
        isMine: false,
        isHidden: true,
        isFirst: false,
        isFlagged: false,
        numNeighbouringMines: -1,
        row,
        col,
    }
    return cell
}

function onCellLeftClick(row, col) {
    const clickedCell = gMineBoard[row][col]
    if (clickedCell.isFlagged) return
    if (gIsSafe) {
        clickedCell.isFirst = true
        createSafeMines(clickedCell)
        gIsSafe = false
        initNumNeighbouringMines()
    }
    if (clickedCell.isMine) gameOver()
    else revealCells(clickedCell)
    renderMineBoard()
}

function onCellRightClick(row, col) {
    const currCell = gMineBoard[row][col]
    if (currCell.isHidden) currCell.isFlagged = ! currCell.isFlagged
    renderMineBoard()
}

function createSafeMines(firstCell) {
    const neighbouringCells = getAllNeighbouringCells(gMineBoard, firstCell.row, firstCell.col)
    forAllElements(neighbouringCells, cell => cell.isSafe = true)
    firstCell.isSafe = true
    createRandomMines(NUM_MINES)
    forAllElements(neighbouringCells, cell => cell.isSafe = false)
    firstCell.isSafe = false
}

function createRandomMines(num) {
    const emptyCells = getEmptyCells()
    const randomEmptyCells = getRandomElements(emptyCells, num)
    // console.log(randomEmptyCells)
    for (var i = 0; i < randomEmptyCells.length; i++) {
        var currCell = randomEmptyCells[i]
        currCell.isMine = true
    }
}

function initNumNeighbouringMines() {
    const emptyCells = getEmptyCells()
    for (var i = 0; i < emptyCells.length; i++) {
        var currCell = emptyCells[i]
        currCell.numNeighbouringMines = countNeighbouringMines(currCell.row, currCell.col)
    }
}

function countNeighbouringMines(row, col) {
    return countNeighbours(gMineBoard, row, col, cell => cell.isMine, true)
}

function revealCells(cell) {
    if (! cell.isHidden || cell.isFlagged) return
    if (0 < cell.numNeighbouringMines) {
        cell.isHidden = false
        return
    }
    cell.isHidden = false
    const allNeighbouringCells = getAllNeighbouringCells(gMineBoard, cell.row, cell.col)
    for (var i = 0; i < allNeighbouringCells.length; i++) {
        var currCell = allNeighbouringCells[i]
        revealCells(currCell)
    }
}

function revealAllCells() {
    forAllCells(gMineBoard, cell => cell.isHidden = false)
}

function gameOver() {
    revealAllCells()
}

function getEmptyCells() {
    const emptyCellsCoords = getEmptyCoords(gMineBoard, cell => ! cell.isMine && ! cell.isSafe, 'row', 'col')
    const emptyCells = []
    for (var i = 0; i < emptyCellsCoords.length; i++) {
        var currCoords = emptyCellsCoords[i]
        emptyCells.push(gMineBoard[currCoords.row][currCoords.col])
    }
    return emptyCells
}

function renderMineBoard() {
    var htmlStr = ''
    for (var row = 0; row < NUM_ROWS; row++) {
        htmlStr += '<tr>\n'
        for (var col = 0; col < NUM_COLS; col++) {
            var currCell = gMineBoard[row][col]
            var clsCellType = currCell.isMine ? CLS_MINE : CLS_EMPTY
            var cellContent = ''
            if (currCell.isHidden) {
                clsCellType = CLS_HIDDEN
                if (currCell.isFlagged) cellContent = '🚩'
            } else if (currCell.isMine) cellContent = '💣'
            else if (0 < currCell.numNeighbouringMines) cellContent = currCell.numNeighbouringMines
            else if (currCell.isFirst) clsCellType += ' ' + CLS_FIRST_CELL
            htmlStr += `\t<td class="${CLS_CELL} ${clsCellType}"
            onclick="onCellLeftClick(${row}, ${col})"
            oncontextmenu="onCellRightClick(${row}, ${col})">
            \n\t${cellContent}\n\t</td>\n`
        }
        htmlStr += '</tr>\n'
    }
    // console.log(htmlStr)
    const elMineBoard = document.querySelector('.' + CLS_MINE_BOARD)
    elMineBoard.innerHTML = htmlStr
}