import { convert } from 'suffix-thumb'
import model from '../models.js'
let {
  presentTense,
  pastTense,
  futureTense,
  conditional,
  imperfect,
  subjunctive,
} = model

const doEach = function (str, m) {
  // str = str.replace(/si$/, '')
  return {
    first: convert(str, m.first),
    second: convert(str, m.second),
    third: convert(str, m.third),
    firstPlural: convert(str, m.firstPlural),
    secondPlural: convert(str, m.secondPlural),
    thirdPlural: convert(str, m.thirdPlural),
  }
}

const toPresent = (str) => doEach(str, presentTense)
const toPast = (str) => doEach(str, pastTense)
const toFuture = (str) => doEach(str, futureTense)
const toConditional = (str) => doEach(str, conditional)
const toImperfect = (str) => doEach(str, imperfect)
const toSubjunctive = (str) => doEach(str, subjunctive)

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
  toReflexive,
}
// console.log(toPast('permettersi'))
