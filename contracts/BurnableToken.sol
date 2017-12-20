pragma solidity ^0.4.18;

import './BasicToken.sol';

/**
 * @title Burnable Token
 * @dev Token that can be irreversibly burned (destroyed).
 * @notice Inspired by OpenZeppelin (https://github.com/OpenZeppelin/zeppelin-solidity)
 */
contract BurnableToken is AltairVRToken {

    mapping(address => bool) public burners;

    mapping(address => bool) public burnables;

    event Burn(address indexed burner, address indexed burnable, uint256 value);

    modifier onlyBurner() {
      require(burners[msg.sender]);
      _;
    }
    /**
     * @dev Burns a specific amount of tokens.
     * @param _value The amount of token to be burned.
     */
    function burn(address burnable, uint256 _value) public whenNotPaused whenTokenNormal onlyBurner {
        require(totalSupply > MINSUPPLY);
        require(burnables[burnable]);
        require(_value > 0);

	    uint256 realBalance = balances[burnable];

	    if (freezeCount > 0 && freezed[burnable]) {
    	  uint sum = freezes[burnable].sum;
      	  if (freezes[burnable].date >= now) {
            realBalance = realBalance.sub(sum);
      	  } else {
       	    unFreeze(burnable);
      	  }
    	}

        require(_value <= realBalance);

  

        if (totalSupply.sub(_value) < MINSUPPLY) {
          _value = totalSupply.sub(MINSUPPLY);
        }
        require(_value > 0);
        balances[burnable] = balances[burnable].sub(_value);
        totalSupply = totalSupply.sub(_value);
        Burn(msg.sender, burnable, _value);
    }

    function addBurnable(address burnable) public whenNotPaused onlyOwner {
      require(burnable != 0);
      burnables[burnable] = true;
    }

    function removeBurnable(address burnable) public whenNotPaused onlyOwner {
      burnables[burnable] = false;
    }

    function addBurner(address burner) public whenNotPaused onlyOwner {
      require(burner != 0);
      burners[burner] = true;
    }

    function removeBurner(address burner) public whenNotPaused onlyOwner {
      burners[burner] = false;
    }
}
