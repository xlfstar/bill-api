const express = require('express')
const router = express.Router()
const assetsController = require('../controllers/assets.controller')

// 创建资产
router.post('/', assetsController.create)

// 获取资产列表
router.get('/', assetsController.findAll)

// 更新资产
router.put('/:id', assetsController.update)

// 删除资产
router.delete('/:id', assetsController.delete)
// 获取资产详情
router.get('/:id', assetsController.findOne)
//转账
router.post('/transfer', assetsController.transfer)

module.exports = router
