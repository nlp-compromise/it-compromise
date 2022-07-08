
const fallback = function (terms, i, world) {
  let setTag = world.methods.one.setTag
  let term = terms[i]
  if (term.tags.size === 0) {
    setTag([term], 'Noun', world, false, '2-fallback')
  }
}
export default fallback