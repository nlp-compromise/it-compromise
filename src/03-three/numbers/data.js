let data = {
  ones: [
    [1, 'uno', 'primo', 'unesimo'],
    [2, 'due', 'secondo', 'duesimo'],
    [3, 'tre', 'terzo', 'treesimo'],
    [4, 'quattro', 'quarto', 'quattresimo'],
    [5, 'cinque', 'quinto', 'cinquesimo'],
    [6, 'sei', 'sesto', 'seiesimo'],
    [7, 'sette', 'settimo', 'settesimo'],
    [8, 'otto', 'ottavo', 'ottesimo'],
    [9, 'nove', 'nono', 'novesimo'],
    [10, 'dieci', 'decimo'],
    [11, 'undici', 'undicesimo'],
    [12, 'dodici', 'dodicesimo'],
    [13, 'tredici', 'tredicesimo'],
    [14, 'quattordici', 'quattordicesimo'],
    [15, 'quindici', 'quindicesimo'],
    [16, 'sedici', 'sedicesimo'],
    [17, 'diciassette', 'diciassettesimo'],
    [18, 'diciotto', 'diciottesimo'],
    [19, 'diciannove', 'diciannovesimo'],
  ],
  tens: [
    [20, 'venti', 'ventesimo'],
    [30, 'trenta', 'trentesimo'],
    [40, 'quaranta', 'quarantesimo'],
    [50, 'cinquanta', 'cinquantesimo'],
    [60, 'sessanta', 'sessantesimo'],
    [70, 'settanta', 'settantesimo'],
    [80, 'ottanta', 'ottantesimo'],
    [90, 'novanta', 'novantesimo'],
  ],
  hundreds: [
    [100, 'cento', 'centesimo'],
    [200, 'duecento', 'duecentesimo'],
    [300, 'trecento', 'trecentesimo'],
    [400, 'quattrocento', 'quattrocentesimo'],
    [500, 'cinquecento', 'cinquecentesimo'],
    [600, 'seicento', 'seicentesimo'],
    [700, 'settecento', 'settecentesimo'],
    [800, 'ottocento', 'ottocentesimo'],
    [900, 'novecento', 'novecentesimo'],
  ],
  multiples: [
    [1000, 'mille', 'millesimo'],
    [10000, 'diecimila', 'decimillesimo'],
    [100000, 'centomila', 'centomillesimo'],
    [1000000, 'milione', 'milionesimo'],
    [100000000, 'centomilion', 'centomilionesimo'],
    [1000000000, 'miliardo', 'miliardesimo']
  ]
}


const toCardinal = {}
const toOrdinal = {}
const tens = {
  'trent': true,
  'vent': true,
  'cinquant': true,
  'sessant': true,
  'ottant': true,
  'settant': true,
  'quarant': true,
  'novant': true,
  'cento': true,
  'mille': true
}
const toNumber = {
  'dicias': 10,//diciassettesimo
  'dician': 10,//diciannovesimo
  'dici': 10,//diciottesimo
  'deci': 10,//decimilionesimo
  'cent': 100,//centottantesimo
}
// list end-strings, for tokenization
let ends = ['cento', 'mille', 'milione', 'tré', 'mila', 'seiesimo', 'dodicesimo', 'decimo']

// add 'quarantuno'
data.tens.forEach(a => {
  let str = a[1].replace(/[ia]$/, 'uno')
  data.ones.push([a[0] + 1, str, str])
  str = a[1].replace(/[ia]$/, '')
  toNumber[str] = a[0] //'vent' = 20
  tens[a[1]] = true
})

Object.keys(data).forEach(k => {
  data[k].forEach(a => {
    let [num, card, ord, ord2] = a
    ends.push(card)
    ends.push(ord)
    toCardinal[ord] = card
    toNumber[card] = num
    toOrdinal[card] = ord
    // 'twenty-sixth'
    if (ord2) {
      toCardinal[ord2] = card
      ends.push(ord2)
    }
  })
})
toNumber['tré'] = 3
toNumber['mila'] = 1000
toNumber['zero'] = 0

// sort by length (longest first)
ends = ends.sort((a, b) => {
  if (a.length > b.length) {
    return -1
  } else if (a.length < b.length) {
    return 1
  }
  return 0
})

let multiples = {
  mila: 1000,
}
data.multiples.forEach(a => {
  multiples[a[1]] = a[0]
})

// 'dieci|mila'
toOrdinal['mila'] = 'millesimo'
// ventiseiesimo
toOrdinal['seiesimo'] = 'sei'
toNumber['seiesimo'] = 6


export { toCardinal, toOrdinal, toNumber, data, ends, multiples, tens }