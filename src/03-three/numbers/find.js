const isValue = term => term.tags.has('Value')

// 'meno cinque' is -5
// .. but not 'più o meno cinque' (about five), or 'le sei meno cinque' (five to six)
const withMinus = function (m) {
  const ptrs = m.fullPointer.map(ptr => {
    const [n, start, end] = ptr
    const terms = m.document[n]
    const sign = terms[start - 1]
    const before = terms[start - 2]
    if (!sign || sign.normal !== 'meno' || /\S/.test(sign.post)) {
      return ptr
    }
    if (before && (before.normal === 'o' || isValue(before))) {
      return ptr
    }
    return [n, start - 1, end]
  })
  return m.update(ptrs)
}

const findNumbers = function (view) {
  let m = view.match('#Value+')
  //5-8
  m = m.splitAfter('#NumberRange')
  // june 5th 1999
  m = m.splitBefore('#Year')
  return withMinus(m)
}
export default findNumbers
