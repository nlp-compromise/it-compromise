// https://github.com/aparo/opennlp-italian-models/blob/master/lang/it/POS/tagsDictionaryIt.txt
export default {
  'B': 'Adverb',//   adverb
  'BN': 'Adverb',//	negation adverb
  'CC': 'Conjunction',//	coordinate conjunction
  'CS': 'Conjunction',//	subordinate conjunction
  'DD': 'Determiner',//	demonstrative determiner
  'DE': 'Determiner',//	exclamative determiner
  'DI': 'Determiner',//	indefinite determiner
  'DQ': 'Determiner',//	interrogative determiner
  'DR': 'Determiner',//	relative determiner
  'E': 'Preposition',//	  preposition
  'EA': 'Preposition',//	articulated preposition
  'FB': '',//	balanced punctuation(round brackets, double quotes, etc.)
  'FC': '',//	clause boundary punctuation(.- : ;)
  'FF': '',//	comma, dash, omissis(, ... -)
  'FS': '',//	sentence boundary punctuation(. ?! ...)
  'I': 'Expression',//	  interjection
  'N': 'Value',//	  cardinal number
  'PC': 'Pronoun',//	clitic pronoun
  'PD': 'Pronoun',//	demonstrative pronoun
  'PE': 'Pronoun',// 	personal pronoun
  'PI': 'Pronoun',//	indefinite pronoun
  'PP': 'Pronoun',//	possessive pronoun
  'PQ': 'Pronoun',//	interrogative pronoun
  'PR': 'Pronoun',//	relative pronoun
  'RD': 'Article',//	determinative article
  'RI': 'Article',//	indeterminative article
  'T': 'Determiner',// 	predeterminer
  'SA': 'Abbreviation',//	abbreviation
  'SP': 'ProperNoun',//	proper noun
  'XH': 'HashTag',//	hashtag twitter(#nlp)
  'XM': 'AtMention',//	twitter mentions(@obama)
  'XE': 'Emoticon',//	Emoticon(smiley : -))
  'XX': 'Expression',//	Others(formula, , not classified words, other alphabetic symbols, etc.)

  'Ss': 'Singular',//	S num = s		singular noun 
  'Sp': 'Plural',//	S num = p		plural noun
  'Sn': 'Noun',//	S num = n		underspecified noun
  'As': 'SingularAdjective',//	A num = s		singular  adjective
  'Ap': 'Adjective',//	A num = p		plural adjective
  'An': 'Adjective',//	A num = n		underspecified adjective
  'APs': 'Adjective',//	AP num = s	singular possessive adjective
  'APp': 'Adjective',//	AP num = p	plural possessive adjective
  'APn': 'Adjective',//	AP num = n	underspecified possessive adjective
  'NOs': 'Ordinal',//	NO num = s	singular ordinal number
  'NOp': 'Ordinal',//	NO num = p	plural ordinal number
  'NOn': 'Ordinal',//	NO num = n	underspecified ordinal number
  'SWs': 'ProperNoun',//	SW num = s	singular foreign name
  'SWp': 'ProperNoun',//	SW num = p	plural foreign name
  'SWn': 'ProperNoun',//	SW num = n	underspecified foreign name


  'Vip': 'PresentTense',// 	V mod = i ten = p per != 3	 	main verb indicative present, other than 3° person
  'Vip3': 'PresentTense',//	V mod = i ten = p per = 3		  main verb indicative present, 3° person
  'Vii': 'Verb',//	  V mod = i ten = i per != 3		main verb indicative imperfect, other than 3° person
  'Vii3': 'Verb',//	V mod = i ten = i per = 3	  	main verb indicative imperfect, 3° person
  'Vis': 'PastTense',//	  V mod = i ten = s per != 3		main verb indicative past, other than 3° person
  'Vis3': 'PastTense',//	V mod = i ten = s per = 3	  	main verb indicative past, 3° person
  'Vif': 'FutureTense',//	  V mod = i ten = f per != 3		main verb indicative future, other than 3° person
  'Vif3': 'FutureTense',//	V mod = i ten = f per = 3		  main verb indicative future, 3° person
  'Vcp': 'PresentTense',//	  V mod = c ten = p per != 3		main verb conjunctive present, other than 3° person
  'Vcp3': 'PresentTense',//	V mod = c ten = p per = 3	  	main verb conjunctive present, 3° person
  'Vci': 'Verb',// 	V mod = c ten = i per != 3 		main verb conjunctive imperfect, other than 3° person
  'Vci3': 'Verb',//	V mod = c ten = i per = 3		  main verb conjunctive imperfect, 3° person
  'Vdp': 'PresentTense',// 	V mod = d ten = p per != 3		main verb conditional present, other than 3° person
  'Vdp3': 'PresentTense',//	V mod = d ten = p per = 3	  	main verb conditional present, 3° person
  'Vg': 'Gerund',//  	V mod = g			          	main verb gerundive
  'Vp': 'Verb',//	  V mod = p 		          	main verb participle
  'Vf': 'Verb',//	  V mod = f 		          	main verb infinite
  'Vm': 'Imperative',//	  V mod = m			          	main verb imperative

  'VAip': 'Auxiliary',//	VA mod = i ten = p per != 3		auxiliary verb indicative present, other than 3° person
  'VAip3': 'Auxiliary',//	VA mod = i ten = p per = 3		auxiliary verb indicative present, 3° person
  'VAii': 'Auxiliary',//	VA mod = i ten = i per != 3		auxiliary verb indicative imperfect, other than 3° person
  'VAii3': 'Auxiliary',//	VA mod = i ten = i per = 3		auxiliary verb indicative imperfect, 3° person
  'VAis': 'Auxiliary',//	VA mod = i ten = s per != 3		auxiliary verb indicative past, other than 3° person
  'VAis3': 'Auxiliary',//	VA mod = i ten = s per = 3		auxiliary verb indicative past, 3° person
  'VAif': 'Auxiliary',//	VA mod = i ten = f per != 3		auxiliary verb indicative future, other than 3° person
  'VAif3': 'Auxiliary',//	VA mod = i ten = f per = 3		auxiliary verb indicative future, 3° person
  'VAcp': 'Auxiliary',//	VA mod = c ten = p per != 3		auxiliary verb conjunctive present, other than 3° person
  'VAcp3': 'Auxiliary',//	VA mod = c ten = p per = 3		auxiliary verb conjunctive present, 3° person
  'VAci': 'Auxiliary',//	VA mod = c ten = i per != 3  	auxiliary verb conjunctive imperfect, other than 3° person
  'VAci3': 'Auxiliary',//	VA mod = c ten = i per = 3		auxiliary verb conjunctive imperfect, 3° person
  'VAdp': 'Auxiliary',//	VA mod = d ten = p per != 3		auxiliary verb conditional present, other than 3° person
  'VAdp3': 'Auxiliary',//	VA mod = d ten = p per = 3		auxiliary verb conditional present, 3° person
  'VAg': 'Auxiliary',//	VA mod = g			            auxiliary verb gerundive
  'VAp': 'Auxiliary',//	VA mod = p 		            	auxiliary verb participle
  'VAf': 'Auxiliary',//	VA mod = f 		            	auxiliary verb infinite
  'VAm': 'Auxiliary',//	VA mod = m		            	auxiliary verb imperative


  'VMip': 'Modal',//	VM mod = i ten = p per != 3		modal verb indicative present, other than 3° person
  'VMip3': 'Modal',//	VM mod = i ten = p per = 3		modal verb indicative present, 3° person
  'VMii': 'Modal',//	VM mod = i ten = i per != 3		modal verb indicative imperfect, other than 3° person
  'VMii3': 'Modal',//	VM mod = i ten = i per = 3		modal verb indicative imperfect, 3° person
  'VMis': 'Modal',//	VM mod = i ten = s per != 3		modal verb indicative past, other than 3° person
  'VMis3': 'Modal',//	VM mod = i ten = s per = 3		modal verb indicative past, 3° person
  'VMif': 'Modal',//	VM mod = i ten = f per != 3		modal verb indicative future, other than 3° person
  'VMif3': 'Modal',//	VM mod = i ten = f per = 3		modal verb indicative future, 3° person
  'VMcp': 'Modal',//	VM mod = c ten = p per != 3		modal verb conjunctive present, other than 3° person
  'VMcp3': 'Modal',//	VM mod = c ten = p per = 3		modal verb conjunctive present, 3° person
  'VMci': 'Modal',//	VM mod = c ten = i per != 3  	modal verb conjunctive imperfect, other than 3° person
  'VMci3': 'Modal',//	VM mod = c ten = i per = 3		modal verb conjunctive imperfect, 3° person
  'VMdp': 'Modal',//	VM mod = d ten = p per != 3		modal verb conditional present, other than 3° person
  'VMdp3': 'Modal',//	VM mod = d ten = p per = 3		modal verb conditional present, 3° person
  'VMg': 'Modal',//	VM mod = g		            	modal verb gerundive
  'VMp': 'Modal',//	VM mod = p 		            	modal verb participle
  'VMf': 'Modal',//	VM mod = f 		            	modal verb infinite
  'VMm': 'Modal',//	VM mod = m		            	modal verb imperative
}