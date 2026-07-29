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

const nginxCorsConfig = `
add_header 'Access-Control-Allow-Origin' '*' always;
add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
`;

const base64Config = Buffer.from(nginxCorsConfig).toString('base64');
console.log('=== Writing clean server_proxy.conf ===');
run(`ssh root@100.116.164.6 "pct exec 103 -- sh -c 'echo ${base64Config} | base64 -d > /data/nginx/custom/server_proxy.conf'"`);

console.log('=== Reloading Nginx Proxy Manager ===');
run('ssh root@100.116.164.6 "pct exec 103 -- nginx -s reload"');
