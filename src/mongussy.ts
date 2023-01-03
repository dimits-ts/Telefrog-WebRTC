import {MongoClient} from "mongodb";
import dot from "dotenv"
import {log} from "./Server"
import {User} from "./model/User";

dot.config()


const client = new MongoClient("mongodb+srv://makoto575:NunQvohy4F5c72nQ@frogometrics.wkk3yij.mongodb.net/test")


export async function register(user: User) {
    try {
        let cursor = await client.connect();
        const collection = cursor.db("telefrog").collection("users");
        await collection.insertOne(user);
    } catch (error: any) {
        log.c(error.message)
    }
    await client.close();
}

export async function signin(user: string, pass: string) {
    let cursor = await client.connect();
    const collection = cursor.db("telefrog").collection("users");
    return collection.findOne({username: user, password: pass});
}


export async function findName(username: string) {
    let cursor = await client.connect();
    const collection = cursor.db("telefrog").collection("users");
    return collection.countDocuments({username})
}

export async function getProfilePic(username: string) {
    let cursor = await client.connect();
    const collection = cursor.db("telefrog").collection("users");
    return collection.find({username}).project({_id: 0, urlPath: 1}).toArray();
}

export async function getUserByName(username: string) {
    let cursor = await client.connect();
    const collection = cursor.db("telefrog").collection("users");
    return collection.findOne({username});
}

export async function updateUser(user: User) {
    let cursor = await client.connect();
    const collection = cursor.db("telefrog").collection("users");
    return collection.findOneAndUpdate({username: user.username}, {
        $set: {
            email: user.email, profilePic: user.profilePic, aboutMe: user.aboutMe
        }
    })
}