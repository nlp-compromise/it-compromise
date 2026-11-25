// an imperative, with its object-pronouns attached
// 'dammelo' -> dare + me + lo, 'guardami' -> guardare + mi, 'andiamoci' -> andare + ci

const clitics = /(glie(lo|la|li|le|ne)|[mtcvs]e(lo|la|li|le|ne)|gli|lo|la|li|le|ne|mi|ti|ci|vi|si)$/

// these double the consonant of their pronoun - 'da' + 'mi' -> 'dammi'
const short = { da: 'dare', di: 'dire', fa: 'fare', sta: 'stare', va: 'andare' }
// forms that are not in the present-tense
const irregular = { abbi: 'avere', sii: 'essere', sappi: 'sapere', abbiate: 'avere', siate: 'essere', sappiate: 'sapere' }

const isInfinitive = function (str, lexicon) {
  if (!Object.prototype.hasOwnProperty.call(lexicon, str)) {
    return false
  }
  const tags = lexicon[str]
  return tags === 'Infinitive' || (Array.isArray(tags) && tags.includes('Infinitive'))
}

// which present-tense forms are also the imperative?
// 'mangia!' is the third-person, but 'prendi!' is the second
const forms = [
  { tag: 'ThirdPerson', key: 'third', isAre: true },
  { tag: 'SecondPerson', key: 'second', isAre: false },
  { tag: 'FirstPersonPlural', key: 'firstPlural' },
  { tag: 'SecondPersonPlural', key: 'secondPlural' },
]

const findRoot = function (stem, lexicon, verb) {
  for (let i = 0; i < forms.length; i += 1) {
    const { tag, key, isAre } = forms[i]
    const inf = verb.fromPresent(stem, tag)
    if (!inf || inf === stem || !isInfinitive(inf, lexicon)) {
      continue
    }
    if (isAre !== undefined && isAre !== /are$/.test(inf)) {
      continue
    }
    if (verb.toPresent(inf)[key] === stem) {
      return inf
    }
  }
  return null
}

// returns the infinitive, and the pronouns - or null
const parseImperative = function (str, lexicon, verb) {
  const m = str.match(clitics)
  if (!m || m.index < 2) {
    return null
  }
  const stem = str.slice(0, m.index)
  const clitic = m[0]
  // 'dammi', 'dillo', 'facci' - but 'dagli'
  const base = stem.slice(0, -1)
  if (Object.prototype.hasOwnProperty.call(short, base) && stem.slice(-1) === clitic[0] && clitic !== 'gli') {
    return { root: short[base], clitic }
  }
  if (Object.prototype.hasOwnProperty.call(short, stem) && /^gli/.test(clitic)) {
    return { root: short[stem], clitic }
  }
  if (Object.prototype.hasOwnProperty.call(irregular, stem)) {
    return { root: irregular[stem], clitic }
  }
  if (stem.length < 4) {
    return null
  }
  const root = findRoot(stem, lexicon, verb)
  return root ? { root, clitic } : null
}

export default parseImperative
