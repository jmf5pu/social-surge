// view counts TODO: move this to model?
var succeededCount = 0
var failedCount = 0
var todoCount = 0
var totalViewTimeMs = 0

// TODO: remove this:
const data = electronStoreGetData();
console.log(data);
//

document.addEventListener('DOMContentLoaded', () => {
    // form
    const runInfoForm = document.getElementById('bot-input-form')

    // form fields
    const searchStringInput = document.getElementById('search-string')
    const viewCountInput = document.getElementById('view-count')
    const minViewSInput = document.getElementById('min-view-s')
    const maxViewSInput = document.getElementById('max-view-s')
    const workerCountInput = document.getElementById('worker-count')
    const chromiumPathInput = document.getElementById('file-input')
    const chromiumPathInputLabel =
        document.getElementById('file-input-label')
    const proxyInput = document.getElementById('proxy-list')

    // title bar buttons
    const closeButton = document.getElementById('close-button')
    const minimizeButton = document.getElementById('minimize-button')

    const mainResponse = document.querySelector('#main-response')

    // form controls
    const resetFormButton = document.querySelector('#form-reset-button')
    const submitFormButton = document.querySelector('#form-submit-button')

    // cancel run button
    const cancelButton = document.querySelector('#cancel-button')

    // 3 -> 1 button
    const pageThreeNextButton = document.querySelector(
        '#page-three-to-one'
    )

    // main app pages
    const pageOne = document.getElementById('page-one')
    const pageTwo = document.getElementById('page-two')
    const pageThree = document.getElementById('page-three')

    // page 2 proxy display elements
    const succeeded = document.getElementById('succeeded-count')
    const todo = document.getElementById('to-do-count')
    const failed = document.getElementById('failed-count')
    const incrementSucceeded = document.getElementById('succeeded-fade')
    const incrementFailed = document.getElementById('failed-fade')
    const progressBar = document.getElementById('progress-bar-inner')
    const currentProxy = document.getElementById('current-proxy')
    const totalViewTime = document.getElementById('total-view-time')
    const topRow = document.getElementById('top-row')
    const middleRow = document.getElementById('middle-row')
    const bottomRow = document.getElementById('bottom-row')

    // Populate the form with stored values from the store
    for (const inputField of runInfoForm.elements) {
        if (inputField.id) {
            const storedValue = electronStore.get(inputField.id)
            if (storedValue) {
                inputField.value = storedValue
            }
        }
    }

    // Event listeners for title bar button clicks
    closeButton.addEventListener('click', () => {
        window.ipcRenderer.send('exit')
    })

    minimizeButton.addEventListener('click', () => {
        window.ipcRenderer.send('minimize-window')
    })

    // listening for file selection on page 1
    chromiumPathInput.addEventListener('change', () => {
        console.log(chromiumPathInput.files[0].path)
        chromiumPathInputLabel.innerHTML = chromiumPathInput.files[0].path
            .split('\\')
            .pop()
    })

    // reset form
    resetFormButton.addEventListener('click', (event) => {
        searchStringInput.value = ''
        viewCountInput.value = ''
        minViewSInput.value = ''
        maxViewSInput.value = ''
        workerCountInput.value = '1'
        chromiumPathInputLabel.innerHTML = 'Select Chromium Path'
        chromiumPathInput.value = ''
        proxyInput.value = ''
        removeInputRedBorders()
    })

    // page 1 -> 2 (kick off run)
    submitFormButton.addEventListener('click', (event) => {
        // Get form data and save it to localStorage
        const formValues = new FormData(runInfoForm)
        for (let [name, value] of formValues) {
            electronStore.set(name, value)
        }

        // remove any red borders on resubmission
        removeInputRedBorders()

        let runArgs = new RunInfo(
            (searchString = searchStringInput.value),
            (viewCount = parseInt(viewCountInput.value)),
            (minViewS = parseInt(minViewSInput.value)),
            (maxViewS = parseInt(maxViewSInput.value)),
            (workerCount = parseInt(workerCountInput.value)),
            (chromiumPath = (() => {
                try {
                    return chromiumPathInput.files[0].path
                } catch (error) {
                    return null
                }
            })()),
            (proxies = proxyInput.value)
        )

        // workerCount must be 1 or greater, if not, reset to default
        if (runArgs.workerCount <= 0) {
            runArgs.workerCount = 1
            workerCountInput.value = '1'
        }

        if (validateForm(runArgs)) {
            // update fields on second screen
            todoCount = runArgs.viewCount
            succeededCount = 0
            failedCount = 0
            todo.innerHTML = todoCount
            succeeded.innerHTML = succeededCount
            failed.innerHTML = failedCount
            topRow.innerHTML = '&emsp;'
            middleRow.innerHTML = '&emsp;'
            bottomRow.innerHTML = '&emsp;'
            progressBar.style.width = '0%'
            // send data to main.js
            submitForm(runArgs)

            // go to next page
            pageOne.style.display = 'none'
            pageTwo.style.display = 'block'
        }
    })

    // page 2 -> 3 (run cancelled)
    cancelButton.addEventListener('click', () => {
        window.ipcRenderer.send('run-complete')
        pageTwoToThree()
    })

    // page 2 -> 3 (run completed)
    window.ipcRenderer.on('run-complete', () => {
        pageTwoToThree()
    })

    // page 3 -> 1
    pageThreeNextButton.addEventListener('click', (event) => {
        pageThree.style.display = 'none'
        pageOne.style.display = 'block'

        // reset view time
        totalViewTimeMs = 0
    })

    // exit app
    document
        .getElementById('exit-btn')
        .addEventListener('click', (event) => {
            event.preventDefault()
            window.ipcRenderer.send('exit')
        })

    window.ipcRenderer.on('individual-view-start', (event, proxy) => {
        console.log(isWhitespace(topRow.innerHTML))
        if (isWhitespace(topRow.innerHTML)) {
            topRow.innerHTML = proxy
        } else {
            let topRowTemp = topRow.innerHTML
            let middleRowTemp = middleRow.innerHTML

            // clear bottom row
            bottomRow.innerHTML = '&emsp;'

            // move top row down and lighten
            topRow.classList.add('animated-text-lighten')
            topRow.addEventListener('animationend', () => {
                topRow.classList.remove('animated-text-lighten')
                topRow.innerHTML = proxy
                middleRow.innerHTML = topRowTemp
            })

            // move middle row down and darken
            middleRow.classList.add('animated-text-darken')
            middleRow.addEventListener('animationend', () => {
                middleRow.classList.remove('animated-text-darken')
                bottomRow.innerHTML = middleRowTemp
            })
        }
    })

    window.ipcRenderer.on(
        'individual-result',
        (event, ipAddress, viewResult, viewTimeMs) => {
            totalViewTimeMs += viewTimeMs

            if (viewResult) {
                // update success counter
                succeededCount += 1
                succeeded.innerHTML = succeededCount

                // animation
                incrementSucceeded.innerHTML = '+1'
                incrementSucceeded.classList.add('fade-out')
                setTimeout(() => {
                    incrementSucceeded.innerHTML = ''
                    incrementSucceeded.classList.remove('fade-out')
                }, 1000) // Remove the 'fade-out' class after 1 second

                // update todo counter
                todoCount -= 1
                todo.innerHTML = todoCount

                // update progress bar
                widthRatio = succeededCount / (succeededCount + todoCount)
                progressBar.style.width = `${widthRatio * 100}%`
            } else {
                // update failure counter
                failedCount += 1
                failed.innerHTML = failedCount

                // animation
                incrementFailed.innerHTML = '+1'
                incrementFailed.classList.add('fade-out')
                setTimeout(() => {
                    incrementFailed.innerHTML = ''
                    incrementFailed.classList.remove('fade-out')
                }, 1000)
            }
        }
    )

    // go from page 2 to 3
    function pageTwoToThree() {
        pageTwo.style.display = 'none'
        pageThree.style.display = 'block'
        totalViewTime.innerHTML = convertTime(totalViewTimeMs)
    }

    // validate form fields
    function validateForm(runArgs) {
        formIsValid = true

        // must have a search string
        if (isWhitespace(runArgs.searchString)) {
            searchStringInput.classList.add('red-border')
            formIsValid = false
        }

        // must request at least 1 view
        if (isNaN(runArgs.viewCount) || runArgs.viewCount <= 0) {
            viewCountInput.classList.add('red-border')
            formIsValid = false
        }

        // min view s must be less than max view s, and must be greater than 0
        if (isNaN(runArgs.minViewS) || runArgs.minViewS <= 0) {
            minViewSInput.classList.add('red-border')
            formIsValid = false
        }

        if (isNaN(runArgs.maxViewS) || runArgs.maxViewS <= 0) {
            maxViewSInput.classList.add('red-border')
            formIsValid = false
        }

        if (runArgs.minViewS > runArgs.maxViewS) {
            minViewSInput.classList.add('red-border')
            maxViewSInput.classList.add('red-border')
            formIsValid = false
        }

        if (!runArgs.chromiumPath) {
            console.log('must specify chromium path')
            chromiumPathInputLabel.classList.add('red-border')
            formIsValid = false
        }

        // proxies must be only numbers and punctuation, must be commas or newline separated
        if (
            !isNumbersAndPunctuation(runArgs.proxies) ||
            (!runArgs.proxies.includes(',') &&
                !runArgs.proxies.includes('\n'))
        ) {
            proxyInput.classList.add('red-border')
            formIsValid = false
        }
        return formIsValid
    }

    function removeInputRedBorders() {
        searchStringInput.classList.remove('red-border')
        viewCountInput.classList.remove('red-border')
        minViewSInput.classList.remove('red-border')
        maxViewSInput.classList.remove('red-border')
        workerCountInput.classList.remove('red-border')
        chromiumPathInputLabel.classList.remove('red-border')
        proxyInput.classList.remove('red-border')
    }

    // form submission
    function submitForm(formData) {
        window.ipcRenderer.send('run-start', formData)
    }
})

