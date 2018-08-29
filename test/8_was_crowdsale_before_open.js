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

contract("Before open", (accounts) => {
  let token;
  let crowdsale;
  const WHITELISTED_1 = accounts[1];

  let mockCrowdsaleData = mockCrowdsale();

  beforeEach("setup", async () => {
    await advanceBlock();

    const RATES_ETH = [5000, 4000]; //  tokens per ETH
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

    // //  increase time to open
    // increaseTimeTo(openingTimings[0] + duration.minutes(1));
    // assert.isTrue(await crowdsale.hasOpened.call(), "crowdsale should be open on beforeEach");

    //  add to whitelist
    await crowdsale.addAddressToWhitelist(WHITELISTED_1);
    assert.isTrue(await crowdsale.whitelist.call(WHITELISTED_1), "WHITELISTED_1 should be whitelisted on beforeEach");
  });

  describe("before open", () => {
    it("should not purchase before open", async () => {
      await expectThrow(crowdsale.unpause({
        from: WHITELISTED_1
      }), "should throw on purchase before open");
    });
  });
});