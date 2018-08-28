const WAS_Token = artifacts.require("WAS_Token");
const WAS_Crowdsale = artifacts.require("WAS_Crowdsale");

import mockCrowdsale from "./helpers/mocks/mockCrowdsale";

import expectThrow from './helpers/expectThrow';
import {
    advanceBlock
} from './helpers/advanceToBlock';
import increaseTime, {
    duration,
    increaseTimeTo
} from './helpers/increaseTime';
import latestTime from './helpers/latestTime';

contract("Whitelist", (accounts) => {
    let token;
    let crowdsale;

    let mockCrowdsaleData = mockCrowdsale();

    beforeEach("setup", async () => {
        await advanceBlock();

        const RATES_ETH = [300, 500]; //  tokens per ETH
        const WALLET = accounts[9];
        const TEAM_WALLET = accounts[8];
        let openingTimings = [];
        let closingTimings = [];

        for (let i = 0; i < 2; i++) {
            if (i == 0) {
                openingTimings[i] = latestTime() + duration.minutes(1);
            } else {
                openingTimings[i] = closingTimings[i - 1] + 1;
            }

            closingTimings[i] = openingTimings[i] + duration.weeks(1);
        }

        token = await WAS_Token.new();
        crowdsale = await WAS_Crowdsale.new(WALLET, token.address, RATES_ETH, openingTimings, closingTimings);
        await token.transferOwnership(crowdsale.address);
        await crowdsale.mintTotalSupplyAndTeam(TEAM_WALLET);

        //  increase time to open
        increaseTimeTo(openingTimings[0] + duration.minutes(1));
        assert.isTrue(await crowdsale.hasOpened.call(), "crowdsale should be open on beforeEach");
    });



    describe("whitelist in action", () => {
        it("should not purchase if not whitelisted", async () => {
            await expectThrow(crowdsale.sendTransaction({
                from: accounts[1],
                value: web3.toWei(1, "ether")
            }), "should throw if not whitelisted purchase");
        });

        it("should let purchase if whitelisted", async () => {
            let whitelistedAddr = accounts[1];
            await crowdsale.addAddressToWhitelist(whitelistedAddr);

            await crowdsale.sendTransaction({
                from: whitelistedAddr,
                value: web3.toWei(1, "ether")
            });
        });
    });

    describe("modify whitelist", () => {
        it("should validate not owner can not modify", async () => {
            await expectThrow(crowdsale.addAddressToWhitelist(accounts[1], {
                from: accounts[1]
            }), "should throw if not owner tries to modify whitelist");
            await expectThrow(crowdsale.addAddressesToWhitelist([accounts[1]], {
                from: accounts[1]
            }), "should throw if not owner tries to modify whitelist");

            await expectThrow(crowdsale.removeAddressFromWhitelist(accounts[1], {
                from: accounts[1]
            }), "should throw if not owner tries to modify whitelist");
            await expectThrow(crowdsale.removeAddressFromWhitelist(accounts[1], {
                from: accounts[1]
            }), "should throw if not owner tries to modify whitelist");
        });
    });
});