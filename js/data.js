// ═══════════════════════════════════════════════════════════════
// Deal Intelligence Agent — Mock Data Layer
// ═══════════════════════════════════════════════════════════════

const INDUSTRIES = [
  'Healthcare', 'Financial Services', 'Technology', 'Manufacturing',
  'Retail', 'Education', 'Government', 'Energy', 'Logistics', 'Media'
];

const STAGES = ['Discovery', 'Qualification', 'Proposal', 'Negotiation', 'Closed'];
const STATUSES = ['active', 'won', 'lost'];
const OBJECTION_CATEGORIES = [
  'Pricing', 'Security', 'Compliance', 'Integration',
  'Implementation', 'Competition', 'ROI', 'Budget'
];

const SENTIMENT_LEVELS = ['Very Positive', 'Positive', 'Neutral', 'Concerned', 'Negative'];
const INFLUENCE_LEVELS = ['Decision Maker', 'Strong Influencer', 'Influencer', 'Gatekeeper', 'End User'];

// ── Company Names ─────────────────────────────────────────────
const COMPANIES = [
  { name: 'MedCore Systems', industry: 'Healthcare' },
  { name: 'Pinnacle Health Group', industry: 'Healthcare' },
  { name: 'VitalCare Networks', industry: 'Healthcare' },
  { name: 'Meridian Financial', industry: 'Financial Services' },
  { name: 'Atlas Capital Partners', industry: 'Financial Services' },
  { name: 'Vertex Banking Corp', industry: 'Financial Services' },
  { name: 'NovaTech Solutions', industry: 'Technology' },
  { name: 'Cipher Digital', industry: 'Technology' },
  { name: 'Quantum Dynamics', industry: 'Technology' },
  { name: 'Steelbridge Manufacturing', industry: 'Manufacturing' },
  { name: 'Apex Industrial', industry: 'Manufacturing' },
  { name: 'Forge Systems Inc', industry: 'Manufacturing' },
  { name: 'BrightMart Retail', industry: 'Retail' },
  { name: 'Urban Goods Co', industry: 'Retail' },
  { name: 'EduVerse Academy', industry: 'Education' },
  { name: 'LearnPath Global', industry: 'Education' },
  { name: 'Metro Gov Services', industry: 'Government' },
  { name: 'Federal Data Bureau', industry: 'Government' },
  { name: 'GreenGrid Energy', industry: 'Energy' },
  { name: 'SolarFlux Corp', industry: 'Energy' },
  { name: 'SwiftRoute Logistics', industry: 'Logistics' },
  { name: 'GlobalFreight Systems', industry: 'Logistics' },
  { name: 'StreamVision Media', industry: 'Media' },
  { name: 'Nexus Broadcasting', industry: 'Media' },
  { name: 'HealthBridge Analytics', industry: 'Healthcare' }
];

// ── Stakeholder Name Pools ────────────────────────────────────
const FIRST_NAMES = [
  'Sarah', 'James', 'Maria', 'David', 'Emily', 'Michael', 'Jennifer', 'Robert',
  'Lisa', 'Thomas', 'Amanda', 'Daniel', 'Rachel', 'Christopher', 'Nicole',
  'Andrew', 'Stephanie', 'Kevin', 'Michelle', 'Brian', 'Laura', 'Jason',
  'Katherine', 'Ryan', 'Angela', 'William', 'Diane', 'Mark', 'Patricia', 'Steven',
  'Rebecca', 'Timothy', 'Karen', 'Jeffrey', 'Samantha', 'Gregory', 'Heather',
  'Eric', 'Christine', 'Jonathan', 'Victoria', 'Matthew', 'Olivia', 'Tyler',
  'Megan', 'Benjamin', 'Ashley', 'Nathan', 'Julia', 'Scott'
];

const LAST_NAMES = [
  'Chen', 'Rodriguez', 'Patel', 'Williams', 'Nakamura', 'Thompson', 'Garcia',
  'Kowalski', 'O\'Brien', 'Singh', 'Anderson', 'Müller', 'Kim', 'Martinez',
  'Jackson', 'Lee', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen',
  'Hill', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell',
  'Mitchell', 'Carter', 'Roberts', 'Phillips', 'Evans', 'Turner', 'Diaz',
  'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Reed'
];

