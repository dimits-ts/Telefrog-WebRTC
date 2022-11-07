import express, { Request, Response } from "express";
import * as ht from "http";
import s from "socket.io";
import path from "path";
import * as logging from "./logging";
import crypto, { randomUUID } from "crypto";
import { Message,MessageType } from "./messages";
import e from "express";

// Create the server
const app = express();
var http = new ht.Server(app);
var io = new s.Server(http);



var log: logging.Logging;
// This is a file logger, if you want to change the path take into account that this will run from out/Server.js
log = new logging.FileLog(path.join(__dirname, "../logging.txt"))
//You can use the console version
// log=new logging.ConsoleLog();
const PORT = 8080;
var rooms: string[] = [];
var chats: Map<string,Message[]>=new Map();

app.get("/room/create", (req: Request, res: Response) => {
    // Create room id
    var room: string;
    while (true) {
        room = crypto.randomBytes(8).toString("hex");
        if (rooms.filter(value => value == room).length === 0) {
            rooms.push(room);
            break;
        }
    }
    chats.set(room,[]);
    log.i("Created room " + room);
    res.status(200).json({ room_id: room });
})

io.on("connection",socket=>{
    socket.on("join",roomObj=>{
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
    var messages=chats.get(room);
    if (messages!==undefined){
        var toSend:Message[]=[];
        for (const m of messages.reverse()) {
            if(m.messageId===last_message)break;
            toSend.push(m);
        }
        res.status(200).json(toSend);
    }else{
        log.c("attempted to get data from empty room");
        res.sendStatus(400);
    }
});

app.post("chat-box/message/new",(req:Request,res:Response)=>{
    let data=req.body;
    var type:MessageType;
    let roomId=data.room;
    switch (data.type) {
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
    let message:Message={messageId:randomUUID(),poster:String(data.username),type,contents:data.content}
    let chat=chats.get(roomId);
    if(chat===undefined){
        log.c("Tried to submit message to chat that doesn't exist.");
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
})