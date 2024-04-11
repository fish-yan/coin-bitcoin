"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AtomicalTestWallet = exports.AtomicalWallet = exports.ErrCodeMul = exports.ErrCodeUnknownAsset = exports.ErrCodeCommon = exports.ErrCodeVoutDust = exports.ErrCodeAtomicalChangeFail = exports.ErrCodeLessAtomicalAmt = void 0;
const coin_base_1 = require("@okxweb3/coin-base");
const BtcWallet_1 = require("./BtcWallet");
const bitcoin = __importStar(require("../index"));
const index_1 = require("../index");
exports.ErrCodeLessAtomicalAmt = 2011400;
exports.ErrCodeAtomicalChangeFail = 2011401;
exports.ErrCodeVoutDust = 2011402;
exports.ErrCodeCommon = 2011403;
exports.ErrCodeUnknownAsset = 2011404;
exports.ErrCodeMul = 2011420;
class AtomicalWallet extends BtcWallet_1.BtcWallet {
    convert2AtomicalTx(paramData) {
        const clonedParamData = (0, coin_base_1.cloneObject)(paramData);
        const atomicalInputMap = new Map();
        const atomicalTypeMap = new Map();
        const atomicalSendMap = new Map();
        let txOutput = [];
        const feePerB = clonedParamData.feePerB || 10;
        const dustSize = clonedParamData.dustSize || 546;
        let inputs = clonedParamData.inputs;
        for (const input of inputs) {
            let dataArray = input.data;
            if (dataArray != null && dataArray instanceof Array) {
                for (const data of dataArray) {
                    let atomicalId = data["atomicalId"];
                    let atomicalIdType = data["type"];
                    let atomicalAmount = input.amount;
                    if (atomicalId == null || atomicalAmount == null || atomicalIdType == null) {
                        continue;
                    }
                    if (atomicalIdType != "FT" && atomicalIdType != "NFT") {
                        continue;
                    }
                    if (atomicalTypeMap.get(atomicalId) == null) {
                        atomicalTypeMap.set(atomicalId, atomicalIdType);
                    }
                    let beforeAmount = atomicalInputMap.get(atomicalId);
                    if (beforeAmount == null) {
                        atomicalInputMap.set(atomicalId, atomicalAmount);
                    }
                    else {
                        atomicalInputMap.set(atomicalId, beforeAmount + atomicalAmount);
                    }
                }
            }
            if (Object.keys(atomicalInputMap).length > 1) {
                throw new Error(JSON.stringify({ errCode: exports.ErrCodeMul }));
            }
        }
        let outputs = clonedParamData.outputs;
        for (const output of outputs) {
            let dataArray = output.data;
            if (dataArray != null && dataArray instanceof Array) {
                for (const data of dataArray) {
                    let atomicalId = data["atomicalId"];
                    let atomicalAmount = output.amount;
                    let atomicalIdType = data["type"];
                    if (atomicalId == null || atomicalAmount == null || atomicalIdType == null) {
                        continue;
                    }
                    if (atomicalIdType != "FT" && atomicalIdType != "NFT") {
                        continue;
                    }
                    if (atomicalTypeMap.get(atomicalId) != atomicalIdType) {
                        throw new Error(JSON.stringify({ errCode: exports.ErrCodeUnknownAsset }));
                    }
                    let beforeAmount = atomicalSendMap.get(atomicalId);
                    if (beforeAmount == null) {
                        atomicalSendMap.set(atomicalId, atomicalAmount);
                    }
                    else {
                        atomicalSendMap.set(atomicalId, beforeAmount + atomicalAmount);
                        if (atomicalIdType == "NFT") {
                            throw new Error(JSON.stringify({ errCode: exports.ErrCodeMul }));
                        }
                    }
                }
            }
            if (Object.keys(atomicalSendMap).length > 1) {
                throw new Error(JSON.stringify({ errCode: exports.ErrCodeMul }));
            }
            txOutput.push({
                amount: output.amount,
                address: output.address,
            });
        }
        let isAtomicalChange = false;
        for (const atomicalId of atomicalInputMap.keys()) {
            let inputAmount = atomicalInputMap.get(atomicalId);
            let sendAmount = atomicalSendMap.get(atomicalId);
            if (atomicalTypeMap.get(atomicalId) == "FT") {
                if (sendAmount == null) {
                    throw new Error(JSON.stringify({ errCode: exports.ErrCodeCommon }));
                }
                if (inputAmount != null && sendAmount != null && inputAmount > sendAmount) {
                    isAtomicalChange = true;
                    let changeAmount = inputAmount - sendAmount;
                    if (changeAmount < dustSize) {
                        throw new Error(JSON.stringify({
                            errCode: exports.ErrCodeAtomicalChangeFail,
                            date: {
                                atomicalId: atomicalId,
                                amount: inputAmount - sendAmount
                            }
                        }));
                    }
                    txOutput.push({
                        address: clonedParamData.address,
                        amount: changeAmount
                    });
                }
                else if (inputAmount != null && sendAmount != null && inputAmount < sendAmount) {
                    throw new Error(JSON.stringify({
                        errCode: exports.ErrCodeLessAtomicalAmt,
                        date: {
                            atomicalId: atomicalId,
                            amount: inputAmount - sendAmount
                        }
                    }));
                }
            }
            else if (atomicalTypeMap.get(atomicalId) == "NFT") {
                if (sendAmount == null) {
                    throw new Error(JSON.stringify({ errCode: exports.ErrCodeCommon }));
                }
            }
        }
        for (const [index, curUtxo] of txOutput.entries()) {
            if (curUtxo.amount < dustSize) {
                throw new Error(JSON.stringify({ errCode: exports.ErrCodeVoutDust, vOut: index }));
            }
        }
        return {
            inputs: clonedParamData.inputs,
            outputs: txOutput,
            address: clonedParamData.address,
            feePerB: feePerB,
        };
    }
    async signTransaction(param) {
        const network = this.network();
        let txHex = null;
        try {
            const privateKey = param.privateKey;
            const atomicalTx = this.convert2AtomicalTx(param.data);
            txHex = (0, index_1.signBtc)(atomicalTx, privateKey, network);
            return Promise.resolve(txHex);
        }
        catch (e) {
            return Promise.reject(e);
        }
    }
    async estimateFee(param) {
        try {
            const atomicalTx = this.convert2AtomicalTx(param.data);
            const fee = bitcoin.estimateBtcFee(atomicalTx, this.network());
            return Promise.resolve(fee);
        }
        catch (e) {
            return Promise.reject(e);
        }
    }
}
exports.AtomicalWallet = AtomicalWallet;
class AtomicalTestWallet extends AtomicalWallet {
    network() {
        return bitcoin.networks.testnet;
    }
}
exports.AtomicalTestWallet = AtomicalTestWallet;
//# sourceMappingURL=AtomicalWallet.js.map