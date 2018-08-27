const WAS_Token = artifacts.require("WAS_Token");

const BigNumber = require('bignumber.js');
let mockTokenData = mockToken();

import mockToken from "./helpers/mocks/MockToken";

import {
  advanceBlock
} from './helpers/advanceToBlock.js';

import expectThrow from './helpers/expectThrow';


contract("WAS_Token", (accounts) => {

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
    assert.equal(await token.decimals.call(), mockTokenData.decimals, "wrong token decimals");
  });

  it("should validate token totalSupply after migration", async () => {
    assert.equal(await token.totalSupply.call(), mockTokenData.totalSupply, "wrong token totalSupply");
  });
});