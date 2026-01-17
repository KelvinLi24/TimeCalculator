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
    
    // 倒數計時相關元素
    const timerLabel = document.getElementById('timerLabel');
    const liveTimerDiv = document.getElementById('liveTimer');
    let timerInterval = null; // 用來存放計時器的變數
    let currentTargetTimestamp = null; // 用來存放目前正在倒數的目標時間

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

            // 回填計算結果與重啟倒數
            if (state.hasResult) {
                resultContainer.style.display = 'block';
                resultMainDiv.textContent = state.resultMain || '';
                resultSubDiv.textContent = state.resultSub || '';
                
                // ★ 重點：如果有儲存目標時間戳記，就重啟倒數
                if (state.targetTimestamp) {
                    startLiveTimer(state.targetTimestamp);
                }
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
            
            // 結果狀態
            hasResult: resultContainer.style.display === 'block',
            resultMain: resultMainDiv.textContent,
            resultSub: resultSubDiv.textContent,
            targetTimestamp: currentTargetTimestamp // ★ 儲存倒數目標
        };
        localStorage.setItem('timeCalcState', JSON.stringify(state));
        
        updateUIByMode();
    }

    // --- 3. 重設功能 ---
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

        // B. 隱藏結果並停止計時
        resultContainer.style.display = 'none';
        resultMainDiv.textContent = '';
        resultSubDiv.textContent = '';
        stopLiveTimer(); // ★ 停止計時

        // C. 更新與存檔
        updateUIByMode();
        saveState(); 
    });

    // --- 4. 核心計算邏輯 ---
    calcBtn.addEventListener('click', calculate);

    function calculate() {
        const startStr = startTimeInput.value;
        if (!startStr) { alert("請設定開始時間"); return; }
        const startDate = new Date(startStr);

        const currentMode = document.querySelector('input[name="calcMode"]:checked').value;
        
        let calculatedDate = null; // 這將是我們倒數的目標

        if (currentMode === 'duration') {
            calculatedDate = calculateByDuration(startDate);
        } else {
            calculatedDate = calculateByDate(startDate);
        }
        
        // ★ 啟動倒數計時器
        if (calculatedDate) {
            startLiveTimer(calculatedDate.getTime());
            saveState(); // 計算完畢後存檔
        }
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
        
        return newDate; // 回傳目標日期供計時器使用
    }

    function calculateByDate(startDate) {
        const targetStr = targetTimeInput.value;
        if (!targetStr) { alert("請設定目標日期"); return null; }
        
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
        
        // 在這個模式下，用戶輸入的第二個日期就是我們的倒數目標
        return targetDate; 
    }

    // --- 5. ★ 實時倒數計時器邏輯 ---
    function startLiveTimer(timestamp) {
        // 先停止舊的計時器
        stopLiveTimer();
        
        currentTargetTimestamp = timestamp; // 記錄當前目標
        const targetDate = new Date(timestamp);

        // 立即執行一次，避免等待一秒
        updateTimerDisplay();

        // 設定每秒執行
        timerInterval = setInterval(updateTimerDisplay, 1000);

        function updateTimerDisplay() {
            const now = new Date();
            const diff = targetDate.getTime() - now.getTime();
            
            // 判斷是「還有多久」還是「已過多久」
            if (diff >= 0) {
                timerLabel.textContent = "⏳ 距離目標還有";
                timerLabel.style.color = "#4a90e2"; // 藍色
                liveTimerDiv.textContent = formatDetailedDuration(diff);
            } else {
                timerLabel.textContent = "⚠️ 目標已過去";
                timerLabel.style.color = "#e74c3c"; // 紅色警示
                liveTimerDiv.textContent = formatDetailedDuration(Math.abs(diff));
            }
        }
    }

    function stopLiveTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        currentTargetTimestamp = null;
        liveTimerDiv.textContent = "--";
    }

    // 詳細格式化 (用於即時倒數：天 時 分 秒)
    function formatDetailedDuration(ms) {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));

        // 補零函數
        const pad = (num) => num.toString().padStart(2, '0');
        
        return `${days}天 ${pad(hours)}時 ${pad(minutes)}分 ${pad(seconds)}秒`;
    }


    // --- 6. 輔助函數 ---
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

    // 簡略格式化 (用於靜態結果)
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