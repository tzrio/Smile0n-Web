require("dotenv").config();

const express = require("express");

const app = express();

const productRoutes = require("./routes/productRoutes");

app.use(express.json());

app.get("/", (req,res)=>{
    res.send("Product Service Running");
});

app.use("/products", productRoutes);

app.listen(process.env.PORT, () => {
    console.log(
        `Product Service running on port ${process.env.PORT}`
    );
});