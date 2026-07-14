import { convert } from 'suffix-thumb'
import model from '../models.js'
import irregular from './irregular.js'
let {
  presentTense,
  pastTense,
  futureTense,
  conditional,
  imperfect,
  subjunctive,
} = model

const persons = ['first', 'second', 'third', 'firstPlural', 'secondPlural', 'thirdPlural']

const doEach = function (str, m, tense) {
  // known-irregular verb?
  let table = irregular.paradigms[str]
  if (table && table[tense]) {
    let res = {}
    persons.forEach((p, i) => {
      res[p] = table[tense][i]
    })
    return res
  }
  return {
    first: convert(str, m.first),
    second: convert(str, m.second),
    third: convert(str, m.third),
    firstPlural: convert(str, m.firstPlural),
    secondPlural: convert(str, m.secondPlural),
    thirdPlural: convert(str, m.thirdPlural),
  }
}

const toPresent = (str) => doEach(str, presentTense, 'present')
const toPast = (str) => doEach(str, pastTense, 'past')
const toFuture = (str) => doEach(str, futureTense, 'future')
const toConditional = (str) => doEach(str, conditional, 'conditional')
const toImperfect = (str) => doEach(str, imperfect, 'imperfect')
const toSubjunctive = (str) => doEach(str, subjunctive, 'subjunctive')

// congiuntivo imperfetto is regular enough for simple rules
// parlare -> parlassi, credere -> credessi, dormire -> dormissi
const toImperfectSubjunctive = (str) => {
  let table = irregular.paradigms[str]
  if (table && table.imperfectSubjunctive) {
    let res = {}
    persons.forEach((p, i) => {
      res[p] = table.imperfectSubjunctive[i]
    })
    return res
  }
  let stem = str.replace(/are$/, 'a').replace(/ere$/, 'e').replace(/ire$/, 'i')
  if (stem === str) {
    return {}
  }
  return {
    first: stem + 'ssi',
    second: stem + 'ssi',
    third: stem + 'sse',
    firstPlural: stem + 'ssimo',
    secondPlural: stem + 'ste',
    thirdPlural: stem + 'ssero',
  }
}

// reflexive infinitive
const toReflexive = (str) => {
  str = str.replace(/are$/, 'ar') //armi
  str = str.replace(/ere$/, 'er') //ermi
  str = str.replace(/ire$/, 'ir') //irmi
  return {
    first: str + 'mi',
    second: str + 'ti',
    third: str + 'si',
    firstPlural: str + 'ci',
    secondPlural: str + 'vi',
    thirdPlural: str + 'si',
  }
}

export {
  toPresent,
  toPast,
  toFuture,
  toConditional,
  toImperfect,
  toSubjunctive,
  toImperfectSubjunctive,
  toReflexive,
}
// console.log(toPast('permettersi'))
