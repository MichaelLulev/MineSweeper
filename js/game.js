'use strict'

const HINT_TIMOUT = 1000
const SMILEY_TIMOUT = 1000
const REVEAL_CELL_TIMEOUT = 25

const CLS_GAME_BOARD_CELL = 'game-board-cell'
const CLS_MINE_BOARD_BODY = 'mine-board-body'
const CLS_MINE_BOARD_CELL = 'mine-board-cell'
const CLS_MINE_BOARD_CELL_FIRST = 'mine-board-cell-first'
const CLS_MINE_BOARD_CELL_CHEAT_MINE = 'mine-board-cell-cheat-mine'
const CLS_COVER_BOARD_BODY = 'cover-board-body'
const CLS_COVER_BOARD_CELL = 'cover-board-cell'
const CLS_COVER_BOARD_CELL_HINT = 'cover-board-cell-hint'
const CLS_COVER_BOARD_CELL_CHEAT_MINE = 'cover-board-cell-cheat-mine'
const CLS_COVER_BOARD_CELL_UNCOVERED = 'cover-board-cell-uncovered'

const CLS_GAME_OVER_MODAL = 'game-over-modal'
const CLS_GAME_OVER_MODAL_MESSAGE = 'game-over-modal-message'
const CLS_NORMAL_MODE_MESSAGE = 'normal-mode-message'
const CLS_CHEAT_MODE_MESSAGE = 'cheat-mode-message'
const CLS_HINT_MODE_MESSAGE = 'hint-mode-message'

const IMG_FLAG = '🚩'
const IMG_MINE = '💣'
const IMG_EXPLOTION = '💥'
const IMG_EMPTY = ' '
const IMG_SMILEY_NORAML = '😀'
const IMG_SMILEY_SAD = '😖'
const IMG_SMILEY_DEAD = '🤯'
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
var gSetSmileyTimoutId

function onInit(levelName) {
    if (gIsCheatMode === undefined) gIsCheatMode = false
    if (levelName !== undefined) gLevel = gLevels[levelName]
    else if (gLevel === undefined) gLevel = gLevels['medium']
    gIsGameOver = false
    gNumLives = gLevel.numLives
    gIsSafe = true
    gIsHintMode = false
    clearTimeout(gHintTimeoutId)
    clearTimeout(gSetSmileyTimoutId)
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

function onToggleCheatMode(isTurnOn) {
    if (isTurnOn === undefined) gIsCheatMode = ! gIsCheatMode
    else gIsCheatMode = isTurnOn
    renderHelpMessage()
    renderUpdateMineBoard()
}

function onToggleHintMode(isTurnOn) {
    if (isTurnOn === undefined) gIsHintMode = ! gIsHintMode
    else gIsHintMode = isTurnOn
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
        renderUpdateCell(clickedCell)
    } else revealCells(clickedCell)
    if (! gIsGameOver && checkVictory()) gameOver(true)
}

function onCellRightClick(row, col) {
    if (gIsGameOver) return
    const currCell = gMineBoard[row][col]
    if (currCell.isHidden) currCell.isFlagged = ! currCell.isFlagged
    if (checkVictory()) gameOver(true)
    renderUpdateMineBoard()
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
    for (var i = 0; i < randomEmptyCells.length; i++) {
        var currCell = randomEmptyCells[i]
        currCell.isMine = true
    }
}

