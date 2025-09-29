import { Request, Response, Router } from "express";
import wabaService from "./waba.service";
import { Logger } from "@in.pulse-crm/utils";

const wabaRoutes = Router();

class WABAController {
    constructor(router: Router) {
        router.get("/media/:id", this.handleGetMedia);
    }

    private handleGetMedia = async (req: Request, res: Response) => {
        try {

            Logger.info("Fetching media URL from WABA");

            const { id } = req.params;
            const { filename } = req.query;

            if (!id) {
                return res.status(400).json({ message: "Media ID is required" });
            }
            const data = await wabaService.downloadMediaAndStore(id, filename as string | undefined);
            return res.status(200).json({ message: "Media URL fetched successfully", data });
        }
        catch (error: any) {
            return res.status(500).json({ message: error?.message });
        }
    }
}

new WABAController(wabaRoutes);

export default wabaRoutes;