const ROLES = [
  'CTO', 'VP of Engineering', 'CISO', 'CFO', 'CEO', 'VP of Operations',
  'Director of IT', 'Head of Procurement', 'Security Architect', 'Product Manager',
  'IT Manager', 'Chief Data Officer', 'VP of Sales', 'Head of Compliance',
  'Director of Digital Transformation', 'COO'
];

// ── Concern Templates ─────────────────────────────────────────
const CONCERN_TEMPLATES = {
  'Healthcare': ['HIPAA compliance', 'patient data security', 'EHR integration', 'uptime requirements', 'audit trails'],
  'Financial Services': ['SOC 2 compliance', 'data encryption', 'regulatory reporting', 'transaction speed', 'PCI DSS'],
  'Technology': ['API scalability', 'tech stack compatibility', 'developer experience', 'microservices support', 'CI/CD integration'],
  'Manufacturing': ['OT/IT convergence', 'real-time monitoring', 'legacy system integration', 'downtime costs', 'supply chain visibility'],
  'Retail': ['POS integration', 'omnichannel support', 'inventory sync', 'seasonal scaling', 'customer data privacy'],
  'Education': ['FERPA compliance', 'LMS integration', 'accessibility standards', 'budget constraints', 'user adoption'],
  'Government': ['FedRAMP certification', 'clearance requirements', 'procurement process', 'data sovereignty', 'section 508'],
  'Energy': ['SCADA integration', 'grid reliability', 'environmental compliance', 'remote site access', 'safety protocols'],
  'Logistics': ['GPS tracking integration', 'real-time updates', 'fleet management', 'customs compliance', 'route optimization'],
  'Media': ['content delivery speed', 'DRM support', 'streaming quality', 'content rights management', 'audience analytics']
};

// ── Objection Templates ───────────────────────────────────────
const OBJECTION_TEMPLATES = {
  'Pricing': [
    { desc: 'Solution pricing exceeds current budget allocation', resolution: 'Offered phased implementation with quarterly payments', successRate: 72 },
    { desc: 'Competitors are offering 30% lower pricing', resolution: 'Demonstrated superior ROI with case studies showing 3x returns', successRate: 65 },
    { desc: 'License cost per seat is too high for large teams', resolution: 'Created volume discount tier and enterprise bundle', successRate: 78 },
    { desc: 'Total cost of ownership concerns over 5-year period', resolution: 'Provided TCO analysis showing lower operational costs vs alternatives', successRate: 81 }
  ],
  'Security': [
    { desc: 'Data must remain within specific geographic boundaries', resolution: 'Deployed regional data centers with geo-fencing', successRate: 85 },
    { desc: 'Encryption standards do not meet internal policy', resolution: 'Upgraded to AES-256 encryption with customer-managed keys', successRate: 91 },
    { desc: 'Concerns about multi-tenant data isolation', resolution: 'Offered dedicated instance deployment option', successRate: 77 },
    { desc: 'Need third-party security audit before proceeding', resolution: 'Provided existing SOC 2 Type II report and facilitated audit', successRate: 88 }
  ],
  'Compliance': [
    { desc: 'Must meet industry-specific regulatory requirements', resolution: 'Provided compliance documentation and regulatory mapping', successRate: 82 },
    { desc: 'Audit trail capabilities are insufficient', resolution: 'Enhanced logging with immutable audit trail feature', successRate: 86 },
    { desc: 'Data retention policies do not align', resolution: 'Implemented configurable retention policies per regulation', successRate: 79 }
  ],
  'Integration': [
    { desc: 'Need seamless integration with existing ERP system', resolution: 'Built custom API connector with dedicated integration team', successRate: 74 },
    { desc: 'Legacy system compatibility concerns', resolution: 'Developed middleware adapter for legacy protocol support', successRate: 68 },
    { desc: 'API rate limits too restrictive for workload', resolution: 'Provided dedicated API gateway with higher throughput', successRate: 83 }
  ],
  'Implementation': [
    { desc: 'Timeline too long for go-live requirements', resolution: 'Created accelerated onboarding program with parallel workstreams', successRate: 71 },
    { desc: 'Insufficient training resources for team adoption', resolution: 'Assigned dedicated CSM and created custom training curriculum', successRate: 76 },
    { desc: 'Migration complexity from current vendor', resolution: 'Provided automated migration tool and white-glove support', successRate: 69 }
  ],
  'Competition': [
    { desc: 'Competitor offers features we currently lack', resolution: 'Shared product roadmap and fast-tracked feature development', successRate: 62 },
    { desc: 'Existing vendor relationship is deeply embedded', resolution: 'Proposed parallel pilot to demonstrate superior value', successRate: 58 },
    { desc: 'Industry analyst ranks competitor higher', resolution: 'Provided customer references and real-world performance data', successRate: 66 }
  ],
  'ROI': [
    { desc: 'Unclear return on investment within first year', resolution: 'Created custom ROI model with conservative projections', successRate: 73 },
    { desc: 'Difficult to quantify soft benefits', resolution: 'Provided framework for measuring productivity and efficiency gains', successRate: 67 },
    { desc: 'Previous technology investments have not delivered ROI', resolution: 'Offered performance-based pricing with SLA guarantees', successRate: 75 }
  ],
  'Budget': [
    { desc: 'Budget freeze until next fiscal year', resolution: 'Structured deal to start billing in next fiscal year', successRate: 64 },
    { desc: 'Capital expenditure approval required from board', resolution: 'Provided OpEx model through subscription licensing', successRate: 72 },
    { desc: 'Budget already allocated to other initiatives', resolution: 'Demonstrated cost savings that fund the investment', successRate: 61 }
  ]
};

