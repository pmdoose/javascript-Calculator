javascript:(function() {
    const dlg_name = '__Calc__';
    if (window[dlg_name]) {
        return;
    }

    /** --- Define styles for repeated elements --- */
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        #__Calc__ {
            color-scheme: dark;
            isolation: isolate;
        }

        .calc-wrapper .calc-btn {
            width:50px !important;
            height:30px !important;
            margin:5px !important;
            padding:0px !important;
            font-size:18px !important;
            border:none !important;
            border-radius:4px !important;
            background-color: #333 !important;
            background-image: none !important;
            color:#7b7bb7 !important;
            cursor:pointer;
            opacity: 1 !important;
            box-shadow: 0 2px 0 rgba(0,0,0,0.25) !important;
            transition:
                transform 60ms ease,
                box-shadow 60ms ease,
                background-color 60ms ease !important;
        }

        .calc-wrapper .calc-btn:active {
            box-shadow: 0 0px 0 rgba(0,0,0,0.25) !important;
            transform: translateY(2px) scale(0.96) !important;
        }
        
        btn-container {
            margin-bottom: 5px !important;
        }

        .calc-wrapper.calc-btn-row {
            display: grid !important;
            grid-template-columns: repeat(4, 50px);
            gap: 5px;
            justify-content: center;
            margin-bottom: 5px !important;
        }

        .calc-wrapper .calc-display {
            width: 100%;
            height: 30px;
            margin-bottom: 1px;
            padding: 5px;
            font-size: 18px !important;
            text-align: right !important;
            border: none !important;
            border-radius: 4px !important;
            background: #222 !important;
            color: #7b7bb7 !important;
        }`;

    document.head.appendChild(styleSheet);

    /* Create Calculator Dialog */
    const dlg = document.createElement('dialog');
    dlg.open = true;
    dlg.id = dlg_name;
    dlg.className = 'calc-wrapper';
    dlg.style.cssText = `
        all: unset;
        transformOrigin: top left;
        position:fixed;
        top:100px;
        left:100px;
        border:none;
        border-radius:10px;
        background: rgb(17, 17, 17) !important;
        color:#559 !important;
        font-family:Arial;
        box-shadow:0 10px 30px rgba(0,0,0,.5);
        z-index:10000;
        overflow:hidden;
    `;
    dlg.setAttribute('data-darkreader-skip', 'true');
    dlg.style.colorScheme = 'light';

    /* Handle Zoom Scaling */
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

    /* Create header */
    const header = document.createElement('div');
    header.style.cssText = `
        padding:10px;
        background:#222 !important;
        cursor:move;
        font-size:22px;
        font-weight:bold;
        border-radius:10px 10px 0 0;
        user-select:none;
    `;

    /* Make Draggable header */
    const title = document.createElement('span');
    title.textContent = 'Calculator';
    header.appendChild(title);

    const close = document.createElement('span');
    close.textContent = '✕';
    close.style.cssText = 'float:right;cursor:pointer;margin-left:10px';
    close.onclick = () => { dlg.remove(); };
    header.appendChild(close);
    dlg.appendChild(header);

    /* Drag Logic */
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

    /* eate Dialog Body */
    const body = document.createElement('div');
    body.style.cssText = 'padding:20px;font-size:14px;text-align:center;width:280px;';
    dlg.append(body);
    document.body.appendChild(dlg);

    /* create display container */
    const displayContainer = document.createElement('div');
    displayContainer.style.cssText = 'display:flex;flex-direction:column;margin-bottom:20px;';
    body.appendChild(displayContainer); 

    /* Create Display Output */
    const output = document.createElement('input');
    output.type = 'text';
    output.className = 'calc-display';
    output.tabIndex = -1;
    output.readOnly = true;
    output.style.height = '23px';
    output.style.caretColor = 'transparent';
    displayContainer.appendChild(output);

    /* Create Input Display */
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'calc-display';
    displayContainer.appendChild(input);

    function  evaluateAndDisplay(){
        try {
            const result = evaluate(input.value);
            output.value = result;
        } catch (err) {
            output.value = 'Error: ' + err.message;
        }
        input.focus();
    }

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            evaluateAndDisplay();
        }
    });

    /* Create scientific buttons */

    function insertAtCursor(input, text) {
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const val = input.value;

        /* Splice the text into the current value */
        input.value = val.substring(0, start) + text + val.substring(end);

        /* Update the cursor position to be right after the inserted text */
        const newPos = start + text.length;
        
        /* Smart placement: if you insert "sin()", put the cursor inside the "()" */
        if (text.endsWith('()')) {
            input.selectionStart = input.selectionEnd = newPos - 1;
        } else {
            input.selectionStart = input.selectionEnd = newPos;
        }

        input.focus();
    }

    let ans = 0; /* Store last answer for Ans button */

    const sciButtons = [[
        { label: 'sin', onClick: () => insertAtCursor(input, 'sin()') },
        { label: 'cos', onClick: () => insertAtCursor(input, 'cos()') },
        { label: 'tan', onClick: () => insertAtCursor(input, 'tan()') },
        { label: 'log', onClick: () => insertAtCursor(input, 'log()') },
        
    ],[
        { label: 'asin', onClick: () => insertAtCursor(input, 'asin()') },
        { label: 'acos', onClick: () => insertAtCursor(input, 'acos()') },
        { label: 'atan', onClick: () => insertAtCursor(input, 'atan()') },
        { label: 'ln', onClick: () => insertAtCursor(input, 'ln()') },
        
    ],[
        { label: 'sinh', onClick: () => insertAtCursor(input, 'sinh()') },
        { label: 'cosh', onClick: () => insertAtCursor(input, 'cosh()') },
        { label: 'tanh', onClick: () => insertAtCursor(input, 'tanh()') },
        { label: '√', onClick: () => insertAtCursor(input, '√') },
        
    ],[
        { label: 'xʸ', onClick: () => insertAtCursor(input, '^') },
        { label: 'e', onClick: () => insertAtCursor(input, 'e') },
        { label: 'π', onClick: () => insertAtCursor(input, 'π') },
        { label: 'exp', onClick: () => insertAtCursor(input, 'exp()') }
    ],[
        { label: 'abs', onClick: () => insertAtCursor(input, 'abs()') },
        { label: '(', onClick: () => insertAtCursor(input, '(') },
        { label: ')', onClick: () => insertAtCursor(input, ')') },
        { label: 'Ans', onClick: () => insertAtCursor(input, 'ans') }
    ]];

    const basicButtons = [[
        { label: 'AC', onClick: () => { input.value = '';  output.value = ''; ans = 0; input.focus()} },
        { label: 'C', onClick: () => { input.value = ''; input.focus()} },
        { label: '%', onClick: () => insertAtCursor(input, '%') },
        { label: '⌫', onClick: () => {
            const start = input.selectionStart;
            const end = input.selectionEnd;

            if (start === end && start > 0) {
                /* No selection, delete character before cursor */
                input.value = input.value.substring(0, start - 1) + input.value.substring(end);
                input.selectionStart = input.selectionEnd = start - 1;
            } else if (start !== end) {
                /* Delete selected text */
                input.value = input.value.substring(0, start) + input.value.substring(end);
                input.selectionStart = input.selectionEnd = start;
            }
            input.focus();
        } }
    ], [
        { label: '7', onClick: () => insertAtCursor(input, '7') },
        { label: '8', onClick: () => insertAtCursor(input, '8') },
        { label: '9', onClick: () => insertAtCursor(input, '9') },
        { label: '/', onClick: () => insertAtCursor(input, '/') }
    ],[
        { label: '4', onClick: () => insertAtCursor(input, '4') },
        { label: '5', onClick: () => insertAtCursor(input, '5') },
        { label: '6', onClick: () => insertAtCursor(input, '6') },
        { label: '*', onClick: () => insertAtCursor(input, '*') }
    ],[
        { label: '1', onClick: () => insertAtCursor(input, '1') },
        { label: '2', onClick: () => insertAtCursor(input, '2') },
        { label: '3', onClick: () => insertAtCursor(input, '3') },
        { label: '-', onClick: () => insertAtCursor(input, '-') }
    ],[
        { label: '.', onClick: () => insertAtCursor(input, '.') },
        { label: '0', onClick: () => insertAtCursor(input, '0') },
        { label: '=', onClick: () => evaluateAndDisplay() },
        { label: '+', onClick: () => insertAtCursor(input, '+') }
    ]];

    function createCollapseButtonContainer(buttons, label = '', hidden = false) {
        const container = document.createElement('div');
        container.className = 'btn-container';
        container.style.cssText = 'overflow:hidden; transition:max-height 0.3s ease, opacity 0.3s ease;';

        const keypadHeight = buttons.length * 40 + 10; /* 40px per row + padding */
        container.style.maxHeight = `${(hidden) ? 0 : keypadHeight}px`;
        container.style.opacity = '1';

        buttons.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'calc-btn-row';

            row.forEach(button => {
                const buttonElement = document.createElement('button');
                buttonElement.className = 'calc-btn';
                buttonElement.textContent = button.label;
                buttonElement.addEventListener('click', button.onClick);
                rowDiv.appendChild(buttonElement);
            });

            container.appendChild(rowDiv);
        });

        const toggleBar = document.createElement('span');
        toggleBar.style.cssText = 'color:#559 !important; cursor:pointer; text-align:center; font-size:10px; padding:4px; user-select:none;';
        label = label.toUpperCase();
        toggleBar.innerText = (hidden) ? `▼ SHOW ${label} KEYPAD ▼` : `▲ HIDE ${label} KEYPAD ▲`;
        body.appendChild(toggleBar);
        toggleBar.onclick = () => {
            if (container.style.maxHeight === '0px') {
                container.style.maxHeight = `${keypadHeight}px`;
                container.style.opacity = '1';
                toggleBar.innerText = `▲ HIDE ${label} KEYPAD ▲`;
            } else {
                container.style.maxHeight = '0px';
                container.style.opacity = '0';
                toggleBar.innerText = `▼ SHOW ${label} KEYPAD ▼`;
            }
        };

        body.appendChild(container);
        return container;
    }

    const sciKeypad = createCollapseButtonContainer(sciButtons, 'Scientific', true);
    const basicKeypad = createCollapseButtonContainer(basicButtons, 'Basic', false);


    /* --- calculator Logic --- */

    /* safety margin for floating point comparisons */
    const EPSILON = 1e-12;

    /* this is here because JavaScript's trig functions can return very small nonzero values instead of exact integers */
    function normalizeTrig(x) {
        const k = Math.round(x);
        if (Math.abs(x - k) < EPSILON) return k; /* catches 0, 1, -1, etc. */
        return x;
    }

    const lookup = {
    /* --- Constants (Arity 0) --- */
        'π':   {type: 'constant', args: 0, assoc: null, exec: () => Math.PI, prec: 0},
        'pi':  {type: 'constant', args: 0, assoc: null, exec: () => Math.PI, prec: 0},
        'e':   {type: 'constant', args: 0, assoc: null, exec: () => Math.E, prec: 0},
        'ans': {type: 'constant', args: 0, assoc: null, exec: () => ans, prec: 0},

    /* --- Basic Operators (Arity 2) --- */
        '+':   {type: 'operator', args: 2, assoc: 'l', exec: (a, b) => a + b, prec: 2 },
        '-':   {type: 'operator', args: 2, assoc: 'l', exec: (a, b) => a - b, prec: 2 },
        '*':   {type: 'operator', args: 2, assoc: 'l', exec: (a, b) => a * b, prec: 3 },
        '/':   {type: 'operator', args: 2, assoc: 'l', exec: (a, b) => a / b, prec: 3 },
        '%':   {type: 'operator', args: 2, assoc: 'l', exec: (a, b) => a % b, prec: 3,},
        '^':   {type: 'operator', args: 2, assoc: 'r', exec: (a, b) => Math.pow(a, b), prec: 6,},

    /* --- Unary Operators (Arity 1) --- */
        '-u':  {type: 'operator', args: 1, assoc: 'r', exec: (x) => -x, prec: 4 },
        '+u':  {type: 'operator', args: 1, assoc: 'r', exec: (x) => +x, prec: 4 },

    /* --- Absolute Value (Arity 1) --- */
        'abs': {type: 'function', args: 1, assoc: null, exec: (x) => Math.abs(x), prec: 10 },

    /* --- Scientific Functions (Arity 1) --- */
        'sin': {type: 'function', args: 1, assoc: null, exec: (x) => normalizeTrig(Math.sin(x)), prec: 10 },
        'cos': {type: 'function', args: 1, assoc: null, exec: (x) => normalizeTrig(Math.cos(x)), prec: 10 },
        'tan': {type: 'function', args: 1, assoc: null, exec: (x) => normalizeTrig(Math.tan(x)), prec: 10 },
    /* --- reciprocal trigonometric functions (Arity 1) --- */
        'csc': {type: 'function', args: 1, assoc: null, exec: (x) => {
                const s = Math.sin(x);
                if (Math.abs(s) < EPSILON) {
                    throw new Error('csc undefined: sin(x) = 0');
                }
                return 1 / s;
            }, prec: 10 },
        'sec': {type: 'function', args: 1, assoc: null, exec: (x) => {
                const c = normalizeTrig(Math.cos(x));
                if (Math.abs(c) < EPSILON) {
                    throw new Error('sec undefined: cos(x) = 0');
                }
                return 1 / c;
            }, prec: 10 },
        'cot': {type: 'function', args: 1, assoc: null, exec: (x) => {
                const t = normalizeTrig(Math.tan(x));
                if (Math.abs(t) < EPSILON) {
                    throw new Error('cot undefined: tan(x) = 0');
                }
                return 1 / t;
            }, prec: 10 },
    /* --- Inverse Trigonometric Functions (Arity 1) --- */
        'asin': {type: 'function', args: 1, assoc: null, exec: (x) => {
                if (x < -1 || x > 1) {
                    throw new Error('asin domain error: input must be in [-1, 1]');
                }
                return normalizeTrig(Math.asin(x));
            }, prec: 10 },
        'acos': {type: 'function', args: 1, assoc: null, exec: (x) => {
                if (x < -1 || x > 1) {
                    throw new Error('acos domain error: input must be in [-1, 1]');
                }
                return normalizeTrig(Math.acos(x));
            }, prec: 10 },
        'atan': {type: 'function', args: 1, assoc: null, exec: (x) => normalizeTrig(Math.atan(x)), prec: 10 },
    /* --- Hyperbolic Functions (Arity 1) --- */
        'sinh': {type: 'function', args: 1, assoc: null, exec: (x) => normalizeTrig(Math.sinh(x)), prec: 10 },
        'cosh': {type: 'function', args: 1, assoc: null, exec: (x) => normalizeTrig(Math.cosh(x)), prec: 10 },
        'tanh': {type: 'function', args: 1, assoc: null, exec: (x) => normalizeTrig(Math.tanh(x)), prec: 10 },

    /* --- Logarithmic and Exponential Functions (Arity 1) --- */
        'log':{type: 'function', args: 1, assoc: null, exec: (x) => {
                if (x <= 0) throw new Error("log domain error");
                return Math.log10(x);
            }, prec: 10 },
        'ln':   {type: 'function', args: 1, assoc: null, exec: (x) => {
                if (x <= 0) throw new Error("ln domain error");
                return Math.log(x); 
            }, prec: 10 },
        'exp':  {type: 'function', args: 1, assoc: null, exec: (x) => Math.exp(x), prec: 10 },

    /* --- Square Root (Arity 1 or 2) --- */
        'sqrt': {type: 'function', args: 1, assoc: null, exec: (x) => {
                if (x < 0) throw new Error("Square root domain error");
                return Math.sqrt(x);
            }, prec: 10 },
        '√':    {type: 'operator', args: 1, assoc: null, exec: (x) => {
                if (x < 0) throw new Error("Square root domain error");
                return Math.sqrt(x);
            }, prec: 4 },
        'y√x':  {type: 'operator', args: 2, assoc: null, exec: (y, x) => {
                if (x < 0 && y % 2 === 0) throw new Error("Square root domain error");
                return Math.pow(x, 1/y);
            }, prec: 4 },
    };

    function toRPN(tokens) {
        const outputQueue = [];
        const opStack = [];

        tokens.forEach(token => {
            const info = lookup[token];

            /* If it's a number, push to output */
            if (!isNaN(token) || (info && info.args === 0)) {
                outputQueue.push(token);
            } 
            
            /* If it's a function (prec 10), push to opStack */
            else if (info && info.prec === 10) {
                opStack.push(token);
            }

            /* If it's an operator (+, -, *, /, ^, etc.) */
            else if (info && info.args > 0) {
                while (opStack.length > 0) {
                    const top = opStack[opStack.length - 1];
                    const topInfo = lookup[top];
                    
                    if (!topInfo || top === '(') break;

                    /* Move operators to output based on Precedence and Associativity */
                    if ((info.assoc === 'l' && info.prec <= topInfo.prec) ||
                        (info.assoc === 'r' && info.prec < topInfo.prec)) {
                        outputQueue.push(opStack.pop());
                    } else {
                        break;
                    }
                }
                opStack.push(token);
            }

            /* Handle Parentheses */
            else if (token === '(') {
                opStack.push(token);
            } 
            else if (token === ')') {
                while (opStack.length > 0 && opStack[opStack.length - 1] !== '(') {
                    outputQueue.push(opStack.pop());
                }
                opStack.pop(); /* Discard the '(' */

                /* If a function was waiting for this paren group, move it to output */
                if (opStack.length > 0) {
                    const top = opStack[opStack.length - 1];
                    if (lookup[top] && lookup[top].prec === 10) {
                        outputQueue.push(opStack.pop());
                    }
                }
            }
        });

        /* Pop remaining operators */
        while (opStack.length > 0) {
            outputQueue.push(opStack.pop());
        }

        return outputQueue;
    }

    function transformTokens(tokens) {
        const result = [];

        /* Determines if a token represents a value that can appear on the left */
        const isLeftValue = (token) => {
            if (!token) return false;
            if (!isNaN(token)) return true;
            if (lookup[token]?.args === 0) return true;
            if (token === ')') return true;
            return false;
        };

        /* Determines if a token can start a value on the right */
        const isRightValue = (token) => {
            if (!token) return false;
            if (!isNaN(token)) return true;
            if (lookup[token]?.args === 0) return true;
            if (token === '(') return true;
            if (token === 'y√x') return false;
            if (lookup[token]?.args > 0 && lookup[token]?.prec === 10) return true;
            return false;
        };

        for (let i = 0; i < tokens.length; i++) {
            let token = tokens[i];
            const prevOriginal = tokens[i - 1];
            const prevTransformed = result[result.length - 1];


            /* Identify Unary Plus/Minus */
            if (token === '+' || token === '-') {
                const isUnary =
                    !prevOriginal ||
                    prevOriginal === '(' ||
                    (lookup[prevOriginal]?.args > 0 && prevOriginal !== ')');

                if (isUnary) {
                    token = token === '-' ? '-u' : '+u';
                }
            }

            /* Identify Nth Root (y√x) */
            if (token === '√') {
                const isNthRoot =
                    prevOriginal &&
                    (!isNaN(prevOriginal) ||
                    lookup[prevOriginal]?.args === 0 ||
                    prevOriginal === ')');

                if (isNthRoot) {
                    token = 'y√x';
                }
            }

            /* Insert Implicit Multiplication */
            if (prevTransformed && isLeftValue(prevTransformed) && isRightValue(token)) {
                result.push('*');
            }
            result.push(token);
        }

        return result;
    }

    /* Tokenizer regex: (Lexer) */
    const regex = /\d*\.\d+(?:e[+-]?\d+)?|\d+(?:e[+-]?\d+)?|[a-zA-Z\u0370-\u03FF\u221A]+|[+\-*/%^()]/gi;

    /* Convert to RPN for easier evaluation */  
    function evaluateRPN(rpn) {
        const stack = [];

        rpn.forEach(t => {
            const item = lookup[t];

            if (item && item.args > 0) {
                if (stack.length < item.args) {
                    throw new Error(`Insufficient operands for "${t}"`);
                }

                const args = [];
                for (let i = 0; i < item.args; i++) {
                    args.unshift(stack.pop());
                }

                const result = item.exec(...args);

                if (!Number.isFinite(result)) {
                    throw new Error(`Invalid result from "${t}"`);
                }

                stack.push(result);
            } else {
                const value = item && item.args === 0
                    ? item.exec()
                    : parseFloat(t);

                if (Number.isNaN(value)) {
                    throw new Error(`Invalid token "${t}"`);
                }

                stack.push(value);
            }
        });

        if (stack.length !== 1) {
            throw new Error("Invalid expression");
        }

        return stack[0];
    }

    function validateFunctionCalls(tokens) {
        const identifierRegex = /^[a-zA-Z\u0370-\u03FF]+$/;

        for (let i = 0; i < tokens.length; i++) {
            const t = tokens[i];
            const next = tokens[i + 1];
            const entry = lookup[t];

            const isIdentifier = identifierRegex.test(t);

            /* Reject unknown identifiers (e.g., "now", "foo") */
            if (isIdentifier && !entry) {
                throw new Error(`Unknown identifier: ${t}`);
            }

            /* Ensure that functions are called with parentheses */
            if (entry && entry.type === 'function') {
                if (next !== '(') {
                    throw new Error(`Function "${t}" must be followed by parentheses`);
                }
            }
        }
    }

    function evaluate(expr) {
        const tokens = expr.match(regex);
        if (!tokens) {
            throw new Error("Invalid or empty expression");
        }
        validateFunctionCalls(tokens);
        const transformed = transformTokens(tokens);
        const rpn = toRPN(transformed);
        const result = evaluateRPN(rpn);

        ans = result; /* Store last answer for Ans button */

        if (result !== 0 && (Math.abs(result) < 1e-9 || Math.abs(result) > 1e12)) return result.toPrecision(10);
        return Number(result.toFixed(10));
    }
})();
