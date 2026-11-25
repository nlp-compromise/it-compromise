import { parseImperative } from '../../../../01-one/lexicon/methods/verbs/imperative.js'

// an unknown word that is an imperative + its pronouns - 'dammelo', 'guardami'
const imperative = function (terms, i, world) {
  const term = terms[i]
  if (term.tags.size > 0 || term.normal.length < 5) {
    return null
  }
  const found = parseImperative(term.normal, world.model.one.lexicon || {})
  if (found) {
    world.methods.one.setTag([term], 'Imperative', world, false, '2-imperative-clitic')
    return true
  }
  return null
}
export default imperative
