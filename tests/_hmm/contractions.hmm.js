import test from 'tape'
import nlp from '../_lib.js'
const here = '[it-contractions-hmm] '

test('expand elided question words:', function (t) {
  const arr = [
    [`dov'è il gatto?`, 'dove è il gatto?'],
    [`com'è il tempo?`, 'come è il tempo?'],
    [`cos'è questo?`, 'cosa è questo?'],
  ]
  arr.forEach(a => {
    const [str, want] = a
    const doc = nlp(str)
    doc.contractions().expand()
    t.equal(doc.text(), want, here + str)
  })
  t.end()
})
