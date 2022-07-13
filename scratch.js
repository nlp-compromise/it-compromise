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
txt = 'il cappello nero, i cappelli neri '
// txt = 'la bella macchina, le belle macchine '
txt = 'il ginocchio. le ginocchia. i ginocchi  '
txt = 'considerata'
txt = 'considerati'
txt = 'ventidue'
txt = 'quattro'
txt = 'ne ho ottantacinque'
txt = 'ne ho milleduecentosessantasette'
txt = 'cinquantasei'
txt = 'centosessantasette'
// all’
// nell’
// sull’

/*

*/
let doc = nlp(txt).debug()
console.log(doc.numbers().get())