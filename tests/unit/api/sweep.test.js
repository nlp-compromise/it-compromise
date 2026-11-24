import test from 'tape'
import nlp from '../../_lib.js'
const here = '[it-sweep] '
nlp.verbose(false)

test('sweep:', function (t) {
  const net = nlp.buildNet([
    { match: 'gelato', tag: 'Food' },
    { match: 'la pizza', tag: 'Food' },
  ])
  const doc = nlp('Mi piace il gelato e la pizza. Il gatto dorme.')
  const res = doc.sweep(net)
  t.deepEqual(res.view.out('array'), ['gelato', 'la pizza.'], here + 'view has both matches')
  t.equal(res.found.length, 2, here + 'two results')
  t.equal(res.found[0].match, 'gelato', here + 'first result')
  t.equal(doc.match('#Food+').length, 2, here + 'tags were applied')
  t.equal(doc.has('gatto #Food'), false, here + 'nothing else tagged')
  // no matches
  const none = nlp('il gatto dorme').sweep(net)
  t.equal(none.view.found, false, here + 'empty view')
  t.deepEqual(none.found, [], here + 'empty found')
  t.end()
})

test('sweep without tagging:', function (t) {
  const net = nlp.buildNet([{ match: 'gelato', tag: 'Food' }])
  const doc = nlp('mi piace il gelato')
  const res = doc.sweep(net, { tagger: false })
  t.equal(res.view.text(), 'gelato', here + 'tagger:false still matches')
  t.equal(doc.has('#Food'), false, here + 'tagger:false does not tag')
  doc.sweep(net)
  t.equal(doc.match('#Food').text(), 'gelato', here + 'tags by default')
  t.end()
})

test('sweep with roots:', function (t) {
  const net = nlp.buildNet([{ match: '{urlare/Verb}' }, { match: '{insalata/Noun}' }])
  const arr = [
    ['ieri urlavamo forte', 'urlavamo'],
    ['noi urliamo sempre', 'urliamo'],
    ['due insalate per favore', 'insalate'],
    ['una insalata per favore', 'insalata'],
  ]
  arr.forEach(a => {
    const [str, want] = a
    t.equal(nlp(str).sweep(net).view.text(), want, here + str)
  })
  t.end()
})

test('buildTrie + lookup:', function (t) {
  const trie = nlp.buildTrie(['gelato', 'mi piace', 'non presente'])
  const doc = nlp('Mi piace il gelato. Anche il GELATO al limone!')
  t.deepEqual(doc.lookup(trie).out('array'), ['Mi piace', 'gelato.', 'GELATO'], here + 'lookup')
  t.equal(nlp('il gatto dorme').lookup(trie).found, false, here + 'lookup finds nothing')
  t.end()
})

test('parseMatch:', function (t) {
  const regs = nlp.parseMatch('#Noun+ (il|la)? gatto')
  t.equal(regs.length, 3, here + 'three tokens')
  t.equal(regs[0].tag, 'Noun', here + 'tag')
  t.equal(regs[0].greedy, true, here + 'greedy')
  t.equal(regs[1].optional, true, here + 'optional')
  t.equal(regs[2].word, 'gatto', here + 'word')
  // a parsed match can be re-used
  t.equal(nlp('vedo il gatto').match(nlp.parseMatch('il gatto')).text(), 'il gatto', here + 'use parsed match')
  t.end()
})
