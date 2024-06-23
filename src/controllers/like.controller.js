import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const userId = req.user?._id;

  const like = await Like.findOne({ video: videoId, likedBy: userId });

  if (like) {
    await like.deleteOne();
    return res
      .status(200)
      .json(new ApiResponse(200, "Video unliked successfully"));
  } else {
    await Like.create({
      video: videoId,
      likedBy: userId,
    });
    return res
      .status(201)
      .json(new ApiResponse(200, {}, "Video liked successfully"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const userId = req.user?._id;

  const comment = await Comment.find({ comment: commentId, likedBy: userId });

  if (comment) {
    await comment.deleteOne();
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Comment unliked successfully."));
  } else {
    await Comment.create({
      comment: commentId,
      likedBy: userId,
    });
    return res
      .status(201)
      .json(new ApiResponse(200, {}, "Comment liked successfully."));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }
  const userId = req.user?._id;

  const tweet = await Tweet.find({ tweer: tweetId, likedBy: userId });

  if (tweet) {
    await tweet.deleteOne();
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "tweet unliked successfully."));
  } else {
    await Tweet.create({
      tweet: tweetId,
      likedBy: userId,
    });
    return res
      .status(201)
      .json(new ApiResponse(200, {}, "Tweet liked successfully."));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const likedvideos = await Like.find({
    likedBy: req.user?._id,
    video: { $exists: true },
  }).populate("video");
  res
    .status(200)
    .json(
      new ApiResponse(200, likedvideos, "Liked videos are fetched successfully")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
