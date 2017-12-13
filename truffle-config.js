require('dotenv').config();
require('babel-register');
require('babel-polyfill');

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // eslint-disable-line camelcase
    },
    coverage: {
      host: 'localhost',
      network_id: '*', // eslint-disable-line camelcase
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },
    ganache: {
      host: 'localhost',
      port: 7545,
      network_id: '*', // eslint-disable-line camelcase
    },
  },
  mocha: {
    useColors: true,
  },
  solc: {
    optimizer: {
      enabled: false,
      runs: 500,
    },
    outputSelection: {
      // Enable the abi and bytecode outputs of every single contract.
      '*': {
        '*': [ 'abi', 'evm.bytecode' ],
      },
    },
  }
};
