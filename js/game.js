'use strict'

const NUM_EXTERMINATOR_MINES = 3

const SMILEY_TIMOUT = 1000
const HINT_TIMOUT = 1000
const MEGA_HINT_TIMOUT = 10000
const MARK_TIMOUT = 2000
const REVEAL_CELL_TIMEOUT = 25
const TIMER_UPDATE_INTERVAL = 47

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

const CLS_HELP_MODE_MESSAGE = 'help-mode-message'
const NORMAL_MODE_MESSAGE = 'Normal Mode'
const CHEAT_MODE_MESSAGE = ' < Cheat Mode > '
const MEGA_HINT_MODE_MESSAGE = ' < Mega Hint Mode > '
const HINT_MODE_MESSAGE = ' < Hint Mode > '

const CLS_GAME_OVER_MODAL = 'game-over-modal'
const CLS_GAME_OVER_MODAL_MESSAGE = 'game-over-modal-message'
const CLS_HIGH_SCORES_LIST = 'high-scores-list'

const IMG_FLAG = '🚩'
const IMG_MINE = '💣'
const IMG_EXPLOTION = '💥'
const IMG_EMPTY = ' '
const IMG_MARK = '👌'
const IMG_MEGA_HINT_MARK = '👍'
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

const isStorageAvailable = typeof Storage !== 'undefined'

var gIsCheatMode

var gIsGameOver
var gMineBoard
var gLevel
var gNumLives
var gIsFirstClick
var gIsHintMode
var gHintTimeoutId
var gSetSmileyTimoutId
var gStartTime
var gTimePlayed
var gTimerIntervalId
var gMarkTimoutId
var gGameStateStack
var gGameStateIdx
var gIsMegaHintMode
var gLastClickedCell
var gMegaHintTimoutId

function onInit(levelName) {
    if (gIsCheatMode === undefined) gIsCheatMode = false
    if (levelName !== undefined) gLevel = gLevels[levelName]
    else if (gLevel === undefined) gLevel = gLevels['medium']
    gGameStateStack = []
    gGameStateIdx = -1
    gIsGameOver = false
    gNumLives = gLevel.numLives
    gIsFirstClick = true
    gIsHintMode = false
    gIsMegaHintMode = false
    gLastClickedCell = null
    clearTimeout(gMegaHintTimoutId)
    clearTimeout(gHintTimeoutId)
    clearTimeout(gSetSmileyTimoutId)
    gMineBoard = createMat(gLevel.numRows, gLevel.numCols, createBoardCell, true)
    clearInterval(gTimerIntervalId)
    gTimePlayed = 0
    renderTimer()
    document.addEventListener('contextmenu', ev => ev.preventDefault())
    toggleGameOverModal(false, false)
    renderMineBoard()
    renderLives(gNumLives)
    renderHelpMessage()
    setSmiley(IMG_SMILEY_NORAML)
}

function renderTimer() {
    const elTimer = document.querySelector('.timer')
    elTimer.innerText = (gTimePlayed / 1000).toFixed(3)
}

function setSmiley(img) {
    const elButtonRestart = document.querySelector('button.restart')
    elButtonRestart.innerText = img
}

function renderLives() {
    const elNumLives = document.querySelector('.num-lives')
    elNumLives.innerText = gNumLives
}

function onToggleCheatMode(isState) {
    if (isState === undefined) gIsCheatMode = ! gIsCheatMode
    else gIsCheatMode = isState
    renderHelpMessage()
    renderUpdateMineBoard()
}

function onToggleMegaHintMode(isState) {
    if (isState === undefined) gIsMegaHintMode = ! gIsMegaHintMode
    else gIsMegaHintMode = isState
    if (gIsMegaHintMode) gIsHintMode = false
    else if (gLastClickedCell) gLastClickedCell.isMegaHintStart = false
    renderHelpMessage()
}

function onToggleHintMode(isState) {
    if (isState === undefined) gIsHintMode = ! gIsHintMode
    else gIsHintMode = isState
    if (gIsHintMode) gIsMegaHintMode = false
    renderHelpMessage()
}

function renderHelpMessage() {
    const elHelpModeMessage = document.querySelector('.' + CLS_HELP_MODE_MESSAGE)
    if (! gIsCheatMode && ! gIsMegaHintMode && ! gIsHintMode) {
        elHelpModeMessage.innerText = NORMAL_MODE_MESSAGE
    } else {
        elHelpModeMessage.innerText = ''
        elHelpModeMessage.innerText += gIsCheatMode ? CHEAT_MODE_MESSAGE : ''
        elHelpModeMessage.innerText += gIsMegaHintMode ? MEGA_HINT_MODE_MESSAGE : ''
        elHelpModeMessage.innerText += gIsHintMode ? HINT_MODE_MESSAGE : ''
    }
}

