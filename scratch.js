import nlp from './src/index.js'

// nlp.verbose('tagger')

// https://www.langeasy.com/italiansongs1en/
let txt = ''

txt = `Il libro dell’insegnante`
txt = `sedicesimo`
txt = `lui corre rapidamente `
txt = 'Sto venendo ora dall’ufficio'//I’m coming from the office
txt = 'Il treno è arrivato ora da Milano'//The train just arrived from Milan
txt = 'Nel pomeriggio vado da Marco'//In the afternoon I’ll go to Marco’s place
txt = 'Come ti chiami?'
txt = 'abballotti'
txt = 'atteggiamenti naturali'
txt = 'Sto scrivendo una lettera.'
txt = 'agguantiamo'
txt = 'ammasserei'
txt = 'Siamo andati a casa.'
txt = `nella battaglia`
txt = `possono`
txt = `potere`
txt = `autoprodurre`
txt = `vetrioleggiando`
txt = `avevano`
txt = `chiamare`
txt = `con l'autoradio sempre nella mano destra`
txt = `un canarino sopra la finestra`
// txt = `con la crema da barba da menta`
// txt = `con un vestito gessato sul blu`
// txt = `e la moviola la domenica in TV`
// txt = 'c'
// txt = 'trasporre'
txt = 'Ripensandoci, credo che non fosse colpa sua.'
txt = 'Sentendomi male sono andato a letto.'
txt = 'Ho guidato al negozio'
// all’
// nell’
// sull’

// 'stato',      'possono',        'aver',        'sia',
// 'far',        'fa',             'fatto',       'diretto',
// 'poter',      'va',             'porta',       'veniva',
// 'composto',   'usata',          'potrebbe',    'utilizzata',
// 'poteva',     'venivano',       'devono',      'fondata',
// 'possa',      'doveva',         'considerata', 'diede',
// 'stava',      'nato',           'utilizzati',  'scritti',
// 'decise',     'composta',       'conosciuta',  'vive',
// 'continua',   'fatta',          'presenti',    'dedicata',
// 'esser',      'ottenne',        'vince',       'costruita',
// 'vanno',      'situata',        'chiamati',    'conosciuto',
// 'costituita', 'usati',          'seguito',     'legato',
// 'dotato',     'fondato',        'sconfitto',   'ricevette',
// 'possiede',   'dovette',        'scritta',     'pubblicata',
// 'perse',      'posto',          'prodotta',    'considerati',
// 'avvenuta',   'vide',           'morto',       'provenienti',
// '',           'diretta',        'potevano',    'realizzata',
// 'pubblicati', 'perso',          'dotata',      'definita',
// 'realizzati', 'potrebbero',     'dovuta',      'basata',
// 'denominata', 'vista',          'proveniente', 'che',
// 'potesse',    'diventata',      'creata',      'intitolata',
// 'dotati',     'contenente',     'trovava',     'rappresentata',
// 'sposato',    'caratterizzata', 'riviste',     'sviluppata',
// 'legata',     'subito',         'incantesimo', 'eseguita',
// 'nota',       'potuto',         'render',      'formata',


// console.log(nlp.model().one.lexicon['abbaruffato'])
// console.log(nlp.world())
let doc = nlp(txt).debug()
doc.compute('root')
doc.match('{guidare}').debug()
console.log(doc.has('{guidare} al #Noun'))
// doc.debug()
// console.log(doc.verbs().conjugate())
// console.log(doc.verbs().json())
// console.log(doc.docs[0])