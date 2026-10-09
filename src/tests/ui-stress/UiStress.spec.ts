import { ClanFactory } from '@/data/factories/ClanFactory';
import MessageSelector from '@/data/selectors/MessageSelector';
import { test, expect } from '@/fixtures/dual.fixture';
import { MessagePage } from '@/pages/MessagePage';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import { UI_STRESS_CONFIG } from '@/utils/uiStress/stressConfig';
import { UiStressProbe } from '@/utils/uiStress/uiStressProbe';
import {
  prepareUiStressEnvironment,
  UI_STRESS_USERNAME_B,
  type UiStressEnvironment,
} from '@/utils/uiStress/uiStressSetup';

const suiteTimeoutMs = process.env.UI_STRESS_MODE === 'soak' ? 30 * 60 * 1000 : 12 * 60 * 1000;

const markerList = (prefix: string, runId: string, count: number): string[] =>
  Array.from({ length: count }, (_, index) => `[${prefix}-${runId}-${index}]`);

const STRESS_IMAGE_PNG = Buffer.from(
  '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',
  'base64'
);

const annotateStressTest = async (
  objective: string,
  steps: string[],
  expectedResult: string
): Promise<void> => {
  await AllureReporter.addDescription(`
    **Test Objective:** ${objective}

    **Test Steps:**
    ${steps.map((step, index) => `${index + 1}. ${step}`).join('\n    ')}

    **Expected Result:** ${expectedResult}
  `);
  await AllureReporter.addLabels({
    parentSuite: 'UI Stress',
    suite: 'Chat UI Stress',
    owner: 'Mezon QA Team',
    tag: ['ui-stress', 'chat', process.env.UI_STRESS_MODE === 'soak' ? 'soak' : 'smoke'],
  });
  await AllureReporter.addTestParameters({
    testType: 'UI stress',
    userType: 'Authenticated user',
    severity: 'critical',
  });
};

