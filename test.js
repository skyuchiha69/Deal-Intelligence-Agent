/**
 * Deal Intelligence Agent — Automated Test Suite
 * Tests all modules: Data layer, MemoryStore, Agents, GeminiAI fallback, Graph, and App controller.
 */

const fs = require('fs');
const path = require('path');

// ── Environment Mocking ─────────────────────────────────────────
const storageMock = {};
global.localStorage = {
  getItem: (k) => storageMock[k] || null,
  setItem: (k, v) => { storageMock[k] = String(v); },
  removeItem: (k) => { delete storageMock[k]; },
  clear: () => { for (const k in storageMock) delete storageMock[k]; }
};

const elements = {};
function createMockElement(id = '', tag = 'div') {
  return {
    id,
    tagName: tag.toUpperCase(),
    innerHTML: '',
    textContent: '',
    value: '',
    dataset: {},
    classList: {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      contains(c) { return this._classes.has(c); },
      toggle(c) { if (this.contains(c)) this.remove(c); else this.add(c); }
    },
    style: {},
    appendChild(child) { return child; },
    removeChild(child) { return child; },
    remove() {},
    querySelector(sel) { return createMockElement('', 'div'); },
    querySelectorAll(sel) { return []; },
    closest(sel) { return this; },
    addEventListener(evt, fn) {},
    dispatchEvent(evt) {},
    clientWidth: 1024,
    clientHeight: 768,
    scrollHeight: 1000
  };
}

global.document = {
  readyState: 'complete',
  addEventListener: (evt, fn) => {},
  removeEventListener: (evt, fn) => {},
  getElementById: (id) => {
    if (!elements[id]) elements[id] = createMockElement(id);
    return elements[id];
  },
  createElement: (tag) => createMockElement('', tag),
  querySelector: (sel) => createMockElement('', 'div'),
  querySelectorAll: (sel) => [],
  body: createMockElement('body', 'body')
};

global.window = {
  localStorage: global.localStorage,
  document: global.document,
  addEventListener: () => {},
  removeEventListener: () => {},
  requestAnimationFrame: (cb) => setTimeout(cb, 16),
  confirm: () => true,
  alert: () => {},
  setTimeout: global.setTimeout,
  clearTimeout: global.clearTimeout,
  setInterval: global.setInterval,
  clearInterval: global.clearInterval
};

// D3 mock
global.d3 = {
  select: () => {
    const chain = {
      append: () => chain,
      attr: () => chain,
      style: () => chain,
      call: () => chain,
      on: () => chain,
      selectAll: () => ({
        data: () => ({
          enter: () => ({
            append: () => chain
          })
        })
      }),
      text: () => chain,
      transition: () => ({
        duration: () => ({
          call: () => {}
        })
      })
    };
    return chain;
  },
  zoom: () => {
    const z = {
      scaleExtent: () => z,
      on: () => z,
      transform: () => {}
    };
    return z;
  },
  zoomIdentity: {
    translate: () => ({
      scale: () => ({
        translate: () => ({})
      })
    })
  },
  forceSimulation: () => {
    const sim = {
      force: () => sim,
      on: () => sim,
      alpha: () => sim,
      alphaTarget: () => sim,
      restart: () => sim,
      stop: () => sim
    };
    return sim;
  },
  forceLink: () => ({ id: () => ({ distance: () => ({}) }) }),
  forceManyBody: () => ({ strength: () => ({}) }),
  forceCenter: () => ({}),
  forceCollide: () => ({ radius: () => ({ iterations: () => ({}) }) }),
  drag: () => ({ on: () => ({ on: () => ({ on: () => ({}) }) }) })
};

const vm = require('vm');

// Load scripts in global context
const dataCode = fs.readFileSync(path.join(__dirname, 'js/data.js'), 'utf8');
const memoryCode = fs.readFileSync(path.join(__dirname, 'js/memory.js'), 'utf8');
const agentsCode = fs.readFileSync(path.join(__dirname, 'js/agents.js'), 'utf8');
const aiCode = fs.readFileSync(path.join(__dirname, 'js/ai.js'), 'utf8');
const graphCode = fs.readFileSync(path.join(__dirname, 'js/graph.js'), 'utf8');
const appCode = fs.readFileSync(path.join(__dirname, 'js/app.js'), 'utf8');

vm.runInThisContext(dataCode);
vm.runInThisContext(memoryCode);
vm.runInThisContext(agentsCode);
vm.runInThisContext(aiCode);
vm.runInThisContext(graphCode);
vm.runInThisContext(appCode);

