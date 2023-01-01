import {constructMessage, getNewMessages, getUniqueRoomId} from "./routes";
import {Message} from "./messages";
import fs from "fs";
import crypto from "crypto"
import path from "path"

describe('Generate UUID', () => {
    it('Return a uid that is not present in the current rooms', () => {
        let rooms: string[] = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()]
        let value = getUniqueRoomId(rooms);
        expect(value).toBeDefined();
        expect(rooms).toContain(value);
    });
});

describe('Get Messages', () => {
    let file_data: string = String(fs.readFileSync(path.join(__dirname, "../static/resources/frog.PNG")));
    let chat: Map<string, Message[]> = new Map();
    chat.set("ooo1", [constructMessage("Wanda", "Text", "You break the dick and you become daddy...I do it and become the bitch...that doesn't seem fair"), constructMessage("dimitrys Gkiwnhs", "Text", "On tonights video we ordered the among us potion from the dark web... and if you drink this among us potion at 3 am you turn into the impostor."), constructMessage("Ma'am", "Text", "How much pussy does this mf get?! We read 0 pussy ma'am. Dear God."), constructMessage("Elfectra", "Image", file_data, path.join(__dirname, "../static/resources/frog.PNG"))]);
    let room = chat.get("ooo1");
    if (room !== undefined) {
        let messages = room.map(value => value.messageId);
        it('Should reject if the chat room was not fount ', () => {
            expect(getNewMessages(chat, "sex", "1")).rejects.toBeDefined();
        });

        it('Should a list of messages a valid last name id was given contain', () => {
            let result = room?.slice(2).reverse();
            expect(getNewMessages(chat, "ooo1", messages[1])).resolves.toEqual(result);
        });
        it('Should return all messages if an empty string was given', () => {
            expect(getNewMessages(chat, "ooo1", "")).resolves.toEqual(room)
        });
        it('Should return all messages if a non-existent string was given', () => {
            expect(getNewMessages(chat, "ooo1", "sexyman")).resolves.toEqual(room)
        });
    }
});

