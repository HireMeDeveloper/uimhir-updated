if (window.DEBUG_MODE === true) {
    runStatisticsTests()
    runSolverTwentyCaseUnitTests()
}

function deepEqual(obj1, obj2) {
    if (obj1 === obj2) return true;

    if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 == null || obj2 == null) {
        return false;
    }

    let keys1 = Object.keys(obj1);
    let keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (let key of keys1) {
        if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
            return false;
        }
    }

    return true;
}

function statisticsUnitTest(testName, cumulativeData, expectedResults) {
    let results = processStats(cumulativeData);
    if (deepEqual(expectedResults, results)) {
        console.log("TEST (" + testName + "): PASSED");
    } else {
        console.log("TEST (" + testName + "): FAILED");
        console.log("Expected: " + JSON.stringify(expectedResults, null, 2) + " \nActual: " + JSON.stringify(results, null, 2));
    }
}

function runStatisticsTests() {
    statisticsUnitTest(
        "test1",
        [
            { number: 68, distances: [100, 5, 0], grade: 50 },
            { number: 69, distances: [904, 100, 0], grade: 60 }
        ],
        {
            today: {
                streak: 2,
                gamesPlayed: 3,
                wins: 1,
                threes: 0,
                fours: 0,
                tens: 2,
                gradeText: "33%"
            },
            overall: {
                daysPlayed: 2,
                gamesPlayed: 6,
                wins: 2,
                threes: 0,
                fours: 1,
                tens: 3,
                gradeText: "37%"
            }
        }
    );
}

async function runSolverTwentyCaseUnitTests() {
    const totalCases = 20
    const largeNumberPattern = [2, 3, 1]

    for (let i = 0; i < totalCases; i++) {
        const testName = "solver20Case" + (i + 1)
        const largeCount = largeNumberPattern[i % largeNumberPattern.length]
        const numbers = generateNumbers(largeCount)

        try {
            const solution = await findClosestSolution(numbers)
            const target = Number(numbers[0])
            const closest = Number(solution && solution.closestSolution)
            const hasClosest = Number.isFinite(closest)
            const chainIsValid = hasClosest && isValidSolutionChainForNumbers(numbers, solution)

            const passed =
                solution != null &&
                Number(solution.target) === target &&
                hasClosest &&
                chainIsValid

            if (passed) {
                console.log("TEST (" + testName + "): PASSED")
            } else {
                console.log("TEST (" + testName + "): FAILED")
            }
        } catch (error) {
            console.log("TEST (" + testName + "): FAILED")
        }
    }
}

function timerUnitTest(testName, wordSize, expectedResult) {
    let results = getTimerDuration(wordSize);
    if (results === expectedResult) {
        console.log("TEST (" + testName + "): PASSED");
    } else {
        console.log("Test (" + testName + "): FAILED with RESULT: " + results + " and EXPECTED: " + expectedResult)
    }
}

function runTimerUnitTests() {
    timerUnitTest("test 1", 7, 3000)
    timerUnitTest("test 2", 8, 4000)
    timerUnitTest("test 3", 9, 5000)
}

function solutionUnitTest(testName, numbers, expectedResults) {
    let results = findClosestSolution(numbers)
    if (deepEqual(expectedResults, results)) {
        console.log("TEST (" + testName + "): PASSED");
    } else {
        console.log("TEST (" + testName + "): FAILED");
        console.log("Expected: " + JSON.stringify(expectedResults, null, 2) + " \nActual: " + JSON.stringify(results, null, 2));
    }
}

function formatSolverStep(step) {
    if (!Array.isArray(step) || step.length < 5) return "Invalid step"
    return step[0] + " " + step[1] + " " + step[2] + " " + step[3] + " " + step[4]
}