// format time for third page TODO: fix this, total time is wrong (likely adding failed runs)
function convertTime(totalViewTimeMs) {
    var hours = Math.floor(totalViewTimeMs / 3600000) // 1 hour = 3600000 milliseconds
    var minutes = Math.floor((totalViewTimeMs % 3600000) / 60000) // 1 minute = 60000 milliseconds
    var seconds = Math.floor(((totalViewTimeMs % 3600000) % 60000) / 1000) // 1 second = 1000 milliseconds

    var formattedTime =
        hours + ' Hours, ' + minutes + ' Minutes, ' + seconds + ' Seconds'
    return formattedTime
}

// returns if string is whitespace only
function isWhitespace(str) {
    return /^\s*$/.test(str)
}

// returns if a string only contains numbers, punctuation, and whitespace
function isNumbersAndPunctuation(str) {
    return /^[0-9\p{P}\s]+$/u.test(str)
}
class RunInfo {
    constructor(
        searchString,
        viewCount,
        minViewS,
        maxViewS,
        workerCount,
        chromiumPath,
        proxies
    ) {
        this.searchString = searchString
        this.viewCount = viewCount
        this.minViewS = minViewS
        this.maxViewS = maxViewS
        this.workerCount = workerCount
        this.chromiumPath = chromiumPath
        this.proxies = proxies
    }
}
