import {Message, MessageType, ErrorData} from "./messages";
import crypto from "crypto";
import path from "path";
import fs from "fs"
import {Logging} from "./logging";
import express from "express"

export function getNewMessages(chat: Map<string, Message[]>, room: string, last_message: string): Promise<Message[]> {
    return new Promise<Message[]>((resolve, reject) => {
        var messages = chat.get(room);
        if (messages !== undefined) {
            if (messages.filter(value => value.messageId === last_message).length !== 0) {
                var toSend: Message[] = [];
                messages.reverse()
                for (const m of messages) {
                    if (m.messageId === last_message) break;
                    toSend.push(m);
                }
                messages.reverse();
                resolve(toSend);
            } else {
                resolve(messages);
            }
        } else {
            reject({code: 404, message: "attempted to get data from empty room",} as ErrorData);
        }
    })
}

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
    if (title!== null){

    }
    message = {messageId: crypto.randomUUID(), username: String(username), messageType: type, content: contents};

    return message;
}


export function flushUploads(people: Map<string, number>, roomObj: any) {
    let person_count = people.get(roomObj.room);
    if (person_count != undefined)
        people.set(roomObj.room, person_count - 1);
    if (person_count == 1) {
        let p = path.join(__dirname, "../uploads", String(roomObj.room));
        let contents = fs.readdirSync(p);
        for (const iterator of contents) {
            fs.unlinkSync(path.join(p, iterator));
        }
    }
}

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
