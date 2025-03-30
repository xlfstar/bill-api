const express = require('express')
const router = express.Router()
const assetsChangeRecordController = require('../controllers/assets-change-record.controller')

// 创建变化记录
router.post('/', assetsChangeRecordController.create)

// 获取变化记录列表
router.get('/:assets_id/:date', assetsChangeRecordController.findAll)

// 获取单个变化记录
router.get('/:id', assetsChangeRecordController.findOne)

module.exports = router
