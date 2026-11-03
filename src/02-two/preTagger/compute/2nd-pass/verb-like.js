// runs before the suffix-lookup, which is too coarse for these
// infinitive with attached clitic - 'scriverlo', 'fissarla'
const cliticInfinitive = /^.{3,}(ar|er|ir)(lo|la|li|le|ne|mi|ti|si|ci|vi)$/
// long unknown -are/-ere/-ire words are usually verbs - 'autoprodurre'
const infinitive = /^.{3,}(are|ere|ire|rre)$/
// compound prefixes - 'autoprodotto' -> 'prodotto'
const prefix = /^(auto|anti|contro|inter|micro|mini|multi|neo|post|pre|pseudo|semi|sotto|sopra|super|ultra|vice|co)/

const verbLike = function (terms, i, world) {
  const setTag = world.methods.one.setTag
  const term = terms[i]
  if (term.tags.size > 0) {
    return null
  }
  // an unknown prefixed compound takes the tags of its base word
  const pre = term.normal.match(prefix)
  if (pre) {
    const base = term.normal.slice(pre[0].length)
    const lexicon = world.model.one.lexicon || {}
    if (base.length > 3 && lexicon[base] !== undefined) {
      setTag([term], lexicon[base], world, false, '2-prefix-compound')
      return true
    }
  }
  if (cliticInfinitive.test(term.normal)) {
    setTag([term], 'Infinitive', world, false, '2-clitic-infinitive')
    return true
  }
  if (infinitive.test(term.normal)) {
    setTag([term], 'Infinitive', world, false, '2-infinitive-guess')
    return true
  }
  // truncated infinitive - 'aver fatto', 'salvar la vita'
  if (/(ar|er|ir)$/.test(term.normal)) {
    const lexicon = world.model.one.lexicon || {}
    if (lexicon[term.normal + 'e'] === 'Infinitive') {
      setTag([term], 'Infinitive', world, false, '2-truncated-infinitive')
      return true
    }
  }
  return null
}
export default verbLike
