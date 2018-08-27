let WAS_Token = artifacts.require("./WAS_Token.sol");
let WAS_Crowdsale = artifacts.require("./WAS_Crowdsale.sol");

let IncreaseTime = require("../test/helpers/increaseTime.js");

module.exports = function (deployer, network, accounts) {
    //  TODO: change before deploy
    const RATE = 100;
    const WALLET = accounts[9];
    let timigs = [web3.eth.getBlock("latest").timestamp + IncreaseTime.duration.minutes(1), web3.eth.getBlock("latest").timestamp + IncreaseTime.duration.weeks(1)];

    //  TODO: change before deploy

    deployer.deploy(WAS_Token).then(async () => {
        let token = await WAS_Token.deployed();

        await deployer.deploy(WAS_Crowdsale, RATE, WALLET, token.address, timigs);
        let crowdsale = await WAS_Crowdsale.deployed();
        await token.transferOwnership(crowdsale.address);
        await crowdsale.mintTotalSupply();
    });
};