let gameHasStarted = false
let timerStarted = false
const isTimerEnabled = true

let footerVisible = false

let currentTarget
let activeGame

let expectedInput = "number" // number, operation, equals
let buttonsPressed = []

let updateTimerTimoutId;

let gameState = {
    games: [
        {
            index: 0,
            largeNumbers: 2,
            currentAnswer: null,
            numbers: [],
            extraNumbers: [],
            sums: [
                []
            ],
            buttonsPressed: [],
            isComplete: false,
            distance: null,
            elapsedSeconds: 0,
            wasStarted: false
        },
        {
            index: 1,
            largeNumbers: 3,
            currentAnswer: null,
            numbers: [],
            extraNumbers: [],
            sums: [
                []
            ],
            buttonsPressed: [],
            isComplete: false,
            distance: null,
            elapsedSeconds: 0,
            wasStarted: false
        },
        {
            index: 2,
            largeNumbers: 1,
            currentAnswer: null,
            numbers: [],
            extraNumbers: [],
            sums: [
                []
            ],
            buttonsPressed: [],
            isComplete: false,
            distance: null,
            elapsedSeconds: 0,
            wasStarted: false
        }
    ],
    puzzleNumber: 0,
    hasOpenedPuzzle: false,
    wasStarted: false,
    currentGame: 0,
    isComplete: false
}

let cumulativeData = []

const FLIP_ANIMATION_DURATION = 500

const keyboard = document.querySelector("[data-keyboard]")
const targetElement = document.querySelector("[data-target]")
const answerTextElement = document.querySelector("[data-answer]")
const sums = document.querySelector("[data-sums]")
const nextButton = document.querySelector("[data-next]")
const nextButton2 = document.querySelector("[data-next-two]")

const gameText = document.querySelector("[data-game-text]")
const gameLettersText = document.querySelector("[data-game-letters]")
const answerElement = document.querySelector("[data-answer-element]")
const popupTextElement = document.querySelector('[data-game-popup]')
const targetCanvas = document.getElementById('targetCanvas');
const canvas = document.getElementById('circleCanvas');
const solutionSumParent = document.querySelector('[data-solution-sums]')
const timerRow = document.querySelector('[data-timer-row]')
const timerTimeElement = document.querySelector('[data-timer-time]')
const timerCopyElement = document.querySelector('[data-timer-copy]')

let currentTimerTime = 0
let currentTimerMax = 0
let popupTextTimeoutId = null
let currentSolutionInfo = ""
let lastGameplayPopupKey = ""
let hasNoExactNonDecimalSolution = false
let latestSolutionRequestId = 0

function setPopupText(message, duration = null) {
    if (!popupTextElement) return

    if (popupTextTimeoutId != null) {
        clearTimeout(popupTextTimeoutId)
        popupTextTimeoutId = null
    }

    if (message == null || message === "") {
        popupTextElement.textContent = ""
        popupTextElement.classList.add('hidden')
        return
    }

    popupTextElement.textContent = message
    popupTextElement.classList.remove('hidden')

    if (duration != null && duration > 0) {
        popupTextTimeoutId = setTimeout(() => {
            popupTextElement.textContent = ""
            popupTextElement.classList.add('hidden')
            popupTextTimeoutId = null
        }, duration)
    }
}

window.setPopupText = setPopupText

function triggerGameplayPopup() {
    // Do not show gameplay toasts while solution panel is visible.
    if (!answerElement.classList.contains('no-display')) return

    const sumsUsed = Math.max(0, activeGame.sums.length - 1)
    const sumsLeft = 5 - sumsUsed
    let key = null
    let message = null

    if (sumsLeft >= 1 && sumsLeft <= 3) {
        key = "sums-" + sumsLeft
        message = (sumsLeft === 1) ? "1 sum left!" : (sumsLeft + " sums left!")
    } else if (activeGame.distance != null && activeGame.distance > 0) {
        const distance = activeGame.distance

        if (distance <= 10) {
            key = "distance-10"
            message = "Only 10 away"
        } else if (distance <= 50) {
            key = "distance-50-10"
            message = "50-10 away"
        }
    }

    if (message == null || key === lastGameplayPopupKey) return

    lastGameplayPopupKey = key
    setPopupText(message, 10000)
}

function loadGame() {
    
}

function resetGameState() {
    gameState = {
        games: [
            {
                index: 0,
                largeNumbers: 2,
                currentAnswer: null,
                numbers: generateNumbers(2),
                extraNumbers: [],
                sums: [
                    []
                ],
                buttonsPressed: [],
                isComplete: false,
                distance: null,
                elapsedSeconds: 0,
                wasStarted: false
            },
            {
                index: 1,
                largeNumbers: 3,
                currentAnswer: null,
                numbers: generateNumbers(3),
                extraNumbers: [],
                sums: [
                    []
                ],
                buttonsPressed: [],
                isComplete: false,
                distance: null,
                elapsedSeconds: 0,
                wasStarted: false
            },
            {
                index: 2,
                largeNumbers: 1,
                currentAnswer: null,
                numbers: generateNumbers(1),
                extraNumbers: [],
                sums: [
                    []
                ],
                buttonsPressed: [],
                isComplete: false,
                distance: null,
                elapsedSeconds: 0,
                wasStarted: false
            }
        ],
        puzzleNumber: targetGameNumber,
        hasOpenedPuzzle: false,
        wasStarted: false,
        currentGame: 0,
        isComplete: false
    }

    storeGameStateData()
}

