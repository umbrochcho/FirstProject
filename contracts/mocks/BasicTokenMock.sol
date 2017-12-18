pragma solidity ^0.4.18;


import '../BasicToken.sol';


// mock class using AltairVRToken
contract BasicTokenMock is AltairVRToken {

  function BasicTokenMock(address initialAccount, uint256 initialBalance) public AltairVRToken() {
    balances[initialAccount] = initialBalance;
    totalSupply = initialBalance;
    tokenState = TokenState.tokenSaling;
  }

  function doSetTokenState(TokenState _newState) public {
    super.setTokenState(_newState);
  }

  function getNow() public view returns (uint256) {
    return now;
  }

  function getMinSupply() public pure returns (uint256) {
    return MINSUPPLY/1 ether;
  }

  function getMaxSupply() public pure returns (uint256) {
    return MAXSUPPLY/1 ether;
  }

  function doSetFreeze(address _freezee, uint256 _date, uint256 _amount) public {
  	setFreeze(_freezee, _date, _amount);
  }
}
