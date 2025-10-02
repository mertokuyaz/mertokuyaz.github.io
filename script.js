document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const mineButton = document.getElementById('mine-button');
    const blockDataInput = document.getElementById('block-data');
    const difficultySelect = document.getElementById('difficulty');
    const statusLog = document.getElementById('status-log');
    const themeToggle = document.getElementById('theme-toggle');
    
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

    // --- Theme Management ---
    const initializeTheme = () => {
        const savedTheme = localStorage.getItem('bitcoin-miner-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');
        
        document.documentElement.setAttribute('data-theme', theme);
    };

    const toggleTheme = () => {
        console.log('Toggle theme function called');
        const currentTheme = document.documentElement.getAttribute('data-theme');
        console.log('Current theme:', currentTheme);
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        console.log('New theme:', newTheme);
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('bitcoin-miner-theme', newTheme);
        console.log('Theme changed to:', newTheme);
    };

    // --- Core Web Crypto API Check ---
    const checkCryptoSupport = () => {
        if (!window.crypto || !window.crypto.subtle) {
            errorContainer.classList.remove('hidden');
            mineButton.disabled = true;
            return false;
        }
        return true;
    };

    // --- Core Hashing & State Management ---
    const calculateSHA256 = async (input) => {
        const textAsBuffer = new TextEncoder().encode(input);
        const hashBuffer = await crypto.subtle.digest('SHA-256', textAsBuffer);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0')).join('');
    };

    // NEW: Centralized function to reset the UI to its initial state.
    const resetUI = () => {
        initialMessage.classList.remove('hidden');
        statsContainer.classList.add('hidden');
        resultsContainer.classList.add('hidden');
        successBlock.classList.add('hidden');
        statusLog.innerHTML = 'Ready to start.';
    };

    const handleSuccess = (finalNonce, finalHash) => {
        clearInterval(statsInterval);
        isMining = false;

        successNonceElem.textContent = finalNonce.toLocaleString();
        successHashElem.textContent = finalHash;

        statsContainer.classList.add('hidden');
        successBlock.classList.remove('hidden');
        
        const elapsedSeconds = ((performance.now() - startTime) / 1000).toFixed(2);
        statusLog.innerHTML = `<strong>Success! Found hash in ${elapsedSeconds}s.</strong>\nTotal hashes: ${totalHashes.toLocaleString()}`;
        
        setControlsDisabled(false); // Re-enable controls
    };

    // MODIFIED: Update stats now also updates the live hash in the log
    const updateStatsAndLog = () => {
        const elapsedSeconds = (performance.now() - startTime) / 1000;
        const hashRate = isMining && elapsedSeconds > 0 ? (totalHashes / elapsedSeconds) : 0;
        const difficulty = parseInt(difficultySelect.value);
        const expectedHashes = Math.pow(16, difficulty);
        const etaSeconds = hashRate > 0 ? (expectedHashes - totalHashes) / hashRate : Infinity;

        timeSpentElem.textContent = `${elapsedSeconds.toFixed(1)}s`;
        hashRateElem.textContent = Math.round(hashRate).toLocaleString();
        expectedTimeElem.textContent = formatTime(etaSeconds);
        
        // NEW: Update status log with live data for better feedback
        statusLog.innerHTML = `Searching...\nChecked up to nonce: ${nonce.toLocaleString()}\nLast Hash: <span class="hash-value">${lastAttemptedHash}</span>`;
    };

    const formatTime = (seconds) => {
        if (seconds === Infinity || isNaN(seconds)) return '...';
        if (seconds < 60) return `${seconds.toFixed(1)}s`;
        if (seconds < 3600) return `${(seconds / 60).toFixed(1)} min`;
        if (seconds < 86400 * 2) return `${(seconds / 3600).toFixed(1)} hours`;
        return `${(seconds / 86400).toFixed(1)} days`;
    };

    // --- Main Mining Loop ---
    async function mine(data, target) {
        if (!isMining) return;

        let found = false;
        let finalNonce, finalHash;
        
        for (let i = 0; i < HASHES_PER_BATCH; i++) {
            const currentNonce = nonce + i;
            const hash = await calculateSHA256(data + currentNonce);
            
            if (hash.startsWith(target)) {
                totalHashes += (i + 1);
                found = true;
                finalNonce = currentNonce;
                finalHash = hash;
                break;
            }
        }
        
        nonce += HASHES_PER_BATCH;
        totalHashes += HASHES_PER_BATCH;
        lastAttemptedHash = await calculateSHA256(data + nonce); // Get a hash for display

        if (found) {
            handleSuccess(finalNonce, finalHash);
        } else {
            setTimeout(() => mine(data, target), 0); // Continue mining
        }
    }

    // --- UI Control Functions ---
    const setControlsDisabled = (disabled) => {
        mineButton.textContent = disabled ? 'Stop Mining' : 'Start Mining';
        mineButton.classList.toggle('start', !disabled);
        mineButton.classList.toggle('stop', disabled);
        blockDataInput.disabled = disabled;
        difficultySelect.disabled = disabled;
    };

    const startMining = () => {
        isMining = true;
        startTime = performance.now();
        nonce = 0;
        totalHashes = 0;
        lastAttemptedHash = '...';

        resetUI(); // Clear old results first
        initialMessage.classList.add('hidden'); // Hide initial message
        statsContainer.classList.remove('hidden'); // Show stats
        resultsContainer.classList.remove('hidden'); // show log container
        
        setControlsDisabled(true);
        const data = blockDataInput.value;
        const difficulty = parseInt(difficultySelect.value);
        const target = '0'.repeat(difficulty);
        
        statusLog.textContent = `Mining started. Searching for hash starting with "${target}"...`;
        statsInterval = setInterval(updateStatsAndLog, 500);
        
        mine(data, target);
    };

    const stopMining = () => {
        isMining = false;
        clearInterval(statsInterval);
        setControlsDisabled(false);
        resetUI(); // MODIFIED: Call the centralized reset function for a clean stop.
    };

    // --- Main Initializer and Event Listeners ---
    // Initialize theme first
    initializeTheme();
    
    // Theme toggle event listener
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
        console.log('Theme toggle button found and event listener attached');
    } else {
        console.error('Theme toggle button not found!');
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('bitcoin-miner-theme')) {
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
    });
    
    if (checkCryptoSupport()) {
        resetUI(); // Set the initial clean state on page load.
        mineButton.addEventListener('click', () => {
            if (isMining) {
                stopMining();
            } else {
                startMining();
            }
        });
    }
});


