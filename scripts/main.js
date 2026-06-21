const DATE_OF_FIRST_PUZZLE = new Date(2024, 6, 25)
const ALLOW_MOBILE_SHARE = true; 
const DEBUG_MODE = false;

window.DEBUG_MODE = DEBUG_MODE;

let targetGameNumber = 0

const alertContainer = document.querySelector("[data-alert-container]")
const statsAlertContainer = document.querySelector("[data-stats-alert-container]")
const shareButton = document.querySelector("[data-share-button]")
const playButton = document.querySelector("[data-play-button]")

const firstStatisticGrid = document.querySelector("[data-statistics-first]");
const secondStatisticGrid = document.querySelector("[data-statistics-second]");

let puzzleList = []

let canInteract = false;

window.dataLayer = window.dataLayer || [];

fetchData()

function fetchData() {
    const msOffset = Date.now() - DATE_OF_FIRST_PUZZLE
    const dayOffset = msOffset / 1000 / 60 / 60 / 24
    let targetIndex = Math.floor(dayOffset + 0)
    targetGameNumber = targetIndex + 1

    fetchCumulativeData()
    fetchGameState()
}

function showAlert(message, isWin = false, duration = 1000) {
    if (duration === null) {
        clearAlerts()
    }

    const alert = document.createElement("div")
    alert.textContent = message
    alert.classList.add("alert")
    
    if (isWin) alert.classList.add("win")
    else alert.classList.add("loss")
    
    alertContainer.prepend(alert)
    if (duration == null) return

    setTimeout(() => {
        alert.classList.add("hide")
        alert.addEventListener("transitionend", () => {
            alert.remove()
        })
    }, duration)
}

function clearAlerts() {
    const alerts = document.querySelectorAll('.alert')

    alerts.forEach((alert) => {
        alert.remove()
    })
}

function showShareAlert(message, duration = 1000) {
    clearAlerts()

    const alert = document.createElement("div")
    alert.textContent = message
    alert.classList.add("alert")

    statsAlertContainer.append(alert)

    setTimeout(() => {
        alert.classList.add("hide")
        alert.addEventListener("transitionend", () => {
            alert.remove()
        })
    }, duration)
}

function showPage(pageId, oldPage = null) {
    if (oldPage === null) {
        const page = document.querySelector('.page.active')
        if (page != null) {
            oldPage = page.id
        } else {
            oldPage = "game"
        }
    }

    if (pageId != "welcome" && pageId != "game" && pageId != "info" && pageId != "scoring" && pageId != "stats") {
        console.log("Invalid page: " + pageId + ". Openning 'game' page.")
        pageId = "game"
    }

    const pages = document.querySelectorAll('.page')
    pages.forEach(page => {
        page.classList.remove('active')
    })

    document.getElementById(pageId).classList.add('active')
    if (pageId === "game") {
        updateBodyColor(true)
        openGame()
    }
    else if (pageId === "stats") {
        updateBodyColor(false)
        pressStatsButton("performance")
        updateAllStats();
        pauseTimer()
    } else if (pageId === "welcome") {
        updateBodyColor(false)
        generateWelcomeMessage()
    } else if (pageId === "info") {
        updateBodyColor(false)
        updateInfoPage()
        pauseTimer()
    } else if (pageId === "scoring") {
        updateBodyColor(false)
        pauseTimer()
    }

    if (oldPage != null) lastPage = oldPage
}

function updateBodyColor(isWhite) {
    document.body.classList.remove('white')
    document.body.classList.remove('off-white')

    document.body.classList.add((isWhite) ? 'white' : 'off-white')
}

function startInteraction() {
    document.addEventListener("keydown", handleKeyPress)

    canInteract = true

    hideNext()
}

function stopInteraction() {
    canInteract = false

    showNext()
}

function storeGameStateData() {
    localStorage.setItem("countdownGameState", JSON.stringify(gameState))
}

function storeCumulativeData() {
    localStorage.setItem("countdownCumulativeData", JSON.stringify(cumulativeData))
}

function fetchGameState() {
    const localStateJSON = localStorage.getItem("countdownGameState")
    let localGameState = null
    if (localStateJSON != null) {
        localGameState = JSON.parse(localStateJSON)

        if (localGameState.puzzleNumber === targetGameNumber) {
            gameState = localGameState
        } else {
            console.log("Game state was reset since puzzle does not match: " + localGameState.puzzleNumber + " & " + targetGameNumber)
            resetGameState()
        }
    } else {
        console.log("Game state was reset since localStorage did not contain 'conundrumGameState'")
        resetGameState()
    }

    updateCumulativeData()

    if (gameState.hasOpenedPuzzle === true || gameState.games[gameState.currentGame].wasStarted === true) {
        loadPuzzleFromState(gameState.currentGame)
        showPage("welcome")
    } else {
        loadPuzzle(gameState.currentGame)
        showPage('info')
    }
}

