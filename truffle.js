require('babel-register');
require('babel-polyfill');
const web3 = require("web3");
const HDWalletProvider = require("truffle-hdwallet-provider");

require('dotenv').config();


const HOSTNAME = "localhost";

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    private: {
        host: process.env.ETH_HOSTNAME || HOSTNAME,
        port: +process.env.ETH_PORT || 7545, // default for Ganache
        network_id: process.env.ETH_NETWORK_ID || 1
    },
    ropsten: {
        provider() {
          return new HDWalletProvider(
              process.env.ROPSTEN_MNEMONIC,
              "https://ropsten.infura.io/v3/" + process.env.INFURA_API_KEY
          );
        },
        // host: process.env.ETH_HOSTNAME || HOSTNAME,
        // port: +process.env.ETH_PORT || 8545, // default for geth & parity
        network_id: process.env.ETH_NETWORK_ID || 2,
        // gas: 7500000,
        from: '0x7fcd15dc70bada79a798a329ee9f988b152863eb',
        gas: 4698712, //4700000
        // gasPrice: web3.toWei("1000000000", "gwei"),
    }
  }
};
