const {
  Bill,
  Classify,
  sequelize,
  Assets,
  AssetsChangeRecord,
  AssetsAccount,
} = require('../models')
const { Op } = require('sequelize')
const { success, error } = require('../utils/response')

// 创建账单
exports.create = async (req, res) => {
  try {
    const {
      type,
      amount,
      date,
      classify_id,
      user_id,
      remark,
      tag_id,
      assets_id,
      images,
    } = req.body

    const bill = await Bill.create({
      type,
      amount,
      date,
      classify_id,
      user_id,
      remark,
      tag_id,
      assets_id,
      images,
    })

    const { id } = bill
    const result = await Bill.findOne({
      where: { id, status: 1 },
      include: [
        {
          model: Classify,
          as: 'classify',
          attributes: ['id', 'label', 'icon', 'color_icon'],
        },
        {
          model: Assets,
          as: 'asset',
          attributes: ['id', 'name'],
        },
      ],
    })

    // 资产处理逻辑
    if (assets_id) {
      await sequelize.transaction(async (t) => {
        // 更新资产金额
        const asset = await Assets.findByPk(assets_id, { transaction: t })
        if (!asset) throw new Error('资产不存在')

        const amountValue = Number(amount)
        const newAmount =
          type === 1
            ? Number(asset.amount) - amountValue
            : Number(asset.amount) + amountValue

        await asset.update({ amount: newAmount }, { transaction: t })

        // 创建资产变更记录
        await AssetsChangeRecord.create(
          {
            assets_id,
            amount: type === 1 ? -amountValue : amountValue,
            remark:
              type === 1
                ? `支出(${result.classify.label || ''})`
                : `收入(${result.classify.label || ''})`,
            createdAt: new Date(date),
            type: type === 1 ? '4' : '5',
          },
          { transaction: t }
        )
      })
    }

    res.json(success(result))
  } catch (err) {
    res.status(500).json(error(err.message))
  }
}

// 获取账单列表
exports.findAll = async (req, res) => {
  const { type, start_date, end_date, keyword, user_id } = req.query

  try {
    const whereClause = { status: 1, user_id: Number(user_id) }

    if (type) {
      whereClause.type = Number(type)
    }

    if (start_date && end_date) {
      whereClause.date = {
        [Op.between]: [Number(start_date), Number(end_date)],
      }
    } else if (start_date) {
      whereClause.date = {
        [Op.gte]: Number(start_date),
      }
    } else if (end_date) {
      whereClause.date = {
        [Op.lte]: Number(end_date),
      }
    }
    // console.log(whereClause)

    if (keyword) {
      whereClause[Op.or] = [
        { remark: { [Op.like]: `%${keyword}%` } },
        { '$classify.label$': { [Op.like]: `%${keyword}%` } },
      ]
    }

    const bills = await Bill.findAll({
      where: whereClause,
      include: [
        {
          model: Classify,
          as: 'classify',
          attributes: ['id', 'label', 'icon', 'color_icon'],
        },
        {
          model: Assets,
          as: 'asset',
          attributes: ['id', 'name', 'card_number', 'assets_account_id'],
          include: [
            {
              model: AssetsAccount,
              as: 'account',
              attributes: ['id', 'name', 'icon', 'parent_id'],
              include: [
                {
                  model: AssetsAccount,
                  as: 'parent',
                  attributes: ['id', 'name', 'type', 'icon'],
                  required: false,
                },
              ],
            },
          ],
        },
      ],
      order: [['date', 'DESC']],
    })
    res.json(success(bills))
  } catch (err) {
    res.status(500).json(error(err.message))
  }
}

// 删除账单（软删除）
exports.delete = async (req, res) => {
  try {
    const { id } = req.params
    await Bill.update(
      { status: 0 },
      {
        where: { id },
      }
    )
    res.json(success(null, '删除成功'))
  } catch (err) {
    res.status(500).json(error(err.message))
  }
}

// 获取单个账单详情
exports.findOne = async (req, res) => {
  try {
    const { id } = req.params
    const bill = await Bill.findOne({
      where: { id, status: 1 },
      include: [
        {
          model: Classify,
          as: 'classify',
          attributes: ['id', 'label', 'icon', 'color_icon'],
        },
        {
          model: Assets,
          as: 'asset',
          attributes: ['id', 'name', 'card_number', 'assets_account_id'],
          include: [
            {
              model: AssetsAccount,
              as: 'account',
              attributes: ['id', 'name', 'icon', 'parent_id'],
              include: [
                {
                  model: AssetsAccount,
                  as: 'parent',
                  attributes: ['id', 'name', 'type', 'icon'],
                  required: false,
                },
              ],
            },
          ],
        },
      ],
    })
    if (!bill) {
      return res.status(404).json(error('账单不存在', 404))
    }
    res.json(success(bill))
  } catch (err) {
    res.status(500).json(error(err.message))
  }
}

