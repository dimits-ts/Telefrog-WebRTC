import { Presenter } from "./modules/presenter.mjs"
import { Conference } from "./modules/conference.mjs";
import { Chat } from "./modules/chat.mjs";
import { resetSessionId, getSessionId, ProfileManager } from "./modules/profile.mjs";


class ParticipantList {
    #participants = [];
    #profileManager;

    constructor(profileManager) {
        this.#profileManager = profileManager;
    }

    updateParticipants(participantsList) {
        if(!this.#participantsChanged(participantsList)){
            this.#participants = participantsList;
            this.#displayParticipants();
        }
    }

    #formatParticipants() {
        const participants = []

        for(let username of this.#participants) {
            const profilePic = this.#profileManager.getProfilePic(username);
            participants.push({username: username, profilePic: profilePic});
        }
        
        return {participants: participants}
    }

    #displayParticipants() {
        const compiledTemplate = Handlebars.compile(participantsTemplate.textContent);
        const html = compiledTemplate(this.#formatParticipants());
        participantsContainer.innerHTML = html;
    }

    #participantsChanged(newParticipants) {
        return Array.isArray(newParticipants) &&
        newParticipants.length === this.#participants.length &&
        newParticipants.every((val, index) => val === this.#participants[index]);
    }
}

// Configurations
const hostURL = "http://localhost:8080"
const CHAT_REFRESH_MS = 500;
const PARTICIPANT_REFRESH_MS = 500;
const socket = io(hostURL);

// Elements
const joinRoomButton = document.getElementById("join_room_button");
const createRoomButton = document.getElementById("create_room_button");
const sendMessageButton = document.getElementById("sendMessage");
const chatBox = document.getElementById("chat-display");
const loggedInContainer = document.getElementById("logged-in");
const standardLoginContainer = document.getElementById("standard-login");
const profileTemplate = document.getElementById("profile-template");
const participantsContainer = document.getElementById("participants-container");
const participantsTemplate = document.getElementById("participants-template");

// Globals
const profileManager = new ProfileManager(hostURL);
const participantList = new ParticipantList(profileManager);
const presenter = new Presenter();
const conference = new Conference(socket, presenter);
const chat = new Chat(chatBox, hostURL, presenter, profileManager);

let login = true;

// define as global because its also used in #joinRoom()
let userObj = await profileManager.getUserData(getSessionId()) // how could this possibly go wrong

// UI
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
    let successCallback = () => {
        chat.setUser(username, roomId);
        // periodically refresh chat showing new messages
        // use a lambda for the class context to work
        setInterval(() => chat.refreshChat(), CHAT_REFRESH_MS);

        /* 
         * Unfortunately the libraries we used and our media server don't 
         * carry custom information so we needed to implement this separately.
         * Also arrow function because else something internal breaks.
         */
        setInterval(() => getParticipants(roomId), PARTICIPANT_REFRESH_MS);
    }

    if (!usernameIsValid(username)) {
        presenter.showInputError("Please enter a valid username.");
    } else {
        login = false;
        conference.connect(username, roomId, successCallback);
    }

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

async function getParticipants(roomId) {
    const res = await fetch(`${hostURL}/participants/${roomId}`);
    if(res.ok) {
        const participants = await res.json();
        console.log(participants);
        participantList.updateParticipants(participants);
    }
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
    let sessionId = getSessionId();
    resetSessionId();

    await fetch(this.hostURL + "/user/logout", {
        method: "POST",
        body: sessionId
    });
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

    const signOutButton = document.getElementById("sign-out");
    signOutButton.onclick = logout;
}

function usernameIsValid(username) {
    // check if is whitespace
    return username.trim().length !== 0;
}
