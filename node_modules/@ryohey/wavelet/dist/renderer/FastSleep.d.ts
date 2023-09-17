export declare class FastSleep {
    private readonly channel;
    private promiseResolver;
    constructor();
    wait(): Promise<void>;
}
