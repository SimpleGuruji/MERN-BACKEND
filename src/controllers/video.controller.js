import { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  const videos = await Video.aggregatePaginate(query, {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { [sortBy]: sortType },
    userId: isValidObjectId(userId) ? userId : null,
    customLabels: {
      docs: "videos",
    },
  });

  if (!videos) {
    return next(new ApiError(400, "No videos found"));
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { videos: videos },
        "Videos are fetched successfully"
      )
    );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if ([title, description].some((field) => field.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const videoLocalPath = req.files?.videoFile[0].path;
  if (!videoLocalPath) {
    throw new ApiError(400, "Video is required.");
  }

  const thumbnailLocalPath = req.files?.thumbnail[0].path;
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }

  const video = await uploadOnCloudinary(videoLocalPath);
  if (!video) {
    throw new ApiError(500, "There was an error uploading video");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnail) {
    throw new ApiError(500, "There was an error uploading thumbnail");
  }

  const videoFile = await Video.create({
    videoFile: video.url,
    thumbnail: thumbnail.url,
    title,
    description,
    duration: video.duration,
    owner: req.user._id,
  });

  res
    .status(201)
    .json(new ApiResponse(201, videoFile, "Video is published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  res
    .status(200)
    .json(new ApiResponse(200, video, "Video is fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user?._id?.toString()) {
    throw new ApiError(401, "You are not authorised to update video.");
  }

  const { title, description } = req.body;
  if ([title, description].some((field) => field.trim() === "")) {
    throw new ApiError(
      400,
      "All fields are required i.e. title and description"
    );
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
      },
    },
    { new: true }
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedVideo,
        "Video details are updated successfully"
      )
    );
});

const updateVideoThumbnail = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user?._id?.toString()) {
    throw new ApiError(
      401,
      "You are not authorised to update video thumbnail."
    );
  }

  const thumbnailLocalPath = req.file.path;
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnail) {
    throw new ApiError(500, "There was an error uploading thumbnail");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        thumbnail: thumbnail.url,
      },
    },
    { new: true }
  );

  const deletePreviousThumbnail = await deleteOnCloudinary(video.thumbnail);

  if (!deletePreviousThumbnail) {
    throw new ApiError(
      500,
      "Something went wrong while deleting previous thumbnail on cloudinary."
    );
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, updatedVideo, "Video thumbnail updated successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user?._id?.toString()) {
    throw new ApiError(401, "You are not authorised to update video.");
  }
  await Video.findByIdAndDelete(videoId);

  const deletePreviousVideoFile = await deleteOnCloudinary(video.videoFile);

  if (!deletePreviousVideoFile) {
    throw new ApiError(
      500,
      "Something went wrong while deleting previous video on cloudinary."
    );
  }

  const deletePreviousThumbnail = await deleteOnCloudinary(video.thumbnail);

  if (!deletePreviousThumbnail) {
    throw new ApiError(
      500,
      "Something went wrong while deleting previous thumbnail on cloudinary."
    );
  }

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Video is deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user?._id?.toString()) {
    throw new ApiError(
      401,
      "You are not authorised to toggle publish status for video."
    );
  }

  const publishedflag = video.isPublished;
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !publishedflag,
      },
    },
    { new: true }
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedVideo,
        "Video publish status is toggled successfully"
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  updateVideoThumbnail,
  deleteVideo,
  togglePublishStatus,
};
