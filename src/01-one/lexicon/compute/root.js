import irregular from '../methods/verbs/irregular.js'
import { parseImperative, fromImperative } from '../methods/verbs/imperative.js'

const verbForm = function (term) {
  const want = [
    'FirstPerson',
    'SecondPerson',
    'ThirdPerson',
    'FirstPersonPlural',
    'SecondPersonPlural',
    'ThirdPersonPlural'
  ]
  return want.find((tag) => term.tags.has(tag))
}

// for verbs tagged without person info, guess it from the ending
const guessForm = function (str) {
  if (/iamo$/.test(str)) return 'FirstPersonPlural'
  if (/te$/.test(str)) return 'SecondPersonPlural'
  if (/no$/.test(str)) return 'ThirdPersonPlural'
  if (/o$/.test(str)) return 'FirstPerson'
  if (/i$/.test(str)) return 'SecondPerson'
  return 'ThirdPerson'
}

// every irregular conjugated form, mapped back to its infinitive
const irregularRoots = {}
Object.keys(irregular.paradigms).forEach((inf) => {
  const p = irregular.paradigms[inf]
  Object.keys(p).forEach((k) => {
    let forms = p[k]
    if (typeof forms === 'string') {
      forms = [forms]
    }
    forms.forEach((w) => {
      if (w && !irregularRoots.hasOwnProperty(w)) {
        irregularRoots[w] = inf
      }
    })
  })
})
// 'sono' belongs to essere, not stare/etc
irregularRoots['sono'] = 'essere'
// archaic long infinitive - 'beverlo'
irregularRoots['bevere'] = 'bere'
// participles of otherwise-regular verbs
Object.keys(irregular.participles).forEach((inf) => {
  const pp = irregular.participles[inf]
  if (!irregularRoots.hasOwnProperty(pp)) {
    irregularRoots[pp] = inf
  }
})
Object.keys(irregular.gerunds).forEach((inf) => {
  const ger = irregular.gerunds[inf]
  if (!irregularRoots.hasOwnProperty(ger)) {
    irregularRoots[ger] = inf
  }
})

// a hint for the noun inflector - 'le chiavi' is 'chiave'
const nounGender = function (term) {
  if (term.tags.has('FemaleNoun')) {
    return 'f'
  }
  return term.tags.has('MaleNoun') ? 'm' : undefined
}

// turn 'congratularmi' into 'congratular'
const stripReflexive = function (str) {
  str = str.replace(/ar[mtscv]i$/, 'are')
  str = str.replace(/er[mtscv]i$/, 'ere')
  str = str.replace(/ir[mtscv]i$/, 'ire')
  // pronoun suffixes
  //sentire + "lo" -> "sentirlo"
  str = str.replace(/arl[oaie]$/, 'are')
  str = str.replace(/erl[oaie]$/, 'ere')
  str = str.replace(/irl[oaie]$/, 'ire')

  // -ergli, -argli, -irgli
  str = str.replace(/er(lo|la|le|gli|eci)$/, 'ere')
  str = str.replace(/ar(lo|la|le|gli|eci)$/, 'are')
  str = str.replace(/ir(lo|la|le|gli|eci)$/, 'ire')
  // combined clitics - 'studiarselo', 'andarsene'
  str = str.replace(/([aei])r[mtscv]e(l[oaie]|ne)$/, '$1re')
  // whole infinitive + pronoun - 'scriverele', 'diregli'
  str = str.replace(/(are|ere|ire)(l[oaie]|ne|gli|ci|mi|ti|si|vi)$/, '$1')
  return str
}

// 'mangiata' -> 'mangiato', 'prese' -> 'preso'
const masculineParticiple = function (str) {
  return str.replace(/([ts])[aie]$/, '$1o')
}