function openGame() {

    gameState.currentGame = activeGame.index
    activeGame.wasStarted = true;
    storeGameStateData()

    if (gameState.isComplete) {
        //loadPuzzleFromState(gameState.currentGame)
    } else {
        //loadPuzzle(gameState.currentGame)
    }

    if (gameState.hasOpenedPuzzle === false) {
        if (isTimerEnabled) {
            startTimer()
        } else {
            startInteraction()
            updateCumulativeData()
        }

        fireEvent("onGameStart")
        gameState.hasOpenedPuzzle = true;
        storeGameStateData()
    } else {
        if (isTimerEnabled) {
            unpauseTimer()
        } else {
            if (activeGame.isComplete) {
                // Keep submitted games in review mode with Next/Stats actions.
                updateTimerDisplay(false)
                stopInteraction()
            } else {
                // Resume unfinished games in playable mode.
                enableTimerDisplay()
                startInteraction()
            }
        }
    }

    if (gameHasStarted) return
    gameHasStarted = true;
}

const TIMER_PENALTY_BANDS = [
    { maxSeconds: 30,       penalty: 0 },
    { maxSeconds: 45,       penalty: -3 },
    { maxSeconds: 59,       penalty: -4 },
    { maxSeconds: 75,       penalty: -6 },
    { maxSeconds: 90,       penalty: -7 },
    { maxSeconds: 105,      penalty: -9 },
    { maxSeconds: Infinity, penalty: -10 }
]

function getTimerPenalty(elapsedSeconds) {
    for (const band of TIMER_PENALTY_BANDS) {
        if (elapsedSeconds <= band.maxSeconds) return band.penalty
    }
    return -10
}

function getTimerPenaltyCopy(elapsedSeconds) {
    if (elapsedSeconds <= 30)  return 'First penalty at 0:30'
    if (elapsedSeconds <= 45)  return 'Next penalty at 0:45'
    if (elapsedSeconds <= 59)  return 'Next penalty at 0:59'
    if (elapsedSeconds <= 75)  return 'Next penalty at 1:15'
    if (elapsedSeconds <= 90)  return 'Next penalty at 1:30'
    if (elapsedSeconds <= 105) return 'Next penalty at 1:45'
    return 'Max time penalty applied'
}

function getDistanceScore(distance) {
    if (distance === 0)      return 100
    if (distance <= 1)       return 90
    if (distance <= 2)       return 85
    if (distance <= 3)       return 80
    if (distance <= 5)       return 70
    if (distance <= 7)       return 60
    if (distance <= 10)      return 50
    return 0
}
// ---- End timer penalty bands ----

function startTimer() {
    if (timerStarted) return

    startInteraction()

    timerStarted = true
    currentTimerTime = 0
    updateTimer(0)

    updateCumulativeData()
}

function getTimerDuration(seconds) {
    return seconds * 100;
}

function stopTimer() {
    timerStarted = false
}

function pauseTimer() {
    timerStarted = false
}

function unpauseTimer() {
    if (activeGame.isComplete == true) return;
    timerStarted = true
    updateTimer(currentTimerTime)
}

function updateTimer(elapsedHundredths) {
    if (timerStarted === false) return;

    currentTimerTime = elapsedHundredths

    updateTimerRow(elapsedHundredths)

    updateTimerTimoutId = setTimeout(() => {
        updateTimer(elapsedHundredths + 1)
    }, 10)
}

function updateTimerRow(elapsedHundredths) {
    if (!timerTimeElement || !timerCopyElement) return
    const totalSeconds = Math.floor(elapsedHundredths / 100)
    const minutes = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    const formattedTime = (minutes < 10 ? '0' + minutes : minutes) + ':' + (secs < 10 ? '0' + secs : secs)
    timerTimeElement.textContent = formattedTime
    timerCopyElement.textContent = getTimerPenaltyCopy(totalSeconds)
}

function timerEnd() {
    timerStarted = false
    activeGame.elapsedSeconds = Math.floor(currentTimerTime / 100)

    stopInteraction()
    finalizeCurrentPuzzleDistance()
    activeGame.isComplete = true;
    storeGameStateData()
    updateCumulativeData()

    updateTimerDisplay(false)

    if (gameState.currentGame > 1) {
        setTimeout(() => {
            showPage('stats');
        }, 5000)
    }
}

function updateTimerDisplay(hasWon) {
    if (timerRow) timerRow.classList.add('no-display')
    if (hasWon) {
        targetCanvas.classList.remove('no-display')
        canvas.classList.remove('no-display')
        answerElement.classList.add('no-display')
        setPopupText("")

        drawWinCircle()
    } else {
        targetCanvas.classList.add('no-display')
        canvas.classList.add('no-display')
        answerElement.classList.remove('no-display')
        setPopupText(currentSolutionInfo)
    }
}

