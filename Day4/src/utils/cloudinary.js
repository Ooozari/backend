import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (../.. from utils/)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });


import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
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
