pragma solidity ^0.4.18;


import "./Ownable.sol";


/**
 * @title Pausable
 * @dev Base contract which allows children to implement an emergency stop mechanism.
 * @notice Inspired by OpenZeppelin (https://github.com/OpenZeppelin/zeppelin-solidity)
 */
contract Pausable is Ownable {
  event Pause(address indexed who, uint256 when);
  event Unpause(address indexed who, uint256 when, uint256 duration);

  bool public paused = false;
  uint256 pauseStart = 0;
  uint256 totalDuration = 0;


  /**
   * @dev Modifier to make a function callable only when the contract is not paused.
   */
  modifier whenNotPaused() {
    require(paused == false);
    _;
  }

  /**
   * @dev Modifier to make a function callable only when the contract is paused.
   */
  modifier whenPaused() {
    require(paused == true);
    _;
  }

  /**
   * @dev called by the owner to pause, triggers stopped state
   */
  function pause() onlyOwner whenNotPaused public {
    paused = true;
    pauseStart = now;
    Pause(msg.sender, now);
  }

  /**
   * @dev called by the owner to unpause, returns to normal state
   */
  function unpause() whenPaused onlyOwner public {
    paused = false;
    uint256 _now = now;
    uint256 _duration = _now - pauseStart;    
    pauseStart = 0;
    totalDuration += _duration;
    Unpause(msg.sender, _now, _duration);
  }

  /**
   * @dev Override parent's method. When paused no change to state allowed
   * @param newOwner The address to transfer ownership to.
   */
  function transferOwnership(address newOwner) public whenNotPaused {
    super.transferOwnership(newOwner);
  }

  /**
   * @dev Override parent's method. When paused no change to state allowed
   * @param newOwner The address of another owner.
   */
  function addOwner(address newOwner) public whenNotPaused {
    super.addOwner(newOwner);
  }

  /**
   * @dev Override parent's method. When paused no change to state allowed
   */
  function removeSelf() public whenNotPaused {
    super.removeSelf();
  }

}
