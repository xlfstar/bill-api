const express = require('express')
const router = express.Router()
const billController = require('../controllers/bill.controller')

// 创建账单
router.post('/', billController.create)

// 获取账单列表
router.get('/', billController.findAll)

// 获取单个账单
router.get('/:id', billController.findOne)

// 删除账单
router.delete('/:id', billController.delete)

// 获取时间范围内的账单
router.get('/statistics', billController.findByTimeRange)
//更新
router.put('/:id', billController.update)
//获取当前月或者年的账单
router.get('/statiscal',billController.getCurrentBills)

module.exports = router
