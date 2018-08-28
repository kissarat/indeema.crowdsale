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

contract("Finalizable", (accounts) => {
  let token;
  let crowdsale;
  let whitelisted_1 = accounts[1];
  const TEAM_WALLET = accounts[8];

  let mockCrowdsaleData = mockCrowdsale();
  let timings;

  beforeEach("setup", async () => {
    await advanceBlock();

    const WALLET = accounts[9];
    timings = [latestTime() + duration.minutes(1), latestTime() + duration.weeks(1)];

    token = await WAS_Token.new();
    crowdsale = await WAS_Crowdsale.new(mockCrowdsaleData.rate, WALLET, token.address, timings);
    await token.transferOwnership(crowdsale.address);
    await crowdsale.mintTotalSupplyAndTeam(TEAM_WALLET);

    //  increase time to open
    increaseTimeTo(timings[0] + duration.minutes(1));
    assert.isTrue(await crowdsale.hasOpened.call(), "crowdsale should be open on beforeEach");
  });

  describe("finalizing by owner", () => {
    it("should validate owner can not finalize while not closed", async () => {
      await expectThrow(crowdsale.finalize(), "owner can not finalize while not closed");
    });

    it("should validate owner can finalize when closed", async () => {
      //  increase time to close
      increaseTimeTo(timings[1] + duration.minutes(1));

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
      increaseTimeTo(timings[1] + duration.minutes(1));

      await expectThrow(crowdsale.finalize({
        from: accounts[1]
      }), "not owner can not finalize if closed");
    });
  });
});