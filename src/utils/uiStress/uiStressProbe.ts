import { expect, Page, TestInfo, type CDPSession } from '@playwright/test';
import { generateE2eSelector } from '../generateE2eSelector';

export type BrowserMetricSample = {
  label: string;
  timestamp: number;
  jsHeapUsedSize: number;
  nodes: number;
  taskDurationMs: number;
  domMessageCount: number;
};

const MESSAGE_ITEM_SELECTOR = generateE2eSelector('message.item');
const MESSAGE_INPUT_SELECTOR = generateE2eSelector('mention.input');

export class UiStressProbe {
  private cdpSession?: CDPSession;
  private readonly messageItems = this.page.locator(MESSAGE_ITEM_SELECTOR);
  private readonly messageScroller = this.page
    .locator('.messages-container > .messages-scroll')
    .first();
  private readonly visibleScrollDownButton = this.page
    .locator('button.opacity-100')
    .filter({
      has: this.page.locator('svg[viewBox="0 0 24 24"] path[d^="M12 21"]'),
    })
    .first();

  constructor(private readonly page: Page) {}

  async waitForMessage(marker: string, timeout = 15000): Promise<void> {
    await expect(this.messageItems.filter({ hasText: marker }).last()).toBeVisible({ timeout });
  }

  async isMessageInScrollerViewport(marker: string): Promise<boolean> {
    const message = this.messageItems.filter({ hasText: marker }).last();
    if ((await message.count()) === 0) return false;
    return message.evaluate(element => {
      const scroller = element.closest('.messages-scroll');
      if (!scroller) return false;
      const messageRect = element.getBoundingClientRect();
      const scrollerRect = scroller.getBoundingClientRect();
      return messageRect.bottom > scrollerRect.top && messageRect.top < scrollerRect.bottom;
    });
  }

  async expectMessageInScrollerViewport(
    marker: string,
    expected: boolean,
    timeout = 10000
  ): Promise<void> {
    await expect.poll(() => this.isMessageInScrollerViewport(marker), { timeout }).toBe(expected);
  }

  async sendMessageWithRetry(
    message: string,
    maxAttempts = 3,
    acknowledgementTimeout = 10000,
    retryBackoffMs = 1000
  ): Promise<number> {
    const input = this.page.locator(MESSAGE_INPUT_SELECTOR);
    const renderedMessage = this.messageItems.filter({ hasText: message }).last();

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await this.scrollToBottom();
      if (await renderedMessage.isVisible()) return attempt;

      await input.fill(message);
      await input.press('Enter');
      await this.scrollToBottom();
      try {
        await expect(renderedMessage).toBeVisible({ timeout: acknowledgementTimeout });
        return attempt;
      } catch {
        await this.scrollToBottom();
        try {
          await expect(renderedMessage).toBeVisible({ timeout: 3000 });
          return attempt;
        } catch {
          // Retry only after the message is still absent at the bottom of the list.
        }
      }

      if (attempt < maxAttempts) {
        await this.page.waitForTimeout(retryBackoffMs * attempt);
      }
    }

