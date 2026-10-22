(function () {
    'use strict';
    const colors = ['#cf6200', '#1874cc', '#248048', '#a64cc2', '#cb4358'];
    const { t, number, formatTime } = I18n;

    window.PerformanceChart = class {
        constructor() {
            this.canvas = document.getElementById('performance-chart');
            this.rows = document.getElementById('performance-rows');
            this.sessions = [];
            this.nextId = 1;
            this.observer = new ResizeObserver(() => this.draw());
            this.observer.observe(this.canvas.parentElement);
            document.addEventListener('languagechange', () => this.render());
            document.getElementById('clear-chart').addEventListener('click', () => {
                this.sessions = [];
                this.render();
            });
            this.render();
        }

        start(threads, difficulty) {
            const session = { id: this.nextId++, threads, difficulty, points: [{ time: 0, rate: 0 }], hashes: 0, seconds: 0, peak: 0, result: 'running' };
            this.sessions.push(session);
            this.sessions = this.sessions.slice(-5);
            this.render();
            return session;
        }

        sample(session, seconds, hashes) {
            const elapsed = seconds - session.seconds;
            if (elapsed <= 0) return;
            const rate = Math.max(0, (hashes - session.hashes) / elapsed);
            session.points.push({ time: seconds, rate });
            // Keep long runs bounded while preserving their full time range.
            if (session.points.length > 240) {
                session.points = session.points.filter((_, index, points) => index % 2 === 0 || index === points.length - 1);
            }
            session.hashes = hashes;
            session.seconds = seconds;
            session.peak = Math.max(session.peak, rate);
            this.render();
        }

        finish(session, result) {
            session.result = result;
            this.render();
        }

        render() {
            document.getElementById('chart-empty').classList.toggle('hidden', this.sessions.length > 0);
            this.rows.replaceChildren();
            this.sessions.forEach(session => {
                const row = document.createElement('tr');
                const values = [
                    `#${session.id}`, number(session.threads), number(session.difficulty),
                    number(session.seconds > 0 ? session.hashes / session.seconds : 0),
                    number(session.peak), formatTime(session.seconds), t(session.result)
                ];
                values.forEach((value, index) => {
                    const cell = document.createElement(index === 0 ? 'th' : 'td');
                    cell.textContent = value;
                    if (index === 0) {
                        cell.scope = 'row';
                        cell.style.color = colors[(session.id - 1) % colors.length];
                    }
                    row.appendChild(cell);
                });
                this.rows.appendChild(row);
            });
            this.draw();
        }

        draw() {
            const canvas = this.canvas;
            const width = canvas.parentElement.clientWidth;
            if (!width) return;
            const height = 260;
            const ratio = window.devicePixelRatio || 1;
            canvas.width = Math.round(width * ratio);
            canvas.height = height * ratio;
            const ctx = canvas.getContext('2d');
            ctx.scale(ratio, ratio);
            const style = getComputedStyle(document.documentElement);
            const muted = style.getPropertyValue('--text-muted').trim();
            const border = style.getPropertyValue('--border-color').trim();
            const left = Math.min(72, width * 0.22), right = 16, top = 25, bottom = 42;
            const plotWidth = width - left - right, plotHeight = height - top - bottom;
            const maxTime = Math.max(5, ...this.sessions.map(session => session.seconds));
            const maxRate = Math.max(10, ...this.sessions.flatMap(session => session.points.map(point => point.rate))) * 1.1;
            ctx.font = '11px Inter, sans-serif';
            ctx.lineWidth = 1;
            for (let index = 0; index <= 4; index++) {
                const y = top + plotHeight * index / 4;
                ctx.strokeStyle = border;
                ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(width - right, y); ctx.stroke();
                ctx.fillStyle = muted;
                ctx.textAlign = 'right';
                const rate = maxRate * (1 - index / 4);
                ctx.fillText(number(rate >= 1000 ? rate / 1000 : rate, rate >= 1000 ? 1 : 0) + (rate >= 1000 ? 'k' : ''), left - 8, y + 4);
                ctx.textAlign = 'center';
                ctx.fillText(number(maxTime * index / 4, 1), left + plotWidth * index / 4, height - bottom + 18);
            }
            ctx.textAlign = 'left'; ctx.fillText(t('chartYAxis'), left, 14);
            ctx.textAlign = 'center'; ctx.fillText(t('chartXAxis'), left + plotWidth / 2, height - 3);
            this.sessions.forEach(session => {
                ctx.strokeStyle = colors[(session.id - 1) % colors.length];
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                session.points.forEach((point, index) => {
                    const x = left + point.time / maxTime * plotWidth;
                    const y = top + plotHeight * (1 - point.rate / maxRate);
                    if (index === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                });
                ctx.stroke();
            });
        }
    };
})();
