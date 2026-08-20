const multer = require("multer");

const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        cb(null, "profile-" + Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

const router = require("express").Router();
const pool = require("../db");
const bcrypt = require("bcrypt");

// ================= REGISTER =================
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, matric_no } = req.body;

    // 🔒 Validate matric number
        if (!matric_no) {
            return res.status(400).json("Matric number is required");
        }

    const hash = await bcrypt.hash(password, 10);

    const user = await pool.query(
        "INSERT INTO users(name,email,password,matric_no) VALUES($1,$2,$3,$4) RETURNING *",
        [name, email, hash, matric_no]
    );

    res.json(user.rows[0]);

    } catch (err) {
    console.error(err);
    res.status(500).json("Error registering user");
    }
});


// ================= LOGIN =================
router.post("/login", async (req, res) => {
    try {
    const { email, password } = req.body;

    const user = await pool.query(
      "SELECT * FROM users WHERE email=$1",
        [email]
    );

    if (user.rows.length === 0)
            return res.status(400).json("User not found");

    const valid = await bcrypt.compare(password, user.rows[0].password);

    if (!valid)
        return res.status(401).json("Wrong password");

    // 🔒 Block users without matric number
    if (!user.rows[0].matric_no) {
            return res.status(403).json("No matric number. Access denied.");
    }

    res.json(user.rows[0]);

        } catch(err){
            console.error("LOGIN ERROR:",err);
            res.status(500).json({error:"Login error"});
        }
});


// ================= GET USER =================
router.get("/user/:id", async (req, res) => {
    try {
        const user = await pool.query(
            "SELECT id, name, email, matric_no, points, profile_image FROM users WHERE id=$1",
            [req.params.id]
        );
        res.json(user.rows[0]);
    } catch (err) {
        res.status(500).json("Error fetching user");
    }
});


router.post("/upload-profile", upload.single("image"), async (req, res) => {
    try {
        const { user_id } = req.body;

        const image = req.file.filename;

    await pool.query(
        "UPDATE users SET profile_image=$1 WHERE id=$2",
        [image, user_id]
    );

    res.json({ message: "Profile updated", image });

    } catch (err) {
        console.error(err);
        res.status(500).json("Error uploading profile");
    }
});


// Search for a student by Matric Number
router.get("/search/:matric", async (req, res) => {
    try {
        const { matric } = req.params;
        // Search the users table for a matching matric number
        const user = await pool.query(
            "SELECT id, name, matric_no, profile_image FROM users WHERE matric_no ILIKE $1",
            [`%${matric}%`]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ error: "No student found" });
        }

        // Return the first match
        res.json(user.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// backend/routes/auth.js

// backend/routes/auth.js

router.delete("/delete-account/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Perform the deletion
        const result = await pool.query("DELETE FROM users WHERE id = $1", [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "Account deleted successfully" });
    } catch (err) {
        console.error("Delete Error:", err.message);
        // If this fails, check if you have ON DELETE CASCADE on your posts/messages tables
        res.status(500).json({ error: "Server error: Check database constraints" });
    }
});

// ===================== GET USER BY ID =====================
router.get("/user/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const user = await pool.query(
            "SELECT id, name, email, matric_no, points, profile_image FROM users WHERE id = $1", 
            [id]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user.rows[0]);
    } catch (err) {
        console.error("GET USER BY ID ERROR:", err.message);
        res.status(500).json({ error: "Server error" });
    }
});
module.exports = router;