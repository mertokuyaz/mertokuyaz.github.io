(function () {
    'use strict';
    const { t, number } = I18n;
    const names = ['A', 'B', 'C'];
    const powers = [10, 30, 60];
    let wins = [0, 0, 0];
    let completed = 0;
    let running = false;
    let timer;
    let winner = -1;
    let status = { key: 'raceIdle', values: {} };
    const container = document.getElementById('race-miners');
    const startButton = document.getElementById('start-race');
    const resetButton = document.getElementById('reset-race');
    const cards = names.map((name, index) => {
        const card = document.createElement('div');
        card.className = 'miner-card';
        const heading = document.createElement('h3');
        const label = document.createElement('label');
        const input = document.createElement('input');
        input.type = 'range'; input.min = '1'; input.max = '100'; input.step = '1';
        input.id = `miner-power-${index}`; input.value = powers[index];
        label.htmlFor = input.id;
        const output = document.createElement('output');
        output.htmlFor = input.id;
        const chance = document.createElement('p');
        const track = document.createElement('div');
        track.className = 'race-track'; track.setAttribute('aria-hidden', 'true');
        const bar = document.createElement('div'); bar.className = 'race-bar'; track.appendChild(bar);
        const result = document.createElement('p'); result.className = 'race-result';
        card.append(heading, label, input, output, chance, track, result);
        container.appendChild(card);
        input.addEventListener('input', () => {
            powers[index] = Math.max(1, Math.min(100, Number(input.value) || 1));
            reset('racePowerChanged');
        });
        return { card, heading, label, input, output, chance, bar, result };
    });

    function render() {
        const total = powers.reduce((sum, power) => sum + power, 0);
        cards.forEach((elements, index) => {
            elements.heading.textContent = t('miner', { name: names[index] });
            elements.label.textContent = t('power');
            elements.input.setAttribute('aria-label', t('powerLabel', { name: names[index] }));
            elements.input.disabled = running;
            elements.output.value = number(powers[index]);
            elements.chance.textContent = t('chance', { chance: number(powers[index] / total * 100, 1) });
            const share = completed > 0 ? wins[index] / completed * 100 : 0;
            elements.result.textContent = t('wins', { wins: number(wins[index]), share: number(share, 1) });
            elements.bar.style.width = `${share}%`;
            elements.card.classList.toggle('race-winner', index === winner);
        });
        startButton.textContent = t(running ? 'stopRace' : 'startRace');
        startButton.classList.toggle('danger', running);
        resetButton.disabled = running;
        document.getElementById('race-status').textContent = t(status.key, status.values);
    }

    function reset(key = 'raceIdle') {
        clearTimeout(timer);
        running = false; wins = [0, 0, 0]; completed = 0; winner = -1;
        status = { key, values: {} };
        render();
    }

    function nextRound() {
        if (!running) return;
        if (completed === 30) {
            running = false;
            status = { key: 'raceDone', values: {} };
            render();
            return;
        }
        winner = -1;
        status = { key: 'raceRound', values: { round: completed + 1, completed } };
        render();
        const round = MiningCore.sampleRace(powers);
        timer = setTimeout(() => {
            if (!running) return;
            winner = round.winner;
            wins[winner]++;
            completed++;
            status = { key: 'raceWinner', values: { round: completed, name: names[winner] } };
            render();
            timer = setTimeout(nextRound, 350);
        }, round.seconds * 1000);
    }

    function stop() {
        if (!running) return;
        clearTimeout(timer);
        running = false;
        status = { key: 'raceStopped', values: { completed } };
        render();
    }

    startButton.addEventListener('click', () => {
        if (running) stop();
        else {
            reset();
            running = true;
            nextRound();
        }
    });
    resetButton.addEventListener('click', () => reset());
    document.addEventListener('languagechange', render);
    // A page restored from the back/forward cache keeps its DOM and JS state.
    window.addEventListener('pagehide', stop);
    render();
})();
