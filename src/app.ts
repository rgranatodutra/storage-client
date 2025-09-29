import { Logger, logRoutes } from '@in.pulse-crm/utils';
import cors from 'cors';
import "dotenv/config";
import express, { NextFunction, Request, Response } from 'express';
import storageRoutes from './modules/storage/storage.controller';
import wabaRoutes from './modules/waba/waba.controller';

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/storage", storageRoutes);
app.use("/api/waba", wabaRoutes);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    Logger.error("Internal server error", err);
    res.status(500).send({ message: "Internal server error", cause: err });
});

const LISTEN_PORT = Number(process.env["LISTEN_PORT"]) || 3001;

app.listen(LISTEN_PORT, () => {
    logRoutes("/api/storage", [storageRoutes]);
    logRoutes("/api/waba", [wabaRoutes]);
    console.log("Server is running on port ", LISTEN_PORT);
});
