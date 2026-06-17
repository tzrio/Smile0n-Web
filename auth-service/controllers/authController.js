const jwt = require("jsonwebtoken");

const db = require("../config/db");

const registerUser = (req,res)=>{

    const {
        nama,
        email,
        password,
        nomor_telepon,
        alamat,
        role
    } = req.body;

    const sql = `
        INSERT INTO users
        (nama,email,password,nomor_telepon,alamat,role)
        VALUES (?,?,?,?,?,?)
    `;

    db.query(
        sql,
        [
            nama,
            email,
            password,
            nomor_telepon,
            alamat,
            role || "user"
        ],
        (err,result)=>{

            if(err){

                return res.status(500).json({
                    message:"Gagal register",
                    error:err.message
                });

            }

            res.status(201).json({
                message:"User berhasil dibuat",
                userId:result.insertId
            });

        }
    );

};

const loginUser = (req,res)=>{

    const { email, password } = req.body;

    const sql =
        "SELECT * FROM users WHERE email = ?";

    db.query(
        sql,
        [email],
        (err,result)=>{

            if(err){

                return res.status(500).json({
                    message:"Database error"
                });

            }

            if(result.length === 0){

                return res.status(404).json({
                    message:"Email tidak ditemukan"
                });

            }

            const user = result[0];

            if(user.password !== password){

                return res.status(401).json({
                    message:"Password salah"
                });

            }

            const token = jwt.sign(
                {
                    id:user.id,
                    email:user.email,
                    role:user.role
                },
                process.env.JWT_SECRET,
                {
                    expiresIn:"1h"
                }
            );

            res.json({
                message:"Login berhasil",
                token
            });

        }
    );

};

const getUsers = (req,res)=>{

    const users = [
        {
            id:1,
            name:"Rakha",
            role:"user"
        },
        {
            id:2,
            name:"Admin Bagus",
            role:"admin"
        }
    ];

    res.json(users);

};

const getProfile = (req,res)=>{

    res.json({
        message:"Profile berhasil diakses",
        user:req.user
    });

};

module.exports = {
    registerUser, loginUser, getUsers, getProfile
};