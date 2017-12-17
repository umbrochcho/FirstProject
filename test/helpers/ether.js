export default function toEther (n) {
  return new web3.BigNumber(web3.fromWei(n, 'ether'));
}
