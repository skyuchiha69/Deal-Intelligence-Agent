const fs = require('fs');
const vm = require('vm');

global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

global.window = {
  localStorage: global.localStorage,
  addEventListener: () => {},
  requestAnimationFrame: (cb) => setTimeout(cb, 0),
  setTimeout: (cb) => cb(),
  setInterval: () => 1,
  clearInterval: () => {}
};
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);

function createEl() {
  return {
    innerHTML: '',
    value: '',
    style: {},
    classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} },
    appendChild: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {}
  };
}

global.document = {
  readyState: 'complete',
  addEventListener: () => {},
  getElementById: (id) => createEl(),
  createElement: () => createEl(),
  querySelectorAll: () => [],
  querySelector: () => null,
  body: createEl()
};

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

try {
  vm.runInThisContext(fs.readFileSync('js/data.js', 'utf8'));
  console.log("Loaded data.js");
  vm.runInThisContext(fs.readFileSync('js/memory.js', 'utf8'));
  console.log("Loaded memory.js");
  vm.runInThisContext(fs.readFileSync('js/agents.js', 'utf8'));
  console.log("Loaded agents.js");
  vm.runInThisContext(fs.readFileSync('js/ai.js', 'utf8'));
  console.log("Loaded ai.js");
  vm.runInThisContext(fs.readFileSync('js/graph.js', 'utf8'));
  console.log("Loaded graph.js");
  vm.runInThisContext(fs.readFileSync('js/app.js', 'utf8'));
  console.log("Loaded app.js");
  
  App.init();
  console.log("App initialized successfully.");
  App.renderShell();
  console.log("App.renderShell completed");
  App.navigateTo('dashboard');
  console.log("App.navigateTo('dashboard') completed");
  App.navigateTo('judge-demo');
  console.log("App.navigateTo('judge-demo') completed");
  App.navigateTo('memory-graph');
  console.log("App.navigateTo('memory-graph') completed");
  App.navigateTo('copilot');
  console.log("App.navigateTo('copilot') completed");
  console.log("\nQuick smoke test completed with 0 errors!");
  process.exit(0);
} catch (err) {
  console.error("Runtime error caught:", err);
  process.exit(1);
}
