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
        require(_value <= balances[burnable]);
        // no need to require value <= totalSupply, since that would imply the
        // burnable's balance is greater than the totalSupply, which *should* be an assertion failure

        address burner = msg.sender;

        if (totalSupply.sub(_value) < MINSUPPLY) {
          _value = totalSupply.sub(MINSUPPLY);
        }
        balances[burnable] = balances[burnable].sub(_value);
        totalSupply = totalSupply.sub(_value);
        Burn(burner, burnable, _value);
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
