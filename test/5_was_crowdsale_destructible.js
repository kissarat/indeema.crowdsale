const WAS_Token = artifacts.require("WAS_Token");
const WAS_Crowdsale = artifacts.require("WAS_Crowdsale");

const BigNumber = require("bignumber.js");

import mockToken from "./helpers/mocks/mockToken";
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

contract("Destructible", (accounts) => {
  let token;
  let crowdsale;
  let timings;

  beforeEach("setup", async () => {
    await advanceBlock();

    const WALLET = accounts[9];
    const WHITELISTED_1 = accounts[1];
    const TEAM_WALLET = accounts[8];

    timings = [latestTime() + duration.minutes(1), latestTime() + duration.weeks(1)];

    token = await WAS_Token.new();
    crowdsale = await WAS_Crowdsale.new(mockCrowdsale().rate, WALLET, token.address, timings);
    await token.transferOwnership(crowdsale.address);
    await crowdsale.mintTotalSupplyAndTeam(TEAM_WALLET);

    //  increase time to open
    increaseTimeTo(timings[0] + duration.minutes(1));
    assert.isTrue(await crowdsale.hasOpened.call(), "crowdsale should be open on beforeEach");

    //  add to whitelist
    await crowdsale.addAddressToWhitelist(WHITELISTED_1);
    assert.isTrue(await crowdsale.whitelist.call(WHITELISTED_1), "WHITELISTED_1 should be whitelisted on beforeEach");
  });

  describe("destroying by owner", () => {
    it("should validate owner can not destoy while not closed", async () => {
      await expectThrow(crowdsale.destroy(), "owner can not destroy while not closed");
    });

    it("should validate owner can not destoy if closed, but not finalized", async () => {
      //  increase time to close
      increaseTimeTo(timings[1] + duration.minutes(1));
      assert.isTrue(await crowdsale.hasClosed.call(), "crowdsale should be closed on beforeEach");

      await expectThrow(crowdsale.destroy(), "owner can not destroy if closed, but not finalized");
    });

    it("should validate owner can destoy when closed and finalized", async () => {
      //  increase time to close
      increaseTimeTo(timings[1] + duration.minutes(1));
      assert.isTrue(await crowdsale.hasClosed.call(), "crowdsale should be closed on beforeEach");

      //  finalize
      await crowdsale.finalize();

      await crowdsale.destroy();
    });
  });

  describe.only("destroying by not owner", () => {
    it("should validate not owner can not destoy while not closed", async () => {
      await expectThrow(crowdsale.destroy(), "not owner can not destroy while not closed");
    });

    it("should validate not owner can not destoy if closed, but not finalized", async () => {
      //  increase time to close
      increaseTimeTo(timings[1] + duration.minutes(1));
      assert.isTrue(await crowdsale.hasClosed.call(), "crowdsale should be closed on beforeEach");

      await expectThrow(crowdsale.destroy(), "not owner can not destroy if closed, but not finalized");
    });

    it("should validate not owner can not destoy when closed and finalized", async () => {
      //  increase time to close
      increaseTimeTo(timings[1] + duration.minutes(1));
      assert.isTrue(await crowdsale.hasClosed.call(), "crowdsale should be closed on beforeEach");

      //  finalize
      await crowdsale.finalize();

      await expectThrow(crowdsale.destroy({
        from: accounts[1]
      }), "not owner can not destroy if closed, but not finalized");
    });
  });
});