const express = require("express");
const router = express.Router();

const {
    getGalleries,
    getGalleryById,
    createGallery,
    updateGallery,
    deleteGallery
} = require("../controllers/gallery_control");

router.get("/", getGalleries);
router.get("/:id", getGalleryById);
router.post("/", createGallery);
router.put("/:id", updateGallery);
router.delete("/:id", deleteGallery);

module.exports = router;