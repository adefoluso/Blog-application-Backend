const expressAsyncHandler = require("express-async-handler");
const fs = require("fs");
const User = require("../../model/user/User");
const crypto = require("crypto");
const generateToken = require("../../config/token/generateToken");
const validateMongodbId = require("../../utils/validateMongodbID");
const nodemailer = require("nodemailer");
const cloudinaryUploadImage = require("../../utils/cloudinary");

//----------------------//
//Register
//----------------------//
const userRegisterController = expressAsyncHandler(async (req, res) => {
  //check if user exists
  const userExists = await User.findOne({ email: req?.body?.email });

  if (userExists) throw new Error("User already exists");
  try {
    //Register user
    const user = await User.create({
      firstName: req?.body?.firstName,
      lastName: req?.body?.lastName,
      email: req?.body?.email,
      password: req?.body?.password,
    });
    res.json(user);
  } catch (error) {
    res.json(error);
  }
});

//----------------------//
//Login User
//----------------------//
const loginController = expressAsyncHandler(async (req, res) => {
  const { email, password } = req.body;

  //check if user exists
  const userFound = await User.findOne({ email });

  //check if password is a matching
  if (userFound && (await userFound.isPasswordMatching(password))) {
    res.json({
      _id: userFound?._id,
      firstName: userFound?.firstName,
      lastName: userFound?.lastName,
      email: userFound?.email,
      profilePhoto: userFound?.profilePhoto,
      isAdmin: userFound?.isAdmin,
      token: generateToken(userFound?._id),
      isVerified: userFound?.isAccountVerified,
    });
  } else {
    res.status(401);
    throw new Error("Invalid login credentials");
  }
});

//-----------------
//FETCH ALL USERS
//-----------------
const fetchUsersController = expressAsyncHandler(async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    res.json(error);
  }
});

//----------------------//
//Delete users
//----------------------//

const deleteUserController = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;

  //check if user if user id is validate

  validateMongodbId(id);

  try {
    const deletedUser = await User.findByIdAndDelete(id);
    res.json(deletedUser);
  } catch (error) {
    res.json(error);
  }
});

const fetchUserDetailsController = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;

  //check if user id is valida
  validateMongodbId(id);

  try {
    const user = await User.findById(id);
    res.json(user);
  } catch (error) {
    res.json(error);
  }
});

//-----------------------------------------------------------//
//USER PROFILE only logged in users can have access to profile
//------------------------------------------------------------//

const userProfileController = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);
  try {
    const myProfile = await User.findById(id).populate("posts");
    res.json(myProfile);
  } catch (error) {
    res.json(error);
  }
});

//-----------------------------------------------------------//
//Update profile
//------------------------------------------------------------//

const updateProfileController = expressAsyncHandler(async (req, res) => {
  const { _id } = req?.user;
  validateMongodbId(_id);

  const user = await User.findByIdAndUpdate(
    _id,
    {
      firstName: req?.body?.firstName,
      lastName: req?.body?.lastName,
      email: req?.body?.email,
      bio: req?.body?.bio,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  res.json(user);
});

//-----------------------------------------------------------//
//Update password
//------------------------------------------------------------//
const updateUserPasswordController = expressAsyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { password } = req.body;
  validateMongodbId(_id);
  //find user by _id
  const user = await User.findById(_id);
  if (password) {
    user.password = password;
    const updatedUser = await user.save();
    res.json(updatedUser);
  }
  res.json(user);
});

//-----------------------------------------------------------//
//following
//------------------------------------------------------------//

const followingUserController = expressAsyncHandler(async (req, res) => {
  //followed user
  //followId-> this is the person a logged in user has chosen to follow
  //loginUserId-> this is the id of the logged in user who wants to follow a person
  const { followId } = req.body;
  const loginUserId = req.user.id;

  //find the target user and check if the logged in user already is following
  const targetUser = await User.findById(followId);
  console.log(targetUser);

  const alreadyFollowing = targetUser?.followers?.find(
    (user) => user?.toString() === loginUserId.toString()
  );

  if (alreadyFollowing) throw new Error("You are already following this user");

  await User.findByIdAndUpdate(
    followId,
    {
      $push: { followers: loginUserId },
      isFollowing: true,
    },
    {
      new: true,
    }
  );

  //update the logged in user field to show he/she is now a follower
  await User.findByIdAndUpdate(
    loginUserId,
    {
      $push: { following: followId },
    },
    {
      new: true,
    }
  );
  res.json("You now follow this user");
});

