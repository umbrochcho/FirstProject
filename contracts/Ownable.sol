pragma solidity ^0.4.18;


/**
 * @title Ownable
 * @dev The Ownable contract has multiple owners addresses, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions". Multiple owners prevent circumstances
 * when conract is stuck due to owner went offline forever for some reason. Contract always must have
 * at least 1 owner. 
 * @notice creation gas cost ~520000
 *         Inspired by OpenZeppelin (https://github.com/OpenZeppelin/zeppelin-solidity)
 */
contract Ownable {
  mapping(address => bool) public owners;
  uint public ownerCount = 1;


  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
  event OwnershipTaken(address indexed owner);
  event OwnershipCeased(address indexed owner);
  event OwnershipRefusalRejected(address indexed owner);


  /**
   * @dev The Ownable constructor sets the original `owner` of the contract to the sender
   * account.
   */
  function Ownable() public {
    owners[msg.sender] = true;
    OwnershipTaken(msg.sender);
  }


  /**
   * @dev Throws if called by any account other than the owner.
   */
  modifier onlyOwner() {
    require(owners[msg.sender] == true);
    _;
  }


  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param newOwner The address to transfer ownership to.
   * @notice Gas cost ~36000 gas
   */
  function transferOwnership(address newOwner) public onlyOwner {
    require(newOwner != address(0));
    if (newOwner != msg.sender) {
        owners[msg.sender] = false;
	owners[newOwner] = true;
    }
    OwnershipTransferred(msg.sender, newOwner);
  }

  /**
   * @dev Allows the current owner add another owner.
   * @param newOwner The address of another owner.
   * @notice Gas cost ~50100 gas
   */
  function addOwner(address newOwner) public onlyOwner {
    require(newOwner != address(0));
    owners[newOwner] = true;
    ownerCount += 1;
    OwnershipTaken(newOwner);
  }

  /**
   * @dev Owner can remove only self and only if ownerCount > 1
   * @notice you can try to refuse your ownership. gas cost ~19000
   */
  function removeSelf() public onlyOwner {
    if (ownerCount == 1) {
      OwnershipRefusalRejected(msg.sender);
    } else {
        owners[msg.sender] = false;
	ownerCount -= 1;
        OwnershipCeased(msg.sender);
    }
  }

}
