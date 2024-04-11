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
exports.Message = exports.buildRuneData = exports.RuneStone = void 0;
const bitcoin = __importStar(require("./bitcoinjs-lib"));
const ops_1 = require("./bitcoinjs-lib/ops");
const flag_1 = require("./flag");
const tag_1 = require("./tag");
const rune_id_1 = require("./rune_id");
const crypto_lib_1 = require("@okxweb3/crypto-lib");
const rune_1 = require("./rune");
const varint = __importStar(require("./varint"));
class RuneStone {
    constructor(edicts, etching, mint, pointer) { }
    payload(transaction) {
        for (const output of transaction.outs) {
            const script = bitcoin.script.decompile(output.script);
            if (script && script[0] === ops_1.OPS.OP_RETURN) {
                if (script.length > 1 && script[1] && script[1] === ops_1.OPS.OP_13) {
                    let payload = Buffer.alloc(0);
                    for (let i = 2; i < script.length; i++) {
                        if (Buffer.isBuffer(script[i])) {
                            payload = Buffer.concat([payload, script[i]]);
                        }
                    }
                    return payload;
                }
            }
        }
        return null;
    }
}
exports.RuneStone = RuneStone;
function buildRuneData(isMainnet, runeData) {
    let edicts = runeData.edicts;
    let payload = [];
    let etching = runeData.etching;
    if (etching != undefined) {
        let flags = BigInt(0);
        flags = flag_1.FlagUtils.set(flag_1.Flag.Etching, flags);
        if (etching.terms != undefined) {
            flags = flag_1.FlagUtils.set(flag_1.Flag.Terms, flags);
        }
        tag_1.TagUtils.encode(payload, tag_1.Tag.Flags, [flags]);
        if (etching.rune != undefined) {
            let rune = rune_1.Rune.fromString(etching.rune);
            tag_1.TagUtils.encode_option(payload, tag_1.Tag.Rune, rune.value);
        }
        tag_1.TagUtils.encode_option(payload, tag_1.Tag.Divisibility, etching.divisibility);
        tag_1.TagUtils.encode_option(payload, tag_1.Tag.Spacers, etching.spacers);
        if (etching.symbol != undefined) {
            tag_1.TagUtils.encode_option(payload, tag_1.Tag.Symbol, (0, crypto_lib_1.textToBigint)(etching.symbol));
        }
        tag_1.TagUtils.encode_option(payload, tag_1.Tag.Premine, etching.premine);
        if (etching.terms != undefined) {
            let terms = etching.terms;
            if (typeof terms.amount === "string") {
                terms.amount = Number(terms.amount);
            }
            tag_1.TagUtils.encode_option(payload, tag_1.Tag.Amount, terms.amount);
            tag_1.TagUtils.encode_option(payload, tag_1.Tag.Cap, terms.cap);
            tag_1.TagUtils.encode_option(payload, tag_1.Tag.HeightStart, terms.height?.[0]);
            tag_1.TagUtils.encode_option(payload, tag_1.Tag.HeightEnd, terms.height?.[1]);
            tag_1.TagUtils.encode_option(payload, tag_1.Tag.OffsetStart, terms.offset?.[0]);
            tag_1.TagUtils.encode_option(payload, tag_1.Tag.OffsetEnd, terms.offset?.[1]);
        }
    }
    if (runeData.mint != undefined) {
        let mint = runeData.mint;
        tag_1.TagUtils.encode(payload, tag_1.Tag.Mint, [BigInt(mint.block), BigInt(mint.tx)]);
    }
    tag_1.TagUtils.encode_option(payload, tag_1.Tag.Pointer, runeData.pointer);
    for (let edict of edicts) {
        if (typeof edict.amount === "string") {
            edict.amount = BigInt(edict.amount);
        }
    }
    if (edicts.length > 0) {
        varint.encodeToVec(BigInt(tag_1.Tag.Body), payload);
        edicts.sort((a, b) => {
            if (a.id.block == b.id.block) {
                return a.id.tx - b.id.tx;
            }
            return a.id.block - b.id.block;
        });
        let id = 0;
        let previous = new rune_id_1.RuneId(0, 0);
        for (const edict of edicts) {
            let { block, tx } = previous.delta(edict.id);
            varint.encodeToVec(BigInt(block), payload);
            varint.encodeToVec(BigInt(tx), payload);
            varint.encodeToVec(BigInt(edict.amount), payload);
            varint.encodeToVec(BigInt(edict.output), payload);
            previous = edict.id;
        }
    }
    let prefix;
    if (isMainnet) {
        prefix = ops_1.OPS.OP_13;
    }
    else {
        prefix = Buffer.from('RUNE_TEST');
    }
    const opReturnScript = bitcoin.script.compile([ops_1.OPS.OP_RETURN, prefix, Buffer.from(payload)]);
    return opReturnScript;
}
exports.buildRuneData = buildRuneData;
class Message {
    constructor(fields, edicts) {
        this.fields = fields;
        this.edicts = edicts;
    }
    static fromIntegers(payload) {
        const edicts = [];
        const fields = new Map();
        const flaws = 0;
        for (let i = 0; i < payload.length; i += 2) {
            const tag = payload[i];
            if (tag === BigInt(tag_1.Tag.Body)) {
                let id = new rune_id_1.RuneId(0, 0);
                for (let j = i + 1; j < payload.length; j += 4) {
                    const block = payload[i];
                    const tx = payload[j + 1];
                    const amount = payload[j + 2];
                    const output = payload[j + 3];
                    const runeId = id.next(Number(block), Number(tx));
                    edicts.push({
                        id: runeId,
                        amount: amount,
                        output: Number(output)
                    });
                    id = runeId;
                }
                break;
            }
            const value = payload[i + 1];
            if (!fields.get(tag)) {
                fields.set(tag, value);
            }
        }
        return new Message(fields, edicts);
    }
}
exports.Message = Message;
//# sourceMappingURL=runestone.js.map