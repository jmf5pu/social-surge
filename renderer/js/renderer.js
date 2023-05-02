var mainResponse = document.querySelector('#main-response')
var submitFormButton = document.querySelector('#form-submit-button')
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
    window.ipcRenderer.send('asynchronous-message', formData)
}

submitFormButton.addEventListener('click', (event) => {
    event.stopPropagation()

    let runArgs = new RunInfo(
        searchString = document.getElementById('search-string').value,
        viewCount = parseInt(document.getElementById('view-count').value),
        minViewS = parseInt(document.getElementById('min-view-s').value),
        maxViewS = parseInt(document.getElementById('max-view-s').value),
        workerCount = parseInt(document.getElementById('worker-count').value),
        proxies = document.getElementById('proxy-list').value
    )

    // update fields on second screen
    todoCount = runArgs.viewCount
    succeededCount = 0
    failedCount = 0
    document.getElementById('to-do-count').innerHTML = todoCount
    document.getElementById('succeeded-count').innerHTML = succeededCount
    document.getElementById('failed-count').innerHTML = failedCount

    // send data to main.js
    submitForm([runArgs])

    // go to next page
    pageOne.style.visibility = 'hidden'
    pageTwo.style.visibility = 'visible'
})

pageTwoNextButton.addEventListener('click', (event) => {
    pageTwo.style.visibility = 'hidden'
    pageThree.style.visibility = 'visible'
})

pageThreeNextButton.addEventListener('click', (event) => {
    pageThree.style.visibility = 'hidden'
    pageOne.style.visibility = 'visible'
})

// exit app
document.getElementById('exit-btn').addEventListener('click', (event) => {
    event.preventDefault()
    window.ipcRenderer.send('exit')
})

// listen for main process responses
window.ipcRenderer.on('asynchronous-reply', (event, args) => {
    console.log(args)
    if (args) {
        succeededCount += 1
        document.getElementById('succeeded-count').innerHTML =
            succeededCount
    } else {
        failed += 1
        document.getElementById('failed-count').innerHTML = failedCount
    }
    todoCount -= 1
    document.getElementById('to-do-count').innerHTML = todoCount
})

// fields are undefined TODO: figure out what is going on here
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
    searchString = this.searchString
    viewCount = this.viewCount
    minViewS = this.minViewS
    maxViewS = this.maxViewS
    workerCount = this.workerCount
    proxies = this.proxies
    // TODO: validate fields here
}