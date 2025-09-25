import { Request, Response, Router } from "express";
import StorageService from "./storage.service";
import { Logger } from "@in.pulse-crm/utils";
import upload from "../../middlewares/multer.middleware";

const storageRoutes = Router();

class StorageController {
    constructor(router: Router) {
        router.post("/", upload.single("file"), this.handleUpload);
        router.get("/:fileId", this.handleDownload);
    }

    private handleUpload = async (req: Request, res: Response) => {
        try {
            const file = req.file;
            const folder = req.body?.folder || "public";

            if (!file) {
                return res.status(400).json({ message: "No file uploaded" });
            }

            Logger.info(`Uploading file: ${file.originalname} to folder: ${folder}`);
            const result = await StorageService.upload({ file, folder });

            return res.status(201).json(result);
        } catch (error: any) {
            return res.status(500).json({ message: error?.message });
        }
    }

    private handleDownload = async (req: Request, res: Response) => {
        try {
            const { fileId } = req.params;

            if (!fileId) {
                return res.status(400).json({ message: "File ID is required" });
            }

            Logger.info(`Downloading file with ID: ${fileId}`);
            const fileStream = await StorageService.download({ fileId });

            return fileStream.pipe(res);
        } catch (error: any) {
            return res.status(500).json({ message: error?.message });
        }
    }
}

new StorageController(storageRoutes);

export default storageRoutes;