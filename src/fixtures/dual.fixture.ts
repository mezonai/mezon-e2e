/* eslint-disable no-unused-vars */
import { AccountCredentials } from '@/config/environment';
import { AuthHelper } from '@/utils/authHelper';
import { Browser, BrowserContext, Locator, Page, test as base } from '@playwright/test';
export type MultiProvider<K extends string> = {
  readonly keys: readonly K[];
  readonly contexts: Readonly<Record<K, BrowserContext>>;
  readonly pages: Readonly<Record<K, Page>>;

  context(_: K): BrowserContext;
  page(_: K): Page;

  $(_: K): (selector: string) => Locator;

  on<T>(_: K, fn: (_p: Page, _ctx: BrowserContext) => Promise<T> | T): Promise<T>;

  parallel<T extends Partial<Record<K, (_p: Page, _ctx: BrowserContext) => unknown>>>(
    tasks: T
  ): Promise<{
    [P in keyof T]-?: Awaited<ReturnType<NonNullable<T[P]>>>;
  }>;

  map<T>(fn: (_name: K, _p: Page, _ctx: BrowserContext) => Promise<T> | T): Promise<Record<K, T>>;

  cleanup(): Promise<void>;
};

type FactoryOptions<K extends string> = {
  auth?: (name: K, p: Page, ctx: BrowserContext) => Promise<void> | void;
};

type TaskFn = (p: Page, ctx: BrowserContext) => unknown | Promise<unknown>;

async function buildMultiProvider<K extends string>(
  keys: readonly K[],
  browser: Browser,
  opts: FactoryOptions<K> = {}
): Promise<MultiProvider<K>> {
  const contexts: Record<K, BrowserContext> = Object.create(null);
  const pages: Record<K, Page> = Object.create(null);

  for (const k of keys) {
    const ctx = await browser.newContext();
    const pg = await ctx.newPage();
    contexts[k] = ctx;
    pages[k] = pg;
  }

  const auth = opts.auth;
  if (auth) {
    await Promise.all(keys.map(k => Promise.resolve(auth(k, pages[k], contexts[k]))));
  }

  const provider: MultiProvider<K> = {
    keys,
    contexts,
    pages,
    context: name => contexts[name],
    page: name => pages[name],
    $(name) {
      return (selector: string) => pages[name].locator(selector);
    },
    async on(name, fn) {
      return await Promise.resolve(fn(pages[name], contexts[name]));
    },
    async parallel<T extends Partial<Record<K, (p: Page, ctx: BrowserContext) => unknown>>>(
      tasks: T
    ) {
      const rawEntries = Object.entries(tasks).filter(([, fn]) => typeof fn === 'function');
      const entries = rawEntries as Array<[K, TaskFn]>;
      const results = await Promise.all(
        entries.map(([k, fn]) => Promise.resolve(fn(pages[k], contexts[k])))
      );
      const obj = Object.fromEntries(entries.map(([k], i) => [k, results[i]]));
      return obj as { [P in keyof T]-?: Awaited<ReturnType<NonNullable<T[P]>>> };
    },
    async map<T>(
      fn: (name: K, p: Page, ctx: BrowserContext) => Promise<T> | T
    ): Promise<Record<K, T>> {
      const results = await Promise.all(
        keys.map(k => Promise.resolve(fn(k, pages[k], contexts[k])))
      );
      const acc = Object.create(null) as Record<K, T>;
      for (let i = 0; i < keys.length; i++) {
        acc[keys[i]] = results[i];
      }
      return acc;
    },
    async cleanup() {
      await Promise.allSettled(
        keys.map(k =>
          (async () => {
            try {
              await contexts[k].close();
            } catch {
              /* noop */
            }
          })()
        )
      );
    },
  };

  return provider;
}

export function createMultiTest<const K extends string>(
  keys: readonly K[],
  opts: FactoryOptions<K> = {}
) {
  const multiTest = base.extend<{ multi: MultiProvider<K> }>({
    multi: async ({ browser }, use) => {
      const provider = await buildMultiProvider(keys, browser, opts);
      try {
        await use(provider);
      } finally {
        await provider.cleanup();
      }
    },
  });

  return { test: multiTest, expect: base.expect };
}

type DualKey = 'A' | 'B';

export type DualProvider = MultiProvider<DualKey> & {
  pageA: Page;
  pageB: Page;
  contextA: BrowserContext;
  contextB: BrowserContext;
  $A: (selector: string) => Locator;
  $B: (selector: string) => Locator;
};

export const test = base.extend<{ dual: DualProvider }>({
  dual: async ({ browser }, use) => {
    const keys = ['A', 'B'] as const;
    const provider = await buildMultiProvider(keys, browser);

    const dualProvider: DualProvider = {
      ...provider,
      pageA: provider.page('A'),
      pageB: provider.page('B'),
      contextA: provider.context('A'),
      contextB: provider.context('B'),
      $A: provider.$('A'),
      $B: provider.$('B'),
    };

    try {
      await use(dualProvider);
    } finally {
      await dualProvider.cleanup();
    }
  },
});

export const expect = base.expect;
