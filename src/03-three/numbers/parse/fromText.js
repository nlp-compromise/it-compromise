import { toCardinal, toNumber, multiples } from '../data.js'
import tokenize from './tokenize.js'

const fromText = function (terms) {
  let sum = 0
  let carry = 0
  let minus = false
  // get proper word tokens
  let str = terms.reduce((h, t) => {
    h += t.normal || ''
    return h
  }, '')
  let tokens = tokenize(str)
  // console.log(tokens)

  for (let i = 0; i < tokens.length; i += 1) {
    let w = tokens[i] || ''
    // minus eight
    if (w === 'meno') {
      minus = true
      continue
    }
    // 'huitieme'
    if (toCardinal.hasOwnProperty(w)) {
      w = toCardinal[w]
    }
    // 'cent'
    if (multiples.hasOwnProperty(w)) {
      let mult = multiples[w] || 1
      if (carry === 0) {
        carry = 1
      }
      // console.log('carry', carry, 'mult', mult, 'sum', sum)
      sum += mult * carry
      carry = 0
      continue
    }
    // 'tres'
    if (toNumber.hasOwnProperty(w)) {
      carry += toNumber[w]
    } else {
      // console.log('missing', w)
      // console.log(terms.map(t => t.text))
    }
  }
  // include any remaining
  if (carry !== 0) {
    sum += carry
  }
  if (minus === true) {
    sum *= -1
  }
  return sum
}
export default fromText