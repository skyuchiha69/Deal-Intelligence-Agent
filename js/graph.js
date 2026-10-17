// ═══════════════════════════════════════════════════════════════
// Deal Intelligence Agent — Interactive Organizational Memory Graph
// Professional D3.js Knowledge Graph with Curated Initial Overview,
// Progressive Neighborhood Exploration, Clamped Physics, and Clean Vector Glyphs
// ═══════════════════════════════════════════════════════════════

const MemoryGraph = {
  svg: null,
  g: null,
  zoom: null,
  simulation: null,
  containerId: null,
  width: 800,
  height: 600,
  viewMode: 'pipeline', // 'pipeline' (curated 16-24 nodes) or 'full' (broader representative universe)

  // Graph state
  nodesData: [],
  linksData: [],
  allNodesMap: new Map(),
  allLinks: [],
  adjacency: new Map(), // nodeId -> Set of neighbor nodeIds
  selectedNodeId: null,
  activeHighlights: new Set(),
  activeFilters: new Set(['all', 'deal', 'stakeholder', 'objection', 'strategy', 'outcome']),
  searchQuery: '',
  _resizeAttached: false,

  // Node Category Configuration
  CONFIG: {
    deal: {
      color: '#00e5ff',        // Cyan
      label: 'Deal',
      radius: 20,
      icon: 'deal'
    },
    stakeholder: {
      color: '#b388ff',        // Iris / Light Purple
      label: 'Stakeholder',
      radius: 14,
      icon: 'stakeholder'
    },
    objection: {
      color: '#ff8c42',        // Warm Amber / Coral
      label: 'Objection',
      radius: 16,
      icon: 'objection'
    },
    strategy: {
      color: '#00e5a0',        // Emerald Green
      label: 'Strategy',
      radius: 16,
      icon: 'strategy'
    },
    outcome: {
      colorWon: '#00e5a0',     // Green
      colorLost: '#ff5252',    // Red
      colorActive: '#ffd93d',  // Gold
      label: 'Outcome',
      radius: 18,
      icon: 'outcome'
    }
  },

  // Crisp SVG Vector Icon Paths (Replaces cheap emojis with modern professional glyphs)
  SVG_ICONS: {
    deal: `
      <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7zm5-2V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1H9z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M4 11h16" stroke="currentColor" stroke-width="1.2" opacity="0.6"/>
    `,
    stakeholder: `
      <path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm-6 8a6 6 0 0 1 12 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    `,
    objection: `
      <path d="M12 3L4.5 6.5v5c0 5 3.2 8.5 7.5 9.5 4.3-1 7.5-4.5 7.5-9.5v-5L12 3zm0 5v4m0 3h.01" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    `,
    strategy: `
      <circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
      <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="1.2" fill="currentColor"/>
    `,
    outcome_won: `
      <path d="M6 12l4 4 8-8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    `,
    outcome_lost: `
      <path d="M7 7l10 10M17 7L7 17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    `,
    outcome_active: `
      <circle cx="12" cy="12" r="4" fill="currentColor"/>
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 2"/>
    `
  },

  safeHash(str) {
    if (!str) return 'empty';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  },

  // ── Initializer ──────────────────────────────────────────────
  init(containerId, viewMode = 'pipeline') {
    if (this.simulation) {
      try { this.simulation.stop(); } catch (e) {}
    }
    this.containerId = containerId;
    this.viewMode = viewMode;
    this.selectedNodeId = null;
    this.activeHighlights.clear();
    this.searchQuery = '';

    // 1. Build the full index of all records in the organizational database
    this.indexAllEntities();

    // 2. Select initial working set based on viewMode
    if (viewMode === 'full') {
      this.loadFullUniverse();
    } else {
      this.loadCuratedInitialSet();
    }

    // 3. Render visualization
    this.render();

    // 4. Update side panel overview with exact deals in view
    if (typeof window !== 'undefined' && window.App && typeof App.renderGraphOverviewPanel === 'function') {
      App.renderGraphOverviewPanel();
    }

    // 5. Attach window resize listener once
    if (!this._resizeAttached && typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.handleResize());
      this._resizeAttached = true;
    }
  },

  handleResize() {
    const container = document.getElementById(this.containerId);
    if (!container || !this.svg || !this.simulation) return;
    const newWidth = container.clientWidth || 800;
    const newHeight = container.clientHeight || 500;
    if (newWidth === this.width && newHeight === this.height) return;
    this.width = newWidth;
    this.height = newHeight;
    this.svg.attr("viewBox", [0, 0, this.width, this.height]);
    this.simulation.force("center", d3.forceCenter(this.width / 2, this.height / 2));
    this.simulation.alpha(0.6).restart();
  },

  // ── 1. Index All Entities from Dataset ────────────────────────
  indexAllEntities() {
    this.allNodesMap = new Map();
    this.allLinks = [];
    this.adjacency = new Map();

    const addIndexedNode = (id, type, label, data, radius) => {
      if (!this.allNodesMap.has(id)) {
        const node = {
          id,
          type,
          label,
          data,
          radius: radius || this.CONFIG[type]?.radius || 16,
          val: radius || this.CONFIG[type]?.radius || 16
        };
        this.allNodesMap.set(id, node);
        this.adjacency.set(id, new Set());
      }
      return this.allNodesMap.get(id);
    };

    const addedLinkKeys = new Set();
    const addIndexedLink = (sourceId, targetId, type, relationshipLabel) => {
      if (this.allNodesMap.has(sourceId) && this.allNodesMap.has(targetId)) {
        const linkKey = `${sourceId}->${targetId}:${type}`;
        if (!addedLinkKeys.has(linkKey)) {
          addedLinkKeys.add(linkKey);
          this.allLinks.push({
            id: linkKey,
            source: sourceId,
            target: targetId,
            type,
            relationshipLabel: relationshipLabel || type.replace('_', ' ')
          });
          // Update adjacency
          this.adjacency.get(sourceId)?.add(targetId);
          this.adjacency.get(targetId)?.add(sourceId);
        }
      }
    };

    // A. Index Deals
    const deals = (typeof DATA !== 'undefined' && DATA.deals) ? DATA.deals : [];
    deals.forEach(deal => {
      const dealId = `deal_${deal.id}`;
      addIndexedNode(dealId, 'deal', deal.company, deal, this.CONFIG.deal.radius);

      // Outcome Node
      const outcomeId = `outcome_${deal.id}`;
      const outcomeLabel = deal.status === 'won' ? 'Won Benchmark' : (deal.status === 'lost' ? 'Lost Deal' : 'Active Pipeline');
      addIndexedNode(outcomeId, 'outcome', outcomeLabel, deal, this.CONFIG.outcome.radius);
      addIndexedLink(dealId, outcomeId, 'resulted_in', 'Outcome');

      // Strategies / Key Factors
      (deal.keyFactors || []).forEach(factor => {
        const strategyId = `strategy_${this.safeHash(factor)}`;
        const shortFactor = factor.length > 28 ? factor.substring(0, 26) + '…' : factor;
        addIndexedNode(strategyId, 'strategy', shortFactor, { strategy: factor, sourceDealId: deal.id }, this.CONFIG.strategy.radius);
        addIndexedLink(dealId, strategyId, 'applied_strategy', 'Applied Strategy');
        if (deal.status !== 'active') {
          addIndexedLink(strategyId, outcomeId, 'influenced', 'Influenced Outcome');
        }
      });
    });

    // B. Index Stakeholders
    const stakeholders = (typeof DATA !== 'undefined' && DATA.stakeholders) ? DATA.stakeholders : [];
    stakeholders.forEach(sh => {
      const shId = `sh_${sh.id}`;
      const label = sh.name ? `${sh.name} (${sh.role})` : sh.role;
      addIndexedNode(shId, 'stakeholder', label, sh, this.CONFIG.stakeholder.radius);
      addIndexedLink(`deal_${sh.dealId}`, shId, 'participated', 'Stakeholder');
    });

    // C. Index Objections
    const objections = (typeof DATA !== 'undefined' && DATA.objections) ? DATA.objections : [];
    objections.forEach(obj => {
      const objId = `obj_${obj.id}`;
      addIndexedNode(objId, 'objection', obj.category, obj, this.CONFIG.objection.radius);
      addIndexedLink(`deal_${obj.dealId}`, objId, 'raised', 'Faced Objection');

      // If resolved, connect to resolution strategy
      if (obj.outcome === 'resolved' && obj.resolution) {
        const strategyId = `strategy_${this.safeHash(obj.resolution)}`;
        const shortRes = obj.resolution.length > 28 ? obj.resolution.substring(0, 26) + '…' : obj.resolution;
        addIndexedNode(strategyId, 'strategy', shortRes, { strategy: obj.resolution, category: obj.category }, this.CONFIG.strategy.radius);
        addIndexedLink(objId, strategyId, 'resolved_by', 'Resolved By');
      }
    });
  },

  // ── 2. Curated Initial Overview (16–22 Balanced Nodes) ───────
  loadCuratedInitialSet() {
    this.nodesData = [];
    this.linksData = [];

    const deals = (typeof DATA !== 'undefined' && DATA.deals) ? DATA.deals : [];
    if (deals.length === 0) return;

    // Pick 4 representative deals:
    // - 2 Active Pipeline Deals (e.g. highest value or priority)
    // - 1 Landmark Won Benchmark Deal
    // - 1 Instructive Lost Deal
    const activeDeals = deals.filter(d => d.status === 'active').slice(0, 2);
    const wonDeals = deals.filter(d => d.status === 'won').slice(0, 1);
    const lostDeals = deals.filter(d => d.status === 'lost').slice(0, 1);
    const focusDeals = [...activeDeals, ...wonDeals, ...lostDeals];

    const selectedNodeIds = new Set();

    focusDeals.forEach(deal => {
      const dealId = `deal_${deal.id}`;
      selectedNodeIds.add(dealId);

      // Add outcome node for closed deals, or for active deals
      selectedNodeIds.add(`outcome_${deal.id}`);

      // Add 1-2 primary stakeholders for this deal
      const shs = (DATA.stakeholders || []).filter(s => s.dealId === deal.id).slice(0, 2);
      shs.forEach(s => selectedNodeIds.add(`sh_${s.id}`));

      // Add 1-2 objections for this deal
      const objs = (DATA.objections || []).filter(o => o.dealId === deal.id).slice(0, 1);
      objs.forEach(o => {
        selectedNodeIds.add(`obj_${o.id}`);
        if (o.outcome === 'resolved' && o.resolution) {
          selectedNodeIds.add(`strategy_${this.safeHash(o.resolution)}`);
        }
      });

      // Add top 1 keyFactor strategy if present
      if (deal.keyFactors && deal.keyFactors.length > 0) {
        selectedNodeIds.add(`strategy_${this.safeHash(deal.keyFactors[0])}`);
      }
    });

    // Populate nodesData (clone nodes so D3 simulation doesn't mutate index directly)
    selectedNodeIds.forEach(id => {
      const orig = this.allNodesMap.get(id);
      if (orig) {
        this.nodesData.push({ ...orig });
      }
    });

    // Populate linksData connecting these selected nodes
    this.allLinks.forEach(l => {
      const sId = typeof l.source === 'object' ? l.source.id : l.source;
      const tId = typeof l.target === 'object' ? l.target.id : l.target;
      if (selectedNodeIds.has(sId) && selectedNodeIds.has(tId)) {
        this.linksData.push({ ...l, source: sId, target: tId });
      }
    });
  },

  // ── Full Universe Loader (for Full Web toggle and tests) ─────
  loadFullUniverse() {
    this.nodesData = [];
    this.linksData = [];

    const deals = (typeof DATA !== 'undefined' && DATA.deals) ? DATA.deals : [];
    // Include all active deals + representative won & lost deals (~45 deals total for performance)
    const activeDeals = deals.filter(d => d.status === 'active');
    const wonDeals = deals.filter(d => d.status === 'won').slice(0, 18);
    const lostDeals = deals.filter(d => d.status === 'lost').slice(0, 18);
    const includedDeals = [...activeDeals, ...wonDeals, ...lostDeals];
    const dealIds = new Set(includedDeals.map(d => d.id));

    const selectedNodeIds = new Set();

    includedDeals.forEach(deal => {
      selectedNodeIds.add(`deal_${deal.id}`);
      selectedNodeIds.add(`outcome_${deal.id}`);
      (deal.keyFactors || []).forEach(f => selectedNodeIds.add(`strategy_${this.safeHash(f)}`));
    });

    (DATA.stakeholders || []).forEach(s => {
      if (dealIds.has(s.dealId)) selectedNodeIds.add(`sh_${s.id}`);
    });

    (DATA.objections || []).forEach(o => {
      if (dealIds.has(o.dealId)) {
        selectedNodeIds.add(`obj_${o.id}`);
        if (o.outcome === 'resolved' && o.resolution) {
          selectedNodeIds.add(`strategy_${this.safeHash(o.resolution)}`);
        }
      }
    });

    selectedNodeIds.forEach(id => {
      const orig = this.allNodesMap.get(id);
      if (orig) this.nodesData.push({ ...orig });
    });

    this.allLinks.forEach(l => {
      const sId = typeof l.source === 'object' ? l.source.id : l.source;
      const tId = typeof l.target === 'object' ? l.target.id : l.target;
      if (selectedNodeIds.has(sId) && selectedNodeIds.has(tId)) {
        this.linksData.push({ ...l, source: sId, target: tId });
      }
    });
  },

  // ── Node Visual Helpers ───────────────────────────────────────
  getNodeColor(node) {
    if (node.type === 'outcome') {
      if (node.data.status === 'won') return this.CONFIG.outcome.colorWon;
      if (node.data.status === 'lost') return this.CONFIG.outcome.colorLost;
      return this.CONFIG.outcome.colorActive;
    }
    if (node.type === 'deal') {
      return node.data.status === 'active' ? this.CONFIG.deal.color : (node.data.status === 'won' ? '#00e5a0' : '#8892a8');
    }
    return this.CONFIG[node.type]?.color || '#00e5ff';
  },

  getNodeIconMarkup(node) {
    if (node.type === 'outcome') {
      if (node.data.status === 'won') return this.SVG_ICONS.outcome_won;
      if (node.data.status === 'lost') return this.SVG_ICONS.outcome_lost;
      return this.SVG_ICONS.outcome_active;
    }
    return this.SVG_ICONS[node.type] || this.SVG_ICONS.deal;
  },

  // ── 3. Render Visualization with D3.js ────────────────────────
  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    // Clear previous
    container.innerHTML = '';

    // Check empty state
    if (!this.nodesData || this.nodesData.length === 0) {
      container.innerHTML = `
        <div class="empty-panel" style="padding: 60px 20px;">
          <div class="empty-icon">🕸️</div>
          <h3 style="margin-bottom: 8px;">No Graph Data Available</h3>
          <p>No organizational memory nodes match the current criteria.</p>
          <button class="btn btn-ghost" style="margin-top: 16px;" onclick="MemoryGraph.resetView()">Reset to Initial Overview</button>
        </div>
      `;
      return;
    }

    this.width = container.clientWidth || 800;
    this.height = container.clientHeight || 600;

    // Create Main SVG
    this.svg = d3.select(container).append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", [0, 0, this.width, this.height])
      .attr("class", "graph-svg-canvas");

    // Define defs: markers, filters, gradients
    const defs = this.svg.append("defs");

    // Glow filter for highlighting
    const glowFilter = defs.append("filter")
      .attr("id", "neon-glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    glowFilter.append("feGaussianBlur")
      .attr("stdDeviation", "4")
      .attr("result", "blur");
    glowFilter.append("feMerge")
      .selectAll("feMergeNode")
      .data(["blur", "SourceGraphic"])
      .enter().append("feMergeNode")
      .attr("in", d => d);

    // Subtle arrow markers for directional relationships
    defs.append("marker")
      .attr("id", "arrow-subtle")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 22)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-4L8,0L0,4")
      .attr("fill", "rgba(255,255,255,0.2)");

    defs.append("marker")
      .attr("id", "arrow-highlight")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 24)
      .attr("refY", 0)
      .attr("markerWidth", 7)
      .attr("markerHeight", 7)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-4L8,0L0,4")
      .attr("fill", "#00e5ff");

    // Add zoomable container group
    this.g = this.svg.append("g").attr("class", "graph-zoom-group");

    // Zoom setup
    this.zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        this.g.attr("transform", event.transform);
      });
    this.svg.call(this.zoom);

    // Initial gentle scale & center
    this.svg.call(
      this.zoom.transform,
      d3.zoomIdentity.translate(this.width / 2, this.height / 2).scale(0.92).translate(-this.width / 2, -this.height / 2)
    );

    // Prevent default dblclick zoom
    this.svg.on("dblclick.zoom", null);

    // Click background to deselect
    this.svg.on("click", (event) => {
      if (event.target.tagName === 'svg' || event.target.classList.contains('graph-zoom-group')) {
        this.deselectAll();
      }
    });

    // Setup Force Simulation
    this.simulation = d3.forceSimulation(this.nodesData)
      .force("link", d3.forceLink(this.linksData).id(d => d.id).distance(d => d.type === 'resulted_in' ? 75 : 95).strength(0.55))
      .force("charge", d3.forceManyBody().strength(-280).distanceMax(320))
      .force("collide", d3.forceCollide().radius(d => (d.radius || 16) + 26).iterations(3))
      .force("center", d3.forceCenter(this.width / 2, this.height / 2).strength(0.08))
      .alphaDecay(0.04)
      .velocityDecay(0.35);

    // Render Links
    this.linkElements = this.g.append("g")
      .attr("class", "graph-links-layer")
      .selectAll("line")
      .data(this.linksData)
      .enter().append("line")
      .attr("class", "graph-link")
      .attr("id", d => `link-${d.source.id || d.source}-${d.target.id || d.target}`)
      .attr("stroke", "rgba(255, 255, 255, 0.12)")
      .attr("stroke-width", 1.2)
      .attr("marker-end", "url(#arrow-subtle)");

    // Render Nodes Group
    this.nodeElements = this.g.append("g")
      .attr("class", "graph-nodes-layer")
      .selectAll("g")
      .data(this.nodesData)
      .enter().append("g")
      .attr("class", d => `graph-node node-${d.type}`)
      .attr("id", d => `node-${d.id}`)
      .call(d3.drag()
        .on("start", this.dragstarted.bind(this))
        .on("drag", this.dragged.bind(this))
        .on("end", this.dragended.bind(this)))
      .on("click", (event, d) => this.handleNodeClick(event, d))
      .on("mouseenter", (event, d) => this.handleNodeMouseEnter(event, d))
      .on("mouseleave", (event, d) => this.handleNodeMouseLeave(event, d));

    // A. Outer Selection Ring (for active/selected state)
    this.nodeElements.append("circle")
      .attr("class", "node-selection-ring")
      .attr("r", d => (d.radius || 16) + 6)
      .attr("fill", "none")
      .attr("stroke", d => this.getNodeColor(d))
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4 3")
      .attr("opacity", 0);

    // B. Base Node Circle (Deep glass body with glowing category outline)
    this.nodeElements.append("circle")
      .attr("class", "node-circle")
      .attr("r", d => d.radius || 16)
      .attr("fill", "#0f1424")
      .attr("stroke", d => this.getNodeColor(d))
      .attr("stroke-width", 2);

    // C. SVG Vector Glyph (Centered in node)
    this.nodeElements.append("g")
      .attr("class", "node-icon-svg")
      .attr("transform", "translate(-12, -12)")
      .attr("color", d => this.getNodeColor(d))
      .html(d => this.getNodeIconMarkup(d));

    // D. Node Label with legibility pill background
    const labelGroup = this.nodeElements.append("g")
      .attr("class", "node-label-group")
      .attr("transform", d => `translate(0, ${(d.radius || 16) + 8})`);

    const textElements = labelGroup.append("text")
      .attr("class", "node-label-text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.85em")
      .attr("fill", "#e8ecf4")
      .attr("font-size", "11px")
      .attr("font-family", "Inter, system-ui, sans-serif")
      .attr("font-weight", "500")
      .text(d => {
        const str = d.label || '';
        return str.length > 20 ? str.substring(0, 18) + '…' : str;
      });

    // Add semi-transparent pill behind label for 100% legibility over crossed lines
    labelGroup.insert("rect", "text")
      .attr("class", "node-label-pill")
      .attr("fill", "rgba(10, 14, 26, 0.88)")
      .attr("stroke", "rgba(255, 255, 255, 0.08)")
      .attr("stroke-width", 0.8)
      .attr("rx", 4)
      .attr("ry", 4)
      .each(function() {
        const textNode = this.parentNode.querySelector("text");
        const bbox = textNode ? textNode.getBBox() : { width: 40, height: 12 };
        d3.select(this)
          .attr("x", bbox.x - 5)
          .attr("y", bbox.y - 2)
          .attr("width", bbox.width + 10)
          .attr("height", bbox.height + 4);
      });

    // E. Simulation Tick with BOUNDARY CLAMPING
    this.simulation.on("tick", () => {
      // Clamping ensures NO node ever flies outside the viewport bounds!
      this.nodesData.forEach(d => {
        const padX = (d.radius || 16) + 30;
        const padY = (d.radius || 16) + 35;
        d.x = Math.max(padX, Math.min(this.width - padX, d.x));
        d.y = Math.max(padY, Math.min(this.height - padY, d.y));
      });

      this.linkElements
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      this.nodeElements
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Update node count badge in UI if container exists
    this.updateStatusBadge();
  },

  updateStatusBadge() {
    const badge = document.getElementById('graph-status-badge');
    if (badge) {
      const totalDeals = (typeof DATA !== 'undefined' && DATA.deals) ? DATA.deals.length : 500;
      badge.innerHTML = `Showing <strong>${this.nodesData.length}</strong> nodes • <span>${totalDeals} deals in memory</span>`;
    }
  },

  // ── Drag Handlers ─────────────────────────────────────────────
  dragstarted(event, d) {
    if (!event.active) this.simulation.alphaTarget(0.2).restart();
    d.fx = d.x;
    d.fy = d.y;
  },

  dragged(event, d) {
    const pad = (d.radius || 16) + 20;
    d.fx = Math.max(pad, Math.min(this.width - pad, event.x));
    d.fy = Math.max(pad, Math.min(this.height - pad, event.y));
  },

  dragended(event, d) {
    if (!event.active) this.simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  },

  // ── Hover & Mouse Feedback ────────────────────────────────────
  handleNodeMouseEnter(event, node) {
    if (this.selectedNodeId) return; // Keep focus on selected node
    this.showTooltip(event, node);
  },

  handleNodeMouseLeave(event, node) {
    this.hideTooltip();
  },

  showTooltip(event, node) {
    let tooltip = document.getElementById('graph-floating-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'graph-floating-tooltip';
      tooltip.className = 'graph-floating-tooltip';
      document.body.appendChild(tooltip);
    }

    const typeConfig = this.CONFIG[node.type] || {};
    const neighborCount = this.adjacency.get(node.id)?.size || 0;

    tooltip.innerHTML = `
      <div class="tt-header">
        <span class="tt-badge" style="color: ${this.getNodeColor(node)}; border-color: ${this.getNodeColor(node)};">
          ${typeConfig.label || node.type}
        </span>
        <span class="tt-connections">${neighborCount} connection${neighborCount === 1 ? '' : 's'}</span>
      </div>
      <div class="tt-title">${node.data?.company || node.data?.name || node.label}</div>
      <div class="tt-sub">${node.data?.industry || node.data?.role || node.data?.category || ''}</div>
      <div class="tt-hint">Click to inspect relationships</div>
    `;

    tooltip.style.left = `${event.pageX + 14}px`;
    tooltip.style.top = `${event.pageY - 12}px`;
    tooltip.style.opacity = '1';
    tooltip.style.display = 'block';
  },

  hideTooltip() {
    const tooltip = document.getElementById('graph-floating-tooltip');
    if (tooltip) {
      tooltip.style.opacity = '0';
      tooltip.style.display = 'none';
    }
  },

  // ── Node Click & Neighborhood Highlighting ───────────────────
  handleNodeClick(event, node) {
    if (event) event.stopPropagation();
    this.hideTooltip();

    if (this.selectedNodeId === node.id) {
      // Toggle off if already selected
      this.deselectAll();
      return;
    }

    this.selectNode(node.id);
  },

  selectNode(nodeId) {
    let node = this.nodesData.find(n => n.id === nodeId);
    if (!node) {
      // If node exists in database but not yet in view, add it to view
      const fullNode = this.allNodesMap.get(nodeId);
      if (fullNode) {
        this.expandNodeNeighborhood(nodeId);
        node = this.nodesData.find(n => n.id === nodeId);
      }
    }
    if (!node) return;

    this.selectedNodeId = nodeId;
    const connectedNodeIds = this.adjacency.get(nodeId) || new Set();

    // 1. Center camera on selected node smoothly
    if (this.zoom && this.svg && typeof node.x === 'number' && typeof node.y === 'number') {
      this.svg.transition().duration(500).call(
        this.zoom.transform,
        d3.zoomIdentity.translate(this.width / 2, this.height / 2).scale(1.15).translate(-node.x, -node.y)
      );
    }

    // 2. Reset highlights first
    this.activeHighlights.clear();
    this.activeHighlights.add(nodeId);
    connectedNodeIds.forEach(id => this.activeHighlights.add(id));

    // 3. Dim unrelated nodes and highlight direct connections
    if (this.nodeElements) {
      this.nodeElements.each(function(d) {
        const isSelf = d.id === nodeId;
        const isConnected = connectedNodeIds.has(d.id);
        const group = d3.select(this);

        if (isSelf) {
          group.style("opacity", 1);
          group.select(".node-selection-ring")
            .attr("opacity", 1)
            .attr("stroke-width", 3);
          group.select(".node-circle")
            .attr("stroke-width", 3.5)
            .style("filter", "url(#neon-glow)");
        } else if (isConnected) {
          group.style("opacity", 1);
          group.select(".node-selection-ring").attr("opacity", 0);
          group.select(".node-circle")
            .attr("stroke-width", 2.5)
            .style("filter", "drop-shadow(0 0 6px rgba(0, 229, 255, 0.4))");
        } else {
          group.style("opacity", 0.15);
          group.select(".node-selection-ring").attr("opacity", 0);
          group.select(".node-circle").attr("stroke-width", 1.5).style("filter", null);
        }
      });
    }

    // 4. Highlight connecting links with illuminated stroke
    if (this.linkElements) {
      this.linkElements.each(function(l) {
        const sId = typeof l.source === 'object' ? l.source.id : l.source;
        const tId = typeof l.target === 'object' ? l.target.id : l.target;
        const isDirect = (sId === nodeId || tId === nodeId);
        const line = d3.select(this);

        if (isDirect) {
          line.style("opacity", 0.95)
            .attr("stroke", "#00e5ff")
            .attr("stroke-width", 2.4)
            .attr("marker-end", "url(#arrow-highlight)");
        } else {
          line.style("opacity", 0.04)
            .attr("stroke", "rgba(255,255,255,0.12)")
            .attr("stroke-width", 1)
            .attr("marker-end", "url(#arrow-subtle)");
        }
      });
    }

    // 5. Notify app controller to show rich details
    if (window.App && typeof App.showGraphNodeDetails === 'function') {
      App.showGraphNodeDetails(node);
    }
  },

  deselectAll() {
    this.selectedNodeId = null;
    this.resetHighlights();

    if (window.App && typeof App.renderGraphOverviewPanel === 'function') {
      App.renderGraphOverviewPanel();
    }
  },

  resetHighlights() {
    this.selectedNodeId = null;
    this.activeHighlights.clear();

    if (this.nodeElements) {
      this.nodeElements
        .style("opacity", 1)
        .each(function() {
          const group = d3.select(this);
          group.select(".node-selection-ring").attr("opacity", 0);
          group.select(".node-circle")
            .attr("stroke-width", 2)
            .style("filter", null);
        });
    }

    if (this.linkElements) {
      this.linkElements
        .style("opacity", 0.75)
        .attr("stroke", "rgba(255, 255, 255, 0.12)")
        .attr("stroke-width", 1.2)
        .attr("class", "graph-link")
        .attr("marker-end", "url(#arrow-subtle)");
    }
  },

  // ── 4. Progressive Neighborhood Exploration ──────────────────
  expandNodeNeighborhood(nodeId) {
    const neighbors = this.adjacency.get(nodeId);
    if (!neighbors || neighbors.size === 0) return;

    const currentIds = new Set(this.nodesData.map(n => n.id));
    let addedCount = 0;

    neighbors.forEach(nId => {
      if (!currentIds.has(nId)) {
        const fullNode = this.allNodesMap.get(nId);
        if (fullNode) {
          // Place newly added nodes near the source node
          const sourceNode = this.nodesData.find(n => n.id === nodeId);
          const newNode = {
            ...fullNode,
            x: sourceNode ? sourceNode.x + (Math.random() - 0.5) * 60 : this.width / 2,
            y: sourceNode ? sourceNode.y + (Math.random() - 0.5) * 60 : this.height / 2
          };
          this.nodesData.push(newNode);
          currentIds.add(nId);
          addedCount++;
        }
      }
    });

    if (addedCount > 0) {
      // Add missing links between all visible nodes
      this.allLinks.forEach(l => {
        const sId = typeof l.source === 'object' ? l.source.id : l.source;
        const tId = typeof l.target === 'object' ? l.target.id : l.target;
        if (currentIds.has(sId) && currentIds.has(tId)) {
          const exists = this.linksData.some(existing => {
            const esId = typeof existing.source === 'object' ? existing.source.id : existing.source;
            const etId = typeof existing.target === 'object' ? existing.target.id : existing.target;
            return esId === sId && etId === tId;
          });
          if (!exists) {
            this.linksData.push({ ...l, source: sId, target: tId });
          }
        }
      });

      // Re-render graph smoothly with updated dataset
      this.render();
      this.selectNode(nodeId);

      if (window.App && typeof App.showToast === 'function') {
        App.showToast(`✨ Expanded graph: Added ${addedCount} connected memory node${addedCount === 1 ? '' : 's'}`);
      }
    } else {
      if (window.App && typeof App.showToast === 'function') {
        App.showToast(`All connected records are already visible in this view.`);
      }
    }
  },

  // ── 5. Show Why: Tracing Animated Reasoning Path ─────────────
  highlightReasoningChain(dealId) {
    this.resetHighlights();

    const targetDealIdStr = `deal_${dealId}`;
    const layers = [];
    const allHighlightNodes = new Set();
    const allHighlightLinks = new Set();

    // Layer 0: The target deal itself
    const layer0Nodes = new Set([targetDealIdStr]);
    layers.push({ nodes: layer0Nodes, links: new Set(), title: "Source Deal Context" });
    allHighlightNodes.add(targetDealIdStr);

    // Layer 1: Objections & Stakeholders associated with this deal
    const layer1Nodes = new Set();
    const layer1Links = new Set();
    this.linksData.forEach(l => {
      const sId = typeof l.source === 'object' ? l.source.id : l.source;
      const tId = typeof l.target === 'object' ? l.target.id : l.target;
      if (sId === targetDealIdStr && (l.target.type === 'objection' || l.target.type === 'stakeholder')) {
        layer1Nodes.add(tId);
        layer1Links.add(l);
        allHighlightNodes.add(tId);
        allHighlightLinks.add(l);
      }
    });
    layers.push({ nodes: layer1Nodes, links: layer1Links, title: "Stakeholders & Objections" });

    // Layer 2: Strategies that resolve those objections or applied to deal
    const layer2Nodes = new Set();
    const layer2Links = new Set();
    this.linksData.forEach(l => {
      const sId = typeof l.source === 'object' ? l.source.id : l.source;
      const tId = typeof l.target === 'object' ? l.target.id : l.target;
      if ((layer1Nodes.has(sId) || sId === targetDealIdStr) && (l.target.type === 'strategy')) {
        layer2Nodes.add(tId);
        layer2Links.add(l);
        allHighlightNodes.add(tId);
        allHighlightLinks.add(l);
      }
    });
    layers.push({ nodes: layer2Nodes, links: layer2Links, title: "Proven Resolution Strategies" });

    // Layer 3: Outcomes influenced by those strategies
    const layer3Nodes = new Set();
    const layer3Links = new Set();
    this.linksData.forEach(l => {
      const sId = typeof l.source === 'object' ? l.source.id : l.source;
      const tId = typeof l.target === 'object' ? l.target.id : l.target;
      if (layer2Nodes.has(sId) && (l.target.type === 'outcome')) {
        layer3Nodes.add(tId);
        layer3Links.add(l);
        allHighlightNodes.add(tId);
        allHighlightLinks.add(l);
      }
    });
    layers.push({ nodes: layer3Nodes, links: layer3Links, title: "Historical Benchmark Outcomes" });

    // Dim everything first
    if (this.nodeElements) this.nodeElements.style("opacity", 0.08);
    if (this.linkElements) this.linkElements.style("opacity", 0.02);

    // Zoom gently onto the target deal
    const targetDeal = this.nodesData.find(n => n.id === targetDealIdStr);
    if (targetDeal && this.zoom && this.svg) {
      this.svg.transition().duration(600).call(
        this.zoom.transform,
        d3.zoomIdentity.translate(this.width / 2, this.height / 2).scale(1.15).translate(-targetDeal.x, -targetDeal.y)
      );
    }

    // Step through each layer sequentially with glowing illumination
    layers.forEach((layer, idx) => {
      setTimeout(() => {
        if (this.nodeElements) {
          this.nodeElements
            .filter(d => layer.nodes.has(d.id))
            .style("opacity", 1)
            .select(".node-circle")
            .attr("stroke-width", 3.5)
            .style("filter", `drop-shadow(0 0 14px rgba(0, 229, 255, 0.9))`);
        }

        if (this.linkElements) {
          this.linkElements
            .filter(d => layer.links.has(d))
            .style("opacity", 1)
            .attr("stroke", "#00e5ff")
            .attr("stroke-width", 2.8)
            .attr("class", "graph-link link-animated");
        }
      }, idx * 450);
    });
  },

  animateReasoningPath() {
    // Pick the selected deal or the first deal in view
    let targetDeal = null;
    if (this.selectedNodeId && this.selectedNodeId.startsWith('deal_')) {
      targetDeal = this.nodesData.find(n => n.id === this.selectedNodeId);
    }
    if (!targetDeal) {
      targetDeal = this.nodesData.find(n => n.type === 'deal');
    }
    if (!targetDeal) return;

    const dealId = targetDeal.data?.id || 1;
    this.highlightReasoningChain(dealId);

    if (window.App && typeof App.triggerShowWhy === 'function') {
      App.triggerShowWhy(dealId);
    }
  },

  // ── 6. Search Nodes ──────────────────────────────────────────
  searchNodes(query) {
    this.searchQuery = (query || '').trim().toLowerCase();

    if (!this.searchQuery) {
      this.clearSearch();
      return;
    }

    const matchIds = new Set();
    this.nodesData.forEach(n => {
      const searchBlob = `
        ${n.label || ''} 
        ${n.type || ''} 
        ${n.data?.company || ''} 
        ${n.data?.name || ''} 
        ${n.data?.role || ''} 
        ${n.data?.category || ''} 
        ${n.data?.strategy || ''} 
        ${n.data?.industry || ''}
      `.toLowerCase();

      if (searchBlob.includes(this.searchQuery)) {
        matchIds.add(n.id);
      }
    });

    if (this.nodeElements) {
      this.nodeElements.style("opacity", d => matchIds.has(d.id) ? 1 : 0.08);
      this.nodeElements.filter(d => matchIds.has(d.id))
        .select(".node-circle")
        .style("filter", "drop-shadow(0 0 12px rgba(0, 229, 255, 0.85))")
        .attr("stroke-width", 3.2);
    }

    if (this.linkElements) {
      this.linkElements.style("opacity", d => {
        const sId = typeof d.source === 'object' ? d.source.id : d.source;
        const tId = typeof d.target === 'object' ? d.target.id : d.target;
        return (matchIds.has(sId) || matchIds.has(tId)) ? 0.6 : 0.02;
      });
    }

    // Show empty result banner if 0 matches
    const searchStatus = document.getElementById('graph-search-status');
    if (searchStatus) {
      if (matchIds.size === 0) {
        searchStatus.innerHTML = `No memory nodes matching "<strong>${this.escapeHtml(this.searchQuery)}</strong>"`;
        searchStatus.style.display = 'block';
      } else {
        searchStatus.innerHTML = `Found <strong>${matchIds.size}</strong> matching node${matchIds.size === 1 ? '' : 's'}`;
        searchStatus.style.display = 'block';
      }
    }
  },

  clearSearch() {
    this.searchQuery = '';
    const searchStatus = document.getElementById('graph-search-status');
    if (searchStatus) searchStatus.style.display = 'none';

    const input = document.getElementById('graph-search-input');
    if (input) input.value = '';

    this.resetHighlights();
  },

  // ── 7. Category Filters ──────────────────────────────────────
  filterByType(activeTypes) {
    if (!activeTypes || activeTypes.length === 0 || activeTypes.includes('all')) {
      this.activeFilters = new Set(['all', 'deal', 'stakeholder', 'objection', 'strategy', 'outcome']);
      this.resetHighlights();
      return;
    }

    this.activeFilters = new Set(activeTypes);

    if (this.nodeElements) {
      this.nodeElements.style("opacity", d => this.activeFilters.has(d.type) ? 1 : 0.08);
      this.nodeElements.filter(d => !this.activeFilters.has(d.type))
        .select(".node-circle")
        .attr("stroke-width", 1.2);
    }

    if (this.linkElements) {
      this.linkElements.style("opacity", d => {
        const sType = typeof d.source === 'object' ? d.source.type : null;
        const tType = typeof d.target === 'object' ? d.target.type : null;
        return (this.activeFilters.has(sType) && this.activeFilters.has(tType)) ? 0.65 : 0.02;
      });
    }
  },

  // ── 8. Reset View & Zoom Controls ────────────────────────────
  resetView() {
    this.clearSearch();
    this.selectedNodeId = null;
    this.activeFilters = new Set(['all', 'deal', 'stakeholder', 'objection', 'strategy', 'outcome']);

    // Restore curated overview set
    this.loadCuratedInitialSet();
    this.render();

    // Reset zoom and center
    if (this.zoom && this.svg) {
      this.svg.transition().duration(600).call(
        this.zoom.transform,
        d3.zoomIdentity.translate(this.width / 2, this.height / 2).scale(0.92).translate(-this.width / 2, -this.height / 2)
      );
    }

    if (window.App && typeof App.renderGraphOverviewPanel === 'function') {
      App.renderGraphOverviewPanel();
    }
  },

  zoomIn() {
    if (this.zoom && this.svg) {
      this.svg.transition().duration(300).call(this.zoom.scaleBy, 1.3);
    }
  },

  zoomOut() {
    if (this.zoom && this.svg) {
      this.svg.transition().duration(300).call(this.zoom.scaleBy, 0.77);
    }
  },

  resetZoom() {
    if (this.zoom && this.svg) {
      this.svg.transition().duration(400).call(
        this.zoom.transform,
        d3.zoomIdentity.translate(this.width / 2, this.height / 2).scale(0.92).translate(-this.width / 2, -this.height / 2)
      );
    }
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
};

// Global exports for both browser and Node.js testing environments
if (typeof window !== 'undefined') {
  window.MemoryGraph = MemoryGraph;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MemoryGraph;
}
