/**
 *  A class containing the chat messages and displaying new ones to
 *  the HTML chatbox.
 */
class Chat {
    static NO_MESSAGES_ID = "";

    #username;
    #roomId;
    #messages;
    #presenter;

    /**
     * Constructs an object that posts and receives posts from the server.
     * @param {DocumentProxy} presenter - The presenter for the HTML page 
     */
    constructor(presenter) {
        this.#messages = [];
        this.#presenter = presenter;
    }

    /**
     * Set the details of the user representing the client, in order to 
     * @param {string} username - The username of the client
     * @param {string} roomId - The current room's Id 
     */
    setUser(username, roomId) {
        this.#username = username;
        this.#roomId = roomId;
    }

    /**
     * Send a file or image to the server.
     * @param {URI} URI - The file's URI
     * @param {string} type - "Image" or "File"
     * @throws {Error} if the posting user hasn't been set
     */
    sendFile(URI, type) {
        let image = new File([URI], URI.name, { type: URI.type, message_type: type });
        console.log(URI);
        this.#sendMessage("multipart/form-data", type, image);
    }

    /**
     * Send a text message to the server.
     * @param {string} text - The text to be sent 
     * @throws {Error} if the posting user hasn't been set
     */
    sendText(text) {
        this.#sendMessage("", "Text", text);
    }

    /**
     * Display any new posted messages to the chat box.
     */
    refreshChat() {
        let url = new URL(hostURL + "/chat-box/refresh");

        url.search = new URLSearchParams({
            room_id: this.#roomId,
            last_message: this.#getLastMessageId()
        });

        fetch(url, { method: "GET" })
            .then(res => res.json())
            .then(list => {
                console.log(list);
                // if no new messages nothing will happen
                for (message of list) {
                    this.#addMessage(message);
                }
            });
    }

    /**
     * Get the id of the last received message.
     * @returns the id of the last received message or a sentinel if no received messages
     */
    #getLastMessageId() {
        if (this.#messages.length == 0) {
            return Chat.NO_MESSAGES_ID;
        } else {
            return this.#messages[this.#messages.length - 1].message_id;
        }
    }

    /**
     * Send a new message to the server.
     * @param {string} encoding - The fetch's POST encoding type (multimedia for files/images or 
     * text/simple for text) 
     * @param {string} type - One of the TEXT/IMAGE/FILE types 
     * @param {any} content - The contents of the message 
     */
    #sendMessage(encoding, type, content) {
        if(this.#username === undefined || this.#roomId === undefined) {
            throw new Error("Chat user has not been set");
        }

        const headers = {
            'enctype': encoding
        }

        const data = new FormData();
        data.append("room_id", this.#roomId);
        data.append("username", this.#username);
        data.append("message_type", type);
        data.append("content", content);

        fetch(hostURL + "/chat-box/message/new", {
            method: "POST",
            headers: headers,
            body: data
        }).then(response => {
            if (!response.ok) {
                presenter.showGeneralError("An error occured while sending the message to the server");
                console.log("Error while sending message : " + response.text);
            }
        });
        console.log("Sent message : ");
        console.log(data);
    }


    /**
     * Display a message in the chat box.
     * @param {Message} message - The message to be displayed
     * @throws if the message's type is invalid
     */
    #addMessage(message) {
        let username = message.username;
        let type = message.message_type;

        this.#messages.push(message);

        if (type === "Text") {
            this.#addTextToChat(username, message.content);
        } else if (type === "Image") {
            this.#addImageToChat(username, message);
        } else if (type === "File") {
            this.#addFileToChat(username, message);
        } else {
            throw ("Invalid message type " + type);
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

/**
 * A class managing the connections and streams between the conference's participants
 * on the client side.
 */
class Conference {
    static STREAM_CONSTRAINTS = { audio: true, video: true };
    static PEER_SERVER_CONFIG = { host: "/", port: "3001" };

    #presenter;
    #connectedPeers;

    /**
     * Initialize the data structures before establishing connection to remote server.
     * @param {DocumentProxy} presenter - The proxy object for the current HTML page 
     */
    constructor(presenter) {
        this.#presenter = presenter;
        this.#connectedPeers = {};
    }

    /**
     * Starts a stream with the user himself, and receives the streams of all other people in the room.
     * @param {string} username - The name of the user attempting the connection 
     * @param {string} roomId - The ID of the room to be connected to
     */
    connect(username, roomId) {
        let myPeer = new Peer(undefined, Conference.PEER_SERVER_CONFIG);

        // Could have extracted the parameters from the presenter but its clearer to 
        // explicitly ask for them in the method
        myPeer.on("open", peerId => {
            console.log("Opened on peer server, sending join request to server");
            let message = {
                username: username,
                room: roomId,
                peer: peerId
            };

            this.#setUpStream(myPeer, message);
        });
    }

    /**
     * Remove the display of a disconnected user. 
     * @param {string} userId - The disconnected user's ID 
     */
    userDisconnected(userId) {
        if (this.#connectedPeers[userId])
            this.#connectedPeers[userId].close();
    }

    /**
     * Start streaming self and configure the peer server as to receive and send video.
     * @param {Peer} myPeer - The user's peer server
     * @param {any} message - A message object as defined by Docs.md
     */
    #setUpStream(myPeer, message) {
        let myVideo = document.createElement("video");
        myVideo.muted = true;

        navigator.mediaDevices.getUserMedia(Conference.STREAM_CONSTRAINTS)
            .then(stream => {
                // request session from server
                socket.emit("join", message);

                // receive session status from server
                socket.on("join-status", (statusCode, statusMessage) => {
                    if (statusCode === 200) {
                        this.#presenter.showConnected("Connected to room " + presenter.getRoomId());

                        // set up video streams
                        this.#addVideoStream(myVideo, stream);

                        // set up call
                        myPeer.on("call", call => {
                            // listen to incoming streams
                            console.log("called");
                            call.answer(stream);

                            // respond to incoming streams
                            const video = document.createElement("video");
                            call.on("stream", userVideoStream => {
                                this.#addVideoStream(video, userVideoStream);
                            });
                        });

                        // when other user connects
                        socket.on("user-connected", (username, peer) => {
                            this.#connectToNewUser(peer, stream);
                        });
                    } else {
                        this.#presenter.showInputError("Cannot join room : " + statusMessage);
                    }
                });

            }).catch(err => {
                this.#presenter.showInputError("Error while accessing media devices: " + err);
            });
    }

    /**
     * Establish a new stream on the user's screen.
     * @param {Peer} newPeer the connecting peer server
     * @param {string} userId the connecting user's id
     * @param {MediaSession} stream the connecting user's stream
     */
    #connectToNewUser(newPeer, userId, stream) {
        console.log(`Attempt to call user ${userId}`);
        const call = newPeer.call(userId, stream);
        const video = document.createElement("video");

        call.on("stream", userVideoStream => {
            console.log("Got stream from " + userId);
            this.#addVideoStream(video, userVideoStream);
        });

        call.on("close", () => {
            video.remove();
        });

        // update connected users
        this.#connectedPeers[userId] = call;
    }

    /**
     * Add a new video element along with its corresponding media stream to the screen.
     * @param {HTMLElement} video - The video element
     * @param {MediaSession} stream - The corresponding media stream
     */
    #addVideoStream(video, stream) {
        this.#presenter.addVideoElement(video, stream);
    }
}

