import { convert, reverse } from 'suffix-thumb'
import model from '../models.js'
let { fs, mp } = model.adjectives

const revFemale = reverse(fs)
const revPlural = reverse(mp)

const toFemale = (str) => convert(str, fs)
const toPlural = (str) => convert(str, mp)
const toFemalePlural = (str) => toPlural(toFemale(str))

const fromFemale = (str) => convert(str, revFemale)
const fromPlural = (str) => convert(str, revPlural)

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
  fromFemale, fromPlural,
}

// "ridicola",
// "ridicoli",
// "ridicole"
// console.log(toFemale(toPlural("ridicolo")))
// console.log(toPlural("ridicolo"))