const router = require("express").Router();
const pool = require("../db");

// ===================== SEND A MESSAGE =====================
router.post("/send", async (req, res) => {
    try {
        const { sender_id, receiver_id, message } = req.body;
        const newMessage = await pool.query(
            "INSERT INTO messages (sender_id, receiver_id, message) VALUES ($1, $2, $3) RETURNING *",
            [sender_id, receiver_id, message]
        );
        res.json(newMessage.rows[0]);
    } catch (err) {
        console.error("SEND ERROR:", err.message);
        res.status(500).json({ error: "Server Error" });
    }
});

// ===================== GET CHAT HISTORY =====================
router.get("/history/:user1/:user2", async (req, res) => {
    try {
        const { user1, user2 } = req.params;
        const history = await pool.query(
            `SELECT * FROM messages 
            WHERE (sender_id = $1 AND receiver_id = $2) 
                OR (sender_id = $2 AND receiver_id = $1)
            ORDER BY created_at ASC`,
            [user1, user2]
        );
        res.json(history.rows);
    } catch (err) {
        console.error("HISTORY ERROR:", err.message);
        res.status(500).json({ error: "Server Error" });
    }
});

// ===================== GET INBOX (RECENT CHATS) =====================
// backend/routes/messages.js
router.get("/inbox/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const inbox = await pool.query(`
            SELECT DISTINCT ON (other_user_id)
                CASE 
                    WHEN sender_id = $1 THEN receiver_id 
                    ELSE sender_id 
                END AS other_user_id,
                messages.message, 
                messages.created_at, -- Specifying the messages table
                users.name, 
                users.profile_image
            FROM messages
            JOIN users ON users.id = (
                CASE 
                    WHEN sender_id = $1 THEN receiver_id 
                    ELSE sender_id 
                END
            )
            WHERE sender_id = $1 OR receiver_id = $1
            ORDER BY other_user_id, messages.created_at DESC -- Specifying here too
        `, [userId]);

        res.json(inbox.rows);
    } catch (err) {
        console.error("INBOX ERROR:", err.message);
        res.status(500).json({ error: "Server Error" });
    }
});
module.exports = router;