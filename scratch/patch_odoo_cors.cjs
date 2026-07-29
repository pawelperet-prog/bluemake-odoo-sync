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

const pyCode = `import logging

from odoo.http import Controller, dispatch_rpc, route

from . import RPC_DEPRECATION_NOTICE, _check_request

logger = logging.getLogger(__name__)


class JSONRPC(Controller):
    @route('/jsonrpc', type='jsonrpc', auth="none", save_session=False, cors="*")
    def jsonrpc(self, service, method, args):
        """ Method used by client APIs to contact OpenERP. """
        logger.warning(RPC_DEPRECATION_NOTICE, __name__)
        _check_request()
        return dispatch_rpc(service, method, args)
`;

const b64 = Buffer.from(pyCode).toString('base64');

console.log('=== Base64 overwriting jsonrpc.py ===');
run(`ssh root@100.116.164.6 "pct exec 150 -- sh -c 'echo ${b64} | base64 -d > /usr/lib/python3/dist-packages/odoo/addons/rpc/controllers/jsonrpc.py'"`);

console.log('=== Verifying jsonrpc.py ===');
run('ssh root@100.116.164.6 "pct exec 150 -- cat /usr/lib/python3/dist-packages/odoo/addons/rpc/controllers/jsonrpc.py"');

console.log('=== Restarting Odoo Service ===');
run('ssh root@100.116.164.6 "pct exec 150 -- systemctl restart odoo"');
