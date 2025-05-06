import {  MongoClient } from "mongodb";
const client=new MongoClient('mongodb+srv://rameshnimel934:Cu59mx8EGa62f4Ec@food-items.rtltbyh.mongodb.net/?retryWrites=true&w=majority&appName=Food-Items');
let db;

const Connection=async()=>{
    try{
           await client.connect();
              console.log("Connected to MongoDB");
              db=client.db('Food-Items');
              return db;
    }
    catch(err){
        console.log(err);
    }
}

export default Connection;