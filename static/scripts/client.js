// Configurations
const URL = "http://localhost:8080"
const streamConstraints = { audio: true, video: true };

const socket = io(URL); // change this later lmao

const connectedPeers = {}

const loginPanel = document.getElementById("login");
const roomBanner = document.getElementById("roomBanner");
const videoPanel = document.getElementById("videoPanel");
const videoGrid = document.getElementById("videoStreams");

const usernameInput = document.getElementById("username_input");
const roomIdInput = document.getElementById("room_input");
const errorMessageArea = document.getElementById("errorMessage");

const joinRoomButton = document.getElementById("join_room_button");
const createRoomButton = document.getElementById("create_room_button");


joinRoomButton.onclick = e => {
    e.preventDefault();

    let username = usernameInput.value;
    let roomId = roomIdInput.value;
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

// handle disconnects
socket.on("user-disconnected", id => {
    console.log("User disconnected " + id);

    if (connectedPeers[id]) 
        connectedPeers[id].close();
});


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
    })
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
