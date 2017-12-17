
const MintableTokenMock = artifacts.require('../contracts/mocks/MintableTokenMock.sol');

const expect = require('chai').expect;
const toWei = require('./helpers/wei').default;
const toEther = require('./helpers/ether').default;

contract('контракт с возможностью чеканить токены до определенного количества', function (accounts) {
  let token;
  const investor = accounts[1];

  before(async function () {
    token = await MintableTokenMock.new();
  });

  it('максимальное количество токенов равно 100 000 000', async function () {
    let max = await token.getMaxSupply();
    max = toEther(max);
    assert.equal(max, 100000000, 'must be 100 000 000');
  });

  it('в начале общее количество токенов должно быть равно 0', async function () {
    let totalSupply = await token.totalSupply();

    assert.equal(totalSupply, 0, 'must be 0');
  });

  it('в начале чеканка не разрешена', async function () {
    let minting = await token.minting();

    assert.isFalse(minting, 'must be false');
  });

  it('пытаемся отчеканить 50 000 000 токенов. Неудачно.', async function () {
    let { logs } = await token.doMint(investor, toWei(50000000));
    const event = logs.find(e => e.event === 'Mint' && e.args.to === investor &&
                            e.args.amount === toWei(50000000));
    expect(event, 'не должно было произойти событие Mint').not.to.exist;
  });

  it('общее количество токенов равно 0', async function () {
    let totalSupply = await token.totalSupply();

    assert.equal(totalSupply, 0, 'must be 0');
  });

  it('баланс инвестора равен 0', async function () {
    let balance = await token.balanceOf(investor);
    balance = toEther(balance);
    assert.equal(balance, 0, 'must be 0');
  });

  it('разрешаем чеканку', async function () {
    let { logs } = await token.doEnableMinting();
    const event = logs.find(e => e.event === 'MintingStarted');
    expect(event, 'не должно было произойти событие MintingStarted').to.exist;

    let minting = await token.minting();
    assert.isTrue(minting, 'must be true');
  });
  
  it('пытаемся отчеканить 50 000 000 токенов. Удачно.', async function () {
    let { logs } = await token.doMint(investor, toWei(50000000));
    const event = logs.find(e => e.event === 'Mint' && e.args.to === investor &&
                            e.args.amount.equals(toWei(50000000)));
    expect(event, 'должно было произойти событие Mint').to.exist;
  });
  
  it('общее количество токенов равно 50 000 000', async function () {
    let totalSupply = await token.totalSupply();
    totalSupply = toEther(totalSupply);
    assert.equal(totalSupply, 50000000, 'must be 50 000 000');
  });
  
  it('баланс инвестора равен 50 000 000', async function () {
    let balance = await token.balanceOf(investor);
    balance = toEther(balance);
    assert.equal(balance, 50000000, 'must be 50 000 000');
  });
  
  it('пытаемся отчеканить еще 50 000 001 токенов и превысить максимальное количество. Чеканится 50 000 000.',
    async function () {
      let { logs } = await token.doMint(investor, toWei(50000001));
      const event = logs.find(e => e.event === 'Mint' && e.args.to === investor &&
                              e.args.amount.equals(toWei(50000001)));
      expect(event, 'не должно было произойти событие Mint').not.to.exist;
      const event1 = logs.find(e => e.event === 'Mint' && e.args.to === investor &&
                              e.args.amount.equals(toWei(50000000)));
      expect(event1, 'должно было произойти событие Mint').to.exist;
    });
  
  it('общее количество токенов равно 100 000 000', async function () {
    let totalSupply = await token.totalSupply();
    totalSupply = toEther(totalSupply);
    assert.equal(totalSupply, 100000000, 'must be 100 000 000');
  });
  
  it('баланс инвестора равен 100 000 000', async function () {
    let balance = await token.balanceOf(investor);
    balance = toEther(balance);
    assert.equal(balance, 100000000, 'must be 100 000 000');
  });
  
  it('дальнейшая чеканка запрещена', async function () {
    let minting = await token.minting();

    assert.isFalse(minting, 'must be false');
  });
});
