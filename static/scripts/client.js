// Configurations
const URL = "http://localhost:8080"
const streamConstraints = { audio: true, video: true };
const CHAT_REFRESH_MS = 500;

const socket = io(URL);
const connectedPeers = {};

// elements
const loginPanel = document.getElementById("login");
const roomBanner = document.getElementById("roomBanner");
const videoPanel = document.getElementById("videoPanel");
const videoGrid = document.getElementById("videoStreams");

const usernameInput = document.getElementById("username_input");
const roomIdInput = document.getElementById("room_input");
const errorMessageArea = document.getElementById("errorMessage");

const chatInput = document.getElementById("chat-input");
const fileInput = document.getElementById("file-input");
const imageInput = document.getElementById("image-input");
const sendMessageButton = document.getElementById("sendMessage");

const joinRoomButton = document.getElementById("join_room_button");
const createRoomButton = document.getElementById("create_room_button");

// globals
const chat = new Chat();
let roomId;
let username;

/**
 *  A class containing the chat messages and displaying new ones to
 *  the HTML chatbox.
 */ 
class Chat {
    static NO_MESSAGES_ID = "";
    #messages = []

    getLastMessageId() {
        if (this.messages.length == 0) {
            return NO_MESSAGES_ID;
        } else {
            return this.messages[this.messages.length - 1];
        }
    }

    addMessage(message) {
        let username = message.username;
        let type = message.type;

        this.messages.append(message);

        if(type === "Text"){
            this.#addTextToChat(username, message.content);
        } else if (type === "Image") {
            this.#addImageToChat(username, message);
        } else if (type === "File") {
            this.#addFileToChat(username, message);
        } else {
            throw("Invalid message type " + type);
        }
    }

    #addTextToChat(username, text) {
        console.log(username, text);
    }
    
    #addImageToChat(username, image) {
        console.log(username, image);
    }
    
    #addFileToChat(username, file) {
        console.log(username, file);
    }
}


// ========== CALL HANDLERS ==========

joinRoomButton.onclick = e => {
    e.preventDefault();

    username = usernameInput.value;
    roomId = roomIdInput.value;
    console.log("Sending request to join");

    const myVideo = document.createElement("video");
    myVideo.muted = true;

    if (usernameIsValid(username))
        showError("Please enter a valid username.");
    else
        //begin streaming
        connectVideo(username, roomId, myVideo);
};

createRoomButton.onclick = e => {
    e.preventDefault();

    // send to socket
    fetch(URL + "/room/create", { method: "GET" })
        .then(res => res.json())
        .then(response => {
            // place the roomId into the room input area
            let roomInput = document.getElementById("room_input");
            roomInput.value = response.room;
        });
};

// handle disconnect
socket.on("user-disconnected", id => {
    console.log("User disconnected " + id);

    if (connectedPeers[id])
        connectedPeers[id].close();
});

// ========== CHAT HANDLERS ==========

sendMessageButton.addEventListener("click", () => {
    // Send any field that is filled
    text = chatInput.value;
    if (text.trim() !== "")
        sendText(text);


    for (image of imageInput.files)
        if (image)
            sendImage(image);

    for (file of fileInput.files)
        if (file)
            sendFile(file)

    // reset input
    chatInput.value = "";
    imageInput.value = "";
    fileInput.value = "";
});

// perioducally refresh chat showing new messages
timedLoop(CHAT_REFRESH_MS, refreshChat);


function refreshChat() {
    console.log("Refreshing chat");

    const data = new FormData();
    data.append("room_id", roomId);
    data.append("last_message", chat.getLastMessageId());

    fetch(URL + "/chat-box/refresh", {
        method: "GET",
        body: data
    }).then(res => res.json())
        .then(list => {
            // if no new messages nothing will happen
            for (message of list) {
                chat.addMessage(message);
            }
        });
}

function usernameIsValid(username) {
    // check if is whitespace
    return username.trim().length === 0;
}


function showError(errorMessage) {
    errorMessageArea.innerText = errorMessage;
}


function onConnect(roomId) {
    errorMessageArea.innerText = "";
    loginPanel.style.display = "none";
    roomBanner.innerText = "You are connected to room " + roomId;
}


function connectVideo(username, roomId, video) {
    let myPeer = new Peer(undefined, {
        host: "/",
        port: "3001"
    });

    myPeer.on("open", peerId => {
        console.log("Opened on peer server, sending join request to server");
        message = {
            username: username,
            room: roomId,
            peer: peerId
        };

        navigator.mediaDevices.getUserMedia(streamConstraints)
            .then(stream => {
                // request session from server
                socket.emit("join", message);

                // receive session status from server
                socket.on("join-status", (statusCode, statusMessage) => {
                    if (statusCode === 200) {
                        onConnect(roomId);

                        // set up video streams
                        addVideoStream(video, stream);
                        videoPanel.style.visibility = "visible";

                        // set up call
                        myPeer.on("call", call => {
                            // listen to incoming streams
                            console.log("called");
                            call.answer(stream);

                            // respond to incoming streams
                            const video = document.createElement("video");
                            call.on("stream", userVideoStream => {
                                addVideoStream(video, userVideoStream);
                            });
                        });

                        // when other user connects
                        socket.on("user-connected", (username, peer) => {
                            connectToNewUser(myPeer, peer, stream)
                        });
                    } else {
                        showError("Cannot join room " + statusCode + ": " + statusMessage);
                    }
                });

            }).catch(err => {
                showError("Error while accessing media devices: " + err);
            });
    });
}


function addVideoStream(video, stream) {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play();
    });
    videoGrid.append(video);
}


function connectToNewUser(myPeer, userId, stream) {
    console.log(`attempt to call user ${userId}`);
    const call = myPeer.call(userId, stream);
    const video = document.createElement("video");

    call.on("stream", userVideoStream => {
        console.log("Got stream from " + userId);
        addVideoStream(video, userVideoStream);
    });

    call.on("close", () => {
        video.remove();
    });

    // update connected users
    connectedPeers[userId] = call;
}

function sendText(text) {
    const data = new FormData();
    data.append("room_id", roomId);
    data.append("username", username);
    data.append("message_type", "Text");
    data.append("content", text);

    fetch(URL + "/message/new", {
        method: "POST",
        body: data
    }).then(response => {
        // TODO: React to response
    });
    console.log("Sent text : " + text);
}


function sendImage(image) {
    const data = new FormData();
    data.append("room_id", roomId);
    data.append("username", username);
    data.append("message_type", "Image");
    data.append("content", JSON.stringify(image));

    fetch(URL + "/message/new", {
        method: "POST",
        body: data
    }).then(response => {
        // TODO: React to response
    });

    console.log(image);
}


function sendFile(file) {
    const data = new FormData();
    data.append("room_id", roomId);
    data.append("username", username);
    data.append("message_type", "File");
    data.append("content", JSON.stringify(file));

    fetch(URL + "/message/new", {
        method: "POST",
        body: data
    }).then(response => {
        // TODO: React to response
    });

    console.log(image);
}