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
      console.log(issuer, assetNumber, issueDateTime, maturityDateTime, document);
      
      let key = Asset.makeKey([issuer, assetNumber]);
      let currentAsset = await ctx.assetList.getAsset(key);
      if(currentAsset){
        throw new Error('Ya existe un asset con este numero');
      }

      let asset = Asset.createInstance(issuer, assetNumber, issueDateTime, maturityDateTime, document);

      asset.setIssued();

      let mspid = ctx.clientIdentity.getMSPID();
      asset.setOwnerMSP(mspid);

      asset.setOwner(owner);

      console.log(asset);
      await ctx.assetList.addAsset(asset);

      return asset;
    }

    async transfer(ctx, issuer, assetNumber, newOwner, confirmDateTime) {

      // Retrieve the current paper using key fields provided
      let key = Asset.makeKey([issuer, assetNumber]);
      let asset = await ctx.assetList.getAsset(key);

      // Validate current owner's MSP in the paper === invoking transferor's MSP id - can only transfer if you are the owning org.

      if (asset.getOwnerMSP() !== ctx.clientIdentity.getMSPID()) {
          throw new Error('\nPaper ' + issuer + assetNumber + ' is not owned by the current invoking Organisation, and not authorised to transfer');
      }

      // // Paper needs to be 'pending' - which means you need to have run 'buy_pending' transaction first.
      // if ( ! paper.isPending()) {
      //     throw new Error('\nPaper ' + issuer + paperNumber + ' is not currently in state: PENDING for transfer to occur: \n must run buy_request transaction first');
      // }
      // // else all good

      asset.setOwner(newOwner);
      // set the MSP of the transferee (so that, that org may also pass MSP check, if subsequently transferred/sold on)
      // asset.setOwnerMSP(newOwnerMSP);
      asset.setTrading();
      asset.confirmDateTime = confirmDateTime;

      // Update the paper
      await ctx.assetList.updateAsset(asset);
      return asset;
  }

  async validateCurrentAsset(ctx, issuer, assetNumber, resultAssetJSON) {
    // Retrieve the current paper using key fields provided
    let key = Asset.makeKey([issuer, assetNumber]);
    let asset = await ctx.assetList.getAsset(key);

    if(!asset){
      throw new Error('El asset con el id ' + issuer + ':' + assetNumber + ' no existe.')
    }

    let assetJSON = JSON.stringify(asset);
    
    console.log('Current asset: ' + assetJSON);
    console.log('Result asset: ' + resultAssetJSON);

    if(assetJSON == resultAssetJSON){
      return {isValid: true, asset: asset};
    }
    return {isValid: false, asset: asset};
  }

  async queryAll(ctx) {

    let query = new QueryUtils(ctx, 'org.papernet.asset');
    let partial_results = await query.getAll(ctx);

    return partial_results;
  }

  async queryPartial(ctx, prefix) {

    let query = new QueryUtils(ctx, 'org.papernet.asset');
    let partial_results = await query.queryKeyByPartial(prefix);

    return partial_results;
  }

  async queryOwner(ctx, owner) {

    let query = new QueryUtils(ctx, 'org.papernet.asset');
    let owner_results = await query.queryKeyByOwner(owner);

    return owner_results;
  }

  async queryAsset(ctx, issuer, assetNumber) {
    // Retrieve the current paper using key fields provided
    let key = Asset.makeKey([issuer, assetNumber]);
    let asset = await ctx.assetList.getAsset(key);
    return asset;
  }

  async queryAssetHistory(ctx, issuer, assetNumber){
    let query = new QueryUtils(ctx, 'org.papernet.asset');
    let results = await query.getAssetHistory(issuer, assetNumber); // (cpKey);
    return results;
  }
}

module.exports = AssetTransfer;