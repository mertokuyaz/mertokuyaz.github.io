// Shared, DOM-independent model, also used by the Node test suite.
(function (root) {
    'use strict';
    const GENESIS_HASH = '0'.repeat(64);
    const serializeBlock = block => JSON.stringify([block.previousHash, block.data]);
    const sha256 = async text => {
        const bytes = new TextEncoder().encode(text);
        const digest = await crypto.subtle.digest('SHA-256', bytes);
        return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    };
    const hashBlock = block => sha256(serializeBlock(block) + block.nonce);

    const validateChain = async blocks => {
        const hashes = await Promise.all(blocks.map(hashBlock));
        return blocks.map((block, index) => {
            const linkValid = block.previousHash === (index ? hashes[index - 1] : GENESIS_HASH);
            const proofValid = hashes[index].startsWith('0'.repeat(block.difficulty));
            return { hash: hashes[index], linkValid, proofValid };
        }).reduce((results, result, index) => {
            const ancestorValid = index === 0 || results[index - 1].valid;
            results.push({ ...result, ancestorValid, valid: result.linkValid && result.proofValid && ancestorValid });
            return results;
        }, []);
    };

    // Independent exponential clocks model Poisson mining. Their minimum has
    // winner probabilities power / totalPower, unlike deterministic progress bars.
    const sampleRace = (powers, random = Math.random) => {
        if (!powers.length || powers.some(power => !Number.isFinite(power) || power <= 0)) {
            throw new RangeError('Miner power must be positive and finite.');
        }
        const total = powers.reduce((sum, power) => sum + power, 0);
        const times = powers.map(power => {
            const uniform = Math.min(1 - Number.EPSILON, Math.max(Number.EPSILON, random()));
            return -Math.log1p(-uniform) / (power / total);
        });
        const seconds = Math.min(...times);
        return { winner: times.indexOf(seconds), seconds };
    };
    const expectedWait = (difficulty, hashRate) => hashRate > 0 ? 16 ** difficulty / hashRate : Infinity;
    const api = { GENESIS_HASH, serializeBlock, sha256, hashBlock, validateChain, sampleRace, expectedWait };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.MiningCore = api;
})(globalThis);
