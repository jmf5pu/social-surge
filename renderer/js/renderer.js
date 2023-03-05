var mainResponse = document.querySelector('#main-response')

// receive message from main.js
// ipcRenderer.on('synchronous-reply', (event, response) => {
//     console.log('response received!');
//  })



// document.querySelector('#form-submit-button').addEventListener('click', () => {
//    let firstName = document.getElementById("fname").value;
//    let lastName = document.getElementById("lname").value;

//    // send username to main.js 
//    ipcRenderer.send('asynchronous-message', 'ping');
// });

// ipcRenderer.on('asynchronous-reply', (event, arg) => {
//    console.log(arg) // prints "pong" in the DevTools console
//    mainResponse.innerHTML = arg;
// })