import { convert, reverse } from 'suffix-thumb'
import model from '../models.js'
import lexicon from '../../model/lexicon.js'
import { irregular, isInvariable, isMaleA, maleWords, singularE, femalePlural, fromFemalePlural, malePlural } from './rules.js'
const { plural } = model.nouns

const revPlural = reverse(plural)

// gender is an optional hint - 'm' or 'f'
const toPlural = (str, gender) => {
  if (irregular.toPlural.hasOwnProperty(str)) {
    return irregular.toPlural[str]
  }
  // 'film', 'città', 'crisi' - and any other noun in '-i'
  if (isInvariable(str) || str.endsWith('i')) {
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

// words that the lexicon knows as a singular noun, or as an adjective that can be one - 'il giovane'
const isNoun = /^(Noun|Singular|MaleNoun|FemaleNoun)$/
const isAdj = /^(Noun|Singular|MaleNoun|FemaleNoun|MaleAdjective|Adjective)$/
const has = (str, reg) => lexicon.hasOwnProperty(str) && [].concat(lexicon[str]).some((tag) => reg.test(tag))
const isKnown = (str) => has(str, isNoun)
// 'problema', but not 'casa'
const isKnownA = (str) => maleWords.has(str) || (isKnown(str) && isMaleA(str))

// an '-i' plural does not say what its singular ends in - 'libri' -> 'libro', 'cani' -> 'cane', 'poeti' -> 'poeta'
// if we know only one of them as a word, use it
const findKnown = function (str, gender) {
  const stem = str.slice(0, -1)
  // 'banchi' -> 'banco', 'colleghi' -> 'collega'
  const hard = stem.replace(/([cg])h$/, '$1')
  const found = []
  // 'giovane' - but 'le case' is 'casa', before it is 'i casi', and 'tedesche' is no singular
  if (hard === stem && has(stem + 'e', isAdj) && !(isKnown(stem + 'a') && !isMaleA(stem + 'a'))) {
    found.push(stem + 'e')
  }
  // a feminine '-i' plural is an '-e' noun
  if (gender !== 'f') {
    found.push(...[hard + 'o', stem + 'io'].filter(isKnown))
    // 'pirati' -> 'pirata', but 'collega' is 'colleghi'
    if (isKnownA(hard + 'a') && !/[cg]$/.test(stem)) {
      found.push(hard + 'a')
    }
  }
  return found.length === 1 ? found[0] : null
}

const fromPlural = (str, gender) => {
  if (irregular.fromPlural.hasOwnProperty(str)) {
    return irregular.fromPlural[str]
  }
  if (isInvariable(str)) {
    return str
  }
  // an '-e' plural is a feminine '-a' noun - but 'i college' are not
  if (str.endsWith('e')) {
    return gender === 'm' ? str : fromFemalePlural(str)
  }
  if (!str.endsWith('i')) {
    return str
  }
  // 'zii' -> 'zio'
  if (str.endsWith('ii')) {
    return str.replace(/i$/, 'o')
  }
  // 'giovani' -> 'giovane'
  const known = findKnown(str, gender)
  if (known) {
    return known
  }
  // 'lezioni' -> 'lezione', 'le chiavi' -> 'chiave'
  if (singularE.test(str) || gender === 'f') {
    return str.replace(/i$/, 'e')
  }
  const res = convert(str, revPlural)
  // the reversed model can miss - 'uovm'
  return /[aeo]$/.test(res) ? res : str.replace(/i$/, 'o')
}

const all = (str) => {
  const plur = toPlural(str)
  if (plur === str) {
    return [str]
  }
  return [str, plur]
}

export default {
  isMaleA,
  toPlural,
  fromPlural,
  all
}
