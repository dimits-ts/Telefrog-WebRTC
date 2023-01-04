/**
 * A class that acts as a presenter between the HTML page and the client logic.
 */
export class Presenter {
    //TODO: move getUsername and getRoomId somewhere else

    #loginPanel = document.getElementById("login");
    #roomBanner = document.getElementById("roomBanner");
    #videoGrid = document.getElementById("videoStreams");

    #usernameInput = document.getElementById("username_input");
    #roomIdInput = document.getElementById("room_input");
    #errorMessageArea = document.getElementById("errorMessage");

    #chatInput = document.getElementById("chat-input");
    #fileInput = document.getElementById("file-input");

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
    * @param {string} username - The username of the connecting user
    * @param {MediaSession} stream - The corresponding media stream
    * @param {boolean} isMuted - Whether the video is muted
    * @return the stream HTML element that was created
    */
    addVideoElement(username, stream, isMuted) {
        const video = document.createElement("video");
        video.muted = isMuted;

        const streamContainer = document.createElement("div");
        streamContainer.classList.add("stream-container");

        const usernameContainer = document.createElement("p");
        usernameContainer.innerText = username;

        video.srcObject = stream;
        video.addEventListener("loadedmetadata", () => {
            video.play();
        });

        streamContainer.appendChild(video);
        streamContainer.appendChild(usernameContainer);
        this.#videoGrid.append(streamContainer);

        return video;
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

    getChatFiles() { return this.#fileInput.files; }

    /**
     * Clear all chat inputs.
     */
    resetChatInputs() {
        this.#chatInput.value = "";
        this.#fileInput.value = "";
    }

}

/**
 * Switch a password field's text between hidden and visible.
 * @param {HTMLElement} passwordField the password field
 */
export function swapPasswordType(passwordField) {
    if (passwordField.type === "password")
        passwordField.type = "text";
    else
        passwordField.type = "password";
}