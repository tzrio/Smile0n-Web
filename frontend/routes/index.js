const axios = require('axios');
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('home');
});

router.get('/login', (req, res) => {
    res.render('login');
});

router.get('/products', (req, res) => {
    res.render('products');
});

router.get('/register', (req, res) => {
    res.render('register');
});

router.get('/order', (req, res) => {
    res.render('order');
});

router.get('/payment', (req, res) => {
    res.render('payment');
});

router.get('/gallery', (req, res) => {
    res.render('gallery');
});

router.get('/recommendation', (req, res) => {
    res.render('recommendation');
});

module.exports = router;