import { toOrdinal, tens } from '../data.js'

// which form should we use - 'quarto' or 'quattresimo'?
const combos = {
  'uno': ['primo', 'unesimo'],
  'due': ['secondo', 'duesimo'],
  'tre': ['terzo', 'treesimo'],
  'quattro': ['quarto', 'quattresimo'],
  'cinque': ['quinto', 'cinquesimo'],
  'sei': ['sesto', 'seiesimo'],
  'sette': ['settimo', 'settesimo'],
  'otto': ['ottavo', 'ottesimo'],
  'nove': ['nono', 'novesimo'],
}
combos['tré'] = combos.tre


const toTextOrdinal = function (words) {
  if (words.length === 2 && words[0] === 'dieci' && words[1] === 'mila') {
    return 'decimillesimo'
  }
  // only convert the last word
  let last = words[words.length - 1]
  // which form should we use - 'quarto' or 'quattresimo'?
  if (combos.hasOwnProperty(last) && words.length > 1) {
    if (tens.hasOwnProperty(words[words.length - 2])) {
      // quattresimo
      words[words.length - 1] = combos[last][1]
    } else {
      // quarto
      words[words.length - 1] = combos[last][0]
    }
  } else if (toOrdinal.hasOwnProperty(last)) {
    words[words.length - 1] = toOrdinal[last]
  }
  let txt = words.join('')
  txt = txt.replace(/centoottan/, 'centottan')
  txt = txt.replace(/diecimilion/, 'decimilion')
  return txt
}

export default toTextOrdinal