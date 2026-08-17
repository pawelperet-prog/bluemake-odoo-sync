import http from 'http';
import net from 'net';

function checkPort(host, port, timeout = 300) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function scan() {
  console.log('Rozpoczynam skanowanie lokalnej sieci...');
  const subnets = ['192.168.1.', '192.168.33.', '192.168.0.'];
  const ports = [8069, 80, 8080, 8006, 81];

  for (const subnet of subnets) {
    console.log(`\nSkanuję podsieć ${subnet}0/24 na portach: ${ports.join(', ')}...`);
    const promises = [];

    for (let i = 1; i <= 254; i++) {
      const ip = `${subnet}${i}`;
      for (const port of ports) {
        promises.push(
          checkPort(ip, port).then(isOpen => {
            if (isOpen) {
              console.log(`[OTWARTY] ${ip}:${port}`);
              return { ip, port };
            }
            return null;
          })
        );
      }
    }

    const results = (await Promise.all(promises)).filter(Boolean);
    console.log(`Znaleziono ${results.length} aktywnych portów w podsieci ${subnet}0/24.`);
  }
}

scan().catch(console.error);
