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

  // Split name to 2 lines
  let line1 = displayName;
  let line2 = '';
  if (displayName.length > 16) {
    const splitIdx = displayName.lastIndexOf(' ', 16);
    if (splitIdx > 0) {
      line1 = displayName.substring(0, splitIdx);
      line2 = displayName.substring(splitIdx + 1);
    } else {
      line1 = displayName.substring(0, 16);
      line2 = displayName.substring(16);
    }
  }

  return [
    '^XA',
    '^PW600',                       // Print width (50mm @ 300dpi)
    '^LL360',                       // Label length (30mm @ 300dpi)
    '^LH0,0',                       // Home position
    '^CI28',                        // UTF-8 character encoding
    // Left: Big QR Code (~25mm x 25mm filling full left height)
    '^FO15,20',
    '^BQN,2,11',                    // QR model 2, magnification 11
    `^FDMM,A${sku}^FS`,             // QR data
    // Right: Large Bold SKU in border box
    '^FO275,20',
    '^GB310,80,4^FS',               // Box
    '^FO285,40',
    '^A0N,40,40',                   // Large Font
    `^FD${sku}^FS`,
    // Right: Product Name (Bold & High Contrast)
    '^FO275,120',
    '^A0N,36,36',
    `^FD${line1}^FS`,
    ...(line2 ? ['^FO275,165', '^A0N,36,36', `^FD${line2}^FS`] : []),
    // Right: Bottom Divider Line & ID
    '^FO275,270',
    '^GB310,3,3^FS',
    '^FO275,290',
    '^A0N,32,32',
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
