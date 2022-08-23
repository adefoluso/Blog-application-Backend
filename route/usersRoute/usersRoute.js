const express = require("express");
const usersRoute = express.Router();

const {
  userRegisterController,
  loginController,
  fetchUsersController,
  deleteUserController,
  fetchUserDetailsController,
  userProfileController,
  updateProfileController,
  updateUserPasswordController,
  followingUserController,
  unfollowUserController,
  blockUserController,
  unblockUserController,
  generateTokenController,
  accountVerificationCtrl,
  forgetPasswordToken,
  passwordResetController,
  profilePhotoUploadController,
} = require("../../controller/users/usersController");

const authMiddleware = require("../../middleware/auth/authMiddleware");
const {
  photoUpload,
  profilePhotoResize,
} = require("../../middleware/uploads/photoUpload");

usersRoute.post("/register", userRegisterController);
usersRoute.post("/login", loginController);
usersRoute.post(
  "/generate-verify-email-token",
  authMiddleware,
  generateTokenController
);
usersRoute.put("/verify-account", authMiddleware, accountVerificationCtrl);
usersRoute.put(
  "/profilephoto-upload",
  authMiddleware,
  photoUpload.single("image"),
  profilePhotoResize,
  profilePhotoUploadController
);
usersRoute.post("/forget-password-token", forgetPasswordToken);
usersRoute.put("/reset-password", passwordResetController);
usersRoute.get("/", authMiddleware, fetchUsersController);
usersRoute.put("/follow", authMiddleware, followingUserController);
usersRoute.put("/unfollow", authMiddleware, unfollowUserController);
usersRoute.put("/:id", authMiddleware, updateProfileController);
usersRoute.put("/block-user/:id", authMiddleware, blockUserController);
usersRoute.put("/unblock-user/:id", authMiddleware, unblockUserController);
usersRoute.put("/password/:id", authMiddleware, updateUserPasswordController); //there is a bug here fix later
usersRoute.delete("/:id", deleteUserController);
usersRoute.get("/:id", fetchUserDetailsController);
usersRoute.get("/profile/:id", authMiddleware, userProfileController);

module.exports = { usersRoute };
