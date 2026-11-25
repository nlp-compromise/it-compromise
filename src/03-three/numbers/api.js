import find from './find.js'
import parse from './parse/index.js'
import format from './format/index.js'

// return the nth elem of a doc
export const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc)

// accept a number, or an italian number as a string - 'otto' or '8'
const toNum = function (view, n) {
  if (typeof n !== 'string') {
    return n
  }
  const m = view.fromText(n).numbers()
  // the whole string must be one number
  if (m.length !== 1 || m.text('normal') !== m.all().text('normal')) {
    return null
  }
  const num = parse(m).num
  return typeof num === 'number' && !isNaN(num) ? num : null
}

// the new text has its own sign, so remove one left in the punctuation - '-|3,5'
const dropSign = function (val) {
  const term = val.docs[0][0]
  term.pre = term.pre.replace(/[-−]$/, '')
}

const api = function (View) {
  /**   */
  class Numbers extends View {
    constructor(document, pointer, groups) {
      super(document, pointer, groups)
      this.viewType = 'Numbers'
    }
    parse(n) {
      return getNth(this, n).map(parse, [])
    }
    get(n) {
      return getNth(this, n).map(parse, []).map(o => o.num)
    }
    json(opts, n) {
      // support .json(n) and .json(opts, n)
      if (typeof opts === 'number') {
        n = opts
        opts = undefined
      }
      const doc = getNth(this, n)
      return doc.map(p => {
        const json = p.toView().json(opts)[0] || {}
        const parsed = parse(p)
        json.number = {
          prefix: parsed.prefix,
          num: parsed.num,
          suffix: parsed.suffix,
          hasComma: parsed.hasComma,
        }
        return json
      }, [])
    }
    /** any known measurement unit, for the number */
    units() {
      return this.growRight('#Unit').match('#Unit$')
    }
    /** return only ordinal numbers */
    isOrdinal() {
      return this.if('#Ordinal')
    }
    /** return only cardinal numbers*/
    isCardinal() {
      return this.if('#Cardinal')
    }

    /** convert to numeric form like '8' or '8th' */
    toNumber() {
      const m = this.if('#TextValue')
      const res = m.map(val => {
        const obj = parse(val)
        if (obj.num === null) {
          return val
        }
        const fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal'
        const str = format(obj, fmt)
        if (str) {
          dropSign(val)
          val.replaceWith(str, { tags: true })
          val.tag('NumericValue')
        }
        return val
      })
      return new Numbers(res.document, res.pointer)
    }
    /** convert to numeric form like 'eight' or 'eighth' */
    toText() {
      const m = this
      const res = m.map(val => {
        if (val.has('#TextValue')) {
          return val
        }
        const obj = parse(val)
        // there are no words for '3,5'
        if (obj.num === null || !Number.isInteger(obj.num)) {
          return val
        }
        const fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal'
        const str = format(obj, fmt)
        if (str) {
          dropSign(val)
          val.replaceWith(str, { tags: true })
          val.tag('TextValue')
        }
        return val
      })
      return new Numbers(res.document, res.pointer)
    }
    /** convert ordinal to cardinal form, like 'eight', or '8' */
    toCardinal() {
      const m = this
      const res = m.map(val => {
        if (!val.has('#Ordinal')) {
          return val
        }
        const obj = parse(val)
        if (obj.num === null) {
          return val
        }
        const fmt = val.has('#TextValue') ? 'TextCardinal' : 'Cardinal'
        const str = format(obj, fmt)
        if (str) {
          dropSign(val)
          val.replaceWith(str, { tags: true })
          val.tag('Cardinal')
        }
        return val
      })
      return new Numbers(res.document, res.pointer)
    }
    /** convert cardinal to ordinal form, like 'eighth', or '8th' */
    toOrdinal() {
      const m = this
      const res = m.map(val => {
        if (val.has('#Ordinal')) {
          return val
        }
        const obj = parse(val)
        if (obj.num === null) {
          return val
        }
        const fmt = val.has('#TextValue') ? 'TextOrdinal' : 'Ordinal'
        const str = format(obj, fmt)
        if (str) {
          dropSign(val)
          val.replaceWith(str, { tags: true })
          val.tag('Ordinal')
        }
        return val
      })
      return new Numbers(res.document, res.pointer)
    }

    /** return only numbers that are == n */
    isEqual(n) {
      return this.filter((val) => {
        const num = parse(val).num
        return num === n
      })
    }
    /** return only numbers that are > n*/
    greaterThan(n) {
      return this.filter((val) => {
        const num = parse(val).num
        return num > n
      })
    }
    /** return only numbers that are < n*/
    lessThan(n) {
      return this.filter((val) => {
        const num = parse(val).num
        return num < n
      })
    }
    /** return only numbers > min and < max */
    between(min, max) {
      return this.filter((val) => {
        const num = parse(val).num
        return num > min && num < max
      })
    }
    /** set these number to n */
    set(n) {
      if (n === undefined) {
        return this // don't bother
      }
      n = toNum(this, n)
      if (typeof n !== 'number') {
        return this // not a number
      }
      const m = this
      const res = m.map((val) => {
        const obj = parse(val)
        obj.num = n
        if (obj.num === null) {
          return val
        }
        let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal'
        if (val.has('#TextValue')) {
          fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal'
        }
        const str = format(obj, fmt)
        if (str) {
          dropSign(val)
          val = val.not('#Currency')
          val.replaceWith(str, { tags: true })
          // handle plural/singular unit
          // agreeUnits(agree, val, obj)
        }
        return val
      })
      return new Numbers(res.document, res.pointer)
    }
    add(n) {
      if (!n) {
        return this // don't bother
      }
      n = toNum(this, n)
      if (typeof n !== 'number' || n === 0) {
        return this // not a number
      }
      const m = this
      const res = m.map((val) => {
        const obj = parse(val)
        if (obj.num === null) {
          return val
        }
        obj.num += n
        let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal'
        if (obj.isText) {
          fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal'
        }
        const str = format(obj, fmt)
        if (str) {
          dropSign(val)
          val.replaceWith(str, { tags: true })
          // handle plural/singular unit
          // agreeUnits(agree, val, obj)
        }
        return val
      })
      return new Numbers(res.document, res.pointer)
    }
    /** decrease each number by n*/
    subtract(n, agree) {
      n = toNum(this, n)
      if (typeof n !== 'number') {
        return this // not a number
      }
      return this.add(n * -1, agree)
    }
    /** increase each number by 1 */
    increment(agree) {
      return this.add(1, agree)
    }
    /** decrease each number by 1 */
    decrement(agree) {
      return this.add(-1, agree)
    }
    // overloaded - keep Numbers class
    update(pointer) {
      const m = new Numbers(this.document, pointer)
      m._cache = this._cache // share this full thing
      return m
    }
  }
  // aliases
  Numbers.prototype.isBetween = Numbers.prototype.between
  Numbers.prototype.minus = Numbers.prototype.subtract
  Numbers.prototype.plus = Numbers.prototype.add
  Numbers.prototype.equals = Numbers.prototype.isEqual

  View.prototype.numbers = function (n) {
    let m = find(this)
    m = getNth(m, n)
    return new Numbers(this.document, m.pointer)
  }
  // alias
  View.prototype.values = View.prototype.numbers
}
export default api
