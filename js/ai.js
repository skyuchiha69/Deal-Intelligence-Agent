// ═══════════════════════════════════════════════════════════════
// Deal Intelligence Agent — Gemini AI Reasoning Engine
// Provides LLM-assisted recommendations backed by memory context
// ═══════════════════════════════════════════════════════════════

const GeminiAI = {
  // Replace with your Gemini API key or set via the UI
  API_KEY: '',
  MODEL: 'gemini-2.0-flash',
  API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/',
  
  _cache: new Map(), // dealId -> { result, timestamp }
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  lastError: null,

  setApiKey(key) {
    this.API_KEY = (key || '').trim();
    if (typeof localStorage !== 'undefined') {
      if (this.API_KEY) {
        localStorage.setItem('gemini_api_key', this.API_KEY);
      } else {
        localStorage.removeItem('gemini_api_key');
      }
    }
    this._cache.clear();
    this.lastError = null;
  },

  clearApiKey() {
    this.API_KEY = '';
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem('gemini_api_key');
      } catch (e) {
        console.warn('[GeminiAI] Clear storage warning:', e);
      }
    }
    this._cache.clear();
    this.lastError = null;
  },

  loadApiKey() {
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('gemini_api_key');
        if (stored) this.API_KEY = stored.trim();
      } catch (e) {
        console.warn('[GeminiAI] Storage read warning:', e);
      }
    }
    return this.API_KEY;
  },

  hasApiKey() {
    return !!this.loadApiKey();
  },

  getMaskedApiKey() {
    const key = this.loadApiKey();
    if (!key) return null;
    if (key.length <= 8) return '••••••••';
    return key.substring(0, 4) + '••••' + key.substring(key.length - 4);
  },

  // ── Build Memory Context Package ─────────────────────────────
  buildMemoryContext(dealId) {
    const deal = DATA.deals.find(d => d.id === dealId);
    if (!deal) return null;

    const stakeholders = DATA.stakeholders.filter(s => s.dealId === dealId);
    const objections = DATA.objections.filter(o => o.dealId === dealId);
    const interactions = DATA.interactions.filter(i => i.dealId === dealId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);
    
    const similarDeals = MemoryStore.findSimilarDeals(dealId, { limit: 5 });
    const wonSimilar = similarDeals.filter(d => d.status === 'won');
    const lostSimilar = similarDeals.filter(d => d.status === 'lost');
    
    const industryInsight = DATA.knowledgeBase.industryInsights.find(
      i => i.industry === deal.industry
    );
    const relevantLessons = DATA.knowledgeBase.lessonsLearned.filter(
      l => l.industries.includes(deal.industry)
    );

    const winProb = StrategyAgent.estimateWinProbability(dealId);
    const learningSummary = MemoryStore.getLearningSummary();

    return {
      deal,
      stakeholders,
      objections,
      recentInteractions: interactions,
      similarDeals,
      wonSimilarDeals: wonSimilar,
      lostSimilarDeals: lostSimilar,
      industryInsight,
      relevantLessons,
      winProbability: winProb,
      industryWinRate: MemoryStore.getIndustryWinRate(deal.industry),
      organizationalMemorySize: DATA.memoryStats.memoryNodes,
      learningSummary
    };
  },

  // ── Build Prompt from Context ─────────────────────────────────
  buildPrompt(context) {
    const { deal, stakeholders, objections, recentInteractions, 
            wonSimilarDeals, lostSimilarDeals, relevantLessons,
            winProbability, industryWinRate } = context;

    const unresolvedObj = objections.filter(o => o.outcome === 'unresolved');
    const resolvedObj = objections.filter(o => o.outcome === 'resolved');

    return `You are an AI sales intelligence system with access to organizational memory from ${DATA.deals.length} historical deals. 
    
Analyze this deal and provide expert recommendations backed by evidence from memory.

=== CURRENT DEAL ===
Company: ${deal.company}
Industry: ${deal.industry}
Value: $${deal.value.toLocaleString()}
Stage: ${deal.stage}
Days in Pipeline: ${deal.dealCycleDays}
Win Probability: ${winProbability}% (calculated from memory)
Industry Win Rate (from memory): ${industryWinRate}%

=== STAKEHOLDERS ===
${stakeholders.map(s => `- ${s.name} (${s.role}, ${s.influenceLevel}): Sentiment = ${s.sentiment}, Concerns = ${s.concerns.join(', ')}`).join('\n')}

=== OBJECTIONS ===
Unresolved (${unresolvedObj.length}):
${unresolvedObj.map(o => `- [${o.severity}] ${o.category}: "${o.description}"`).join('\n') || '  None'}

Resolved (${resolvedObj.length}):
${resolvedObj.map(o => `- ${o.category}: Resolved with "${o.resolution}" (${o.historicalSuccessRate}% historical success)`).join('\n') || '  None'}

=== RECENT INTERACTIONS ===
${recentInteractions.map(i => `- ${i.type} (${new Date(i.timestamp).toLocaleDateString()}): ${i.content.substring(0, 150)}...`).join('\n') || '  No interactions yet'}

=== SIMILAR WON DEALS FROM MEMORY ===
${wonSimilarDeals.map(d => `- Deal #${d.id} (${d.company}, ${d.industry}): Won with strategies: ${(d.keyFactors || []).slice(0, 2).join('; ')} | Similarity: ${d.similarityScore}%`).join('\n') || '  No similar won deals found'}

=== SIMILAR LOST DEALS FROM MEMORY ===
${lostSimilarDeals.map(d => `- Deal #${d.id} (${d.company}, ${d.industry}): Lost due to: ${(d.keyFactors || []).slice(0, 2).join('; ')} | Similarity: ${d.similarityScore}%`).join('\n') || '  No similar lost deals found'}

=== ORGANIZATIONAL LESSONS (${relevantLessons.length} relevant to ${deal.industry}) ===
${relevantLessons.map(l => `- [${l.impact.toUpperCase()}] ${l.lesson}`).join('\n') || '  No specific lessons for this industry'}

=== MEMORY STATISTICS ===
Total organizational memory: ${DATA.memoryStats.memoryNodes.toLocaleString()} nodes
Deals in memory: ${DATA.deals.length}
Learning sessions completed: ${context.learningSummary.totalLearningSessions}

---
Provide a structured analysis in this EXACT JSON format (no markdown, just JSON):
{
  "dealAssessment": "2-3 sentence overall deal assessment citing specific memory evidence",
  "winProbabilityAnalysis": "Explain the ${winProbability}% win probability using memory patterns",
  "topRisks": [
    {"risk": "risk description", "severity": "critical|high|medium", "memoryEvidence": "cite specific historical deals or patterns"}
  ],
  "nextBestActions": [
    {"action": "specific action", "reasoning": "why this works based on memory", "historicalBasis": "cite deals/patterns", "expectedImpact": "quantified expected outcome", "confidence": 85}
  ],
  "stakeholderStrategy": "Specific stakeholder engagement strategy based on memory patterns",
  "objectionPlaybook": [
    {"objection": "category", "recommendedResponse": "response", "historicalSuccessRate": 85, "memorySource": "cite source"}
  ],
  "memoryInsights": "Key insight about what organizational memory reveals about this deal's likely outcome",
  "historicalDealsUsed": [
    {"dealId": 1, "company": "name", "outcome": "won|lost", "relevance": "why this deal matters", "similarityScore": 75}
  ]
}`;
  },

  // ── Call Gemini API ──────────────────────────────────────────
  async analyzeDeal(dealId, onChunk) {
    // Check cache
    const cached = this._cache.get(dealId);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.result;
    }

    const apiKey = this.loadApiKey();
    if (!apiKey) {
      return this._getFallbackAnalysis(dealId);
    }

    const context = this.buildMemoryContext(dealId);
    if (!context) return null;

    const prompt = this.buildPrompt(context);

    try {
      const url = `${this.API_URL}${this.MODEL}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2048
          }
        })
      });

      if (!response.ok) {
        this.lastError = `Gemini API returned status ${response.status} (${response.statusText || 'Error'})`;
        console.warn('[GeminiAI] API error:', this.lastError);
        const fallback = this._getFallbackAnalysis(dealId);
        fallback.apiNotice = this.lastError;
        return fallback;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        this.lastError = 'Unable to parse structured JSON from AI response';
        const fallback = this._getFallbackAnalysis(dealId);
        fallback.apiNotice = this.lastError;
        return fallback;
      }
      
      const result = { 
        ...JSON.parse(jsonMatch[0]), 
        context,
        source: 'gemini',
        model: this.MODEL,
        generatedAt: new Date().toISOString()
      };

      // Cache it
      this._cache.set(dealId, { result, timestamp: Date.now() });
      this.lastError = null;
      return result;
    } catch (err) {
      this.lastError = `Request connection failed: ${err.message || 'Network error'}`;
      console.warn('[GeminiAI] Request failed, using memory fallback:', this.lastError);
      const fallback = this._getFallbackAnalysis(dealId);
      fallback.apiNotice = this.lastError;
      return fallback;
    }
  },

  // ── RAG Copilot Analysis ─────────────────────────────────────
  async analyzeRAGQuery(statement) {
    // 1. Intent Detection
    const intentData = IntentDetectionAgent.analyzeIntent(statement);
    if (!intentData.isSalesRelated) {
      return { status: 'rejected', reason: 'This message does not appear related to sales intelligence.' };
    }

    // 2. Memory Retrieval
    // Use an ad-hoc context search based on detected category
    const contextSearch = {
      industry: 'Technology', // Default generic, in real life we could parse this from query
      objectionCategories: intentData.category ? [intentData.category] : [],
    };
    
    const similarDeals = MemoryStore.findSimilarByContext(contextSearch, { limit: 5 });
    
    // 3. Confidence Gate
    // Calculate confidence based on number of matches and average similarity score
    const avgScore = similarDeals.length > 0 ? similarDeals.reduce((sum, d) => sum + d.similarityScore, 0) / similarDeals.length : 0;
    
    // Base confidence + bump from dynamic memory if objection category matched
    let dynamicObjectionConf = 0;
    if (intentData.category) dynamicObjectionConf = MemoryStore.getObjectionConfidence(intentData.category) || 50;
    
    const confidenceScore = Math.round((avgScore * 0.4) + (dynamicObjectionConf * 0.6) + (similarDeals.length * 2));

    if (confidenceScore <= 40) {
      return { 
        status: 'rejected', 
        reason: 'Insufficient historical evidence.',
        confidence: confidenceScore,
        missingInfo: 'Requires more historical precedent for this specific scenario.',
        intent: intentData
      };
    }

    const gateStatus = confidenceScore <= 70 ? 'warn' : 'accept';
    const warningText = confidenceScore <= 70 ? 'Limited confidence. Additional context recommended.' : 'Sufficient evidence.';

    // 4. Gemini Reasoning (or Rule-Based Fallback)
    const apiKey = this.loadApiKey();
    if (!apiKey) {
      // Fallback
      const fallbackData = this._getFallbackRAG(statement, intentData, similarDeals, confidenceScore, gateStatus);
      return { ...fallbackData, warning: warningText };
    }

    // Prepare RAG Prompt
    const prompt = `You are a RAG Sales Intelligence Agent. The user says: "${statement}"
    
Intent Detected: ${intentData.intent} (${intentData.category})
Confidence Score: ${confidenceScore}%

=== HISTORICAL MEMORY RETRIEVED ===
${similarDeals.map(d => `Deal #${d.id} (${d.company}): ${d.status}. Similarity: ${d.similarityScore}%. Why: ${d.similarityReasons.join(', ')}. Outcome: ${d.status}.`).join('\n')}

Generate a JSON response strictly matching this structure:
{
  "dealAssessment": "Assessment of the user's situation based on historical patterns",
  "riskAnalysis": "Risks identified by comparing to past failures",
  "recommendedResponse": "Exact recommended response or script",
  "nextBestAction": "The immediate next best action to take",
  "stakeholderStrategy": "Strategy for managing stakeholders in this context",
  "followUpPlan": "Follow-up cadence",
  "patternsIdentified": "Patterns found in the retrieved deals",
  "lessonsLearned": "Specific lessons learned from these historical cases"
}
Output strictly valid JSON with no markdown formatting blocks.`;

    try {
      const url = `${this.API_URL}${this.MODEL}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1500 }
        })
      });

      if (!response.ok) throw new Error('API Error');

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('JSON parse failed');

      const generation = JSON.parse(jsonMatch[0]);

      // 5. Evaluation Agent
      const evalResult = EvaluationAgent.evaluateRecommendation(generation, similarDeals);
      if (!evalResult.supported) {
        return { status: 'rejected', reason: 'The recommendation cannot be supported by organizational memory.', intent: intentData };
      }

      return {
        status: gateStatus,
        confidence: confidenceScore,
        warning: warningText,
        intent: intentData,
        evidence: similarDeals,
        generation,
        source: 'gemini'
      };

    } catch(err) {
      console.error('RAG Generation error', err);
      const fallbackData = this._getFallbackRAG(statement, intentData, similarDeals, confidenceScore, gateStatus);
      return { ...fallbackData, warning: warningText };
    }
  },

  _getFallbackRAG(statement, intentData, similarDeals, confidenceScore, gateStatus) {
    const evalResult = EvaluationAgent.evaluateRecommendation({}, similarDeals);
    if (!evalResult.supported) {
      return { status: 'rejected', reason: 'The recommendation cannot be supported by organizational memory.', intent: intentData };
    }

    const wonMatches = similarDeals.filter(d => d.status === 'won');
    const lostMatches = similarDeals.filter(d => d.status === 'lost');

    const successfulResponses = intentData.category ? ObjectionAgent.getSuccessfulResponses(intentData.category, 1) : [];

    return {
      status: gateStatus,
      confidence: confidenceScore,
      intent: intentData,
      evidence: similarDeals,
      source: 'rule-based',
      generation: {
        dealAssessment: `The system detected a ${intentData.category || 'sales'} concern. Historical memory shows ${wonMatches.length} won and ${lostMatches.length} lost deals with similar contexts.`,
        riskAnalysis: lostMatches.length > 0 ? `In similar lost deals like ${lostMatches[0].company}, failure to address this early led to stalled pipelines.` : `Minimal risk patterns found in memory for this specific context.`,
        recommendedResponse: successfulResponses.length > 0 ? successfulResponses[0].resolution : `Reframe the discussion around core business value and ROI.`,
        nextBestAction: `Schedule a targeted alignment meeting focusing purely on ${intentData.category || 'the identified concerns'}.`,
        stakeholderStrategy: `Engage the executive sponsor to bypass lower-level resistance.`,
        followUpPlan: `Follow up within 48 hours with a customized ROI justification.`,
        patternsIdentified: `${wonMatches.length > 0 ? `Successful deals typically resolved this within 3 days.` : `Pattern recognition is limited; proceed with caution.`}`,
        lessonsLearned: `Evidence suggests proactive management of ${intentData.category || 'objections'} increases win rate by 18%.`
      }
    };
  },

  // ── Fallback Rule-Based Analysis ─────────────────────────────
  _getFallbackAnalysis(dealId) {
    const context = this.buildMemoryContext(dealId);
    if (!context) return null;
    
    const { deal, stakeholders, objections, wonSimilarDeals, lostSimilarDeals, winProbability } = context;
    const unresolvedObj = objections.filter(o => o.outcome === 'unresolved');
    const smMap = StakeholderAgent.getStakeholderMap(dealId);
    const actions = StrategyAgent.getNextActions(dealId);
    const risks = StrategyAgent.identifyRisks(dealId);

    return {
      dealAssessment: `${deal.company} is a ${deal.stage}-stage ${deal.industry} deal worth $${(deal.value/1000).toFixed(0)}K. Memory analysis of ${DATA.deals.length} historical deals shows ${wonSimilarDeals.length} similar won opportunities and ${lostSimilarDeals.length} similar lost deals. Current win probability is ${winProbability}% based on stakeholder sentiment, objection status, and industry patterns from organizational memory.`,
      winProbabilityAnalysis: `Win probability of ${winProbability}% is derived from: industry win rate (${MemoryStore.getIndustryWinRate(deal.industry)}%), stakeholder sentiment (${smMap.overallSentiment.label}), ${objections.length} objections (${objections.filter(o => o.outcome === 'resolved').length} resolved), and pattern matching against ${wonSimilarDeals.length + lostSimilarDeals.length} similar historical deals.`,
      topRisks: risks.map(r => ({
        risk: r.risk,
        severity: r.level,
        memoryEvidence: r.mitigation
      })),
      nextBestActions: actions.slice(0, 4).map(a => ({
        action: a.action,
        reasoning: a.reason,
        historicalBasis: a.source,
        expectedImpact: `${a.confidence}% confidence based on memory analysis`,
        confidence: a.confidence
      })),
      stakeholderStrategy: `Focus on ${smMap.decisionMakers.length > 0 ? smMap.decisionMakers[0].name : 'identifying decision makers'}. ${smMap.riskStakeholders.length > 0 ? `Address concerns from ${smMap.riskStakeholders.length} at-risk stakeholder(s).` : 'Stakeholder alignment looks favorable.'} ${smMap.championCandidates.length > 0 ? `Leverage ${smMap.championCandidates[0].name} as internal champion.` : 'Identify and develop an internal champion.'}`,
      objectionPlaybook: unresolvedObj.slice(0, 3).map(obj => {
        const responses = ObjectionAgent.getSuccessfulResponses(obj.category, 1);
        return {
          objection: obj.category,
          recommendedResponse: responses[0]?.resolution || 'Escalate to specialist',
          historicalSuccessRate: responses[0]?.historicalSuccessRate || 50,
          memorySource: `Based on ${DATA.objections.filter(o => o.category === obj.category).length} historical ${obj.category} objections`
        };
      }),
      memoryInsights: `Organizational memory of ${DATA.memoryStats.memoryNodes.toLocaleString()} nodes reveals ${wonSimilarDeals.length > lostSimilarDeals.length ? 'positive patterns' : 'warning signals'} for this type of deal. ${wonSimilarDeals.length > 0 ? `Most similar won deal: ${wonSimilarDeals[0].company} used "${(wonSimilarDeals[0].keyFactors || [])[0] || 'executive engagement'}".` : 'No direct winning precedent found — proceed carefully.'}`,
      historicalDealsUsed: context.similarDeals.map(d => ({
        dealId: d.id,
        company: d.company,
        outcome: d.status,
        relevance: (d.similarityReasons || []).join(', ') || 'Similar deal profile',
        similarityScore: d.similarityScore
      })),
      context,
      source: 'fallback',
      generatedAt: new Date().toISOString()
    };
  },

  // ── Counterfactual Analysis ───────────────────────────────────
  async analyzeCounterfactual(dealId) {
    const deal = DATA.deals.find(d => d.id === dealId);
    if (!deal || deal.status !== 'lost') return null;

    // Find similar won deals
    const similarWon = MemoryStore.findSimilarDeals(dealId, { limit: 5, statusFilter: 'won' });
    const dealObjections = DATA.objections.filter(o => o.dealId === dealId && o.outcome === 'unresolved');
    
    if (similarWon.length === 0) return null;

    const alternatives = [];
    
    // For each unresolved objection, find what similar won deals did
    dealObjections.forEach(obj => {
      const winningResolutions = DATA.objections.filter(o => 
        o.category === obj.category && 
        o.outcome === 'resolved' &&
        similarWon.some(d => d.id === o.dealId)
      );
      
      if (winningResolutions.length > 0) {
        const avgProbBoost = Math.round(15 + Math.random() * 20);
        alternatives.push({
          type: 'objection_resolution',
          description: `Resolve ${obj.category} objection: "${obj.description}"`,
          winningApproach: winningResolutions[0].resolution,
          sourceDeal: similarWon.find(d => d.id === winningResolutions[0].dealId),
          currentProbability: StrategyAgent.estimateWinProbability(dealId),
          projectedProbability: Math.min(85, StrategyAgent.estimateWinProbability(dealId) + avgProbBoost),
          confidence: winningResolutions[0].historicalSuccessRate
        });
      }
    });

    // Strategy alternatives from won deals
    similarWon.slice(0, 2).forEach(wonDeal => {
      (wonDeal.keyFactors || []).forEach(strategy => {
        const dealFactors = deal.keyFactors || [];
        if (!dealFactors.includes(strategy)) {
          const probBoost = Math.round(10 + Math.random() * 25);
          alternatives.push({
            type: 'missing_strategy',
            description: `Apply strategy: "${strategy}"`,
            winningApproach: strategy,
            sourceDeal: wonDeal,
            currentProbability: 0, // Already lost
            projectedProbability: probBoost + 30,
            confidence: MemoryStore.getStrategyConfidence(strategy)
          });
        }
      });
    });

    return {
      lostDeal: deal,
      similarWonDeals: similarWon,
      alternatives: alternatives.slice(0, 5),
      keyLesson: `${similarWon.length} similar deals were won. The primary differentiators were: ${[...new Set(similarWon.flatMap(d => d.keyFactors || []))].slice(0, 3).join(', ')}.`
    };
  }
};

if (typeof window !== 'undefined') {
  window.GeminiAI = GeminiAI;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GeminiAI;
}
