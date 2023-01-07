import {MongoClient} from "mongodb";
import dot from "dotenv"
import {iv, key, log} from "./Server"
import {User} from "./model/User";
import * as CryptoJS from "crypto-js"

dot.config()


const client = new MongoClient("mongodb+srv://makoto575:NunQvohy4F5c72nQ@frogometrics.wkk3yij.mongodb.net/test")


/**
 * Method to register new User
 * @param user the user object with the register information
 */
export async function register(user: User) {
    try {
        let cursor = await client.connect();
        const collection = cursor.db("telefrog").collection("users");
        user.password = CryptoJS.AES.encrypt(user.password, key, {iv}).toString();
        await collection.insertOne(user);
    } catch (error: any) {
        log.c(error.message)
    }
    await client.close();
}

/**
 * Login function
 * @param user the username
 * @param pass the password
 */
export async function signin(user: string, pass: string) {
    let cursor = await client.connect();
    const collection = cursor.db("telefrog").collection("users");
    return collection.findOne({username: user, password: CryptoJS.AES.encrypt(pass, key, {iv}).toString()});
}


/**
 * Check method for duplicate names before registering
 * @param username the username to be created
 */
export async function findName(username: string) {
    let cursor = await client.connect();
    const collection = cursor.db("telefrog").collection("users");
    return collection.countDocuments({username})
}

/**
 * Getter for user information with specific username.
 * @param username the username to find
 */
export async function getUserByName(username: string) {
    let cursor = await client.connect();
    const collection = cursor.db("telefrog").collection("users");
    return collection.findOne({username});
}

/**
 * Updater for a specific Users' information
 * @param user the new user object.
 */
export async function updateUser(user: User) {
    let cursor = await client.connect();
    const collection = cursor.db("telefrog").collection("users");
    let set = {} as set
    if (user.email !== undefined) set.email = user.email;
    if (user.profilePic !== "") set.profilePic = user.profilePic;
    if (user.aboutMe !== undefined) set.aboutMe = user.aboutMe;
    return collection.findOneAndUpdate({username: user.username}, {$set: set})
}

type set = {
    email?: string;
    profilePic?: string;
    aboutMe?: string;
}
