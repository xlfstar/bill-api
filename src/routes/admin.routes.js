const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

// 管理员登录
router.post('/login', adminController.login);

// 以下路由需要验证管理员token
router.use(adminController.verifyAdminToken);

// 创建管理员（需要超级管理员权限）
router.post('/', adminController.create);

// 获取管理员列表
router.get('/', adminController.findAll);

// 更新管理员状态
router.put('/:id/status', adminController.updateStatus);

// 修改密码
router.put('/:id/password', adminController.changePassword);

module.exports = router; 