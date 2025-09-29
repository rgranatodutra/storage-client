import "dotenv/config";
import axios, { AxiosInstance } from "axios";
import storageService from "../storage/storage.service";
import { extension } from "mime-types";

interface GetMediaURLResponse {
    url: string,
    mime_type: string,
    sha256: string,
    file_size: number,
    id: string,
    messaging_product: string
}

const BASE_GRAPH_API_URL = 'https://graph.facebook.com/v16.0';
// Enable verbose debug logs for media downloads via env DEBUG_WABA=true
const DEBUG_WABA: boolean = (process.env['DEBUG_WABA'] || '').toLowerCase() === 'true';

// Resumo compacto de erros Axios
const AXIOS_BODY_PREVIEW = 400;
function previewBody(data: any): string | undefined {
    try {
        if (data == null) return undefined;
        if (typeof data === 'string') return data.slice(0, AXIOS_BODY_PREVIEW);
        return JSON.stringify(data).slice(0, AXIOS_BODY_PREVIEW);
    } catch {
        return '[unserializable]';
    }
}

function formatAxiosError(err: unknown): string {
    if (axios.isAxiosError(err)) {
        const { config, response, code } = err;
        const method = config?.method?.toUpperCase();
        const url = config?.url;
        const status = response?.status;
        const statusText = response?.statusText;
        const contentType = response?.headers?.['content-type'] || response?.headers?.['Content-Type'];
        const responseType = config?.responseType;
        const isBinary = responseType === 'arraybuffer' || /octet-stream|image|audio|video/i.test(String(contentType || ''));
        const body = !isBinary ? previewBody(response?.data) : undefined;

        return [
            'AxiosError:',
            method && `[${method}]`,
            url,
            status != null && `status=${status}`,
            statusText && `(${statusText})`,
            code && `code=${code}`,
            contentType && `ctype=${contentType}`,
            responseType && `rtype=${responseType}`,
            body && `body=${JSON.stringify(body)}`
        ].filter(Boolean).join(' ');
    }
    if (err instanceof Error) return err.message;
    return String(err);
}

class WABAService {
    private api: AxiosInstance;

    constructor(authToken: string) {
        this.api = axios.create({
            baseURL: BASE_GRAPH_API_URL,
            timeout: 10000,
        });

        console.log("WABA Token:", authToken);
        this.api.defaults.headers["Authorization"] = `Bearer ${authToken}`;
    }

    public async downloadMediaAndStore(id: string, filename?: string) {
        const file = await this.downloadMedia(id, filename);
        const uploadedFile = await storageService.upload({ file, folder: 'waba' });

        return uploadedFile;
    }

    public async downloadMedia(id: string, filename?: string) {
        const startedAt = Date.now();
        if (DEBUG_WABA) console.debug(`[WABA] downloadMedia:start id=${id} filename=${filename ?? '(auto)'}`);

        try {
            const data = await this.fetchMediaMetadata(id);
            let urlHost = '';
            try { urlHost = new URL(data.url).host; } catch { /* ignore */ }

            if (DEBUG_WABA) {
                console.debug(`[WABA] downloadMedia:metadata id=${id} mime=${data.mime_type} size=${data.file_size} sha256=${(data.sha256 || '').slice(0, 8)}… host=${urlHost}`);
                console.debug(`[WABA] downloadMedia:requesting-bytes id=${id} host=${urlHost}`);
            }

            const response = await this.api.get(data.url, { responseType: 'arraybuffer' });

            if (DEBUG_WABA) {
                const byteLen = (response.data as ArrayBuffer)?.byteLength ?? 0;
                console.debug(`[WABA] downloadMedia:received id=${id} status=${response.status} bytes=${byteLen}`);
            }

            const ext = extension(data.mime_type);
            filename = filename || `${id}.${ext || 'bin'}`;

            if (DEBUG_WABA) console.debug(`[WABA] downloadMedia:resolved-filename id=${id} filename=${filename}`);

            const file: Express.Multer.File = {
                buffer: Buffer.from(response.data),
                destination: '',
                fieldname: '',
                filename,
                mimetype: data.mime_type,
                originalname: filename,
                path: '',
                size: data.file_size,
                stream: null as any,
                encoding: '7bit'
            }

            if (DEBUG_WABA) console.debug(`[WABA] downloadMedia:done id=${id} size=${file.size} mime=${file.mimetype} elapsedMs=${Date.now() - startedAt}`);

            return file;
        } catch (err: any) {
            const msg = formatAxiosError(err);
            if (DEBUG_WABA) console.error(`[WABA] downloadMedia:error id=${id} ${msg}`);
            throw new Error(`Failed to download media: ${msg}`);
        }
    }

    public async fetchMediaMetadata(id: string) {
        try {
            const response = await this.api.get<GetMediaURLResponse>(`/${id}`);
            return response.data;
        } catch (err: unknown) {
            const msg = formatAxiosError(err);
            if (DEBUG_WABA) console.error(`[WABA] fetchMediaMetadata:error id=${id} ${msg}`);
            throw new Error(`Failed to get media URL: ${msg}`);
        }
    }
}

export default new WABAService(process.env['WABA_TOKEN'] || '');