// Env Variable must be avaible as soon as our application is first time loaded
import dotenv from 'dotenv'
dotenv.config({ path: './.env' })
import connectDB from './db/index.js';
import { app } from "./app.js";

connectDB().then(()=>{
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Success! Server is Running at port: ${process.env.PORT}`)
    })
}).catch((err)=>{
    console.log("Failed! Connecting to server.", err)
})