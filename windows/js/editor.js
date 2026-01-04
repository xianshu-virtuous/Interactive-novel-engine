// 编辑器功能
class StoryEditor {
    constructor() {
        this.nodes = {};
        this.currentEditingNodeId = null;
        this.loadStory();
    }

    // 加载故事
    loadStory() {
        const saved = localStorage.getItem('storyData');
        if (saved) {
            const data = JSON.parse(saved);
            this.nodes = data.nodes || {};
        } else {
            // 创建默认开始节点
            this.nodes = {
                'start': {
                    id: 'start',
                    title: '开始',
                    text: '欢迎来到互动小说世界！\n\n这是故事的开端。请在编辑模式中修改这段文字，添加选项，开始创作您的故事。',
                    choices: [
                        {
                            text: '继续',
                            nextNode: '',
                            condition: { enabled: false },
                            variableOperations: []
                        }
                    ]
                }
            };
        }
    }

    // 保存故事
    saveStory() {
        const storyData = {
            nodes: this.nodes,
            startNode: 'start',
            version: '1.0'
        };
        localStorage.setItem('storyData', JSON.stringify(storyData));
        return storyData;
    }

    // 创建新节点
    createNode() {
        const nodeId = 'node_' + Date.now();
        this.nodes[nodeId] = {
            id: nodeId,
            title: '新节点',
            text: '在这里输入故事内容...',
            choices: []
        };
        this.saveStory();
        return nodeId;
    }

    // 删除节点
    deleteNode(nodeId) {
        if (nodeId === 'start') {
            alert('不能删除开始节点！');
            return false;
        }
        delete this.nodes[nodeId];
        this.saveStory();
        return true;
    }

    // 更新节点
    updateNode(nodeId, data) {
        if (this.nodes[nodeId]) {
            this.nodes[nodeId] = { ...this.nodes[nodeId], ...data };
            this.saveStory();
            return true;
        }
        return false;
    }

    // 添加选项
    addChoice(nodeId) {
        if (this.nodes[nodeId]) {
            this.nodes[nodeId].choices.push({
                text: '新选项',
                nextNode: '',
                condition: {
                    enabled: false,
                    category: 'physiological',
                    variable: '',
                    operator: 'greater',
                    value: 0
                },
                variableOperations: []
            });
            this.saveStory();
            return true;
        }
        return false;
    }

    // 删除选项
    deleteChoice(nodeId, choiceIndex) {
        if (this.nodes[nodeId] && this.nodes[nodeId].choices[choiceIndex]) {
            this.nodes[nodeId].choices.splice(choiceIndex, 1);
            this.saveStory();
            return true;
        }
        return false;
    }

    // 更新选项
    updateChoice(nodeId, choiceIndex, data) {
        if (this.nodes[nodeId] && this.nodes[nodeId].choices[choiceIndex]) {
            this.nodes[nodeId].choices[choiceIndex] = {
                ...this.nodes[nodeId].choices[choiceIndex],
                ...data
            };
            this.saveStory();
            return true;
        }
        return false;
    }

    // 添加变量操作
    addVariableOperation(nodeId, choiceIndex) {
        if (this.nodes[nodeId] && this.nodes[nodeId].choices[choiceIndex]) {
            this.nodes[nodeId].choices[choiceIndex].variableOperations.push({
                category: 'physiological',
                variable: '',
                operation: 'add',
                value: 0
            });
            this.saveStory();
            return true;
        }
        return false;
    }

    // 删除变量操作
    deleteVariableOperation(nodeId, choiceIndex, opIndex) {
        if (this.nodes[nodeId] && 
            this.nodes[nodeId].choices[choiceIndex] &&
            this.nodes[nodeId].choices[choiceIndex].variableOperations[opIndex]) {
            this.nodes[nodeId].choices[choiceIndex].variableOperations.splice(opIndex, 1);
            this.saveStory();
            return true;
        }
        return false;
    }

