import test from 'tape'
import nlp from '../../_lib.js'
const here = '[number-api] '
nlp.verbose(false)

test('number set/add with a string:', function (t) {
  const arr = [
    // [input, method, argument, output]
    ['ho tre gatti', 'set', 'otto', 'ho otto gatti'],
    ['ho tre gatti', 'set', '12', 'ho dodici gatti'],
    ['ho 3 gatti', 'set', 'otto', 'ho 8 gatti'],
    ['ho tre gatti', 'set', 8, 'ho otto gatti'],
    ['ho tre gatti', 'add', 'due', 'ho cinque gatti'],
    ['ho tre gatti', 'add', '2', 'ho cinque gatti'],
    ['ho tre gatti', 'plus', 'due', 'ho cinque gatti'],
    ['ho otto gatti', 'subtract', 'due', 'ho sei gatti'],
    ['ho otto gatti', 'minus', 'due', 'ho sei gatti'],
    ['ho otto gatti', 'subtract', 2, 'ho sei gatti'],
    // not a number - leave it alone
    ['ho tre gatti', 'set', 'gatto', 'ho tre gatti'],
    ['ho tre gatti', 'set', 'otto gatti', 'ho tre gatti'],
    ['ho tre gatti', 'set', '', 'ho tre gatti'],
    ['ho tre gatti', 'add', 'gatto', 'ho tre gatti'],
    ['ho tre gatti', 'subtract', 'gatto', 'ho tre gatti'],
  ]
  arr.forEach(a => {
    const [str, method, arg, want] = a
    const doc = nlp(str)
    doc.numbers()[method](arg)
    t.equal(doc.text(), want, here + `${method}(${JSON.stringify(arg)})`)
  })
  t.equal(nlp('ho tre gatti').numbers().set('gatto').viewType, 'Numbers', here + 'bad string keeps view')
  t.end()
})

test('number json:', function (t) {
  const doc = nlp('ho tre gatti e 5 cani')
  let json = doc.numbers().json()
  t.equal(json.length, 2, here + 'json() all')
  t.equal(json[0].number.num, 3, here + 'json() first')
  t.equal(json[1].number.num, 5, here + 'json() second')

  json = doc.numbers().json(0)
  t.equal(json.length, 1, here + 'json(0) length')
  t.equal(json[0].text, 'tre', here + 'json(0) text')
  t.equal(json[0].number.num, 3, here + 'json(0) num')

  json = doc.numbers().json(1)
  t.equal(json.length, 1, here + 'json(1) length')
  t.equal(json[0].number.num, 5, here + 'json(1) num')

  t.deepEqual(doc.numbers().json(9), [], here + 'json(9) is empty')

  json = doc.numbers().json({ offset: true })
  t.equal(json.length, 2, here + 'json(opts) length')
  t.ok(json[0].offset, here + 'json(opts) passes options through')
  t.equal(json[1].number.num, 5, here + 'json(opts) num')
  t.end()
})

test('number methods on an empty match:', function (t) {
  const m = nlp('ciao a tutti').numbers()
  t.deepEqual(m.get(), [], here + 'get()')
  t.deepEqual(m.parse(), [], here + 'parse()')
  t.deepEqual(m.json(), [], here + 'json()')
  t.deepEqual(nlp('ho tre gatti').numbers().get(4), [], here + 'get(n) out of range')
  t.deepEqual(nlp('ho tre gatti e 5 cani').numbers().get(), [3, 5], here + 'get() still works')
  t.deepEqual(nlp('ho tre gatti e 5 cani').numbers().get(1), [5], here + 'get(n) still works')
  t.end()
})
