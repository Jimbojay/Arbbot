require('babel-register');
require('babel-polyfill');
const HDWalletProvider = require("@truffle/hdwallet-provider");

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    },
    kovan: {
      provider: function() {
        return new HDWalletProvider(
          "0x5a301e96f0580d0cc5a69a904cdbae36aac05eba3dc619efbdc17e641e38393d", //array of private keys
          "https://kovan.infura.io/v3/a8aa19688193447d9a185f415344cf61"
        )
      },
      gas: 5000000,
      gasPrice: 25000000000,
      network_id: 42 
    }
  },

  compilers: {
    solc: {
      version: '0.8.9',
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
};