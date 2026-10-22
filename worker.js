// Each worker owns a disjoint nonce sequence. Report deltas, including the
// successful batch, so short runs also appear in performance measurements.
'use strict';
const encoder = new TextEncoder();
let isMining = false;

self.onmessage = async event => {
    if (event.data.type === 'stop') {
        isMining = false;
        return;
    }
    if (event.data.type !== 'start' || isMining) return;
    isMining = true;
    const { blockData, target, startNonce, step } = event.data.data;
    let nonce = startNonce;
    let hashesDone = 0;
    let lastReport = performance.now();
    try {
        if (typeof blockData !== 'string' || !/^0{1,7}$/.test(target) || !Number.isInteger(step) || step < 1 || !Number.isSafeInteger(nonce) || nonce < 0) {
            throw new Error('Invalid mining parameters');
        }
        while (isMining) {
            if (!Number.isSafeInteger(nonce)) throw new Error('Nonce overflow');
            const digest = await crypto.subtle.digest('SHA-256', encoder.encode(blockData + nonce));
            const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
            hashesDone++;
            if (hash.startsWith(target)) {
                self.postMessage({ type: 'success', nonce, hash, hashesDone });
                isMining = false;
                return;
            }
            if (performance.now() - lastReport >= 100) {
                self.postMessage({ type: 'progress', hashesDone, lastHash: hash, lastNonce: nonce });
                hashesDone = 0;
                lastReport = performance.now();
            }
            nonce += step;
        }
    } catch (error) {
        isMining = false;
        self.postMessage({ type: 'error', message: error.message });
    }
};
