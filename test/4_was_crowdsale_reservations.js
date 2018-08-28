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
  });

  describe("reservation amounts", () => {
    it("should vlidate team reserve tokens", async () => {
      assert.equal(new BigNumber(await token.balanceOf(TEAM_WALLET)).toNumber(), 13013033, "wrong team reserve tokens amount");
    });

    it("should vlidate total purchase reserve tokens for this and future stages", async () => {
      assert.equal(new BigNumber(await token.balanceOf(crowdsale.address)).toNumber(), 247247643, "wrong total purchase reserve tokens for this and future stages");
    });

    it("should vlidate purchase reserve tokens for this stage only", async () => {
      assert.equal(new BigNumber(await crowdsale.reservedTokensCrowdsalePurchase.call()).toNumber(), 50000000, "wrong purchase reserve tokens for this stage only");
    });
  });

  describe("validate tokens transfer", () => {
    it("should validate team tokens were transfered to team address", async () => {
      assert.equal(new BigNumber(await token.balanceOf.call(TEAM_WALLET)).toNumber(), new BigNumber(mockToken().totalSupply).multipliedBy(0.05).decimalPlaces(0).minus(1).toNumber(), "wrong team token balance");
    });
  });
});