// re-conjugate a verb-phrase into another tense, in-place
// 'io parlo' -> 'io parlavo' -> 'io parlerò'
//
// only the finite verb is changed - 'voglio andare' -> 'volevo andare'
// and its grammatical person is kept - 'parliamo' -> 'parleremo'
// italian drops its subject pronouns, so the person is read from the verb itself
//
// the past-tense is the imperfetto, which is always a one-word substitution.
// (the passato prossimo needs avere/essere, and agreement with the subject)

const persons = ['first', 'second', 'third', 'firstPlural', 'secondPlural', 'thirdPlural']

const personTags = {
  first: 'FirstPerson',
  second: 'SecondPerson',
  third: 'ThirdPerson',
  firstPlural: 'FirstPersonPlural',
  secondPlural: 'SecondPersonPlural',
  thirdPlural: 'ThirdPersonPlural',
}

const tenseTags = {
  present: 'PresentTense',
  imperfect: 'ImperfectVerb',
  future: 'FutureTense',
}

const subjects = {
  io: 'first',
  tu: 'second',
  lui: 'third',
  lei: 'third',
  egli: 'third',
  ella: 'third',
  esso: 'third',
  essa: 'third',
  noi: 'firstPlural',
  voi: 'secondPlural',
  loro: 'thirdPlural',
  essi: 'thirdPlural',
  esse: 'thirdPlural',
}

// object-pronouns sit between the subject and its verb - 'io non lo so'
const clitics = new Set(['mi', 'ti', 'si', 'ci', 'vi', 'lo', 'la', 'li', 'le', 'gli', 'ne', 'me', 'te', 'se', 'ce', 've', 'glielo', 'gliela', 'glieli', 'gliele', 'gliene'])
const reflexives = new Set(['mi', 'ti', 'si', 'ci', 'vi'])
// other words allowed between a subject and its verb - 'io non parlavo mai'
const fillers = new Set(['non', 'mai', 'già', 'anche', 'sempre', 'ancora', 'più', 'proprio', 'spesso', 'solo'])

// verbs that build their passato prossimo with 'essere' - 'sono andato'
// (any other participle after 'essere' is a passive - 'è amato')
const essereVerbs = new Set([
  'accadere', 'andare', 'apparire', 'arrivare', 'arrossire', 'avvenire', 'bastare', 'cadere', 'capitare',
  'costare', 'crescere', 'dimagrire', 'dipendere', 'divenire', 'diventare', 'durare', 'emergere', 'entrare',
  'esistere', 'essere', 'fuggire', 'giungere', 'guarire', 'impazzire', 'ingrassare', 'intervenire', 'invecchiare',
  'morire', 'nascere', 'parere', 'partire', 'pervenire', 'piacere', 'restare', 'rientrare', 'rimanere',
  'ritornare', 'riuscire', 'salire', 'scappare', 'scendere', 'scomparire', 'sembrare', 'sorgere', 'sparire',
  'stare', 'succedere', 'svenire', 'tornare', 'uscire', 'venire',
])

// verb-forms that are not an indicative tense
const skipTags = ['Infinitive', 'Gerund', 'PastParticiple', 'Participle', 'PresentParticiple', 'Imperative', 'Subjunctive', 'ConditionalVerb']

// every indicative form of this verb
const getForms = function (root, methods) {
  return {
    present: methods.toPresent(root),
    imperfect: methods.toImperfect(root),
    past: methods.toPast(root), //passato remoto
    future: methods.toFuture(root),
    conditional: methods.toConditional(root),
  }
}

// the infinitive of 'mangiato', and its agreements - 'mangiata', 'mangiati', 'mangiate'
const fromParticiple = function (term, methods) {
  if (!term.tags.has('Verb') || !term.root) {
    return null
  }
  const str = term.normal.replace(/[aie]$/, 'o')
  if (term.tags.has('PastParticiple') || methods.toPastParticiple(term.root) === str) {
    return term.root
  }
  // the tagger can miss these - 'hanno dormito'
  const root = methods.fromPastParticiple(str)
  if (root && root !== str && methods.toPastParticiple(root) === str) {
    return root
  }
  return null
}

// which tense + person is this word?
const parseTerm = function (term, methods) {
  const str = term.normal
  // contractions are left alone - "c'è", "l'ho"
  if (!str || !term.text || term.implicit) {
    return null
  }
  if (!term.tags.has('Verb') || clitics.has(str) || skipTags.some((tag) => term.tags.has(tag))) {
    return null
  }
  const root = term.root
  if (!root || root === str) {
    return null
  }
  // find the word in its own conjugation table
  const forms = getForms(root, methods)
  const hits = []
  Object.keys(forms).forEach((tense) => {
    persons.forEach((person) => {
      if (forms[tense][person] === str) {
        hits.push({ tense, person })
      }
    })
  })
  if (hits.length === 0) {
    return null
  }
  return { root, hits }
}

const isFiller = (term) => clitics.has(term.normal) || fillers.has(term.normal)

