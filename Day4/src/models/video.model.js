import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'

const videoSchema = new Schema({
    videoFile :{
        type: String,
        required: true
    },
    thumbnail :{
        type: String,
        required: true
    },
    owner :{
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    title :{
        type: String,
        required: true,
        maxLength: [150, "Title cannot exceed 150 characters"]
    },
    description :{
        type: String,
        required: true,
        maxLength: [500, "Description cannot exceed 500 characters"]
    },
    duration :{
        type: Number,
    },
    views :{
        type: Number,
        default: 0
    },
    isPublished :{
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

videoSchema.plugin(mongooseAggregatePaginate)
export const Video = mongoose.model("Video", videoSchema)
