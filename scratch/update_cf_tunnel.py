import subprocess

path = '/root/.cloudflared/pobieracz.yml'
res = subprocess.check_output(['pct', 'exec', '555', '--', 'cat', path]).decode('utf-8')
if 'bm.pestkalink.pl' not in res:
    entry = """  - hostname: bm.pestkalink.pl
    service: http://192.168.1.108:3000
  - hostname: bm.domowyasystent.online
    service: http://192.168.1.108:3000
  - service: http_status:404"""
    new_res = res.replace('  - service: http_status:404', entry)
    with open('/tmp/new_pobieracz.yml', 'w', encoding='utf-8') as f:
        f.write(new_res)
    subprocess.check_call(['pct', 'push', '555', '/tmp/new_pobieracz.yml', path])
    subprocess.check_call(['pct', 'exec', '555', '--', 'systemctl', 'restart', 'cloudflared'])
    print('SUCCESS: Added bm.pestkalink.pl and restarted cloudflared!')
else:
    print('bm.pestkalink.pl already present in config!')

check = subprocess.check_output(['pct', 'exec', '555', '--', 'tail', '-n', '15', path]).decode('utf-8')
print('Current pobieracz.yml tail:\n', check)