// the tagger's tense + person are often a guess, and so is the infinitive we get from them.
// if it does not conjugate back into our word, look for a known verb that does
const checkRoot = function (str, guess, world) {
  const verb = world.methods.two.transform.verb
  if (guess && guess !== str && verb.findHits(str, guess).length > 0) {
    return guess
  }
  const lexicon = world.model.one.lexicon
  const isVerb = (inf) => lexicon.hasOwnProperty(inf) && [].concat(lexicon[inf]).includes('Infinitive')
  const found = verb.lookup(str, { isVerb, known: true })
  return found ? found.root : guess
}

// 'porto' is the participle of 'porgere', but with a person, it is 'io porto' - from 'portare'
const isOther = function (term, str, inf, verb) {
  return Boolean(verbForm(term)) && !term.tags.has('PastParticiple') && verb.findHits(str, inf).length === 0
}

const root = function (view) {
  const { verb, adjective, noun } = view.world.methods.two.transform
  view.docs.forEach((terms) => {
    terms.forEach((term) => {
      let str = term.implicit || term.normal || term.text
      if (term.tags.has('Reflexive')) {
        str = stripReflexive(str)
      }
      // get infinitive form of the verb
      if (term.tags.has('Verb')) {
        const form = verbForm(term) || guessForm(str)
        // 'dammelo' is 'dare'
        const lexicon = view.world.model.one.lexicon
        const imp = term.tags.has('Imperative') ? parseImperative(str, lexicon) : null
        const bare = term.tags.has('Imperative') && !imp ? fromImperative(str, (inf) => lexicon[inf] === 'Infinitive') : null
        if (imp || bare) {
          term.root = imp ? imp.root : bare
        } else if (irregularRoots.hasOwnProperty(str) && !isOther(term, str, irregularRoots[str], verb)) {
          term.root = irregularRoots[str]
        } else if (term.tags.has('Infinitive')) {
          // an infinitive may carry a pronoun suffix - 'vederlo'
          const inf = stripReflexive(str)
          term.root = irregularRoots.hasOwnProperty(inf) ? irregularRoots[inf] : inf
        } else if (term.tags.has('Gerund')) {
          term.root = verb.fromGerund(str, form)
        } else if (term.tags.has('ConditionalVerb')) {
          term.root = checkRoot(str, verb.fromConditional(str, form), view.world)
        } else if (term.tags.has('PastParticiple')) {
          const masc = masculineParticiple(str)
          term.root = irregularRoots.hasOwnProperty(masc)
            ? irregularRoots[masc]
            : verb.fromPastParticiple(masc, form)
        } else if (term.tags.has('ImperfectVerb')) {
          term.root = checkRoot(str, verb.fromImperfect(str, form), view.world)
        } else if (term.tags.has('Subjunctive')) {
          term.root = verb.fromSubjunctive(str, form)
        } else if (term.tags.has('PresentTense')) {
          term.root = checkRoot(str, verb.fromPresent(str, form), view.world)
        } else if (term.tags.has('PastTense')) {
          term.root = checkRoot(str, verb.fromPast(str, form), view.world)
        } else if (term.tags.has('FutureTense')) {
          term.root = checkRoot(str, verb.fromFuture(str, form), view.world)
        } else {
          term.root = checkRoot(str, verb.fromPresent(str, form), view.world)
        }
      }

      // nouns -> singular form
      if (term.tags.has('Noun')) {
        if (term.tags.has('PluralNoun')) {
          str = noun.fromPlural(str, nounGender(term))
        }
        term.root = str
      }

      // adjectives -> singular masculine form
      if (term.tags.has('Adjective')) {
        if (term.tags.has('FemaleAdjective') && term.tags.has('PluralAdjective')) {
          str = adjective.fromFemalePlural(str)
        } else if (term.tags.has('PluralAdjective')) {
          str = adjective.fromPlural(str)
        } else if (term.tags.has('FemaleAdjective')) {
          str = adjective.fromFemale(str)
        }
        // str = adjective.toRoot(str)
        term.root = str
      }
    })
  })
  return view
}
export default root
