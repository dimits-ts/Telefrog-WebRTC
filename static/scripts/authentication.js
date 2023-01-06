import {swapPasswordType} from "./modules/presenter.mjs";
import {getSessionId, getUserData, saveSessionId} from "./modules/profile.mjs";

const hostURL = "http://localhost:8080"; // DRY principle at 3 am

const registerForm = document.getElementById("signup-form");
const registerNameField = document.getElementById("signup-username");
const registerPassField = document.getElementById("signup-password");
const registerPassConfirmField = document.getElementById("signup-password-2nd");
const registerBirthdateField = document.getElementById("signup-birthdate");
const registerEmailField = document.getElementById("signup-email");
const registerErrorLabel = document.getElementById("signup-error-label");
const registerButton = document.getElementById("signup-button");
const registerShowPassButton = document.getElementById("signup-show-pass");

const loginForm = document.getElementById("login-form");
const loginNameField = document.getElementById("login-username");
const loginPassField = document.getElementById("login-password");
const loginErrorLabel = document.getElementById("login-error-label");
const loginButton = document.getElementById("login-button");
const loginShowPassButton = document.getElementById("login-show-pass");

const usernameLabel = document.getElementById("profile-username");
const profilePicture = document.getElementById("profile-username");
const updateEmailField = document.getElementById("update-email");
const updateAboutField = document.getElementById("update-about-me");
const updateProfilePicField = document.getElementById("update-profile-pic");
const updateNonupdateAuthContainer = document.getElementById("failed-auth");
const updateAuthContainer = document.getElementById("successful-auth");
const updateButton = document.getElementById("update-button");


// Attempt to load the listeners every time the window changes
window.onload = async () => {
    if (registerButton !== null) {
        registerShowPassButton.onclick = e => {
            swapPasswordType(registerPassField);
            e.preventDefault();
        }

        registerButton.onclick = async e => {
            e.preventDefault();
            await register();
        }
    }

    if (loginButton !== null) {
        loginShowPassButton.onclick = e => {
            e.preventDefault();
            swapPasswordType(loginPassField);
        }

        loginButton.onclick = async e => {
            e.preventDefault();
            await login();
        }
    }

    if (updateButton !== null) {
        await displayProfile();
    }
}

/**
 * Display the page showing the uesr's profile details and allowing their editing.
 */
async function displayProfile() {
    let sessionId = getSessionId("sessionId");
    let userObj = await getUserData(hostURL, sessionId);

    if (userObj === null) {
        createEmptyProfilePage();
    } else {
        createProfilePage(userObj);

        updateButton.onclick = async e => {
            e.preventDefault();
            console.log(sessionId)
            let res = await updateRequest(sessionId);

        }
    }
}

/**
 * Implements the registration procedure for a user.
 */
async function register() {
    checkPasswords();
    checkBirthDate();

    if (checkValidity(registerForm.id)) {
        let res = await registerRequest();

        if (!res.ok) {
            let errorMsg = await res.text();
            showLabel(registerErrorLabel, "Error while signing-up: " + errorMsg);
        } else {
            let resObj = await res.json();
            saveSessionId(resObj);

            hideLabel(registerErrorLabel);
            window.location = "index.html";
        }
    } else {
        registerForm.reportValidity();
    }
}

/**
 * Implements the login procedure for a user.
 */
async function login() {
    if (checkValidity(loginForm.id)) {
        let res = await loginRequest();

        if (!res.ok) {
            let errorMsg = await res.text();
            showLabel(loginErrorLabel, "Error while logging-in: " + errorMsg);
        } else {
            let resObj = await res.json();
            console.log(resObj);
            saveSessionId(resObj);

            hideLabel(loginErrorLabel);
            window.location = "index.html";
        }

    }
}

function checkValidity(formId) {
    let inputs = document.querySelectorAll(`#${formId} input`);

    for (let input of inputs) {
        if (!input.checkValidity()) {
            input.reportValidity();
            return false;
        }
    }
    return true;
}

/**
 * Display an HTML page prompting the user to register or log in.
 */
function createEmptyProfilePage() {
    showLabel(updateNonupdateAuthContainer);
    hideLabel(updateAuthContainer);
}

/**
 * Display a HTML page displaying the user's profile details.
 * @param {obj} userObj the profile's details
 */
function createProfilePage(userObj) {
    profilePicture.src = hostURL + "/media/profiles/" + userObj.username + "/profilePic.png";
    console.log(hostURL + "/media/profiles/" + userObj.username + "/profilePic.png")
    usernameLabel.innerText = userObj.username;
    updateEmailField.value = userObj.email;
    if (userObj.aboutMe === undefined) updateAboutField.value = ""; else updateAboutField.value = userObj.aboutMe;

    showLabel(updateAuthContainer);
    hideLabel(updateNonupdateAuthContainer);
}

/**
 * Send a POST request to the server that updates the user's profile details.
 * @returns a promise containing a response, indicating whether the update was succesful
 */
function updateRequest(sessionId) {
    const formData = new FormData();
    formData.append("sessionId", sessionId);
    formData.append("email", updateEmailField.value);
    formData.append("aboutMe", updateAboutField.value);
    formData.append("profilePic", updateProfilePicField.files[0]);

    return fetch(hostURL + "/user/update", {
        method: "POST", // do not expicitly set content type 
        body: formData
    }).then(res => res.json())

}

/**
 * Send a request to the server that signs a user in.
 * @returns a promise that contains a sessionId or a error when resolved
 */
async function registerRequest() {
    const formData = {
        username: registerNameField.value, password: registerPassField.value, email: registerEmailField.value
    }

    let res = await fetch(hostURL + "/user", {
        method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(formData)
    });

    return res;
}

/**
 * Send a request to the server to authenticate an existing user.
 * @returns a promise that contains a sessionId or a error when resolved
 */
async function loginRequest() {
    const formData = {
        username: loginNameField.value, password: loginPassField.value,
    }

    return fetch(hostURL + "/user/login", {
        method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(formData)
    });
}

/**
 * Display a hidden HTML element.
 * @param {HTMLElement} label the HTML element to be displayed
 * @param {string} message an optional message to be displayed in the element
 */
function showLabel(label, message = null) {
    if (message !== null) label.innerText = message;

    label.style.display = "block";
}

/**
 * Hide a visible HTML element.
 * @param {HTMLElement} label the HTML element to be hidden
 */
function hideLabel(label) {
    label.style.display = "none";
}

/**
 * Checks if the two password fields are equal.
 */
function checkPasswords() {
    let errorMsg = "";

    let password = registerPassField.value;

    if (password !== registerPassConfirmField.value) {
        errorMsg = "Passwords must match";
    }

    registerPassField.setCustomValidity(errorMsg);
    registerPassConfirmField.setCustomValidity(errorMsg);

    return errorMsg === "";
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

    return errorMsg === "";
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