function giveHint(cell) {
    onToggleHintMode(false)
    const hintCells = getAllNeighbouringCells(gMineBoard, cell.row, cell.col)
    hintCells.push(cell)
    forAllElements(hintCells, cell => cell.isHint = true)
    renderUpdateMineBoard()
    clearTimeout(gHintTimeoutId)
    gHintTimeoutId = setTimeout(() => {
        forAllCells(gMineBoard, cell => cell.isHint = false)
        renderUpdateMineBoard()
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

function revealCells(cell, depth=0) {
    if (! cell.isHidden || cell.isFlagged) return
    if (0 < cell.numNeighbouringMines) {
        cell.isHidden = false
        setTimeout(renderUpdateCell, depth * REVEAL_CELL_TIMEOUT, cell)
        return
    }
    cell.isHidden = false
    setTimeout(renderUpdateCell, depth * REVEAL_CELL_TIMEOUT, cell)
    const allNeighbouringCells = getAllNeighbouringCells(gMineBoard, cell.row, cell.col)
    for (var i = 0; i < allNeighbouringCells.length; i++) {
        var currCell = allNeighbouringCells[i]
        revealCells(currCell, depth + 1)
    }
}

function revealAllCells() {
    forAllCells(gMineBoard, cell => {
        cell.isHidden = false
        setTimeout(renderUpdateCell, (cell.row + cell.col) * REVEAL_CELL_TIMEOUT, cell)
    })
}

function gameOver(isVictory) {
    if (! isVictory && 0 < gNumLives) {
        gNumLives--
        renderLives(gNumLives)
        clearTimeout(gSetSmileyTimoutId)
        setSmiley(IMG_SMILEY_SAD)
        gSetSmileyTimoutId = setTimeout(setSmiley, SMILEY_TIMOUT, IMG_SMILEY_NORAML)
        return
    }
    gIsGameOver = true
    clearTimeout(gSetSmileyTimoutId)
    if (isVictory) setSmiley(IMG_SMILEY_HAPPY)
    else setSmiley(IMG_SMILEY_DEAD)
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
    var coverBoardHtmlStr = ''
    var mineBoardHtmlStr = ''
    for (var row = 0; row < gLevel.numRows; row++) {
        coverBoardHtmlStr += '<tr>\n'
        mineBoardHtmlStr += '<tr>\n'
        for (var col = 0; col < gLevel.numCols; col++) {
            var coverCellClasses = `${CLS_GAME_BOARD_CELL} ${CLS_COVER_BOARD_CELL}`
            var mineCellClasses = `${CLS_GAME_BOARD_CELL} ${CLS_MINE_BOARD_CELL}`
            var coverCellContent = IMG_EMPTY
            var mineCellContent = IMG_EMPTY
            coverBoardHtmlStr += `\t<td
            id="${getCoverCellId(row, col)}"
            class="${coverCellClasses}"
            onclick="onCellLeftClick(${row}, ${col})"
            oncontextmenu="onCellRightClick(${row}, ${col})"
            >\n\t${coverCellContent}</td>\n`
            mineBoardHtmlStr += `\t<td
            id="${getMineCellId(row, col)}"
            class="${mineCellClasses}"
            >\n\t${mineCellContent}\n
            \t</td>\n`
        }
        coverBoardHtmlStr += '</tr>\n'
        mineBoardHtmlStr += '</tr>\n'
    }
    const elCoverBoard = document.querySelector('.' + CLS_COVER_BOARD_BODY)
    elCoverBoard.innerHTML = coverBoardHtmlStr
    const elMineBoard = document.querySelector('.' + CLS_MINE_BOARD_BODY)
    elMineBoard.innerHTML = mineBoardHtmlStr
}

function renderUpdateMineBoard() {
    forAllCells(gMineBoard, currCell => renderUpdateCell(currCell))
}

function renderUpdateCell(cell) {
    var elCoverCell = document.querySelector(`#${getCoverCellId(cell.row, cell.col)}`)
    var elMineCell = document.querySelector(`#${getMineCellId(cell.row, cell.col)}`)
    if (cell.isFlagged) elCoverCell.innerHTML = IMG_FLAG
    else elCoverCell.innerHTML = IMG_EMPTY
    if (cell.isHint) elCoverCell.classList.add(CLS_COVER_BOARD_CELL_HINT)
    else elCoverCell.classList.remove(CLS_COVER_BOARD_CELL_HINT)
    if (! cell.isHidden) elCoverCell.classList.add(CLS_COVER_BOARD_CELL_UNCOVERED)
    if (! cell.isHidden || cell.isHint) {
        if (cell.isFirst) elMineCell.classList.add(CLS_MINE_BOARD_CELL_FIRST)
        if (cell.isExploded) elMineCell.innerHTML = IMG_EXPLOTION
        else if (cell.isMine) elMineCell.innerHTML = IMG_MINE
        else if (0 < cell.numNeighbouringMines) elMineCell.innerHTML = cell.numNeighbouringMines
        else elMineCell.innerHTML = IMG_EMPTY
    }
    if (gIsCheatMode && cell.isMine) {
        elCoverCell.classList.add(CLS_COVER_BOARD_CELL_CHEAT_MINE)
        elMineCell.classList.add(CLS_MINE_BOARD_CELL_CHEAT_MINE)
    } else {
        elCoverCell.classList.remove(CLS_COVER_BOARD_CELL_CHEAT_MINE)
        elMineCell.classList.remove(CLS_MINE_BOARD_CELL_CHEAT_MINE)
    }
}

function getCoverCellId(row, col) {
    return `cover-${row}-${col}`
}
function getMineCellId(row, col) {
    return `mine-${row}-${col}`
}