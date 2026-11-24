import test from 'tape'
import nlp from '../../_lib.js'
const here = '[noun-singular] '
nlp.verbose(false)

test('nouns toSingular:', function (t) {
  const arr = [
    ['i ragazzi mangiano le mele rosse', 'i ragazzo mangiano le mela rosse'],
    ['le mele', 'le mela'],
    ['i gatti e i cani', 'i gatto e i cane'],
    // already singular
    ['la mela', 'la mela'],
    ['il ragazzo mangia la mela', 'il ragazzo mangia la mela'],
  ]
  arr.forEach(a => {
    const [str, want] = a
    const doc = nlp(str)
    doc.nouns().toSingular()
    t.equal(doc.text(), want, here + str)
  })
  t.end()
})

test('toSingular agrees with conjugate:', function (t) {
  const arr = ['i ragazzi mangiano le mele rosse', 'i gatti e i cani', 'le case']
  arr.forEach(str => {
    const want = nlp(str).nouns().conjugate().map(o => o.singular)
    const doc = nlp(str)
    doc.nouns().toSingular()
    const have = doc.nouns().out('array')
    t.deepEqual(have, want, here + str)
  })
  t.end()
})
