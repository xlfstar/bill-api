const express = require('express')
const router = express.Router()
const budgetController = require('../controllers/budget.controller')

// 创建预算
router.post('/', budgetController.create)

// 获取预算列表
router.get('/', budgetController.findAll)

// 获取预算使用情况
router.get('/usage', budgetController.getBudgetUsage)
//
router.put('/:id', budgetController.update)
//
router.delete('/:id', budgetController.delete)

module.exports = router
