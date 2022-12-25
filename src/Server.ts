import express, {Request, Response} from "express";
import fs from "fs";
import * as ht from "http";
import s from "socket.io";
import path from "path";
import * as logging from "./logging";
import {Message} from "./messages";
import {constructMessage, flushUploads, getNewMessages, getUniqueRoomId, storeMessage} from "./routes";
import multer, {FileFilterCallback} from "multer";
import {randomUUID} from "crypto";
import {Buffer} from "buffer";

// Create the server
const PORT = 8080;
const app = express();
const http = new ht.Server(app);
const io = new s.Server(http, {
    maxHttpBufferSize: 10 * 1024 * 1024
});

const storage = multer.diskStorage({
    destination: function (req: Request, file: Express.Multer.File, cb) {
        if (req.path === "/user") {
            let paths = path.join(__dirname, `../uploads/${crypto.randomUUID()}/`)
            if (!fs.existsSync(paths))
                fs.mkdirSync(paths);
            cb(null, paths);
        } else {
            let paths = path.join(__dirname, `../uploads/${req.body.roomId}/`)
            if (!fs.existsSync(paths))
                fs.mkdirSync(paths);
            cb(null, paths);
        }
    }, filename: function (req: Request, file: Express.Multer.File, cb) {
        if (req.path === "/user") {
            let name = file.originalname.split(".")
            let suffix = name[name.length - 1];
            cb(null, `profile.${suffix}`);
        } else {
            let name = Buffer.from(file.originalname, "latin1").toString(`utf8`)
            cb(null, `${randomUUID()}~${name}`);
        }
    }
});


const upload = multer({
    storage, fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        if (req.body.messageType === "Text") {
            cb(null, false);
        } else {
            cb(null, true);
        }
    }
})

app.use(express.json({limit: "10mb"}));
app.use(express.urlencoded({extended: true, limit: "10mb"}));
//Define where the static html content will be found.
app.use("/static", express.static(path.join(__dirname, "../static")));
app.use("/media", express.static(path.join(__dirname, "../uploads")));
//This method redirects you to the html page when you enter localhost:8080

// This is a file logger, if you want to change the path take into account that this will run from out/Server.js
export const log = new logging.FileLog(path.join(__dirname, "../logging.txt"));
//You can use the console version
// export const log=new logging.ConsoleLog();
const rooms: string[] = [];
const people: Map<string, number> = new Map();
const chats: Map<string, Message[]> = new Map();

app.get("/", (req: Request, res: Response) => {
    res.redirect("/static/index.html");
})

app.get("/room/create", (req: Request, res: Response) => {
    // Create room id
    const room: string = getUniqueRoomId(rooms);
    people.set(room, 0);
    chats.set(room, []);
    log.i("Created room " + room);
    res.status(200).send({room});
})

//Socket io connections
io.on("connection", socket => {
    socket.on("join", roomObj => {
        if (rooms.filter(value => roomObj.room === value).length === 0) {
            socket.emit("join-status", 404, "Room not found");
        } else {
            log.i(`Attempt from user ${roomObj.username} to join room ${roomObj.room}`);
            socket.join(roomObj.room);
            let person_count = people.get(roomObj.room);
            if (person_count != undefined) {
                people.set(roomObj.room, person_count + 1)
                socket.to(roomObj.room).emit("user-connected", roomObj.username, roomObj.peer);
                socket.on("disconnect", () => {
                    flushUploads(people, roomObj);
                    socket.to(roomObj.room).emit("user-disconnected", roomObj.username, roomObj.peer);
                });
                socket.emit("join-status", 200, "OK");
            }
        }
    });
})

//Callback to refresh the 
app.get("/chat-box/refresh", async (req: Request, res: Response) => {
    const room = String(req.query.roomId);
    const last_message = String(req.query.lastMessage);

    try {
        let toSend = await getNewMessages(chats, room, last_message)
        res.status(200).json(toSend)
    } catch (e: any) {
        log.c(e.message)
    }
});


//Route for reading new Data
app.post("/chat-box/message/new", upload.single("content"), (req: Request, res: Response) => {
    let message;
    let roomId = req.body.roomId;
    if (req.body.messageType === "Text") {
        message = constructMessage(req.body.username, req.body.messageType, req.body.content);
        storeMessage(roomId, res, message, chats, log);
    } else {
        if (req.file === undefined) {
            res.status(400).send("File could not be uploaded");
        } else {
            message = constructMessage(req.body.username, req.body.messageType, req.file.filename);
            storeMessage(roomId, res, message, chats, log);
        }
    }
})


app.post("/user", upload.single("profile"), (req: Request, res: Response) => {
    log.i(`Request to register user with id ${req.body.username}`);
    res.sendStatus(200)
});


fs.readdir(path.join(__dirname, "../uploads"), (err, files) => {
    if (!err) {
        for (const i of files) {
            if (fs.lstatSync(path.join(__dirname, "../uploads", i)).isDirectory()) {
                fs.rmSync(path.join(__dirname, "../uploads", i), {recursive: true, force: true});
            } else {
                fs.unlinkSync(path.join(__dirname, "../uploads", i));
            }
        }
    } else {
        log.c(err.message);
    }
    log.i("cleaned the upload folder");
})


http.listen(PORT, () => {
    log.i(`Server initialization at port ${PORT}`);
});

