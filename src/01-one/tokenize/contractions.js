export default [
  { word: `c'è`, out: ['ci', 'è'] },
  { word: `v'è`, out: ['vi', 'è'] },
  { word: `l'ho`, out: ['lo', 'ho'] },
  { word: `l'abbiamo`, out: ['lo', 'abbiamo'] },
  { before: `c`, out: ['ci'] },//c'era, c'erano
  { before: `d`, out: ['di'] },//d'accordo, d'estate
  { before: `dov`, out: ['dove'] },
  { before: `com`, out: ['come'] },
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