function enableTimerDisplay() {
    if (timerRow) timerRow.classList.remove('no-display')
    targetCanvas.classList.remove('no-display')
    canvas.classList.remove('no-display')
    answerElement.classList.add('no-display')
    setPopupText("")
}

function cumulativeDataHasEntry(gameNumber) {
    return cumulativeData.some(entry => {
        if (entry.number === gameNumber) {
            //console.log("Found an equal number")
            return true;
        } else {
            //console.log("Found no equal number")
            return false;
        }
    })
}

function getCumulativeDataEntryIndex(gameNumber) {
    const index = cumulativeData.findIndex(entry => entry.number === gameNumber);
    return index !== -1 ? index : null;
}

function updateButtonsPressedForCurrentPuzzle() {
    const keys = keyboard.querySelectorAll('.key');
    let buttonsPressed = []

    keys.forEach((key, i)=> {
        if (key.classList.contains('green')) {
            buttonsPressed.push(i)
        }
    })

    activeGame.buttonsPressed = buttonsPressed;
    storeGameStateData()
}

function applyButtonsPressedForCurrentPuzzle() {
    const keys = keyboard.querySelectorAll('.key');

    keys.forEach((key, i) => {
        if (activeGame.buttonsPressed.includes(i)) {
            key.classList.add('green')
        }
    })
}

function loadPuzzleFromState(index) {
    loadPuzzle(index)
    if (gameState.currentGame >= 2) {
        gameState.isComplete = true;
        storeGameStateData()
    } 

    let currentGame = gameState.games[gameState.currentGame]
    updateTimerDisplay(parseFloat(currentGame.distance) == 0)

    applyButtonsPressedForCurrentPuzzle()
    restoreOperationButtons()

    removeAllFlip()

    showNext()
}

function removeAllFlip() {
    const mediumKeys = keyboard.querySelectorAll('.key.medium');
    const extraNumbers = activeGame.extraNumbers;

    mediumKeys.forEach((key, i) => {
        if (extraNumbers.length > i && i < 4) {
            key.classList.add('grey')
            key.textContent = extraNumbers[i]
            key.style.fontSize = getFontSizeFromDigits(extraNumbers[i].toString().length)

            console.log("FOUND A EXTRA AT INDEX: " + i)

            key.onclick = function () {
                pressNumber(this);
            }
        } else if (i < 4) {
            key.classList.remove('grey');
            key.classList.remove('flip');
            key.classList.add('white');

            key.textContent = "";
            key.onclick = null;
        }
    })
}

async function loadPuzzle(index) {
    gameState.currentGame = index
    storeGameStateData()

    activeGame = gameState.games[index]
    lastGameplayPopupKey = ""

    updateExtraButtons()
    updateSums()

    calculateSolution(activeGame.numbers)

    if (activeGame.isComplete === false) answerTextElement.classList.remove('win')

    // Load in target number
    //console.log("First: " + activeGame.numbers[0])
    currentTarget = activeGame.numbers[0]
    targetElement.textContent = currentTarget
    drawTargetCircle(currentTarget)

    // Load in 6 main buttons
    const smallKeys = keyboard.querySelectorAll('.key.small');
    smallKeys.forEach((key, i) => {
        key.textContent = activeGame.numbers[i + 1]

        key.onclick = function () {
            pressNumber(this);
        }
    })

    updateGameText()
}

async function calculateSolution(numbers) {
    const solutionSums = solutionSumParent.querySelectorAll('.sum')
    const requestId = ++latestSolutionRequestId
    const sourceNumbers = numbers.map((value) => Number(value))

    function buildFallbackSolution(values) {
        const target = Number(values[0])
        const candidates = values.slice(1).filter((value) => Number.isFinite(value))

        if (candidates.length === 0) {
            return {
                target,
                closestSolution: null,
                sums: []
            }
        }

        let closest = candidates[0]
        let closestDistance = Math.abs(target - closest)

        for (let i = 1; i < candidates.length; i++) {
            const value = candidates[i]
            const distance = Math.abs(target - value)
            if (distance < closestDistance) {
                closest = value
                closestDistance = distance
            }
        }

        return {
            target,
            closestSolution: closest,
            sums: []
        }
    }

    function renderSolutionLines(solution, isValidChain) {
        solutionSums.forEach((sum) => {
            sum.textContent = ""
        })

        if (solutionSums.length === 0) return

        const targetHeading = document.createElement('span')
        targetHeading.classList.add('text-game-sums-heading', 'text-game-solution-target')
        targetHeading.textContent = "Target: " + solution.target
        solutionSums[0].append(targetHeading)

        if (!isValidChain) {
            if (solution.closestSolution != null && solutionSums.length > 1) {
                solutionSums[1].textContent = "Closest value: " + solution.closestSolution
            }
            return
        }

        const maxSequenceLines = Math.max(0, solutionSums.length - 1)
        for (let i = 0; i < maxSequenceLines; i++) {
            if (solution.sums.length <= i) break

            const currentSum = solution.sums[i]
            solutionSums[i + 1].textContent = currentSum[0] + " " + currentSum[1] + " " + currentSum[2] + " " + currentSum[3] + " " + currentSum[4]
        }
    }

    function renderFallbackSolution() {
        const fallbackSolution = buildFallbackSolution(sourceNumbers)
        renderSolutionLines(fallbackSolution, false)
        hasNoExactNonDecimalSolution = true
        updateSolutionHeaderText()
    }

    findClosestSolution(sourceNumbers).then((solution) => {
        if (requestId !== latestSolutionRequestId) return

        if (solution == null || solution.closestSolution == null) {
            renderFallbackSolution()
            return
        }

        if (!isValidSolutionChainForNumbers(sourceNumbers, solution)) {
            renderFallbackSolution()
            return
        }

        const hasExact = Number(solution.closestSolution) === Number(solution.target)
        const usesDecimalStep = solution.sums.some(step => !Number.isInteger(Number(step[4])))

        hasNoExactNonDecimalSolution = !hasExact || usesDecimalStep

        renderSolutionLines(solution, true)

        updateSolutionHeaderText()
    }).catch(() => {
        if (requestId !== latestSolutionRequestId) return
        renderFallbackSolution()
    })
}

