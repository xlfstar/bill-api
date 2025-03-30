const express = require('express')
const router = express.Router()
const billRoutes = require('./bill.routes')
const classifyRoutes = require('./classify.routes')
const budgetRoutes = require('./budget.routes')
const assetsAccountRoutes = require('./assets-account.routes')
const assetsRoutes = require('./assets.routes')
const assetsChangeRecordRoutes = require('./assets-change-record.routes')
const userRoutes = require('./user.routes')
const messageRoutes = require('./message.routes')
const tagRoutes = require('./tag.routes')
const uploadRoutes = require('./upload.routes')
const { verifyToken } = require('../controllers/user.controller')
const { verifyAdminToken } = require('../controllers/admin.controller')
const adminController = require('../controllers/admin.controller')
const adminRoutes = require('./admin.routes')
const monthlyAssetsRoutes = require('./monthly-assets.routes')

// 示例路由
router.get('/', (req, res) => {
  res.json({ message: '欢迎访问 API' })
})

// 用户相关路由
router.use('/user', userRoutes)

// 管理员登录路由
router.post('/auth/login', adminController.login)

// 需要验证的路由（用户或管理员都可以访问）
router.use(
  '/upload',
  (req, res, next) => {
    // 尝试验证用户token
    console.log(222)

    verifyToken(req, res, (err) => {
      if (!err) return next() // 如果是有效的用户token，继续

      // 如果不是有效的用户token，尝试验证管理员token
      verifyAdminToken(req, res, next)
    })
  },
  uploadRoutes
)
router.use('/uploads', uploadRoutes)

// 需要用户token的路由
router.use('/bills', billRoutes)
router.use('/classifies', classifyRoutes)
router.use('/budgets', budgetRoutes)
router.use('/assets-accounts', assetsAccountRoutes)
router.use('/assets', assetsRoutes)
router.use('/assets-change-records', assetsChangeRecordRoutes)
router.use('/messages', messageRoutes)
router.use('/tags', tagRoutes)
router.use('/monthly-assets', monthlyAssetsRoutes)
// 管理员路由（除了登录外的其他管理员接口）
router.use('/auth', verifyAdminToken, adminRoutes)

module.exports = router
