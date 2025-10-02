document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const mineButton = document.getElementById('mine-button');
    const blockDataInput = document.getElementById('block-data');
    const difficultySelect = document.getElementById('difficulty');
    const statusLog = document.getElementById('status-log');
    
    // UI Containers
    const errorContainer = document.getElementById('error-container');
    const initialMessage = document.getElementById('initial-message');
    const statsContainer = document.getElementById('stats-container');
    const resultsContainer = document.getElementById('results-container');
    const successBlock = document.getElementById('success-block');
    
    // Stats & Success Elements
    const timeSpentElem = document.getElementById('time-spent');
    const hashRateElem = document.getElementById('hash-rate');
    const expectedTimeElem = document.getElementById('expected-time');
    const successNonceElem = document.getElementById('success-nonce');
    const successHashElem = document.getElementById('success-hash');
    
    let isMining = false;
    let nonce = 0, totalHashes = 0, startTime, statsInterval, lastAttemptedHash = '';
    const HASHES_PER_BATCH = 5000;
    const STATS_STABILITY_DELAY = 750; // ms to wait before showing hash rate/ETA

    // --- NEW: Settings Persistence ---
    const saveSettings = () => {
        const settings = {
            blockData: blockDataInput.value,
            difficulty: difficultySelect.value,
        };
        localStorage.setItem('miningSimulatorSettings', JSON.stringify(settings));
    };

    const loadSettings = () => {
        const settings = JSON.parse(localStorage.getItem('miningSimulatorSettings'));
        if (settings) {
            blockDataInput.value = settings.blockData;
            difficultySelect.value = settings.difficulty;
        }
    };

    // --- Core Checks & Hashing ---
    const checkCryptoSupport = () => {
        if (!window.crypto || !window.crypto.subtle) {
            errorContainer.classList.remove('hidden');
            mineButton.disabled = true;
            return false;
        }
        return true;
    };

    const calculateSHA256 = async (input) => {
        const textAsBuffer = new TextEncoder().encode(input);
        const hashBuffer = await crypto.subtle.digest('SHA-256', textAsBuffer);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0')).join('');
    };

    // --- UI State Management ---
    const resetUI = () => {
        initialMessage.classList.remove('hidden');
        [statsContainer, resultsContainer, successBlock].forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('visible'); // Remove animation class
        });
        statusLog.textContent = 'Awaiting start...';
    };

    const handleSuccess = (finalNonce, finalHash) => {
        clearInterval(statsInterval);
        isMining = false;

        successNonceElem.textContent = finalNonce.toLocaleString();
        successHashElem.textContent = finalHash;

        statsContainer.classList.add('hidden');
        statsContainer.classList.remove('visible');
        successBlock.classList.remove('hidden');
        setTimeout(() => successBlock.classList.add('visible'), 10); // Animate in

        const elapsedSeconds = ((performance.now() - startTime) / 1000).toFixed(2);
        statusLog.innerHTML = `<strong>Success! Found hash in ${elapsedSeconds}s.</strong>\nTotal hashes: ${totalHashes.toLocaleString()}`;
        
        setControlsDisabled(false);
    };
    
    // MODIFIED: Update stats logic for stability
    const updateStatsAndLog = () => {
        const elapsedMs = performance.now() - startTime;
        const elapsedSeconds = elapsedMs / 1000;
        timeSpentElem.textContent = `${elapsedSeconds.toFixed(1)}s`;

        // Only show hash rate and ETA after a delay for stability
        if (elapsedMs > STATS_STABILITY_DELAY) {
            const hashRate = totalHashes / elapsedSeconds;
            const difficulty = parseInt(difficultySelect.value);
            const expectedHashes = Math.pow(16, difficulty);
            const etaSeconds = hashRate > 0 ? (expectedHashes - totalHashes) / hashRate : Infinity;

            hashRateElem.textContent = Math.round(hashRate).toLocaleString();
            expectedTimeElem.textContent = formatTime(etaSeconds);
        } else {
            hashRateElem.textContent = '...';
            expectedTimeElem.textContent = '...';
        }

        statusLog.innerHTML = `Searching...\nNonce: ${nonce.toLocaleString()}\nLast Hash: <span class="hash-value">${lastAttemptedHash}</span>`;
    };

    const formatTime = (seconds) => { /* ... (unchanged) ... */ };

    // --- Main Mining Loop ---
    async function mine(data, target) { /* ... (unchanged) ... */ }

    // --- UI Control Functions ---
    const setControlsDisabled = (disabled) => { /* ... (unchanged) ... */ };

    const startMining = () => {
        isMining = true;
        startTime = performance.now();
        nonce = 0;
        totalHashes = 0;
        lastAttemptedHash = '...';

        resetUI();
        initialMessage.classList.add('hidden');
        resultsContainer.classList.remove('hidden');
        statsContainer.classList.remove('hidden');
        setTimeout(() => { // Animate in the containers
            resultsContainer.classList.add('visible');
            statsContainer.classList.add('visible');
        }, 10);
        
        setControlsDisabled(true);
        saveSettings(); // NEW: Save settings on start
        const data = blockDataInput.value;
        const difficulty = parseInt(difficultySelect.value);
        const target = '0'.repeat(difficulty);
        
        statusLog.textContent = `Mining started. Searching for hash starting with "${target}"...`;
        statsInterval = setInterval(updateStatsAndLog, 250); // Faster interval for smoother log
        
        mine(data, target);
    };

    const stopMining = () => { /* ... (unchanged, still calls resetUI) ... */ };

    // --- Main Initializer ---
    function initialize() {
        if (checkCryptoSupport()) {
            loadSettings(); // NEW: Load settings on page load
            resetUI();
            mineButton.addEventListener('click', () => {
                if (isMining) stopMining();
                else startMining();
            });
            // NEW: Save settings when inputs are changed manually
            blockDataInput.addEventListener('change', saveSettings);
            difficultySelect.addEventListener('change', saveSettings);
        }
    }

    initialize();
});