function onMarkSafeCell() {
    const safeCells = getMineBoardCells(
        cell => cell.isHidden && ! cell.isMine && ! cell.isHint && ! cell.isMarked
    )
    const randomSafeCell = getRandomElements(safeCells, 1)[0]
    if (randomSafeCell === undefined) return
    randomSafeCell.isMarked = true;
    renderUpdateCell(randomSafeCell)
    gMarkTimoutId = setTimeout(() => {
        randomSafeCell.isMarked = false
        renderUpdateCell(randomSafeCell)
    }, MARK_TIMOUT)
}

function onExterminator() {
    const mineCells = getMineBoardCells(cell => cell.isHidden && cell.isMine)
    const randomMineCells = getRandomElements(mineCells, NUM_EXTERMINATOR_MINES)
    forAllElements(randomMineCells, cell => cell.isMine = false)
    initNumNeighbouringMines()
    renderUpdateMineBoard()
}

function onUndo() {
    if (gGameStateIdx <= 0 || gIsGameOver) return
    const prevGameState = gGameStateStack[--gGameStateIdx]
    gMineBoard = JSON.parse(prevGameState)
    renderUpdateMineBoard()
}

function onRedo() {
    if (gGameStateStack.length - 1 <= gGameStateIdx || gIsGameOver) return
    const nextGameState = gGameStateStack[++gGameStateIdx]
    gMineBoard = JSON.parse(nextGameState)
    renderUpdateMineBoard()
}

function pushGameState() {
    if (gIsGameOver) return
    gGameStateStack.splice(++gGameStateIdx)
    const gameState = JSON.stringify(gMineBoard)
    gGameStateStack.push(gameState)
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
        isMarked: false,
        isMegaHintStart: false,
        numNeighbouringMines: -1,
        row,
        col,
    }
    return cell
}

function onCellLeftClick(row, col) {
    if (gIsGameOver) return
    const clickedCell = gMineBoard[row][col]
    if (gIsMegaHintMode) {
        if (! gLastClickedCell || ! gLastClickedCell.isMegaHintStart) {
            clickedCell.isMegaHintStart = true
            renderUpdateCell(clickedCell)
        } else giveMegaHint(gLastClickedCell, clickedCell)
        gLastClickedCell = clickedCell
        return
    }
    if (gIsHintMode) {
        giveHint(clickedCell)
        return
    }
    gLastClickedCell = clickedCell
    if (clickedCell.isFlagged || ! clickedCell.isHidden) return
    if (gIsFirstClick) {
        clickedCell.isFirst = true
        createSafeMines(clickedCell)
        gIsFirstClick = false
        initNumNeighbouringMines()
        clearInterval(gTimerIntervalId)
        gStartTime = Date.now()
        gTimerIntervalId = setInterval(() => {
            updateTimer()
            renderTimer()
        }, TIMER_UPDATE_INTERVAL);
        renderUpdateMineBoard()
        pushGameState()
    }
    if (clickedCell.isMine && clickedCell.isHidden) {
        clickedCell.isHidden = false
        clickedCell.isExploded = true
        gameOver(false)
        renderUpdateCell(clickedCell)
    } else revealCells(clickedCell)
    if (! gIsGameOver && checkVictory()) gameOver(true)
    if (! gIsFirstClick) pushGameState()
}

