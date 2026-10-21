/* ============================================================
   لنتعلم قواعد النحو والصرف — المنطق الرئيسي (v3.0)
   نظام المسارين (نحو / صرف) + مراجعة الأخطاء + الدروع
   ============================================================ */

// ==================== الإعدادات العامة ====================
const CONFIG = {
    MAX_HEARTS: 20,
    HEART_REGEN_MS: 10 * 60 * 1000,
    HEART_REGEN_AMOUNT: 3,
    QUESTION_TIME: 30,
    POINTS_PER_CORRECT: 10,
    STREAK_FOR_BONUS_HEART: 5,
    STORAGE_KEY: 'let_learn_nahw_sarf_state_v3',
    STATE_VERSION: 3,
    TRACKS: {
        nahw: { totalStages: 10, totalQuestions: 100, name: 'النحو' },
        sarf: { totalStages: 10, totalQuestions: 100, name: 'الصرف' }
    }
};
const RESET_CODE = "فيلادلفيا";

// ==================== الأصوات ====================
const SOUNDS = {
    ahsant:       { file: 'sounds/Ahsant.mp3',         text: 'أحسنت' },
    momtaz:       { file: 'sounds/Momtaz.mp3',         text: 'ممتاز' },
    momtazAbda3t: { file: 'sounds/Momtaz-abda3t.mp3',  text: 'ممتاز أبدعت' },
    rae3Jedd:     { file: 'sounds/Rae3-jeddn.mp3',     text: 'رائع جداً' },
    ejabaSaheha:  { file: 'sounds/Ejaba-saheha.mp3',   text: 'إجابة صحيحة' },
    yaBatal:      { file: 'sounds/Ya-batal.mp3',       text: 'يا بطل' },
    elaAlamam:    { file: 'sounds/Ela-alemam.mp3',     text: 'إلى الأمام' },
    to3gebony:    { file: 'sounds/To3gebony.mp3',      text: 'تعجبني' }
};

function playSound(key) {
    const sound = SOUNDS[key];
    if (!sound) return;
    try {
        const audio = new Audio(sound.file);
        audio.volume = 0.9;
        const p = audio.play();
        if (p && p.catch) p.catch(() => speakText(sound.text));
    } catch (e) { speakText(sound.text); }
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'ar-SA'; u.rate = 1.05; u.pitch = 1.1;
        window.speechSynthesis.speak(u);
    }
}

function pickPraiseSound() {
    const s = gameState.streak;
    if (s >= 10) return 'momtazAbda3t';
    if (s >= 7)  return 'rae3Jedd';
    if (s >= 5)  return 'yaBatal';
    if (s >= 3)  return 'momtaz';
    const light = ['ahsant', 'ejabaSaheha', 'to3gebony', 'elaAlamam'];
    return light[Math.floor(Math.random() * light.length)];
}

let audioCtx = null;
function playErrorSound() {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.setValueAtTime(110, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) { }
}

// ==================== نظام الدروع (مُعدل للمسارين) ====================
const BADGES = [
    { id: 1, title: "درع البداية المضيئة", rank: "مبتدئ واعد", color: "from-amber-700 to-amber-900", icon: "fa-seedling", range: [1, 4], message: "خطوتك الأولى هي أساس كل نجاح عظيم! لقد أضاءت بدايتك عتمة التردد، فاستمر بهذا العزم المنير." },
    { id: 2, title: "درع سفير الحروف", rank: "سفير اللسان", color: "from-orange-600 to-amber-800", icon: "fa-feather", range: [5, 8], message: "لقد عبرت البدايات وأثبتَّ جدارتك؛ كلماتك تتصاعد بثبات، ومعرفتك تتسع يوماً بعد يوم. إلى الأمام!" },
    { id: 3, title: "درع بطل المعرفة", rank: "فارس المعرفة المتمكن", color: "from-slate-400 to-slate-600", icon: "fa-shield-halved", range: [9, 12], message: "تجاوزت منتصف الطريق باقتدار! عزيمتك الصلبة تصنع منك بطلًا حقيقيًا لا يعرف اليأس ولا الاستسلام." },
    { id: 4, title: "درع الحكيم اللغوي", rank: "حارس القواعد", color: "from-yellow-500 to-amber-700", icon: "fa-crown", range: [13, 16], message: "عقلك الراجح وفكرك الثاقب يؤكدان أنك قُمت ببناء قاعدة صلبة من المهارات. لم يبقَ إلا القليل لتصل للقمة!" },
    { id: 5, title: "درع فارس الميدان", rank: "عميد الفرسان", color: "from-yellow-400 to-yellow-600", icon: "fa-medal", range: [17, 19], message: "أنت على أعتاب القمة الكبرى! شجاعتك في اجتياز هذه المراحل المعقدة تؤهلك لتكون الأبرز بين زملائك." },
    { id: 6, title: "درع الأسطورة", rank: "بطل الأبطال الأوحد", color: "from-cyan-400 to-blue-600", icon: "fa-gem", range: [20, 20], message: "المجد لمن صبر واجتهد! لقد أتممت الـ 200 سؤال وتجاوزت التحدي الأكبر بجدارة واستحقاق مطلق. أنت الآن أسطورة!" }
];

