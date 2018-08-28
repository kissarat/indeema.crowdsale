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

contract("Pausable", (accounts) => {
  let token;
  let crowdsale;
  let whitelisted_1 = accounts[1];

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

    //  add to whitelist
    await crowdsale.addAddressToWhitelist(whitelisted_1);
    assert.isTrue(await crowdsale.whitelist.call(whitelisted_1), "whitelisted_1 should be whitelisted on beforeEach");
  });

  describe("start / stop pause", () => {
    it("should validate not owner can not pause", async () => {
      await expectThrow(crowdsale.pause({
        from: accounts[1]
      }), "not owner can not pause");
    });

    it("should validate not owner can not unpause", async () => {
      await crowdsale.pause();

      await expectThrow(crowdsale.unpause({
        from: accounts[1]
      }), "not owner can not unpause");
    });
  });


  describe("pause in action", () => {
    it("should not purchase if paused", async () => {
      await crowdsale.pause();

      await expectThrow(crowdsale.sendTransaction({
        from: whitelisted_1,
        value: web3.toWei(1, "ether")
      }), "should throw if purchase whilepaused");
    });

    it("should restore purchase after unpause", async () => {
      await crowdsale.pause();
      await crowdsale.unpause();

      crowdsale.sendTransaction({
        from: whitelisted_1,
        value: web3.toWei(1, "ether")
      });
    });
  });
});