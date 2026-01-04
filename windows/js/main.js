// 主程序 - 游玩模式UI
class GameUI {
    constructor() {
        this.initializeEventListeners();
        this.loadGame();
    }

    initializeEventListeners() {
        // 模式切换
        document.getElementById('playModeBtn').addEventListener('click', () => {
            this.switchMode('play');
        });

        document.getElementById('editModeBtn').addEventListener('click', () => {
            this.switchMode('edit');
        });

        // 游戏控制
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveGame();
        });

        document.getElementById('loadBtn').addEventListener('click', () => {
            this.loadGameFromSave();
        });

        document.getElementById('historyBtn').addEventListener('click', () => {
            this.showHistory();
        });

        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });

        document.getElementById('loadDemoBtn').addEventListener('click', () => {
            this.loadDemo();
        });

        // 变量面板折叠
        document.getElementById('collapseBtn').addEventListener('click', () => {
            this.toggleVariablesPanel();
        });

        // 历史弹窗关闭
        document.getElementById('closeHistoryBtn').addEventListener('click', () => {
            document.getElementById('historyModal').classList.remove('active');
        });

        // 点击弹窗外部关闭
        document.getElementById('historyModal').addEventListener('click', (e) => {
            if (e.target.id === 'historyModal') {
                document.getElementById('historyModal').classList.remove('active');
            }
        });
    }

    // 切换模式
    switchMode(mode) {
        if (mode === 'play') {
            document.getElementById('playMode').classList.add('active');
            document.getElementById('editMode').classList.remove('active');
            document.getElementById('playModeBtn').classList.add('active');
            document.getElementById('editModeBtn').classList.remove('active');
        } else {
            document.getElementById('playMode').classList.remove('active');
            document.getElementById('editMode').classList.add('active');
            document.getElementById('playModeBtn').classList.remove('active');
            document.getElementById('editModeBtn').classList.add('active');
            
            // 渲染编辑器
            window.editorUI.renderNodesList();
            window.editorUI.renderVariablesConfig();
        }
    }

    // 加载游戏
    loadGame() {
        // 从编辑器加载故事数据
        const storyData = window.storyEditor.saveStory();
        window.gameEngine.loadStory(storyData);
        
        // 尝试加载自动保存
        window.gameEngine.loadGame('autosave');
        
        this.renderGame();
    }

    // 渲染游戏
    renderGame() {
        this.renderVariables();
        this.renderStory();
    }

    // 渲染变量
    renderVariables() {
        ['physiological', 'emotional', 'difficulty'].forEach(category => {
            const container = document.getElementById(`${category}Vars`);
            const vars = window.gameEngine.variableDefinitions[category];

            container.innerHTML = vars.map(varDef => {
                const value = window.gameEngine.getVariable(category, varDef.id);
                const percentage = ((value - varDef.min) / (varDef.max - varDef.min)) * 100;

                return `
                    <div class="var-item">
                        <div class="var-name">${varDef.name}</div>
                        <div class="var-value-container">
                            <div class="var-bar">
                                <div class="var-bar-fill" style="width: ${percentage}%"></div>
                            </div>
                            <div class="var-value-text">${value}/${varDef.max}</div>
                        </div>
                    </div>
                `;
            }).join('');
        });
    }

    // 渲染故事
    renderStory() {
        const node = window.gameEngine.getCurrentNode();
        
        if (!node) {
            document.getElementById('storyText').innerHTML = `
                <p style="color: var(--warning-color);">
                    ⚠️ 当前节点不存在！请检查故事数据或重新开始。
                </p>
            `;
            document.getElementById('choicesContainer').innerHTML = '';
            return;
        }

        // 渲染文本（保留换行）
        const textHtml = node.text.split('\n').map(line => 
            line.trim() ? `<p>${line}</p>` : '<p><br></p>'
        ).join('');
        
        document.getElementById('storyText').innerHTML = textHtml;

        // 渲染选项
        const choices = window.gameEngine.getAvailableChoices();
        const choicesHtml = choices.map((choice, index) => {
            const conditionText = choice.condition?.enabled && !choice.available
                ? `<div class="choice-condition">条件不满足</div>`
                : '';

            return `
                <button class="choice-btn" 
                        data-choice-index="${index}"
                        ${!choice.available ? 'disabled' : ''}>
                    ${choice.text}
                    ${conditionText}
                </button>
            `;
        }).join('');

        document.getElementById('choicesContainer').innerHTML = choicesHtml;

        // 添加选项点击事件
        document.querySelectorAll('.choice-btn').forEach((btn, index) => {
            btn.addEventListener('click', () => {
                this.makeChoice(index);
            });
        });

        // 自动保存
        window.gameEngine.saveGame('autosave');
    }

    // 做出选择
    makeChoice(choiceIndex) {
        const choices = window.gameEngine.getAvailableChoices();
        const choice = choices[choiceIndex];

        if (!choice.available) return;

        // 执行选择
        window.gameEngine.executeChoice(choice);

        // 重新渲染
        this.renderGame();
    }

    // 保存游戏
    saveGame() {
        const slotName = prompt('请输入存档名称:', 'save_' + new Date().toLocaleDateString());
        if (slotName) {
            window.gameEngine.saveGame(slotName);
            alert('保存成功！');
        }
    }

    // 加载存档
    loadGameFromSave() {
        const slotName = prompt('请输入存档名称:', 'autosave');
        if (slotName) {
            if (window.gameEngine.loadGame(slotName)) {
                alert('读档成功！');
                this.renderGame();
            } else {
                alert('存档不存在！');
            }
        }
    }

    // 显示历史
    showHistory() {
        const history = window.gameEngine.getHistory();
        const modal = document.getElementById('historyModal');
        const content = document.getElementById('historyContent');

        if (history.length === 0) {
            content.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">暂无历史记录</p>';
        } else {
            content.innerHTML = history.map((item, index) => `
                <div class="history-item" data-index="${index}">
                    <div class="history-node-id">#${item.nodeId}</div>
                    <div class="history-text">
                        ${item.text.substring(0, 100)}${item.text.length > 100 ? '...' : ''}
                    </div>
                    <div style="margin-top: 0.5rem; color: var(--primary-color); font-size: 0.85rem;">
                        选择: ${item.choice}
                    </div>
                </div>
            `).join('');

            // 添加点击事件
            content.querySelectorAll('.history-item').forEach(item => {
                item.addEventListener('click', () => {
                    const index = parseInt(item.dataset.index);
                    if (confirm('是否回到这个时间点？这将丢失之后的进度。')) {
                        window.gameEngine.jumpToHistory(index);
                        modal.classList.remove('active');
                        this.renderGame();
                    }
                });
            });
        }

        modal.classList.add('active');
    }

    // 重新开始
    restartGame() {
        if (confirm('确定要重新开始吗？当前进度将丢失。')) {
            window.gameEngine.restart();
            this.renderGame();
        }
    }

    // 折叠变量面板
    toggleVariablesPanel() {
        const panel = document.getElementById('panelContent');
        const btn = document.getElementById('collapseBtn');
        
        if (panel.classList.contains('collapsed')) {
            panel.classList.remove('collapsed');
            btn.textContent = '▼';
        } else {
            panel.classList.add('collapsed');
            btn.textContent = '▶';
        }
    }

    // 加载示例故事
    loadDemo() {
        if (!confirm('加载示例故事将覆盖当前的故事数据，是否继续？')) {
            return;
        }

        const demoStory = {
            nodes: {
                start: {
                    id: 'start',
                    title: '神秘的森林',
                    text: '你醒来时发现自己身处一片陌生的森林之中。\n\n阳光透过树叶洒下斑驳的光影，远处传来潺潺的流水声。你感到有些饥饿和疲惫。\n\n你决定...',
                    choices: [
                        {
                            text: '寻找水源（消耗精力）',
                            nextNode: 'find_water',
                            condition: { enabled: true, category: 'physiological', variable: 'energy', operator: 'greater', value: 20 },
                            variableOperations: [
                                { category: 'physiological', variable: 'energy', operation: 'subtract', value: 15 }
                            ]
                        },
                        {
                            text: '原地休息恢复体力',
                            nextNode: 'rest',
                            condition: { enabled: false },
                            variableOperations: [
                                { category: 'physiological', variable: 'energy', operation: 'add', value: 20 },
                                { category: 'physiological', variable: 'hunger', operation: 'add', value: 10 }
                            ]
                        }
                    ]
                },
                find_water: {
                    id: 'find_water',
                    title: '发现溪流',
                    text: '你沿着水声走了一段路，终于找到了一条清澈的小溪。\n\n喝了些水后，你感觉好多了。溪边有一些可以食用的野果。',
                    choices: [
                        {
                            text: '采集野果充饥',
                            nextNode: 'eat_fruit',
                            condition: { enabled: false },
                            variableOperations: [
                                { category: 'physiological', variable: 'hunger', operation: 'subtract', value: 30 },
                                { category: 'physiological', variable: 'health', operation: 'add', value: 10 }
                            ]
                        },
                        {
                            text: '继续探索',
                            nextNode: 'explore',
                            condition: { enabled: false },
                            variableOperations: [
                                { category: 'difficulty', variable: 'stress', operation: 'add', value: 5 }
                            ]
                        }
                    ]
                },
                rest: {
                    id: 'rest',
                    title: '短暂休息',
                    text: '你靠在一棵大树旁休息了一会儿。\n\n虽然恢复了一些体力，但饥饿感变得更强烈了。你必须找到食物。',
                    choices: [
                        {
                            text: '寻找食物',
                            nextNode: 'find_water',
                            condition: { enabled: false },
                            variableOperations: []
                        }
                    ]
                },
                eat_fruit: {
                    id: 'eat_fruit',
                    title: '饱餐一顿',
                    text: '野果的味道出乎意料的美味。吃饱后，你感到精神焕发。\n\n现在你需要考虑下一步该怎么做了。',
                    choices: [
                        {
                            text: '寻找出路',
                            nextNode: 'explore',
                            condition: { enabled: false },
                            variableOperations: [
                                { category: 'difficulty', variable: 'sanity', operation: 'add', value: 10 }
                            ]
                        },
                        {
                            text: '建造临时住所',
                            nextNode: 'build_shelter',
                            condition: { enabled: true, category: 'physiological', variable: 'energy', operator: 'greater', value: 40 },
                            variableOperations: [
                                { category: 'physiological', variable: 'energy', operation: 'subtract', value: 30 }
                            ]
                        }
                    ]
                },
                explore: {
                    id: 'explore',
                    title: '深入探索',
                    text: '你决定深入森林探索。\n\n走了很久，你发现了一些奇怪的痕迹...\n\n（示例故事到此结束）',
                    choices: [
                        {
                            text: '重新开始',
                            nextNode: 'start',
                            condition: { enabled: false },
                            variableOperations: []
                        }
                    ]
                },
                build_shelter: {
                    id: 'build_shelter',
                    title: '建造住所',
                    text: '你用树枝和树叶搭建了一个简陋的住所。\n\n虽然简陋，但至少能遮风挡雨。这让你感到安心了一些。\n\n（示例故事到此结束）',
                    choices: [
                        {
                            text: '重新开始',
                            nextNode: 'start',
                            condition: { enabled: false },
                            variableOperations: []
                        }
                    ]
                }
            },
            startNode: 'start',
            version: '1.0'
        };

        // 导入示例故事
        window.storyEditor.importStory(demoStory);
        window.gameEngine.loadStory(demoStory);
        window.gameEngine.restart();
        
        this.renderGame();
        alert('示例故事加载成功！您可以在编辑模式中查看和修改。');
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.gameUI = new GameUI();
    
    // 默认显示游玩模式
    window.gameUI.switchMode('play');
});
