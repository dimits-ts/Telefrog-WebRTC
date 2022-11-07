import express, { Request, Response } from "express";
import * as ht from "http";
import s from "socket.io";
import path from "path";
import * as logging from "./logging";
import crypto from "crypto";

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
app.get("chatbox/refresh",(req:Request,res:Response)=>{
    
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