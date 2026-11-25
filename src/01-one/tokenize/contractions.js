export default [
  { word: `c'è`, out: ['ci', 'è'] },
  { word: `v'è`, out: ['vi', 'è'] },
  { word: `l'ho`, out: ['lo', 'ho'] },
  // a 'before' rule needs three letters after it, so these short ones are spelled-out
  { word: `l'ha`, out: ['lo', 'ha'] },
  { word: `l'è`, out: ['lo', 'è'] },
  { word: `m'ha`, out: ['mi', 'ha'] },
  { word: `m'è`, out: ['mi', 'è'] },
  { word: `t'ho`, out: ['ti', 'ho'] },
  { word: `t'ha`, out: ['ti', 'ha'] },
  { word: `t'è`, out: ['ti', 'è'] },
  { word: `s'è`, out: ['si', 'è'] },
  { word: `c'ha`, out: ['ci', 'ha'] },
  { word: `v'ho`, out: ['vi', 'ho'] },
  { word: `v'ha`, out: ['vi', 'ha'] },
  { word: `n'è`, out: ['ne', 'è'] },
  { word: `dov'è`, out: ['dove', 'è'] },
  { word: `com'è`, out: ['come', 'è'] },
  { word: `cos'è`, out: ['cosa', 'è'] },
  { word: `quand'è`, out: ['quando', 'è'] },
  { word: `qual'è`, out: ['quale', 'è'] },
  { word: `l'abbiamo`, out: ['lo', 'abbiamo'] },
  { before: `c`, out: ['ci'] },//c'era, c'erano
  { before: `d`, out: ['di'] },//d'accordo, d'estate
  { before: `dov`, out: ['dove'] },
  { before: `com`, out: ['come'] },
  { before: `cos`, out: ['cosa'] },//cos'era
  { before: `quand`, out: ['quando'] },//quand'ero
  { before: `quest`, out: ['questo'] },//quest'anno
  { before: `quell`, out: ['quello'] },//quell'uomo
  { before: `sant`, out: ['santo'] },//sant'antonio
  { before: `tutt`, out: ['tutto'] },//tutt'altro
  { before: `mezz`, out: ['mezzo'] },//mezz'ora
  { before: `anch`, out: ['anche'] },//anch'io
  { before: `nessun`, out: ['nessuna'] },//nessun'altra
  { before: `senz`, out: ['senza'] },//senz'altro
  { before: `l`, out: ['lo'] },//or la
  { before: `v`, out: ['vi'] },
  { before: `s`, out: ['si'] },
  { before: `m`, out: ['mi'] },
  { before: `t`, out: ['ti'] },//t'amo
  { before: 'un', out: ['una'] },//un'amica
  { before: 'all', out: ['a', 'l'] },
  { before: 'dell', out: ['di', 'l'] },
  { before: 'nell', out: ['in', 'l'] },
  { before: 'sull', out: ['su', 'l'] },
  { before: 'coll', out: ['con', 'l'] },
  { before: 'dall', out: ['da', 'l'] },
]
