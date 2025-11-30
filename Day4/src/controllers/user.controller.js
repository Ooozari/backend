import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import { deleteLocalFile } from "../utils/deleteLocalFile.js";

const options = {
  httpOnly: true,
  secure: true,
};

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    // saving refresh token to database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error generating tokens (Access and Refresh)");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  const { username, email, fullName, password } = req.body;

  // validation - not empty
  if (
    [username, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "Register fields are required");
  }

  // check if user already exists: username, email
  const isExistingUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (isExistingUser) {
    throw new ApiError(409, "User with this email or password already exists");
  }

  // check for images

  //  check for avatar (required)
  const avatarLocalPath = req.files?.avatar[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }

  //  check for coverImage
  // const coverImageLocalPath = req.files?.coverImage[0]?.path no reliable method
  let coverImageLocalPath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  // upload them to cloudinary, avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
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
  });

  // Logic 1 more costly
  // const createdUser = await User.findById(user._id);
  // if(!createdUser){
  //     throw new ApiResponse(500, "Failed to create user");
  // }
  // Logic 2

  if (!user._id) {
    throw new ApiError(500, "Failed to create user");
  }

  // remove password and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // check for user creation
  if (!createdUser) {
    throw new ApiError(500, "Failed to create user");
  }

  // return res
  res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User register successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // Get user credentials from request body (username/email and password)
  const { username, email, password } = req.body;

  // Validate input fields (ensure neither is empty)
  if (!username && !email) {
    throw new ApiError(401, "username/email is required");
  }

  // Find user in the database by username or email
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  // If user not found → throw authentication error
  if (!user) {
    throw new ApiError(404, "User does not exists");
  }

  // Compare entered password with hashed password stored in DB
  const isPasswordValid = await user.isPasswordCorrect(password);

  // If password invalid → throw authentication error
  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid credentials (username/email)");
  }

  // Generate access and refresh tokens for the authenticated user
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  // Now on logging in the user we have to save the cookies-token
  const LoggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // const options = {
  //   httpOnly: true,
  //   secure: true,
  // };

  // Store or update refresh token in the user's document (optional but recommended)
  // Send tokens to client securely via HTTP-only cookies and response body
  // Return a success response with basic user info (excluding sensitive fields)
  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: LoggedInUser,
          accessToken,
          refreshToken,
        },
        "User login successfull"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized request");
  }

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  // const options = {
  //   httpOnly: true,
  //   secure: true,
  // };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logout successful"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    // we can access the refresh token from the cookies
    // user have encrypted token in his browser
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body.refreshToken;

    // if(!incomingRefreshToken) -> Unauthorized
    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
    }

    // verify the token is it valid using jwt -> this will give us decoded user
    // getting the decrypted token
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // find the user based on id
    const user = await User.findById(decodedToken._id);

    // if no user -> error invalid token refresh
    if (!user) {
      throw new ApiError(401, "Invalid or expired refresh token");
    }
    // match the token with user DB token if(!match) -> error expire or invalid token
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    // else now we have to update/set new token using generateAccessAndRefreshToken
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);
    // in the res return the status and set the cookies
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword && !newPassword) {
    throw new ApiError(400, "Passwords are required");
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "No user found with this email");
  }

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(400, "Incorrect password");
  }

  user.password = newPassword;
  await user.save({
    validateBeforeSave: false,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;

  return res.status(200).json(200, user, "User fetched Successfully");
});

const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "Full Name and Email is required");
  }

  // feilds to update
  const feildsToUpdate = {};
  if (fullName) feildsToUpdate.fullName = fullName;
  if (email) feildsToUpdate.email = email;

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: feildsToUpdate,
    },
    { new: true }
  ).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Profile updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const localAvatarUrl = req.file?.path;
  if (!localAvatarUrl) {
    throw new ApiError(400, "Missing Avatar");
  }
  const avatar = await uploadOnCloudinary(localAvatarUrl);

  deleteLocalFile(localAvatarUrl);
  if (!avatar) {
    throw new ApiError(500, "Failed to upload avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { avatar: avatar.url },
        "Avatar Uploaded successfully"
      )
    );
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const localCoverImageUrl = req.file?.path;

  if (!localCoverImageUrl) {
    throw new ApiError(400, "Missing cover image");
  }
  const coverImage = await uploadOnCloudinary(localCoverImageUrl);

  // deleting the file from local server after successfully uploading to cloudinary
  // fs.unlinkSync(localCoverImageUrl)

  deleteLocalFile(localCoverImageUrl);

  if (!coverImage) {
    throw new ApiError(500, "Failed to upload cover image");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { coverImage: coverImage.url },
        "Cover image Uploaded successfully"
      )
    );
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  // we will get username from params
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  // aggregation pipeline
  const channel = await User.aggregate([
    // pipeline1: Get User Document
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    // pipeline2: Get subscribers
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel", // channelID
        as: "subscribers",
      },
    },
    // pipeline3: Get User subscribedTo Channels
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber", // SubscrberID
        as: "subscribedTo",
      },
    },
    // pipeline4: Adding Feilds for counts and isCurrentUserSubscribed
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers",
        },
        channelSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isCurrentUserSubscribed: {
          $cond: {
            if: {
              $in: [
                new mongoose.Types.ObjectId(req.user?._id),
                "$subscribers.subscriber",
              ],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    // pipeline5: sending value specific
    {
      $project: {
        fullName: 1,
        username: 1,
        subscriberCount: 1,
        channelSubscribedToCount: 1,
        isCurrentUserSubscribed: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        createdAt: 1,
      },
    },
  ]);

  if (!channel || !channel.length) {
    throw new ApiError(404, "Channel does not exist");
  }

  //TODO: Log the channel

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "Success, Channel details Fetched.")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory", // array of videos ids
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerDetails",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          // pipeline to give object instead of array
          {
            $addFields: {
              ownerDetails : {
                $first: "$ownerDetails",
              }
            }
          }
        ],
      },
    },
    {
      $project: {
        watchHistory: 1
      }
    }
    
  ]);

  if(!user || user.length === 0){
    throw new ApiError(404, "Failed to find user, to get watch history")
  }

  return res.status(200)
  .json(new ApiResponse(200, user[0].watchHistory, "Success, fetching user watch history"))
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateProfile,
  updateUserAvatar,
  updateCoverImage,
  getUserChannelProfile,
};

// const updateProfile = asyncHandler(async (req, res)=> {

// })
