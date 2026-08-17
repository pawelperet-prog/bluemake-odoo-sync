import net from 'net';

function checkPort(host, port, timeout = 250) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
    socket.on('error', () => { socket.destroy(); resolve(false); });
    socket.connect(port, host);
  });
}

async function testIpPorts() {
  const hosts = ['192.168.1.52', '192.168.1.201', '192.168.1.150', '192.168.1.103', '192.168.1.100', '192.168.1.200'];
  // Also scan all 1..254 on 8069 and 80
  for (let i = 1; i <= 254; i++) {
    const ip = `192.168.1.${i}`;
    const p8069 = await checkPort(ip, 8069, 150);
    if (p8069) console.log(`[FOUND ODOO 8069] ${ip}:8069`);
    const p80 = await checkPort(ip, 80, 150);
    if (p80 && !['192.168.1.1'].includes(ip)) console.log(`[FOUND HTTP 80] ${ip}:80`);
    const p443 = await checkPort(ip, 443, 150);
    if (p443) console.log(`[FOUND HTTPS 443] ${ip}:443`);
  }
}

testIpPorts().catch(console.error);
