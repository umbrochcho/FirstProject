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
    require(minting);
    _;
  }

  /**
   * @dev Function to mint tokens
   * @param _to The address that will receive the minted tokens.
   * @param _amount The amount of tokens to mint.
   * @return A boolean that indicates if the operation was successful.
   */
  function mint(address _to, uint256 _amount) internal canMint returns (uint256 reminder) {
    uint256 currentSupply = totalSupply;
    uint256 nextSupply = currentSupply.add(_amount);
    if (nextSupply > MAXSUPPLY) {
      reminder = nextSupply.sub(MAXSUPPLY);    
      _amount = _amount.sub(reminder);
    }
    if (_amount > 0) {
        totalSupply = currentSupply.add(_amount);
        balances[_to] = balances[_to].add(_amount);
        if (balances[_to] == _amount) {
            tokenHolderCnt += 1;
        }
        Mint(_to, _amount);
        Transfer(this, _to, _amount);
    }
    return reminder;
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
