import {ErrorData, Message, MessageType} from "./model/messages";
import crypto from "crypto";
import path from "path";
import fs from "fs"
import {Logging} from "./logging";
import express from "express"
import {User} from "./model/User"
import {signin} from "./mongussy";

/**
 * Getter for the list of unreceived
 * @param chat the map of the chats for each room
 * @param room the specific room
 * @param last_message the id of the last received message
 */
export function getNewMessages(chat: Map<string, Message[]>, room: string, last_message: string): Promise<Message[]> {
    return new Promise<Message[]>((resolve, reject) => {
        let messages = chat.get(room);
        if (messages !== undefined) {
            if (messages.filter(value => value.messageId === last_message).length !== 0) {
                let toSend: Message[] = [];
                let stack = messages.slice().reverse()
                for (const m of stack) {
                    if (m.messageId === last_message) break;
                    toSend.push(m);
                }
                resolve(toSend);
            } else {
                resolve(messages);
            }
        } else {
            reject({code: 404, message: "attempted to get data from empty room",} as ErrorData);
        }
    })
}

/**
 * Generator for a unique room id
 * @param rooms the list of room ids
 */
export function getUniqueRoomId(rooms: string[]): string {
    let room: string;
    while (true) {
        room = crypto.randomBytes(8).toString("hex");
        if (rooms.filter(value => value == room).length === 0) {
            rooms.push(room);
            break;
        }
    }
    return room;
}

/**
 * Message constructor
 * @param username the username of the user that created the message
 * @param message_type the type of the message
 * @param contents the content of the message
 * @param title the title of the message if it's not text
 */
export function constructMessage(username: string, message_type: string, contents: any, title?: string): Message {
    let type: MessageType;
    switch (message_type) {
        case "Image":
            type = MessageType.Image
            break;
        case "File":
            type = MessageType.File
            break;
        default:
            type = MessageType.Text
            break;
    }
    let message: Message;
    if (title !== null) {

    }
    message = {messageId: crypto.randomUUID(), username: String(username), messageType: type, content: contents};

    return message;
}


/**
 * Destructor for the rooms permanent storage for when the room is destroyed
 * @param people the people per room map
 * @param roomObj room information object.
 */
export function flushUploads(people: Map<string, number>, roomObj: any) {
    let person_count = people.get(roomObj.room);
    if (person_count != undefined)
        people.set(roomObj.room, person_count - 1);
    if (person_count == 1) {

        let p = path.join(__dirname, "../uploads", String(roomObj.room));
        if (fs.existsSync(p)) {
            let contents = fs.readdirSync(p);
            for (const iterator of contents) {
                fs.unlinkSync(path.join(p, iterator));
            }
        }
    }
}

/**
 * Message storage callback
 * @param roomId the roomid the message belongs to
 * @param res the express Response object to send the http response
 * @param message the message to be stored
 * @param chats the messages per room
 * @param log the logger object
 */
export function storeMessage(roomId: any, res: express.Response<any, Record<string, any>>, message: Message, chats: Map<string, Message[]>, log: Logging) {
    let chat = chats.get(roomId);
    if (chat === undefined) {
        log.c(`Attempt to submit chat message in room ${roomId} which doesn't exist, by user ${message.username}.`);
        res.sendStatus(404);
    } else {
        log.i(`User ${message.username} submitted text with id ${message.messageId}.`);
        chat.push(message);
        res.sendStatus(200);
    }
}

/**
 * Login callback
 * @param username the login username
 * @param pass the login password
 */
export async function login(username: string, pass: string) {
    let result = await signin(username, pass);
    if (result === null) return null;
    return new User(result.name, result.pass, result.urlPath);
}