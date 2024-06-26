"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Psbt = void 0;
const combiner_1 = require("./combiner");
const parser_1 = require("./parser");
const typeFields_1 = require("./typeFields");
const utils_1 = require("./utils");
class Psbt {
    static fromBase64(data, txFromBuffer) {
        const buffer = Buffer.from(data, 'base64');
        return this.fromBuffer(buffer, txFromBuffer);
    }
    static fromHex(data, txFromBuffer) {
        const buffer = Buffer.from(data, 'hex');
        return this.fromBuffer(buffer, txFromBuffer);
    }
    static fromBuffer(buffer, txFromBuffer) {
        const results = (0, parser_1.psbtFromBuffer)(buffer, txFromBuffer);
        const psbt = new this(results.globalMap.unsignedTx);
        Object.assign(psbt, results);
        return psbt;
    }
    constructor(tx) {
        this.inputs = [];
        this.outputs = [];
        this.globalMap = {
            unsignedTx: tx,
        };
    }
    toBase64() {
        const buffer = this.toBuffer();
        return buffer.toString('base64');
    }
    toHex() {
        const buffer = this.toBuffer();
        return buffer.toString('hex');
    }
    toBuffer() {
        return (0, parser_1.psbtToBuffer)(this);
    }
    updateGlobal(updateData) {
        (0, utils_1.updateGlobal)(updateData, this.globalMap);
        return this;
    }
    updateInput(inputIndex, updateData) {
        const input = (0, utils_1.checkForInput)(this.inputs, inputIndex);
        (0, utils_1.updateInput)(updateData, input);
        return this;
    }
    updateOutput(outputIndex, updateData) {
        const output = (0, utils_1.checkForOutput)(this.outputs, outputIndex);
        (0, utils_1.updateOutput)(updateData, output);
        return this;
    }
    addUnknownKeyValToGlobal(keyVal) {
        (0, utils_1.checkHasKey)(keyVal, this.globalMap.unknownKeyVals, (0, utils_1.getEnumLength)(typeFields_1.GlobalTypes));
        if (!this.globalMap.unknownKeyVals)
            this.globalMap.unknownKeyVals = [];
        this.globalMap.unknownKeyVals.push(keyVal);
        return this;
    }
    addUnknownKeyValToInput(inputIndex, keyVal) {
        const input = (0, utils_1.checkForInput)(this.inputs, inputIndex);
        (0, utils_1.checkHasKey)(keyVal, input.unknownKeyVals, (0, utils_1.getEnumLength)(typeFields_1.InputTypes));
        if (!input.unknownKeyVals)
            input.unknownKeyVals = [];
        input.unknownKeyVals.push(keyVal);
        return this;
    }
    addUnknownKeyValToOutput(outputIndex, keyVal) {
        const output = (0, utils_1.checkForOutput)(this.outputs, outputIndex);
        (0, utils_1.checkHasKey)(keyVal, output.unknownKeyVals, (0, utils_1.getEnumLength)(typeFields_1.OutputTypes));
        if (!output.unknownKeyVals)
            output.unknownKeyVals = [];
        output.unknownKeyVals.push(keyVal);
        return this;
    }
    addInput(inputData) {
        this.globalMap.unsignedTx.addInput(inputData);
        this.inputs.push({
            unknownKeyVals: [],
        });
        const addKeyVals = inputData.unknownKeyVals || [];
        const inputIndex = this.inputs.length - 1;
        if (!Array.isArray(addKeyVals)) {
            throw new Error('unknownKeyVals must be an Array');
        }
        addKeyVals.forEach((keyVal) => this.addUnknownKeyValToInput(inputIndex, keyVal));
        (0, utils_1.addInputAttributes)(this.inputs, inputData);
        return this;
    }
    addOutput(outputData) {
        this.globalMap.unsignedTx.addOutput(outputData);
        this.outputs.push({
            unknownKeyVals: [],
        });
        const addKeyVals = outputData.unknownKeyVals || [];
        const outputIndex = this.outputs.length - 1;
        if (!Array.isArray(addKeyVals)) {
            throw new Error('unknownKeyVals must be an Array');
        }
        addKeyVals.forEach((keyVal) => this.addUnknownKeyValToInput(outputIndex, keyVal));
        (0, utils_1.addOutputAttributes)(this.outputs, outputData);
        return this;
    }
    clearFinalizedInput(inputIndex) {
        const input = (0, utils_1.checkForInput)(this.inputs, inputIndex);
        (0, utils_1.inputCheckUncleanFinalized)(inputIndex, input);
        for (const key of Object.keys(input)) {
            if (![
                'witnessUtxo',
                'nonWitnessUtxo',
                'finalScriptSig',
                'finalScriptWitness',
                'unknownKeyVals',
            ].includes(key)) {
                delete input[key];
            }
        }
        return this;
    }
    combine(...those) {
        const result = (0, combiner_1.combine)([this].concat(those));
        Object.assign(this, result);
        return this;
    }
    getTransaction() {
        return this.globalMap.unsignedTx.toBuffer();
    }
}
exports.Psbt = Psbt;
//# sourceMappingURL=psbt.js.map