const SMOKE_MODE = new URLSearchParams(window.location.search).has('smoke');
const subscribers = [];
const pendingReasons = new Set();
let observedList = null;
let observer = null;
let updateFrame = 0;
let updateSequence = 0;

export function subscribeQualityListUpdates(callback, options = {}) {
  if (typeof callback !== 'function') {
    throw new TypeError('qualityListUpdates: callback должен быть функцией');
  }

  const record = {
    callback,
    priority: Number(options.priority) || 100,
    label: String(options.label || callback.name || 'anonymous')
  };

  subscribers.push(record);
  subscribers.sort((left, right) => left.priority - right.priority || left.label.localeCompare(right.label, 'en'));
  exposeSmokeState();
  ensureQualityListObserver();
  scheduleQualityListUpdate('subscribe');

  return () => {
    const index = subscribers.indexOf(record);
    if (index >= 0) subscribers.splice(index, 1);
    exposeSmokeState();
  };
}

export function requestQualityListUpdate(reason = 'manual') {
  ensureQualityListObserver();
  scheduleQualityListUpdate(reason);
}

function ensureQualityListObserver() {
  const list = document.getElementById('qualityList');
  if (!list || (observer && observedList === list)) return;

  observer?.disconnect();
  observedList = list;
  observer = new MutationObserver((records) => {
    if (SMOKE_MODE) {
      window.__ETAGI_QUALITY_LIST_OBSERVER_CALLBACKS__ = Number(window.__ETAGI_QUALITY_LIST_OBSERVER_CALLBACKS__ || 0) + 1;
    }
    if (records.some(record => isRelevantQualityMutation(record, list))) {
      scheduleQualityListUpdate('mutation');
    }
  });
  observer.observe(list, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-quality-suppressed']
  });

  if (SMOKE_MODE) {
    window.__ETAGI_QUALITY_LIST_OBSERVER_INSTANCES__ = Number(window.__ETAGI_QUALITY_LIST_OBSERVER_INSTANCES__ || 0) + 1;
  }
}

function isRelevantQualityMutation(record, list) {
  if (record.type === 'attributes') {
    return record.target instanceof Element && record.target.matches('.qitem');
  }

  if (record.type !== 'childList') return false;
  const changedNodes = [...record.addedNodes, ...record.removedNodes];
  if (!changedNodes.length) return false;

  if (record.target === list) {
    return changedNodes.some(containsQualityItem);
  }

  return changedNodes.some(node => (
    node instanceof Element
    && (node.matches('.qitem') || Boolean(node.querySelector('.qitem')))
  ));
}

function containsQualityItem(node) {
  return node instanceof Element
    && (node.matches('.qitem') || Boolean(node.querySelector('.qitem')));
}

function scheduleQualityListUpdate(reason) {
  pendingReasons.add(String(reason || 'update'));
  if (updateFrame) return;

  updateFrame = window.requestAnimationFrame(() => {
    updateFrame = 0;
    flushQualityListUpdates();
  });
}

function flushQualityListUpdates() {
  const list = observedList || document.getElementById('qualityList');
  if (!list) return;

  updateSequence += 1;
  const reasons = [...pendingReasons];
  pendingReasons.clear();

  if (SMOKE_MODE) {
    window.__ETAGI_QUALITY_LIST_UPDATE_FLUSHES__ = Number(window.__ETAGI_QUALITY_LIST_UPDATE_FLUSHES__ || 0) + 1;
    window.__ETAGI_QUALITY_LIST_UPDATE_SEQUENCE__ = updateSequence;
  }

  const context = { list, reasons, sequence: updateSequence };
  subscribers.slice().forEach((record) => {
    try {
      record.callback(context);
    } catch (error) {
      window.setTimeout(() => { throw error; }, 0);
    }
  });
}

function exposeSmokeState() {
  if (!SMOKE_MODE) return;
  window.__ETAGI_QUALITY_LIST_SUBSCRIBERS__ = subscribers.map(record => ({
    label: record.label,
    priority: record.priority
  }));
}
