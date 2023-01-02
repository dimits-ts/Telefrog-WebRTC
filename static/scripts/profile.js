const { register } = require("ts-node");

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


// Attempt to load the listeners every time the window changes
window.onload = () => {
    if (signUpButton !== null) {
        signUpButton.onclick = e => {
            e.preventDefault();
            register();
        }
    }

    if (loginButton !== null) {
        loginButton.onclick = e => {
            e.preventDefault();
            login();
        }
    }

    if (signUpButton === null && loginButton === null) {
        displayProfile(window.localStorage.getItem("sessionId"));
    }
}

/**
 * Display the page showing the uesr's profile details and allowing their editing.
 * @param {string} sessionId the last session ID
 */
async function displayProfile(sessionId) {
    let response = await getProfileRequest(sessionId);

    if (!response.ok) {
        createEmptyProfilePage();
    } else {
        createProfilePage(response.body);

        const updateButton = document.getElementById("update-button");
        updateButton.onclick = e => async function(res) {
            e.preventDefault();
            let res = await updateRequest();

        }
    }
}

/**
 * Implements the registration procedure for a user.
 */
async function register() {
    checkPasswords();
    checkBirthDate();

    if (registerForm.checkValidity()) {
        let res = await registerRequest();

        if (!res.ok)
            alert("Error while signing-up: " + res.body)
        else
            window.localStorage.setItem("sessionId", res.body); //TODO: see what object is returned by the server
    }
}

/**
 * Implements the login procedure for a user.
 */
async function login() {
    let res = await loginRequest();

    if (!res.ok) 
        alert("Error while logging-in: " + res.body)
    else 
        window.localStorage.setItem("sessionId", res.body); //TODO: see what object is returned by the server
}

/**
 * Query the server for the user's profile details.
 * @param {string} sessionId the last session ID 
 * @returns a promise containing the profile details or an error when resolved
 */
function getProfileRequest(sessionId) {
    const formData = { sessionId: sessionId }

    return fetch(hostURL + "/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
    }).then(res => res.json())
}


/**
 * Display a HTML page prompting the user to register or log in.
 */
function createEmptyProfilePage() {
    const nonAuthContainer = document.getElementById("failed-auth");
    const authContainer = document.getElementById("successful-auth");

    nonAuthContainer.style.visibility = "visible";
    authContainer.style.visibility = "hidden";
}


/**
 * Display a HTML page displaying the user's profile details.
 * @param {obj} userObj the profile's details 
 */
function createProfilePage(userObj) {
    const TEMPLATE = document.getElementById("profile-template");
    let compiledTemplate = Handlebars.compile(TEMPLATE.textContent);
    let html = compiledTemplate(userObj);

    const CONTAINER = document.getElementById("profile-container");
    CONTAINER.innerHTML = html;
}


/**
 * Send a POST request to the server that updates the user's profile details.
 * @returns a promise containing a response, indicating whether the update was succesfull
 */
function updateRequest() {
    const updateEmailField = document.getElementById("update-email");
    const updateAboutField = document.getElementById("update-about-me");
    const updateProfilePicField = document.getElementById("update-profile-pic");

    const formData = new FormData();
    formData.append("email", updateEmailField.value);
    formData.append("aboutMe", updateAboutField.value);
    formData.append("profilePic", updateProfilePicField.files[0])

    return fetch(hostURL + "/user/update", {
        method: "POST", // do not expicitly set content type 
        body: formData
    }).then(res => res.json())

}

/**
 * Send a request to the server that signs a user in.
 * @returns a promise that contains a sessionId or a error when resolved
 */
function registerRequest() {
    const formData = {
        username: registerNameField.value,
        password: registerPassField.value,
        email: registerEmailField.value
    }

    return fetch(hostURL + "/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
    }).then(res => res.json());
}

/**
 * Send a request to the server to authenticate an existing user.
 * @returns a promise that contains a sessionId or a error when resolved
 */
function loginRequest() {
    const formData = {
        username: loginNameField.value,
        password: loginPassField.value,
    }

    return fetch(hostURL + "/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
    }).then(res => res.json());
}

/**
 * Checks if the two password fields are equal.
 */
function checkPasswords() {
    let errorMsg = "";

    if (registerPassField.value !== registerPassConfirmField.value) {
        errorMsg = "Passwords must match";
    }

    registerPassField.setCustomValidity(errorMsg);
    registerPassConfirmField.setCustomValidity(errorMsg);
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
