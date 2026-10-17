// ═══════════════════════════════════════════════════════════════
// Deal Intelligence Agent — Interactive Organizational Memory Graph
// ═══════════════════════════════════════════════════════════════

const MemoryGraph = {
  svg: null,
  simulation: null,
  nodesData: [],
  linksData: [],
  nodeElements: null,
  linkElements: null,
  width: 0,
  height: 0,
  containerId: null,
  activeHighlights: new Set(),
  
  // Icon mapping
  ICONS: {
    deal: '💼',
    stakeholder: '👤',
    objection: '🛡️',
    strategy: '🎯',
    outcome: '🏆' // Changed dynamically for lost
  },

  // Color mapping
  COLORS: {
    deal: '#00e5ff',        // Cyan
    stakeholder: '#b388ff', // Light purple
    objection: '#ff8c42',   // Orange
    strategy: '#00e5a0',    // Green
    won: '#00e5a0',
    lost: '#ff5252',
    active: '#ffd93d'
  },

  safeHash(str) {
    if (!str) return 'empty';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  },

  init(containerId, viewMode = 'pipeline') {
    if (this.simulation) {
      try { this.simulation.stop(); } catch (e) {}
    }
    this.containerId = containerId;
    this.viewMode = viewMode;
    this.buildGraphData();
    this.render();

    if (!this._resizeAttached && typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.handleResize());
      this._resizeAttached = true;
    }
  },

  handleResize() {
    const container = document.getElementById(this.containerId);
    if (!container || !this.svg || !this.simulation) return;
    const newWidth = container.clientWidth || 800;
    const newHeight = container.clientHeight || 600;
    if (newWidth === this.width && newHeight === this.height) return;
    this.width = newWidth;
    this.height = newHeight;
    this.svg.attr("viewBox", [0, 0, this.width, this.height]);
    this.simulation.force("center", d3.forceCenter(this.width / 2, this.height / 2));
    this.simulation.alpha(0.3).restart();
  },

  buildGraphData() {
    this.nodesData = [];
    this.linksData = [];
    
    const nodeMap = new Map();

    const addNode = (id, type, label, data) => {
      if (!nodeMap.has(id)) {
        const node = { id, type, label, data, val: this.getNodeSize(type) };
        this.nodesData.push(node);
        nodeMap.set(id, node);
      }
    };

    const addLink = (source, target, type) => {
      // Ensure both nodes exist
      if (nodeMap.has(source) && nodeMap.has(target)) {
        this.linksData.push({ source, target, type });
      }
    };

    // 1. Process Deals (respect viewMode for optimal layout & performance)
    let dealsToInclude = DATA.deals || [];
    if (this.viewMode === 'pipeline') {
      // Prioritize all active pipeline deals, plus top representative won/lost deals
      const activeDeals = dealsToInclude.filter(d => d.status === 'active');
      const wonDeals = dealsToInclude.filter(d => d.status === 'won').slice(0, 15);
      const lostDeals = dealsToInclude.filter(d => d.status === 'lost').slice(0, 15);
      dealsToInclude = [...activeDeals, ...wonDeals, ...lostDeals];
    }

    const includedDealIds = new Set(dealsToInclude.map(d => d.id));

    dealsToInclude.forEach(deal => {
      const dealNodeId = `deal_${deal.id}`;
      addNode(dealNodeId, 'deal', deal.company, deal);

      // Outcome Nodes
      if (deal.status !== 'active') {
        const outcomeId = `outcome_${deal.id}`;
        const outcomeLabel = deal.status === 'won' ? 'Won' : 'Lost';
        addNode(outcomeId, 'outcome', outcomeLabel, deal);
        addLink(dealNodeId, outcomeId, 'resulted_in');

        // Strategies (Key Factors)
        (deal.keyFactors || []).forEach((factor) => {
          const strategyId = `strategy_${this.safeHash(factor)}`;
          addNode(strategyId, 'strategy', factor.length > 25 ? factor.substring(0,25) + '...' : factor, { strategy: factor });
          // Link strategy to outcome
          addLink(strategyId, outcomeId, 'influenced');
          // Link strategy to deal
          addLink(dealNodeId, strategyId, 'used_strategy');
        });
      }
    });

    // 2. Process Stakeholders for included deals
    (DATA.stakeholders || []).forEach(sh => {
      if (includedDealIds.has(sh.dealId)) {
        const shId = `sh_${sh.id}`;
        addNode(shId, 'stakeholder', sh.role, sh);
        addLink(`deal_${sh.dealId}`, shId, 'participated');
      }
    });

    // 3. Process Objections for included deals
    (DATA.objections || []).forEach(obj => {
      if (includedDealIds.has(obj.dealId)) {
        const objId = `obj_${obj.id}`;
        addNode(objId, 'objection', obj.category, obj);
        addLink(`deal_${obj.dealId}`, objId, 'raised');

        // If resolved, link to the resolution strategy pattern
        if (obj.outcome === 'resolved' && obj.resolution) {
          const strategyId = `strategy_${this.safeHash(obj.resolution)}`;
          addNode(strategyId, 'strategy', 'Resolution', { strategy: obj.resolution });
          addLink(objId, strategyId, 'resolved_by');
        }
      }
    });
  },

  getNodeSize(type) {
    switch (type) {
      case 'deal': return 25;
      case 'outcome': return 30;
      case 'strategy': return 20;
      case 'objection': return 18;
      case 'stakeholder': return 15;
      default: return 15;
    }
  },

  getNodeColor(node) {
    if (node.type === 'outcome') return node.data.status === 'won' ? this.COLORS.won : this.COLORS.lost;
    if (node.type === 'deal') return node.data.status === 'active' ? this.COLORS.active : this.COLORS.deal;
    return this.COLORS[node.type];
  },

  getNodeIcon(node) {
    if (node.type === 'outcome') return node.data.status === 'won' ? '🏆' : '❌';
    return this.ICONS[node.type];
  },

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
          <p>No active deals or historical memory nodes match the current view criteria.</p>
        </div>
      `;
      return;
    }

    this.width = container.clientWidth || 800;
    this.height = container.clientHeight || 600;

    // Create SVG
    this.svg = d3.select(container).append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", [0, 0, this.width, this.height]);

    // Add zoom container
    this.g = this.svg.append("g");

    // Zoom setup
    this.zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        this.g.attr("transform", event.transform);
      });
    this.svg.call(this.zoom);
    // Center slightly zoomed out initially
    this.svg.call(this.zoom.transform, d3.zoomIdentity.translate(this.width/2, this.height/2).scale(0.85).translate(-this.width/2, -this.height/2));

    // Force Simulation setup
    this.simulation = d3.forceSimulation(this.nodesData)
      .force("link", d3.forceLink(this.linksData).id(d => d.id).distance(60))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(this.width / 2, this.height / 2))
      .force("collide", d3.forceCollide().radius(d => d.val + 10).iterations(2));

    // Draw Links
    this.linkElements = this.g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(this.linksData)
      .enter().append("line")
      .attr("stroke", "rgba(255,255,255,0.1)")
      .attr("stroke-width", 1.5)
      .attr("id", d => `link-${d.source.id}-${d.target.id}`);

    // Draw Nodes
    this.nodeElements = this.g.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(this.nodesData)
      .enter().append("g")
      .attr("class", "node")
      .attr("id", d => `node-${d.id}`)
      .call(d3.drag()
        .on("start", this.dragstarted.bind(this))
        .on("drag", this.dragged.bind(this))
        .on("end", this.dragended.bind(this)))
      .on("click", (event, d) => this.handleNodeClick(event, d));

    // Node circles
    this.nodeElements.append("circle")
      .attr("r", d => d.val)
      .attr("fill", "#0a0e1a") // Background
      .attr("stroke", d => this.getNodeColor(d))
      .attr("stroke-width", 2);

    // Node Icons
    this.nodeElements.append("text")
      .text(d => this.getNodeIcon(d))
      .attr("text-anchor", "middle")
      .attr("dy", "0.3em")
      .attr("font-size", d => d.val * 0.9 + "px");

    // Node Labels
    this.nodeElements.append("text")
      .text(d => d.label)
      .attr("dx", d => d.val + 5)
      .attr("dy", 4)
      .attr("fill", "rgba(255,255,255,0.7)")
      .attr("font-size", "10px")
      .style("pointer-events", "none")
      .attr("class", "node-label");

    // Simulation tick updates
    this.simulation.on("tick", () => {
      this.linkElements
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      this.nodeElements
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });
  },

  dragstarted(event, d) {
    if (!event.active) this.simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  },

  dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  },

  dragended(event, d) {
    if (!event.active) this.simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  },

  // ── Node Interactions ─────────────────────────────────────────

  handleNodeClick(event, node) {
    // Prevent event bubbling
    event.stopPropagation();
    
    // Reset highlights
    this.resetHighlights();

    // Notify app controller to show details
    if (window.App && typeof App.showGraphNodeDetails === 'function') {
      App.showGraphNodeDetails(node);
    }
  },

  // ── Path Highlighting ─────────────────────────────────────────

  resetHighlights() {
    this.activeHighlights.clear();
    this.nodeElements.style("opacity", 1);
    this.nodeElements.select("circle").attr("stroke-width", 2).attr("filter", null);
    this.linkElements.style("opacity", 1).attr("stroke", "rgba(255,255,255,0.1)").attr("stroke-width", 1.5);
  },

  /**
   * Highlights a reasoning chain originating from a Deal node.
   * Path: Deal -> Objections -> Strategies -> Historical Deals -> Won Outcomes
   * Animated step-by-step with sequential delays.
   */
  highlightReasoningChain(dealId) {
    this.resetHighlights();
    
    const targetDealIdStr = `deal_${dealId}`;
    const layers = []; // Array of { nodes: Set, links: Set } for each step
    const allHighlightNodes = new Set();
    const allHighlightLinks = new Set();
    
    // Layer 0: The deal itself
    const layer0nodes = new Set([targetDealIdStr]);
    layers.push({ nodes: layer0nodes, links: new Set() });
    allHighlightNodes.add(targetDealIdStr);

    // Layer 1: Objections from this deal
    const layer1nodes = new Set();
    const layer1links = new Set();
    this.linksData.forEach(l => {
      if (l.source.id === targetDealIdStr && l.target.type === 'objection') {
        layer1nodes.add(l.target.id);
        layer1links.add(l);
        allHighlightNodes.add(l.target.id);
        allHighlightLinks.add(l);
      }
    });
    layers.push({ nodes: layer1nodes, links: layer1links });

    // Layer 2: Strategies resolving those objections
    const layer2nodes = new Set();
    const layer2links = new Set();
    this.linksData.forEach(l => {
      if (layer1nodes.has(l.source.id) && l.target.type === 'strategy') {
        layer2nodes.add(l.target.id);
        layer2links.add(l);
        allHighlightNodes.add(l.target.id);
        allHighlightLinks.add(l);
      }
    });
    layers.push({ nodes: layer2nodes, links: layer2links });

    // Layer 3: Historical deals that used those strategies + their won outcomes
    const layer3nodes = new Set();
    const layer3links = new Set();
    this.linksData.forEach(l => {
      if (layer2nodes.has(l.target.id) && l.source.type === 'deal' && l.source.id !== targetDealIdStr) {
        layer3nodes.add(l.source.id);
        layer3links.add(l);
        allHighlightNodes.add(l.source.id);
        allHighlightLinks.add(l);
        // Find won outcomes
        this.linksData.forEach(l2 => {
          if (l2.source.id === l.source.id && l2.target.type === 'outcome' && l2.target.data.status === 'won') {
            layer3nodes.add(l2.target.id);
            layer3links.add(l2);
            allHighlightNodes.add(l2.target.id);
            allHighlightLinks.add(l2);
          }
        });
      }
    });
    layers.push({ nodes: layer3nodes, links: layer3links });

    // Dim everything first
    this.nodeElements.style("opacity", 0.08);
    this.nodeElements.select("circle").attr("stroke-width", 2).attr("filter", null);
    this.linkElements.style("opacity", 0.03).attr("stroke", "rgba(255,255,255,0.1)").attr("stroke-width", 1.5);

    // Animate layers sequentially
    layers.forEach((layer, idx) => {
      setTimeout(() => {
        // Light up nodes in this layer
        this.nodeElements
          .filter(d => layer.nodes.has(d.id))
          .style("opacity", 1)
          .select("circle")
          .attr("stroke-width", 4)
          .style("filter", `drop-shadow(0 0 ${12 + idx * 3}px rgba(0,229,255,0.9))`);

        // Light up links in this layer
        this.linkElements
          .filter(d => layer.links.has(d))
          .style("opacity", 1)
          .attr("stroke", "#00e5ff")
          .attr("stroke-width", 3)
          .attr("class", "link-animated");
      }, idx * 600);
    });
  },

  // ── Search ────────────────────────────────────────────────────
  searchNodes(query) {
    if (!query || query.trim() === '') { this.clearSearch(); return; }
    const q = query.toLowerCase();
    const matchIds = new Set();
    this.nodesData.forEach(n => {
      const text = `${n.label} ${n.type} ${n.data?.company || ''} ${n.data?.role || ''} ${n.data?.category || ''} ${n.data?.strategy || ''}`.toLowerCase();
      if (text.includes(q)) matchIds.add(n.id);
    });
    this.nodeElements.style("opacity", d => matchIds.has(d.id) ? 1 : 0.08);
    this.nodeElements.filter(d => matchIds.has(d.id)).select("circle")
      .style("filter", "drop-shadow(0 0 12px rgba(0,229,255,0.8))").attr("stroke-width", 4);
    this.linkElements.style("opacity", d => {
      const sid = typeof d.source === 'object' ? d.source.id : d.source;
      const tid = typeof d.target === 'object' ? d.target.id : d.target;
      return (matchIds.has(sid) || matchIds.has(tid)) ? 0.6 : 0.03;
    });
  },

  clearSearch() {
    this.resetHighlights();
  },

  // ── Filter by Type ───────────────────────────────────────────
  filterByType(activeTypes) {
    if (!activeTypes || activeTypes.length === 0) { this.resetHighlights(); return; }
    this.nodeElements.style("opacity", d => activeTypes.includes(d.type) ? 1 : 0.08);
    this.nodeElements.filter(d => !activeTypes.includes(d.type)).select("circle").attr("stroke-width", 1);
    this.linkElements.style("opacity", d => {
      const sType = typeof d.source === 'object' ? d.source.type : null;
      const tType = typeof d.target === 'object' ? d.target.type : null;
      return (activeTypes.includes(sType) && activeTypes.includes(tType)) ? 0.6 : 0.03;
    });
  },

  // ── Show Why Reasoning Animation ─────────────────────────────
  animateReasoningPath() {
    this.resetHighlights();

    // 1. Current Deal -> Similar Deals -> Stakeholders -> Objections -> Strategies -> Outcomes
    const targetDeal = this.nodesData.find(n => n.type === 'deal');
    if (!targetDeal) return;

    // Simulate layers of reasoning path
    const layers = [];
    const allHighlightNodes = new Set();
    const allHighlightLinks = new Set();

    // Layer 0: Target Deal
    const l0Nodes = new Set([targetDeal.id]);
    const l0Links = new Set();
    layers.push({ nodes: l0Nodes, links: l0Links });
    allHighlightNodes.add(targetDeal.id);

    // Build the other layers similar to highlightDealMemoryPath but staggered out longer
    const l1Nodes = new Set(); const l1Links = new Set();
    this.linksData.forEach(l => {
      if (l.source.id === targetDeal.id) { l1Nodes.add(l.target.id); l1Links.add(l); allHighlightNodes.add(l.target.id); allHighlightLinks.add(l); }
    });
    layers.push({ nodes: l1Nodes, links: l1Links });

    const l2Nodes = new Set(); const l2Links = new Set();
    this.linksData.forEach(l => {
      if (l1Nodes.has(l.source.id) && l.target.type === 'strategy') { l2Nodes.add(l.target.id); l2Links.add(l); allHighlightNodes.add(l.target.id); allHighlightLinks.add(l); }
    });
    layers.push({ nodes: l2Nodes, links: l2Links });

    const l3Nodes = new Set(); const l3Links = new Set();
    this.linksData.forEach(l => {
      if (l2Nodes.has(l.target.id) && l.source.type === 'deal' && l.source.id !== targetDeal.id) { 
        l3Nodes.add(l.source.id); l3Links.add(l); allHighlightNodes.add(l.source.id); allHighlightLinks.add(l); 
      }
    });
    layers.push({ nodes: l3Nodes, links: l3Links });

    const l4Nodes = new Set(); const l4Links = new Set();
    this.linksData.forEach(l => {
      if (l3Nodes.has(l.source.id) && l.target.type === 'outcome') {
        l4Nodes.add(l.target.id); l4Links.add(l); allHighlightNodes.add(l.target.id); allHighlightLinks.add(l);
      }
    });
    layers.push({ nodes: l4Nodes, links: l4Links });

    // Dim everything first
    this.nodeElements.style("opacity", 0.08);
    this.nodeElements.select("circle").attr("stroke-width", 2).attr("filter", null);
    this.linkElements.style("opacity", 0.03).attr("stroke", "rgba(255,255,255,0.1)").attr("stroke-width", 1.5);

    // Zoom into target deal slightly using persisted zoom behavior
    if (this.zoom && this.svg) {
      this.svg.transition().duration(1000).call(
        this.zoom.transform,
        d3.zoomIdentity.translate(this.width/2, this.height/2).scale(1.4).translate(-targetDeal.x, -targetDeal.y)
      );
    }

    layers.forEach((layer, idx) => {
      setTimeout(() => {
        this.nodeElements.filter(d => layer.nodes.has(d.id))
          .style("opacity", 1)
          .select("circle").attr("stroke-width", 4)
          .style("filter", `drop-shadow(0 0 15px rgba(0,229,255,0.9))`);

        this.linkElements.filter(d => layer.links.has(d))
          .style("opacity", 1)
          .attr("stroke", "#00e5ff").attr("stroke-width", 3).attr("class", "link-animated");
      }, 1000 + (idx * 800));
    });

    // Zoom out at the end to show the full constellation
    setTimeout(() => {
      if (this.zoom && this.svg) {
        this.svg.transition().duration(2000).call(
          this.zoom.transform,
          d3.zoomIdentity.translate(this.width/2, this.height/2).scale(0.85).translate(-this.width/2, -this.height/2)
        );
      }
    }, 1000 + (layers.length * 800) + 1500);
  }
};

if (typeof window !== 'undefined') {
  window.MemoryGraph = MemoryGraph;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MemoryGraph;
}

