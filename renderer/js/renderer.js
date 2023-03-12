var mainResponse = document.querySelector('#main-response')
var submitFormButton = document.querySelector("#form-submit-button");


function submitForm(formData){
    console.log("sending")
    window.ipcRenderer.send('asynchronous-message', formData);
}

submitFormButton.addEventListener('click', (event) => {
    event.stopPropagation();

    let firstName = document.getElementById("fname").value;
    let lastName = document.getElementById("lname").value;
    // send data to main.js 
    submitForm([firstName, lastName]) // TODO: figure out why this is firing twice
});

window.ipcRenderer.once('asynchronous-reply', (event, arg) => {
    console.log("receiving") // prints "pong" in the DevTools console
    mainResponse.innerHTML = arg;
})