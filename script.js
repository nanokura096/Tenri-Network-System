/* ==========================================================
   TENRI NETWORK OS - CORE SYSTEM (v2.2.6)
   ========================================================== */

// --- 音響設定 ---
const sfx = {
    boot: new Audio("boot.mp3"),
    click: new Audio("click.mp3"),
    error: new Audio("error.mp3"),
};

function playSound(name) {
    const audio = sfx[name];
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {}); // ユーザー操作前の再生エラー防止
    }
}

// --- グローバル変数 ---
let previousScreen = null;
let loginAttempts = 0;
let isSecretAuthenticated = false;

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- 時計機能 (右端に時刻のみ) ---
function updateClock() {
    const clockEl = document.getElementById('system-clock');
    if (!clockEl) return;

    const now = new Date();
    const timeStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    clockEl.innerText = timeStr;
}
setInterval(updateClock, 1000);

// --- 起動・ログインシーケンス ---
async function bootSystem() {
    playSound('boot');
    document.getElementById('bootScreen').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    await startSequence();
}

async function typeLog(text, isDot = false) {
    const consoleEl = document.getElementById('loginConsole');
    const div = document.createElement('div');
    consoleEl.appendChild(div);
    
    // HTMLタグを考慮して一文字ずつ表示
    const chars = text.match(/<[^>]+>|[^<]/g) || [];
    for (const char of chars) {
        div.innerHTML += char;
        if (!char.startsWith('<')) playSound('click');
        await wait(25);
    }

    if (isDot) {
        for (let i = 0; i < 3; i++) {
            await wait(500);
            div.innerHTML += '.';
            playSound('click');
        }
    }
}

async function startSequence() {
    await typeLog("TENRI NETWORK OS [v2.2.6]");
    await typeLog("Connecting to TOA-226 Server", true);
    await typeLog("<br>ACCESS ID:");
    
    const input = createInput(false);
    input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && input.value.trim() !== "") {
            input.disabled = true;
            await typeLog("<br>PASSWORD:");
            promptPassword();
        }
    });
}

function promptPassword() {
    const input = createInput(true);
    input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            input.disabled = true;
            if (input.value === "226227") {
                await typeLog("<br><span style='color:var(--green)'>LOGIN SUCCESS.</span>");
                await wait(600);
                document.getElementById('loginScreen').style.display = 'none';
                document.getElementById('mainTerminal').style.display = 'flex';
                initTerminal();
            } else {
                loginAttempts++;
                playSound('error');
                if (loginAttempts >= 3) {
                    await typeLog("<br><span style='color:var(--red)'>SECURITY BREACH DETECTED. REBOOTING...</span>");
                    await wait(1500);
                    location.reload();
                } else {
                    await typeLog(`<br>ACCESS DENIED (${loginAttempts}/3)`);
                    promptPassword();
                }
            }
        }
    });
}

function createInput(isPass) {
    const input = document.createElement('input');
    input.className = "terminal-input";
    if (isPass) input.type = "password";
    document.getElementById('loginConsole').appendChild(input);
    input.focus();
    // スマホでキーボードが隠れないように調整
    input.scrollIntoView({ behavior: 'smooth' });
    return input;
}

// --- メイン画面ロジック ---
function setOutput(html) {
    const output = document.getElementById('output');
    output.innerHTML = html;
    output.scrollTop = 0; // 常に上から表示
}

function initTerminal() {
    previousScreen = null;
    setOutput(`
        <div style="border-left: 2px solid var(--green); padding-left: 10px;">
            SYSTEM: ONLINE<br>
            UNIT: TOA-226 Agency Terminal<br><br>
            天理秩序機関データベースへようこそ。<br>
            コマンドを選択してください。
        </div>
    `);
}

// 人員リスト表示
function showPersonnelButtons() {
    previousScreen = initTerminal;
    let html = `<div style="margin-bottom:10px;">[ PERSONNEL DATABASE ]</div>`;
    database.personnel.forEach(p => {
        html += `<button class="data-btn" onclick="viewDetail('P', '${p.id}')">${p.id} // ${p.name}</button>`;
    });
    setOutput(html);
}

// オブジェクトリスト表示
function showObjectButtons() {
    previousScreen = initTerminal;
    let html = `<div style="margin-bottom:10px;">[ OBJECT DATABASE ]</div>`;
    database.objects.forEach(o => {
        html += `<button class="data-btn" onclick="viewDetail('O', '${o.id}')">${o.id} // ${o.name}</button>`;
    });
    setOutput(html);
}

