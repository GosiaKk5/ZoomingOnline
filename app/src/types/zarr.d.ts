// Type declarations for zarr module
declare module 'zarr' {
    export class HTTPStore {
        constructor(url: string);
    }
    
    export function openGroup(store: any): Promise<any>;
    export function openArray(options: { store: any; path: string }): Promise<any>;
    export function slice(start: number, end?: number): any;
    
    // Add other zarr types as needed
    export interface ZarrArray {
        shape: number[];
        meta: {
            chunks: number[];
        };
        get(indices: any[]): Promise<{ data: any }>;
    }
}