// ── Test Runner ─────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, testName) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${testName}`);
  } else {
    failed++;
    failures.push(testName);
    console.error(`  ✗ FAIL: ${testName}`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log(' DEAL INTELLIGENCE AGENT — AUTOMATED VERIFICATION');
  console.log('======================================================\n');

  // Group 1: Data Layer
  console.log('1. DATA LAYER VERIFICATION');
  assert(typeof DATA === 'object' && DATA !== null, 'DATA object exists');
  assert(Array.isArray(DATA.deals) && DATA.deals.length === 500, `Generated 500 deals (found ${DATA.deals?.length})`);
  assert(Array.isArray(DATA.stakeholders) && DATA.stakeholders.length > 500, `Stakeholders populated (${DATA.stakeholders?.length})`);
  assert(Array.isArray(DATA.objections) && DATA.objections.length > 500, `Objections populated (${DATA.objections?.length})`);
  assert(Array.isArray(DATA.interactions) && DATA.interactions.length > 500, `Interactions populated (${DATA.interactions?.length})`);
  assert(Array.isArray(INDUSTRIES) && INDUSTRIES.length === 10, '10 industries supported');
  assert(DATA.deals.every(d => d.id && d.company && d.industry && d.status), 'All deals contain required fields');

  // Group 2: Memory Store & Persistence
  console.log('\n2. MEMORY STORE & LEARNING ENGINE');
  assert(typeof MemoryStore === 'object', 'MemoryStore exists');
  MemoryStore.init();
  assert(MemoryStore.learningState && typeof MemoryStore.learningState.strategyConfidence === 'object', 'Learning state initialized');
  
  const initialDealsCount = DATA.deals.length;
  const newDeal = MemoryStore.addDeal({
    company: 'Test Healthcare Org',
    industry: 'Healthcare',
    value: 350000,
    stage: 'Discovery',
    description: 'Automated test deal'
  });
  assert(newDeal && newDeal.id > initialDealsCount, 'MemoryStore.addDeal creates deal with incremented ID');
  assert(DATA.deals.length === initialDealsCount + 1, 'DATA.deals updated after adding deal');

  const newStakeholder = MemoryStore.addStakeholder({
    dealId: newDeal.id,
    name: 'Dr. Jane Smith',
    role: 'CTO',
    influenceLevel: 'Decision Maker',
    sentiment: 'Positive'
  });
  assert(newStakeholder && newStakeholder.dealId === newDeal.id, 'MemoryStore.addStakeholder creates stakeholder attached to deal');

  const newObjection = MemoryStore.addObjection({
    dealId: newDeal.id,
    category: 'Security',
    description: 'HIPAA and SOC 2 requirements',
    severity: 'High'
  });
  assert(newObjection && newObjection.outcome === 'unresolved', 'MemoryStore.addObjection creates unresolved objection');

  const resolved = MemoryStore.resolveObjection(newObjection.id, 'Provided BAA agreement and SOC 2 certification');
  assert(resolved && resolved.outcome === 'resolved', 'MemoryStore.resolveObjection updates outcome to resolved');

  const learningCountBefore = MemoryStore.learningState.learningSessions.length;
  MemoryStore.markDealWon(newDeal.id, ['Conducted early stakeholder mapping to identify hidden decision makers']);
  assert(newDeal.status === 'won' && newDeal.winProbability === 100, 'markDealWon updates deal status and winProbability');
  assert(MemoryStore.learningState.learningSessions.length === learningCountBefore + 1, 'markDealWon records learning session');

  // Group 3: Multi-Agent System
  console.log('\n3. MULTI-AGENT INTELLIGENCE SYSTEM');
  const history = MemoryAgent.getDealHistory(newDeal.id);
  assert(history.deal && history.stakeholders.length === 1 && history.objections.length === 1, 'MemoryAgent.getDealHistory retrieves complete context');

  const similar = MemoryAgent.findSimilarDeals(newDeal.id, 3);
  assert(Array.isArray(similar) && similar.length > 0, 'MemoryAgent.findSimilarDeals returns similar deals');

  const smMap = StakeholderAgent.getStakeholderMap(newDeal.id);
  assert(smMap.decisionMakers.length === 1 && smMap.decisionMakers[0].name === 'Dr. Jane Smith', 'StakeholderAgent maps decision makers correctly');

  const cat = ObjectionAgent.categorizeObjection('Your price is too high and our budget is frozen');
  assert(cat === 'Pricing' || cat === 'Budget', `ObjectionAgent categorized objection correctly (${cat})`);

  const points = ObjectionAgent.generateTalkingPoints('Security', 'Healthcare');
  assert(Array.isArray(points) && points.length > 0, 'ObjectionAgent generates talking points');

  const winProb = StrategyAgent.estimateWinProbability(1); // Deal 1 is already won (100) or check active
  assert(typeof winProb === 'number' && winProb >= 0 && winProb <= 100, 'StrategyAgent estimates valid probability (0-100)');

  const actions = StrategyAgent.getNextActions(newDeal.id);
  assert(Array.isArray(actions), 'StrategyAgent returns structured next actions');

  const orgKnowledge = LearningAgent.getOrganizationalKnowledge();
  assert(orgKnowledge.totalLessons > 0 && orgKnowledge.topStrategies.length > 0, 'LearningAgent aggregates organizational knowledge');

  const salesIntent = IntentDetectionAgent.analyzeIntent('Can you give us a discount on seat licensing?');
  assert(salesIntent.isSalesRelated === true && salesIntent.category === 'Pricing', 'IntentDetectionAgent identifies sales intent and category');

  const nonSalesIntent = IntentDetectionAgent.analyzeIntent('What is the weather forecast for tomorrow?');
  assert(nonSalesIntent.isSalesRelated === false, 'IntentDetectionAgent rejects non-sales query');

  const evalGood = EvaluationAgent.evaluateRecommendation({ action: 'offer pilot' }, [{ id: 1 }]);
  assert(evalGood.supported === true, 'EvaluationAgent approves grounded recommendation');

  // Group 4: Gemini AI Reasoning & Fallback
  console.log('\n4. GEMINI AI REASONING & SECURE FALLBACK');
  assert(typeof GeminiAI === 'object', 'GeminiAI object exists');
  GeminiAI.setApiKey('AIzaSyTestKey1234567890');
  assert(GeminiAI.hasApiKey() === true, 'GeminiAI.hasApiKey returns true when key is set');
  assert(GeminiAI.getMaskedApiKey() === 'AIza••••7890', `GeminiAI.getMaskedApiKey masks key (${GeminiAI.getMaskedApiKey()})`);
  GeminiAI.clearApiKey();
  assert(GeminiAI.hasApiKey() === false, 'GeminiAI.clearApiKey successfully clears key');

  const fallbackAnalysis = GeminiAI._getFallbackAnalysis(newDeal.id);
  assert(fallbackAnalysis && fallbackAnalysis.source === 'fallback', 'GeminiAI provides rule-based memory fallback when key is absent');
  assert(typeof fallbackAnalysis.dealAssessment === 'string' && fallbackAnalysis.dealAssessment.length > 20, 'Fallback analysis includes detailed assessment');
  assert(Array.isArray(fallbackAnalysis.nextBestActions) && fallbackAnalysis.nextBestActions.length > 0, 'Fallback analysis includes next actions');

  const ragQuery = await GeminiAI.analyzeRAGQuery('Your solution is too expensive for our current budget.');
  assert(ragQuery && (ragQuery.source === 'rule-based' || ragQuery.status === 'accept' || ragQuery.status === 'warn'), 'GeminiAI RAG query operates reliably');

  // Group 5: Memory Graph D3 Visualization
  console.log('\n5. INTERACTIVE MEMORY GRAPH');
  assert(typeof MemoryGraph === 'object', 'MemoryGraph object exists');
  MemoryGraph.init('app', 'pipeline');
  assert(MemoryGraph.nodesData.length > 0, `MemoryGraph pipeline mode builds nodes (${MemoryGraph.nodesData.length})`);
  assert(MemoryGraph.linksData.length > 0, `MemoryGraph pipeline mode builds links (${MemoryGraph.linksData.length})`);
  
  const pipelineNodeCount = MemoryGraph.nodesData.length;
  MemoryGraph.init('app', 'full');
  assert(MemoryGraph.nodesData.length >= pipelineNodeCount, `MemoryGraph full mode supports full universe (${MemoryGraph.nodesData.length} nodes)`);
  
  // Group 6: App Controller & Views
  console.log('\n6. APP CONTROLLER & NAVIGATION');
  assert(typeof App === 'object', 'App controller exists');
  App.init();
  assert(typeof App.pauseAutoDemo === 'function', 'App.pauseAutoDemo is implemented');
  App.pauseAutoDemo();
  assert(App._autoDemo.paused === true, 'App.pauseAutoDemo toggles paused state to true');
  App.pauseAutoDemo();
  assert(App._autoDemo.paused === false, 'App.pauseAutoDemo toggles paused state to false');

  const testViews = ['dashboard', 'deals', 'memory-replay', 'copilot', 'knowledge', 'memory-graph', 'learning', 'judge-demo'];
  const viewContainer = document.getElementById('view-container');
  for (const v of testViews) {
    App.navigateTo(v);
    assert(App.currentView === v, `App successfully navigated to ${v}`);
  }

  assert(typeof App.toggleGraphDensity === 'function', 'App.toggleGraphDensity is implemented');
  assert(typeof App.showApiKeyModal === 'function', 'App.showApiKeyModal is implemented');
  assert(typeof App.confirmResetMemory === 'function', 'App.confirmResetMemory is implemented');

  console.log('\n======================================================');
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    console.error('Failed tests:', failures);
    process.exit(1);
  } else {
    console.log('All automated verification checks PASSED successfully!');
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
