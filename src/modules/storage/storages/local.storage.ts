import Storage, { DownloadFileOptions, UploadFileOptions } from "./storage";
import path from 'node:path';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';

class LocalStorage implements Storage {
    private basePath: string;

    constructor(storagePath: string) {
        this.basePath = storagePath;
    }

    public async upload(options: UploadFileOptions): Promise<string> {
        try {
            const { file, folder } = options;

            const filePath = path.join(this.basePath, folder, file.originalname);

            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, file.buffer);

            return filePath;
        } catch (err: unknown) {
            if (err instanceof Error) {
                throw new Error(`Failed to upload file: ${err.message}`, { cause: err });
            }

            throw new Error(`Failed to upload file: ${String(err)}`);
        }
    }

    public async download(options: DownloadFileOptions): Promise<NodeJS.ReadableStream> {
        try {
            const filePath = options.sourcePath;

            return createReadStream(filePath);
        } catch (err: unknown) {
            if (err instanceof Error) {
                throw new Error(`Failed to download file: ${err.message}`, { cause: err });
            }
            throw new Error(`Failed to download file: ${String(err)}`);
        }
    }
}

export default LocalStorage;