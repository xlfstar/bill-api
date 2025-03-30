// 成功响应
exports.success = (data, message = 'success') => {
  return {
    code: 200,
    success: true,
    message,
    data
  };
};

// 错误响应
exports.error = (message, code = 500) => {
  return {
    code,
    success: false,
    message
  };
}; 