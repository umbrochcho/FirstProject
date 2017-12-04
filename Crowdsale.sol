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

  enum SaleState {closedPresale, closedPresaleEnded, publicPresale, publicPresaleEnded, crowdSale, crowdSaleEnded, Finalized}

  SaleState saleState = SaleState.closedPresale;
  SaleState nextState = SaleState.publicPresale; 

  // address where funds are collected
  address public wallet;

  uint256 constant TOKENSTOSALE = 50000000 * 1 ether;
  // how many token units a buyer gets per wei
  uint256 public rate = 400;

  // amount of raised money in wei
  uint256 public weiRaised;

  event SaleStageStarted(string name, uint date);
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
  }

  // fallback function can be used to buy tokens
  function () external payable {
    buyTokens(msg.sender);
  }


  /**
   *  State automaton for sale.
   *  @dev Contains main logic of sale process. Because in this function we change state 
   *       of contract we should not revert in any case. Returned boolean determine will
   *       tokens be saled in this transaction or not
   *  @param _weiAmount Amount of wei sent to by tokens
   */
  function checkSaleState(uint256 _weiAmount) internal returns (uint256, uint256, bool) {
    // trying to decrease reads from storage
    uint256 _weiRaised = weiRaised;
    uint256 _nextWeiRaised = _weiRaised.add(_weiAmount);
    uint256 _now = now;
    uint256 _totalSupply = totalSupply;
    // this well be returned
    bool result = false;
    uint256 _weiToReturn = 0;

    //characteristics of sale states

    uint256 endClosedPresale = 1515974399; //14.01.2018 23:59:59 GMT
    uint256 hardClosedPresale = 700 * 1 ether;
    uint256 minWeiDepositClosedPresale = 40 * 1 ether;

    uint256 startPublicPresale = 1515974400; //15.01.2018 0:00:00 GMT
    uint256 endPublicPresale = 1517270399;   //29.01.2018 23:59:59 GMT
    uint256 hardPublicPresale = 5000 * 1 ether;
    uint256 minWeiDepositPublicPresale = 50 * 1 finney;

    uint256 startCrowdsale = 1520812800; //12.03.2018 0:00:00 GMT
    uint256 endCrowdsale = 1524700799;   //25.04.2018 23:59:59 GMT
    uint256 hardCrowdsale = TOKENSTOSALE;
    uint256 minWeiDepositCrowdsale = 50 * 1 finney;

    if (saleState == SaleState.closedPresale) {
      if (_weiRaised >= hardClosedPresale || _now > endClosedPresale) {
          saleState = SaleState.closedPresaleEnded;
      } else {
        if (_weiAmount >= minWeiDepositClosedPresale) {
          if (_nextWeiRaised > hardClosedPresale) {
            _weiToReturn = _nextWeiRaised.sub(hardClosedPresale);
            _weiAmount = _weiAmount.sub(_weiToReturn);
          }
          result = true;
        }
      }
    }

    if (saleState == SaleState.closedPresaleEnded) {
      if (_now >= startPublicPresale) {
          saleState = SaleState.publicPresale;
      }
    }

    if (saleState == SaleState.publicPresale) {
      if (_now >= startPublicPresale && _now <= endPublicPresale && _weiRaised < hardPublicPresale) {
        if (_weiAmount >= minWeiDepositPublicPresale) {
          if (_nextWeiRaised > hardPublicPresale) {
            _weiToReturn = _nextWeiRaised.sub(hardPublicPresale);
            _weiAmount = _weiAmount.sub(_weiToReturn);
          }
          result = true;
        }
      } else {
        saleState = SaleState.publicPresaleEnded;
      }
    }

    if (saleState == SaleState.publicPresaleEnded) {
      if (_now >= startCrowdsale && _now <= endCrowdsale && _totalSupply < hardCrowdsale) {
        if (_weiAmount >= minWeiDepositCrowdsale) {
            result = true;
        }
      } else {
        saleState = SaleState.Finalized;
      }
    }

    return (_weiAmount, _weiToReturn, result);
  }
  
  function recalcTokensToBuy(uint256 _weiAmount, uint256 _tokenRate) internal view returns(uint256, uint256) {

    uint256 tokensToMint = _weiAmount.mul(_tokenRate);
    uint256 redundantTokens = 0;
    uint _totalSupply = totalSupply;
    uint256 nextTotalSupply = _totalSupply.add(tokensToMint);

    if (nextTotalSupply > TOKENSTOSALE) {
      redundantTokens = nextTotalSupply.sub(TOKENSTOSALE);
      tokensToMint = tokensToMint.sub(redundantTokens);
    }

    return (tokensToMint, redundantTokens);
  }

  function finalizeSale() internal {

  }

  // 
  /**
   *  low level token purchase function.
   *  @dev Because in this function we change state of sale through `validPurchase` cal 
   *       we should not revert in any case. If something goes wrong we must return money
   *       to `beneficiary` manually.
   *  @param beneficiary Account is trying to buy tokens
   */
  function buyTokens(address beneficiary) public payable whenTokenSaling {

    uint256 weiAmount;
    uint256 weiToReturn;
    bool canBuyTokens;

    uint256 tokensToMint;
    uint256 redundantTokens;

    (weiAmount, weiToReturn, canBuyTokens) = checkSaleState(msg.value);

    if (beneficiary != address(0) && canBuyTokens && weiAmount > 0) {
    
      uint256 _rate = rate;
      (tokensToMint, redundantTokens) = recalcTokensToBuy(weiAmount, _rate);
    
      weiToReturn = weiToReturn.add(redundantTokens.div(_rate));
    if (_nextTotalSupply > TOKENSTOSALE) {
      weiAmount = _tokensToSale.mul(rate);
      weiToReturn = msg.value - weiAmount;
      tokens = _tokensToSale;
    }
    mint(beneficiary, tokensToMint);
    // update state
    weiRaised = weiRaised.add(weiAmount);
    tokensToSale = tokensToSale.sub(tokens);

    forwardFunds();

    TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);
    }
  }

  // send ether to the fund collection wallet
  // override to create custom fund forwarding mechanisms
  function forwardFunds(uint256 _weiAmount) internal {
    wallet.transfer(_weiAmount);
  }

  // send ether back to `msg.sender`
  function returnFunds(uint256 _weiToReturn) internal {
    msg.sender.call.gas(30000).value(_weiToReturn);
  }

  // @return true if crowdsale event has ended
  function hasEnded() public view returns (bool) {
    return now > endTime;
  }


}
