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

        const WALLET = accounts[9];
        let timings = [latestTime() + duration.minutes(1), latestTime() + duration.weeks(1)];

        token = await WAS_Token.new();
        crowdsale = await WAS_Crowdsale.new(mockCrowdsaleData.rate, WALLET, token.address, timings);
        await token.transferOwnership(crowdsale.address);
        await crowdsale.mintTotalSupply();

        increaseTimeTo(timings[0] + duration.minutes(1));
        assert.isTrue(await crowdsale.hasOpened.call(), "crowdsale should be open on beforeEach");
    });



    describe("whitelist in action", () => {
        it("should not purchase if not whitelisted", async () => {
            await expectThrow(crowdsale.sendTransaction({
                from: accounts[1],
                value: 1
            }), "should throw if not whitelisted purchase");
        });

        it("should let purchase if whitelisted", async () => {
            let whitelistedAddr = accounts[1];
            crowdsale.addAddressToWhitelist(whitelistedAddr);

            await crowdsale.sendTransaction({
                from: whitelistedAddr,
                value: 1
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