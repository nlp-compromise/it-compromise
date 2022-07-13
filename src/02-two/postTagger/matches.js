const postTagger = function (doc) {
  doc.match('una [#Verb]', 0).tag('FemaleNoun', 'una-adj')
  doc.match('(un|uno) [#Verb]', 0).tag('MaleNoun', 'uno-adj')


  // Come ti chiami?
  doc.match('(mi|ti|si|ci|vi|si) #Verb').tag('Reflexive', 'si-verb')
  // non lavoro
  doc.match('non #Noun').tag('Verb', 'non-verb')
  // in the battle
  doc.match('nella [#Verb]', 0).tag('Noun', 'nella-verb')
  // al negozio
  doc.match('al [#FirstPerson]', 0).tag('Noun', 'al-verb')
  // i ginocchi
  doc.match('i [#Noun]', 0).tag('PluralNoun', 'i-plural')

  // auxiliary verbs
  doc.match('[(abbia|abbiamo|abbiano|abbiate|avemmo|avesse|avessero|avessi|avessimo|aveste|avesti|avete|aveva|avevamo|avevano|avevate|avevo|avrà|avrai|avranno|avrebbe|avrei|avremmo|avremo|avreste|avresti|avrete|avrò|ebbe|ebbero|ebbi|ha|hai|hanno|ho)] #Verb', 0).tag('Auxiliary', 'aux-verb')

}
export default postTagger


