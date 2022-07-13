const pr = ['Pronoun', 'Possessive']
import aux from './aux.js'

let misc = {

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



  'può': 'Verb',
  'oggi': ['Date', 'Noun'],
  'formula': 'Noun',
  'fa': 'Verb',
  'deve': 'Verb',
  'stata': 'Verb',
  'stato': 'Verb',
  'stati': 'Verb',
  'diretto': 'Adjective',
  'fondata': 'Adjective',
  'presenti': 'Adjective',
  'situata': 'Adjective',
  'legato': 'Adjective',
  'dotato': 'Adjective',
  'pubblicata': 'Adjective',
  'perse': 'Adjective',
  'perso': 'Adjective',
  'dotata': 'Adjective',
  'definita': 'Adjective',
  'dovuta': 'Adjective',
  'legati': 'Adjective',
  'chiamata': 'Verb',
  'chiamati': 'Verb',
  // 'poter': 'Verb',
  'va': 'Verb',
  'sia': 'Verb',
  'ottenne': 'Verb',
  'utilizzata': 'Verb',
  'avvenuta': 'Verb',
  'porta': 'Noun',
  'fatto': 'Noun',
  'posto': 'Noun',
}
Object.assign(misc, aux)
export default misc
