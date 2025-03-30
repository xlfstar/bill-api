const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const sequelize = require('./config/database');
const path = require('path');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// 路由
app.use('/api', routes);

// API文档路由
app.get('/apiManager', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/apiManager.html'));
});

// 数据库连接测试
sequelize.authenticate()
  .then(() => {
    console.log('数据库连接成功');
  })
  .catch(err => {
    console.error('数据库连接失败:', err);
  });

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('错误:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || '服务器错误！'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

module.exports = app; 