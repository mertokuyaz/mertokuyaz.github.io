document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const mineButton = document.getElementById('mine-button');
    const blockDataInput = document.getElementById('block-data');
    const difficultySelect = document.getElementById('difficulty');
    const threadsInput = document.getElementById('threads');
    const statusLog = document.getElementById('status-log');
    const themeToggle = document.getElementById('theme-toggle');
    
    // UI Containers
    const errorContainer = document.getElementById('error-container');
    const initialMessage = document.getElementById('initial-message');
    const statsContainer = document.getElementById('stats-container');
    const resultsContainer = document.getElementById('results-container');
    const successBlock = document.getElementById('success-block');
    const blockchainContainer = document.getElementById('blockchain-container');
    const blocksWrapper = document.getElementById('blocks-wrapper');
    const confettiCanvas = document.getElementById('confetti-canvas');
    
    // Stats & Success Elements
    const timeSpentElem = document.getElementById('time-spent');
    const hashRateElem = document.getElementById('hash-rate');
    const expectedTimeElem = document.getElementById('expected-time');
    const successNonceElem = document.getElementById('success-nonce');
    const successHashElem = document.getElementById('success-hash');
    
    let isMining = false;
    let totalHashes = 0, startTime, statsInterval, lastAttemptedHash = '';
    let globalMaxNonce = 0;
    let workers = [];
    let blockCount = 0;

    // --- Theme Management ---
    const initializeTheme = () => {
        const savedTheme = localStorage.getItem('bitcoin-miner-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');
        
        document.documentElement.setAttribute('data-theme', theme);
    };

    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('bitcoin-miner-theme', newTheme);
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

    // --- Core UI Reset ---
    const resetUI = () => {
        initialMessage.classList.remove('hidden');
        statsContainer.classList.add('hidden');
        resultsContainer.classList.add('hidden');
        successBlock.classList.add('hidden');
        statusLog.textContent = 'Ready to start.';
    };

    // --- Confetti & Sounds ---
    const playSuccessSound = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) { 
            console.warn('Audio play failed', e); 
        }
    };

    const fireConfetti = () => {
        if (!confettiCanvas) return;
        const ctx = confettiCanvas.getContext('2d');
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
        
        const pieces = [];
        const colors = ['#f7931a', '#28a745', '#0056b3', '#d9534f', '#ffffff'];
        for(let i = 0; i < 100; i++) {
            pieces.push({
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 0.5) * 20 - 5,
                size: Math.random() * 10 + 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                rot: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 10
            });
        }
        
        let animationId;
        const render = () => {
            ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
            let active = false;
            pieces.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.5; // gravity
                p.rot += p.rotSpeed;
                if(p.y < window.innerHeight) active = true;
                
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot * Math.PI / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
                ctx.restore();
            });
            if (active) {
                animationId = requestAnimationFrame(render);
            } else {
                ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
            }
        };
        render();
        // Cleanup safety
        setTimeout(() => {
            cancelAnimationFrame(animationId);
            ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        }, 5000);
    };

    // --- Success Handler & Blockchain Builder ---
    const handleSuccess = (finalNonce, finalHash, dataUsed) => {
        clearInterval(statsInterval);
        isMining = false;
        workers.forEach(w => w.terminate());
        workers = [];

        successNonceElem.textContent = finalNonce.toLocaleString();
        successHashElem.textContent = finalHash;

        statsContainer.classList.add('hidden');
        successBlock.classList.remove('hidden');
        
        const elapsedSeconds = ((performance.now() - startTime) / 1000).toFixed(2);
        
        // Strict XSS safe updates
        statusLog.textContent = '';
        const sDiv = document.createElement('div');
        const sStrong = document.createElement('strong');
        sStrong.textContent = `Success! Found hash in ${elapsedSeconds}s.`;
        sDiv.appendChild(sStrong);
        statusLog.appendChild(sDiv);
        
        const tDiv = document.createElement('div');
        tDiv.textContent = `Total hashes: ${totalHashes.toLocaleString()}`;
        statusLog.appendChild(tDiv);
        
        playSuccessSound();
        fireConfetti();
        
        // --- Build Mini-Blockchain ---
        blockCount++;
        blockchainContainer.classList.remove('hidden');
        
        const card = document.createElement('div');
        card.className = 'block-card';
        
        const header = document.createElement('div');
        header.className = 'block-header';
        header.textContent = `Block #${blockCount}`;
        card.appendChild(header);
        
        const contentStr = `Data:\n${dataUsed}\n\nNonce: ${finalNonce}\nHash: ${finalHash}`;
        const dataRow = document.createElement('div');
        dataRow.className = 'block-data-row';
        const label = document.createElement('div');
        label.className = 'block-data-label';
        label.textContent = 'Block Content';
        const val = document.createElement('div');
        val.className = 'block-data-value';
        val.textContent = contentStr;
        
        dataRow.appendChild(label);
        dataRow.appendChild(val);
        card.appendChild(dataRow);
        blocksWrapper.appendChild(card);
        
        // Setup the next block data to chain it
        const nextTimestamp = Math.floor(Date.now() / 1000);
        const mockMerkle = Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
        blockDataInput.value = `Previous Hash: ${finalHash}\nMerkle Root: ${mockMerkle}\nTimestamp: ${nextTimestamp}`;
        
        setControlsDisabled(false);
    };

    // --- Stats Update Loop ---
    const updateStatsAndLog = () => {
        const elapsedSeconds = (performance.now() - startTime) / 1000;
        const hashRate = isMining && elapsedSeconds > 0 ? (totalHashes / elapsedSeconds) : 0;
        const difficulty = parseInt(difficultySelect.value);
        const expectedHashes = Math.pow(16, difficulty);
        const etaSeconds = hashRate > 0 ? (expectedHashes - totalHashes) / hashRate : Infinity;

        timeSpentElem.textContent = `${elapsedSeconds.toFixed(1)}s`;
        hashRateElem.textContent = Math.round(hashRate).toLocaleString();
        expectedTimeElem.textContent = formatTime(etaSeconds);
        
        // Strict XSS safe updates
        statusLog.textContent = '';
        const numThreads = threadsInput ? threadsInput.value : 1;
        const lines = [
            `Searching with ${numThreads} thread(s)...`,
            `Max Nonce checked: ~${globalMaxNonce.toLocaleString()}`
        ];
        lines.forEach(text => {
            const div = document.createElement('div');
            div.textContent = text;
            statusLog.appendChild(div);
        });
        
        const hashDiv = document.createElement('div');
        hashDiv.textContent = `Last Hash: `;
        const hashSpan = document.createElement('span');
        hashSpan.className = 'hash-value';
        hashSpan.textContent = lastAttemptedHash;
        hashDiv.appendChild(hashSpan);
        statusLog.appendChild(hashDiv);
    };

    const formatTime = (seconds) => {
        if (seconds === Infinity || isNaN(seconds)) return '...';
        if (seconds < 60) return `${seconds.toFixed(1)}s`;
        if (seconds < 3600) return `${(seconds / 60).toFixed(1)} min`;
        if (seconds < 86400 * 2) return `${(seconds / 3600).toFixed(1)} hours`;
        return `${(seconds / 86400).toFixed(1)} days`;
    };

    // --- UI Control Functions ---
    const setControlsDisabled = (disabled) => {
        mineButton.textContent = disabled ? 'Stop Mining' : 'Start Mining';
        mineButton.classList.toggle('start', !disabled);
        mineButton.classList.toggle('stop', disabled);
        blockDataInput.disabled = disabled;
        difficultySelect.disabled = disabled;
        if (threadsInput) threadsInput.disabled = disabled;
    };

    const startMining = () => {
        // Enforce limits to prevent resource exhaustion (Security limit)
        if (blockDataInput.value.length > 2000) {
            alert('Error: Block data is too large. Limit is 2000 characters.');
            return;
        }

        isMining = true;
        startTime = performance.now();
        totalHashes = 0;
        globalMaxNonce = 0;
        lastAttemptedHash = '...';

        resetUI(); 
        initialMessage.classList.add('hidden'); 
        statsContainer.classList.remove('hidden'); 
        resultsContainer.classList.remove('hidden'); 
        
        setControlsDisabled(true);
        const data = blockDataInput.value;
        const difficulty = parseInt(difficultySelect.value);
        const target = '0'.repeat(difficulty);
        const threads = Math.max(1, Math.min(16, parseInt(threadsInput ? threadsInput.value : 1) || 1));
        
        statusLog.textContent = `Mining started. Searching for hash starting with "${target}"...`;
        statsInterval = setInterval(updateStatsAndLog, 500);
        
        // Initialize Web Workers
        workers.forEach(w => w.terminate()); // clean up any stale workers
        workers = [];
        
        const batchSize = 2000;
        for (let i = 0; i < threads; i++) {
            const worker = new Worker('worker.js');
            worker.onmessage = (e) => {
                const msg = e.data;
                if (msg.type === 'progress') {
                    totalHashes += msg.hashesDone;
                    lastAttemptedHash = msg.lastHash;
                    if (msg.lastNonce > globalMaxNonce) globalMaxNonce = msg.lastNonce;
                } else if (msg.type === 'success') {
                    if (isMining) { // Prevent multiple calls
                        handleSuccess(msg.nonce, msg.hash, data);
                    }
                } else if (msg.type === 'error') {
                    console.error('Worker error:', msg.message);
                }
            };
            worker.onerror = (err) => console.error("Worker error details:", err);
            
            worker.postMessage({
                type: 'start',
                data: { blockData: data, target, startNonce: i, step: threads, batchSize }
            });
            workers.push(worker);
        }
    };

    const stopMining = () => {
        isMining = false;
        clearInterval(statsInterval);
        workers.forEach(w => w.terminate());
        workers = [];
        setControlsDisabled(false);
        resetUI(); 
    };

    // --- Initialization ---
    initializeTheme();
    
    // Set default threads based on hardware limits
    if (navigator.hardwareConcurrency && threadsInput) {
        threadsInput.value = Math.min(navigator.hardwareConcurrency, 16);
    }
    
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('bitcoin-miner-theme')) {
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
    });
    
    if (checkCryptoSupport()) {
        resetUI();
        mineButton.addEventListener('click', () => {
            if (isMining) {
                stopMining();
            } else {
                startMining();
            }
        });
    }
});

