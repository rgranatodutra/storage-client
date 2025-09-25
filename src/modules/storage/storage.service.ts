import "dotenv/config";
import { nanoid } from 'nanoid';
import fs from 'node:fs/promises';
import path from 'node:path';
import prisma from '../../../prisma';
import { createReadStream } from 'node:fs';
import { Logger } from "@in.pulse-crm/utils";

interface UploadFileOptions {
    file: Express.Multer.File;
    folder: string;
}

interface DownloadFileOptions {
    fileId: string;
}

interface SaveFileOnDatabaseOptions {
    id: string;
    file: Express.Multer.File;
    path: string;
    date: Date;
}

const BASE_PATH = process.env["STORAGE_PATH"] || path.join(process.cwd(), 'uploads');
Logger.info(`Storage base path: ${BASE_PATH}`);

class StorageService {
    private constructor() { }

    public static async upload({ file, folder }: UploadFileOptions) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');

        const uniqueId = await StorageService.getUniqueId();
        const filePath = `/${folder}/${year}/${month}/${uniqueId}`;
        const savePath = path.join(BASE_PATH, filePath);

        await fs.mkdir(savePath, { recursive: true });
        await fs.writeFile(`${savePath}/${file.originalname}`, file.buffer);
        const fileData = await StorageService.saveFileMetadataOnDatabase({ id: uniqueId, file, path: savePath, date: now });

        return fileData;
    }

    public static async download({ fileId }: DownloadFileOptions) {
        const file = await prisma.file.findUnique({
            where: { id: fileId }
        });
        if (!file) throw new Error('File not found');
        const filePath = path.join(file.path, file.name);
        const fileStream = createReadStream(filePath);

        return fileStream;
    }

    private static async getUniqueId(): Promise<string> {
        const id = nanoid();

        const duplicated = await prisma.file.findUnique({
            where: { id }
        })

        return duplicated ? await this.getUniqueId() : id;
    }

    private static async saveFileMetadataOnDatabase({ id, file, path, date }: SaveFileOnDatabaseOptions) {
        return await prisma.file.create({
            data: {
                id,
                name: file.originalname,
                type: file.mimetype,
                size: file.size,
                date,
                path,
            },
            omit: {
                path: true,
            }
        });
    }
}

export default StorageService;