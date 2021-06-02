'use strict';

// Utility class for collections of ledger states --  a state list
const StateList = require('./../ledger-api/statelist.js');

const Asset = require('./Asset.js');

class AssetList extends StateList {
    constructor(ctx) {
        super(ctx, 'org.papernet.asset');
        this.use(Asset);
    }

    async addAsset(asset) {
        return this.addState(asset);
    }

    async getAsset(assetKey) {
        return this.getState(assetKey);
    }

    async updateAsset(asset) {
        return this.updateState(asset);
    }
}

module.exports = AssetList;