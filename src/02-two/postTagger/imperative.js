import { parseImperative, fromImperative } from '../../01-one/lexicon/methods/verbs/imperative.js'

// imperatives that look like something else
const persons = ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
// 'dagli il libro' - give him the book
const daForms = new Set(['dagli', 'dalle', 'dallo', 'dalla'])
const afterDa = new Set(['il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'a', 'subito', 'tu', 'tutto', 'questo', 'questa'])

const isInfinitive = function (str, lexicon) {
  const tags = Object.prototype.hasOwnProperty.call(lexicon, str) ? lexicon[str] : null
  return tags === 'Infinitive' || (Array.isArray(tags) && tags.includes('Infinitive'))
}

const tagImperatives = function (doc) {
  const world = doc.world
  const { setTag, unTag } = world.methods.one
  const lexicon = world.model.one.lexicon
  const tag = function (term, reason) {
    persons.concat(['PastParticiple', 'PastTense']).forEach((t) => unTag([term], t, world.model.one.tagSet))
    term.tags.clear()
    setTag([term], 'Imperative', world, false, reason)
  }
  doc.docs.forEach((terms) => {
    const term = terms[0]
    const next = terms[1]
    if (!term || term.implicit !== undefined) {
      return
    }
    const str = term.normal
    if (term.tags.has('Imperative')) {
      return
    }
    // 'dagli il libro', 'dalle un bacio'
    if (daForms.has(str) && next && afterDa.has(next.normal)) {
      tag(term, 'da-imperative')
      return
    }
    // 'fermati!', 'alzati subito' - also the plural participles of these verbs
    if (/[aie]ti$/.test(str) && (term.tags.has('PastParticiple') || !term.tags.has('Verb'))) {
      const found = parseImperative(str, lexicon)
      const isObject = next && (next.tags.has('Determiner') || next.tags.has('Noun'))
      if (found && found.clitic === 'ti' && !isObject) {
        tag(term, 'reflexive-imperative')
        return
      }
    }
    // 'Mangia la pasta!', 'Andiamo!' - a present-tense form, in an exclamation
    const last = terms[terms.length - 1]
    if (/!/.test(last.post) && term.tags.has('PresentTense') && !term.tags.has('Auxiliary') && !term.tags.has('Infinitive')) {
      const root = fromImperative(str, (inf) => isInfinitive(inf, lexicon))
      if (root) {
        tag(term, 'exclamation-imperative')
      }
    }
  })
}
export default tagImperatives
