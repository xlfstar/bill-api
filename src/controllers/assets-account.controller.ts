const { AssetsAccount } = require('../models');
const { Op } = require('sequelize');
const { success, error } = require('../utils/response');

// 创建资产账户
exports.create = async (req, res) => {
  try {
    const { name, type, remark, icon, parent_id } = req.body;
    const account = await AssetsAccount.create({
      name,
      type,
      remark,
      icon,
      parent_id,
      status: 1
    });
    res.json(success(account));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
};

// 获取资产账户列表（支持分页和筛选查询）
exports.findAll = async (req, res) => {
  try {
    const { status, type, page = 1, pageSize = 10, keyword ,parent_id} = req.query;
    const offset = (page - 1) * pageSize;

    // 构建查询条件
    const where = {};
    
    // 添加状态筛选
    if (status !== undefined) {
      where.status = status;
    }

    // 添加类型筛选
    if (type) {
      where.type = type;
    }

    // 添加关键字模糊查询（支持id和name）
    if (keyword) {
      where[Op.or] = [
        { id: { [Op.like]: `%${keyword}%` } },
        { name: { [Op.like]: `%${keyword}%` } }
      ];
    }

    // 添加父级id筛选
    if (parent_id === 'null') {
      where.parent_id = null;
    } else if (parent_id) {
      where.parent_id = parent_id;
    }

    // 先查询总数
    const count = await AssetsAccount.count({
      where: {
        ...where,
        parent_id: null // 只查询顶级账户
      }
    });

    // 查询分页数据
    const list = await AssetsAccount.findAll({
      where: {
        ...where,
        parent_id: null // 只查询顶级账户
      },
      include: [{
        model: AssetsAccount,
        as: 'children',
        where: { status: 1 },
        required: false
      }],
      order: [['id', 'ASC']],
      offset: Number(offset),
      limit: Number(pageSize)
    });

    // 计算总页数
    const totalPages = Math.ceil(count / pageSize);
    
    res.json(success({
      list,
      pagination: {
        total: count,
        current: Number(page),
        pageSize: Number(pageSize),
        totalPages
      }
    }));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
};

// 获取单个资产账户详情
exports.findOne = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await AssetsAccount.findOne({
      where: { id, status: 1 },
      include: [{
        model: AssetsAccount,
        as: 'parent',
        attributes: ['id', 'name']
      }, {
        model: AssetsAccount,
        as: 'children',
        where: { status: 1 },
        required: false
      }]
    });

    if (!account) {
      return res.status(404).json(error('账户不存在', 404));
    }

    res.json(success(account));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
};

// 更新资产账户
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, remark, icon, parent_id , status} = req.body;
    
    const account = await AssetsAccount.findOne({
      where: { id }
    });

    if (!account) {
      return res.status(404).json(error('账户不存在', 404));
    }

    await account.update({
      name,
      type:Number(type),
      remark,
      icon,
      parent_id,
      status:Number(status)
    });

    res.json(success(account));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
};

// 删除资产账户（软删除）
exports.delete = async (req, res) => {
  
  try {
    const { id } = req.params;
    
    // 检查是否有子账户
    const hasChildren = await AssetsAccount.findOne({
      where: { parent_id: id }
    });

    if (hasChildren) {
      return res.status(400).json(error('请先删除子账户', 400));
    }

    await AssetsAccount.destroy({
      where: { id }
    });

    res.json(success(null, '删除成功'));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
}; 