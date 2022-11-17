import { constructMessage, getMultimedia, getNewMessages, getUniqueRoomId } from "./routes";
import { Message, MessageType, Multimedia } from "./messages";
import fs from "fs";
import crypto from "crypto"
import path from "path"


describe('Create Message Object', () => {
    test('Create a text message file', () => {
        let file_data: string = String(fs.readFileSync(path.join(__dirname, "../Docs/Docs.md"), { encoding: "utf-8" }));

        let [msg, multi] = constructMessage("CupcakKe", "File", file_data, "docs.md");
        expect(multi).toBeDefined();
        expect(msg.message_type).toBe(MessageType.File);
        if (multi !== undefined)
            expect(multi.id).toBe(msg.content);
        expect(msg.title).toBe("docs.md");
    });
    test('Create an image file', () => {
        let file_data: string = String(fs.readFileSync(path.join(__dirname, "../static/resources/frog.PNG")));
        let [msg, multi] = constructMessage("Elfectra", "Image", file_data, path.join(__dirname, "../static/resources/frog.PNG"));
        expect(multi).toBeDefined();
        expect(msg.message_type).toBe(MessageType.Image);
        if (multi !== undefined)
            expect(multi.id).toBe(msg.content);
        expect(msg).toHaveProperty("messageId")
    });
    test('Create a md message file', () => {
        let [msg, multi] = constructMessage("Makrigiorgou", "Text", "Dimitry idk what this means, I asked how to make this test disturbing and he said this I am sry");
        expect(multi).toBe(undefined);
        expect(msg.username).toBe("Makrigiorgou");
        expect(msg).toHaveProperty("messageId")
    });
});

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
    var chat: Map<string, Message[]> = new Map();
    chat.set("ooo1", [constructMessage("Wanda", "Text", "You break the dick and you become daddy...I do it and become the bitch...that doesn't seem fair")[0], constructMessage("dimitrys Gkiwnhs", "Text", "On tonights video we ordered the among us potion from the dark web... and if you drink this among us potion at 3 am you turn into the impostor.")[0], constructMessage("Ma'am", "Text", "How much pussy does this mf get?! We read 0 pussy ma'am. Dear God.")[0], constructMessage("Elfectra", "Image", file_data, path.join(__dirname, "../static/resources/frog.PNG"))[0]]);
    var room = chat.get("ooo1");
    if (room !== undefined) {
        let messages = room.map(value => value.message_id);
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


describe('Get multimedia', () => {

    let vault: Map<string, Multimedia[]> = new Map();
    let image_data: string = String(fs.readFileSync(path.join(__dirname, "../static/resources/frog.PNG")));
    let image = constructMessage("lamragiotis panagopoulos", "Image", image_data, "frog.PNG")[1];
    let file_data: string = String(fs.readFileSync(path.join(__dirname, "../Docs/Docs.md"), { encoding: "utf-8" }));
    let file = constructMessage("Faymetrics", "File", file_data, "Docs.md")[1];
    if (image !== undefined && file !== undefined) {
        vault.set("hoi4", [image, file]);
        let room = vault.get("hoi4");
        let ids = room?.map(item => item.id);
        it('Should reject if room does not exist', () => {
            expect(getMultimedia(undefined, "1")).rejects.toBeDefined();
        });
        it('Should reject if no id was found', () => {
            expect(getMultimedia(room, undefined)).rejects.toBeDefined();
        });
        it('Should reject if the id does not exist in the room', () => {
            expect(getMultimedia(room, "1")).rejects.toBeDefined();
        });
        it('Should resolve with the data', () => {
            if (ids !== undefined) {
                expect(getMultimedia(room, ids[0])).resolves.toEqual(image);
            } else {
                expect(false).toEqual(true);
            }
        });
    }
});