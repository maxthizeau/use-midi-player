import { CompleteMessage, ProgressMessage } from "./message";
declare global {
    function postMessage(message: ProgressMessage | CompleteMessage, transfer?: Transferable[] | undefined): void;
}
