import { Allure } from "../integrations/wdio-allure-reporter/core/allure.js";

export function Step(name: string) {
    return function <T, A extends any[], R>(
        value: (this: T, ...args: A) => Promise<R> | R,
        _context: ClassMethodDecoratorContext<
            T,
            (this: T, ...args: A) => Promise<R> | R
        >
    ) {
        const original = value;

        async function wrapped(this: T, ...args: A): Promise<R> {
            return await Allure.using(async (allure) => {
                return await allure.step(name, async (allure) => {
                    try {
                        return await original.apply(this, args);
                    } catch (err: any) {
                        try {
                            allure.addAttachment?.(
                                "Error",
                                JSON.stringify(
                                    {
                                        message: err?.message,
                                        stack: err?.stack,
                                    },
                                    null,
                                    2
                                ),
                                "application/json"
                            );
                        } catch {}
                        throw err;
                    }
                });
            });
        }

        return wrapped;
    };
}
