'use strict'

const NUM_EXTERMINATOR_MINES = 3

const MEGA_HINT_TIMOUT = 2000
const HINT_TIMOUT = 1000
const MARK_TIMOUT = 2000
const HIDE_MODAL_TIMOUT = 1000
const HIDE_COVER_BOARD_TIMEOUT = 200

const SMILEY_TIMOUT = 1000
const REVEAL_CELL_TIMEOUT = 25
const TIMER_UPDATE_INTERVAL = 47

const CLS_PLACE_MINES_BUTTON = 'place-mines-button'
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
const CLS_COVER_BOARD_CELL_SELECTED = 'cover-board-cell-selected'
const CLS_INVISIBLE_BOARD_BODY = 'invisible-board-body'
const CLS_INVISIBLE_BOARD_CELL = 'invisible-board-cell'

const CLS_HELP_MODE_MESSAGE = 'help-mode-message'
const NORMAL_MODE_MESSAGE = 'Normal Mode'
const CHEAT_MODE_MESSAGE = ' < Cheat Mode > '
const MEGA_HINT_MODE_MESSAGE = ' < Mega Hint Mode > '
const HINT_MODE_MESSAGE = ' < Hint Mode > '

const CLS_CLOSE_MODAL_BUTTON = 'close-modal-button'
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
const IMG_LIFE = '💖'
const IMG_NO_LIFE = '🕳'
const IMG_DARK_THEME = '🌒'
const IMG_LIGHT_THEME = '🌞'

const CLS_CSS_THEME = 'css-theme'
const CLS_TOGGLE_THEMES_BUTTON = 'toggle-themes-button'
const DIR_LIGHT_THEME = 'css/light-theme.css'
const DIR_DARK_THEME = 'css/dark-theme.css'
const DIR_DEFAULT_THEME = DIR_LIGHT_THEME
const STORAGE_KEY_THEME = 'theme'

const ID_NUM_ROWS = 'num-rows'
const ID_NUM_COLS = 'num-cols'
const ID_NUM_MINES = 'num-mines'
const ID_NUM_LIVES = 'num-lives'

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
var gCustomLevel
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
var gPrevClickedCell
var gMegaHintTimoutId
var gThemeDir
var gIsCoverBoardHidden
var gIsPlacedMines

var gElNumRows
var gElNumCols
var gElNumMines
var gElNumLives

function onInit(levelName) {
    if (gIsCheatMode === undefined) gIsCheatMode = false
    if (levelName !== undefined) gLevel = gLevels[levelName]
    else if (gLevel === undefined) gLevel = gLevels['medium']
    else gLevel = gCustomLevel
    gGameStateStack = []
    gGameStateIdx = -1
    gIsGameOver = false
    gNumLives = gLevel.numLives
    gIsFirstClick = true
    gIsHintMode = false
    gIsMegaHintMode = false
    gIsPlacedMines = false
    gPrevClickedCell = null
    clearTimeout(gMegaHintTimoutId)
    clearTimeout(gHintTimeoutId)
    clearTimeout(gSetSmileyTimoutId)
    gMineBoard = createMat(gLevel.numRows, gLevel.numCols, createBoardCell, true)
    clearInterval(gTimerIntervalId)
    gTimePlayed = 0
    gThemeDir = localStorage[STORAGE_KEY_THEME]
    if (! gThemeDir) gThemeDir = DIR_DEFAULT_THEME
    gElNumRows = document.querySelector('#' + ID_NUM_ROWS)
    gElNumCols = document.querySelector('#' + ID_NUM_COLS)
    gElNumMines = document.querySelector('#' + ID_NUM_MINES)
    gElNumLives = document.querySelector('#' + ID_NUM_LIVES)
    renderLevelDetailed()
    setCustomLevel()
    renderTheme()
    renderTimer()
    document.addEventListener('contextmenu', ev => ev.preventDefault())
    onToggleModal(false, false)
    renderMineBoard()
    toggleCoverBoard(false)
    renderLives()
    renderHelpMessage()
    setSmiley(IMG_SMILEY_NORAML)
}

function onPlaceMines() {
    toggleCoverBoard()
}

function toggleCoverBoard(isHidden) {
    if (! gIsFirstClick) return
    const elCoverBoard = document.querySelector('.' + CLS_COVER_BOARD_BODY)
    const elPlaceMinesButton = document.querySelector('.' + CLS_PLACE_MINES_BUTTON)
    if (isHidden === undefined) gIsCoverBoardHidden = ! gIsCoverBoardHidden
    else gIsCoverBoardHidden = isHidden
    if (gIsCoverBoardHidden) {
        elPlaceMinesButton.innerText = 'Done!'
        elCoverBoard.style.opacity = 0
        setTimeout(() => elCoverBoard.hidden = true, HIDE_COVER_BOARD_TIMEOUT)
        forAllCells(gMineBoard, cell => cell.isHidden = false)
        renderUpdateMineBoard()
    } else {
        elPlaceMinesButton.innerText = 'Place Mines'
        elCoverBoard.hidden = false
        setTimeout(() => elCoverBoard.style.opacity = 1, 0)
        forAllCells(gMineBoard, cell => {
            cell.isHidden = true
            if (cell.isMine) gIsPlacedMines = true
        })
        renderUpdateMineBoard()
    }
}