// ==================== الحالة (State) ====================
let gameState = {
    studentName: "",
    nameLocked: false,
    uuid: "",
    hearts: CONFIG.MAX_HEARTS,
    score: 0,
    streak: 0,
    currentTrack: null,
    currentStageId: null,
    currentLevel: 1,
    tracks: {
        nahw: { unlockedStages: [1], completedStages: [], stageProgress: {} },
        sarf: { unlockedStages: [1], completedStages: [], stageProgress: {} }
    },
    lastHeartRegenTime: Date.now(),
    version: CONFIG.STATE_VERSION
};

// قواعد البيانات (يتم ملؤها من ملفات الأسئلة)
window.stagesDatabase = { nahw: [], sarf: [] };

// دالة التسجيل للمراحل
window.registerNahwStage = function(stageData) { window.stagesDatabase.nahw.push(stageData); };
window.registerSarfStage = function(stageData) { window.stagesDatabase.sarf.push(stageData); };

// ==================== تحميل وحفظ الحالة ====================
function loadSavedState() {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            gameState = { ...gameState, ...parsed };
            if (!gameState.tracks) {
                gameState.tracks = { nahw: { unlockedStages: [1], completedStages: [], stageProgress: {} }, sarf: { unlockedStages: [1], completedStages: [], stageProgress: {} } };
            }
        } catch (e) { console.error("خطأ في تحميل الحالة", e); }
    }
}

function saveState() {
    gameState.version = CONFIG.STATE_VERSION;
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(gameState));
}

// ==================== دوال مساعدة للتقدم والدروع ====================
function getTrackProgress(track) {
    let completedLevels = 0;
    let completedStages = gameState.tracks[track].completedStages.length;
    for (const stageId in gameState.tracks[track].stageProgress) {
        const p = gameState.tracks[track].stageProgress[stageId];
        if (p && p.completedLevels) completedLevels += p.completedLevels.length;
    }
    const totalLevels = CONFIG.TRACKS[track].totalStages * 2; // مستويان لكل مرحلة
    const totalQuestions = CONFIG.TRACKS[track].totalQuestions;
    const doneQuestions = completedLevels * 5; // كل مستوى 5 أسئلة
    return { completedLevels, totalLevels, doneQuestions, totalQuestions, completedStages };
}

function getTotalCompletedStages() {
    return gameState.tracks.nahw.completedStages.length + gameState.tracks.sarf.completedStages.length;
}

function getCurrentBadge() {
    const totalStages = getTotalCompletedStages();
    if (totalStages === 0) return null;
    for (let i = BADGES.length - 1; i >= 0; i--) {
        if (totalStages >= BADGES[i].range[0]) return BADGES[i];
    }
    return null;
}

function generateUUID() {
    const p1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const p2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `NM-${new Date().getFullYear()}-${p1}-${p2}`;
}

// ==================== القلوب ====================
function regenHearts() {
    if (gameState.hearts >= CONFIG.MAX_HEARTS) {
        gameState.lastHeartRegenTime = Date.now(); return;
    }
    const elapsed = Date.now() - gameState.lastHeartRegenTime;
    if (elapsed >= CONFIG.HEART_REGEN_MS) {
        const cycles = Math.floor(elapsed / CONFIG.HEART_REGEN_MS);
        gameState.hearts = Math.min(CONFIG.MAX_HEARTS, gameState.hearts + cycles * CONFIG.HEART_REGEN_AMOUNT);
        gameState.lastHeartRegenTime += cycles * CONFIG.HEART_REGEN_MS;
        if (gameState.hearts >= CONFIG.MAX_HEARTS) gameState.lastHeartRegenTime = Date.now();
        saveState();
    }
}

function loseHeart() {
    const wasFull = gameState.hearts >= CONFIG.MAX_HEARTS;
    gameState.hearts = Math.max(0, gameState.hearts - 1);
    if (wasFull) gameState.lastHeartRegenTime = Date.now();
    updateGlobalHeader(); saveState();
}

function gainHeart() {
    gameState.hearts = Math.min(CONFIG.MAX_HEARTS, gameState.hearts + 1);
    if (gameState.hearts >= CONFIG.MAX_HEARTS) gameState.lastHeartRegenTime = Date.now();
}

