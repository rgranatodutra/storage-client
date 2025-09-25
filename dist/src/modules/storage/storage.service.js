"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const nanoid_1 = require("nanoid");
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const prisma_1 = __importDefault(require("../../../prisma"));
const node_fs_1 = require("node:fs");
const BASE_PATH = process.env["STORAGE_BASE_PATH"] || node_path_1.default.join(process.cwd(), 'uploads');
class StorageService {
    constructor() { }
    static async upload({ file, folder }) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const uniqueId = await StorageService.getUniqueId();
        const filePath = `/${folder}/${year}/${month}/${uniqueId}`;
        const savePath = node_path_1.default.join(BASE_PATH, filePath);
        await promises_1.default.mkdir(savePath, { recursive: true });
        await promises_1.default.writeFile(`${savePath}/${file.originalname}`, file.buffer);
        const fileData = await StorageService.saveFileMetadataOnDatabase({ id: uniqueId, file, path: savePath, date: now });
        return fileData;
    }
    static async download({ fileId }) {
        const file = await prisma_1.default.file.findUnique({
            where: { id: fileId }
        });
        if (!file)
            throw new Error('File not found');
        const filePath = node_path_1.default.join(file.path, file.id, file.name);
        const fileStream = (0, node_fs_1.createReadStream)(filePath);
        return fileStream;
    }
    static async getUniqueId() {
        const id = (0, nanoid_1.nanoid)();
        const duplicated = await prisma_1.default.file.findUnique({
            where: { id }
        });
        return duplicated ? await this.getUniqueId() : id;
    }
    static async saveFileMetadataOnDatabase({ id, file, path, date }) {
        return await prisma_1.default.file.create({
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
exports.default = StorageService;
