// BatteryChem-AI V3 — Chat via Cloudflare Worker → DeepSeek (SSE Streaming)

const CHAT_PROXY_URL = 'https://batterychem-proxy.guoweiwang27.workers.dev/chat';

const Chat = {
  init() {
    this.bindEvents();
    this.hideKeyUI();
  },

  hideKeyUI() {
    // Key is server-side now; hide the key input section
    const section = document.getElementById('api-key-section');
    if (section) section.style.display = 'none';
  },

  bindEvents() {
    document.getElementById('send-btn')?.addEventListener('click', () => this.sendMessage());
    document.getElementById('chat-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendMessage(); }
    });

    document.querySelectorAll('.quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById('chat-input');
        if (input) input.value = btn.textContent.trim();
        this.sendMessage();
      });
    });
  },

  addMessage(role, text) {
    const container = document.getElementById('chat-msgs');
    if (!container) return null;
    const div = document.createElement('div');
    div.className = 'msg ' + (role === 'user' ? 'user' : 'ai');

    const av = document.createElement('div');
    av.className = 'msg-av ' + (role === 'user' ? 'user-av' : 'ai-av');
    av.innerHTML = role === 'user'
      ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
      : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>';

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.innerHTML = text;
    div.appendChild(av); div.appendChild(bubble);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return bubble;
  },

  _buildContext() {
    const pred = (typeof currentPrediction !== 'undefined') ? currentPrediction : null;
    if (!pred || pred === 'smiles_fallback') return '';

    return [
      '【当前配方预测结果】',
      `溶剂体系: ${pred.solvent_display || 'N/A'}`,
      `锂盐: ${pred.salt || 'N/A'}`,
      `添加剂: ${pred.additive_display || 'N/A'}, 浓度: ${pred.conc || 'N/A'} wt%`,
      `预测电导率: ${pred.conductivity || 'N/A'} mS/cm`,
      `稳定性窗口: ${pred.stability || 'N/A'} V`,
      `SEI 类型: ${pred.sei_type || 'N/A'}`,
      `数据质量: ${pred.quality || 'N/A'} 级`,
      `置信度: ${(pred.confidence || 0) * 100}%`,
    ].join('\n');
  },

  async sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input?.value.trim();
    if (!text) return;

    this.addMessage('user', text);
    if (input) input.value = '';

    const bubble = this.addMessage('ai', '<span class="streaming-cursor">▊</span>');
    let fullText = '';

    const context = this._buildContext();
    const userContent = context
      ? context + '\n\n用户问题: ' + text
      : text;

    try {
      const response = await fetch(CHAT_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'deepseek-v4-flash',
          stream: true,
          messages: [{
            role: 'system',
            content: `你是 BatteryChem-AI 的电解液研究助手。用户消息中可能包含当前配方的预测结果。如果用户问"分析这个结果""怎么看"等，基于提供的预测数据进行电化学分析。回答简洁专业，用与用户相同的语言。`
          }, {
            role: 'user',
            content: userContent
          }]
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const msg = err.error?.message || `HTTP ${response.status}`;
        bubble.innerHTML = '<span style="color:var(--thermal-red)">错误：' + msg + '</span>';
        return;
      }

      // OpenAI-compatible SSE streaming
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.slice(6).trim();
          if (!dataStr || dataStr === '[DONE]') continue;

          try {
            const event = JSON.parse(dataStr);
            const delta = event.choices?.[0]?.delta?.content;
            if (delta) {
              fullText += delta;
              const html = this._renderMarkdown(fullText);
              bubble.innerHTML = html + '<span class="streaming-cursor">▊</span>';
            }
          } catch (e) { /* skip */ }
        }

        const container = document.getElementById('chat-msgs');
        if (container) container.scrollTop = container.scrollHeight;
      }

      // Remove cursor
      if (bubble.innerHTML.includes('streaming-cursor')) {
        bubble.innerHTML = this._renderMarkdown(fullText);
      }

      // Chart injection
      Chat.injectCharts(bubble, fullText);

    } catch (err) {
      bubble.innerHTML = '<span style="color:var(--thermal-red)">网络错误：' + err.message + '</span>';
    }
  },

  _renderMarkdown(text) {
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  },

  injectCharts(bubble, text) {
    const condMatch = text.match(/(?:σ\s*[=：:]\s*|conductivity\s*(?:of\s*)?(?:is\s*)?)(\d+\.?\d*)\s*(?:mS\/cm)?/i);
    if (!condMatch) return;

    const condVal = parseFloat(condMatch[1]);
    const stabMatch = text.match(/(?:stability|window).*?(\d+\.?\d*)\s*V/i);
    const stabVal = stabMatch ? parseFloat(stabMatch[1]) : 4.0;
    const confMatch = text.match(/(?:confidence|conf).*?(\d+)\s*%/i);
    const confVal = confMatch ? parseInt(confMatch[1]) / 100 : 0.75;

    const chartId = 'chat-chart-' + Date.now();
    const chartDiv = document.createElement('div');
    chartDiv.id = chartId;
    chartDiv.style.cssText = 'width:100%;height:220px;margin-top:10px;background:white;border-radius:8px;border:1px solid var(--border-light);padding:6px';
    bubble.appendChild(chartDiv);

    setTimeout(() => {
      if (!document.getElementById(chartId)) return;
      const labels = ['Conductivity', 'Stability', 'Viscosity', 'Cross-Gap', 'Dosage'];
      const vals = [
        Math.min(1, condVal / 16), Math.min(1, stabVal / 5),
        Math.min(1, 0.4 + confVal * 0.6), Math.min(1, confVal),
        Math.min(1, 0.3 + confVal * 0.4)
      ];
      Plotly.newPlot(chartId, [{
        type: 'scatterpolar', r: vals.concat([vals[0]]), theta: labels.concat([labels[0]]),
        fill: 'toself', fillcolor: 'rgba(108,92,231,0.08)',
        line: { color: '#6C5CE7', width: 2 }, marker: { color: '#6C5CE7', size: 6 }
      }], {
        polar: { radialaxis: { range: [0,1], showticklabels: false } },
        margin: { t: 10, r: 30, b: 30, l: 30 },
        paper_bgcolor: 'transparent', showlegend: false
      }, { responsive: true, displayModeBar: false });
    }, 100);
  }
};

const cursorStyle = document.createElement('style');
cursorStyle.textContent = '@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} } .streaming-cursor { animation: blink 0.8s infinite; color: var(--cardinal-red); }';
document.head.appendChild(cursorStyle);
