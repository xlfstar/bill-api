const { MonthlyAssetStats } = require('../models')
const { success, error } = require('../utils/response')
const { Op } = require('sequelize')

const validateRequest = (body) => {
  const errors = []

  if (body.month && !/^\d{4}-\d{2}$/.test(body.month)) {
    errors.push('月份格式应为YYYY-MM')
  }
  if (typeof body.positive !== 'number' || body.positive < 0) {
    errors.push('正资产金额必须是非负数字')
  }
  if (typeof body.negative !== 'number' || body.negative < 0) {
    errors.push('负资产金额必须是非负数字')
  }

  return errors
}

// 创建月度统计
exports.create = async (req, res) => {
  try {
    const { month, positive = 0, negative = 0, user_id } = req.body

    const errors = validateRequest(req.body)
    if (errors.length > 0) {
      return res.status(400).json(error(errors.join('; ')))
    }

    const [stats, created] = await MonthlyAssetStats.findOrCreate({
      where: { month, user_id },
      defaults: {
        month,
        positive,
        negative,
        user_id,
      },
    })

    if (!created) {
      return res.status(409).json(error('该月份记录已存在'))
    }

    res.json(success(stats))
  } catch (err) {
    console.error('创建月度统计失败:', err.stack)
    const message =
      err.name === 'SequelizeUniqueConstraintError'
        ? '该月份记录已存在'
        : '服务器内部错误'
    res
      .status(err.name === 'SequelizeUniqueConstraintError' ? 409 : 500)
      .json(error(message))
  }
}

// 获取所有月度统计
exports.findAll = async (req, res) => {
  try {
    const { user_id } = req.query
    const stats = await MonthlyAssetStats.findAll({
      where: { user_id },
      order: [['month', 'DESC']],
    })
    res.json(success(stats))
  } catch (err) {
    console.error('获取月度统计列表失败:', err.stack)
    res.status(500).json(error('获取数据失败'))
  }
}

// 获取单个月度统计
exports.findOne = async (req, res) => {
  console.log(1111)

  try {
    const { user_id } = req
    const stats = await MonthlyAssetStats.findOne({
      where: {
        id: req.params.id,
        user_id,
      },
    })

    if (!stats) {
      return res.status(404).json(error('记录不存在'))
    }
    res.json(success(stats))
  } catch (err) {
    console.error('获取月度统计详情失败:', err.stack)
    res.status(500).json(error('获取详情失败'))
  }
}

// 更新月度统计
exports.update = async (req, res) => {
  try {
    const { user_id } = req
    const errors = validateRequest(req.body)
    if (errors.length > 0) {
      return res.status(400).json(error(errors.join('; ')))
    }

    const [affectedCount] = await MonthlyAssetStats.update(req.body, {
      where: {
        id: req.params.id,
        user_id,
      },
    })

    if (affectedCount === 0) {
      return res.status(404).json(error('记录不存在或无权修改'))
    }

    const updatedStats = await MonthlyAssetStats.findByPk(req.params.id)
    res.json(success(updatedStats))
  } catch (err) {
    console.error('更新月度统计失败:', err.stack)
    res.status(500).json(error('更新失败'))
  }
}

// 删除月度统计
exports.delete = async (req, res) => {
  try {
    const { user_id } = req
    const affectedRows = await MonthlyAssetStats.destroy({
      where: {
        id: req.params.id,
        user_id,
      },
    })

    if (affectedRows === 0) {
      return res.status(404).json(error('记录不存在或无权删除'))
    }

    res.json(success(null, '删除成功'))
  } catch (err) {
    console.error('删除月度统计失败:', err.stack)
    res.status(500).json(error('删除失败'))
  }
}

// 按年查看资产表
exports.findByYear = async (req, res) => {
  try {
    const { user_id, year } = req.params
    if (!/^\d{4}$/.test(year)) {
      return res.status(400).json(error('年份格式应为YYYY'))
    }

    if (isNaN(user_id)) {
      return res.status(400).json(error('用户ID必须为数字'))
    }
    const stats = await MonthlyAssetStats.findAll({
      where: {
        month: { [Op.like]: `${year}-%` },
        user_id: Number(user_id),
      },
      order: [['month', 'ASC']],
    })

    const result = Array.from({ length: 12 }, (_, i) => {
      const month = `${year}-${String(i + 1).padStart(2, '0')}`
      const record = stats.find((s) => s.month === month)
      return {
        month,
        user_id: Number(user_id),
        positive: record?.positive || 0,
        negative: record?.negative || 0,
        total: (record?.positive || 0) - (record?.negative || 0),
      }
    })
    res.json(success(result))
  } catch (err) {
    console.error('获取年度统计失败:', err.stack)
    res.status(500).json(error('获取年度数据失败'))
  }
}
