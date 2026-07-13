import { convert, reverse } from 'suffix-thumb'
import model from '../models.js'
let { fs, mp, fp } = model.adjectives

const revFemale = reverse(fs)
const revPlural = reverse(mp)
const revFemalePlural = reverse(fp)

const toFemale = (str) => convert(str, fs)
const toPlural = (str) => convert(str, mp)
// female-singular -> female-plural model ('bella' -> 'belle')
const toFemalePlural = (str) => convert(toFemale(str), fp)

const fromFemale = (str) => convert(str, revFemale)
const fromPlural = (str) => convert(str, revPlural)
// 'meravigliose' -> 'meraviglioso'
const fromFemalePlural = (str) => fromFemale(convert(str, revFemalePlural))

const all = function (str) {
  let arr = [
    str,
    toFemale(str),
    toPlural(str),
    toFemalePlural(str),
  ].filter(s => s)
  return arr
}

export default {
  all,
  toFemale, toPlural, toFemalePlural,
  fromFemale, fromPlural, fromFemalePlural,
}

// "ridicola",
// "ridicoli",
// "ridicole"
// console.log(toFemale(toPlural("ridicolo")))
// console.log(toPlural("ridicolo"))