const sequelize = require('../config/database')
const { DataTypes } = require('sequelize')
const MonthlyAssetStats = require('./monthly-asset-stats.model')(sequelize)
// 账单模型
const Bill = sequelize.define(
  'b_bill',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '主键ID',
    },
    type: {
      type: DataTypes.ENUM('1', '2'),
      allowNull: false,
      comment: '类型：1-支出，2-收入',
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '状态：0-删除，1-正常',
    },
    date: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: '时间戳（毫秒）',
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: '金额',
    },
    classify_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '分类ID',
      references: {
        model: 'b_classify',
        key: 'id',
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '用户ID',
      references: {
        model: 'b_user',
        key: 'id',
      },
    },

    remark: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '备注说明',
    },
    tag_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '标签ID',
    },
    assets_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '资产ID',
      references: {
        model: 'b_assets',
        key: 'id',
      },
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: '图片地址数组',
    },
  },
  {
    timestamps: false,
    freezeTableName: true,
  }
)

// 分类模型
const Classify = sequelize.define(
  'b_classify',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '主键ID',
    },
    label: {
      type: DataTypes.STRING(16),
      allowNull: false,
      comment: '分类名称',
    },
    type: {
      type: DataTypes.ENUM('1', '2'),
      allowNull: false,
      comment: '类型：1-支出，2-收入',
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '图标地址',
    },
    color_icon: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '彩色图标地址',
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '状态：0-删除，1-正常',
    },
  },
  {
    timestamps: false,
    freezeTableName: true,
  }
)

// 预算模型
const Budget = sequelize.define(
  'b_budget',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '主键ID',
    },
    type: {
      type: DataTypes.ENUM('1', '2'),
      allowNull: false,
      comment: '类型：1-月预算，2-年预算',
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '预算金额',
    },
    classify_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '分类ID，为空表示总预算',
      references: {
        model: 'b_classify',
        key: 'id',
      },
    },
    isTotal: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否为总预算：0-否，1-是',
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: '父预算ID',
      references: {
        model: 'b_budget',
        key: 'id',
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '用户ID',
      references: {
        model: 'b_user',
        key: 'id',
      },
    },
  },
  {
    timestamps: true,
    freezeTableName: true,
  }
)

// 建立预算表的自关联关系
Budget.belongsTo(Budget, {
  foreignKey: 'parent_id',
  as: 'parent',
})

Budget.hasMany(Budget, {
  foreignKey: 'parent_id',
  as: 'children',
})

// 资产账户模型
const AssetsAccount = sequelize.define(
  'b_assets_account',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '主键ID',
    },
    name: {
      type: DataTypes.STRING(32),
      allowNull: false,
      comment: '账户名称',
    },
    type: {
      type: DataTypes.ENUM('1', '2'),
      allowNull: false,
      comment: '类型：1-正资产，2-负资产',
    },
    remark: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '备注说明',
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '图标地址',
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: '父账户ID',
      references: {
        model: 'b_assets_account',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '状态：0-删除，1-正常',
    },
  },
  {
    timestamps: false,
    freezeTableName: true,
  }
)

// 资产模型
const Assets = sequelize.define(
  'b_assets',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '主键ID',
    },
    assets_account_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '资产账户ID',
      references: {
        model: 'b_assets_account',
        key: 'id',
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '用户ID',
      references: {
        model: 'b_user',
        key: 'id',
      },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: '资产金额',
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '状态：0-删除，1-正常',
    },
    name: {
      type: DataTypes.STRING(32),
      allowNull: false,
      comment: '资产名称',
    },
    remark: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '备注说明',
    },
    type: {
      type: DataTypes.ENUM('1', '2'),
      allowNull: false,
      comment: '类型：1-正资产，2-负资产',
    },
    card_number: {
      type: DataTypes.STRING(32),
      allowNull: true,
      comment: '卡号',
    },
  },
  {
    timestamps: true, // 启用时间戳
    freezeTableName: true,
  }
)

// 资产变化记录模型
const AssetsChangeRecord = sequelize.define(
  'b_assets_change_records',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '主键ID',
    },
    assets_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '资产ID',
      references: {
        model: 'b_assets',
        key: 'id',
      },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: '资产金额',
    },
    remark: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '变更备注',
    },
    type: {
      type: DataTypes.ENUM('1', '2', '3', '4', '5'),
      allowNull: false,
      comment: '1-手动添加，2-转入，3-转出，4-支出，5-收入',
      defaultValue: '1',
    },
  },
  {
    timestamps: true, // 启用 createdAt
    updatedAt: false, // 禁用 updatedAt
    freezeTableName: true,
  }
)

