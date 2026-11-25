import test from 'tape'
import nlp from '../_lib.js'
import list from '../unit/nouns/_audit.js'
const here = '[it-noun-audit-hmm] '

// phrases marked with a '*' in _audit.js - they inflect properly as bare words, but not after their article,
// because the tagger does not find the noun.
//  - none are parked right now: 'le stazioni', 'lo sbaglio', "l'ora", 'gli dei' are tested in tests/unit/nouns/singular-audit.test.js
//  - a noun that is also a verb-form, and that postTagger/article-clitic.js does not know, belongs here - with its reason
test('noun audit, tagging:', function (t) {
  list.forEach((o) => {
    const want = [{ singular: o.singular.noun, plural: o.plural.noun }]
    ;[o.singular, o.plural].filter((p) => p.hmm).forEach((p) => {
      t.deepEqual(nlp(p.str).nouns().conjugate(), want, here + p.str)
    })
  })
  t.end()
})
