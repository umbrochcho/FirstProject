
const PausableMock = artifacts.require('../contracts/mocks/PausableMock.sol');

const expect = require('chai').expect;

contract('Конракт с возможностью прервать нормальное функционирование', function (accounts) {
  let pausable;
  let creator = accounts[0];
  let other = accounts[1];
  let stranger = accounts[2];

  it('для проведения тестов необходимо минимум 3 адреса', async function () {
    assert.isAtLeast(accounts.length, 3, 'без как минимум трех аккаунтов эти тесты невозможны');
  });

  before('создаем контракт единожды чтобы отслеживать состояние', async function () {
    pausable = await PausableMock.new({ from: creator });
  });

  it('контракт, не поставленый на паузу, выполняет функции с модификатором whenNotPaused', async function () {
    let count0 = await pausable.ownerCount.call();
    await pausable.addOwner(other, { from: creator });
    let count1 = await pausable.ownerCount.call();
    assert.equal(count1 - count0, 1, 'количество владельцев должно увеличиться на 1');
  });

  it('контракт, не поставленый на паузу, не выполняет функции с модификатором whenPaused', async function () {
    let { receipt } = await pausable.unpause({ from: creator });
    assert.equal(receipt.status, 0, 'транзакция не должна пройти');
  });

  it('невладелец не может поставить контракт на паузу', async function () {
    let { receipt } = await pausable.pause({ from: stranger });
    assert.equal(receipt.status, 0, 'транзакция не должна пройти');
  });

  it('владелец может поставить контракт на паузу', async function () {
    let { logs } = await pausable.pause({ from: creator });
    const paused = await pausable.paused();
    assert.isTrue(paused, 'дложно быть истинно');
    const event = logs.find(e => e.event === 'Pause' && e.args.who === creator);
    expect(event, 'должно было произойти событие Pause').to.exist;
  });

  it('контракт, поставленый на паузу, выполняет функции с модификатором whenPaused', async function () {
    let before = await pausable.drasticMeasureTaken();
    await pausable.drasticMeasure();
    let after = await pausable.drasticMeasureTaken();
    assert.equal(after - before, 1, 'счетчик должен увеличиться на 1');
  });

  it('контракт, поставленый на паузу, не выполняет функции с модификатором whenNotPaused', async function () {
    let { receipt } = await pausable.removeSelf({ from: creator });
    assert.equal(receipt.status, 0, 'транзакция не должна пройти');
  });

  it('невладелец не может снять контракт с паузы', async function () {
    let { receipt } = await pausable.unpause({ from: stranger });
    assert.equal(receipt.status, 0, 'транзакция не должна пройти');
  });

  it('владелец может снять контракт с паузы', async function () {
    let { logs } = await pausable.unpause({ from: creator });
    const paused = await pausable.paused();
    assert.isFalse(paused, 'должно быть ложно');
    const event = logs.find(e => e.event === 'Unpause' && e.args.who === creator);
    expect(event, 'должно было произойти событие Unpause').to.exist;
  });

  it('контракт, снятый с паузы, снова выполняет функции с модификатором whenNotPaused', async function () {
    let count0 = await pausable.ownerCount();
    await pausable.removeSelf({ from: other });
    let count1 = await pausable.ownerCount();
    assert.equal(count0 - count1, 1, 'количество владельцев должно уменьшиться на 1');
  });

  it('контракт, снятый с паузы, снова не выполняет функции с модификатором whenPaused', async function () {
    let { receipt } = await pausable.unpause({ from: creator });
    assert.equal(receipt.status, 0, 'транзакция не должна пройти');
  });
});
