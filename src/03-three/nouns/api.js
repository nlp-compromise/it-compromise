export const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc)

// get root form of adjective
const getRoot = function (m) {
  m.compute('root')
  const str = m.text('root')
  // let isPlural = m.has('#PluralNoun')
  // if (isPlural) {
  //   return transform.adjective.fromPlural(str)
  // }
  return str
}

// the noun of an elision has no text of its own - "l'amica"
const getText = function (m, fmt) {
  return m.text(fmt) || m.docs[0][0].implicit || ''
}

// ..it is written inside its article
const replace = function (m, str) {
  const term = m.docs[0][0]
  if (term.text || !term.implicit) {
    return m.replaceWith(str)
  }
  const [n, i] = m.fullPointer[0]
  const host = m.document[n].slice(0, i).reverse().find((t) => t.text)
  if (host) {
    host.text = host.text.replace(/(['’]).*$/, '$1' + str)
    host.normal = host.normal.replace(/'.*$/, "'" + str)
    term.implicit = str
    term.machine = str
    delete term.root
  }
  return m
}

// a hint for the inflector - 'la turista' vs 'il turista'
const getGender = function (m) {
  if (m.has('#FemaleNoun')) {
    return 'f'
  }
  if (m.has('#MaleNoun')) {
    return 'm'
  }
  return undefined
}

const api = function (View) {
  class Nouns extends View {
    constructor(document, pointer, groups) {
      super(document, pointer, groups)
      this.viewType = 'Nouns'
    }
    conjugate(n) {
      const methods = this.methods.two.transform.noun
      return getNth(this, n).map(m => {
        const str = getText(m)
        if (m.has('#PluralNoun')) {
          return {
            plural: str,
            singular: methods.fromPlural(str, getGender(m))
          }
        }
        if (m.has('#Uncountable')) {
          return {
            singular: str,
            plural: str,
          }
        }
        return {
          singular: str,
          plural: methods.toPlural(str, getGender(m))
        }
      }, [])
    }
    isPlural(n) {
      return getNth(this, n).if('#PluralNoun')
    }
    toPlural(n) {
      const methods = this.methods.two.transform.noun
      return getNth(this, n).if('#Singular').map(m => {
        const str = getRoot(m)
        const plural = methods.toPlural(str, getGender(m))
        replace(m, plural)
        return m.tag('PluralNoun', 'toPlural')
      })
    }
    toSingular(n) {
      const methods = this.methods.two.transform.noun
      return getNth(this, n).if('#PluralNoun').map(m => {
        // nb: the root of a plural noun is already singular - so use the word itself
        const str = getText(m, 'normal')
        const singular = methods.fromPlural(str, getGender(m))
        replace(m, singular)
        return m.tag('Singular', 'toSingular')
      })
    }
  }

  View.prototype.nouns = function (n) {
    let m = this.match('#Noun')
    m = getNth(m, n)
    return new Nouns(this.document, m.pointer)
  }
}
export default api