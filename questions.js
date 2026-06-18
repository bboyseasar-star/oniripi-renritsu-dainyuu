/**
 * 連立方程式・代入法マスター 問題データ生成プログラム (questions.js)
 * 
 * 逆算アルゴリズムを用いて、解が必ず整数または簡単な分数になり、かつ係数が適切になる問題を動的生成します。
 * 基本コース・応用コースそれぞれ8つのテンプレートを定義し、4段階ヒントおよび詳細な途中式ステップを自動構築します。
 */

(function() {
    // ==================== 数学ヘルパー関数 ====================

    // 最大公約数 (GCD)
    function gcd(a, b) {
        a = Math.abs(a);
        b = Math.abs(b);
        while (b) {
            const t = b;
            b = a % b;
            a = t;
        }
        return a;
    }

    // 指定範囲のランダムな整数を生成（0を除くなどの指定が可能）
    function getRandomInt(min, max, exclude = []) {
        let num;
        do {
            num = Math.floor(Math.random() * (max - min + 1)) + min;
        } while (exclude.includes(num));
        return num;
    }

    // 配列からランダムに1つ選択
    function getRandomElement(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    // 分数を約分して適切なLaTeX文字列にする
    // 例: formatFraction(2, 4) -> "1/2" の LaTeX, formatFraction(-3, 1) -> "-3"
    function formatFraction(num, den) {
        if (den === 0) return '0';
        if (num === 0) return '0';
        
        // 符号の整理
        let sign = '';
        if ((num < 0 && den > 0) || (num > 0 && den < 0)) {
            sign = '-';
        }
        
        const n = Math.abs(num);
        const d = Math.abs(den);
        const g = gcd(n, d);
        
        const reducedNum = n / g;
        const reducedDen = d / g;
        
        if (reducedDen === 1) {
            return `${sign}${reducedNum}`;
        } else {
            return `${sign}\\frac{${reducedNum}}{${reducedDen}}`;
        }
    }

    // 項を表示用にフォーマットする
    // coeff: 係数, char: 変数文字 (x, y), isFirst: 式の最初の項かどうか
    function formatTerm(coeff, char, isFirst = false) {
        if (coeff === 0) return '';
        
        let sign = '';
        if (coeff < 0) {
            sign = '-';
        } else if (!isFirst) {
            sign = '+';
        }
        
        const absCoeff = Math.abs(coeff);
        let coeffStr = absCoeff.toString();
        if (absCoeff === 1) {
            coeffStr = ''; // 1x や -1y の "1" は省略
        }
        
        return `${sign}${coeffStr}${char}`;
    }

    // ==================== 問題テンプレート設計 (逆算方式) ====================

    // 【基本コース用テンプレート】 (一方の式がすでに y = ... または x = ... の形)
    const basicTemplates = [
        {
            // パターン1: y = ax (定数項なし) を bx + cy = d に代入
            name: 'y = ax 型',
            generate: function() {
                // 先に整数解を決定
                const xVal = getRandomInt(-4, 4, [0]);
                const a = getRandomInt(-3, 3, [0]);
                const yVal = a * xVal; // y = ax から自動決定
                
                // もう一つの式 bx + cy = d の係数を決定
                const b = getRandomInt(-4, 4, [0]);
                let c;
                // 代入したときに x の係数 (b + ca) が 0 にならないように選ぶ
                do {
                    c = getRandomInt(-3, 3, [0]);
                } while (b + c * a === 0);
                
                const d = b * xVal + c * yVal; // d を逆算
                
                // LaTeX表示用の式
                const eq1Str = `y = ${formatTerm(a, 'x', true)}`;
                const eq2Str = `${formatTerm(b, 'x', true)}${formatTerm(c, 'y')} = ${d}`;
                
                const latexX = formatFraction(xVal, 1);
                const latexY = formatFraction(yVal, 1);
                
                return {
                    id: `basic_1_${a}_${b}_${c}_${d}`,
                    eq1: eq1Str,
                    eq2: eq2Str,
                    correctX: latexX,
                    correctY: latexY,
                    hints: [
                        `①の式が \\(y = ${a}x\\) になっているね。②の式の \\(y\\) のところに \\(${a}x\\) を代入してみよう。`,
                        `代入すると、\\(${formatTerm(b, 'x', true)} ${c >= 0 ? '+' : ''} ${c} (${a}x) = ${d}\\) という \\(x\\) だけの方程式になるよ。これを解いて \\(x\\) を求めよう。`,
                        `⚠️ 注意：次のヒントは「答え」だよ！次を見ると不正解になっちゃうから気をつけてね！`,
                        `答えは \\(x = ${latexX}, y = ${latexY}\\) です。`
                    ],
                    explanation: `
                        <div class="exp-step-list">
                            <div class="exp-step">
                                <strong>【ステップ1】代入して文字を1つにする</strong><br>
                                ①の式 \\(${eq1Str}\\) を、②の式 \\(${eq2Str}\\) の \\(y\\) に代入します。<br>
                                <div class="exp-formula">\\(${b}x ${c >= 0 ? '+' : ''} ${c} (${a}x) = ${d}\\)</div>
                            </div>
                            <div class="exp-step">
                                <strong>【ステップ2】方程式を解いて \\(x\\) を求める</strong><br>
                                かっこを外して整理します。<br>
                                <div class="exp-formula">\\(${b}x ${c * a >= 0 ? '+' : ''} ${c * a}x = ${d}\\)</div>
                                <div class="exp-formula">\\(${b + c * a}x = ${d}\\)</div>
                                両辺を \\(${b + c * a}\\) で割ると、<br>
                                <div class="exp-formula">\\(x = ${latexX}\\)</div>
                            </div>
                            <div class="exp-step">
                                <strong>【ステップ3】もう一方の文字 \\(y\\) を求める</strong><br>
                                \\(x = ${latexX}\\) を①の式に代入して \\(y\\) を計算します。<br>
                                <div class="exp-formula">\\(y = ${a} \\times (${latexX}) = ${latexY}\\)</div>
                                したがって、求める解は <strong>\\(x = ${latexX}, y = ${latexY}\\)</strong> となります。
                            </div>
                        </div>
                    `
                };
            }
        },
        {
            // パターン2: x = ay (定数項なし) を bx + cy = d に代入
            name: 'x = ay 型',
            generate: function() {
                const yVal = getRandomInt(-4, 4, [0]);
                const a = getRandomInt(-3, 3, [0]);
                const xVal = a * yVal; // x = ay
                
                const c = getRandomInt(-4, 4, [0]);
                let b;
                do {
                    b = getRandomInt(-3, 3, [0]);
                } while (b * a + c === 0);
                
                const d = b * xVal + c * yVal; // d を逆算
                
                const eq1Str = `x = ${formatTerm(a, 'y', true)}`;
                const eq2Str = `${formatTerm(b, 'x', true)}${formatTerm(c, 'y')} = ${d}`;
                
                const latexX = formatFraction(xVal, 1);
                const latexY = formatFraction(yVal, 1);
                
                return {
                    id: `basic_2_${a}_${b}_${c}_${d}`,
                    eq1: eq1Str,
                    eq2: eq2Str,
                    correctX: latexX,
                    correctY: latexY,
                    hints: [
                        `①の式が \\(x = ${a}y\\) になっているね。②の式の \\(x\\) のところに \\(${a}y\\) を代入してみよう。`,
                        `代入すると、\\(${b} (${a}y) ${c >= 0 ? '+' : ''} ${formatTerm(c, 'y', true)} = ${d}\\) という \\(y\\) だけの方程式になるよ。`,
                        `⚠️ 注意：次のヒントは「答え」だよ！次を見ると不正解になっちゃうから気をつけてね！`,
                        `答えは \\(x = ${latexX}, y = ${latexY}\\) です。`
                    ],
                    explanation: `
                        <div class="exp-step-list">
                            <div class="exp-step">
                                <strong>【ステップ1】代入して文字を1つにする</strong><br>
                                ①の式 \\(${eq1Str}\\) を、②の式 \\(${eq2Str}\\) の \\(x\\) に代入します。<br>
                                <div class="exp-formula">\\(${b} (${a}y) ${c >= 0 ? '+' : ''} ${formatTerm(c, 'y', true)} = ${d}\\)</div>
                            </div>
                            <div class="exp-step">
                                <strong>【ステップ2】方程式を解いて \\(y\\) を求める</strong><br>
                                かっこを外して整理します。<br>
                                <div class="exp-formula">\\(${b * a}y ${c >= 0 ? '+' : ''} ${formatTerm(c, 'y', true)} = ${d}\\)</div>
                                <div class="exp-formula">\\(${b * a + c}y = ${d}\\)</div>
                                両辺を \\(${b * a + c}\\) で割ると、<br>
                                <div class="exp-formula">\\(y = ${latexY}\\)</div>
                            </div>
                            <div class="exp-step">
                                <strong>【ステップ3】もう一方の文字 \\(x\\) を求める</strong><br>
                                \\(y = ${latexY}\\) を①の式に代入して \\(x\\) を計算します。<br>
                                <div class="exp-formula">\\(x = ${a} \\times (${latexY}) = ${latexX}\\)</div>
                                したがって、求める解は <strong>\\(x = ${latexX}, y = ${latexY}\\)</strong> となります。
                            </div>
                        </div>
                    `
                };
            }
        },
        {
            // パターン3: y = ax + b を cx + dy = e に代入 (基本)
            name: 'y = ax + b 型',
            generate: function() {
                const xVal = getRandomInt(-3, 3, [0]);
                const yVal = getRandomInt(-3, 3, [0]);
                
                const a = getRandomInt(-2, 2, [0]);
                const b = yVal - a * xVal; // b を逆算
                
                const c = getRandomInt(-3, 3, [0]);
                let d;
                do {
                    d = getRandomInt(-2, 2, [0]);
                } while (c + d * a === 0);
                
                const e = c * xVal + d * yVal; // e を逆算
                
                const eq1Str = `y = ${formatTerm(a, 'x', true)}${b >= 0 ? '+' : ''}${b}`;
                const eq2Str = `${formatTerm(c, 'x', true)}${formatTerm(d, 'y')} = ${e}`;
                
                const latexX = formatFraction(xVal, 1);
                const latexY = formatFraction(yVal, 1);
                
                return {
                    id: `basic_3_${a}_${b}_${c}_${d}_${e}`,
                    eq1: eq1Str,
                    eq2: eq2Str,
                    correctX: latexX,
                    correctY: latexY,
                    hints: [
                        `①の式が \\(y = ${a}x ${b >= 0 ? '+' : ''} ${b}\\) だね。②の式の中にある \\(y\\) に、この式の右辺を丸ごとカッコに入れて代入しよう。`,
                        `代入すると、\\(${formatTerm(c, 'x', true)} ${d >= 0 ? '+' : ''} ${d} (${a}x ${b >= 0 ? '+' : ''} ${b}) = ${e}\\) になるよ。カッコを展開して整理しよう。`,
                        `⚠️ 注意：次のヒントは「答え」だよ！次を見ると不正解になっちゃうから気をつけてね！`,
                        `答えは \\(x = ${latexX}, y = ${latexY}\\) です。`
                    ],
                    explanation: `
                        <div class="exp-step-list">
                            <div class="exp-step">
                                <strong>【ステップ1】代入して \\(x\\) のみの式にする</strong><br>
                                ①の式を、②の式の \\(y\\) に代入します（※カッコをつけるのを忘れないようにしましょう）。<br>
                                <div class="exp-formula">\\(${c}x ${d >= 0 ? '+' : ''} ${d} (${a}x ${b >= 0 ? '+' : ''} ${b}) = ${e}\\)</div>
                            </div>
                            <div class="exp-step">
                                <strong>【ステップ2】カッコを展開して \\(x\\) を求める</strong><br>
                                分配法則でカッコを外します。<br>
                                <div class="exp-formula">\\(${c}x ${d * a >= 0 ? '+' : ''} ${d * a}x ${d * b >= 0 ? '+' : ''} ${d * b} = ${e}\\)</div>
                                同類項をまとめ、定数項を右辺に移項します。<br>
                                <div class="exp-formula">\\(${c + d * a}x = ${e} - (${d * b})\\)</div>
                                <div class="exp-formula">\\(${c + d * a}x = ${e - d * b}\\)</div>
                                両辺を割ると、<br>
                                <div class="exp-formula">\\(x = ${latexX}\\)</div>
                            </div>
                            <div class="exp-step">
                                <strong>【ステップ3】\\(y\\) を求める</strong><br>
                                \\(x = ${latexX}\\) を①の式 \\(y = ${a}x ${b >= 0 ? '+' : ''} ${b}\\) に代入します。<br>
                                <div class="exp-formula">\\(y = ${a} \\times (${latexX}) ${b >= 0 ? '+' : ''} ${b} = ${latexY}\\)</div>
                                したがって、求める解は <strong>\\(x = ${latexX}, y = ${latexY}\\)</strong> です。
                            </div>
                        </div>
                    `
                };
            }
        },
        {
            // パターン4: x = ay + b を cx + dy = e に代入
            name: 'x = ay + b 型',
            generate: function() {
                const xVal = getRandomInt(-3, 3, [0]);
                const yVal = getRandomInt(-3, 3, [0]);
                
                const a = getRandomInt(-2, 2, [0]);
                const b = xVal - a * yVal; // b を逆算
                
                const d = getRandomInt(-3, 3, [0]);
                let c;
                do {
                    c = getRandomInt(-2, 2, [0]);
                } while (c * a + d === 0);
                
                const e = c * xVal + d * yVal; // e を逆算
                
                const eq1Str = `x = ${formatTerm(a, 'y', true)}${b >= 0 ? '+' : ''}${b}`;
                const eq2Str = `${formatTerm(c, 'x', true)}${formatTerm(d, 'y')} = ${e}`;
                
                const latexX = formatFraction(xVal, 1);
                const latexY = formatFraction(yVal, 1);
                
                return {
                    id: `basic_4_${a}_${b}_${c}_${d}_${e}`,
                    eq1: eq1Str,
                    eq2: eq2Str,
                    correctX: latexX,
                    correctY: latexY,
                    hints: [
                        `①の式が \\(x = ${a}y ${b >= 0 ? '+' : ''} ${b}\\) の形だね。②の式の \\(x\\) に、この式の右辺を丸ごとカッコ付きで代入しよう。`,
                        `代入すると、\\(${c} (${a}y ${b >= 0 ? '+' : ''} ${b}) ${d >= 0 ? '+' : ''} ${formatTerm(d, 'y', true)} = ${e}\\) になるよ。展開して整理しよう。`,
                        `⚠️ 注意：次のヒントは「答え」だよ！次を見ると不正解になっちゃうから気をつけてね！`,
                        `答えは \\(x = ${latexX}, y = ${latexY}\\) です。`
                    ],
                    explanation: `
                        <div class="exp-step-list">
                            <div class="exp-step">
                                <strong>【ステップ1】代入して \\(y\\) のみの式にする</strong><br>
                                ①の式を、②の式の \\(x\\) にカッコをつけて代入します。<br>
                                <div class="exp-formula">\\(${c} (${a}y ${b >= 0 ? '+' : ''} ${b}) ${d >= 0 ? '+' : ''} ${formatTerm(d, 'y', true)} = ${e}\\)</div>
                            </div>
                            <div class="exp-step">
                                <strong>【ステップ2】カッコを展開して \\(y\\) を求める</strong><br>
                                カッコを外して同類項を整理します。<br>
                                <div class="exp-formula">\\(${c * a}y ${c * b >= 0 ? '+' : ''} ${c * b} ${d >= 0 ? '+' : ''} ${formatTerm(d, 'y', true)} = ${e}\\)</div>
                                <div class="exp-formula">\\(${c * a + d}y = ${e} - (${c * b})\\)</div>
                                <div class="exp-formula">\\(${c * a + d}y = ${e - c * b}\\)</div>
                                両辺を割ると、<br>
                                <div class="exp-formula">\\(y = ${latexY}\\)</div>
                            </div>
                            <div class="exp-step">
                                <strong>【ステップ3】\\(x\\) を求める</strong><br>
                                \\(y = ${latexY}\\) を①の式 \\(x = ${a}y ${b >= 0 ? '+' : ''} ${b}\\) に代入します。<br>
                                <div class="exp-formula">\\(x = ${a} \\times (${latexY}) ${b >= 0 ? '+' : ''} ${b} = ${latexX}\\)</div>
                                したがって、求める解は <strong>\\(x = ${latexX}, y = ${latexY}\\)</strong> です。
                            </div>
                        </div>
                    `
                };
            }
        },
        {
            // パターン5: y = ax + b の代入で「分数解」が出るパターン
            name: 'y = ax + b 型 (分数解)',
            generate: function() {
                // 分数解にする。xを 1/2 や 1/3 等にする
                const xNum = getRandomElement([-1, 1, 2, -2]);
                const xDen = getRandomElement([2, 3]);
                const xVal = xNum / xDen; // 分数値
                
                const yVal = getRandomInt(-2, 2); // y は整数
                
                // y = ax + b の係数を決定。a は xDen の倍数にして b が整数になるようにする
                const a = xDen * getRandomInt(-1, 1, [0]);
                const b = yVal - a * xVal; // b は必ず整数になる
                
                // もう一つの式 cx + dy = e。c, d は整数
                const c = getRandomInt(-3, 3, [0]);
                let d;
                do {
                    d = getRandomInt(-2, 2, [0]);
                } while (c + d * a === 0);
                
                const e = c * xVal + d * yVal; 
                // e が整数またはきれいな分数。c*xVal + d*yVal -> c*xNum/xDen + d*yVal
                // 代入したときの式が破綻しないよう、eも分数解を許容する判定ロジックがあるため安心
                
                const eq1Str = `y = ${formatTerm(a, 'x', true)}${b >= 0 ? '+' : ''}${b}`;
                const eq2Str = `${formatTerm(c, 'x', true)}${formatTerm(d, 'y')} = ${formatFraction(c * xNum + d * yVal * xDen, xDen)}`;
                
                const latexX = formatFraction(xNum, xDen);
                const latexY = formatFraction(yVal, 1);
                
                return {
                    id: `basic_5_${a}_${b}_${c}_${d}`,
                    eq1: eq1Str,
                    eq2: eq2Str,
                    correctX: latexX,
                    correctY: latexY,
                    hints: [
                        `①の式 \\(y = ${eq1Str}\\) を、②の式の \\(y\\) に代入してみよう。少し計算が難しくなるけれど、代入の方法は同じだよ。`,
                        `代入すると、\\(${c}x ${d >= 0 ? '+' : ''} ${d} (${a}x ${b >= 0 ? '+' : ''} ${b}) = ${formatFraction(c * xNum + d * yVal * xDen, xDen)}\\) になるよ。分数の計算に気をつけながら \\(x\\) を求めよう。`,
                        `⚠️ 注意：次のヒントは「答え」だよ！次を見ると不正解になっちゃうから気をつけてね！`,
                        `答えは \\(x = ${latexX}, y = ${latexY}\\) です。`
                    ],
                    explanation: `
                        <div class="exp-step-list">
                            <div class="exp-step">
                                <strong>【ステップ1】代入して1変数の方程式にする</strong><br>
                                ①を②に代入します。<br>
                                <div class="exp-formula">\\(${c}x ${d >= 0 ? '+' : ''} ${d} (${a}x ${b >= 0 ? '+' : ''} ${b}) = ${formatFraction(c * xNum + d * yVal * xDen, xDen)}\\)</div>
                            </div>
                            <div class="exp-step">
                                <strong>【ステップ2】カッコを展開して \\(x\\) を解く</strong><br>
                                <div class="exp-formula">\\(${c}x ${d * a >= 0 ? '+' : ''} ${d * a}x ${d * b >= 0 ? '+' : ''} ${d * b} = ${formatFraction(c * xNum + d * yVal * xDen, xDen)}\\)</div>
                                <div class="exp-formula">\\(${c + d * a}x = ${formatFraction(c * xNum + d * yVal * xDen, xDen)} - ${d * b}\\)</div>
                                両辺を整理して解くと、答えが分数になります。<br>
                                <div class="exp-formula">\\(x = ${latexX}\\)</div>
                            </div>
                            <div class="exp-step">
                                <strong>【ステップ3】\\(y\\) を求める</strong><br>
                                \\(x = ${latexX}\\) を①に代入します。<br>
                                <div class="exp-formula">\\(y = ${a} \\times \\left(${latexX}\\right) ${b >= 0 ? '+' : ''} ${b} = ${latexY}\\)</div>
                                したがって、解は <strong>\\(x = ${latexX}, y = ${latexY}\\)</strong> です。
                            </div>
                        </div>
                    `
                };
            }
        },
        {
            // パターン6: x = ay + b で「負の解」が出るパターン
            name: 'x = ay + b 型 (負の解)',
            generate: function() {
                const xVal = getRandomInt(-4, -1); // xは必ず負の数
                const yVal = getRandomInt(-4, 4, [0]);
                
                const a = getRandomInt(-2, 2, [0]);
                const b = xVal - a * yVal; // bを逆算
                
                const d = getRandomInt(-3, 3, [0]);
                let c;
                do {
                    c = getRandomInt(-2, 2, [0]);
                } while (c * a + d === 0);
                
                const e = c * xVal + d * yVal;
                
                const eq1Str = `x = ${formatTerm(a, 'y', true)}${b >= 0 ? '+' : ''}${b}`;
                const eq2Str = `${formatTerm(c, 'x', true)}${formatTerm(d, 'y')} = ${e}`;
                
                const latexX = formatFraction(xVal, 1);
                const latexY = formatFraction(yVal, 1);
                
                return {
                    id: `basic_6_${a}_${b}_${c}_${d}_${e}`,
                    eq1: eq1Str,
                    eq2: eq2Str,
                    correctX: latexX,
                    correctY: latexY,
                    hints: [
                        `①の式 \\(x = ${eq1Str}\\) を②の式の \\(x\\) に代入しよう。負の符号の計算に気をつけてね。`,
                        `代入すると、\\(${c} (${a}y ${b >= 0 ? '+' : ''} ${b}) ${d >= 0 ? '+' : ''} ${formatTerm(d, 'y', true)} = ${e}\\) になるよ。展開時の符号ミスに注意して \\(y\\) を解こう。`,
                        `⚠️ 注意：次のヒントは「答え」だよ！次を見ると不正解になっちゃうから気をつけてね！`,
                        `答えは \\(x = ${latexX}, y = ${latexY}\\) です。`
                    ],
                    explanation: `
                        <div class="exp-step-list">
                            <div class="exp-step">
                                <strong>【ステップ1】代入する</strong><br>
                                ①を②の \\(x\\) に代入します。<br>
                                <div class="exp-formula">\\(${c} (${a}y ${b >= 0 ? '+' : ''} ${b}) ${d >= 0 ? '+' : ''} ${formatTerm(d, 'y', true)} = ${e}\\)</div>
                            </div>
                            <div class="exp-step">
                                <strong>【ステップ2】負の符号に注意して \\(y\\) を解く</strong><br>
                                カッコを展開します。<br>
                                <div class="exp-formula">\\(${c * a}y ${c * b >= 0 ? '+' : ''} ${c * b} ${d >= 0 ? '+' : ''} ${formatTerm(d, 'y', true)} = ${e}\\)</div>
                                <div class="exp-formula">\\(${c * a + d}y = ${e - c * b}\\)</div>
                                <div class="exp-formula">\\(y = ${latexY}\\)</div>
                            </div>
                            <div class="exp-step">
                                <strong>【ステップ3】\\(x\\) を求める</strong><br>
                                \\(y = ${latexY}\\) を①に代入して計算します。<br>
                                <div class="exp-formula">\\(x = ${a} \\times (${latexY}) ${b >= 0 ? '+' : ''} ${b} = ${latexX}\\)</div>
                                したがって、求める解は <strong>\\(x = ${latexX}, y = ${latexY}\\)</strong> です。
                            </div>
                        </div>
                    `
                };
            }
        },
        {
            // パターン7: y = -ax + b (負の係数) を代入
            name: 'y = -ax + b 型',
            generate: function() {
                const xVal = getRandomInt(-3, 3, [0]);
                const yVal = getRandomInt(-3, 3, [0]);
                
                const a = getRandomInt(-3, -1); // 負の係数
                const b = yVal - a * xVal; // bを逆算
                
                const c = getRandomInt(-3, 3, [0]);
                let d;
                do {
                    d = getRandomInt(-2, 2, [0]);
                } while (c + d * a === 0);
                
                const e = c * xVal + d * yVal;
                
                const eq1Str = `y = ${formatTerm(a, 'x', true)}${b >= 0 ? '+' : ''}${b}`;
                const eq2Str = `${formatTerm(c, 'x', true)}${formatTerm(d, 'y')} = ${e}`;
                
                const latexX = formatFraction(xVal, 1);
                const latexY = formatFraction(yVal, 1);
                
                return {
                    id: `basic_7_${a}_${b}_${c}_${d}_${e}`,
                    eq1: eq1Str,
                    eq2: eq2Str,
                    correctX: latexX,
                    correctY: latexY,
                    hints: [
                        `①の式が \\(y = ${a}x ${b >= 0 ? '+' : ''} ${b}\\) だね。係数がマイナスだけどやり方は同じだよ。②の \\(y\\) に代入してみよう。`,
                        `代入すると、\\(${c}x ${d >= 0 ? '+' : ''} ${d} (${a}x ${b >= 0 ? '+' : ''} ${b}) = ${e}\\) になるよ。分配法則でカッコを外すとき、マイナスの掛け算に気をつけて！`,
                        `⚠️ 注意：次のヒントは「答え」だよ！次を見ると不正解になっちゃうから気をつけてね！`,
                        `答えは \\(x = ${latexX}, y = ${latexY}\\) です。`
                    ],
                    explanation: `
                        <div class="exp-step-list">
                            <div class="exp-step">
                                <strong>【ステップ1】代入する</strong><br>
                                ①を②の \\(y\\) に代入します。<br>
                                <div class="exp-formula">\\(${c}x ${d >= 0 ? '+' : ''} ${d} (${a}x ${b >= 0 ? '+' : ''} ${b}) = ${e}\\)</div>
                            </div>
                            <div class="exp-step">
                                <strong>【ステップ2】マイナスの分配法則に注意して解く</strong><br>
                                カッコを外します。\\(${d} \\times (${a}x)\\) や \\(${d} \\times (${b})\\) の符号変化に注目しましょう。<br>
                                <div class="exp-formula">\\(${c}x ${d * a >= 0 ? '+' : ''} ${d * a}x ${d * b >= 0 ? '+' : ''} ${d * b} = ${e}\\)</div>
                                <div class="exp-formula">\\(${c + d * a}x = ${e - d * b}\\)</div>
                                <div class="exp-formula">\\(x = ${latexX}\\)</div>
                            </div>
                            <div class="exp-step">
                                <strong>【ステップ3】\\(y\\) を求める</strong><br>
                                \\(x = ${latexX}\\) を①に代入します。<br>
                                <div class="exp-formula">\\(y = ${a} \\times (${latexX}) ${b >= 0 ? '+' : ''} ${b} = ${latexY}\\)</div>
                                したがって、求める解は <strong>\\(x = ${latexX}, y = ${latexY}\\)</strong> です。
                            </div>
                        </div>
                    `
                };
            }
        },
        {
            // パターン8: x = -ay + b (負の係数) を代入
            name: 'x = -ay + b 型',
            generate: function() {
                const xVal = getRandomInt(-3, 3, [0]);
                const yVal = getRandomInt(-3, 3, [0]);
                
                const a = getRandomInt(-3, -1); // 負の係数
                const b = xVal - a * yVal; // bを逆算
                
                const d = getRandomInt(-3, 3, [0]);
                let c;
                do {
                    c = getRandomInt(-2, 2, [0]);
                } while (c * a + d === 0);
                
                const e = c * xVal + d * yVal;
                
                const eq1Str = `x = ${formatTerm(a, 'y', true)}${b >= 0 ? '+' : ''}${b}`;
                const eq2Str = `${formatTerm(c, 'x', true)}${formatTerm(d, 'y')} = ${e}`;
                
                const latexX = formatFraction(xVal, 1);
                const latexY = formatFraction(yVal, 1);
                
                return {
                    id: `basic_8_${a}_${b}_${c}_${d}_${e}`,
                    eq1: eq1Str,
                    eq2: eq2Str,
                    correctX: latexX,
                    correctY: latexY,
                    hints: [
                        `①の式 \\(x = ${eq1Str}\\) を②の式の \\(x\\) に代入してみよう。`,
                        `代入して得られる式 \\(${c} (${a}y ${b >= 0 ? '+' : ''} ${b}) ${d >= 0 ? '+' : ''} ${formatTerm(d, 'y', true)} = ${e}\\) のカッコを丁寧に展開して \\(y\\) を解こう。`,
                        `⚠️ 注意：次のヒントは「答え」だよ！次を見ると不正解になっちゃうから気をつけてね！`,
                        `答えは \\(x = ${latexX}, y = ${latexY}\\) です。`
                    ],
                    explanation: `
                        <div class="exp-step-list">
                            <div class="exp-step">
                                <strong>【ステップ1】代入する</strong><br>
                                ①を②の \\(x\\) に代入します。<br>
                                <div class="exp-formula">\\(${c} (${a}y ${b >= 0 ? '+' : ''} ${b}) ${d >= 0 ? '+' : ''} ${formatTerm(d, 'y', true)} = ${e}\\)</div>
                            </div>
                            <div class="exp-step">
                                <strong>【ステップ2】カッコを展開して \\(y\\) を求める</strong><br>
                                <div class="exp-formula">\\(${c * a}y ${c * b >= 0 ? '+' : ''} ${c * b} ${d >= 0 ? '+' : ''} ${formatTerm(d, 'y', true)} = ${e}\\)</div>
                                <div class="exp-formula">\\(${c * a + d}y = ${e - c * b}\\)</div>
                                <div class="exp-formula">\\(y = ${latexY}\\)</div>
                            </div>
                            <div class="exp-step">
                                <strong>【ステップ3】\\(x\\) を求める</strong><br>
                                \\(y = ${latexY}\\) を①に代入して計算します。<br>
                                <div class="exp-formula">\\(x = ${a} \\times (${latexY}) ${b >= 0 ? '+' : ''} ${b} = ${latexX}\\)</div>
                                したがって、求める解は <strong>\\(x = ${latexX}, y = ${latexY}\\)</strong> です。
                            </div>
                        </div>
                    `
                };
            }
        }
    ];

    // 【応用コース用テンプレート】 (両方 y = ... 型、式変形が必要な型、丸ごと代入型など)
    const advancedTemplates = [
        {
            // パターン1: 両方 y = ... 型 (等置法)
            name: '両方 y = 型',
            generate: function() {
                const xVal = getRandomInt(-4, 4, [0]);
                const a = getRandomInt(-3, 3, [0]);
                let c;
                do {
                    c = getRandomInt(-3, 3, [0, a]); // 傾きが異なるようにする
                } while (c === a);
                
                const yVal = getRandomInt(-4, 4);
                const b = yVal - a * xVal; // bを逆算
                const d = yVal - c * xVal; // dを逆算
                
                const eq1Str = `y = ${formatTerm(a, 'x', true)}${b >= 0 ? '+' : ''}${b}`;
                const eq2Str = `y = ${formatTerm(c, 'x', true)}${d >= 0 ? '+' : ''}${d}`;
                
                const latexX = formatFraction(xVal, 1);
                const latexY = formatFraction(yVal, 1);
                
                return {
                    id: `adv_1_${a}_${b}_${c}_${d}`,
                    eq1: eq1Str,
                    eq2: eq2Str,
                    correctX: latexX,
                    correctY: latexY,
                    hints: [
                        `①も②もどちらも \\(y = \\dots\\) の形になっているね。これは「①の式の \\(y\\)」のところに「②の式の右辺」をそのまま代入できるよ。`,
                        `代入すると、\\(${a}x ${b >= 0 ? '+' : ''} ${b} = ${c}x ${d >= 0 ? '+' : ''} ${d}\\) という式になるよ。\\(x\\) の項を左辺に、定数を右辺に集めて解こう。`,
                        `⚠️ 注意：次のヒントは「答え」だよ！次を見ると不正解になっちゃうから気をつけてね！`,
                        `答えは \\(x = ${latexX}, y = ${latexY}\\) です。`
                    ],
                    explanation: `
                        <div class="exp-step-list">
                            <div class="exp-step">
                                <strong>【ステップ1】両辺をイコールで結ぶ (代入)</strong><br>
                                ①の \\(y\\) に②の右辺 \\(${c}x ${d >= 0 ? '+' : ''} ${d}\\) を代入します。<br>
                                <div class="exp-formula">\\(${a}x ${b >= 0 ? '+' : ''} ${b} = ${c}x ${d >= 0 ? '+' : ''} ${d}\\)</div>
                            </div>
                            <div class="exp-step">
                                <strong>【ステップ2】\\(x\\) を求める</strong><br>
                                \\(x\\) の項を左辺に、定数を右辺に移項します。<br>
                                <div class="exp-formula">\\(${a}x ${-c >= 0 ? '+' : ''} ${-c}x = ${d} - (${b})\\)</div>
                                <div class="exp-formula">\\(${a - c}x = ${d - b}\\)</div>
                                <div class="exp-formula">\\(x = ${latexX}\\)</div>
                            </div>
                            <div class="exp-step">
                                <strong>【ステップ3】\\(y\\) を求める</strong><br>
                                \\(x = ${latexX}\\) を①の式に代入して \\(y\\) を求めます。<br>
                                <div class="exp-formula">\\(y = ${a} \\times (${latexX}) ${b >= 0 ? '+' : ''} ${b} = ${latexY}\\)</div>
                                したがって、求める解は <strong>\\(x = ${latexX}, y = ${latexY}\\)</strong> です。
                            </div>
                        </div>
                    `
                };
            }
        },
        {
            // パターン2: 両方 x = ... 型 (等置法)
            name: '両方 x = 型',
            generate: function() {
                const yVal = getRandomInt(-4, 4, [0]);
                const a = getRandomInt(-3, 3, [0]);
                let c;
                do {
                    c = getRandomInt(-3, 3, [0, a]);
                } while (c === a);
                
                const xVal = getRandomInt(-4, 4);
                const b = xVal - a * yVal; // bを逆算
                const d = xVal - c * yVal; // dを逆算
                
                const eq1Str = `x = ${formatTerm(a, 'y', true)}${b >= 0 ? '+' : ''}${b}`;
                const eq2Str = `x = ${formatTerm(c, 'y', true)}${d >= 0 ? '+' : ''}${d}`;
                
                const latexX = formatFraction(xVal, 1);
                const latexY = formatFraction(yVal, 1);
                
                return {
                    id: `adv_2_${a}_${b}_${c}_${d}`,
                    eq1: eq1Str,
                    eq2: eq2Str,
                    correctX: latexX,
                    correctY: latexY,
                    hints: [
                        `①も②もどちらも \\(x = \\dots\\) の形になっているね。①の式の \\(x\\) に、②の式の右辺を代入してみよう。`,
                        `代入すると、\\(${a}y ${b >= 0 ? '+' : ''} ${b} = ${c}y ${d >= 0 ? '+' : ''} ${d}\\) という \\(y\\) の方程式になるよ。移行して整理しよう。`,
                        `⚠️ 注意：次のヒントは「答え」だよ！次を見ると不正解になっちゃうから気をつけてね！`,
                        `答えは \\(x = ${latexX}, y = ${latexY}\\) です。`
                    ],
                    explanation: `
                        <div class="exp-step-list">
                            <div class="exp-step">
                                <strong>【ステップ1】両辺をイコールで結ぶ (代入)</strong><br>
                                ①の \\(x\\) に②の右辺 \\(${c}y ${d >= 0 ? '+' : ''} ${d}\\) を代入します。<br>
                                <div class="exp-formula">\\(${a}y ${b >= 0 ? '+' : ''} ${b} = ${c}y ${d >= 0 ? '+' : ''} ${d}\\)</div>
                            </div>
                            <div class="exp-step">
                                <strong>【ステップ2】\\(y\\) を求める</strong><br>
                                \\(y\\) の項を左辺に、定数を右辺に移項します。<br>
                                <div class="exp-formula">\\(${a}y ${-c >= 0 ? '+' : ''} ${-c}y = ${d} - (${b})\\)</div>
                                <div class="exp-formula">\\(${a - c}y = ${d - b}\\)</div>
                                <div class="exp-formula">\\(y = ${latexY}\\)</div>
                            </div>
                            <div class="exp-step">
                                <strong>【ステップ3】\\(x\\) を求める</strong><br>
                                \\(y = ${latexY}\\) を①の式に代入して \\(x\\) を求めます。<br>
                                <div class="exp-formula">\\(x = ${a} \\times (${latexY}) ${b >= 0 ? '+' : ''} ${b} = ${latexX}\\)</div>
                                したがって、求める解は <strong>\\(x = ${latexX}, y = ${latexY}\\)</strong> です。
                            </div>
                        </div>
                    `
                };
            }
        },
        {
            // パターン3: 一方の式が ax - y = b (変形が必要)
            name: '変形が必要な型 (yの係数が-1)',
            generate: function() {
                const xVal = getRandomInt(-3, 3, [0]);
                const yVal = getRandomInt(-3, 3, [0]);
                
                const a = getRandomInt(2, 4);
                const b = a * xVal - yVal; // ax - y = b より逆算
                
                const c = getRandomInt(1, 3);
                const d = getRandomInt(2, 4);
                const e = c * xVal + d * yVal; // cx + dy = e
                
                const eq1Str = `${formatTerm(a, 'x', true)} - y = ${b}`;
                const eq2Str = `${formatTerm(c, 'x', true)}${formatTerm(d, 'y')} = ${e}`;
                
                const latexX = formatFraction(xVal, 1);
                const latexY = formatFraction(yVal, 1);
                
                return {
                    id: `adv_3_${a}_${b}_${c}_${d}_${e}`,
                    eq1: eq1Str,
                    eq2: eq2Str,
                    correctX: latexX,
                    correctY: latexY,
                    hints: [
                        `そのままでは代入しづらいね。①の式を変形して、\\(y = \\dots\\) の形を作ってみよう。\\(y\\) を右辺に、\\(${b}\\) を左辺に移項すると簡単だよ。`,
                        `①を変形すると \\(y = ${a}x - ${b}\\) （または \\(y = ${a}x + (${-b})\\)）になるね。これを②の \\(y\\) にカッコをつけて代入しよう。`,
                        `⚠️ 注意：次のヒントは「答え」だよ！次を見ると不正解になっちゃうから気をつけてね！`,
                        `答えは \\(x = ${latexX}, y = ${latexY}\\) です。`
                    ],
                    explanation: `
                        <div class="exp-step-list">
                            <div class="exp-step">
                                <strong>【ステップ1】式を変形する</strong><br>
                                ①の式 \\(${eq1Str}\\) を、代入しやすいように \\(y\\) について解きます。<br>
                                \\(y\\) を右に、定数を左に移項すると、<br>
                                <div class="exp-formula">\\(y = ${a}x ${-b >= 0 ? '+' : ''} ${-b}\\) 　…①'</div>
                            </div>
                            <div class="exp-step">
                                <strong>【ステップ2】代入して \\(x\\) を求める</strong><br>
                                ①'の式を②の式の \\(y\\) に代入します。<br>
                                <div class="exp-formula">\\(${c}x ${d >= 0 ? '+' : ''} ${d} (${a}x ${-b >= 0 ? '+' : ''} ${-b}) = ${e}\\)</div>
                                カッコを外して \\(x\\) について整理します。<br>
                                <div class="exp-formula">\\(${c}x ${d * a >= 0 ? '+' : ''} ${d * a}x ${d * -b >= 0 ? '+' : ''} ${d * -b} = ${e}\\)</div>
                                <div class="exp-formula">\\(${c + d * a}x = ${e - d * -b}\\)</div>
                                <div class="exp-formula">\\(x = ${latexX}\\)</div>
                            </div>
                            <div class="exp-step">
                                <strong>【ステップ3】\\(y\\) を求める</strong><br>
                                \\(x = ${latexX}\\) を①'の式に代入します。<br>
                                <div class="exp-formula">\\(y = ${a} \\times (${latexX}) ${-b >= 0 ? '+' : ''} ${-b} = ${latexY}\\)</div>
                                したがって、求める解は <strong>\\(x = ${latexX}, y = ${latexY}\\)</strong> です。
                            </div>
                        </div>
                    `
                };
            }
        },
        {
            // パターン4: 一方の式が x - ay = b (変形が必要)
            name: '変形が必要な型 (xの係数が1)',
            generate: function() {
                const xVal = getRandomInt(-3, 3, [0]);
                const yVal = getRandomInt(-3, 3, [0]);
                
                const a = getRandomInt(2, 4);
                const b = xVal - a * yVal; // x - ay = b より逆算
                
                const c = getRandomInt(2, 4);
                const d = getRandomInt(-3, 3, [0]);
                const e = c * xVal + d * yVal;
                
                const eq1Str = `x ${-a >= 0 ? '+' : ''}${formatTerm(-a, 'y', false)} = ${b}`;
                const eq2Str = `${formatTerm(c, 'x', true)}${formatTerm(d, 'y')} = ${e}`;
                
                const latexX = formatFraction(xVal, 1);
                const latexY = formatFraction(yVal, 1);
                
                return {
                    id: `adv_4_${a}_${b}_${c}_${d}_${e}`,
                    eq1: eq1Str,
                    eq2: eq2Str,
                    correctX: latexX,
                    correctY: latexY,
                    hints: [
                        `①の式を変形して \\(x = \\dots\\) の形を作ろう。左辺の \\(${formatTerm(-a, 'y', false)}\\) を右辺に移項すれば完成するよ。`,
                        `①を変形すると \\(x = ${a}y ${b >= 0 ? '+' : ''} ${b}\\) になるね。これを②の \\(x\\) に代入してみよう。`,
                        `⚠️ 注意：次のヒントは「答え」だよ！次を見ると不正解になっちゃうから気をつけてね！`,
                        `答えは \\(x = ${latexX}, y = ${latexY}\\) です。`
                    ],
                    explanation: `
                        <div class="exp-step-list">
                            <div class="exp-step">
                                <strong>【ステップ1】式を変形する</strong><br>
                                ①の式 \\(x ${-a >= 0 ? '+' : ''}${formatTerm(-a, 'y', false)} = ${b}\\) を変形します。<br>
                                \\(y\\) の項を右辺に移項すると、<br>
                                <div class="exp-formula">\\(x = ${a}y ${b >= 0 ? '+' : ''} ${b}\\) 　…①'</div>
                            </div>
                            <div class="exp-step">
                                <strong>【ステップ2】代入して \\(y\\) を求める</strong><br>
                                ①'の式を②の式 \\(${eq2Str}\\) の \\(x\\) に代入します。<br>
                                <div class="exp-formula">\\(${c} (${a}y ${b >= 0 ? '+' : ''} ${b}) ${d >= 0 ? '+' : ''} ${formatTerm(d, 'y', true)} = ${e}\\)</div>
                                展開して整理します。<br>
                                <div class="exp-formula">\\(${c * a}y ${c * b >= 0 ? '+' : ''} ${c * b} ${d >= 0 ? '+' : ''} ${formatTerm(d, 'y', true)} = ${e}\\)</div>
                                <div class="exp-formula">\\(${c * a + d}y = ${e - c * b}\\)</div>
                                <div class="exp-formula">\\(y = ${latexY}\\)</div>
                            </div>
                            <div class="exp-step">
                                <strong>【ステップ3】\\(x\\) を求める</strong><br>
                                \\(y = ${latexY}\\) を①'の式に代入します。<br>
                                <div class="exp-formula">\\(x = ${a} \\times (${latexY}) ${b >= 0 ? '+' : ''} ${b} = ${latexX}\\)</div>
                                したがって、求める解は <strong>\\(x = ${latexX}, y = ${latexY}\\)</strong> です。
                            </div>
                        </div>
                    `
                };
            }
        },
        {
            // パターン5: カッコを含む式
            name: 'カッコを含む式',
            generate: function() {
                const xVal = getRandomInt(-3, 3, [0]);
                const yVal = getRandomInt(-3, 3, [0]);
                
                const a = getRandomInt(2, 3);
                const b = yVal - a * xVal; // y = ax + b より逆算
                
                // カッコを含む第2式: c(x - f) + dy = e
                const c = getRandomInt(2, 4);
                const f = getRandomInt(1, 3) * getRandomElement([-1, 1]);
                const d = getRandomInt(-2, 2, [0]);
                const e = c * (xVal - f) + d * yVal; // eを逆算
                
                const eq1Str = `y = ${formatTerm(a, 'x', true)}${b >= 0 ? '+' : ''}${b}`;
                const eq2Str = `${c}(x ${-f >= 0 ? '+' : ''} ${-f}) ${d >= 0 ? '+' : ''} ${formatTerm(d, 'y', true)} = ${e}`;
                
                const latexX = formatFraction(xVal, 1);
                const latexY = formatFraction(yVal, 1);
                
                return {
                    id: `adv_5_${a}_${b}_${c}_${f}_${d}_${e}`,
                    eq1: eq1Str,
                    eq2: eq2Str,
                    correctX: latexX,
                    correctY: latexY,
                    hints: [
                        `①の式がすでに \\(y = ${a}x ${b >= 0 ? '+' : ''} ${b}\\) になっているね。②のカッコがついた式の \\(y\\) の部分にそのまま代入してみよう。`,
                        `代入すると、\\(${c}(x ${-f >= 0 ? '+' : ''} ${-f}) ${d >= 0 ? '+' : ''} ${d}(${a}x ${b >= 0 ? '+' : ''} ${b}) = ${e}\\) になるよ。カッコが2箇所あるから、それぞれ丁寧に展開しよう。`,
                        `⚠️ 注意：次のヒントは「答え」だよ！次を見ると不正解になっちゃうから気をつけてね！`,
                        `答えは \\(x = ${latexX}, y = ${latexY}\\) です。`
                    ],
                    explanation: `
                        <div class="exp-step-list">
                            <div class="exp-step">
                                <strong>【ステップ1】代入する</strong><br>
                                ①を②の \\(y\\) にカッコ付きで代入します。<br>
                                <div class="exp-formula">\\(${c}(x ${-f >= 0 ? '+' : ''} ${-f}) ${d >= 0 ? '+' : ''} ${d}(${a}x ${b >= 0 ? '+' : ''} ${b}) = ${e}\\)</div>
                            </div>
                            <div class="exp-step">
                                <strong>【ステップ2】カッコを2つとも展開して \\(x\\) を解く</strong><br>
                                それぞれ分配法則でカッコを外します。<br>
                                <div class="exp-formula">\\((${c}x ${c * -f >= 0 ? '+' : ''} ${c * -f}) ${d * a >= 0 ? '+' : ''} ${d * a}x ${d * b >= 0 ? '+' : ''} ${d * b} = ${e}\\)</div>
                                同類項を整理します。<br>
                                <div class="exp-formula">\\(${c + d * a}x ${c * -f + d * b >= 0 ? '+' : ''} ${c * -f + d * b} = ${e}\\)</div>
                                定数を移項して解きます。<br>
                                <div class="exp-formula">\\(${c + d * a}x = ${e - (c * -f + d * b)}\\)</div>
                                <div class="exp-formula">\\(x = ${latexX}\\)</div>
                            </div>
                            <div class="exp-step">
                                <strong>【ステップ3】\\(y\\) を求める</strong><br>
                                \\(x = ${latexX}\\) を①に代入します。<br>
                                <div class="exp-formula">\\(y = ${a} \\times (${latexX}) ${b >= 0 ? '+' : ''} ${b} = ${latexY}\\)</div>
                                したがって、求める解は <strong>\\(x = ${latexX}, y = ${latexY}\\)</strong> です。
                            </div>
                        </div>
                    `
                };
            }
        },
        {
            // パターン6: ax = by + c (丸ごと代入型・高度)
            // 例: 2y = x - 8 と 3x - 2y = 12 で 2y を丸ごと代入！
            name: '丸ごと代入型',
            generate: function() {
                const xVal = getRandomInt(-3, 6, [0]);
                const a = getRandomInt(2, 3); // 2y または 3y
                const yVal = getRandomInt(-3, 3, [0]);
                
                // a * yVal = xVal - b  ->  ay = x - b より b = xVal - a * yVal
                const b = xVal - a * yVal; 
                
                // もう一方の式 cx - ay = d  -> ここで ay を丸ごと代入できる！
                const c = getRandomInt(2, 4);
                const d = c * xVal - a * yVal; // dを逆算
                
                const eq1Str = `${a}y = x ${-b >= 0 ? '+' : ''} ${-b}`;
                const eq2Str = `${formatTerm(c, 'x', true)} - ${a}y = ${d}`;
                
                const latexX = formatFraction(xVal, 1);
                const latexY = formatFraction(yVal, 1);
                
                return {
                    id: `adv_6_${a}_${b}_${c}_${d}`,
                    eq1: eq1Str,
                    eq2: eq2Str,
                    correctX: latexX,
                    correctY: latexY,
                    hints: [
                        `①の左辺には \\(${a}y\\) があり、②の式の中にも \\(${a}y\\) が入っているね！これは、②の式の \\(${a}y\\) に①の右辺 \\(x ${-b >= 0 ? '+' : ''} ${-b}\\) を「丸ごと」カッコ付きで代入すると簡単だよ。`,
                        `代入すると、\\(${c}x - (x ${-b >= 0 ? '+' : ''} ${-b}) = ${d}\\) になるよ。マイナスのカッコの外し方に十分注意して \\(x\\) を求めよう。`,
                        `⚠️ 注意：次のヒントは「答え」だよ！次を見ると不正解になっちゃうから気をつけてね！`,
                        `答えは \\(x = ${latexX}, y = ${latexY}\\) です。`
                    ],
                    explanation: `
                        <div class="exp-step-list">
                            <div class="exp-step">
                                <strong>【ステップ1】同じ項を丸ごと代入する</strong><br>
                                ①の式 \\(${eq1Str}\\) の右辺を、②の式 \\(${eq2Str}\\) の \\(${a}y\\) の部分に丸ごと代入します。<br>
                                <div class="exp-formula">\\(${c}x - (x ${-b >= 0 ? '+' : ''} ${-b}) = ${d}\\)</div>
                            </div>
                            <div class="exp-step">
                                <strong>【ステップ2】マイナスのカッコを展開して \\(x\\) を求める</strong><br>
                                カッコの前のマイナスを分配し、カッコを外します。<br>
                                <div class="exp-formula">\\(${c}x - x ${b >= 0 ? '-' : '+'} ${Math.abs(-b)} = ${d}\\)</div>
                                <div class="exp-formula">\\(${c - 1}x ${b >= 0 ? '-' : '+'} ${Math.abs(-b)} = ${d}\\)</div>
                                <div class="exp-formula">\\(${c - 1}x = ${d} ${b >= 0 ? '+' : '-'} ${Math.abs(-b)}\\)</div>
                                <div class="exp-formula">\\(x = ${latexX}\\)</div>
                            </div>
                            <div class="exp-step">
                                <strong>【ステップ3】\\(y\\) を求める</strong><br>
                                \\(x = ${latexX}\\) を①の式 \\(${eq1Str}\\) に代入します。<br>
                                <div class="exp-formula">\\(${a}y = ${latexX} ${-b >= 0 ? '+' : ''} ${-b}\\)</div>
                                <div class="exp-formula">\\(${a}y = ${a * yVal}\\)</div>
                                両辺を \\(${a}\\) で割ると、<br>
                                <div class="exp-formula">\\(y = ${latexY}\\)</div>
                                したがって、求める解は <strong>\\(x = ${latexX}, y = ${latexY}\\)</strong> です。
                            </div>
                        </div>
                    `
                };
            }
        },
        {
            // パターン7: 一方の式が ax + by = c (変形すると少し複雑・整数解)
            name: '変形が必要な型 (係数あり)',
            generate: function() {
                // 代入しやすいように、xの係数が 1 になるように調整した式を用意
                const xVal = getRandomInt(-3, 3, [0]);
                const yVal = getRandomInt(-3, 3, [0]);
                
                const a = 1;
                const b = getRandomInt(2, 3) * getRandomElement([-1, 1]);
                const c = xVal + b * yVal; // x + by = c  ->  x = -by + c
                
                // 第2式: dx + ey = f
                const d = getRandomInt(2, 4);
                let e;
                do {
                    e = getRandomInt(-3, 3, [0]);
                } while (d * -b + e === 0);
                
                const f = d * xVal + e * yVal; // fを逆算
                
                // 画面表示時に順序を入れ替えて、代入しやすい x + by = c を第2式にすることもある
                const eq1Str = `${formatTerm(d, 'x', true)}${formatTerm(e, 'y')} = ${f}`;
                const eq2Str = `x${formatTerm(b, 'y')} = ${c}`;
                
                const latexX = formatFraction(xVal, 1);
                const latexY = formatFraction(yVal, 1);
                
                return {
                    id: `adv_7_${b}_${c}_${d}_${e}_${f}`,
                    eq1: eq1Str,
                    eq2: eq2Str,
                    correctX: latexX,
                    correctY: latexY,
                    hints: [
                        `今回は②の式 \\(x ${b >= 0 ? '+' : ''} ${formatTerm(b, 'y', true)} = ${c}\\) が変形しやすそうだね。これを \\(x = \\dots\\) の形に変形してみよう。`,
                        `②を変形すると \\(x = ${-b}y ${c >= 0 ? '+' : ''} ${c}\\) になるよ。これを①の式の \\(x\\) に代入してみよう。`,
                        `⚠️ 注意：次のヒントは「答え」だよ！次を見ると不正解になっちゃうから気をつけてね！`,
                        `答えは \\(x = ${latexX}, y = ${latexY}\\) です。`
                    ],
                    explanation: `
                        <div class="exp-step-list">
                            <div class="exp-step">
                                <strong>【ステップ1】解きやすい式を変形する</strong><br>
                                ②の式 \\(x${formatTerm(b, 'y')} = ${c}\\) を \\(x\\) について解きます。<br>
                                \\(y\\) の項を右辺に移項すると、<br>
                                <div class="exp-formula">\\(x = ${-b}y ${c >= 0 ? '+' : ''} ${c}\\) 　…②'</div>
                            </div>
                            <div class="exp-step">
                                <strong>【ステップ2】代入して \\(y\\) を解く</strong><br>
                                ②'を①の式 \\(${eq1Str}\\) の \\(x\\) に代入します。<br>
                                <div class="exp-formula">\\(${d} (${-b}y ${c >= 0 ? '+' : ''} ${c}) ${e >= 0 ? '+' : ''} ${formatTerm(e, 'y', true)} = ${f}\\)</div>
                                カッコを外して整理します。<br>
                                <div class="exp-formula">\\(${d * -b}y ${d * c >= 0 ? '+' : ''} ${d * c} ${e >= 0 ? '+' : ''} ${formatTerm(e, 'y', true)} = ${f}\\)</div>
                                <div class="exp-formula">\\(${d * -b + e}y = ${f - d * c}\\)</div>
                                <div class="exp-formula">\\(y = ${latexY}\\)</div>
                            </div>
                            <div class="exp-step">
                                <strong>【ステップ3】\\(x\\) を求める</strong><br>
                                \\(y = ${latexY}\\) を②'の式に代入します。<br>
                                <div class="exp-formula">\\(x = ${-b} \\times (${latexY}) ${c >= 0 ? '+' : ''} ${c} = ${latexX}\\)</div>
                                したがって、求める解は <strong>\\(x = ${latexX}, y = ${latexY}\\)</strong> です。
                            </div>
                        </div>
                    `
                };
            }
        },
        {
            // パターン8: 少し係数が大きく、複雑な代入ステップ
            name: '複雑な代入ステップ型',
            generate: function() {
                const xVal = getRandomInt(-2, 3, [0]);
                const yVal = getRandomInt(-3, 2, [0]);
                
                const a = getRandomInt(2, 3) * getRandomElement([-1, 1]);
                const b = yVal - a * xVal; // y = ax + b
                
                const c = getRandomInt(3, 5);
                let d;
                do {
                    d = getRandomInt(2, 4) * getRandomElement([-1, 1]);
                } while (c + d * a === 0);
                
                const e = c * xVal + d * yVal; // 係数を少し大きめに
                
                const eq1Str = `y = ${formatTerm(a, 'x', true)}${b >= 0 ? '+' : ''}${b}`;
                const eq2Str = `${formatTerm(c, 'x', true)}${formatTerm(d, 'y')} = ${e}`;
                
                const latexX = formatFraction(xVal, 1);
                const latexY = formatFraction(yVal, 1);
                
                return {
                    id: `adv_8_${a}_${b}_${c}_${d}_${e}`,
                    eq1: eq1Str,
                    eq2: eq2Str,
                    correctX: latexX,
                    correctY: latexY,
                    hints: [
                        `①の式がすでに \\(y = ${a}x ${b >= 0 ? '+' : ''} ${b}\\) になっているね。これを②の式の \\(y\\) にカッコ付きで代入しよう。`,
                        `代入すると、\\(${c}x ${d >= 0 ? '+' : ''} ${d} (${a}x ${b >= 0 ? '+' : ''} ${b}) = ${e}\\) になるよ。係数が少し大きいけれど、符号のミスがないよう慎重に展開してね。`,
                        `⚠️ 注意：次のヒントは「答え」だよ！次を見ると不正解になっちゃうから気をつけてね！`,
                        `答えは \\(x = ${latexX}, y = ${latexY}\\) です。`
                    ],
                    explanation: `
                        <div class="exp-step-list">
                            <div class="exp-step">
                                <strong>【ステップ1】代入する</strong><br>
                                ①の式を②の式の \\(y\\) に代入します。<br>
                                <div class="exp-formula">\\(${c}x ${d >= 0 ? '+' : ''} ${d} (${a}x ${b >= 0 ? '+' : ''} ${b}) = ${e}\\)</div>
                            </div>
                            <div class="exp-step">
                                <strong>【ステップ2】カッコを外して \\(x\\) を解く</strong><br>
                                <div class="exp-formula">\\(${c}x ${d * a >= 0 ? '+' : ''} ${d * a}x ${d * b >= 0 ? '+' : ''} ${d * b} = ${e}\\)</div>
                                同類項を整理します。<br>
                                <div class="exp-formula">\\(${c + d * a}x = ${e - d * b}\\)</div>
                                <div class="exp-formula">\\(x = ${latexX}\\)</div>
                            </div>
                            <div class="exp-step">
                                <strong>【ステップ3】\\(y\\) を求める</strong><br>
                                \\(x = ${latexX}\\) を①に代入します。<br>
                                <div class="exp-formula">\\(y = ${a} \\times (${latexX}) ${b >= 0 ? '+' : ''} ${b} = ${latexY}\\)</div>
                                したがって、求める解は <strong>\\(x = ${latexX}, y = ${latexY}\\)</strong> です。
                            </div>
                        </div>
                    `
                };
            }
        }
    ];

    // ==================== グローバルオブジェクトの公開 ====================
    window.QuestionGenerator = {
        /**
         * コースと問題数を指定して、ランダムに問題を生成します。
         * テンプレートが重複しないようにシャッフルして抽出します。
         * 
         * @param {string} course 'basic'（基本コース）または 'advanced'（応用コース）
         * @param {number} count 生成する問題数（デフォルト 5問）
         * @returns {Array} 生成された問題オブジェクトの配列
         */
        generateQuestions: function(course = 'basic', count = 5) {
            const templates = (course === 'advanced') ? advancedTemplates : basicTemplates;
            
            // テンプレートをコピーしてシャッフル
            const shuffled = [...templates].sort(() => Math.random() - 0.5);
            
            // 必要な問題数分だけ抽出し、値を動的生成
            const selected = shuffled.slice(0, Math.min(count, templates.length));
            return selected.map(template => template.generate());
        }
    };
})();
