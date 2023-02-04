# WebFrog RTC

WebFrog is a Real Time Conferencing (RTC) service which allows users to connect, talk, and send messages to each other. WebFrog also supports account creation, authentication, editing and secure storage using MongoDB.


## Installation

### Prerequisites

The project was developed using the npm tool and the Nodejs environment. You can download both [here](https://nodejs.org/en/download/).


### Installation and execution

1. Clone the repository or download it through Github. 
2. Run `npm --install` on the local project directory to set-up the project dependencies.
3. Run `npm run build` to compile the typescript files.
4. Start a local media server with the `npm run peer` command.
5. Start a local server with the `npm start` command.

To visit your hosted website then go to [Telefrog](http://localhost:8080).


## Usage instructions

### Login as Guest

The simplest and quickest way to log in to WebFrog is by logging in without an account. Enter any
name in the `Sign in as guest` field and press the `Create Room` button to reserve your own room. Click
the `Join Room` button to start a call.

Alternatively you can enter the code of an existing room in the `Room ID` field to join a call with a
another user.

### Login with an account

WebFrog supports the creation and permanent storage of user accounts. To create an account click
the `Sign up` link on the main page and fill in the form. As long as the data you have submitted is correct you will
you will be redirected to the main page logged in as a new user.

From this point you can at any time log in to the same account via the
link `Log in your Telefrog Account`. You can also change (some) of your account details such as
`About me` and your account picture. Your changes are permanent *even after the server is shut down*.

To log in as a registered user follow the above procedure for Sign-in/Sign-up, and the same steps
with
Logging in as a Guest.

A user's session remains active as long as they are in the same tab or in a tab that has been copied
(duplicated) from any other tab with an active session. This is so that a browser can be used
for calls with different users.


## Documentation

A document containing high level documentation for the software can be found in the `Docs` directory.
