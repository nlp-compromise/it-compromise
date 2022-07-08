const toFem = function (str) {
  str = str.replace(/o$/, 'a')
  return str
}
export default toFem