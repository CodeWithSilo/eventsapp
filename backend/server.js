const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve frontend
app.use(express.static(path.join(__dirname, "../frontend")));

const fs = require("fs");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
// Routes
app.use("/auth", require("./routes/auth"));
app.use("/events", require("./routes/events"));
app.use("/posts", require("./routes/posts"));
app.use("/comments", require("./routes/comments"));
app.use("/messages", require("./routes/messages"));

// Default route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/login.html"));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});