// 用户模型
const User = sequelize.define(
  'b_user',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '主键ID',
    },
    nickname: {
      type: DataTypes.STRING(32),
      allowNull: true,
      comment: '用户昵称',
    },
    sex: {
      type: DataTypes.ENUM('0', '1', '2'),
      allowNull: true,
      defaultValue: '0',
      comment: '性别：0-未知，1-男，2-女',
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '头像地址',
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '状态：0-禁用，1-正常',
    },
    level: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '用户等级，0-未注册，1-已经注册',
    },
    phonenumber: {
      type: DataTypes.STRING(11),
      allowNull: true,

      comment: '手机号码',
    },
    password: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: '密码',
    },
    device_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: '设备唯一ID',
      defaultValue: '',
    },
  },
  {
    timestamps: true,
    freezeTableName: true,
  }
)

// 消息模型
const Message = sequelize.define(
  'b_message',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '主键ID',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '消息内容',
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '状态：0-删除，1-正常',
    },
    already_read_list: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      comment: '已读用户ID列表',
    },
    send_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '发送时间',
    },
  },
  {
    timestamps: true, // 启用 createdAt
    updatedAt: false, // 禁用 updatedAt
    freezeTableName: true,
  }
)

// 标签模型
const Tag = sequelize.define(
  'b_tags',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '主键ID',
    },
    classify_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '分类ID',
      references: {
        model: 'b_classify',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING(12), // 4个中文字符最多占用12个字节
      allowNull: false,
      comment: '标签名称',
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '状态：0-删除，1-正常',
    },
  },
  {
    timestamps: false,
    freezeTableName: true,
  }
)

// 管理员模型
const Admin = sequelize.define(
  'b_admin',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '主键ID',
    },
    name: {
      type: DataTypes.STRING(32),
      allowNull: false,

      comment: '管理员名称',
    },
    password: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: '密码',
    },
    level: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '管理员等级：1-普通管理员，2-超级管理员',
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '状态：0-禁用，1-正常',
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后登录时间',
    },
  },
  {
    timestamps: true,
    freezeTableName: true,
  }
)

// 建立关联关系
Bill.belongsTo(Classify, {
  foreignKey: 'classify_id',
  as: 'classify',
})

Classify.hasMany(Bill, {
  foreignKey: 'classify_id',
  as: 'bills',
})

Budget.belongsTo(Classify, {
  foreignKey: 'classify_id',
  as: 'classify',
})

Classify.hasMany(Budget, {
  foreignKey: 'classify_id',
  as: 'budgets',
})

// 建立自关联关系
AssetsAccount.belongsTo(AssetsAccount, {
  foreignKey: 'parent_id',
  as: 'parent',
})

AssetsAccount.hasMany(AssetsAccount, {
  foreignKey: 'parent_id',
  as: 'children',
})

// 建立资产与资产账户的关联关系
Assets.belongsTo(AssetsAccount, {
  foreignKey: 'assets_account_id',
  as: 'account',
})

AssetsAccount.hasMany(Assets, {
  foreignKey: 'assets_account_id',
  as: 'assets',
})

// 建立资产变化记录与资产的关联关系
AssetsChangeRecord.belongsTo(Assets, {
  foreignKey: 'assets_id',
  as: 'asset',
})

Assets.hasMany(AssetsChangeRecord, {
  foreignKey: 'assets_id',
  as: 'changeRecords',
})

// 建立用户与其他表的关联关系
Bill.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
})

User.hasMany(Bill, {
  foreignKey: 'user_id',
  as: 'bills',
})

Budget.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
})

User.hasMany(Budget, {
  foreignKey: 'user_id',
  as: 'budgets',
})

Assets.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
})

User.hasMany(Assets, {
  foreignKey: 'user_id',
  as: 'assets',
})

// 添加与资产的关联关系
Bill.belongsTo(Assets, {
  foreignKey: 'assets_id',
  as: 'asset',
})

Assets.hasMany(Bill, {
  foreignKey: 'assets_id',
  as: 'bills',
})

// 建立标签与分类的关联关系
Tag.belongsTo(Classify, {
  foreignKey: 'classify_id',
  as: 'classify',
})

Classify.hasMany(Tag, {
  foreignKey: 'classify_id',
  as: 'tags',
})

//同步所有模型
// sequelize
//   .sync({ alter: true })
//   .then(() => {
//     console.log('数据库模型同步完成')
//   })
//   .catch((err) => {
//     console.error('数据库模型同步失败:', err)
//   })

module.exports = {
  sequelize,
  Bill,
  Classify,
  Budget,
  AssetsAccount,
  Assets,
  AssetsChangeRecord,
  User,
  Message,
  Tag,
  Admin,
  MonthlyAssetStats,
}
