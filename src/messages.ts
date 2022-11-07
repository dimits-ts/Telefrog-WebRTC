export type Message = {
    messageId: string;
    type: MessageType;
    poster: string;
    contents: any;
}

export enum MessageType {
    Text, Image, File
}

export type CreateRoomResponse = {
    roomId: string;
}

export type JoinRoomRequest = {
    username: string;
    roomId: string;
}

export type JoinRoomResponse = {
    //???
}

export type ChatboxRefreshRequest = {
    roomId: string;
    lastMessageId: string;
}

export type ChatBoxRefreshResponse = {
    newMessages: Message[];
}