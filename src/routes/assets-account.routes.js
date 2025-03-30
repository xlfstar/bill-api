const express = require('express');
const router = express.Router();
const assetsAccountController = require('../controllers/assets-account.controller');

// 创建资产账户
router.post('/', assetsAccountController.create);

// 获取资产账户列表
router.get('/', assetsAccountController.findAll);

// 获取单个资产账户
router.get('/:id', assetsAccountController.findOne);

// 更新资产账户
router.put('/:id', assetsAccountController.update);

// 删除资产账户
router.delete('/:id', assetsAccountController.delete);

module.exports = router; 