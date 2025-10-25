import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadOnCloudinary(localFilePath) {
 
  if (!localFilePath) return null;

  try {
    // Upload an image
    const uploadResult = await cloudinary.uploader
      .upload(localFilePath, {
        resource_type: "auto",
      })
    
    if(fs.existsSync(localFilePath)){
        fs.unlinkSync(localFilePath);
    }
    
    return uploadResult;

  } catch (error) {
    if(fs.existsSync(localFilePath)){
        fs.unlinkSync(localFilePath);
    }
    console.error("Error Uploading to Cloudinary", error);
    return null;
  }
}
