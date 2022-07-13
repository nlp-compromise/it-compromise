let irreg = [
  //essere (to be; auxiliary)
  ['sono', 'ero', 'fui', 'sarò', 'sia', 'fossi', 'sarei'],
  ['sei', 'eri', 'fosti', 'sarai', 'sia', 'fossi', 'saresti'],
  ['è', 'era', 'fu', 'sarà', 'sia', 'fosse', 'sarebbe'],
  ['siamo', 'eravamo', 'fummo', 'saremo', 'siamo', 'fossimo', 'saremmo'],
  ['siete', 'eravate', 'foste', 'sarete', 'siate', 'foste', 'sareste'],
  ['sono', 'erano', 'furono', 'saranno', 'siano', 'fossero', 'sarebbero'],

  //stare (to stay; auxiliary)
  ['sto', 'stavo', 'stetti', 'starò', 'stia', 'stessi', 'starei'],
  ['stai', 'stavi', 'stesti', 'starai', 'stia', 'stessi', 'staresti'],
  ['sta', 'stava', 'stette', 'starà', 'stia', 'stesse', 'starebbe'],
  ['stiamo', 'stavamo', 'stemmo', 'staremo', 'stiamo', 'stessimo', 'staremmo'],
  ['state', 'stavate', 'steste', 'starete', 'stiate', 'steste', 'stareste'],
  ['stanno', 'stavano', 'stettero', 'staranno', 'stiano', 'stessero', 'starebbero'],

  //avere (to have; auxiliary)
  ['ho', 'avevo', 'ebbi', 'avrò', 'abbia', 'avessi', 'avrei'],
  ['hai', 'avevi', 'avesti', 'avrai', 'abbia', 'avessi', 'avresti'],
  ['ha', 'aveva', 'ebbe', 'avrà', 'abbia', 'avesse', 'avrebbe'],
  ['abbiamo', 'avevamo', 'avemmo', 'avremo', 'abbiamo', 'avessimo', 'avremmo'],
  ['avete', 'avevate', 'aveste', 'avrete', 'abbiate', 'aveste', 'avreste'],
  ['hanno', 'avevano', 'ebbero', 'avranno', 'abbiano', 'avessero', 'avrebbero'],

  //dovere (to have to, must, should; modal)
  ['devo', 'dovevo', 'dovetti', 'dovrò', 'debba', 'dovessi', 'dovrei'],
  ['devi', 'dovevi', 'dovesti', 'dovrai', 'debba', 'dovessi', 'dovresti'],
  ['deve', 'doveva', 'dovette', 'dovrà', 'debba', 'dovesse', 'dovrebbe'],
  ['dobbiamo', 'dovevamo', 'dovemmo', 'dovremo', 'dobbiamo', 'dovessimo', 'dovremmo'],
  ['dovete', 'dovevate', 'doveste', 'dovrete', 'dobbiate', 'doveste', 'dovreste'],
  ['devono', 'dovevano', 'dovettero', 'dovranno', 'debbano', 'dovessero', 'dovrebbero'],

  //potere (to be able to, can, could; modal)
  ['posso', 'potevo', 'potei', 'potrò', 'possa', 'potessi', 'potrei'],
  ['puoi', 'potevi', 'potesti', 'potrai', 'possa', 'potessi', 'potresti'],
  ['può', 'poteva', 'poté', 'potrà', 'possa', 'potesse', 'potrebbe'],
  ['possiamo', 'potevamo', 'potemmo', 'potremo', 'possiamo', 'potessimo', 'potremmo'],
  ['potete', 'potevate', 'poteste', 'potrete', 'possiate', 'poteste', 'potreste'],
  ['possono', 'potevano', 'poterono', 'potranno', 'possano', 'potessero', 'potrebbero'],

  // volere (to want, will, would); modal)
  ['voglio', 'volevo', 'volli', 'vorrò', 'voglia', 'volessi', 'vorrei'],
  ['vuoi', 'volevi', 'volesti', 'vorrai', 'voglia', 'volessi', 'vorresti'],
  ['vuole', 'voleva', 'volle', 'vorrà', 'voglia', 'volesse', 'vorrebbe'],
  ['vogliamo', 'volevamo', 'volemmo', 'vorremo', 'vogliamo', 'volessimo', 'vorremmo'],
  ['volete', 'volevate', 'voleste', 'vorrete', 'vogliate', 'voleste', 'vorreste'],
  ['vogliono', 'volevano', 'vollero', 'vorranno', 'vogliano', 'volessero', 'vorrebbero'],

  // sapere (to be able to)
  ['so', 'sapevo', 'seppi', 'saprò', 'sappia', 'sapessi', 'saprei'],
  ['sai', 'sapevi', 'sapesti', 'saprai', 'sappia', 'sapessi', 'sapresti'],
  ['sa', 'sapeva', 'seppe', 'saprà', 'sappia', 'sapesse', 'saprebbe'],
  ['sappiamo', 'sapevamo', 'sapemmo', 'sapremo', 'sappiamo', 'sapessimo', 'sapremmo'],
  ['sapete', 'sapevate', 'sapeste', 'saprete', 'sappiate', 'sapeste', 'sapreste'],
  ['sanno', 'sapevano', 'seppero', 'sapranno', 'sappiano', 'sapessero', 'saprebbero'],
]

let lex = {}
let forms = [
  'PresentTense',
  'PastTense',
  'PastTense',
  'FutureTense',
  'PresentTense',
  'PastTense',
  'ConditionalVerb',
]
irreg.forEach(line => {
  line.forEach((w, i) => {
    lex[w] = lex[w] || forms[i]
  })
})

const vb = 'Verb'
// auxiliary verbs
let misc = {
  //alt
  'debbo': vb,
  'debbono': vb,
  // make
  'faccio': vb,
  'fai': vb,
  'fa': vb,
  'facciamo': vb,
  'fate': vb,
  'fanno': vb,
  'facevo': vb,
  'facevi': vb,
  'faceva': vb,
  'facevamo': vb,
  'facevate': vb,
  'facevano': vb,
  'feci': vb,
  'facesti': vb,
  'fece': vb,
  'facemmo': vb,
  'faceste': vb,
  'fecero': vb,
  'farò': vb,
  'farai': vb,
  'farà': vb,
  'faremo': vb,
  'farete': vb,
  'faranno': vb,
  'fatto': vb,
  'faccia': vb,
  'facciate': vb,
  'facciano': vb,
  'facessi': vb,
  'facesse': vb,
  'facessimo': vb,
  'facessero': vb,
  'farei': vb,
  'faresti': vb,
  'farebbe': vb,
  'faremmo': vb,
  'fareste': vb,
  'farebbero': vb,

  // ==venir come==
  'vengo': vb,
  'vieni': vb,
  'viene': vb,
  'veniamo': vb,
  'venite': vb,
  'vengono': vb,
  'venivo': vb,
  'venivi': vb,
  'veniva': vb,
  'venivamo': vb,
  'venivate': vb,
  'venivano': vb,
  'venni': vb,
  'venisti': vb,
  'venne': vb,
  'venimmo': vb,
  'veniste': vb,
  'vennero': vb,
  'verrò': vb,
  'verrai': vb,
  'verrà': vb,
  'verremo': vb,
  'verrete': vb,
  'verranno': vb,
  'venuto': vb,
  'venuta': vb,
  'venuti': vb,
  'venute': vb,
  'venga': vb,
  'veniate': vb,
  'vengano': vb,
  'venissi': vb,
  'venisse': vb,
  'venissimo': vb,
  'venissero': vb,
}
lex = Object.assign(lex, misc)
export default lex