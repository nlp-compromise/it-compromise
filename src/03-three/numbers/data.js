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
    [200, 'duocento', 'duecentesimo'],//due
    [300, 'trecento', 'trecentesimo'],
    [400, 'quattrocento', 'quattrocentesimo'],
    [500, 'cinquecento', 'cinquecentesimo'],
    [600, 'seicento', 'seicentesimo'],
    [700, 'settecento', 'settecentesimo'],
    [800, 'ottocento', 'ottocentesimo'],
    [900, 'novecento', 'novecentesimo'],
  ],
  multiples: [
    [1000, 'mille'],
    [1000000, 'milione']
  ]
}


const toCardinal = {}
const toNumber = {}

Object.keys(data).forEach(k => {
  data[k].forEach(a => {
    let [num, card, ord] = a
    toCardinal[ord] = card
    toNumber[card] = num
  })
})

export { toCardinal, toNumber, data }
