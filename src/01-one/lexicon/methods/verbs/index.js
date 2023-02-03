import { toPresent, toPast, toFuture, toConditional, toImperfect } from './conjugate.js'
import { fromGerund, toGerund, fromPastParticiple, toPastParticiple } from './single.js'
import { fromPresent, fromPast, fromFuture, fromConditional, fromImperfect } from './toRoot.js'

const all = function (str) {
  let arr = [str].concat(
    Object.values(toPresent(str)),
    Object.values(toPast(str)),
    Object.values(toFuture(str)),
    Object.values(toConditional(str)),
    Object.values(toImperfect(str)),
  )
  arr.push(toPastParticiple(str))
  arr = arr.filter(s => s)
  arr = new Set(arr)
  return Array.from(arr)
}

export default {
  all,
  toPresent, toPast, toFuture, toConditional, toImperfect,
  fromGerund, toGerund, fromPastParticiple, toPastParticiple,
  fromPresent, fromPast, fromFuture, fromConditional, fromImperfect
}