function isValidSolutionChainForNumbers(numbers, solution) {
    if (!Array.isArray(numbers) || numbers.length < 2) return false
    if (!solution || !Array.isArray(solution.sums)) return false

    const pool = numbers.slice(1).map((value) => Number(value))

    function popFromPool(value) {
        const epsilon = 0.0000001
        const index = pool.findIndex((candidate) => Math.abs(candidate - value) < epsilon)
        if (index < 0) return false

        pool.splice(index, 1)
        return true
    }

    for (const step of solution.sums) {
        if (!Array.isArray(step) || step.length < 5) return false

        const left = Number(step[0])
        const operation = step[1]
        const right = Number(step[2])
        const equalsSign = step[3]
        const result = Number(step[4])

        if (!Number.isFinite(left) || !Number.isFinite(right) || !Number.isFinite(result)) return false
        if (equalsSign !== '=') return false

        if (!popFromPool(left)) return false
        if (!popFromPool(right)) return false

        const expectedResult = Number(calculateResult(left, operation, right))
        const epsilon = 0.0000001
        if (!Number.isFinite(expectedResult) || Math.abs(expectedResult - result) > epsilon) return false

        pool.push(result)
    }

    if (solution.closestSolution == null) return true

    const closest = Number(solution.closestSolution)
    if (!Number.isFinite(closest)) return false

    return pool.some((value) => Math.abs(value - closest) < 0.0000001)
}

function generateNumbers(large) {
    // Arrays of large and small numbers
    const largeNumbers = [25, 50, 75, 100];
    const smallNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // Shuffle an array (Fisher-Yates shuffle algorithm)
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
        return array;
    }

    // Generate a random number between 100 and 999
    const firstRandomNumber = Math.floor(Math.random() * 900) + 100;

    // Shuffle large and small numbers
    const shuffledLargeNumbers = shuffle([...largeNumbers]);
    const shuffledSmallNumbers = shuffle([...smallNumbers]);

    // Get the required amount of large numbers and the remaining small numbers
    const selectedLargeNumbers = shuffledLargeNumbers.slice(0, large);
    const selectedSmallNumbers = shuffledSmallNumbers.slice(0, 6 - large);

    // Combine the random number, large and small numbers
    return [firstRandomNumber, ...selectedLargeNumbers, ...selectedSmallNumbers].sort((a, b) => b - a);
}

function resetExtraButtons() {
    const mediumKeys = keyboard.querySelectorAll('.key.medium');


    mediumKeys.forEach((key, i) => {
        if (i < 4) {
            key.classList.remove('grey');
            key.classList.add('white');

            key.textContent = "";
            key.onclick = null;
        }
    })
}

function updateExtraButtons() {
    // Update the 4 medium keys
    const mediumKeys = keyboard.querySelectorAll('.key.medium');
    const extraNumbers = activeGame.extraNumbers;

    mediumKeys.forEach((key, i) => {
        if (extraNumbers.length > i && i < 4) {
            if (key.classList.contains('white')) {
                flipKey(key, extraNumbers[i])
            } else {
                key.classList.add('grey')
                key.textContent = extraNumbers[i]
                //console.log("Extra numbers of i: " + extraNumbers[i])
                key.style.fontSize = getFontSizeFromDigits(extraNumbers[i].toString().length)

                key.onclick = function () {
                    pressNumber(this);
                }
            }
        } else if (i < 4) {
            key.classList.remove('grey');
            key.classList.remove('flip');
            key.classList.add('white');

            key.textContent = "";
            key.onclick = null;
        } else {
            key.onclick = function () {
                pressOperation(this)
            }
        }
    })
}

