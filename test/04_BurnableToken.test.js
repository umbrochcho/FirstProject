
const BurnableTokenMock = artifacts.require('./mocks/BurnableTokenMock.sol');

const expect = require('chai').expect;
const toWei = require('./helpers/wei').default;
const toEther = require('./helpers/ether').default;

contract('токен с возможностью сжигания до минимального количества токенов', function (accounts) {
  let token;
  let creator = accounts[0];
  let burnee = accounts[1];
  let burner = accounts[2];
  let TokenState = { tokenSaling: 0, tokenNormal: 1 };

  before(async function () {
    token = await BurnableTokenMock.new(burnee, 110, 10000100, { from: creator });
  });

  it('минимальный объем токенов - 10 000 000 штук', async function () {
    let min = await token.getMinSupply();
    min = toEther(min);
    assert.equal(min, 10000000, 'must be 10 000 000');
  });

  it('текущий объем токенов - 10 000 100 штук', async function () {
    let min = await token.totalSupply();
    min = toEther(min);
    assert.equal(min, 10000100, 'must be 10 000 100');
  });
  
  it('сжигать токены может только адрес, занесенный в список', async function () {
    let notBurner = await token.burners(creator);
    assert.isFalse(notBurner, 'creator not burner');
    let { logs } = await token.burn(burnee, toWei(1), { from: creator });
    const event = logs.find(e => e.event === 'Burn' && e.args.burner === creator);
    expect(event, 'не должно было произойти событие Burn').not.to.exist;
    let spl = await token.totalSupply();
    spl = toEther(spl);
    assert.equal(spl, 10000100, 'must be 10 000 100');
  });
  
  it('добавляем адрес в список сжигателей', async function () {
    let { logs } = await token.addBurner(burner);
    assert.equal(logs.length, 0);
    let _burner = await token.burners(burner);
    assert.isTrue(_burner, 'burner is burner');
  });
  
  it('сжигать токены может только с адресв, занесенного в список', async function () {
    let _burner = await token.burners(burner);
    assert.isTrue(_burner, 'burner is burner');
    let { logs } = await token.burn(burnee, toWei(1), { from: burner });
    const event = logs.find(e => e.event === 'Burn' && e.args.burnable === burnee);
    expect(event, 'не должно было произойти событие Burn').not.to.exist;
    let spl = await token.totalSupply();
    spl = toEther(spl);
    assert.equal(spl, 10000100, 'must be 10 000 100');
  });
  
  it('добавляем адрес в список сжигаемых', async function () {
    let { logs } = await token.addBurnable(burnee, { from: creator });
    assert.equal(logs.length, 0);
    let _burnee = await token.burnables(burnee);
    assert.isTrue(_burnee, 'burnee is burnee');
  });
  
  it('на балансе сжигаемого счета 110 токенов', async function () {
    let balance = await token.balanceOf(burnee);
    balance = toEther(balance);
    assert.equal(balance, 110, 'must be 110');
  });
  
  it('сжигаем один токен от имени сжигателя со счета сжигаемого', async function () {
    let _burner = await token.burners(burner);
    assert.isTrue(_burner, 'burner is burner');
    let _burnee = await token.burnables(burnee);
    assert.isTrue(_burnee, 'burnee is burnee');
    let { logs } = await token.burn(burnee, toWei(1), { from: burner });
    const event = logs.find(e => e.event === 'Burn' && e.args.burnable === burnee &&
                            e.args.burner === burner);
    expect(event, 'должно было произойти событие Burn').to.exist;
  });
  
  it('текущий объем токенов - 10 000 099 штук', async function () {
    let min = await token.totalSupply();
    min = toEther(min);
    assert.equal(min, 10000099, 'must be 10 000 100');
  });
  
  it('на балансе сжигаемого счета 109 токенов', async function () {
    let balance = await token.balanceOf(burnee);
    balance = toEther(balance);
    assert.equal(balance, 109, 'must be 109');
  });
  
  it('ставим токен на паузу', async function () {
    await token.pause({ from: creator });
    let paused = await token.paused();
    assert.isTrue(paused, 'токен переведен на паузу');
  });

  it('не удается сжечь один токен от имени сжигателя со счета сжигаемого', async function () {
    let { logs } = await token.burn(burnee, toWei(1), { from: burner });
    const event = logs.find(e => e.event === 'Burn' && e.args.burnable === burnee &&
                            e.args.burner === burner);
    expect(event, 'не должно было произойти событие Burn').not.to.exist;
  });
  
  it('текущий объем токенов - 10 000 099 штук', async function () {
    let min = await token.totalSupply();
    min = toEther(min);
    assert.equal(min, 10000099, 'must be 10 000 099');
  });
  
  it('на балансе сжигаемого счета 109 токенов', async function () {
    let balance = await token.balanceOf(burnee);
    balance = toEther(balance);
    assert.equal(balance, 109, 'must be 109');
  });
  
  it('снимаем токен с паузы', async function () {
    await token.unpause({ from: creator });
    let paused = await token.paused();
    assert.isFalse(paused, 'токен переведен на паузу');
  });

  it('сжигаем один токен от имени сжигателя со счета сжигаемого', async function () {
    let { logs } = await token.burn(burnee, toWei(1), { from: burner });
    const event = logs.find(e => e.event === 'Burn' && e.args.burnable === burnee &&
                            e.args.burner === burner);
    expect(event, 'должно было произойти событие Burn').to.exist;
  });
  
  it('текущий объем токенов - 10 000 098 штук', async function () {
    let min = await token.totalSupply();
    min = toEther(min);
    assert.equal(min, 10000098, 'must be 10 000 098');
  });
  
  it('на балансе сжигаемого счета 108 токенов', async function () {
    let balance = await token.balanceOf(burnee);
    balance = toEther(balance);
    assert.equal(balance, 108, 'must be 108');
  });
  
  it('переводим токен в состояние продажи', async function () {
    await token.doSetTokenState(TokenState.tokenSaling, { from: creator });
    let state = await token.tokenState();
    assert.equal(state, TokenState.tokenSaling, 'токен переведен в состояние продажи');
  });

  it('не удается сжечь один токен от имени сжигателя со счета сжигаемого', async function () {
    let { logs } = await token.burn(burnee, toWei(1), { from: burner });
    const event = logs.find(e => e.event === 'Burn' && e.args.burnable === burnee &&
                            e.args.burner === burner);
    expect(event, 'не должно было произойти событие Burn').not.to.exist;
  });
  
  it('текущий объем токенов - 10 000 098 штук', async function () {
    let min = await token.totalSupply();
    min = toEther(min);
    assert.equal(min, 10000098, 'must be 10 000 098');
  });
  
  it('на балансе сжигаемого счета 108 токенов', async function () {
    let balance = await token.balanceOf(burnee);
    balance = toEther(balance);
    assert.equal(balance, 108, 'must be 108');
  });
  
  it('переводим токен в состояние обычного функционирования', async function () {
    await token.doSetTokenState(TokenState.tokenNormal, { from: creator });
    let state = await token.tokenState();
    assert.equal(state, TokenState.tokenNormal, 'токен переведен в состояние обычного функционирования');
  });

  it('сжигаем один токен от имени сжигателя со счета сжигаемого', async function () {
    let { logs } = await token.burn(burnee, toWei(1), { from: burner });
    const event = logs.find(e => e.event === 'Burn' && e.args.burnable === burnee &&
                            e.args.burner === burner);
    expect(event, 'должно было произойти событие Burn').to.exist;
  });
  
  it('текущий объем токенов - 10 000 097 штук', async function () {
    let min = await token.totalSupply();
    min = toEther(min);
    assert.equal(min, 10000097, 'must be 10 000 097');
  });
  
  it('на балансе сжигаемого счета 107 токенов', async function () {
    let balance = await token.balanceOf(burnee);
    balance = toEther(balance);
    assert.equal(balance, 107, 'must be 107');
  });
  
  it('не удается сжечь со счета сжигаемого больше токенов, чем там есть', async function () {
    let { logs } = await token.burn(burnee, toWei(110), { from: burner });
    const event = logs.find(e => e.event === 'Burn' && e.args.burnable === burnee &&
                            e.args.burner === burner);
    expect(event, 'не должно было произойти событие Burn').not.to.exist;
  });
  
  it('текущий объем токенов - 10 000 097 штук', async function () {
    let min = await token.totalSupply();
    min = toEther(min);
    assert.equal(min, 10000097, 'must be 10 000 097');
  });
  
  it('на балансе сжигаемого счета 107 токенов', async function () {
    let balance = await token.balanceOf(burnee);
    balance = toEther(balance);
    assert.equal(balance, 107, 'must be 107');
  });
  
  it('пытаемся сжечь 107 токенов, чтобы сделать общее количество меньше минимального', async function () {
    let { logs } = await token.burn(burnee, toWei(107), { from: burner });
    const event = logs.find(e => e.event === 'Burn' && e.args.burnable === burnee &&
                            e.args.burner === burner && e.args.value === toWei(107));
    expect(event, 'не должно было произойти событие Burn').not.to.exist;
    const event1 = logs.find(e => e.event === 'Burn' && e.args.burnable === burnee &&
                            e.args.burner === burner);
    expect(event1, 'должно было произойти событие Burn').to.exist;
  });
  
  it('текущий объем токенов равен минимальному - 10 000 000 штук', async function () {
    let tot = await token.totalSupply();
    tot = toEther(tot);
    let min = await token.getMinSupply();
    min = toEther(min);
    assert.isTrue(min.equals(tot), 'must be 10 000 000');
  });
  
  it('на балансе сжигаемого счета 10 токенов', async function () {
    let balance = await token.balanceOf(burnee);
    balance = toEther(balance);
    assert.equal(balance, 10, 'must be 10');
  });
  
  it('не удается сжечь токены, если их общее количество достигло минимального', async function () {
    let { logs } = await token.burn(burnee, toWei(1), { from: burner });
    const event = logs.find(e => e.event === 'Burn' && e.args.burnable === burnee &&
                            e.args.burner === burner && e.args.value === toWei(1));
    expect(event, 'не должно было произойти событие Burn').not.to.exist;
  });
  
  it('текущий объем токенов - 10 000 000 штук', async function () {
    let min = await token.totalSupply();
    min = toEther(min);
    assert.equal(min, 10000000, 'must be 10 000 000');
  });
  
  it('на балансе сжигаемого счета 10 токенов', async function () {
    let balance = await token.balanceOf(burnee);
    balance = toEther(balance);
    assert.equal(balance, 10, 'must be 10');
  });
});
