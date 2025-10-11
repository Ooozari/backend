
import mongoose from "mongoose"
import { DB_Name } from "../constants.js"
 const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_Name}`)
        console.log("Connection Instance", connectionInstance.connection.host)
        console.log("Success! Connected to Database.")
    } catch (error) {
        console.error("Failure! Error Connecting to MongoDB: ", error)
        process.exit(1) // Exited with failure (1) 
    }
}
export default connectDB;