const readPositiveInteger = (name: string, fallback: number): number => {
  const parsed = Number.parseInt(process.env[name] || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const readPositiveNumber = (name: string, fallback: number): number => {
  const parsed = Number.parseFloat(process.env[name] || '');
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const soakMode = process.env.UI_STRESS_MODE === 'soak';
const requireMedia = process.env.STRESS_REQUIRE_MEDIA === 'true' || soakMode;

export const UI_STRESS_CONFIG = {
  historyMessageCount: readPositiveInteger('STRESS_HISTORY_MESSAGE_COUNT', soakMode ? 500 : 120),
  historyMaxPageLoads: readPositiveInteger('STRESS_HISTORY_MAX_PAGE_LOADS', soakMode ? 30 : 12),
  minHistoryPageLoads: readPositiveInteger('STRESS_MIN_HISTORY_PAGE_LOADS', 1),
  historySendIntervalMs: readPositiveInteger('STRESS_HISTORY_SEND_INTERVAL_MS', 200),
  historyBatchSize: readPositiveInteger('STRESS_HISTORY_BATCH_SIZE', 20),
  historyBatchPauseMs: readPositiveInteger('STRESS_HISTORY_BATCH_PAUSE_MS', 2000),
  historyRetryBackoffMs: readPositiveInteger('STRESS_HISTORY_RETRY_BACKOFF_MS', 2000),
  burstMessageCount: readPositiveInteger('STRESS_BURST_MESSAGE_COUNT', soakMode ? 100 : 12),
  switchIterations: readPositiveInteger('STRESS_SWITCH_ITERATIONS', soakMode ? 200 : 20),
  enduranceIterations: readPositiveInteger('STRESS_ENDURANCE_ITERATIONS', soakMode ? 300 : 15),
  renderP95Ms: readPositiveNumber('STRESS_RENDER_P95_MS', 2500),
  reconnectTimeoutMs: readPositiveInteger('STRESS_RECONNECT_TIMEOUT_MS', 15000),
  mediaProcessingTimeoutMs: readPositiveInteger(
    'STRESS_MEDIA_PROCESSING_TIMEOUT_MS',
    soakMode ? 60000 : 15000
  ),
  maxAnchorShiftPx: readPositiveNumber('STRESS_MAX_ANCHOR_SHIFT_PX', 12),
  maxHeapGrowthPercent: readPositiveNumber('STRESS_MAX_HEAP_GROWTH_PERCENT', 35),
  maxNodeGrowthPercent: readPositiveNumber('STRESS_MAX_NODE_GROWTH_PERCENT', 50),
  maxLatencyDegradationPercent: readPositiveNumber('STRESS_MAX_LATENCY_DEGRADATION_PERCENT', 40),
  interactionP95Ms: readPositiveNumber('STRESS_INTERACTION_P95_MS', 10000),
  requireMedia,
};

export type UiStressConfig = typeof UI_STRESS_CONFIG;
