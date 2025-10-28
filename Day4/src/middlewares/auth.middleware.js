import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"


export const verifyJWT = asyncHandler(async (req, _, next) => {
   try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
 
    if(!token){
     throw new ApiError(401, "Unauthorized request")
    }
 
    // Now verify is token valid
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
 
    const user = await User.findById(decodedToken._id).select("-password -refreshToken")
 
    if(!user){
     // mean the access token is invalid
     throw new ApiError(401, "Invalid access token")
    }
 
    // now add the object user to req
    req.user = user;
    next();
   } catch (error) {
        throw new ApiError(401,"Invalid access token")
   }
})