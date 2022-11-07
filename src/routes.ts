import { Message, MessageType } from "./messages";
import crypto from "crypto";

export function getNewMessages(chat:Map<string,Message[]>,room:string,last_message:string):Promise<Message[]>{
    return new Promise<Message[]>((resolve, reject) => {
        var messages=chat.get(room);
        if (messages!==undefined){
            var toSend:Message[]=[];
            for (const m of messages.reverse()) {
                if(m.messageId===last_message)break;
                toSend.push(m);
            }
            resolve(toSend);
        }else{
            reject("attempted to get data from empty room");
        }
    })
}


export function getUniqueRoomId(rooms: string[]): string {
    while (true) {
        var room:string = crypto.randomBytes(8).toString("hex");
        if (rooms.filter(value => value == room).length === 0) {
            rooms.push(room);
            break;
        }
    }
    return room;
}


export function constructMessage(username:string,message_type:string,contents: any):Message {
    var type:MessageType;
    switch (message_type) {
        case "Image":
            type=MessageType.Image
            break;
        case "File":
            type=MessageType.File
            break;
        default:
            type=MessageType.Text
            break;
    }
    let message:Message={messageId:crypto.randomUUID(),poster:String(username),type,contents}
    return message;
}