function getFontSizeFromDigits(digits) {
    if (digits <= 3) {
        //console.log(digits + " Getting font size: 1em")
        return "1em";
    } else if (digits < 9) {
        let size = (digits - 3) * 0.08;
        //console.log(digits + " Getting font size: " + (1 - size) + "em")
        return (1 - size) + "em";
    } else {
        //console.log(digits + " Getting font size: 0.4em")
        return "0.52em";
    }
}

function updateSums() {
    const sumsArray = sums.querySelectorAll('.sum');

    sumsArray.forEach((sum, i) => {
        let sumNumberElement = sum.querySelector('.sum-number')
        let sumTextElement = sum.querySelector('.sum-text')

        if (activeGame.sums.length > i) {
            let currentSum = activeGame.sums[i]
            let sumText = ""

            if (currentSum[0] != null) sumText += (currentSum[0] + "    ");
            if (currentSum[1] != null) sumText += (currentSum[1] + "    ");
            if (currentSum[2] != null) sumText += (currentSum[2] + "    ");
            if (currentSum[4] != null) {
                sumText += "=    " + currentSum[4];
            } else if (currentSum[3] != null) {
                let result = calculateResult(currentSum[0], currentSum[1], currentSum[2])
                sumText += "=    " + result;

                currentSum.push(result)
                storeGameStateData()

                //console.log("i: " + i + " length - 1: " + (sumsArray.length - 1))

                if (i === activeGame.sums.length - 1) {
                    completeSum()
                }
            }
                
            sumTextElement.textContent = sumText;

            if (currentSum.length > 0) sumNumberElement.classList.add('green')
            else sumNumberElement.classList.remove('green')

            sumTextElement.classList.remove('hidden')
        } else {
            sumNumberElement.classList.remove('green')
            sumTextElement.classList.add('hidden')
        }
    })

    if (activeGame.sums.length > 5 && currentTimerTime > 0) {
        showOnlyNext()
    } else if (currentTimerTime > 0) {
        hideOnlyNext()
    }

    updateCurrentAnswer()
    updateSolutionHeaderText()
    triggerGameplayPopup()
}

function updateCurrentAnswer() {
    let answerText = "N/A";

    if (activeGame.sums.length < 2) {
        answerTextElement.classList.add('hidden')
    } else {
        const lastLastSum = activeGame.sums[activeGame.sums.length - 2]
        answerText = lastLastSum[4];
        answerTextElement.classList.remove('hidden')
    }

    answerTextElement.textContent = answerText
    drawGameCircle(1, (answerText === "N/A") ? "--" : answerText, "Your Answer")
    activeGame.currentAnswer = (answerText != "N/A") ? answerText : null;
    storeGameStateData()

    checkCurrentAnswer()
}

function updateSolutionHeaderText() {
    var solutionInfo = "Closest Solution"

    if (hasNoExactNonDecimalSolution) {
        solutionInfo = "There is no solution. This is the closest I could get!"
    } else {
        var distance = activeGame.distance;
        if (distance === null) distance = 11;

        if (distance === 0) {
            // keep default text
        } else if (distance <= 3) {
            solutionInfo = "So close!! Here is the solution"
        } else if (distance <= 10) {
            solutionInfo = "Not bad. Here is the solution"
        } else {
            solutionInfo = "The numbers didn't suit you! Solution below"
        }
    }

    currentSolutionInfo = solutionInfo

    if (!answerElement.classList.contains('no-display')) {
        setPopupText(solutionInfo)
    }
}

function getFallbackDistance() {
    // Distance > 10 maps to the lowest score bracket.
    return 11
}

function normalizeDistance(distance) {
    const numericDistance = Number(distance)
    if (!Number.isFinite(numericDistance)) return getFallbackDistance()

    return Math.abs(parseFloat(numericDistance.toFixed(2)))
}

function finalizeCurrentPuzzleDistance() {
    const currentAnswer = activeGame.currentAnswer
    if (currentAnswer == null || currentAnswer === "") {
        activeGame.distance = getFallbackDistance()
        return activeGame.distance
    }

    const currentTargetValue = Number(activeGame.numbers[0])
    const currentAnswerValue = Number(currentAnswer)

    if (!Number.isFinite(currentTargetValue) || !Number.isFinite(currentAnswerValue)) {
        activeGame.distance = getFallbackDistance()
        return activeGame.distance
    }

    activeGame.distance = normalizeDistance(currentTargetValue - currentAnswerValue)
    return activeGame.distance
}

function checkCurrentAnswer() {
    const currentAnswer = activeGame.currentAnswer
    if (currentAnswer === null) {
        console.log("Current Answer was null: " + currentAnswer)
        activeGame.distance = null;
        storeGameStateData()
        updateCumulativeData()
        return;
    }

    const currentTarget = activeGame.numbers[0]
    const difference = normalizeDistance(parseFloat(currentTarget) - parseFloat(currentAnswer))
    console.log("Current answer of: " + currentAnswer + " with target of: " + currentTarget + " resulted in distance of: " + difference)

    activeGame.distance = difference;
    storeGameStateData()
    updateCumulativeData()

    if (difference === 0) {
        win()
    } 
}

