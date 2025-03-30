const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');

// 创建消息
router.post('/', messageController.create);

// 获取消息列表
router.get('/', messageController.findAll);

// 标记消息为已读
router.put('/:id/read', messageController.markAsRead);

// 批量标记消息为已读
router.put('/read-all', messageController.markAllAsRead);

// 删除消息
router.delete('/:id', messageController.delete);

module.exports = router; 