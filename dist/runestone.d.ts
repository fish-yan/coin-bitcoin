/// <reference types="node" />
import * as bitcoin from './bitcoinjs-lib';
import { Edict, RuneData, Etching } from "./type";
import { RuneId } from './rune_id';
export declare class RuneStone {
    constructor(edicts: Edict[], etching?: Etching, mint?: RuneId, pointer?: number);
    payload(transaction: bitcoin.Transaction): Buffer | null;
}
export declare function buildRuneData(isMainnet: boolean, runeData: RuneData): Buffer;
export declare class Message {
    fields: Map<bigint, bigint>;
    edicts: Edict[];
    constructor(fields: Map<bigint, bigint>, edicts: Edict[]);
    static fromIntegers(payload: bigint[]): Message;
}
