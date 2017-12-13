module.exports = function (error) {
  let errPos = error.message.search('revert');
  if (errPos === -1) {
    errPos = error.message.search('invalid opcode');
  }
  assert.isAbove(errPos, -1, 'Error containing "revert" or "invalid opcode" must be returned');
};
