const assertRevert = require('./helpers/assertRevert');
const toEther = require('./helpers/ether');

var BasicTokenMock = artifacts.require('../contracts/mocks/BasicTokenMock.sol');

contract('Основной контракт токена AltairVR Token', function (accounts) {
  let token;
  let creator = accounts[0];
  let other = accounts[1];
  let stranger = accounts[2];

  it('для проведения тестов необходимо минимум 3 адреса', async function () {
    assert.isAtLeast(accounts.length, 3, 'без как минимум трех аккаунтов эти тесты невозможны');
  });

  before('создаем контракт единожды чтобы отслеживать состояние', async function () {
    token = await BasicTokenMock.new(other, 100, { from: creator });
  });

  it('should return the correct totalSupply after construction', async function () {
    let totalSupply = await token.totalSupply();

    assert.equal(totalSupply, 100);
  });

  it('should return correct balances after transfer', async function () {
    await token.transfer(stranger, 100, { from: other });

    let firstAccountBalance = await token.balanceOf(other);
    assert.equal(firstAccountBalance, 0);

    let secondAccountBalance = await token.balanceOf(stranger);
    assert.equal(secondAccountBalance, 100);
  });

  it('should throw an error when trying to transfer more than balance', async function () {
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
});
