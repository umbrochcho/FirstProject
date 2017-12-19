import { advanceBlock } from './helpers/advanceToBlock';
import { increaseTimeTo, duration } from './helpers/increaseTime';
import latestTime from './helpers/latestTime';

const toWei = require('./helpers/wei').default;
const toEther = require('./helpers/ether').default;

const expect = require('chai').expect;

const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const CrowdsaleMock = artifacts.require('../contracts/mocks/CrowdsaleMock');

contract('Продажа токенов', function (accounts) {
	
  let token;
  const TokenState = { tokenSaling: 0, tokenNormal: 1 };
  
  const SaleState = {closedPresale: {value: 0,
	  								 start: Date.now(),
	  								 end: new Date(Date.UTC(2018, 1, 14, 23, 59, 59)),
	  								 minDeposit: toWei(40),
	  								 hardCap: toWei(700)
	  								}, 
		  			 closedPresaleEnded: {value: 1}, 
		  			 publicPresale: {value: 2,
		  				 			 start: new Date(Date.UTC(2018, 0, 15, 0, 0, 0)),
		  				 			 end: new Date(Date.UTC(2018, 0, 29, 23, 59, 59)),
		  				 			 durationDays: 15,
		  				 			 minDeposit: toWei(0.05),
		  				 			 hardCap: toWei(5000)
		  				 			}, 
		  			 publicPresaleEnded: {value: 3,
		  				 				  start: new Date(Date.UTC(2018, 0, 30, 0, 0, 0)),
		  				 				  end: new Date(Date.UTC(2018, 2, 11, 23, 59, 59)),
 			  				 			  durationDays: 41
		  				 				 }, 
		  			 crowdSale: {value: 4,
		  				 		 start: new Date(Date.UTC(2018, 2, 12, 0, 0, 0)),
		  				 		 end: new Date(Date.UTC(2018, 3, 25, 23, 59, 59)),
		  				 		 durationDays: 45,
		  				 		 minDeposit: toWei(0.05),
		  				 		 hardCap: toWei(125000)
		  				 		}, 
		  			 Finalized: {value: 5,
		  				 		 start: new Date(Date.UTC(2018, 3, 26, 0, 0, 0))
		  				 		}
		  			};
  
  const tokensToSale = 50000000;
  const wallet = accounts[1];
  const team = accounts[2];
  const bounty = accounts[3];
  const platform = accounts[4];
  const investor = accounts[5];
  
  const rate = new BigNumber(400);
  
  let glogs;
  let gminted = new BigNumber(0);
  let glastMinted = new BigNumber(0);
  let gtotalSupply = new BigNumber(0);

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();
    token = await CrowdsaleMock.new(wallet, team, bounty, platform);
  });


  it('токен создается в состоянии продажи', async function () {
	const state = await token.tokenState();
	assert.equal(state, TokenState.tokenSaling, 'must be 0');
  });

  it('общее количество токенов для продажи равно ' + tokensToSale, async function () {
	const _toSale = await token.getTokensToSale();
	assert.equal(toEther(_toSale), tokensToSale, 'must be 50 000 000');
  });

  it('общее количество токенов равно 0', async function () {
	const supply = await token.totalSupply();
	assert.equal(supply, 0, 'must be 0');
  });

  it('количество собранного эфира равно 0', async function () {
	const raised = await token.weiRaised();
	assert.equal(raised, 0, 'must be 0');
  });

  it('адрес кошелька для собранных средств не равен 0', async function () {
	const _team = await token.wallet();
	assert.notEqual(_team, 0, 'must be above 0');
  });

  it('адрес команды не равен 0', async function () {
	const _team = await token.teamAddress();
	assert.notEqual(_team, 0, 'must be above 0');
  });

  it('баланс команды равен 0', async function () {
	const _balance = await token.balanceOf(team);
	assert.isTrue(_balance.equals(0), 'must be 0');
  });

  it('заморозка счета команды инициализирована', async function () {
	const _freeze = await token.freezed(team);
	assert.isTrue(_freeze, 'must be true');
  });

  it('адрес баунти не равен 0', async function () {
	const _team = await token.bountyAddress();
	assert.notEqual(_team, 0, 'must be above 0');
  });

  it('баланс баунти равен 0', async function () {
	const _balance = await token.balanceOf(bounty);
	assert.isTrue(_balance.equals(0), 'must be 0');
  });

  it('заморозка счета баунти инициализирована', async function () {
	const _freeze = await token.freezed(bounty);
	assert.isTrue(_freeze, 'must be true');
  });

  it('адрес платформы не равен 0', async function () {
	const _team = await token.platformAddress();
	assert.notEqual(_team, 0, 'must be above 0');
  });

  it('баланс платформы равен 0', async function () {
	const _balance = await token.balanceOf(platform);
	assert.isTrue(_balance.equals(0), 'must be 0');
  });

  it('за каждый эфир инвестор получит 400 токенов без учета бонусов', async function () {
	const _rate = await token.rate();
	assert.isTrue(_rate.equals(rate), 'must be 400');
  });
  
  it('на любой стадии продажи инвестор, внесший сумму свыше 2000 эфиров, получит за каждый эфир 20 бонусных токенов', async function () {
	const _rate = await token.getAmountBonus(toWei(2000));
	assert.isTrue(_rate.equals(20), 'must be 20');
  });
	  
  it('на любой стадии продажи инвестор, внесший сумму свыше 5000 эфиров, получит за каждый эфир 28 бонусных токенов', async function () {
	const _rate = await token.getAmountBonus(toWei(5000));
	assert.isTrue(_rate.equals(28), 'must be 28');
  });
		  
  it('на любой стадии продажи инвестор, внесший сумму свыше 10000 эфиров, получит за каждый эфир 40 бонусных токенов', async function () {
	const _rate = await token.getAmountBonus(toWei(10000));
	assert.isTrue(_rate.equals(40), 'must be 40');
  });
			  
  it('продажа находится в стадии закрытого пресейла', async function () {
	const _state = await token.saleState();
	assert.isTrue(_state.equals(SaleState.closedPresale.value), 'must be 0');
  });
	  
  it('на этой стадии инвестор получит 280 бонусных токенов за каждый эфир', async function () {
	const _now = await token.getNow();
	const _bonus = await token.getTimeBonus(0, _now);
	assert.isTrue(_bonus.equals(280), 'must be 280');
  });
	
  it('на этой стадии минимальный платеж составляет 40 эфиров', async function () {
	const _min = await token.getMinDeposit(SaleState.closedPresale.value);
	assert.isTrue(_min.equals(toWei(40)), 'must be 40');
  });
		
  it('инвестор вносит 1 эфир. Неудачно.', async function () {
	const { receipt, logs } = await token.sendTransaction({ value: toWei(1), from: investor });
	glogs = logs;
	assert.equal(receipt.status, 1, 'must be 1');
  });
	
  it('токены не были отчеканены', async function () {
	const _supply = await token.totalSupply();
	assert.equal(_supply, 0, 'must be 0');
  });

  it('баланс инвестора равен 0', async function () {
	const _balance = await token.balanceOf(investor);
	assert.equal(_balance, 0, 'must be 0');
  });

  it('средства не были собраны', async function () {
	const _raised = await token.weiRaised();
	assert.equal(_raised, 0, 'must be 0');
  });

  it('средства были возвращены инвестору', async function () {
	const event = glogs.find(e => e.event === 'MinimumPaymentNotReached' &&
							 e.args.payer === investor && e.args.weiAmount.equals(toWei(1)));
	expect(event, 'должно было произойти событие MinimumPaymentNotReached').to.exist;

	const event1 = glogs.find(e => e.event === 'RedundantFundsReturned' &&
			 				  e.args.payer === investor && e.args.amount.equals(toWei(1)));
	expect(event1, 'должно было произойти событие RedundantFundsReturned').to.exist;
  });

  it('инвестор вносит 40 эфиров. Удачно.', async function () {
	const { receipt, logs } = await token.sendTransaction({ value: toWei(40), from: investor });
	glogs = logs;
	assert.equal(receipt.status, 1, 'must be 1');
  });
		
  it('токены были отчеканены', async function () {
	const _supply = await token.totalSupply();
	
	const event = glogs.find(e => e.event === 'Mint' &&
			 e.args.to === investor);
	expect(event, 'должно было произойти событие Mint').to.exist;
	assert.isTrue(_supply.equals(event.args.amount));
	gtotalSupply = gtotalSupply.plus(_supply);
	glastMinted = glastMinted.plus(event.args.amount);
	gminted = gminted.plus(glastMinted);
  });

  it('баланс инвестора равен ' + toEther(glastMinted), async function () {
	const _balance = await token.balanceOf(investor);
	console.log(_balance);
	assert.isTrue(_balance.equals(glastMinted), 'must be equal');
  });

  it('собраны', async function () {
	const _raised = await token.weiRaised();
	assert.isTrue(_raised.equals(toWei(40)), 'must be 0');
  });

  
  
