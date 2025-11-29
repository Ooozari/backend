import fs from 'fs'

export const deleteLocalFile = (path) => {
    try {
        // Checking is the file exit in the system.
        if(path && fs.existsSync(path)){
            // must be async 
            fs.unlink(path)
        }
    } catch (error) {
        console.error("Failed to delete local file:", error);
    }
} 