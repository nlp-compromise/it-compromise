// auxiliary word-forms (essere/avere/stare) - the Auxiliary tag itself
// is only applied by the postTagger, which runs after this pass
const auxWords = new Set([
  'sono', 'sei', 'è', 'siamo', 'siete', 'ero', 'eri', 'era', 'eravamo', 'eravate', 'erano',
  'fui', 'fu', 'furono', 'sarò', 'sarà', 'saranno', 'sia', 'siano', 'fossi', 'fosse', 'fossero',
  'ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno', 'avevo', 'avevi', 'aveva', 'avevamo', 'avevate', 'avevano',
  'ebbe', 'ebbero', 'avrò', 'avrà', 'avranno', 'abbia', 'abbiano', 'avesse', 'avessero',
  'sto', 'stai', 'sta', 'stiamo', 'stanno', 'stavo', 'stava', 'stavano',
])
// past-participle endings - mangiato/a/i/e, venduto, finito
const participleLike = /(at|ut|it)[oaie]$/

const fallback = function (terms, i, world) {
  let setTag = world.methods.one.setTag
  let term = terms[i]
  if (term.tags.size === 0) {

    if (terms[i - 1]) {
      if (terms[i - 1].tags.has('Auxiliary') || auxWords.has(terms[i - 1].normal)) {
        if (participleLike.test(term.normal)) {
          setTag([term], 'PastParticiple', world, false, '2-fallback-participle')
        } else {
          setTag([term], 'Verb', world, false, '2-fallback-verb')
        }
        return
      }
    }

    setTag([term], 'Noun', world, false, '2-fallback')
  }
}
export default fallback
