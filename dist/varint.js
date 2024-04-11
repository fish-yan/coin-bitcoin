"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bigintToLEBytes = exports.encodeToVec = exports.encode = exports.decode = void 0;
function decode(buffer) {
    let n = BigInt(0);
    let i = 0;
    while (true) {
        if (i >= buffer.length) {
            throw new Error('Varint decoding error: Buffer underflow');
        }
        const byte = BigInt(buffer[i]);
        if (byte < BigInt(128)) {
            return [n + byte, i + 1];
        }
        n += byte - BigInt(127);
        n *= BigInt(128);
        i++;
    }
}
exports.decode = decode;
function encode(n) {
    let _v = [];
    const v = encodeToVec(n, _v);
    return new Uint8Array(v);
}
exports.encode = encode;
function encodeToVec(n, v) {
    let out = new Array(19).fill(0);
    let i = 18;
    out[i] = bigintToLEBytes(n)[0] & 127;
    while (n > BigInt(0x7f)) {
        n = n / BigInt(128) - BigInt(1);
        i -= 1;
        out[i] = bigintToLEBytes(n)[0] | 128;
    }
    v.push(...out.slice(i));
    return v;
}
exports.encodeToVec = encodeToVec;
function bigintToLEBytes(bn) {
    const byteSize = Math.ceil(bn.toString(2).length / 8);
    const bytes = new Uint8Array(byteSize);
    for (let i = 0; i < byteSize; i++) {
        bytes[i] = Number(bn & BigInt(0xff));
        bn >>= BigInt(8);
    }
    return bytes;
}
exports.bigintToLEBytes = bigintToLEBytes;
//# sourceMappingURL=varint.js.map