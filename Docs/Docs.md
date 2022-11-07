# Telefrog

## Application Protocol

### Create Room

1. Client opens connection to server
2. Client sends a create room request
3. Server creates room
4. Server sends room-id(randomly generated but unique)
5. Client closes connection

### Join Room

1. Client opens connection to server  
2. Client sends a join room request with the room-id.
3. Open video stream
4. When the client wants to exit the call, they send a terminate session request and if there are no more participants the room is deleted.

### Chat-box

1. On a given interval the client send a refresh chatbox request with the room-id to see if any text/image/file was sent.(see convention a)
2. When client wants to send a message request with the room-id, username, message type, content.
3. Server buffers the message, issuing a message id
4. When a refresh chat-box request is issued the client sends the id of the last message they received.
5. The server sequentially sends the messages in the order they were in the stack, until the id is found.

## Conventions

- get /room/create: no input - {room_id: ...}lk

- get /room/join?room=...?user-name=... -> status code

- get /room/exit ????? -> status code

- get chat-box/refresh&room=...&last_message=... ->[{username:...,message_id:..., message_type:...,contents:...}] empty list if no new messages.

- post chat-box/message/new {room_id:...,username:..., message_type:...,contents:...} -> status code

- Video Conference: with WebRTC we have the tutorial for one on  one so the challenge is to adjust it to more pc.
