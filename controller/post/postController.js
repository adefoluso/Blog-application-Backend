const expressAsyncHandler = require("express-async-handler");
const Filter = require("bad-words");
const fs = require("fs");
const User = require("../../model/user/User");
const Post = require("../../model/post/post");
const validateMongodbId = require("../../utils/validateMongodbID");
const cloudinaryUploadImage = require("../../utils/cloudinary");

//----------------------//
//CREATE POST CONTROLLER
//----------------------//

const createPostController = expressAsyncHandler(async (req, res) => {
  const { _id } = req.user;
  // validateMongodbId(req.body.user);

  //check for bad words

  const filter = new Filter(); //instance of filter fxn
  const isProfane = filter.isProfane(req.body.title, req.body.description);
  console.log(isProfane);

  //Block user
  if (isProfane) {
    await User.findByIdAndUpdate(_id, {
      isBlocked: true,
    });
    throw new Error(
      "Post can not be created because it contains profane words and you have been blocked"
    );
  }

  //get path to image
  const localPath = `public/images/posts/${req.file.filename}`;
  //upload to cloudinary
  const imageUploaded = await cloudinaryUploadImage(localPath);

  console.log(req.file);

  try {
    const post = await Post.create({
      ...req.body,
      image: imageUploaded?.url,
      user: _id,
    });
    res.json(imageUploaded);

    //remove uploaded imagescal

    fs.unlinkSync(localPath);
  } catch (error) {
    res.json(error);
  }
});

//----------------------//
//Fetch all Posts CONTROLLER
//----------------------//

const fetchPostsController = expressAsyncHandler(async (req, res) => {
  try {
    const posts = await Post.find({}).populate("user");
    res.json(posts);
  } catch (error) {}
});

//----------------------//
//Fetch a Single Post CONTROLLER
//----------------------//

const fetchPostController = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  try {
    const post = await Post.findById(id).populate("user");
    //update number of views

    await Post.findByIdAndUpdate(
      id,
      {
        $inc: { numberOfViews: 1 },
      },
      { new: true }
    );
    res.json(post);
  } catch (error) {
    res.json(error);
  }
});

//----------------------//
//Update Post Controller
//----------------------//

const updatePostController = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  try {
    const post = await Post.findByIdAndUpdate(
      id,
      {
        ...req.body,
        user: req.user?._id,
      },
      { new: true }
    );

    res.json(post);
  } catch (error) {
    res.json(error);
  }
});

//----------------------//
//Delete Post Controller
//----------------------//

const deletePostController = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  try {
    const post = await Post.findByIdAndDelete(id);
    res.json(post);
  } catch (error) {
    res.json(error);
  }
});

//----------------------//
// Likes Controller
//----------------------//

const likeButtonToggleController = expressAsyncHandler(async (req, res) => {
  // console.log(req.user)
  const { postId } = req.body;

  const post = await Post.findById(postId);

  //get the logged in users

  const loginUserId = req?.user?._id;

  //check whether user has already liked this post

  const isLiked = post?.isLiked;

  const alreadyDisliked = post?.dislikes?.find(
    (userId) => userId?.toString() === loginUserId?.toString()
  );

  // remove user from the dislikes array if already exists

  if (alreadyDisliked) {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { dislikes: loginUserId },
        isDisliked: false,
      },
      { new: true }
    );

    res.json(post);
  }

  //toggle, remove user is he has already liked the post

  if (isLiked) {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { likes: loginUserId },
        isLiked: false,
      },
      {
        new: true,
      }
    );

    res.json(post);
  } else {

    //add to likes

    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: { likes: loginUserId },
        isLiked: true,
      },
      { new: true }
    );
    res.json(post)
  }
});

//----------------------//
// dislikes
//----------------------//

const dislikeButtonToggleController = expressAsyncHandler(async (req, res) => {
    res.json("dislikes")
})


module.exports = {
  createPostController,
  fetchPostsController,
  fetchPostController,
  updatePostController,
  deletePostController,
  likeButtonToggleController,
  dislikeButtonToggleController
};
