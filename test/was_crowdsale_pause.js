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

    const WALLET = accounts[9];
    let timings = [latestTime() + duration.minutes(1), latestTime() + duration.weeks(1)];

    token = await WAS_Token.new();
    crowdsale = await WAS_Crowdsale.new(mockCrowdsaleData.rate, WALLET, token.address, timings);
    await token.transferOwnership(crowdsale.address);
    await crowdsale.mintTotalSupply();

    increaseTimeTo(timings[0] + duration.minutes(1));
    assert.isTrue(await crowdsale.hasOpened.call(), "crowdsale should be open on beforeEach");

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
        value: 1
      }), "should throw if purchase whilepaused");
    });

    it("should restore purchase after unpause", async () => {
      await crowdsale.pause();
      await crowdsale.unpause();

      crowdsale.sendTransaction({
        from: whitelisted_1,
        value: 1
      });
    });
  });
});