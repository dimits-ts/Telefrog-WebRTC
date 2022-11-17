import { Message, MessageType, Multimedia, ErrorData } from "./messages";
import crypto from "crypto";

export function getNewMessages(chat: Map<string, Message[]>, room: string, last_message: string): Promise<Message[]> {
    return new Promise<Message[]>((resolve, reject) => {
        var messages = chat.get(room);
        if (messages !== undefined) {
            if (messages.filter(value => value.message_id === last_message).length !== 0) {
                var toSend: Message[] = [];
                for (const m of messages.reverse()) {
                    if (m.message_id === last_message) break;
                    toSend.push(m);
                }
                resolve(toSend);
            } else {
                resolve(messages);
            }
        } else {
            reject({code:404,message:"attempted to get data from empty room",}as ErrorData);
        }
    })
}

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
        message = { message_id: crypto.randomUUID(), username: String(username), type, content: multi_id };
        if (title !== undefined) {
            message.title = title;
        }
    } else {
        message = { message_id: crypto.randomUUID(), username: String(username), type, content:contents };
    }
    return [message, multi];
}

export function getMultimedia(room:Multimedia[]|undefined,id:string|undefined):Promise<Multimedia> {
    return new Promise<Multimedia>((resolve, reject) => {
        if(room===undefined||id===undefined){
            reject({code:404,message:"item_not_found"}as ErrorData);
        }else{
            let multi=String(id);
            var file=room.filter(value=>multi===value.id);
            if(file.length===0){
                reject({code:404,message:"item_not_found",args:multi}as ErrorData);
            }else{
                resolve(file[0]);
            }
        }
    })
}