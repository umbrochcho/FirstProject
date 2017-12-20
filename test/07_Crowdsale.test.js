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
		  				 			 durationDays: 15*86400,
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
		  				 		 durationDays: 45*86400,
		  				 		 minDeposit: toWei(0.05),
		  				 		 hardCap: toWei(125000)
		  				 		}, 
		  			 Finalized: {value: 5,
		  				 		 start: new Date(Date.UTC(2018, 3, 26, 0, 0, 0))
		  				 		}
		  			};
  
  const tokensToSale = 50000000;
  const wallet = accounts[9];
  const team = accounts[2];
  const bounty = accounts[3];
  const platform = accounts[4];
  const investor = accounts[5];
  
  const rate = new BigNumber(400);
  
  let glogs;
  let gminted = new BigNumber(0);
  let glastMinted = new BigNumber(0);
  let gtotalSupply = new BigNumber(0);
  let walletWei = new BigNumber(0);
  let investorTokens = new BigNumber(0);

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
    walletWei = await web3.eth.getBalance(wallet);
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
	  
  it('собранные средства в закрытом пресейле ограничены 700 эфиров', async function () {
    let _start = await token.getHardCap(SaleState.closedPresale.value);
    assert.isTrue(_start.equals(SaleState.closedPresale.hardCap), 'must be true');
  });
      
  it('на этой стадии инвестор получит 280 бонусных токенов за каждый эфир', async function () {
	const _now = await token.getNow();
	const _bonus = await token.getTimeBonus(0, _now);
	assert.isTrue(_bonus.equals(280), 'must be 280');
  });
	
  it('на этой стадии минимальный платеж составляет 40 эфиров', async function () {
	const _min = await token.getMinDeposit(SaleState.closedPresale.value);
	assert.isTrue(_min.equals(SaleState.closedPresale.minDeposit), 'must be 40');
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

  it('баланс кошелька для собранных средств не изменился', async function () {
    const _pre = await web3.eth.getBalance(wallet);
    assert.isTrue(_pre.equals(walletWei), 'must be equal');
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
	gtotalSupply = gtotalSupply.plus(_supply);
	glastMinted = glastMinted.plus(event.args.amount);
  gminted = gminted.plus(glastMinted);
  investorTokens = investorTokens.plus(glastMinted);
	assert.isTrue(_supply.equals(gminted));
  });

  it('у инвестора добавилось токенов', async function () {
  	const event = glogs.find(e => e.event === 'TokenPurchase' &&
			 e.args.beneficiary === investor && e.args.amount.equals(glastMinted));
	  expect(event, 'должно было произойти событие TokenPurchase').to.exist;
	  const _balance = await token.balanceOf(investor);
	  assert.isTrue(_balance.equals(investorTokens), 'must be equal');
  });

  it('собрано 40 эфиров', async function () {
	const _raised = await token.weiRaised();
	assert.isTrue(_raised.equals(toWei(40)), 'must be 40');
  });

  it('баланс кошелька для собранных средств увеличился на 40 эфиров', async function () {
    const _pre = await web3.eth.getBalance(wallet);
    assert.isTrue(_pre.equals(walletWei.plus(toWei(40))), 'must be equal');
    walletWei = _pre;
  });
  
  it('инвестор вносит 700 эфиров и превышает хардкап закрытого пресейла', async function () {
    const { receipt, logs } = await token.sendTransaction({ value: toWei(700), from: investor });
    glogs = logs;
    assert.equal(receipt.status, 1, 'must be 1');
  });
      
  it('баланс кошелька для сбора средств увеличился на 660 эфиров', async function () {
    const _pre = await web3.eth.getBalance(wallet);
    assert.isTrue(_pre.equals(walletWei.plus(toWei(660))), 'must be equal');
    walletWei = _pre;
  });
  
  it('40 эфиров были возвращены инвестору', async function () {
    const event1 = glogs.find(e => e.event === 'RedundantFundsReturned' &&
                   e.args.payer === investor && e.args.amount.equals(toWei(40)));
    expect(event1, 'должно было произойти событие RedundantFundsReturned').to.exist;
  });
  
  it('собрано 700 эфиров', async function () {
    const _raised = await token.weiRaised();
    assert.isTrue(_raised.equals(toWei(700)), 'must be 700');
  });
  
  it('инвестор вносит еще один эфир', async function () {
    const { receipt, logs } = await token.sendTransaction({ value: toWei(1), from: investor });
    glogs = logs;
    assert.equal(receipt.status, 1, 'must be 1');
  });
      
  it('баланс кошелька для сбора средств не изменился', async function () {
    const _pre = await web3.eth.getBalance(wallet);
    assert.isTrue(_pre.equals(walletWei), 'must be equal');
    walletWei = _pre;
  });
  
  it('1 эфир был возвращен инвестору', async function () {
    const event1 = glogs.find(e => e.event === 'RedundantFundsReturned' &&
                   e.args.payer === investor && e.args.amount.equals(toWei(1)));
    expect(event1, 'должно было произойти событие RedundantFundsReturned').to.exist;
  });
  
  it('собрано 700 эфиров', async function () {
    const _raised = await token.weiRaised();
    assert.isTrue(_raised.equals(toWei(700)), 'must be 700');
  });
  
  it('закрытый пресейл окончен', async function () {
    const _state = await token.saleState();
    assert.isTrue(_state.equals(SaleState.closedPresaleEnded.value), 'must be 1');
  });
      
  it('между закрытым пресейлом и открытым пресейлом продажа токенов невозможна', async function () {
  });
      
  it('инвестор вносит еще один эфир', async function () {
    const { receipt, logs } = await token.sendTransaction({ value: toWei(1), from: investor });
    glogs = logs;
    assert.equal(receipt.status, 1, 'must be 1');
  });
      
  it('баланс кошелька для сбора средств не изменился', async function () {
    const _pre = await web3.eth.getBalance(wallet);
    assert.isTrue(_pre.equals(walletWei), 'must be equal');
    walletWei = _pre;
  });
  
  it('1 эфир был возвращен инвестору', async function () {
    const event1 = glogs.find(e => e.event === 'RedundantFundsReturned' &&
                   e.args.payer === investor && e.args.amount.equals(toWei(1)));
    expect(event1, 'должно было произойти событие RedundantFundsReturned').to.exist;
  });
  
  it('собрано 700 эфиров', async function () {
    const _raised = await token.weiRaised();
    assert.isTrue(_raised.equals(toWei(700)), 'must be 700');
  });
  
  it('открытый пресейл начинается 15 января 2018 года в 00:00:00 по Гринвичу', async function () {
    let _start = await token.getPublicPresaleStart();
    assert.isTrue(_start.equals(Math.round(SaleState.publicPresale.start.getTime()/1000)), 'must be true');
  });
      
  it('открытый пресейл длится 15 дней', async function () {
    let _start = await token.getPublicPresaleDuration();
    assert.isTrue(_start.equals(SaleState.publicPresale.durationDays), 'must be true');
  });
  
  it('открытый пресейл заканчивается 29 января 2018 года в 23:59:59 по Гринвичу', async function () {
    let _start = await token.getPublicPresaleEnd();
    assert.isTrue(_start.equals(Math.round(SaleState.publicPresale.end.getTime()/1000)), 'must be true');
  });
  
  it('собранные средства в публичном пресейле ограничены 5000 эфиров', async function () {
    let _start = await token.getHardCap(SaleState.publicPresale.value);
    assert.isTrue(_start.equals(SaleState.publicPresale.hardCap), 'must be true');
  });

  it('на этой стадии минимальный платеж составляет 0.05 эфиров', async function () {
    const _min = await token.getMinDeposit(SaleState.publicPresale.value);
    assert.isTrue(_min.equals(SaleState.publicPresale.minDeposit), 'must be 0.05');
  });
    
  it('сдвигаем время на 15 января 2018 года в 00:00:10 по Гринвичу', async function () {
    await increaseTimeTo(Math.round((SaleState.publicPresale.start.getTime() + 10000)/1000));
    await advanceBlock();
  });

  it('на этой стадии инвестор получит 100 бонусных токенов за каждый эфир', async function () {
    const _now = await token.getNow();
    const _bonus = await token.getTimeBonus(0, _now);
    assert.isTrue(_bonus.equals(100), 'must be 100');
  });
		
  it('инвестор вносит 0.01 эфир. Неудачно.', async function () {
    const { receipt, logs } = await token.sendTransaction({ value: toWei(0.01), from: investor });
    glogs = logs;
    assert.equal(receipt.status, 1, 'must be 1');
    });
    
    it('баланс кошелька для собранных средств не изменился', async function () {
      const _pre = await web3.eth.getBalance(wallet);
      assert.isTrue(_pre.equals(walletWei), 'must be equal');
    });
    
    it('средства были возвращены инвестору', async function () {
    const event = glogs.find(e => e.event === 'MinimumPaymentNotReached' &&
                 e.args.payer === investor && e.args.weiAmount.equals(toWei(0.01)));
    expect(event, 'должно было произойти событие MinimumPaymentNotReached').to.exist;
  
    const event1 = glogs.find(e => e.event === 'RedundantFundsReturned' &&
                   e.args.payer === investor && e.args.amount.equals(toWei(0.01)));
    expect(event1, 'должно было произойти событие RedundantFundsReturned').to.exist;
    });
  
    it('инвестор вносит 40 эфиров. Удачно.', async function () {
    const { receipt, logs } = await token.sendTransaction({ value: toWei(40), from: investor });
    glogs = logs;
    assert.equal(receipt.status, 1, 'must be 1');
    });
      
    it('собрано 740 эфиров', async function () {
    const _raised = await token.weiRaised();
    assert.isTrue(_raised.equals(toWei(740)), 'must be 740');
    });
  
    it('баланс кошелька для собранных средств увеличился на 40 эфиров', async function () {
      const _pre = await web3.eth.getBalance(wallet);
      assert.isTrue(_pre.equals(walletWei.plus(toWei(40))), 'must be equal');
      walletWei = _pre;
    });
    
    it('инвестор вносит 5000 эфиров и превышает хардкап закрытого пресейла', async function () {
      const { receipt, logs } = await token.sendTransaction({ value: toWei(5000), from: investor });
      glogs = logs;
      assert.equal(receipt.status, 1, 'must be 1');
    });
        
    it('баланс кошелька для сбора средств увеличился на 4260 эфиров', async function () {
      const _pre = await web3.eth.getBalance(wallet);
      assert.isTrue(_pre.equals(walletWei.plus(toWei(4260))), 'must be equal');
      walletWei = _pre;
    });
    
    it('740 эфиров были возвращены инвестору', async function () {
      const event1 = glogs.find(e => e.event === 'RedundantFundsReturned' &&
                     e.args.payer === investor && e.args.amount.equals(toWei(740)));
      expect(event1, 'должно было произойти событие RedundantFundsReturned').to.exist;
    });
    
    it('собрано 5000 эфиров', async function () {
      const _raised = await token.weiRaised();
      assert.isTrue(_raised.equals(toWei(5000)), 'must be 5000');
    });
    
    it('инвестор вносит еще один эфир', async function () {
      const { receipt, logs } = await token.sendTransaction({ value: toWei(1), from: investor });
      glogs = logs;
      assert.equal(receipt.status, 1, 'must be 1');
    });
        
    it('баланс кошелька для сбора средств не изменился', async function () {
      const _pre = await web3.eth.getBalance(wallet);
      assert.isTrue(_pre.equals(walletWei), 'must be equal');
      walletWei = _pre;
    });
    
    it('1 эфир был возвращен инвестору', async function () {
      const event1 = glogs.find(e => e.event === 'RedundantFundsReturned' &&
                     e.args.payer === investor && e.args.amount.equals(toWei(1)));
      expect(event1, 'должно было произойти событие RedundantFundsReturned').to.exist;
    });
    
    it('собрано 5000 эфиров', async function () {
      const _raised = await token.weiRaised();
      assert.isTrue(_raised.equals(toWei(5000)), 'must be 5000');
    });
    
    it('открытый пресейл окончен', async function () {
      const _state = await token.saleState();
      assert.isTrue(_state.equals(SaleState.publicPresaleEnded.value), 'must be 4');
    });
        
    it('между открытым пресейлом и краудсейлом продажа токенов невозможна', async function () {
    });
        
    it('инвестор вносит еще один эфир', async function () {
      const { receipt, logs } = await token.sendTransaction({ value: toWei(1), from: investor });
      glogs = logs;
      assert.equal(receipt.status, 1, 'must be 1');
    });
        
    it('баланс кошелька для сбора средств не изменился', async function () {
      const _pre = await web3.eth.getBalance(wallet);
      assert.isTrue(_pre.equals(walletWei), 'must be equal');
      walletWei = _pre;
    });
    
    it('1 эфир был возвращен инвестору', async function () {
      const event1 = glogs.find(e => e.event === 'RedundantFundsReturned' &&
                     e.args.payer === investor && e.args.amount.equals(toWei(1)));
      expect(event1, 'должно было произойти событие RedundantFundsReturned').to.exist;
    });
    
    it('собрано 5000 эфиров', async function () {
      const _raised = await token.weiRaised();
      assert.isTrue(_raised.equals(toWei(5000)), 'must be 5000');
    });
    
    it('краудсейл начинается 12 марта 2018 года в 00:00:00 по Гринвичу', async function () {
      let _start = await token.getCrowdsaleStart();
      assert.isTrue(_start.equals(Math.round(SaleState.crowdSale.start.getTime()/1000)), 'must be true');
    });
        
    it('краудсейл длится 45 дней', async function () {
      let _start = await token.getCrowdsaleDuration();
      assert.isTrue(_start.equals(SaleState.crowdSale.durationDays), 'must be true');
    });
    
    it('краудсейл заканчивается 25 апреля 2018 года в 23:59:59 по Гринвичу', async function () {
      let _start = await token.getCrowdsaleEnd();
      assert.isTrue(_start.equals(Math.round(SaleState.crowdSale.end.getTime()/1000)), 'must be true');
    });
    
    it('собранные средства в краудсейле ограничены 50 000 000 токенов', async function () {
    });
  
    it('на этой стадии минимальный платеж составляет 0.05 эфиров', async function () {
      const _min = await token.getMinDeposit(SaleState.crowdSale.value);
      assert.isTrue(_min.equals(SaleState.crowdSale.minDeposit), 'must be 0.05');
    });
      
    it('сдвигаем время на 12 марта 2018 года 00:00:10 по Гринвичу', async function () {
      await increaseTimeTo(Math.round((SaleState.crowdSale.start.getTime() + 10000)/1000));
      await advanceBlock();
    });
            
    it('в первый час краудсейла инвестор получит 60 бонусных токенов за каждый эфир', async function () {
      const _start = Math.round(SaleState.crowdSale.start.getTime()/1000);
      const _now = _start + 1800;
      const _bonus = await token.getTimeBonus(_start, _now);
      assert.isTrue(_bonus.equals(60), 'must be 60');
    });
            
    it('в первую неделю краудсейла инвестор получит 40 бонусных токенов за каждый эфир', async function () {
      const _start = Math.round(SaleState.crowdSale.start.getTime()/1000);
      const _now = _start + 3*86400;
      const _bonus = await token.getTimeBonus(_start, _now);
      assert.isTrue(_bonus.equals(40), 'must be 40');
    });
      
    it('во вторую неделю краудсейла инвестор получит 28 бонусных токенов за каждый эфир', async function () {
      const _start = Math.round(SaleState.crowdSale.start.getTime()/1000);
      const _now = _start + 9*86400;
      const _bonus = await token.getTimeBonus(_start, _now);
      assert.isTrue(_bonus.equals(28), 'must be 28');
    });
      
    it('в третью неделю краудсейла инвестор получит 20 бонусных токенов за каждый эфир', async function () {
      const _start = Math.round(SaleState.crowdSale.start.getTime()/1000);
      const _now = _start + 16*86400;
      const _bonus = await token.getTimeBonus(_start, _now);
      assert.isTrue(_bonus.equals(20), 'must be 20');
    });
      
    it('Начиная с четвертой недели краудсейла инвестор не получает бонусных токенов', async function () {
      const _start = Math.round(SaleState.crowdSale.start.getTime()/1000);
      const _now = _start + 23*86400;
      const _bonus = await token.getTimeBonus(_start, _now);
      assert.isTrue(_bonus.equals(0), 'must be 0');
    });
      
    it('инвестор вносит 0.01 эфир. Неудачно.', async function () {
      const { receipt, logs } = await token.sendTransaction({ value: toWei(0.01), from: investor });
      glogs = logs;
      assert.equal(receipt.status, 1, 'must be 1');
      });
      
      it('баланс кошелька для собранных средств не изменился', async function () {
        const _pre = await web3.eth.getBalance(wallet);
        assert.isTrue(_pre.equals(walletWei), 'must be equal');
      });
      
      it('средства были возвращены инвестору', async function () {
      const event = glogs.find(e => e.event === 'MinimumPaymentNotReached' &&
                   e.args.payer === investor && e.args.weiAmount.equals(toWei(0.01)));
      expect(event, 'должно было произойти событие MinimumPaymentNotReached').to.exist;
    
      const event1 = glogs.find(e => e.event === 'RedundantFundsReturned' &&
                     e.args.payer === investor && e.args.amount.equals(toWei(0.01)));
      expect(event1, 'должно было произойти событие RedundantFundsReturned').to.exist;
      });
    
      it('инвестор вносит 40 эфиров. Удачно.', async function () {
    	    const { receipt, logs } = await token.sendTransaction({ value: toWei(40), from: investor });
    	    glogs = logs;
    	    assert.equal(receipt.status, 1, 'must be 1');
    	    });
    	      
    	    it('собрано 5040 эфиров', async function () {
    	    const _raised = await token.weiRaised();
    	    assert.isTrue(_raised.equals(toWei(5040)), 'must be 5040');
    	    });
    	  
    	    it('баланс кошелька для собранных средств увеличился на 40 эфиров', async function () {
    	      const _pre = await web3.eth.getBalance(wallet);
    	      assert.isTrue(_pre.equals(walletWei.plus(toWei(40))), 'must be equal');
    	      walletWei = _pre;
    	    });
    	    
    	    it('инвестор вносит 125000 эфиров и превышает хардкап краудсейла', async function () {
    	      const { receipt, logs } = await token.sendTransaction({ value: toWei(125000), from: investor });
    	      glogs = logs;
    	      const event1 = glogs.find(e => e.event === 'RedundantFundsReturned' &&
	                     e.args.payer === investor);
    	      const event2 = glogs.find(e => e.event === 'Mint' &&
	                     e.args.to === investor);
    	      assert.equal(receipt.status, 1, 'must be 1');
    	    });
    	        
    	    it('баланс кошелька для сбора средств увеличился', async function () {
    	      const _pre = await web3.eth.getBalance(wallet);
    	      assert.isTrue(_pre.greaterThan(walletWei), 'must be greater');
    	      walletWei = _pre;
    	    });
    	    
    	    it('избыточные эфиры были возвращены инвестору', async function () {
    	      const event1 = glogs.find(e => e.event === 'RedundantFundsReturned' &&
    	                     e.args.payer === investor);
    	      expect(event1, 'должно было произойти событие RedundantFundsReturned').to.exist;
    	    });
    	    
    	    it('отчеканено 50 000 000 токенов', async function () {
    	      const _supply = await token.totalSupply();
    	      assert.isTrue(_supply.equals(toWei(tokensToSale)), 'must be 50 000 000');
    	    });
    	    
    	    it('инвестор вносит еще один эфир', async function () {
    	      const { receipt, logs } = await token.sendTransaction({ value: toWei(1), from: investor });
    	      glogs = logs;
    	      assert.equal(receipt.status, 1, 'must be 1');
    	    });
    	        
    	    it('баланс кошелька для сбора средств не изменился', async function () {
    	      const _pre = await web3.eth.getBalance(wallet);
    	      assert.isTrue(_pre.equals(walletWei), 'must be equal');
    	      walletWei = _pre;
    	    });
    	    
    	    it('1 эфир был возвращен инвестору', async function () {
    	      const event1 = glogs.find(e => e.event === 'RedundantFundsReturned' &&
    	                     e.args.payer === investor && e.args.amount.equals(toWei(1)));
    	      expect(event1, 'должно было произойти событие RedundantFundsReturned').to.exist;
    	    });
    	    
    	    it('всего имеется 100 000 000 токенов', async function () {
      	      const _supply = await token.totalSupply();
      	      assert.isTrue(_supply.equals(toWei(2*tokensToSale)), 'must be 100 000 000');
      	    });
      	    
    	    it('краудсейл окончен', async function () {
    	      const _state = await token.saleState();
    	      assert.isTrue(_state.equals(SaleState.Finalized.value), 'must be 6');
    	    });
      	    
    	    it('токен перешел в режим обычного функционирования', async function () {
    	      const _state = await token.tokenState();
    	      assert.isTrue(_state.equals(TokenState.tokenNormal), 'must be 1');
    	    });
      	    
    	    it('чеканка токенов прекращена', async function () {
    	      const _minting = await token.minting();
    	      assert.isFalse(_minting, 'must be false');
    	    });
      	    
    	    it('на балансе команды теперь 15 000 000 токенов', async function () {
    	      const _balance = await token.balanceOf(team);
    	      assert.isTrue(_balance.equals(toWei(15000000)), 'must be 15 000 000');
    	    });
    	    
    	    it('на балансе баунти теперь 3 000 000 токенов', async function () {
      	      const _balance = await token.balanceOf(bounty);
      	      assert.isTrue(_balance.equals(toWei(3000000)), 'must be 3 000 000');
      	    });
    	    
    	    it('на балансе платформы теперь 32 000 000 токенов', async function () {
      	      const _balance = await token.balanceOf(platform);
      	      assert.isTrue(_balance.equals(toWei(32000000)), 'must be 32 000 000');
      	    });
      	    
    	    it('на балансе команды заморожено 15 000 000 токенов на год с момента окончания продажи', async function () {
    	      const _freezed = await token.freezed(team);
    	      assert.isTrue(_freezed, 'must be true');
    	      const _end = await token.saleEndTime();
    	      const [ date, sum ] = await token.freezes(team);
    	      assert.isTrue(date.equals(_end.plus(86400*365).minus(1)), 'must be true')
    	      const _balance = await token.balanceOf(team);
    	      assert.isTrue(_balance.equals(sum), 'must be 15 000 000');
    	    });
      	    
    	    it('на балансе баунти заморожено 3 000 000 токенов на 45 дней с момента окончания продажи', async function () {
    	      const _freezed = await token.freezed(bounty);
    	      assert.isTrue(_freezed, 'must be true');
    	      const _end = await token.saleEndTime();
    	      const [ date, sum ] = await token.freezes(bounty);
    	      assert.isTrue(date.equals(_end.plus(86400*45).minus(1)), 'must be true')
    	      const _balance = await token.balanceOf(bounty);
    	      assert.isTrue(_balance.equals(sum), 'must be 15 000 000');
    	    });
});
