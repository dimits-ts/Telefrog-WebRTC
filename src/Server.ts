import express, { Request, Response } from "express";
import * as ht from "http";
import s from "socket.io";
import path from "path";
import * as logging from "./logging";
import { Message,MessageType, Multimedia } from "./messages";
import { constructMessage, getNewMessages, getUniqueRoomId } from "./routes";

// Create the server
const PORT = 8080;
const app = express();
var http = new ht.Server(app);
var io = new s.Server(http);

app.use(express.json({limit:"10mb"}));
app.use(express.urlencoded({limit:"10mb"}));



var log: logging.Logging;
// This is a file logger, if you want to change the path take into account that this will run from out/Server.js
log = new logging.FileLog(path.join(__dirname, "../logging.txt"))
//You can use the console version
// log=new logging.ConsoleLog();
var rooms: string[] = [];
var chats: Map<string,Message[]> =new Map();
var multimedia:Map<string,Multimedia[]> =new Map();

app.get("/room/create", (req: Request, res: Response) => {
    // Create room id
    var room: string=getUniqueRoomId(rooms);
    chats.set(room,[]);
    multimedia.set(room,[]);
    log.i("Created room " + room);
    res.status(200).send({room});
})

io.on("connection",socket=>{
    socket.on("join",roomObj=>{
        if (rooms.filter(value=>roomObj.room===value).length===0) {
            socket.emit("join-status",404, "Room not found");
        }else{
            log.i(`Attempt from user ${roomObj.username} to join room ${roomObj.room}`);
            socket.join(roomObj.room);
            socket.to(roomObj.room).emit("user-connected",roomObj.username,roomObj.peer);
            socket.on("disconnect",()=>{
                socket.to(roomObj.room).emit("user-disconnected",roomObj.username,roomObj.peer);
            });
            socket.emit("join-status",200, "OK");
        }
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
    if (req.body.title!==undefined) {
        var [message,multi]=constructMessage(req.body.username,req.body.type,req.body.contents,req.body.title);
    } else {
        var [message,multi]=constructMessage(req.body.username,req.body.type,req.body.contents);
    }
    let chat=chats.get(roomId);

    // Add file content to multimedia folder
    if (multi!==undefined) {
        let vault:Multimedia[]|undefined=multimedia.get(roomId);
        if (vault!==undefined) {
            vault.push(multi);
        } else {
            res.sendStatus(404);
        }
    }
    if(chat===undefined){
        log.c(`Attempt to submit chat message in room ${roomId} which doesn't exist, by user ${message.poster}.`);
        res.sendStatus(404);
    }else{
        log.i(`User ${message.poster} submitted text with id ${message.messageId}.`);
        if (message.type!==MessageType.Text) {
            
        } else {
            chat.push(message);
        }
        res.sendStatus(200);
    }
})

app.get("chat-box/multimedia/:room",(req:Request,res:Response)=>{
    var id=req.query.multimediaId;
    var vault=multimedia.get(req.params.room);
    if(vault===undefined||id===undefined){
        log.c(`Attempt to access multimedia folder that does not exist`);
        res.sendStatus(404);
    }else{
        let multi=String(id);
        var file=vault.filter(value=>multi===value.id);
        if(file.length===0){
            log.c(`Multimedia item of id ${multi} was not found`);
            res.sendStatus(404);
        }else{
            res.status(200).json(file[0]);
        }
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