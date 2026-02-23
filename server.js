const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const port = process.env.UPLOAD_SERVER_PORT || 5000;
const uploadsRoot = path.join(__dirname, "uploads");

const resolveFolderName = (value, fallback = "questions") => {
    const normalized = String(value || "").trim().replace(/[^a-zA-Z0-9-_]/g, "");
    return normalized || fallback;
};

if (!fs.existsSync(uploadsRoot)) {
    fs.mkdirSync(uploadsRoot, { recursive: true });
}

app.use(cors());
app.use("/uploads", express.static(uploadsRoot));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folderName = resolveFolderName(req.query.folderName || req.body.folderName, "questions");
        const targetDir = path.join(uploadsRoot, folderName);

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        cb(null, targetDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname || "");
        const baseName = path
            .basename(file.originalname || "image", ext)
            .replace(/[^a-zA-Z0-9-_]/g, "-");

        cb(null, `${Date.now()}-${baseName}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype && file.mimetype.startsWith("image/")) {
            cb(null, true);
            return;
        }

        cb(new Error("Only image files are allowed"));
    }
});

app.post("/api/upload", upload.single("image"), (req, res) => {
    if (!req.file) {
        res.status(400).json({ message: "No file uploaded" });
        return;
    }

    const folderName = resolveFolderName(req.query.folderName || req.body.folderName, "questions");
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${folderName}/${req.file.filename}`;

    res.json({ url: fileUrl });
});

app.use((error, req, res, next) => {
    if (error) {
        res.status(400).json({ message: error.message || "Upload failed" });
        return;
    }

    next();
});

app.listen(port, () => {
    console.log(`Upload server running at http://localhost:${port}`);
});
