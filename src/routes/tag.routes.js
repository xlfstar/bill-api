const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tag.controller');

// 创建标签
router.post('/', tagController.create);

// 获取标签列表
router.get('/', tagController.findAll);

// 更新标签
router.put('/:id', tagController.update);

// 删除标签
router.delete('/:id', tagController.delete);

module.exports = router; 