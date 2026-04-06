javascript:(function(){
    const dlg_name = '__Calculator__';

    if (document.getElementById(dlg_name)) return;
    let lastAnswer = '';

    const dlg = document.createElement('dialog');
    dlg.open = true;
    dlg.id = dlg_name;
    dlg.style.cssText = `
        all: unset;
        transformOrigin: top left;
        position:fixed;
        top:100px;
        left:100px;
        padding:0;
        border:none;border-radius:
        10px;
        background:#111 !important;
        color:#559 !important;
        font-family:Arial;
        box-shadow:0 10px 30px rgba(0,0,0,.5);
        z-index:10000;
        overflow:hidden;`;

    const baselineRatio = window.devicePixelRatio || 1;

    let currentScale = 1;

    const adjustZoom = () => {
        const currentRatio = window.devicePixelRatio || 1;
        const relativeZoom = currentRatio / baselineRatio;

        currentScale = 1 / relativeZoom;
        dlg.style.transform = `scale(${currentScale})`;
    };

    window.addEventListener('resize', adjustZoom);
    adjustZoom();

    const header = document.createElement('div');
    header.style.cssText = 'padding:10px;background:#222 !important;cursor:move;font-size:22px;font-weight:bold;border-radius:10px 10px 0 0;user-select:none;';

    const title = document.createElement('span');
    title.textContent =  'Calculator';
    header.appendChild(title);

    const close = document.createElement('span');
    close.textContent = '✕';
    close.style.cssText = 'float:right;cursor:pointer;margin-left:10px';
    close.onclick = () => {
        dlg.remove();
    };
    header.appendChild(close);
    dlg.appendChild(header);

    header.onpointerdown = (e) => {
        if (e.target === close) return;

        header.setPointerCapture(e.pointerId);
        e.preventDefault();

        let shiftX = e.clientX - dlg.offsetLeft;
        let shiftY = e.clientY - dlg.offsetTop;

        const onPointerMove = (e) => {

            const newX = e.clientX - shiftX;
            const newY = e.clientY - shiftY;

            dlg.style.left = newX + 'px';
            dlg.style.top = newY + 'px';
        };

        const onPointerUp = () => {
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', onPointerUp);
            document.removeEventListener('pointercancel', onPointerUp);
            header.releasePointerCapture(e.pointerId);
        };

        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
        document.addEventListener('pointercancel', onPointerUp);
    };

    const body = document.createElement('div');
    body.style.cssText = 'padding:20px;font-size:14px;text-align:center;width:280px;';
    dlg.append(body);
    document.body.appendChild(dlg);

    const history = document.createElement('input');
    history.type = 'text';
    history.readOnly = true;
    history.autocomplete = 'off';
    history.spellcheck = false;
    history.style.cssText = `
        width:100% !important;
        height: 18px !important;
        box-sizing:border-box;
        padding:10px !important;
        font-size:12px !important;
        margin-bottom:0px !important;
        text-align:left !important;
        background:#222 !important;
        color:#559 !important;
        border:none !important;
        border-radius:4px !important;
        caret-color:transparent;
        user-select:none;
        cursor:pointer;
    `;
    body.appendChild(history);

    const output = document.createElement('input');
    output.type = 'text';
    output.readOnly = false;
    output.autocomplete = 'off';
    output.spellcheck = false;
    output.style.cssText = `
        width:100% !important;
        height: 40px !important;
        box-sizing:border-box;
        padding:10px !important;
        font-size:18px !important;
        margin-bottom:10px !important;
        text-align:right !important;
        background:#222 !important;
        color:#559 !important;
        border:1px solid #444 !important;
        border-radius:4px !important;
        caret-color:#559 !important;
    `;
    body.appendChild(output);

    history.ondblclick = () => {
        if (history.value) {
            output.value = history.value;
            const pos = output.value.length;
            output.setSelectionRange(pos, pos);
            output.focus();
        }
    };

    const allowedPattern = /^[0-9+\-*/^().√%a-zA-Z]*$/;

    output.addEventListener('beforeinput', (e) => {
        if (e.inputType.startsWith('delete')) return;

        const start = output.selectionStart ?? 0;
        const end = output.selectionEnd ?? 0;

        let insert = e.data;

        if (e.inputType === 'insertFromPaste') {
            insert = (e.clipboardData || window.clipboardData)?.getData('text') || '';
        }

        if (insert == null) {
            const startPos = output.selectionStart;
            const endPos = output.selectionEnd;

            setTimeout(() => {
                if (!allowedPattern.test(output.value)) {
                    output.value = output.value.replace(/[^0-9+\-*/^().]/g, '');

                    if (startPos != null && endPos != null) {
                        const len = output.value.length;
                        const newStart = Math.min(startPos, len);
                        const newEnd = Math.min(endPos, len);
                        output.setSelectionRange(newStart, newEnd);
                    }
                }
            });
            return;
        }

        const nextValue =
            output.value.slice(0, start) +
            insert +
            output.value.slice(end);

        if (!allowedPattern.test(nextValue)) {
            e.preventDefault();
        }
    });

    output.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === '=') {
            e.preventDefault();

            const result = evaluate(output.value);
            output.value = result;

            const pos = output.value.length;
            output.setSelectionRange(pos, pos);
            output.focus();
        }

        if (e.key === 'Escape') {
            if (output.value === '') {
                history.value = '';
                lastAnswer = '';

            }
            output.value = '';
            output.setSelectionRange(0, 0);
        }
    });

    const buttons = [
        ['Clear', '(', ')','⌫'],
        ['√', '^', 'Ans', '%'],
        ['7', '8', '9', '/'],
        ['4', '5', '6', '*'],
        ['1', '2', '3', '-'],
        ['0', '.', '=', '+']
    ];

    keypadHeight = 1000;
    const keypad = document.createElement('div');
        keypad.style.cssText = `
        display: grid;
        grid-template-rows: repeat(${buttons.length}, 40px);
        overflow: hidden;
        max-height: ${keypadHeight}px;
        opacity: 1;
        transition: max-height 0.3s ease, opacity 0.3s ease;
    `;

    buttons.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.style.cssText = `
            display: flex;
            justify-content: center;
        `;
        row.forEach(btn => {
            const button = document.createElement('button');
            button.textContent = btn;
            button.style.cssText = `
                width:50px !important;
                height:30px !important;
                margin:5px !important;
                padding: 0 !important;
                font-size:18px !important;
                border:none !important;
                border-radius:4px !important;
                background:#333 !important;
                color:#7b7bb7 !important;
                cursor:pointer;
                transition:background 0.2s, color 0.2s, transform 0.1s;
                `;

            button.onclick = () => {
                output.focus();

                let start = output.selectionStart ?? output.value.length;
                let end = output.selectionEnd ?? output.value.length;
                let val = output.value;

                const setCursor = (pos) => {
                    output.setSelectionRange(pos, pos);
                };

                switch (btn) {
                    case 'Clear':
                        if (output.value === '') {
                            history.value = '';
                            lastAnswer = '';
                            
                        }
                        output.value = '';
                        output.setSelectionRange(0, 0);
                        break;

                    case '⌫':
                        if (start === end && start > 0) {
                            output.value = val.slice(0, start - 1) + val.slice(end);
                            setCursor(start - 1);
                        } else {
                            output.value = val.slice(0, start) + val.slice(end);
                            setCursor(start);
                        }
                        break;

                    case '=':
                        output.value = evaluate(val);
                        setCursor(output.value.length);
                        break;

                    default:
                        if (
                            val === 'Syntax Error' ||
                            val === 'NaN' ||
                            val === 'Infinity' ||
                            val === '-Infinity' ||
                            val === 'Too Long'
                        ) {
                            output.value = btn;
                            setCursor(1);
                        } else {
                            const newVal = val.slice(0, start) + btn + val.slice(end);
                            output.value = newVal;
                            setCursor(start + btn.length);
                        }
                        break;
                }
            };

            button.onpointerover = () => {
                button.style.setProperty('background', '#444', 'important');
                button.style.setProperty('color', '#9999ff', 'important');
            };

            button.onpointerout = () => {
                button.style.setProperty('background', '#333', 'important');
                button.style.setProperty('color', '#7b7bb7', 'important');
            };

            button.onpointerdown = () => button.style.setProperty('transform', 'scale(0.95)', 'important');

            button.onpointerup = () => button.style.setProperty('transform', 'scale(1)', 'important');

            rowDiv.appendChild(button);
        });
        keypad.appendChild(rowDiv);
    });

    body.appendChild(keypad);
    
    const toggleBar = document.createElement('span');
    toggleBar.style.cssText = 'color:#559 !important; cursor:pointer; text-align:center; font-size:10px; padding:4px; user-select:none;';
    toggleBar.innerText = '▲ HIDE KEYPAD ▲';
    body.appendChild(toggleBar);

    toggleBar.onclick = () => {
        if (keypad.style.maxHeight === '0px') {
            keypad.style.maxHeight = `${keypadHeight}px`;
            keypad.style.opacity = '1';
            toggleBar.innerText = '▲ HIDE KEYPAD ▲';
        } else {
            keypad.style.maxHeight = '0px';
            keypad.style.opacity = '0';
            toggleBar.innerText = '▼ SHOW KEYPAD ▼';
        }
    };
    
    function evaluate(expr) {
        if (!expr.trim()) return '';

        let i = 0;
        if (expr.length > 200) return 'Too Long';
        const s = expr.replace(/\s+/g, '');

        function parseExpression() {
            let value = parseTerm();

            while (i < s.length) {
                const op = s[i];
                if (op !== '+' && op !== '-') break;
                i++;

                const next = parseTerm();
                if (isNaN(next)) return NaN;

                value = op === '+' ? value + next : value - next;
            }

            return value;
        }

        function parseTerm() {
            let value;

            if (i < s.length && s[i] === '-') {
                i++;
                value = -parseTerm();
            } else {
                value = parsePower();
            }

            while (i < s.length) {
                const op = s[i];
                if (op === '*' || op === '/' || op === '%') {
                    i++;
                    const next = parsePower();
                    if (isNaN(next)) return NaN;
                    if (op === '*') value *= next;
                    else if (op === '/') value /= next;
                    else value %= next;
                } else if (startsFactor()) {
                    const next = parsePower();
                    if (isNaN(next)) return NaN;
                    value *= next;
                }  else {
                    break;
                }
            }
            return value;
        }

        function startsFactor() {
            if (i >= s.length) return false;

            const c = s[i];
            return (
                c === '(' ||
                c === '√' ||
                c === '.' ||
                (c >= '0' && c <= '9') ||
                ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z'))
            );
        }

        function parseFactor() {
            if (i < s.length && s[i] === '(') {
                i++;
                const value = parseExpression();
                if (s[i] !== ')') return "Syntax Error";
                i++;
                return value;
            }

            let start = i;
            while (i < s.length && /[0-9.]/.test(s[i])) i++;

            if (i < s.length && s[i].toLowerCase() === 'e') {
                let next = s[i + 1];
                let afterNext = s[i + 2];
                if (/[0-9]/.test(next) || (/[+-]/.test(next) && /[0-9]/.test(afterNext))) {
                    i++;
                    if (/[+-]/.test(s[i])) i++;
                    while (i < s.length && /[0-9]/.test(s[i])) i++;
                }
            }

            if (start === i) return NaN;
            return parseFloat(s.slice(start, i));
        }

        const IDENTIFIERS = {
            pi:  { type: 'const', value: Math.PI },
            e:   { type: 'const', value: Math.E },
            ans: { type: 'const', value: lastAnswer },

            sin: { type: 'func', fn: Math.sin },
            cos: { type: 'func', fn: Math.cos },
            tan: { type: 'func', fn: (x) => {
                const v = Math.tan(x);
                return Math.abs(v) > 1e10 ? Infinity : v;
            }},

            csc: { type: 'func', fn: (x) => {
                const v = 1 / Math.sin(x);
                return Math.abs(v) > 1e10 ? Infinity : v;
            }},
            sec: { type: 'func', fn: (x) => {
                const v = 1 / Math.cos(x);
                return Math.abs(v) > 1e10 ? Infinity : v;
            }},
            cot: { type: 'func', fn: (x) => {
                const v = 1 / Math.tan(x);
                return Math.abs(v) > 1e10 ? Infinity : v;
            }},

            asin: { type: 'func', fn: Math.asin },
            acos: { type: 'func', fn: Math.acos },
            atan: { type: 'func', fn: Math.atan },

            sinh: { type: 'func', fn: Math.sinh },
            cosh: { type: 'func', fn: Math.cosh },
            tanh: { type: 'func', fn: Math.tanh },

            sqrt: { type: 'func', fn: Math.sqrt },
            ln:   { type: 'func', fn: Math.log },
            log:  { type: 'func', fn: Math.log10 },
        };

        const variables = Object.create(null);

        function parseIdentifier() {
            let start = i;
            while (i < s.length && /[a-z]/i.test(s[i])) i++;
            return s.slice(start, i);
        }

        function parsePower() {
            let value = parseBase();

            while (i < s.length && s[i] === '^') {
                i++;
                const exponent = parsePower();
                value = Math.pow(value, exponent);
            }

            return value;
        }

        function parseBase() {
            if (i < s.length && s[i] === '-') {
                i++;
                return -parseBase();
            }

            if (/[0-9.]/.test(s[i])) {
                const n = parseFactor();
                if (s[i] === '√') {
                    i++;
                    const x = parseBase();
                    return Math.pow(x, 1 / n);
                }
                return n;
            }

            if (s[i] === '√') {
                i++;
                const x = parseBase();
                if (x < 0) return NaN;
                return Math.sqrt(x);
            }

            if (/[a-z]/i.test(s[i])) {
                const name = parseIdentifier().toLowerCase();
                const entry = IDENTIFIERS[name];

                if (entry) {
                    if (entry.type === 'const') return entry.value;
                    if (entry.type === 'func') {
                        const arg = parseBase();
                        return entry.fn(arg);
                    }
                }

                return variables[name] ?? NaN;
            }

            return parseFactor();
        }

        const result = parseExpression();

        history.value = expr;
        if (i !== s.length) return 'Syntax Error';
        if (!isFinite(result)) return String(result);
        if (!isNaN(result)) {
            lastAnswer = result;
            if (result !== 0 && (Math.abs(result) < 1e-9 || Math.abs(result) > 1e12)) {
                return result.toPrecision(10); 
            }
            return Number(result.toFixed(10));
        }

        return 'NaN';
    }
})();
