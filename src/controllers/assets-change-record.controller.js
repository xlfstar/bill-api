const { AssetsChangeRecord, Assets, AssetsAccount } = require('../models')
const { success, error } = require('../utils/response')
const { Op } = require('sequelize')
// 创建资产变化记录
exports.create = async (req, res) => {
  try {
    const { assets_id, remark } = req.body

    // 检查资产是否存在
    const asset = await Assets.findOne({
      where: { id: assets_id, status: 1 },
    })

    if (!asset) {
      return res.status(404).json(error('资产不存在', 404))
    }

    const record = await AssetsChangeRecord.create({
      assets_id,
      remark,
    })

    res.json(success(record))
  } catch (err) {
    res.status(500).json(error(err.message))
  }
}

// 获取资产变化记录列表
exports.findAll = async (req, res) => {
  try {
    // 从请求参数中获取资产ID和日期(格式: 2025-03)
    const { assets_id, date } = req.params

    // 解析日期范围
    const startDate = date ? new Date(date + '-01') : null
    const endDate = date
      ? new Date(
          new Date(date + '-01').setMonth(new Date(date + '-01').getMonth() + 1)
        )
      : null
    const where = {}

    if (assets_id) {
      where.assets_id = Number(assets_id)
    }

    // 添加日期范围条件
    if (startDate && endDate) {
      where.createdAt = {
        [Op.gte]: startDate,
        [Op.lt]: endDate,
      }
    }

    const records = await AssetsChangeRecord.findAll({
      where,
      include: [
        {
          model: Assets,
          as: 'asset',
          attributes: ['id', 'name', 'amount'],
          include: [
            {
              model: AssetsAccount,
              as: 'account',
              attributes: ['id', 'name', 'type'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    })

    // 按日期分组处理数据
    const groupedData = records.reduce((acc, record) => {
      const date = new Date(record.createdAt)
      // 格式化日期为"MM月DD日 星期X"的格式
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const weekDay = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()]
      const dateStr = `${month}月${day}日 星期${weekDay}`

      // 查找是否已存在该日期的分组
      const existingGroup = acc.find((group) => group.title === dateStr)

      if (existingGroup) {
        existingGroup.data.push(record)
      } else {
        acc.push({
          title: dateStr,
          data: [record],
        })
      }

      return acc
    }, [])

    res.json(success(groupedData))
  } catch (err) {
    res.status(500).json(error(err.message))
  }
}

// 获取单个变化记录详情
exports.findOne = async (req, res) => {
  try {
    const { id } = req.params
    const record = await AssetsChangeRecord.findOne({
      where: { id },
      include: [
        {
          model: Assets,
          as: 'asset',
          attributes: ['id', 'name', 'amount'],
          include: [
            {
              model: AssetsAccount,
              as: 'account',
              attributes: ['id', 'name', 'type'],
            },
          ],
        },
      ],
    })

    if (!record) {
      return res.status(404).json(error('记录不存在', 404))
    }

    res.json(success(record))
  } catch (err) {
    res.status(500).json(error(err.message))
  }
}
