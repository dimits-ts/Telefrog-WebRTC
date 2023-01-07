const STORAGE_ID = "sessionId";

/**
 * A class responsible for fetching user data from the server.
 */
export class ProfileManager {
    #hostURL;

    /**
     * Construct a new manager connected to a specific server.
     * @param {string | URL} hostURL the server URL
     */
    constructor(hostURL) {
        this.#hostURL = hostURL;
    }

    /**
     * Get the user's profile picture from the server, or the default if no such picture
     * was uploaded.
     * @param {string} username the username
     * @returns the profile picture
     */
    getProfilePic(username) {
        const url = this.#getProfileURL(username);
        if (this.#urlExists(url)) {
            return url;
        } else {
            return "resources/profile_icon.png"
        }
    }

    /**
     * Get the user's data based on the user's current session ID.
     * @param {string} sessionId the current session ID
     * @returns an object containing the user's data or null if the sessionId is invalid
     */
    async getUserData(sessionId) {
        let res = await fetch(this.#getDataURL(sessionId), { method: "GET" });
        if (res.ok) {
            return res.json()
        } else {
            return null;
        }
    }

    /**
     * Check if a URL exists
     * @param {URL} url the url to be checked
     * @returns true if the url exists
     */
    #urlExists(url) {
        let http = new XMLHttpRequest();
        http.open('HEAD', url, false); // this should probably not be done in the main thread
        http.send();
        return http.status !== 404
    }

    #getProfileURL(username) {
        return `${this.hostURL}/media/profiles/${username}/profilePic.png`;
    }

    #getDataURL(sessionId) {
        return `${this.#hostURL}/user/${sessionId}`;
    }

}

/**
 * Save the current session ID.
 * @param {string} sessionId the newly acquired session ID
 */
export function saveSessionId(sessionId) {
    window.sessionStorage.setItem(STORAGE_ID, sessionId);
}

/**
 * Get the last saved session ID.
 * @returns the last session ID
 */
export function getSessionId() {
    return window.sessionStorage.getItem(STORAGE_ID);
}

/**
 * Delete the last session ID.
 */
export function resetSessionId() {
    window.sessionStorage.removeItem(STORAGE_ID);
}