function fetchCumulativeData() {
    const localStoreJSON = localStorage.getItem("countdownCumulativeData")
    if (localStoreJSON != null) {
        console.log("Cumulative Data was Found: " + localStoreJSON)
        cumulativeData = JSON.parse(localStoreJSON)
        storeCumulativeData()
    } else {
        console.log("Cumulative Data was reset")
        resetCumulativeData()
    }
}

function resetCumulativeData() {
    cumulativeData = []
    storeCumulativeData()
}

function generateWelcomeMessage() {
    console.log("generating message")

    const welcomeHeader = document.querySelector("[data-welcome-header]")
    const welcomeMessage = document.querySelector("[data-welcome-message]")
    const welcomeButton = document.querySelector("[data-welcome-button]")
    const welcomeDate = document.querySelector("[data-welcome-date]")
    const welcomeNumber = document.querySelector("[data-welcome-number]")

    if (gameState.isComplete != true) {
        welcomeHeader.textContent = "Welcome Back"
        welcomeMessage.innerHTML = "Click below to finish todays game."
        welcomeMessage.classList.add('long')
        welcomeButton.textContent = "Continue"
        welcomeButton.onclick = () => {
            showPage('game')
            fireEvent("continueGame")
        }
    } else {
        welcomeHeader.textContent = "Hello"
        welcomeMessage.innerHTML = "There will be another <br> Uimhir tomorrow.<br> See you then!"
        welcomeMessage.classList.remove('long')
        welcomeButton.textContent = "See Stats"
        welcomeButton.onclick = () => {
            showPage('stats')
            fireEvent("fromWelcomeToStats")
        }
    }

    const today = new Date();
    const yyyy = today.getFullYear();
    let mm = today.getMonth();
    let dd = today.getDate();

    let months = [
        "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
    ]

    if (dd < 10) dd = '0' + dd;

    const formattedToday = months[mm] + " " + dd + ", " + yyyy
    welcomeDate.textContent = formattedToday

    welcomeNumber.textContent = "No. " + (targetGameNumber)
}

function updateInfoPage() {
    //drawWelcomeCircle(27/30, "00:27")

    if (gameState.games[0].wasStarted === false) {
        playButton.textContent = "Play"
        playButton.onclick = function () {
            showPage("game")
            fireEvent("playGame")
        } 
    } else {
        playButton.textContent = "Continue"
        playButton.onclick = function () {
            showPage("game")
        } 
    }
}

function processStats(cumulativeState) {
    let result = {
        today: {
            score: null
        },
        overall: {
            daysPlayed: cumulativeState.length,
            bestScore: null,
            avgScore: null,
            currentStreak: 0,
            bestStreak: 0
        }
    }

    if (cumulativeState.length === 0) return result

    let runningStreak = 0
    let bestStreak = 0
    const validGrades = []

    cumulativeState.forEach((entry, i) => {
        const grade = Number(entry.grade)
        if (!isNaN(grade)) {
            validGrades.push(grade)
            if (result.overall.bestScore === null || grade > result.overall.bestScore) {
                result.overall.bestScore = grade
            }
        }

        let isNext = true
        if (i !== 0) {
            isNext = (Number(entry.number) === Number(cumulativeState[i - 1].number) + 1)
        }
        runningStreak = isNext ? runningStreak + 1 : 1
        if (runningStreak > bestStreak) bestStreak = runningStreak
    })

    result.overall.currentStreak = runningStreak
    result.overall.bestStreak = bestStreak

    if (validGrades.length > 0) {
        result.overall.avgScore = Math.round(
            validGrades.reduce((s, g) => s + g, 0) / validGrades.length
        )
    }

    const todayEntry = cumulativeState[cumulativeState.length - 1]
    const todayGrade = Number(todayEntry.grade)
    if (!isNaN(todayGrade)) result.today.score = todayGrade

    return result
}

