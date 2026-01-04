// 游戏引擎核心
class GameEngine {
    constructor() {
        this.currentNodeId = 'start';
        this.variables = {
            physiological: {},
            emotional: {},
            difficulty: {}
        };
        this.variableDefinitions = {
            physiological: [],
            emotional: [],
            difficulty: []
        };
        this.storyData = {
            nodes: {},
            startNode: 'start'
        };
        this.history = [];
        this.loadVariableDefinitions();
    }

    // 加载变量定义
    loadVariableDefinitions() {
        const saved = localStorage.getItem('variableDefinitions');
        if (saved) {
            this.variableDefinitions = JSON.parse(saved);
            this.initializeVariables();
        } else {
            // 默认变量
            this.variableDefinitions = {
                physiological: [
                    { id: 'health', name: '健康', initial: 100, min: 0, max: 100 },
                    { id: 'energy', name: '精力', initial: 100, min: 0, max: 100 },
                    { id: 'hunger', name: '饥饿', initial: 0, min: 0, max: 100 }
                ],
                emotional: [
                    { id: 'affection', name: '好感度', initial: 50, min: 0, max: 100 },
                    { id: 'trust', name: '信任', initial: 50, min: 0, max: 100 },
                    { id: 'shame', name: '羞耻', initial: 0, min: 0, max: 100 }
                ],
                difficulty: [
                    { id: 'sanity', name: '理智', initial: 100, min: 0, max: 100 },
                    { id: 'sensitivity', name: '敏感度', initial: 0, min: 0, max: 100 },
                    { id: 'stress', name: '压力', initial: 0, min: 0, max: 100 }
                ]
            };
            this.initializeVariables();
        }
    }

    // 初始化变量值
    initializeVariables() {
        ['physiological', 'emotional', 'difficulty'].forEach(category => {
            this.variableDefinitions[category].forEach(varDef => {
                this.variables[category][varDef.id] = varDef.initial;
            });
        });
    }

    // 保存变量定义
    saveVariableDefinitions() {
        localStorage.setItem('variableDefinitions', JSON.stringify(this.variableDefinitions));
    }

    // 获取变量值
    getVariable(category, id) {
        return this.variables[category]?.[id] ?? 0;
    }

    // 设置变量值
    setVariable(category, id, value) {
        const varDef = this.variableDefinitions[category]?.find(v => v.id === id);
        if (varDef) {
            // 限制在最小最大值范围内
            this.variables[category][id] = Math.max(varDef.min, Math.min(varDef.max, value));
        }
    }

    // 修改变量值
    modifyVariable(category, id, operation, value) {
        const current = this.getVariable(category, id);
        let newValue = current;

        switch (operation) {
            case 'add':
                newValue = current + value;
                break;
            case 'subtract':
                newValue = current - value;
                break;
            case 'multiply':
                newValue = current * value;
                break;
            case 'divide':
                newValue = value !== 0 ? current / value : current;
                break;
            case 'set':
                newValue = value;
                break;
        }

        this.setVariable(category, id, newValue);
    }

    // 检查条件
    checkCondition(condition) {
        if (!condition || !condition.enabled) return true;
        
        const { category, variable, operator, value } = condition;
        const currentValue = this.getVariable(category, variable);

        switch (operator) {
            case 'equal':
                return currentValue === value;
            case 'notEqual':
                return currentValue !== value;
            case 'greater':
                return currentValue > value;
            case 'greaterEqual':
                return currentValue >= value;
            case 'less':
                return currentValue < value;
            case 'lessEqual':
                return currentValue <= value;
            default:
                return true;
        }
    }

    // 加载故事数据
    loadStory(storyData) {
        this.storyData = storyData;
        this.currentNodeId = storyData.startNode || 'start';
        this.history = [];
        this.initializeVariables();
    }

    // 获取当前节点
    getCurrentNode() {
        return this.storyData.nodes[this.currentNodeId];
    }

    // 执行选项
    executeChoice(choice) {
        // 执行变量操作
        if (choice.variableOperations) {
            choice.variableOperations.forEach(op => {
                this.modifyVariable(op.category, op.variable, op.operation, parseFloat(op.value) || 0);
            });
        }

        // 记录历史
        const currentNode = this.getCurrentNode();
        this.history.push({
            nodeId: this.currentNodeId,
            text: currentNode?.text || '',
            choice: choice.text,
            timestamp: Date.now()
        });

        // 跳转到下一个节点
        if (choice.nextNode) {
            this.currentNodeId = choice.nextNode;
        }
    }

    // 获取可用选项（过滤条件不满足的）
    getAvailableChoices() {
        const node = this.getCurrentNode();
        if (!node || !node.choices) return [];

        return node.choices.map(choice => ({
            ...choice,
            available: this.checkCondition(choice.condition)
        }));
    }

    // 重新开始
    restart() {
        this.currentNodeId = this.storyData.startNode || 'start';
        this.history = [];
        this.initializeVariables();
    }

    // 保存游戏
    saveGame(slotName = 'autosave') {
        const saveData = {
            currentNodeId: this.currentNodeId,
            variables: JSON.parse(JSON.stringify(this.variables)),
            history: this.history,
            timestamp: Date.now()
        };
        localStorage.setItem(`save_${slotName}`, JSON.stringify(saveData));
        return saveData;
    }

    // 加载游戏
    loadGame(slotName = 'autosave') {
        const saved = localStorage.getItem(`save_${slotName}`);
        if (saved) {
            const saveData = JSON.parse(saved);
            this.currentNodeId = saveData.currentNodeId;
            this.variables = saveData.variables;
            this.history = saveData.history || [];
            return true;
        }
        return false;
    }

    // 获取历史记录
    getHistory() {
        return this.history;
    }

    // 跳转到历史节点
    jumpToHistory(index) {
        if (index >= 0 && index < this.history.length) {
            const historyItem = this.history[index];
            this.currentNodeId = historyItem.nodeId;
            // 截断历史到这一点
            this.history = this.history.slice(0, index);
        }
    }
}

// 导出全局实例
window.gameEngine = new GameEngine();
