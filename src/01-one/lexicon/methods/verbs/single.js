import { convert, reverse } from 'suffix-thumb'
import model from '../models.js'
let { gerunds, pastParticiple, presentParticiple } = model

let m = {
  toGerund: gerunds.gerunds,
  fromGerund: reverse(gerunds.gerunds),
  toPastParticiple: pastParticiple.pastParticiple,
  fromPastParticiple: reverse(pastParticiple.pastParticiple),
  toPresentParticiple: presentParticiple.presentParticiple,
  fromPresentParticiple: reverse(presentParticiple.presentParticiple),
}

const fromGerund = function (str) {
  return convert(str, m.fromGerund)
}
const toGerund = function (str) {
  return convert(str, m.toGerund)
}
const fromPastParticiple = function (str) {
  return convert(str, m.fromPastParticiple)
}
const toPastParticiple = function (str) {
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