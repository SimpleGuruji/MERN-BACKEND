import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Content is required.");
  }

  const tweet = await Tweet.create({
    content,
    owner: req.user?._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(200, tweet, "Tweet created successfully."));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID.");
  }

  const { page = 1, limit = 10 } = req.query;

  const pageNumber = parseInt(page, 10);

  if (isNaN(pageNumber) || pageNumber <= 0) {
    throw new ApiError(400, "Page number must be a positive integer.");
  }

  const limitNumber = parseInt(limit, 10);

  if (isNaN(limitNumber) || limitNumber <= 0) {
    throw new ApiError(400, "Limit number must be a positive integer.");
  }

  const skip = (pageNumber - 1) * limitNumber;

  const userExists = await User.exists({ _id: userId });
  if (!userExists) {
    throw new ApiError(404, "User not found.");
  }

  const totalTweets = await Tweet.countDocuments({ owner: userId });

  const tweets = await Tweet.find({ owner: userId })
    .skip(skip)
    .limit(limitNumber)
    .sort({ createdAt: "descending" })
    .exec();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        tweets,
        count: totalTweets,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(totalTweets / limitNumber),
        },
      },
      "User tweets fetched successfully."
    )
  );
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id.");
  }

  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Content is required.");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found.");
  }

  if (tweet.owner.toString() !== req.user?._id?.toString()) {
    throw new ApiError(401, "You are not authorized to update this tweet.");
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully."));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id.");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found.");
  }

  if (tweet.owner.toString() !== req.user?._id?.toString()) {
    throw new ApiError(401, "You are not authorized to delete this tweet.");
  }

  await Tweet.findByIdAndDelete(tweetId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully."));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
