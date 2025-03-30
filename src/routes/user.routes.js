const express = require('express')
const router = express.Router()
const userController = require('../controllers/user.controller')
//创建设备用户

router.post('/device', userController.createDeviceUser)

// 用户注册
router.post('/register', userController.register)

// 用户登录
router.post('/login', userController.login)

// 获取用户列表（支持分页）
router.get('/', userController.findAll)

// 更新用户信息
router.put('/:id', userController.update)

// 修改密码
router.put('/:id/password', userController.changePassword)

// 获取用户信息
router.get('/:id', userController.findOne)
// 获取用户信息
router.get('/device/:deviceId', userController.findOneByDeviceId)

module.exports = router
