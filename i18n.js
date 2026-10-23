(function () {
    'use strict';
    const messages = {
        en: {
            title: 'Bitcoin Mining Simulator', subtitle: 'An interactive playground for Proof-of-Work.',
            createdBy: 'Created by', language: 'Language', theme: 'Switch light / dark theme', github: 'View source on GitHub (opens in a new tab)', navigation: 'Experiments',
            navMining: 'Mining', navPerformance: 'Performance', navChain: 'Blockchain lab', navRace: 'Miner race',
            intro: 'Experiment safely: this is an educational simulation, not real Bitcoin mining. Hashing runs locally in your browser.',
            cryptoError: 'Web Crypto or Web Workers are unavailable. Open this site over HTTPS or localhost in a modern browser.',
            controls: 'Mining controls', threads: 'Mining threads (Web Workers)', blockData: 'Block data (up to 2000 characters)', difficulty: 'Difficulty (leading hexadecimal zeros)',
            difficulty2: '2 · Quick demo', difficulty4: '4 · Easy', difficulty5: '5 · Medium', difficulty6: '6 · Hard', difficulty7: '7 · Extreme',
            blockDataHint: 'Edit the example header and transaction data. The Merkle root is illustrative; the simulator adds the chain’s previous-hash link automatically.',
            startMining: 'Start mining', stopMining: 'Stop mining', miningHint: 'Each new block includes the previous block’s hash. Higher difficulty can take a long time; try the quick demo first.',
            liveMining: 'Live mining', initial: 'Click “Start mining” to search for a valid hash.', timeSpent: 'Elapsed', hashRate: 'Hashes / second', eta: 'Expected wait',
            etaHint: 'Expected wait is not a countdown. Each hash is a new independent attempt, so the remaining expected wait does not decrease as attempts fail.',
            successTitle: 'Block mined successfully!', nonce: 'Nonce', resultHash: 'Resulting hash',
            searching: 'Searching with {threads} thread(s)…\nHashes checked: {hashes}\nLatest nonce: {nonce}\nLatest hash: {hash}',
            mined: 'Success! Found a valid hash in {time}.\nHashes checked: {hashes}', stopped: 'Mining stopped. The performance history has been kept.',
            miningError: 'Mining could not continue. Please try fewer threads or another browser.', invalidData: 'Block data must not exceed 2000 characters.', fixFirst: 'Repair or reset the invalid chain before adding a new block.',
            performanceTitle: 'Live performance', clearChart: 'Clear history', performanceHint: 'Compare the last five runs with different thread counts. The chart shows measured hashes per second, not simulated speed. Device load and browser scheduling affect results.',
            chartDescription: 'Measured hashes per second over elapsed time; exact run summaries are in the table below.', chartEmpty: 'Start mining to see your first performance curve.',
            run: 'Run', threadCount: 'Threads', difficultyShort: 'Zeros', average: 'Average H/s', peak: 'Peak H/s', result: 'Result', running: 'Running', complete: 'Mined', cancelled: 'Stopped', failed: 'Error',
            runLabel: '#{id} · {threads} thread(s)', chartXAxis: 'Elapsed (s)', chartYAxis: 'Hashes / s',
            chainTitle: 'Blockchain tampering lab', demoChain: 'Create 3 demo blocks', repairChain: 'Repair invalid chain', stopRepair: 'Stop', resetChain: 'Reset chain',
            chainHint: 'Create demo blocks or mine your own, then edit an earlier block. Its hash changes, breaking the next block’s stored link. Repairing re-mines the affected blocks in order.',
            chainCaveat: 'Demo blocks use 2 leading zeros for quick experiments. This local chain has no network consensus; real Bitcoin also requires competing with the network’s accumulated work.',
            chainEmpty: 'No blocks yet. Create a demo chain to try editing immediately.', chainValid: 'All {count} blocks are valid and linked. Try changing the first block’s data.',
            chainInvalid: '{count} block(s) invalid. Repair must start at block #{first} and continue through its descendants.', checking: 'Recalculating hashes and validating links…',
            building: 'Mining demo block {current} / 3…', repairing: 'Re-mining block {current} / {total}…', operationStopped: 'Stopped. Completed blocks have been kept.',
            block: 'Block #{number}', valid: 'Valid', invalid: 'Invalid', checkingShort: 'Checking…', editData: 'Editable block data', previousHash: 'Stored previous hash', currentHash: 'Current hash',
            blockDataLabel: 'Block #{number} data', proofOk: 'Proof-of-Work meets the target.', proofBad: 'The changed hash no longer meets the target.', linkBad: 'The stored previous hash does not match the preceding block’s current hash.', ancestorBad: 'An earlier block is invalid, so this block is not on a valid chain.',
            demoData1: 'Alice → Bob: 1 BTC', demoData2: 'Bob → Carol: 0.5 BTC', demoData3: 'Carol → Deniz: 0.2 BTC',
            raceTitle: 'Miner race', simulation: 'Probability simulation', raceHint: 'Set three miners’ relative hash power and run 30 rounds. A miner with twice the power has twice the chance per round, but can still lose.',
            startRace: 'Start 30-round race', stopRace: 'Stop race', resetRace: 'Reset results', miner: 'Miner {name}', power: 'Relative hash power', powerLabel: 'Miner {name}: relative hash power',
            chance: 'Expected chance: {chance}%', wins: '{wins} wins · observed {share}%', raceIdle: 'Ready. Adjust the powers and start a race.',
            raceRound: 'Round {round} / 30 · {completed} completed', raceWinner: 'Round {round}: Miner {name} won!', raceDone: '30 rounds complete. Compare expected probabilities with observed win shares.', raceStopped: 'Race stopped after {completed} completed rounds.', racePowerChanged: 'Power changed; results reset for a fair comparison.',
            raceCaveat: 'This is a mathematical model, not a hardware benchmark. Each miner gets an independent random waiting time; the first wins. Bars show observed win shares, not progress toward finding a hash. Small samples can differ from expected probabilities.',
            learnTitle: 'Learn the concepts', shaTitle: 'What is SHA-256?',
            shaText: 'SHA-256 turns input data into a 256-bit fingerprint, usually written as 64 hexadecimal characters. Even a small change to the input produces a very different hash.',
            shaText2: 'It is easy to calculate a hash, but computationally infeasible to reverse it to recover an input. Mining repeatedly changes a number called a nonce and tests the resulting hash.',
            powTitle: 'How Proof-of-Work works', powText: 'A miner hashes a block header with different nonces until the hash is below a target. Here, the simplified rule requires a chosen number of leading hexadecimal zeros. Each extra zero makes success 16 times less likely per attempt.',
            powText2: 'Finding a block is probabilistic. More hash power means more attempts, not a guaranteed win. Past failed attempts do not make the next hash more likely to succeed.',
            linksTitle: 'Why changing a block breaks the chain', linksText: 'Each block commits to its data and the previous block’s hash. Editing data changes its hash. The next block still contains the old hash, so its link no longer matches, and the chain from that point is invalid.',
            linksText2: 'Repair updates each affected previous-hash reference and finds a new nonce that satisfies that block’s target. This must happen in order: repairing a parent changes the hash its child must reference.',
            realityTitle: 'Simulation vs. Bitcoin', realityText: 'This playground hashes a JSON representation of the previous hash and data, followed by a nonce, using a single SHA-256. Bitcoin instead uses a fixed 80-byte block header, double SHA-256, a Merkle root and a numeric target.',
            realityText2: 'Real Bitcoin mining uses specialized ASIC hardware and network consensus. The protocol adjusts difficulty every 2016 blocks to aim for an average interval of about 10 minutes. This demo does not earn coins or reproduce historical mining speeds.',
            seconds: '{value} s', minutes: '{value} min', hours: '{value} h', days: '{value} d'
        },
        tr: {
            title: 'Bitcoin Madencilik Simülatörü', subtitle: 'İş İspatı (Proof-of-Work) için etkileşimli deney alanı.',
            createdBy: 'Geliştiren:', language: 'Dil', theme: 'Açık / koyu temayı değiştir', github: 'Kaynak kodunu GitHub’da görüntüle (yeni sekme)', navigation: 'Deneyler',
            navMining: 'Madencilik', navPerformance: 'Performans', navChain: 'Blok zinciri deneyi', navRace: 'Madenci yarışı',
            intro: 'Güvenle deney yap: bu bir eğitim simülasyonudur, gerçek Bitcoin madenciliği değildir. Hash hesaplamaları tarayıcında, yerel olarak yapılır.',
            cryptoError: 'Web Crypto veya Web Workers kullanılamıyor. Siteyi güncel bir tarayıcıda HTTPS ya da localhost üzerinden aç.',
            controls: 'Madencilik kontrolleri', threads: 'İş parçacığı sayısı (Web Workers)', blockData: 'Blok verisi (en fazla 2000 karakter)', difficulty: 'Zorluk (baştaki onaltılık sıfır sayısı)',
            difficulty2: '2 · Hızlı demo', difficulty4: '4 · Kolay', difficulty5: '5 · Orta', difficulty6: '6 · Zor', difficulty7: '7 · Çok zor',
            blockDataHint: 'Örnek blok başlığını ve işlem verisini düzenleyebilirsin. Merkle root örnektir; simülatör zincirin önceki hash bağlantısını otomatik ekler.',
            startMining: 'Madenciliği başlat', stopMining: 'Madenciliği durdur', miningHint: 'Her yeni blok, önceki bloğun hash’ini içerir. Yüksek zorluk uzun sürebilir; önce hızlı demoyu dene.',
            liveMining: 'Canlı madencilik', initial: 'Geçerli bir hash aramak için “Madenciliği başlat”a bas.', timeSpent: 'Geçen süre', hashRate: 'Hash / saniye', eta: 'Beklenen bekleme',
            etaHint: 'Beklenen süre bir geri sayım değildir. Her hash bağımsız yeni bir denemedir; başarısız denemeler kalan bekleme beklentisini azaltmaz.',
            successTitle: 'Blok başarıyla kazıldı!', nonce: 'Nonce', resultHash: 'Bulunan hash',
            searching: '{threads} iş parçacığıyla aranıyor…\nDenenen hash: {hashes}\nSon nonce: {nonce}\nSon hash: {hash}',
            mined: 'Başarılı! {time} içinde geçerli hash bulundu.\nDenenen hash: {hashes}', stopped: 'Madencilik durduruldu. Performans geçmişi korundu.',
            miningError: 'Madencilik sürdürülemedi. Daha az iş parçacığı veya farklı bir tarayıcı dene.', invalidData: 'Blok verisi 2000 karakteri aşamaz.', fixFirst: 'Yeni blok eklemeden önce geçersiz zinciri onar veya sıfırla.',
            performanceTitle: 'Canlı performans', clearChart: 'Geçmişi temizle', performanceHint: 'Farklı iş parçacığı sayılarıyla son beş çalışmayı karşılaştır. Grafik, simüle edilmiş hızı değil, ölçülen saniyelik hash sayısını gösterir. Cihaz yükü ve tarayıcının iş planlaması sonuçları etkiler.',
            chartDescription: 'Geçen süreye göre ölçülen saniyelik hash sayısı; çalışma özetleri aşağıdaki tabloda bulunur.', chartEmpty: 'İlk performans eğrini görmek için madenciliği başlat.',
            run: 'Çalışma', threadCount: 'İş parçacığı', difficultyShort: 'Sıfır', average: 'Ortalama H/sn', peak: 'En yüksek H/sn', result: 'Sonuç', running: 'Çalışıyor', complete: 'Kazıldı', cancelled: 'Durduruldu', failed: 'Hata',
            runLabel: '#{id} · {threads} iş parçacığı', chartXAxis: 'Geçen süre (sn)', chartYAxis: 'Hash / sn',
            chainTitle: 'Blok değiştirme deneyi', demoChain: '3 demo blok oluştur', repairChain: 'Geçersiz zinciri onar', stopRepair: 'Durdur', resetChain: 'Zinciri sıfırla',
            chainHint: 'Demo bloklar oluştur veya kendi bloklarını kaz; ardından önceki bir bloğu düzenle. Hash’i değişir ve sonraki bloğun sakladığı bağlantı bozulur. Onarım, etkilenen blokları sırayla yeniden kazar.',
            chainCaveat: 'Hızlı deneyler için demo blokları 2 sıfır zorluğu kullanır. Bu yerel zincirde ağ uzlaşısı yoktur; gerçek Bitcoin’de ağın birikmiş işine karşı da yarışmak gerekir.',
            chainEmpty: 'Henüz blok yok. Düzenlemeyi hemen denemek için demo zincir oluştur.', chainValid: '{count} bloğun tamamı geçerli ve birbirine bağlı. İlk bloğun verisini değiştirmeyi dene.',
            chainInvalid: '{count} blok geçersiz. Onarım #{first} numaralı bloktan başlayıp sonraki bloklarla devam etmeli.', checking: 'Hash’ler yeniden hesaplanıyor, bağlantılar doğrulanıyor…',
            building: 'Demo blok kazılıyor: {current} / 3…', repairing: 'Blok yeniden kazılıyor: {current} / {total}…', operationStopped: 'Durduruldu. Tamamlanan bloklar korundu.',
            block: 'Blok #{number}', valid: 'Geçerli', invalid: 'Geçersiz', checkingShort: 'Kontrol ediliyor…', editData: 'Düzenlenebilir blok verisi', previousHash: 'Saklanan önceki hash', currentHash: 'Güncel hash',
            blockDataLabel: '#{number} numaralı bloğun verisi', proofOk: 'İş İspatı zorluk hedefini karşılıyor.', proofBad: 'Değişen hash artık zorluk hedefini karşılamıyor.', linkBad: 'Saklanan önceki hash, bir önceki bloğun güncel hash’i ile eşleşmiyor.', ancestorBad: 'Önceki bir blok geçersiz; bu blok da geçerli bir zincirin parçası değil.',
            demoData1: 'Alice → Bob: 1 BTC', demoData2: 'Bob → Carol: 0.5 BTC', demoData3: 'Carol → Deniz: 0.2 BTC',
            raceTitle: 'Madenci yarışı', simulation: 'Olasılık simülasyonu', raceHint: 'Üç madencinin göreli hash gücünü ayarla ve 30 tur yarıştır. İki kat güçlü madencinin tur başına kazanma şansı iki kattır; yine de kaybedebilir.',
            startRace: '30 turluk yarışı başlat', stopRace: 'Yarışı durdur', resetRace: 'Sonuçları sıfırla', miner: 'Madenci {name}', power: 'Göreli hash gücü', powerLabel: 'Madenci {name}: göreli hash gücü',
            chance: 'Beklenen şans: %{chance}', wins: '{wins} galibiyet · gözlenen %{share}', raceIdle: 'Hazır. Güçleri ayarla ve yarışı başlat.',
            raceRound: 'Tur {round} / 30 · {completed} tur tamamlandı', raceWinner: '{round}. tur: Madenci {name} kazandı!', raceDone: '30 tur tamamlandı. Beklenen olasılıklarla gözlenen galibiyet oranlarını karşılaştır.', raceStopped: '{completed} tamamlanan turun ardından yarış durduruldu.', racePowerChanged: 'Güç değişti; adil karşılaştırma için sonuçlar sıfırlandı.',
            raceCaveat: 'Bu bir matematiksel modeldir, donanım hız testi değildir. Her madenci için bağımsız rastgele bekleme süresi seçilir; ilk bitiren kazanır. Çubuklar hash bulma ilerlemesini değil, gözlenen galibiyet oranlarını gösterir. Az sayıda turda sonuçlar beklenen olasılıklardan sapabilir.',
            learnTitle: 'Kavramları öğren', shaTitle: 'SHA-256 nedir?',
            shaText: 'SHA-256, girilen veriyi genellikle 64 onaltılık karakterle gösterilen 256 bitlik bir parmak izine dönüştürür. Girdideki küçücük bir değişiklik bile çok farklı bir hash üretir.',
            shaText2: 'Hash hesaplamak kolaydır; ancak onu tersine çevirip bir girdi elde etmek hesaplama açısından uygulanabilir değildir. Madencilikte nonce adlı sayı değiştirilerek ortaya çıkan hash tekrar tekrar denenir.',
            powTitle: 'İş İspatı nasıl çalışır?', powText: 'Madenci, hash hedefin altına düşene kadar blok başlığını farklı nonce değerleriyle hash’ler. Buradaki basitleştirilmiş kural, başta belirli sayıda onaltılık sıfır olmasını ister. Her ek sıfır, deneme başına başarı olasılığını 16 kat azaltır.',
            powText2: 'Blok bulmak olasılıksaldır. Daha fazla hash gücü, daha fazla deneme demektir; kesin galibiyet değil. Önceki başarısız denemeler bir sonraki hash’in başarı olasılığını artırmaz.',
            linksTitle: 'Bir bloğu değiştirmek zinciri neden bozar?', linksText: 'Her blok kendi verisine ve önceki bloğun hash’ine bağlıdır. Veriyi düzenlemek hash’i değiştirir. Sonraki blok eski hash’i sakladığı için bağlantısı eşleşmez ve o noktadan sonraki zincir geçersiz olur.',
            linksText2: 'Onarım, etkilenen her bloğun önceki hash referansını günceller ve zorluk hedefini karşılayan yeni bir nonce bulur. Bu sırayla yapılmalıdır: üst bloğun onarılması, alt bloğun referans vermesi gereken hash’i değiştirir.',
            realityTitle: 'Simülasyon ile Bitcoin arasındaki fark', realityText: 'Bu deneyde önceki hash ve verinin JSON gösterimine nonce eklenir, ardından tek SHA-256 uygulanır. Bitcoin ise sabit 80 baytlık blok başlığı, çift SHA-256, Merkle kökü ve sayısal hedef kullanır.',
            realityText2: 'Gerçek Bitcoin madenciliği özel ASIC donanımları ve ağ uzlaşısı kullanır. Protokol, ortalama blok aralığını yaklaşık 10 dakikada tutmak için her 2016 blokta zorluğu ayarlar. Bu demo coin kazandırmaz ve tarihsel madencilik hızlarını yeniden üretmez.',
            seconds: '{value} sn', minutes: '{value} dk', hours: '{value} sa', days: '{value} gün'
        }
    };
    const storage = {
        get(key) { try { return localStorage.getItem(key); } catch { return null; } },
        set(key, value) { try { localStorage.setItem(key, value); } catch { /* Private browsing can disable storage. */ } }
    };
    let language = storage.get('bitcoin-miner-language') || (navigator.language.startsWith('tr') ? 'tr' : 'en');
    if (!messages[language]) language = 'en';
    const t = (key, values = {}) => (messages[language][key] || messages.en[key] || key)
        .replace(/\{(\w+)\}/g, (_, name) => values[name] ?? `{${name}}`);
    const number = (value, digits = 0) => new Intl.NumberFormat(language === 'tr' ? 'tr-TR' : 'en-US', { maximumFractionDigits: digits }).format(value);
    const formatTime = seconds => {
        if (!Number.isFinite(seconds)) return '…';
        const [key, divisor] = seconds < 60 ? ['seconds', 1] : seconds < 3600 ? ['minutes', 60] : seconds < 86400 ? ['hours', 3600] : ['days', 86400];
        return t(key, { value: number(seconds / divisor, 1) });
    };
    const apply = () => {
        document.documentElement.lang = language;
        document.title = t('title');
        document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = t(element.dataset.i18n); });
        document.querySelectorAll('[data-i18n-aria]').forEach(element => { element.setAttribute('aria-label', t(element.dataset.i18nAria)); });
        document.getElementById('language').value = language;
    };
    window.I18n = { t, number, formatTime, storage, get language() { return language; } };
    apply();
    document.getElementById('language').addEventListener('change', event => {
        language = messages[event.target.value] ? event.target.value : 'en';
        storage.set('bitcoin-miner-language', language);
        apply();
        document.dispatchEvent(new Event('languagechange'));
    });
})();
