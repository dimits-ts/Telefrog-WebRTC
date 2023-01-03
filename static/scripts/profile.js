const hostURL = "http://localhost:8080"; // DRY principle at 3 am

const registerForm = document.getElementById("signup-form");
const registerNameField = document.getElementById("signup-username");
const registerPassField = document.getElementById("signup-password");
const registerPassConfirmField = document.getElementById("signup-password-2nd");
const registerBirthdateField = document.getElementById("signup-birthdate");
const registerEmailField = document.getElementById("signup-email");
const registerErrorLabel = document.getElementById("signup-error-label");
const registerButton = document.getElementById("signup-button");

const loginNameField = document.getElementById("login-username");
const loginPassField = document.getElementById("login-password");
const loginErrorLabel = document.getElementById("login-error-label");
const loginButton = document.getElementById("login-button");

const usernameLabel = document.getElementById("profile-username");
const profilePicture = document.getElementById("profile-username");
const updateEmailField = document.getElementById("update-email");
const updateAboutField = document.getElementById("update-about-me");
const updateProfilePicField = document.getElementById("update-profile-pic");
const updateNonupdateAuthContainer = document.getElementById("failed-auth");
const updateAuthContainer = document.getElementById("successful-auth");


// Attempt to load the listeners every time the window changes
window.onload = () => {
    if (registerButton !== null) {
        registerButton.onclick = async e => {
            e.preventDefault();
            await register();
        }
    }

    if (loginButton !== null) {
        loginButton.onclick = e => {
            e.preventDefault();
            login();
        }
    }

    if (registerButton === null && loginButton === null) {
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
        updateButton.onclick = async function (e) {
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

    if (checkValidity(registerForm.id)) {
        let res = await registerRequest();
        console.log(res);

        if (!res.ok) {
            showLabel(registerErrorLabel, "Error while signing-up: " + res.statusText);
        } else {
            hideLabel(registerErrorLabel);
            console.log(res.body);
            window.localStorage.setItem("sessionId", res.body);
        }

    }
}

/**
 * Implements the login procedure for a user.
 */
async function login() {
    let res = await loginRequest();

    if (!res.ok) {
        showLabel(loginErrorLabel, "Error while logging-in: " + res.body);
    } else {
        hideLabel(loginErrorLabel);
        window.localStorage.setItem("sessionId", res.body);
    }
}

/**
 * Query the server for the user's profile details.
 * @param {string} sessionId the last session ID 
 * @returns a promise containing the profile details or an error when resolved
 */
function getProfileRequest(sessionId) {
    return fetch(hostURL + "/user/" + sessionId, {
        method: "GET",
    }).then(res => res.json())
}

function checkValidity(formId) {
    let inputs = document.querySelectorAll(`#${formId} input`);

    for (let input of inputs) {
        if (!input.checkValidity()) {
            return false;
        }
    }
    return true;
}

/**
 * Display a HTML page prompting the user to register or log in.
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
    profilePicture.src = userObj.profilePic;
    usernameLabel.innerText = userObj.username;
    updateEmailField.value = userObj.email;
    updateAboutField.value = userObj.aboutMe;

    showLabel(updateAuthContainer);
    hideLabel(updateNonupdateAuthContainer);
}


/**
 * Send a POST request to the server that updates the user's profile details.
 * @returns a promise containing a response, indicating whether the update was succesfull
 */
function updateRequest() {
    const formData = new FormData();
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
        username: registerNameField.value,
        password: registerPassField.value,
        email: registerEmailField.value
    }

    let res = await fetch(hostURL + "/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
    });

    return res;
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
 * Display a hidden HTML element.
 * @param {HTMLElement} label the HTML element to be displayed 
 * @param {string} message an optional message to be displayed in the element 
 */
function showLabel(label, message = null) {
    if (message !== null)
        label.innerText = message;

    label.style.visibility = "visible";
}

/**
 * Hide a visible HTML element.
 * @param {HTMLElement} label the HTML element to be hidden
 */
function hideLabel(label) {
    label.style.visibility = "hidden";
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
