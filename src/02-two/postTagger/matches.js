const postTagger = function (doc) {
  doc.match('una [#Verb]', 0).tag('FemaleNoun', 'una-adj')
  doc.match('(un|uno) [#Verb]', 0).tag('MaleNoun', 'uno-adj')


  // Come ti chiami?
  doc.match('(mi|ti|si|ci|vi|si) #Verb').tag('Reflexive', 'si-verb')
  // non lavoro
  doc.match('non #Noun').tag('Verb', 'non-verb')
  // in the battle
  doc.match('nella [#Verb]', 0).tag('Noun', 'nella-verb')

  // auxiliary verbs
  doc.match('[(sono|sei|lei|siamo|siete|ho|hai|abbiamo|avete|hanno)] #Verb', 0).tag('Auxiliary', 0)
}
export default postTagger