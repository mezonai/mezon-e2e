import type { Browser } from "webdriverio";
import { capabilities } from "./capabilities.js";

export type MultiRemoteBrowser<Key extends keyof typeof capabilities> =
    WebdriverIO.MultiRemoteBrowser & Record<Key, Browser>;

export class MultiRemoteProvider<K extends keyof typeof capabilities> {
    constructor(
        private readonly mr: MultiRemoteBrowser<K>,
        private readonly keys: readonly K[]
    ) {}
    static create<K extends keyof typeof capabilities>(
        mr: MultiRemoteBrowser<keyof typeof capabilities>,
        keys: readonly K[]
    ): MultiRemoteProvider<K> {
        return new MultiRemoteProvider(mr, keys);
    }

    static async using<K extends keyof typeof capabilities, T>(
        fn: (mr: MultiRemoteProvider<K>) => Promise<T>
    ): Promise<T> {
        const mr = multiremotebrowser as MultiRemoteBrowser<keyof typeof capabilities>;
        const keys = Object.keys(capabilities) as K[];
        return fn(this.create(mr, keys));
    }

    static from<K extends keyof typeof capabilities>(): MultiRemoteProvider<K> {
        return this.create(
            multiremotebrowser as MultiRemoteBrowser<keyof typeof capabilities>,
            Object.keys(capabilities) as K[]
        );
    }

    get(name: K): Browser {
        return this.mr[name];
    }

    all(): MultiRemoteBrowser<K> {
        return this.mr;
    }

    async on<T>(name: K, fn: (b: Browser) => Promise<T> | T): Promise<T> {
        return await Promise.resolve(fn(this.get(name)));
    }

    async parallel<T extends Partial<Record<K, (b: Browser) => any>>>(
        tasks: T
    ): Promise<{
        [P in keyof T]: T[P] extends (...a: any) => Promise<infer R>
            ? R
            : ReturnType<NonNullable<T[P]>>;
    }> {
        const entries = Object.entries(tasks) as [K, (b: Browser) => any][];
        const results = await Promise.all(
            entries.map(([k, fn]) => fn(this.get(k)))
        );
        return entries.reduce(
            (acc, [k], i) => ({ ...acc, [k]: results[i] }),
            {}
        ) as any;
    }

    async map<T>(
        fn: (name: K, b: Browser) => Promise<T> | T
    ): Promise<Record<K, T>> {
        const results = await Promise.all(
            this.keys.map((k) => Promise.resolve(fn(k, this.get(k))))
        );
        return this.keys.reduce(
            (acc, k, i) => ({ ...acc, [k]: results[i] }),
            {} as Record<K, T>
        );
    }

    $(name: K) {
        return (sel: string) => this.get(name).$(sel);
    }
}
