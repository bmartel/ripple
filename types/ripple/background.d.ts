export interface BackgroundRequestInit extends RequestInit {
    refetch?: number;
}
export interface BackgroundResponse<T = Record<string, any> | Array<any> | string> {
    readonly headers: Record<string, any>;
    readonly ok: boolean;
    readonly redirected: boolean;
    readonly status: number;
    readonly statusText: string;
    readonly body?: T;
}
export interface BackgroundFetch extends BackgroundRequestInit {
    url: RequestInfo | URL;
    onFetch: (res: Response) => void;
}
export declare const initWorker: (worker: () => Promise<new () => Worker>) => void;
export declare const backgroundFetch: (input: RequestInfo | URL, onFetch: (res: Response) => void, init?: BackgroundRequestInit | undefined) => void;
export declare const cancelBackgroundFetch: (input: RequestInfo | URL, init?: BackgroundRequestInit | undefined) => void;
