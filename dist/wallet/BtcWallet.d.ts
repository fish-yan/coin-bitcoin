import { BaseWallet, CalcTxHashParams, DerivePriKeyParams, GetAddressParams, GetDerivedPathParam, MpcMessageParam, MpcRawTransactionParam, MpcTransactionParam, NewAddressParams, SignTxParams, ValidAddressParams, ValidPrivateKeyData, ValidPrivateKeyParams, ValidSignedTransactionParams, VerifyMessageParams } from '@okxweb3/coin-base';
import * as bitcoin from "../index";
export declare const BITCOIN_MESSAGE_ECDSA = 0;
export declare const BITCOIN_MESSAGE_BIP0322_SIMPLE = 1;
export declare class BtcWallet extends BaseWallet {
    network(): bitcoin.Network;
    getDerivedPath(param: GetDerivedPathParam): Promise<any>;
    validPrivateKey(param: ValidPrivateKeyParams): Promise<ValidPrivateKeyData>;
    getNewAddress(param: NewAddressParams): Promise<any>;
    validAddress(param: ValidAddressParams): Promise<any>;
    signTransaction(param: SignTxParams): Promise<any>;
    getRandomPrivateKey(): Promise<any>;
    getDerivedPrivateKey(param: DerivePriKeyParams): Promise<any>;
    getAddressByPublicKey(param: GetAddressParams): Promise<any>;
    getMPCRawTransaction(param: MpcRawTransactionParam): Promise<any>;
    getMPCTransaction(param: MpcTransactionParam): Promise<any>;
    getMPCRawMessage(param: MpcRawTransactionParam): Promise<any>;
    getMPCSignedMessage(param: MpcMessageParam): Promise<any>;
    getHardWareRawTransaction(param: SignTxParams): Promise<any>;
    calcTxHash(param: CalcTxHashParams): Promise<string>;
    signMessage(param: SignTxParams): Promise<string>;
    verifyMessage(param: VerifyMessageParams): Promise<boolean>;
    static extractPsbtTransaction(txHex: string): Promise<string>;
    validSignedTransaction(param: ValidSignedTransactionParams): Promise<any>;
    estimateFee(param: SignTxParams): Promise<number>;
    static oneKeyBuildBtcTx(txData: bitcoin.utxoTx): Promise<any>;
}
export declare class TBtcWallet extends BtcWallet {
    network(): bitcoin.Network;
}
export declare function number2Hex(n: number, length: number): string;
export declare function convert2UtxoTx(utxoTx: any): bitcoin.utxoTx;
