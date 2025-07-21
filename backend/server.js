require("dotenv").config(); // 👈 This must be first

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const memoryRoutes = require("./routes");

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected ✅"))
  .catch((err) => console.error("MongoDB connection failed ❌", err));

app.use("/api/pins", memoryRoutes);

app.get("/", (req, res) => {
  res.send("Memory API is running");
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
