// view counts TODO: move this to model?
var succeededCount = 0
var failedCount = 0
var todoCount = 0

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
        document.getElementById('to-do-count').innerHTML = todoCount
        document.getElementById('succeeded-count').innerHTML =
            succeededCount
        document.getElementById('failed-count').innerHTML = failedCount

        // send data to main.js
        submitForm(runArgs)

        // go to next page
        pageOne.style.display = 'none'
        pageTwo.style.display = 'block'
    })

    // page 2 -> 3 (cancel a run)
    cancelButton.addEventListener('click', () => {
        window.ipcRenderer.send('run-cancel')
        pageTwoToThree()
    })

    // page 3 -> 1
    pageThreeNextButton.addEventListener('click', (event) => {
        console.log('run complete')
        pageThree.style.display = 'none'
        pageOne.style.display = 'hidden'
    })

    // exit app
    document
        .getElementById('exit-btn')
        .addEventListener('click', (event) => {
            event.preventDefault()
            window.ipcRenderer.send('exit')
        })

    // update view stats real time
    window.ipcRenderer.on('individual-result', (event, args) => {
        if (args) {
            succeededCount += 1
            document.getElementById('succeeded-count').innerHTML =
                succeededCount
            todoCount -= 1
            document.getElementById('to-do-count').innerHTML = todoCount
        } else {
            failedCount += 1
            document.getElementById('failed-count').innerHTML = failedCount
        }
    })

    // go from page 2 to 3
    function pageTwoToThree() {
        pageTwo.style.display = 'none'
        pageThree.style.display = 'block'
    }
    // form submission
    function submitForm(formData) {
        console.log('sending')
        window.ipcRenderer.send('run-start', formData)
    }

    // go to page 3 when run is complete
    window.ipcRenderer.on('run-complete', () => {
        console.log('run complete')
        pageTwoToThree()
    })
})

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
        this.proxyIndex = 0
    }
    // TODO: validate fields here
}
