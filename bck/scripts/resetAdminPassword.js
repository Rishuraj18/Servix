const bcrypt = require('bcrypt');
const db = require('../config/db');

const reset = async () => {
  const email = process.argv[2] || 'admin@servix.com';
  const password = process.argv[3] || 'admin123';
  const hash = await bcrypt.hash(password, 10);

  const [result] = await db.query(
    `INSERT INTO admins (name, email, password, role)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE password = VALUES(password), role = VALUES(role)`,
    ['Super Admin', email, hash, 'superadmin']
  );

  console.log(`Admin ready: ${email} / ${password}`);
  process.exit(result ? 0 : 1);
};

reset().catch((error) => {
  console.error(error);
  process.exit(1);
});
