import { Presenter } from "./modules/presenter.mjs"
import { Conference } from "./modules/conference.mjs";
import { Chat } from "./modules/chat.mjs";
import { resetSessionId, getSessionId, ProfileManager } from "./modules/profile.mjs";


/**
 * A class handling the current participant list 
 */
class ParticipantList {
    #participants = [];
    #profileManager;

    /**
     * Build a new participant list manager
     * @param {ProfileManager} profileManager a manager capable of fetching profile pictures
     */
    constructor(profileManager) {
        this.#profileManager = profileManager;
    }

    /**
     * Update the UI with the current participants.
     * @param {[obj]} participantsList a list containing the usernames of all current participants
     */
    updateParticipants(participantsList) {
        if (!this.#participantsSame(participantsList)) {
            this.#participants = participantsList;
            this.#displayParticipants();
            this.#updateParticipantLabels();
        }
    }

    /**
     * Get a Handlebars-template-compatible object detailing all participants. 
     * @returns an object containing the usernames and profile pics of all participants
     */
    #formatParticipants() {
        const participants = []

        for (let username of this.#participants) {
            const profilePic = this.#profileManager.getProfilePic(username);
            participants.push({ username: username, profilePic: profilePic });
        }

        return { participants: participants }
    }

    /**
     * Display the current participants to the UI.
     */
    #displayParticipants() {
        const compiledTemplate = Handlebars.compile(participantsTemplate.textContent);
        const html = compiledTemplate(this.#formatParticipants());
        participantsContainer.innerHTML = html;
    }

    /**
     * Check if the new participant list is different than the last one.
     * @param {[obj]} newParticipants an array of all current participants
     * @returns true if the participants haven't changed
     */
    #participantsSame(newParticipants) {
        return Array.isArray(newParticipants) &&
            newParticipants.length === this.#participants.length &&
            newParticipants.every((val, index) => val === this.#participants[index]);
    }

    /**
     * Update the participants' stream labels.
     */
    #updateParticipantLabels() {
        const labels = document.querySelectorAll(".stream-username-label");

        // wait for a disconnect to be handled before changing the labels
        if(labels.length === this.#participants.length) {
            for (let i = 0; i < labels.length; i++) {
                labels[i].innerText = this.#participants[i];
            }
        }
    }
}

// Configurations
const hostURL = "http://localhost:8080"
const CHAT_REFRESH_MS = 500;
const PARTICIPANT_REFRESH_MS = 400;
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

/**
 * Begin the procedure of joining an existing room. Activates stream, chat and 
 * the participant list observer.
 * @param {Event} e the click event
 */
async function joinRoom(e) {
    console.log("Sending request to join");

    let username = presenter.getUsername().trim();
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

/**
 * Instruct the server to create a new room and paste its ID in the room HTML element.
 * @param {Event} e the click event
 */
function createRoom(e) {
    // send to socket
    fetch(hostURL + "/room/create", { method: "GET" })
        .then(res => res.json())
        .then(response => {
            // place the roomId into the room input area
            const roomInput = document.getElementById("room_input");
            roomInput.value = response.room;
        });
    e.preventDefault();
}

/**
 * Get a list of all current participants from the server.
 * @param {string} roomId the current room id
 */
async function getParticipants(roomId) {
    const res = await fetch(`${hostURL}/participants/${roomId}`);
    if (res.ok) {
        const participants = await res.json();
        participantList.updateParticipants(participants);
    }
}


// ========== CHAT HANDLERS ==========

/**
 * Send a message to the chat.
 */
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

/**
 * Called to expose the user to the login UI if he is NOT currently logged in.
 */
function createStandardLoginContainer() {
    standardLoginContainer.style.display = "block";
    loggedInContainer.style.display = "none";
}

/**
 * Called to expose the user to the login UI if he is currently logged in.
 * @param {string} username the user's name
 */
function createLoggedInContainer(username) {
    let compiledTemplate = Handlebars.compile(profileTemplate.textContent);
    let html = compiledTemplate({ username: username });
    loggedInContainer.innerHTML = html;

    standardLoginContainer.style.display = "none";
    loggedInContainer.style.display = "flex";

    const signOutButton = document.getElementById("sign-out");
    signOutButton.onclick = logout;
}


function usernameIsValid(username) {
    // check if is whitespace
    return username.trim().length !== 0;
}
