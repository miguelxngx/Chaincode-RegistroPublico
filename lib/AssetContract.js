'use strict';

const { Contract, Context } = require('fabric-contract-api');

const Asset = require('./Asset.js');
const AssetList = require('./AssetList.js');
const QueryUtils = require('./QueryUtils');

class AssetContext extends Context {

  constructor() {
    super();
    this.assetList = new AssetList(this);
  }
}

class AssetTransfer extends Contract {

    constructor() {
      super('org.papernet.asset');
    }

    createContext(){
      return new AssetContext();
    }

    async instantiate(ctx) {
      console.log('Instantiate the contract');
    }

    async issue(ctx, issuer, owner, assetNumber, issueDateTime, maturityDateTime, document) {
      console.log("Incoming transaction: issue");
      console.log(issuer, owner, assetNumber, issueDateTime, maturityDateTime, document);
      let asset = Asset.createInstance(issuer, owner, assetNumber, issueDateTime, maturityDateTime, document);

      asset.setIssued();

      let mspid = ctx.clientIdentity.getMSPID();
      asset.setOwnerMSP(mspid);

      asset.setOwner(owner);

      console.log(asset);
      await ctx.assetList.addAsset(asset);

      return asset;
    }

    async transfer(ctx, issuer, paperNumber, newOwner, newOwnerMSP, confirmDateTime) {

      // Retrieve the current paper using key fields provided
      let paperKey = CommercialPaper.makeKey([issuer, paperNumber]);
      let paper = await ctx.paperList.getPaper(paperKey);

      // Validate current owner's MSP in the paper === invoking transferor's MSP id - can only transfer if you are the owning org.

      if (paper.getOwnerMSP() !== ctx.clientIdentity.getMSPID()) {
          throw new Error('\nPaper ' + issuer + paperNumber + ' is not owned by the current invoking Organisation, and not authorised to transfer');
      }

      // // Paper needs to be 'pending' - which means you need to have run 'buy_pending' transaction first.
      // if ( ! paper.isPending()) {
      //     throw new Error('\nPaper ' + issuer + paperNumber + ' is not currently in state: PENDING for transfer to occur: \n must run buy_request transaction first');
      // }
      // // else all good
      let creator = ctx.GetStub().GetCreator();
      console.log("Creator => " + creator);

      paper.setOwner(newOwner);
      // set the MSP of the transferee (so that, that org may also pass MSP check, if subsequently transferred/sold on)
      paper.setOwnerMSP(newOwnerMSP);
      paper.setTrading();
      paper.confirmDateTime = confirmDateTime;

      // Update the paper
      await ctx.paperList.updatePaper(paper);
      return paper;
  }

  async queryAll(ctx) {
    // const startKey = '';
    // const endKey = '';
    // const allResults = [];
    // for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
    //     const strValue = Buffer.from(value).toString('utf8');
    //     // const strValue = Asset.fromBuffer(value);
    //     let record;
    //     try {
    //         record = JSON.parse(strValue);
    //     } catch (err) {
    //         console.log(err);
    //         record = strValue;
    //     }
    //     allResults.push({ Key: key, Record: record });
    // }
    // console.info(allResults);
    // return JSON.stringify(allResults);
  
    let query = new QueryUtils(ctx, 'org.papernet.paper');
    let results = await query.getAll(ctx);
    return results;
  }

  async queryOwner(ctx, owner) {

    let query = new QueryUtils(ctx, 'org.papernet.paper');
    let owner_results = await query.queryKeyByOwner(owner);

    return owner_results;
  }

  async queryAsset(ctx, AssetNumber) {
    return ctx.paperList.getPaper(AssetNumber)
  }
}

module.exports = AssetTransfer;