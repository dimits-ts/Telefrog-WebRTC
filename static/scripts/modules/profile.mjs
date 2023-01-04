 const STORAGE_ID = "sessionId";

/**
 * Get the user's profile picture from the server, or the default if no such picture
 * was uploaded.
 * @param {string | URL} url the profile picture's URL
 * @returns the profile picture
 */
export function getProfilePic(url) {
    if (urlExists(url)) {
        return url;
    } else {
        return "resources/profile_icon.png"
    }
}

/**
 * Get the user's data based on the user's current session ID.
 * @param {string | URL} hostURL the server URL
 * @param {string} sessionId the current session ID
 * @returns an object containing the user's data or null if the sessionId is invalid
 */
export async function getUserData(hostURL, sessionId) {
    let res = await fetch(hostURL + "/user/" + sessionId, {method: "GET"});
    if (res.ok) {
        return res.json()
    } else {
        return null;
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

/**
 * Check if a URL exists
 * @param {URL} url the url to be checked
 * @returns true if the url exists
 */
function urlExists(url) {
    let http = new XMLHttpRequest();
    http.open('HEAD', url, false);
    http.send();
    if (http.status != 404) return true; else return false;
}