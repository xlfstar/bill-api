const { Admin } = require('../models');
const crypto = require('crypto');

// 密码加密函数
const encryptPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// 初始化超级管理员
const initAdmin = async () => {
  try {
    console.log('开始初始化超级管理员...');
    
    // 检查是否已存在
    const existingAdmin = await Admin.findOne({
      where: { name: 'admin' }
    });

    if (existingAdmin) {
      console.log('超级管理员已存在:', existingAdmin.toJSON());
      return;
    }

    // 创建超级管理员
    const admin = await Admin.create({
      name: 'admin',
      password: encryptPassword('123456'),
      level: 2,  // 2-超级管理员
      status: 1
    });

    console.log('超级管理员创建成功:', admin.toJSON());
  } catch (error) {
    console.error('超级管理员创建失败:', error);
  } finally {
    process.exit(); // 确保脚本执行完毕后退出
  }
};

// 执行初始化
console.log('正在连接数据库...');
initAdmin(); 