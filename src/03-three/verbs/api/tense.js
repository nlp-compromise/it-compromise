// re-conjugate a verb-phrase into another tense, in-place
// 'io parlo' -> 'io parlavo' -> 'io parlerò'
//
// only the finite verb is changed - 'voglio andare' -> 'volevo andare'
// and its grammatical person is kept - 'parliamo' -> 'parleremo'
// italian drops its subject pronouns, so the person is read from the verb itself
//
// the past-tense is the imperfetto, which is always a one-word substitution.
// (the passato prossimo needs avere/essere, and agreement with the subject)

import essereVerbs from '../../../02-two/postTagger/essere-verbs.js'

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
const fillers = new Set(['non', 'mai', 'già', 'anche', 'sempre', 'ancora', 'più', 'proprio', 'spesso', 'solo', 'appena', 'quasi', 'pure', 'ormai', 'davvero'])

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

// the second half of a contraction has no text of its own - the 'è' in "c'è"
const isHidden = (term) => term.text === '' && typeof term.implicit === 'string'
// .. and the first half holds the text for both - "c'è"
const isHost = (term) => Boolean(term) && term.text !== '' && typeof term.implicit === 'string'

const getWord = (term) => (isHidden(term) ? term.implicit : term.normal)

// the infinitive of 'mangiato', and its agreements - 'mangiata', 'mangiati', 'mangiate'
const fromParticiple = function (term, methods) {
  if (!term.tags.has('Verb') || !term.root) {
    return null
  }
  const str = getWord(term).replace(/[aie]$/, 'o')
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
  const str = getWord(term)
  // the clitic of a contraction - the "c'" in "c'è"
  if (!str || isHost(term)) {
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

const isFiller = (term) => clitics.has(term.implicit || term.normal) || fillers.has(term.normal)

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
  // 'ci sono molti gatti' - there are
  const before = terms[i - 1]
  if (before && (before.implicit || before.normal) === 'ci' && found.includes('thirdPlural')) {
    return 'thirdPlural'
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
const matchCase = function (str, orig) {
  orig = orig || ''
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

const startsVowel = /^h?[aeiouàèéìòù]/
// the object-pronoun agrees with the participle - "l'ho vista" -> 'la vedo'
const objects = { o: 'lo', a: 'la', i: 'li', e: 'le' }

// put a new word into a contraction - "c'è" -> "c'era", or 'ci sarà'
const setHidden = function (terms, i, str, participle) {
  const host = terms[i - 1]
  const term = terms[i]
  const [before] = host.text.split(/['’]/)
  if (startsVowel.test(str)) {
    // still elided - "c'era"
    host.text = before + "'" + str
    host.normal = host.text.toLowerCase()
    term.implicit = str
    term.machine = str
  } else {
    // write it out in full - 'ci sarà'
    let full = host.implicit
    if (before.toLowerCase() === 'l' && participle) {
      full = objects[participle.normal.slice(-1)] || full
    }
    host.text = matchCase(full, before)
    host.normal = full
    host.post = ' '
    delete host.implicit
    delete host.machine
    term.text = str
    term.normal = str
    delete term.implicit
    delete term.machine
  }
  host.dirty = true
  term.dirty = true
}

// 'ci è' is always written "c'è"
const elide = function (terms, i) {
  const host = terms[i - 1]
  const term = terms[i]
  if (!host || host.normal !== 'ci' || host.post !== ' ' || isHost(host) || !/^[eè]/.test(term.normal)) {
    return
  }
  host.implicit = 'ci'
  host.machine = 'ci'
  host.text = host.text.slice(0, 1) + "'" + term.text.toLowerCase()
  host.normal = host.text.toLowerCase()
  host.post = ''
  term.implicit = term.normal
  term.machine = term.normal
  term.text = ''
  term.normal = ''
  host.dirty = true
  term.dirty = true
}

const oldTags = ['PresentTense', 'PastTense', 'ImperfectVerb', 'FutureTense', 'Auxiliary'].concat(Object.values(personTags))

// change this verb-phrase, and return its new finite verb
const convertOne = function (view, n, span, want) {
  const methods = view.methods.two.transform.verb
  const [start, end] = span
  // the whole sentence, as we look outside of the verb-phrase
  view.update([[n]]).compute('root')
  const terms = view.document[n]
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
    return null
  }
  const term = terms[index]
  const tenses = parsed.hits.map((o) => o.tense)
  // the conditional is a mood, not a tense - 'parlerei'
  if (tenses.every((t) => t === 'conditional')) {
    return null
  }
  const person = choosePerson(parsed.hits, terms, index, end)
  let root = parsed.root
  // is it a compound tense? - 'ho mangiato', 'sono andato', 'mi sono alzato'
  let participle = null
  if (root === 'avere' || root === 'essere') {
    participle = findParticiple(terms, index, methods)
    if (participle !== null && root === 'essere') {
      const before = terms[index - 1]
      const isReflexive = Boolean(before) && reflexives.has(before.implicit || before.normal)
      // otherwise, it's a passive - 'è amato'
      if (!essereVerbs.has(fromParticiple(terms[participle], methods)) && !isReflexive) {
        participle = null
      }
    }
  }
  if (participle !== null) {
    // 'ho mangiato' and 'avevo mangiato' are already in the past
    if (want === 'imperfect') {
      return null
    }
    // 'avrò mangiato' is already in the future
    if (want === 'future' && tenses.includes('future')) {
      return null
    }
    // collapse it to a simple tense - 'ho mangiato' -> 'mangio'
    root = fromParticiple(terms[participle], methods)
  } else if (tenses.includes(want) || (want === 'imperfect' && tenses.includes('past'))) {
    // already there
    return null
  }
  const str = getForms(root, methods)[want][person]
  if (!str) {
    return null
  }
  const at = (i, len) => view.update([[n, i, i + (len || 1)]])
  const tags = ['Verb', tenseTags[want], personTags[person]]
  if (isHidden(term)) {
    // "c'è" -> "c'era", "l'ho visto" -> 'lo vedo'
    setHidden(terms, index, str, participle === null ? null : terms[participle])
    const { setTag, unTag } = view.methods.one
    oldTags.forEach((tag) => unTag([term], tag, view.model.one.tagSet))
    setTag([term], tags, view.world, false, 'to-' + want)
  } else if (participle === index + 1) {
    // 'ho mangiato' -> 'mangio'
    at(index, 2).replaceWith(matchCase(str, term.text))
    participle = null
  } else {
    at(index).replaceWith(matchCase(str, term.text))
  }
  // 'ho sempre mangiato' -> 'mangio sempre'
  if (participle !== null) {
    // keep any punctuation after it
    const post = view.document[n][participle].post
    at(participle).remove()
    view.document[n][participle - 1].post = post
  }
  const found = view.document[n][index]
  if (!isHidden(term)) {
    // the new word may not be in our lexicon
    at(index).tag(tags, 'to-' + want)
    elide(view.document[n], index)
  }
  return found
}

const convertTo = function (view, want) {
  // pointers go stale as we add + remove words, so hold onto the terms themselves
  const phrases = []
  view.forEach((vb) => {
    const ptr = vb.fullPointer[0]
    if (ptr) {
      phrases.push({ n: ptr[0], terms: (vb.docs[0] || []).slice() })
    }
  })
  phrases.forEach((phrase) => {
    const terms = view.document[phrase.n]
    // some of them may be removed already - 'ho sempre [mangiato]'
    const found = phrase.terms.map((term) => terms.indexOf(term)).filter((i) => i !== -1)
    if (found.length === 0) {
      phrase.terms = []
      return
    }
    const span = [Math.min(...found), Math.max(...found) + 1]
    const old = terms.slice(span[0], span[1])
    const res = convertOne(view, phrase.n, span, want)
    if (res) {
      // whatever is left of the phrase, and the new verb
      const now = view.document[phrase.n]
      phrase.terms = old.filter((term) => now.includes(term)).concat([res])
    }
  })
  // return what is left of each verb-phrase
  const ptrs = []
  phrases.forEach((phrase) => {
    const terms = view.document[phrase.n]
    const found = phrase.terms.map((term) => terms.indexOf(term)).filter((i) => i !== -1)
    if (found.length > 0) {
      ptrs.push([phrase.n, Math.min(...found), Math.max(...found) + 1])
    }
  })
  return view.update(ptrs)
}

export default convertTo
