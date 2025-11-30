import { Router } from "express";
import { 
  registerUser, 
  loginUser, 
  logoutUser,
  refreshAccessToken, 
  getWatchHistory, 
  getUserChannelProfile, 
  updateCoverImage, 
  updateUserAvatar, 
  updateProfile, 
  getCurrentUser, 
  changeCurrentPassword,
 } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.route("/register").post(
  upload.fields([
    // name should be competible with frontend
    {
      name: "avatar",
      maxCount: 1,
    },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser)

// secure routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/reset-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-profile").patch(verifyJWT, updateProfile)

router.route("/update-avatar").patch(verifyJWT, upload.single, updateUserAvatar)
router.route("/update-cover-image").patch(verifyJWT, upload.single, updateCoverImage)

router.route("/c/:username").get(verifyJWT,getUserChannelProfile)
router.route("/watch-history").get(verifyJWT,getWatchHistory)


export default router;
