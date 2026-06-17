const express = require("express");
const router = express.Router();

const { registerUser,
        loginUser,
        getUsers,
        getProfile
    } = require("../controllers/authController");

const verifyToken =
require("../middleware/authMiddleware");    

router.post("/register", registerUser);

router.post("/login", loginUser)

router.get("/users", getUsers);

router.get("/profile", verifyToken, getProfile);

module.exports = router;