import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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
    [username, email, fullName, password].some((feild) => feild?.trim() === "")
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
  // 1️⃣ Get user credentials from request body (username/email and password)
  const { username, email, password } = req.body;

  // 2️⃣ Validate input fields (ensure neither is empty)
  if (!username && !email) {
    throw new ApiError(401, "username/email is required");
  }

  // 3️⃣ Find user in the database by username or email
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  // 4️⃣ If user not found → throw authentication error
  if (!user) {
    throw new ApiError(404, "User does not exists");
  }

  // 5️⃣ Compare entered password with hashed password stored in DB
  const isPasswordValid = await user.isPasswordCorrect(user.password);

  // 6️⃣ If password invalid → throw authentication error
  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid credentials (username/email)");
  }

  // 7️⃣ Generate access and refresh tokens for the authenticated user
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  // Now on logging in the user we have to save the cookies-token
  const LoggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  // 8️⃣ Store or update refresh token in the user's document (optional but recommended)
  // 9️⃣ Send tokens to client securely via HTTP-only cookies and response body
  // 🔟 Return a success response with basic user info (excluding sensitive fields)
  res
    .status(200)
    .cookies("accessToken", accessToken, options)
    .cookies("refreshToken", refreshToken, options)
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
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logout successful"));
});

export { registerUser, loginUser, logoutUser };