function evaluateDistances(distances) {
    // Initialize counters for each category
    let result = {
        zeros: 0,
        threes: 0,
        fours: 0,
        tens: 0
    };

    // Loop through the array and increment counters based on the value
    for (let distance of distances) {
        if (distance === 0) {
            result.zeros++;
        } else if (distance > 0 && distance <= 3) {
            result.threes++;
        } else if (distance > 3 && distance <= 10) {
            result.fours++;
        } else {
            result.tens++;
        }
    }

    return result;
}

function updateAllStats() {
    updateCumulativeData()
    const results = processStats(cumulativeData)
    renderPerformanceTab(results)
}

function getScoreRank(score) {
    if (score >= 95) return 'Genius'
    if (score >= 90) return 'Amazing'
    if (score >= 80) return 'Great'
    if (score >= 70) return 'Nice'
    if (score >= 60) return 'Solid'
    if (score >= 50) return 'Good'
    if (score >= 40) return 'Moving Up'
    if (score >= 20) return 'Good Start'
    return 'Beginner'
}

function renderPerformanceTab(results) {
    const scorePctEl = document.querySelector('[data-stats-score-pct]')
    const scoreRankEl = document.querySelector('[data-stats-score-rank]')
    if (scorePctEl && scoreRankEl) {
        if (results.today.score !== null) {
            scorePctEl.textContent = results.today.score + '%'
            scoreRankEl.textContent = getScoreRank(results.today.score)
        } else {
            scorePctEl.textContent = '\u2013'
            scoreRankEl.textContent = ''
        }
    }

    renderTodayRounds()

    const bestScoreEl = document.querySelector('[data-stats-best-score]')
    const avgScoreEl = document.querySelector('[data-stats-avg-score]')
    const curStreakEl = document.querySelector('[data-stats-cur-streak]')
    const bestStreakEl = document.querySelector('[data-stats-best-streak]')

    if (bestScoreEl) bestScoreEl.textContent = results.overall.bestScore !== null ? results.overall.bestScore + '%' : '\u2013'
    if (avgScoreEl) avgScoreEl.textContent = results.overall.avgScore !== null ? results.overall.avgScore + '%' : '\u2013'
    if (curStreakEl) curStreakEl.textContent = results.overall.currentStreak
    if (bestStreakEl) bestStreakEl.textContent = results.overall.bestStreak
}

function renderTodayRounds() {
    const container = document.querySelector('[data-stats-rounds]')
    if (!container) return
    container.innerHTML = ''

    // cumulativeData is the persistent source of truth for completed round scores
    const todayEntry = cumulativeData.find(e => e.number === gameState.puzzleNumber)

    for (let i = 0; i < 3; i++) {
        const game = gameState.games[i]
        const roundNum = i + 1
        const row = document.createElement('div')
        row.className = 'stats-round-row'

        // A round is complete if gameState says so OR cumulativeData has a score for it
        const inCumulative = todayEntry && Array.isArray(todayEntry.distances) && todayEntry.distances.length > i
        const isComplete = (game && game.isComplete) || inCumulative

        if (!isComplete) {
            row.classList.add('stats-round-row-unplayed')
            row.innerHTML = `
                <div class="stats-round-col-id">
                    <div class="stats-round-label">Round ${roundNum}</div>
                    <div class="stats-round-target">Target: ${(game && game.numbers && game.numbers[0]) || '\u2013'}</div>
                </div>
                <div class="stats-round-placeholder">Play this round to see results.</div>
            `
            container.appendChild(row)
            continue
        }

        const target = (game && game.numbers && game.numbers[0]) || '\u2013'
        // Prefer cumulativeData scores as they are the persisted source of truth
        const dist = inCumulative ? todayEntry.distances[i] : normalizeDistance(game.distance)
        const elapsed = (inCumulative && todayEntry.elapsedTimes && todayEntry.elapsedTimes[i] != null)
            ? todayEntry.elapsedTimes[i]
            : (game && Number.isFinite(Number(game.elapsedSeconds)) ? Math.floor(Number(game.elapsedSeconds)) : 0)
        const roundScore = Math.max(0, Math.min(100, getDistanceScore(dist) + getTimerPenalty(elapsed)))

        const mins = Math.floor(elapsed / 60)
        const secs = elapsed % 60
        const timeStr = mins + ':' + (secs < 10 ? '0' : '') + secs

        const isExact = dist === 0
        const isClose = dist > 0 && dist <= 3
        const scoreColor = roundScore >= 80 ? '#009982' : '#e07000'
        const distMainText = isExact ? 'Exact answer' : dist + ' away'
        const currentAnswer = game && game.currentAnswer != null ? game.currentAnswer : null
        const distSubText = isExact ? '0 away' : 'Answer: ' + (currentAnswer !== null ? currentAnswer : '\u2013')

        const wrapColor = (isExact || isClose) ? '#009982' : '#e07000'
        const checkSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:0.35em;height:0.35em"><path d="M5 12l4.5 4.5L19 8" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
        const distIconHtml = `<div class="stats-round-dist-icon-wrap" style="background:${wrapColor}">${isExact ? checkSvg : ''}</div>`

        row.innerHTML = `
            <div class="stats-round-col-id">
                <div class="stats-round-label">Round ${roundNum}</div>
                <div class="stats-round-target">Target: ${target}</div>
            </div>
            <div class="stats-round-col-dist">
                ${distIconHtml}
                <div class="stats-round-dist-text">
                    <div class="stats-round-dist-top">${distMainText}</div>
                    <div class="stats-round-dist-bot">${distSubText}</div>
                </div>
            </div>
            <div class="stats-round-col-time">
                <div class="stats-round-time-icon-wrap"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:1.7em;height:1.7em"><circle cx="12" cy="12" r="9" stroke="#009982" stroke-width="1.8" fill="none"/><path d="M12 7v5l3.5 2" stroke="#009982" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                <div class="stats-round-time-text">
                    <div class="stats-round-time-val">${timeStr}</div>
                    <div class="stats-round-time-bot">Time</div>
                </div>
            </div>
            <div class="stats-round-col-score" style="color:${scoreColor}">${roundScore}%</div>
        `
        container.appendChild(row)
    }
}

