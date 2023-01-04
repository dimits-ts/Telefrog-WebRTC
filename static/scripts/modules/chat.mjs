import { getProfilePic } from "./profile.mjs";
/**
 *  A class containing the chat messages and displaying new ones to
 *  the HTML chatbox.
 */
export class Chat {
    static NO_MESSAGES_ID = "";
    static TEMPLATE = document.getElementById("chat-template");

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

        Handlebars.registerHelper('ifEq', function (arg1, arg2, options) {
            return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
        });
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
            lastMessage: this.#getLastMessageId()
        });

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
            return this.#messages[this.#messages.length - 1].messageId;
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
                chatThis.#presenter.showGeneralError("An error ocurred while sending the message to the server");
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
        // save the original message
        this.#messages.push(message);

        // set message's display type
        if (message.messageType === "Text" && isLink(message.content)) {
            message.type = "Link";
        } else if (message.messageType === "File" && isVideo(message.content)) {
            message.type = "Video";
        } else if(message.messageType === "File" && isImage(message.content)) {
            message.type = "Image";
        } else {
            message.type = message.messageType;
        } 

        // set profile pic
        let profilePicUrl = this.#hostURL + "/user/profile/" + this.#username;
        message.profilePic = getProfilePic(profilePicUrl);

        message.isSelf = message.username === this.#username
        message.hostURL = this.#hostURL
        message.roomId = this.#roomId
        message.timestamp = new Date().toLocaleTimeString()
        message.fileName = message.content.split("~")[1]

        // get HTML representation
        let compiledTemplate = Handlebars.compile(Chat.TEMPLATE.textContent, message)
        let html = compiledTemplate(message)

        // add HTML to chatbox
        const container = document.createElement("div")
        container.innerHTML = html
        this.#appendToChatBox(container)
    }

    #appendToChatBox(messageContainer) {
        this.#chatboxElement.appendChild(messageContainer);
    }

}

/**
 * Return whether a string is a valid HTTP URL.
 * @param {str} string the string to be examined 
 * @returns true if the string repersents a URL
 */
function isLink(string) {
    let url;
    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
}

/**
 * Check whether a file is a video based on its extension.
 * @param {str} filename the name of the file to be examined 
 * @returns true if the file is a video
 */
function isVideo(filename) {
    const videoExtensions = ['m4v', 'avi','mpg','mp4', 'webm'];
    return videoExtensions.includes(getExtension(filename));
}

/**
 * Check whether a file is an image based on its extension.
 * @param {str} filename he name of the file to be examined 
 * @returns true if the file is an image
 */
function isImage(filename) {
    const imageExtensions = ['jpg', 'png' ,'jpeg' , "webp", "tiff", "psd", "raw",
    "bmp", "heif", "indd", "svg"]
    return imageExtensions.includes(getExtension(filename));
}

/**
 * Get the extension of a file.
 * @param {str} filename the name of the file 
 * @returns the extension (without the dot)
 */
function getExtension(filename){
    let parts = filename.toLowerCase().split('.');
    return parts[parts.length - 1];
}