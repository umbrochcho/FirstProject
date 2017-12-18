import { increaseTimeTo } from './helpers/increaseTime';

const expect = require('chai').expect;
const toWei = require('./helpers/wei').default;
const toEther = require('./helpers/ether').default;

var StandardTokenMock = artifacts.require('./mocks/StandardTokenMock.sol');

contract('полный токен ERC20', function (accounts) {
  let token;
  let creator = accounts[0];
  let other = accounts[1];
  let stranger = accounts[2];
  let freezeStart;
  let freezeDuration = 3600;

  before(async function () {
    token = await StandardTokenMock.new(other, 100);
  });
  
  it('возвращает правильное количество токенов после создания', async function () {
    let totalSupply = await token.totalSupply();
    totalSupply = toEther(totalSupply);
    assert.equal(totalSupply, 100);
  });

  it('баланс счета-отправителя равен 100', async function () {
	let balance = await token.balanceOf(other);
	assert.isTrue(balance.equals(toWei(100)));
  });
	  
  it('баланс счета получателя равен 0', async function () {
	let balance = await token.balanceOf(stranger);
	assert.equal(balance, 0);
  });
	  
  it('замораживаем 50 токенов на счете-отправителе на один час', async function () {
    freezeStart =  await token.getNow();
    console.log('\tзаморозка начинатеся в ' + freezeStart);
    
    let _date = freezeStart.plus(freezeDuration);
    console.log('\tзаморозка закончится в ' + _date);
    await token.doSetFreeze(other, _date, toWei(50), { from: creator });
    console.log('\tна счету ' + other.toString() + ' на один час заморожено 50 токенов');
    let fc = await token.freezeCount();
    assert.equal(fc, 1, 'must be 1');
    let freezed = await token.freezed(other);
    assert.isTrue(freezed, 'must be true');
    let [ date, sum ] = await token.freezes(other);
    assert.isTrue(sum.equals(toWei(50)), 'must be 50');
    assert.isTrue(date.equals(_date), 'must be ' + _date);
  });

  it('счет-отправитель разрешает счету-получателю использовать 100 токенов', async function () {
    let { logs } = await token.approve(stranger, toWei(100), { from: other });
    const event = logs.find(e => e.event === 'Approval' && e.args.owner === other &&
    						e.args.spender === stranger);
    expect(event, 'должно было произойти событие Approval').to.exist;

    let allowance = await token.allowance(other, stranger);

    assert.isTrue(allowance.equals(toWei(100)));
  });

  it('передаем 10 токенов. Удачно.', async function () {
    let { logs } = await token.transferFrom(other, stranger, toWei(10), { from: stranger });
    const event = logs.find(e => e.event === 'Transfer' && e.args.from === other &&
            				e.args.to === stranger);
    expect(event, 'должно было произойти событие Transfer').to.exist;
  });

  it('баланс счета-отправителя равен 90', async function () {
	let balance = await token.balanceOf(other);
	assert.isTrue(balance.equals(toWei(90)));
  });
		  
  it('баланс счета получателя равен 10', async function () {
	let balance = await token.balanceOf(stranger);
	assert.isTrue(balance.equals(toWei(10)));
  });
		  
  it('пытаемся передать еще 50 токенов, сделав баланс счета-отправителя меньше замороженной суммы. Неудачно.', async function () {
	  let { logs } = await token.transferFrom(other, stranger, toWei(50), { from: stranger });
	  
	  const event = logs.find(e => e.event === 'Transfer' && e.args.from === other &&
				e.args.to === stranger);
	  expect(event, 'должно было произойти событие Transfer').not.to.exist;

  });

  it('баланс счета-отправителя равен 90', async function () {
	let balance = await token.balanceOf(other);
	assert.isTrue(balance.equals(toWei(90)));
  });
			  
  it('баланс счета получателя равен 10', async function () {
	let balance = await token.balanceOf(stranger);
	assert.isTrue(balance.equals(toWei(10)));
  });
			  
  it('сдвигаем время на 1 час вперед', async function () {
	    await increaseTimeTo(freezeStart.plus(freezeDuration));
	    console.log('###');
	    let now = await token.getNow();
	    assert.isAbove(now, freezeStart.plus(freezeDuration));
	  });

  it('если срок заморозки истек, то владелец распоряжаться всей суммой на счету', async function () {
	    let now = await token.getNow();
	    let [ date, sum ] = await token.freezes(other);
	    assert.isAbove(now, date, 'must be greater');
	    let { logs } = await token.transferFrom(other, stranger, toWei(90), { from: stranger });
	    const event1 = logs.find(e => e.event === 'UnFreezed' && e.args.who === other &&
                e.args.amount.equals(toWei(50)));
	    expect(event1, 'должно было произойти событие UnFreezed').to.exist;
	    const event2 = logs.find(e => e.event === 'Transfer' && e.args.from === other &&
	                            e.args.to === stranger);
	    expect(event2, 'должно было произойти событие Transfer').to.exist;
	    [ date, sum ] = await token.freezes(other);
	    assert.equal(sum, 0, 'must be 0');
	    let freezed = await token.freezed(other);
	    assert.isFalse(freezed, 'must be false');
	    let freezeCount = await token.freezeCount();
	    assert.equal(freezeCount, 0, 'must be 0');
	  });
  it('баланс счета-отправителя равен 0', async function () {
	let balance = await token.balanceOf(other);
	assert.isTrue(balance.equals(toWei(0)));
  });
				  
  it('баланс счета получателя равен 100', async function () {
	let balance = await token.balanceOf(stranger);
	assert.isTrue(balance.equals(toWei(100)));
  });
				  
  /*  it('should return correct balances after transfering from another account', async function () {
    let token = await StandardTokenMock.new(accounts[0], 100);
    await token.approve(accounts[1], 100);
    await token.transferFrom(accounts[0], accounts[2], 100, { from: accounts[1] });

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 0);

    let balance1 = await token.balanceOf(accounts[2]);
    assert.equal(balance1, 100);

    let balance2 = await token.balanceOf(accounts[1]);
    assert.equal(balance2, 0);
  });

  it('should throw an error when trying to transfer more than allowed', async function () {
    await token.approve(accounts[1], 99);
    try {
      await token.transferFrom(accounts[0], accounts[2], 100, { from: accounts[1] });
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('should throw an error when trying to transferFrom more than _from has', async function () {
    let balance0 = await token.balanceOf(accounts[0]);
    await token.approve(accounts[1], 99);
    try {
      await token.transferFrom(accounts[0], accounts[2], balance0 + 1, { from: accounts[1] });
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  describe('validating allowance updates to spender', function () {
    let preApproved;

    it('should start with zero', async function () {
      preApproved = await token.allowance(accounts[0], accounts[1]);
      assert.equal(preApproved, 0);
    });

    it('should increase by 50 then decrease by 10', async function () {
      await token.increaseApproval(accounts[1], 50);
      let postIncrease = await token.allowance(accounts[0], accounts[1]);
      preApproved.plus(50).should.be.bignumber.equal(postIncrease);
      await token.decreaseApproval(accounts[1], 10);
      let postDecrease = await token.allowance(accounts[0], accounts[1]);
      postIncrease.minus(10).should.be.bignumber.equal(postDecrease);
    });
  });

  it('should increase by 50 then set to 0 when decreasing by more than 50', async function () {
    await token.approve(accounts[1], 50);
    await token.decreaseApproval(accounts[1], 60);
    let postDecrease = await token.allowance(accounts[0], accounts[1]);
    postDecrease.should.be.bignumber.equal(0);
  });

  it('should throw an error when trying to transfer to 0x0', async function () {
    let token = await StandardTokenMock.new(accounts[0], 100);
    try {
      await token.transfer(0x0, 100);
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('should throw an error when trying to transferFrom to 0x0', async function () {
    let token = await StandardTokenMock.new(accounts[0], 100);
    await token.approve(accounts[1], 100);
    try {
      await token.transferFrom(accounts[0], 0x0, 100, { from: accounts[1] });
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });
  */
});
