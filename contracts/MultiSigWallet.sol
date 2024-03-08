// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4 <0.9.0;

contract MultiSigWallet {
    /*
     *  Events
     */
    event SubmitTransaction(
        address indexed owner,
        uint indexed transactionID,
        address indexed to,
        uint value,
        bytes data
    );

    event ConfirmTransaction(
        address indexed owner,
        uint indexed transactionID
    );

    // TODO: implement RevokeConfirmation event
    // hint: you can follow the style of event ConfirmTransaction
    event RevokeConfirmation(
    );

    event ExecuteTransaction(
        address indexed owner,
        uint indexed transactionID
    );


    /*
     *  Storage
     */
    struct Transaction {
        address destination;
        bool executed;
        uint value;
        bytes data;
    }
    // number of transactions
    uint public transactionCount;
    // number of required confirmations
    uint public requiredConfirmations;
    // mapping from transaction Id => transaction
    mapping (uint => Transaction) public transactions;
    // mapping from transaction Id => owner => bool
    mapping (uint => mapping (address => bool)) public confirmations;
    // owners
    address[] public owners;
    mapping (address => bool) public isOwner;

    
    /*
     *  Modifiers
     */
    modifier ownerExists() {
        // TODO: check if msg.sender is owner
        // The check usually is the form of 'require(condition, "error message");'
        _;
    }

    modifier transactionExists(uint transactionID) {
        require(transactions[transactionID].destination != address(0), "transaction does not exist");
        _;
    }

    modifier isConfirmed(uint transactionID) {
        require(confirmations[transactionID][msg.sender], "transaction is not confirmed");
        _;
    }

    modifier notConfirmed(uint transactionID) {
        require(!confirmations[transactionID][msg.sender], "transaction is confirmed");
        _;
    }

    modifier notExecuted(uint transactionID) {
        require(!transactions[transactionID].executed, "transaction is already executed");
        _;
    }


    /*
     * Public functions
     */
    receive() external payable {}

    constructor(address[] memory _owners, uint _requiredConfirmations) {
        // TODO: implement constructor function
        // 1. check _owners is not empty, replace condition1 with the correct condition
        require(condition1, "owners required");
        // 2. check _requiredConfirmations is not zero and not greater than _owners.length, replace condition2 with the correct condition
        require(condition2, "invalid number of required confirmations");
        // 3. push _owners to owners array, and set isOwner to true
        // 4. set requiredConfirmations to _requiredConfirmations and transactionCount to zero
    }

    function submitTransaction(
        address _destination,
        uint _value,
        bytes memory _data
    ) public ownerExists {
        // TODO: implement submitTransaction function
        // hint: use transactionCount to get transactionID
        // hint: use transactions mapping to store transaction
    }

    function confirmTransaction(uint _transactionID) public ownerExists transactionExists(_transactionID) notExecuted(_transactionID) notConfirmed(_transactionID) {
        // TODO: implement confirmTransaction function
        // hint: use confirmations mapping and emit ConfirmTransaction event
    }

    function confirmTransactionBySignature(
        uint _transactionID,
        bytes memory signature
    ) public transactionExists(_transactionID) notExecuted(_transactionID) {
        Transaction storage transaction = transactions[_transactionID];
        bytes32 r;  // first 32 bytes of signature
        bytes32 s;  // second 32 bytes of signature
        uint8 v;    // final 1 byte of signature

        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := and(mload(add(signature, 0x41)), 0xff)
        }

        address signer = recoverSigner(
            _transactionID,
            transaction.destination,
            transaction.value,
            transaction.data,
            r,
            s,
            v
        );

        require(
            isOwner[signer],
            "invalid signature"
        );

        confirmations[_transactionID][signer] = true;
        emit ConfirmTransaction(signer, _transactionID);
    }

    function confirmTransactionByPackedSignatures(
        uint _transactionID,
        bytes memory signatures
    ) public transactionExists(_transactionID) notExecuted(_transactionID) {
        // TODO: implement confirmTransactionByPackedSignatures function
        // hint: read confirmTransactionBySignature function and learn how to split bytes using Solidity
        
    }

    function revokeConfirmation(uint _transactionID) public ownerExists transactionExists(_transactionID) notExecuted(_transactionID) isConfirmed(_transactionID) {
        confirmations[_transactionID][msg.sender] = false;

        emit RevokeConfirmation(msg.sender, _transactionID);
    }

    function executeTransaction(uint _transactionID) public ownerExists transactionExists(_transactionID) notExecuted(_transactionID) {
        Transaction storage transaction = transactions[_transactionID];

        require(
            getConfirmationCount(_transactionID) >= requiredConfirmations,
            "cannot execute transaction"
        );

        transaction.executed = true;

        (bool success, ) = transaction.destination.call{value: transaction.value}(
            transaction.data
        );
        require(success, "transaction fails");

        emit ExecuteTransaction(msg.sender, _transactionID);
    }


    /*
     *  Read-only functions
     */
    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    function getTransactionCount() public view returns (uint) {
        return transactionCount;
    }

    function getTransaction(uint _transactionID) public view
        returns (
            address to,
            uint value,
            bytes memory data,
            bool executed,
            uint confirmationCount
        )
    {
        Transaction storage transaction = transactions[_transactionID];

        return (
            transaction.destination,
            transaction.value,
            transaction.data,
            transaction.executed,
            getConfirmationCount(_transactionID)
        );
    }

    function getConfirmationCount(uint transactionID) public view returns (uint) {
       // TODO: implement getConfirmationCount function
       // hint: use confirmations mapping and owners array
    }

    function getTransactionHash(
        address _destination,
        uint _value,
        bytes memory _data,
        uint _nonce
    ) public pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked("\x19Ethereum Signed Message:\n32", keccak256(abi.encodePacked(_destination, _value, _data, _nonce)))
            );
    }

    function recoverSigner(
        uint _transactionID,
        address _destination,
        uint _value,
        bytes memory _data,
        bytes32 r,
        bytes32 s,
        uint8 v
    ) public pure returns (address) {
        bytes32 transactionHash = getTransactionHash(
            _destination,
            _value,
            _data,
            _transactionID
        );

        // TODO: implement recoverSigner function
        // hint: use ecrecover function
    }
}
