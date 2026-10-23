const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

class Element {
    constructor() {
        this.children = [];
        this.listeners = {};
        this.dataset = {};
        this.style = {};
        this.classes = new Set();
        this.classList = {
            toggle: (name, enabled) => enabled ? this.classes.add(name) : this.classes.delete(name),
            add: name => this.classes.add(name),
            remove: name => this.classes.delete(name)
        };
    }
    addEventListener(name, callback) { this.listeners[name] = callback; }
    setAttribute(name, value) { this[name] = value; }
    append(...elements) { this.children.push(...elements); }
    appendChild(element) { this.append(element); }
    replaceChildren(...elements) { this.children = elements; }
    fire(name, values = {}) { this.listeners[name]?.({ target: this, ...values }); }
}

function loadUI(file, { savedTheme = null, storageBlocked = false } = {}) {
    const elements = new Map();
    const get = id => {
        if (!elements.has(id)) elements.set(id, new Element());
        return elements.get(id);
    };
    const document = new Element();
    document.documentElement = new Element();
    document.getElementById = get;
    document.createElement = () => new Element();
    document.querySelectorAll = () => [];
    const window = new Element();
    const media = new Element();
    media.matches = false;
    window.matchMedia = () => media;
    window.crypto = crypto;
    window.Worker = class {};
    const timers = new Map();
    let nextTimer = 0;
    const context = vm.createContext({
        document, window, navigator: { language: 'en', hardwareConcurrency: 4 },
        localStorage: {
            getItem: key => {
                if (storageBlocked) throw new Error('Storage blocked');
                return key === 'bitcoin-miner-theme' ? savedTheme : null;
            },
            setItem: (key, value) => {
                if (storageBlocked) throw new Error('Storage blocked');
                if (key === 'bitcoin-miner-theme') savedTheme = value;
            }
        },
        Intl, Event, DOMException, console, performance,
        MiningCore: { sampleRace: () => ({ winner: 1, seconds: 1 }) },
        PerformanceChart: class { draw() {} },
        setTimeout: callback => { const id = ++nextTimer; timers.set(id, callback); return id; },
        clearTimeout: id => timers.delete(id)
    });
    vm.runInContext(fs.readFileSync(require.resolve('../i18n.js'), 'utf8'), context);
    context.I18n = window.I18n;
    vm.runInContext(fs.readFileSync(require.resolve(`../${file}`), 'utf8'), context);
    return {
        get, window, media, document, timers,
        tick() {
            const [id, callback] = timers.entries().next().value;
            timers.delete(id);
            callback();
        }
    };
}

test('leaving a running race cancels its timer and restores usable controls', () => {
    const ui = loadUI('race.js');
    ui.get('start-race').fire('click');
    assert.equal(ui.get('start-race').textContent, 'Stop race');
    ui.window.fire('pagehide', { persisted: true });
    assert.equal(ui.timers.size, 0);
    assert.equal(ui.get('start-race').textContent, 'Start 30-round race');
    assert.equal(ui.get('reset-race').disabled, false);
    for (const card of ui.get('race-miners').children) assert.equal(card.children[2].disabled, false);
    assert.equal(ui.get('race-status').textContent, 'Race stopped after 0 completed rounds.');
    ui.get('start-race').fire('click');
    assert.equal(ui.timers.size, 1);
    assert.equal(ui.get('start-race').textContent, 'Stop race');
});

test('navigation preserves completed race results and does not alter an idle race', () => {
    const ui = loadUI('race.js');
    ui.window.fire('pagehide', { persisted: true });
    assert.equal(ui.get('race-status').textContent, 'Ready. Adjust the powers and start a race.');
    ui.get('start-race').fire('click');
    ui.tick();
    ui.window.fire('pagehide', { persisted: true });
    assert.equal(ui.get('race-status').textContent, 'Race stopped after 1 completed rounds.');
    assert.equal(ui.get('race-miners').children[1].children[6].textContent, '1 wins · observed 100%');
    assert.equal(ui.timers.size, 0);
});

test('manual theme survives system theme changes when storage is blocked', () => {
    const ui = loadUI('script.js', { storageBlocked: true });
    ui.get('theme-toggle').fire('click');
    assert.equal(ui.document.documentElement.dataset.theme, 'dark');
    ui.media.fire('change', { matches: false });
    assert.equal(ui.document.documentElement.dataset.theme, 'dark');
});

test('theme follows the system until selected manually, and honors a saved selection', () => {
    const ui = loadUI('script.js');
    ui.media.fire('change', { matches: true });
    assert.equal(ui.document.documentElement.dataset.theme, 'dark');
    ui.get('theme-toggle').fire('click');
    ui.media.fire('change', { matches: true });
    assert.equal(ui.document.documentElement.dataset.theme, 'light');
    const saved = loadUI('script.js', { savedTheme: 'dark' });
    saved.media.fire('change', { matches: false });
    assert.equal(saved.document.documentElement.dataset.theme, 'dark');
});
