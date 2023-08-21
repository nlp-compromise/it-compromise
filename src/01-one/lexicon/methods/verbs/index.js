import {
  toPresent,
  toPast,
  toFuture,
  toConditional,
  toImperfect,
  toSubjunctive,
  toReflexive,
} from './conjugate.js'
import {
  fromGerund,
  toGerund,
  fromPastParticiple,
  toPastParticiple,
  fromPresentParticiple,
  toPresentParticiple,
} from './single.js'
import {
  fromPresent,
  fromPast,
  fromFuture,
  fromConditional,
  fromImperfect,
  fromSubjunctive,
} from './toRoot.js'

const all = function (str) {
  let arr = [str].concat(
    Object.values(toPresent(str)),
    Object.values(toPast(str)),
    Object.values(toFuture(str)),
    Object.values(toConditional(str)),
    Object.values(toImperfect(str)),
    Object.values(toSubjunctive(str)),
    Object.values(toReflexive(str))
  )
  arr.push(toPastParticiple(str))
  arr.push(toPresentParticiple(str))
  arr = arr.filter((s) => s)
  arr = new Set(arr)
  return Array.from(arr)
}

export default {
  all,
  toPresent,
  toPast,
  toFuture,
  toConditional,
  toImperfect,
  toSubjunctive,
  toReflexive,
  fromGerund,
  toGerund,
  fromPastParticiple,
  toPastParticiple,
  fromPresentParticiple,
  toPresentParticiple,
  fromPresent,
  fromPast,
  fromFuture,
  fromConditional,
  fromImperfect,
  fromSubjunctive,
}

// console.log(toPresent('fermarsi'))
