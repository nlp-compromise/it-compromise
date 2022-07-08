const pr = ['Pronoun', 'Possessive']

export default {

  'il': 'Article',
  'lo': 'Article',
  'la': 'Article',
  'l': 'Article',//l’
  'i': 'Article',
  'gli': 'Article',
  'le': 'Article',
  'dei': 'Article',


  'un': 'Article',//un amico  »  a friend (m)
  'una': 'Article',//una ragazza  »  a girl
  'uno': 'Article',//uno stato  »  a state (m)

  // possessive pronous
  'mio': pr,	//	Mine
  'tuo': pr,	//	Yours
  'suo': pr,	//	His/her
  'nostro': pr,	//	Ours
  'vostro': pr,	//	Yours
  'loro': pr,	//	Theirs
  'mia': pr,
  'tua': pr,
  'sua': pr,
  'nostra': pr,
  'vostra': pr,
  'miei': pr,//		Mine
  'tuoi': pr,//		Yours
  'suoi': pr,//		His/her
  'nostri': pr,//		Ours
  'vostri': pr,//		Yours
  'mie': pr,
  'tue': pr,
  'sue': pr,
  'nostre': pr,
  'vostre': pr,

  // se: 'Conjunction',
  si: 'Condition',//if
  'nel caso che': 'Condition',//in the event that

  'non': 'Negative',//
  'nessuno': 'Negative',// (nobody/no one)
  'niente': 'Negative',// (nothing)
  'nulla': 'Negative',// (nothing)
  'mai': 'Negative',// (never)

  // auxiliary verbs
  // be
  // 'sono': ['Copula', 'Auxiliary'],
  // 'sei': ['Copula', 'Auxiliary'],
  // 'lei': ['Copula', 'Auxiliary'],
  // 'lei è': ['Copula', 'Auxiliary'],
  // 'siamo': ['Copula', 'Auxiliary'],
  // 'siete': ['Copula', 'Auxiliary'],

  'sto': 'Copula',//	I am
  'stai': 'Copula',//	you are
  'sta': 'Copula',//	he/she/it is
  'stiamo': 'Copula',//	we are
  'state': 'Copula',//	you are
  'stanno': 'Copula',//	they are

  // Presente
  'sono': ['Copula', 'PresentTense'],
  'sei': ['Copula', 'PresentTense'],
  'è': ['Copula', 'PresentTense'],
  'siamo': ['Copula', 'PresentTense'],
  'siete': ['Copula', 'PresentTense'],
  // Imperfetto
  'ero': 'Copula',
  'eri': 'Copula',
  'era': 'Copula',
  'eravamo': 'Copula',
  'eravate': 'Copula',
  'erano': 'Copula',
  // Passato remoto
  'fui': ['Copula', 'PastTense'],
  'fosti': ['Copula', 'PastTense'],
  'fu': ['Copula', 'PastTense'],
  'fummo': ['Copula', 'PastTense'],
  'foste': ['Copula', 'PastTense'],
  'furono': ['Copula', 'PastTense'],
  // Futuro semplice
  'sarò': ['Copula', 'FutureTense'],
  'sarai': ['Copula', 'FutureTense'],
  'sarà': ['Copula', 'FutureTense'],
  'saremo': ['Copula', 'FutureTense'],
  'sarete': ['Copula', 'FutureTense'],
  'saranno': ['Copula', 'FutureTense'],
  // Passato prossimo
  'sono stato': ['Copula', 'PastTense'],
  'sei stato': ['Copula', 'PastTense'],
  'è stato': ['Copula', 'PastTense'],
  'è stata': ['Copula', 'PastTense'],
  'siamo stati': ['Copula', 'PastTense'],
  'siete stati': ['Copula', 'PastTense'],
  'sono stati': ['Copula', 'PastTense'],
  'sono state': ['Copula', 'PastTense'],
  // Trapassato prossimo
  'ero stato': ['Copula', 'PastTense'],
  'eri stato': ['Copula', 'PastTense'],
  'era stato': ['Copula', 'PastTense'],
  'era stata': ['Copula', 'PastTense'],
  'eravamo stati': ['Copula', 'PastTense'],
  'eravate stati': ['Copula', 'PastTense'],
  'erano stati': ['Copula', 'PastTense'],
  'erano state': ['Copula', 'PastTense'],
  // Trapassato remoto
  'fui stato': ['Copula', 'PastTense'],
  'fosti stato': ['Copula', 'PastTense'],
  'fu stato': ['Copula', 'PastTense'],
  'fu stata': ['Copula', 'PastTense'],
  'fummo stati': ['Copula', 'PastTense'],
  'foste stati': ['Copula', 'PastTense'],
  'furono stati': ['Copula', 'PastTense'],
  'furono state': ['Copula', 'PastTense'],
  // Futuro anteriore
  'sarò stato': 'Copula',
  'sarai stato': 'Copula',
  'sarà stato': 'Copula',
  'sarà stata': 'Copula',
  'saremo stati': 'Copula',
  'sarete stati': 'Copula',
  'saranno stati': 'Copula',
  'saranno state': 'Copula',
  // CONGIUNTIVO
  // Presente
  'sia': ['Copula', 'PresentTense'],
  // 'sia': 'Copula',
  // 'sia': 'Copula',
  // 'siamo': 'Copula',
  'siate': ['Copula', 'PresentTense'],
  'siano': ['Copula', 'PresentTense'],
  // Passato
  'sia stato': ['Copula', 'PastTense'],
  // 'sia stato': 'Copula',
  // 'sia stato': 'Copula',
  'sia stata': ['Copula', 'PastTense'],
  // 'siamo stati': 'Copula',
  'siate stati': ['Copula', 'PastTense'],
  'siano stati': ['Copula', 'PastTense'],
  'siano state': ['Copula', 'PastTense'],
  // Imperfetto
  'fossi': 'Copula',
  // 'fossi': 'Copula',
  'fosse': 'Copula',
  'fossimo': 'Copula',
  // 'foste': 'Copula',
  'fossero': 'Copula',
  // Trapassato
  'fossi stato': ['Copula', 'PastTense'],
  // 'fossi stato': 'Copula',
  'fosse stato': ['Copula', 'PastTense'],
  'fosse stata': ['Copula', 'PastTense'],
  'fossimo stati': ['Copula', 'PastTense'],
  // 'foste stati': ['Copula', 'PastTense'],
  'fossero stati': ['Copula', 'PastTense'],
  'fossero state': ['Copula', 'PastTense'],
  // CONDIZIONALE
  // Presente
  'sarei': ['Copula', 'PresentTense'],
  'saresti': ['Copula', 'PresentTense'],
  'sarebbe': ['Copula', 'PresentTense'],
  'saremmo': ['Copula', 'PresentTense'],
  'sareste': ['Copula', 'PresentTense'],
  'sarebbero': ['Copula', 'PresentTense'],
  // Passato
  'sarei stato': ['Copula', 'PastTense'],
  'saresti stato': ['Copula', 'PastTense'],
  'sarebbe stato': ['Copula', 'PastTense'],
  'sarebbe stata': ['Copula', 'PastTense'],
  'saremmo stati': ['Copula', 'PastTense'],
  'sareste stati': ['Copula', 'PastTense'],
  'sarebbero stati': ['Copula', 'PastTense'],
  'sarebbero state': ['Copula', 'PastTense'],
  // IMPERATIVO PRESENTE
  'sii': ['Copula', 'PresentTense'],
  // 'sia': 'Copula',
  // 'siamo': 'Copula',
  // 'siate': 'Copula',
  // 'siano': 'Copula',




  // have
  'ho': 'Auxiliary',
  'hai': 'Auxiliary',
  'lei ha': 'Auxiliary',
  'abbiamo': 'Auxiliary',
  'avete': 'Auxiliary',
  'hanno': 'Auxiliary',
  'aveva': 'Auxiliary',



}
