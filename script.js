document.addEventListener('DOMContentLoaded', () => {
    // 元素選取
    const startTimeInput = document.getElementById('startTime');
    const targetTimeInput = document.getElementById('targetTime');
    const calcBtn = document.getElementById('calcBtn');
    const resetBtn = document.getElementById('resetBtn'); 
    
    // 模式相關元素
    const modeRadios = document.querySelectorAll('input[name="calcMode"]');
    const modeDurationDiv = document.getElementById('modeDuration');
    const modeDateDiv = document.getElementById('modeDate');

    // 需監聽的輸入欄位
    const saveTargets = document.querySelectorAll('.save-target');

    // 結果顯示元素
    const resultContainer = document.getElementById('resultContainer');
    const resultMainDiv = document.getElementById('resultMain');
    const resultSubDiv = document.getElementById('resultSub');

    // --- 1. 初始化與讀取 LocalStorage ---
    loadState();

    function loadState() {
        const savedData = localStorage.getItem('timeCalcState');
        
        if (savedData) {
            const state = JSON.parse(savedData);
            
            // 回填時間與輸入
            if(state.startTime) startTimeInput.value = state.startTime;
            if(state.targetTime) targetTimeInput.value = state.targetTime;
            
            ['days', 'hours', 'minutes', 'seconds'].forEach(id => {
                if(state[id] !== undefined) document.getElementById(id).value = state[id];
            });

            // 回填模式選單
            if(state.calcMode) {
                const radio = document.querySelector(`input[name="calcMode"][value="${state.calcMode}"]`);
                if(radio) radio.checked = true;
            }
            if(state.operation) {
                const radio = document.querySelector(`input[name="operation"][value="${state.operation}"]`);
                if(radio) radio.checked = true;
            }

            // 回填計算結果 (如果有存且狀態是顯示的)
            if (state.hasResult) {
                resultContainer.style.display = 'block';
                resultMainDiv.textContent = state.resultMain || '';
                resultSubDiv.textContent = state.resultSub || '';
            } else {
                resultContainer.style.display = 'none';
            }

        } else {
            // 無存檔時的預設值
            setNow(startTimeInput);
            setNow(targetTimeInput);
        }

        updateUIByMode();
    }

    // --- 2. 儲存狀態邏輯 ---
    saveTargets.forEach(el => {
        el.addEventListener('input', saveState);
        el.addEventListener('change', saveState);
    });

    function saveState() {
        const state = {
            // 輸入狀態
            startTime: startTimeInput.value,
            targetTime: targetTimeInput.value,
            calcMode: document.querySelector('input[name="calcMode"]:checked').value,
            operation: document.querySelector('input[name="operation"]:checked').value,
            days: document.getElementById('days').value,
            hours: document.getElementById('hours').value,
            minutes: document.getElementById('minutes').value,
            seconds: document.getElementById('seconds').value,
            
            // 結果狀態 (紀錄是否正在顯示)
            hasResult: resultContainer.style.display === 'block',
            resultMain: resultMainDiv.textContent,
            resultSub: resultSubDiv.textContent
        };
        localStorage.setItem('timeCalcState', JSON.stringify(state));
        
        updateUIByMode();
    }

    // --- 3. 重設功能 (修正版：徹底清除) ---
    resetBtn.addEventListener('click', () => {
        // A. 介面輸入歸零
        setNow(startTimeInput);
        setNow(targetTimeInput);
        
        ['days', 'hours', 'minutes', 'seconds'].forEach(id => {
            document.getElementById(id).value = '';
        });

        // 恢復預設 Radio
        document.querySelector('input[name="calcMode"][value="duration"]').checked = true;
        document.querySelector('input[name="operation"][value="add"]').checked = true;

        // B. ★ 修正重點：隱藏結果區塊
        resultContainer.style.display = 'none';
        resultMainDiv.textContent = '';
        resultSubDiv.textContent = '';

        // C. 更新 UI 並立即存檔 (這會把 "hasResult: false" 寫入 LocalStorage)
        updateUIByMode();
        saveState(); 
    });

    // --- 4. 輔助與計算邏輯 ---

    function updateUIByMode() {
        const currentMode = document.querySelector('input[name="calcMode"]:checked').value;
        if (currentMode === 'duration') {
            modeDurationDiv.style.display = 'block';
            modeDateDiv.style.display = 'none';
        } else {
            modeDurationDiv.style.display = 'none';
            modeDateDiv.style.display = 'block';
        }
    }

    function setNow(inputElement) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        inputElement.value = now.toISOString().slice(0, 16);
    }

    calcBtn.addEventListener('click', calculate);

    function calculate() {
        const startStr = startTimeInput.value;
        if (!startStr) { alert("請設定開始時間"); return; }
        const startDate = new Date(startStr);

        const currentMode = document.querySelector('input[name="calcMode"]:checked').value;

        if (currentMode === 'duration') {
            calculateByDuration(startDate);
        } else {
            calculateByDate(startDate);
        }
        
        // 計算完畢後立即存檔
        saveState();
    }

    function calculateByDuration(startDate) {
        const days = parseInt(document.getElementById('days').value) || 0;
        const hours = parseInt(document.getElementById('hours').value) || 0;
        const minutes = parseInt(document.getElementById('minutes').value) || 0;
        const seconds = parseInt(document.getElementById('seconds').value) || 0;

        const operation = document.querySelector('input[name="operation"]:checked').value;
        const multiplier = operation === 'add' ? 1 : -1;

        const totalMs = ((days * 86400) + (hours * 3600) + (minutes * 60) + seconds) * 1000;
        const newDate = new Date(startDate.getTime() + (totalMs * multiplier));

        displayResult(
            formatDate(newDate),
            `( 原始時間 ${operation === 'add' ? '+' : '-'} ${formatDuration(totalMs)} )`
        );
    }

    function calculateByDate(startDate) {
        const targetStr = targetTimeInput.value;
        if (!targetStr) { alert("請設定目標日期"); return; }
        
        const targetDate = new Date(targetStr);
        const diffMs = targetDate.getTime() - startDate.getTime();
        
        let prefix = "";
        if (diffMs > 0) prefix = "晚於開始時間：";
        else if (diffMs < 0) prefix = "早於開始時間：";
        else prefix = "時間相同";

        displayResult(
            formatDuration(Math.abs(diffMs)),
            `( ${prefix} )`
        );
    }

    function displayResult(mainText, subText) {
        resultContainer.style.display = 'block';
        resultMainDiv.textContent = mainText;
        resultSubDiv.textContent = subText;
    }

    function formatDate(date) {
        return date.toLocaleString('zh-TW', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        });
    }

    function formatDuration(ms) {
        if (ms === 0) return "0秒";
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));

        let str = "";
        if (days > 0) str += `${days}天 `;
        if (hours > 0) str += `${hours}小時 `;
        if (minutes > 0) str += `${minutes}分 `;
        if (seconds > 0) str += `${seconds}秒`;
        return str.trim();
    }
});