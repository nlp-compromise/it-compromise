import test from 'tape'
import nlp from './_lib.js'
let here = '[root-match] '
nlp.verbose(false)

test('root-match:', function (t) {
  let arr = [
    // present tense
    ["agguanto", "{agguantare}"],
    ["agguanti", "{agguantare}"],
    ["agguanta", "{agguantare}"],
    ["agguantiamo", "{agguantare}"],
    ["agguantate", "{agguantare}"],
    ["agguantano", "{agguantare}"],

    // gerunds
    ["abbancando", "{abbancare}"],
    ["abbandonando", "{abbandonare}"],
    ["abbarbagliando", "{abbarbagliare}"],
  ]
  arr.forEach(function (a) {
    let [str, match] = a
    let doc = nlp(str).compute('root')
    let tags = doc.json()[0].terms.map(term => term.tags[0])
    let msg = `'${(str + "' ").padEnd(20, ' ')}  - '${tags.join(', ')}'`
    t.equal(doc.has(match), true, here + msg)
  })
  t.end()
})
