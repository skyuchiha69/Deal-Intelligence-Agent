// ═══════════════════════════════════════════════════════════════
// Deal Intelligence Agent — Persistent Memory & Semantic Search
// ═══════════════════════════════════════════════════════════════

const MemoryStore = {
  STORAGE_KEY: 'deal_intel_memory',
  VERSION: 2,

  // ── Initialization ───────────────────────────────────────────
  init() {
    try {
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(this.STORAGE_KEY) : null;
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (
            parsed &&
            parsed.version === this.VERSION &&
            Array.isArray(parsed.deals) &&
            Array.isArray(parsed.stakeholders) &&
            Array.isArray(parsed.interactions) &&
            Array.isArray(parsed.objections) &&
            parsed.knowledgeBase &&
            parsed.memoryStats
          ) {
            // Restore mutable data from storage
            DATA.deals = parsed.deals;
            DATA.stakeholders = parsed.stakeholders;
            DATA.interactions = parsed.interactions;
            DATA.objections = parsed.objections;
            DATA.knowledgeBase = parsed.knowledgeBase;
            DATA.memoryStats = parsed.memoryStats;
            // Restore learning state
            if (parsed.learningState && typeof parsed.learningState === 'object') {
              this.learningState = parsed.learningState;
            } else {
              this.learningState = this._buildInitialLearningState();
            }
            console.log('[MemoryStore] Restored from persistent memory:', {
              deals: DATA.deals.length,
              interactions: DATA.interactions.length,
              nodes: DATA.memoryStats.memoryNodes
            });
            return true;
          } else {
            console.warn('[MemoryStore] Stored data structure invalid or outdated version, resetting with fresh data');
          }
        } catch (parseErr) {
          console.warn('[MemoryStore] Failed to parse stored data, using fresh data:', parseErr);
        }
      }
    } catch (storageErr) {
      console.warn('[MemoryStore] LocalStorage unavailable, running in memory-only mode:', storageErr);
    }

    // Initialize learning state from scratch
    this.learningState = this._buildInitialLearningState();
    this.save();
    console.log('[MemoryStore] Initialized with fresh data');
    return false;
  },

  // ── Save All State ───────────────────────────────────────────
  save() {
    const payload = {
      version: this.VERSION,
      deals: DATA.deals,
      stakeholders: DATA.stakeholders,
      interactions: DATA.interactions,
      objections: DATA.objections,
      knowledgeBase: DATA.knowledgeBase,
      memoryStats: DATA.memoryStats,
      learningState: this.learningState,
      savedAt: new Date().toISOString()
    };
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
      }
      this._updateMemoryStats();
    } catch (e) {
      console.warn('[MemoryStore] Storage save skipped (quota limit or storage disabled):', e.message || e);
      this._updateMemoryStats();
    }
  },

  // ── Reset to Fresh State ─────────────────────────────────────
  reset(skipConfirm = false) {
    if (!skipConfirm && typeof window !== 'undefined' && typeof window.confirm === 'function') {
      const ok = window.confirm('Are you sure you want to reset all organizational memory back to the default state? This will clear any created deals and learned weights.');
      if (!ok) return false;
    }
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    } catch (e) {
      console.warn('[MemoryStore] Reset storage warning:', e);
    }
    if (typeof location !== 'undefined' && typeof location.reload === 'function') {
      location.reload();
    }
    return true;
  },

  // ── Memory Stats ─────────────────────────────────────────────
  _updateMemoryStats() {
    DATA.memoryStats = {
      totalDeals: DATA.deals.length,
      totalInteractions: DATA.interactions.length,
      totalStakeholders: DATA.stakeholders.length,
      totalObjections: DATA.objections.length,
      totalLessons: DATA.knowledgeBase.lessonsLearned.length,
      memoryNodes: DATA.deals.length * 12 + DATA.interactions.length + DATA.stakeholders.length * 3 + (this.learningState ? this.learningState.patternCount : 0),
      memoryConnections: DATA.deals.length * 8 + DATA.interactions.length * 2,
      lastUpdated: new Date().toISOString()
    };
  },

  // ── Build Initial Learning State ─────────────────────────────
  _buildInitialLearningState() {
    const state = {
      strategyConfidence: {},  // strategy -> { score, timesUsed, timesSucceeded }
      objectionConfidence: {}, // category -> { totalAttempts, totalResolved, patterns: [] }
      industryPatterns: {},    // industry -> { wins, losses, avgCycle, topStrategies }
      patternCount: 0,
      lastLearnedAt: null,
      learningSessions: []     // log of all learning events
    };

    // Initialize from existing data
    DATA.knowledgeBase.successfulStrategies.forEach(s => {
      state.strategyConfidence[s.strategy] = {
        score: s.successRate,
        timesUsed: s.timesUsed,
        timesSucceeded: Math.round(s.timesUsed * s.successRate / 100),
        trend: 'stable'
      };
    });

    OBJECTION_CATEGORIES.forEach(cat => {
      const objs = DATA.objections.filter(o => o.category === cat);
      const resolved = objs.filter(o => o.outcome === 'resolved');
      state.objectionConfidence[cat] = {
        totalAttempts: objs.length,
        totalResolved: resolved.length,
        resolutionRate: objs.length > 0 ? Math.round((resolved.length / objs.length) * 100) : 50,
        patterns: []
      };
    });

    INDUSTRIES.forEach(ind => {
      const indDeals = DATA.deals.filter(d => d.industry === ind);
      const wins = indDeals.filter(d => d.status === 'won');
      const losses = indDeals.filter(d => d.status === 'lost');
      state.industryPatterns[ind] = {
        wins: wins.length,
        losses: losses.length,
        winRate: (wins.length + losses.length) > 0 ? Math.round((wins.length / (wins.length + losses.length)) * 100) : 50,
        avgCycle: indDeals.length > 0 ? Math.round(indDeals.reduce((a, d) => a + d.dealCycleDays, 0) / indDeals.length) : 60,
        topStrategies: []
      };
    });

    state.patternCount = Object.keys(state.strategyConfidence).length +
      Object.keys(state.objectionConfidence).length +
      Object.keys(state.industryPatterns).length;

    return state;
  },

  // ══════════════════════════════════════════════════════════════
  // SEMANTIC SIMILARITY ENGINE
  // ══════════════════════════════════════════════════════════════

  // Weights for each similarity dimension
  SIMILARITY_WEIGHTS: {
    industry: 30,
    value: 15,
    objections: 25,
    stakeholderRoles: 15,
    stage: 10,
    tags: 5
  },

  /**
   * Compute similarity between two deals using weighted multi-factor scoring.
   * Returns { score: 0-100, breakdown: { factor: score, ... }, reasons: [...] }
   */
  computeSimilarity(dealA, dealB) {
    const breakdown = {};
    const reasons = [];

    // 1. Industry match (exact = full, same sector = partial)
    if (dealA.industry === dealB.industry) {
      breakdown.industry = this.SIMILARITY_WEIGHTS.industry;
      reasons.push(`Same industry: ${dealA.industry}`);
    } else {
      breakdown.industry = 0;
    }

    // 2. Value proximity (exponential decay)
    const maxVal = Math.max(dealA.value, dealB.value, 1);
    const valueDiff = Math.abs(dealA.value - dealB.value) / maxVal;
    const valueScore = Math.max(0, 1 - valueDiff) * this.SIMILARITY_WEIGHTS.value;
    breakdown.value = Math.round(valueScore);
    if (valueDiff < 0.3) {
      reasons.push(`Similar deal size ($${(dealA.value/1000).toFixed(0)}K vs $${(dealB.value/1000).toFixed(0)}K)`);
    }

    // 3. Objection category overlap (Jaccard-like)
    const objsA = DATA.objections.filter(o => o.dealId === dealA.id).map(o => o.category);
    const objsB = DATA.objections.filter(o => o.dealId === dealB.id).map(o => o.category);
    const objUnion = new Set([...objsA, ...objsB]);
    const objIntersection = objsA.filter(c => objsB.includes(c));
    const objScore = objUnion.size > 0 ? (objIntersection.length / objUnion.size) : 0;
    breakdown.objections = Math.round(objScore * this.SIMILARITY_WEIGHTS.objections);
    if (objIntersection.length > 0) {
      reasons.push(`${objIntersection.length} matching objection type${objIntersection.length > 1 ? 's' : ''}: ${objIntersection.join(', ')}`);
    }

    // 4. Stakeholder role overlap
    const rolesA = DATA.stakeholders.filter(s => s.dealId === dealA.id).map(s => s.role);
    const rolesB = DATA.stakeholders.filter(s => s.dealId === dealB.id).map(s => s.role);
    const roleUnion = new Set([...rolesA, ...rolesB]);
    const roleIntersection = rolesA.filter(r => rolesB.includes(r));
    const roleScore = roleUnion.size > 0 ? (roleIntersection.length / roleUnion.size) : 0;
    breakdown.stakeholderRoles = Math.round(roleScore * this.SIMILARITY_WEIGHTS.stakeholderRoles);
    if (roleIntersection.length > 0) {
      reasons.push(`${roleIntersection.length} matching stakeholder role${roleIntersection.length > 1 ? 's' : ''}`);
    }

    // 5. Stage proximity
    const stageOrder = ['Discovery', 'Qualification', 'Proposal', 'Negotiation', 'Closed'];
    const stageA = stageOrder.indexOf(dealA.stage);
    const stageB = stageOrder.indexOf(dealB.stage);
    const stageDist = Math.abs(stageA - stageB) / (stageOrder.length - 1);
    breakdown.stage = Math.round((1 - stageDist) * this.SIMILARITY_WEIGHTS.stage);

    // 6. Tag overlap
    const tagsA = dealA.tags || [];
    const tagsB = dealB.tags || [];
    const tagOverlap = tagsA.filter(t => tagsB.includes(t)).length;
    const tagMax = Math.max(tagsA.length, tagsB.length, 1);
    breakdown.tags = Math.round((tagOverlap / tagMax) * this.SIMILARITY_WEIGHTS.tags);

    const totalScore = Object.values(breakdown).reduce((a, b) => a + b, 0);

    return {
      score: Math.min(totalScore, 100),
      breakdown,
      reasons
    };
  },

  /**
   * Find top-N most similar deals to a target deal.
   * Optionally filter by status (won, lost, active).
   */
  findSimilarDeals(dealId, { limit = 5, statusFilter = null } = {}) {
    const sourceDeal = DATA.deals.find(d => d.id === dealId);
    if (!sourceDeal) return [];

    return DATA.deals
      .filter(d => d.id !== dealId && (statusFilter ? d.status === statusFilter : true))
      .map(d => {
        const similarity = this.computeSimilarity(sourceDeal, d);
        return {
          ...d,
          similarityScore: similarity.score,
          similarityBreakdown: similarity.breakdown,
          similarityReasons: similarity.reasons
        };
      })
      .filter(d => d.similarityScore > 10)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);
  },

  /**
   * Find similar deals by context (for memory replay / new deal).
   * Context: { industry, objectionCategories, stakeholderRoles, value, stage }
   */
  findSimilarByContext(context, { limit = 5 } = {}) {
    const pseudoDeal = {
      id: -1,
      industry: context.industry,
      value: context.value || 500000,
      stage: context.stage || 'Discovery',
      tags: context.tags || []
    };

    // Temporarily create pseudo-data for similarity calc
    const pseudoObjections = (context.objectionCategories || []).map((cat, i) => ({
      dealId: -1, category: cat, id: -100 - i
    }));
    const pseudoStakeholders = (context.stakeholderRoles || []).map((role, i) => ({
      dealId: -1, role, id: -100 - i
    }));

    DATA.objections.push(...pseudoObjections);
    DATA.stakeholders.push(...pseudoStakeholders);

    const results = DATA.deals
      .filter(d => d.status !== 'active')
      .map(d => {
        const similarity = this.computeSimilarity(pseudoDeal, d);
        return {
          ...d,
          similarityScore: similarity.score,
          similarityBreakdown: similarity.breakdown,
          similarityReasons: similarity.reasons
        };
      })
      .filter(d => d.similarityScore > 10)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);

    // Clean up pseudo-data
    DATA.objections = DATA.objections.filter(o => o.dealId !== -1);
    DATA.stakeholders = DATA.stakeholders.filter(s => s.dealId !== -1);

    return results;
  },

  // ══════════════════════════════════════════════════════════════
  // DATA MUTATION — Add / Update operations
  // ══════════════════════════════════════════════════════════════

  /**
   * Add a new deal and persist.
   */
  addDeal(dealData) {
    const maxId = Math.max(0, ...DATA.deals.map(d => d.id));
    const deal = {
      id: maxId + 1,
      company: dealData.company,
      industry: dealData.industry,
      value: dealData.value,
      stage: dealData.stage || 'Discovery',
      status: 'active',
      outcome: null,
      winProbability: 50,
      dealCycleDays: 0,
      createdDate: new Date().toISOString().split('T')[0],
      closeDate: null,
      description: dealData.description || `Enterprise deal with ${dealData.company}`,
      keyFactors: [],
      tags: dealData.tags || []
    };
    DATA.deals.push(deal);
    this.save();

    this._logLearningEvent('deal_added', {
      dealId: deal.id,
      company: deal.company,
      industry: deal.industry
    });

    return deal;
  },

  /**
   * Add a stakeholder to a deal and persist.
   */
  addStakeholder(stakeholderData) {
    const maxId = Math.max(0, ...DATA.stakeholders.map(s => s.id));
    const stakeholder = {
      id: maxId + 1,
      dealId: stakeholderData.dealId,
      name: stakeholderData.name,
      role: stakeholderData.role,
      influenceLevel: stakeholderData.influenceLevel || 'Influencer',
      concerns: stakeholderData.concerns || [],
      sentiment: stakeholderData.sentiment || 'Neutral',
      engagementScore: 50,
      lastContact: new Date().toISOString().split('T')[0],
      email: stakeholderData.email || ''
    };
    DATA.stakeholders.push(stakeholder);
    this.save();
    return stakeholder;
  },

  /**
   * Add an interaction to a deal and persist.
   */
  addInteraction(interactionData) {
    const maxId = Math.max(0, ...DATA.interactions.map(i => i.id));
    const interaction = {
      id: maxId + 1,
      dealId: interactionData.dealId,
      type: interactionData.type || 'Follow-Up',
      content: interactionData.content,
      stakeholderName: interactionData.stakeholderName || '',
      timestamp: new Date().toISOString(),
      sentiment: interactionData.sentiment || 'neutral',
      keyTopics: interactionData.keyTopics || []
    };
    DATA.interactions.push(interaction);
    this.save();
    return interaction;
  },

  /**
   * Add an objection to a deal and persist.
   */
  addObjection(objectionData) {
    const maxId = Math.max(0, ...DATA.objections.map(o => o.id));
    const objection = {
      id: maxId + 1,
      dealId: objectionData.dealId,
      category: objectionData.category,
      description: objectionData.description,
      resolution: objectionData.resolution || 'Pending resolution',
      outcome: 'unresolved',
      raisedDate: new Date().toISOString().split('T')[0],
      resolvedDate: null,
      historicalSuccessRate: this.getHistoricalSuccessRate(objectionData.category),
      severity: objectionData.severity || 'Medium'
    };
    DATA.objections.push(objection);
    this.save();
    return objection;
  },

  /**
   * Resolve an objection.
   */
  resolveObjection(objectionId, resolution) {
    const obj = DATA.objections.find(o => o.id === objectionId);
    if (!obj) return null;
    obj.outcome = 'resolved';
    obj.resolution = resolution;
    obj.resolvedDate = new Date().toISOString().split('T')[0];
    this.save();
    return obj;
  },

  /**
   * Get historical success rate for an objection category.
   */
  getHistoricalSuccessRate(category) {
    const ls = this.learningState;
    if (ls && ls.objectionConfidence[category]) {
      return ls.objectionConfidence[category].resolutionRate;
    }
    return 50;
  },

  // ══════════════════════════════════════════════════════════════
  // DEAL OUTCOME — Mark Won / Lost + Learning
  // ══════════════════════════════════════════════════════════════

  /**
   * Mark a deal as won and trigger learning.
   */
  markDealWon(dealId, keyFactors = []) {
    const deal = DATA.deals.find(d => d.id === dealId);
    if (!deal) return null;

    deal.status = 'won';
    deal.outcome = 'won';
    deal.stage = 'Closed';
    deal.winProbability = 100;
    deal.closeDate = new Date().toISOString().split('T')[0];
    deal.keyFactors = keyFactors;

    // Trigger learning
    this._learnFromWon(deal);
    this.save();

    return deal;
  },

  /**
   * Mark a deal as lost and trigger learning.
   */
  markDealLost(dealId, keyFactors = []) {
    const deal = DATA.deals.find(d => d.id === dealId);
    if (!deal) return null;

    deal.status = 'lost';
    deal.outcome = 'lost';
    deal.stage = 'Closed';
    deal.winProbability = 0;
    deal.closeDate = new Date().toISOString().split('T')[0];
    deal.keyFactors = keyFactors;

    // Trigger learning
    this._learnFromLost(deal);
    this.save();

    return deal;
  },

  // ── Learning from Won Deals ──────────────────────────────────
  _learnFromWon(deal) {
    const ls = this.learningState;
    const event = {
      type: 'deal_won',
      dealId: deal.id,
      company: deal.company,
      industry: deal.industry,
      timestamp: new Date().toISOString(),
      patternsExtracted: [],
      confidenceChanges: []
    };

    // 1. Update industry patterns
    if (ls.industryPatterns[deal.industry]) {
      ls.industryPatterns[deal.industry].wins++;
      const ip = ls.industryPatterns[deal.industry];
      ip.winRate = Math.round((ip.wins / (ip.wins + ip.losses)) * 100);
    }

    // 2. Boost confidence for resolved objections
    const dealObjections = DATA.objections.filter(o => o.dealId === deal.id);
    dealObjections.forEach(obj => {
      if (obj.outcome === 'resolved' && ls.objectionConfidence[obj.category]) {
        const conf = ls.objectionConfidence[obj.category];
        conf.totalResolved++;
        conf.resolutionRate = Math.round((conf.totalResolved / Math.max(conf.totalAttempts, 1)) * 100);

        // Record the successful pattern
        conf.patterns.push({
          resolution: obj.resolution,
          industry: deal.industry,
          outcome: 'won',
          timestamp: new Date().toISOString()
        });

        event.confidenceChanges.push({
          category: obj.category,
          direction: 'up',
          newRate: conf.resolutionRate,
          reason: `Objection resolved successfully in won deal`
        });
      }
    });

    // 3. Boost confidence for key strategies
    (deal.keyFactors || []).forEach(strategy => {
      if (ls.strategyConfidence[strategy]) {
        const sc = ls.strategyConfidence[strategy];
        sc.timesUsed++;
        sc.timesSucceeded++;
        sc.score = Math.min(99, Math.round((sc.timesSucceeded / sc.timesUsed) * 100));
        sc.trend = 'up';
        event.confidenceChanges.push({
          strategy,
          direction: 'up',
          newScore: sc.score,
          reason: 'Strategy contributed to deal win'
        });
      } else {
        // New strategy discovered
        ls.strategyConfidence[strategy] = {
          score: 75,
          timesUsed: 1,
          timesSucceeded: 1,
          trend: 'new'
        };
        event.patternsExtracted.push({
          type: 'new_strategy',
          strategy,
          source: `Won deal #${deal.id} — ${deal.company}`
        });
      }
    });

    // 4. Extract patterns as lessons
    if (dealObjections.length > 0) {
      const resolvedCategories = dealObjections.filter(o => o.outcome === 'resolved').map(o => o.category);
      if (resolvedCategories.length > 0) {
        event.patternsExtracted.push({
          type: 'objection_resolution',
          categories: resolvedCategories,
          source: `${deal.company} (${deal.industry})`
        });
      }
    }

    ls.patternCount++;
    ls.lastLearnedAt = new Date().toISOString();
    ls.learningSessions.push(event);
    this._logLearningEvent('deal_won', event);
  },

  // ── Learning from Lost Deals ─────────────────────────────────
  _learnFromLost(deal) {
    const ls = this.learningState;
    const event = {
      type: 'deal_lost',
      dealId: deal.id,
      company: deal.company,
      industry: deal.industry,
      timestamp: new Date().toISOString(),
      patternsExtracted: [],
      confidenceChanges: []
    };

    // 1. Update industry patterns
    if (ls.industryPatterns[deal.industry]) {
      ls.industryPatterns[deal.industry].losses++;
      const ip = ls.industryPatterns[deal.industry];
      ip.winRate = Math.round((ip.wins / (ip.wins + ip.losses)) * 100);
    }

    // 2. Reduce confidence for unresolved objections
    const dealObjections = DATA.objections.filter(o => o.dealId === deal.id);
    dealObjections.forEach(obj => {
      if (obj.outcome === 'unresolved' && ls.objectionConfidence[obj.category]) {
        const conf = ls.objectionConfidence[obj.category];
        conf.totalAttempts++;
        conf.resolutionRate = Math.round((conf.totalResolved / Math.max(conf.totalAttempts, 1)) * 100);

        conf.patterns.push({
          resolution: obj.resolution,
          industry: deal.industry,
          outcome: 'lost',
          timestamp: new Date().toISOString()
        });

        event.confidenceChanges.push({
          category: obj.category,
          direction: 'down',
          newRate: conf.resolutionRate,
          reason: 'Unresolved objection contributed to deal loss'
        });
      }
    });

    // 3. Reduce confidence for failed strategies
    (deal.keyFactors || []).forEach(strategy => {
      if (ls.strategyConfidence[strategy]) {
        const sc = ls.strategyConfidence[strategy];
        sc.timesUsed++;
        sc.score = Math.max(10, Math.round((sc.timesSucceeded / sc.timesUsed) * 100));
        sc.trend = 'down';
        event.confidenceChanges.push({
          strategy,
          direction: 'down',
          newScore: sc.score,
          reason: 'Strategy did not prevent deal loss'
        });
      } else {
        ls.strategyConfidence[strategy] = {
          score: 25,
          timesUsed: 1,
          timesSucceeded: 0,
          trend: 'new'
        };
        event.patternsExtracted.push({
          type: 'failed_strategy',
          strategy,
          source: `Lost deal #${deal.id} — ${deal.company}`
        });
      }
    });

    // 4. Add to failed strategies knowledge base if novel
    (deal.keyFactors || []).forEach(factor => {
      const exists = DATA.knowledgeBase.failedStrategies.some(f => f.strategy === factor);
      if (!exists) {
        DATA.knowledgeBase.failedStrategies.push({
          id: DATA.knowledgeBase.failedStrategies.length + 1,
          strategy: factor,
          occurrences: 1,
          industries: [deal.industry]
        });
      }
    });

    ls.patternCount++;
    ls.lastLearnedAt = new Date().toISOString();
    ls.learningSessions.push(event);
    this._logLearningEvent('deal_lost', event);
  },

  /**
   * Manual feedback from Copilot (RAG) interactions
   */
  recordLearningSession(feedbackData) {
    const ls = this.learningState;
    if (!ls.objectionConfidence) return;

    const conf = ls.objectionConfidence[feedbackData.category];
    if (!conf) return;

    const event = {
      dealId: 'copilot',
      outcome: feedbackData.isHelpful ? 'helpful' : 'not_helpful',
      confidenceChanges: [],
      patternsExtracted: []
    };

    const oldRate = conf.resolutionRate;
    // Adjust confidence dynamically
    if (feedbackData.isHelpful) {
      conf.resolutionRate = Math.min(99, conf.resolutionRate + 5);
    } else {
      conf.resolutionRate = Math.max(10, conf.resolutionRate - 5);
    }

    event.confidenceChanges.push({
      category: feedbackData.category,
      direction: feedbackData.isHelpful ? 'up' : 'down',
      newRate: conf.resolutionRate,
      reason: `User marked Copilot recommendation as ${feedbackData.isHelpful ? 'Helpful' : 'Not Helpful'}`
    });

    ls.lastLearnedAt = new Date().toISOString();
    ls.learningSessions.push(event);
    this._logLearningEvent('copilot_feedback', event);
  },

  // ── Learning Event Log ───────────────────────────────────────
  _logLearningEvent(type, data) {
    if (!this._eventLog) this._eventLog = [];
    this._eventLog.push({
      type,
      data,
      timestamp: new Date().toISOString()
    });
    // Keep last 100 events
    if (this._eventLog.length > 100) {
      this._eventLog = this._eventLog.slice(-100);
    }
  },

  getRecentLearningEvents(limit = 10) {
    const sessions = this.learningState.learningSessions || [];
    return sessions.slice(-limit).reverse();
  },

  /**
   * Get dynamic confidence for a strategy.
   */
  getStrategyConfidence(strategy) {
    const sc = this.learningState.strategyConfidence[strategy];
    return sc ? sc.score : 50;
  },

  /**
   * Get current objection resolution confidence.
   */
  getObjectionConfidence(category) {
    const oc = this.learningState.objectionConfidence[category];
    return oc ? oc.resolutionRate : 50;
  },

  /**
   * Get industry win rate from learning.
   */
  getIndustryWinRate(industry) {
    const ip = this.learningState.industryPatterns[industry];
    return ip ? ip.winRate : 50;
  },

  /**
   * Get all strategy confidences sorted by score.
   */
  getTopStrategies(limit = 10) {
    return Object.entries(this.learningState.strategyConfidence)
      .map(([strategy, data]) => ({ strategy, ...data }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },

  /**
   * Get learning summary for display.
   */
  getLearningSummary() {
    const ls = this.learningState;
    const sessions = ls.learningSessions || [];
    const wonSessions = sessions.filter(s => s.type === 'deal_won');
    const lostSessions = sessions.filter(s => s.type === 'deal_lost');
    const totalConfidenceChanges = sessions.reduce(
      (sum, s) => sum + (s.confidenceChanges ? s.confidenceChanges.length : 0), 0
    );
    const totalPatterns = sessions.reduce(
      (sum, s) => sum + (s.patternsExtracted ? s.patternsExtracted.length : 0), 0
    );

    return {
      totalLearningSessions: sessions.length,
      wonDealsLearned: wonSessions.length,
      lostDealsLearned: lostSessions.length,
      confidenceUpdates: totalConfidenceChanges,
      patternsExtracted: totalPatterns + ls.patternCount,
      lastLearnedAt: ls.lastLearnedAt,
      topStrategies: this.getTopStrategies(5),
      objectionConfidence: { ...ls.objectionConfidence },
      industryPatterns: { ...ls.industryPatterns }
    };
  }
};

if (typeof window !== 'undefined') {
  window.MemoryStore = MemoryStore;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MemoryStore;
}
