import test from 'tape'
import nlp from '../_lib.js'
let here = '[number-parse] '
nlp.verbose(false)

let arr = [
  [0, 'zero'],
  [1, 'uno'],
  [2, 'due'],
  [3, 'tre'],
  [4, 'quattro'],
  [5, 'cinque'],
  [6, 'sei'],
  [7, 'sette'],
  [8, 'otto'],
  [9, 'nove'],
  [10, 'dieci'],
  [11, 'undici'],
  [12, 'dodici'],
  [13, 'tredici'],
  [14, 'quattordici'],
  [15, 'quindici'],
  [16, 'sedici'],
  [17, 'diciassette'],
  [18, 'diciotto'],
  [19, 'diciannove'],
  [20, 'venti'],
  [21, 'ventuno'],
  [22, 'ventidue'],
  [23, 'ventitré'],
  [24, 'ventiquattro'],
  [25, 'venticinque'],
  [26, 'ventisei'],
  [27, 'ventisette'],
  [28, 'ventotto'],
  [29, 'ventinove'],
  [30, 'trenta'],
  [31, 'trentuno'],
  [32, 'trentadue'],
  [33, 'trentatré'],
  [34, 'trentaquattro'],
  [35, 'trentacinque'],
  [36, 'trentasei'],
  [37, 'trentasette'],
  [38, 'trentotto'],
  [39, 'trentanove'],
  [40, 'quaranta'],
  [41, 'quarantuno'],
  [43, 'quarantatré'],
  [50, 'cinquanta'],
  [51, 'cinquantuno'],
  [52, 'cinquantadue'],
  [53, 'cinquantatré'],
  [54, 'cinquantaquattro'],
  [55, 'cinquantacinque'],
  [56, 'cinquantasei'],
  [57, 'cinquantasette'],
  [58, 'cinquantotto'],
  [59, 'cinquantanove'],
  [60, 'sessanta'],
  [61, 'sessantuno'],
  [68, 'sessantotto'],
  [70, 'settanta'],
  [71, 'settantuno'],
  [72, 'settantadue'],
  [80, 'ottanta'],
  [81, 'ottantuno'],
  [82, 'ottantadue'],
  [85, 'ottantacinque'],
  [90, 'novanta'],
  [91, 'novantuno'],
  [97, 'novantasette'],
  [100, 'cento'],
  [107, 'centosette'],
  [117, 'centodiciassette'],
  [167, 'centosessantasette'],
  [200, 'duecento'],
  [1000, 'mille'],
  [1067, 'millesessantasette'],
  [1252, 'milleduecentocinquantadue'],
  [2000, 'duemila'],
  [3000, 'tremila'],
  [10000, 'diecimila'],
  [100000, 'centomila'],
  [1000000, 'milione'],
  // [000, 'milioni'],
  [1000000000, 'miliardo'],

  // quartoquarto
  // $1 milion
]
test('number-tag:', function (t) {
  arr.forEach(a => {
    let str = a[1]
    let doc = nlp(str)
    let m = doc.numbers()
    t.equal(m.found, true, here + '[findNumber] ' + str)
  })
  t.end()
})

test('number-parse:', function (t) {
  arr.forEach(a => {
    let [want, str] = a
    let doc = nlp(str)
    let n = doc.numbers().get()[0]
    t.equal(n, want, here + '[toNumber] ' + str)
  })
  t.end()
})

test('number-create:', function (t) {
  arr.forEach(a => {
    let [num, str] = a
    let doc = nlp(String(num))
    doc.numbers().toText()
    t.equal(doc.text(), str, here + '[toText] ' + num)
  })
  t.end()
})


test('misc:', function (t) {
  let doc = nlp('342').numbers().toOrdinal()
  t.equal(doc.text(), '342°', here + 'num-ord')

  doc = nlp('trecentosettanta').numbers().toNumber().toOrdinal()
  t.equal(doc.text(), '370°', here + 'num-word-ord')
  t.end()
})

