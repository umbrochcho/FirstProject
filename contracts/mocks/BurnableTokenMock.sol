pragma solidity ^0.4.18;

import '../BurnableToken.sol';

contract BurnableTokenMock is BurnableToken {
  
  function BurnableTokenMock(address _burnee, uint _burneeBalance, uint _initialBalance) public {
    totalSupply = _initialBalance * 1 ether;
    balances[_burnee] = _burneeBalance * 1 ether;
  }

  function getMinSupply() public pure returns (uint256) {
    return MINSUPPLY;
  }

  function doSetTokenState(TokenState _newState) public {
    super.setTokenState(_newState);
  }

}
