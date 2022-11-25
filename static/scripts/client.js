import { Presenter } from "./modules/presenter.mjs"
import { Conference } from "./modules/conference.mjs";
import { Chat } from "./modules/chat.mjs";

// Configurations
const hostURL = "http://localhost:8080"
const CHAT_REFRESH_MS = 2000;
const socket = io(hostURL);

// Elements
const joinRoomButton = document.getElementById("join_room_button");
const createRoomButton = document.getElementById("create_room_button");
const sendMessageButton = document.getElementById("sendMessage");

// Globals
const presenter = new Presenter();
const conference = new Conference(socket, presenter);
const chat = new Chat(hostURL, presenter);

// ========== CALL HANDLERS ==========

joinRoomButton.onclick = e => {
    console.log("Sending request to join");

    let username = presenter.getUsername();
    let roomId = presenter.getRoomId();

    if (usernameIsValid(username)) {
        presenter.showInputError("Please enter a valid username.");
    }
    else {
        chat.setUser(username, roomId);
        conference.connect(username, roomId);
    }

    // perioducally refresh chat showing new messages
    // use a lambda for the class context to work
    setInterval(() => chat.refreshChat, CHAT_REFRESH_MS);
    e.preventDefault();
};

createRoomButton.onclick = e => {
    // send to socket
    fetch(hostURL + "/room/create", { method: "GET" })
        .then(res => res.json())
        .then(response => {
            // place the roomId into the room input area
            let roomInput = document.getElementById("room_input");
            roomInput.value = response.room;
        });
    e.preventDefault();
};

// handle disconnect
socket.on("user-disconnected", id => {
    console.log("User disconnected " + id);
    conference.userDisconnected(id);
});


// ========== CHAT HANDLERS ==========


sendMessageButton.addEventListener("click", () => {
    // Send any field that is filled
    let text = presenter.getChatText();
    if (text.trim() !== "") {
        chat.sendText(text);
    }

    for (let image of presenter.getChatImages()) {
        if (image) {
            chat.sendFile(image, "Image");
        }
    }

    for (let file of presenter.getChatFiles()) {
        if (file) {
            chat.sendFile(file, "File");
        }
    }

    presenter.resetChatInputs();
});

function usernameIsValid(username) {
    // check if is whitespace
    return username.trim().length === 0;
}
