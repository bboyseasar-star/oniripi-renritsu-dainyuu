/**
 * 連立方程式・代入法ドリル「鬼リピ」制御プログラム (main.js)
 * 
 * アプリの画面遷移、問題の進行、MathLive入力（xとyの2入力欄）の監視と制御、
 * LaTeXの正規化による高精度な正誤判定、段階的ヒント、結果表示、
 * および間違えた問題の「無限復習ループ」を制御します。
 */

// アプリのグローバル状態管理オブジェクト
const state = {
    course: 'basic',       // 現在のコース ('basic' または 'advanced')
    questions: [],         // 今回解く問題リスト（通常5問）
    currentIndex: 0,       // 現在の問題インデックス (0〜4)
    score: 0,              // 現在の正解数
    answers: [],           // 各問題へのユーザーの解答を記録する配列
    hintCount: 0,          // 現在の問題でヒントを表示した回数
    isAnswered: false,     // 現在の問題の答え合わせが完了しているか
    isReviewMode: false,   // 間違えた問題の「復習モード」中かどうか
    failedQuestions: [],   // 今回間違えた問題のリスト（復習モード用）
    activeInputId: 'answer-input-x' // 現在フォーカスされている入力欄のID
};

// 起動時の初期設定
window.addEventListener('DOMContentLoaded', () => {
    // 過去のベストスコアと学習履歴を読み込んで表示
    loadBestScore();
    loadPlayHistory();
    
    // イベントリスナーの登録
    document.getElementById('course-basic').addEventListener('click', () => startDrill('basic'));
    document.getElementById('course-advanced').addEventListener('click', () => startDrill('advanced'));
    
    document.getElementById('btn-check').addEventListener('click', checkAnswer);
    document.getElementById('btn-next').addEventListener('click', nextQuestion);
    document.getElementById('btn-hint').addEventListener('click', showHint);
    document.getElementById('btn-quit').addEventListener('click', quitDrill);
    document.getElementById('btn-restart').addEventListener('click', restartDrill);
    document.getElementById('btn-review-failed').addEventListener('click', startReviewMode);
    document.getElementById('btn-home').addEventListener('click', goHome);
    document.getElementById('btn-clear-history').addEventListener('click', clearPlayHistory);
    
    // MathLive入力欄の初期化
    setupMathField();
});

// ==================== ハイスコア管理 (localStorage try-catch & メモリフォールバック) ====================
let bestScoreInMemory = { basic: null, advanced: null };

function loadBestScore() {
    const basicBestEl = document.getElementById('basic-best-score');
    const advBestEl = document.getElementById('advanced-best-score');
    
    // 基本コースのベスト読み込み
    try {
        const bestBasic = localStorage.getItem('oniripi_renritsu_best_basic');
        if (bestBasic !== null) {
            basicBestEl.textContent = `${bestBasic}問`;
            bestScoreInMemory.basic = parseInt(bestBasic, 10);
        } else {
            basicBestEl.textContent = bestScoreInMemory.basic !== null ? `${bestScoreInMemory.basic}問` : '-';
        }
    } catch (e) {
        console.warn('localStorage is not available:', e);
        basicBestEl.textContent = bestScoreInMemory.basic !== null ? `${bestScoreInMemory.basic}問` : '-';
    }
    
    // 応用コースのベスト読み込み
    try {
        const bestAdv = localStorage.getItem('oniripi_renritsu_best_advanced');
        if (bestAdv !== null) {
            advBestEl.textContent = `${bestAdv}問`;
            bestScoreInMemory.advanced = parseInt(bestAdv, 10);
        } else {
            advBestEl.textContent = bestScoreInMemory.advanced !== null ? `${bestScoreInMemory.advanced}問` : '-';
        }
    } catch (e) {
        console.warn('localStorage is not available:', e);
        advBestEl.textContent = bestScoreInMemory.advanced !== null ? `${bestScoreInMemory.advanced}問` : '-';
    }
}

