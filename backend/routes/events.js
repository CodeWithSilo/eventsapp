const router = require("express").Router();
const pool = require("../db");

// CREATE EVENT
router.post("/", async (req, res) => {
    const { title, description, location, latitude, longitude, date, time } = req.body;

    const newEvent = await pool.query(
    "INSERT INTO events(title,description,location,latitude,longitude,date,time) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *",
    [title, description, location, latitude, longitude, date, time]
    );

    res.json(newEvent.rows[0]);
});

// GET ALL EVENTS
router.get("/", async (req, res) => {
  const events = await pool.query("SELECT * FROM events ORDER BY id DESC");
    res.json(events.rows);
});

module.exports = router;