function onPlaceMine(row, col) {
    const clickecCell = gMineBoard[row][col]
    if (clickecCell.isMine) clickecCell.isMine = false
    else clickecCell.isMine = true
    renderUpdateCell(clickecCell)
}

function renderLevelDetailed() {
    gElNumRows.value = gLevel.numRows
    gElNumCols.value = gLevel.numCols
    gElNumMines.max = Math.floor(gLevel.numRows * gLevel.numCols / 2)
    gElNumMines.value = gLevel.numMines
    gElNumLives.value = gLevel.numLives
}

function setCustomLevel() {
    gCustomLevel = {
        numRows: gElNumRows.value,
        numCols: gElNumCols.value,
        numMines: gElNumMines.value,
        numLives: gElNumLives.value,
    }
}

function renderTimer() {
    const elTimer = document.querySelector('.timer')
    elTimer.innerText = (gTimePlayed / 1000).toFixed(3)
}

function setSmiley(img) {
    const elButtonRestart = document.querySelector('.restart-smiley')
    elButtonRestart.innerText = img
}

function renderLives() {
    const elNumLives = document.querySelector('.num-lives')
    elNumLives.innerText = 0 < gNumLives ? IMG_LIFE.repeat(gNumLives) : IMG_NO_LIFE
}

function onToggleTheme() {
    if (gThemeDir === DIR_DARK_THEME) gThemeDir = DIR_LIGHT_THEME
    else gThemeDir = DIR_DARK_THEME
    localStorage[STORAGE_KEY_THEME] = gThemeDir
    renderTheme()
}

function renderTheme() {
    const elToggleThemesButton = document.querySelector('.' + CLS_TOGGLE_THEMES_BUTTON)
    const cssTheme = document.querySelector('.' + CLS_CSS_THEME)
    if (gThemeDir === DIR_DARK_THEME) elToggleThemesButton.innerHTML = IMG_LIGHT_THEME
    else elToggleThemesButton.innerHTML = IMG_DARK_THEME
    cssTheme.href = gThemeDir
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
    if (gIsMegaHintMode) onToggleHintMode(false)
    else if (gPrevClickedCell) forAllCells(gMineBoard, cell => cell.isSelected = false)
    renderHelpMessage()
}

function onToggleHintMode(isState) {
    if (isState === undefined) gIsHintMode = ! gIsHintMode
    else gIsHintMode = isState
    if (gIsHintMode) onToggleMegaHintMode(false)
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
    pushGameState()
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
    const prevGameState = gGameStateStack[gGameStateIdx]
    var newGameState = JSON.stringify(gMineBoard)
    newGameState = JSON.parse(newGameState)
    forAllCells(newGameState, cell => {
        cell.isHint = false
        cell.isMarked = false
        cell.isSelected = false
    })
    newGameState = JSON.stringify(newGameState)
    if (newGameState === prevGameState) return
    gGameStateStack.splice(++gGameStateIdx)
    gGameStateStack.push(newGameState)
}

