require("dotenv").config();

const express = require("express");
const app = express();

require("./config/db");

const galleryRoutes =
require("./routes/gallery_routes");

app.use(express.json());

app.use("/gallery", galleryRoutes);

app.get("/", (req, res) => {
    res.send("Gallery Service Running");
});

app.listen(3002, () => {
    console.log(
        "Gallery Service running on port 3002"
    );
});