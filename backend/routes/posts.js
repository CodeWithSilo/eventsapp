// backend/routes/posts.js
const router = require("express").Router();
const pool = require("../db");
const multer = require("multer");

// ===================== MULTER SETUP =====================
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// ===================== CREATE POST =====================
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const { user_id, event_id, caption, title, location, date, time, description, visibility } = req.body;
    const image = req.file ? req.file.filename : null;
    const postVisibility = visibility || 'public';

    const post = await pool.query(
      `INSERT INTO posts(user_id, event_id, caption, title, location, date, time, description, image, visibility)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [user_id, event_id, caption, title, location, date, time, description, image, postVisibility]
    );

    res.json(post.rows[0]);
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ===================== GET ALL POSTS =====================
router.get("/", async (req, res) => {
  try {
    const posts = await pool.query(`
      SELECT posts.id, posts.user_id, posts.event_id, posts.caption, posts.title, posts.location,
             posts.date, posts.time, posts.description, posts.image, posts.created_at,
             users.name, users.profile_image,
             COUNT(likes.id) AS likes
      FROM posts
      JOIN users ON posts.user_id = users.id
      LEFT JOIN likes ON posts.id = likes.post_id
      GROUP BY posts.id, users.name, users.profile_image, posts.user_id, posts.event_id, 
          posts.caption, posts.title, posts.location, posts.date, posts.time, 
          posts.description, posts.image, posts.created_at
      ORDER BY posts.created_at DESC
    `);

    const result = [];
    for (let post of posts.rows) {
      const comments = await pool.query(`
        SELECT comments.*, users.name, users.profile_image
        FROM comments
        JOIN users ON comments.user_id = users.id
        WHERE comments.post_id=$1
        ORDER BY comments.id DESC
      `, [post.id]);

      result.push({ ...post, comments: comments.rows });
    }

    res.json(result);
  } catch (err) {
    console.error("GET POSTS ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ===================== LIKE / UNLIKE POST =====================
router.post("/like/:postId", async (req, res) => {
  try {
    const { user_id } = req.body;
    const { postId } = req.params;

    const existing = await pool.query(
      "SELECT * FROM likes WHERE post_id=$1 AND user_id=$2",
      [postId, user_id]
    );

    if (existing.rows.length === 0) {
      await pool.query("INSERT INTO likes(post_id,user_id) VALUES($1,$2)", [postId, user_id]);
    } else {
      await pool.query("DELETE FROM likes WHERE post_id=$1 AND user_id=$2", [postId, user_id]);
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ===================== UPDATE VISIBILITY =====================
router.put("/update-visibility/:postId", async (req, res) => {
    try {
        const { postId } = req.params;
        const { visibility, user_id } = req.body;

        const result = await pool.query(
            "UPDATE posts SET visibility = $1 WHERE id = $2 AND user_id = $3 RETURNING *",
            [visibility, postId, user_id]
        );

        if (result.rowCount === 0) {
            return res.status(403).json({ error: "Unauthorized or post not found" });
        }

        res.json({ message: "Visibility updated", post: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error" });
    }
});

// ===================== DELETE POST =====================
router.delete("/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const { user_id } = req.body;

    const postCheck = await pool.query(
      "SELECT * FROM posts WHERE id=$1 AND user_id=$2",
      [postId, user_id]
    );

    if (postCheck.rows.length === 0) {
      return res.status(403).json({ error: "You can only delete your own posts" });
    }

    await pool.query("DELETE FROM posts WHERE id=$1", [postId]);
    res.json({ success: true });

  } catch (err) {
    console.error("DELETE POST ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ===================== GET SINGLE POST BY ID =====================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const postQuery = await pool.query(`
      SELECT posts.id, posts.user_id, posts.event_id, posts.caption, posts.title, posts.location,
             posts.date, posts.time, posts.description, posts.image, posts.created_at,
             users.name, users.profile_image,
             COUNT(likes.id) AS likes
      FROM posts
      JOIN users ON posts.user_id = users.id
      LEFT JOIN likes ON posts.id = likes.post_id
      WHERE posts.id = $1
      GROUP BY posts.id, users.name, users.profile_image, posts.user_id, posts.event_id, 
               posts.caption, posts.title, posts.location, posts.date, posts.time, 
               posts.description, posts.image, posts.created_at
    `, [id]);

    if (postQuery.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    const post = postQuery.rows[0];

    const comments = await pool.query(`
      SELECT comments.*, users.name, users.profile_image
      FROM comments
      JOIN users ON comments.user_id = users.id
      WHERE comments.post_id = $1
      ORDER BY comments.id DESC
    `, [id]);

    post.comments = comments.rows;

    res.json(post);
  } catch (err) {
    console.error("GET SINGLE POST ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ===================== GET MY POSTS (FOR PROFILE) =====================
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const posts = await pool.query(`
      SELECT 
        posts.*,                      
        users.name, 
        users.profile_image,
        COUNT(likes.id) AS likes
      FROM posts
      JOIN users ON posts.user_id = users.id
      LEFT JOIN likes ON posts.id = likes.post_id
      WHERE posts.user_id = $1
      GROUP BY 
        posts.id,                    
        users.name, 
        users.profile_image
      ORDER BY posts.created_at DESC
    `, [userId]);

    const result = [];
    for (let post of posts.rows) {
      const comments = await pool.query(`
        SELECT comments.*, users.name, users.profile_image
        FROM comments
        JOIN users ON comments.user_id = users.id
        WHERE comments.post_id=$1
        ORDER BY comments.id DESC
      `, [post.id]);

      result.push({ ...post, comments: comments.rows });
    }

    res.json(result);
  } catch (err) {
    console.error("DATABASE ERROR:", err.message); 
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;