function createBoardCell(row, col) {
    const cell = {
        isSafe: false,
        isMine: false,
        isExploded: false,
        isHidden: true,
        isFirst: false,
        isFlagged: false,
        isHint: false,
        isMarked: false,
        isSelected: false,
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
        if (! gPrevClickedCell || ! gPrevClickedCell.isSelected) {
            clickedCell.isSelected = true
            renderUpdateCell(clickedCell)
        } else giveMegaHint()
        gPrevClickedCell = clickedCell
        return
    }
    if (gIsHintMode) {
        giveHint(clickedCell)
        return
    }
    gPrevClickedCell = clickedCell
    if (clickedCell.isFlagged || ! clickedCell.isHidden) return
    if (gIsFirstClick) {
        clickedCell.isFirst = true
        if(! gIsPlacedMines) createSafeMines(clickedCell)
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

function giveMegaHint() {
    forAllCells(gMineBoard, cell => {
        if (cell.isSelected) {
            cell.isHint = true
        }
    })
    onToggleMegaHintMode(false)
    renderUpdateMineBoard()
    clearTimeout(gMegaHintTimoutId)
    gMegaHintTimoutId = setTimeout(() => {
        forAllCells(gMineBoard, cell => cell.isHint = false)
        renderUpdateMineBoard()
    }, MEGA_HINT_TIMOUT)
}

function onSelect(row, col) {
    if (! gPrevClickedCell || ! gPrevClickedCell.isSelected) return
    forAllCells(gMineBoard, cell => cell.isSelected = false)
    const selectedCells = getCellsInRangeOmniDir(gMineBoard, gPrevClickedCell.row, gPrevClickedCell.col, row, col)
    forAllElements(selectedCells, cell => cell.isSelected = true)
    renderUpdateMineBoard()
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
        renderLives()
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
    revealAllCells(gPrevClickedCell)
    onToggleModal(true, isVictory)
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

function onToggleModal(isShow, isVictory) {
    const elGameOverMessage = document.querySelector('.' + CLS_GAME_OVER_MODAL_MESSAGE)
    const elGameOverModal = document.querySelector('.' + CLS_GAME_OVER_MODAL)
    if (isShow) {
        elGameOverMessage.innerText = isVictory ? 'You Win!' : 'Game Over!' 
        elGameOverModal.hidden = false
        elGameOverModal.style.opacity = 0
        setTimeout(() => elGameOverModal.style.opacity = 1, 0)
        
    } else {
        elGameOverModal.style.opacity = 1
        setTimeout(() => elGameOverModal.style.opacity = 0, 0)
        setTimeout(() => elGameOverModal.hidden = true, HIDE_MODAL_TIMOUT)
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
    var strCoverBoardHtml = ''
    var strMineBoardHtml = ''
    var strInvisibleBoardHtml = ''
    for (var row = 0; row < gLevel.numRows; row++) {
        strCoverBoardHtml += '<tr>\n'
        strMineBoardHtml += '<tr>\n'
        strInvisibleBoardHtml += '<tr>\n'
        for (var col = 0; col < gLevel.numCols; col++) {
            var coverCellClasses = `${CLS_GAME_BOARD_CELL} ${CLS_COVER_BOARD_CELL}`
            var mineCellClasses = `${CLS_GAME_BOARD_CELL} ${CLS_MINE_BOARD_CELL}`
            var invisibleBoardClasses = `${CLS_GAME_BOARD_CELL} ${CLS_INVISIBLE_BOARD_CELL}`
            var coverCellContent = IMG_EMPTY
            var mineCellContent = IMG_EMPTY
            strCoverBoardHtml += `\t<td
            id="${getCoverCellId(row, col)}"
            class="${coverCellClasses}"
            onclick="onCellLeftClick(${row}, ${col})"
            oncontextmenu="onCellRightClick(${row}, ${col})"
            onmouseover="onSelect(${row}, ${col})"
            >\n\t${coverCellContent}\n
            \t</td>\n`
            strMineBoardHtml += `\t<td
            id="${getMineCellId(row, col)}"
            class="${mineCellClasses}"
            onclick="onPlaceMine(${row}, ${col})"
            >\n\t${mineCellContent}\n
            \t</td>\n`
            strInvisibleBoardHtml += `\t<td
            class="${invisibleBoardClasses}"
            ><td>\n`
        }
        strCoverBoardHtml += '</tr>\n'
        strMineBoardHtml += '</tr>\n'
        strInvisibleBoardHtml += '</tr>\n'
    }
    const elCoverBoard = document.querySelector('.' + CLS_COVER_BOARD_BODY)
    elCoverBoard.innerHTML = strCoverBoardHtml
    const elMineBoard = document.querySelector('.' + CLS_MINE_BOARD_BODY)
    elMineBoard.innerHTML = strMineBoardHtml
    const elInvisibleBoard = document.querySelector('.' + CLS_INVISIBLE_BOARD_BODY)
    elInvisibleBoard.innerHTML = strInvisibleBoardHtml
}

function renderUpdateMineBoard() {
    forAllCells(gMineBoard, currCell => renderUpdateCell(currCell))
}

function renderUpdateCell(cell) {
    var elCoverCell = document.querySelector(`#${getCoverCellId(cell.row, cell.col)}`)
    var elMineCell = document.querySelector(`#${getMineCellId(cell.row, cell.col)}`)
    if (cell.isMarked) elCoverCell.innerHTML = IMG_MARK
    else if (cell.isFlagged) elCoverCell.innerHTML = IMG_FLAG
    else elCoverCell.innerHTML = IMG_EMPTY
    if (cell.isSelected) elCoverCell.classList.add(CLS_COVER_BOARD_CELL_SELECTED)
    else elCoverCell.classList.remove(CLS_COVER_BOARD_CELL_SELECTED)
    if (cell.isHint) elCoverCell.classList.add(CLS_COVER_BOARD_CELL_HINT)
    else elCoverCell.classList.remove(CLS_COVER_BOARD_CELL_HINT)
    if (! cell.isHidden) elCoverCell.classList.add(CLS_COVER_BOARD_CELL_UNCOVERED)
    else elCoverCell.classList.remove(CLS_COVER_BOARD_CELL_UNCOVERED)
    if (! cell.isHidden || cell.isHint || cell.isSelected) {
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