function saveBestScore(score) {
    const currentCourse = state.course;
    const storageKey = `oniripi_renritsu_best_${currentCourse}`;
    
    try {
        const best = localStorage.getItem(storageKey);
        const currentBest = best !== null ? parseInt(best, 10) : (bestScoreInMemory[currentCourse] !== null ? bestScoreInMemory[currentCourse] : -1);
        if (score > currentBest) {
            localStorage.setItem(storageKey, score);
            bestScoreInMemory[currentCourse] = score;
            
            // コース選択画面の王冠表示用クラスを追加
            const cardEl = document.getElementById(`course-${currentCourse}`);
            if (score === 5 && cardEl) {
                cardEl.classList.add('completed');
            }
        }
    } catch (e) {
        console.warn('localStorage is not available for saving:', e);
        if (bestScoreInMemory[currentCourse] === null || score > bestScoreInMemory[currentCourse]) {
            bestScoreInMemory[currentCourse] = score;
        }
    }
}

// ==================== 学習履歴管理 ====================
let playHistoryInMemory = { basic: [], advanced: [] };

function loadPlayHistory() {
    const currentCourse = state.course;
    const storageKey = `oniripi_renritsu_history_${currentCourse}`;
    
    try {
        const historyJson = localStorage.getItem(storageKey);
        let history = [];
        if (historyJson !== null) {
            history = JSON.parse(historyJson);
            playHistoryInMemory[currentCourse] = history;
        } else {
            history = playHistoryInMemory[currentCourse] || [];
        }
        renderHistoryList(history);
    } catch (e) {
        console.warn('localStorage is not available for reading history:', e);
        renderHistoryList(playHistoryInMemory[currentCourse] || []);
    }
}

function savePlayHistory(score, total) {
    const currentCourse = state.course;
    const storageKey = `oniripi_renritsu_history_${currentCourse}`;
    const dateStr = getFormattedDate();
    const isPassed = (score / total) >= 0.8; // 8割以上で合格
    const record = {
        date: dateStr,
        score: score,
        total: total,
        isPassed: isPassed
    };
    
    try {
        const historyJson = localStorage.getItem(storageKey);
        let history = [];
        if (historyJson !== null) {
            history = JSON.parse(historyJson);
        } else {
            history = [...(playHistoryInMemory[currentCourse] || [])];
        }
        
        history.unshift(record); // 先頭に追加（最新順）
        if (history.length > 20) {
            history = history.slice(0, 20); // 最大20件に制限
        }
        
        localStorage.setItem(storageKey, JSON.stringify(history));
        playHistoryInMemory[currentCourse] = history;
    } catch (e) {
        console.warn('localStorage is not available for saving history:', e);
        playHistoryInMemory[currentCourse].unshift(record);
        if (playHistoryInMemory[currentCourse].length > 20) {
            playHistoryInMemory[currentCourse] = playHistoryInMemory[currentCourse].slice(0, 20);
        }
    }
}

function clearPlayHistory() {
    if (confirm('これまでの学習履歴と最高記録をすべて消去しますか？（基本・応用両方のデータが完全に削除されます）')) {
        try {
            localStorage.removeItem('oniripi_renritsu_history_basic');
            localStorage.removeItem('oniripi_renritsu_history_advanced');
            localStorage.removeItem('oniripi_renritsu_best_basic');
            localStorage.removeItem('oniripi_renritsu_best_advanced');
            
            playHistoryInMemory = { basic: [], advanced: [] };
            bestScoreInMemory = { basic: null, advanced: null };
            
            // コース選択カードの王冠マーク削除
            document.getElementById('course-basic').classList.remove('completed');
            document.getElementById('course-advanced').classList.remove('completed');
            
            // 表示の更新
            loadBestScore();
            loadPlayHistory();
            alert('履歴をすべてリセットしました。');
        } catch (e) {
            console.warn('localStorage clear failed:', e);
            playHistoryInMemory = { basic: [], advanced: [] };
            bestScoreInMemory = { basic: null, advanced: null };
            loadBestScore();
            loadPlayHistory();
            alert('履歴をリセットしました。');
        }
    }
}

