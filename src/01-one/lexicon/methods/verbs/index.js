import {
  toPresent,
  toPast,
  toFuture,
  toConditional,
  toImperfect,
  toSubjunctive,
  toImperfectSubjunctive,
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
    Object.values(toImperfectSubjunctive(str)),
    Object.values(toReflexive(str))
  )
  // past-participle, in all four gender/number agreements
  let pp = toPastParticiple(str)
  if (pp) {
    arr.push(pp)
    arr.push(pp.replace(/o$/, 'a'))
    arr.push(pp.replace(/o$/, 'i'))
    arr.push(pp.replace(/o$/, 'e'))
  }
  arr.push(toGerund(str))
  arr.push(toPresentParticiple(str))
  // attached object-pronouns - 'fissarla', 'scriverlo'
  let stem = str.replace(/e$/, '')
  arr = arr.concat([stem + 'lo', stem + 'la', stem + 'li', stem + 'le', stem + 'ne'])
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
  toImperfectSubjunctive,
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
