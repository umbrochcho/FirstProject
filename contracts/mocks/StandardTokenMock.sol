pragma solidity ^0.4.18;


import '../StandardToken.sol';


// mock class using StandardToken
contract StandardTokenMock is StandardToken {

  function StandardTokenMock(address initialAccount, uint256 initialBalance) public {
    balances[initialAccount] = initialBalance * 1 ether;
    totalSupply = initialBalance * 1 ether;
  }

  function getNow() public view returns (uint256) {
    return now;
  }

  function doSetFreeze(address _freezee, uint256 _date, uint256 _amount) public {
  	setFreeze(_freezee, _date, _amount);
  }
}
