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
exports.TagUtils = exports.Tag = void 0;
const varint = __importStar(require("./varint"));
var Tag;
(function (Tag) {
    Tag[Tag["Body"] = 0] = "Body";
    Tag[Tag["Flags"] = 2] = "Flags";
    Tag[Tag["Rune"] = 4] = "Rune";
    Tag[Tag["Premine"] = 6] = "Premine";
    Tag[Tag["Cap"] = 8] = "Cap";
    Tag[Tag["Amount"] = 10] = "Amount";
    Tag[Tag["HeightStart"] = 12] = "HeightStart";
    Tag[Tag["HeightEnd"] = 14] = "HeightEnd";
    Tag[Tag["OffsetStart"] = 16] = "OffsetStart";
    Tag[Tag["OffsetEnd"] = 18] = "OffsetEnd";
    Tag[Tag["Mint"] = 20] = "Mint";
    Tag[Tag["Pointer"] = 22] = "Pointer";
    Tag[Tag["Cenotaph"] = 126] = "Cenotaph";
    Tag[Tag["Divisibility"] = 1] = "Divisibility";
    Tag[Tag["Spacers"] = 3] = "Spacers";
    Tag[Tag["Symbol"] = 5] = "Symbol";
    Tag[Tag["Nop"] = 127] = "Nop";
})(Tag = exports.Tag || (exports.Tag = {}));
exports.TagUtils = {
    encode: (payload, tag, values) => {
        for (const value of values) {
            varint.encodeToVec(BigInt(tag), payload);
            varint.encodeToVec(value, payload);
        }
    },
    encode_option: (payload, tag, value) => {
        if (value != undefined) {
            exports.TagUtils.encode(payload, tag, [BigInt(value)]);
        }
    },
};
//# sourceMappingURL=tag.js.map