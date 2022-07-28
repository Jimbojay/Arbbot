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
          "0x8812468a48be8185919fc8a5d278f90a298b910528c623637b6d8989286f6b03", //array of private keys
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