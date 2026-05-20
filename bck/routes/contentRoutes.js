const express = require('express');
const router = express.Router();
const { getHomeContent } = require('../controllers/contentController');

router.get('/home', getHomeContent);

module.exports = router;
