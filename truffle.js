require('babel-register');
require('babel-polyfill');

/*
 * NB: since truffle-hdwallet-provider 0.0.5 you must wrap HDWallet providers in a 
 * function when declaring them. Failure to do so will cause commands to hang. ex:
 * ```
 * mainnet: {
 *     provider: function() { 
 *       return new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/<infura-key>') 
 *     },
 *     network_id: '1',
 *     gas: 4500000,
 *     gasPrice: 10000000000,
 *   },
 */

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
        host: process.env.ETH_HOSTNAME || HOSTNAME,
        port: +process.env.ETH_PORT || 8545, // default for geth & parity
        network_id: process.env.ETH_NETWORK_ID || 2
    }
  }
};
