const { Classify, Bill } = require('../models');

// 初始化分类数据
const initClassifies = [
  {
    label: '餐饮',
    type: '1',
    icon: '/icons/food.png',
    color_icon: '/icons/food-color.png',
    status: 1
  },
  {
    label: '交通',
    type: '1',
    icon: '/icons/transport.png',
    color_icon: '/icons/transport-color.png',
    status: 1
  },
  {
    label: '工资',
    type: '2',
    icon: '/icons/salary.png',
    color_icon: '/icons/salary-color.png',
    status: 1
  }
];

// 初始化账单数据
const initBills = [
  {
    type: '1',
    amount: 100.00,
    date: Date.now(),
    status: 1,
    classify_id: 1
  },
  {
    type: '2',
    amount: 5000.00,
    date: Date.now() - 86400000,
    status: 1,
    classify_id: 3
  }
];

// 执行初始化
const initData = async () => {
  try {
    // 插入分类数据
    await Classify.bulkCreate(initClassifies);
    console.log('分类数据初始化成功');

    // 插入账单数据
    await Bill.bulkCreate(initBills);
    console.log('账单数据初始化成功');

  } catch (error) {
    console.error('数据初始化失败:', error);
  }
};

// 执行初始化
initData(); 