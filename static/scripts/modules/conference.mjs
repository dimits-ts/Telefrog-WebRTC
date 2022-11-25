/**
 * A class managing the connections and streams between the conference's participants
 * on the client side.
 */
export class Conference {
    static STREAM_CONSTRAINTS = { audio: true, video: true };
    static PEER_SERVER_CONFIG = { host: "/", port: "3001" };

    #username; // useful to keep around
    #roomId;

    #socket;
    #presenter;
    #connectedPeers;

    /**
     * Initialize the data structures before establishing connection to remote server.
     * @param {Socket} socket - A socket connected to the server
     * @param {Presenter} presenter - The proxy object for the current HTML page 
     */
    constructor(socket, presenter) {
        this.#socket = socket;
        this.#presenter = presenter;
        this.#connectedPeers = {};
    }

    /**
     * Starts a stream with the user himself, and receives the streams of all other people in the room.
     * @param {string} username - The name of the user attempting the connection 
     * @param {string} roomId - The ID of the room to be connected to
     */
    connect(username, roomId) {
        this.#username = username;
        this.#roomId = roomId;

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
                this.#socket.emit("join", message);

                // receive session status from server
                this.#socket.on("join-status", (statusCode, statusMessage) => {
                    if (statusCode === 200) {
                        this.#presenter.showConnected("Connected to room " + this.#roomId);

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
                        this.#socket.on("user-connected", (username, peer) => {
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