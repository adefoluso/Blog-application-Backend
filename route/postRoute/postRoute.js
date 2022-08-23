const express = require("express");

const {
  createPostController,
  fetchPostsController,
  fetchPostController,
  updatePostController,
  deletePostController,
  likeButtonToggleController,
  dislikeButtonToggleController,
} = require("../../controller/post/postController");

const {
  photoUpload,
  postImageResize,
} = require("../../middleware/uploads/photoUpload");
const authMiddleware = require("../../middleware/auth/authMiddleware");

const postRoute = express.Router();

postRoute.post(
  "/",
  authMiddleware,
  photoUpload.single("image"),
  postImageResize,
  createPostController
);

postRoute.put("/likes", authMiddleware, likeButtonToggleController);
postRoute.put("/dislikes", authMiddleware, dislikeButtonToggleController);
postRoute.get("/", authMiddleware, fetchPostsController);
postRoute.get("/:id", fetchPostController);
postRoute.put("/:id", authMiddleware, updatePostController);
postRoute.delete("/:id", authMiddleware, deletePostController);

module.exports = { postRoute };