//-----------------------------------------------------------//
//unfollow
//------------------------------------------------------------//
const unfollowUserController = expressAsyncHandler(async (req, res) => {
  const { unfollowId } = req.body;
  const loginUserId = req.user.id;

  await User.findByIdAndUpdate(
    unfollowId,
    {
      $pull: { followers: loginUserId },
      isFollowing: false,
    },
    { new: true }
  );

  await User.findByIdAndUpdate(
    loginUserId,
    {
      $pull: { following: unfollowId },
    },
    { new: true }
  );
  res.json("you have successfully unfollowed user");
});

/******Block User**********/

const blockUserController = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  const user = await User.findByIdAndUpdate(
    id,
    {
      isBlocked: true,
    },
    { new: true }
  );
  res.json(user);
});

/******Unblocking a user*********/

const unblockUserController = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  const user = await User.findByIdAndUpdate(
    id,
    {
      isBlocked: false,
    },
    { new: true }
  );
  res.json(user);
});

/******Generate email verification token- send Email**********/

const generateTokenController = expressAsyncHandler(async (req, res) => {
  const loginUserId = req.user.id; //check if user is logged in
  console.log(loginUserId);
  const user = await User.findById(loginUserId);
  console.log(user);

  try {
    const verificationToken = await user.createAccountVerificationToken();
    console.log(verificationToken);
    //save the user token
    await user.save();
    console.log(verificationToken);

    const resetURL = `If you are requested to verify your account, verify now within 10 minutes, otherwise ignore this message <a href="http://localhost:3000/verify-account/${verificationToken}">Click to verify</a>`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: "BLOGAPP",
      to: "fuuuuuuxl@gmail.com",
      subject: "this is a test mail from the app",
      html: resetURL,
    };

    transporter.sendMail(mailOptions, function (error) {
      if (error) {
        res.json(error);
      } else {
        res.json(resetURL);
      }
    });
  } catch (error) {
    res.json(error);
  }
});

/******Account Verfication**********/
const accountVerificationCtrl = expressAsyncHandler(async (req, res) => {
  const { token } = req.body;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  // //find this user by token
  const userFound = await User.findOne({
    accountVerificationToken: hashedToken,
    accountVerificationTokenExpires: { $gt: new Date() },
  });
  if (!userFound) throw new Error("Token expired");
  //update the isAccountverified property to true
  userFound.isAccountVerified = true;
  userFound.accountVerificationToken = undefined;
  userFound.accountVerificationTokenExpires = undefined;
  await userFound.save();
  res.json(userFound);
});

//-----------------------------------//
// FORGET PASSWORD TOKEN GENERATOR
//-----------------------------------//

const forgetPasswordToken = expressAsyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("user not found");
  }

  try {
    const token = await user.generatePasswordResetToken();
    await user.save();

    const resetURL = `If you are requested to reset your password, reset within 10 minutes of receiving the token, otherwise ignore this message <a href="http://localhost:3000/reset-password/${token}">Click to Reset password</a>`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: "folusoadefoluso21@gmail.com",
      to: email,
      subject: "Reset Password",
      html: resetURL,
    };

    transporter.sendMail(mailOptions, function (error) {
      if (error) {
        res.json(error);
      } else {
        res.json({
          message: `A verification mail is succesfully sent to ${user?.email}. The link expires in 10 minutes, ${resetURL}`,
        });
      }
    });
  } catch (error) {
    res.json(error);
  }
});

//-----------------------------------//
// PASSWORD RESET UPDATE
//-----------------------------------//

const passwordResetController = expressAsyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  //find user by tokens
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) throw new Error("Token, Expired, try again later");

  try {
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;

    await user.save();
    res.json(user);
  } catch (error) {
    res.json(error);
  }
});

//-----------------------------------//
// Profile Photo Upload
//-----------------------------------//

const profilePhotoUploadController = expressAsyncHandler(async (req, res) => {
  //find login user
  const { _id } = req.user;

  //   console.log(req.user);

  //get path to image
  const localPath = `public/images/profile/${req.file.filename}`;
  //upload to cloudinary
  const imageUploaded = await cloudinaryUploadImage(localPath);

  const foundUser = await User.findByIdAndUpdate(
    _id,
    {
      profilePhoto: imageUploaded?.url,
    },
    { new: true }
  );

  //upload to cloudinary
  res.json(imageUploaded);

  //remove the saved image from localpath
  fs.unlinkSync(localPath);
});

module.exports = {
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
};
