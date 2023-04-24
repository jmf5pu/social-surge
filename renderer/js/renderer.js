var mainResponse = document.querySelector('#main-response')
var submitFormButton = document.querySelector('#form-submit-button')
var pageTwoNextButton = document.querySelector('#page-two-to-three')
var pageThreeNextButton = document.querySelector('#page-three-to-one')

var pageOne = document.getElementById('page-one')
var pageTwo = document.getElementById('page-two')
var pageThree = document.getElementById('page-three')

function submitForm(formData) {
    console.log('sending')
    window.ipcRenderer.send('asynchronous-message', formData)
}

submitFormButton.addEventListener('click', (event) => {
    event.stopPropagation()

    let searchString = document.getElementById('search-string').value
    let viewCount = parseInt(document.getElementById('view-count').value)
    let minViewS = parseInt(document.getElementById('min-view-s').value)
    let maxViewS = parseInt(document.getElementById('max-view-s').value)
    let workerCount = parseInt(
        document.getElementById('worker-count').value
    )

    // send data to main.js
    submitForm([searchString, viewCount, minViewS, maxViewS, workerCount])
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

window.ipcRenderer.on('asynchronous-reply', (event, args) => {
    console.log(args)
})
