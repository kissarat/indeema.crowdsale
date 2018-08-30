let WAS_Token = artifacts.require("./WAS_Token.sol");
let WAS_Crowdsale = artifacts.require("./WAS_Crowdsale.sol");

let IncreaseTime = require("../test/helpers/increaseTime.js");

module.exports = function (deployer, network, accounts) {
    //  TODO: change before deploy
    const RATES_ETH = [5000, 4000]; //  tokens per ETH
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

    //  Tesing ---
    //  "0xdd870fa1b7c4700f2bd7f44238821c26f7392148", "token_address", [50000000, 40000000], [_opening], [_closing]
    //  "0x583031d1113ad414f02576bd6afabfb302140225"

    // buildTimings(1535635679);

    // function buildTimings(startTime) {
    //     let increasePeriod = 200;

    //     let openingTimings = [];
    //     let closingTimings = [];

    //     for (let i = 0; i < 2; i++) {
    //         if (i == 0) {
    //             openingTimings[i] = startTime + 60;
    //         } else {
    //             openingTimings[i] = closingTimings[i - 1] + 1;
    //         }

    //         closingTimings[i] = openingTimings[i] + increasePeriod;
    //     }

    //     console.log("\nopeningTimings:", openingTimings);
    //     console.log("closingTimings:", closingTimings, "\n");
    // }
    //  --- Tesing

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