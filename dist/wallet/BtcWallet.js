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
exports.convert2UtxoTx = exports.number2Hex = exports.TBtcWallet = exports.BtcWallet = exports.BITCOIN_MESSAGE_BIP0322_SIMPLE = exports.BITCOIN_MESSAGE_ECDSA = void 0;
const coin_base_1 = require("@okxweb3/coin-base");
const crypto_lib_1 = require("@okxweb3/crypto-lib");
const bitcoin = __importStar(require("../index"));
const index_1 = require("../index");
exports.BITCOIN_MESSAGE_ECDSA = 0;
exports.BITCOIN_MESSAGE_BIP0322_SIMPLE = 1;
class BtcWallet extends coin_base_1.BaseWallet {
    network() {
        return bitcoin.networks.bitcoin;
    }
    async getDerivedPath(param) {
        if (!param.segwitType) {
            return `m/44'/0'/0'/0/${param.index}`;
        }
        if (param.segwitType == coin_base_1.segwitType.SEGWIT_NESTED) {
            return `m/84'/0'/0'/0/${param.index}`;
        }
        else if (param.segwitType == coin_base_1.segwitType.SEGWIT_NESTED_49) {
            return `m/49'/0'/0'/0/${param.index}`;
        }
        else if (param.segwitType == coin_base_1.segwitType.SEGWIT_NATIVE) {
            return `m/84'/0'/0'/0/${param.index}`;
        }
        else if (param.segwitType == coin_base_1.segwitType.SEGWIT_TAPROOT) {
            return `m/86'/0'/0'/0/${param.index}`;
        }
        else {
            return Promise.reject(coin_base_1.DerivePathError);
        }
    }
    async validPrivateKey(param) {
        let isValid;
        try {
            const { version } = bitcoin.wif.decode(param.privateKey);
            isValid = (version === this.network().wif);
        }
        catch (e) {
            isValid = false;
        }
        const data = {
            isValid: isValid,
            privateKey: param.privateKey
        };
        return Promise.resolve(data);
    }
    async getNewAddress(param) {
        try {
            let network = this.network();
            let privateKey = param.privateKey;
            const addressType = param.addressType || "Legacy";
            const publicKey = bitcoin.wif2Public(privateKey, network);
            let address;
            if (addressType === "Legacy") {
                const result = bitcoin.payments.p2pkh({ pubkey: publicKey, network });
                address = result.address;
            }
            else if (addressType === "segwit_native") {
                const result = bitcoin.payments.p2wpkh({ pubkey: publicKey, network });
                address = result.address;
            }
            else if (addressType === "segwit_nested") {
                const result = bitcoin.payments.p2sh({
                    redeem: bitcoin.payments.p2wpkh({ pubkey: publicKey, network }),
                });
                address = result.address;
            }
            else if (addressType === "segwit_taproot") {
                const result = bitcoin.payments.p2tr({ internalPubkey: publicKey.slice(1), network });
                address = result.address;
            }
            let data = {
                address: address || "",
                publicKey: crypto_lib_1.base.toHex(addressType === "segwit_taproot" ? publicKey.slice(1) : publicKey),
                compressedPublicKey: crypto_lib_1.base.toHex(publicKey),
            };
            return Promise.resolve(data);
        }
        catch (e) {
            return Promise.reject(coin_base_1.NewAddressError);
        }
    }
    async validAddress(param) {
        let isValid = false;
        let network = this.network();
        try {
            let outputScript = bitcoin.address.toOutputScript(param.address, network);
            if (outputScript) {
                isValid = true;
            }
        }
        catch (e) {
        }
        if (param.addressType) {
            isValid = param.addressType === bitcoin.getAddressType(param.address, network);
        }
        let data = {
            isValid: isValid,
            address: param.address
        };
        return Promise.resolve(data);
    }
    async signTransaction(param) {
        const type = param.data.type || 0;
        if (type === bitcoin.BtcXrcTypes.INSCRIBE) {
            try {
                return Promise.resolve(bitcoin.inscribe(this.network(), param.data));
            }
            catch (e) {
                return Promise.reject(coin_base_1.SignTxError);
            }
        }
        else if (type === bitcoin.BtcXrcTypes.PSBT) {
            try {
                return Promise.resolve(bitcoin.psbtSign(param.data.psbt, param.privateKey, this.network()));
            }
            catch (e) {
                return Promise.reject(coin_base_1.SignTxError);
            }
        }
        else if (type === bitcoin.BtcXrcTypes.PSBT_MPC_UNSIGNED_LIST) {
            try {
                return Promise.resolve(bitcoin.generateMPCUnsignedListingPSBT(param.data.psbt, param.data.publicKey, this.network()));
            }
            catch (e) {
                return Promise.reject(coin_base_1.SignTxError);
            }
        }
        else if (type === bitcoin.BtcXrcTypes.PSBT_MPC_SIGNED_LIST) {
            try {
                return Promise.resolve(bitcoin.generateMPCSignedListingPSBT(param.data.psbt, param.data.publicKey, param.data.signature, this.network()));
            }
            catch (e) {
                return Promise.reject(coin_base_1.SignTxError);
            }
        }
        else if (type === bitcoin.BtcXrcTypes.PSBT_MPC_UNSIGNED_BUY) {
            try {
                return Promise.resolve(bitcoin.generateMPCUnsignedBuyingPSBT(param.data.psbt, param.data.publicKey, this.network(), param.data.batchSize));
            }
            catch (e) {
                return Promise.reject(coin_base_1.SignTxError);
            }
        }
        else if (type === bitcoin.BtcXrcTypes.PSBT_MPC_SIGNED_BUY) {
            try {
                return Promise.resolve(bitcoin.generateMPCSignedBuyingTx(param.data.psbt, param.data.publicKey, param.data.signatureList, this.network(), param.data.batchSize));
            }
            catch (e) {
                return Promise.reject(coin_base_1.SignTxError);
            }
        }
        else if (type === bitcoin.BtcXrcTypes.PSBT_MPC_UNSIGNED) {
            try {
                return Promise.resolve(bitcoin.generateMPCUnsignedPSBT(param.data.psbt, param.data.publicKey, this.network()));
            }
            catch (e) {
                return Promise.reject(coin_base_1.SignTxError);
            }
        }
        else if (type === bitcoin.BtcXrcTypes.PSBT_MPC_SIGNED) {
            try {
                return Promise.resolve(bitcoin.generateMPCSignedPSBT(param.data.psbt, param.data.publicKey, param.data.signatureList, this.network()));
            }
            catch (e) {
                return Promise.reject(coin_base_1.SignTxError);
            }
        }
        else if (type === bitcoin.BtcXrcTypes.PSBT_KEY_SCRIPT_PATH) {
            try {
                return Promise.resolve(bitcoin.signPsbtWithKeyPathAndScriptPath(param.data.psbt, param.privateKey, this.network(), {
                    autoFinalized: param.data.autoFinalized,
                    toSignInputs: param.data.toSignInputs
                }));
            }
            catch (e) {
                return Promise.reject(coin_base_1.SignTxError);
            }
        }
        else if (type === bitcoin.BtcXrcTypes.PSBT_KEY_SCRIPT_PATH_BATCH) {
            try {
                return Promise.resolve(bitcoin.signPsbtWithKeyPathAndScriptPathBatch(param.data.psbtHexs, param.privateKey, this.network(), param.data.options));
            }
            catch (e) {
                return Promise.reject(coin_base_1.SignTxError);
            }
        }
        else if (type === bitcoin.BtcXrcTypes.SRC20) {
            try {
                return Promise.resolve(bitcoin.srcInscribe(this.network(), param.data));
            }
            catch (e) {
                return Promise.reject(coin_base_1.SignTxError);
            }
        }
        else if (type === bitcoin.BtcXrcTypes.RUNE) {
            try {
                let wallet = new index_1.RuneWallet();
                if (this.network() === index_1.networks.testnet) {
                    wallet = new index_1.RuneTestWallet();
                }
                return Promise.resolve(wallet.signTransaction(param));
            }
            catch (e) {
                return Promise.reject(coin_base_1.SignTxError);
            }
        }
        else if (type === bitcoin.BtcXrcTypes.ARC20) {
            try {
                let wallet = new index_1.AtomicalWallet();
                if (this.network() === index_1.networks.testnet) {
                    wallet = new index_1.AtomicalTestWallet();
                }
                return Promise.resolve(wallet.signTransaction(param));
            }
            catch (e) {
                return Promise.reject(coin_base_1.SignTxError);
            }
        }
        else {
            let txHex = null;
            try {
                const privateKey = param.privateKey;
                const utxoTx = convert2UtxoTx(param.data);
                txHex = bitcoin.signBtc(utxoTx, privateKey, this.network());
                return Promise.resolve(txHex);
            }
            catch (e) {
                return Promise.reject(coin_base_1.SignTxError);
            }
        }
    }
    getRandomPrivateKey() {
        try {
            let network = this.network();
            while (true) {
                const privateKey = crypto_lib_1.base.randomBytes(32);
                if ((0, coin_base_1.secp256k1SignTest)(privateKey)) {
                    const wif = bitcoin.private2Wif(privateKey, network);
                    return Promise.resolve(wif);
                }
            }
        }
        catch (e) {
            return Promise.reject(coin_base_1.GenPrivateKeyError);
        }
    }
    getDerivedPrivateKey(param) {
        let network = this.network();
        return crypto_lib_1.bip39.mnemonicToSeed(param.mnemonic)
            .then(masterSeed => {
            let childKey = crypto_lib_1.bip32.fromSeed(masterSeed).derivePath(param.hdPath);
            if (!childKey.privateKey) {
                return Promise.reject(coin_base_1.GenPrivateKeyError);
            }
            const wif = bitcoin.private2Wif(childKey.privateKey, network);
            return Promise.resolve(wif);
        }).catch((e) => {
            return Promise.reject(coin_base_1.GenPrivateKeyError);
        });
    }
    getAddressByPublicKey(param) {
        try {
            const network = this.network();
            const publicKey = crypto_lib_1.base.fromHex(param.publicKey);
            if (!param.addressType) {
                const addresses = [];
                addresses.push({
                    addressType: "Legacy",
                    address: bitcoin.payments.p2pkh({ pubkey: publicKey, network }).address,
                });
                addresses.push({
                    addressType: "segwit_nested",
                    address: bitcoin.payments.p2sh({
                        redeem: bitcoin.payments.p2wpkh({ pubkey: publicKey, network }),
                    }).address,
                });
                addresses.push({
                    addressType: "segwit_native",
                    address: bitcoin.payments.p2wpkh({ pubkey: publicKey, network }).address,
                });
                return Promise.resolve(addresses);
            }
            else if (param.addressType === 'Legacy') {
                return Promise.resolve(bitcoin.payments.p2pkh({ pubkey: publicKey, network }).address);
            }
            else if (param.addressType === 'segwit_nested') {
                return Promise.resolve(bitcoin.payments.p2sh({
                    redeem: bitcoin.payments.p2wpkh({ pubkey: publicKey, network }),
                }).address);
            }
            else if (param.addressType === 'segwit_native') {
                return Promise.resolve(bitcoin.payments.p2wpkh({ pubkey: publicKey, network }).address);
            }
            else if (param.addressType === 'segwit_taproot') {
                return Promise.resolve(bitcoin.payments.p2tr({ internalPubkey: publicKey.slice(1), network }).address);
            }
        }
        catch (e) {
        }
        return Promise.reject(coin_base_1.NewAddressError);
    }
    getMPCRawTransaction(param) {
        try {
            const utxoTx = convert2UtxoTx(param.data);
            const hash = [];
            const unsignedTx = bitcoin.signBtc(utxoTx, "", this.network(), hash);
            const data = {
                raw: unsignedTx,
                hash: hash,
            };
            return Promise.resolve(data);
        }
        catch (e) {
            return Promise.reject(coin_base_1.GetMpcRawTransactionError);
        }
    }
    getMPCTransaction(param) {
        try {
            const hex = bitcoin.getMPCTransaction(param.raw, param.sigs, false);
            return Promise.resolve(hex);
        }
        catch (e) {
            return Promise.reject(coin_base_1.GetMpcTransactionError);
        }
    }
    async getMPCRawMessage(param) {
        try {
            const msgHash = await this.signMessage(param);
            return Promise.resolve({ hash: msgHash });
        }
        catch (e) {
            return Promise.reject(coin_base_1.GetMpcRawTransactionError);
        }
    }
    async getMPCSignedMessage(param) {
        try {
            return Promise.resolve(bitcoin.message.getMPCSignedMessage(param.hash, param.sigs, param.publicKey));
        }
        catch (e) {
            return Promise.reject(coin_base_1.GetMpcTransactionError);
        }
    }
    getHardWareRawTransaction(param) {
        try {
            const type = param.data.type || 0;
            const utxoTx = convert2UtxoTx(param.data);
            if (type === 2) {
                const change = bitcoin.signBtc(utxoTx, "", this.network(), undefined, true, true);
                const dustSize = utxoTx.dustSize || 546;
                if (parseInt(change) >= dustSize) {
                    const changeUtxo = {
                        address: utxoTx.address,
                        amount: parseInt(change),
                        bip32Derivation: utxoTx.bip32Derivation
                    };
                    utxoTx.outputs.push(changeUtxo);
                }
                const hex = bitcoin.buildPsbt(utxoTx, this.network());
                return Promise.resolve(hex);
            }
            else {
                const hex = bitcoin.signBtc(utxoTx, "", this.network(), undefined, true);
                return Promise.resolve(hex);
            }
        }
        catch (e) {
            return Promise.reject(coin_base_1.GetHardwareRawTransactionError);
        }
    }
    async calcTxHash(param) {
        try {
            return Promise.resolve(bitcoin.Transaction.fromHex(param.data).getId());
        }
        catch (e) {
            return Promise.reject(coin_base_1.CalcTxHashError);
        }
    }
    signMessage(param) {
        try {
            const typedMessage = param.data;
            let signature;
            if (typedMessage.type === exports.BITCOIN_MESSAGE_ECDSA) {
                signature = bitcoin.message.sign(param.privateKey, typedMessage.message, this.network());
            }
            else {
                signature = bitcoin.bip0322.signSimple(typedMessage.message, typedMessage.address, param.privateKey, this.network());
            }
            return Promise.resolve(signature);
        }
        catch (e) {
            return Promise.reject(coin_base_1.SignMsgError);
        }
    }
    async verifyMessage(param) {
        try {
            const typedMessage = param.data;
            if (typedMessage.type === exports.BITCOIN_MESSAGE_ECDSA) {
                const ret = bitcoin.message.verify(typedMessage.publicKey, typedMessage.message, param.signature);
                return Promise.resolve(ret);
            }
            else {
                const ret = bitcoin.bip0322.verifySimple(typedMessage.message, typedMessage.address, param.signature, typedMessage.publicKey, this.network());
                return Promise.resolve(ret);
            }
        }
        catch (e) {
            return Promise.reject(coin_base_1.SignMsgError);
        }
    }
    static async extractPsbtTransaction(txHex) {
        try {
            return Promise.resolve(bitcoin.extractPsbtTransaction(txHex));
        }
        catch (e) {
            return Promise.reject(coin_base_1.SignMsgError);
        }
    }
    async validSignedTransaction(param) {
        try {
            if (param.data) {
                param.data.forEach((o) => o.value = o.amount);
            }
            const tx = bitcoin.ValidSignedTransaction(param.tx, param.data, this.network());
            return Promise.resolve((0, coin_base_1.jsonStringifyUniform)(tx));
        }
        catch (e) {
            return Promise.reject(coin_base_1.validSignedTransactionError);
        }
    }
    async estimateFee(param) {
        try {
            const type = param.data.type || 0;
            if (type === bitcoin.BtcXrcTypes.INSCRIBE) {
                return Promise.reject(coin_base_1.EstimateFeeError);
            }
            else if (type === bitcoin.BtcXrcTypes.PSBT) {
                return Promise.reject(coin_base_1.EstimateFeeError);
            }
            else if (type === bitcoin.BtcXrcTypes.RUNE) {
                try {
                    let wallet = new index_1.RuneWallet();
                    if (this.network() === index_1.networks.testnet) {
                        wallet = new index_1.RuneTestWallet();
                    }
                    return Promise.resolve(wallet.estimateFee(param));
                }
                catch (e) {
                    return Promise.reject(coin_base_1.EstimateFeeError);
                }
            }
            else if (type === bitcoin.BtcXrcTypes.ARC20) {
                try {
                    let wallet = new index_1.AtomicalWallet();
                    if (this.network() === index_1.networks.testnet) {
                        wallet = new index_1.AtomicalTestWallet();
                    }
                    return Promise.resolve(wallet.estimateFee(param));
                }
                catch (e) {
                    return Promise.reject(coin_base_1.EstimateFeeError);
                }
            }
            else {
                const utxoTx = convert2UtxoTx(param.data);
                const fee = bitcoin.estimateBtcFee(utxoTx, this.network());
                return Promise.resolve(fee);
            }
        }
        catch (e) {
            return Promise.reject(coin_base_1.EstimateFeeError);
        }
    }
    static async oneKeyBuildBtcTx(txData) {
        try {
            return Promise.resolve(bitcoin.oneKeyBuildBtcTx(txData));
        }
        catch (e) {
            return Promise.reject(coin_base_1.SignTxError);
        }
    }
}
exports.BtcWallet = BtcWallet;
class TBtcWallet extends BtcWallet {
    network() {
        return bitcoin.networks.testnet;
    }
}
exports.TBtcWallet = TBtcWallet;
function number2Hex(n, length) {
    let s = n.toString(16);
    const d = length - s.length;
    if (d > 0) {
        for (let i = 0; i < d; i++) {
            s = "0" + s;
        }
    }
    return s;
}
exports.number2Hex = number2Hex;
function convert2UtxoTx(utxoTx) {
    const tx = (0, coin_base_1.cloneObject)(utxoTx);
    tx.inputs.forEach((it) => {
        it.amount = (0, coin_base_1.convert2Number)(it.amount);
    });
    tx.outputs.forEach((it) => {
        it.amount = (0, coin_base_1.convert2Number)(it.amount);
    });
    if (tx.omni) {
        tx.omni.amount = (0, coin_base_1.convert2Number)(tx.omni.amount);
    }
    if (utxoTx.dustSize) {
        tx.dustSize = (0, coin_base_1.convert2Number)(utxoTx.dustSize);
    }
    return tx;
}
exports.convert2UtxoTx = convert2UtxoTx;
//# sourceMappingURL=BtcWallet.js.map