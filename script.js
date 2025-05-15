document.addEventListener('DOMContentLoaded', () => {
    const leaderboardContainer = document.querySelector('.leaderboard-container');
    const pageWrapper = document.getElementById('page-wrapper');
    const searchInput = document.getElementById('searchInput');
    const menuContainer = document.querySelector('.menu-container');
    const missionSelect = document.getElementById('missionSelect');
    const appsScriptUrl = 'https://script.google.com/macros/s/AKfycbzvxsgFAWhRhJK8ajCDJ_ubsy0I3sjxb72MpLtno4QcjSPJ6BvrMEfj6X-9p2t9LQnc/exec';

    // 搜尋功能
    function filterLeaderboard(searchTerm) {
        const cards = leaderboardContainer.querySelectorAll('.leaderboard-card');
        searchTerm = searchTerm.toLowerCase();

        cards.forEach(card => {
            const infoDiv = card.querySelector('.info');
            const nameText = infoDiv.querySelector('p:first-child').textContent.toLowerCase();
            const classText = infoDiv.querySelector('p:last-child').textContent.toLowerCase();

            if (nameText.includes(searchTerm) || classText.includes(searchTerm)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });

        // 檢查是否有任何卡片顯示
        const visibleCards = Array.from(cards).some(card => card.style.display !== 'none');

        // 如果沒有顯示的卡片，顯示無搜尋結果訊息
        const existingMessage = leaderboardContainer.querySelector('.no-data-message');
        if (!visibleCards) {
            if (!existingMessage) {
                const message = document.createElement('p');
                message.className = 'no-data-message';
                message.textContent = '找不到符合的搜尋結果';
                leaderboardContainer.appendChild(message);
            }
        } else {
            // 如果有顯示的卡片，移除無搜尋結果訊息
            if (existingMessage) {
                existingMessage.remove();
            }
        }
    }

    // 搜尋輸入事件監聽
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterLeaderboard(e.target.value);
        });
    }

    // 修改：從 Hash 初始化 currentMission
    let currentMission = '1';
    const hash = window.location.hash;
    if (hash === '#podium') {
        currentMission = 'podium';
    } else if (hash.startsWith('#mis')) {
        const num = parseInt(hash.substring(4));
        if (!isNaN(num) && num >= 1 && num <= 5) {
            currentMission = num.toString();
        }
    }

    let refreshIntervalId = null;
    let isFetching = false;

    /**
     * 更新目前啟用任務按鈕的高亮狀態
     * @param {string} activeMissionNumber - 要高亮的 Mission 編號或 'podium'
     */
    function updateActiveMissionButton(activeMissionNumber) {
        if (!menuContainer) return;

        const buttons = menuContainer.querySelectorAll('button[data-mission-target]');
        buttons.forEach(button => {
            button.classList.remove('active-mission');
            const missionTarget = button.getAttribute('data-mission-target');
            if (missionTarget === activeMissionNumber) {
                button.classList.add('active-mission');
            }
        });
    }

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
            const message = document.createElement('p');
            message.className = 'no-data-message';
            message.textContent = '目前沒有排名資料。';
            leaderboardContainer.appendChild(message);
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
            nameP.textContent = `${item.name ? item.name.replace(/^(.)(.)(.)?(.)?$/, (_, p1, p2, p3, p4) => {
                if (p4) return `${p1}${p2}○${p4}`; // 四字
                if (p3) return `${p1}○${p3}`; // 三字
                return `${p1}○`; // 二字
            }) : 'N/A'} ${item.englishName || 'N/A'}`;
            const classP = document.createElement('p');
            classP.textContent = `${item.class || 'N/A'}`;
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
     * 更新頒獎台 UI
     * @param {Array} data - 從 Apps Script 取得的頒獎台資料陣列
     */
    function updatePodiumUI(data) {
        const leaderboardContainer = document.querySelector('.leaderboard-container');
        if (!leaderboardContainer) {
            console.error('Leaderboard container not found!');
            return;
        }

        // 清空目前的容器
        leaderboardContainer.innerHTML = '';

        if (!data || data.length === 0) {
            const message = document.createElement('p');
            message.className = 'no-data-message';
            message.textContent = '目前沒有頒獎台資料。';
            leaderboardContainer.appendChild(message);
            return;
        }

        // 創建頒獎台容器
        const podiumContainer = document.createElement('div');
        podiumContainer.className = 'podium-container';

        // 按排名分組
        const groupedData = {
            1: [],
            2: [],
            3: []
        };

        data.forEach(item => {
            if (item.rank >= 1 && item.rank <= 3) {
                groupedData[item.rank].push(item);
            }
        });

        // 為每個排名創建群組
        [1, 2, 3].forEach(rank => {
            const group = document.createElement('div');
            group.className = 'podium-group';
            group.setAttribute('data-rank', rank);

            const title = document.createElement('h2');
            // 根據名次添加對應的 emoji
            switch (rank) {
                case 1:
                    title.textContent = '🥇 第一名 🥇';
                    break;
                case 2:
                    title.textContent = '🥈 第二名 🥈';
                    break;
                case 3:
                    title.textContent = '🥉 第三名 🥉';
                    break;
            }
            group.appendChild(title);

            if (groupedData[rank].length === 0) {
                const emptyMessage = document.createElement('p');
                emptyMessage.textContent = '暫無得獎者';
                emptyMessage.style.textAlign = 'center';
                emptyMessage.style.color = rank === 1 ? '#4E360C' : '#FFF0E6';
                group.appendChild(emptyMessage);
            } else {
                groupedData[rank].forEach(student => {
                    const studentDiv = document.createElement('div');
                    studentDiv.className = 'podium-student';
                    studentDiv.setAttribute('data-rank', rank);

                    const infoDiv = document.createElement('div');
                    infoDiv.className = 'info';

                    const nameDiv = document.createElement('div');
                    nameDiv.className = 'name';
                    nameDiv.textContent = `${student.name} (${student.englishName})`;
                    infoDiv.appendChild(nameDiv);

                    const classDiv = document.createElement('div');
                    classDiv.className = 'class';
                    classDiv.textContent = student.class;
                    infoDiv.appendChild(classDiv);

                    studentDiv.appendChild(infoDiv);

                    // 添加總分顯示
                    const scoreDiv = document.createElement('div');
                    scoreDiv.className = 'score';
                    scoreDiv.textContent = student.mission5 || '-';
                    studentDiv.appendChild(scoreDiv);

                    group.appendChild(studentDiv);
                });
            }

            podiumContainer.appendChild(group);
        });

        leaderboardContainer.appendChild(podiumContainer);
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

        // *** 修改：如果是手動切換，則清空並顯示載入指示器 ***
        if (isManualSwitch && leaderboardContainer) {
            // 完全清空容器
            leaderboardContainer.innerHTML = '';

            // 創建標題行 (顯示當前 Mission 編號)
            const titleDiv = document.createElement('div');
            titleDiv.style.position = 'absolute';
            titleDiv.style.top = '5%';
            titleDiv.style.left = '0';
            titleDiv.style.width = '100%';
            titleDiv.style.textAlign = 'center';
            titleDiv.style.color = '#ffffff';
            titleDiv.style.fontSize = '1.8rem';
            titleDiv.style.fontWeight = 'bold';
            titleDiv.innerHTML = `<p>Loading...</p>`;

            // 創建正中央的載入容器
            const loadingContainer = document.createElement('div');
            loadingContainer.classList.add('loading-container');
            loadingContainer.style.position = 'absolute';
            loadingContainer.style.top = '15%';
            loadingContainer.style.left = '50%';
            loadingContainer.style.transform = 'translate(-50%, -50%)';
            loadingContainer.style.textAlign = 'center';
            loadingContainer.style.width = '80%';
            loadingContainer.style.maxWidth = '300px';

            // 創建 loading-bar 元素
            const loadingBar = document.createElement('div');
            loadingBar.className = 'ldBar';
            loadingBar.setAttribute('data-preset', 'stripe');
            loadingBar.setAttribute('data-value', '99');
            loadingBar.setAttribute('data-duration', '2');
            loadingBar.style.margin = '0 auto';
            loadingContainer.appendChild(loadingBar);

            // // 添加載入中文字
            // const loadingText = document.createElement('p');
            // loadingText.textContent = '載入中...';
            // loadingText.style.color = '#ddd';
            // loadingText.style.marginTop = '10px';
            // loadingText.style.fontSize = '1rem';
            // loadingContainer.appendChild(loadingText);

            // 使用相對定位容器以確保絕對定位元素可以正確顯示
            const positionContainer = document.createElement('div');
            positionContainer.style.position = 'relative';
            positionContainer.style.width = '100%';
            positionContainer.style.height = '100%';
            positionContainer.style.minHeight = '50vh';

            // 先添加標題，再添加載入器
            positionContainer.appendChild(titleDiv);
            positionContainer.appendChild(loadingContainer);

            leaderboardContainer.appendChild(positionContainer);

            // 初始化 loading-bar
            new ldBar(loadingBar);
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

            // console.log(`Data received for Mission ${missionNumber}:`, data);
            updateLeaderboardUI(data); // 成功後更新 UI (會覆蓋 loading-bar)

        } catch (error) {
            console.error('Error fetching or processing leaderboard data:', error);
            // 顯示錯誤訊息 (也會覆蓋 loading-bar)
            leaderboardContainer.innerHTML = `<p style="text-align: center; color: red;">無法載入排名資料：${error.message}</p>`;

        } finally {
            // *** 只有在手動切換時才需要解除 isFetching 和 UI 鎖定 ***
            // *** 因為 isFetching 只在手動切換開始時設為 true ***
            if (isManualSwitch) {
                isFetching = false;
                if (menuContainer) {
                    menuContainer.classList.remove('nav-locked');
                    console.log('Side nav unlocked.');

                    // *** 修改：總是嘗試強制收合 (不再檢查 :hover) ***
                    setTimeout(() => {
                        if (menuContainer) {
                            // 移除 expanded 類別來收合側邊欄
                            menuContainer.classList.remove('expanded');
                            console.log('Removing expanded class after fetch.');
                        }
                    }, 50);
                }
            }
        }
    }

    /**
     * 從 Google Apps Script 取得頒獎台資料
     */
    async function fetchPodiumData() {
        const leaderboardContainer = document.querySelector('.leaderboard-container');
        if (!leaderboardContainer) {
            console.error('Leaderboard container not found!');
            return;
        }

        // 清空容器並顯示載入中
        leaderboardContainer.innerHTML = '';

        // 創建標題行
        const titleDiv = document.createElement('div');
        titleDiv.style.position = 'absolute';
        titleDiv.style.top = '5%';
        titleDiv.style.left = '0';
        titleDiv.style.width = '100%';
        titleDiv.style.textAlign = 'center';
        titleDiv.style.color = '#ffffff';
        titleDiv.style.fontSize = '1.8rem';
        titleDiv.style.fontWeight = 'bold';
        titleDiv.innerHTML = `<p>Loading...</p>`;

        // 創建載入容器
        const loadingContainer = document.createElement('div');
        loadingContainer.classList.add('loading-container');
        loadingContainer.style.position = 'absolute';
        loadingContainer.style.top = '15%';
        loadingContainer.style.left = '50%';
        loadingContainer.style.transform = 'translate(-50%, -50%)';
        loadingContainer.style.textAlign = 'center';
        loadingContainer.style.width = '80%';
        loadingContainer.style.maxWidth = '300px';

        // 創建 loading-bar
        const loadingBar = document.createElement('div');
        loadingBar.className = 'ldBar';
        loadingBar.setAttribute('data-preset', 'stripe');
        loadingBar.setAttribute('data-value', '99');
        loadingBar.setAttribute('data-duration', '2');
        loadingBar.style.margin = '0 auto';
        loadingContainer.appendChild(loadingBar);

        // 使用相對定位容器
        const positionContainer = document.createElement('div');
        positionContainer.style.position = 'relative';
        positionContainer.style.width = '100%';
        positionContainer.style.height = '100%';
        positionContainer.style.minHeight = '50vh';

        // 添加標題和載入器
        positionContainer.appendChild(titleDiv);
        positionContainer.appendChild(loadingContainer);
        leaderboardContainer.appendChild(positionContainer);

        // 初始化 loading-bar
        new ldBar(loadingBar);

        try {
            const url = `${appsScriptUrl}?action=podium`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data && data.status === 'error') {
                throw new Error(`Apps Script Error: ${data.message}`);
            }

            updatePodiumUI(data);

        } catch (error) {
            console.error('Error fetching or processing podium data:', error);
            leaderboardContainer.innerHTML = `<p style="text-align: center; color: red;">無法載入頒獎台資料：${error.message}</p>`;
        } finally {
            // 解除 UI 鎖定
            isFetching = false;
            if (menuContainer) {
                menuContainer.classList.remove('nav-locked');
                console.log('Side nav unlocked.');

                // 強制收合側邊欄
                setTimeout(() => {
                    if (menuContainer) {
                        menuContainer.classList.remove('expanded');
                        console.log('Removing expanded class after fetch.');
                    }
                }, 50);
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
                console.log(`Auto-refreshing data for ${currentMission === 'podium' ? 'Podium' : 'Mission ' + currentMission}...`);
                if (currentMission === 'podium') {
                    fetchPodiumData();
                } else {
                    fetchLeaderboardData(parseInt(currentMission), false);
                }
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

        // 修改：將 missionTarget 轉換為字串，以支援 'podium' 值
        currentMission = missionTarget.toString();

        // 修改：根據目標決定 URL hash
        if (currentMission === 'podium') {
            history.pushState(null, null, '#podium');
        } else {
            history.pushState(null, null, `#mis${currentMission}`);
        }

        // 設定 fetching 狀態並鎖定 UI
        isFetching = true;
        if (menuContainer) {
            menuContainer.classList.add('nav-locked');
            console.log('Side nav locked.');
        }

        // 更新 page-wrapper 的 data-mission 屬性以改變背景
        if (pageWrapper) {
            pageWrapper.setAttribute('data-mission', currentMission);
            document.body.dataset.mission = currentMission;
        }

        // 根據目標決定要執行哪個函數
        if (currentMission === 'podium') {
            fetchPodiumData();
        } else {
            fetchLeaderboardData(parseInt(currentMission), true);
        }

        // 更新按鈕高亮
        updateActiveMissionButton(currentMission);

        // 重設計時器
        setupAutoRefresh();
    }

    /**
     * 更新目前啟用任務的下拉選單選項
     * @param {string} activeMissionNumber - 要選中的 Mission 編號或 'podium'
     */
    function updateActiveMissionSelect(activeMissionNumber) {
        if (!missionSelect) return;
        missionSelect.value = activeMissionNumber;
    }

    // 修改：選單事件監聽
    if (missionSelect) {
        missionSelect.addEventListener('change', (event) => {
            const missionTarget = event.target.value;
            if (isFetching) {
                console.log('Fetch in progress, preventing mission switch.');
                return;
            }
            if (missionTarget === currentMission) {
                console.log('Already on this mission.');
                return;
            }

            switchMission(missionTarget);
        });
    }

    // 初始化頁面
    if (pageWrapper) {
        pageWrapper.setAttribute('data-mission', currentMission);
        document.body.dataset.mission = currentMission;
    }

    // 根據 currentMission 載入對應資料
    if (currentMission === 'podium') {
        fetchPodiumData();
    } else {
        fetchLeaderboardData(parseInt(currentMission), true);
    }

    // 更新按鈕高亮
    updateActiveMissionButton(currentMission);

    // 更新下拉選單選項
    updateActiveMissionSelect(currentMission);

    // 設定自動更新
    setupAutoRefresh();

    // 監聽 hash 變化
    window.addEventListener('hashchange', handleHashChange);
}); 