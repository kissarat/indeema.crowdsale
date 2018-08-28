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

contract("Reservations", (accounts) => {
  let token;
  let crowdsale;
  let whitelisted_1 = accounts[1];
  const TEAM_WALLET = accounts[8];

  let mockCrowdsaleData = mockCrowdsale();

  beforeEach("setup", async () => {
    await advanceBlock();

    const WALLET = accounts[9];
    let timings = [latestTime() + duration.minutes(1), latestTime() + duration.weeks(1)];

    token = await WAS_Token.new();
    crowdsale = await WAS_Crowdsale.new(mockCrowdsaleData.rate, WALLET, token.address, timings);
    await token.transferOwnership(crowdsale.address);
    await crowdsale.mintTotalSupplyAndTeam(TEAM_WALLET);

    //  increase time to open
    increaseTimeTo(timings[0] + duration.minutes(1));
    assert.isTrue(await crowdsale.hasOpened.call(), "crowdsale should be open on beforeEach");

    //  add to whitelist
    await crowdsale.addAddressToWhitelist(whitelisted_1);
    assert.isTrue(await crowdsale.whitelist.call(whitelisted_1), "whitelisted_1 should be whitelisted on beforeEach");
  });

  describe("reservation amounts", () => {
    it("should vlidate team reserve tokens", async () => {
      assert.equal(new BigNumber(await token.balanceOf(TEAM_WALLET)).toNumber(), 13013033, "wrong team reserve tokens amount");
    });

    it("should vlidate purchase reserve tokens", async () => {
      assert.equal(new BigNumber(await token.balanceOf(crowdsale.address)).toNumber(), 247247643, "wrong purchase reserve tokens amount");
    });

  });

  describe("validate tokens transfer", () => {
    it("should validate team tokens were transfered to team address", async () => {
      assert.equal(new BigNumber(await token.balanceOf.call(TEAM_WALLET)).toNumber(), new BigNumber(mockToken().totalSupply).multipliedBy(0.05).decimalPlaces(0).minus(1).toNumber(), "wrong team token balance");
    });
  });
});