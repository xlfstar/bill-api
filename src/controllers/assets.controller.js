const {
  Assets,
  AssetsAccount,
  AssetsChangeRecord,
  MonthlyAssetStats,
} = require('../models')
const { success, error } = require('../utils/response')

// 更新月度资产统计
async function updateMonthlyStats(accountType, amount, operation, user_id) {
  try {
    console.log(
      '正在更新月度统计，账户类型:',
      accountType,
      '金额:',
      amount,
      '操作:',
      operation
    )
    // 验证字段存在
    if (
      !['positive', 'negative'].includes(
        accountType === '1' ? 'positive' : 'negative'
      )
    ) {
      throw new Error('无效的账户类型')
    }
    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0'
    )}`

    const [stats] = await MonthlyAssetStats.findOrCreate({
      where: { month, user_id },
      defaults: {
        month,
        user_id,
        positive: 0,
        negative: 0,
      },
    })

    const field = accountType === '1' ? 'positive' : 'negative'

    if (operation === 'create' || operation === 'update') {
      stats[field] = Number(stats[field]) + Number(amount)
    } else if (operation === 'delete') {
      stats[field] = Math.max(0, Number(stats[field]) - Number(amount))
    }

    await stats.save()
  } catch (err) {
    console.error('更新月度统计失败:', err.stack)
  }
}

// 创建资产
exports.create = async (req, res) => {
  try {
    const {
      assets_account_id,
      user_id,
      amount,
      name,
      remark,
      card_number,
      type,
    } = req.body

    // 检查资产账户是否存在
    const account = await AssetsAccount.findOne({
      where: { id: assets_account_id, status: 1 },
    })

    if (!account) {
      return res.status(404).json(error('资产账户不存在', 404))
    }

    const asset = await Assets.create({
      assets_account_id,
      user_id,
      amount,
      name,
      remark,
      card_number,
      status: 1,
      type,
    })

    // 创建资产变更记录
    await AssetsChangeRecord.create({
      assets_id: asset.id,
      amount,
      remark: `创建资产${name}，初始金额${(amount / 100)
        .toFixed(2)
        .replace(/\.?0+$/, '')}`,
    })

    res.json(success(asset))

    // 更新月度统计
    await updateMonthlyStats(type, Number(amount), 'create', user_id)
  } catch (err) {
    res.status(500).json(error(err.message))
  }
}

// 获取资产列表
exports.findAll = async (req, res) => {
  try {
    const { user_id, assets_account_id } = req.query
    const where = {
      user_id,
      status: 1,
    }

    if (assets_account_id) {
      where.assets_account_id = assets_account_id
    }

    const assets = await Assets.findAll({
      where,
      include: [
        {
          model: AssetsAccount,
          as: 'account',
          attributes: ['id', 'name', 'type', 'icon', 'parent_id'],
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
      order: [['createdAt', 'DESC']],
    })

    // 计算总资产并将type添加到每个资产项中
    const summary = assets.reduce(
      (acc, asset) => {
        const amount = Number(asset.amount)
        const type = asset.account.type

        // 将type添加到asset对象中
        asset.dataValues.type = type

        if (type === '1') {
          // 正资产
          acc.positive += amount
        } else {
          // 负资产
          acc.negative += amount
        }
        return acc
      },
      { positive: 0, negative: 0 }
    )

    res.json(
      success({
        assets,
        summary: {
          positive: summary.positive,
          negative: summary.negative,
          total: summary.positive - summary.negative,
        },
      })
    )
  } catch (err) {
    res.status(500).json(error(err.message))
  }
}

// 更新资产
exports.update = async (req, res) => {
  try {
    const { id } = req.params
    const { amount } = req.body

    const asset = await Assets.findOne({
      where: { id, status: 1 },
    })

    if (!asset) {
      return res.status(404).json(error('资产不存在', 404))
    }

    // 记录原始金额
    const oldAmount = asset.amount

    // 更新资产
    await asset.update({
      amount,
    })

    // 创建变更记录
    if (oldAmount !== amount) {
      await AssetsChangeRecord.create({
        assets_id: id,
        remark: `从 ${(oldAmount / 100)
          .toFixed(2)
          .replace(/\.?0+$/, '')} 调整为 ${(amount / 100)
          .toFixed(2)
          .replace(/\.?0+$/, '')}`,
        amount: amount - oldAmount,
      })
    }

    res.json(success(asset))

    // 更新月度统计
    const difference = Number(amount) - Number(oldAmount)

    await updateMonthlyStats(asset.type, difference, 'update', asset.user_id)
  } catch (err) {
    res.status(500).json(error(err.message))
  }
}

// 删除资产
exports.delete = async (req, res) => {
  try {
    const { id } = req.params

    // 查找资产信息
    const asset = await Assets.findOne({ where: { id } })
    if (!asset) {
      return res.status(404).json(error('资产不存在', 404))
    }

    // 检查资产账户是否存在
    const account = await AssetsAccount.findOne({
      where: { id: asset.assets_account_id, status: 1 },
    })

    if (!account) {
      return res.status(404).json(error('资产账户不存在', 404))
    }

    // 删除资产相关记录
    await Promise.all([
      // 删除资产本身
      Assets.update(
        { status: 0 },
        {
          where: { id },
        }
      ),
      // 删除资产变更记录
      AssetsChangeRecord.destroy({
        where: { assets_id: id },
      }),
    ])

    // 更新月度统计
    await updateMonthlyStats(
      account.type,
      Number(asset.amount),
      'delete',
      asset.user_id
    )

    res.json(success(null, '删除成功'))
  } catch (err) {
    res.status(500).json(error(err.message))
  }
}
// 获取单个资产详情
exports.findOne = async (req, res) => {
  try {
    const { id } = req.params
    console.log({ id })

    const asset = await Assets.findOne({
      where: { id, status: 1 },
      include: [
        {
          model: AssetsAccount,
          as: 'account',
          attributes: ['id', 'name', 'type', 'icon', 'parent_id'],
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
    })

    if (!asset) {
      return res.status(404).json(error('资产不存在', 404))
    } else {
      res.json(success(asset))
    }
  } catch (err) {
    res.status(500).json(error(err.message))
  }
}
// 账户间转账
exports.transfer = async (req, res) => {
  try {
    const { from_asset_id, to_asset_id, amount, remark, createdAt } = req.body
    console.log({ from_asset_id, to_asset_id, amount })

    // 检查转出资产是否存在
    const fromAsset = await Assets.findOne({
      where: { id: from_asset_id, status: 1 },
      include: [
        {
          model: AssetsAccount,
          as: 'account',
          attributes: ['type'],
        },
      ],
    })

    if (!fromAsset) {
      return res.status(404).json(error('转出资产不存在', 404))
    }

    // 检查转入资产是否存在
    const toAsset = await Assets.findOne({
      where: { id: to_asset_id, status: 1 },
      include: [
        {
          model: AssetsAccount,
          as: 'account',
          attributes: ['type'],
        },
      ],
    })

    if (!toAsset) {
      return res.status(404).json(error('转入资产不存在', 404))
    }

    // 检查转出金额是否充足
    if (Number(fromAsset.amount) < Number(amount)) {
      return res.status(400).json(error('转出金额不足', 400))
    }

    // 更新转出资产金额
    await fromAsset.update({
      amount: Number(fromAsset.amount) - Number(amount),
    })

    // 更新转入资产金额
    await toAsset.update({
      amount: Number(toAsset.amount) + Number(amount),
    })

    // 创建转出资产变更记录
    await AssetsChangeRecord.create({
      assets_id: from_asset_id,
      amount: -amount,
      createdAt,
      type: 2,
      remark:
        remark ||
        `转账至${toAsset.name}，金额${(amount / 100)
          .toFixed(2)
          .replace(/\.?0+$/, '')}`,
    })

    // 创建转入资产变更记录
    await AssetsChangeRecord.create({
      assets_id: to_asset_id,
      amount: amount,
      createdAt,
      type: 2,
      remark:
        remark ||
        `来自${fromAsset.name}的转账，金额${(amount / 100)
          .toFixed(2)
          .replace(/\.?0+$/, '')}`,
    })

    // 更新月度统计
    await updateMonthlyStats(
      fromAsset.account.type,
      Number(amount),
      'update',
      fromAsset.user_id
    )
    await updateMonthlyStats(
      toAsset.account.type,
      Number(amount),
      'update',
      toAsset.user_id
    )

    res.json(success(null, '转账成功'))
  } catch (err) {
    res.status(500).json(error(err.message))
  }
}
