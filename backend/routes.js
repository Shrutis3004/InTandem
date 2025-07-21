const express = require("express");
const router = express.Router();
const Memoo = require("../backend/models");

router.post("/add", async (req, res) => {
  try {
    const { latitude, longitude, memory, place } = req.body;
    const newMemory = new Memoo({ latitude, longitude, memory, place });
    await newMemory.save();

    res.status(201).json(newMemory);
  } catch (error) {
    console.error("❌ Error saving memory:", error);
    res.status(500).json({ error: "Error saving memory" });
  }
});

router.get("/", async (req, res) => {
  try {
    const memories = await Memoo.find();
    res.status(200).json(memories);
  } catch (error) {
    res.status(500).json({ error: "Error fetching memories" });
  }
});

module.exports = router;
