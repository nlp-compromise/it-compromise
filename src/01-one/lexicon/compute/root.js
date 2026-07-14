import irregular from '../methods/verbs/irregular.js'

const verbForm = function (term) {
  let want = [
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
  let p = irregular.paradigms[inf]
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
  let pp = irregular.participles[inf]
  if (!irregularRoots.hasOwnProperty(pp)) {
    irregularRoots[pp] = inf
  }
})
Object.keys(irregular.gerunds).forEach((inf) => {
  let ger = irregular.gerunds[inf]
  if (!irregularRoots.hasOwnProperty(ger)) {
    irregularRoots[ger] = inf
  }
})

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
        let form = verbForm(term) || guessForm(str)
        if (irregularRoots.hasOwnProperty(str)) {
          term.root = irregularRoots[str]
        } else if (term.tags.has('Infinitive')) {
          // an infinitive may carry a pronoun suffix - 'vederlo'
          let inf = stripReflexive(str)
          term.root = irregularRoots.hasOwnProperty(inf) ? irregularRoots[inf] : inf
        } else if (term.tags.has('Gerund')) {
          term.root = verb.fromGerund(str, form)
        } else if (term.tags.has('ConditionalVerb')) {
          term.root = verb.fromConditional(str, form)
        } else if (term.tags.has('PastParticiple')) {
          let masc = masculineParticiple(str)
          term.root = irregularRoots.hasOwnProperty(masc)
            ? irregularRoots[masc]
            : verb.fromPastParticiple(masc, form)
        } else if (term.tags.has('ImperfectVerb')) {
          term.root = verb.fromImperfect(str, form)
        } else if (term.tags.has('Subjunctive')) {
          term.root = verb.fromSubjunctive(str, form)
        } else if (term.tags.has('PresentTense')) {
          term.root = verb.fromPresent(str, form)
        } else if (term.tags.has('PastTense')) {
          term.root = verb.fromPast(str, form)
        } else if (term.tags.has('FutureTense')) {
          term.root = verb.fromFuture(str, form)
        } else {
          term.root = verb.fromPresent(str, form)
        }
      }

      // nouns -> singular form
      if (term.tags.has('Noun')) {
        if (term.tags.has('PluralNoun')) {
          str = noun.fromPlural(str)
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