function win() {
    stopTimer()
    activeGame.elapsedSeconds = Math.floor(currentTimerTime / 100)
    if (timerRow) timerRow.classList.add('no-display')
    drawWinCircle()

    answerTextElement.classList.add('win')

    activeGame.isComplete = true
    storeGameStateData()

    stopInteraction()

    if (gameState.currentGame > 1) {
        setTimeout(() => {
            showPage('stats');
        }, 5000)
    }
}

function completeGame() {
    
}

function findSolution() {
    
}

function updateCumulativeData() {
    let distances = [];
    let elapsedTimes = [];
    let grade = "N/A";

    gameState.games.forEach(game => {
        if (game.wasStarted && game.isComplete) {
            console.log("Distance was: " + game.distance)
            distances.push(normalizeDistance(game.distance))
            elapsedTimes.push(Number.isFinite(Number(game.elapsedSeconds)) ? Math.floor(Number(game.elapsedSeconds)) : 0)
        }
    })

    if (distances.length > 0) {
        const roundScores = distances.map((dist, i) => {
            const distScore = getDistanceScore(dist)
            const timePenalty = getTimerPenalty(elapsedTimes[i] || 0)
            return Math.max(0, Math.min(100, distScore + timePenalty))
        })
        const totalScore = roundScores.reduce((sum, s) => sum + s, 0)
        grade = Math.round(totalScore / roundScores.length).toString()
    }

    let hasEntry = cumulativeDataHasEntry(gameState.puzzleNumber)

    if (hasEntry === false) {
        console.log("Pushing in new entry");

        cumulativeData.push({
            number: gameState.puzzleNumber,
            distances: distances,
            grade: grade
        })

        storeCumulativeData()
    } else {
        console.log("Updating old entry");

        let entryIndex = getCumulativeDataEntryIndex(gameState.puzzleNumber);

        cumulativeData[entryIndex] = {
            number: gameState.puzzleNumber,
            distances: distances,
            grade: grade
        }

        storeCumulativeData()
    }
}

function calculateResult(number1, operation, number2) {
    number1 = parseFloat(number1);
    number2 = parseFloat(number2);

    let result = null
    
    if (operation === "+") {
        result = (number1 + number2);
    } else if (operation === "-") {
        result = number1 - number2;
    } else if (operation === "x") {
        result = number1 * number2;
    } else if (operation === "÷") {
        result = number1 / number2;
    }

    return (Number.isInteger(result)) ? result : parseFloat(result.toFixed(2));
}

function handleKeyPress(e) {
    if (e.key === "t" || e.key === "T") {
        //setFooterVisible(!footerVisible);
        return
    }

    if (canInteract) {
        if (e.key === "Delete") {
            pressClear()
            return
        }

        if (e.key === "Backspace") {
            pressBackspace()
            return
        }
    } else {
        if (e.key === "Enter" && gameState.currentGame < 2) {
            playNext()
        }
    }
}

function pressBackspace() {
    if (canInteract === false) return

    // Remove the last sum
    const lastSum = activeGame.sums[activeGame.sums.length - 1]
    if (lastSum.length === 0) {
        let key = document.querySelector('[data-backspace]')
        shakeKey(key)
        return;
    }
    else if (lastSum.length <= 3) {
        // Free up the last button
        let button = buttonsPressed.pop()

        if (button != null) button.classList.remove('green')

        updateButtonsPressedForCurrentPuzzle()

        expectedInput = (lastSum.length === 2) ? "operation" : "number"

        lastSum.pop()
        updateSums()
    } else {
        return;
    }

}

function pressNumber(key) {
    if (canInteract === false) return;

    if (expectedInput != "number" || activeGame.sums.length >= 6) {
        shakeKey(key)
        return;
    } 

    if (key.classList.contains('green')) return;
    key.classList.add('green');

    buttonsPressed.push(key)
    updateButtonsPressedForCurrentPuzzle()

    const lastSum = activeGame.sums[activeGame.sums.length - 1]

    lastSum.push(key.textContent)
    storeGameStateData()
    updateSums()

    if (lastSum.length === 1) {
        expectedInput = "operation"
    } else {
        expectedInput = "equals"
        pressEquals();
    }
}

function pressOperation(key) {
    if (canInteract === false) return;
    //console.log("expectedInput: " + expectedInput);

    const lastSum = activeGame.sums[activeGame.sums.length - 1]

    if (expectedInput == "number" && lastSum.length > 1) {
        pressBackspace();
        pressOperation(key)
        return
    }

    if (expectedInput != "operation") {
        shakeKey(key)
        return;
    }

    if (key.classList.contains('green')) return;
    key.classList.add('green');

    buttonsPressed.push(key)
    updateButtonsPressedForCurrentPuzzle()

    lastSum.push(key.textContent)
    storeGameStateData()
    updateSums()

    expectedInput = "number"
}

