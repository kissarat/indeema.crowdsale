const WAS_Token = artifacts.require("WAS_Token");
const WAS_Crowdsale = artifacts.require("WAS_Crowdsale");
const BigNumber = require("bignumber.js");

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

contract("token transfer limits", (accounts) => {
  let token;
  let crowdsale;
  const WHITELISTED_1 = accounts[1];

  let mockCrowdsaleData = mockCrowdsale();

  beforeEach("setup", async () => {
    await advanceBlock();

    const RATES_ETH = [5000000, 4000000]; //  tokens per ETH
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

    //  add to whitelist
    await crowdsale.addAddressToWhitelist(WHITELISTED_1);
    assert.isTrue(await crowdsale.whitelist.call(WHITELISTED_1), "WHITELISTED_1 should be whitelisted on beforeEach");

    //  increase time to open
    increaseTimeTo(openingTimings[0] + duration.minutes(1));
    assert.isTrue(await crowdsale.hasOpened.call(), "crowdsale should be open on beforeEach");
  });

  describe("purchase limits", () => {
    it("should not purchase more than 50 M on single transaction", async () => {
      await expectThrow(crowdsale.sendTransaction({
        from: WHITELISTED_1,
        value: web3.toWei(8, "ether")
      }), "should throw on purchase tokens > 50 M");
    });

    it("should not purchase more than 50 M on multiple transactions", async () => {
      await crowdsale.addAddressToWhitelist(accounts[2]);

      crowdsale.sendTransaction({
        from: accounts[2],
        value: web3.toWei(4, "ether")
      });

      await expectThrow(crowdsale.sendTransaction({
        from: WHITELISTED_1,
        value: web3.toWei(4, "ether")
      }), "should throw on purchase tokens > 50 M");
    });

    it("should not manually transfer more than 50 M on single transaction", async () => {
      await expectThrow(crowdsale.manualTransfer(accounts[2], 50000001), "should throw if manual transfer amount > 50 000 000");
    });

    it("should not manually transfer more than 50 M on multiple transactions", async () => {
      await crowdsale.manualTransfer(accounts[2], 30000000);
      await expectThrow(crowdsale.manualTransfer(accounts[2], 20000001), "should throw if manual transfer amount > 50 000 000");
    });

    it("should not transfer more than 50 M while purchase and manual transfer", async () => {
      await crowdsale.addAddressToWhitelist(accounts[2]);

      crowdsale.sendTransaction({
        from: accounts[2],
        value: web3.toWei(4, "ether")
      });

      await expectThrow(crowdsale.manualTransfer(accounts[2], 30000000), "should throw if additional manual transfer amount in total > 50 000 000");
    });
  });
});