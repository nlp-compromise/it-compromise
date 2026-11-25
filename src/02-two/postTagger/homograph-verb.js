// many verb-forms are also a noun or an adjective - 'cucina', 'porto', 'gioco', 'vive', 'sale'
// and the lexicon gives them to the noun.
// when a sentence has no verb at all, look for one of these, in a place where a verb goes.

const subjects = new Set(['io', 'tu', 'lui', 'lei', 'egli', 'ella', 'noi', 'voi', 'loro'])
// 'non [vive]', 'mi [porto]', 'dove [vivi]'
const before = new Set([
  'non', 'mi', 'ti', 'si', 'ci', 'vi', 'ne', 'dove', 'come', 'quando', 'perché', 'cosa', 'chi', 'quanto', 'anche',
  'sempre', 'spesso', 'oggi', 'domani', 'ora', 'adesso', 'qui',
])
// 'di giorno', 'di solito'
const diWords = new Set(['giorno', 'notte', 'sera', 'mattina', 'pomeriggio', 'solito', 'più', 'meno', 'rado', 'nuovo', 'corsa', 'fretta'])
const joins = new Set(['e', 'o', 'ma', 'poi'])
const tenses = { present: 'PresentTense', imperfect: 'ImperfectVerb', future: 'FutureTense' }
const persons = {
  first: 'FirstPerson',
  second: 'SecondPerson',
  third: 'ThirdPerson',
  firstPlural: 'FirstPersonPlural',
  secondPlural: 'SecondPersonPlural',
  thirdPlural: 'ThirdPersonPlural',
}
const nonFinite = ['Infinitive', 'Gerund', 'PastParticiple', 'PresentParticiple']

const isInfinitive = function (str, lexicon) {
  const tags = Object.prototype.hasOwnProperty.call(lexicon, str) ? lexicon[str] : null
  return tags === 'Infinitive' || (Array.isArray(tags) && tags.includes('Infinitive'))
}
const isFinite = (term) => term.tags.has('Verb') && term.tags.size > 1 && !nonFinite.some((tag) => term.tags.has(tag))
const isNoun = (term) => Boolean(term) && term.tags.has('Noun') && !term.tags.has('Pronoun')
// something that a verb can lead into - 'porto [il] libro', 'gioco [a] calcio', 'vive [qui]'
const isObject = function (term) {
  return Boolean(term) && (term.tags.has('Determiner') || term.tags.has('Preposition') || term.tags.has('Adverb') || term.tags.has('Value'))
}

const homographVerbs = function (doc) {
  const world = doc.world
  const lexicon = world.model.one.lexicon
  const verb = world.methods.two.transform.verb
  const isVerb = (inf) => isInfinitive(inf, lexicon)
  const lookup = function (term) {
    // a verb with no tense is only a guess - 'non [mente]'
    const isGuess = term.tags.has('Verb') && term.tags.size === 1
    if (term.implicit !== undefined || !(isGuess || term.tags.has('Noun') || term.tags.has('Adjective'))) {
      return null
    }
    if (term.tags.has('Verb') && !isGuess) {
      return null
    }
    if (term.tags.has('Pronoun') || term.normal.length < 3) {
      return null
    }
    return verb.lookup(term.normal, { isVerb, known: true, tenses: Object.keys(tenses) })
  }
  const tag = function (term, hit, reason) {
    term.tags.clear()
    world.methods.one.setTag([term], ['Verb', tenses[hit.tense], persons[hit.person]], world, false, reason)
  }
  doc.docs.forEach((terms) => {
    if (terms.some(isFinite)) {
      return
    }
    let person = null
    for (let i = 0; i < terms.length; i += 1) {
      const term = terms[i]
      const prev = terms[i - 1]
      const next = terms[i + 1]
      const found = lookup(term)
      if (!found) {
        continue
      }
      // one more verb, for the same subject - 'lavoro di giorno e [studio] di notte'
      if (person !== null) {
        const hit = found.hits.find((o) => o.person === person)
        if (hit && prev && joins.has(prev.normal)) {
          tag(term, hit, 'homograph-verb-and')
        }
        continue
      }
      let hit = null
      if (!prev) {
        // 'Porto il libro.', 'Gioco a calcio.'
        // .. but 'Lavoro di squadra' is a noun-phrase, unlike 'Lavoro di notte'
        const after = terms[i + 2]
        const isOf = next && next.normal === 'di' && !(after && diWords.has(after.normal))
        hit = isObject(next) && !isOf ? found.hits[0] : null
      } else if (subjects.has(prev.normal) || before.has(prev.normal)) {
        // 'lei vive a Roma', 'non vive più qui', 'dove vivi?'
        hit = found.hits[0]
      } else if (isNoun(prev) && isObject(next)) {
        // 'mia madre cucina la cena', 'il gatto sale sull'albero'
        hit = found.hits.find((o) => o.person === 'third' || o.person === 'thirdPlural')
      }
      if (hit) {
        tag(term, hit, 'homograph-verb')
        person = hit.person
      }
    }
  })
}
export default homographVerbs
