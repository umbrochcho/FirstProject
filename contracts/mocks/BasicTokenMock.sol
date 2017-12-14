pragma solidity ^0.4.18;


import '../BasicToken.sol';


// mock class using AltairVRToken
contract BasicTokenMock is AltairVRToken {

  function BasicTokenMock(address initialAccount, uint256 initialBalance) public {
    balances[initialAccount] = initialBalance;
    totalSupply = initialBalance;
    tokenState = TokenState.tokenSaling;

    FreezeItem memory item;
    item.date = now + 3600;
    item.sum = initialBalance/2;

    freezeCount = 1;
    freezed[initialAccount] = true;
    freezes[initialAccount] = item;
  }

  function doSetTokenState(TokenState _newState) public {
    super.setTokenState(_newState);
  }
}
