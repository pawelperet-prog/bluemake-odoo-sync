/**
 * MQTT Cloud Printing Service for Zebra Link-OS Printers
 * Compatible with HiveMQ Cloud, custom Mosquitto / EMQX brokers, and Cloudflare
 */

const LOCAL_STORAGE_MQTT_KEY = 'bluemake_mqtt_config';

const DEFAULT_MQTT_CONFIG = {
  enabled: true,
  host: 'mqtt.domowyasystent.online',
  port: 443,
  protocol: 'wss',
  path: '',
  username: '',
  password: '',
  topic: 'bluemake/printers/zebra'
};

export function getMqttConfig() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MQTT_KEY);
    return raw ? { ...DEFAULT_MQTT_CONFIG, ...JSON.parse(raw) } : { ...DEFAULT_MQTT_CONFIG };
  } catch (e) {
    return { ...DEFAULT_MQTT_CONFIG };
  }
}

export function saveMqttConfig(cfg) {
  localStorage.setItem(LOCAL_STORAGE_MQTT_KEY, JSON.stringify(cfg));
}

/**
 * Generate high-precision ZPL II code for 50x30mm thermal label
 * Label Size @ 203dpi = 400 dots width x 240 dots height
 */
export function generateProductZpl(product) {
  const sku = (product.sku || 'SKU').replace(/["\\]/g, '');
  const rawName = (product.name || 'Produkt').replace(/["\\]/g, '');
  const displayName = rawName
    .replace(/\bFI\s*([0-9]+)/gi, 'Ø$1')
    .replace(/\bFI\b/gi, 'Ø');

  // Split name to 2 lines max 22 chars each
  const line1 = displayName.substring(0, 22);
  const line2 = displayName.length > 22 ? displayName.substring(22, 44) : '';

  return [
    '^XA',
    '^PW600',                       // Print width (50mm @ 300dpi)
    '^LL360',                       // Label length (30mm @ 300dpi)
    '^LH0,0',                       // Home position
    '^CI28',                        // UTF-8 character encoding
    // Left: QR Code (~24mm x 24mm)
    '^FO25,30',
    '^BQN,2,8',                     // QR model 2, magnification 8
    `^FDMM,A${sku}^FS`,             // QR data
    // Right: SKU in border box
    '^FO290,30',
    '^GB290,65,3^FS',               // Box
    '^FO305,48',
    '^A0N,32,32',                   // Font 0, 32x32 dots
    `^FD${sku}^FS`,
    // Right: Product Name
    '^FO290,115',
    '^A0N,28,28',
    `^FD${line1}^FS`,
    ...(line2 ? [`^FO290,155`, `^A0N,28,28`, `^FD${line2}^FS`] : []),
    // Right: Bottom Divider Line & ID
    '^FO290,290',
    '^GB290,3,3^FS',
    '^FO290,310',
    '^A0N,24,24',
    `^FDID: ${product.id}^FS`,
    '^XZ'
  ].join('\n');
}

/**
 * Connect to MQTT broker via WebSockets and publish ZPL
 */
export function sendZplViaMqtt(zpl) {
  const config = getMqttConfig();
  if (!config.host) {
    return Promise.reject(new Error('Brak skonfigurowanego adresu brokera MQTT (wejdź w Ustawienia ⚙️).'));
  }

  return new Promise((resolve, reject) => {
    if (!window.mqtt) {
      return reject(new Error('Biblioteka MQTT nie została załadowana. Sprawdź połączenie z internetem.'));
    }

    const host = config.host.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '').replace(/\/.*$/, '');
    const url = `${config.protocol}://${host}:${config.port}${config.path || '/mqtt'}`;

    const options = {
      clientId: 'bluemake_app_' + Math.random().toString(16).substring(2, 8),
      connectTimeout: 7000,
      clean: true
    };

    if (config.username) options.username = config.username;
    if (config.password) options.password = config.password;

    let client = null;
    let timeoutId = setTimeout(() => {
      if (client) try { client.end(true); } catch (e) {}
      reject(new Error('Przekroczono limit czasu połączenia z brokerem MQTT (' + host + ')'));
    }, 8000);

    try {
      client = window.mqtt.connect(url, options);

      client.on('connect', () => {
        clearTimeout(timeoutId);
        const topic = config.topic || 'bluemake/printers/zebra';
        
        client.publish(topic, zpl, { qos: 1 }, (err) => {
          client.end();
          if (err) {
            reject(new Error('Błąd publikacji MQTT: ' + err.message));
          } else {
            resolve({ success: true, topic });
          }
        });
      });

      client.on('error', (err) => {
        clearTimeout(timeoutId);
        if (client) try { client.end(true); } catch (e) {}
        reject(new Error('Błąd MQTT: ' + (err.message || 'Nieudane połączenie')));
      });
    } catch (e) {
      clearTimeout(timeoutId);
      reject(e);
    }
  });
}

/**
 * 1-Click Print Helper via MQTT Cloud
 */
export async function printProductViaMqtt(product) {
  const zpl = generateProductZpl(product);
  return await sendZplViaMqtt(zpl);
}

/**
 * Test Connection to MQTT Broker
 */
export function testMqttConnection(customConfig) {
  const config = customConfig || getMqttConfig();
  if (!config.host) {
    return Promise.reject(new Error('Wpisz adres hosta brokera MQTT.'));
  }

  return new Promise((resolve, reject) => {
    if (!window.mqtt) {
      return reject(new Error('Biblioteka MQTT nie została załadowana.'));
    }

    const host = config.host.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '').replace(/\/.*$/, '');
    const url = `${config.protocol || 'wss'}://${host}:${config.port || 8884}${config.path || '/mqtt'}`;

    const options = {
      clientId: 'bluemake_test_' + Math.random().toString(16).substring(2, 8),
      connectTimeout: 5000,
      clean: true
    };

    if (config.username) options.username = config.username;
    if (config.password) options.password = config.password;

    let client = null;
    let timeoutId = setTimeout(() => {
      if (client) try { client.end(true); } catch (e) {}
      reject(new Error('Timeout połączenia z brokerem ' + host));
    }, 6000);

    try {
      client = window.mqtt.connect(url, options);

      client.on('connect', () => {
        clearTimeout(timeoutId);
        client.end();
        resolve({ success: true, host, port: config.port });
      });

      client.on('error', (err) => {
        clearTimeout(timeoutId);
        if (client) try { client.end(true); } catch (e) {}
        reject(new Error('Błąd połączenia z brokerem: ' + (err.message || 'Brak odpowiedzi')));
      });
    } catch (e) {
      clearTimeout(timeoutId);
      reject(e);
    }
  });
}