// 詳細表示
function viewDetail(type, id) {
    const data = type === 'P' 
        ? database.personnel.find(x => x.id === id) 
        : database.objects.find(x => x.id === id);

    if (!data) return;

    // 前の画面を記憶
    const backFunc = type === 'P' ? 'showPersonnelButtons' : 'showObjectButtons';

    let html = `<div class="info-panel" style="animation: terminal-blink 0.1s 3;">`;
    html += `ID: ${data.id}<br>NAME: ${data.name}<br>`;

    if (type === 'P') {
        const sClass = `status-${data.status.toLowerCase()}`;
        html += `DIV: ${data.division}<br>RANK: ${data.rank}<br>`;
        html += `STATUS: <span class="${sClass}">${data.status}</span><br>`;
        html += `<div style="margin-top:10px; border-top:1px dashed var(--green); padding-top:5px;">ABILITY: ${data.ability}</div>`;
    } else {
        html += `CLASS: ${data.class}<br>DANGER: ${data.danger}<br>`;
        html += `<div style="margin-top:10px; border-top:1px dashed var(--green); padding-top:5px;">DETAIL: ${data.detail}</div>`;
    }

    // 機密データの有無
    if (data.secret) {
        html += `<div style="margin-top:15px; color:var(--red); font-size:0.8em;">[ SECRET RECORD ATTACHED ]</div>`;
    }

    html += `</div>`;
    html += `<button class="data-btn" style="margin-top:20px; border-style:solid;" onclick="${backFunc}()">← BACK</button>`;

    setOutput(html);
    playSound('click');
}

// --- ヘルプ ---
function helpCommand() {
    previousScreen = initTerminal;
    setOutput(`
        [ SYSTEM HELP ]<br><br>
        - PERSONNEL: 職員データの閲覧<br>
        - OBJECTS: 収容物の閲覧<br>
        - SECRET: 機密情報の復号<br>
        - SHUTDOWN: セッションの終了<br><br>
        <button class="data-btn" onclick="initTerminal()">CLOSE</button>
    `);
}

// --- 秘密認証 ---
function openSecretAuth() {
    document.getElementById('secretAuth').style.display = 'flex';
    document.getElementById('secretPassInput').focus();
    playSound('click');
}

function closeSecretAuth() {
    document.getElementById('secretAuth').style.display = 'none';
    document.getElementById('secretPassInput').value = "";
    document.getElementById('secretError').innerText = "";
}

function confirmSecretAccess() {
    const pw = document.getElementById('secretPassInput').value;
    if (pw === "NULL") {
        isSecretAuthenticated = true;
        closeSecretAuth();
        showSecretMenu();
    } else {
        playSound('error');
        document.getElementById('secretError').innerText = "ACCESS DENIED: INVALID CLEARANCE";
    }
}

function showSecretMenu() {
    previousScreen = initTerminal;
    let html = `<div style="color:var(--red); margin-bottom:10px;">[ CONFIDENTIAL RECORDS ]</div>`;
    
    // 全データからsecret:trueのものだけ抽出
    const secretP = database.personnel.filter(x => x.secret);
    const secretO = database.objects.filter(x => x.secret);

    secretP.forEach(p => {
        html += `<button class="data-btn" style="border-color:var(--red); color:var(--red);" onclick="viewSecretDetail('P','${p.id}')">SECRET: ${p.name}</button>`;
    });
    secretO.forEach(o => {
        html += `<button class="data-btn" style="border-color:var(--red); color:var(--red);" onclick="viewSecretDetail('O','${o.id}')">SECRET: ${o.name}</button>`;
    });

    setOutput(html);
}

function viewSecretDetail(type, id) {
    const data = type === 'P' 
        ? database.personnel.find(x => x.id === id) 
        : database.objects.find(x => x.id === id);

    setOutput(`
        <div style="color:var(--red); border:1px double var(--red); padding:10px;">
            [ TOP SECRET RECORD ]<br>
            TARGET: ${data.name}<br><br>
            ${data.secretRecord || "No record found."}
        </div>
        <button class="data-btn" style="margin-top:20px; border-color:var(--red); color:var(--red);" onclick="showSecretMenu()">← BACK</button>
    `);
    playSound('click');
}

// --- ログアウト ---
function openSHUTDOWNConfirm() {
    document.getElementById('SHUTDOWNConfirm').style.display = 'flex';
}

function closeSHUTDOWNConfirm() {
    document.getElementById('SHUTDOWNConfirm').style.display = 'none';
}

function confirmSHUTDOWN() {
    // 画面を真っ暗にする演出
    document.body.innerHTML = "";
    document.body.style.backgroundColor = "#000";
    
    // ブラウザのタブを閉じようとする（ユーザー設定により無効な場合もあります）
    setTimeout(() => {
        window.close();
        // 閉じられなかった時のためにリロード
        location.reload();
    }, 1000);
}

// 起動イベント登録
document.getElementById('bootScreen').addEventListener('click', bootSystem, {once: true});
