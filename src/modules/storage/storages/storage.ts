import { File } from "../../../../generated/prisma";

export type FileOutput = Omit<File, 'path'>;

export interface UploadFileOptions {
    file: Express.Multer.File;
    folder: string;
}

export interface DownloadFileOptions {
    sourcePath: string;
}

abstract class Storage {
    abstract upload(options: UploadFileOptions): Promise<string>;
    abstract download(options: DownloadFileOptions): Promise<NodeJS.ReadableStream>;
}

export default Storage;