test.describe('Chat UI stress and resilience', () => {
  test.setTimeout(suiteTimeoutMs);

  let environment: UiStressEnvironment | undefined;
  let probes: UiStressProbe[] = [];
  let metricAttachments: Array<{ name: string; value: () => unknown }> = [];

  test.afterEach(async ({ dual }, testInfo) => {
    try {
      for (const attachment of metricAttachments) {
        await UiStressProbe.attachJson(testInfo, attachment.name, attachment.value());
      }
    } finally {
      metricAttachments = [];

      for (const probe of probes) {
        await probe.dispose();
      }
      probes = [];

      if (environment?.clanFactory.getClanName()) {
        try {
          await environment.clanFactory.cleanupClan(dual.pageA);
        } catch (error) {
          console.warn('UI stress cleanup could not delete the current clan:', error);
        }
      }
      environment = undefined;

      await Promise.allSettled([
        AuthHelper.logout(dual.pageA, false),
        AuthHelper.logout(dual.pageB, false),
      ]);
    }
  });

  const registerMetrics = (name: string, value: () => unknown): void => {
    metricAttachments.push({ name, value });
  };

  const setup = async (dual: Parameters<typeof prepareUiStressEnvironment>[0]) => {
    const clanFactory = new ClanFactory();
    environment = await prepareUiStressEnvironment(dual, clanFactory);
    return environment;
  };

  test('Large history keeps scroll position and supports jumping to an old message', async ({
    dual,
  }) => {
    await annotateStressTest(
      'Exercise continuous history pagination and pinned-message navigation.',
      [
        'Create a long channel history from a second user.',
        'Load older pages repeatedly and measure the visible anchor displacement.',
        'Pin an old message, return to the newest messages, then jump back to it.',
      ],
      'Expected old messages load without a large scroll jump, and jump navigation lands on the requested message.'
    );
    const env = await setup(dual);
    const helper = new MessageTestHelpers(dual.pageA);
    const probe = new UiStressProbe(dual.pageA);
    probes.push(probe);
    const markers = markerList('history', env.runId, UI_STRESS_CONFIG.historyMessageCount);
    const sendAttempts: number[] = [];
    const anchorShifts: number[] = [];
    const historySeedStartedAt = Date.now();
    let historySeedDurationMs = 0;
    registerMetrics('history-scroll-metrics', () => ({
      generatedMessages: markers.length,
      sendAttempts,
      retriedMessages: sendAttempts.filter(attempts => attempts > 1).length,
      anchorShifts,
      maxAllowedShiftPx: UI_STRESS_CONFIG.maxAnchorShiftPx,
      successfulPageLoads: anchorShifts.length,
      minimumRequiredPageLoads: UI_STRESS_CONFIG.minHistoryPageLoads,
      historySeedDurationMs,
      sendIntervalMs: UI_STRESS_CONFIG.historySendIntervalMs,
      batchSize: UI_STRESS_CONFIG.historyBatchSize,
      batchPauseMs: UI_STRESS_CONFIG.historyBatchPauseMs,
    }));

    await AllureReporter.step(`Send ${markers.length} history messages`, async () => {
      for (const [index, marker] of markers.entries()) {
        sendAttempts.push(
          await probe.sendMessageWithRetry(marker, 3, 10000, UI_STRESS_CONFIG.historyRetryBackoffMs)
        );
        if (index < markers.length - 1) {
          await dual.pageA.waitForTimeout(UI_STRESS_CONFIG.historySendIntervalMs);
        }
        if (index < markers.length - 1 && (index + 1) % UI_STRESS_CONFIG.historyBatchSize === 0) {
          await dual.pageA.waitForTimeout(UI_STRESS_CONFIG.historyBatchPauseMs);
        }
      }
    });
    historySeedDurationMs = Date.now() - historySeedStartedAt;

    await dual.pageA.reload({ waitUntil: 'domcontentloaded' });
    await expect
      .poll(() => helper.getMessageItemLocator(`[history-${env.runId}-`).count())
      .toBeGreaterThan(0);
    expect(
      await helper.getMessageItemLocator(markers[0]).count(),
      'The oldest generated message must require history pagination after reload'
    ).toBe(0);

    await AllureReporter.step('Load older history and measure scroll anchoring', async () => {
      for (let attempt = 0; attempt < UI_STRESS_CONFIG.historyMaxPageLoads; attempt++) {
        const shift = await probe.loadOlderMessagesAndMeasureAnchor();
        if (shift !== null) anchorShifts.push(shift);
        if ((await helper.getMessageItemLocator(markers[0]).count()) > 0) break;
      }
      await probe.waitForMessage(markers[0]);
      expect(
        anchorShifts.length,
        'The test must observe at least the configured number of successful history page loads'
      ).toBeGreaterThanOrEqual(UI_STRESS_CONFIG.minHistoryPageLoads);
      for (const shift of anchorShifts) {
        expect(
          shift,
          'History pagination must preserve the visible scroll anchor'
        ).toBeLessThanOrEqual(UI_STRESS_CONFIG.maxAnchorShiftPx);
      }
    });

    await AllureReporter.step('Pin and jump back to the oldest generated message', async () => {
      const oldMessage = helper.getMessageItemLocator(markers[0]).last();
      await oldMessage.scrollIntoViewIfNeeded();
      await probe.expectMessageInScrollerViewport(markers[0], true);
      await helper.pinMessage(oldMessage);
      await probe.scrollToBottom(markers.at(-1));
      await probe.expectMessageInScrollerViewport(markers[0], false);
      await helper.openPinnedMessagesModal();
      await helper.clickJumpToMessage(markers[0]);
      await probe.waitForMessage(markers[0]);
      await probe.expectMessageInScrollerViewport(markers[0], true);
    });
  });

  test('Burst messages preserve typing, render once, and remain responsive', async ({ dual }) => {
    await annotateStressTest(
      'Receive a burst of messages while the user types, sends, and replies.',
      [
        'Observe message render timestamps on the receiving client.',
        'Send a burst while keeping an unsent draft in the composer.',
        'Send the draft, reply to an incoming message, and validate IDs and latency.',
      ],
      'No generated message is missing or duplicated, the draft survives incoming updates, and p95 render latency stays within budget.'
    );
    const env = await setup(dual);
    const receiverSelector = new MessageSelector(dual.pageA);
    const helper = new MessageTestHelpers(dual.pageA);
    const probe = new UiStressProbe(dual.pageA);
    const senderProbe = new UiStressProbe(dual.pageB);
    probes.push(probe, senderProbe);
    const markers = markerList('burst', env.runId, UI_STRESS_CONFIG.burstMessageCount);
    const draft = `[draft-${env.runId}]`;
    const reply = `[reply-${env.runId}]`;
    const sentAt: Record<string, number> = {};
    let latencies: number[] = [];
    let p95LatencyMs: number | null = null;
    registerMetrics('burst-render-latency', () => ({
      latencies,
      p95LatencyMs,
      budgetMs: UI_STRESS_CONFIG.renderP95Ms,
    }));

    await probe.installMessageRenderObserver(markers);
    await receiverSelector.messageInput.fill(draft);

    await AllureReporter.step(`Receive ${markers.length} messages while typing`, async () => {
      await senderProbe.sendMessagesRapidly(markers, marker => {
        sentAt[marker] = Date.now();
      });
      await probe.waitForMessage(markers.at(-1)!);
      await expect(receiverSelector.messageInput).toContainText(draft);
    });

    await AllureReporter.step('Verify message integrity, send the draft, and reply', async () => {
      await probe.expectMarkersExactlyOnce(markers);
      await receiverSelector.messageInput.press('Enter');
      await senderProbe.waitForMessage(draft);
      const target = helper.getMessageItemLocator(markers.at(-1)!).last();
      await helper.replyToMessage(target, reply);
      expect(await helper.verifyLastMessageIsReplyTo(markers.at(-1)!, reply)).toBe(true);
      await senderProbe.waitForMessage(reply);
    });

    const renderedAt = await probe.getObservedRenderTimes();
    latencies = markers.map(marker => renderedAt[marker] - sentAt[marker]);
    expect(latencies.every(latency => Number.isFinite(latency) && latency >= 0)).toBe(true);
    p95LatencyMs = UiStressProbe.percentile(latencies, 0.95);
    expect(p95LatencyMs, 'Incoming message p95 render latency').toBeLessThanOrEqual(
      UI_STRESS_CONFIG.renderP95Ms
    );
  });

  test('Rapid channel and DM switching never leaks stale conversation data', async ({ dual }) => {
    await annotateStressTest(
      'Switch rapidly between two clan channels and a direct message.',
      [
        'Seed a unique message in each conversation.',
        'Cycle through the first channel, DM, and second channel repeatedly.',
        'Check that only the selected conversation data is rendered after every switch.',
      ],
      'Messages and reply content from a previous conversation never appear in the newly selected conversation.'
    );
    const env = await setup(dual);
    const messagePage = new MessagePage(dual.pageA);
    const helper = new MessageTestHelpers(dual.pageA);
    const probe = new UiStressProbe(dual.pageA);
    probes.push(probe);
    const primaryMarker = `[primary-${env.runId}]`;
    const primaryReply = `[primary-reply-${env.runId}]`;
    const secondaryMarker = `[secondary-${env.runId}]`;
    const dmMarker = `[dm-${env.runId}]`;
    const switchLatencies: number[] = [];
    registerMetrics('conversation-switch-latency', () => ({
      samples: switchLatencies,
      p95Ms: UiStressProbe.percentile(switchLatencies, 0.95),
    }));

    await messagePage.sendMessageInCurrentChannel(primaryMarker);
    await helper.replyToMessage(helper.getMessageItemLocator(primaryMarker).last(), primaryReply);
    await env.clanPageA.openChannelByName(env.secondaryChannel);
    await messagePage.sendMessageInCurrentChannel(secondaryMarker);
    await env.clanPageA.gotoDM();
    const dmItem = messagePage.getFriendItemFromListDM(UI_STRESS_USERNAME_B);
    await expect(dmItem).toBeVisible();
    await dmItem.click();
    await messagePage.sendMessageWhenInDM(dmMarker);

    await AllureReporter.step(
      `Cycle through conversations ${UI_STRESS_CONFIG.switchIterations} times`,
      async () => {
        for (let iteration = 0; iteration < UI_STRESS_CONFIG.switchIterations; iteration++) {
          let startedAt = Date.now();
          await (await env.clanPageA.getClanItemByName(env.clanFactory.getClanName())).click();
          await env.clanPageA.openChannelByName(env.primaryChannel);
          await probe.waitForMessage(primaryReply);
          await probe.expectMessageAbsent(secondaryMarker);
          await probe.expectMessageAbsent(dmMarker);
          switchLatencies.push(Date.now() - startedAt);

          startedAt = Date.now();
          await env.clanPageA.gotoDM();
          await messagePage.getFriendItemFromListDM(UI_STRESS_USERNAME_B).click();
          await probe.waitForMessage(dmMarker);
          await probe.expectMessageAbsent(primaryMarker);
          await probe.expectMessageAbsent(primaryReply);
          await probe.expectMessageAbsent(secondaryMarker);
          switchLatencies.push(Date.now() - startedAt);

          startedAt = Date.now();
          await (await env.clanPageA.getClanItemByName(env.clanFactory.getClanName())).click();
          await env.clanPageA.openChannelByName(env.secondaryChannel);
          await probe.waitForMessage(secondaryMarker);
          await probe.expectMessageAbsent(primaryMarker);
          await probe.expectMessageAbsent(primaryReply);
          await probe.expectMessageAbsent(dmMarker);
          switchLatencies.push(Date.now() - startedAt);
        }
      }
    );
  });

  test('Offline client reconnects, catches up, and continues interacting', async ({ dual }) => {
    await annotateStressTest(
      'Validate chat recovery after a temporary network outage.',
      [
        'Type a draft and put the receiving browser context offline.',
        'Send a message from the connected user.',
        'Reconnect, verify catch-up and draft preservation, then send and reply.',
      ],
      'The missed message synchronizes once, the draft is retained, and normal send/reply interaction resumes.'
    );
    const env = await setup(dual);
    const sender = new MessagePage(dual.pageB);
    const receiverSelector = new MessageSelector(dual.pageA);
    const helperA = new MessageTestHelpers(dual.pageA);
    const probeA = new UiStressProbe(dual.pageA);
    const probeB = new UiStressProbe(dual.pageB);
    probes.push(probeA, probeB);
    const missedMarker = `[offline-incoming-${env.runId}]`;
    const draft = `[offline-draft-${env.runId}]`;
    const reply = `[offline-reply-${env.runId}]`;
    let catchUpLatencyMs: number | null = null;
    registerMetrics('reconnect-catch-up-metrics', () => ({
      catchUpLatencyMs,
      budgetMs: UI_STRESS_CONFIG.reconnectTimeoutMs,
    }));

    await probeA.installMessageRenderObserver([missedMarker]);
    await receiverSelector.messageInput.fill(draft);
    await probeA.setOffline(true);
    let reconnectStartedAt = 0;
    try {
      await sender.sendMessageInCurrentChannel(missedMarker);
      await expect(receiverSelector.messageInput).toContainText(draft);
      await probeA.expectMessageAbsent(missedMarker);
    } finally {
      reconnectStartedAt = Date.now();
      await probeA.setOffline(false);
    }

    await probeA.waitForMessage(missedMarker, UI_STRESS_CONFIG.reconnectTimeoutMs);
    const renderedAt = (await probeA.getObservedRenderTimes())[missedMarker];
    catchUpLatencyMs = renderedAt - reconnectStartedAt;
    expect(
      catchUpLatencyMs,
      'Reconnect catch-up latency must be measurable'
    ).toBeGreaterThanOrEqual(0);
    expect(catchUpLatencyMs, 'Reconnect catch-up latency').toBeLessThanOrEqual(
      UI_STRESS_CONFIG.reconnectTimeoutMs
    );
    await probeA.expectMarkersExactlyOnce([missedMarker]);
    await expect(receiverSelector.messageInput).toContainText(draft);
    await receiverSelector.messageInput.press('Enter');
    await probeB.waitForMessage(draft);
    await helperA.replyToMessage(helperA.getMessageItemLocator(missedMarker).last(), reply);
    await probeB.waitForMessage(reply);
  });

  test('Long-running navigation and modal cycles stay within resource budgets', async ({
    dual,
  }) => {
    await annotateStressTest(
      'Track browser memory and responsiveness during repeated UI interaction.',
      [
        'Seed a pinned message and an image attachment used by the modal cycles.',
        'Repeatedly switch channels and open/close the media and pinned-message modals.',
        'Compare start/end heap and early/late interaction latency.',
      ],
      'Heap growth and responsiveness degradation remain within configured budgets throughout the run.'
    );
    const env = await setup(dual);
    const messagePage = new MessagePage(dual.pageA);
    const helper = new MessageTestHelpers(dual.pageA);
    const senderHelper = new MessageTestHelpers(dual.pageB);
    const probe = new UiStressProbe(dual.pageA);
    probes.push(probe);
    const marker = `[endurance-${env.runId}]`;
    let mediaReceivedRealtime = false;
    let mediaReadyBeforeReload = false;
    let mediaReadyAfterReload = false;
    let mediaProcessingBeforeReloadMs: number | null = null;
    const metrics: Array<Awaited<ReturnType<UiStressProbe['sampleBrowserMetrics']>>> = [];
    const iterationLatencies: number[] = [];
    let heapGrowthPercent: number | null = null;
    let maxHeapGrowthPercent: number | null = null;
    let maxNodeGrowthPercent: number | null = null;
    let initialP95Ms: number | null = null;
    let finalP95Ms: number | null = null;
    let latencyDegradationPercent: number | null = null;
    let heapGrowthSeries: number[] = [];
    let nodeGrowthSeries: number[] = [];
    registerMetrics('endurance-media-readiness', () => ({
      mediaReceivedRealtime,
      mediaReadyBeforeReload,
      mediaReadyAfterReload,
      mediaRequired: UI_STRESS_CONFIG.requireMedia,
      mediaProcessingBeforeReloadMs,
      timeoutMs: UI_STRESS_CONFIG.mediaProcessingTimeoutMs,
    }));
    registerMetrics('endurance-browser-metrics', () => ({
      metrics,
      iterationLatencies,
      heapGrowthPercent,
      maxHeapGrowthPercent: UI_STRESS_CONFIG.maxHeapGrowthPercent,
      heapGrowthSeries,
      observedMaxHeapGrowthPercent: maxHeapGrowthPercent,
      nodeGrowthSeries,
      observedMaxNodeGrowthPercent: maxNodeGrowthPercent,
      maxNodeGrowthPercent: UI_STRESS_CONFIG.maxNodeGrowthPercent,
      initialP95Ms,
      finalP95Ms,
      latencyDegradationPercent,
      maxLatencyDegradationPercent: UI_STRESS_CONFIG.maxLatencyDegradationPercent,
      interactionP95BudgetMs: UI_STRESS_CONFIG.interactionP95Ms,
      mediaReceivedRealtime,
      mediaReadyBeforeReload,
      mediaReadyAfterReload,
      mediaRequired: UI_STRESS_CONFIG.requireMedia,
    }));
    await messagePage.sendMessageInCurrentChannel(marker);
    await helper.pinMessage(helper.getMessageItemLocator(marker).last());
    const mediaItems = dual.pageA.locator('.media-inner');
    const interactiveMediaItems = dual.pageA.locator('.media-inner.interactive');
    const mediaCountBeforeUpload = await mediaItems.count();
    const interactiveMediaCountBeforeUpload = await interactiveMediaItems.count();
    const mediaUploadStartedAt = Date.now();
    await dual.pageB.locator('#preview_img').setInputFiles({
      name: `stress-media-${env.runId}.png`,
      mimeType: 'image/png',
      buffer: STRESS_IMAGE_PNG,
    });
    await expect(await env.clanPageB.getSelectedFilePreview()).toBeVisible({ timeout: 5000 });
    await (await senderHelper.findMessageInput()).press('Enter');
    mediaReceivedRealtime = await expect
      .poll(() => mediaItems.count(), { timeout: 15000 })
      .toBeGreaterThan(mediaCountBeforeUpload)
      .then(() => true)
      .catch(() => false);
    mediaReadyBeforeReload = await expect
      .poll(() => interactiveMediaItems.count(), {
        timeout: UI_STRESS_CONFIG.mediaProcessingTimeoutMs,
      })
      .toBeGreaterThan(interactiveMediaCountBeforeUpload)
      .then(() => true)
      .catch(() => false);
    mediaProcessingBeforeReloadMs = Date.now() - mediaUploadStartedAt;
    const mediaViewerTrigger = dual.pageA.locator('.media-inner.interactive').last();
    if (mediaReadyBeforeReload) {
      await dual.pageA.reload({ waitUntil: 'domcontentloaded' });
      await probe.waitForMessage(marker);
      mediaReadyAfterReload = await mediaViewerTrigger
        .waitFor({ state: 'visible', timeout: UI_STRESS_CONFIG.mediaProcessingTimeoutMs })
        .then(() => true)
        .catch(() => false);
    }
    if (UI_STRESS_CONFIG.requireMedia) {
      expect(
        mediaReceivedRealtime,
        'Incoming image message must be delivered to the receiving client in realtime'
      ).toBe(true);
      expect(
        mediaReadyBeforeReload,
        'Incoming image upload must finish before the receiving client reloads'
      ).toBe(true);
      expect(
        mediaReadyAfterReload,
        'Incoming image must remain available after the receiving client reloads'
      ).toBe(true);
    }

    await probe.collectGarbage();
    metrics.push(await probe.sampleBrowserMetrics('start'));

    await AllureReporter.step(
      `Run ${UI_STRESS_CONFIG.enduranceIterations} navigation and modal cycles`,
      async () => {
        for (let iteration = 0; iteration < UI_STRESS_CONFIG.enduranceIterations; iteration++) {
          const startedAt = Date.now();
          await env.clanPageA.openChannelByName(env.secondaryChannel);
          await env.clanPageA.openChannelByName(env.primaryChannel);
          await probe.waitForMessage(marker);
          if (mediaReadyAfterReload) {
            const mediaModal = await helper.clickImageAndHandleModal(mediaViewerTrigger);
            expect(mediaModal.modalFound, 'Image attachment must open in the media viewer').toBe(
              true
            );
            await helper.closeModal();
          }
          await helper.openPinnedMessagesModal();
          await helper.closeModal();
          iterationLatencies.push(Date.now() - startedAt);

          if (
            (iteration + 1) % Math.max(1, Math.floor(UI_STRESS_CONFIG.enduranceIterations / 5)) ===
            0
          ) {
            await probe.collectGarbage();
            metrics.push(await probe.sampleBrowserMetrics(`iteration-${iteration + 1}-after-gc`));
          }
        }
      }
    );

    await probe.collectGarbage();
    const finalMetric = await probe.sampleBrowserMetrics('end-after-gc');
    metrics.push(finalMetric);
    heapGrowthPercent = UiStressProbe.growthPercent(
      metrics[0].jsHeapUsedSize,
      finalMetric.jsHeapUsedSize
    );
    const segmentSize = Math.max(1, Math.floor(iterationLatencies.length / 3));
    initialP95Ms = UiStressProbe.percentile(iterationLatencies.slice(0, segmentSize), 0.95);
    finalP95Ms = UiStressProbe.percentile(iterationLatencies.slice(-segmentSize), 0.95);
    latencyDegradationPercent = UiStressProbe.growthPercent(initialP95Ms, finalP95Ms);
    heapGrowthSeries = metrics.map(metric =>
      UiStressProbe.growthPercent(metrics[0].jsHeapUsedSize, metric.jsHeapUsedSize)
    );
    nodeGrowthSeries = metrics.map(metric =>
      UiStressProbe.growthPercent(metrics[0].nodes, metric.nodes)
    );
    maxHeapGrowthPercent = Math.max(...heapGrowthSeries);
    maxNodeGrowthPercent = Math.max(...nodeGrowthSeries);

    expect(
      heapGrowthPercent,
      'JavaScript heap growth after garbage collection'
    ).toBeLessThanOrEqual(UI_STRESS_CONFIG.maxHeapGrowthPercent);
    expect(
      maxHeapGrowthPercent,
      'Maximum JavaScript heap growth during the run'
    ).toBeLessThanOrEqual(UI_STRESS_CONFIG.maxHeapGrowthPercent);
    expect(maxNodeGrowthPercent, 'Maximum DOM node growth during the run').toBeLessThanOrEqual(
      UI_STRESS_CONFIG.maxNodeGrowthPercent
    );
    expect(latencyDegradationPercent, 'Interaction latency degradation').toBeLessThanOrEqual(
      UI_STRESS_CONFIG.maxLatencyDegradationPercent
    );
    expect(finalP95Ms, 'Final interaction p95 latency').toBeLessThanOrEqual(
      UI_STRESS_CONFIG.interactionP95Ms
    );
  });
});
