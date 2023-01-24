import nlp from './src/index.js'

// nlp.verbose('tagger')
let txt = ''
txt = `Il libro dell’insegnante`
txt = `sedicesimo`
txt = `lui corre rapidamente `
txt = 'Sto venendo ora dall’ufficio'//I’m coming from the office
txt = 'Il treno è arrivato ora da Milano'//The train just arrived from Milan
txt = 'Nel pomeriggio vado da Marco'//In the afternoon I’ll go to Marco’s place
txt = 'ventuno candeline'
txt = ' tue ossa '
txt = ' Andando come torte calde'
txt = ' pietre'

let arr = [
  'è rimasto calmo',
  'Sono stato nel parco',
  'voglio vedere un vulcano',
  'Priscilla Lane gli dice che il pezzo è bellissimo ',
  'un accordo globale formale che porti livelli più elevati',
  'In effetti in un mondo imprevedibile dove le vecchie minacce sono aggravate ',
  'Inoltre tali informazioni dovrebbero ',
  'Ma mi è stato detto che solo i pazienti bisognosi',
  'Un recente rapporto del Pentagono non ha parsimonia La storia',
  'Chiaramente però se nessuno ha sentito',
  'Le misure di assistenza',
]
// let doc = nlp('permettersi').debug()
// let doc = nlp('ripararsi').debug()
// console.log(doc.verbs().conjugate())

let str = arr[0]
nlp(str).debug().match('[({volere}|{dovere})]', 0).debug()
