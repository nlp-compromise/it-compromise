const postTagger = function (doc) {
  doc.match('una [#Verb]', 0).tag('FemaleNoun', 'una-adj')
  doc.match('(un|uno) [#Verb]', 0).tag('MaleNoun', 'uno-adj')


  // Come ti chiami?
  doc.match('(mi|ti|si|ci|vi|si) #Verb').tag('Reflexive', 'si-verb')

}
export default postTagger