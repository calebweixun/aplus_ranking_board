document.addEventListener('DOMContentLoaded', () => {
    const leaderboardContainer = document.querySelector('.leaderboard-container');
    const pageWrapper = document.getElementById('page-wrapper');
    const sideNav = document.getElementById('side-nav');
    const appsScriptUrl = 'https://script.google.com/macros/s/AKfycbzvxsgFAWhRhJK8ajCDJ_ubsy0I3sjxb72MpLtno4QcjSPJ6BvrMEfj6X-9p2t9LQnc/exec'; // 您的 Apps Script 網址

    // *** 修改：從 Hash 初始化 currentMission ***
    let currentMission = 1; // 預設值
    const hash = window.location.hash;
    if (hash.startsWith('#mis')) {
        const num = parseInt(hash.substring(4));
        if (!isNaN(num) && num >= 1 && num <= 5) {
            currentMission = num;
            console.log(`Initialized Mission from hash: ${currentMission}`);
        } else {
            console.log('Invalid mission number in hash, defaulting to 1.');
        }
    } else {
        console.log('No mission hash found, defaulting to 1.');
    }

    let refreshIntervalId = null; // 用於存放 setInterval 的 ID
    let isFetching = false; // *** 追蹤是否正在獲取資料 ***

    /**
     * 更新積分榜 UI
     * @param {Array} data - 從 Apps Script 取得的已排序資料陣列
     */
    function updateLeaderboardUI(data) {
        if (!leaderboardContainer) {
            console.error('Leaderboard container not found!');
            return;
        }

        // 清空目前的積分榜 (確保清除 loading)
        leaderboardContainer.innerHTML = '';

        if (!data || data.length === 0) {
            leaderboardContainer.innerHTML = '<p style="text-align: center; color: #ccc;">目前沒有排名資料。</p>';
            return;
        }

        // 建立並插入新的排名卡片
        data.forEach(item => {
            // *** 新增檢查：如果缺少班級或姓名，則跳過此項目 ***
            if (!item.class || !item.name) {
                console.log('Skipping item due to missing class or name:', item);
                return; // 跳到下一個 item
            }

            const card = document.createElement('div');
            card.classList.add('leaderboard-card');

            // *** 新增：根據排名添加特殊 class ***
            if (item.rank === 1) {
                card.classList.add('rank-1');
            } else if (item.rank === 2) {
                card.classList.add('rank-2');
            } else if (item.rank === 3) {
                card.classList.add('rank-3');
            }

            // 排名
            const rankDiv = document.createElement('div');
            rankDiv.classList.add('rank');
            rankDiv.textContent = item.rank === Infinity ? '-' : item.rank; // 如果排名是 Infinity (例如空值)，顯示 '-'
            card.appendChild(rankDiv);

            // 資訊 (班級、姓名、英文名)
            const infoDiv = document.createElement('div');
            infoDiv.classList.add('info');
            const nameP = document.createElement('p');
            nameP.textContent = `${item.name || 'N/A'} (${item.englishName || 'N/A'})`;
            const classP = document.createElement('p');
            classP.textContent = `班級: ${item.class || 'N/A'}`;
            infoDiv.appendChild(nameP);
            infoDiv.appendChild(classP);
            card.appendChild(infoDiv);

            // 分數
            const scoreDiv = document.createElement('div');
            scoreDiv.classList.add('score');
            scoreDiv.textContent = item.score !== null && item.score !== undefined ? item.score : '-'; // 處理可能的 null 或 undefined 分數
            card.appendChild(scoreDiv);

            leaderboardContainer.appendChild(card);
        });
    }

    /**
     * 從 Google Apps Script 取得指定 Mission 的資料
     * @param {number} missionNumber - 要取得資料的 Mission 編號 (1-5)
     * @param {boolean} [isManualSwitch=false] - 是否為手動觸發的切換
     */
    async function fetchLeaderboardData(missionNumber, isManualSwitch = false) {
        const action = `ms${missionNumber}update`;
        const url = `${appsScriptUrl}?action=${action}`;

        console.log(`Fetching data for Mission ${missionNumber} (Manual: ${isManualSwitch})...`);

        // *** 如果是手動切換，則清空並顯示載入中 ***
        if (isManualSwitch && leaderboardContainer) {
            leaderboardContainer.innerHTML = '<p style="text-align: center; color: #ccc;">載入中...</p>';
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data && data.status === 'error') {
                throw new Error(`Apps Script Error: ${data.message}`);
            }

            console.log(`Data received for Mission ${missionNumber}:`, data);
            updateLeaderboardUI(data); // 成功後更新 UI (會覆蓋 "載入中...")

        } catch (error) {
            console.error('Error fetching or processing leaderboard data:', error);
            // 顯示錯誤訊息 (也會覆蓋 "載入中...")
            leaderboardContainer.innerHTML = `<p style="text-align: center; color: red;">無法載入排名資料：${error.message}</p>`;

        } finally {
            // *** 只有在手動切換時才需要解除 isFetching 和 UI 鎖定 ***
            // *** 因為 isFetching 只在手動切換開始時設為 true ***
            if (isManualSwitch) {
                isFetching = false;
                if (sideNav) {
                    sideNav.classList.remove('nav-locked');
                    console.log('Side nav unlocked.');
                }
            }
        }
    }

    /**
     * 設定或重設自動更新計時器
     */
    function setupAutoRefresh() {
        if (refreshIntervalId !== null) {
            clearInterval(refreshIntervalId);
        }
        refreshIntervalId = setInterval(() => {
            if (!isFetching) {
                console.log(`Auto-refreshing data for Mission ${currentMission}...`);
                // *** 自動刷新不顯示載入中，也不鎖定 UI ***
                fetchLeaderboardData(currentMission, false); // 明確傳遞 false
            } else {
                console.log('Skipping auto-refresh because a fetch is already in progress.');
            }

        }, 60 * 1000);
    }

    /**
     * 切換到指定的 Mission (包含更新 URL Hash)
     * @param {number} missionTarget - 目標 Mission 編號
     */
    function switchMission(missionTarget) {
        console.log(`Switching to Mission ${missionTarget}`);
        currentMission = missionTarget;

        // *** 更新 URL Hash ***
        history.pushState(null, null, `#mis${currentMission}`);

        // *** 設定 fetching 狀態並鎖定 UI ***
        isFetching = true;
        if (sideNav) {
            sideNav.classList.add('nav-locked');
            console.log('Side nav locked.');
        }

        // 更新 page-wrapper 的 data-mission 屬性以改變背景
        if (pageWrapper) {
            pageWrapper.setAttribute('data-mission', currentMission);
            document.body.dataset.mission = currentMission; // 同步更新 body
        }

        // 呼叫 fetch 時標記為手動切換
        fetchLeaderboardData(currentMission, true);

        // 重設計時器
        setupAutoRefresh();
    }

    // --- 初始化 --- 
    // (currentMission 已根據 hash 初始化)
    if (pageWrapper) {
        // *** 確保 pageWrapper 的初始狀態與 currentMission 一致 ***
        pageWrapper.setAttribute('data-mission', currentMission);
        document.body.dataset.mission = currentMission; // 同步更新 body
    }
    // *** 初始載入時顯示載入中 ***
    fetchLeaderboardData(currentMission, true);
    setupAutoRefresh();

    // --- 事件監聽 --- 
    // (事件監聽部分保持不變，它會呼叫已更新的 switchMission) ...
    if (sideNav) {
        sideNav.addEventListener('click', (event) => {
            const button = event.target.closest('button[data-mission-target]');
            if (button) {
                const missionTarget = parseInt(button.getAttribute('data-mission-target'), 10);
                if (isFetching) {
                    console.log('Fetch in progress, preventing mission switch.');
                    return;
                }
                if (missionTarget === currentMission) {
                    console.log('Already on this mission.');
                    return;
                }

                if (!isNaN(missionTarget) && missionTarget >= 1 && missionTarget <= 5) {
                    switchMission(missionTarget);
                }
            }
        });
    }

    function changeMission(missionNumber) {
        const pageWrapper = document.getElementById('page-wrapper');
        if (pageWrapper) {
            pageWrapper.dataset.mission = missionNumber;
            document.body.dataset.mission = missionNumber; // 同步更新 body
        }
        console.log(`已切換至 Mission ${missionNumber}`);
        history.pushState(null, null, `#mis${missionNumber}`);
        // loadLeaderboardData(missionNumber);
    }

    function handleHashChange() {
        const hash = window.location.hash;
        let missionNumber = 1;
        const pageWrapper = document.getElementById('page-wrapper');

        if (hash.startsWith('#mis')) {
            const num = parseInt(hash.substring(4));
            if (!isNaN(num) && num >= 1 && num <= 5) {
                missionNumber = num;
            }
        }

        // 確保 pageWrapper 和 body 的 data-mission 更新
        if (pageWrapper) { // 確保 wrapper 存在
            const currentMission = pageWrapper.dataset.mission;
            if (currentMission != missionNumber) {
                pageWrapper.dataset.mission = missionNumber;
                document.body.dataset.mission = missionNumber; // 同步更新 body
                console.log(`透過 Hash 切換至 Mission ${missionNumber}`);
                // loadLeaderboardData(missionNumber);
            }
        }
    }
}); 