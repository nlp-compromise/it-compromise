import { convert, reverse } from 'suffix-thumb'
import model from '../models.js'
let { female, plural } = model.adjective

const revFemale = reverse(female)
const revPlural = reverse(plural)

const toFemale = (str) => convert(str, female)
const toPlural = (str) => convert(str, plural)
const toFemalePlural = (str) => toPlural(toFemale(str))

const fromFemale = (str) => convert(str, revFemale)
const fromPlural = (str) => convert(str, revPlural)

export default {
  toFemale, toPlural, toFemalePlural,
  fromFemale, fromPlural,
}

