// return the nth elem of a doc
export const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc)

const titleCase = /^\p{Lu}[\p{Ll}'’]/u //uppercase, then lowercase

const toTitleCase = function (str = '') {
  return str.replace(/^\p{Ll}/u, x => x.toUpperCase())
}

// the elided article in "dell'amico" is stored as a bare 'l'
const fullForm = { l: 'lo' }

const api = function (View) {
  /**   */
  class Contractions extends View {
    constructor(document, pointer, groups) {
      super(document, pointer, groups)
      this.viewType = 'Contraction'
    }

    /** write the elided forms out in full - "c'è" -> 'ci è' */
    expand() {
      this.docs.forEach(terms => {
        const isTitleCase = titleCase.test(terms[0].text)
        terms.forEach((t, i) => {
          if (typeof t.implicit !== 'string') {
            return
          }
          t.text = Object.hasOwn(fullForm, t.implicit) ? fullForm[t.implicit] : t.implicit
          delete t.implicit
          // add whitespace
          if (i < terms.length - 1 && t.post === '') {
            t.post += ' '
          }
          // flag it as dirty
          t.dirty = true
        })
        // keep the first word title-cased
        if (isTitleCase) {
          terms[0].text = toTitleCase(terms[0].text)
        }
      })
      this.compute('normal') //re-set normalized text
      return this
    }
    // overloaded - keep Contraction class
    update(pointer) {
      const m = new Contractions(this.document, pointer)
      m._cache = this._cache // share this full thing
      return m
    }
  }

  View.prototype.contractions = function (n) {
    let m = this.match('@hasContraction')
    m = getNth(m, n)
    return new Contractions(this.document, m.pointer)
  }
}
export default api
