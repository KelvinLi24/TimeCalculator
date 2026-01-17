document.addEventListener('DOMContentLoaded', () => {
    const startTimeInput = document.getElementById('startTime');
    const calcBtn = document.getElementById('calcBtn');
    const resultContainer = document.getElementById('resultContainer');
    const resultDateDiv = document.getElementById('resultDate');
    const timeDiffInfoDiv = document.getElementById('timeDiffInfo');

    // 1. 初始化：將輸入框設為當前時間
    setNow();

    function setNow() {
        const now = new Date();
        // datetime-local 需要 ISO 格式 (YYYY-MM-DDThh:mm)，且需要考慮時區偏移
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        startTimeInput.value = now.toISOString().slice(0, 16);
    }

    // 2. 監聽計算按鈕點擊
    calcBtn.addEventListener('click', calculateTime);

    function calculateTime() {
        // 取得開始時間
        const baseTimeStr = startTimeInput.value;
        if (!baseTimeStr) {
            alert("請選擇開始時間！");
            return;
        }

        const baseDate = new Date(baseTimeStr);

        // 取得輸入的天/時/分/秒 (若為空則預設為 0)
        const days = parseInt(document.getElementById('days').value) || 0;
        const hours = parseInt(document.getElementById('hours').value) || 0;
        const minutes = parseInt(document.getElementById('minutes').value) || 0;
        const seconds = parseInt(document.getElementById('seconds').value) || 0;

        // 取得運算符號 (add 或 subtract)
        const operation = document.querySelector('input[name="operation"]:checked').value;
        const multiplier = operation === 'add' ? 1 : -1;

        // 3. 計算邏輯
        // 將所有輸入轉換為總毫秒數，直接對 Date 物件操作
        // 1天 = 24時, 1時 = 60分, 1分 = 60秒, 1秒 = 1000毫秒
        const totalMillisecondsToAdd = (
            (days * 24 * 60 * 60 * 1000) +
            (hours * 60 * 60 * 1000) +
            (minutes * 60 * 1000) +
            (seconds * 1000)
        ) * multiplier;

        // 產生新的日期物件
        const newDate = new Date(baseDate.getTime() + totalMillisecondsToAdd);

        // 4. 顯示結果
        displayResult(newDate, operation, { days, hours, minutes, seconds });
    }

    function displayResult(dateObj, op, inputs) {
        // 格式化日期時間顯示 (當地格式)
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: false // 使用 24 小時制
        };
        
        const formattedDate = dateObj.toLocaleString('zh-TW', options);
        
        // 顯示
        resultContainer.style.display = 'block';
        resultDateDiv.textContent = formattedDate;

        // 組合提示文字 (例如: + 2天 3小時)
        const symbol = op === 'add' ? '+' : '-';
        let infoText = `${symbol} `;
        if (inputs.days > 0) infoText += `${inputs.days}天 `;
        if (inputs.hours > 0) infoText += `${inputs.hours}小時 `;
        if (inputs.minutes > 0) infoText += `${inputs.minutes}分 `;
        if (inputs.seconds > 0) infoText += `${inputs.seconds}秒`;
        
        // 如果什麼都沒輸入
        if (inputs.days === 0 && inputs.hours === 0 && inputs.minutes === 0 && inputs.seconds === 0) {
            infoText = "時間未變動";
        }

        timeDiffInfoDiv.textContent = `( 原始時間 ${infoText} )`;
    }
});