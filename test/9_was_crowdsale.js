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

contract("Crowdsale", (accounts) => {
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

    describe("manual transfer", () => {
        it("should validate not owner can not manually transfer tokens", async () => {
            let acc_2 = accounts[2];
            let tokens_2 = 111;

            await expectThrow(crowdsale.manualTransfer(acc_2, tokens_2, {
                from: WHITELISTED_1
            }), "should throw if not user tries manually transfer");
        });

        it("should validate manually transferred tokens added to balance", async () => {
            let acc_2 = accounts[2];
            let tokens_2 = 111;

            await crowdsale.manualTransfer(acc_2, tokens_2);
            assert.equal(new BigNumber(await token.balanceOf(acc_2)).toNumber(), tokens_2, "manually transferred token amount is not correct");
        });

        it("should validate tokensCrowdsalePurchased has correctly increased after manual transfer", async () => {
            let acc_2 = accounts[2];
            let tokens_2 = 111;

            let purchaseTokensBefore = new BigNumber(await crowdsale.tokensCrowdsalePurchased.call());
            await crowdsale.manualTransfer(acc_2, tokens_2);
            let purchaseTokensAfter = new BigNumber(await crowdsale.tokensCrowdsalePurchased.call());

            assert.equal(purchaseTokensAfter.minus(purchaseTokensBefore).toNumber(), tokens_2, "tokensCrowdsalePurchased is wrong after manual transfer");
        });

        it("should validate tokens can not be manually transferred after crowdsale", async () => {
            let acc_2 = accounts[2];
            let tokens_2 = 111;

            increaseTimeTo(closingTimings[closingTimings.length - 1] + duration.minutes(1));
            await expectThrow(crowdsale.manualTransfer(acc_2, tokens_2), "should throw on manual transfer after crowdsale closed");
        });

        it("should validate manual transfer is available only while first stage", async () => {
            let acc_2 = accounts[2];
            let tokens_2 = 111;

            await crowdsale.manualTransfer(acc_2, tokens_2);

            //  move to stage 1
            increaseTimeTo(openingTimings[1] + duration.minutes(1));
            await expectThrow(crowdsale.manualTransfer(acc_2, tokens_2), "should throw on manual transfer after first tage");
        });
    });

    describe("funds tranferred to crowdsale wallet", () => {
        it("should validate funds have been transferred to crowdsale wallet right after transaction", async () => {
            let crowdsaleWallet = await crowdsale.wallet.call();
            let crowdsaleWalletBalanceBefore = await new BigNumber(web3.eth.getBalance(crowdsaleWallet))

            await crowdsale.sendTransaction({
                from: WHITELISTED_1,
                value: web3.toWei(1, "ether")
            });

            let crowdsaleWalletBalanceAfter = await new BigNumber(web3.eth.getBalance(crowdsaleWallet))

            assert.equal(crowdsaleWalletBalanceAfter.minus(crowdsaleWalletBalanceBefore).toNumber(), web3.toWei(1, "ether"), "crowdsale wallet should be depited with 1 ETH");
        });
    });

    describe("token calculations on purchase for different stages", () => {
        it("should validate token amount on purchase is calculated correctly for stage idx 0", async () => {
            //  5000 + 30% = 6500 tokens
            let userBalanceBefore = new BigNumber(await token.balanceOf(WHITELISTED_1));
            await crowdsale.sendTransaction({
                from: WHITELISTED_1,
                value: web3.toWei(1, "ether")
            });
            let userBalanceAfter = new BigNumber(await token.balanceOf(WHITELISTED_1));

            assert.equal(userBalanceAfter.minus(userBalanceBefore).toNumber(), 6500, "wrong token amount on purchase for stage idx 0");
        });

        it("should validate token amount on purchase is calculated correctly for stage idx 1", async () => {
            /*
            if (_tokenPurchasedAmount >= 15000) {
                return 10;
              } else if (_tokenPurchasedAmount >= 10000) {
                return 7;
              } else if (_tokenPurchasedAmount >= 5000) {
                return 5;
              }
              */

            //  increase time to nex stage
            increaseTimeTo(openingTimings[1] + duration.minutes(1));
            await crowdsale.currentStage.call();

            // 0%: 4400 - no discount
            let userBalanceBefore = new BigNumber(await token.balanceOf(WHITELISTED_1));
            // console.log(userBalanceBefore);
            await crowdsale.sendTransaction({
                from: WHITELISTED_1,
                value: web3.toWei(1.1, "ether")
            });
            let userBalanceAfter = new BigNumber(await token.balanceOf(WHITELISTED_1));
            // console.log(userBalanceAfter);

            assert.equal(userBalanceAfter.minus(userBalanceBefore).toNumber(), 4400, "wrong token amount on purchase for stage idx 1, base tokens = 4400. No discount should be applied.");

            // 5%: 5000 + 250 = 5250
            userBalanceBefore = new BigNumber(await token.balanceOf(WHITELISTED_1));
            await crowdsale.sendTransaction({
                from: WHITELISTED_1,
                value: web3.toWei(1.25, "ether")
            });
            userBalanceAfter = new BigNumber(await token.balanceOf(WHITELISTED_1));

            assert.equal(userBalanceAfter.minus(userBalanceBefore).toNumber(), 5250, "wrong token amount on purchase for stage idx 1, base tokens = 5250");

            // 5%: 6000 + 300 = 6300
            userBalanceBefore = new BigNumber(await token.balanceOf(WHITELISTED_1));
            await crowdsale.sendTransaction({
                from: WHITELISTED_1,
                value: web3.toWei(1.5, "ether")
            });
            userBalanceAfter = new BigNumber(await token.balanceOf(WHITELISTED_1));

            assert.equal(userBalanceAfter.minus(userBalanceBefore).toNumber(), 6300, "wrong token amount on purchase for stage idx 1, base tokens = 6300");

            // 7%: 12000 + 840 = 12840
            userBalanceBefore = new BigNumber(await token.balanceOf(WHITELISTED_1));
            await crowdsale.sendTransaction({
                from: WHITELISTED_1,
                value: web3.toWei(3, "ether")
            });
            userBalanceAfter = new BigNumber(await token.balanceOf(WHITELISTED_1));

            assert.equal(userBalanceAfter.minus(userBalanceBefore).toNumber(), 12840, "wrong token amount on purchase for stage idx 1, base tokens = 12840");

            // 10%: 15200 + 1520 = 16720
            userBalanceBefore = new BigNumber(await token.balanceOf(WHITELISTED_1));
            await crowdsale.sendTransaction({
                from: WHITELISTED_1,
                value: web3.toWei(3.8, "ether")
            });
            userBalanceAfter = new BigNumber(await token.balanceOf(WHITELISTED_1));

            assert.equal(userBalanceAfter.minus(userBalanceBefore).toNumber(), 16720, "wrong token amount on purchase for stage idx 1, base tokens = 16720");
        });
    });
});