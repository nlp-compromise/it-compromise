import { convert, reverse } from 'suffix-thumb'
import model from '../models.js'
let { plural } = model.nouns

const revPlural = reverse(plural)

const toPlural = (str) => convert(str, plural)

const fromPlural = (str) => convert(str, revPlural)

export default {
  toPlural, fromPlural,
}


// console.log(toPlural('abboccamento'))
// console.log(fromPlural('abboccamenti'))