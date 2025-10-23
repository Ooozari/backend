import mongoose,{Schema} from 'mongoose'
import bcrypt from 'bcrypt'

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

// function to encrypt user password
userSchema.pre('save', async function(){
    if(!this.password.isModified("password")) return;
    this.password = bcrypt.hash(this.password, 10)
    next()
})

// function to validate the password
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password);
}

export const User = mongoose.model("User", userSchema)