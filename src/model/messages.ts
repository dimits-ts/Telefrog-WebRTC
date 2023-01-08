export type Message = {
    messageId: string;
    messageType: MessageType;
    username: string;
    content: any;
    title?: string;
}

export enum MessageType {
    Text = "Text", Image = "Image", File = "File"
}
export type ErrorData = {
    code: number;
    message: string;
    args?: any | any[];
}