# WebFrog Software documentation

## Development Team

### Paschalidis Anastasios

Back-end: server-side services, permanent storage, cyber-security

### Tsirmpas Dimitris

Front-end: HTML/CSS, Client-side scripts, Web RTC, Media servers


## Server-side services

### Room Service - RS

Manages the creation of rooms and allows users to connect to them.

- `GET /room/create` : Creates a new room and returns a unique ID corresponding to it.

- `GET /room/join?:room?:user-name` : Joins a user to the room.

Each user sends the server a TCP request about their intentions upon entering a room, which the server forwards to all current participants in the roomy. If they are allowed to connect to the room, all other users are informed and attempt to exchange peer-to-peer media streams. The server then updates everyone with the details of the new participant using TCP sockets. 

### Chat Service - CS

Implements the management, storage and sending of messages for each room. It supports 3 main commands:

- `GET /chat-box/refresh?:roomId&:lastMessage`: Returns new messages from all room users after
  (last message).

- `POST /chat-box/message/new {roomId,username, messageType,content,title?}`: Post a new message to the chat-room

- `GET /media/:roomId/:contents`: Get a file uploaded to the chat. The `:contents` parameter corresponds to
  File ID sent by the server via the refresh function.

### Login Service - LS

Manages the creation, registration and editing of account details. It consists of 6 commands:

- ` POST /user {username, pass, email}`: Creates a new account. Returns a unique session ID which is used for identification.

- `POST /user/update {sessionId, email, profilePic, aboutMe}`: Changes the details of an account.

- `POST /user/login {username,pass}`: Login to an existing account. Returns a unique session ID which is used for identification.

- `POST /user/logout {sessionId}`: Cancel the current session.

- `GET /user/:sessionId`: Returns the user's credentials. Use session ID identification so that only the user
  The session ID is used to use the session ID.

- `GET /media/profiles/:username/profilePic.png`: Returns the profile image of a user's account.


## Client Scripts

The client-side code is divided into 2 main functionalities, *call management* and *account management*, corresponding to the two main code files `client.js` and `authentication.js`.

These files make extensive use of functions from 4 module files, which either execute an independent and complex process or contain common code fragments. The modules are `conference.mjs`, `chat.mjs`, `profile.mjs` and `presenter.mjs`.

Full documentation and implementation details can be found in the source code in the form of Jsdoc and comments.

### Call Management

Call management is implemented by the `client.js` file. More specifically, the file controls the `index.html` page
and is responsible for:

- Connecting the user to a room
- Displaying video streams
- Monitoring and displaying the list of participants
- Displaying the chat box and all messages
- Sending messages to the chat

### Account management

Account management is implemented by the `authentication.js` file. The file manages the pages `login.html`, `signup.html` and `profile.html` which implement the login, signup and change of an account respectively.

### Modules
- `chat.mjs`: implements receiving, displaying and sending messages in the chat
- `conference.mjs`: Communicates with the server and the corresponding media servers in order to receive and send
  video streams
- `presenter.mjs`: Handles the more complex parts of creating HTML elements for the call interface
- `profile.mjs`: Acts as an intermediary between the application and the server to receive and process data.

## Backend Structure

The backend was developed using the `expressjs` framework. Specifically all API call handles are defined in the
`Server.ts` file located in the src folder.

### Modules:
- `routes`: implements simple helper functions for cleaner query handling.
- `mongussy`: implements all connections to the database.
- `logging`: Logger capabilities
- `router.test`: Test file. You can run it using the `npm run test` command.
- Inside the `models` subfolder:
  - `messages`: Data types used for message management.
  - `User`: A data type for representing and managing user data.

## Software used

_(The project was developed using Typescript for the application server and Javascript for the browser)_

- [PeerJs](https://peerjs.com/) Media server for sending peer-to-peer streams using Web RTC.
- [Handlebars](https://handlebarsjs.com/) JS library for dynamic HTML code generation.
- [SocketIO](https://socket.io/) JS library for fast, ad-hoc, event-driven communication with the server.
- [Nodejs](https://nodejs.org/en/) The environment used to build the backend.
- [Expressjs](https://expressjs.com) The framework used to structure the server.
- [Multer](https://www.npmjs.com/package/multer) The middleware used to manage persistent storage for files and images.
- [Jest](https://jestjs.io) Automated Testing production package.
- [Mongodb](https://www.mongodb.com) Database for managing account data.
- [CryptoJS](https://cryptojs.gitbook.io) Framework for implementing "at rest" encryption of account passwords.
- [Postman](https://www.postman.com) Tool for testing http requests.

## Resources

- [PeerJS documentation](https://peerjs.com/docs/#api)
- [Handlebars User Guide](https://handlebarsjs.com/guide/)
- [SocketIO documentation](https://socket.io/docs/v4/)
- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [MDN Web Docs](https://developer.mozilla.org/en-US/)
- [Web Application Technologies and Programming - UBA Slides](https://eclass.aueb.gr/courses/INF384/)
- [Video: How To Create A Video Chat App With WebRTC](https://www.youtube.com/watch?v=DvlyzDZDEq4)
- [Express Api Reference](https://expressjs.com/en/4x/api.html)
- [Multer Documentation](https://www.npmjs.com/package/multer)
- [CryptoJS](https://cryptojs.gitbook.io/docs/)
- [Jest - Getting started](https://jestjs.io/docs/getting-started)
- [Mongodb - Nodejs - Getting started](https://www.mongodb.com/docs/drivers/node/current/)

## Development and Issues

- The first and most fundamental problem we faced was the initial communication and exchange of multimedia streams, due to lack of familiarity with the libraries involved, which we painstakingly managed to overcome by studying the limited library     documentation and other sources shown in _Sources of Information_.

- Another point where we encountered problems was the multimedia management on the part of chat functionality, which we resolved using multer software.

- Problems occurred in backend helper methods resulting in chat messages coming in with the wrong order, which was resolved by creating unit test suites to validate the server's behavior.

- In the process of implementing the registration/login functions we encountered problems complying with the pre-agreed
  standards which was resolved by using integration testing tools such as _Postman_.
  
- We encountered a more severe issue with the management of persistent elements such as user profile images which
  led to a major reorganization of how we managed persistent storage.
  
- The most severe problem we encountered however was that the Peerjs API doesn't allow us to pass our own additional information, which meant that in many cases we couldn't match the incoming stream media feed to a username. The problem was ultimately addressed by using GET requests to the server to fetch user information.

- Finally, we encountered a problem with the Peerjs library where after some point in the development it started sending duplicate informational messages, some with undefined data. This prevented the clinet from removing the video streams of disconnected participants. We solved the problem by filtering out empty PeerJS messages whenever a user connected or disconnected.  
