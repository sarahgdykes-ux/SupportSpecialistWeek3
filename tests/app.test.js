const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function createElement(id) {
  const classes = new Set();

  return {
    id,
    classList: {
      add(...names) {
        names.forEach((name) => classes.add(name));
      },
      remove(...names) {
        names.forEach((name) => classes.delete(name));
      },
      toggle(name, force) {
        if (force === undefined) {
          if (classes.has(name)) {
            classes.delete(name);
            return false;
          }

          classes.add(name);
          return true;
        }

        if (force) {
          classes.add(name);
          return true;
        }

        classes.delete(name);
        return false;
      },
      contains(name) {
        return classes.has(name);
      },
    },
    innerHTML: '',
    textContent: '',
    value: '',
    addEventListener() {},
    dispatchEvent() {},
  };
}

function createSandbox() {
  const registry = new Map();
  const getElement = (id) => {
    if (!registry.has(id)) {
      registry.set(id, createElement(id));
    }

    return registry.get(id);
  };

  const document = {
    getElementById(id) {
      return getElement(id);
    },
    addEventListener() {},
  };

  const context = {
    document,
    console,
    fetch: async () => ({
      ok: true,
      json: async () => ({}),
      text: async () => '',
    }),
    setTimeout,
    clearTimeout,
  };

  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8'), context);

  return { context, ui: vm.runInContext('ui', context) };
}

test('results stay visible after loading completes', () => {
  const { context, ui } = createSandbox();

  vm.runInContext('setLoading(true)', context);
  vm.runInContext('renderResults({ issueType: "Bug Report", priority: "High", suggestedTeam: "Engineering", explanation: "A matching bug report" })', context);
  vm.runInContext('setLoading(false)', context);

  assert.equal(ui.resultsCard.classList.contains('hidden'), false);
  assert.equal(ui.placeholder.classList.contains('hidden'), true);
});
