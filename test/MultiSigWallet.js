const { expect } = require('chai');
const { ethers } = require('hardhat');



function getMessageHash(_destination, _value, _data, _nonce) {
    const encoded = ethers.solidityPacked(
        ["address", "uint256", "bytes", "uint256"],
        [_destination, _value, _data, _nonce]
    );

    const hash = ethers.keccak256(encoded);

    return hash;
}



describe('Test MultiSig Wallet', function () {
    let deployer, owner0, owner1, owner2, owner3, owner4, owner5, non_owner;
    let requiredConfirmations;
    let wallet;
    let score = 0;

    before(async function () {
        /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
        [ deployer, owner0, owner1, owner2, owner3, owner4, owner5, non_owner ] = await ethers.getSigners();
        requiredConfirmations = 4;

        const owners = [owner0.address, owner1.address, owner2.address, owner3.address, owner4.address, owner5.address];
        const MultiSigWallet = await ethers.getContractFactory('MultiSigWallet');

        await expect(MultiSigWallet.deploy([], 0)).to.be.revertedWith('owners required');
        await expect(MultiSigWallet.deploy([owner0.address], 0)).to.be.revertedWith('invalid number of required confirmations');
        await expect(MultiSigWallet.deploy([owner0.address], 2)).to.be.revertedWith('invalid number of required confirmations');

        wallet = await MultiSigWallet.deploy(owners, requiredConfirmations);

        score += 10;
    });

    it('Test constructor', async function () {
        const owners = [owner0.address, owner1.address, owner2.address, owner3.address, owner4.address, owner5.address];
        expect(owners).to.have.same.members(await wallet.getOwners());
        for (let i = 0; i < 6; i++) {
            expect(await wallet.isOwner(owners[i])).to.eq(true);
        }
        expect(await wallet.requiredConfirmations()).to.eq(requiredConfirmations);
        expect(await wallet.transactionCount()).to.eq(0);

        score += 20;
    });

    it('Test ownerExist', async function () {
        const destination = deployer.address;
        const value = 0;
        const data = ethers.randomBytes(32);

        await expect(wallet.connect(non_owner).submitTransaction(destination, value, data)).to.be.reverted;
        score += 5;
    });

    it('Test submitTransaction', async function () {
        const destination = deployer.address;
        const value = 0;
        const data = ethers.randomBytes(32);

        await expect(wallet.connect(owner0).submitTransaction(destination, value, data)).to.emit(wallet, 'SubmitTransaction').withArgs(owner0.address, 0, destination, value, data);
        
        const transaction = await wallet.transactions(0);

        expect(transaction.destination).to.eq(destination);
        expect(transaction.value).to.eq(value);
        expect(transaction.data).to.eq(ethers.hexlify(data));
        expect(transaction.executed).to.eq(false);

        score += 10;
    });

    it('Test confirmTransaction', async function () {
        const transactionCount = await wallet.transactionCount();
        const transactionId = transactionCount - BigInt(1);

        await expect(wallet.connect(non_owner).confirmTransaction(transactionId)).to.be.reverted;

        expect(await wallet.connect(owner0).confirmTransaction(transactionId)).to.emit(wallet, 'ConfirmTransaction').withArgs(owner0.address, BigInt(transactionId));
        expect(await wallet.confirmations(transactionId, owner0.address)).to.eq(true);

        score += 10;
    });

    it('Test revokeConfirmation', async function () {
        const transactionCount = await wallet.transactionCount();
        const transactionId = transactionCount - BigInt(1);

        expect(await wallet.connect(owner0).revokeConfirmation(transactionId)).to.emit(wallet, 'RevokeConfirmation').withArgs(owner0.address, transactionId);
        expect(await wallet.confirmations(transactionId, owner0.address)).to.eq(false);

        score += 5;
    });

    it('Test confirmTransactionBySignature', async function () {
        const transactionCount = await wallet.transactionCount();
        const transactionId = transactionCount - BigInt(1);
        const transaction = await wallet.transactions(transactionId);

        const message_hash = getMessageHash(transaction.destination, transaction.value, transaction.data, transactionId);
        const signature = await owner1.signMessage(ethers.getBytes(message_hash));
        expect(await wallet.connect(non_owner).confirmTransactionBySignature(transactionId, signature)).to.emit(wallet, 'ConfirmTransaction').withArgs(owner1.address, transactionId);
        expect(await wallet.confirmations(transactionId, owner1.address)).to.eq(true);

        score += 10;
    });

    it('Test executeTransaction', async function () {
        const transactionCount = await wallet.transactionCount();
        const transactionId = transactionCount - BigInt(1);

        await expect(wallet.connect(owner0).executeTransaction(transactionId)).to.be.reverted;

        await wallet.connect(owner2).confirmTransaction(transactionId);
        await wallet.connect(owner3).confirmTransaction(transactionId);
        await wallet.connect(owner4).confirmTransaction(transactionId);
        await wallet.connect(owner5).confirmTransaction(transactionId);    

        expect(await wallet.connect(owner0).executeTransaction(transactionId)).to.emit(wallet, 'ExecuteTransaction').withArgs(owner0.address, transactionId);
        expect((await wallet.transactions(transactionId)).executed).to.eq(true);

        score += 10;
    });

    it("Test confirmTransactionByPackedSignatures", async function () {
        const destination = deployer.address;
        const value = 0;
        const data = ethers.randomBytes(32);
        
        await wallet.connect(owner0).submitTransaction(destination, value, data);
        const transactionCount = await wallet.transactionCount();
        const transactionId = transactionCount - BigInt(1);
        const transaction = await wallet.transactions(transactionId);

        const message_hash = getMessageHash(transaction.destination, transaction.value, transaction.data, transactionId);
        const signature1 = await owner1.signMessage(ethers.getBytes(message_hash));
        const signature2 = await owner2.signMessage(ethers.getBytes(message_hash));
        const signature3 = await owner3.signMessage(ethers.getBytes(message_hash));
        const signature4 = await owner4.signMessage(ethers.getBytes(message_hash));
        const signature5 = await owner5.signMessage(ethers.getBytes(message_hash));
        
        const signatures = ethers.concat([signature1, signature2, signature3, signature4, signature5]);
        await wallet.connect(non_owner).confirmTransactionByPackedSignatures(transactionId, signatures);
        expect(await wallet.confirmations(transactionId, owner1.address)).to.eq(true);
        expect(await wallet.confirmations(transactionId, owner2.address)).to.eq(true);
        expect(await wallet.confirmations(transactionId, owner3.address)).to.eq(true);
        expect(await wallet.confirmations(transactionId, owner4.address)).to.eq(true);
        expect(await wallet.confirmations(transactionId, owner5.address)).to.eq(true);

        score += 20;
    });

    after(async function () {
        console.log(`\tYour score: \x1b[32m${score}\x1b[0m / \x1b[31m100\x1b[0m points`);
    });
});
