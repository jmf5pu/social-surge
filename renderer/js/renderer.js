var mainResponse = document.querySelector('#main-response')

function submitForm(formData){
    window.ipcRenderer.send('asynchronous-message', formData);
}

document.querySelector('#form-submit-button').addEventListener('click', () => {
    let firstName = document.getElementById("fname").value;
    let lastName = document.getElementById("lname").value;

    // send data to main.js 
    submitForm([firstName, lastName]) // TODO: figure out why this is firing twice
});


window.ipcRenderer.on('asynchronous-reply', (event, arg) => {
    console.log(arg) // prints "pong" in the DevTools console
    mainResponse.innerHTML = arg;
})