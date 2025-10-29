import fs from "fs";
import path from "path";
import os from "os";
import { promisify } from "util";
import https from "https";

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);

export class Upload {
    private tmpDir: string;

    constructor() {
        this.tmpDir = path.join(os.tmpdir(), "mezon-e2e-files");
    }
    static init() {
        return new Upload();
    }

    static async using<T>(fn: (auth: Upload) => Promise<T>): Promise<T> {
        return fn(Upload.init());
    }

    private async ensureTmpDir() {
        if (!fs.existsSync(this.tmpDir)) {
            await mkdir(this.tmpDir, { recursive: true });
        }
    }

    private async downloadToBuffer(url: string): Promise<Buffer> {
        return await new Promise((resolve, reject) => {
            const req = https.get(url, (res) => {
                if (
                    res.statusCode &&
                    res.statusCode >= 300 &&
                    res.statusCode < 400 &&
                    res.headers.location
                ) {
                    return resolve(this.downloadToBuffer(res.headers.location));
                }
                if (res.statusCode !== 200) {
                    return reject(
                        new Error(
                            `Failed to download. Status: ${res.statusCode}`
                        )
                    );
                }
                const data: Buffer[] = [];
                res.on("data", (chunk) => data.push(Buffer.from(chunk)));
                res.on("end", () => resolve(Buffer.concat(data)));
            });
            req.on("error", reject);
        });
    }

    private async createImageFileWithSize(
        fileName: string,
        targetBytes: number,
        ext: string
    ): Promise<string> {
        await this.ensureTmpDir();
        const filePath = path.join(this.tmpDir, `${fileName}.${ext}`);

        const candidates = [
            "https://picsum.photos/4096/4096.jpg",
            "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2048&q=80",
            "https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_big.jpg",
        ];

        let base: Buffer | null = null;
        for (const url of candidates) {
            try {
                base = await this.downloadToBuffer(url);
                if (base && base.length > 0) break;
            } catch {
                continue;
            }
        }
        if (!base) {
            base = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
        }

        let out: Buffer;
        if (base.length >= targetBytes) {
            out = base.subarray(0, targetBytes);
        } else {
            const pad = Buffer.alloc(targetBytes - base.length, 0);
            out = Buffer.concat([base, pad]);
        }

        await writeFile(filePath, out);
        return filePath;
    }

    private async createGenericFileWithSize(
        fileName: string,
        targetBytes: number,
        ext: string
    ): Promise<string> {
        await this.ensureTmpDir();
        const filePath = path.join(this.tmpDir, `${fileName}.${ext}`);
        const chunk = Buffer.alloc(1024 * 1024, 0);
        const fd = fs.openSync(filePath, "w");
        let written = 0;
        try {
            while (written + chunk.length <= targetBytes) {
                fs.writeSync(fd, chunk);
                written += chunk.length;
            }
            const remaining = targetBytes - written;
            if (remaining > 0) {
                fs.writeSync(fd, Buffer.alloc(remaining, 0));
            }
        } finally {
            fs.closeSync(fd);
        }
        return filePath;
    }

    public async createFileWithSize(
        name: string,
        sizeBytes: number,
        ext: string
    ): Promise<string> {
        const imageExts = new Set(["jpg", "jpeg", "png", "gif", "webp"]);
        if (imageExts.has(ext.toLowerCase())) {
            return await this.createImageFileWithSize(name, sizeBytes, ext);
        }
        return await this.createGenericFileWithSize(name, sizeBytes, ext);
    }

    public async getFileSize(filePath: string): Promise<number> {
        return (await stat(filePath)).size;
    }

    async cleanupFiles(paths: string[]): Promise<void> {
        await Promise.race(
            paths.map((path) =>
                unlink(path).catch((err) => {
                    console.error(err);
                })
            )
        );
    }
}
