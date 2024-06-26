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
exports.RuneTestWallet = exports.RuneWallet = void 0;
const coin_base_1 = require("@okxweb3/coin-base");
const BtcWallet_1 = require("./BtcWallet");
const bitcoin = __importStar(require("../index"));
const index_1 = require("../index");
const runestone_1 = require("../runestone");
const crypto_lib_1 = require("@okxweb3/crypto-lib");
const rune_id_1 = require("../rune_id");
class RuneWallet extends BtcWallet_1.BtcWallet {
    convert2RuneTx(paramData) {
        const clonedParamData = (0, coin_base_1.cloneObject)(paramData);
        for (let input of clonedParamData.inputs) {
            let dataArray = input.data;
            if (dataArray != null && dataArray instanceof Array) {
                for (let data of dataArray) {
                    if (typeof data["amount"] === "string") {
                        data["amount"] = BigInt(data["amount"]);
                    }
                }
            }
        }
        for (let output of clonedParamData.outputs) {
            let data = output.data;
            if (data != null) {
                if (typeof data["amount"] === "string") {
                    data["amount"] = BigInt(data["amount"]);
                }
            }
        }
        let inputs = clonedParamData.inputs;
        const runeInputMap = new Map();
        for (const input of inputs) {
            let dataArray = input.data;
            if (dataArray != null && dataArray instanceof Array) {
                for (const data of dataArray) {
                    let runeId = data["id"];
                    let runeAmount = BigInt(data["amount"]);
                    if (runeId == null || runeAmount == null) {
                        continue;
                    }
                    let beforeAmount = runeInputMap.get(runeId);
                    if (beforeAmount == null) {
                        runeInputMap.set(runeId, runeAmount);
                    }
                    else {
                        runeInputMap.set(runeId, (BigInt(beforeAmount) + BigInt(runeAmount)));
                    }
                }
            }
        }
        let outputs = clonedParamData.outputs;
        const runeSendMap = new Map();
        for (const output of outputs) {
            let data = output.data;
            if (data != null) {
                let runeId = data["id"];
                let runeAmount = BigInt(data["amount"]);
                if (runeId == null || runeAmount == null) {
                    continue;
                }
                let beforeAmount = runeSendMap.get(runeId);
                if (beforeAmount == null) {
                    runeSendMap.set(runeId, runeAmount);
                }
                else {
                    runeSendMap.set(runeId, (BigInt(beforeAmount) + BigInt(runeAmount)));
                }
            }
        }
        let isRuneChange = false;
        let firstAddress = outputs.length > 0 ? outputs[0].address : null;
        if (firstAddress !== clonedParamData.address) {
            for (const id of runeInputMap.keys()) {
                let inputAmount = runeInputMap.get(id);
                let sendAmount = runeSendMap.get(id);
                if ((inputAmount != null && sendAmount != null && inputAmount > sendAmount) || (inputAmount != null && sendAmount == null)) {
                    isRuneChange = true;
                }
            }
        }
        let outputIndex = 0;
        let updateOutputs = [];
        if (isRuneChange) {
            let runeChange = {
                address: clonedParamData.address,
                amount: 546
            };
            updateOutputs.push(runeChange);
            outputIndex++;
        }
        const typedEdicts = [];
        for (const output of outputs) {
            let data = output.data;
            if (data != null) {
                let runeId = rune_id_1.RuneId.fromString(data["id"]);
                let runeAmount = BigInt(data["amount"]);
                if (runeId == null || runeAmount == null) {
                    continue;
                }
                const typedEdict = {
                    id: runeId,
                    amount: BigInt(runeAmount),
                    output: outputIndex,
                };
                typedEdicts.push(typedEdict);
            }
            output.data = null;
            updateOutputs.push(output);
            outputIndex++;
        }
        let mint;
        if (clonedParamData.runeData.mint != null) {
            mint = rune_id_1.RuneId.fromString(clonedParamData.runeData.mint);
        }
        return {
            inputs: clonedParamData.inputs,
            outputs: updateOutputs,
            address: clonedParamData.address,
            feePerB: clonedParamData.feePerB,
            runeData: {
                edicts: typedEdicts,
                etching: clonedParamData.runeData.etching,
                mint: mint,
                pointer: clonedParamData.runeData.pointer,
                burn: clonedParamData.runeData.burn
            },
        };
    }
    async signTransaction(param) {
        const network = this.network();
        let txHex = null;
        try {
            const privateKey = param.privateKey;
            if (!param.data.runeData) {
                return Promise.reject("missing runeData");
            }
            const runeTx = this.convert2RuneTx(param.data);
            const opReturnOutput = this.getOpReturnOutput(network, runeTx.runeData);
            runeTx.outputs.push(opReturnOutput);
            txHex = (0, index_1.signBtc)(runeTx, privateKey, network);
            return Promise.resolve(txHex);
        }
        catch (e) {
            return Promise.reject(e);
        }
    }
    getOpReturnOutput(network, runeData) {
        let isMainnet = false;
        if (index_1.networks.bitcoin === network) {
            isMainnet = true;
        }
        const opReturnScript = (0, runestone_1.buildRuneData)(isMainnet, runeData);
        const opReturnOutput = { address: '', amount: 0, omniScript: crypto_lib_1.base.toHex(opReturnScript) };
        return opReturnOutput;
    }
    async estimateFee(param) {
        try {
            if (!param.data.runeData) {
                return Promise.reject("missing runeData");
            }
            const runeTx = this.convert2RuneTx(param.data);
            const opReturnOutput = this.getOpReturnOutput(this.network(), runeTx.runeData);
            runeTx.outputs.push(opReturnOutput);
            const fee = bitcoin.estimateBtcFee(runeTx, this.network());
            return Promise.resolve(fee);
        }
        catch (e) {
            return Promise.reject(e);
        }
    }
}
exports.RuneWallet = RuneWallet;
class RuneTestWallet extends RuneWallet {
    network() {
        return bitcoin.networks.testnet;
    }
}
exports.RuneTestWallet = RuneTestWallet;
//# sourceMappingURL=RuneWallet.js.map