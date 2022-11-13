import { Message, MessageType, Multimedia } from "./messages";
import crypto from "crypto";

//TODO-[13/11/2022]: test
export function getNewMessages(chat: Map<string, Message[]>, room: string, last_message: string): Promise<Message[]> {
    return new Promise<Message[]>((resolve, reject) => {
        var messages = chat.get(room);
        if (messages !== undefined) {
            if (messages.filter(value => value.messageId === last_message).length !== 0) {
                var toSend: Message[] = [];
                for (const m of messages.reverse()) {
                    if (m.messageId === last_message) break;
                    toSend.push(m);
                }
                resolve(toSend);
            } else {
                resolve(messages);
            }
        } else {
            reject("attempted to get data from empty room");
        }
    })
}

//TODO-[13/11/2022]: test
export function getUniqueRoomId(rooms: string[]): string {
    while (true) {
        var room: string = crypto.randomBytes(8).toString("hex");
        if (rooms.filter(value => value == room).length === 0) {
            rooms.push(room);
            break;
        }
    }
    return room;
}

//TODO-[13/11/2022]: test
export function constructMessage(username: string, message_type: string, contents: any, title?: string): [Message, Multimedia | undefined] {
    var type: MessageType;
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
    let multi_id = crypto.randomUUID();
    var message: Message;
    var multi: Multimedia | undefined = undefined
    if (type !== MessageType.Text) {
        multi = { id: multi_id, type, contents };
        message = { messageId: crypto.randomUUID(), poster: String(username), type, contents: multi_id };
        if (title !== undefined) {
            message.title = title;
        }
    } else {
        message = { messageId: crypto.randomUUID(), poster: String(username), type, contents };
    }
    return [message, multi];
}