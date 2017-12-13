
const assertRevert = require('./helpers/assertRevert');

var Ownable = artifacts.require('../contracts/Ownable.sol');

const expect = require('chai').expect;

contract('Ownable', function (accounts) {
  let ownable;
  let creator = accounts[0];

  it('для проведения тестов необходимо минимум 2 адреса', async function () {
    assert.isAtLeast(accounts.length, 2, 'без как минимум двух аккаунтов эти тесты невозможны');
  });

  before('создаем контракт единожды чтобы отслеживать состояние', async function () {
    ownable = await Ownable.new({ from: creator });
  });

  it('после создания создатель должен быть владельцем', async function () {
    let owner = await ownable.owners(creator);
    assert.isTrue(owner === true, 'создатель должен быть владельцем');
  });

  it('после создания должен быть как минимум один владелец', async function () {
    let ownerCount = await ownable.ownerCount();
    assert.isAtLeast(ownerCount, 1, 'количество владельцев сразу после создания должно быть равно 1');
  });
  
  it('единственный владелец не может отказаться от владения', async function () {
    const { logs } = await ownable.removeSelf();
    const ownerCount = await ownable.ownerCount();
    assert.isAtLeast(ownerCount, 1, 'должен быть хотя бы один владелец');
    const event = logs.find(e => e.event === 'OwnershipRefusalRejected');
    expect(event, 'должно было произойти событие OwnershipRefusalRejected').to.exist;
  });

  it('владелец может добавить еще одного владельца', async function () {
    let other = accounts[1];
    let ownerCount = await ownable.ownerCount();
    const { logs } = await ownable.addOwner(other, { from: creator });
    let newOwnerCount = await ownable.ownerCount();
    let otherOwner = await ownable.owners(other);
    assert.equal(newOwnerCount - ownerCount, 1, 'количество владельцев не должно изменяться');
    assert.isTrue(otherOwner, 'добавленный адрес должен стать владельцем');
    const event = logs.find(e => e.event === 'OwnershipTaken' && e.args.owner === other);
    expect(event, 'должно было произойти событие OwnershipTaken в котором owner равен новому владельцу').to.exist;
  });

  it('владелец может отказаться от владения, если владельцев больше, чем один', async function () {
    let ownerCount = await ownable.ownerCount();
    const { logs } = await ownable.removeSelf({ from: creator });
    let newOwnerCount = await ownable.ownerCount();
    let notOwner = await ownable.owners(creator);
    assert.equal(ownerCount - newOwnerCount, 1, 'количество владельцев должно уменьшиться на 1');
    assert.isAtLeast(newOwnerCount, 1, 'всегда должен быть минимум один владелец');
    assert.isFalse(notOwner, 'отказавшийся от владения владелец - не владелец');
    const event = logs.find(e => e.event === 'OwnershipCeased' && e.args.owner === creator);
    expect(event, 'должно было произойти событие OwnershipCeased в котором owner равен создателю').to.exist;
  });

  it('невладельцы не могут выполнить функцию с модификатором onlyOwner', async function () {
    const currentOwner = accounts[1];
    const isOwner = await ownable.owners(currentOwner);
    assert.isTrue(isOwner, 'на данный момент accounts[1] должен быть владельцем');
    const other = creator;
    const prevOwner = await ownable.owners(other);
    assert.isFalse(prevOwner, 'на данный момент accounts[0] не должен быть владельцем');
    try {
      await ownable.transferOwnership(other, { from: other });
      assert.fail('мы никогда не должны видеть этот текст');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('владелец может передать владение и перестать быть владельцем', async function () {
    let owner = accounts[1];
    let isOwner = await ownable.owners(owner);
    let other = creator;
    let notOwner = await ownable.owners(other);
    
    assert.isTrue(isOwner, 'на данный момент accounts[1] должен быть владельцем');
    assert.isFalse(notOwner, 'на данный момент accounts[0] не должен быть владельцем');
    const { logs } = await ownable.transferOwnership(other, { from: owner });

    const event = logs.find(e => e.event === 'OwnershipTransferred' &&
                                 e.args.previousOwner === owner &&
                                 e.args.newOwner === other);
    expect(event,
      'должно было произойти событие OwnershipTransferred в котором владение переходит от accounts[1] к accounts[0]'
    ).to.exist;

    isOwner = await ownable.owners(other);
    notOwner = await ownable.owners(owner);
    assert.isTrue(isOwner, 'на данный момент accounts[0] должен быть владельцем');
    assert.isFalse(notOwner, 'на данный момент accounts[1] не должен быть владельцем');
  });
});
