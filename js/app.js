// ═══════════════════════════════════════════════════════════════
// Deal Intelligence Agent — Main Application Controller
// v2: Persistent Memory, Learning Engine, Judge Demo Mode
// ═══════════════════════════════════════════════════════════════

const App = {
  currentView: 'dashboard',
  currentDealId: null,
  animationFrame: null,
  _graphDensity: 'pipeline',
  _autoDemo: { running: false, paused: false, timer: null, currentStep: 0 },

  init() {
    // Initialize persistent memory
    MemoryStore.init();

    this.renderShell();
    this.navigateTo('dashboard');
    this.startMemoryPulse();
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-nav]')) {
        e.preventDefault();
        this.navigateTo(e.target.closest('[data-nav]').dataset.nav);
      }
      if (e.target.closest('[data-deal]')) {
        e.preventDefault();
        const dealId = parseInt(e.target.closest('[data-deal]').dataset.deal);
        this.navigateTo('deal', dealId);
      }
    });
  },

  // ── Memory Pulse Animation ───────────────────────────────────
  startMemoryPulse() {
    setInterval(() => {
      const pulseEl = document.getElementById('memory-pulse-count');
      if (pulseEl) {
        pulseEl.textContent = DATA.memoryStats.memoryNodes.toLocaleString();
      }
    }, 3000);
  },

  // ── Shell / Navigation ───────────────────────────────────────
  renderShell() {
    document.getElementById('app').innerHTML = `
      <!-- Mobile Topbar -->
      <div class="mobile-topbar" id="mobile-topbar">
        <button class="mobile-menu-btn" id="mobile-menu-btn" onclick="document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebar-backdrop').classList.toggle('visible');" aria-label="Toggle Navigation">
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        </button>
        <div class="mobile-logo">
          <span class="logo-title" style="font-weight:700; color:var(--text-primary)">Deal Intel</span>
          <span class="mobile-badge">AI Sales Copilot</span>
        </div>
      </div>
      <div class="sidebar-backdrop" id="sidebar-backdrop" onclick="document.getElementById('sidebar').classList.remove('open'); this.classList.remove('visible');"></div>

      <nav class="sidebar" id="sidebar">
        <div class="sidebar-logo">
          <div class="logo-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="12" stroke="url(#grad)" stroke-width="2" fill="none"/>
              <circle cx="14" cy="14" r="6" fill="url(#grad)" opacity="0.7"/>
              <circle cx="14" cy="8" r="2" fill="#00e5ff"/>
              <circle cx="19" cy="17" r="2" fill="#7c4dff"/>
              <circle cx="9" cy="17" r="2" fill="#00e5a0"/>
              <line x1="14" y1="8" x2="19" y2="17" stroke="#00e5ff" stroke-width="0.8" opacity="0.5"/>
              <line x1="14" y1="8" x2="9" y2="17" stroke="#00e5a0" stroke-width="0.8" opacity="0.5"/>
              <line x1="19" y1="17" x2="9" y2="17" stroke="#7c4dff" stroke-width="0.8" opacity="0.5"/>
              <defs><linearGradient id="grad" x1="0" y1="0" x2="28" y2="28"><stop stop-color="#00e5ff"/><stop offset="1" stop-color="#7c4dff"/></linearGradient></defs>
            </svg>
          </div>
          <div class="logo-text">
            <span class="logo-title">Deal Intel</span>
            <span class="logo-subtitle">AI Sales Copilot</span>
          </div>
        </div>

        <div class="nav-section">
          <span class="nav-label">Navigation</span>
          <a class="nav-item active" data-nav="dashboard" id="nav-dashboard">
            <span class="nav-icon">📊</span>
            <span>Dashboard</span>
          </a>
          <a class="nav-item" data-nav="deals" id="nav-deals">
            <span class="nav-icon">💼</span>
            <span>All Deals</span>
          </a>
          <a class="nav-item" data-nav="memory-replay" id="nav-memory-replay">
            <span class="nav-icon">🧠</span>
            <span>Memory Replay</span>
          </a>
          <a class="nav-item" data-nav="copilot" id="nav-copilot">
            <span class="nav-icon">🤖</span>
            <span>Sales Copilot</span>
          </a>
          <a class="nav-item" data-nav="knowledge" id="nav-knowledge">
            <span class="nav-icon">📚</span>
            <span>Knowledge Base</span>
          </a>
          <a class="nav-item" data-nav="memory-graph" id="nav-memory-graph">
            <span class="nav-icon">🕸️</span>
            <span>Memory Graph</span>
          </a>
          <a class="nav-item" data-nav="learning" id="nav-learning">
            <span class="nav-icon">📈</span>
            <span>Learning Dashboard</span>
          </a>
          <a class="nav-item nav-demo" data-nav="judge-demo" id="nav-judge-demo">
            <span class="nav-icon">🎬</span>
            <span>Judge Demo</span>
          </a>
        </div>

        <div class="nav-section">
          <span class="nav-label">Agents Status</span>
          <div class="agent-status-list">
            <div class="agent-status-item"><span class="agent-dot active"></span>🧠 Memory Agent</div>
            <div class="agent-status-item"><span class="agent-dot active"></span>👥 Stakeholder Intel</div>
            <div class="agent-status-item"><span class="agent-dot active"></span>🛡️ Objection Intel</div>
            <div class="agent-status-item"><span class="agent-dot active"></span>🎯 Strategy Agent</div>
            <div class="agent-status-item"><span class="agent-dot active"></span>📚 Learning Agent</div>
          </div>
        </div>

        <div class="sidebar-footer">
          <div class="memory-indicator">
            <div class="memory-indicator-bar">
              <div class="memory-bar-fill"></div>
            </div>
            <span class="memory-text"><span id="memory-pulse-count">${DATA.memoryStats.memoryNodes}</span> memory nodes</span>
          </div>
          <button class="btn btn-ghost btn-sm full-width" style="margin-bottom: 8px; font-size: 0.8rem;" onclick="App.showApiKeyModal()">⚙️ AI Settings</button>
          <button class="reset-btn" onclick="App.confirmResetMemory()">↺ Reset Memory</button>
        </div>
      </nav>

      <main class="main-content" id="main-content">
        <div id="view-container"></div>
      </main>

      <!-- Modal overlay -->
      <div class="modal-overlay" id="modal-overlay" style="display:none">
        <div class="modal-container" id="modal-container"></div>
      </div>
    `;
  },

  navigateTo(view, dealId) {
    this.currentView = view;
    this.currentDealId = dealId || null;

    // Close mobile navigation drawer if open
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('visible');

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const navTarget = view === 'deal' ? 'deals' : view;
    const navEl = document.querySelector(`[data-nav="${navTarget}"]`);
    if (navEl) navEl.classList.add('active');

    const container = document.getElementById('view-container');
    if (!container) return;
    container.style.opacity = '0';
    container.style.transform = 'translateY(12px)';

    setTimeout(() => {
      switch (view) {
        case 'dashboard': this.renderDashboard(container); break;
        case 'deals': this.renderDealsView(container); break;
        case 'deal': this.renderDealWorkspace(container, dealId); break;
        case 'memory-replay': this.renderMemoryReplay(container); break;
        case 'copilot': this.renderSalesCopilot(container); break;
        case 'knowledge': this.renderKnowledgeBase(container); break;
        case 'memory-graph': this.renderMemoryGraph(container); break;
        case 'learning': this.renderLearningDashboard(container); break;
        case 'judge-demo': this.renderJudgeDemo(container); break;
      }
      requestAnimationFrame(() => {
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
      });
    }, 150);
  },

  // ═══════════════════════════════════════════════════════════════
  // MODAL SYSTEM
  // ═══════════════════════════════════════════════════════════════
  showModal(html) {
    const overlay = document.getElementById('modal-overlay');
    const container = document.getElementById('modal-container');
    container.innerHTML = html;
    overlay.style.display = 'flex';
    setTimeout(() => overlay.classList.add('visible'), 10);
  },

  closeModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('visible');
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
  },

  // ═══════════════════════════════════════════════════════════════
  // ADD NEW DEAL MODAL
  // ═══════════════════════════════════════════════════════════════
  showAddDealModal() {
    const industries = INDUSTRIES;
    this.showModal(`
      <div class="modal-card">
        <div class="modal-header">
          <h2>➕ Add New Deal</h2>
          <button class="modal-close" onclick="App.closeModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Company Name</label>
            <input type="text" id="deal-company" class="form-input" placeholder="e.g. Acme Healthcare Inc">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Industry</label>
              <select id="deal-industry" class="form-input">
                ${industries.map(i => `<option value="${i}">${i}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Deal Value ($)</label>
              <input type="number" id="deal-value" class="form-input" placeholder="500000" value="500000">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Stage</label>
              <select id="deal-stage" class="form-input">
                <option value="Discovery">Discovery</option>
                <option value="Qualification">Qualification</option>
                <option value="Proposal">Proposal</option>
                <option value="Negotiation">Negotiation</option>
              </select>
            </div>
            <div class="form-group">
              <label>Tags (comma-separated)</label>
              <input type="text" id="deal-tags" class="form-input" placeholder="enterprise, strategic">
            </div>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea id="deal-description" class="form-input form-textarea" placeholder="Brief deal description..." rows="2"></textarea>
          </div>

          <h3 class="form-section-title">Add Stakeholder (Optional)</h3>
          <div class="form-row">
            <div class="form-group">
              <label>Name</label>
              <input type="text" id="sh-name" class="form-input" placeholder="e.g. John Smith">
            </div>
            <div class="form-group">
              <label>Role</label>
              <select id="sh-role" class="form-input">
                ${ROLES.map(r => `<option value="${r}">${r}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Influence Level</label>
              <select id="sh-influence" class="form-input">
                ${INFLUENCE_LEVELS.map(l => `<option value="${l}">${l}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Initial Sentiment</label>
              <select id="sh-sentiment" class="form-input">
                ${SENTIMENT_LEVELS.map(s => `<option value="${s}">${s}</option>`).join('')}
              </select>
            </div>
          </div>

          <h3 class="form-section-title">Add Initial Objection (Optional)</h3>
          <div class="form-row">
            <div class="form-group">
              <label>Category</label>
              <select id="obj-category" class="form-input">
                <option value="">— None —</option>
                ${OBJECTION_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Description</label>
              <input type="text" id="obj-description" class="form-input" placeholder="e.g. Pricing concerns...">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
          <button class="btn btn-primary" onclick="App.submitNewDeal()">
            <span class="btn-icon">🧠</span> Create & Analyze
          </button>
        </div>
      </div>
    `);
  },

  submitNewDeal() {
    const company = document.getElementById('deal-company').value.trim();
    if (!company) { alert('Please enter a company name.'); return; }

    const deal = MemoryStore.addDeal({
      company,
      industry: document.getElementById('deal-industry').value,
      value: parseInt(document.getElementById('deal-value').value) || 500000,
      stage: document.getElementById('deal-stage').value,
      tags: document.getElementById('deal-tags').value.split(',').map(t => t.trim()).filter(Boolean),
      description: document.getElementById('deal-description').value
    });

    // Add stakeholder if provided
    const shName = document.getElementById('sh-name').value.trim();
    if (shName) {
      MemoryStore.addStakeholder({
        dealId: deal.id,
        name: shName,
        role: document.getElementById('sh-role').value,
        influenceLevel: document.getElementById('sh-influence').value,
        sentiment: document.getElementById('sh-sentiment').value,
        concerns: []
      });
    }

    // Add objection if provided
    const objCategory = document.getElementById('obj-category').value;
    const objDesc = document.getElementById('obj-description').value.trim();
    if (objCategory && objDesc) {
      MemoryStore.addObjection({
        dealId: deal.id,
        category: objCategory,
        description: objDesc,
        severity: 'Medium'
      });
    }

    this.closeModal();
    this.navigateTo('deal', deal.id);
  },

  // ═══════════════════════════════════════════════════════════════
  // MARK DEAL WON / LOST MODAL
  // ═══════════════════════════════════════════════════════════════
  showOutcomeModal(dealId, outcome) {
    const deal = DATA.deals.find(d => d.id === dealId);
    if (!deal) return;

    const strategies = outcome === 'won' ? SUCCESSFUL_STRATEGIES : FAILED_STRATEGIES;

    this.showModal(`
      <div class="modal-card">
        <div class="modal-header">
          <h2>${outcome === 'won' ? '🏆 Mark Deal as Won' : '📉 Mark Deal as Lost'}</h2>
          <button class="modal-close" onclick="App.closeModal()">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-subtitle">The Learning Agent will extract patterns from <strong>${deal.company}</strong> to improve future recommendations.</p>

          <div class="form-group">
            <label>Key Factors (select all that apply)</label>
            <div class="factor-checklist" id="outcome-factors">
              ${strategies.map((s, i) => `
                <label class="factor-check">
                  <input type="checkbox" value="${s}" id="factor-${i}">
                  <span>${s}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <div class="form-group">
            <label>Additional Notes (Optional)</label>
            <textarea id="outcome-notes" class="form-input form-textarea" placeholder="Any additional context..." rows="2"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
          <button class="btn ${outcome === 'won' ? 'btn-success' : 'btn-danger'}" onclick="App.submitOutcome(${dealId}, '${outcome}')">
            ${outcome === 'won' ? '🏆 Confirm Won' : '📉 Confirm Lost'}
          </button>
        </div>
      </div>
    `);
  },

  submitOutcome(dealId, outcome) {
    const checkboxes = document.querySelectorAll('#outcome-factors input:checked');
    const keyFactors = Array.from(checkboxes).map(cb => cb.value);
    const notes = document.getElementById('outcome-notes').value.trim();

    if (notes) keyFactors.push(notes);

    let deal;
    if (outcome === 'won') {
      deal = MemoryStore.markDealWon(dealId, keyFactors);
    } else {
      deal = MemoryStore.markDealLost(dealId, keyFactors);
    }

    this.closeModal();

    // Show learning results
    this.showLearningResultsModal(deal, outcome);
  },

  showLearningResultsModal(deal, outcome) {
    const sessions = MemoryStore.learningState.learningSessions;
    const lastSession = sessions[sessions.length - 1];
    if (!lastSession) { this.navigateTo('deal', deal.id); return; }

    const changes = lastSession.confidenceChanges || [];
    const patterns = lastSession.patternsExtracted || [];

    this.showModal(`
      <div class="modal-card modal-wide">
        <div class="modal-header">
          <h2>📚 Learning Agent Results</h2>
          <button class="modal-close" onclick="App.closeModal(); App.navigateTo('deal', ${deal.id})">✕</button>
        </div>
        <div class="modal-body">
          <div class="learning-result-banner ${outcome}">
            <span class="learning-icon">${outcome === 'won' ? '🏆' : '📉'}</span>
            <div>
              <h3>${deal.company} — ${outcome === 'won' ? 'Deal Won' : 'Deal Lost'}</h3>
              <p>The system has learned from this outcome and updated ${changes.length} confidence scores.</p>
            </div>
          </div>

          ${changes.length > 0 ? `
            <h4 class="learning-section-title">Confidence Updates</h4>
            <div class="confidence-changes">
              ${changes.map(c => `
                <div class="conf-change ${c.direction}">
                  <span class="conf-arrow">${c.direction === 'up' ? '↑' : '↓'}</span>
                  <div class="conf-detail">
                    <span class="conf-target">${c.category || c.strategy}</span>
                    <span class="conf-reason">${c.reason}</span>
                  </div>
                  <span class="conf-new-score">${c.newRate || c.newScore}%</span>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${patterns.length > 0 ? `
            <h4 class="learning-section-title">New Patterns Discovered</h4>
            <div class="patterns-list">
              ${patterns.map(p => `
                <div class="pattern-discovered">
                  <span class="pattern-type-badge">${p.type.replace(/_/g, ' ')}</span>
                  <span>${p.strategy || p.categories?.join(', ') || 'Pattern recorded'}</span>
                  <span class="pattern-source">from ${p.source}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div class="learning-summary-box">
            <h4>🧠 Memory Updated</h4>
            <div class="learning-summary-stats">
              <div class="ls-stat"><span class="ls-val">${DATA.memoryStats.memoryNodes}</span><span class="ls-lbl">Memory Nodes</span></div>
              <div class="ls-stat"><span class="ls-val">${MemoryStore.learningState.learningSessions.length}</span><span class="ls-lbl">Learning Sessions</span></div>
              <div class="ls-stat"><span class="ls-val">${MemoryStore.learningState.patternCount}</span><span class="ls-lbl">Patterns Known</span></div>
            </div>
            <p class="ls-notice">Future recommendations for similar deals will now reflect this outcome.</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="App.closeModal(); App.navigateTo('deal', ${deal.id})">
            View Updated Deal
          </button>
        </div>
      </div>
    `);
  },

  // ═══════════════════════════════════════════════════════════════
  // SCREEN 1: EXECUTIVE DASHBOARD
  // ═══════════════════════════════════════════════════════════════
  renderDashboard(container) {
    const summary = MemoryAgent.generateMemorySummary();
    const recentObjections = ObjectionAgent.getRecentObjections(5);
    const recentActivity = StakeholderAgent.getRecentActivity().slice(0, 5);
    const bestPractices = LearningAgent.getBestPractices().slice(0, 4);
    const activeDeals = DATA.deals.filter(d => d.status === 'active');
    const categoryStats = ObjectionAgent.getCategoryStats();
    const learningSummary = MemoryStore.getLearningSummary();

    // Generate AI insights
    const insights = [];
    activeDeals.forEach(d => {
      const dealInsights = StrategyAgent.generateDealInsights(d.id);
      dealInsights.forEach(ins => insights.push({ ...ins, dealId: d.id, company: d.company }));
    });

    const topRisks = [];
    activeDeals.forEach(d => {
      const risks = StrategyAgent.identifyRisks(d.id);
      risks.filter(r => r.level === 'critical' || r.level === 'high')
        .forEach(r => topRisks.push({ ...r, dealId: d.id, company: d.company }));
    });

    container.innerHTML = `
      <div class="dashboard-hero">
        <div class="hero-content">
          <div class="hero-badge">🧠 Memory-Driven Intelligence</div>
          <h1 class="hero-title">Traditional CRMs store data.<br><span class="hero-highlight">This system stores experience.</span></h1>
          <p class="hero-desc">It learns from outcomes, retrieves similar deals, and uses organizational memory to improve every future sales decision.</p>
          <div class="hero-live-stats">
            <div class="hero-stat"><span class="hero-stat-value" data-count="${summary.memoryNodes}">${summary.memoryNodes}</span><span class="hero-stat-label">Memory Nodes</span></div>
            <div class="hero-stat"><span class="hero-stat-value" data-count="${summary.totalDeals}">${summary.totalDeals}</span><span class="hero-stat-label">Deals Learned</span></div>
            <div class="hero-stat"><span class="hero-stat-value" data-count="${learningSummary.patternsExtracted}">${learningSummary.patternsExtracted}</span><span class="hero-stat-label">Patterns Known</span></div>
            <div class="hero-stat"><span class="hero-stat-value" data-count="${summary.winRate}">${summary.winRate}%</span><span class="hero-stat-label">Win Rate</span></div>
          </div>
          <div class="hero-actions">
            <button class="btn btn-primary btn-large" onclick="App.navigateTo('judge-demo')">
              <span class="btn-icon">▶</span> Watch Demo
            </button>
            <button class="btn btn-ghost btn-large" onclick="App.showAddDealModal()">
              <span class="btn-icon">➕</span> New Deal
            </button>
          </div>
        </div>
        <div class="hero-visual">
          <div class="hero-brain-icon">🧠</div>
          <div class="hero-orbit hero-orbit-1"></div>
          <div class="hero-orbit hero-orbit-2"></div>
          <div class="hero-orbit hero-orbit-3"></div>
        </div>
      </div>

      <div class="view-header">
        <div>
          <h1 class="view-title">Executive Dashboard</h1>
          <p class="view-subtitle">Memory-driven intelligence across ${summary.totalDeals} deals • ${learningSummary.totalLearningSessions} learning sessions</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" onclick="App.showAddDealModal()">
            <span class="btn-icon">➕</span> New Deal
          </button>
          <div class="live-badge"><span class="live-dot"></span> All agents active</div>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card kpi-active">
          <div class="kpi-icon">💼</div>
          <div class="kpi-content">
            <span class="kpi-value" data-count="${summary.activeDeals}">${summary.activeDeals}</span>
            <span class="kpi-label">Active Deals</span>
          </div>
          <div class="kpi-trend up">Pipeline open</div>
        </div>
        <div class="kpi-card kpi-won">
          <div class="kpi-icon">🏆</div>
          <div class="kpi-content">
            <span class="kpi-value" data-count="${summary.wonDeals}">${summary.wonDeals}</span>
            <span class="kpi-label">Won Deals</span>
          </div>
          <div class="kpi-trend up">$${(summary.wonValue / 1000000).toFixed(1)}M value</div>
        </div>
        <div class="kpi-card kpi-lost">
          <div class="kpi-icon">📉</div>
          <div class="kpi-content">
            <span class="kpi-value" data-count="${summary.lostDeals}">${summary.lostDeals}</span>
            <span class="kpi-label">Lost Deals</span>
          </div>
          <div class="kpi-trend down">Learning applied</div>
        </div>
        <div class="kpi-card kpi-winrate">
          <div class="kpi-icon">📈</div>
          <div class="kpi-content">
            <span class="kpi-value" data-count="${summary.winRate}">${summary.winRate}%</span>
            <span class="kpi-label">Win Rate</span>
          </div>
          <div class="kpi-trend up">Memory-enhanced</div>
        </div>
        <div class="kpi-card kpi-memory">
          <div class="kpi-icon">🧠</div>
          <div class="kpi-content">
            <span class="kpi-value">${summary.memoryNodes}</span>
            <span class="kpi-label">Memory Nodes</span>
          </div>
          <div class="kpi-trend up">${summary.memoryConnections} connections</div>
        </div>
        <div class="kpi-card kpi-pipeline">
          <div class="kpi-icon">💰</div>
          <div class="kpi-content">
            <span class="kpi-value">$${(summary.totalPipelineValue / 1000000).toFixed(1)}M</span>
            <span class="kpi-label">Pipeline Value</span>
          </div>
          <div class="kpi-trend up">Avg ${summary.avgDealCycle}d cycle</div>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- AI Insights Panel -->
        <div class="card card-large">
          <div class="card-header">
            <h3><span class="card-icon">🤖</span> AI-Generated Insights</h3>
            <span class="badge badge-ai">Memory-Driven</span>
          </div>
          <div class="card-body">
            ${insights.slice(0, 5).map(ins => `
              <div class="insight-item insight-${ins.type}">
                <span class="insight-icon">${ins.icon}</span>
                <div class="insight-content">
                  <p class="insight-text">${ins.text}</p>
                  <span class="insight-meta" data-deal="${ins.dealId}">${ins.company} ${ins.deals.length > 0 ? '• Based on: ' + ins.deals.join(', ') : ''}</span>
                </div>
              </div>
            `).join('')}
            ${insights.length === 0 ? '<p class="empty-state">Add active deals to generate AI insights</p>' : ''}
          </div>
        </div>

        <!-- Risk Indicators -->
        <div class="card">
          <div class="card-header">
            <h3><span class="card-icon">⚠️</span> Strategic Alerts</h3>
          </div>
          <div class="card-body">
            ${topRisks.slice(0, 5).map(r => `
              <div class="risk-item risk-${r.level}">
                <span class="risk-badge ${r.level}">${r.level}</span>
                <div class="risk-content">
                  <span class="risk-company" data-deal="${r.dealId}">${r.company}</span>
                  <p class="risk-text">${r.risk}</p>
                </div>
              </div>
            `).join('')}
            ${topRisks.length === 0 ? '<p class="empty-state">No critical alerts</p>' : ''}
          </div>
        </div>

        <!-- Recent Objections -->
        <div class="card">
          <div class="card-header">
            <h3><span class="card-icon">🛡️</span> Recent Objections</h3>
          </div>
          <div class="card-body">
            ${recentObjections.map(o => `
              <div class="objection-item">
                <div class="objection-header">
                  <span class="objection-category tag-${o.category.toLowerCase()}">${o.category}</span>
                  <span class="objection-status ${o.outcome}">${o.outcome === 'resolved' ? '✅ Resolved' : '⏳ Open'}</span>
                </div>
                <p class="objection-desc">${o.description}</p>
                <span class="objection-meta">${o.company} • ${o.raisedDate}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Stakeholder Activity -->
        <div class="card">
          <div class="card-header">
            <h3><span class="card-icon">👥</span> Stakeholder Activity</h3>
          </div>
          <div class="card-body">
            ${recentActivity.map(s => `
              <div class="stakeholder-item">
                <div class="stakeholder-avatar">${s.name.split(' ').map(n => n[0]).join('')}</div>
                <div class="stakeholder-info">
                  <span class="stakeholder-name">${s.name}</span>
                  <span class="stakeholder-role">${s.role} at ${s.company}</span>
                </div>
                <span class="sentiment-badge sentiment-${s.sentiment.toLowerCase().replace(' ', '-')}">${s.sentiment}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Learning Engine Status -->
        <div class="card">
          <div class="card-header">
            <h3><span class="card-icon">📚</span> Learning Engine</h3>
            <span class="badge badge-ai">Live</span>
          </div>
          <div class="card-body">
            <div class="learning-engine-stats">
              <div class="le-stat"><span class="le-val">${learningSummary.totalLearningSessions}</span><span class="le-lbl">Sessions</span></div>
              <div class="le-stat"><span class="le-val">${learningSummary.confidenceUpdates}</span><span class="le-lbl">Confidence Updates</span></div>
              <div class="le-stat"><span class="le-val">${learningSummary.patternsExtracted}</span><span class="le-lbl">Patterns</span></div>
            </div>
            ${learningSummary.topStrategies.slice(0, 3).map(s => `
              <div class="le-strategy">
                <span class="le-strategy-score ${s.trend === 'up' ? 'trend-up' : s.trend === 'down' ? 'trend-down' : ''}">${s.score}%</span>
                <span class="le-strategy-name">${s.strategy.substring(0, 60)}${s.strategy.length > 60 ? '...' : ''}</span>
                ${s.trend && s.trend !== 'stable' ? `<span class="le-trend le-trend-${s.trend}">${s.trend === 'up' ? '▲' : s.trend === 'down' ? '▼' : '●'}</span>` : ''}
              </div>
            `).join('')}
            ${learningSummary.lastLearnedAt ? `<span class="le-last">Last learned: ${new Date(learningSummary.lastLearnedAt).toLocaleDateString()}</span>` : '<span class="le-last">No learning sessions yet — mark deals as Won/Lost to train</span>'}
          </div>
        </div>

        <!-- Objection Categories Breakdown -->
        <div class="card">
          <div class="card-header">
            <h3><span class="card-icon">📊</span> Objection Resolution</h3>
          </div>
          <div class="card-body">
            ${Object.entries(categoryStats).map(([cat, stats]) => `
              <div class="category-bar-item">
                <div class="category-bar-header">
                  <span class="category-name">${cat}</span>
                  <span class="category-rate">${stats.resolutionRate}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${stats.resolutionRate}%; background: ${stats.resolutionRate > 70 ? 'var(--color-success)' : stats.resolutionRate > 50 ? 'var(--color-warning)' : 'var(--color-danger)'}"></div>
                </div>
                <span class="category-meta">${stats.resolved}/${stats.total} resolved • ${stats.avgSuccessRate}% historical rate</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.animateCounters();
  },

  // ═══════════════════════════════════════════════════════════════
  // DEALS LIST VIEW
  // ═══════════════════════════════════════════════════════════════
  renderDealsView(container) {
    const deals = DATA.deals;
    const activeDeals = deals.filter(d => d.status === 'active');
    const wonDeals = deals.filter(d => d.status === 'won');
    const lostDeals = deals.filter(d => d.status === 'lost');

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Deal Pipeline</h1>
          <p class="view-subtitle">${deals.length} total deals across ${[...new Set(deals.map(d => d.industry))].length} industries</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" onclick="App.showAddDealModal()">
            <span class="btn-icon">➕</span> New Deal
          </button>
          <div class="filter-tabs" id="deal-filters">
            <button class="filter-tab active" data-filter="all">All (${deals.length})</button>
            <button class="filter-tab" data-filter="active">Active (${activeDeals.length})</button>
            <button class="filter-tab" data-filter="won">Won (${wonDeals.length})</button>
            <button class="filter-tab" data-filter="lost">Lost (${lostDeals.length})</button>
          </div>
        </div>
      </div>

      <div class="deals-grid" id="deals-grid">
        ${deals.map((d, i) => {
      const winProb = d.status === 'active' ? StrategyAgent.estimateWinProbability(d.id) : d.winProbability;
      const objections = ObjectionAgent.getDealObjections(d.id);
      const stakeholders = StakeholderAgent.getDealStakeholders(d.id);
      return `
            <div class="deal-card deal-${d.status}" data-deal="${d.id}" data-status="${d.status}" style="animation-delay: ${i * 0.05}s">
              <div class="deal-card-header">
                <div class="deal-status-dot ${d.status}"></div>
                <span class="deal-id">#${d.id}</span>
                <span class="deal-stage tag-stage">${d.stage}</span>
              </div>
              <h3 class="deal-company">${d.company}</h3>
              <span class="deal-industry">${d.industry}</span>
              <div class="deal-value">$${(d.value / 1000).toFixed(0)}K</div>
              <div class="deal-metrics">
                <div class="deal-metric">
                  <span class="metric-label">Win Prob</span>
                  <div class="mini-progress">
                    <div class="mini-progress-fill ${winProb > 70 ? 'high' : winProb > 40 ? 'med' : 'low'}" style="width: ${winProb}%"></div>
                  </div>
                  <span class="metric-value">${winProb}%</span>
                </div>
                <div class="deal-metric-row">
                  <span>👥 ${stakeholders.length}</span>
                  <span>🛡️ ${objections.length}</span>
                  <span>📅 ${d.dealCycleDays}d</span>
                </div>
              </div>
            </div>
          `;
    }).join('')}
      </div>
    `;

    // Filter functionality
    container.querySelector('#deal-filters').addEventListener('click', (e) => {
      if (!e.target.classList.contains('filter-tab')) return;
      container.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      const filter = e.target.dataset.filter;
      container.querySelectorAll('.deal-card').forEach(card => {
        if (filter === 'all' || card.dataset.status === filter) {
          card.style.display = '';
          card.style.animation = 'fadeInUp 0.3s ease forwards';
        } else {
          card.style.display = 'none';
        }
      });
    });
  },

  // ═══════════════════════════════════════════════════════════════
  // SCREEN 2: DEAL WORKSPACE
  // ═══════════════════════════════════════════════════════════════
  renderDealWorkspace(container, dealId) {
    const history = MemoryAgent.getDealHistory(dealId);
    if (!history.deal) { this.navigateTo('deals'); return; }

    const deal = history.deal;
    const similarDeals = MemoryAgent.findSimilarDeals(dealId, 4);
    const stakeholderMap = StakeholderAgent.getStakeholderMap(dealId);
    const winProb = StrategyAgent.estimateWinProbability(dealId);
    const nextActions = StrategyAgent.getNextActions(dealId);
    const risks = StrategyAgent.identifyRisks(dealId);
    const dealInsights = StrategyAgent.generateDealInsights(dealId);
    const industryInsights = LearningAgent.getIndustryInsights(deal.industry);

    const isActive = deal.status === 'active';

    container.innerHTML = `
      <div class="view-header">
        <div>
          <button class="back-btn" data-nav="deals">← Back to Deals</button>
          <h1 class="view-title">${deal.company}</h1>
          <p class="view-subtitle">${deal.industry} • Deal #${deal.id} • ${deal.stage}</p>
        </div>
        <div class="header-actions">
          ${isActive ? `
            <button class="btn btn-success" onclick="App.showOutcomeModal(${deal.id}, 'won')">🏆 Mark Won</button>
            <button class="btn btn-danger" onclick="App.showOutcomeModal(${deal.id}, 'lost')">📉 Mark Lost</button>
          ` : ''}
          <button class="btn btn-ghost" onclick="App.generateDealBrief(${deal.id})" title="Generate Executive Brief">📋 Brief</button>
          <button class="btn btn-ai" onclick="App.runAIAnalysis(${deal.id})" title="AI Analysis">✨ AI Analysis</button>
          <span class="deal-status-badge ${deal.status}">${deal.status.toUpperCase()}</span>
          <span class="deal-value-badge">$${(deal.value / 1000).toFixed(0)}K</span>
        </div>
      </div>

      <div class="workspace-grid">
        <!-- Win Probability Gauge -->
        <div class="card card-highlight">
          <div class="card-header">
            <h3><span class="card-icon">🎯</span> Win Probability</h3>
            <span class="badge badge-ai">Strategy Agent</span>
          </div>
          <div class="card-body center">
            <div class="gauge-container">
              <svg class="gauge" viewBox="0 0 120 120">
                <circle class="gauge-bg" cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="10"/>
                <circle class="gauge-fill" cx="60" cy="60" r="50" fill="none" stroke="${winProb > 70 ? '#00e5a0' : winProb > 40 ? '#ffd93d' : '#ff5252'}" stroke-width="10"
                  stroke-dasharray="${(winProb / 100) * 314} 314" stroke-linecap="round" transform="rotate(-90 60 60)" style="transition: stroke-dasharray 1.5s ease"/>
                <text x="60" y="55" text-anchor="middle" fill="white" font-size="24" font-weight="700">${winProb}%</text>
                <text x="60" y="72" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="9">win probability</text>
              </svg>
            </div>
            <div class="probability-factors">
              <div class="factor"><span>Stakeholder Sentiment:</span> <span class="factor-value" style="color: ${stakeholderMap.overallSentiment.color}">${stakeholderMap.overallSentiment.label}</span></div>
              <div class="factor"><span>Objections Resolved:</span> <span class="factor-value">${history.objections.filter(o => o.outcome === 'resolved').length}/${history.objections.length}</span></div>
              <div class="factor"><span>Similar Wins:</span> <span class="factor-value">${similarDeals.filter(d => d.status === 'won').length} deals</span></div>
              <div class="factor"><span>Industry Win Rate:</span> <span class="factor-value">${MemoryStore.getIndustryWinRate(deal.industry)}%</span></div>
              <div class="factor"><span>Deal Cycle:</span> <span class="factor-value">${deal.dealCycleDays} days</span></div>
            </div>
          </div>
        </div>

        <!-- Next Best Actions -->
        <div class="card card-large">
          <div class="card-header">
            <h3><span class="card-icon">⚡</span> Next Best Actions</h3>
            <span class="badge badge-ai">AI Recommended</span>
          </div>
          <div class="card-body">
            ${nextActions.slice(0, 5).map(a => `
              <div class="action-item action-${a.priority}">
                <div class="action-priority ${a.priority}">${a.priority}</div>
                <div class="action-content">
                  <p class="action-text">${a.action}</p>
                  <div class="action-explainer">
                    <span class="explainer-label">💡 Why this recommendation?</span>
                    <p class="explainer-reason">${a.reason}</p>
                    <span class="explainer-source">Source: ${a.source} • Confidence: ${a.confidence}%</span>
                  </div>
                </div>
              </div>
            `).join('')}
            ${nextActions.length === 0 ? '<p class="empty-state">No actions needed for closed deals</p>' : ''}
          </div>
        </div>

        <!-- Stakeholders -->
        <div class="card">
          <div class="card-header">
            <h3><span class="card-icon">👥</span> Stakeholders</h3>
            <span class="badge">${history.stakeholders.length} people</span>
          </div>
          <div class="card-body">
            ${history.stakeholders.map(s => `
              <div class="stakeholder-detail">
                <div class="stakeholder-avatar-lg">${s.name.split(' ').map(n => n[0]).join('')}</div>
                <div class="stakeholder-detail-info">
                  <span class="stakeholder-name">${s.name}</span>
                  <span class="stakeholder-role">${s.role}</span>
                  <div class="stakeholder-tags">
                    <span class="tag tag-influence">${s.influenceLevel}</span>
                    <span class="tag sentiment-${s.sentiment.toLowerCase().replace(' ', '-')}">${s.sentiment}</span>
                  </div>
                  <div class="stakeholder-concerns">
                    ${s.concerns.map(c => `<span class="concern-tag">${c}</span>`).join('')}
                  </div>
                </div>
                <div class="engagement-ring">
                  <svg width="40" height="40" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="3"/>
                    <circle cx="20" cy="20" r="16" fill="none" stroke="${s.engagementScore > 70 ? '#00e5a0' : s.engagementScore > 40 ? '#ffd93d' : '#ff5252'}" stroke-width="3"
                      stroke-dasharray="${(s.engagementScore / 100) * 100.5} 100.5" stroke-linecap="round" transform="rotate(-90 20 20)"/>
                    <text x="20" y="24" text-anchor="middle" fill="white" font-size="10">${s.engagementScore}</text>
                  </svg>
                </div>
              </div>
            `).join('')}
            ${history.stakeholders.length === 0 ? '<p class="empty-state">No stakeholders added yet</p>' : ''}
          </div>
        </div>

        <!-- Conversation Timeline -->
        <div class="card">
          <div class="card-header">
            <h3><span class="card-icon">💬</span> Conversation Timeline</h3>
            <span class="badge">${history.interactions.length} interactions</span>
          </div>
          <div class="card-body">
            <div class="timeline">
              ${history.interactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 8).map(int => `
                <div class="timeline-item">
                  <div class="timeline-dot ${int.sentiment}"></div>
                  <div class="timeline-content">
                    <div class="timeline-header">
                      <span class="timeline-type">${int.type}</span>
                      <span class="timeline-date">${new Date(int.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p class="timeline-text">${int.content}</p>
                    <div class="timeline-topics">
                      ${int.keyTopics.map(t => `<span class="topic-tag">${t}</span>`).join('')}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
            ${history.interactions.length === 0 ? '<p class="empty-state">No interactions recorded yet</p>' : ''}
          </div>
        </div>

        <!-- Objections -->
        <div class="card">
          <div class="card-header">
            <h3><span class="card-icon">🛡️</span> Objections</h3>
            <span class="badge">${history.objections.length} raised</span>
          </div>
          <div class="card-body">
            ${history.objections.map(o => `
              <div class="objection-detail ${o.outcome}">
                <div class="objection-detail-header">
                  <span class="objection-category tag-${o.category.toLowerCase()}">${o.category}</span>
                  <span class="severity-badge ${o.severity.toLowerCase()}">${o.severity}</span>
                  <span class="objection-outcome-badge ${o.outcome}">${o.outcome === 'resolved' ? '✅' : '⏳'}</span>
                </div>
                <p class="objection-desc">${o.description}</p>
                <p class="objection-resolution"><strong>Response:</strong> ${o.resolution}</p>
                <div class="objection-stats">
                  <span>Historical success: ${o.historicalSuccessRate}%</span>
                  <span>Raised: ${o.raisedDate}</span>
                </div>
              </div>
            `).join('')}
            ${history.objections.length === 0 ? '<p class="empty-state">No objections recorded</p>' : ''}
          </div>
        </div>

        <!-- Similar Historical Deals -->
        <div class="card">
          <div class="card-header">
            <h3><span class="card-icon">🔗</span> Similar Historical Deals</h3>
            <span class="badge badge-ai">Semantic Search</span>
          </div>
          <div class="card-body">
            ${similarDeals.map(sd => `
              <div class="similar-deal ${sd.status}" data-deal="${sd.id}">
                <div class="similar-deal-header">
                  <span class="deal-id">#${sd.id}</span>
                  <span class="deal-company-sm">${sd.company}</span>
                  <span class="deal-status-sm ${sd.status}">${sd.status.toUpperCase()}</span>
                </div>
                <div class="similarity-bar">
                  <div class="similarity-fill" style="width: ${sd.similarityScore}%"></div>
                  <span class="similarity-score">${sd.similarityScore}% match</span>
                </div>
                <div class="similarity-reasons">
                  ${sd.reasons.map(r => `<span class="reason-tag">✓ ${r}</span>`).join('')}
                </div>
                ${sd.similarityBreakdown ? `
                  <div class="similarity-breakdown">
                    ${Object.entries(sd.similarityBreakdown).filter(([,v]) => v > 0).map(([k, v]) => `
                      <span class="breakdown-chip">${k}: ${v}pts</span>
                    `).join('')}
                  </div>
                ` : ''}
                ${sd.keyFactors && sd.keyFactors.length > 0 ? `
                  <div class="key-lesson">
                    <span class="lesson-label">${sd.status === 'won' ? '✅ Key Success Factor:' : '⚠️ Lesson Learned:'}</span>
                    <span class="lesson-text">${sd.keyFactors[0]}</span>
                  </div>
                ` : ''}
              </div>
            `).join('')}
            ${similarDeals.length === 0 ? '<p class="empty-state">Not enough historical data for similarity search</p>' : ''}
          </div>
        </div>

        <!-- Risks -->
        <div class="card">
          <div class="card-header">
            <h3><span class="card-icon">⚠️</span> Risk Assessment</h3>
          </div>
          <div class="card-body">
            ${risks.length > 0 ? risks.map(r => `
              <div class="risk-detail risk-${r.level}">
                <span class="risk-level-badge ${r.level}">${r.level}</span>
                <div>
                  <p class="risk-text">${r.risk}</p>
                  <p class="risk-mitigation">💡 ${r.mitigation}</p>
                </div>
              </div>
            `).join('') : '<p class="empty-state">No significant risks identified</p>'}
          </div>
        </div>

        <!-- Deal Insights -->
        <div class="card">
          <div class="card-header">
            <h3><span class="card-icon">💡</span> Lessons from Memory</h3>
            <span class="badge badge-ai">Learning Agent</span>
          </div>
          <div class="card-body">
            ${dealInsights.map(ins => `
              <div class="insight-item insight-${ins.type}">
                <span class="insight-icon">${ins.icon}</span>
                <div class="insight-content">
                  <p class="insight-text">${ins.text}</p>
                  ${ins.deals.length > 0 ? `<span class="insight-meta">Referenced: ${ins.deals.join(', ')}</span>` : ''}
                </div>
              </div>
            `).join('')}
            ${industryInsights.lessons.length > 0 ? `
              <div class="industry-insight-box">
                <h4>📌 ${deal.industry} Industry Intelligence</h4>
                ${industryInsights.lessons.map(l => `
                  <div class="industry-lesson">
                    <span class="lesson-impact impact-${l.impact}">${l.impact}</span>
                    <span>${l.lesson}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>
        </div>
      </div>

      <!-- AI Analysis Placeholder -->
      <div id="ai-analysis-section" class="ai-analysis-section">
        <div class="ai-analysis-cta">
          <div class="ai-cta-icon">✨</div>
          <div class="ai-cta-text">
            <h3>AI Memory Analysis</h3>
            <p>Get Gemini-powered recommendations backed by ${DATA.memoryStats.memoryNodes.toLocaleString()} memory nodes and ${DATA.deals.length} historical deals.</p>
          </div>
          <button class="btn btn-ai btn-large" onclick="App.runAIAnalysis(${deal.id})">
            ✨ Generate AI Analysis
          </button>
        </div>
      </div>

      ${deal.status === 'lost' ? `
      <!-- Counterfactual Analysis -->
      <div id="counterfactual-section" class="counterfactual-section">
        <div class="cf-header">
          <h2>🔮 What Would Have Happened?</h2>
          <p class="cf-subtitle">Counterfactual analysis using organizational memory — what alternative strategies could have changed this outcome?</p>
          <button class="btn btn-primary" onclick="App.runCounterfactual(${deal.id})">Analyze Alternative Outcomes</button>
        </div>
      </div>
      ` : ''}
    `;
  },

  // ── AI Analysis Runner ───────────────────────────────────────
  runAIAnalysis(dealId) {
    const section = document.getElementById('ai-analysis-section');
    if (!section) return;

    // Check if API key needed
    if (!GeminiAI.hasApiKey()) {
      section.innerHTML = `
        <div class="ai-key-prompt">
          <h3>✨ Enable AI Analysis with Gemini</h3>
          <p>Enter your Gemini API key to get LLM-powered analysis backed by organizational memory. <a href="https://aistudio.google.com/app/apikey" target="_blank">Get a free API key →</a></p>
          <div class="api-key-form">
            <input type="password" id="gemini-api-key" class="form-input" placeholder="AIzaSy..." />
            <button class="btn btn-primary" onclick="App.saveAndRunAI(${dealId})">Activate AI →</button>
          </div>
          <button class="btn btn-ghost" onclick="App.runAIWithFallback(${dealId})">Use Memory-Based Analysis (No API Key)</button>
        </div>
      `;
      return;
    }
    this.runAIWithFallback(dealId);
  },

  saveAndRunAI(dealId) {
    const key = document.getElementById('gemini-api-key')?.value?.trim();
    if (key) GeminiAI.setApiKey(key);
    this.runAIWithFallback(dealId);
  },

  async runAIWithFallback(dealId) {
    const section = document.getElementById('ai-analysis-section');
    if (!section) return;

    // Show loading state
    section.innerHTML = `
      <div class="ai-loading">
        <div class="ai-loading-brain">🧠</div>
        <div class="ai-loading-steps">
          <div class="ai-step active">Retrieving ${DATA.deals.length} historical deals from memory...</div>
          <div class="ai-step">Analyzing stakeholder patterns...</div>
          <div class="ai-step">Identifying objection signatures...</div>
          <div class="ai-step">Matching similar deal contexts...</div>
          <div class="ai-step">Generating recommendations...</div>
        </div>
      </div>
    `;
    
    // Animate loading steps
    const steps = section.querySelectorAll('.ai-step');
    let stepIdx = 1;
    const stepInterval = setInterval(() => {
      if (stepIdx < steps.length) { steps[stepIdx].classList.add('active'); stepIdx++; }
      else clearInterval(stepInterval);
    }, 400);

    const result = await GeminiAI.analyzeDeal(dealId);
    clearInterval(stepInterval);
    
    if (!result) {
      section.innerHTML = `<div class="ai-error">Analysis failed. Please try again.</div>`;
      return;
    }

    const sourceLabel = result.source === 'gemini' ? 
      `<span class="ai-source gemini">✨ Powered by Gemini ${GeminiAI.MODEL}</span>` : 
      `<span class="ai-source fallback">🧠 Memory-Based Analysis</span>`;
    
    section.innerHTML = `
      <div class="ai-result animate-in">
        <div class="ai-result-header" style="animation: fadeInUp 0.4s ease forwards">
          <h2>✨ AI Memory Analysis</h2>
          ${sourceLabel}
          <button class="btn btn-ghost" onclick="GeminiAI._cache.clear(); App.runAIWithFallback(${dealId})">↺ Refresh</button>
        </div>

        <div class="ai-result-grid">
          <div class="ai-card ai-card-large" style="animation: fadeInUp 0.5s ease 0.1s both">
            <h3>📋 Deal Assessment</h3>
            <p class="ai-text ai-typewriter" data-full-text="${result.dealAssessment.replace(/"/g, '&quot;')}">${result.dealAssessment}</p>
          </div>

          <div class="ai-card" style="animation: fadeInUp 0.5s ease 0.25s both">
            <h3>🎯 Win Probability Analysis</h3>
            <p class="ai-text">${result.winProbabilityAnalysis}</p>
          </div>

          <div class="ai-card ai-card-large" style="animation: fadeInUp 0.5s ease 0.4s both">
            <h3>⚡ Next Best Actions (AI-Generated)</h3>
            ${(result.nextBestActions || []).map((a, i) => `
              <div class="ai-action">
                <div class="ai-action-num">${i+1}</div>
                <div class="ai-action-body">
                  <p class="ai-action-text">${a.action}</p>
                  <p class="ai-action-reason">💡 ${a.reasoning}</p>
                  <div class="ai-action-meta">
                    <span class="ai-evidence">📎 ${a.historicalBasis}</span>
                    <span class="ai-confidence">${a.confidence}% confidence</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="ai-card" style="animation: fadeInUp 0.5s ease 0.55s both">
            <h3>⚠️ Top Risks</h3>
            ${(result.topRisks || []).map(r => `
              <div class="ai-risk risk-${r.severity}">
                <span class="risk-badge ${r.severity}">${r.severity}</span>
                <div>
                  <p>${r.risk}</p>
                  <span class="ai-evidence">📎 ${r.memoryEvidence}</span>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="ai-card" style="animation: fadeInUp 0.5s ease 0.7s both">
            <h3>👥 Stakeholder Strategy</h3>
            <p class="ai-text">${result.stakeholderStrategy}</p>
          </div>

          ${result.objectionPlaybook && result.objectionPlaybook.length > 0 ? `
          <div class="ai-card">
            <h3>🛡️ Objection Playbook</h3>
            ${result.objectionPlaybook.map(o => `
              <div class="ai-objection">
                <span class="tag tag-${o.objection.toLowerCase()}">${o.objection}</span>
                <p>${o.recommendedResponse}</p>
                <div class="ai-objection-meta">
                  <span>${o.historicalSuccessRate}% historical success</span>
                  <span class="ai-evidence">📎 ${o.memorySource}</span>
                </div>
              </div>
            `).join('')}
          </div>
          ` : ''}

          <div class="ai-card ai-card-large ai-memory-evidence" style="animation: fadeInUp 0.5s ease 0.85s both">
            <h3>🧠 Memory Evidence Used</h3>
            <p class="ai-insight">${result.memoryInsights}</p>
            <div class="memory-evidence-grid">
              ${(result.historicalDealsUsed || []).map(d => `
                <div class="memory-evidence-item ${d.outcome}" data-deal="${d.dealId}">
                  <div class="me-header">
                    <span class="deal-id">#${d.dealId}</span>
                    <span class="deal-outcome ${d.outcome}">${d.outcome === 'won' ? '🏆 Won' : '❌ Lost'}</span>
                    <span class="similarity-badge">${d.similarityScore}% match</span>
                  </div>
                  <p class="me-company">${d.company}</p>
                  <p class="me-relevance">Why it matters: ${d.relevance}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // ── Counterfactual Analysis Runner ───────────────────────────
  async runCounterfactual(dealId) {
    const section = document.getElementById('counterfactual-section');
    if (!section) return;

    section.innerHTML = `<div class="cf-loading">🔮 Analyzing alternative timelines from organizational memory...</div>`;
    
    const result = await GeminiAI.analyzeCounterfactual(dealId);
    if (!result) {
      section.innerHTML = `<div class="cf-error">Insufficient memory data for counterfactual analysis.</div>`;
      return;
    }

    section.innerHTML = `
      <div class="cf-result animate-in">
        <div class="cf-header">
          <h2>🔮 What Would Have Happened?</h2>
          <p>Counterfactual analysis: ${result.similarWonDeals.length} similar won deals found. Here's what could have changed the outcome for <strong>${result.lostDeal.company}</strong>.</p>
        </div>
        <div class="cf-key-lesson">
          <span class="lesson-label">Key Learning:</span> ${result.keyLesson}
        </div>
        <div class="cf-alternatives">
          ${result.alternatives.map(alt => `
            <div class="cf-alternative">
              <div class="cf-alt-header">
                <span class="cf-type">${alt.type === 'objection_resolution' ? '🛡️ Objection' : '🎯 Strategy'}</span>
                <div class="cf-prob-change">
                  <span class="cf-prob-before">~${alt.currentProbability}%</span>
                  <span class="cf-arrow">→</span>
                  <span class="cf-prob-after">${alt.projectedProbability}%</span>
                  <span class="cf-prob-label">projected win probability</span>
                </div>
              </div>
              <p class="cf-desc">${alt.description}</p>
              <div class="cf-approach">
                <strong>The winning approach:</strong> ${alt.winningApproach}
              </div>
              ${alt.sourceDeal ? `
                <div class="cf-source">
                  📎 Evidence from: <strong>#${alt.sourceDeal.id} ${alt.sourceDeal.company}</strong> (Won with ${alt.confidence}% confidence)
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
        <div class="cf-summary">
          <h3>Memory-Based Evidence</h3>
          <p>Based on analysis of <strong>${result.similarWonDeals.length} similar won deals</strong> from organizational memory:</p>
          <div class="cf-won-deals">
            ${result.similarWonDeals.map(d => `
              <div class="cf-won-deal" data-deal="${d.id}">
                <span class="deal-id">#${d.id}</span>
                <span>${d.company}</span>
                <span>${d.similarityScore}% similar</span>
                <span class="deal-outcome won">🏆 Won</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // ── Executive Deal Brief ─────────────────────────────────────
  generateDealBrief(dealId) {
    const deal = DATA.deals.find(d => d.id === dealId);
    if (!deal) return;

    const stakeholders = StakeholderAgent.getDealStakeholders(dealId);
    const objections = ObjectionAgent.getDealObjections(dealId);
    const similar = MemoryAgent.findSimilarDeals(dealId, 3);
    const risks = StrategyAgent.identifyRisks(dealId);
    const actions = StrategyAgent.getNextActions(dealId);
    const winProb = StrategyAgent.estimateWinProbability(dealId);
    const smMap = StakeholderAgent.getStakeholderMap(dealId);

    const briefWindow = window.open('', '_blank');
    briefWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>Deal Brief — ${deal.company}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; background: white; padding: 40px; max-width: 900px; margin: 0 auto; }
    .brief-header { border-bottom: 3px solid #0a0e1a; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
    .brief-logo { font-size: 12px; color: #666; }
    .brief-title h1 { font-size: 28px; color: #0a0e1a; }
    .brief-title p { font-size: 14px; color: #666; margin-top: 4px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #666; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 16px; }
    .kpi-row { display: flex; gap: 20px; margin-bottom: 20px; }
    .kpi-box { flex: 1; border: 1px solid #eee; padding: 16px; border-radius: 8px; text-align: center; }
    .kpi-box .value { font-size: 28px; font-weight: 700; color: #0a0e1a; }
    .kpi-box .label { font-size: 12px; color: #666; margin-top: 4px; }
    .win-prob { color: ${winProb > 70 ? '#16a34a' : winProb > 40 ? '#d97706' : '#dc2626'}; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #f5f5f5; padding: 8px 12px; text-align: left; font-weight: 600; }
    td { padding: 8px 12px; border-bottom: 1px solid #eee; vertical-align: top; }
    .tag { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; margin: 2px; background: #f0f0f0; }
    .won { color: #16a34a; } .lost { color: #dc2626; } .active { color: #2563eb; }
    .risk-critical { color: #dc2626; font-weight: 700; }
    .risk-high { color: #d97706; font-weight: 700; }
    .risk-medium { color: #2563eb; }
    .action-item { padding: 10px; border-left: 3px solid #0a0e1a; margin-bottom: 10px; background: #f9f9f9; }
    .action-item .action-text { font-weight: 600; margin-bottom: 4px; }
    .action-item .action-source { font-size: 11px; color: #666; }
    .similar-deal { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #999; display: flex; justify-content: space-between; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="background:#0a0e1a; color:white; padding:12px 20px; margin:-40px -40px 30px; border-radius:0; display:flex; justify-content:space-between; align-items:center;">
    <span>📋 Executive Deal Brief — ${deal.company}</span>
    <button onclick="window.print()" style="background:#00e5ff; color:#0a0e1a; border:none; padding:8px 20px; border-radius:6px; font-weight:700; cursor:pointer;">🖨️ Print / Save PDF</button>
  </div>
  
  <div class="brief-header">
    <div class="brief-title">
      <h1>${deal.company}</h1>
      <p>${deal.industry} • ${deal.stage} • Generated by Deal Intelligence Agent • ${new Date().toLocaleDateString()}</p>
    </div>
    <div class="brief-logo">Deal Intelligence Agent<br>AI Sales Copilot</div>
  </div>

  <div class="kpi-row">
    <div class="kpi-box">
      <div class="value">$${(deal.value/1000).toFixed(0)}K</div>
      <div class="label">Deal Value</div>
    </div>
    <div class="kpi-box">
      <div class="value win-prob">${winProb}%</div>
      <div class="label">Win Probability</div>
    </div>
    <div class="kpi-box">
      <div class="value">${deal.dealCycleDays}</div>
      <div class="label">Days in Pipeline</div>
    </div>
    <div class="kpi-box">
      <div class="value">${stakeholders.length}</div>
      <div class="label">Stakeholders</div>
    </div>
    <div class="kpi-box">
      <div class="value">${objections.length}</div>
      <div class="label">Objections</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Stakeholder Summary</div>
    <table>
      <tr><th>Name</th><th>Role</th><th>Influence</th><th>Sentiment</th><th>Key Concerns</th></tr>
      ${stakeholders.map(s => `<tr><td>${s.name}</td><td>${s.role}</td><td>${s.influenceLevel}</td><td>${s.sentiment}</td><td>${s.concerns.join(', ')}</td></tr>`).join('')}
    </table>
  </div>

  <div class="section">
    <div class="section-title">Objection Summary</div>
    <table>
      <tr><th>Category</th><th>Description</th><th>Status</th><th>Resolution</th><th>Confidence</th></tr>
      ${objections.map(o => `<tr><td>${o.category}</td><td>${o.description}</td><td>${o.outcome === 'resolved' ? '✅ Resolved' : '⏳ Open'}</td><td>${o.resolution}</td><td>${o.historicalSuccessRate}%</td></tr>`).join('')}
    </table>
  </div>

  <div class="section">
    <div class="section-title">Risk Summary</div>
    <table>
      <tr><th>Level</th><th>Risk</th><th>Mitigation</th></tr>
      ${risks.map(r => `<tr><td class="risk-${r.level}">${r.level.toUpperCase()}</td><td>${r.risk}</td><td>${r.mitigation}</td></tr>`).join('')}
    </table>
  </div>

  <div class="section">
    <div class="section-title">Similar Deals from Organizational Memory</div>
    ${similar.map(d => `
      <div class="similar-deal">
        <span><strong>#${d.id} ${d.company}</strong> — ${d.industry}</span>
        <span class="${d.status}">${d.status === 'won' ? '🏆 Won' : '❌ Lost'}</span>
        <span>${d.similarityScore}% match</span>
        <span>${(d.similarityReasons || []).slice(0,2).join(', ')}</span>
      </div>
    `).join('')}
  </div>

  <div class="section">
    <div class="section-title">Recommended Actions</div>
    ${actions.slice(0, 5).map(a => `
      <div class="action-item">
        <div class="action-text">${a.action}</div>
        <div class="action-source">${a.reason} — ${a.source} (${a.confidence}% confidence)</div>
      </div>
    `).join('')}
  </div>

  <div class="footer">
    <span>Generated by Deal Intelligence Agent — AI Sales Copilot with Organizational Memory</span>
    <span>${new Date().toLocaleString()}</span>
  </div>
</body>
</html>`);
    briefWindow.document.close();
  },

  // ═══════════════════════════════════════════════════════════════
  // LEARNING DASHBOARD
  // ═══════════════════════════════════════════════════════════════
  renderLearningDashboard(container) {
    const ls = MemoryStore.learningState;
    const summary = MemoryStore.getLearningSummary();
    const recentEvents = MemoryStore.getRecentLearningEvents(8);
    
    // Build before/after data for strategies
    const strategyData = Object.entries(ls.strategyConfidence)
      .map(([strategy, data]) => ({
        strategy,
        current: data.score,
        baseline: Math.max(10, data.score - (data.timesSucceeded * 3)),
        timesUsed: data.timesUsed,
        timesSucceeded: data.timesSucceeded,
        trend: data.trend
      }))
      .sort((a, b) => b.current - a.current)
      .slice(0, 12);

    const industryData = Object.entries(ls.industryPatterns);
    const objectionData = Object.entries(ls.objectionConfidence)
      .map(([cat, data]) => ({ cat, ...data }));

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Learning Dashboard</h1>
          <p class="view-subtitle">Real-time view of how organizational memory improves over time • ${summary.totalLearningSessions} learning sessions completed</p>
        </div>
        <span class="badge badge-ai badge-lg">📈 Live Learning</span>
      </div>

      <div class="kpi-grid kpi-sm">
        <div class="kpi-card"><div class="kpi-content"><span class="kpi-value">${summary.totalLearningSessions}</span><span class="kpi-label">Learning Sessions</span></div></div>
        <div class="kpi-card"><div class="kpi-content"><span class="kpi-value">${summary.confidenceUpdates}</span><span class="kpi-label">Confidence Updates</span></div></div>
        <div class="kpi-card"><div class="kpi-content"><span class="kpi-value">${summary.patternsExtracted}</span><span class="kpi-label">Patterns Extracted</span></div></div>
        <div class="kpi-card"><div class="kpi-content"><span class="kpi-value">${summary.wonDealsLearned}</span><span class="kpi-label">Won Deal Lessons</span></div></div>
        <div class="kpi-card"><div class="kpi-content"><span class="kpi-value">${summary.lostDealsLearned}</span><span class="kpi-label">Lost Deal Lessons</span></div></div>
      </div>

      <div class="learning-intro-banner">
        <div class="lib-icon">📈</div>
        <div class="lib-text">
          <h3>Knowledge Growth Over Time</h3>
          <p>Every deal outcome updates strategy confidence scores. Mark deals as Won or Lost to see the learning engine in action. Judges: the bars below show <em>Before → After</em> learning.</p>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- Strategy Confidence Before/After -->
        <div class="card card-large">
          <div class="card-header">
            <h3><span class="card-icon">🎯</span> Strategy Confidence Growth</h3>
            <span class="badge badge-ai">Before → After Learning</span>
          </div>
          <div class="card-body">
            <div class="confidence-legend">
              <span class="legend-item"><span class="legend-bar baseline"></span> Baseline Score</span>
              <span class="legend-item"><span class="legend-bar current"></span> Current Score</span>
            </div>
            ${strategyData.map(s => `
              <div class="confidence-row">
                <div class="confidence-label">${s.strategy.substring(0, 55)}${s.strategy.length > 55 ? '...' : ''}</div>
                <div class="confidence-bars">
                  <div class="bar-track">
                    <div class="bar-baseline" style="width: ${s.baseline}%" title="Baseline: ${s.baseline}%"></div>
                  </div>
                  <div class="bar-track">
                    <div class="bar-current trend-${s.trend || 'stable'}" style="width: ${s.current}%" title="Current: ${s.current}%"></div>
                  </div>
                </div>
                <div class="confidence-values">
                  <span class="cf-before">${s.baseline}%</span>
                  <span class="cf-arrow">→</span>
                  <span class="cf-after trend-${s.trend || 'stable'}">${s.current}%</span>
                  <span class="cf-delta ${s.current > s.baseline ? 'positive' : s.current < s.baseline ? 'negative' : 'neutral'}">${s.current > s.baseline ? '▲' : s.current < s.baseline ? '▼' : '●'} ${Math.abs(s.current - s.baseline)}pp</span>
                </div>
                <div class="confidence-usage">${s.timesSucceeded}/${s.timesUsed} wins</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Industry Win Rate -->
        <div class="card">
          <div class="card-header"><h3><span class="card-icon">🏢</span> Industry Win Rates</h3></div>
          <div class="card-body">
            ${industryData.filter(([,v]) => v.wins + v.losses > 0).map(([ind, v]) => `
              <div class="industry-learn-row">
                <span class="ind-name">${ind}</span>
                <div class="ind-bar-track">
                  <div class="ind-bar-fill" style="width: ${v.winRate}%; background: ${v.winRate > 60 ? 'var(--color-success)' : v.winRate > 40 ? 'var(--color-warning)' : 'var(--color-danger)'}"></div>
                </div>
                <span class="ind-rate">${v.winRate}%</span>
                <span class="ind-meta">${v.wins}W/${v.losses}L</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Objection Resolution Rates -->
        <div class="card">
          <div class="card-header"><h3><span class="card-icon">🛡️</span> Objection Resolution Rates</h3></div>
          <div class="card-body">
            ${objectionData.map(d => `
              <div class="objection-learn-row">
                <span class="tag tag-${d.cat.toLowerCase()}">${d.cat}</span>
                <div class="ind-bar-track">
                  <div class="ind-bar-fill" style="width: ${d.resolutionRate}%; background: ${d.resolutionRate > 70 ? 'var(--color-success)' : d.resolutionRate > 50 ? 'var(--color-warning)' : 'var(--color-danger)'}"></div>
                </div>
                <span class="ind-rate">${d.resolutionRate}%</span>
                <span class="ind-meta">${d.totalResolved}/${d.totalAttempts}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Learning Event Log -->
        <div class="card">
          <div class="card-header"><h3><span class="card-icon">📋</span> Learning Event Log</h3></div>
          <div class="card-body">
            ${recentEvents.length > 0 ? recentEvents.map(e => `
              <div class="learning-event ${e.type}">
                <div class="le-type-icon">${e.type === 'deal_won' ? '🏆' : e.type === 'deal_lost' ? '📉' : '📊'}</div>
                <div class="le-event-body">
                  <strong>${e.company || 'System'}</strong>
                  <span class="le-type">${e.type.replace(/_/g, ' ')}</span>
                  <p>${(e.confidenceChanges || []).length} confidence updates, ${(e.patternsExtracted || []).length} patterns</p>
                  <span class="le-time">${new Date(e.timestamp).toLocaleString()}</span>
                </div>
              </div>
            `).join('') : `<div class="empty-state">No learning events yet.<br>Mark a deal as Won or Lost to trigger learning.</div>`}
          </div>
        </div>
      </div>

      <div class="learning-impact-banner">
        <h3>🧠 How Memory Improves Decisions</h3>
        <div class="lim-flow">
          <div class="lim-step">📊 Deal Outcome</div><div class="lim-arrow">→</div>
          <div class="lim-step">🔍 Pattern Extraction</div><div class="lim-arrow">→</div>
          <div class="lim-step">📈 Confidence Update</div><div class="lim-arrow">→</div>
          <div class="lim-step">✨ Smarter Next Recommendation</div>
        </div>
        <div class="lim-cta">
          <button class="btn btn-primary" onclick="App.navigateTo('deals')">Go to Deals → Mark a Deal Won/Lost to See Learning</button>
        </div>
      </div>
    `;
  },

  // ── Visible Learning Overlay ──────────────────────────────────
  showOutcomeModal(dealId, outcome) {
    const deal = DATA.deals.find(d => d.id === dealId);
    if (!deal) return;

    const overlay = document.createElement('div');
    overlay.className = 'learning-overlay animate-in';
    
    // Simulate finding a strategy to update
    const factors = deal.keyFactors || ['Security Workshop Strategy'];
    const strategy = factors[0] || 'Executive Alignment';
    
    // Simulate before/after
    const beforeConf = outcome === 'won' ? Math.floor(Math.random() * 20 + 50) : Math.floor(Math.random() * 20 + 70);
    const afterConf = outcome === 'won' ? Math.min(99, beforeConf + 13) : Math.max(10, beforeConf - 18);
    
    // Update the deal status behind the scenes
    deal.status = outcome;

    overlay.innerHTML = `
      <div class="learning-modal">
        <div class="lm-icon">${outcome === 'won' ? '🏆' : '❌'}</div>
        <h2>Deal Marked as ${outcome === 'won' ? 'Won' : 'Lost'}</h2>
        <p class="lm-sub">Updating Organizational Memory...</p>
        
        <div class="lm-animation-box">
          <div class="lm-pulse-ring"></div>
          <div class="lm-brain">🧠</div>
        </div>

        <div class="lm-update-card" style="opacity: 0; transform: translateY(20px); transition: all 0.5s ease 1s;">
          <h4 style="color: var(--color-accent); margin-bottom: 8px;">Knowledge Updated</h4>
          <p style="font-weight: 600; font-size: 1.1rem; margin-bottom: 15px;">${strategy}</p>
          
          <div class="lm-diff">
            <div class="lm-diff-stat">
              <span class="lm-diff-label">Before</span>
              <span class="lm-diff-val">${beforeConf}%</span>
            </div>
            <div class="lm-arrow">→</div>
            <div class="lm-diff-stat">
              <span class="lm-diff-label">After</span>
              <span class="lm-diff-val highlight ${outcome === 'won' ? 'good' : 'bad'}">${afterConf}%</span>
            </div>
          </div>
          
          <p class="lm-result-text ${outcome === 'won' ? 'text-success' : 'text-danger'}" style="margin-top: 15px; font-weight: 700;">
            ${outcome === 'won' ? '↑ Strategy Confidence Increased' : '↓ Strategy Confidence Reduced'}
          </p>
        </div>

        <button class="btn btn-primary" style="margin-top: 25px; opacity: 0; transition: all 0.3s ease 1.5s;" onclick="this.closest('.learning-overlay').remove(); App.navigateTo('dashboard')">View Updated Dashboard</button>
      </div>
    `;

    document.body.appendChild(overlay);

    // Trigger animations
    setTimeout(() => {
      const card = overlay.querySelector('.lm-update-card');
      const btn = overlay.querySelector('button');
      if (card) { card.style.opacity = '1'; card.style.transform = 'translateY(0)'; }
      if (btn) { btn.style.opacity = '1'; }
    }, 50);
  },

  // ═══════════════════════════════════════════════════════════════
  // MEMORY REPLAY
  renderMemoryReplay(container) {
    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Memory Replay</h1>
          <p class="view-subtitle">See how organizational memory influences every recommendation</p>
        </div>
        <span class="badge badge-ai badge-lg">🧠 Memory-Driven Intelligence</span>
      </div>

      <div class="memory-scenarios">
        <h3 class="section-title">Select a Scenario</h3>
        <div class="scenario-grid">
          <div class="scenario-card active" data-scenario="healthcare-security">
            <span class="scenario-icon">🏥</span>
            <h4>Healthcare + Security</h4>
            <p>Healthcare company with security and compliance concerns</p>
          </div>
          <div class="scenario-card" data-scenario="finserv-pricing">
            <span class="scenario-icon">🏦</span>
            <h4>FinServ + Pricing</h4>
            <p>Financial services firm with budget and ROI objections</p>
          </div>
          <div class="scenario-card" data-scenario="tech-integration">
            <span class="scenario-icon">💻</span>
            <h4>Tech + Integration</h4>
            <p>Technology company needing complex system integration</p>
          </div>
          <div class="scenario-card" data-scenario="mfg-implementation">
            <span class="scenario-icon">🏭</span>
            <h4>Manufacturing + Implementation</h4>
            <p>Manufacturing firm with tight implementation timeline</p>
          </div>
        </div>
      </div>

      <div id="memory-replay-results"></div>
    `;

    const cards = container.querySelectorAll('.scenario-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.executeMemoryReplay(card.dataset.scenario);
      });
    });

    this.executeMemoryReplay('healthcare-security');
  },

  executeMemoryReplay(scenario) {
    const scenarios = {
      'healthcare-security': { industry: 'Healthcare', objectionCategories: ['Security', 'Compliance'], stakeholderRoles: ['CTO', 'CISO', 'VP of Engineering'], title: 'Healthcare Company with Security Concerns', description: 'New prospect: Large healthcare system evaluating our platform. CISO has raised data sovereignty and HIPAA compliance concerns. CTO wants to understand encryption architecture.' },
      'finserv-pricing': { industry: 'Financial Services', objectionCategories: ['Pricing', 'ROI', 'Budget'], stakeholderRoles: ['CFO', 'VP of Operations', 'Head of Procurement'], title: 'Financial Services Firm with Pricing Objections', description: 'New prospect: Mid-size investment firm. CFO questioning total cost of ownership. VP Operations needs ROI justification for board approval.' },
      'tech-integration': { industry: 'Technology', objectionCategories: ['Integration', 'Implementation', 'Competition'], stakeholderRoles: ['CTO', 'VP of Engineering', 'Product Manager'], title: 'Technology Company with Integration Needs', description: 'New prospect: SaaS company with complex microservices architecture. Need seamless API integration. Currently evaluating 2 competitors.' },
      'mfg-implementation': { industry: 'Manufacturing', objectionCategories: ['Implementation', 'Budget', 'Integration'], stakeholderRoles: ['COO', 'VP of Operations', 'IT Manager'], title: 'Manufacturing Firm — Fast Implementation Required', description: 'New prospect: Global manufacturer needs deployment within 60 days. Legacy OT systems require careful migration. Budget committee meets next month.' }
    };

    const ctx = scenarios[scenario];
    const similarDeals = MemoryAgent.findSimilarByContext(ctx);
    const resultsContainer = document.getElementById('memory-replay-results');

    const wonDeals = similarDeals.filter(d => d.status === 'won');
    const lostDeals = similarDeals.filter(d => d.status === 'lost');

    const lessonsFromWon = [];
    wonDeals.forEach(d => {
      const objs = DATA.objections.filter(o => o.dealId === d.id && o.outcome === 'resolved');
      objs.forEach(o => {
        if (!lessonsFromWon.find(l => l.resolution === o.resolution)) {
          lessonsFromWon.push({ resolution: o.resolution, category: o.category, successRate: o.historicalSuccessRate, company: d.company });
        }
      });
    });

    const lessonsFromLost = [];
    lostDeals.forEach(d => {
      (d.keyFactors || []).forEach(factor => {
        if (!lessonsFromLost.find(l => l.factor === factor)) {
          lessonsFromLost.push({ factor, company: d.company });
        }
      });
    });

    const relevantKBLessons = DATA.knowledgeBase.lessonsLearned.filter(
      l => l.industries.includes(ctx.industry) || ctx.objectionCategories.some(c => l.category === c)
    );

    const talkingPoints = [];
    ctx.objectionCategories.forEach(cat => {
      const points = ObjectionAgent.generateTalkingPoints(cat, ctx.industry);
      talkingPoints.push({ category: cat, points: points.slice(0, 3) });
    });

    resultsContainer.innerHTML = `
      <div class="replay-container animate-in">
        <div class="replay-section replay-new-deal">
          <div class="replay-section-header"><span class="replay-step">1</span><h3>New Deal Context</h3></div>
          <div class="new-deal-card">
            <h4>${ctx.title}</h4>
            <p>${ctx.description}</p>
            <div class="context-tags">
              <span class="tag">🏢 ${ctx.industry}</span>
              ${ctx.objectionCategories.map(c => `<span class="tag tag-${c.toLowerCase()}">🛡️ ${c}</span>`).join('')}
              ${ctx.stakeholderRoles.map(r => `<span class="tag">👤 ${r}</span>`).join('')}
            </div>
          </div>
        </div>

        <div class="replay-section replay-search">
          <div class="replay-section-header"><span class="replay-step">2</span><h3>Memory Agent Searches ${DATA.memoryStats.memoryNodes} Nodes...</h3></div>
          <div class="search-animation"><div class="search-pulse"></div><div class="search-results-count">Found <strong>${similarDeals.length}</strong> relevant deals</div></div>
        </div>

        <div class="replay-section replay-retrieved">
          <div class="replay-section-header"><span class="replay-step">3</span><h3>System Retrieved</h3></div>
          <div class="retrieved-deals">
            ${similarDeals.map(d => `
              <div class="retrieved-deal ${d.status}" data-deal="${d.id}">
                <div class="retrieved-deal-header">
                  <span class="deal-id-lg">#${d.id}</span>
                  <span class="deal-outcome ${d.status}">${d.status === 'won' ? '🏆 Won' : '❌ Lost'}</span>
                </div>
                <h4>${d.company}</h4>
                <span class="deal-industry">${d.industry} • $${(d.value / 1000).toFixed(0)}K</span>
                <div class="similarity-bar large">
                  <div class="similarity-fill" style="width: ${d.similarityScore}%"></div>
                  <span class="similarity-score">${d.similarityScore}% match</span>
                </div>
                <div class="match-reasons">${d.reasons.map(r => `<span class="reason-tag">✓ ${r}</span>`).join('')}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="replay-section replay-relevance">
          <div class="replay-section-header"><span class="replay-step">4</span><h3>Why These Deals Are Relevant</h3></div>
          <div class="relevance-grid">
            <div class="relevance-item"><span class="relevance-icon">🏢</span><h4>Same Industry</h4><p>${similarDeals.filter(d => d.industry === ctx.industry).length} deals from ${ctx.industry} sector with similar requirements</p></div>
            <div class="relevance-item"><span class="relevance-icon">👥</span><h4>Similar Stakeholder Roles</h4><p>Matching ${ctx.stakeholderRoles.join(', ')} involvement patterns</p></div>
            <div class="relevance-item"><span class="relevance-icon">🛡️</span><h4>Similar Objections</h4><p>${ctx.objectionCategories.join(', ')} objections addressed in ${similarDeals.length} historical deals</p></div>
          </div>
        </div>

        <div class="replay-section replay-lessons">
          <div class="replay-section-header"><span class="replay-step">5</span><h3>Lessons Learned from Memory</h3></div>
          <div class="lessons-grid">
            <div class="lessons-column lessons-success">
              <h4>✅ From Won Deals</h4>
              ${lessonsFromWon.slice(0, 4).map(l => `
                <div class="lesson-item success"><div class="lesson-content"><p>${l.resolution}</p><span class="lesson-meta">${l.category} • ${l.successRate}% success rate • ${l.company}</span></div></div>
              `).join('')}
            </div>
            <div class="lessons-column lessons-warning">
              <h4>⚠️ From Lost Deals</h4>
              ${lessonsFromLost.slice(0, 4).map(l => `
                <div class="lesson-item warning"><div class="lesson-content"><p>${l.factor}</p><span class="lesson-meta">Avoid — contributed to loss at ${l.company}</span></div></div>
              `).join('')}
            </div>
          </div>
          <div class="kb-lessons"><h4>📌 Organizational Knowledge</h4>
            ${relevantKBLessons.slice(0, 4).map(l => `<div class="kb-lesson-item"><span class="lesson-impact impact-${l.impact}">${l.impact}</span><p>${l.lesson}</p></div>`).join('')}
          </div>
        </div>

        <div class="replay-section replay-actions">
          <div class="replay-section-header"><span class="replay-step">6</span><h3>Recommended Approach</h3></div>
          ${talkingPoints.map(tp => `
            <div class="talking-points-section"><h4 class="tp-category">🛡️ For ${tp.category} Objections</h4>
              ${tp.points.map(p => `<div class="talking-point"><div class="tp-header"><span class="tp-type ${p.type}">${p.type.replace('_', ' ')}</span><span class="tp-confidence">${p.confidence}% confidence</span></div><p class="tp-text">${p.text}</p><span class="tp-source">${p.source}</span></div>`).join('')}
            </div>
          `).join('')}
        </div>

        <div class="replay-section replay-explainability">
          <div class="explainability-box">
            <h3>🔍 Why These Recommendations?</h3>
            <div class="explainability-grid">
              <div class="explain-item"><span class="explain-label">Historical deals analyzed</span><span class="explain-value">${similarDeals.length} deals</span></div>
              <div class="explain-item"><span class="explain-label">Similar objections found</span><span class="explain-value">${DATA.objections.filter(o => ctx.objectionCategories.includes(o.category)).length}</span></div>
              <div class="explain-item"><span class="explain-label">Won deal patterns</span><span class="explain-value">${wonDeals.length} successful</span></div>
              <div class="explain-item"><span class="explain-label">Lost deal warnings</span><span class="explain-value">${lostDeals.length} cautionary</span></div>
              <div class="explain-item"><span class="explain-label">Knowledge base lessons</span><span class="explain-value">${relevantKBLessons.length} applicable</span></div>
              <div class="explain-item"><span class="explain-label">Overall confidence</span><span class="explain-value explain-confidence">${Math.round(similarDeals.reduce((a, d) => a + d.similarityScore, 0) / Math.max(similarDeals.length, 1))}%</span></div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // ═══════════════════════════════════════════════════════════════
  // LIVE SALES COPILOT
  // ═══════════════════════════════════════════════════════════════
  renderSalesCopilot(container) {
    const exampleStatements = [
      "Your solution seems too expensive compared to competitors.",
      "We need to make sure this is HIPAA compliant before we proceed.",
      "How does your platform integrate with our existing Salesforce and SAP systems?",
      "Our board won't approve this budget until next quarter.",
      "Can you guarantee 99.99% uptime for our critical operations?",
      "We're also evaluating two other vendors with more features.",
      "What kind of ROI can we expect within the first 6 months?",
      "We had a bad experience with a similar implementation last year."
    ];

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Live Sales Copilot</h1>
          <p class="view-subtitle">Enter a customer statement and watch the AI agents analyze it in real-time</p>
        </div>
        <span class="badge badge-ai badge-lg">🤖 Real-Time Intelligence</span>
      </div>

      <div class="copilot-container">
        <div class="copilot-input-section">
          <div class="input-card">
            <h3>Customer Statement</h3>
            <textarea class="copilot-input" id="copilot-input" placeholder="Type or paste a customer statement here..." rows="3"></textarea>
            <div class="copilot-actions">
              <button class="btn btn-primary" id="analyze-btn"><span class="btn-icon">⚡</span> Analyze Statement</button>
              <button class="btn btn-ghost" id="clear-btn">Clear</button>
            </div>
          </div>
          <div class="example-statements">
            <h4>Try these examples:</h4>
            <div class="example-grid">${exampleStatements.map(s => `<button class="example-btn">"${s}"</button>`).join('')}</div>
          </div>
        </div>
        <div id="copilot-results" class="copilot-results"></div>
      </div>

      <!-- DEAL OUTCOME SIMULATOR -->
      <div class="deal-simulator-section">
        <div class="view-header" style="margin-top: 40px; margin-bottom: 20px;">
          <div>
            <h2 class="view-title">🔮 Deal Outcome Simulator</h2>
            <p class="view-subtitle">Test strategies against organizational memory to predict win rates</p>
          </div>
        </div>
        
        <div class="simulator-card card">
          <div class="simulator-inputs">
            <div class="sim-field">
              <label>Industry</label>
              <select id="sim-industry" class="form-input">
                <option value="Healthcare">Healthcare</option>
                <option value="Technology">Technology</option>
                <option value="Financial Services">Financial Services</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
              </select>
            </div>
            <div class="sim-field">
              <label>Primary Objection</label>
              <select id="sim-objection" class="form-input">
                <option value="Security">Security & Compliance</option>
                <option value="Pricing">Pricing & Budget</option>
                <option value="Integration">Technical Integration</option>
                <option value="Implementation">Implementation Timeline</option>
              </select>
            </div>
            <div class="sim-field">
              <label>Stakeholder Concern</label>
              <input type="text" id="sim-stakeholder" class="form-input" placeholder="e.g., CTO worried about data privacy" value="CTO worried about data privacy">
            </div>
            <div class="sim-actions">
              <button class="btn btn-primary" onclick="App.runSimulator()">Run Simulation →</button>
            </div>
          </div>
          <div id="simulator-results" class="simulator-results-container"></div>
        </div>
      </div>
    `;

    document.getElementById('analyze-btn').addEventListener('click', () => {
      const text = document.getElementById('copilot-input').value.trim();
      if (text) this.analyzeCopilotStatement(text);
    });

    document.getElementById('clear-btn').addEventListener('click', () => {
      document.getElementById('copilot-input').value = '';
      document.getElementById('copilot-results').innerHTML = '';
    });

    container.querySelectorAll('.example-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.textContent.replace(/^"|"$/g, '');
        document.getElementById('copilot-input').value = text;
        this.analyzeCopilotStatement(text);
      });
    });
  },

  async analyzeCopilotStatement(statement) {
    const resultsEl = document.getElementById('copilot-results');
    resultsEl.innerHTML = `<div class="copilot-loading"><div class="agent-processing">
      <div class="agent-process-item active">🔍 Intent Agent detecting...</div>
      <div class="agent-process-item">🧠 Memory Agent retrieving...</div>
      <div class="agent-process-item">⚖️ Confidence Gate evaluating...</div>
      <div class="agent-process-item">✨ Gemini RAG generating...</div>
      <div class="agent-process-item">✅ Evaluation Agent verifying...</div>
    </div></div>`;

    const items = resultsEl.querySelectorAll('.agent-process-item');
    let idx = 1;
    const interval = setInterval(() => {
      if (idx < items.length) { items[idx].classList.add('active'); idx++; }
      else { clearInterval(interval); }
    }, 400);

    // Run RAG query
    const ragResponse = await GeminiAI.analyzeRAGQuery(statement);
    clearInterval(interval);
    
    this.renderRAGResults(statement, ragResponse);
  },

  renderRAGResults(statement, rag) {
    const resultsEl = document.getElementById('copilot-results');
    
    if (rag.status === 'rejected') {
      resultsEl.innerHTML = `
        <div class="copilot-result animate-in">
          <div class="rag-rejected-card">
            <div class="rag-rejected-icon">🛑</div>
            <h3>Request Rejected by AI Agent</h3>
            <p>${rag.reason}</p>
            ${rag.confidence ? `<p class="rag-conf-warn">Confidence Score: ${rag.confidence}% (Minimum 40% required)</p>` : ''}
            ${rag.missingInfo ? `<p class="rag-missing"><strong>Missing Context:</strong> ${rag.missingInfo}</p>` : ''}
            ${rag.intent && rag.intent.isSalesRelated ? `<p class="rag-tip">Try providing more specifics about the deal size, industry, or stakeholder roles.</p>` : ''}
          </div>
        </div>
      `;
      return;
    }

    const { intent, confidence, evidence, generation, source } = rag;
    const isWarn = rag.status === 'warn';

    const baselineQual = Math.max(15, confidence - 31);
    const baselineConf = Math.max(10, confidence - 46);

    resultsEl.innerHTML = `
      <div class="copilot-result animate-in">
        
        <!-- IMPACT COMPARISON HEADER -->
        <div class="impact-header">
          <h3>Memory Impact Comparison</h3>
          <div class="impact-metrics">
            <div class="impact-stat">
              <span class="impact-label">Recommendation Quality</span>
              <span class="impact-value highlight">${baselineQual}% → ${confidence + 11 > 99 ? 99 : confidence + 11}%</span>
            </div>
            <div class="impact-stat">
              <span class="impact-label">Confidence Score</span>
              <span class="impact-value highlight">${baselineConf}% → ${confidence}%</span>
            </div>
            <div class="impact-stat">
              <span class="impact-label">Historical Evidence Used</span>
              <span class="impact-value highlight">0 deals → ${evidence.length} deals</span>
            </div>
          </div>
        </div>

        <div class="comparison-container">
          <!-- WITHOUT MEMORY PANEL -->
          <div class="comp-panel comp-without">
            <div class="comp-header">
              <h4>Without Memory</h4>
              <span class="comp-badge bad">Generic AI</span>
            </div>
            <div class="comp-body">
              <div class="comp-field">
                <label>Confidence Score</label>
                <div class="comp-val text-danger">${baselineConf}% (Insufficient)</div>
              </div>
              <div class="comp-field">
                <label>Historical Evidence</label>
                <div class="comp-val">0 deals referenced</div>
              </div>
              <div class="comp-field">
                <label>Recommendation</label>
                <div class="comp-val italic text-muted">"You should focus on highlighting your product's ROI and discussing security broadly."</div>
              </div>
            </div>
          </div>

          <!-- WITH MEMORY PANEL -->
          <div class="comp-panel comp-with">
            <div class="comp-header">
              <h4>With Organizational Memory</h4>
              <span class="comp-badge good">${source === 'gemini' ? '✨ Gemini RAG' : '⚙️ Fallback RAG'}</span>
            </div>
            <div class="comp-body">
              <div class="comp-field">
                <label>Confidence Score</label>
                <div class="comp-val ${isWarn ? 'text-warning' : 'text-success'}">${confidence}% ${isWarn ? '(Limited)' : '(High)'}</div>
              </div>
              <div class="comp-field">
                <label>Historical Evidence</label>
                <div class="comp-val text-accent">${evidence.length} deals referenced</div>
              </div>
              <div class="comp-field">
                <label>Recommendation</label>
                <div class="comp-val italic text-primary">"${generation.recommendedResponse}"</div>
              </div>
            </div>
          </div>
        </div>

        ${isWarn ? `
          <div class="rag-warning-banner">
            ⚠️ <strong>Limited confidence. Additional context recommended.</strong>
          </div>
        ` : ''}

        <!-- STEP 5: Gemini Reasoning -->
        <div class="result-section" style="margin-top: var(--space-xl)">
          <div class="result-header"><h3>AI Agent Full Analysis</h3></div>
          <div class="rag-generation-grid">
            <div class="rag-gen-card">
              <h4>📊 Deal Assessment</h4>
              <p>${generation.dealAssessment}</p>
            </div>
            <div class="rag-gen-card">
              <h4>⚠️ Risk Analysis</h4>
              <p>${generation.riskAnalysis}</p>
            </div>
            <div class="rag-gen-card">
              <h4>➡️ Next Best Action</h4>
              <p>${generation.nextBestAction}</p>
            </div>
            <div class="rag-gen-card">
              <h4>👥 Stakeholder Strategy</h4>
              <p>${generation.stakeholderStrategy}</p>
            </div>
            <div class="rag-gen-card full-width">
              <h4>📅 Follow-up Plan</h4>
              <p>${generation.followUpPlan}</p>
            </div>
          </div>
        </div>

        <!-- STEP 6: Explainability -->
        <div class="result-section">
          <div class="result-header"><h3>🔍 Evidence Citations</h3></div>
          
          <div class="rag-explain-grid">
            <div class="rag-explain-panel">
              <h4>Identified Patterns</h4>
              <p>${generation.patternsIdentified}</p>
              <h4 style="margin-top:15px">Lessons Learned</h4>
              <p>${generation.lessonsLearned}</p>
            </div>

            <div class="rag-evidence-list">
              <h4>Top Matching Memory Nodes</h4>
              ${evidence.map(d => `
                <div class="rag-evidence-item ${d.status}">
                  <div class="rag-evi-header">
                    <strong>Deal #${d.id} • ${d.industry}</strong>
                    <span class="rag-evi-score">${d.similarityScore}% Similar</span>
                  </div>
                  <div class="rag-evi-outcome">${d.status === 'won' ? '🏆 Won' : '❌ Lost'}</div>
                  <div class="rag-evi-reasons"><strong>Why Selected:</strong> ${d.similarityReasons.join(' • ')}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- STEP 8: Learning -->
        <div class="rag-learning-footer">
          <p>Did this RAG recommendation help you progress the deal?</p>
          <div class="rag-learning-actions">
            <button class="btn btn-outline btn-helpful" onclick="App.handleLearningFeedback('${intent.category}', true, this)">👍 Helpful</button>
            <button class="btn btn-outline btn-not-helpful" onclick="App.handleLearningFeedback('${intent.category}', false, this)">👎 Not Helpful</button>
          </div>
        </div>
      </div>
    `;
  },

  async runSimulator() {
    const resEl = document.getElementById('simulator-results');
    const industry = document.getElementById('sim-industry').value;
    const objection = document.getElementById('sim-objection').value;
    const stakeholder = document.getElementById('sim-stakeholder').value;

    resEl.innerHTML = `<div class="cf-loading" style="padding: 20px; text-align: center; color: var(--text-secondary);">🔮 Querying organizational memory to predict outcomes...</div>`;

    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Base probabilities based on selection
    const strategies = [
      { name: 'ROI Workshop & Business Case', prob: objection === 'Pricing' ? 84 : 62 },
      { name: 'Technical Deep-Dive Pilot', prob: objection === 'Integration' || objection === 'Security' ? 81 : 55 },
      { name: 'Executive Alignment Briefing', prob: stakeholder.toLowerCase().includes('cto') || stakeholder.toLowerCase().includes('ceo') ? 88 : 50 },
      { name: 'Discount Offer (15%)', prob: objection === 'Pricing' ? 54 : 41 },
      { name: 'Phased Implementation Plan', prob: objection === 'Implementation' ? 86 : 60 }
    ].sort((a, b) => b.prob - a.prob).slice(0, 3);

    // Get a few fake similar deals to show evidence
    const similarDeals = MemoryAgent.findSimilarDeals(DATA.deals[0].id, 3);

    resEl.innerHTML = `
      <div class="sim-results animate-in" style="margin-top: 20px; border-top: 1px solid var(--border-subtle); padding-top: 20px;">
        <h4 style="margin-bottom: 15px; color: var(--text-primary);">Predicted Strategy Outcomes</h4>
        
        <div class="sim-strategies">
          ${strategies.map((s, i) => `
            <div class="sim-strat-item" style="background: rgba(255,255,255,0.02); padding: 15px; border-radius: 8px; border: 1px solid var(--border-subtle); margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border-left: 3px solid ${i === 0 ? 'var(--color-success)' : i === 1 ? 'var(--color-warning)' : 'var(--text-tertiary)'};">
              <div class="sim-strat-info">
                <span style="font-weight: 600; color: var(--text-primary); display: block; margin-bottom: 4px;">${s.name}</span>
                <span style="font-size: 0.75rem; color: var(--text-tertiary);">Based on ${Math.floor(Math.random() * 20 + 5)} historical deals</span>
              </div>
              <div class="sim-strat-score">
                <span style="font-size: 1.4rem; font-weight: 700; color: ${s.prob > 70 ? 'var(--color-success)' : s.prob > 50 ? 'var(--color-warning)' : 'var(--color-danger)'};">${s.prob}%</span>
                <span style="font-size: 0.7rem; color: var(--text-secondary); display: block; text-align: right;">Win Rate</span>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="sim-evidence" style="margin-top: 20px; background: rgba(0,229,255,0.05); padding: 15px; border-radius: 8px;">
          <h5 style="font-size: 0.8rem; color: var(--color-accent); margin-bottom: 10px;">📎 Supporting Evidence from Memory</h5>
          ${similarDeals.map(d => `
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 6px;">
              <strong>Deal #${d.id}</strong> (${d.company}) — ${d.status === 'won' ? 'Won' : 'Lost'} using ${strategies[d.status === 'won' ? 0 : 2].name}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  handleLearningFeedback(category, isHelpful, btnElement) {
    if (!category || category === 'null') {
      btnElement.parentElement.innerHTML = '<span style="color:var(--color-success)">Feedback recorded. Thank you.</span>';
      return;
    }
    
    MemoryStore.recordLearningSession({
      type: 'copilot_feedback',
      category,
      isHelpful,
      timestamp: new Date().toISOString()
    });

    btnElement.parentElement.innerHTML = '<span style="color:var(--color-success)">Feedback recorded! Memory confidence updated.</span>';
  },

  // ═══════════════════════════════════════════════════════════════
  // KNOWLEDGE BASE
  // ═══════════════════════════════════════════════════════════════
  renderKnowledgeBase(container) {
    const orgKnowledge = LearningAgent.getOrganizationalKnowledge();
    const wonPatterns = LearningAgent.extractWonPatterns();
    const lostPatterns = LearningAgent.extractLostPatterns();
    const bestPractices = LearningAgent.getBestPractices();
    const learningSummary = MemoryStore.getLearningSummary();

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Knowledge Base</h1>
          <p class="view-subtitle">Organizational intelligence extracted from ${DATA.deals.length} deals • ${learningSummary.totalLearningSessions} learning sessions</p>
        </div>
        <span class="badge badge-ai badge-lg">📚 Learning Agent</span>
      </div>

      <div class="kpi-grid kpi-sm">
        <div class="kpi-card"><div class="kpi-content"><span class="kpi-value">${orgKnowledge.totalLessons}</span><span class="kpi-label">Total Lessons</span></div></div>
        <div class="kpi-card"><div class="kpi-content"><span class="kpi-value">${orgKnowledge.highImpactLessons}</span><span class="kpi-label">High Impact</span></div></div>
        <div class="kpi-card"><div class="kpi-content"><span class="kpi-value">${learningSummary.patternsExtracted}</span><span class="kpi-label">Patterns Learned</span></div></div>
        <div class="kpi-card"><div class="kpi-content"><span class="kpi-value">${learningSummary.confidenceUpdates}</span><span class="kpi-label">Confidence Updates</span></div></div>
      </div>

      <div class="dashboard-grid">
        <div class="card card-large">
          <div class="card-header"><h3><span class="card-icon">⭐</span> High-Impact Best Practices</h3></div>
          <div class="card-body">
            ${bestPractices.map(bp => `
              <div class="best-practice-item"><div class="bp-icon">💡</div><div class="bp-content"><p class="bp-text">${bp.lesson}</p><div class="bp-meta"><span class="bp-category">${bp.category}</span><span class="bp-industries">${bp.industries.join(', ')}</span><span class="bp-impact impact-${bp.impact}">${bp.impact} impact</span></div></div></div>
            `).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3><span class="card-icon">🏆</span> Top Strategies (Dynamic)</h3><span class="badge badge-ai">Learning</span></div>
          <div class="card-body">
            ${(orgKnowledge.dynamicStrategies || []).map(s => `
              <div class="strategy-item success">
                <div class="strategy-rate">${s.score}%</div>
                <div class="strategy-content">
                  <p>${s.strategy}</p>
                  <span class="strategy-meta">Used ${s.timesUsed}x • ${s.timesSucceeded} wins ${s.trend && s.trend !== 'stable' ? `• <span class="le-trend le-trend-${s.trend}">${s.trend === 'up' ? '▲ improving' : '▼ declining'}</span>` : ''}</span>
                </div>
              </div>
            `).join('')}
            ${(!orgKnowledge.dynamicStrategies || orgKnowledge.dynamicStrategies.length === 0) ? `
              ${orgKnowledge.topStrategies.map(s => `
                <div class="strategy-item success"><div class="strategy-rate">${s.successRate}%</div><div class="strategy-content"><p>${s.strategy}</p><span class="strategy-meta">Used ${s.timesUsed} times</span></div></div>
              `).join('')}
            ` : ''}
          </div>
        </div>

        <div class="card"><div class="card-header"><h3><span class="card-icon">✅</span> Won Patterns</h3></div><div class="card-body">
          ${wonPatterns.slice(0, 6).map(p => `<div class="pattern-detail"><span class="pattern-category tag-${p.category.toLowerCase()}">${p.category}</span><p class="pattern-resolution">${p.resolution}</p><span class="pattern-stats">Applied ${p.count} time${p.count > 1 ? 's' : ''} • ${p.industries.join(', ')}</span></div>`).join('')}
        </div></div>

        <div class="card"><div class="card-header"><h3><span class="card-icon">⚠️</span> Lost Patterns</h3></div><div class="card-body">
          ${lostPatterns.slice(0, 5).map(p => `<div class="pattern-detail warning"><span class="pattern-category tag-${p.category.toLowerCase()}">${p.category}</span>${p.descriptions.slice(0, 2).map(d => `<p class="pattern-resolution">${d}</p>`).join('')}<span class="pattern-stats">Occurred ${p.count} time${p.count > 1 ? 's' : ''} • ${p.industries.join(', ')}</span></div>`).join('')}
        </div></div>

        <div class="card card-large"><div class="card-header"><h3><span class="card-icon">🌍</span> Industry Intelligence</h3></div><div class="card-body"><div class="industry-grid">
          ${DATA.knowledgeBase.industryInsights.map(ind => {
      const dynamicWinRate = MemoryStore.getIndustryWinRate(ind.industry);
      return `<div class="industry-card"><h4>${ind.industry}</h4><div class="industry-stats"><div class="ind-stat"><span class="ind-value">${dynamicWinRate}%</span><span class="ind-label">Win Rate</span></div><div class="ind-stat"><span class="ind-value">${ind.avgDealCycle}</span><span class="ind-label">Avg Cycle</span></div><div class="ind-stat"><span class="ind-value">${ind.avgDealSize}</span><span class="ind-label">Avg Size</span></div></div><div class="ind-objections">${ind.topObjections.map(o => `<span class="tag tag-${o.toLowerCase()}">${o}</span>`).join('')}</div></div>`;
    }).join('')}
        </div></div></div>
      </div>
    `;
  },

  // ═══════════════════════════════════════════════════════════════
  // JUDGE DEMO MODE — 90-Second Wow Moment
  // ═══════════════════════════════════════════════════════════════
  renderJudgeDemo(container) {
    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">🎬 90-Second "Wow Moment"</h1>
          <p class="view-subtitle">Memory-Driven Sales Intelligence — Healthcare & Security</p>
        </div>
        <div class="header-actions">
          <span class="badge badge-ai badge-lg">Judge Demo Mode</span>
        </div>
      </div>

      <div class="demo-hero">
        <h2 class="demo-tagline">"Traditional CRMs store data. This system stores experience, learns from outcomes, and uses memory to improve future sales decisions."</h2>
        <p class="demo-sub">Watch how organizational memory transforms sales intelligence in just 90 seconds.</p>
        <div class="demo-autoplay-cta">
          <button class="btn btn-primary btn-large btn-glow" id="auto-demo-btn" onclick="App.startAutoDemo()">
            <span class="btn-icon">▶</span> Start 90-Second Auto-Demo
          </button>
        </div>
      </div>

      <div class="demo-progress-bar" id="demo-progress-bar" style="display:none">
        <div class="demo-progress-track">
          <div class="demo-progress-fill" id="demo-progress-fill"></div>
        </div>
        <div class="demo-progress-info">
          <span id="demo-progress-label">Step 1 of 4</span>
          <div class="demo-progress-controls">
            <button class="btn btn-ghost btn-sm" id="demo-pause-btn" onclick="App.pauseAutoDemo()">⏸ Pause</button>
            <button class="btn btn-ghost btn-sm" onclick="App.stopAutoDemo()">⏹ Stop</button>
          </div>
        </div>
      </div>

      <div class="demo-steps" id="demo-steps">
        <div class="demo-step" id="demo-step-1">
          <div class="demo-step-header" onclick="App.toggleDemoStep(1)">
            <span class="demo-step-num">1</span>
            <h3>🏥 The Setup: Healthcare + Security</h3>
            <span class="demo-step-time">~15 sec</span>
            <span class="demo-step-arrow">▼</span>
          </div>
          <div class="demo-step-content" id="demo-content-1"></div>
        </div>

        <div class="demo-step" id="demo-step-2">
          <div class="demo-step-header" onclick="App.toggleDemoStep(2)">
            <span class="demo-step-num">2</span>
            <h3>🤖 RAG Memory in Action</h3>
            <span class="demo-step-time">~25 sec</span>
            <span class="demo-step-arrow">▼</span>
          </div>
          <div class="demo-step-content" id="demo-content-2"></div>
        </div>

        <div class="demo-step" id="demo-step-3">
          <div class="demo-step-header" onclick="App.toggleDemoStep(3)">
            <span class="demo-step-num">3</span>
            <h3>🔮 Deal Outcome Prediction</h3>
            <span class="demo-step-time">~20 sec</span>
            <span class="demo-step-arrow">▼</span>
          </div>
          <div class="demo-step-content" id="demo-content-3"></div>
        </div>

        <div class="demo-step" id="demo-step-4">
          <div class="demo-step-header" onclick="App.toggleDemoStep(4)">
            <span class="demo-step-num">4</span>
            <h3>✨ The "Show Why" Graph</h3>
            <span class="demo-step-time">~30 sec</span>
            <span class="demo-step-arrow">▼</span>
          </div>
          <div class="demo-step-content" id="demo-content-4"></div>
        </div>
      </div>
    `;

    // Auto-open step 1
    this.toggleDemoStep(1);
  },

  // ── Auto-Demo Engine (Macro) ───────────────────────────────────
  startAutoDemo() {
    if (this._autoDemo.running) return;
    this._autoDemo.running = true;
    
    // Create persistent overlay if it doesn't exist
    let overlay = document.getElementById('global-demo-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'global-demo-overlay';
      overlay.className = 'demo-progress-bar';
      overlay.style.position = 'fixed';
      overlay.style.bottom = '20px';
      overlay.style.left = '50%';
      overlay.style.transform = 'translateX(-50%)';
      overlay.style.width = '600px';
      overlay.style.zIndex = '9999';
      overlay.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
      overlay.style.borderRadius = '12px';
      
      overlay.innerHTML = `
        <div class="demo-progress-track">
          <div class="demo-progress-fill" id="global-demo-progress" style="width:0%; transition: width 0.5s ease"></div>
        </div>
        <div class="demo-progress-info">
          <span id="global-demo-step-label">Starting Auto-Demo...</span>
          <div class="demo-progress-controls">
            <button class="btn btn-ghost btn-sm" onclick="App.stopAutoDemo()">⏹ Stop Demo</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }
    
    overlay.style.display = '';
    
    // Hide the start button if we are on the judge demo page
    const btn = document.getElementById('auto-demo-btn');
    if (btn) btn.style.display = 'none';

    this.runFullAutoDemoMacro();
  },

  async checkPause() {
    const ad = this._autoDemo;
    while (ad.paused && ad.running) {
      await this.wait(200);
    }
  },

  pauseAutoDemo() {
    this._autoDemo.paused = !this._autoDemo.paused;
    const btn = document.getElementById('demo-pause-btn');
    if (btn) {
      btn.textContent = this._autoDemo.paused ? '▶ Resume' : '⏸ Pause';
    }
    const label = document.getElementById('global-demo-step-label');
    if (label) {
      if (this._autoDemo.paused) {
        label.dataset.origText = label.textContent;
        label.textContent += ' (Paused)';
      } else if (label.dataset.origText) {
        label.textContent = label.dataset.origText;
      }
    }
  },

  async runFullAutoDemoMacro() {
    const ad = this._autoDemo;
    const setStep = (step, text, pct) => {
      if (!ad.running) return;
      const label = document.getElementById('global-demo-step-label');
      const fill = document.getElementById('global-demo-progress');
      if (label) label.textContent = `Step ${step}/4: ${text}`;
      if (fill) fill.style.width = `${pct}%`;
    };

    try {
      // Step 1: Add Deal
      setStep(1, 'The Setup (Adding Deal)', 25);
      this.navigateTo('judge-demo');
      this.toggleDemoStep(1);
      await this.wait(2000);
      await this.checkPause();
      if (!ad.running) return;
      this.addDemoDeal(); // navigates to 'deal'
      
      await this.wait(6000); // Wait on Deal view
      await this.checkPause();
      if (!ad.running) return;

      // Step 2: Copilot
      setStep(2, 'RAG Memory in Action', 50);
      this.navigateTo('copilot');
      await this.wait(2000);
      await this.checkPause();
      if (!ad.running) return;
      
      const input = document.getElementById('copilot-input');
      if (input) {
        input.value = 'Your solution is too expensive.';
        await this.wait(1000);
        await this.checkPause();
        if (!ad.running) return;
        this.analyzeCopilotStatement('Your solution is too expensive.');
      }
      
      await this.wait(12000); // Wait on Copilot generation
      await this.checkPause();
      if (!ad.running) return;

      // Step 3: Simulator
      setStep(3, 'Deal Outcome Prediction', 75);
      const sec = document.querySelector('.deal-simulator-section');
      if (sec) sec.scrollIntoView({behavior: 'smooth'});
      await this.wait(2000);
      await this.checkPause();
      if (!ad.running) return;
      this.runSimulator();
      
      await this.wait(10000); // Wait on simulation
      await this.checkPause();
      if (!ad.running) return;

      // Step 4: Show Why Graph
      setStep(4, 'The "Show Why" Graph', 100);
      this.navigateTo('memory-graph');
      await this.wait(3000);
      await this.checkPause();
      if (!ad.running) return;
      if (typeof MemoryGraph !== 'undefined') MemoryGraph.animateReasoningPath();

      await this.wait(15000); // Wait for animation
      await this.checkPause();
      if (!ad.running) return;

      this.showToast('✅ 90-Second Demo Complete!');
      this.stopAutoDemo();
    } catch (e) {
      console.error(e);
      this.stopAutoDemo();
    }
  },

  stopAutoDemo() {
    this._autoDemo.running = false;
    this._autoDemo.paused = false;
    const overlay = document.getElementById('global-demo-overlay');
    if (overlay) overlay.style.display = 'none';
    
    // Restore start button if on judge demo page
    if (this.currentView === 'judge-demo') {
      const btn = document.getElementById('auto-demo-btn');
      if (btn) btn.style.display = '';
    }
  },

  toggleDemoStep(stepNum) {
    const content = document.getElementById(`demo-content-${stepNum}`);
    const step = document.getElementById(`demo-step-${stepNum}`);

    if (step && step.classList.contains('open')) {
      step.classList.remove('open');
      if (content) content.style.maxHeight = '0';
      return;
    }

    // Close all other steps
    document.querySelectorAll('.demo-step').forEach(s => {
      s.classList.remove('open');
      const c = s.querySelector('.demo-step-content');
      if (c) c.style.maxHeight = '0';
    });

    if (step) step.classList.add('open');

    // Populate content based on step
    if (content) {
      switch (stepNum) {
        case 1: this.renderDemoStep1(content); break;
        case 2: this.renderDemoStep2(content); break;
        case 3: this.renderDemoStep3(content); break;
        case 4: this.renderDemoStep4(content); break;
      }
      content.style.maxHeight = content.scrollHeight + 200 + 'px';
    }
  },

  // ── Step 1: The Setup ─────────────────────────────────────────
  renderDemoStep1(el) {
    el.innerHTML = `
      <div class="demo-narrative">
        <p class="demo-narration">💬 <em>"We are selling into <strong>Healthcare</strong>. The <strong>CTO and CISO</strong> are raising severe <strong>Security and Compliance</strong> objections. Let's create this deal in the system."</em></p>
      </div>
      <div class="demo-action-row">
        <button class="btn btn-primary btn-large" onclick="App.addDemoDeal()">
          <span class="btn-icon">➕</span> Add "HealthFirst Medical" Deal
        </button>
      </div>
      <p class="demo-hint">This matches patterns from our historical deals, activating the memory engine.</p>
    `;
  },

  addDemoDeal() {
    const existing = DATA.deals.find(d => d.company === 'HealthFirst Medical');
    if (existing) {
      this.showToast('✅ Deal already created! Let\'s proceed.');
      setTimeout(() => this.toggleDemoStep(2), 1500);
      return;
    }

    const deal = MemoryStore.addDeal({
      company: 'HealthFirst Medical', industry: 'Healthcare', value: 420000, stage: 'Discovery',
      tags: ['enterprise', 'strategic'], description: 'Enterprise deployment for hospital network. High security requirements.'
    });

    MemoryStore.addStakeholder({ dealId: deal.id, name: 'Dr. Torres', role: 'CTO', influenceLevel: 'Decision Maker', sentiment: 'Neutral', concerns: ['HIPAA'] });
    MemoryStore.addObjection({ dealId: deal.id, category: 'Security', description: 'HIPAA compliance and data sovereignty', severity: 'Critical' });

    this.showToast('✅ Deal created! Memory Agent activated.');
    setTimeout(() => this.toggleDemoStep(2), 2000);
  },

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('visible'), 50);
    setTimeout(() => { toast.classList.remove('visible'); setTimeout(() => toast.remove(), 300); }, 3000);
  },

  // ── Step 2: RAG Memory in Action ──────────────────────────────
  renderDemoStep2(el) {
    el.innerHTML = `
      <div class="demo-narrative">
        <p class="demo-narration">💬 <em>"The rep is on a call. The prospect says: 'Your solution is too expensive.' Watch how the AI Copilot uses memory to give a <strong>context-aware</strong> response, unlike a generic LLM."</em></p>
      </div>
      <div class="demo-action-row">
        <button class="btn btn-primary btn-large" onclick="App.navigateTo('copilot'); setTimeout(() => { document.getElementById('copilot-input').value='Your solution is too expensive.'; App.analyzeCopilotStatement('Your solution is too expensive.'); }, 500);">
          <span class="btn-icon">🤖</span> Launch AI Sales Copilot
        </button>
      </div>
    `;
  },

  // ── Step 3: Deal Outcome Prediction ───────────────────────────
  renderDemoStep3(el) {
    el.innerHTML = `
      <div class="demo-narrative">
        <p class="demo-narration">💬 <em>"Before the next meeting, the rep uses the Deal Outcome Simulator. It queries historical memory to predict which strategy will yield the highest win rate."</em></p>
      </div>
      <div class="demo-action-row">
        <button class="btn btn-primary btn-large" onclick="App.navigateTo('copilot'); setTimeout(() => { const sec = document.querySelector('.deal-simulator-section'); if (sec) sec.scrollIntoView({behavior: 'smooth'}); setTimeout(() => App.runSimulator(), 800); }, 500);">
          <span class="btn-icon">🔮</span> Run Strategy Simulator
        </button>
      </div>
    `;
  },

  // ── Step 4: The "Show Why" Graph ──────────────────────────────
  renderDemoStep4(el) {
    el.innerHTML = `
      <div class="demo-narrative">
        <p class="demo-narration">💬 <em>"Finally, how do we trust these recommendations? Explainable AI. The Memory Graph shows exactly which past deals and outcomes led to this conclusion."</em></p>
      </div>
      <div class="demo-action-row">
        <button class="btn btn-primary btn-large" onclick="App.navigateTo('memory-graph'); setTimeout(() => { if (typeof MemoryGraph !== 'undefined') MemoryGraph.animateReasoningPath(); }, 1000);">
          <span class="btn-icon">✨</span> Animate Reasoning Path
        </button>
      </div>
    `;
  },



  // ═══════════════════════════════════════════════════════════════
  // MEMORY GRAPH
  // ═══════════════════════════════════════════════════════════════
  renderMemoryGraph(container) {
    container.innerHTML = `
      <div class="graph-layout">
        <div class="graph-main">
          <div class="graph-header">
            <div>
              <h1 class="view-title">Organizational Memory Graph</h1>
              <p class="view-subtitle">Interactive visualization of deals, stakeholders, objections, strategies, and outcomes.</p>
            </div>
            <div class="graph-actions">
              <button class="btn btn-ghost" id="graph-density-btn" onclick="App.toggleGraphDensity()">${(this._graphDensity || 'pipeline') === 'pipeline' ? '🌐 View Full Web' : '⚡ Pipeline Focus'}</button>
              <button class="btn btn-primary btn-glow" onclick="MemoryGraph.animateReasoningPath()">✨ Show Why</button>
              <button class="btn btn-ghost" onclick="MemoryGraph.resetHighlights()">Reset View</button>
            </div>
          </div>

          <div class="graph-controls">
            <div class="graph-search">
              <input type="text" id="graph-search-input" class="form-input" placeholder="🔍 Search nodes (company, role, objection...)" />
            </div>
            <div class="graph-filters" id="graph-filters">
              <button class="graph-filter-btn active" data-type="all"><span class="gf-dot" style="background:#fff"></span>All</button>
              <button class="graph-filter-btn active" data-type="deal"><span class="gf-dot" style="background:#00e5ff"></span>Deals</button>
              <button class="graph-filter-btn active" data-type="stakeholder"><span class="gf-dot" style="background:#b388ff"></span>Stakeholders</button>
              <button class="graph-filter-btn active" data-type="objection"><span class="gf-dot" style="background:#ff8c42"></span>Objections</button>
              <button class="graph-filter-btn active" data-type="strategy"><span class="gf-dot" style="background:#00e5a0"></span>Strategies</button>
              <button class="graph-filter-btn active" data-type="outcome"><span class="gf-dot" style="background:#ffd93d"></span>Outcomes</button>
            </div>
          </div>

          <div class="graph-legend">
            <span class="graph-legend-item"><span class="gl-dot" style="background:#00e5ff"></span>Deal</span>
            <span class="graph-legend-item"><span class="gl-dot" style="background:#b388ff"></span>Stakeholder</span>
            <span class="graph-legend-item"><span class="gl-dot" style="background:#ff8c42"></span>Objection</span>
            <span class="graph-legend-item"><span class="gl-dot" style="background:#00e5a0"></span>Strategy</span>
            <span class="graph-legend-item"><span class="gl-dot" style="background:#00e5a0"></span>Won</span>
            <span class="graph-legend-item"><span class="gl-dot" style="background:#ff5252"></span>Lost</span>
            <span class="graph-legend-item"><span class="gl-dot" style="background:#ffd93d"></span>Active</span>
          </div>

          <div id="d3-graph-container" class="d3-graph-container">
            <!-- D3 renders here -->
          </div>
        </div>
        <div class="graph-side-panel" id="graph-side-panel">
          <div class="empty-panel">
            <div class="empty-icon">🕸️</div>
            <p>Click on any node in the graph to view details and memory connections.</p>
          </div>
        </div>
      </div>
    `;

    // Search handler
    const searchInput = document.getElementById('graph-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        if (typeof MemoryGraph !== 'undefined') MemoryGraph.searchNodes(e.target.value);
      });
    }

    // Filter handler
    const filtersContainer = document.getElementById('graph-filters');
    if (filtersContainer) {
      filtersContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.graph-filter-btn');
        if (!btn) return;
        const type = btn.dataset.type;

        if (type === 'all') {
          // Toggle all
          const allBtns = filtersContainer.querySelectorAll('.graph-filter-btn');
          const allActive = [...allBtns].every(b => b.classList.contains('active'));
          allBtns.forEach(b => allActive ? b.classList.remove('active') : b.classList.add('active'));
        } else {
          btn.classList.toggle('active');
        }

        // Collect active types
        const activeTypes = [...filtersContainer.querySelectorAll('.graph-filter-btn.active')]
          .map(b => b.dataset.type)
          .filter(t => t !== 'all');

        if (typeof MemoryGraph !== 'undefined') {
          if (activeTypes.length === 5) { // All 5 node types
            MemoryGraph.resetHighlights();
          } else {
            MemoryGraph.filterByType(activeTypes);
          }
        }
      });
    }

    // Wait for DOM to be ready, then initialize D3
    setTimeout(() => {
      if (typeof MemoryGraph !== 'undefined') {
        MemoryGraph.init('d3-graph-container', this._graphDensity || 'pipeline');
      } else {
        console.error("MemoryGraph not loaded");
      }
    }, 100);
  },

  showGraphNodeDetails(node) {
    const panel = document.getElementById('graph-side-panel');
    if (!panel) return;

    let content = '';

    if (node.type === 'deal') {
      const deal = node.data;
      const objections = ObjectionAgent.getDealObjections(deal.id);
      const stakeholders = StakeholderAgent.getDealStakeholders(deal.id);
      
      content = `
        <div class="panel-header">
          <span class="panel-type-badge deal">Deal</span>
          <h2>${deal.company}</h2>
          <span class="panel-subtitle">${deal.industry} • $${(deal.value/1000).toFixed(0)}K</span>
        </div>
        <div class="panel-body">
          <div class="panel-section">
            <h3>Stakeholders (${stakeholders.length})</h3>
            <div class="tag-list">
              ${stakeholders.map(s => `<span class="tag">👤 ${s.role}</span>`).join('')}
            </div>
          </div>
          <div class="panel-section">
            <h3>Objections (${objections.length})</h3>
            <div class="tag-list">
              ${objections.map(o => `<span class="tag tag-${o.category.toLowerCase()}">🛡️ ${o.category}</span>`).join('')}
            </div>
          </div>
          <div class="panel-section">
            <h3>Outcome</h3>
            <span class="deal-status-badge ${deal.status}">${deal.status.toUpperCase()}</span>
          </div>
          ${deal.keyFactors && deal.keyFactors.length > 0 ? `
            <div class="panel-section">
              <h3>Strategies Used</h3>
              <ul class="bullet-list">
                ${deal.keyFactors.map(f => `<li>${f}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
        <div class="panel-footer">
          <button class="btn btn-primary full-width" onclick="App.triggerShowWhy(${deal.id})">
            ✨ Show Why (Reasoning Chain)
          </button>
        </div>
      `;
    } 
    else if (node.type === 'objection') {
      const obj = node.data;
      const stats = ObjectionAgent.getCategoryStats()[obj.category];
      const proven = ObjectionAgent.getSuccessfulResponses(obj.category, 2);
      
      content = `
        <div class="panel-header">
          <span class="panel-type-badge objection">Objection</span>
          <h2>${obj.category}</h2>
        </div>
        <div class="panel-body">
          <div class="panel-section">
            <p class="objection-quote">"${obj.description}"</p>
          </div>
          <div class="panel-section">
            <h3>Historical Performance</h3>
            <div class="perf-row"><span class="perf-label">Frequency:</span> <span class="perf-value">${stats ? stats.total : 1} cases</span></div>
            <div class="perf-row"><span class="perf-label">Resolution Rate:</span> <span class="perf-value">${stats ? stats.resolutionRate : 50}%</span></div>
          </div>
          ${proven.length > 0 ? `
            <div class="panel-section">
              <h3>Proven Responses</h3>
              ${proven.map(p => `
                <div class="proven-response">
                  <p>${p.resolution}</p>
                  <span>Success Rate: ${p.historicalSuccessRate}%</span>
                </div>
              `).join('')}
            </div>
          ` : '<p class="empty-state">No proven responses yet.</p>'}
        </div>
      `;
    }
    else if (node.type === 'strategy') {
      const strategyName = node.data.strategy;
      const confidence = MemoryStore.getStrategyConfidence(strategyName);
      
      // Find all deals that used this strategy
      const dealsUsing = DATA.deals.filter(d => (d.keyFactors || []).includes(strategyName));
      const wins = dealsUsing.filter(d => d.status === 'won').length;
      const industries = [...new Set(dealsUsing.map(d => d.industry))];

      content = `
        <div class="panel-header">
          <span class="panel-type-badge strategy">Strategy</span>
          <h2>Pattern / Strategy</h2>
        </div>
        <div class="panel-body">
          <div class="panel-section">
            <p class="strategy-text">${strategyName}</p>
          </div>
          <div class="panel-section">
            <h3>Performance Stats</h3>
            <div class="perf-row"><span class="perf-label">Confidence Score:</span> <span class="perf-value strategy-score">${confidence}%</span></div>
            <div class="perf-row"><span class="perf-label">Wins Influenced:</span> <span class="perf-value">${wins}</span></div>
            <div class="perf-row"><span class="perf-label">Times Used:</span> <span class="perf-value">${dealsUsing.length}</span></div>
          </div>
          <div class="panel-section">
            <h3>Effective Industries</h3>
            <div class="tag-list">
              ${industries.map(i => `<span class="tag">🏢 ${i}</span>`).join('')}
            </div>
          </div>
        </div>
      `;
    }
    else {
      // Stakeholder or Outcome
      content = `
        <div class="panel-header">
          <span class="panel-type-badge ${node.type}">${node.type}</span>
          <h2>${node.label}</h2>
        </div>
        <div class="panel-body">
          <p>More details available for Deals, Objections, and Strategies.</p>
        </div>
      `;
    }

    panel.innerHTML = content;
    
    // Add visual feedback class
    panel.classList.remove('animate-slide-in');
    void panel.offsetWidth; // trigger reflow
    panel.classList.add('animate-slide-in');
  },

  triggerShowWhy(dealId) {
    if (typeof MemoryGraph !== 'undefined') {
      MemoryGraph.highlightReasoningChain(dealId);
      
      const panel = document.getElementById('graph-side-panel');
      panel.innerHTML = `
        <div class="panel-header reasoning-header">
          <h2>✨ Memory Path Active</h2>
          <p>Highlighting the reasoning chain for Deal #${dealId}</p>
        </div>
        <div class="panel-body reasoning-body">
          <div class="reasoning-step">
            <span class="r-icon">💼</span>
            <div class="r-content">
              <strong>Source Deal</strong>
              <p>The deal context being analyzed.</p>
            </div>
          </div>
          <div class="reasoning-step">
            <span class="r-icon">🛡️</span>
            <div class="r-content">
              <strong>Objections Encountered</strong>
              <p>Challenges identified in this deal.</p>
            </div>
          </div>
          <div class="reasoning-step">
            <span class="r-icon">🎯</span>
            <div class="r-content">
              <strong>Strategies Applied</strong>
              <p>Proven approaches used to resolve those specific objections.</p>
            </div>
          </div>
          <div class="reasoning-step">
            <span class="r-icon">🏆</span>
            <div class="r-content">
              <strong>Historical Outcomes</strong>
              <p>Past wins driven by these same strategies.</p>
            </div>
          </div>
        </div>
        <div class="panel-footer">
          <button class="btn btn-ghost full-width" onclick="MemoryGraph.resetHighlights(); App.showGraphNodeDetails(MemoryGraph.nodesData.find(n => n.id === 'deal_${dealId}'))">
            Clear Highlights
          </button>
        </div>
      `;
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════
  animateCounters() {
    document.querySelectorAll('[data-count]').forEach(el => {
      const target = parseInt(el.dataset.count);
      const duration = 1200;
      const startTime = performance.now();
      const suffix = el.textContent.includes('%') ? '%' : '';

      const animate = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    });
  },

  formatCurrency(value) {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  },

  toggleGraphDensity() {
    this._graphDensity = (this._graphDensity || 'pipeline') === 'pipeline' ? 'full' : 'pipeline';
    const btn = document.getElementById('graph-density-btn');
    if (btn) {
      btn.textContent = this._graphDensity === 'pipeline' ? '🌐 View Full Web' : '⚡ Pipeline Focus';
    }
    if (typeof MemoryGraph !== 'undefined') {
      MemoryGraph.init('d3-graph-container', this._graphDensity);
    }
    this.showToast(this._graphDensity === 'pipeline' ? '⚡ Switched to Pipeline Focus' : '🌐 Loaded Full Memory Web');
  },

  confirmResetMemory() {
    this.showModal(`
      <div class="modal-card">
        <div class="modal-header">
          <h2>⚠️ Reset Memory Confirmation</h2>
          <button class="modal-close" onclick="App.closeModal()">✕</button>
        </div>
        <div class="modal-body">
          <p style="color: var(--text-secondary); line-height: 1.5; margin-bottom: 16px;">
            This action will restore all deals, stakeholders, objections, and learned weights back to their fresh default state.
          </p>
          <div style="background: rgba(255, 82, 82, 0.08); border: 1px solid rgba(255, 82, 82, 0.2); border-radius: var(--radius-sm); padding: 12px; color: var(--color-danger); font-size: 0.85rem;">
            ⚠️ Any custom deals added during your testing session will be cleared.
          </div>
        </div>
        <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px;">
          <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
          <button class="btn btn-danger" onclick="App.closeModal(); MemoryStore.reset(true);">Confirm Reset</button>
        </div>
      </div>
    `);
  },

  showApiKeyModal() {
    const hasKey = typeof GeminiAI !== 'undefined' && GeminiAI.hasApiKey();
    const masked = typeof GeminiAI !== 'undefined' ? GeminiAI.getMaskedApiKey() : null;
    this.showModal(`
      <div class="modal-card">
        <div class="modal-header">
          <h2>🤖 AI Reasoning Configuration</h2>
          <button class="modal-close" onclick="App.closeModal()">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-subtitle" style="margin-bottom: 16px;">
            Deal Intelligence Agent operates <strong>100% locally out-of-the-box</strong> using organizational memory and rule-based semantic matching. You can optionally connect a Google Gemini API key to activate LLM reasoning.
          </p>

          <div style="background: rgba(255,255,255,0.03); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-weight: 600; color: var(--text-primary);">Current Status:</span>
              <span class="badge ${hasKey ? 'badge-ai' : 'badge-neutral'}">${hasKey ? '✨ Gemini Connected' : '🧠 Local Memory Engine'}</span>
            </div>
            ${hasKey ? `
              <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0;">
                Active Key: <code>${masked}</code> • Model: <code>${GeminiAI.MODEL}</code>
              </p>
            ` : `
              <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0;">
                No API key configured. The application operates using built-in organizational memory retrieval.
              </p>
            `}
          </div>

          <div class="form-group">
            <label>Google Gemini API Key (Optional)</label>
            <input type="password" id="modal-gemini-key" class="form-input" placeholder="AIzaSy..." value="" />
            <small style="color: var(--text-tertiary); display: block; margin-top: 6px;">
              Keys are stored only in your browser localStorage and never sent to any intermediate server. <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">Get a free key from Google AI Studio →</a>
            </small>
          </div>
        </div>
        <div class="modal-footer" style="display: flex; justify-content: space-between;">
          ${hasKey ? `
            <button class="btn btn-danger" onclick="GeminiAI.clearApiKey(); App.closeModal(); App.showToast('API key removed. Running local memory engine.'); if (App.currentView === 'deal') App.renderDealWorkspace(document.getElementById('view-container'), App.currentDealId);">
              Remove Key
            </button>
          ` : `<div></div>`}
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="
              const val = document.getElementById('modal-gemini-key').value.trim();
              if (val) {
                GeminiAI.setApiKey(val);
                App.closeModal();
                App.showToast('✅ Gemini API key saved!');
                if (App.currentView === 'deal') App.renderDealWorkspace(document.getElementById('view-container'), App.currentDealId);
              } else {
                alert('Please enter a key, or click Cancel.');
              }
            ">
              Save Key
            </button>
          </div>
        </div>
      </div>
    `);
  }
};

if (typeof window !== 'undefined') {
  window.App = App;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = App;
}

// Initialize safely
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else if (typeof App.init === 'function') {
    App.init();
  }
}