// look backwards for a subject - 'io non lo [so]'
const getSubject = function (terms, i) {
  for (let k = i - 1; k >= 0; k -= 1) {
    const term = terms[k]
    if (subjects.hasOwnProperty(term.normal)) {
      return subjects[term.normal]
    }
    if (!isFiller(term)) {
      // 'i ragazzi [sono]'
      if (term.tags.has('Noun') && !term.tags.has('Pronoun')) {
        return term.tags.has('PluralNoun') ? 'thirdPlural' : 'third'
      }
      return null
    }
  }
  return null
}

// 'sono' is both first-person, and third-person plural
const choosePerson = function (hits, terms, i, end) {
  const found = hits.map((o) => o.person).filter((p, k, arr) => arr.indexOf(p) === k)
  if (found.length === 1) {
    return found[0]
  }
  const subj = getSubject(terms, i)
  if (subj && found.includes(subj)) {
    return subj
  }
  // look for a plural after it - 'sono amici', 'sono andati'
  if (found.includes('thirdPlural')) {
    let next = terms[i + 1]
    for (let k = i + 1; k < end && next && isFiller(next); k += 1) {
      next = terms[k + 1]
    }
    if (next && (next.tags.has('PluralNoun') || (/i$/.test(next.normal) && (next.tags.has('Adjective') || next.tags.has('Verb'))))) {
      return 'thirdPlural'
    }
  }
  return found[0]
}

// 'Parlo' -> 'Parlavo'
const matchCase = function (str, term) {
  const orig = term.text || ''
  if (orig.length > 1 && orig === orig.toUpperCase() && orig !== orig.toLowerCase()) {
    return str.toUpperCase()
  }
  if (orig && orig[0] !== orig[0].toLowerCase()) {
    return str[0].toUpperCase() + str.slice(1)
  }
  return str
}

// 'ho sempre [mangiato]' - find the participle of a compound tense
const findParticiple = function (terms, index, methods) {
  for (let i = index + 1; i < terms.length; i += 1) {
    const term = terms[i]
    if (fromParticiple(term, methods)) {
      return i
    }
    if (!term.tags.has('Adverb') && !term.tags.has('Negative') && !fillers.has(term.normal)) {
      return null
    }
  }
  return null
}

// returns the (possibly shorter) pointer of the new verb-phrase
const convertOne = function (vb, want, methods) {
  const ptr = vb.fullPointer[0]
  if (!ptr) {
    return null
  }
  const [n, start, end] = ptr
  // the whole sentence, as we look outside of the verb-phrase
  vb.update([[n]]).compute('root')
  const same = [n, start, end]
  const terms = vb.document[n]
  // the first conjugated verb in the phrase is the finite one
  let index = null
  let parsed = null
  for (let i = start; i < end; i += 1) {
    parsed = parseTerm(terms[i], methods)
    if (parsed) {
      index = i
      break
    }
  }
  if (!parsed) {
    return same
  }
  const term = terms[index]
  const tenses = parsed.hits.map((o) => o.tense)
  // the conditional is a mood, not a tense - 'parlerei'
  if (tenses.every((t) => t === 'conditional')) {
    return same
  }
  const person = choosePerson(parsed.hits, terms, index, end)
  let root = parsed.root
  // is it a compound tense? - 'ho mangiato', 'sono andato', 'mi sono alzato'
  let participle = null
  if (root === 'avere' || root === 'essere') {
    participle = findParticiple(terms, index, methods)
    if (participle !== null && root === 'essere') {
      const isReflexive = Boolean(terms[index - 1]) && reflexives.has(terms[index - 1].normal)
      // otherwise, it's a passive - 'è amato'
      if (!essereVerbs.has(fromParticiple(terms[participle], methods)) && !isReflexive) {
        participle = null
      }
    }
  }
  // 'ho mangiato' and 'avevo mangiato' are already in the past
  if (participle !== null && want === 'imperfect') {
    return same
  }
  // an adverb in the middle - 'ho sempre mangiato'
  // only the auxiliary is changed - 'avrò sempre mangiato'
  const isSplit = participle !== null && (participle !== index + 1 || participle >= end)
  let len = 1
  if (participle !== null && !isSplit) {
    // 'avrò mangiato' is already in the future
    if (want === 'future' && tenses.includes('future')) {
      return same
    }
    // collapse it to a simple tense - 'ho mangiato' -> 'mangio'
    root = fromParticiple(terms[participle], methods)
    len = 2
  } else if (tenses.includes(want) || (want === 'imperfect' && tenses.includes('past'))) {
    // already there
    return same
  }
  let str = getForms(root, methods)[want][person]
  if (!str) {
    return same
  }
  str = matchCase(str, term)
  vb.update([[n, index, index + len]]).replaceWith(str)
  // the new word may not be in our lexicon
  vb.update([[n, index, index + 1]]).tag(['Verb', tenseTags[want], personTags[person]], 'to-' + want)
  return [n, start, end - (len - 1)]
}

const convertTo = function (view, want) {
  const methods = view.methods.two.transform.verb
  // replacing a word orphans the pointer that held it, so rebuild them as we go
  const ptrs = []
  view.forEach((vb) => {
    const ptr = convertOne(vb, want, methods)
    if (ptr) {
      ptrs.push(ptr)
    }
  })
  return view.update(ptrs)
}

export default convertTo
