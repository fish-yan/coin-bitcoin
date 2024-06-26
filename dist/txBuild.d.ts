/// <reference types="node" />
import * as bitcoin from "./bitcoinjs-lib";
import { Network } from "./bitcoinjs-lib";
import { utxoTx } from "./type";
export declare const Array: any;
export type AddressType = "legacy" | "segwit_native" | "segwit_nested" | "segwit_taproot";
export declare function privateKeyFromWIF(wifString: string, network?: bitcoin.Network | bitcoin.Network[]): string;
export declare function private2public(privateKey: string): Buffer;
export declare function sign(hash: Buffer, privateKey: string): Buffer;
export declare function wif2Public(wif: string, network?: bitcoin.Network | bitcoin.Network[]): Buffer;
export declare function private2Wif(privateKey: Buffer, network?: bitcoin.Network): string;
export declare class TxBuild {
    tx: bitcoin.Transaction;
    network: bitcoin.Network;
    inputs: Input[];
    outputs: Output[];
    bitcoinCash: boolean;
    hardware: boolean;
    constructor(version?: number, network?: bitcoin.Network, bitcoinCash?: boolean, hardware?: boolean);
    addInput(txId: string, index: number, privateKey: string, address: string, script?: string, value?: number, publicKey?: string, sequence?: number): void;
    addOutput(address: string, value: number, omniScript?: string): void;
    build(hashArray?: string[]): string;
}
interface Input {
    txId: string;
    index: number;
    script?: string;
    privateKey: string;
    value?: number;
    address: string;
    publicKey?: string;
    sequence?: number;
}
interface Output {
    address: string;
    value: number;
    omniScript?: string;
}
export declare function signBtc(utxoTx: utxoTx, privateKey: string, network?: bitcoin.Network, hashArray?: string[], hardware?: boolean, changeOnly?: boolean): string;
export declare function getAddressType(address: string, network: bitcoin.Network): AddressType;
export declare function signBch(utxoTx: utxoTx, privateKey: string, network?: bitcoin.Network, hashArray?: string[], hardware?: boolean): string;
export declare function getMPCTransaction(raw: string, sigs: string[], bitcoinCash: boolean): string;
export declare function ValidSignedTransaction(signedTx: string, utxoInputs?: [], network?: Network): bitcoin.Transaction;
export declare function estimateBtcFee(utxoTx: utxoTx, network?: bitcoin.Network): number;
export declare function estimateBchFee(utxoTx: utxoTx, network?: bitcoin.Network): number;
export {};