    // 导出故事
    exportStory() {
        return {
            nodes: this.nodes,
            startNode: 'start',
            variableDefinitions: window.gameEngine.variableDefinitions,
            version: '1.0',
            exportDate: new Date().toISOString()
        };
    }

    // 导入故事
    importStory(data) {
        if (data.nodes) {
            this.nodes = data.nodes;
            if (data.variableDefinitions) {
                window.gameEngine.variableDefinitions = data.variableDefinitions;
                window.gameEngine.saveVariableDefinitions();
                window.gameEngine.initializeVariables();
            }
            this.saveStory();
            return true;
        }
        return false;
    }

    // 获取所有节点列表
    getNodesList() {
        return Object.values(this.nodes).sort((a, b) => {
            if (a.id === 'start') return -1;
            if (b.id === 'start') return 1;
            return 0;
        });
    }

    // 获取节点
    getNode(nodeId) {
        return this.nodes[nodeId];
    }
}

// UI渲染器
class EditorUI {
    constructor(editor) {
        this.editor = editor;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // 新建节点
        document.getElementById('addNodeBtn').addEventListener('click', () => {
            const nodeId = this.editor.createNode();
            this.renderNodesList();
            this.editNode(nodeId);
        });

        // 导出
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportStory();
        });

        // 导入
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importStory(e.target.files[0]);
        });

        // 变量管理
        document.querySelectorAll('.add-var-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.addVariable(category);
            });
        });
    }

    // 渲染节点列表
    renderNodesList() {
        const container = document.getElementById('nodesList');
        const nodes = this.editor.getNodesList();

        container.innerHTML = nodes.map(node => `
            <div class="node-item ${node.id === this.editor.currentEditingNodeId ? 'active' : ''}" 
                 data-node-id="${node.id}">
                <div class="node-item-id">#${node.id}</div>
                <div class="node-item-title">${node.title}</div>
            </div>
        `).join('');

        // 添加点击事件
        container.querySelectorAll('.node-item').forEach(item => {
            item.addEventListener('click', () => {
                const nodeId = item.dataset.nodeId;
                this.editNode(nodeId);
            });
        });
    }

    // 编辑节点
    editNode(nodeId) {
        const node = this.editor.getNode(nodeId);
        if (!node) return;

        this.editor.currentEditingNodeId = nodeId;
        this.renderNodesList();

        const editorContent = document.getElementById('editorContent');
        editorContent.innerHTML = `
            <div class="form-group">
                <label>节点ID</label>
                <input type="text" value="${node.id}" disabled>
            </div>
            <div class="form-group">
                <label>节点标题</label>
                <input type="text" id="nodeTitle" value="${node.title}">
            </div>
            <div class="form-group">
                <label>故事文本</label>
                <textarea id="nodeText">${node.text}</textarea>
            </div>
            <div class="form-group">
                <label>选项列表</label>
                <div class="choices-editor" id="choicesEditor"></div>
                <button class="add-choice-btn" id="addChoiceBtn">+ 添加选项</button>
            </div>
            ${node.id !== 'start' ? `
            <div class="form-group">
                <button class="delete-choice-btn" id="deleteNodeBtn" style="width: 100%; padding: 0.8rem;">
                    🗑️ 删除此节点
                </button>
            </div>
            ` : ''}
        `;

        // 添加事件监听
        document.getElementById('nodeTitle').addEventListener('input', (e) => {
            this.editor.updateNode(nodeId, { title: e.target.value });
            this.renderNodesList();
        });

        document.getElementById('nodeText').addEventListener('input', (e) => {
            this.editor.updateNode(nodeId, { text: e.target.value });
        });

        document.getElementById('addChoiceBtn').addEventListener('click', () => {
            this.editor.addChoice(nodeId);
            this.editNode(nodeId);
        });

        if (document.getElementById('deleteNodeBtn')) {
            document.getElementById('deleteNodeBtn').addEventListener('click', () => {
                if (confirm('确定要删除这个节点吗？')) {
                    this.editor.deleteNode(nodeId);
                    this.renderNodesList();
                    document.getElementById('editorContent').innerHTML = `
                        <div class="empty-state">
                            <p>👈 请从左侧选择或创建一个节点</p>
                        </div>
                    `;
                }
            });
        }

        this.renderChoicesEditor(nodeId);
    }

    // 渲染选项编辑器
    renderChoicesEditor(nodeId) {
        const node = this.editor.getNode(nodeId);
        const container = document.getElementById('choicesEditor');
        const allNodes = this.editor.getNodesList();

        container.innerHTML = node.choices.map((choice, index) => `
            <div class="choice-editor">
                <div class="choice-editor-header">
                    <span class="choice-editor-title">选项 ${index + 1}</span>
                    <button class="delete-choice-btn" data-choice-index="${index}">删除</button>
                </div>
                <div class="form-group">
                    <label>选项文本</label>
                    <input type="text" class="choice-text" data-choice-index="${index}" value="${choice.text}">
                </div>
                <div class="form-group">
                    <label>跳转到节点</label>
                    <select class="choice-next" data-choice-index="${index}">
                        <option value="">（无跳转）</option>
                        ${allNodes.map(n => `
                            <option value="${n.id}" ${choice.nextNode === n.id ? 'selected' : ''}>
                                ${n.id} - ${n.title}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" class="choice-condition-enabled" data-choice-index="${index}" 
                               ${choice.condition?.enabled ? 'checked' : ''}>
                        启用条件判断
                    </label>
                    ${choice.condition?.enabled ? `
                    <div class="var-operation" style="margin-top: 0.5rem;">
                        <select class="condition-category" data-choice-index="${index}">
                            <option value="physiological" ${choice.condition.category === 'physiological' ? 'selected' : ''}>生理</option>
                            <option value="emotional" ${choice.condition.category === 'emotional' ? 'selected' : ''}>情感</option>
                            <option value="difficulty" ${choice.condition.category === 'difficulty' ? 'selected' : ''}>难度</option>
                        </select>
                        <select class="condition-variable" data-choice-index="${index}">
                            ${this.getVariablesForCategory(choice.condition.category).map(v => `
                                <option value="${v.id}" ${choice.condition.variable === v.id ? 'selected' : ''}>
                                    ${v.name}
                                </option>
                            `).join('')}
                        </select>
                        <select class="condition-operator" data-choice-index="${index}">
                            <option value="greater" ${choice.condition.operator === 'greater' ? 'selected' : ''}>></option>
                            <option value="greaterEqual" ${choice.condition.operator === 'greaterEqual' ? 'selected' : ''}>>=</option>
                            <option value="equal" ${choice.condition.operator === 'equal' ? 'selected' : ''}>==</option>
                            <option value="lessEqual" ${choice.condition.operator === 'lessEqual' ? 'selected' : ''}><=</option>
                            <option value="less" ${choice.condition.operator === 'less' ? 'selected' : ''}><</option>
                            <option value="notEqual" ${choice.condition.operator === 'notEqual' ? 'selected' : ''}>!=</option>
                        </select>
                        <input type="number" class="condition-value" data-choice-index="${index}" 
                               value="${choice.condition.value || 0}">
                    </div>
                    ` : ''}
                </div>
                <div class="form-group">
                    <label>变量操作</label>
                    <div class="variable-operations" id="varOps_${index}">
                        ${(choice.variableOperations || []).map((op, opIndex) => `
                            <div class="var-operation">
                                <select class="var-op-category" data-choice-index="${index}" data-op-index="${opIndex}">
                                    <option value="physiological" ${op.category === 'physiological' ? 'selected' : ''}>生理</option>
                                    <option value="emotional" ${op.category === 'emotional' ? 'selected' : ''}>情感</option>
                                    <option value="difficulty" ${op.category === 'difficulty' ? 'selected' : ''}>难度</option>
                                </select>
                                <select class="var-op-variable" data-choice-index="${index}" data-op-index="${opIndex}">
                                    ${this.getVariablesForCategory(op.category).map(v => `
                                        <option value="${v.id}" ${op.variable === v.id ? 'selected' : ''}>
                                            ${v.name}
                                        </option>
                                    `).join('')}
                                </select>
                                <select class="var-op-operation" data-choice-index="${index}" data-op-index="${opIndex}">
                                    <option value="add" ${op.operation === 'add' ? 'selected' : ''}>+</option>
                                    <option value="subtract" ${op.operation === 'subtract' ? 'selected' : ''}>-</option>
                                    <option value="multiply" ${op.operation === 'multiply' ? 'selected' : ''}>×</option>
                                    <option value="divide" ${op.operation === 'divide' ? 'selected' : ''}>÷</option>
                                    <option value="set" ${op.operation === 'set' ? 'selected' : ''}>=</option>
                                </select>
                                <input type="number" class="var-op-value" data-choice-index="${index}" data-op-index="${opIndex}"
                                       value="${op.value || 0}" step="any">
                                <button class="remove-var-btn" data-choice-index="${index}" data-op-index="${opIndex}">×</button>
                            </div>
                        `).join('')}
                    </div>
                    <button class="add-var-operation-btn" data-choice-index="${index}">+ 添加变量操作</button>
                </div>
            </div>
        `).join('');

        // 添加事件监听
        this.addChoiceEventListeners(nodeId);
    }

    // 添加选项事件监听
    addChoiceEventListeners(nodeId) {
        const node = this.editor.getNode(nodeId);

        // 删除选项
        document.querySelectorAll('.delete-choice-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.choiceIndex);
                this.editor.deleteChoice(nodeId, index);
                this.editNode(nodeId);
            });
        });

        // 选项文本
        document.querySelectorAll('.choice-text').forEach(input => {
            input.addEventListener('input', (e) => {
                const index = parseInt(e.target.dataset.choiceIndex);
                this.editor.updateChoice(nodeId, index, { text: e.target.value });
            });
        });

        // 跳转节点
        document.querySelectorAll('.choice-next').forEach(select => {
            select.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.choiceIndex);
                this.editor.updateChoice(nodeId, index, { nextNode: e.target.value });
            });
        });

        // 条件启用
        document.querySelectorAll('.choice-condition-enabled').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.choiceIndex);
                const choice = node.choices[index];
                choice.condition.enabled = e.target.checked;
                this.editor.updateChoice(nodeId, index, { condition: choice.condition });
                this.editNode(nodeId);
            });
        });

        // 条件配置
        ['category', 'variable', 'operator', 'value'].forEach(field => {
            document.querySelectorAll(`.condition-${field}`).forEach(elem => {
                elem.addEventListener('change', (e) => {
                    const index = parseInt(e.target.dataset.choiceIndex);
                    const choice = node.choices[index];
                    choice.condition[field] = field === 'value' ? parseFloat(e.target.value) : e.target.value;
                    this.editor.updateChoice(nodeId, index, { condition: choice.condition });
                    if (field === 'category') {
                        this.editNode(nodeId);
                    }
                });
            });
        });

        // 添加变量操作
        document.querySelectorAll('.add-var-operation-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.choiceIndex);
                this.editor.addVariableOperation(nodeId, index);
                this.editNode(nodeId);
            });
        });

        // 删除变量操作
        document.querySelectorAll('.remove-var-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const choiceIndex = parseInt(e.target.dataset.choiceIndex);
                const opIndex = parseInt(e.target.dataset.opIndex);
                this.editor.deleteVariableOperation(nodeId, choiceIndex, opIndex);
                this.editNode(nodeId);
            });
        });

        // 变量操作配置
        ['category', 'variable', 'operation', 'value'].forEach(field => {
            document.querySelectorAll(`.var-op-${field}`).forEach(elem => {
                elem.addEventListener('change', (e) => {
                    const choiceIndex = parseInt(e.target.dataset.choiceIndex);
                    const opIndex = parseInt(e.target.dataset.opIndex);
                    const choice = node.choices[choiceIndex];
                    choice.variableOperations[opIndex][field] = field === 'value' ? parseFloat(e.target.value) : e.target.value;
                    this.editor.updateChoice(nodeId, choiceIndex, choice);
                    if (field === 'category') {
                        this.editNode(nodeId);
                    }
                });
            });
        });
    }

    // 获取分类下的变量
    getVariablesForCategory(category) {
        return window.gameEngine.variableDefinitions[category] || [];
    }

    // 渲染变量配置
    renderVariablesConfig() {
        ['physiological', 'emotional', 'difficulty'].forEach(category => {
            const container = document.getElementById(`${category}Config`);
            const vars = window.gameEngine.variableDefinitions[category];

            container.innerHTML = vars.map((v, index) => `
                <div class="var-config-item">
                    <div class="var-config-header">
                        <span class="var-config-name">${v.name}</span>
                        <button class="delete-var-btn" data-category="${category}" data-index="${index}">删除</button>
                    </div>
                    <div class="var-config-inputs">
                        <input type="text" placeholder="ID" value="${v.id}" 
                               data-category="${category}" data-index="${index}" data-field="id">
                        <input type="text" placeholder="名称" value="${v.name}" 
                               data-category="${category}" data-index="${index}" data-field="name">
                        <input type="number" placeholder="初始值" value="${v.initial}" 
                               data-category="${category}" data-index="${index}" data-field="initial">
                        <input type="number" placeholder="最小值" value="${v.min}" 
                               data-category="${category}" data-index="${index}" data-field="min">
                        <input type="number" placeholder="最大值" value="${v.max}" 
                               data-category="${category}" data-index="${index}" data-field="max">
                    </div>
                </div>
            `).join('');

            // 添加事件监听
            container.querySelectorAll('input').forEach(input => {
                input.addEventListener('input', (e) => {
                    const cat = e.target.dataset.category;
                    const idx = parseInt(e.target.dataset.index);
                    const field = e.target.dataset.field;
                    const value = ['initial', 'min', 'max'].includes(field) ? parseFloat(e.target.value) : e.target.value;
                    
                    window.gameEngine.variableDefinitions[cat][idx][field] = value;
                    window.gameEngine.saveVariableDefinitions();
                    
                    if (field === 'name') {
                        this.renderVariablesConfig();
                    }
                });
            });

            container.querySelectorAll('.delete-var-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const cat = e.target.dataset.category;
                    const idx = parseInt(e.target.dataset.index);
                    
                    if (confirm('确定要删除这个变量吗？')) {
                        window.gameEngine.variableDefinitions[cat].splice(idx, 1);
                        window.gameEngine.saveVariableDefinitions();
                        this.renderVariablesConfig();
                    }
                });
            });
        });
    }

    // 添加变量
    addVariable(category) {
        const varId = prompt('请输入变量ID（英文，如: health）:');
        if (!varId) return;

        const varName = prompt('请输入变量名称:');
        if (!varName) return;

        window.gameEngine.variableDefinitions[category].push({
            id: varId,
            name: varName,
            initial: 50,
            min: 0,
            max: 100
        });

        window.gameEngine.saveVariableDefinitions();
        window.gameEngine.initializeVariables();
        this.renderVariablesConfig();
    }

    // 导出故事
    exportStory() {
        const data = this.editor.exportStory();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `story_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // 导入故事
    importStory(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (this.editor.importStory(data)) {
                    alert('导入成功！');
                    this.renderNodesList();
                    this.renderVariablesConfig();
                    // 刷新游戏引擎
                    window.gameEngine.loadStory(this.editor.saveStory());
                } else {
                    alert('导入失败：数据格式不正确');
                }
            } catch (error) {
                alert('导入失败：' + error.message);
            }
        };
        reader.readAsText(file);
    }
}

// 初始化编辑器
window.storyEditor = new StoryEditor();
window.editorUI = new EditorUI(window.storyEditor);
