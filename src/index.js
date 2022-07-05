// import nlp from 'compromise/one'
import nlp from 'compromise/one'
import tokenize from './tokenize/plugin.js'
import version from './_version.js'

nlp.plugin(tokenize)


const it = function (txt, lex) {
  let doc = nlp(txt, lex)
  return doc
}

it.world = nlp.world
it.model = nlp.model
it.methods = nlp.methods
it.tokenize = nlp.tokenize
it.plugin = nlp.plugin
it.extend = nlp.extend


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