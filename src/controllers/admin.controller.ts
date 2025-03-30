const { Admin } = require('../models');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { success, error } = require('../utils/response');

// 密码加密函数
const encryptPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// 生成token
const generateToken = (admin) => {
  return jwt.sign(
    { 
      id: admin.id,
      name: admin.name,
      level: admin.level
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// 创建管理员 token 验证中间件
exports.verifyAdminToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json(error('未提供token', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // 验证是否是管理员token（检查是否包含level字段）
    if (!decoded.level) {
      return res.status(401).json(error('无效的管理员token', 401));
    }
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json(error('token无效或已过期', 401));
  }
};

// 创建管理员
exports.create = async (req, res) => {
  try {
    const { name, password, level } = req.body;

    // 检查管理员名是否已存在
    const existingAdmin = await Admin.findOne({
      where: { name }
    });

    if (existingAdmin) {
      return res.status(400).json(error('该管理员名已存在', 400));
    }

    const admin = await Admin.create({
      name,
      password: encryptPassword(password),
      level,
      status: 1
    });

    // 返回管理员信息（不包含密码）
    const { password: _, ...adminInfo } = admin.toJSON();
    res.json(success(adminInfo));
  } catch (error) {
    res.status(500).json(error(error.message));
  }
};

// 管理员登录
exports.login = async (req, res) => {
  try {
    const { name, password } = req.body;

    const admin = await Admin.findOne({
      where: { 
        name,
        status: 1
      }
    });

    if (!admin || admin.password !== encryptPassword(password)) {
      return res.status(401).json(error('用户名或密码错误', 401));
    }

    // 更新最后登录时间
    await admin.update({
      last_login: new Date()
    });

    // 生成token
    const token = generateToken(admin);

    // 返回管理员信息（不包含密码）和token
    const { password: _, ...adminInfo } = admin.toJSON();
    res.json(success({
      ...adminInfo,
      token
    }));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
};

// 获取管理员列表
exports.findAll = async (req, res) => {
  try {
    const admins = await Admin.findAll({
      attributes: { exclude: ['password'] },
      order: [['id', 'ASC']]
    });
    res.json(success(admins));
  } catch (error) {
    res.status(500).json(error(error.message));
  }
};

// 更新管理员状态
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json(error('管理员不存在', 404));
    }

    await admin.update({ status });
    const { password: _, ...adminInfo } = admin.toJSON();
    res.json(success(adminInfo));
  } catch (error) {
    res.status(500).json(error(error.message));
  }
};

// 修改密码
exports.changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json(error('管理员不存在', 404));
    }

    if (admin.password !== encryptPassword(oldPassword)) {
      return res.status(400).json(error('原密码错误', 400));
    }

    await admin.update({
      password: encryptPassword(newPassword)
    });

    res.json(success('密码修改成功'));
  } catch (error) {
    res.status(500).json(error(error.message));
  }
}; 