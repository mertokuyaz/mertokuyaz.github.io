// worker.js
const calculateSHA256 = async (input) => {
    const textAsBuffer = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', textAsBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    let hashHex = '';
    for (let i = 0; i < hashArray.length; i++) {
        const hex = hashArray[i].toString(16);
        hashHex += hex.length === 1 ? '0' + hex : hex;
    }
    return hashHex;
};

let isMining = false;

self.onmessage = async (e) => {
    const { type, data } = e.data;
    
    if (type === 'start') {
        isMining = true;
        const { blockData, target, startNonce, step, batchSize } = data;
        let currentNonce = startNonce;
        let hashesDone = 0;
        let lastHash = '';

        while (isMining) {
            for (let i = 0; i < batchSize; i++) {
                if (!isMining) break;
                
                if (currentNonce >= Number.MAX_SAFE_INTEGER) {
                    self.postMessage({ type: 'error', message: 'Nonce overflow' });
                    isMining = false;
                    break;
                }

                lastHash = await calculateSHA256(blockData + currentNonce);
                hashesDone++;

                if (lastHash.startsWith(target)) {
                    self.postMessage({ type: 'success', nonce: currentNonce, hash: lastHash });
                    isMining = false;
                    return;
                }
                currentNonce += step;
            }

            if (isMining) {
                self.postMessage({ type: 'progress', hashesDone, lastHash, lastNonce: currentNonce - step });
                hashesDone = 0;
            }
        }
    } else if (type === 'stop') {
        isMining = false;
    }
};
