pragma solidity ^0.4.18;


import '../Pausable.sol';


// mock class using Pausable
contract PausableMock is Pausable {
  uint256 public drasticMeasureTaken;

  function PausableMock() public {
    drasticMeasureTaken = 0;
  }

  function drasticMeasure() external whenPaused {
    drasticMeasureTaken++;
  }

}