let heartTimerInterval = null;
function stopHeartTimer() { if (heartTimerInterval) { clearInterval(heartTimerInterval); heartTimerInterval = null; } }
function startHeartTimerCountdown() {
    stopHeartTimer();
    const el = document.getElementById('heart-timer-display');
    const tick = () => {
        if (gameState.hearts >= CONFIG.MAX_HEARTS) { stopHeartTimer(); el.textContent = "ممتلئة ❤️"; return; }
        const elapsed = Date.now() - gameState.lastHeartRegenTime;
        const remaining = Math.max(0, CONFIG.HEART_REGEN_MS - (elapsed % CONFIG.HEART_REGEN_MS));
        const m = Math.floor(remaining / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        regenHearts();
        if (gameState.hearts > 0) { stopHeartTimer(); goToDashboard(); showToast("❤️ تمت استعادة القلوب بنجاح!"); }
    };
    tick(); heartTimerInterval = setInterval(tick, 1000);
}

// ==================== الشاشات الأساسية ====================
const welcomeScreen = document.getElementById('welcome-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const stagesScreen = document.getElementById('stages-screen');
const trainingScreen = document.getElementById('training-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const outOfHeartsScreen = document.getElementById('out-of-hearts-screen');
const globalStatus = document.getElementById('global-status');
const stageRuleModal = document.getElementById('stage-rule-modal');

function hideAllScreens() {
    [welcomeScreen, dashboardScreen, stagesScreen, trainingScreen, quizScreen, resultScreen, outOfHeartsScreen, stageRuleModal,
     document.getElementById('rules-modal'), document.getElementById('reset-modal')]
        .forEach(el => el && el.classList.add('hidden'));
}

function formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n;
}

function updateGlobalHeader() {
    document.getElementById('header-hearts').textContent = formatNumber(gameState.hearts);
    document.getElementById('header-score').textContent = formatNumber(gameState.score);
    if (gameState.studentName) document.getElementById('header-student-name').textContent = gameState.studentName;
}

// ==================== التنقل ====================
function startJourney() {
    const input = document.getElementById('student-name-input');
    if (gameState.nameLocked) { goToDashboard(); return; }
    const name = input.value.trim();
    if (!name) { showToast("الرجاء إدخال اسمك الكريم للبدء!"); return; }
    gameState.studentName = name; saveState(); goToDashboard();
}

function goToDashboard() {
    regenHearts(); hideAllScreens(); updateGlobalHeader();
    document.getElementById('nav-buttons').classList.remove('hidden');
    if (gameState.hearts <= 0) {
        outOfHeartsScreen.classList.remove('hidden'); globalStatus.classList.add('hidden');
        startHeartTimerCountdown(); return;
    }
    stopHeartTimer(); globalStatus.classList.remove('hidden'); dashboardScreen.classList.remove('hidden');
    document.getElementById('welcome-banner-title').textContent = `أهلاً بك يا ${gameState.studentName || 'طالب العلم'}`;
    renderProgressBar();
}

function goToWelcome() {
    if (typeof questionTimerInterval !== 'undefined' && questionTimerInterval) clearInterval(questionTimerInterval);
    stopHeartTimer(); hideAllScreens(); globalStatus.classList.add('hidden');
    document.getElementById('nav-buttons').classList.add('hidden'); welcomeScreen.classList.remove('hidden');
    const input = document.getElementById('student-name-input');
    const lockIcon = document.getElementById('name-lock-icon');
    if (gameState.studentName) input.value = gameState.studentName;
    if (gameState.nameLocked) {
        input.disabled = true; input.classList.add('opacity-60', 'cursor-not-allowed');
        if (lockIcon) lockIcon.classList.remove('hidden');
    } else {
        input.disabled = false; input.classList.remove('opacity-60', 'cursor-not-allowed');
        if (lockIcon) lockIcon.classList.add('hidden');
    }
}

function openTrack(track) {
    gameState.currentTrack = track;
    hideAllScreens(); globalStatus.classList.remove('hidden');
    document.getElementById('nav-buttons').classList.remove('hidden');
    stagesScreen.classList.remove('hidden');
    
    const isNahw = track === 'nahw';
    document.getElementById('stages-track-title').textContent = isNahw ? 'خريطة النحو' : 'خريطة الصرف';
    document.getElementById('stages-track-desc').textContent = isNahw ? 'عشر مراحل في قواعد النحو' : 'عشر مراحل في علم الصرف';
    document.getElementById('stages-track-label').textContent = isNahw ? 'المراحل النحوية' : 'المراحل الصرفية';
    
    const iconDiv = document.getElementById('stages-track-icon');
    iconDiv.className = isNahw ? 'p-3 bg-emerald-500/20 rounded-xl text-emerald-300 border border-emerald-500/30' : 'p-3 bg-cyan-500/20 rounded-xl text-cyan-300 border border-cyan-500/30';
    iconDiv.innerHTML = isNahw ? '<i class="fa-solid fa-book-open text-2xl"></i>' : '<i class="fa-solid fa-language text-2xl"></i>';
    
    renderStagesGrid();
}

function goToCurrentTrackMap() {
    if (gameState.currentTrack) openTrack(gameState.currentTrack);
    else goToDashboard();
}

// ==================== شريط التقدم ====================
function renderProgressBar() {
    const nahw = getTrackProgress('nahw');
    const sarf = getTrackProgress('sarf');
    const totalDone = nahw.doneQuestions + sarf.doneQuestions;
    const totalQ = CONFIG.TRACKS.nahw.totalQuestions + CONFIG.TRACKS.sarf.totalQuestions;
    const percent = Math.round((totalDone / totalQ) * 100);
    
    document.getElementById('progress-total-questions').textContent = `${totalDone} / ${totalQ}`;
    document.getElementById('progress-nahw').textContent = `${nahw.doneQuestions}/100`;
    document.getElementById('progress-sarf').textContent = `${sarf.doneQuestions}/100`;
    document.getElementById('progress-percent').textContent = `${percent}%`;
    document.getElementById('progress-fill').style.width = `${percent}%`;
    
    const currentBadge = getCurrentBadge();
    const badgeEl = document.getElementById('progress-badge');
    const rankEl = document.getElementById('progress-rank');
    
    if (currentBadge) {
        badgeEl.className = `w-10 h-10 rounded-xl bg-gradient-to-br ${currentBadge.color} flex items-center justify-center text-white shadow-lg`;
        badgeEl.innerHTML = `<i class="fa-solid ${currentBadge.icon}"></i>`;
        rankEl.textContent = currentBadge.rank;
    } else {
        badgeEl.className = `w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 shadow`;
        badgeEl.innerHTML = `<i class="fa-solid fa-lock"></i>`;
        rankEl.textContent = "لم تبدأ رحلتك بعد";
    }
}

// ==================== عرض المراحل ====================
function renderStagesGrid() {
    const grid = document.getElementById('stages-grid');
    grid.innerHTML = '';
    const track = gameState.currentTrack;
    const stages = [...window.stagesDatabase[track]].sort((a, b) => a.id - b.id);
    document.getElementById('stages-count-badge').textContent = `${stages.length} مراحل`;

    stages.forEach((stage, idx) => {
        const trackData = gameState.tracks[track];
        const isUnlocked = trackData.unlockedStages.includes(stage.id) || idx === 0;
        const isCompleted = trackData.completedStages.includes(stage.id);
        const progress = trackData.stageProgress[stage.id] || { completedLevels: [] };
        const totalLevels = stage.levels ? stage.levels.length : 2;
        const completedLevels = progress.completedLevels.length;

        const card = document.createElement('div');
        card.className = `bg-slate-900/80 backdrop-blur-md rounded-3xl p-6 border ${isUnlocked ? 'border-emerald-500/30 shadow-xl' : 'border-slate-800 opacity-60'} transition flex flex-col justify-between group relative overflow-hidden`;
        card.innerHTML = `
            <div class="absolute -top-12 -left-12 w-28 h-28 bg-gradient-to-br ${stage.color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition"></div>
            <div class="space-y-4 relative z-10">
                <div class="flex justify-between items-start">
                    <div class="w-12 h-12 rounded-2xl bg-gradient-to-br ${stage.color} flex items-center justify-center text-white shadow-lg">
                        <i class="fa-solid ${stage.icon} text-xl"></i>
                    </div>
                    <span class="px-2.5 py-1 rounded-full text-xs font-bold ${isCompleted ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : (isUnlocked ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-800 text-slate-500')}">
                        ${isCompleted ? '<i class="fa-solid fa-check text-emerald-400"></i> مكتملة' : (isUnlocked ? `${completedLevels} / ${totalLevels}` : '<i class="fa-solid fa-lock"></i> مقفلة')}
                    </span>
                </div>
                <div class="space-y-1">
                    <h4 class="text-lg font-bold text-white group-hover:text-emerald-300 transition">${stage.title}</h4>
                    <p class="text-xs text-slate-400 leading-relaxed line-clamp-2">${stage.description}</p>
                </div>
            </div>
            <div class="pt-4 mt-4 border-t border-slate-800/80 flex items-center gap-2 relative z-10">
                <button onclick="openStageRuleModal(${stage.id})" class="flex-1 py-2 bg-teal-950/60 hover:bg-teal-900/80 text-teal-300 font-semibold rounded-xl border border-teal-500/30 transition text-xs flex items-center justify-center gap-1.5">
                    <i class="fa-solid fa-book-open"></i> دليل القاعدة
                </button>
                <button ${isUnlocked ? `onclick="startStageQuiz(${stage.id})"` : 'disabled'} class="flex-1 py-2 ${isUnlocked ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md' : 'bg-slate-800 text-slate-500 cursor-not-allowed'} font-bold rounded-xl transition text-xs flex items-center justify-center gap-1.5">
                    <span>${isCompleted ? 'إعادة' : 'ابدأ'}</span> <i class="fa-solid fa-arrow-left"></i>
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function openStageRuleModal(stageId) {
    const track = gameState.currentTrack;
    const stage = window.stagesDatabase[track].find(s => s.id === stageId);
    if (!stage) return;
    const idx = window.stagesDatabase[track].findIndex(s => s.id === stageId);
    const isUnlocked = gameState.tracks[track].unlockedStages.includes(stageId) || idx === 0;

    document.getElementById('modal-rule-title').textContent = `دليل قسم: ${stage.title}`;
    document.getElementById('modal-rule-content').textContent = stage.ruleSummary;
    const iconContainer = document.getElementById('modal-rule-icon');
    iconContainer.className = `w-12 h-12 rounded-2xl bg-gradient-to-br ${stage.color} flex items-center justify-center text-white shadow-lg`;
    iconContainer.innerHTML = `<i class="fa-solid ${stage.icon} text-xl"></i>`;

    const startBtn = document.getElementById('modal-start-quiz-btn');
    if (isUnlocked) {
        startBtn.disabled = false;
        startBtn.className = "flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg transition text-sm flex items-center justify-center gap-2";
        startBtn.innerHTML = '<i class="fa-solid fa-play"></i> بدء التحدي';
        startBtn.onclick = () => { closeStageRuleModal(); startStageQuiz(stageId); };
    } else {
        startBtn.disabled = true;
        startBtn.className = "flex-1 py-3 bg-slate-800 text-slate-500 cursor-not-allowed font-bold rounded-xl border border-slate-700 transition text-sm flex items-center justify-center gap-2";
        startBtn.innerHTML = '<i class="fa-solid fa-lock"></i> المرحلة مقفلة';
        startBtn.onclick = null;
    }
    stageRuleModal.classList.remove('hidden');
}

function closeStageRuleModal() { stageRuleModal.classList.add('hidden'); }

function openTrainingArena() {
    hideAllScreens(); globalStatus.classList.remove('hidden');
    document.getElementById('nav-buttons').classList.remove('hidden');
    trainingScreen.classList.remove('hidden');
    renderTrainingTopics();
}

function renderTrainingTopics() {
    const container = document.getElementById('training-topics-container');
    container.innerHTML = '';
    ['nahw', 'sarf'].forEach(track => {
        const trackName = CONFIG.TRACKS[track].name;
        const trackTitle = document.createElement('h3');
        trackTitle.className = "text-xl font-bold text-emerald-300 mb-4 border-b border-slate-700 pb-2";
        trackTitle.textContent = `مسار ${trackName}`;
        container.appendChild(trackTitle);

        const grid = document.createElement('div');
        grid.className = "grid grid-cols-1 md:grid-cols-2 gap-4 mb-8";
        
        [...window.stagesDatabase[track]].sort((a, b) => a.id - b.id).forEach(stage => {
            const card = document.createElement('div');
            card.className = "bg-slate-900/80 backdrop-blur-md rounded-3xl p-6 border border-teal-500/20 shadow-xl space-y-4 flex flex-col justify-between";
            card.innerHTML = `
                <div class="space-y-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br ${stage.color} flex items-center justify-center text-white shadow">
                            <i class="fa-solid ${stage.icon}"></i>
                        </div>
                        <h4 class="text-lg font-bold text-teal-200">${stage.title}</h4>
                    </div>
                    <p class="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 font-mono max-h-40 overflow-y-auto">${stage.ruleSummary}</p>
                </div>
            `;
            grid.appendChild(card);
        });
        container.appendChild(grid);
    });
}

// ==================== منطق الاختبار (المحرك الجديد) ====================
let currentStageData = null;
let mainQuestionsPool = [];   // أسئلة المستوى الأساسية
let reviewQuestionsPool = []; // أسئلة المراجعة (الأخطاء)
let currentQuestion = null;
let questionTimerInterval = null;
let questionTimeLeft = CONFIG.QUESTION_TIME;
let isProcessingAnswer = false;
let currentQuestionSource = 'main'; // 'main' أو 'review'

function startStageQuiz(stageId) {
    regenHearts();
    if (gameState.hearts <= 0) { goToDashboard(); return; }

    const track = gameState.currentTrack;
    const stage = window.stagesDatabase[track].find(s => s.id === stageId);
    if (!stage || !stage.levels || stage.levels.length === 0) return;

    const trackData = gameState.tracks[track];
    const progress = trackData.stageProgress[stageId] || { completedLevels: [] };
    
    // إيجاد المستوى الذي لم يكتمل (أو البداية من 1 إذا أعاد اللعب)
    let startLevel = 1;
    for (let i = 1; i <= stage.levels.length; i++) {
        if (!progress.completedLevels.includes(i)) { startLevel = i; break; }
    }
    if (progress.completedLevels.length >= stage.levels.length) startLevel = 1;

    currentStageData = stage;
    gameState.currentStageId = stageId;
    gameState.currentLevel = startLevel;
    reviewQuestionsPool = []; // تفريغ المراجعة عند بداية جديدة
    
    loadLevelQuestions();

    hideAllScreens(); globalStatus.classList.remove('hidden');
    document.getElementById('nav-buttons').classList.remove('hidden');
    quizScreen.classList.remove('hidden');
    updateGlobalHeader();
    loadQuizQuestion();
}

function loadLevelQuestions() {
    const levelData = currentStageData.levels[gameState.currentLevel - 1];
    // نسخ الأسئلة إلى قائمة اللعب الأساسية
    mainQuestionsPool = [...levelData.questions];
}

function loadQuizQuestion() {
    if (questionTimerInterval) clearInterval(questionTimerInterval);
    isProcessingAnswer = false;

    if (mainQuestionsPool.length === 0 && reviewQuestionsPool.length === 0) {
        handleLevelComplete();
        return;
    }

    // تحديد مصدر السؤال
    if (mainQuestionsPool.length > 0) {
        currentQuestionSource = 'main';
        currentQuestion = mainQuestionsPool[Math.floor(Math.random() * mainQuestionsPool.length)];
    } else {
        currentQuestionSource = 'review';
        currentQuestion = reviewQuestionsPool[Math.floor(Math.random() * reviewQuestionsPool.length)];
    }

    const qData = currentQuestion;
    questionTimeLeft = CONFIG.QUESTION_TIME;
    updateQuestionTimerUI();
    startQuestionTimer();

    const totalInLevel = currentStageData.levels[gameState.currentLevel - 1].questions.length;
    
    // تحديث الواجهة
    document.getElementById('quiz-mode-label').textContent = currentQuestionSource === 'review' ? 'مراجعة:' : 'السؤال:';
    document.getElementById('quiz-mode-label').className = currentQuestionSource === 'review' ? 'text-amber-400 font-bold' : 'text-slate-400';
    document.getElementById('current-q-index').textContent = currentQuestionSource === 'review' ? '!' : Math.min(totalInLevel - mainQuestionsPool.length + 1, totalInLevel);
    document.getElementById('total-q-index').textContent = totalInLevel;
    document.getElementById('streak-counter').textContent = gameState.streak;
    document.getElementById('quiz-progress-bar').style.width = `${((totalInLevel - mainQuestionsPool.length) / totalInLevel) * 100}%`;
    
    document.getElementById('quiz-stage-badge').textContent = `${currentStageData.title} — المستوى ${gameState.currentLevel}`;
    document.getElementById('quiz-difficulty-badge').textContent = qData.difficulty || 'عادي';
    document.getElementById('quiz-question-text').textContent = qData.q;
    document.getElementById('quiz-feedback-box').classList.add('hidden');

    const optionsContainer = document.getElementById('quiz-options-container');
    optionsContainer.innerHTML = '';
    const labels = ['أ', 'ب', 'ج', 'د'];

    qData.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = "option-btn w-full text-right p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition font-semibold text-white flex items-center justify-between group shadow-md";
        btn.innerHTML = `
            <span class="text-sm md:text-base">${opt}</span>
            <span class="w-8 h-8 rounded-xl bg-slate-700/80 flex items-center justify-center text-xs text-slate-300 group-hover:bg-emerald-600 group-hover:text-white transition">${labels[i] || i + 1}</span>
        `;
        btn.onclick = () => submitAnswer(i, btn);
        optionsContainer.appendChild(btn);
    });
}

function startQuestionTimer() {
    questionTimerInterval = setInterval(() => {
        questionTimeLeft--; updateQuestionTimerUI();
        if (questionTimeLeft <= 0) { clearInterval(questionTimerInterval); handleTimeOut(); }
    }, 1000);
}

function updateQuestionTimerUI() {
    const txt = document.getElementById('question-timer-text');
    const bar = document.getElementById('question-timer-bar');
    if (!txt || !bar) return;
    txt.textContent = `${questionTimeLeft} ثانية`;
    bar.style.width = `${(questionTimeLeft / CONFIG.QUESTION_TIME) * 100}%`;
    if (questionTimeLeft <= 10) {
        bar.className = "timer-bar bg-gradient-to-r from-rose-500 to-amber-500 h-full";
        txt.className = "font-bold text-rose-400 font-mono";
    } else {
        bar.className = "timer-bar bg-gradient-to-r from-emerald-500 to-teal-500 h-full";
        txt.className = "font-bold text-emerald-400 font-mono";
    }
}

function disableOptions() {
    const buttons = document.getElementById('quiz-options-container').getElementsByTagName('button');
    for (let b of buttons) { b.disabled = true; b.classList.add('opacity-80'); }
    return buttons;
}

function revealCorrect(buttons, answerIdx) {
    buttons[answerIdx].classList.remove('bg-slate-800/80', 'border-slate-700');
    buttons[answerIdx].classList.add('bg-emerald-600/80', 'border-emerald-400');
}

function handleTimeOut() {
    if (!currentQuestion || isProcessingAnswer) return;
    isProcessingAnswer = true;
    const qData = currentQuestion;
    const buttons = disableOptions();
    revealCorrect(buttons, qData.answer);

    playErrorSound();
    gameState.streak = 0;
    loseHeart();

    // نقل السؤال إلى قائمة المراجعة إذا لم يكن موجوداً
    if (currentQuestionSource === 'main') {
        const idx = mainQuestionsPool.indexOf(qData);
        if (idx > -1) mainQuestionsPool.splice(idx, 1);
        if (!reviewQuestionsPool.includes(qData)) reviewQuestionsPool.push(qData);
    }

    const box = document.getElementById('quiz-feedback-box');
    document.getElementById('feedback-header').innerHTML = `<i class="fa-solid fa-clock text-rose-400"></i> <span class="text-rose-300">انتهى الوقت! سيُضاف للمراجعة — خُصم قلب</span>`;
    document.getElementById('feedback-explanation').textContent = `الإجابة الصحيحة: "${qData.options[qData.answer]}".\n${qData.explanation}`;
    document.getElementById('feedback-training-tip').classList.remove('hidden');
    box.className = "p-5 rounded-2xl border bg-rose-950/60 border-rose-500/40 space-y-3 animate-fade-in";
    box.classList.remove('hidden');

    document.getElementById('streak-counter').textContent = gameState.streak;
    updateGlobalHeader(); saveState();

    if (gameState.hearts <= 0) setTimeout(goToDashboard, 1800);
}

function submitAnswer(selectedIndex, selectedButton) {
    if (questionTimerInterval) clearInterval(questionTimerInterval);
    if (!currentQuestion || isProcessingAnswer) return;
    isProcessingAnswer = true;

    const qData = currentQuestion;
    const buttons = disableOptions();
    const box = document.getElementById('quiz-feedback-box');

    if (selectedIndex === qData.answer) {
        selectedButton.classList.remove('bg-slate-800/80', 'border-slate-700');
        selectedButton.classList.add('bg-emerald-600/90', 'border-emerald-400');

        // نقاط ومكافآت
        if (currentQuestionSource === 'main') { // النقاط فقط للإجابة الصحيحة من أول مرة
            gameState.score += CONFIG.POINTS_PER_CORRECT;
            const idx = mainQuestionsPool.indexOf(qData);
            if (idx > -1) mainQuestionsPool.splice(idx, 1);
        } else {
            // إجابة صحيحة في المراجعة (بدون نقاط، فقط إزالة من القائمة)
            const idx = reviewQuestionsPool.indexOf(qData);
            if (idx > -1) reviewQuestionsPool.splice(idx, 1);
        }
        
        gameState.streak++;
        const soundKey = pickPraiseSound();
        playSound(soundKey);

        if (gameState.streak > 0 && gameState.streak % CONFIG.STREAK_FOR_BONUS_HEART === 0) {
            gainHeart(); showToast("🎉 حصلت على قلب إضافي!");
        }

        box.className = "p-5 rounded-2xl border bg-emerald-950/60 border-emerald-500/40 space-y-3 animate-fade-in";
        document.getElementById('feedback-header').innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400"></i> <span class="text-emerald-300">${SOUNDS[soundKey].text}</span>`;
        document.getElementById('feedback-explanation').textContent = qData.explanation;
        document.getElementById('feedback-training-tip').classList.add('hidden');
    } else {
        selectedButton.classList.remove('bg-slate-800/80', 'border-slate-700');
        selectedButton.classList.add('bg-rose-600/90', 'border-rose-400');
        revealCorrect(buttons, qData.answer);

        playErrorSound();
        gameState.streak = 0;
        loseHeart();

        // نقل السؤال إلى قائمة المراجعة
        if (currentQuestionSource === 'main') {
            const idx = mainQuestionsPool.indexOf(qData);
            if (idx > -1) mainQuestionsPool.splice(idx, 1);
            if (!reviewQuestionsPool.includes(qData)) reviewQuestionsPool.push(qData);
        } else {
            // إذا أخطأ في المراجعة، يبقى في قائمة المراجعة
            // (يمكن إضافته للنهاية لإعادة ترتيب عشوائي، لكن تركه كافي)
        }

        box.className = "p-5 rounded-2xl border bg-rose-950/60 border-rose-500/40 space-y-3 animate-fade-in";
        document.getElementById('feedback-header').innerHTML = `<i class="fa-solid fa-circle-xmark text-rose-400"></i> <span class="text-rose-300">إجابة خاطئة — سيُعاد عليك في المراجعة</span>`;
        document.getElementById('feedback-explanation').textContent = `الإجابة الصحيحة: "${qData.options[qData.answer]}".\n${qData.explanation}`;
        document.getElementById('feedback-training-tip').classList.remove('hidden');
    }

    document.getElementById('streak-counter').textContent = gameState.streak;
    box.classList.remove('hidden');
    updateGlobalHeader(); saveState();

    if (gameState.hearts <= 0 && selectedIndex !== qData.answer) {
        setTimeout(goToDashboard, 1800);
    }
}

function nextQuestion() {
    loadQuizQuestion();
}

function handleLevelComplete() {
    // حفظ أن المستوى اكتمل
    const track = gameState.currentTrack;
    const stageId = gameState.currentStageId;
    if (!gameState.tracks[track].stageProgress[stageId]) {
        gameState.tracks[track].stageProgress[stageId] = { completedLevels: [] };
    }
    if (!gameState.tracks[track].stageProgress[stageId].completedLevels.includes(gameState.currentLevel)) {
        gameState.tracks[track].stageProgress[stageId].completedLevels.push(gameState.currentLevel);
    }
    saveState();

    const nextLevel = gameState.currentLevel + 1;
    const totalLevels = currentStageData.levels.length;

    if (nextLevel > totalLevels) {
        finishStage();
        return;
    }

    playSound('momtazAbda3t');
    const box = document.getElementById('quiz-feedback-box');
    box.className = "p-5 rounded-2xl border bg-emerald-950/60 border-emerald-500/40 space-y-3 animate-fade-in";
    document.getElementById('feedback-header').innerHTML = `<i class="fa-solid fa-trophy text-amber-400"></i> <span class="text-emerald-300">أتممت المستوى ${gameState.currentLevel} بنجاح!</span>`;
    document.getElementById('feedback-explanation').textContent = `استعد للمستوى ${nextLevel} من ${totalLevels}...`;
    document.getElementById('feedback-training-tip').classList.add('hidden');
    box.classList.remove('hidden');
    document.getElementById('quiz-options-container').innerHTML = '';
    document.getElementById('quiz-question-text').textContent = '...';
    
    setTimeout(() => {
        gameState.currentLevel = nextLevel;
        reviewQuestionsPool = []; // تصفير مراجعة المستوى السابق
        loadLevelQuestions();
        currentQuestion = null;
        loadQuizQuestion();
    }, 2000);
}

function finishStage() {
    if (questionTimerInterval) clearInterval(questionTimerInterval);
    hideAllScreens(); globalStatus.classList.remove('hidden');
    document.getElementById('nav-buttons').classList.remove('hidden');
    resultScreen.classList.remove('hidden');

    const track = gameState.currentTrack;
    const totalLevels = currentStageData.levels.length;
    const completedLevels = gameState.tracks[track].stageProgress[currentStageData.id].completedLevels.length;

    document.getElementById('result-stage-title').textContent = currentStageData.title;
    document.getElementById('result-correct-count').textContent = totalLevels * 5;
    document.getElementById('result-total-count').textContent = totalLevels * 5;

    document.getElementById('result-badge-text').textContent = "إتقان تام 🏆";
    document.getElementById('result-badge-text').className = "inline-block px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold border border-amber-500/30";
    document.getElementById('result-trophy-icon').className = "fa-solid fa-trophy text-5xl text-amber-400";
    document.getElementById('result-title-text').textContent = "أتممت جميع المستويات بإتقان!";
    playSound('momtazAbda3t');

    if (!gameState.tracks[track].completedStages.includes(currentStageData.id)) {
        gameState.tracks[track].completedStages.push(currentStageData.id);
    }
    
    const nextId = currentStageData.id + 1;
    if (!gameState.tracks[track].unlockedStages.includes(nextId)) {
        const exists = window.stagesDatabase[track].find(s => s.id === nextId);
        if (exists) gameState.tracks[track].unlockedStages.push(nextId);
    }

    // قفل الاسم بعد إتمام المرحلة 1 في مسار النحو
    if (track === 'nahw' && currentStageData.id === 1 && !gameState.nameLocked) {
        gameState.nameLocked = true;
        if (!gameState.uuid) gameState.uuid = generateUUID();
        showToast("🔒 تم قفل اسمك نهائيًا مع توليد كود الشهادة");
    }

    // فحص إن كان قد أكمل كل شيء
    if (getTotalCompletedStages() >= 20) {
        setTimeout(() => { showToast("🎉 مبروك! أكملت جميع المراحل — يمكنك استخراج شهادتك الآن!"); }, 2500);
    }

    saveState();
}

function restartCurrentStage() {
    if (!currentStageData) { goToDashboard(); return; }
    startStageQuiz(currentStageData.id);
}

function confirmQuitQuiz() {
    if (confirm("هل أنت متأكد من إنهاء المرحلة؟ سيتم حفظ ما أنجزته.")) {
        goToCurrentTrackMap();
    }
}

// ==================== الشهادة والتصفير ====================
function openCertificate() {
    if (!gameState.studentName) { showToast("الرجاء إدخال اسمك أولاً"); return; }
    window.open('certificate.html', '_blank');
}

function openRulesModal() { document.getElementById('rules-modal').classList.remove('hidden'); }
function closeRulesModal() { document.getElementById('rules-modal').classList.add('hidden'); }
function openResetModal() {
    document.getElementById('reset-modal').classList.remove('hidden');
    document.getElementById('reset-code-input').value = "";
    document.getElementById('reset-error').classList.add('hidden');
}
function closeResetModal() { document.getElementById('reset-modal').classList.add('hidden'); }

function confirmReset() {
    const entered = document.getElementById('reset-code-input').value.trim();
    if (entered !== RESET_CODE) { document.getElementById('reset-error').classList.remove('hidden'); return; }
    
    localStorage.removeItem(CONFIG.STORAGE_KEY);
    gameState = {
        studentName: "", nameLocked: false, uuid: "", hearts: CONFIG.MAX_HEARTS, score: 0, streak: 0,
        currentTrack: null, currentStageId: null, currentLevel: 1,
        tracks: {
            nahw: { unlockedStages: [1], completedStages: [], stageProgress: {} },
            sarf: { unlockedStages: [1], completedStages: [], stageProgress: {} }
        },
        lastHeartRegenTime: Date.now(), version: CONFIG.STATE_VERSION
    };

    closeResetModal(); showToast("✅ تم تصفير كل شيء بنجاح");
    setTimeout(() => { location.reload(); }, 1200);
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = "fixed top-6 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl z-[60] text-sm font-bold flex items-center gap-3 border border-emerald-400/40 animate-fade-in";
    toast.innerHTML = `<i class="fa-solid fa-circle-info text-lg"></i> <span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// ==================== التشغيل ====================
window.addEventListener('load', function () {
    loadSavedState();
    regenHearts();
    updateGlobalHeader();

    const input = document.getElementById('student-name-input');
    const lockIcon = document.getElementById('name-lock-icon');

    if (gameState.studentName) input.value = gameState.studentName;
    if (gameState.nameLocked) {
        input.disabled = true; input.classList.add('opacity-60', 'cursor-not-allowed');
        if (lockIcon) lockIcon.classList.remove('hidden');
    } else {
        if (lockIcon) lockIcon.classList.add('hidden');
    }
});
