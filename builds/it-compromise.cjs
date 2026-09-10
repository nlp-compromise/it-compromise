(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.itCompromise = factory());
})(this, (function () { 'use strict';

  const methods$n = {
    one: {},
    two: {},
    three: {},
    four: {},
  };

  const model$6 = {
    one: {},
    two: {},
    three: {},
  };
  const compute$7 = {};
  const hooks = [];

  var tmpWrld = { methods: methods$n, model: model$6, compute: compute$7, hooks };

  const isArray$a = input => Object.prototype.toString.call(input) === '[object Array]';

  const fns$4 = {
    /** add metadata to term objects */
    compute: function (input) {
      const { world } = this;
      const compute = world.compute;
      // do one method
      if (typeof input === 'string' && compute.hasOwnProperty(input)) {
        compute[input](this);
      }
      // allow a list of methods
      else if (isArray$a(input)) {
        input.forEach(name => {
          if (world.compute.hasOwnProperty(name)) {
            compute[name](this);
          } else {
            console.warn('no compute:', input); // eslint-disable-line
          }
        });
      }
      // allow a custom compute function
      else if (typeof input === 'function') {
        input(this);
      } else {
        console.warn('no compute:', input); // eslint-disable-line
      }
      return this
    },
  };

  // wrappers for loops in javascript arrays

  const forEach = function (cb) {
    const ptrs = this.fullPointer;
    ptrs.forEach((ptr, i) => {
      const view = this.update([ptr]);
      cb(view, i);
    });
    return this
  };

  const map = function (cb, empty) {
    const ptrs = this.fullPointer;
    const res = ptrs.map((ptr, i) => {
      const view = this.update([ptr]);
      const out = cb(view, i);
      // if we returned nothing, return a view
      if (out === undefined) {
        return this.none()
      }
      return out
    });
    if (res.length === 0) {
      return empty || this.update([])
    }
    // return an array of values, or View objects?
    // user can return either from their callback
    if (res[0] !== undefined) {
      // array of strings
      if (typeof res[0] === 'string') {
        return res
      }
      // array of objects
      if (typeof res[0] === 'object' && (res[0] === null || !res[0].isView)) {
        return res
      }
    }
    // return a View object
    let all = [];
    res.forEach(ptr => {
      all = all.concat(ptr.fullPointer);
    });
    return this.toView(all)
  };

  const filter = function (cb) {
    let ptrs = this.fullPointer;
    ptrs = ptrs.filter((ptr, i) => {
      const view = this.update([ptr]);
      return cb(view, i)
    });
    const res = this.update(ptrs);
    return res
  };

  const find = function (cb) {
    const ptrs = this.fullPointer;
    const found = ptrs.find((ptr, i) => {
      const view = this.update([ptr]);
      return cb(view, i)
    });
    return this.update([found])
  };

  const some = function (cb) {
    const ptrs = this.fullPointer;
    return ptrs.some((ptr, i) => {
      const view = this.update([ptr]);
      return cb(view, i)
    })
  };

  const random = function (n = 1) {
    let ptrs = this.fullPointer;
    let r = Math.floor(Math.random() * ptrs.length);
    //prevent it from going over the end
    if (r + n > this.length) {
      r = this.length - n;
      r = r < 0 ? 0 : r;
    }
    ptrs = ptrs.slice(r, r + n);
    return this.update(ptrs)
  };
  var loops = { forEach, map, filter, find, some, random };

  const utils = {
    /** */
    termList: function () {
      return this.methods.one.termList(this.docs)
    },
    /** return individual terms*/
    terms: function (n) {
      const m = this.match('.');
      // this is a bit faster than .match('.') 
      // let ptrs = []
      // this.docs.forEach((terms) => {
      //   terms.forEach((term) => {
      //     let [y, x] = term.index || []
      //     ptrs.push([y, x, x + 1])
      //   })
      // })
      // let m = this.update(ptrs)
      return typeof n === 'number' ? m.eq(n) : m
    },

    /** */
    groups: function (group) {
      if (group || group === 0) {
        return this.update(this._groups[group] || [])
      }
      // return an object of Views
      const res = {};
      Object.keys(this._groups).forEach(k => {
        res[k] = this.update(this._groups[k]);
      });
      // this._groups = null
      return res
    },
    /** */
    eq: function (n) {
      let ptr = this.pointer;
      if (!ptr) {
        ptr = this.docs.map((_doc, i) => [i]);
      }
      if (ptr[n]) {
        return this.update([ptr[n]])
      }
      return this.none()
    },
    /** */
    first: function () {
      return this.eq(0)
    },
    /** */
    last: function () {
      const n = this.fullPointer.length - 1;
      return this.eq(n)
    },

    /** grab term[0] for every match */
    firstTerms: function () {
      return this.match('^.')
    },

    /** grab the last term for every match  */
    lastTerms: function () {
      return this.match('.$')
    },

    /** */
    slice: function (min, max) {
      let pntrs = this.pointer || this.docs.map((_o, n) => [n]);
      pntrs = pntrs.slice(min, max);
      return this.update(pntrs)
    },

    /** return a view of the entire document */
    all: function () {
      return this.update().toView()
    },
    /**  */
    fullSentences: function () {
      const ptrs = this.fullPointer.map(a => [a[0]]); //lazy!
      return this.update(ptrs).toView()
    },
    /** return a view of no parts of the document */
    none: function () {
      return this.update([])
    },

    /** are these two views looking at the same words? */
    isDoc: function (b) {
      if (!b || !b.isView) {
        return false
      }
      const aPtr = this.fullPointer;
      const bPtr = b.fullPointer;
      if (!aPtr.length === bPtr.length) {
        return false
      }
      // ensure pointers are the same
      return aPtr.every((ptr, i) => {
        if (!bPtr[i]) {
          return false
        }
        // ensure [n, start, end] are all the same
        return ptr[0] === bPtr[i][0] && ptr[1] === bPtr[i][1] && ptr[2] === bPtr[i][2]
      })
    },

    /** how many seperate terms does the document have? */
    wordCount: function () {
      return this.docs.reduce((count, terms) => {
        count += terms.filter(t => t.text !== '').length;
        return count
      }, 0)
    },

    // is the pointer the full sentence?
    isFull: function () {
      const ptrs = this.pointer;
      if (!ptrs) {
        return true
      }
      // must start at beginning
      if (ptrs.length === 0 || ptrs[0][0] !== 0) {
        return false
      }
      let wantTerms = 0;
      let haveTerms = 0;
      this.document.forEach(terms => wantTerms += terms.length);
      this.docs.forEach(terms => haveTerms += terms.length);
      return wantTerms === haveTerms
      // for (let i = 0; i < ptrs.length; i += 1) {
      //   let [n, start, end] = ptrs[i]
      //   // it's not the start
      //   if (n !== i || start !== 0) {
      //     return false
      //   }
      //   // it's too short
      //   if (document[n].length > end) {
      //     return false
      //   }
      // }
      // return true
    },

    // return the nth elem of a doc
    getNth: function (n) {
      if (typeof n === 'number') {
        return this.eq(n)
      } else if (typeof n === 'string') {
        return this.if(n)
      }
      return this
    }

  };
  utils.group = utils.groups;
  utils.fullSentence = utils.fullSentences;
  utils.sentence = utils.fullSentences;
  utils.lastTerm = utils.lastTerms;
  utils.firstTerm = utils.firstTerms;

  const methods$m = Object.assign({}, utils, fns$4, loops);

  // aliases
  methods$m.get = methods$m.eq;

  class View {
    constructor(document, pointer, groups = {}) {
      // invisible props
      const props = [
        ['document', document],
        ['world', tmpWrld],
        ['_groups', groups],
        ['_cache', null],
        ['viewType', 'View'],
      ];
      props.forEach(a => {
        Object.defineProperty(this, a[0], {
          value: a[1],
          writable: true,
        });
      });
      this.ptrs = pointer;
    }
    /* getters:  */
    get docs() {
      let docs = this.document;
      if (this.ptrs) {
        docs = tmpWrld.methods.one.getDoc(this.ptrs, this.document);
      }
      return docs
    }
    get pointer() {
      return this.ptrs
    }
    get methods() {
      return this.world.methods
    }
    get model() {
      return this.world.model
    }
    get hooks() {
      return this.world.hooks
    }
    get isView() {
      return true //this comes in handy sometimes
    }
    // is the view not-empty?
    get found() {
      return this.docs.length > 0
    }
    // how many matches we have
    get length() {
      return this.docs.length
    }
    // return a more-hackable pointer
    get fullPointer() {
      const { docs, ptrs, document } = this;
      // compute a proper pointer, from docs
      const pointers = ptrs || docs.map((_d, n) => [n]);
      // do we need to repair it, first?
      return pointers.map(a => {
        // eslint-disable-next-line prefer-const
        let [n, start, end, id, endId] = a;
        start = start || 0;
        end = end || (document[n] || []).length;
        //add frozen id, for good-measure
        if (document[n] && document[n][start]) {
          id = id || document[n][start].id;
          if (document[n][end - 1]) {
            endId = endId || document[n][end - 1].id;
          }
        }
        return [n, start, end, id, endId]
      })
    }
    // create a new View, from this one
    update(pointer) {
      const m = new View(this.document, pointer);
      // send the cache down, too?
      if (this._cache && pointer && pointer.length > 0) {
        // only keep cache if it's a full-sentence
        const cache = [];
        pointer.forEach((ptr, i) => {
          const [n, start, end] = ptr;
          if (ptr.length === 1) {
            cache[i] = this._cache[n];
          } else if (start === 0 && this.document[n].length === end) {
            cache[i] = this._cache[n];
          }
        });
        if (cache.length > 0) {
          m._cache = cache;
        }
      }
      m.world = this.world;
      return m
    }
    // create a new View, from this one
    toView(pointer) {
      return new View(this.document, pointer || this.pointer)
    }
    fromText(input) {
      const { methods } = this;
      //assume ./01-tokenize is installed
      const document = methods.one.tokenize.fromString(input, this.world);
      const doc = new View(document);
      doc.world = this.world;
      doc.compute(['normal', 'freeze', 'lexicon']);
      if (this.world.compute.preTagger) {
        doc.compute('preTagger');
      }
      doc.compute('unfreeze');
      return doc
    }
    clone() {
      // clone the whole document
      let document = this.document.slice(0); //node 17: structuredClone(document);
      document = document.map(terms => {
        return terms.map(term => {
          term = Object.assign({}, term);
          term.tags = new Set(term.tags);
          return term
        })
      });
      // clone only sub-document ?
      const m = this.update(this.pointer);
      m.document = document;
      m._cache = this._cache; //clone this too?
      return m
    }
  }
  Object.assign(View.prototype, methods$m);

  var version$1 = '14.17.0';

  const isObject$6 = function (item) {
    return item && typeof item === 'object' && !Array.isArray(item)
  };

  const isArray$9 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  const isUnsafeKey = key => key === '__proto__' || key === 'constructor' || key === 'prototype';

  // recursive merge of objects
  function mergeDeep(model, plugin) {
    if (isObject$6(plugin)) {
      for (const key in plugin) {
        // prevent prototype pollution
        if (isUnsafeKey(key)) {
          continue
        }
        if (isObject$6(plugin[key])) {
          if (!model[key]) Object.assign(model, { [key]: {} });
          mergeDeep(model[key], plugin[key]); //recursion
        } else {
          Object.assign(model, { [key]: plugin[key] });
        }
      }
    }
    return model
  }
  // const merged = mergeDeep({ a: 1 }, { b: { c: { d: { e: 12345 } } } })
  // console.dir(merged, { depth: 5 })

  // vroom
  function mergeQuick(model, plugin) {
    for (const key in plugin) {
      if (isUnsafeKey(key)) continue
      model[key] = model[key] || {};
      Object.assign(model[key], plugin[key]);
    }
    return model
  }

  const addIrregulars = function (model, conj) {
    const m = model.two.models || {};
    Object.keys(conj).forEach(k => {
      // verb forms
      if (conj[k].pastTense) {
        if (m.toPast) {
          m.toPast.ex[k] = conj[k].pastTense;
        }
        if (m.fromPast) {
          m.fromPast.ex[conj[k].pastTense] = k;
        }
      }
      if (conj[k].presentTense) {
        if (m.toPresent) {
          m.toPresent.ex[k] = conj[k].presentTense;
        }
        if (m.fromPresent) {
          m.fromPresent.ex[conj[k].presentTense] = k;
        }
      }
      if (conj[k].gerund) {
        if (m.toGerund) {
          m.toGerund.ex[k] = conj[k].gerund;
        }
        if (m.fromGerund) {
          m.fromGerund.ex[conj[k].gerund] = k;
        }
      }
      // adjective forms
      if (conj[k].comparative) {
        if (m.toComparative) {
          m.toComparative.ex[k] = conj[k].comparative;
        }
        if (m.fromComparative) {
          m.fromComparative.ex[conj[k].comparative] = k;
        }
      }
      if (conj[k].superlative) {
        if (m.toSuperlative) {
          m.toSuperlative.ex[k] = conj[k].superlative;
        }
        if (m.fromSuperlative) {
          m.fromSuperlative.ex[conj[k].superlative] = k;
        }
      }
    });
  };

  const extend = function (plugin, world, View, nlp) {
    // support array of plugins
    if (isArray$9(plugin)) {
      plugin.forEach(p => extend(p, world, View, nlp));
      return
    }
    const { methods, model, compute, hooks } = world;
    if (plugin.methods) {
      mergeQuick(methods, plugin.methods);
    }
    if (plugin.model) {
      mergeDeep(model, plugin.model);
    }
    if (plugin.irregulars) {
      addIrregulars(model, plugin.irregulars);
    }
    // shallow-merge compute
    if (plugin.compute) {
      Object.assign(compute, plugin.compute);
    }
    // append new hooks
    if (hooks) {
      world.hooks = hooks.concat(plugin.hooks || []);
    }
    // assign new class methods
    if (plugin.api) {
      plugin.api(View);
    }
    if (plugin.lib) {
      Object.keys(plugin.lib).forEach(k => (nlp[k] = plugin.lib[k]));
    }
    if (plugin.tags) {
      nlp.addTags(plugin.tags);
    }
    if (plugin.words) {
      nlp.addWords(plugin.words);
    }
    if (plugin.frozen) {
      nlp.addWords(plugin.frozen, true);
    }
    if (plugin.mutate) {
      plugin.mutate(world, nlp);
    }
  };

  /** log the decision-making to console */
  const verbose = function (set) {
    const env = typeof process === 'undefined' || !process.env ? self.env || {} : process.env; //use window, in browser
    env.DEBUG_TAGS = set === 'tagger' || set === true ? true : '';
    env.DEBUG_MATCH = set === 'match' || set === true ? true : '';
    env.DEBUG_CHUNKS = set === 'chunker' || set === true ? true : '';
    return this
  };

  const isObject$5 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  const isArray$8 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  // internal Term objects are slightly different
  const fromJson = function (json) {
    return json.map(o => {
      return o.terms.map(term => {
        if (isArray$8(term.tags)) {
          term.tags = new Set(term.tags);
        }
        return term
      })
    })
  };

  // interpret an array-of-arrays
  const preTokenized = function (arr) {
    return arr.map((a) => {
      return a.map(str => {
        return {
          text: str,
          normal: str,//cleanup
          pre: '',
          post: ' ',
          tags: new Set()
        }
      })
    })
  };

  const inputs = function (input, View, world) {
    const { methods } = world;
    const doc = new View([]);
    doc.world = world;
    // support a number
    if (typeof input === 'number') {
      input = String(input);
    }
    // return empty doc
    if (!input) {
      return doc
    }
    // parse a string
    if (typeof input === 'string') {
      const document = methods.one.tokenize.fromString(input, world);
      return new View(document)
    }
    // handle compromise View
    if (isObject$5(input) && input.isView) {
      return new View(input.document, input.ptrs)
    }
    // handle json input
    if (isArray$8(input)) {
      // pre-tokenized array-of-arrays 
      if (isArray$8(input[0])) {
        const document = preTokenized(input);
        return new View(document)
      }
      // handle json output
      const document = fromJson(input);
      return new View(document)
    }
    return doc
  };

  const world = Object.assign({}, tmpWrld);

  const nlp = function (input, lex) {
    if (lex) {
      nlp.addWords(lex);
    }
    const doc = inputs(input, View, world);
    if (input) {
      doc.compute(world.hooks);
    }
    return doc
  };
  Object.defineProperty(nlp, '_world', {
    value: world,
    writable: true,
  });

  /** don't run the POS-tagger */
  nlp.tokenize = function (input, lex) {
    const { compute } = this._world;
    // add user-given words to lexicon
    if (lex) {
      nlp.addWords(lex);
    }
    // run the tokenizer
    const doc = inputs(input, View, world);
    // give contractions a shot, at least
    if (compute.contractions) {
      doc.compute(['alias', 'normal', 'machine', 'contractions']); //run it if we've got it
    }
    return doc
  };

  /** extend compromise functionality */
  nlp.plugin = function (plugin) {
    extend(plugin, this._world, View, this);
    return this
  };
  nlp.extend = nlp.plugin;


  /** reach-into compromise internals */
  nlp.world = function () {
    return this._world
  };
  nlp.model = function () {
    return this._world.model
  };
  nlp.methods = function () {
    return this._world.methods
  };
  nlp.hooks = function () {
    return this._world.hooks
  };

  /** log the decision-making to console */
  nlp.verbose = verbose;
  /** current library release version */
  nlp.version = version$1;

  const createCache = function (document) {
    const cache = document.map(terms => {
      const items = new Set();
      terms.forEach(term => {
        // add words
        if (term.normal !== '') {
          items.add(term.normal);
        }
        // cache switch-status - '%Noun|Verb%'
        if (term.switch) {
          items.add(`%${term.switch}%`);
        }
        // cache implicit words, too
        if (term.implicit) {
          items.add(term.implicit);
        }
        if (term.machine) {
          items.add(term.machine);
        }
        if (term.root) {
          items.add(term.root);
        }
        // cache slashes words, etc
        if (term.alias) {
          term.alias.forEach(str => items.add(str));
        }
        const tags = Array.from(term.tags);
        for (let t = 0; t < tags.length; t += 1) {
          items.add('#' + tags[t]);
        }
      });
      return items
    });
    return cache
  };

  var methods$l = {
    one: {
      cacheDoc: createCache,
    },
  };

  const methods$k = {
    /** */
    cache: function () {
      this._cache = this.methods.one.cacheDoc(this.document);
      return this
    },
    /** */
    uncache: function () {
      this._cache = null;
      return this
    },
  };
  const addAPI$3 = function (View) {
    Object.assign(View.prototype, methods$k);
  };

  var compute$6 = {
    cache: function (view) {
      view._cache = view.methods.one.cacheDoc(view.document);
    }
  };

  var cache$1 = {
    api: addAPI$3,
    compute: compute$6,
    methods: methods$l,
  };

  var caseFns = {
    /** */
    toLowerCase: function () {
      this.termList().forEach(t => {
        t.text = t.text.toLowerCase();
      });
      return this
    },
    /** */
    toUpperCase: function () {
      this.termList().forEach(t => {
        t.text = t.text.toUpperCase();
      });
      return this
    },
    /** */
    toTitleCase: function () {
      this.termList().forEach(t => {
        t.text = t.text.replace(/^ *[a-z\u00C0-\u00FF]/, x => x.toUpperCase()); //support unicode?
      });
      return this
    },
    /** */
    toCamelCase: function () {
      this.docs.forEach(terms => {
        terms.forEach((t, i) => {
          if (i !== 0) {
            t.text = t.text.replace(/^ *[a-z\u00C0-\u00FF]/, x => x.toUpperCase()); //support unicode?
          }
          if (i !== terms.length - 1) {
            t.post = '';
          }
        });
      });
      return this
    },
  };

  // case logic
  const isTitleCase$2 = (str) => /^\p{Lu}[\p{Ll}'’]/u.test(str) || /^\p{Lu}$/u.test(str);
  const toTitleCase$1 = (str) => str.replace(/^\p{Ll}/u, x => x.toUpperCase());
  const toLowerCase$1 = (str) => str.replace(/^\p{Lu}/u, x => x.toLowerCase());

  // splice an array into an array
  const spliceArr = (parent, index, child) => {
    // tag them as dirty
    child.forEach(term => term.dirty = true);
    if (parent) {
      const args = [index, 0].concat(child);
      Array.prototype.splice.apply(parent, args);
    }
    return parent
  };

  // add a space at end, if required
  const endSpace = function (terms) {
    const hasSpace = / $/;
    const hasDash = /[-–—]/;
    const lastTerm = terms[terms.length - 1];
    if (lastTerm && !hasSpace.test(lastTerm.post) && !hasDash.test(lastTerm.post)) {
      lastTerm.post += ' ';
    }
  };

  // sentence-ending punctuation should move in append
  const movePunct = (source, end, needle) => {
    const juicy = /[-.?!,;:)–—'"]/g;
    const wasLast = source[end - 1];
    if (!wasLast) {
      return
    }
    const post = wasLast.post;
    if (juicy.test(post)) {
      const punct = post.match(juicy).join(''); //not perfect
      const last = needle[needle.length - 1];
      last.post = punct + last.post;
      // remove it, from source
      wasLast.post = wasLast.post.replace(juicy, '');
    }
  };


  const moveTitleCase = function (home, start, needle) {
    const from = home[start];
    // should we bother?
    if (start !== 0 || !isTitleCase$2(from.text)) {
      return
    }
    // titlecase new first term
    needle[0].text = toTitleCase$1(needle[0].text);
    // should we un-titlecase the old word?
    const old = home[start];
    if (old.tags.has('ProperNoun') || old.tags.has('Acronym')) {
      return
    }
    if (isTitleCase$2(old.text) && old.text.length > 1) {
      old.text = toLowerCase$1(old.text);
    }
  };

  // put these words before the others
  const cleanPrepend = function (home, ptr, needle, document) {
    const [n, start, end] = ptr;
    // introduce spaces appropriately
    if (start === 0) {
      // at start - need space in insert
      endSpace(needle);
    } else if (end === document[n].length) {
      // at end - need space in home
      endSpace(needle);
    } else {
      // in middle - need space in home and insert
      endSpace(needle);
      endSpace([home[ptr[1]]]);
    }
    moveTitleCase(home, start, needle);
    // movePunct(home, end, needle)
    spliceArr(home, start, needle);
  };

  const cleanAppend = function (home, ptr, needle, document) {
    const [n, , end] = ptr;
    const total = (document[n] || []).length;
    if (end < total) {
      // are we in the middle?
      // add trailing space on self
      movePunct(home, end, needle);
      endSpace(needle);
    } else if (total === end) {
      // are we at the end?
      // add a space to predecessor
      endSpace(home);
      // very end, move period
      movePunct(home, end, needle);
      // is there another sentence after?
      if (document[n + 1]) {
        needle[needle.length - 1].post += ' ';
      }
    }
    spliceArr(home, ptr[2], needle);
    // set new endId
    ptr[4] = needle[needle.length - 1].id;
  };

  /*
  unique & ordered term ids, based on time & term index

  Base 36 (numbers+ascii)
    3 digit 4,600
    2 digit 1,200
    1 digit 36

    TTT|NNN|II|R

  TTT -> 46 terms since load
  NNN -> 46 thousand sentences (>1 inf-jest)
  II  -> 1,200 words in a sentence (nuts)
  R   -> 1-36 random number 

  novels: 
    avg 80,000 words
      15 words per sentence
    5,000 sentences

  Infinite Jest:
    36,247 sentences
    https://en.wikipedia.org/wiki/List_of_longest_novels

  collisions are more-likely after
      46 seconds have passed,
    and 
      after 46-thousand sentences

  */
  let index$1 = 0;

  const pad3 = (str) => {
    str = str.length < 3 ? '0' + str : str;
    return str.length < 3 ? '0' + str : str
  };

  const toId = function (term) {
    let [n, i] = term.index || [0, 0];
    index$1 += 1;

    //don't overflow index
    index$1 = index$1 > 46655 ? 0 : index$1;
    //don't overflow sentences
    n = n > 46655 ? 0 : n;
    // //don't overflow terms
    i = i > 1294 ? 0 : i;

    // 3 digits for time
    let id = pad3(index$1.toString(36));
    // 3 digit  for sentence index (46k)
    id += pad3(n.toString(36));

    // 1 digit for term index (36)
    let tx = i.toString(36);
    tx = tx.length < 2 ? '0' + tx : tx; //pad2
    id += tx;

    // 1 digit random number
    const r = parseInt(Math.random() * 36, 10);
    id += (r).toString(36);

    return term.normal + '|' + id.toUpperCase()
  };

  // setInterval(() => console.log(toId(4, 12)), 100)

  // are we inserting inside a contraction?
  // expand it first
  const expand$1 = function (m) {
    if (m.has('@hasContraction') && typeof m.contractions === 'function') {
      //&& m.after('^.').has('@hasContraction')
      const more = m.grow('@hasContraction');
      more.contractions().expand();
    }
  };

  const isArray$7 = arr => Object.prototype.toString.call(arr) === '[object Array]';

  // set new ids for each terms
  const addIds$2 = function (terms) {
    terms = terms.map(term => {
      term.id = toId(term);
      return term
    });
    return terms
  };

  const getTerms = function (input, world) {
    const { methods } = world;
    // create our terms from a string
    if (typeof input === 'string') {
      return methods.one.tokenize.fromString(input, world)[0] //assume one sentence
    }
    //allow a view object
    if (typeof input === 'object' && input.isView) {
      return input.clone().docs[0] || [] //assume one sentence
    }
    //allow an array of terms, too
    if (isArray$7(input)) {
      return isArray$7(input[0]) ? input[0] : input
    }
    return []
  };

  const insert = function (input, view, prepend) {
    const { document, world } = view;
    view.uncache();
    // insert words at end of each doc
    const ptrs = view.fullPointer;
    const selfPtrs = view.fullPointer;
    view.forEach((m, i) => {
      const ptr = m.fullPointer[0];
      const [n] = ptr;
      // add-in the words
      const home = document[n];
      let terms = getTerms(input, world);
      // are we inserting nothing?
      if (terms.length === 0) {
        return
      }
      terms = addIds$2(terms);
      if (prepend) {
        expand$1(view.update([ptr]).firstTerm());
        cleanPrepend(home, ptr, terms, document);
      } else {
        expand$1(view.update([ptr]).lastTerm());
        cleanAppend(home, ptr, terms, document);
      }
      // harden the pointer
      if (document[n] && document[n][ptr[1]]) {
        ptr[3] = document[n][ptr[1]].id;
      }
      // change self backwards by len
      selfPtrs[i] = ptr;
      // extend the pointer
      ptr[2] += terms.length;
      ptrs[i] = ptr;
    });
    const doc = view.toView(ptrs);
    // shift our self pointer, if necessary
    view.ptrs = selfPtrs;
    // try to tag them, too
    doc.compute(['id', 'index', 'freeze', 'lexicon']);
    if (doc.world.compute.preTagger) {
      doc.compute('preTagger');
    }
    doc.compute('unfreeze');
    return doc
  };

  const fns$3 = {
    insertAfter: function (input) {
      return insert(input, this, false)
    },
    insertBefore: function (input) {
      return insert(input, this, true)
    },
  };
  fns$3.append = fns$3.insertAfter;
  fns$3.prepend = fns$3.insertBefore;
  fns$3.insert = fns$3.insertAfter;

  const dollarStub = /\$[0-9a-z]+/g;
  const fns$2 = {};

  // case logic
  const isTitleCase$1 = (str) => /^\p{Lu}[\p{Ll}'’]/u.test(str) || /^\p{Lu}$/u.test(str);
  const toTitleCase = (str) => str.replace(/^\p{Ll}/u, x => x.toUpperCase());
  const toLowerCase = (str) => str.replace(/^\p{Lu}/u, x => x.toLowerCase());

  // doc.replace('foo', (m)=>{})
  const replaceByFn = function (main, fn, keep) {
    main.forEach(m => {
      const out = fn(m);
      m.replaceWith(out, keep);
    });
    return main
  };

  // support 'foo $0' replacements
  const subDollarSign = function (input, main) {
    if (typeof input !== 'string') {
      return input
    }
    const groups = main.groups();
    input = input.replace(dollarStub, a => {
      const num = a.replace(/\$/, '');
      if (groups.hasOwnProperty(num)) {
        return groups[num].text()
      }
      return a
    });
    return input
  };

  fns$2.replaceWith = function (input, keep = {}) {
    let ptrs = this.fullPointer;
    // support keep-all option
    if (keep === true) {
      keep = {
        tags: true,
        case: true,
        possessives: true,
      };
    }
    const main = this;
    this.uncache();
    if (typeof input === 'function') {
      return replaceByFn(main, input, keep)
    }
    const terms = main.docs[0];
    if (!terms) return main
    const isOriginalPossessive = keep.possessives && terms[terms.length - 1].tags.has('Possessive');
    const isOriginalTitleCase = keep.case && isTitleCase$1(terms[0].text);
    // support 'foo $0' replacements
    input = subDollarSign(input, main);

    const original = this.update(ptrs);
    // soften-up pointer
    ptrs = ptrs.map(ptr => ptr.slice(0, 3));
    // original.freeze()
    let oldTags = (original.docs[0] || []).map(term => Array.from(term.tags));
    const originalPre = original.docs[0][0].pre;
    const originalPost = original.docs[0][original.docs[0].length - 1].post;
    // slide this in
    if (typeof input === 'string') {
      input = this.fromText(input).compute('id');
    }
    main.insertAfter(input);
    // are we replacing part of a contraction?
    if (original.has('@hasContraction') && main.contractions) {
      const more = main.grow('@hasContraction+');
      more.contractions().expand();
    }
    // delete the original terms
    main.delete(original); //science.

    // keep "John's"
    if (isOriginalPossessive) {
      const tmp = main.docs[0];
      const term = tmp[tmp.length - 1];
      if (!term.tags.has('Possessive')) {
        term.text += "'s";
        term.normal += "'s";
        term.tags.add('Possessive');
      }
    }

    // try to keep some pre-punctuation
    if (originalPre && main.docs[0]) {
      main.docs[0][0].pre = originalPre;
    }
    // try to keep any post-punctuation
    if (originalPost && main.docs[0]) {
      const lastOne = main.docs[0][main.docs[0].length - 1];
      if (!lastOne.post.trim()) {
        lastOne.post = originalPost;
      }
    }
    // what should we return?
    const m = main.toView(ptrs).compute(['index', 'freeze', 'lexicon']);
    if (m.world.compute.preTagger) {
      m.compute('preTagger');
    }
    m.compute('unfreeze');
    // replace any old tags
    if (keep.tags) {
      // truncate old tags to only touch new terms
      oldTags = oldTags.slice(0, input.wordCount());
      m.terms().forEach((term, i) => {
        term.tagSafe(oldTags[i]);
      });
    }

    if (!m.docs[0] || !m.docs[0][0]) return m

    // try to co-erce case, too
    if (keep.case) {
      const transformCase = isOriginalTitleCase ? toTitleCase : toLowerCase;
      m.docs[0][0].text = transformCase(m.docs[0][0].text);
    }
    return m
  };

  fns$2.replace = function (match, input, keep) {
    if (match && !input) {
      return this.replaceWith(match, keep)
    }
    const m = this.match(match);
    if (!m.found) {
      return this
    }
    this.soften();
    return m.replaceWith(input, keep)
  };

  // transfer sentence-ending punctuation
  const repairPunct = function (terms, len) {
    const last = terms.length - 1;
    const from = terms[last];
    const to = terms[last - len];
    if (to && from) {
      to.post += from.post; //this isn't perfect.
      to.post = to.post.replace(/ +([.?!,;:])/, '$1');
      // don't allow any silly punctuation outcomes like ',!'
      to.post = to.post.replace(/[,;:]+([.?!])/, '$1');
    }
  };

  // remove terms from document json
  const pluckOut = function (document, nots) {
    nots.forEach(ptr => {
      const [n, start, end] = ptr;
      const len = end - start;
      if (!document[n]) {
        return // weird!
      }
      if (end === document[n].length && end > 1) {
        repairPunct(document[n], len);
      }
      document[n].splice(start, len); // replaces len terms at index start
    });
    // remove any now-empty sentences
    // (foreach + splice = 'mutable filter')
    for (let i = document.length - 1; i >= 0; i -= 1) {
      if (document[i].length === 0) {
        document.splice(i, 1);
        // remove any trailing whitespace before our removed sentence
        if (i === document.length && document[i - 1]) {
          const terms = document[i - 1];
          const lastTerm = terms[terms.length - 1];
          if (lastTerm) {
            lastTerm.post = lastTerm.post.trimEnd();
          }
        }
        // repair any downstream indexes
        // for (let k = i; k < document.length; k += 1) {
        //   document[k].forEach(term => term.index[0] -= 1)
        // }
      }
    }
    return document
  };

  const fixPointers$1 = function (ptrs, gonePtrs) {
    ptrs = ptrs.map(ptr => {
      const [n] = ptr;
      if (!gonePtrs[n]) {
        return ptr
      }
      gonePtrs[n].forEach(no => {
        const len = no[2] - no[1];
        // does it effect our pointer?
        if (ptr[1] <= no[1] && ptr[2] >= no[2]) {
          ptr[2] -= len;
        }
      });
      return ptr
    });

    // decrement any pointers after a now-empty pointer
    ptrs.forEach((ptr, i) => {
      // is the pointer now empty?
      if (ptr[1] === 0 && ptr[2] == 0) {
        // go down subsequent pointers
        for (let n = i + 1; n < ptrs.length; n += 1) {
          ptrs[n][0] -= 1;
          if (ptrs[n][0] < 0) {
            ptrs[n][0] = 0;
          }
        }
      }
    });
    // remove any now-empty pointers
    ptrs = ptrs.filter(ptr => ptr[2] - ptr[1] > 0);

    // remove old hard-pointers
    ptrs = ptrs.map((ptr) => {
      ptr[3] = null;
      ptr[4] = null;
      return ptr
    });
    return ptrs
  };

  const methods$j = {
    /** */
    remove: function (reg) {
      const { indexN } = this.methods.one.pointer;
      this.uncache();
      // two modes:
      //  - a. remove self, from full parent
      let self = this.all();
      let not = this;
      //  - b. remove a match, from self
      if (reg) {
        self = this;
        not = this.match(reg);
      }
      const isFull = !self.ptrs;
      // is it part of a contraction?
      if (not.has('@hasContraction') && not.contractions) {
        const more = not.grow('@hasContraction');
        more.contractions().expand();
      }

      let ptrs = self.fullPointer;
      const nots = not.fullPointer.reverse();
      // remove them from the actual document)
      const document = pluckOut(this.document, nots);
      // repair our pointers
      const gonePtrs = indexN(nots);
      ptrs = fixPointers$1(ptrs, gonePtrs);
      // clean up our original inputs
      self.ptrs = ptrs;
      self.document = document;
      self.compute('index');
      // if we started zoomed-out, try to end zoomed-out
      if (isFull) {
        self.ptrs = undefined;
      }
      if (!reg) {
        this.ptrs = [];
        return self.none()
      }
      const res = self.toView(ptrs); //return new document
      return res
    },
  };

  // aliases
  methods$j.delete = methods$j.remove;

  const methods$i = {
    /** add this punctuation or whitespace before each match: */
    pre: function (str, concat) {
      if (str === undefined && this.found) {
        return this.docs[0][0].pre
      }
      this.docs.forEach(terms => {
        const term = terms[0];
        if (concat === true) {
          term.pre += str;
        } else {
          term.pre = str;
        }
      });
      return this
    },

    /** add this punctuation or whitespace after each match: */
    post: function (str, concat) {
      if (str === undefined) {
        const last = this.docs[this.docs.length - 1];
        return last[last.length - 1].post
      }
      this.docs.forEach(terms => {
        const term = terms[terms.length - 1];
        if (concat === true) {
          term.post += str;
        } else {
          term.post = str;
        }
      });
      return this
    },

    /** remove whitespace from start/end */
    trim: function () {
      if (!this.found) {
        return this
      }
      const docs = this.docs;
      const start = docs[0][0];
      start.pre = start.pre.trimStart();
      const last = docs[docs.length - 1];
      const end = last[last.length - 1];
      end.post = end.post.trimEnd();
      return this
    },

    /** connect words with hyphen, and remove whitespace */
    hyphenate: function () {
      this.docs.forEach(terms => {
        //remove whitespace
        terms.forEach((t, i) => {
          if (i !== 0) {
            t.pre = '';
          }
          if (terms[i + 1]) {
            t.post = '-';
          }
        });
      });
      return this
    },

    /** remove hyphens between words, and set whitespace */
    dehyphenate: function () {
      const hasHyphen = /[-–—]/;
      this.docs.forEach(terms => {
        //remove whitespace
        terms.forEach(t => {
          if (hasHyphen.test(t.post)) {
            t.post = ' ';
          }
        });
      });
      return this
    },

    /** add quotations around these matches */
    toQuotations: function (start, end) {
      start = start || `"`;
      end = end || `"`;
      this.docs.forEach(terms => {
        terms[0].pre = start + terms[0].pre;
        const last = terms[terms.length - 1];
        last.post = end + last.post;
      });
      return this
    },

    /** add brackets around these matches */
    toParentheses: function (start, end) {
      start = start || `(`;
      end = end || `)`;
      this.docs.forEach(terms => {
        terms[0].pre = start + terms[0].pre;
        const last = terms[terms.length - 1];
        last.post = end + last.post;
      });
      return this
    },
  };

  // aliases
  methods$i.deHyphenate = methods$i.dehyphenate;
  methods$i.toQuotation = methods$i.toQuotations;

  /** alphabetical order */
  const alpha = (a, b) => {
    if (a.normal < b.normal) {
      return -1
    }
    if (a.normal > b.normal) {
      return 1
    }
    return 0
  };

  /** count the # of characters of each match */
  const length = (a, b) => {
    const left = a.normal.trim().length;
    const right = b.normal.trim().length;
    if (left < right) {
      return 1
    }
    if (left > right) {
      return -1
    }
    return 0
  };

  /** count the # of terms in each match */
  const wordCount$1 = (a, b) => {
    if (a.words < b.words) {
      return 1
    }
    if (a.words > b.words) {
      return -1
    }
    return 0
  };

  /** count the # of terms in each match */
  const sequential = (a, b) => {
    if (a[0] < b[0]) {
      return 1
    }
    if (a[0] > b[0]) {
      return -1
    }
    return a[1] > b[1] ? 1 : -1
  };

  /** sort by # of duplicates in the document*/
  const byFreq = function (arr) {
    const counts = {};
    arr.forEach(o => {
      counts[o.normal] = counts[o.normal] || 0;
      counts[o.normal] += 1;
    });
    // sort by freq
    arr.sort((a, b) => {
      const left = counts[a.normal];
      const right = counts[b.normal];
      if (left < right) {
        return 1
      }
      if (left > right) {
        return -1
      }
      return 0
    });
    return arr
  };

  var methods$h = { alpha, length, wordCount: wordCount$1, sequential, byFreq };

  // aliases
  const seqNames = new Set(['index', 'sequence', 'seq', 'sequential', 'chron', 'chronological']);
  const freqNames = new Set(['freq', 'frequency', 'topk', 'repeats']);
  const alphaNames = new Set(['alpha', 'alphabetical']);

  // support function as parameter
  const customSort = function (view, fn) {
    let ptrs = view.fullPointer;
    ptrs = ptrs.sort((a, b) => {
      a = view.update([a]);
      b = view.update([b]);
      return fn(a, b)
    });
    view.ptrs = ptrs; //mutate original
    return view
  };

  /** re-arrange the order of the matches (in place) */
  const sort = function (input) {
    const { docs, pointer } = this;
    this.uncache();
    if (typeof input === 'function') {
      return customSort(this, input)
    }
    input = input || 'alpha';
    const ptrs = pointer || docs.map((_d, n) => [n]);
    let arr = docs.map((terms, n) => {
      return {
        index: n,
        words: terms.length,
        normal: terms.map(t => t.machine || t.normal || '').join(' '),
        pointer: ptrs[n],
      }
    });
    // 'chronological' sorting
    if (seqNames.has(input)) {
      input = 'sequential';
    }
    // alphabetical sorting
    if (alphaNames.has(input)) {
      input = 'alpha';
    }
    // sort by frequency
    if (freqNames.has(input)) {
      arr = methods$h.byFreq(arr);
      return this.update(arr.map(o => o.pointer))
    }
    // apply sort method on each phrase
    if (typeof methods$h[input] === 'function') {
      arr = arr.sort(methods$h[input]);
      return this.update(arr.map(o => o.pointer))
    }
    return this
  };

  /** reverse the order of the matches, but not the words or index */
  const reverse$1 = function () {
    let ptrs = this.pointer || this.docs.map((_d, n) => [n]);
    ptrs = [].concat(ptrs);
    ptrs = ptrs.reverse();
    if (this._cache) {
      this._cache = this._cache.reverse();
    }
    return this.update(ptrs)
  };

  /** remove any duplicate matches */
  const unique = function () {
    const already = new Set();
    const res = this.filter(m => {
      const txt = m.text('machine');
      if (already.has(txt)) {
        return false
      }
      already.add(txt);
      return true
    });
    // this.ptrs = res.ptrs //mutate original?
    return res//.compute('index')
  };

  var sort$1 = { unique, reverse: reverse$1, sort };

  const isArray$6 = (arr) => Object.prototype.toString.call(arr) === '[object Array]';

  // append a new document, somehow
  const combineDocs = function (homeDocs, inputDocs) {
    if (homeDocs.length > 0) {
      // add a space
      const end = homeDocs[homeDocs.length - 1];
      const last = end[end.length - 1];
      if (/ /.test(last.post) === false) {
        last.post += ' ';
      }
    }
    homeDocs = homeDocs.concat(inputDocs);
    return homeDocs
  };

  const combineViews = function (home, input) {
    // is it a view from the same document?
    if (home.document === input.document) {
      const ptrs = home.fullPointer.concat(input.fullPointer);
      return home.toView(ptrs).compute('index')
    }
    // update n of new pointer, to end of our pointer
    const ptrs = input.fullPointer;
    ptrs.forEach(a => {
      a[0] += home.document.length;
    });
    home.document = combineDocs(home.document, input.docs);
    return home.all()
  };

  var concat = {
    // add string as new match/sentence
    concat: function (input) {
      // parse and splice-in new terms
      if (typeof input === 'string') {
        const more = this.fromText(input);
        // easy concat
        if (!this.found || !this.ptrs) {
          this.document = this.document.concat(more.document);
        } else {
          // if we are in the middle, this is actually a splice operation
          const ptrs = this.fullPointer;
          const at = ptrs[ptrs.length - 1][0];
          this.document.splice(at, 0, ...more.document);
        }
        // put the docs
        return this.all().compute('index')
      }
      // plop some view objects together
      if (typeof input === 'object' && input.isView) {
        return combineViews(this, input)
      }
      // assume it's an array of terms
      if (isArray$6(input)) {
        const docs = combineDocs(this.document, input);
        this.document = docs;
        return this.all()
      }
      return this
    },
  };

  // add indexes to pointers
  const harden = function () {
    this.ptrs = this.fullPointer;
    return this
  };
  // remove indexes from pointers
  const soften = function () {
    let ptr = this.ptrs;
    if (!ptr || ptr.length < 1) {
      return this
    }
    ptr = ptr.map(a => a.slice(0, 3));
    this.ptrs = ptr;
    return this
  };
  var harden$1 = { harden, soften };

  const methods$g = Object.assign({}, caseFns, fns$3, fns$2, methods$j, methods$i, sort$1, concat, harden$1);

  const addAPI$2 = function (View) {
    Object.assign(View.prototype, methods$g);
  };

  const compute$5 = {
    id: function (view) {
      const docs = view.docs;
      for (let n = 0; n < docs.length; n += 1) {
        for (let i = 0; i < docs[n].length; i += 1) {
          const term = docs[n][i];
          term.id = term.id || toId(term);
        }
      }
    }
  };

  var change = {
    api: addAPI$2,
    compute: compute$5,
  };

  var contractions$3 = [
    // simple mappings
    { word: '@', out: ['at'] },
    { word: 'arent', out: ['are', 'not'] },
    { word: 'alot', out: ['a', 'lot'] },
    { word: 'brb', out: ['be', 'right', 'back'] },
    { word: 'cannot', out: ['can', 'not'] },
    { word: 'dun', out: ['do', 'not'] },
    { word: "can't", out: ['can', 'not'] },
    { word: "shan't", out: ['should', 'not'] },
    { word: "won't", out: ['will', 'not'] },
    { word: "that's", out: ['that', 'is'] },
    { word: "what's", out: ['what', 'is'] },
    { word: "let's", out: ['let', 'us'] },
    // { word: "there's", out: ['there', 'is'] },
    { word: 'dunno', out: ['do', 'not', 'know'] },
    { word: 'gonna', out: ['going', 'to'] },
    { word: 'gotta', out: ['have', 'got', 'to'] }, //hmm
    { word: 'gimme', out: ['give', 'me'] },
    { word: 'outta', out: ['out', 'of'] },
    { word: 'tryna', out: ['trying', 'to'] },
    { word: 'gtg', out: ['got', 'to', 'go'] },
    { word: 'im', out: ['i', 'am'] },
    { word: 'imma', out: ['I', 'will'] },
    { word: 'imo', out: ['in', 'my', 'opinion'] },
    { word: 'irl', out: ['in', 'real', 'life'] },
    { word: 'ive', out: ['i', 'have'] },
    { word: 'rn', out: ['right', 'now'] },
    { word: 'tbh', out: ['to', 'be', 'honest'] },
    { word: 'wanna', out: ['want', 'to'] },
    { word: `c'mere`, out: ['come', 'here'] },
    { word: `c'mon`, out: ['come', 'on'] },
    // shoulda, coulda
    { word: 'shoulda', out: ['should', 'have'] },
    { word: 'coulda', out: ['coulda', 'have'] },
    { word: 'woulda', out: ['woulda', 'have'] },
    { word: 'musta', out: ['must', 'have'] },

    { word: "tis", out: ['it', 'is'] },
    { word: "twas", out: ['it', 'was'] },
    { word: `y'know`, out: ['you', 'know'] },
    { word: "ne'er", out: ['never'] },
    { word: "o'er", out: ['over'] },
    // contraction-part mappings
    { after: 'll', out: ['will'] },
    { after: 've', out: ['have'] },
    { after: 're', out: ['are'] },
    { after: 'm', out: ['am'] },
    // french contractions
    { before: 'c', out: ['ce'] },
    { before: 'm', out: ['me'] },
    { before: 'n', out: ['ne'] },
    { before: 'qu', out: ['que'] },
    { before: 's', out: ['se'] },
    { before: 't', out: ['tu'] }, // t'aime

    // missing apostrophes
    { word: 'shouldnt', out: ['should', 'not'] },
    { word: 'couldnt', out: ['could', 'not'] },
    { word: 'wouldnt', out: ['would', 'not'] },
    { word: 'hasnt', out: ['has', 'not'] },
    { word: 'wasnt', out: ['was', 'not'] },
    { word: 'isnt', out: ['is', 'not'] },
    { word: 'cant', out: ['can', 'not'] },
    { word: 'dont', out: ['do', 'not'] },
    { word: 'wont', out: ['will', 'not'] },
    // apostrophe d
    { word: 'howd', out: ['how', 'did'] },
    { word: 'whatd', out: ['what', 'did'] },
    { word: 'whend', out: ['when', 'did'] },
    { word: 'whered', out: ['where', 'did'] },
  ];

  // number suffixes that are not units
  const t$1 = true;
  var numberSuffixes = {
    'st': t$1,
    'nd': t$1,
    'rd': t$1,
    'th': t$1,
    'am': t$1,
    'pm': t$1,
    'max': t$1,
    '°': t$1,
    's': t$1, // 1990s
    'e': t$1, // 18e - french/spanish ordinal
    'er': t$1, //french 1er
    'ère': t$1, //''
    'ème': t$1, //french 2ème
  };

  var model$5 = {
    one: {
      contractions: contractions$3,
      numberSuffixes
    }
  };

  // put n new words where 1 word was
  const insertContraction = function (document, point, words) {
    const [n, w] = point;
    if (!words || words.length === 0) {
      return
    }
    words = words.map((word, i) => {
      word.implicit = word.text;
      word.machine = word.text;
      word.pre = '';
      word.post = '';
      word.text = '';
      word.normal = '';
      word.index = [n, w + i];
      return word
    });
    if (words[0]) {
      // move whitespace over
      words[0].pre = document[n][w].pre;
      words[words.length - 1].post = document[n][w].post;
      // add the text/normal to the first term
      words[0].text = document[n][w].text;
      words[0].normal = document[n][w].normal; // move tags too?
    }
    // do the splice
    document[n].splice(w, 1, ...words);
  };

  const hasContraction$1 = /'/;
  //look for a past-tense verb
  // const hasPastTense = (terms, i) => {
  //   let after = terms.slice(i + 1, i + 3)
  //   return after.some(t => t.tags.has('PastTense'))
  // }
  // he'd walked -> had
  // how'd -> did
  // he'd go -> would

  const alwaysDid = new Set([
    'what',
    'how',
    'when',
    'where',
    'why',
  ]);

  // after-words
  const useWould = new Set([
    'be',
    'go',
    'start',
    'think',
    'need',
  ]);

  const useHad = new Set([
    'been',
    'gone'
  ]);
  // they'd gone
  // they'd go


  // he'd been
  //    he had been
  //    he would been

  const _apostropheD = function (terms, i) {
    const before = terms[i].normal.split(hasContraction$1)[0];

    // what'd, how'd
    if (alwaysDid.has(before)) {
      return [before, 'did']
    }
    if (terms[i + 1]) {
      // they'd gone
      if (useHad.has(terms[i + 1].normal)) {
        return [before, 'had']
      }
      // they'd go
      if (useWould.has(terms[i + 1].normal)) {
        return [before, 'would']
      }
    }
    return null
    //   if (hasPastTense(terms, i) === true) {
    //     return [before, 'had']
    //   }
    //   // had/would/did
    //   return [before, 'would']
  };

  //ain't -> are/is not
  const apostropheT = function (terms, i) {
    if (terms[i].normal === "ain't" || terms[i].normal === 'aint') {
      return null //do this in ./two/
    }
    const before = terms[i].normal.replace(/n't/, '');
    return [before, 'not']
  };

  const hasContraction = /'/;
  const isFeminine = /(e|é|aison|sion|tion)$/;
  const isMasculine = /(age|isme|acle|ege|oire)$/;
  // l'amour
  const preL = (terms, i) => {
    // le/la
    const after = terms[i].normal.split(hasContraction)[1];
    // quick french gender disambig (rough)
    if (after && after.endsWith('e')) {
      return ['la', after]
    }
    return ['le', after]
  };

  // d'amerique
  const preD = (terms, i) => {
    const after = terms[i].normal.split(hasContraction)[1];
    // quick guess for noun-agreement (rough)
    if (after && isFeminine.test(after) && !isMasculine.test(after)) {
      return ['du', after]
    } else if (after && after.endsWith('s')) {
      return ['des', after]
    }
    return ['de', after]
  };

  // j'aime
  const preJ = (terms, i) => {
    const after = terms[i].normal.split(hasContraction)[1];
    return ['je', after]
  };

  var french = {
    preJ,
    preL,
    preD,
  };

  const isRange = /^([0-9.]{1,4}[a-z]{0,2}) ?[-–—] ?([0-9]{1,4}[a-z]{0,2})$/i;
  const timeRange = /^([0-9]{1,2}(:[0-9][0-9])?(am|pm)?) ?[-–—] ?([0-9]{1,2}(:[0-9][0-9])?(am|pm)?)$/i;
  const phoneNum = /^[0-9]{3}-[0-9]{4}$/;

  const numberRange = function (terms, i) {
    const term = terms[i];
    let parts = term.text.match(isRange);
    if (parts !== null) {
      // 123-1234 is a phone number, not a number-range
      if (term.tags.has('PhoneNumber') === true || phoneNum.test(term.text)) {
        return null
      }
      return [parts[1], 'to', parts[2]]
    } else {
      parts = term.text.match(timeRange);
      if (parts !== null) {
        return [parts[1], 'to', parts[4]]
      }
    }
    return null
  };

  const numUnit = /^([+-]?[0-9][.,0-9]*)([a-z°²³µ/]+)$/; //(must be lowercase)

  const numberUnit = function (terms, i, world) {
    const notUnit = world.model.one.numberSuffixes || {};
    const term = terms[i];
    const parts = term.text.match(numUnit);
    if (parts !== null) {
      // is it a recognized unit, like 'km'?
      const unit = parts[2].toLowerCase().trim();
      // don't split '3rd'
      if (notUnit.hasOwnProperty(unit)) {
        return null
      }
      return [parts[1], unit] //split it
    }
    return null
  };

  const byApostrophe = /'/;
  const numDash = /^[0-9][^-–—]*[-–—].*?[0-9]/;

  // run tagger on our new implicit terms
  const reTag = function (terms, view, start, len) {
    const tmp = view.update();
    tmp.document = [terms];
    // offer to re-tag neighbours, too
    let end = start + len;
    if (start > 0) {
      start -= 1;
    }
    if (terms[end]) {
      end += 1;
    }
    tmp.ptrs = [[0, start, end]];
  };

  const byEnd = {
    // ain't
    t: (terms, i) => apostropheT(terms, i),
    // how'd
    d: (terms, i) => _apostropheD(terms, i),
  };

  const byStart = {
    // j'aime
    j: (terms, i) => french.preJ(terms, i),
    // l'amour
    l: (terms, i) => french.preL(terms, i),
    // d'amerique
    d: (terms, i) => french.preD(terms, i),
  };

  // pull-apart known contractions from model
  const knownOnes = function (list, term, before, after) {
    for (let i = 0; i < list.length; i += 1) {
      const o = list[i];
      // look for word-word match (cannot-> [can, not])
      if (o.word === term.normal) {
        return o.out
      }
      // look for after-match ('re -> [_, are])
      else if (after !== null && after === o.after) {
        return [before].concat(o.out)
      }
      // look for before-match (l' -> [le, _])
      else if (before !== null && before === o.before && after && after.length > 2) {
        return o.out.concat(after)
        // return [o.out, after] //typeof o.out === 'string' ? [o.out, after] : o.out(terms, i)
      }
    }
    return null
  };

  const toDocs = function (words, view) {
    const doc = view.fromText(words.join(' '));
    doc.compute(['id', 'alias']);
    return doc.docs[0]
  };

  // there's is usually [there, is]
  // but can be 'there has' for 'there has (..) been'
  const thereHas = function (terms, i) {
    for (let k = i + 1; k < 5; k += 1) {
      if (!terms[k]) {
        break
      }
      if (terms[k].normal === 'been') {
        return ['there', 'has']
      }
    }
    return ['there', 'is']
  };

  //really easy ones
  const contractions$2 = view => {
    const { world, document } = view;
    const { model, methods } = world;
    const list = model.one.contractions || [];
    // let units = new Set(model.one.units || [])
    // each sentence
    document.forEach((terms, n) => {
      // loop through terms backwards
      for (let i = terms.length - 1; i >= 0; i -= 1) {
        let before = null;
        let after = null;
        if (byApostrophe.test(terms[i].normal) === true) {
          const res = terms[i].normal.split(byApostrophe);
          before = res[0];
          after = res[1];
        }
        // any known-ones, like 'dunno'?
        let words = knownOnes(list, terms[i], before, after);
        // ['foo', 's']
        if (!words && byEnd.hasOwnProperty(after)) {
          words = byEnd[after](terms, i, world);
        }
        // ['j', 'aime']
        if (!words && byStart.hasOwnProperty(before)) {
          words = byStart[before](terms, i);
        }
        // 'there is' vs 'there has'
        if (before === 'there' && after === 's') {
          words = thereHas(terms, i);
        }
        // actually insert the new terms
        if (words) {
          words = toDocs(words, view);
          insertContraction(document, [n, i], words);
          reTag(document[n], view, i, words.length);
          continue
        }
        // '44-2' has special care
        if (numDash.test(terms[i].normal)) {
          words = numberRange(terms, i);
          if (words) {
            words = toDocs(words, view);
            insertContraction(document, [n, i], words);
            methods.one.setTag(words, 'NumberRange', world); //add custom tag
            // is it a time-range, like '5-9pm'
            if (words[2] && words[2].tags.has('Time')) {
              methods.one.setTag([words[0]], 'Time', world, null, 'time-range');
            }
            reTag(document[n], view, i, words.length);
          }
          continue
        }
        // split-apart '4km'
        words = numberUnit(terms, i, world);
        if (words) {
          words = toDocs(words, view);
          insertContraction(document, [n, i], words);
          methods.one.setTag([words[1]], 'Unit', world, null, 'contraction-unit');
        }
      }
    });
  };

  var compute$4 = { contractions: contractions$2 };

  const plugin = {
    model: model$5,
    compute: compute$4,
    hooks: ['contractions'],
  };

  const freeze$1 = function (view) {
    const world = view.world;
    const { model, methods } = view.world;
    const setTag = methods.one.setTag;
    const { frozenLex } = model.one;
    const multi = model.one._multiCache || {};

    view.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        // basic lexicon lookup
        const t = terms[i];
        const word = t.machine || t.normal;

        // test a multi-word
        if (multi[word] !== undefined && terms[i + 1]) {
          const end = i + multi[word] - 1;
          for (let k = end; k > i; k -= 1) {
            const words = terms.slice(i, k + 1);
            const str = words.map(term => term.machine || term.normal).join(' ');
            // lookup frozen lexicon
            if (frozenLex.hasOwnProperty(str) === true) {
              setTag(words, frozenLex[str], world, false, '1-frozen-multi-lexicon');
              words.forEach(term => (term.frozen = true));
              continue
            }
          }
        }
        // test single word
        if (frozenLex[word] !== undefined && frozenLex.hasOwnProperty(word)) {
          setTag([t], frozenLex[word], world, false, '1-freeze-lexicon');
          t.frozen = true;
          continue
        }
      }
    });
  };

  const unfreeze = function (view) {
    view.docs.forEach(ts => {
      ts.forEach(term => {
        delete term.frozen;
      });
    });
    return view
  };
  var compute$3 = { frozen: freeze$1, freeze: freeze$1, unfreeze };

  /* eslint-disable no-console */
  const blue = str => '\x1b[34m' + str + '\x1b[0m';
  const dim = str => '\x1b[3m\x1b[2m' + str + '\x1b[0m';

  const debug$2 = function (view) {
    view.docs.forEach(terms => {
      console.log(blue('\n  ┌─────────'));
      terms.forEach(t => {
        let str = `  ${dim('│')}  `;
        const txt = t.implicit || t.text || '-';
        if (t.frozen === true) {
          str += `${blue(txt)} ❄️`;
        } else {
          str += dim(txt);
        }
        console.log(str);
      });
    });
  };

  var freeze = {
    // add .compute('freeze')
    compute: compute$3,

    mutate: world => {
      const methods = world.methods.one;
      // add @isFrozen method
      methods.termMethods.isFrozen = term => term.frozen === true;
      // adds `.debug('frozen')`
      methods.debug.freeze = debug$2;
      methods.debug.frozen = debug$2;
    },

    api: function (View) {
      // set all terms to reject any desctructive tags
      View.prototype.freeze = function () {
        this.docs.forEach(ts => {
          ts.forEach(term => {
            term.frozen = true;
          });
        });
        return this
      };
      // reset all terms to allow  any desctructive tags
      View.prototype.unfreeze = function () {
        this.compute('unfreeze');
      };
      // return all frozen terms
      View.prototype.isFrozen = function () {
        return this.match('@isFrozen+')
      };
    },
    // run it in init
    hooks: ['freeze'],
  };

  // scan-ahead to match multiple-word terms - 'jack rabbit'
  const multiWord = function (terms, start_i, world) {
    const { model, methods } = world;
    const setTag = methods.one.setTag;
    const multi = model.one._multiCache || {};
    const { lexicon } = model.one || {};
    const t = terms[start_i];
    const word = t.machine || t.normal;

    // found a word to scan-ahead on
    if (multi[word] !== undefined && terms[start_i + 1]) {
      const end = start_i + multi[word] - 1;
      for (let i = end; i > start_i; i -= 1) {
        const words = terms.slice(start_i, i + 1);
        if (words.length <= 1) {
          return false
        }
        const str = words.map(term => term.machine || term.normal).join(' ');
        // lookup regular lexicon
        if (lexicon.hasOwnProperty(str) === true) {
          const tag = lexicon[str];
          setTag(words, tag, world, false, '1-multi-lexicon');
          // special case for phrasal-verbs - 2nd word is a #Particle
          if (tag && tag.length === 2 && (tag[0] === 'PhrasalVerb' || tag[1] === 'PhrasalVerb')) {
            setTag([words[1]], 'Particle', world, false, '1-phrasal-particle');
          }
          return true
        }
      }
      return false
    }
    return null
  };

  const prefix$2 = /^(under|over|mis|re|un|dis|semi|pre|post)-?/;
  // anti|non|extra|inter|intra|over
  const allowPrefix = new Set(['Verb', 'Infinitive', 'PastTense', 'Gerund', 'PresentTense', 'Adjective', 'Participle']);

  // tag any words in our lexicon
  const checkLexicon = function (terms, i, world) {
    const { model, methods } = world;
    // const fastTag = methods.one.fastTag
    const setTag = methods.one.setTag;
    const { lexicon } = model.one;

    // basic lexicon lookup
    const t = terms[i];
    const word = t.machine || t.normal;
    // normal lexicon lookup
    if (lexicon[word] !== undefined && lexicon.hasOwnProperty(word)) {
      setTag([t], lexicon[word], world, false, '1-lexicon');
      return true
    }
    // lookup aliases in the lexicon
    if (t.alias) {
      const found = t.alias.find(str => lexicon.hasOwnProperty(str));
      if (found) {
        setTag([t], lexicon[found], world, false, '1-lexicon-alias');
        return true
      }
    }
    // prefixing for verbs/adjectives
    if (prefix$2.test(word) === true) {
      const stem = word.replace(prefix$2, '');
      if (lexicon.hasOwnProperty(stem) && stem.length > 3) {
        // only allow prefixes for verbs/adjectives
        if (allowPrefix.has(lexicon[stem])) {
          // console.log('->', word, stem, lexicon[stem])
          setTag([t], lexicon[stem], world, false, '1-lexicon-prefix');
          return true
        }
      }
    }
    return null
  };

  // tag any words in our lexicon - even if it hasn't been filled-up yet
  // rest of pre-tagger is in ./two/preTagger
  const lexicon$3 = function (view) {
    const world = view.world;
    // loop through our terms
    view.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        if (terms[i].tags.size === 0) {
          let found = null;
          found = found || multiWord(terms, i, world);
          // lookup known words
          found = found || checkLexicon(terms, i, world);
        }
      }
    });
  };

  var compute$2 = {
    lexicon: lexicon$3,
  };

  // derive clever things from our lexicon key-value pairs
  const expand = function (words) {
    // const { methods, model } = world
    const lex = {};
    // console.log('start:', Object.keys(lex).length)
    const _multi = {};
    // go through each word in this key-value obj:
    Object.keys(words).forEach(word => {
      const tag = words[word];
      // normalize lexicon a little bit
      word = word.toLowerCase().trim();
      word = word.replace(/'s\b/, '');
      // cache multi-word terms
      const split = word.split(/ /);
      if (split.length > 1) {
        // prefer longer ones
        if (_multi[split[0]] === undefined || split.length > _multi[split[0]]) {
          _multi[split[0]] = split.length;
        }
      }
      lex[word] = lex[word] || tag;
    });
    // cleanup
    delete lex[''];
    delete lex[null];
    delete lex[' '];
    return { lex, _multi }
  };

  var methods$f = {
    one: {
      expandLexicon: expand,
    }
  };

  /** insert new words/phrases into the lexicon */
  const addWords = function (words, isFrozen = false) {
    const world = this.world();
    const { methods, model } = world;
    if (!words) {
      return
    }
    // normalize tag vals
    Object.keys(words).forEach(k => {
      if (typeof words[k] === 'string' && words[k].startsWith('#')) {
        words[k] = words[k].replace(/^#/, '');
      }
    });
    // these words go into a seperate lexicon
    if (isFrozen === true) {
      const { lex, _multi } = methods.one.expandLexicon(words, world);
      Object.assign(model.one._multiCache, _multi);
      Object.assign(model.one.frozenLex, lex);
      return
    }
    // add some words to our lexicon
    if (methods.two.expandLexicon) {
      // do fancy ./two version
      const { lex, _multi } = methods.two.expandLexicon(words, world);
      Object.assign(model.one.lexicon, lex);
      Object.assign(model.one._multiCache, _multi);
    }
    // do basic ./one version
    const { lex, _multi } = methods.one.expandLexicon(words, world);
    Object.assign(model.one.lexicon, lex);
    Object.assign(model.one._multiCache, _multi);
  };

  var lib$5 = { addWords };

  const model$4 = {
    one: {
      lexicon: {}, //setup blank lexicon
      _multiCache: {},
      frozenLex: {}, //2nd lexicon
    },
  };

  var lexicon$2 = {
    model: model$4,
    methods: methods$f,
    compute: compute$2,
    lib: lib$5,
    hooks: ['lexicon'],
  };

  // edited by Spencer Kelly
  // credit to https://github.com/BrunoRB/ahocorasick by Bruno Roberto Búrigo.

  const tokenize$3 = function (phrase, world) {
    const { methods, model } = world;
    const terms = methods.one.tokenize.splitTerms(phrase, model).map(t => methods.one.tokenize.splitWhitespace(t, model));
    return terms.map(term => term.text.toLowerCase())
  };

  // turn an array or object into a compressed aho-corasick structure
  const buildTrie = function (phrases, world) {

    // const tokenize=methods.one.
    const goNext = [{}];
    const endAs = [null];
    const failTo = [0];

    const xs = [];
    let n = 0;
    phrases.forEach(function (phrase) {
      let curr = 0;
      // let wordsB = phrase.split(/ /g).filter(w => w)
      const words = tokenize$3(phrase, world);
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (goNext[curr] && goNext[curr].hasOwnProperty(word)) {
          curr = goNext[curr][word];
        } else {
          n++;
          goNext[curr][word] = n;
          goNext[n] = {};
          curr = n;
          endAs[n] = null;
        }
      }
      endAs[curr] = [words.length];
    });
    // f(s) = 0 for all states of depth 1 (the ones from which the 0 state can transition to)
    for (const word in goNext[0]) {
      n = goNext[0][word];
      failTo[n] = 0;
      xs.push(n);
    }

    while (xs.length) {
      const r = xs.shift();
      // for each symbol a such that g(r, a) = s
      const keys = Object.keys(goNext[r]);
      for (let i = 0; i < keys.length; i += 1) {
        const word = keys[i];
        const s = goNext[r][word];
        xs.push(s);
        // set state = f(r)
        n = failTo[r];
        while (n > 0 && !goNext[n].hasOwnProperty(word)) {
          n = failTo[n];
        }
        if (goNext.hasOwnProperty(n)) {
          const fs = goNext[n][word];
          failTo[s] = fs;
          if (endAs[fs]) {
            endAs[s] = endAs[s] || [];
            endAs[s] = endAs[s].concat(endAs[fs]);
          }
        } else {
          failTo[s] = 0;
        }
      }
    }
    return { goNext, endAs, failTo }
  };

  // console.log(buildTrie(['smart and cool', 'smart and nice']))

  // follow our trie structure
  const scanWords = function (terms, trie, opts) {
    let n = 0;
    const results = [];
    for (let i = 0; i < terms.length; i++) {
      const word = terms[i][opts.form] || terms[i].normal;
      // main match-logic loop:
      while (n > 0 && (trie.goNext[n] === undefined || !trie.goNext[n].hasOwnProperty(word))) {
        n = trie.failTo[n] || 0; // (usually back to 0)
      }
      // did we fail?
      if (!trie.goNext[n].hasOwnProperty(word)) {
        continue
      }
      n = trie.goNext[n][word];
      if (trie.endAs[n]) {
        const arr = trie.endAs[n];
        for (let o = 0; o < arr.length; o++) {
          const len = arr[o];
          const term = terms[i - len + 1];
          const [no, start] = term.index;
          results.push([no, start, start + len, term.id]);
        }
      }
    }
    return results
  };

  const cacheMiss = function (words, cache) {
    for (let i = 0; i < words.length; i += 1) {
      if (cache.has(words[i]) === true) {
        return false
      }
    }
    return true
  };

  const scan = function (view, trie, opts) {
    let results = [];
    opts.form = opts.form || 'normal';
    const docs = view.docs;
    if (!trie.goNext || !trie.goNext[0]) {
      console.error('Compromise invalid lookup trie');//eslint-disable-line
      return view.none()
    }
    const firstWords = Object.keys(trie.goNext[0]);
    // do each phrase
    for (let i = 0; i < docs.length; i++) {
      // can we skip the phrase, all together?
      if (view._cache && view._cache[i] && cacheMiss(firstWords, view._cache[i]) === true) {
        continue
      }
      const terms = docs[i];
      const found = scanWords(terms, trie, opts);
      if (found.length > 0) {
        results = results.concat(found);
      }
    }
    return view.update(results)
  };

  const isObject$4 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  function api$7 (View) {

    /** find all matches in this document */
    View.prototype.lookup = function (input, opts = {}) {
      if (!input) {
        return this.none()
      }
      if (typeof input === 'string') {
        input = [input];
      }
      const trie = isObject$4(input) ? input : buildTrie(input, this.world);
      let res = scan(this, trie, opts);
      res = res.settle();
      return res
    };
  }

  // chop-off tail of redundant vals at end of array
  const truncate = (list, val) => {
    for (let i = list.length - 1; i >= 0; i -= 1) {
      if (list[i] !== val) {
        list = list.slice(0, i + 1);
        return list
      }
    }
    return list
  };

  // prune trie a bit
  const compress = function (trie) {
    trie.goNext = trie.goNext.map(o => {
      if (Object.keys(o).length === 0) {
        return undefined
      }
      return o
    });
    // chop-off tail of undefined vals in goNext array
    trie.goNext = truncate(trie.goNext, undefined);
    // chop-off tail of zeros in failTo array
    trie.failTo = truncate(trie.failTo, 0);
    // chop-off tail of nulls in endAs array
    trie.endAs = truncate(trie.endAs, null);
    return trie
  };

  /** pre-compile a list of matches to lookup */
  const lib$4 = {
    /** turn an array or object into a compressed trie*/
    buildTrie: function (input) {
      const trie = buildTrie(input, this.world());
      return compress(trie)
    }
  };
  // add alias
  lib$4.compile = lib$4.buildTrie;

  var lookup = {
    api: api$7,
    lib: lib$4
  };

  const relPointer = function (ptrs, parent) {
    if (!parent) {
      return ptrs
    }
    ptrs.forEach(ptr => {
      const n = ptr[0];
      if (parent[n]) {
        ptr[0] = parent[n][0]; //n
        ptr[1] += parent[n][1]; //start
        ptr[2] += parent[n][1]; //end
      }
    });
    return ptrs
  };

  // make match-result relative to whole document
  const fixPointers = function (res, parent) {
    let { ptrs } = res;
    const { byGroup } = res;
    ptrs = relPointer(ptrs, parent);
    Object.keys(byGroup).forEach(k => {
      byGroup[k] = relPointer(byGroup[k], parent);
    });
    return { ptrs, byGroup }
  };

  // turn any matchable input intp a list of matches
  const parseRegs = function (regs, opts, world) {
    const one = world.methods.one;
    if (typeof regs === 'number') {
      regs = String(regs);
    }
    // support param as string
    if (typeof regs === 'string') {
      regs = one.killUnicode(regs, world);
      regs = one.parseMatch(regs, opts, world);
    }
    return regs
  };

  const isObject$3 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  // did they pass-in a compromise object?
  const isView = val => val && isObject$3(val) && val.isView === true;

  const isNet = val => val && isObject$3(val) && val.isNet === true;

  const match$1 = function (regs, group, opts) {
    const one = this.methods.one;
    // support param as view object
    if (isView(regs)) {
      return this.intersection(regs)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, { tagger: false }).view.settle()
    }
    regs = parseRegs(regs, opts, this.world);
    const todo = { regs, group };
    const res = one.match(this.docs, todo, this._cache);
    const { ptrs, byGroup } = fixPointers(res, this.fullPointer);
    const view = this.toView(ptrs);
    view._groups = byGroup;
    return view
  };

  const matchOne = function (regs, group, opts) {
    const one = this.methods.one;
    // support at view as a param
    if (isView(regs)) {
      return this.intersection(regs).eq(0)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, { tagger: false, matchOne: true }).view
    }
    regs = parseRegs(regs, opts, this.world);
    const todo = { regs, group, justOne: true };
    const res = one.match(this.docs, todo, this._cache);
    const { ptrs, byGroup } = fixPointers(res, this.fullPointer);
    const view = this.toView(ptrs);
    view._groups = byGroup;
    return view
  };

  const has = function (regs, group, opts) {
    const one = this.methods.one;
    // support view as input
    if (isView(regs)) {
      const ptrs = this.intersection(regs).fullPointer;
      return ptrs.length > 0
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, { tagger: false }).view.found
    }
    regs = parseRegs(regs, opts, this.world);
    const todo = { regs, group, justOne: true };
    const ptrs = one.match(this.docs, todo, this._cache).ptrs;
    return ptrs.length > 0
  };

  // 'if'
  const ifFn = function (regs, group, opts) {
    const one = this.methods.one;
    // support view as input
    if (isView(regs)) {
      return this.filter(m => m.intersection(regs).found)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      const m = this.sweep(regs, { tagger: false }).view.settle();
      return this.if(m) //recurse with result
    }
    regs = parseRegs(regs, opts, this.world);
    const todo = { regs, group, justOne: true };
    let ptrs = this.fullPointer;
    const cache = this._cache || [];
    ptrs = ptrs.filter((ptr, i) => {
      const m = this.update([ptr]);
      const res = one.match(m.docs, todo, cache[i]).ptrs;
      return res.length > 0
    });
    const view = this.update(ptrs);
    // try and reconstruct the cache
    if (this._cache) {
      view._cache = ptrs.map(ptr => cache[ptr[0]]);
    }
    return view
  };

  const ifNo = function (regs, group, opts) {
    const { methods } = this;
    const one = methods.one;
    // support a view object as input
    if (isView(regs)) {
      return this.filter(m => !m.intersection(regs).found)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      const m = this.sweep(regs, { tagger: false }).view.settle();
      return this.ifNo(m)
    }
    // otherwise parse the match string
    regs = parseRegs(regs, opts, this.world);
    const cache = this._cache || [];
    const view = this.filter((m, i) => {
      const todo = { regs, group, justOne: true };
      const ptrs = one.match(m.docs, todo, cache[i]).ptrs;
      return ptrs.length === 0
    });
    // try to reconstruct the cache
    if (this._cache) {
      view._cache = view.ptrs.map(ptr => cache[ptr[0]]);
    }
    return view
  };

  var match$2 = { matchOne, match: match$1, has, if: ifFn, ifNo };

  const before = function (regs, group, opts) {
    const { indexN } = this.methods.one.pointer;
    const pre = [];
    const byN = indexN(this.fullPointer);
    Object.keys(byN).forEach(k => {
      // check only the earliest match in the sentence
      const first = byN[k].sort((a, b) => (a[1] > b[1] ? 1 : -1))[0];
      if (first[1] > 0) {
        pre.push([first[0], 0, first[1]]);
      }
    });
    const preWords = this.toView(pre);
    if (!regs) {
      return preWords
    }
    return preWords.match(regs, group, opts)
  };

  const after = function (regs, group, opts) {
    const { indexN } = this.methods.one.pointer;
    const post = [];
    const byN = indexN(this.fullPointer);
    const document = this.document;
    Object.keys(byN).forEach(k => {
      // check only the latest match in the sentence
      const last = byN[k].sort((a, b) => (a[1] > b[1] ? -1 : 1))[0];
      const [n, , end] = last;
      if (end < document[n].length) {
        post.push([n, end, document[n].length]);
      }
    });
    const postWords = this.toView(post);
    if (!regs) {
      return postWords
    }
    return postWords.match(regs, group, opts)
  };

  const growLeft = function (regs, group, opts) {
    if (typeof regs === 'string') {
      regs = this.world.methods.one.parseMatch(regs, opts, this.world);
    }
    regs[regs.length - 1].end = true; // ensure matches are beside us ←
    const ptrs = this.fullPointer;
    this.forEach((m, n) => {
      const more = m.before(regs, group);
      if (more.found) {
        const terms = more.terms();
        ptrs[n][1] -= terms.length;
        ptrs[n][3] = terms.docs[0][0].id;
      }
    });
    return this.update(ptrs)
  };

  const growRight = function (regs, group, opts) {
    if (typeof regs === 'string') {
      regs = this.world.methods.one.parseMatch(regs, opts, this.world);
    }
    regs[0].start = true; // ensure matches are beside us →
    const ptrs = this.fullPointer;
    this.forEach((m, n) => {
      const more = m.after(regs, group);
      if (more.found) {
        const terms = more.terms();
        ptrs[n][2] += terms.length;
        ptrs[n][4] = null; //remove end-id
      }
    });
    return this.update(ptrs)
  };

  const grow = function (regs, group, opts) {
    return this.growRight(regs, group, opts).growLeft(regs, group, opts)
  };

  var lookaround = { before, after, growLeft, growRight, grow };

  const combine = function (left, right) {
    return [left[0], left[1], right[2]]
  };

  const isArray$5 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  const getDoc$2 = (reg, view, group) => {
    if (typeof reg === 'string' || isArray$5(reg)) {
      return view.match(reg, group)
    }
    if (!reg) {
      return view.none()
    }
    return reg
  };

  const addIds$1 = function (ptr, view) {
    const [n, start, end] = ptr;
    if (view.document[n] && view.document[n][start]) {
      ptr[3] = ptr[3] || view.document[n][start].id;
      if (view.document[n][end - 1]) {
        ptr[4] = ptr[4] || view.document[n][end - 1].id;
      }
    }
    return ptr
  };

  const methods$e = {};
  // [before], [match], [after]
  methods$e.splitOn = function (m, group) {
    const { splitAll } = this.methods.one.pointer;
    const splits = getDoc$2(m, this, group).fullPointer;
    const all = splitAll(this.fullPointer, splits);
    let res = [];
    all.forEach(o => {
      res.push(o.passthrough);
      res.push(o.before);
      res.push(o.match);
      res.push(o.after);
    });
    res = res.filter(p => p);
    res = res.map(p => addIds$1(p, this));
    return this.update(res)
  };

  // [before], [match after]
  methods$e.splitBefore = function (m, group) {
    const { splitAll } = this.methods.one.pointer;
    const splits = getDoc$2(m, this, group).fullPointer;
    const all = splitAll(this.fullPointer, splits);
    // repair matches to favor [match, after]
    // - instead of [before, match]
    for (let i = 0; i < all.length; i += 1) {
      // move a before to a preceding after
      if (!all[i].after && all[i + 1] && all[i + 1].before) {
        // ensure it's from the same original sentence
        if (all[i].match && all[i].match[0] === all[i + 1].before[0]) {
          all[i].after = all[i + 1].before;
          delete all[i + 1].before;
        }
      }
    }

    let res = [];
    all.forEach(o => {
      res.push(o.passthrough);
      res.push(o.before);
      // a, [x, b]
      if (o.match && o.after) {
        res.push(combine(o.match, o.after));
      } else {
        // a, [x], b
        res.push(o.match);
      }
    });
    res = res.filter(p => p);
    res = res.map(p => addIds$1(p, this));
    return this.update(res)
  };

  // [before match], [after]
  methods$e.splitAfter = function (m, group) {
    const { splitAll } = this.methods.one.pointer;
    const splits = getDoc$2(m, this, group).fullPointer;
    const all = splitAll(this.fullPointer, splits);
    let res = [];
    all.forEach(o => {
      res.push(o.passthrough);
      if (o.before && o.match) {
        res.push(combine(o.before, o.match));
      } else {
        res.push(o.before);
        res.push(o.match);
      }
      res.push(o.after);
    });
    res = res.filter(p => p);
    res = res.map(p => addIds$1(p, this));
    return this.update(res)
  };
  methods$e.split = methods$e.splitAfter;

  // check if two pointers are perfectly consecutive
  const isNeighbour = function (ptrL, ptrR) {
    // validate
    if (!ptrL || !ptrR) {
      return false
    }
    // same sentence
    if (ptrL[0] !== ptrR[0]) {
      return false
    }
    // ensure R starts where L ends
    return ptrL[2] === ptrR[1]
  };

  // join two neighbouring words, if they both match
  const mergeIf = function (doc, lMatch, rMatch) {
    const world = doc.world;
    const parseMatch = world.methods.one.parseMatch;
    lMatch = lMatch || '.$'; //defaults
    rMatch = rMatch || '^.';
    const leftMatch = parseMatch(lMatch, {}, world);
    const rightMatch = parseMatch(rMatch, {}, world);
    // ensure end-requirement to left-match, start-requiremnts to right match
    leftMatch[leftMatch.length - 1].end = true;
    rightMatch[0].start = true;
    // let's get going.
    const ptrs = doc.fullPointer;
    const res = [ptrs[0]];
    for (let i = 1; i < ptrs.length; i += 1) {
      const ptrL = res[res.length - 1];
      const ptrR = ptrs[i];
      const left = doc.update([ptrL]);
      const right = doc.update([ptrR]);
      // should we marge left+right?
      if (isNeighbour(ptrL, ptrR) && left.has(leftMatch) && right.has(rightMatch)) {
        // merge right ptr into existing result
        res[res.length - 1] = [ptrL[0], ptrL[1], ptrR[2], ptrL[3], ptrR[4]];
      } else {
        res.push(ptrR);
      }
    }
    // return new pointers
    return doc.update(res)
  };

  const methods$d = {
    //  merge only if conditions are met
    joinIf: function (lMatch, rMatch) {
      return mergeIf(this, lMatch, rMatch)
    },
    // merge all neighbouring matches
    join: function () {
      return mergeIf(this)
    },
  };

  const methods$c = Object.assign({}, match$2, lookaround, methods$e, methods$d);
  // aliases
  methods$c.lookBehind = methods$c.before;
  methods$c.lookBefore = methods$c.before;

  methods$c.lookAhead = methods$c.after;
  methods$c.lookAfter = methods$c.after;

  methods$c.notIf = methods$c.ifNo;
  const matchAPI = function (View) {
    Object.assign(View.prototype, methods$c);
  };

  // match  'foo /yes/' and not 'foo/no/bar'
  const bySlashes = /(?:^|\s)([![^]*(?:<[^<]*>)?\/.*?[^\\/]\/[?\]+*$~]*)(?:\s|$)/;
  // match '(yes) but not foo(no)bar'
  const byParentheses = /([!~[^]*(?:<[^<]*>)?\([^)]+[^\\)]\)[?\]+*$~]*)(?:\s|$)/;
  // okay
  const byWord = / /g;

  const isBlock = str => {
    return /^[![^]*(<[^<]*>)?\(/.test(str) && /\)[?\]+*$~]*$/.test(str)
  };
  const isReg = str => {
    return /^[![^]*(<[^<]*>)?\//.test(str) && /\/[?\]+*$~]*$/.test(str)
  };

  const cleanUp = function (arr) {
    arr = arr.map(str => str.trim());
    arr = arr.filter(str => str);
    return arr
  };

  const parseBlocks = function (txt) {
    // parse by /regex/ first
    const arr = txt.split(bySlashes);
    let res = [];
    // parse by (blocks), next
    arr.forEach(str => {
      if (isReg(str)) {
        res.push(str);
        return
      }
      res = res.concat(str.split(byParentheses));
    });
    res = cleanUp(res);
    // split by spaces, now
    let final = [];
    res.forEach(str => {
      if (isBlock(str)) {
        final.push(str);
      } else if (isReg(str)) {
        final.push(str);
      } else {
        final = final.concat(str.split(byWord));
      }
    });
    final = cleanUp(final);
    return final
  };

  const hasMinMax = /\{([0-9]+)?(, *[0-9]*)?\}/;
  const andSign = /&&/;
  // const hasDash = /\p{Letter}[-–—]\p{Letter}/u
  const captureName = new RegExp(/^<\s*(\S+)\s*>/);
  /* break-down a match expression into this:
  {
    word:'',
    tag:'',
    regex:'',

    start:false,
    end:false,
    negative:false,
    anything:false,
    greedy:false,
    optional:false,

    named:'',
    choices:[],
  }
  */
  const titleCase = str => str.charAt(0).toUpperCase() + str.substring(1);
  const end = (str) => str.charAt(str.length - 1);
  const start = (str) => str.charAt(0);
  const stripStart = (str) => str.substring(1);
  const stripEnd = (str) => str.substring(0, str.length - 1);

  const stripBoth = function (str) {
    str = stripStart(str);
    str = stripEnd(str);
    return str
  };
  //
  const parseToken = function (w, opts) {
    const obj = {};
    //collect any flags (do it twice)
    for (let i = 0; i < 2; i += 1) {
      //end-flag
      if (end(w) === '$') {
        obj.end = true;
        w = stripEnd(w);
      }
      //front-flag
      if (start(w) === '^') {
        obj.start = true;
        w = stripStart(w);
      }
      if (end(w) === '?') {
        obj.optional = true;
        w = stripEnd(w);
      }
      //capture group (this one can span multiple-terms)
      if (start(w) === '[' || end(w) === ']') {
        obj.group = null;
        if (start(w) === '[') {
          obj.groupStart = true;
        }
        if (end(w) === ']') {
          obj.groupEnd = true;
        }
        w = w.replace(/^\[/, '');
        w = w.replace(/\]$/, '');
        // Use capture group name
        if (start(w) === '<') {
          const res = captureName.exec(w);
          if (res.length >= 2) {
            obj.group = res[1];
            w = w.replace(res[0], '');
          }
        }
      }
      //back-flags
      if (end(w) === '+') {
        obj.greedy = true;
        w = stripEnd(w);
      }
      if (w !== '*' && end(w) === '*' && w !== '\\*') {
        obj.greedy = true;
        w = stripEnd(w);
      }
      if (start(w) === '!') {
        obj.negative = true;
        // obj.optional = true
        w = stripStart(w);
      }
      //soft-match
      if (start(w) === '~' && end(w) === '~' && w.length > 2) {
        w = stripBoth(w);
        obj.fuzzy = true;
        obj.min = opts.fuzzy || 0.85;
        if (/\(/.test(w) === false) {
          obj.word = w;
          return obj
        }
      }

      //regex
      if (start(w) === '/' && end(w) === '/') {
        w = stripBoth(w);
        if (opts.caseSensitive) {
          obj.use = 'text';
        }
        obj.regex = new RegExp(w); //potential vuln - security/detect-non-literal-regexp
        return obj
      }

      // support foo{1,9}
      if (hasMinMax.test(w) === true) {
        w = w.replace(hasMinMax, (_a, b, c) => {
          if (c === undefined) {
            // '{3}'	Exactly three times
            obj.min = Number(b);
            obj.max = Number(b);
          } else {
            c = c.replace(/, */, '');
            if (b === undefined) {
              // '{,9}' implied zero min
              obj.min = 0;
              obj.max = Number(c);
            } else {
              // '{2,4}' Two to four times
              obj.min = Number(b);
              // '{3,}' Three or more times
              obj.max = Number(c || 999);
            }
          }
          // use same method as '+'
          obj.greedy = true;
          // 0 as min means the same as '?'
          if (!obj.min) {
            obj.optional = true;
          }
          return ''
        });
      }

      //wrapped-flags
      if (start(w) === '(' && end(w) === ')') {
        // support (one && two)
        if (andSign.test(w)) {
          obj.choices = w.split(andSign);
          obj.operator = 'and';
        } else {
          obj.choices = w.split('|');
          obj.operator = 'or';
        }
        //remove '(' and ')'
        obj.choices[0] = stripStart(obj.choices[0]);
        const last = obj.choices.length - 1;
        obj.choices[last] = stripEnd(obj.choices[last]);
        // clean up the results
        obj.choices = obj.choices.map(s => s.trim());
        obj.choices = obj.choices.filter(s => s);
        //recursion alert!
        obj.choices = obj.choices.map(str => {
          return str.split(/ /g).map(s => parseToken(s, opts))
        });
        w = '';
      }

      //root/sense overloaded
      if (start(w) === '{' && end(w) === '}') {
        w = stripBoth(w);
        // obj.sense = w
        obj.root = w;
        if (/\//.test(w)) {
          const split = obj.root.split(/\//);
          obj.root = split[0];
          obj.pos = split[1];
          if (obj.pos === 'adj') {
            obj.pos = 'Adjective';
          }
          // titlecase
          obj.pos = obj.pos.charAt(0).toUpperCase() + obj.pos.substr(1).toLowerCase();
          // add sense-number too
          if (split[2] !== undefined) {
            obj.sense = split[2];
          }
        }
        return obj
      }
      //chunks
      if (start(w) === '<' && end(w) === '>') {
        w = stripBoth(w);
        obj.chunk = titleCase(w);
        obj.greedy = true;
        return obj
      }
      if (start(w) === '%' && end(w) === '%') {
        w = stripBoth(w);
        obj.switch = w;
        return obj
      }
    }
    //do the actual token content
    if (start(w) === '#') {
      obj.tag = stripStart(w);
      obj.tag = titleCase(obj.tag);
      return obj
    }
    //dynamic function on a term object
    if (start(w) === '@') {
      obj.method = stripStart(w);
      return obj
    }
    if (w === '.') {
      obj.anything = true;
      return obj
    }
    //support alone-astrix
    if (w === '*') {
      obj.anything = true;
      obj.greedy = true;
      obj.optional = true;
      return obj
    }
    if (w) {
      //somehow handle encoded-chars?
      w = w.replace('\\*', '*');
      w = w.replace('\\.', '.');
      if (opts.caseSensitive) {
        obj.use = 'text';
      } else {
        w = w.toLowerCase();
      }
      obj.word = w;
    }
    return obj
  };

  const hasDash$2 = /[a-z0-9][-–—][a-z]/i;

  // match 're-do' -> ['re','do']
  const splitHyphens$1 = function (regs, world) {
    const prefixes = world.model.one.prefixes;
    for (let i = regs.length - 1; i >= 0; i -= 1) {
      const reg = regs[i];
      if (reg.word && hasDash$2.test(reg.word)) {
        let words = reg.word.split(/[-–—]/g);
        // don't split 're-cycle', etc
        if (prefixes.hasOwnProperty(words[0])) {
          continue
        }
        words = words.filter(w => w).reverse();
        regs.splice(i, 1);
        words.forEach(w => {
          const obj = Object.assign({}, reg);
          obj.word = w;
          regs.splice(i, 0, obj);
        });
      }
    }
    return regs
  };

  // add all conjugations of this verb
  const addVerbs$1 = function (token, world) {
    const { all } = world.methods.two.transform.verb || {};
    const str = token.root;
    if (!all) {
      return []
    }
    return all(str, world.model)
  };

  // add all inflections of this noun
  const addNoun = function (token, world) {
    const { all } = world.methods.two.transform.noun || {};
    if (!all) {
      return [token.root]
    }
    return all(token.root, world.model)
  };

  // add all inflections of this adjective
  const addAdjective = function (token, world) {
    const { all } = world.methods.two.transform.adjective || {};
    if (!all) {
      return [token.root]
    }
    return all(token.root, world.model)
  };

  // turn '{walk}' into 'walking', 'walked', etc
  const inflectRoot = function (regs, world) {
    // do we have compromise/two?
    regs = regs.map(token => {
      // a reg to convert '{foo}'
      if (token.root) {
        // check if compromise/two is loaded
        if (world.methods.two && world.methods.two.transform) {
          let choices = [];
          // have explicitly set from POS - '{sweet/adjective}'
          if (token.pos) {
            if (token.pos === 'Verb') {
              choices = choices.concat(addVerbs$1(token, world));
            } else if (token.pos === 'Noun') {
              choices = choices.concat(addNoun(token, world));
            } else if (token.pos === 'Adjective') {
              choices = choices.concat(addAdjective(token, world));
            }
          } else {
            // do verb/noun/adj by default
            choices = choices.concat(addVerbs$1(token, world));
            choices = choices.concat(addNoun(token, world));
            choices = choices.concat(addAdjective(token, world));
          }
          choices = choices.filter(str => str);
          if (choices.length > 0) {
            token.operator = 'or';
            token.fastOr = new Set(choices);
          }
        } else {
          // if no compromise/two, drop down into 'machine' lookup
          token.machine = token.root;
          delete token.id;
          delete token.root;
        }
      }
      return token
    });

    return regs
  };

  // name any [unnamed] capture-groups with a number
  const nameGroups = function (regs) {
    let index = 0;
    let inGroup = null;
    //'fill in' capture groups between start-end
    for (let i = 0; i < regs.length; i++) {
      const token = regs[i];
      if (token.groupStart === true) {
        inGroup = token.group;
        if (inGroup === null) {
          inGroup = String(index);
          index += 1;
        }
      }
      if (inGroup !== null) {
        token.group = inGroup;
      }
      if (token.groupEnd === true) {
        inGroup = null;
      }
    }
    return regs
  };

  // optimize an 'or' lookup, when the (a|b|c) list is simple or multi-word
  const doFastOrMode = function (tokens) {
    return tokens.map(token => {
      if (token.choices !== undefined) {
        // make sure it's an OR
        if (token.operator !== 'or') {
          return token
        }
        if (token.fuzzy === true) {
          return token
        }
        // are they all straight-up words? then optimize them.
        const shouldPack = token.choices.every(block => {
          if (block.length !== 1) {
            return false
          }
          const reg = block[0];
          // ~fuzzy~ words need more care
          if (reg.fuzzy === true) {
            return false
          }
          // ^ and $ get lost in fastOr
          if (reg.start || reg.end) {
            return false
          }
          if (reg.word !== undefined && reg.negative !== true && reg.optional !== true && reg.method !== true) {
            return true //reg is simple-enough
          }
          return false
        });
        if (shouldPack === true) {
          token.fastOr = new Set();
          token.choices.forEach(block => {
            token.fastOr.add(block[0].word);
          });
          delete token.choices;
        }
      }
      return token
    })
  };

  // support ~(a|b|c)~
  const fuzzyOr = function (regs) {
    return regs.map(reg => {
      if (reg.fuzzy && reg.choices) {
        // pass fuzzy-data to each OR choice
        reg.choices.forEach(r => {
          if (r.length === 1 && r[0].word) {
            r[0].fuzzy = true;
            r[0].min = reg.min;
          }
        });
      }
      return reg
    })
  };

  const postProcess = function (regs) {
    // ensure all capture groups names are filled between start and end
    regs = nameGroups(regs);
    // convert 'choices' format to 'fastOr' format
    regs = doFastOrMode(regs);
    // support ~(foo|bar)~
    regs = fuzzyOr(regs);
    return regs
  };

  /** parse a match-syntax string into json */
  const syntax = function (input, opts, world) {
    // fail-fast
    if (input === null || input === undefined || input === '') {
      return []
    }
    opts = opts || {};
    if (typeof input === 'number') {
      input = String(input); //go for it?
    }
    let tokens = parseBlocks(input);
    //turn them into objects
    tokens = tokens.map(str => parseToken(str, opts));
    // '~re-do~'
    tokens = splitHyphens$1(tokens, world);
    // '{walk}'
    tokens = inflectRoot(tokens, world);
    //clean up anything weird
    tokens = postProcess(tokens);
    // console.log(tokens)
    return tokens
  };

  const anyIntersection = function (setA, setB) {
    for (const elem of setB) {
      if (setA.has(elem)) {
        return true
      }
    }
    return false
  };
  // check words/tags against our cache
  const failFast = function (regs, cache) {
    for (let i = 0; i < regs.length; i += 1) {
      const reg = regs[i];
      if (reg.optional === true || reg.negative === true || reg.fuzzy === true) {
        continue
      }
      // is the word missing from the cache?
      if (reg.word !== undefined && cache.has(reg.word) === false) {
        return true
      }
      // is the tag missing?
      if (reg.tag !== undefined && cache.has('#' + reg.tag) === false) {
        return true
      }
      // are all of the fast-or words missing?
      if (reg.fastOr !== undefined && anyIntersection(reg.fastOr, cache) === false) {
        return true
      }
    }
    return false
  };

  // fuzzy-match (damerau-levenshtein)
  // Based on  tad-lispy /node-damerau-levenshtein
  // https://github.com/tad-lispy/node-damerau-levenshtein/blob/master/index.js
  // count steps (insertions, deletions, substitutions, or transpositions)
  const editDistance = function (strA, strB) {
    const aLength = strA.length,
      bLength = strB.length;
    // fail-fast
    if (aLength === 0) {
      return bLength
    }
    if (bLength === 0) {
      return aLength
    }
    // If the limit is not defined it will be calculate from this and that args.
    const limit = (bLength > aLength ? bLength : aLength) + 1;
    if (Math.abs(aLength - bLength) > (limit || 100)) {
      return limit || 100
    }
    // init the array
    const matrix = [];
    for (let i = 0; i < limit; i++) {
      matrix[i] = [i];
      matrix[i].length = limit;
    }
    for (let i = 0; i < limit; i++) {
      matrix[0][i] = i;
    }
    // Calculate matrix.
    let j, a_index, b_index, cost, min, t;
    for (let i = 1; i <= aLength; ++i) {
      a_index = strA[i - 1];
      for (j = 1; j <= bLength; ++j) {
        // Check the jagged distance total so far
        if (i === j && matrix[i][j] > 4) {
          return aLength
        }
        b_index = strB[j - 1];
        cost = a_index === b_index ? 0 : 1; // Step 5
        // Calculate the minimum (much faster than Math.min(...)).
        min = matrix[i - 1][j] + 1; // Deletion.
        if ((t = matrix[i][j - 1] + 1) < min) min = t; // Insertion.
        if ((t = matrix[i - 1][j - 1] + cost) < min) min = t; // Substitution.
        // Update matrix.
        const shouldUpdate =
          i > 1 && j > 1 && a_index === strB[j - 2] && strA[i - 2] === b_index && (t = matrix[i - 2][j - 2] + cost) < min;
        if (shouldUpdate) {
          matrix[i][j] = t;
        } else {
          matrix[i][j] = min;
        }
      }
    }
    // return number of steps
    return matrix[aLength][bLength]
  };
  // score similarity by from 0-1 (steps/length)
  const fuzzyMatch = function (strA, strB, minLength = 3) {
    if (strA === strB) {
      return 1
    }
    //don't even bother on tiny strings
    if (strA.length < minLength || strB.length < minLength) {
      return 0
    }
    const steps = editDistance(strA, strB);
    const length = Math.max(strA.length, strB.length);
    const relative = length === 0 ? 0 : steps / length;
    const similarity = 1 - relative;
    return similarity
  };

  // these methods are called with '@hasComma' in the match syntax
  // various unicode quotation-mark formats
  const startQuote =
    /([\u0022\uFF02\u0027\u201C\u2018\u201F\u201B\u201E\u2E42\u201A\u00AB\u2039\u2035\u2036\u2037\u301D\u0060\u301F])/;

  const endQuote = /([\u0022\uFF02\u0027\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4])/;

  const hasHyphen$1 = /^[-–—]$/;
  const hasDash$1 = / [-–—]{1,3} /;

  /** search the term's 'post' punctuation  */
  const hasPost = (term, punct) => term.post.indexOf(punct) !== -1;
  /** search the term's 'pre' punctuation  */
  // const hasPre = (term, punct) => term.pre.indexOf(punct) !== -1

  const methods$b = {
    /** does it have a quotation symbol?  */
    hasQuote: term => startQuote.test(term.pre) || endQuote.test(term.post),
    /** does it have a comma?  */
    hasComma: term => hasPost(term, ','),
    /** does it end in a period? */
    hasPeriod: term => hasPost(term, '.') === true && hasPost(term, '...') === false,
    /** does it end in an exclamation */
    hasExclamation: term => hasPost(term, '!'),
    /** does it end with a question mark? */
    hasQuestionMark: term => hasPost(term, '?') || hasPost(term, '¿'),
    /** is there a ... at the end? */
    hasEllipses: term => hasPost(term, '..') || hasPost(term, '…'),
    /** is there a semicolon after term word? */
    hasSemicolon: term => hasPost(term, ';'),
    /** is there a colon after term word? */
    hasColon: term => hasPost(term, ':'),
    /** is there a slash '/' in term word? */
    hasSlash: term => /\//.test(term.text),
    /** a hyphen connects two words like-term */
    hasHyphen: term => hasHyphen$1.test(term.post) || hasHyphen$1.test(term.pre),
    /** a dash separates words - like that */
    hasDash: term => hasDash$1.test(term.post) || hasDash$1.test(term.pre),
    /** is it multiple words combinded */
    hasContraction: term => Boolean(term.implicit),
    /** is it an acronym */
    isAcronym: term => term.tags.has('Acronym'),
    /** does it have any tags */
    isKnown: term => term.tags.size > 0,
    /** uppercase first letter, then a lowercase */
    isTitleCase: term => /^\p{Lu}[a-z'\u00C0-\u00FF]/u.test(term.text),
    /** uppercase all letters */
    isUpperCase: term => /^\p{Lu}+$/u.test(term.text),
  };
  // aliases
  methods$b.hasQuotation = methods$b.hasQuote;

  //declare it up here
  let wrapMatch = function () { };
  /** ignore optional/greedy logic, straight-up term match*/
  const doesMatch$1 = function (term, reg, index, length) {
    // support '.'
    if (reg.anything === true) {
      return true
    }
    // support '^' (in parentheses)
    if (reg.start === true && index !== 0) {
      return false
    }
    // support '$' (in parentheses)
    if (reg.end === true && index !== length - 1) {
      return false
    }
    // match an id
    if (reg.id !== undefined && reg.id === term.id) {
      return true
    }
    //support a text match
    if (reg.word !== undefined) {
      // check case-sensitivity, etc
      if (reg.use) {
        return reg.word === term[reg.use]
      }
      //match contractions, machine-form
      if (term.machine !== null && term.machine === reg.word) {
        return true
      }
      // support ~ fuzzy match
      if (reg.fuzzy === true) {
        if (reg.word === term.root) {
          return true
        }
        const score = fuzzyMatch(reg.word, term.normal);
        if (score >= reg.min) {
          return true
        }
      }
      // match slashes and things
      if (term.alias && term.alias.some(str => str === reg.word)) {
        return true
      }
      //match either .normal or .text
      return reg.word === term.text || reg.word === term.normal
    }
    //support #Tag
    if (reg.tag !== undefined) {
      return term.tags.has(reg.tag) === true
    }
    //support @method
    if (reg.method !== undefined) {
      if (typeof methods$b[reg.method] === 'function' && methods$b[reg.method](term) === true) {
        return true
      }
      return false
    }
    //support whitespace/punctuation
    if (reg.pre !== undefined) {
      return term.pre && term.pre.includes(reg.pre)
    }
    if (reg.post !== undefined) {
      return term.post && term.post.includes(reg.post)
    }
    //support /reg/
    if (reg.regex !== undefined) {
      let str = term.normal;
      if (reg.use) {
        str = term[reg.use];
      }
      return reg.regex.test(str)
    }
    //support <chunk>
    if (reg.chunk !== undefined) {
      return term.chunk === reg.chunk
    }
    //support %Noun|Verb%
    if (reg.switch !== undefined) {
      return term.switch === reg.switch
    }
    //support {machine}
    if (reg.machine !== undefined) {
      return term.normal === reg.machine || term.machine === reg.machine || term.root === reg.machine
    }
    //support {word/sense}
    if (reg.sense !== undefined) {
      return term.sense === reg.sense
    }
    // support optimized (one|two)
    if (reg.fastOr !== undefined) {
      // {work/verb} must be a verb
      if (reg.pos && !term.tags.has(reg.pos)) {
        return null
      }
      const str = term.root || term.implicit || term.machine || term.normal;
      return reg.fastOr.has(str) || reg.fastOr.has(term.text)
    }
    //support slower (one|two)
    if (reg.choices !== undefined) {
      // try to support && operator
      if (reg.operator === 'and') {
        // must match them all
        return reg.choices.every(r => wrapMatch(term, r, index, length))
      }
      // or must match one
      return reg.choices.some(r => wrapMatch(term, r, index, length))
    }
    return false
  };
  // wrap result for !negative match logic
  wrapMatch = function (t, reg, index, length) {
    const result = doesMatch$1(t, reg, index, length);
    if (reg.negative === true) {
      return !result
    }
    return result
  };

  // for greedy checking, we no longer care about the reg.start
  // value, and leaving it can cause failures for anchored greedy
  // matches.  ditto for end-greedy matches: we need an earlier non-
  // ending match to succceed until we get to the actual end.
  const getGreedy = function (state, endReg) {
    const reg = Object.assign({}, state.regs[state.r], { start: false, end: false });
    const start = state.t;
    for (; state.t < state.terms.length; state.t += 1) {
      // the number of terms we've matched, if we stop here
      const count = state.t - start + 1;
      //stop for next-reg match - unless we're still under our min
      if (endReg && wrapMatch(state.terms[state.t], endReg, state.start_i + state.t, state.phrase_length)) {
        if (reg.min === undefined || count >= reg.min) {
          return state.t
        }
      }
      // is it max-length now?
      if (reg.max !== undefined && count === reg.max) {
        return state.t
      }
      //stop here
      if (wrapMatch(state.terms[state.t], reg, state.start_i + state.t, state.phrase_length) === false) {
        // is it too short?
        if (reg.min !== undefined && count < reg.min) {
          return null
        }
        return state.t
      }
    }
    // we ran out of terms - did we reach our min?
    if (reg.min !== undefined && state.t - start + 1 < reg.min) {
      return null
    }
    return state.t
  };

  const greedyTo = function (state, nextReg) {
    let t = state.t;
    //if there's no next one, just go off the end!
    if (!nextReg) {
      return state.terms.length
    }
    //otherwise, we're looking for the next one
    for (; t < state.terms.length; t += 1) {
      if (wrapMatch(state.terms[t], nextReg, state.start_i + t, state.phrase_length) === true) {
        // console.log(`greedyTo ${state.terms[t].normal}`)
        return t
      }
    }
    //guess it doesn't exist, then.
    return null
  };

  const isEndGreedy = function (reg, state) {
    if (reg.end === true && reg.greedy === true) {
      if (state.start_i + state.t < state.phrase_length - 1) {
        const tmpReg = Object.assign({}, reg, { end: false });
        if (wrapMatch(state.terms[state.t], tmpReg, state.start_i + state.t, state.phrase_length) === true) {
          // console.log(`endGreedy ${state.terms[state.t].normal}`)
          return true
        }
      }
    }
    return false
  };

  const getGroup$1 = function (state, term_index) {
    if (state.groups[state.inGroup]) {
      return state.groups[state.inGroup]
    }
    state.groups[state.inGroup] = {
      start: term_index,
      length: 0,
    };
    return state.groups[state.inGroup]
  };

  //support 'unspecific greedy' .* properly
  // its logic is 'greedy until', where it's looking for the next token
  // '.+ foo' means we check for 'foo', indefinetly
  const doAstrix = function (state) {
    const { regs } = state;
    const reg = regs[state.r];

    const skipto = greedyTo(state, regs[state.r + 1]);
    //maybe we couldn't find it
    if (skipto === null || skipto === 0) {
      return null
    }
    // ensure it's long enough
    if (reg.min !== undefined && skipto - state.t < reg.min) {
      return null
    }
    // reduce it back, if it's too long
    if (reg.max !== undefined && skipto - state.t > reg.max) {
      state.t = state.t + reg.max;
      return true
    }
    // set the group result
    if (state.hasGroup === true) {
      const g = getGroup$1(state, state.t);
      // accumulate onto any tokens already captured before the wildcard,
      // so '[one .* after]' keeps its leading (and trailing) tokens
      g.length += skipto - state.t;
    }
    state.t = skipto;
    // log(`✓ |greedy|`)
    return true
  };

  const isArray$4 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  // try to match a list of tokens, starting at state.t + skipN
  // returns the number of terms it consumed, or 0 for no-match
  const tryChoice = function (state, regs, skipN) {
    let len = 0;
    for (let w = 0; w < regs.length; w += 1) {
      const cr = regs[w];
      const t = state.t + skipN + len;
      if (state.terms[t] === undefined) {
        return 0
      }
      if (wrapMatch(state.terms[t], cr, state.start_i + t, state.phrase_length) !== true) {
        return 0
      }
      len += 1;
      // this can be greedy - '(foo+ bar)'
      if (cr.greedy === true) {
        // like getGreedy, anchors should not apply to the repeated terms
        const gr = Object.assign({}, cr, { start: false, end: false });
        for (let i = t + 1; i < state.terms.length; i += 1) {
          if (wrapMatch(state.terms[i], gr, state.start_i + i, state.phrase_length) !== true) {
            break
          }
          len += 1;
        }
      }
    }
    return len
  };

  // match the first choice that works - '(a b|c)'
  const tryChoices = function (state, skipN) {
    const block = state.regs[state.r];
    for (let c = 0; c < block.choices.length; c += 1) {
      const regs = block.choices[c];
      if (!isArray$4(regs)) {
        return 0
      }
      const len = tryChoice(state, regs, skipN);
      if (len > 0) {
        return len
      }
    }
    return 0
  };

  const doOrBlock = function (state) {
    const block = state.regs[state.r];
    let skipN = tryChoices(state, 0);
    if (skipN === 0) {
      return 0
    }
    // greedy or-block - keep matching choices - '(a b|c)+'
    if (block.greedy === true) {
      let more = tryChoices(state, skipN);
      while (more > 0) {
        skipN += more;
        more = tryChoices(state, skipN);
      }
    }
    return skipN
  };

  const doAndBlock = function (state) {
    let longest = 0;
    // all blocks must match, and we return the greediest match
    const reg = state.regs[state.r];
    const allDidMatch = reg.choices.every(block => {
      //  for multi-word blocks, all must match
      const allWords = block.every((cr, w_index) => {
        const tryTerm = state.t + w_index;
        if (state.terms[tryTerm] === undefined) {
          return false
        }
        return wrapMatch(state.terms[tryTerm], cr, state.start_i + tryTerm, state.phrase_length)
      });
      if (allWords === true && block.length > longest) {
        longest = block.length;
      }
      return allWords
    });
    if (allDidMatch === true) {
      // console.log(`doAndBlock ${state.terms[state.t].normal}`)
      return longest
    }
    return false
  };

  const orBlock = function (state) {
    const { regs } = state;
    const reg = regs[state.r];
    const skipNum = doOrBlock(state);
    // did we find a match?
    if (skipNum) {
      // handle 'not' logic
      if (reg.negative === true) {
        return null // die
      }
      // tuck in as named-group
      if (state.hasGroup === true) {
        const g = getGroup$1(state, state.t);
        g.length += skipNum;
      }
      // ensure we're at the end
      if (reg.end === true) {
        const end = state.phrase_length;
        if (state.t + state.start_i + skipNum !== end) {
          return null
        }
      }
      state.t += skipNum;
      // log(`✓ |found-or|`)
      return true
    }
    // we didn't find it - for a negative-block, that's good news
    if (reg.negative === true) {
      // a '!(a b)?' can pass-through without consuming anything
      if (!reg.optional) {
        state.t += 1;
      }
      return true
    }
    if (!reg.optional) {
      return null //die
    }
    return true
  };

  // '(foo && #Noun)' - require all matches on the term
  const andBlock = function (state) {
    const { regs } = state;
    const reg = regs[state.r];

    const skipNum = doAndBlock(state);
    if (skipNum) {
      // handle 'not' logic
      if (reg.negative === true) {
        return null // die
      }
      if (state.hasGroup === true) {
        const g = getGroup$1(state, state.t);
        g.length += skipNum;
      }
      // ensure we're at the end
      if (reg.end === true) {
        const end = state.phrase_length;
        if (state.t + state.start_i + skipNum !== end) {
          return null
        }
      }
      state.t += skipNum;
      // log(`✓ |found-and|`)
      return true
    }
    // we didn't find it - for a negative-block, that's good news
    if (reg.negative === true) {
      // a '!(a && b)?' can pass-through without consuming anything
      if (!reg.optional) {
        state.t += 1;
      }
      return true
    }
    if (!reg.optional) {
      return null //die
    }
    return true
  };

  const negGreedy = function (state, reg, nextReg) {
    let skip = 0;
    for (let t = state.t; t < state.terms.length; t += 1) {
      let found = wrapMatch(state.terms[t], reg, state.start_i + t, state.phrase_length);
      // we don't want a match, here
      if (found) {
        break//stop going
      }
      // are we doing 'greedy-to'?
      // - "!foo+ after"  should stop at 'after'
      if (nextReg) {
        found = wrapMatch(state.terms[t], nextReg, state.start_i + t, state.phrase_length);
        if (found) {
          break
        }
      }
      skip += 1;
      // is it max-length now?
      if (reg.max !== undefined && skip === reg.max) {
        break
      }
    }
    if (skip === 0) {
      return false //dead
    }
    // did we satisfy min for !foo{min,max}
    if (reg.min && reg.min > skip) {
      return false//dead
    }
    state.t += skip;
    // state.r += 1
    return true
  };

  // '!foo' should match anything that isn't 'foo'
  // if it matches, return false
  const doNegative = function (state) {
    const { regs } = state;
    const reg = regs[state.r];

    // match *anything* but this term
    const tmpReg = Object.assign({}, reg);
    tmpReg.negative = false; // try removing it

    // found it? if so, we die here
    const found = wrapMatch(state.terms[state.t], tmpReg, state.start_i + state.t, state.phrase_length);
    if (found) {
      return false//bye
    }
    // should we skip the term too?
    if (reg.optional) {
      // "before after" - "before !foo? after"
      // does the next reg match the this term?
      const nextReg = regs[state.r + 1];
      if (nextReg) {
        const fNext = wrapMatch(state.terms[state.t], nextReg, state.start_i + state.t, state.phrase_length);
        if (fNext) {
          state.r += 1;
        } else if (nextReg.optional && regs[state.r + 2]) {
          // ugh. ok,
          // support "!foo? extra? need"
          // but don't scan ahead more than that.
          const fNext2 = wrapMatch(state.terms[state.t], regs[state.r + 2], state.start_i + state.t, state.phrase_length);
          if (fNext2) {
            state.r += 2;
          }
        }
      }
    }
    // negative greedy - !foo+  - super hard!
    if (reg.greedy) {
      return negGreedy(state, tmpReg, regs[state.r + 1])
    }
    state.t += 1;
    return true
  };

  // 'foo? foo' matches are tricky.
  const foundOptional = function (state) {
    const { regs } = state;
    const reg = regs[state.r];
    const term = state.terms[state.t];
    // does the next reg match it too?
    const nextRegMatched = wrapMatch(term, regs[state.r + 1], state.start_i + state.t, state.phrase_length);
    if (reg.negative || nextRegMatched) {
      // but does the next reg match the next term??
      // only skip if it doesn't
      const nextTerm = state.terms[state.t + 1];
      if (!nextTerm || !wrapMatch(nextTerm, regs[state.r + 1], state.start_i + state.t + 1, state.phrase_length)) {
        state.r += 1;
      }
    }
  };

  // keep 'foo+' or 'foo*' going..
  const greedyMatch = function (state) {
    const { regs, phrase_length } = state;
    const reg = regs[state.r];
    // foo{2,4} min-lengths are enforced inside getGreedy
    state.t = getGreedy(state, regs[state.r + 1]);
    if (state.t === null) {
      return null //greedy was too short
    }
    // 'foo+$' - if also an end-anchor, ensure we really reached the end
    if (reg.end === true && state.start_i + state.t !== phrase_length) {
      return null //greedy didn't reach the end
    }
    return true
  };

  // for: ['we', 'have']
  // a match for "we have" should work as normal
  // but matching "we've" should skip over implict terms
  const contractionSkip = function (state) {
    const term = state.terms[state.t];
    const reg = state.regs[state.r];
    // did we match the first part of a contraction?
    if (term.implicit && state.terms[state.t + 1]) {
      const nextTerm = state.terms[state.t + 1];
      // ensure next word is implicit
      if (!nextTerm.implicit) {
        return
      }
      // we matched "we've" - skip-over [we, have]
      if (reg.word === term.normal) {
        state.t += 1;
      }
      // also skip for @hasContraction
      if (reg.method === 'hasContraction') {
        state.t += 1;
      }
    }
  };

  // '[foo]' should also be logged as a group
  const setGroup = function (state, startAt) {
    const reg = state.regs[state.r];
    // Get or create capture group
    const g = getGroup$1(state, startAt);
    // Update group - add greedy or increment length
    if (state.t > 1 && reg.greedy) {
      g.length += state.t - startAt;
    } else {
      g.length++;
    }
  };

  // when a reg matches a term
  const simpleMatch = function (state) {
    const { regs } = state;
    const reg = regs[state.r];
    const term = state.terms[state.t];
    const startAt = state.t;
    // if it's a negative optional match... :0
    if (reg.optional && regs[state.r + 1] && reg.negative) {
      return true
    }
    // okay, it was a match, but if it's optional too,
    // we should check the next reg too, to skip it?
    if (reg.optional && regs[state.r + 1]) {
      foundOptional(state);
    }
    // Contraction skip:
    // did we match the first part of a contraction?
    if (term.implicit && state.terms[state.t + 1]) {
      contractionSkip(state);
    }
    //advance to the next term!
    state.t += 1;
    //check any ending '$' flags
    //if this isn't the last term, refuse the match
    if (reg.end === true && state.t !== state.terms.length && reg.greedy !== true) {
      return null //die
    }
    // keep 'foo+' going...
    if (reg.greedy === true) {
      const alive = greedyMatch(state);
      if (!alive) {
        return null
      }
    }
    // log '[foo]' as a group
    if (state.hasGroup === true) {
      setGroup(state, startAt);
    }
    return true
  };

  // i formally apologize for how complicated this is.

  /** 
   * try a sequence of match tokens ('regs') 
   * on a sequence of terms, 
   * starting at this certain term.
   */
  const tryHere = function (terms, regs, start_i, phrase_length) {
    // console.log(`\n\n:start: '${terms[0].text}':`)
    if (terms.length === 0 || regs.length === 0) {
      return null
    }
    // all the variables that matter
    const state = {
      t: 0,
      terms: terms,
      r: 0,
      regs: regs,
      groups: {},
      start_i: start_i,
      phrase_length: phrase_length,
      inGroup: null,
    };

    // we must satisfy every token in 'regs'
    // if we get to the end, we have a match.
    for (; state.r < regs.length; state.r += 1) {
      const reg = regs[state.r];
      // Check if this reg has a named capture group
      state.hasGroup = Boolean(reg.group);
      // Reuse previous capture group if same
      if (state.hasGroup === true) {
        state.inGroup = reg.group;
      } else {
        state.inGroup = null;
      }
      //have we run-out of terms?
      if (!state.terms[state.t]) {
        //are all remaining regs optional or negative?
        const alive = regs.slice(state.r).some(remain => !remain.optional);
        if (alive === false) {
          break //done!
        }
        return null // die
      }
      // support 'unspecific greedy' .* properly
      if (reg.anything === true && reg.greedy === true) {
        const alive = doAstrix(state);
        if (!alive) {
          return null
        }
        continue
      }
      // slow-OR - multi-word OR (a|b|foo bar)
      if (reg.choices !== undefined && reg.operator === 'or') {
        const alive = orBlock(state);
        if (!alive) {
          return null
        }
        continue
      }
      // slow-AND - multi-word AND (#Noun && foo) blocks
      if (reg.choices !== undefined && reg.operator === 'and') {
        const alive = andBlock(state);
        if (!alive) {
          return null
        }
        continue
      }
      // support '.' as any-single
      if (reg.anything === true) {
        // '!.' negative anything should insta-fail
        if (reg.negative && reg.anything) {
          return null
        }
        const alive = simpleMatch(state);
        if (!alive) {
          return null
        }
        continue
      }
      // support 'foo*$' until the end
      if (isEndGreedy(reg, state) === true) {
        const alive = simpleMatch(state);
        if (!alive) {
          return null
        }
        continue
      }
      // ok, it doesn't match - but maybe it wasn't *supposed* to?
      if (reg.negative) {
        // we want *anything* but this term
        const alive = doNegative(state);
        if (!alive) {
          return null
        }
        continue
      }
      // ok, finally test the term-reg
      const hasMatch = wrapMatch(state.terms[state.t], reg, state.start_i + state.t, state.phrase_length);
      if (hasMatch === true) {
        const alive = simpleMatch(state);
        if (!alive) {
          return null
        }
        continue
      }
      //ok who cares, keep going
      if (reg.optional === true) {
        continue
      }

      // finally, we die
      return null
    }
    //return our results, as pointers
    const pntr = [null, start_i, state.t + start_i];
    if (pntr[1] === pntr[2]) {
      return null //found 0 terms
    }
    const groups = {};
    Object.keys(state.groups).forEach(k => {
      const o = state.groups[k];
      const start = start_i + o.start;
      groups[k] = [null, start, start + o.length];
    });
    return { pointer: pntr, groups: groups }
  };

  // support returning a subset of a match
  // like 'foo [bar] baz' -> bar
  const getGroup = function (res, group) {
    const ptrs = [];
    const byGroup = {};
    if (res.length === 0) {
      return { ptrs, byGroup }
    }
    if (typeof group === 'number') {
      group = String(group);
    }
    if (group) {
      res.forEach(r => {
        if (r.groups[group]) {
          ptrs.push(r.groups[group]);
        }
      });
    } else {
      res.forEach(r => {
        ptrs.push(r.pointer);
        Object.keys(r.groups).forEach(k => {
          byGroup[k] = byGroup[k] || [];
          byGroup[k].push(r.groups[k]);
        });
      });
    }
    return { ptrs, byGroup }
  };

  const notIf = function (results, not, docs) {
    results = results.filter(res => {
      const [n, start, end] = res.pointer;
      const terms = docs[n].slice(start, end);
      for (let i = 0; i < terms.length; i += 1) {
        const slice = terms.slice(i);
        const found = tryHere(slice, not, i, terms.length);
        if (found !== null) {
          return false
        }
      }
      return true
    });
    return results
  };

  // make proper pointers
  const addSentence = function (res, n) {
    res.pointer[0] = n;
    Object.keys(res.groups).forEach(k => {
      res.groups[k][0] = n;
    });
    return res
  };

  const handleStart = function (terms, regs, n) {
    let res = tryHere(terms, regs, 0, terms.length);
    if (res) {
      res = addSentence(res, n);
      return res //getGroup([res], group)
    }
    return null
  };

  // ok, here we go.
  const runMatch$1 = function (docs, todo, cache) {
    cache = cache || [];
    const { regs, group, justOne } = todo;
    let results = [];
    if (!regs || regs.length === 0) {
      return { ptrs: [], byGroup: {} }
    }

    const minLength = regs.filter(r => r.optional !== true && r.negative !== true).length;
    docs: for (let n = 0; n < docs.length; n += 1) {
      const terms = docs[n];
      // let index = terms[0].index || []
      // can we skip this sentence?
      if (cache[n] && failFast(regs, cache[n])) {
        continue
      }
      // ^start regs only run once, per phrase
      if (regs[0].start === true) {
        const foundStart = handleStart(terms, regs, n);
        if (foundStart) {
          results.push(foundStart);
        }
        continue
      }
      //ok, try starting the match now from every term
      for (let i = 0; i < terms.length; i += 1) {
        const slice = terms.slice(i);
        // ensure it's long-enough
        if (slice.length < minLength) {
          break
        }
        let res = tryHere(slice, regs, i, terms.length);
        // did we find a result?
        if (res) {
          // res = addSentence(res, index[0])
          res = addSentence(res, n);
          results.push(res);
          // should we stop here?
          if (justOne === true) {
            break docs
          }
          // skip ahead, over these results
          const end = res.pointer[2];
          if (Math.abs(end - 1) > i) {
            i = Math.abs(end - 1);
          }
        }
      }
    }
    // ensure any end-results ($) match until the last term
    if (regs[regs.length - 1].end === true) {
      results = results.filter(res => {
        const n = res.pointer[0];
        return docs[n].length === res.pointer[2]
      });
    }
    if (todo.notIf) {
      results = notIf(results, todo.notIf, docs);
    }
    // grab the requested group
    results = getGroup(results, group);
    // add ids to pointers
    results.ptrs.forEach(ptr => {
      const [n, start, end] = ptr;
      ptr[3] = docs[n][start].id;//start-id
      ptr[4] = docs[n][end - 1].id;//end-id
    });
    return results
  };

  const methods$a = {
    one: {
      termMethods: methods$b,
      parseMatch: syntax,
      match: runMatch$1,
    },
  };

  var lib$3 = {
    /** pre-parse any match statements */
    parseMatch: function (str, opts) {
      const world = this.world();
      const killUnicode = world.methods.one.killUnicode;
      if (killUnicode) {
        str = killUnicode(str, world);
      }
      return world.methods.one.parseMatch(str, opts, world)
    }
  };

  var match = {
    api: matchAPI,
    methods: methods$a,
    lib: lib$3,
  };

  const isClass = /^\../;
  const isId = /^#./;

  const escapeXml = str => {
    str = str.replace(/&/g, '&amp;');
    str = str.replace(/</g, '&lt;');
    str = str.replace(/>/g, '&gt;');
    str = str.replace(/"/g, '&quot;');
    str = str.replace(/'/g, '&apos;');
    return str
  };

  // interpret .class, #id, tagName
  const toTag = function (k) {
    let start = '';
    let end = '</span>';
    k = escapeXml(k);
    if (isClass.test(k)) {
      start = `<span class="${k.replace(/^\./, '')}"`;
    } else if (isId.test(k)) {
      start = `<span id="${k.replace(/^#/, '')}"`;
    } else {
      start = `<${k}`;
      end = `</${k}>`;
    }
    start += '>';
    return { start, end }
  };

  const getIndex = function (doc, obj) {
    const starts = {};
    const ends = {};
    Object.keys(obj).forEach(k => {
      let res = obj[k];
      const tag = toTag(k);
      if (typeof res === 'string') {
        res = doc.match(res);
      }
      res.docs.forEach(terms => {
        // don't highlight implicit terms
        if (terms.every(t => t.implicit)) {
          return
        }
        const a = terms[0].id;
        starts[a] = starts[a] || [];
        starts[a].push(tag.start);
        const b = terms[terms.length - 1].id;
        ends[b] = ends[b] || [];
        ends[b].push(tag.end);
      });
    });
    return { starts, ends }
  };

  const html = function (obj) {
    // index ids to highlight
    const { starts, ends } = getIndex(this, obj);
    // create the text output
    let out = '';
    this.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        const t = terms[i];
        // do a span tag
        if (starts.hasOwnProperty(t.id)) {
          out += starts[t.id].join('');
        }
        out += t.pre || '';
        out += t.text || '';
        if (ends.hasOwnProperty(t.id)) {
          out += ends[t.id].join('');
        }
        out += t.post || '';
      }
    });
    return out
  };
  var html$1 = { html };

  const trimEnd = /[,:;)\]*.?~!\u0022\uFF02\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4—-]+$/;
  const trimStart =
    /^[(['"*~\uFF02\u201C\u2018\u201F\u201B\u201E\u2E42\u201A\u00AB\u2039\u2035\u2036\u2037\u301D\u0060\u301F]+/;

  const punctToKill = /[,:;)('"\u201D\]]/;
  const isHyphen = /^[-–—]$/;
  const hasSpace = / /;

  const textFromTerms = function (terms, opts, keepSpace = true) {
    let txt = '';
    terms.forEach(t => {
      let pre = t.pre || '';
      let post = t.post || '';
      if (opts.punctuation === 'some') {
        pre = pre.replace(trimStart, '');
        // replace a hyphen with a space
        if (isHyphen.test(post)) {
          post = ' ';
        }
        post = post.replace(punctToKill, '');
        // cleanup exclamations
        post = post.replace(/\?!+/, '?');
        post = post.replace(/!+/, '!');
        post = post.replace(/\?+/, '?');
        // kill elipses
        post = post.replace(/\.{2,}/, '');
        // kill abbreviation periods
        if (t.tags.has('Abbreviation')) {
          post = post.replace(/\./, '');
        }
      }
      if (opts.whitespace === 'some') {
        pre = pre.replace(/\s/, ''); //remove pre-whitespace
        post = post.replace(/\s+/, ' '); //replace post-whitespace with a space
      }
      if (!opts.keepPunct) {
        pre = pre.replace(trimStart, '');
        if (post === '-') {
          post = ' ';
        } else {
          post = post.replace(trimEnd, '');
        }
      }
      // grab the correct word format
      let word = t[opts.form || 'text'] || t.normal || '';
      if (opts.form === 'implicit') {
        word = t.implicit || t.text;
      }
      if (opts.form === 'root' && t.implicit) {
        word = t.root || t.implicit || t.normal;
      }
      // add an implicit space, for contractions
      if ((opts.form === 'machine' || opts.form === 'implicit' || opts.form === 'root') && t.implicit) {
        if (!post || !hasSpace.test(post)) {
          post += ' ';
        }
      }
      txt += pre + word + post;
    });
    if (keepSpace === false) {
      txt = txt.trim();
    }
    if (opts.lowerCase === true) {
      txt = txt.toLowerCase();
    }
    return txt
  };

  const textFromDoc = function (docs, opts) {
    let text = '';
    if (!docs || !docs[0] || !docs[0][0]) {
      return text
    }
    for (let i = 0; i < docs.length; i += 1) {
      // middle
      text += textFromTerms(docs[i], opts, true);
    }
    if (!opts.keepSpace) {
      text = text.trim();
    }
    if (opts.keepEndPunct === false) {
      // don't remove ':)' etc
      if (!docs[0][0].tags.has('Emoticon')) {
        text = text.replace(trimStart, '');
      }
      // remove ending periods
      const last = docs[docs.length - 1];
      if (!last[last.length - 1].tags.has('Emoticon')) {
        text = text.replace(trimEnd, '');
      }
      // kill end quotations
      if (text.endsWith(`'`) && !text.endsWith(`s'`)) {
        text = text.replace(/'/, '');
      }
    }
    if (opts.cleanWhitespace === true) {
      text = text.trim();
    }
    return text
  };

  const fmts = {
    text: {
      form: 'text',
    },
    normal: {
      whitespace: 'some',
      punctuation: 'some',
      case: 'some',
      unicode: 'some',
      form: 'normal',
    },
    machine: {
      keepSpace: false,
      whitespace: 'some',
      punctuation: 'some',
      case: 'none',
      unicode: 'some',
      form: 'machine',
    },
    root: {
      keepSpace: false,
      whitespace: 'some',
      punctuation: 'some',
      case: 'some',
      unicode: 'some',
      form: 'root',
    },
    implicit: {
      form: 'implicit',
    }
  };
  fmts.clean = fmts.normal;
  fmts.reduced = fmts.root;

  /* eslint-disable no-bitwise */
  /* eslint-disable no-mixed-operators */
  /* eslint-disable no-multi-assign */

  // https://github.com/jbt/tiny-hashes/
  const k = [];
  let i$1 = 0;
  for (; i$1 < 64; ) {
    k[i$1] = 0 | (Math.sin(++i$1 % Math.PI) * 4294967296);
  }

  const md5 = function (s) {
    let b,
      c,
      d,
      j = decodeURI(encodeURI(s)) + '\x80',
      a = j.length;

    const h = [(b = 0x67452301), (c = 0xefcdab89), ~b, ~c],
      words = [];

    s = (--a / 4 + 2) | 15;

    words[--s] = a * 8;

    for (; ~a; ) {
      words[a >> 2] |= j.charCodeAt(a) << (8 * a--);
    }

    for (i$1 = j = 0; i$1 < s; i$1 += 16) {
      a = h;

      for (
        ;
        j < 64;
        a = [
          (d = a[3]),
          b +
            (((d =
              a[0] +
              [(b & c) | (~b & d), (d & b) | (~d & c), b ^ c ^ d, c ^ (b | ~d)][(a = j >> 4)] +
              k[j] +
              ~~words[i$1 | ([j, 5 * j + 1, 3 * j + 5, 7 * j][a] & 15)]) <<
              (a = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21][4 * a + (j++ % 4)])) |
              (d >>> -a)),
          b,
          c,
        ]
      ) {
        b = a[1] | 0;
        c = a[2];
      }
      for (j = 4; j; ) h[--j] += a[j];
    }

    for (s = ''; j < 32; ) {
      s += ((h[j >> 3] >> ((1 ^ j++) * 4)) & 15).toString(16);
    }

    return s
  };
  // console.log(md5('food-safety'))

  const defaults$1 = {
    text: true,
    terms: true,
  };

  const opts = { case: 'none', unicode: 'some', form: 'machine', punctuation: 'some' };

  const merge = function (a, b) {
    return Object.assign({}, a, b)
  };

  const fns$1 = {
    text: terms => textFromTerms(terms, { keepPunct: true }, false),
    normal: terms => textFromTerms(terms, merge(fmts.normal, { keepPunct: true }), false),
    implicit: terms => textFromTerms(terms, merge(fmts.implicit, { keepPunct: true }), false),

    machine: terms => textFromTerms(terms, opts, false),
    root: terms => textFromTerms(terms, merge(opts, { form: 'root' }), false),

    hash: terms => md5(textFromTerms(terms, { keepPunct: true }, false)),

    offset: terms => {
      const len = fns$1.text(terms).length;
      return {
        index: terms[0].offset.index,
        start: terms[0].offset.start,
        length: len,
      }
    },
    terms: terms => {
      return terms.map(t => {
        const term = Object.assign({}, t);
        term.tags = Array.from(t.tags);
        return term
      })
    },
    confidence: (_terms, view, i) => view.eq(i).confidence(),
    syllables: (_terms, view, i) => view.eq(i).syllables(),
    sentence: (_terms, view, i) => view.eq(i).fullSentence().text(),
    dirty: terms => terms.some(t => t.dirty === true),
  };
  fns$1.sentences = fns$1.sentence;
  fns$1.clean = fns$1.normal;
  fns$1.reduced = fns$1.root;

  const toJSON$1 = function (view, option) {
    option = option || {};
    if (typeof option === 'string') {
      option = {};
    }
    option = Object.assign({}, defaults$1, option);
    // run any necessary upfront steps
    if (option.offset) {
      view.compute('offset');
    }
    return view.docs.map((terms, i) => {
      const res = {};
      Object.keys(option).forEach(k => {
        if (option[k] && fns$1[k]) {
          res[k] = fns$1[k](terms, view, i);
        }
      });
      return res
    })
  };

  const methods$9 = {
    /** return data */
    json: function (n) {
      const res = toJSON$1(this, n);
      if (typeof n === 'number') {
        return res[n]
      }
      return res
    },
  };
  methods$9.data = methods$9.json;

  const isClientSide = () => typeof window !== 'undefined' && window.document;

  //output some helpful stuff to the console
  const debug$1 = function (fmt) {
    const debugMethods = this.methods.one.debug || {};
    // see if method name exists
    if (fmt && debugMethods.hasOwnProperty(fmt)) {
      debugMethods[fmt](this);
      return this
    }
    // log default client-side view
    if (isClientSide()) {
      debugMethods.clientSide(this);
      return this
    }
    // else, show regular server-side tags view
    debugMethods.tags(this);
    return this
  };

  const toText$2 = function (term) {
    const pre = term.pre || '';
    const post = term.post || '';
    return pre + term.text + post
  };

  const findStarts = function (doc, obj) {
    const starts = {};
    Object.keys(obj).forEach(reg => {
      const m = doc.match(reg);
      m.fullPointer.forEach(a => {
        starts[a[3]] = { fn: obj[reg], end: a[2] };
      });
    });
    return starts
  };

  const wrap = function (doc, obj) {
    // index ids to highlight
    const starts = findStarts(doc, obj);
    let text = '';
    doc.docs.forEach((terms, n) => {
      for (let i = 0; i < terms.length; i += 1) {
        const t = terms[i];
        // do a span tag
        if (starts.hasOwnProperty(t.id)) {
          const { fn, end } = starts[t.id];
          const m = doc.update([[n, i, end]]);
          text += terms[i].pre || '';
          text += fn(m);
          i = end - 1;
          text += terms[i].post || '';
        } else {
          text += toText$2(t);
        }
      }
    });
    return text
  };

  // the 'spec' output format - a clean sentence + an ordered list of top-level tags
  // designed to round-trip between compromise and LLMs (see docs/spec-format.md)

  // roots that describe a token's shape, not its part-of-speech - never picked over a real POS
  const attributeTags = new Set(['Hyphenated', 'Prefix', 'SlashedTerm']);

  // walk a tag up to its top-level (root) ancestor
  const rootOf = function (tag, tagSet) {
    const entry = tagSet[tag];
    if (!entry || !entry.parents || entry.parents.length === 0) {
      return tag
    }
    for (let i = 0; i < entry.parents.length; i += 1) {
      const p = entry.parents[i];
      if (tagSet[p] && (!tagSet[p].parents || tagSet[p].parents.length === 0)) {
        return p
      }
    }
    return entry.parents[entry.parents.length - 1]
  };

  // reduce a term's tag-set to a single top-level tag (or '-' when untagged)
  const slotForTerm = function (term, tagSet) {
    const tags = Array.from(term.tags || []);
    if (tags.length === 0) {
      return '-'
    }
    const primary = tags.find(t => !attributeTags.has(rootOf(t, tagSet))) || tags[0];
    return rootOf(primary, tagSet)
  };

  const makeAliases = function (tagSet) {
    const aliases = {};
    for (const tag in tagSet) {
      const entry = tagSet[tag];
      if (entry.alias) {
        aliases[tag] = entry.alias;
      }
    }
    return aliases
  };

  // one line per sentence: '<text> {Tag,Tag,…}'
  const toSpec = function (doc, world) {
    const tagSet = world.model.one.tagSet;
    const aliases = makeAliases(tagSet);
    return doc.docs.map(terms => {
      const text = terms.reduce((str, t) => str + t.pre + t.text + t.post, '').trim();
      const tags = terms.map(t => {
        let tag = slotForTerm(t, tagSet);
        return aliases[tag] || tag
      }).join(',');
      return `${text} {${tags}}`
    }).join('\n')
  };

  const isObject$2 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  // sort by frequency
  const topk = function (arr) {
    const obj = {};
    arr.forEach(a => {
      obj[a] = obj[a] || 0;
      obj[a] += 1;
    });
    const res = Object.keys(obj).map(k => {
      return { normal: k, count: obj[k] }
    });
    return res.sort((a, b) => (a.count > b.count ? -1 : 0))
  };

  /** some named output formats */
  const out = function (method) {
    // support custom outputs
    if (isObject$2(method)) {
      return wrap(this, method)
    }
    // text out formats
    if (method === 'text') {
      return this.text()
    }
    if (method === 'normal') {
      return this.text('normal')
    }
    if (method === 'root') {
      return this.text('root')
    }
    if (method === 'machine' || method === 'reduced') {
      return this.text('machine')
    }
    if (method === 'hash' || method === 'md5') {
      return md5(this.text())
    }
    // tagged-sentence format for LLMs (see docs/spec-format.md)
    if (method === 'spec') {
      return toSpec(this, this.world)
    }
    // json data formats
    if (method === 'json') {
      return this.json()
    }
    if (method === 'offset' || method === 'offsets') {
      this.compute('offset');
      return this.json({ offset: true })
    }
    if (method === 'array') {
      const arr = this.docs.map(terms => {
        return terms
          .reduce((str, t) => {
            return str + t.pre + t.text + t.post
          }, '')
          .trim()
      });
      return arr.filter(str => str)
    }
    // return terms sorted by frequency
    if (method === 'freq' || method === 'frequency' || method === 'topk') {
      return topk(this.json({ normal: true }).map(o => o.normal))
    }

    // some handy ad-hoc outputs
    if (method === 'terms') {
      let list = [];
      this.docs.forEach(terms => {
        let words = terms.map(t => t.text);
        words = words.filter(t => t);
        list = list.concat(words);
      });
      return list
    }
    if (method === 'tags') {
      return this.docs.map(terms => {
        return terms.reduce((h, t) => {
          h[t.implicit || t.normal] = Array.from(t.tags);
          return h
        }, {})
      })
    }
    if (method === 'debug') {
      return this.debug() //allow
    }
    return this.text()
  };

  const methods$8 = {
    /** */
    debug: debug$1,
    /** */
    out,
    /** */
    wrap: function (obj) {
      return wrap(this, obj)
    },
  };

  const isObject$1 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  var text = {
    /** */
    text: function (fmt) {
      let opts = {};
      if (fmt && typeof fmt === 'string' && fmts.hasOwnProperty(fmt)) {
        opts = Object.assign({}, fmts[fmt]);
      } else if (fmt && isObject$1(fmt)) {
        opts = Object.assign({}, fmt); //todo: fixme
      }
      // is it a full document?
      if (opts.keepSpace === undefined && !this.isFull()) {
        //
        opts.keepSpace = false;
      }
      if (opts.keepEndPunct === undefined && this.pointer) {
        const ptr = this.pointer[0];
        if (ptr && ptr[1]) {
          opts.keepEndPunct = false;
        } else {
          opts.keepEndPunct = true;
        }
      }
      // set defaults
      if (opts.keepPunct === undefined) {
        opts.keepPunct = true;
      }
      if (opts.keepSpace === undefined) {
        opts.keepSpace = true;
      }
      return textFromDoc(this.docs, opts)
    },
  };

  const methods$7 = Object.assign({}, methods$8, text, methods$9, html$1);

  const addAPI$1 = function (View) {
    Object.assign(View.prototype, methods$7);
  };

  /* eslint-disable no-console */
  const logClientSide = function (view) {
    console.log('%c -=-=- ', 'background-color:#6699cc;');
    view.forEach(m => {
      console.groupCollapsed(m.text());
      const terms = m.docs[0];
      const out = terms.map(t => {
        let text = t.text || '-';
        if (t.implicit) {
          text = '[' + t.implicit + ']';
        }
        const tags = '[' + Array.from(t.tags).join(', ') + ']';
        return { text, tags }
      });
      console.table(out, ['text', 'tags']);
      console.groupEnd();
    });
  };

  // https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
  const reset = '\x1b[0m';

  //cheaper than requiring chalk
  const cli = {
    green: str => '\x1b[32m' + str + reset,
    red: str => '\x1b[31m' + str + reset,
    blue: str => '\x1b[34m' + str + reset,
    magenta: str => '\x1b[35m' + str + reset,
    cyan: str => '\x1b[36m' + str + reset,
    yellow: str => '\x1b[33m' + str + reset,
    black: str => '\x1b[30m' + str + reset,
    dim: str => '\x1b[2m' + str + reset,
    i: str => '\x1b[3m' + str + reset,
  };

  /* eslint-disable no-console */

  const tagString = function (tags, model) {
    if (model.one.tagSet) {
      tags = tags.map(tag => {
        if (!model.one.tagSet.hasOwnProperty(tag)) {
          return tag
        }
        const c = model.one.tagSet[tag].color || 'blue';
        return cli[c](tag)
      });
    }
    return tags.join(', ')
  };

  const showTags = function (view) {
    const { docs, model } = view;
    if (docs.length === 0) {
      console.log(cli.blue('\n     ──────'));
    }
    docs.forEach(terms => {
      console.log(cli.blue('\n  ┌─────────'));
      terms.forEach(t => {
        const tags = [...(t.tags || [])];
        let text = t.text || '-';
        if (t.sense) {
          text = `{${t.normal}/${t.sense}}`;
        }
        if (t.implicit) {
          text = '[' + t.implicit + ']';
        }
        text = cli.yellow(text);
        let word = "'" + text + "'";
        if (t.reference) {
          const str = view.update([t.reference]).text('normal');
          word += ` - ${cli.dim(cli.i('[' + str + ']'))}`;
        }
        word = word.padEnd(18);
        const str = cli.blue('  │ ') + cli.i(word) + '  - ' + tagString(tags, model);
        console.log(str);
      });
    });
    console.log('\n');
  };

  /* eslint-disable no-console */

  const showChunks = function (view) {
    const { docs } = view;
    console.log('');
    docs.forEach(terms => {
      const out = [];
      terms.forEach(term => {
        if (term.chunk === 'Noun') {
          out.push(cli.blue(term.implicit || term.normal));
        } else if (term.chunk === 'Verb') {
          out.push(cli.green(term.implicit || term.normal));
        } else if (term.chunk === 'Adjective') {
          out.push(cli.yellow(term.implicit || term.normal));
        } else if (term.chunk === 'Pivot') {
          out.push(cli.red(term.implicit || term.normal));
        } else {
          out.push(term.implicit || term.normal);
        }
      });
      console.log(out.join(' '), '\n');
    });
    console.log('\n');
  };

  /* eslint-disable no-console */

  const split = (txt, offset, index) => {
    const buff = index * 9; //there are 9 new chars addded to each highlight
    const start = offset.start + buff;
    const end = start + offset.length;
    const pre = txt.substring(0, start);
    const mid = txt.substring(start, end);
    const post = txt.substring(end, txt.length);
    return [pre, mid, post]
  };

  const spliceIn = function (txt, offset, index) {
    const parts = split(txt, offset, index);
    return `${parts[0]}${cli.blue(parts[1])}${parts[2]}`
  };

  const showHighlight = function (doc) {
    if (!doc.found) {
      return
    }
    const bySentence = {};
    doc.fullPointer.forEach(ptr => {
      bySentence[ptr[0]] = bySentence[ptr[0]] || [];
      bySentence[ptr[0]].push(ptr);
    });
    Object.keys(bySentence).forEach(k => {
      const full = doc.update([[Number(k)]]);
      let txt = full.text();
      const matches = doc.update(bySentence[k]);
      const json = matches.json({ offset: true });
      json.forEach((obj, i) => {
        txt = spliceIn(txt, obj.offset, i);
      });
      console.log(txt);
    });
    console.log('\n');
  };

  const debug = {
    tags: showTags,
    clientSide: logClientSide,
    chunks: showChunks,
    highlight: showHighlight,
  };

  const lastBrace = /\{(?=[^{]*$)/; // split on the last { only
  const comment = /\}[ \t]*#.*$/; // an optional '# comment' after the last {tags} block

  // parse the spec output
  const parseLine = function (line = '') {
    let [text, tags] = line.split(lastBrace);
    if (tags === undefined) {
      return { text, tags: [] } // no {tags} block on this line
    }
    tags = tags.replace(comment, '}'); // drop the comment - only ever one, always last
    tags = tags.split(',').map(tag => tag.trim());
    let lastTag = tags[tags.length - 1];
    tags[tags.length - 1] = lastTag.replace(/\}$/, '');
    tags = tags.map(tag => tag.split('|').map(t => t.trim()));
    tags = tags.filter(arr => arr.some(t => t !== '')); // drop empty '{}'
    return { text, tags }
  };

  // make a match syntax looping through the arrays of tags
  const toMatchString = function (tags, aliases) {
    return tags.map(arr => {
      arr = arr.map(str => {
        return '#' + (aliases[str] || str)
      });
      if (arr.length > 1) {
        return `(${arr.join(' && ')})`
      }
      return arr[0]
    }).join(' ')
  };

  // parse the adhoc output of out('spec')
  // note: this(text), not this.tokenize().compute(hooks) - tokenize already
  // splits contractions, so re-running hooks would split them twice
  const fromSpec = function (spec) {
    let cleanText = spec.split('\n').filter(line => line.trim()).map(line => {
      return parseLine(line).text
    }).join('\n');
    return this(cleanText)
  };

  // rebuild spec-formatted tag list
  const toTagList = function (tags) {
    return tags.map(arr => arr.join('|')).join(',')
  };

  // compare the tagged text output of out('spec')
  const testSpec = function (spec, verbose = true, throwError = false) {
    let world = this.world();
    let aliases = {};
    // expand tag aliases
    let tagSet = world.model.one.tagSet;
    Object.keys(tagSet).forEach(k => {
      if (tagSet[k].alias) {
        aliases[tagSet[k].alias] = k;
      }
    });
    let failingLines = spec.split('\n').filter(line => line.trim()).map(line => {
      let { text, tags } = parseLine(line);
      // parse it
      let doc = this(text);
      // make compromise-compatible match string
      let matchStr = toMatchString(tags, aliases);
      let didMatch = doc.has(matchStr);
      if (verbose !== false) {
        let char = didMatch ? '✅' : '❌';
        console.log(`${char} ${text} {${toTagList(tags)}}`); //eslint-disable-line no-console
      }
      if (didMatch === false && throwError === true) {
        throw new Error(`❌ ${text} {${toTagList(tags)}}`)
      }
      return didMatch ? null : text
    }).filter(Boolean).join('\n');
    // return a doc of only the failing lines - empty means everything passed
    return this(failingLines)
  };

  var output = {
    lib: {
      fromSpec,
      testSpec,
    },
    api: addAPI$1,
    methods: {
      one: {
        hash: md5,
        debug,
      },
    },
  };

  // do the pointers intersect?
  const doesOverlap = function (a, b) {
    if (a[0] !== b[0]) {
      return false
    }
    const [, startA, endA] = a;
    const [, startB, endB] = b;
    // [a,a,a,-,-,-,]
    // [-,-,b,b,b,-,]
    if (startA <= startB && endA > startB) {
      return true
    }
    // [-,-,-,a,a,-,]
    // [-,-,b,b,b,-,]
    if (startB <= startA && endB > startA) {
      return true
    }
    return false
  };

  // get widest min/max
  const getExtent = function (ptrs) {
    let min = ptrs[0][1];
    let max = ptrs[0][2];
    ptrs.forEach(ptr => {
      if (ptr[1] < min) {
        min = ptr[1];
      }
      if (ptr[2] > max) {
        max = ptr[2];
      }
    });
    return [ptrs[0][0], min, max]
  };

  // collect pointers by sentence number
  const indexN = function (ptrs) {
    const byN = {};
    ptrs.forEach(ref => {
      byN[ref[0]] = byN[ref[0]] || [];
      byN[ref[0]].push(ref);
    });
    return byN
  };

  // remove exact duplicates
  const uniquePtrs = function (arr) {
    const obj = {};
    for (let i = 0; i < arr.length; i += 1) {
      obj[arr[i].join(',')] = arr[i];
    }
    return Object.values(obj)
  };

  // a before b
  // console.log(doesOverlap([0, 0, 4], [0, 2, 5]))
  // // b before a
  // console.log(doesOverlap([0, 3, 4], [0, 1, 5]))
  // // disjoint
  // console.log(doesOverlap([0, 0, 3], [0, 4, 5]))
  // neighbours
  // console.log(doesOverlap([0, 1, 3], [0, 3, 5]))
  // console.log(doesOverlap([0, 3, 5], [0, 1, 3]))

  // console.log(
  //   getExtent([
  //     [0, 3, 4],
  //     [0, 4, 5],
  //     [0, 1, 2],
  //   ])
  // )

  // split a pointer, by match pointer
  const pivotBy = function (full, m) {
    const [n, start] = full;
    const mStart = m[1];
    const mEnd = m[2];
    const res = {};
    // is there space before the match?
    if (start < mStart) {
      const end = mStart < full[2] ? mStart : full[2]; // find closest end-point
      res.before = [n, start, end]; //before segment
    }
    res.match = m;
    // is there space after the match?
    if (full[2] > mEnd) {
      res.after = [n, mEnd, full[2]]; //after segment
    }
    return res
  };

  const doesMatch = function (full, m) {
    return full[1] <= m[1] && m[2] <= full[2]
  };

  const splitAll = function (full, m) {
    const byN = indexN(m);
    const res = [];
    full.forEach(ptr => {
      const [n] = ptr;
      let matches = byN[n] || [];
      matches = matches.filter(p => doesMatch(ptr, p));
      if (matches.length === 0) {
        res.push({ passthrough: ptr });
        return
      }
      // ensure matches are in-order
      matches = matches.sort((a, b) => a[1] - b[1]);
      // start splitting our left-to-right
      let carry = ptr;
      matches.forEach((p, i) => {
        const found = pivotBy(carry, p);
        // last one
        if (!matches[i + 1]) {
          res.push(found);
        } else {
          res.push({ before: found.before, match: found.match });
          if (found.after) {
            carry = found.after;
          }
        }
      });
    });
    return res
  };

  const max$1 = 20;

  // sweep-around looking for our start term uuid
  const blindSweep = function (id, doc, n) {
    for (let i = 0; i < max$1; i += 1) {
      // look up a sentence
      if (doc[n - i]) {
        const index = doc[n - i].findIndex(term => term.id === id);
        if (index !== -1) {
          return [n - i, index]
        }
      }
      // look down a sentence
      if (doc[n + i]) {
        const index = doc[n + i].findIndex(term => term.id === id);
        if (index !== -1) {
          return [n + i, index]
        }
      }
    }
    return null
  };

  const repairEnding = function (ptr, document) {
    const [n, start, , , endId] = ptr;
    const terms = document[n];
    // look for end-id
    const newEnd = terms.findIndex(t => t.id === endId);
    if (newEnd === -1) {
      // if end-term wasn't found, so go all the way to the end
      ptr[2] = document[n].length;
      ptr[4] = terms.length ? terms[terms.length - 1].id : null;
    } else {
      ptr[2] = newEnd; // repair ending pointer
    }
    return document[n].slice(start, ptr[2] + 1)
  };

  /** return a subset of the document, from a pointer */
  const getDoc$1 = function (ptrs, document) {
    let doc = [];
    ptrs.forEach((ptr, i) => {
      if (!ptr) {
        return
      }
      // eslint-disable-next-line prefer-const
      let [n, start, end, id, endId] = ptr; //parsePointer(ptr)
      let terms = document[n] || [];
      if (start === undefined) {
        start = 0;
      }
      if (end === undefined) {
        end = terms.length;
      }
      if (id && (!terms[start] || terms[start].id !== id)) {
        // console.log('  repairing pointer...')
        const wild = blindSweep(id, document, n);
        if (wild !== null) {
          const len = end - start;
          terms = document[wild[0]].slice(wild[1], wild[1] + len);
          // actually change the pointer
          const startId = terms[0] ? terms[0].id : null;
          ptrs[i] = [wild[0], wild[1], wild[1] + len, startId];
        }
      } else {
        terms = terms.slice(start, end);
      }
      if (terms.length === 0) {
        return
      }
      if (start === end) {
        return
      }
      // test end-id, if it exists
      if (endId && terms[terms.length - 1].id !== endId) {
        terms = repairEnding(ptr, document);
      }
      // otherwise, looks good!
      doc.push(terms);
    });
    doc = doc.filter(a => a.length > 0);
    return doc
  };

  // flat list of terms from nested document
  const termList = function (docs) {
    const arr = [];
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        arr.push(docs[i][t]);
      }
    }
    return arr
  };

  var methods$6 = {
    one: {
      termList,
      getDoc: getDoc$1,
      pointer: {
        indexN,
        splitAll,
      }
    },
  };

  // a union is a + b, minus duplicates
  const getUnion = function (a, b) {
    const both = a.concat(b);
    const byN = indexN(both);
    let res = [];
    both.forEach(ptr => {
      const [n] = ptr;
      if (byN[n].length === 1) {
        // we're alone on this sentence, so we're good
        res.push(ptr);
        return
      }
      // there may be overlaps
      const hmm = byN[n].filter(m => doesOverlap(ptr, m));
      hmm.push(ptr);
      const range = getExtent(hmm);
      res.push(range);
    });
    res = uniquePtrs(res);
    return res
  };

  // two disjoint
  // console.log(getUnion([[1, 3, 4]], [[0, 1, 2]]))
  // two disjoint
  // console.log(getUnion([[0, 3, 4]], [[0, 1, 2]]))
  // overlap-plus
  // console.log(getUnion([[0, 1, 4]], [[0, 2, 6]]))
  // overlap
  // console.log(getUnion([[0, 1, 4]], [[0, 2, 3]]))
  // neighbours
  // console.log(getUnion([[0, 1, 3]], [[0, 3, 5]]))

  const subtract = function (refs, not) {
    const res = [];
    const found = splitAll(refs, not);
    found.forEach(o => {
      if (o.passthrough) {
        res.push(o.passthrough);
      }
      if (o.before) {
        res.push(o.before);
      }
      if (o.after) {
        res.push(o.after);
      }
    });
    return res
  };

  // console.log(subtract([[0, 0, 2]], [[0, 0, 1]]))
  // console.log(subtract([[0, 0, 2]], [[0, 1, 2]]))

  // [a,a,a,a,-,-,]
  // [-,-,b,b,b,-,]
  // [-,-,x,x,-,-,]
  const intersection = function (a, b) {
    // find the latest-start
    const start = a[1] < b[1] ? b[1] : a[1];
    // find the earliest-end
    const end = a[2] > b[2] ? b[2] : a[2];
    // does it form a valid pointer?
    if (start < end) {
      return [a[0], start, end]
    }
    return null
  };

  const getIntersection = function (a, b) {
    const byN = indexN(b);
    const res = [];
    a.forEach(ptr => {
      let hmm = byN[ptr[0]] || [];
      hmm = hmm.filter(p => doesOverlap(ptr, p));
      // no sentence-pairs, so no intersection
      if (hmm.length === 0) {
        return
      }
      hmm.forEach(h => {
        const overlap = intersection(ptr, h);
        if (overlap) {
          res.push(overlap);
        }
      });
    });
    return res
  };

  // console.log(getIntersection([[0, 1, 3]], [[0, 2, 4]]))

  const isArray$3 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  const getDoc = (m, view) => {
    if (typeof m === 'string' || isArray$3(m)) {
      return view.match(m)
    }
    if (!m) {
      return view.none()
    }
    // support pre-parsed reg object
    return m
  };

  // 'harden' our json pointers, again
  const addIds = function (ptrs, docs) {
    return ptrs.map(ptr => {
      const [n, start] = ptr;
      if (docs[n] && docs[n][start]) {
        ptr[3] = docs[n][start].id;
      }
      return ptr
    })
  };

  const methods$5 = {};

  // all parts, minus duplicates
  methods$5.union = function (m) {
    m = getDoc(m, this);
    let ptrs = getUnion(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };
  methods$5.and = methods$5.union;

  // only parts they both have
  methods$5.intersection = function (m) {
    m = getDoc(m, this);
    let ptrs = getIntersection(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };

  // only parts of a that b does not have
  methods$5.not = function (m) {
    m = getDoc(m, this);
    let ptrs = subtract(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };
  methods$5.difference = methods$5.not;

  // get opposite of a match
  methods$5.complement = function () {
    const doc = this.all();
    let ptrs = subtract(doc.fullPointer, this.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };

  // remove overlaps
  methods$5.settle = function () {
    let ptrs = this.fullPointer;
    ptrs.forEach(ptr => {
      ptrs = getUnion(ptrs, [ptr]);
    });
    ptrs = addIds(ptrs, this.document);
    return this.update(ptrs)
  };

  const addAPI = function (View) {
    // add set/intersection/union
    Object.assign(View.prototype, methods$5);
  };

  var pointers = {
    methods: methods$6,
    api: addAPI,
  };

  var lib$2 = {
    // compile a list of matches into a match-net
    buildNet: function (matches) {
      const methods = this.methods();
      const net = methods.one.buildNet(matches, this.world());
      net.isNet = true;
      return net
    }
  };

  const api$6 = function (View) {

    /** speedy match a sequence of matches */
    View.prototype.sweep = function (net, opts = {}) {
      const { world, docs } = this;
      const { methods } = world;
      let found = methods.one.bulkMatch(docs, net, this.methods, opts);

      // apply any changes
      if (opts.tagger !== false) {
        methods.one.bulkTagger(found, docs, this.world);
      }
      // fix the pointers
      // collect all found results into a View
      found = found.map(o => {
        const ptr = o.pointer;
        const term = docs[ptr[0]][ptr[1]];
        const len = ptr[2] - ptr[1];
        if (term.index) {
          o.pointer = [
            term.index[0],
            term.index[1],
            ptr[1] + len
          ];
        }
        return o
      });
      const ptrs = found.map(o => o.pointer);
      // cleanup results a bit
      found = found.map(obj => {
        obj.view = this.update([obj.pointer]);
        delete obj.regs;
        delete obj.needs;
        delete obj.pointer;
        delete obj._expanded;
        return obj
      });
      return {
        view: this.update(ptrs),
        found
      }
    };

  };

  // extract the clear needs for an individual match token
  const getTokenNeeds = function (reg) {
    // negatives can't be cached
    if (reg.optional === true || reg.negative === true) {
      return null
    }
    if (reg.tag) {
      return '#' + reg.tag
    }
    if (reg.word) {
      return reg.word
    }
    if (reg.switch) {
      return `%${reg.switch}%`
    }
    return null
  };

  const getNeeds = function (regs) {
    const needs = [];
    regs.forEach(reg => {
      needs.push(getTokenNeeds(reg));
      // support AND (foo && tag)
      if (reg.operator === 'and' && reg.choices) {
        reg.choices.forEach(oneSide => {
          oneSide.forEach(r => {
            needs.push(getTokenNeeds(r));
          });
        });
      }
    });
    return needs.filter(str => str)
  };

  const getWants = function (regs) {
    const wants = [];
    let count = 0;
    regs.forEach(reg => {
      if (reg.operator === 'or' && !reg.optional && !reg.negative) {
        // add fast-or terms
        if (reg.fastOr) {
          Array.from(reg.fastOr).forEach(w => {
            wants.push(w);
          });
        }
        // add slow-or
        if (reg.choices) {
          reg.choices.forEach(rs => {
            rs.forEach(r => {
              const n = getTokenNeeds(r);
              if (n) {
                wants.push(n);
              }
            });
          });
        }
        count += 1;
      }
    });
    return { wants, count }
  };

  const parse$1 = function (matches, world) {
    const parseMatch = world.methods.one.parseMatch;
    matches.forEach(obj => {
      obj.regs = parseMatch(obj.match, {}, world);
      // wrap these ifNo properties into an array
      if (typeof obj.ifNo === 'string') {
        obj.ifNo = [obj.ifNo];
      }
      if (obj.notIf) {
        obj.notIf = parseMatch(obj.notIf, {}, world);
      }
      // cache any requirements up-front 
      obj.needs = getNeeds(obj.regs);
      const { wants, count } = getWants(obj.regs);
      obj.wants = wants;
      obj.minWant = count;
      // get rid of tiny sentences
      obj.minWords = obj.regs.filter(o => !o.optional).length;
    });
    return matches
  };

  // do some indexing on the list of matches
  const buildNet = function (matches, world) {
    // turn match-syntax into json
    matches = parse$1(matches, world);

    // collect by wants and needs
    const hooks = {};
    matches.forEach(obj => {
      // add needs
      obj.needs.forEach(str => {
        hooks[str] = Array.isArray(hooks[str]) ? hooks[str] : [];
        hooks[str].push(obj);
      });
      // add wants
      obj.wants.forEach(str => {
        hooks[str] = Array.isArray(hooks[str]) ? hooks[str] : [];
        hooks[str].push(obj);
      });
    });
    // remove duplicates
    Object.keys(hooks).forEach(k => {
      const already = {};
      hooks[k] = hooks[k].filter(obj => {
        if (typeof already[obj.match] === 'boolean') {
          return false
        }
        already[obj.match] = true;
        return true
      });
    });

    // keep all un-cacheable matches (those with no needs) 
    const always = matches.filter(o => o.needs.length === 0 && o.wants.length === 0);
    return {
      hooks,
      always
    }
  };

  // for each cached-sentence, find a list of possible matches
  const getHooks = function (docCaches, hooks) {
    return docCaches.map((set, i) => {
      let maybe = [];
      Object.keys(hooks).forEach(k => {
        if (docCaches[i].has(k)) {
          maybe = maybe.concat(hooks[k]);
        }
      });
      // remove duplicates
      const already = {};
      maybe = maybe.filter(m => {
        if (typeof already[m.match] === 'boolean') {
          return false
        }
        already[m.match] = true;
        return true
      });
      return maybe
    })
  };

  // filter-down list of maybe-matches
  const localTrim = function (maybeList, docCache) {
    return maybeList.map((list, n) => {
      const haves = docCache[n];
      // ensure all stated-needs of the match are met
      list = list.filter(obj => {
        return obj.needs.every(need => haves.has(need))
      });
      // ensure nothing matches in our 'ifNo' property
      list = list.filter(obj => {
        if (obj.ifNo !== undefined && obj.ifNo.some(no => haves.has(no)) === true) {
          return false
        }
        return true
      });
      // ensure atleast one(?) of the wants is found
      list = list.filter(obj => {
        if (obj.wants.length === 0) {
          return true
        }
        // ensure there's one cache-hit
        const found = obj.wants.filter(str => haves.has(str)).length;
        return found >= obj.minWant
      });
      return list
    })
  };

  // finally,
  // actually run these match-statements on the terms
  const runMatch = function (maybeList, document, docCache, methods, opts) {
    const results = [];
    for (let n = 0; n < maybeList.length; n += 1) {
      for (let i = 0; i < maybeList[n].length; i += 1) {
        const m = maybeList[n][i];
        // ok, actually do the work.
        const res = methods.one.match([document[n]], m);
        // found something.
        if (res.ptrs.length > 0) {
          res.ptrs.forEach(ptr => {
            ptr[0] = n; // fix the sentence pointer
            // check ifNo
            // if (m.ifNo !== undefined) {
            //   let terms = document[n].slice(ptr[1], ptr[2])
            //   for (let k = 0; k < m.ifNo.length; k += 1) {
            //     const no = m.ifNo[k]
            //     // quick-check cache
            //     if (docCache[n].has(no)) {
            //       if (no.startsWith('#')) {
            //         let tag = no.replace(/^#/, '')
            //         if (terms.find(t => t.tags.has(tag))) {
            //           console.log('+' + tag)
            //           return
            //         }
            //       } else if (terms.find(t => t.normal === no || t.tags.has(no))) {
            //         console.log('+' + no)
            //         return
            //       }
            //     }
            //   }
            // }
            const todo = Object.assign({}, m, { pointer: ptr });
            if (m.unTag !== undefined) {
              todo.unTag = m.unTag;
            }
            results.push(todo);
          });
          //ok cool, can we stop early?
          if (opts.matchOne === true) {
            return [results[0]]
          }
        }
      }
    }
    return results
  };

  const tooSmall = function (maybeList, document) {
    return maybeList.map((arr, i) => {
      const termCount = document[i].length;
      arr = arr.filter(o => {
        return termCount >= o.minWords
      });
      return arr
    })
  };

  const sweep$1 = function (document, net, methods, opts = {}) {
    // find suitable matches to attempt, on each sentence
    const docCache = methods.one.cacheDoc(document);
    // collect possible matches for this document
    let maybeList = getHooks(docCache, net.hooks);
    // ensure all defined needs are met for each match
    maybeList = localTrim(maybeList, docCache);
    // add unchacheable matches to each sentence's todo-list
    if (net.always.length > 0) {
      maybeList = maybeList.map(arr => arr.concat(net.always));
    }
    // if we don't have enough words
    maybeList = tooSmall(maybeList, document);

    // now actually run the matches
    const results = runMatch(maybeList, document, docCache, methods, opts);
    // console.dir(results, { depth: 5 })
    return results
  };

  // is this tag consistent with the tags they already have?
  const canBe$1 = function (terms, tag, model) {
    const tagSet = model.one.tagSet;
    if (!tagSet.hasOwnProperty(tag)) {
      return true
    }
    const not = tagSet[tag].not || [];
    for (let i = 0; i < terms.length; i += 1) {
      const term = terms[i];
      for (let k = 0; k < not.length; k += 1) {
        if (term.tags.has(not[k]) === true) {
          return false //found a tag conflict - bail!
        }
      }
    }
    return true
  };

  const tagger$1 = function (list, document, world) {
    const { model, methods } = world;
    const { getDoc, setTag, unTag } = methods.one;
    const looksPlural = methods.two.looksPlural;
    if (list.length === 0) {
      return list
    }
    // some logging for debugging
    const env = typeof process === 'undefined' || !process.env ? self.env || {} : process.env;
    if (env.DEBUG_TAGS) {
      console.log(`\n\n  \x1b[32m→ ${list.length} post-tagger:\x1b[0m`); //eslint-disable-line
    }
    return list.map(todo => {
      if (!todo.tag && !todo.chunk && !todo.unTag) {
        return
      }
      const reason = todo.reason || todo.match;
      const terms = getDoc([todo.pointer], document)[0];
      // handle 'safe' tag
      if (todo.safe === true) {
        // check for conflicting tags
        if (canBe$1(terms, todo.tag, model) === false) {
          return
        }
        // dont tag half of a hyphenated word
        if (terms[terms.length - 1].post === '-') {
          return
        }
      }
      if (todo.tag !== undefined) {
        setTag(terms, todo.tag, world, todo.safe, `[post] '${reason}'`);
        // quick and dirty plural tagger 😕
        if (todo.tag === 'Noun' && looksPlural) {
          const term = terms[terms.length - 1];
          if (looksPlural(term.text)) {
            setTag([term], 'Plural', world, todo.safe, 'quick-plural');
          } else {
            setTag([term], 'Singular', world, todo.safe, 'quick-singular');
          }
        }
        // allow freezing this match, too
        if (todo.freeze === true) {
          terms.forEach(term => (term.frozen = true));
        }
      }
      if (todo.unTag !== undefined) {
        unTag(terms, todo.unTag, world, todo.safe, reason);
      }
      // allow setting chunks, too
      if (todo.chunk) {
        terms.forEach(t => (t.chunk = todo.chunk));
      }
    })
  };

  var methods$4 = {
    buildNet,
    bulkMatch: sweep$1,
    bulkTagger: tagger$1
  };

  var sweep = {
    lib: lib$2,
    api: api$6,
    methods: {
      one: methods$4,
    }
  };

  const isMulti = / /;

  const addChunk = function (term, tag) {
    if (tag === 'Noun') {
      term.chunk = tag;
    }
    if (tag === 'Verb') {
      term.chunk = tag;
    }
  };

  const tagTerm = function (term, tag, tagSet, isSafe) {
    // does it already have this tag?
    if (term.tags.has(tag) === true) {
      return null
    }
    // allow this shorthand in multiple-tag strings
    if (tag === '.') {
      return null
    }
    // don't overwrite any tags, if term is frozen
    if (term.frozen === true) {
      isSafe = true;
    }
    // for known tags, do logical dependencies first
    const known = tagSet[tag];
    if (known) {
      // first, we remove any conflicting tags
      if (known.not && known.not.length > 0) {
        for (let o = 0; o < known.not.length; o += 1) {
          // if we're in tagSafe, skip this term.
          if (isSafe === true && term.tags.has(known.not[o])) {
            return null
          }
          term.tags.delete(known.not[o]);
        }
      }
      // add parent tags
      if (known.parents && known.parents.length > 0) {
        for (let o = 0; o < known.parents.length; o += 1) {
          term.tags.add(known.parents[o]);
          addChunk(term, known.parents[o]);
        }
      }
    }
    // finally, add our tag
    term.tags.add(tag);
    // now it's dirty?
    term.dirty = true;
    // add a chunk too, if it's easy
    addChunk(term, tag);
    return true
  };

  // support '#Noun . #Adjective' syntax
  const multiTag = function (terms, tagString, tagSet, isSafe) {
    const tags = tagString.split(isMulti);
    terms.forEach((term, i) => {
      let tag = tags[i];
      if (tag) {
        tag = tag.replace(/^#/, '');
        tagTerm(term, tag, tagSet, isSafe);
      }
    });
  };

  const isArray$2 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  // verbose-mode tagger debuging
  const log = (terms, tag, reason = '') => {
    const yellow = str => '\x1b[33m\x1b[3m' + str + '\x1b[0m';
    const i = str => '\x1b[3m' + str + '\x1b[0m';
    const word = terms
      .map(t => {
        return t.text || '[' + t.implicit + ']'
      })
      .join(' ');
    if (typeof tag !== 'string' && tag.length > 2) {
      tag = tag.slice(0, 2).join(', #') + ' +'; //truncate the list of tags
    }
    tag = typeof tag !== 'string' ? tag.join(', #') : tag;
    console.log(` ${yellow(word).padEnd(24)} \x1b[32m→\x1b[0m #${tag.padEnd(22)}  ${i(reason)}`); // eslint-disable-line
  };

  // add a tag to all these terms
  const setTag = function (terms, tag, world = {}, isSafe, reason) {
    const tagSet = world.model.one.tagSet || {};
    if (!tag) {
      return
    }
    // some logging for debugging
    const env = typeof process === 'undefined' || !process.env ? self.env || {} : process.env;
    if (env && env.DEBUG_TAGS) {
      log(terms, tag, reason);
    }
    if (isArray$2(tag) === true) {
      tag.forEach(tg => setTag(terms, tg, world, isSafe));
      return
    }
    if (typeof tag !== 'string') {
      console.warn(`compromise: Invalid tag '${tag}'`); // eslint-disable-line
      return
    }
    tag = tag.trim();
    // support '#Noun . #Adjective' syntax
    if (isMulti.test(tag)) {
      multiTag(terms, tag, tagSet, isSafe);
      return
    }
    tag = tag.replace(/^#/, '');
    // let set = false
    for (let i = 0; i < terms.length; i += 1) {
      tagTerm(terms[i], tag, tagSet, isSafe);
    }
  };

  // remove this tag, and its children, from these terms
  const unTag = function (terms, tag, tagSet) {
    tag = tag.trim().replace(/^#/, '');
    for (let i = 0; i < terms.length; i += 1) {
      const term = terms[i];
      // don't untag anything if term is frozen
      if (term.frozen === true) {
        continue
      }
      // support clearing all tags, with '*'
      if (tag === '*') {
        term.tags.clear();
        continue
      }
      // for known tags, do logical dependencies first
      const known = tagSet[tag];
      // removing #Verb should also remove #PastTense
      if (known && known.children.length > 0) {
        for (let o = 0; o < known.children.length; o += 1) {
          term.tags.delete(known.children[o]);
        }
      }
      term.tags.delete(tag);
    }
  };

  // quick check if this tag will require any untagging
  const canBe = function (term, tag, tagSet) {
    if (!tagSet.hasOwnProperty(tag)) {
      return true // everything can be an unknown tag
    }
    const not = tagSet[tag].not || [];
    for (let i = 0; i < not.length; i += 1) {
      if (term.tags.has(not[i])) {
        return false
      }
    }
    return true
  };

  const e=function(e){return e.children=e.children||[],e._cache=e._cache||{},e.props=e.props||{},e._cache.parents=e._cache.parents||[],e._cache.children=e._cache.children||[],e},t=/^ *(#|\/\/)/,n=function(t){let n=t.trim().split(/->/),r=[];n.forEach((t=>{r=r.concat(function(t){if(!(t=t.trim()))return null;if(/^\[/.test(t)&&/\]$/.test(t)){let n=(t=(t=t.replace(/^\[/,"")).replace(/\]$/,"")).split(/,/);return n=n.map((e=>e.trim())).filter((e=>e)),n=n.map((t=>e({id:t}))),n}return [e({id:t})]}(t));})),r=r.filter((e=>e));let i=r[0];for(let e=1;e<r.length;e+=1)i.children.push(r[e]),i=r[e];return r[0]},r=(e,t)=>{let n=[],r=[e];for(;r.length>0;){let e=r.pop();n.push(e),e.children&&e.children.forEach((n=>{t&&t(e,n),r.push(n);}));}return n},i=e=>"[object Array]"===Object.prototype.toString.call(e),c=e=>(e=e||"").trim(),s=function(c=[]){return "string"==typeof c?function(r){let i=r.split(/\r?\n/),c=[];i.forEach((e=>{if(!e.trim()||t.test(e))return;let r=(e=>{const t=/^( {2}|\t)/;let n=0;for(;t.test(e);)e=e.replace(t,""),n+=1;return n})(e);c.push({indent:r,node:n(e)});}));let s=function(e){let t={children:[]};return e.forEach(((n,r)=>{0===n.indent?t.children=t.children.concat(n.node):e[r-1]&&function(e,t){let n=e[t].indent;for(;t>=0;t-=1)if(e[t].indent<n)return e[t];return e[0]}(e,r).node.children.push(n.node);})),t}(c);return s=e(s),s}(c):i(c)?function(t){let n={};t.forEach((e=>{n[e.id]=e;}));let r=e({});return t.forEach((t=>{if((t=e(t)).parent)if(n.hasOwnProperty(t.parent)){let e=n[t.parent];delete t.parent,e.children.push(t);}else console.warn(`[Grad] - missing node '${t.parent}'`);else r.children.push(t);})),r}(c):(r(s=c).forEach(e),s);var s;},h=e=>"[31m"+e+"[0m",o=e=>"[2m"+e+"[0m",l=function(e,t){let n="-> ";t&&(n=o("→ "));let i="";return r(e).forEach(((e,r)=>{let c=e.id||"";if(t&&(c=h(c)),0===r&&!e.id)return;let s=e._cache.parents.length;i+="    ".repeat(s)+n+c+"\n";})),i},a=function(e){let t=r(e);t.forEach((e=>{delete(e=Object.assign({},e)).children;}));let n=t[0];return n&&!n.id&&0===Object.keys(n.props).length&&t.shift(),t},p={text:l,txt:l,array:a,flat:a},d=function(e,t){return "nested"===t||"json"===t?e:"debug"===t?(console.log(l(e,true)),null):p.hasOwnProperty(t)?p[t](e):e},u=e=>{r(e,((e,t)=>{e.id&&(e._cache.parents=e._cache.parents||[],t._cache.parents=e._cache.parents.concat([e.id]));}));},f$1=(e,t)=>(Object.keys(t).forEach((n=>{if(t[n]instanceof Set){let r=e[n]||new Set;e[n]=new Set([...r,...t[n]]);}else {if((e=>e&&"object"==typeof e&&!Array.isArray(e))(t[n])){let r=e[n]||{};e[n]=Object.assign({},t[n],r);}else i(t[n])?e[n]=t[n].concat(e[n]||[]):void 0===e[n]&&(e[n]=t[n]);}})),e),j=/\//;let g$1 = class g{constructor(e={}){Object.defineProperty(this,"json",{enumerable:false,value:e,writable:true});}get children(){return this.json.children}get id(){return this.json.id}get found(){return this.json.id||this.json.children.length>0}props(e={}){let t=this.json.props||{};return "string"==typeof e&&(t[e]=true),this.json.props=Object.assign(t,e),this}get(t){if(t=c(t),!j.test(t)){let e=this.json.children.find((e=>e.id===t));return new g(e)}let n=((e,t)=>{let n=(e=>"string"!=typeof e?e:(e=e.replace(/^\//,"")).split(/\//))(t=t||"");for(let t=0;t<n.length;t+=1){let r=e.children.find((e=>e.id===n[t]));if(!r)return null;e=r;}return e})(this.json,t)||e({});return new g(n)}add(t,n={}){if(i(t))return t.forEach((e=>this.add(c(e),n))),this;t=c(t);let r=e({id:t,props:n});return this.json.children.push(r),new g(r)}remove(e){return e=c(e),this.json.children=this.json.children.filter((t=>t.id!==e)),this}nodes(){return r(this.json).map((e=>(delete(e=Object.assign({},e)).children,e)))}cache(){return (e=>{let t=r(e,((e,t)=>{e.id&&(e._cache.parents=e._cache.parents||[],e._cache.children=e._cache.children||[],t._cache.parents=e._cache.parents.concat([e.id]));})),n={};t.forEach((e=>{e.id&&(n[e.id]=e);})),t.forEach((e=>{e._cache.parents.forEach((t=>{n.hasOwnProperty(t)&&n[t]._cache.children.push(e.id);}));})),e._cache.children=Object.keys(n);})(this.json),this}list(){return r(this.json)}fillDown(){var e;return e=this.json,r(e,((e,t)=>{t.props=f$1(t.props,e.props);})),this}depth(){u(this.json);let e=r(this.json),t=e.length>1?1:0;return e.forEach((e=>{if(0===e._cache.parents.length)return;let n=e._cache.parents.length+1;n>t&&(t=n);})),t}out(e){return u(this.json),d(this.json,e)}debug(){return u(this.json),d(this.json,"debug"),this}};const _=function(e){let t=s(e);return new g$1(t)};_.prototype.plugin=function(e){e(this);};

  // i just made these up
  const colors = {
    Noun: 'blue',
    Verb: 'green',
    Negative: 'green',
    Date: 'red',
    Value: 'red',
    Adjective: 'magenta',
    Preposition: 'cyan',
    Conjunction: 'cyan',
    Determiner: 'cyan',
    Hyphenated: 'cyan',
    Adverb: 'cyan',
  };

  const getColor = function (node) {
    if (colors.hasOwnProperty(node.id)) {
      return colors[node.id]
    }
    if (colors.hasOwnProperty(node.is)) {
      return colors[node.is]
    }
    const found = node._cache.parents.find(c => colors[c]);
    return colors[found]
  };

  // convert tags to our final format
  const fmt = function (nodes) {
    const res = {};
    nodes.forEach(node => {
      const { not, also, is, novel } = node.props;
      let parents = node._cache.parents;
      if (also) {
        parents = parents.concat(also);
      }
      res[node.id] = {
        is,
        not,
        novel,
        also,
        parents,
        children: node._cache.children,
        color: getColor(node),
        alias: node.alias,
      };
    });
    // lastly, add all children of all nots
    Object.keys(res).forEach(k => {
      const nots = new Set(res[k].not);
      res[k].not.forEach(not => {
        if (res[not]) {
          res[not].children.forEach(tag => nots.add(tag));
        }
      });
      res[k].not = Array.from(nots);
    });
    return res
  };

  const toArr = function (input) {
    if (!input) {
      return []
    }
    if (typeof input === 'string') {
      return [input]
    }
    return input
  };

  const addImplied = function (tags, already) {
    Object.keys(tags).forEach(k => {
      // support deprecated fmts
      if (tags[k].isA) {
        tags[k].is = tags[k].isA;
      }
      if (tags[k].notA) {
        tags[k].not = tags[k].notA;
      }
      // add any implicit 'is' tags
      if (tags[k].is && typeof tags[k].is === 'string') {
        if (!already.hasOwnProperty(tags[k].is) && !tags.hasOwnProperty(tags[k].is)) {
          tags[tags[k].is] = {};
        }
      }
      // add any implicit 'not' tags
      if (tags[k].not && typeof tags[k].not === 'string' && !tags.hasOwnProperty(tags[k].not)) {
        if (!already.hasOwnProperty(tags[k].not) && !tags.hasOwnProperty(tags[k].not)) {
          tags[tags[k].not] = {};
        }
      }
    });
    return tags
  };


  const validate = function (tags, already) {

    tags = addImplied(tags, already);

    // property validation
    Object.keys(tags).forEach(k => {
      tags[k].children = toArr(tags[k].children);
      tags[k].not = toArr(tags[k].not);
    });
    // not links are bi-directional
    // add any incoming not tags
    Object.keys(tags).forEach(k => {
      const nots = tags[k].not || [];
      nots.forEach(no => {
        if (tags[no] && tags[no].not) {
          tags[no].not.push(k);
        }
      });
    });
    return tags
  };

  // 'fill-down' parent logic inference
  const compute$1 = function (allTags) {
    // setup graph-lib format
    const flatList = Object.keys(allTags).map(k => {
      const o = allTags[k];
      const props = { not: new Set(o.not), also: o.also, is: o.is, novel: o.novel };
      return { id: k, parent: o.is, props, children: [], alias: o.alias }
    });
    const graph = _(flatList).cache().fillDown();
    return graph.out('array')
  };

  const fromUser = function (tags) {
    Object.keys(tags).forEach(k => {
      tags[k] = Object.assign({}, tags[k]);
      tags[k].novel = true;
    });
    return tags
  };

  const addTags$1 = function (tags, already) {
    // are these tags internal ones, or user-generated?
    if (Object.keys(already).length > 0) {
      tags = fromUser(tags);
    }
    tags = validate(tags, already);

    const allTags = Object.assign({}, already, tags);
    // do some basic setting-up
    // 'fill-down' parent logic
    const nodes = compute$1(allTags);
    // convert it to our final format
    const res = fmt(nodes);
    return res
  };

  var methods$3 = {
    one: {
      setTag,
      unTag,
      addTags: addTags$1,
      canBe,
    },
  };

  /* eslint no-console: 0 */
  const isArray$1 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };
  const fns = {
    /** add a given tag, to all these terms */
    tag: function (input, reason = '', isSafe) {
      if (!this.found || !input) {
        return this
      }
      const terms = this.termList();
      if (terms.length === 0) {
        return this
      }
      const { methods, verbose, world } = this;
      // logger
      if (verbose === true) {
        console.log(' +  ', input, reason || '');
      }
      if (isArray$1(input)) {
        input.forEach(tag => methods.one.setTag(terms, tag, world, isSafe, reason));
      } else {
        methods.one.setTag(terms, input, world, isSafe, reason);
      }
      // uncache
      this.uncache();
      return this
    },

    /** add a given tag, only if it is consistent */
    tagSafe: function (input, reason = '') {
      return this.tag(input, reason, true)
    },

    /** remove a given tag from all these terms */
    unTag: function (input, reason) {
      if (!this.found || !input) {
        return this
      }
      const terms = this.termList();
      if (terms.length === 0) {
        return this
      }
      const { methods, verbose, model } = this;
      // logger
      if (verbose === true) {
        console.log(' -  ', input, reason || '');
      }
      const tagSet = model.one.tagSet;
      if (isArray$1(input)) {
        input.forEach(tag => methods.one.unTag(terms, tag, tagSet));
      } else {
        methods.one.unTag(terms, input, tagSet);
      }
      // uncache
      this.uncache();
      return this
    },

    /** return only the terms that can be this tag  */
    canBe: function (tag) {
      tag = tag.replace(/^#/, '');
      const tagSet = this.model.one.tagSet;
      const canBe = this.methods.one.canBe;
      const nope = [];
      this.document.forEach((terms, n) => {
        terms.forEach((term, i) => {
          if (!canBe(term, tag, tagSet)) {
            nope.push([n, i, i + 1]);
          }
        });
      });
      const noDoc = this.update(nope);
      return this.difference(noDoc)
    },
  };

  const tagAPI = function (View) {
    Object.assign(View.prototype, fns);
  };

  // wire-up more pos-tags to our model
  const addTags = function (tags) {
    const { model, methods } = this.world();
    const tagSet = model.one.tagSet;
    const fn = methods.one.addTags;
    const res = fn(tags, tagSet);
    model.one.tagSet = res;
    return this
  };

  var lib$1 = { addTags };

  const boringTags = new Set(['Auxiliary', 'Possessive']);

  const sortByKids = function (tags, tagSet) {
    tags = tags.sort((a, b) => {
      // (unknown tags are interesting)
      if (boringTags.has(a) || !tagSet.hasOwnProperty(b)) {
        return 1
      }
      if (boringTags.has(b) || !tagSet.hasOwnProperty(a)) {
        return -1
      }
      let kids = tagSet[a].children || [];
      const aKids = kids.length;
      kids = tagSet[b].children || [];
      const bKids = kids.length;
      return aKids - bKids
    });
    return tags
  };

  const tagRank = function (view) {
    const { document, world } = view;
    const tagSet = world.model.one.tagSet;
    document.forEach(terms => {
      terms.forEach(term => {
        const tags = Array.from(term.tags);
        term.tagRank = sortByKids(tags, tagSet);
      });
    });
  };

  var tag = {
    model: {
      one: { tagSet: {} }
    },
    compute: {
      tagRank
    },
    methods: methods$3,
    api: tagAPI,
    lib: lib$1
  };

  // split by periods, question marks, unicode ⁇, etc
  // also ।॥ (devanagari), ؟ (arabic), ۔ (urdu), ։ (armenian), ።፧ (ethiopic), ။ (burmese), ។ (khmer)
  const initSplit = /([.!?\u203D\u2E18\u203C\u2047-\u2049\u0964\u0965\u061F\u06D4\u0589\u1362\u1367\u104B\u17D4\u3002]+\s)/g;
  // merge these back into prev sentence
  const splitsOnly = /^[.!?\u203D\u2E18\u203C\u2047-\u2049\u0964\u0965\u061F\u06D4\u0589\u1362\u1367\u104B\u17D4\u3002]+\s$/;
  const newLine = /((?:\r?\n|\r)+)/; // Match different new-line formats

  // CJK full-stops 。！？｡ are never used in numbers or abbreviations,
  // so they can end a sentence without any whitespace after them.
  // A full-stop followed by a closing bracket 」』）” only ends the sentence when the
  // bracket is followed by whitespace, another opening bracket, or the end of the text
  //  - '「行きません。」と言った' stays together,  '「はい。」「いいえ。」' splits
  const hasCjkStop = /[\u3002\uFF01\uFF1F\uFF61]/;
  const cjkStops = '\\u3002\\uFF01\\uFF1F\\uFF61'; // 。！？｡
  const allStops = '.!?\\u203D\\u2E18\\u203C\\u2047-\\u2049' + '\u0964\u0965\u061F\u06D4\u0589\u1362\u1367\u104B\u17D4' + cjkStops;
  const openers = '\\u300C\\u300E\\uFF08\\u3010\\u3014\\u300A\\u3008\\u201C'; // 「『（【〔《〈“
  const closers = '\\u300D\\u300F\\uFF09\\u3011\\u3015\\u300B\\u3009\\u201D'; // 」』）】〕》〉”
  const initSplitCjk = new RegExp(
    `([${allStops}]+\\s|[${cjkStops}]+(?![${closers}${cjkStops}])|[${cjkStops}]+[${closers}]+(?=[\\s${openers}]|$))`,
    'g'
  );
  const splitsOnlyCjk = new RegExp(`^(?:[${allStops}]+\\s|[${cjkStops}]+[${closers}]*)$`);

  // Start with a regex:
  const basicSplit = function (text) {
    const all = [];
    // japanese/chinese text has no whitespace after its full-stops
    const isCjk = hasCjkStop.test(text);
    const splitReg = isCjk ? initSplitCjk : initSplit;
    const onlyReg = isCjk ? splitsOnlyCjk : splitsOnly;
    //first, split by newline
    const lines = text.split(newLine);
    for (let i = 0; i < lines.length; i++) {
      //split by period, question-mark, and exclamation-mark
      const arr = lines[i].split(splitReg);
      for (let o = 0; o < arr.length; o++) {
        // merge 'foo' + '.'
        if (arr[o + 1] && onlyReg.test(arr[o + 1]) === true) {
          arr[o] += arr[o + 1];
          arr[o + 1] = '';
        }
        if (arr[o] !== '') {
          all.push(arr[o]);
        }
      }
    }
    return all
  };

  // a letter, number, or symbol/emoji in any script - otherwise it's only punctuation
  const hasLetter$1 = /[\p{L}\p{N}\p{So}]/u;
  const hasSomething$1 = /\S/;

  const notEmpty = function (splits) {
    const chunks = [];
    for (let i = 0; i < splits.length; i++) {
      const s = splits[i];
      if (s === undefined || s === '') {
        continue
      }
      //this is meaningful whitespace
      if (hasSomething$1.test(s) === false || hasLetter$1.test(s) === false) {
        //add it to the last one
        if (chunks[chunks.length - 1]) {
          chunks[chunks.length - 1] += s;
          continue
        } else if (splits[i + 1]) {
          //add it to the next one
          splits[i + 1] = s + splits[i + 1];
          continue
        }
      }
      //else, only whitespace, no terms, no sentence
      chunks.push(s);
    }
    return chunks
  };

  const hasNewline = function (c) {
    return Boolean(c.match(/\n$/))
  };

  //loop through these chunks, and join the non-sentence chunks back together..
  const smartMerge = function (chunks, world) {
    const isSentence = world.methods.one.tokenize.isSentence;
    const abbrevs = world.model.one.abbreviations || new Set();

    const sentences = [];
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      //should this chunk be combined with the next one?
      if (chunks[i + 1] && !isSentence(c, abbrevs) && !hasNewline(c)) {
        chunks[i + 1] = c + (chunks[i + 1] || '');
      } else if (c && c.length > 0) {
        //this chunk is a proper sentence..
        sentences.push(c);
        chunks[i] = '';
      }
    }
    return sentences
  };

  /* eslint-disable regexp/no-dupe-characters-character-class */

  // merge embedded quotes into 1 sentence
  // like - 'he said "no!" and left.'
  const MAX_QUOTE = 280;// ¯\_(ツ)_/¯

  // don't support single-quotes for multi-sentences
  const pairs = {
    '\u0022': '\u0022', // 'StraightDoubleQuotes'
    '\uFF02': '\uFF02', // 'StraightDoubleQuotesWide'
    // '\u0027': '\u0027', // 'StraightSingleQuotes'
    '\u201C': '\u201D', // 'CommaDoubleQuotes'
    // '\u2018': '\u2019', // 'CommaSingleQuotes'
    '\u201F': '\u201D', // 'CurlyDoubleQuotesReversed'
    // '\u201B': '\u2019', // 'CurlySingleQuotesReversed'
    '\u201E': '\u201D', // 'LowCurlyDoubleQuotes'
    '\u2E42': '\u201D', // 'LowCurlyDoubleQuotesReversed'
    '\u201A': '\u2019', // 'LowCurlySingleQuotes'
    '\u00AB': '\u00BB', // 'AngleDoubleQuotes'
    '\u2039': '\u203A', // 'AngleSingleQuotes'
    '\u2035': '\u2032', // 'PrimeSingleQuotes'
    '\u2036': '\u2033', // 'PrimeDoubleQuotes'
    '\u2037': '\u2034', // 'PrimeTripleQuotes'
    '\u301D': '\u301E', // 'PrimeDoubleQuotes'
    // '\u0060': '\u00B4', // 'PrimeSingleQuotes'
    '\u301F': '\u301E', // 'LowPrimeDoubleQuotesReversed'
    '\u300C': '\u300D', // 'CornerBrackets' 「」
    '\u300E': '\u300F', // 'WhiteCornerBrackets' 『』
  };
  const openQuote = RegExp('[' + Object.keys(pairs).join('') + ']', 'g');
  const closeQuote = RegExp('[' + Object.values(pairs).join('') + ']', 'g');

  const closesQuote = function (str) {
    if (!str) {
      return false
    }
    const m = str.match(closeQuote);
    if (m !== null && m.length === 1) {
      return true
    }
    return false
  };

  // allow micro-sentences when inside a quotation, like:
  // the doc said "no sir. i will not beg" and walked away.
  const quoteMerge = function (splits) {
    const arr = [];
    for (let i = 0; i < splits.length; i += 1) {
      const split = splits[i];
      // do we have an open-quote and not a closed one?
      const m = split.match(openQuote);
      if (m !== null && m.length === 1) {
        // is the quote already closed in this chunk? - '“Yes!” said Tom. “No!” said Ann.'
        const closed = split.match(closeQuote);
        if (closed !== null && closed[0] !== m[0]) {
          arr.push(split);
          continue
        }

        // look at the next sentence for a closing quote,
        if (closesQuote(splits[i + 1]) && splits[i + 1].length < MAX_QUOTE) {
          splits[i] += splits[i + 1];// merge them
          arr.push(splits[i]);
          splits[i + 1] = '';
          i += 1;
          continue
        }
        // look at n+2 for a closing quote,
        if (closesQuote(splits[i + 2])) {
          const toAdd = splits[i + 1] + splits[i + 2];// merge them all
          //make sure it's not too-long
          if (toAdd.length < MAX_QUOTE) {
            splits[i] += toAdd;
            arr.push(splits[i]);
            splits[i + 1] = '';
            splits[i + 2] = '';
            i += 2;
            continue
          }
        }
      }
      arr.push(splits[i]);
    }
    return arr
  };

  const MAX_LEN = 250;// ¯\_(ツ)_/¯

  // support unicode variants?
  // https://stackoverflow.com/questions/13535172/list-of-all-unicodes-open-close-brackets
  const hasOpen = /[(\uFF08]/g;
  const hasClosed = /[)\uFF09]/g;
  const mergeParens = function (splits) {
    const arr = [];
    for (let i = 0; i < splits.length; i += 1) {
      const split = splits[i];
      const m = split.match(hasOpen);
      if (m !== null && m.length === 1) {
        // look at next sentence, for closing parenthesis
        if (splits[i + 1] && splits[i + 1].length < MAX_LEN) {
          const m2 = splits[i + 1].match(hasClosed);
          if (m2 !== null && m.length === 1 && !hasOpen.test(splits[i + 1])) {
            // merge in 2nd sentence
            splits[i] += splits[i + 1];
            arr.push(splits[i]);
            splits[i + 1] = '';
            i += 1;
            continue
          }
        }
      }
      arr.push(splits[i]);
    }
    return arr
  };

  //(Rule-based sentence boundary segmentation) - chop given text into its proper sentences.
  // Ignore periods/questions/exclamations used in acronyms/abbreviations/numbers, etc.
  //regs-
  const hasSomething = /\S/;
  const startWhitespace = /^\s+/;

  const splitSentences = function (text, world) {
    text = text || '';
    text = String(text);
    // Ensure it 'smells like' a sentence
    if (!text || typeof text !== 'string' || hasSomething.test(text) === false) {
      return []
    }
    // First do a greedy-split..
    const splits = basicSplit(text);
    // Filter-out the crap ones
    let sentences = notEmpty(splits);
    //detection of non-sentence chunks:
    sentences = smartMerge(sentences, world);
    // allow 'he said "no sir." and left.'
    sentences = quoteMerge(sentences);
    // allow 'i thought (no way!) and left.'
    sentences = mergeParens(sentences);
    //if we never got a sentence, return the given text
    if (sentences.length === 0) {
      return [text]
    }
    //move whitespace to the ends of sentences, when possible
    //['hello',' world'] -> ['hello ','world']
    for (let i = 1; i < sentences.length; i += 1) {
      const ws = sentences[i].match(startWhitespace);
      if (ws !== null) {
        sentences[i - 1] += ws[0];
        sentences[i] = sentences[i].replace(startWhitespace, '');
      }
    }
    return sentences
  };

  const hasHyphen = function (str, model) {
    const parts = str.split(/[-–—]/);
    if (parts.length <= 1) {
      return false
    }
    const { prefixes, suffixes } = model.one;

    // l-theanine, x-ray
    if (parts[0].length === 1 && /[a-z]/i.test(parts[0])) {
      return false
    }
    //dont split 're-do'
    if (prefixes.hasOwnProperty(parts[0])) {
      return false
    }
    //dont split 'flower-like'
    parts[1] = parts[1].trim().replace(/[.?!]$/, '');
    if (suffixes.hasOwnProperty(parts[1])) {
      return false
    }
    //letter-number 'aug-20'
    const reg = /^([a-z\u00C0-\u00FF`"'/]+)[-–—]([a-z0-9\u00C0-\u00FF].*)/i;
    if (reg.test(str) === true) {
      return true
    }
    //number-letter '20-aug'
    const reg2 = /^[('"]?([0-9]{1,4})[-–—]([a-z\u00C0-\u00FF`"'/-]+[)'"]?$)/i;
    if (reg2.test(str) === true) {
      return true
    }
    return false
  };

  const splitHyphens = function (word) {
    const arr = [];
    //support multiple-hyphenated-terms
    const hyphens = word.split(/[-–—]/);
    let whichDash = '-';
    const found = word.match(/[-–—]/);
    if (found && found[0]) {
      whichDash = found;
    }
    for (let o = 0; o < hyphens.length; o++) {
      if (o === hyphens.length - 1) {
        arr.push(hyphens[o]);
      } else {
        arr.push(hyphens[o] + whichDash);
      }
    }
    return arr
  };

  // combine '2 - 5' like '2-5' is
  // 2-4: 2, 4
  const combineRanges = function (arr) {
    const startRange = /^[0-9]{1,4}(:[0-9][0-9])?([a-z]{1,2})? ?[-–—] ?$/;
    const endRange = /^[0-9]{1,4}([a-z]{1,2})? ?$/;
    for (let i = 0; i < arr.length - 1; i += 1) {
      if (arr[i + 1] && startRange.test(arr[i]) && endRange.test(arr[i + 1])) {
        arr[i] = arr[i] + arr[i + 1];
        arr[i + 1] = null;
      }
    }
    return arr
  };

  const isSlash = /\p{L} ?\/ ?\p{L}+$/u;

  // 'he / she' should be one word
  const combineSlashes = function (arr) {
    for (let i = 1; i < arr.length - 1; i++) {
      if (isSlash.test(arr[i])) {
        arr[i - 1] += arr[i] + arr[i + 1];
        arr[i] = null;
        arr[i + 1] = null;
      }
    }
    return arr
  };

  const wordlike = /\S/;
  const isBoundary = /^[!?.]+$/;
  const naiiveSplit = /(\S+)/;

  let notWord = [
    '.',
    '?',
    '!',
    ':',
    ';',
    '-',
    '–',
    '—',
    '--',
    '...',
    '(',
    ')',
    '[',
    ']',
    '"',
    "'",
    '`',
    '«',
    '»',
    '*',
    '•',
  ];
  notWord = notWord.reduce((h, c) => {
    h[c] = true;
    return h
  }, {});

  const isArray = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  //turn a string into an array of strings (naiive for now, lumped later)
  const splitWords = function (str, model) {
    let result = [];
    let arr = [];
    //start with a naiive split
    str = str || '';
    if (typeof str === 'number') {
      str = String(str);
    }
    if (isArray(str)) {
      return str
    }
    const words = str.split(naiiveSplit);
    for (let i = 0; i < words.length; i++) {
      //split 'one-two'
      if (hasHyphen(words[i], model) === true) {
        arr = arr.concat(splitHyphens(words[i]));
        continue
      }
      arr.push(words[i]);
    }
    //greedy merge whitespace+arr to the right
    let carry = '';
    for (let i = 0; i < arr.length; i++) {
      const word = arr[i];
      //if it's more than a whitespace
      if (wordlike.test(word) === true && notWord.hasOwnProperty(word) === false && isBoundary.test(word) === false) {
        //put whitespace on end of previous term, if possible
        if (result.length > 0) {
          result[result.length - 1] += carry;
          result.push(word);
        } else {
          //otherwise, but whitespace before
          result.push(carry + word);
        }
        carry = '';
      } else {
        carry += word;
      }
    }
    //handle last one
    if (carry) {
      if (result.length === 0) {
        result[0] = '';
      }
      result[result.length - 1] += carry; //put it on the end
    }
    // combine 'one / two'
    result = combineSlashes(result);
    result = combineRanges(result);
    // remove empty results
    result = result.filter(s => s);
    return result
  };

  //all punctuation marks, from https://en.wikipedia.org/wiki/Punctuation

  //we have slightly different rules for start/end - like #hashtags.
  const isLetter = /\p{Letter}/u;
  const isNumber = /[\p{Number}\p{Currency_Symbol}]/u;
  const hasAcronym = /^[a-z]\.([a-z]\.)+/i;
  const chillin = /[sn]['’]$/;
  const isFullNumber = /^[(+\-]?\d+(th|st|nd|rd)?[)+\-]?$/;

  const normalizePunctuation = function (str, model) {
    // quick lookup for allowed pre/post punctuation
    const { prePunctuation, postPunctuation, emoticons } = model.one;
    let original = str;
    let pre = '';
    let post = '';
    const chars = Array.from(str);

    // punctuation-only words, like '<3'
    if (emoticons.hasOwnProperty(str.trim())) {
      return { str: str.trim(), pre, post: ' ' } //not great
    }

    // pop any punctuation off of the start
    let len = chars.length;
    for (let i = 0; i < len; i += 1) {
      const c = chars[0];
      // keep any declared chars
      if (prePunctuation[c] === true) {
        continue//keep it
      }
      // keep '+' or '-' only before a number
      if ((c === '+' || c === '-' || c === '(') && isFullNumber.test(str.trim())) {
        break//done
      }
      // '97 - year short-form
      if (c === "'" && c.length === 3 && isNumber.test(chars[1])) {
        break//done
      }
      // start of word
      if (isLetter.test(c) || isNumber.test(c)) {
        break //done
      }
      // punctuation
      pre += chars.shift();//keep going
    }

    // pop any punctuation off of the end
    len = chars.length;
    for (let i = 0; i < len; i += 1) {
      const c = chars[chars.length - 1];
      // keep any declared chars
      if (postPunctuation[c] === true) {
        continue//keep it
      }
      // start of word
      if (isLetter.test(c) || isNumber.test(c)) {
        break //done
      }
      // F.B.I.
      if (c === '.' && hasAcronym.test(original) === true) {
        continue//keep it
      }
      //  keep s-apostrophe - "flanders'" or "chillin'"
      if (c === "'" && chillin.test(original) === true) {
        continue//keep it
      }
      // keep '+' or ')' only for a number like (800) or 500+
      if ((c === '+' || c === ')') && isFullNumber.test(str.trim())) {
        break//done
      }
      // punctuation
      post = chars.pop() + post;//keep going
    }
    str = chars.join('');
    //we went too far..
    if (str === '') {
      // do a very mild parse, and hope for the best.
      original = original.replace(/ *$/, after => {
        post = after || '';
        return ''
      });
      str = original;
      pre = '';
    }
    return { str, pre, post }
  };

  const parseTerm = (txt, model) => {
    // cleanup any punctuation as whitespace
    const { str, pre, post } = normalizePunctuation(txt, model);
    const parsed = {
      text: str,
      pre: pre,
      post: post,
      tags: new Set(),
    };
    return parsed
  };

  // 'Björk' to 'Bjork'.
  const killUnicode = function (str, world) {
    const unicode = world.model.one.unicode || {};
    str = str || '';
    const chars = str.split('');
    chars.forEach((s, i) => {
      if (unicode[s]) {
        chars[i] = unicode[s];
      }
    });
    return chars.join('')
  };

  /** some basic operations on a string to reduce noise */
  const clean = function (str) {
    str = str || '';
    str = str.toLowerCase();
    str = str.trim();
    const original = str;
    //punctuation
    str = str.replace(/[,;.!?]+$/, '');
    //coerce Unicode ellipses
    str = str.replace(/\u2026/g, '...');
    //en-dash
    str = str.replace(/\u2013/g, '-');
    //strip leading & trailing grammatical punctuation
    if (/^[:;]/.test(str) === false) {
      str = str.replace(/\.{3,}$/g, '');
      str = str.replace(/[",.!:;?)]+$/g, '');
      str = str.replace(/^['"(]+/g, '');
    }
    // remove zero-width characters
    str = str.replace(/[\u200B-\u200D\uFEFF]/g, '');
    //do this again..
    str = str.trim();
    //oh shucks,
    if (str === '') {
      str = original;
    }
    //no-commas in numbers
    str = str.replace(/([0-9]),([0-9])/g, '$1$2');
    return str
  };

  // do acronyms need to be ASCII?  ... kind of?
  const periodAcronym$1 = /([A-Z]\.)+[A-Z]?,?$/;
  const oneLetterAcronym$1 = /^[A-Z]\.,?$/;
  const noPeriodAcronym$1 = /[A-Z]{2,}('s|,)?$/;
  const lowerCaseAcronym$1 = /([a-z]\.)+[a-z]\.?$/;

  const isAcronym$2 = function (str) {
    //like N.D.A
    if (periodAcronym$1.test(str) === true) {
      return true
    }
    //like c.e.o
    if (lowerCaseAcronym$1.test(str) === true) {
      return true
    }
    //like 'F.'
    if (oneLetterAcronym$1.test(str) === true) {
      return true
    }
    //like NDA
    if (noPeriodAcronym$1.test(str) === true) {
      return true
    }
    return false
  };

  const doAcronym = function (str) {
    if (isAcronym$2(str)) {
      str = str.replace(/\./g, '');
    }
    return str
  };

  const normalize = function (term, world) {
    const killUnicode = world.methods.one.killUnicode;
    // console.log(world.methods.one)
    let str = term.text || '';
    str = clean(str);
    //(very) rough ASCII transliteration -  bjŏrk -> bjork
    str = killUnicode(str, world);
    str = doAcronym(str);
    term.normal = str;
  };

  // turn a string input into a 'document' json format
  const parse = function (input, world) {
    const { methods, model } = world;
    const { splitSentences, splitTerms, splitWhitespace } = methods.one.tokenize;
    input = input || '';
    // split into sentences
    const sentences = splitSentences(input, world);
    // split into word objects
    input = sentences.map((txt) => {
      let terms = splitTerms(txt, model);
      // split into [pre-text-post]
      terms = terms.map(t => splitWhitespace(t, model));
      // add normalized term format, always
      terms.forEach((t) => {
        normalize(t, world);
      });
      return terms
    });
    return input
  };

  const isAcronym$1 = /[ .][A-Z]\.? *$/i; //asci - 'n.s.a.'
  const hasEllipse = /(?:\u2026|\.{2,}) *$/; // '...'
  const hasLetter = /\p{L}/u;
  const hasPeriod = /\. *$/;
  const leadInit = /^[A-Z]\. $/; // "W. Kensington"

  /** does this look like a sentence? */
  const isSentence = function (str, abbrevs) {
    // must have a letter
    if (hasLetter.test(str) === false) {
      return false
    }
    // check for 'F.B.I.'
    if (isAcronym$1.test(str) === true) {
      return false
    }
    // check for leading initial - "W. Kensington"
    if (str.length === 3 && leadInit.test(str)) {
      return false
    }
    //check for '...'
    if (hasEllipse.test(str) === true) {
      return false
    }
    const txt = str.replace(/[.!?\u203D\u2E18\u203C\u2047-\u2049] *$/, '');
    const words = txt.split(' ');
    const lastWord = words[words.length - 1].toLowerCase();
    // check for 'Mr.' (and not mr?)
    if (abbrevs.hasOwnProperty(lastWord) === true && hasPeriod.test(str) === true) {
      return false
    }
    // //check for jeopardy!
    // if (blacklist.hasOwnProperty(lastWord)) {
    //   return false
    // }
    return true
  };

  var methods$2 = {
    one: {
      killUnicode,
      tokenize: {
        splitSentences,
        isSentence,
        splitTerms: splitWords,
        splitWhitespace: parseTerm,
        fromString: parse,
      },
    },
  };

  const aliases = {
    '&': 'and',
    '@': 'at',
    '%': 'percent',
    'plz': 'please',
    'bein': 'being',
  };

  var misc$2 = [
    'approx',
    'apt',
    'bc',
    'cyn',
    'eg',
    'esp',
    'est',
    'etc',
    'ex',
    'exp',
    'prob', //probably
    'pron', // Pronunciation
    'gal', //gallon
    'min',
    'pseud',
    'fig', //figure
    'jd',
    'lat', //latitude
    'lng', //longitude
    'vol', //volume
    'fm', //not am
    'def', //definition
    'misc',
    'plz', //please
    'ea', //each
    'ps',
    'sec', //second
    'pt',
    'pref', //preface
    'pl', //plural
    'pp', //pages
    'qt', //quarter
    'fr', //french
    'sq',
    'nee', //given name at birth
    'ss', //ship, or sections
    'tel',
    'temp',
    'vet',
    'ver', //version
    'fem', //feminine
    'masc', //masculine
    'eng', //engineering/english
    'adj', //adjective
    'vb', //verb
    'rb', //adverb
    'inf', //infinitive
    'situ', // in situ
    'vivo',
    'vitro',
    'wr', //world record
  ];

  var honorifics = [
    'adj',
    'adm',
    'adv',
    'asst',
    'atty',
    'bldg',
    'brig',
    'capt',
    'cmdr',
    'comdr',
    'cpl',
    'det',
    'dr',
    'esq',
    'gen',
    'gov',
    'hon',
    'jr',
    'llb',
    'lt',
    'maj',
    'messrs',
    'mlle',
    'mme',
    'mr',
    'mrs',
    'ms',
    'mstr',
    'phd',
    'prof',
    'pvt',
    'rep',
    'reps',
    'res',
    'rev',
    'sen',
    'sens',
    'sfc',
    'sgt',
    'sir',
    'sr',
    'supt',
    'surg'
    //miss
    //misses
  ];

  var months = ['jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec'];

  var nouns$2 = [
    'ad',
    'al',
    'arc',
    'ba',
    'bl',
    'ca',
    'cca',
    'col',
    'corp',
    'ft',
    'fy',
    'ie',
    'lit',
    'ma',
    'md',
    'pd',
    'tce',
  ];

  var organizations = ['dept', 'univ', 'assn', 'bros', 'inc', 'ltd', 'co'];

  var places = [
    'rd',
    'st',
    'dist',
    'mt',
    'ave',
    'blvd',
    'cl',
    // 'ct',
    'cres',
    'hwy',
    //states
    'ariz',
    'cal',
    'calif',
    'colo',
    'conn',
    'fla',
    'fl',
    'ga',
    'ida',
    'ia',
    'kan',
    'kans',

    'minn',
    'neb',
    'nebr',
    'okla',
    'penna',
    'penn',
    'pa',
    'dak',
    'tenn',
    'tex',
    'ut',
    'vt',
    'va',
    'wis',
    'wisc',
    'wy',
    'wyo',
    'usafa',
    'alta',
    'ont',
    'que',
    'sask',
  ];

  // units that are abbreviations too
  var units = [
    'dl',
    'ml',
    'gal',
    // 'ft', //ambiguous
    'qt',
    'pt',
    'tbl',
    'tsp',
    'tbsp',
    'km',
    'dm', //decimeter
    'cm',
    'mm',
    'mi',
    'td',
    'hr', //hour
    'hrs', //hour
    'kg',
    'hg',
    'dg', //decigram
    'cg', //centigram
    'mg', //milligram
    'µg', //microgram
    'lb', //pound
    'oz', //ounce
    'sq ft',
    'hz', //hertz
    'mps', //meters per second
    'mph',
    'kmph', //kilometers per hour
    'kb', //kilobyte
    'mb', //megabyte
    // 'gb', //ambig
    'tb', //terabyte
    'lx', //lux
    'lm', //lumen
    // 'pa', //ambig
    'fl oz', //
    'yb',
  ];

  // add our abbreviation list to our lexicon
  const list = [
    [misc$2],
    [units, 'Unit'],
    [nouns$2, 'Noun'],
    [honorifics, 'Honorific'],
    [months, 'Month'],
    [organizations, 'Organization'],
    [places, 'Place'],
  ];
  // create key-val for sentence-tokenizer
  const abbreviations = {};
  // add them to a future lexicon
  const lexicon$1 = {};

  list.forEach(a => {
    a[0].forEach(w => {
      // sentence abbrevs
      abbreviations[w] = true;
      // future-lexicon
      lexicon$1[w] = 'Abbreviation';
      if (a[1] !== undefined) {
        lexicon$1[w] = [lexicon$1[w], a[1]];
      }
    });
  });

  // dashed prefixes that are not independent words
  //  'mid-century', 'pre-history'
  var prefixes = [
    'anti',
    'bi',
    'co',
    'contra',
    'de',
    'extra',
    'infra',
    'inter',
    'intra',
    'macro',
    'micro',
    'mis',
    'mono',
    'multi',
    'peri',
    'pre',
    'pro',
    'proto',
    'pseudo',
    're',
    'sub',
    'supra',
    'trans',
    'tri',
    'un',
    'out', //out-lived
    'ex',//ex-wife

    // 'counter',
    // 'mid',
    // 'out',
    // 'non',
    // 'over',
    // 'post',
    // 'semi',
    // 'super', //'super-cool'
    // 'ultra', //'ulta-cool'
    // 'under',
    // 'whole',
  ].reduce((h, str) => {
    h[str] = true;
    return h
  }, {});

  // dashed suffixes that are not independent words
  //  'flower-like', 'president-elect'
  var suffixes$1 = {
    'like': true,
    'ish': true,
    'less': true,
    'able': true,
    'elect': true,
    'type': true,
    'designate': true,
    // 'fold':true,
  };

  //a hugely-ignorant, and widely subjective transliteration of latin, cryllic, greek unicode characters to english ascii.
  //approximate visual (not semantic or phonetic) relationship between unicode and ascii characters
  //http://en.wikipedia.org/wiki/List_of_Unicode_characters
  //https://docs.google.com/spreadsheet/ccc?key=0Ah46z755j7cVdFRDM1A2YVpwa1ZYWlpJM2pQZ003M0E
  const compact$1 = {
    '!': '¡',
    '?': '¿Ɂ',
    '"': '“”"❝❞',
    "'": '‘‛❛❜’',
    '-': '—–',
    a: 'ªÀÁÂÃÄÅàáâãäåĀāĂăĄąǍǎǞǟǠǡǺǻȀȁȂȃȦȧȺΆΑΔΛάαλАаѦѧӐӑӒӓƛæ',
    b: 'ßþƀƁƂƃƄƅɃΒβϐϦБВЪЬвъьѢѣҌҍ',
    c: '¢©ÇçĆćĈĉĊċČčƆƇƈȻȼͻͼϲϹϽϾСсєҀҁҪҫ',
    d: 'ÐĎďĐđƉƊȡƋƌ',
    e: 'ÈÉÊËèéêëĒēĔĕĖėĘęĚěƐȄȅȆȇȨȩɆɇΈΕΞΣέεξϵЀЁЕеѐёҼҽҾҿӖӗễ',
    f: 'ƑƒϜϝӺӻҒғſ',
    g: 'ĜĝĞğĠġĢģƓǤǥǦǧǴǵ',
    h: 'ĤĥĦħƕǶȞȟΉΗЂЊЋНнђћҢңҤҥҺһӉӊ',
    I: 'ÌÍÎÏ',
    i: 'ìíîïĨĩĪīĬĭĮįİıƖƗȈȉȊȋΊΐΪίιϊІЇіїi̇',
    j: 'ĴĵǰȷɈɉϳЈј',
    k: 'ĶķĸƘƙǨǩΚκЌЖКжкќҚқҜҝҞҟҠҡ',
    l: 'ĹĺĻļĽľĿŀŁłƚƪǀǏǐȴȽΙӀӏ',
    m: 'ΜϺϻМмӍӎ',
    n: 'ÑñŃńŅņŇňŉŊŋƝƞǸǹȠȵΝΠήηϞЍИЙЛПийлпѝҊҋӅӆӢӣӤӥπ',
    o: 'ÒÓÔÕÖØðòóôõöøŌōŎŏŐőƟƠơǑǒǪǫǬǭǾǿȌȍȎȏȪȫȬȭȮȯȰȱΌΘΟθοσόϕϘϙϬϴОФоѲѳӦӧӨөӪӫ',
    p: 'ƤΡρϷϸϼРрҎҏÞ',
    q: 'Ɋɋ',
    r: 'ŔŕŖŗŘřƦȐȑȒȓɌɍЃГЯгяѓҐґ',
    s: 'ŚśŜŝŞşŠšƧƨȘșȿЅѕ',
    t: 'ŢţŤťŦŧƫƬƭƮȚțȶȾΓΤτϮТт',
    u: 'ÙÚÛÜùúûüŨũŪūŬŭŮůŰűŲųƯưƱƲǓǔǕǖǗǘǙǚǛǜȔȕȖȗɄΰυϋύ',
    v: 'νѴѵѶѷ',
    w: 'ŴŵƜωώϖϢϣШЩшщѡѿ',
    x: '×ΧχϗϰХхҲҳӼӽӾӿ',
    y: 'ÝýÿŶŷŸƳƴȲȳɎɏΎΥΫγψϒϓϔЎУучўѰѱҮүҰұӮӯӰӱӲӳ',
    z: 'ŹźŻżŽžƵƶȤȥɀΖ',
  };
  //decompress data into two hashes
  const unicode$1 = {};
  Object.keys(compact$1).forEach(function (k) {
    compact$1[k].split('').forEach(function (s) {
      unicode$1[s] = k;
    });
  });
  // fullwidth ascii - 'Ｈｅｌｌｏ ２０２４' to 'Hello 2024'
  for (let i = 0x21; i <= 0x7E; i += 1) {
    unicode$1[String.fromCharCode(i + 0xFEE0)] = String.fromCharCode(i);
  }

  // https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5Cp%7Bpunctuation%7D

  // punctuation to keep at start of word
  const prePunctuation = {
    '#': true, //#hastag
    '@': true, //@atmention
    '_': true,//underscore
    '°': true,
    // '+': true,//+4
    // '\\-',//-4  (escape)
    // '.',//.4
    // zero-width chars
    '\u200B': true,
    '\u200C': true,
    '\u200D': true,
    '\uFEFF': true
  };

  // punctuation to keep at end of word
  const postPunctuation = {
    '%': true,//88%
    '_': true,//underscore
    '°': true,//degrees, italian ordinal
    // '\'',// sometimes
    // zero-width chars
    '\u200B': true,
    '\u200C': true,
    '\u200D': true,
    '\uFEFF': true
  };

  const emoticons = {
    '<3': true,
    '</3': true,
    '<\\3': true,
    ':^P': true,
    ':^p': true,
    ':^O': true,
    ':^3': true,
  };

  var model$3 = {
    one: {
      aliases,
      abbreviations,
      prefixes,
      suffixes: suffixes$1,
      prePunctuation,
      postPunctuation,
      lexicon: lexicon$1, //give this one forward
      unicode: unicode$1,
      emoticons
    },
  };

  const hasSlash = /\//;
  const hasDomain = /[a-z]\.[a-z]/i;
  const isMath = /[0-9]/;
  // const hasSlash = /[a-z\u00C0-\u00FF] ?\/ ?[a-z\u00C0-\u00FF]/
  // const hasApostrophe = /['’]s$/

  const addAliases = function (term, world) {
    const str = term.normal || term.text || term.machine;
    const aliases = world.model.one.aliases;
    // lookup known aliases like '&'
    if (aliases.hasOwnProperty(str)) {
      term.alias = term.alias || [];
      term.alias.push(aliases[str]);
    }
    // support slashes as aliases
    if (hasSlash.test(str) && !hasDomain.test(str) && !isMath.test(str)) {
      const arr = str.split(hasSlash);
      // don't split urls and things
      if (arr.length <= 3) {
        arr.forEach(word => {
          word = word.trim();
          if (word !== '') {
            term.alias = term.alias || [];
            term.alias.push(word);
          }
        });
      }
    }
    // aliases for apostrophe-s
    // if (hasApostrophe.test(str)) {
    //   let main = str.replace(hasApostrophe, '').trim()
    //   term.alias = term.alias || []
    //   term.alias.push(main)
    // }
    return term
  };

  const hasDash = /^\p{Letter}+-\p{Letter}+$/u;
  // 'machine' is a normalized form that looses human-readability
  const doMachine = function (term) {
    let str = term.implicit || term.normal || term.text;
    // remove apostrophes
    str = str.replace(/['’]s$/, '');
    str = str.replace(/s['’]$/, 's');
    //lookin'->looking (make it easier for conjugation)
    str = str.replace(/([aeiou][ktrp])in'$/, '$1ing');
    //turn re-enactment to reenactment
    if (hasDash.test(str)) {
      str = str.replace(/-/g, '');
    }
    //#tags, @mentions
    str = str.replace(/^[#@]/, '');
    if (str !== term.normal) {
      term.machine = str;
    }
  };

  // sort words by frequency
  const freq = function (view) {
    const docs = view.docs;
    const counts = {};
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        const term = docs[i][t];
        const word = term.machine || term.normal;
        counts[word] = counts[word] || 0;
        counts[word] += 1;
      }
    }
    // add counts on each term
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        const term = docs[i][t];
        const word = term.machine || term.normal;
        term.freq = counts[word];
      }
    }
  };

  // get all character startings in doc
  const offset = function (view) {
    let elapsed = 0;
    let index = 0;
    const docs = view.document; //start from the actual-top
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        const term = docs[i][t];
        term.offset = {
          index: index,
          start: elapsed + term.pre.length,
          length: term.text.length,
        };
        elapsed += term.pre.length + term.text.length + term.post.length;
        index += 1;
      }
    }
  };

  // cheat- add the document's pointer to the terms
  const index = function (view) {
    // console.log('reindex')
    const document = view.document;
    for (let n = 0; n < document.length; n += 1) {
      for (let i = 0; i < document[n].length; i += 1) {
        document[n][i].index = [n, i];
      }
    }
    // let ptrs = b.fullPointer
    // console.log(ptrs)
    // for (let i = 0; i < docs.length; i += 1) {
    //   const [n, start] = ptrs[i]
    //   for (let t = 0; t < docs[i].length; t += 1) {
    //     let term = docs[i][t]
    //     term.index = [n, start + t]
    //   }
    // }
  };

  const wordCount = function (view) {
    let n = 0;
    const docs = view.docs;
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        if (docs[i][t].normal === '') {
          continue //skip implicit words
        }
        n += 1;
        docs[i][t].wordCount = n;
      }
    }
  };

  // cheat-method for a quick loop
  const termLoop = function (view, fn) {
    const docs = view.docs;
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        fn(docs[i][t], view.world);
      }
    }
  };

  const methods$1 = {
    alias: (view) => termLoop(view, addAliases),
    machine: (view) => termLoop(view, doMachine),
    normal: (view) => termLoop(view, normalize),
    freq,
    offset,
    index,
    wordCount,
  };

  var tokenize$2 = {
    compute: methods$1,
    methods: methods$2,
    model: model$3,
    hooks: ['alias', 'machine', 'index', 'id'],
  };

  // const plugin = function (world) {
  //   let { methods, model, parsers } = world
  //   Object.assign({}, methods, _methods)
  //   Object.assign(model, _model)
  //   methods.one.tokenize.fromString = tokenize
  //   parsers.push('normal')
  //   parsers.push('alias')
  //   parsers.push('machine')
  //   // extend View class
  //   // addMethods(View)
  // }
  // export default plugin

  // lookup last word in the type-ahead prefixes
  const typeahead$1 = function (view) {
    const prefixes = view.model.one.typeahead;
    const docs = view.docs;
    if (docs.length === 0 || Object.keys(prefixes).length === 0) {
      return
    }
    const lastPhrase = docs[docs.length - 1] || [];
    const lastTerm = lastPhrase[lastPhrase.length - 1];
    // if we've already put whitespace, end.
    if (lastTerm.post) {
      return
    }
    // if we found something
    if (prefixes.hasOwnProperty(lastTerm.normal)) {
      const found = prefixes[lastTerm.normal];
      // add full-word as an implicit result
      lastTerm.implicit = found;
      lastTerm.machine = found;
      lastTerm.typeahead = true;
      // tag it, as our assumed term
      if (view.compute.preTagger) {
        view.last().unTag('*').compute(['lexicon', 'preTagger']);
      }
    }
  };

  var compute = { typeahead: typeahead$1 };

  // assume any discovered prefixes
  const autoFill = function () {
    const docs = this.docs;
    if (docs.length === 0) {
      return this
    }
    const lastPhrase = docs[docs.length - 1] || [];
    const term = lastPhrase[lastPhrase.length - 1];
    if (term.typeahead === true && term.machine) {
      term.text = term.machine;
      term.normal = term.machine;
    }
    return this
  };

  const api$5 = function (View) {
    View.prototype.autoFill = autoFill;
  };

  // generate all the possible prefixes up-front
  const getPrefixes = function (arr, opts, world) {
    let index = {};
    const collisions = [];
    const existing = world.prefixes || {};
    arr.forEach((str) => {
      str = str.toLowerCase().trim();
      let max = str.length;
      if (opts.max && max > opts.max) {
        max = opts.max;
      }
      for (let size = opts.min; size < max; size += 1) {
        const prefix = str.substring(0, size);
        // ensure prefix is not a word
        if (opts.safe && world.model.one.lexicon.hasOwnProperty(prefix)) {
          continue
        }
        // does it already exist?
        if (existing.hasOwnProperty(prefix) === true) {
          collisions.push(prefix);
          continue
        }
        if (index.hasOwnProperty(prefix) === true) {
          collisions.push(prefix);
          continue
        }
        index[prefix] = str;
      }
    });
    // merge with existing prefixes
    index = Object.assign({}, existing, index);
    // remove ambiguous-prefixes
    collisions.forEach((str) => {
      delete index[str];
    });
    return index
  };

  const isObject = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  const defaults = {
    safe: true,
    min: 3,
  };

  const prepare = function (words = [], opts = {}) {
    const model = this.model();
    opts = Object.assign({}, defaults, opts);
    if (isObject(words)) {
      Object.assign(model.one.lexicon, words);
      words = Object.keys(words);
    }
    const prefixes = getPrefixes(words, opts, this.world());
    // manually combine these with any existing prefixes
    Object.keys(prefixes).forEach(str => {
      // explode any overlaps
      if (model.one.typeahead.hasOwnProperty(str)) {
        delete model.one.typeahead[str];
        return
      }
      model.one.typeahead[str] = prefixes[str];
    });
    return this
  };

  var lib = {
    typeahead: prepare
  };

  const model$2 = {
    one: {
      typeahead: {} //set a blank key-val
    }
  };
  var typeahead = {
    model: model$2,
    api: api$5,
    lib,
    compute,
    hooks: ['typeahead']
  };

  // order here matters
  nlp.extend(change); //0kb
  nlp.extend(output); //0kb
  nlp.extend(match); //10kb
  nlp.extend(pointers); //2kb
  nlp.extend(tag); //2kb
  nlp.plugin(plugin); //~6kb
  nlp.extend(tokenize$2); //7kb
  nlp.extend(freeze); //
  nlp.plugin(cache$1); //~1kb
  nlp.extend(lookup); //7kb
  nlp.extend(typeahead); //1kb
  nlp.extend(lexicon$2); //1kb
  nlp.extend(sweep); //1kb

  //a hugely-ignorant, and widely subjective transliteration of latin, cryllic, greek unicode characters to english ascii.
  //approximate visual (not semantic or phonetic) relationship between unicode and ascii characters
  //http://en.wikipedia.org/wiki/List_of_Unicode_characters
  //https://docs.google.com/spreadsheet/ccc?key=0Ah46z755j7cVdFRDM1A2YVpwa1ZYWlpJM2pQZ003M0E

  // italian unicode:
  // à, è, é, ì, í, î, ò, ó, ù, ú.
  let compact = {
    '!': '¡',
    '?': '¿Ɂ',
    '"': '“”"❝❞',
    "'": '‘‛❛❜’',
    '-': '—–',
    a: 'ªÁÂÃÄÅáâãäåĀāĂăĄąǍǎǞǟǠǡǺǻȀȁȂȃȦȧȺΆΑΔΛάαλАаѦѧӐӑӒӓƛæ',
    b: 'ßþƀƁƂƃƄƅɃΒβϐϦБВЪЬвъьѢѣҌҍ',
    c: '¢©ÇçĆćĈĉĊċČčƆƇƈȻȼͻͼϲϹϽϾСсєҀҁҪҫ',
    d: 'ÐĎďĐđƉƊȡƋƌ',
    e: 'ÊËêëĒēĔĕĖėĘęĚěƐȄȅȆȇȨȩɆɇΈΕΞΣέεξϵЀЁЕеѐёҼҽҾҿӖӗ',
    f: 'ƑƒϜϝӺӻҒғſ',
    g: 'ĜĝĞğĠġĢģƓǤǥǦǧǴǵ',
    h: 'ĤĥĦħƕǶȞȟΉΗЂЊЋНнђћҢңҤҥҺһӉӊ',
    I: 'Ï',
    i: 'ïĨĩĪīĬĭĮįİıƖƗȈȉȊȋΊΐΪίιϊІЇії',
    j: 'ĴĵǰȷɈɉϳЈј',
    k: 'ĶķĸƘƙǨǩΚκЌЖКжкќҚқҜҝҞҟҠҡ',
    l: 'ĹĺĻļĽľĿŀŁłƚƪǀǏǐȴȽΙӀӏ',
    m: 'ΜϺϻМмӍӎ',
    n: 'ÑñŃńŅņŇňŉŊŋƝƞǸǹȠȵΝΠήηϞЍИЙЛПийлпѝҊҋӅӆӢӣӤӥπ',
    o: 'ÔÕÖØðôõöøŌōŎŏŐőƟƠơǑǒǪǫǬǭǾǿȌȍȎȏȪȫȬȭȮȯȰȱΌΘΟθοσόϕϘϙϬϴОФоѲѳӦӧӨөӪӫ',
    p: 'ƤΡρϷϸϼРрҎҏÞ',
    q: 'Ɋɋ',
    r: 'ŔŕŖŗŘřƦȐȑȒȓɌɍЃГЯгяѓҐґ',
    s: 'ŚśŜŝŞşŠšƧƨȘșȿЅѕ',
    t: 'ŢţŤťŦŧƫƬƭƮȚțȶȾΓΤτϮТт',
    u: 'ÛÜûüŨũŪūŬŭŮůŰűŲųƯưƱƲǓǔǕǖǗǘǙǚǛǜȔȕȖȗɄΰυϋύ',
    v: 'νѴѵѶѷ',
    w: 'ŴŵƜωώϖϢϣШЩшщѡѿ',
    x: '×ΧχϗϰХхҲҳӼӽӾӿ',
    y: 'ÝýÿŶŷŸƳƴȲȳɎɏΎΥΫγψϒϓϔЎУучўѰѱҮүҰұӮӯӰӱӲӳ',
    z: 'ŹźŻżŽžƵƶȤȥɀΖ',
  };
  //decompress data into two hashes
  let unicode = {};
  Object.keys(compact).forEach(function (k) {
    compact[k].split('').forEach(function (s) {
      unicode[s] = k;
    });
  });

  var contractions$1 = [
    { word: `c'è`, out: ['ci', 'è'] },
    { word: `v'è`, out: ['vi', 'è'] },
    { word: `l'ho`, out: ['lo', 'ho'] },
    { word: `l'abbiamo`, out: ['lo', 'abbiamo'] },
    { before: `c`, out: ['ci'] },//c'era, c'erano
    { before: `d`, out: ['di'] },//d'accordo, d'estate
    { before: `dov`, out: ['dove'] },
    { before: `com`, out: ['come'] },
    { before: `quest`, out: ['questo'] },//quest'anno
    { before: `quell`, out: ['quello'] },//quell'uomo
    { before: `sant`, out: ['santo'] },//sant'antonio
    { before: `tutt`, out: ['tutto'] },//tutt'altro
    { before: `mezz`, out: ['mezzo'] },//mezz'ora
    { before: `anch`, out: ['anche'] },//anch'io
    { before: `nessun`, out: ['nessuna'] },//nessun'altra
    { before: `senz`, out: ['senza'] },//senz'altro
    { before: `l`, out: ['lo'] },//or la
    { before: `v`, out: ['vi'] },
    { before: `s`, out: ['si'] },
    { before: `m`, out: ['mi'] },
    { before: `t`, out: ['ti'] },//t'amo
    { before: 'un', out: ['una'] },//un'amica
    { before: 'all', out: ['a', 'l'] },
    { before: 'dell', out: ['di', 'l'] },
    { before: 'nell', out: ['in', 'l'] },
    { before: 'sull', out: ['su', 'l'] },
    { before: 'coll', out: ['con', 'l'] },
    { before: 'dall', out: ['da', 'l'] },
  ];

  var tokenize$1 = {
    mutate: (world) => {
      world.model.one.unicode = unicode;

      world.model.one.contractions = contractions$1;

      // 'que' -> 'quebec'
      delete world.model.one.lexicon.que;
    }
  };

  var version = '0.3.1';

  // 01- full-word exceptions
  const checkEx = function (str, ex = {}) {
    if (ex.hasOwnProperty(str)) {
      return ex[str]
    }
    return null
  };

  // 02- suffixes that pass our word through
  const checkSame = function (str, same = []) {
    for (let i = 0; i < same.length; i += 1) {
      if (str.endsWith(same[i])) {
        return str
      }
    }
    return null
  };

  // 03- check rules - longest first
  const checkRules = function (str, fwd, both = {}) {
    fwd = fwd || {};
    let max = str.length - 1;
    // look for a matching suffix
    for (let i = max; i >= 1; i -= 1) {
      let size = str.length - i;
      let suff = str.substring(size, str.length);
      // check fwd rules, first
      if (fwd.hasOwnProperty(suff) === true) {
        return str.slice(0, size) + fwd[suff]
      }
      // check shared rules
      if (both.hasOwnProperty(suff) === true) {
        return str.slice(0, size) + both[suff]
      }
    }
    // try a fallback transform
    if (fwd.hasOwnProperty('')) {
      return str += fwd['']
    }
    if (both.hasOwnProperty('')) {
      return str += both['']
    }
    return null
  };

  //sweep-through all suffixes
  const convert = function (str = '', model = {}) {
    // 01- check exceptions
    let out = checkEx(str, model.ex);
    // 02 - check same
    out = out || checkSame(str, model.same);
    // check forward and both rules
    out = out || checkRules(str, model.fwd, model.both);
    //return unchanged
    out = out || str;
    return out
  };

  const flipObj = function (obj) {
    return Object.entries(obj).reduce((h, a) => {
      h[a[1]] = a[0];
      return h
    }, {})
  };

  const reverse = function (model = {}) {
    return {
      reversed: true,
      // keep these two
      both: flipObj(model.both),
      ex: flipObj(model.ex),
      // swap this one in
      fwd: model.rev || {}
    }
  };

  const prefix$1 = /^([0-9]+)/;

  const toObject = function (txt) {
    let obj = {};
    txt.split('¦').forEach(str => {
      let [key, vals] = str.split(':');
      vals = (vals || '').split(',');
      vals.forEach(val => {
        obj[val] = key;
      });
    });
    return obj
  };

  const growObject = function (key = '', val = '') {
    val = String(val);
    let m = val.match(prefix$1);
    if (m === null) {
      return val
    }
    let num = Number(m[1]) || 0;
    let pre = key.substring(0, num);
    let full = pre + val.replace(prefix$1, '');
    return full
  };

  const unpackOne = function (str) {
    let obj = toObject(str);
    return Object.keys(obj).reduce((h, k) => {
      h[k] = growObject(k, obj[k]);
      return h
    }, {})
  };

  const uncompress = function (model = {}) {
    if (typeof model === 'string') {
      model = JSON.parse(model);
    }
    model.fwd = unpackOne(model.fwd || '');
    model.both = unpackOne(model.both || '');
    model.rev = unpackOne(model.rev || '');
    model.ex = unpackOne(model.ex || '');
    return model
  };

  // generated in ./lib/models
  var model$1 = {
    "nouns": {
      "plural": {
        "fwd": "1:io¦i:e,a¦1i:to,no,zo,so,lo,bo,do,vo,mo,ro,po,uo,os,oo¦1e:na¦2hi:cco,sco,rco,uco,eco,ego,uca,rca,cca¦3i:mico,fico,nico,naco,pico¦3hi:rica¦4hi:arico",
        "both": "1:à¦4i:ichio,golio,tolio¦4s:ware¦4ini:luomo¦4hi:ilogo,alogo¦3e:stra¦3hi:mica,uogo,gogo¦3i:daco,nvio,enio,maco,ttio,vvio,sico,iaco¦3s:gan,age¦2e:dia,era,lla,tia,rra¦2hi:ngo,oco,igo,lco,nco,rgo¦2s:et¦2i:ogo¦1e:sa,cia¦1i:ko,eo,fo¦1s:r¦1en:man",
        "rev": "1:t¦:s¦a:he¦1o:ii,ghi¦1a:te,ze,re,me,ve,ie,le¦2o:ati,zzi,ssi,rti,usi,ai,iti,rdi,lli,tti,bbi,ani,ivi,smi,lbi,tmi,evi,rni,oli,tri,rpi,lti,eli,ovi,gni,rri,isi,achi,lzi,mpi,api,cri,iri,rsi,ppi,rvi,spi,cli,lpi,ebi,lmi,obi,lsi,rli,zoi¦2e:ori,oni,ali,roi,esi¦2a:sti,mmi,gmi,ene,ine¦3o:gli,enti,cci,toi,acchi,muli,rini,nimi,nini,ondi,nci,lini,tini,meti,iuti,beri,ggi,unni,rodi,tipi,izi,sini,unti,buti,reni,uini,cini,bini,hini,simi,imbi,heri,onni,onzi,zini,lci,feri,sci,anni,meni,edri,iodi,azi,egi,fili,meri,ombi,andi,rci,pini,aini,eschi,nuti,uvi,bbri,igi,ieni,ropi,fori,arbi,embi,peti,cavi,vini,tuti,nodi,moti,ozi,seni,veti,lichi,arzi,soi,erzi,ezi,suti¦3e:anti,fari,ieri,podi,rili,lumi,seri,tumi,nili,ceri,iedi,tili,suli,nami,iumi,dici,gimi,oidi¦3a:temi,iomi,geti,ioti,loti,lemi,euti,enzi,turi,padi¦4o:ndini,uari,gosti,pasti,busti,emici,rredi,ggini,sensi,dromi,aleni,lischi,becchi,amini,oneri,gusti,dari,mmini,mbali,ofoni,pensi,adini,edini,umini,ttari,rucchi,lfini,sagi,sesti,vari,oqui,igoni,iocchi,manzi,barchi,ludi,onaci,anici,hermi,tadi,cnici,lagi,conti,fugi,forzi,pudi,andri,efoni¦4e:denti,larmi,ltari,ienti,rgini,gneri,ipoti,alici,ipiti,spiti,omani,nsoli,oteri,imini,ttami,eneri,arici,egami,nenti,renti,ileni,llami,ederi,uenni,rnici¦4a:nauti,lasmi,iatri,tezzi,formi,tradi,tanzi¦5o:quisti,fronti,gravi,atari,uguri,verbi,tiari,enari,ossidi,scopi,ifici,lavori,ilici,otteri,onari,pendi,cambi,istori,asteri,libri,ncanti,isodi,patri,icidi,osari,ocini,etari,fragi,nsieri,tenni,cuperi,orchi,andali¦5e:tefici,ttenti,igenti,ertici,agenti,mestri¦5a:oranzi,cletti",
        "ex": "3:agio,ozio¦4:link,host,astio,atrio,bacio,cesio,conio,cuoio,micio,palio,patio,podio,socio¦5:retro,adagio,avorio,cambio,cappio,caprio,cranio,diario,elogio,erario,frocio,nunzio,occhio,soffio,tornio¦6:camion,armadio,assedio,ausilio,biennio,cerchio,cimelio,cocchio,delirio,demanio,eccidio,emporio,encomio,esempio,esordio,fischio,gasolio,geranio,graffio,idillio,indugio,logorio,lunario,marchio,mucchio,muschio,ossario,raschio,rimedio,ringhio,rischio,salario,scoppio,secchio,segugio,sicario,sipario,teschio,ufficio,velario¦7:account,archivio,auspicio,batterio,cifrario,concilio,connubio,contagio,criterio,crocchio,decennio,deuterio,dissidio,divorzio,epinicio,epitelio,falsario,fastidio,frasario,ginnasio,glucosio,granchio,incendio,inciucio,incrocio,intarsio,manubrio,marsupio,mercurio,obitorio,orecchio,orologio,ossequio,pertugio,petrolio,sacrario,silenzio,simposio,specchio,spicchio,suburbio,sussidio,triennio¦8:business,gioventù,adulterio,auditorio,beneficio,breviario,consorzio,coperchio,corridoio,desiderio,domicilio,epitaffio,esproprio,finocchio,genocidio,glossario,maleficio,malocchio,manicomio,millennio,monopolio,municipio,nevischio,nosocomio,obbrobrio,papocchio,pidocchio,primordio,putiferio,raddoppio,ranocchio,risparmio,risucchio,seminario,sterminio,tenutario,vaticinio,vituperio¦9:avversario,corollario,crematorio,crocicchio,cronicario,dignitario,dormitorio,formulario,impresario,improperio,infortunio,inventario,itinerario,lucernario,matrimonio,mattocchio,mercimonio,necrologio,notiziario,oligopolio,pandemonio,participio,patrimonio,pennacchio,predominio,purgatorio,reclusorio,refettorio,repertorio,ricettario,sgocciolio,sillabario,territorio¦10:ambulatorio,apparecchio,brefotrofio,colluttorio,commentario,commissario,comprimario,consultorio,dentifricio,depositario,dispensario,epistolario,falansterio,laboratorio,macchinario,marcantonio,mitocondrio,pastrocchio,pateracchio,presbiterio,promontorio,reliquiario,semicerchio,spauracchio,vocabolario¦11:anniversario,armamentario,comprensorio,governicchio,indirizzario,orfanatrofio,orfanotrofio,osservatorio,parabancario,scarabocchio¦12:bibliotecario¦14:poliambulatorio,vicecommissario¦15:antinfiammatorio,antiparassitario¦4i:addio,bivio,iodio,oblio,sodio,tedio,vocio,abate,abete,acaro,apice,aroma,asilo,atomo,avere,baule,belga,busto,canto,cenno,censo,cesto,chilo,clima,cloro,colle,conte,costo,dente,duomo,erede,esame,esodo,fasto,fauno,feudo,frate,fusto,gambo,germe,gesto,gnomo,grado,greto,grido,grumo,guado,gusto,latte,libro,logos,mambo,manto,manzo,marmo,miele,monte,morbo,mosto,nuoto,obice,omino,onere,ovulo,padre,pasto,pesce,poema,poeta,ponte,prete,reame,resto,rublo,scalo,scopo,scudo,senno,senso,serbo,siero,sisma,soldo,sparo,sposo,sputo,suono,tasto,teste,topos,trono,tuono,utero,vanto,verbo,verme,sfida,tenda,morte,porta,prova,mappa,carne,notte,corda,ombra,forma,pelle,fonte,forza,torre,retta,acqua,corte,croce,carta,tazza,crepa,droga,guida,dieta,stima,multa,paura,linea,legge,lente,pinta,quota,fetta,firma,punta,ruota¦7s:affaire,college,exploit¦10s:aficionado,carabinero,vaudeville¦2hi:ago,eco¦6hi:apologo,collega,intrico,pizzico,prologo,pratica,allocco,alterco,ammicco,balocco,cacicco,chiosco,comasco,gerarca,menisco,monarca,ritocco,sblocco,sceicco,tarocco,ricerca¦7i:arbitrio,asparago,carbonio,chierico,chirurgo,crepitio,duopolio,ludibrio,mormorio,plutonio,presidio,thesaurus,tremolio,turbinio,acrobata,aforisma,agronomo,alfabeto,amalgama,aneddoto,anticipo,antidoto,antigene,aruspice,baritono,belcanto,bestiame,bonifico,bulimico,cadavere,calamaro,carneade,catetere,cesenate,ciarpame,cilindro,cimitero,cinemino,clistere,collaudo,comodino,complice,conclave,confonto,dicembre,disguido,disturbo,espianto,fantasma,focolare,fogliame,frutteto,gendarme,geometra,giaguaro,giardino,girasole,glaucoma,immagine,impianto,levriero,luminare,lupanare,magliaro,mecenate,megafono,melanoma,mezzadro,minareto,monolite,negriero,neosposo,nonsense,novembre,oroscopo,ossigeno,ossimoro,paninaro,panorama,papavero,parmense,pezzente,pomodoro,pretesto,proclama,programa,protesto,pullmino,rammendo,responso,restauro,richiamo,ricovero,riordino,riquadro,schemino,schianto,sciopero,scorporo,scudiero,semitono,sentiero,sergente,serpente,servente,sfintere,sperpero,televoto,titolare,torneino,traffico,tramonto,visconte,bellezza,chiusura,crescita,mancanza,qualcuno,chiunque,alleanza,condotta,chiamata,arachide,rotolare,template¦9hi:arcipelago,biblioteca,reincarico,sottobosco,supermarco,videodisco¦9i:assassinio,condominio,panegirico,parlatorio,pronostico,scandaglio,scintillio,sfarfallio,trentennio,aeromobile,aminoacido,architrave,biliardino,cacciavite,camaleonte,camposanto,candelabro,capocomico,cataclisma,conversare,detergente,forestiero,gastronomo,interprete,ippopotamo,kilogrammo,masnadiero,mastodonte,metabolita,noccioleto,pachiderma,panchinaro,pianoforte,prestanome,problemino,quadrupede,rimprovero,risciacquo,soprannome,superteste,tangentaro,tecnocrate,teleutente,ultrasuono,vacanziero,ventunenne,coordinata,strisciare,rientranza,tonnellata¦5i:attico,brusio,esilio,leggio,pendio,prozio,ronzio,alcol,affido,agrume,alloro,alluce,altero,ascaro,asceta,atleta,attimo,automa,avanzo,batavo,bavero,bolero,bolide,budino,bufalo,caduto,camice,cateto,colono,crisma,cristo,cugino,curaro,danaro,decoro,dedalo,denaro,dinaro,dirupo,domino,dovere,druido,enzima,esteta,estimo,flauto,fluoro,fodero,fronte,fucile,genoma,grammo,gregge,guanto,impero,incubo,lavoro,legume,letame,limite,membro,metodo,miasma,milite,modulo,ordine,ossido,papero,parere,petalo,picaro,podere,polipo,pranzo,prisma,pugile,puparo,raduno,regalo,riarmo,ricamo,rifuto,riparo,riposo,roseto,rudere,salame,saluto,sapere,schema,scialo,sciame,scisma,scriba,sedile,sibilo,sigaro,siluro,sperma,squalo,stormo,stupro,talamo,temine,tesoro,timbro,torace,torero,trauma,ussaro,utente,veleno,ventre,vivero,volere,zigomo,svolta,classe,moneta,durata,flotta,pietra,estate,cialda,addome,valuta,figura,patata,statua,visita,quadro¦3hi:baco,caco,fico,lago,logo,rogo,sugo,anca,arco,buco,duca,muco,orco¦8s:bailamme,commando,flamenco,pastiche,skinhead¦6i:baltico,brillio,dominio,fruscio,mosaico,parroco,portico,titanio,villico,abbuono,accenno,alveare,amuleto,arresto,balsamo,benzene,bisonte,borsaro,brivido,buttero,calesse,calibro,canguro,canneto,cappero,cardine,carisma,carrubo,cascame,castoro,catasto,catrame,certame,cetnico,coagulo,cognome,compare,computo,concime,condono,confine,congedo,coniuge,consumo,cratere,culmine,dattero,decreto,degrado,deposto,despota,diacono,diadema,diploma,disarmo,divieto,dollaro,ematoma,epiteto,eremita,fibroma,filmino,fulmine,giubilo,glicine,globulo,gravame,incenso,incesto,innesto,insieme,istinto,lichene,linfoma,liquame,magiaro,magnate,maniero,marasma,martire,mastice,mistero,moldavo,neofita,nuraghe,orefice,oriundo,ottobre,ovocita,patrono,perdono,pettine,pianeta,pianoro,pigiama,pollice,polline,postero,presepe,primate,profeta,profumo,pronome,pulmino,rapsodo,reclamo,riesame,rincaro,rinculo,riserbo,scialle,scolaro,seguace,sintomo,sloveno,sofisma,soldino,succube,suocero,tamburo,tendine,teorema,termine,travaso,tribuno,tropico,turbine,vigneto,vortice,nascita,fornace,testata,perdita,entrate,rivolta,squadra,tornado,offerta,azienda,domanda,disputa,finanza,tariffa,bussare,origine,portata,riserva,stringa¦10i:barbiturico,quadriennio,quinquennio,camerunense,chiaroscuro,coefficente,condottiero,contrappeso,controcanto,controesodo,contrordine,imbarcadero,maggiordomo,metropolita,palazzinaro,palinsensto,parafulmine,policlinico,presupposto,rinoceronte,satellitare,alternativa,caffellatte,passeggiata¦6s:barrio,charme,marine,pueblo,studio¦4ifondi:bassofondo¦4s:blog,byte,club,film,game,list,menu¦3i:brio,mago,odio,olio,trio,paio,acme,anno,asse,baro,bene,calo,cane,caso,cero,ceto,cibo,coma,coro,cubo,culo,dado,doge,dono,ente,faro,feto,filo,foro,fumo,gene,goto,inno,lido,lino,lodo,lume,lupo,mare,maso,mimo,modo,moto,mulo,muro,naso,nodo,nome,nume,oboe,oste,otre,pane,papa,pene,pepe,pero,peso,peto,pino,pomo,poro,pube,pupo,ramo,remo,rene,seme,seno,sole,tema,tino,tomo,tono,topo,toro,tubo,vaso,vate,veto,vino,voce,voto,base,vita,rete,pace,foto,nave,area,mira,cura,fuga,erba,idea,luce,leva,lega,nota,noce,paga,pipa,fase,cose,riva,cima,sede,arma,onda¦2oi:bue¦9s:campesino,videogame¦3ibanda:capobanda¦3iclan:capoclan¦3icorrente:capocorrente¦3icosca:capocosca¦3idelegazione:capodelegazione¦3ifamiglia:capofamiglia¦3igabinetto:capogabinetto¦3imafia:capomafia¦3ipattuglia:capopattuglia¦3ipopolo:capopopolo¦3ireparto:caporeparto¦3iscuola:caposcuola¦3iservizio:caposervizio¦3isquadra:caposquadra¦3istazione:capostazione¦3istruttura:capostruttura¦3iufficio:capoufficio¦1m.:centimetro,kilometro,millimetri¦12i:cinquantennio,superalcolico,biancoceleste,diciannovenne,xenotrapianto¦8i:colloquio,gorgoglio,principio,sarcofago,scrutinio,settennio,sfavillio,tintinnio,abbandono,aborigeno,allergene,amanuense,ammontare,astronomo,autocrate,avamposto,borgataro,burocrate,campanaro,caposaldo,carattere,carcinoma,carnefice,collagene,condomino,contrasto,cromosoma,destriero,disavanzo,disordine,ditirambo,dividendo,estrogeno,frangente,frastuono,gelsomino,ghirigoro,grembiule,individuo,interesse,israelita,labirinto,magistero,metallaro,meteorite,metronomo,ministero,nocchiero,olocausto,orizzonte,orologino,palombaro,pataccaro,pescecane,pesticida,pistolero,posticipo,prosieguo,ravennate,reintegro,ricordino,ripetente,sacerdote,settembre,sistemino,sovracuto,tassinaro,trapianto,assemblea,sottaceto,sicurezza,debolezza,sconfitta,dinosauro,abitudine,etichetta,lunghezza,narrativa,procedura,rilevanza¦8a:continuum,ginocchio¦4ora:corpus¦1ei:dio¦12s:desaparecido¦5fondo:doppiofondo¦4hi:drago,giogo,plico,sfogo,spago,svago,volgo,vasca,mosca,becco,bosco,bruco,casco,circo,disco,picco,succo,varco,bocca¦11i:guazzabuglio,quindicennio,scricchiolio,avventuriero,contrafforte,contribuente,festivaliero,guerrigliero,lungodegente,megaimpianto,nullafacente,palcoscenico,partitocrate,petrodollaro,progestinico,quadrilatero,superdollaro,ventiseienne,ventitreenne¦7hi:lombrico,monologo,naufrago,ombelico,stratega,politica,granduca,incarico,mollusco,oligarca,prosecco,ricarico,rintocco,scirocco,tricheco,fabbrica,bistecca¦5hi:macaco,valico,musica,blocco,bricco,brocco,chicco,copeco,eunuco,fiasco,gnocco,sbocco,spreco,giacca,carica,clicca¦5s:macho,peone,ratio,score¦4iviri:proboviro¦4icrociati:scudocrociato¦5ei:semidio¦6es:sketch¦8hi:solletico,strascico,tarassaco,transfuga,alambicco,asterisco,autoparco,patriarca,rammarico,discarica¦8ini:superuomo¦5idanza:teatrodanza¦3ini:uomo¦7igruppo:vicecapogruppo¦3l.:volumi¦4era:vulnus¦4ies:yuppy¦2i:zio,ano,avo,duo,evo,oro,uno,ala,ape,pro¦5e:scarpa,carota,anatra,misura,usanza,lingua,foglia,nuvola,pianta,pioggia,regola,scelta¦4e:torta,capra,trama,stiva,bugia,gamba¦4he:barca,tasca,pesca¦11a:sopracciglio¦9e:bancarotta¦6e:bevanda,vendita,lacrima,vacanza,verdura,rivista,recluta,fermata,vittima,cellula,costola,scimmia¦8e:sigaretta,frequenza,inchiesta¦7e:carrozza,insalata,tempesta,sostanza,avanzata,impronta,speranza,cravatta,ferrovia,molecola,montagna¦10e:uguaglianza,circostanza,aspettativa,prospettiva¦3e:fata¦13he:caratteristica¦2he:oca¦6he:tecnica,tattica¦13i:chemioterapico,superburocrate,superministero,consapevolezza¦15i:europarlamentare¦12hi:lanzichenecco¦11hi:streptococco¦14i:superconsulente"
      }
    },
    "adjectives": {
      "fs": {
        "fwd": "1:a",
        "both": "1:e¦1rice:tore¦a:o",
        "rev": "4:beta,iota¦5:nista,xista,lista,sista,amita,cista,zista,icida,eista,dista,rista",
        "ex": "6:semita¦7:cairota,dalmata,sannita¦8:maronita¦9:altruista,dirigista,intimista¦10:consumista,contraerea,eteroclita,khatamista,trotzkista¦11:antimaoista,cosmopolita¦12:legittimista,novecentista,oscurantista¦13:collettivista¦14:superottimista¦15:liberoscambista¦5e:restio"
      },
      "mp": {
        "fwd": "2:cio,pio,mio,zio,nio,hio,vio,fio,lio¦3:ario,erio,prio¦5:ttorio,itorio¦i:e,o,a",
        "both": "2:oio,aio,gio¦4:sorio¦5:ltorio,ntorio,otorio,utorio¦2hi:cco,sco,nco¦1hi:go",
        "rev": "1e:li¦1o:vi,ci,si,bi,ni,ei,di,mi¦2e:nti,lci¦2o:uti,ati,tti,uli,iti,gri,zzi,rfi,rti,lti,eri,ffi,eti,rui,rri,cui,spi,uri,qui,tui,ochi,lui,pli,lzi,ppi¦3e:ormi,nesi,oidi,lari,iori,roci,hesi,ngui,coni,ebri,enni,beni,caci,vesi,laci,gaci,erdi,mori,lori,ubri,uaci,ioni,loci,desi¦3o:nci,esti,coli,cci,igui,usti,noli,osti,inti,fili,ulli,abri,izi,sci,inui,ioli,vori,moti,olli,mpi,nfi,gli,illi,orii¦3a:isti,ioti¦4o:efali,iunti,tari,rari,astri,sunti,uari,opri,cari,relli,dari¦4a:abeti,icidi,amiti¦4e:estri,ssoni,liari,eresi,neari,olesi,aresi,rensi,cordi,plici,ustri,unari¦5o:franti,onari,viari,ulenti,ziari,ntenti,enari¦5e:finari,cleari,lanari,ortesi",
        "ex": "4:medio,ionio,pario,sazio,serio,vario¦5:patrio,spurio,esimio,marzio,pluvio,previo,viario¦6:vanesio,astemio,oleario,sudicio¦7:amatorio,indubbio,caseario,corinzio,fognario,fradicio,littorio,sommario,urinario¦8:aleatorio,dilatorio,minatorio,moratorio,natatorio,rogatorio,rotatorio,sciatorio,senatorio,venatorio,cambiario,culinario,deleterio,dolciario,meritorio,molitorio,ordinario,parecchio,semiserio,soverchio¦9:adulatorio,dittatorio,espiatorio,operatorio,probatorio,vessatorio,campanario,cartolario,inibitorio,necessario,pecuniario,pontificio,primigenio,proditorio¦10:accusatorio,depuratorio,derogatorio,divagatorio,divinatorio,emigratorio,gladiatorio,indagatorio,liberatorio,navigatorio,ondulatorio,revocatorio,sfottitorio,transitorio¦11:canzonatorio,circolatorio,combinatorio,cospiratorio,declamatorio,denigratorio,diffamatorio,immigratorio,liquidatorio,obbligatorio,preparatorio,provocatorio,respiratorio,inquisitorio¦12:allucinatorio,anticipatorio,consacratorio,deregolatorio,dissacratorio,infiammatorio,intimidatorio,sanzionatorio,chirografario,straordinario¦13:autorizzatorio,mistificatorio¦14:autoesaltatorio,discriminatorio,contraddittorio¦17:autogratificatorio,cardiocircolatorio¦18:autocongratulatorio,autoidentificatorio¦4hi:fioco¦3hi:poco¦5hi:sporco¦11i:accentratore,annientatore,compensatore,concertatore,conciliatore,confortatore,disciplinare,disgregatore,divisioniste,fallimentare,modificatore,movimentiste,nicaraguense,pazzerellone,picchiatello,precorritore,propiziatore,purificatore,sovvertitore,statunitense,vivificatore¦3i:acre,afro,diro,dopo,malo,miro,mite,noto,solo,usto¦13i:agroalimentare,anglonorvegese,autocondannare,chiarificatore,distruggitrice,motopropulsore,riconciliatore,sterilizzatore¦5i:alacre,arcade,canoro,capace,celere,chiaro,felice,fifone,immune,inerme,inerte,logoro,mutilo,nuvolo,palese,pronto,quanto,restio,scevro,semita,smunto,snello,spento,verace,vivace,grande,triste¦9i:alimentare,civettuolo,comunicate,contraerea,dilatatore,disattento,elementare,eteroclita,fuoriserie,incitatore,istruttore,placentare,psicotropo,sacrosanto,sonnolento,sottovento,sprovvisto,stragrande¦10i:altrettanto,ausiliatore,cistercense,commutatore,consolatore,cosmopolita,eliminatore,fraudolento,giudicatore,ingannatore,livellatore,premonitore,pusillanime,racalmutese,suscitatore,unificatore¦6i:ambedue,anomalo,apolide,assiduo,birbone,bivalve,cairota,caprese,celeste,cotanto,cruento,dalmata,defunto,egemone,giovine,incline,inferme,ingenuo,inodoro,lombare,mannaro,mordace,oratoro,precoce,redento,rivisto,sannita,sbronzo,sgombro,unanime,vallese,vergine,giovane,attento¦8i:anglomane,collinare,contumace,culattone,escretore,frammisto,incruento,irredento,leggiadro,macilento,migratore,milionare,ostrogoto,panamense,partecipe,precipite,pulvinare,semivuoto¦4i:annuo,arduo,aspro,avaro,bello,boaro,breve,ebbro,ebete,grave,greve,italo,lieve,macro,miope,sacro,soave,stufo,tanto,tenue,vasto,forte¦12i:autoconferire,deregolatrice,equilibratore,interrogatore,regolamentare,sanguinolento,sopraffattore¦7i:benevolo,benvisto,compunto,degenere,equanime,impronto,incolume,inospite,insaporo,irruento,malevolo,malvisto,marinaro,maronita,poltrone,precipuo,previsto,proclive,rampanto,salutare,urlatore,violento¦16i:interdisciplinare,interparlamentare"
      },
      "fp": {
        "fwd": "2e:tia",
        "both": "3e:mpia¦2e:lia,fia,via,hia,dia,aia,zia,gia,mia,ria¦1e:za,pa,fa,da,ba,ea,ua,sa,ra,na,ma,la,cia,va,ta¦1he:ga,ca¦i:e",
        "rev": "1a:ie",
        "ex": "6:restie¦5e:elisia¦7e:indubbia,levatoia,scorsoia,tuscania¦4e:ionia¦9e:primigenia¦6e:vanesia"
      }
    },
    "presentTense": {
      "first": {
        "fwd": "o:are,ere,apere¦lgo:gliere¦esco:uscire¦ngo:gnere¦ò:avere¦1co:urre¦1io:arere¦1sso:otere¦1o:vire¦1glio:olere¦2go:enire,enere,alere,anere¦2sco:fire¦2o:prire,frire¦2cio:acere¦3o:ertire,ucire,ormire,eguire,nguire,mpire¦4o:borrire,sentire",
        "both": "5ò:ttostare¦5sco:ientire,mentire,ristire,asprire,rugnire,lestire,dolcire¦5o:ipartire¦4o:sorbire,fuggire,bollire,vestire¦4sco:ortire,ltrire,ontire,ignire,etrire,uarire,ermire,arrire,iarire,antire¦4go:isalire,ssalire¦4co:ledire¦3o:utrire¦3co:sdire,ddire¦3sco:ltire,ncire,agire,etire,ocire,grire,rnire,emire,orire,rcire,urire,atire,unire,inire,ttire,erire,anire,utire,onire¦2uco:anicare¦2sco:eire,hire,oire,pire,zire,sire,bire,uire,dire,lire¦2io:parire¦1ggo:arre¦1ngo:orre",
        "rev": "1are:no,fo,zo,so,po,eo,dò,tò¦1re:isco¦1uscire:iesco¦1gliere:elgo¦1avere:iò¦2are:aco,lio,ero,cco,cio,ito,uro,ogo,eco,nto,eto,ato,pio,ulo,bbo,hio,amo,bio,ilo,oco,olo,iro,avo,gio,ago,ego,aro,tio,uto,fio,oto,rio,vio,ugo,lto,oro,nuo,tuo,elo,mio,rlo,alo,lmo,nio,pto,lco,bro,ibo,dio,rmo,cro,plo,zio,ubo,sio,omo,blo,gro,smo,cuo,ddo,duo,mmo,obo,dro,vro,uio,ldo,tmo,abo,clo,uvo,glo¦2gliere:colgo,iolgo,tolgo¦2ere:rgo,lvo¦2mettere:asetto¦2gnere:pengo¦3are:baio,bico,itto,arro,allo,ello,stro,tico,otto,erro,fido,mico,levo,erco,rico,fico,nido,noio,cico,orto,simo,itro,pico,osto,illo,sodo,ordo,ardo,asto,ruco,usco,utto,dido,tigo,ntro,iodo,ifro,vigo,audo,lico,rovo,cimo,gedo,nsto,tumo,ullo,nudo,sico,urbo,ando,enco,erbo,ltro,irto,nico,usto,arbo,uido,arco,buco,tivo,modo,uaio,novo,timo,pido,anco,squo,etro,zico,nimo,vico,cquo,onco,livo,urro,hedo,raio,fumo,temo,nodo,pumo,upro,mpro,dovo,goio¦3rre:bduco,educo,oduco¦3ere:endo,orro,ungo,cedo,ingo,iedo,osco,ludo,peto,tengo,inco,eggo,iggo,cado,nquo,rimo,iudo,erdo,vido,valgo,sigo,rudo,vado,undo,digo,cevo,mango,uovo,vedo,lodo,uoccio¦3ire:vengo,opro¦3re:rdico,idico,ifaccio¦4ere:batto,brado,metto,rrido,crivo,sisto,ssumo,torco,volgo,lango,ncido,cerno,nvivo,rrodo,ecido,iligo,rompo,suado,ruggo,scuto,tollo,dulgo,trido,gligo,ccido,iango,nasco,edimo,cindo,credo,fulgo,mordo,combo,pando,premo,ompio¦4are:bdico,cetto,uisto,deguo,dopro,fetto,hindo,largo,lerto,lungo,prodo,besco,rredo,rrivo,sesto,visto,betto,lindo,rindo,pesto,uetto,patto,servo,nsumo,testo,rollo,predo,leguo,iredo,detto,serto,vulgo,mendo,retto,nesto,udico,ratto,latro,bosco,resto,collo,fango,forco,gorgo,nesco,tasco,singo,festo,ndico,lesto,bligo,ietto,adico,catto,desto,getto,tombo,petto,aetto,brigo,chivo,cuoio,follo,grido,uarto,blimo,icido,rinco,ucido,bondo,idimo,erivo,matto,hatto,vetto,grado,trado¦4rre:onduco,raduco¦4ire:seguo,verto,iapro¦4re:cucio,empio,affaccio¦5are:ccerto,llatto,anetto,rringo,rcondo,nfisco,iletto,seredo,econdo,chetto,valido,acrimo,anduco,roetto,redico,omulgo,tristo,ntatto,iesumo,ifondo,mbombo,pinguo,prango¦5ere:cresco,frango,nnetto,scondo,nedico,ollido,tinguo,spello,nfondo,resumo,epello,sfondo,mpiaccio¦5ire:ssento,nsento,isento,piatto",
        "ex": "ho:avere¦odo:udire¦esco:uscire¦sono:essere¦vado:andare¦3sco:agire,unire¦7sco:arrostire,imbastire,impartire¦2vo:bere¦2co:dire¦4o:fuggire,mentire,partire,sentire,vestire,pentire,battere,bendare,bollare,brigare,cascare,cernere,cherere,credere,cremare,cucire,curvare,destare,dettare,distare,dormire,educare,elidere,empire,eredare,erigere,erodere,fervere,follare,fondare,fottere,fremere,frodare,fulgere,gettare,giovare,gradare,gridare,guadare,latrare,lattare,listare,mattare,mescere,mestare,mettere,mietere,mollare,mondare,mordere,nascere,nettare,offrire,pascere,pescare,pestare,predare,premere,privare,purgare,restare,rombare,rompere,salvare,scemare,seguire,servire,sondare,tangere,tessere,torcere,tremare,vangare,vergare,vertere,vistare,volgere,testare,piovere,scovare,settare¦5sco:gestire,muggire,ruggire,sparire¦7co:interdire¦9sco:irrobustire¦4sco:lenire¦1uoio:morire¦3ò:ridare¦4co:ridire,addurre,indurre¦4ò:ristare¦3go:salire,tenere,valere,venire¦6sco:spartire¦8etto:teletrasmettere¦2ccio:fare¦4io:cuocere¦4cio:nuocere,piacere,giacere¦4ccio:rifare¦8ccio:sopraffare¦7o:appiattire,affrescare,concertare,diffondere,profondere,propellere,riflettere,rispondere¦5o:aborrire,adattare,adescare,assidere,avvivare,caducare,chierere,crescere,dedicare,deridere,desumere,dirigere,flettere,frangere,goffrare,imbevere,incutere,inondare,irrigare,languire,medicare,ossidare,piombare,riardere,riducere,rivivere,sborrare,scartare,sfondare,sfottere,smistare,soffrire,sporcare,stangare,trombare¦9o:affaccendare,sopravvivere¦6o:affondare,allettare,ammorbare,appartare,effondere,incartare,incurvare,ravvivare,resettare,rimestare,ripescare,eccellere¦2o:alare,amare,arare,orare,stare¦3o:algere,aprire,ardere,badare,bucare,cadere,cedere,cimare,covare,ducere,errare,fidare,fumare,gemere,godere,ledere,levare,licere,limare,lodare,mimare,mudare,ondare,ostare,radere,redare,remare,ridere,rigare,risapere,rodare,sedare,sudare,sumere,temere,ungere,urtare,vivere¦8o:arrotondare,consolidare,dissanguare,intorbidare,sprofondare,rinfrescare¦2lgo:cogliere,togliere¦10o:corrispondere¦1o:dare,sapere¦2io:parere¦2sso:potere¦2glio:solere,volere¦3io:sparere¦3cio:tacere"
      },
      "second": {
        "fwd": "1:iare,iere¦2:vire¦3:prire,ucire,mpire,frire¦4:orrire,ertire,ormire,eguire¦5:sentire,anguire,pparire,mparire¦i:ere¦ieni:enire,enere¦esci:uscire¦uoi:otere¦1ci:urre¦1i:uare,pare,lare,dare,mare,vare,bare,fare,arre,apere,avere¦1ni:orre",
        "both": "5:sorbire,vestire,isalire,fuggire,bollire,sparire¦5etti:etrasmettere¦5sci:ientire,mentire,ristire,asprire,rostire,lestire¦5ci:terdire¦4i:leviare,avviare¦4sci:ltrire,ustire,etrire,astire,ermire,arrire,iarire,ortire,antire,olcire¦4ci:ledire¦3i:rviare,esiare¦3ci:sdire,ddire¦3sci:grire,ltire,ncire,agire,etire,gnire,ocire,urire,rnire,emire,orire,rcire,atire,unire,inire,ttire,erire,anire,utire,onire¦2uchi:anicare¦2sci:eire,oire,pire,zire,hire,sire,fire,bire,uire,dire,lire¦1i:eare,sare,zare,tare,rare,nare¦1hi:gare,care",
        "rev": "1enire:vieni¦1enere:tieni¦1are:ii¦1uscire:iesci¦2are:oli,tui,ami,uli,rmi,avi,eli,ipi,epi,nui,rli,lmi,ibi,afi,api,ubi,lpi,smi,cui,ofi,ddi,spi,dui,obi,upi,ldi,tmi,ifi,abi,ufi,cli,uvi¦2ere:rgi,ngi,lgi,lvi¦2re:gisci,tisci,nisci,dai,tai,fai¦2rre:rai¦2pere:sai¦2vere:iai¦3are:gli,alli,cci,ampi,appi,elli,ordi,obbi,fidi,tivi,uppi,levi,nimi,nidi,noi,simi,mbli,illi,sodi,ardi,effi,uffi,didi,iodi,audi,andi,rovi,cimi,gedi,agi,tumi,ulli,izi,pili,egi,urbi,bbli,ogi,erbi,irpi,lci,arbi,uidi,tali,modi,urvi,ugi,ammi,uai,timi,pidi,nomi,tili,ozi,squi,dali,fili,nali,bui,gali,novi,nvi,cqui,gomi,livi,azi,cali,cemi,hedi,ippi,fumi,temi,iffi,ommi,pali,pumi,limi,urpi,dovi,gili,goi,covi¦3rre:bduci,eponi,mponi,nduci,educi,iponi,sponi,rponi,oduci,oponi,aduci¦3ere:cedi,endi,iggi,ludi,iedi,peti,cadi,rigi,iudi,cuti,erdi,vali,sigi,rudi,rimi,vadi,undi,iaci,digi,cevi,uovi,vedi,lodi,uoci¦3re:arisci,idici¦4are:bbai,bondi,colli,degui,ibbi,folli,anci,eggi,lungi,mali,morbi,nnodi,ioppi,prodi,rredi,rrivi,sedi,imili,soci,fici,emmi,lindi,rindi,ruci,unni,baci,medi,servi,olidi,empli,rari,rolli,enudi,legui,iredi,eredi,figi,mendi,unci,sili,oggi,ucili,loppi,ubili,ipri,aggi,furi,roppi,tari,arci,equi,iombi,bombi,tombi,pudi,iaffi,irci,ambi,cuoi,foci,gridi,ibili,oqui,toppi,tudi,icidi,vari,ionfi,ucidi,engi,nici,idimi,erivi,erci,unzi,gradi,tradi¦4ere:bradi,corri,crivi,torci,vinci,ncidi,nosci,metti,nvivi,pondi,rompi,resci,ecidi,eridi,suadi,ruggi,ividi,pandi,tolli,mbevi,sisti,rridi,gligi,ccidi,rmani,iligi,nasci,edimi,cindi,ssumi,credi,imani,mordi,ivivi,cerni,fotti,combi,premi,tridi¦4rre:upponi¦4re:apri,empi¦5ere:bbatti,cogli,nnetti,nedici,ollidi,orrodi,linqui,iogli,togli,tingui,nfondi,scondi,cegli,resumi,opelli,epelli,ibatti,ileggi¦5are:casci,coppi,losci,ghindi,basci,nisti,naffi,ropri,rabbi,otondi,rcondi,minci,ncili,onsumi,ilani,sangui,tanzi,ncomi,patri,econdi,nanzi,ocopi,ulebbi,nceppi,nebri,nsidi,tarsi,validi,nvidi,rradi,cenzi,arodi,tenzi,corci,iesumi,ifondi,pingui,vesci,borni,rosci,fasci,gonfi,torpi,trani,aligi,lasci,rebbi,parmi,doppi,renzi,omici¦5re:ssali,verti,segui,copri,iatti¦5rre:rapponi",
        "ex": "3:agiare,oliare,oziare¦4:ambiare,aprire,baciare,bigiare,cariare,coniare,copiare,cucire,empire,mediare,obliare,ovviare,pigiare,tediare,variare,vociare¦5:fuggire,mentire,partire,sentire,vestire,pentire,nutrire,ampliare,cangiare,cogliere,conciare,coprire,doppiare,dormire,fasciare,forgiare,gloriare,gonfiare,lasciare,linciare,lisciare,mangiare,offrire,pazziare,pisciare,sdraiare,seguire,seppiare,servire,smaniare,soffiare,togliere,traviare,umiliare,compiere¦6:assalire,aborrire,bacchiare,fischiare,graffiare,languire,macchiare,mischiare,nicchiare,raschiare,ricopiare,ricucire,rischiare,sgusciare,soffrire,succhiare¦7:dipartire,ripartire,abbreviare,acconciare,adocchiare,angustiare,annebbiare,archiviare,assentire,crocchiare,divorziare,incrociare,ingabbiare,ingiuriare,orecchiare,rimangiare,risentire,sfiduciare,specchiare,strisciare,strusciare,sussidiare,svecchiare,insabbiare¦8:appiattire,abbacchiare,accerchiare,ammucchiare,arrischiare,avvinghiare,bevicchiare,bofonchiare,consentire,dissentire,evidenziare,insudiciare,invecchiare,invischiare,presenziare,principiare,riapparire,rimorchiare,rosicchiare,scomparire,soverchiare,stipendiare,strabiliare¦9:accalappiare,canticchiare,cincischiare,dormicchiare,infradiciare,mordicchiare,punzecchiare,rannicchiare,rispecchiare,scoperchiare,sonnecchiare,sparecchiare,sputacchiare,testimoniare¦10:acconsentire,apparecchiare,bruciacchiare,infinocchiare,mangiucchiare¦11:scarabocchiare¦hai:avere¦odi:udire¦esci:uscire¦sei:essere¦vai:andare¦3sci:agire,unire¦6i:allungare,affondare,arraffare,depredare,effondere,espellere,lacrimare,ravvivare,eccellere¦4i:avviare,deviare,espiare,inviare,ridare,roncare,rifare,battere,bendare,bollare,cernere,cherere,correre,credere,cremare,educere,elidere,eredare,erodere,esalare,fervere,follare,fondare,fottere,fremere,frodare,gabbare,giovare,gradare,gridare,guadare,leggere,mescere,mettere,mietere,mollare,mondare,mordere,nascere,pascere,poppare,predare,premere,privare,reggere,rombare,rompere,ronfare,salvare,scopare,snodare,sondare,tessere,torcere,tremare,vertere,vincere,piovere,pompare,siglare¦2vi:bere¦2i:dare,fare,alare,amare,sapere¦2ci:dire¦5sci:gestire,guarire,muggire,ruggire,sparire¦7sci:impartire,intontire¦4ci:indire,ridire,addurre¦4sci:lenire¦1uori:morire¦5ci:predire¦5i:ristare,assidere,avvivare,chierere,desumere,eleggere,flettere,inondare,ossidare,riardere,riducere,sbattere,schivare,sfondare,trombare,spegnere¦3i:sciare,spiare,stare,sviare,ardere,badare,cadere,calare,cedere,cimare,covare,domare,dopare,ducere,fidare,filare,fumare,gemere,godere,ledere,levare,licere,limare,lodare,mimare,mudare,ondare,palare,radere,redare,remare,ridere,rodare,salare,sedare,sudare,sumere,temere,valere,vivere,tacere¦1uoli:solere¦6sci:spartire¦1uoi:volere,potere¦8i:sopraffare,sottostare,intorbidare,sprofondare,trasfondere¦9i:affaccendare,sopravvivere¦4ni:apporre,opporre¦7i:combattere,correggere,diffondere,profondere,proteggere,rieleggere,riflettere,sorreggere¦10i:controbattere¦9ni:giustapporre¦2ni:porre¦1ieni:tenere,venire"
      },
      "third": {
        "fwd": "1:apere¦iene:enire,enere¦esce:uscire¦à:avere¦1ce:urre¦1e:vire¦2e:ucire¦3e:nguire,mpire",
        "both": "5à:praffare¦5sce:ientire,mentire,bustire,asprire,rugnire,sortire,lestire,bortire¦5ce:terdire¦5e:ipartire¦4à:tostare¦4e:bollire,isalire,fuggire,sorbire,vestire,ssalire,borrire¦4sce:ltrire,ontire,ignire,etrire,uarire,ermire,arrire,iarire,antire,olcire¦4ce:ledire¦3e:utrire,eguire,ormire,ertire,parire,entire¦3ce:sdire,ddire¦3sce:ltire,ncire,atire,agire,etire,ocire,grire,rnire,emire,orire,rcire,urire,unire,inire,ttire,erire,anire,utire,onire¦2e:frire,prire¦2uca:anicare¦2sce:eire,oire,pire,zire,hire,sire,fire,bire,uire,dire,lire¦1e:arre¦1ne:orre¦uole:olere¦uò:otere¦:re",
        "rev": "orire:uore¦1enire:viene¦1re:isce¦1enere:tiene¦1uscire:iesce¦1are:dà,tà,fà¦1mettere:sette¦3rre:bduce,nduce,educe,oduce,aduce¦3re:ndice¦3ire:arte,este¦4ire:angue,icuce,serve,iatte¦4re:empie",
        "ex": "2:sapere¦4:risapere¦ha:avere¦ode:udire¦esce:uscire¦è:essere¦va:andare¦3sce:agire,unire¦7sce:arrostire,imbastire,impartire¦2ve:bere¦4e:bollire,fuggire,partire,vestire,empire,servire¦1à:dare¦2ce:dire¦5sce:gestire,muggire,ruggire,sortire,sparire¦4ce:indire,ridire,addurre¦8sce:intristire¦4sce:lenire¦1uore:morire¦5ce:predire¦3à:ridare,rifare¦4à:ristare¦3e:salire,cucire¦6sce:spartire¦8ette:teletrasmettere¦7e:appiattire¦1iene:tenere,venire¦2à:riavere"
      },
      "firstPlural": {
        "fwd": "iamo:ere¦1iamo:nare,lare,fare,tare,dare,pare,rare,bare,uare,mare,vare,arre,arere¦1amo:ire,iere¦1niamo:orre¦1ciamo:urre¦1ssiamo:otere¦1gliamo:olere¦1bbiamo:avere¦2mo:iare¦2ciamo:acere¦2piamo:apere",
        "both": "5ettiamo:etrasmettere¦5ciamo:terdire¦5iamo:llungare¦4ciamo:ledire¦3ciamo:sdire,ddire¦1iamo:eare,sare,zare¦1hiamo:gare,care",
        "rev": "2are:iniamo,lliamo,oliamo,itiamo,uriamo,ntiamo,amiamo,gniamo,uliamo,triamo,oriamo,briamo,nniamo,iriamo,aviamo,eliamo,otiamo,rmiamo,ltiamo,rliamo,lmiamo,ptiamo,criamo,ipiamo,afiamo,lpiamo,smiamo,ofiamo,ddiamo,duiamo,obiamo,driamo,vriamo,ldiamo,tmiamo,ifiamo,abiamo,ufiamo,cliamo,uviamo¦2ere:rgiamo,lgiamo,lviamo¦2rre:poniamo,raiamo¦2vere:iabbiamo¦3are:doniamo,uffiamo,toniamo,ampiamo,astiamo,hetiamo,iatiamo,ietiamo,ioniamo,teriamo,erriamo,fidiamo,filiamo,tiviamo,meriamo,uppiamo,iutiamo,beriamo,ieniamo,leniamo,leviamo,taniamo,luniamo,mariamo,metiamo,putiamo,nimiamo,nidiamo,ianiamo,ortiamo,simiamo,ostiamo,mbliamo,iepiamo,sodiamo,ommiamo,enuiamo,ardiamo,effiamo,loniamo,uttiamo,didiamo,iodiamo,ifriamo,mutiamo,piliamo,mpriamo,roviamo,cimiamo,futiamo,deriamo,nstiamo,roniamo,repiamo,urviamo,nudiamo,rubiamo,meniamo,paniamo,urbiamo,reniamo,erbiamo,irpiamo,acuiamo,irtiamo,tumiamo,arbiamo,uatiamo,uidiamo,ratiamo,urriamo,taliamo,paliamo,soniamo,tuniamo,naliamo,modiamo,espiamo,cubiamo,ammiamo,noviamo,ceniamo,egriamo,timiamo,ceriamo,letiamo,nomiamo,utuiamo,geniamo,goniamo,squiamo,daliamo,etuiamo,faniamo,duniamo,aspiamo,galiamo,cariamo,saniamo,cquiamo,uoniamo,foniamo,lutiamo,gomiamo,liviamo,caliamo,capiamo,cemiamo,hediamo,ippiamo,ganiamo,fumiamo,temiamo,iffiamo,nodiamo,pumiamo,upriamo,limiamo,tubiamo,rupiamo,butiamo,urpiamo,doviamo,giliamo,fatiamo¦3rre:bduciamo,dduciamo,nduciamo,educiamo,oduciamo,aduciamo¦3ere:endiamo,orriamo,esciamo,iggiamo,cediamo,teniamo,ingiamo,iediamo,ludiamo,petiamo,cadiamo,nquiamo,rimiamo,rigiamo,iudiamo,cutiamo,valiamo,sigiamo,beviamo,vadiamo,undiamo,digiamo,ceviamo,uoviamo,vediamo,lodiamo¦3re:luiamo,buiamo,ruiamo,ioiamo,ndiciamo,veiamo,idiciamo,lfiamo,ifacciamo¦4re:gliamo,runiamo,caniamo,uisiamo,hiliamo,nnuiamo,rguiamo,tutiamo,veniamo,vviamo,aciamo,lciamo,arpiamo,rcuiamo,patiamo,cepiamo,feriamo,todiamo,iziamo,ogiamo,sibiamo,uariamo,ialiamo,spriamo,ugiamo,tidiamo,losiamo,nibiamo,vosiamo,midiamo,nviamo,gidiamo,bediamo,rediciamo,egiamo,apriamo,badiamo,empiamo,vaniamo,pediamo,aziamo,iadiamo,uoiamo,tupiamo,ppliamo,eltiamo,eagiamo,ragiamo,oziamo,affacciamo,utriamo¦4ere:battiamo,bradiamo,rangiamo,iungiamo,mettiamo,criviamo,ssumiamo,vinciamo,langiamo,nosciamo,iangiamo,torciamo,nviviamo,pondiamo,rompiamo,ecidiamo,fungiamo,eridiamo,sistiamo,iligiamo,cerniamo,perdiamo,suadiamo,ruggiamo,pandiamo,pungiamo,trudiamo,ncidiamo,gligiamo,ccidiamo,rmaniamo,nasciamo,edimiamo,cindiamo,crediamo,imaniamo,mordiamo,isappiamo,iviviamo,fottiamo,combiamo,piacciamo¦4are:everiamo,bondiamo,bituiamo,eleriamo,certiamo,iappiamo,omuniamo,cordiamo,dattiamo,dobbiamo,deguiamo,operiamo,dorniamo,fettiamo,hindiamo,lattiamo,lertiamo,terniamo,morbiamo,ioppiamo,prodiamo,rrediamo,rriviamo,sestiamo,imiliamo,gettiamo,testiamo,vistiamo,zzeriamo,bettiamo,lindiamo,cottiamo,rindiamo,uettiamo,mandiamo,mendiamo,cretiamo,ngediamo,uistiamo,serviamo,olidiamo,nsumiamo,tattiamo,empliamo,rattiamo,prediamo,giuniamo,leguiamo,irediamo,dettiamo,sertiamo,ibbliamo,ettuiamo,migriamo,ipariamo,ageriamo,oneriamo,lottiamo,torniamo,rettiamo,rustiamo,nestiamo,loppiamo,ubiliamo,verniamo,berniamo,hettiamo,pattiamo,mperiamo,restiamo,carniamo,ateniamo,ceppiamo,festiamo,graniamo,roppiamo,aponiamo,sinuiamo,pretiamo,alidiamo,crimiamo,apidiamo,cheriamo,utiliamo,iombiamo,epariamo,uperiamo,uneriamo,cattiamo,destiamo,bombiamo,aettiamo,bandiamo,braniamo,cappiamo,cartiamo,iaffiamo,ciupiamo,iettiamo,crutiamo,gridiamo,ibiliamo,littiamo,mistiamo,lveriamo,uartiamo,tappiamo,rnutiamo,toppiamo,rappiamo,icidiamo,pestiamo,bordiamo,ionfiamo,rottiamo,egetiamo,idimiamo,iorniamo,eriviamo,cettiamo,ucidiamo,hattiamo,entuiamo,vettiamo,gradiamo,nigriamo,tradiamo¦5re:bbaiamo,reviamo,brutiamo,bortiamo,occiamo,ccudiamo,ibbiamo,anciamo,eggiamo,maliamo,mansiamo,mmoniamo,nneriamo,nnoiamo,unciamo,santiamo,oggiamo,icciamo,aggiamo,sseriamo,sociamo,variamo,vertiamo,emmiamo,landiamo,ruciamo,unniamo,mediamo,ncupiamo,efiniamo,glutiamo,eperiamo,tituiamo,igeriamo,figiamo,comiamo,sauriamo,serciamo,siliamo,iusciamo,hermiamo,rugniamo,uarniamo,bastiamo,mbibiamo,zarriamo,pauriamo,etosiamo,pigriamo,ziosiamo,acidiamo,anutiamo,niciamo,eboliamo,farciamo,erociamo,ddoliamo,ngeriamo,gantiamo,randiamo,gogliamo,sediamo,arsiamo,tontiamo,rpidiamo,tariamo,rretiamo,bustiamo,isciamo,ficiamo,equiamo,rtoriamo,attuiamo,lagiamo,grediamo,seguiamo,bbuiamo,rinziamo,censiamo,nseriamo,sorbiamo,copriamo,fuggiamo,bambiamo,igoriamo,pudiamo,sarciamo,iveriamo,lordiamo,irciamo,ucciamo,candiamo,ecciamo,draiamo,fociamo,magriamo,marriamo,bolliamo,pperiamo,tatuiamo,tordiamo,tudiamo,vestiamo,asaliamo,spariamo,bbidiamo,engiamo,rantiamo,ngoiamo,miciamo,unziamo,orviamo,iattiamo¦5are:bbittiamo,aparriamo,ffittiamo,giustiamo,llappiamo,llettiamo,oderniamo,ppartiamo,rraffiamo,otondiamo,econdiamo,rbottiamo,chieriamo,rcondiamo,llaudiamo,nstatiamo,ntinuiamo,ilettiamo,serediamo,isperiamo,asperiamo,luttuiamo,ulebbiamo,ppettiamo,nforniamo,giferiamo,olestiamo,rnottiamo,roettiamo,egustiamo,occupiamo,esettiamo,iesumiamo,pinguiamo,ntombiamo,elleriamo,miottiamo,repidiamo,mpettiamo¦5ere:cogliamo,scondiamo,nediciamo,nfondiamo,nnettiamo,tinguiamo,orrodiamo,iogliamo,togliamo,spelliamo,stolliamo,ntridiamo,cegliamo,resumiamo,flettiamo,ileggiamo,dividiamo",
        "ex": "siamo:essere¦1bbiamo:avere¦2viamo:bere¦1iamo:dare¦2ciamo:dire¦4ciamo:indire,ridire,piacere,giacere¦5ciamo:predire¦4iamo:roncare,attuare,battere,bendare,bordare,cernere,cherere,credere,cremare,destare,dettare,distare,educere,elidere,emanare,eredare,erodere,esalare,fervere,fondare,fottere,fremere,frodare,fungere,gabbare,gettare,giovare,gradare,gridare,guadare,gustare,lattare,laudare,leggere,listare,lordare,lottare,mandare,mattare,mestare,mettere,mietere,migrare,mondare,mordere,mungere,narrare,nascere,nettare,operare,pappare,pascere,perdere,pestare,pittare,planare,poppare,predare,premere,privare,prudere,pungere,reggere,restare,ristare,rombare,rompere,ronfare,salvare,scopare,situare,sondare,sparare,sperare,stilare,svenare,tangere,tappare,tessere,torcere,tornare,tremare,vernare,vertere,vincere,vistare,zappare,cuocere,testare,piovere,pompare,scovare,tatuare,settare,siglare¦2cciamo:fare¦1ociamo:nuocere¦4cciamo:rifare¦8cciamo:sopraffare¦9mo:abbacchiare,abbracciare,accerchiare,afflosciare,ammucchiare,appropriare,arrischiare,avvinghiare,bevicchiare,bofonchiare,contrariare,distanziare,espropriare,evidenziare,fotocopiare,imbracciare,insudiciare,invecchiare,invischiare,presenziare,principiare,raccoppiare,raccorciare,rimorchiare,rosicchiare,schiacciare,sculacciare,soverchiare,stipendiare,strabiliare,tralasciare,risparmiare,raddoppiare,commerciare¦7amo:abbellire,addolcire,allestire,ammattire,ammollire,ammuffire,appassire,assentire,assortire,avvizzire,diminuire,dipartire,imbellire,imbottire,impartire,inaridire,infittire,ingobbire,insignire,ispessire,premunire,presagire,rabbonire,rifiorire,rifornire,ripartire,risentire,scaturire,schernire,schiarire,scipidire,stabilire,suggerire¦10mo:abbonacciare,accalappiare,agghiacciare,canticchiare,cincischiare,dormicchiare,incominciare,infradiciare,mordicchiare,punzecchiare,rannicchiare,riallacciare,ricominciare,riconciliare,rispecchiare,scoperchiare,sonnecchiare,sparecchiare,sproloquiare,sputacchiare,testimoniare,rintracciare,cofinanziare¦5iamo:abbonare,adoprare,adottare,apparare,arridere,assidere,avverare,avvivare,chierere,derapare,desumere,dividere,eleggere,flettere,fucilare,generare,goffrare,imparare,inondare,irridere,limonare,occupare,ossidare,riardere,riducere,sbarrare,sborrare,sbottare,schivare,sfondare,sfornare,sgobbare,snobbare,spettare,spremere,stridere,trombare,venerare,spegnere,dilatare¦10amo:abbrustolire,acconsentire,approfondire,impensierire,impratichire,indispettire,insospettire,interloquire,prestabilire,rabbrividire¦5amo:abolire,aderire,bandire,candire,cogliere,colpire,condire,coprire,dormire,erudire,farcire,fiorire,fornire,frinire,fuggire,garrire,gestire,gremire,intuire,lambire,mentire,muggire,offrire,partire,riunire,ruggire,sancire,seguire,sentire,servire,sfinire,sorbire,sortire,togliere,tossire,tradire,vestire,compiere,pentire,zittire¦6amo:aborrire,assalire,avvilire,chiarire,demolire,esaudire,esordire,esperire,favorire,languire,poltrire,proibire,ricucire,rifinire,risalire,sfoltire,smentire,soffrire,spartire,stizzire,ripulire,snellire,sminuire¦8iamo:accapponare,ammanettare,commiserare,dissanguare,intorbidare,prospettare,rattristare,rischiarare,sprofondare,trasfondere¦8mo:accasciare,acconciare,accoppiare,accorciare,adocchiare,affacciare,allacciare,ambasciare,amnistiare,angustiare,annaffiare,annebbiare,archiviare,arrabbiare,cominciare,conciliare,contagiare,crocchiare,divorziare,espatriare,estraniare,finanziare,ghiacciare,impacciare,incipriare,incrociare,ingabbiare,ingiuriare,licenziare,minacciare,orecchiare,potenziare,ricacciare,ricambiare,rilasciare,rimangiare,rovesciare,scrosciare,setacciare,sfiduciare,specchiare,squarciare,stracciare,strusciare,sussidiare,svaligiare,svecchiare,innaffiare,insabbiare¦3amo:adire,udire,unire¦9iamo:affaccendare,approfittare,rimproverare,sopravvivere¦9amo:affievolire,alleggerire,ammorbidire,arrugginire,impallidire,imputridire,incollerire,incuriosire,infiacchire,ingentilire,inghiottire,intiepidire,intirizzire,ristabilire,spazientire¦6iamo:affondare,aspettare,assordare,collidere,comparare,effondere,esilarare,infatuare,ravvivare,repellere,rifondare,rimestare,sorridere,tollerare,ventilare,eccellere¦4mo:agiare,oliare,oziare,sciare,spiare,sviare,odiare¦2iamo:alare,amare,arare,orare,parere,stare¦5mo:ambiare,bigiare,cariare,coniare,copiare,desiare,deviare,espiare,mediare,obliare,pigiare,tediare,variare,vociare¦6mo:ampliare,berciare,cacciare,cambiare,cangiare,conciare,doppiare,fasciare,forgiare,gloriare,gonfiare,lasciare,linciare,mangiare,marciare,pazziare,seppiare,smaniare,soffiare,traviare,umiliare¦7iamo:annoverare,correggere,degenerare,dichiarare,diffondere,profondere,propellere,prosperare,proteggere,rieleggere,rigenerare,rispettare,sorreggere,sospettare,formattare¦11mo:apparecchiare,bruciacchiare,infinocchiare,interfacciare,mangiucchiare,riabbracciare,rincominciare,differenziare¦8amo:applaudire,arricchire,attecchire,consentire,dissentire,imbiondire,imbruttire,impietrire,impoverire,incenerire,ingiallire,inorridire,insaporire,intenerire,intimorire,intristire,rammollire,riapparire,rinverdire,scomparire,seppellire,sgranchire¦4amo:aprire,aulire,capire,cucire,empire,ferire,finire,lenire,morire,munire,ordire,perire,pulire,punire,rapire,sopire,subire,uscire,vagire,patire¦3iamo:ardere,badare,barare,cadere,calare,cedere,cenare,cerare,cibare,cimare,covare,domare,donare,dopare,ducere,errare,fidare,filare,fumare,gemere,godere,ledere,levare,libare,licere,limare,lodare,menare,mimare,mudare,mutare,natare,ondare,ornare,ostare,palare,parare,penare,radere,redare,remare,ridare,rodare,rubare,salare,sanare,sedare,sudare,sumere,tarare,temere,tenere,ungere,urtare,valere,venare,vivere,andare,datare,pepare¦7mo:bacchiare,dilaniare,fischiare,graffiare,inebriare,infuriare,inguaiare,insidiare,invidiare,irradiare,macchiare,mischiare,nicchiare,parodiare,raschiare,ricopiare,rischiare,sborniare,scacciare,scambiare,scoppiare,scorciare,sfasciare,sgonfiare,sgusciare,slacciare,spacciare,stacciare,storpiare,straniare,succhiare,tracciare,trebbiare,stanziare¦13mo:contraccambiare¦11amo:disseppellire,rimpicciolire,rincoglionire¦2niamo:porre¦2ssiamo:potere¦3piamo:sapere¦2gliamo:solere,volere¦3ciamo:tacere¦12mo:scarabocchiare"
      },
      "secondPlural": {
        "fwd": "1cete:urre¦2te:piere",
        "both": "5ettete:etrasmettere¦1ete:arre¦1nete:orre¦te:re",
        "rev": "3rre:bducete,nducete,oducete,aducete¦4ere:ompite",
        "ex": "siete:essere¦2vete:bere¦1ocete:nuocere¦4cete:addurre,dedurre,sedurre"
      },
      "thirdPlural": {
        "fwd": "ono:ere¦lgono:gliere¦escono:uscire¦ngono:gnere¦1cono:urre¦1iono:arere¦1nno:apere,avere¦1ono:vire¦2gono:enire,enere,alere,anere¦3ono:nguire,mpire",
        "both": "5nno:tostare¦5ettono:etrasmettere¦5scono:ientire,mentire,bustire,asprire,rugnire,sortire,lestire,bortire¦5cono:terdire¦5ono:ipartire¦4ono:iattire,bollire,fuggire,sorbire,vestire,borrire¦4gono:isalire,ssalire¦4scono:ltrire,ontire,ignire,etrire,uarire,ermire,arrire,iarire,antire,olcire¦4cono:ledire¦3ono:utrire,ucire,eguire,ormire,ertire,entire¦3cono:sdire,ddire¦3scono:ltire,ncire,agire,etire,ocire,grire,rnire,emire,orire,rcire,urire,atire,unire,inire,ttire,erire,anire,utire,onire¦2ciono:acere¦2ono:frire,prire¦2ucano:anicare¦2scono:eire,hire,oire,pire,zire,sire,fire,bire,uire,dire,lire¦2iono:parire¦1gliono:olere¦1ssono:otere¦1ggono:arre¦1ngono:orre¦1no:are",
        "rev": "orire:uoiono¦1ere:dono,vono,nono,pono,cciono¦1re:iscono¦1uscire:iescono¦1gliere:elgono¦2rre:ducono¦2ere:rgono,umono,rcono,ncono,erono,etono,imono,quono,igono,utono,emono,mbono,ociono¦2gliere:iolgono,tolgono,colgono¦2re:danno,tanno,fanno¦2pere:sanno¦2vere:ianno¦3ire:vengono,artono,estono¦3ere:ungono,tengono,ingono,oscono,istono,eggono,iggono,valgono,ottono,ulgono,ascono,mangono,ellono,essono¦3re:ndicono,idicono¦4ere:battono,rescono,mettono,volgono,langono,iangono,nettono,corrono,inguono,rangono,ruggono,ompiono¦4re:redicono,empiono¦4ire:servono¦5ere:nedicono,stollono,flettono",
        "ex": "hanno:avere¦odono:udire¦escono:uscire¦sono:essere¦vanno:andare¦3scono:agire,unire¦7scono:arrostire,imbastire,impartire¦2vono:bere¦4ono:bollire,fuggire,partire,vestire,battere,correre,educere,empire,mescere,mettere,servire,tangere,vertere,volgere¦2nno:dare,fare,sapere¦2cono:dire¦5scono:gestire,muggire,ruggire,sortire,sparire¦4cono:indire,ridire¦8scono:intristire¦4scono:lenire¦1uoiono:morire¦5cono:predire¦4nno:ridare,rifare¦5nno:ristare¦3gono:salire,tenere,valere,venire¦6scono:spartire¦3nno:stare¦4iono:cuocere¦4ciono:nuocere¦8nno:sopraffare¦3ono:algere,ducere,licere,ungere¦2lgono:cogliere,togliere¦5ono:flettere,languire,riducere¦2iono:parere¦3iono:sparere¦3ngono:spegnere"
      }
    },
    "pastTense": {
      "first": {
        "fwd": "lsi:gliere¦si:rere,guere¦ssi:ggere¦isi:ettere¦essi:imere,igere¦nsi:gnere¦1ssi:urre,ivere,ucere,utere,indere¦1si:rgere,ngere,lvere,ncere,lgere,idere,udere,odere,rcere,lcere,undere,rdere,anere¦1nsi:umere¦1cqui:ascere¦2ni:enere¦2qui:acere¦2si:pondere,ollere¦2ssi:lettere¦3si:cellere",
        "both": "5isi:etrasmettere¦5eci:praffare,traffare¦5ssi:terdire¦4eci:trafare¦4etti:tostare¦4si:spandere¦4vi:sparire,mparire,pparire¦3si:scondere,vellere¦3di:cadere¦3ni:venire¦3ssi:ddire¦2ssi:cedere¦2eci:efare,sfare¦2si:vadere,alere,uadere,iedere,radere¦1assi:digere¦1ulsi:pellere¦1usi:fondere¦1bbi:oscere,escere¦1ssi:arre¦1si:orre,endere¦eppi:apere¦ocqui:uocere¦uppi:ompere¦i:re",
        "rev": "ere:di,li¦are:eci,etti¦1ettere:misi¦1imere:densi¦2rre:dussi¦2gere:ersi¦2dere:lusi,risi,cisi,lisi,rosi,rusi,iusi,visi¦2mere:sunsi¦2rere:hesi¦2imere:pressi¦2vere:vissi,rissi¦2ggere:fissi,russi,lissi,tessi¦2igere:iressi,glessi¦2gliere:iolsi,colsi¦2tere:cussi¦2re:dissi¦2ndere:tusi,cissi¦2nere:masi¦2scere:nacqui¦2gnere:pensi¦3rere:corsi¦3gere:iunsi,sursi,rinsi,volsi,punsi,parsi,ransi,cinsi,sorsi,iansi,pinsi,fulsi¦3dere:ssisi,morsi¦3cere:torsi,vinsi,idussi¦3ere:iacqui,tenni¦3gliere:scelsi¦3ggere:frissi,rressi¦4vere:ssolsi,isolsi¦4guere:stinsi¦4gere:efunsi,ndulsi¦4gliere:istolsi¦4lere:ccelsi¦4igere:edilessi¦4ggere:ielessi¦4ere:ttacqui¦5ndere:risposi",
        "ex": "ebbi:avere¦fui:essere¦3di:cadere¦2ssi:dire,ducere,figgere,leggere,reggere,vivere¦3si:dolere,cingere,correre,fingere,fulgere,fungere,mingere,molcere,mordere,mungere,porgere,pungere,solvere,sorgere,tingere,torcere,vincere,volgere¦1eci:fare¦1usi:fondere¦4ssi:indire,ridire,rileggere¦2si:ledere,radere,ardere,ergere,ridere,rodere,ungere¦5ssi:predire¦3ensi:redimere¦3eci:rifare¦4etti:ristare¦2eci:sfare¦2etti:stare¦3ni:venire¦3li:volere¦5si:attingere,estollere,intingere,rispondere¦2lsi:cogliere,togliere¦3essi:diligere¦3ssi:educere,eleggere,flettere,friggere¦2essi:erigere¦1isi:mettere¦2cqui:nascere¦4si:riardere,scorgere,sporgere,stingere¦3lsi:scegliere¦2nsi:sumere¦3qui:tacere"
      },
      "second": {
        "fwd": "1cesti:urre",
        "both": "5cesti:trafare,terdire¦4esti:tostare¦3cesti:efare,sfare,ddire¦1esti:arre¦1nesti:orre¦sti:re",
        "rev": "1re:icesti¦1mettere:settesti¦2re:facesti¦2are:stesti¦3rre:bducesti,nducesti,oducesti,aducesti",
        "ex": "fosti:essere¦9cesti:contraffare¦2cesti:dire,fare¦4cesti:indire,ridire,rifare,addurre,dedurre,sedurre¦5cesti:predire¦4esti:ristare¦3cesti:sfare¦8cesti:sopraffare¦2esti:stare¦8ettesti:teletrasmettere"
      },
      "third": {
        "fwd": "lse:gliere¦se:rere,guere¦sse:ggere¦ise:ettere¦esse:imere,igere¦nse:gnere¦1sse:urre,ivere,ucere,utere,indere¦1se:rgere,ngere,lvere,ncere,lgere,idere,udere,odere,rcere,lcere,undere,rdere,anere¦1nse:umere¦1cque:ascere¦2ne:enere¦2que:acere¦2se:pondere,ollere¦2sse:lettere¦3se:cellere",
        "both": "5ise:etrasmettere¦5ece:praffare,traffare¦5sse:terdire¦4ece:trafare¦4ette:tostare¦4se:spandere¦4ve:sparire,mparire,pparire¦3se:scondere,vellere¦3de:cadere¦3ne:venire¦3sse:ddire¦2sse:cedere¦2ece:efare,sfare¦2se:vadere,alere,uadere,iedere,radere¦1asse:digere¦1ulse:pellere¦1use:fondere¦1bbe:oscere,escere¦1sse:arre¦1se:orre,endere¦eppe:apere¦ocque:uocere¦uppe:ompere¦ì:ire¦ò:are",
        "rev": "ere:de,é,le¦are:ece¦1ettere:mise¦1imere:dense¦1are:tette¦2rre:dusse¦2gere:erse¦2dere:luse,rise,cise,lise,rose,ruse,iuse,vise¦2mere:sunse¦2rere:hese¦2imere:presse¦2vere:visse,risse¦2ggere:fisse,russe,lisse,tesse¦2igere:iresse,glesse¦2gliere:iolse,colse¦2tere:cusse¦2re:disse,lette¦2ndere:tuse,cisse¦2nere:mase¦2scere:nacque¦2gnere:pense¦3rere:corse¦3gere:iunse,surse,rinse,volse,punse,parse,ranse,cinse,sorse,ianse,pinse,fulse¦3dere:ssise,morse¦3cere:torse,vinse,idusse¦3ere:iacque,tenne¦3gliere:scelse¦3ggere:frisse,rresse¦4vere:ssolse,isolse¦4guere:stinse¦4gere:efunse,ndulse¦4gliere:istolse¦4lere:ccelse¦4igere:edilesse¦4ggere:ielesse¦4ere:ttacque¦5ndere:rispose",
        "ex": "ebbe:avere¦fu:essere¦3de:cadere¦2sse:dire,ducere,figgere,leggere,reggere,vivere¦3se:dolere,cingere,correre,fingere,fulgere,fungere,mingere,molcere,mordere,mungere,porgere,pungere,solvere,sorgere,tingere,torcere,vincere,volgere¦1ece:fare¦1use:fondere¦4sse:indire,ridire,rileggere¦2se:ledere,radere,ardere,ergere,ridere,rodere,ungere¦5sse:predire¦3ense:redimere¦3ece:rifare¦4ette:ristare¦2ece:sfare¦4tte:solere¦5é:spandere¦2ette:stare¦3ne:venire¦3le:volere¦5se:attingere,estollere,intingere,rispondere¦2lse:cogliere,togliere¦3esse:diligere¦3sse:educere,eleggere,flettere,friggere¦2esse:erigere¦1ise:mettere¦2cque:nascere¦4se:riardere,scorgere,sporgere,stingere¦3lse:scegliere¦2nse:sumere¦3que:tacere"
      },
      "firstPlural": {
        "fwd": "1cemmo:urre",
        "both": "5cemmo:trafare,terdire¦4emmo:tostare¦3cemmo:efare,sfare,ddire¦1emmo:arre¦1nemmo:orre¦mmo:re",
        "rev": "1re:icemmo¦1mettere:settemmo¦2re:facemmo¦2are:stemmo¦3rre:bducemmo,nducemmo,oducemmo,aducemmo",
        "ex": "fummo:essere¦9cemmo:contraffare¦2cemmo:dire,fare¦4cemmo:indire,ridire,rifare,addurre,dedurre,sedurre¦5cemmo:predire¦4emmo:ristare¦3cemmo:sfare¦8cemmo:sopraffare¦2emmo:stare¦8ettemmo:teletrasmettere"
      },
      "secondPlural": {
        "fwd": "1ceste:urre",
        "both": "5ceste:trafare,terdire¦4este:tostare¦3ceste:efare,sfare,ddire¦1este:arre¦1neste:orre¦ste:re",
        "rev": "1re:iceste¦1mettere:setteste¦2re:faceste¦2are:steste¦3rre:bduceste,nduceste,oduceste,aduceste",
        "ex": "foste:essere¦9ceste:contraffare¦2ceste:dire,fare¦4ceste:indire,ridire,rifare,addurre,dedurre,sedurre¦5ceste:predire¦4este:ristare¦3ceste:sfare¦8ceste:sopraffare¦2este:stare¦8etteste:teletrasmettere"
      },
      "thirdPlural": {
        "fwd": "lsero:gliere¦sero:rere,guere¦ssero:ggere¦isero:ettere¦essero:imere,igere¦nsero:gnere¦1ssero:urre,ivere,ucere,utere,indere¦1sero:rgere,ngere,lvere,ncere,lgere,idere,udere,odere,rcere,lcere,undere,rdere,anere¦1nsero:umere¦1cquero:ascere¦2nero:enere¦2quero:acere¦2sero:pondere,ollere,andere¦2ssero:lettere¦3sero:cellere",
        "both": "5isero:etrasmettere¦5ecero:praffare,traffare¦5ssero:terdire¦4ecero:trafare¦4ettero:tostare¦4vero:sparire,mparire,pparire¦3sero:scondere,vellere¦3dero:cadere¦3nero:venire¦3ssero:ddire¦2ssero:cedere¦2ecero:efare,sfare¦2sero:vadere,alere,uadere,iedere,radere¦1assero:digere¦1ulsero:pellere¦1usero:fondere¦1bbero:oscere,escere¦1ssero:arre¦1sero:orre,endere¦eppero:apere¦ocquero:uocere¦uppero:ompere¦ono:e",
        "rev": "ere:dero,lero¦are:ecero,ettero¦1ettere:misero¦1imere:densero¦2rre:dussero¦2gere:ersero¦2dere:lusero,risero,cisero,lisero,rosero,rusero,iusero,visero¦2mere:sunsero¦2rere:hesero¦2imere:pressero¦2vere:vissero,rissero¦2ggere:fissero,russero,lissero,tessero¦2igere:iressero,glessero¦2gliere:iolsero,colsero¦2tere:cussero¦2re:dissero¦2ndere:tusero,cissero¦2nere:masero¦2scere:nacquero¦2gnere:pensero¦3rere:corsero¦3gere:iunsero,sursero,rinsero,volsero,punsero,parsero,ransero,cinsero,sorsero,iansero,pinsero,fulsero¦3dere:ssisero,pansero,morsero¦3cere:torsero,vinsero,idussero¦3ere:iacquero,tennero¦3gliere:scelsero¦3ggere:frissero,rressero¦4vere:ssolsero,isolsero¦4guere:stinsero¦4gere:efunsero,ndulsero¦4gliere:istolsero¦4lere:ccelsero¦4igere:edilessero¦4ggere:ielessero¦4ere:ttacquero¦5ndere:risposero",
        "ex": "ebbero:avere¦furono:essere¦3dero:cadere¦2ssero:dire,ducere,figgere,leggere,reggere,vivere¦3sero:dolere,cingere,correre,fingere,fulgere,fungere,mingere,molcere,mordere,mungere,porgere,pungere,solvere,sorgere,tingere,torcere,vincere,volgere¦1ecero:fare¦1usero:fondere¦4ssero:indire,ridire,rileggere¦2sero:ledere,radere,ardere,ergere,ridere,rodere,ungere¦5ssero:predire¦3ensero:redimere¦3ecero:rifare¦4ettero:ristare¦2ecero:sfare¦2ettero:stare¦3nero:venire¦3lero:volere¦5sero:attingere,estollere,intingere,rispondere¦2lsero:cogliere,togliere¦3essero:diligere¦3ssero:educere,eleggere,flettere,friggere¦2essero:erigere¦1isero:mettere¦2cquero:nascere¦4sero:riardere,scorgere,sporgere,stingere¦3lsero:scegliere¦2nsero:sumere¦3quero:tacere"
      }
    },
    "futureTense": {
      "first": {
        "fwd": "1erò:dare,ciare,vare,giare¦1rrò:enire,enere,olere,ucere,alere,anere¦2ò:rre¦2rò:piere,arere¦3ò:dere,gere,mere,uere,bere,sere¦4ò:ttere,liere,scere,stere,ncere,rnere,erere,acere,rcere,mpere,rrere,utere,llere,icere,gnere,rtere¦5ò:ervere,ietere",
        "both": "5etterò:etrasmettere¦5ò:cevere,bevere,petere,rivere¦5erò:llungare¦4ò:sfare,anire,gnire,rnire,inire,lvere,efare,onire,unire¦4rò:icadere¦4erò:grafare¦3erò:hifare¦3ò:vire,eire,gire,mire,pire,zire,hire,bire,uire,fire,sire,rire,cire,dire,tire,lire¦3rò:vivere¦2erò:ufare,nfare,uiare,ofare,siare,ziare,niare,miare,diare,riare,oiare,fiare,tiare,viare,biare,piare,liare,ffare,aiare,hiare¦2rò:apere,otere,overe¦1erò:bare,eare,mare,pare,uare,zare,tare,rare,sare,lare,nare¦1herò:gare,care",
        "rev": "1ere:vrò¦1are:ferò¦2iare:ccerò,ggerò,ocerò,ucerò,lcerò,agerò,egerò,ugerò¦2are:oderò,averò,ndrò,overò,rverò,dderò,lderò,cierò¦2nire:verrò¦2nere:terrò,marrò¦2e:arò,irò¦2ere:adrò,odrò¦2lere:varrò¦3are:orderò,fiderò,leverò,niderò,viverò,arderò,diderò,auderò,tiverò,gederò,nuderò,uiderò,biderò,piderò,liverò,hederò,hiverò¦3iare:ancerò,ficerò,figerò,logerò,uncerò,nicerò,iscerò,arcerò,ircerò,uscerò,engerò¦3e:orrò¦3cere:idurrò¦3ere:parrò¦4are:bonderò,hinderò,rrederò,rriverò,tonderò,linderò,manderò,oliderò,prederò,irederò,erederò,menderò,nonderò,aliderò,banderò,griderò,iciderò,uciderò¦4iare:cascerò,concerò,corcerò,loscerò,bascerò,mincerò,adicerò,udicerò,lascerò,mangerò,vescerò,roscerò,fascerò,aligerò¦4e:rgerò,lgerò,rarrò¦4ere:ompirò¦5e:bdurrò,cederò,ddurrò,iggerò,luderò,rogerò,ingerò,iederò,iuderò,iacerò,ndurrò,omperò,edurrò,nquerò,rigerò,cuterò,erderò,uggerò,viderò,sigerò,ruderò,odurrò,vaderò,olcerò,underò,digerò,caderò,tacerò,adurrò¦5are:econderò,rconderò,ifonderò¦5iare:ombacerò",
        "ex": "sarò:essere¦3rò:andare,cadere,godere,vivere,parere¦2rò:avere¦10ò:contraffare,compiangere,comprendere,congiungere,disgiungere,distinguere,distogliere,manomettere,prediligere,raccogliere,raggiungere,rapprendere,riaccendere,riappendere,riconoscere,rincrescere,risplendere,scommettere,sconnettere,scoscendere,soggiungere,sorprendere,stravincere,trascendere,trascorrere,trasfondere,trasmettere¦3ò:dare,dire,fare,gire¦5rò:decadere¦5ò:gioire,lenire,ridare,rifare,ardere,cedere,gemere,ledere,licere,radere,ridere,sumere,tacere,temere,ungere¦6ò:molcere,ristare,battere,cernere,cherere,correre,credere,elidere,erodere,fendere,fervere,fottere,fremere,fungere,leggere,mescere,mettere,mietere,mordere,mungere,nascere,pascere,pendere,premere,pungere,reggere,rendere,tangere,tendere,tessere,torcere,vendere,vertere,vincere¦4erò:roncare,bendare,berciare,cangiare,conciare,eredare,fasciare,fondare,forgiare,gradare,gridare,guadare,lasciare,linciare,mandare,mangiare,mondare,predare,privare,salvare,sondare¦3erò:sciare,tifare,baciare,badare,bigiare,fidare,levare,mudare,ondare,pigiare,redare,sedare,sudare¦4ò:sfare,stare,unire¦9ò:sopraffare,sottostare,accogliere,accrescere,affrangere,aggiungere,apprendere,benedicere,cognoscere,coincidere,combattere,commettere,comprimere,compungere,concernere,concorrere,confondere,connettere,consistere,contendere,contorcere,convincere,correggere,decrescere,diffondere,discendere,discernere,discorrere,dismettere,dissuadere,distendere,distorcere,estinguere,imprendere,infrangere,ingiungere,nascondere,percorrere,permettere,persistere,persuadere,portendere,precorrere,premettere,prenascere,pretendere,profondere,promettere,propellere,propendere,proteggere,protendere,rescindere,riassumere,ricogliere,ricrescere,rieleggere,riflettere,riprendere,rispondere,sciogliere,sconoscere,soccombere,soccorrere,sommettere,sopprimere,sorreggere,sospendere,sottendere,sussistere,tramettere¦7ò:strafare,abradere,arridere,assidere,assumere,chierere,clangere,cogliere,crescere,decidere,deridere,desumere,diligere,dirimere,eleggere,emettere,esistere,evincere,flettere,frangere,giungere,incidere,irridere,occidere,omettere,piangere,prendere,recidere,redimere,riardere,sbattere,scendere,scernere,scindere,scorrere,sfottere,smettere,spandere,spegnere,spendere,spremere,stendere,storcere,stridere,svellere,svendere,togliere,uccidere¦8ò:abbattere,accendere,accorrere,ammettere,annettere,appendere,ascendere,ascondere,assistere,attendere,attorcere,avvincere,collidere,conoscere,corrodere,decorrere,defungere,deprimere,desistere,difendere,dimettere,dipendere,divellere,eccellere,effondere,espandere,espellere,esprimere,espungere,estendere,estollere,estorcere,immettere,imprimere,incendere,incombere,incorrere,infondere,insistere,intendere,intridere,negligere,occorrere,offendere,opprimere,precidere,presumere,repellere,reprimere,resistere,ribattere,ricorrere,ricredere,rileggere,rimettere,rimordere,rinascere,ritorcere,rivendere,rivincere,scegliere,secernere,sorridere,splendere¦14ò:accondiscendere¦9erò:affaccendare¦6erò:affondare¦2erò:agiare¦5erò:brindare,ossidare,sfondare¦11ò:circoncidere,disattendere,disciogliere,disconoscere,fraintendere,intercorrere,intromettere,prescegliere,sottomettere¦12ò:compromettere,controbattere,corrispondere,disconnettere,intraprendere,ricongiungere,ritrasmettere,soprintendere,sottintendere,sovrintendere¦17ò:contraddistinguere¦2rrò:dolere,ducere,tenere,valere,venire,volere¦3rrò:educere¦13ò:sopraggiungere¦8erò:sprofondare"
      },
      "second": {
        "fwd": "1erai:dare,ciare,vare,giare¦1rrai:enire,enere,olere,ucere,alere,anere¦2ai:rre¦2rai:piere,arere¦3ai:dere,gere,mere,uere,bere,sere¦4ai:ttere,liere,scere,stere,ncere,rnere,erere,acere,rcere,mpere,rrere,utere,llere,icere,gnere,rtere¦5ai:ervere,ietere",
        "both": "5etterai:etrasmettere¦5ai:cevere,bevere,petere,rivere¦5erai:llungare¦4ai:sfare,anire,gnire,rnire,inire,lvere,efare,onire,unire¦4rai:icadere¦4erai:grafare¦3erai:hifare¦3ai:vire,eire,gire,mire,pire,zire,hire,bire,uire,fire,sire,rire,cire,dire,tire,lire¦3rai:vivere¦2erai:ufare,nfare,uiare,ofare,siare,ziare,niare,miare,diare,riare,oiare,fiare,tiare,viare,biare,piare,liare,ffare,aiare,hiare¦2rai:apere,otere,overe¦1erai:bare,eare,mare,pare,uare,zare,tare,rare,sare,lare,nare¦1herai:gare,care",
        "rev": "1ere:vrai¦1are:ferai¦2iare:ccerai,ggerai,ocerai,ucerai,lcerai,agerai,egerai,ugerai¦2are:oderai,averai,ndrai,overai,rverai,dderai,lderai,cierai¦2nire:verrai¦2nere:terrai,marrai¦2e:arai,irai¦2ere:adrai,odrai¦2lere:varrai¦3e:urrai,orrai¦3are:orderai,fiderai,leverai,niderai,viverai,arderai,diderai,auderai,tiverai,gederai,nuderai,uiderai,biderai,piderai,liverai,hederai,hiverai¦3iare:ancerai,ficerai,figerai,logerai,uncerai,nicerai,iscerai,arcerai,ircerai,uscerai,engerai¦3ere:parrai¦4are:bonderai,hinderai,rrederai,rriverai,tonderai,linderai,manderai,oliderai,prederai,irederai,erederai,menderai,nonderai,aliderai,banderai,griderai,iciderai,uciderai¦4iare:cascerai,concerai,corcerai,loscerai,bascerai,mincerai,adicerai,udicerai,lascerai,mangerai,vescerai,roscerai,fascerai,aligerai¦4e:rgerai,lgerai,rarrai¦4ere:ompirai¦5e:cederai,iggerai,luderai,rogerai,ingerai,iederai,iuderai,iacerai,omperai,nquerai,rigerai,cuterai,erderai,uggerai,viderai,sigerai,ruderai,vaderai,olcerai,underai,digerai,caderai,tacerai¦5are:econderai,rconderai,ifonderai¦5iare:ombacerai",
        "ex": "driurrai:riducere¦sarai:essere¦3rai:andare,cadere,godere,vivere,parere¦2rai:avere¦10ai:contraffare,compiangere,comprendere,congiungere,disgiungere,distinguere,distogliere,manomettere,prediligere,raccogliere,raggiungere,rapprendere,riaccendere,riappendere,riconoscere,rincrescere,risplendere,scommettere,sconnettere,scoscendere,soggiungere,sorprendere,stravincere,trascendere,trascorrere,trasfondere,trasmettere¦3ai:dare,dire,fare,gire¦5rai:decadere¦5ai:gioire,lenire,ridare,rifare,ardere,cedere,gemere,ledere,licere,radere,ridere,sumere,tacere,temere,ungere¦6ai:molcere,ristare,battere,cernere,cherere,correre,credere,elidere,erodere,fendere,fervere,fottere,fremere,fungere,leggere,mescere,mettere,mietere,mordere,mungere,nascere,pascere,pendere,premere,pungere,reggere,rendere,tangere,tendere,tessere,torcere,vendere,vertere,vincere¦4erai:roncare,bendare,berciare,cangiare,conciare,eredare,fasciare,fondare,forgiare,gradare,gridare,guadare,lasciare,linciare,mandare,mangiare,mondare,predare,privare,salvare,sondare¦3erai:sciare,tifare,baciare,badare,bigiare,fidare,levare,mudare,ondare,pigiare,redare,sedare,sudare¦4ai:sfare,stare,unire¦9ai:sopraffare,sottostare,accogliere,accrescere,affrangere,aggiungere,apprendere,benedicere,cognoscere,coincidere,combattere,commettere,comprimere,compungere,concernere,concorrere,confondere,connettere,consistere,contendere,contorcere,convincere,correggere,decrescere,diffondere,discendere,discernere,discorrere,dismettere,dissuadere,distendere,distorcere,estinguere,imprendere,infrangere,ingiungere,nascondere,percorrere,permettere,persistere,persuadere,portendere,precorrere,premettere,prenascere,pretendere,profondere,promettere,propellere,propendere,proteggere,protendere,rescindere,riassumere,ricogliere,ricrescere,rieleggere,riflettere,riprendere,rispondere,sciogliere,sconoscere,soccombere,soccorrere,sommettere,sopprimere,sorreggere,sospendere,sottendere,sussistere,tramettere¦7ai:strafare,abradere,arridere,assidere,assumere,chierere,clangere,cogliere,crescere,decidere,deridere,desumere,diligere,dirimere,eleggere,emettere,esistere,evincere,flettere,frangere,giungere,incidere,irridere,occidere,omettere,piangere,prendere,recidere,redimere,riardere,sbattere,scendere,scernere,scindere,scorrere,sfottere,smettere,spandere,spegnere,spendere,spremere,stendere,storcere,stridere,svellere,svendere,togliere,uccidere¦8ai:abbattere,accendere,accorrere,ammettere,annettere,appendere,ascendere,ascondere,assistere,attendere,attorcere,avvincere,collidere,conoscere,corrodere,decorrere,defungere,deprimere,desistere,difendere,dimettere,dipendere,divellere,eccellere,effondere,espandere,espellere,esprimere,espungere,estendere,estollere,estorcere,immettere,imprimere,incendere,incombere,incorrere,infondere,insistere,intendere,intridere,negligere,occorrere,offendere,opprimere,precidere,presumere,repellere,reprimere,resistere,ribattere,ricorrere,ricredere,rileggere,rimettere,rimordere,rinascere,ritorcere,rivendere,rivincere,scegliere,secernere,sorridere,splendere¦14ai:accondiscendere¦9erai:affaccendare¦6erai:affondare¦2erai:agiare¦5erai:brindare,ossidare,sfondare¦11ai:circoncidere,disattendere,disciogliere,disconoscere,fraintendere,intercorrere,intromettere,prescegliere,sottomettere¦12ai:compromettere,controbattere,corrispondere,disconnettere,intraprendere,ricongiungere,ritrasmettere,soprintendere,sottintendere,sovrintendere¦17ai:contraddistinguere¦2rrai:dolere,ducere,tenere,valere,venire,volere¦3rrai:educere¦13ai:sopraggiungere¦8erai:sprofondare"
      },
      "third": {
        "fwd": "1erà:dare,ciare,vare,giare¦1rrà:enire,enere,olere,ucere,alere,anere¦2à:rre¦2rà:piere,arere¦3à:dere,gere,mere,uere,bere,sere¦4à:ttere,liere,scere,stere,ncere,rnere,erere,acere,rcere,mpere,rrere,utere,llere,icere,gnere,rtere¦5à:ervere,ietere",
        "both": "5etterà:etrasmettere¦5à:cevere,bevere,petere,rivere¦5erà:llungare¦4à:sfare,anire,gnire,rnire,inire,lvere,efare,onire,unire¦4rà:icadere¦4erà:grafare¦3erà:hifare¦3à:vire,eire,gire,mire,pire,zire,hire,bire,uire,fire,sire,rire,cire,dire,tire,lire¦3rà:vivere¦2erà:ufare,nfare,uiare,ofare,siare,ziare,niare,miare,diare,riare,oiare,fiare,tiare,viare,biare,piare,liare,ffare,aiare,hiare¦2rà:apere,otere,overe¦1erà:bare,eare,mare,pare,uare,zare,tare,rare,sare,lare,nare¦1herà:gare,care",
        "rev": "1ere:vrà¦1are:ferà¦2iare:ccerà,ggerà,ocerà,ucerà,lcerà,agerà,egerà,ugerà¦2are:oderà,averà,ndrà,overà,rverà,dderà,lderà,cierà¦2nire:verrà¦2nere:terrà,marrà¦2e:arà,irà¦2ere:adrà,odrà¦2lere:varrà¦3are:orderà,fiderà,leverà,niderà,viverà,arderà,diderà,auderà,tiverà,gederà,nuderà,uiderà,biderà,piderà,liverà,hederà,hiverà¦3iare:ancerà,ficerà,figerà,logerà,uncerà,nicerà,iscerà,arcerà,ircerà,uscerà,engerà¦3e:orrà¦3cere:idurrà¦3ere:parrà¦4are:bonderà,hinderà,rrederà,rriverà,tonderà,linderà,manderà,oliderà,prederà,irederà,erederà,menderà,nonderà,aliderà,banderà,griderà,iciderà,uciderà¦4iare:cascerà,concerà,corcerà,loscerà,bascerà,mincerà,adicerà,udicerà,lascerà,mangerà,vescerà,roscerà,fascerà,aligerà¦4e:rgerà,lgerà,rarrà¦4ere:ompirà¦5e:bdurrà,cederà,ddurrà,iggerà,luderà,rogerà,ingerà,iederà,iuderà,iacerà,ndurrà,omperà,edurrà,nquerà,rigerà,cuterà,erderà,uggerà,viderà,sigerà,ruderà,odurrà,vaderà,olcerà,underà,digerà,caderà,tacerà,adurrà¦5are:econderà,rconderà,ifonderà¦5iare:ombacerà",
        "ex": "sarà:essere¦3rà:andare,cadere,godere,vivere,parere¦2rà:avere¦10à:contraffare,compiangere,comprendere,congiungere,disgiungere,distinguere,distogliere,manomettere,prediligere,raccogliere,raggiungere,rapprendere,riaccendere,riappendere,riconoscere,rincrescere,risplendere,scommettere,sconnettere,scoscendere,soggiungere,sorprendere,stravincere,trascendere,trascorrere,trasfondere,trasmettere¦3à:dare,dire,fare,gire¦5rà:decadere¦5à:gioire,lenire,ridare,rifare,ardere,cedere,gemere,ledere,licere,radere,ridere,sumere,tacere,temere,ungere¦6à:molcere,ristare,battere,cernere,cherere,correre,credere,elidere,erodere,fendere,fervere,fottere,fremere,fungere,leggere,mescere,mettere,mietere,mordere,mungere,nascere,pascere,pendere,premere,pungere,reggere,rendere,tangere,tendere,tessere,torcere,vendere,vertere,vincere¦4erà:roncare,bendare,berciare,cangiare,conciare,eredare,fasciare,fondare,forgiare,gradare,gridare,guadare,lasciare,linciare,mandare,mangiare,mondare,predare,privare,salvare,sondare¦3erà:sciare,tifare,baciare,badare,bigiare,fidare,levare,mudare,ondare,pigiare,redare,sedare,sudare¦4à:sfare,stare,unire¦9à:sopraffare,sottostare,accogliere,accrescere,affrangere,aggiungere,apprendere,benedicere,cognoscere,coincidere,combattere,commettere,comprimere,compungere,concernere,concorrere,confondere,connettere,consistere,contendere,contorcere,convincere,correggere,decrescere,diffondere,discendere,discernere,discorrere,dismettere,dissuadere,distendere,distorcere,estinguere,imprendere,infrangere,ingiungere,nascondere,percorrere,permettere,persistere,persuadere,portendere,precorrere,premettere,prenascere,pretendere,profondere,promettere,propellere,propendere,proteggere,protendere,rescindere,riassumere,ricogliere,ricrescere,rieleggere,riflettere,riprendere,rispondere,sciogliere,sconoscere,soccombere,soccorrere,sommettere,sopprimere,sorreggere,sospendere,sottendere,sussistere,tramettere¦7à:strafare,abradere,arridere,assidere,assumere,chierere,clangere,cogliere,crescere,decidere,deridere,desumere,diligere,dirimere,eleggere,emettere,esistere,evincere,flettere,frangere,giungere,incidere,irridere,occidere,omettere,piangere,prendere,recidere,redimere,riardere,sbattere,scendere,scernere,scindere,scorrere,sfottere,smettere,spandere,spegnere,spendere,spremere,stendere,storcere,stridere,svellere,svendere,togliere,uccidere¦8à:abbattere,accendere,accorrere,ammettere,annettere,appendere,ascendere,ascondere,assistere,attendere,attorcere,avvincere,collidere,conoscere,corrodere,decorrere,defungere,deprimere,desistere,difendere,dimettere,dipendere,divellere,eccellere,effondere,espandere,espellere,esprimere,espungere,estendere,estollere,estorcere,immettere,imprimere,incendere,incombere,incorrere,infondere,insistere,intendere,intridere,negligere,occorrere,offendere,opprimere,precidere,presumere,repellere,reprimere,resistere,ribattere,ricorrere,ricredere,rileggere,rimettere,rimordere,rinascere,ritorcere,rivendere,rivincere,scegliere,secernere,sorridere,splendere¦14à:accondiscendere¦9erà:affaccendare¦6erà:affondare¦2erà:agiare¦5erà:brindare,ossidare,sfondare¦11à:circoncidere,disattendere,disciogliere,disconoscere,fraintendere,intercorrere,intromettere,prescegliere,sottomettere¦12à:compromettere,controbattere,corrispondere,disconnettere,intraprendere,ricongiungere,ritrasmettere,soprintendere,sottintendere,sovrintendere¦17à:contraddistinguere¦2rrà:dolere,ducere,tenere,valere,venire,volere¦3rrà:educere¦13à:sopraggiungere¦8erà:sprofondare"
      },
      "firstPlural": {
        "fwd": "1eremo:dare,ciare,vare,giare¦1rremo:enire,enere,olere,ucere,alere,anere¦2remo:piere,arere¦3mo:rre¦4mo:dere,gere,mere,uere,bere,sere¦5mo:ttere,liere,scere,stere,ncere,rnere,erere,acere,rcere,mpere,rrere,utere,llere,icere,evere,gnere,rtere",
        "both": "5etteremo:etrasmettere¦5mo:sfare,anire,gnire,rnire,inire,lvere,efare,onire,unire¦4mo:vire,eire,gire,mire,pire,zire,hire,bire,uire,fire,sire,rire,cire,dire,tire,lire¦4remo:icadere¦4eremo:grafare¦3eremo:hifare¦3remo:vivere¦2eremo:ufare,nfare,uiare,ofare,siare,ziare,niare,miare,diare,riare,oiare,fiare,tiare,viare,biare,piare,liare,ffare,aiare,hiare¦2remo:apere,otere,overe¦1eremo:bare,eare,mare,pare,uare,zare,tare,rare,sare,lare,nare¦1heremo:gare,care",
        "rev": "3:aremo¦4:orremo,oiremo,niremo¦5:rgeremo,lgeremo,rarremo¦e:émo¦1ere:vremo¦1are:feremo¦2iare:cceremo,ggeremo,oceremo,uceremo,lceremo,ageremo,egeremo,ugeremo¦2are:oderemo,averemo,ndremo,overemo,rveremo,dderemo,lderemo,cieremo¦2nire:verremo¦2nere:terremo,marremo¦2ere:adremo,odremo¦2lere:varremo¦3are:orderemo,fideremo,leveremo,nideremo,viveremo,arderemo,dideremo,auderemo,tiveremo,gederemo,nuderemo,uideremo,bideremo,pideremo,liveremo,hederemo,hiveremo¦3iare:anceremo,ficeremo,figeremo,logeremo,unceremo,niceremo,isceremo,arceremo,irceremo,usceremo,engeremo¦3cere:idurremo¦3ere:parremo¦4are:bonderemo,hinderemo,lungeremo,rrederemo,rriveremo,tonderemo,linderemo,manderemo,olideremo,prederemo,irederemo,erederemo,menderemo,nonderemo,alideremo,banderemo,grideremo,icideremo,ucideremo¦4iare:casceremo,conceremo,corceremo,losceremo,minceremo,adiceremo,udiceremo,lasceremo,mangeremo,vesceremo,rosceremo,fasceremo,aligeremo¦4ere:ompiremo¦5iare:mbasceremo,ombaceremo¦5are:econderemo,rconderemo,ifonderemo",
        "ex": "saremo:essere¦6eremo:allungare,affondare¦3remo:andare,cadere,godere,vivere,parere¦9mo:ascrivere,competere,iscrivere,abbattere,accendere,accorrere,ammettere,annettere,appendere,ascendere,ascondere,assistere,attendere,attingere,attorcere,avvincere,collidere,colludere,concedere,conoscere,corrodere,decorrere,defungere,deprimere,desistere,difendere,dimettere,dipendere,dipingere,dirompere,discutere,divellere,eccellere,effondere,escludere,espandere,espellere,esprimere,espungere,estendere,estollere,estorcere,estrudere,immettere,imprimere,incendere,incingere,includere,incombere,incorrere,infiggere,infondere,insistere,intendere,intingere,intridere,intrudere,irrompere,negligere,occludere,occorrere,offendere,opprimere,ottundere,pervadere,precedere,precidere,presumere,procedere,recingere,recludere,repellere,reprimere,resistere,ribattere,ricorrere,ricredere,rileggere,rimettere,rimordere,rinascere,risiedere,ritorcere,rivendere,rivincere,scegliere,schiudere,secernere,sorridere,sottacere,splendere,stringere,struggere,succedere¦2remo:avere¦13mo:circoscrivere,sottoscrivere,compromettere,controbattere,corrispondere,disconnettere,intraprendere,ricongiungere,ritrasmettere,soprintendere,sottintendere,sovrintendere¦11mo:contraffare,prescrivere,trascrivere,compiangere,comprendere,congiungere,costringere,dischiudere,disgiungere,distinguere,distogliere,distruggere,intercedere,manomettere,prediligere,racchiudere,raccogliere,raggiungere,rapprendere,restringere,retrocedere,riaccendere,riappendere,riconoscere,ridipingere,rinchiudere,rincrescere,risplendere,ristringere,scommettere,sconfiggere,sconnettere,scoscendere,socchiudere,soffriggere,soggiungere,sorprendere,stravincere,suddividere,trascendere,trascorrere,trasfondere,trasmettere¦4mo:dare,dire,fare¦5remo:decadere¦10mo:descrivere,inscrivere,riscrivere,sopraffare,sottostare,accogliere,accrescere,affliggere,affrangere,aggiungere,antecedere,apprendere,astringere,benedicere,cognoscere,coincidere,combattere,commettere,compiacere,comprimere,compungere,concernere,concludere,concorrere,confondere,connettere,consistere,contendere,contorcere,convincere,correggere,corrompere,decrescere,delinquere,diffondere,discendere,discernere,discorrere,dismettere,disperdere,dispiacere,dissuadere,distendere,distorcere,estinguere,imprendere,infliggere,infrangere,ingiungere,introdurre,nascondere,percorrere,permettere,persistere,persuadere,portendere,precludere,precorrere,prefiggere,premettere,prenascere,pretendere,profondere,promettere,propellere,propendere,prorompere,proteggere,protendere,rescindere,respingere,riassumere,richiedere,ricogliere,ricondurre,ricrescere,rieleggere,riflettere,riprendere,riprodurre,rispingere,rispondere,sciogliere,sconoscere,soccombere,soccorrere,soggiacere,sommettere,sopprimere,sorreggere,sospendere,sospingere,sottendere,sussistere,trafiggere,tramettere,transigere¦7mo:fervere,mietere,molcere,ristare,abdurre,addurre,battere,cernere,cherere,cingere,correre,credere,dedurre,elidere,eludere,erigere,erodere,esigere,evadere,fendere,figgere,fingere,fottere,fremere,fungere,giacere,indurre,leggere,mescere,mettere,mingere,mordere,mungere,nascere,pascere,pendere,perdere,piacere,premere,prudere,pungere,reggere,rendere,rompere,scadere,sedurre,tangere,tendere,tessere,tingere,torcere,vendere,vertere,vincere¦6mo:gioire,lenire,ridare,rifare,ardere,cedere,gemere,ledere,licere,radere,ridere,sumere,tacere,temere,ungere¦3émo:gire¦8mo:ripetere,scrivere,strafare,abradere,accedere,alludere,arridere,arrogere,assidere,assumere,chiedere,chierere,chiudere,clangere,cogliere,condurre,crescere,decedere,decidere,deludere,deridere,desumere,diligere,dirigere,dirimere,dividere,eccedere,eleggere,emettere,erompere,escutere,esistere,evincere,flettere,frangere,friggere,giungere,illudere,imbevere,incedere,incidere,incutere,invadere,irridere,occidere,omettere,piangere,prendere,produrre,recedere,recidere,redigere,redimere,riardere,ricedere,ricevere,sbattere,scendere,scernere,scindere,scorrere,sfottere,smettere,spandere,spegnere,spendere,spingere,spremere,stendere,stingere,storcere,stridere,svellere,svendere,togliere,tradurre,uccidere¦4eremo:roncare,bendare,berciare,cangiare,conciare,eredare,fasciare,fondare,forgiare,gradare,gridare,guadare,lasciare,linciare,mandare,mangiare,mondare,predare,privare,salvare,sondare¦3eremo:sciare,tifare,baciare,badare,bigiare,fidare,levare,mudare,ondare,pigiare,redare,sedare,sudare¦5mo:sfare,stare,unire¦15mo:accondiscendere¦9eremo:affaccendare¦2eremo:agiare¦5eremo:brindare,ossidare,sfondare¦12mo:circoncidere,crocifiggere,disattendere,disciogliere,disconoscere,fraintendere,intercorrere,interrompere,intromettere,prescegliere,sottomettere¦18mo:contraddistinguere¦2rremo:dolere,ducere,tenere,valere,venire,volere¦3rremo:educere¦14mo:sopraggiungere¦8eremo:sprofondare"
      },
      "secondPlural": {
        "fwd": "1erete:dare,ciare,vare,giare¦1rrete:enire,enere,olere,ucere,alere,anere¦2rete:piere,arere¦3te:rre¦4te:dere,gere,mere,uere,bere,sere¦5te:ttere,liere,scere,stere,ncere,rnere,erere,acere,rcere,mpere,rrere,utere,llere,icere,evere,gnere,rtere",
        "both": "5etterete:etrasmettere¦5te:sfare,anire,gnire,rnire,inire,lvere,efare,onire,unire¦4te:vire,eire,gire,mire,pire,zire,hire,bire,uire,fire,sire,rire,cire,dire,tire,lire¦4rete:icadere¦4erete:grafare¦3erete:hifare¦3rete:vivere¦2erete:ufare,nfare,uiare,ofare,siare,ziare,niare,miare,diare,riare,oiare,fiare,tiare,viare,biare,piare,liare,ffare,aiare,hiare¦2rete:apere,otere,overe¦1erete:bare,eare,mare,pare,uare,zare,tare,rare,sare,lare,nare¦1herete:gare,care",
        "rev": "3:arete¦4:orrete,oirete,nirete¦5:rgerete,lgerete,rarrete¦e:éte¦1ere:vrete¦1are:ferete¦2iare:ccerete,ggerete,ocerete,ucerete,lcerete,agerete,egerete,ugerete¦2are:oderete,averete,ndrete,overete,rverete,dderete,lderete,cierete¦2nire:verrete¦2nere:terrete,marrete¦2ere:adrete,odrete¦2lere:varrete¦3are:orderete,fiderete,leverete,niderete,viverete,arderete,diderete,auderete,tiverete,gederete,nuderete,uiderete,biderete,piderete,liverete,hederete,hiverete¦3iare:ancerete,ficerete,figerete,logerete,uncerete,nicerete,iscerete,arcerete,ircerete,uscerete,engerete¦3cere:idurrete¦3ere:parrete¦4are:bonderete,hinderete,lungerete,rrederete,rriverete,tonderete,linderete,manderete,oliderete,prederete,irederete,erederete,menderete,nonderete,aliderete,banderete,griderete,iciderete,uciderete¦4iare:cascerete,concerete,corcerete,loscerete,mincerete,adicerete,udicerete,lascerete,mangerete,vescerete,roscerete,fascerete,aligerete¦4ere:ompirete¦5iare:mbascerete,ombacerete¦5are:econderete,rconderete,ifonderete",
        "ex": "sarete:essere¦6erete:allungare,affondare¦3rete:andare,cadere,godere,vivere,parere¦9te:ascrivere,competere,iscrivere,abbattere,accendere,accorrere,ammettere,annettere,appendere,ascendere,ascondere,assistere,attendere,attingere,attorcere,avvincere,collidere,colludere,concedere,conoscere,corrodere,decorrere,defungere,deprimere,desistere,difendere,dimettere,dipendere,dipingere,dirompere,discutere,divellere,eccellere,effondere,escludere,espandere,espellere,esprimere,espungere,estendere,estollere,estorcere,estrudere,immettere,imprimere,incendere,incingere,includere,incombere,incorrere,infiggere,infondere,insistere,intendere,intingere,intridere,intrudere,irrompere,negligere,occludere,occorrere,offendere,opprimere,ottundere,pervadere,precedere,precidere,presumere,procedere,recingere,recludere,repellere,reprimere,resistere,ribattere,ricorrere,ricredere,rileggere,rimettere,rimordere,rinascere,risiedere,ritorcere,rivendere,rivincere,scegliere,schiudere,secernere,sorridere,sottacere,splendere,stringere,struggere,succedere¦2rete:avere¦13te:circoscrivere,sottoscrivere,compromettere,controbattere,corrispondere,disconnettere,intraprendere,ricongiungere,ritrasmettere,soprintendere,sottintendere,sovrintendere¦11te:contraffare,prescrivere,trascrivere,compiangere,comprendere,congiungere,costringere,dischiudere,disgiungere,distinguere,distogliere,distruggere,intercedere,manomettere,prediligere,racchiudere,raccogliere,raggiungere,rapprendere,restringere,retrocedere,riaccendere,riappendere,riconoscere,ridipingere,rinchiudere,rincrescere,risplendere,ristringere,scommettere,sconfiggere,sconnettere,scoscendere,socchiudere,soffriggere,soggiungere,sorprendere,stravincere,suddividere,trascendere,trascorrere,trasfondere,trasmettere¦4te:dare,dire,fare¦5rete:decadere¦10te:descrivere,inscrivere,riscrivere,sopraffare,sottostare,accogliere,accrescere,affliggere,affrangere,aggiungere,antecedere,apprendere,astringere,benedicere,cognoscere,coincidere,combattere,commettere,compiacere,comprimere,compungere,concernere,concludere,concorrere,confondere,connettere,consistere,contendere,contorcere,convincere,correggere,corrompere,decrescere,delinquere,diffondere,discendere,discernere,discorrere,dismettere,disperdere,dispiacere,dissuadere,distendere,distorcere,estinguere,imprendere,infliggere,infrangere,ingiungere,introdurre,nascondere,percorrere,permettere,persistere,persuadere,portendere,precludere,precorrere,prefiggere,premettere,prenascere,pretendere,profondere,promettere,propellere,propendere,prorompere,proteggere,protendere,rescindere,respingere,riassumere,richiedere,ricogliere,ricondurre,ricrescere,rieleggere,riflettere,riprendere,riprodurre,rispingere,rispondere,sciogliere,sconoscere,soccombere,soccorrere,soggiacere,sommettere,sopprimere,sorreggere,sospendere,sospingere,sottendere,sussistere,trafiggere,tramettere,transigere¦7te:fervere,mietere,molcere,ristare,abdurre,addurre,battere,cernere,cherere,cingere,correre,credere,dedurre,elidere,eludere,erigere,erodere,esigere,evadere,fendere,figgere,fingere,fottere,fremere,fungere,giacere,indurre,leggere,mescere,mettere,mingere,mordere,mungere,nascere,pascere,pendere,perdere,piacere,premere,prudere,pungere,reggere,rendere,rompere,scadere,sedurre,tangere,tendere,tessere,tingere,torcere,vendere,vertere,vincere¦6te:gioire,lenire,ridare,rifare,ardere,cedere,gemere,ledere,licere,radere,ridere,sumere,tacere,temere,ungere¦3éte:gire¦8te:ripetere,scrivere,strafare,abradere,accedere,alludere,arridere,arrogere,assidere,assumere,chiedere,chierere,chiudere,clangere,cogliere,condurre,crescere,decedere,decidere,deludere,deridere,desumere,diligere,dirigere,dirimere,dividere,eccedere,eleggere,emettere,erompere,escutere,esistere,evincere,flettere,frangere,friggere,giungere,illudere,imbevere,incedere,incidere,incutere,invadere,irridere,occidere,omettere,piangere,prendere,produrre,recedere,recidere,redigere,redimere,riardere,ricedere,ricevere,sbattere,scendere,scernere,scindere,scorrere,sfottere,smettere,spandere,spegnere,spendere,spingere,spremere,stendere,stingere,storcere,stridere,svellere,svendere,togliere,tradurre,uccidere¦4erete:roncare,bendare,berciare,cangiare,conciare,eredare,fasciare,fondare,forgiare,gradare,gridare,guadare,lasciare,linciare,mandare,mangiare,mondare,predare,privare,salvare,sondare¦3erete:sciare,tifare,baciare,badare,bigiare,fidare,levare,mudare,ondare,pigiare,redare,sedare,sudare¦5te:sfare,stare,unire¦15te:accondiscendere¦9erete:affaccendare¦2erete:agiare¦5erete:brindare,ossidare,sfondare¦12te:circoncidere,crocifiggere,disattendere,disciogliere,disconoscere,fraintendere,intercorrere,interrompere,intromettere,prescegliere,sottomettere¦18te:contraddistinguere¦2rrete:dolere,ducere,tenere,valere,venire,volere¦3rrete:educere¦14te:sopraggiungere¦8erete:sprofondare"
      },
      "thirdPlural": {
        "fwd": "1eranno:dare,ciare,vare,giare¦1rranno:enire,enere,olere,ucere,alere,anere¦2anno:rre¦2ranno:piere,arere¦3anno:dere,gere,mere,uere,bere,sere¦4anno:ttere,liere,scere,stere,ncere,rnere,erere,acere,rcere,mpere,rrere,utere,llere,icere,gnere,rtere¦5anno:ervere,ietere",
        "both": "5etteranno:etrasmettere¦5anno:cevere,bevere,petere,rivere¦5eranno:llungare¦4anno:sfare,anire,gnire,rnire,inire,lvere,efare,onire,unire¦4ranno:icadere¦4eranno:grafare¦3eranno:hifare¦3anno:vire,eire,gire,mire,pire,zire,hire,bire,uire,fire,sire,rire,cire,dire,tire,lire¦3ranno:vivere¦2eranno:ufare,nfare,uiare,ofare,siare,ziare,niare,miare,diare,riare,oiare,fiare,tiare,viare,biare,piare,liare,ffare,aiare,hiare¦2ranno:apere,otere,overe¦1eranno:bare,eare,mare,pare,uare,zare,tare,rare,sare,lare,nare¦1heranno:gare,care",
        "rev": "e:ànno¦1ere:vranno¦1are:feranno¦2iare:cceranno,ggeranno,oceranno,uceranno,lceranno,ageranno,egeranno,ugeranno¦2are:oderanno,averanno,ndranno,overanno,rveranno,dderanno,lderanno,cieranno¦2nire:verranno¦2nere:terranno,marranno¦2e:aranno¦2ere:adranno,odranno¦2lere:varranno¦3are:orderanno,fideranno,leveranno,nideranno,viveranno,arderanno,dideranno,auderanno,tiveranno,gederanno,nuderanno,uideranno,bideranno,pideranno,liveranno,hederanno,hiveranno¦3iare:anceranno,ficeranno,figeranno,logeranno,unceranno,niceranno,isceranno,arceranno,irceranno,usceranno,engeranno¦3e:orranno,oiranno,niranno¦3cere:idurranno¦3ere:parranno¦4are:bonderanno,hinderanno,rrederanno,rriveranno,tonderanno,linderanno,manderanno,olideranno,prederanno,irederanno,erederanno,menderanno,nonderanno,alideranno,banderanno,grideranno,icideranno,ucideranno¦4iare:casceranno,conceranno,corceranno,losceranno,basceranno,minceranno,adiceranno,udiceranno,lasceranno,mangeranno,vesceranno,rosceranno,fasceranno,aligeranno¦4e:rgeranno,lgeranno,rarranno¦4ere:ompiranno¦5e:bdurranno,cederanno,ddurranno,iggeranno,luderanno,rogeranno,ingeranno,iederanno,iuderanno,iaceranno,ndurranno,omperanno,edurranno,nqueranno,rigeranno,cuteranno,erderanno,uggeranno,videranno,sigeranno,ruderanno,odurranno,vaderanno,olceranno,underanno,digeranno,caderanno,taceranno,adurranno¦5are:econderanno,rconderanno,ifonderanno¦5iare:ombaceranno",
        "ex": "saranno:essere¦3ranno:andare,cadere,godere,vivere,parere¦2ranno:avere¦10anno:contraffare,compiangere,comprendere,congiungere,disgiungere,distinguere,distogliere,manomettere,prediligere,raccogliere,raggiungere,rapprendere,riaccendere,riappendere,riconoscere,rincrescere,risplendere,scommettere,sconnettere,scoscendere,soggiungere,sorprendere,stravincere,trascendere,trascorrere,trasfondere,trasmettere¦3anno:dare,dire,fare¦5ranno:decadere¦5anno:gioire,lenire,ridare,rifare,ardere,cedere,gemere,ledere,licere,radere,ridere,sumere,tacere,temere,ungere¦3ànno:gire¦6anno:molcere,ristare,battere,cernere,cherere,correre,credere,elidere,erodere,fendere,fervere,fottere,fremere,fungere,leggere,mescere,mettere,mietere,mordere,mungere,nascere,pascere,pendere,premere,pungere,reggere,rendere,tangere,tendere,tessere,torcere,vendere,vertere,vincere¦4eranno:roncare,bendare,berciare,cangiare,conciare,eredare,fasciare,fondare,forgiare,gradare,gridare,guadare,lasciare,linciare,mandare,mangiare,mondare,predare,privare,salvare,sondare¦3eranno:sciare,tifare,baciare,badare,bigiare,fidare,levare,mudare,ondare,pigiare,redare,sedare,sudare¦4anno:sfare,stare,unire¦9anno:sopraffare,sottostare,accogliere,accrescere,affrangere,aggiungere,apprendere,benedicere,cognoscere,coincidere,combattere,commettere,comprimere,compungere,concernere,concorrere,confondere,connettere,consistere,contendere,contorcere,convincere,correggere,decrescere,diffondere,discendere,discernere,discorrere,dismettere,dissuadere,distendere,distorcere,estinguere,imprendere,infrangere,ingiungere,nascondere,percorrere,permettere,persistere,persuadere,portendere,precorrere,premettere,prenascere,pretendere,profondere,promettere,propellere,propendere,proteggere,protendere,rescindere,riassumere,ricogliere,ricrescere,rieleggere,riflettere,riprendere,rispondere,sciogliere,sconoscere,soccombere,soccorrere,sommettere,sopprimere,sorreggere,sospendere,sottendere,sussistere,tramettere¦7anno:strafare,abradere,arridere,assidere,assumere,chierere,clangere,cogliere,crescere,decidere,deridere,desumere,diligere,dirimere,eleggere,emettere,esistere,evincere,flettere,frangere,giungere,incidere,irridere,occidere,omettere,piangere,prendere,recidere,redimere,riardere,sbattere,scendere,scernere,scindere,scorrere,sfottere,smettere,spandere,spegnere,spendere,spremere,stendere,storcere,stridere,svellere,svendere,togliere,uccidere¦8anno:abbattere,accendere,accorrere,ammettere,annettere,appendere,ascendere,ascondere,assistere,attendere,attorcere,avvincere,collidere,conoscere,corrodere,decorrere,defungere,deprimere,desistere,difendere,dimettere,dipendere,divellere,eccellere,effondere,espandere,espellere,esprimere,espungere,estendere,estollere,estorcere,immettere,imprimere,incendere,incombere,incorrere,infondere,insistere,intendere,intridere,negligere,occorrere,offendere,opprimere,precidere,presumere,repellere,reprimere,resistere,ribattere,ricorrere,ricredere,rileggere,rimettere,rimordere,rinascere,ritorcere,rivendere,rivincere,scegliere,secernere,sorridere,splendere¦14anno:accondiscendere¦9eranno:affaccendare¦6eranno:affondare¦2eranno:agiare¦5eranno:brindare,ossidare,sfondare¦11anno:circoncidere,disattendere,disciogliere,disconoscere,fraintendere,intercorrere,intromettere,prescegliere,sottomettere¦12anno:compromettere,controbattere,corrispondere,disconnettere,intraprendere,ricongiungere,ritrasmettere,soprintendere,sottintendere,sovrintendere¦17anno:contraddistinguere¦2rranno:dolere,ducere,tenere,valere,venire,volere¦3rranno:educere¦13anno:sopraggiungere¦8eranno:sprofondare"
      }
    },
    "conditional": {
      "first": {
        "fwd": "1erei:dare,ciare,vare,giare¦1rrei:enire,enere,olere,ucere,alere,anere¦2rei:piere,arere¦3i:rre¦4i:gere,mere,uere,bere,sere¦5i:ttere,ndere,rrere,udere,rdere,idere,ncere,rnere,erere,scere,stere,mpere,utere,acere,rcere,llere,icere,liere,evere,etere,gnere,rtere",
        "both": "5etterei:etrasmettere¦5i:sfare,gnire,rnire,lvere,efare,inire,onire,anire,unire¦4i:vire,eire,gire,mire,pire,zire,sire,hire,uire,fire,bire,rire,cire,dire,tire,lire¦4rei:icadere¦4erei:grafare¦3erei:hifare¦3rei:vedere,vivere¦2erei:ufare,nfare,uiare,ofare,siare,ziare,niare,miare,diare,riare,oiare,fiare,tiare,viare,biare,piare,liare,ffare,aiare,hiare¦2rei:apere,otere,overe¦1erei:bare,eare,mare,pare,uare,zare,tare,rare,sare,lare,nare¦1herei:gare,care",
        "rev": "3:arei¦4:orrei,oirei,nirei¦5:rgerei,lgerei,rarrei¦1ere:vrei¦1are:ferei¦2iare:ccerei,ggerei,ocerei,ucerei,lcerei,agerei,egerei,ogerei,ugerei¦2are:oderei,averei,ndrei,overei,rverei,dderei,lderei,cierei¦2nire:verrei¦2nere:terrei,marrei¦2ere:adrei,odrei,edrei¦2lere:varrei¦3are:orderei,fiderei,leverei,niderei,viverei,arderei,diderei,auderei,tiverei,gederei,nuderei,uiderei,biderei,piderei,liverei,hederei,hiverei¦3iare:ancerei,ficerei,figerei,uncerei,nicerei,iscerei,arcerei,ircerei,uscerei,engerei¦3cere:idurrei¦3ere:parrei¦4are:bonderei,hinderei,lungerei,rrederei,rriverei,linderei,manderei,oliderei,prederei,irederei,erederei,menderei,nonderei,aliderei,banderei,griderei,iciderei,uciderei¦4iare:cascerei,concerei,corcerei,loscerei,mincerei,adicerei,udicerei,lascerei,mangerei,vescerei,roscerei,fascerei,aligerei¦4ere:ompirei¦5iare:mbascerei,ombacerei¦5are:otonderei,econderei,rconderei,ifonderei",
        "ex": "sarei:essere¦8i:abradere,accedere,chiedere,decedere,eccedere,incedere,invadere,recedere,ricedere,scrivere,strafare,alludere,arridere,assidere,assumere,chierere,chiudere,clangere,cogliere,condurre,crescere,decidere,deludere,deridere,desumere,diligere,dirigere,dirimere,dividere,eleggere,emettere,erompere,escutere,esistere,evincere,flettere,frangere,friggere,giungere,illudere,imbevere,incidere,incutere,irridere,occidere,omettere,piangere,prendere,produrre,recidere,redigere,redimere,riardere,ricevere,ripetere,sbattere,scendere,scernere,scindere,scorrere,sfottere,smettere,spandere,spegnere,spendere,spingere,spremere,stendere,stingere,storcere,stridere,svellere,svendere,togliere,tradurre,uccidere¦6erei:allungare,affondare¦3rei:andare,cadere,godere,vedere,vivere,parere¦10i:antecedere,descrivere,dissuadere,inscrivere,persuadere,richiedere,riscrivere,sopraffare,sottostare,accogliere,accrescere,affliggere,affrangere,aggiungere,apprendere,astringere,benedicere,cognoscere,coincidere,combattere,commettere,compiacere,comprimere,compungere,concernere,concludere,concorrere,confondere,connettere,consistere,contendere,contorcere,convincere,correggere,corrompere,decrescere,delinquere,diffondere,discendere,discernere,discorrere,dismettere,disperdere,dispiacere,distendere,distorcere,estinguere,imprendere,infliggere,infrangere,ingiungere,introdurre,nascondere,percorrere,permettere,persistere,portendere,precludere,precorrere,prefiggere,premettere,prenascere,pretendere,profondere,promettere,propellere,propendere,prorompere,proteggere,protendere,rescindere,respingere,riassumere,ricogliere,ricondurre,ricrescere,rieleggere,riflettere,riprendere,riprodurre,rispingere,rispondere,sciogliere,sconoscere,soccombere,soccorrere,soggiacere,sommettere,sopprimere,sorreggere,sospendere,sospingere,sottendere,sussistere,trafiggere,tramettere,transigere¦9i:ascrivere,concedere,corrodere,iscrivere,pervadere,precedere,procedere,ricredere,risiedere,succedere,abbattere,accendere,accorrere,ammettere,annettere,appendere,ascendere,ascondere,assistere,attendere,attingere,attorcere,avvincere,collidere,colludere,competere,conoscere,decorrere,defungere,deprimere,desistere,difendere,dimettere,dipendere,dipingere,dirompere,discutere,divellere,eccellere,effondere,escludere,espandere,espellere,esprimere,espungere,estendere,estollere,estorcere,estrudere,immettere,imprimere,incendere,incingere,includere,incombere,incorrere,infiggere,infondere,insistere,intendere,intingere,intridere,intrudere,irrompere,negligere,occludere,occorrere,offendere,opprimere,ottundere,precidere,presumere,recingere,recludere,repellere,reprimere,resistere,ribattere,ricorrere,rileggere,rimettere,rimordere,rinascere,ritorcere,rivendere,rivincere,scegliere,schiudere,secernere,sorridere,sottacere,splendere,stringere,struggere¦2rei:avere¦6i:cedere,gioire,ledere,lenire,radere,ridare,rifare,ardere,gemere,licere,ridere,sumere,tacere,temere,ungere¦13i:circoscrivere,sottoscrivere,compromettere,controbattere,corrispondere,disconnettere,intraprendere,ricongiungere,ritrasmettere,soprintendere,sottintendere,sovrintendere¦11i:contraffare,intercedere,prescrivere,retrocedere,trascrivere,compiangere,comprendere,congiungere,costringere,dischiudere,disgiungere,distinguere,distogliere,distruggere,manomettere,prediligere,racchiudere,raccogliere,raggiungere,rapprendere,restringere,riaccendere,riappendere,riconoscere,ridipingere,rinchiudere,rincrescere,risplendere,ristringere,scommettere,sconfiggere,sconnettere,scoscendere,socchiudere,soffriggere,soggiungere,sorprendere,stravincere,suddividere,trascendere,trascorrere,trasfondere,trasmettere¦7i:credere,erodere,evadere,fervere,ristare,scadere,abdurre,addurre,battere,cernere,cherere,cingere,correre,dedurre,elidere,eludere,erigere,esigere,fendere,figgere,fingere,fottere,fremere,fungere,giacere,indurre,leggere,mescere,mettere,mietere,mingere,mordere,mungere,nascere,pascere,pendere,perdere,piacere,premere,prudere,pungere,reggere,rendere,rompere,sedurre,tangere,tendere,tessere,tingere,torcere,vendere,vertere,vincere¦4i:dare,dire,fare¦5rei:decadere¦4erei:roncare,bendare,berciare,cangiare,conciare,eredare,fasciare,fondare,forgiare,gradare,gridare,guadare,lasciare,linciare,mandare,mangiare,mondare,predare,privare,salvare,sondare¦3erei:sciare,tifare,baciare,badare,bigiare,fidare,levare,mudare,ondare,pigiare,redare,sedare,sudare¦5i:sfare,stare,unire¦15i:accondiscendere¦9erei:affaccendare¦2erei:agiare¦5erei:brindare,ossidare,sfondare¦12i:circoncidere,crocifiggere,disattendere,disciogliere,disconoscere,fraintendere,intercorrere,interrompere,intromettere,prescegliere,sottomettere¦18i:contraddistinguere¦2rrei:dolere,ducere,tenere,valere,venire,volere¦3rrei:educere¦14i:sopraggiungere¦8erei:sprofondare"
      },
      "second": {
        "fwd": "1eresti:dare,ciare,vare,giare¦1rresti:enire,enere,olere,ucere,alere,anere¦2resti:piere,arere¦3sti:rre¦4sti:gere,mere,uere,bere,sere¦5sti:ttere,ndere,rrere,udere,rdere,idere,ncere,rnere,erere,scere,stere,mpere,utere,acere,rcere,llere,icere,liere,evere,etere,gnere,rtere",
        "both": "5etteresti:etrasmettere¦5sti:sfare,gnire,rnire,lvere,efare,inire,onire,anire,unire¦4sti:vire,eire,gire,mire,pire,zire,sire,hire,uire,fire,bire,rire,cire,dire,tire,lire¦4resti:icadere¦4eresti:grafare¦3eresti:hifare¦3resti:vedere,vivere¦2eresti:ufare,nfare,uiare,ofare,siare,ziare,niare,miare,diare,riare,oiare,fiare,tiare,viare,biare,piare,liare,ffare,aiare,hiare¦2resti:apere,otere,overe¦1eresti:bare,eare,mare,pare,uare,zare,tare,rare,sare,lare,nare¦1heresti:gare,care",
        "rev": "3:aresti¦4:orresti,oiresti,niresti¦5:rgeresti,lgeresti,rarresti¦1ere:vresti¦1are:feresti¦2iare:cceresti,ggeresti,oceresti,uceresti,lceresti,ageresti,egeresti,ogeresti,ugeresti¦2are:oderesti,averesti,ndresti,overesti,rveresti,dderesti,lderesti,cieresti¦2nire:verresti¦2nere:terresti,marresti¦2ere:adresti,odresti,edresti¦2lere:varresti¦3are:orderesti,fideresti,leveresti,nideresti,viveresti,arderesti,dideresti,auderesti,tiveresti,gederesti,nuderesti,uideresti,bideresti,pideresti,liveresti,hederesti,hiveresti¦3iare:anceresti,ficeresti,figeresti,unceresti,niceresti,isceresti,arceresti,irceresti,usceresti,engeresti¦3cere:idurresti¦3ere:parresti¦4are:bonderesti,hinderesti,lungeresti,rrederesti,rriveresti,linderesti,manderesti,olideresti,prederesti,irederesti,erederesti,menderesti,nonderesti,alideresti,banderesti,grideresti,icideresti,ucideresti¦4iare:casceresti,conceresti,corceresti,losceresti,minceresti,adiceresti,udiceresti,lasceresti,mangeresti,vesceresti,rosceresti,fasceresti,aligeresti¦4ere:ompiresti¦5iare:mbasceresti,ombaceresti¦5are:otonderesti,econderesti,rconderesti,ifonderesti",
        "ex": "saresti:essere¦8sti:abradere,accedere,chiedere,decedere,eccedere,incedere,invadere,recedere,ricedere,scrivere,strafare,alludere,arridere,assidere,assumere,chierere,chiudere,clangere,cogliere,condurre,crescere,decidere,deludere,deridere,desumere,diligere,dirigere,dirimere,dividere,eleggere,emettere,erompere,escutere,esistere,evincere,flettere,frangere,friggere,giungere,illudere,imbevere,incidere,incutere,irridere,occidere,omettere,piangere,prendere,produrre,recidere,redigere,redimere,riardere,ricevere,ripetere,sbattere,scendere,scernere,scindere,scorrere,sfottere,smettere,spandere,spegnere,spendere,spingere,spremere,stendere,stingere,storcere,stridere,svellere,svendere,togliere,tradurre,uccidere¦6eresti:allungare,affondare¦3resti:andare,cadere,godere,vedere,vivere,parere¦10sti:antecedere,descrivere,dissuadere,inscrivere,persuadere,richiedere,riscrivere,sopraffare,sottostare,accogliere,accrescere,affliggere,affrangere,aggiungere,apprendere,astringere,benedicere,cognoscere,coincidere,combattere,commettere,compiacere,comprimere,compungere,concernere,concludere,concorrere,confondere,connettere,consistere,contendere,contorcere,convincere,correggere,corrompere,decrescere,delinquere,diffondere,discendere,discernere,discorrere,dismettere,disperdere,dispiacere,distendere,distorcere,estinguere,imprendere,infliggere,infrangere,ingiungere,introdurre,nascondere,percorrere,permettere,persistere,portendere,precludere,precorrere,prefiggere,premettere,prenascere,pretendere,profondere,promettere,propellere,propendere,prorompere,proteggere,protendere,rescindere,respingere,riassumere,ricogliere,ricondurre,ricrescere,rieleggere,riflettere,riprendere,riprodurre,rispingere,rispondere,sciogliere,sconoscere,soccombere,soccorrere,soggiacere,sommettere,sopprimere,sorreggere,sospendere,sospingere,sottendere,sussistere,trafiggere,tramettere,transigere¦9sti:ascrivere,concedere,corrodere,iscrivere,pervadere,precedere,procedere,ricredere,risiedere,succedere,abbattere,accendere,accorrere,ammettere,annettere,appendere,ascendere,ascondere,assistere,attendere,attingere,attorcere,avvincere,collidere,colludere,competere,conoscere,decorrere,defungere,deprimere,desistere,difendere,dimettere,dipendere,dipingere,dirompere,discutere,divellere,eccellere,effondere,escludere,espandere,espellere,esprimere,espungere,estendere,estollere,estorcere,estrudere,immettere,imprimere,incendere,incingere,includere,incombere,incorrere,infiggere,infondere,insistere,intendere,intingere,intridere,intrudere,irrompere,negligere,occludere,occorrere,offendere,opprimere,ottundere,precidere,presumere,recingere,recludere,repellere,reprimere,resistere,ribattere,ricorrere,rileggere,rimettere,rimordere,rinascere,ritorcere,rivendere,rivincere,scegliere,schiudere,secernere,sorridere,sottacere,splendere,stringere,struggere¦2resti:avere¦6sti:cedere,gioire,ledere,lenire,radere,ridare,rifare,ardere,gemere,licere,ridere,sumere,tacere,temere,ungere¦13sti:circoscrivere,sottoscrivere,compromettere,controbattere,corrispondere,disconnettere,intraprendere,ricongiungere,ritrasmettere,soprintendere,sottintendere,sovrintendere¦11sti:contraffare,intercedere,prescrivere,retrocedere,trascrivere,compiangere,comprendere,congiungere,costringere,dischiudere,disgiungere,distinguere,distogliere,distruggere,manomettere,prediligere,racchiudere,raccogliere,raggiungere,rapprendere,restringere,riaccendere,riappendere,riconoscere,ridipingere,rinchiudere,rincrescere,risplendere,ristringere,scommettere,sconfiggere,sconnettere,scoscendere,socchiudere,soffriggere,soggiungere,sorprendere,stravincere,suddividere,trascendere,trascorrere,trasfondere,trasmettere¦7sti:credere,erodere,evadere,fervere,ristare,scadere,abdurre,addurre,battere,cernere,cherere,cingere,correre,dedurre,elidere,eludere,erigere,esigere,fendere,figgere,fingere,fottere,fremere,fungere,giacere,indurre,leggere,mescere,mettere,mietere,mingere,mordere,mungere,nascere,pascere,pendere,perdere,piacere,premere,prudere,pungere,reggere,rendere,rompere,sedurre,tangere,tendere,tessere,tingere,torcere,vendere,vertere,vincere¦4sti:dare,dire,fare¦5resti:decadere¦4eresti:roncare,bendare,berciare,cangiare,conciare,eredare,fasciare,fondare,forgiare,gradare,gridare,guadare,lasciare,linciare,mandare,mangiare,mondare,predare,privare,salvare,sondare¦3eresti:sciare,tifare,baciare,badare,bigiare,fidare,levare,mudare,ondare,pigiare,redare,sedare,sudare¦5sti:sfare,stare,unire¦15sti:accondiscendere¦9eresti:affaccendare¦2eresti:agiare¦5eresti:brindare,ossidare,sfondare¦12sti:circoncidere,crocifiggere,disattendere,disciogliere,disconoscere,fraintendere,intercorrere,interrompere,intromettere,prescegliere,sottomettere¦18sti:contraddistinguere¦2rresti:dolere,ducere,tenere,valere,venire,volere¦3rresti:educere¦14sti:sopraggiungere¦8eresti:sprofondare"
      },
      "third": {
        "fwd": "1erebbe:dare,ciare,vare,giare¦1rrebbe:enire,enere,olere,ucere,alere,anere¦2rebbe:piere,arere¦3bbe:rre¦4bbe:gere,mere,uere,bere,sere¦5bbe:ttere,ndere,rrere,udere,rdere,idere,ncere,rnere,erere,scere,stere,mpere,utere,acere,rcere,llere,icere,liere,evere,etere,gnere,rtere",
        "both": "5etterebbe:etrasmettere¦5bbe:sfare,gnire,rnire,lvere,efare,inire,onire,anire,unire¦4rebbe:ivivere,icadere,nvivere¦4bbe:vire,eire,gire,mire,pire,zire,sire,hire,uire,fire,bire,rire,cire,dire,tire,lire¦4erebbe:grafare¦3erebbe:hifare¦3rebbe:vedere¦2erebbe:ufare,nfare,uiare,ofare,siare,ziare,niare,miare,diare,riare,oiare,fiare,tiare,viare,biare,piare,liare,ffare,aiare,hiare¦2rebbe:apere,otere,overe¦1erebbe:bare,eare,mare,pare,uare,zare,tare,rare,sare,lare,nare¦1herebbe:gare,care",
        "rev": "3:arebbe¦4:orrebbe,oirebbe,nirebbe¦5:rgerebbe,lgerebbe,rarrebbe¦1ere:vrebbe¦1are:ferebbe¦2iare:ccerebbe,ggerebbe,ocerebbe,ucerebbe,lcerebbe,agerebbe,egerebbe,ogerebbe,ugerebbe¦2are:oderebbe,averebbe,ndrebbe,overebbe,rverebbe,dderebbe,lderebbe,cierebbe¦2nire:verrebbe¦2nere:terrebbe,marrebbe¦2ere:adrebbe,odrebbe,edrebbe¦2lere:varrebbe¦3are:orderebbe,fiderebbe,leverebbe,niderebbe,arderebbe,diderebbe,auderebbe,tiverebbe,gederebbe,nuderebbe,uiderebbe,biderebbe,piderebbe,liverebbe,hederebbe,hiverebbe¦3iare:ancerebbe,ficerebbe,figerebbe,uncerebbe,nicerebbe,iscerebbe,arcerebbe,ircerebbe,uscerebbe,engerebbe¦3cere:idurrebbe¦3ere:parrebbe¦4are:bonderebbe,hinderebbe,lungerebbe,rrederebbe,rriverebbe,linderebbe,manderebbe,oliderebbe,prederebbe,irederebbe,erederebbe,menderebbe,nonderebbe,aliderebbe,banderebbe,griderebbe,iciderebbe,uciderebbe¦4iare:cascerebbe,concerebbe,corcerebbe,loscerebbe,mincerebbe,adicerebbe,udicerebbe,lascerebbe,mangerebbe,vescerebbe,roscerebbe,fascerebbe,aligerebbe¦4ere:ompirebbe¦5iare:mbascerebbe,ombacerebbe¦5are:otonderebbe,econderebbe,rconderebbe,ifonderebbe",
        "ex": "sarebbe:essere¦8bbe:abradere,accedere,chiedere,decedere,eccedere,incedere,invadere,recedere,ricedere,scrivere,strafare,alludere,arridere,assidere,assumere,chierere,chiudere,clangere,cogliere,condurre,crescere,decidere,deludere,deridere,desumere,diligere,dirigere,dirimere,dividere,eleggere,emettere,erompere,escutere,esistere,evincere,flettere,frangere,friggere,giungere,illudere,imbevere,incidere,incutere,irridere,occidere,omettere,piangere,prendere,produrre,recidere,redigere,redimere,riardere,ricevere,ripetere,sbattere,scendere,scernere,scindere,scorrere,sfottere,smettere,spandere,spegnere,spendere,spingere,spremere,stendere,stingere,storcere,stridere,svellere,svendere,togliere,tradurre,uccidere¦6erebbe:allungare,affondare,ravvivare¦3rebbe:andare,cadere,godere,vedere,vivere,parere¦10bbe:antecedere,descrivere,dissuadere,inscrivere,persuadere,richiedere,riscrivere,sopraffare,sottostare,accogliere,accrescere,affliggere,affrangere,aggiungere,apprendere,astringere,benedicere,cognoscere,coincidere,combattere,commettere,compiacere,comprimere,compungere,concernere,concludere,concorrere,confondere,connettere,consistere,contendere,contorcere,convincere,correggere,corrompere,decrescere,delinquere,diffondere,discendere,discernere,discorrere,dismettere,disperdere,dispiacere,distendere,distorcere,estinguere,imprendere,infliggere,infrangere,ingiungere,introdurre,nascondere,percorrere,permettere,persistere,portendere,precludere,precorrere,prefiggere,premettere,prenascere,pretendere,profondere,promettere,propellere,propendere,prorompere,proteggere,protendere,rescindere,respingere,riassumere,ricogliere,ricondurre,ricrescere,rieleggere,riflettere,riprendere,riprodurre,rispingere,rispondere,sciogliere,sconoscere,soccombere,soccorrere,soggiacere,sommettere,sopprimere,sorreggere,sospendere,sospingere,sottendere,sussistere,trafiggere,tramettere,transigere¦9bbe:ascrivere,concedere,corrodere,iscrivere,pervadere,precedere,procedere,ricredere,risiedere,succedere,abbattere,accendere,accorrere,ammettere,annettere,appendere,ascendere,ascondere,assistere,attendere,attingere,attorcere,avvincere,collidere,colludere,competere,conoscere,decorrere,defungere,deprimere,desistere,difendere,dimettere,dipendere,dipingere,dirompere,discutere,divellere,eccellere,effondere,escludere,espandere,espellere,esprimere,espungere,estendere,estollere,estorcere,estrudere,immettere,imprimere,incendere,incingere,includere,incombere,incorrere,infiggere,infondere,insistere,intendere,intingere,intridere,intrudere,irrompere,negligere,occludere,occorrere,offendere,opprimere,ottundere,precidere,presumere,recingere,recludere,repellere,reprimere,resistere,ribattere,ricorrere,rileggere,rimettere,rimordere,rinascere,ritorcere,rivendere,rivincere,scegliere,schiudere,secernere,sorridere,sottacere,splendere,stringere,struggere¦2rebbe:avere¦6bbe:cedere,gioire,ledere,lenire,radere,ridare,rifare,ardere,gemere,licere,ridere,sumere,tacere,temere,ungere¦13bbe:circoscrivere,sottoscrivere,compromettere,controbattere,corrispondere,disconnettere,intraprendere,ricongiungere,ritrasmettere,soprintendere,sottintendere,sovrintendere¦11bbe:contraffare,intercedere,prescrivere,retrocedere,trascrivere,compiangere,comprendere,congiungere,costringere,dischiudere,disgiungere,distinguere,distogliere,distruggere,manomettere,prediligere,racchiudere,raccogliere,raggiungere,rapprendere,restringere,riaccendere,riappendere,riconoscere,ridipingere,rinchiudere,rincrescere,risplendere,ristringere,scommettere,sconfiggere,sconnettere,scoscendere,socchiudere,soffriggere,soggiungere,sorprendere,stravincere,suddividere,trascendere,trascorrere,trasfondere,trasmettere¦7bbe:credere,erodere,evadere,fervere,ristare,scadere,abdurre,addurre,battere,cernere,cherere,cingere,correre,dedurre,elidere,eludere,erigere,esigere,fendere,figgere,fingere,fottere,fremere,fungere,giacere,indurre,leggere,mescere,mettere,mietere,mingere,mordere,mungere,nascere,pascere,pendere,perdere,piacere,premere,prudere,pungere,reggere,rendere,rompere,sedurre,tangere,tendere,tessere,tingere,torcere,vendere,vertere,vincere¦4bbe:dare,dire,fare¦5rebbe:decadere¦4erebbe:roncare,bendare,berciare,cangiare,conciare,eredare,fasciare,fondare,forgiare,gradare,gridare,guadare,lasciare,linciare,mandare,mangiare,mondare,predare,privare,salvare,sondare¦3erebbe:sciare,tifare,baciare,badare,bigiare,fidare,levare,mudare,ondare,pigiare,redare,sedare,sudare¦5bbe:sfare,stare,unire¦12bbe:sopravvivere,circoncidere,crocifiggere,disattendere,disciogliere,disconoscere,fraintendere,intercorrere,interrompere,intromettere,prescegliere,sottomettere¦15bbe:accondiscendere¦9erebbe:affaccendare¦2erebbe:agiare¦5erebbe:avvivare,brindare,ossidare,sfondare¦18bbe:contraddistinguere¦2rrebbe:dolere,ducere,tenere,valere,venire,volere¦3rrebbe:educere¦14bbe:sopraggiungere¦8erebbe:sprofondare"
      },
      "firstPlural": {
        "fwd": "1eremmo:dare,ciare,vare,giare¦1rremmo:enire,enere,olere,ucere,alere,anere¦2remmo:piere,arere¦3mmo:rre¦4mmo:gere,mere,uere,bere,sere¦5mmo:ttere,ndere,rrere,udere,rdere,idere,ncere,rnere,erere,scere,stere,mpere,utere,acere,rcere,llere,icere,liere,evere,etere,gnere,rtere",
        "both": "5etteremmo:etrasmettere¦5mmo:sfare,gnire,rnire,lvere,efare,inire,onire,anire,unire¦4mmo:vire,eire,gire,mire,pire,zire,sire,hire,uire,fire,bire,rire,cire,dire,tire,lire¦4remmo:icadere¦4eremmo:grafare¦3eremmo:hifare¦3remmo:vedere,vivere¦2eremmo:ufare,nfare,uiare,ofare,siare,ziare,niare,miare,diare,riare,oiare,fiare,tiare,viare,biare,piare,liare,ffare,aiare,hiare¦2remmo:apere,otere,overe¦1eremmo:bare,eare,mare,pare,uare,zare,tare,rare,sare,lare,nare¦1heremmo:gare,care",
        "rev": "3:aremmo¦4:orremmo,oiremmo,niremmo¦5:rgeremmo,lgeremmo,rarremmo¦1ere:vremmo¦1are:feremmo¦2iare:cceremmo,ggeremmo,oceremmo,uceremmo,lceremmo,ageremmo,egeremmo,ogeremmo,ugeremmo¦2are:oderemmo,averemmo,ndremmo,overemmo,rveremmo,dderemmo,lderemmo,cieremmo¦2nire:verremmo¦2nere:terremmo,marremmo¦2ere:adremmo,odremmo,edremmo¦2lere:varremmo¦3are:orderemmo,fideremmo,leveremmo,nideremmo,viveremmo,arderemmo,dideremmo,auderemmo,tiveremmo,gederemmo,nuderemmo,uideremmo,bideremmo,pideremmo,liveremmo,hederemmo,hiveremmo¦3iare:anceremmo,ficeremmo,figeremmo,unceremmo,niceremmo,isceremmo,arceremmo,irceremmo,usceremmo,engeremmo¦3cere:idurremmo¦3ere:parremmo¦4are:bonderemmo,hinderemmo,lungeremmo,rrederemmo,rriveremmo,linderemmo,manderemmo,olideremmo,prederemmo,irederemmo,erederemmo,menderemmo,nonderemmo,alideremmo,banderemmo,grideremmo,icideremmo,ucideremmo¦4iare:casceremmo,conceremmo,corceremmo,losceremmo,minceremmo,adiceremmo,udiceremmo,lasceremmo,mangeremmo,vesceremmo,rosceremmo,fasceremmo,aligeremmo¦4ere:ompiremmo¦5iare:mbasceremmo,ombaceremmo¦5are:otonderemmo,econderemmo,rconderemmo,ifonderemmo",
        "ex": "saremmo:essere¦8mmo:abradere,accedere,chiedere,decedere,eccedere,incedere,invadere,recedere,ricedere,scrivere,strafare,alludere,arridere,assidere,assumere,chierere,chiudere,clangere,cogliere,condurre,crescere,decidere,deludere,deridere,desumere,diligere,dirigere,dirimere,dividere,eleggere,emettere,erompere,escutere,esistere,evincere,flettere,frangere,friggere,giungere,illudere,imbevere,incidere,incutere,irridere,occidere,omettere,piangere,prendere,produrre,recidere,redigere,redimere,riardere,ricevere,ripetere,sbattere,scendere,scernere,scindere,scorrere,sfottere,smettere,spandere,spegnere,spendere,spingere,spremere,stendere,stingere,storcere,stridere,svellere,svendere,togliere,tradurre,uccidere¦6eremmo:allungare,affondare¦3remmo:andare,cadere,godere,vedere,vivere,parere¦10mmo:antecedere,descrivere,dissuadere,inscrivere,persuadere,richiedere,riscrivere,sopraffare,sottostare,accogliere,accrescere,affliggere,affrangere,aggiungere,apprendere,astringere,benedicere,cognoscere,coincidere,combattere,commettere,compiacere,comprimere,compungere,concernere,concludere,concorrere,confondere,connettere,consistere,contendere,contorcere,convincere,correggere,corrompere,decrescere,delinquere,diffondere,discendere,discernere,discorrere,dismettere,disperdere,dispiacere,distendere,distorcere,estinguere,imprendere,infliggere,infrangere,ingiungere,introdurre,nascondere,percorrere,permettere,persistere,portendere,precludere,precorrere,prefiggere,premettere,prenascere,pretendere,profondere,promettere,propellere,propendere,prorompere,proteggere,protendere,rescindere,respingere,riassumere,ricogliere,ricondurre,ricrescere,rieleggere,riflettere,riprendere,riprodurre,rispingere,rispondere,sciogliere,sconoscere,soccombere,soccorrere,soggiacere,sommettere,sopprimere,sorreggere,sospendere,sospingere,sottendere,sussistere,trafiggere,tramettere,transigere¦9mmo:ascrivere,concedere,corrodere,iscrivere,pervadere,precedere,procedere,ricredere,risiedere,succedere,abbattere,accendere,accorrere,ammettere,annettere,appendere,ascendere,ascondere,assistere,attendere,attingere,attorcere,avvincere,collidere,colludere,competere,conoscere,decorrere,defungere,deprimere,desistere,difendere,dimettere,dipendere,dipingere,dirompere,discutere,divellere,eccellere,effondere,escludere,espandere,espellere,esprimere,espungere,estendere,estollere,estorcere,estrudere,immettere,imprimere,incendere,incingere,includere,incombere,incorrere,infiggere,infondere,insistere,intendere,intingere,intridere,intrudere,irrompere,negligere,occludere,occorrere,offendere,opprimere,ottundere,precidere,presumere,recingere,recludere,repellere,reprimere,resistere,ribattere,ricorrere,rileggere,rimettere,rimordere,rinascere,ritorcere,rivendere,rivincere,scegliere,schiudere,secernere,sorridere,sottacere,splendere,stringere,struggere¦2remmo:avere¦6mmo:cedere,gioire,ledere,lenire,radere,ridare,rifare,ardere,gemere,licere,ridere,sumere,tacere,temere,ungere¦13mmo:circoscrivere,sottoscrivere,compromettere,controbattere,corrispondere,disconnettere,intraprendere,ricongiungere,ritrasmettere,soprintendere,sottintendere,sovrintendere¦11mmo:contraffare,intercedere,prescrivere,retrocedere,trascrivere,compiangere,comprendere,congiungere,costringere,dischiudere,disgiungere,distinguere,distogliere,distruggere,manomettere,prediligere,racchiudere,raccogliere,raggiungere,rapprendere,restringere,riaccendere,riappendere,riconoscere,ridipingere,rinchiudere,rincrescere,risplendere,ristringere,scommettere,sconfiggere,sconnettere,scoscendere,socchiudere,soffriggere,soggiungere,sorprendere,stravincere,suddividere,trascendere,trascorrere,trasfondere,trasmettere¦7mmo:credere,erodere,evadere,fervere,ristare,scadere,abdurre,addurre,battere,cernere,cherere,cingere,correre,dedurre,elidere,eludere,erigere,esigere,fendere,figgere,fingere,fottere,fremere,fungere,giacere,indurre,leggere,mescere,mettere,mietere,mingere,mordere,mungere,nascere,pascere,pendere,perdere,piacere,premere,prudere,pungere,reggere,rendere,rompere,sedurre,tangere,tendere,tessere,tingere,torcere,vendere,vertere,vincere¦4mmo:dare,dire,fare¦5remmo:decadere¦4eremmo:roncare,bendare,berciare,cangiare,conciare,eredare,fasciare,fondare,forgiare,gradare,gridare,guadare,lasciare,linciare,mandare,mangiare,mondare,predare,privare,salvare,sondare¦3eremmo:sciare,tifare,baciare,badare,bigiare,fidare,levare,mudare,ondare,pigiare,redare,sedare,sudare¦5mmo:sfare,stare,unire¦15mmo:accondiscendere¦9eremmo:affaccendare¦2eremmo:agiare¦5eremmo:brindare,ossidare,sfondare¦12mmo:circoncidere,crocifiggere,disattendere,disciogliere,disconoscere,fraintendere,intercorrere,interrompere,intromettere,prescegliere,sottomettere¦18mmo:contraddistinguere¦2rremmo:dolere,ducere,tenere,valere,venire,volere¦3rremmo:educere¦14mmo:sopraggiungere¦8eremmo:sprofondare"
      },
      "secondPlural": {
        "fwd": "1ereste:dare,ciare,vare,giare¦1rreste:enire,enere,olere,ucere,alere,anere¦2reste:piere,arere¦3ste:rre¦4ste:gere,mere,uere,bere,sere¦5ste:ttere,ndere,rrere,udere,rdere,idere,ncere,rnere,erere,scere,stere,mpere,utere,acere,rcere,llere,icere,liere,evere,etere,gnere,rtere",
        "both": "5ettereste:etrasmettere¦5ste:sfare,gnire,rnire,lvere,efare,inire,onire,anire,unire¦4ste:vire,eire,gire,mire,pire,zire,sire,hire,uire,fire,bire,rire,cire,dire,tire,lire¦4reste:icadere¦4ereste:grafare¦3ereste:hifare¦3reste:vedere,vivere¦2ereste:ufare,nfare,uiare,ofare,siare,ziare,niare,miare,diare,riare,oiare,fiare,tiare,viare,biare,piare,liare,ffare,aiare,hiare¦2reste:apere,otere,overe¦1ereste:bare,eare,mare,pare,uare,zare,tare,rare,sare,lare,nare¦1hereste:gare,care",
        "rev": "3:areste¦4:orreste,oireste,nireste¦5:rgereste,lgereste,rarreste¦1ere:vreste¦1are:fereste¦2iare:ccereste,ggereste,ocereste,ucereste,lcereste,agereste,egereste,ogereste,ugereste¦2are:odereste,avereste,ndreste,overeste,rvereste,ddereste,ldereste,ciereste¦2nire:verreste¦2nere:terreste,marreste¦2ere:adreste,odreste,edreste¦2lere:varreste¦3are:ordereste,fidereste,levereste,nidereste,vivereste,ardereste,didereste,audereste,tivereste,gedereste,nudereste,uidereste,bidereste,pidereste,livereste,hedereste,hivereste¦3iare:ancereste,ficereste,figereste,uncereste,nicereste,iscereste,arcereste,ircereste,uscereste,engereste¦3cere:idurreste¦3ere:parreste¦4are:bondereste,hindereste,lungereste,rredereste,rrivereste,lindereste,mandereste,olidereste,predereste,iredereste,eredereste,mendereste,nondereste,alidereste,bandereste,gridereste,icidereste,ucidereste¦4iare:cascereste,concereste,corcereste,loscereste,mincereste,adicereste,udicereste,lascereste,mangereste,vescereste,roscereste,fascereste,aligereste¦4ere:ompireste¦5iare:mbascereste,ombacereste¦5are:otondereste,econdereste,rcondereste,ifondereste",
        "ex": "sareste:essere¦8ste:abradere,accedere,chiedere,decedere,eccedere,incedere,invadere,recedere,ricedere,scrivere,strafare,alludere,arridere,assidere,assumere,chierere,chiudere,clangere,cogliere,condurre,crescere,decidere,deludere,deridere,desumere,diligere,dirigere,dirimere,dividere,eleggere,emettere,erompere,escutere,esistere,evincere,flettere,frangere,friggere,giungere,illudere,imbevere,incidere,incutere,irridere,occidere,omettere,piangere,prendere,produrre,recidere,redigere,redimere,riardere,ricevere,ripetere,sbattere,scendere,scernere,scindere,scorrere,sfottere,smettere,spandere,spegnere,spendere,spingere,spremere,stendere,stingere,storcere,stridere,svellere,svendere,togliere,tradurre,uccidere¦6ereste:allungare,affondare¦3reste:andare,cadere,godere,vedere,vivere,parere¦10ste:antecedere,descrivere,dissuadere,inscrivere,persuadere,richiedere,riscrivere,sopraffare,sottostare,accogliere,accrescere,affliggere,affrangere,aggiungere,apprendere,astringere,benedicere,cognoscere,coincidere,combattere,commettere,compiacere,comprimere,compungere,concernere,concludere,concorrere,confondere,connettere,consistere,contendere,contorcere,convincere,correggere,corrompere,decrescere,delinquere,diffondere,discendere,discernere,discorrere,dismettere,disperdere,dispiacere,distendere,distorcere,estinguere,imprendere,infliggere,infrangere,ingiungere,introdurre,nascondere,percorrere,permettere,persistere,portendere,precludere,precorrere,prefiggere,premettere,prenascere,pretendere,profondere,promettere,propellere,propendere,prorompere,proteggere,protendere,rescindere,respingere,riassumere,ricogliere,ricondurre,ricrescere,rieleggere,riflettere,riprendere,riprodurre,rispingere,rispondere,sciogliere,sconoscere,soccombere,soccorrere,soggiacere,sommettere,sopprimere,sorreggere,sospendere,sospingere,sottendere,sussistere,trafiggere,tramettere,transigere¦9ste:ascrivere,concedere,corrodere,iscrivere,pervadere,precedere,procedere,ricredere,risiedere,succedere,abbattere,accendere,accorrere,ammettere,annettere,appendere,ascendere,ascondere,assistere,attendere,attingere,attorcere,avvincere,collidere,colludere,competere,conoscere,decorrere,defungere,deprimere,desistere,difendere,dimettere,dipendere,dipingere,dirompere,discutere,divellere,eccellere,effondere,escludere,espandere,espellere,esprimere,espungere,estendere,estollere,estorcere,estrudere,immettere,imprimere,incendere,incingere,includere,incombere,incorrere,infiggere,infondere,insistere,intendere,intingere,intridere,intrudere,irrompere,negligere,occludere,occorrere,offendere,opprimere,ottundere,precidere,presumere,recingere,recludere,repellere,reprimere,resistere,ribattere,ricorrere,rileggere,rimettere,rimordere,rinascere,ritorcere,rivendere,rivincere,scegliere,schiudere,secernere,sorridere,sottacere,splendere,stringere,struggere¦2reste:avere¦6ste:cedere,gioire,ledere,lenire,radere,ridare,rifare,ardere,gemere,licere,ridere,sumere,tacere,temere,ungere¦13ste:circoscrivere,sottoscrivere,compromettere,controbattere,corrispondere,disconnettere,intraprendere,ricongiungere,ritrasmettere,soprintendere,sottintendere,sovrintendere¦11ste:contraffare,intercedere,prescrivere,retrocedere,trascrivere,compiangere,comprendere,congiungere,costringere,dischiudere,disgiungere,distinguere,distogliere,distruggere,manomettere,prediligere,racchiudere,raccogliere,raggiungere,rapprendere,restringere,riaccendere,riappendere,riconoscere,ridipingere,rinchiudere,rincrescere,risplendere,ristringere,scommettere,sconfiggere,sconnettere,scoscendere,socchiudere,soffriggere,soggiungere,sorprendere,stravincere,suddividere,trascendere,trascorrere,trasfondere,trasmettere¦7ste:credere,erodere,evadere,fervere,ristare,scadere,abdurre,addurre,battere,cernere,cherere,cingere,correre,dedurre,elidere,eludere,erigere,esigere,fendere,figgere,fingere,fottere,fremere,fungere,giacere,indurre,leggere,mescere,mettere,mietere,mingere,mordere,mungere,nascere,pascere,pendere,perdere,piacere,premere,prudere,pungere,reggere,rendere,rompere,sedurre,tangere,tendere,tessere,tingere,torcere,vendere,vertere,vincere¦4ste:dare,dire,fare¦5reste:decadere¦4ereste:roncare,bendare,berciare,cangiare,conciare,eredare,fasciare,fondare,forgiare,gradare,gridare,guadare,lasciare,linciare,mandare,mangiare,mondare,predare,privare,salvare,sondare¦3ereste:sciare,tifare,baciare,badare,bigiare,fidare,levare,mudare,ondare,pigiare,redare,sedare,sudare¦5ste:sfare,stare,unire¦15ste:accondiscendere¦9ereste:affaccendare¦2ereste:agiare¦5ereste:brindare,ossidare,sfondare¦12ste:circoncidere,crocifiggere,disattendere,disciogliere,disconoscere,fraintendere,intercorrere,interrompere,intromettere,prescegliere,sottomettere¦18ste:contraddistinguere¦2rreste:dolere,ducere,tenere,valere,venire,volere¦3rreste:educere¦14ste:sopraggiungere¦8ereste:sprofondare"
      },
      "thirdPlural": {
        "fwd": "1erebbero:dare,ciare,vare,giare¦1rrebbero:enire,enere,olere,ucere,alere,anere¦2rebbero:piere,arere¦3bbero:rre¦4bbero:gere,mere,uere,bere,sere¦5bbero:ttere,ndere,rrere,udere,rdere,idere,ncere,rnere,erere,scere,stere,mpere,utere,acere,rcere,llere,icere,liere,evere,etere,gnere,rtere",
        "both": "5etterebbero:etrasmettere¦5bbero:sfare,gnire,rnire,lvere,efare,inire,onire,anire,unire¦4bbero:vire,eire,gire,mire,pire,zire,sire,hire,uire,fire,bire,rire,cire,dire,tire,lire¦4rebbero:icadere¦4erebbero:grafare¦3erebbero:hifare¦3rebbero:vedere,vivere¦2erebbero:ufare,nfare,uiare,ofare,siare,ziare,niare,miare,diare,riare,oiare,fiare,tiare,viare,biare,piare,liare,ffare,aiare,hiare¦2rebbero:apere,otere,overe¦1erebbero:bare,eare,mare,pare,uare,zare,tare,rare,sare,lare,nare¦1herebbero:gare,care",
        "rev": "3:arebbero¦4:orrebbero,oirebbero,nirebbero¦5:rgerebbero,lgerebbero,rarrebbero¦1ere:vrebbero¦1are:ferebbero¦2iare:ccerebbero,ggerebbero,ocerebbero,ucerebbero,lcerebbero,agerebbero,egerebbero,ogerebbero,ugerebbero¦2are:oderebbero,averebbero,ndrebbero,overebbero,rverebbero,dderebbero,lderebbero,cierebbero¦2nire:verrebbero¦2nere:terrebbero,marrebbero¦2ere:adrebbero,odrebbero,edrebbero¦2lere:varrebbero¦3are:orderebbero,fiderebbero,leverebbero,niderebbero,viverebbero,arderebbero,diderebbero,auderebbero,tiverebbero,gederebbero,nuderebbero,uiderebbero,biderebbero,piderebbero,liverebbero,hederebbero,hiverebbero¦3iare:ancerebbero,ficerebbero,figerebbero,uncerebbero,nicerebbero,iscerebbero,arcerebbero,ircerebbero,uscerebbero,engerebbero¦3cere:idurrebbero¦3ere:parrebbero¦4are:bonderebbero,hinderebbero,lungerebbero,rrederebbero,rriverebbero,linderebbero,manderebbero,oliderebbero,prederebbero,irederebbero,erederebbero,menderebbero,nonderebbero,aliderebbero,banderebbero,griderebbero,iciderebbero,uciderebbero¦4iare:cascerebbero,concerebbero,corcerebbero,loscerebbero,mincerebbero,adicerebbero,udicerebbero,lascerebbero,mangerebbero,vescerebbero,roscerebbero,fascerebbero,aligerebbero¦4ere:ompirebbero¦5iare:mbascerebbero,ombacerebbero¦5are:otonderebbero,econderebbero,rconderebbero,ifonderebbero",
        "ex": "sarebbero:essere¦8bbero:abradere,accedere,chiedere,decedere,eccedere,incedere,invadere,recedere,ricedere,scrivere,strafare,alludere,arridere,assidere,assumere,chierere,chiudere,clangere,cogliere,condurre,crescere,decidere,deludere,deridere,desumere,diligere,dirigere,dirimere,dividere,eleggere,emettere,erompere,escutere,esistere,evincere,flettere,frangere,friggere,giungere,illudere,imbevere,incidere,incutere,irridere,occidere,omettere,piangere,prendere,produrre,recidere,redigere,redimere,riardere,ricevere,ripetere,sbattere,scendere,scernere,scindere,scorrere,sfottere,smettere,spandere,spegnere,spendere,spingere,spremere,stendere,stingere,storcere,stridere,svellere,svendere,togliere,tradurre,uccidere¦6erebbero:allungare,affondare¦3rebbero:andare,cadere,godere,vedere,vivere,parere¦10bbero:antecedere,descrivere,dissuadere,inscrivere,persuadere,richiedere,riscrivere,sopraffare,sottostare,accogliere,accrescere,affliggere,affrangere,aggiungere,apprendere,astringere,benedicere,cognoscere,coincidere,combattere,commettere,compiacere,comprimere,compungere,concernere,concludere,concorrere,confondere,connettere,consistere,contendere,contorcere,convincere,correggere,corrompere,decrescere,delinquere,diffondere,discendere,discernere,discorrere,dismettere,disperdere,dispiacere,distendere,distorcere,estinguere,imprendere,infliggere,infrangere,ingiungere,introdurre,nascondere,percorrere,permettere,persistere,portendere,precludere,precorrere,prefiggere,premettere,prenascere,pretendere,profondere,promettere,propellere,propendere,prorompere,proteggere,protendere,rescindere,respingere,riassumere,ricogliere,ricondurre,ricrescere,rieleggere,riflettere,riprendere,riprodurre,rispingere,rispondere,sciogliere,sconoscere,soccombere,soccorrere,soggiacere,sommettere,sopprimere,sorreggere,sospendere,sospingere,sottendere,sussistere,trafiggere,tramettere,transigere¦9bbero:ascrivere,concedere,corrodere,iscrivere,pervadere,precedere,procedere,ricredere,risiedere,succedere,abbattere,accendere,accorrere,ammettere,annettere,appendere,ascendere,ascondere,assistere,attendere,attingere,attorcere,avvincere,collidere,colludere,competere,conoscere,decorrere,defungere,deprimere,desistere,difendere,dimettere,dipendere,dipingere,dirompere,discutere,divellere,eccellere,effondere,escludere,espandere,espellere,esprimere,espungere,estendere,estollere,estorcere,estrudere,immettere,imprimere,incendere,incingere,includere,incombere,incorrere,infiggere,infondere,insistere,intendere,intingere,intridere,intrudere,irrompere,negligere,occludere,occorrere,offendere,opprimere,ottundere,precidere,presumere,recingere,recludere,repellere,reprimere,resistere,ribattere,ricorrere,rileggere,rimettere,rimordere,rinascere,ritorcere,rivendere,rivincere,scegliere,schiudere,secernere,sorridere,sottacere,splendere,stringere,struggere¦2rebbero:avere¦6bbero:cedere,gioire,ledere,lenire,radere,ridare,rifare,ardere,gemere,licere,ridere,sumere,tacere,temere,ungere¦13bbero:circoscrivere,sottoscrivere,compromettere,controbattere,corrispondere,disconnettere,intraprendere,ricongiungere,ritrasmettere,soprintendere,sottintendere,sovrintendere¦11bbero:contraffare,intercedere,prescrivere,retrocedere,trascrivere,compiangere,comprendere,congiungere,costringere,dischiudere,disgiungere,distinguere,distogliere,distruggere,manomettere,prediligere,racchiudere,raccogliere,raggiungere,rapprendere,restringere,riaccendere,riappendere,riconoscere,ridipingere,rinchiudere,rincrescere,risplendere,ristringere,scommettere,sconfiggere,sconnettere,scoscendere,socchiudere,soffriggere,soggiungere,sorprendere,stravincere,suddividere,trascendere,trascorrere,trasfondere,trasmettere¦7bbero:credere,erodere,evadere,fervere,ristare,scadere,abdurre,addurre,battere,cernere,cherere,cingere,correre,dedurre,elidere,eludere,erigere,esigere,fendere,figgere,fingere,fottere,fremere,fungere,giacere,indurre,leggere,mescere,mettere,mietere,mingere,mordere,mungere,nascere,pascere,pendere,perdere,piacere,premere,prudere,pungere,reggere,rendere,rompere,sedurre,tangere,tendere,tessere,tingere,torcere,vendere,vertere,vincere¦4bbero:dare,dire,fare¦5rebbero:decadere¦4erebbero:roncare,bendare,berciare,cangiare,conciare,eredare,fasciare,fondare,forgiare,gradare,gridare,guadare,lasciare,linciare,mandare,mangiare,mondare,predare,privare,salvare,sondare¦3erebbero:sciare,tifare,baciare,badare,bigiare,fidare,levare,mudare,ondare,pigiare,redare,sedare,sudare¦5bbero:sfare,stare,unire¦15bbero:accondiscendere¦9erebbero:affaccendare¦2erebbero:agiare¦5erebbero:brindare,ossidare,sfondare¦12bbero:circoncidere,crocifiggere,disattendere,disciogliere,disconoscere,fraintendere,intercorrere,interrompere,intromettere,prescegliere,sottomettere¦18bbero:contraddistinguere¦2rrebbero:dolere,ducere,tenere,valere,venire,volere¦3rrebbero:educere¦14bbero:sopraggiungere¦8erebbero:sprofondare"
      }
    },
    "imperfect": {
      "first": {
        "fwd": "1cevo:urre¦2vo:piere",
        "both": "5cevo:trafare,terdire¦3cevo:efare,sfare,ddire¦1evo:arre¦1nevo:orre¦vo:re",
        "rev": "ssere:ro¦1mettere:settevo¦2re:facevo¦3rre:bducevo,nducevo,oducevo,aducevo¦3re:ndicevo¦4ere:ompivo¦4re:redicevo",
        "ex": "2vevo:bere¦9cevo:contraffare¦2cevo:dire,fare¦1ro:essere¦4cevo:indire,ridire,rifare,addurre,dedurre,sedurre¦5cevo:predire¦3cevo:sfare¦8cevo:sopraffare¦8ettevo:teletrasmettere"
      },
      "second": {
        "fwd": "1cevi:urre¦2vi:piere",
        "both": "5cevi:trafare,terdire¦3cevi:efare,sfare,ddire¦1evi:arre¦1nevi:orre¦vi:re",
        "rev": "ssere:ri¦1mettere:settevi¦2re:facevi¦3rre:bducevi,nducevi,oducevi,aducevi¦3re:ndicevi¦4ere:ompivi¦4re:redicevi",
        "ex": "2vevi:bere¦9cevi:contraffare¦2cevi:dire,fare¦1ri:essere¦4cevi:indire,ridire,rifare,addurre,dedurre,sedurre¦5cevi:predire¦3cevi:sfare¦8cevi:sopraffare¦8ettevi:teletrasmettere"
      },
      "third": {
        "fwd": "1ceva:urre¦2va:piere",
        "both": "5ceva:trafare,terdire¦3ceva:efare,sfare,ddire¦1eva:arre¦1neva:orre¦va:re",
        "rev": "ssere:ra¦1mettere:setteva¦2re:faceva¦3rre:bduceva,nduceva,oduceva,aduceva¦3re:ndiceva¦4ere:ompiva¦4re:rediceva",
        "ex": "2veva:bere¦9ceva:contraffare¦2ceva:dire,fare¦1ra:essere¦4ceva:indire,ridire,rifare,addurre,dedurre,sedurre¦5ceva:predire¦3ceva:sfare¦8ceva:sopraffare¦8etteva:teletrasmettere"
      },
      "firstPlural": {
        "fwd": "1cevamo:urre¦2vamo:piere",
        "both": "5cevamo:trafare,terdire¦3cevamo:efare,sfare,ddire¦1evamo:arre¦1nevamo:orre¦vamo:re",
        "rev": "1mettere:settevamo¦2re:facevamo¦3rre:bducevamo,nducevamo,oducevamo,aducevamo¦3re:ndicevamo¦4ere:ompivamo¦4re:redicevamo",
        "ex": "2vevamo:bere¦9cevamo:contraffare¦2cevamo:dire,fare¦1ravamo:essere¦4cevamo:indire,ridire,rifare,addurre,dedurre,sedurre¦5cevamo:predire¦3cevamo:sfare¦8cevamo:sopraffare¦8ettevamo:teletrasmettere"
      },
      "secondPlural": {
        "fwd": "1cevate:urre¦2vate:piere",
        "both": "5cevate:trafare,terdire¦3cevate:efare,sfare,ddire¦1evate:arre¦1nevate:orre¦vate:re",
        "rev": "1mettere:settevate¦2re:facevate¦3rre:bducevate,nducevate,oducevate,aducevate¦3re:ndicevate¦4ere:ompivate¦4re:redicevate",
        "ex": "2vevate:bere¦9cevate:contraffare¦2cevate:dire,fare¦1ravate:essere¦4cevate:indire,ridire,rifare,addurre,dedurre,sedurre¦5cevate:predire¦3cevate:sfare¦8cevate:sopraffare¦8ettevate:teletrasmettere"
      },
      "thirdPlural": {
        "fwd": "1cevano:urre¦2vano:piere",
        "both": "5cevano:trafare,terdire¦3cevano:efare,sfare,ddire¦1evano:arre¦1nevano:orre¦vano:re",
        "rev": "ssere:rano¦1mettere:settevano¦2re:facevano¦3rre:bducevano,nducevano,oducevano,aducevano¦3re:ndicevano¦4ere:ompivano¦4re:redicevano",
        "ex": "2vevano:bere¦9cevano:contraffare¦2cevano:dire,fare¦1rano:essere¦4cevano:indire,ridire,rifare,addurre,dedurre,sedurre¦5cevano:predire¦3cevano:sfare¦8cevano:sopraffare¦8ettevano:teletrasmettere"
      }
    },
    "subjunctive": {
      "first": {
        "fwd": "1:iare¦a:ere¦lga:gliere¦esca:uscire¦1ca:urre¦1i:lare,bare¦1ia:arere¦1a:vire¦2i:ffare,nfare¦2ga:enire,enere,alere,anere¦2cia:acere¦2a:guire¦3a:mpire",
        "both": "5etta:etrasmettere¦5ccia:trafare¦5sca:ientire,mentire,bustire,ristire,signire,rugnire,ircuire,lestire,dolcire¦5a:ipartire¦4ia:tostare¦4ga:isalire¦4a:fuggire,bollire,vestire,sentire,borrire¦4ca:ledire¦4sca:retire,ontire,rocire,sprire,uarire,ermire,arrire,iarire,ortire,ostire,antire¦4i:grafare¦3sca:grire,ltire,ncire,atire,agire,tuire,quire,rcire,trire,emire,ruire,rnire,urire,nuire,buire,luire,orire,unire,inire,ttire,erire,anire,utire,onire¦3i:hifare,bliare,spiare,esiare¦3a:ormire,ucire,ertire¦3ccia:sfare,efare¦3ca:ddire¦2i:ufare,ofare¦2pia:apere¦2a:frire,prire¦2uchi:anicare¦2sca:eire,oire,pire,zire,hire,sire,fire,bire,dire,lire¦2ia:parire¦1glia:olere¦1ieda:sedere¦1ssa:otere¦1gga:arre¦1nga:orre¦1i:eare,vare,mare,sare,dare,pare,uare,zare,tare,rare,nare¦1hi:gare,care",
        "rev": "vere:bbia¦orire:uoia¦1re:isca¦1ere:va,na,pa¦1are:ii,dia,tia¦1uscire:iesca¦1gliere:elga¦2are:ai,oli,ci,lli,uli,gi,rbi,eli,oi,bli,rli,ali,ibi,ubi,obi,abi,ifi¦2ere:ada,uda,nda,ida,rga,uma,rca,nca,era,eta,ima,oda,qua,iga,uta,rda,ema,mba,lca¦2gliere:colga,iolga,tolga¦2rre:duca¦2re:faccia¦2ire:nta,rba¦3are:gli,uffi,fili,ungi,effi,pili,izi,tili,ozi,vvi,ombi,nvi,azi,obbi,iffi¦3ere:atta,ceda,unga,tenga,ista,inga,osca,iaccia,egga,reda,igga,ella,valga,otta,ulga,manga,asca,veda,essa¦3ire:venga,salga,egua,arta,esta¦3re:ndica,rdica,idica¦4are:revi,ibbi,mali,sedi,vari,emmi,unni,medi,ambi,comi,sili,ubili,ipri,furi,arsi,tari,equi,bbui,pudi,iaffi,ibili,offi,oqui,orpi,ionfi,igili¦4ere:corra,netta,volga,hieda,langa,ianga,metta,resca,ingua,tolla,letta,ranga,iduca,rugga¦4ire:angua,serva¦4re:redica¦5are:coppi,nisti,naffi,ropri,rabbi,simili,ncili,templi,ilani,tanzi,patri,nanzi,ocopi,ulebbi,nebri,gabbi,nsidi,nvidi,rradi,cenzi,arodi,tenzi,icopi,borni,gonfi,pendi,trani,rebbi¦5ere:nedica",
        "ex": "3:odiare,oliare,oziare¦4:ambiare,cariare,coniare,copiare,enfiare,mediare,radiare,tediare,variare¦5:ampliare,doppiare,gloriare,gonfiare,pazziare,seppiare,smaniare,studiare,traviare,umiliare¦6:bacchiare,fischiare,graffiare,macchiare,mischiare,nicchiare,raschiare,rischiare,succhiare¦7:adocchiare,angustiare,annebbiare,archiviare,crocchiare,divorziare,incendiare,ingiuriare,orecchiare,specchiare,sussidiare,svecchiare¦8:abbacchiare,accerchiare,ammucchiare,arrischiare,avvinghiare,bevicchiare,bofonchiare,contrariare,evidenziare,invecchiare,invischiare,presenziare,principiare,rimorchiare,rosicchiare,soverchiare,strabiliare¦9:accalappiare,canticchiare,cincischiare,dormicchiare,mordicchiare,punzecchiare,rannicchiare,rispecchiare,scoperchiare,sonnecchiare,sparecchiare,sputacchiare,testimoniare¦10:apparecchiare,bruciacchiare,infinocchiare,mangiucchiare¦&#8212;:accadere¦vada:andare¦sia:essere¦ea:ire¦oda:udire¦esca:uscire¦3sca:agire,unire¦6i:allungare,arraffare¦5sca:arguire,gestire,muggire,ruggire,sparire¦5ga:assalire¦1bbia:avere¦4i:avviare,deviare,inviare,roncare,gabbare,ronfare¦2va:bere¦4a:bollire,fuggire,mentire,partire,sentire,vestire,correre,educere,empire,mescere,mettere,servire,tangere,vertere,volgere¦9ccia:contraffare¦1ia:dare¦2ca:dire¦2ccia:fare¦7sca:imbastire,impartire¦4ca:indire,ridire¦7ca:interdire¦4sca:lenire¦1uoia:morire¦5ca:predire¦1ieda:redire¦8a:riassorbire¦3ia:ridare,sparere¦4ccia:rifare¦4ia:ristare¦3ga:salire,tenere,valere,venire¦3i:sciare,spiare,sviare,tifare,filare¦3ccia:sfare¦8ccia:sopraffare¦6sca:spartire¦2ia:stare,parere¦2i:alare¦3a:algere,cedere,ducere,ledere,licere,ungere¦2lga:cogliere,togliere¦5a:compiere¦5i:fucilare¦6a:riempire"
      },
      "second": {
        "fwd": "1:iare¦a:ere¦lga:gliere¦esca:uscire¦1ca:urre¦1i:lare,bare¦1ia:arere¦1a:vire¦2i:ffare,nfare¦2ga:enire,enere,alere,anere¦2cia:acere¦2a:guire¦3a:mpire",
        "both": "5etta:etrasmettere¦5ccia:trafare¦5sca:ientire,mentire,bustire,ristire,signire,rugnire,ircuire,lestire,dolcire¦5a:ipartire¦4ia:tostare¦4ga:isalire¦4a:fuggire,bollire,vestire,sentire,borrire¦4ca:ledire¦4sca:retire,ontire,rocire,sprire,uarire,ermire,arrire,iarire,ortire,ostire,antire¦4i:grafare¦3sca:grire,ltire,ncire,atire,agire,tuire,quire,rcire,trire,emire,ruire,rnire,urire,nuire,buire,luire,orire,unire,inire,ttire,erire,anire,utire,onire¦3i:hifare,bliare,spiare,esiare¦3a:ormire,ucire,ertire¦3ccia:sfare,efare¦3ca:ddire¦2i:ufare,ofare¦2pia:apere¦2a:frire,prire¦2uchi:anicare¦2sca:eire,oire,pire,zire,hire,sire,fire,bire,dire,lire¦2ia:parire¦1glia:olere¦1ieda:sedere¦1ssa:otere¦1gga:arre¦1nga:orre¦1i:eare,vare,mare,sare,dare,pare,uare,zare,tare,rare,nare¦1hi:gare,care",
        "rev": "vere:bbia¦orire:uoia¦1re:isca¦1ere:va,na,pa¦1are:ii,dia,tia¦1uscire:iesca¦1gliere:elga¦2are:ai,oli,ci,lli,uli,gi,rbi,eli,oi,bli,rli,ali,ibi,ubi,obi,abi,ifi¦2ere:ada,uda,nda,ida,rga,uma,rca,nca,era,eta,ima,oda,qua,iga,uta,rda,ema,mba,lca¦2gliere:colga,iolga,tolga¦2rre:duca¦2re:faccia¦2ire:nta,rba¦3are:gli,uffi,fili,ungi,effi,pili,izi,tili,ozi,vvi,ombi,nvi,azi,obbi,iffi¦3ere:atta,ceda,unga,tenga,ista,inga,osca,iaccia,egga,reda,igga,ella,valga,otta,ulga,manga,asca,veda,essa¦3ire:venga,salga,egua,arta,esta¦3re:ndica,rdica,idica¦4are:revi,ibbi,mali,sedi,vari,emmi,unni,medi,ambi,comi,sili,ubili,ipri,furi,arsi,tari,equi,bbui,pudi,iaffi,ibili,offi,oqui,orpi,ionfi,igili¦4ere:corra,netta,volga,hieda,langa,ianga,metta,resca,ingua,tolla,letta,ranga,iduca,rugga¦4ire:angua,serva¦4re:redica¦5are:coppi,nisti,naffi,ropri,rabbi,simili,ncili,templi,ilani,tanzi,patri,nanzi,ocopi,ulebbi,nebri,gabbi,nsidi,nvidi,rradi,cenzi,arodi,tenzi,icopi,borni,gonfi,pendi,trani,rebbi¦5ere:nedica",
        "ex": "3:odiare,oliare,oziare¦4:ambiare,cariare,coniare,copiare,enfiare,mediare,radiare,tediare,variare¦5:ampliare,doppiare,gloriare,gonfiare,pazziare,seppiare,smaniare,studiare,traviare,umiliare¦6:bacchiare,fischiare,graffiare,macchiare,mischiare,nicchiare,raschiare,rischiare,succhiare¦7:adocchiare,angustiare,annebbiare,archiviare,crocchiare,divorziare,incendiare,ingiuriare,orecchiare,specchiare,sussidiare,svecchiare¦8:abbacchiare,accerchiare,ammucchiare,arrischiare,avvinghiare,bevicchiare,bofonchiare,contrariare,evidenziare,invecchiare,invischiare,presenziare,principiare,rimorchiare,rosicchiare,soverchiare,strabiliare¦9:accalappiare,canticchiare,cincischiare,dormicchiare,mordicchiare,punzecchiare,rannicchiare,rispecchiare,scoperchiare,sonnecchiare,sparecchiare,sputacchiare,testimoniare¦10:apparecchiare,bruciacchiare,infinocchiare,mangiucchiare¦&#8212;:accadere¦vada:andare¦sia:essere¦ea:ire¦oda:udire¦esca:uscire¦3sca:agire,unire¦6i:allungare,arraffare¦5sca:arguire,gestire,muggire,ruggire,sparire¦5ga:assalire¦1bbia:avere¦4i:avviare,deviare,inviare,roncare,gabbare,ronfare¦2va:bere¦4a:bollire,fuggire,mentire,partire,sentire,vestire,correre,educere,empire,mescere,mettere,servire,tangere,vertere,volgere¦9ccia:contraffare¦1ia:dare¦2ca:dire¦2ccia:fare¦7sca:imbastire,impartire¦4ca:indire,ridire¦7ca:interdire¦4sca:lenire¦1uoia:morire¦5ca:predire¦1ieda:redire¦8a:riassorbire¦3ia:ridare,sparere¦4ccia:rifare¦4ia:ristare¦3ga:salire,tenere,valere,venire¦3i:sciare,spiare,sviare,tifare,filare¦3ccia:sfare¦8ccia:sopraffare¦6sca:spartire¦2ia:stare,parere¦2i:alare¦3a:algere,cedere,ducere,ledere,licere,ungere¦2lga:cogliere,togliere¦5a:compiere¦5i:fucilare¦6a:riempire"
      },
      "third": {
        "fwd": "1:iare¦a:ere¦lga:gliere¦esca:uscire¦1ca:urre¦1i:lare,bare¦1ia:arere¦1a:vire¦2i:ffare,nfare¦2ga:enire,enere,alere,anere¦2cia:acere¦2a:guire¦3a:mpire",
        "both": "5etta:etrasmettere¦5ccia:trafare¦5sca:ientire,mentire,bustire,ristire,signire,rugnire,ircuire,lestire,dolcire¦5a:ipartire¦4ia:tostare¦4ga:isalire¦4a:fuggire,bollire,vestire,sentire,borrire¦4ca:ledire¦4sca:retire,ontire,rocire,sprire,uarire,ermire,arrire,iarire,ortire,ostire,antire¦4i:grafare¦3sca:grire,ltire,ncire,atire,agire,tuire,quire,rcire,trire,emire,ruire,rnire,urire,nuire,buire,luire,orire,unire,inire,ttire,erire,anire,utire,onire¦3i:hifare,bliare,spiare,esiare¦3a:ormire,ucire,ertire¦3ccia:sfare,efare¦3ca:ddire¦2pia:apere¦2a:frire,prire¦2uchi:anicare¦2sca:eire,oire,pire,zire,hire,sire,fire,bire,dire,lire¦2i:ofare,ufare¦2ia:parire¦1glia:olere¦1ieda:sedere¦1ssa:otere¦1gga:arre¦1nga:orre¦1i:eare,vare,mare,sare,dare,pare,uare,zare,tare,rare,nare¦1hi:gare,care",
        "rev": "vere:bbia¦orire:uoia¦1re:isca¦1ere:va,na,pa¦1are:ii,dia,tia¦1uscire:iesca¦1gliere:elga¦2are:ai,oli,ci,lli,uli,gi,rbi,eli,oi,bli,rli,ali,ibi,ubi,obi,abi,ifi¦2ere:ada,uda,nda,ida,rga,uma,rca,nca,era,eta,ima,oda,qua,iga,uta,rda,ema,mba,lca¦2gliere:colga,iolga,tolga¦2rre:duca¦2re:faccia¦2ire:nta,rba¦3are:gli,uffi,fili,ungi,effi,pili,izi,uvi,tili,ozi,vvi,ombi,nvi,azi,obbi,iffi¦3ere:atta,ceda,unga,tenga,ista,inga,osca,iaccia,egga,reda,igga,ella,valga,otta,ulga,manga,asca,veda,essa¦3ire:venga,salga,egua,arta,esta¦3re:ndica,rdica,idica¦4are:revi,ibbi,mali,sedi,vari,emmi,unni,medi,ambi,comi,sili,ubili,ipri,furi,arsi,tari,equi,bbui,pudi,iaffi,ibili,offi,oqui,orpi,ionfi,igili¦4ere:corra,netta,volga,hieda,langa,ianga,metta,resca,ingua,tolla,letta,ranga,iduca,rugga¦4ire:angua,serva¦4re:redica¦5are:coppi,nisti,naffi,ropri,rabbi,simili,ncili,templi,ilani,tanzi,patri,nanzi,ocopi,ulebbi,nebri,gabbi,nsidi,nvidi,rradi,cenzi,arodi,tenzi,icopi,borni,gonfi,pendi,trani,rebbi¦5ere:nedica",
        "ex": "3:odiare,oliare,oziare¦4:nevare,ambiare,cariare,coniare,copiare,enfiare,mediare,radiare,tediare,variare¦5:ampliare,doppiare,gloriare,gonfiare,pazziare,seppiare,smaniare,studiare,traviare,umiliare¦6:bacchiare,fischiare,graffiare,macchiare,mischiare,nicchiare,raschiare,rischiare,succhiare¦7:adocchiare,angustiare,annebbiare,archiviare,crocchiare,divorziare,incendiare,ingiuriare,orecchiare,specchiare,sussidiare,svecchiare¦8:abbacchiare,accerchiare,ammucchiare,arrischiare,avvinghiare,bevicchiare,bofonchiare,contrariare,evidenziare,invecchiare,invischiare,nevischiare,presenziare,principiare,rimorchiare,rosicchiare,soverchiare,strabiliare¦9:accalappiare,canticchiare,cincischiare,dormicchiare,mordicchiare,punzecchiare,rannicchiare,rispecchiare,scoperchiare,sonnecchiare,sparecchiare,sputacchiare,testimoniare¦10:apparecchiare,bruciacchiare,infinocchiare,mangiucchiare¦vada:andare¦&#8212;:arrogere¦sia:essere¦ea:ire¦oda:udire¦esca:uscire¦3sca:agire,unire¦6i:allungare,arraffare¦5sca:arguire,gestire,muggire,ruggire,sparire¦5ga:assalire¦1bbia:avere¦4i:avviare,deviare,inviare,roncare,gabbare,ronfare¦2va:bere¦4a:bollire,fuggire,mentire,partire,sentire,vestire,correre,educere,empire,mescere,mettere,servire,tangere,vertere,volgere¦9ccia:contraffare¦1ia:dare¦2ca:dire¦2ccia:fare¦7sca:imbastire,impartire¦4ca:indire,ridire¦7ca:interdire¦4sca:lenire¦1uoia:morire¦5ca:predire¦1ieda:redire¦8a:riassorbire¦3ia:ridare,sparere¦4ccia:rifare¦4ia:ristare¦3ga:salire,tenere,valere,venire¦3i:sciare,spiare,sviare,tifare,filare¦3ccia:sfare¦8ccia:sopraffare¦6sca:spartire¦2ia:stare,parere¦2i:alare¦3a:algere,cedere,ducere,ledere,licere,ungere¦2lga:cogliere,togliere¦5a:compiere¦5i:fucilare¦6a:riempire"
      },
      "firstPlural": {
        "fwd": "iamo:ere¦1iamo:nare,lare,rare,tare,dare,pare,mare,bare,uare,vare,arre,arere¦1amo:ire,iere¦1niamo:orre¦1ciamo:urre¦1ssiamo:otere¦1gliamo:olere¦2mo:iare¦2iamo:ffare,nfare¦2ciamo:acere¦2piamo:apere",
        "both": "5cciamo:trafare¦5ciamo:terdire¦5iamo:llungare¦4ciamo:ledire¦4iamo:grafare¦3iamo:hifare¦3cciamo:sfare,efare¦3ciamo:ddire¦2iamo:ufare,ofare¦1iamo:eare,zare,sare¦1hiamo:gare,care",
        "rev": "2are:iniamo,lliamo,oliamo,itiamo,uriamo,ntiamo,amiamo,gniamo,uliamo,triamo,oriamo,briamo,nniamo,iriamo,aviamo,eliamo,otiamo,oviamo,rmiamo,ltiamo,rliamo,lmiamo,ptiamo,criamo,ipiamo,smiamo,ddiamo,duiamo,obiamo,driamo,vriamo,ldiamo,tmiamo,abiamo,ifiamo¦2ere:rgiamo,lgiamo,lviamo¦2rre:poniamo,raiamo¦2rere:paiamo¦2mettere:asettiamo¦3are:doniamo,uffiamo,ittiamo,toniamo,ampiamo,astiamo,hetiamo,iatiamo,ietiamo,ioniamo,teriamo,erriamo,fidiamo,filiamo,tiviamo,meriamo,uppiamo,iutiamo,beriamo,ieniamo,leniamo,leviamo,taniamo,luniamo,mariamo,metiamo,putiamo,nimiamo,nidiamo,ianiamo,ortiamo,simiamo,ostiamo,mbliamo,iepiamo,sodiamo,ommiamo,enuiamo,ardiamo,effiamo,loniamo,uttiamo,didiamo,iodiamo,ifriamo,mutiamo,piliamo,mpriamo,cimiamo,futiamo,deriamo,nstiamo,roniamo,repiamo,nudiamo,rubiamo,meniamo,paniamo,urbiamo,reniamo,erbiamo,irpiamo,acuiamo,irtiamo,tumiamo,arbiamo,uatiamo,uidiamo,ratiamo,urriamo,taliamo,paliamo,soniamo,tuniamo,naliamo,modiamo,espiamo,cubiamo,urviamo,ammiamo,ceniamo,egriamo,timiamo,ceriamo,letiamo,nomiamo,utuiamo,geniamo,alpiamo,goniamo,squiamo,daliamo,etuiamo,faniamo,duniamo,aspiamo,galiamo,cariamo,saniamo,cquiamo,uoniamo,foniamo,lutiamo,gomiamo,liviamo,caliamo,capiamo,cemiamo,hediamo,ippiamo,ganiamo,fumiamo,temiamo,iffiamo,nodiamo,pumiamo,upriamo,limiamo,tubiamo,rupiamo,butiamo,urpiamo,getiamo,giliamo¦3rre:bduciamo,dduciamo,nduciamo,educiamo,oduciamo,aduciamo¦3ere:endiamo,orriamo,esciamo,cediamo,teniamo,riviamo,ingiamo,iediamo,ludiamo,petiamo,ompiamo,iggiamo,cadiamo,nquiamo,rimiamo,rigiamo,iudiamo,cutiamo,valiamo,sigiamo,beviamo,vediamo,vadiamo,undiamo,digiamo,ceviamo¦3re:luiamo,buiamo,ruiamo,ioiamo,ndiciamo,veiamo,idiciamo,ifacciamo,lfiamo¦4re:gliamo,runiamo,caniamo,uisiamo,hiliamo,nnuiamo,rguiamo,ociamo,tutiamo,veniamo,vviamo,aciamo,arpiamo,rcuiamo,patiamo,feriamo,affacciamo,todiamo,iziamo,cepiamo,ogiamo,sibiamo,uariamo,ialiamo,spriamo,ugiamo,tidiamo,losiamo,nibiamo,vosiamo,midiamo,ntuiamo,nviamo,gidiamo,oziamo,utriamo,rediciamo,egiamo,apriamo,badiamo,empiamo,vaniamo,pediamo,aziamo,iadiamo,uoiamo,agriamo,tupiamo,ppliamo,eltiamo¦4ere:battiamo,bradiamo,rangiamo,iungiamo,mettiamo,ssumiamo,vinciamo,langiamo,nosciamo,piacciamo,pungiamo,cerniamo,torciamo,nviviamo,pondiamo,ecidiamo,fungiamo,eridiamo,sistiamo,iligiamo,perdiamo,suadiamo,ruggiamo,pandiamo,tolliamo,trudiamo,ncidiamo,ccidiamo,rmaniamo,iangiamo,nasciamo,edimiamo,cindiamo,crediamo,imaniamo,mordiamo,isappiamo,isediamo,iviviamo,fottiamo,combiamo¦4are:everiamo,bondiamo,bituiamo,eleriamo,certiamo,iappiamo,omuniamo,cordiamo,dattiamo,dobbiamo,deguiamo,operiamo,dorniamo,fettiamo,hindiamo,lattiamo,lertiamo,terniamo,morbiamo,ioppiamo,prodiamo,rrediamo,rriviamo,sestiamo,imiliamo,testiamo,vistiamo,zzeriamo,bettiamo,lindiamo,cottiamo,rindiamo,pestiamo,uettiamo,mandiamo,mendiamo,cretiamo,ngediamo,uistiamo,serviamo,olidiamo,nsumiamo,tattiamo,empliamo,rattiamo,prediamo,giuniamo,leguiamo,irediamo,colpiamo,dettiamo,sertiamo,ibbliamo,migriamo,ipariamo,ageriamo,oneriamo,lottiamo,torniamo,rettiamo,rustiamo,nestiamo,loppiamo,ubiliamo,verniamo,berniamo,hettiamo,pattiamo,mperiamo,restiamo,carniamo,ateniamo,ceppiamo,festiamo,graniamo,roppiamo,aponiamo,sinuiamo,pretiamo,crimiamo,apidiamo,cheriamo,utiliamo,iettiamo,oettiamo,epariamo,uperiamo,uneriamo,cattiamo,destiamo,gettiamo,bombiamo,aettiamo,bandiamo,braniamo,cappiamo,cartiamo,iaffiamo,ciupiamo,crutiamo,gridiamo,ibiliamo,mistiamo,lveriamo,uartiamo,tappiamo,rnutiamo,toppiamo,rappiamo,icidiamo,bordiamo,ionfiamo,rottiamo,idimiamo¦5re:bbaiamo,reviamo,brutiamo,bortiamo,occiamo,ccudiamo,ibbiamo,anciamo,grediamo,eggiamo,maliamo,mansiamo,mmoniamo,nneriamo,nnoiamo,unciamo,santiamo,oggiamo,icciamo,aggiamo,sseriamo,sorbiamo,variamo,vertiamo,emmiamo,landiamo,ruciamo,alciamo,mediamo,ncupiamo,efiniamo,glutiamo,eperiamo,tituiamo,igeriamo,spariamo,figiamo,comiamo,sauriamo,serciamo,siliamo,iusciamo,hermiamo,rugniamo,uarniamo,bastiamo,mbibiamo,zarriamo,pauriamo,etosiamo,pigriamo,ziosiamo,acidiamo,anutiamo,niciamo,eboliamo,farciamo,erociamo,ddoliamo,ngeriamo,gantiamo,randiamo,gogliamo,seguiamo,arsiamo,tontiamo,rpidiamo,tariamo,rretiamo,bustiamo,isciamo,bbediamo,ficiamo,equiamo,rtoriamo,attuiamo,lagiamo,roibiamo,bbuiamo,rinziamo,censiamo,nseriamo,bolliamo,copriamo,fuggiamo,bambiamo,igoriamo,isaliamo,iveriamo,lordiamo,irciamo,ucciamo,candiamo,ecciamo,draiamo,elciamo,foltiamo,marriamo,offiamo,pperiamo,tatuiamo,tordiamo,tudiamo,vestiamo,asaliamo,engiamo¦5are:aparriamo,ccettiamo,giorniamo,llappiamo,llettiamo,oderniamo,ppartiamo,rraffiamo,otondiamo,econdiamo,rbottiamo,chieriamo,rcondiamo,llaudiamo,nstatiamo,ntinuiamo,ilettiamo,serediamo,sanguiamo,cettuiamo,asperiamo,luttuiamo,ulebbiamo,ppettiamo,nforniamo,validiamo,giferiamo,olestiamo,rnottiamo,egustiamo,occupiamo,osperiamo,esettiamo,icettiamo,iesumiamo,pinguiamo,ntombiamo,elleriamo,miottiamo,repidiamo,rucidiamo,mpettiamo¦5ere:scondiamo,nediciamo,nfondiamo,nnettiamo,tinguiamo,orrodiamo,iogliamo,togliamo,spelliamo,ntridiamo,cegliamo,resumiamo,oteggiamo,flettiamo,ileggiamo,ossediamo,dividiamo",
        "ex": "&#8212;:accadere¦siamo:essere¦1bbiamo:avere¦2viamo:bere¦9cciamo:contraffare¦1iamo:dare¦2ciamo:dire¦2cciamo:fare¦4ciamo:indire,ridire,piacere¦5ciamo:predire¦4cciamo:rifare¦4iamo:roncare,attuare,battere,bendare,bordare,cernere,cherere,credere,cremare,destare,dettare,distare,educere,elidere,emanare,eredare,erodere,esalare,fervere,fondare,fottere,fremere,frodare,fungere,gabbare,gettare,gradare,gridare,guadare,gustare,lattare,laudare,leggere,listare,lordare,lottare,mandare,mattare,mestare,mettere,mietere,migrare,molcere,mondare,mordere,mungere,narrare,nascere,nettare,operare,pappare,pascere,perdere,pestare,planare,poppare,predare,premere,privare,prudere,pungere,reggere,restare,ristare,rombare,ronfare,salvare,scopare,situare,sondare,sparare,sperare,stilare,svenare,tangere,tappare,tessere,torcere,tornare,tremare,vernare,vertere,vincere,vistare,zappare¦3cciamo:sfare¦8cciamo:sopraffare¦8ettiamo:teletrasmettere¦3iamo:tifare,andare,ardere,badare,barare,cadere,calare,cedere,cenare,cerare,cibare,cimare,domare,donare,dopare,ducere,errare,fidare,filare,fumare,gemere,godere,ledere,levare,libare,licere,limare,lodare,menare,mimare,mudare,mutare,natare,ondare,ornare,ostare,palare,parare,penare,radere,redare,remare,ridare,rodare,rubare,salare,sanare,sedare,sudare,sumere,tarare,temere,tenere,ungere,urtare,valere,venare,vivere¦9mo:abbacchiare,abbracciare,accerchiare,afflosciare,ammucchiare,appropriare,arrischiare,avvinghiare,bevicchiare,bofonchiare,contrariare,distanziare,espropriare,evidenziare,fotocopiare,imbracciare,insudiciare,invecchiare,invischiare,presenziare,principiare,raccoppiare,raccorciare,rimorchiare,rosicchiare,schiacciare,sculacciare,soverchiare,stipendiare,strabiliare,tralasciare¦7amo:abbellire,accogliere,addolcire,allestire,ammattire,ammollire,ammuffire,appassire,assentire,assortire,avvizzire,diminuire,dipartire,imbellire,imbottire,impartire,inaridire,infittire,ingobbire,insignire,ispessire,premunire,presagire,rabbonire,ricogliere,rifiorire,rifornire,ripartire,risarcire,risentire,scaturire,schernire,schiarire,scipidire,stabilire,suggerire¦10mo:abbonacciare,accalappiare,agghiacciare,canticchiare,cincischiare,dormicchiare,incominciare,infradiciare,mordicchiare,punzecchiare,rannicchiare,riallacciare,ricominciare,riconciliare,rispecchiare,scoperchiare,sonnecchiare,sparecchiare,sproloquiare,sputacchiare,testimoniare¦5iamo:abbonare,adoprare,adottare,apparare,arridere,assidere,avverare,avvivare,chierere,derapare,desumere,dividere,eleggere,flettere,fucilare,generare,goffrare,imparare,inondare,irridere,limonare,occupare,ossidare,piombare,riardere,riducere,sbarrare,sborrare,sbottare,schivare,sfondare,sfornare,sgobbare,snobbare,spettare,spremere,stridere,trombare,venerare¦10amo:abbrustolire,acconsentire,approfondire,impensierire,impratichire,indispettire,insospettire,interloquire,prestabilire,rabbrividire¦5amo:abolire,aderire,bandire,candire,cogliere,colpire,compiere,condire,coprire,dormire,erudire,farcire,fiorire,fornire,frinire,fuggire,garrire,gestire,gremire,lambire,mentire,muggire,offrire,partire,riunire,ruggire,sancire,seguire,sentire,servire,sfinire,sorbire,sortire,togliere,tossire,tradire,vestire¦6amo:aborrire,assalire,avvilire,chiarire,demolire,esaudire,esordire,esperire,favorire,languire,poltrire,ricucire,rifinire,smentire,soffrire,spartire,stizzire,ubbidire¦8iamo:accapponare,ammanettare,commiserare,intorbidare,prospettare,rattristare,rischiarare,sprofondare,trasfondere¦8mo:accasciare,acconciare,accoppiare,accorciare,adocchiare,affacciare,allacciare,ambasciare,amnistiare,angustiare,annaffiare,annebbiare,archiviare,arrabbiare,calunniare,cominciare,conciliare,contagiare,crocchiare,divorziare,espatriare,estraniare,finanziare,ghiacciare,impacciare,incipriare,ingabbiare,ingiuriare,licenziare,minacciare,orecchiare,potenziare,ricacciare,ricambiare,rilasciare,rimangiare,rovesciare,scrosciare,setacciare,sfiduciare,specchiare,squarciare,stracciare,strusciare,sussidiare,svaligiare,svecchiare¦3amo:adire,udire,unire¦9iamo:affaccendare,rimproverare,soprassedere,sopravvivere¦9amo:affievolire,alleggerire,ammorbidire,arrugginire,disubbidire,impallidire,imputridire,incollerire,incuriosire,infiacchire,ingentilire,inghiottire,intiepidire,intirizzire,ristabilire,spazientire¦6iamo:affondare,aspettare,assordare,collidere,comparare,disperare,eccellere,effondere,esilarare,infatuare,ravvivare,repellere,rifondare,rimestare,sorridere,tollerare,ventilare¦7iamo:aggiustare,annoverare,correggere,degenerare,dichiarare,diffondere,profondere,propellere,rieleggere,rigenerare,rispettare,sorreggere,sospettare¦4mo:agiare,odiare,oliare,oziare,sciare,spiare,sviare¦2iamo:alare,amare,arare,orare,parere,stare¦5mo:ambiare,bigiare,cariare,coniare,copiare,desiare,deviare,enfiare,espiare,mediare,obliare,pigiare,tediare,variare¦6mo:ampliare,berciare,cacciare,cambiare,cangiare,conciare,doppiare,fasciare,forgiare,gloriare,gonfiare,lasciare,linciare,mangiare,marciare,pazziare,seppiare,smaniare,traviare,umiliare¦11mo:apparecchiare,bruciacchiare,infinocchiare,interfacciare,mangiucchiare,riabbracciare,rincominciare¦8amo:appiattire,applaudire,arricchire,attecchire,consentire,dissentire,imbiondire,imbruttire,impietrire,impoverire,incenerire,ingiallire,inorridire,insaporire,intenerire,intimorire,intristire,raccogliere,rammollire,riapparire,rinverdire,scomparire,seppellire,sgranchire¦4amo:aprire,aulire,capire,cucire,empire,ferire,finire,lenire,morire,munire,ordire,perire,pulire,punire,rapire,sopire,subire,uscire,vagire¦7mo:assediare,bacchiare,dilaniare,fischiare,graffiare,inebriare,infuriare,inguaiare,insediare,insidiare,invidiare,irradiare,macchiare,mischiare,nicchiare,parodiare,raschiare,ricopiare,ripudiare,rischiare,sborniare,scacciare,scambiare,scoppiare,scorciare,sfasciare,sgonfiare,sgusciare,slacciare,spacciare,stacciare,storpiare,straniare,succhiare,tracciare,trebbiare¦13mo:contraccambiare¦11amo:disseppellire,rimpicciolire,rincoglionire¦2niamo:porre¦2ssiamo:potere¦3piamo:sapere¦2gliamo:solere,volere"
      },
      "secondPlural": {
        "fwd": "iate:ere¦1iate:nare,lare,rare,tare,dare,pare,mare,bare,uare,vare,arre,arere¦1ate:ire,iere¦1niate:orre¦1ciate:urre¦1ssiate:otere¦1gliate:olere¦2te:iare¦2iate:ffare,nfare¦2ciate:acere¦2piate:apere",
        "both": "5cciate:trafare¦5ciate:terdire¦5iate:llungare¦4ciate:ledire¦4iate:grafare¦3iate:hifare¦3cciate:sfare,efare¦3ciate:ddire¦2iate:ufare,ofare¦1iate:eare,zare,sare¦1hiate:gare,care",
        "rev": "2are:iniate,lliate,oliate,itiate,uriate,ntiate,amiate,gniate,uliate,triate,oriate,briate,nniate,iriate,aviate,eliate,otiate,oviate,rmiate,ltiate,rliate,lmiate,ptiate,criate,ipiate,smiate,ddiate,duiate,obiate,driate,vriate,ldiate,tmiate,abiate,ifiate¦2ere:rgiate,lgiate,lviate¦2rre:poniate,raiate¦2rere:paiate¦2mettere:asettiate¦3are:doniate,uffiate,ittiate,toniate,ampiate,astiate,hetiate,iatiate,ietiate,ioniate,teriate,erriate,fidiate,filiate,tiviate,meriate,uppiate,iutiate,beriate,ieniate,leniate,leviate,taniate,luniate,mariate,metiate,putiate,nimiate,nidiate,ianiate,ortiate,simiate,ostiate,mbliate,iepiate,sodiate,ommiate,enuiate,ardiate,effiate,loniate,uttiate,didiate,iodiate,ifriate,mutiate,piliate,mpriate,cimiate,futiate,deriate,nstiate,roniate,repiate,nudiate,rubiate,meniate,paniate,urbiate,reniate,erbiate,irpiate,acuiate,irtiate,tumiate,arbiate,uatiate,uidiate,ratiate,urriate,taliate,paliate,soniate,tuniate,naliate,modiate,espiate,cubiate,urviate,ammiate,ceniate,egriate,timiate,ceriate,letiate,nomiate,utuiate,geniate,alpiate,goniate,squiate,daliate,etuiate,faniate,duniate,aspiate,galiate,cariate,saniate,cquiate,uoniate,foniate,lutiate,gomiate,liviate,caliate,capiate,cemiate,hediate,ippiate,ganiate,fumiate,temiate,iffiate,nodiate,pumiate,upriate,limiate,tubiate,rupiate,butiate,urpiate,getiate,giliate¦3rre:bduciate,dduciate,nduciate,educiate,oduciate,aduciate¦3ere:endiate,orriate,esciate,cediate,teniate,riviate,ingiate,iediate,ludiate,petiate,ompiate,iggiate,cadiate,nquiate,rimiate,rigiate,iudiate,cutiate,valiate,sigiate,beviate,vediate,vadiate,undiate,digiate,ceviate¦3re:luiate,buiate,ruiate,ioiate,ndiciate,veiate,idiciate,ifacciate,lfiate¦4re:gliate,runiate,caniate,uisiate,hiliate,nnuiate,rguiate,ociate,tutiate,veniate,vviate,aciate,arpiate,rcuiate,patiate,feriate,affacciate,todiate,iziate,cepiate,ogiate,sibiate,uariate,ialiate,spriate,ugiate,tidiate,losiate,nibiate,vosiate,midiate,ntuiate,nviate,gidiate,oziate,utriate,rediciate,egiate,apriate,badiate,empiate,vaniate,pediate,aziate,iadiate,uoiate,agriate,tupiate,ppliate,eltiate¦4ere:battiate,bradiate,rangiate,iungiate,mettiate,ssumiate,vinciate,langiate,nosciate,piacciate,pungiate,cerniate,torciate,nviviate,pondiate,ecidiate,fungiate,eridiate,sistiate,iligiate,perdiate,suadiate,ruggiate,pandiate,tolliate,trudiate,ncidiate,ccidiate,rmaniate,iangiate,nasciate,edimiate,cindiate,crediate,imaniate,mordiate,isappiate,isediate,iviviate,fottiate,combiate¦4are:everiate,bondiate,bituiate,eleriate,certiate,iappiate,omuniate,cordiate,dattiate,dobbiate,deguiate,operiate,dorniate,fettiate,hindiate,lattiate,lertiate,terniate,morbiate,ioppiate,prodiate,rrediate,rriviate,sestiate,imiliate,testiate,vistiate,zzeriate,bettiate,lindiate,cottiate,rindiate,pestiate,uettiate,mandiate,mendiate,cretiate,ngediate,uistiate,serviate,olidiate,nsumiate,tattiate,empliate,rattiate,prediate,giuniate,leguiate,irediate,colpiate,dettiate,sertiate,ibbliate,migriate,ipariate,ageriate,oneriate,lottiate,torniate,rettiate,rustiate,nestiate,loppiate,ubiliate,verniate,berniate,hettiate,pattiate,mperiate,restiate,carniate,ateniate,ceppiate,festiate,graniate,roppiate,aponiate,sinuiate,pretiate,crimiate,apidiate,cheriate,utiliate,iettiate,oettiate,epariate,uperiate,uneriate,cattiate,destiate,gettiate,bombiate,aettiate,bandiate,braniate,cappiate,cartiate,iaffiate,ciupiate,crutiate,gridiate,ibiliate,mistiate,lveriate,uartiate,tappiate,rnutiate,toppiate,rappiate,icidiate,bordiate,ionfiate,rottiate,idimiate¦5re:bbaiate,reviate,brutiate,bortiate,occiate,ccudiate,ibbiate,anciate,grediate,eggiate,maliate,mansiate,mmoniate,nneriate,nnoiate,unciate,santiate,oggiate,icciate,aggiate,sseriate,sorbiate,variate,vertiate,emmiate,landiate,ruciate,alciate,mediate,ncupiate,efiniate,glutiate,eperiate,tituiate,igeriate,spariate,figiate,comiate,sauriate,serciate,siliate,iusciate,hermiate,rugniate,uarniate,bastiate,mbibiate,zarriate,pauriate,etosiate,pigriate,ziosiate,acidiate,anutiate,niciate,eboliate,farciate,erociate,ddoliate,ngeriate,gantiate,randiate,gogliate,seguiate,arsiate,tontiate,rpidiate,tariate,rretiate,bustiate,isciate,bbediate,ficiate,equiate,rtoriate,attuiate,lagiate,roibiate,bbuiate,rinziate,censiate,nseriate,bolliate,copriate,fuggiate,bambiate,igoriate,isaliate,iveriate,lordiate,irciate,ucciate,candiate,ecciate,draiate,elciate,foltiate,marriate,offiate,pperiate,tatuiate,tordiate,tudiate,vestiate,asaliate,engiate¦5are:aparriate,ccettiate,giorniate,llappiate,llettiate,oderniate,ppartiate,rraffiate,otondiate,econdiate,rbottiate,chieriate,rcondiate,llaudiate,nstatiate,ntinuiate,ilettiate,serediate,sanguiate,cettuiate,asperiate,luttuiate,ulebbiate,ppettiate,nforniate,validiate,giferiate,olestiate,rnottiate,egustiate,occupiate,osperiate,esettiate,icettiate,iesumiate,pinguiate,ntombiate,elleriate,miottiate,repidiate,rucidiate,mpettiate¦5ere:scondiate,nediciate,nfondiate,nnettiate,tinguiate,orrodiate,iogliate,togliate,spelliate,ntridiate,cegliate,resumiate,oteggiate,flettiate,ileggiate,ossediate,dividiate",
        "ex": "&#8212;:accadere¦siate:essere¦1bbiate:avere¦2viate:bere¦9cciate:contraffare¦1iate:dare¦2ciate:dire¦2cciate:fare¦4ciate:indire,ridire,piacere¦5ciate:predire¦4cciate:rifare¦4iate:roncare,attuare,battere,bendare,bordare,cernere,cherere,credere,cremare,destare,dettare,distare,educere,elidere,emanare,eredare,erodere,esalare,fervere,fondare,fottere,fremere,frodare,fungere,gabbare,gettare,gradare,gridare,guadare,gustare,lattare,laudare,leggere,listare,lordare,lottare,mandare,mattare,mestare,mettere,mietere,migrare,molcere,mondare,mordere,mungere,narrare,nascere,nettare,operare,pappare,pascere,perdere,pestare,planare,poppare,predare,premere,privare,prudere,pungere,reggere,restare,ristare,rombare,ronfare,salvare,scopare,situare,sondare,sparare,sperare,stilare,svenare,tangere,tappare,tessere,torcere,tornare,tremare,vernare,vertere,vincere,vistare,zappare¦3cciate:sfare¦8cciate:sopraffare¦8ettiate:teletrasmettere¦3iate:tifare,andare,ardere,badare,barare,cadere,calare,cedere,cenare,cerare,cibare,cimare,domare,donare,dopare,ducere,errare,fidare,filare,fumare,gemere,godere,ledere,levare,libare,licere,limare,lodare,menare,mimare,mudare,mutare,natare,ondare,ornare,ostare,palare,parare,penare,radere,redare,remare,ridare,rodare,rubare,salare,sanare,sedare,sudare,sumere,tarare,temere,tenere,ungere,urtare,valere,venare,vivere¦9te:abbacchiare,abbracciare,accerchiare,afflosciare,ammucchiare,appropriare,arrischiare,avvinghiare,bevicchiare,bofonchiare,contrariare,distanziare,espropriare,evidenziare,fotocopiare,imbracciare,insudiciare,invecchiare,invischiare,presenziare,principiare,raccoppiare,raccorciare,rimorchiare,rosicchiare,schiacciare,sculacciare,soverchiare,stipendiare,strabiliare,tralasciare¦7ate:abbellire,accogliere,addolcire,allestire,ammattire,ammollire,ammuffire,appassire,assentire,assortire,avvizzire,diminuire,dipartire,imbellire,imbottire,impartire,inaridire,infittire,ingobbire,insignire,ispessire,premunire,presagire,rabbonire,ricogliere,rifiorire,rifornire,ripartire,risarcire,risentire,scaturire,schernire,schiarire,scipidire,stabilire,suggerire¦10te:abbonacciare,accalappiare,agghiacciare,canticchiare,cincischiare,dormicchiare,incominciare,infradiciare,mordicchiare,punzecchiare,rannicchiare,riallacciare,ricominciare,riconciliare,rispecchiare,scoperchiare,sonnecchiare,sparecchiare,sproloquiare,sputacchiare,testimoniare¦5iate:abbonare,adoprare,adottare,apparare,arridere,assidere,avverare,avvivare,chierere,derapare,desumere,dividere,eleggere,flettere,fucilare,generare,goffrare,imparare,inondare,irridere,limonare,occupare,ossidare,piombare,riardere,riducere,sbarrare,sborrare,sbottare,schivare,sfondare,sfornare,sgobbare,snobbare,spettare,spremere,stridere,trombare,venerare¦10ate:abbrustolire,acconsentire,approfondire,impensierire,impratichire,indispettire,insospettire,interloquire,prestabilire,rabbrividire¦5ate:abolire,aderire,bandire,candire,cogliere,colpire,compiere,condire,coprire,dormire,erudire,farcire,fiorire,fornire,frinire,fuggire,garrire,gestire,gremire,lambire,mentire,muggire,offrire,partire,riunire,ruggire,sancire,seguire,sentire,servire,sfinire,sorbire,sortire,togliere,tossire,tradire,vestire¦6ate:aborrire,assalire,avvilire,chiarire,demolire,esaudire,esordire,esperire,favorire,languire,poltrire,ricucire,rifinire,smentire,soffrire,spartire,stizzire,ubbidire¦8iate:accapponare,ammanettare,commiserare,intorbidare,prospettare,rattristare,rischiarare,sprofondare,trasfondere¦8te:accasciare,acconciare,accoppiare,accorciare,adocchiare,affacciare,allacciare,ambasciare,amnistiare,angustiare,annaffiare,annebbiare,archiviare,arrabbiare,calunniare,cominciare,conciliare,contagiare,crocchiare,divorziare,espatriare,estraniare,finanziare,ghiacciare,impacciare,incipriare,ingabbiare,ingiuriare,licenziare,minacciare,orecchiare,potenziare,ricacciare,ricambiare,rilasciare,rimangiare,rovesciare,scrosciare,setacciare,sfiduciare,specchiare,squarciare,stracciare,strusciare,sussidiare,svaligiare,svecchiare¦3ate:adire,udire,unire¦9iate:affaccendare,rimproverare,soprassedere,sopravvivere¦9ate:affievolire,alleggerire,ammorbidire,arrugginire,disubbidire,impallidire,imputridire,incollerire,incuriosire,infiacchire,ingentilire,inghiottire,intiepidire,intirizzire,ristabilire,spazientire¦6iate:affondare,aspettare,assordare,collidere,comparare,disperare,eccellere,effondere,esilarare,infatuare,ravvivare,repellere,rifondare,rimestare,sorridere,tollerare,ventilare¦7iate:aggiustare,annoverare,correggere,degenerare,dichiarare,diffondere,profondere,propellere,rieleggere,rigenerare,rispettare,sorreggere,sospettare¦4te:agiare,odiare,oliare,oziare,sciare,spiare,sviare¦2iate:alare,amare,arare,orare,parere,stare¦5te:ambiare,bigiare,cariare,coniare,copiare,desiare,deviare,enfiare,espiare,mediare,obliare,pigiare,tediare,variare¦6te:ampliare,berciare,cacciare,cambiare,cangiare,conciare,doppiare,fasciare,forgiare,gloriare,gonfiare,lasciare,linciare,mangiare,marciare,pazziare,seppiare,smaniare,traviare,umiliare¦11te:apparecchiare,bruciacchiare,infinocchiare,interfacciare,mangiucchiare,riabbracciare,rincominciare¦8ate:appiattire,applaudire,arricchire,attecchire,consentire,dissentire,imbiondire,imbruttire,impietrire,impoverire,incenerire,ingiallire,inorridire,insaporire,intenerire,intimorire,intristire,raccogliere,rammollire,riapparire,rinverdire,scomparire,seppellire,sgranchire¦4ate:aprire,aulire,capire,cucire,empire,ferire,finire,lenire,morire,munire,ordire,perire,pulire,punire,rapire,sopire,subire,uscire,vagire¦7te:assediare,bacchiare,dilaniare,fischiare,graffiare,inebriare,infuriare,inguaiare,insediare,insidiare,invidiare,irradiare,macchiare,mischiare,nicchiare,parodiare,raschiare,ricopiare,ripudiare,rischiare,sborniare,scacciare,scambiare,scoppiare,scorciare,sfasciare,sgonfiare,sgusciare,slacciare,spacciare,stacciare,storpiare,straniare,succhiare,tracciare,trebbiare¦13te:contraccambiare¦11ate:disseppellire,rimpicciolire,rincoglionire¦2niate:porre¦2ssiate:potere¦3piate:sapere¦2gliate:solere,volere"
      },
      "thirdPlural": {
        "fwd": "ano:ere¦lgano:gliere¦escano:uscire¦1no:iare¦1cano:urre¦1ino:lare,bare¦1ano:vire¦2ino:ffare,nfare¦2gano:enire,enere,alere,anere¦2ciano:acere¦2ano:guire¦3ano:mpire",
        "both": "5cciano:trafare¦5scano:ientire,mentire,ristire,minuire,ircuire,rostire,lestire,dolcire¦5iano:ttostare¦5ano:ipartire¦5cano:terdire¦4scano:ortire,ontire,antire,sprire,astire,ermire,arrire,iarire,rguire,nnuire¦4gano:isalire,ssalire¦4ano:fuggire,bollire,vestire,sentire,borrire¦4cano:ledire¦4ino:grafare¦3scano:grire,ltire,ncire,atire,agire,etire,gnire,ocire,trire,rnire,emire,ruire,rcire,urire,tuire,buire,luire,orire,unire,inire,ttire,erire,anire,utire,onire¦3ino:hifare¦3ano:ormire,ucire,ertire¦3cciano:sfare,efare¦3cano:ddire¦2piano:apere¦2ano:frire,prire¦2uchino:anicare¦2scano:eire,oire,pire,zire,hire,sire,fire,bire,dire,lire¦2ino:ofare,ufare¦2iano:parire¦1gliano:olere¦1iedano:sedere¦1ssano:otere¦1ggano:arre¦1ngano:orre¦1ino:eare,vare,mare,sare,dare,pare,uare,zare,tare,rare,nare¦1hino:gare,care",
        "rev": "vere:bbiano¦orire:uoiano¦1re:iscano¦1ere:vano,nano,pano¦1are:iino,diano,tiano¦1uscire:iescano¦1gliere:elgano¦1mettere:settano¦2are:aino,olino,cino,llino,ulino,gino,rbino,elino,oino,rlino,alino,ibino,ubino,obino,abino,ifino¦2ere:adano,udano,ndano,idano,rgano,umano,rcano,ncano,erano,etano,imano,odano,quano,igano,utano,rdano,emano,mbano,lcano,arano¦2gliere:colgano,iolgano,tolgano¦2rre:ducano¦2re:facciano¦2ire:ntano,rbano¦3are:glino,uffino,filino,ungino,mblino,effino,pilino,izino,uvino,bblino,nvino,tilino,ozino,vvino,ombino,buino,azino,obbino,iffino¦3ere:attano,cedano,ungano,tengano,istano,ingano,oscano,iacciano,eggano,redano,iggano,ellano,valgano,ottano,ulgano,vedano,mangano,ascano,essano¦3ire:vengano,eguano,artano,estano¦3re:ndicano,idicano¦4are:revino,ibbino,malino,sedino,varino,emmino,unnino,medino,ambino,comino,silino,ubilino,iprino,furino,arsino,tarino,equino,pudino,iaffino,ibilino,offino,oquino,orpino,ionfino,igilino¦4ere:corrano,nettano,volgano,hiedano,langano,iangano,mettano,rescano,inguano,tollano,lettano,rangano,iducano,ruggano¦4ire:anguano,servano¦4re:redicano¦5are:coppino,nistino,naffino,roprino,rabbino,similino,ncilino,templino,ilanino,tanzino,patrino,tranino,nanzino,ocopino,ulebbino,nebrino,gabbino,nsidino,nvidino,rradino,cenzino,arodino,tenzino,icopino,bornino,gonfino,pendino,rebbino¦5ere:nedicano",
        "ex": "vadano:andare¦&#8212;:arrogere¦siano:essere¦odano:udire¦escano:uscire¦3scano:agire,unire¦6ino:allungare,arraffare¦1bbiano:avere¦4ino:avviare,roncare,gabbare,ronfare¦2vano:bere¦4ano:bollire,fuggire,mentire,partire,sentire,vestire,correre,educere,empire,mescere,mettere,servire,tangere,vertere,volgere¦9cciano:contraffare¦1iano:dare¦2cano:dire¦2cciano:fare¦5scano:gestire,guarire,muggire,ruggire,sparire¦7scano:impartire¦4cano:indire,ridire¦10scano:interloquire¦9scano:irrobustire¦4scano:lenire¦1uoiano:morire¦4no:nevare,ambiare,cariare,coniare,copiare,desiare,deviare,enfiare,espiare,mediare,obliare,radiare,tediare,variare¦2iano:parere,stare¦5cano:predire¦1iedano:redire¦8ano:riassorbire¦3iano:ridare¦4cciano:rifare¦4iano:ristare¦3gano:salire,tenere,valere,venire¦3cciano:sfare¦8cciano:sopraffare¦6scano:spartire¦8ettano:teletrasmettere¦3ino:tifare,filare¦8no:abbacchiare,accerchiare,ammucchiare,arrischiare,avvinghiare,bevicchiare,bofonchiare,contrariare,evidenziare,invecchiare,invischiare,presenziare,principiare,rimorchiare,rosicchiare,soverchiare,strabiliare¦9no:accalappiare,canticchiare,cincischiare,dormicchiare,mordicchiare,punzecchiare,rannicchiare,rispecchiare,scoperchiare,sonnecchiare,sparecchiare,sputacchiare,testimoniare¦7no:adocchiare,angustiare,annebbiare,archiviare,crocchiare,divorziare,incendiare,ingiuriare,orecchiare,specchiare,sussidiare,svecchiare¦2ino:alare¦3ano:algere,cedere,ducere,ledere,licere,ungere¦5no:ampliare,doppiare,gloriare,gonfiare,pazziare,seppiare,smaniare,studiare,traviare,umiliare¦10no:apparecchiare,bruciacchiare,infinocchiare,mangiucchiare¦6no:bacchiare,fischiare,graffiare,macchiare,mischiare,nicchiare,raschiare,rischiare,succhiare¦2lgano:cogliere,togliere¦5ano:compiere¦5ino:fucilare¦3no:odiare,oliare,oziare,spiare,sviare¦6ano:riempire"
      }
    },
    "gerunds": {
      "gerunds": {
        "fwd": "endo:ire¦1cendo:urre¦1nendo:orre",
        "both": "3vendo:abere¦3cendo:sfare,efare,ddire¦2attando:ecettare¦1endo:arre¦ndoci:rci¦ndosene:rsene¦ndo:re",
        "rev": "1ire:hendo,zendo,fendo¦1are:iiando¦2ire:unendo,ntendo,isendo,ilendo,luendo,nsendo,nuendo,prendo,inendo,rbendo,buendo,ulendo,itendo,orendo,atendo,tuendo,ruendo,ibendo,rmendo,osendo,grendo,elendo,trendo,ltendo,frendo,ependo,agendo,opendo,upendo,lpendo¦2rre:ponendo¦2re:facendo¦3ire:bonendo,bolendo,ortendo,venendo,volendo,errendo,gerendo,conendo,monendo,nerendo,assendo,audendo,ossendo,salendo,serendo,estendo,astendo,artendo,iarendo,perendo,cucendo,bidendo,aurendo,allendo,ornendo,uscendo,ugnendo,arnendo,barendo,arrendo,uttendo,pedendo,iolendo,ronendo,verendo,nutendo,tivendo,durendo,arcendo,tolendo,eguendo,pidendo,midendo,lenendo,gidendo,ambendo,bedendo,ferendo,colendo,badendo,uarendo,ionendo,ognendo,curendo¦3rre:nducendo,oducendo,educendo,aducendo¦4ire:bellendo,dolcendo,gredendo,mollendo,pparendo,uvidendo,vertendo,mparendo,acidendo,servendo,sordendo,iondendo,llerendo,pettendo,gardendo,iottendo,randendo,pessendo,ristendo,verdendo,fittendo,bollendo,fuggendo,crudendo,sparendo¦5ire:ppellendo,utridendo,liardendo",
        "ex": "spendantendo:impedantire¦inchiocciolendo:rinchiocciolire¦infierendo:rinfierire¦intoppando:rintoppare¦tivalicando:rivalicare¦2vendo:bere¦5endo:boglire,aborrire,accanire,accudire,ammutire,attutire,blandire,circuire,demolire,esercire,imbutire,irretire,languire,riordire,sbiadire,scandire,sgradire,staggire,stordire,supplire,svampire¦6ando:bullizzare¦9cendo:contraffare¦2cendo:dire,fare¦4endo:empire,aderire,arguire,bandire,bollire,candire,carpire,condire,erudire,fuggire,gradire,granire,gremire,inveire,largire,muggire,paidire,riudire,ruggire,sancire,servire,tradire¦4cendo:indire,ridire,rifare,abdurre,addurre¦7cendo:interdire¦6cendo:maledire,strafare,trasdurre¦5cendo:malfare,predire,perdurre¦8iando:pinneggiare¦10ando:raggrovigliare¦8cendo:ribenedire,sopraffare,autoridurre¦4vendo:ribere¦11cendo:ricontraffare¦6endo:riempire,abbrutire,ammannire,ammattire,ammencire,arrostire,azzoppire,custodire,deglutire,imbolsire,imbottire,inacutire,inaridire,inebetire,ingobbire,ingrigire,insignire,rancidire,ribandire,ricondire,rimuggire,ritradire,scaturire,schernire¦2pugnando:riespugnare¦8mi:rilassare¦7iando:rimeggiare¦2verniciando:rinverniciare¦4chando:scratchare¦3cendo:sdire,sfare¦8ettendo:teletrasmettere¦2endo:adire,agire,olire,udire,unire¦3endo:ambire,basire,capire,cucire,fedire,ferire,gioire,lenire,ordire,orrire,padire,perire,putire,rapire,salire,subire,uscire,venire¦7endo:appiattire,imbufalire,immucidire,inferocire,infrollire,inorridire,sbalordire¦9endo:approfondire,imbastardire,imbestialire,imborghesire,impensierire,incancherire,incancrenire,inflaccidire,infreddolire,interloquire,rabbrividire,ringiovanire¦10endo:illeggiadrire,rinciprignire¦8endo:impallidire,infastidire,inorgoglire,insonnolire,inviscidire,involgarire,irrobustire,ringrullire¦2nendo:porre"
      }
    },
    "pastParticiple": {
      "pastParticiple": {
        "fwd": "otto:urre,ucere¦lto:gliere¦so:rere¦tto:ggere,mpere¦osso:uovere,uotere¦to:guere¦1to:ngere,rcere,ncere¦1so:udere,rdere¦1sso:ettere,indere¦1uto:nere¦1nto:umere¦1tto:arre¦1etto:rigere,ligere¦2ito:stere¦2to:olgere,orgere,nascere¦2sto:pondere¦2uto:evere¦2so:arere¦3so:pergere¦4so:sparire",
        "both": "4uto:vendere,lendere¦4so:mparire,pparire¦3to:vellere,solvere¦3tto:sfare,efare¦3uto:sedere,iovere,ottere,volvere,redere,venire,cedere,cadere,attere¦3so:mergere,tergere¦3iuto:oscere,escere¦3sto:hiedere¦2uto:apere,etere,emere,icere¦2so:vadere,rodere,alere,uadere¦2erto:oprire¦2ssuto:vivere¦2iuto:acere¦2tto:rivere¦2etto:ddire¦1isto:vedere¦1erto:frire¦1uto:bere¦1otto:cuocere¦1sto:anere,orre¦1atto:sigere¦1sso:utere¦1uso:fondere¦1esso:rimere¦1so:idere,endere¦to:re",
        "rev": "1urre:dotto¦1ere:guto,vuto,duto,tuto¦1rire:perto¦1ire:detto¦1uovere:mosso¦1ggere:utto¦1ellere:pulso¦1uotere:cosso¦1dere:aso¦2gliere:colto,iolto,celto¦2ggere:litto,fitto,fisso¦2dere:luso,iuso,ruso¦2ttere:nesso,messo,lesso¦2mere:sunto¦2rre:ratto¦2ere:rnuto¦2rere:orso¦2re:fatto¦2mpere:rotto¦2gere:anto¦2ndere:cisso¦3gere:iunto,volto,punto,pinto,cinto,sorto¦3ere:tenuto¦3cere:torto,vinto¦3ggere:rretto¦4ere:sistito¦4guere:stinto",
        "ex": "4so:abradere,ottundere,riardere,sparere,spergere¦4to:adergere,arrogere,rinascere,scorgere,sporgere,stingere¦3uto:algere,cadere,dolere,dovere,godere,potere,sedere,urgere,venire,volere,cedere,vigere,tenere¦2erto:aprire¦5to:assurgere,estollere,indulgere,attingere,defungere,intingere,prenascere¦4etto:astringere,predire,negligere¦2uto:avere¦5etto:benedire,costringere,maledire¦2vuto:bere¦3sto:cherere¦5uto:compiere,stridere,clangere,erompere,spandere,spengere¦9tto:contraffare¦6so:convergere,cospargere,disparire,disperdere¦1otto:cuocere,ducere¦1etto:dire¦3ento:dirimere,redimere¦5so:eccellere,espandere,rifulgere,aspergere,rimordere¦2so:ergere,ledere,radere,rodere,ardere¦3ulso:espellere,repellere¦2tto:fare,figgere,leggere,reggere,rompere¦1uso:fondere¦7nte:impellere¦3etto:indire,ridire,stringere,diligere,dirigere¦4sso:infiggere¦6etto:interdire,prediligere¦3so:mergere,tergere,mordere,parere,perdere¦3to:morire,solvere,cingere,fingere,fungere,mingere,mungere,porgere,pungere,sorgere,tingere,torcere,vincere,volgere¦2to:nascere,ungere¦4iuto:pascere¦4uto:pendere,tangere,tessere,vendere,fendere,fervere,fulgere,prudere,vergere,vertere¦5sso:prefiggere¦4ulso:propellere¦3atto:redigere¦1istretto:restringere¦4erto:riaprire¦4tto:rifare,rileggere¦6uto:risiedere,accorgere,ascondere,divergere¦3tto:sfare,eleggere,friggere¦3ito:solere¦8tto:sopraffare¦3nto:spegnere¦6tto:strafare,soffriggere¦8esso:teletrasmettere¦2ssuto:vivere¦7uto:delinquere,propendere¦5sto:nascondere,rispondere¦1ociuto:nuocere¦1isto:vedere¦2lto:cogliere,togliere¦8sto:corrispondere¦5lto:distogliere¦2otto:educere¦2etto:erigere¦2sso:mettere¦1osso:muovere¦5tto:proteggere,rieleggere¦3otto:riducere¦2nto:sumere¦7so:trasparire"
      }
    },
    "presentParticiple": {
      "presentParticiple": {
        "fwd": "ente:ire¦1cente:urre",
        "both": "4ente:venire¦3cente:sfare,efare,ddire¦2iente:apere¦2vente:arere¦1ente:arre¦1nente:orre¦nte:re",
        "rev": "1ire:fente,hente,zente¦2ire:unente,ntente,luente,nsente,ilente,arente,prente,inente,rbente,buente,ulente,apente,orente,atente,upente,tuente,nuente,rmente,urente,ibente,ruente,osente,grente,trente,epente,agente,lpente,ltente¦2re:facente¦3ire:bonente,bolente,ortente,gerente,bidente,assente,audente,ossente,serente,eguente,perente,artente,bedente,allente,ornente,uscente,estente,arrente,pedente,verente,nutente,arcente,nerente,midente,ambente,ferente,pidente¦3rre:nducente,educente,oducente¦4ire:bellente,gredente,mollente,vertente,pettente,bollente,fuggente¦5ire:ppellente",
        "ex": "2vente:bere¦6ziente:consentire¦9cente:contraffare¦2cente:dire,fare¦4endo:empire¦4cente:indire,ridire,rifare,abdurre,addurre¦7cente:interdire¦6cente:maledire,strafare¦5cente:predire,tradurre¦6ente:riempire,abbrutire,acquisire,addolcire,ammattire,arrostire,custodire,deglutire,imbastire,imbottire,inacidire,inaridire,infittire,ingobbire,insignire,ispessire,riservire,schernire,trasalire¦3cente:sfare¦8cente:sopraffare¦8ettente:teletrasmettere¦9ente:abbrustolire,approfondire,imbestialire,impensierire,infreddolire,interloquire,rabbrividire,ringiovanire¦5ente:aborrire,accanire,accudire,ammonire,attutire,blandire,circuire,demolire,esercire,esordire,grugnire,guarnire,irretire,languire,ribadire,ricucire,sbiadire,scandire,stordire,supplire¦4ente:aderire,arguire,bandire,bollire,candire,carpire,condire,erudire,fuggire,gradire,gremire,inveire,muggire,ruggire,sancire,servire,tradire¦2ente:adire,agire,udire,unire¦8ente:affievolire,impallidire,imputridire,incollerire,infastidire,inghiottire,inorgoglire,irrobustire¦3ente:ambire,basire,cucire,ferire,gioire,lenire,ordire,perire,sopire,subire,uscire,venire¦7ente:appiattire,imbiondire,imbruttire,inferocire,ingrandire,inorridire,intristire,irrigidire,rinverdire,sbalordire¦10ente:rimpicciolire,rincoglionire"
      }
    }
  };

  // uncompress them
  Object.keys(model$1).forEach(k => {
    Object.keys(model$1[k]).forEach(form => {
      model$1[k][form] = uncompress(model$1[k][form]);
    });
  });

  // generated from ./verbs.jsonl by scripts/gen-irregular.js
  // full tables for verbs with irregular stems,
  // plus irregular past-participles + gerunds for otherwise-regular verbs
  var irregular = {
    "paradigms": {
      "essere": {
        "present": [
          "sono",
          "sei",
          "è",
          "siamo",
          "siete",
          "sono"
        ],
        "imperfect": [
          "ero",
          "eri",
          "era",
          "eravamo",
          "eravate",
          "erano"
        ],
        "past": [
          "fui",
          "fosti",
          "fu",
          "fummo",
          "foste",
          "furono"
        ],
        "future": [
          "sarò",
          "sarai",
          "sarà",
          "saremo",
          "sarete",
          "saranno"
        ],
        "conditional": [
          "sarei",
          "saresti",
          "sarebbe",
          "saremmo",
          "sareste",
          "sarebbero"
        ],
        "subjunctive": [
          "sia",
          "sia",
          "sia",
          "siamo",
          "siate",
          "siano"
        ],
        "imperfectSubjunctive": [
          "fossi",
          "fossi",
          "fosse",
          "fossimo",
          "foste",
          "fossero"
        ],
        "pastParticiple": "stato",
        "gerund": "essendo"
      },
      "avere": {
        "present": [
          "ho",
          "hai",
          "ha",
          "abbiamo",
          "avete",
          "hanno"
        ],
        "imperfect": [
          "avevo",
          "avevi",
          "aveva",
          "avevamo",
          "avevate",
          "avevano"
        ],
        "past": [
          "ebbi",
          "avesti",
          "ebbe",
          "avemmo",
          "aveste",
          "ebbero"
        ],
        "future": [
          "avrò",
          "avrai",
          "avrà",
          "avremo",
          "avrete",
          "avranno"
        ],
        "conditional": [
          "avrei",
          "avresti",
          "avrebbe",
          "avremmo",
          "avreste",
          "avrebbero"
        ],
        "subjunctive": [
          "abbia",
          "abbia",
          "abbia",
          "abbiamo",
          "abbiate",
          "abbiano"
        ],
        "imperfectSubjunctive": [
          "avessi",
          "avessi",
          "avesse",
          "avessimo",
          "aveste",
          "avessero"
        ],
        "pastParticiple": "avuto",
        "gerund": "avendo"
      },
      "stare": {
        "present": [
          "sto",
          "stai",
          "sta",
          "stiamo",
          "state",
          "stanno"
        ],
        "imperfect": [
          "stavo",
          "stavi",
          "stava",
          "stavamo",
          "stavate",
          "stavano"
        ],
        "past": [
          "stetti",
          "stesti",
          "stette",
          "stemmo",
          "steste",
          "stettero"
        ],
        "future": [
          "starò",
          "starai",
          "starà",
          "staremo",
          "starete",
          "staranno"
        ],
        "conditional": [
          "starei",
          "staresti",
          "starebbe",
          "staremmo",
          "stareste",
          "starebbero"
        ],
        "subjunctive": [
          "stia",
          "stia",
          "stia",
          "stiamo",
          "stiate",
          "stiano"
        ],
        "imperfectSubjunctive": [
          "stessi",
          "stessi",
          "stesse",
          "stessimo",
          "steste",
          "stessero"
        ],
        "pastParticiple": "stato",
        "gerund": "stando"
      },
      "fare": {
        "present": [
          "faccio",
          "fai",
          "fa",
          "facciamo",
          "fate",
          "fanno"
        ],
        "imperfect": [
          "facevo",
          "facevi",
          "faceva",
          "facevamo",
          "facevate",
          "facevano"
        ],
        "past": [
          "feci",
          "facesti",
          "fece",
          "facemmo",
          "faceste",
          "fecero"
        ],
        "future": [
          "farò",
          "farai",
          "farà",
          "faremo",
          "farete",
          "faranno"
        ],
        "conditional": [
          "farei",
          "faresti",
          "farebbe",
          "faremmo",
          "fareste",
          "farebbero"
        ],
        "subjunctive": [
          "faccia",
          "faccia",
          "faccia",
          "facciamo",
          "facciate",
          "facciano"
        ],
        "imperfectSubjunctive": [
          "facessi",
          "facessi",
          "facesse",
          "facessimo",
          "faceste",
          "facessero"
        ],
        "pastParticiple": "fatto",
        "gerund": "facendo"
      },
      "dire": {
        "present": [
          "dico",
          "dici",
          "dice",
          "diciamo",
          "dite",
          "dicono"
        ],
        "imperfect": [
          "dicevo",
          "dicevi",
          "diceva",
          "dicevamo",
          "dicevate",
          "dicevano"
        ],
        "past": [
          "dissi",
          "dicesti",
          "disse",
          "dicemmo",
          "diceste",
          "dissero"
        ],
        "future": [
          "dirò",
          "dirai",
          "dirà",
          "diremo",
          "direte",
          "diranno"
        ],
        "conditional": [
          "direi",
          "diresti",
          "direbbe",
          "diremmo",
          "direste",
          "direbbero"
        ],
        "subjunctive": [
          "dica",
          "dica",
          "dica",
          "diciamo",
          "diciate",
          "dicano"
        ],
        "imperfectSubjunctive": [
          "dicessi",
          "dicessi",
          "dicesse",
          "dicessimo",
          "diceste",
          "dicessero"
        ],
        "pastParticiple": "detto",
        "gerund": "dicendo"
      },
      "andare": {
        "present": [
          "vado",
          "vai",
          "va",
          "andiamo",
          "andate",
          "vanno"
        ],
        "imperfect": [
          "andavo",
          "andavi",
          "andava",
          "andavamo",
          "andavate",
          "andavano"
        ],
        "past": [
          "andai",
          "andasti",
          "andò",
          "andammo",
          "andaste",
          "andarono"
        ],
        "future": [
          "andrò",
          "andrai",
          "andrà",
          "andremo",
          "andrete",
          "andranno"
        ],
        "conditional": [
          "andrei",
          "andresti",
          "andrebbe",
          "andremmo",
          "andreste",
          "andrebbero"
        ],
        "subjunctive": [
          "vada",
          "vada",
          "vada",
          "andiamo",
          "andiate",
          "vadano"
        ],
        "imperfectSubjunctive": [
          "andassi",
          "andassi",
          "andasse",
          "andassimo",
          "andaste",
          "andassero"
        ],
        "pastParticiple": "andato",
        "gerund": "andando"
      },
      "venire": {
        "present": [
          "vengo",
          "vieni",
          "viene",
          "veniamo",
          "venite",
          "vengono"
        ],
        "imperfect": [
          "venivo",
          "venivi",
          "veniva",
          "venivamo",
          "venivate",
          "venivano"
        ],
        "past": [
          "venni",
          "venisti",
          "venne",
          "venimmo",
          "veniste",
          "vennero"
        ],
        "future": [
          "verrò",
          "verrai",
          "verrà",
          "verremo",
          "verrete",
          "verranno"
        ],
        "conditional": [
          "verrei",
          "verresti",
          "verrebbe",
          "verremmo",
          "verreste",
          "verrebbero"
        ],
        "subjunctive": [
          "venga",
          "venga",
          "venga",
          "veniamo",
          "veniate",
          "vengano"
        ],
        "imperfectSubjunctive": [
          "venissi",
          "venissi",
          "venisse",
          "venissimo",
          "veniste",
          "venissero"
        ],
        "pastParticiple": "venuto",
        "gerund": "venendo"
      },
      "dare": {
        "present": [
          "do",
          "dai",
          "dà",
          "diamo",
          "date",
          "danno"
        ],
        "imperfect": [
          "davo",
          "davi",
          "dava",
          "davamo",
          "davate",
          "davano"
        ],
        "past": [
          "diedi",
          "desti",
          "diede",
          "demmo",
          "deste",
          "diedero"
        ],
        "future": [
          "darò",
          "darai",
          "darà",
          "daremo",
          "darete",
          "daranno"
        ],
        "conditional": [
          "darei",
          "daresti",
          "darebbe",
          "daremmo",
          "dareste",
          "darebbero"
        ],
        "subjunctive": [
          "dia",
          "dia",
          "dia",
          "diamo",
          "diate",
          "diano"
        ],
        "imperfectSubjunctive": [
          "dessi",
          "dessi",
          "desse",
          "dessimo",
          "deste",
          "dessero"
        ],
        "pastParticiple": "dato",
        "gerund": "dando"
      },
      "sapere": {
        "present": [
          "so",
          "sai",
          "sa",
          "sappiamo",
          "sapete",
          "sanno"
        ],
        "imperfect": [
          "sapevo",
          "sapevi",
          "sapeva",
          "sapevamo",
          "sapevate",
          "sapevano"
        ],
        "past": [
          "seppi",
          "sapesti",
          "seppe",
          "sapemmo",
          "sapeste",
          "seppero"
        ],
        "future": [
          "saprò",
          "saprai",
          "saprà",
          "sapremo",
          "saprete",
          "sapranno"
        ],
        "conditional": [
          "saprei",
          "sapresti",
          "saprebbe",
          "sapremmo",
          "sapreste",
          "saprebbero"
        ],
        "subjunctive": [
          "sappia",
          "sappia",
          "sappia",
          "sappiamo",
          "sappiate",
          "sappiano"
        ],
        "imperfectSubjunctive": [
          "sapessi",
          "sapessi",
          "sapesse",
          "sapessimo",
          "sapeste",
          "sapessero"
        ],
        "pastParticiple": "saputo",
        "gerund": "sapendo"
      },
      "potere": {
        "present": [
          "posso",
          "puoi",
          "può",
          "possiamo",
          "potete",
          "possono"
        ],
        "imperfect": [
          "potevo",
          "potevi",
          "poteva",
          "potevamo",
          "potevate",
          "potevano"
        ],
        "past": [
          "potei",
          "potesti",
          "poté",
          "potemmo",
          "poteste",
          "poterono"
        ],
        "future": [
          "potrò",
          "potrai",
          "potrà",
          "potremo",
          "potrete",
          "potranno"
        ],
        "conditional": [
          "potrei",
          "potresti",
          "potrebbe",
          "potremmo",
          "potreste",
          "potrebbero"
        ],
        "subjunctive": [
          "possa",
          "possa",
          "possa",
          "possiamo",
          "possiate",
          "possano"
        ],
        "imperfectSubjunctive": [
          "potessi",
          "potessi",
          "potesse",
          "potessimo",
          "poteste",
          "potessero"
        ],
        "pastParticiple": "potuto",
        "gerund": "potendo"
      },
      "volere": {
        "present": [
          "voglio",
          "vuoi",
          "vuole",
          "vogliamo",
          "volete",
          "vogliono"
        ],
        "imperfect": [
          "volevo",
          "volevi",
          "voleva",
          "volevamo",
          "volevate",
          "volevano"
        ],
        "past": [
          "volli",
          "volesti",
          "volle",
          "volemmo",
          "voleste",
          "vollero"
        ],
        "future": [
          "vorrò",
          "vorrai",
          "vorrà",
          "vorremo",
          "vorrete",
          "vorranno"
        ],
        "conditional": [
          "vorrei",
          "vorresti",
          "vorrebbe",
          "vorremmo",
          "vorreste",
          "vorrebbero"
        ],
        "subjunctive": [
          "voglia",
          "voglia",
          "voglia",
          "vogliamo",
          "vogliate",
          "vogliano"
        ],
        "imperfectSubjunctive": [
          "volessi",
          "volessi",
          "volesse",
          "volessimo",
          "voleste",
          "volessero"
        ],
        "pastParticiple": "voluto",
        "gerund": "volendo"
      },
      "dovere": {
        "present": [
          "devo",
          "devi",
          "deve",
          "dobbiamo",
          "dovete",
          "devono"
        ],
        "imperfect": [
          "dovevo",
          "dovevi",
          "doveva",
          "dovevamo",
          "dovevate",
          "dovevano"
        ],
        "past": [
          "dovetti",
          "dovesti",
          "dovette",
          "dovemmo",
          "doveste",
          "dovettero"
        ],
        "future": [
          "dovrò",
          "dovrai",
          "dovrà",
          "dovremo",
          "dovrete",
          "dovranno"
        ],
        "conditional": [
          "dovrei",
          "dovresti",
          "dovrebbe",
          "dovremmo",
          "dovreste",
          "dovrebbero"
        ],
        "subjunctive": [
          "debba",
          "debba",
          "debba",
          "dobbiamo",
          "dobbiate",
          "debbano"
        ],
        "imperfectSubjunctive": [
          "dovessi",
          "dovessi",
          "dovesse",
          "dovessimo",
          "doveste",
          "dovessero"
        ],
        "pastParticiple": "dovuto",
        "gerund": "dovendo"
      },
      "bere": {
        "present": [
          "bevo",
          "bevi",
          "beve",
          "beviamo",
          "bevete",
          "bevono"
        ],
        "imperfect": [
          "bevevo",
          "bevevi",
          "beveva",
          "bevevamo",
          "bevevate",
          "bevevano"
        ],
        "past": [
          "bevvi",
          "bevesti",
          "bevve",
          "bevemmo",
          "beveste",
          "bevvero"
        ],
        "future": [
          "berrò",
          "berrai",
          "berrà",
          "berremo",
          "berrete",
          "berranno"
        ],
        "conditional": [
          "berrei",
          "berresti",
          "berrebbe",
          "berremmo",
          "berreste",
          "berrebbero"
        ],
        "subjunctive": [
          "beva",
          "beva",
          "beva",
          "beviamo",
          "beviate",
          "bevano"
        ],
        "imperfectSubjunctive": [
          "bevessi",
          "bevessi",
          "bevesse",
          "bevessimo",
          "beveste",
          "bevessero"
        ],
        "pastParticiple": "bevuto",
        "gerund": "bevendo"
      },
      "uscire": {
        "present": [
          "esco",
          "esci",
          "esce",
          "usciamo",
          "uscite",
          "escono"
        ],
        "imperfect": [
          "uscivo",
          "uscivi",
          "usciva",
          "uscivamo",
          "uscivate",
          "uscivano"
        ],
        "past": [
          "uscii",
          "uscisti",
          "uscì",
          "uscimmo",
          "usciste",
          "uscirono"
        ],
        "future": [
          "uscirò",
          "uscirai",
          "uscirà",
          "usciremo",
          "uscirete",
          "usciranno"
        ],
        "conditional": [
          "uscirei",
          "usciresti",
          "uscirebbe",
          "usciremmo",
          "uscireste",
          "uscirebbero"
        ],
        "subjunctive": [
          "esca",
          "esca",
          "esca",
          "usciamo",
          "usciate",
          "escano"
        ],
        "imperfectSubjunctive": [
          "uscissi",
          "uscissi",
          "uscisse",
          "uscissimo",
          "usciste",
          "uscissero"
        ],
        "pastParticiple": "uscito",
        "gerund": "uscendo"
      },
      "rimanere": {
        "present": [
          "rimango",
          "rimani",
          "rimane",
          "rimaniamo",
          "rimanete",
          "rimangono"
        ],
        "imperfect": [
          "rimanevo",
          "rimanevi",
          "rimaneva",
          "rimanevamo",
          "rimanevate",
          "rimanevano"
        ],
        "past": [
          "rimasi",
          "rimanesti",
          "rimase",
          "rimanemmo",
          "rimaneste",
          "rimasero"
        ],
        "future": [
          "rimarrò",
          "rimarrai",
          "rimarrà",
          "rimarremo",
          "rimarrete",
          "rimarranno"
        ],
        "conditional": [
          "rimarrei",
          "rimarresti",
          "rimarrebbe",
          "rimarremmo",
          "rimarreste",
          "rimarrebbero"
        ],
        "subjunctive": [
          "rimanga",
          "rimanga",
          "rimanga",
          "rimaniamo",
          "rimaniate",
          "rimangano"
        ],
        "imperfectSubjunctive": [
          "rimanessi",
          "rimanessi",
          "rimanesse",
          "rimanessimo",
          "rimaneste",
          "rimanessero"
        ],
        "pastParticiple": "rimasto",
        "gerund": "rimanendo"
      },
      "scegliere": {
        "present": [
          "scelgo",
          "scegli",
          "sceglie",
          "scegliamo",
          "scegliete",
          "scelgono"
        ],
        "imperfect": [
          "sceglievo",
          "sceglievi",
          "sceglieva",
          "sceglievamo",
          "sceglievate",
          "sceglievano"
        ],
        "past": [
          "scelsi",
          "scegliesti",
          "scelse",
          "scegliemmo",
          "sceglieste",
          "scelsero"
        ],
        "future": [
          "sceglierò",
          "sceglierai",
          "sceglierà",
          "sceglieremo",
          "sceglierete",
          "sceglieranno"
        ],
        "conditional": [
          "sceglierei",
          "sceglieresti",
          "sceglierebbe",
          "sceglieremmo",
          "scegliereste",
          "sceglierebbero"
        ],
        "subjunctive": [
          "scelga",
          "scelga",
          "scelga",
          "scegliamo",
          "scegliate",
          "scelgano"
        ],
        "imperfectSubjunctive": [
          "scegliessi",
          "scegliessi",
          "scegliesse",
          "scegliessimo",
          "sceglieste",
          "scegliessero"
        ],
        "pastParticiple": "scelto",
        "gerund": "scegliendo"
      },
      "tenere": {
        "present": [
          "tengo",
          "tieni",
          "tiene",
          "teniamo",
          "tenete",
          "tengono"
        ],
        "imperfect": [
          "tenevo",
          "tenevi",
          "teneva",
          "tenevamo",
          "tenevate",
          "tenevano"
        ],
        "past": [
          "tenni",
          "tenesti",
          "tenne",
          "tenemmo",
          "teneste",
          "tennero"
        ],
        "future": [
          "terrò",
          "terrai",
          "terrà",
          "terremo",
          "terrete",
          "terranno"
        ],
        "conditional": [
          "terrei",
          "terresti",
          "terrebbe",
          "terremmo",
          "terreste",
          "terrebbero"
        ],
        "subjunctive": [
          "tenga",
          "tenga",
          "tenga",
          "teniamo",
          "teniate",
          "tengano"
        ],
        "imperfectSubjunctive": [
          "tenessi",
          "tenessi",
          "tenesse",
          "tenessimo",
          "teneste",
          "tenessero"
        ],
        "pastParticiple": "tenuto",
        "gerund": "tenendo"
      },
      "morire": {
        "present": [
          "muoio",
          "muori",
          "muore",
          "moriamo",
          "morite",
          "muoiono"
        ],
        "imperfect": [
          "morivo",
          "morivi",
          "moriva",
          "morivamo",
          "morivate",
          "morivano"
        ],
        "past": [
          "morii",
          "moristi",
          "morì",
          "morimmo",
          "moriste",
          "morirono"
        ],
        "future": [
          "morirò",
          "morirai",
          "morirà",
          "moriremo",
          "morirete",
          "moriranno"
        ],
        "conditional": [
          "morirei",
          "moriresti",
          "morirebbe",
          "moriremmo",
          "morireste",
          "morirebbero"
        ],
        "subjunctive": [
          "muoia",
          "muoia",
          "muoia",
          "moriamo",
          "moriate",
          "muoiano"
        ],
        "imperfectSubjunctive": [
          "morissi",
          "morissi",
          "morisse",
          "morissimo",
          "moriste",
          "morissero"
        ],
        "pastParticiple": "morto",
        "gerund": "morendo"
      },
      "salire": {
        "present": [
          "salgo",
          "sali",
          "sale",
          "saliamo",
          "salite",
          "salgono"
        ],
        "imperfect": [
          "salivo",
          "salivi",
          "saliva",
          "salivamo",
          "salivate",
          "salivano"
        ],
        "past": [
          "salii",
          "salisti",
          "salì",
          "salimmo",
          "saliste",
          "salirono"
        ],
        "future": [
          "salirò",
          "salirai",
          "salirà",
          "saliremo",
          "salirete",
          "saliranno"
        ],
        "conditional": [
          "salirei",
          "saliresti",
          "salirebbe",
          "saliremmo",
          "salireste",
          "salirebbero"
        ],
        "subjunctive": [
          "salga",
          "salga",
          "salga",
          "saliamo",
          "saliate",
          "salgano"
        ],
        "imperfectSubjunctive": [
          "salissi",
          "salissi",
          "salisse",
          "salissimo",
          "saliste",
          "salissero"
        ],
        "pastParticiple": "salito",
        "gerund": "salendo"
      },
      "porre": {
        "present": [
          "pongo",
          "poni",
          "pone",
          "poniamo",
          "ponete",
          "pongono"
        ],
        "imperfect": [
          "ponevo",
          "ponevi",
          "poneva",
          "ponevamo",
          "ponevate",
          "ponevano"
        ],
        "past": [
          "posi",
          "ponesti",
          "pose",
          "ponemmo",
          "poneste",
          "posero"
        ],
        "future": [
          "porrò",
          "porrai",
          "porrà",
          "porremo",
          "porrete",
          "porranno"
        ],
        "conditional": [
          "porrei",
          "porresti",
          "porrebbe",
          "porremmo",
          "porreste",
          "porrebbero"
        ],
        "subjunctive": [
          "ponga",
          "ponga",
          "ponga",
          "poniamo",
          "poniate",
          "pongano"
        ],
        "imperfectSubjunctive": [
          "ponessi",
          "ponessi",
          "ponesse",
          "ponessimo",
          "poneste",
          "ponessero"
        ],
        "pastParticiple": "posto",
        "gerund": "ponendo"
      },
      "tradurre": {
        "present": [
          "traduco",
          "traduci",
          "traduce",
          "traduciamo",
          "traducete",
          "traducono"
        ],
        "imperfect": [
          "traducevo",
          "traducevi",
          "traduceva",
          "traducevamo",
          "traducevate",
          "traducevano"
        ],
        "past": [
          "tradussi",
          "traducesti",
          "tradusse",
          "traducemmo",
          "traduceste",
          "tradussero"
        ],
        "future": [
          "tradurrò",
          "tradurrai",
          "tradurrà",
          "tradurremo",
          "tradurrete",
          "tradurranno"
        ],
        "conditional": [
          "tradurrei",
          "tradurresti",
          "tradurrebbe",
          "tradurremmo",
          "tradurreste",
          "tradurrebbero"
        ],
        "subjunctive": [
          "traduca",
          "traduca",
          "traduca",
          "traduciamo",
          "traduciate",
          "traducano"
        ],
        "imperfectSubjunctive": [
          "traducessi",
          "traducessi",
          "traducesse",
          "traducessimo",
          "traduceste",
          "traducessero"
        ],
        "pastParticiple": "tradotto",
        "gerund": "traducendo"
      },
      "produrre": {
        "present": [
          "produco",
          "produci",
          "produce",
          "produciamo",
          "producete",
          "producono"
        ],
        "imperfect": [
          "producevo",
          "producevi",
          "produceva",
          "producevamo",
          "producevate",
          "producevano"
        ],
        "past": [
          "produssi",
          "producesti",
          "produsse",
          "producemmo",
          "produceste",
          "produssero"
        ],
        "future": [
          "produrrò",
          "produrrai",
          "produrrà",
          "produrremo",
          "produrrete",
          "produrranno"
        ],
        "conditional": [
          "produrrei",
          "produrresti",
          "produrrebbe",
          "produrremmo",
          "produrreste",
          "produrrebbero"
        ],
        "subjunctive": [
          "produca",
          "produca",
          "produca",
          "produciamo",
          "produciate",
          "producano"
        ],
        "imperfectSubjunctive": [
          "producessi",
          "producessi",
          "producesse",
          "producessimo",
          "produceste",
          "producessero"
        ],
        "pastParticiple": "prodotto",
        "gerund": "producendo"
      },
      "piacere": {
        "present": [
          "piaccio",
          "piaci",
          "piace",
          "piacciamo",
          "piacete",
          "piacciono"
        ],
        "imperfect": [
          "piacevo",
          "piacevi",
          "piaceva",
          "piacevamo",
          "piacevate",
          "piacevano"
        ],
        "past": [
          "piacqui",
          "piacesti",
          "piacque",
          "piacemmo",
          "piaceste",
          "piacquero"
        ],
        "future": [
          "piacerò",
          "piacerai",
          "piacerà",
          "piaceremo",
          "piacerete",
          "piaceranno"
        ],
        "conditional": [
          "piacerei",
          "piaceresti",
          "piacerebbe",
          "piaceremmo",
          "piacereste",
          "piacerebbero"
        ],
        "subjunctive": [
          "piaccia",
          "piaccia",
          "piaccia",
          "piacciamo",
          "piacciate",
          "piacciano"
        ],
        "imperfectSubjunctive": [
          "piacessi",
          "piacessi",
          "piacesse",
          "piacessimo",
          "piaceste",
          "piacessero"
        ],
        "pastParticiple": "piaciuto",
        "gerund": "piacendo"
      },
      "togliere": {
        "present": [
          "tolgo",
          "togli",
          "toglie",
          "togliamo",
          "togliete",
          "tolgono"
        ],
        "imperfect": [
          "toglievo",
          "toglievi",
          "toglieva",
          "toglievamo",
          "toglievate",
          "toglievano"
        ],
        "past": [
          "tolsi",
          "togliesti",
          "tolse",
          "togliemmo",
          "toglieste",
          "tolsero"
        ],
        "future": [
          "toglierò",
          "toglierai",
          "toglierà",
          "toglieremo",
          "toglierete",
          "toglieranno"
        ],
        "conditional": [
          "toglierei",
          "toglieresti",
          "toglierebbe",
          "toglieremmo",
          "togliereste",
          "toglierebbero"
        ],
        "subjunctive": [
          "tolga",
          "tolga",
          "tolga",
          "togliamo",
          "togliate",
          "tolgano"
        ],
        "imperfectSubjunctive": [
          "togliessi",
          "togliessi",
          "togliesse",
          "togliessimo",
          "toglieste",
          "togliessero"
        ],
        "pastParticiple": "tolto",
        "gerund": "togliendo"
      },
      "cogliere": {
        "present": [
          "colgo",
          "cogli",
          "coglie",
          "cogliamo",
          "cogliete",
          "colgono"
        ],
        "imperfect": [
          "coglievo",
          "coglievi",
          "coglieva",
          "coglievamo",
          "coglievate",
          "coglievano"
        ],
        "past": [
          "colsi",
          "cogliesti",
          "colse",
          "cogliemmo",
          "coglieste",
          "colsero"
        ],
        "future": [
          "coglierò",
          "coglierai",
          "coglierà",
          "coglieremo",
          "coglierete",
          "coglieranno"
        ],
        "conditional": [
          "coglierei",
          "coglieresti",
          "coglierebbe",
          "coglieremmo",
          "cogliereste",
          "coglierebbero"
        ],
        "subjunctive": [
          "colga",
          "colga",
          "colga",
          "cogliamo",
          "cogliate",
          "colgano"
        ],
        "imperfectSubjunctive": [
          "cogliessi",
          "cogliessi",
          "cogliesse",
          "cogliessimo",
          "coglieste",
          "cogliessero"
        ],
        "pastParticiple": "colto",
        "gerund": "cogliendo"
      },
      "spegnere": {
        "present": [
          "spengo",
          "spegni",
          "spegne",
          "spegniamo",
          "spegnete",
          "spengono"
        ],
        "imperfect": [
          "spegnevo",
          "spegnevi",
          "spegneva",
          "spegnevamo",
          "spegnevate",
          "spegnevano"
        ],
        "past": [
          "spensi",
          "spegnesti",
          "spense",
          "spegnemmo",
          "spegneste",
          "spensero"
        ],
        "future": [
          "spegnerò",
          "spegnerai",
          "spegnerà",
          "spegneremo",
          "spegnerete",
          "spegneranno"
        ],
        "conditional": [
          "spegnerei",
          "spegneresti",
          "spegnerebbe",
          "spegneremmo",
          "spegnereste",
          "spegnerebbero"
        ],
        "subjunctive": [
          "spenga",
          "spenga",
          "spenga",
          "spegniamo",
          "spegniate",
          "spengano"
        ],
        "imperfectSubjunctive": [
          "spegnessi",
          "spegnessi",
          "spegnesse",
          "spegnessimo",
          "spegneste",
          "spegnessero"
        ],
        "pastParticiple": "spento",
        "gerund": "spegnendo"
      },
      "vedere": {
        "present": [
          "vedo",
          "vedi",
          "vede",
          "vediamo",
          "vedete",
          "vedono"
        ],
        "imperfect": [
          "vedevo",
          "vedevi",
          "vedeva",
          "vedevamo",
          "vedevate",
          "vedevano"
        ],
        "past": [
          "vidi",
          "vedesti",
          "vide",
          "vedemmo",
          "vedeste",
          "videro"
        ],
        "future": [
          "vedrò",
          "vedrai",
          "vedrà",
          "vedremo",
          "vedrete",
          "vedranno"
        ],
        "conditional": [
          "vedrei",
          "vedresti",
          "vedrebbe",
          "vedremmo",
          "vedreste",
          "vedrebbero"
        ],
        "subjunctive": [
          "veda",
          "veda",
          "veda",
          "vediamo",
          "vediate",
          "vedano"
        ],
        "imperfectSubjunctive": [
          "vedessi",
          "vedessi",
          "vedesse",
          "vedessimo",
          "vedeste",
          "vedessero"
        ],
        "pastParticiple": "visto",
        "gerund": "vedendo"
      },
      "vivere": {
        "present": [
          "vivo",
          "vivi",
          "vive",
          "viviamo",
          "vivete",
          "vivono"
        ],
        "imperfect": [
          "vivevo",
          "vivevi",
          "viveva",
          "vivevamo",
          "vivevate",
          "vivevano"
        ],
        "past": [
          "vissi",
          "vivesti",
          "visse",
          "vivemmo",
          "viveste",
          "vissero"
        ],
        "future": [
          "vivrò",
          "vivrai",
          "vivrà",
          "vivremo",
          "vivrete",
          "vivranno"
        ],
        "conditional": [
          "vivrei",
          "vivresti",
          "vivrebbe",
          "vivremmo",
          "vivreste",
          "vivrebbero"
        ],
        "subjunctive": [
          "viva",
          "viva",
          "viva",
          "viviamo",
          "viviate",
          "vivano"
        ],
        "imperfectSubjunctive": [
          "vivessi",
          "vivessi",
          "vivesse",
          "vivessimo",
          "viveste",
          "vivessero"
        ],
        "pastParticiple": "vissuto",
        "gerund": "vivendo"
      },
      "valere": {
        "present": [
          "valgo",
          "vali",
          "vale",
          "valiamo",
          "valete",
          "valgono"
        ],
        "imperfect": [
          "valevo",
          "valevi",
          "valeva",
          "valevamo",
          "valevate",
          "valevano"
        ],
        "past": [
          "valsi",
          "valesti",
          "valse",
          "valemmo",
          "valeste",
          "valsero"
        ],
        "future": [
          "varrò",
          "varrai",
          "varrà",
          "varremo",
          "varrete",
          "varranno"
        ],
        "conditional": [
          "varrei",
          "varresti",
          "varrebbe",
          "varremmo",
          "varreste",
          "varrebbero"
        ],
        "imperfectSubjunctive": [
          "valessi",
          "valessi",
          "valesse",
          "valessimo",
          "valeste",
          "valessero"
        ],
        "pastParticiple": "valso",
        "gerund": "valendo"
      },
      "cadere": {
        "present": [
          "cado",
          "cadi",
          "cade",
          "cadiamo",
          "cadete",
          "cadono"
        ],
        "imperfect": [
          "cadevo",
          "cadevi",
          "cadeva",
          "cadevamo",
          "cadevate",
          "cadevano"
        ],
        "past": [
          "caddi",
          "cadesti",
          "cadde",
          "cademmo",
          "cadeste",
          "caddero"
        ],
        "future": [
          "cadrò",
          "cadrai",
          "cadrà",
          "cadremo",
          "cadrete",
          "cadranno"
        ],
        "conditional": [
          "cadrei",
          "cadresti",
          "cadrebbe",
          "cadremmo",
          "cadreste",
          "cadrebbero"
        ],
        "subjunctive": [
          "cada",
          "cada",
          "cada",
          "cadiamo",
          "cadiate",
          "cadano"
        ],
        "imperfectSubjunctive": [
          "cadessi",
          "cadessi",
          "cadesse",
          "cadessimo",
          "cadeste",
          "cadessero"
        ],
        "pastParticiple": "caduto",
        "gerund": "cadendo"
      },
      "sedere": {
        "present": [
          "sièdo",
          "sièdi",
          "siède",
          "sediamo",
          "sedete",
          "sièdono"
        ],
        "imperfect": [
          "sedevo",
          "sedevi",
          "sedeva",
          "sedevamo",
          "sedevate",
          "sedevano"
        ],
        "past": [
          "sedei",
          "sedesti",
          "sedé",
          "sedemmo",
          "sedeste",
          "sederono"
        ],
        "future": [
          "sederò",
          "sederai",
          "sederà",
          "sederemo",
          "sederete",
          "sederanno"
        ],
        "conditional": [
          "sederei",
          "sederesti",
          "sederebbe",
          "sederemmo",
          "sedereste",
          "sederebbero"
        ],
        "subjunctive": [
          "sièda",
          "sièda",
          "sièda",
          "sediamo",
          "sediate",
          "sièdano"
        ],
        "imperfectSubjunctive": [
          "sedessi",
          "sedessi",
          "sedesse",
          "sedessimo",
          "sedeste",
          "sedessero"
        ],
        "pastParticiple": "seduto",
        "gerund": "sedendo"
      },
      "tacere": {
        "present": [
          "taccio",
          "taci",
          "tace",
          "tacciamo",
          "tacete",
          "tacciono"
        ],
        "imperfect": [
          "tacevo",
          "tacevi",
          "taceva",
          "tacevamo",
          "tacevate",
          "tacevano"
        ],
        "past": [
          "tacqui",
          "tacesti",
          "tacque",
          "tacemmo",
          "taceste",
          "tacquero"
        ],
        "future": [
          "tacerò",
          "tacerai",
          "tacerà",
          "taceremo",
          "tacerete",
          "taceranno"
        ],
        "conditional": [
          "tacerei",
          "taceresti",
          "tacerebbe",
          "taceremmo",
          "tacereste",
          "tacerebbero"
        ],
        "subjunctive": [
          "taccia",
          "taccia",
          "taccia",
          "tacciamo",
          "tacciate",
          "tacciano"
        ],
        "imperfectSubjunctive": [
          "tacessi",
          "tacessi",
          "tacesse",
          "tacessimo",
          "taceste",
          "tacessero"
        ],
        "pastParticiple": "taciuto",
        "gerund": "tacendo"
      },
      "trarre": {
        "present": [
          "traggo",
          "trai",
          "trae",
          "traiamo",
          "traete",
          "traggono"
        ],
        "imperfect": [
          "traevo",
          "traevi",
          "traeva",
          "traevamo",
          "traevate",
          "traevano"
        ],
        "past": [
          "trassi",
          "traesti",
          "trasse",
          "traemmo",
          "traeste",
          "trassero"
        ],
        "future": [
          "trarrò",
          "trarrai",
          "trarrà",
          "trarremo",
          "trarrete",
          "trarranno"
        ],
        "conditional": [
          "trarrei",
          "trarresti",
          "trarrebbe",
          "trarremmo",
          "trarreste",
          "trarrebbero"
        ],
        "subjunctive": [
          "tragga",
          "tragga",
          "tragga",
          "traiamo",
          "traiate",
          "traggano"
        ],
        "imperfectSubjunctive": [
          "traessi",
          "traessi",
          "traesse",
          "traessimo",
          "traeste",
          "traessero"
        ],
        "pastParticiple": "tratto",
        "gerund": "traendo"
      },
      "condurre": {
        "present": [
          "conduco",
          "conduci",
          "conduce",
          "conduciamo",
          "conducete",
          "conducono"
        ],
        "imperfect": [
          "conducevo",
          "conducevi",
          "conduceva",
          "conducevamo",
          "conducevate",
          "conducevano"
        ],
        "past": [
          "condussi",
          "conducesti",
          "condusse",
          "conducemmo",
          "conduceste",
          "condussero"
        ],
        "future": [
          "condurrò",
          "condurrai",
          "condurrà",
          "condurremo",
          "condurrete",
          "condurranno"
        ],
        "conditional": [
          "condurrei",
          "condurresti",
          "condurrebbe",
          "condurremmo",
          "condurreste",
          "condurrebbero"
        ],
        "subjunctive": [
          "conduca",
          "conduca",
          "conduca",
          "conduciamo",
          "conduciate",
          "conducano"
        ],
        "imperfectSubjunctive": [
          "conducessi",
          "conducessi",
          "conducesse",
          "conducessimo",
          "conduceste",
          "conducessero"
        ],
        "pastParticiple": "condotto",
        "gerund": "conducendo"
      },
      "ridurre": {
        "present": [
          "riduco",
          "riduci",
          "riduce",
          "riduciamo",
          "riducete",
          "riducono"
        ],
        "imperfect": [
          "riducevo",
          "riducevi",
          "riduceva",
          "riducevamo",
          "riducevate",
          "riducevano"
        ],
        "past": [
          "ridussi",
          "riducesti",
          "ridusse",
          "riducemmo",
          "riduceste",
          "ridussero"
        ],
        "future": [
          "ridurrò",
          "ridurrai",
          "ridurrà",
          "ridurremo",
          "ridurrete",
          "ridurranno"
        ],
        "conditional": [
          "ridurrei",
          "ridurresti",
          "ridurrebbe",
          "ridurremmo",
          "ridurreste",
          "ridurrebbero"
        ],
        "subjunctive": [
          "riduca",
          "riduca",
          "riduca",
          "riduciamo",
          "riduciate",
          "riducano"
        ],
        "imperfectSubjunctive": [
          "riducessi",
          "riducessi",
          "riducesse",
          "riducessimo",
          "riduceste",
          "riducessero"
        ],
        "pastParticiple": "ridotto",
        "gerund": "riducendo"
      },
      "apparire": {
        "present": [
          "appaio",
          "appari",
          "appare",
          "appariamo",
          "apparite",
          "appaiono"
        ],
        "imperfect": [
          "apparivo",
          "apparivi",
          "appariva",
          "apparivamo",
          "apparivate",
          "apparivano"
        ],
        "past": [
          "apparvi",
          "apparisti",
          "apparve",
          "apparimmo",
          "appariste",
          "apparvero"
        ],
        "future": [
          "apparirò",
          "apparirai",
          "apparirà",
          "appariremo",
          "apparirete",
          "appariranno"
        ],
        "conditional": [
          "apparirei",
          "appariresti",
          "apparirebbe",
          "appariremmo",
          "apparireste",
          "apparirebbero"
        ],
        "subjunctive": [
          "appaia",
          "appaia",
          "appaia",
          "appariamo",
          "appariate",
          "appaiano"
        ],
        "imperfectSubjunctive": [
          "apparissi",
          "apparissi",
          "apparisse",
          "apparissimo",
          "appariste",
          "apparissero"
        ],
        "pastParticiple": "apparso",
        "gerund": "apparendo"
      },
      "parere": {
        "present": [
          "paio",
          "pari",
          "pare",
          "paiamo",
          "parete",
          "paiono"
        ],
        "imperfect": [
          "parevo",
          "parevi",
          "pareva",
          "parevamo",
          "parevate",
          "parevano"
        ],
        "past": [
          "parvi",
          "paresti",
          "parve",
          "paremmo",
          "pareste",
          "parvero"
        ],
        "future": [
          "parrò",
          "parrai",
          "parrà",
          "parremo",
          "parrete",
          "parranno"
        ],
        "conditional": [
          "parrei",
          "parresti",
          "parrebbe",
          "parremmo",
          "parreste",
          "parrebbero"
        ],
        "subjunctive": [
          "paia",
          "paia",
          "paia",
          "paiamo",
          "paiate",
          "paiano"
        ],
        "imperfectSubjunctive": [
          "paressi",
          "paressi",
          "paresse",
          "paressimo",
          "pareste",
          "paressero"
        ],
        "pastParticiple": "parso",
        "gerund": "parendo"
      }
    },
    "participles": {
      "essere": "stato",
      "vedere": "visto",
      "dire": "detto",
      "fare": "fatto",
      "prendere": "preso",
      "vivere": "vissuto",
      "venire": "venuto",
      "uccidere": "ucciso",
      "raggiungere": "raggiunto",
      "mettere": "messo",
      "ridurre": "ridotto",
      "promuovere": "promosso",
      "scegliere": "scelto",
      "morire": "morto",
      "chiedere": "chiesto",
      "rendere": "reso",
      "scoprire": "scoperto",
      "perdere": "perso",
      "proteggere": "protetto",
      "aggiungere": "aggiunto",
      "leggere": "letto",
      "offrire": "offerto",
      "rispondere": "risposto",
      "rimanere": "rimasto",
      "aprire": "aperto",
      "risolvere": "risolto",
      "conoscere": "conosciuto",
      "scrivere": "scritto",
      "soddisfare": "soddisfatto",
      "vincere": "vinto",
      "condividere": "condiviso",
      "decidere": "deciso",
      "permettere": "permesso",
      "comprendere": "compreso",
      "produrre": "prodotto",
      "discutere": "discusso",
      "riconoscere": "riconosciuto",
      "crescere": "cresciuto",
      "prevenire": "prevenuto",
      "esprimere": "espresso",
      "svolgere": "svolto",
      "includere": "incluso",
      "smettere": "smesso",
      "chiudere": "chiuso",
      "raccogliere": "raccolto",
      "rimuovere": "rimosso",
      "coprire": "coperto",
      "distruggere": "distrutto",
      "assumere": "assunto",
      "correre": "corso",
      "richiedere": "richiesto",
      "introdurre": "introdotto",
      "sopravvivere": "sopravvissuto",
      "piacere": "piaciuto",
      "difendere": "difeso",
      "nascondere": "nascosto",
      "concludere": "concluso",
      "proporre": "proposto",
      "ammettere": "ammesso",
      "condurre": "condotto",
      "piangere": "pianto",
      "riflettere": "riflesso",
      "accogliere": "accolto",
      "trasmettere": "trasmesso",
      "trascorrere": "trascorso",
      "assistere": "assistito",
      "imporre": "imposto",
      "convincere": "convinto",
      "estendere": "esteso",
      "prevedere": "previsto",
      "intervenire": "intervenuto",
      "ridere": "riso",
      "disporre": "disposto",
      "intraprendere": "intrapreso",
      "descrivere": "descritto",
      "rivedere": "rivisto",
      "scendere": "sceso",
      "togliere": "tolto",
      "resistere": "resistito",
      "escludere": "escluso",
      "coinvolgere": "coinvolto",
      "spendere": "speso",
      "soffrire": "sofferto",
      "rompere": "rotto",
      "correggere": "corretto",
      "apparire": "apparso",
      "accrescere": "accresciuto",
      "cogliere": "colto",
      "diffondere": "diffuso",
      "interrompere": "interrotto",
      "fingere": "finto",
      "dividere": "diviso",
      "spingere": "spinto",
      "muovere": "mosso",
      "porre": "posto",
      "giungere": "giunto",
      "esistere": "esistito",
      "ricorrere": "ricorso",
      "esplodere": "esploso",
      "cuocere": "cotto",
      "compromettere": "compromesso",
      "sospendere": "sospeso",
      "riprendere": "ripreso",
      "distinguere": "distinto",
      "dipingere": "dipinto",
      "respingere": "respinto",
      "tradurre": "tradotto",
      "parere": "parso",
      "attendere": "atteso",
      "dirigere": "diretto",
      "insistere": "insistito",
      "sorridere": "sorriso",
      "estrarre": "estratto",
      "riprodurre": "riprodotto",
      "spegnere": "spento",
      "sconfiggere": "sconfitto",
      "accendere": "acceso",
      "esigere": "esatto",
      "esporre": "esposto",
      "avvenire": "avvenuto",
      "trarre": "tratto",
      "espandere": "espanso",
      "scommettere": "scommesso",
      "apprendere": "appreso",
      "incidere": "inciso",
      "divenire": "divenuto",
      "commettere": "commesso",
      "scomparire": "scomparso",
      "indurre": "indotto",
      "redigere": "redatto",
      "percorrere": "percorso",
      "sciogliere": "sciolto",
      "corrispondere": "corrisposto",
      "attrarre": "attratto",
      "nascere": "nato",
      "sopprimere": "soppresso",
      "confondere": "confuso",
      "scorrere": "scorso",
      "emettere": "emesso",
      "bere": "bevuto",
      "sottoporre": "sottoposto",
      "appendere": "appeso",
      "supporre": "supposto",
      "stringere": "stretto",
      "tacere": "taciuto",
      "promettere": "promesso",
      "provvedere": "provvisto",
      "rivivere": "rivissuto",
      "rivolgere": "rivolto",
      "emergere": "emerso",
      "pretendere": "preteso",
      "costringere": "costretto",
      "sorgere": "sorto",
      "riscoprire": "riscoperto",
      "valere": "valso",
      "dipendere": "dipeso",
      "convivere": "convissuto",
      "comporre": "composto",
      "immettere": "immesso",
      "assolvere": "assolto",
      "predisporre": "predisposto",
      "infrangere": "infranto",
      "riaprire": "riaperto",
      "pervenire": "pervenuto",
      "comparire": "comparso",
      "presumere": "presunto",
      "provenire": "provenuto",
      "reggere": "retto",
      "intendere": "inteso",
      "prescrivere": "prescritto",
      "sedurre": "sedotto",
      "invadere": "invaso",
      "connettere": "connesso",
      "rimettere": "rimesso",
      "riassumere": "riassunto",
      "persuadere": "persuaso",
      "prevalere": "prevalso",
      "eludere": "eluso",
      "riscuotere": "riscosso",
      "corrompere": "corrotto",
      "dedurre": "dedotto",
      "distrarre": "distratto",
      "sottoscrivere": "sottoscritto",
      "benedire": "benedetto",
      "mordere": "morso",
      "fondere": "fuso",
      "decorrere": "decorso",
      "evolvere": "evoluto",
      "predire": "predetto",
      "friggere": "fritto",
      "sorprendere": "sorpreso",
      "eleggere": "eletto",
      "svenire": "svenuto",
      "restringere": "restretto",
      "iscrivere": "iscritto",
      "espellere": "espulso",
      "ricoprire": "ricoperto",
      "attingere": "attinto",
      "evadere": "evaso",
      "riscrivere": "riscritto",
      "stendere": "steso",
      "scorgere": "scorto",
      "avvolgere": "avvolto",
      "offendere": "offeso",
      "scuotere": "scosso",
      "spargere": "sparso",
      "infliggere": "inflitto",
      "nuocere": "nociuto",
      "riporre": "riposto",
      "deludere": "deluso",
      "erigere": "eretto",
      "deporre": "deposto",
      "immergere": "immerso",
      "insorgere": "insorto",
      "disfare": "disfatto",
      "persistere": "persistito",
      "comprimere": "compresso",
      "consistere": "consistito",
      "reprimere": "represso",
      "rifare": "rifatto",
      "disdire": "disdetto",
      "porgere": "porto",
      "contrarre": "contratto",
      "sottrarre": "sottratto",
      "suddividere": "suddiviso",
      "coesistere": "coesistito",
      "coincidere": "coinciso",
      "tendere": "teso",
      "capovolgere": "capovolto",
      "convenire": "convenuto",
      "disperdere": "disperso",
      "compiacere": "compiaciuto",
      "distorcere": "distorto",
      "dissuadere": "dissuaso",
      "sovrascrivere": "sovrascritto",
      "rileggere": "riletto",
      "trascendere": "trasceso",
      "contraddire": "contraddetto",
      "rimpiangere": "rimpianto",
      "infondere": "infuso",
      "concorrere": "concorso",
      "ascendere": "asceso",
      "soccorrere": "soccorso",
      "sopraffare": "sopraffatto",
      "rincorrere": "rincorso",
      "rinascere": "rinato",
      "detrarre": "detratto",
      "sottomettere": "sottomesso",
      "incorrere": "incorso",
      "indulgere": "indulto",
      "convergere": "converso",
      "cospargere": "cosparso",
      "estinguere": "estinto",
      "omettere": "omesso",
      "sconvolgere": "sconvolto",
      "volgere": "volto",
      "mungere": "munto",
      "indire": "indetto",
      "redimere": "redento",
      "irrompere": "irrotto",
      "distogliere": "distolto",
      "maledire": "maledetto",
      "giacere": "giaciuto",
      "apporre": "apposto",
      "decomprimere": "decompresso",
      "ungere": "unto",
      "rinchiudere": "rinchiuso",
      "precludere": "precluso",
      "sussistere": "sussistito",
      "ripercorrere": "ripercorso",
      "riaccendere": "riacceso",
      "ardere": "arso",
      "presupporre": "presupposto",
      "ledere": "leso",
      "sporgere": "sporto",
      "soffriggere": "soffritto",
      "dissolvere": "dissolto",
      "ritrarre": "ritratto",
      "dimettere": "dimesso",
      "discendere": "disceso",
      "fraintendere": "frainteso",
      "prescindere": "prescisso",
      "trasporre": "trasposto",
      "arrendere": "arreso",
      "estorcere": "estorto",
      "addivenire": "addivenuto",
      "radere": "raso",
      "opporre": "opposto",
      "desistere": "desistito",
      "intravedere": "intravisto",
      "sovrapporre": "sovrapposto",
      "ridire": "ridetto",
      "sovrintendere": "sovrinteso",
      "disconnettere": "disconnesso",
      "manomettere": "manomesso",
      "posporre": "posposto",
      "racchiudere": "racchiuso",
      "circoscrivere": "circoscritto",
      "erodere": "eroso",
      "pungere": "punto",
      "deridere": "deriso",
      "rescindere": "rescisso",
      "trascrivere": "trascritto",
      "riapparire": "riapparso",
      "commuovere": "commosso",
      "tingere": "tinto",
      "opprimere": "oppresso",
      "scindere": "scisso",
      "riavvolgere": "riavvolto",
      "riemergere": "riemerso",
      "imprimere": "impresso",
      "riproporre": "riproposto",
      "crocifiggere": "crocifisso"
    },
    "gerunds": {
      "dire": "dicendo",
      "fare": "facendo",
      "ridurre": "riducendo",
      "soddisfare": "soddisfacendo",
      "produrre": "producendo",
      "introdurre": "introducendo",
      "proporre": "proponendo",
      "condurre": "conducendo",
      "imporre": "imponendo",
      "disporre": "disponendo",
      "riempire": "riempiendo",
      "porre": "ponendo",
      "tradurre": "traducendo",
      "estrarre": "estraendo",
      "riprodurre": "riproducendo",
      "esporre": "esponendo",
      "trarre": "traendo",
      "indurre": "inducendo",
      "attrarre": "attraendo",
      "bere": "bevendo",
      "sottoporre": "sottoponendo",
      "supporre": "supponendo",
      "comporre": "componendo",
      "predisporre": "predisponendo",
      "sedurre": "seducendo",
      "dedurre": "deducendo",
      "distrarre": "distraendo",
      "benedire": "benedicendo",
      "predire": "predicendo",
      "nuocere": "nocendo",
      "riporre": "riponendo",
      "deporre": "deponendo",
      "disfare": "disfacendo",
      "rifare": "rifacendo",
      "disdire": "disdicendo",
      "contrarre": "contraendo",
      "sottrarre": "sottraendo",
      "contraddire": "contraddicendo",
      "sopraffare": "sopraffacendo",
      "detrarre": "detraendo",
      "indire": "indicendo",
      "maledire": "maledicendo",
      "apporre": "apponendo",
      "presupporre": "presupponendo",
      "ritrarre": "ritraendo",
      "trasporre": "trasponendo",
      "opporre": "opponendo",
      "sovrapporre": "sovrapponendo",
      "ridire": "ridicendo",
      "posporre": "posponendo",
      "riproporre": "riproponendo"
    }
  };

  let {
    presentTense: presentTense$1,
    pastTense: pastTense$1,
    futureTense: futureTense$1,
    conditional: conditional$1,
    imperfect: imperfect$1,
    subjunctive: subjunctive$1,
  } = model$1;

  const persons = ['first', 'second', 'third', 'firstPlural', 'secondPlural', 'thirdPlural'];

  const doEach = function (str, m, tense) {
    // known-irregular verb?
    let table = irregular.paradigms[str];
    if (table && table[tense]) {
      let res = {};
      persons.forEach((p, i) => {
        res[p] = table[tense][i];
      });
      return res
    }
    return {
      first: convert(str, m.first),
      second: convert(str, m.second),
      third: convert(str, m.third),
      firstPlural: convert(str, m.firstPlural),
      secondPlural: convert(str, m.secondPlural),
      thirdPlural: convert(str, m.thirdPlural),
    }
  };

  const toPresent = (str) => doEach(str, presentTense$1, 'present');
  const toPast = (str) => doEach(str, pastTense$1, 'past');
  const toFuture = (str) => doEach(str, futureTense$1, 'future');
  const toConditional = (str) => doEach(str, conditional$1, 'conditional');
  const toImperfect = (str) => doEach(str, imperfect$1, 'imperfect');
  const toSubjunctive = (str) => doEach(str, subjunctive$1, 'subjunctive');

  // congiuntivo imperfetto is regular enough for simple rules
  // parlare -> parlassi, credere -> credessi, dormire -> dormissi
  const toImperfectSubjunctive = (str) => {
    let table = irregular.paradigms[str];
    if (table && table.imperfectSubjunctive) {
      let res = {};
      persons.forEach((p, i) => {
        res[p] = table.imperfectSubjunctive[i];
      });
      return res
    }
    let stem = str.replace(/are$/, 'a').replace(/ere$/, 'e').replace(/ire$/, 'i');
    if (stem === str) {
      return {}
    }
    return {
      first: stem + 'ssi',
      second: stem + 'ssi',
      third: stem + 'sse',
      firstPlural: stem + 'ssimo',
      secondPlural: stem + 'ste',
      thirdPlural: stem + 'ssero',
    }
  };

  // reflexive infinitive
  const toReflexive = (str) => {
    str = str.replace(/are$/, 'ar'); //armi
    str = str.replace(/ere$/, 'er'); //ermi
    str = str.replace(/ire$/, 'ir'); //irmi
    return {
      first: str + 'mi',
      second: str + 'ti',
      third: str + 'si',
      firstPlural: str + 'ci',
      secondPlural: str + 'vi',
      thirdPlural: str + 'si',
    }
  };
  // console.log(toPast('permettersi'))

  let { gerunds, pastParticiple, presentParticiple } = model$1;

  let m$1 = {
    toGerund: gerunds.gerunds,
    fromGerund: reverse(gerunds.gerunds),
    toPastParticiple: pastParticiple.pastParticiple,
    fromPastParticiple: reverse(pastParticiple.pastParticiple),
    toPresentParticiple: presentParticiple.presentParticiple,
    fromPresentParticiple: reverse(presentParticiple.presentParticiple),
  };

  // irregular participle/gerund lookups, in both directions
  let toPP = {};
  let fromPP = {};
  let toGer = {};
  let fromGer = {};
  Object.keys(irregular.participles).forEach((inf) => {
    toPP[inf] = irregular.participles[inf];
    fromPP[irregular.participles[inf]] = inf;
  });
  Object.keys(irregular.gerunds).forEach((inf) => {
    toGer[inf] = irregular.gerunds[inf];
    fromGer[irregular.gerunds[inf]] = inf;
  });
  Object.keys(irregular.paradigms).forEach((inf) => {
    let p = irregular.paradigms[inf];
    if (p.pastParticiple) {
      toPP[inf] = p.pastParticiple;
      fromPP[p.pastParticiple] = fromPP[p.pastParticiple] || inf;
    }
    if (p.gerund) {
      toGer[inf] = p.gerund;
      fromGer[p.gerund] = fromGer[p.gerund] || inf;
    }
  });
  // 'stato' is the participle of both essere and stare - prefer essere
  fromPP['stato'] = 'essere';

  const fromGerund = function (str) {
    if (fromGer.hasOwnProperty(str)) {
      return fromGer[str]
    }
    return convert(str, m$1.fromGerund)
  };
  const toGerund = function (str) {
    if (toGer.hasOwnProperty(str)) {
      return toGer[str]
    }
    return convert(str, m$1.toGerund)
  };
  const fromPastParticiple = function (str) {
    if (fromPP.hasOwnProperty(str)) {
      return fromPP[str]
    }
    return convert(str, m$1.fromPastParticiple)
  };
  const toPastParticiple = function (str) {
    if (toPP.hasOwnProperty(str)) {
      return toPP[str]
    }
    return convert(str, m$1.toPastParticiple)
  };
  const fromPresentParticiple = function (str) {
    return convert(str, m$1.fromPresentParticiple)
  };
  const toPresentParticiple = function (str) {
    return convert(str, m$1.toPresentParticiple)
  };

  let { presentTense, pastTense, futureTense, conditional, imperfect, subjunctive } = model$1;

  // =-=-
  const revAll = function (m) {
    return Object.keys(m).reduce((h, k) => {
      h[k] = reverse(m[k]);
      return h
    }, {})
  };

  let presentRev = revAll(presentTense);
  let pastRev = revAll(pastTense);
  let futureRev = revAll(futureTense);
  let conditionalRev = revAll(conditional);
  let imperfectRev = revAll(imperfect);
  let subjunctiveRev = revAll(subjunctive);

  const stripSuffix = function (str) {
    // reflexive forms
    // 'congratularmi' to 'congratular'
    str = str.replace(/ar[mtscv]i$/, 'are');
    str = str.replace(/er[mtscv]i$/, 'ere');
    str = str.replace(/ir[mtscv]i$/, 'ire');
    // pronoun suffixes
    //sentire + "lo" -> "sentirlo"
    str = str.replace(/arl[oaie]$/, 'are');
    str = str.replace(/erl[oaie]$/, 'ere');
    str = str.replace(/irl[oaie]$/, 'ire');

    // -ergli, -argli, -irgli
    str = str.replace(/er(lo|la|le|gli|eci)$/, 'ere');
    str = str.replace(/ar(lo|la|le|gli|eci)$/, 'are');
    str = str.replace(/ir(lo|la|le|gli|eci)$/, 'ire');
    // combined clitics - 'studiarselo', 'andarsene'
    str = str.replace(/([aei])r[mtscv]e(l[oaie]|ne)$/, '$1re');
    // whole infinitive + pronoun - 'scriverele', 'diregli'
    str = str.replace(/(are|ere|ire)(l[oaie]|ne|gli|ci|mi|ti|si|vi)$/, '$1');
    return str
  };

  const fromPresent = (str, form) => {
    let forms = {
      FirstPerson: (s) => convert(s, presentRev.first),
      SecondPerson: (s) => convert(s, presentRev.second),
      ThirdPerson: (s) => convert(s, presentRev.third),
      FirstPersonPlural: (s) => convert(s, presentRev.firstPlural),
      SecondPersonPlural: (s) => convert(s, presentRev.secondPlural),
      ThirdPersonPlural: (s) => convert(s, presentRev.thirdPlural)
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return stripSuffix(str)
  };

  const fromPast = (str, form) => {
    let forms = {
      FirstPerson: (s) => convert(s, pastRev.first),
      SecondPerson: (s) => convert(s, pastRev.second),
      ThirdPerson: (s) => convert(s, pastRev.third),
      FirstPersonPlural: (s) => convert(s, pastRev.firstPlural),
      SecondPersonPlural: (s) => convert(s, pastRev.secondPlural),
      ThirdPersonPlural: (s) => convert(s, pastRev.thirdPlural)
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return stripSuffix(str)
  };

  const fromFuture = (str, form) => {
    let forms = {
      FirstPerson: (s) => convert(s, futureRev.first),
      SecondPerson: (s) => convert(s, futureRev.second),
      ThirdPerson: (s) => convert(s, futureRev.third),
      FirstPersonPlural: (s) => convert(s, futureRev.firstPlural),
      SecondPersonPlural: (s) => convert(s, futureRev.secondPlural),
      ThirdPersonPlural: (s) => convert(s, futureRev.thirdPlural)
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return stripSuffix(str)
  };

  const fromConditional = (str, form) => {
    let forms = {
      FirstPerson: (s) => convert(s, conditionalRev.first),
      SecondPerson: (s) => convert(s, conditionalRev.second),
      ThirdPerson: (s) => convert(s, conditionalRev.third),
      FirstPersonPlural: (s) => convert(s, conditionalRev.firstPlural),
      SecondPersonPlural: (s) => convert(s, conditionalRev.secondPlural),
      ThirdPersonPlural: (s) => convert(s, conditionalRev.thirdPlural)
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return stripSuffix(str)
  };
  const fromImperfect = (str, form) => {
    let forms = {
      FirstPerson: (s) => convert(s, imperfectRev.first),
      SecondPerson: (s) => convert(s, imperfectRev.second),
      ThirdPerson: (s) => convert(s, imperfectRev.third),
      FirstPersonPlural: (s) => convert(s, imperfectRev.firstPlural),
      SecondPersonPlural: (s) => convert(s, imperfectRev.secondPlural),
      ThirdPersonPlural: (s) => convert(s, imperfectRev.thirdPlural)
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return stripSuffix(str)
  };

  const fromSubjunctive = (str, form) => {
    let forms = {
      FirstPerson: (s) => convert(s, subjunctiveRev.first),
      SecondPerson: (s) => convert(s, subjunctiveRev.second),
      ThirdPerson: (s) => convert(s, subjunctiveRev.third),
      FirstPersonPlural: (s) => convert(s, subjunctiveRev.firstPlural),
      SecondPersonPlural: (s) => convert(s, subjunctiveRev.secondPlural),
      ThirdPersonPlural: (s) => convert(s, subjunctiveRev.thirdPlural)
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return stripSuffix(str)
  };

  const all$2 = function (str) {
    let arr = [str].concat(
      Object.values(toPresent(str)),
      Object.values(toPast(str)),
      Object.values(toFuture(str)),
      Object.values(toConditional(str)),
      Object.values(toImperfect(str)),
      Object.values(toSubjunctive(str)),
      Object.values(toImperfectSubjunctive(str)),
      Object.values(toReflexive(str))
    );
    // past-participle, in all four gender/number agreements
    let pp = toPastParticiple(str);
    if (pp) {
      arr.push(pp);
      arr.push(pp.replace(/o$/, 'a'));
      arr.push(pp.replace(/o$/, 'i'));
      arr.push(pp.replace(/o$/, 'e'));
    }
    arr.push(toGerund(str));
    arr.push(toPresentParticiple(str));
    // attached object-pronouns - 'fissarla', 'scriverlo'
    let stem = str.replace(/e$/, '');
    arr = arr.concat([stem + 'lo', stem + 'la', stem + 'li', stem + 'le', stem + 'ne']);
    arr = arr.filter((s) => s);
    arr = new Set(arr);
    return Array.from(arr)
  };

  var verbs$2 = {
    all: all$2,
    toPresent,
    toPast,
    toFuture,
    toConditional,
    toImperfect,
    toSubjunctive,
    toImperfectSubjunctive,
    toReflexive,
    fromGerund,
    toGerund,
    fromPastParticiple,
    toPastParticiple,
    fromPresentParticiple,
    toPresentParticiple,
    fromPresent,
    fromPast,
    fromFuture,
    fromConditional,
    fromImperfect,
    fromSubjunctive,
  };

  // console.log(toPresent('fermarsi'))

  let { plural } = model$1.nouns;

  const revPlural$1 = reverse(plural);

  const toPlural$1 = (str) => convert(str, plural);

  const fromPlural$1 = (str) => convert(str, revPlural$1);

  const all$1 = (str) => {
    let plur = toPlural$1(str);
    if (plur === str) {
      return [str]
    }
    return [str, plur]
  };

  var noun = {
    toPlural: toPlural$1,
    fromPlural: fromPlural$1,
    all: all$1
  };

  // console.log(toPlural('abboccamento'))
  // console.log(fromPlural('abboccamenti'))
  // console.log(fromPlural('scarpe'))
  // console.log(toPlural('scarpa'))
  // console.log(fromPlural('nuvole'))

  let { fs, mp, fp } = model$1.adjectives;

  const revFemale = reverse(fs);
  const revPlural = reverse(mp);
  const revFemalePlural = reverse(fp);

  const toFemale = (str) => convert(str, fs);
  const toPlural = (str) => convert(str, mp);
  // female-singular -> female-plural model ('bella' -> 'belle')
  const toFemalePlural = (str) => convert(toFemale(str), fp);

  const fromFemale = (str) => convert(str, revFemale);
  const fromPlural = (str) => convert(str, revPlural);
  // 'meravigliose' -> 'meraviglioso'
  const fromFemalePlural = (str) => fromFemale(convert(str, revFemalePlural));

  const all = function (str) {
    let arr = [
      str,
      toFemale(str),
      toPlural(str),
      toFemalePlural(str),
    ].filter(s => s);
    return arr
  };

  var adjective = {
    all,
    toFemale, toPlural, toFemalePlural,
    fromFemale, fromPlural, fromFemalePlural,
  };

  // "ridicola",
  // "ridicoli",
  // "ridicole"
  // console.log(toFemale(toPlural("ridicolo")))
  // console.log(toPlural("ridicolo"))

  var methods = {
    verb: verbs$2,
    noun,
    adjective,
  };

  // generated in ./lib/lexicon
  var lexData = {
    "Determiner": "true¦alGciascEdeCgDiBlAmolt9nessEogni,p6qu3t1un0;!a,o;a0ropp5utt7;l4nt6;alche,e0;g8i,l0stC;!lB;arecchi1och0;e,i;!e;a,e,i;!a,e,o;!l;g0i,lle;li;un0;!a;cun1tr0;a,e,i,o;!a,e,i",
    "Pronoun": "true¦cGeEio,lDmAn8ognu7qual5s3t1v0;i,o8;e,i,u0;!a,e,o9;i,u0é;a,e,o7;c0e;osa,u0;no;e,o0;i,str5;e,i0;!a,e0o;!i;ei,i,oro,ui;gli,lla,ss0;a,e,i,o;hi1i0osì,ui;!ò;!unque",
    "Possessive": "true¦loro,mi3n1su0tu0v1;a,e,o3;ostr0;a,e,i,o;a,e0o;!i",
    "Condition": "true¦nel caso che",
    "Conjunction": "true¦aKbenJcHdFeCgrazie a,inBmAn8o6p3qu2s0tuttav7vi4;e0iccome;!bbene;ando,inM;er1iutto0rima CuA;stoD;cIò;!p6ss0;ia;e0é;ancDmmeno,p3;a,ent3;fatti,olt2;!d,p0;pu0;re;opo 0unque;c6di;he,ioè,osí0; c4;c4sì; causa 4ffinc3llora,n0ppena;c1zi0;!c1;he;hé;di",
    "Negative": "true¦mai,n0;essuno,iente,on,ulla",
    "PresentTense": "true¦aNdHhEpAs4v0è;o1uo0;i,le;gli0leL;aMoI;a3ei,i2oHt0;a0iaKo;!i,n9te;aIeG;!i,n7p0;eEpF;o1u0;oi,ò;ss0teB;a8ia5o8;a0o;!i,n0;no;e2o0;bbia0ve5;mo,te;bba1v0;e,i,o0;!no;bb1ve0;te;ia0;!mo,no,te",
    "Date": "true¦domani,ieri,oggi",
    "Noun": "true¦0:7D;1:7B;2:5X;3:6P;4:74;5:6I;6:6H;7:6Z;8:6B;9:6N;a6Xb6Ic5Ad4Ze4Wf4Eg3Xi3Ol3Dm2Pn2Io28p12qua11r0QsXtKuGvAzucche8;aDeCiAol1M;a32deocas4Ino,s5tA;a,tor74;n1rdu6;canz2lAs6P;i0u5;cc67ffic3niCoA;mAv60;i5Co;co,versità;aKeDitol7rAutt'u9;aAe9ime1T;f1Uma,ttA;a1o;cn5SleFmpDn3KoCr6sA;su1tA;aZi,o;do6Xri0;es5oA;!ra3R;fo9vis56;c0sAvol5M;ca,s5Lto;a00cUeQfPiLoldi,pJquad6tBussid3vA;iluppo,ol5;aGell2oriFrEudA;entCiA;!oA;!so;e48i;ad2uttu6;a,co;n0Pz4U;az3ec1Fia0LoA;rt,sa;gnBnAst09;da0is3O;ifi23orA;a,e,i4H;i2Vor1X;c18dCgui1me10rAttiman2;aAie,ra,vo;!ta;e,ia;aDhBoAu2G;n1po;erAia2J;mo,zo;la,rAtola;i0pa;bb5Sl5AnA;g0Eta;aIeFiA;cDfugia1mbor0EsCtBvA;is5ol5;ar64or9rat1;ch3p3Ltor43ulta1;er58o;!cla3Rddi1gBtA;e,ta;al7no;d3gazz55ppA;or1resent3X;d8rtier genera2J;a04eViPl32neuma5SoJrCuA;bb2Jls3UntA;e19i,o;an15eFoA;blCcesZfBgAsp39va;et1ram1P;ess32i4G;emA;a,i;m3si33z0Z;lCmBrtAst45;a,i0;eri0Zodo8;iAlo;tAzi4I;ec53i4M;aCeBoAzD;gg4X;d42t4;nBst4t1zA;za;o,t2;rAs2O;cFdEiDsA;i0onA;aAe;!le;co3Vod4H;ue;en1orA;so;cIesi,io,lGnFrCsAu6;sAt3J;a1egge8o;co,ol2tA;e,iA;!cola4t3F;i0orami40;cosce4GeA;st4;e,iA;fi0;biet0UcchiIggi,liHnFper2rBspA;eda1Bi2P;eBga4AoA;!log3;!cA;ch3;e4oA;m1Pre;mpi0o;!o;aDeCoBuA;me8t4;mi,t1Y;goz3mi0;sBtAziona0Y;a0Xu6;ci5o,t8;aQeKiHoCuA;ro,sA;e7i3C;bi0SdDment7nCr26sBtAvimen1;o4to;ai0tr2;do,tagn2;ell7i,o;nBsA;ce2Yu6;iMut7;cca3Kdi0l2rEsBzA;zo;i,sA;aAi0;gg3;ca1;cchin2eFgo,mQnDppa,rCtA;eAtin2A;ma3Mria0C;ca,i1si0;iAo;!co,e6;st8;aHeEiCodBuA;dAna;ovi0;br7nAv27;ea guiRg2H;gBsUttAzi23;e6o;a,ge,no;criBgVst4tAvor7;o,te;ma;de2mpHnBsAtal2S;ol2;cBglese,iz3sA;ala5egn16;aCenA;tiA;vo;nt0Rri0;or1ron5;aOeLiDover9rCuA;er6iAs1;da;a2Xi22;aGoCuA;bb1WrasA;si0;cCrnAst4;aAi,o;l1Gta;hi,o;c1Vr0Y;la1nerArma2B;aAe;le;eAlat2Imb2sd1Mtt7;li0;aOeNiIlot5oDrBuA;ngo,o0tu8;ecc20uttA;a,i di ma4;gl1Yn0GrmCsBtoA;!graf1X;set0E;aAu1B;!gg3;gliDlCneAori,si0;!sA;tr2;e,m;!a,o;de1Wst2;bbri1Amigli2ntBtA;a,tu6;as1Z;nBre1YsA;emp3ta01;ri0tra00;aJeHiEoAura5;lCme1Knn2ttA;oreA;!s0C;ce;fBo,penAva9;denT;et1;moAna8tenu1;cra1Mti0;ti;a01eYhiXiTlassSoErAuciJ;iAusc0N;stianAti0;esiA;mo;gnome,lKmGnBper15rAs2;da,oDpo,so;dizioDsBtA;o,rol06;egAigl3;na;ni;i0merciBpAuF;i1lean9os1uter;anA;te;azAorWpa;ioA;ne;e,i0;ascu9bo,eUttBviA;co,le;aAà;di9;avi,co,es2;nBrA;ch3ot1;a,e4t8;ffè,lc3mNnIpGrEs2uCvA;alAo;ie4lo;sa;a,e;icA;a,o;elli,itAo;a9oE;cCdida1i,zA;onA;e,i;elA;lo;e6pA;iWo;aJiFoDrCuA;co,r8;ro;acc3itanZ;cHlA;la;ciclet5gliett7r6scA;ot1;ra;ta;g9mbinCnBrBttaA;glN;ca;a,e,i,o;no;cZdriaXerVlSmOnHpFrEtCutoBvversar3;io;!bus;lanUtA;i0o;amai0cheologi0ia;e,passiA;ona1;at4droFimaDn7sBtiA;bioOco;ia;i,o;!lA;e domesKi;ni0;alCbi1icBo4;re;a,he,i,o;ri0;aBberAlea1;go,i,o;!ri0;eo,opor1;to;ti0;co;corAqua;do",
    "Verb": "true¦avvenuTdebboSf8ottenne,utilizzaTv0;a,e0ienK;n1rr0;aCe3à,ò;g3i1n5ut0;a,e,i,o;a0mJsEte,vD;mo,te;aKoK;a1ec0;eEi;!c6i,n5r1t0;e,to;a2e0à,ò;bbeAi,m0st7te;mo,o;i,n0;no;ci8e0;m6s1v0;a7i,o;s1t0;e,i;e1i0;!mo;!ro;mo;a0o;!mo,no,te;!no;ta",
    "PastTense": "true¦aveHdoveFeBf8pot6s1vol0;eGlF;apeFeppEt0;a1e0;mLsGttC;t0vD;a,i,o;e0é;i,mHr2sCvA;osBu0;!i,mFr0;ono;bb4r0;a0i,o;!no,va0;mo,te;m9s4tt0v2;e7i;m7s2v0;a0i,o;!mo,no,te;s1t0;e,i;e1i0;!mo;!ro;mo",
    "Adjective": "true¦0:6Q;1:6L;2:6R;3:6P;4:69;5:6E;6:6M;7:6U;8:5Y;9:6S;A:6J;B:6D;C:5S;D:65;E:5G;a5Zb5Oc4Nd44e3Wf3Ig3Bh39i2Tl2Km21n1Po1Np12qu11r0Ms00tRuOvFwa4P;ariaMeIiGoF;ca0l2;ce,enBg1ncFsAv1;en9it4X;ge49ntGrFscovi0t6H;ba0osimi0sa28ti5L;en6PrF;a0i0A;bi0n9;lter6Amanoi63nGsFtili65;c1ua0;ani4Tghe5Kif48;at21eJip8oIrFutt;asGiF;a0Id5Een6onfa0;cu09ver4V;ller2riBta0;cn8descDmi3na4KrGsF;si0tA;ma0rF;e3Ci61;!aZcXeTfavore68inRoOpMtHuGvF;aria9e50;d15pplem62rrea0;aHel60or8rF;aFutL;da0gran5M;gEn9tF;a0unit4N;az4ecQiF;na0ra0;ddisfac1lGno5prannaFtto3L;tuC;a5i52u3;da4SgF;le,o5P;co5Odic0Hgu1micirHnGqu3IrFssAttentrE;a0ia0;e7tO;co5L;ientFo62rit9;if8;li1pi1;aSeOiFot2;bel0cJnHsFtA;contForgHult2;ra3;ascFtracc3N;im0T;cDoF;nFrr1;duFosF;ci3;gHna0pRsGttaFv1E;ngo56;id1t2;a0g1n2;d4ggiungi3;alunque,est’;aVeTiSluCoMrHuF;bbl8gl4FnF;g1k;eHiGoF;dutt39ge3FmozEporzEspici1te2Pvinc4;me,ncipe;co38do2Oe17fFge50senti,ve49;eri3;lIp,rtHsF;s1tF;a0er4M;an9o3Rua0;a5iFmo3D;go6t8;aneg1Femonte7rami3Y;cuUgg0Fna0rF;en4S;lesHpa0rGsFtrimon4;s2toC;anor3Rl2rocch4;e,tiB;cMl1JmosessAnli4Npen,rFsserva3tteni3va0;bi24chestCdi6izzon24mo6;aOeNoGuF;cl0Dz4;biKmJrF;dFvege7;-oForiR;cFriQ;cidP;a3Vi6;lia5;pale7wyorke7;sFva0;a0c1;aTeOiKoHuF;ltimed4nici1CsF;co40ea0;deBl0nFr1t2B;d4t2umF;en1M;cid4gli0HlGnF;eCor;aBiF;a5t2;ccan8diIrGssiBtalF;!l8;canFidE;ti0;cDeRoeR;gFnager4rgi6s2V;gFicD;iorF;!e;aLeKiIoGunF;a5gD;de3MnFqua1U;diBgitu2C;beCeve,gu5nFve;ea5;ssi2Ft22;rFteC;va0;dentifica3mPnIrGstFtalian;ituzErutto5;l0BrevF;er3K;arresta3cKdiJeIfHgGteFusAvH;gr2r30sti6;anne39ombr2;er6;sist1;ffer1spensa3vidA;apa1Dli37onfon2E;mHpF;ermea3on0JreF;ndi2Uve2B;in1obilF;e,ia5;ardco5orrF;or;alleJeHiaGlac4rF;avit15ecD;lloblu,ppoB;nFolog8;ia0oN;gFse;gi2;aRePiLluv4oIrHuF;nForvi2;eb5zion2;ance7on07;ca0rF;!liFmida3;ve7;nGsF;ca0icD;a0lF;an19;rFu1L;ra1Gv1;c1llim29;conom8diKgAlettJmerg1piscoIqua24sGtc,xtraterreF;st5;istSponZteF;nu2r1Z;pa0;oCr8;le,tF;or4ri0D;aWePiHoGuF;a0ca0pli0B;c1r0Jttri6;aletLfIrigHsF;cFtin9;e1Dipli0I;en9i3;enso5ferF;enF;te,z4;ta0;cKfJmIterHvF;aFozE;st2;min2;enz4;orZ;en6i0R;ne7rk,ta3;a0Bele0Ahim8i06lass8oJrHuF;rFsto13;ve;an4eF;d1sc1;lWmUnGrFstitu1;a0r1;cQfOgen4iuga0nNsHtF;a3inuando,raF;en9ttA;eHiFul1;glFst1;ia3;gu1rvatF;riF;ce;azE;in2orF;me;eForr1;ttA;and2busti3pleFu6;m0Vtam1;lGosF;sa0;aGeg4iF;na5;teC;neHrcoGstercF;en7;l2st2;matograf8se;b5s9;nGrFuU;di6;aFt2;de7;aLel,iIoFritann8uon;cGlogBrF;ghe7;ca0;dFen6;imensE;io6;biloBsa0tteGvaF;re7;siF;ma0;bru0Mcc0Gd0DeroportAff0Ag08l03ma01nVppTrOsKtGutostraFzienF;da0;enHtF;acc2enF;di3;ie7;ceHsiGtC;ra0;mila3st1;nd1;agoBcGrog2tiF;gia6st8;aGhitetton8;icD;de;arten1reF;zza3;a0gJtF;erHiF;cDst2;he;io5;losassoPoI;tor4;ia0; coperto,a5baBimGveoF;la5;enta5;ne7;re;eFi0;vo0;iFlu1;ne;ua0;domi6er1;en9;na0;attiv2esF;si3;bi0;le;an9;te;zze7;se",
    "Imperative": "true¦vai",
    "Infinitive": "true¦0:0LL;1:0LK;2:0L3;3:0LH;4:0L7;5:0LJ;6:0LF;7:0KF;8:0KV;9:0JP;A:0J0;B:0JI;C:0KL;D:0KI;E:0FX;F:0JN;G:0KA;H:0KS;I:0IS;J:0LA;K:0ID;L:0GY;M:0LD;N:0JX;O:0LG;a0CHb0AYc04Zd00QeYSfX4gVQiQ8lP9mNTnNEoMHpIGquIDrC0s3Gt1Eu0WvVzP;aSe3iRoQuP;ccOSfo3ma0;c0K6mGpp0FK;mb0KDttH;mpPpGvor4;et2il3;a0Ie04iWoPuo2;cTga0lPmi0FCr02RtH;aQe0gPt0A6ve0;arAe0;nJCre,tiP;lAz8;a0iP;a0fe4;aEb4ci5diFe2gVlUncTol0JNra0sRtQvPz1;e0i0B0;a0tor1u03L;a0iPta0u063;o5ta0;e0i0o3;ip0JIleE;e0i3l1;cKd01gZi0JMlYnUrRsQtriPzzeE;fi6oXW;ci6sa0ti0;b05Vdi0gQi0AQnPsa0te0;a0ic1;a0e0og5;a0dQe4g1i0tP;a0i3o3;ePi6;mm1re;a0eEle0ocA;e2gPl1;h1ia0;e0o0JT;cUgSlRnQpNMrP;a0ca0ia0;a0eEga0i08Fta09E;ca0e0iAGla0or0FOu2;aPheEi0l1;b0CZre;a0ci5il3;b02cc01di0f00gZlYmXnUrTsPt05G;a0ciUNo3tRuP;caG7fr0C6rP;a0pa0;io5o3;ge0i5la0ta0;ge0iPta0;fPre;i6orF;anAet2il1;tiFu3;gi09UuaO;fic06Piz1;ellNRi7;bQiPrR;ca0di0;i0F6rP;ia6;a1Je16i12o0VrSuP;ba0f09Co5rQtP;a0e3;a0bNJna0;a00eZiWoRuP;cPfM;c0I4iB;gl1mbRnQttPva0;a0er0IJo3;a0ca0eE;a0ePiz8;gg1t2;bQl3ncPonMpYQs2t0AWunMv0IF;a0e4;o3u2;bb1m098piB;b0Ec0Dd0Cf0Bg0Ai02Yla0JMm08n06p04r03sWttUum0CQvP;aReQi3OolP;ge0ta0ve0;rCsN;gl1lPsa0;ca0i6;a0eP;gg1ne0;a0JIborBcTe0HVfRgre0EGlQm05DpPtul3uB;aLi4or0D5;a0o6;eLiRRoP;n7rF;en7i5oPri0BTu4;la0rOY;re,uG;aPe3iZL;na0sC;c1gug1quill0E4sP;a0corOTforFi0FJpor2;aYFetJoPu2;n2rN;ge0h0CB;eLfi6ig9uD;e0i0ur0;an5c1iF;al3oc6;c6el0C6g0HBlUnTrQsPt03O;a0si089ta0;ce0m0C0nPreMtu4;a0ePiTL;a0gg1;a0da0i08E;et2l0AZ;fa0g0F5mb4nQra0tP;o3u0G9;ge0tP;eEin5;d1leZmWnUrRsPt2;a0se0tP;a0imon1;gQmi5rPza0;i0orA;e0iv0A5;d0BAe0tP;aTGen5;atAe0pP;ePo0D3ra0;ra0s2;fo5gPm0BDtrasm048;raMuiB;cTfa5gliSmRn9ppQrPs0IEt0FMvo3;a0da0la0taO;a0ez8;bur0GTpo5;a0uz8;cPe0i2;a0ia0o5;a7Vb7Bc5Pd5Me56f4Rg4Hi49l47m3Yn3Vo2Hp1Hqu1Dr1Ct0Ju01vP;aYeSiRoPuo2;gl1lP;a086e0ge0ta0ve0;a0g5l08Xn0GDta0;cKgli0ARlTnRrPsNt2z8;gPna0;i5og5;a0de0i0tP;a0o3ra0;a0le0ti0;ga0lPni0r1;ig1u2;b04cc03d02f00gYiciBme0nTAoXpUrTsP;ci2sPtit09Aur4;eg099iQuP;l2me0r4;d1sJ;cl06PgeEGroD;erQpP;li07Uor0B8;a0bi0va2L;la0na0;a0geP;l3rC7;fPo3;o6raD;a0divi7;e7h1ia0;affit2ent4iPliFor01A;re,sC;a0Ce09i07o05rSuP;c6d1fa0pPra0z07B;eMiPra0;di0re;aVeTiSoQuP;c6g9sc1t0F2;fi5mb5PnPpi0GUz8;ca0za0;a0de0g0FJl3ng09Tsc1to3z8;ga0ma0pPsC;e0i0AN;b0BYcc0F2da0fa0go7lTm5KnSpRrQsci6t0GMvPz1;ac6e7in0EXol9;iGre;az8pa0;a0go3iRJ;c1la0;c6ia0na0pGrP;ce0di0ia0mi0na0p1;gm09Ql0B8m067n9pPra061va0z07L;a0end1u3;ccQ9mYUnQrPsse0;eotiGilAmi5za0;d09Eta0;bili06Qcc0EPgSl3mGnRpGrPsa0t085zI;a0e,nP;a06OutH;a0ca0dardAga0z1;io5l1na0;a03GoCI;aQiP;l3tN;d4gl1li05XrPsC;c1ta0;a0He07i00l0EIoVrRuP;lc1ma0n2tP;a05Kta5;anDeRiQoPuz8;f08Gloqu1na0vve7;gIz8;ca0g1me0z8;d050gl1lSnsIVpo3rRsP;a0sPta0;a0eDU;ca0ge0re,t50;pa0ver0AW;aTcRega064fDGgQl3nPo08FrZH;a0g08Qto5;a0ne0o3;a0cP;a0i045;cPgg1na0re,z8;ci6e0;cWd061g0C5lUnTrSsRttQzP;ia0z067;a0e08Ai5;a0sa0;a04Ode0eq0CZge0im08Ro5pe4;de0ge0n4Msa0;aPla0;cKga0re;ch1iPu3;alAfi6;cc0DMgl1lTn7rSsRuLv08LzP;iPz04Y;a0enN;iFsa0;a0e04Pge0i0la0paOti0;aPleEma0;n6re;bb10c0Xd0Wf0Sg0Pl0Mm0Jn0Ip08r04s00ttVvP;eTrRveP;nPrN;i0zI;aPiQY;ccaS1pp09CsT;ni0rK;a0D4eSiQVoQraP;g9r0;lin0AOm00Xp098sPva04;c029ta0;n7r4;pRtP;aPen5Vit06I;n0BDre;eWEi001;bi0ge0m003pRrQs03EtRCvP;eOo3;eg9i7;asCr0CZ;i0pVrP;aPiQH;fMggiV3nnoMZre,sSvP;an8vP;aPe0C8i073;lu2;se7ta0;eQiUVor088rP;esCi00F;ri0sa0;a0da0nB6;atAiOmP;a0ePini09L;r9tJ;a0E4ca0da0e02YlPve0;ePiR4;ci2ti6va0;gPna0;et2hVKiP;a0C8o0AMun9;fPis0BN;erZKiQo6riP;g9re;a0t2;disMisMomA;cPiYR;hUPoP;mbe0rJM;aPol0DZ;l8r6;eQifMoP;b0BEccX8da0;l0DVr0CS;aVeTiRoQuP;o069sC;n2r8;cc1nuPs2;i0z8;nNrPtJz8;c1da0;gMIltHnPrW9scGL;ia0t0C7;aPeDit2og095;cc1nc1;bi3cu4de0gVlUmSnPsteFt0CV;cQda6ghioz8tP;etAonA;e4ronA;bolPp06Fu3;eEiz8;e008la0AV;il3la0ni02W;aWe3hign1XoUrRuP;aPsc1;lOKrBz8;aPe9AiB;nPva0;a0c04YocK;b0ANccWHla0mPnf1rDz8;b0A8en2i5ma0;mPnc1r4ttaWF;a0b069;a00erZiXoTrQuP;gRLma0;aQePi05Jut2;cc1g0B2;c0BIt2;c0B0de4gRlQnBrPtJ;a0ma0na0za0;la0ti0;a0g1l1;an6dPgu4la0ni0orH;a0uc1;ra0za0;ccQma0re,sc1ta0vP;il3oL;hi5ia0;c03d01g00lZmXnWpUque07SrTsRtQvPzI;e4iz1;a0CBta0;sa0tP;a0upRE;ba0e5ia0peEra0vH;a4e0CGpP;el0CFia0;sibX6tTV;bPen2i5pQ7;ia0ra0;c1ezIla0;a0na94reG4ui05Y;a0ePim05Cu09M;nt00Sre;a0ca0er08KonBre2;a0eg5oga5rP;a1ucP;cVGi0;a0We0Sh0Mi0Fle4oXrTuP;ci0lRoQrPsa0;a0eEi0;ce0ia0te0;a0BQet2;eRiQoPutFE;c6l3sc1;cchV8t09Uve0;di2po3;cc09Yd05glIl03m01nWorVTpUrQsPt2Rva0;c0A0sa0ta0;aRc1da0eEge0rQtP;a0e0BIi6;az8e00B;ggiMEre,z8;a0ePi0Api024ri0;rKt2;cer2fRgQnXHos09Mqu00PsiOtPv001;a0en2ra0;e3iu4;esCiP;g9na0;busso3mXCoBpPuX7;ar0AZiOor0;a0lPorHpHta0;a0eD;a0el3inM0;aTmmi00XnSoQpPre,uGvo3;a0i069pa0;c6g09Mpe4rP;i5re;de0tM0;cq08IlaPma0re;cq08Hre;eSiP;aPe4fa0oc6uXSva0z8;cc1ffZMmPn2rHt2v05Z;az8;da0gg1rP;mHni0za0;g09BlRmQ5nQrP;ne0re,v09J;de0eE;e4le4;cc69deZVg01l00mZnVpTrRssEBtQvaPz8;l6re;e5o3ta0uL;aPce4di5i6pa0seEta0;bHGv03U;a0pP;a0el3;dQnPsAP;a0erA;aPe0i0;gl1lA;b1pa0;a0c1da0fi0pi2za0;az8io5l1;a01e00iYloc6oVrQuP;c09Ed091fMr4;aSiQoP;do3gl1n8;cTPgPna0;a0l1;cc1i2na0;cc08ElQrPs6tt00H;n1ra0sa0;l07Nog5;aPgGXla06Orc1zJR;di0n6;ffeElP1;ci9KdiOgl1iafMlTnSrQtPva0;acKte0;aPba0ca0ra0;gl1z8;ca0da0;lPor04Xza0;a0ot2;b00cZet2gYlTnSpQtPz1;isMu4;e0oP;niZErH;a0ci0gFVtiZDzI;a0da0iSpa0tQu2vaP;guarBre;a0eP;l3r08A;re,va0;g1oF;c2UriZ6;b1o2;a4We40i00oSuP;bQgO4l3mPo2sCt2zK6;i5o046;a0ri6;d028ga0l3mVnUsStRvP;e09BiP;na0s2;a0ea0o3taF;icPo3;a0ch1;cZBfa0za0;ba0pe0;a35b33c2Md2He2Cf26g22l1Ym1Hn11or10p0PquaN2s07tZuXvPz8;alVeRiQolP;a0e0ge0ta0uzIve0;n075si2tTUve0;de0la0nQrPsN;be4i0sa0;dPi0;e0i6;eXLu2;ni0sPtTR;a0ci0;aVeTi4ma0oRrP;aPo07T;e0g9r0smUQt2;c6na0rP;ce0na0re;leVWnP;e0ta0;gl1rB;a05c02e00iZoXpTsa0tQuPveO;cKl2o5sLG;aQo4rP;in9ut06K;bi08Lg5re;arm1eRiQl06RoP;l0Vn7sa0;arFeDn9;cKdi0n7t2;lPna0r9;le07Cve0;ca0e7;de0nNrP;ba0vH;aQen7hiar05Iiacq05MoPri00RuoJ;nt4pLte0;lBt2;l063na0pe0rJJ;aXeViUoSrQuP;d1g5li0;e3Yis5WoP;dD5mTZp02Ava0;ne0po3r01RsPta0;a0izIse7;an9eDgl1o00Hre;nCrcPs6te0;orDLuoJ;ga0rPsCti0;a0la0ti0;di5gJ3;as05Vc01e00fYgXnWoVsaUtSun026vP;eQiP;a0goL;ni0r02Q;a5oPra07I;c6m058;lBvi0;mi5va0;eDo06K;agliar02Kh1iova057raz1;a07Cor8rP;an6es6;goz1vi6;aQhO6oPres05Iuo4;glio052mi03Ynt4rD3;ra0sa0;a02bZeXi4oVpQuP;gi5ne4oZU;atr1iQroP;ve4;aQccio07BnP;g04Lza0;g03Mn9z8;n2rPve0;ch1de0;d1mb4na0sPtJ;co3ta0;aQec6oP;c6m04LrC;l8mDO;nQrPs04H;ca0e,gi5;da0e0g1;aQePu04Y;gR0va0;nc1sP;c1sa0;a0eRi4ov01TuP;aPrKR;d051rB;ne4t2;a0eLiTlPAoRran9uP;gPl9sa0;gi0ia0;cHFndZFrP;ma0ni0;la0ni0oLu2;cSde0lRmQnt4piloDsPvo6;aETci0se0uF;er9pi03S;abo4eg9;heE;aVQda0eSiQoPu03S;na0t2ve0;cSXme4MpR9re,sPven048;c04JtribXW;fi03Wre,s2terEL;a03e02h00ic3oRreQuP;ci0o049pe4sa0;a0de0s048;g04JlleDmVnSpRrQstPve4;itXQrXQ;da0i6re0;ia0ri0;c013dB4fQgiMHnRYos043q0EsPtaWF;eg5i4Z;erFor2;anBi02HpP;aLenCor0ra0;eBKiP;aFe7u7;de0r6ve0;cc1de0l6mPpi1Xri6s6t2va0;a0b1;aPel3ol05Tut2;di0l2sCtteVX;b04c01ddormYUff00gga028lZnYpVr7sTttSvP;e0vP;iPol9;a0ci5;ac6i04K;cN2sP;i1AorC7uRH;pPri0;aPen7;ciV2ri0;da0iF;la057za0;erFio4;cQqP;uis2;a7en7omp03L;bQiP;li2t02L;asCra050;a0Jc0Dd0Af08g06i04l03m02n00pXqL3sStQvP;e3isIo6;a0oI1rPtSX;ar0ibWPoce7;cin7et2isJolXKpStQuP;l2sHV;aPitWMrPY;re,u4;iQ5onsabPS;ePli6riQVu2;lW5rPte0;e,i0;a0dPo03T;e0icQ3;a0uNC;azIeD;nPte4;seLteg4vXU;a3ge0iZWna0olaPreZO;mXSrA;eLlQJuP;l9ta0;arQdi0iPu01Z;ge0mXPre;e,gW4re;aTeSiRlPuMP;amZEi5uP;de0ta0;de0n00Sta0;de0nKBpXJre;lcXMpi2re;gi0lA;bb0Sc0Md0Kff0Hg0Blle0Am08n06p03reMsYtUvRzP;ionP0zP;ia0o3;a5vP;e7iP;a0ci5sa0va0;ea0iTQtP;opGrP;apPistH;pi0;a0ch1en2pa0sPtr02N;eRiQoP;da0miO;cu4;g5re5t2;a0e0iN5pP;or2reP;n7sWY;nPto3;icKu00B;a0mPpi6;aGMenQ5ol03R;g4n2;gPio5l1;iRomiQrPuaO;inUIupG;to3;a0ra0uP;gZXnZW;iQor8rP;edBon2;gu4na0;dPe0iRQu5;o02JrA;cPimo3;aRhK1oP;g01OmNXn2pp1rP;c1da0re;pPt2;ez8ri030;erc1o00TriviY6u1;aQePie2o2;re3stI;d4gl1liSPnCY;a37e2Mi25la24o1Ur00uP;bYgnWlVnRrQtPz8;a0reM;a0ga0iSL;ge0i0tQzP;ecK;a0ePuNN;gg1l3;i0lu3sa0;aPe0;la0re;blicXPli6;a1Ge0Oi0LoQuP;de0ri0;c0Fd0Ef0Bg09i08l06m03n02pXro88sTtRvP;a0ePo6ve7;de0ni0;ePocDGrKC;g9n7s2;ciRegU5peQsiFtP;itU4ra0;ra0t2;og00UuD;aDeSiRorQuP;g5lC;re,zI;na0z1;lTKn7;osZSta0unWN;a5e0OoQuP;lDoUQ;ve0zI;iPunD;fe4;bi0et2;et2rP;amFeX2;a5eQfeLiPon7uF;la0t2;ri0sCtWX;iDur0;a01QeRlaFrPu4;asPea0;ti5;de0sC;meEncip1vP;aPileg1;re,tA;a0Fc0Dd0Bf09g07l06m03n02ocHXp00riscalBsTteJXvPz8;aReP;de0nP;i0ti00M;le0ri6;aG8cUeSiRsa0taQuP;me0ppVS;bi01Lre;d1e7;de0l3nPr00G;tHz1;egZTin7riTX;a4ePor0;nsI;asZEde0o2uO9;eQia0uP;ni0ra0;re,tJ;e007u7;a0iPus2;a0uO8;a0eLiP;gMIsC;a0iPo9F;cTWli9re,spVA;e7iPlu7or6P;de0pi2sa0;ccen5mbo3nnuXI;li5nPti6;de0za0;e2gg1lXmWnVpGrTsQtP;a0e4N;a0izIpV2se7tP;aSCePiUZu3;gg1rD;ge0pore,re,tP;a0en7;de4;ic1pa0;emAi0la0tLvP2;cOYg1na0sFuVM;aXccWeVgUlTnSoQpa0roTUsPttRPzQQ;c1o3;mY3vP;e0igQZ;ge0za0;a0o2;ia0l1no4o3;ga0na0t3Y;a0hiQV;cTgRl3nPre,t2z8;a0eEgPiPXta0;e0iSo3;a0e0g1nP;e0uYN;eQiP;ucK;re,voCV;c6d08gg3Gla0n06pa0rRs2YtP;e0tP;egolONi5;c01d00egri5fZiYluV9mWnPOo4petVqFYsStRvP;a7eP;ni0rN;eWDurXI;eQisJonPua7;alAiPI;guiTLve4;ra0ua0;aW8ePu2;a0tJ;co3oBre;ezIo4;e0o5u4;epSUoPuoJ;r5Bte0;aR5d2Bet4iJnY9sPtSSzo3;a0io5;a3i5;c05dro04ga0l03na0pGrYsUtRuCvQzP;iSNz1;en2o02;iIQroWEtP;a0eEi5uP;gl1i0;c22qWQsQtP;iZ5u4;a0eEiP;o5re,va0;aScPCeNWiOVlRod1tP;ePi0oLuL;ciGgg1ne0;a0ot2ucK;fraCgo5lAre;a0eClNPpIO;neE;a0ch1iTR;b0Icc0Gd0Fff0EggetVJl0Cm0An08p05r00sSttPvv1z1;a0eQimTYuP;n7ra0;mH6ne0;aVcUpi2sRtP;a9XePi5rQI;gg1n2;eQiP;da0ge5;qu1rXRssI;il3u4;n5re;a0bi2cheTXdiHZecKgRiPla0mNAna0;en2gPna0;i5l1;aPoO;nAsF;e4i5pPri0ta0;oPriKH;ne0r0;dPo4;a0eEu3;aEbrN0etJoP;geneAloD;ez8ia0trP;aEepNH;eGIic1ri0us6;i91o4;asIhiMUi7lu7or3XuP;l2pa0;bQeT7iettX5liPnubi3;a0ga0te4;eT5iREliD;aYeUiToRuP;da0me4oPtriOF;ce0ta0;ce0ia0leEm1JrmIStP;a0iNMta0;cKdiNLtL;cessi2gRt2utrIPvP;a0iP;ca0sK;a0li9oz1;r4sRtQuPviD;fraDsTH;a0u8W;a0cPt4;e0on7;a0Ke0Bi02oUuP;da0gRltQnUZoQ6ra0sRHtP;a0i3ua0;a0ipCK;gPo3ug5;h1i0;biliVdSlRnQrPst4tiWIvimQOz8;a0d1Ji0mo4si6tiN4;da0etAitorSFopK3ta0;a0ce0es2la0tipCE;ePiN1;l3rP;a0nA;ta0z8;aWeJgVllDOmUnSra0sPtiD;cQe2Ysa0tPu4;iMVu4;e3h1;aX2ge0iP;mAst4;a0etA;l0Gra0;go3u3;diWgl0Ela0mVnUrSsQtP;abJNodAte0;cPta0u4;e0o3;a7BcaPenBge0i2;n8Ire;a0dQPoFti0zI;orA;a0ca0ta0;c06eS1g04l03mFnXpGrUsQtP;erJ7riV7t0AurH;cRsaQtP;erAi6urUA;c4gg1re;he4;a70cQi0VtP;el3or1;a0h1i7C;ca0dTeL7gSiRoQtePu1R;ca0ne0;mIFv4;ca0e4fLFpo3;anV3iN0;a0u6;a0di0eREig5trat2;a0gPl1nK6;io4;chiTGePi5;l3ra0;a0Ce03iXoUuP;bScRmQnDsPtRY;inDsa0t4;a0i5;ci6e0iBra0;riLQ;cQda0gPnROrBt2;i6o4ra0;aNKuple2;bTceSevi2mRnc1quQsPtiDvUN;a0c1ta0;eMiB;a0i2o5;nz1re;a0e6Zra0;cWde0gTnTRsRvP;a0iP;ga0ta0;iPsa0;na0o5;aN8gQiPna0;fe4ttiF;e0icK;ca0e0;cYg5mXnWpiBrVsUtSuRvP;a0orP;a0icK;da0rR6;e0iPra0ta0;na0ta0;cTLsa0t8C;ga0va0;c1gMZ;a0biFSen2pJX;cTHe4riF;bQBd53gno4llu52m3RnZpYrUsPtalia5;cIJo3pRsa0tP;al3iPrMU;ga0tMT;ePi4;sB3zI;a0onArP;ad1eNiQoP;busNga0mEZra0;de0gQ0ta0;notAotA;a3Cc2Md2Ce2Af1Ug1Fi1El1Dn18o16qu14s0StYumiPZvPzupG;aVeSiRoP;ca0gl1lP;a0ge0ta0ve0;a0d1gi3sKta0zLS;cKi0ntarQrPstiDCtL;a0ti0;e,ia0;de0gMLlPsa0;e0iB;a0He03i01oYrPui0;aTeUHiSoQuP;de0fo3;dPmGJ;ur0;de0ga0sN;lc1pRre,tQvP;e7ve7;teQW;po3rSP;nQrPsAQ;bidHpiPE;aKPti0;epiPCmPn9rizL9to3;a0iPBoL;g4n01rRsP;se0tarP;di0e;aXcUdi0esCfTloqLTnaLQpSrQse6vP;eRTis2;a0oP;ga0mE1;el3or0re2;aTVeL;a3eQorP;re0;de0t2;gi0re;de0eLsiJJta0;c6gl1rs1sI8vo3;aXcWeViUoTpi4tQuP;d1Ql2;aQiPrLF;l3tLE;l3re,u4;r9spetN;d1gRCnR2sJ;d1gEQri0;e5riM5;bb1ngQpoP;na0ri0;ui5;ad4iP;e2na0si0;lt4nBrP;gogTIriOG;aSePoSE;gg1rvQsP;ca0ta0;a0o9A;ff1l8mo4;e1ib4;bi0et2mi6zFO;a02e01hi00iXloQSoUrQuP;a1r77;aQesCoP;pGsC;nPsCviBz1;a0di0;bQia0lPmb4rDz8;fa0la0;bi0;alT1ganNnQuP;n9r1;ocK;otN;g5lo8TntiSXri0sC;bb1gg1n5rbuO;a02e00iWlUoSrQuP;o6r1;aPeddoST;d0Mn9;ca0n7rP;ca0ma0na0tu5;ig9uP;en8i0;aRc1eLg9lQnPsKtN;i2ocK;a0t4za0;ccKCmF;rPs2t2;i0ma0o3Tvo4;ma0nDrPstiNFtPS;ci0i5;br1rP;i0pi6;aDeWiSoRuP;ce0g1l9rPstriD1;a0i0re;sCvi5;a0cN5etMXgRrQspPvidPK;etNor0;e,iz8;e0na0;bPnnAt2;i2oS4;a07e04hi03i02l01oVrRuP;ba0lGCnNOpi0rPte0;io7Xva0;eRiQoP;c1s2;mi5na0;mL0sG;gQ8lSmRnt4rP;aGGnPo5po4re0;ic1;be0iOAoB;lPpa0;a0eL;i5u7;amGde0n9pr1ta0;appKVna0oB;de0nPpGra0sKL;dQ5eLtP;iQIra0;gl1l8mUnTpSrRsPte5vo3z8;i5sa0tP;o5ra0;ce4i6na0ta0;oP1pa0;a3ta0uN;mi5;b64ciMBff1lRrQspLuP;gu4;ca0iM9;a0be4za0;b0Li2m0FpP;a09e06i02l01oWrRuP;g5lCn2tP;a0riM4;aticIXeRiQoP;n2vviC;gIme0;ca0g5n7sPzio6Y;sIta0;ne0rRsPveL;sPta0;esCibi9U;re,tP;a0u5;emJYi6o4F;an2ccOYeQgPla0;l1ri0;ga0tP;o6Nri0;di0g5lHXnQrP;a0maQPn1so5vIB;na0sieL;ccSdroO8lRnQrPs2t2uLzzH;a0en2ti0;a0ta5;a0liLI;a0hJQia0;aSeRiQoP;bB9la0rta3;g4sK;deJWr9tJ;gPtriOR;azzi5i5;aZeYiVoUrQuP;ca0r4;aRoQuP;ni0tN;gl1nc1;cc1t2;c6s6ttiGQ;ancQbi0onL3zP;zarL;a0hi0;lQ2stiaQ2ve0;cuc6lQnKZrPsNtJvaO;az8ca0;la0saF;de0mi5st4;ePolat4ra2;aHDnP;tiFF;a0Ye0Rh0Oi0Al09o04rWuP;aRerQfa0iPs2;da0na0z8;i0reE;daRiQl11rPs2ta0;da0enNi0ni0;o3re;gnG5re;aQe0IiPonBugN7;da0gl1;cTdSff1n9JtPva0z1;iQtP;a0ug1;fi6na0;a0i8Oua0;ch1iB;cciEVdSff4mi2nRrgQvKDzzoP;viO;heEoO;f1go3;e0ro5;isCoriJW;aN8b01ng00oWrTt2uP;bi3ca0di6gLKlebMPnRo6ra0stP;appJCiP;fi6z1;ca0ge0ta0;a0eDToP;nPvaD;zo3;cQiPst4va0;a0re;a0hPo3;erNIicK;il3;ol3;erQiP;aOKg5;mi0;la0meUnSrmRsPt2;sa0tiP;co3re;i5oO;ePuflAI;raG3;l3re;bM2lQrPsa0tO8u7;anNba0eEri0;lD1opGvP;anA;a0Ve0Si0Jl0Ho08rVuP;ci3gTlSma0nRorPra0stiD;iusPv1;ci0;es2ge0zI;ge0mi5;a0gi0;aXeWiToRuP;ga0i0l3sPttBZ;c1tLV;da0nP;teE;gQni0zP;io5za0;ge0na0;cc1dBgM5me0na0quH4s6t2;cD3g4iRmmH3nQppI6stor5tPzI;ernAtu4;a0ca0ge0tuF;ntM4;c8Lde4gWlVmGZndUrRtP;oPte0;cop1g6T;aCEbi0g1mPniE3tiDDza0;aPiM5u3;lAre,t2;a1Ce0;go4la0;g1l1;agM8etJir2ot2uP;i0ttKX;aWc6daCLgVlUnSoQrFsPt2u2;a0chiE0sa0;ccPnBri0;a0hGP;aPge0i0ta0;lAnz1;a0ma0osoMt4;ge0l1u4;c6mmeEncDEta0;cFLli04n7rQsPte0;su4tBU;i0mLGra0t82ve0;b03c02g00lZmYntasKPrTsStRvP;el3orP;eEi0;a0i6tu4;ciK8tid1;ci0e,fRlQnePsi;!ti6;a,e,i,o;alPuO;leE;a0iliBJ;c1lHsAP;l1oP;ci2;i5RoltA;bPri6;ri6;c1Id1Fff1EguaOiacu3l18m14n11qui0Yr0UsVtUvP;aSiRoP;ca0lP;ui0ve0;de9JnKOra0ta0;cJYde0ngelApo4;er5ichFT;a0Lc0He0Ei0Co09p00sXtPulI9;as1eUiToSrP;aQoPu7;m8Dv6S;da0n1po3r0;lDNrKG;ma0ng6ZrGva0;nPrnaDV;de0ua0;ePic6uB;gDVrP;ci2e;aWeUiJXlSoRrQuP;g5n9;i83opr1;ne0rFU;e2ic5NoP;de0ra0;di0lDAriPt2;mF5re;n7tr1;nQrP;cAdi0ta0;da0e4;bi0ge0lPme0sJta0;a4ia0;cQgDFmpPn2rciFJ;liBE;ra0u2;lRoQuP;sa0te0;gi2;aFu7;cerJ6ge4lHCmi5s3UuP;di0ri0to4;eRge0i9oQra0uP;di0t2;de0ga0m5F;d51g9;lib4paQvP;aCOo6;gg1ra0;com1fEFtQuP;clH0me4nc1;ra0usiasF;aQePig4ozIpiIMu3;nBr9tJ;nPrBP;a0ciG;aSeRiQog1uP;cub4de0;de0ge0mi5;g9moDGn6va0;bo4rP;gi0;ettIDig1on7;iQuP;cDSlco4r0;fi6ta0;cQheElPonomA;isC;ePi2;de0lC2pi0ttI6;a3Re2Fi06oVrSuP;bQce0el3pPra0;li6;b1i2;aQe5iPoD;bb3z8;ga0mmDOpG;cYlXmUnKKpTrQsa0tGBveP;n2re;a0mP;en2iP;cKre,ta0;a0p1;aQesHXiP;cFGna0;nBre;a0e0o4;c1e0umDG;a1WbatJc1Vf1Pg1Ml1Hm1Bp19r14sWt2vP;aUeSiQorPulD;a0z1;de0e2nPsa0;a0co3;de0lBEnI2rPz8;be4ge0s7Xti0;ga0mGri6;a0Ubos6c0Nd0Le0Jfa0g0Hi0Alo6m5Zo07p01qZsVtPubbiF2;aTen7iSoRrPurHL;ar0iPug9;bBLca0;gICrI0;l3ng4J;c6nz1re;angH8eRiQoPua7;c1da0lCCtter4;mu3pa0;mi5nNppelJUr2ta0;uiP;si0;arHeSiRoQrePu2;g1z8;ne0r0sa0;aHOeDn9;nPrDIt2;de0sa0;bbeEJcQno4rP;di5iCN;cuG;dUllu7mp3YnP;cSfCOnCRstIBtP;eQosP;si6;g4resC;an2;e4ra2;e3iPreDus2;un9;g5rP;eBta0;a0ePi0;g5t2;eUhTiogHHoRriQuP;sCte0;mi5ve0;lGnPpLr4Ns2;n4WosH1;iu7;n7rFC;g1pproHVrFttP;en7iHU;aSeRiQl1XoP;c6m2Qt2;ge0me0;!da0g9zI;da0ma0z8;aPen7i2FloFor0;na0rN;aTeRiQoP;ra0st4;nA7ssI;nPsG2tJz8;a0ti6;grHnB;aSeQi9uP;i0nDv1;gPt2;g1ua0;ga0n1ta0;eLiQrP;ig5;ta9Tu5;eTfP;aFerRiPon7;cPda0;ol2;e52i0;n7t2;a0esChia4;gnosFKloD;ambu3b0Yc0QdHHf0Mg0Kl0Gm0Dn0Ap04r01sVtRvP;as2ia0oP;lAHra0;eQo5rPta8KurG;ar0;ne0rPs2;ge0io4mi5;c54iTo3tPu3S;aRiQrP;a0eEug9;na0t9D;b2Kre;a0de4g5la0na0ra0sJ;aQiPoDuF8;de0me0va0;gl1pa0;auTeSiRlo4oQrPu4;eBi3I;ne0rB9si2;la0n9;n7ri0;pe4;ig4oQta0uP;da0nBR;mi5ta0;anBoP;crADli0nArP;alAde0;eRiPu7;be4mi2nPra0z1;ea0q1T;ga0re;ePluNna0raBus2;ne4;al6eRiQlPorFrauBun9;etJui0;la0ni0;ca0ri0;aVe7hi5iUlToQrePur2;sF0ta0;di6Jl3mpQrP;a0re0;or0ri2T;aFi5;de0fDZma0;de0n2pi2;b1el3iPut2;li2;ma0nTrRtPz1;a0tilogP;raM;deEe,lP;a,e,o;n55za0;a4Je49h40i3Ml3Jo04rUuP;cRlQmu3oEKpe0rPstoBI;a0ioCva0;la0mi5;c1iPul1;na0re;apu3eViUoQucP;c1ia0;cQgPl3;io3;ch1iP;a0fig9;a0min0Yti6;a0de0ma0pQsPt2;ce0iF;a0i2;a32c31di5PesisJfina30g2Yi2Wl2Nm1Un05o03p02rXsPva0z8;a0pVtP;a9ReTiSrQuP;di0ma0;iPui0;gCDn9;pa0t7J;gg1l3r5;ar9i4;az8bEHi6o5rPteE;eRispon7oPuD;bo4de0mP;pe0;da0g9la0re;ia0pECri0u3;pe4rP;di5;c17d14f0Vg0Ri86n0QosDOqui0Ps0HtVvP;aliBeSiRoP;ca0gl1lP;a0ge0;nDKta0ve0;ni0rP;ge0sa0ti0;a08e04inCSor03rPun7;aTiSoP;bQl3vP;erJ;atJilaBU;b6Wre;bbWccamb1dTfMpp9HrSsQttaPvveCW;c6re;sPta0;eg5;e,ia0re;diPi0;re,stingP;ue0;anB;ce0na0;gg1mp3nRstP;a0uP;alA;de0e0ne0ta0;bPg1mi5re,t2;ilA;ac4eUiTolStQuP;l2m7M;a8Hit6DrP;in9;a0iB;de4gl1sJ;gPnNrDM;na0ui0;de0s2;etJo2uAV;eRiuQrP;atu3eD;n9ra0;da0g5la0stItCG;aWeUiSl61oQrPu2;on2;n7rP;ma0ta0;c6da0gPna0s6;ge0u4;rPsCzI;i0ma0;bu3re;an5enCiQoPur0;le0na0t2;re,vi7zI;eSiRlu7orQret91uP;pi0sC;da0re0;a0l1ma0ta0;de0nt4pi0rP;ne0ta0;anBb0Fen2i0Em07oBpQuP;ni6;a03e01iZlWoVrQuP;n9ta0;aSen7iRoP;mPva0;etJ;me0;re,vBY;ne0r7Es2;eQiPot2;ca0m6Rre;sCta0;aPe0la0re,ta0;ce0n9;nPra0te0;d1et4sa0;g5rPtBD;a0i0ti0;eSiQo5WuP;o5Vta0;na0sP;e4sIu4;d1mo4nQrcPtJ;ia4S;da0ta0;nc1sC;aPi5;c1tJ;a0e0lSma0oRpPtiC3;a0evPi0;olA;nArH;aSeRiQoPu7;ca0qu1;de0ma0;ga0t2zI;bo4re,sCuBzI;nPre;ci7v1B;i2liPnosAV;e0o5;nz1;co3e0;bi2diuBOgu3;aPic6o5;ma0n9ssi29uP;di6;a01ba0c00f4gZmATnXondo3rcStQuPv5U;cc1r3;a0oP;fo5;oQuP;i0la0mnaviDnB;nQscP;ri4W;ci7da0;cisKgPta0;e0u5K;ne0o3;atrAca0;ba2Mnci0Kr3;at2eWiP;aSeRna0oQta0uP;de0r3;cc1da0sa0;de0re0;cchie4ma0pGrPva0;a0iP;fi6re;re0ta0;ca0de0lXm53nTpGrQsP;el3sa0ti5;a0cQn52tP;a0i1H;a0hi2Ci5;a0na0sRtP;elli5rP;a3AifuD;i0u4;a0eb4ia0;b0RcAOd0Pf9Zg0Ol0Lm0In0Dp04rZsXtUuTvQzzP;a0eEia0;aPil3;lPre;ca0la0;sa0te3;aQtP;a0iAGu4;loDp2V;ca0sa0tP;iDra0;aRbQca0ez8iPpi0;a0ca0;onAu4;m9XttP;erA;aWeViQovPp0Vta0;ol9;llSre,tP;aPo3;lAnPre;a0eE;arA;gg1re;ci2re;alAc9MdiSg1na0sa0tPzo5;areQer9LiP;cKle5;!l3;da0re;b1mi5oASpPufM;a0eEiP;cKo5re;a0cQe0ib4ma0pPunn1za0;es2;a0ia0o3;a0io5l1;ePu6;n8re;a3ra0;a0Oe0Hi0Cl0Ao04rUuQypP;asC;ca0fRgQli5r3sPt2;ca0sa0;ge4ia0;a0fa0;aVev3NiTonSuP;cPli6ni0s6t2;a0iaP;cKre;to3za0;ga0l3nP;a0da0;cc8DmHnPsa0va0;cPdi0;a0o3;cSfonKicRllHmbar20niQrPt5Uxa0;bQda0ra0seE;fi6;ot2;cPia0;a0heEia0;aPinBoc6ufM;n4XsfeFte4;aRgQla6Fnas7YsPv5D;biOog5ti9O;hello5ia0;da0n6sP;ci6iF;a0ccUfMl4BnRrQstemm1vP;az8e4icK;c1e,go3linDsaO;da0ePvo0X;a25diPfic7T;ce0re;a0heE;c03da0g5ia0l00nZrUsSttQzP;zi6;aOeP;re,z8;a0c1i0sa0tP;a0o5;aSba0cRda0rP;a0iP;ca0re;ame5ol3;re,t2;ch2Idi0;b2He5lQoc6uPza0;gi5;a0et2;a0cQiP;a0ucK;aPh1;gl1re;b88c6Td62er61ff5Mg52i51l4Fm3On35p2Er1Ms0Yt0Hu0CvUzP;io5zP;aReQiPufM;ma0tN;c6ra0;n5rB;a05e02in6Xo6vP;aZeViQolP;ge0to3ve0;a0cSlRnQs4Ita0va0zP;zi0;a0ce0gh1;i0upG;enBi5;de0le5nQrPz8;a0sa0ti0;i0tP;a0u4;lPmGntaE;e0la0o4;lQrP;e,te0;le0;l3n8r1;di0gu4li0m1Ira0sRtP;en5UoP;m1DrA;cPpi6;ul2;a0tP;a02eZiYorWrRuP;aPti0;lAre;aRez8iP;bPs2;ui0;c6e0r0vP;erC;cPn1;e0iO;g4Cn9ra0va0z8;ccQgg1nPrrHs2;d0Pe0ta0ua0;hi0;c6gl1naOrP;da0e;c08f07o3p05sStP;eQrP;ar0in9;ne0r9;aZeWiUoQuP;eMme0r9;c1da0gg0UlRmQn5pi0rPttiO;bi0dHge0ti0;iOma0;da0ve0;cu4dPeGl3mi3sJ;er4P;cQd1g5mb3ntHrPs2t35ve4;i0vi0;onB;gg1l59po4sP;si5;ePi4or2;r9t2;al2iss1;en7iRoQriP;ve0;l2n7;a0uD;a0Eb0Dc0Ad09e48g07ieEm06om05rQti5IzigoP;go3;aZeYiWoQuP;fMggi4No3;cc55gTsStQveP;l3n2;a0oP;la0nB;a0sHtH;a0e0;ccPde0nDsKva0;hi0ia0;ca0da0n7s2t4;bRfMmQnPpa0;ca0g1;pi6;at2b1;atA;a0eEonA;i5omPui0;en2;e0i0;a0hiP;tPv1;et2;it4;bPre;es6;ostroMpPri0;a08e05i02l01oZrQuP;ntHra0;eVoP;ba0cc1da0fTn2pRsQvP;a0vigI;siF;iPr1;a0nq3G;it2ondH;n7sPz8;en2sa0ta0;gg1lla1rPs2;re,ta0;au0Xi6;aQccPgl1opGso3;a0i6;na0ttH;l3nQsPti0z8;anNta0;a0de0;ga0ia0lTn5rQssiP;o5re;a0eQi0tP;a0e22;cKn2;eCta0;alAc06d05e03g02iFnVsTtP;eQiP;ciG;ce7pP;or0;a0iP;a0ma0;aUeTiSoRuP;i0l3nPsa0vo3;c1z1;da0ia0ma0t10ve4;chi5Bda0en2;bb1ga0rHtJ;cq2Kff1sG;e0o54uY;lPst11;a0la0;a0icapG;heEo4;a0Cb0Ai6mUniToRpP;liPu2;a0fi6;reE;gg1;st1;a01eZiYoRuP;cKffi0tP;i5o4V;bUdTgl1llHn2PrP;bQtP;a0iz8;a0iP;di0;er5;il1;c6niTra0;nBtP;a0te0;c6eQi5l2OnPra0sCtNz8;et2sHta0;st4;a4DiPu3;a0en2re;lgaFrP;ePi6;!gg1;be08e07fab06ge0i05lSmanRtPza0;ale5erP;a0ca0na0;ac6;aZeViToQuP;ci5de0n04;ca0gQnP;ta5;a0g1;bi0e2nP;ea0;a0gQnPr2sNt2v25;a0ta0;a0geLra0;ri0;cc1ga0pGrPt2;ga0ma0;a0e5ta0;etA;gg1na0re;gg1rP;a0ga0;ta0u2z8;e07gSiRoQuP;ra0z8;g5nA;a0re,ta0;a02et01hi00iVloUrQuaP;n2ta0;aReQoPupG;t2viO;di0ga0;dHpGva0;me4;oSra0uP;di6gQnPs2;ge0ta0;ne0;ga0r5;a30nB;ti25;nc1;vo3;a00eYiVlUoTrPumi6;aQePon2;s6t2;nPt1N;ca0ge0;ca0ga0l3nB;ig9o2Vui0;aQbb1da0evo2YgPl12na0o4sCt2;e0ge0;n6ta0;rPt2zI;i0ma0ra0;ccQma0n5re,sPti6;ci5;enBia0;a0ea0;a0Ed01eXiVoRuP;lPna0;a0te4;cKmb4pQrPt2;a0na0;e4ra0;ch1;bi0rP;a0e;gRmpiQrPs6;ge0i0;e0re;ua0;a0eYiVoQuP;ce0r0;bSlRmesQrmPsC;en2i0;ti6;ci0o4;ba0;re,ta0veQzI;io5;ni0;bi2nPst4;sa0tP;a0ra0;g1t2;cUeNquRuP;i0tA;iz8;at2e2iP;e2sP;i0ta0;a0Le0Gh0Ei08l06oTreRuP;cc1di0lPmu3ra0sa0;tu4;di2sP;ce0;c00da0gZlYmVnSppRrQstPva1E;a0uF;a0c1da0ge0pa0re0;a0ia0;c1discQsenNtP;a0en2;en7;ia2oBpPu5;ag5;da0;la0tY;lie0;co3;aFima2u7;ma0;aSdRe6gQn9ufM;ge0;l1ne0;e0ia0;c6mbP;el3;e2iP;apGta0u7;ca0de0le4nRrQsNt2;ti0;ch1ta0;de0na0tP;a0ra0ua0;de0lYmGnWpVrUsTtQvP;al3;as2tP;a0iP;va0;a0c1;ez8to0G;ar4iOpo5;i0to5;pa0;aPca0da0o4;pp1;bYdXer4iUneDoRrPuC;a7oD;de0;li0mi5rP;ri0ti0;ga0;li2sCtPu4;a0ua0;sa0;i6ur0;a0Ae07i03oVrQuP;fMia0o5;aSev1on8uP;nHsto06tP;i0ti0;a0i0;cc1n6;c6nUrRtQz8;za0;to5;da0rP;aPi0;cc1;aPda0i0;cc1re;gl1nRoQsog5t2;ta0;sc1;a0do3;lQve4;ra0;li0;cXgl1ia0l3ndo5rRsQtJ;te0;sa0ta0;bQca0ufM;fa0;aOi6;ca0;gl1;la0;a0ch1i5;na0;ia0;re",
    "Reflexive": "true¦farsi",
    "FemaleNoun": "true¦arachid6c3fame,gen2lu4m1n0pelle,se2vo4;a4e4ot1;adre,en0;te;arne,hia1ro0;ce;ve;e,i",
    "Singular": "true¦arachide,cEdCf9gCluGm6n4p1s0voG;a1eCo1;a1el0onB;le;dBese,ne;aCeCo0;me,t7;a1e0on6;n5se;d6re;a1i0;o4u0;me;en0;te;a3hia2ro1uo0;re;ce;ve;ne,rne",
    "PluralNoun": "true¦arachidi",
    "MaleNoun": "true¦c9de8fi6m4no7p2s0;a0o0;le;a0o5;d6e1ne;a5e0o3;se;o3u0;me;nte;ane,uo0;re",
    "FutureTense": "true¦a2do2potr3s0vorr3;a0tar2;pr1r1;vr0;a1e0à,ò;mo,te;i,nno",
    "ConditionalVerb": "true¦av2dov2pot2s0vor2;a0ta1;p0re1;re0;bbe1i,mmo,st0;e,i;!ro",
    "Preposition": "true¦a9co7d3f2in,ne1p0su6tra;er,rima;gAi,l8;ino,ra;a2el0i,opo;!l0;!a,o;!g5i,l3;i,l,n0;!tro;!d,g2i,l0;!l0;!a,e,o;li",
    "Adverb": "true¦0:0T;a0Eben0Dc0Bd02ecc01fZgXinUlSmPno,oMpFquDs6t3v1;i1olentieZ;a,ci0M;a2rEutto1;!ra;lvol0Fn0rdi;e6in,o3pe2ta1ubi0ì;mattina,notte,se0K;cie,s0I;l2pra1t0;!t00;o,t0H;conda,mpC;a1i;!li,n0si;arecchCer6i5o4r3ur1;!tr1;oppo;es0opr9;co,i;uttos0ù;altMfi03si03;lt2r1vQ;a,mai;re;agaBe1ol0;gl1no;io;a1à,ì;ggiù,ssù;diAfine,s2t1vece;an0orT;iMomD;i1ratis;à,ù;inoSorse,uo1;ri;!o;a3i2o1;podomani,v9;et3;pp3v1;a9ve1;ro;er2ri1;ma;tut0;irca,om1;e,unque;!e;bbastanza,ccEdBl9nc7pp5ss3tt2va1;nti;or8raverA;ai,i1;eme;os1un0;ta;h',or1;!a;me1trove;no;dirittu2es1;so;ra;an0;to",
    "Expression": "true¦ah9b7c5e4f2guai,ma1oh,p0salute,uffa,zitto;iantala,u7; va,cché,nnagg7;alla fin3ig0orza;o,uriamoci;ccolo,hi;asp0iao;ita;le0oh,ravo;ah;ia",
    "Cardinal": "true¦cQdHmilEnovRottDqu9se8tre1uAvent0ze6;i3otLu2;!dHnt0;a1otJu0;no;!cinq2d2nKquatt1se0tré;i,tI;ro;ue;dAssaJttI;a1i0;nd8;raGtt0;ord6ro;aEo;i0le;ardo,on0;e,i;i2od1ue0;!cen3mB;ici;ci0eci8;a1ot0;to;nn1sset0;te;ove;ento2inqu0;a0e;nta;!m0;ila",
    "Ordinal": "true¦cIdDmilBnoAotta9priLqu5se2t0undEveJ;erzo,re0;dCntI;condo,dBs1tt0;aFiH;saEto;a1in0;d7to;r0ttord6;aAto;ntAvo;no,va8;i0l8;ard7on7;eci7ici1od0;ic5;a0o1;nnov3sse0;tt2;e0inqua0;nt0;esi0;mo",
    "Unit": "true¦bHceFeDfahrenheitIgBhertz,jouleIk8liGm6p4terEy2z1°0µs;c,f,n;b,e1;b,o0;ttA;e0ouceD;rcent,t8;eg7il0³,è9;eAlili8;elvin9ilo1m0;!/h,s;!b6gr1mètre,s;ig2r0;amme5;b,x0;ab2;lsius,ntimè0;tre1;yte0;!s",
    "Month": "true¦a5dic3febbra2g1lugl2ma0nov3otto4sett3;gg1rzo;enna0iugno;io;em0;bre;gosto,prile",
    "WeekDay": "true¦domenica,giove1lune1m0sabato,vener1;arte0ercole0;dì",
    "MaleAdjective": "true¦0:KR;1:KG;2:KE;3:IZ;4:K3;5:K8;6:KM;7:JK;8:KD;9:K4;A:KS;B:IY;C:J8;D:IH;E:KT;F:IG;G:KN;H:KI;I:JC;J:IW;K:G3;L:I4;aHPbH2cEGdCZeC0fAZgA4i87junior,l7Tm6Dn5Wo59p3Uqu3Rr2Ss0Tt0Cu05vMzoppo;a02eYiOolNuM;lnera8o0;gaKontF;brAgUnc15olTrtuSsPtOvNziM;a0o3;aI1i9o;a2torB;cNiM;bi2vo;eGBi9o3;a2o3;a,en0;i2oHG;cchiIZlOneNrM;de,gogE0o;ra8to,zIJ;eDYoHQ;cAgo,l2PnMriIVs0;o,taEI;brGDffHYgF5l9FmQniOrMti2;banMg5inF;is4o;lateFYtFversM;a2itF;a7iM;do,le;a01eViUoRrNurM;co,is4;aNemD6iMopi5O;butFpIsE;diMgi1nquilIspar5uG1;toKzEA;ccArNsMzGA;ca7si1;na0rentBU;be64mi9pi1;atFKcnoDMd96leQmPneCoDMrM;apeu4miNrM;i8orGV;co,na2;a4pEB;foLviH;cit4Ulent5Dr9t4;a1IbCUc18e10fo0Zi0UnelIo0Gp06qu05tTuNvM;ariaENeglDizzeC;ccQdPf7Kgges6pM;erMreIF;!bo,fMioK;icH6lI8;!dFN;esHo3;aVeUiSrOupM;eMi9;fIXn9;aNeMiduIumJB;piCEssAt0;biliAnMordinFteFTvagA;ieCo;lGBmM;olA;ri2s3;bi2gnAnMti1;co,dard;al3GiH3;aTePiOlendi9oM;ntDNrMsa0;co,tiG;eIMgo98na0ritDT;ciNrimIXttM;a4Sra2;alMfi1;e,izJB;g0YzM;io3zatura;cialYddisfD9fWgg3OlTnSrRsOttNvM;ie4ra7;e57i2;peNtM;aDLeni8;so,t0;do,preCQ;oCt4A;enGGfoFXiM;do,tM;arDo;fMiI5;er0iFS;democra4e,isDG;cPgnificaOlenzBmNnMsteEFto;ceCfoLgolGPistCte4;boHBi2m8Apa4;!tiG;ilGEuC;ca0rtuHN;cSdizBgre0lPmpliFKnsOpNrMttimaCKveC;e7io;aI2ol0;a0i8;eNvaM;ggDti1;t6zHF;co,ond8M;aUet4hiTiQoNrPuM;ro,sa;l9Zmo9nMr3;fMoCPvDD;it0;at0cFXe8SoM;ccMl0;anEo;acciAet0fo3;nda80r3;crG2ggiG8nMr9tiF3;itFo,to;a0Ee03iToOuM;moELra2sMvi9;so,ti1;bFYccBmaNsMt0utiFH;a,eo,sFW;gNnM;i1o,ti1zo;noI;cUdTgSl4YnQpPsMtHLvoluzionF;cNer33pettMtrDL;a8iG;alda0hB;eti6i9;frescAnovaMoma0;bi2to;i9oE7;iG9ot0;cDRet6;aVcUgSlRmo0sOtM;roat6tM;ilinECo;iNpM;ir9Wo4N;deBYst5;a6igB;ioMoCR;!na2;enEipro1;l2Ct6;diPffiG9gC5pOro,zM;ioB6ziM;a2s8N;i9presen7W;ca2oM;at6foLteleviH;aNest'ul5ToM;!tidES;dGJli7RntDQ;a0Re0Li0Ila0Go09rPsicNuM;bblic83li0ni6ro;hi1oM;loD2ti1;atic2Le00iVoMud5;at6ba8ceduC7dTfRgrFLliDNmQn0pPsNt1DvM;a0enienBHoc9AvisAY;peMsiFAta4;ro,t4;orzFQri08;ett5in5;essionMon9;a2is4;igBut6;gionieCmNncipa2vM;a0ilegE6o;arDiNoM;ge4KrdDT;sEYtiG;cPdAUfe4ZliminaKmOoccupa3XsNvMzB;al5en6io;enEiAXtigBun0;a87ium,uCY;ed5i3;chisESe4lQntificDpolPrta49sNtenMveC;tCAzDL;i6sMtuER;esHi8;aKo3;ac1eFYiM;ti1zi54;ci9nMuEB;etF;aceJccNeMgCo,sa7ttoD2;ga0no,to3;anEoI;dagoC5lo3nQrMsA;fBRi1Pman5peOsMtin5vaH;iMo,picaCW;a7st5;ndi1DtE8;sieCFti0;ca0ffu0lTrPsHtNuCEzM;i5zo;eMriot4;r7ti1;aOiNlaMsimonBtecipanADzD0;m71to;!gi7;gona8lleInoi1;li9;bbligato07cc05di04ffenHgg03k,l02m01nZpVrQsPttMvvDzB;iMo0R;co,mM;a2is6Yo;cuCsCBti2;a2dinaPgOiMri8todos3;enF1ginaM;le,riDI;anizz3To1C;rDto;eraOpM;oMrim5;rtu7s0;io,tiG;es0orM;arDeJ;bBPogenBZ;eo3f97;et6;er7o3;as8YuM;l0pa0;!rD;aYeUoOuM;do,lImerMoGtriz8U;i1o3;bi2io3rOstalB0tM;eJo,tM;ur7;dNmaM;le,n7;!aDJi1;cess4WgOoNrMt0utrCL;o,vo3;cla70na0;a6l75;poleOrCSscos0tM;al64iGuralM;e,is4;oLta7;a0Le0Ai02oQuM;ltipIsMto;iNulM;ma7;ca2;ccBdUlRnPrOstrNtiM;va0;uo3;a2bi9tC5;as4etFtM;a7uo3;eNtM;eplici,isCL;co9I;a,eMu9H;rMs0;a0no;gl1Vli5DnRraQsNtM;e,i1;erNtM;erBi1o;a8o;co3Q;iMoKusCH;!mo;diUlo34morTnSrQsPtM;allNropoliM;ta7;i1o;chi7siCJ;aviMo;glB;si2ta2;a8ia2;o,teM;rr7Q;cho,es66gZlVnUrRsOtM;erMto,uC;ialistica,no;chiNsiM;ccDmo;le,o;cNiMm72roATzAL;a7no,t20;a0io;ca0ua2;a0eNiMvagD;ncoLzB;dMvoI;et0uCF;i1nMro;e4i9U;aYeTiSoQuM;ci9mi66ngNssuM;o3re13;hiMo;!sBD;ca2gi1nM;gobar9ta7;beCe0miC3ngu9Jquidi,ri1scDt83;a2gNn0tM;a2ter2Z;aCOgeNiM;sla6t1G;ndFro;i1r88ti7;bri9d1Fgno1Ell1Am0WnVoLpote4rOsMtalAD;laCDpi9raelACtM;ant6Te9K;oLrM;eOiM;lMta8;evA;go7UsM;is7DpoM;nsa8;a0Lc0Fd0Ce0Bf04giACizia03nZquietAsWtPu0AvMzuppa0;aNer3iM;nci8si8;d5r9V;at0eMiAQrinse1ui6;graC5llQnPrMso;essaNmedDnMo;az63o;nEto;s6WzB3;ett6Jig5;apoKenA8igni15oli0ta8uM;bo4DfM;fici5;atOoMumerevoli;cMva6;enEuo;o,u78;le,tiva;aQeOiVlu5ormaM;le,tiM;co,vo;li8PrM;ioK;lli8nM;ti2;di0r5viBB;efiNiMustr8W;a7ca6fe3gALpe5Br7Dscus3;ni0;er0in2ZlQoMredi8;er5mpOnNraMstit55;ggiA;dizAFscD;iu0le0;iAEu3;deAKspetAMt6ugu6P;barazzAmVpM;aSeQl2CoPrM;eNoM;ba8vvi3;cisa0ss2G;rtant76s9D;c8TgnMr8G;at5X;uMzi5;ri0;aNeMorAOun26;d8Mn3;ginaMtuC;bi2rD;eMustK;ci0gM;a2itM;ti9C;rAto;eNill6Hon7NrM;au9Di1og7J;a2n4;asso3e08hiacc8BiZloYoXrMus3F;aQePigDoM;ssoNttM;es1;!la7;co,z6J;dQfi1ndOs3tMve,zB;iMo,ui0;ficA;e,iM;o3s8W;eJua2;mmo3ti1ve8W;ba2rB;alIganteToPuM;diziFriNstM;ifi9Lo;di1;io3rnal6XvM;anMia7;e,iM;le,s8L;!s1;lSnOoMs51;g6Tlo67mM;et70;eNtilMui7;e,izD;rMti1;aliz9Zi1o3;i9o3;a08e04iXlWoSrNuM;nz3RrBso;aPeNiM;t0voI;d9ne4qu5s1ttoM;lo3;gi2nces8K;l9LndaOrMt6E;ma2tM;e,u8M;m96nEto;es7QoscDuor8P;dReCloso6BnOorentNsM;io2Wso;e,i7;anziNitMto;a,o;ari7I;a0ucB;deOli6AmminiNnome3ArM;mo,o69roviFti2;le,s0Q;le,ra2;cXlVmSntasPstidBtNvoM;lo3reJ;a2i6UtM;i8ua2;cieNiM;a,o3;nti5U;iNosM;is7Go;ge8HliaK;lMso;i0o;i2olM;ta6;br0Jc0Fd0Dff0Bg09l03mo01nZpi1quival5rXsQtPuNvM;ent39id5olut3L;clid5MroM;!p5L;er7i1ni1rus1;at0clus3HeRilarAo4pPse38tM;eMiGre75;rMti1;i,no,o;an3er0lMr30;ici0;cu6mp3XnE;edMoi1;itF;ergMne6Worme,tusiasW;e4i1;!tiGzM;ionA;aQeMiE;gAmNttrMva0;i1oL;enM;taK;bo7Ps4;iz5WoisM;ta;et6icM;a51i5;ilMuca6;izD;cMlet4o53;eNlesiM;as4;ll5sHz1U;ai1eo;'oCa10e0MiWoRrPuM;bbDrM;aMo;tuC;aMit0;m3Ds4;lorPmNppDrMta0vu0;a0i1mi5;eMinA;ni6Hs4;anEo3;c0Adat4f05g04l03na7Bp02rett2CsPvM;erNiM;no,siG;so,t5;aXcUgus05leToSpQtM;aOintMr10;iMo;!vo;c6NnE;a6Te6ToM;ni8s0;rdi69;ssi1;og3YrMu25;e0iminM;at19;bili6Dst3O;in0lo2Q;ig5;es6i6N;eOfM;iMu3;ci2d5;nHtM;to3;en9;bo2cYdiXfWg7lUmoTnRpQsOtM;ermi5TtM;agl4D;crit6er0iderMtC;a8o3;loreJr14;so,tM;a2ro;g3Dn2A;ega0iMud5;be62ca0zB;init1Bun0;ca0to;ad5enEiHo4O;nMta0;no3;a1Ue1Ohi1Mi1Jl1HoWrNuM;ba7ltu1Ppo,rB;eTiSoOuM;c3LdMen0;e2o;a0cOnM;i1oM;lo2C;cAia0;mi03st3V;a6mo3;er5inv15l12m0OnWperni4YrRsM;ci5idd1Umi1tM;anEiNo3rM;ut6;eCtM;uzV;aPpOrMto;et0ispoM;nd5;or2O;ggB;c0Cdi0f09gress08n07o06s01tRvM;enNinM;c5to;i5zM;ioM;na2;agBeSinRrM;aNoM;intui6ver3;ddittNffMrDs4S;at0;orD;en52uo;mpMnu0;orM;an27;apeJeOiderNuetM;o,udi2T;a0eJ;cu6rvM;atoK;sciu0;es3;ua2;iMu3;deM;nz2C;luHre0;meXo9pOuniM;ca8sMtF;ti;aRetQlNortam4IreMulH;n32so;eMi46;ssMto;iGo;enEi6;ssNtM;i8to;ioneJ;rc1YsM;ti8;lNoMpeJto;n1Vra0;abo2Ret6;ol0;aMiL;mo11ndes1Vustrofobi1;c31e1lind1FnNrcolarM;e,i;emat14i1;aCmi1rMu3;ur0H;co,lOntNrM;ebMto;ra2;eberri2PluMti1;laK;re;dXlVnoLo4pUrQsOtMu0;astro0WtM;iGo2O;alinMua2;go;atter0PdOenEiMnivoCo,si1tes1Q;no,sMtateJ;ma4;ia1;a0UriccB;cMdo,mo,vo;ar0Ois4o2S;et0;a05eZiUlToSrNuM;io,o7;asil1GevPillAonOuM;s1tM;a2to;zo;e,is22;liv1BtaL;an9u;ancPb24lancDoNzM;an0WzarC;loMn9;gi1;hi,o;llPnMrgamas1;eMig7venu0;dettMfi1;i7o;iMo;co,s1P;g28nNrMs3;bu0oc1;a2cF;b2Yc2Hd28ero27f1Wg1Rl1Jm18n0Up0Or0Cs05t00uQvMzzurC;an36vM;eMinc5;ntuMr3;ro3;daYrUstrTtM;en4is4oM;biOmMno1FreJ;a4obilM;is4;ogM;raM;fi1;al0Iia1;eo;eo,le4mosfePo2HroOtM;eMiGra5ua2;n0so;ce;ri1;ciut0ia4pRsPtM;rMu0;at0oM;no29;eMicu1Zolu0ur9;nEr6;irAro;aVbitrFcTgenSia7mQrabbZtiM;coOfMs4;icM;ia2;!la0;a0e7oniM;co,o3;ti7;ai1hitettoL;ni1;bo,ncioM;ne;er0pM;ar5icciPliOoNroprMunti0;ia0;si0;ca8;co3;aWgVimaTnRoQsBtiNzM;ia7;chi,orF;arD;io;maIni08;es3uM;a2o;le,tM;i,o;us0;lMrchi1;i4ogM;hi,i1o;aVbiRe0CicheJmiNpiM;!o;nistNreJsM;si8;ra6;vo2;en0YgOzB;io3;so;uo;ro,to;coSfabe4ie7lQpi7tM;eOisMo;siM;mo;rna6;'aper0armAegC;ro;li1;gOitan9nos4riM;coI;lo;iun6rM;esH;fRrM;iOoaM;meM;riM;ca7;no;aPezNida8olM;la0;ioM;na0;ma0scinA;dina0Anau4;at0doQePiOoMul0;lMra8;esc5;ac5;gua0;meNrmenM;ta0;stiM;ca0;cQi9quNuM;s4to;a4eo;ti1;do;adeVeRidPoNuM;ra0;gli5modA;enE;enM;ta2;so,tM;ta8;bi2;le;mi1;co;bSiNuH;siG;le,tM;a6uaM;le,to;tiG;vo;oMronN;ndAzM;za0;to;anE;te",
    "FemaleAdjective": "true¦0:9Y;1:9U;2:9R;3:96;4:9J;5:97;6:94;7:8K;8:9H;9:9N;A:61;B:9B;C:9D;D:8H;E:9I;F:95;a8Cb7Xc6Dd5Xe58f4Pg46i3Ojugosla9l3Bm2Rn2Eo22p19qu17r0VsZtRuNvG;aLeJiIoHuG;lcaDo0;ca91lont7;ci2n0olen0si9ttorF;cch8neGra;ta,z90;liAr8s0;l3DmHniGrbanI;ca,ta05vers58;anGb5iA;a,is4;aMeIi1Zos9TraHurG;ca,is4;gi1nquil9H;cno8Id43leImpHne5oGr9Tsa;lo8Iri1;e6Uor6I;foDvi9J;rAt4;a09b5Rc06e01f00iWoRpMtHuGvizze5;cc9Fdd65gges6me5preB;aJes3ilEoCraG;nHord3HtG;e8Aig6W;a,ie5;mpa0ti1;ag08eIic8ClendiAoG;nt67rG;ca,ti9;ciGs3;aliz7Jfi1;ciJggett6DlGno5sp5Utt29vie4;a,iG;da,s0taG;!r8;al88et7;cIgnifi4Qmbo83nHsGta;mi1te55;foDgo8S;il82u5;eCortu97;cJgre0lvagg8man4pIrHttGve5;ece3AiB;ba,e2ia;a62ol0;ca,ond7;ar3eDiHoGu5;l4Jn4T;e3Ui0;c5l3NnG;gu1Yit7;aPeNiKoGus3;bus0ccFmaGss6Lt00;gHnG;a,i1ti1;no8B;c1fles3gHnGpiAstr55t8Nvolu38;nova0o7Q;iAo5T;alEcipro1lGmo0pubb7Psid5A;a6igF;diofoDpGra;iApresenta6;aGotid7E;d5IntEr0;a03eZiXl41oVrJsicIuG;bblicGli0ra;a,it7;hi1o70;a4eNiKoG;ble48d4PfIgr81ibi0lunga0n0pr8s7QteHvG;a0vis0D;i1t0;onA;mHvaG;!ta;ar8i6oge1S;ci3ma2KsIvGzF;en6iG;a,s0;tigFun0;e4lac1ntific8pMsGve5;i6tuB;at0cGe2ttoC;co7Ie2;nul17rGs7Btrolife5;du0f4BiGs6R;cGfeCo1X;olo3;ci53da2ga2rHssGtU;a0i9;aHigi2la0tG;en2Oig6L;lle79s6G;bbligatQdiPgg4PlimOmoNnto6ApKrHscu5ttG;a9iB;atOdinaHganiGig1Ftod1V;ca,zzat4J;r8ta;eraHpoG;rtu2s0;ia,ti9;gen45niB;pi1;er2;or8;aOeMoIuG;da,merGo9;i1o3;na,rHtG;a,tur2;di1maG;n2ti9;cess7ga6mi1o76rGt0;a,vo3;!poleIr6Ascos0tHziG;on4Ms0;i9ur16;oDta2;aUeOiLoHuG;r7sic5V;deInHrG;biAfo5I;as4et7tuo3;r2s0;nHstGti1;a,erFi1;er7iBor1X;dIlo0Sra,ssi6KtGzza;aGeoro5Bropolita2;fi3Sl5H;e61iG;a21ca,tG;err39;fFgi1n5CrJssiItG;eGu5;ma4r2;cc8ma;ca0itQm2Xx5Dz5B;aReMiLoIuG;mGng5C;ino3;mHnG;goGta2;barA;be5gn2Ymi23nguEq0Wri1t3L;gGn0tter7;a0geIiG;sla6tG;tiB;nd7ra;i1r3Kti2vo5A;beCdWgno0llumin4ZmRnIpote4roDsHtaliG;a2ca;la5Xo4Ftant2O;aspet1Tcer0dMedi0fKgen2MnJtGv2L;at0eGiB;n3rG;a,med8na;a0ova6;iGor1Q;ni0;iGu4P;a2ge2r26;mHpG;egOortant4Orovvi3;agHeGu1I;d1Un3;in7;en4on2AroelettC;eUiKoIrG;aGe1ig8os3;fi1m1End4Htui0;ti1verG;na6;allNgaLoIuG;di05riGs0;di1;rnHvG;an4Aia2;alE;ntG;es1;a,orG;os3;neIoHrG;archi1maD;g2Clo3QmetC;ri1ti1;aVerTiPlOoKrHuG;tu5;aHeG;dAs1;zion7;nArGt24;tGza0;iGu4V;fi3Ls47;uiA;loso21nanIorHsGt0;i1sa;en2F;zi7;ma,rG;a0ovi7;l3mo3ntasGrmaceu4sc3I;cieGti1;nti1T;br03cZduYff1JgiziaXlSmRnQpPrNsItHurGvolut1Gxtraurba2;op16;er2i1ni1rus1;at0e16pJtG;eGi9reB;rGti1;a,na;lici0r40;edGoi1ra0;it7;a4i1;erge4ne3L;o6piC;as4eHlG;enEit4;ttrGvat3G;i1oG;magne4ni1;!na;ca6;cHoG;lo2Kno3U;es3MlesiG;as4;ai1ea;eSiJoIramPuG;bb8raG;!tu5;lo0Vmes4pp8ra0;chia0PfMna3MpKr04sHur2vG;er3i2;abiHcGpe0Ntrut0;og0Vre0;ta0;in0loG;ma4;en38fG;icolto3u3;cis0Edi0fini6g2li28moHn3ttG;aglM;c1Wg0Nn0X;a0Se0Qhi0Oi0Jl0FoNrHuG;pa,rF;ea6iJoHuA;da;a0cGma4ni1;ia0;stGti1;alli2ia2;l04mYnOperNrLsG;iddJmIpicRtG;ie5o3rG;ut6;i1opoli0;et0;ea2pGta;orN;ni2Rta;cOsMtG;adi2emporJinIrG;ar8ovG;er3;ua;anG;ea;eGideP;cu6;lu2Dre0;i1memo1TpHuniG;s0t7;at0eti6lGosi6re3;eGi1B;ssGta;a,i9;lHoG;ra0;et6;aGiD;moHndes02sG;si1;ro3;lindCneGvi1;matGti1;ogG;raG;fi1;a5mi1rGu3;ur0Q;lGr0;eberriBti1;!lLmpa2noDo4pitKrIsalinHttG;i9o0S;ga;a,boDdGnivo5si1;ia1;al0S;cEda;aPeLiIos3rGuo2;asil0NitanDutG;a,ta;ancHb0Jo0CzanG;ti2;a,one5;lGrbe5;ga,lG;a,iG;ca,s0Y;roc1sHttG;eCu0;i0AsG;a,isG;siBta;bbando1Fc1Ed1Der1Afr16g0Wl0Qm0Kn08p03rRsPtNuIvGzzur5;anGvers7;za0;strJtG;en4oG;mGnoB;a4obilE;al02ia1;le4mosfeCo13tG;a,en0i9;p5solu0trG;at0ono10;ab07bitr7cListoJmItiG;coGs4;la0;a0e2oD;cGteR;ra4;ai1hG;eoHitettoD;ni1;loG;gi1;ar8;er0ostoJpG;liHoG;si0;ca0;li1;aOgNiMnLoniBtiHzG;ia2;cHfascG;is0;a,hG;isU;es3ua;ma0;li07;lGto09;i4ogG;a,i1;a5bizFe02ministGp8;ra6;ti9;io3;sa;ra;geJie2pi2tG;a,isG;siB;ma;bCri2;ri1;gLia0onErG;ar8icoG;la;ia;is4;ti1;iorSrG;esG;si9;va;iHoameG;riG;ca2;na;ea,odinaG;mi1;ca;at0espo0ul0;centua0u0;na0;ta",
    "Currency": "true¦$,aud,bScQdLeurKfJgbp,hkd,iIjpy,kGlFnis,p8r7s3usd,x2y1z0¢,£,¥,ден,лв,руб,฿,₡,₨,€,₭,﷼;lotySł;en,uanR;af,of;h0t6;e0il6;k0q0;elM;iel,oubleLp,upeeL;e3ound0;! st0s;er0;lingH;n0soG;ceFn0;ies,y;empi7i7;n,r0wanzaCyatC;!onaBw;ls,nr;ori7ranc9;!os;en3i2kk,o0;b0ll2;ra5;me4n0rham4;ar3;ad,e0ny;nt1;aht,itcoin0;!s",
    "SportsTeam": "true¦0:1A;1:1H;2:1G;a1Eb16c0Td0Kfc dallas,g0Ihouston 0Hindiana0Gjacksonville jagua0k0El0Bm01newToQpJqueens parkIreal salt lake,sAt5utah jazz,vancouver whitecaps,w3yW;ashington 3est ham0Rh10;natio1Oredski2wizar0W;ampa bay 6e5o3;ronto 3ttenham hotspur;blue ja0Mrapto0;nnessee tita2xasC;buccanee0ra0K;a7eattle 5heffield0Kporting kansas0Wt3;. louis 3oke0V;c1Frams;marine0s3;eah15ounG;cramento Rn 3;antonio spu0diego 3francisco gJjose earthquak1;char08paA; ran07;a8h5ittsburgh 4ortland t3;imbe0rail blaze0;pirat1steele0;il3oenix su2;adelphia 3li1;eagl1philNunE;dr1;akland 3klahoma city thunder,rlando magic;athle0Mrai3;de0; 3castle01;england 7orleans 6york 3;city fc,g4je0FknXme0Fred bul0Yy3;anke1;ian0D;pelica2sain0C;patrio0Brevolut3;ion;anchester Be9i3ontreal impact;ami 7lwaukee b6nnesota 3;t4u0Fvi3;kings;imberwolv1wi2;rewe0uc0K;dolphi2heat,marli2;mphis grizz3ts;li1;cXu08;a4eicesterVos angeles 3;clippe0dodDla9; galaxy,ke0;ansas city 3nE;chiefs,roya0E; pace0polis colU;astr06dynamo,rockeTtexa2;olden state warrio0reen bay pac3;ke0;.c.Aallas 7e3i05od5;nver 5troit 3;lio2pisto2ti3;ge0;broncZnuggeM;cowbo4maver3;ic00;ys; uQ;arCelKh8incinnati 6leveland 5ol3;orado r3umbus crew sc;api5ocki1;brow2cavalie0india2;bengaWre3;ds;arlotte horAicago 3;b4cubs,fire,wh3;iteB;ea0ulR;diff3olina panthe0; c3;ity;altimore 9lackburn rove0oston 5rooklyn 3uffalo bilN;ne3;ts;cel4red3; sox;tics;rs;oriol1rave2;rizona Ast8tlanta 3;brav1falco2h4u3;nited;aw9;ns;es;on villa,r3;os;c5di3;amondbac3;ks;ardi3;na3;ls",
    "Organization": "true¦0:41;a36b2Nc27d1Ze1Vf1Rg1Jh1Ei1Bj17k15l11m0Sn0Go0Dp07qu06rZsStGuCv9w4y1;amaha,m2ou1w2;gov,tu2O;ca;a3e1orld trade organizati3V;lls fargo,st1;fie1Zinghou13;l1rner br37;-m0Ygree2Wl street journ21m0Y;an halMeriz3Qisa,o1;dafo2Cl1;kswagKvo;bs,kip,n2ps,s1;a tod2Mps;es2Zi1;lev2Sted natio2P; mobi2Faco beOd bLeAgi frida9h3im horto2Omz,o1witt2R;shiba,y1;ota,s r X;e 1in lizzy;b3carpen2Xdaily ma2Rguess w2holli0rolling st1Js1w2;mashing pumpki2Juprem0;ho;ea1lack eyed pe39yrds;ch bo1tl0;ys;lPs1;co,la m0Z;a6e4ieme2Cnp,o2pice gir5ta1ubaru;rbucks,to2I;ny,undgard1;en;a2Mx pisto1;ls;few21insbu22msu1T;.e.m.,adiohead,b6e3oyal 1yan2S;b1dutch she4;ank;/max,aders dige1Bd 1vl2X;bu1c1Qhot chili peppe2Flobst24;ll;c,s;ant2Qizno2A;an5bs,e3fiz20hilip morrBi2r1;emier22octer & gamb1Nudenti11;nk floyd,zza hut;psi23tro1uge06;br2Lchina,n2L; 2ason1Tda2B;ld navy,pec,range juli2xf1;am;us;a9b8e5fl,h4i3o1sa,wa;kia,tre dame,vart1;is;ke,ntendo,ss0I;l,s;c,st1Atflix,w1; 1sweek;kids on the block,york06;a,c;nd1Ps2t1;ional aca2Ao,we0N;a,cWd0L;a8cdonald7e5i3lb,o1tv,yspace;b1Insanto,ody blu0t1;ley crue,or0L;crosoft,t1;as,subisM;dicaid,rcedes1;!-benz;'s,s;c's milk,tt11z1V;'ore08a3e1g,ittle caesa1H;novo,x1;is,mark; pres5-z-boy,bour party;atv,fc,kk,m1od1H;art;iffy lu0Jo3pmorgan1sa;! cha1;se;hnson & johns1Py d1O;bm,hop,n1tv;g,te1;l,rpol; & m,asbro,ewlett-packaSi3o1sbc,yundai;me dep1n1G;ot;tac1zbollah;hi;eneral 6hq,l5mb,o2reen d0Gu1;cci,ns n ros0;ldman sachs,o1;dye1g09;ar;axo smith kliYencore;electr0Gm1;oto0S;a3bi,da,edex,i1leetwood mac,oFrito-l08;at,nancial1restoU; tim0;cebook,nnie mae;b04sa,u3xxon1; m1m1;ob0E;!rosceptics;aiml08e5isney,o3u1;nkin donuts,po0Tran dur1;an;j,w j1;on0;a,f leppa2peche mode,r spiegXstiny's chi1;ld;rd;aEbc,hBi9nn,o3r1;aigsli5eedence clearwater reviv1ossra03;al;ca c5l4m1o08st03;ca2p1;aq;st;dplLgate;ola;a,sco1tigroup;! systems;ev2i1;ck fil-a,na daily;r0Fy;dbury,pital o1rl's jr;ne;aFbc,eBf9l5mw,ni,o1p,rexiteeV;ei3mbardiJston 1;glo1pizza;be;ng;ack & deckFo2ue c1;roW;ckbuster video,omingda1;le; g1g1;oodriM;cht3e ge0n & jer2rkshire hathaw1;ay;ryG;el;nana republ3s1xt5y5;f,kin robbi1;ns;ic;bWcRdidQerosmith,ig,lKmEnheuser-busDol,pple9r6s3t&t,v2y1;er;is,on;hland1sociated F; o1;il;by4g2m1;co;os; compu2bee1;'s;te1;rs;ch;c,d,erican3t1;!r1;ak; ex1;pre1;ss; 4catel2t1;air;!-luce1;nt;jazeera,qae1;da;as;/dc,a3er,t1;ivisi1;on;demy of scienc0;es;ba,c",
    "Honorific": "true¦aPbrigadiOcHdGexcellency,fiBjudge,king,liDmaAofficOp6queen,r3s0taoiseach,vice5;e0ultK;c0rgeaC;ond liAretary;abbi,e0;ar0verend; adK;astGr0;eside6i0ofessF;me ministFnce0;!ss;gistrate,r4yC;eld mar3rst l0;ady,i0;eutena0;nt;shB;oct6utchess;aptain,hance4o0;lonel,mmand5ngress1un0;ci2t;m0wom0;an;ll0;or;er;d0yatullah;mir0;al",
    "Person": "true¦ashton kutchRbQcLdJeHgastMhFinez,jDkCleBmAnettIoprah winfrPp8r4s3t2v0;a0irgin maF;lentino rossi,n go3;heresa may,iger woods,yra banks;addam hussain,carlett johanssIlobodan milosevic,uA;ay romano,eese witherspoHo1ush limbau0;gh;d stewart,nald0;inho,o;a0ipI;lmHris hiltC;essiaen,itt romnEubarek;bron james,e;anye west,iefer sutherland,obe bryant;aime,effers8k rowli0;ng;alle ber0itlBulk hogan;ry;ff0meril lagasse,zekiel;ie;a0enzel washingt2ick wolf;lt1nte;ar1lint0ruz;on;dinal wols1son0;! palm2;ey;arack obama,rock;er",
    "Country": "true¦0:37;1:2U;a2Rb2Ac1Zd1We1Sf1Rg1Hh1Ci12jama35k0Xl0Qm0En07o06pYrQsEt7u5v3wallis et futu1xiānggǎng costa sud della ci1z2éi0Kís1Fösterreich;a22imbabwe;a2enezue30iệt nam;nuatu,ticanæ;gNkraji1n2ru01zbe0X;gher0ited states virgin islands;a7hailand0i6o5u2;nis0Nr2valu;ch0k2;meni31s e caic2G;go,ke2Snga;bet,mor est;gi0Piw2Znz2V;aBeAi8lov7oomaali0Mpag1ri lan10tat5u2vez0wazi12ão tomé e príncipe,ām2J;da3omi,ri2;name,yah0V;fr2Pn kusini;i 2o di pales2D;baltici,uni16;ac1Nen0;erra leo15ngap2;oZu2I;negQrb0ychelles;ha2Gint 2kartweDmoa0Jn mari0O;kitts and nevis,luc0vincent e grenadi11;e3om2Iu2;an29;gno uni13pubblica 2;centrafr5d2;e2ominicana república domin4;l2mocratica del2; conW;ica1;a7e6ilipin1To2uerto riL;l3rtogal2;lo;inesia2onia pols0D;! francese;nisola ib22rù;ki27nama,pua nuova guinea,ra2;guay;ceano india06m26;a7e5i3o2;rveg0uvelle calédonie;caragua,ger2;!ia;der05p2;al;mib0ur19;a6ela1Ai19o2yanm0L;ldova,n2zambi4çamb8;a3gol0t2;eneg0Pserr11;co;c7dagasc0Gl5rtinica martin4urit3yotte como2;re;an0i0R;ique;a2dive,i,ta;wi,ys0;au,ed8;a10e6i3ussembur2;go;b2echtenste0S;aJer0iyah2; nordafr1C;sotho,tt2;on0;a4en3ir2osovo,uwait;ghizi1DibaR;ya;laallit nuna0Iza2;ki1A;ndonesia un,ra8s2;ol2raele;a di natale christm0Ne 2;c4falkBmar3vergini2; americaK;ianJshall;aym14ook;k,n (persia) īrān2; vici2;no;a5o3rvats2;ka;l2ndur0D;land;i9ya0V;aAha1i7olfo di guinea e,re6u2;a4in3yan2;a,e;ea,é bissau;dalu9m,tema0I;c0na0E;appo3bu2ordania al urdunn;ti;ne;bKmb0;igi,ranc0øroy8;cu4esti vabariik,git3l salv4mirati arabi,tiop0uro2;pa;to;ador;a2omin0A;nmark,wlat qat2;ar;a9e8i6o2uV;lo4morQrea3sta 2;d'avorio,r05;! del nord;mb0;ad,le,na,p2;ro;ch0;m2naTpo verU;bog0erun camero2;on;aFe9h7irmYo6r5u3yelar2;us;lgar0r2;kina faso,undi;asile brasil,unei;liv0snia ed erzegovi1tswa1;utWār2;at;l3n2rmuI;in;a2gium,ize;u mi2;cro2;nes0;ham3ngladesh,rbad2;os;as;fghaneKlGmEn7otear6r2s sudLustral0zerbaigiL;abia saudita,gen3u2;ba;ti1;na;oa;dor7g5t2;arti3igua and barbu2;da;de;o2uil2;la;ra;er2;ica; 4b2;an0;ia;bahrayn,jaza'ir,maghrib,yam3;st2;an",
    "Region": "true¦a20b1Sc1Id1Des1Cf19g13h10i0Yj0Wk0Ul0Rm0GnZoXpSqPrMsDtAut9v5w2y0zacatec22;o05u0;cat18kZ;a0est vir4isconsin,yomi14;rwick1Qshington0;! dc;er2i0;ctor1Sr0;gin1R;acruz,mont;ah,tar pradesh;a1e0laxca1Cusca9;nnessee,x1Q;bas0Kmaulip1PsmI;a5i3o1taf0Nu0ylh12;ffUrr00s0X;me0Zuth 0;cRdQ;ber1Hc0naloa;hu0Rily;n1skatchew0Qxo0;ny; luis potosi,ta catari1H;a0hode6;j0ngp02;asth0Lshahi;inghai,u0;e0intana roo;bec,ensWreta0D;ara3e1rince edward0; isU;i,nnsylv0rnambu02;an13;!na;axa0Mdisha,h0klaho1Antar0reg3x03;io;ayarit,eAo2u0;evo le0nav0K;on;r0tt0Qva scot0W;f5mandy,th0; 0ampton0P;c2d1yo0;rk0N;ako0X;aroli0U;olk;bras0Wva00w0; 1foundland0;! and labrador;brunswick,hamp0Gjers1mexiJyork0;! state;ey;a5i1o0;nta0Lrelos;ch2dlanAn1ss0;issippi,ouri;as geraEneso0K;igOoacO;dhya,harasht02ine,ni2r0ssachusetts;anhao,y0;land;p0toba;ur;anca02e0incoln02ouisia0B;e0iF;ds;a0entucky,hul08;ns06rnata0Bshmir;alis0iangxi;co;daho,llino0owa;is;a1ert0idalDun9;fordS;mpRwaii;ansu,eorgVlou4u0;an1erre0izhou,jarat;ro;ajuato,gdo0;ng;cesterL;lori1uji0;an;da;sex;e3o1uran0;go;rs0;et;lawaDrbyC;a7ea6hi5o0umbrG;ahui3l2nnectic1rsi0ventry;ca;ut;iLorado;la;apDhuahua;ra;l7m0;bridge2peche;a4r3uck0;ingham0;shi0;re;emen,itish columb2;h1ja cal0sque,var1;iforn0;ia;guascalientes,l3r0;izo1kans0;as;na;a1ber0;ta;ba1s0;ka;ma",
    "City": "true¦0:5V;1:5N;2:52;3:5B;a5Cb47c3Pd3Ee3Cf39g2Xh2Qi2Mjak32k27l1Vm1Cn12o10p0Jqui1Qr0CsXtJuIvDw9y6z4;ag4uri3Z;abr1reb;a5e4okoha3F;katerin2Wr39;moussouk41ng3Ioundé;ars15e6i4rocl15;ckl21n4;dho4Jnipeg,terth23;llingt3Exford;a6i4;en4lni5P;na,tia3;duz,lenc1ncouv1Fr4;na,sav1;lan bat1Atrecht;aEbilisi,eChAi9o8r7u4;nis5r4;in,ku;!i;ipo2Zondheim;kyo,ron15ulouse;anj05l2Emisoa58ra4K;e4imphu; hague,ssaloni26;gucigalpa,h4l av1T;er0r0;i5llinn,mpe4Kngi11r4shk2C;awa s0Etu;chu48n0p0F;a8e7h6kopje,of1ri jayawardenapura kot0Tt4u3Uydn0Bão tomé;oc4uttga2G;col2Mkholm;angh36enzh40;oul,ul,v3O;int Bl9n4ppo37raje4M; 6a'a,t4;iago4o domin31;! del ci3L;jos4salv6;e,é;v4z1V;ad0J;george4john4peters1T;'s;a9eykjav8i7o4;m5s4t4D;ar07e3H;a,e;ad,ga,o de janei2T;ik,ík;b43mallah;aGeEhDiCo7r4ueb2yongya3L;a4etor1;g4ia;a,ue;dgori24rt4zn0; 5-au-prin0Po4;!-no3Z;elizabe8louis,moresby,of spa4vi2;in;ls38rae4B;iladelph1nom pe12oenix;chi27r4tah tik2X;th;l6r4tr2H;amari21i4;gi,s;ermo,ik0R;des0Is4ttawa,uagadoug12;a3Blo;'djame37aBew 8gerulm7i5ouakchott,u4;ova d9r-sult0;am4cos1;ey;ud;d5taip4;ei;el0F;goya,iro3Qnt28pl28ss2Lv0ypyid4;aw;aCba29eBiAo5u4;mb1Tni1Q;gadisc7n5roni,sc4;a,ow;rov1t4;evideo,real;io;l0n0Qskolc;dellín,lbour3;drid,ju1OlCn9pu8r6s4;ca4eru;te;ib4se21;or;to;a5chest4dal0Ki2;er;gua,ma;a14mo,é;'ava2EaBi7o5u4vQy0V;anJbia2Dsa2G;mé,nd4s angel1L;on,ra;brev1Qege,longwe,ma5nz,sbon4verpo6;!a;!ss4;ol; 4usan3;p5v4;allet0Rel2;az,la0Q;aFharDi9laipe8o5rak4uala lump7;ow;be,pavog5si4;ce;ur;da;ev,ga09n4;gsto5sha4;sa;n,wn;k4tum;iv;b9mpa2ndy,ohsiu1Lra4tmandu,un0U;c4j;hi;l cai0Nnche04s5̇zm4;ir;lam26tanb4;ul;a8e6o4; chi mi4ms,nia26ustZ;nh;lsin4rakliX;ki;ifa,m4noi,ra1Jva1E;bu28iltU;aDdanCeAh9i7othen6raz,ua4;dalaja1Zngzh4;ou;bu24;ac4tega,u1Vza;arU;ent;n4or0Irusalemme ov0B;e0Moa,ève;sk;boro3lw4;ay;es,r4unafuti;ankfu4ee0D;rt;dmontEindhov0Or4;ev0;a9ha0Yi8o6u4;bl0Jrb0sh4š4;anbe;do4ha;ma;li;c7e5kar,masc4ugavpiZ;o,us;gu,je4;on;ca;aIebu,hDittà dAo4raio02uriti17;lo7n5pen4rk;agh09hag09;akGstan4;ta;g3m4;bo;el 4i san mari5;guatema2messico,vatica4;no;enn7i5ristchur4;ch;ang m5ca4ttago03șinău;go;ai;i5lga4nber0Tpe Jrac9striE;ry;ro;aYePiMogotLr9u4;c6dap7enos airAr4s0;g4sa;as;ar4har4;est;aBi7u4;sse5xell4;es;ls;d5s4;ba3;ge4;town;sil1tisla6zzav4;il4;le;va;a,à;rmingh01ss5šk4;ek;au;iAl8r4;g6l4n;in4;!o;en;grad4mop0;e,o;ji4rut;ng;ghdTku,mako,n8r5s4;el,seterB;celo5ranquil2;la;na;dar seri begaw0g6j4;a lu4ul;ka;alo4kok,ui;re;aQbMccLddis abeKhmedIlGmDnAp1qaKs6t4uckland,şg8;e3hens;ne;h4maIunción;dod,g4;ab4;at;kaEt4;ananari4werp;vo;m0s4;terd4;am; kuwait,exandr1geri,maty;ia;ab4;ad;ba;ra;idj0u4; dha4ja;bi;an;lbo5rh4;us;rg",
    "Place": "true¦aGbEcCdBeurope,fco,gAh9i8jfk,kul,l6m4ord,p2s1the 0upDyyz;bronx,hamptons;fo,oho,underland,yd;ek,h0;l,x;a0co,id8uc;libu,nhattan;a0gw,hr;s,x;ax,cn,st;arlem,kg,nd;ay village,reenwich;en,fw,own1xb;dg,gk,hina0lt;town;cn,e0kk,rooklyn;l air,verly hills;frica,m0sia,tl;erica0s; 0s;centr0meridion0;ale",
    "FirstName": "true¦aEblair,cCdevBj8k6lashawn,m3nelly,quinn,re2sh0;ay,e0iloh;a,lby;g1ne;ar1el,org0;an;ion,lo;as8e0r9;ls7nyatta,rry;am0ess1ude;ie,m0;ie;an,on;as0heyenne;ey,sidy;lex1ndra,ubr0;ey;is",
    "LastName": "true¦0:31;1:38;2:36;3:2V;4:2C;a37b2Xc2Kd2Be28f22g1Wh1Mi1Hj1Bk14l0Wm0Ln0Ho0Ep04rXsLtGvEwBxAy7zh5;a5ou,u;ng,o;a5eun2Qoshi1Hun;ma5ng;da,guc1Wmo24sh1YzaQ;iao,u;a6eb0il5o3right,u;li37s2;gn0lk0ng,tanabe;a5ivaldi;ssilj33zqu1;a8h7i2Co6r5sui,urn0;an,ynisI;lst0Mrr1Rth;at1Romps2;kah0Snaka,ylor;aDchCeBhimizu,iAmi9o8t6u5zabo;ar1lliv26zuD;a5ein0;l1Zrm0;sa,u3;rn4th;lva,mmo20ngh;mjon4rrano;midt,neid0ulz;ito,n6sa5to;ki;ch1dJtos,z;amAeag1Vi8o6u5;bio,iz;b5dri1JgGj0Qme20osevelt,ux;erts,ins2;c5ve0C;ci,hards2;ir1os;aCe8h6ic5ow1W;asso,hl0;a5illips;m,n1Q;ders1Xet7r6t5;e0Lr4;ez,ry;ers;h1Yrk0t5vl4;el,te0H;baAg09liveiZr5;t5w1L;ega,iz;a5eils2guy1Oix2owak,ym1B;gy,ka5var1H;ji5muU;ma;aDeBiAo7u5;ll0n5rr09ssolini,ñ5;oz;lina,oIr5zart;al0Ke5r0S;au,no;hhail4ll0;rci0ssi5y0;!er;eUmmad4r5tsu05;in,tin1;aBe7i5op1uo;n5u;coln,dholm;fe6n0Or5w0I;oy;bv5v5;re;mmy,rs12u;aAennedy,imu9le0Jo7u6wo5;k,n;mar,znets4;bay5vacs;asX;ra;hn,rl8to,ur,zl4;a9en8ha3imen1o5u3;h5nXu3;an5ns2;ss2;ki0Cs0Q;cks2nsse0B;glesi8ke7noue,shik6to,vano5;u,v;awa;da;as;aAe7itchcock,o6u5;!a3b0ghMynh;a3ffmann,rvat;mingw6nde5rM;rs2;ay;ns0DrrPs6y5;asCes;an4hi5;moI;a8il,o7r6u5;o,tierr1;ayli3ub0;m1nzal1;nd5o,rcia;hi;er9is8lor7o6uj5;ita;st0urni0;es;ch0;nand1;d6insteFsposi5vaJ;to;is2wards;aAelgado,i8omin7u5;bo5rand;is;gu1;az,mitr4;ov;nkula,rw6vi5;es,s;in;aEhAlark9o5;hKl5op0rbyn,x;em6li5;ns;an;!e;an7e6iu,o5ristensFu3we;i,ng,u3w,y;n,on5u3;!g;mpb6rt0st5;ro;ell;aAe7ha3lanco,oyko,r5yrne;ooks,yant;ng;ck6ethov5nnett;en;er,ham;ch,h7iley,rn5;es,i0;er;k,ng;dCl8nd5;ers5r9;en,on,s2;on;eks6iy7var1;ez;ej5;ev;ams",
    "MaleName": "true¦0:CA;1:BH;2:BY;3:BP;4:B1;5:BV;6:AP;7:9R;8:B9;9:AT;A:AK;aB0bA4c93d83e7Cf6Vg6Dh5Ti5Fj4Ik48l3Om2Nn2Co27p21qu1Zr19s0Pt05u04v00wNxavi3yGzB;aBor0;cBh8Ene;hCkB;!aAX;ar4YeAW;ass2i,oCuB;sDu23;nEsDusB;oBsC;uf;ef;at0g;aJeHiCoByaAL;lfgang,odrow;lBn1N;bDey,frBFlB;aA1iB;am,e,s;e85ur;i,nde7sB;!l6t1;de,lCrr5yB;l1ne;lBt3;a8Zy;aDern1iB;cBha0nce8Srg97va0;ente,t58;lentin47n8Vughn;lyss4Ksm0;aTeOhKiIoErCyB;!l3ro8s1;av9NeBist0oy,um0;nt9Fv52y;bDd7UmBny;!as,mBoharu;aAVie,y;i80y;mBt9;!my,othy;adDeoCia7AomB;!as;!do7J;!de9;dErB;en8ErB;an8DeBy;ll,n8C;!dy;dgh,ic9Qnn3req,ts43;aRcotPeNhJiHoFpenc3tBur1Mylve8Ezym1;anDeBua78;f0phACvBwa77;e55ie;!islaw,l6;lom1nA0uB;leyma8ta;dBl7Gm1;!n6;aDeB;lBrm0;d1t1;h6Pne,qu0Tun,wn,y8;aBbasti0k1Vl3Zrg3Yth,ymo9F;m9n;!tB;!ie,y;lCmBnti1Zq4Gul;!mAu4;ik,vato6S;aWeShe8ZiOoFuCyB;an,ou;b6IdCf9pe6NssB;!elAF;ol2Sy;an,bIcHdGel,geFh0landA6mEnDry,sCyB;!ce;coe,s;!a92nA;an,eo;l3Hr;e4Og3n6olfo,ri65;co,ky;bAe9R;cBl6;ar5Lc5KhCkB;!ey,ie,y;a82ie;gCid,ub5x,yBza;ansh,nR;g8TiB;na8Ps;ch5Vfa4lDmCndBpha4sh6Rul,ymo6X;al9Vol29y;i9Fon;f,ph;ent2inB;cy,t1;aFeDhilCier5Zol,reB;st1;!ip,lip;d98rcy,tB;ar,e2T;b3Qdra6Co3Qt42ul;ctav2Tliv3m93rEsBt7Num8Rw5;aCc8QvB;al50;ma;i,l48vJ;athJeHiDoB;aBel,l0ma0r2W;h,m;cCg4i3HkB;h6Sola;hol5VkBol5V;!ol5U;al,d,il,ls1vB;il4Y;anBy;!a4i4;aVeSiJoFuCyB;l20r1;hamCr5XstaB;fa,p4E;ed,mE;dibo,e,hamCis1Wnty,sBussa;es,he;ad,ed,mB;ad,ed;cGgu4kElDnCtchB;!e7;a77ik;house,o03t1;e,olB;aj;ah,hBk6;a4eB;al,l;hClv2rB;le,ri7v2;di,met;ck,hNlLmOnu4rHs1tDuricCxB;!imilian8Bwe7;e,io;eo,hCi51tB;!eo,hew,ia;eBis;us,w;cDio,k85lCqu6Fsha7tBv2;i2Hy;in,on;!el,oKus;achBcolm,ik;ai,y;amBdi,moud;adB;ou;aReNiMlo2RoIuCyB;le,nd1;cEiDkBth3;aBe;!s;gi,s;as,iaB;no;g0nn6QrenDuBwe7;!iB;e,s;!zo;am,on4;a7Aevi,la4RnDoBst3vi;!nB;!a5Zel;!ny;mCnBr66ur4Swr4S;ce,d1;ar,o4M;aIeDhaled,iBrist4Uu47y3A;er0p,rB;by,k,ollos;en0iEnBrmit,v2;!dCnBt5B;e0Yy;a7ri4M;r,th;na67rBthem;im,l;aYeQiOoDuB;an,liBst2;an,o,us;aqu2eJhnInGrEsB;eChBi7Aue;!ua;!ph;dBge;an,i,on;!aBny;h,s,th4W;!ath4Vie,nA;!l,sBy;ph;an,e,mB;!mA;d,ffGrDsB;sBus;!e;a5IemCmai8oBry;me,ni0O;i6Ty;!e57rB;ey,y;cHd5kGmFrDsCvi3yB;!d5s1;on,p3;ed,od,rBv4L;e4Yod;al,es,is1;e,ob,ub;k,ob,quB;es;aNbrahMchika,gKkeJlija,nuIrGsDtBv0;ai,sB;uki;aBha0i6Ema4sac;ac,iaB;h,s;a,vinBw2;!g;k,nngu51;!r;nacBor;io;im;in,n;aJeFina4UoDuByd55;be24gBmber4BsD;h,o;m3ra32sBwa3W;se2;aDctCitCn4DrB;be1Zm0;or;th;bKlJmza,nIo,rDsCyB;a42d5;an,s0;lEo4ErDuBv6;hi3Zki,tB;a,o;is1y;an,ey;k,s;!im;ib;aQeMiLlenKoIrEuB;illerCsB;!tavo;mo;aDegBov3;!g,orB;io,y;dy,h56nt;nzaBrd1;lo;!n;lbe4Pno,ovan4Q;ne,oDrB;aBry;ld,rd4T;ffr6rge;bri4l5rBv2;la1Yr3Dth,y;aQeNiLlJorr0HrB;anDedBitz;!dAeBri23;ri22;cDkB;!ie,lB;in,yn;esco,isB;!co,zek;etch3oB;yd;d4lBonn;ip;liCng,rnB;an00;pe,x;bi0di;arZdUfrTit0lNmGnFo2rCsteb0th0uge8vBym5zra;an,ere2V;gi,iCnBrol,v2w2;est45ie;c07k;och,rique,zo;aGerFiCmB;aFe2P;lCrB;!h0;!io;s1y;nu4;be09d1iEliDmCt1viBwood;n,s;er,o;ot1Ts;!as,j43sB;ha;a2en;dAg32mEuCwB;a25in;arB;do;o0Su0S;l,nB;est;aYeOiLoErDuCwByl0;ay8ight;a8dl6nc0st2;ag0ew;minFnDri0ugCyB;le;!l03;!a29nBov0;e7ie,y;go,icB;!k;armuCeBll1on,rk;go;id;anIj0lbeHmetri9nFon,rEsDvCwBxt3;ay8ey;en,in;hawn,mo08;ek,ri0F;is,nBv3;is,y;rt;!dB;re;lKmInHrDvB;e,iB;!d;en,iDne7rByl;eBin,yl;l2Vn;n,o,us;!e,i4ny;iBon;an,en,on;e,lB;as;a06e04hWiar0lLoGrEuCyrB;il,us;rtB;!is;aBistobal;ig;dy,lEnCrB;ey,neli9y;or,rB;ad;by,e,in,l2t1;aGeDiByI;fBnt;fo0Ct1;meCt9velaB;nd;nt;rDuCyB;!t1;de;enB;ce;aFeErisCuB;ck;!tB;i0oph3;st3;d,rlBs;eBie;s,y;cBdric,s11;il;lEmer1rB;ey,lCro7y;ll;!os,t1;eb,v2;ar02eUilTlaSoPrCuByr1;ddy,rtI;aJeEiDuCyB;an,ce,on;ce,no;an,ce;nCtB;!t;dCtB;!on;an,on;dCndB;en,on;!foBl6y;rd;bCrByd;is;!by;i8ke;al,lA;nFrBshoi;at,nCtB;!r10;aBie;rd0S;edict,iCjam2nA;ie,y;to;n6rBt;eBy;tt;ey;ar0Xb0Nd0Jgust2hm0Gid5ja0ElZmXnPputsiOrFsaEuCveBya0ziz;ry;gust9st2;us;hi;aIchHi4jun,maFnDon,tBy0;hBu06;ur;av,oB;ld;an,nd0A;el;ie;ta;aq;dGgel05tB;hoEoB;i8nB;!i02y;ne;ny;reBy;!as,s,w;ir,mBos;ar;an,beOd5eIfFi,lEonDphonHt1vB;aMin;on;so,zo;an,en;onCrB;edP;so;c,jaEksandDssaExB;!and3;er;ar,er;ndB;ro;rtH;ni;en;ad,eB;d,t;in;aColfBri0vik;!o;mBn;!a;dFeEraCuB;!bakr,lfazl;hBm;am;!l;allEel,oulaye,ulB;!lCrahm0;an;ah,o;ah;av,on",
    "FemaleName": "true¦0:FV;1:FZ;2:FO;3:FA;4:F9;5:FP;6:EO;7:GC;8:EW;9:EM;A:G8;B:E2;C:G5;D:FL;E:FI;F:ED;aDZbD2cB7dAHe9Ff8Zg8Fh81i7Rj6Tk5Zl4Nm36n2Ro2Op2Dqu2Cr1Ms0Pt03ursu6vUwOyLzG;aJeHoG;e,la,ra;lGna;da,ma;da,ra;as7DeHol1RvG;et9onB8;le0sen3;an8endBMhiB3iG;lInG;if38niGo0;e,f37;a,helmi0lGma;a,ow;aLeIiG;ckCZviG;an9WenFY;da,l8Vnus,rG;nGoni8M;a,iDA;leGnesEA;nDJrG;i1y;aSePhNiMoJrGu6y4;acG1iGu0E;c3na,sG;h9Mta;nHrG;a,i;i9Jya;a5IffaCFna,s5;al3eGomasi0;a,l8Go6Xres1;g7To6WrHssG;!a,ie;eFi,ri7;bNliMmKnIrHs5tGwa0;ia0um;a,yn;iGya;a,ka,s5;a4e4iGmC9ra;!ka;a,t5;at5it5;a04carlet2Yel6NhUiSkye,oQtMuHyG;bFHlvi1;sHzG;an2Tet9ie,y;anGi7;!a,e,nG;aEe;aIeG;fGla,phG;an2;cF6r6;nGphi1;d4ia,ja,ya;er4lv3mon1nGobh74;dy;aKeGirlBKo0y6;ba,e0i6lIrG;iGrBOyl;!d6Z;ia,lBT;ki4nIrHu0w0yG;la,na;i,leAon,ron;a,da,ia,nGon;a,on;bMdLi8lKmIndHrGs5vannaE;aEi0;ra,y;aGi4;nt5ra;lBMome;e,ie;in1ri0;a02eXhViToHuG;by,thBJ;bQcPlOnNsHwe0xG;an95ie,y;aHeGie,lC;ann7ll1marBEtB;lGnn1;iGyn;e,nG;a,d7X;da,i,na;an8;hel54io;bin,erByn;a,cGkki,na,ta;helBYki;ea,iannDWoG;da,n12;an0bIgi0i0nGta,y0;aGee;!e,ta;a,eG;c6CkaE;chGe,i0mo0n5EquCCvDy0;aCBelGi8;!e,le;een2ia0;aMeLhJoIrG;iGudenAV;scil1Vyamva8;lly,rt3;ilome0oebe,ylG;is,lis;arl,ggy,nelope,r6t4;ige,m0Fn4Po6rvaBAtHulG;a,et9in1;ricGsy,tA8;a,e,ia;ctav3deHfAVlGphAV;a,ga,iv3;l3t9;aQePiJoGy6;eHrG;aEeDma;ll1mi;aKcIkGla,na,s5ta;iGki;!ta;hoB1k8ColG;a,eBG;!mh;ll2na,risF;dIi5QnHo24taG;li1s5;cy,et9;eAiCN;a01ckenz2eViLoIrignayani,uriBFyG;a,rG;a,na,tAR;i4ll9WnG;a,iG;ca,ka,qB3;chOkaNlJmi,nIrGtzi;aGiam;!n8;a,dy,erva,h,n2;a,dIi54lG;iGy;cent,e;red;!e6;ae6el3H;ag4KgKi,lHrG;edi62isFyl;an2iGliF;nGsAL;a,da;!an,han;b09c9Dd07e,g05i04l02n00rKtJuHv6Tx87yGz2;a,bell,ra;de,rG;a,eD;h76il8t2;a,cTgPiKjor2lJn2s5tIyG;!aGbe5RjaAlou;m,n9R;a,ha,i0;a,en1;!aIbAJeHja,lCna,sGt53;!a,ol,sa;!l06;!h,m,nG;!a,e,n1;arIeHie,oGr3Jueri9;!t;!ry;et3HiB;elGi61y;a,l1;dGon,ue6;akranBy;iGlo35;a,ka,n8;a,re,s2;daGg2;!l5X;alCd2elGge,isBEon0;eiAin1yn;el,le;a0Ie08iWoQuKyG;d3la,nG;!a,dHe9QnGsAO;!a,e9P;a,sAM;aAZcJelIiFlHpGz;e,iB;a,u;a,la;iGy;a2Ae,l25n8;is,l1GrHtt2uG;el6is1;aIeHi7na,rG;a6Yi7;lei,n1tB;!in1;aQbPd3lLnIsHv3zG;!a,be4Ket9z2;a,et9;a,dG;a,sGy;ay,ey,i,y;a,iaIlG;iGy;a8Ee;!n4F;b7Rerty;!n5R;aNda,e0iLla,nKoIslAPtGx2;iGt2;c3t3;la,nGra;a,ie,o4;a,or1;a,gh,laG;!ni;!h,nG;a,d4e,n4N;cNdon7Qi6kes5na,rMtKurIvHxGy6;mi;ern1in3;a,eGie,yn;l,n;as5is5oG;nya,ya;a,isF;ey,ie,y;aZeUhadija,iMoLrIyG;lGra;a,ee,ie;istGy5B;a,en,iGy;!e,n48;ri,urtn98;aMerLl97mIrGzzy;a,stG;en,in;!berlG;eGi,y;e,y;a,stD;!na,ra;el6NiJlInHrG;a,i,ri;d4na;ey,i,l9Os2y;ra,s5;c8Ui5WlOma6nyakumari,rMss5KtJviByG;!e,lG;a,eG;e,i76;a5DeHhGi3PlCri0y;ar5Ber5Bie,leDr9Dy;!lyn71;a,en,iGl4Uyn;!ma,n31sF;ei70i,l2;a04eVilToMuG;anKdJliGst55;aHeGsF;!nAt0V;!n8V;i2Ry;a,iB;!anLcelCd5Uel6Zhan6GlJni,sHva0yG;a,ce;eGie;fi0lCph4W;eGie;en,n1;!a,e,n36;!i0ZlG;!i0Y;anLle0nIrHsG;i1Asi1A;i,ri;!a,el6Nif1RnG;a,et9iGy;!e,f1P;a,e70iHnG;a,e6ZiG;e,n1;cLd1mi,nHqueliAsmin2Uvie4yAzG;min7;a7eHiG;ce,e,n1s;!lGsFt05;e,le;inHk2lCquelG;in1yn;da,ta;da,lOmNnMo0rLsHvaG;!na;aHiGob6S;do4;!belGdo4;!a,e,l2G;en1i0ma;a,di4es,gr5P;el8og2H;a,eAia0o0se;aNeKilHoGyacin1O;ll2rten1I;aHdGlaH;a,egard;ry;ath0XiHlGnrietBrmiAst0X;en25ga;di;il74lKnJrGtt2yl74z6C;iGmo4Fri4G;etG;!te;aEnaE;ey,l2;aYeTiOlMold13rIwG;enGyne19;!dolC;acHetGisel8;a,chD;e,ieG;!la;adys,enGor3yn1Z;a,da,na;aJgi,lHna,ov70selG;a,e,le;da,liG;an;!n0;mZnIorgHrG;ald35i,m2Ttru72;et9i5S;a,eGna;s1Ovieve;briel3Fil,le,rnet,yle;aSePio0loNrG;anHe8iG;da,e8;!cG;esIiGoi0H;n1sG;ca;!ca;!rG;a,en41;lHrnG;!an8;ec3ic3;rHtiGy7;ma;ah,rah;d0FileDkBl00mUn48rRsMtLuKvG;aIelHiG;e,ta;in0Ayn;!ngel2G;geni1la,ni3P;h50ta;meral8peranJtG;eHhGrel6;er;l2Or;za;iGma,nest28yn;cGka,n;a,ka;eJilImG;aGie,y;!liA;ee,i1y;lGrald;da,y;aTeRiMlLma,no4oJsIvG;a,iG;na,ra;a,ie;iGuiG;se;en,ie,y;a0c3da,nJsGzaH;aGe;!beG;th;!a,or;anor,nG;!a;in1na;en,iGna,wi0;e,th;aWeKiJoGul2S;lor4Zminiq3Wna,rGtt2;a,eDis,la,othGthy;ea,y;an09naEonAx2;anPbOde,eNiLja,lImetr3nGsir4S;a,iG;ce,se;a,iHorGphiA;es,is;a,l5H;dGrdG;re;!d4Kna;!b2AoraEra;a,d4nG;!a,e;hl3i0mMnKphn1rHvi1VyG;le,na;a,by,cHia,lG;en1;ey,ie;a,et9iG;!ca,el19ka;arGia;is;a0Pe0Mh04i02lUoJrHynG;di,th3;istGy04;al,i0;lOnLrHurG;tn1C;aId26iGn26riA;!nG;a,e,n1;!l1Q;n2sG;tanGuelo;ce,za;eGleD;en,t9;aIeoHotG;il49;!pat4;ir7rIudG;et9iG;a,ne;a,e,iG;ce,sX;a4er4ndG;i,y;aPeMloe,rG;isHyG;stal;sy,tG;aHen,iGy;!an1e,n1;!l;lseHrG;!i7yl;a,y;nLrG;isJlHmG;aiA;a,eGot9;n1t9;!sa;d4el1NtG;al,el1M;cGli3E;el3ilG;e,ia,y;iYlXmilWndVrNsLtGy6;aJeIhGri0;erGleDrCy;in1;ri0;li0ri0;a2FsG;a2Eie;iMlKmeIolHrG;ie,ol;!e,in1yn;lGn;!a,la;a,eGie,y;ne,y;na,sF;a0Ci0C;a,e,l1;isBl2;tlG;in,yn;arb0BeXlVoTrG;andRePiIoHyG;an0nn;nwCok7;an2MdgKg0HtG;n26tG;!aHnG;ey,i,y;ny;etG;!t7;an0e,nG;da,na;i7y;bbi7nG;iBn2;ancGossom,ythe;a,he;aRcky,lin8niBrNssMtIulaEvG;!erlG;ey,y;hHsy,tG;e,i0Zy7;!anG;ie,y;!ie;nGt5yl;adHiG;ce;et9iA;!triG;ce,z;a4ie,ra;aliy29b24d1Lg1Hi19l0Sm0Nn01rWsNthe0uJvIyG;anGes5;a,na;a,r25;drIgusHrG;el3;ti0;a,ey,i,y;hHtrG;id;aKlGt1P;eHi7yG;!n;e,iGy;gh;!nG;ti;iIleHpiB;ta;en,n1t9;an19elG;le;aYdWeUgQiOja,nHtoGya;inet9n3;!aJeHiGmI;e,ka;!mGt9;ar2;!belHliFmT;sa;!le;ka,sGta;a,sa;elGie;a,iG;a,ca,n1qG;ue;!t9;te;je6rea;la;!bHmGstas3;ar3;el;aIberHel3iGy;e,na;!ly;l3n8;da;aTba,eNiKlIma,yG;a,c3sG;a,on,sa;iGys0J;e,s0I;a,cHna,sGza;a,ha,on,sa;e,ia;c3is5jaIna,ssaIxG;aGia;!nd4;nd4;ra;ia;i0nHyG;ah,na;a,is,naE;c5da,leDmLnslKsG;haElG;inGyW;g,n;!h;ey;ee;en;at5g2nG;es;ie;ha;aVdiSelLrG;eIiG;anLenG;a,e,ne;an0;na;aKeJiHyG;nn;a,n1;a,e;!ne;!iG;de;e,lCsG;on;yn;!lG;iAyn;ne;agaJbHiG;!gaI;ey,i7y;!e;il;ah"
  };

  const BASE = 36;
  const seq = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  const cache = seq.split('').reduce(function (h, c, i) {
    h[c] = i;
    return h
  }, {});

  // 0, 1, 2, ..., A, B, C, ..., 00, 01, ... AA, AB, AC, ..., AAA, AAB, ...
  const toAlphaCode = function (n) {
    if (seq[n] !== undefined) {
      return seq[n]
    }
    let places = 1;
    let range = BASE;
    let s = '';
    for (; n >= range; n -= range, places++, range *= BASE) {}
    while (places--) {
      const d = n % BASE;
      s = String.fromCharCode((d < 10 ? 48 : 55) + d) + s;
      n = (n - d) / BASE;
    }
    return s
  };

  const fromAlphaCode = function (s) {
    if (cache[s] !== undefined) {
      return cache[s]
    }
    let n = 0;
    let places = 1;
    let range = BASE;
    let pow = 1;
    for (; places < s.length; n += range, places++, range *= BASE) {}
    for (let i = s.length - 1; i >= 0; i--, pow *= BASE) {
      let d = s.charCodeAt(i) - 48;
      if (d > 10) {
        d -= 7;
      }
      n += d * pow;
    }
    return n
  };

  var encoding = {
    toAlphaCode,
    fromAlphaCode
  };

  const symbols = function (t) {
    //... process these lines
    const reSymbol = new RegExp('([0-9A-Z]+):([0-9A-Z]+)');
    for (let i = 0; i < t.nodes.length; i++) {
      const m = reSymbol.exec(t.nodes[i]);
      if (!m) {
        t.symCount = i;
        break
      }
      t.syms[encoding.fromAlphaCode(m[1])] = encoding.fromAlphaCode(m[2]);
    }
    //remove from main node list
    t.nodes = t.nodes.slice(t.symCount, t.nodes.length);
  };

  // References are either absolute (symbol) or relative (1 - based)
  const indexFromRef = function (trie, ref, index) {
    const dnode = encoding.fromAlphaCode(ref);
    if (dnode < trie.symCount) {
      return trie.syms[dnode]
    }
    return index + dnode + 1 - trie.symCount
  };

  const toArray$1 = function (trie) {
    const all = [];
    const crawl = (index, pref) => {
      let node = trie.nodes[index];
      if (node[0] === '!') {
        all.push(pref);
        node = node.slice(1); //ok, we tried. remove it.
      }
      const matches = node.split(/([A-Z0-9,]+)/g);
      for (let i = 0; i < matches.length; i += 2) {
        const str = matches[i];
        const ref = matches[i + 1];
        if (!str) {
          continue
        }
        const have = pref + str;
        //branch's end
        if (ref === ',' || ref === undefined) {
          all.push(have);
          continue
        }
        const newIndex = indexFromRef(trie, ref, index);
        crawl(newIndex, have);
      }
    };
    crawl(0, '');
    return all
  };

  //PackedTrie - Trie traversal of the Trie packed-string representation.
  const unpack$1 = function (str) {
    const trie = {
      nodes: str.split(';'),
      syms: [],
      symCount: 0
    };
    //process symbols, if they have them
    if (str.match(':')) {
      symbols(trie);
    }
    return toArray$1(trie)
  };

  const unpack = function (str) {
    if (!str) {
      return {}
    }
    //turn the weird string into a key-value object again
    const obj = str.split('|').reduce((h, s) => {
      const arr = s.split('¦');
      h[arr[0]] = arr[1];
      return h
    }, {});
    const all = {};
    Object.keys(obj).forEach(function (cat) {
      const arr = unpack$1(obj[cat]);
      //special case, for botched-boolean
      if (cat === 'true') {
        cat = true;
      }
      for (let i = 0; i < arr.length; i++) {
        const k = arr[i];
        if (all.hasOwnProperty(k) === true) {
          if (Array.isArray(all[k]) === false) {
            all[k] = [all[k], cat];
          } else {
            all[k].push(cat);
          }
        } else {
          all[k] = cat;
        }
      }
    });
    return all
  };

  let misc$1 = {};

  // import models from '../methods/models.js'

  const tagMap = {
    first: 'FirstPerson',
    second: 'SecondPerson',
    third: 'ThirdPerson',
    firstPlural: 'FirstPersonPlural',
    secondPlural: 'SecondPersonPlural',
    thirdPlural: 'ThirdPersonPlural',
  };

  let words = {};

  const addVerbs = function (w) {
    // do present-tense
    let res = verbs$2.toPresent(w);
    Object.keys(res).forEach((k) => {
      if (!words[res[k]]) {
        words[res[k]] = [tagMap[k], 'PresentTense'];
      }
    });
    // past-tense
    res = verbs$2.toPast(w);
    Object.keys(res).forEach((k) => {
      if (!words[res[k]]) {
        words[res[k]] = [tagMap[k], 'PastTense'];
      }
    });
    // future-tense
    res = verbs$2.toFuture(w);
    Object.keys(res).forEach((k) => {
      if (!words[res[k]]) {
        words[res[k]] = [tagMap[k], 'FutureTense'];
      }
    });
    // conditonal
    res = verbs$2.toConditional(w);
    Object.keys(res).forEach((k) => {
      if (!words[res[k]]) {
        words[res[k]] = [tagMap[k], 'ConditionalVerb'];
      }
    });
    // imperfect
    res = verbs$2.toImperfect(w);
    Object.keys(res).forEach((k) => {
      if (!words[res[k]]) {
        words[res[k]] = [tagMap[k], 'ImperfectVerb'];
      }
    });
    // imperfect
    res = verbs$2.toSubjunctive(w);
    Object.keys(res).forEach((k) => {
      if (!words[res[k]]) {
        words[res[k]] = [tagMap[k], 'Subjunctive'];
      }
    });
    // gerunds
    res = verbs$2.toGerund(w);
    words[res] = words[res] || ['Gerund'];
    // participle, in all gender/number agreements - fondato/a/i/e
    res = verbs$2.toPastParticiple(w);
    if (res) {
      words[res] = words[res] || ['PastParticiple'];
      let fem = res.replace(/o$/, 'a');
      let plur = res.replace(/o$/, 'i');
      let femPlur = res.replace(/o$/, 'e');
      words[fem] = words[fem] || ['PastParticiple'];
      words[plur] = words[plur] || ['PastParticiple'];
      words[femPlur] = words[femPlur] || ['PastParticiple'];
    }
    // present participle
    res = verbs$2.toPresentParticiple(w);
    words[res] = words[res] || ['PresentParticiple'];
  };

  // process 'Infinitive' last, so its generated conjugations
  // never shadow words from the curated lists (eg 'pizza')
  let tagList = Object.keys(lexData).sort((a, b) => {
    if (a === 'Infinitive') return 1
    if (b === 'Infinitive') return -1
    return 0
  });
  tagList.forEach((tag) => {
    let wordsObj = unpack(lexData[tag]);
    Object.keys(wordsObj).forEach((w) => {
      // merge, so a word packed under two tags keeps both (eg 'oggi' Date+Noun)
      if (words[w] === undefined) {
        words[w] = tag;
      } else if (typeof words[w] === 'string') {
        words[w] = [words[w], tag];
      } else if (Array.isArray(words[w]) && !words[w].includes(tag)) {
        words[w].push(tag);
      }

      // expand
      if (tag === 'Cardinal') {
        words[w] = ['TextValue', 'Cardinal'];
      }
      if (tag === 'Ordinal') {
        words[w] = ['TextValue', 'Ordinal'];
      }
      if (tag === 'MaleAdjective' || tag === 'Adjective') {
        let adj = adjective.toFemale(w);
        words[adj] = words[adj] || 'FemaleAdjective';
        adj = adjective.toPlural(w);
        words[adj] = words[adj] || 'PluralAdjective';
        adj = adjective.toFemalePlural(w);
        words[adj] = words[adj] || 'FemaleAdjective';
      }
      if (tag === 'FemaleAdjective') {
        let adj = adjective.fromFemale(w);
        words[adj] = words[adj] || 'MaleAdjective';
        adj = adjective.toPlural(w);
        words[adj] = words[adj] || 'PluralAdjective';
      }
      if (tag === 'Infinitive') {
        addVerbs(w);
      }
    });
  });

  // add data from conjugation models
  // Object.keys(models).forEach(tense => {
  //   Object.keys(models[tense]).forEach(form => {
  //     let infs = Object.keys(models[tense][form].ex)
  //     infs.forEach(inf => {
  //       if (!words[inf]) {
  //         words[inf] = 'Infinitive'
  //         addVerbs(inf)
  //         // console.log(inf)
  //       }
  //     })
  //   })
  // })

  words = Object.assign({}, words, misc$1);

  const verbForm = function (term) {
    let want = [
      'FirstPerson',
      'SecondPerson',
      'ThirdPerson',
      'FirstPersonPlural',
      'SecondPersonPlural',
      'ThirdPersonPlural'
    ];
    return want.find((tag) => term.tags.has(tag))
  };

  // for verbs tagged without person info, guess it from the ending
  const guessForm = function (str) {
    if (/iamo$/.test(str)) return 'FirstPersonPlural'
    if (/te$/.test(str)) return 'SecondPersonPlural'
    if (/no$/.test(str)) return 'ThirdPersonPlural'
    if (/o$/.test(str)) return 'FirstPerson'
    if (/i$/.test(str)) return 'SecondPerson'
    return 'ThirdPerson'
  };

  // every irregular conjugated form, mapped back to its infinitive
  const irregularRoots = {};
  Object.keys(irregular.paradigms).forEach((inf) => {
    let p = irregular.paradigms[inf];
    Object.keys(p).forEach((k) => {
      let forms = p[k];
      if (typeof forms === 'string') {
        forms = [forms];
      }
      forms.forEach((w) => {
        if (w && !irregularRoots.hasOwnProperty(w)) {
          irregularRoots[w] = inf;
        }
      });
    });
  });
  // 'sono' belongs to essere, not stare/etc
  irregularRoots['sono'] = 'essere';
  // archaic long infinitive - 'beverlo'
  irregularRoots['bevere'] = 'bere';
  // participles of otherwise-regular verbs
  Object.keys(irregular.participles).forEach((inf) => {
    let pp = irregular.participles[inf];
    if (!irregularRoots.hasOwnProperty(pp)) {
      irregularRoots[pp] = inf;
    }
  });
  Object.keys(irregular.gerunds).forEach((inf) => {
    let ger = irregular.gerunds[inf];
    if (!irregularRoots.hasOwnProperty(ger)) {
      irregularRoots[ger] = inf;
    }
  });

  // turn 'congratularmi' into 'congratular'
  const stripReflexive = function (str) {
    str = str.replace(/ar[mtscv]i$/, 'are');
    str = str.replace(/er[mtscv]i$/, 'ere');
    str = str.replace(/ir[mtscv]i$/, 'ire');
    // pronoun suffixes
    //sentire + "lo" -> "sentirlo"
    str = str.replace(/arl[oaie]$/, 'are');
    str = str.replace(/erl[oaie]$/, 'ere');
    str = str.replace(/irl[oaie]$/, 'ire');

    // -ergli, -argli, -irgli
    str = str.replace(/er(lo|la|le|gli|eci)$/, 'ere');
    str = str.replace(/ar(lo|la|le|gli|eci)$/, 'are');
    str = str.replace(/ir(lo|la|le|gli|eci)$/, 'ire');
    // combined clitics - 'studiarselo', 'andarsene'
    str = str.replace(/([aei])r[mtscv]e(l[oaie]|ne)$/, '$1re');
    // whole infinitive + pronoun - 'scriverele', 'diregli'
    str = str.replace(/(are|ere|ire)(l[oaie]|ne|gli|ci|mi|ti|si|vi)$/, '$1');
    return str
  };

  // 'mangiata' -> 'mangiato', 'prese' -> 'preso'
  const masculineParticiple = function (str) {
    return str.replace(/([ts])[aie]$/, '$1o')
  };

  const root = function (view) {
    const { verb, adjective, noun } = view.world.methods.two.transform;
    view.docs.forEach((terms) => {
      terms.forEach((term) => {
        let str = term.implicit || term.normal || term.text;
        if (term.tags.has('Reflexive')) {
          str = stripReflexive(str);
        }
        // get infinitive form of the verb
        if (term.tags.has('Verb')) {
          let form = verbForm(term) || guessForm(str);
          if (irregularRoots.hasOwnProperty(str)) {
            term.root = irregularRoots[str];
          } else if (term.tags.has('Infinitive')) {
            // an infinitive may carry a pronoun suffix - 'vederlo'
            let inf = stripReflexive(str);
            term.root = irregularRoots.hasOwnProperty(inf) ? irregularRoots[inf] : inf;
          } else if (term.tags.has('Gerund')) {
            term.root = verb.fromGerund(str, form);
          } else if (term.tags.has('ConditionalVerb')) {
            term.root = verb.fromConditional(str, form);
          } else if (term.tags.has('PastParticiple')) {
            let masc = masculineParticiple(str);
            term.root = irregularRoots.hasOwnProperty(masc)
              ? irregularRoots[masc]
              : verb.fromPastParticiple(masc, form);
          } else if (term.tags.has('ImperfectVerb')) {
            term.root = verb.fromImperfect(str, form);
          } else if (term.tags.has('Subjunctive')) {
            term.root = verb.fromSubjunctive(str, form);
          } else if (term.tags.has('PresentTense')) {
            term.root = verb.fromPresent(str, form);
          } else if (term.tags.has('PastTense')) {
            term.root = verb.fromPast(str, form);
          } else if (term.tags.has('FutureTense')) {
            term.root = verb.fromFuture(str, form);
          } else {
            term.root = verb.fromPresent(str, form);
          }
        }

        // nouns -> singular form
        if (term.tags.has('Noun')) {
          if (term.tags.has('PluralNoun')) {
            str = noun.fromPlural(str);
          }
          term.root = str;
        }

        // adjectives -> singular masculine form
        if (term.tags.has('Adjective')) {
          if (term.tags.has('FemaleAdjective') && term.tags.has('PluralAdjective')) {
            str = adjective.fromFemalePlural(str);
          } else if (term.tags.has('PluralAdjective')) {
            str = adjective.fromPlural(str);
          } else if (term.tags.has('FemaleAdjective')) {
            str = adjective.fromFemale(str);
          }
          // str = adjective.toRoot(str)
          term.root = str;
        }
      });
    });
    return view
  };

  var lexicon = {
    methods: {
      two: {
        transform: methods,
      }
    },
    words,
    // model: {
    //   one: {
    //     lexicon: words
    //   }
    // },
    compute: {
      root: root
    }
  };

  const entity = ['Person', 'Place', 'Organization'];

  var nouns$1 = {
    Noun: {
      not: ['Verb', 'Adjective', 'Adverb', 'Value', 'Determiner'],
    },
    Singular: {
      is: 'Noun',
      not: ['PluralNoun'],
    },
    ProperNoun: {
      is: 'Noun',
    },
    Person: {
      is: 'Singular',
      also: ['ProperNoun'],
      not: ['Place', 'Organization', 'Date'],
    },
    FirstName: {
      is: 'Person',
    },
    MaleName: {
      is: 'FirstName',
      not: ['FemaleName', 'LastName'],
    },
    FemaleName: {
      is: 'FirstName',
      not: ['MaleName', 'LastName'],
    },
    LastName: {
      is: 'Person',
      not: ['FirstName'],
    },
    Honorific: {
      is: 'Noun',
      not: ['FirstName', 'LastName', 'Value'],
    },
    Place: {
      is: 'Singular',
      not: ['Person', 'Organization'],
    },
    Country: {
      is: 'Place',
      also: ['ProperNoun'],
      not: ['City'],
    },
    City: {
      is: 'Place',
      also: ['ProperNoun'],
      not: ['Country'],
    },
    Region: {
      is: 'Place',
      also: ['ProperNoun'],
    },
    Address: {
      // is: 'Place',
    },
    Organization: {
      is: 'ProperNoun',
      not: ['Person', 'Place'],
    },
    SportsTeam: {
      is: 'Organization',
    },
    School: {
      is: 'Organization',
    },
    Company: {
      is: 'Organization',
    },
    PluralNoun: {
      is: 'Noun',
      not: ['Singular'],
    },
    Uncountable: {
      is: 'Noun',
    },
    Pronoun: {
      is: 'Noun',
      not: entity,
    },
    Actor: {
      is: 'Noun',
      not: entity,
    },
    Activity: {
      is: 'Noun',
      not: ['Person', 'Place'],
    },
    Unit: {
      is: 'Noun',
      not: entity,
    },
    Demonym: {
      is: 'Noun',
      also: ['ProperNoun'],
      not: entity,
    },
    Possessive: {
      is: 'Noun',
    },
    // german genders
    MaleNoun: {
      is: 'Noun',
      not: ['FemaleNoun'],
    },
    FemaleNoun: {
      is: 'Noun',
      not: ['MaleNoun'],
    },
  };

  var verbs$1 = {
    Verb: {
      not: ['Noun', 'Adjective', 'Adverb', 'Value', 'Expression'],
    },
    PresentTense: {
      is: 'Verb',
      not: ['PastTense'],
    },
    Infinitive: {
      is: 'PresentTense',
      not: ['Gerund'],
    },
    Imperative: {
      is: 'Infinitive',
    },
    Gerund: {
      is: 'PresentTense',
      not: ['Copula'],
    },
    PastTense: {
      is: 'Verb',
      not: ['PresentTense', 'Gerund'],
    },
    Copula: {
      is: 'Verb',
    },
    // applies to both reflexive clitics ('mi', 'si') and
    // reflexive verb-forms ('alzarsi') - so no is:Verb
    Reflexive: {},
    Modal: {
      is: 'Verb',
      not: ['Infinitive'],
    },
    PerfectTense: {
      is: 'Verb',
      not: ['Gerund'],
    },
    Pluperfect: {
      is: 'Verb',
    },
    Participle: {
      is: 'PastTense',
    },
    PhrasalVerb: {
      is: 'Verb',
    },
    Particle: {
      is: 'PhrasalVerb',
      not: ['PastTense', 'PresentTense', 'Copula', 'Gerund'],
    },
    Auxiliary: {
      is: 'Verb',
      not: ['PastTense', 'PresentTense', 'Gerund', 'Conjunction'],
    },

    // french verb forms
    PresentParticiple: {
      is: 'PresentTense',
      not: ['PastTense', 'FutureTense'],
    },
    PastParticiple: {
      is: 'PastTense',
      not: ['PresentTense', 'FutureTense'],
    },
    // [only formal]  parlai, parlâmes
    PastSimple: {
      is: 'PastTense',
      not: ['PresentTense', 'FutureTense'],
    },
    ConditionalVerb: {
      is: 'Verb',
    },
    ImperfectVerb: {
      is: 'Verb',
    },
    Subjunctive: {
      is: 'Verb',
    },
    FutureTense: {
      is: 'Verb',
      not: ['PresentTense', 'PastTense', 'Gerund'],
    },

    // 
    FirstPerson: {
      is: 'Verb',
      not: ['SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
    },
    SecondPerson: {
      is: 'Verb',
      not: ['FirstPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
    },
    ThirdPerson: {
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
    },
    FirstPersonPlural: {
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'SecondPersonPlural', 'ThirdPersonPlural']
    },
    SecondPersonPlural: {
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'ThirdPersonPlural']
    },
    ThirdPersonPlural: {
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural']
    },
  };

  var values = {
    Value: {
      not: ['Verb', 'Adjective', 'Adverb'],
    },
    Ordinal: {
      is: 'Value',
      not: ['Cardinal'],
    },
    Cardinal: {
      is: 'Value',
      not: ['Ordinal'],
    },
    Fraction: {
      is: 'Value',
      not: ['Noun'],
    },
    Multiple: {
      is: 'TextValue',
    },
    RomanNumeral: {
      is: 'Cardinal',
      not: ['TextValue'],
    },
    TextValue: {
      is: 'Value',
      not: ['NumericValue'],
    },
    NumericValue: {
      is: 'Value',
      not: ['TextValue'],
    },
    Money: {
      is: 'Cardinal',
    },
    Percent: {
      is: 'Value',
    },
  };

  var dates = {
    Date: {
      not: ['Verb', 'Adverb', 'Adjective'],
    },
    Month: {
      is: 'Singular',
      also: ['Date'],
      not: ['Year', 'WeekDay', 'Time'],
    },
    WeekDay: {
      is: 'Noun',
      also: ['Date'],
    },
    Year: {
      is: 'Date',
      not: ['RomanNumeral'],
    },
    FinancialQuarter: {
      is: 'Date',
      not: 'Fraction',
    },
    // 'easter'
    Holiday: {
      is: 'Date',
      also: ['Noun'],
    },
    // 'summer'
    Season: {
      is: 'Date',
    },
    Timezone: {
      is: 'Noun',
      also: ['Date'],
      not: ['ProperNoun'],
    },
    Time: {
      is: 'Date',
      not: ['AtMention'],
    },
    // 'months'
    Duration: {
      is: 'Noun',
      also: ['Date'],
    },
  };

  const anything = ['Noun', 'Verb', 'Adjective', 'Adverb', 'Value', 'QuestionWord'];

  var misc = {
    Adjective: {
      not: ['Noun', 'Verb', 'Adverb', 'Value'],
    },
    Comparable: {
      is: 'Adjective',
    },
    Comparative: {
      is: 'Adjective',
    },
    Superlative: {
      is: 'Adjective',
      not: ['Comparative'],
    },
    MaleAdjective: {
      is: 'Adjective',
      not: ['FemaleAdjective'],
    },
    FemaleAdjective: {
      is: 'Adjective',
      not: ['MaleAdjective'],
    },
    PluralAdjective: {
      is: 'Adjective',
    },
    NumberRange: {},
    Adverb: {
      not: ['Noun', 'Verb', 'Adjective', 'Value'],
    },

    Determiner: {
      not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord', 'Conjunction'], //allow 'a' to be a Determiner/Value
    },
    Conjunction: {
      not: anything,
    },
    Preposition: {
      not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord'],
    },
    QuestionWord: {
      not: ['Determiner'],
    },
    Currency: {
      is: 'Noun',
    },
    Expression: {
      not: ['Noun', 'Adjective', 'Verb', 'Adverb'],
    },
    Abbreviation: {},
    Url: {
      not: ['HashTag', 'PhoneNumber', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
    },
    PhoneNumber: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
    },
    HashTag: {},
    AtMention: {
      is: 'Noun',
      not: ['HashTag', 'Email'],
    },
    Emoji: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
    },
    Emoticon: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
    },
    Email: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
    },
    Acronym: {
      not: ['PluralNoun', 'RomanNumeral'],
    },
    Negative: {
      not: ['Noun', 'Adjective', 'Value'],
    },
    Condition: {
      not: ['Verb', 'Adjective', 'Noun', 'Value'],
    },
  };

  let tags = Object.assign({}, nouns$1, verbs$1, values, dates, misc);

  var tagset = {
    tags
  };

  const hasApostrophe = /['‘’‛‵′`´]/;

  // normal regexes
  const doRegs = function (str, regs) {
    for (let i = 0; i < regs.length; i += 1) {
      if (regs[i][0].test(str) === true) {
        return regs[i]
      }
    }
    return null
  };

  const checkRegex = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    let term = terms[i];
    let { regexText, regexNormal, regexNumbers } = world.model.two;
    let normal = term.machine || term.normal;
    let text = term.text;
    // keep dangling apostrophe?
    if (hasApostrophe.test(term.post) && !hasApostrophe.test(term.pre)) {
      text += term.post.trim();
    }
    let arr = doRegs(text, regexText) || doRegs(normal, regexNormal);
    // hide a bunch of number regexes behind this one
    if (!arr && /[0-9]/.test(normal)) {
      arr = doRegs(normal, regexNumbers);
    }
    if (arr) {
      setTag([term], arr[1], world, false, `1-regex- '${arr[2] || arr[0]}'`);
      term.confidence = 0.6;
      return true
    }
    return null
  };

  const isTitleCase = function (str) {
    return /^[A-ZÄÖÜ][a-z'\u00C0-\u00FF]/.test(str) || /^[A-ZÄÖÜ]$/.test(str)
  };

  // add a noun to any non-0 index titlecased word, with no existing tag
  const titleCaseNoun = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    let term = terms[i];
    // don't over-write any tags
    if (term.tags.size > 0) {
      return
    }
    // skip first-word, for now
    if (i === 0) {
      return
    }
    if (isTitleCase(term.text)) {
      setTag([term], 'Noun', world, false, `1-titlecase`);
    }
  };

  const min = 1400;
  const max = 2100;

  const dateWords = new Set(['dopo', 'prima', 'durante']);

  const seemsGood = function (term) {
    if (!term) {
      return false
    }
    if (dateWords.has(term.normal)) {
      return true
    }
    if (term.tags.has('Date') || term.tags.has('Month') || term.tags.has('WeekDay')) {
      return true
    }
    return false
  };

  const seemsOkay = function (term) {
    if (!term) {
      return false
    }
    if (term.tags.has('Ordinal')) {
      return true
    }
    return false
  };

  // recognize '1993' as a year
  const tagYear = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    const term = terms[i];
    if (term.tags.has('NumericValue') && term.tags.has('Cardinal') && term.normal.length === 4) {
      let num = Number(term.normal);
      // number between 1400 and 2100
      if (num && !isNaN(num)) {
        if (num > min && num < max) {
          if (seemsGood(terms[i - 1]) || seemsGood(terms[i + 1])) {
            setTag([term], 'Year', world, false, '1-tagYear');
            return true
          }
          // or is it really-close to a year?
          if (num > 1950 && num < 2025) {
            if (seemsOkay(terms[i - 1]) || seemsOkay(terms[i + 1])) {
              setTag([term], 'Year', world, false, '1-tagYear-close');
              return true
            }
          }
        }
      }
    }
    return null
  };

  const oneLetterAcronym = /^[A-ZÄÖÜ]('s|,)?$/;
  const isUpperCase = /^[A-Z-ÄÖÜ]+$/;
  const periodAcronym = /([A-ZÄÖÜ]\.)+[A-ZÄÖÜ]?,?$/;
  const noPeriodAcronym = /[A-ZÄÖÜ]{2,}('s|,)?$/;
  const lowerCaseAcronym = /([a-zäöü]\.)+[a-zäöü]\.?$/;

  const oneLetterWord = {
    I: true,
    A: true,
  };
  // just uppercase acronyms, no periods - 'UNOCHA'
  const isNoPeriodAcronym = function (term, model) {
    let str = term.text;
    // ensure it's all upper-case
    if (isUpperCase.test(str) === false) {
      return false
    }
    // long capitalized words are not usually either
    if (str.length > 5) {
      return false
    }
    // 'I' is not a acronym
    if (oneLetterWord.hasOwnProperty(str)) {
      return false
    }
    // known-words, like 'PIZZA' is not an acronym.
    if (model.one.lexicon.hasOwnProperty(term.normal)) {
      return false
    }
    //like N.D.A
    if (periodAcronym.test(str) === true) {
      return true
    }
    //like c.e.o
    if (lowerCaseAcronym.test(str) === true) {
      return true
    }
    //like 'F.'
    if (oneLetterAcronym.test(str) === true) {
      return true
    }
    //like NDA
    if (noPeriodAcronym.test(str) === true) {
      return true
    }
    return false
  };

  const isAcronym = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    let term = terms[i];
    //these are not acronyms
    if (term.tags.has('RomanNumeral') || term.tags.has('Acronym')) {
      return null
    }
    //non-period ones are harder
    if (isNoPeriodAcronym(term, world.model)) {
      term.tags.clear();
      setTag([term], ['Acronym', 'Noun'], world, false, '3-no-period-acronym');
      return true
    }
    // one-letter acronyms
    if (!oneLetterWord.hasOwnProperty(term.text) && oneLetterAcronym.test(term.text)) {
      term.tags.clear();
      setTag([term], ['Acronym', 'Noun'], world, false, '3-one-letter-acronym');
      return true
    }
    //if it's a very-short organization?
    if (term.tags.has('Organization') && term.text.length <= 3) {
      setTag([term], 'Acronym', world, false, '3-org-acronym');
      return true
    }
    // upper-case org, like UNESCO
    if (term.tags.has('Organization') && isUpperCase.test(term.text) && term.text.length <= 6) {
      setTag([term], 'Acronym', world, false, '3-titlecase-acronym');
      return true
    }
    return null
  };

  // auxiliary word-forms (essere/avere/stare) - the Auxiliary tag itself
  // is only applied by the postTagger, which runs after this pass
  const auxWords = new Set([
    'sono', 'sei', 'è', 'siamo', 'siete', 'ero', 'eri', 'era', 'eravamo', 'eravate', 'erano',
    'fui', 'fu', 'furono', 'sarò', 'sarà', 'saranno', 'sia', 'siano', 'fossi', 'fosse', 'fossero',
    'ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno', 'avevo', 'avevi', 'aveva', 'avevamo', 'avevate', 'avevano',
    'ebbe', 'ebbero', 'avrò', 'avrà', 'avranno', 'abbia', 'abbiano', 'avesse', 'avessero',
    'sto', 'stai', 'sta', 'stiamo', 'stanno', 'stavo', 'stava', 'stavano',
  ]);
  // past-participle endings - mangiato/a/i/e, venduto, finito
  const participleLike = /(at|ut|it)[oaie]$/;

  const fallback = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    let term = terms[i];
    if (term.tags.size === 0) {

      if (terms[i - 1]) {
        if (terms[i - 1].tags.has('Auxiliary') || auxWords.has(terms[i - 1].normal)) {
          if (participleLike.test(term.normal)) {
            setTag([term], 'PastParticiple', world, false, '2-fallback-participle');
          } else {
            setTag([term], 'Verb', world, false, '2-fallback-verb');
          }
          return
        }
      }

      setTag([term], 'Noun', world, false, '2-fallback');
    }
  };

  //sweep-through all suffixes
  const suffixLoop$1 = function (str = '', suffixes = []) {
    const len = str.length;
    let max = 7;
    if (len <= max) {
      max = len - 1;
    }
    for (let i = max; i > 1; i -= 1) {
      let suffix = str.substring(len - i, len);
      if (suffixes[suffix.length].hasOwnProperty(suffix) === true) {
        let tag = suffixes[suffix.length][suffix];
        // console.log(suffix)
        return tag
      }
    }
    return null
  };
  // decide tag from the ending of the word
  const suffixCheck = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    let suffixes = world.model.two.suffixPatterns;
    let term = terms[i];
    if (term.tags.size === 0) {
      let tag = suffixLoop$1(term.normal, suffixes);
      if (tag !== null) {
        setTag([term], tag, world, false, '2-suffix');
        term.confidence = 0.7;
        return true
      }
      // try implicit form of word, too
      if (term.implicit) {
        tag = suffixLoop$1(term.implicit, suffixes);
        if (tag !== null) {
          setTag([term], tag, world, false, '2-implicit-suffix');
          term.confidence = 0.7;
          return true
        }
      }
    }
    return null
  };

  // runs before the suffix-lookup, which is too coarse for these
  // infinitive with attached clitic - 'scriverlo', 'fissarla'
  const cliticInfinitive = /^.{3,}(ar|er|ir)(lo|la|li|le|ne|mi|ti|si|ci|vi)$/;
  // long unknown -are/-ere/-ire words are usually verbs - 'autoprodurre'
  const infinitive = /^.{3,}(are|ere|ire|rre)$/;
  // compound prefixes - 'autoprodotto' -> 'prodotto'
  const prefix = /^(auto|anti|contro|inter|micro|mini|multi|neo|post|pre|pseudo|semi|sotto|sopra|super|ultra|vice|co)/;

  const verbLike = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    let term = terms[i];
    if (term.tags.size !== 0) {
      return null
    }
    // an unknown prefixed compound takes the tags of its base word
    let pre = term.normal.match(prefix);
    if (pre) {
      let base = term.normal.slice(pre[0].length);
      let lexicon = world.model.one.lexicon || {};
      if (base.length > 3 && lexicon[base] !== undefined) {
        setTag([term], lexicon[base], world, false, '2-prefix-compound');
        return true
      }
    }
    if (cliticInfinitive.test(term.normal)) {
      setTag([term], 'Infinitive', world, false, '2-clitic-infinitive');
      return true
    }
    if (infinitive.test(term.normal)) {
      setTag([term], 'Infinitive', world, false, '2-infinitive-guess');
      return true
    }
    // truncated infinitive - 'aver fatto', 'salvar la vita'
    if (/(ar|er|ir)$/.test(term.normal)) {
      let lexicon = world.model.one.lexicon || {};
      if (lexicon[term.normal + 'e'] === 'Infinitive') {
        setTag([term], 'Infinitive', world, false, '2-truncated-infinitive');
        return true
      }
    }
    return null
  };

  //sweep-through all suffixes
  const suffixLoop = function (str = '', suffixes = []) {
    const len = str.length;
    let max = 7;
    if (len <= max) {
      max = len - 1;
    }
    for (let i = max; i >= 1; i -= 1) {
      let suffix = str.substring(len - i, len);
      if (suffixes[suffix.length].hasOwnProperty(suffix) === true) {
        let tag = suffixes[suffix.length][suffix];
        return tag
      }
    }
    return null
  };

  const f = 'FemaleNoun';
  const m = 'MaleNoun';

  // https://en.wiktionary.org/wiki/Category:Italian_feminine_suffixes

  /*








  */

  let suffixes = [
    null,
    {
      'a': f,
      'o': m,
      'i': m,
      'e': f,
    },
    // two
    {
      'tà': f,
      'tù': f,
      'ie': f,
    },
    // three
    {
      // 'are': m,
      'ese': m,
      'ile': m,
      'oma': m,
      'one': m,
      'ore': m,
      // 'are': f,
      'ime': f,
      'ite': f,
      'ame': m,
      'ale': m,
      'ere': m,
      'ice': f,
    },
    //four
    {
      'arca': m,
      'cida': m,
      'iere': m,
      'ista': m,
      'eide': f,
      'poli': f,
      'essa': f,
      'ione': f,

    },
    // five
    {
      'crate': f,
      'gione': f,
      // 'mante': f,
      'opoli': f,
      'ptosi': f,
      // 'mante': m,
      'nauta': m,
      // 'crate': m,
      'trice': f,
      'igine': f,
      'udine': f,
    },
    //six
    {
      'cinesi': f,
    },
    {}
  ];

  const nounGender = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    let term = terms[i];
    let tags = term.tags;
    let str = term.normal || term.implicit || '';
    if (tags.has('Noun') && !tags.has('Pronoun') && !tags.has('MaleNoun') && !tags.has('FemaleNoun')) {
      let tag = suffixLoop(str, suffixes);
      if (tag) {
        setTag([term], tag, world, false, '2-guess-gender');
      }
    }
  };

  //  -o  (masculine) ->  -i in the plural, 
  //  -a  (feminine), -> -e in the plural.
  const checkSuffix$2 = function (term) {
    let str = term.normal || term.implicit || '';
    if (str.endsWith('i') || str.endsWith('che') || str.endsWith('ghe')) {
      return 'PluralNoun'
    }
    if (term.tags.has('FemaleNoun') && str.endsWith('e')) {
      return 'PluralNoun'
    }
    if (str.endsWith('o') || str.endsWith('a')) {
      return 'Singular'
    }
    return null
  };

  const nounNumber = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    let term = terms[i];
    let tags = term.tags;
    if (tags.has('Noun') && !tags.has('Pronoun') && !tags.has('PluralNoun') && !tags.has('Singular')) {
      let tag = checkSuffix$2(term);
      if (tag) {
        setTag([term], tag, world, false, '2-noun-number');
      }
    }
  };

  // str = str.replace(/o$/, 'i')//rosso->rossi
  // str = str.replace(/e$/, 'i')//triste -> tristi
  // str = str.replace(/a$/, 'e')//nera -> nere

  // invariant '-e' adjectives - 'grande', 'riferibile', 'inglese'
  const invariant$1 = /(ale|ile|are|ore|nte|ese|bile)$/;

  const checkSuffix$1 = function (str) {
    let m = 'MaleAdjective';
    let f = 'FemaleAdjective';
    if (str.endsWith('o') || str.endsWith('i')) {
      return m
    }
    // same form for both genders
    if (invariant$1.test(str)) {
      return null
    }
    // la signora italiana
    if (str.endsWith('a') || str.endsWith('e')) {
      return f
    }
    return null
  };

  const adjGender = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    let term = terms[i];
    let tags = term.tags;
    let str = term.normal || term.implicit || '';
    if (tags.has('Adjective') && !tags.has('MaleAdjective') && !tags.has('FemaleAdjective')) {
      let tag = checkSuffix$1(str);
      if (tag) {
        setTag([term], tag, world, false, '2-adj-gender');
      }
    }
  };

  // invariant '-e' adjectives are singular - 'grande', 'riferibile'
  const invariant = /(ale|ile|are|ore|nte|ese|bile)$/;

  const checkSuffix = function (str) {
    if (invariant.test(str)) {
      return null
    }
    if (str.endsWith('e') || str.endsWith('i')) {
      return 'PluralAdjective'
    }
    return null
  };

  const adjNumber = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    let term = terms[i];
    let tags = term.tags;
    let str = term.normal || term.implicit || '';
    if (tags.has('Adjective') && !tags.has('PluralAdjective')) {
      let tag = checkSuffix(str);
      if (tag) {
        setTag([term], tag, world, false, '2-adj-number');
      }
    }
  };

  // 1st pass
  // import guessPlural from './3rd-pass/noun-plural.js'
  // import adjPlural from './3rd-pass/adj-plural.js'
  // import adjGender from './3rd-pass/adj-gender.js'
  // import verbForm from './3rd-pass/verb-form.js'


  // these methods don't care about word-neighbours
  const firstPass = function (terms, world) {
    for (let i = 0; i < terms.length; i += 1) {
      //  is it titlecased?
      let found = titleCaseNoun(terms, i, world);
      // try look-like rules
      found = found || checkRegex(terms, i, world);
      // turn '1993' into a year
      tagYear(terms, i, world);
    }
  };
  const secondPass = function (terms, world) {
    for (let i = 0; i < terms.length; i += 1) {
      let found = isAcronym(terms, i, world);
      found = found || verbLike(terms, i, world);
      found = found || suffixCheck(terms, i, world);
      // found = found || neighbours(terms, i, world)
      found = found || fallback(terms, i, world);
    }
  };

  const thirdPass = function (terms, world) {
    for (let i = 0; i < terms.length; i += 1) {
      nounGender(terms, i, world);
      nounNumber(terms, i, world);
      adjGender(terms, i, world);
      adjNumber(terms, i, world);
      //     guessPlural(terms, i, world)
      //     verbForm(terms, i, world)
    }
  };


  const tagger = function (view) {
    let world = view.world;
    view.docs.forEach(terms => {
      firstPass(terms, world);
      secondPass(terms, world);
      thirdPass(terms, world);
    });
    return view
  };

  var regexNormal = [
    //web tags
    [/^[\w.]+@[\w.]+\.[a-z]{2,3}$/, 'Email'],
    [/^(https?:\/\/|www\.)+\w+\.[a-z]{2,3}/, 'Url', 'http..'],
    [/^[a-z0-9./].+\.(com|net|gov|org|ly|edu|info|biz|dev|ru|jp|de|in|uk|br|io|ai)/, 'Url', '.com'],

    // timezones
    [/^[PMCE]ST$/, 'Timezone', 'EST'],

    //names
    [/^ma?c'.*/, 'LastName', "mc'neil"],
    [/^o'[drlkn].*/, 'LastName', "o'connor"],
    [/^ma?cd[aeiou]/, 'LastName', 'mcdonald'],

    //slang things
    [/^(lol)+[sz]$/, 'Expression', 'lol'],
    [/^wo{2,}a*h?$/, 'Expression', 'wooah'],
    [/^(hee?){2,}h?$/, 'Expression', 'hehe'],
    [/^(un|de|re)\\-[a-z\u00C0-\u00FF]{2}/, 'Verb', 'un-vite'],

    // m/h
    [/^(m|k|cm|km)\/(s|h|hr)$/, 'Unit', '5 k/m'],
    // μg/g
    [/^(ug|ng|mg)\/(l|m3|ft3)$/, 'Unit', 'ug/L'],
  ];

  var regexNumbers = [

    [/^@1?[0-9](am|pm)$/i, 'Time', '3pm'],
    [/^@1?[0-9]:[0-9]{2}(am|pm)?$/i, 'Time', '3:30pm'],
    [/^'[0-9]{2}$/, 'Year'],
    // times
    [/^[012]?[0-9](:[0-5][0-9])(:[0-5][0-9])$/, 'Time', '3:12:31'],
    [/^[012]?[0-9](:[0-5][0-9])?(:[0-5][0-9])? ?(am|pm)$/i, 'Time', '1:12pm'],
    [/^[012]?[0-9](:[0-5][0-9])(:[0-5][0-9])? ?(am|pm)?$/i, 'Time', '1:12:31pm'], //can remove?

    // iso-dates
    [/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}/i, 'Date', 'iso-date'],
    [/^[0-9]{1,4}-[0-9]{1,2}-[0-9]{1,4}$/, 'Date', 'iso-dash'],
    [/^[0-9]{1,4}\/[0-9]{1,2}\/[0-9]{1,4}$/, 'Date', 'iso-slash'],
    [/^[0-9]{1,4}\.[0-9]{1,2}\.[0-9]{1,4}$/, 'Date', 'iso-dot'],
    [/^[0-9]{1,4}-[a-z]{2,9}-[0-9]{1,4}$/i, 'Date', '12-dec-2019'],

    // timezones
    [/^utc ?[+-]?[0-9]+$/, 'Timezone', 'utc-9'],
    [/^(gmt|utc)[+-][0-9]{1,2}$/i, 'Timezone', 'gmt-3'],

    //phone numbers
    [/^[0-9]{3}-[0-9]{4}$/, 'PhoneNumber', '421-0029'],
    [/^(\+?[0-9][ -])?[0-9]{3}[ -]?[0-9]{3}-[0-9]{4}$/, 'PhoneNumber', '1-800-'],


    //money
    //like $5.30
    [
      /^[-+]?[$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BD\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6][-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?([kmb]|bn)?\+?$/,
      ['Money', 'Value'],
      '$5.30',
    ],
    //like 5.30$
    [
      /^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?[$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BD\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6]\+?$/,
      ['Money', 'Value'],
      '5.30£',
    ],
    //like
    [/^[-+]?[$£]?[0-9]([0-9,.])+(usd|eur|jpy|gbp|cad|aud|chf|cny|hkd|nzd|kr|rub)$/i, ['Money', 'Value'], '$400usd'],

    //numbers
    // 50 | -50 | 3.23  | 5,999.0  | 10+
    [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?\+?$/, ['Cardinal', 'NumericValue'], '5,999'],
    [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?(st|nd|rd|r?th|°)$/, ['Ordinal', 'NumericValue'], '53rd'],
    // .73th
    [/^\.[0-9]+\+?$/, ['Cardinal', 'NumericValue'], '.73th'],
    //percent
    [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?%\+?$/, ['Percent', 'Cardinal', 'NumericValue'], '-4%'],
    [/^\.[0-9]+%$/, ['Percent', 'Cardinal', 'NumericValue'], '.3%'],
    //fraction
    [/^[0-9]{1,4}\/[0-9]{1,4}(st|nd|rd|th)?s?$/, ['Fraction', 'NumericValue'], '2/3rds'],
    //range
    [/^[0-9.]{1,3}[a-z]{0,2}[-–—][0-9]{1,3}[a-z]{0,2}$/, ['Value', 'NumberRange'], '3-4'],
    //time-range
    [/^[0-9]{1,2}(:[0-9][0-9])?(am|pm)? ?[-–—] ?[0-9]{1,2}(:[0-9][0-9])?(am|pm)$/, ['Time', 'NumberRange'], '3-4pm'],
    //with unit
    [/^[0-9.]+([a-z]{1,4})$/, 'Value', '9km'],
  ];

  var regexText = [
    // #coolguy
    [/^#[a-z0-9_\u00C0-\u00FF]{2,}$/i, 'HashTag'],

    // @spencermountain
    [/^@\w{2,}$/, 'AtMention'],

    // period-ones acronyms - f.b.i.
    [/^([A-ZÄÖÜ]\.){2}[A-ZÄÖÜ]?/i, ['Acronym', 'Noun'], 'F.B.I'], //ascii-only

    // ending-apostrophes
    [/.{3}[lkmnp]in['‘’‛‵′`´]$/, 'Gerund', "chillin'"],
    [/.{4}s['‘’‛‵′`´]$/, 'Possessive', "flanders'"],
  ];

  const rb = 'Adverb';
  const nn = 'Noun';
  const fn = 'FemaleNoun';
  const mn = 'MaleNoun';
  const vb = 'Verb';
  const jj = 'Adjective';
  // const cond = 'ConditionalVerb'
  const fut = 'FutureTense';
  const inf = 'Infinitive';
  const g = 'Gerund';
  const ref = ['Reflexive', 'Infinitive']; //alzarsi
  const pres = 'PresentTense';
  const val = ['TextValue', 'Cardinal'];
  const ord = ['TextValue', 'Ordinal'];
  // const first = 'FirstPerson'

  var suffixPatterns = [
    null,
    {
      // one-letter suffixes
    },
    {
      // two-letter suffixes
      io: nn,
      tà: fn,
      tù: fn,
      rà: fut,
      uo: jj,
      na: nn,
      ta: nn,
      ne: nn,
      ze: nn,
      pi: nn,
      // ti: nn,
      bo: nn,
      fo: nn,
      lo: nn,
      to: nn
    },
    {
      // three-letter suffixes

      uno: val,
      due: val,
      tre: val,
      tré: val,
      sei: val,

      are: inf,
      ire: inf,
      ere: inf,
      umi: nn,
      ine: nn,
      età: nn,
      ico: jj,
      one: nn,
      oni: nn,
      ore: mn,
      ema: mn,
      eva: vb,
      arà: fut,
      erà: fut,
      irà: fut,
      rrà: fut,
      vrà: fut,
      irò: fut,
      ava: vb, //imperfect - parlava
      bbe: vb,
      sce: vb,
      ono: vb,
      oso: jj,
      ior: jj,

      mba: nn,
      ada: nn,
      fia: nn,
      mia: nn,
      tia: nn,
      mma: nn,
      rra: nn,
      cce: nn,
      fie: nn,
      gie: nn,
      nie: nn,
      sie: nn,
      tie: nn,
      zie: nn,
      ule: nn,
      ame: nn,
      ing: nn,
      adi: nn,
      odi: nn,
      udi: nn,
      uli: nn,
      ami: nn,
      emi: nn,
      mmi: nn,
      omi: nn,
      smi: nn,
      nni: nn,
      dri: nn,
      iri: nn,
      zzi: nn,
      ion: nn,
      rco: nn,
      odo: nn,
      igo: nn,
      ogo: nn,
      smo: nn,
      umo: nn,
      gno: nn,
      ipo: nn,
      mpo: nn,
      bro: nn,
      zzo: nn,
      ier: nn,
      ans: nn,
      bus: nn,
      ort: nn
    },
    {
      // four-letter suffixes
      // no 'otto' - matches 'prodotto', 'salotto'.. number-words are in the lexicon
      nove: val,
      mila: val,
      anta: val, //settanta, trecentosettanta

      // reflexive infinitives
      armi: ref,
      irmi: ref,
      ermi: ref,

      arti: ref,
      irti: ref,
      erti: ref,

      arsi: ref,
      irsi: ref,
      ersi: ref,

      arci: ref,
      irci: ref,
      erci: ref,

      arvi: ref,
      irvi: ref,
      ervi: ref,

      // verb pronoun suffixes
      // -"are"+"lo" = "arlo" verb suffix
      arlo: inf,
      arla: inf,
      arli: inf,
      arle: inf,

      erlo: inf,
      erla: inf,
      erli: inf,
      erle: inf,

      irlo: inf,
      irla: inf,
      irli: inf,
      irle: inf,

      endo: g,
      ando: g,
      ante: jj,
      iere: nn,
      icci: nn, //or adj
      ezze: nn,
      ista: nn,
      tore: nn,
      zolo: nn,
      lino: nn,
      zone: nn,
      eone: nn,
      lone: nn,
      cone: nn,
      lona: nn,
      ione: fn,

      enga: vb,
      para: vb,
      ntra: vb,
      tata: vb,
      izza: vb,
      iace: vb,
      duce: vb,
      cede: pres,
      iede: pres,
      lude: pres,
      inge: vb,
      iene: vb,
      enne: vb,
      dete: vb,
      vete: vb,
      duto: vb,
      vuto: vb,
      cevo: vb,
      terò: vb,
      vrei: vb,
      sati: vb,
      iamo: vb,
      vamo: vb,
      emmo: vb,
      vano: vb,
      anno: vb,
      zato: vb,
      sero: vb,

      sivo: jj,
      pica: jj,
      sima: jj,
      iosa: jj,
      tosa: jj,
      siva: jj,
      nghe: jj,
      cale: jj,
      gale: jj,
      pale: jj,
      bile: jj,
      cile: jj,
      mile: jj,
      sime: jj,
      cane: jj,
      iane: jj,
      iore: jj,
      dese: jj,
      lese: jj,
      iose: jj,
      nose: jj,
      rose: jj,
      tose: jj,
      uose: jj,
      sive: jj,
      gici: jj,
      pici: jj,
      sici: jj,
      cali: jj,
      iali: jj,
      rali: jj,
      bili: jj,
      timi: jj,
      iori: jj,
      rosi: jj,
      sivi: jj,
      gico: jj,
      tico: jj,
      lido: jj,
      anea: jj,

      teca: nn,
      iaia: nn,
      naia: nn,
      acia: nn,
      rdia: nn,
      egia: nn,
      ogia: nn,
      rgia: nn,
      glia: nn,
      eria: nn,
      oria: nn,
      tria: nn,
      esia: nn,
      azia: nn,
      tela: nn,
      sola: nn,
      tola: nn,
      uola: nn,
      orma: nn,
      oppa: nn,
      iera: nn,
      etra: nn,
      sura: nn,
      tura: nn,
      anza: nn,
      azza: nn,
      ezza: nn,
      ombe: nn,
      ance: nn,
      inee: nn,
      rche: nn,
      eghe: nn,
      erie: nn,
      stie: nn,
      iole: nn,
      sole: nn,
      nome: nn,
      tume: nn,
      appe: nn,
      mbre: nn,
      adre: nn,
      sure: nn,
      ture: nn,
      onte: nn,
      arte: nn,
      ordi: nn,
      aggi: nn,
      eggi: nn,
      rchi: nn,
      ighi: nn,
      igli: nn,
      alli: nn,
      poli: nn,
      reni: nn,
      agni: nn,
      egni: nn,
      cini: nn,
      gini: nn,
      mini: nn,
      sini: nn,
      orni: nn,
      atoi: nn,
      mbri: nn,
      neri: nn,
      lori: nn,
      mori: nn,
      sori: nn,
      tori: nn,
      etri: nn,
      ntri: nn,
      lisi: nn,
      ussi: nn,
      eusi: nn,
      dizi: nn,
      orzi: nn,
      orum: nn,
      alco: nn,
      ioco: nn,
      uoco: nn,
      reno: nn,
      mino: nn,
      fono: nn,
      uppo: nn,
      naro: nn,
      pero: nn,
      voro: nn,
      itro: nn,
      orso: nn,
      ievo: nn,
      arzo: nn,
      nter: nn,
      gnor: nn,
      port: nn,
      vedì: nn,
      vitù: nn
    },
    {
      // five-letter suffixes
      irgli: inf,
      argli: inf,
      ergli: inf,
      regli: inf, //diregli
      areci: inf,
      ereci: inf,
      ireci: inf,
      arele: inf,
      erele: inf, //scriverele
      irele: inf,
      // reflexive + object pronoun - 'studiarselo'
      rselo: ref,
      rsela: ref,
      rseli: ref,
      rsele: ref,
      rsene: ref,

      tante: jj,
      tanti: jj,
      ibile: jj,
      sette: val,
      cento: val,
      esimo: ord,
      ecimo: ord,
      mente: rb,
      tipie: nn,
      toria: nn,
      ucchi: nn,
      ucoli: nn,
      gioni: nn,
      celli: nn,
      celle: nn,
      astri: nn,
      archi: nn,
      arche: nn,
      acchi: nn,
      nauta: nn,
      crate: nn,
      zione: nn,
      mento: nn,
      dromo: nn,
      accio: nn,
      cetto: nn,

      tacca: vb,
      plica: vb,
      nvoca: vb,
      calda: vb,
      uarda: vb,
      corda: vb,
      ambia: vb,
      rolla: vb,
      sogna: vb,
      embra: vb,
      ndata: vb,
      sulta: vb,
      senta: vb,
      venta: vb,
      porta: vb,
      catta: vb,
      dotta: vb,
      ciuta: vb,
      rriva: vb,
      lizza: vb,
      rizza: vb,
      piace: vb,
      fende: vb,
      pende: vb,
      rende: vb,
      tende: vb,
      ponde: vb,
      sorge: vb,
      prime: vb,
      rompe: vb,
      mpare: vb,
      corre: vb,
      iasse: vb,
      cesse: vb, //imperfect subjunctive - facesse
      vesse: vb, //dovesse
      usate: vb,
      edete: vb,
      ndete: vb,
      irete: vb,
      rrete: vb,
      otete: vb,
      guite: vb,
      siste: vb,
      mette: vb,
      crive: vb,
      muove: vb,
      derai: fut,
      herai: fut,
      nosci: vb,
      orrei: vb,
      ntati: vb,
      nosco: vb,
      pongo: vb,
      gnamo: vb,
      aremo: vb,
      dremo: vb,
      eremo: vb,
      iremo: vb,
      rremo: vb,
      vremo: vb,
      ccano: vb,
      ncano: vb,
      ndano: vb,
      rlano: vb,
      inano: vb,
      orano: vb,
      trano: vb,
      rtano: vb,
      stano: vb,
      ttano: vb,
      utano: vb,
      avano: vb,
      evano: vb,
      ivano: vb,
      ovano: vb,
      bbero: vb,
      rdato: vb,
      agato: vb,
      biato: vb,
      ciato: vb,
      viato: vb,
      llato: vb,
      amato: vb,
      gnato: vb,
      rnato: vb,
      prato: vb,
      ntato: vb,
      otato: vb,
      stato: vb,
      ovato: vb,
      scito: vb,
      ntito: vb,
      tuito: vb,
      iunto: vb,
      iesto: vb,
      visto: vb,
      enuto: vb,
      ttuto: vb,
      otevo: vb,
      ovevo: vb,
      crivo: vb,
      overò: vb,

      pleto: jj,
      sueto: jj,
      ggior: jj,
      ibica: jj,
      afica: jj,
      agica: jj,
      olica: jj,
      omica: jj,
      irica: jj,
      orica: jj,
      trica: jj,
      isica: jj,
      ntica: jj,
      otica: jj,
      tesca: jj,
      alida: jj,
      maria: jj,
      naria: jj,
      raria: jj,
      inima: jj,
      ltima: jj,
      rbana: jj,
      icana: jj,
      derna: jj,
      terna: jj,
      inosa: jj,
      erosa: jj,
      orosa: jj,
      carsa: jj,
      guata: jj,
      osita: jj,
      itiva: jj,
      utiva: jj,
      apace: jj,
      plice: jj,
      rande: jj,
      ranee: jj,
      iache: jj,
      diche: jj,
      giche: jj,
      piche: jj,
      esche: jj,
      darie: jj,
      iarie: jj,
      rarie: jj,
      tarie: jj,
      idale: jj,
      ciale: jj,
      diale: jj,
      niale: jj,
      ziale: jj,
      rmale: jj,
      orale: jj,
      urale: jj,
      rsale: jj,
      ssale: jj,
      ntale: jj,
      guale: jj,
      nuale: jj,
      suale: jj,
      tuale: jj,
      utile: jj,
      evole: jj,
      ltime: jj,
      ovane: jj,
      terne: jj,
      leare: jj,
      ustre: jj,
      onese: jj,
      zzese: jj,
      tense: jj,
      olose: jj,
      cente: jj,
      uente: jj,
      leste: jj,
      fette: jj,
      ntive: jj,
      apaci: jj,
      afici: jj,
      plici: jj,
      omici: jj,
      onici: jj,
      erici: jj,
      irici: jj,
      etici: jj,
      stici: jj,
      egali: jj,
      rmali: jj,
      enali: jj,
      onali: jj,
      ipali: jj,
      rsali: jj,
      ntali: jj,
      guali: jj,
      nuali: jj,
      suali: jj,
      abili: jj,
      ibili: jj,
      evoli: jj,
      ssimi: jj,
      terni: jj,
      leari: jj,
      ziari: jj,
      olari: jj,
      ecisi: jj,
      tensi: jj,
      giosi: jj,
      siosi: jj,
      ziosi: jj,
      inosi: jj,
      benti: jj,
      uenti: jj,
      stivi: jj,
      afico: jj,
      olico: jj,
      amico: jj,
      imico: jj,
      omico: jj,
      onico: jj,
      drico: jj,
      irico: jj,
      trico: jj,
      tesco: jj,
      ccolo: jj,
      ibero: jj,
      manti: jj,

      onaca: nn,
      oteca: nn,
      cerca: nn,
      cenda: nn,
      genda: nn,
      mblea: nn,
      agoga: nn,
      abbia: nn,
      occia: nn,
      ancia: nn,
      arcia: nn,
      oscia: nn,
      ducia: nn,
      ardia: nn,
      rchia: nn,
      agnia: nn,
      fonia: nn,
      lizia: nn,
      tizia: nn,
      anzia: nn,
      cella: nn,
      della: nn,
      rella: nn,
      egola: nn,
      avola: nn,
      sfera: nn,
      diera: nn,
      niera: nn,
      riera: nn,
      antra: nn,
      estra: nn,
      atura: nn,
      itura: nn,
      ltura: nn,
      ntura: nn,
      rtura: nn,
      scesa: nn,
      regua: nn,
      benza: nn,
      cenza: nn,
      denza: nn,
      genza: nn,
      ienza: nn,
      lenza: nn,
      nenza: nn,
      renza: nn,
      senza: nn,
      tenza: nn,
      uenza: nn,
      venza: nn,
      alice: nn,
      trade: nn,
      grafe: nn,
      hegge: nn,
      erche: nn,
      aglie: nn,
      iglie: nn,
      nomie: nn,
      lerie: nn,
      terie: nn,
      estie: nn,
      rovie: nn,
      gnale: nn,
      quile: nn,
      relle: nn,
      telle: nn,
      egole: nn,
      nsole: nn,
      uvole: nn,
      uttle: nn,
      larme: nn,
      stume: nn,
      embre: nn,
      diere: nn,
      hiere: nn,
      riere: nn,
      tiere: nn,
      ziere: nn,
      amere: nn,
      arere: nn,
      otere: nn,
      amate: nn,
      rdite: nn,
      llite: nn,
      corte: nn,
      forte: nn,
      ieste: nn,
      teste: nn,
      hette: nn,
      iette: nn,
      notte: nn,
      abyte: nn,
      ollah: nn,
      cambi: nn,
      efici: nn,
      ffici: nn,
      rnici: nn,
      ssidi: nn,
      iardi: nn,
      cordi: nn,
      lutei: nn,
      grafi: nn,
      ologi: nn,
      occhi: nn,
      richi: nn,
      ischi: nn,
      oschi: nn,
      lighi: nn,
      sigli: nn,
      igili: nn,
      delli: nn,
      pelli: nn,
      relli: nn,
      telli: nn,
      rolli: nn,
      acoli: nn,
      icoli: nn,
      ncoli: nn,
      scoli: nn,
      cioli: nn,
      itoli: nn,
      rreni: nn,
      segni: nn,
      adini: nn,
      udini: nn,
      chini: nn,
      alini: nn,
      lmini: nn,
      omini: nn,
      trini: nn,
      ttini: nn,
      verni: nn,
      iorni: nn,
      latoi: nn,
      atari: nn,
      embri: nn,
      lberi: nn,
      dieri: nn,
      lieri: nn,
      zieri: nn,
      sseri: nn,
      tteri: nn,
      averi: nn,
      alori: nn,
      olori: nn,
      ssori: nn,
      bitri: nn,
      istri: nn,
      sensi: nn,
      cessi: nn,
      ressi: nn,
      lievi: nn,
      udizi: nn,
      rvizi: nn,
      egozi: nn,
      sorzi: nn,
      tacco: nn,
      ffico: nn,
      arico: nn,
      ssido: nn,
      iardo: nn,
      uardo: nn,
      piego: nn,
      onimo: nn,
      rreno: nn,
      mbino: nn,
      ncino: nn,
      rdino: nn,
      amino: nn,
      verno: nn,
      iorno: nn,
      loppo: nn,
      luppo: nn,
      ruppo: nn,
      sacro: nn,
      uadro: nn,
      umero: nn,
      stero: nn,
      spiro: nn,
      esoro: nn,
      avoro: nn,
      metro: nn,
      senso: nn,
      basso: nn,
      passo: nn,
      cesso: nn,
      sesso: nn,
      lusso: nn,
      lievo: nn,
      forzo: nn,
      onder: nn,
      orter: nn,
      ignor: nn,
      tress: nn,
      xport: nn,
      uency: nn,
      ility: nn
    },
    {
      // six-letter suffixes
      cinque: val,
      ntotto: val, //cinquantotto
      ciotto: val, //diciotto
      ionale: jj,
      andoci: g, //reflexive gerund
      endoci: g,
      endomi: g,
      icelli: nn,
      icelle: nn,
      erelli: nn,
      erelle: nn,
      grafia: nn,
      ellino: nn,
      itorio: nn,
      logico: jj
    },
    {
      // seven-letter suffixes
      quattro: val,

      grafico: jj,
      ectomia: nn
    }
  ];

  var model = {
    regexNormal,
    regexNumbers,
    regexText,
    suffixPatterns
  };

  var preTagger = {
    compute: {
      preTagger: tagger
    },
    model: {
      two: model
    },
    hooks: ['preTagger']
  };

  // articles that are never object-pronouns (l' splits to 'l')
  const articles = '(il|i|un|uno|una|l)';
  // these are articles OR proclitic object-pronouns - 'la pizza' vs 'la vedo'
  const articleClitics = '(lo|la|le|gli)';
  // preposition+article contractions
  const prepArticles =
    '(al|allo|alla|ai|agli|alle|del|dello|della|dei|degli|delle|nel|nello|nella|nei|negli|nelle|sul|sullo|sulla|sui|sugli|sulle|dal|dallo|dalla|dai|dagli|dalle|col|coi)';
  // other noun-introducers
  const otherDets = '(questo|questa|questi|queste|quel|quello|quella|quelli|quelle|ogni|qualche|nessun|alcuni|alcune|molti|molte)';

  // essere - to be
  const essereForms =
    '(sono|sei|è|siamo|siete|ero|eri|era|eravamo|eravate|erano|fui|fosti|fu|fummo|foste|furono|sarò|sarai|sarà|saremo|sarete|saranno|sia|siano|fossi|fosse|fossimo|fossero|sarei|saresti|sarebbe|saremmo|sareste|sarebbero)';
  // avere - to have
  const avereForms =
    '(ho|hai|ha|abbiamo|avete|hanno|avevo|avevi|aveva|avevamo|avevate|avevano|ebbi|ebbe|ebbero|avrò|avrai|avrà|avremo|avrete|avranno|abbia|abbiano|avessi|avesse|avessimo|avessero|avrei|avresti|avrebbe|avremmo|avreste|avrebbero)';
  // stare - progressive
  const stareForms =
    '(sto|stai|sta|stiamo|state|stanno|stavo|stavi|stava|stavamo|stavate|stavano|starò|starai|starà|staremo|starete|staranno)';

  // forms that stay verbs even after an article - "l'hai", "uno è"
  const coreVerbs =
    '(è|era|erano|ero|sono|sei|siamo|siete|fu|furono|sarà|saranno|sia|siano|fosse|ho|hai|ha|abbiamo|avete|hanno|avevo|aveva|avevano|avrà|abbia|sto|stai|sta|stanno|stava|posso|puoi|può|possiamo|possono|poteva|potrà|devo|devi|deve|dobbiamo|devono|doveva|dovrà|voglio|vuoi|vuole|vogliamo|vogliono|voleva|vorrà|so|sai|sa|sanno|vado|vai|va|vanno|faccio|fai|fa|fanno|dico|dici|dice|dicono)';

  const postTagger$1 = function (doc) {
    // a word after an article is a noun - 'la pizza', 'il potere'
    doc.match(`${articles} [#Verb]`, 0).ifNo(coreVerbs).tag('Noun', 'art-noun');
    doc.match(`${prepArticles} [#Verb]`, 0).ifNo(coreVerbs).tag('Noun', 'prep-art-noun');
    doc.match(`${otherDets} [#Verb]`, 0).ifNo(coreVerbs).tag('Noun', 'det-noun');
    doc.match(`${articleClitics} [#Verb]`, 0).ifNo(coreVerbs).tag('Noun', 'art-clitic-noun');
    // ..unless an object follows - 'le offro un caffè', 'lo vede la sera'
    doc.match(`${articleClitics} [#Noun] (un|uno|una|il|lo|la|i|gli|le|mi|ti|ci|vi)`, 0).tag('PresentTense', 'clitic-verb');
    // 'lo vedo' - the clitic before a verb is a pronoun
    doc.match(`[${articleClitics}] #Verb`, 0).tag('Pronoun', 'clitic-pron');
    // gender from indefinite article
    doc.match('una [#Noun]', 0).tag('FemaleNoun', 'una-noun');
    doc.match('(un|uno) [#Noun]', 0).tag('MaleNoun', 'un-noun');

    //  un libro di cucina
    doc.match('(un|uno) #Noun di [#Verb]', 0).tag('Noun', 'un-x-di-vb');

    // noun-verb homographs before an article are verbs - 'legge un libro'
    doc.match(`#Noun [(legge|porta|guida|nota|regola|forma|causa)] ${articles}`, 0).tag('PresentTense', 'noun-vb-art');

    // phrasal verbs ('su' excluded - it is usually a preposition)
    doc
      .match(
        '#Verb (alzata|avanti|dietro|fuori|sotto|giu|giù|indietro|dentro|addosso)'
      )
      .tag('#PhrasalVerb #Particle', 'phrasal');

    // noun gender aggrement
    doc.match('(il|lo|i|gli) [#Noun]', 0).tag('MaleNoun', 'm-noun');
    doc.match('(la|le|una) [#Noun]', 0).tag('FemaleNoun', 'f-noun');

    // 'vi arrabbiate' - a word right after a reflexive clitic is its verb
    doc.match('(mi|ti|si|ci|vi) [#Adjective]', 0).tag('PresentTense', 'clitic-verb-guess');
    // 'voi finite il lavoro' - subject pronoun + misread adjective
    doc.match('(io|tu|noi|voi) [#Adjective]', 0).ifNo('(stesso|stessa|stessi|stesse|due|tre)').tag('PresentTense', 'pron-verb-guess');
    // Come ti chiami? - the clitic pronoun gets the Reflexive tag
    doc.match('[(mi|ti|si|ci|vi)] #Verb', 0).tag('Reflexive', 'si-verb');
    // non lavoro
    doc.match('non [#Noun]', 0).tag('Verb', 'non-verb');
    // i ginocchi
    doc.match('(i|gli|le) [#Noun]', 0).tag('PluralNoun', 'i-plural');
    // 27° - '27th'
    doc.match('[#Value] °', 0).tag('Ordinal', 'number-ordinal');

    // 'uno' and 'sei' are also number-words
    // standalone - 'uno'
    doc.match('^[(uno|sei)]$', 0).tag(['TextValue', 'Cardinal'], 'lone-number');
    // 'sei anni' - six years
    doc.match('[sei] #PluralNoun', 0).tag(['TextValue', 'Cardinal'], 'sei-plural');
    // 'a uno è..' - one (person)
    doc.match('[(uno|sei)] (è|sono|era|erano|fu|furono|sarà|saranno)', 0).tag(['TextValue', 'Cardinal'], 'num-copula');

    // auxiliary verbs
    // sono andato - essere + participle
    doc.match(`[${essereForms}] #Verb`, 0).tag('Auxiliary', 'essere-aux');
    // 'ha scritto' - a word after avere is its participle, not an adjective
    doc.match(`${avereForms} [#Adjective]`, 0).ifNo('(caldo|freddo)').tag('PastParticiple', 'avere-pp');
    // 'è stata fondata', 'venne sconfitto' - passive participles
    doc.match('(fu|furono|venne|vennero|viene|vengono|è|era|erano|sarà|essere|stato|stata|stati|state) [/(at|ut|it)[oaie]$/]', 0).tag('PastParticiple', 'passive-pp');
    // ho mangiato - avere + participle
    doc.match(`[${avereForms}] #PastParticiple`, 0).tag('Auxiliary', 'avere-aux');
    // sto mangiando - stare + gerund
    doc.match(`[${stareForms}] #Gerund`, 0).tag('Auxiliary', 'stare-aux')
    // posso camminare - modal + infinitive
    // (root-tokens can't be or'd together in one match)
    ;['volere', 'potere', 'dovere', 'sapere'].forEach((modal) => {
      doc.match(`[{${modal}}] (#Infinitive|#Reflexive)`, 0).tag('Auxiliary', 'modal-aux');
    });

    // Che bello!
    doc.match('^che #Adjective$').tag('Expression', 'che-bello');
  };

  var postTagger = {
    compute: {
      postTagger: postTagger$1
    },
    hooks: ['postTagger']
  };

  const findVerbs = function (doc) {
    let m = doc.match('<Verb>');

    m = m.splitAfter('@hasComma');

    // the reason he will is ...
    // all i do is talk
    m = m.splitAfter('[(do|did|am|was|is|will)] (is|was)', 0);
    // m = m.splitAfter('[(do|did|am|was|is|will)] #PresentTense', 0)

    // cool

    // like being pampered
    m = m.splitBefore('(#Verb && !#Copula) [being] #Verb', 0);
    // like to be pampered
    m = m.splitBefore('#Verb [to be] #Verb', 0);

    // implicit conjugation - 'help fix'

    m = m.splitAfter('[help] #PresentTense', 0);
    // what i can sell is..
    m = m.splitBefore('(#PresentTense|#PastTense) [#Copula]$', 0);
    // what i can sell will be
    m = m.splitBefore('(#PresentTense|#PastTense) [will be]$', 0);

    // professes love
    let toVerbs = m.match('(#PresentTense|#PastTense) #Infinitive');
    if (toVerbs.found && !toVerbs.has('^go')) {
      m = m.splitBefore('(#PresentTense|#PastTense) [#Infinitive]', 0);
    }
    // 'allow yourself'
    // m = m.not('#Reflexive$')
    m = m.not('(mi|ti|si|ci|vi)');
    //ensure there's actually a verb
    m = m.if('#Verb');
    // the reason he will is ...
    // ensure it's not two verbs
    return m
  };

  // split adverbs as before/after the root
  const getAdverbs = function (vb, root) {
    let res = {
      pre: vb.none(),
      post: vb.none(),
    };
    if (!vb.has('#Adverb')) {
      return res
    }
    // pivot on the main verb
    let parts = vb.splitOn(root);
    if (parts.length === 3) {
      return {
        pre: parts.eq(0).adverbs(),
        post: parts.eq(2).adverbs(),
      }
    }
    // it must be the second one
    if (parts.eq(0).isDoc(root)) {
      res.post = parts.eq(1).adverbs();
      return res
    }
    res.pre = parts.eq(0).adverbs();
    return res
  };

  // import getRoot from './root.js'

  const getAuxiliary = function (vb, root) {
    let parts = vb.splitBefore(root);
    if (parts.length <= 1) {
      return vb.none()
    }
    let aux = parts.eq(0);
    aux = aux.not('(#Adverb|#Negative|#Prefix)');
    return aux
  };

  const getNegative = function (vb) {
    return vb.match('#Negative')
  };

  // pull-apart phrasal-verb into verb-particle
  // const getPhrasal = function (root) {
  //   let particle = root.match('#Particle$')
  //   return {
  //     verb: root.not(particle),
  //     particle: particle,
  //   }
  // }

  const getRoot$2 = function (view) {
    view.compute('root');
    let m = view.not('(#Auxiliary|#Adverb|#Negative)');
    return m.text('root')
  };

  const parseVerb = function (view) {
    let vb = view.clone();
    // vb.contractions().expand()
    const root = getRoot$2(vb);
    let res = {
      root: root,
      prefix: vb.match('#Prefix'),
      adverbs: getAdverbs(vb, root),
      auxiliary: getAuxiliary(vb, root),
      negative: getNegative(vb),
      // phrasal: getPhrasal(root),
    };
    return res
  };

  // import getGrammar from './parse/grammar/index.js'
  // import { getTense } from './lib.js'

  const toArray = function (m) {
    if (!m || !m.isView) {
      return []
    }
    const opts = { normal: true, terms: false, text: false };
    return m.json(opts).map(s => s.normal)
  };

  const toText$1 = function (m) {
    if (!m || !m.isView) {
      return ''
    }
    return m.text('normal')
  };

  // const toInfinitive = function (root) {
  //   const { verbToInfinitive } = root.methods.two.transform
  //   let str = root.text('normal')
  //   return verbToInfinitive(str, root.model, getTense(root))
  // }

  const toJSON = function (vb) {
    let parsed = parseVerb(vb);
    vb = vb.clone().toView();
    // const info = getGrammar(vb, parsed)
    return {
      root: parsed.root,
      preAdverbs: toArray(parsed.adverbs.pre),
      postAdverbs: toArray(parsed.adverbs.post),
      auxiliary: toText$1(parsed.auxiliary),
      negative: parsed.negative.found,
      prefix: toText$1(parsed.prefix),
      infinitive: parsed.root,
      // grammar: info,
    }
  };

  // import getSubject from './parse/getSubject.js'
  // import getGrammar from './parse/grammar/index.js'
  // import toNegative from './conjugate/toNegative.js'
  // import debug from './debug.js'

  // return the nth elem of a doc
  const getNth$4 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  const api$4 = function (View) {
    class Verbs extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Verbs';
      }
      parse(n) {
        return getNth$4(this, n).map(parseVerb)
      }
      json(opts, n) {
        let m = getNth$4(this, n);
        let arr = m.map((vb) => {
          let json = vb.toView().json(opts)[0] || {};
          json.verb = toJSON(vb);
          return json
        }, []);
        return arr
      }
      // subjects(n) {
      //   return getNth(this, n).map(vb => {
      //     let parsed = parseVerb(vb)
      //     return getSubject(vb, parsed).subject
      //   })
      // }
      // adverbs(n) {
      //   return getNth(this, n).map(vb => vb.match('#Adverb'))
      // }
      // isSingular(n) {
      //   return getNth(this, n).filter(vb => {
      //     return getSubject(vb).plural !== true
      //   })
      // }
      // isPlural(n) {
      //   return getNth(this, n).filter(vb => {
      //     return getSubject(vb).plural === true
      //   })
      // }
      // isImperative(n) {
      //   return getNth(this, n).filter(vb => vb.has('#Imperative'))
      // }
      // toInfinitive(n) {
      //   return getNth(this, n).map(vb => {
      //     let parsed = parseVerb(vb)
      //     let info = getGrammar(vb, parsed)
      //     return toInfinitive(vb, parsed, info.form)
      //   })
      // }
      // toPresentTense(n) {
      //   return getNth(this, n).map(vb => {
      //     let parsed = parseVerb(vb)
      //     let info = getGrammar(vb, parsed)
      //     return toPresent(vb, parsed, info.form)
      //   })
      // }
      // toPastTense(n) {
      //   return getNth(this, n).map(vb => {
      //     let parsed = parseVerb(vb)
      //     let info = getGrammar(vb, parsed)
      //     return toPast(vb, parsed, info.form)
      //   })
      // }
      // toFutureTense(n) {
      //   return getNth(this, n).map(vb => {
      //     let parsed = parseVerb(vb)
      //     let info = getGrammar(vb, parsed)
      //     return toFuture(vb, parsed, info.form)
      //   })
      // }
      // toGerund(n) {
      //   return getNth(this, n).map(vb => {
      //     let parsed = parseVerb(vb)
      //     let info = getGrammar(vb, parsed)
      //     return toGerund(vb, parsed, info.form)
      //   })
      // }
      conjugate(n) {
        const m = this.methods.two.transform.verb;
        return getNth$4(this, n).map((vb) => {
          let parsed = parseVerb(vb);
          let root = parsed.root || '';
          return {
            Infinitive: root,
            PastTense: m.toPast(root),
            PresentTense: m.toPresent(root),
            FutureTense: m.toFuture(root),
            Gerund: m.toGerund(root),
            Subjunctive: m.toSubjunctive(root),
            Imperfect: m.toImperfect(root),
            Conditional: m.toConditional(root),
            PastParticiple: m.toPastParticiple(root),
            PresentParticiple: m.toPresentParticiple(root),
          }
        }, [])
      }

      // /** return only verbs with 'not'*/
      // isNegative() {
      //   return this.if('#Negative')
      // }
      // /**  return only verbs without 'not'*/
      // isPositive() {
      //   return this.ifNo('#Negative')
      // }
      // /** remove 'not' from these verbs */
      // toPositive() {
      //   let m = this.match('do not #Verb')
      //   if (m.found) {
      //     m.remove('do not')
      //   }
      //   return this.remove('#Negative')
      // }
      // toNegative(n) {
      //   return getNth(this, n).map(vb => {
      //     let parsed = parseVerb(vb)
      //     let info = getGrammar(vb, parsed)
      //     return toNegative(vb, parsed, info.form)
      //   })
      // }
      // overloaded - keep Verb class
      update(pointer) {
        let m = new Verbs(this.document, pointer);
        m._cache = this._cache; // share this full thing
        return m
      }
    }
    Verbs.prototype.toPast = Verbs.prototype.toPastTense;
    Verbs.prototype.toPresent = Verbs.prototype.toPresentTense;
    Verbs.prototype.toFuture = Verbs.prototype.toFutureTense;

    View.prototype.verbs = function (n) {
      let vb = findVerbs(this);
      vb = getNth$4(vb, n);
      return new Verbs(this.document, vb.pointer)
    };
  };

  var verbs = {
    api: api$4,
  };

  const findNumbers = function (view) {
    let m = view.match('#Value+');
    //5-8
    m = m.splitAfter('#NumberRange');
    // june 5th 1999
    m = m.splitBefore('#Year');
    return m
  };

  let data = {
    ones: [
      [1, 'uno', 'primo', 'unesimo'],
      [2, 'due', 'secondo', 'duesimo'],
      [3, 'tre', 'terzo', 'treesimo'],
      [4, 'quattro', 'quarto', 'quattresimo'],
      [5, 'cinque', 'quinto', 'cinquesimo'],
      [6, 'sei', 'sesto', 'seiesimo'],
      [7, 'sette', 'settimo', 'settesimo'],
      [8, 'otto', 'ottavo', 'ottesimo'],
      [9, 'nove', 'nono', 'novesimo'],
      [10, 'dieci', 'decimo'],
      [11, 'undici', 'undicesimo'],
      [12, 'dodici', 'dodicesimo'],
      [13, 'tredici', 'tredicesimo'],
      [14, 'quattordici', 'quattordicesimo'],
      [15, 'quindici', 'quindicesimo'],
      [16, 'sedici', 'sedicesimo'],
      [17, 'diciassette', 'diciassettesimo'],
      [18, 'diciotto', 'diciottesimo'],
      [19, 'diciannove', 'diciannovesimo'],
    ],
    tens: [
      [20, 'venti', 'ventesimo'],
      [30, 'trenta', 'trentesimo'],
      [40, 'quaranta', 'quarantesimo'],
      [50, 'cinquanta', 'cinquantesimo'],
      [60, 'sessanta', 'sessantesimo'],
      [70, 'settanta', 'settantesimo'],
      [80, 'ottanta', 'ottantesimo'],
      [90, 'novanta', 'novantesimo'],
    ],
    hundreds: [
      [100, 'cento', 'centesimo'],
      [200, 'duecento', 'duecentesimo'],
      [300, 'trecento', 'trecentesimo'],
      [400, 'quattrocento', 'quattrocentesimo'],
      [500, 'cinquecento', 'cinquecentesimo'],
      [600, 'seicento', 'seicentesimo'],
      [700, 'settecento', 'settecentesimo'],
      [800, 'ottocento', 'ottocentesimo'],
      [900, 'novecento', 'novecentesimo'],
    ],
    multiples: [
      [1000, 'mille', 'millesimo'],
      [10000, 'diecimila', 'decimillesimo'],
      [100000, 'centomila', 'centomillesimo'],
      [1000000, 'milione', 'milionesimo'],
      [100000000, 'centomilion', 'centomilionesimo'],
      [1000000000, 'miliardo', 'miliardesimo']
    ]
  };


  const toCardinal = {};
  const toOrdinal = {};
  const tens$1 = {
    'trent': true,
    'vent': true,
    'cinquant': true,
    'sessant': true,
    'ottant': true,
    'settant': true,
    'quarant': true,
    'novant': true,
    'cento': true,
    'mille': true
  };
  const toNumber = {
    'dicias': 10,//diciassettesimo
    'dician': 10,//diciannovesimo
    'dici': 10,//diciottesimo
    'deci': 10,//decimilionesimo
    'cent': 100,//centottantesimo
  };
  // list end-strings, for tokenization
  let ends = ['cento', 'mille', 'milione', 'tré', 'mila', 'seiesimo', 'dodicesimo', 'decimo'];

  // add 'quarantuno'
  data.tens.forEach(a => {
    let str = a[1].replace(/[ia]$/, 'uno');
    data.ones.push([a[0] + 1, str, str]);
    str = a[1].replace(/[ia]$/, '');
    toNumber[str] = a[0]; //'vent' = 20
    tens$1[a[1]] = true;
  });

  Object.keys(data).forEach(k => {
    data[k].forEach(a => {
      let [num, card, ord, ord2] = a;
      ends.push(card);
      ends.push(ord);
      toCardinal[ord] = card;
      toNumber[card] = num;
      toOrdinal[card] = ord;
      // 'twenty-sixth'
      if (ord2) {
        toCardinal[ord2] = card;
        ends.push(ord2);
      }
    });
  });
  toNumber['tré'] = 3;
  toNumber['mila'] = 1000;
  toNumber['zero'] = 0;

  // sort by length (longest first)
  ends = ends.sort((a, b) => {
    if (a.length > b.length) {
      return -1
    } else if (a.length < b.length) {
      return 1
    }
    return 0
  });

  let multiples$1 = {
    mila: 1000,
  };
  data.multiples.forEach(a => {
    multiples$1[a[1]] = a[0];
  });

  // 'dieci|mila'
  toOrdinal['mila'] = 'millesimo';
  // ventiseiesimo
  toOrdinal['seiesimo'] = 'sei';
  toNumber['seiesimo'] = 6;

  // split 'centosessantasette' into  [ 'cento', 'sessanta', 'sette' ]
  const tokenize = function (str) {
    let tokens = [];
    let going = true;
    while (going) {
      let found = ends.find(end => str.endsWith(end));
      if (found) {
        tokens.push(found);
        str = str.substr(0, str.length - found.length);
      } else {
        going = false;
      }
    }
    if (str) {
      tokens.push(str);
    }
    // console.log(tokens)
    return tokens.filter(s => s).reverse()
  };

  const fromText = function (terms) {
    let sum = 0;
    let carry = 0;
    let minus = false;
    // get proper word tokens
    let str = terms.reduce((h, t) => {
      h += t.normal || '';
      return h
    }, '');
    let tokens = tokenize(str);
    // console.log(tokens)

    for (let i = 0; i < tokens.length; i += 1) {
      let w = tokens[i] || '';
      // minus eight
      if (w === 'meno') {
        minus = true;
        continue
      }
      // 'huitieme'
      if (toCardinal.hasOwnProperty(w)) {
        w = toCardinal[w];
      }
      // 'cent'
      if (multiples$1.hasOwnProperty(w)) {
        let mult = multiples$1[w] || 1;
        if (carry === 0) {
          carry = 1;
        }
        // console.log('carry', carry, 'mult', mult, 'sum', sum)
        sum += mult * carry;
        carry = 0;
        continue
      }
      // 'tres'
      if (toNumber.hasOwnProperty(w)) {
        carry += toNumber[w];
      }
    }
    // include any remaining
    if (carry !== 0) {
      sum += carry;
    }
    if (minus === true) {
      sum *= -1;
    }
    return sum
  };

  const fromNumber = function (m) {
    let str = m.text('normal').toLowerCase();
    str = str.replace(/(e|er)$/, '');
    let hasComma = false;
    if (/,/.test(str)) {
      hasComma = true;
      str = str.replace(/,/g, '');
    }
    // get prefix/suffix
    let arr = str.split(/([0-9.,]*)/);
    let [prefix, num] = arr;
    let suffix = arr.slice(2).join('');
    if (num !== '' && m.length < 2) {
      num = Number(num || str);
      //ensure that num is an actual number
      if (typeof num !== 'number') {
        num = null;
      }
      // strip an ordinal off the suffix
      if (suffix === 'e' || suffix === 'er') {
        suffix = '';
      }
    }
    return {
      hasComma,
      prefix,
      num,
      suffix,
    }
  };

  const parseNumber = function (m) {
    let terms = m.docs[0];
    let num = null;
    let prefix = '';
    let suffix = '';
    let hasComma = false;
    let isText = m.has('#TextValue');
    if (isText) {
      num = fromText(terms);
    } else {
      let res = fromNumber(m);
      prefix = res.prefix;
      suffix = res.suffix;
      num = res.num;
      hasComma = res.hasComma;
    }
    return {
      hasComma,
      prefix,
      num,
      suffix,
      isText,
      isOrdinal: m.has('#Ordinal'),
      isFraction: m.has('#Fraction'),
      isMoney: m.has('#Money'),
    }
  };

  let { ones, tens } = data;
  ones = [].concat(ones).reverse();
  tens = [].concat(tens).reverse();

  const multiples = [
    [1000000000, 'miliardo'],
    [100000000, 'centomilion'],
    [1000000, 'milione'],
    [100000, 'centomila'],
    [1000, 'mila'],
    [100, 'cento'],
    [1, ''],
  ];

  //turn number into an array of magnitudes, like [[5, mila], [2, cento]]
  const getMagnitudes = function (num) {
    let working = num;
    let have = [];
    multiples.forEach(a => {
      if (num >= a[0]) {
        let howmany = Math.floor(working / a[0]);
        working -= howmany * a[0];
        if (howmany) {
          have.push({
            unit: a[1],
            num: howmany,
          });
        }
      }
    });
    return have
  };


  // 25 -> ['venti', 'cinque']
  const twoDigit = function (num) {
    let words = [];
    // 20-90
    for (let i = 0; i < tens.length; i += 1) {
      if (tens[i][0] <= num) {
        words.push(tens[i][1]);
        num -= tens[i][0];
        break
      }
    }
    if (num === 0) {
      return words
    }
    // 0-19
    for (let i = 0; i < ones.length; i += 1) {
      if (ones[i][0] <= num) {
        let w = ones[i][1];
        if (words.length > 0) {
          // 'ventuno' not 'ventiuno'
          if (w === 'uno') {
            words[0] = words[0].replace(/[ia]$/, '');
          }
          // 'ventotto' not 'ventiotto'
          if (w === 'otto') {
            words[0] = words[0].replace(/[ia]$/, '');
          }
          // 'ventitré', not 'ventitre'
          if (w === 'tre') {
            w = w.replace(/e$/, 'é');
          }
        }
        words.push(w);
        num -= ones[i][0];
        break
      }
    }
    return words
  };

  const toText = function (num) {
    if (num === 0) {
      return ['zero']
    }
    let words = [];
    if (num < 0) {
      words.push('moins');
      num = Math.abs(num);
    }
    // handle multiples
    let found = getMagnitudes(num);
    found.forEach(obj => {
      // just 'cento', not 'unocento'
      if (obj.num === 1 && obj.unit) {
        // 1 'mille', not 'mila'
        if (obj.unit === 'mila') {
          words.push('mille');
          return
        }
        words.push(obj.unit);
        return
      }
      let res = twoDigit(obj.num);
      words = words.concat(res);
      if (obj.unit !== '') {
        words.push(obj.unit);
      }
    });
    return words
  };

  // which form should we use - 'quarto' or 'quattresimo'?
  const combos = {
    'uno': ['primo', 'unesimo'],
    'due': ['secondo', 'duesimo'],
    'tre': ['terzo', 'treesimo'],
    'quattro': ['quarto', 'quattresimo'],
    'cinque': ['quinto', 'cinquesimo'],
    'sei': ['sesto', 'seiesimo'],
    'sette': ['settimo', 'settesimo'],
    'otto': ['ottavo', 'ottesimo'],
    'nove': ['nono', 'novesimo'],
  };
  combos['tré'] = combos.tre;


  const toTextOrdinal = function (words) {
    if (words.length === 2 && words[0] === 'dieci' && words[1] === 'mila') {
      return 'decimillesimo'
    }
    // only convert the last word
    let last = words[words.length - 1];
    // which form should we use - 'quarto' or 'quattresimo'?
    if (combos.hasOwnProperty(last) && words.length > 1) {
      if (tens$1.hasOwnProperty(words[words.length - 2])) {
        // quattresimo
        words[words.length - 1] = combos[last][1];
      } else {
        // quarto
        words[words.length - 1] = combos[last][0];
      }
    } else if (toOrdinal.hasOwnProperty(last)) {
      words[words.length - 1] = toOrdinal[last];
    }
    let txt = words.join('');
    txt = txt.replace(/centoottan/, 'centottan');
    txt = txt.replace(/diecimilion/, 'decimilion');
    return txt
  };

  const formatNumber = function (parsed, fmt) {
    if (fmt === 'TextOrdinal') {
      let words = toText(parsed.num);
      return toTextOrdinal(words)
    }
    if (fmt === 'TextCardinal') {
      return toText(parsed.num).join('')
    }
    // numeric format - 107 -> '107°'
    if (fmt === 'Ordinal') {
      return String(parsed.num) + '°'
    }
    if (fmt === 'Cardinal') {
      return String(parsed.num)
    }
    return String(parsed.num || '')
  };

  // return the nth elem of a doc
  const getNth$3 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  const api$3 = function (View) {
    /**   */
    class Numbers extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Numbers';
      }
      parse(n) {
        return getNth$3(this, n).map(parseNumber)
      }
      get(n) {
        return getNth$3(this, n).map(parseNumber).map(o => o.num)
      }
      json(n) {
        let doc = getNth$3(this, n);
        return doc.map(p => {
          let json = p.toView().json(n)[0];
          let parsed = parseNumber(p);
          json.number = {
            prefix: parsed.prefix,
            num: parsed.num,
            suffix: parsed.suffix,
            hasComma: parsed.hasComma,
          };
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
        let m = this.if('#TextValue');
        let res = m.map(val => {
          let obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          let str = formatNumber(obj, fmt);
          if (str) {
            val.replaceWith(str, { tags: true });
            val.tag('NumericValue');
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      /** convert to numeric form like 'eight' or 'eighth' */
      toText() {
        let m = this;
        let res = m.map(val => {
          if (val.has('#TextValue')) {
            return val
          }
          let obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          let str = formatNumber(obj, fmt);
          if (str) {
            val.replaceWith(str, { tags: true });
            val.tag('TextValue');
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      /** convert ordinal to cardinal form, like 'eight', or '8' */
      toCardinal() {
        let m = this;
        let res = m.map(val => {
          if (!val.has('#Ordinal')) {
            return val
          }
          let obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#TextValue') ? 'TextCardinal' : 'Cardinal';
          let str = formatNumber(obj, fmt);
          if (str) {
            val.replaceWith(str, { tags: true });
            val.tag('Cardinal');
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      /** convert cardinal to ordinal form, like 'eighth', or '8th' */
      toOrdinal() {
        let m = this;
        let res = m.map(val => {
          if (val.has('#Ordinal')) {
            return val
          }
          let obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#TextValue') ? 'TextOrdinal' : 'Ordinal';
          let str = formatNumber(obj, fmt);
          if (str) {
            val.replaceWith(str, { tags: true });
            val.tag('Ordinal');
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }

      /** return only numbers that are == n */
      isEqual(n) {
        return this.filter((val) => {
          let num = parseNumber(val).num;
          return num === n
        })
      }
      /** return only numbers that are > n*/
      greaterThan(n) {
        return this.filter((val) => {
          let num = parseNumber(val).num;
          return num > n
        })
      }
      /** return only numbers that are < n*/
      lessThan(n) {
        return this.filter((val) => {
          let num = parseNumber(val).num;
          return num < n
        })
      }
      /** return only numbers > min and < max */
      between(min, max) {
        return this.filter((val) => {
          let num = parseNumber(val).num;
          return num > min && num < max
        })
      }
      /** set these number to n */
      set(n) {
        if (n === undefined) {
          return this // don't bother
        }
        if (typeof n === 'string') {
          n = parseNumber(n).num;
        }
        let m = this;
        let res = m.map((val) => {
          let obj = parseNumber(val);
          obj.num = n;
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          if (val.has('#TextValue')) {
            fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          }
          let str = formatNumber(obj, fmt);
          // add commas to number
          if (obj.hasComma && fmt === 'Cardinal') {
            str = Number(str).toLocaleString();
          }
          if (str) {
            val = val.not('#Currency');
            val.replaceWith(str, { tags: true });
            // handle plural/singular unit
            // agreeUnits(agree, val, obj)
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      add(n) {
        if (!n) {
          return this // don't bother
        }
        if (typeof n === 'string') {
          n = parseNumber(n).num;
        }
        let m = this;
        let res = m.map((val) => {
          let obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          obj.num += n;
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          if (obj.isText) {
            fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          }
          let str = formatNumber(obj, fmt);
          if (str) {
            val.replaceWith(str, { tags: true });
            // handle plural/singular unit
            // agreeUnits(agree, val, obj)
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      /** decrease each number by n*/
      subtract(n, agree) {
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
        let m = new Numbers(this.document, pointer);
        m._cache = this._cache; // share this full thing
        return m
      }
    }
    // aliases
    Numbers.prototype.isBetween = Numbers.prototype.between;
    Numbers.prototype.minus = Numbers.prototype.subtract;
    Numbers.prototype.plus = Numbers.prototype.add;
    Numbers.prototype.equals = Numbers.prototype.isEqual;

    View.prototype.numbers = function (n) {
      let m = findNumbers(this);
      m = getNth$3(m, n);
      return new Numbers(this.document, m.pointer)
    };
    // alias
    View.prototype.values = View.prototype.numbers;
  };

  var numbers = {
    api: api$3
  };

  const getNth$2 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  // get root form of adjective
  const getRoot$1 = function (m) {
    m.compute('root');
    let str = m.text('root');
    return str
  };

  const api$2 = function (View) {
    class Adjectives extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Adjectives';
      }
      conjugate(n) {
        const methods = this.methods.two.transform.adjective;
        return getNth$2(this, n).map(m => {
          let str = getRoot$1(m);
          return {
            male: str,
            female: methods.toFemale(str),
            plural: methods.toPlural(str),
            femalePlural: methods.toFemalePlural(str),
          }
        }, [])
      }
    }

    View.prototype.adjectives = function (n) {
      let m = this.match('#Adjective');
      m = getNth$2(m, n);
      return new Adjectives(this.document, m.pointer)
    };
  };

  var adjectives = {
    api: api$2,
  };

  const getNth$1 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  // get root form of adjective
  const getRoot = function (m) {
    m.compute('root');
    let str = m.text('root');
    // let isPlural = m.has('#PluralNoun')
    // if (isPlural) {
    //   return transform.adjective.fromPlural(str)
    // }
    return str
  };

  const api$1 = function (View) {
    class Nouns extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Nouns';
      }
      conjugate(n) {
        const methods = this.methods.two.transform.noun;
        return getNth$1(this, n).map(m => {
          let str = m.text();
          if (m.has('#PluralNoun')) {
            return {
              plural: str,
              singular: methods.fromPlural(str)
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
            plural: methods.toPlural(str)
          }
        }, [])
      }
      isPlural(n) {
        return getNth$1(this, n).if('#PluralNoun')
      }
      toPlural(n) {
        const methods = this.methods.two.transform.noun;
        return getNth$1(this, n).if('#Singular').map(m => {
          let str = getRoot(m);
          let plural = methods.toPlural(str);
          return m.replaceWith(plural)
        })
      }
      toSingular(n) {
        const methods = this.methods.two.transform.noun;
        return getNth$1(this, n).if('#PluralNoun').map(m => {
          let str = getRoot(m);
          let singular = methods.fromPlural(str);
          return m.replaceWith(singular)
        })
      }
    }

    View.prototype.nouns = function (n) {
      let m = this.match('#Noun');
      m = getNth$1(m, n);
      return new Nouns(this.document, m.pointer)
    };
  };

  var nouns = {
    api: api$1,
  };

  // return the nth elem of a doc
  const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  const api = function (View) {
    /**   */
    class Contractions extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Contraction';
      }

      expand() {
        return this
      }
      // overloaded - keep Contraction class
      update(pointer) {
        let m = new Contractions(this.document, pointer);
        m._cache = this._cache; // share this full thing
        return m
      }
    }

    View.prototype.contractions = function (n) {
      let m = this.match('@hasContraction');
      m = getNth(m, n);
      return new Contractions(this.document, m.pointer)
    };
  };

  var contractions = {
    api,
  };

  nlp.plugin(tokenize$1);
  nlp.plugin(tagset);
  nlp.plugin(lexicon);
  nlp.plugin(preTagger);
  nlp.plugin(postTagger);
  nlp.plugin(verbs);
  nlp.plugin(numbers);
  nlp.plugin(adjectives);
  nlp.plugin(nouns);
  nlp.plugin(contractions);

  const it = function (txt, lex) {
    return nlp(txt, lex)
  };

  // copy constructor methods over
  Object.keys(nlp).forEach(k => {
    if (nlp.hasOwnProperty(k)) {
      it[k] = nlp[k];
    }
  });

  // this one is hidden
  Object.defineProperty(it, '_world', {
    value: nlp._world,
    writable: true,
  });

  /** log the decision-making to console */
  it.verbose = function (set) {
    let env = typeof process === 'undefined' ? self.env || {} : process.env; //use window, in browser
    env.DEBUG_TAGS = set === 'tagger' || set === true ? true : '';
    env.DEBUG_MATCH = set === 'match' || set === true ? true : '';
    env.DEBUG_CHUNKS = set === 'chunker' || set === true ? true : '';
    return this
  };
  it.version = version;

  return it;

}));
