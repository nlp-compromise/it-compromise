const pr = ['Pronoun', 'Possessive']
import aux from './aux.js'

let misc = {

  'il': 'Determiner',
  'lo': 'Determiner',
  'la': 'Determiner',
  'l': 'Determiner',//l’
  'i': 'Determiner',
  'gli': 'Determiner',
  'le': 'Determiner',
  'dei': 'Determiner',


  'un': 'Determiner',//un amico  »  a friend (m)
  'una': 'Determiner',//una ragazza  »  a girl
  'uno': 'Determiner',//uno stato  »  a state (m)

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

  // se: 'Conjunction', //handled in ./misc/conjunctions.js
  si: 'Pronoun',//reflexive/impersonal - 'si dice', 'come si chiama'
  'nel caso che': 'Condition',//in the event that
  'che': 'Conjunction',//that/which

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
  'stata': 'PastTense',
  'stato': 'PastTense',
  'stati': 'PastTense',
  'presenti': 'Adjective',
  // participles like 'fondata', 'legato', 'chiamata' are generated
  // from the infinitive list - no need to hand-tag them here
  'regali': 'Noun',//i regali - gifts
  'vai': 'Imperative',//vai a casa!

  // short infinitive+clitic forms
  'farlo': 'Infinitive',
  'farla': 'Infinitive',
  'farli': 'Infinitive',
  'farle': 'Infinitive',
  'farne': 'Infinitive',
  'farsi': ['Infinitive', 'Reflexive'],
  'dirlo': 'Infinitive',
  'dirla': 'Infinitive',
  'dirle': 'Infinitive',
  'darlo': 'Infinitive',
  'darla': 'Infinitive',
  'darle': 'Infinitive',
  // 'poter': 'Verb',
  'va': 'Verb',
  'sia': 'Verb',
  'ottenne': 'Verb',
  'utilizzata': 'Verb',
  'avvenuta': 'Verb',
  'porta': 'Noun',
  // 'fatto': 'Noun',
  'posto': 'Noun',
  // singular nouns ending in -e (would be guessed as plurals)
  'arachide': ['FemaleNoun', 'Singular'],
  'arachidi': ['FemaleNoun', 'PluralNoun'],
  'cane': ['MaleNoun', 'Singular'],
  'pane': ['MaleNoun', 'Singular'],
  'mese': ['MaleNoun', 'Singular'],
  'paese': ['MaleNoun', 'Singular'],
  'nome': ['MaleNoun', 'Singular'],
  'cuore': ['MaleNoun', 'Singular'],
  'fiore': ['MaleNoun', 'Singular'],
  'fiume': ['MaleNoun', 'Singular'],
  'mare': ['MaleNoun', 'Singular'],
  'sole': ['MaleNoun', 'Singular'],
  'sale': ['MaleNoun', 'Singular'],
  'ponte': ['MaleNoun', 'Singular'],
  'monte': ['MaleNoun', 'Singular'],
  'dente': ['MaleNoun', 'Singular'],
  'notte': ['FemaleNoun', 'Singular'],
  'carne': ['FemaleNoun', 'Singular'],
  'nave': ['FemaleNoun', 'Singular'],
  'luce': ['FemaleNoun', 'Singular'],
  'voce': ['FemaleNoun', 'Singular'],
  'croce': ['FemaleNoun', 'Singular'],
  'pelle': ['FemaleNoun', 'Singular'],
  'mente': ['FemaleNoun', 'Singular'],
  'gente': ['FemaleNoun', 'Singular'],
  'madre': ['FemaleNoun', 'Singular'],
  'chiave': ['FemaleNoun', 'Singular'],
  'neve': ['FemaleNoun', 'Singular'],
  'sete': ['FemaleNoun', 'Singular'],
  'fame': ['FemaleNoun', 'Singular'],
  'padre': ['MaleNoun', 'Singular'],

  'fatto': 'Verb',

}
Object.assign(misc, aux)
export default misc
