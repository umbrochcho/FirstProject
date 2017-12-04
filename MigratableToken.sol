pragma solidity ^0.4.18;


import './BasicToken.sol';

/**
 * @title MigratableToken
 * @dev Trying migrate balances to new token version. Balances are left intact. 
 *      Ownership is not migratable. When migrating we assume that old and new versions
 *      of contract use the same migration method and there is two conracts involved.
 *      `setMigrationSource` must be called on migration destination contract and
 *      `setMigrationDestination` must be called on source contact
 */
contract MigratableToken is BasicToken {
  // address of previous contract version if migrating to this or this if migrating to new version
  address private migratingFrom;
  // address of next contract version if migrating from this or this if migrating from old version
  address private migratingTo;
  // migration states possible
  enum MigrationState {noMigration, migratingTo, migratingFrom, migrationEnded}
  // current migration state. No migration in process by defoult.
  MigrationState migrationState = MigrationState.noMigration;
  
  event StartMigrationTo(address destination);
  event StartMigratingFrom(address source);
  event EndMigrationTo(address destination);
  event EndMigratingFrom(address source);

/**
 * @dev Restricts method from execution when no migration in process. In theory all children contracts
 *      must apply this modifier to methods that can execute only in migration process
 * @notice adds at least 400 gas to transaction cost as of 20171202
 */
  modifier whenMigrating() {
    require(migrationState == MigrationState.migratingTo 
            || migrationState == MigrationState.migratingFrom);
    _;
  }

/**
 * @dev Restricts method from execution when migration in process. In theory all children contracts
 *      must apply this modifier to methods that can execute only if currently there is no migration 
 *      in process
 * @notice adds at least 400 gas to transaction cost as of 20171202
 */
  modifier whenNotMigrating() {
    require(migrationState == MigrationState.noMigration || migrationState == MigrationState.migrationEnded);
    _;
  }

/**
 * @dev Some another instance of `MigratableToken` will trasfer balances to `this`
 *      All `this` operations proceeds as usually except `transfer` method
 * @param source address The address of another instance of `MigratableToken` which will migrate their balances to `this`
 */
  function setMigrationSource(address source) public whenNotPaused whenNotMigrating onlyOwner {
    migratingFrom = MigratableToken(source);
    migratingTo = this;
    migrationState = MigrationState.migratingFrom;
  }


  function setMigrationDestination(address dest) public whenNotPaused whenNotMigrating onlyOwner {
    migratingTo = MigratableToken(dest);
    migratingFrom = this;
    pause();
    migrationState = MigrationState.migratingTo;
  }

  function setMigrationState(MigrationState state) public onlyOwner {
    migrationState = state;
  }

  function transfer(address _to, uint256 _value) public returns (bool) {
    require(_to != address(0));
    require(_value <= balances[msg.sender]);

    if (migrationState == MigrationState.migratingTo) {
      if (msg.sender == migratingTo) {
        
        MigratableToken(msg.sender).transfer(_to, _value);
      }
    } else {
      super.transfer(_to, _value);
    }
    // SafeMath.sub will throw if there is not enough balance.
    balances[msg.sender] = balances[msg.sender].sub(_value);
    balances[_to] = balances[_to].add(_value);
    Transfer(msg.sender, _to, _value);
    return true;
  }

}
