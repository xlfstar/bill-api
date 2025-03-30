const express = require('express');
const router = express.Router();
const classifyController = require('../controllers/classify.controller');

// 创建分类
router.post('/', classifyController.create);

// 获取分类列表
router.get('/', classifyController.findAll);
//更新分类
router.put('/:id', classifyController.update);
// 删除分类
router.delete('/:id', classifyController.delete);

module.exports = router; 