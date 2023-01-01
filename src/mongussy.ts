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
        log.c("no connection???");
    }
    await client.close();
}

export async function signin(user: string, pass: string) {
    let cursor = await client.connect();
    const collection = cursor.db("telefrog").collection("users");
    return await collection.findOne({user,pass});
}


