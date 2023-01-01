export class User {
    name: string;
    pass: string;
    urlPath: string;

    constructor(name: string, pass: string, urlPath: string) {
        this.name = name;
        this.pass = pass;
        this.urlPath = urlPath;
    }
}