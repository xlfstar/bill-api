const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');

// 上传单个文件
router.post('/single', uploadController.uploadSingle);

// 上传多个文件
router.post('/multiple', uploadController.uploadMultiple);

module.exports = router; 