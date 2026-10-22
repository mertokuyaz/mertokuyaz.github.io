const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function load(language, storageThrows = false) {
    const events = {};
    const selector = { addEventListener: (name, handler) => { events[name] = handler; } };
    const context = vm.createContext({
        navigator: { language }, Intl, Event,
        localStorage: { getItem() { if (storageThrows) throw new Error('blocked'); return null; }, setItem() { if (storageThrows) throw new Error('blocked'); } },
        document: { documentElement: {}, querySelectorAll: () => [], getElementById: () => selector, dispatchEvent() {} },
        window: {}
    });
    const source = fs.readFileSync(require.resolve('../i18n.js'), 'utf8');
    vm.runInContext(source.replace('const messages = {', 'const messages = globalThis.dictionary = {'), context);
    return { ...context, events };
}

test('both languages contain the same keys and interpolation placeholders', () => {
    const { dictionary } = load('en');
    assert.deepEqual(Object.keys(dictionary.en).sort(), Object.keys(dictionary.tr).sort());
    for (const key of Object.keys(dictionary.en)) {
        assert.deepEqual([...dictionary.en[key].matchAll(/\{\w+\}/g)].map(match => match[0]).sort(), [...dictionary.tr[key].matchAll(/\{\w+\}/g)].map(match => match[0]).sort(), key);
    }
    const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');
    for (const match of html.matchAll(/data-i18n(?:-aria)?="([^"]+)"/g)) assert.ok(dictionary.en[match[1]], match[1]);
});

test('Turkish locale, interpolation and language switching work without storage', () => {
    const context = load('tr-TR', true);
    assert.equal(context.document.documentElement.lang, 'tr');
    assert.equal(context.window.I18n.t('block', { number: 3 }), 'Blok #3');
    assert.equal(context.window.I18n.number(1234.5, 1), '1.234,5');
    context.events.change({ target: { value: 'en' } });
    assert.equal(context.document.documentElement.lang, 'en');
    assert.equal(context.window.I18n.t('startMining'), 'Start mining');
});
