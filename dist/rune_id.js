"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuneId = void 0;
const crypto_lib_1 = require("@okxweb3/crypto-lib");
class RuneId {
    constructor(block, tx) {
        this.block = block;
        this.tx = tx;
    }
    delta(next) {
        const block = next.block - this.block;
        const tx = block === 0 ? next.tx - this.tx : next.tx;
        return new RuneId(block, tx);
    }
    get() {
        const str = `0x${this.block.toString(16)}${this.tx.toString(16)}`;
        return Number(str);
    }
    next(block, tx) {
        return new RuneId(this.block + block, block === 0 ? this.tx + tx : tx);
    }
    toString() {
        return `${this.block.toString(16)}:${this.tx.toString(16)}`;
    }
    static fromString(s) {
        const [block, tx] = s.split(":");
        if (!block || !tx) {
            return undefined;
        }
        return new RuneId(Number((0, crypto_lib_1.hexToBigint)(block)), Number((0, crypto_lib_1.hexToBigint)(tx)));
    }
}
exports.RuneId = RuneId;
//# sourceMappingURL=rune_id.js.map