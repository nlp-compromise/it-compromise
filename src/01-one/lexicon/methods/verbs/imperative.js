import { toPresent, toSubjunctive } from './conjugate.js'
import { fromPresent, fromSubjunctive } from './toRoot.js'
import irregular from './irregular.js'

// the italian imperative has no forms of its own, for nearly every verb -
// it borrows them from the present-tense, and the subjunctive.
// 'mangia!' (tu), 'mangi!' (Lei), 'mangiamo!' (noi), 'mangiate!' (voi), 'mangino!' (Loro)

// [tu, voi] - the few verbs with their own forms
const irregulars = {
  essere: ['sii', 'siate'],
  avere: ['abbi', 'abbiate'],
  sapere: ['sappi', 'sappiate'],
  volere: ['vogli', 'vogliate'],
  dire: ["di'", 'dite'],
  dare: ['dai', 'date'],
  fare: ['fai', 'fate'],
  stare: ['stai', 'state'],
  andare: ['vai', 'andate'],
}
// the short forms of these - "da'", "fa'", "sta'", "va'"
const short = { da: 'dare', di: 'dire', fa: 'fare', sta: 'stare', va: 'andare' }

const has = (obj, k) => Object.prototype.hasOwnProperty.call(obj, k)

const toImperative = function (str) {
  const pres = toPresent(str)
  const subj = toSubjunctive(str)
  const res = {
    // 'mangia!' is the third-person, but 'prendi!' is the second
    second: /are$/.test(str) ? pres.third : pres.second,
    third: subj.third,
    firstPlural: pres.firstPlural,
    secondPlural: pres.secondPlural,
    thirdPlural: subj.thirdPlural,
  }
  if (has(irregulars, str)) {
    res.second = irregulars[str][0]
    res.secondPlural = irregulars[str][1]
  }
  return res
}

// every irregular present-tense and subjunctive form, and its infinitive - 'siedi' -> 'sedere'
let known = null
const fromIrregular = function (str) {
  if (known === null) {
    known = {}
    Object.keys(irregular.paradigms).forEach((inf) => {
      const table = irregular.paradigms[inf]
      const list = (table.present || []).concat(table.subjunctive || [])
      list.forEach((w) => {
        if (w && !has(known, w)) {
          known[w] = inf
        }
      })
    })
    Object.keys(irregulars).forEach((inf) => {
      irregulars[inf].forEach((w) => {
        known[w] = inf
      })
    })
  }
  return has(known, str) ? known[str] : null
}

const forms = [
  { key: 'second', from: (s) => [fromPresent(s, 'ThirdPerson'), fromPresent(s, 'SecondPerson')] },
  { key: 'firstPlural', from: (s) => [fromPresent(s, 'FirstPersonPlural')] },
  { key: 'secondPlural', from: (s) => [fromPresent(s, 'SecondPersonPlural')] },
  { key: 'third', from: (s) => [fromSubjunctive(s, 'ThirdPerson')] },
  { key: 'thirdPlural', from: (s) => [fromSubjunctive(s, 'ThirdPersonPlural')] },
]

// find an infinitive whose imperative is this word
// - pass-in 'isVerb' to only accept infinitives that we know
const fromImperative = function (str, isVerb) {
  str = str.replace(/’/g, "'")
  const bare = str.replace(/'$/, '')
  if (str !== bare && has(short, bare)) {
    return short[bare]
  }
  const isOk = (inf) => Boolean(inf) && inf !== str && /(are|ere|ire|rre)$/.test(inf) && (!isVerb || isVerb(inf))
  const irr = fromIrregular(str)
  if (irr && Object.values(toImperative(irr)).includes(str)) {
    return irr
  }
  for (let i = 0; i < forms.length; i += 1) {
    const { key, from } = forms[i]
    const found = from(str).find((inf) => isOk(inf) && toImperative(inf)[key] === str)
    if (found) {
      return found
    }
  }
  return null
}

// an imperative, with its object-pronouns attached
// 'dammelo' -> dare + me + lo, 'guardami' -> guardare + mi, 'andiamoci' -> andare + ci
const clitics = /(glie(lo|la|li|le|ne)|[mtcvs]e(lo|la|li|le|ne)|gli|lo|la|li|le|ne|mi|ti|ci|vi|si)$/

const isInfinitive = function (str, lexicon) {
  if (!has(lexicon, str)) {
    return false
  }
  const tags = lexicon[str]
  return tags === 'Infinitive' || (Array.isArray(tags) && tags.includes('Infinitive'))
}

// returns the infinitive, and the pronouns - or null
const parseImperative = function (str, lexicon) {
  const m = str.match(clitics)
  if (!m || m.index < 2) {
    return null
  }
  const stem = str.slice(0, m.index)
  const clitic = m[0]
  // these double the consonant of their pronoun - 'dammi', 'dillo', 'facci' - but 'dagli'
  const base = stem.slice(0, -1)
  if (has(short, base) && stem.slice(-1) === clitic[0] && clitic !== 'gli') {
    return { root: short[base], clitic }
  }
  if (has(short, stem) && /^gli/.test(clitic)) {
    return { root: short[stem], clitic }
  }
  // only the tu, noi and voi forms take a pronoun
  const root = stem.length < 4 ? null : fromImperative(stem, (inf) => isInfinitive(inf, lexicon))
  if (!root) {
    return null
  }
  const found = toImperative(root)
  if (![found.second, found.firstPlural, found.secondPlural].includes(stem)) {
    return null
  }
  return { root, clitic }
}

export { toImperative, fromImperative, parseImperative }
