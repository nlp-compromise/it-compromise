import nlp from 'compromise/one'
import tokenize from './01-one/tokenize/plugin.js'
import version from './_version.js'
import lexicon from './01-one/lexicon/plugin.js'
import tagset from './01-one/tagset/plugin.js'
import preTagger from './02-two/preTagger/plugin.js'
import postTagger from './02-two/postTagger/plugin.js'
import verbs from './03-three/verbs/plugin.js'

nlp.plugin(tokenize)
nlp.plugin(tagset)
nlp.plugin(lexicon)
nlp.plugin(preTagger)
nlp.plugin(postTagger)
nlp.plugin(verbs)

const it = function (txt, lex) {
  let doc = nlp(txt, lex)
  return doc
}

it.world = function () {
  return nlp.world()
}
it.model = function () {
  return nlp.model()
}
it.methods = function () {
  return nlp.methods()
}
it.tokenize = function () {
  return nlp.tokenize()
}
it.plugin = function () {
  return nlp.plugin()
}
it.extend = function () {
  return nlp.extend()
}


/** log the decision-making to console */
it.verbose = function (set) {
  let env = typeof process === 'undefined' ? self.env || {} : process.env //use window, in browser
  env.DEBUG_TAGS = set === 'tagger' || set === true ? true : ''
  env.DEBUG_MATCH = set === 'match' || set === true ? true : ''
  env.DEBUG_CHUNKS = set === 'chunker' || set === true ? true : ''
  return this
}
it.version = version

export default it