import { convert, reverse } from 'suffix-thumb'
import model from '../models.js'
import irregular from './irregular.js'
let { gerunds, pastParticiple, presentParticiple } = model

let m = {
  toGerund: gerunds.gerunds,
  fromGerund: reverse(gerunds.gerunds),
  toPastParticiple: pastParticiple.pastParticiple,
  fromPastParticiple: reverse(pastParticiple.pastParticiple),
  toPresentParticiple: presentParticiple.presentParticiple,
  fromPresentParticiple: reverse(presentParticiple.presentParticiple),
}

// irregular participle/gerund lookups, in both directions
let toPP = {}
let fromPP = {}
let toGer = {}
let fromGer = {}
Object.keys(irregular.participles).forEach((inf) => {
  toPP[inf] = irregular.participles[inf]
  fromPP[irregular.participles[inf]] = inf
})
Object.keys(irregular.gerunds).forEach((inf) => {
  toGer[inf] = irregular.gerunds[inf]
  fromGer[irregular.gerunds[inf]] = inf
})
Object.keys(irregular.paradigms).forEach((inf) => {
  let p = irregular.paradigms[inf]
  if (p.pastParticiple) {
    toPP[inf] = p.pastParticiple
    fromPP[p.pastParticiple] = fromPP[p.pastParticiple] || inf
  }
  if (p.gerund) {
    toGer[inf] = p.gerund
    fromGer[p.gerund] = fromGer[p.gerund] || inf
  }
})
// 'stato' is the participle of both essere and stare - prefer essere
fromPP['stato'] = 'essere'

const fromGerund = function (str) {
  if (fromGer.hasOwnProperty(str)) {
    return fromGer[str]
  }
  return convert(str, m.fromGerund)
}
const toGerund = function (str) {
  if (toGer.hasOwnProperty(str)) {
    return toGer[str]
  }
  return convert(str, m.toGerund)
}
const fromPastParticiple = function (str) {
  if (fromPP.hasOwnProperty(str)) {
    return fromPP[str]
  }
  return convert(str, m.fromPastParticiple)
}
const toPastParticiple = function (str) {
  if (toPP.hasOwnProperty(str)) {
    return toPP[str]
  }
  return convert(str, m.toPastParticiple)
}
const fromPresentParticiple = function (str) {
  return convert(str, m.fromPresentParticiple)
}
const toPresentParticiple = function (str) {
  return convert(str, m.toPresentParticiple)
}

export {
  fromGerund, toGerund,
  fromPastParticiple, toPastParticiple,
  fromPresentParticiple, toPresentParticiple
}
