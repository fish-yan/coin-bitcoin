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
exports.generateMPCSignedPSBT = exports.generateMPCUnsignedPSBT = exports.generateMPCSignedBuyingTx = exports.generateMPCUnsignedBuyingPSBT = exports.generateMPCSignedListingPSBT = exports.generateMPCUnsignedListingPSBT = exports.generateSignedBuyingTx = exports.mergeSignedBuyingPsbt = exports.generateUnsignedBuyingPsbt = exports.generateSignedListingPsbt = exports.generateUnsignedListingPsbt = exports.extractPsbtTransaction = exports.psbtSignImpl = exports.signPsbtWithKeyPathAndScriptPathImpl = exports.signPsbtWithKeyPathAndScriptPath = exports.signPsbtWithKeyPathAndScriptPathBatch = exports.psbtSign = exports.classicToPsbt = exports.buildPsbt = void 0;
const psbt_1 = require("./bitcoinjs-lib/psbt");
const crypto_lib_1 = require("@okxweb3/crypto-lib");
const txBuild_1 = require("./txBuild");
const bitcoinjs_lib_1 = require("./bitcoinjs-lib");
const taproot = __importStar(require("./taproot"));
const bip371_1 = require("./bitcoinjs-lib/psbt/bip371");
const address_1 = require("./bitcoinjs-lib/address");
const bufferutils_1 = require("./bitcoinjs-lib/bufferutils");
const psbtutils_1 = require("./bitcoinjs-lib/psbt/psbtutils");
const bscript = __importStar(require("./bitcoinjs-lib/script"));
const crypto_1 = require("./bitcoinjs-lib/crypto");
const crypto_2 = require("crypto");
const schnorr = crypto_lib_1.signUtil.schnorr.secp256k1.schnorr;
const defaultMaximumFeeRate = 5000;
function buildPsbt(tx, network, maximumFeeRate) {
    const psbt = classicToPsbt(tx, network, maximumFeeRate);
    return psbt.toHex();
}
exports.buildPsbt = buildPsbt;
function classicToPsbt(tx, network, maximumFeeRate) {
    const psbt = new psbt_1.Psbt({ network, maximumFeeRate: maximumFeeRate ? maximumFeeRate : defaultMaximumFeeRate });
    tx.inputs.forEach((input) => {
        const outputScript = (0, address_1.toOutputScript)(input.address, network);
        let inputData = {
            hash: input.txId,
            index: input.vOut,
            witnessUtxo: { script: outputScript, value: input.amount },
        };
        const addressType = (0, txBuild_1.getAddressType)(input.address, network || bitcoinjs_lib_1.networks.bitcoin);
        if (input.bip32Derivation) {
            if (addressType === 'segwit_taproot') {
                inputData.tapBip32Derivation = input.bip32Derivation.map((derivation) => {
                    let pubBuf = crypto_lib_1.base.fromHex(derivation.pubkey);
                    if (pubBuf.length != 32) {
                        pubBuf = pubBuf.slice(1);
                    }
                    return {
                        masterFingerprint: crypto_lib_1.base.fromHex(derivation.masterFingerprint),
                        pubkey: pubBuf,
                        path: derivation.path,
                        leafHashes: derivation.leafHashes.map((leaf) => {
                            return Buffer.from(leaf, 'hex');
                        }),
                    };
                });
            }
            else {
                inputData.bip32Derivation = input.bip32Derivation.map((derivation) => {
                    return {
                        masterFingerprint: crypto_lib_1.base.fromHex(derivation.masterFingerprint),
                        pubkey: crypto_lib_1.base.fromHex(derivation.pubkey),
                        path: derivation.path,
                    };
                });
            }
        }
        if (addressType === 'legacy') {
            inputData.nonWitnessUtxo = crypto_lib_1.base.fromHex(input.nonWitnessUtxo);
        }
        else if (addressType === 'segwit_taproot') {
            if (input.publicKey) {
                inputData.tapInternalKey = (0, bip371_1.toXOnly)(crypto_lib_1.base.fromHex(input.publicKey));
            }
        }
        else if (addressType === 'segwit_nested') {
            inputData.redeemScript = bitcoinjs_lib_1.payments.p2wpkh({
                pubkey: Buffer.from(input.publicKey, 'hex'),
                network,
            }).output;
        }
        if (input.sighashType) {
            inputData.sighashType = input.sighashType;
        }
        psbt.addInput(inputData);
    });
    tx.outputs.forEach((output) => {
        if (output.omniScript) {
            psbt.addOutput({ script: crypto_lib_1.base.fromHex(output.omniScript), value: 0 });
        }
        else {
            let outputData = { address: output.address, value: output.amount };
            if (output.bip32Derivation) {
                outputData.bip32Derivation = output.bip32Derivation.map((derivation) => {
                    return {
                        masterFingerprint: crypto_lib_1.base.fromHex(derivation.masterFingerprint),
                        pubkey: crypto_lib_1.base.fromHex(derivation.pubkey),
                        path: derivation.path,
                    };
                });
            }
            psbt.addOutput(outputData);
        }
    });
    return psbt;
}
exports.classicToPsbt = classicToPsbt;
function psbtSign(psbtBase64, privateKey, network, maximumFeeRate) {
    const psbt = psbt_1.Psbt.fromBase64(psbtBase64, {
        network,
        maximumFeeRate: maximumFeeRate ? maximumFeeRate : defaultMaximumFeeRate
    });
    psbtSignImpl(psbt, privateKey, network);
    return psbt.toBase64();
}
exports.psbtSign = psbtSign;
function signPsbtWithKeyPathAndScriptPathBatch(psbtHexs, privateKey, network, opts) {
    if (psbtHexs == undefined || psbtHexs.length == 0) {
        return [];
    }
    let res = [];
    const optsSize = opts == undefined ? 0 : opts.length;
    let i = 0;
    for (i = 0; i < psbtHexs.length; i++) {
        let opt = {};
        if (i < optsSize && opts) {
            opt = opts[i];
        }
        const signedPsbt = signPsbtWithKeyPathAndScriptPath(psbtHexs[i], privateKey, network, {
            autoFinalized: opt.autoFinalized,
            toSignInputs: opt.toSignInputs
        });
        res.push(signedPsbt);
    }
    return res;
}
exports.signPsbtWithKeyPathAndScriptPathBatch = signPsbtWithKeyPathAndScriptPathBatch;
function signPsbtWithKeyPathAndScriptPath(psbtStr, privateKey, network, opts = {}) {
    const psbt = getPsbtFromString(psbtStr, network);
    signPsbtWithKeyPathAndScriptPathImpl(psbt, privateKey, network, opts.autoFinalized, opts.toSignInputs);
    return psbt.toHex();
}
exports.signPsbtWithKeyPathAndScriptPath = signPsbtWithKeyPathAndScriptPath;
function signPsbtWithKeyPathAndScriptPathImpl(psbt, privateKey, network, autoFinalized, signInputs) {
    network = network || bitcoinjs_lib_1.networks.bitcoin;
    const privKeyHex = (0, txBuild_1.privateKeyFromWIF)(privateKey, network);
    const signInputMap = new Map();
    if (signInputs != undefined) {
        signInputs.map(e => {
            signInputMap.set(e.index, e);
        });
    }
    const signer = {
        psbtIndex: 0,
        needTweak: true,
        tweakHash: Buffer.alloc(0),
        toSignInputsMap: signInputMap,
        publicKey: Buffer.alloc(0),
        sign(hash) {
            return (0, txBuild_1.sign)(hash, privKeyHex);
        },
        signSchnorr(hash) {
            let tweakedPrivKey = taproot.taprootTweakPrivKey(crypto_lib_1.base.fromHex(privKeyHex));
            if (this.toSignInputsMap?.has(this.psbtIndex)) {
                if (this.toSignInputsMap.get(this.psbtIndex)?.disableTweakSigner) {
                    return Buffer.from(schnorr.sign(hash, privKeyHex, crypto_lib_1.base.randomBytes(32)));
                }
            }
            if (!this.needTweak) {
                return Buffer.from(schnorr.sign(hash, privKeyHex, crypto_lib_1.base.randomBytes(32)));
            }
            if (this.needTweak && this.tweakHash.length > 0) {
                tweakedPrivKey = taproot.taprootTweakPrivKey(crypto_lib_1.base.fromHex(privKeyHex), this.tweakHash);
            }
            return Buffer.from(schnorr.sign(hash, tweakedPrivKey, crypto_lib_1.base.randomBytes(32)));
        },
    };
    let allowedSighashTypes = [
        bitcoinjs_lib_1.Transaction.SIGHASH_SINGLE | bitcoinjs_lib_1.Transaction.SIGHASH_ANYONECANPAY,
        bitcoinjs_lib_1.Transaction.SIGHASH_ALL,
        bitcoinjs_lib_1.Transaction.SIGHASH_DEFAULT
    ];
    for (let i = 0; i < psbt.inputCount; i++) {
        if (signInputMap?.size > 0 && !signInputMap?.has(i)) {
            continue;
        }
        signer.psbtIndex = i;
        const input = psbt.data.inputs[i];
        if ((0, bip371_1.isTaprootInput)(input)) {
            if (!input.tapInternalKey) {
                input.tapInternalKey = (0, bip371_1.toXOnly)((0, txBuild_1.wif2Public)(privateKey, network));
            }
            signer.needTweak = true;
            signer.publicKey = Buffer.from(taproot.taprootTweakPubkey((0, bip371_1.toXOnly)((0, txBuild_1.wif2Public)(privateKey, network)))[0]);
            if (signInputMap?.has(i)) {
                if (signInputMap?.get(i)?.disableTweakSigner) {
                    signer.publicKey = (0, txBuild_1.wif2Public)(privateKey, network);
                    signer.needTweak = false;
                }
            }
            if (input.tapLeafScript && input.tapLeafScript?.length > 0 && !input.tapMerkleRoot) {
                input.tapLeafScript.map(e => {
                    if (e.controlBlock && e.script) {
                        signer.publicKey = (0, txBuild_1.wif2Public)(privateKey, network);
                        signer.needTweak = false;
                    }
                });
            }
            else if (input.tapMerkleRoot) {
                signer.needTweak = true;
                signer.tweakHash = input.tapMerkleRoot;
                signer.publicKey = Buffer.from(taproot.taprootTweakPubkey((0, bip371_1.toXOnly)((0, txBuild_1.wif2Public)(privateKey, network)), input.tapMerkleRoot)[0]);
            }
        }
        else {
            signer.needTweak = false;
            signer.tweakHash = Buffer.alloc(0);
            signer.publicKey = (0, txBuild_1.wif2Public)(privateKey, network);
        }
        try {
            if (signInputMap?.has(i)) {
                const sighashTypes = signInputMap?.get(i)?.sighashTypes;
                if (sighashTypes != undefined) {
                    allowedSighashTypes = sighashTypes;
                }
            }
            psbt.signInput(i, signer, allowedSighashTypes);
            if (autoFinalized != undefined && !autoFinalized) {
                continue;
            }
            psbt.finalizeInput(i);
        }
        catch (e) {
            if (signInputMap?.size > 0 && signInputMap?.has(i)) {
                throw e;
            }
        }
    }
}
exports.signPsbtWithKeyPathAndScriptPathImpl = signPsbtWithKeyPathAndScriptPathImpl;
function psbtSignImpl(psbt, privateKey, network) {
    network = network || bitcoinjs_lib_1.networks.bitcoin;
    const privKeyHex = (0, txBuild_1.privateKeyFromWIF)(privateKey, network);
    const signer = {
        publicKey: Buffer.alloc(0),
        sign(hash) {
            return (0, txBuild_1.sign)(hash, privKeyHex);
        },
        signSchnorr(hash) {
            const tweakedPrivKey = taproot.taprootTweakPrivKey(crypto_lib_1.base.fromHex(privKeyHex));
            return Buffer.from(schnorr.sign(hash, tweakedPrivKey, crypto_lib_1.base.randomBytes(32)));
        },
    };
    const allowedSighashTypes = [
        bitcoinjs_lib_1.Transaction.SIGHASH_SINGLE | bitcoinjs_lib_1.Transaction.SIGHASH_ANYONECANPAY,
        bitcoinjs_lib_1.Transaction.SIGHASH_ALL | bitcoinjs_lib_1.Transaction.SIGHASH_ANYONECANPAY,
        bitcoinjs_lib_1.Transaction.SIGHASH_ALL,
        bitcoinjs_lib_1.Transaction.SIGHASH_DEFAULT
    ];
    for (let i = 0; i < psbt.inputCount; i++) {
        if ((0, bip371_1.isTaprootInput)(psbt.data.inputs[i])) {
            const input = psbt.data.inputs[i];
            if (!input.tapInternalKey) {
                input.tapInternalKey = (0, bip371_1.toXOnly)((0, txBuild_1.wif2Public)(privateKey, network));
            }
            signer.publicKey = Buffer.from(taproot.taprootTweakPubkey((0, bip371_1.toXOnly)((0, txBuild_1.wif2Public)(privateKey, network)))[0]);
        }
        else {
            signer.publicKey = (0, txBuild_1.wif2Public)(privateKey, network);
        }
        try {
            psbt.signInput(i, signer, allowedSighashTypes);
        }
        catch (e) {
        }
    }
}
exports.psbtSignImpl = psbtSignImpl;
function extractPsbtTransaction(txHex, network, maximumFeeRate) {
    const psbt = psbt_1.Psbt.fromHex(txHex, {
        network,
        maximumFeeRate: maximumFeeRate ? maximumFeeRate : defaultMaximumFeeRate
    });
    let extractedTransaction;
    try {
        extractedTransaction = psbt.finalizeAllInputs().extractTransaction();
    }
    catch (e) {
        extractedTransaction = psbt.extractTransaction();
        console.log(e);
    }
    return extractedTransaction.toHex();
}
exports.extractPsbtTransaction = extractPsbtTransaction;
function generateUnsignedListingPsbt(listingData, network, publicKey) {
    const script = bitcoinjs_lib_1.address.toOutputScript(listingData.nftAddress, network);
    if (((0, psbtutils_1.isP2SHScript)(script) || (0, psbtutils_1.isP2TR)(script)) && !publicKey) {
        throw new Error("Missing publicKey");
    }
    const tx = {
        inputs: [],
        outputs: [],
    };
    let placeholderAddress = "bc1pcyj5mt2q4t4py8jnur8vpxvxxchke4pzy7tdr9yvj3u3kdfgrj6sw3rzmr";
    if (network === bitcoinjs_lib_1.networks.testnet) {
        placeholderAddress = "tb1pcyj5mt2q4t4py8jnur8vpxvxxchke4pzy7tdr9yvj3u3kdfgrj6see4dpv";
    }
    tx.inputs.push({
        txId: "0".repeat(64),
        vOut: 0,
        amount: 0,
        address: placeholderAddress,
    }, {
        txId: "0".repeat(64),
        vOut: 1,
        amount: 0,
        address: placeholderAddress,
    });
    tx.outputs.push({
        address: placeholderAddress,
        amount: 0,
    }, {
        address: placeholderAddress,
        amount: 0,
    });
    tx.inputs.push({
        txId: listingData.nftUtxo.txHash,
        vOut: listingData.nftUtxo.vout,
        address: listingData.nftAddress,
        amount: listingData.nftUtxo.coinAmount,
        publicKey: publicKey,
        nonWitnessUtxo: listingData.nftUtxo.rawTransation,
        sighashType: bitcoinjs_lib_1.Transaction.SIGHASH_SINGLE | bitcoinjs_lib_1.Transaction.SIGHASH_ANYONECANPAY,
    });
    tx.outputs.push({
        address: listingData.receiveBtcAddress,
        amount: listingData.price,
    });
    const psbtHex = buildPsbt(tx, network);
    return crypto_lib_1.base.toBase64(crypto_lib_1.base.fromHex(psbtHex));
}
exports.generateUnsignedListingPsbt = generateUnsignedListingPsbt;
function generateSignedListingPsbt(listingData, privateKey, network) {
    const publicKey = crypto_lib_1.base.toHex((0, txBuild_1.wif2Public)(privateKey, network));
    return psbtSign(generateUnsignedListingPsbt(listingData, network, publicKey), privateKey, network);
}
exports.generateSignedListingPsbt = generateSignedListingPsbt;
const SELLER_INDEX = 2;
const DUMMY_AMOUNT = 600;
const DUST_OUTPUT_LIMIT = 546;
function generateUnsignedBuyingPsbt(buyingData, network, publicKey) {
    const tx = {
        inputs: [],
        outputs: [],
        address: buyingData.paymentAndChangeAddress,
        feePerB: buyingData.feeRate,
    };
    buyingData.dummyUtxos.forEach(dummyUtxo => {
        tx.inputs.push({
            txId: dummyUtxo.txHash,
            vOut: dummyUtxo.vout,
            address: buyingData.paymentAndChangeAddress,
            amount: dummyUtxo.coinAmount,
            publicKey: publicKey,
            nonWitnessUtxo: dummyUtxo.rawTransation,
        });
    });
    tx.outputs.push({
        address: buyingData.paymentAndChangeAddress,
        amount: buyingData.dummyUtxos.reduce((sum, dummyUtxo) => sum + dummyUtxo.coinAmount, 0),
    });
    const nftOutputs = [];
    buyingData.sellerPsbts.forEach(sellerPsbt => {
        const psbt = psbt_1.Psbt.fromBase64(sellerPsbt, { network });
        const nftInput = psbt.data.globalMap.unsignedTx.tx.ins[SELLER_INDEX];
        nftOutputs.push(psbt.data.globalMap.unsignedTx.tx.outs[SELLER_INDEX]);
        let nftUtxo = psbt.data.inputs[SELLER_INDEX].witnessUtxo;
        if (!nftUtxo) {
            nftUtxo = bitcoinjs_lib_1.Transaction.fromBuffer(psbt.data.inputs[SELLER_INDEX].nonWitnessUtxo).outs[nftInput.index];
        }
        tx.inputs.push({
            txId: crypto_lib_1.base.toHex((0, bufferutils_1.reverseBuffer)(nftInput.hash)),
            vOut: nftInput.index,
            address: bitcoinjs_lib_1.address.fromOutputScript(nftUtxo.script, network),
            amount: nftUtxo.value,
            sighashType: bitcoinjs_lib_1.Transaction.SIGHASH_SINGLE | bitcoinjs_lib_1.Transaction.SIGHASH_ANYONECANPAY,
        });
        tx.outputs.push({
            address: buyingData.receiveNftAddress,
            amount: nftUtxo.value,
        });
    });
    nftOutputs.forEach(nftOutput => {
        tx.outputs.push({
            address: bitcoinjs_lib_1.address.fromOutputScript(nftOutput.script, network),
            amount: nftOutput.value,
        });
    });
    buyingData.paymentUtxos.forEach(paymentUtxo => {
        tx.inputs.push({
            txId: paymentUtxo.txHash,
            vOut: paymentUtxo.vout,
            address: buyingData.paymentAndChangeAddress,
            amount: paymentUtxo.coinAmount,
            publicKey: publicKey,
            nonWitnessUtxo: paymentUtxo.rawTransation,
        });
    });
    buyingData.dummyUtxos.forEach(() => {
        tx.outputs.push({
            address: buyingData.paymentAndChangeAddress,
            amount: DUMMY_AMOUNT,
        });
    });
    const changeAmount = parseInt((0, txBuild_1.signBtc)(tx, "", network, undefined, false, true));
    if (changeAmount >= DUST_OUTPUT_LIMIT) {
        tx.outputs.push({
            address: buyingData.paymentAndChangeAddress,
            amount: changeAmount,
        });
    }
    return crypto_lib_1.base.toBase64(crypto_lib_1.base.fromHex(buildPsbt(tx, network)));
}
exports.generateUnsignedBuyingPsbt = generateUnsignedBuyingPsbt;
function mergeSignedBuyingPsbt(signedBuyingPsbt, signedListingPsbts) {
    const buyerSignedPsbt = psbt_1.Psbt.fromBase64(signedBuyingPsbt);
    const nftIndex = signedListingPsbts.length + 1;
    signedListingPsbts.forEach((signedListingPsbt, i) => {
        const sellerSignedPsbt = psbt_1.Psbt.fromBase64(signedListingPsbt);
        buyerSignedPsbt.data.globalMap.unsignedTx.tx.ins[nftIndex + i]
            = sellerSignedPsbt.data.globalMap.unsignedTx.tx.ins[SELLER_INDEX];
        buyerSignedPsbt.data.inputs[nftIndex + i]
            = sellerSignedPsbt.data.inputs[SELLER_INDEX];
    });
    return buyerSignedPsbt;
}
exports.mergeSignedBuyingPsbt = mergeSignedBuyingPsbt;
function generateSignedBuyingTx(buyingData, privateKey, network) {
    const publicKey = crypto_lib_1.base.toHex((0, txBuild_1.wif2Public)(privateKey, network));
    const signedBuyingPsbt = psbtSign(generateUnsignedBuyingPsbt(buyingData, network, publicKey), privateKey, network);
    return extractPsbtTransaction(mergeSignedBuyingPsbt(signedBuyingPsbt, buyingData.sellerPsbts).toHex(), network);
}
exports.generateSignedBuyingTx = generateSignedBuyingTx;
function generateMPCUnsignedListingPSBT(psbtBase64, pubKeyHex, network) {
    const psbt = psbt_1.Psbt.fromBase64(psbtBase64, { network });
    const publicKey = crypto_lib_1.base.fromHex(pubKeyHex);
    const sighashTypes = [bitcoinjs_lib_1.Transaction.SIGHASH_SINGLE | bitcoinjs_lib_1.Transaction.SIGHASH_ANYONECANPAY];
    let signHashList = [];
    for (let i = 0; i < psbt.inputCount; i++) {
        if (i != SELLER_INDEX) {
            continue;
        }
        const { hash, sighashType } = psbt.getHashAndSighashType(i, publicKey, sighashTypes);
        signHashList.push(crypto_lib_1.base.toHex(hash));
    }
    return {
        psbtBase64: psbtBase64,
        signHashList: signHashList,
    };
}
exports.generateMPCUnsignedListingPSBT = generateMPCUnsignedListingPSBT;
function generateMPCSignedListingPSBT(psbtBase64, pubKeyHex, signature, network) {
    const psbt = psbt_1.Psbt.fromBase64(psbtBase64, { network });
    const publicKey = crypto_lib_1.base.fromHex(pubKeyHex);
    const partialSig = [
        {
            pubkey: publicKey,
            signature: bscript.signature.encode(crypto_lib_1.base.fromHex(signature), bitcoinjs_lib_1.Transaction.SIGHASH_SINGLE | bitcoinjs_lib_1.Transaction.SIGHASH_ANYONECANPAY),
        },
    ];
    psbt.data.updateInput(SELLER_INDEX, { partialSig });
    return psbt.toBase64();
}
exports.generateMPCSignedListingPSBT = generateMPCSignedListingPSBT;
function generateMPCUnsignedBuyingPSBT(psbtBase64, pubKeyHex, network, batchSize = 1) {
    const psbt = psbt_1.Psbt.fromBase64(psbtBase64, { network });
    const publicKey = crypto_lib_1.base.fromHex(pubKeyHex);
    const sighashTypes = [bitcoinjs_lib_1.Transaction.SIGHASH_ALL];
    let signHashList = [];
    const sellerIndex = batchSize + 1;
    for (let i = 0; i < psbt.inputCount; i++) {
        if (i >= sellerIndex && i < sellerIndex + batchSize) {
            continue;
        }
        const { hash, sighashType } = psbt.getHashAndSighashType(i, publicKey, sighashTypes);
        signHashList.push(crypto_lib_1.base.toHex(hash));
    }
    return {
        psbtBase64: psbtBase64,
        signHashList: signHashList,
    };
}
exports.generateMPCUnsignedBuyingPSBT = generateMPCUnsignedBuyingPSBT;
function generateMPCSignedBuyingTx(psbtBase64, pubKeyHex, signatureList, network, batchSize = 1) {
    const psbt = psbt_1.Psbt.fromBase64(psbtBase64, { network });
    const publicKey = crypto_lib_1.base.fromHex(pubKeyHex);
    const sellerIndex = batchSize + 1;
    for (let i = 0; i < psbt.inputCount; i++) {
        if (i >= sellerIndex && i < sellerIndex + batchSize) {
            continue;
        }
        const partialSig = [
            {
                pubkey: publicKey,
                signature: bscript.signature.encode(crypto_lib_1.base.fromHex(signatureList[i]), bitcoinjs_lib_1.Transaction.SIGHASH_ALL),
            },
        ];
        psbt.data.updateInput(i, { partialSig });
    }
    return extractPsbtTransaction(psbt.toHex(), network);
}
exports.generateMPCSignedBuyingTx = generateMPCSignedBuyingTx;
function generateMPCUnsignedPSBT(psbtStr, pubKeyHex, network) {
    const psbt = getPsbtFromString(psbtStr, network);
    const publicKey = crypto_lib_1.base.fromHex(pubKeyHex);
    const allowedSighashTypes = [
        bitcoinjs_lib_1.Transaction.SIGHASH_SINGLE | bitcoinjs_lib_1.Transaction.SIGHASH_ANYONECANPAY,
        bitcoinjs_lib_1.Transaction.SIGHASH_SINGLE | bitcoinjs_lib_1.Transaction.SIGHASH_ANYONECANPAY,
        bitcoinjs_lib_1.Transaction.SIGHASH_ALL | bitcoinjs_lib_1.Transaction.SIGHASH_ANYONECANPAY,
        bitcoinjs_lib_1.Transaction.SIGHASH_ALL,
        bitcoinjs_lib_1.Transaction.SIGHASH_DEFAULT
    ];
    ;
    let signHashList = [];
    for (let i = 0; i < psbt.inputCount; i++) {
        try {
            const { hash, sighashType } = psbt.getHashAndSighashType(i, publicKey, allowedSighashTypes);
            signHashList.push(crypto_lib_1.base.toHex(hash));
        }
        catch (e) {
            const s = getRandomHash();
            signHashList.push(s);
        }
    }
    const m = new Map();
    signHashList.map((e, i) => {
        let count = m.get(e);
        count = count == undefined ? 0 : count;
        if (count != undefined && count >= 1) {
            signHashList[i] = getRandomHash();
        }
        m.set(e, count + 1);
    });
    return {
        psbtStr: psbtStr,
        signHashList: signHashList,
    };
}
exports.generateMPCUnsignedPSBT = generateMPCUnsignedPSBT;
function getRandomHash() {
    const h = (0, crypto_1.sha256)((0, crypto_2.randomBytes)(32));
    const s = crypto_lib_1.base.toHex(h.slice(0, 28));
    return "ffffffff" + s;
}
function generateMPCSignedPSBT(psbtStr, pubKeyHex, signatureList, network) {
    const psbt = getPsbtFromString(psbtStr, network);
    const publicKey = crypto_lib_1.base.fromHex(pubKeyHex);
    let sighashType = bitcoinjs_lib_1.Transaction.SIGHASH_ALL;
    const res = generateMPCUnsignedPSBT(psbtStr, pubKeyHex, network);
    const signHashList = res.signHashList;
    for (let i = 0; i < psbt.inputCount; i++) {
        if (signHashList[i].slice(0, 8) == "ffffffff") {
            continue;
        }
        if (psbt.data.inputs[i].sighashType != undefined) {
            sighashType = psbt.data.inputs[i].sighashType;
        }
        const partialSig = [
            {
                pubkey: publicKey,
                signature: bscript.signature.encode(crypto_lib_1.base.fromHex(signatureList[i]), sighashType),
            },
        ];
        try {
            psbt.data.updateInput(i, { partialSig });
        }
        catch (e) {
        }
    }
    return psbt.toHex();
}
exports.generateMPCSignedPSBT = generateMPCSignedPSBT;
function getPsbtFromString(psbtStr, network) {
    let psbt;
    if (crypto_lib_1.base.isHexString("0x" + psbtStr)) {
        psbt = psbt_1.Psbt.fromHex(psbtStr, { network });
    }
    else {
        psbt = psbt_1.Psbt.fromBase64(psbtStr, { network });
    }
    return psbt;
}
//# sourceMappingURL=psbtSign.js.map