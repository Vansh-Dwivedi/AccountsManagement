const roleHierarchy = {
  admin: ['admin', 'office_head', 'head_director', 'master_dept_a', 'master_dept_b', 'master_dept_c', 'master_dept_d', 'master_dept_e', 'operator_a', 'operator_b', 'operator_c', 'operator_d', 'helper', 'manager', 'client', 'user'],
  office_head: ['office_head', 'head_director', 'master_dept_a', 'master_dept_b', 'master_dept_c', 'master_dept_d', 'master_dept_e', 'operator_a', 'operator_b', 'operator_c', 'operator_d', 'helper'],
  head_director: ['head_director', 'master_dept_a', 'master_dept_b', 'master_dept_c', 'master_dept_d', 'master_dept_e', 'operator_a', 'operator_b', 'operator_c', 'operator_d', 'helper'],
  master_dept_a: ['master_dept_a', 'operator_a', 'helper'],
  master_dept_b: ['master_dept_b', 'operator_b', 'helper'],
  master_dept_c: ['master_dept_c', 'operator_c', 'helper'],
  master_dept_d: ['master_dept_d', 'operator_d', 'helper'],
  master_dept_e: ['master_dept_e', 'helper'],
  operator_a: ['operator_a'],
  operator_b: ['operator_b'],
  operator_c: ['operator_c'],
  operator_d: ['operator_d'],
  helper: ['helper'],
  manager: ['manager', 'client', 'user'],
  client: ['client'],
  user: ['user']
};

const roleCheck = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRole = req.user.role;
    const allowedRoles = roleHierarchy[userRole] || [];

    if (!roles.some(role => allowedRoles.includes(role))) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
};

module.exports = roleCheck;