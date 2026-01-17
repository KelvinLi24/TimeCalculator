document.addEventListener('DOMContentLoaded', () => {
    // 元素選取
    const startTimeInput = document.getElementById('startTime');
    const targetTimeInput = document.getElementById('targetTime');
    const calcBtn = document.getElementById('calcBtn');
    
    // 模式相關元素
    const modeRadios = document.querySelectorAll('input[name="calcMode"]');
    const modeDurationDiv = document.getElementById('modeDuration');
    const modeDateDiv = document.getElementById('modeDate');

    // 結果顯示元素
    const resultContainer = document.getElementById('resultContainer');
    const resultMainDiv = document.getElementById('resultMain');
    const resultSubDiv = document.getElementById('resultSub');

    // 1. 初始化：將兩個時間輸入框都設為當前時間
    setNow(startTimeInput);
    setNow(targetTimeInput);

    function setNow(inputElement) {
        const now = new Date();
        // 修正時區偏移以符合 datetime-local 格式
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        inputElement.value = now.toISOString().slice(0, 16);
    }

    // 2. 監聽模式切換
    modeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'duration') {
                modeDurationDiv.style.display = 'block';
                modeDateDiv.style.display = 'none';
            } else {
                modeDurationDiv.style.display = 'none';
                modeDateDiv.style.display = 'block';
            }
            // 切換模式時隱藏舊的結果
            resultContainer.style.display = 'none';
        });
    });

    // 3. 點擊計算按鈕
    calcBtn.addEventListener('click', calculate);

    function calculate() {
        const startStr = startTimeInput.value;
        if (!startStr) { alert("請設定開始時間"); return; }
        const startDate = new Date(startStr);

        // 判斷當前模式
        const currentMode = document.querySelector('input[name="calcMode"]:checked').value;

        if (currentMode === 'duration') {
            calculateByDuration(startDate);
        } else {
            calculateByDate(startDate);
        }
    }

    // 邏輯 A: 透過輸入的長度推算新日期
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
            formatDate(newDate), // 主標題：新日期
            `( 原始時間 ${operation === 'add' ? '+' : '-'} ${formatDuration(totalMs)} )` // 副標題
        );
    }

    // 邏輯 B: 計算兩個日期的差距
    function calculateByDate(startDate) {
        const targetStr = targetTimeInput.value;
        if (!targetStr) { alert("請設定目標日期"); return; }
        
        const targetDate = new Date(targetStr);
        const diffMs = targetDate.getTime() - startDate.getTime();
        
        // 判斷前後關係
        let prefix = "";
        if (diffMs > 0) prefix = "晚於開始時間：";
        else if (diffMs < 0) prefix = "早於開始時間：";
        else prefix = "時間相同";

        // 轉換毫秒為可讀格式
        const durationText = formatDuration(Math.abs(diffMs));

        displayResult(
            durationText, // 主標題：相差多久
            `( ${prefix} )` // 副標題
        );
    }

    // 工具：顯示結果
    function displayResult(mainText, subText) {
        resultContainer.style.display = 'block';
        resultMainDiv.textContent = mainText;
        resultSubDiv.textContent = subText;
    }

    // 工具：格式化日期 (YYYY/MM/DD HH:mm:ss)
    function formatDate(date) {
        return date.toLocaleString('zh-TW', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        });
    }

    // 工具：格式化時間長度 (毫秒 -> 天時分秒)
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