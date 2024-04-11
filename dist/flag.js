"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromFlag = exports.FlagFromBigIntValues = exports.FlagFromBigInt = exports.FlagUtils = exports.Flag = void 0;
var Flag;
(function (Flag) {
    Flag[Flag["Etching"] = 0] = "Etching";
    Flag[Flag["Terms"] = 1] = "Terms";
    Flag[Flag["Cenotaph"] = 127] = "Cenotaph";
})(Flag = exports.Flag || (exports.Flag = {}));
exports.FlagUtils = {
    mask: (self) => BigInt(1) << BigInt(self),
    take: (self, flags) => {
        const mask = exports.FlagUtils.mask(self);
        const set = Boolean(flags & mask);
        flags ^= mask;
        return set;
    },
    set: (self, flags) => {
        flags |= exports.FlagUtils.mask(self);
        return flags;
    },
};
exports.FlagFromBigInt = {
    0: BigInt(1) << BigInt(0),
    1: BigInt(1) << BigInt(1),
    127: BigInt(1) << BigInt(127),
};
exports.FlagFromBigIntValues = {
    0: BigInt(1) << BigInt(0),
    1: BigInt(1) << BigInt(1),
    127: BigInt(1) << BigInt(127),
};
function fromFlag(flag) {
    return exports.FlagUtils.mask(flag);
}
exports.fromFlag = fromFlag;
//# sourceMappingURL=flag.js.map