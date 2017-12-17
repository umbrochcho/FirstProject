pragma solidity ^0.4.18;

import '../MintableToken.sol';

contract MintableTokenMock is MintableToken {
  
  function MintableTokenMock() public MintableToken() {

  }

  function getMaxSupply() public pure returns (uint256) {
    return MAXSUPPLY;
  }

  function doSetTokenState(TokenState _newState) public {
    super.setTokenState(_newState);
  }

  function doEnableMinting() public {
    enableMinting();
  }

  function doMint(address _to, uint256 _amount) public {
    super.mint(_to, _amount);
  }
}
