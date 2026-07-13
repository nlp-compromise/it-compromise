// articles that are never object-pronouns (l' splits to 'l')
const articles = '(il|i|un|uno|una|l)'
// these are articles OR proclitic object-pronouns - 'la pizza' vs 'la vedo'
const articleClitics = '(lo|la|le|gli)'
// preposition+article contractions
const prepArticles =
  '(al|allo|alla|ai|agli|alle|del|dello|della|dei|degli|delle|nel|nello|nella|nei|negli|nelle|sul|sullo|sulla|sui|sugli|sulle|dal|dallo|dalla|dai|dagli|dalle|col|coi)'
// other noun-introducers
const otherDets = '(questo|questa|questi|queste|quel|quello|quella|quelli|quelle|ogni|qualche|nessun|alcuni|alcune|molti|molte)'

// essere - to be
const essereForms =
  '(sono|sei|è|siamo|siete|ero|eri|era|eravamo|eravate|erano|fui|fosti|fu|fummo|foste|furono|sarò|sarai|sarà|saremo|sarete|saranno|sia|siano|fossi|fosse|fossimo|fossero|sarei|saresti|sarebbe|saremmo|sareste|sarebbero)'
// avere - to have
const avereForms =
  '(ho|hai|ha|abbiamo|avete|hanno|avevo|avevi|aveva|avevamo|avevate|avevano|ebbi|ebbe|ebbero|avrò|avrai|avrà|avremo|avrete|avranno|abbia|abbiano|avessi|avesse|avessimo|avessero|avrei|avresti|avrebbe|avremmo|avreste|avrebbero)'
// stare - progressive
const stareForms =
  '(sto|stai|sta|stiamo|state|stanno|stavo|stavi|stava|stavamo|stavate|stavano|starò|starai|starà|staremo|starete|staranno)'

// forms that stay verbs even after an article - "l'hai", "uno è"
const coreVerbs =
  '(è|era|erano|ero|sono|sei|siamo|siete|fu|furono|sarà|saranno|sia|siano|fosse|ho|hai|ha|abbiamo|avete|hanno|avevo|aveva|avevano|avrà|abbia|sto|stai|sta|stanno|stava|posso|puoi|può|possiamo|possono|poteva|potrà|devo|devi|deve|dobbiamo|devono|doveva|dovrà|voglio|vuoi|vuole|vogliamo|vogliono|voleva|vorrà|so|sai|sa|sanno|vado|vai|va|vanno|faccio|fai|fa|fanno|dico|dici|dice|dicono)'

