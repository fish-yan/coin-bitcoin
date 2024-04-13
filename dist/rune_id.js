"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuneId = void 0;
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
    next(block, tx) {
        return new RuneId(this.block + block, block === 0 ? this.tx + tx : tx);
    }
    toString() {
        return `${this.block}:${this.tx}`;
    }
    static fromString(s) {
        const [block, tx] = s.split(":");
        if (!block || !tx) {
            return undefined;
        }
        return new RuneId(Number(block), Number(tx));
    }
}
exports.RuneId = RuneId;
//# sourceMappingURL=rune_id.js.map