const assertRevert = require('./helpers/assertRevert');
const assertJump = require('./helpers/assertJump');
var SafeMathMock = artifacts.require('./mocks/SafeMathMock.sol');

contract('Безопасные математические операции', function (accounts) {
  let safeMath;

  before(async function () {
    safeMath = await SafeMathMock.new();
  });

  it('умножение дает верный результат', async function () {
    let a = 5678;
    let b = 1234;
    await safeMath.multiply(a, b);
    let result = await safeMath.result();
    assert.equal(result, a * b);
  });

  it('сложение дает верный результат', async function () {
    let a = 5678;
    let b = 1234;
    await safeMath.add(a, b);
    let result = await safeMath.result();

    assert.equal(result, a + b);
  });

  it('вычитание дает верный результат', async function () {
    let a = 5678;
    let b = 1234;
    await safeMath.subtract(a, b);
    let result = await safeMath.result();

    assert.equal(result, a - b);
  });

  it('если результат вычитания отрицателен, то происходит ошибка и действие отменяется', async function () {
    let a = 1234;
    let b = 5678;
    try {
      await safeMath.subtract(a, b);
      assert.fail('should have thrown before');
    } catch (error) {
      assertJump(error);
    }
  });

  it('если результат сложения больше максимально допустимого значения, то происходит ошибка и действие отменяется', async function () {
    let a = 115792089237316195423570985008687907853269984665640564039457584007913129639935;
    let b = 1;
    try {
      await safeMath.add(a, b);
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('если результат умножения больше максимально допустимого значения, то происходит ошибка и действие отменяется', async function () {
    let a = 115792089237316195423570985008687907853269984665640564039457584007913129639933;
    let b = 2;
    try {
      await safeMath.multiply(a, b);
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });
});
