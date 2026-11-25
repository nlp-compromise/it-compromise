import test from 'tape'
import nlp from '../_lib.js'
const here = '[it-nouns-hmm] '

test('nouns conjugate, from plural:', function (t) {
  const arr = [
    // a tagging miss, not an inflection one - 'medici' is tagged as an #Adjective
    ['i medici', 'medico', 'medici'],
  ]
  arr.forEach(a => {
    const [str, singular, plural] = a
    const o = nlp(str).nouns().conjugate()[0] || {}
    t.deepEqual({ singular: o.singular, plural: o.plural }, { singular, plural }, here + str)
  })
  t.end()
})
