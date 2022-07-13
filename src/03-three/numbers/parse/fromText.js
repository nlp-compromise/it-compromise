import { data, toCardinal } from '../data.js'

let ends = ['cento', 'mille', 'milione']
data.ones.forEach(a => {
  ends.push(a[1])
})
data.tens.forEach(a => {
  ends.push(a[1])
})
// sort by length (longest first)
ends = ends.sort((a, b) => {
  if (a.length > b.length) {
    return -1
  } else if (a.length < b.length) {
    return 1
  }
  return 0
})

const tokenize = function (str) {
  let tokens = []
  let going = true
  while (going) {
    let found = ends.find(end => str.endsWith(end))
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
  return tokens.filter(s => s).reverse()
}

const fromText = function (terms) {
  console.log(terms)
  let str = terms.reduce((h, t) => {
    h += t.normal || ''
    return h
  }, '')
  let tokens = tokenize(str)
  console.log(tokens)
  return 0
}
export default fromText