const postTagger = function (doc) {
  // a word after an article is a noun - 'la pizza', 'il potere'
  doc.match(`${articles} [#Verb]`, 0).ifNo(coreVerbs).tag('Noun', 'art-noun')
  doc.match(`${prepArticles} [#Verb]`, 0).ifNo(coreVerbs).tag('Noun', 'prep-art-noun')
  doc.match(`${otherDets} [#Verb]`, 0).ifNo(coreVerbs).tag('Noun', 'det-noun')
  doc.match(`${articleClitics} [#Verb]`, 0).ifNo(coreVerbs).tag('Noun', 'art-clitic-noun')
  // ..unless an object follows - 'le offro un caffè', 'lo vede la sera'
  doc.match(`${articleClitics} [#Noun] (un|uno|una|il|lo|la|i|gli|le|mi|ti|ci|vi)`, 0).tag('PresentTense', 'clitic-verb')
  // 'lo vedo' - the clitic before a verb is a pronoun
  doc.match(`[${articleClitics}] #Verb`, 0).tag('Pronoun', 'clitic-pron')
  // gender from indefinite article
  doc.match('una [#Noun]', 0).tag('FemaleNoun', 'una-noun')
  doc.match('(un|uno) [#Noun]', 0).tag('MaleNoun', 'un-noun')

  //  un libro di cucina
  doc.match('(un|uno) #Noun di [#Verb]', 0).tag('Noun', 'un-x-di-vb')

  // noun-verb homographs before an article are verbs - 'legge un libro'
  doc.match(`#Noun [(legge|porta|guida|nota|regola|forma|causa)] ${articles}`, 0).tag('PresentTense', 'noun-vb-art')

  // phrasal verbs ('su' excluded - it is usually a preposition)
  doc
    .match(
      '#Verb (alzata|avanti|dietro|fuori|sotto|giu|giù|indietro|dentro|addosso)'
    )
    .tag('#PhrasalVerb #Particle', 'phrasal')

  // noun gender aggrement
  doc.match('(il|lo|i|gli) [#Noun]', 0).tag('MaleNoun', 'm-noun')
  doc.match('(la|le|una) [#Noun]', 0).tag('FemaleNoun', 'f-noun')

  // 'vi arrabbiate' - a word right after a reflexive clitic is its verb
  doc.match('(mi|ti|si|ci|vi) [#Adjective]', 0).tag('PresentTense', 'clitic-verb-guess')
  // 'voi finite il lavoro' - subject pronoun + misread adjective
  doc.match('(io|tu|noi|voi) [#Adjective]', 0).ifNo('(stesso|stessa|stessi|stesse|due|tre)').tag('PresentTense', 'pron-verb-guess')
  // Come ti chiami? - the clitic pronoun gets the Reflexive tag
  doc.match('[(mi|ti|si|ci|vi)] #Verb', 0).tag('Reflexive', 'si-verb')
  // non lavoro
  doc.match('non [#Noun]', 0).tag('Verb', 'non-verb')
  // i ginocchi
  doc.match('(i|gli|le) [#Noun]', 0).tag('PluralNoun', 'i-plural')
  // 27° - '27th'
  doc.match('[#Value] °', 0).tag('Ordinal', 'number-ordinal')

  // 'uno' and 'sei' are also number-words
  // standalone - 'uno'
  doc.match('^[(uno|sei)]$', 0).tag(['TextValue', 'Cardinal'], 'lone-number')
  // 'sei anni' - six years
  doc.match('[sei] #PluralNoun', 0).tag(['TextValue', 'Cardinal'], 'sei-plural')
  // 'a uno è..' - one (person)
  doc.match('[(uno|sei)] (è|sono|era|erano|fu|furono|sarà|saranno)', 0).tag(['TextValue', 'Cardinal'], 'num-copula')

  // auxiliary verbs
  // sono andato - essere + participle
  doc.match(`[${essereForms}] #Verb`, 0).tag('Auxiliary', 'essere-aux')
  // 'ha scritto' - a word after avere is its participle, not an adjective
  doc.match(`${avereForms} [#Adjective]`, 0).ifNo('(caldo|freddo)').tag('PastParticiple', 'avere-pp')
  // 'è stata fondata', 'venne sconfitto' - passive participles
  doc.match('(fu|furono|venne|vennero|viene|vengono|è|era|erano|sarà|essere|stato|stata|stati|state) [/(at|ut|it)[oaie]$/]', 0).tag('PastParticiple', 'passive-pp')
  // ho mangiato - avere + participle
  doc.match(`[${avereForms}] #PastParticiple`, 0).tag('Auxiliary', 'avere-aux')
  // sto mangiando - stare + gerund
  doc.match(`[${stareForms}] #Gerund`, 0).tag('Auxiliary', 'stare-aux')
  // posso camminare - modal + infinitive
  // (root-tokens can't be or'd together in one match)
  ;['volere', 'potere', 'dovere', 'sapere'].forEach((modal) => {
    doc.match(`[{${modal}}] (#Infinitive|#Reflexive)`, 0).tag('Auxiliary', 'modal-aux')
  })

  // Che bello!
  doc.match('^che #Adjective$').tag('Expression', 'che-bello')
}
export default postTagger
