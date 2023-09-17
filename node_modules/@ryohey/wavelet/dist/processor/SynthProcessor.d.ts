export declare class SynthProcessor extends AudioWorkletProcessor {
    private readonly synth;
    constructor();
    process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean;
}
