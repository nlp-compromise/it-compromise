// return the nth elem of a doc
export const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc)

const api = function (View) {
  /**   */
  class Contractions extends View {
    constructor(document, pointer, groups) {
      super(document, pointer, groups)
      this.viewType = 'Contraction'
    }

    expand() {
      return this
    }
    // overloaded - keep Contraction class
    update(pointer) {
      let m = new Contractions(this.document, pointer)
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
