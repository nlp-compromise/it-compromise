import test from 'tape'
import nlp from '../_lib.js'
const here = '[it-numbers-hmm] '

// in italian the comma is the decimal separator, and the period groups thousands
test('decimal comma:', function (t) {
  const arr = [
    ['costa 3,50 euro', 3.5],
    ['circa 2,5 chili', 2.5],
    ['costa 1.000 euro', 1000],
    ['costa 1.234,56 euro', 1234.56],
    ['25.000 abitanti', 25000],
    ['tre virgola cinque', 3.5],
  ]
  arr.forEach(a => {
    const [str, want] = a
    t.deepEqual(nlp(str).numbers().get(), [want], here + str)
  })
  t.end()
})

test('negative numbers:', function (t) {
  t.deepEqual(nlp('-5 gradi').numbers().get(), [-5], here + '-5')
  t.deepEqual(nlp('meno 5 gradi').numbers().get(), [-5], here + 'meno 5')
  t.end()
})
