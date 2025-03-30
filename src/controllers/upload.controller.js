const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { success, error } = require('../utils/response')

// 配置存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/uploads'
    // 确保上传目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    // 生成文件名：时间戳 + 随机数 + 原始扩展名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  },
})

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 只允许上传图片
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('只允许上传图片文件！'), false)
  }
}

// 创建 multer 实例
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 限制文件大小为 5MB
  },
}).single('image') // 直接在这里配置 single

// 上传单个文件
exports.uploadSingle = (req, res) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json(error('文件上传失败：' + err.message, 400))
    } else if (err) {
      return res.status(400).json(error(err.message, 400))
    }

    if (!req.file) {
      return res.status(400).json(error('请选择要上传的文件', 400))
    }

    // 返回文件访问路径
    const fileUrl = `/uploads/${req.file.filename}`
    console.log({ fileUrl })

    res.json(
      success({
        url: fileUrl,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
      })
    )
  })
}

// 创建多文件上传的 multer 实例
const uploadMultiple = multer({
  storage: storage,
  fileFilter: fileFilter,
}).array('images', 5) // 直接在这里配置 array

// 上传多个文件
exports.uploadMultiple = (req, res) => {
  uploadMultiple(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json(error('文件上传失败：' + err.message, 400))
    } else if (err) {
      return res.status(400).json(error(err.message, 400))
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json(error('请选择要上传的文件', 400))
    }

    // 返回所有文件的访问路径
    const fileUrls = req.files.map((file) => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
    }))

    res.json(success(fileUrls))
  })
}
