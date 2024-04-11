export declare class RuneId {
    block: number;
    tx: number;
    constructor(block: number, tx: number);
    delta(next: RuneId): RuneId;
    get(): number;
    next(block: number, tx: number): RuneId;
    toString(): string;
    static fromString(s: string): RuneId | undefined;
}
