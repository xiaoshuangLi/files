// ==UserScript==
// @name         AI Agent Session Visualizer
// @namespace    https://github.com/xiaoshuangLi/files
// @version      1.0.0
// @description  可视化自主智能体的功能调用、交互信息与性能分析（数据来源：specStore.chat.messages._value）
// @author       xiaoshuangLi
// @match        *://*/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  /* ─────────────────────────────────────────────
   *  Constants & helpers
   * ───────────────────────────────────────────── */
  const ID = 'ai-agent-visualizer';

  const COLORS = {
    bg: '#0f1117',
    panel: '#1a1d27',
    card: '#242736',
    border: '#2e3347',
    accent: '#6c8aff',
    accentHover: '#8ba3ff',
    success: '#34d399',
    error: '#f87171',
    warning: '#fbbf24',
    text: '#e2e8f0',
    textMuted: '#8892a4',
    user: '#f97316',
    assistant: '#6c8aff',
    tool: '#a78bfa',
    subagent: '#38bdf8',
    bash: '#34d399',
    read: '#60a5fa',
    write: '#fbbf24',
    task: '#38bdf8',
    ask: '#f472b6',
    todo: '#c084fc',
    parse: '#fb923c',
  };

  const TOOL_COLORS = {
    Bash: COLORS.bash,
    Read: COLORS.read,
    Write: COLORS.write,
    Task: COLORS.task,
    AskUserQuestion: COLORS.ask,
    TodoWrite: COLORS.todo,
    ParseDocument: COLORS.parse,
  };

  const TOOL_ICONS = {
    Bash: '⚡',
    Read: '📄',
    Write: '✏️',
    Task: '🤖',
    AskUserQuestion: '❓',
    TodoWrite: '📝',
    ParseDocument: '📑',
  };

  function toolColor(name) {
    return TOOL_COLORS[name] || COLORS.tool;
  }

  function toolIcon(name) {
    return TOOL_ICONS[name] || '🔧';
  }

  function formatTime(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('zh-CN', {
      month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  }

  function formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}m ${s}s`;
  }

  function escHtml(str) {
    if (typeof str !== 'string') str = String(str);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function tryParseJson(str) {
    try { return JSON.parse(str); } catch { return null; }
  }

  /* ─────────────────────────────────────────────
   *  Data fetching
   * ───────────────────────────────────────────── */
  function fetchMessages() {
    try {
      const raw = window?.specStore?.chat?.messages?._value;
      if (Array.isArray(raw) && raw.length > 0) return raw;
    } catch {}
    return null;
  }

  /* ─────────────────────────────────────────────
   *  Stats computation
   * ───────────────────────────────────────────── */
  function computeStats(messages) {
    const toolCounts = {};
    let totalTools = 0;
    let totalSubagents = 0;
    let successTools = 0;
    let failTools = 0;
    let userInteractions = 0;
    const times = messages.map(m => m.lastModified).filter(Boolean);
    const startTime = times.length ? Math.min(...times) : null;
    const endTime = times.length ? Math.max(...times) : null;

    function processBlocks(blocks) {
      if (!Array.isArray(blocks)) return;
      for (const b of blocks) {
        if (b.type === 'tool') {
          totalTools++;
          const name = b.name || 'unknown';
          toolCounts[name] = (toolCounts[name] || 0) + 1;
          if (b.success === true) successTools++;
          else if (b.success === false) failTools++;
          if (name === 'AskUserQuestion') userInteractions++;
        } else if (b.type === 'subagent') {
          totalSubagents++;
          processBlocks(b.blocks);
        }
      }
    }

    for (const msg of messages) {
      processBlocks(msg.blocks);
    }

    return {
      toolCounts,
      totalTools,
      totalSubagents,
      successTools,
      failTools,
      userInteractions,
      startTime,
      endTime,
      duration: (startTime && endTime) ? endTime - startTime : null,
      userMessages: messages.filter(m => m.role === 'user').length,
      assistantMessages: messages.filter(m => m.role === 'assistant').length,
    };
  }

  /* ─────────────────────────────────────────────
   *  Rendering helpers
   * ───────────────────────────────────────────── */
  let expandedIds = new Set();

  // Counter-based unique ID to avoid Math.random() collisions
  let _textIdCounter = 0;

  // In-memory store for text block full/preview content (avoids encoding large
  // strings into onclick attributes and eliminates the related XSS surface)
  const _textStore = {};

  function toggleExpand(id) {
    if (expandedIds.has(id)) expandedIds.delete(id);
    else expandedIds.add(id);
    rerenderContent();
  }

  function renderToolBlock(block, msgIdx, blockIdx) {
    const id = `tool-${msgIdx}-${blockIdx}`;
    const isExpanded = expandedIds.has(id);
    const color = toolColor(block.name);
    const icon = toolIcon(block.name);
    const statusIcon = block.success === true ? '✅' : block.success === false ? '❌' : '⚪';
    const statusColor = block.success === true ? COLORS.success : block.success === false ? COLORS.error : COLORS.textMuted;

    let detailHtml = '';
    if (isExpanded) {
      const params = block.parameters || block.compactParams || '';
      const result = block.result || block.shortResult || '';

      let paramsHtml = '';
      const parsedParams = tryParseJson(params);
      if (parsedParams) {
        paramsHtml = `<pre style="white-space:pre-wrap;word-break:break-all;margin:0;font-size:11px;color:${COLORS.text};overflow:auto;max-height:200px">${escHtml(JSON.stringify(parsedParams, null, 2))}</pre>`;
      } else {
        paramsHtml = `<pre style="white-space:pre-wrap;word-break:break-all;margin:0;font-size:11px;color:${COLORS.text};overflow:auto;max-height:200px">${escHtml(params)}</pre>`;
      }

      let resultHtml = '';
      if (result) {
        const parsedResult = tryParseJson(result);
        if (parsedResult) {
          resultHtml = `<pre style="white-space:pre-wrap;word-break:break-all;margin:0;font-size:11px;color:${COLORS.success};overflow:auto;max-height:200px">${escHtml(JSON.stringify(parsedResult, null, 2))}</pre>`;
        } else {
          resultHtml = `<pre style="white-space:pre-wrap;word-break:break-all;margin:0;font-size:11px;color:${COLORS.success};overflow:auto;max-height:200px">${escHtml(result)}</pre>`;
        }
      }

      detailHtml = `
        <div style="margin-top:8px;border-top:1px solid ${COLORS.border};padding-top:8px">
          ${params ? `<div style="margin-bottom:6px"><div style="font-size:10px;color:${COLORS.textMuted};margin-bottom:3px;text-transform:uppercase;letter-spacing:.05em">参数 (Parameters)</div><div style="background:${COLORS.bg};border-radius:4px;padding:8px">${paramsHtml}</div></div>` : ''}
          ${result ? `<div><div style="font-size:10px;color:${COLORS.textMuted};margin-bottom:3px;text-transform:uppercase;letter-spacing:.05em">结果 (Result)</div><div style="background:${COLORS.bg};border-radius:4px;padding:8px">${resultHtml}</div></div>` : ''}
        </div>`;
    }

    const shortResult = block.shortResult || '';
    const shortResultHtml = shortResult
      ? `<span style="font-size:11px;color:${COLORS.textMuted};margin-left:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px;display:inline-block;vertical-align:middle" title="${escHtml(shortResult)}">${escHtml(shortResult)}</span>`
      : '';

    return `
      <div style="margin:4px 0;background:${COLORS.card};border:1px solid ${COLORS.border};border-left:3px solid ${color};border-radius:6px;overflow:hidden">
        <div onclick="window.__agentVis.toggle('${id}')" style="display:flex;align-items:center;padding:8px 10px;cursor:pointer;gap:6px;user-select:none">
          <span style="font-size:14px">${icon}</span>
          <span style="font-size:12px;font-weight:600;color:${color}">${escHtml(block.name || 'Tool')}</span>
          <span style="font-size:12px;color:${statusColor}">${statusIcon}</span>
          ${shortResultHtml}
          <span style="margin-left:auto;font-size:11px;color:${COLORS.textMuted}">${isExpanded ? '▲' : '▼'}</span>
        </div>
        ${detailHtml ? `<div style="padding:0 10px 10px">${detailHtml}</div>` : ''}
      </div>`;
  }

  function renderSubagentBlock(block, msgIdx, blockIdx, depth = 0) {
    const id = `subagent-${msgIdx}-${blockIdx}`;
    const isExpanded = expandedIds.has(id);
    const statusColor = block.status === 'completed' ? COLORS.success : COLORS.warning;
    const statusIcon = block.status === 'completed' ? '✅' : '⏳';
    const indent = depth * 12;

    let innerBlocksHtml = '';
    if (isExpanded && Array.isArray(block.blocks)) {
      innerBlocksHtml = block.blocks.map((b, bi) => renderBlock(b, `${msgIdx}-sub-${blockIdx}`, bi, depth + 1)).join('');
    }

    return `
      <div style="margin:4px 0 4px ${indent}px;background:${COLORS.card};border:1px solid ${COLORS.border};border-left:3px solid ${COLORS.subagent};border-radius:6px;overflow:hidden">
        <div onclick="window.__agentVis.toggle('${id}')" style="display:flex;align-items:center;padding:8px 10px;cursor:pointer;gap:6px;user-select:none">
          <span style="font-size:14px">🤖</span>
          <span style="font-size:12px;font-weight:600;color:${COLORS.subagent}">子智能体: ${escHtml(block.subagentName || 'subagent')}</span>
          <span style="font-size:12px;color:${statusColor}">${statusIcon} ${escHtml(block.status || '')}</span>
          ${block.configuration && block.configuration.description ? `<span style="font-size:11px;color:${COLORS.textMuted};margin-left:4px">${escHtml(block.configuration.description)}</span>` : ''}
          <span style="margin-left:auto;font-size:11px;color:${COLORS.textMuted}">${isExpanded ? '▲' : '▼'}</span>
        </div>
        ${isExpanded && innerBlocksHtml ? `<div style="padding:0 10px 10px;border-top:1px solid ${COLORS.border}">${innerBlocksHtml}</div>` : ''}
      </div>`;
  }

  function renderTextBlock(block) {
    if (!block.content) return '';
    const lines = block.content.split('\n');
    const previewLines = lines.slice(0, 3).join('\n');
    const hasMore = lines.length > 3;
    const id = `text-${++_textIdCounter}`;
    if (hasMore) {
      // Store plain text in memory; the toggle handler will use textContent
      _textStore[id] = { full: block.content, preview: previewLines };
    }
    return `
      <div style="padding:6px 10px;font-size:12px;color:${COLORS.textMuted};line-height:1.5;white-space:pre-wrap;word-break:break-word">
        <span id="${ID}-text-preview-${id}">${escHtml(previewLines)}${hasMore ? '<span style="color:' + COLORS.textMuted + '">...</span>' : ''}</span>
        ${hasMore ? `<span onclick="window.__agentVis.toggleText('${id}')" style="cursor:pointer;color:${COLORS.accent};font-size:11px;margin-left:4px" id="${ID}-text-toggle-${id}"> [展开]</span>` : ''}
      </div>`;
  }

  function renderBlock(block, msgIdx, blockIdx, depth = 0) {
    if (block.type === 'tool') return renderToolBlock(block, msgIdx, blockIdx);
    if (block.type === 'subagent') return renderSubagentBlock(block, msgIdx, blockIdx, depth);
    if (block.type === 'text') return renderTextBlock(block);
    return '';
  }

  function renderMessage(msg, idx) {
    const isUser = msg.role === 'user';
    const roleLabel = isUser ? '👤 用户' : '🤖 智能体';
    const roleColor = isUser ? COLORS.user : COLORS.assistant;
    const bgColor = isUser ? 'rgba(249,115,22,0.07)' : 'rgba(108,138,255,0.07)';
    const blocks = msg.blocks || [];
    const toolBlocks = blocks.filter(b => b.type === 'tool');
    const subagentBlocks = blocks.filter(b => b.type === 'subagent');
    const msgId = `msg-${idx}`;
    const isExpanded = expandedIds.has(msgId);

    const toolSummary = toolBlocks.length > 0
      ? Object.entries(
          toolBlocks.reduce((acc, b) => {
            const n = b.name || 'Tool';
            acc[n] = (acc[n] || 0) + 1;
            return acc;
          }, {})
        ).map(([name, cnt]) =>
          `<span style="background:${toolColor(name)}22;color:${toolColor(name)};border-radius:3px;padding:1px 5px;font-size:10px;margin:1px">${toolIcon(name)} ${name}×${cnt}</span>`
        ).join('')
      : '';

    const subSummary = subagentBlocks.length > 0
      ? `<span style="background:${COLORS.subagent}22;color:${COLORS.subagent};border-radius:3px;padding:1px 5px;font-size:10px;margin:1px">🤖 子智能体×${subagentBlocks.length}</span>`
      : '';

    let userContent = '';
    if (isUser && msg.content) {
      userContent = `<div style="padding:8px 12px;font-size:12px;color:${COLORS.text};white-space:pre-wrap;word-break:break-word;line-height:1.5">${escHtml(msg.content)}</div>`;
    }

    const blocksHtml = isExpanded
      ? blocks.map((b, bi) => renderBlock(b, idx, bi)).join('')
      : '';

    return `
      <div style="margin:8px 0;border:1px solid ${COLORS.border};border-left:4px solid ${roleColor};border-radius:8px;background:${bgColor};overflow:hidden">
        <div onclick="window.__agentVis.toggle('${msgId}')" style="display:flex;align-items:center;padding:10px 12px;cursor:pointer;gap:8px;user-select:none">
          <span style="font-size:12px;font-weight:700;color:${roleColor}">${roleLabel}</span>
          <span style="font-size:10px;color:${COLORS.textMuted}">${formatTime(msg.lastModified)}</span>
          <div style="flex:1;display:flex;flex-wrap:wrap;gap:2px;margin-left:4px">${toolSummary}${subSummary}</div>
          <span style="font-size:11px;color:${COLORS.textMuted}">${isExpanded ? '▲' : '▼'}</span>
        </div>
        ${userContent}
        ${isExpanded && blocksHtml ? `<div style="padding:0 8px 8px;border-top:1px solid ${COLORS.border}">${blocksHtml}</div>` : ''}
      </div>`;
  }

  /* ─────────────────────────────────────────────
   *  Performance charts
   * ───────────────────────────────────────────── */
  function renderBarChart(data, maxVal) {
    const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
    return entries.map(([name, val]) => {
      const pct = Math.round((val / maxVal) * 100);
      const color = toolColor(name);
      return `
        <div style="display:flex;align-items:center;gap:8px;margin:4px 0">
          <div style="width:90px;font-size:11px;color:${color};text-align:right;flex-shrink:0">${toolIcon(name)} ${escHtml(name)}</div>
          <div style="flex:1;background:${COLORS.border};border-radius:3px;height:14px;overflow:hidden">
            <div style="width:${pct}%;height:100%;background:${color};border-radius:3px;transition:width .3s"></div>
          </div>
          <div style="width:30px;font-size:11px;color:${COLORS.text};flex-shrink:0">${val}</div>
        </div>`;
    }).join('');
  }

  function renderPerformance(stats) {
    const maxCount = Math.max(...Object.values(stats.toolCounts), 1);
    return `
      <div style="padding:12px">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px">
          ${renderStatCard('⏱️ 总时长', stats.duration ? formatDuration(stats.duration) : '—', COLORS.accent)}
          ${renderStatCard('🔧 工具调用', stats.totalTools, COLORS.tool)}
          ${renderStatCard('🤖 子智能体', stats.totalSubagents, COLORS.subagent)}
          ${renderStatCard('✅ 成功', stats.successTools, COLORS.success)}
          ${renderStatCard('❌ 失败', stats.failTools, COLORS.error)}
          ${renderStatCard('❓ 用户交互', stats.userInteractions, COLORS.ask)}
        </div>
        <div style="margin-bottom:12px">
          <div style="font-size:12px;font-weight:600;color:${COLORS.text};margin-bottom:8px">📊 工具调用分布</div>
          ${renderBarChart(stats.toolCounts, maxCount)}
        </div>
        ${stats.startTime ? `
        <div style="font-size:11px;color:${COLORS.textMuted}">
          <div>🕐 开始：${formatTime(stats.startTime)}</div>
          <div>🕐 结束：${formatTime(stats.endTime)}</div>
        </div>` : ''}
      </div>`;
  }

  function renderStatCard(label, value, color) {
    return `
      <div style="background:${COLORS.card};border:1px solid ${COLORS.border};border-radius:8px;padding:10px;text-align:center">
        <div style="font-size:18px;font-weight:700;color:${color}">${escHtml(String(value))}</div>
        <div style="font-size:10px;color:${COLORS.textMuted};margin-top:2px">${label}</div>
      </div>`;
  }

  /* ─────────────────────────────────────────────
   *  Tab views
   * ───────────────────────────────────────────── */
  let currentTab = 'timeline';

  function renderTimeline(messages) {
    return `<div style="padding:8px">${messages.map((m, i) => renderMessage(m, i)).join('')}</div>`;
  }

  function renderInteractions(messages) {
    const interactions = [];
    for (const msg of messages) {
      if (!msg.blocks) continue;
      for (const block of msg.blocks) {
        if (block.type === 'tool' && block.name === 'AskUserQuestion') {
          interactions.push(block);
        }
      }
    }
    if (interactions.length === 0) {
      return `<div style="padding:24px;text-align:center;color:${COLORS.textMuted};font-size:13px">暂无用户交互记录</div>`;
    }
    return `<div style="padding:8px">${interactions.map((b, i) => renderInteractionCard(b, i)).join('')}</div>`;
  }

  function renderInteractionCard(block, idx) {
    const paramsObj = tryParseJson(block.parameters) || {};
    const questions = paramsObj.questions || [];
    const resultObj = tryParseJson(block.result) || {};
    const answers = resultObj.answers || {};
    const id = `interaction-${idx}`;
    const isExpanded = expandedIds.has(id);

    const questionsHtml = questions.map((q, qi) => {
      const answer = answers[q.question] || '';
      const optionsHtml = (q.options || []).map(opt =>
        `<div style="padding:4px 8px;margin:2px 0;border-radius:4px;font-size:11px;color:${COLORS.textMuted};background:${COLORS.bg};border:1px solid ${COLORS.border}">
           <strong style="color:${COLORS.text}">${escHtml(opt.label)}</strong>
           ${opt.description ? `<div style="font-size:10px;margin-top:1px">${escHtml(opt.description)}</div>` : ''}
         </div>`
      ).join('');

      return `
        <div style="margin-bottom:10px">
          <div style="font-size:12px;font-weight:600;color:${COLORS.ask};margin-bottom:4px">❓ ${escHtml(q.question || '')}</div>
          ${q.header ? `<div style="font-size:10px;color:${COLORS.textMuted};margin-bottom:4px">主题: ${escHtml(q.header)}</div>` : ''}
          ${optionsHtml}
          ${answer ? `
            <div style="margin-top:6px;padding:6px 8px;background:${COLORS.success}18;border:1px solid ${COLORS.success}44;border-radius:4px">
              <div style="font-size:10px;color:${COLORS.success};margin-bottom:2px">👤 用户回答：</div>
              <div style="font-size:12px;color:${COLORS.text};white-space:pre-wrap">${escHtml(answer)}</div>
            </div>` : ''}
        </div>`;
    }).join('');

    return `
      <div style="margin:6px 0;background:${COLORS.card};border:1px solid ${COLORS.border};border-left:3px solid ${COLORS.ask};border-radius:6px;overflow:hidden">
        <div onclick="window.__agentVis.toggle('${id}')" style="display:flex;align-items:center;padding:8px 12px;cursor:pointer;gap:6px;user-select:none">
          <span style="font-size:13px">❓</span>
          <span style="font-size:12px;font-weight:600;color:${COLORS.ask}">用户交互 #${idx + 1}</span>
          <span style="font-size:11px;color:${COLORS.textMuted}">${questions.length} 个问题</span>
          <span style="margin-left:auto;font-size:11px;color:${COLORS.textMuted}">${isExpanded ? '▲' : '▼'}</span>
        </div>
        ${isExpanded ? `<div style="padding:0 12px 12px;border-top:1px solid ${COLORS.border}">${questionsHtml}</div>` : ''}
      </div>`;
  }

  /* ─────────────────────────────────────────────
   *  Main render
   * ───────────────────────────────────────────── */
  function renderTabs() {
    const tabs = [
      { id: 'timeline', label: '📋 时间线' },
      { id: 'interactions', label: '💬 交互' },
      { id: 'performance', label: '📊 性能' },
    ];
    return tabs.map(t => `
      <button onclick="window.__agentVis.setTab('${t.id}')" style="
        padding:6px 14px;font-size:12px;border:none;cursor:pointer;font-weight:600;
        border-radius:4px 4px 0 0;transition:all .15s;outline:none;
        background:${currentTab === t.id ? COLORS.accent : 'transparent'};
        color:${currentTab === t.id ? '#fff' : COLORS.textMuted};
      ">${t.label}</button>`
    ).join('');
  }

  function buildContent(messages) {
    // Reset text block state on each full render so IDs stay consistent
    _textIdCounter = 0;
    Object.keys(_textStore).forEach(k => delete _textStore[k]);
    const stats = computeStats(messages);
    let bodyHtml = '';
    if (currentTab === 'timeline') bodyHtml = renderTimeline(messages);
    else if (currentTab === 'interactions') bodyHtml = renderInteractions(messages);
    else if (currentTab === 'performance') bodyHtml = renderPerformance(stats);
    return { bodyHtml, stats };
  }

  function rerenderContent() {
    const contentEl = document.getElementById(`${ID}-content`);
    if (!contentEl) return;
    const messages = fetchMessages() || [];
    const { bodyHtml } = buildContent(messages);
    contentEl.innerHTML = bodyHtml;
  }

  /* ─────────────────────────────────────────────
   *  Panel creation
   * ───────────────────────────────────────────── */
  let panelVisible = false;
  let panelEl = null;
  let toggleBtnEl = null;

  function createToggleButton() {
    const btn = document.createElement('button');
    btn.id = `${ID}-toggle`;
    btn.title = 'AI Agent 可视化分析';
    btn.innerHTML = '🤖';
    btn.style.cssText = `
      position:fixed;bottom:24px;right:24px;z-index:2147483647;
      width:48px;height:48px;border-radius:50%;border:none;
      background:${COLORS.accent};color:#fff;font-size:22px;
      cursor:pointer;box-shadow:0 4px 20px rgba(108,138,255,0.5);
      transition:all .2s;display:flex;align-items:center;justify-content:center;
    `;
    btn.addEventListener('mouseenter', () => { btn.style.transform = 'scale(1.1)'; });
    btn.addEventListener('mouseleave', () => { btn.style.transform = 'scale(1)'; });
    btn.addEventListener('click', togglePanel);
    document.body.appendChild(btn);
    return btn;
  }

  function createPanel() {
    const panel = document.createElement('div');
    panel.id = `${ID}-panel`;
    panel.style.cssText = `
      position:fixed;top:0;right:0;bottom:0;z-index:2147483646;
      width:480px;max-width:100vw;
      background:${COLORS.panel};color:${COLORS.text};
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
      display:flex;flex-direction:column;
      box-shadow:-4px 0 24px rgba(0,0,0,.5);
      transform:translateX(100%);transition:transform .3s cubic-bezier(.4,0,.2,1);
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      padding:14px 16px;background:${COLORS.bg};
      border-bottom:1px solid ${COLORS.border};
      display:flex;align-items:center;gap:10px;flex-shrink:0;
    `;
    header.innerHTML = `
      <span style="font-size:20px">🤖</span>
      <div style="flex:1">
        <div style="font-size:14px;font-weight:700;color:${COLORS.text}">AI Agent 可视化分析</div>
        <div style="font-size:10px;color:${COLORS.textMuted}" id="${ID}-subtitle">加载中...</div>
      </div>
      <button onclick="window.__agentVis.refresh()" title="刷新数据" style="
        background:transparent;border:1px solid ${COLORS.border};color:${COLORS.textMuted};
        border-radius:4px;padding:4px 8px;cursor:pointer;font-size:11px;
      ">🔄 刷新</button>
      <button onclick="window.__agentVis.close()" style="
        background:transparent;border:none;color:${COLORS.textMuted};
        cursor:pointer;font-size:18px;line-height:1;padding:0 4px;
      ">×</button>
    `;

    // Tabs
    const tabsEl = document.createElement('div');
    tabsEl.id = `${ID}-tabs`;
    tabsEl.style.cssText = `
      display:flex;padding:0 12px;background:${COLORS.bg};
      border-bottom:2px solid ${COLORS.accent};flex-shrink:0;
    `;

    // Content
    const content = document.createElement('div');
    content.id = `${ID}-content`;
    content.style.cssText = `
      flex:1;overflow-y:auto;overflow-x:hidden;
      scrollbar-width:thin;scrollbar-color:${COLORS.border} transparent;
    `;

    panel.appendChild(header);
    panel.appendChild(tabsEl);
    panel.appendChild(content);
    document.body.appendChild(panel);
    return panel;
  }

  function renderPanel() {
    const messages = fetchMessages() || [];
    const stats = computeStats(messages);

    const subtitle = document.getElementById(`${ID}-subtitle`);
    if (subtitle) {
      subtitle.textContent = `${messages.length} 条消息 · ${stats.totalTools} 次工具调用 · ${stats.duration ? formatDuration(stats.duration) : ''}`;
    }

    const tabsEl = document.getElementById(`${ID}-tabs`);
    if (tabsEl) tabsEl.innerHTML = renderTabs();

    const contentEl = document.getElementById(`${ID}-content`);
    if (contentEl) {
      const { bodyHtml } = buildContent(messages);
      if (!messages.length) {
        contentEl.innerHTML = `
          <div style="padding:40px 24px;text-align:center">
            <div style="font-size:32px;margin-bottom:12px">⚠️</div>
            <div style="font-size:14px;font-weight:600;color:${COLORS.text};margin-bottom:8px">未找到数据</div>
            <div style="font-size:12px;color:${COLORS.textMuted};line-height:1.6">
              无法读取 <code style="background:${COLORS.card};padding:1px 4px;border-radius:3px">specStore.chat.messages._value</code><br>
              请确保在正确的页面上运行此脚本，然后点击"刷新"按钮重试。
            </div>
          </div>`;
      } else {
        contentEl.innerHTML = bodyHtml;
      }
    }
  }

  function togglePanel() {
    panelVisible = !panelVisible;
    if (panelEl) {
      panelEl.style.transform = panelVisible ? 'translateX(0)' : 'translateX(100%)';
    }
    if (panelVisible) renderPanel();
  }

  /* ─────────────────────────────────────────────
   *  Global API (used by inline onclick handlers)
   * ───────────────────────────────────────────── */
  window.__agentVis = {
    toggle(id) {
      toggleExpand(id);
    },
    setTab(tab) {
      currentTab = tab;
      renderPanel();
    },
    refresh() {
      expandedIds.clear();
      renderPanel();
    },
    close() {
      panelVisible = false;
      if (panelEl) panelEl.style.transform = 'translateX(100%)';
    },
    toggleText(id) {
      const span = document.getElementById(`${ID}-text-preview-${id}`);
      const btn = document.getElementById(`${ID}-text-toggle-${id}`);
      if (!span || !btn) return;
      const stored = _textStore[id];
      if (!stored) return;
      if (btn.textContent.includes('展开')) {
        // Set full content safely via textContent (no XSS risk)
        span.textContent = stored.full;
        btn.textContent = ' [收起]';
      } else {
        span.textContent = stored.preview;
        // Re-append the ellipsis indicator
        const ellipsis = document.createElement('span');
        ellipsis.style.color = COLORS.textMuted;
        ellipsis.textContent = '...';
        span.appendChild(ellipsis);
        btn.textContent = ' [展开]';
      }
    },
  };

  /* ─────────────────────────────────────────────
   *  Initialization
   * ───────────────────────────────────────────── */
  function init() {
    // Inject global styles
    const style = document.createElement('style');
    style.textContent = `
      #${ID}-content::-webkit-scrollbar { width: 4px; }
      #${ID}-content::-webkit-scrollbar-track { background: transparent; }
      #${ID}-content::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 2px; }
    `;
    document.head.appendChild(style);

    toggleBtnEl = createToggleButton();
    panelEl = createPanel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
