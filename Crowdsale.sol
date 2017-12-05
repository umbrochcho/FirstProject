pragma solidity ^0.4.18;

import './StandardToken.sol';

/**
 * @title AltairVR
 * @dev AltairVR is a base contract for managing a token crowdsale.
 * Crowdsales have a start and end timestamps, where investors can make
 * token purchases and the crowdsale will assign them tokens based
 * on a token per ETH rate. Funds collected are forwarded to a wallet
 * as they arrive.
 */
contract AltairVR is StandardToken {
  using SafeMath for uint256;

  enum SaleState {closedPresale, closedPresaleEnded, publicPresale, publicPresaleEnded, crowdSale, Finalized}

  SaleState saleState = SaleState.closedPresale;
  SaleState nextState = SaleState.publicPresale; 

  // address where funds are collected
  address public wallet;

  uint256 constant TOKENSTOSALE = 50000000 * 1 ether;
  // how many token units a buyer gets per wei
  uint256 public rate = 400;

  // amount of raised money in wei
  uint256 public weiRaised;

 // sale state properties
    uint256 constant endClosedPresale = 1515974399; //14.01.2018 23:59:59 GMT
    uint256 constant hardClosedPresale = 700 * 1 ether;
    uint256 constant minWeiDepositClosedPresale = 40 * 1 ether;

    uint256 constant startPublicPresale = 1515974400; //15.01.2018 0:00:00 GMT
    uint256 constant endPublicPresale = 1517270399;   //29.01.2018 23:59:59 GMT
    uint256 constant hardPublicPresale = 5000 * 1 ether;
    uint256 constant minWeiDepositPublicPresale = 50 * 1 finney;

    uint256 constant startCrowdsale = 1520812800; //12.03.2018 0:00:00 GMT
    uint256 constant endCrowdsale = 1524700799;   //25.04.2018 23:59:59 GMT
    uint256 constant minWeiDepositCrowdsale = 50 * 1 finney;

  // bonuses 
  // wei amount bonuses
  // applicable to all buy transaction
  
  uint256 constant am1Start = 2000 * 1 ether;
  uint256 constant am1rateAdd = 20;
  uint256 constant am2Start = 5000 * 1 ether;
  uint256 constant am2rateAdd = 28;
  uint256 constant am3Start = 10000 * 1 ether;
  uint256 constant am3rateAdd = 40;
  
  //time bonuses
  //applicable in specific sale state
  
  uint256 constant tmClosedPresaleAdd = 280;
  uint256 constant tmPublicPresaleAdd = 100;
  uint256 constant tmCrowdsale1End = 1 days;
  uint256 constant tmCrowdsale1Add = 60;
  uint256 constant tmCrowdsale2End = 1 weeks;
  uint256 constant tmCrowdsale2Add = 40;
  uint256 constant tmCrowdsale3End = 2 * 1 weeks;
  uint256 constant tmCrowdsale3Add = 28;
  uint256 constant tmCrowdsale4End = 3 * 1 weeks;
  uint256 constant tmCrowdsale4Add = 20;

  event SaleStateStarted(SaleState state, uint date);
  
  /**
   * event for token purchase logging
   * @param purchaser who paid for the tokens
   * @param beneficiary who got the tokens
   * @param value weis paid for purchase
   * @param amount amount of tokens purchased
   */
  event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);


  function AltairVR() public {

    tokenState = TokenState.tokenSaling;
    enableMinting();
    SaleStateStarted(SaleState.closedPresale, now);
  }

  // fallback function can be used to buy tokens
  function () external payable {
    buyTokens(msg.sender);
  }


  /**
   *  State automaton for sale.
   *  @dev Contains main logic of sale process. Because in this function we change state 
   *       of contract we should not revert in any case. Returns boolean determine will
   *       tokens be saled in this transaction or not
   *  @param _weiAmount Amount of wei sent to buy tokens
   */
  function checkSaleState(uint256 _weiAmount) internal returns (uint256 weiAmount, uint256 weiToReturn, uint256 realRate, bool canBuyTokens) {
    // trying to decrease reads from storage
    uint256 _weiRaised = weiRaised;
    uint256 _nextWeiRaised = _weiRaised.add(_weiAmount);
    uint256 _now = now;
    uint256 _totalSupply = totalSupply;
    // this well be returned
    weiAmount = _weiAmount;
    weiToReturn = 0;
    realRate = rate;
    canBuyTokens = false;
    //characteristics of sale states

    if (saleState == SaleState.closedPresale) {
      if (_weiRaised >= hardClosedPresale || _now > endClosedPresale) {
          saleState = SaleState.closedPresaleEnded;
          SaleStateStarted(SaleState.closedPresaleEnded, _now);
      } else {
        if (_weiAmount >= minWeiDepositClosedPresale) {
          if (_nextWeiRaised > hardClosedPresale) {
            weiToReturn = _nextWeiRaised.sub(hardClosedPresale);
            weiAmount = weiAmount.sub(weiToReturn);
          }
          realRate = realRate.add(tmClosedPresaleAdd);
          realRate = realRate.add(getAmountWeiBonus(weiAmount));
          canBuyTokens = true;
        }
      }
    }

    if (saleState == SaleState.closedPresaleEnded) {
      if (_now >= startPublicPresale) {
          saleState = SaleState.publicPresale;
          SaleStateStarted(SaleState.publicPresale, _now);
      } else {
          weiToReturn = weiAmount;
          weiAmount = 0;
      }
    }

    if (saleState == SaleState.publicPresale) {
      if (_now >= startPublicPresale && _now <= endPublicPresale && _weiRaised < hardPublicPresale) {
        if (_weiAmount >= minWeiDepositPublicPresale) {
          if (_nextWeiRaised > hardPublicPresale) {
            weiToReturn = _nextWeiRaised.sub(hardPublicPresale);
            weiAmount = weiAmount.sub(weiToReturn);
          }
          realRate = realRate.add(tmPublicPresaleAdd);
          realRate = realRate.add(getAmountWeiBonus(weiAmount));
          canBuyTokens = true;
        }
      } else {
        saleState = SaleState.publicPresaleEnded;
        SaleStateStarted(SaleState.publicPresaleEnded, _now);
      }
    }
    
    if (saleState == SaleState.publicPresaleEnded) {
        if (_now >= startCrowdsale) {
            saleState = SaleState.crowdSale;
            SaleStateStarted(SaleState.crowdSale, _now);
        } else {
          weiToReturn = weiAmount;
          weiAmount = 0;
        }

    }
    
    if (saleState == SaleState.crowdSale) {
      if (_now >= startCrowdsale && _now <= endCrowdsale && _totalSupply < TOKENSTOSALE) {
        if (_weiAmount >= minWeiDepositCrowdsale) {
            canBuyTokens = true;
            realRate = realRate.add(getAmountWeiBonus(weiAmount));
            realRate = realRate.add(getTimeCrowdsaleBonus(startCrowdsale, _now));
        }
      } else {
        saleState = SaleState.Finalized;
        SaleStateStarted(SaleState.Finalized, _now);
      }
    }
    
    if (saleState == SaleState.Finalized) {
          weiToReturn = weiAmount;
          weiAmount = 0;
    }
    
    return (weiAmount, weiToReturn, realRate, canBuyTokens);
  }
  
  function getAmountWeiBonus(uint256 _weiAmount) internal pure returns(uint256) {
      
      if (_weiAmount < am1Start) return 0;

      if (_weiAmount >= am1Start && _weiAmount < am2Start) {
          return am1rateAdd;
      }
      
      if (_weiAmount >= am2Start && _weiAmount < am3Start) {
          return am2rateAdd;
      }
      
      if (_weiAmount >= am3Start) {
          return am3rateAdd;
      }
  }
      
  function getTimeCrowdsaleBonus(uint256 _startTime, uint256 _now) internal pure returns(uint256) {
      
    if (_now >= _startTime.add(tmCrowdsale4End)) {
        return 0;
    }
      
    if (_now > _startTime.add(tmCrowdsale1End) && _now < _startTime.add(tmCrowdsale2End)) {
        return tmCrowdsale2Add;
    }
    if (_now >= _startTime.add(tmCrowdsale2End) && _now < _startTime.add(tmCrowdsale3End)) {
        return tmCrowdsale3Add;
    }
    if (_now >= _startTime.add(tmCrowdsale3End) && _now < _startTime.add(tmCrowdsale4End)) {
        return tmCrowdsale4Add;
    }
      
    if (_now <= _startTime.add(tmCrowdsale1End)) {
        return tmCrowdsale1Add;
    }
    
  }
  
  /**
   *  low level token purchase function.
   *  @dev Because in this function we change state of sale through `validPurchase` cal 
   *       we should not revert in any case. If something goes wrong we must return money
   *       to `beneficiary` manually.
   *  @param beneficiary Account is trying to buy tokens
   */
  function buyTokens(address beneficiary) public payable whenNotPaused whenTokenSaling {

    uint256 _totalSupply = totalSupply;
    uint256 weiAmount;
    uint256 weiToReturn;
    uint256 _rate;
    bool canBuyTokens;

    (weiAmount, weiToReturn, _rate, canBuyTokens) = checkSaleState(msg.value);

    if (beneficiary != address(0) && canBuyTokens && weiAmount > 0) {
    
      uint256 tokensToMint = weiAmount.mul(_rate);
      uint256 redundantTokens = 0;
      uint256 _nextTotalSupply = _totalSupply.add(tokensToMint);
      
      if (_nextTotalSupply > TOKENSTOSALE) {
          redundantTokens = _nextTotalSupply.sub(TOKENSTOSALE);
          weiAmount = weiAmount.sub(redundantTokens.div(_rate));
          weiToReturn = msg.value - weiAmount;
          tokensToMint = tokensToMint.sub(redundantTokens);
      }
    
      mint(beneficiary, tokensToMint);
      
      // update state
      weiRaised = weiRaised.add(weiAmount);
      //    tokensToSale = tokensToSale.sub(tokens);

      forwardFunds(weiAmount);

      TokenPurchase(msg.sender, beneficiary, weiAmount, tokensToMint);
    } 
    
    if (weiToReturn > 0) {
        returnFunds(beneficiary, weiToReturn);
        if (saleState == SaleState.Finalized) {
            finalizeSale();
        }
    }
  }

  // send ether to the fund collection wallet
  // override to create custom fund forwarding mechanisms
  function forwardFunds(uint256 _weiAmount) internal {
    wallet.transfer(_weiAmount);
  }

  // send ether back to `msg.sender`
  function returnFunds(address withdrawer, uint256 _weiToReturn) internal {
    withdrawer.call.gas(30000).value(_weiToReturn)();
  }

  // @return true if crowdsale event has ended
  function finalizeSale() internal {
    
    tokenState = TokenState.tokenNormal;
  }


}
