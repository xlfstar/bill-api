const { Classify } = require("../models");
const { success, error } = require("../utils/response");
const { Op } = require("sequelize");

// 创建分类
exports.create = async (req, res) => {
  try {
    const { label, type, icon, color_icon, status } = req.body;
    const classify = await Classify.create({
      label,
      type: Number(type),
      icon,
      color_icon,
      status: Number(status),
    });
    res.json(success(classify));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
};

// 获取分类列表（支持分页和筛选查询）
exports.findAll = async (req, res) => {
  try {

    const { page = 1, pageSize = 10, keyword, status, type } = req.query;
    const offset = (page - 1) * pageSize;

    // 构建查询条件
    const where = {};

    // 添加状态筛选
    if (status !== undefined) {
      where.status = Number(status);
    }

    // 添加类型筛选
    if (type !== undefined) {
      where.type = type;
    }

    // 添加关键字模糊查询（支持id和label）
    if (keyword) {
      where[Op.or] = [
        { id: { [Op.like]: `%${keyword}%` } },
        { label: { [Op.like]: `%${keyword}%` } },
      ];
    }

    const { count, rows: list } = await Classify.findAndCountAll({
      where,
      order: [["id", "ASC"]],
      offset: Number(offset),
      limit: Number(pageSize),
    });

    // 计算总页数
    const totalPages = Math.ceil(count / pageSize);

    res.json(
      success({
        list,
        pagination: {
          total: count,
          current: Number(page),
          pageSize: Number(pageSize),
          totalPages,
        },
      })
    );
  } catch (err) {
    res.status(500).json(error(err.message));
  }
};

// 删除分类（软删除）
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await Classify.destroy({
      where: { id },
    });
    res.json(success(null, "删除成功"));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
};

// 更新分类
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, icon, status, type, color_icon } = req.body;

    // 检查分类是否存在
    const classify = await Classify.findByPk(id);
    if (!classify) {
      return res.status(404).json(error("分类不存在", 404));
    }

    // 更新分类信息
    const body = {
      label,
      icon,
      color_icon,
      status: Number(status),
      type: type && Number(type),
    };
    await classify.update(body);

    res.json(success(classify, "更新成功"));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
};
