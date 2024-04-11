import { RuneId } from "./rune_id";
type utxoInput = {
    txId: string;
    vOut: number;
    amount: number;
    address?: string;
    reedScript?: string;
    privateKey?: string;
    publicKey?: string;
    sequence?: number;
    nonWitnessUtxo?: string;
    bip32Derivation?: Bip32Derivation[];
    derivationPath?: string;
    sighashType?: number;
    data?: any;
};
type Bip32Derivation = {
    masterFingerprint: string;
    pubkey: string;
    path: string;
    leafHashes?: string[];
};
type utxoOutput = {
    address: string;
    amount: number;
    omniScript?: string;
    bip32Derivation?: Bip32Derivation[];
    derivationPath?: string;
    isChange?: boolean;
    data?: any;
};
type omniOutput = {
    coinType?: number;
    amount: number;
};
type utxoTx = {
    inputs: [];
    outputs: [];
    address: string;
    feePerB?: number;
    decimal?: number;
    fee?: number;
    omni?: omniOutput;
    dustSize?: number;
    bip32Derivation?: Bip32Derivation[];
    derivationPath?: string;
    memo?: string;
    memoPos?: number;
    runeData?: RuneData;
};
type RuneData = {
    edicts: Edict[];
    etching?: Etching;
    mint?: RuneId;
    pointer?: number;
    burn?: boolean;
};
type Etching = {
    divisibility?: number;
    premine?: number;
    rune?: string;
    spacers?: number;
    symbol?: string;
    terms?: Terms;
};
type Terms = {
    amount?: number;
    cap?: number;
    height?: [number, number];
    offset?: [number, number];
};
type Edict = {
    id: RuneId;
    amount: bigint | string;
    output: number;
};
type ListingData = {
    nftAddress: string;
    nftUtxo: {
        txHash: string;
        vout: number;
        coinAmount: number;
        rawTransation: string;
    };
    receiveBtcAddress: string;
    price: number;
};
type BuyingData = {
    dummyUtxos: {
        txHash: string;
        vout: number;
        coinAmount: number;
        rawTransation: string;
    }[];
    paymentUtxos: {
        txHash: string;
        vout: number;
        coinAmount: number;
        rawTransation: string;
    }[];
    receiveNftAddress: string;
    paymentAndChangeAddress: string;
    feeRate: number;
    sellerPsbts: string[];
};
type toSignInput = {
    index: number;
    address: string;
    publicKey?: string;
    sighashTypes?: number[];
    disableTweakSigner?: boolean;
};
type signPsbtOptions = {
    autoFinalized?: boolean;
    toSignInputs?: toSignInput[];
};
export { utxoInput, utxoOutput, omniOutput, utxoTx, ListingData, BuyingData, RuneData, Edict, Etching, toSignInput, signPsbtOptions };
