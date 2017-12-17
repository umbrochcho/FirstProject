import { increaseTimeTo } from './helpers/increaseTime';

var BasicTokenMock = artifacts.require('../contracts/mocks/BasicTokenMock.sol');

const expect = require('chai').expect;

contract('Основной контракт токена AltairVR Token', function (accounts) {
  let token;
  let creator = accounts[0];
  let other = accounts[1];
  let stranger = accounts[2];
  let TokenState = { tokenSaling: 0, tokenNormal: 1 };
  let freezeStart;
  let freezeDuration = 3600;

  it('для проведения тестов необходимо минимум 3 адреса', async function () {
    assert.isAtLeast(accounts.length, 3, 'без как минимум трех аккаунтов эти тесты невозможны');
  });

  before('создаем контракт единожды чтобы отслеживать состояние', async function () {
    token = await BasicTokenMock.new(other, 100, { from: creator });
  });

  it('токен называется AltairVR token', async function () {
    let name = await token.name();
    assert.equal(name, 'AltairVR token', 'must be "AltairVR token"');
  });

  it('токен обозначается AVR', async function () {
    let symbol = await token.symbol();
    assert.equal(symbol, 'AVR', 'must be "AVR"');
  });

  it('токен может иметь до 18 знаков после запятой AVR', async function () {
    let decimals = await token.decimals();
    assert.equal(decimals, 18, 'must be 18');
  });

  it('минимальный объем токенов - 10 000 000 штук', async function () {
    let min = await token.getMinSupply();
    assert.equal(min, 10000000, 'must be 10 000 000');
  });

  it('максимальный объем токенов - 100 000 000 штук', async function () {
    let min = await token.getMaxSupply();
    assert.equal(min, 100000000, 'must be 100 000 000');
  });

  it('замораживаем 50 токенов одного из счетов на один час', async function () {
    freezeStart =  await token.getNow();
    console.log('\tзаморозка начинатеся в ' + freezeStart);
    
    let _date = freezeStart + freezeDuration;
    console.log('\tзаморозка закончится в ' + _date);
    await token.setFreeze(other, _date, 50, { from: creator });
//    assert.equal(receipt.status, 1, 'транзакция должна пройти');
//    console.log(res);
    console.log('\tна счету ' + other.toString() + ' на один час заморожено 50 токенов');
    let fc = await token.freezeCount();
    assert.equal(fc, 1, 'must be 1');
    let freezed = await token.freezed(other);
    assert.isTrue(freezed, 'must be true');
    let [ date, sum ] = await token.freezes(other);
    assert.equal(sum, 50, 'must be 50');
    assert.equal(date, _date, 'must be ' + _date);
  });

  it('в состоянии продажи токен не позволяет обмен между владельцами', async function () {
    let tokenState = await token.tokenState();
    assert.equal(tokenState, TokenState.tokenSaling, 'после создания токен находится в состоянии продажи');
    let { receipt } = await token.transfer(creator, 1, { from: other });
    assert.equal(receipt.status, 0, 'транзакция не должна пройти');
  });

  it('в состоянии продажи токен позволяет проверку баланса владельцами', async function () {
    let tokenState = await token.tokenState();
    assert.equal(tokenState, TokenState.tokenSaling, 'после создания токен находится в состоянии продажи (0)');
    let firstAccountBalance = await token.balanceOf(other);
    assert.equal(firstAccountBalance, 100);
  });

  it('в состоянии обычного функционирования токен позволяет проверку баланса владельцами', async function () {
    let tokenState = await token.tokenState();
    assert.equal(tokenState, TokenState.tokenSaling, 'после создания токен находится в состоянии продажи (0)');
    await token.doSetTokenState(TokenState.tokenNormal);
    tokenState = await token.tokenState();
    assert.equal(tokenState, TokenState.tokenNormal,
      'токен должен перейти в состояние нормального функционирования (1)');
    let firstAccountBalance = await token.balanceOf(other);
    assert.equal(firstAccountBalance, 100);
  });

  it('в состоянии паузы токен позволяет проверку баланса владельцами', async function () {
    await token.pause({ from: creator });
    let paused = await token.paused();
    assert.isTrue(paused, 'токен переведен на паузу');
    let firstAccountBalance = await token.balanceOf(other);
    assert.equal(firstAccountBalance, 100);
  });

  it('в состоянии паузы токен не позволяет обмен между владельцами', async function () {
    let paused = await token.paused();
    assert.isTrue(paused, 'токен переведен на паузу');
    let { receipt } = await token.transfer(creator, 1, { from: other });
    assert.equal(receipt.status, 0, 'транзакция не должна пройти');
  });

  it('в состоянии обычного функционирования токен позволяет обмен токенами', async function () {
    await token.unpause({ from: creator });
    let paused = await token.paused();
    assert.isFalse(paused, 'токен снят с паузы');

    let { logs } = await token.transfer(stranger, 1, { from: other });
    const event = logs.find(e => e.event === 'Transfer' && e.args.from === other &&
                            e.args.to === stranger);
    expect(event, 'должно было произойти событие Transfer').to.exist;

    let firstAccountBalance = await token.balanceOf(other);
    assert.equal(firstAccountBalance, 99);

    let secondAccountBalance = await token.balanceOf(stranger);
    assert.equal(secondAccountBalance, 1);
  });

  it('владелец замороженных средств не может передать сумму, которая уменьшит его баланс ниже суммы заморозки ', async function () {
    let { logs } = await token.transfer(stranger, 51, { from: other });
    const event = logs.find(e => e.event === 'Transfer' && e.args.from === other &&
                            e.args.to === stranger);
    expect(event, 'не должно было произойти событие Transfer').not.to.exist;
  });

  it('сдвигаем время на 1 час вперед', async function () {
    await increaseTimeTo(freezeStart + freezeDuration);
    console.log('###');
    let now = await token.getNow();
    assert.isAbove(now, freezeStart + freezeDuration);
  });

  it('если срок заморозки истек, то владелец распоряжаться всей суммой на счету', async function () {
    //    console.log('\tувеличиваем время на час')
    let now = await token.getNow();
    let [ date, sum ] = await token.freezes(other);
    assert.isAbove(now, date, 'must be greater');
    let { logs } = await token.transfer(stranger, 51, { from: other });
    const event = logs.find(e => e.event === 'Transfer' && e.args.from === other &&
                            e.args.to === stranger);
    expect(event, 'должно было произойти событие Transfer').to.exist;
    [ date, sum ] = await token.freezes(other);
    assert.equal(sum, 0, 'must be 0');
    let freezed = await token.freezed(other);
    assert.isFalse(freezed, 'must be false');
    let freezeCount = await token.freezeCount();
    assert.equal(freezeCount, 0, 'must be 0');
  });
/*  it('should throw an error when trying to transfer more than balance', async function () {
    try {
      await token.transfer(accounts[1], 101);
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('should throw an error when trying to transfer to 0x0', async function () {
    try {
      await token.transfer(0x0, 100);
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });
  */
});
