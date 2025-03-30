const { Tag, Classify } = require('../models');
const { success, error } = require('../utils/response');

// 创建标签
exports.create = async (req, res) => {
  try {
    const { classify_id, name } = req.body;

    // 检查分类是否存在
    const classify = await Classify.findOne({
      where: { id: classify_id, status: 1 }
    });

    if (!classify) {
      return res.status(404).json(error('分类不存在', 404));
    }

    // 检查标签名长度
    if (Buffer.from(name).length > 12) {
      return res.status(400).json(error('标签名不能超过4个中文字符', 400));
    }

    const tag = await Tag.create({
      classify_id,
      name,
      status: 1
    });

    res.json(success(tag));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
};

// 获取标签列表
exports.findAll = async (req, res) => {
  try {
    const { classify_id } = req.query;
    const where = { status: 1 };

    if (classify_id) {
      where.classify_id = classify_id;
    }

    const tags = await Tag.findAll({
      where,
      include: [{
        model: Classify,
        as: 'classify',
        attributes: ['id', 'label', 'type']
      }],
      order: [['id', 'ASC']]
    });

    res.json(success(tags));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
};

// 更新标签
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // 检查标签名长度
    if (Buffer.from(name).length > 12) {
      return res.status(400).json(error('标签名不能超过4个中文字符', 400));
    }

    const tag = await Tag.findOne({
      where: { id, status: 1 }
    });

    if (!tag) {
      return res.status(404).json(error('标签不存在', 404));
    }

    await tag.update({ name });
    res.json(success(tag));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
};

// 删除标签
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await Tag.update({ status: 0 }, {
      where: { id }
    });
    res.json(success(null, '删除成功'));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
}; 