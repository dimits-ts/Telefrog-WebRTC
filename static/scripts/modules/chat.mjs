/**
 *  A class containing the chat messages and displaying new ones to
 *  the HTML chatbox.
 */
export class Chat {
    static NO_MESSAGES_ID = "";

    #username;
    #roomId;

    #chatboxElement;
    #hostURL;
    #presenter;
    #messages;

    /**
     * Constructs an object that posts and receives posts from the server.
     * @param {string} hostURL - The remote server's URL 
     * @param {Presenter} presenter - The presenter for the HTML page 
     */
    constructor(chatBoxElement, hostURL, presenter) {
        this.#chatboxElement = chatBoxElement;
        this.#hostURL = hostURL;
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
        let url = new URL(this.#hostURL + "/chat-box/refresh");

        url.search = new URLSearchParams({
            roomId: this.#roomId,
            last_message: this.#getLastMessageId()
        });
        console.log(url.search);
        fetch(url, { method: "GET" })
            .then(res => res.json())
            .then(list => {
                if (list.length !== 0) console.log(list);
                // if no new messages nothing will happen
                for (let message of list) {
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
        if (this.#username === undefined || this.#roomId === undefined) {
            throw new Error("Chat user has not been set");
        }

        const headers = {
            'enctype': encoding
        }

        const data = new FormData();
        data.append("roomId", this.#roomId);
        data.append("username", this.#username);
        data.append("messageType", type);
        data.append("content", content);

        let chatThis = this; // I love javascript I love javascript

        fetch(chatThis.#hostURL + "/chat-box/message/new", {
            method: "POST",
            headers: headers,
            body: data
        }).then(response => {
            if (!response.ok) {
                chatThis.#presenter.showGeneralError("An error occured while sending the message to the server");
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
        const message = document.createElement("p");
        message.innerText = text;

        this.#generateMessage(username, message);
    }

    #addImageToChat(username, imageDetails) {
        this.#fetchFile(imageDetails.content).then(file => {
            //const imageElement = document.createElement("img");
            console.log(imageDetails);

        });
    }

    #addFileToChat(username, file) {
        console.log(username, file);
    }

    #generateMessage(poster, contents) {
        const label = document.createElement("h5");
        label.innerText = poster + ":";
        label.classList.add("chat-username-label");
        if (poster === this.#username) {
            label.classList.add("chat-own-username-label");
        }

        const container = document.createElement("div");
        container.classList.add("chat-message-container");
        container.appendChild(label);
        container.appendChild(contents);

        this.#appendToChatBox(container);
    }

    #appendToChatBox(message) {
        this.#chatboxElement.appendChild(message);
    }

    /**
     * Fetches a file from the server.
     * @param {string} fileId - The id of the file to be retrieved 
     * @returns a promise that will contain the file
     */
    #fetchFile(fileId) {
        let url = new URL(this.#hostURL + "/chat-box/multimedia/");

        url.search = new URLSearchParams({
            roomId: this.#roomId,
            multimediaId: fileId
        });

        return fetch(url , { method: "GET"}).then(res => res.json());
    }
}
