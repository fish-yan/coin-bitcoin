import { Psbt } from "./bitcoinjs-lib/psbt";
import { Network } from './bitcoinjs-lib';
import { BuyingData, ListingData, signPsbtOptions, toSignInput, utxoTx } from './type';
export declare function buildPsbt(tx: utxoTx, network?: Network, maximumFeeRate?: number): string;
export declare function classicToPsbt(tx: utxoTx, network?: Network, maximumFeeRate?: number): Psbt;
export declare function psbtSign(psbtBase64: string, privateKey: string, network?: Network, maximumFeeRate?: number): string;
export declare function signPsbtWithKeyPathAndScriptPathBatch(psbtHexs: string[], privateKey: string, network?: Network, opts?: signPsbtOptions[]): string[];
export declare function signPsbtWithKeyPathAndScriptPath(psbtStr: string, privateKey: string, network?: Network, opts?: signPsbtOptions): string;
export declare function signPsbtWithKeyPathAndScriptPathImpl(psbt: Psbt, privateKey: string, network?: Network, autoFinalized?: boolean, signInputs?: toSignInput[]): void;
export declare function psbtSignImpl(psbt: Psbt, privateKey: string, network?: Network): void;
export declare function extractPsbtTransaction(txHex: string, network?: Network, maximumFeeRate?: number): string;
export declare function generateUnsignedListingPsbt(listingData: ListingData, network?: Network, publicKey?: string): string;
export declare function generateSignedListingPsbt(listingData: ListingData, privateKey: string, network?: Network): string;
export declare function generateUnsignedBuyingPsbt(buyingData: BuyingData, network?: Network, publicKey?: string): string;
export declare function mergeSignedBuyingPsbt(signedBuyingPsbt: string, signedListingPsbts: string[]): Psbt;
export declare function generateSignedBuyingTx(buyingData: BuyingData, privateKey: string, network?: Network): string;
export declare function generateMPCUnsignedListingPSBT(psbtBase64: string, pubKeyHex: string, network?: Network): {
    psbtBase64: string;
    signHashList: string[];
};
export declare function generateMPCSignedListingPSBT(psbtBase64: string, pubKeyHex: string, signature: string, network?: Network): string;
export declare function generateMPCUnsignedBuyingPSBT(psbtBase64: string, pubKeyHex: string, network?: Network, batchSize?: number): {
    psbtBase64: string;
    signHashList: string[];
};
export declare function generateMPCSignedBuyingTx(psbtBase64: string, pubKeyHex: string, signatureList: string[], network?: Network, batchSize?: number): string;
export declare function generateMPCUnsignedPSBT(psbtStr: string, pubKeyHex: string, network?: Network): {
    psbtStr: string;
    signHashList: string[];
};
export declare function generateMPCSignedPSBT(psbtStr: string, pubKeyHex: string, signatureList: string[], network?: Network): string;
