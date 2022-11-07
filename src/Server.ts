import express, { Request, Response } from "express";
import * as ht from "http";
import s from "socket.io";
import path from "path";
import * as logging from "./logging";
import crypto, { randomUUID } from "crypto";
import { Message,MessageType } from "./messages";
import e from "express";
import { constructMessage, getNewMessages, getUniqueRoomId } from "./routes";

// Create the server
const PORT = 8080;
const app = express();
var http = new ht.Server(app);
var io = new s.Server(http);



var log: logging.Logging;
// This is a file logger, if you want to change the path take into account that this will run from out/Server.js
log = new logging.FileLog(path.join(__dirname, "../logging.txt"))
//You can use the console version
// log=new logging.ConsoleLog();
var rooms: string[] = [];
var chats: Map<string,Message[]>=new Map();

app.get("/room/create", (req: Request, res: Response) => {
    // Create room id
    var room: string=getUniqueRoomId(rooms);
    chats.set(room,[]);
    log.i("Created room " + room);
    res.status(200).send(room);
})

io.on("connection",socket=>{
    socket.on("join",roomObj=>{
        log.i(`Attempt from user ${roomObj.username} to join room ${roomObj.room}`);
        socket.join(roomObj.room);
        //high chance of going to shit
        socket.to(roomObj.room).emit("user-connected",roomObj.username);
        socket.on("disconnect",()=>{
            socket.to(roomObj.room).emit("user-disconnected",roomObj.username);
        });
    });
})

//TODO: ADD GET REQUESTS
app.get("chat-box/refresh",(req:Request,res:Response)=>{
    const room=String(req.query.room);
    const last_message=String(req.query.last_message);
    getNewMessages(chats,room,last_message)
        .then(toSend=>res.status(200).json(toSend))
        .catch(err=>{
            log.c(err.message);
            res.sendStatus(400);
        });
});

app.post("chat-box/message/new",(req:Request,res:Response)=>{
    let roomId=req.body.room;
    let message=constructMessage(req.body.username,req.body.type,req.body.contents)
    let chat=chats.get(roomId);
    if(chat===undefined){
        log.c(`Attempt to submit chat message in room ${roomId} which doesn't exist, by user ${message.poster}.`);
        res.sendStatus(404);
    }else{
        log.i(`User ${message.poster} submitted text with id ${message.messageId}.`);
        chat.push(message);
        res.sendStatus(200);
    }
})

//Define where the static html content will be found.
app.use("/static", express.static(path.join(__dirname, "../static")));

//This method redirects you to the html page when you enter localhost:8080
app.get("/", (req: Request, res: Response) => {
    res.redirect("/static/index.html");
})

http.listen(PORT, () => {
    log.i(`Server initialization at port ${PORT}`);
});