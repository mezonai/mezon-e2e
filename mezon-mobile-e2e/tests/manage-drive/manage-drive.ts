import { AsyncLocalStorage } from "node:async_hooks";

import { MultiRemoteProvider } from "./provider.js";
import { type DeviceInfo } from "./derive-device-Info.js";
import { sleep } from "../utils/sleep.js";
import { capabilities } from "./capabilities.js";

export class ManageDrive<
    K extends keyof typeof capabilities = keyof typeof capabilities
> {
    private readonly driverMap = new Map<K, WebdriverIO.Browser>();
    private static readonly als = new AsyncLocalStorage<{
        key: keyof typeof capabilities;
    }>();
    private readonly userMap = new Map<K, DeviceInfo>();

    constructor(private readonly mr: MultiRemoteProvider<K>) {
        Object.keys(capabilities).map((key: K) => {
            this.driverMap.set(key, this.mr.get(key));
        });
    }

    static init(mr: MultiRemoteProvider<keyof typeof capabilities>) {
        return new ManageDrive(mr);
    }
    public withUsers(users: Record<K, DeviceInfo>) {
        Object.keys(users).map((key: K) => {
            this.userMap.set(key, users[key]);
        });
        return this;
    }

    public runWithSession<T>(
        key: keyof typeof capabilities,
        fn: () => Promise<T> | T
    ): Promise<T> | T {
        return ManageDrive.als.run({ key }, fn);
    }

    public static currentSession(): keyof typeof capabilities | undefined {
        return ManageDrive.als.getStore()?.key;
    }

    public currentSession(): keyof typeof capabilities {
        const key = ManageDrive.currentSession();
        if (!key) throw new Error("No session bound for multiremote");
        return key;
    }

    public getDrivers() {
        const drivers = Array.from(this.driverMap.values());
        return drivers;
    }

    public withDriverA = <T>(fn: () => Promise<T> | T) =>
        this.runWithSession("driverA", fn);

    public withDriverB = <T>(fn: () => Promise<T> | T) =>
        this.runWithSession("driverB", fn);

    public getDriver(name: K) {
        return this.driverMap.get(name);
    }

    public getUsers() {
        const users = Array.from(this.userMap.values());
        return users;
    }

    public getUser(name: K) {
        return this.userMap.get(name);
    }

    public async for<T>(
        name: K,
        fn: (d: WebdriverIO.Browser, u: DeviceInfo) => Promise<T>
    ) {
        const driver = this.driverMap.get(name);
        const user = this.userMap.get(name);
        if (!driver || !user) {
            throw new Error(`Driver or user not found for ${name}`);
        }
        return fn(driver, user);
    }

    async broadcast<T>(
        fn: (ctx: {
            key: K;
            d: WebdriverIO.Browser;
            u: DeviceInfo;
        }) => Promise<T>
    ) {
        const entries = Array.from(this.driverMap.entries());
        return Promise.all(
            entries.map(async ([key, d]) => {
                const u = this.getUser(key);
                return fn({ key, d, u });
            })
        );
    }

    /**
     * fanoutMap: specify different functions for each device
     * ex: md.fanoutMap({ driverA: fnA, driverB: fnB })
     */
    async fanoutMap<T>(
        spec: Partial<
            Record<K, (d: WebdriverIO.Browser, u: DeviceInfo) => Promise<T>>
        >
    ) {
        const tasks: Promise<T>[] = [];
        for (const [key, fn] of Object.entries(spec) as [
            K,
            ((d: WebdriverIO.Browser, u: DeviceInfo) => Promise<T>) | undefined
        ][]) {
            if (!fn) continue;
            tasks.push(fn(this.getDriver(key), this.getUser(key)));
        }
        return Promise.all(tasks);
    }

    /**
     * barrier: synchronize between devices – used when we need “rendezvous”
     */
    async barrier(
        predicate: (
            all: { key: K; d: WebdriverIO.Browser; u: DeviceInfo }[]
        ) => Promise<boolean>,
        opts = { timeoutMs: 20_000, pollMs: 300 }
    ) {
        const start = Date.now();
        const snapshot = () =>
            Array.from(this.driverMap.entries()).map(([key, d]) => ({
                key,
                d,
                u: this.getUser(key),
            }));
        while (Date.now() - start < opts.timeoutMs) {
            if (await predicate(snapshot())) return true;
            await sleep(opts.pollMs);
        }
        throw new Error("Barrier timeout");
    }
}
