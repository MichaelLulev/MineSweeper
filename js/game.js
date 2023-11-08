'use strict'

const HINT_TIMOUT = 1000

const CLS_MINE_BOARD = 'mine-board'
const CLS_CELL = 'mine-board-cell'
const CLS_MINE = 'mine-board-cell-mine'
const CLS_EMPTY = 'mine-board-cell-empty'
const CLS_HIDDEN = 'mine-board-cell-hidden'
const CLS_HINT = 'mine-board-cell-hint'
const CLS_FIRST_CELL = 'mine-board-cell-first'
const CLS_MINE_CHEAT = 'mine-board-cell-cheat-mine'

const CLS_GAME_OVER_MODAL = 'game-over-modal'
const CLS_GAME_OVER_MODAL_MESSAGE = 'game-over-modal-message'
const CLS_NORMAL_MODE_MESSAGE = 'normal-mode-message'
const CLS_CHEAT_MODE_MESSAGE = 'cheat-mode-message'
const CLS_HINT_MODE_MESSAGE = 'hint-mode-message'

const IMG_FLAG = '🚩'
const IMG_BOMB = '💣'
const IMG_EXPLOTION = '💥'
const IMG_EMPTY = ' '
const IMG_SMILEY_NORAML = '😀'
const IMG_SMILEY_SAD = '🤯'
const IMG_SMILEY_HAPPY = '😎'

const gLevels = {
    beginner: {
        numRows: 4,
        numCols: 4,
        numMines: 2,
        numLives: 3,
    },
    medium: {
        numRows: 8,
        numCols: 8,
        numMines: 14,
        numLives: 3,
    },
    expert: {
        numRows: 12,
        numCols: 12,
        numMines: 32,
        numLives: 3,
    },
}

var gIsCheatMode

var gIsGameOver
var gMineBoard
var gLevel
var gNumLives
var gIsSafe
var gIsHintMode
var gHintTimeoutId

function onInit(levelName) {
    if (gIsCheatMode === undefined) gIsCheatMode = false
    if (levelName !== undefined) gLevel = gLevels[levelName]
    else if (gLevel === undefined) gLevel = gLevels['medium']
    gIsGameOver = false
    gNumLives = gLevel.numLives
    gIsSafe = true
    gIsHintMode = false
    clearTimeout(gHintTimeoutId)
    gHintTimeoutId = 0
    gMineBoard = createMat(gLevel.numRows, gLevel.numCols, createBoardCell, true)
    // console.log(gMineBoard)
    document.addEventListener('contextmenu', ev => ev.preventDefault())
    toggleGameOverModal(false, false)
    renderMineBoard()
    renderLives(gNumLives)
    setSmiley(IMG_SMILEY_NORAML)
}

function setSmiley(img) {
    const elButtonRestart = document.querySelector('button.restart')
    elButtonRestart.innerText = img
}

function renderLives() {
    const elNumLives = document.querySelector('.num-lives')
    elNumLives.innerText = gNumLives
}

function renderHelpMessage() {
    const elNormalModemessage = document.querySelector('.' + CLS_NORMAL_MODE_MESSAGE)
    const elCheatModemessage = document.querySelector('.' + CLS_CHEAT_MODE_MESSAGE)
    const elHintModemessage = document.querySelector('.' + CLS_HINT_MODE_MESSAGE)
    elNormalModemessage.hidden = gIsCheatMode || gIsHintMode
    elCheatModemessage.hidden = ! gIsCheatMode
    elHintModemessage.hidden = ! gIsHintMode
}

function onToggleCheatMode() {
    gIsCheatMode = ! gIsCheatMode
    renderHelpMessage()
    renderMineBoard()
}

function onToggleHintMode() {
    gIsHintMode = ! gIsHintMode
    renderHelpMessage()
}

function createBoardCell(row, col) {
    const cell = {
        isSafe: false,
        isMine: false,
        isExploded: false,
        isHidden: true,
        isHint: false,
        isFirst: false,
        isFlagged: false,
        numNeighbouringMines: -1,
        row,
        col,
    }
    return cell
}

