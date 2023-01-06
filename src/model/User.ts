export class User {
    username: string;
    password: string;
    email?: string;
    profilePic?: string;
    aboutMe?: string;

    constructor(username: string, password: string, email?: string, profilePic?: string, aboutMe?: string) {
        this.username = username;
        this.password = password;
        if (aboutMe !== undefined) this.aboutMe = aboutMe;
        if (email !== undefined) this.email = email;
        if (profilePic !== undefined) this.profilePic = profilePic;
    }


}