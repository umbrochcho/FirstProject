
const assertRevert = require('./helpers/assertRevert');

var Ownable = artifacts.require('../contracts/Ownable.sol');

const expect = require('chai').expect;

contract('Ownable', function (accounts) {
  let ownable,
  	  creator = accounts[0];
  

  before('создаем контракт единожды чтобы отслеживать состояние', async function () {
    ownable = await Ownable.new({ from: creator });
  });

  it('после создания создатель должен быть владельцем', async function () {
  	 let owner = await ownable.owners.call(creator);
	 assert.isTrue(owner === true, 'создатель должен быть владельцем');
  });

  it('после создания должен быть как минимум один владелец', async function () {
    let ownerCount = await ownable.ownerCount.call();
	assert.isAtLeast(ownerCount, 1, 'количество владельцев сразу после создания должно быть равно 1');
  });
  
  it('после зоздания должно произойти событие OwnershipTaken c параметром равным создателю', async function() {
	let events = ownable.OwnershipTaken({owner: creator}, {fromBlock: 0, toBlock: 'latest'});
	events = events.get();
	assert.equal(events.length, 1, 'при создании должно произойти событие OwnershipTaken');
  });
  
  it('единственный владелец не может отказаться от владения', async function () {
    const { logs } = await ownable.removeSelf();
    const ownerCount = await ownable.ownerCount.call();
    assert.isAtLeast(ownerCount, 1, 'должен быть хотя бы один владелец');
    const event = logs.find(e => e.event === 'OwnershipRefusalRejected');
    expect(event, 'должно было произойти событие OwnershipRefusalRejected').to.exist;
  });

  it('владелец может добавить еще одного владельца', async function () {
	    let other = accounts[1];
	    const { logs } = await ownable.removeSelf();
	    const ownerCount = await ownable.ownerCount.call();
	    assert.isAtLeast(ownerCount, 1, 'должен быть хотя бы один владелец');
	    const event = logs.find(e => e.event === 'OwnershipRefusalRejected');
	    expect(event, 'должно было произойти событие OwnershipRefusalRejected').to.exist;
	  });

/*  it('changes owner after transfer and not changes ownerCount', async function () {
    let other = accounts[1];
    await ownable.transferOwnership(other);
    let owner = await ownable.owner();

    assert.isTrue(owner === other);
  });

  it('should prevent non-owners from transfering', async function () {
    const other = accounts[2];
    const owner = await ownable.owner.call();
    assert.isTrue(owner !== other);
    try {
      await ownable.transferOwnership(other, { from: other });
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('should guard ownership against stuck state', async function () {
    let originalOwner = await ownable.owner();
    try {
      await ownable.transferOwnership(null, { from: originalOwner });
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  });*/
});
