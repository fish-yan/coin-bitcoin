"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bigintToLEBytes = exports.encodeToVec = exports.encode = exports.decode = void 0;
function decode(buffer) {
    var res = BigInt(0), shift = 0, i = 0, b;
    do {
        if (i >= buffer.length || shift > 49) {
            throw new RangeError('Could not decode varint');
        }
        b = buffer[i++];
        res += BigInt(shift < 28
            ? (b & 0x7F) << shift
            : (b & 0x7F) * Math.pow(2, shift));
        shift += 7;
    } while (b >= 0x80);
    return [res, buffer.length];
}
exports.decode = decode;
function encode(n) {
    let _v = [];
    const v = encodeToVec(n, _v);
    return new Uint8Array(v);
}
exports.encode = encode;
function encodeToVec(n, v) {
    while (n >> BigInt(7) > BigInt(0)) {
        v.push(bigintToLEBytes(n)[0] | 128);
        n >>= BigInt(7);
    }
    v.push(bigintToLEBytes(n)[0]);
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