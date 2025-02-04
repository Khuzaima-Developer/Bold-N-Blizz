require("dotenv").config({ path: "../.env" });
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function deleteFilesInBatches(batchSize = 90) {
  try {
    let nextCursor = null; // Used for pagination
    let deletedFilesCount = 0;

    do {
      // Fetch up to 500 files (we'll process in batches of 90)
      const { resources, next_cursor } = await cloudinary.api.resources({
        type: "upload",
        max_results: 500,
        next_cursor: nextCursor, // Continue from last batch
      });

      if (resources.length === 0) {
        console.log("✅ No more files to delete.");
        break;
      }

      while (resources.length > 0) {
        // Take the first 90 files from the list
        const batch = resources
          .splice(0, batchSize)
          .map((file) => file.public_id);

        // Delete batch of 90 files
        await cloudinary.api.delete_resources(batch);
        deletedFilesCount += batch.length;

        console.log(
          `🗑 Deleted ${batch.length} files. Total Deleted: ${deletedFilesCount}`
        );
      }

      // Continue fetching files if there's more
      nextCursor = next_cursor;
    } while (nextCursor);

    console.log("✅ All files deleted successfully!");
  } catch (error) {
    console.error("❌ Error Deleting Files:", error);
  }
}

// Run the deletion function
// deleteFilesInBatches();

module.exports = deleteFilesInBatches;