    throw new Error(`Message was not rendered after ${maxAttempts} send attempts: ${message}`);
  }

  async expectMessageAbsent(marker: string): Promise<void> {
    await expect(this.messageItems.filter({ hasText: marker })).toHaveCount(0);
  }

  async expectMarkersExactlyOnce(markers: string[]): Promise<void> {
    const markerIds: string[] = [];
    for (const marker of markers) {
      const message = this.messageItems.filter({ hasText: marker });
      await expect(message, `Message ${marker}`).toHaveCount(1);
      const domId = await message.getAttribute('id');
      expect(domId, `Message ${marker} must expose a non-empty msg-* ID`).toMatch(/^msg-.+/);
      if (!domId) throw new Error(`Message ${marker} does not expose a DOM ID`);
      markerIds.push(domId.replace(/^msg-/, ''));
    }

    expect(new Set(markerIds).size, 'Generated message IDs must be unique').toBe(markerIds.length);
    const ids = await this.getRenderedMessageIds();
    expect(new Set(ids).size, 'Rendered message IDs must be unique').toBe(ids.length);
  }

  async sendMessagesRapidly(
    messages: string[],
    beforeSend?: (message: string) => void
  ): Promise<void> {
    const input = this.page.locator(MESSAGE_INPUT_SELECTOR);
    for (const message of messages) {
      await input.fill(message);
      beforeSend?.(message);
      await input.press('Enter');
    }
  }

  async getRenderedMessageIds(): Promise<string[]> {
    return this.messageItems.evaluateAll(elements =>
      elements
        .map(element => element.id.replace(/^msg-/, ''))
        .filter((id): id is string => Boolean(id))
    );
  }

  async getRenderedExpectedMarkers(markers: string[]): Promise<string[]> {
    return this.messageItems.evaluateAll((elements, expectedMarkers) => {
      const renderedText = elements.map(element => element.textContent || '');
      return expectedMarkers.filter(marker => renderedText.some(text => text.includes(marker)));
    }, markers);
  }

  async installMessageRenderObserver(markers: string[]): Promise<void> {
    await this.page.evaluate(
      ({ selector, expectedMarkers }) => {
        const state = window as typeof window & {
          __uiStressMessageTimes?: Record<string, number>;
          __uiStressMessageObserver?: MutationObserver;
        };
        state.__uiStressMessageObserver?.disconnect();
        const messageTimes: Record<string, number> = {};
        state.__uiStressMessageTimes = messageTimes;
        const expected = new Set(expectedMarkers);

        const scan = (root: ParentNode) => {
          const elements = [
            ...(root instanceof Element && root.matches(selector) ? [root] : []),
            ...Array.from(root.querySelectorAll(selector)),
          ];
          for (const element of elements) {
            const text = element.textContent || '';
            for (const marker of expected) {
              if (text.includes(marker) && messageTimes[marker] === undefined) {
                messageTimes[marker] = Date.now();
              }
            }
          }
        };

        scan(document);
        state.__uiStressMessageObserver = new MutationObserver(records => {
          for (const record of records) {
            for (const node of record.addedNodes) {
              if (node instanceof Element) scan(node);
            }
          }
        });
        state.__uiStressMessageObserver.observe(document.body, { childList: true, subtree: true });
      },
      { selector: MESSAGE_ITEM_SELECTOR, expectedMarkers: markers }
    );
  }

  async getObservedRenderTimes(): Promise<Record<string, number>> {
    return this.page.evaluate(() => {
      const state = window as typeof window & {
        __uiStressMessageTimes?: Record<string, number>;
      };
      return { ...(state.__uiStressMessageTimes || {}) };
    });
  }

  async loadOlderMessagesAndMeasureAnchor(timeout = 10000): Promise<number | null> {
    await expect(this.messageScroller).toBeVisible();
    const before = await this.messageScroller.evaluate(container => {
      // Each pagination attempt must perform a real movement back to the top.
      // After a prepend, the app increases scrollTop to preserve the visible
      // anchor, so dispatching another synthetic event alone cannot load the
      // following page.
      container.scrollTop = 0;
      const messages = Array.from(container.querySelectorAll<HTMLElement>('.message-list-item'));
      const first = messages[0];
      const containerRect = container.getBoundingClientRect();
      const visibleMessages = messages.filter(message => {
        const rect = message.getBoundingClientRect();
        return rect.bottom > containerRect.top && rect.top < containerRect.bottom;
      });
      const anchor = visibleMessages[1] || visibleMessages[0] || messages[1] || first;
      if (!first || !anchor) return null;
      const state = {
        cursorId: first.id,
        anchorId: anchor.id,
        anchorTop: anchor.getBoundingClientRect().top,
      };
      container.dispatchEvent(new Event('scroll', { bubbles: true }));
      container.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true }));
      return state;
    });
    if (!before) return null;

    try {
      await expect
        .poll(
          () =>
            this.messageScroller.evaluate(
              (container, previousId) =>
                container.querySelector<HTMLElement>('.message-list-item')?.id !== previousId,
              before.cursorId
            ),
          { timeout }
        )
        .toBe(true);
    } catch {
      return null;
    }

    // The new DOM nodes are committed before ChannelMessages applies its
    // scrollTop compensation. Measure after two paint frames so the metric
    // reflects the settled viewport instead of the transient prepend frame.
    await this.messageScroller.evaluate(
      () =>
        new Promise<void>(resolve => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        })
    );

    return this.messageScroller.evaluate((container, anchor) => {
      const escapedId = CSS.escape(anchor.anchorId);
      const element = container.querySelector<HTMLElement>(`#${escapedId}`);
      return element ? Math.abs(element.getBoundingClientRect().top - anchor.anchorTop) : null;
    }, before);
  }

  private async getRenderedMessageWindow(): Promise<{ count: number; lastId: string | null }> {
    return this.messageItems.evaluateAll(messages => ({
      count: messages.length,
      lastId: messages.at(-1)?.id || null,
    }));
  }

  private async pushCurrentWindowToBottom(retryForwardPagination: boolean): Promise<void> {
    if (await this.visibleScrollDownButton.isVisible()) {
      await this.visibleScrollDownButton.click();
    }

    await this.messageScroller.evaluate((container, retryForward) => {
      container.scrollTop = container.scrollHeight;
      container.dispatchEvent(new Event('scroll'));
      if (retryForward) {
        container.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true }));
      }
    }, retryForwardPagination);
  }

  async scrollToBottom(expectedLatestMarker?: string, timeout = 30000): Promise<void> {
    const latestMessage = expectedLatestMarker
      ? this.messageItems.filter({ hasText: expectedLatestMarker }).last()
      : undefined;

    if (!latestMessage) {
      await this.pushCurrentWindowToBottom(false);
    } else {
      const deadline = Date.now() + timeout;
      const observedLastIds = new Set<string>();

      while ((await latestMessage.count()) === 0 && Date.now() < deadline) {
        const before = await this.getRenderedMessageWindow();
        if (before.lastId) observedLastIds.add(before.lastId);

        await this.pushCurrentWindowToBottom(true);
        if ((await latestMessage.count()) > 0) break;

        const remainingMs = deadline - Date.now();
        if (remainingMs <= 0) break;
        await expect
          .poll(
            async () => {
              if ((await latestMessage.count()) > 0) return true;
              const current = await this.getRenderedMessageWindow();
              return current.lastId !== before.lastId || current.count !== before.count;
            },
            { timeout: Math.min(5000, remainingMs) }
          )
          .toBe(true)
          .catch(() => undefined);
      }

      const finalWindow = await this.getRenderedMessageWindow();
      if (finalWindow.lastId) observedLastIds.add(finalWindow.lastId);
      expect(
        await latestMessage.count(),
        `Expected latest message was not loaded after continuous scrolling to present: ${expectedLatestMarker}. Observed window cursors: ${[...observedLastIds].join(', ') || 'none'}; final DOM message count: ${finalWindow.count}`
      ).toBeGreaterThan(0);
    }

    await this.messageScroller.evaluate(container => {
      container.scrollTop = container.scrollHeight;
      container.dispatchEvent(new Event('scroll'));
    });

    await expect
      .poll(
        () =>
          this.messageScroller.evaluate(
            container =>
              Math.abs(container.scrollHeight - container.clientHeight - container.scrollTop) <= 2
          ),
        { timeout }
      )
      .toBe(true);

    if (expectedLatestMarker) {
      await this.expectMessageInScrollerViewport(expectedLatestMarker, true, timeout);
    }
  }

  async setOffline(offline: boolean): Promise<void> {
    await this.page.context().setOffline(offline);
    await expect
      .poll(() => this.page.evaluate(() => navigator.onLine), { timeout: 5000 })
      .toBe(!offline);
  }

  async sampleBrowserMetrics(label: string): Promise<BrowserMetricSample> {
    const cdpSession = await this.getCdpSession();
    const response = (await cdpSession.send('Performance.getMetrics')) as {
      metrics: Array<{ name: string; value: number }>;
    };
    const metrics = Object.fromEntries(response.metrics.map(metric => [metric.name, metric.value]));
    return {
      label,
      timestamp: Date.now(),
      jsHeapUsedSize: metrics.JSHeapUsedSize || 0,
      nodes: metrics.Nodes || 0,
      taskDurationMs: (metrics.TaskDuration || 0) * 1000,
      domMessageCount: await this.messageItems.count(),
    };
  }

  async collectGarbage(): Promise<void> {
    const cdpSession = await this.getCdpSession();
    await cdpSession.send('HeapProfiler.collectGarbage');
  }

  async dispose(): Promise<void> {
    await this.page
      .evaluate(() => {
        const state = window as typeof window & {
          __uiStressMessageObserver?: MutationObserver;
        };
        state.__uiStressMessageObserver?.disconnect();
        delete state.__uiStressMessageObserver;
      })
      .catch(() => undefined);
    await this.cdpSession?.detach();
    this.cdpSession = undefined;
  }

  private async getCdpSession(): Promise<CDPSession> {
    if (!this.cdpSession) {
      this.cdpSession = await this.page.context().newCDPSession(this.page);
      await this.cdpSession.send('Performance.enable');
    }
    return this.cdpSession;
  }

  static percentile(values: number[], percentile: number): number {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.min(sorted.length - 1, Math.ceil(percentile * sorted.length) - 1);
    return sorted[Math.max(0, index)];
  }

  static growthPercent(start: number, end: number): number {
    if (start <= 0) return 0;
    return ((end - start) / start) * 100;
  }

  static async attachJson(testInfo: TestInfo, name: string, value: unknown): Promise<void> {
    await testInfo.attach(name, {
      body: Buffer.from(JSON.stringify(value, null, 2)),
      contentType: 'application/json',
    });
  }

  static async attachMetricsTable(
    testInfo: TestInfo,
    name: string,
    metricGroups: Array<{ name: string; value: unknown }>
  ): Promise<void> {
    const rows = metricGroups.flatMap(group => this.flattenMetricRows(group.name, '', group.value));
    const status = testInfo.status || 'unknown';
    const statusClass = status === 'passed' ? 'passed' : status === 'failed' ? 'failed' : 'other';
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${this.escapeHtml(name)}</title>
  <style>
    body { margin: 0; padding: 24px; font-family: Inter, Arial, sans-serif; background: #0f172a; color: #e2e8f0; }
    h1 { margin: 0 0 8px; font-size: 22px; }
    .meta { margin-bottom: 20px; color: #94a3b8; }
    .status { display: inline-block; margin-left: 8px; padding: 3px 9px; border-radius: 999px; font-weight: 700; text-transform: uppercase; }
    .passed { background: #14532d; color: #86efac; }
    .failed { background: #7f1d1d; color: #fecaca; }
    .other { background: #334155; color: #cbd5e1; }
    table { width: 100%; border-collapse: collapse; overflow: hidden; border-radius: 8px; background: #111827; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #334155; text-align: left; vertical-align: top; }
    th { position: sticky; top: 0; background: #1e293b; color: #93c5fd; }
    tr:last-child td { border-bottom: 0; }
    td:first-child { width: 24%; color: #c4b5fd; font-weight: 600; }
    td:nth-child(2) { width: 32%; color: #cbd5e1; }
    td:last-child { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; overflow-wrap: anywhere; }
    .true { color: #86efac; font-weight: 700; }
    .false { color: #fca5a5; font-weight: 700; }
  </style>
</head>
<body>
  <h1>UI Stress Metrics Summary</h1>
  <div class="meta">${this.escapeHtml(testInfo.title)}<span class="status ${statusClass}">${this.escapeHtml(status)}</span></div>
  <table>
    <thead><tr><th>Metric group</th><th>Metric</th><th>Observed value</th></tr></thead>
    <tbody>${rows
      .map(
        row =>
          `<tr><td>${this.escapeHtml(row.group)}</td><td>${this.escapeHtml(row.metric)}</td><td>${this.formatHtmlValue(row.value)}</td></tr>`
      )
      .join('')}</tbody>
  </table>
</body>
</html>`;

    await testInfo.attach(name, {
      body: Buffer.from(html),
      contentType: 'text/html',
    });
  }

  private static flattenMetricRows(
    group: string,
    prefix: string,
    value: unknown
  ): Array<{ group: string; metric: string; value: unknown }> {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return [{ group, metric: prefix || 'value', value: 'No samples' }];
      }
      if (value.every(item => typeof item === 'number')) {
        const numbers = value as number[];
        const average = numbers.reduce((sum, item) => sum + item, 0) / numbers.length;
        return [
          {
            group,
            metric: prefix || 'value',
            value: `${numbers.length} samples | min ${Math.min(...numbers).toFixed(2)} | avg ${average.toFixed(2)} | p95 ${this.percentile(numbers, 0.95).toFixed(2)} | max ${Math.max(...numbers).toFixed(2)}`,
          },
        ];
      }
      if (value.every(item => item !== null && typeof item === 'object')) {
        return value.flatMap((item, index) => {
          const record = item as Record<string, unknown>;
          const itemLabel = typeof record.label === 'string' ? record.label : String(index + 1);
          return this.flattenMetricRows(group, `${prefix || 'sample'}.${itemLabel}`, record);
        });
      }
      return [{ group, metric: prefix || 'value', value: `${value.length} samples` }];
    }

    if (value !== null && typeof value === 'object') {
      return Object.entries(value as Record<string, unknown>).flatMap(([key, nestedValue]) =>
        this.flattenMetricRows(group, prefix ? `${prefix}.${key}` : key, nestedValue)
      );
    }

    return [{ group, metric: prefix || 'value', value }];
  }

  private static formatHtmlValue(value: unknown): string {
    if (typeof value === 'boolean') {
      return `<span class="${value}">${value ? 'YES' : 'NO'}</span>`;
    }
    if (value === null || value === undefined) {
      return '<span class="other">Not collected</span>';
    }
    return this.escapeHtml(String(value));
  }

  private static escapeHtml(value: string): string {
    return value.replace(
      /[&<>"']/g,
      character =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;',
        })[character] || character
    );
  }
}
