const { Budget, Classify, Bill, sequelize } = require('../models')
const { Op } = require('sequelize')
const { success, error } = require('../utils/response')
const dayjs = require('dayjs')

// 创建预算
exports.create = async (req, res) => {
  try {
    const { type, amount, classify_id, user_id, isTotal, parent_id } = req.body
    console.log({ parent_id })

    // const targetDate = dayjs()
    // let startDate, endDate

    // // 根据type设置时间范围
    // if (type === 1) {
    //   // 按月查询
    //   startDate = targetDate.startOf('month').toDate()
    //   endDate = targetDate.endOf('month').toDate()
    // } else if (type === 2) {
    //   // 按年查询
    //   startDate = targetDate.startOf('year').toDate()
    //   endDate = targetDate.endOf('year').toDate()
    // }
    let budget
    // 查找是否存在相同用户和分类的预算
    if (classify_id) {
      const existingBudget = await Budget.findOne({
        where: {
          parent_id,
          // user_id,
          classify_id,
          // type,
          // createdAt: {
          //   [Op.between]: [startDate, endDate],
          // },
        },
      })

      if (existingBudget) {
        // 如果存在则更新
        budget = await existingBudget.update({ amount })
      } else {
        // 不存在则创建新预算
        budget = await Budget.create({
          parent_id,
          type,
          amount,
          classify_id,
          user_id,
        })
      }
    } else {
      budget = await Budget.create({
        type,
        amount,
        user_id,
        isTotal,
      })
    }
    res.json(success(budget))
  } catch (err) {
    res.status(500).json(error(err.message))
  }
}

// 获取预算列表
exports.findAll = async (req, res) => {
  try {
    const { user_id, type, date } = req.query
    const where = { user_id }
    if (type) {
      where.type = type
    }
    if (date) {
      const targetDate = dayjs(Number(date))

      if (type === '1') {
        // 按月查询
        const startDate = targetDate.startOf('month').toDate()
        const endDate = targetDate.endOf('month').toDate()
        where.createdAt = {
          [Op.between]: [startDate, endDate],
        }
      } else if (type === '2') {
        // 按年查询
        const startDate = targetDate.startOf('year').toDate()
        const endDate = targetDate.endOf('year').toDate()
        where.createdAt = {
          [Op.between]: [startDate, endDate],
        }
      }
    }
    const budgets = await Budget.findAll({
      where,
      include: [
        {
          model: Classify,
          as: 'classify',
          attributes: ['id', 'label', 'icon', 'color_icon'],
        },
      ],
    })
    res.json(success(budgets))
  } catch (err) {
    res.status(500).json(error(err.message))
  }
}

// 获取预算使用情况
exports.getBudgetUsage = async (req, res) => {
  try {
    const { user_id, type, date } = req.query
    const targetDate = dayjs(Number(date))
    let startDate, endDate

    // 计算时间范围
    if (type === '1') {
      // 月预算
      startDate = targetDate.startOf('month')
      endDate = targetDate.endOf('month')
    } else {
      // 年预算
      startDate = targetDate.startOf('year')
      endDate = targetDate.endOf('year')
    }

    // 获取预算数据
    const budgets = await Budget.findAll({
      where: { user_id, type },
      include: [
        {
          model: Classify,
          as: 'classify',
          attributes: ['id', 'label', 'icon'],
        },
      ],
    })

    // 获取支出数据
    const expenses = await Bill.findAll({
      where: {
        status: 1,
        type: '1', // 支出
        date: {
          [Op.between]: [startDate.valueOf(), endDate.valueOf()],
        },
      },
      attributes: [
        'classify_id',
        [sequelize.fn('SUM', sequelize.col('amount')), 'total'],
      ],
      group: ['classify_id'],
    })

    // 计算预算使用情况
    const budgetUsage = budgets.map((budget) => {
      const expense = expenses.find((e) => e.classify_id === budget.classify_id)
      const used = expense ? Number(expense.getDataValue('total')) : 0
      const remaining = budget.amount - used
      const percentage = (used / budget.amount) * 100

      return {
        budget_id: budget.id,
        classify: budget.classify,
        budget_amount: budget.amount,
        used_amount: used,
        remaining_amount: remaining,
        usage_percentage: Math.min(percentage, 100),
      }
    })

    res.json(
      success({
        budgetUsage,
        timeRange: {
          startDate: startDate.valueOf(),
          endDate: endDate.valueOf(),
        },
      })
    )
  } catch (err) {
    res.status(500).json(error(err.message))
  }
}
// 删除预算
exports.delete = async (req, res) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json(error('预算ID不能为空'))
    }

    // 同时删除当前预算和所有parent_id等于该id的预算
    const result = await Budget.destroy({
      where: {
        [Op.or]: [{ id }, { parent_id: id }],
      },
    })

    if (!result) {
      return res.status(404).json(error('预算不存在'))
    }

    res.json(success({ message: '删除成功' }))
  } catch (err) {
    res.status(500).json(error(err.message))
  }
}
// 更新预算
exports.update = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    if (!id) {
      return res.status(400).json(error('预算ID不能为空'))
    }

    const [updateCount] = await Budget.update(updates, {
      where: { id },
    })

    if (updateCount === 0) {
      return res.status(404).json(error('预算不存在'))
    }

    // 获取更新后的数据（包含关联信息）
    const updatedBudget = await Budget.findOne({
      where: { id },
      include: [
        {
          model: Classify,
          as: 'classify',
          attributes: ['id', 'label', 'icon', 'color_icon'],
        },
      ],
    })

    res.json(success(updatedBudget))
  } catch (err) {
    res.status(500).json(error(err.message))
  }
}
