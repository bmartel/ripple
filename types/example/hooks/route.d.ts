export interface Route {
    ready: boolean;
    params: any;
    query: any;
}
export declare const useRouteProvider: (_params: any) => Route;
export declare const useRoute: () => Route;