function getGrade(games, wins, threes, fours, tens) {
    const maxScore = games * 5;
    const currentScore = (wins * 5) + (threes * 3) + (fours * 1);
    const grade = Math.round((currentScore / maxScore) * 100).toFixed(0);

    return grade;
}

function pressShare() {
    if (gameState.isComplete == false) {
        showShareAlert("Complete todays puzzle to share!")
        return;
    }

    let lastEntry = cumulativeData[cumulativeData.length - 1]
    const grade = lastEntry.grade

    let textToCopy = "Try Uimhir! \nwww.independent.ie/uimhir \n Puzzle: " + targetGameNumber + " " + "\n" + " My score today: " + grade + "% \n" 

    if (navigator.share && detectTouchscreen() && ALLOW_MOBILE_SHARE) {
        navigator.share({
            text: textToCopy
        })
    } else {
        navigator.clipboard.writeText(textToCopy)
        showShareAlert("Link Copied! Share with Your Friends!")
    }

    fireEvent("pressedShare");
}

function pressStatsButton(tabName) {
    const buttons = document.querySelectorAll("[data-stats-button]")
    const performanceOverlay = document.querySelector("[data-overlay-performance]")
    const rankingsOverlay = document.querySelector("[data-overlay-rankings]")

    buttons.forEach((button) => {
        button.classList.remove("selected")
    })

    if (tabName === "rankings") {
        const rankingsButton = document.querySelector("[data-rankings]")
        if (rankingsButton != null) rankingsButton.classList.add("selected")

        if (performanceOverlay != null) performanceOverlay.classList.remove("active")
        if (rankingsOverlay != null) rankingsOverlay.classList.add("active")
    } else {
        const performanceButton = document.querySelector("[data-performance]")
        if (performanceButton != null) performanceButton.classList.add("selected")

        if (rankingsOverlay != null) rankingsOverlay.classList.remove("active")
        if (performanceOverlay != null) performanceOverlay.classList.add("active")
    }
}

function clearPuzzleData() {
    showShareAlert("Clear data flow will be added soon.")
}

function detectTouchscreen() {
    var result = false
    if (window.PointerEvent && ('maxTouchPoints' in navigator)) {
        if (navigator.maxTouchPoints > 0) {
            result = true
        }
    } else {
        if (window.matchMedia && window.matchMedia("(any-pointer:coarse)").matches) {
            result = true
        } else if (window.TouchEvent || ('ontouchstart' in window)) {
            result = true
        }
    }
    return result
}

function fireEvent(eventName) {
    const event = new CustomEvent(eventName)

    document.dispatchEvent(event)
    pushEventToDataLayer(event)

    console.log("EVENT: " + eventName)
}

function pushEventToDataLayer(event) {
    const eventName = event.type
    const eventDetails = event.detail

    window.dataLayer.push({
        'event': eventName,
        ...eventDetails
    })

    console.log(window.dataLayer)
}