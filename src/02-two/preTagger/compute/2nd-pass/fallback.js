
const fallback = function (terms, i, world) {
  let setTag = world.methods.one.setTag
  let term = terms[i]
  if (term.tags.size === 0) {

    if (terms[i - 1]) {
      if (terms[i - 1].tags.has('Auxiliary')) {
        setTag([term], 'Verb', world, false, '2-fallback-verb')
        return
      }
    }

    setTag([term], 'Noun', world, false, '2-fallback')
  }
}
export default fallback