// 获取指定时间范围的账单
exports.findByTimeRange = async (req, res) => {
  try {
    const { type, timeRange, date } = req.query
    let targetDate = date ? new Date(Number(date)) : new Date()
    let startDate, endDate

    // 计算时间范围
    switch (timeRange) {
      case 'week':
        startDate = new Date(targetDate)
        startDate.setDate(targetDate.getDate() - targetDate.getDay() + 1)
        startDate.setHours(0, 0, 0, 0)

        endDate = new Date(targetDate)
        endDate.setDate(targetDate.getDate() - targetDate.getDay() + 7)
        endDate.setHours(23, 59, 59, 999)
        break

      case 'month':
        startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
        endDate = new Date(
          targetDate.getFullYear(),
          targetDate.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        )
        break

      case 'year':
        startDate = new Date(targetDate.getFullYear(), 0, 1)
        endDate = new Date(targetDate.getFullYear(), 11, 31, 23, 59, 59, 999)
        break

      default:
        return res
          .status(400)
          .json(error('无效的时间范围，请使用 week/month/year', 400))
    }

    const where = {
      status: 1,
      date: {
        [Op.between]: [startDate.getTime(), endDate.getTime()],
      },
    }

    if (type) {
      where.type = type
    }

    const bills = await Bill.findAll({
      where,
      include: [
        {
          model: Classify,
          as: 'classify',
          attributes: ['id', 'label', 'icon', 'color_icon'],
        },
      ],
      order: [['date', 'DESC']],
    })

    const summary = bills.reduce(
      (acc, bill) => {
        const amount = Number(bill.amount)
        if (bill.type === '1') {
          acc.expense += amount
        } else {
          acc.income += amount
        }
        return acc
      },
      { expense: 0, income: 0 }
    )

    const dailyStats = await Bill.findAll({
      where,
      attributes: [
        [
          sequelize.fn(
            'DATE',
            sequelize.fn('FROM_UNIXTIME', sequelize.literal('date / 1000'))
          ),
          'date',
        ],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total'],
        'type',
      ],
      group: [
        sequelize.fn(
          'DATE',
          sequelize.fn('FROM_UNIXTIME', sequelize.literal('date / 1000'))
        ),
        'type',
      ],
      order: [[sequelize.literal('date'), 'DESC']],
    })

    res.json(
      success({
        bills,
        summary: {
          expense: summary.expense,
          income: summary.income,
          total: summary.income - summary.expense,
          startDate: startDate.getTime(),
          endDate: endDate.getTime(),
          dailyStats,
        },
      })
    )
  } catch (err) {
    res.status(500).json(error(err.message))
  }
}

exports.update = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    // 验证账单ID
    if (!id) {
      return res.status(400).json({ error: '账单ID不能为空' })
    }
    const bill = await Bill.findOne({
      where: { id, status: 1 },
    })
    if (!bill) {
      return res.status(404).json({ error: '账单不存在' })
    }

    // 验证更新数据
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: '更新数据不能为空' })
    }
    // 查找并更新账单
    await bill.update(updates)
    const result = await Bill.findOne({
      where: { id, status: 1 },
      include: [
        {
          model: Classify,
          as: 'classify',
          attributes: ['id', 'label', 'icon', 'color_icon'],
        },
        {
          model: Assets,
          as: 'asset',
          attributes: ['id', 'name'],
        },
      ],
    })
    // 返回更新后的数据
    res.json(success(result))
  } catch (err) {
    console.log(err)

    res.status(500).json({ error: err.message })
  }
}
// 获取当前月份或年份账单
exports.getCurrentBills = async (req, res) => {
  try {
    const { user_id, type } = req.query
    const targetDate = new Date()
    let startDate, endDate
    const where = {
      user_id,
      status: 1,
    }

    // 计算时间范围
    if (type === '1') {
      // 按月查询
      startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
      endDate = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      )
    } else if (type === '2') {
      // 按年查询
      startDate = new Date(targetDate.getFullYear(), 0, 1)
      endDate = new Date(targetDate.getFullYear(), 11, 31, 23, 59, 59, 999)
    }

    where.date = {
      [Op.between]: [startDate, endDate],
    }

    const bills = await Bill.findAll({
      where,
      include: [
        {
          model: Classify,
          as: 'classify',
          attributes: ['id', 'label', 'icon', 'color_icon'],
        },
        {
          model: Assets,
          as: 'asset',
          attributes: ['id', 'name'],
        },
      ],
      order: [['date', 'DESC']],
    })

    // 计算收入和支出总额
    const summary = bills.reduce(
      (acc, bill) => {
        const amount = Number(bill.amount)
        if (bill.type === '1') {
          acc.expense += amount
        } else {
          acc.income += amount
        }
        return acc
      },
      { expense: 0, income: 0 }
    )

    res.json(
      success({
        bills,
        summary: {
          expense: summary.expense,
          income: summary.income,
          total: summary.income - summary.expense,
        },
      })
    )
  } catch (err) {
    res.status(500).json(error(err.message))
  }
}
