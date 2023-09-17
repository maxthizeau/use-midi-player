export declare class Logger {
    enabled: boolean;
    log(...args: any): void;
    warn(...args: any): void;
    error(...args: any): void;
}
export declare const logger: Logger;