function getFormattedDate() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${y}/${m}/${d} ${hh}:${mm}`;
}

function renderHistoryList(history) {
    const listEl = document.getElementById('history-list');
    listEl.innerHTML = '';
    
    if (!history || history.length === 0) {
        listEl.innerHTML = '<div class="history-empty">履歴はまだありません。<br>コースを選んでスタートしよう！</div>';
        return;
    }
    
    history.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = `history-item ${item.isPassed ? 'pass' : 'fail'}`;
        
        const badgeClass = item.isPassed ? 'pass' : 'fail';
        const badgeText = item.isPassed ? '合格 💮' : '不合格 ❌';
        
        itemEl.innerHTML = `
            <span class="history-date">${item.date}</span>
            <div class="history-score">
                <span class="history-score-val">${item.score} / ${item.total}問</span>
                <span class="history-badge ${badgeClass}">${badgeText}</span>
            </div>
        `;
        listEl.appendChild(itemEl);
    });
}

// ==================== ドリルの開始と初期化 ====================
function startDrill(courseName) {
    state.course = courseName;
    state.isReviewMode = false;
    
    // 指定されたコースの問題を動的に5問生成
    state.questions = window.QuestionGenerator.generateQuestions(courseName, 5);
    state.currentIndex = 0;
    state.score = 0;
    state.answers = [];
    state.failedQuestions = [];
    
    initDrillScreen();
    showScreen('screen-drill');
}

// 画面遷移関数
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// ドリル画面の表示初期化
function initDrillScreen() {
    state.isAnswered = false;
    state.hintCount = 0;
    
    // 現在フォーカスされる解答欄のデフォルトを x に設定
    state.activeInputId = 'answer-input-x';
    
    // 進捗メーターの更新
    document.getElementById('current-question-num').textContent = state.currentIndex + 1;
    document.getElementById('total-questions-num').textContent = state.questions.length;
    
    const progressPercent = ((state.currentIndex + 1) / state.questions.length) * 100;
    document.getElementById('progress-bar-fill').style.width = `${progressPercent}%`;
    
    document.getElementById('current-score').textContent = state.score;
    
    // UI要素のリセット
    document.getElementById('feedback-area').classList.remove('active');
    document.getElementById('correct-answer-block').classList.remove('active');
    document.getElementById('hint-display-area').classList.remove('active');
    document.getElementById('hint-display-area').innerHTML = '';
    
    document.getElementById('btn-check').classList.remove('hidden');
    document.getElementById('btn-next').classList.add('hidden');
    document.getElementById('btn-hint').classList.remove('hidden');
    
    // x と y の MathLive 入力欄のリセット
    const mfx = document.getElementById('answer-input-x');
    const mfy = document.getElementById('answer-input-y');
    
    mfx.value = '';
    mfy.value = '';
    mfx.disabled = false;
    mfy.disabled = false;
    
    // 問題文の表示 (連立方程式の中括弧フォーマット)
    const q = state.questions[state.currentIndex];
    
    // 連立方程式の LaTeX 表現 (A=B, C=D を中括弧 { で束ねる)
    const formulaLatex = `\\begin{cases} ${q.eq1} \\\\ ${q.eq2} \\end{cases}`;
    
    document.getElementById('question-formula').innerHTML = `\\(${formulaLatex}\\)`;
    
    // MathJaxによる数式表示の更新
    if (window.MathJax) {
        // 問題数式、振り返り、ヒントなどのすべての数式要素を再描画
        MathJax.typesetPromise([
            document.getElementById('question-formula'),
            document.querySelector('.keyboard-helper')
        ]).catch(err => {
            console.error('MathJax rendering error:', err);
        });
    }
    
    // xの入力欄にフォーカスを当てる
    setTimeout(() => {
        mfx.focus();
    }, 100);
}

// ==================== MathLive入力とIME対策 ====================
function setupMathField() {
    const mfx = document.getElementById('answer-input-x');
    const mfy = document.getElementById('answer-input-y');
    const fields = [mfx, mfy];
    
    // MathLiveのShadow DOM内のhidden textareaに latin を強制設定する関数
    function enforceShadowDOMInputmode(mf) {
        if (mf && mf.shadowRoot) {
            const textarea = mf.shadowRoot.querySelector('textarea');
            if (textarea) {
                textarea.setAttribute('inputmode', 'latin');
                textarea.setAttribute('autocorrect', 'off');
                textarea.setAttribute('autocapitalize', 'off');
                textarea.setAttribute('spellcheck', 'false');
                textarea.lang = 'en-US';
            }
        }
    }
    
    fields.forEach(mf => {
        if (!mf) return;
        
        // 初期設定
        enforceShadowDOMInputmode(mf);
        setTimeout(() => enforceShadowDOMInputmode(mf), 500);
        mf.setAttribute('inputmode', 'latin');
        
        // フォーカスされた入力欄を追跡
        mf.addEventListener('focus', () => {
            state.activeInputId = mf.id;
            mf.setAttribute('inputmode', 'latin');
            enforceShadowDOMInputmode(mf);
        });
        
        // Chromebookの全角IMEでの誤入力を自動的に半角へマッピング
        mf.addEventListener('compositionend', (ev) => {
            const data = ev.data;
            if (data) {
                const converted = data
                    .replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
                    .replace(/[ａ-ｚ]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
                    .replace(/[Ａ-Ｚ]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
                    .replace(/[＋]/g, '+')
                    .replace(/[－ー−]/g, '-')
                    .replace(/[＝]/g, '=')
                    .replace(/[／]/g, '/')
                    .replace(/[．。]/g, '.');
                mf.value = '';
                mf.insert(converted);
            }
        });
        
        // Enterキーが押されたら、もう片方の入力欄にフォーカスを移動するか、答え合わせを実行する
        mf.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (state.isAnswered) {
                    nextQuestion();
                    return;
                }
                
                // x から Enter が押された場合は y へフォーカスを移動
                if (mf.id === 'answer-input-x' && !mfy.value) {
                    mfy.focus();
                } else if (mf.id === 'answer-input-y' && !mfx.value) {
                    mfx.focus();
                } else {
                    // 両方入力されていれば答え合わせ
                    checkAnswer();
                }
            }
        });
    });
    
    // 入力補助キーボードのボタンイベント登録
    document.querySelectorAll('.key-btn').forEach(btn => {
        if (btn.id === 'btn-clear-input') return;
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const activeMf = document.getElementById(state.activeInputId);
            if (!activeMf || activeMf.disabled) return;
            
            const val = btn.getAttribute('data-value');
            try {
                activeMf.insert(val);
            } catch (err) {
                activeMf.value += val;
            }
            activeMf.focus();
        });
    });
    
    // クリアボタンの処理
    document.getElementById('btn-clear-input').addEventListener('click', (e) => {
        e.preventDefault();
        const activeMf = document.getElementById(state.activeInputId);
        if (!activeMf || activeMf.disabled) return;
        
        activeMf.value = '';
        activeMf.focus();
    });
}

// ==================== LaTeXの正規化と正誤判定 ====================

function normalizeLatex(latex) {
    if (!latex) return '';
    let s = latex.toString().replace(/\s+/g, ''); // すべてのスペースを削除
    
    // MathLive特有の余計な修飾コマンドを削除
    s = s.replace(/\\left|\\right|\\mleft|\\mright|\\,|\\cdot|\\operatorname/g, '');
    
    // 記号の統一
    s = s.replace(/\\pm/g, '±')
         .replace(/\\lt/g, '<')
         .replace(/\\gt/g, '>')
         .replace(/\\le/g, '≤')
         .replace(/\\ge/g, '≥');
         
    // 分数表記のブレース統一
    s = s.replace(/\\frac([^{])([^{])/g, '\\frac{$1}{$2}');
    s = s.replace(/\\frac{([^{])}([^{])/g, '\\frac{$1}{$2}');
    s = s.replace(/\\frac([^{]){([^{]+)}/g, '\\frac{$1}{$2}');
    
    // 負の分数の表記揺れ統一 (分子にマイナスを寄せる)
    s = s.replace(/-\\frac{([^}]+)}{([^}]+)}/g, '\\frac{-$1}{$2}');
    
    // 累乗表記のブレース統一
    s = s.replace(/\^([^{])/g, '^{$1}');
    
    return s;
}

/**
 * ユーザーが入力した x と y の値が、それぞれ問題の正解と完全に一致するか判定します。
 */
function judgeAnswer(userX, userY, correctX, correctY) {
    const cleanUserX = userX.replace(/\s+/g, '');
    const cleanUserY = userY.replace(/\s+/g, '');
    
    const normUserX = normalizeLatex(cleanUserX);
    const normUserY = normalizeLatex(cleanUserY);
    
    const normCorrectX = normalizeLatex(correctX);
    const normCorrectY = normalizeLatex(correctY);
    
    return (normUserX === normCorrectX && normUserY === normCorrectY);
}

// ==================== 答え合わせ処理 ====================
function checkAnswer() {
    const mfx = document.getElementById('answer-input-x');
    const mfy = document.getElementById('answer-input-y');
    
    const userValX = mfx.value.trim();
    const userValY = mfy.value.trim();
    
    // 未入力の場合は警告
    if (!userValX || !userValY) {
        alert('xとyの両方の値を入力してください。');
        if (!userValX) mfx.focus();
        else mfy.focus();
        return;
    }
    
    state.isAnswered = true;
    
    // 入力欄をロック
    mfx.disabled = true;
    mfy.disabled = true;
    
    // ボタンの表示切り替え
    document.getElementById('btn-check').classList.add('hidden');
    document.getElementById('btn-next').classList.remove('hidden');
    document.getElementById('btn-hint').classList.add('hidden');
    
    const q = state.questions[state.currentIndex];
    
    // 正誤判定
    const isCorrect = judgeAnswer(userValX, userValY, q.correctX, q.correctY);
    
    // フィードバック領域の初期化
    const feedbackArea = document.getElementById('feedback-area');
    const feedbackBadge = document.getElementById('feedback-badge');
    const correctBlock = document.getElementById('correct-answer-block');
    
    feedbackArea.classList.add('active');
    
    // 記録用のオブジェクトを作成 (MathJax用に LaTeX 囲み)
    const record = {
        questionText: `\\begin{cases} ${q.eq1} \\\\ ${q.eq2} \\end{cases}`,
        userAnswer: `x = ${userValX}, \\ y = ${userValY}`,
        correctAnswer: `x = ${q.correctX}, \\ y = ${q.correctY}`,
        isCorrect: isCorrect
    };
    state.answers.push(record);
    
    if (isCorrect) {
        // --- 正解の場合 ---
        state.score++;
        document.getElementById('current-score').textContent = state.score;
        
        feedbackBadge.textContent = '⭕ 正解！素晴らしい！';
        feedbackBadge.className = 'feedback-badge correct';
        correctBlock.classList.remove('active'); // 解説は隠す
        
        // ミニ紙吹雪演出（canvas-confetti）
        if (window.confetti) {
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.7 }
            });
        }
    } else {
        // --- 不正解の場合 ---
        feedbackBadge.textContent = '❌ 残念、まちがい！';
        feedbackBadge.className = 'feedback-badge wrong';
        
        // ユーザー解答と正しい答えの比較を表示 (MathJax)
        document.getElementById('user-ans-val').innerHTML = `\\(x = ${userValX}, \\ y = ${userValY}\\)`;
        document.getElementById('correct-ans-val').innerHTML = `\\(x = ${q.correctX}, \\ y = ${q.correctY}\\)`;
        
        // 解説文章を設定
        const expBox = document.getElementById('question-explanation');
        expBox.innerHTML = q.explanation;
        
        correctBlock.classList.add('active');
        
        // 数式を美しく表示するため MathJax に再レンダリングを依頼
        if (window.MathJax) {
            MathJax.typesetPromise([document.getElementById('correct-answer-block')]).catch(err => {
                console.error('MathJax explanation rendering error:', err);
            });
        }
        
        // 復習用に間違えた問題を記録 (重複防止)
        if (!state.failedQuestions.some(item => item.id === q.id)) {
            state.failedQuestions.push(q);
        }
    }
}

// ==================== ヒント表示システム ====================
function showHint() {
    const q = state.questions[state.currentIndex];
    const hintDisplay = document.getElementById('hint-display-area');
    
    if (state.hintCount >= q.hints.length) return;
    
    hintDisplay.classList.add('active');
    
    let currentHintHtml = '';
    
    // これまでに開いたヒントをすべて並べて表示する
    for (let i = 0; i <= state.hintCount; i++) {
        const hintText = q.hints[i];
        
        if (hintText.includes('⚠️')) {
            currentHintHtml += `<div class="hint-warning">${hintText}</div>`;
        } else {
            currentHintHtml += `<div class="hint-item"><span class="hint-num">ヒント${i + 1}:</span> ${hintText}</div>`;
        }
    }
    
    hintDisplay.innerHTML = currentHintHtml;
    
    // 数式の再レンダリング
    if (window.MathJax) {
        MathJax.typesetPromise([hintDisplay]).catch(err => {
            console.error('MathJax hint rendering error:', err);
        });
    }
    
    // スクロールを一番下に自動移動
    hintDisplay.scrollTop = hintDisplay.scrollHeight;
    
    // 最後のヒント（答え）を表示した場合はギブアップ（無効化）処理
    if (state.hintCount === q.hints.length - 1) {
        state.isAnswered = true;
        document.getElementById('answer-input-x').disabled = true;
        document.getElementById('answer-input-y').disabled = true;
        
        document.getElementById('btn-check').classList.add('hidden');
        document.getElementById('btn-next').classList.remove('hidden');
        document.getElementById('btn-hint').classList.add('hidden');
        
        // 誤答レコードとして追加
        const record = {
            questionText: `\\begin{cases} ${q.eq1} \\\\ ${q.eq2} \\end{cases}`,
            userAnswer: 'ギブアップ（答えを確認）',
            correctAnswer: `x = ${q.correctX}, \\ y = ${q.correctY}`,
            isCorrect: false
        };
        state.answers.push(record);
        
        if (!state.failedQuestions.some(item => item.id === q.id)) {
            state.failedQuestions.push(q);
        }
    } else {
        // 次回のヒントカウントに進める
        state.hintCount++;
    }
}

// ==================== 次の問題・中断・終了 ====================
function nextQuestion() {
    state.currentIndex++;
    
    if (state.currentIndex < state.questions.length) {
        // 次の問題を表示
        initDrillScreen();
    } else {
        // 全問終了、結果画面へ
        showResultScreen();
    }
}

function quitDrill() {
    if (confirm('ドリルを中断してホームに戻りますか？そこまでの記録は保存されません。')) {
        goHome();
    }
}

// ==================== 結果画面の表示 ====================
function showResultScreen() {
    showScreen('screen-result');
    
    // スコアの更新
    document.getElementById('final-correct-count').textContent = state.score;
    document.getElementById('final-total-count').textContent = state.questions.length;
    
    // ベストスコアの保存と更新
    saveBestScore(state.score);
    loadBestScore();
    
    // プレイ履歴の保存（復習モードでない通常モードの場合のみ記録）
    if (!state.isReviewMode) {
        savePlayHistory(state.score, state.questions.length);
    }
    loadPlayHistory();
    
    // スコアに応じた演出とメッセージ
    const emojiEl = document.getElementById('result-emoji');
    const titleEl = document.getElementById('result-title');
    const messageEl = document.getElementById('result-message');
    const reviewBtn = document.getElementById('btn-review-failed');
    
    const accuracy = state.score / state.questions.length;
    
    if (accuracy === 1.0) {
        emojiEl.textContent = '👑';
        titleEl.textContent = 'パーフェクトクリア！';
        messageEl.textContent = '素晴らしい！全問大正解！代入法は完璧にマスターしたね！';
        reviewBtn.classList.add('hidden'); // 間違えた問題がないので復習ボタンは隠す
        
        // 豪華なコンフェッティ演出（両サイドから発射）
        triggerPerfectConfetti();
    } else if (accuracy >= 0.8) {
        emojiEl.textContent = '🎉';
        titleEl.textContent = '目標達成！クリア！';
        messageEl.textContent = '合格ライン突破！よく頑張ったね！間違えた問題を復習して満点を目指そう！';
        reviewBtn.classList.remove('hidden');
    } else {
        emojiEl.textContent = '🔥';
        titleEl.textContent = 'お疲れさま！再挑戦しよう！';
        messageEl.textContent = 'まずは間違えた問題を復習して、代入法を解くコツをつかもう！';
        reviewBtn.classList.remove('hidden');
    }
    
    // 振り返りリストの生成
    buildReviewList();
}

// パーフェクト時の紙吹雪演出 (Web Audio API 等もあればさらに豪華ですが、Confettiで十分 wowed されます)
function triggerPerfectConfetti() {
    if (!window.confetti) return;
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;
 
    (function frame() {
        confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 }
        });
        confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
        });
 
        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}

// 振り返りリストのHTML作成
function buildReviewList() {
    const listContainer = document.getElementById('review-list');
    listContainer.innerHTML = '';
    
    state.answers.forEach((ans, index) => {
        const item = document.createElement('div');
        item.className = 'review-item';
        
        const statusText = ans.isCorrect ? '正解' : 'まちがい';
        const statusClass = ans.isCorrect ? 'correct' : 'wrong';
        
        // ユーザー解答のスタイル調整
        const userAnsClass = ans.isCorrect ? 'correct' : 'user-wrong';
        
        item.innerHTML = `
            <div class="review-item-header">
                <span class="review-item-num">第 ${index + 1} 問</span>
                <span class="review-item-status ${statusClass}">${statusText}</span>
            </div>
            <div class="review-item-body">
                <div class="review-formula">\\(${ans.questionText}\\)</div>
                <div class="review-answers">
                    <div>あなたの答え: <span class="review-user-ans ${userAnsClass}">\\(${ans.userAnswer}\\)</span></div>
                    ${!ans.isCorrect ? `<div>正しい答え: <span class="review-correct-ans">\\(${ans.correctAnswer}\\)</span></div>` : ''}
                </div>
            </div>
        `;
        listContainer.appendChild(item);
    });
    
    // 振り返りリスト内の数式のレンダリング
    if (window.MathJax) {
        MathJax.typesetPromise([listContainer]).catch(err => {
            console.error('MathJax review list rendering error:', err);
        });
    }
}

// ==================== 復習モードの制御 ====================
function startReviewMode() {
    if (state.failedQuestions.length === 0) return;
    
    state.isReviewMode = true;
    
    // 間違えた問題リストを今回の問題リストに置き換える
    state.questions = [...state.failedQuestions];
    state.currentIndex = 0;
    state.score = 0;
    state.answers = [];
    state.failedQuestions = []; // ループに備えて再収集
    
    initDrillScreen();
    showScreen('screen-drill');
}

// ==================== その他の遷移ボタン ====================
function restartDrill() {
    startDrill(state.course);
}

function goHome() {
    showScreen('screen-start');
    loadBestScore();
    loadPlayHistory();
}
