const { User } = require('../models')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const { success, error } = require('../utils/response')
const { Op } = require('sequelize')

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET

// 密码加密函数
const encryptPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex')
}

// 生成token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      phonenumber: user.phonenumber,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// 创建中间件验证token
exports.verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json(error('未提供token', 401))
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)

    // 检查是否是管理员token（包含level字段）
    if (decoded.level) {
      req.admin = decoded
      req.user = null
    } else {
      req.user = decoded
      req.admin = null
    }

    next()
  } catch (err) {
    return res.status(401).json(error('token无效或已过期', 401))
  }
}
//进入App时，直接用device_id创建一个用户
exports.createDeviceUser = async (req, res) => {
  try {
    const { deviceId } = req.body

    // 检查设备是否已存在
    const existingUser = await User.findOne({
      where: { device_id: deviceId },
    })
    if (existingUser) {
      // 生成token
      // const token = generateToken(existingDeviceId)
      // 返回用户信息（不包含密码）和token
      const { password: _, ...userInfo } = existingUser.toJSON()
      res.json(
        success({
          ...userInfo,
        })
      )
    } else {
      // 创建用户
      const user = await User.create({
        status: 1,
        level: 0,
        device_id: deviceId,
      })
      // 不生成生成token
      // const token = generateToken(user)
      // 返回用户信息（不包含密码）和token
      const { password: _, ...userInfo } = user.toJSON()
      res.json(
        success({
          ...userInfo,
        })
      )
    }
  } catch (err) {
    res.status(500).json(error(err.message))
  }
}
// 注册用户
exports.register = async (req, res) => {
  console.log('register')

  try {
    const { phonenumber, password, deviceId } = req.body

    // 检查手机号是否已存在
    const existingUser = await User.findOne({
      where: { phonenumber },
    })

    if (existingUser) {
      return res.status(409).json(error('该手机号已被注册', 409))
    }

    // 检查设备ID是否存在
    const deviceUser = await User.findOne({
      where: { device_id: deviceId },
    })

    let user
    if (deviceUser) {
      // 如果设备ID存在，更新用户信息
      user = await deviceUser.update({
        phonenumber,
        password: encryptPassword(password),
        level: 1,
      })
    } else {
      // 如果设备ID不存在，创建新用户
      user = await User.create({
        phonenumber,
        password: encryptPassword(password),
        status: 1,
        level: 1,
        device_id: deviceId,
      })
    }

    // 生成token
    const token = generateToken(user)

    // 返回用户信息（不包含密码）和token
    const { password: _, ...userInfo } = user.toJSON()
    res.json(
      success({
        ...userInfo,
        token,
      })
    )
  } catch (err) {
    res.status(500).json(error(err.message))
  }
}

// 用户登录
exports.login = async (req, res) => {
  try {
    const { phonenumber, password } = req.body

    const user = await User.findOne({
      where: {
        phonenumber,
        status: 1,
      },
    })

    if (!user || user.password !== encryptPassword(password)) {
      return res.status(401).json(error('手机号或密码错误', 401))
    }

    // 生成token
    const token = generateToken(user)

    // 返回用户信息（不包含密码）和token
    const { password: _, ...userInfo } = user.toJSON()
    res.json(
      success({
        ...userInfo,
        token,
      })
    )
  } catch (err) {
    res.status(500).json(error(err.message))
  }
}

// 更新用户信息
exports.update = async (req, res) => {
  try {
    const { id } = req.params
    const { nickname, sex, avatar } = req.body

    const user = await User.findOne({
      where: { id, status: 1 },
    })

    if (!user) {
      return res.status(404).json(error('用户不存在', 404))
    }
    await user.update({
      nickname,
      sex,
      avatar,
    })
    // 返回更新后的用户信息（不包含密码）
    const { password: _, ...userInfo } = user.toJSON()
    res.json(success(userInfo, '用户信息更新成功'))
  } catch (err) {
    res.status(500).json(error(err.message))
  }
}

// 修改密码
exports.changePassword = async (req, res) => {
  try {
    const { id } = req.params
    const { oldPassword, newPassword } = req.body

    const user = await User.findOne({
      where: { id, status: 1 },
    })

    if (!user) {
      return res.status(404).json(error('用户不存在', 404))
    }

    if (user.password !== encryptPassword(oldPassword)) {
      return res.status(400).json(error('原密码错误', 400))
    }

    await user.update({
      password: encryptPassword(newPassword),
    })

    res.json(success(user, '密码修改成功'))
  } catch (err) {
    res.status(500).json(error(err.message))
  }
}

// 获取用户信息
exports.findOne = async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findOne({
      where: { id, status: 1 },
      attributes: { exclude: ['password'] },
    })

    if (!user) {
      return res.status(404).json(error('用户不存在', 404))
    }

    res.json(success(user))
  } catch (err) {
    res.status(500).json(error(err.message))
  }
}

// 获取用户列表（支持分页和模糊查询）
exports.findAll = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, nickname, phonenumber } = req.query
    const offset = (page - 1) * pageSize

    // 构建查询条件
    const where = { status: 1 }

    // 添加昵称模糊查询
    if (nickname) {
      where.nickname = {
        [Op.like]: `%${nickname}%`,
      }
    }

    // 添加手机号模糊查询
    if (phonenumber) {
      where.phonenumber = {
        [Op.like]: `%${phonenumber}%`,
      }
    }

    const { count, rows: list } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      offset: Number(offset),
      limit: Number(pageSize),
    })

    // 计算总页数
    const totalPages = Math.ceil(count / pageSize)

    res.json(
      success({
        list,
        pagination: {
          total: count,
          current: Number(page),
          pageSize: Number(pageSize),
          totalPages,
        },
      })
    )
  } catch (err) {
    res.status(500).json(error(err.message))
  }
}
exports.findOneByDeviceId = async (req, res) => {
  try {
    const { deviceId } = req.params
    const user = await User.findOne({
      where: { device_id: deviceId, status: 1 },
      attributes: { exclude: ['password'] },
    })

    if (!user) {
      return res.status(404).json(error('用户不存在', 404))
    }

    res.json(success(user))
  } catch (err) {
    res.status(500).json(error(err.message))
  }
}
