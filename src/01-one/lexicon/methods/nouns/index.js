import { convert, reverse } from 'suffix-thumb'
import model from '../models.js'
import { greekI, irregular, isInvariable, isMaleA, femalePlural, fromFemalePlural, malePlural } from './rules.js'
const { plural } = model.nouns

const revPlural = reverse(plural)

// gender is an optional hint - 'm' or 'f'
const toPlural = (str, gender) => {
  if (irregular.toPlural.hasOwnProperty(str)) {
    return irregular.toPlural[str]
  }
  if (isInvariable(str)) {
    return str
  }
  // the model is mostly masculine nouns - so '-a' nouns are done by rule
  if (str.endsWith('a')) {
    if (!isMaleA(str, gender)) {
      return femalePlural(str)
    }
    // 'capobanda' -> 'capibanda'
    const res = convert(str, plural)
    return res.endsWith('i') || res.endsWith('a') ? res : malePlural(str)
  }
  return convert(str, plural)
}

const fromPlural = (str, gender) => {
  if (irregular.fromPlural.hasOwnProperty(str)) {
    return irregular.fromPlural[str]
  }
  if (isInvariable(str)) {
    return str
  }
  // an '-e' plural is a feminine '-a' noun
  if (str.endsWith('e')) {
    return fromFemalePlural(str)
  }
  // 'le crisi' -> 'crisi'
  if (greekI.test(str)) {
    return str
  }
  // 'le chiavi' -> 'chiave'
  if (gender === 'f' && /[^i]i$/.test(str)) {
    return str.replace(/i$/, 'e')
  }
  if (str.endsWith('i')) {
    const res = convert(str, revPlural)
    // the reversed model can miss - 'uovm'
    return /[aeo]$/.test(res) ? res : str.replace(/i$/, 'o')
  }
  return str
}

const all = (str) => {
  const plur = toPlural(str)
  if (plur === str) {
    return [str]
  }
  return [str, plur]
}

export default {
  toPlural,
  fromPlural,
  all
}
