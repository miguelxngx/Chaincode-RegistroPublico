'use strict';

const State = require('../ledger-api/state');

class QueryUtils{
    constructor(ctx, listName) {
        this.ctx = ctx;
        this.name = listName;
        //this.supportedTypes = {};
    }

    async getAll(ctx){
        const resultsIterator = await this.ctx.stub.getStateByRange('A','Z');
        let results = await this.getAllResults(resultsIterator, true);

        return results;
    }

    async getAssetHistory(issuer, assetNumber) {
        let ledgerKey = await this.ctx.stub.createCompositeKey(this.name, [issuer, assetNumber]);
        const resultsIterator = await this.ctx.stub.getHistoryForKey(ledgerKey);
        let results = await this.getAllResults(resultsIterator, true);

        return results;
    }

    async queryKeyByPartial(assetspace) {

        if (arguments.length < 1) {
            throw new Error('Incorrect number of arguments. Expecting 1');
        }
        // ie namespace + prefix to assets etc eg 
        // "Key":"org.papernet.paperMagnetoCorp0001"   (0002, etc)
        // "Partial":'org.papernet.paperlistMagnetoCorp"'  (using partial key, find keys "0001", "0002" etc)
        const resultsIterator = await this.ctx.stub.getStateByPartialCompositeKey(this.name, [assetspace]);
        let method = this.getAllResults;
        let results = await method(resultsIterator, false);

        return results;
    }

    async queryKeyByOwner(owner) {
        //  
        let self = this;
        let queryString = {};
        queryString.selector = {};
        //  queryString.selector.docType = 'indexOwnerDoc';
        queryString.selector.owner = owner;
        // set to (eg)  '{selector:{owner:MagnetoCorp}}'
        let method = self.getQueryResultForQueryString;
        let queryResults = await method(this.ctx, self, JSON.stringify(queryString));
        return queryResults;
    }

    async getQueryResultForQueryString(ctx, self, queryString) {

        // console.log('- getQueryResultForQueryString queryString:\n' + queryString);

        const resultsIterator = await ctx.stub.getQueryResult(queryString);
        let results = await self.getAllResults(resultsIterator, false);

        return results;

    }

    /**
     * Function getAllResults
     * @param {resultsIterator} iterator within scope passed in
     * @param {Boolean} isHistory query string created prior to calling this fn
    */
    async getAllResults(iterator, isHistory) {
        let allResults = [];
        let res = { done: false, value: null };

        while (true) {
            res = await iterator.next();
            let jsonRes = {};
            if (res.value && res.value.value.toString()) {
                if (isHistory && isHistory === true) {
                    //jsonRes.TxId = res.value.tx_id;
                    jsonRes.TxId = res.value.txId;
                    jsonRes.Timestamp = res.value.timestamp;
                    jsonRes.Timestamp = new Date((res.value.timestamp.seconds.low * 1000));
                    let ms = res.value.timestamp.nanos / 1000000;
                    jsonRes.Timestamp.setMilliseconds(ms);
                    if (res.value.is_delete) {
                        jsonRes.IsDelete = res.value.is_delete.toString();
                    } else {
                        try {
                            jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
                            // report the commercial paper states during the asset lifecycle, just for asset history reporting
                            switch (jsonRes.Value.currentState) {
                                case 1:
                                    jsonRes.Value.currentState = 'ISSUED';
                                    break;
                                case 2:
                                    jsonRes.Value.currentState = 'PENDING';
                                    break;
                                case 3:
                                    jsonRes.Value.currentState = 'TRADING';
                                    break;
                                case 4:
                                    jsonRes.Value.currentState = 'REDEEMED';
                                    break;
                                default: // else, unknown named query
                                    jsonRes.Value.currentState = 'UNKNOWN';
                            }

                        } catch (err) {
                            console.log(err);
                            jsonRes.Value = res.value.value.toString('utf8');
                        }
                    }
                } else { // non history query ..
                    jsonRes.Key = res.value.key;
                    try {
                        console.log(res.value.value);
                        jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                    } catch (err) {
                        console.log(err);
                        jsonRes.Record = res.value.value.toString('utf8');
                    }
                }
                allResults.push(jsonRes);
            }
            // check to see if we have reached the end
            if (res.done) {
                // explicitly close the iterator 
                console.log('iterator is done');
                await iterator.close();
                console.log(allResults);
                return allResults;
            }

        }  // while true
    }
}

module.exports = QueryUtils;