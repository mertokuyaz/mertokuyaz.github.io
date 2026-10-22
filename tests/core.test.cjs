const { test } = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../core.js');

async function mine(data, previousHash = Core.GENESIS_HASH, difficulty = 1) {
    const block = { data, previousHash, difficulty, nonce: 0 };
    do { block.hash = await Core.hashBlock(block); }
    while (!block.hash.startsWith('0'.repeat(difficulty)) && ++block.nonce);
    return block;
}

test('SHA-256 matches a known vector', async () => {
    assert.equal(await Core.sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('three mined blocks form a valid linked chain', async () => {
    const first = await mine('Alice → Bob');
    const second = await mine('Bob → Carol', first.hash);
    const third = await mine('Carol → Deniz', second.hash);
    const validation = await Core.validateChain([first, second, third]);
    assert.ok(validation.every(block => block.valid));
});

test('tampering invalidates descendants; ordered re-mining repairs them', async () => {
    const first = await mine('original');
    const second = await mine('second', first.hash);
    const third = await mine('third', second.hash);
    const chain = [first, second, third];
    // Choose a deterministic edit that does not accidentally satisfy the easy target.
    let suffix = 0;
    do { first.data = `tampered ${suffix++}`; first.hash = await Core.hashBlock(first); }
    while (first.hash.startsWith('0'));
    const invalid = await Core.validateChain(chain);
    assert.deepEqual(invalid.map(block => block.valid), [false, false, false]);
    assert.equal(invalid[1].linkValid, false);
    assert.equal(invalid[2].linkValid, true);
    assert.equal(invalid[2].ancestorValid, false);
    for (let index = 0; index < chain.length; index++) {
        chain[index] = await mine(chain[index].data, index ? chain[index - 1].hash : Core.GENESIS_HASH);
    }
    assert.ok((await Core.validateChain(chain)).every(block => block.valid));
});

test('editing a middle block leaves its parent valid', async () => {
    const first = await mine('first');
    const second = await mine('second', first.hash);
    let suffix = 0;
    do { second.data = `edit ${suffix++}`; second.hash = await Core.hashBlock(second); }
    while (second.hash.startsWith('0'));
    const result = await Core.validateChain([first, second]);
    assert.equal(result[0].valid, true);
    assert.equal(result[1].valid, false);
});

test('the first block must reference the genesis hash', async () => {
    const wrong = await mine('data', 'a'.repeat(64));
    const [result] = await Core.validateChain([wrong]);
    assert.equal(result.proofValid, true);
    assert.equal(result.linkValid, false);
    assert.equal(result.valid, false);
});

test('serialization commits to both data and previous hash without ambiguity', () => {
    assert.notEqual(Core.serializeBlock({ previousHash: 'a', data: 'bc' }), Core.serializeBlock({ previousHash: 'ab', data: 'c' }));
});

test('expected waiting time is memoryless and scales with difficulty and speed', () => {
    assert.equal(Core.expectedWait(2, 256), 1);
    assert.equal(Core.expectedWait(3, 256), 16);
    assert.equal(Core.expectedWait(2, 512), 0.5);
    assert.equal(Core.expectedWait(4, 0), Infinity);
});

test('race is power-weighted, but all miners can win', () => {
    let seed = 123456789;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
    const wins = [0, 0, 0];
    for (let index = 0; index < 60000; index++) wins[Core.sampleRace([10, 30, 60], random).winner]++;
    [0.1, 0.3, 0.6].forEach((probability, index) => assert.ok(Math.abs(wins[index] / 60000 - probability) < 0.01));
});

test('race handles random boundaries and rejects invalid power', () => {
    assert.ok(Number.isFinite(Core.sampleRace([1, 1, 1], () => 0).seconds));
    assert.ok(Number.isFinite(Core.sampleRace([1, 1, 1], () => 1).seconds));
    for (const powers of [[], [0, 1], [-1, 2], [NaN], [Infinity]]) assert.throws(() => Core.sampleRace(powers), RangeError);
});
