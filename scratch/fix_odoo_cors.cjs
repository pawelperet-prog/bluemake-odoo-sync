const { execSync } = require('child_process');

function run(cmd) {
  console.log('Running:', cmd);
  try {
    const out = execSync(cmd, { encoding: 'utf8' });
    console.log('OUTPUT:', out);
    return out;
  } catch (e) {
    console.error('ERROR:', e.message);
  }
}

console.log('=== Base64 append http_cors = * ===');
run('ssh root@100.116.164.6 "pct exec 150 -- sed -i \'/http_cors/d\' /etc/odoo/odoo.conf"');
run('ssh root@100.116.164.6 "pct exec 150 -- bash -c \'echo http_cors = \\\"*\\\" >> /etc/odoo/odoo.conf\'"');

console.log('=== Verifying Updated Config ===');
run('ssh root@100.116.164.6 "pct exec 150 -- cat /etc/odoo/odoo.conf"');

console.log('=== Restarting Odoo Service ===');
run('ssh root@100.116.164.6 "pct exec 150 -- systemctl restart odoo"');
