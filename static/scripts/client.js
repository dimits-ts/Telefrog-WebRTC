// Configurations
const URL = "http://localhost:8080"
const streamConstraints = {audio: true, video: true};

const socket = io(URL); // change this later lmao

const connectedPeers = {}

function connectVideo(username, roomId, videoGrid, video){
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
            addVideoStream(videoGrid, video, stream);
            socket.emit("join", message);
            // set up call
            myPeer.on("call", call => {
                // listen to incoming streams
                console.log("called");
                call.answer(stream);
    
                // respond to incoming streams
                const video = document.createElement("video");
                call.on("stream", userVideoStream => {

                    addVideoStream(videoGrid, video, userVideoStream);
                });
            });
    
            // when other user connects
            socket.on("user-connected", (username, peer) => {
                connectToNewUser(myPeer, videoGrid, peer, stream)
            });
    
        }).catch(err => {
            console.log("Error while accessing media devices" + err);
        });
    });

}


function addVideoStream(videoGrid, video, stream) {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play();
    })
    videoGrid.append(video);
}


function connectToNewUser(myPeer, videoGrid, userId, stream){
    console.log(`attempt to call user ${userId}`);
    const call = myPeer.call(userId, stream);
    const video = document.createElement("video");

    call.on("stream", userVideoStream => {
        console.log("Got stream from "+userId);
        addVideoStream(videoGrid, video, userVideoStream);
    });

    call.on("close", () => {
        video.remove();
    });

    // update connected users
    connectedPeers[userId] = call;
}


window.onload = function(){
    const videoPanel = document.getElementById("videoPanel");
    const usernameInput = document.getElementById("username_input");
    const roomIdInput = document.getElementById("room_input");
    const joinRoomButton = document.getElementById("join_room_button");
    const createRoomButton = document.getElementById("create_room_button");
    
    const videoGrid = document.getElementById("videoStreams");
    const myVideo = document.createElement("video");
    myVideo.muted = true;

    joinRoomButton.onclick = e => {
        e.preventDefault();
        videoPanel.style.visibility = "visible";
        let username = usernameInput.value;
        let roomId = roomIdInput.value;
        console.log("Sending request to join");

        //begin streaming
        connectVideo(username, roomId, videoGrid, myVideo);
    };
    
    createRoomButton.onclick = e => {
        // send to socket
        fetch(URL + "/room/create", {method: "GET"})
        .then(res=>res.json())
        .then(response => {
            // place the roomId into the room input area
            let roomInput = document.getElementById("room_input");
            roomInput.value = response.room;
        });
        e.preventDefault();
    };

    // handle disconnects
    socket.on("user-disconnected", id => {
        console.log("User disconnected " + id);

        if(connectedPeers[id]){
            connectedPeers[id].close();
        }

    });
}
