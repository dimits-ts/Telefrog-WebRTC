export type Message = {
    messageId: string;
    type: MessageType;
    poster: string;
    contents: any;
    title?:string;
}

export enum MessageType {
    Text="Text", Image="Image", File="File"
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

export type Multimedia={
    id: string,
    type: MessageType,
    contents:any
}

export type ErrorData={
    code: number;
    message: string;
    args?: any|any[];
}