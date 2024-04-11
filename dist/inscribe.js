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
exports.inscribeForMPCSigned = exports.inscribeForMPCUnsigned = exports.inscribe = exports.InscriptionTool = void 0;
const bitcoin = __importStar(require("./bitcoinjs-lib"));
const crypto_lib_1 = require("@okxweb3/crypto-lib");
const taproot = __importStar(require("./taproot"));
const bcrypto = __importStar(require("./bitcoinjs-lib/crypto"));
const transaction_1 = require("./bitcoinjs-lib/transaction");
const txBuild_1 = require("./txBuild");
const psbtutils_1 = require("./bitcoinjs-lib/psbt/psbtutils");
const schnorr = crypto_lib_1.signUtil.schnorr.secp256k1.schnorr;
const defaultTxVersion = 2;
const defaultSequenceNum = 0xfffffffd;
const defaultRevealOutValue = 546;
const defaultMinChangeValue = 546;
const maxStandardTxWeight = 4000000 / 10;
class InscriptionTool {
    constructor() {
        this.network = bitcoin.networks.bitcoin;
        this.inscriptionTxCtxDataList = [];
        this.revealTxs = [];
        this.commitTx = new bitcoin.Transaction();
        this.commitTxPrevOutputFetcher = [];
        this.revealTxPrevOutputFetcher = [];
        this.mustCommitTxFee = 0;
        this.mustRevealTxFees = [];
        this.commitAddrs = [];
    }
    static newInscriptionTool(network, request) {
        const tool = new InscriptionTool();
        tool.network = network;
        const revealOutValue = request.revealOutValue || defaultRevealOutValue;
        const minChangeValue = request.minChangeValue || defaultMinChangeValue;
        const privateKey = request.commitTxPrevOutputList[0].privateKey;
        request.inscriptionDataList.forEach(inscriptionData => {
            tool.inscriptionTxCtxDataList.push(createInscriptionTxCtxData(network, inscriptionData, privateKey));
        });
        const totalRevealPrevOutputValue = tool.buildEmptyRevealTx(network, revealOutValue, request.revealFeeRate);
        const insufficient = tool.buildCommitTx(network, request.commitTxPrevOutputList, request.changeAddress, totalRevealPrevOutputValue, request.commitFeeRate, minChangeValue);
        if (insufficient) {
            return tool;
        }
        tool.signCommitTx(request.commitTxPrevOutputList);
        tool.completeRevealTx();
        return tool;
    }
    buildEmptyRevealTx(network, revealOutValue, revealFeeRate) {
        let totalPrevOutputValue = 0;
        const revealTxs = [];
        const mustRevealTxFees = [];
        const commitAddrs = [];
        this.inscriptionTxCtxDataList.forEach((inscriptionTxCtxData, i) => {
            const tx = new bitcoin.Transaction();
            tx.version = defaultTxVersion;
            tx.addInput(Buffer.alloc(32), i, defaultSequenceNum);
            tx.addOutput(inscriptionTxCtxData.revealPkScript, revealOutValue);
            const emptySignature = Buffer.alloc(64);
            const emptyControlBlockWitness = Buffer.alloc(33);
            const txWitness = [];
            txWitness.push(emptySignature);
            txWitness.push(inscriptionTxCtxData.inscriptionScript);
            txWitness.push(emptyControlBlockWitness);
            const fee = Math.floor((tx.byteLength() + Math.floor(((0, transaction_1.vectorSize)(txWitness) + 2 + 3) / 4)) * revealFeeRate);
            const prevOutputValue = revealOutValue + fee;
            inscriptionTxCtxData.revealTxPrevOutput = {
                pkScript: inscriptionTxCtxData.commitTxAddressPkScript,
                value: prevOutputValue,
            };
            totalPrevOutputValue += prevOutputValue;
            revealTxs.push(tx);
            mustRevealTxFees.push(fee);
            commitAddrs.push(inscriptionTxCtxData.commitTxAddress);
        });
        this.revealTxs = revealTxs;
        this.mustRevealTxFees = mustRevealTxFees;
        this.commitAddrs = commitAddrs;
        return totalPrevOutputValue;
    }
    buildCommitTx(network, commitTxPrevOutputList, changeAddress, totalRevealPrevOutputValue, commitFeeRate, minChangeValue) {
        let totalSenderAmount = 0;
        const tx = new bitcoin.Transaction();
        tx.version = defaultTxVersion;
        commitTxPrevOutputList.forEach(commitTxPrevOutput => {
            const hash = crypto_lib_1.base.reverseBuffer(crypto_lib_1.base.fromHex(commitTxPrevOutput.txId));
            tx.addInput(hash, commitTxPrevOutput.vOut, defaultSequenceNum);
            this.commitTxPrevOutputFetcher.push(commitTxPrevOutput.amount);
            totalSenderAmount += commitTxPrevOutput.amount;
        });
        this.inscriptionTxCtxDataList.forEach(inscriptionTxCtxData => {
            tx.addOutput(inscriptionTxCtxData.revealTxPrevOutput.pkScript, inscriptionTxCtxData.revealTxPrevOutput.value);
        });
        const changePkScript = bitcoin.address.toOutputScript(changeAddress, network);
        tx.addOutput(changePkScript, 0);
        const txForEstimate = tx.clone();
        signTx(txForEstimate, commitTxPrevOutputList, this.network);
        const fee = Math.floor(txForEstimate.virtualSize() * commitFeeRate);
        const changeAmount = totalSenderAmount - totalRevealPrevOutputValue - fee;
        if (changeAmount >= minChangeValue) {
            tx.outs[tx.outs.length - 1].value = changeAmount;
        }
        else {
            tx.outs = tx.outs.slice(0, tx.outs.length - 1);
            txForEstimate.outs = txForEstimate.outs.slice(0, txForEstimate.outs.length - 1);
            const feeWithoutChange = Math.floor(txForEstimate.virtualSize() * commitFeeRate);
            if (totalSenderAmount - totalRevealPrevOutputValue - feeWithoutChange < 0) {
                this.mustCommitTxFee = fee;
                return true;
            }
        }
        this.commitTx = tx;
        return false;
    }
    signCommitTx(commitTxPrevOutputList) {
        signTx(this.commitTx, commitTxPrevOutputList, this.network);
    }
    completeRevealTx() {
        this.revealTxs.forEach((revealTx, i) => {
            revealTx.ins[0].hash = this.commitTx.getHash();
            const prevOutScripts = [this.inscriptionTxCtxDataList[i].revealTxPrevOutput.pkScript];
            const values = [this.inscriptionTxCtxDataList[i].revealTxPrevOutput.value];
            this.revealTxPrevOutputFetcher.push(this.inscriptionTxCtxDataList[i].revealTxPrevOutput.value);
            const hash = revealTx.hashForWitnessV1(0, prevOutScripts, values, bitcoin.Transaction.SIGHASH_DEFAULT, this.inscriptionTxCtxDataList[i].hash);
            const signature = Buffer.from(schnorr.sign(hash, this.inscriptionTxCtxDataList[i].privateKey, crypto_lib_1.base.randomBytes(32)));
            revealTx.ins[0].witness = [Buffer.from(signature), ...this.inscriptionTxCtxDataList[i].witness];
            const revealWeight = revealTx.weight();
            if (revealWeight > maxStandardTxWeight) {
                throw new Error(`reveal(index ${i}) transaction weight greater than ${maxStandardTxWeight} (MAX_STANDARD_TX_WEIGHT): ${revealWeight}`);
            }
        });
    }
    calculateFee() {
        let commitTxFee = 0;
        this.commitTx.ins.forEach((_, i) => {
            commitTxFee += this.commitTxPrevOutputFetcher[i];
        });
        this.commitTx.outs.forEach(out => {
            commitTxFee -= out.value;
        });
        let revealTxFees = [];
        this.revealTxs.forEach((revealTx, i) => {
            let revealTxFee = 0;
            revealTxFee += this.revealTxPrevOutputFetcher[i];
            revealTxFee -= revealTx.outs[0].value;
            revealTxFees.push(revealTxFee);
        });
        return {
            commitTxFee,
            revealTxFees,
        };
    }
}
exports.InscriptionTool = InscriptionTool;
function signTx(tx, commitTxPrevOutputList, network) {
    tx.ins.forEach((input, i) => {
        const addressType = (0, txBuild_1.getAddressType)(commitTxPrevOutputList[i].address, network);
        const privateKey = crypto_lib_1.base.fromHex((0, txBuild_1.privateKeyFromWIF)(commitTxPrevOutputList[i].privateKey, network));
        const privateKeyHex = crypto_lib_1.base.toHex(privateKey);
        const publicKey = (0, txBuild_1.private2public)(privateKeyHex);
        if (addressType === 'segwit_taproot') {
            const prevOutScripts = commitTxPrevOutputList.map(o => bitcoin.address.toOutputScript(o.address, network));
            const values = commitTxPrevOutputList.map(o => o.amount);
            const hash = tx.hashForWitnessV1(i, prevOutScripts, values, bitcoin.Transaction.SIGHASH_DEFAULT);
            const tweakedPrivKey = taproot.taprootTweakPrivKey(privateKey);
            const signature = Buffer.from(schnorr.sign(hash, tweakedPrivKey, crypto_lib_1.base.randomBytes(32)));
            input.witness = [Buffer.from(signature)];
        }
        else if (addressType === 'legacy') {
            const prevScript = bitcoin.address.toOutputScript(commitTxPrevOutputList[i].address, network);
            const hash = tx.hashForSignature(i, prevScript, bitcoin.Transaction.SIGHASH_ALL);
            const signature = (0, txBuild_1.sign)(hash, privateKeyHex);
            const payment = bitcoin.payments.p2pkh({
                signature: bitcoin.script.signature.encode(signature, bitcoin.Transaction.SIGHASH_ALL),
                pubkey: publicKey,
            });
            input.script = payment.input;
        }
        else {
            const pubKeyHash = bcrypto.hash160(publicKey);
            const prevOutScript = Buffer.of(0x19, 0x76, 0xa9, 0x14, ...pubKeyHash, 0x88, 0xac);
            const value = commitTxPrevOutputList[i].amount;
            const hash = tx.hashForWitness(i, prevOutScript, value, bitcoin.Transaction.SIGHASH_ALL);
            const signature = (0, txBuild_1.sign)(hash, privateKeyHex);
            input.witness = [
                bitcoin.script.signature.encode(signature, bitcoin.Transaction.SIGHASH_ALL),
                publicKey,
            ];
            const redeemScript = Buffer.of(0x16, 0, 20, ...pubKeyHash);
            if (addressType === "segwit_nested") {
                input.script = redeemScript;
            }
        }
    });
}
function createInscriptionTxCtxData(network, inscriptionData, privateKeyWif) {
    const privateKey = crypto_lib_1.base.fromHex((0, txBuild_1.privateKeyFromWIF)(privateKeyWif, network));
    const internalPubKey = (0, txBuild_1.wif2Public)(privateKeyWif, network).slice(1);
    const ops = bitcoin.script.OPS;
    const inscriptionBuilder = [];
    inscriptionBuilder.push(internalPubKey);
    inscriptionBuilder.push(ops.OP_CHECKSIG);
    inscriptionBuilder.push(ops.OP_FALSE);
    inscriptionBuilder.push(ops.OP_IF);
    inscriptionBuilder.push(Buffer.from("ord"));
    inscriptionBuilder.push(ops.OP_DATA_1);
    inscriptionBuilder.push(ops.OP_DATA_1);
    inscriptionBuilder.push(Buffer.from(inscriptionData.contentType));
    inscriptionBuilder.push(ops.OP_0);
    const maxChunkSize = 520;
    let body = Buffer.from(inscriptionData.body);
    let bodySize = body.length;
    for (let i = 0; i < bodySize; i += maxChunkSize) {
        let end = i + maxChunkSize;
        if (end > bodySize) {
            end = bodySize;
        }
        inscriptionBuilder.push(body.slice(i, end));
    }
    inscriptionBuilder.push(ops.OP_ENDIF);
    const inscriptionScript = bitcoin.script.compile(inscriptionBuilder);
    const scriptTree = {
        output: inscriptionScript,
    };
    const redeem = {
        output: inscriptionScript,
        redeemVersion: 0xc0,
    };
    const { output, witness, hash, address } = bitcoin.payments.p2tr({
        internalPubkey: internalPubKey,
        scriptTree,
        redeem,
        network,
    });
    return {
        privateKey,
        inscriptionScript,
        commitTxAddress: address,
        commitTxAddressPkScript: output,
        witness: witness,
        hash: hash,
        revealTxPrevOutput: {
            pkScript: Buffer.alloc(0),
            value: 0,
        },
        revealPkScript: bitcoin.address.toOutputScript(inscriptionData.revealAddr, network),
    };
}
function inscribe(network, request) {
    const tool = InscriptionTool.newInscriptionTool(network, request);
    if (tool.mustCommitTxFee > 0) {
        return {
            commitTx: "",
            revealTxs: [],
            commitTxFee: tool.mustCommitTxFee,
            revealTxFees: tool.mustRevealTxFees,
            commitAddrs: tool.commitAddrs,
        };
    }
    return {
        commitTx: tool.commitTx.toHex(),
        revealTxs: tool.revealTxs.map(revealTx => revealTx.toHex()),
        ...tool.calculateFee(),
        commitAddrs: tool.commitAddrs,
    };
}
exports.inscribe = inscribe;
function inscribeForMPCUnsigned(request, network, unsignedCommitTxHash, signedCommitTxHash) {
    const privateKey = request.commitTxPrevOutputList[0].privateKey;
    const scriptCtxList = [];
    request.inscriptionDataList.forEach(inscriptionData => {
        scriptCtxList.push(createInscriptionTxCtxData(network, inscriptionData, privateKey));
    });
    let totalRevealInValue = 0;
    const revealOutValue = request.revealOutValue || defaultRevealOutValue;
    const revealTxList = [];
    scriptCtxList.forEach((ctx, i) => {
        const tx = new bitcoin.Transaction();
        tx.version = defaultTxVersion;
        tx.addInput(Buffer.alloc(32), i, defaultSequenceNum);
        tx.addOutput(ctx.revealPkScript, revealOutValue);
        revealTxList.push(tx);
        const emptySignature = Buffer.alloc(64);
        const emptyControlBlockWitness = Buffer.alloc(33);
        const txWitness = [];
        txWitness.push(emptySignature);
        txWitness.push(ctx.inscriptionScript);
        txWitness.push(emptyControlBlockWitness);
        const revealFee = Math.floor((tx.byteLength() + Math.floor(((0, transaction_1.vectorSize)(txWitness) + 2 + 3) / 4)) * request.revealFeeRate);
        const revealInValue = revealOutValue + revealFee;
        ctx.revealTxPrevOutput = {
            pkScript: ctx.commitTxAddressPkScript,
            value: revealInValue,
        };
        totalRevealInValue += revealInValue;
    });
    let totalCommitInValue = 0;
    const commitTx = new bitcoin.Transaction();
    commitTx.version = defaultTxVersion;
    request.commitTxPrevOutputList.forEach(uxto => {
        commitTx.addInput(crypto_lib_1.base.reverseBuffer(crypto_lib_1.base.fromHex(uxto.txId)), uxto.vOut, defaultSequenceNum);
        totalCommitInValue += uxto.amount;
    });
    const commitAddrs = [];
    scriptCtxList.forEach(ctx => {
        commitTx.addOutput(ctx.revealTxPrevOutput.pkScript, ctx.revealTxPrevOutput.value);
        commitAddrs.push(ctx.commitTxAddress);
    });
    const changePkScript = bitcoin.address.toOutputScript(request.changeAddress, network);
    commitTx.addOutput(changePkScript, 0);
    const estimateTx = commitTx.clone();
    signTx(estimateTx, request.commitTxPrevOutputList, network);
    const fee = Math.floor(estimateTx.virtualSize() * request.commitFeeRate);
    const changeValue = totalCommitInValue - totalRevealInValue - fee;
    if (changeValue >= (request.minChangeValue || defaultMinChangeValue)) {
        commitTx.outs[commitTx.outs.length - 1].value = changeValue;
    }
    else {
        commitTx.outs = commitTx.outs.slice(0, commitTx.outs.length - 1);
        estimateTx.outs = estimateTx.outs.slice(0, estimateTx.outs.length - 1);
        const feeWithoutChange = Math.floor(estimateTx.virtualSize() * request.commitFeeRate);
        if (totalCommitInValue - totalRevealInValue - feeWithoutChange < 0) {
            throw new Error("insufficient balance");
        }
    }
    const sigHashList = calculateSigHash(commitTx, request.commitTxPrevOutputList, network);
    let commitTxHash = commitTx.getHash();
    if (signedCommitTxHash) {
        commitTxHash = signedCommitTxHash;
    }
    revealTxList.forEach((revealTx, i) => {
        revealTx.ins[0].hash = commitTxHash;
        const prevOutScripts = [scriptCtxList[i].revealTxPrevOutput.pkScript];
        const values = [scriptCtxList[i].revealTxPrevOutput.value];
        const sigHash = revealTx.hashForWitnessV1(0, prevOutScripts, values, bitcoin.Transaction.SIGHASH_DEFAULT, scriptCtxList[i].hash);
        const signature = Buffer.from(schnorr.sign(sigHash, scriptCtxList[i].privateKey, crypto_lib_1.base.randomBytes(32)));
        revealTx.ins[0].witness = [signature, ...scriptCtxList[i].witness];
    });
    let commitTxFee = 0;
    commitTx.ins.forEach((_, i) => {
        commitTxFee += request.commitTxPrevOutputList[i].amount;
    });
    commitTx.outs.forEach(out => {
        commitTxFee -= out.value;
    });
    let revealTxFees = [];
    revealTxList.forEach((revealTx, i) => {
        let revealTxFee = 0;
        revealTxFee += scriptCtxList[i].revealTxPrevOutput.value;
        revealTxFee -= revealTx.outs[0].value;
        revealTxFees.push(revealTxFee);
    });
    return {
        signHashList: sigHashList,
        commitTx: commitTx.toHex(),
        revealTxs: revealTxList.map(e => e.toHex()),
        commitTxFee: commitTxFee,
        revealTxFees: revealTxFees,
        commitAddrs: commitAddrs,
    };
}
exports.inscribeForMPCUnsigned = inscribeForMPCUnsigned;
function inscribeForMPCSigned(request, network) {
    const unsignedCommitTxHex = request.commitTx;
    const signatures = request.signatureList;
    const tx = bitcoin.Transaction.fromHex(unsignedCommitTxHex);
    const unsignedCommitTxHash = tx.getHash();
    tx.ins.forEach((input, i) => {
        const signature = crypto_lib_1.base.fromHex(signatures[i]);
        if (!input.witness) {
            input.script = bitcoin.payments.p2pkh({
                pubkey: bitcoin.payments.p2pkh({ input: input.script }).pubkey,
                signature: bitcoin.script.signature.encode(signature, bitcoin.Transaction.SIGHASH_ALL),
            }).input;
        }
        else {
            input.witness[0] = bitcoin.script.signature.encode(signature, bitcoin.Transaction.SIGHASH_ALL);
        }
    });
    const signedCommitTxHash = tx.getHash();
    const res = inscribeForMPCUnsigned(request, network, unsignedCommitTxHash, signedCommitTxHash);
    return {
        signHashList: null,
        commitTx: tx.toHex(),
        revealTxs: res.revealTxs,
        commitTxFee: res.commitTxFee,
        revealTxFees: res.revealTxFees,
        commitAddrs: res.commitAddrs,
    };
}
exports.inscribeForMPCSigned = inscribeForMPCSigned;
function calculateSigHash(tx, prevOutFetcher, network) {
    const sigHashList = [];
    tx.ins.forEach((input, i) => {
        const publicKey = crypto_lib_1.base.fromHex(prevOutFetcher[i].publicKey);
        const pkScript = bitcoin.address.toOutputScript(prevOutFetcher[i].address, network);
        const placeholderSignature = Buffer.alloc(64, 0);
        let sigHash;
        if ((0, psbtutils_1.isP2TR)(pkScript)) {
            const prevOutScripts = prevOutFetcher.map(o => bitcoin.address.toOutputScript(o.address, network));
            const values = prevOutFetcher.map(o => o.amount);
            sigHash = tx.hashForWitnessV1(i, prevOutScripts, values, bitcoin.Transaction.SIGHASH_DEFAULT);
            input.witness = [placeholderSignature];
        }
        else if ((0, psbtutils_1.isP2PKH)(pkScript)) {
            const prevScript = bitcoin.address.toOutputScript(prevOutFetcher[i].address, network);
            sigHash = tx.hashForSignature(i, prevScript, bitcoin.Transaction.SIGHASH_ALL);
            input.script = bitcoin.payments.p2pkh({
                pubkey: publicKey,
                signature: bitcoin.script.signature.encode(placeholderSignature, bitcoin.Transaction.SIGHASH_ALL),
            }).input;
        }
        else {
            const pubKeyHash = bcrypto.hash160(publicKey);
            const prevOutScript = Buffer.of(0x19, 0x76, 0xa9, 0x14, ...pubKeyHash, 0x88, 0xac);
            sigHash = tx.hashForWitness(i, prevOutScript, prevOutFetcher[i].amount, bitcoin.Transaction.SIGHASH_ALL);
            input.witness = bitcoin.payments.p2wpkh({
                pubkey: publicKey,
                signature: bitcoin.script.signature.encode(placeholderSignature, bitcoin.Transaction.SIGHASH_ALL),
            }).witness;
            const redeemScript = Buffer.of(0x16, 0, 20, ...pubKeyHash);
            if ((0, psbtutils_1.isP2SHScript)(pkScript)) {
                input.script = redeemScript;
            }
        }
        sigHashList.push(crypto_lib_1.base.toHex(sigHash));
    });
    return sigHashList;
}
//# sourceMappingURL=inscribe.js.map