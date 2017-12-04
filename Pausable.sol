pragma solidity ^0.4.18;


import "./Ownable.sol";


/**
 * @title Pausable
 * @dev Base contract which allows children to implement an emergency stop mechanism.
 */
contract Pausable is Ownable {
  event Pause();
  event Unpause(uint duration);

  bool public paused = false;
  uint pauseStart = 0;


  /**
   * @dev Modifier to make a function callable only when the contract is not paused.
   */
  modifier whenNotPaused() {
    require(!paused);
    _;
  }

  /**
   * @dev Modifier to make a function callable only when the contract is paused.
   */
  modifier whenPaused() {
    require(paused);
    _;
  }

  /**
   * @dev called by the owner to pause, triggers stopped state
   */
  function pause() onlyOwner whenNotPaused public {
    paused = true;
    pauseStart = now;
    Pause();
  }

  /**
   * @dev called by the owner to unpause, returns to normal state
   */
  function unpause() onlyOwner whenPaused public {
    paused = false;
    Unpause(now - pauseStart);
  }

  /**
   * @dev Override parent's method. When paused no change to state allowed
   * @param newOwner The address to transfer ownership to.
   */
  function transferOwnership(address newOwner) public whenNotPaused onlyOwner {
    super.transferOwnership(newOwner);
  }

  /**
   * @dev Override parent's method. When paused no change to state allowed
   * @param newOwner The address of another owner.
   */
  function addOwner(address newOwner) public whenNotPaused onlyOwner {
    super.addOwner(newOwner);
  }

  /**
   * @dev Override parent's method. When paused no change to state allowed
   */
  function removeSelf() public whenNotPaused onlyOwner {
    super.removeSelf();
  }

}
