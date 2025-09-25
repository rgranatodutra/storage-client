"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const storage_service_1 = __importDefault(require("./storage.service"));
const storageRoutes = (0, express_1.Router)();
class StorageController {
    constructor(router) {
        router.post("/", this.handleUpload);
        router.get("/:fileId", this.handleDownload);
    }
    handleUpload = async (req, res) => {
        try {
            const file = req.file;
            const folder = req.body.folder || "public";
            if (!file) {
                return res.status(400).json({ message: "No file uploaded" });
            }
            const result = await storage_service_1.default.upload({ file, folder });
            return res.status(201).json(result);
        }
        catch (error) {
            return res.status(500).json({ message: error?.message });
        }
    };
    handleDownload = async (req, res) => {
        try {
            const { fileId } = req.params;
            if (!fileId) {
                return res.status(400).json({ message: "File ID is required" });
            }
            const fileStream = await storage_service_1.default.download({ fileId });
            return fileStream.pipe(res);
        }
        catch (error) {
            return res.status(500).json({ message: error?.message });
        }
    };
}
new StorageController(storageRoutes);
exports.default = storageRoutes;
