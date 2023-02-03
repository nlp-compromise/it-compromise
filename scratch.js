import nlp from './src/index.js'

nlp.verbose('tagger')
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
  // 'voglio vedere un vulcano', //i want to see a volcano
  // 'Sono stato nel parco',//I've been in the park
  // `c'è and v'è`,
  // `dimmi che bello`,
  // `buttarti giù`,// – to bring you down
  'abbinante',
  'che voi colmiate',
  'abbellisca',
  'berciavi',
  'che io colmi',
  'avevo mangiato',
  'Oggi ci siamo vestiti male.',// Today we dressed badly.
  'Mi siedo un attimo.',// I am going to sit for a minute.
  'Le bambine si sono sedute sul prato.',// The little girls sat on the lawn.
  'Ho voluto mangiare la pizza.',//I wanted to eat a pizza(and I did).
  'Ho dovuto visitare la nonna.',//I had to / was obliged to visit grandma(and I did).
  'Ho potuto parlare con Giorgio.',//I was able to talk with Giorgio(and I did).
  'Potevano venire ma non sono venuti.',//They could come but they didn't.
  'Sarebbero potuti venire ma non sono venuti.',//They could have come but they didn't.
  'Lo dovevo vedere ieri.',//I was supposed to see him yesterday
  'A scuola ieri Lina non ha voluto leggere.',//Yesterday at school Lina did not want to read(and did not).
  'Ieri ho dovuto leggere un libro intero per il mio esame.',//Yesterday I had to read a whole book for my exam.
  'Ieri non ho potuto leggere il giornale perché non ho avuto tempo.',//Yesterday I was not able to read the paper because I didn't have time.
  'Marco ha voluto cenare presto.',//Marco wanted to have dinner early(and he did).
  'Avremmo dovuto cenare prima.',//We should have had dinner earlier.
  'Non abbiamo potuto cenare prima.',//We were not able to have dinner earlier.
  'Gli ho dovuto dare il libro, or, ho dovuto dargli il libro.',//I had to give him the book.
  'Non gli ho potuto parlare, or, non ho potuto parlargli.',//I was not able to speak with him,
  'Glielo ho voluto dare, or, ho voluto darglielo.',//I had to give it to him,
  'Gli posso dare il gelato?',// Can I give him the ice cream?

  'Priscilla Lane gli dice che il pezzo è bellissimo ', //Priscilla Lane tells him the piece is beautiful
  'un accordo globale formale che porti livelli più elevati',//a formal global agreement leading to higher standards
  'In effetti in un mondo imprevedibile dove le vecchie minacce sono aggravate ',//Indeed in an unpredictable world where old threats are compounded
  'Inoltre tali informazioni dovrebbero ',//Also such information should
  'Ma mi è stato detto che solo i pazienti bisognosi',//But I was told only patients in need
  'Un recente rapporto del Pentagono non ha parsimonia La storia',//A recent Pentagon report does not spare the story
  'Chiaramente però se nessuno ha sentito',//Clearly though if no one has heard
  'Le misure di assistenza', //assistance measures
]
// let doc = nlp('permettersi').debug()
// let doc = nlp('ripararsi').debug()
// console.log(doc.verbs().conjugate())

let str = arr[0]
nlp(str).debug().match('[({volere}|{dovere})]', 0).debug()

// console.log(nlp('colmare').verbs().conjugate())