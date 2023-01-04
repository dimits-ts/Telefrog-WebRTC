import { Presenter } from "./modules/presenter.mjs"
import { Conference } from "./modules/conference.mjs";
import { Chat } from "./modules/chat.mjs";
import { getUserData, resetSessionId, getSessionId } from "./modules/profile.mjs";

// Configurations
const hostURL = "http://localhost:8080"
const CHAT_REFRESH_MS = 500;
const socket = io(hostURL);

// Elements
const joinRoomButton = document.getElementById("join_room_button");
const createRoomButton = document.getElementById("create_room_button");
const sendMessageButton = document.getElementById("sendMessage");
const chatBox = document.getElementById("chat-display");
const loggedInContainer = document.getElementById("logged-in");
const standardLoginContainer = document.getElementById("standard-login");
const profileTemplate = document.getElementById("profile-template");

// Globals
const presenter = new Presenter();
const conference = new Conference(socket, presenter);
const chat = new Chat(chatBox, hostURL, presenter);
let login = true;
// define as global because its also used in #joinRoom()
let userObj = null;

userObj = await getUserData(hostURL, getSessionId()) // how could this possibly go wrong
if (userObj === null)
    createStandardLoginContainer();
else
    createLoggedInContainer(userObj.username);


// Events
joinRoomButton.onclick = joinRoom;
createRoomButton.onclick = createRoom;
sendMessageButton.onclick = sendMessage;

window.addEventListener("keypress", event => {
    if (event.key === "Enter") {
        event.preventDefault();

        if (login)
            joinRoomButton.click();
        else
            sendMessageButton.click();
    }
});


// ========== CALL HANDLERS ==========

async function joinRoom(e) {
    console.log("Sending request to join");

    let username = presenter.getUsername();

    if (userObj !== null) {
        username = userObj.username;
    }

    let roomId = presenter.getRoomId();

    if (usernameIsValid(username)) {
        presenter.showInputError("Please enter a valid username.");
    } else {
        login = false;
        chat.setUser(username, roomId);
        conference.connect(username, roomId);
    }

    // periodically refresh chat showing new messages
    // use a lambda for the class context to work
    setInterval(() => chat.refreshChat(), CHAT_REFRESH_MS);
    e.preventDefault();
}

function createRoom(e) {
    // send to socket
    fetch(hostURL + "/room/create", { method: "GET" })
        .then(res => res.json())
        .then(response => {
            // place the roomId into the room input area
            let roomInput = document.getElementById("room_input");
            roomInput.value = response.room;
        });
    e.preventDefault();
}


// ========== CHAT HANDLERS ==========

function sendMessage() {
    // Send any field that is filled
    let text = presenter.getChatText();
    if (text.trim() !== "") {
        chat.sendText(text);
    }

    for (let file of presenter.getChatFiles()) {
        if (file) {
            chat.sendFile(file, "File");
        }
    }

    presenter.resetChatInputs();
}

// ========== GENERAL HANDLERS ==========

/**
 * Used in link HTML element used in loggedinContainer.  
 */
async function logout() {
    await fetch(this.hostURL + "/user/logout", {
        method: "POST",
        body: getSessionId()
    });
    resetSessionId("sessionId");
}

function createStandardLoginContainer() {
    standardLoginContainer.style.display = "visible";
    loggedInContainer.style.display = "none";
}

function createLoggedInContainer(username) {
    let compiledTemplate = Handlebars.compile(profileTemplate.textContent);
    let html = compiledTemplate({ username: username });
    loggedInContainer.innerHTML = html;

    standardLoginContainer.style.display = "none";
    loggedInContainer.style.display = "visible";
}

function usernameIsValid(username) {
    // check if is whitespace
    return username.trim().length === 0;
}
