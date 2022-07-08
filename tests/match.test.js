import test from 'tape'
import nlp from './_lib.js'
let here = '[it-match] '
nlp.verbose(false)

test('match:', function (t) {
  let arr = [
    ['spencer', '#Person'],
    ['abbaruffare', '#Infinitive'],
    ["agonizzo", '#PresentTense'],
    ["agonizzi", '#PresentTense'],
    ["agonizza", '#PresentTense'],
    ["agonizziamo", '#PresentTense'],
    ["agonizzate", '#PresentTense'],
    ["agonizzano", '#PresentTense'],
    ["abbaruffare", "#Infinitive"],
    ['abbaruffato', '#PastParticiple'],
    // ['', ''],
    // ['', ''],
  ]
  arr.forEach(function (a) {
    let [str, match] = a
    let doc = nlp(str)//.compute('tagRank')
    let tags = doc.json()[0].terms.map(term => term.tags[0])
    let msg = `'${(str + "' ").padEnd(20, ' ')}  - '${tags.join(', ')}'`
    let m = doc.match(match)
    t.equal(m.text(), doc.text(), here + msg)
  })
  t.end()
})
