import test from 'tape'
import nlp from '../../_lib.js'
const here = '[verb-api] '

test('verb methods on an empty match:', function (t) {
  const m = nlp('la casa rossa').match('foo').verbs()
  t.deepEqual(m.parse(), [], here + 'parse()')
  t.deepEqual(m.conjugate(), [], here + 'conjugate()')
  t.deepEqual(m.json(), [], here + 'json()')
  t.equal(nlp('il ragazzo mangia la mela').verbs().parse().length, 1, here + 'parse() still works')
  t.end()
})

test('no dead tense aliases:', function (t) {
  const vb = nlp('il ragazzo mangia la mela').verbs()
  const arr = ['toPast', 'toPresent', 'toFuture']
  arr.forEach(k => {
    t.equal(k in vb, false, here + k)
  })
  t.end()
})
