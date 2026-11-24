/* eslint-disable no-console */
import test from 'tape'
import nlp from '../_lib.js'
const here = '[it-debug] '

// the colours that compromise's .debug() can print
const supported = ['green', 'red', 'blue', 'cyan', 'yellow', 'grey']

test('debug does not throw:', function (t) {
  const arr = ['1200 euro', 'la casa rossa è molto bella', "l'amico c'è", 'quaranta mele e il 5° giorno']
  const log = console.log
  arr.forEach(str => {
    let err = null
    console.log = () => {}
    try {
      nlp(str).debug()
    } catch (e) {
      err = e
    }
    console.log = log
    t.equal(err, null, here + str)
  })
  t.end()
})

test('tag colours are printable:', function (t) {
  nlp.addTags({ DebugTestTag: { is: 'Adjective' } })
  const tagSet = nlp.model().one.tagSet
  const bad = Object.keys(tagSet).filter(k => tagSet[k].color && !supported.includes(tagSet[k].color))
  t.deepEqual(bad, [], here + 'no unsupported colours')
  t.ok(supported.includes(tagSet.Adjective.color), here + 'adjective colour')
  t.ok(supported.includes(tagSet.DebugTestTag.color), here + 'user-added tag colour')
  t.end()
})
