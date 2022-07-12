import nlp from './src/index.js'

nlp.verbose('tagger')

// https://www.langeasy.com/italiansongs1en/
let txt = ''

txt = `Con l'autoradio sempre nella mano destra`
txt = `Il libro dell’insegnante`
txt = `sedicesimo`
txt = `lui corre rapidamente `
txt = 'Sto venendo ora dall’ufficio'//I’m coming from the office
txt = 'Il treno è arrivato ora da Milano'//The train just arrived from Milan
txt = 'Nel pomeriggio vado da Marco'//In the afternoon I’ll go to Marco’s place
txt = 'Come ti chiami?'
txt = 'abballotti'
txt = 'atteggiamenti naturali'
txt = 'Sentendomi male sono andato a letto.'
txt = 'Sto scrivendo una lettera.'
txt = 'agguantiamo'
txt = 'ammasserei'
txt = 'Siamo andati a casa.'
txt = `nella battaglia`
// txt = 'c'
// txt = 'trasporre'
// txt = 'Ripensandoci, credo che non fosse colpa sua.'
// all’
// nell’
// sull’

// console.log(nlp.model().one.lexicon['abbaruffato'])
// console.log(nlp.world())

// 'sua',         'suo',          'loro',             'suoi',
// 'altri',       'proprio',      'gran',             'propri',
// 'vari',        'tali',         'pari',             'prime',
// 'ex',          'soli',         'singoli',          'antichi',
// 'politiche',   'antiche',      'blu',              'euro',
// 'lunghi',      'mio',          'nostro',           'lunghe',
// 'punk',        'economiche',   'vecchi',           '',
// 'mia',         'pop',          'tecniche',         'pubbliche',
// 'necessari',   'tedeschi',     'nostra',           'fisiche',
// 'specifiche',  'storiche',     'socialisti',       'nostri',
// 'rossi',       'molteplici',   'svariati',         'innumerevoli',
// 'scritte',     'ricchi',       'greche',           'tedesche',
// 'tipiche',     'saggi',        'finanziari',       'britanniche',
// 'bianchi',     'distinti',     'ampi',             'open',
// 'tua',         'artistiche',   'tuo',              'nord',
// 'ricche',      'nemici',       'svariate',         'super',
// 'comunisti',   'provenienti',  'cinematografiche', 'scientifiche',
// 'sacri',       'curve',        'dette',            'nutrienti',
// 'chimiche',    'altrui',       'animati',          'magiche',
// 'liquidi',     'originari',    'elettriche',       'meccaniche',
// 'du',          'classiche',    'miei',             'secondari',
// 'dispositivi', 'partecipanti', 'metalliche',       'geologiche',
// 'nostre',      'analoghi',     'architettoniche',  'cellulari',
// 'letterari',   'cantate',      'circolari',        'e',
// 'mediche',     'esteri',       'distinte',         'gialloblu',
let doc = nlp(txt)
doc.compute('root')
doc.debug()
// console.log(doc.verbs().conjugate())
// console.log(doc.verbs().json())
// console.log(doc.docs[0])