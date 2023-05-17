var mainResponse = document.querySelector('#main-response')
var submitFormButton = document.querySelector('#form-submit-button')
var cancelButton = document.querySelector('#cancel-button')
var pageTwoNextButton = document.querySelector('#page-two-to-three')
var pageThreeNextButton = document.querySelector('#page-three-to-one')

var pageOne = document.getElementById('page-one')
var pageTwo = document.getElementById('page-two')
var pageThree = document.getElementById('page-three')

// view counts
var succeededCount = 0
var failedCount = 0
var todoCount = 0

function submitForm(formData) {
    console.log('sending')
    window.ipcRenderer.send('run-start', formData)
}

// page 1 -> 2 (kick off run)
submitFormButton.addEventListener('click', (event) => {
    event.stopPropagation()

    let runArgs = new RunInfo(
        (searchString = document.getElementById('search-string').value),
        (viewCount = parseInt(
            document.getElementById('view-count').value
        )),
        (minViewS = parseInt(document.getElementById('min-view-s').value)),
        (maxViewS = parseInt(document.getElementById('max-view-s').value)),
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
    document.getElementById('succeeded-count').innerHTML = succeededCount
    document.getElementById('failed-count').innerHTML = failedCount

    // send data to main.js
    submitForm(runArgs)

    // go to next page
    pageOne.style.visibility = 'hidden'
    pageTwo.style.visibility = 'visible'
})

// page 2 -> 3 (cancel a run)
cancelButton.addEventListener('click', () => {
    window.ipcRenderer.send('run-cancel')
    pageTwoToThree()
})

// go to page 3 when run is complete
window.ipcRenderer.on('run-complete', pageTwoToThree)

// page 3 -> 1
pageThreeNextButton.addEventListener('click', (event) => {
    console.log('run complete')
    pageThree.style.visibility = 'hidden'
    pageOne.style.visibility = 'visible'
})

// exit app
document.getElementById('exit-btn').addEventListener('click', (event) => {
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

/**
 *  |  Classes and helpers  |
 *  v         below         v
 */

// go from page 2 to 3
function pageTwoToThree() {
    pageTwo.style.visibility = 'hidden'
    pageThree.style.visibility = 'visible'
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
        this.proxyIndex = 0
    }
    // TODO: validate fields here
}
