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

contract("Before open", (accounts) => {
  let token;
  let crowdsale;
  const WHITELISTED_1 = accounts[1];
  let openingTimings = [];
  let closingTimings = [];

  beforeEach("setup", async () => {
    await advanceBlock();

    const RATES_ETH = [5000, 4000]; //  tokens per ETH
    const WALLET = accounts[9];
    const TEAM_WALLET = accounts[8];

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

  describe("current rateETH", () => {
    it("should return correct rateETH for stage 0", async () => {
      assert.equal(new BigNumber(await crowdsale.currentRateETH.call()).toNumber(), 5000, "wrong rateETH for stage 0");
    });

    it("should return correct rateETH for stage 1", async () => {
      //  increase time to stage 1
      increaseTimeTo(openingTimings[1] + duration.minutes(1));
      assert.equal(new BigNumber(await crowdsale.currentRateETH.call()).toNumber(), 4000, "wrong rateETH for stage 1");
    });
  });

  describe("update stage rateETH", () => {
    it("should validate not owner can not update", async () => {
      await expectThrow(crowdsale.updateStageRateETH(0, 1, {
        from: accounts[1]
      }), "should throw if not owner tries to update stage rateETH");
    });

    it("should valifdate rateETH updated correctly for stage 0", async () => {
      await crowdsale.updateStageRateETH(0, 1);
      assert.equal(new BigNumber(await crowdsale.currentRateETH.call()).toNumber(), 1, "wrong rateETH after update for stage 0");
    });

    it("should valifdate rateETH updated correctly for stage 1", async () => {
      await crowdsale.updateStageRateETH(1, 2);

      //  increase time to stage 1
      increaseTimeTo(openingTimings[1] + duration.minutes(1));
      assert.equal(new BigNumber(await crowdsale.currentRateETH.call()).toNumber(), 2, "wrong rateETH after update for stage 1");
    });
  });

  describe("update opening and closing timings", () => {
    it("should validate not owner can not update", async () => {
      await expectThrow(crowdsale.updateOpeningAndClosingTimings([latestTime() + 100], [latestTime() + 1000], {
        from: accounts[1]
      }), "should throw if not owner tries to update stage rateETH");
    });

    it("should validate rateETH updated correctly for stage 0", async () => {
      await crowdsale.updateStageRateETH(0, 1);
      assert.equal(new BigNumber(await crowdsale.currentRateETH.call()).toNumber(), 1, "wrong rateETH after update for stage 0");
    });

    it("should validate rateETH updated correctly for stage 1", async () => {
      await crowdsale.updateStageRateETH(1, 2);

      //  increase time to stage 1
      increaseTimeTo(openingTimings[1] + duration.minutes(1));
      assert.equal(new BigNumber(await crowdsale.currentRateETH.call()).toNumber(), 2, "wrong rateETH after update for stage 1");
    });
  });

  describe("stagePurchaseTokensMinimum", () => {
    //  no minimum for stage 0

    it("should validate minimum purchase for stage 1", async () => {
      //  increase time to stage 1
      increaseTimeTo(openingTimings[1] + duration.minutes(1));

      await expectThrow(crowdsale.sendTransaction({
        from: WHITELISTED_1,
        value: web3.toWei(0.02, "ether")
      }), "minimum token amount is not met for stage 1");
    });
  });
});