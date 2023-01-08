import fs from "fs";
import moment from "moment";

export interface Logging {
    i(message: string | number): void;
    d(message: string | number): void;
    c(message: string | number): void;
}

const tag = {
    info: "INFORMATION",
    debug: "DEBUG",
    critical: "CRITICAL",
}

export class FileLog implements Logging {
    logFile: string

    constructor(path: string) {
        this.logFile = path;
    }

    Log(tag: string, message: string | number): void {
        fs.appendFileSync(this.logFile, `[${tag}]-\ ${moment().format("DD/MM/YY HH:mm:ss")}\:${message}\n`);
    }

    i(message: string | number): void {
        this.Log(tag.info, message);
    }
    d(message: string | number): void {
        this.Log(tag.debug, message);
    }
    c(message: string | number): void {
        this.Log(tag.critical, message);
    }
}

export class ConsoleLog implements Logging {
    Log(tag: string, message: string | number): void {
        console.log(`[${tag}]:${message}`);
    }
    i(message: string | number): void {
        this.Log(tag.info, message);
    }
    d(message: string | number): void {
        this.Log(tag.debug, message);
    }
    c(message: string | number): void {
        this.Log(tag.critical, message);
    }
}
