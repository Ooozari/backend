import mongoose,{Schema} from 'mongoose'


const userSchema = new Schema(
    {
        username :{
            type: String,
            required: true,
            lowercase: true,
            unique: true,
            trim: true,
            index: true,
        },
        email :{
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName :{
            type: String,
            index: true,
            trim: true,
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }  
        ],
        avatar :{
            type: String,
            required: true,
        },
        coverImage :{
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        refreshToken: {
            type: String,
        }
    }, 
    {
        timestamps: true
    }
)

export const User = mongoose.model("User", userSchema)