// ==UserScript==
// @name         AI Agent Session Visualizer
// @namespace    https://github.com/xiaoshuangLi/files
// @version      1.4.12
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
    errorBg: 'rgba(248,113,113,0.07)',
    msgErrorBg: 'rgba(248,113,113,0.13)',
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
    Grep: '#a3e635',
    Glob: '#a3e635',
    LS: '#a3e635',
    Edit: '#fb923c',
  };

  const TOOL_ICONS = {
    Bash: '⚡',
    Read: '📄',
    Write: '✏️',
    Task: '🤖',
    AskUserQuestion: '❓',
    TodoWrite: '📝',
    ParseDocument: '📑',
    Grep: '🔍',
    Glob: '🔎',
    LS: '📁',
    Edit: '✂️',
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
    const totalSecs = Math.floor(ms / 1000);
    const d = Math.floor(totalSecs / 86400);
    const h = Math.floor((totalSecs % 86400) / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    const parts = [];
    if (d > 0) parts.push(`${d}天`);
    if (h > 0) parts.push(`${h}小时`);
    if (m > 0) parts.push(`${m}分钟`);
    if (s > 0 || parts.length === 0) parts.push(`${s}秒`);
    return parts.join('');
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

  // Same as markHtml but without ID/counter tracking — used for toggleText
  // so expanded text blocks still show highlights without disrupting navigation.
  function highlightText(str) {
    if (!str) return '';
    const kw = searchKeyword.trim().toLowerCase();
    if (!kw) return escHtml(str);
    const lower = str.toLowerCase();
    const result = [];
    let last = 0, pos;
    while ((pos = lower.indexOf(kw, last)) !== -1) {
      if (pos > last) result.push(escHtml(str.slice(last, pos)));
      result.push(
        `<mark style="background:${COLORS.accent}40;color:${COLORS.accent};border-radius:2px;padding:0 1px">`
        + escHtml(str.slice(pos, pos + kw.length))
        + '</mark>'
      );
      last = pos + kw.length;
    }
    if (last < str.length) result.push(escHtml(str.slice(last)));
    return result.join('');
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

    // Collect timestamps from three sources (in priority order for accuracy):
    //   1. Tool block createAt / updateAt  (most granular — per-tool)
    //   2. msg.lastModified                (per-message fallback)
    const allTs = [];

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
          if (b.createAt) allTs.push(b.createAt);
          if (b.updateAt) allTs.push(b.updateAt);
        } else if (b.type === 'subagent') {
          totalSubagents++;
          processBlocks(b.blocks);
        }
      }
    }

    for (const msg of messages) {
      processBlocks(msg.blocks);
      if (msg.lastModified) allTs.push(msg.lastModified);
    }

    const startTime = allTs.length ? Math.min(...allTs) : null;
    const endTime   = allTs.length ? Math.max(...allTs) : null;

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
   *  Phase extraction
   *  The agent is in exactly one phase at a time. Rules:
   *  1. ANY 'running' event closes whatever phase is currently open, then opens a new one.
   *  2. A 'done' for key X closes the current phase only when its key matches X.
   *  3. A phase still open after all events extends to the last message.
   * ───────────────────────────────────────────── */
  function extractPhases(messages) {
    // Command format: update-status.mjs <prefix>/<currentPhase>/<nextPhase>/<status>
    const RE = /update-status\.mjs\s+(\S+)/;
    // [-1]=status, [-2]=nextPhase, [-3]=currentPhase; everything before [-3] is prefix
    const PHASE_NAME_OFFSET = 3;
    const events = [];

    // Recursively scan all blocks (including nested subagent blocks).
    // topBi: the top-level block index in the message (used so events always carry the
    //         message-level block position regardless of nesting depth).
    function scanBlocks(blocks, mi, fallbackTs, topBi) {
      if (!Array.isArray(blocks)) return;
      for (let bi = 0; bi < blocks.length; bi++) {
        const block = blocks[bi];
        // Top-level index = bi when called at message level; otherwise inherit from caller.
        const effectiveBi = topBi !== undefined ? topBi : bi;
        if (block.type === 'tool' && block.name === 'Bash') {
          const params = tryParseJson(block.parameters) || {};
          const cmd = params.command || block.compactParams || '';
          const m = RE.exec(cmd);
          if (m) {
            const parts = m[1].split('/');
            // Need at least: <prefix>/<currentPhase>/<nextPhase>/<status> = 4 parts
            if (parts.length >= 4) {
              const status = parts[parts.length - 1];
              if (status === 'running' || status === 'done') {
                const phaseName = parts[parts.length - PHASE_NAME_OFFSET];
                const pathPrefix = parts.slice(0, parts.length - PHASE_NAME_OFFSET).join('/');
                const label = block.shortResult || phaseName;
                // Prefer block.createAt → block.updateAt → fallbackTs (msg.lastModified)
                const ts = block.createAt || block.updateAt || fallbackTs;
                events.push({ phaseName, pathPrefix, label, status, msgIdx: mi, blockIdx: effectiveBi, ts });
              }
            }
          }
        }
        if (block.type === 'subagent' && Array.isArray(block.blocks)) {
          scanBlocks(block.blocks, mi, fallbackTs, effectiveBi);
        }
      }
    }

    for (let mi = 0; mi < messages.length; mi++) {
      const msg = messages[mi];
      scanBlocks(msg.blocks, mi, msg.lastModified || null);
    }

    // Single "currently active" phase pointer — the agent is in at most one phase at a time.
    // Rule 1: ANY 'running' closes currentPhase (regardless of key) and opens a new one.
    // Rule 2: 'done' for key X closes currentPhase only when its key matches X.
    //
    // Block-level boundaries: when two phases share a transition message M, the old phase
    // owns blocks [0 .. ev.blockIdx-1] in M, and the new phase owns [ev.blockIdx ..] in M.
    const phases = [];
    let currentPhase = null; // the most recently opened, not yet closed phase
    for (const ev of events) {
      const key = ev.pathPrefix ? `${ev.pathPrefix}/${ev.phaseName}` : ev.phaseName;
      if (ev.status === 'running') {
        // Rule 1: close whatever phase is currently active
        if (currentPhase && currentPhase.endMsgIdx == null) {
          currentPhase.endTs = ev.ts || null;
          currentPhase.endMsgIdx = ev.msgIdx;
          // endBlockIdx is exclusive: old phase includes blocks [0 .. endBlockIdx-1] in endMsgIdx
          currentPhase.endBlockIdx = ev.blockIdx;
        }
        // Open a fresh phase starting at this block (inclusive)
        currentPhase = {
          label: ev.label,
          phaseName: ev.phaseName,
          pathPrefix: ev.pathPrefix,
          startTs: ev.ts || null,
          startMsgIdx: ev.msgIdx,
          startBlockIdx: ev.blockIdx, // inclusive
          endTs: null,
          endMsgIdx: null,
          endBlockIdx: null, // null = include all blocks in the end message
        };
        phases.push(currentPhase);
      } else if (ev.status === 'done') {
        // Rule 2: close currentPhase only when the key matches
        if (currentPhase && currentPhase.endMsgIdx == null) {
          const currentKey = currentPhase.pathPrefix
            ? `${currentPhase.pathPrefix}/${currentPhase.phaseName}`
            : currentPhase.phaseName;
          if (currentKey === key) {
            currentPhase.endTs = ev.ts || null;
            currentPhase.endMsgIdx = ev.msgIdx;
            currentPhase.endBlockIdx = null; // include the 'done' block itself
            currentPhase = null;
          }
        }
      }
    }

    // Rule 3: the phase still active after all events extends to the last message
    if (currentPhase && currentPhase.endMsgIdx == null && messages.length > 0) {
      const lastIdx = messages.length - 1;
      const lastMsg = messages[lastIdx];
      // Best end timestamp: last tool's updateAt > last tool's createAt > msg.lastModified
      let endTs = lastMsg.lastModified || null;
      function findLastToolTs(blocks) {
        if (!Array.isArray(blocks)) return;
        for (const b of blocks) {
          if (b.type === 'tool') {
            if (b.updateAt) endTs = Math.max(endTs || 0, b.updateAt);
            else if (b.createAt) endTs = Math.max(endTs || 0, b.createAt);
          }
          if (b.type === 'subagent') findLastToolTs(b.blocks);
        }
      }
      for (let mi = currentPhase.startMsgIdx; mi <= lastIdx; mi++) {
        findLastToolTs(messages[mi].blocks);
      }
      currentPhase.endTs = endTs;
      currentPhase.endMsgIdx = lastIdx;
    }

    return phases.map(p => {
      const hasFailed = phaseHasFailed(p, messages);
      const pStart = p.startMsgIdx != null ? p.startMsgIdx : 0;
      const pEnd   = p.endMsgIdx   != null ? p.endMsgIdx   : messages.length - 1;

      // Scan all tool blocks in the phase range to collect:
      //   firstCreateAt — the earliest createAt (= when work began)
      //   lastUpdateAt  — the latest  updateAt  (= when work ended)
      //   toolExecTime  — sum of (updateAt - createAt) per tool (pure CPU/IO time, no idle gaps)
      let firstCreateAt = null;
      let lastUpdateAt  = null;
      let toolExecTime  = null;

      function scanToolTs(blocks) {
        if (!Array.isArray(blocks)) return;
        for (const b of blocks) {
          if (b.type === 'tool') {
            if (b.createAt) {
              firstCreateAt = firstCreateAt === null ? b.createAt : Math.min(firstCreateAt, b.createAt);
            }
            if (b.updateAt) {
              lastUpdateAt = lastUpdateAt === null ? b.updateAt : Math.max(lastUpdateAt, b.updateAt);
            }
            if (b.createAt && b.updateAt && b.updateAt >= b.createAt) {
              toolExecTime = (toolExecTime || 0) + (b.updateAt - b.createAt);
            }
          }
          if (b.type === 'subagent') scanToolTs(b.blocks);
        }
      }
      for (let mi = pStart; mi <= pEnd && mi < messages.length; mi++) {
        const blocks = messages[mi].blocks;
        if (!Array.isArray(blocks)) continue;
        // Apply block-level boundaries to prevent bleed across the transition block.
        const fromBi = (mi === pStart && p.startBlockIdx != null) ? p.startBlockIdx : 0;
        const toBi   = (mi === pEnd   && p.endBlockIdx   != null) ? p.endBlockIdx - 1 : blocks.length - 1;
        scanToolTs(blocks.slice(fromBi, toBi + 1));
      }

      // Phase duration = last tool's updateAt - first tool's createAt.
      // Falls back to startTs/endTs boundary timestamps when tool-level data is absent.
      let duration = null;
      if (firstCreateAt !== null && lastUpdateAt !== null && lastUpdateAt >= firstCreateAt) {
        duration = lastUpdateAt - firstCreateAt;
      } else {
        const raw = (p.startTs && p.endTs) ? p.endTs - p.startTs : null;
        duration = raw !== null && raw >= 0 ? raw : null;
      }

      return {
        ...p,
        duration,
        toolExecTime,
        firstCreateAt,
        lastUpdateAt,
        // Use != null to exclude both null and undefined
        msgSpan: (p.startMsgIdx != null && p.endMsgIdx != null)
          ? p.endMsgIdx - p.startMsgIdx
          : null,
        hasFailed,
      };
    });
  }

  function phaseHasFailed(phase, messages) {
    if (phase.startMsgIdx == null) return false;
    // endMsgIdx is null for in-progress phases — scan to end of session
    const endIdx = phase.endMsgIdx != null ? phase.endMsgIdx : messages.length - 1;
    function checkBlocks(blocks) {
      if (!Array.isArray(blocks)) return false;
      for (const b of blocks) {
        if (b.type === 'tool' && (b.success === false || b.error)) return true;
        if (b.type === 'subagent' && checkBlocks(b.blocks)) return true;
      }
      return false;
    }
    for (let mi = phase.startMsgIdx; mi <= endIdx && mi < messages.length; mi++) {
      const blocks = messages[mi].blocks;
      if (!Array.isArray(blocks)) continue;
      const fromBi = (mi === phase.startMsgIdx && phase.startBlockIdx != null) ? phase.startBlockIdx : 0;
      const toBi   = (mi === endIdx            && phase.endBlockIdx   != null) ? phase.endBlockIdx - 1 : blocks.length - 1;
      if (checkBlocks(blocks.slice(fromBi, toBi + 1))) return true;
    }
    return false;
  }

  /* ─────────────────────────────────────────────
   *  Rendering state
   * ───────────────────────────────────────────── */
  let expandedIds = new Set();

  // Counter-based unique ID to avoid collisions
  let _textIdCounter = 0;

  // In-memory store for text block full/preview content (avoids XSS via onclick)
  const _textStore = {};

  // In-memory store for JSON viewer data keyed by block/message ID
  const _jsonStore = {};

  function toggleExpand(id) {
    if (expandedIds.has(id)) expandedIds.delete(id);
    else expandedIds.add(id);
    rerenderContent();
  }

  /* ─────────────────────────────────────────────
   *  JSON viewer overlay
   * ───────────────────────────────────────────── */
  function showJsonOverlay(id) {
    const data = _jsonStore[id];
    if (!data) return;

    const existing = document.getElementById(`${ID}-json-overlay`);
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = `${ID}-json-overlay`;
    overlay.style.cssText = `
      position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483648;
      background:rgba(0,0,0,0.82);display:flex;align-items:center;justify-content:center;
      padding:20px;
    `;
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    const box = document.createElement('div');
    box.style.cssText = `
      background:${COLORS.bg};border:1px solid ${COLORS.border};border-radius:8px;
      max-width:680px;width:100%;max-height:80vh;display:flex;flex-direction:column;
      box-shadow:0 20px 60px rgba(0,0,0,.8);
    `;

    const boxHeader = document.createElement('div');
    boxHeader.style.cssText = `
      padding:12px 16px;border-bottom:1px solid ${COLORS.border};
      display:flex;align-items:center;gap:8px;flex-shrink:0;
    `;

    const titleSpan = document.createElement('span');
    titleSpan.style.cssText = `font-size:13px;font-weight:600;color:${COLORS.text};flex:1`;
    titleSpan.textContent = '原始 JSON 数据';

    const copyBtn = document.createElement('button');
    copyBtn.textContent = '复制';
    copyBtn.style.cssText = `background:transparent;border:1px solid ${COLORS.border};color:${COLORS.textMuted};cursor:pointer;font-size:11px;border-radius:4px;padding:2px 10px;`;
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
        copyBtn.textContent = '已复制！';
        copyBtn.style.color = COLORS.success;
        setTimeout(() => { copyBtn.textContent = '复制'; copyBtn.style.color = COLORS.textMuted; }, 1500);
      }).catch(() => {
        // Fallback: select text in the pre element
        const range = document.createRange();
        range.selectNodeContents(pre);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      });
    });

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `background:transparent;border:none;color:${COLORS.textMuted};cursor:pointer;font-size:18px;`;
    closeBtn.addEventListener('click', () => overlay.remove());

    boxHeader.appendChild(titleSpan);
    boxHeader.appendChild(copyBtn);
    boxHeader.appendChild(closeBtn);

    const pre = document.createElement('pre');
    pre.style.cssText = `
      flex:1;min-height:0;
      margin:0;padding:16px;overflow:auto;font-size:11px;line-height:1.6;
      color:${COLORS.success};background:transparent;font-family:monospace;
      scrollbar-width:thin;scrollbar-color:${COLORS.border} transparent;
    `;
    pre.textContent = JSON.stringify(data, null, 2);

    // Ctrl+A / Cmd+A while overlay is open → select all text in the pre
    function onKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        const range = document.createRange();
        range.selectNodeContents(pre);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
      if (e.key === 'Escape') overlay.remove();
    }
    document.addEventListener('keydown', onKeyDown);
    // Clean up keydown listener when the overlay is removed from the DOM
    new MutationObserver((_, obs) => {
      if (!document.contains(overlay)) {
        document.removeEventListener('keydown', onKeyDown);
        obs.disconnect();
      }
    }).observe(document.body, { childList: true, subtree: true });

    box.appendChild(boxHeader);
    box.appendChild(pre);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  /* ─────────────────────────────────────────────
   *  Block renderers
   * ───────────────────────────────────────────── */

  // Count all failed tool calls in a block list (recursively through subagents)
  function countBlocksFailed(blocks) {
    function count(bs) {
      if (!Array.isArray(bs)) return 0;
      let n = 0;
      for (const b of bs) {
        if (b.type === 'tool' && (b.success === false || b.error)) n++;
        if (b.type === 'subagent') n += count(b.blocks);
      }
      return n;
    }
    return count(blocks);
  }

  // Count all failed tool calls in a message (recursively through subagents)
  function countMsgFailed(msg) {
    return countBlocksFailed(msg.blocks);
  }

  function renderToolBlock(block, msgIdx, blockIdx, opts) {
    const id = `tool-${msgIdx}-${blockIdx}`;
    const isExpanded = expandedIds.has(id);
    const isFailed = block.success === false || !!block.error;
    const color = isFailed ? COLORS.error : toolColor(block.name);
    const icon = toolIcon(block.name);
    const statusIcon = block.success === true ? '✅' : block.success === false ? '❌' : '⚪';
    const statusColor = block.success === true ? COLORS.success : block.success === false ? COLORS.error : COLORS.textMuted;
    const bgTint = isFailed ? COLORS.errorBg : COLORS.card;
    const msgTs = (opts && opts.ts) ? opts.ts : (block.createAt || null);
    // Per-tool execution duration: prefer opts.toolDuration, else compute from block timestamps
    const toolDuration = (opts && opts.toolDuration != null)
      ? opts.toolDuration
      : (block.createAt && block.updateAt && block.updateAt >= block.createAt)
        ? block.updateAt - block.createAt
        : null;

    _jsonStore[id] = block;

    let detailHtml = '';
    if (isExpanded) {
      const params = block.parameters || block.compactParams || '';
      const result = block.result || block.shortResult || '';
      const errorMsg = block.error || '';

      let paramsHtml = '';
      const parsedParams = tryParseJson(params);
      if (parsedParams) {
        paramsHtml = `<pre style="white-space:pre-wrap;word-break:break-all;margin:0;font-size:11px;color:${COLORS.text};overflow:auto;max-height:200px;background:transparent">${markHtml(JSON.stringify(parsedParams, null, 2))}</pre>`;
      } else {
        paramsHtml = `<pre style="white-space:pre-wrap;word-break:break-all;margin:0;font-size:11px;color:${COLORS.text};overflow:auto;max-height:200px;background:transparent">${markHtml(params)}</pre>`;
      }

      let resultHtml = '';
      if (result) {
        const parsedResult = tryParseJson(result);
        if (parsedResult) {
          resultHtml = `<pre style="white-space:pre-wrap;word-break:break-all;margin:0;font-size:11px;color:${COLORS.success};overflow:auto;max-height:200px;background:transparent">${markHtml(JSON.stringify(parsedResult, null, 2))}</pre>`;
        } else {
          resultHtml = `<pre style="white-space:pre-wrap;word-break:break-all;margin:0;font-size:11px;color:${COLORS.success};overflow:auto;max-height:200px;background:transparent">${markHtml(result)}</pre>`;
        }
      }

      // Timing row: createAt → updateAt with duration
      const timingHtml = block.createAt
        ? (() => {
            const start = formatTime(block.createAt);
            const end   = block.updateAt ? formatTime(block.updateAt) : null;
            const dur   = toolDuration !== null ? ` (${formatDuration(toolDuration)})` : '';
            return `<div style="margin-bottom:6px"><div style="font-size:10px;color:${COLORS.textMuted};margin-bottom:3px;text-transform:uppercase;letter-spacing:.05em">执行时间 (Timing)</div><div style="background:${COLORS.bg};border-radius:4px;padding:6px 8px;font-size:11px;color:${COLORS.text};font-family:monospace">${start}${end ? ` → ${end}` : ''}${escHtml(dur)}</div></div>`
          })()
        : '';

      detailHtml = `
        <div style="margin-top:8px;border-top:1px solid ${COLORS.border};padding-top:8px">
          ${timingHtml}
          ${errorMsg ? `<div style="margin-bottom:6px"><div style="font-size:10px;color:${COLORS.error};margin-bottom:3px;text-transform:uppercase;letter-spacing:.05em">错误 (Error)</div><div style="background:${COLORS.bg};border-radius:4px;padding:8px;color:${COLORS.error};font-size:11px">${markHtml(errorMsg)}</div></div>` : ''}
          ${params ? `<div style="margin-bottom:6px"><div style="font-size:10px;color:${COLORS.textMuted};margin-bottom:3px;text-transform:uppercase;letter-spacing:.05em">参数 (Parameters)</div><div style="background:${COLORS.bg};border-radius:4px;padding:8px">${paramsHtml}</div></div>` : ''}
          ${result ? `<div><div style="font-size:10px;color:${COLORS.textMuted};margin-bottom:3px;text-transform:uppercase;letter-spacing:.05em">结果 (Result)</div><div style="background:${COLORS.bg};border-radius:4px;padding:8px">${resultHtml}</div></div>` : ''}
        </div>`;
    }

    const shortResult = block.shortResult || '';
    const shortResultHtml = shortResult
      ? `<span style="font-size:11px;color:${COLORS.textMuted};margin-left:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px;display:inline-block;vertical-align:middle" title="${escHtml(shortResult)}">${markHtml(shortResult)}</span>`
      : '';

    // Timestamp badge: prefer createAt over fallback ts
    const displayTs = block.createAt || msgTs;
    const tsHtml = displayTs
      ? `<span style="font-size:10px;color:${COLORS.textMuted};flex-shrink:0;margin-left:4px">${formatTime(displayTs)}</span>`
      : '';
    // Tool duration badge (shown in header row for quick scanning)
    const durBadge = toolDuration !== null
      ? `<span style="font-size:10px;color:${COLORS.accent};flex-shrink:0;background:${COLORS.accent}18;border-radius:3px;padding:0 4px">${formatDuration(toolDuration)}</span>`
      : '';

    return `
      <div id="${ID}-block-${id}"${isFailed ? ' data-fail="true"' : ''} style="margin:4px 0;background:${bgTint};border:1px solid ${isFailed ? COLORS.error : COLORS.border};border-left:3px solid ${color};border-radius:6px;overflow:hidden">
        <div style="display:flex;align-items:center;padding:8px 10px;gap:6px">
          <div onclick="window.__agentVis.toggle('${id}')" style="display:flex;align-items:center;flex:1;gap:6px;cursor:pointer;user-select:none;min-width:0;overflow:hidden">
            <span style="font-size:14px;flex-shrink:0">${icon}</span>
            <span style="font-size:12px;font-weight:600;color:${color};flex-shrink:0">${markHtml(block.name || 'Tool')}</span>
            <span style="font-size:12px;color:${statusColor};flex-shrink:0">${statusIcon}</span>
            ${shortResultHtml}
          </div>
          ${durBadge}
          ${tsHtml}
          <span onclick="window.__agentVis.toggle('${id}')" style="flex-shrink:0;font-size:11px;color:${COLORS.textMuted};cursor:pointer">${isExpanded ? '▲' : '▼'}</span>
          <button onclick="window.__agentVis.showJson('${id}')" title="查看原始 JSON" style="flex-shrink:0;background:transparent;border:1px solid ${COLORS.border};color:${COLORS.textMuted};border-radius:3px;padding:1px 6px;cursor:pointer;font-size:10px;font-family:monospace">{}</button>
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
    const failCount = countBlocksFailed(block.blocks);
    const hasError = failCount > 0;
    const borderColor = hasError ? COLORS.error : COLORS.subagent;
    const bgColor = hasError ? COLORS.errorBg : COLORS.card;
    const errorBadge = hasError
      ? `<span style="flex-shrink:0;background:${COLORS.error}22;color:${COLORS.error};border:1px solid ${COLORS.error};border-radius:3px;padding:1px 5px;font-size:10px;font-weight:700">❌ ${failCount}</span>`
      : '';

    _jsonStore[id] = block;

    let innerBlocksHtml = '';
    if (isExpanded && Array.isArray(block.blocks)) {
      innerBlocksHtml = block.blocks.map((b, bi) => renderBlock(b, `${msgIdx}-sub-${blockIdx}`, bi, depth + 1)).join('');
    }

    return `
      <div style="margin:4px 0 4px ${indent}px;background:${bgColor};border:1px solid ${hasError ? COLORS.error : COLORS.border};border-left:3px solid ${borderColor};border-radius:6px;${isExpanded ? '' : 'overflow:hidden;'}">
        <div style="display:flex;align-items:center;padding:8px 10px;gap:6px;background:${bgColor};${isExpanded ? `position:sticky;top:0;z-index:2;border-radius:6px 6px 0 0;` : ''}">
          <div onclick="window.__agentVis.toggle('${id}')" style="display:flex;align-items:center;flex:1;gap:6px;cursor:pointer;user-select:none">
            <span style="font-size:14px">🤖</span>
            <span style="font-size:12px;font-weight:600;color:${COLORS.subagent}">子智能体: ${markHtml(block.subagentName || 'subagent')}</span>
            <span style="font-size:12px;color:${statusColor}">${statusIcon} ${escHtml(block.status || '')}</span>
            ${block.configuration && block.configuration.description ? `<span style="font-size:11px;color:${COLORS.textMuted};margin-left:4px">${markHtml(block.configuration.description)}</span>` : ''}
          </div>
          ${errorBadge}
          <span onclick="window.__agentVis.toggle('${id}')" style="flex-shrink:0;font-size:11px;color:${COLORS.textMuted};cursor:pointer">${isExpanded ? '▲' : '▼'}</span>
          <button onclick="window.__agentVis.showJson('${id}')" title="查看原始 JSON" style="flex-shrink:0;background:transparent;border:1px solid ${COLORS.border};color:${COLORS.textMuted};border-radius:3px;padding:1px 6px;cursor:pointer;font-size:10px;font-family:monospace">{}</button>
        </div>
        ${isExpanded && innerBlocksHtml ? `<div style="padding:0 10px 10px;border-top:1px solid ${COLORS.border}">${innerBlocksHtml}</div>` : ''}
      </div>`;
  }

  function renderTextBlock(block) {
    if (!block.content) return '';
    // Collapse 3+ consecutive newlines then trim trailing whitespace to avoid
    // blank padding at the bottom of each text block
    const content = block.content.replace(/\n{3,}/g, '\n\n').trimEnd();
    const lines = content.split('\n');
    const previewLines = lines.slice(0, 3).join('\n');
    const hasMore = lines.length > 3;
    _textIdCounter += 1;
    const id = `text-${_textIdCounter}`;
    if (hasMore) {
      _textStore[id] = { full: content, preview: previewLines };
    }
    return `
      <div style="padding:5px 10px;font-size:12px;color:${COLORS.textMuted};line-height:1.5;white-space:pre-wrap;word-break:break-word">
        <span id="${ID}-text-preview-${id}">${markHtml(previewLines)}${hasMore ? '<span style="color:' + COLORS.textMuted + '">...</span>' : ''}</span>
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
    const blocks = msg.blocks || [];
    const toolBlocks = blocks.filter(b => b.type === 'tool');
    const subagentBlocks = blocks.filter(b => b.type === 'subagent');
    const msgId = `msg-${idx}`;
    const isExpanded = expandedIds.has(msgId);
    const failCount = countMsgFailed(msg);
    const hasError = failCount > 0;

    // Override background and border when the message has errors
    const bgColor = hasError
      ? COLORS.msgErrorBg
      : (isUser ? 'rgba(249,115,22,0.07)' : 'rgba(108,138,255,0.07)');
    const leftBorderColor = hasError ? COLORS.error : roleColor;
    const outerBorder = hasError
      ? `border:1px solid ${COLORS.error};border-left:4px solid ${COLORS.error};`
      : `border:1px solid ${COLORS.border};border-left:4px solid ${roleColor};`;

    _jsonStore[msgId] = msg;

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

    // Error badge — clicking expands the message and jumps to the first failed block
    const errorBadge = hasError
      ? `<span onclick="window.__agentVis.jumpToError('${msgId}')" title="展开并跳转到第一个错误" style="flex-shrink:0;background:${COLORS.error}22;color:${COLORS.error};border:1px solid ${COLORS.error};border-radius:3px;padding:1px 6px;font-size:10px;font-weight:700;cursor:pointer;margin-right:2px">❌ ${failCount}个错误</span>`
      : '';

    let userContent = '';
    if (isUser && msg.content) {
      userContent = `<div style="padding:6px 12px 8px;font-size:12px;color:${COLORS.text};white-space:pre-wrap;word-break:break-word;line-height:1.5">${markHtml(msg.content)}</div>`;
    }

    const blocksHtml = isExpanded
      ? blocks.map((b, bi) => renderBlock(b, idx, bi)).join('')
      : '';

    return `
      <div style="margin:8px 0;${outerBorder}border-radius:8px;background:${bgColor};${isExpanded ? '' : 'overflow:hidden;'}">
        <div style="display:flex;align-items:center;padding:10px 12px;gap:8px;background:${bgColor};${isExpanded ? `position:sticky;top:0;z-index:3;border-radius:8px 8px 0 0;` : ''}">
          <div onclick="window.__agentVis.toggle('${msgId}')" style="display:flex;align-items:center;flex:1;gap:8px;cursor:pointer;user-select:none;min-width:0">
            <span style="font-size:12px;font-weight:700;color:${leftBorderColor};flex-shrink:0">${roleLabel}</span>
            <span style="font-size:10px;color:${COLORS.textMuted};flex-shrink:0">${formatTime(msg.lastModified)}</span>
            <div style="flex:1;display:flex;flex-wrap:wrap;gap:2px;margin-left:4px">${toolSummary}${subSummary}</div>
          </div>
          ${errorBadge}
          <span onclick="window.__agentVis.toggle('${msgId}')" style="flex-shrink:0;font-size:11px;color:${COLORS.textMuted};cursor:pointer">${isExpanded ? '▲' : '▼'}</span>
          <button onclick="window.__agentVis.showJson('${msgId}')" title="查看原始 JSON" style="flex-shrink:0;background:transparent;border:1px solid ${COLORS.border};color:${COLORS.textMuted};border-radius:3px;padding:1px 6px;cursor:pointer;font-size:10px;font-family:monospace">{}</button>
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
          <div style="width:100px;font-size:11px;color:${color};text-align:right;flex-shrink:0">${toolIcon(name)} ${escHtml(name)}</div>
          <div style="flex:1;background:${COLORS.border};border-radius:3px;height:14px;overflow:hidden">
            <div style="width:${pct}%;height:100%;background:${color};border-radius:3px;transition:width .3s"></div>
          </div>
          <div style="width:30px;font-size:11px;color:${COLORS.text};flex-shrink:0">${val}</div>
        </div>`;
    }).join('');
  }

  function renderPhasesTable(phases, messages) {
    if (!phases.length) {
      return `<div style="color:${COLORS.textMuted};font-size:11px;padding:4px 0">未检测到阶段信息（需含 update-status.mjs 的 Bash 调用）</div>`;
    }

    // Sort according to current phaseSort mode
    // MSG_SPAN_WEIGHT: ensures a 1-message-span phase sorts higher than any realistic
    // millisecond duration (max real session ~10 days = ~864_000_000 ms < 1e9).
    const MSG_SPAN_WEIGHT = 1e9;
    const sorted = [...phases].sort((a, b) => {
      if (phaseSort === 'fail') {
        // Failed phases first, then by duration desc
        if (a.hasFailed !== b.hasFailed) return a.hasFailed ? -1 : 1;
      }
      if (phaseSort === 'alpha') {
        return a.phaseName.localeCompare(b.phaseName, 'zh');
      }
      if (phaseSort === 'start') {
        // Chronological order (by startMsgIdx — always set by extractPhases)
        const ia = a.startMsgIdx != null ? a.startMsgIdx : Infinity;
        const ib = b.startMsgIdx != null ? b.startMsgIdx : Infinity;
        return ia - ib;
      }
      // Default: prefer toolExecTime (most accurate) then wall-clock duration, then msgSpan.
      // Multiply msgSpan by a large constant so it sorts above any ms-based duration
      // while still keeping phases-with-duration ranked among themselves.
      const da = a.toolExecTime !== null ? a.toolExecTime
               : a.duration    !== null ? a.duration
               : (a.msgSpan !== null ? a.msgSpan * MSG_SPAN_WEIGHT : 0);
      const db = b.toolExecTime !== null ? b.toolExecTime
               : b.duration    !== null ? b.duration
               : (b.msgSpan !== null ? b.msgSpan * MSG_SPAN_WEIGHT : 0);
      return db - da;
    });
    // Use toolExecTime when available (most accurate), else wall-clock duration, as the scale max.
    const _maxDur = (() => {
      for (const p of sorted) {
        const v = p.toolExecTime ?? p.duration;
        if (v !== null && v > 0) return v;
      }
      return 1;
    })();

    return sorted.map((p, i) => {
      const phaseId = `phase-${i}`;
      const isExpanded = expandedIds.has(phaseId);
      _jsonStore[phaseId] = p;

      // Progress bar uses the same metric as _maxDur for a consistent scale.
      const barValue = p.toolExecTime ?? p.duration;
      const pct = barValue ? Math.round((barValue / _maxDur) * 100) : 0;
      // Primary label: lastUpdateAt - firstCreateAt (most accurate span of real work)
      // Check in-progress FIRST so null endMsgIdx always shows '进行中' regardless of msgSpan
      const durStr = p.duration !== null ? formatDuration(p.duration)
        : p.endMsgIdx === null ? '进行中'
        : (p.msgSpan !== null && p.msgSpan > 0) ? `${p.msgSpan} 条消息跨度` : '—';
      // Secondary label: sum of individual tool durations (pure execution, no idle gaps)
      const execStr = p.toolExecTime !== null ? formatDuration(p.toolExecTime) : null;
      // Failed phases use error color; otherwise use rank-based color (top = warning, rest = accent)
      const rankColor = p.hasFailed ? COLORS.error
        : (i === 0 ? COLORS.warning : COLORS.accent);
      const outerBorder = p.hasFailed
        ? `border:2px solid ${COLORS.error};`
        : `border:1px solid ${COLORS.border};`;
      const failBadge = p.hasFailed
        ? `<span style="font-size:10px;color:${COLORS.error};font-weight:700;flex-shrink:0">❌ 含失败</span>`
        : '';

      // Path prefix subtitle: show "specify/阶段一" style if we have a prefix
      const pathSubtitle = p.pathPrefix
        ? `<div style="font-size:10px;color:${COLORS.textMuted};margin-top:2px;font-family:monospace">${escHtml(p.pathPrefix)}/${escHtml(p.phaseName)}</div>`
        : '';

      // Collect tool blocks from all messages within this phase's block-level range
      let innerHtml = '';
      if (isExpanded) {
        const start = p.startMsgIdx != null ? p.startMsgIdx : 0;
        const end = p.endMsgIdx != null ? p.endMsgIdx : (messages.length - 1);
        const toolRows = [];
        for (let mi = start; mi <= end && mi < messages.length; mi++) {
          const msg = messages[mi];
          if (!Array.isArray(msg.blocks)) continue;
          // Respect block-level boundaries so the transition Bash call only appears in
          // the NEW phase (startBlockIdx inclusive) and not the old phase (endBlockIdx exclusive).
          const fromBi = (mi === start && p.startBlockIdx != null) ? p.startBlockIdx : 0;
          const toBi   = (mi === end   && p.endBlockIdx   != null) ? p.endBlockIdx - 1 : msg.blocks.length - 1;
          for (let bi = fromBi; bi <= toBi; bi++) {
            const b = msg.blocks[bi];
            if (b.type !== 'tool') continue;
            // Pass createAt/updateAt so each row can show its own execution time
            toolRows.push(renderToolBlock(b, mi, bi, {
              ts: b.createAt || b.updateAt || msg.lastModified || null,
              toolDuration: (b.createAt && b.updateAt && b.updateAt >= b.createAt)
                ? b.updateAt - b.createAt
                : null,
            }));
          }
        }
        innerHtml = toolRows.length
          ? `<div style="padding:4px 0">${toolRows.join('')}</div>`
          : `<div style="padding:8px 0;font-size:11px;color:${COLORS.textMuted}">此阶段无工具调用记录</div>`;
      }

      // When expanded: remove overflow:hidden so position:sticky works on the header.
      // When collapsed: keep overflow:hidden for clean border-radius clipping.
      const outerOverflow = isExpanded ? '' : 'overflow:hidden;';
      // Sticky header: sticks to the top of the #content scroll container when expanded.
      const headerPos = isExpanded
        ? `position:sticky;top:0;z-index:3;border-radius:6px 6px 0 0;`
        : '';

      return `
        <div style="margin:6px 0;background:${COLORS.card};${outerBorder}border-left:3px solid ${rankColor};border-radius:6px;${outerOverflow}">
          <div onclick="window.__agentVis.toggle('${phaseId}')" style="padding:8px 10px;cursor:pointer;user-select:none;background:${COLORS.card};${headerPos}">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:${p.duration ? 4 : 0}px">
              <div style="flex:1;min-width:0">
                <span style="font-size:11px;font-weight:600;color:${COLORS.text}">${escHtml(p.label)}</span>
                ${pathSubtitle}
              </div>
              ${failBadge}
              <div style="text-align:right;flex-shrink:0">
                <div style="font-size:12px;font-weight:700;color:${rankColor}">${durStr}</div>
                ${execStr ? `<div style="font-size:10px;color:${COLORS.textMuted};margin-top:1px" title="工具纯执行耗时（∑ updateAt-createAt，不含空闲等待）">⚙️ ${execStr}</div>` : ''}
              </div>
              <span style="font-size:11px;color:${COLORS.textMuted};flex-shrink:0">${isExpanded ? '▲' : '▼'}</span>
            </div>
            ${(p.duration || p.toolExecTime) ? `<div style="background:${COLORS.border};border-radius:3px;height:5px;overflow:hidden">
              <div style="width:${pct}%;height:100%;background:${rankColor};border-radius:3px"></div>
            </div>` : ''}
          </div>
          ${isExpanded ? `<div style="padding:0 10px 10px;border-top:1px solid ${COLORS.border}">${innerHtml}</div>` : ''}
        </div>`;
    }).join('');
  }

  function renderStatCard(label, value, color) {
    return `
      <div style="background:${COLORS.card};border:1px solid ${COLORS.border};border-radius:8px;padding:10px;text-align:center">
        <div style="font-size:18px;font-weight:700;color:${color}">${escHtml(String(value))}</div>
        <div style="font-size:10px;color:${COLORS.textMuted};margin-top:2px">${label}</div>
      </div>`;
  }

  function renderPerformance(stats, phases, messages) {
    const maxCount = Math.max(...Object.values(stats.toolCounts), 1);

    const sortModes = [
      { id: 'duration', label: '⏱ 耗时' },
      { id: 'start',    label: '🕐 开始' },
      { id: 'alpha',    label: 'A-Z' },
      { id: 'fail',     label: '❌ 失败' },
    ];
    const sortBtns = sortModes.map(s => {
      const active = phaseSort === s.id;
      return `<button onclick="window.__agentVis.setPhaseSort('${s.id}')" style="
        padding:3px 8px;font-size:10px;border-radius:4px;cursor:pointer;
        border:1px solid ${active ? COLORS.accent : COLORS.border};
        background:${active ? COLORS.accent : 'transparent'};
        color:${active ? '#fff' : COLORS.textMuted};
        font-weight:${active ? '700' : '400'};
      ">${s.label}</button>`;
    }).join('');

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
        <div style="margin-bottom:16px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap">
            <span style="font-size:12px;font-weight:600;color:${COLORS.text}">🏁 阶段耗时</span>
            <div style="display:flex;gap:4px;flex-wrap:wrap">${sortBtns}</div>
          </div>
          ${renderPhasesTable(phases, messages)}
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

  /* ─────────────────────────────────────────────
   *  Tab views
   * ───────────────────────────────────────────── */
  let currentTab = 'timeline';
  let phaseSort = 'duration'; // 'duration' | 'start' | 'alpha' | 'fail'

  // ── Search / filter state ──────────────────────
  let searchKeyword = '';
  let searchTimePreset = null; // null | '1h' | '6h' | '12h'
  let sliderFromPct = 0;   // 0–100, % of session duration
  let sliderToPct   = 100; // 0–100
  let _sliderMinTs  = null; // actual timestamp of first message
  let _sliderMaxTs  = null; // actual timestamp of last message

  // ── Search navigation state ───────────────────
  let _markCounter     = 0;   // incremented per <mark> during render
  let searchMatchIndex = -1;  // currently highlighted match
  let searchMatchTotal = 0;   // total matches in last render

  /* ─────────────────────────────────────────────
   *  Search / filter helpers
   * ───────────────────────────────────────────── */

  // Returns true when msg contains kw (case-insensitive) anywhere in its content/blocks.
  function msgMatchesKeyword(msg, kw) {
    if (msg.content && msg.content.toLowerCase().includes(kw)) return true;
    function checkBlocks(blocks) {
      if (!Array.isArray(blocks)) return false;
      for (const b of blocks) {
        if (b.type === 'text' && b.content && b.content.toLowerCase().includes(kw)) return true;
        if (b.type === 'tool') {
          if ((b.name || '').toLowerCase().includes(kw)) return true;
          if ((b.shortResult || '').toLowerCase().includes(kw)) return true;
          if ((b.error || '').toLowerCase().includes(kw)) return true;
          const p = typeof b.parameters === 'string' ? b.parameters
            : (b.parameters ? JSON.stringify(b.parameters) : b.compactParams || '');
          if (p.toLowerCase().includes(kw)) return true;
          const r = typeof b.result === 'string' ? b.result
            : (b.result ? JSON.stringify(b.result) : '');
          if (r.toLowerCase().includes(kw)) return true;
        }
        if (b.type === 'subagent') {
          if ((b.subagentName || '').toLowerCase().includes(kw)) return true;
          if (b.configuration && (b.configuration.description || '').toLowerCase().includes(kw)) return true;
          if (checkBlocks(b.blocks)) return true;
        }
      }
      return false;
    }
    return checkBlocks(msg.blocks);
  }

  // Returns [{msg, idx}] preserving original indices so block IDs stay correct.
  function filterMessages(messages) {
    // Update slider bounds from current message timestamps.
    const times = messages.map(m => m.lastModified).filter(Boolean);
    _sliderMinTs = times.length ? Math.min(...times) : null;
    _sliderMaxTs = times.length ? Math.max(...times) : null;

    let pairs = messages.map((msg, idx) => ({ msg, idx }));

    // Time filter: preset or slider
    if (searchTimePreset) {
      const msMap = { '1h': 3600000, '6h': 21600000, '12h': 43200000 };
      const cutoff = Date.now() - (msMap[searchTimePreset] || 0);
      pairs = pairs.filter(({ msg }) => !msg.lastModified || msg.lastModified >= cutoff);
    } else if (_sliderMinTs && _sliderMaxTs && (sliderFromPct > 0 || sliderToPct < 100)) {
      const range = _sliderMaxTs - _sliderMinTs;
      const from = _sliderMinTs + range * sliderFromPct / 100;
      const to   = _sliderMinTs + range * sliderToPct   / 100;
      pairs = pairs.filter(({ msg }) => {
        if (!msg.lastModified) return true;
        return msg.lastModified >= from && msg.lastModified <= to;
      });
    }

    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      pairs = pairs.filter(({ msg }) => msgMatchesKeyword(msg, kw));
    }

    return pairs;
  }

  // escHtml + wrap keyword matches with <mark id="ID-mark-N"> spans.
  // Uses global searchKeyword; increments _markCounter per match.
  function markHtml(str) {
    if (!str) return '';
    const kw = searchKeyword.trim().toLowerCase();
    if (!kw) return escHtml(str);
    const lower = str.toLowerCase();
    const result = [];
    let last = 0;
    let pos;
    while ((pos = lower.indexOf(kw, last)) !== -1) {
      if (pos > last) result.push(escHtml(str.slice(last, pos)));
      const mi = _markCounter++;
      result.push(
        `<mark id="${ID}-mark-${mi}" data-search-match="${mi}" style="`
        + `background:${COLORS.accent}40;color:${COLORS.accent};border-radius:2px;padding:0 1px`
        + `">${escHtml(str.slice(pos, pos + kw.length))}</mark>`
      );
      last = pos + kw.length;
    }
    if (last < str.length) result.push(escHtml(str.slice(last)));
    return result.join('');
  }

  // Ensure all matched messages (and subagents on the path to a keyword) are expanded.
  function autoExpandForKeyword(filtered) {
    if (!searchKeyword.trim()) return;
    const kw = searchKeyword.trim().toLowerCase();
    function expandPath(idxStr, blocks) {
      if (!Array.isArray(blocks)) return;
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        if (b.type === 'subagent' && Array.isArray(b.blocks)) {
          if (msgMatchesKeyword({ content: b.subagentName, blocks: b.blocks }, kw) ||
              (b.configuration && (b.configuration.description || '').toLowerCase().includes(kw))) {
            expandedIds.add(`subagent-${idxStr}-${i}`);
            expandPath(`${idxStr}-sub-${i}`, b.blocks);
          }
        }
      }
    }
    for (const { msg, idx } of filtered) {
      expandedIds.add(`msg-${idx}`);
      expandPath(String(idx), msg.blocks);
    }
  }

  // Navigate to prev (-1) or next (+1) search match.
  function navigateSearch(delta) {
    if (searchMatchTotal === 0) return;
    if (searchMatchIndex === -1 && delta < 0) searchMatchIndex = 0;
    searchMatchIndex = ((searchMatchIndex + delta) + searchMatchTotal) % searchMatchTotal;
    highlightCurrentMatch();
    updateSearchNav();
  }

  // Apply visual highlight to the current match and scroll it into view.
  function highlightCurrentMatch() {
    document.querySelectorAll(`[data-search-match]`).forEach(el => {
      el.style.background = `${COLORS.accent}40`;
      el.style.color = COLORS.accent;
      el.style.outline = '';
    });
    if (searchMatchIndex < 0 || searchMatchTotal === 0) return;
    const mark = document.getElementById(`${ID}-mark-${searchMatchIndex}`);
    if (!mark) return;
    mark.style.background = COLORS.accent;
    mark.style.color = '#fff';
    mark.style.outline = `2px solid ${COLORS.accentHover}`;
    const contentEl = document.getElementById(`${ID}-content`);
    if (contentEl) {
      const mr = mark.getBoundingClientRect();
      const cr = contentEl.getBoundingClientRect();
      if (mr.top < cr.top || mr.bottom > cr.bottom) {
        mark.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  // Refresh the search nav UI (count label + button states) and slider fill/labels.
  function updateSearchNav() {
    const navCount = document.getElementById(`${ID}-nav-count`);
    const prevBtn  = document.getElementById(`${ID}-nav-prev`);
    const nextBtn  = document.getElementById(`${ID}-nav-next`);
    if (navCount) {
      const kw = searchKeyword.trim();
      if (kw && searchMatchTotal > 0) {
        const cur = searchMatchIndex >= 0 ? searchMatchIndex + 1 : '—';
        navCount.textContent = `${cur}/${searchMatchTotal}`;
        navCount.style.color = COLORS.accent;
      } else if (kw) {
        navCount.textContent = '0 结果';
        navCount.style.color = COLORS.error;
      } else {
        navCount.textContent = '';
      }
    }
    if (prevBtn) prevBtn.disabled = searchMatchTotal === 0;
    if (nextBtn) nextBtn.disabled = searchMatchTotal === 0;
  }

  // Refresh preset-button highlights and slider fill/labels.
  function updateFilterBarState() {
    [null, '1h', '6h', '12h'].forEach(pid => {
      const btn = document.getElementById(`${ID}-preset-${pid ?? 'all'}`);
      if (!btn) return;
      const isSliderDefault = sliderFromPct === 0 && sliderToPct === 100;
      const active = searchTimePreset === pid && (pid !== null || isSliderDefault);
      btn.style.background   = active ? COLORS.accent : 'transparent';
      btn.style.color        = active ? '#fff' : COLORS.textMuted;
      btn.style.borderColor  = active ? COLORS.accent : COLORS.border;
    });
    updateSliderFill();
    updateSearchNav();
  }

  // Recompute and apply the slider fill div width/position and time labels.
  function updateSliderFill() {
    const fill = document.getElementById(`${ID}-slider-fill`);
    if (fill) {
      fill.style.left  = `${sliderFromPct}%`;
      fill.style.width = `${sliderToPct - sliderFromPct}%`;
    }
    const fromLbl = document.getElementById(`${ID}-slider-from-label`);
    const toLbl   = document.getElementById(`${ID}-slider-to-label`);
    if (_sliderMinTs && _sliderMaxTs) {
      const range = _sliderMaxTs - _sliderMinTs;
      const fromTs = _sliderMinTs + range * sliderFromPct / 100;
      const toTs   = _sliderMinTs + range * sliderToPct   / 100;
      if (fromLbl) fromLbl.textContent = formatTime(fromTs);
      if (toLbl)   toLbl.textContent   = formatTime(toTs);
    } else {
      if (fromLbl) fromLbl.textContent = '';
      if (toLbl)   toLbl.textContent   = '';
    }
    // Sync the actual input values
    const fromSlider = document.getElementById(`${ID}-slider-from`);
    const toSlider   = document.getElementById(`${ID}-slider-to`);
    if (fromSlider) fromSlider.value = sliderFromPct;
    if (toSlider)   toSlider.value   = sliderToPct;
  }

  // Build the persistent filter bar DOM element (created once in createPanel).
  function createFilterBar() {
    const bar = document.createElement('div');
    bar.id = `${ID}-filter-bar`;
    bar.style.cssText = `
      padding:8px 12px 7px;background:${COLORS.bg};
      border-bottom:1px solid ${COLORS.border};flex-shrink:0;
    `;

    // ── Row 1: keyword input + nav ───────────────
    const searchRow = document.createElement('div');
    searchRow.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:6px;';

    const searchWrap = document.createElement('div');
    searchWrap.style.cssText = `
      flex:1;display:flex;align-items:center;gap:4px;
      background:${COLORS.card};border:1px solid ${COLORS.border};
      border-radius:4px;padding:3px 8px;
    `;

    const searchIcon = document.createElement('span');
    searchIcon.textContent = '🔍';
    searchIcon.style.cssText = 'font-size:12px;flex-shrink:0;opacity:0.6;';

    const searchInput = document.createElement('input');
    searchInput.id = `${ID}-search-input`;
    searchInput.type = 'text';
    searchInput.placeholder = '关键字搜索（Enter 跳转下一个）…';
    searchInput.style.cssText = `
      flex:1;background:transparent;border:none;color:${COLORS.text};
      font-size:12px;outline:none;min-width:0;
    `;
    searchInput.addEventListener('input', e => {
      searchKeyword = e.target.value;
      searchMatchIndex = -1;
      rerenderContent();        // rebuilds HTML + updates _markCounter / searchMatchTotal
      updateFilterBarState();
    });
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        navigateSearch(e.shiftKey ? -1 : 1);
      }
    });

    searchWrap.appendChild(searchIcon);
    searchWrap.appendChild(searchInput);

    // Prev / Next buttons
    const navBtnCss = `
      flex-shrink:0;background:transparent;border:1px solid ${COLORS.border};
      color:${COLORS.textMuted};cursor:pointer;font-size:11px;border-radius:3px;
      padding:2px 6px;white-space:nowrap;
    `;

    const prevBtn = document.createElement('button');
    prevBtn.id = `${ID}-nav-prev`;
    prevBtn.title = '上一个 (Shift+Enter)';
    prevBtn.textContent = '◀';
    prevBtn.style.cssText = navBtnCss;
    prevBtn.disabled = true;
    prevBtn.addEventListener('click', () => navigateSearch(-1));

    const nextBtn = document.createElement('button');
    nextBtn.id = `${ID}-nav-next`;
    nextBtn.title = '下一个 (Enter)';
    nextBtn.textContent = '▶';
    nextBtn.style.cssText = navBtnCss;
    nextBtn.disabled = true;
    nextBtn.addEventListener('click', () => navigateSearch(1));

    const navCount = document.createElement('span');
    navCount.id = `${ID}-nav-count`;
    navCount.style.cssText = `flex-shrink:0;font-size:11px;min-width:50px;text-align:center;color:${COLORS.textMuted};`;

    const clearBtn = document.createElement('button');
    clearBtn.textContent = '清除';
    clearBtn.style.cssText = navBtnCss;
    clearBtn.addEventListener('click', () => {
      searchKeyword = '';
      searchTimePreset = null;
      sliderFromPct = 0;
      sliderToPct   = 100;
      searchMatchIndex = -1;
      const si = document.getElementById(`${ID}-search-input`);
      if (si) si.value = '';
      rerenderContent();
      updateFilterBarState();
    });

    searchRow.appendChild(searchWrap);
    searchRow.appendChild(prevBtn);
    searchRow.appendChild(navCount);
    searchRow.appendChild(nextBtn);
    searchRow.appendChild(clearBtn);

    // ── Row 2: time presets + dual-range slider ──
    const timeRow = document.createElement('div');
    timeRow.style.cssText = 'display:flex;align-items:center;gap:6px;flex-wrap:wrap;';

    // Preset buttons
    [
      { pid: null,  label: '全部' },
      { pid: '1h',  label: '1小时' },
      { pid: '6h',  label: '6小时' },
      { pid: '12h', label: '12小时' },
    ].forEach(({ pid, label }) => {
      const btn = document.createElement('button');
      btn.id = `${ID}-preset-${pid ?? 'all'}`;
      btn.textContent = label;
      btn.style.cssText = `
        padding:2px 7px;font-size:11px;border-radius:3px;cursor:pointer;flex-shrink:0;
        border:1px solid ${COLORS.border};background:transparent;
        color:${COLORS.textMuted};transition:all .15s;white-space:nowrap;
      `;
      btn.addEventListener('click', () => {
        searchTimePreset = pid;
        // Map preset to slider range
        if (pid === null) {
          sliderFromPct = 0;
          sliderToPct   = 100;
        } else if (_sliderMinTs && _sliderMaxTs) {
          const msMap = { '1h': 3600000, '6h': 21600000, '12h': 43200000 };
          const range  = _sliderMaxTs - _sliderMinTs;
          const cutoff = Date.now() - msMap[pid];
          sliderFromPct = range > 0 ? Math.max(0, Math.round((cutoff - _sliderMinTs) / range * 100)) : 0;
          sliderToPct   = 100;
        }
        rerenderContent();
        updateFilterBarState();
      });
      timeRow.appendChild(btn);
    });

    // Dual-range slider
    const sliderWrap = document.createElement('div');
    sliderWrap.style.cssText = 'flex:1;min-width:80px;display:flex;flex-direction:column;gap:2px;';

    const sliderTrackWrap = document.createElement('div');
    sliderTrackWrap.style.cssText = 'position:relative;height:20px;';

    const track = document.createElement('div');
    track.style.cssText = `
      position:absolute;left:0;right:0;top:50%;height:4px;
      transform:translateY(-50%);background:${COLORS.border};border-radius:2px;
    `;

    const fill = document.createElement('div');
    fill.id = `${ID}-slider-fill`;
    fill.style.cssText = `
      position:absolute;top:0;height:100%;background:${COLORS.accent};
      border-radius:2px;left:0%;width:100%;
    `;
    track.appendChild(fill);

    const sliderInputCss = `
      position:absolute;width:100%;height:100%;top:0;left:0;margin:0;padding:0;
      -webkit-appearance:none;appearance:none;background:transparent;
      pointer-events:none;outline:none;
    `;

    const fromSlider = document.createElement('input');
    fromSlider.type  = 'range';
    fromSlider.id    = `${ID}-slider-from`;
    fromSlider.min   = '0';
    fromSlider.max   = '100';
    fromSlider.value = '0';
    fromSlider.style.cssText = sliderInputCss + `z-index:3;`;
    fromSlider.addEventListener('input', () => {
      let v = parseInt(fromSlider.value, 10);
      if (v > sliderToPct - 1) { v = sliderToPct - 1; fromSlider.value = v; }
      sliderFromPct = v;
      searchTimePreset = null;
      updateSliderFill();
      rerenderContent();
      updateFilterBarState();
    });

    const toSlider = document.createElement('input');
    toSlider.type  = 'range';
    toSlider.id    = `${ID}-slider-to`;
    toSlider.min   = '0';
    toSlider.max   = '100';
    toSlider.value = '100';
    toSlider.style.cssText = sliderInputCss + `z-index:4;`;
    toSlider.addEventListener('input', () => {
      let v = parseInt(toSlider.value, 10);
      if (v < sliderFromPct + 1) { v = sliderFromPct + 1; toSlider.value = v; }
      sliderToPct = v;
      searchTimePreset = null;
      updateSliderFill();
      rerenderContent();
      updateFilterBarState();
    });

    sliderTrackWrap.appendChild(track);
    sliderTrackWrap.appendChild(fromSlider);
    sliderTrackWrap.appendChild(toSlider);

    // Time labels below slider
    const labelsRow = document.createElement('div');
    labelsRow.style.cssText = 'display:flex;justify-content:space-between;';
    const fromLbl = document.createElement('span');
    fromLbl.id = `${ID}-slider-from-label`;
    fromLbl.style.cssText = `font-size:10px;color:${COLORS.textMuted};`;
    const toLbl = document.createElement('span');
    toLbl.id = `${ID}-slider-to-label`;
    toLbl.style.cssText = `font-size:10px;color:${COLORS.textMuted};text-align:right;`;
    labelsRow.appendChild(fromLbl);
    labelsRow.appendChild(toLbl);

    sliderWrap.appendChild(sliderTrackWrap);
    sliderWrap.appendChild(labelsRow);
    timeRow.appendChild(sliderWrap);

    bar.appendChild(searchRow);
    bar.appendChild(timeRow);

    return bar;
  }

  function renderTimeline(indexedMsgs) {
    if (indexedMsgs.length === 0) {
      return `<div style="padding:24px;text-align:center;color:${COLORS.textMuted};font-size:13px">🔍 无匹配结果</div>`;
    }
    return `<div style="padding:8px">${indexedMsgs.map(({ msg, idx }) => renderMessage(msg, idx)).join('')}</div>`;
  }

  // Returns true if a message contains at least one AskUserQuestion (any depth)
  function msgHasAskQuestion(msg) {
    function check(blocks) {
      if (!Array.isArray(blocks)) return false;
      for (const b of blocks) {
        if (b.type === 'tool' && b.name === 'AskUserQuestion') return true;
        if (b.type === 'subagent' && check(b.blocks)) return true;
      }
      return false;
    }
    return check(msg.blocks);
  }

  // 交互 tab: show only messages containing AskUserQuestion, plus the immediately
  // following user reply. indexedMsgs is the filtered [{msg,idx}] set;
  // allMessages is the full array so we can find the adjacent reply.
  function renderInteractions(indexedMsgs, allMessages) {
    const items = [];
    const seenIdx = new Set();

    for (const { msg, idx } of indexedMsgs) {
      if (msgHasAskQuestion(msg)) {
        if (!seenIdx.has(idx)) { items.push({ msg, idx }); seenIdx.add(idx); }
        // Also include the immediately following user message (the answer), looked up
        // from the full allMessages array so it's included even if it wasn't in the filter.
        const next = allMessages[idx + 1];
        if (next && next.role === 'user' && !seenIdx.has(idx + 1)) {
          items.push({ msg: next, idx: idx + 1 });
          seenIdx.add(idx + 1);
        }
      }
    }

    if (items.length === 0) {
      return `<div style="padding:24px;text-align:center;color:${COLORS.textMuted};font-size:13px">暂无用户交互记录</div>`;
    }
    return `<div style="padding:8px">${items.map(({ msg, idx }) => renderMessage(msg, idx)).join('')}</div>`;
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
    // Reset per-render state so IDs stay consistent
    _textIdCounter = 0;
    _markCounter   = 0;
    Object.keys(_textStore).forEach(k => delete _textStore[k]);
    Object.keys(_jsonStore).forEach(k => delete _jsonStore[k]);

    const stats = computeStats(messages);
    const phases = extractPhases(messages);
    const filtered = filterMessages(messages); // [{msg, idx}]

    // Auto-expand messages/subagents that contain the keyword so highlights are visible.
    if (searchKeyword.trim()) autoExpandForKeyword(filtered);

    let bodyHtml = '';
    if (currentTab === 'timeline') bodyHtml = renderTimeline(filtered);
    else if (currentTab === 'interactions') bodyHtml = renderInteractions(filtered, messages);
    else if (currentTab === 'performance') bodyHtml = renderPerformance(stats, phases, messages);

    // Record total matches found during this render.
    searchMatchTotal = _markCounter;
    // Clamp the active index in case matches shrank.
    if (searchMatchIndex >= searchMatchTotal) searchMatchIndex = searchMatchTotal - 1;

    return { bodyHtml, stats };
  }

  function rerenderContent() {
    const contentEl = document.getElementById(`${ID}-content`);
    if (!contentEl) return;
    const scrollTop = contentEl.scrollTop;
    const messages = fetchMessages() || [];
    const { bodyHtml } = buildContent(messages);
    contentEl.innerHTML = bodyHtml;
    contentEl.scrollTop = Math.min(scrollTop, contentEl.scrollHeight - contentEl.clientHeight);
    updateSearchNav();
    // Re-apply highlight to current match after DOM rebuild.
    if (searchMatchIndex >= 0) highlightCurrentMatch();
  }

  /* ─────────────────────────────────────────────
   *  Panel creation
   * ───────────────────────────────────────────── */
  let panelVisible = false;
  let panelEl = null;
  let toggleBtnEl = null;
  let _autoRefreshTimer = null;
  let _dataCheckTimer   = null;
  const AUTO_REFRESH_MS  = 10000;
  const DATA_CHECK_MS    = 2000;

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
      transition:all .2s;display:none;align-items:center;justify-content:center;
    `;
    btn.addEventListener('mouseenter', () => { btn.style.transform = 'scale(1.1)'; });
    btn.addEventListener('mouseleave', () => { btn.style.transform = 'scale(1)'; });
    btn.addEventListener('click', togglePanel);
    document.body.appendChild(btn);
    return btn;
  }

  // Poll for specStore data; show/hide toggle button accordingly.
  function startDataCheck() {
    if (_dataCheckTimer !== null) return;
    const check = () => {
      const hasData = !!(fetchMessages()?.length);
      const btn = document.getElementById(`${ID}-toggle`);
      if (btn) btn.style.display = hasData ? 'flex' : 'none';
      // If data disappears while panel is open, close the panel.
      if (!hasData && panelVisible) window.__agentVis.close();
    };
    check();
    _dataCheckTimer = setInterval(check, DATA_CHECK_MS);
  }

  function createPanel() {
    const panel = document.createElement('div');
    panel.id = `${ID}-panel`;
    panel.style.cssText = `
      position:fixed;top:0;right:0;bottom:0;z-index:2147483646;
      width:520px;max-width:100vw;
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
    panel.appendChild(createFilterBar());   // filter bar is ABOVE tabs
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
      const scrollTop = contentEl.scrollTop;
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
        contentEl.scrollTop = Math.min(scrollTop, contentEl.scrollHeight - contentEl.clientHeight);
      }
    }
    // Sync filter bar UI (preset highlights, slider fill/labels, nav count)
    updateFilterBarState();
    if (searchMatchIndex >= 0) highlightCurrentMatch();
  }

  function startAutoRefresh() {
    stopAutoRefresh();
    _autoRefreshTimer = setInterval(() => {
      if (panelVisible) renderPanel();
    }, AUTO_REFRESH_MS);
  }

  function stopAutoRefresh() {
    if (_autoRefreshTimer !== null) {
      clearInterval(_autoRefreshTimer);
      _autoRefreshTimer = null;
    }
  }

  function togglePanel() {
    panelVisible = !panelVisible;
    if (panelEl) {
      panelEl.style.transform = panelVisible ? 'translateX(0)' : 'translateX(100%)';
    }
    if (panelVisible) {
      renderPanel();
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  }

  // Close panel when user clicks outside it.
  function onDocumentClick(e) {
    if (!panelVisible) return;
    const panel  = document.getElementById(`${ID}-panel`);
    const toggle = document.getElementById(`${ID}-toggle`);
    const jsonOv = document.getElementById(`${ID}-json-overlay`);
    if (
      (panel  && panel.contains(e.target))  ||
      (toggle && toggle.contains(e.target)) ||
      (jsonOv && jsonOv.contains(e.target))
    ) return;
    window.__agentVis.close();
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
      renderPanel();
    },
    close() {
      panelVisible = false;
      if (panelEl) panelEl.style.transform = 'translateX(100%)';
      stopAutoRefresh();
    },
    navigate(delta) {
      navigateSearch(delta);
    },
    toggleText(id) {
      const span = document.getElementById(`${ID}-text-preview-${id}`);
      const btn = document.getElementById(`${ID}-text-toggle-${id}`);
      if (!span || !btn) return;
      const stored = _textStore[id];
      if (!stored) return;
      if (btn.textContent.includes('展开')) {
        // Use innerHTML + highlightText so keyword marks are preserved on expand.
        span.innerHTML = highlightText(stored.full);
        btn.textContent = ' [收起]';
      } else {
        span.innerHTML = highlightText(stored.preview);
        // Re-append the ellipsis indicator
        const ellipsis = document.createElement('span');
        ellipsis.style.color = COLORS.textMuted;
        ellipsis.textContent = '...';
        span.appendChild(ellipsis);
        btn.textContent = ' [展开]';
      }
    },
    showJson(id) {
      showJsonOverlay(id);
    },
    setPhaseSort(mode) {
      phaseSort = mode;
      rerenderContent();
    },
    jumpToError(id) {
      // Expand the message
      expandedIds.add(id);
      const idx = parseInt(id.replace('msg-', ''), 10);
      const messages = fetchMessages();
      const msg = messages && messages[idx];

      // Recursively expand subagent blocks on the path to the first error so
      // their inner tool blocks are rendered into the DOM before we scroll.
      // Returns true when an error was found under the given block list.
      function expandErrorPath(idxStr, blocks) {
        if (!Array.isArray(blocks)) return false;
        for (let i = 0; i < blocks.length; i++) {
          const b = blocks[i];
          if (b.type === 'tool' && (b.success === false || b.error)) return true;
          if (b.type === 'subagent' && Array.isArray(b.blocks)) {
            if (expandErrorPath(`${idxStr}-sub-${i}`, b.blocks)) {
              expandedIds.add(`subagent-${idxStr}-${i}`);
              return true;
            }
          }
        }
        return false;
      }
      if (msg) expandErrorPath(String(idx), msg.blocks);

      rerenderContent();
      // After re-render, find the first [data-fail] block scoped to this message and scroll to it
      requestAnimationFrame(() => {
        const failBlock = document.querySelector(`[id^="${ID}-block-tool-${idx}-"][data-fail="true"]`);
        if (failBlock) {
          failBlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    },
  };

  /* ─────────────────────────────────────────────
   *  Initialization
   * ───────────────────────────────────────────── */
  function init() {
    const style = document.createElement('style');
    style.textContent = `
      #${ID}-content::-webkit-scrollbar { width: 4px; }
      #${ID}-content::-webkit-scrollbar-track { background: transparent; }
      #${ID}-content::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 2px; }
      #${ID}-json-overlay pre::-webkit-scrollbar { width: 5px; height: 5px; }
      #${ID}-json-overlay pre::-webkit-scrollbar-track { background: transparent; }
      #${ID}-json-overlay pre::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 2px; }

      /* Dual-range slider thumb styling */
      #${ID}-slider-from::-webkit-slider-thumb,
      #${ID}-slider-to::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none;
        width: 14px; height: 14px; border-radius: 50%;
        background: ${COLORS.accent}; border: 2px solid #fff;
        cursor: pointer; pointer-events: all;
        box-shadow: 0 1px 4px rgba(0,0,0,.4);
      }
      #${ID}-slider-from::-moz-range-thumb,
      #${ID}-slider-to::-moz-range-thumb {
        width: 14px; height: 14px; border-radius: 50%;
        background: ${COLORS.accent}; border: 2px solid #fff;
        cursor: pointer; pointer-events: all;
      }
    `;
    document.head.appendChild(style);

    toggleBtnEl = createToggleButton();
    panelEl = createPanel();

    // Click anywhere outside the panel to auto-close it.
    document.addEventListener('click', onDocumentClick, true);

    // Show the toggle button only when specStore data is available.
    startDataCheck();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
