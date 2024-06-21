import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id.");
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

  const totalComments = await Comment.countDocuments({ video: videoId });

  const comments = await Comment.find({ video: videoId })
    .skip(skip)
    .limit(limitNumber)
    .sort({ createdAt: "descending" })
    .exec();

  if (comments.length === 0) {
    throw new ApiError(404, "No comments found for video with id " + videoId);
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        comments,
        count: totalComments,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(totalComments / limitNumber),
        },
      },
      "Comments fetched successfully."
    )
  );
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id.");
  }

  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "Content is required.");
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment added successfully."));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id.");
  }

  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "Content is required.");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found.");
  }

  if (comment.owner.toString() !== req.user?._id?.toString()) {
    throw new ApiError(401, "You are not authorized to update the comment.");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    { $set: { content } },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedComment, "Comment updated successfully.")
    );
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id.");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found.");
  }

  if (comment.owner.toString() !== req.user?._id?.toString()) {
    throw new ApiError(401, "You are not authorized to delete the comment.");
  }

  await Comment.findByIdAndDelete(commentId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully."));
});

export { getVideoComments, addComment, updateComment, deleteComment };
