const express = require('express');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

// Create an instance of Express
const app = express();

// Use CORS middleware
app.use(cors());

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const PORT = process.env.PORT || 5000;

// Endpoint to fetch PGN files based on selected level
app.get('/api/pgn-files', async (req, res) => {
  const { level } = req.query; // Get the level parameter from query

  // Ensure a level is provided
  if (!level) {
    return res.status(400).json({ error: 'Level is required' });
  }

  try {
    const { resources } = await cloudinary.search
      .expression(`folder:${level} AND format:pgn`) // Use the level as the folder name
      .execute();

    // Separate files into those that start with a number and those that start with a letter/other
    const numberFiles = [];
    const letterFiles = [];

    resources.forEach((file) => {
      const filename = file.public_id;

      // Check if the filename starts with a number
      if (/^\d/.test(filename)) {
        numberFiles.push({
          url: file.secure_url,
          filename: file.public_id,
        });
      } else {
        letterFiles.push({
          url: file.secure_url,
          filename: file.public_id,
        });
      }
    });

    // Sort number files numerically (based on the number at the start of the filename)
    numberFiles.sort((a, b) => {
      const numA = parseInt(a.filename.match(/^\d+/), 10); // Extract number from the beginning of the filename
      const numB = parseInt(b.filename.match(/^\d+/), 10); // Extract number from the beginning of the filename
      return numA - numB; // Sort numerically
    });

    // Sort letter files alphabetically by filename
    letterFiles.sort((a, b) => a.filename.localeCompare(b.filename)); // Alphabetical sort for letter files

    // Combine the two sorted arrays, number files first
    const pgnFiles = [...numberFiles, ...letterFiles];

    res.json(pgnFiles);
  } catch (error) {
    console.error('Error fetching PGN files:', error);
    res.status(500).json({ error: 'Failed to fetch PGN files' });
  }
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
