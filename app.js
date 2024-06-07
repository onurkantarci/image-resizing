const express = require("express");
const fileUpload = require("express-fileupload");
const sharp = require("sharp");
const mongoose = require("mongoose");
const Image = require("./models/image-model");
const path = require("path");
const fs = require("fs");
const app = express();

mongoose
  .connect("mongodb://localhost/imageResizeDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

app.use(fileUpload());

const uploadPath = path.join(__dirname, "/resized-photos/");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}

app.post("/resize", async (req, res) => {
  const width = parseInt(req.query.w);
  const height = parseInt(req.query.h);

  if (!req.files || !req.files.image) {
    return res.status(400).send("No file uploaded.");
  }

  if (isNaN(width) || isNaN(height)) {
    return res.status(400).send("Invalid width or height.");
  }

  try {
    const image = req.files.image;

    const resizedImageBuffer = await sharp(image.data)
      .resize(width, height)
      .jpeg()
      .toBuffer();

    const resizedFileName = `resized_${Date.now()}.jpeg`;
    const resizedFilePath = path.join(uploadPath, resizedFileName);

    fs.writeFileSync(resizedFilePath, resizedImageBuffer);

    const imageMetadata = new Image({
      filename: resizedFileName,
      originalName: image.name,
      size: resizedImageBuffer.length,
      mimeType: "image/jpeg",
      width,
      height,
    });

    await imageMetadata.save();

    res.set("Content-Type", "image/jpeg");
    res.send(resizedImageBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error processing the image.");
  }
});

app.get("/images", async (req, res) => {
  try {
    const images = await Image.find().exec();
    res.json(images);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving images.");
  }
});

app.get("/download/:id", async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).send("Image not found.");
    }

    res.download(
      path.join(uploadPath, image.filename),
      image.filename,
      (err) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Error downloading file");
        }
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving the image.");
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`App listening on ${PORT}`);
});