/*  it('should be ended only after end', async function () {
    let ended = await this.crowdsale.hasEnded();
    ended.should.equal(false);
    await increaseTimeTo(this.afterEndTime);
    ended = await this.crowdsale.hasEnded();
    ended.should.equal(true);
  });

  describe('accepting payments', function () {
    it('should reject payments before start', async function () {
      await this.crowdsale.send(value).should.be.rejectedWith(EVMRevert);
      await this.crowdsale.buyTokens(investor, { from: purchaser, value: value }).should.be.rejectedWith(EVMRevert);
    });

    it('should accept payments after start', async function () {
      await increaseTimeTo(this.startTime);
      await this.crowdsale.send(value).should.be.fulfilled;
      await this.crowdsale.buyTokens(investor, { value: value, from: purchaser }).should.be.fulfilled;
    });

    it('should reject payments after end', async function () {
      await increaseTimeTo(this.afterEndTime);
      await this.crowdsale.send(value).should.be.rejectedWith(EVMRevert);
      await this.crowdsale.buyTokens(investor, { value: value, from: purchaser }).should.be.rejectedWith(EVMRevert);
    });
  });

  describe('high-level purchase', function () {
    beforeEach(async function () {
      await increaseTimeTo(this.startTime);
    });

    it('should log purchase', async function () {
      const { logs } = await this.crowdsale.sendTransaction({ value: value, from: investor });

      const event = logs.find(e => e.event === 'TokenPurchase');

      should.exist(event);
      event.args.purchaser.should.equal(investor);
      event.args.beneficiary.should.equal(investor);
      event.args.value.should.be.bignumber.equal(value);
      event.args.amount.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should increase totalSupply', async function () {
      await this.crowdsale.send(value);
      const totalSupply = await this.token.totalSupply();
      totalSupply.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should assign tokens to sender', async function () {
      await this.crowdsale.sendTransaction({ value: value, from: investor });
      let balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should forward funds to wallet', async function () {
      const pre = web3.eth.getBalance(wallet);
      await this.crowdsale.sendTransaction({ value, from: investor });
      const post = web3.eth.getBalance(wallet);
      post.minus(pre).should.be.bignumber.equal(value);
    });
  });

  describe('low-level purchase', function () {
    beforeEach(async function () {
      await increaseTimeTo(this.startTime);
    });

    it('should log purchase', async function () {
      const { logs } = await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });

      const event = logs.find(e => e.event === 'TokenPurchase');

      should.exist(event);
      event.args.purchaser.should.equal(purchaser);
      event.args.beneficiary.should.equal(investor);
      event.args.value.should.be.bignumber.equal(value);
      event.args.amount.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should increase totalSupply', async function () {
      await this.crowdsale.buyTokens(investor, { value, from: purchaser });
      const totalSupply = await this.token.totalSupply();
      totalSupply.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should assign tokens to beneficiary', async function () {
      await this.crowdsale.buyTokens(investor, { value, from: purchaser });
      const balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should forward funds to wallet', async function () {
      const pre = web3.eth.getBalance(wallet);
      await this.crowdsale.buyTokens(investor, { value, from: purchaser });
      const post = web3.eth.getBalance(wallet);
      post.minus(pre).should.be.bignumber.equal(value);
    });
  });
  */
});
