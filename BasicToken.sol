pragma solidity ^0.4.18;

import './Pausable.sol';
import './ERC20Basic.sol';
import './SafeMath.sol';


/**
 * @title Basic token
 * @dev Basic version of StandardToken, with no allowances.
 * @notice Inspired by OpenZeppelin (https://github.com/OpenZeppelin/zeppelin-solidity)
 */
contract AltairVRToken is Pausable, ERC20Basic {
  using SafeMath for uint256;

  mapping(address => uint256) balances;

  enum TokenState {tokenSaling, tokenNormal}
  
  TokenState tokenState = TokenState.tokenNormal;

  uint constant MAXSUPPLY = 100000000 * 1 ether;
  uint constant MINSUPPLY = 10000000 * 1 ether;
  string public name = "AltairVR token";
  string public symbol = "AVR";
  uint8 public decimals = 18;
  string public version = "0.1";

  //predefined accounts 
  address public teamAddress = address(0); //NEED TO BE REAL ADDRESS!!!
  address public platformAddress = address(0); //NEED TO BE REAL ADDRESS!!!
  address public bountyAddress = address(0); //NEED TO BE REAL ADDRESS!!!

  uint256 teamShare = 0;
  uint256 platformShare = 0;
  uint256 bountyShare = 0;
  
  // we need to freeze shares from sale for team and bounty accounts
  mapping(address => bool) freezed;
  struct FreezeItem {uint date; uint256 sum; }

  mapping(address => FreezeItem) freezes;
  uint freezeCount = 0;


  event Freezed(address indexed who, uint256 freezeEnd, uint256 amount);
  event UnFreezed(address indexed who, uint256 amount);


  modifier whenTokenNormal() {
    require(tokenState == TokenState.tokenNormal);
    _;
  }

  modifier whenTokenSaling() {
    require(tokenState == TokenState.tokenSaling);
    _;
  }

  function AltairVRToken() public Pausable() {
  }

  /**
  * @dev transfer token for a specified address
  * @param _to The address to transfer to.
  * @param _value The amount to be transferred.
  */
  function transfer(address _to, uint256 _value) public whenNotPaused whenTokenNormal returns (bool) {
    require(_to != address(0));
    
    uint256 realBalance = balances[msg.sender];

    if (freezeCount > 0 && freezed[msg.sender]) {
       uint sum = freezes[msg.sender].sum;
      if (freezes[msg.sender].date < now) {
        realBalance = realBalance.sub(sum);
      } else {
        freezeCount -= 1;
        freezed[msg.sender] = false;
        freezes[msg.sender].date = 0;
        freezes[msg.sender].sum = 0;
        UnFreezed(msg.sender, sum);
      }
    }

    require(_value <= realBalance);
    // SafeMath.sub will throw if there is not enough balance.
    balances[msg.sender] = balances[msg.sender].sub(_value);
    balances[_to] = balances[_to].add(_value);
    Transfer(msg.sender, _to, _value);
    return true;
  }

  /**
  * @dev Gets the balance of the specified address.
  * @param _owner The address to query the the balance of.
  * @return An uint256 representing the amount owned by the passed address.
  */
  function balanceOf(address _owner) public view returns (uint256 balance) {
    return balances[_owner];
  }

}
