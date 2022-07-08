const pr = ['Pronoun', 'Possessive']

export default {

  'è': ['Copula', 'PresentTense'],

  'il': 'Article',
  'lo': 'Article',
  'la': 'Article',
  'l': 'Article',//l’
  'i': 'Article',
  'gli': 'Article',
  'le': 'Article',
  'dei': 'Article',


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

  se: 'Condition',//if
  si: 'Condition',//if
  'nel caso che': 'Condition',//in the event that

  'non': 'Negative',//
  'nessuno': 'Negative',// (nobody/no one)
  'niente': 'Negative',// (nothing)
  'nulla': 'Negative',// (nothing)
  'mai': 'Negative',// (never)

  // auxiliary verbs
  // be
  'sono': ['Copula', 'Auxiliary'],
  'sei': ['Copula', 'Auxiliary'],
  'lei': ['Copula', 'Auxiliary'],
  'lei è': ['Copula', 'Auxiliary'],
  'siamo': ['Copula', 'Auxiliary'],
  'siete': ['Copula', 'Auxiliary'],
  // have
  'ho': 'Auxiliary',
  'hai': 'Auxiliary',
  'lei ha': 'Auxiliary',
  'abbiamo': 'Auxiliary',
  'avete': 'Auxiliary',
  'hanno': 'Auxiliary',

}
