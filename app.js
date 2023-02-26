const express = require("express");
const app = express();
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const archiver = require("archiver");

const cors = require("cors");
app.use(cors());
app.use(express.json());

const AWS = require("aws-sdk");

const multer = require("multer");
const multerS3 = require("multer-s3");
const uuid = require("uuid");
const e = require("express");

const workbook = XLSX.readFile("sample.xlsx");
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet);

// Enable CORS for all routes
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "milk-b",
    key: (req, file, cb) => {
      const filename = uuid.v4();
      const extension = file.originalname.split(".").pop();
      cb(null, `${filename}.${extension}`);
    },
  }),
});

// Define a route for the homepage
app.get("/", function (req, res) {
  res.send("Data:");
});

app.get("/excel", (req, res) => {
  res.json(data);
});

app.post("/upload", upload.single("file"), (req, res) => {
  try {
    res.send("File uploaded successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

//Download files in a range
app.get("/download", (req, res) => {
  const startDate = new Date(req.query.startDate);
  const endDate = new Date(req.query.endDate);
  // const directoryPath = path.join(__dirname, "uploads");

  // fs.readdir(directoryPath, (err, files) => {
  //   if (err) {
  //     res.status(500).send({
  //       message: "Unable to read directory contents",
  //     });
  //     return;
  //   }

  //In Local

  // const filteredFiles = files.filter((file) => {
  //   const fileDate = new Date(
  //     fs.statSync(path.join(directoryPath, file)).mtime
  //   );

  //   return fileDate >= startDate && fileDate <= endDate;
  // });

  // if (filteredFiles === 0) {
  //   res.status(404).send({
  //     message: "No files found for the given date range",
  //   });
  //   return;
  // }

  // res.set("Content-Type", "application/zip");
  // res.set(
  //   "Content-Disposition",
  //   `attachment; filename=files-${startDate}-${endDate}.zip"`
  // );

  const output = fs.createWriteStream("files.zip");
  const archive = archiver("zip", { zlib: { level: 9 } });

  output.on("close", function () {
    console.log(archive.pointer() + " total bytes");
    console.log(
      "archiver has been finalized and the output file descriptor has closed."
    );
    res.setHeader("Content-Type", "application/octet-stream");
    res.download("files.zip");
  });

  archive.on("error", function (err) {
    throw err;
  });

  archive.pipe(output);

  const params = {
    Bucket: "milk-b",
    Prefix: "",
  };

  s3.listObjectsV2(params, (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send("Error listing objects in S3 bucket");
    } else {
      data.Contents.forEach((file) => {
        const fileDate = new Date(file.LastModified);

        if (fileDate >= startDate && fileDate <= endDate) {
          s3.getObject({ Bucket: "milk-b", Key: file.Key }, (err, data) => {
            if (err) {
              console.log(err);
              res.status(500).send("Error downloading file from S3 bucket");
            } else {
              archive.append(data.Body, { name: file.Key });
            }
          });
        }
      });
    }
    archive.finalize();
  });

  // const archive = archiver("zip");
  // archive.pipe(res);

  //In Local

  // filteredFiles.forEach((file) => {
  //   const filePath = path.join(directoryPath, file);
  //   archive.file(filePath, { name: file });
  // });

  //In AWS

  // archive.finalize();
});

app.get("/file", (req, res) => {
  const params = {
    Bucket: "milk-b",
    Key: "file.txt",
  };

  s3.getObject(params, (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error downloading S3 object");
    }

    res.setHeader("Content-Type", data.ContentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${params.Key}"`
    );
    res.send(data.Body);
  });
});

// Start the server on port 3000
app.listen(3000, function () {
  console.log("Server started on port 3000");
});
