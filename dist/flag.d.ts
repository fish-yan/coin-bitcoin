export declare enum Flag {
    Etching = 0,
    Terms = 1,
    Cenotaph = 127
}
export declare const FlagUtils: {
    mask: (self: Flag) => bigint;
    take: (self: Flag, flags: bigint) => boolean;
    set: (self: Flag, flags: bigint) => bigint;
};
export declare const FlagFromBigInt: {
    [key: number]: bigint;
};
export declare const FlagFromBigIntValues: {
    [key: number]: bigint;
};
export declare function fromFlag(flag: Flag): bigint;