function pressEquals() {
    if (canInteract === false) return;
    if (expectedInput != "equals") {
        let key = document.querySelector('[data-equals]')
        shakeKey(key)
        return;
    }

    const lastSum = activeGame.sums[activeGame.sums.length - 1]

    lastSum.push('=')
    storeGameStateData()
    updateSums()

    expectedInput = "number"
}

function completeSum() {
    const lastSum = activeGame.sums[activeGame.sums.length - 1]
    activeGame.extraNumbers.push(lastSum[4])
    storeGameStateData()

    updateExtraButtons();

    restoreOperationButtons()

    activeGame.sums.push([])
    storeGameStateData()
}

function restoreOperationButtons() {
    const keys = keyboard.querySelectorAll('.key');

    keys.forEach(key => {
        if (key.textContent === '+' || key.textContent === '-' || key.textContent === '÷' || key.textContent === 'x') {
            key.classList.remove('green')
        } 
    })
}

function resetButtons() {
    const keys = keyboard.querySelectorAll('.key');

    keys.forEach(key => {
        if (key.classList.contains('green')) {
            key.classList.remove('green')
        }
    })

    expectedInput = "number"
}

function pressClear() {
    if (canInteract === false) return;
    expectedInput = "number"

    let lastSumIndex = activeGame.sums.length - 1
    let lastSum = activeGame.sums[lastSumIndex]

    if (lastSum.length === 0) {
        if (activeGame.sums.length <= 1) {
            let key = document.querySelector('[data-clear]')
            shakeKey(key)
            return;
        }
        activeGame.sums.pop();
    }

    lastSumIndex = activeGame.sums.length - 1
    lastSum = activeGame.sums[lastSumIndex]

    if (lastSum.length === 5) {
        activeGame.extraNumbers.pop()
        storeGameStateData()
        updateExtraButtons()
    }

    let removedButtons = Math.min(lastSum.length, 3)
    for (let i = 0; i < removedButtons; i++) {
        let button = buttonsPressed.pop()
        updateButtonsPressedForCurrentPuzzle()

        if (button != null) button.classList.remove('green')
    }

    activeGame.sums[lastSumIndex] = []
    storeGameStateData()
    updateSums()
}

function playNext() {
    console.log("playNext called");
    if (updateTimerTimoutId != null) {
        console.log("Clearing updateTimerTimoutId");
        clearTimeout(updateTimerTimoutId);
    }
    enableTimerDisplay()

    resetButtons()
    resetExtraButtons()

    const currentGameNumber = gameState.currentGame
    console.log("Current game number:", currentGameNumber);
    loadPuzzle(currentGameNumber + 1)
    timerStarted = false;

    if (isTimerEnabled) {
        startTimer()
    } else {
        startInteraction()
        updateCumulativeData()
    }
}

function submitCurrentPuzzle() {
    if (canInteract === false) return;

    stopTimer()
    activeGame.elapsedSeconds = Math.floor(currentTimerTime / 100)

    finalizeCurrentPuzzleDistance()

    activeGame.isComplete = true;
    storeGameStateData()
    updateCumulativeData()

    updateTimerDisplay(false)
    stopInteraction()
}

function showOnlyNext() {
    console.log("Showing Only Next")

    if (gameState.currentGame < 2) {
        console.log("Less than 3")
        nextButton2.textContent = "Play Next"
        nextButton2.onclick = function () {
            playNext()
            fireEvent("playNextGame")
        }
    } else {
        console.log("More than 3")
        nextButton2.textContent = "See Stats"
        nextButton2.onclick = function () {
            showPage("stats")
            fireEvent("gameThreeToStats")
        }

        if (gameState.isComplete === false) {
            fireEvent("onFirstCompletion")
            gameState.isComplete = true;
            storeGameStateData()
        }
    }

    nextButton2.classList.remove("no-display")
}

function hideOnlyNext() {
    nextButton2.classList.add("no-display")
}

function showNext() {
    console.log("Showing Next")

    if (gameState.currentGame < 2) {
        console.log("Less than 3")
        nextButton.textContent = "Next"
        nextButton.onclick = function () {
            playNext()
            fireEvent("playNextGame")
        }
    } else {
        console.log("More than 3")
        nextButton.textContent = "See Stats"
        nextButton.onclick = function () {
            showPage("stats")
            fireEvent("gameThreeToStats")
        }

        if (gameState.isComplete === false) {
            fireEvent("onFirstCompletion")
            gameState.isComplete = true;
            storeGameStateData()
        }
    }

    setFooterVisible(true)
}

function setFooterVisible(isVisible) {
    const mediumKeys = keyboard.querySelectorAll('.key.medium');
    const largeKeys = keyboard.querySelectorAll('.key.large');

    if (isVisible) {
        nextButton.classList.remove("no-display")
        nextButton2.classList.add("no-display")
        
        mediumKeys.forEach((key, i) => {
            if (i >= 4) {
                key.classList.add('grid-hidden')
            }
        })

        largeKeys.forEach((key, i) => {
            key.classList.add('grid-hidden')
        })
    } else {
        nextButton.classList.add("no-display")

        mediumKeys.forEach((key, i) => {
            if (i >= 4) {
                key.classList.remove('grid-hidden')
            }
        })

        largeKeys.forEach((key, i) => {
            key.classList.remove('grid-hidden')
        })

    }

    footerVisible = isVisible
}



