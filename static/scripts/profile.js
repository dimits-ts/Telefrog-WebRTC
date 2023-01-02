const hostURL = "http://localhost:8080"; // DRY principle at 3 am

const registerForm = document.getElementById("signup-form");
const registerNameField = document.getElementById("signup-username");
const registerPassField = document.getElementById("signup-password");
const registerPassConfirmField = document.getElementById("signup-password-2nd");
const registerBirthdateField = document.getElementById("signup-birthdate");
const registerEmailField = document.getElementById("signup-email");
const signUpButton = document.getElementById("signup-button");

const loginNameField = document.getElementById("login-username");
const loginPassField = document.getElementById("login-password");
const loginButton = document.getElementById("login-button");

let userObj = null;

// Attempt to load the listeners every time the window changes
window.onload = () => {
    if(signUpButton !== null){
        console.log("loaded sign up");
        signUpButton.onclick = e => {
            e.preventDefault();
        
            checkPasswords();
            checkBirthDate();
        
            if (registerForm.checkValidity()) {
                registerRequest();
            }
        }
    }
    
    if(loginButton !== null) {
        console.log("loaded login");
        loginButton.onclick = e => {
            e.preventDefault();
            loginRequest();
        }
    }
}



function registerRequest() {
    const formData = {
        username: registerNameField.value,
        password: registerPassField.value,
        email: registerEmailField.value
    }

    fetch(hostURL + "/user/register", { //TODO: get URL
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
    }).then(res => res.json()).then(res => {
        if(!res.ok) {
            alert("Error while signing-up: " + res.body)
        } else {
            userObj = res.body; //TODO: see what object is returned by the server
        }
    })
}

function loginRequest() {
    const formData = {
        username: registerNameField.value,
        password: registerPassField.value,
        email: registerEmailField.value
    }

    fetch(hostURL + "/user/login", { //TODO: get URL
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
    }).then(res => res.json()).then(res => {
        if(!res.ok) {
            alert("Error while logging-in: " + res.body)
        } else {
            userObj = res.body; //TODO: see what object is returned by the server
        }
    })
}

/**
 * Checks if the two password fields are equal.
 */
function checkPasswords() {
    let errorMsg = "";

    if (passwordField.value !== passwordConfirmField.value) {
        errorMsg = "Passwords must match";
    }

    passwordField.setCustomValidity(errorMsg);
    passwordConfirmField.setCustomValidity(errorMsg);
}

/**
 * Checks if the birthdate isn't after the current date or the signee is under 18 yo.
 */
function checkBirthDate() {
    let birthdate = new Date(registerBirthdateField.value);
    let todaysDate = new Date();
    let errorMsg = "";

    if (birthdate >= todaysDate) {
        errorMsg = "Please enter a valid date";
    } else if (calculateAge(birthdate) < 18) {
        errorMsg = "You have to be 18+ to register"
    }

    registerBirthdateField.setCustomValidity(errorMsg);
}

/**
 * Calculate the age of a person based on their birthday.
 * @param {Date} birthday the person's birthday  
 * @returns the age of the person in years
 */
function calculateAge(birthday) {
    let ageDifMs = Date.now() - birthday;
    let ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}
