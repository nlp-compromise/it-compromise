import irregular from '../../01-one/lexicon/methods/verbs/irregular.js'
import essereVerbs from './essere-verbs.js'

// compound tenses, with something between the auxiliary and its participle
// 'ho sempre [mangiato]', 'lei è già [partita]', 'non ho mai [visto]'
// - the participle is often mis-read as a noun, an adjective, or a present-tense verb

const avere = new Set([
  'ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno', 'avevo', 'avevi', 'aveva', 'avevamo', 'avevate', 'avevano',
  'ebbi', 'avesti', 'ebbe', 'avemmo', 'aveste', 'ebbero', 'avrò', 'avrai', 'avrà', 'avremo', 'avrete', 'avranno',
  'abbia', 'abbiano', 'avessi', 'avesse', 'avessimo', 'avessero', 'avrei', 'avresti', 'avrebbe', 'avremmo',
  'avreste', 'avrebbero', 'avere', 'aver',
])
const essere = new Set([
  'sono', 'sei', 'è', 'siamo', 'siete', 'ero', 'eri', 'era', 'eravamo', 'eravate', 'erano', 'fui', 'fosti', 'fu',
  'fummo', 'foste', 'furono', 'sarò', 'sarai', 'sarà', 'saremo', 'sarete', 'saranno', 'sia', 'siano', 'fossi',
  'fosse', 'fossimo', 'fossero', 'sarei', 'saresti', 'sarebbe', 'saremmo', 'sareste', 'sarebbero', 'essere',
])
// words that go in the middle
const fillers = new Set(['sempre', 'mai', 'già', 'ancora', 'appena', 'anche', 'più', 'proprio', 'spesso', 'solo', 'quasi', 'pure', 'ormai', 'davvero'])
const reflexives = new Set(['mi', 'ti', 'si', 'ci', 'vi'])
const persons = ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']

// every irregular participle, mapped back to its infinitive
let irregulars = null
const fromIrregular = function (str) {
  if (irregulars === null) {
    irregulars = {}
    Object.keys(irregular.participles || {}).forEach((inf) => {
      irregulars[irregular.participles[inf]] = inf
    })
    Object.keys(irregular.paradigms || {}).forEach((inf) => {
      const pp = irregular.paradigms[inf].pastParticiple
      if (typeof pp === 'string' && !irregulars.hasOwnProperty(pp)) {
        irregulars[pp] = inf
      }
    })
  }
  return irregulars.hasOwnProperty(str) ? irregulars[str] : null
}

const isInfinitive = function (str, lexicon) {
  if (!lexicon.hasOwnProperty(str)) {
    return false
  }
  const tags = lexicon[str]
  return tags === 'Infinitive' || (Array.isArray(tags) && tags.includes('Infinitive'))
}

// the infinitive of this participle, in any agreement - 'partita' -> 'partire'
const fromParticiple = function (str, world) {
  if (!/[ts][oaie]$/.test(str)) {
    return null
  }
  const verb = world.methods.two.transform.verb
  const masc = str.replace(/[aie]$/, 'o')
  const found = fromIrregular(masc)
  if (found) {
    return found
  }
  const inf = verb.fromPastParticiple(masc)
  if (inf && inf !== masc && isInfinitive(inf, world.model.one.lexicon) && verb.toPastParticiple(inf) === masc) {
    return inf
  }
  return null
}

const word = (term) => (term.text === '' && term.implicit ? term.implicit : term.normal)

const tagCompounds = function (doc) {
  const world = doc.world
  const { setTag, unTag } = world.methods.one
  doc.docs.forEach((terms) => {
    terms.forEach((term, i) => {
      const str = word(term)
      const isAvere = avere.has(str)
      if ((!isAvere && !essere.has(str)) || !term.tags.has('Verb')) {
        return
      }
      // skip over any adverbs
      let n = i + 1
      while (terms[n] && (fillers.has(terms[n].normal) || terms[n].tags.has('Adverb') || terms[n].tags.has('Negative'))) {
        n += 1
      }
      const next = terms[n]
      if (!next) {
        return
      }
      const inf = fromParticiple(next.normal, world)
      if (!inf) {
        return
      }
      // with 'essere', only some verbs are a compound tense - 'è partita', 'si è alzato'
      if (!isAvere) {
        // skip back over the host of a contraction - "s'è alzato"
        const before = terms[i - 1] || {}
        if (!essereVerbs.has(inf) && !reflexives.has(before.implicit || before.normal)) {
          return
        }
      }
      if (!next.tags.has('PastParticiple')) {
        persons.forEach((tag) => unTag([next], tag, world.model.one.tagSet))
        setTag([next], ['Verb', 'PastParticiple'], world, false, 'compound-participle')
      }
      setTag([term], 'Auxiliary', world, false, 'compound-aux')
    })
  })
}
export default tagCompounds