function hideNext() {
    //console.log("hiding next")
    //nextButton.classList.add("no-display")

    setFooterVisible(false)

    nextButton.classList.remove("no-display")
    nextButton.textContent = "Submit answer"
    nextButton.onclick = function () {
        submitCurrentPuzzle()
    }
}

function updateGameText() {
    gameText.textContent = (gameState.currentGame + 1) + "/3"
    //gameLettersText.textContent = (gameState.currentGame + 1) + " of 3"
}

function flipKey(key, newText) {
    console.log("flip")

    key.classList.add("flip")

    key.addEventListener("transitionend", () => {
        console.log("transitionend")
        key.classList.remove("flip")
        key.classList.remove('white')
        key.classList.add('grey')

        key.textContent = newText
        key.style.fontSize = getFontSizeFromDigits(newText.toString().length)

        key.onclick = function () {
            pressNumber(this);
        }

        updateExtraButtons()
    }, { once: true })
}

function shakeKey(key) {
    key.classList.add("shake")
    key.addEventListener("animationend", () => {
        key.classList.remove("shake")
    }, { once: true })
}

async function findClosestSolution(numbers) {
    const target = Number(numbers[0]);
    const initialPool = numbers.slice(1).map((n, i) => ({
        id: "n" + i,
        value: Number(n),
        from: null
    }));

    const MAX_SUMS = 4;
    let bestNode = null;
    let bestDiff = Infinity;
    let bestSteps = Infinity;
    const seen = new Map();

    function toNumber(value) {
        return Number.isInteger(value) ? value : Number(value.toFixed(2));
    }

    function applyOperation(a, op, b) {
        let result = null;

        if (op === "+") result = a + b;
        else if (op === "-") result = a - b;
        else if (op === "x") result = a * b;
        else if (op === "÷") {
            if (b === 0) return null;
            result = a / b;
        }

        if (result == null || !Number.isFinite(result)) return null;
        if (result < 0) return null;
        return toNumber(result);
    }

    function getStepCount(node) {
        if (!node || !node.from) return 0;

        const leftSteps = getStepCount(node.from.left);
        const rightSteps = getStepCount(node.from.right);
        return 1 + Math.max(leftSteps, rightSteps);
    }

    function updateBestNode(node) {
        const diff = Math.abs(node.value - target);
        const steps = getStepCount(node);

        const isBetter =
            diff < bestDiff ||
            (diff === bestDiff && steps < bestSteps) ||
            (diff === bestDiff && steps === bestSteps && Number.isInteger(node.value));

        if (!isBetter) return;

        bestDiff = diff;
        bestSteps = steps;
        bestNode = node;
    }

    function getStateKey(pool, depth) {
        const values = pool.map((node) => toNumber(node.value)).sort((a, b) => a - b);
        return depth + "|" + values.join(",");
    }

    function search(pool, depth) {
        pool.forEach((node) => {
            updateBestNode(node);
        });

        if (depth >= MAX_SUMS) return;
        if (pool.length < 2) return;

        const stateKey = getStateKey(pool, depth);
        const seenDepth = seen.get(stateKey);
        if (seenDepth != null && seenDepth <= depth) return;
        seen.set(stateKey, depth);

        for (let i = 0; i < pool.length; i++) {
            for (let j = i + 1; j < pool.length; j++) {
                const left = pool[i];
                const right = pool[j];
                const remaining = pool.filter((_, idx) => idx !== i && idx !== j);

                const operationVariants = [
                    { leftNode: left, op: "+", rightNode: right },
                    { leftNode: left, op: "x", rightNode: right },
                    { leftNode: left, op: "-", rightNode: right },
                    { leftNode: right, op: "-", rightNode: left },
                    { leftNode: left, op: "÷", rightNode: right },
                    { leftNode: right, op: "÷", rightNode: left }
                ];

                for (const variant of operationVariants) {
                    const result = applyOperation(variant.leftNode.value, variant.op, variant.rightNode.value);
                    if (result === null) continue;

                    // left/right are consumed once in this branch, result is a new number.
                    const resultNode = {
                        id: "r_" + depth + "_" + i + "_" + j + "_" + variant.op,
                        value: result,
                        from: {
                            left: variant.leftNode,
                            op: variant.op,
                            right: variant.rightNode,
                            result
                        }
                    };

                    search([resultNode, ...remaining], depth + 1);
                }
            }
        }
    }

    function buildSteps(node, out) {
        if (!node || !node.from) return;

        buildSteps(node.from.left, out);
        buildSteps(node.from.right, out);

        out.push([
            node.from.left.value,
            node.from.op,
            node.from.right.value,
            "=",
            node.from.result
        ]);
    }

    search(initialPool, 0);

    const sums = [];
    buildSteps(bestNode, sums);

    return {
        closestSolution: bestNode ? bestNode.value : null,
        sums: sums.slice(0, MAX_SUMS),
        target
    };
}