function onCellLeftClick(row, col) {
    if (gIsGameOver) return
    const clickedCell = gMineBoard[row][col]
    if (gIsHintMode) {
        giveHint(clickedCell)
        return
    }
    if (clickedCell.isFlagged) return
    if (gIsSafe) {
        clickedCell.isFirst = true
        createSafeMines(clickedCell)
        gIsSafe = false
        initNumNeighbouringMines()
    }
    if (clickedCell.isMine && clickedCell.isHidden) {
        clickedCell.isHidden = false
        clickedCell.isExploded = true
        gameOver(false)
    } else revealCells(clickedCell)
    if (! gIsGameOver && checkVictory()) gameOver(true)
    renderMineBoard()
}

function onCellRightClick(row, col) {
    if (gIsGameOver) return
    const currCell = gMineBoard[row][col]
    if (currCell.isHidden) currCell.isFlagged = ! currCell.isFlagged
    if (checkVictory()) gameOver(true)
    renderMineBoard()
}

function createSafeMines(firstCell) {
    const neighbouringCells = getAllNeighbouringCells(gMineBoard, firstCell.row, firstCell.col)
    forAllElements(neighbouringCells, cell => cell.isSafe = true)
    firstCell.isSafe = true
    createRandomMines(gLevel.numMines)
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

function giveHint(cell) {
    onToggleHintMode()
    const hintCells = getAllNeighbouringCells(gMineBoard, cell.row, cell.col)
    hintCells.push(cell)
    forAllElements(hintCells, cell => cell.isHint = true)
    renderMineBoard()
    clearTimeout(gHintTimeoutId)
    gHintTimeoutId = setTimeout(() => {
        forAllCells(gMineBoard, cell => cell.isHint = false)
        renderMineBoard()
    }, HINT_TIMOUT)
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

function gameOver(isVictory) {
    if (! isVictory && 0 < gNumLives) {
        gNumLives--
        renderLives(gNumLives)
        return
    }
    gIsGameOver = true
    if (isVictory) setSmiley(IMG_SMILEY_HAPPY)
    else setSmiley(IMG_SMILEY_SAD)
    revealAllCells()
    toggleGameOverModal(true, isVictory)
}

function checkVictory() {
    var isVictory = true
    forAllCells(gMineBoard, cell => {
        if (cell.isFlagged && ! cell.isMine ||
            cell.isHidden && ! cell.isFlagged) isVictory = false
    })
    return isVictory
}

function toggleGameOverModal(isShow, isVictory) {
    const elGameOverMessage = document.querySelector('.' + CLS_GAME_OVER_MODAL_MESSAGE)
    const elGameOver = document.querySelector('.' + CLS_GAME_OVER_MODAL)
    if (isShow) {
        elGameOverMessage.innerText = isVictory ? 'You Win!' : 'Game Over!' 
        elGameOver.hidden = false
    } else {
        elGameOverMessage.innerText = ''
        elGameOver.hidden = true
    }
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
    for (var row = 0; row < gLevel.numRows; row++) {
        htmlStr += '<tr>\n'
        for (var col = 0; col < gLevel.numCols; col++) {
            var currCell = gMineBoard[row][col]
            var clsCellType = currCell.isMine ? CLS_MINE : CLS_EMPTY
            var cellContent = IMG_EMPTY
            if (currCell.isHidden && ! currCell.isHint) {
                clsCellType = CLS_HIDDEN
                if (currCell.isFlagged) cellContent = IMG_FLAG
            } else if (currCell.isMine) {
                if (currCell.isExploded) cellContent = IMG_EXPLOTION
                else cellContent = IMG_BOMB
            } else if (0 < currCell.numNeighbouringMines) cellContent = currCell.numNeighbouringMines
            else if (currCell.isFirst) clsCellType += ' ' + CLS_FIRST_CELL
            if (currCell.isHint && currCell.isHidden) clsCellType += ' ' + CLS_HINT
            if (gIsCheatMode && currCell.isMine) clsCellType += ' ' + CLS_MINE_CHEAT
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