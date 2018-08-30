const WAS_Token = artifacts.require("WAS_Token");
const WAS_Crowdsale = artifacts.require("WAS_Crowdsale");

const BigNumber = require("bignumber.js");

import expectThrow from './helpers/expectThrow';
import {
    advanceBlock
} from './helpers/advanceToBlock';
import increaseTime, {
    duration,
    increaseTimeTo
} from './helpers/increaseTime';
import latestTime from './helpers/latestTime';

contract("Finalizable", (accounts) => {
    let token;
    let crowdsale;
    const WHITELISTED_1 = accounts[1];
    const TEAM_WALLET = accounts[8];

    let openingTimings = [];
    let closingTimings = [];

    beforeEach("setup", async () => {
        await advanceBlock();

        const RATES_ETH = [5000, 4000]; //  tokens per ETH
        const WALLET = accounts[9];

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

        //  add to whitelist
        await crowdsale.addAddressToWhitelist(WHITELISTED_1);
        assert.isTrue(await crowdsale.whitelist.call(WHITELISTED_1), "WHITELISTED_1 should be whitelisted on beforeEach");
    });

    describe("finalizing by owner", () => {
        it("should validate owner can not finalize while not closed", async () => {
            await expectThrow(crowdsale.finalize(), "owner can not finalize while not closed");
        });

        it("should validate owner can finalize when closed", async () => {
            //  increase time to close
            increaseTimeTo(closingTimings[closingTimings.length - 1] + duration.minutes(1));

            //  finalize
            await crowdsale.finalize();
        });
    });

    describe("finalizing by not owner", () => {
        it("should validate not owner can not finalize while not closed", async () => {
            await expectThrow(crowdsale.destroy({
                from: accounts[1]
            }), "not owner can not finalize while not closed");
        });

        it("should validate not owner can not finalize if closed", async () => {
            //  increase time to close
            increaseTimeTo(closingTimings[closingTimings.length - 1] + duration.minutes(1));

            await expectThrow(crowdsale.finalize({
                from: accounts[1]
            }), "not owner can not finalize if closed");
        });
    });

    describe("tokens tansferred to crowdsale owner balance", () => {
        it("should validate tokens tansferred to crowdsale owner balance", async () => {
            await crowdsale.sendTransaction({
                from: WHITELISTED_1,
                value: web3.toWei(1, "ether")
            });

            let crowdsaleOwner = await crowdsale.owner.call();
            let crowdsaleTokensBeforeFinalize = new BigNumber(await token.balanceOf(crowdsale.address));
            let crowdsaleOwnerTokensBeforeFinalize = new BigNumber(await token.balanceOf(crowdsaleOwner));
            assert.equal(crowdsaleOwnerTokensBeforeFinalize.toNumber(), 0, "crowdsale owner should not own tokens");

            //  increase time to close
            increaseTimeTo(closingTimings[closingTimings.length - 1] + duration.minutes(1));

            //  finalize
            await crowdsale.finalize();

            let crowdsaleTokensAfterFinalize = new BigNumber(await token.balanceOf(crowdsale.address));
            let crowdsaleOwnerTokensAfterFinalize = new BigNumber(await token.balanceOf(crowdsaleOwner));

            assert.equal(crowdsaleTokensAfterFinalize.toNumber(), 0, "crowdsale balance should be 0 tokens after finalization");
            assert.equal(crowdsaleOwnerTokensAfterFinalize.toNumber(), crowdsaleTokensBeforeFinalize.toNumber(), "crowdsale tokens should be transferred to crowdsale owner balance");
        });
    });
});