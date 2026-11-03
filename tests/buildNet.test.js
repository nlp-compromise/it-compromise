import test from 'tape'
import nlp from './_lib.js'
const here = '[it-buildNet] '

test('buildNet:', function (t) {
  const matches = [
    { match: '{urlare/Verb}' },
    { match: '{scritto/Adjective}' },
    { match: '{sabbia/Noun}' },
    { match: '{insalata/Noun}' }
  ]
  const net = nlp.buildNet(matches)
  t.ok(net.hooks.urlare, here + 'urlare')
  t.ok(net.hooks.urliamo, here + ' urliamo')
  t.ok(net.hooks.sabbia, here + 'sabbia')
  t.ok(net.hooks.insalata, here + 'insalata')
  t.ok(net.hooks.insalate, here + 'insalate')
  t.ok(net.hooks.scritto, here + 'scritto')
  t.ok(net.hooks.scritti, here + 'scritti')
  t.end()
})