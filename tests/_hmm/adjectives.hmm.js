import test from 'tape'
import nlp from '../_lib.js'
const here = '[it-adjectives-hmm] '

test('adjectives conjugate:', function (t) {
  const arr = [
    // -co after a consonant, or stressed on the second-last syllable, keeps the hard sound
    ['antico', 'antica', 'antichi', 'antiche'],
    // -io with a stressed i keeps both
    ['pio', 'pia', 'pii', 'pie'],
    // invariable colours
    ['rosa', 'rosa', 'rosa', 'rosa'],
    ['viola', 'viola', 'viola', 'viola'],
  ]
  arr.forEach(a => {
    const [male, female, plural, femalePlural] = a
    const res = nlp('è ' + male).adjectives().conjugate()
    t.deepEqual(res, [{ male, female, plural, femalePlural }], here + male)
  })
  t.end()
})
