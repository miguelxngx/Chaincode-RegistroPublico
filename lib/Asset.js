'use strict';

const State = require('./../ledger-api/state.js');

const cpState = {
    ISSUED: 1,
    PENDING: 2,
    TRADING: 3,
    REDEEMED: 4
};

class Asset extends State {
    constructor(obj) {
        super(Asset.getClass(), [obj.issuer, obj.assetNumber]);
        Object.assign(this, obj);
    }

    getIssuer() {
        return this.issuer;
    }

    setIssuer(newIssuer) {
        this.issuer = newIssuer;
    }

    getOwner() {
        return this.owner;
    }

    setOwnerMSP(mspid) {
        this.mspid =mspid;
    }

    getOwnerMSP() {
        return this.mspid;
    }

    setOwner(newOwner) {
        this.owner = newOwner;
    }

    /**
     * Useful methods to encapsulate commercial paper states
     */
    setIssued() {
        this.currentState = cpState.ISSUED;
    }

    setTrading() {
        this.currentState = cpState.TRADING;
    }

    setRedeemed() {
        this.currentState = cpState.REDEEMED;
    }

    setPending() {
        this.currentState = cpState.PENDING;
    }

    isIssued() {
        return this.currentState === cpState.ISSUED;
    }

    isTrading() {
        return this.currentState === cpState.TRADING;
    }

    isRedeemed() {
        return this.currentState === cpState.REDEEMED;
    }

    isPending() {
        return this.currentState === cpState.PENDING;
    }

    static fromBuffer(buffer) {
        return Asset.deserialize(buffer);
    }

    toBuffer() {
        return Buffer.from(JSON.stringify(this));
    }

    /**
     * Deserialize a state data to commercial paper
     * @param {Buffer} data to form back into the object
     */
    static deserialize(data) {
        return State.deserializeClass(data, Asset);
    }

    /**
     * Factory method to create a commercial paper object
     */
    static createInstance(issuer, assetNumber, issueDateTime, maturityDateTime, document) {
        return new Asset({ issuer, assetNumber, issueDateTime, maturityDateTime, document});
    }

    static getClass() {
        return 'org.papernet.asset';
    }
}

module.exports = Asset;