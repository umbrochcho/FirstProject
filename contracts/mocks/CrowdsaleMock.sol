pragma solidity ^0.4.18;


import '../Crowdsale.sol';

contract CrowdsaleMock is AltairVR {
  using SafeMath for uint256;
    
  
  function CrowdsaleMock(address _wallet, address _team, address _bounty, address _platform) AltairVR(_wallet, _team, _bounty, _platform) public {
      
  }
  
  function getNow() public view returns (uint256) {
    return now;
  }

  function getTokensToSale() public pure returns (uint256) {
    return TOKENSTOSALE;
  }

  function getAmountBonus(uint256 _amount) public pure returns (uint256 _bonus) {
      _bonus = getAmountWeiBonus(_amount);
  }
  
  function getTimeBonus(uint256 _stateStart, uint256 _now) public pure returns (uint256 _bonus) {
      if (_now <= endClosedPresale) {
          _bonus = tmClosedPresaleAdd;
      } else if (_now >= startPublicPresale && _now <= endPublicPresale) {
          _bonus = tmPublicPresaleAdd;
      } else {
          _bonus = getTimeCrowdsaleBonus(_stateStart, _now);
      }
  }
  
  function getHardCap(SaleState _state) public view returns (uint256 _cap) {
      if (_state == SaleState.closedPresale) {
          _cap = hardClosedPresale;
      } else if (_state == SaleState.publicPresale) {
          _cap = hardPublicPresale;
      } else if (_state == SaleState.crowdSale) {
          _cap = getTokensToSale();
          _cap = _cap.div(rate);
      }
  }
  
  function getMinDeposit(SaleState _state) public pure returns (uint256 _min) {
      if (_state == SaleState.closedPresale) {
          _min = minWeiDepositClosedPresale;
      } else if (_state == SaleState.publicPresale) {
          _min = minWeiDepositPublicPresale;
      } else if (_state == SaleState.crowdSale) {
          _min = minWeiDepositCrowdsale;
      } else {
      	  _min = 0;
      }
  }

  function getRealRate(uint256 _stateStart, uint256 _now, uint256 _amount) public view returns (uint256 realRate) {
      realRate = rate.add(getAmountWeiBonus(_amount)).add(getTimeBonus(_stateStart, _now));
  }

  function getPublicPresaleStart() public pure returns (uint256 _time) {
      _time = startPublicPresale;
  }

  function getPublicPresaleEnd() public pure returns (uint256 _time) {
      _time = endPublicPresale;
  }

  function getPublicPresaleDuration() public pure returns (uint256 _time) {
      _time = durationPublicPresale;
  }

  function getCrowdsaleStart() public pure returns (uint256 _time) {
      _time = startCrowdsale;
  }

  function getCrowdsaleEnd() public pure returns (uint256 _time) {
      _time = endCrowdsale;
  }

  function getCrowdsaleDuration() public pure returns (uint256 _time) {
      _time = durationCrowdsale;
  }
}