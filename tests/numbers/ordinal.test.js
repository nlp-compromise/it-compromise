import test from 'tape'
import nlp from '../_lib.js'
let here = '[number-ordinal] '
nlp.verbose(false)

let arr = [
  ['uno', 'primo'],//1,
  ['due', 'secondo'],//2,
  ['tre', 'terzo'],//3,
  ['quattro', 'quarto'],//4,
  ['cinque', 'quinto'],//5,
  ['sei', 'sesto'],//6,
  ['sette', 'settimo'],//7,
  ['otto', 'ottavo'],//8,
  ['nove', 'nono'],//9,
  ['dieci', 'decimo'],//10,
  ['undici', 'undicesimo'],//11,
  ['dodici', 'dodicesimo'],//12,
  ['tredici', 'tredicesimo'],//13,
  ['quattordici', 'quattordicesimo'],//14,
  ['quindici', 'quindicesimo'],//15,
  ['sedici', 'sedicesimo'],//16,
  ['diciassette', 'diciassettesimo'],//17,
  ['diciotto', 'diciottesimo'],//18,
  ['diciannove', 'diciannovesimo'],//19,
  ['venti', 'ventesimo'],//20,
  ['ventisei', 'ventiseiesimo'],//26,
  ['trenta', 'trentesimo'],//30,
  ['trentasei', 'trentaseiesimo'],//36,
  ['quaranta', 'quarantesimo'],//40,
  ['quarantasei', 'quarantaseiesimo'],//36,
  ['cinquanta', 'cinquantesimo'],//50,
  ['sessanta', 'sessantesimo'],//60,
  ['settanta', 'settantesimo'],//70,
  ['ottanta', 'ottantesimo'],//80,
  ['novanta', 'novantesimo'],//90,
  ['cento', 'centesimo'],//100,
  ['duecento', 'duecentesimo'],//200,
  ['trecento', 'trecentesimo'],//300,
  ['quattrocento', 'quattrocentesimo'],//400,
  ['cinquecento', 'cinquecentesimo'],//500,
  ['seicento', 'seicentesimo'],//600,
  ['settecento', 'settecentesimo'],//700,
  ['ottocento', 'ottocentesimo'],//800,
  ['novecento', 'novecentesimo'],//900,
  ['mille', 'millesimo'],//1000,
  ['diecimila', 'decimillesimo'],//10000,
  ['centomila', 'centomillesimo'],//100000,
  ['milione', 'milionesimo'],//1000000,
  ['miliardo', 'miliardesimo'],//1000000000,

  ['24', '24°'],
  ['17', '17°'],
  ['107', '107°']
]

test('ordinal-tag:', function (t) {
  arr.forEach(a => {
    let str = a[1]
    let doc = nlp(str)
    let m = doc.numbers()
    t.equal(m.found, true, here + '[ordinal-tag] ' + str)
  })
  t.end()
})

test('number-toOrdinal:', function (t) {
  arr.forEach(a => {
    let [card, ord] = a
    let doc = nlp(card)
    let m = doc.numbers().toOrdinal()
    t.equal(m.text(), ord, here + '[toOrdinal] ' + card)
  })
  t.end()
})
test('number-toCardinal:', function (t) {
  arr.forEach(a => {
    let [card, ord] = a
    let doc = nlp(ord)
    let m = doc.numbers().toCardinal()
    t.equal(m.text(), card, here + '[toCarrdinal] ' + ord)
  })
  t.end()
})