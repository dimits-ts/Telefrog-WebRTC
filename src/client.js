// Configurations
const iceServer = {
    "iceServers":[
        {"url": "stun.stun.services.mozilla.com"},
        {"url": "stun.stun.I.google.com:19302"}
    ]
};
const streamConstraints = {audio: true, video: true};

const logger = new ConsoleLog();
const socket = io("http://localhost"); // change this later lmao

// Procedures
const joinRoom = function(message) {
    socket.emit("join", message);

    socket.on("created", room => {
        navigator.mediaDevices.getSupportedConstraints(streamConstraints)
        .then(stream => {
            let localStream = stream;
            localStream.src = URL.createObjectURL(stream);
        }).catch(err => {
            logger.c("Error while accessing media devices", err)
        })
    })
}

window.onload = function(){
    const username_input = document.getElementById("username_input")
    const room_id_input = document.getElementById("room_input")
    const join_room_button = document.getElementById("join_room_button")
    const create_room_button = document.getElementById("create_room_button")


    join_room_button.onclick = () => {
        let username = username_input.value;
        let roomId = room_id_input.value;
        let request = {"username": username, "id": roomId};
        // send to socket
        joinRoomProcedure(request);
    };
    

    
    create_room_button.onclick = () => {
        // send to socket
        // display
    };
    
}


