const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('b_monthly_asset_stats', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    month: {
      type: DataTypes.STRING(7),
      allowNull: false,
      unique: 'user_month',
      comment: '统计月份（格式：YYYY-MM）'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: 'user_month',
      comment: '用户ID',
      references: {
        model: 'b_user',
        key: 'id'
      }
    },
    positive: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    negative: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: '状态 1-正常 0-删除'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'b_monthly_asset_stats',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'month']
      }
    ],
    comment: '月度资产统计表',
    freezeTableName: true
  });
};
