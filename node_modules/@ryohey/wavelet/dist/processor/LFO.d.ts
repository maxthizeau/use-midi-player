export declare class LFO {
    frequency: number;
    private phase;
    private readonly sampleRate;
    constructor(sampleRate: number);
    getValue(bufferSize: number): number;
}
