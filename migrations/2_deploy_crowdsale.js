let WAS_Token = artifacts.require("./WAS_Token.sol");
let WAS_Crowdsale = artifacts.require("./WAS_Crowdsale.sol");

let IncreaseTime = require("../test/helpers/increaseTime.js");

module.exports = function (deployer, network, accounts) {
    //  TODO: change before deploy
    const RATES_ETH = [300, 500]; //  tokens per ETH
    const WALLET = accounts[9];
    const TEAM_WALLET = accounts[8];
    let openingTimings = [];
    let closingTimings = [];

    for (let i = 0; i < 2; i++) {
        if (i == 0) {
            openingTimings[i] = web3.eth.getBlock("latest").timestamp + IncreaseTime.duration.minutes(1);
        } else {
            openingTimings[i] = closingTimings[i - 1] + 1;
        }

        closingTimings[i] = openingTimings[i] + IncreaseTime.duration.weeks(1);
    }
    //  TODO: change before deploy

    deployer.deploy(WAS_Token).then(async () => {
        let token = await WAS_Token.deployed();

        await deployer.deploy(WAS_Crowdsale, WALLET, token.address, RATES_ETH, openingTimings, closingTimings);
        let crowdsale = await WAS_Crowdsale.deployed();
        //  1
        await token.transferOwnership(crowdsale.address);
        //  2
        await crowdsale.mintTotalSupplyAndTeam(TEAM_WALLET);
    });
};