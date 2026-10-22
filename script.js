(function () {
    'use strict';
    const { t, number, formatTime, storage } = I18n;
    const Core = MiningCore;
    const byId = id => document.getElementById(id);
    const mineButton = byId('mine-button');
    const blockDataInput = byId('block-data');
    const difficultySelect = byId('difficulty');
    const threadsInput = byId('threads');
    const chart = new PerformanceChart();
    const chain = [];
    let validation = [];
    let revision = 0;
    let checking = false;
    let busy = false;
    let operation = null;
    let activeJob = null;
    let lastMining = null;
    let status = { key: 'initial', values: {} };
    let chainNotice = null;
    let cardRefs = [];
    const supported = Boolean(window.crypto?.subtle && window.Worker);

    // Theme and language settings remain local; storage may be unavailable.
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    document.documentElement.dataset.theme = storage.get('bitcoin-miner-theme') || (media.matches ? 'dark' : 'light');
    byId('theme-toggle').addEventListener('click', () => {
        const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = theme;
        storage.set('bitcoin-miner-theme', theme);
        chart.draw();
    });
    media.addEventListener('change', event => {
        if (!storage.get('bitcoin-miner-theme')) {
            document.documentElement.dataset.theme = event.matches ? 'dark' : 'light';
            chart.draw();
        }
    });
    threadsInput.value = Math.min(navigator.hardwareConcurrency || 1, 4);
    byId('error-container').classList.toggle('hidden', supported);

    function renderControls() {
        const invalid = validation.some(result => !result.valid);
        mineButton.disabled = !supported || (busy && operation?.kind !== 'main') || (!busy && (checking || invalid));
        mineButton.textContent = t(busy && operation?.kind === 'main' ? 'stopMining' : 'startMining');
        mineButton.classList.toggle('start', !busy);
        mineButton.classList.toggle('stop', busy);
        [threadsInput, difficultySelect, blockDataInput].forEach(input => { input.disabled = busy; });
        byId('demo-chain').disabled = !supported || busy || checking || chain.length > 0;
        byId('repair-chain').disabled = !supported || busy || checking || !invalid;
        byId('reset-chain').disabled = busy || checking || !chain.length;
        byId('stop-chain').classList.toggle('hidden', !busy || operation?.kind === 'main');
        byId('clear-chart').disabled = busy;
        cardRefs.forEach(refs => { refs.input.disabled = busy; });
    }

    function renderMining() {
        const job = activeJob;
        byId('initial-message').classList.toggle('hidden', Boolean(job || lastMining));
        byId('results-container').classList.toggle('hidden', !job && !lastMining);
        byId('stats-container').classList.toggle('hidden', !job && !lastMining);
        byId('success-block').classList.toggle('hidden', !lastMining?.success || Boolean(job));
        const stats = job || lastMining;
        if (stats) {
            const elapsed = job ? (performance.now() - job.started) / 1000 : stats.elapsed;
            const rate = elapsed > 0 ? stats.hashes / elapsed : 0;
            byId('time-spent').textContent = formatTime(elapsed);
            byId('hash-rate').textContent = number(rate);
            byId('expected-time').textContent = formatTime(Core.expectedWait(stats.block.difficulty, rate));
            if (job) {
                byId('status-log').textContent = t('searching', {
                    threads: number(job.threads), hashes: number(job.hashes), nonce: number(job.nonce), hash: job.hash || '…'
                });
            } else {
                byId('status-log').textContent = t(status.key, status.key === 'mined' ? { time: formatTime(stats.elapsed), hashes: number(stats.hashes) } : status.values);
            }
            if (lastMining?.success) {
                byId('success-nonce').textContent = number(lastMining.nonce);
                byId('success-hash').textContent = lastMining.hash;
            }
        }
    }

    function renderChainStatus() {
        const invalid = validation.filter(result => !result.valid).length;
        const first = validation.findIndex(result => !result.valid) + 1;
        byId('chain-status').textContent = checking ? t('checking') : chainNotice ? t(chainNotice.key, chainNotice.values)
            : !chain.length ? t('chainEmpty') : invalid ? t('chainInvalid', { count: number(invalid), first: number(first) }) : t('chainValid', { count: number(chain.length) });
        cardRefs.forEach((refs, index) => {
            const block = chain[index], result = validation[index];
            const pending = checking || !result;
            refs.card.classList.toggle('block-invalid', !pending && !result.valid);
            refs.card.classList.toggle('block-checking', pending);
            refs.badge.textContent = t(pending ? 'checkingShort' : result.valid ? 'valid' : 'invalid');
            refs.hash.textContent = pending ? '…' : block.hash;
            refs.previous.textContent = block.previousHash;
            refs.nonce.textContent = `${t('nonce')}: ${number(block.nonce)} · ${t('difficultyShort')}: ${number(block.difficulty)}`;
            const reasons = [];
            if (!pending) {
                if (!result.proofValid) reasons.push(t('proofBad'));
                if (!result.linkValid) reasons.push(t('linkBad'));
                if (!result.ancestorValid) reasons.push(t('ancestorBad'));
                if (result.valid) reasons.push(t('proofOk'));
            }
            refs.reason.textContent = reasons.join(' ');
        });
        renderControls();
    }

    function renderCards() {
        byId('blocks-wrapper').replaceChildren();
        cardRefs = chain.map((block, index) => {
            const card = document.createElement('article'); card.className = 'block-card';
            const header = document.createElement('div'); header.className = 'block-heading';
            const heading = document.createElement('h3'); heading.textContent = t('block', { number: number(index + 1) });
            const badge = document.createElement('span'); badge.className = 'badge'; header.append(heading, badge);
            const label = document.createElement('label'); label.textContent = t('editData'); label.htmlFor = `chain-data-${index}`;
            const input = document.createElement('textarea'); input.id = label.htmlFor; input.rows = 2; input.maxLength = 2000; input.value = block.data;
            input.setAttribute('aria-label', t('blockDataLabel', { number: number(index + 1) }));
            const previousLabel = document.createElement('div'); previousLabel.className = 'block-data-label'; previousLabel.textContent = t('previousHash');
            const previous = document.createElement('code'); previous.className = 'block-data-value';
            const hashLabel = document.createElement('div'); hashLabel.className = 'block-data-label'; hashLabel.textContent = t('currentHash');
            const hash = document.createElement('code'); hash.className = 'block-data-value';
            const nonce = document.createElement('p'); nonce.className = 'muted small';
            const reason = document.createElement('p'); reason.className = 'block-reason';
            card.append(header, label, input, previousLabel, previous, hashLabel, hash, nonce, reason);
            byId('blocks-wrapper').appendChild(card);
            input.addEventListener('input', () => {
                block.data = input.value;
                chainNotice = null;
                validateCurrentChain().catch(showError);
            });
            return { card, input, badge, previous, hash, nonce, reason };
        });
        renderChainStatus();
    }

    async function validateCurrentChain() {
        const currentRevision = ++revision;
        checking = true;
        renderChainStatus();
        const snapshot = chain.map(block => ({ ...block }));
        const results = await Core.validateChain(snapshot);
        if (currentRevision !== revision) return;
        validation = results;
        results.forEach((result, index) => { chain[index].hash = result.hash; });
        checking = false;
        renderChainStatus();
    }

    function showError(error) {
        if (error.name === 'AbortError') return;
        console.error(error);
        checking = false;
        status = { key: 'miningError', values: {} };
        byId('error-container').classList.remove('hidden');
        byId('error-container').firstElementChild.dataset.i18n = 'miningError';
        byId('error-container').firstElementChild.textContent = t('miningError');
        renderMining();
        renderChainStatus();
    }

    const threadCount = () => Math.max(1, Math.min(16, Math.trunc(Number(threadsInput.value)) || 1));
    const abortError = () => new DOMException('Stopped', 'AbortError');

    function runJob(block) {
        if (operation?.cancelled) return Promise.reject(abortError());
        return new Promise((resolve, reject) => {
            const threads = threadCount();
            threadsInput.value = threads;
            const job = {
                block: { ...block }, threads, workers: [], hashes: 0, nonce: 0, hash: '', started: performance.now(),
                session: chart.start(threads, block.difficulty), resolve, reject
            };
            activeJob = job;
            lastMining = null;
            const finish = (result, message) => {
                if (activeJob !== job) return;
                clearInterval(job.interval);
                job.workers.forEach(worker => worker.terminate());
                const elapsed = (performance.now() - job.started) / 1000;
                chart.sample(job.session, elapsed, job.hashes);
                chart.finish(job.session, result);
                lastMining = { ...job, workers: [], elapsed, success: result === 'complete' };
                // Do not keep closures and promises in completed history.
                delete lastMining.resolve; delete lastMining.reject; delete lastMining.finish;
                activeJob = null;
                status = { key: result === 'complete' ? 'mined' : result === 'cancelled' ? 'stopped' : 'miningError', values: {} };
                renderMining();
                if (result === 'complete') resolve({ ...block, nonce: message.nonce, hash: message.hash });
                else reject(result === 'cancelled' ? abortError() : new Error('Mining worker failed'));
            };
            job.finish = finish;
            job.interval = setInterval(() => {
                chart.sample(job.session, (performance.now() - job.started) / 1000, job.hashes);
                renderMining();
            }, 500);
            renderMining();
            try {
                for (let index = 0; index < threads; index++) {
                    const worker = new Worker('worker.js');
                    job.workers.push(worker);
                    worker.onmessage = event => {
                        if (activeJob !== job) return;
                        const message = event.data;
                        if (message.type === 'error') { finish('failed'); return; }
                        job.hashes += message.hashesDone || 0;
                        job.hash = message.hash || message.lastHash || job.hash;
                        job.nonce = Math.max(job.nonce, message.nonce ?? message.lastNonce ?? 0);
                        if (message.type === 'success') {
                            // The worker's nonce/hash are the actual successful pair,
                            // not the highest nonce seen on another thread.
                            job.nonce = message.nonce;
                            finish('complete', message);
                        }
                    };
                    worker.onerror = event => { event.preventDefault(); finish('failed'); };
                    worker.postMessage({ type: 'start', data: {
                        blockData: Core.serializeBlock(block), target: '0'.repeat(block.difficulty), startNonce: index, step: threads
                    } });
                }
            } catch { finish('failed'); }
        });
    }

    async function beginOperation(kind, task) {
        if (busy || checking || !supported) return;
        busy = true;
        operation = { kind, cancelled: false };
        chainNotice = null;
        byId('error-container').classList.add('hidden');
        renderControls();
        try {
            await task();
        } catch (error) {
            if (error.name === 'AbortError') chainNotice = kind === 'main' ? null : { key: 'operationStopped', values: {} };
            else showError(error);
        } finally {
            busy = false;
            operation = null;
            await validateCurrentChain().catch(showError);
            renderCards();
            renderMining();
        }
    }

    function stopOperation() {
        if (operation) operation.cancelled = true;
        activeJob?.finish('cancelled');
    }

    function celebrate() {
        // Preserve the original success sound and release its audio resources.
        try {
            const Audio = window.AudioContext || window.webkitAudioContext;
            if (Audio) {
                const audio = new Audio();
                const oscillator = audio.createOscillator();
                const gain = audio.createGain();
                oscillator.connect(gain); gain.connect(audio.destination);
                oscillator.frequency.value = 880;
                gain.gain.setValueAtTime(0.1, audio.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.25);
                oscillator.onended = () => { audio.close().catch(() => {}); };
                oscillator.start(); oscillator.stop(audio.currentTime + 0.25);
            }
        } catch { /* Audio is optional and may be blocked by the browser. */ }
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const canvas = byId('confetti-canvas'), ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth; canvas.height = window.innerHeight;
        const particles = Array.from({ length: 60 }, () => ({
            x: canvas.width / 2, y: canvas.height / 3, vx: (Math.random() - 0.5) * 12, vy: Math.random() * -10,
            color: ['#f7931a', '#28a745', '#1874cc'][Math.floor(Math.random() * 3)]
        }));
        const started = performance.now();
        const frame = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (performance.now() - started > 1800) return;
            particles.forEach(particle => {
                particle.x += particle.vx; particle.y += particle.vy; particle.vy += 0.3;
                ctx.fillStyle = particle.color; ctx.fillRect(particle.x, particle.y, 6, 6);
            });
            requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
    }

    mineButton.addEventListener('click', () => {
        if (busy) { stopOperation(); return; }
        if (blockDataInput.value.length > 2000) { alert(t('invalidData')); return; }
        if (validation.some(result => !result.valid)) { alert(t('fixFirst')); return; }
        beginOperation('main', async () => {
            const block = await runJob({
                data: blockDataInput.value, previousHash: chain.at(-1)?.hash || Core.GENESIS_HASH,
                nonce: 0, difficulty: Number(difficultySelect.value)
            });
            chain.push(block);
            celebrate();
        });
    });

    byId('demo-chain').addEventListener('click', () => beginOperation('demo', async () => {
        for (let index = 0; index < 3; index++) {
            chainNotice = { key: 'building', values: { current: index + 1 } };
            renderChainStatus();
            const block = await runJob({ data: t(`demoData${index + 1}`), previousHash: chain.at(-1)?.hash || Core.GENESIS_HASH, nonce: 0, difficulty: 2 });
            chain.push(block);
            await validateCurrentChain();
            renderCards();
        }
        chainNotice = null;
    }));

    byId('repair-chain').addEventListener('click', () => beginOperation('repair', async () => {
        const first = validation.findIndex(result => !result.valid);
        for (let index = first; index >= 0 && index < chain.length; index++) {
            chainNotice = { key: 'repairing', values: { current: index + 1, total: chain.length } };
            renderChainStatus();
            // Do not mutate the stored link until mining succeeds. Cancelling a
            // repair must not silently change an unmined block's header.
            const block = await runJob({ ...chain[index], previousHash: index ? chain[index - 1].hash : Core.GENESIS_HASH });
            chain[index] = block;
            await validateCurrentChain();
            renderCards();
        }
        chainNotice = null;
    }));
    byId('stop-chain').addEventListener('click', stopOperation);
    byId('reset-chain').addEventListener('click', () => {
        revision++;
        chain.length = 0; validation = []; checking = false; chainNotice = null;
        renderCards();
    });
    document.addEventListener('languagechange', () => { renderCards(); renderMining(); });
    window.addEventListener('pagehide', stopOperation);
    renderCards();
    chart.draw();
})();
