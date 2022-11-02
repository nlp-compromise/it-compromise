let data = {
  ones: [
    [1, 'uno', 'primo'],
    [2, 'due', 'secondo'],
    [3, 'tre', 'terzo'],
    [4, 'quattro', 'quarto'],
    [5, 'cinque', 'quinto'],
    [6, 'sei', 'sesto'],
    [7, 'sette', 'settimo'],
    [8, 'otto', 'ottavo'],
    [9, 'nove', 'nono'],
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
    [1000000000, 'miliardo', 'miliardesimo']
  ]
}


const toCardinal = {}
const toOrdinal = {}
const toNumber = {}
// add 'quarantuno'
data.tens.forEach(a => {
  let str = a[1].replace(/[ia]$/, 'uno')
  data.ones.push([a[0] + 1, str, str])
  str = a[1].replace(/[ia]$/, '')
  toNumber[str] = a[0] //'vent' = 20
})


Object.keys(data).forEach(k => {
  data[k].forEach(a => {
    let [num, card, ord] = a
    toCardinal[ord] = card
    toNumber[card] = num
    toOrdinal[card] = ord
  })
})
toNumber['tré'] = 3
toNumber['mila'] = 1000
toNumber['zero'] = 0

// list end-strings, for tokenization
let ends = ['cento', 'mille', 'milione', 'tré', 'mila']
data.ones.forEach(a => {
  ends.push(a[1])
})
data.tens.forEach(a => {
  ends.push(a[1])
})
data.hundreds.forEach(a => {
  ends.push(a[1])
})
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
export { toCardinal, toOrdinal, toNumber, data, ends, multiples }