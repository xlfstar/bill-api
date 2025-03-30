const { Message, User } = require('../models');
const { Op } = require('sequelize');
const { success, error } = require('../utils/response');

// 创建消息
exports.create = async (req, res) => {
  try {
    const { message, send_time } = req.body;
    
    const newMessage = await Message.create({
      message,
      send_time: send_time || new Date(),
      already_read_list: [],
      status: 1
    });

    res.json(success(newMessage));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
};

// 获取消息列表
exports.findAll = async (req, res) => {
  try {
    const { user_id } = req.query;
    
    const messages = await Message.findAll({
      where: { status: 1 },
      order: [['send_time', 'DESC']]
    });

    // 处理消息列表，添加已读状态
    const processedMessages = messages.map(message => {
      const messageData = message.toJSON();
      messageData.is_read = messageData.already_read_list.includes(Number(user_id));
      return messageData;
    });

    // 统计未读消息数量
    const unreadCount = processedMessages.filter(msg => !msg.is_read).length;

    res.json(success({
      messages: processedMessages,
      unread_count: unreadCount
    }));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
};

// 标记消息为已读
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    const message = await Message.findOne({
      where: { id, status: 1 }
    });

    if (!message) {
      return res.status(404).json(error('消息不存在', 404));
    }

    // 如果用户不在已读列表中，添加用户ID
    if (!message.already_read_list.includes(Number(user_id))) {
      const updatedReadList = [...message.already_read_list, Number(user_id)];
      await message.update({
        already_read_list: updatedReadList
      });
    }

    res.json(success(null, '标记已读成功'));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
};

// 批量标记消息为已读
exports.markAllAsRead = async (req, res) => {
  try {
    const { user_id } = req.body;

    const messages = await Message.findAll({
      where: { status: 1 }
    });

    // 批量更新消息的已读状态
    await Promise.all(messages.map(async (message) => {
      if (!message.already_read_list.includes(Number(user_id))) {
        const updatedReadList = [...message.already_read_list, Number(user_id)];
        await message.update({
          already_read_list: updatedReadList
        });
      }
    }));

    res.json(success(null, '全部标记已读成功'));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
};

// 删除消息
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await Message.update({ status: 0 }, {
      where: { id }
    });
    res.json(success(null, '删除成功'));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
}; 