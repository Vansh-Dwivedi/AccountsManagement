const path = require('path');
const { protect, authorize } = require(path.join(__dirname, 'middleware', 'authMiddleware'));

console.log('authMiddleware imported successfully');
console.log('protect:', protect);
console.log('authorize:', authorize);