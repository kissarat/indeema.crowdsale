const WAS_Token = artifacts.require("WAS_Token");

const BigNumber = require('bignumber.js');

import mockToken from "./helpers/mocks/mockToken";
import expectThrow from './helpers/expectThrow';
import {
    advanceBlock
} from './helpers/advanceToBlock.js';


contract("WAS_Token", (accounts) => {
    let token;
    let mockTokenData = mockToken();

    before("setup", async () => {
        token = await WAS_Token.deployed();
    });

    it("should validate token name after migration", async () => {
        assert.equal(await token.name.call(), mockTokenData.tokenName, "wrong token name");
    });

    it("should validate token symbol after migration", async () => {
        assert.equal(await token.symbol.call(), mockTokenData.tokenSymbol, "wrong token symbol");
    });

    it("should validate token decimals after migration", async () => {
        assert.equal(new BigNumber(await token.decimals.call()).toNumber(), mockTokenData.tokenDecimals, "wrong token decimals");
    });

    it("should validate token totalSupply after migration", async () => {
        assert.equal(new BigNumber(await token.totalSupplyLimit.call()).toNumber(), mockTokenData.totalSupply, "wrong token totalSupply");
    });
});