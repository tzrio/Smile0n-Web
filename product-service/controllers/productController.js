const db = require("../config/db");

const getProducts = (req,res)=>{

    const sql =
        "SELECT * FROM products";

    db.query(
        sql,
        (err,result)=>{

            if(err){

                return res.status(500).json({
                    message:"Database Error"
                });

            }

            res.json(result);

        }
    );

};

const getProductById = (req,res)=>{

    const productId = req.params.id;

    const sql =
        "SELECT * FROM products WHERE id = ?";

    db.query(
        sql,
        [productId],
        (err,result)=>{

            if(err){

                return res.status(500).json({
                    message:"Database Error"
                });

            }

            if(result.length === 0){

                return res.status(404).json({
                    message:"Produk tidak ditemukan"
                });

            }

            res.json(result[0]);

        }
    );

};

const createProduct = (req,res)=>{

    const {
        nama_produk,
        kategori,
        deskripsi,
        harga,
        gambar,
        estimasi_pengerjaan,
        status_ketersediaan
    } = req.body;

    const sql = `
        INSERT INTO products
        (
            nama_produk,
            kategori,
            deskripsi,
            harga,
            gambar,
            estimasi_pengerjaan,
            status_ketersediaan
        )
        VALUES (?,?,?,?,?,?,?)
    `;

    db.query(
        sql,
        [
            nama_produk,
            kategori,
            deskripsi,
            harga,
            gambar,
            estimasi_pengerjaan,
            status_ketersediaan || "tersedia"
        ],
        (err,result)=>{

            if(err){

                return res.status(500).json({
                    message:"Gagal menambah produk",
                    error:err.message
                });

            }

            res.status(201).json({
                message:"Produk berhasil ditambahkan",
                productId:result.insertId
            });

        }
    );

};

const updateProduct = (req,res)=>{

    const productId = req.params.id;

    const {
        nama_produk,
        kategori,
        deskripsi,
        harga,
        gambar,
        estimasi_pengerjaan,
        status_ketersediaan
    } = req.body;

    const sql = `
        UPDATE products
        SET
            nama_produk = ?,
            kategori = ?,
            deskripsi = ?,
            harga = ?,
            gambar = ?,
            estimasi_pengerjaan = ?,
            status_ketersediaan = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            nama_produk,
            kategori,
            deskripsi,
            harga,
            gambar,
            estimasi_pengerjaan,
            status_ketersediaan,
            productId
        ],
        (err,result)=>{

            if(err){

                return res.status(500).json({
                    message:"Gagal update produk",
                    error:err.message
                });

            }

            if(result.affectedRows === 0){

                return res.status(404).json({
                    message:"Produk tidak ditemukan"
                });

            }

            res.json({
                message:"Produk berhasil diupdate"
            });

        }
    );

};

const deleteProduct = (req,res)=>{

    const productId = req.params.id;

    const sql =
        "DELETE FROM products WHERE id = ?";

    db.query(
        sql,
        [productId],
        (err,result)=>{

            if(err){

                return res.status(500).json({
                    message:"Gagal menghapus produk",
                    error:err.message
                });

            }

            if(result.affectedRows === 0){

                return res.status(404).json({
                    message:"Produk tidak ditemukan"
                });

            }

            res.json({
                message:"Produk berhasil dihapus"
            });

        }
    );

};

const getRecommendations = (req,res)=>{

    const kategori = req.query.kategori;

    const sql = `
        SELECT *
        FROM products
        WHERE kategori = ?
        LIMIT 5
    `;

    db.query(
        sql,
        [kategori],
        (err,result)=>{

            if(err){

                return res.status(500).json({
                    message:"Database Error",
                    error:err.message
                });

            }

            res.json(result);

        }
    );

};

module.exports = {
    getProducts, 
    getProductById, 
    createProduct,
    updateProduct,
    deleteProduct,
    getRecommendations
};