import nlp from './_lib.js'
import { europeanNumbers, lazy, misc, clauses, topics, redact } from 'compromise/shared'
import tokenize from './01-one/tokenize/plugin.js'
import version from './_version.js'
import lexicon from './01-one/lexicon/plugin.js'
import tagset from './01-one/tagset/plugin.js'
import preTagger from './02-two/preTagger/plugin.js'
import postTagger from './02-two/postTagger/plugin.js'
import verbs from './03-three/verbs/plugin.js'
import numbers from './03-three/numbers/plugin.js'
import adjectives from './03-three/adjectives/plugin.js'
import nouns from './03-three/nouns/plugin.js'
import contractions from './03-three/contractions/plugin.js'
import clauseRules from './03-three/clauses/plugin.js'

nlp.plugin(tokenize)
nlp.plugin(tagset)
nlp.plugin(lexicon)
nlp.plugin(preTagger)
// tags '1.234,56' and '5,30€' from their raw text
nlp.plugin(europeanNumbers)
nlp.plugin(postTagger)
nlp.plugin(verbs)
nlp.plugin(numbers)
nlp.plugin(adjectives)
nlp.plugin(nouns)
nlp.plugin(contractions)

// language-neutral plugins, shared with compromise
nlp.plugin(lazy) // nlp.lazy() - only tags the sentences that may match
nlp.plugin(misc) // .parentheses(), .quotations(), .acronyms(), .emails() ...
nlp.plugin(clauses) // .clauses() - split on punctuation, and our rules below
nlp.plugin(clauseRules)
nlp.plugin(topics) // .people(), .places(), .organizations(), .topics()
nlp.plugin(redact) // .redact()

const it = function (txt, lex) {
  return nlp(txt, lex)
}

// copy constructor methods over
Object.keys(nlp).forEach(k => {
  if (nlp.hasOwnProperty(k)) {
    it[k] = nlp[k]
  }
})

// this one is hidden
Object.defineProperty(it, '_world', {
  value: nlp._world,
  writable: true,
})

/** log the decision-making to console */
it.verbose = function (set) {
  const env = typeof process === 'undefined' ? self.env || {} : process.env //use window, in browser
  env.DEBUG_TAGS = set === 'tagger' || set === true ? true : ''
  env.DEBUG_MATCH = set === 'match' || set === true ? true : ''
  env.DEBUG_CHUNKS = set === 'chunker' || set === true ? true : ''
  return this
}
it.version = version

export default it