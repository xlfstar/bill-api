const express = require('express')
const router = express.Router()
const monthlyAssetStatsController = require('../controllers/monthly-asset-stats.controller')

// 创建月度统计
router.post('/', monthlyAssetStatsController.create)

// 获取所有月度统计
router.get('/', monthlyAssetStatsController.findAll)

// 获取单个统计
router.get('/:id', monthlyAssetStatsController.findOne)

// 更新统计
router.put('/:id', monthlyAssetStatsController.update)

// 删除统计
router.delete('/:id', monthlyAssetStatsController.delete)
//按年获取月度统计
router.get('/year/:user_id/:year', monthlyAssetStatsController.findByYear)
module.exports = router