/**
 * A class that acts as a presenter between the HTML page and the client logic.
 */
class DocumentProxy {
    //TODO: move getUsername and getRoomId somewhere else

    #loginPanel = document.getElementById("login");
    #roomBanner = document.getElementById("roomBanner");
    #videoGrid = document.getElementById("videoStreams");

    #usernameInput = document.getElementById("username_input");
    #roomIdInput = document.getElementById("room_input");
    #errorMessageArea = document.getElementById("errorMessage");

    #chatInput = document.getElementById("chat-input");
    #fileInput = document.getElementById("file-input");
    #imageInput = document.getElementById("image-input");

    #videoPanel = document.getElementById("videoPanel");

    /**
     * Display a message to the user on connection and switch to room view.
     * @param {string} connectMessage - The message to be displayed.
     */
    showConnected(connectMessage) {
        // displays a permanent banner
        this.#errorMessageArea.innerText = "";
        this.#loginPanel.style.display = "none";
        this.#roomBanner.innerText = connectMessage;
        this.#videoPanel.style.visibility = "visible";
    }

    /**
     * Show an error to the user before he has connected to a room. 
     * @param {string} errorMessage - The message to be displayed.
     */
    showInputError(errorMessage) {
        this.#errorMessageArea.innerText = errorMessage;
    }

    /**
    * Add a new video element along with its corresponding media stream to the screen.
    * @param {HTMLElement} video - The video element
    * @param {MediaSession} stream - The corresponding media stream
    */
    addVideoElement(video, stream) {
        video.srcObject = stream;
        video.addEventListener("loadedmetadata", () => {
            video.play();
        });
        this.#videoGrid.append(video);
    }

    /**
     * Display a general error message.
     * @param {string} errorMessage - The message to be displayed 
     */
    showGeneralError(errorMessage) {
        alert(errorMessage);
    }

    getUsername() { return this.#usernameInput.value; }

    getRoomId() { return this.#roomIdInput.value; }

    getChatText() { return this.#chatInput.value; }

    getChatImages() { return this.#imageInput.files; }

    getChatFiles() { return this.#fileInput.files; }

    /**
     * Clear all chat inputs.
     */
    resetChatInputs() {
        this.#chatInput.value = "";
        this.#imageInput.value = "";
        this.#fileInput.value = "";
    }

}

// Configurations
const hostURL = "http://localhost:8080"
const CHAT_REFRESH_MS = 2000;

const socket = io(hostURL);

// elements
const joinRoomButton = document.getElementById("join_room_button");
const createRoomButton = document.getElementById("create_room_button");
const sendMessageButton = document.getElementById("sendMessage");

// globals
const presenter = new DocumentProxy();
const conference = new Conference(presenter);
const chat = new Chat(presenter);

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
    text = presenter.getChatText();
    if (text.trim() !== "") {
        chat.sendText(text);
    }

    for (image of presenter.getChatImages()) {
        if (image) {
            chat.sendFile(image, "Image");
        }
    }

    for (file of presenter.getChatFiles()) {
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
