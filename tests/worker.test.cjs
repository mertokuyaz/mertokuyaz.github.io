const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Core = require('../core.js');
const source = fs.readFileSync(require.resolve('../worker.js'), 'utf8');

async function runWorker(data) {
    const messages = [];
    const context = vm.createContext({ TextEncoder, crypto, performance, self: { postMessage: message => messages.push(message) } });
    vm.runInContext(source, context);
    await context.self.onmessage({ data: { type: 'start', data } });
    return messages;
}

test('worker reports the successful batch and hashes the same header as the model', async () => {
    const block = { previousHash: Core.GENESIS_HASH, data: '<script>test</script>', nonce: 0, difficulty: 1 };
    const messages = await runWorker({ blockData: Core.serializeBlock(block), target: '0', startNonce: 1, step: 3 });
    const success = messages.at(-1);
    assert.equal(success.type, 'success');
    assert.equal(success.nonce % 3, 1);
    assert.equal(success.hash, await Core.hashBlock({ ...block, nonce: success.nonce }));
    assert.equal(messages.reduce((sum, message) => sum + message.hashesDone, 0), (success.nonce - 1) / 3 + 1);
});

test('worker returns errors for invalid input instead of hanging', async () => {
    const messages = await runWorker({ blockData: 'test', target: 'no', startNonce: 0, step: 0 });
    assert.equal(messages.at(-1).type, 'error');
});
