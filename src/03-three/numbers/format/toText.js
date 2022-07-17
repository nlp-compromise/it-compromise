import { data } from '../data.js'
let { ones, tens, multiples } = data
ones = [].concat(ones).reverse()
tens = [].concat(tens).reverse()
multiples = [].concat(multiples).reverse()

//turn number into an array of magnitudes, like [[5, million], [2, hundred]]
const getMagnitudes = function (num) {
  let working = num
  let have = []
  multiples.forEach(a => {
    if (num >= a[0]) {
      let howmany = Math.floor(working / a[0])
      working -= howmany * a[0]
      if (howmany) {
        have.push({
          unit: a[1],
          num: howmany,
        })
      }
    }
  })
  return have
}


const twoDigit = function (num) {
  let words = []
  // 20-90
  for (let i = 0; i < tens.length; i += 1) {
    if (tens[i][0] <= num) {
      words.push(tens[i][1])
      num -= tens[i][0]
      break
    }
  }
  if (num === 0) {
    return words
  }
  // 0-19
  for (let i = 0; i < ones.length; i += 1) {
    if (ones[i][0] <= num) {
      let w = ones[i][1]
      if (words.length > 0) {
        // 'ventuno' not 'ventiuno'
        if (w === 'uno') {
          words[0] = words[0].replace(/[ia]$/, '')
        }
        // 'ventotto' not 'ventiotto'
        if (w === 'otto') {
          words[0] = words[0].replace(/[ia]$/, '')
        }
        // 'ventitré', not 'ventitre'
        if (w === 'tre') {
          w = w.replace(/e$/, 'é')
        }
      }
      words.push(w)
      num -= ones[i][0]
      break
    }
  }
  return words
}

const toText = function (num) {
  if (num === 0) {
    return ['zero']
  }
  let words = []
  if (num < 0) {
    words.push('moins')
    num = Math.abs(num)
  }
  // handle multiples
  let found = getMagnitudes(num)
  found.forEach(obj => {
    let res = twoDigit(obj.num)
    words = words.concat(res)
    if (obj.unit !== 'one') {
      words.push(obj.unit)
    }
  })
  if (num > 0) {
    let res = twoDigit(num)
    words = words.concat(res)
  }
  return [words.join('')]
}
export default toText