function updateTimer() {
    gTimePlayed = Date.now() - gStartTime
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

function giveMegaHint(startCell, endCell) {
    onToggleMegaHintMode(false)
    const startRow = Math.min(startCell.row, endCell.row)
    const startCol = Math.min(startCell.col, endCell.col)
    const endRow = Math.max(startCell.row, endCell.row)
    const endCol = Math.max(startCell.col, endCell.col)
    const hintCells = getCellsInRange(gMineBoard, startRow, startCol, endRow, endCol)
    forAllElements(hintCells, cell => cell.isHint = true)
    renderUpdateMineBoard()
    clearTimeout(gMegaHintTimoutId)
    gMegaHintTimoutId = setTimeout(() => {
        forAllCells(gMineBoard, cell => cell.isHint = false)
        renderUpdateMineBoard()
    }, MEGA_HINT_TIMOUT)
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

function revealCells(cell, originalCell) {
    if (! originalCell) originalCell = cell
    if (! cell.isHidden || cell.isFlagged) return
    if (0 < cell.numNeighbouringMines) {
        cell.isHidden = false
        setTimeout(renderUpdateCell, distanceBetweenCells(cell, originalCell) * REVEAL_CELL_TIMEOUT, cell)
        return
    }
    cell.isHidden = false
    setTimeout(renderUpdateCell, distanceBetweenCells(cell, originalCell) * REVEAL_CELL_TIMEOUT, cell)
    const allNeighbouringCells = getAllNeighbouringCells(gMineBoard, cell.row, cell.col)
    for (var i = 0; i < allNeighbouringCells.length; i++) {
        var currCell = allNeighbouringCells[i]
        revealCells(currCell, originalCell)
    }
}

function distanceBetweenCells(cell1, cell2) {
    return distance(cell1.row, cell1.col, cell2.row, cell2.col)
}

// function revealCells(cell, depth=0) {
//     if (! cell.isHidden || cell.isFlagged) return
//     if (0 < cell.numNeighbouringMines) {
//         cell.isHidden = false
//         setTimeout(renderUpdateCell, depth * REVEAL_CELL_TIMEOUT, cell)
//         return
//     }
//     cell.isHidden = false
//     setTimeout(renderUpdateCell, depth * REVEAL_CELL_TIMEOUT, cell)
//     const allNeighbouringCells = getAllNeighbouringCells(gMineBoard, cell.row, cell.col)
//     for (var i = 0; i < allNeighbouringCells.length; i++) {
//         var currCell = allNeighbouringCells[i]
//         revealCells(currCell, depth + 1)
//     }
// }

function revealAllCells(startCell) {
    if (! startCell) startCell = gMineBoard[0][0]
    forAllCells(gMineBoard, cell => {
        cell.isHidden = false
        setTimeout(renderUpdateCell, distanceBetweenCells(startCell, cell) * REVEAL_CELL_TIMEOUT, cell)
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
    clearInterval(gTimerIntervalId)
    updateTimer()
    renderTimer()
    gIsGameOver = true
    clearTimeout(gSetSmileyTimoutId)
    if (isVictory) setSmiley(IMG_SMILEY_HAPPY)
    else {
        setSmiley(IMG_SMILEY_DEAD)
        forAllCells(gMineBoard, cell => {
            if (cell.isMine) cell.isExploded = true
        })
    }
    if (isStorageAvailable) {
        const score = isVictory ? gTimePlayed : undefined
        const highScores = updateHighScores(score)
        renderHighScores(highScores)
    }
    revealAllCells(gLastClickedCell)
    toggleGameOverModal(true, isVictory)
}

function renderHighScores(highScores) {
    var htmlStr = ''
    forAllElements(highScores, score => {
        htmlStr += `<li>${score.toFixed(3)} s</li>\n`
    })
    const elHighScoresList = document.querySelector('.' + CLS_HIGH_SCORES_LIST)
    elHighScoresList.innerHTML = htmlStr
}

function updateHighScores(score, level) {
    if (! level) level = gLevel
    const highScoresKey = JSON.stringify(level)
    const highScoresStr = localStorage[highScoresKey]
    var highScores
    if (! highScoresStr) highScores = []
    else highScores = highScoresStr.split(',')
    if (! isNaN(score)) highScores.push(score / 1000)
    highScores = forAllElements(highScores, str => +str)
    highScores.sort((x, y) => x - y)
    localStorage[highScoresKey] = highScores
    return highScores
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
    const elGameOverModal = document.querySelector('.' + CLS_GAME_OVER_MODAL)
    if (isShow) {
        elGameOverMessage.innerText = isVictory ? 'You Win!' : 'Game Over!' 
        elGameOverModal.hidden = false
        elGameOverModal.style.opacity = 0
        setTimeout(() => elGameOverModal.style.opacity = 1, 0)
        
    } else {
        elGameOverMessage.innerText = ''
        elGameOverModal.hidden = true
    }
}

function getEmptyCells() {
    const emptyCellsCoords = getMineBoardCells(cell => ! cell.isMine && ! cell.isSafe)
    return emptyCellsCoords
}

function getMineBoardCells(func) {
    const cells = getCells(
        gMineBoard,
        func,
        'row',
        'col'
    )
    return cells
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
    if (cell.isMegaHintStart) elCoverCell.innerHTML = IMG_MEGA_HINT_MARK
    else if (cell.isMarked) elCoverCell.innerHTML = IMG_MARK
    else if (cell.isFlagged) elCoverCell.innerHTML = IMG_FLAG
    else elCoverCell.innerHTML = IMG_EMPTY
    if (cell.isHint) elCoverCell.classList.add(CLS_COVER_BOARD_CELL_HINT)
    else elCoverCell.classList.remove(CLS_COVER_BOARD_CELL_HINT)
    if (! cell.isHidden) elCoverCell.classList.add(CLS_COVER_BOARD_CELL_UNCOVERED)
    else elCoverCell.classList.remove(CLS_COVER_BOARD_CELL_UNCOVERED)
    if (! cell.isHidden || cell.isHint) {
        if (cell.isFirst) elMineCell.classList.add(CLS_MINE_BOARD_CELL_FIRST)
        if (cell.isMine && cell.isExploded) elMineCell.innerHTML = IMG_EXPLOTION
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