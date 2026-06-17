const db = require("../config/db");

const getGalleries = (req, res) => {

    const sql = "SELECT * FROM galleries";

    db.query(sql, (err, result) => {

        if(err){
            return res.status(500).json({
                message: "Database Error"
            });
        }

        res.json(result);

    });

};

const getGalleryById = (req, res) => {

    const id = req.params.id;

    const sql =
    "SELECT * FROM galleries WHERE id = ?";

    db.query(sql, [id], (err, result) => {

        if(err){
            return res.status(500).json({
                message: "Database Error"
            });
        }

        res.json(result);

    });

};

const createGallery = (req, res) => {

    const {
        judul,
        kategori,
        deskripsi,
        gambar
    } = req.body;

    const sql = `
    INSERT INTO galleries
    (judul, kategori, deskripsi, gambar)
    VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [judul, kategori, deskripsi, gambar],
        (err, result) => {

            if(err){
                return res.status(500).json({
                    message: "Database Error"
                });
            }

            res.json({
                message:
                "Gallery berhasil ditambahkan"
            });

        }
    );

};

const updateGallery = (req, res) => {

    const id = req.params.id;

    const {
        judul,
        kategori,
        deskripsi,
        gambar
    } = req.body;

    const sql = `
    UPDATE galleries
    SET
    judul=?,
    kategori=?,
    deskripsi=?,
    gambar=?
    WHERE id=?
    `;

    db.query(
        sql,
        [
            judul,
            kategori,
            deskripsi,
            gambar,
            id
        ],
        (err, result) => {

            if(err){
                return res.status(500).json({
                    message: "Database Error"
                });
            }

            res.json({
                message:
                "Gallery berhasil diupdate"
            });

        }
    );

};

const deleteGallery = (req, res) => {

    const id = req.params.id;

    const sql =
    "DELETE FROM galleries WHERE id = ?";

    db.query(sql, [id], (err, result) => {

        if(err){
            return res.status(500).json({
                message: "Database Error"
            });
        }

        res.json({
            message:
            "Gallery berhasil dihapus"
        });

    });

};

module.exports = {
    getGalleries,
    getGalleryById,
    createGallery,
    updateGallery,
    deleteGallery
};