// ── Interaction Templates ─────────────────────────────────────
const INTERACTION_TYPES = ['Discovery Call', 'Demo', 'Technical Review', 'Negotiation', 'Follow-Up', 'Executive Briefing', 'Security Workshop', 'Proposal Review', 'POC Kickoff', 'Contract Review'];

const INTERACTION_CONTENT_TEMPLATES = [
  'Discussed {topic} with {stakeholder}. Key concern: {concern}. Next steps: {action}.',
  'Presented product demo focusing on {topic}. {stakeholder} was {sentiment} about the capabilities.',
  'Technical deep dive on {topic}. {stakeholder} raised questions about {concern}.',
  'Follow-up meeting to address {concern}. Provided documentation and case studies.',
  'Executive briefing with {stakeholder}. Covered ROI projections and implementation timeline.',
  'Security review session addressing {concern}. {stakeholder} requested additional documentation.',
  'Negotiation round focusing on pricing and contract terms. {stakeholder} pushed for {concern}.',
  'POC planning session with {stakeholder}. Defined success criteria and timeline.',
  'Proposal walkthrough with {stakeholder}. Addressed {concern} with detailed response.',
  'Contract review with legal team. {stakeholder} flagged {concern} for revision.'
];

// ── Knowledge Base Templates ──────────────────────────────────
const LESSONS_LEARNED = [
  { lesson: 'Early security workshops increase win rate by 34% in regulated industries', category: 'Security', industries: ['Healthcare', 'Financial Services', 'Government'], impact: 'high' },
  { lesson: 'Offering phased implementation reduces deal cycle by 3 weeks on average', category: 'Implementation', industries: ['Manufacturing', 'Retail', 'Logistics'], impact: 'high' },
  { lesson: 'Executive alignment within first 2 meetings correlates with 78% win rate', category: 'Strategy', industries: ['Technology', 'Financial Services', 'Healthcare'], impact: 'high' },
  { lesson: 'Early discounting (before proposal stage) reduces close rate by 22%', category: 'Pricing', industries: ['Technology', 'Media', 'Retail'], impact: 'high' },
  { lesson: 'Technical validation with end users improves stakeholder confidence significantly', category: 'Implementation', industries: ['Technology', 'Manufacturing', 'Energy'], impact: 'medium' },
  { lesson: 'Custom ROI models increase conversion from proposal to negotiation by 41%', category: 'ROI', industries: ['Financial Services', 'Healthcare', 'Government'], impact: 'high' },
  { lesson: 'Engaging CISO early in healthcare deals prevents late-stage security objections', category: 'Security', industries: ['Healthcare'], impact: 'high' },
  { lesson: 'Competitor displacement deals require minimum 45-day parallel pilot', category: 'Competition', industries: ['Technology', 'Media'], impact: 'medium' },
  { lesson: 'Government deals require 2x pipeline coverage due to procurement delays', category: 'Strategy', industries: ['Government'], impact: 'medium' },
  { lesson: 'Multi-stakeholder demos with 3+ attendees have 2.4x higher win rate', category: 'Strategy', industries: ['Healthcare', 'Financial Services', 'Manufacturing'], impact: 'high' },
  { lesson: 'Budget objections addressed with OpEx model convert 68% of the time', category: 'Budget', industries: ['Education', 'Government', 'Retail'], impact: 'medium' },
  { lesson: 'Integration concerns resolved with dedicated team close 3 weeks faster', category: 'Integration', industries: ['Manufacturing', 'Logistics', 'Retail'], impact: 'medium' },
  { lesson: 'Compliance documentation provided upfront eliminates 89% of late objections', category: 'Compliance', industries: ['Healthcare', 'Financial Services', 'Government'], impact: 'high' },
  { lesson: 'Reference calls from same industry increase win probability by 28%', category: 'Strategy', industries: ['Healthcare', 'Financial Services', 'Education'], impact: 'medium' },
  { lesson: 'Deals with champion identification in discovery have 3.1x close rate', category: 'Strategy', industries: ['Technology', 'Healthcare', 'Financial Services'], impact: 'high' }
];

