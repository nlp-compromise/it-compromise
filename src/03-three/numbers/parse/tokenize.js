import { ends } from '../data.js'

// split 'centosessantasette' into  [ 'cento', 'sessanta', 'sette' ]
const tokenize = function (str) {
  const tokens = []
  let going = true
  while (going) {
    const found = ends.find(end => str.endsWith(end))
    if (found) {
      tokens.push(found)
      str = str.substr(0, str.length - found.length)
    } else {
      going = false
    }
  }
  if (str) {
    tokens.push(str)
  }
  // console.log(tokens)
  return tokens.filter(s => s).reverse()
}
export default tokenize