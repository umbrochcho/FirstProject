pragma solidity ^0.4.18;


import './BurnableToken.sol';


/**
 * @title Mintable token
 * @dev Simple ERC20 Token example, with mintable token creation
 * @dev Issue: * https://github.com/OpenZeppelin/zeppelin-solidity/issues/120
 * Based on code by TokenMarketNet: https://github.com/TokenMarketNet/ico/blob/master/contracts/MintableToken.sol
 * @notice Inspired by OpenZeppelin (https://github.com/OpenZeppelin/zeppelin-solidity)
*/

contract MintableToken is BurnableToken {
  
  event MintingStarted(address indexed by, uint moment);
  event Mint(address indexed to, uint256 amount);
  event MintingFinished(address indexed by, uint moment);

  bool public minting = false;
  uint256 public tokenHolderCnt = 0;


  modifier canMint() {
    require(minting && totalSupply <= MAXSUPPLY);
    _;
  }

  /**
   * @dev Function to mint tokens
   * @param _to The address that will receive the minted tokens.
   * @param _amount The amount of tokens to mint.
   * @return A boolean that indicates if the operation was successful.
   */
  function mint(address _to, uint256 _amount) internal canMint returns (bool) {
    uint256 currentSupply = totalSupply;
    uint256 nextSupply = currentSupply.add(_amount);
    if (nextSupply > MAXSUPPLY) {
      _amount = _amount.sub(nextSupply.sub(MAXSUPPLY));
    }
    totalSupply = currentSupply.add(_amount);
    uint256 holderBalance = balances[_to];
    balances[_to] = holderBalance.add(_amount);
    if (holderBalance == 0) {
      tokenHolderCnt += 1;
    }
    Mint(_to, _amount);
    Transfer(this, _to, _amount);
    return true;
  }

  /**
   * @dev Function to start minting new tokens.
   * @return True if the operation was successful.
   */
  function enableMinting() internal {
    minting = true;
    MintingStarted(msg.sender, now);
  }

  /**
   * @dev Function to stop minting new tokens.
   * @return True if the operation was successful.
   */
  function disableMinting() internal {
    minting = false;
    MintingFinished(msg.sender, now);
  }
}
