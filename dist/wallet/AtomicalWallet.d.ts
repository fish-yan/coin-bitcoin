import { SignTxParams } from "@okxweb3/coin-base";
import { BtcWallet } from "./BtcWallet";
import * as bitcoin from "../index";
import { utxoTx } from "../index";
export declare const ErrCodeLessAtomicalAmt = 2011400;
export declare const ErrCodeAtomicalChangeFail = 2011401;
export declare const ErrCodeVoutDust = 2011402;
export declare const ErrCodeCommon = 2011403;
export declare const ErrCodeUnknownAsset = 2011404;
export declare const ErrCodeMul = 2011420;
export declare class AtomicalWallet extends BtcWallet {
    convert2AtomicalTx(paramData: any): utxoTx;
    signTransaction(param: SignTxParams): Promise<any>;
    estimateFee(param: SignTxParams): Promise<number>;
}
export declare class AtomicalTestWallet extends AtomicalWallet {
    network(): bitcoin.Network;
}