async function runSolverBatchTests(testCases) {
    if (!Array.isArray(testCases)) {
        throw new Error("runSolverBatchTests requires an array of test cases")
    }

    const output = []

    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i]
        const testName = testCase.testName || ("solverCase" + (i + 1))
        const numbers = testCase.numbers

        if (!Array.isArray(numbers) || numbers.length < 2) {
            const invalidCase = {
                testName,
                passed: false,
                reason: "Invalid numbers input",
                numbers
            }

            output.push(invalidCase)
            console.log("TEST (" + testName + "): FAILED - Invalid numbers input")
            continue
        }

        try {
            const solution = await findClosestSolution(numbers)
            const target = Number(numbers[0])
            const closest = Number(solution.closestSolution)
            const distance = Number.isFinite(closest) ? Math.abs(target - closest) : null
            const hasExact = Number.isFinite(closest) ? (closest === target) : false
            const isValidChain = isValidSolutionChainForNumbers(numbers, solution)
            const expectedClosest = (testCase.expectedClosest == null) ? null : Number(testCase.expectedClosest)
            const expectedDistance = (testCase.expectedDistance == null) ? null : Number(testCase.expectedDistance)

            let passed = true
            if (expectedClosest != null && closest !== expectedClosest) passed = false
            if (expectedDistance != null && distance !== expectedDistance) passed = false

            const steps = Array.isArray(solution.sums)
                ? solution.sums.map((step) => formatSolverStep(step))
                : []

            const result = {
                testName,
                passed,
                target,
                closestSolution: solution.closestSolution,
                distance,
                hasExact,
                isValidChain,
                steps,
                rawSolution: solution
            }

            output.push(result)

            console.log("TEST (" + testName + "): " + (passed ? "PASSED" : "FAILED"))
            console.log("Target: " + target + " | Closest: " + solution.closestSolution + " | Distance: " + distance)

            if (steps.length === 0) {
                console.log("Solver steps: None")
            } else {
                console.log("Solver steps:")
                steps.forEach((step, stepIndex) => {
                    console.log("  " + (stepIndex + 1) + ". " + step)
                })
            }
        } catch (error) {
            const failedResult = {
                testName,
                passed: false,
                reason: "Solver threw an error",
                error: (error && error.message) ? error.message : String(error),
                numbers
            }

            output.push(failedResult)
            console.log("TEST (" + testName + "): FAILED - " + failedResult.error)
        }
    }

    return output
}

async function runDefaultSolverBatchTests() {
    return runSolverBatchTests([
        {
            testName: "solverCase1",
            numbers: [421, 100, 50, 25, 9, 4, 2]
        },
        {
            testName: "solverCase2",
            numbers: [365, 100, 75, 50, 25, 9, 4]
        },
        {
            testName: "solverCase3",
            numbers: [755, 100, 50, 25, 9, 4, 1]
        }
    ])
}

async function simulateSolverGameCreations(numberOfUses = 3, largeNumberPattern = [2, 3, 1]) {
    const runs = []
    const parsedUses = Number(numberOfUses)
    const totalUses = Number.isFinite(parsedUses) && parsedUses > 0 ? Math.floor(parsedUses) : 1
    const pattern = Array.isArray(largeNumberPattern) && largeNumberPattern.length > 0
        ? largeNumberPattern
        : [2, 3, 1]

    for (let useIndex = 0; useIndex < totalUses; useIndex++) {
        const rounds = []

        for (let roundIndex = 0; roundIndex < pattern.length; roundIndex++) {
            const largeCount = Number(pattern[roundIndex])
            const numbers = generateNumbers(Number.isFinite(largeCount) ? largeCount : 2)
            const solution = await findClosestSolution(numbers)
            const target = Number(numbers[0])
            const closest = Number(solution.closestSolution)
            const distance = Number.isFinite(closest) ? Math.abs(target - closest) : null
            const steps = Array.isArray(solution.sums)
                ? solution.sums.map((step) => formatSolverStep(step))
                : []

            const round = {
                round: roundIndex + 1,
                largeNumbers: Number.isFinite(largeCount) ? largeCount : 2,
                numbers,
                sourceNumbers: numbers.slice(1),
                target,
                closestSolution: solution.closestSolution,
                distance,
                hasExact: distance === 0,
                steps
            }

            rounds.push(round)

            console.log("SIM (Use " + (useIndex + 1) + " Round " + (roundIndex + 1) + ")")
            console.log("  Numbers: " + numbers.join(", "))
            console.log("  Target: " + target + " | Chosen: " + solution.closestSolution + " | Distance: " + distance)

            if (steps.length === 0) {
                console.log("  Solver steps: None")
            } else {
                console.log("  Solver steps:")
                steps.forEach((step, stepIndex) => {
                    console.log("    " + (stepIndex + 1) + ". " + step)
                })
            }
        }

        runs.push({
            use: useIndex + 1,
            rounds
        })
    }

    return runs
}

window.runSolverBatchTests = runSolverBatchTests
window.runDefaultSolverBatchTests = runDefaultSolverBatchTests
window.simulateSolverGameCreations = simulateSolverGameCreations

function runSolutionsTests() {
    solutionUnitTest(
        "solutionTest1",
        [
            755, 100, 50, 25, 9, 4, 1
        ],
        {
            closestSolution: 188,
            sums: [
                [100, '+', 50, '=', 150],
                [150, '+', 25, '=', 175],
                [175, '+', 9, '=', 184],
                [184, '+', 4, '=', 188]
            ],
            target: 755
        }
    )
}
