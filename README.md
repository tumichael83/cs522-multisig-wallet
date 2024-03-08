# Testing for MultiSig Wallet

The test cases are written based on [Hardhat](https://hardhat.org/tutorial). 

## Prerequisites

Please ensure that you have installed `Node.js` before getting started. You can download `Node.js` from its [official website](https://nodejs.org/en). You can also install `Node.js` via package manager (refer to [this link](https://nodejs.org/en/download/package-manager)).

## Installation

Please install the dependencies by the command as below:

```shell
npm install
```

## Testing

The test cases are in `test/MultiSigWallet.js`. You can run the following command to test your implementation:

```shell
npm run test
```

Here is the expected output if you properly implement all the functions.

```shell
# npm run test
> multisigwallet@1.0.0 test
> npx hardhat test test/MultisigWallet.js



  Test MultiSig Wallet
    ✔ Test constructor (55ms)
    ✔ Test ownerExist
    ✔ Test submitTransaction
    ✔ Test confirmTransaction
    ✔ Test revokeConfirmation
    ✔ Test confirmTransactionBySignature (41ms)
    ✔ Test executeTransaction (80ms)
    ✔ Test confirmTransactionByPackedSignatures (84ms)
        Your score: 100 / 100 points


  8 passing (2s)
```
