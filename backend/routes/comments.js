const router = require("express").Router();
const pool = require("../db");

// Add comment
router.post("/", async (req, res) => {
  try {
    const { post_id, user_id, comment } = req.body;

    const newComment = await pool.query(
      "INSERT INTO comments(post_id, user_id, comment) VALUES($1,$2,$3) RETURNING *",
      [post_id, user_id, comment]
    );

    res.json(newComment.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;