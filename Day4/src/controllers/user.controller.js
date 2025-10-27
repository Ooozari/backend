import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/apiError.js'
import {ApiResponse} from '../utils/apiResponse.js'
import {User} from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'


const registerUser = asyncHandler(async (req, res) => {
    
    // get user details from frontend
    const {username, email, fullName, password} = req.body

    // validation - not empty
    if([username, email, fullName, password].some((feild) => feild?.trim() === "")){
        throw new ApiError(400, "Register fields are required");
    }

    // check if user already exists: username, email
    const isExistingUser = await User.findOne({
        $or: [{username}, {email}]
    })
    if(isExistingUser){
        throw new ApiError(409, "User with this email or password already exists");
    }

    // check for images

    //  check for avatar (required)
    const avatarLocalPath = req.files?.avatar[0]?.path
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar image is required");
    }

    //  check for coverImage
    const coverImageLocalPath = req.files?.coverImage[0]?.path


    // upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar image is required");
    }


    // create user object - create entry in db
    const user = await User.create({
        username: username.toLowerCase(),
        email,
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password,
    })

    // Logic 1 more costly
    // const createdUser = await User.findById(user._id);
    // if(!createdUser){
    //     throw new ApiResponse(500, "Failed to create user");
    // }
    // Logic 2

    if(!user._id){
        throw new ApiError(500, "Failed to create user");
    }


    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    // check for user creation
    if(!createdUser){
        throw new ApiError(500, "Failed to create user");
    }

    // return res
    res.status(201).json(
        new ApiResponse(200, 
            createdUser,
            "User register successfully",
        )
    )
})

export {registerUser}