const SUCCESSFUL_STRATEGIES = [
  'Conducted early stakeholder mapping to identify hidden decision makers',
  'Provided proof-of-concept within 2 weeks of initial demo',
  'Created industry-specific case study for the prospect',
  'Engaged executive sponsor before entering negotiation phase',
  'Offered performance-based pricing to mitigate perceived risk',
  'Facilitated peer reference call with similar company',
  'Deployed security workshop addressing specific compliance needs',
  'Built custom integration demo matching prospect\'s tech stack',
  'Created mutual action plan with defined milestones',
  'Leveraged competitive intelligence to preempt objections'
];

const FAILED_STRATEGIES = [
  'Discounted too early without understanding full requirements',
  'Failed to engage technical stakeholders before proposal',
  'Underestimated compliance requirements leading to deal delay',
  'Did not identify competing vendor until late in cycle',
  'Relied solely on champion without executive sponsorship',
  'Proposed scope too broad leading to budget concerns',
  'Missed follow-up cadence causing momentum loss',
  'Overpromised on integration timeline',
  'Did not address security concerns proactively',
  'Failed to customize demo for specific industry needs'
];

// ═══════════════════════════════════════════════════════════════
// DATA GENERATION
// ═══════════════════════════════════════════════════════════════

function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateData() {
  const rng = seededRandom(42);
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const pickN = (arr, n) => {
    const shuffled = [...arr].sort(() => rng() - 0.5);
    return shuffled.slice(0, n);
  };
  const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;

  let stakeholderIdCounter = 1;
  let interactionIdCounter = 1;
  let objectionIdCounter = 1;

  // ── Generate 500 Deals ────────────────────────────────────────
  const deals = Array.from({ length: 500 }).map((_, i) => {
    const baseCompany = COMPANIES[i % COMPANIES.length];
    const companyName = i < COMPANIES.length ? baseCompany.name : `${baseCompany.name} ${pick(['EMEA', 'APAC', 'Americas', 'Global', 'Nordics', 'LatAm', 'Japan'])}`;
    const id = i + 1;
    const value = randInt(3, 95) * 10000;
    let status, outcome, stage;

    if (i < 200) {
      status = 'won'; outcome = 'won'; stage = 'Closed';
    } else if (i < 400) {
      status = 'lost'; outcome = 'lost'; stage = 'Closed';
    } else {
      status = 'active'; outcome = null;
      stage = STAGES[randInt(0, 3)];
    }

    const daysAgo = randInt(10, 365);
    const created = new Date(Date.now() - daysAgo * 86400000);
    const closeDays = randInt(30, 120);
    const closeDate = status !== 'active' ? new Date(created.getTime() + closeDays * 86400000) : null;
    const winProbability = status === 'won' ? 100 : status === 'lost' ? 0 : randInt(25, 85);
    const dealCycleDays = status !== 'active' ? closeDays : Math.floor((Date.now() - created.getTime()) / 86400000);

    return {
      id,
      company: companyName,
      industry: baseCompany.industry,
      value,
      stage,
      status,
      outcome,
      winProbability,
      dealCycleDays,
      createdDate: created.toISOString().split('T')[0],
      closeDate: closeDate ? closeDate.toISOString().split('T')[0] : null,
      description: `Enterprise deployment of platform solution for ${companyName}`,
      keyFactors: status === 'won'
        ? pickN(SUCCESSFUL_STRATEGIES, randInt(2, 3))
        : status === 'lost'
          ? pickN(FAILED_STRATEGIES, randInt(2, 3))
          : [],
      tags: pickN(['enterprise', 'mid-market', 'strategic', 'competitive', 'expansion', 'greenfield', 'renewal'], randInt(2, 3))
    };
  });

  // ── Generate Stakeholders ────────────────────────────────────
  const allStakeholders = [];
  const usedNames = new Set();

  deals.forEach(deal => {
    const count = randInt(2, 5);
    const stakeholders = [];

    for (let s = 0; s < count; s++) {
      let firstName, lastName, fullName;
      do {
        firstName = pick(FIRST_NAMES);
        lastName = pick(LAST_NAMES);
        fullName = `${firstName} ${lastName}`;
      } while (usedNames.has(fullName));
      usedNames.add(fullName);

      const role = ROLES[s % ROLES.length];
      const industryConcerns = CONCERN_TEMPLATES[deal.industry] || CONCERN_TEMPLATES['Technology'];
      const concerns = pickN(industryConcerns, randInt(1, 3));
      const sentiment = pick(SENTIMENT_LEVELS);
      const influence = INFLUENCE_LEVELS[Math.min(s, INFLUENCE_LEVELS.length - 1)];

      const stakeholder = {
        id: stakeholderIdCounter++,
        dealId: deal.id,
        name: fullName,
        role,
        influenceLevel: influence,
        concerns,
        sentiment,
        engagementScore: randInt(20, 100),
        lastContact: new Date(Date.now() - randInt(1, 60) * 86400000).toISOString().split('T')[0],
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace("'", "")}@${deal.company.toLowerCase().replace(/\s+/g, '')}.com`
      };
      stakeholders.push(stakeholder);
      allStakeholders.push(stakeholder);
    }
  });

  // ── Generate Interactions ────────────────────────────────────
  const allInteractions = [];
  deals.forEach(deal => {
    const count = randInt(3, 8);
    const dealStakeholders = allStakeholders.filter(s => s.dealId === deal.id);

    for (let i = 0; i < count; i++) {
      const type = pick(INTERACTION_TYPES);
      const stakeholder = pick(dealStakeholders);
      const industryConcerns = CONCERN_TEMPLATES[deal.industry] || CONCERN_TEMPLATES['Technology'];
      const concern = pick(industryConcerns);
      const topics = ['platform capabilities', 'security architecture', 'pricing model', 'implementation plan', 'integration requirements', 'compliance framework', 'scalability', 'support model'];
      const topic = pick(topics);
      const actions = ['schedule follow-up', 'send documentation', 'arrange technical demo', 'prepare proposal', 'set up POC', 'provide references'];
      const action = pick(actions);

      let content = pick(INTERACTION_CONTENT_TEMPLATES);
      content = content.replace('{topic}', topic)
        .replace('{stakeholder}', stakeholder.name)
        .replace('{concern}', concern)
        .replace('{sentiment}', stakeholder.sentiment.toLowerCase())
        .replace('{action}', action);

      const daysFromStart = randInt(0, deal.dealCycleDays);
      const timestamp = new Date(new Date(deal.createdDate).getTime() + daysFromStart * 86400000);

      allInteractions.push({
        id: interactionIdCounter++,
        dealId: deal.id,
        type,
        content,
        stakeholderName: stakeholder.name,
        timestamp: timestamp.toISOString(),
        sentiment: pick(['positive', 'neutral', 'negative']),
        keyTopics: pickN([topic, concern, ...pickN(topics, 1)], randInt(1, 3))
      });
    }
  });

  // Sort interactions by timestamp
  allInteractions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // ── Generate Objections ──────────────────────────────────────
  const allObjections = [];
  deals.forEach(deal => {
    const count = randInt(1, 4);
    const categories = pickN(OBJECTION_CATEGORIES, count);

    categories.forEach(category => {
      const templates = OBJECTION_TEMPLATES[category];
      const template = pick(templates);
      const wasResolved = deal.status === 'won' ? rng() > 0.15 : rng() > 0.55;

      allObjections.push({
        id: objectionIdCounter++,
        dealId: deal.id,
        category,
        description: template.desc,
        resolution: wasResolved ? template.resolution : 'Unresolved — contributed to deal stall',
        outcome: wasResolved ? 'resolved' : 'unresolved',
        raisedDate: new Date(new Date(deal.createdDate).getTime() + randInt(5, 45) * 86400000).toISOString().split('T')[0],
        resolvedDate: wasResolved ? new Date(new Date(deal.createdDate).getTime() + randInt(50, 90) * 86400000).toISOString().split('T')[0] : null,
        historicalSuccessRate: template.successRate,
        severity: pick(['Critical', 'High', 'Medium', 'Low'])
      });
    });
  });

  // ── Knowledge Base ───────────────────────────────────────────
  const knowledgeBase = {
    lessonsLearned: LESSONS_LEARNED,
    successfulStrategies: SUCCESSFUL_STRATEGIES.map((s, i) => ({
      id: i + 1,
      strategy: s,
      timesUsed: randInt(3, 18),
      successRate: randInt(60, 95),
      applicableIndustries: pickN(INDUSTRIES, randInt(2, 5))
    })),
    failedStrategies: FAILED_STRATEGIES.map((s, i) => ({
      id: i + 1,
      strategy: s,
      occurrences: randInt(2, 12),
      industries: pickN(INDUSTRIES, randInt(2, 4))
    })),
    industryInsights: INDUSTRIES.map(ind => ({
      industry: ind,
      avgDealCycle: randInt(45, 120) + ' days',
      avgDealSize: '$' + (randInt(15, 85) * 10000).toLocaleString(),
      topObjections: pickN(OBJECTION_CATEGORIES, 3),
      winRate: randInt(35, 70) + '%',
      keySuccessFactors: pickN(SUCCESSFUL_STRATEGIES, 2)
    }))
  };

  // ── Memory Stats ─────────────────────────────────────────────
  const memoryStats = {
    totalDeals: deals.length,
    totalInteractions: allInteractions.length,
    totalStakeholders: allStakeholders.length,
    totalObjections: allObjections.length,
    totalLessons: LESSONS_LEARNED.length,
    memoryNodes: deals.length * 12 + allInteractions.length + allStakeholders.length * 3,
    memoryConnections: deals.length * 8 + allInteractions.length * 2,
    lastUpdated: new Date().toISOString()
  };

  return {
    deals,
    stakeholders: allStakeholders,
    interactions: allInteractions,
    objections: allObjections,
    knowledgeBase,
    memoryStats
  };
}

// Generate and export
const DATA = generateData();
if (typeof window !== 'undefined') {
  window.DATA = DATA;
  window.INDUSTRIES = INDUSTRIES;
  window.STAGES = STAGES;
  window.STATUSES = STATUSES;
  window.OBJECTION_CATEGORIES = OBJECTION_CATEGORIES;
  window.SUCCESSFUL_STRATEGIES = SUCCESSFUL_STRATEGIES;
  window.FAILED_STRATEGIES = FAILED_STRATEGIES;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DATA, generateData, INDUSTRIES, STAGES, STATUSES, OBJECTION_CATEGORIES, SUCCESSFUL_STRATEGIES, FAILED_STRATEGIES };
}
