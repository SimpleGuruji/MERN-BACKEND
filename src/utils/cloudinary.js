import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file has been uploaded successfull
    // console.log("file is uploaded on cloudinary ", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
    return null;
  }
};

const deleteOnCloudinary = async (imageUrl) => {
  try {
    const incomingImageUrl = imageUrl;
    const imageArray = incomingImageUrl.split("/");
    const image = imageArray[imageArray.length - 1];
    const imageName = image.split(".")[0];

    const response = await cloudinary.uploader.destroy(
      imageName,
      (err, result) => {
        if (err) return console.log(err);
        console.log("file is deleted on cloudinary ", result);
      }
    );
    return response;
  } catch (error) {
    console.error("Error deleting file on Cloudinary: ", error);
    return null;
  }
};

export { uploadOnCloudinary, deleteOnCloudinary };
