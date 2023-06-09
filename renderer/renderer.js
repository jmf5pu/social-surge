// view counts TODO: move this to model?
var succeededCount = 0
var failedCount = 0
var todoCount = 0
var totalViewTimeMs = 0
document.addEventListener('DOMContentLoaded', () => {
    const closeButton = document.getElementById('close-button')
    const minimizeButton = document.getElementById('minimize-button')
    const mainResponse = document.querySelector('#main-response')
    const submitFormButton = document.querySelector('#form-submit-button')
    const cancelButton = document.querySelector('#cancel-button')
    const pageThreeNextButton = document.querySelector(
        '#page-three-to-one'
    )
    const pageOne = document.getElementById('page-one')
    const pageTwo = document.getElementById('page-two')
    const pageThree = document.getElementById('page-three')
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

    // perform running proxies animation
    document.getElementById('anim-button').addEventListener('click', () => {
        let topRowTemp = topRow.innerHTML
        let middleRowTemp = middleRow.innerHTML
        let bottomRowTemp = bottomRow.innerHTML

        // clear bottom row
        bottomRow.innerHTML = ""

        // move top row down and lighten
        topRow.classList.add('animated-text-lighten')
        topRow.addEventListener('animationend', () =>{
            topRow.classList.remove('animated-text-lighten')
            topRow.innerHTML = bottomRowTemp
            middleRow.innerHTML = topRowTemp
        })

        // move middle row down and darken
        middleRow.classList.add('animated-text-darken')
        middleRow.addEventListener('animationend', () => {
            middleRow.classList.remove('animated-text-darken')
            bottomRow.innerHTML = middleRowTemp
        })        
    })
    
    // Add event listeners to handle button clicks
    closeButton.addEventListener('click', () => {
        window.ipcRenderer.send('exit')
    })

    minimizeButton.addEventListener('click', () => {
        window.ipcRenderer.send('minimize-window')
    })

    // page 1 -> 2 (kick off run)
    submitFormButton.addEventListener('click', (event) => {
        event.stopPropagation()

        let runArgs = new RunInfo(
            (searchString =
                document.getElementById('search-string').value),
            (viewCount = parseInt(
                document.getElementById('view-count').value
            )),
            (minViewS = parseInt(
                document.getElementById('min-view-s').value
            )),
            (maxViewS = parseInt(
                document.getElementById('max-view-s').value
            )),
            (workerCount = parseInt(
                document.getElementById('worker-count').value
            )),
            (proxies = document.getElementById('proxy-list').value)
        )

        // update fields on second screen
        todoCount = runArgs.viewCount
        succeededCount = 0
        failedCount = 0
        todo.innerHTML = todoCount
        succeeded.innerHTML = succeededCount
        failed.innerHTML = failedCount

        // send data to main.js
        submitForm(runArgs)

        // go to next page
        pageOne.style.display = 'none'
        pageTwo.style.display = 'block'
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
        currentProxy.innerHTML = proxy
    })

    window.ipcRenderer.on(
        'individual-result',
        (event, viewResult, viewTimeMs) => {
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

class RunInfo {
    constructor(
        searchString,
        viewCount,
        minViewS,
        maxViewS,
        workerCount,
        proxies
    ) {
        this.searchString = searchString
        this.viewCount = viewCount
        this.minViewS = minViewS
        this.maxViewS = maxViewS
        this.workerCount = workerCount
        this.proxies = proxies
    }
    // TODO: validate fields here
}
