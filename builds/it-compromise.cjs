(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.itCompromise = factory());
})(this, (function () { 'use strict';

  let methods$n = {
    one: {},
    two: {},
    three: {},
    four: {},
  };

  let model$6 = {
    one: {},
    two: {},
    three: {},
  };
  let compute$9 = {};
  let hooks = [];

  var tmpWrld = { methods: methods$n, model: model$6, compute: compute$9, hooks };

  const isArray$9 = input => Object.prototype.toString.call(input) === '[object Array]';

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
      else if (isArray$9(input)) {
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
  var compute$8 = fns$4;

  // wrappers for loops in javascript arrays

  const forEach = function (cb) {
    let ptrs = this.fullPointer;
    ptrs.forEach((ptr, i) => {
      let view = this.update([ptr]);
      cb(view, i);
    });
    return this
  };

  const map = function (cb, empty) {
    let ptrs = this.fullPointer;
    let res = ptrs.map((ptr, i) => {
      let view = this.update([ptr]);
      let out = cb(view, i);
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
      let view = this.update([ptr]);
      return cb(view, i)
    });
    let res = this.update(ptrs);
    return res
  };

  const find$2 = function (cb) {
    let ptrs = this.fullPointer;
    let found = ptrs.find((ptr, i) => {
      let view = this.update([ptr]);
      return cb(view, i)
    });
    return this.update([found])
  };

  const some = function (cb) {
    let ptrs = this.fullPointer;
    return ptrs.some((ptr, i) => {
      let view = this.update([ptr]);
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
  var loops = { forEach, map, filter, find: find$2, some, random };

  const utils = {
    /** */
    termList: function () {
      return this.methods.one.termList(this.docs)
    },
    /** return individual terms*/
    terms: function (n) {
      let m = this.match('.');
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
      let res = {};
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
      let n = this.fullPointer.length - 1;
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
      let ptrs = this.fullPointer.map(a => [a[0]]); //lazy!
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
      let aPtr = this.fullPointer;
      let bPtr = b.fullPointer;
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
      let ptrs = this.pointer;
      if (!ptrs) {
        return true
      }
      let document = this.document;
      for (let i = 0; i < ptrs.length; i += 1) {
        let [n, start, end] = ptrs[i];
        // it's not the start
        if (n !== i || start !== 0) {
          return false
        }
        // it's too short
        if (document[n].length > end) {
          return false
        }
      }
      return true
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
  var util = utils;

  const methods$m = Object.assign({}, util, compute$8, loops);

  // aliases
  methods$m.get = methods$m.eq;
  var api$l = methods$m;

  class View {
    constructor(document, pointer, groups = {}) {
      // invisible props
      [
        ['document', document],
        ['world', tmpWrld],
        ['_groups', groups],
        ['_cache', null],
        ['viewType', 'View']
      ].forEach(a => {
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
      let { docs, ptrs, document } = this;
      // compute a proper pointer, from docs
      let pointers = ptrs || docs.map((_d, n) => [n]);
      // do we need to repair it, first?
      return pointers.map(a => {
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
      let m = new View(this.document, pointer);
      // send the cache down, too?
      if (this._cache && pointer && pointer.length > 0) {
        // only keep cache if it's a full-sentence
        let cache = [];
        pointer.forEach((ptr, i) => {
          let [n, start, end] = ptr;
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
      let document = methods.one.tokenize.fromString(input, this.world);
      let doc = new View(document);
      doc.world = this.world;
      doc.compute(['normal', 'lexicon']);
      if (this.world.compute.preTagger) {
        doc.compute('preTagger');
      }
      return doc
    }
    clone() {
      // clone the whole document
      let document = this.document.slice(0);
      document = document.map(terms => {
        return terms.map(term => {
          term = Object.assign({}, term);
          term.tags = new Set(term.tags);
          return term
        })
      });
      // clone only sub-document ?
      let m = this.update(this.pointer);
      m.document = document;
      m._cache = this._cache; //clone this too?
      return m
    }
  }
  Object.assign(View.prototype, api$l);
  var View$1 = View;

  var version$1 = '14.8.1';

  const isObject$6 = function (item) {
    return item && typeof item === 'object' && !Array.isArray(item)
  };

  // recursive merge of objects
  function mergeDeep(model, plugin) {
    if (isObject$6(plugin)) {
      for (const key in plugin) {
        if (isObject$6(plugin[key])) {
          if (!model[key]) Object.assign(model, { [key]: {} });
          mergeDeep(model[key], plugin[key]); //recursion
          // } else if (isArray(plugin[key])) {
          // console.log(key)
          // console.log(model)
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
      model[key] = model[key] || {};
      Object.assign(model[key], plugin[key]);
    }
    return model
  }

  const addIrregulars = function (model, conj) {
    let m = model.two.models || {};
    Object.keys(conj).forEach(k => {
      // verb forms
      if (conj[k].pastTense) {
        if (m.toPast) {
          m.toPast.exceptions[k] = conj[k].pastTense;
        }
        if (m.fromPast) {
          m.fromPast.exceptions[conj[k].pastTense] = k;
        }
      }
      if (conj[k].presentTense) {
        if (m.toPresent) {
          m.toPresent.exceptions[k] = conj[k].presentTense;
        }
        if (m.fromPresent) {
          m.fromPresent.exceptions[conj[k].presentTense] = k;
        }
      }
      if (conj[k].gerund) {
        if (m.toGerund) {
          m.toGerund.exceptions[k] = conj[k].gerund;
        }
        if (m.fromGerund) {
          m.fromGerund.exceptions[conj[k].gerund] = k;
        }
      }
      // adjective forms
      if (conj[k].comparative) {
        if (m.toComparative) {
          m.toComparative.exceptions[k] = conj[k].comparative;
        }
        if (m.fromComparative) {
          m.fromComparative.exceptions[conj[k].comparative] = k;
        }
      }
      if (conj[k].superlative) {
        if (m.toSuperlative) {
          m.toSuperlative.exceptions[k] = conj[k].superlative;
        }
        if (m.fromSuperlative) {
          m.fromSuperlative.exceptions[conj[k].superlative] = k;
        }
      }
    });
  };

  const extend = function (plugin, world, View, nlp) {
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
      Object.keys(plugin.lib).forEach(k => nlp[k] = plugin.lib[k]);
    }
    if (plugin.tags) {
      nlp.addTags(plugin.tags);
    }
    if (plugin.words) {
      nlp.addWords(plugin.words);
    }
    if (plugin.mutate) {
      plugin.mutate(world);
    }
  };
  var extend$1 = extend;

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
    let doc = new View([]);
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
      let document = methods.one.tokenize.fromString(input, world);
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
        let document = preTokenized(input);
        return new View(document)
      }
      // handle json output
      let document = fromJson(input);
      return new View(document)
    }
    return doc
  };
  var handleInputs = inputs;

  let world = Object.assign({}, tmpWrld);

  const nlp = function (input, lex) {
    if (lex) {
      nlp.addWords(lex);
    }
    let doc = handleInputs(input, View$1, world);
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
    let doc = handleInputs(input, View$1, world);
    // give contractions a shot, at least
    if (compute.contractions) {
      doc.compute(['alias', 'normal', 'machine', 'contractions']); //run it if we've got it
    }
    return doc
  };

  /** extend compromise functionality */
  nlp.plugin = function (plugin) {
    extend$1(plugin, this._world, View$1, this);
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

  var nlp$1 = nlp;

  const createCache = function (document) {
    let cache = document.map(terms => {
      let stuff = new Set();
      terms.forEach(term => {
        // add words
        if (term.normal !== '') {
          stuff.add(term.normal);
        }
        // cache switch-status - '%Noun|Verb%'
        if (term.switch) {
          stuff.add(`%${term.switch}%`);
        }
        // cache implicit words, too
        if (term.implicit) {
          stuff.add(term.implicit);
        }
        if (term.machine) {
          stuff.add(term.machine);
        }
        if (term.root) {
          stuff.add(term.root);
        }
        // cache slashes words, etc
        if (term.alias) {
          term.alias.forEach(str => stuff.add(str));
        }
        let tags = Array.from(term.tags);
        for (let t = 0; t < tags.length; t += 1) {
          stuff.add('#' + tags[t]);
        }
      });
      return stuff
    });
    return cache
  };
  var cacheDoc = createCache;

  var methods$l = {
    one: {
      cacheDoc,
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
  var api$k = addAPI$3;

  var compute$7 = {
    cache: function (view) {
      view._cache = view.methods.one.cacheDoc(view.document);
    }
  };

  var cache$1 = {
    api: api$k,
    compute: compute$7,
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
  const isTitleCase$1 = (str) => /^\p{Lu}[\p{Ll}'’]/u.test(str) || /^\p{Lu}$/u.test(str);
  const toTitleCase = (str) => str.replace(/^\p{Ll}/u, x => x.toUpperCase());
  const toLowerCase = (str) => str.replace(/^\p{Lu}/u, x => x.toLowerCase());

  // splice an array into an array
  const spliceArr = (parent, index, child) => {
    // tag them as dirty
    child.forEach(term => term.dirty = true);
    if (parent) {
      let args = [index, 0].concat(child);
      Array.prototype.splice.apply(parent, args);
    }
    return parent
  };

  // add a space at end, if required
  const endSpace = function (terms) {
    const hasSpace = / $/;
    const hasDash = /[-–—]/;
    let lastTerm = terms[terms.length - 1];
    if (lastTerm && !hasSpace.test(lastTerm.post) && !hasDash.test(lastTerm.post)) {
      lastTerm.post += ' ';
    }
  };

  // sentence-ending punctuation should move in append
  const movePunct = (source, end, needle) => {
    const juicy = /[-.?!,;:)–—'"]/g;
    let wasLast = source[end - 1];
    if (!wasLast) {
      return
    }
    let post = wasLast.post;
    if (juicy.test(post)) {
      let punct = post.match(juicy).join(''); //not perfect
      let last = needle[needle.length - 1];
      last.post = punct + last.post;
      // remove it, from source
      wasLast.post = wasLast.post.replace(juicy, '');
    }
  };


  const moveTitleCase = function (home, start, needle) {
    let from = home[start];
    // should we bother?
    if (start !== 0 || !isTitleCase$1(from.text)) {
      return
    }
    // titlecase new first term
    needle[0].text = toTitleCase(needle[0].text);
    // should we un-titlecase the old word?
    let old = home[start];
    if (old.tags.has('ProperNoun') || old.tags.has('Acronym')) {
      return
    }
    if (isTitleCase$1(old.text) && old.text.length > 1) {
      old.text = toLowerCase(old.text);
    }
  };

  // put these words before the others
  const cleanPrepend = function (home, ptr, needle, document) {
    let [n, start, end] = ptr;
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
    let [n, , end] = ptr;
    let total = (document[n] || []).length;
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
  let index$2 = 0;

  const pad3 = (str) => {
    str = str.length < 3 ? '0' + str : str;
    return str.length < 3 ? '0' + str : str
  };

  const toId = function (term) {
    let [n, i] = term.index || [0, 0];
    index$2 += 1;

    //don't overflow index
    index$2 = index$2 > 46655 ? 0 : index$2;
    //don't overflow sentences
    n = n > 46655 ? 0 : n;
    // //don't overflow terms
    i = i > 1294 ? 0 : i;

    // 3 digits for time
    let id = pad3(index$2.toString(36));
    // 3 digit  for sentence index (46k)
    id += pad3(n.toString(36));

    // 1 digit for term index (36)
    let tx = i.toString(36);
    tx = tx.length < 2 ? '0' + tx : tx; //pad2
    id += tx;

    // 1 digit random number
    let r = parseInt(Math.random() * 36, 10);
    id += (r).toString(36);

    return term.normal + '|' + id.toUpperCase()
  };

  var uuid = toId;

  // setInterval(() => console.log(toId(4, 12)), 100)

  // are we inserting inside a contraction?
  // expand it first
  const expand$2 = function (m) {
    if (m.has('@hasContraction') && typeof m.contractions === 'function') {//&& m.after('^.').has('@hasContraction')
      let more = m.grow('@hasContraction');
      more.contractions().expand();
    }
  };

  const isArray$7 = (arr) => Object.prototype.toString.call(arr) === '[object Array]';

  // set new ids for each terms
  const addIds$2 = function (terms) {
    terms = terms.map((term) => {
      term.id = uuid(term);
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
    let ptrs = view.fullPointer;
    let selfPtrs = view.fullPointer;
    view.forEach((m, i) => {
      let ptr = m.fullPointer[0];
      let [n] = ptr;
      // add-in the words
      let home = document[n];
      let terms = getTerms(input, world);
      // are we inserting nothing?
      if (terms.length === 0) {
        return
      }
      terms = addIds$2(terms);
      if (prepend) {
        expand$2(view.update([ptr]).firstTerm());
        cleanPrepend(home, ptr, terms, document);
      } else {
        expand$2(view.update([ptr]).lastTerm());
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
    let doc = view.toView(ptrs);
    // shift our self pointer, if necessary
    view.ptrs = selfPtrs;
    // try to tag them, too
    doc.compute(['id', 'index', 'lexicon']);
    if (doc.world.compute.preTagger) {
      doc.compute('preTagger');
    }
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

  var insert$1 = fns$3;

  const dollarStub = /\$[0-9a-z]+/g;
  const fns$2 = {};

  const titleCase$2 = function (str) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase())
  };

  // doc.replace('foo', (m)=>{})
  const replaceByFn = function (main, fn) {
    main.forEach(m => {
      let out = fn(m);
      m.replaceWith(out);
    });
    return main
  };

  // support 'foo $0' replacements
  const subDollarSign = function (input, main) {
    if (typeof input !== 'string') {
      return input
    }
    let groups = main.groups();
    input = input.replace(dollarStub, (a) => {
      let num = a.replace(/\$/, '');
      if (groups.hasOwnProperty(num)) {
        return groups[num].text()
      }
      return a
    });
    return input
  };

  fns$2.replaceWith = function (input, keep = {}) {
    let ptrs = this.fullPointer;
    let main = this;
    this.uncache();
    if (typeof input === 'function') {
      return replaceByFn(main, input)
    }
    // support 'foo $0' replacements
    input = subDollarSign(input, main);

    let original = this.update(ptrs);
    // soften-up pointer
    ptrs = ptrs.map(ptr => ptr.slice(0, 3));
    // original.freeze()
    let oldTags = (original.docs[0] || []).map(term => Array.from(term.tags));
    // slide this in
    if (typeof input === 'string') {
      input = this.fromText(input).compute('id');
    }
    main.insertAfter(input);
    // are we replacing part of a contraction?
    if (original.has('@hasContraction') && main.contractions) {
      let more = main.grow('@hasContraction+');
      more.contractions().expand();
    }
    // delete the original terms
    main.delete(original); //science.
    // what should we return?
    let m = main.toView(ptrs).compute(['index', 'lexicon']);
    if (m.world.compute.preTagger) {
      m.compute('preTagger');
    }
    // replace any old tags
    if (keep.tags) {
      m.terms().forEach((term, i) => {
        term.tagSafe(oldTags[i]);
      });
    }
    // try to co-erce case, too
    if (keep.case && m.docs[0] && m.docs[0][0] && m.docs[0][0].index[1] === 0) {
      m.docs[0][0].text = titleCase$2(m.docs[0][0].text);
    }
    // console.log(input.docs[0])
    // let regs = input.docs[0].map(t => {
    //   return { id: t.id, optional: true }
    // })
    // m.after('(a|hoy)').debug()
    // m.growRight('(a|hoy)').debug()
    // console.log(m)
    return m
  };

  fns$2.replace = function (match, input, keep) {
    if (match && !input) {
      return this.replaceWith(match, keep)
    }
    let m = this.match(match);
    if (!m.found) {
      return this
    }
    this.soften();
    return m.replaceWith(input, keep)
  };
  var replace = fns$2;

  // transfer sentence-ending punctuation
  const repairPunct = function (terms, len) {
    let last = terms.length - 1;
    let from = terms[last];
    let to = terms[last - len];
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
      let [n, start, end] = ptr;
      let len = end - start;
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
          let terms = document[i - 1];
          let lastTerm = terms[terms.length - 1];
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

  var pluckOutTerm = pluckOut;

  const fixPointers$1 = function (ptrs, gonePtrs) {
    ptrs = ptrs.map(ptr => {
      let [n] = ptr;
      if (!gonePtrs[n]) {
        return ptr
      }
      gonePtrs[n].forEach(no => {
        let len = no[2] - no[1];
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
      let isFull = !self.ptrs;
      // is it part of a contraction?
      if (not.has('@hasContraction') && not.contractions) {
        let more = not.grow('@hasContraction');
        more.contractions().expand();
      }

      let ptrs = self.fullPointer;
      let nots = not.fullPointer.reverse();
      // remove them from the actual document)
      let document = pluckOutTerm(this.document, nots);
      // repair our pointers
      let gonePtrs = indexN(nots);
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
      let res = self.toView(ptrs); //return new document
      return res
    },
  };

  // aliases
  methods$j.delete = methods$j.remove;
  var remove = methods$j;

  const methods$i = {
    /** add this punctuation or whitespace before each match: */
    pre: function (str, concat) {
      if (str === undefined && this.found) {
        return this.docs[0][0].pre
      }
      this.docs.forEach(terms => {
        let term = terms[0];
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
        let last = this.docs[this.docs.length - 1];
        return last[last.length - 1].post
      }
      this.docs.forEach(terms => {
        let term = terms[terms.length - 1];
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
      let docs = this.docs;
      let start = docs[0][0];
      start.pre = start.pre.trimStart();
      let last = docs[docs.length - 1];
      let end = last[last.length - 1];
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
        let last = terms[terms.length - 1];
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
        let last = terms[terms.length - 1];
        last.post = end + last.post;
      });
      return this
    },
  };
  methods$i.deHyphenate = methods$i.dehyphenate;
  methods$i.toQuotation = methods$i.toQuotations;

  var whitespace = methods$i;

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
    let left = a.normal.trim().length;
    let right = b.normal.trim().length;
    if (left < right) {
      return 1
    }
    if (left > right) {
      return -1
    }
    return 0
  };

  /** count the # of terms in each match */
  const wordCount$2 = (a, b) => {
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
    let counts = {};
    arr.forEach(o => {
      counts[o.normal] = counts[o.normal] || 0;
      counts[o.normal] += 1;
    });
    // sort by freq
    arr.sort((a, b) => {
      let left = counts[a.normal];
      let right = counts[b.normal];
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

  var methods$h = { alpha, length, wordCount: wordCount$2, sequential, byFreq };

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
    let { docs, pointer } = this;
    this.uncache();
    if (typeof input === 'function') {
      return customSort(this, input)
    }
    input = input || 'alpha';
    let ptrs = pointer || docs.map((_d, n) => [n]);
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
  const reverse$2 = function () {
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
    let already = new Set();
    let res = this.filter(m => {
      let txt = m.text('machine');
      if (already.has(txt)) {
        return false
      }
      already.add(txt);
      return true
    });
    // this.ptrs = res.ptrs //mutate original?
    return res//.compute('index')
  };

  var sort$1 = { unique, reverse: reverse$2, sort };

  const isArray$6 = (arr) => Object.prototype.toString.call(arr) === '[object Array]';

  // append a new document, somehow
  const combineDocs = function (homeDocs, inputDocs) {
    if (homeDocs.length > 0) {
      // add a space
      let end = homeDocs[homeDocs.length - 1];
      let last = end[end.length - 1];
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
      let ptrs = home.fullPointer.concat(input.fullPointer);
      return home.toView(ptrs).compute('index')
    }
    // update n of new pointer, to end of our pointer
    let ptrs = input.fullPointer;
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
        let more = this.fromText(input);
        // easy concat
        if (!this.found || !this.ptrs) {
          this.document = this.document.concat(more.document);
        } else {
          // if we are in the middle, this is actually a splice operation
          let ptrs = this.fullPointer;
          let at = ptrs[ptrs.length - 1][0];
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
        let docs = combineDocs(this.document, input);
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

  const methods$g = Object.assign({}, caseFns, insert$1, replace, remove, whitespace, sort$1, concat, harden$1);

  const addAPI$2 = function (View) {
    Object.assign(View.prototype, methods$g);
  };
  var api$j = addAPI$2;

  const compute$5 = {
    id: function (view) {
      let docs = view.docs;
      for (let n = 0; n < docs.length; n += 1) {
        for (let i = 0; i < docs[n].length; i += 1) {
          let term = docs[n][i];
          term.id = term.id || uuid(term);
        }
      }
    }
  };

  var compute$6 = compute$5;

  var change = {
    api: api$j,
    compute: compute$6,
  };

  var contractions$5 = [
    // simple mappings
    { word: '@', out: ['at'] },
    { word: 'alot', out: ['a', 'lot'] },
    { word: 'brb', out: ['be', 'right', 'back'] },
    { word: 'cannot', out: ['can', 'not'] },
    { word: 'cant', out: ['can', 'not'] },
    { word: 'dont', out: ['do', 'not'] },
    { word: 'dun', out: ['do', 'not'] },
    { word: 'wont', out: ['will', 'not'] },
    { word: "can't", out: ['can', 'not'] },
    { word: "shan't", out: ['should', 'not'] },
    { word: "won't", out: ['will', 'not'] },
    { word: "that's", out: ['that', 'is'] },
    { word: "what's", out: ['what', 'is'] },
    { word: "let's", out: ['let', 'us'] },
    { word: "there's", out: ['there', 'is'] },
    { word: 'dunno', out: ['do', 'not', 'know'] },
    { word: 'gonna', out: ['going', 'to'] },
    { word: 'gotta', out: ['have', 'got', 'to'] }, //hmm
    { word: 'gimme', out: ['give', 'me'] },
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
    // apostrophe d
    { word: 'howd', out: ['how', 'did'] },
    { word: 'whatd', out: ['what', 'did'] },
    { word: 'whend', out: ['when', 'did'] },
    { word: 'whered', out: ['where', 'did'] },
    // shoulda, coulda
    { word: 'shoulda', out: ['should', 'have'] },
    { word: 'coulda', out: ['coulda', 'have'] },
    { word: 'woulda', out: ['woulda', 'have'] },
    { word: 'musta', out: ['must', 'have'] },

    // { after: `cause`, out: ['because'] },
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
  ];

  var model$5 = { one: { contractions: contractions$5 } };

  // put n new words where 1 word was
  const insertContraction = function (document, point, words) {
    let [n, w] = point;
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
  var splice = insertContraction;

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
    let before = terms[i].normal.split(hasContraction$1)[0];

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
  var apostropheD = _apostropheD;

  //ain't -> are/is not
  const apostropheT = function (terms, i) {
    if (terms[i].normal === "ain't" || terms[i].normal === 'aint') {
      return null //do this in ./two/
    }
    let before = terms[i].normal.replace(/n't/, '');
    return [before, 'not']
  };

  var apostropheT$1 = apostropheT;

  const hasContraction = /'/;

  // l'amour
  const preL = (terms, i) => {
    // le/la
    let after = terms[i].normal.split(hasContraction)[1];
    // quick french gender disambig (rough)
    if (after && after.endsWith('e')) {
      return ['la', after]
    }
    return ['le', after]
  };

  // d'amerique
  const preD = (terms, i) => {
    let after = terms[i].normal.split(hasContraction)[1];
    // quick guess for noun-agreement (rough)
    if (after && after.endsWith('e')) {
      return ['du', after]
    } else if (after && after.endsWith('s')) {
      return ['des', after]
    }
    return ['de', after]
  };

  // j'aime
  const preJ = (terms, i) => {
    let after = terms[i].normal.split(hasContraction)[1];
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
    let term = terms[i];
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
  var numberRange$1 = numberRange;

  const numUnit = /^([+-]?[0-9][.,0-9]*)([a-z°²³µ/]+)$/; //(must be lowercase)

  const notUnit = new Set([
    'st',
    'nd',
    'rd',
    'th',
    'am',
    'pm',
    'max',
    '°',
    's', // 1990s
    'e' // 18e - french/spanish ordinal
  ]);

  const numberUnit = function (terms, i) {
    let term = terms[i];
    let parts = term.text.match(numUnit);
    if (parts !== null) {
      // is it a recognized unit, like 'km'?
      let unit = parts[2].toLowerCase().trim();
      // don't split '3rd'
      if (notUnit.has(unit)) {
        return null
      }
      return [parts[1], unit] //split it
    }
    return null
  };
  var numberUnit$1 = numberUnit;

  const byApostrophe = /'/;
  const numDash = /^[0-9][^-–—]*[-–—].*?[0-9]/;

  // run tagger on our new implicit terms
  const reTag = function (terms, view, start, len) {
    let tmp = view.update();
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
    t: (terms, i) => apostropheT$1(terms, i),
    // how'd
    d: (terms, i) => apostropheD(terms, i),
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
      let o = list[i];
      // look for word-word match (cannot-> [can, not])
      if (o.word === term.normal) {
        return o.out
      }
      // look for after-match ('re -> [_, are])
      else if (after !== null && after === o.after) {
        return [before].concat(o.out)
      }
      // look for before-match (l' -> [le, _])
      else if (before !== null && before === o.before) {
        return o.out.concat(after)
        // return [o.out, after] //typeof o.out === 'string' ? [o.out, after] : o.out(terms, i)
      }
    }
    return null
  };

  const toDocs = function (words, view) {
    let doc = view.fromText(words.join(' '));
    doc.compute(['id', 'alias']);
    return doc.docs[0]
  };

  //really easy ones
  const contractions$3 = (view) => {
    let { world, document } = view;
    const { model, methods } = world;
    let list = model.one.contractions || [];
    new Set(model.one.units || []);
    // each sentence
    document.forEach((terms, n) => {
      // loop through terms backwards
      for (let i = terms.length - 1; i >= 0; i -= 1) {
        let before = null;
        let after = null;
        if (byApostrophe.test(terms[i].normal) === true) {
          [before, after] = terms[i].normal.split(byApostrophe);
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
        // actually insert the new terms
        if (words) {
          words = toDocs(words, view);
          splice(document, [n, i], words);
          reTag(document[n], view, i, words.length);
          continue
        }
        // '44-2' has special care
        if (numDash.test(terms[i].normal)) {
          words = numberRange$1(terms, i);
          if (words) {
            words = toDocs(words, view);
            splice(document, [n, i], words);
            methods.one.setTag(words, 'NumberRange', world);//add custom tag
            // is it a time-range, like '5-9pm'
            if (words[2] && words[2].tags.has('Time')) {
              methods.one.setTag([words[0]], 'Time', world, null, 'time-range');
            }
            reTag(document[n], view, i, words.length);
          }
          continue
        }
        // split-apart '4km'
        words = numberUnit$1(terms, i);
        if (words) {
          words = toDocs(words, view);
          splice(document, [n, i], words);
          methods.one.setTag([words[1]], 'Unit', world, null, 'contraction-unit');
        }
      }
    });
  };
  var contractions$4 = contractions$3;

  var compute$4 = { contractions: contractions$4 };

  const plugin = {
    model: model$5,
    compute: compute$4,
    hooks: ['contractions'],
  };
  var contractions$2 = plugin;

  // scan-ahead to match multiple-word terms - 'jack rabbit'
  const checkMulti = function (terms, i, lexicon, setTag, world) {
    let max = i + 4 > terms.length ? terms.length - i : 4;
    let str = terms[i].machine || terms[i].normal;
    for (let skip = 1; skip < max; skip += 1) {
      let t = terms[i + skip];
      let word = t.machine || t.normal;
      str += ' ' + word;
      if (lexicon.hasOwnProperty(str) === true) {
        let tag = lexicon[str];
        let ts = terms.slice(i, i + skip + 1);
        setTag(ts, tag, world, false, '1-multi-lexicon');

        // special case for phrasal-verbs - 2nd word is a #Particle
        if (tag && tag.length === 2 && (tag[0] === 'PhrasalVerb' || tag[1] === 'PhrasalVerb')) {
          setTag([ts[1]], 'Particle', world, false, '1-phrasal-particle');
        }
        return true
      }
    }
    return false
  };

  const multiWord = function (terms, i, world) {
    const { model, methods } = world;
    // const { fastTag } = methods.one
    const setTag = methods.one.setTag;
    const multi = model.one._multiCache || {};
    const lexicon = model.one.lexicon || {};
    // basic lexicon lookup
    let t = terms[i];
    let word = t.machine || t.normal;
    // multi-word lookup
    if (terms[i + 1] !== undefined && multi[word] === true) {
      return checkMulti(terms, i, lexicon, setTag, world)
    }
    return null
  };
  var multiWord$1 = multiWord;

  const prefix$2 = /^(under|over|mis|re|un|dis|semi|pre|post)-?/;
  // anti|non|extra|inter|intra|over
  const allowPrefix = new Set(['Verb', 'Infinitive', 'PastTense', 'Gerund', 'PresentTense', 'Adjective', 'Participle']);

  // tag any words in our lexicon
  const checkLexicon = function (terms, i, world) {
    const { model, methods } = world;
    // const fastTag = methods.one.fastTag
    const setTag = methods.one.setTag;
    const lexicon = model.one.lexicon;

    // basic lexicon lookup
    let t = terms[i];
    let word = t.machine || t.normal;
    // normal lexicon lookup
    if (lexicon[word] !== undefined && lexicon.hasOwnProperty(word)) {
      let tag = lexicon[word];
      setTag([t], tag, world, false, '1-lexicon');
      // fastTag(t, tag, '1-lexicon')
      return true
    }
    // lookup aliases in the lexicon
    if (t.alias) {
      let found = t.alias.find(str => lexicon.hasOwnProperty(str));
      if (found) {
        let tag = lexicon[found];
        setTag([t], tag, world, false, '1-lexicon-alias');
        // fastTag(t, tag, '1-lexicon-alias')
        return true
      }
    }
    // prefixing for verbs/adjectives
    if (prefix$2.test(word) === true) {
      let stem = word.replace(prefix$2, '');
      if (lexicon.hasOwnProperty(stem) && stem.length > 3) {
        // only allow prefixes for verbs/adjectives
        if (allowPrefix.has(lexicon[stem])) {
          // console.log('->', word, stem, lexicon[stem])
          setTag([t], lexicon[stem], world, false, '1-lexicon-prefix');
          // fastTag(t, lexicon[stem], '1-lexicon-prefix')
          return true
        }
      }
    }
    return null
  };
  var singleWord = checkLexicon;

  // tag any words in our lexicon - even if it hasn't been filled-up yet
  // rest of pre-tagger is in ./two/preTagger
  const lexicon$3 = function (view) {
    const world = view.world;
    view.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        if (terms[i].tags.size === 0) {
          let found = null;
          found = found || multiWord$1(terms, i, world);
          // lookup known words
          found = found || singleWord(terms, i, world);
        }
      }
    });
  };

  var compute$3 = {
    lexicon: lexicon$3
  };

  // derive clever things from our lexicon key-value pairs
  const expand$1 = function (words) {
    // const { methods, model } = world
    let lex = {};
    // console.log('start:', Object.keys(lex).length)
    let _multi = {};
    // go through each word in this key-value obj:
    Object.keys(words).forEach(word => {
      let tag = words[word];
      // normalize lexicon a little bit
      word = word.toLowerCase().trim();
      word = word.replace(/'s\b/, '');
      // cache multi-word terms
      let split = word.split(/ /);
      if (split.length > 1) {
        _multi[split[0]] = true;
      }
      lex[word] = lex[word] || tag;
    });
    // cleanup
    delete lex[''];
    delete lex[null];
    delete lex[' '];
    return { lex, _multi }
  };
  var expandLexicon = expand$1;

  var methods$f = {
    one: {
      expandLexicon,
    }
  };

  /** insert new words/phrases into the lexicon */
  const addWords = function (words) {
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
    // add some words to our lexicon
    if (methods.two.expandLexicon) {
      // do fancy ./two version
      let { lex, _multi } = methods.two.expandLexicon(words, world);
      Object.assign(model.one.lexicon, lex);
      Object.assign(model.one._multiCache, _multi);
    } else if (methods.one.expandLexicon) {
      // do basic ./one version
      let { lex, _multi } = methods.one.expandLexicon(words, world);
      Object.assign(model.one.lexicon, lex);
      Object.assign(model.one._multiCache, _multi);
    } else {
      //no fancy-business
      Object.assign(model.one.lexicon, words);
    }
  };

  var lib$5 = { addWords };

  const model$4 = {
    one: {
      lexicon: {}, //setup blank lexicon
      _multiCache: {},
    }
  };

  var lexicon$2 = {
    model: model$4,
    methods: methods$f,
    compute: compute$3,
    lib: lib$5,
    hooks: ['lexicon']
  };

  // edited by Spencer Kelly
  // credit to https://github.com/BrunoRB/ahocorasick by Bruno Roberto Búrigo.

  const tokenize$5 = function (phrase, world) {
    const { methods, model } = world;
    let terms = methods.one.tokenize.splitTerms(phrase, model).map(t => methods.one.tokenize.splitWhitespace(t, model));
    return terms.map(term => term.text.toLowerCase())
  };

  // turn an array or object into a compressed aho-corasick structure
  const buildTrie = function (phrases, world) {

    // const tokenize=methods.one.
    let goNext = [{}];
    let endAs = [null];
    let failTo = [0];

    let xs = [];
    let n = 0;
    phrases.forEach(function (phrase) {
      let curr = 0;
      // let wordsB = phrase.split(/ /g).filter(w => w)
      let words = tokenize$5(phrase, world);
      for (let i = 0; i < words.length; i++) {
        let word = words[i];
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
    for (let word in goNext[0]) {
      n = goNext[0][word];
      failTo[n] = 0;
      xs.push(n);
    }

    while (xs.length) {
      let r = xs.shift();
      // for each symbol a such that g(r, a) = s
      let keys = Object.keys(goNext[r]);
      for (let i = 0; i < keys.length; i += 1) {
        let word = keys[i];
        let s = goNext[r][word];
        xs.push(s);
        // set state = f(r)
        n = failTo[r];
        while (n > 0 && !goNext[n].hasOwnProperty(word)) {
          n = failTo[n];
        }
        if (goNext.hasOwnProperty(n)) {
          let fs = goNext[n][word];
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
  var build = buildTrie;

  // console.log(buildTrie(['smart and cool', 'smart and nice']))

  // follow our trie structure
  const scanWords = function (terms, trie, opts) {
    let n = 0;
    let results = [];
    for (let i = 0; i < terms.length; i++) {
      let word = terms[i][opts.form] || terms[i].normal;
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
        let arr = trie.endAs[n];
        for (let o = 0; o < arr.length; o++) {
          let len = arr[o];
          let term = terms[i - len + 1];
          let [no, start] = term.index;
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
    let docs = view.docs;
    if (!trie.goNext || !trie.goNext[0]) {
      console.error('Compromise invalid lookup trie');//eslint-disable-line
      return view.none()
    }
    let firstWords = Object.keys(trie.goNext[0]);
    // do each phrase
    for (let i = 0; i < docs.length; i++) {
      // can we skip the phrase, all together?
      if (view._cache && view._cache[i] && cacheMiss(firstWords, view._cache[i]) === true) {
        continue
      }
      let terms = docs[i];
      let found = scanWords(terms, trie, opts);
      if (found.length > 0) {
        results = results.concat(found);
      }
    }
    return view.update(results)
  };
  var scan$1 = scan;

  const isObject$4 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  function api$i (View) {

    /** find all matches in this document */
    View.prototype.lookup = function (input, opts = {}) {
      if (!input) {
        return this.none()
      }
      if (typeof input === 'string') {
        input = [input];
      }
      let trie = isObject$4(input) ? input : build(input, this.world);
      let res = scan$1(this, trie, opts);
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
  var compress$1 = compress;

  /** pre-compile a list of matches to lookup */
  const lib$4 = {
    /** turn an array or object into a compressed trie*/
    buildTrie: function (input) {
      const trie = build(input, this.world());
      return compress$1(trie)
    }
  };
  // add alias
  lib$4.compile = lib$4.buildTrie;

  var lookup = {
    api: api$i,
    lib: lib$4
  };

  const relPointer = function (ptrs, parent) {
    if (!parent) {
      return ptrs
    }
    ptrs.forEach(ptr => {
      let n = ptr[0];
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
    let { ptrs, byGroup } = res;
    ptrs = relPointer(ptrs, parent);
    Object.keys(byGroup).forEach(k => {
      byGroup[k] = relPointer(byGroup[k], parent);
    });
    return { ptrs, byGroup }
  };

  const isObject$3 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  // did they pass-in a compromise object?
  const isView = val => val && isObject$3(val) && val.isView === true;

  const isNet = val => val && isObject$3(val) && val.isNet === true;


  // is the pointer the full sentence?
  // export const isFull = function (ptr, document) {
  //   let [n, start, end] = ptr
  //   if (start !== 0) {
  //     return false
  //   }
  //   if (document[n] && document[n][end - 1] && !document[n][end]) {
  //     return true
  //   }
  //   return false
  // }

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

  const match$2 = function (regs, group, opts) {
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
    let todo = { regs, group };
    let res = one.match(this.docs, todo, this._cache);
    let { ptrs, byGroup } = fixPointers(res, this.fullPointer);
    let view = this.toView(ptrs);
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
    let todo = { regs, group, justOne: true };
    let res = one.match(this.docs, todo, this._cache);
    let { ptrs, byGroup } = fixPointers(res, this.fullPointer);
    let view = this.toView(ptrs);
    view._groups = byGroup;
    return view
  };

  const has = function (regs, group, opts) {
    const one = this.methods.one;
    // support view as input
    if (isView(regs)) {
      let ptrs = regs.fullPointer; // support a view object as input
      return ptrs.length > 0
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, { tagger: false }).view.found
    }
    regs = parseRegs(regs, opts, this.world);
    let todo = { regs, group, justOne: true };
    let ptrs = one.match(this.docs, todo, this._cache).ptrs;
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
      let m = this.sweep(regs, { tagger: false }).view.settle();
      return this.if(m)//recurse with result
    }
    regs = parseRegs(regs, opts, this.world);
    let todo = { regs, group, justOne: true };
    let ptrs = this.fullPointer;
    let cache = this._cache || [];
    ptrs = ptrs.filter((ptr, i) => {
      let m = this.update([ptr]);
      let res = one.match(m.docs, todo, cache[i]).ptrs;
      return res.length > 0
    });
    let view = this.update(ptrs);
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
      let m = this.sweep(regs, { tagger: false }).view.settle();
      return this.ifNo(m)
    }
    // otherwise parse the match string
    regs = parseRegs(regs, opts, this.world);
    let cache = this._cache || [];
    let view = this.filter((m, i) => {
      let todo = { regs, group, justOne: true };
      let ptrs = one.match(m.docs, todo, cache[i]).ptrs;
      return ptrs.length === 0
    });
    // try to reconstruct the cache
    if (this._cache) {
      view._cache = view.ptrs.map(ptr => cache[ptr[0]]);
    }
    return view
  };

  var match$3 = { matchOne, match: match$2, has, if: ifFn, ifNo };

  const before = function (regs, group, opts) {
    const { indexN } = this.methods.one.pointer;
    let pre = [];
    let byN = indexN(this.fullPointer);
    Object.keys(byN).forEach(k => {
      // check only the earliest match in the sentence
      let first = byN[k].sort((a, b) => (a[1] > b[1] ? 1 : -1))[0];
      if (first[1] > 0) {
        pre.push([first[0], 0, first[1]]);
      }
    });
    let preWords = this.toView(pre);
    if (!regs) {
      return preWords
    }
    return preWords.match(regs, group, opts)
  };

  const after = function (regs, group, opts) {
    const { indexN } = this.methods.one.pointer;
    let post = [];
    let byN = indexN(this.fullPointer);
    let document = this.document;
    Object.keys(byN).forEach(k => {
      // check only the latest match in the sentence
      let last = byN[k].sort((a, b) => (a[1] > b[1] ? -1 : 1))[0];
      let [n, , end] = last;
      if (end < document[n].length) {
        post.push([n, end, document[n].length]);
      }
    });
    let postWords = this.toView(post);
    if (!regs) {
      return postWords
    }
    return postWords.match(regs, group, opts)
  };

  const growLeft = function (regs, group, opts) {
    if (typeof regs === 'string') {
      regs = this.world.methods.one.parseMatch(regs, opts, this.world);
    }
    regs[regs.length - 1].end = true;// ensure matches are beside us ←
    let ptrs = this.fullPointer;
    this.forEach((m, n) => {
      let more = m.before(regs, group);
      if (more.found) {
        let terms = more.terms();
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
    regs[0].start = true;// ensure matches are beside us →
    let ptrs = this.fullPointer;
    this.forEach((m, n) => {
      let more = m.after(regs, group);
      if (more.found) {
        let terms = more.terms();
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

  const getDoc$3 = (reg, view, group) => {
    if (typeof reg === 'string' || isArray$5(reg)) {
      return view.match(reg, group)
    }
    if (!reg) {
      return view.none()
    }
    return reg
  };

  const addIds$1 = function (ptr, view) {
    let [n, start, end] = ptr;
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
    let splits = getDoc$3(m, this, group).fullPointer;
    let all = splitAll(this.fullPointer, splits);
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
    let splits = getDoc$3(m, this, group).fullPointer;
    let all = splitAll(this.fullPointer, splits);
    let res = [];
    all.forEach(o => {
      res.push(o.passthrough);
      res.push(o.before);
      if (o.match && o.after) {
        // console.log(combine(o.match, o.after))
        res.push(combine(o.match, o.after));
      } else {
        res.push(o.match);
        res.push(o.after);
      }
    });
    res = res.filter(p => p);
    res = res.map(p => addIds$1(p, this));
    return this.update(res)
  };

  // [before match], [after]
  methods$e.splitAfter = function (m, group) {
    const { splitAll } = this.methods.one.pointer;
    let splits = getDoc$3(m, this, group).fullPointer;
    let all = splitAll(this.fullPointer, splits);
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

  var split$1 = methods$e;

  const methods$d = Object.assign({}, match$3, lookaround, split$1);
  // aliases
  methods$d.lookBehind = methods$d.before;
  methods$d.lookBefore = methods$d.before;

  methods$d.lookAhead = methods$d.after;
  methods$d.lookAfter = methods$d.after;

  methods$d.notIf = methods$d.ifNo;
  const matchAPI = function (View) {
    Object.assign(View.prototype, methods$d);
  };
  var api$h = matchAPI;

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
    let arr = txt.split(bySlashes);
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
  var parseBlocks$1 = parseBlocks;

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
  const titleCase$1 = str => str.charAt(0).toUpperCase() + str.substring(1);
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
    let obj = {};
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
      if (end(w) === '?') {
        obj.optional = true;
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
        let last = obj.choices.length - 1;
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
      //regex
      if (start(w) === '/' && end(w) === '/') {
        w = stripBoth(w);
        if (opts.caseSensitive) {
          obj.use = 'text';
        }
        obj.regex = new RegExp(w); //potential vuln - security/detect-non-literal-regexp
        return obj
      }

      //root/sense overloaded
      if (start(w) === '{' && end(w) === '}') {
        w = stripBoth(w);
        // obj.sense = w
        obj.root = w;
        if (/\//.test(w)) {
          let split = obj.root.split(/\//);
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
        obj.chunk = titleCase$1(w);
        obj.greedy = true;
        return obj
      }
      if (start(w) === '%' && end(w) === '%') {
        w = stripBoth(w);
        obj.switch = w;
        return obj
      }
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
    //do the actual token content
    if (start(w) === '#') {
      obj.tag = stripStart(w);
      obj.tag = titleCase$1(obj.tag);
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
  var parseToken$1 = parseToken;

  const hasDash$2 = /[a-z0-9][-–—][a-z]/i;

  // match 're-do' -> ['re','do']
  const splitHyphens$1 = function (regs, world) {
    let prefixes = world.model.one.prefixes;
    for (let i = regs.length - 1; i >= 0; i -= 1) {
      let reg = regs[i];
      if (reg.word && hasDash$2.test(reg.word)) {
        let words = reg.word.split(/[-–—]/g);
        // don't split 're-cycle', etc
        if (prefixes.hasOwnProperty(words[0])) {
          continue
        }
        words = words.filter(w => w).reverse();
        regs.splice(i, 1);
        words.forEach(w => {
          let obj = Object.assign({}, reg);
          obj.word = w;
          regs.splice(i, 0, obj);
        });
      }
    }
    return regs
  };
  var splitHyphens$2 = splitHyphens$1;

  // add all conjugations of this verb
  const addVerbs$1 = function (token, world) {
    let { all } = world.methods.two.transform.verb || {};
    let str = token.root;
    // if (toInfinitive) {
    //   str = toInfinitive(str, world.model)
    // }
    if (!all) {
      return []
    }
    return all(str, world.model)
  };

  // add all inflections of this noun
  const addNoun = function (token, world) {
    let { all } = world.methods.two.transform.noun || {};
    if (!all) {
      return [token.root]
    }
    return all(token.root, world.model)
  };

  // add all inflections of this adjective
  const addAdjective = function (token, world) {
    let { all } = world.methods.two.transform.adjective || {};
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
  var inflectRoot$1 = inflectRoot;

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
        let shouldPack = token.choices.every(block => {
          if (block.length !== 1) {
            return false
          }
          let reg = block[0];
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
  var postProcess$1 = postProcess;

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
    let tokens = parseBlocks$1(input);
    //turn them into objects
    tokens = tokens.map(str => parseToken$1(str, opts));
    // '~re-do~'
    tokens = splitHyphens$2(tokens, world);
    // '{walk}'
    tokens = inflectRoot$1(tokens, world);
    //clean up anything weird
    tokens = postProcess$1(tokens);
    // console.log(tokens)
    return tokens
  };
  var parseMatch = syntax;

  const anyIntersection = function (setA, setB) {
    for (let elem of setB) {
      if (setA.has(elem)) {
        return true
      }
    }
    return false
  };
  // check words/tags against our cache
  const failFast = function (regs, cache) {
    for (let i = 0; i < regs.length; i += 1) {
      let reg = regs[i];
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
      // perform a speedup for fast-or
      if (reg.fastOr && anyIntersection(reg.fastOr, cache) === false) {
        return false
      }
    }
    return false
  };
  var failFast$1 = failFast;

  // fuzzy-match (damerau-levenshtein)
  // Based on  tad-lispy /node-damerau-levenshtein
  // https://github.com/tad-lispy/node-damerau-levenshtein/blob/master/index.js
  // count steps (insertions, deletions, substitutions, or transpositions)
  const editDistance = function (strA, strB) {
    let aLength = strA.length,
      bLength = strB.length;
    // fail-fast
    if (aLength === 0) {
      return bLength
    }
    if (bLength === 0) {
      return aLength
    }
    // If the limit is not defined it will be calculate from this and that args.
    let limit = (bLength > aLength ? bLength : aLength) + 1;
    if (Math.abs(aLength - bLength) > (limit || 100)) {
      return limit || 100
    }
    // init the array
    let matrix = [];
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
        let shouldUpdate =
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
    let length = Math.max(strA.length, strB.length);
    let relative = length === 0 ? 0 : steps / length;
    let similarity = 1 - relative;
    return similarity
  };
  var fuzzy = fuzzyMatch;

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
  const hasPre = (term, punct) => term.pre.indexOf(punct) !== -1;

  const methods$c = {
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
    hasEllipses: term => hasPost(term, '..') || hasPost(term, '…') || hasPre(term, '..') || hasPre(term, '…'),
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
  methods$c.hasQuotation = methods$c.hasQuote;

  var termMethods = methods$c;

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
      // term aliases for slashes and things
      if (term.alias !== undefined && term.alias.hasOwnProperty(reg.word)) {
        return true
      }
      // support ~ fuzzy match
      if (reg.fuzzy === true) {
        if (reg.word === term.root) {
          return true
        }
        let score = fuzzy(reg.word, term.normal);
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
      if (typeof termMethods[reg.method] === 'function' && termMethods[reg.method](term) === true) {
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
      let str = term.root || term.implicit || term.machine || term.normal;
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
    let result = doesMatch$1(t, reg, index, length);
    if (reg.negative === true) {
      return !result
    }
    return result
  };
  var matchTerm = wrapMatch;

  // for greedy checking, we no longer care about the reg.start
  // value, and leaving it can cause failures for anchored greedy
  // matches.  ditto for end-greedy matches: we need an earlier non-
  // ending match to succceed until we get to the actual end.
  const getGreedy = function (state, endReg) {
    let reg = Object.assign({}, state.regs[state.r], { start: false, end: false });
    let start = state.t;
    for (; state.t < state.terms.length; state.t += 1) {
      //stop for next-reg match
      if (endReg && matchTerm(state.terms[state.t], endReg, state.start_i + state.t, state.phrase_length)) {
        return state.t
      }
      let count = state.t - start + 1;
      // is it max-length now?
      if (reg.max !== undefined && count === reg.max) {
        return state.t
      }
      //stop here
      if (matchTerm(state.terms[state.t], reg, state.start_i + state.t, state.phrase_length) === false) {
        // is it too short?
        if (reg.min !== undefined && count < reg.min) {
          return null
        }
        return state.t
      }
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
      if (matchTerm(state.terms[t], nextReg, state.start_i + t, state.phrase_length) === true) {
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
        let tmpReg = Object.assign({}, reg, { end: false });
        if (matchTerm(state.terms[state.t], tmpReg, state.start_i + state.t, state.phrase_length) === true) {
          // console.log(`endGreedy ${state.terms[state.t].normal}`)
          return true
        }
      }
    }
    return false
  };

  const getGroup$2 = function (state, term_index) {
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
    let { regs } = state;
    let reg = regs[state.r];

    let skipto = greedyTo(state, regs[state.r + 1]);
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
      const g = getGroup$2(state, state.t);
      g.length = skipto - state.t;
    }
    state.t = skipto;
    // log(`✓ |greedy|`)
    return true
  };
  var doAstrix$1 = doAstrix;

  const isArray$4 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  const doOrBlock$1 = function (state, skipN = 0) {
    let block = state.regs[state.r];
    let wasFound = false;
    // do each multiword sequence
    for (let c = 0; c < block.choices.length; c += 1) {
      // try to match this list of tokens
      let regs = block.choices[c];
      if (!isArray$4(regs)) {
        return false
      }
      wasFound = regs.every((cr, w_index) => {
        let extra = 0;
        let t = state.t + w_index + skipN + extra;
        if (state.terms[t] === undefined) {
          return false
        }
        let foundBlock = matchTerm(state.terms[t], cr, t + state.start_i, state.phrase_length);
        // this can be greedy - '(foo+ bar)'
        if (foundBlock === true && cr.greedy === true) {
          for (let i = 1; i < state.terms.length; i += 1) {
            let term = state.terms[t + i];
            if (term) {
              let keepGoing = matchTerm(term, cr, state.start_i + i, state.phrase_length);
              if (keepGoing === true) {
                extra += 1;
              } else {
                break
              }
            }
          }
        }
        skipN += extra;
        return foundBlock
      });
      if (wasFound) {
        skipN += regs.length;
        break
      }
    }
    // we found a match -  is it greedy though?
    if (wasFound && block.greedy === true) {
      return doOrBlock$1(state, skipN) // try it again!
    }
    return skipN
  };

  const doAndBlock$1 = function (state) {
    let longest = 0;
    // all blocks must match, and we return the greediest match
    let reg = state.regs[state.r];
    let allDidMatch = reg.choices.every(block => {
      //  for multi-word blocks, all must match
      let allWords = block.every((cr, w_index) => {
        let tryTerm = state.t + w_index;
        if (state.terms[tryTerm] === undefined) {
          return false
        }
        return matchTerm(state.terms[tryTerm], cr, tryTerm, state.phrase_length)
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
    let reg = regs[state.r];
    let skipNum = doOrBlock$1(state);
    // did we find a match?
    if (skipNum) {
      // handle 'not' logic
      if (reg.negative === true) {
        return null // die
      }
      // tuck in as named-group
      if (state.hasGroup === true) {
        const g = getGroup$2(state, state.t);
        g.length += skipNum;
      }
      // ensure we're at the end
      if (reg.end === true) {
        let end = state.phrase_length;
        if (state.t + state.start_i + skipNum !== end) {
          return null
        }
      }
      state.t += skipNum;
      // log(`✓ |found-or|`)
      return true
    } else if (!reg.optional) {
      return null //die
    }
    return true
  };
  var doOrBlock = orBlock;

  // '(foo && #Noun)' - require all matches on the term
  const andBlock = function (state) {
    const { regs } = state;
    let reg = regs[state.r];

    let skipNum = doAndBlock$1(state);
    if (skipNum) {
      // handle 'not' logic
      if (reg.negative === true) {
        return null // die
      }
      if (state.hasGroup === true) {
        const g = getGroup$2(state, state.t);
        g.length += skipNum;
      }
      // ensure we're at the end
      if (reg.end === true) {
        let end = state.phrase_length - 1;
        if (state.t + state.start_i !== end) {
          return null
        }
      }
      state.t += skipNum;
      // log(`✓ |found-and|`)
      return true
    } else if (!reg.optional) {
      return null //die
    }
    return true
  };
  var doAndBlock = andBlock;

  const negGreedy = function (state, reg, nextReg) {
    let skip = 0;
    for (let t = state.t; t < state.terms.length; t += 1) {
      let found = matchTerm(state.terms[t], reg, state.start_i + state.t, state.phrase_length);
      // we don't want a match, here
      if (found) {
        break//stop going
      }
      // are we doing 'greedy-to'?
      // - "!foo+ after"  should stop at 'after'
      if (nextReg) {
        found = matchTerm(state.terms[t], nextReg, state.start_i + state.t, state.phrase_length);
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

  var negGreedy$1 = negGreedy;

  // '!foo' should match anything that isn't 'foo'
  // if it matches, return false
  const doNegative = function (state) {
    const { regs } = state;
    let reg = regs[state.r];

    // match *anything* but this term
    let tmpReg = Object.assign({}, reg);
    tmpReg.negative = false; // try removing it

    // found it? if so, we die here
    let found = matchTerm(state.terms[state.t], tmpReg, state.start_i + state.t, state.phrase_length);
    if (found) {
      return false//bye
    }
    // should we skip the term too?
    if (reg.optional) {
      // "before after" - "before !foo? after"
      // does the next reg match the this term?
      let nextReg = regs[state.r + 1];
      if (nextReg) {
        let fNext = matchTerm(state.terms[state.t], nextReg, state.start_i + state.t, state.phrase_length);
        if (fNext) {
          state.r += 1;
        } else if (nextReg.optional && regs[state.r + 2]) {
          // ugh. ok,
          // support "!foo? extra? need"
          // but don't scan ahead more than that.
          let fNext2 = matchTerm(state.terms[state.t], regs[state.r + 2], state.start_i + state.t, state.phrase_length);
          if (fNext2) {
            state.r += 2;
          }
        }
      }
    }
    // negative greedy - !foo+  - super hard!
    if (reg.greedy) {
      return negGreedy$1(state, tmpReg, regs[state.r + 1])
    }
    state.t += 1;
    return true
  };
  var doNegative$1 = doNegative;

  // 'foo? foo' matches are tricky.
  const foundOptional = function (state) {
    const { regs } = state;
    let reg = regs[state.r];
    let term = state.terms[state.t];
    // does the next reg match it too?
    let nextRegMatched = matchTerm(term, regs[state.r + 1], state.start_i + state.t, state.phrase_length);
    if (reg.negative || nextRegMatched) {
      // but does the next reg match the next term??
      // only skip if it doesn't
      let nextTerm = state.terms[state.t + 1];
      if (!nextTerm || !matchTerm(nextTerm, regs[state.r + 1], state.start_i + state.t, state.phrase_length)) {
        state.r += 1;
      }
    }
  };

  var foundOptional$1 = foundOptional;

  // keep 'foo+' or 'foo*' going..
  const greedyMatch = function (state) {
    const { regs, phrase_length } = state;
    let reg = regs[state.r];
    state.t = getGreedy(state, regs[state.r + 1]);
    if (state.t === null) {
      return null //greedy was too short
    }
    // foo{2,4} - has a greed-minimum
    if (reg.min && reg.min > state.t) {
      return null //greedy was too short
    }
    // 'foo+$' - if also an end-anchor, ensure we really reached the end
    if (reg.end === true && state.start_i + state.t !== phrase_length) {
      return null //greedy didn't reach the end
    }
    return true
  };
  var greedyMatch$1 = greedyMatch;

  // for: ['we', 'have']
  // a match for "we have" should work as normal
  // but matching "we've" should skip over implict terms
  const contractionSkip = function (state) {
    let term = state.terms[state.t];
    let reg = state.regs[state.r];
    // did we match the first part of a contraction?
    if (term.implicit && state.terms[state.t + 1]) {
      let nextTerm = state.terms[state.t + 1];
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
  var contractionSkip$1 = contractionSkip;

  // '[foo]' should also be logged as a group
  const setGroup = function (state, startAt) {
    let reg = state.regs[state.r];
    // Get or create capture group
    const g = getGroup$2(state, startAt);
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
    let reg = regs[state.r];
    let term = state.terms[state.t];
    let startAt = state.t;
    // if it's a negative optional match... :0
    if (reg.optional && regs[state.r + 1] && reg.negative) {
      return true
    }
    // okay, it was a match, but if it's optional too,
    // we should check the next reg too, to skip it?
    if (reg.optional && regs[state.r + 1]) {
      foundOptional$1(state);
    }
    // Contraction skip:
    // did we match the first part of a contraction?
    if (term.implicit && state.terms[state.t + 1]) {
      contractionSkip$1(state);
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
      let alive = greedyMatch$1(state);
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
  var simpleMatch$1 = simpleMatch;

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
    let state = {
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
      let reg = regs[state.r];
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
        let alive = doAstrix$1(state);
        if (!alive) {
          return null
        }
        continue
      }
      // slow-OR - multi-word OR (a|b|foo bar)
      if (reg.choices !== undefined && reg.operator === 'or') {
        let alive = doOrBlock(state);
        if (!alive) {
          return null
        }
        continue
      }
      // slow-AND - multi-word AND (#Noun && foo) blocks
      if (reg.choices !== undefined && reg.operator === 'and') {
        let alive = doAndBlock(state);
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
        let alive = simpleMatch$1(state);
        if (!alive) {
          return null
        }
        continue
      }
      // support 'foo*$' until the end
      if (isEndGreedy(reg, state) === true) {
        let alive = simpleMatch$1(state);
        if (!alive) {
          return null
        }
        continue
      }
      // ok, it doesn't match - but maybe it wasn't *supposed* to?
      if (reg.negative) {
        // we want *anything* but this term
        let alive = doNegative$1(state);
        if (!alive) {
          return null
        }
        continue
      }
      // ok, finally test the term-reg
      // console.log('   - ' + state.terms[state.t].text)
      let hasMatch = matchTerm(state.terms[state.t], reg, state.start_i + state.t, state.phrase_length);
      if (hasMatch === true) {
        let alive = simpleMatch$1(state);
        if (!alive) {
          return null
        }
        continue
      }
      // console.log('=-=-=-= here -=-=-=-')

      //ok who cares, keep going
      if (reg.optional === true) {
        continue
      }

      // finally, we die
      return null
    }
    //return our results, as pointers
    let pntr = [null, start_i, state.t + start_i];
    if (pntr[1] === pntr[2]) {
      return null //found 0 terms
    }
    let groups = {};
    Object.keys(state.groups).forEach(k => {
      let o = state.groups[k];
      let start = start_i + o.start;
      groups[k] = [null, start, start + o.length];
    });
    return { pointer: pntr, groups: groups }
  };
  var fromHere = tryHere;

  // support returning a subset of a match
  // like 'foo [bar] baz' -> bar
  const getGroup = function (res, group) {
    let ptrs = [];
    let byGroup = {};
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
  var getGroup$1 = getGroup;

  const notIf = function (results, not, docs) {
    results = results.filter(res => {
      let [n, start, end] = res.pointer;
      let terms = docs[n].slice(start, end);
      for (let i = 0; i < terms.length; i += 1) {
        let slice = terms.slice(i);
        let found = fromHere(slice, not, i, terms.length);
        if (found !== null) {
          return false
        }
      }
      return true
    });
    return results
  };

  var notIf$1 = notIf;

  // make proper pointers
  const addSentence = function (res, n) {
    res.pointer[0] = n;
    Object.keys(res.groups).forEach(k => {
      res.groups[k][0] = n;
    });
    return res
  };

  const handleStart = function (terms, regs, n) {
    let res = fromHere(terms, regs, 0, terms.length);
    if (res) {
      res = addSentence(res, n);
      return res //getGroup([res], group)
    }
    return null
  };

  // ok, here we go.
  const runMatch$2 = function (docs, todo, cache) {
    cache = cache || [];
    let { regs, group, justOne } = todo;
    let results = [];
    if (!regs || regs.length === 0) {
      return { ptrs: [], byGroup: {} }
    }

    const minLength = regs.filter(r => r.optional !== true && r.negative !== true).length;
    docs: for (let n = 0; n < docs.length; n += 1) {
      let terms = docs[n];
      // let index = terms[0].index || []
      // can we skip this sentence?
      if (cache[n] && failFast$1(regs, cache[n])) {
        continue
      }
      // ^start regs only run once, per phrase
      if (regs[0].start === true) {
        let foundStart = handleStart(terms, regs, n);
        if (foundStart) {
          results.push(foundStart);
        }
        continue
      }
      //ok, try starting the match now from every term
      for (let i = 0; i < terms.length; i += 1) {
        let slice = terms.slice(i);
        // ensure it's long-enough
        if (slice.length < minLength) {
          break
        }
        let res = fromHere(slice, regs, i, terms.length);
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
          let end = res.pointer[2];
          if (Math.abs(end - 1) > i) {
            i = Math.abs(end - 1);
          }
        }
      }
    }
    // ensure any end-results ($) match until the last term
    if (regs[regs.length - 1].end === true) {
      results = results.filter(res => {
        let n = res.pointer[0];
        return docs[n].length === res.pointer[2]
      });
    }
    if (todo.notIf) {
      results = notIf$1(results, todo.notIf, docs);
    }
    // grab the requested group
    results = getGroup$1(results, group);
    // add ids to pointers
    results.ptrs.forEach(ptr => {
      let [n, start, end] = ptr;
      ptr[3] = docs[n][start].id;//start-id
      ptr[4] = docs[n][end - 1].id;//end-id
    });
    return results
  };

  var match$1 = runMatch$2;

  const methods$a = {
    one: {
      termMethods,
      parseMatch,
      match: match$1,
    },
  };

  var methods$b = methods$a;

  var lib$3 = {
    /** pre-parse any match statements */
    parseMatch: function (str, opts) {
      const world = this.world();
      let killUnicode = world.methods.one.killUnicode;
      if (killUnicode) {
        str = killUnicode(str, world);
      }
      return world.methods.one.parseMatch(str, opts, world)
    }
  };

  var match = {
    api: api$h,
    methods: methods$b,
    lib: lib$3,
  };

  const isClass = /^\../;
  const isId = /^#./;

  const escapeXml = (str) => {
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
    let starts = {};
    let ends = {};
    Object.keys(obj).forEach(k => {
      let res = obj[k];
      let tag = toTag(k);
      if (typeof res === 'string') {
        res = doc.match(res);
      }
      res.docs.forEach(terms => {
        // don't highlight implicit terms
        if (terms.every(t => t.implicit)) {
          return
        }
        let a = terms[0].id;
        starts[a] = starts[a] || [];
        starts[a].push(tag.start);
        let b = terms[terms.length - 1].id;
        ends[b] = ends[b] || [];
        ends[b].push(tag.end);
      });
    });
    return { starts, ends }
  };

  const html = function (obj) {
    // index ids to highlight
    let { starts, ends } = getIndex(this, obj);
    // create the text output
    let out = '';
    this.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        let t = terms[i];
        // do a span tag
        if (starts.hasOwnProperty(t.id)) {
          out += starts[t.id].join('');
        }
        out += t.pre || '' + t.text || '';
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
    terms.forEach((t) => {
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
    if (opts.keepPunct === false) {
      // don't remove ':)' etc
      if (!docs[0][0].tags.has('Emoticon')) {
        text = text.replace(trimStart, '');
      }
      let last = docs[docs.length - 1];
      if (!last[last.length - 1].tags.has('Emoticon')) {
        text = text.replace(trimEnd, '');
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
  var fmts$1 = fmts;

  /* eslint-disable no-bitwise */
  /* eslint-disable no-mixed-operators */
  /* eslint-disable no-multi-assign */

  // https://github.com/jbt/tiny-hashes/
  let k = [], i$1 = 0;
  for (; i$1 < 64;) {
    k[i$1] = 0 | Math.sin(++i$1 % Math.PI) * 4294967296;
  }

  function md5(s) {
    let b, c, d,
      h = [b = 0x67452301, c = 0xEFCDAB89, ~b, ~c],
      words = [],
      j = decodeURI(encodeURI(s)) + '\x80',
      a = j.length;

    s = (--a / 4 + 2) | 15;

    words[--s] = a * 8;

    for (; ~a;) {
      words[a >> 2] |= j.charCodeAt(a) << 8 * a--;
    }

    for (i$1 = j = 0; i$1 < s; i$1 += 16) {
      a = h;

      for (; j < 64;
        a = [
          d = a[3],
          (
            b +
            ((d =
              a[0] +
              [
                b & c | ~b & d,
                d & b | ~d & c,
                b ^ c ^ d,
                c ^ (b | ~d)
              ][a = j >> 4] +
              k[j] +
              ~~words[i$1 | [
                j,
                5 * j + 1,
                3 * j + 5,
                7 * j
              ][a] & 15]
            ) << (a = [
              7, 12, 17, 22,
              5, 9, 14, 20,
              4, 11, 16, 23,
              6, 10, 15, 21
            ][4 * a + j++ % 4]) | d >>> -a)
          ),
          b,
          c
        ]
      ) {
        b = a[1] | 0;
        c = a[2];
      }
      for (j = 4; j;) h[--j] += a[j];
    }

    for (s = ''; j < 32;) {
      s += ((h[j >> 3] >> ((1 ^ j++) * 4)) & 15).toString(16);
    }

    return s;
  }

  // console.log(md5('food-safety'))

  const defaults$1 = {
    text: true,
    terms: true,
  };

  let opts = { case: 'none', unicode: 'some', form: 'machine', punctuation: 'some' };

  const merge = function (a, b) {
    return Object.assign({}, a, b)
  };

  const fns$1 = {
    text: (terms) => textFromTerms(terms, { keepPunct: true }, false),
    normal: (terms) => textFromTerms(terms, merge(fmts$1.normal, { keepPunct: true }), false),
    implicit: (terms) => textFromTerms(terms, merge(fmts$1.implicit, { keepPunct: true }), false),

    machine: (terms) => textFromTerms(terms, opts, false),
    root: (terms) => textFromTerms(terms, merge(opts, { form: 'root' }), false),

    hash: (terms) => md5(textFromTerms(terms, { keepPunct: true }, false)),

    offset: (terms) => {
      let len = fns$1.text(terms).length;
      return {
        index: terms[0].offset.index,
        start: terms[0].offset.start,
        length: len,
      }
    },
    terms: (terms) => {
      return terms.map(t => {
        let term = Object.assign({}, t);
        term.tags = Array.from(t.tags);
        return term
      })
    },
    confidence: (_terms, view, i) => view.eq(i).confidence(),
    syllables: (_terms, view, i) => view.eq(i).syllables(),
    sentence: (_terms, view, i) => view.eq(i).fullSentence().text(),
    dirty: (terms) => terms.some(t => t.dirty === true)
  };
  fns$1.sentences = fns$1.sentence;
  fns$1.clean = fns$1.normal;
  fns$1.reduced = fns$1.root;

  const toJSON$2 = function (view, option) {
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
      let res = {};
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
      let res = toJSON$2(this, n);
      if (typeof n === 'number') {
        return res[n]
      }
      return res
    },
  };
  methods$9.data = methods$9.json;
  var json = methods$9;

  /* eslint-disable no-console */
  const logClientSide = function (view) {
    console.log('%c -=-=- ', 'background-color:#6699cc;');
    view.forEach(m => {
      console.groupCollapsed(m.text());
      let terms = m.docs[0];
      let out = terms.map(t => {
        let text = t.text || '-';
        if (t.implicit) {
          text = '[' + t.implicit + ']';
        }
        let tags = '[' + Array.from(t.tags).join(', ') + ']';
        return { text, tags }
      });
      console.table(out, ['text', 'tags']);
      console.groupEnd();
    });
  };
  var logClientSide$1 = logClientSide;

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
  var cli$1 = cli;

  /* eslint-disable no-console */

  const tagString = function (tags, model) {
    if (model.one.tagSet) {
      tags = tags.map(tag => {
        if (!model.one.tagSet.hasOwnProperty(tag)) {
          return tag
        }
        const c = model.one.tagSet[tag].color || 'blue';
        return cli$1[c](tag)
      });
    }
    return tags.join(', ')
  };

  const showTags = function (view) {
    let { docs, model } = view;
    if (docs.length === 0) {
      console.log(cli$1.blue('\n     ──────'));
    }
    docs.forEach(terms => {
      console.log(cli$1.blue('\n  ┌─────────'));
      terms.forEach(t => {
        let tags = [...(t.tags || [])];
        let text = t.text || '-';
        if (t.sense) {
          text = `{${t.normal}/${t.sense}}`;
        }
        if (t.implicit) {
          text = '[' + t.implicit + ']';
        }
        text = cli$1.yellow(text);
        let word = "'" + text + "'";
        if (t.reference) {
          let str = view.update([t.reference]).text('normal');
          word += ` - ${cli$1.dim(cli$1.i('[' + str + ']'))}`;
        }
        word = word.padEnd(18);
        let str = cli$1.blue('  │ ') + cli$1.i(word) + '  - ' + tagString(tags, model);
        console.log(str);
      });
    });
  };
  var showTags$1 = showTags;

  /* eslint-disable no-console */

  const showChunks = function (view) {
    let { docs } = view;
    console.log('');
    docs.forEach(terms => {
      let out = [];
      terms.forEach(term => {
        if (term.chunk === 'Noun') {
          out.push(cli$1.blue(term.implicit || term.normal));
        } else if (term.chunk === 'Verb') {
          out.push(cli$1.green(term.implicit || term.normal));
        } else if (term.chunk === 'Adjective') {
          out.push(cli$1.yellow(term.implicit || term.normal));
        } else if (term.chunk === 'Pivot') {
          out.push(cli$1.red(term.implicit || term.normal));
        } else {
          out.push(term.implicit || term.normal);
        }
      });
      console.log(out.join(' '), '\n');
    });
  };
  var showChunks$1 = showChunks;

  const split = (txt, offset, index) => {
    let buff = index * 9; //there are 9 new chars addded to each highlight
    let start = offset.start + buff;
    let end = start + offset.length;
    let pre = txt.substring(0, start);
    let mid = txt.substring(start, end);
    let post = txt.substring(end, txt.length);
    return [pre, mid, post]
  };

  const spliceIn = function (txt, offset, index) {
    let parts = split(txt, offset, index);
    return `${parts[0]}${cli$1.blue(parts[1])}${parts[2]}`
  };

  const showHighlight = function (doc) {
    if (!doc.found) {
      return
    }
    let bySentence = {};
    doc.fullPointer.forEach(ptr => {
      bySentence[ptr[0]] = bySentence[ptr[0]] || [];
      bySentence[ptr[0]].push(ptr);
    });
    Object.keys(bySentence).forEach(k => {
      let full = doc.update([[Number(k)]]);
      let txt = full.text();
      let matches = doc.update(bySentence[k]);
      let json = matches.json({ offset: true });
      json.forEach((obj, i) => {
        txt = spliceIn(txt, obj.offset, i);
      });
      console.log(txt); // eslint-disable-line
    });
  };
  var showHighlight$1 = showHighlight;

  /* eslint-disable no-console */

  function isClientSide() {
    return typeof window !== 'undefined' && window.document
  }
  //output some helpful stuff to the console
  const debug = function (opts = {}) {
    let view = this;
    if (typeof opts === 'string') {
      let tmp = {};
      tmp[opts] = true; //allow string input
      opts = tmp;
    }
    if (isClientSide()) {
      logClientSide$1(view);
      return view
    }
    if (opts.tags !== false) {
      showTags$1(view);
      console.log('\n');
    }
    // output chunk-view, too
    if (opts.chunks === true) {
      showChunks$1(view);
      console.log('\n');
    }
    // highlight match in sentence
    if (opts.highlight === true) {
      showHighlight$1(view);
      console.log('\n');
    }
    return view
  };
  var debug$1 = debug;

  const toText$3 = function (term) {
    let pre = term.pre || '';
    let post = term.post || '';
    return pre + term.text + post
  };

  const findStarts = function (doc, obj) {
    let starts = {};
    Object.keys(obj).forEach(reg => {
      let m = doc.match(reg);
      m.fullPointer.forEach(a => {
        starts[a[3]] = { fn: obj[reg], end: a[2] };
      });
    });
    return starts
  };

  const wrap = function (doc, obj) {
    // index ids to highlight
    let starts = findStarts(doc, obj);
    let text = '';
    doc.docs.forEach((terms, n) => {
      for (let i = 0; i < terms.length; i += 1) {
        let t = terms[i];
        // do a span tag
        if (starts.hasOwnProperty(t.id)) {
          let { fn, end } = starts[t.id];
          let m = doc.update([[n, i, end]]);
          text += terms[i].pre || '';
          text += fn(m);
          i = end - 1;
          text += terms[i].post || '';
        } else {
          text += toText$3(t);
        }
      }
    });
    return text
  };
  var wrap$1 = wrap;

  const isObject$2 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  // sort by frequency
  const topk = function (arr) {
    let obj = {};
    arr.forEach(a => {
      obj[a] = obj[a] || 0;
      obj[a] += 1;
    });
    let res = Object.keys(obj).map(k => {
      return { normal: k, count: obj[k] }
    });
    return res.sort((a, b) => (a.count > b.count ? -1 : 0))
  };

  /** some named output formats */
  const out = function (method) {
    // support custom outputs
    if (isObject$2(method)) {
      return wrap$1(this, method)
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

    // json data formats
    if (method === 'json') {
      return this.json()
    }
    if (method === 'offset' || method === 'offsets') {
      this.compute('offset');
      return this.json({ offset: true })
    }
    if (method === 'array') {
      let arr = this.docs.map(terms => {
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
      this.docs.forEach(s => {
        let terms = s.terms.map(t => t.text);
        terms = terms.filter(t => t);
        list = list.concat(terms);
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
      return wrap$1(this, obj)
    },
  };

  var out$1 = methods$8;

  const isObject$1 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  var text = {
    /** */
    text: function (fmt) {
      let opts = {};
      if (fmt && typeof fmt === 'string' && fmts$1.hasOwnProperty(fmt)) {
        opts = Object.assign({}, fmts$1[fmt]);
      } else if (fmt && isObject$1(fmt)) {
        opts = Object.assign({}, fmt);//todo: fixme
      }
      if (opts.keepSpace === undefined && this.pointer) {
        opts.keepSpace = false;
      }
      if (opts.keepPunct === undefined && this.pointer) {
        let ptr = this.pointer[0];
        if (ptr && ptr[1]) {
          opts.keepPunct = false;
        } else {
          opts.keepPunct = true;
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

  const methods$7 = Object.assign({}, out$1, text, json, html$1);

  const addAPI$1 = function (View) {
    Object.assign(View.prototype, methods$7);
  };
  var api$g = addAPI$1;

  var output = {
    api: api$g,
    methods: {
      one: {
        hash: md5
      }
    }
  };

  // do the pointers intersect?
  const doesOverlap = function (a, b) {
    if (a[0] !== b[0]) {
      return false
    }
    let [, startA, endA] = a;
    let [, startB, endB] = b;
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
    let byN = {};
    ptrs.forEach(ref => {
      byN[ref[0]] = byN[ref[0]] || [];
      byN[ref[0]].push(ref);
    });
    return byN
  };

  // remove exact duplicates
  const uniquePtrs = function (arr) {
    let obj = {};
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
    let [n, start] = full;
    let mStart = m[1];
    let mEnd = m[2];
    let res = {};
    // is there space before the match?
    if (start < mStart) {
      let end = mStart < full[2] ? mStart : full[2]; // find closest end-point
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
    let byN = indexN(m);
    let res = [];
    full.forEach(ptr => {
      let [n] = ptr;
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
        let found = pivotBy(carry, p);
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

  var splitAll$1 = splitAll;

  const max$1 = 20;

  // sweep-around looking for our start term uuid
  const blindSweep = function (id, doc, n) {
    for (let i = 0; i < max$1; i += 1) {
      // look up a sentence
      if (doc[n - i]) {
        let index = doc[n - i].findIndex(term => term.id === id);
        if (index !== -1) {
          return [n - i, index]
        }
      }
      // look down a sentence
      if (doc[n + i]) {
        let index = doc[n + i].findIndex(term => term.id === id);
        if (index !== -1) {
          return [n + i, index]
        }
      }
    }
    return null
  };

  const repairEnding = function (ptr, document) {
    let [n, start, , , endId] = ptr;
    let terms = document[n];
    // look for end-id
    let newEnd = terms.findIndex(t => t.id === endId);
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
        let wild = blindSweep(id, document, n);
        if (wild !== null) {
          let len = end - start;
          terms = document[wild[0]].slice(wild[1], wild[1] + len);
          // actually change the pointer
          let startId = terms[0] ? terms[0].id : null;
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
  var getDoc$2 = getDoc$1;

  // flat list of terms from nested document
  const termList = function (docs) {
    let arr = [];
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
      getDoc: getDoc$2,
      pointer: {
        indexN,
        splitAll: splitAll$1,
      }
    },
  };

  // a union is a + b, minus duplicates
  const getUnion = function (a, b) {
    let both = a.concat(b);
    let byN = indexN(both);
    let res = [];
    both.forEach(ptr => {
      let [n] = ptr;
      if (byN[n].length === 1) {
        // we're alone on this sentence, so we're good
        res.push(ptr);
        return
      }
      // there may be overlaps
      let hmm = byN[n].filter(m => doesOverlap(ptr, m));
      hmm.push(ptr);
      let range = getExtent(hmm);
      res.push(range);
    });
    res = uniquePtrs(res);
    return res
  };
  var getUnion$1 = getUnion;

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
    let res = [];
    let found = splitAll$1(refs, not);
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
  var getDifference = subtract;

  // console.log(subtract([[0, 0, 2]], [[0, 0, 1]]))
  // console.log(subtract([[0, 0, 2]], [[0, 1, 2]]))

  // [a,a,a,a,-,-,]
  // [-,-,b,b,b,-,]
  // [-,-,x,x,-,-,]
  const intersection = function (a, b) {
    // find the latest-start
    let start = a[1] < b[1] ? b[1] : a[1];
    // find the earliest-end
    let end = a[2] > b[2] ? b[2] : a[2];
    // does it form a valid pointer?
    if (start < end) {
      return [a[0], start, end]
    }
    return null
  };

  const getIntersection = function (a, b) {
    let byN = indexN(b);
    let res = [];
    a.forEach(ptr => {
      let hmm = byN[ptr[0]] || [];
      hmm = hmm.filter(p => doesOverlap(ptr, p));
      // no sentence-pairs, so no intersection
      if (hmm.length === 0) {
        return
      }
      hmm.forEach(h => {
        let overlap = intersection(ptr, h);
        if (overlap) {
          res.push(overlap);
        }
      });
    });
    return res
  };
  var getIntersection$1 = getIntersection;

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
      let [n, start] = ptr;
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
    let ptrs = getUnion$1(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };
  methods$5.and = methods$5.union;

  // only parts they both have
  methods$5.intersection = function (m) {
    m = getDoc(m, this);
    let ptrs = getIntersection$1(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };

  // only parts of a that b does not have
  methods$5.not = function (m) {
    m = getDoc(m, this);
    let ptrs = getDifference(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };
  methods$5.difference = methods$5.not;

  // get opposite of a
  methods$5.complement = function () {
    let doc = this.all();
    let ptrs = getDifference(doc.fullPointer, this.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };

  // remove overlaps
  methods$5.settle = function () {
    let ptrs = this.fullPointer;
    ptrs.forEach(ptr => {
      ptrs = getUnion$1(ptrs, [ptr]);
    });
    ptrs = addIds(ptrs, this.document);
    return this.update(ptrs)
  };


  const addAPI = function (View) {
    // add set/intersection/union
    Object.assign(View.prototype, methods$5);
  };
  var api$f = addAPI;

  var pointers = {
    methods: methods$6,
    api: api$f,
  };

  var lib$2 = {
    // compile a list of matches into a match-net
    buildNet: function (matches) {
      const methods = this.methods();
      let net = methods.one.buildNet(matches, this.world());
      net.isNet = true;
      return net
    }
  };

  const api$d = function (View) {

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
        let ptr = o.pointer;
        let term = docs[ptr[0]][ptr[1]];
        let len = ptr[2] - ptr[1];
        if (term.index) {
          o.pointer = [
            term.index[0],
            term.index[1],
            ptr[1] + len
          ];
        }
        return o
      });
      let ptrs = found.map(o => o.pointer);
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
  var api$e = api$d;

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
    let needs = [];
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
    let wants = [];
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
              let n = getTokenNeeds(r);
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

  const parse$2 = function (matches, world) {
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
      let { wants, count } = getWants(obj.regs);
      obj.wants = wants;
      obj.minWant = count;
      // get rid of tiny sentences
      obj.minWords = obj.regs.filter(o => !o.optional).length;
    });
    return matches
  };

  var parse$3 = parse$2;

  // do some indexing on the list of matches
  const buildNet = function (matches, world) {
    // turn match-syntax into json
    matches = parse$3(matches, world);

    // collect by wants and needs
    let hooks = {};
    matches.forEach(obj => {
      // add needs
      obj.needs.forEach(str => {
        hooks[str] = hooks[str] || [];
        hooks[str].push(obj);
      });
      // add wants
      obj.wants.forEach(str => {
        hooks[str] = hooks[str] || [];
        hooks[str].push(obj);
      });
    });
    // remove duplicates
    Object.keys(hooks).forEach(k => {
      let already = {};
      hooks[k] = hooks[k].filter(obj => {
        if (already[obj.match]) {
          return false
        }
        already[obj.match] = true;
        return true
      });
    });

    // keep all un-cacheable matches (those with no needs) 
    let always = matches.filter(o => o.needs.length === 0 && o.wants.length === 0);
    return {
      hooks,
      always
    }
  };

  var buildNet$1 = buildNet;

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
      let already = {};
      maybe = maybe.filter(m => {
        if (already[m.match]) {
          return false
        }
        already[m.match] = true;
        return true
      });
      return maybe
    })
  };

  var getHooks$1 = getHooks;

  // filter-down list of maybe-matches
  const localTrim = function (maybeList, docCache) {
    return maybeList.map((list, n) => {
      let haves = docCache[n];
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
        let found = obj.wants.filter(str => haves.has(str)).length;
        return found >= obj.minWant
      });
      return list
    })
  };
  var trimDown = localTrim;

  // finally,
  // actually run these match-statements on the terms
  const runMatch = function (maybeList, document, docCache, methods, opts) {
    let results = [];
    for (let n = 0; n < maybeList.length; n += 1) {
      for (let i = 0; i < maybeList[n].length; i += 1) {
        let m = maybeList[n][i];
        // ok, actually do the work.
        let res = methods.one.match([document[n]], m);
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
            let todo = Object.assign({}, m, { pointer: ptr });
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
  var runMatch$1 = runMatch;

  const tooSmall = function (maybeList, document) {
    return maybeList.map((arr, i) => {
      let termCount = document[i].length;
      arr = arr.filter(o => {
        return termCount >= o.minWords
      });
      return arr
    })
  };

  const sweep$1 = function (document, net, methods, opts = {}) {
    // find suitable matches to attempt, on each sentence
    let docCache = methods.one.cacheDoc(document);
    // collect possible matches for this document
    let maybeList = getHooks$1(docCache, net.hooks);
    // ensure all defined needs are met for each match
    maybeList = trimDown(maybeList, docCache);
    // add unchacheable matches to each sentence's todo-list
    if (net.always.length > 0) {
      maybeList = maybeList.map(arr => arr.concat(net.always));
    }
    // if we don't have enough words
    maybeList = tooSmall(maybeList, document);

    // now actually run the matches
    let results = runMatch$1(maybeList, document, docCache, methods, opts);
    // console.dir(results, { depth: 5 })
    return results
  };
  var bulkMatch = sweep$1;

  // is this tag consistent with the tags they already have?
  const canBe = function (terms, tag, model) {
    let tagSet = model.one.tagSet;
    if (!tagSet.hasOwnProperty(tag)) {
      return true
    }
    let not = tagSet[tag].not || [];
    for (let i = 0; i < terms.length; i += 1) {
      let term = terms[i];
      for (let k = 0; k < not.length; k += 1) {
        if (term.tags.has(not[k]) === true) {
          return false //found a tag conflict - bail!
        }
      }
    }
    return true
  };
  var canBe$1 = canBe;

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
      let reason = todo.reason || todo.match;
      let terms = getDoc([todo.pointer], document)[0];
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
        // quick and dirty plural tagger
        if (todo.tag === 'Noun' && looksPlural) {
          let term = terms[terms.length - 1];
          if (looksPlural(term.text)) {
            setTag([term], 'Plural', world, todo.safe, 'quick-plural');
          } else {
            setTag([term], 'Singular', world, todo.safe, 'quick-singular');
          }
        }
      }
      if (todo.unTag !== undefined) {
        unTag(terms, todo.unTag, world, todo.safe, reason);
      }
      // allow setting chunks, too
      if (todo.chunk) {
        terms.forEach(t => t.chunk = todo.chunk);
      }
    })
  };
  var bulkTagger = tagger$1;

  var methods$4 = {
    buildNet: buildNet$1,
    bulkMatch,
    bulkTagger
  };

  var sweep = {
    lib: lib$2,
    api: api$e,
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
    // for known tags, do logical dependencies first
    let known = tagSet[tag];
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
    let tags = tagString.split(isMulti);
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
    let word = terms.map(t => {
      return t.text || '[' + t.implicit + ']'
    }).join(' ');
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
      console.warn(`compromise: Invalid tag '${tag}'`);// eslint-disable-line
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
  var setTag$1 = setTag;

  // remove this tag, and its children, from these terms
  const unTag = function (terms, tag, tagSet) {
    tag = tag.trim().replace(/^#/, '');
    for (let i = 0; i < terms.length; i += 1) {
      let term = terms[i];
      // support clearing all tags, with '*'
      if (tag === '*') {
        term.tags.clear();
        continue
      }
      // for known tags, do logical dependencies first
      let known = tagSet[tag];
      // removing #Verb should also remove #PastTense
      if (known && known.children.length > 0) {
        for (let o = 0; o < known.children.length; o += 1) {
          term.tags.delete(known.children[o]);
        }
      }
      term.tags.delete(tag);
    }
  };
  var unTag$1 = unTag;

  const e=function(e){return e.children=e.children||[],e._cache=e._cache||{},e.props=e.props||{},e._cache.parents=e._cache.parents||[],e._cache.children=e._cache.children||[],e},t=/^ *(#|\/\/)/,n=function(t){let n=t.trim().split(/->/),r=[];n.forEach((t=>{r=r.concat(function(t){if(!(t=t.trim()))return null;if(/^\[/.test(t)&&/\]$/.test(t)){let n=(t=(t=t.replace(/^\[/,"")).replace(/\]$/,"")).split(/,/);return n=n.map((e=>e.trim())).filter((e=>e)),n=n.map((t=>e({id:t}))),n}return [e({id:t})]}(t));})),r=r.filter((e=>e));let i=r[0];for(let e=1;e<r.length;e+=1)i.children.push(r[e]),i=r[e];return r[0]},r=(e,t)=>{let n=[],r=[e];for(;r.length>0;){let e=r.pop();n.push(e),e.children&&e.children.forEach((n=>{t&&t(e,n),r.push(n);}));}return n},i=e=>"[object Array]"===Object.prototype.toString.call(e),c=e=>(e=e||"").trim(),s=function(c=[]){return "string"==typeof c?function(r){let i=r.split(/\r?\n/),c=[];i.forEach((e=>{if(!e.trim()||t.test(e))return;let r=(e=>{const t=/^( {2}|\t)/;let n=0;for(;t.test(e);)e=e.replace(t,""),n+=1;return n})(e);c.push({indent:r,node:n(e)});}));let s=function(e){let t={children:[]};return e.forEach(((n,r)=>{0===n.indent?t.children=t.children.concat(n.node):e[r-1]&&function(e,t){let n=e[t].indent;for(;t>=0;t-=1)if(e[t].indent<n)return e[t];return e[0]}(e,r).node.children.push(n.node);})),t}(c);return s=e(s),s}(c):i(c)?function(t){let n={};t.forEach((e=>{n[e.id]=e;}));let r=e({});return t.forEach((t=>{if((t=e(t)).parent)if(n.hasOwnProperty(t.parent)){let e=n[t.parent];delete t.parent,e.children.push(t);}else console.warn(`[Grad] - missing node '${t.parent}'`);else r.children.push(t);})),r}(c):(r(s=c).forEach(e),s);var s;},h=e=>"[31m"+e+"[0m",o=e=>"[2m"+e+"[0m",l=function(e,t){let n="-> ";t&&(n=o("→ "));let i="";return r(e).forEach(((e,r)=>{let c=e.id||"";if(t&&(c=h(c)),0===r&&!e.id)return;let s=e._cache.parents.length;i+="    ".repeat(s)+n+c+"\n";})),i},a=function(e){let t=r(e);t.forEach((e=>{delete(e=Object.assign({},e)).children;}));let n=t[0];return n&&!n.id&&0===Object.keys(n.props).length&&t.shift(),t},p={text:l,txt:l,array:a,flat:a},d=function(e,t){return "nested"===t||"json"===t?e:"debug"===t?(console.log(l(e,!0)),null):p.hasOwnProperty(t)?p[t](e):e},u=e=>{r(e,((e,t)=>{e.id&&(e._cache.parents=e._cache.parents||[],t._cache.parents=e._cache.parents.concat([e.id]));}));},f$1=(e,t)=>(Object.keys(t).forEach((n=>{if(t[n]instanceof Set){let r=e[n]||new Set;e[n]=new Set([...r,...t[n]]);}else {if((e=>e&&"object"==typeof e&&!Array.isArray(e))(t[n])){let r=e[n]||{};e[n]=Object.assign({},t[n],r);}else i(t[n])?e[n]=t[n].concat(e[n]||[]):void 0===e[n]&&(e[n]=t[n]);}})),e),j=/\//;class g$1{constructor(e={}){Object.defineProperty(this,"json",{enumerable:!1,value:e,writable:!0});}get children(){return this.json.children}get id(){return this.json.id}get found(){return this.json.id||this.json.children.length>0}props(e={}){let t=this.json.props||{};return "string"==typeof e&&(t[e]=!0),this.json.props=Object.assign(t,e),this}get(t){if(t=c(t),!j.test(t)){let e=this.json.children.find((e=>e.id===t));return new g$1(e)}let n=((e,t)=>{let n=(e=>"string"!=typeof e?e:(e=e.replace(/^\//,"")).split(/\//))(t=t||"");for(let t=0;t<n.length;t+=1){let r=e.children.find((e=>e.id===n[t]));if(!r)return null;e=r;}return e})(this.json,t)||e({});return new g$1(n)}add(t,n={}){if(i(t))return t.forEach((e=>this.add(c(e),n))),this;t=c(t);let r=e({id:t,props:n});return this.json.children.push(r),new g$1(r)}remove(e){return e=c(e),this.json.children=this.json.children.filter((t=>t.id!==e)),this}nodes(){return r(this.json).map((e=>(delete(e=Object.assign({},e)).children,e)))}cache(){return (e=>{let t=r(e,((e,t)=>{e.id&&(e._cache.parents=e._cache.parents||[],e._cache.children=e._cache.children||[],t._cache.parents=e._cache.parents.concat([e.id]));})),n={};t.forEach((e=>{e.id&&(n[e.id]=e);})),t.forEach((e=>{e._cache.parents.forEach((t=>{n.hasOwnProperty(t)&&n[t]._cache.children.push(e.id);}));})),e._cache.children=Object.keys(n);})(this.json),this}list(){return r(this.json)}fillDown(){var e;return e=this.json,r(e,((e,t)=>{t.props=f$1(t.props,e.props);})),this}depth(){u(this.json);let e=r(this.json),t=e.length>1?1:0;return e.forEach((e=>{if(0===e._cache.parents.length)return;let n=e._cache.parents.length+1;n>t&&(t=n);})),t}out(e){return u(this.json),d(this.json,e)}debug(){return u(this.json),d(this.json,"debug"),this}}const _=function(e){let t=s(e);return new g$1(t)};_.prototype.plugin=function(e){e(this);};

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

  var colors$1 = colors;

  const getColor = function (node) {
    if (colors$1.hasOwnProperty(node.id)) {
      return colors$1[node.id]
    }
    if (colors$1.hasOwnProperty(node.is)) {
      return colors$1[node.is]
    }
    let found = node._cache.parents.find(c => colors$1[c]);
    return colors$1[found]
  };

  // convert tags to our final format
  const fmt = function (nodes) {
    const res = {};
    nodes.forEach(node => {
      let { not, also, is, novel } = node.props;
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
        color: getColor(node)
      };
    });
    // lastly, add all children of all nots
    Object.keys(res).forEach(k => {
      let nots = new Set(res[k].not);
      res[k].not.forEach(not => {
        if (res[not]) {
          res[not].children.forEach(tag => nots.add(tag));
        }
      });
      res[k].not = Array.from(nots);
    });
    return res
  };

  var fmt$1 = fmt;

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
      let nots = tags[k].not || [];
      nots.forEach(no => {
        if (tags[no] && tags[no].not) {
          tags[no].not.push(k);
        }
      });
    });
    return tags
  };
  var validate$1 = validate;

  // 'fill-down' parent logic inference
  const compute$2 = function (allTags) {
    // setup graph-lib format
    const flatList = Object.keys(allTags).map(k => {
      let o = allTags[k];
      const props = { not: new Set(o.not), also: o.also, is: o.is, novel: o.novel };
      return { id: k, parent: o.is, props, children: [] }
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
    tags = validate$1(tags, already);

    let allTags = Object.assign({}, already, tags);
    // do some basic setting-up
    // 'fill-down' parent logic
    const nodes = compute$2(allTags);
    // convert it to our final format
    const res = fmt$1(nodes);
    return res
  };
  var addTags$2 = addTags$1;

  var methods$3 = {
    one: {
      setTag: setTag$1,
      unTag: unTag$1,
      addTags: addTags$2
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
      let terms = this.termList();
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
      let terms = this.termList();
      if (terms.length === 0) {
        return this
      }
      const { methods, verbose, model } = this;
      // logger
      if (verbose === true) {
        console.log(' -  ', input, reason || '');
      }
      let tagSet = model.one.tagSet;
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
      let tagSet = this.model.one.tagSet;
      // everything can be an unknown tag
      if (!tagSet.hasOwnProperty(tag)) {
        return this
      }
      let not = tagSet[tag].not || [];
      let nope = [];
      this.document.forEach((terms, n) => {
        terms.forEach((term, i) => {
          let found = not.find(no => term.tags.has(no));
          if (found) {
            nope.push([n, i, i + 1]);
          }
        });
      });
      let noDoc = this.update(nope);
      return this.difference(noDoc)
    },
  };
  var tag$1 = fns;

  const tagAPI = function (View) {
    Object.assign(View.prototype, tag$1);
  };
  var api$c = tagAPI;

  // wire-up more pos-tags to our model
  const addTags = function (tags) {
    const { model, methods } = this.world();
    const tagSet = model.one.tagSet;
    const fn = methods.one.addTags;
    let res = fn(tags, tagSet);
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
      let aKids = kids.length;
      kids = tagSet[b].children || [];
      let bKids = kids.length;
      return aKids - bKids
    });
    return tags
  };

  const tagRank = function (view) {
    const { document, world } = view;
    const tagSet = world.model.one.tagSet;
    document.forEach(terms => {
      terms.forEach(term => {
        let tags = Array.from(term.tags);
        term.tagRank = sortByKids(tags, tagSet);
      });
    });
  };
  var tagRank$1 = tagRank;

  var tag = {
    model: {
      one: { tagSet: {} }
    },
    compute: {
      tagRank: tagRank$1
    },
    methods: methods$3,
    api: api$c,
    lib: lib$1
  };

  // split by periods, question marks, unicode ⁇, etc
  const initSplit = /([.!?\u203D\u2E18\u203C\u2047-\u2049]+\s)/g;
  // merge these back into prev sentence
  const splitsOnly = /^[.!?\u203D\u2E18\u203C\u2047-\u2049]+\s$/;
  const newLine = /((?:\r?\n|\r)+)/; // Match different new-line formats

  // Start with a regex:
  const basicSplit = function (text) {
    let all = [];
    //first, split by newline
    let lines = text.split(newLine);
    for (let i = 0; i < lines.length; i++) {
      //split by period, question-mark, and exclamation-mark
      let arr = lines[i].split(initSplit);
      for (let o = 0; o < arr.length; o++) {
        // merge 'foo' + '.'
        if (arr[o + 1] && splitsOnly.test(arr[o + 1]) === true) {
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
  var simpleSplit = basicSplit;

  const hasLetter$1 = /[a-z0-9\u00C0-\u00FF\u00a9\u00ae\u2000-\u3300\ud000-\udfff]/i;
  const hasSomething$1 = /\S/;

  const notEmpty = function (splits) {
    let chunks = [];
    for (let i = 0; i < splits.length; i++) {
      let s = splits[i];
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
  var simpleMerge = notEmpty;

  //loop through these chunks, and join the non-sentence chunks back together..
  const smartMerge = function (chunks, world) {
    const isSentence = world.methods.one.tokenize.isSentence;
    const abbrevs = world.model.one.abbreviations || new Set();

    let sentences = [];
    for (let i = 0; i < chunks.length; i++) {
      let c = chunks[i];
      //should this chunk be combined with the next one?
      if (chunks[i + 1] && isSentence(c, abbrevs) === false) {
        chunks[i + 1] = c + (chunks[i + 1] || '');
      } else if (c && c.length > 0) {
        //this chunk is a proper sentence..
        sentences.push(c);
        chunks[i] = '';
      }
    }
    return sentences
  };
  var smartMerge$1 = smartMerge;

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
  };
  const openQuote = RegExp('(' + Object.keys(pairs).join('|') + ')', 'g');
  const closeQuote = RegExp('(' + Object.values(pairs).join('|') + ')', 'g');

  const closesQuote = function (str) {
    if (!str) {
      return false
    }
    let m = str.match(closeQuote);
    if (m !== null && m.length === 1) {
      return true
    }
    return false
  };

  // allow micro-sentences when inside a quotation, like:
  // the doc said "no sir. i will not beg" and walked away.
  const quoteMerge = function (splits) {
    let arr = [];
    for (let i = 0; i < splits.length; i += 1) {
      let split = splits[i];
      // do we have an open-quote and not a closed one?
      let m = split.match(openQuote);
      if (m !== null && m.length === 1) {

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
          let toAdd = splits[i + 1] + splits[i + 2];// merge them all
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
  var quoteMerge$1 = quoteMerge;

  const MAX_LEN = 250;// ¯\_(ツ)_/¯

  // support unicode variants?
  // https://stackoverflow.com/questions/13535172/list-of-all-unicodes-open-close-brackets
  const hasOpen = /\(/g;
  const hasClosed = /\)/g;
  const mergeParens = function (splits) {
    let arr = [];
    for (let i = 0; i < splits.length; i += 1) {
      let split = splits[i];
      let m = split.match(hasOpen);
      if (m !== null && m.length === 1) {
        // look at next sentence, for closing parenthesis
        if (splits[i + 1] && splits[i + 1].length < MAX_LEN) {
          let m2 = splits[i + 1].match(hasClosed);
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
  var parensMerge = mergeParens;

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
    // cleanup unicode-spaces
    text = text.replace('\xa0', ' ');
    // First do a greedy-split..
    let splits = simpleSplit(text);
    // Filter-out the crap ones
    let sentences = simpleMerge(splits);
    //detection of non-sentence chunks:
    sentences = smartMerge$1(sentences, world);
    // allow 'he said "no sir." and left.'
    sentences = quoteMerge$1(sentences);
    // allow 'i thought (no way!) and left.'
    sentences = parensMerge(sentences);
    //if we never got a sentence, return the given text
    if (sentences.length === 0) {
      return [text]
    }
    //move whitespace to the ends of sentences, when possible
    //['hello',' world'] -> ['hello ','world']
    for (let i = 1; i < sentences.length; i += 1) {
      let ws = sentences[i].match(startWhitespace);
      if (ws !== null) {
        sentences[i - 1] += ws[0];
        sentences[i] = sentences[i].replace(startWhitespace, '');
      }
    }
    return sentences
  };
  var splitSentences$1 = splitSentences;

  const hasHyphen = function (str, model) {
    let parts = str.split(/[-–—]/);
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
    let reg = /^([a-z\u00C0-\u00FF`"'/]+)[-–—]([a-z0-9\u00C0-\u00FF].*)/i;
    if (reg.test(str) === true) {
      return true
    }
    //number-letter '20-aug'
    let reg2 = /^([0-9]{1,4})[-–—]([a-z\u00C0-\u00FF`"'/-]+$)/i;
    if (reg2.test(str) === true) {
      return true
    }
    return false
  };

  const splitHyphens = function (word) {
    let arr = [];
    //support multiple-hyphenated-terms
    const hyphens = word.split(/[-–—]/);
    let whichDash = '-';
    let found = word.match(/[-–—]/);
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
  var combineRanges$1 = combineRanges;

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
  var combineSlashes$1 = combineSlashes;

  const wordlike = /\S/;
  const isBoundary = /^[!?.]+$/;
  const naiiveSplit = /(\S+)/;

  let notWord = ['.', '?', '!', ':', ';', '-', '–', '—', '--', '...', '(', ')', '[', ']', '"', "'", '`', '«', '»', '*'];
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
      let word = arr[i];
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
    result = combineSlashes$1(result);
    result = combineRanges$1(result);
    // remove empty results
    result = result.filter(s => s);
    return result
  };
  var splitTerms = splitWords;

  //all punctuation marks, from https://en.wikipedia.org/wiki/Punctuation

  //we have slightly different rules for start/end - like #hashtags.
  const isLetter = /\p{Letter}/u;
  const isNumber = /[\p{Number}\p{Currency_Symbol}]/u;
  const hasAcronym = /^[a-z]\.([a-z]\.)+/i;
  const chillin = /[sn]['’]$/;

  const normalizePunctuation = function (str, model) {
    // quick lookup for allowed pre/post punctuation
    let { prePunctuation, postPunctuation, emoticons } = model.one;
    let original = str;
    let pre = '';
    let post = '';
    let chars = Array.from(str);

    // punctuation-only words, like '<3'
    if (emoticons.hasOwnProperty(str.trim())) {
      return { str: str.trim(), pre, post: ' ' } //not great
    }

    // pop any punctuation off of the start
    let len = chars.length;
    for (let i = 0; i < len; i += 1) {
      let c = chars[0];
      // keep any declared chars
      if (prePunctuation[c] === true) {
        continue//keep it
      }
      // keep '+' or '-' only before a number
      if ((c === '+' || c === '-') && isNumber.test(chars[1])) {
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
      let c = chars[chars.length - 1];
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
  var tokenize$4 = normalizePunctuation;

  const parseTerm = (txt, model) => {
    // cleanup any punctuation as whitespace
    let { str, pre, post } = tokenize$4(txt, model);
    const parsed = {
      text: str,
      pre: pre,
      post: post,
      tags: new Set(),
    };
    return parsed
  };
  var splitWhitespace = parseTerm;

  // 'Björk' to 'Bjork'.
  const killUnicode = function (str, world) {
    const unicode = world.model.one.unicode || {};
    str = str || '';
    let chars = str.split('');
    chars.forEach((s, i) => {
      if (unicode[s]) {
        chars[i] = unicode[s];
      }
    });
    return chars.join('')
  };
  var killUnicode$1 = killUnicode;

  /** some basic operations on a string to reduce noise */
  const clean = function (str) {
    str = str || '';
    str = str.toLowerCase();
    str = str.trim();
    let original = str;
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
  var cleanup = clean;

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
  var doAcronyms = doAcronym;

  const normalize = function (term, world) {
    const killUnicode = world.methods.one.killUnicode;
    // console.log(world.methods.one)
    let str = term.text || '';
    str = cleanup(str);
    //(very) rough ASCII transliteration -  bjŏrk -> bjork
    str = killUnicode(str, world);
    str = doAcronyms(str);
    term.normal = str;
  };
  var normal = normalize;

  // turn a string input into a 'document' json format
  const parse$1 = function (input, world) {
    const { methods, model } = world;
    const { splitSentences, splitTerms, splitWhitespace } = methods.one.tokenize;
    input = input || '';
    // split into sentences
    let sentences = splitSentences(input, world);
    // split into word objects
    input = sentences.map((txt) => {
      let terms = splitTerms(txt, model);
      // split into [pre-text-post]
      terms = terms.map(t => splitWhitespace(t, model));
      // add normalized term format, always
      terms.forEach((t) => {
        normal(t, world);
      });
      return terms
    });
    return input
  };
  var fromString = parse$1;

  const isAcronym$1 = /[ .][A-Z]\.? *$/i; //asci - 'n.s.a.'
  const hasEllipse = /(?:\u2026|\.{2,}) *$/; // '...'
  const hasLetter = /\p{L}/u;
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
    let txt = str.replace(/[.!?\u203D\u2E18\u203C\u2047-\u2049] *$/, '');
    let words = txt.split(' ');
    let lastWord = words[words.length - 1].toLowerCase();
    // check for 'Mr.'
    if (abbrevs.hasOwnProperty(lastWord) === true) {
      return false
    }
    // //check for jeopardy!
    // if (blacklist.hasOwnProperty(lastWord)) {
    //   return false
    // }
    return true
  };
  var isSentence$1 = isSentence;

  var methods$2 = {
    one: {
      killUnicode: killUnicode$1,
      tokenize: {
        splitSentences: splitSentences$1,
        isSentence: isSentence$1,
        splitTerms,
        splitWhitespace,
        fromString,
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
  var aliases$1 = aliases;

  var misc$3 = [
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
  let list = [
    [misc$3],
    [units, 'Unit'],
    [nouns$2, 'Noun'],
    [honorifics, 'Honorific'],
    [months, 'Month'],
    [organizations, 'Organization'],
    [places, 'Place'],
  ];
  // create key-val for sentence-tokenizer
  let abbreviations = {};
  // add them to a future lexicon
  let lexicon$1 = {};

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
  let compact$1 = {
    '!': '¡',
    '?': '¿Ɂ',
    '"': '“”"❝❞',
    "'": '‘‛❛❜’',
    '-': '—–',
    a: 'ªÀÁÂÃÄÅàáâãäåĀāĂăĄąǍǎǞǟǠǡǺǻȀȁȂȃȦȧȺΆΑΔΛάαλАаѦѧӐӑӒӓƛæ',
    b: 'ßþƀƁƂƃƄƅɃΒβϐϦБВЪЬвъьѢѣҌҍ',
    c: '¢©ÇçĆćĈĉĊċČčƆƇƈȻȼͻͼϲϹϽϾСсєҀҁҪҫ',
    d: 'ÐĎďĐđƉƊȡƋƌ',
    e: 'ÈÉÊËèéêëĒēĔĕĖėĘęĚěƐȄȅȆȇȨȩɆɇΈΕΞΣέεξϵЀЁЕеѐёҼҽҾҿӖӗ',
    f: 'ƑƒϜϝӺӻҒғſ',
    g: 'ĜĝĞğĠġĢģƓǤǥǦǧǴǵ',
    h: 'ĤĥĦħƕǶȞȟΉΗЂЊЋНнђћҢңҤҥҺһӉӊ',
    I: 'ÌÍÎÏ',
    i: 'ìíîïĨĩĪīĬĭĮįİıƖƗȈȉȊȋΊΐΪίιϊІЇії',
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
  let unicode$2 = {};
  Object.keys(compact$1).forEach(function (k) {
    compact$1[k].split('').forEach(function (s) {
      unicode$2[s] = k;
    });
  });
  var unicode$3 = unicode$2;

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
      aliases: aliases$1,
      abbreviations,
      prefixes,
      suffixes: suffixes$1,
      prePunctuation,
      postPunctuation,
      lexicon: lexicon$1, //give this one forward
      unicode: unicode$3,
      emoticons
    },
  };

  const hasSlash = /\//;
  const hasDomain = /[a-z]\.[a-z]/i;
  const isMath = /[0-9]/;
  // const hasSlash = /[a-z\u00C0-\u00FF] ?\/ ?[a-z\u00C0-\u00FF]/
  // const hasApostrophe = /['’]s$/

  const addAliases = function (term, world) {
    let str = term.normal || term.text || term.machine;
    const aliases = world.model.one.aliases;
    // lookup known aliases like '&'
    if (aliases.hasOwnProperty(str)) {
      term.alias = term.alias || [];
      term.alias.push(aliases[str]);
    }
    // support slashes as aliases
    if (hasSlash.test(str) && !hasDomain.test(str) && !isMath.test(str)) {
      let arr = str.split(hasSlash);
      // don't split urls and things
      if (arr.length <= 2) {
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
  var alias = addAliases;

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
  var machine = doMachine;

  // sort words by frequency
  const freq = function (view) {
    let docs = view.docs;
    let counts = {};
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        let term = docs[i][t];
        let word = term.machine || term.normal;
        counts[word] = counts[word] || 0;
        counts[word] += 1;
      }
    }
    // add counts on each term
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        let term = docs[i][t];
        let word = term.machine || term.normal;
        term.freq = counts[word];
      }
    }
  };
  var freq$1 = freq;

  // get all character startings in doc
  const offset = function (view) {
    let elapsed = 0;
    let index = 0;
    let docs = view.document; //start from the actual-top
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        let term = docs[i][t];
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


  var offset$1 = offset;

  // cheat- add the document's pointer to the terms
  const index = function (view) {
    // console.log('reindex')
    let document = view.document;
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

  var index$1 = index;

  const wordCount = function (view) {
    let n = 0;
    let docs = view.docs;
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

  var wordCount$1 = wordCount;

  // cheat-method for a quick loop
  const termLoop = function (view, fn) {
    let docs = view.docs;
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        fn(docs[i][t], view.world);
      }
    }
  };

  const methods$1 = {
    alias: (view) => termLoop(view, alias),
    machine: (view) => termLoop(view, machine),
    normal: (view) => termLoop(view, normal),
    freq: freq$1,
    offset: offset$1,
    index: index$1,
    wordCount: wordCount$1,
  };
  var compute$1 = methods$1;

  var tokenize$3 = {
    compute: compute$1,
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
    let lastPhrase = docs[docs.length - 1] || [];
    let lastTerm = lastPhrase[lastPhrase.length - 1];
    // if we've already put whitespace, end.
    if (lastTerm.post) {
      return
    }
    // if we found something
    if (prefixes.hasOwnProperty(lastTerm.normal)) {
      let found = prefixes[lastTerm.normal];
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
    let lastPhrase = docs[docs.length - 1] || [];
    let term = lastPhrase[lastPhrase.length - 1];
    if (term.typeahead === true && term.machine) {
      term.text = term.machine;
      term.normal = term.machine;
    }
    return this
  };

  const api$a = function (View) {
    View.prototype.autoFill = autoFill;
  };
  var api$b = api$a;

  // generate all the possible prefixes up-front
  const getPrefixes = function (arr, opts, world) {
    let index = {};
    let collisions = [];
    let existing = world.prefixes || {};
    arr.forEach((str) => {
      str = str.toLowerCase().trim();
      let max = str.length;
      if (opts.max && max > opts.max) {
        max = opts.max;
      }
      for (let size = opts.min; size < max; size += 1) {
        let prefix = str.substring(0, size);
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

  var allPrefixes = getPrefixes;

  const isObject = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  const defaults = {
    safe: true,
    min: 3,
  };

  const prepare = function (words = [], opts = {}) {
    let model = this.model();
    opts = Object.assign({}, defaults, opts);
    if (isObject(words)) {
      Object.assign(model.one.lexicon, words);
      words = Object.keys(words);
    }
    let prefixes = allPrefixes(words, opts, this.world());
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
    api: api$b,
    lib,
    compute,
    hooks: ['typeahead']
  };

  // order here matters
  nlp$1.extend(change); //0kb
  nlp$1.extend(output); //0kb
  nlp$1.extend(match); //10kb
  nlp$1.extend(pointers); //2kb
  nlp$1.extend(tag); //2kb
  nlp$1.plugin(contractions$2); //~6kb
  nlp$1.extend(tokenize$3); //7kb
  nlp$1.plugin(cache$1); //~1kb
  nlp$1.extend(lookup); //7kb
  nlp$1.extend(typeahead); //1kb
  nlp$1.extend(lexicon$2); //1kb
  nlp$1.extend(sweep); //1kb

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
  var unicode$1 = unicode;

  var contractions$1 = [
    // { word: 'del', out: ['di', 'il'] },
    // { word: 'dello', out: ['di', 'lo'] },
    // { word: 'della', out: ['di', 'la'] },
    // { word: 'dell', out: ['di', 'l'] },
    // { word: 'dei', out: ['di', 'i'] },
    // { word: 'degli', out: ['di', 'gli'] },
    // { word: 'delle', out: ['di', 'le'] },
    // { word: 'col', out: ['con', 'il'] },
    // { word: 'coi', out: ['con', 'i'] },
    // { word: 'al', out: ['a', 'il'] },
    // { word: 'allo', out: ['a', 'lo'] },
    // { word: 'alla', out: ['a', 'la'] },
    // { word: 'all', out: ['a', 'l'] },
    // { word: 'ai', out: ['a', 'i'] },
    // { word: 'agli', out: ['a', 'gli'] },
    // { word: 'alle', out: ['a', 'le'] },
    // { word: 'sul', out: ['su', 'il'] },
    // { word: 'sulla', out: ['su', 'la'] },
    // { word: 'sullo', out: ['su', 'lo'] },
    // { word: 'sugli', out: ['su', 'gli'] },

  ];

  var tokenize$2 = {
    mutate: (world) => {
      world.model.one.unicode = unicode$1;

      world.model.one.contractions = contractions$1;

      // 'que' -> 'quebec'
      delete world.model.one.lexicon.que;
    }
  };

  var version = '0.1.5';

  const prefix$1 = /^.([0-9]+)/;

  // handle compressed form of key-value pair
  const getKeyVal = function (word, model) {
    let val = model.exceptions[word];
    let m = val.match(prefix$1);
    if (m === null) {
      // return not compressed form
      return model.exceptions[word]
    }
    // uncompress it
    let num = Number(m[1]) || 0;
    let pre = word.substr(0, num);
    return pre + val.replace(prefix$1, '')
  };

  // get suffix-rules according to last char of word
  const getRules = function (word, rules = {}) {
    let char = word[word.length - 1];
    let list = rules[char] || [];
    // do we have a generic suffix?
    if (rules['']) {
      list = list.concat(rules['']);
    }
    return list
  };

  const convert = function (word, model, debug) {
    // check list of irregulars
    if (model.exceptions.hasOwnProperty(word)) {
      if (debug) {
        console.log("exception, ", word, model.exceptions[word]);
      }
      return getKeyVal(word, model)
    }
    // if model is reversed, try rev rules
    let rules = model.rules;
    if (model.reversed) {
      rules = model.rev;
    }
    // try suffix rules
    rules = getRules(word, rules);
    for (let i = 0; i < rules.length; i += 1) {
      let suffix = rules[i][0];
      if (word.endsWith(suffix)) {
        if (debug) {
          console.log("rule, ", rules[i]);
        }
        let reg = new RegExp(suffix + '$');
        return word.replace(reg, rules[i][1])
      }
    }
    if (debug) {
      console.log(' x - ' + word);
    }
    // return the original word unchanged
    return word
  };
  var convert$1 = convert;

  const reverseObj = function (obj) {
    return Object.entries(obj).reduce((h, a) => {
      h[a[1]] = a[0];
      return h
    }, {})
  };

  const reverse = function (model) {
    let { rules, exceptions, rev } = model;
    exceptions = reverseObj(exceptions);
    return {
      reversed: !Boolean(model.reversed),//toggle this
      rules,
      exceptions,
      rev
    }
  };
  var reverse$1 = reverse;

  const prefix = /^([0-9]+)/;

  const expand = function (key = '', val = '') {
    val = String(val);
    let m = val.match(prefix);
    if (m === null) {
      return val
    }
    let num = Number(m[1]) || 0;
    let pre = key.substring(0, num);
    let full = pre + val.replace(prefix, '');
    return full
  };

  const unpack$3 = function (str = '') {
    let out = { rules: [], exceptions: {} };
    let [rules, exceptions] = str.split('==');
    // unpack rules
    rules = rules || '';
    rules.split(',').forEach(txt => {
      let [a, b] = txt.split(':');
      let len = a.length;
      if (len) {
        out.rules[len] = out.rules[len] || {};
        out.rules[len][a] = expand(a, b);
      }
    });
    // clean empties up a bit
    for (let i = 0; i < out.rules.length; i += 1) {
      out.rules[i] = out.rules[i] || {};
    }

    // unpack exceptions
    exceptions = exceptions || '';
    exceptions.split(',').forEach(txt => {
      let [a, b] = txt.split(':');
      out.exceptions[a] = expand(a, b);
    });
    return out
  };
  var uncompress = unpack$3;

  // generated in ./lib/models
  var model$1 = {
    "nouns": {
      "plural": "o:i,e:i,a:i,s:i,m:a,y:ies,u:1s,an:en,io:ei,us:ora,as:2,by:2,ka:2,ao:2,is:2,es:2,oa:2,na:2,dy:2,ia:2,om:2,ss:2,oy:2,ie:2,ry:2,ay:2,sa:2,ly:2,ns:2,ky:2,ha:2,em:2,am:2,im:2,ze:2,ke:2,nk:2s,ho:2s,ey:2,ja:2,ty:2,ds:2,ae:2,rs:2,hm:2,ee:2s,cy:2,umi:l.,oio:2,cco:2hi,sco:2hi,bum:3,ngo:2hi,bio:2,ium:3,bus:3,tan:3,cue:3,ige:3s,mio:2,log:3s,fio:2,dge:3,uco:2hi,bue:2oi,yte:3s,tus:3,lco:2hi,ute:3,aos:3,lan:3,ola:3,dra:3,ila:3,van:3,sus:3,cus:3,rum:3,era:3,ege:3s,cce:3,ise:3,lum:3,ive:3,eus:3,uca:2hi,ble:3,oit:3s,tum:3,lpe:3,lla:3,oba:3,mus:3,loo:3,gle:3,dum:3,dus:3,use:3,alm:3,cos:3,hos:3,sos:3,num:3,rse:3,ugo:2hi,zle:3,nce:3,bba:3,mba:3,poo:3,tle:3,los:3,eve:3,ard:3s,kle:3,ban:3,oda:3,mos:3,cum:3,dos:3,deo:3,lgo:2hi,ela:3,cca:2hi,ica:2hi,eca:2hi,nca:2hi,ula:3,oca:2hi,rla:3,ario:3,iaio:3,agio:3,ddio:3i,erio:3,aire:4s,ncio:3,avio:3,ergo:3hi,erco:3hi,anco:3hi,arco:3hi,sset:4s,stio:3,urio:3,vvio:3i,baco:3hi,acio:3,iuga:4,baio:3i,ttio:3i,rage:4,rrio:4s,gala:4,ieco:3hi,taio:3,vico:3hi,onus:4,orgo:3hi,gaio:3,onco:3hi,usio:3i,buio:3,caco:3hi,maio:3,opio:3,laio:3,aman:4,mpus:4,ppio:3,prio:3,tigo:3hi,ceco:3hi,hane:4,stra:4,esio:3,agne:4,tora:4,azio:3,egio:3,elio:3,nema:4,tuno:4,irco:3hi,obra:4,rcio:3,rzio:3,peco:3hi,itio:3i,aler:4s,irio:3,elta:4,gogo:3hi,uvio:3,iego:3hi,nguo:4,nire:4,inus:4,erra:4,tita:4,ogio:3,mpio:3,rdio:3,viva:4,xtra:4,igio:3,oppy:4,caio:3,zebo:4,enio:3i,asio:3,iogo:3hi,vago:3hi,unco:3hi,osio:3,uaio:3,teco:3hi,daio:3,ware:4s,ippy:4,zaio:3,rvio:3,ucio:3,ugio:3,unio:3,rsio:3,nvio:3i,umbo:4,mono:4,kage:4,arpe:4,zine:4,itre:4,ntra:4,rine:4s,upio:3,nage:4,icro:4,drio:3,itra:4,vaio:3,anta:4,ligo:3hi,blio:3i,paco:3hi,alio:3,inco:3hi,erre:4,tner:4s,iche:4s,uche:4,come:4,zico:3hi,epio:3,eblo:4s,lman:4,dman:4,irus:4,ghio:3,rogo:3hi,tole:4,saio:3,ezio:3,vice:4,fogo:3hi,erpa:4,etch:4es,iman:4,head:4s,ogan:4s,cala:4,pago:3hi,nsor:4s,rpio:3,cico:3hi,lace:4,saco:3hi,urus:2i,rnio:3,loco:3hi,ette:4,heco:3hi,urco:3hi,ltra:4,sage:4,tape:4,lnus:2era,kman:4,arpa:3e,asca:3hi,erca:3hi,esca:3hi,oviro:iviri,uente:g.,uccio:4,sorio:4,onado:5s,oggio:4,cchio:4,occio:4,itrio:4i,hivio:4,elago:4hi,madio:4,tizio:4,fizio:4,sinio:4i,sedio:4,atrio:4,picio:4,vorio:4,lamme:5s,arman:5,stare:5,inaio:4,eller:5s,rraio:4,iccio:4,bivio:4i,esman:5,olage:5,roker:5s,tolio:4i,ichio:4i,amine:5,oscio:4,opolo:5,inero:5s,bonio:4i,digan:5,arico:4hi,rnaio:4,alogo:4hi,rchio:4,harme:5s,eccio:4,golio:4i,licio:4,llage:5s,llega:4hi,mizio:4,cilio:4,conio:4,icapo:5,ranio:4,cendo:5,verba:5,cuoco:4hi,abase:5,livio:4,manio:4,iurgo:4hi,monio:4,ricio:4,iscio:4,ecido:5s,ietro:5,iesse:5,brigo:4hi,drago:4hi,turgo:4hi,cidio:4,lenco:4hi,bargo:4hi,porio:4,ilogo:4hi,nicio:4,otage:5,cizio:4,ascio:4,tidio:4,frago:4hi,anaso:5,oraio:4,schio:4,menco:5s,valle:5,lizio:4,rocio:4,pizio:4,adget:5s,tuomo:4ini,nglio:4,gster:5s,solio:4,nnaio:5,luomo:4ini,rarca:4hi,praio:4,traio:4,dizio:4,iugno:5,iuoco:4hi,anaio:4,anata:5,nchio:4,coste:5,palle:5,feste:5,ligan:5s,nscio:4,nizio:4,ludio:4,medio:4,trigo:4hi,iodio:4i,iamme:5,anate:5,largo:4hi,eader:5s,cinio:4,targo:4hi,gorio:4,brico:4hi,olago:5,omare:5,ubrio:4,tadio:4,iggio:4,micio:4,ofilm:5,narca:4hi,morio:4i,gozio:4,aosta:5,unzio:4,obrio:4,garca:4hi,eraio:4,equio:4,patio:4,iarca:4hi,rizio:4,rolio:4,plico:4hi,podio:4,avoce:5,rozio:4i,udico:4hi,totto:5,attro:5,radio:4i,rtage:5s,ttega:5,pudio:4,onzio:4i,escio:4,abato:5,dozio:4,tinio:4i,allio:4i,enzio:4,socio:4,preco:4hi,tereo:5,atega:4hi,tudio:5s,erman:5,ruomo:4ini,tedio:4i,efilm:5,innio:4i,tanio:4i,sfuga:4hi,molio:4i,binio:4i,uraio:4,ville:5s,spaio:4,ogame:5s,vocio:4i,lfare:5,torta:4e,barca:4he,marca:4hi,ianza:4e,mosca:4hi,ofondo:ifondi,odanza:idanza,baglio:5,daggio:5,raccio:5,naggio:5,luente:5i,geggio:5,laccio:5,peggio:5,raglio:5,raggio:5,ifurto:6,piglio:5,ipista:6,baggio:5,ificio:5,tiglio:5,saggio:5,laggio:5,itorio:5,usilio:5,kstage:6,gaglio:5,taggio:5,naccio:5,attage:6s,vaglio:5,eficio:5,saglio:5,biglio:5,caggio:5,kmaker:6s,seggio:5,rillio:5i,roglio:5,pesino:6s,vaccio:5,eparto:6,fficio:6,oluogo:6,rovita:6,teggio:5,puglio:5,abrodo:6,ttorio:5,paccio:5,mmando:6s,uaglio:5,niglio:5,siglio:5,ltorio:5,tainer:6s,buente:5i,voglio:5,ifuoco:6,doglio:5,tuente:5i,ottage:6,quente:5i,taglio:5,taccio:5,librio:5,iaggio:5,gstore:6,isodio:5,paggio:5,esilio:5i,faggio:5,miglio:5,bbraio:6,maglio:5,figlio:5,maccio:5,foglio:5,ibordo:6,igioco:6,ilegge:6,moglio:5,giglio:5,heggio:5,reggio:5,viglio:5,zaglio:5,guscio:5,dillio:5,cendio:5,gaggio:5,ralcio:5,ruglio:5,assare:6,vaggio:5,gaccio:5,ibraio:5,uaggio:5,dibrio:5i,neggio:5,ntonio:5,onotte:6,lennio:5,cuglio:5,icipio:5,diglio:5,ovizio:5,belico:5hi,meggio:5,ocento:6,zaccio:5,brezza:6,utonio:5i,atesta:6,esidio:5i,etorio:5,ncipio:5i,ntorio:5,uennio:5i,rtorio:5,suglio:5,veglio:5,faccio:5,tillio:5i,coglio:5,hiolio:5i,atetto:6,ecento:6,villio:5i,ciolio:5,letico:5hi,naglio:5,lluogo:5hi,sporco:5hi,uatter:6s,rminio:5,enager:6s,briaco:5hi,valico:5hi,ogioco:5hi, fuoco:5hi,ogruppo:igruppo,matorio:6,apologo:6hi,oleggio:6,istrada:7,biennio:6,liaccio:6,lloquio:6i,mpendio:6,ecennio:6,ileggio:6,spendio:6,issidio:6,iofondo:1fondo,uopolio:6i,eloquio:6,rmaggio:6,fruscio:6i,iclasse:7,rbuglio:6,niaccio:6,aciglio:6,ramondo:7,abuglio:6i,gatorio:6,intrico:6hi,ratorio:6,gastore:7,zofondo:6i,onologo:6hi,nopolio:6,ovolume:7,gopolio:6,omaggio:6,vatorio:6,lleggio:6,ciaccio:6,igiorno:7,umaggio:6,rofondo:6i,prologo:6hi,icennio:6i,rotreno:7,igoglio:6,natorio:6,ilingua:7,ttennio:6i,lagente:7,iloquio:6,tofondo:6i,oloquio:6,ipendio:6,truscio:6,bbuglio:6,pporter:7s,ussidio:6i,ocalcio:7,cciglio:6a,ilometro:m.,ulatorio:7,aciamano:8,egazione:8,abinetto:8,apolista:8,ndominio:7i,chiaccio:7,rlatorio:7i,endaglio:7,edominio:7,driennio:7i,andaglio:7i,triennio:7,entimetro:m.,illimetri:m.,ochirurgo:8hi,hilometro:8i,uantennio:8i,sservizio:8,gorgoglio:8i,rantennio:8,ighiaccio:9,tantennio:8,rentennio:8i,ventennio:8,iterrorismo:11,==ago:2hi,agio:3,antico:5hi,apologo:6hi,arco:3hi,assolo:6,atrio:4,auto:4,baco:3hi,baio:3i,biennio:6,bivio:4i,brio:3i,bue:2oi,buio:3,bus:3,caco:3hi,calcio:5,banda:5,corrente:8,cosca:5,capogruppo:10,servizio:8,stazione:8,struttura:9,cargo:5,cda:3,ceco:3hi,ciglio:5,club:4s,computer:8s,conio:4,cuoco:4hi,do:2,dominio:6i,drago:4hi,ds:2,eco:2hi,ego:3,eloquio:6,esilio:5i,euro:4,faggio:5,fan:3,fico:3hi,figlio:5,file:4,film:4s,foglio:5,frigo:5,fruscio:6i,fuoco:4hi,gala:4,game:4s,ghiaccio:7,giglio:5,gioco:4hi,gorgoglio:8i,guscio:5,hacker:6s,han:3,indio:5s,intrico:6hi,iodio:4i,killer:6s,km:2,ko:2,laccio:5,lago:3hi,lama:4,largo:4hi,leggio:5i,lettorato:9,list:4s,logo:3hi,luglio:6,luogo:4hi,maggio:6,man:3,manager:7s,marzo:5,mega:4,meglio:6,memento:7,metro:5,micio:4,mille:5,no:2,odio:3i,olio:3i,omaggio:6,omologo:6hi,orco:3hi,orgoglio:7,ozio:3,paggio:5,panda:5,patio:4,pendio:5i,peone:5s,piano:5,piglio:5,pio:2i,plico:4hi,pm:2,podio:4,porno:5,prologo:6hi,promo:5,puma:4,radio:4i,raggio:5,raglio:5,rambo:5,ratio:5s,rave:4,re:2,reporter:8s,rigo:3hi,rio:2i,rogo:3hi,saggio:5,saio:3,san:3,score:5s,seggio:5,socio:4,sodio:4i,sos:3,sporco:5hi,stage:5s,taglio:5,tedio:4i,tiglio:5,tizio:4,triennio:7,trio:3i,turbo:5,ulema:5,uomo:3ini,uscio:4,vago:3hi,vaglio:5,valico:5hi,van:3,ventennio:8,vice:4,vizio:4,vocio:4i,zio:2i,zoo:3,torta:4e,barca:4he,marca:4hi,paio:3i,mosca:4hi,oca:2hi,miglio:5==ki:1o,wi:2,xi:2,usi:2o,cmi:2e,pti:2o,afi:2o,lbi:2o,tmi:2o,gri:2o,vei:2o,roi:2e,ifi:2o,abi:2o,tei:2o,bei:2o,lzi:2o,lgi:2a,mei:2o,cm.:1entimetro,spi:2o,cei:2o,rgi:2o,cli:2o,fei:2o,gmi:2a,dui:2o,ebi:2o,lfi:2o,lsi:2o,pei:2o,ddi:2o,obi:2o,eci:2o,km.:1ilometro,goi:2s,fti:3,boi:2e,rli:2o,zoi:2o,bli:2o,uei:2o,lui:2o,pli:3,poi:2s,tsi:3,ngi:2a,cati:3o,aini:3o,issi:3o,coli:3o,biti:3o,zesi:3e,sivi:3o,orsi:3o,muli:3o,sati:3o,zoni:3e,rini:3o,cuti:3o,obbi:3o,lani:3o,nini:3o,ussi:3o,hani:3o,iaci:3o,rori:3e,gati:3o,uati:3o,meti:3o,zini:3o,beri:3o,bori:3e,eati:3o,ievi:3o,luci:3e,pini:3o,alti:3o,iani:3o,unni:3o,eari:3e,iosi:3o,sici:3o,hici:3o,temi:3a,geli:3o,iomi:3a,fili:3o,goli:3o,nali:3e,nani:3o,rali:3e,geti:3a,toli:3o,rili:3e,itri:3o,aici:3o,tipi:3o,covi:3o,gani:3o,hini:3o,meni:3o,nesi:3e,sini:3o,egni:3o,urdi:3o,nuti:3o,oidi:3e,tuti:3o,enei:3o,iesi:3e,buti:3o,erni:3o,vidi:3o,visi:3o,zeri:3o,ardi:3o,urri:3o,abbi:3o,uini:3o,iori:3e,agni:3o,noni:3e,doli:3o,boni:3e,resi:3e,lumi:3e,tavi:3o,simi:3o,foli:3o,auli:3e,beni:3e,tani:3o,lesi:3e,zeni:3e,ossi:3o,kini:4,imbi:3o,pedi:3e,heri:3o,ogni:3o,oati:3o,oeri:3o,nsai:4,onzi:3o,hesi:3e,zoli:3o,ruti:3o,uffi:3o,ulli:3o,poni:3e,uzzi:3o,amen:4,nili:3e,desi:3e,napi:3o,ncri:3o,abri:3o,noli:3o,zali:3e,capi:3o,giri:3o,ersi:3o,iofi:3o,eadi:3e,vali:3e,rubi:3o,sali:3e,casi:3o,voni:3e,cavi:3o,ceni:3o,edri:3o,effi:3o,eppi:3o,eali:3e,hili:3o,iodi:3o,pami:3e,cibi:3o,asei:4,ippi:3o,ioti:3a,vili:3e,guli:3o,meri:3o,anei:3o,fani:3o,oiti:3o,audi:3o,olmi:3o,modi:3o,sani:3o,muni:3e,gedi:3o,iugi:3e,sumi:3o,pesi:3o,loti:3a,eani:3o,orvi:3o,osmi:3o,urni:3o,eoli:3o,uoli:3o,somi:3a,bani:3o,culi:3o,eesi:3e,unei:3o,cupi:3o,dadi:3o,voti:3o,demi:3a,iuni:3o,emmi:3a,lomi:3a,ttti:3o,rupi:3o,divi:3o,dogi:3e,uomi:3o,brei:3o,dili:3e,elmi:3o,lemi:3a,irei:3o,zimi:3a,urei:3o,trei:3o,mesi:3e,suli:3e,iopi:3e,vasi:3o,bbri:3o,nami:3e,aoni:3e,maci:3o,auni:3o,deli:3e,erri:3o,eudi:3o,ropi:3o,sofi:3o,iumi:3e,fori:3o,zuti:3o,lcri:3o,fumi:3o,eoni:3e,oani:3o,dani:3o,ilei:3o,buli:3o,goti:3o,vami:3e,embi:3o,iuli:3e,ridi:3o,uppi:3o,uadi:3o,aiti:3o,gufi:3o,kiri:4,onei:3o,nudi:3o,peti:3o,paci:3e,cisi:3o,fami:3e,inni:3o,iemi:3e,ucri:3o,keni:3o,topi:3o,yani:3o,gumi:3e,fomi:3a,nodi:3o,uami:3e,uani:3o,ysti:3a,lodi:3o,lupi:3o,chos:3,magi:3o,gimi:3e,moti:3o,masi:3o,acri:3o,olei:3o,ocri:3e,oevi:3o,geri:3o,mimi:3o,irti:3o,duli:3o,davi:3o,moli:3o,orbi:3o,giti:3o,ugni:3o,muri:3o,usei:3o,muti:3o,utui:3o,utri:3o,kesi:3e,nidi:3o,seni:3o,gesi:3e,gici:3o,clei:3o,numi:3e,uovi:3o,bici:3e,veti:3o,undi:3o,otri:3e,vuli:3o,aesi:3e,nsti:3o,papi:3a,piri:3o,leli:3o,vesi:3e,peli:3o,peni:3e,pepi:3e,oemi:3a,oeti:3a,lipi:3o,pomi:3o,mmmi:3a,egui:3o,euti:3a,pubi:3e,gili:3e,pupi:3o,arzi:3o,duni:3o,pidi:3o,rasi:3o,eami:3e,duci:3e,onsi:3o,futi:3o,gidi:3o,novi:3o,osei:3o,seti:3o,rudi:3e,fagi:3o,rapi:3o,alpi:3o,ttri:3o,hemi:3a,erzi:3o,iiti:3a,ribi:3a,cudi:3o,uaci:3e,semi:3e,erdi:3e,celi:3o,luri:3o,mili:3e,veni:3o,suti:3o,oici:3o,upri:3o,buri:3o,anfi:3o,tufi:3o,xani:3o,fosi:3o,midi:3o,raci:3e,bidi:3o,rnei:3o,eini:3o,aumi:3a,buni:3o,ruci:3e,tubi:3o,urpi:3e,dovi:3o,veli:3o,avai:4,uosi:3o,firi:3o,zeli:3o,gomi:3o,blei:3a,basi:3e,roti:3a,suri:3a,olci:3e,suni:3o,foti:3o,cuni:3o,padi:3a,nadi:3o,lisi:4,nqui:3e,repi:3a,rogi:3a,nosi:4,levi:3a,noci:3e,pagi:3a,pipi:3a,hidi:3e,fasi:3e,atui:3a,irmi:3a,abati:4e,onati:4o,buoni:4o,itati:4o,itini:4o,tuali:4e,borti:4o,tisti:4a,ulici:4o,vismi:4o,acari:4o,emici:4o,ttoni:4e,cessi:4o,denti:4e,editi:4o,acidi:4o,acini:4o,relli:4o,renti:4e,onimi:4o,detti:4o,itivi:4o,orati:4o,dulti:4o,obili:4e,fanni:4o,ffidi:4o,liati:4o,ffini:4e,flati:4o,litti:4o,icani:4o,ttivi:4o,erati:4o,nelli:4o,agoni:4e,nismi:4o,nisti:4a,gosti:4o,ntini:4o,ironi:4e,aiuti:4o,utini:4o,rgoni:4e,olici:4o,zzati:4o,fisti:4a,lieni:4o,aliti:4o,larmi:4e,mismi:4o,rgeni:4e,ogeni:4o,aloni:4e,ltari:4e,forni:4o,lanti:4e,lgami:4a,uensi:4e,amari:4o,ienti:4e,iconi:4e,massi:4o,messi:4o,amori:4e,uleti:4o,zanti:4e,tismi:4o,dazzi:4o,vieni:5,droni:4e,ddoti:4o,sisti:4a,eatri:4o,rioni:4e,ratti:4o,ssoni:4e,olini:4o,imali:4e,nessi:4o,netti:4o,fatti:4o,otici:4o,cloni:4e,corpi:4o,idoti:4o,cisti:4a,pasti:4o,ipodi:4e,antri:4o,arati:4o,ietti:4o,nenti:4e,etiti:4o,ttiti:4o,disti:4a,ntati:4o,iloni:4e,bisti:4a,cioni:4e,ratri:4o,busti:4o,aismi:4o,rcani:4o,tetti:4o,travi:4e,cieri:4e,cigni:4o,aleni:4o,rdori:4e,rgini:4e,atici:4o,dioni:4e,aioli:4o,mieri:4e,onici:4o,aromi:4a,pioni:4e,biati:4o,rredi:4o,rrivi:4o,otini:4o,anati:4o,scari:4o,sceti:4a,amani:4o,colti:4o,asili:4o,aragi:4o,petti:4o,ranti:4e,ggini:4o,senti:4e,eismi:4o,eisti:4a,serti:4o,setti:4o,silli:4o,ciati:4o,oluti:4o,benti:4e,sunti:4o,astri:4o,nauti:4a,ipici:4o,tleti:4a,tolli:4o,ttesi:4o,ttici:4o,oniti:4o,triti:4o,udaci:4e,uguri:5o,gusti:4o,olati:4o,carri:4o,rolli:4o,datti:4a,dromi:4o,vieri:4e,utomi:4a,mezzi:4o,utori:4e,ontri:4o,treni:4o,valli:4o,dismi:4o,getti:4o,riati:4o,ccani:4o,cetti:4o,baffi:4o,ffoni:4e,nanti:4e,ncini:4o,lconi:4e,balli:4o,lordi:4o,lsami:4o,ltici:4o,zelli:4o,mbini:4o,nconi:4e,bandi:4o,eroni:4e,cconi:4e,rbari:4o,bieri:4e,urici:4o,rconi:4e,hismi:4o,aroni:4e,sotti:4o,tioni:4e,celli:4o,stoni:4e,lioni:4e,telli:4o,cuori:4e,ccini:4o,eceri:4o,elati:4o,aciti:4o,amini:4o,rviti:4o,tiami:4e,lesti:4e,ncori:4e,ipiti:4e,olori:4e,delli:4o,idoni:4e,gotti:4o,uismi:4o,ocali:4e,betti:4o,otori:4e,anici:4o,iondi:4o,rilli:4o,rmani:4o,cotti:4o,ipoti:4e,nonni:4o,sonti:4e,sturi:5,itumi:4e,zarri:4o,asoni:4e,ndati:4o,hiati:4o,ccali:4e,bolli:4o,aroli:4o,bordi:4o,selli:4o,rsoni:4e,ssoli:4o,botti:4o,zetti:4o,brani:4o,etoni:4e,vetti:4o,ganti:4e,ndisi:5,tanni:4o,brodi:4o,ruchi:3o,rutti:4o,buchi:3o,histi:4a,ufali:4o,imici:4o,lloni:4e,iorni:4o,umori:4e,rloni:4e,atesi:4e,rroni:4e,stini:4o,fuori:5,aviti:4e,broni:4e,caldi:4o,liffi:4o,calli:4o,calmi:4o,eonti:4e,malli:4o,nensi:4e,mmini:4o,mpani:4o,campi:4o,ielli:4o,alini:4o,idati:4o,ndori:4e,nguri:4o,nneti:4o,ibali:4e,hiali:4e,oisti:4a,panni:4o,itali:4e,mboli:4o,omici:4o,danni:4o,saldi:4o,pperi:4o,potti:4o,rioli:4o,proni:4e,drati:4o,rceri:4e,rtoni:4e,scami:4e,rmoni:4e,grati:4o,casti:4o,arani:4o,tasti:4o,eteri:4e,ateti:4o,atini:4o,rizzi:4o,viali:4e,villi:4o,avoli:4o,cazzi:4o,zotti:4o,ibati:4o,elibi:4e,mbali:4o,pisti:4a,iatti:4o,hioni:4e,niali:4e,rtami:4e,cervi:4o,sarei:4o,spiti:4e,cesti:4o,tnici:4o,ubini:4o,scuri:4o,iassi:4o,erici:4o,ostri:4o,ilati:4o,cieli:4o,indri:4o,easti:4a,uroni:4e,cuiti:4o,slini:4o,ofoni:4o,adini:4o,ngori:4e,icali:4e,climi:4a,oatti:4o,odini:4o,utati:4o,ilini:4o,eroli:4o,ageni:4e,lombi:4o,evoli:4e,danti:4e,commi:4a,miati:4o,mpari:4e,passi:4o,patti:4o,pensi:4o,mpiti:4o,eanni:4o,pleti:4o,etini:4o,plici:4e,ositi:4o,mputi:4o,certi:4o,rtini:4o,aboli:4o,ncimi:4e,clavi:4e,rdati:4o,nfini:4e,iunti:4o,ntivi:4o,otati:4o,sessi:4o,nsoli:4e,sulti:4o,abili:4e,tatti:4o,torti:4o,bassi:4o,aenti:4e,buiti:4o,esodi:4o,oteri:4e,nviti:4o,vitti:4o,perti:4o,ralli:4o,orani:4o,corni:4o,edini:4o,idori:4e,rtili:4e,iotti:4o,ritti:4o,etici:4o,umini:4o,otoni:4e,cozzi:4o,rampi:4o,xismi:4o,uloni:4e,etesi:4e,imini:4e,itici:4o,gioli:4o,umiri:4o,bismi:4o,ugini:4o,culti:4o,urari:4o,rsori:4e,scini:4o,stodi:4e,aisti:4a,eboli:4e,butti:4o,eduti:4o,ecimi:4o,isori:4e,clini:4o,ecori:4o,epiti:4o,creti:4o,gradi:4o,lfini:4o,eriti:4o,spoti:4a,ttami:4e,ttati:4o,titti:4o,venni:4e,ziali:4e,utivi:4o,omati:4o,gismi:4o,sarmi:4o,epoli:4o,oboli:4o,afici:4o,banti:4e,edati:4o,ziati:4o,ganni:4o,upati:4o,nesti:4o,aceri:4e,apori:4e,sesti:4o,tinti:4o,rbati:4o,turbi:4o,rambi:4o,ivani:4o,rtiti:4o,dendi:4o,vieti:4o,ivini:4o,vanni:5,opati:4o,mmoni:4e,rappi:4o,ruidi:4o,uelli:4o,uetti:4o,trici:4o,gisti:4a,lasmi:4a,riali:4e,ditti:4o,oismi:4o,fanti:4e,trodi:4o,cnici:4o,metti:4o,eviri:4o,emiri:4o,sferi:4o,otivi:4o,iasti:4a,igoni:4o,iteti:4o,ivoci:4o,eredi:4e,oditi:4o,esami:4e,austi:4o,plari:4e,rciti:4o,esiti:4o,steti:4a,nuchi:3o,asori:4e,ldoni:4e,falli:4o,tasmi:4a,orici:4o,risei:4o,fasti:4o,condi:4o,elini:4o,emori:4e,retri:4o,fermi:4o,omoni:4e,rvori:4e,fiati:4o,atoni:4e,bromi:4a,fieni:4o,lioli:4o,lmati:4o,lmoni:4e,iltri:4o,mondi:4o,nnici:4o,finti:4o,iordi:4o,gelli:4o,lauti:4o,luidi:4o,luori:4o,lutti:4o,liami:4e,klori:4e,folli:4e,stali:4e,unati:4o,rzati:4o,zisti:4a,ssili:4e,manzi:4o,cassi:4o,agori:4e,scani:4o,ncesi:4e,rtesi:4e,tuoni:4o,frati:4e,freni:4o,ivoli:4o,tteti:4o,ucili:4e,lgori:4e,furbi:4o,bondi:4o,furti:4o,fusti:4o,uturi:4o,bioni:4e,ioffi:4o,eotti:4o,galli:4o,loppi:4o,gambi:4o,garbi:4o,gatti:4o,darmi:4e,enomi:4a,germi:4e,gessi:4o,gesti:4o,suiti:4a,aioni:4e,higni:4o,bizzi:4o,obini:4o,guari:4o,siali:4e,nasti:4a,tondi:4o,bbini:4o,ubili:4o,udici:4e,iusti:4o,dioli:4o,ucomi:4a,goffi:4o,lfoni:4e,omiti:4o,rnati:4o,gozzi:4o,acili:4e,dassi:4o,adoni:4e,ffiti:4o,grani:4o,aniti:4o,ppoli:4o,rassi:4o,ulini:4o,greti:4o,ifoni:4e,roppi:4o,gniti:4o,uappi:4o,sconi:4e,uasti:4o,uitti:4o,uizzi:4o,ppati:4o,lasti:4a,gnari:4o,gnoti:4o,eciti:4o,aderi:4o,berbi:4e,agini:4e,mmani:4e,lizzi:4o,rtali:4e,mperi:4o,iciti:4o,uniti:4o,cauti:4o,iampi:4o,piuti:4o,ncubi:4o,nizzi:4o,ndici:4e,farti:4o,iditi:4o,nferi:4o,initi:4o,gordi:4o,uieti:4o,signi:4e,ntimi:4o,onaci:4o,toppi:4o,lazzi:4o,tuiti:4o,alidi:4o,viati:4o,ltini:4o,otami:4o,slavi:4o,ovari:4o,rinti:4o,ladri:4o,lampi:4o,guori:4e,arici:4e,eandi:4o,ccesi:4e,egami:4e,etami:4e,berti:4o,eviti:4o,imiti:4e,quidi:4o,quori:4e,irici:4o,liuti:4o,gioni:4e,ucani:4o,ucidi:4o,gubri:4e,garni:4o,ustri:4o,edoni:4e,igali:4e,rdomi:4o,renni:4e,ebini:4o,giari:4o,aiali:4e,lanni:4o,ligni:4o,ltesi:4e,tolti:4o,vezzi:4o,mambi:4o,festi:4o,ipoli:4o,nuali:4e,rasmi:4a,oneti:4a,ariti:4o,marmi:4o,donti:4e,matti:4o,hermi:4o,mazzi:4o,andri:4o,edici:4o,eloni:4e,catti:4o,ntili:4e,rcuri:5o,etodi:4o,zadri:4o,prani:4o,opici:4o,dolli:4o,mieli:4e,iliti:4e,areti:4o,inimi:4o,istri:4o,tilli:4o,iseri:4o,molli:4e,diali:4e,cromi:4o,nsoni:4e,billi:4o,oviti:4a,mosti:4o,motti:4o,mozzi:4o,muchi:3o,floni:4e,muoni:4e,lmani:4o,atali:4e,zismi:4o,ofiti:4a,ndaci:4o,sposi:4o,nervi:4o,iatri:4a,oleti:4o,omadi:4e,rdici:4o,manni:4o,trani:4o,nuoti:4o,obesi:4o,panti:4e,mpici:4o,olivi:4o,suali:4e,digni:4o,gasmi:4o,zonti:4e,ogini:4o,rendi:4o,tobri:4e,dermi:4a,padri:4e,esoni:4e,mbari:4o,lpiti:4o,udati:4o,orami:4a,apati:4o,adisi:4o,rmali:4e,ssiti:4a,aurti:5,areri:4e,mensi:4e,rroci:4o,cceri:4e,ccari:4o,iboli:4o,atiti:4o,rigni:4o,pazzi:4o,ulati:4o,ntiti:4o,ltimi:4o,pesci:4e,zenti:4e,pezzi:4o,aneti:4a,anori:4o,rreni:4o,pieni:4o,fferi:4o,giami:4a,pioli:4o,iombi:4o,umoni:4e,iroli:4o,llami:4e,polli:4o,polpi:4o,pieri:4e,ponti:4e,porci:4o,porri:4o,atili:4e,pozzi:4o,prati:4o,primi:4o,eniti:4o,ipati:4o,ncipi:4e,ivati:4o,oroni:4e,ofeti:4a,grami:4a,ttili:4e,lsori:4e,iutti:4o,uriti:4o,blici:4o,udori:4e,lcini:4o,uliti:4o,upari:4o,pilli:4o,putti:4o,uadri:4o,mviri:4o,uarti:4o,ntali:4e,uinti:4o,efoni:4o,ddori:4e,mendi:4o,psodi:4o,violi:4o,apiti:4o,cinti:4o,proci:4o,dditi:4o,ivivi:4o,tauri:4o,iarmi:4o,ltoni:4e,icami:4o,avati:4o,hiami:4o,clati:4o,helli:4o,bombi:4o,palli:4o,iazzi:4o,iposi:4o,serbi:4o,ltati:4o,itiri:4o,trovi:4o,ntici:4o,rombi:4o,osoni:4e,uderi:4e,rdoti:4e,afari:5,salmi:4o,murai:5,angui:4e,uigni:4o,casmi:4o,sarti:4o,sassi:4o,nassi:4o,atiri:4o,ffali:4e,scali:4o,lpori:4e,mpoli:4o,inavi:4o,canni:4o,apoli:4o,letri:4o,iaffi:4o,hizzi:4o,quoni:4e,ciami:4e,mioni:4e,uassi:4o,ranni:4o,upoli:4o,ederi:4e,guiti:4o,rrati:4o,senni:4o,polti:4o,penti:4e,nteri:4e,garri:4o,nazzi:4o,igari:4o,nceri:4o,iozzi:4o,gulti:4o,ntomi:4o,rriti:4o,odali:4e,ldati:4o,ldini:4o,lerti:4e,omali:4o,omari:4o,nnomi:4e,rrisi:4o,vrani:4o,spari:4o,pasmi:4o,permi:4a,rperi:4o,etati:4o,ngoni:4e,iriti:4o,quali:4o,llidi:4o,brati:4o,uilli:4o,mpati:4o,steli:4o,tessi:4o,tormi:4o,egoni:4e,upori:4e,blimi:4e,ccubi:4e,nniti:4a,oceri:4o,suoni:4o,perbi:4o,iandi:4o,smani:4o,tappi:4o,rtari:4o,tassi:4o,xisti:4a,pismi:4o,enaci:4e,enori:4e,oremi:4a,epori:4e,esori:4o,tetri:4o,imbri:4o,tonfi:4o,tonni:4o,tonti:4o,tordi:4o,oreri:4o,otali:4e,tozzi:4o,aditi:4o,gitti:4o,nsiti:4o,apani:4o,uenni:4e,spoli:4o,nfali:4e,ionfi:4o,mbati:4o,kisti:4a,ffati:4o,ipani:4o,rgori:4e,ulivi:4o,umbri:4o,unici:4o,nsili:4e,utili:4e,salli:4o,eleni:4o,lluti:4o,eneti:4o,tisei:5,eenni:4e,nenni:4e,rbali:4e,vermi:4e,amiti:4a,gneti:4o,sceri:4e,rbesi:4e,tigni:4o,iveri:4o,lcani:4o,vuoti:4o,ngari:4o,tezzi:4a,denzi:4a,vandi:4a,sfidi:4a,sioni:4e,renzi:4a,tendi:4a,natri:4a,ienzi:4a,genzi:4a,provi:4a,uenzi:4a,rnaci:4e,tarri:4a,iesti:4a,tturi:4a,canzi:4a,aturi:4a,mappi:4a,carni:4e,mammi:4a,madri:4e,aceti:4o, mari:4e,ietri:4a,tradi:4a,tanzi:4a,venzi:4a,crimi:4a,torri:4e,rduri:4a,ialdi:4a,tenzi:4a,nturi:4a,eanzi:4a,ddomi:4e,iendi:4a,sanzi:4a,tazzi:4a,lturi:4a,dieti:4a,raldi:4o,nanzi:4a,rnici:4e,pauri:4a,otesi:5,umani:4o,ingui:4a,hezzi:4a,cenzi:4a, viti:4a,inori:4e,nioni:4e,eduri:4a,atati:4a,ipali:4e,gammi:4a,cluti:4a,quoti:4a,liali:4e,vatti:4a,plati:4e,rusti:4a,ruoti:4a,amenti:5o,imenti:5o,bbozzi:5o,itanti:5e,tatori:5e,rigeni:5o,ccenni:5o,coliti:5o,cconti:5o,ccordi:5o,satori:5e,edotti:5o,scenti:5e,oporti:5o,affari:5e,aristi:5a,ffetti:5o,ffitti:5o,ffondi:5o,reschi:4o,agenti:5e,ellini:5o,ostici:5o,oltori:5e,urismi:5o,agrumi:5e,utanti:5e,bicchi:4o,ghetti:5o,imisti:5a,olisti:5a,lfieri:5e,lianti:5e,ienati:5o,titori:5e,cinati:5o,terchi:4o,alteri:5o,imetri:5o,zatori:5e,amanti:5e,iatori:5e,alisti:5a,malati:5o,micchi:4o,tinati:5o,orazzi:5o,oretti:5o,plessi:5o,catori:5e,tologi:5o,anditi:5o,neliti:5o,oletti:5o,iporti:5o,icismi:5o,glisti:5a,aletti:5o,tenati:5o,patori:5e,rmisti:5a,tigeni:5e,semiti:5a,pologi:5o,strofi:5o,lativi:5o,ppelli:5o,pporti:5o,istati:5o,pprodi:5o,ppunti:5o,beschi:4o,itrati:5o,eologi:5o,ivisti:5a,arditi:5o,omenti:5o,armati:5o,datori:5e,rresti:5o,etrati:5o,tefici:5e,rtieri:5e,sianti:5e,litori:5e,dianti:5e,ssensi:5o,curati:5o,alismi:5o,istiti:5o,stanti:5e,ccanti:5e,attimi:5o,attori:5e,trezzi:5o,umenti:5o,usteri:5o,ilismi:5o,ilisti:5a,tonomi:5o,omisti:5a,avanzi:5o,vventi:5o,entori:5e,urieri:5o,acilli:5o,enieri:5e,lletti:5o,olotti:5o,llieri:5e,centri:5o,baschi:4o,lischi:4o,eristi:5a,becchi:4o,baveri:5o,lcanti:5o,esseri:5e,nsanti:5e,rretti:5o,vitori:5e,coneri:5o,blisti:5a,egneri:5e,iologi:5o,ossidi:5o,zzieri:5e,ottini:5o,vacchi:4o,aporti:5o,boleri:5o,bolidi:5e,olliti:5o,ollori:5e,rdieri:5e,gatari:5o,orsari:5o,boschi:4o,cciali:5e,cianti:5e,isismi:5o,ricchi:4o,toloni:5e,budini:5o,ulgari:5o,attini:5o,utteri:5o,binati:5o,inieri:5e,daveri:5e,cafoni:5e,aimani:5o,alessi:5e,alibri:5o,calici:5e,lmanti:5e,calori:5e,riferi:5o,erotti:5o,erieri:5e,camici:5e,mmelli:5o,rristi:5a,osanti:5o,elotti:5o,nestri:5o,anotti:5o,antori:5e,pitoni:5e,lavori:5o,ralati:5o,pretti:5o,bonari:5o,cinomi:5a,uristi:5a,rnieri:5e,nivori:5o,erismi:5o,omanti:5e,caschi:4o,ssieri:5e,strati:5o,trismi:5o,stroni:5e,atrami:5e,udilli:5o,allini:5o,lulari:5e,tristi:5a,entoni:5e,avanti:6,amisti:5a,rapici:5o,hicchi:4o,ioschi:4o,ltroni:5e,clisti:5a,cileni:5o,miteri:5o,nemini:5o,cinici:5o,ociari:5o,rcensi:5e,elismi:5o,nomani:5e,codici:5e,icilli:5o,icenti:5e,ognati:5o,ognomi:5e,bacchi:4o,otteri:5o,llassi:5o,onnati:5o,oristi:5a,loriti:5o,mmenti:5o,litoni:5e,mparti:5o,acenti:5e,plotti:5o,sitori:5e,ertati:5o,istori:5o,ussori:5e,annati:5o,ondoni:5o,ucenti:5e,nfetti:5o,finati:5o,nfonti:5o,nforti:5o,iurati:5o,gressi:5o,citori:5e,nitori:5e,ntenti:5o,ntesti:5o,igenti:5e,ngenti:5e,uatori:5e,ntorni:5o,ndieri:5e,ccolpi:5o,ittori:5e,fforti:5e,trasti:5o,ttempi:5o,ocanti:5o,opiedi:5e,osensi:5o,nventi:5o,iventi:5e,perchi:6o,ordoni:5e,picini:5o,rimani:5o,rrotti:5o,iletti:5o,tisoni:5e,sacchi:4o,mologi:5o,umisti:5a,rateri:5e,eativi:5o,eatori:5e,nologi:5o,crismi:5a,cristi:5o,rucchi:4o,uletti:5o,ricini:5o,poloni:5e,danari:5o,ttanti:5e,decani:5o,ecolli:5o,dedali:5o,eformi:5e,egenti:5e,denari:5o,eposti:5o,deschi:4o,destri:5o,trieri:5o,frammi:5a,ametri:5o,asteri:5o,cembri:5e,ttenni:5e,ifetti:5o,fusori:5e,estivi:5o,ipinti:5o,sguidi:5o,ncanti:5o,neschi:4o,nvolti:5o,ivelli:5o,prezzi:5o,uestri:5o,illati:5o,tretti:5o,batori:5e,ocenti:5e,icenni:5e,icanti:5e,estici:5o,ottori:5e,doveri:5e,drammi:5a,llenti:5e,cologi:5o,eletti:5o,odotti:5o,ttroni:5e,ginati:5o,matomi:5a,mirati:5o,siasmi:5o,brismi:5o,bristi:5a,bivori:5o,ruditi:5o,rcenti:5e,soneri:5o,rcismi:5o,esteri:5o,estimi:5o,intori:5e,ortori:5e,emisti:5a,ruschi:4o,estiti:5o,gelici:5o,elisti:5a,restri:5e,melici:5o,turati:5o,favori:5e,voriti:5o,rmenti:5o,fetori:5e,miferi:5o,iaschi:4o,telici:5o,ilmini:5o,lologi:5o,iocchi:4o,laconi:5e,foderi:5o,lclori:5e,ondali:5e,ormati:5o,ovisti:5a,rzieri:5e,foschi:4o,olieri:5e,ontoni:5e,uitori:5e,ullati:5o,ullini:5o,ilieri:5e,olismi:5o,usciti:5o,uretti:5o,gianti:5e,eretti:5o,sdotti:5o,somini:5o,gemiti:5o,estori:5e,gialli:5o,llisti:5a,llotti:5o,ngilli:5o,iovani:5e,inotti:5o,rasoli:5e,iretti:5o,izieri:5e,licini:5e,lfetti:5o,llismi:5o,mmisti:5a,atieri:5e,grandi:5e,gretti:5o,grezzi:5o,guanti:5o,ardoni:5e,ecilli:5e,itenti:5e,rfetti:5o,mporti:5o,ostori:5e,alliti:5o,ncensi:5o,surati:5o,etenti:5e,minati:5o,digeni:5o,ignati:5o,dovini:5o,alotti:5o,felici:5e,ltrati:5o,gombri:5o,uisiti:5o,nsonni:5e,grismi:5o,eressi:5e,rporti:5o,rpreti:5e,gativi:5o,acheni:5o,golari:5e,aeliti:5a,talici:5o,cunari:5e,nguidi:5o,necchi:4o,sativi:5o,ssismi:5o,atrati:5o,andini:5o,vativi:5o,avetri:6,legali:5e,vrieri:5o,bretti:5o,icheni:5e,liguri:5e,itrofi:5o,limoni:5e,fociti:5o,guisti:5a,irismi:5o,livori:5e,loschi:4o,micini:5o,unotti:5o,terani:5o,rileni:5o,aestri:5o,agnati:5e,intesi:5o,malori:5e,ltempi:5o,rinati:5o,apreti:6,tovani:5o,urandi:5o,cenati:5e,gafoni:5o,lomani:5e,lanomi:5a,membri:5o,nischi:4o,ogneri:5o,rcanti:5e,rletti:5o,boliti:5a,allari:5o,etalli:5o,eoriti:5e,politi:5a,miasmi:5a,ertici:5e,istici:5o,luschi:4o,gaschi:4o,tanari:5o,arozzi:5o,ulatti:5o,gitori:5e,atanti:5e,zianti:5e,grieri:5o,osismi:5o,utroni:5e,ovelli:5o,vembri:5e,uraghi:5e,voloni:5e,otenti:5e,pposti:5o,orditi:5o,refici:5e,rpelli:5o,pedali:5e,sicini:5o,sigeni:5o,simori:5o,acismi:5o,ottimi:5o,vociti:5a,cifici:5o,ifismi:5o,dovani:5o,palati:5o,zinari:5o,cenici:5o,iativi:5o,ninari:5o,noloni:5e,paveri:5o,paperi:5o,aocchi:6,astati:5o,aventi:5o,roloni:5e,titoni:5e,ssanti:5e,atempi:5o,atroni:5o,erasti:5a,dolari:5e,nsieri:5o,iodici:5o,cecani:5e,petali:5o,oforti:5e,picari:5o,duisti:5a,ontesi:5e,etroni:5e,gmenti:5o,toleri:5o,isciti:5o,poderi:5e,dologi:5o,lacchi:4o,linici:5o,tileni:5e,pileni:5e,ieschi:4o,ollici:5e,omelli:5o,modori:5o,omposi:5o,ulismi:5o,ceneri:5e,osteri:5o,poveri:5o,pranzi:5o,efetti:5o,egiati:5o,tanomi:5e,etesti:5o,ioneri:5o,prismi:5a,lemini:5o,oclami:5a,ofitti:5o,tinici:5o,ocolli:5o,nciali:5e,rovini:5o,llmini:5o,lsanti:5e,uttini:5o,dretti:5o,lateri:5o,tuanti:5e,pinati:5o,pitori:5e,eclami:5o,cuperi:5o,eferti:5o,regali:5o,ggenti:5e,iconti:5o,oconti:5o,ilinei:5o,ioloni:5e,icordi:5o,coveri:5o,idotti:5o,ientri:5o,flessi:5o,ugiati:5o,imandi:5o,brotti:5o,roveri:5o,incari:5o,nforzi:5o,eronti:5e,ripari:5o,iacqui:5o,rvisti:5a,isorti:5o,storni:5o,itorni:5o,ossori:5e,zoloni:5e,sadici:5o,salami:5e,alassi:5o,salici:5e,scendi:6,saluti:5o,ulotti:5o,andali:5o,scriti:5o,saperi:5e,elliti:5e,sbirri:5o,cacchi:4o,lpelli:5o,caltri:5o,scarti:5o,eicchi:4o,eriffi:5o,hemini:5o,hianti:5o,avisti:5a,renici:5o,gurati:5o,sciali:5o,ioperi:5o,scolli:5o,udieri:5o,ondini:5o,dativi:5o,mestri:5e,mitoni:5o,uologi:5o,tembri:5e,ollati:5o,sfondi:5o,sforzi:5o,abelli:5o,sibili:5o,orotti:5o,otroni:5e,ittini:5o,macchi:4o,offici:5e,solidi:5o,soliti:5o,soloni:5e,lventi:5e,gibili:5e,niferi:5o,risoni:5e,iciali:5e,imanti:5e,asseri:6,intoni:5e,prazzi:5o,umanti:5e,spunti:5o,untoni:5e,drismi:5o,dristi:5a,tucchi:4o,rstiti:5e,rtesti:5e,timoni:5e,plenti:5e,talami:5o,sinari:5o,eporti:5o,utenti:5e,endoni:5e,teneri:5o,rrazzi:5o,orieri:5e,grotti:5o,timori:5e,icolli:5o,aconti:5o,comani:5e,toneri:5o,acolli:5o,affici:5o,amonti:5o,sporti:5o,ppiedi:5e,fatori:5e,virati:5o,trotti:5o,bicini:5o,umulti:5o,guenti:5o,nisoni:5o,untori:5e,assori:5e,getali:5e,eienni:5e,ventri:5e,rsanti:5e,liferi:5o,adotti:5o,vicini:5o,vigori:5e,illici:5o,illini:5o,ncenti:5e,visoni:5e,voleri:5e,olgari:5e,otanti:5e,mbelli:5o,oologi:5o,arotti:5a,llezzi:5a,classi:5e,rrozzi:5a,uzioni:5e,durati:5a,izioni:5e,flotti:5a,oresti:5a,esciti:5a,ezioni:5e,otechi:4a,erditi:5a,oranzi:5a,cletti:5a, altri:6,aformi:5a,ivolti:5a,urezzi:5a,salati:5a,enditi:5a,tecchi:4a,mpesti:5a,nzioni:5e, aerei:5a,fferti:5a,iamati:5a,valuti:5a,licchi:4a,sciari:5e,rciali:5e,nimati:5o,isputi:5a,osauri:5o,ozioni:5e,figuri:5a,pronti:5a,ariffi:5a, guidi:5a,eranzi:5a,tudini:5e,llatti:5e,pzioni:5e,oposti:5a,rzioni:5e,evanzi:5a,radici:5e,iservi:5a,tranzi:5a,eciali:5e,ociali:5e,visiti:5a,bandoni:6o,eratori:6e,cendini:6o,ciacchi:5o,llatori:6e,gnatori:6e,cquisti:6o,crobati:6a,tellati:6o,tratori:6e,duttori:6e,ffronti:6o,forismi:6a,ressori:6e,gronomi:6o,rghieri:6o,enatori:6e,evatori:6e,bratori:6e,igatori:6e,llocchi:5o,anacchi:5o,amatori:6e,iratori:6e,montari:6e,agrammi:6a,drologi:6o,imatori:6e,nticipi:6o,orifici:6o,ascismi:6o,pestati:6o,rchetti:6o,argenti:6o,rmatori:6e,restati:6o,ruspici:6e,censori:6e,sertori:6e,sessori:6e,uratori:6e,istenti:6e,erischi:5o,trologi:6o,tronomi:6o,ttacchi:5o,ivatori:6e,tracchi:5o,icolari:6e,tocrati:6e,tarismi:6o,amposti:6o,nchetti:6o,nchieri:6e,nditori:6e,barismi:6o,baretti:6o,aritoni:6o,rometri:6o,dettini:6o,amaschi:5o,rettini:6o,aglieri:6e,iettini:6o,iardini:6o,larismi:6o,cchetti:6o,blocchi:5o,lettini:6o,bollini:6o,schetti:6o,varismi:6o,bracchi:5o,accioli:6o,conieri:6e,gadieri:6e,brocchi:5o,canieri:6e,acicchi:5o,olatori:6e,inatori:6e,mpanari:6o,onatori:6e,delieri:6e,nonieri:6e,antanti:6e,antieri:6e,zonieri:6e,ratteri:6e,cardini:6e,carismi:6a,rnefici:6e,castori:6o,aclismi:6a,rofismi:6o,avatori:6e,cementi:6o,monieri:6e,esenati:6e,iclismi:6o,ipressi:6o,listeri:6e,lettori:6e,comandi:6o,omaschi:5o,ittenti:6e,mpianti:6o,ilatori:6e,lementi:6o,omposti:6o,pratori:6e,rettori:6e,ndomini:6o,enzieri:6e,fessori:6e,nfronti:6o,elatori:6e,torismi:6o,onsorti:6e,sulenti:6e,umatori:6e,itolari:6e,rordini:6e,ovalori:6e,orrieri:6e,ruttori:6e,costumi:6e,vattari:6o,editori:6e,nometri:6o,uccioli:6o,culmini:6e,cultori:6e,datteri:6o,ebitori:6e,rementi:6o,dementi:6e,gratori:6e,epressi:6o,ergenti:6e,diaconi:6o,fensori:6e,isonori:6e,sordini:6e,cratori:6e,alatori:6e,sennati:6o,svalori:6e,lgatori:6e,ganieri:6e,dolenti:6e,dollari:6o,omatori:6e,oghieri:6e,iastici:6o,lastici:6o,gantoni:6e,tocriti:6o,igrammi:6a,valenti:6e,eremiti:6a,otomani:6e,spianti:6o,esposti:6o,spressi:6o,tensori:6e,rnatori:6e,igliari:6e,miliari:6e,faretti:6o,eritori:6e,fiacchi:5o,danzati:6o,lessori:6e,ocolari:6e,fremiti:6o,talieri:6e,fulmini:6e,mettari:6o,urologi:6o,erologi:6o,eometri:6a,glifici:6o,irigori:6o,ochetti:6o,nalieri:6o,adischi:7,gnocchi:5o,tteschi:5o,pettari:6o,uantoni:6e,aritori:6e,errieri:6o,barazzi:6o,inifici:6o,mpacchi:5o,erativi:6o,revisti:6o,nauditi:6o,agatori:6e,mazioni:6e,ibitori:6e,ovatori:6e,insorti:6o,pellati:6o,teventi:6o,pocriti:6a,pettori:6e,iarazzi:7,lasciti:6o,tifondi:6o,tticini:6o,zaretti:6o,slatori:6e,libelli:6o,oggiati:6o,uminari:6e,upanari:6e,nghieri:6o,ascarpe:7,gisteri:6o,agliari:6o,gnifici:6o,caretti:6o,manieri:6o,vratori:6e,naretti:6o,rittimi:6o,nadieri:6o,mastici:6e,ievisti:6a,ilitari:6e,nisteri:6o,misteri:6o,itomani:6e,taretti:6o,ettieri:6e,moventi:6e,tandoni:6e,rratori:6e,egatori:6e,inativi:6o,iettori:6e,culisti:6a,gettini:6o,ppressi:6o,pulenti:6o,dalieri:6o,ttomani:6o,hettini:6o,lchetti:6o,pallori:6e,panieri:6e,parazzi:6o,arigini:6o,rlatori:6e,artenti:6e,settini:6o,pastori:6e,cettori:6e,perdoni:6o,sticidi:6a,golezzi:6o,pettini:6e,zettini:6o,iantoni:6e,iccioli:6o,estalli:6o,iromani:6e,pollini:6e,ontieri:6e,achiavi:7,apacchi:7,avalori:7,ortenti:6o,portici:6o,sticini:6o,sticipi:6o,postumi:6o,dessori:6e,iminari:6e,arativi:6o,aratori:6e,ipianti:6e,olifici:6o,ettenti:6e,pronomi:6e,osecchi:5o,tettori:6e,roventi:6o,pulmini:6o,nticini:6o,nquisti:6a,itativi:6o,iometri:6o,entanti:6e,vennati:6e,tometri:6o,nscismi:6o,ribelli:6e,vometri:6o,cometri:6o,ceventi:6e,clatori:6e,cordini:6o,attieri:6e,gorismi:6o,ntocchi:5o,iordini:6o,isvolti:6o,itocchi:5o,ivecchi:7,hettari:6o,kettari:6o,oditori:6e,lvatori:6e,santoni:6e,llitari:6e,sauditi:6a,sbocchi:5o,schiavi:6o,irocchi:5o,laretti:6o,scolari:6o,pritori:6e,corpori:6o,sensori:6e,tennati:6o,settori:6e,stemini:6o,sofismi:6a,darismi:6o,spirati:6o,ogeneri:6e,spacchi:5o,pessori:6e,acoloni:6e,ioventi:6e,uallori:6e,ranieri:6o,ococchi:5o,rmarchi:5o,talenti:6o,gentari:6o,arocchi:5o,nocrati:6e,egrammi:6a,tendini:6e,ntativi:6o,mometri:6o,rorismi:6o,rapiedi:7,torpori:6e,aditori:6e,apianti:6o,tremiti:6o,tritoni:6e,arobati:6o,ubolari:6e,bolenti:6o,riaconi:6e,morismi:6o,velieri:6o,verdoni:6e,vettori:6e,odischi:5o,liacchi:5o,irologi:6o,isconti:6e,vortici:6e,volezzi:6a,nasciti:6a,garetti:6a,nazioni:6e,bbrichi:5a,razioni:6e,giacchi:5a,zazioni:6e,lazioni:6e,iazioni:6e,isposti:6a,pazioni:6e,bolezzi:6a,vanzati:6a,cazioni:6e,sazioni:6e,domandi:6a,gazioni:6e,ttativi:6a,dazioni:6e,fazioni:6e,vazioni:6e,bussari:6e,rrativi:6a,origini:6e,otolari:6e,riformi:6a,uazioni:6e,imposti:6a,nellati:6a,niformi:6e,vittimi:6a,mulatori:7e,doratori:7e,dulatori:7e,ergatori:7e,imentari:8,michetti:7o,tiglieri:7e,ttestati:7o,balocchi:6o,rottieri:7e,battenti:7e,icchieri:7e,boccioli:7o,bonifici:7o,uonsensi:7o,nottieri:7e,pentieri:7e,avalieri:7e,mentieri:7e,richetti:7o,centrati:7o,dottieri:7o,consensi:7o,siglieri:7e,ntestati:7o,nversari:7e,neggiati:7o,ebitucci:8,coratori:7e,eportati:7o,voratori:7e,iogrammi:7a,loratori:7e,ivalieri:7o,nanzieri:7e,nogrammi:7a,restieri:7o,togrammi:7a,asigilli:8,riglieri:7o,eogrammi:7a,terventi:7o,escialli:7o,mestieri:7e,eorologi:7o,ocessori:7e,leggiati:7o,nsignori:7e,acarichi:8,tturbini:7o,noccioli:7o,vantenni:7e,oroscopi:7o,nchinari:7o,ucchieri:7e,distalli:7o,pionieri:7e,opulisti:7a,abagagli:8,ecessori:7e,fanatori:7e,rogrammi:7a,epulisti:8,nfermati:7o,toratori:7e,manzieri:7e,saccenti:7e,acchieri:7e,ermitori:7e,micerchi:8o,sentieri:7o,seracchi:6o,serventi:7e,santenni:7e,sestieri:7e,orritori:7e,culatori:7e,zionieri:7e,rentenni:7e,canzieri:7o,epretori:7e,vogatori:7e,ttazioni:7e,rtazioni:7e,tichetti:7a,itazioni:7e,stazioni:8,abulatori:8e,nalfabeti:8a,burocrati:8e,aseggiati:8o,cocchieri:8e,sordinati:8o,distacchi:7o,erogatori:8e,eurocrati:8o,lamentari:8e,vernativi:8o,ilogrammi:8o,nocchieri:8o,ologrammi:8a,igionieri:8o,rammatori:8e,agionieri:8e,isanatori:8e,acondotti:8o,acervelli:9,bordinati:8o,uccessori:8e,oordinati:8a,iscarichi:7a,sseggiati:8a,acristalli:10,nservatori:9e,icristalli:9o,llaboratori:10e,achilometri:11,elaboratori:10e,"
    },
    "adjectives": {
      "fs": "o:a,ore:rice,smo:3,mpo:3,iore:4,rolo:4,rteo:4,lore:4,gelo:4,olio:4,sore:4,dore:4,more:4,nore:4,stio:3e,ango:4,borto:5,furto:5,ostro:5,endio:5,opero:5,iuomo:5,ddito:5,rsono:5,remio:5,raldo:5,lusso:5,naggio:6,icarro:6,emento:6,amento:6,taggio:6,scasso:6,dacato:6,ivento:6,maggio:6,acchio:6,ualcun:6',ngresso:7,anesimo:7,idebito:7,rimotore:8,tinfortunistico:15,==meglio:6,peggio:6,radio:5,sotto:5,turbo:5==ya:2,gma:3,rla:3,beta:4,ssia:4,onna:4,roga:4,afia:4,orma:4,anga:4,rota:4,iota:4,xtra:4,vita:4,iuma:4,iita:4,opra:4,erra:4,uista:5,nista:5,razia:5,cista:5,oista:5,xista:5,rista:5,lista:5,ebbia:5,zista:5,sista:5,emita:5,ccita:5,hezza:5,lcera:5,amita:5,ipera:5,eista:5,icida:5,tista:5,hista:5,dista:5,bista:5,gista:5,trada:5,suita:5,pista:5,lasta:5,crita:5,oneta:5,marca:5,fista:5,ssita:5,abbia:5,nnita:5,eppia:5,kista:5,rmista:6,umista:6,riglia:6,calata:6,idatta:6,omista:6,polita:6,almata:6,imista:6,abella:6,amista:6,ronita:6,imedia:6,voglia:6,tivista:7,sivista:7,gitrice:7,fortuna:7,eregolatrice:12,",
      "mp": "o:i,e:i,a:i,ia:2,he:2,ma:2,na:2,ga:2,za:2,la:2,ya:2,ca:2,va:2,sa:2,ee:2,cio:2,nco:2hi,ogo:2hi,sco:2hi,bio:2,smo:3,era:3,ago:2hi,aio:2,cco:2hi,lue:3,uio:2,zio:2,ugo:2hi,vio:2,sio:2,ada:3,fio:2,use:3,nio:2,mpo:3,rgo:2hi,oio:2,dre:3,cra:3,rco:2hi,igo:2hi,que:3,ego:2hi,ape:3,pra:3,rra:3,lgo:2hi,ario:3,mpio:3,rolo:4,rteo:4,gelo:4,olio:4,lata:4,cita:4,osta:4,igio:3,omio:3,ugio:3,ingo:3hi,erio:3,ppio:3,egio:3,imio:3,ioco:3hi,prio:3,edio:3,ungo:3hi,agio:3,ogio:3,trio:3,rata:4,poco:3hi,brio:3,atio:3,urio:3,ntio:3,rpio:3,rime:4,idio:3,ango:4,fare:4,ltra:4,sorio:4,borto:5,clone:5,zione:5,sione:5,furto:5,ostro:5,endio:5,ggine:5,opero:5,iuomo:5,tione:5,temio:4,bieco:4hi,indio:4,schio:4,ddito:5,nline:5,rsono:5,ladio:4,remio:5,avita:5,raldo:5,rchio:4,oglio:4,lusso:5,iglio:4,naggio:6,icarro:6,emento:6,amento:6,taggio:6,scasso:6,dacato:6,ivento:6,utorio:5,ttorio:5,etorio:5,reggio:5,itorio:5,otorio:5,maggio:6,ecchio:5,ntorio:5,acchio:6,saggio:5,ltorio:5,vaggio:5,veglio:5,satorio:6,latorio:6,eatorio:6,natorio:6,matorio:6,ngresso:7,anesimo:7,idebito:7,idolore:7,iettile:7,tatorio:6,catorio:6,zatorio:6,iatorio:6,gatorio:6,datorio:6,batorio:6,ubriaco:6hi,ipatorio:7,imissile:8,cratorio:7,iratorio:7,gratorio:7,uratorio:7,eratorio:7,oratorio:7,vantenne:8,aratorio:7,santenne:8,rimotore:8,inucleare:9,ettantenne:10,iconsumista:11,tinfortunistico:15,==antico:5hi,bieco:4hi,carico:5hi,indio:4,live:4,meglio:6,oratorio:7,peggio:6,poco:3hi,radio:5,saggio:5,sangue:6,sotto:5,turbo:5,ubriaco:6hi==ki:2,xi:2,uti:2o,osi:2o,usi:2o,rsi:2o,uli:2o,uei:2o,pti:2o,rni:2o,nei:2o,lti:2o,fri:2o,gri:2o,zzi:2o,lmi:2o,mbi:2o,rfi:2o,ssi:2o,abi:2o,ifi:2o,tei:2o,afi:2o,rri:2o,lbi:2o,lsi:2o,zei:2o,ffi:2o,cei:2o,eci:2o,pei:2o,lei:2o,dei:2o,cui:2o,spi:2o,upi:2o,qui:2o,obi:2o,gei:2o,tui:2o,ddi:2o,lfi:2o,dri:2o,ofi:2o,hei:2o,lui:2o,pli:2o,ovi:2o,sei:2o,pii:2o,mei:2o,bei:2o,pui:2o,tii:2o,lzi:2o,vri:2o,mmi:2o,ufi:2o,ubi:2o,hni:2o,nati:3o,bili:3e,zati:3o,etti:3o,tati:3o,sali:3e,tivi:3o,uali:3e,uati:3o,ormi:3e,tici:3o,sivi:3o,zesi:3e,sati:3o,mici:3o,dati:3o,iati:3o,rimi:3o,iani:3o,xani:3o,nali:3e,feri:3o,tini:3o,otti:3o,rini:3o,bici:3o,vali:3e,iali:3e,gati:3o,itti:3o,hani:3o,vati:3o,gili:3e,coli:3o,gici:3o,olci:3e,rali:3e,bini:3o,dini:3o,anni:3o,gidi:3o,ieni:3o,eati:3o,pini:3o,sini:3o,hesi:3e,ltri:3o,trui:4,edui:3e,igui:3o,meni:3o,fili:3o,oidi:3e,cali:3e,fiti:3o,sici:3o,hici:3o,tani:3o,gesi:3e,lani:3o,usti:3o,nnui:3o,iori:3e,iaci:3o,pati:3o,aici:3o,oici:3o,noli:3o,pici:3o,pesi:3o,orei:3o,cadi:3e,vili:3e,rdui:3o,ridi:3o,hini:3o,hiti:3o,osti:3o,fati:3o,utti:3o,nini:3o,spri:3o,idui:3o,sisi:3o,urdi:3o,vici:3o,iesi:3e,daci:3e,urei:3o,riri:3e,inti:3o,vidi:3o,zeri:3o,zimi:3o,aldi:3o,zani:3o,bati:3o,ardi:3o,ceri:3o,eigi:3e,uini:3o,beri:3o,ngui:3e,ondi:3o,pedi:3e,boni:3e,femi:3o,oeri:3o,eali:3e,hivi:3o,radi:3o,coni:3e,ulli:3o,runi:3o,uoni:3o,loni:3e,auni:3o,abri:3o,arei:3o,pali:3e,pani:3o,desi:3e,didi:3o,cini:3o,vori:3o,cavi:3o,ceni:3o,ebri:3e,leri:3e,libi:3e,cimi:3o,peti:3o,heti:3o,jani:3o,leni:3o,enni:3e,dani:3o,uoli:3o,oesi:3o,oevi:3o,modi:3o,leti:3o,muni:3e,cisi:3o,reti:3o,grui:3o,gali:3e,mili:3e,ueti:3o,inui:3o,maci:3e,eani:3o,rivi:3o,endi:3o,misi:4,oati:3o,deli:3e,bani:3o,citi:3o,pidi:3o,urvi:3o,todi:3e,beni:3e,boli:3e,egni:3o,risi:3o,nudi:3o,voti:3o,fesi:3o,cili:3e,iuni:3o,sani:3o,diri:3o,yani:3o,divi:3o,visi:3o,domi:3o,dopi:3o,duri:3o,turi:3o,bbri:3o,brei:3o,dili:3e,caci:3e,meri:3o,moni:3e,viri:3o,voci:3o,trei:3o,vesi:3e,mesi:3e,ansi:3o,remi:3o,iopi:3e,vasi:3o,xtri:3a,ceti:3o,laci:3e,rili:3e,nili:3e,rrei:3o,ioli:3o,tidi:3o,fidi:3o,fisi:3o,uidi:3o,gaci:3e,ulvi:3o,erii:3e,urbi:3o,uomi:3o,oani:3o,alli:3o,erdi:3e,auci:3o,bali:3e,obbi:3o,onzi:3o,rami:3o,agni:3o,navi:3o,noti:3o,timi:3o,moti:3o,tuni:3o,lumi:3e,fami:3e,fimi:3o,zali:3e,mbri:3o,ieti:3o,ubri:3e,pori:3o,curi:3o,onni:3e,onsi:3o,heni:3o,keni:3o,irti:3o,topi:3o,lavi:3o,aidi:3o,civi:3o,geri:3o,ievi:3e,guri:3e,gori:3o,gevi:3o,uaci:3e,rani:3o,oldi:4,hili:3e,ocri:3e,miri:3o,goli:3o,romi:3o,gami:3o,bidi:3o,nani:3o,reni:3o,suni:3o,utri:3o,kesi:3e,nidi:3o,madi:3e,eici:3o,besi:3o,orbi:3o,fani:3o,goti:3o,tavi:3o,gani:3o,leli:3o,cipi:3e,tumi:3o,veri:3o,coci:3e,rodi:3e,peri:3o,tipi:3o,ropi:3o,iasi:4,arti:3o,rasi:3o,vivi:3o,ziti:3o,toli:3e,uori:4,audi:3o,auri:3o,zini:3o,cemi:3o,iavi:3o,uoti:3o,oavi:3e,sodi:3o,givi:3o,doli:3o,limi:3e,loci:3e,poni:3e,naci:3e,erzi:3o,etri:3o,goni:3o,cici:3o,orvi:3o,ruci:3e,urpi:3e,aini:3o,urti:3o,orii:3o,geti:3o,raci:3e,doni:3e,vaci:3e,eppi:3o,uavi:3o,ienti:4e,danti:4e,zanti:4e,ulici:4o,aniti:4o,ccesi:4o,ccati:4o,ntali:4e,llati:4o,orati:4o,corti:4o,urati:4o,efali:4o,cerbi:4o,acidi:4o,centi:4e,renti:4e,isiti:4o,ilici:4o,mpiti:4o,lteri:4o,stali:4e,ulati:4o,amati:4o,nanti:4e,rmati:4o,ilati:4o,frici:4o,icani:4o,genti:4e,iunti:4o,rriti:4o,afici:4o,resti:4o,lacri:4e,alari:4e,alati:4o,hieri:4o,olici:4o,brici:4o,alidi:4o,manti:4e,orici:4o,ibiti:4o,ogeni:4o,ocati:4o,amari:4o,onici:4o,mbiti:4o,brati:4o,lanti:4e,irati:4o,eschi:3o,ogini:4o,ofoni:4o,onesi:4e,ssoni:4e,imali:4e,imati:4o,omali:4o,onimi:4o,rmali:4e,ucani:4o,inesi:4e,opoli:5,serbi:4o,cnici:4o,rfici:4o,ulari:4e,perti:4o,nenti:4e,inici:4o,ositi:4o,nditi:4o,prici:4o,ilini:4o,ldici:4o,cioni:4e,trati:4o,rcani:4o,cigni:4o,rditi:4o,ganti:4e,fatti:4o,zilli:4o,rigni:4o,senti:4e,benti:4e,rtiti:4o,ratti:4o,erici:4o,atoni:4o,troci:4e,ofici:4o,canti:4e,ttesi:4o,aenti:4e,steri:4o,eresi:4e,buiti:4o,ctoni:4o,uniti:4o,onomi:4o,adali:4e,avari:4o,edici:4o,anici:4o,neari:4e,lordi:4o,rbari:4o,arici:4o,aresi:4e,lieri:4o,llici:4o,llini:4o,ucati:4o,efici:4o,eriti:4o,nigni:4o,astri:4o,blici:4o,drici:4o,olori:4e,ilari:4e,imani:4o,rmani:4o,sunti:4o,valvi:4e,landi:4o,blesi:4o,gnesi:4e,olesi:4e,gnoni:4e,bravi:4o,brevi:4e,rilli:4o,nnici:4o,uschi:3o,utali:4e,aduci:4o,bresi:4e,calvi:4o,rieri:4o,unesi:4e,pieri:4o,anori:4o,apaci:4e,olini:4o,casti:4o,rensi:4e,odici:4o,elari:4e,tieri:4o,nsiti:4o,cerei:4o,certi:4o,rvini:4o,idici:4o,hiari:4o,iesti:4o,amini:4o,clici:4o,frati:4o,nerei:4o,alesi:4e,censi:4e,slini:4o,oatti:4o,desti:4o,lioni:4e,oriti:4o,patti:4o,punti:4o,cordi:4e,eniti:4o,serti:4o,vieri:4o,nsoni:4o,rtili:4e,umati:4o,testi:4o,torti:4o,dieri:4e,triti:4o,banti:4e,idori:4e,rsari:4o,tuiti:4o,crudi:4o,ttoni:4e,idali:4e,epiti:4o,editi:4o,initi:4o,funti:4o,densi:4o,ttali:4e,alici:4o,nanzi:5,nesti:4o,spari:5,stesi:4o,umani:4o,elati:4o,tteri:4o,ivini:4o,plici:4e,ebeti:4e,grati:4o,irici:4o,bordi:4o,oditi:4o,rrati:4o,nandi:4o,satti:4o,uriti:4o,plari:4e,esili:4e,terei:4o,tnici:4o,atali:4e,elini:4o,eroci:4e,etali:4e,udali:4e,mmati:4o,fieri:4o,ifoni:4e,ofali:4e,folli:4e,rbiti:4o,rniti:4o,forti:4e,oschi:3o,ncesi:4e,ivoli:4o,ntiti:4o,elidi:4o,melli:4o,emini:4o,ntili:4e,ulivi:4o,rdici:4o,aditi:4o,celli:4o,gravi:4e,grevi:4e,uasti:4o,cilli:4e,berbi:4e,ncati:4o,scati:4o,ttiti:4o,emori:4e,rtali:4e,mpuri:4o,clini:4e,gniti:4o,ndici:4o,gesti:4o,omiti:4o,nermi:4e,nerti:4e,fanti:4e,ferti:4o,genui:4o,glesi:4e,gordi:4o,odori:4o,spiti:4e,signi:4e,tatti:4o,nteri:4o,odali:4e,otesi:4o,ovari:4o,unari:4e,eandi:4o,lindi:4o,mbari:4e,ucidi:4o,macri:4o,rlati:4o,ligni:4o,ltesi:4e,festi:4o,rcati:4o,ssimi:4o,matti:4o,lensi:4o,omati:4o,nsili:4e,catti:4o,gneri:4o,mesti:4o,inimi:4o,hioni:4e,rlini:4o,inori:4e,enesi:4e,otoni:4o,relli:4o,morti:4o,lsori:4e,latti:4o,lmani:4o,eanti:4e,fandi:4o,fasti:4o,uensi:4e,velli:4o,uvoli:4o,opaci:4o,stili:4e,acati:4o,llidi:4o,alini:4o,archi:3o,igini:4o,avini:4o,atiti:4o,ugini:4o,pesti:4o,iatti:4o,telli:4o,troni:4e,orchi:3o,porti:4o,atili:4e,alori:5,pravi:4o,rsori:4e,isoli:4e,etesi:4o,ischi:3o,proni:4o,pensi:4o,tervi:4o,uliti:4o,drati:4o,uatti:4o,utesi:4e,ncidi:4o,apiti:4o,oanti:4e,proci:4o,educi:4e,ggini:4o,manzi:4o,oneri:4o,unici:4o,otali:4e,sacri:4o,salvi:4o,uigni:4o,tolli:4o,apoli:4o,lpiti:4o,scesi:4o,gnici:4o,guiti:4o,edali:4e,sesti:4o,imini:4o,lvani:4o,croni:4o,istri:4o,munti:4o,nelli:4o,lerti:4e,omari:4o,onori:4o,sordi:4o,nioni:4e,uilli:4o,iliti:4o,upiti:4o,ubiti:4o,perbi:4o,urici:4o,tenui:4e,etili:4e,imidi:4o,tonti:4o,eunti:4e,nfali:4e,eneti:4o,roppi:4o,umidi:4o,urchi:3o,isoni:4o,zieri:4o,vasti:4o,rgini:4e,nnesi:4e,scidi:4o,iresi:4e,ngari:4o,zoppi:4o,zuppi:4o,revoli:5e,lianti:5e,ivanti:5e,lerati:5o,tolati:5o,adatti:5o,ticati:5o,luenti:5e,franti:5o,micati:5o,gevoli:5e,cianti:5e,merati:5o,ntrici:5o,itanti:5e,utanti:5e,banesi:5e,berati:5o,pestri:5e,terati:5o,etrici:5o,alenti:5e,gianti:5e,hevoli:5e,moniti:5o,illari:5e,gelici:5o,lomani:5e,golari:5e,nsanti:5e,iaerei:5o,rifici:5o,ienici:5o,polari:5e,romani:5o,genici:5o,polidi:5e,licati:5o,cadici:5o,rdenti:5e,telici:5o,devoli:5e,colati:5o,golati:5o,ndenti:5e,sianti:5e,iranti:5e,ssorti:5o,nuanti:5e,toniti:5o,colari:5e,tranti:5e,endali:5e,enieri:5o,anieri:5o,baschi:4o,ricidi:5a,eranti:5e,attori:5e,nvisti:5o,mevoli:5e,fronti:5e,llenti:5e,olliti:5o,bovini:5o,zolati:5o,ulgari:5o,adenti:5e,cafoni:5e,ntanti:5e,onieri:5o,antori:5e,pitali:5e,apresi:5e,cerati:5o,zevoli:5e,ricati:5o,tevoli:5e,tanesi:5e,branti:5e,elesti:5e,tesimi:5o,ierati:5o,uesimi:5o,vesimi:5o,resimi:5o,iesimi:5o,eesimi:5o,nesimi:5o,lesimi:5o,ociari:5o,uitali:5e,ementi:5e,uvanti:5e,cleari:5e,oitali:5e,ettori:5e,pevoli:5e,mitali:5e,etenti:5e,lanari:5e,mpresi:5o,udenti:5e,identi:5e,rtanti:5e,iventi:5e,guenti:5e,solari:5e,ntenti:5o,oranti:5e,ortesi:5e,tuenti:5e,bitali:5e,uranti:5e,almati:5a,danesi:5e,granti:5e,nerati:5o,generi:5e,quenti:5e,imenti:5e,ficati:5o,vianti:5e,iarati:5o,fusori:5e,gitali:5e,mpenti:5e,cevoli:5e,perati:5o,etanti:5e,butori:5e,rtenti:5e,cesimi:5o,uttili:5e,atanti:5e,menici:5o,denici:5o,ferati:5o,ttrici:5o,vatori:5e,lenici:5o,uanimi:5e,uestri:5e,ruditi:5o,gerati:5o,ltanti:5e,crandi:5o,aranti:5e,odenti:5e,restri:5e,alliti:5o,melici:5o,gliari:5e,felici:5e,rventi:5e,ievoli:5e,ilmati:5o,ittili:5e,tuanti:5e,nitori:5e,ossili:5e,mmisti:5o,escani:5o,iaschi:4o,futili:5e,allesi:5e,ppanti:5e,strici:5o,nitali:5e,lifici:5o,hanesi:5e,vevoli:5e,iovini:5e,dicati:5o,fianti:5e,grandi:5e,ignari:5o,illesi:5o,bolati:5o,mbelli:5e,nifici:5o,immani:5e,mmensi:5o,itenti:5e,otenti:5e,evisti:5o,pronti:5o,pudici:5o,ssanti:5e,ncliti:5o,farati:5o,volati:5o,digeni:5o,rianti:5e,picati:5o,uitori:5e,ticidi:5a,soliti:5o,lventi:5e,noliti:5o,ntensi:5o,intesi:5o,sicati:5o,nutili:5e,iolati:5o,ertesi:5o,evanti:5e,custri:5e,atenti:5e,ludici:5o,aestri:5o,lfermi:5o,estiti:5o,lvisti:5o,bolari:5e,tovani:5o,emmani:5o,ritali:5e,cranti:5e,desimi:5o,ollari:5e,lanesi:5e,erandi:5o,olesti:5o,gaschi:4o,tanari:5o,hicidi:5a,mutili:5o,upanti:5e,rvanti:5e,tomani:5o,cifici:5o,dovani:5o,amensi:5e,uelici:5o,ipanti:5e,dolari:5e,esanti:5e,zicati:5o,minari:5e,oclivi:5e,delici:5o,lsanti:5e,vinari:5e,lanimi:5e,quanti:5o,ffermi:5o,pitori:5e,edatti:5o,ibelli:5e,eventi:5e,vitori:5e,verati:5o,raschi:4o,spanti:5e,sadici:5o,vifici:5o,cenici:5o,renici:5o,secchi:4o,herati:5o,omenti:5o,vestri:5e,offici:5e,solidi:5o,rpresi:5o,ottili:5e,affici:5o,spenti:5o,vvisti:5o,itensi:5e,tolidi:5o,zianti:5e,rstiti:5e,plenti:5e,wanesi:5e,tarati:5o,attili:5e,teneri:5o,serati:5o,essili:5e,oscani:5o,comani:5e,panesi:5e,hianti:5e,andali:5o,velici:5o,ellesi:5e,rsanti:5e,citori:5e,vitali:5e,olgari:5e,inevoli:6e,tratori:6e,usolati:6o,ravanti:6e,ntatori:6e,cedenti:6e,ciliari:6e,idebiti:7,iettili:7,istanti:6e,lauditi:6o,rmatori:6e,istenti:6e,ssolati:6o,dannari:6e,vilenti:6e,estanti:6e,amaschi:5o,icipiti:6e,biliari:6e,imotori:6e,onevoli:6e,niatori:6e,itolari:6e,rbonari:6o,rcatori:6e,ostanti:6e,citrici:6o,oderati:6o,llinari:6e,moventi:6e,utatori:6e,nsatori:6e,mpianti:6o,ressori:6e,ettenti:6e,rtatori:6e,duttori:6e,iderati:6o,onsorti:6e,sulenti:6e,umatori:6e,contesi:6o,astanti:6e,pulenti:6o,reatori:6e,editori:6e,cruenti:6o,ebitori:6e,uttanti:6e,latrici:6e,esolati:6o,statori:6e,fensori:6e,ppianti:6e,plinari:6e,egatori:6e,sparati:6o,gitrici:6e,ucatori:6e,ittenti:6e,bratori:6e,culenti:6o,ositori:6e,tensori:6e,miliari:6e,giatori:6e,fissili:6e,mellari:6e,dinieri:6e,giovani:6e,llustri:6e,eparati:6o,nauditi:6o,itatori:6e,gruenti:6e,ndebiti:6o,nnatori:6e,nnevoli:6e,solenti:6e,insorti:6o,tellari:6e,stitori:6e,isolati:6o,llatori:6e,omotori:6e,cilenti:6o,gnanimi:6o,ldestri:6o,mannari:6o,vratori:6e,arinari:6o,tinieri:6o,ntitori:6e,nitrici:6o,iatrici:6o,alustri:6e,edestri:6e,scatori:6e,montesi:6e,impanti:6e,piovani:6o,centari:6e,nderati:6o,ecipiti:6e,rritori:6e,rulenti:6o,zolenti:6e,dentori:6e,ovisori:6e,rettili:6e,iedenti:6e,hiatori:6e,iparati:6o,etitori:6e,posanti:6e,elatori:6e,rivisti:6o,rotanti:6e,roventi:6e,rosanti:6o,telliti:6e,attanti:6e,scipiti:6o,nsolati:6o,ottanti:6e,olevoli:6e,pelliti:6o,silenti:6e,gnatori:6e,raffini:6o,toventi:6o,rtitori:6e,ioventi:6e,oradici:6o,ottenti:6e,tartari:6o,aditori:6e,bolenti:6o,unanimi:6e,rlatori:6e,vedenti:6e,nditori:6e,evanesi:6e,iolenti:6o,volenti:6e,votanti:6e,lettanti:7e,rettanti:7o,nciatori:7e,imissili:8,curatori:7e,benevoli:7o,ricatori:7e,battenti:7e,venevoli:7e,rruttori:7e,credenti:7e,sattenti:7o,fettanti:7e,boratori:7e,ementari:7e,loratori:7e,entifici:7o,udolenti:7o,renatori:7e,tigatori:7e,neratori:7e,dicatori:7e,ndolenti:7e,esauditi:7o,lampanti:7e,amissili:8,malevoli:7o,polatori:7e,militari:7e,gliatori:7e,deratori:7e,licatori:7e,mentisti:7e,dinatori:7e,pagatori:7e,rampanti:7o,attatori:7e,toratori:7e,salutari:7e,inolenti:7o,minfermi:7o,nnolenti:7o,culatori:7e,ettatori:7e,tampanti:7e,acotanti:7e,valevoli:7e,tilatori:7e,siliatori:8e,lcolatori:8e,lizzatori:8e,nfederati:8o,emolitori:8e,ominatori:8e,lamentari:8e,niziatori:8e,isolatori:8e,nizzatori:8e,iparatori:8e,isanatori:8e,rminatori:8e,alimentari:9e,lificatori:9e,oconfinari:9e,ooperatori:9e,ostruttori:9e,ispiratori:9e,dificatori:9e,cificatori:9e,ezionatori:9e,nificatori:9e,vificatori:9e,iconsumisti:11,arificatori:10e,distruttori:10e,ivisionisti:10e,iconciliatori:12e,"
    },
    "presentTense": {
      "first": "re:sco,are:o,ere:o,ire:o,rre:ngo,rire:io,rere:io,lere:glio,tere:sso,ersi:o,sere:ono,urre:1co,sire:2sco,fire:2sco,hire:2sco,arre:1ggo,zire:2sco,oire:2sco,eire:2sco,apere:o,avere:ho,icare:uco,orire:uoio,onire:3sco,unire:3sco,olire:3sco,utire:3sco,anire:3sco,rrere:2o,udire:3sco,ddire:3co,lcire:3sco,erire:3sco,adire:3sco,luire:3sco,agire:3sco,mbire:3sco,ttire:3sco,ilire:3sco,nuire:3sco,enere:2go,inire:3sco,stere:2o,buire:3sco,ulire:3sco,apire:3sco,rpire:3sco,erere:2o,cuire:3sco,lpire:3sco,atire:3sco,etere:2o,epire:3sco,upire:3sco,tuire:3sco,ruire:3sco,ucire:3o,odire:3sco,utere:2o,mpire:3o,alere:2go,urire:3sco,rcire:3sco,ibire:3sco,llere:2o,rnire:3sco,emire:3sco,gnire:3sco,trire:3sco,grire:3sco,ocire:3sco,bbire:3sco,glire:3sco,quire:3sco,etire:3sco,frire:2o,anere:2go,acere:2cio,ncire:3sco,ltire:3sco,opire:3sco,ubire:3sco,plire:3sco,rtere:2o,gliere:lgo,uscire:esco,bicare:3o,attere:3o,ellire:4sco,dicare:3o,orrire:3o,ortire:4sco,venire:3go,ticare:3o,micare:3o,ricare:3o,bidire:4sco,ficare:3o,antire:4sco,cicare:3o,licare:3o,ondire:4sco,aprire:3o,rguire:4sco,picare:3o,ostire:4sco,andire:4sco,zicare:3o,nedire:4co,iarire:4sco,lorire:4sco,oprire:3o,sicare:3o,bedire:4sco,ordire:4sco,allire:4sco,vorire:4sco,iorire:4sco,ottere:3o,arrire:4sco,ermire:4sco,uarire:4sco,astire:4sco,ialire:4sco,lidire:4sco,pedire:4sco,cidire:4sco,sprire:4sco,indire:4co,tidire:4sco,porire:4sco,pidire:4sco,midire:4sco,ontire:4sco,istire:4sco,gidire:4sco,ustire:4sco,lenire:4sco,ledire:4co,torire:4sco,vidire:4sco,vicare:3o,gorire:4sco,essere:3o,mettere:etto,gredire:5sco,lestire:5sco,mollire:5sco,nettere:4o,ssalire:4go,unicare:4o,lettere:4o,rnicare:4o,gestire:5sco,tridire:5sco,aridire:5sco,rridire:5sco,terdire:5co,imorire:5sco,muggire:5sco,predire:5co,verdire:5sco,isalire:4go,ruggire:5sco,ientire:5sco,asalire:5sco,mmettere:5o,omettere:5o,imettere:5o,emettere:5o,mpartire:6sco,rmettere:5o,smentire:6sco,spartire:6sco,amettere:5o,ismettere:6o,itrasmettere:9o,==adire:3sco,agire:3sco,aprire:3o,assorbire:7sco,avere:ho,bere:2vo,dire:2co,emettere:5o,gestire:5sco,indire:4co,lenire:4sco,mettere:4o,muggire:5sco,omettere:5o,ordire:4sco,predire:5co,ridare:3ò,ridire:4co,ristare:4ò,ruggire:5sco,salire:3go,smentire:6sco,smettere:5o,sorbire:5sco,sparire:5sco,spartire:6sco,trasmettere:8o,unire:3sco,venire:3go==fo:1are,zo:1are,eo:1are,aco:2are,hio:2are,ino:2are,olo:2are,gno:2are,cco:2are,vio:2are,ito:2are,tuo:2are,uro:2are,ogo:2are,uso:2are,eco:2are,ppo:2are,amo:2are,ato:2are,uno:2are,ulo:2are,nso:2are,tro:2are,bbo:2are,oro:2are,bro:2are,nno:2are,bio:2are,ilo:2are,oco:2are,iro:2are,avo:2are,ego:2are,gio:2are,alo:2are,eno:2are,ago:2are,ano:2are,aro:2are,tio:2are,elo:2are,fio:2are,oto:2are,ipo:2are,rio:2are,ovo:2are,ugo:2are,lto:2are,dio:2are,blo:2are,epo:2are,mmo:2are,nuo:2are,rso:2are,aso:2are,mio:2are,rlo:2are,lco:2are,lmo:2are,nio:2are,pto:2are,oso:2are,ibo:2are,cro:2are,plo:2are,zio:2are,apo:2are,ubo:2are,sio:2are,lpo:2are,omo:2are,opo:2are,gro:2are,smo:2are,rpo:2are,cuo:2are,lso:2are,ddo:2are,spo:2are,duo:2are,obo:2are,dro:2are,vro:2are,upo:2are,uio:2are,eso:2are,ldo:2are,tmo:2are,abo:2are,baio:3are,allo:3are,dono:3are,arco:3are,asso:3are,vero:3are,itto:3are,bono:3are,tono:3are,erro:3are,isso:3are,ppio:3are,ampo:3are,arro:3are,pono:3are,scio:3are,asto:3are,cedo:3ere,lero:3are,heto:3are,modo:3are,ncio:3are,rcio:3are,osto:3are,iono:3are,pero:3are,orno:3are,tero:3are,ermo:3are,anco:3are,fido:3are,ilio:3are,iggo:3ere,onto:3are,tivo:3are,unto:3are,usto:3are,mero:3are,anto:3are,iuto:3are,bero:3are,levo:3are,ludo:3ere,erco:3are,alio:3are,meto:3are,plio:3are,puto:3are,nimo:3are,nido:3are,nodo:3are,noio:3are,ullo:3are,orto:3are,simo:3are,armo:3are,illo:3are,ocio:3are,sodo:3are,olvo:3ere,viso:3are,zero:3are,acio:3are,bado:3are,icio:3are,lono:3are,ruco:3are,usco:3are,utto:3are,buco:3are,usso:3are,cado:3ere,lcio:3are,dido:3are,tigo:3are,cero:3are,iedo:3ere,iodo:3are,iudo:3ere,ifro:3are,cimo:3are,into:3are,vigo:3are,audo:3are,sero:3are,muto:3are,leto:3are,mpro:3are,reto:3are,futo:3are,gedo:3are,dero:3are,nsto:3are,opio:3are,rono:3are,eggo:3ere,ompo:3ere,tumo:3are,urvo:3are,nero:3are,nquo:3ere,nudo:3are,erdo:3ere,urbo:3are,vido:3ere,enco:3are,erbo:3are,gero:3are,sigo:3ere,spio:3are,rudo:3ere,vado:3ere,irmo:3are,irto:3are,fumo:3are,arbo:3are,gemo:3ere,godo:3ere,uido:3are,urro:3are,arno:3are,uaio:3are,timo:3are,bido:3are,pido:3are,ledo:3ere,fero:3are,limo:3are,mono:3are,lodo:3are,mimo:3are,mudo:3are,blio:3are,olio:3are,undo:3ere,gono:3are,squo:3are,ipio:3are,digo:3ere,cevo:3ere,cquo:3are,uono:3are,fono:3are,luto:3are,onco:3are,livo:3are,alvo:3are,cemo:3are,hedo:3are,hivo:3are,ruto:3are,raio:3are,sedo:3are,pumo:3are,nuto:3are,rpio:3are,upro:3are,sudo:3are,buto:3are,urto:3are,geto:3are,aglio:4are,iglio:4are,bondo:4are,bduco:3rre,brado:4ere,occio:4are,cento:4are,certo:4are,cetto:4are,collo:4are,tello:4are,tento:4are,cordo:4are,corro:4ere,uieto:4are,uisto:4are,datto:4are,dento:4are,dosso:4are,dduco:3rre,deguo:4are,dergo:4ere,desco:4are,dopro:4are,dotto:4are,fetto:4are,follo:4are,hindo:4are,iungo:4ere,largo:4are,latto:4are,lento:4are,lerto:4are,lieto:4are,lungo:4are,terno:4are,iento:4are,derno:4are,morbo:4are,nello:4are,ppaio:3rire,pendo:4ere,rendo:4ere,prodo:4are,besco:4are,rredo:4are,resto:4are,iccio:4are,rrido:4ere,rrivo:4are,rosso:4are,tondo:4are,vello:4are,crivo:4ere,pergo:4ere,petto:4are,sesto:4are,getto:4are,sordo:4are,ssumo:4ere,surgo:4ere,tergo:4ere,tendo:4ere,testo:4are,tingo:4ere,torco:4ere,vento:4are,vinco:4ere,visto:4are,volgo:4ere,zardo:4are,betto:4are,bardo:4are,bendo:4are,lindo:4are,cotto:4are,botto:4are,bordo:4are,brigo:4are,rindo:4are,rucio:4are,pesto:4are,cello:4are,casco:4are,cerno:4ere,sello:4are,cesso:4are,cingo:4ere,uetto:4are,ncido:4ere,uccio:4are,lango:4ere,nosco:4ere,llido:4ere,mando:4are,mendo:4are,mpaio:3rire,patto:4are,iango:4ere,primo:4ere,pungo:4ere,fesso:4are,formo:4are,seguo:4ire,olido:4are,nsumo:4are,tatto:4are,ratto:4are,rollo:4are,nvivo:4ere,bello:4are,pondo:4ere,rrodo:4ere,pargo:4ere,credo:4ere,cremo:4are,ecido:4ere,fungo:4ere,predo:4are,erido:4ere,desto:4are,detto:4are,fendo:4ere,leguo:4are,iligo:4ere,pingo:4ere,iredo:4are,irigo:4ere,irimo:4ere,rotto:4are,eredo:4are,serto:4are,resso:4are,suado:4ere,disto:4are,ruggo:4ere,vieto:4are,vulgo:4are,dormo:4ire,uello:4are,elido:4ere,mergo:4ere,erigo:4ere,erodo:4ere,pando:4ere,hetto:4are,fervo:4ere,fingo:4ere,gello:4are,lotto:4are,fremo:4ere,uento:4are,retto:4are,frodo:4are,fuggo:4ire,fulgo:4ere,nesto:4are,gesso:4are,verno:4are,grado:4are,grido:4are,guado:4are,uardo:4are,berno:4are,mbevo:4ere,bosco:4are,rento:4are,rsono:4are,carto:4are,combo:4ere,dulgo:4ere,fango:4are,festo:4are,forco:4are,uglio:4are,gorgo:4are,ietto:4are,nesco:4are,nondo:4are,sorgo:4ere,tasco:4are,eccio:4are,trido:4ere,oduco:3rre,alido:4are,vesto:4ire,rrigo:4are,crimo:4are,lesso:4are,listo:4are,lordo:4are,singo:4are,matto:4are,mesco:4ere,mesto:4are,mingo:4ere,dello:4are,lesto:4are,mollo:4are,mondo:4are,mordo:4ere,mungo:4ere,nasco:4ere,gligo:4ere,bligo:4are,ccido:4ere,pasco:4ere,notto:4are,pesco:4are,iombo:4are,oetto:4are,porgo:4ere,premo:4ere,privo:4are,mulgo:4are,purgo:4are,rello:4are,risto:4are,edimo:4ere,cindo:4ere,iardo:4ere,sorbo:4ire,catto:4are,bombo:4are,tombo:4are,lendo:4ere,eglio:4are,tardo:4are,vendo:4ere,ivivo:4ere,rombo:4are,aetto:4are,bando:4are,iotto:4are,corgo:4ere,cuoio:4are,sesso:4are,ducio:4are,stemo:4are,misto:4are,sondo:4are,porco:4are,uarto:4are,icido:4are,tremo:4are,rinco:4are,ucido:4are,vango:4are,vesso:4are,idimo:4are,naccio:5are,raccio:5are,scendo:5ere,nsento:5ire,cresco:5ere,faccio:5are,frango:5ere,fresco:5are,imento:5are,laccio:5are,lletto:5are,anetto:5are,moglio:5are,pparto:5are,ppello:5are,omento:5are,rringo:5are,scondo:5ere,econdo:5are,ssento:5ire,assido:5ere,tringo:5ere,umento:5are,vverto:5ire,caccio:5are,caduco:5are,rcondo:5are,mmento:5are,onduco:4rre,nfisco:5are,nfondo:5ere,nservo:5are,tinguo:5ere,nvergo:5ere,nverto:5ire,deduco:4rre,desumo:5ere,iletto:5are,iparto:5ire,ispaio:4rire,sanguo:5are,ivergo:5ere,iverto:5ire,rmento:5are,goffro:5are,roglio:5are,paccio:5are,emento:5are,ncendo:5ere,induco:4rre,rpello:5are,amento:5are,languo:5ire,anduco:5are,schero:5are,sservo:5are,ossido:5are,rverto:5ire,eservo:5are,resumo:5ere,esetto:5are,ibollo:5ire,iesumo:5are,pinguo:5are,isento:5ire,sborro:5are,seduco:4rre,taccio:5are,foglio:5are,bbollo:5ire,poglio:5are,prango:5are,stango:5are,raduco:4rre,aspaio:4rire,cchero:5are,affondo:6are,hiaccio:6are,cchiero:6are,iffondo:6ere,effondo:6ere,nvoglio:6are,schiero:6are,asfondo:6ere,faccendo:7are,iaccendo:7ere,pravvivo:7ere,ppresento:8are,ipresento:8are,sprofondo:8are,",
      "second": "re:sci,are:i,ere:i,rre:ni,pere:i,vere:i,ersi:i,urre:1ci,iere:1,arre:1i,vire:2,enire:ieni,enere:ieni,icare:uchi,otere:uoi,olere:uoi,acare:2hi,hiare:2,liare:2,aiare:2,rcare:2hi,ccare:2hi,ogare:2hi,ecare:2hi,ddire:3ci,scare:2hi,biare:2,ocare:2hi,egare:2hi,giare:2,agare:2hi,rgare:2hi,tiare:2,fiare:2,oiare:2,riare:2,ugare:2hi,ivere:2i,lvere:2i,miare:2,igare:2hi,ucare:2hi,lcare:2hi,niare:2,mpere:2i,ucire:3,ziare:2,lgare:2hi,mpire:3,rvere:2i,evere:2i,frire:3,uiare:2,uscire:esci,bicare:3hi,cciare:3,dicare:3hi,orrire:4,ppiare:3,nciare:3,rciare:3,ticare:3hi,ancare:3hi,micare:3hi,ricare:3hi,ficare:3hi,cicare:3hi,licare:3hi,aprire:4,iviare:3,picare:3hi,ingare:3hi,ediare:3,ociare:3,ertire:4,aciare:3,zicare:3hi,nedire:4ci,iciare:3,uciare:3,lciare:3,eguire:4,opiare:3,oprire:4,sicare:3hi,ormire:4,encare:3hi,ndiare:3,indire:4ci,angare:3hi,idiare:3,rsiare:3,adiare:3,nguire:4,lenire:4sci,ledire:4ci,ipiare:3,vicare:3hi,udiare:3,rpiare:3,aviare:3,incare:3hi,mettere:etti,reviare:4,asciare:4,sentire:5,osciare:4,leviare:4,pparire:5,ssalire:5,bollire:5,mparire:5,unicare:4hi,rnicare:4hi,fuggire:5,terdire:5ci,vestire:5,isciare:4,ovviare:4,rodiare:4,predire:5ci,isalire:5,esciare:4,usciare:4,tostare:5i,mmettere:5i,omettere:5i,imettere:5i,ipartire:6,isparire:6,emettere:5i,rmettere:5i,olungare:5hi,rinviare:5,troncare:5hi,amettere:5i,asparire:6,ismettere:6i,iassorbire:8,itrasmettere:9i,==aprire:4,bere:2vi,bollire:5,dare:2i,dire:2ci,emettere:5i,fuggire:5,indire:4ci,lenire:4sci,mentire:5,orire:3,omettere:5i,ovviare:4,partire:5,predire:5ci,ridare:4i,ridire:4ci,rinviare:5,ristare:5i,scire:3,salire:4,sentire:5,smettere:5i,stare:3i,enire:3,trasmettere:8i,troncare:5hi,vestire:5,sere:2i==ii:1are,ini:2are,gni:2are,iti:2are,tui:2are,usi:2are,ami:2are,ati:2are,uni:2are,uli:2are,nsi:2are,iri:2are,lgi:2ere,lei:2are,nei:2are,lzi:2are,eli:2are,oti:2are,ovi:2are,lti:2are,epi:2are,nui:2are,isi:2are,asi:2are,bei:2are,rli:2are,lmi:2are,pti:2are,osi:2are,ibi:2are,cri:2are,rei:2are,afi:2are,api:2are,ubi:2are,lpi:2are,gri:2are,smi:2are,cui:2are,lsi:2are,ofi:2are,ddi:2are,dei:2are,spi:2are,dui:2are,obi:2are,dri:2are,vri:2are,upi:2are,esi:2are,ldi:2are,sai:2pere,tmi:2are,ifi:2are,abi:2are,ufi:2are,alli:3are,doni:3are,uffi:3are,assi:3are,veri:3are,doli:3are,itti:3are,boni:3are,toni:3are,ozzi:3are,onzi:3are,erri:3are,issi:3are,ampi:3are,arri:3are,ezzi:3are,asti:3are,cedi:3ere,leri:3are,heti:3are,modi:3are,osti:3are,turi:3are,izzi:3are,stri:3are,ioni:3are,obbi:3are,ossi:3are,ergi:3ere,mbri:3are,peri:3are,dori:3are,teri:3are,anni:3are,ermi:3are,fidi:3are,iggi:3ere,onti:3are,voli:3are,tivi:3are,unti:3are,meri:3are,uppi:3are,anti:3are,guri:3are,uzzi:3are,iuti:3are,beri:3are,leni:3are,tani:3are,ludi:3ere,mari:3are,meti:3are,puti:3are,cori:3are,nimi:3are,nidi:3are,nodi:3are,ulli:3are,iani:3are,orti:3are,simi:3are,puri:3are,itri:3are,armi:3are,coli:3are,goli:3are,pori:3are,mbli:3are,curi:3are,illi:3are,sodi:3are,ommi:3are,urgi:3ere,trai:3rre,ingi:3ere,ersi:3are,zeri:3are,badi:3are,bari:3are,effi:3are,loni:3are,toli:3are,utti:3are,ussi:3are,cadi:3ere,cali:3are,didi:3are,cavi:3are,ceni:3are,ntri:3are,ceri:3are,iavi:3are,iedi:3ere,iodi:3are,iudi:3ere,ifri:3are,cimi:3are,inti:3are,bori:3are,audi:3are,mori:3are,seri:3are,muti:3are,peti:3ere,pili:3are,leti:3are,mpri:3are,reti:3are,futi:3are,gedi:3are,deri:3are,soli:3are,nsti:3are,roni:3are,ompi:3ere,argi:3ere,tipi:3are,tumi:3are,urvi:3are,neri:3are,nqui:3ere,nudi:3are,iari:3are,meni:3are,pani:3are,rigi:3ere,cuti:3ere,nori:3are,erdi:3ere,sipi:3are,urbi:3are,vori:3are,domi:3are,dopi:3are,reni:3are,bbli:3are,duri:3are,ubri:3are,ibri:3are,vali:3ere,erbi:3are,geri:3are,tori:3are,sigi:3ere,lari:3are,irpi:3are,rudi:3ere,vadi:3ere,ltri:3are,irmi:3are,irti:3are,gori:3are,fori:3are,fumi:3are,arbi:3are,gemi:3ere,godi:3ere,uidi:3are,urri:3are,moli:3are,tali:3are,pali:3are,enni:3are,soni:3are,nali:3are,arni:3are,teni:3are,ammi:3are,auri:3are,timi:3are,bidi:3are,poli:3are,foli:3are,rori:3are,pidi:3are,lavi:3are,ledi:3ere,feri:3are,lici:3ere,limi:3are,lodi:3are,iori:3are,nomi:3are,mimi:3are,suri:3are,mudi:3are,muri:3are,tili:3are,usei:3are,geni:3are,undi:3ere,goni:3are,squi:3are,dali:3are,peni:3are,zoli:3are,etri:3are,iaci:3ere,pipi:3are,puoi:1otere,fani:3are,digi:3ere,gali:3are,cuci:4re,orsi:3are,inzi:3are,uori:3are,sani:3are,cqui:3are,uoni:3are,foni:3are,luti:3are,gomi:3are,livi:3are,alvi:3are,bavi:3are,cemi:3are,hedi:3are,erzi:3are,ippi:3are,ruti:3are,cuoi:4are,gani:3are,ioli:3are,iffi:3are,pumi:3are,nuti:3are,ripi:3are,upri:3are,sudi:3are,uoli:3are,veni:3are,boli:3are,buti:3are,urti:3are,urpi:3are,geti:3are,gili:3are,batti:4ere,bondi:4are,nisci:2re,tisci:2re,bduci:3rre,biuri:4are,bradi:4ere,centi:4are,certi:4are,cetti:4are,iappi:4are,cogli:5ere,colli:4are,telli:4are,tenti:4are,cordi:4are,corri:4ere,resci:4ere,disci:2re,uieti:4are,sisci:2re,uisti:4are,datti:4are,denti:4are,vieni:1enire,cisci:2re,olori:4are,dduci:3rre,degui:4are,dopri:4are,dorni:4are,dotti:4are,fetti:4are,uisci:2re,folli:4are,rangi:4ere,hindi:4are,iorni:4are,iungi:4ere,iusti:4are,gravi:4are,gisci:2re,lieni:4are,latti:4are,lenti:4are,lerti:4are,lieti:4are,lungi:4are,terni:4are,ienti:4are,bisci:2re,mazzi:4are,derni:4are,morbi:4are,fisci:2re,nelli:4are,eponi:3rre,icipi:4are,ioppi:4are,rendi:4ere,prodi:4are,ropri:5are,rredi:4are,resti:4are,hisci:2re,rridi:4ere,rrivi:4are,tondi:4are,velli:4are,crivi:4ere,petti:4are,sesti:4are,imili:4are,sisti:4ere,getti:4are,sordi:4are,ssumi:4ere,tendi:4ere,testi:4are,torci:4ere,vanzi:4are,venti:4are,vinci:4ere,visti:4are,zisci:2re,zardi:4are,betti:4are,bardi:4are,bendi:4are,lindi:4are,cotti:4are,botti:4are,bordi:4are,bravi:4are,rindi:4are,pesti:4are,celli:4are,cazzi:4are,lebri:4are,cerni:4ere,selli:4are,cessi:4are,uetti:4are,ncidi:4ere,langi:4ere,nosci:4ere,llidi:4ere,mandi:4are,mendi:4are,patti:4are,iangi:4ere,mponi:3rre,primi:4ere,pungi:4ere,nduci:3rre,fessi:4are,formi:4are,olidi:4are,nsumi:4are,tatti:4are,empli:4are,ratti:4are,rolli:4are,nvivi:4ere,belli:4are,pondi:4ere,rrodi:4ere,credi:4ere,cremi:4are,danzi:4are,ecidi:4ere,fungi:4ere,plori:4are,predi:4are,eridi:4ere,desti:4are,detti:4are,fendi:4ere,legui:4are,iligi:4ere,iponi:3rre,iredi:4are,irimi:4ere,rotti:4are,iogli:5ere,eredi:4are,serti:4are,ressi:4are,sponi:3rre,suadi:4ere,disti:4are,togli:5ere,ruggi:4ere,ividi:4ere,vieti:4are,uelli:4are,elevi:4are,elidi:4ere,emani:4are,ipari:4are,erodi:4ere,esali:4are,pandi:4ere,tolli:4ere,hetti:4are,gelli:4are,lotti:4are,forzi:4are,fotti:4ere,torni:4are,fremi:4ere,uenti:4are,retti:4are,frodi:4are,rusti:4are,ucili:4are,nesti:4are,iesci:1uscire,loppi:4are,gessi:4are,misci:2re,oisci:2re,ubili:4are,lebbi:4are,verni:4are,gradi:4are,gridi:4are,guadi:4are,uardi:4are,berni:4are,latri:4are,razzi:4are,renti:4are,carti:4are,ceppi:4are,combi:4ere,festi:4are,nfili:4are,uenzi:4are,forni:4are,grani:4are,roppi:4are,ietti:4are,nondi:4are,aponi:4are,sorgi:4ere,rponi:3rre,tridi:4ere,oduci:3rre,alidi:4are,eisci:2re,crimi:4are,lessi:4are,listi:4are,lordi:4are,nuchi:1icare,matti:4are,mesci:4ere,mesti:4are,mieti:4ere,delli:4are,lesti:4are,molli:4are,mondi:4are,mordi:4ere,mungi:4ere,nasci:4ere,gligi:4ere,ccidi:4ere,pappi:4are,ecipi:4are,pasci:4ere,rmani:4ere,notti:4are,iombi:4are,oetti:4are,plani:4are,poppi:4are,porgi:4ere,ranzi:4are,premi:4ere,epari:4are,cegli:5ere,privi:4are,ofili:4are,oponi:3rre,relli:4are,risti:4are,edimi:4ere,cindi:4ere,iardi:4ere,catti:4are,ifili:4are,ilevi:4are,imani:4ere,bombi:4are,iazzi:4are,ncari:4are,tombi:4are,lendi:4ere,tardi:4are,vendi:4ere,ivivi:4ere,rombi:4are,ronci:4are,ronfi:4are,aetti:4are,iaffi:4are,bandi:4are,brani:4are,cappi:4are,iotti:4are,scipi:4are,scopi:4are,corgi:4ere,sessi:4are,sfili:4are,uazzi:4are,ibili:4are,stemi:4are,misti:4are,sondi:4are,uarti:4are,tappi:4are,nazzi:4are,toppi:4are,rappi:4are,icidi:4are,lazzi:4are,tangi:4ere,tessi:4ere,aduci:3rre,tremi:4are,ionfi:4are,ucidi:4are,vessi:4are,idimi:4are,zappi:4are,bacchi:6are,llisci:3re,olisci:3re,scendi:5ere,erisci:3re,docchi:6are,imenti:5are,llappi:5are,lletti:5are,anetti:5are,mucchi:6are,nnetti:5ere,ilisci:3re,recchi:6are,pparti:5are,ppelli:5are,ppendi:5ere,omenti:5are,rraffi:5are,rischi:6are,scondi:5ere,econdi:5are,assidi:5ere,ulisci:3re,umenti:5are,vinghi:6are,vicchi:6are,adenzi:5are,ticchi:6are,apisci:3re,rpisci:3re,arisci:3re,cischi:6are,rcondi:5are,orisci:3re,lpisci:3re,mmenti:5are,episci:3re,upisci:3re,nfondi:5ere,nservi:5are,tingui:5ere,deduci:4rre,egusti:5are,desumi:5ere,iletti:5are,sangui:5are,ancipi:5are,urisci:3re,rmenti:5are,fletti:5ere,rrisci:3re,goffri:5are,alisci:3re,impari:5are,mpazzi:5are,grisci:3re,ementi:5are,prisci:3re,nocchi:6are,glisci:3re,rpelli:5are,vecchi:6are,vischi:6are,amenti:5are,limoni:5are,iucchi:6are,scheri:5are,dicchi:6are,opponi:4rre,sservi:5are,ossidi:5are,eservi:5are,resumi:5ere,upponi:4rre,opelli:5ere,opendi:5ere,oteggi:5ere,nicchi:6are,epelli:5ere,esetti:5are,iesumi:5are,ileggi:5ere,morchi:6are,pingui:5are,ollevi:5are,sborri:5are,schivi:5are,perchi:6are,seduci:4rre,necchi:6are,opisci:3re,spendi:5ere,verchi:6are,spazzi:5are,apazzi:5are,plisci:3re,ccheri:5are,capponi:6are,ccerchi:7are,affondi:6are,ciacchi:7are,cchieri:6are,ongiuri:6are,rapponi:5rre,orreggi:6ere,iffondi:6ere,dipendi:6ere,rmicchi:7are,effondi:6ere,espelli:6ere,tapponi:5rre,etrisci:4re,utrisci:4re,ltrisci:4re,nzecchi:7are,ieleggi:6ere,specchi:7are,osicchi:7are,schieri:6are,utacchi:7are,asfondi:6ere,faccendi:7are,iaccendi:7ere,pravvivi:7ere,ppresenti:8are,ipresenti:8are,sprofondi:8are,",
      "third": "ire:e,rre:ne,are:à,rsi:,iare:2,nare:2,lare:2,fare:2,sare:2,rare:2,zare:2,urre:1ce,uare:2,dere:2,gare:2,pare:2,mare:2,iere:2,rere:2,cere:2,sire:2sce,bare:2,gere:2,vare:2,eare:2,fire:2sce,hire:2sce,mere:2,arre:1e,zire:2sce,uere:2,lere:2,oire:2sce,eire:2sce,enire:iene,enere:iene,icare:uca,otere:uò,acare:3,rcare:3,ttare:3,ccare:3,ndare:3,onire:3sce,unire:3sce,olire:3sce,utire:3sce,itare:3,anire:3sce,ecare:3,ntare:3,rtare:3,etare:3,atare:3,odare:3,rdare:3,udire:3sce,ddire:3ce,lcire:3sce,erire:3sce,scare:3,adire:3sce,ncare:3,luire:3sce,ocare:3,agire:3sce,utare:3,mbire:3sce,ttire:3sce,ilire:3sce,otare:3,nuire:3sce,edare:3,inire:3sce,ltare:3,ivere:3,stere:3,lvere:3,buire:3sce,ulire:3sce,avere:1,adare:3,ucare:3,lcare:3,apire:3sce,ptare:3,rpire:3sce,rnere:3,cuire:3sce,udare:3,lpire:3sce,atire:3sce,etere:3,epire:3sce,upire:3sce,mpere:3,tuire:3sce,ruire:3sce,odire:3sce,utere:3,mpire:3e,urire:3sce,rcire:3sce,ibire:3sce,rvere:3,rnire:3sce,ddare:3,emire:3sce,gnire:3sce,evere:3,trire:3sce,grire:3sce,mbere:3,ocire:3sce,bbire:3sce,glire:3sce,quire:3sce,etire:3sce,anere:3,ldare:3,apere:1,ncire:3sce,ltire:3sce,opire:3sce,ubire:3sce,plire:3sce,rtere:3,uscire:esce,essere:è,bicare:4,attere:4,ellire:4sce,dicare:4,ortire:4sce,astare:4,ostare:4,ticare:4,fidare:4,micare:4,ustare:4,ricare:4,bidire:4sce,ficare:4,nidare:4,antire:4sce,cicare:4,licare:4,ondire:4sce,rguire:4sce,picare:4,estare:4,ostire:4sce,andire:4sce,zicare:4,nedire:4ce,didare:4,iarire:4sce,lorire:4sce,lidare:4,nstare:4,sicare:4,bedire:4sce,ordire:4sce,allire:4sce,vorire:4sce,iorire:4sce,ottere:4,arrire:4sce,ermire:4sce,uarire:4sce,uidare:4,astire:4sce,ialire:4sce,lidire:4sce,pedire:4sce,cidire:4sce,sprire:4sce,indire:4ce,tidire:4sce,porire:4sce,pidire:4sce,midire:4sce,morire:4sce,ontire:4sce,bidare:4,istire:4sce,gidire:4sce,ustire:4sce,pidare:4,lenire:4sce,ledire:4ce,sidare:4,torire:4sce,vidire:4sce,vicare:4,gorire:4sce,cidare:4,mettere:ette,uistare:5,gredire:5sce,lestire:5sce,mollire:5sce,nettere:5,vistare:5,unicare:5,distare:5,lettere:5,rnicare:5,gestire:5sce,gridare:5,tridire:5sce,aridire:5sce,rridire:5sce,terdire:5ce,listare:5,muggire:5sce,predire:5ce,verdire:5sce,ruggire:5sce,mistare:5,ientire:5sce,tessere:5,asalire:5sce,mmettere:6,omettere:6,imettere:6,emettere:6,mpartire:6sce,rmettere:6,tristare:6,smentire:6sce,spartire:6sce,amettere:6,ismettere:7,itrasmettere:10,==adire:3sce,agire:3sce,assorbire:7sce,avere:1,bere:2ve,dire:2ce,distare:5,emettere:6,fidare:4,gestire:5sce,gridare:5,indire:4ce,lenire:4sce,listare:5,mettere:5,muggire:5sce,omettere:6,ordire:4sce,ostare:4,predire:5ce,ridire:4ce,ruggire:5sce,smentire:6sce,smettere:6,sorbire:5sce,sparire:5sce,spartire:6sce,stare:3,enere:3,tessere:5,trasmettere:9,unire:3sce,vistare:5,essere:è==pre:2ire,rme:2ire,ore:2ire,fre:2ire,sale:3ire,egue:3ire,cuce:3ire,arte:3ire,este:3ire,nuca:1icare,borre:4ire,resce:5re,viene:1enire,ppare:4ire,bolle:4ire,mpare:4ire,fugge:4ire,angue:4ire,serve:4ire,vverte:5ire,nverte:5ire,ispare:5ire,iverte:5ire,rverte:5ire,aspare:5ire,",
      "firstPlural": "re:mo,are:iamo,ere:iamo,rre:niamo,lere:gliamo,vere:bbiamo,rere:iamo,tere:ssiamo,ersi:iamo,sere:iamo,iare:2mo,lire:2amo,nire:2amo,tire:2amo,urre:1ciamo,rire:2amo,iere:1amo,sire:2amo,cire:2amo,uire:2amo,gire:2amo,bire:2amo,fire:2amo,hire:2amo,arre:1iamo,zire:2amo,pire:2amo,mire:2amo,oire:2amo,eire:2amo,vire:2amo,acare:2hiamo,icare:2hiamo,rcare:2hiamo,ccare:2hiamo,ogare:2hiamo,ecare:2hiamo,rrere:2iamo,udire:3amo,ddire:3ciamo,scare:2hiamo,adire:3amo,ocare:2hiamo,egare:2hiamo,agare:2hiamo,rgare:2hiamo,ugare:2hiamo,ivere:2iamo,stere:2iamo,lvere:2iamo,igare:2hiamo,ucare:2hiamo,lcare:2hiamo,erere:2iamo,etere:2iamo,odire:3amo,utere:2iamo,lgare:2hiamo,alere:2iamo,llere:2iamo,rvere:2iamo,evere:2iamo,acere:2ciamo,apere:2piamo,rtere:2iamo,attere:3iamo,ancare:3hiamo,bidire:4amo,ondire:4amo,ingare:3hiamo,andire:4amo,nedire:4ciamo,bedire:4amo,encare:3hiamo,ordire:4amo,ottere:3iamo,lidire:4amo,pedire:4amo,cidire:4amo,indire:4ciamo,angare:3hiamo,tidire:4amo,pidire:4amo,midire:4amo,gidire:4amo,ledire:4ciamo,vidire:4amo,essere:3iamo,incare:3hiamo,mettere:ettiamo,gredire:5amo,nettere:4iamo,lettere:4iamo,tridire:5amo,aridire:5amo,rridire:5amo,terdire:5ciamo,predire:5ciamo,verdire:5amo,sparere:4iamo,mmettere:5iamo,omettere:5iamo,imettere:5iamo,emettere:5iamo,rmettere:5iamo,olungare:5hiamo,troncare:5hiamo,amettere:5iamo,ismettere:6iamo,itrasmettere:9iamo,==adire:3amo,bere:2viamo,dire:2ciamo,emettere:5iamo,indire:4ciamo,mettere:4iamo,omettere:5iamo,ordire:4amo,predire:5ciamo,ridire:4ciamo,smettere:5iamo,sparere:4iamo,trasmettere:8iamo,troncare:5hiamo,udire:3amo==baiamo:4re,itiamo:2are,usiamo:2are,amiamo:2are,iriamo:2are,lgiamo:2ere,leiamo:2are,neiamo:2are,lziamo:2are,eliamo:2are,noiamo:4re,otiamo:2are,oviamo:2are,vviamo:4re,aciamo:4re,beiamo:2are,rliamo:2are,lmiamo:2are,ptiamo:2are,criamo:2are,reiamo:2are,afiamo:2are,iziamo:4re,egiamo:4re,ogiamo:4re,smiamo:2are,lsiamo:2are,ofiamo:2are,ddiamo:2are,deiamo:2are,duiamo:2are,ugiamo:4re,obiamo:2are,uaiamo:4re,driamo:2are,nviamo:4re,vriamo:2are,seiamo:2are,oziamo:4re,paiamo:2rere,ldiamo:2are,tmiamo:2are,aziamo:4re,ifiamo:2are,uoiamo:4re,abiamo:2are,ufiamo:2are,sviamo:4re,ciniamo:3are,agliamo:5re,doniamo:3are,igliamo:5re,biniamo:3are,ogniamo:3are,toniamo:3are,ozziamo:3are,reviamo:5re,onziamo:3are,erriamo:3are,issiamo:3are,miniamo:3are,ampiamo:3are,ezziamo:3are,occiamo:5re,cediamo:3ere,hetiamo:3are,iatiamo:3are,modiamo:3are,agniamo:3are,muliamo:3are,striamo:3are,ergiamo:3ere,mbriamo:3are,doriamo:3are,duliamo:3are,teriamo:3are,duniamo:3are,anniamo:3are,ibbiamo:5re,fidiamo:3are,iggiamo:3ere,tiviamo:3are,untiamo:3are,meriamo:3are,uppiamo:3are,guriamo:3are,uzziamo:3are,iutiamo:3are,beriamo:3are,ieniamo:3are,oggiamo:5re,taniamo:3are,ludiamo:3ere,luniamo:3are,ainiamo:3are,maliamo:5re,mariamo:3are,metiamo:3are,putiamo:3are,coriamo:3are,nimiamo:3are,nidiamo:3are,nodiamo:3are,ulliamo:3are,unciamo:5re,ianiamo:3are,simiamo:3are,puriamo:3are,itriamo:3are,armiamo:3are,icciamo:5re,coliamo:3are,goliamo:3are,aggiamo:5re,siniamo:3are,egniamo:3are,mbliamo:3are,iepiamo:3are,illiamo:3are,sociamo:5re,sodiamo:3are,ommiamo:3are,urgiamo:3ere,ingiamo:3ere,enuiamo:3are,ersiamo:3are,tutiamo:4re,ultiamo:3are,variamo:5re,viniamo:3are,visiamo:3are,zeriamo:3are,bariamo:3are,effiamo:3are,ficiamo:5re,emmiamo:5re,loniamo:3are,bigiamo:5re,ruciamo:5re,liniamo:3are,ussiamo:3are,cadiamo:3ere,caliamo:3are,alciamo:5re,unniamo:5re,didiamo:3are,caviamo:3are,ceniamo:3are,ntriamo:3are,ceriamo:3are,tiniamo:3are,iaviamo:3are,iediamo:3ere,hiniamo:3are,iodiamo:3are,iudiamo:3ere,cibiamo:3are,ifriamo:3are,cimiamo:3are,intiamo:3are,ucciamo:5re,guliamo:3are,boriamo:3are,mediamo:5re,mutiamo:3are,piliamo:3are,letiamo:3are,mpriamo:3are,buliamo:3are,futiamo:3are,gediamo:3are,tuliamo:3are,coniamo:5re,soliamo:3are,nstiamo:3are,tatiamo:3are,tagiamo:5re,rariamo:5re,diniamo:3are,roniamo:3are,ompiamo:3ere,cosiamo:3are,argiamo:3ere,tipiamo:3are,tumiamo:3are,repiamo:3are,cuciamo:4re,urviamo:3are,nquiamo:3ere,nudiamo:3are,rubiamo:3are,desiamo:5re,deviamo:5re,meniamo:3are,paniamo:3are,rigiamo:3ere,noriamo:3are,posiamo:3are,sipiamo:3are,urbiamo:3are,domiamo:3are,dopiamo:3are,dosiamo:3are,reniamo:3are,bbliamo:3are,figiamo:5re,culiamo:3are,ubriamo:3are,comiamo:5re,ibriamo:3are,erbiamo:3are,sigiamo:3ere,lariamo:3are,siliamo:5re,irpiamo:3are,acuiamo:3are,vadiamo:3ere,irmiamo:3are,irtiamo:3are,foriamo:3are,fumiamo:3are,arbiamo:3are,gemiamo:3ere,godiamo:3ere,uatiamo:3are,uidiamo:3are,ratiamo:3are,ialiamo:4re,urriamo:3are,ziniamo:3are,taliamo:3are,paliamo:3are,enniamo:3are,soniamo:3are,tuniamo:3are,naliamo:3are,ipriamo:5re,niciamo:5re,cubiamo:3are,ammiamo:3are,ugliamo:5re,uiniamo:3are,arsiamo:5re,tasiamo:3are,egriamo:3are,timiamo:3are,poliamo:3are,ecciamo:5re,foliamo:3are,vasiamo:3are,roriamo:3are,laviamo:3are,lediamo:3ere,libiamo:3are,liciamo:3ere,limiamo:3are,isciamo:5re,lodiamo:3are,nomiamo:3are,mimiamo:3are,suriamo:3are,mudiamo:3are,muriamo:3are,utuiamo:3are,natiamo:3are,obliamo:5re,piniamo:3are,equiamo:5re,geniamo:3are,undiamo:3ere,lesiamo:3are,alpiamo:3are,rasiamo:3are,goniamo:3are,squiamo:3are,daliamo:3are,peniamo:3are,zoliamo:3are,etuiamo:3are,pesiamo:3are,pigiamo:5re,pipiamo:3are,lagiamo:5re,faniamo:3are,luliamo:3are,bbuiamo:5re,aspiamo:3are,digiamo:3ere,galiamo:3are,orsiamo:3are,casiamo:3are,uoriamo:3are,pudiamo:5re,saniamo:3are,cquiamo:3are,uoniamo:3are,foniamo:3are,gomiamo:3are,liviamo:3are,alviamo:3are,baviamo:3are,irciamo:5re,cemiamo:3are,hediamo:3are,erziamo:3are,ippiamo:3are,iupiamo:3are,ganiamo:3are,draiamo:5re,elciamo:5re,fociamo:5re,iffiamo:3are,offiamo:5re,pumiamo:3are,orpiamo:5re,ripiamo:3are,tudiamo:5re,upriamo:3are,sudiamo:3are,uoliamo:3are,tediamo:5re,tesiamo:3are,tubiamo:3are,rupiamo:3are,butiamo:3are,urtiamo:3are,urpiamo:3are,getiamo:3are,engiamo:5re,giliamo:3are,vociamo:5re,balliamo:4are,ruffiamo:4are,bassiamo:4are,everiamo:4are,ndoliamo:4are,bittiamo:4are,nacciamo:6re,bondiamo:4are,racciamo:6re,brutiamo:5re,bituiamo:4are,biuriamo:4are,bortiamo:5re,bradiamo:4ere,parriamo:4are,casciamo:6re,tastiamo:4are,valliamo:4are,eleriamo:4are,centiamo:4are,certiamo:4are,cettiamo:4are,iappiamo:4are,iuffiamo:4are,cogliamo:5ere,colliamo:4are,telliamo:4are,omuniamo:4are,conciamo:6re,tentiamo:4are,coppiamo:6re,corciamo:6re,cordiamo:4are,costiamo:4are,resciamo:4ere,lturiamo:4are,uietiamo:4are,uistiamo:4are,dattiamo:4are,densiamo:4are,dentiamo:4are,zioniamo:4are,dobbiamo:4are,dossiamo:4are,deguiamo:4are,aderiamo:5re,operiamo:4are,dopriamo:4are,dorniamo:4are,dottiamo:4are,facciamo:6re,fermiamo:4are,fettiamo:4are,ffiniamo:4are,losciamo:6re,folliamo:4are,rangiamo:4ere,rontiamo:4are,ganciamo:6re,hindiamo:4are,iorniamo:4are,iungiamo:4ere,iustiamo:4are,graviamo:4are,uantiamo:4are,nizziamo:4are,aizziamo:4are,beggiamo:6re,lacciamo:6re,lattiamo:4are,ggeriamo:5re,lleniamo:4are,lentiamo:4are,lertiamo:4are,lietiamo:4are,lungiamo:4are,aleniamo:4are,terniamo:4are,basciamo:6re,mantiamo:4are,massiamo:4are,mazziamo:4are,derniamo:4are,mogliamo:6re,montiamo:4are,morbiamo:4are,nistiamo:6re,ampliamo:6re,lizziamo:4are,heggiamo:6re,nelliamo:4are,naffiamo:6re,nebbiamo:6re,nneriamo:5re,uvoliamo:4are,eponiamo:3rre,icipiamo:4are,rteniamo:4ere,sioniamo:4are,iattiamo:5re,ioppiamo:4are,portiamo:4are,postiamo:4are,rendiamo:4ere,prodiamo:4are,ropriamo:6re,gioniamo:4are,rginiamo:4are,ieggiamo:6re,meggiamo:6re,rabbiamo:6re,rrediamo:4are,restiamo:4are,rriviamo:4are,tondiamo:4are,velliamo:4are,coltiamo:4are,faltiamo:4are,ssaliamo:5re,saltiamo:4are,ssediamo:6re,sseriamo:5re,sestiamo:4are,icuriamo:4are,imiliamo:4are,gettiamo:4are,ssumiamo:4ere,steniamo:4ere,tendiamo:4ere,tteniamo:4ere,testiamo:4are,torciamo:4ere,vanziamo:4are,eleniamo:4are,ventiamo:4are,nturiamo:4are,vveriamo:4are,vinciamo:4ere,vistiamo:4are,zardiamo:4are,zuffiamo:4are,bettiamo:4are,bardiamo:4are,bendiamo:4are,berciamo:6re,lanciamo:6re,lindiamo:4are,cottiamo:4are,bordiamo:4are,seggiamo:6re,braviamo:4are,rindiamo:4are,ntoliamo:4are,buffiamo:4are,buttiamo:4are,cacciamo:6re,pestiamo:4are,cambiamo:6re,peggiamo:6re,pioniamo:4are,celliamo:4are,cangiamo:6re,cantiamo:4are,neggiamo:6re,cassiamo:4are,tturiamo:4are,cazziamo:4are,zeggiamo:6re,lebriamo:4are,cerniamo:4ere,selliamo:4are,cessiamo:4are,hiosiamo:4are,uettiamo:4are,ncidiamo:4ere,langiamo:4ere,nosciamo:4ere,lassiamo:4are,mandiamo:4are,minciamo:6re,emoriamo:4are,mendiamo:4are,iseriamo:4are,pattiamo:4are,pensiamo:4are,iangiamo:4ere,mponiamo:3rre,primiamo:4ere,pungiamo:4ere,nciliamo:6re,cretiamo:4are,nferiamo:5re,fessiamo:4are,formiamo:4are,fortiamo:4are,ideriamo:4are,olidiamo:4are,nsumiamo:4are,contiamo:4are,tattiamo:4are,empliamo:4are,nteniamo:4ere,tinuiamo:4are,rastiamo:4are,rattiamo:4are,rolliamo:4are,nvoliamo:4are,opuliamo:4are,pondiamo:4ere,rrodiamo:4ere,apuliamo:4are,crediamo:4ere,cremiamo:4are,danziamo:4are,deggiamo:6re,ecidiamo:4ere,eferiamo:5re,fungiamo:4ere,glutiamo:5re,eperiamo:5re,ploriamo:4are,prediamo:4are,erapiamo:4are,eridiamo:4ere,destiamo:4are,eteniamo:4ere,dettiamo:4are,vastiamo:4are,fendiamo:4ere,fferiamo:5re,igeriamo:5re,giuniamo:4are,rigniamo:4are,ilaniamo:6re,leguiamo:4are,iligiamo:4ere,iponiamo:3rre,irediamo:4are,irimiamo:4ere,rottiamo:4are,iogliamo:5ere,erediamo:4are,sertiamo:4are,ressiamo:4are,perdiamo:4ere,sponiamo:3rre,suadiamo:4ere,tanziamo:6re,distiamo:4are,togliamo:5ere,vietiamo:4are,ivoriamo:4are,vorziamo:6re,doppiamo:6re,uelliamo:4are,ettuiamo:4are,mizziamo:4are,eleviamo:4are,elidiamo:4ere,emaniamo:4are,migriamo:4are,ipariamo:4are,erodiamo:4ere,ageriamo:4are,esaliamo:4are,utoriamo:4are,oneriamo:4are,cizziamo:4are,pandiamo:4ere,patriamo:6re,pugniamo:4are,traniamo:6re,trudiamo:4ere,hettiamo:4are,fasciamo:6re,iltriamo:4are,nanziamo:6re,gelliamo:4are,lottiamo:4are,uttuiamo:4are,oderiamo:4are,lgoriamo:4are,forgiamo:6re,forziamo:4are,ocopiamo:6re,torniamo:4are,fremiamo:4ere,uentiamo:4are,rettiamo:4are,frodiamo:4are,rustiamo:4are,uciliamo:4are,nestiamo:4are,galliamo:4are,loppiamo:4are,garriamo:5re,gessiamo:4are,gestiamo:5re,higniamo:4are,ubiliamo:4are,lebbiamo:4are,gloriamo:6re,gonfiamo:6re,verniamo:4are,gridiamo:4are,guadiamo:4are,uardiamo:4are,uastiamo:4are,berniamo:4are,latriamo:4are,razziamo:4are,zarriamo:5re,rogliamo:6re,aginiamo:4are,mmoliamo:4are,pacciamo:6re,rentiamo:4are,pastiamo:4are,sieriamo:5re,mperiamo:4are,iantiamo:4are,anutiamo:5re,carniamo:4are,cartiamo:4are,ateniamo:4are,ceppiamo:4are,combiamo:4ere,rporiamo:4are,respiamo:4are,criniamo:4are,crociamo:6re,digniamo:4are,nebriamo:6re,ariniamo:4are,fatuiamo:4are,rvoriamo:4are,festiamo:4are,nfiliamo:4are,uenziamo:4are,adiciamo:6re,nfuriamo:6re,ngeriamo:5re,graniamo:4are,rassiamo:4are,roppiamo:4are,iettiamo:4are,amoriamo:4are,nondiamo:4are,gogliamo:5re,aponiamo:4are,nsediamo:6re,nseriamo:5re,nsidiamo:6re,sinuiamo:4are,sorgiamo:4ere,talliamo:4are,tauriamo:4are,udiciamo:6re,avoliamo:4are,rponiamo:3rre,pretiamo:4are,itoliamo:4are,alidiamo:4are,ntariamo:6re,vestiamo:5re,nvidiamo:6re,voltiamo:4are,rradiamo:6re,rretiamo:5re,bustiamo:5re,pessiamo:5re,crimiamo:4are,apidiamo:4are,lasciamo:6re,lessiamo:4are,cenziamo:6re,linciamo:6re,listiamo:4are,ogoriamo:4are,gioriamo:4are,ligniamo:4are,mangiamo:6re,uteniamo:4ere,mesciamo:4ere,mestiamo:4are,dizziamo:4are,lioriamo:4are,lantiamo:4are,sturiamo:4are,delliamo:4are,mondiamo:4are,mordiamo:4ere,rmoriamo:4are,mungiamo:4ere,utiliamo:4are,narriamo:4are,nasciamo:4ere,gligiamo:4ere,ccidiamo:4ere,ccupiamo:4are,eizziamo:4are,iginiamo:4are,oriniamo:4are,pappiamo:4are,arodiamo:6re,ecipiamo:4are,pasciamo:4ere,rduriamo:4are,griniamo:4are,rmaniamo:4ere,nottiamo:4are,petriamo:4are,iombiamo:4are,oettiamo:4are,pittiamo:4are,planiamo:4are,nderiamo:4are,poppiamo:4are,porgiamo:4ere,tenziamo:6re,ranziamo:4are,premiamo:4ere,epariamo:4are,cegliamo:5ere,senziamo:6re,priviamo:4are,ocuriamo:4are,oferiamo:5re,ofiliamo:4are,oponiamo:3rre,prudiamo:4ere,imoliamo:4are,relliamo:4are,uperiamo:4are,edimiamo:4ere,uneriamo:4are,cindiamo:4ere,iardiamo:4ere,baltiamo:4are,cattiamo:4are,icopiamo:6re,ifiliamo:4are,ileviamo:4are,imaniamo:4ere,bombiamo:4are,iazziamo:4are,pinziamo:4are,ncariamo:4are,tombiamo:4are,isaliamo:5re,lendiamo:4ere,lveriamo:4are,storiamo:4are,vegliamo:6re,tardiamo:4are,iteniamo:4ere,alutiamo:4are,vendiamo:4ere,iveriamo:5re,ivoliamo:4are,rombiamo:4are,ronciamo:4are,ronfiamo:4are,otoliamo:4are,vesciamo:6re,aettiamo:4are,iaffiamo:4are,barriamo:4are,borniamo:6re,braniamo:4are,briniamo:4are,odoliamo:4are,cansiamo:4are,scapiamo:4are,cappiamo:4are,feggiamo:6re,hizziamo:4are,scipiamo:4are,nfiniamo:4are,uassiamo:4are,scopiamo:4are,corgiamo:4ere,cortiamo:4are,rosciamo:6re,crutiamo:4are,seppiamo:6re,sessiamo:4are,tacciamo:6re,sfiliamo:4are,fogliamo:6re,aioliamo:4are,uazziamo:4are,gusciamo:6re,ibiliamo:4are,stemiamo:4are,situiamo:4are,littiamo:4are,smaniamo:6re,marriamo:5re,mistiamo:4are,nobbiamo:4are,sondiamo:4are,pperiamo:5re,rvoliamo:4are,tostiamo:4are,pogliamo:6re,uarciamo:6re,uartiamo:4are,tappiamo:4are,nazziamo:4are,stiliamo:4are,ipuliamo:4are,toppiamo:4are,rappiamo:4are,ofiniamo:4are,rusciamo:6re,icidiamo:4are,aligiamo:6re,vigniamo:4are,svoliamo:4are,lazziamo:4are,tangiamo:4ere,tassiamo:4are,rturiamo:4are,tossiamo:5re,asaliamo:5re,sferiamo:5re,traviamo:6re,rebbiamo:6re,tremiamo:4are,iboliamo:4are,ionfiamo:4are,ituriamo:4are,bizziamo:4are,ttoliamo:4are,ucidiamo:4are,tuffiamo:4are,umiliamo:6re,uriniamo:4are,vantiamo:4are,vessiamo:4are,idimiamo:4are,violiamo:4are,zappiamo:4are,bacchiamo:7re,bbelliamo:6re,aborriamo:6re,alappiamo:7re,scendiamo:5ere,utizziamo:5are,doloriamo:5are,docchiamo:7re,ffittiamo:5are,gevoliamo:5are,hiacciamo:7re,aleggiamo:7re,etizziamo:5are,imentiamo:5are,llappiamo:5are,llestiamo:6re,llettiamo:5are,areggiamo:7re,bientiamo:5are,anettiamo:5are,mmattiamo:6re,mmolliamo:6re,mucchiamo:7re,oreggiamo:7re,ngustiamo:7re,nientiamo:5are,noveriamo:5are,recchiamo:7re,ppartiamo:5are,ppassiamo:6re,ppendiamo:5ere,ofittiamo:5are,rchiviamo:7re,omentiamo:5are,atizziamo:5are,rraffiamo:5are,ricchiamo:6re,arridiamo:5ere,rischiamo:7re,scondiamo:5ere,econdiamo:5are,assidiamo:5ere,ssordiamo:5are,ssortiamo:6re,tecchiamo:6re,tteggiamo:7re,ttizziamo:5are,umentiamo:5are,orizziamo:5are,vvertiamo:6re,vinghiamo:7re,vicchiamo:7re,fonchiamo:7re,rbottiamo:5are,adenziamo:5are,amuffiamo:5are,ticchiamo:7re,arizziamo:5are,erizziamo:5are,trizziamo:5are,cischiamo:7re,rcondiamo:5are,llaudiamo:5are,ollidiamo:5ere,mmentiamo:5are,nfondiamo:5ere,nserviamo:5are,nteggiamo:7re,tinguiamo:5ere,nvertiamo:6re,rbelliamo:5are,rteggiamo:7re,steggiamo:7re,ebelliamo:5are,generiamo:5are,egustiamo:5are,esigniamo:5are,treggiamo:7re,desumiamo:5ere,ilettiamo:5are,dimoriamo:5are,ipartiamo:6re,rientiamo:5are,ispariamo:6re,isperiamo:5are,sanguiamo:5are,truggiamo:5ere,ivertiamo:6re,dividiamo:5ere,drizziamo:5are,ancipiamo:5are,eruttiamo:5are,asperiamo:5are,esortiamo:5are,esperiamo:6re,vaporiamo:5are,idenziamo:7re,rmentiamo:5are,fruttiamo:5are,lleggiamo:7re,goffriamo:5are,graffiamo:7re,mbastiamo:6re,mbottiamo:6re,impariamo:5are,mpartiamo:6re,ementiamo:5are,poveriamo:6re,ceneriamo:6re,ppettiamo:5are,nocchiamo:7re,nforniamo:5are,ngabbiamo:7re,hiottiamo:6re,gialliamo:6re,ngobbiamo:6re,grossiamo:5are,noltriamo:5are,teneriamo:6re,rpelliamo:5are,ntridiamo:5ere,vecchiamo:7re,vischiamo:7re,nvogliamo:7re,otizziamo:5are,irridiamo:5ere,amentiamo:5are,lavoriamo:5are,giferiamo:5are,limoniamo:5are,iucchiamo:7re,scheriamo:5are,maturiamo:5are,mischiamo:7re,olestiamo:5are,dicchiamo:7re,nicchiamo:7re,oleggiamo:7re,epassiamo:5are,breggiamo:7re,opponiamo:4rre,sserviamo:5are,ossidiamo:5are,rvertiamo:6re,pialliamo:5are,eserviamo:5are,resumiamo:5ere,upponiamo:4rre,incipiamo:7re,opendiamo:5ere,osperiamo:5are,oteggiamo:5ere,raschiamo:7re,esettiamo:5are,ibelliamo:5are,ibolliamo:6re,iesumiamo:5are,riferiamo:6re,ileggiamo:5ere,morchiamo:7re,pinguiamo:5are,roveriamo:5are,ipassiamo:5are,olleviamo:5are,saturiamo:5are,sbandiamo:5are,sborriamo:5are,sbottiamo:5are,elleriamo:5are,avizziamo:5are,schiviamo:5are,miottiamo:5are,perchiamo:7re,fiduciamo:7re,sforniamo:5are,sgobbiamo:5are,bbolliamo:6re,necchiamo:7re,rpassiamo:5are,spendiamo:5ere,verchiamo:7re,spartiamo:6re,spassiamo:5are,spazziamo:5are,oloquiamo:7re,rabiliamo:7re,apazziamo:5are,stridiamo:5ere,succhiamo:7re,ussidiamo:7re,timoniamo:7re,apassiamo:5are,ascuriamo:5are,aspariamo:6re,remoliamo:5are,repidiamo:5are,scioliamo:5are,veneriamo:5are,lteggiamo:7re,mpettiamo:5are,ccheriamo:5are,capponiamo:6are,ccerchiamo:8re,affondiamo:6are,appelliamo:6are,aspettiamo:6are,ssaporiamo:6are,ciacchiamo:8re,cchieriamo:6are,ongiuriamo:6are,rapponiamo:5rre,oppelliamo:6are,orreggiamo:6ere,crocchiamo:8re,ichiariamo:6are,iffondiamo:6ere,dipendiamo:6ere,iscolpiamo:6are,eppelliamo:7re,rmicchiamo:8re,effondiamo:6ere,tapponiamo:5rre,erreggiamo:8re,colleriamo:7re,dirizziamo:6are,ingiuriamo:8re,ntristiamo:7re,nzecchiamo:8re,ttristiamo:6are,ieleggiamo:6ere,specchiamo:8re,osicchiamo:8re,schieriamo:6are,uccioliamo:6are,occioliamo:6are,granchiamo:7re,sorridiamo:6ere,utacchiamo:8re,tipendiamo:8re,tolleriamo:6are,asfondiamo:6ere,veleggiamo:8re,ventiliamo:6are,faccendiamo:7are,dispettiamo:8re,nfiacchiamo:8re,rospettiamo:7are,iaccendiamo:7ere,ischiariamo:7are,rispettiamo:7are,zimbelliamo:7are,mpratichiamo:9re,nsospettiamo:9re,ppresentiamo:8are,ipresentiamo:8are,scoglioniamo:8are,sprofondiamo:8are,",
      "secondPlural": "re:te,rre:nete,rsi:te,urre:1cete,arre:1ete,ssere:te,mettere:ettete,tessere:5te,mmettere:6te,omettere:6te,imettere:6te,emettere:6te,rmettere:6te,amettere:6te,ismettere:7te,itrasmettere:10te,==bere:2vete,emettere:6te,omettere:6te,smettere:6te,tessere:5te,trasmettere:9te==ate:1re,ite:1re,dete:2re,iete:2re,rete:2re,gete:2re,mete:2re,uete:2re,pete:2re,lete:2re,bete:2re,scete:3re,enete:3re,ivete:3re,stete:3re,lvete:3re,rcete:3re,avete:3re,ncete:3re,icete:3re,rnete:3re,etete:3re,utete:3re,rvete:3re,anete:3re,acete:3re,otete:3re,rtete:3re,attete:4re,ottete:4re,cevete:4re,nettete:5re,lettete:5re,mbevete:5re,",
      "thirdPlural": "re:no,ere:ono,ire:ono,rre:ngono,rire:iono,rere:iono,pere:nno,lere:gliono,vere:nno,tere:ssono,ersi:ono,sere:ono,urre:1cono,sire:2scono,fire:2scono,hire:2scono,arre:1ggono,zire:2scono,oire:2scono,eire:2scono,icare:ucano,orire:uoiono,onire:3scono,unire:3scono,olire:3scono,utire:3scono,anire:3scono,rrere:2ono,udire:3scono,ddire:3cono,lcire:3scono,erire:3scono,adire:3scono,luire:3scono,agire:3scono,mbire:3scono,ttire:3scono,ilire:3scono,nuire:3scono,enere:2gono,inire:3scono,ivere:2ono,stere:2ono,lvere:2ono,buire:3scono,ulire:3scono,apire:3scono,rpire:3scono,erere:2ono,cuire:3scono,lpire:3scono,atire:3scono,etere:2ono,epire:3scono,upire:3scono,mpere:2ono,tuire:3scono,ruire:3scono,ucire:3ono,odire:3scono,utere:2ono,mpire:3ono,alere:2gono,urire:3scono,rcire:3scono,ibire:3scono,llere:2ono,rvere:2ono,rnire:3scono,emire:3scono,gnire:3scono,evere:2ono,trire:3scono,grire:3scono,ocire:3scono,bbire:3scono,glire:3scono,quire:3scono,etire:3scono,frire:2ono,anere:2gono,acere:2ciono,ncire:3scono,ltire:3scono,opire:3scono,ubire:3scono,plire:3scono,rtere:2ono,gliere:lgono,uscire:escono,bicare:4no,attere:3ono,ellire:4scono,dicare:4no,orrire:3ono,ortire:4scono,venire:3gono,ticare:4no,micare:4no,ricare:4no,bidire:4scono,ficare:4no,antire:4scono,cicare:4no,licare:4no,ondire:4scono,aprire:3ono,rguire:4scono,picare:4no,ostire:4scono,andire:4scono,zicare:4no,nedire:4cono,iarire:4scono,lorire:4scono,oprire:3ono,sicare:4no,bedire:4scono,ordire:4scono,allire:4scono,vorire:4scono,iorire:4scono,ottere:3ono,arrire:4scono,ermire:4scono,uarire:4scono,astire:4scono,ialire:4scono,lidire:4scono,pedire:4scono,cidire:4scono,sprire:4scono,indire:4cono,tidire:4scono,porire:4scono,pidire:4scono,midire:4scono,ontire:4scono,istire:4scono,gidire:4scono,ustire:4scono,lenire:4scono,ledire:4cono,torire:4scono,vidire:4scono,vicare:4no,gorire:4scono,essere:3ono,mettere:ettono,gredire:5scono,lestire:5scono,mollire:5scono,nettere:4ono,ssalire:4gono,unicare:5no,lettere:4ono,rnicare:5no,gestire:5scono,tridire:5scono,aridire:5scono,rridire:5scono,terdire:5cono,imorire:5scono,muggire:5scono,predire:5cono,verdire:5scono,isalire:4gono,ruggire:5scono,tostare:5nno,ientire:5scono,asalire:5scono,mmettere:5ono,omettere:5ono,imettere:5ono,emettere:5ono,mpartire:6scono,rmettere:5ono,smentire:6scono,spartire:6scono,amettere:5ono,ismettere:6ono,itrasmettere:9ono,==adire:3scono,agire:3scono,aprire:3ono,assorbire:7scono,bere:2vono,dare:2nno,dire:2cono,emettere:5ono,gestire:5scono,indire:4cono,lenire:4scono,mettere:4ono,muggire:5scono,omettere:5ono,ordire:4scono,predire:5cono,ridare:4nno,ridire:4cono,ristare:5nno,ruggire:5scono,salire:3gono,smentire:6scono,smettere:5ono,sorbire:5scono,sparire:5scono,spartire:6scono,stare:3nno,trasmettere:8ono,unire:3scono,venire:3gono==dono:1ere,nono:1ere,ntono:2ire,rgono:2ere,umono:2ere,rcono:2ere,ncono:2ere,imono:2ere,quono:2ere,igono:2ere,rmono:2ire,emono:2ere,mbono:2ere,rbono:2ire,sanno:2pere,iggono:3ere,ungono:3ere,ingono:3ere,rucano:4re,bucano:4re,ducano:4re,oscono:3ere,eguono:3ire,eggono:3ere,artono:3ire,ulgono:3ere,estono:3ire,licono:3ere,ascono:3ere,corrono:4ere,rescono:4ere,rangono:4ere,ppaiono:3rire,volgono:4ere,bollono:4ire,langono:4ere,mpaiono:3rire,iangono:4ere,inguono:4ere,ruggono:4ere,fuggono:4ire,anguono:4ire,mescono:4ere,servono:4ire,tangono:4ere,vvertono:5ire,nvertono:5ire,ispaiono:4rire,ivertono:5ire,rvertono:5ire,aspaiono:4rire,"
    },
    "pastTense": {
      "first": "re:i,rre:si,ire:ni,are:eci,ere:ni,gere:si,dere:si,rere:si,vere:ssi,cere:si,mere:nsi,lere:si,tere:ssi,nere:si,care:2i,iare:2i,nare:2i,lare:2i,sare:2i,lire:2i,rare:2i,dare:2i,zare:2i,tire:2i,urre:1ssi,uare:2i,gare:2i,pare:2i,mare:2i,sire:2i,bare:2i,cire:2i,uire:2i,vare:2i,gire:2i,eare:2i,bire:2i,fire:2i,hire:2i,arre:1ssi,zire:2i,pire:2i,mire:2i,oire:2i,eire:2i,vire:2i,ndere:si,ggere:ssi,scere:bbi,imere:essi,igere:essi,guere:si,apere:eppi,ttere:ssi,gnere:nsi,ttare:3i,onire:3i,unire:3i,itare:3i,rrire:3i,anire:3i,ntare:3i,rtare:3i,etare:3i,atare:3i,udire:3i,ddire:3ssi,erire:3i,adire:3i,utare:3i,otare:3i,enere:2ni,inire:3i,ltare:3i,lvere:1si,ptare:3i,orire:3i,acere:2qui,odire:3i,ucere:1ssi,alere:2si,urire:3i,ofare:3i,rnire:3i,gnire:3i,trire:3i,grire:3i,prire:3i,ocere:2qui,nfare:3i,ufare:3i,ettere:isi,gliere:lsi,ondere:usi,ompere:uppi,ellere:ulsi,essere:fui,uffare:4i,astare:4i,ustare:4i,bidire:4i,ondire:4i,estare:4i,andire:4i,effare:4i,cadere:3di,iarire:4i,cedere:2ssi,nstare:4i,bedire:4i,dolere:3si,ordire:4i,uarire:4i,lidire:4i,pedire:4i,cidire:4i,indire:4ssi,tidire:4i,pidire:4i,midire:4i,gidire:4i,lenire:4i,ascere:1cqui,vidire:4i,digere:1assi,dimere:1ensi,indere:1ssi,hifare:4i,iffare:4i,solere:4i,tifare:4i,volere:3li,mettere:isi,ettersi:isi,costare:5i,uistare:5i,gredire:5i,pparire:4vi,postare:5i,rostare:5i,vistare:5i,mparire:4vi,pondere:2si,grafare:5i,distare:5i,vellere:3si,cellere:3si,lettere:2ssi,tridire:5i,aridire:5i,rridire:5i,terdire:5ssi,listare:5i,condere:2si,predire:5ssi,verdire:5i,iaffare:5i,mistare:5i,tostare:4etti,mmettere:2isi,rraffare:6i,omettere:2isi,imettere:2isi,isparire:5vi,emettere:2isi,rmettere:2isi,tristare:6i,amettere:2isi,asparire:5vi,ismettere:3isi,espandere:5si,itrasmettere:6isi,==adire:3i,ere:1bbi,cadere:3di,costare:5i,dire:2ssi,distare:5i,dolere:3si,emettere:2isi,espandere:5si,indire:4ssi,lenire:4i,listare:5i,ocere:2qui,omettere:2isi,ordire:4i,postare:5i,predire:5ssi,ridire:4ssi,ristare:4etti,smettere:2isi,solere:4i,spandere:6i,sparire:5i,stare:2etti,tifare:4i,trasmettere:5isi,udire:3i,unire:3i,vistare:5i,volere:3li,essere:fui==rasi:2dere,cesi:2ndere,ersi:2gere,lusi:2dere,pesi:2ndere,resi:2ndere,risi:2dere,ursi:2gere,tesi:2ndere,hesi:2rere,iusi:2dere,cisi:2dere,lisi:2dere,rosi:2dere,fesi:2ndere,uasi:2dere,visi:2dere,rusi:2dere,vasi:2dere,lesi:2dere,tusi:2ndere,masi:2nere,venni:3ire,lissi:2ggere,ransi:3gere,iunsi:3gere,eposi:3rre,pposi:3rre,ssisi:3dere,solsi:3vere,sunsi:2mere,rinsi:3gere,torsi:3cere,vinsi:3cere,cinsi:3gere,iansi:3gere,mposi:3rre,punsi:3gere,vissi:2vere,parsi:3gere,fissi:2ggere,funsi:3gere,pinsi:3gere,iposi:3rre,cussi:2tere,russi:2ggere,finsi:3gere,fulsi:3gere,dulsi:3gere,sorsi:3gere,rposi:3rre,minsi:3gere,molsi:3cere,morsi:3dere,munsi:3gere,porsi:3gere,oposi:3rre,tessi:2ggere,iarsi:3dere,asisi:2mettere,bdussi:3rre,ccorsi:4rere,ddussi:3rre,crissi:3vere,ttinsi:4gere,vvolsi:4gere,ovolsi:4gere,iacqui:3ere,pressi:2imere,ncorsi:4rere,ndussi:3rre,nvolsi:4gere,rressi:3ggere,ecorsi:4rere,elessi:3ggere,esposi:4rre,frissi:3ggere,rcorsi:4rere,ntinsi:4gere,odussi:3rre,glessi:2igere,osposi:4rre,scelsi:3gliere,icorsi:4rere,tacqui:3ere,avolsi:4gere,svolsi:4gere,adussi:3rre,asposi:4rre,istinsi:5guere,dedussi:4rre,dilessi:3igere,iscorsi:5rere,disposi:5rre,estinsi:5guere,estolsi:5lere,ichiesi:5dere,rilessi:4ggere,sedussi:4rre,ascorsi:5rere,",
      "second": "re:sti,rre:nesti,are:esti,rsi:sti,sere:ti,care:2sti,iare:2sti,nare:2sti,lare:2sti,sare:2sti,rare:2sti,dare:2sti,zare:2sti,urre:1cesti,uare:2sti,gare:2sti,pare:2sti,mare:2sti,bare:2sti,vare:2sti,eare:2sti,arre:1esti,ttare:3sti,itare:3sti,ntare:3sti,rtare:3sti,etare:3sti,atare:3sti,ddire:3cesti,utare:3sti,otare:3sti,ltare:3sti,efare:3cesti,ptare:3sti,sfare:3cesti,ofare:3sti,nfare:3sti,ufare:3sti,uffare:4sti,astare:4sti,ustare:4sti,estare:4sti,effare:4sti,nstare:4sti,indire:4cesti,rifare:4cesti,hifare:4sti,iffare:4sti,tifare:4sti,mettere:ettesti,costare:5sti,uistare:5sti,postare:5sti,rostare:5sti,vistare:5sti,grafare:5sti,distare:5sti,terdire:5cesti,listare:5sti,predire:5cesti,iaffare:5sti,mistare:5sti,trafare:5cesti,mmettere:6sti,rraffare:6sti,omettere:6sti,traffare:6cesti,imettere:6sti,emettere:6sti,rmettere:6sti,tristare:6sti,praffare:6cesti,amettere:6sti,ismettere:7sti,itrasmettere:10sti,==costare:5sti,dire:2cesti,distare:5sti,emettere:6sti,fare:2cesti,indire:4cesti,listare:5sti,omettere:6sti,postare:5sti,predire:5cesti,ridire:4cesti,rifare:4cesti,sfare:3cesti,smettere:6sti,tifare:4sti,trasmettere:9sti,vistare:5sti==isti:1re,desti:2re,iesti:2re,resti:2re,gesti:2re,vesti:2re,mesti:2re,uesti:2re,pesti:2re,lesti:2re,scesti:3re,enesti:3re,rcesti:3re,ncesti:3re,utesti:3re,lcesti:3re,ocesti:3re,anesti:3re,gnesti:3re,iacesti:4re,tacesti:4re,lettesti:5re,",
      "third": "re:sse,are:ò,ire:ì,rre:se,ere:ne,gere:se,dere:se,rere:se,vere:sse,cere:se,mere:nse,lere:se,tere:sse,nere:se,urre:1sse,arre:1sse,ndere:se,ggere:sse,scere:bbe,imere:esse,igere:esse,guere:se,ttere:sse,apere:eppe,gnere:nse,ddire:3sse,enere:2ne,lvere:1se,efare:2ece,acere:2que,sfare:2ece,ucere:1sse,alere:2se,ocere:2que,ettere:ise,gliere:lse,ondere:use,ompere:uppe,ellere:ulse,essere:fu,venire:3ne,cadere:3de,cedere:2sse,dolere:3se,indire:4sse,ascere:1cque,digere:1asse,dimere:1ense,indere:1sse,rifare:3ece,solere:4tte,volere:3le,mettere:ise,ettersi:ise,pparire:4ve,mparire:4ve,pondere:2se,vellere:3se,cellere:3se,lettere:2sse,terdire:5sse,condere:2se,predire:5sse,tostare:4ette,trafare:4ece,mmettere:2ise,omettere:2ise,traffare:5ece,imettere:2ise,isparire:5ve,emettere:2ise,rmettere:2ise,praffare:5ece,amettere:2ise,asparire:5ve,ismettere:3ise,espandere:5se,itrasmettere:6ise,==ere:1bbe,cadere:3de,dire:2sse,dolere:3se,emettere:2ise,espandere:5se,fare:1ece,indire:4sse,ocere:2que,omettere:2ise,predire:5sse,ridire:4sse,rifare:3ece,ristare:4ette,pere:2,sfare:2ece,smettere:2ise,solere:4tte,spandere:5é,stare:2ette,trasmettere:5ise,venire:3ne,volere:3le,essere:fu==rase:2dere,cese:2ndere,erse:2gere,luse:2dere,pese:2ndere,rese:2ndere,rise:2dere,urse:2gere,tese:2ndere,hese:2rere,iuse:2dere,cise:2dere,lise:2dere,rose:2dere,fese:2ndere,uase:2dere,vise:2dere,ruse:2dere,vase:2dere,lese:2dere,tuse:2ndere,mase:2nere,lisse:2ggere,ranse:3gere,iunse:3gere,epose:3rre,ppose:3rre,ssise:3dere,solse:3vere,sunse:2mere,rinse:3gere,torse:3cere,vinse:3cere,cinse:3gere,ianse:3gere,mpose:3rre,punse:3gere,visse:2vere,parse:3gere,fisse:2ggere,funse:3gere,pinse:3gere,ipose:3rre,cusse:2tere,russe:2ggere,finse:3gere,fulse:3gere,dulse:3gere,sorse:3gere,rpose:3rre,minse:3gere,molse:3cere,morse:3dere,munse:3gere,porse:3gere,opose:3rre,tesse:2ggere,iarse:3dere,asise:2mettere,bdusse:3rre,ccorse:4rere,ddusse:3rre,crisse:3vere,ttinse:4gere,vvolse:4gere,ovolse:4gere,iacque:3ere,presse:2imere,ncorse:4rere,ndusse:3rre,nvolse:4gere,rresse:3ggere,ecorse:4rere,elesse:3ggere,espose:4rre,frisse:3ggere,rcorse:4rere,ntinse:4gere,odusse:3rre,glesse:2igere,ospose:4rre,scelse:3gliere,icorse:4rere,tacque:3ere,avolse:4gere,svolse:4gere,adusse:3rre,aspose:4rre,istinse:5guere,dedusse:4rre,dilesse:3igere,iscorse:5rere,dispose:5rre,estinse:5guere,estolse:5lere,ichiese:5dere,rilesse:4ggere,sedusse:4rre,ascorse:5rere,",
      "firstPlural": "re:mmo,rre:nemmo,are:emmo,rsi:mmo,care:2mmo,iare:2mmo,nare:2mmo,lare:2mmo,sare:2mmo,rare:2mmo,dare:2mmo,zare:2mmo,urre:1cemmo,uare:2mmo,gare:2mmo,pare:2mmo,mare:2mmo,bare:2mmo,vare:2mmo,eare:2mmo,arre:1emmo,ttare:3mmo,itare:3mmo,ntare:3mmo,rtare:3mmo,etare:3mmo,atare:3mmo,ddire:3cemmo,utare:3mmo,otare:3mmo,ltare:3mmo,efare:3cemmo,ptare:3mmo,sfare:3cemmo,ofare:3mmo,nfare:3mmo,ufare:3mmo,essere:fummo,uffare:4mmo,astare:4mmo,ustare:4mmo,estare:4mmo,effare:4mmo,nstare:4mmo,indire:4cemmo,rifare:4cemmo,hifare:4mmo,iffare:4mmo,tifare:4mmo,mettere:ettemmo,costare:5mmo,uistare:5mmo,postare:5mmo,rostare:5mmo,vistare:5mmo,grafare:5mmo,distare:5mmo,terdire:5cemmo,listare:5mmo,predire:5cemmo,iaffare:5mmo,mistare:5mmo,trafare:5cemmo,mmettere:6mmo,rraffare:6mmo,omettere:6mmo,traffare:6cemmo,imettere:6mmo,emettere:6mmo,rmettere:6mmo,tristare:6mmo,praffare:6cemmo,amettere:6mmo,ismettere:7mmo,itrasmettere:10mmo,==costare:5mmo,dire:2cemmo,distare:5mmo,emettere:6mmo,fare:2cemmo,indire:4cemmo,listare:5mmo,omettere:6mmo,postare:5mmo,predire:5cemmo,ridire:4cemmo,rifare:4cemmo,sfare:3cemmo,smettere:6mmo,tifare:4mmo,trasmettere:9mmo,vistare:5mmo,essere:fummo==immo:1re,demmo:2re,iemmo:2re,remmo:2re,gemmo:2re,vemmo:2re,memmo:2re,uemmo:2re,pemmo:2re,lemmo:2re,scemmo:3re,enemmo:3re,rcemmo:3re,ncemmo:3re,utemmo:3re,lcemmo:3re,ocemmo:3re,anemmo:3re,gnemmo:3re,iacemmo:4re,tacemmo:4re,lettemmo:5re,",
      "secondPlural": "re:ste,rre:neste,are:este,rsi:ste,care:2ste,iare:2ste,nare:2ste,lare:2ste,sare:2ste,rare:2ste,dare:2ste,zare:2ste,urre:1ceste,uare:2ste,gare:2ste,pare:2ste,mare:2ste,bare:2ste,vare:2ste,eare:2ste,arre:1este,ttare:3ste,itare:3ste,ntare:3ste,rtare:3ste,etare:3ste,atare:3ste,ddire:3ceste,utare:3ste,otare:3ste,ltare:3ste,efare:3ceste,ptare:3ste,sfare:3ceste,ofare:3ste,nfare:3ste,ufare:3ste,essere:te,uffare:4ste,astare:4ste,ustare:4ste,estare:4ste,effare:4ste,nstare:4ste,indire:4ceste,rifare:4ceste,hifare:4ste,iffare:4ste,tifare:4ste,mettere:etteste,costare:5ste,uistare:5ste,postare:5ste,rostare:5ste,vistare:5ste,grafare:5ste,distare:5ste,terdire:5ceste,listare:5ste,predire:5ceste,iaffare:5ste,mistare:5ste,trafare:5ceste,mmettere:6ste,rraffare:6ste,omettere:6ste,traffare:6ceste,imettere:6ste,emettere:6ste,rmettere:6ste,tristare:6ste,praffare:6ceste,amettere:6ste,ismettere:7ste,itrasmettere:10ste,==costare:5ste,dire:2ceste,distare:5ste,emettere:6ste,fare:2ceste,indire:4ceste,listare:5ste,omettere:6ste,postare:5ste,predire:5ceste,ridire:4ceste,rifare:4ceste,sfare:3ceste,smettere:6ste,tifare:4ste,trasmettere:9ste,vistare:5ste,essere:te==iste:1re,deste:2re,ieste:2re,reste:2re,geste:2re,veste:2re,meste:2re,ueste:2re,peste:2re,leste:2re,sceste:3re,eneste:3re,rceste:3re,nceste:3re,uteste:3re,lceste:3re,oceste:3re,aneste:3re,gneste:3re,iaceste:4re,taceste:4re,letteste:5re,",
      "thirdPlural": "e:ono,re:ssero,rre:sero,ire:nero,are:ecero,ere:nero,gere:sero,dere:sero,rere:sero,vere:ssero,cere:sero,mere:nsero,lere:sero,tere:ssero,nere:sero,care:3ono,iare:3ono,nare:3ono,lare:3ono,sare:3ono,lire:3ono,rare:3ono,dare:3ono,zare:3ono,tire:3ono,urre:1ssero,uare:3ono,gare:3ono,pare:3ono,mare:3ono,sire:3ono,bare:3ono,cire:3ono,uire:3ono,vare:3ono,gire:3ono,eare:3ono,bire:3ono,fire:3ono,hire:3ono,arre:1ssero,zire:3ono,pire:3ono,mire:3ono,oire:3ono,eire:3ono,vire:3ono,ndere:sero,ggere:ssero,scere:bbero,imere:essero,igere:essero,guere:sero,ttere:ssero,apere:eppero,gnere:nsero,ttare:4ono,onire:4ono,unire:4ono,itare:4ono,rrire:4ono,anire:4ono,ntare:4ono,rtare:4ono,etare:4ono,atare:4ono,udire:4ono,ddire:3ssero,erire:4ono,adire:4ono,utare:4ono,otare:4ono,enere:2nero,inire:4ono,ltare:4ono,lvere:1sero,ptare:4ono,orire:4ono,acere:2quero,odire:4ono,ucere:1ssero,alere:2sero,urire:4ono,ofare:4ono,rnire:4ono,gnire:4ono,trire:4ono,grire:4ono,prire:4ono,ocere:2quero,nfare:4ono,ufare:4ono,ettere:isero,gliere:lsero,ondere:usero,ompere:uppero,ellere:ulsero,uffare:5ono,astare:5ono,ustare:5ono,bidire:5ono,ondire:5ono,estare:5ono,andire:5ono,effare:5ono,cadere:3dero,iarire:5ono,cedere:2ssero,nstare:5ono,bedire:5ono,dolere:3sero,ordire:5ono,andere:2sero,uarire:5ono,lidire:5ono,pedire:5ono,cidire:5ono,indire:4ssero,tidire:5ono,pidire:5ono,midire:5ono,gidire:5ono,lenire:5ono,ascere:1cquero,vidire:5ono,digere:1assero,dimere:1ensero,indere:1ssero,hifare:5ono,iffare:5ono,solere:5ono,tifare:5ono,volere:3lero,mettere:isero,ettersi:isero,costare:6ono,uistare:6ono,gredire:6ono,pparire:4vero,postare:6ono,rostare:6ono,vistare:6ono,mparire:4vero,pondere:2sero,grafare:6ono,distare:6ono,vellere:3sero,cellere:3sero,lettere:2ssero,tridire:6ono,aridire:6ono,rridire:6ono,terdire:5ssero,listare:6ono,condere:2sero,predire:5ssero,verdire:6ono,iaffare:6ono,mistare:6ono,tostare:4ettero,erompere:pero,mmettere:2isero,rraffare:7ono,omettere:2isero,imettere:2isero,isparire:5vero,emettere:2isero,rmettere:2isero,tristare:7ono,amettere:2isero,asparire:5vero,ismettere:3isero,itrasmettere:6isero,==adire:4ono,ere:2o,cadere:3dero,costare:6ono,dire:2ssero,distare:6ono,dolere:3sero,emettere:2isero,erompere:pero,indire:4ssero,lenire:5ono,listare:6ono,ocere:2quero,omettere:2isero,ordire:5ono,postare:6ono,predire:5ssero,ridire:4ssero,ristare:4ettero,pere:3o,smettere:2isero,solere:5ono,sparire:6ono,stare:2ettero,tifare:5ono,trasmettere:5isero,udire:4ono,unire:4ono,vistare:6ono,volere:3lero==rasero:2dere,cesero:2ndere,ersero:2gere,lusero:2dere,pesero:2ndere,resero:2ndere,risero:2dere,ursero:2gere,tesero:2ndere,hesero:2rere,iusero:2dere,cisero:2dere,lisero:2dere,rosero:2dere,fesero:2ndere,uasero:2dere,visero:2dere,rusero:2dere,vasero:2dere,lesero:2dere,tusero:2ndere,masero:2nere,vennero:3ire,lissero:2ggere,ransero:3gere,iunsero:3gere,eposero:3rre,pposero:3rre,ssisero:3dere,solsero:3vere,sunsero:2mere,rinsero:3gere,torsero:3cere,vinsero:3cere,cinsero:3gere,iansero:3gere,mposero:3rre,punsero:3gere,vissero:2vere,parsero:3gere,fissero:2ggere,funsero:3gere,pinsero:3gere,iposero:3rre,cussero:2tere,russero:2ggere,finsero:3gere,fulsero:3gere,dulsero:3gere,sorsero:3gere,rposero:3rre,minsero:3gere,molsero:3cere,morsero:3dere,munsero:3gere,porsero:3gere,oposero:3rre,tessero:2ggere,iarsero:3dere,asisero:2mettere,bdussero:3rre,ccorsero:4rere,ddussero:3rre,crissero:3vere,ttinsero:4gere,vvolsero:4gere,ovolsero:4gere,iacquero:3ere,pressero:2imere,ncorsero:4rere,ndussero:3rre,nvolsero:4gere,rressero:3ggere,ecorsero:4rere,elessero:3ggere,esposero:4rre,frissero:3ggere,rcorsero:4rere,ntinsero:4gere,odussero:3rre,glessero:2igere,osposero:4rre,scelsero:3gliere,icorsero:4rere,tacquero:3ere,avolsero:4gere,svolsero:4gere,adussero:3rre,asposero:4rre,istinsero:5guere,dedussero:4rre,dilessero:3igere,iscorsero:5rere,disposero:5rre,estinsero:5guere,estolsero:5lere,ichiesero:5dere,rilessero:4ggere,sedussero:4rre,ascorsero:5rere,"
    },
    "futureTense": {
      "first": "e:ò,si:ò,are:erò,ere:rò,iare:erò,nere:rrò,nire:rrò,lere:rrò,cere:rrò,sere:arò,gere:3ò,mere:3ò,uere:3ò,bere:3ò,acare:2herò,hiare:2erò,liare:2erò,aiare:2erò,icare:2herò,rcare:2herò,ccare:2herò,onire:4ò,viare:2erò,unire:4ò,ogare:2herò,piare:2erò,anire:4ò,ecare:2herò,edere:4ò,ndere:4ò,liere:4ò,rrere:4ò,scere:4ò,scare:2herò,biare:2erò,ocare:2herò,egare:2herò,agare:2herò,rgare:2herò,udere:4ò,tiare:2erò,fiare:2erò,oiare:2erò,riare:2erò,rdere:4ò,idere:4ò,inire:4ò,ugare:2herò,diare:2erò,stere:4ò,lvere:4ò,efare:4ò,rcere:4ò,ncere:4ò,icere:4ò,miare:2erò,igare:2herò,ucare:2herò,lcare:2herò,niare:2erò,rnere:4ò,erere:4ò,etere:4ò,acere:4ò,mpere:4ò,ziare:2erò,siare:2erò,utere:4ò,sfare:4ò,llere:4ò,lgare:2herò,rvere:4ò,rnire:4ò,gnire:4ò,evere:4ò,lcere:4ò,uiare:2erò,gnere:4ò,rtere:4ò,attere:5ò,radere:5ò,ancare:3herò,ingare:3herò,rivere:5ò,rodere:5ò,uadere:5ò,encare:3herò,vadere:5ò,ottere:5ò,angare:3herò,lenire:5ò,rifare:5ò,essere:5ò,incare:3herò,mettere:etterò,nettere:6ò,lettere:6ò,scadere:6ò,tostare:6ò,trafare:6ò,mmettere:7ò,omettere:7ò,traffare:7ò,imettere:7ò,emettere:7ò,rmettere:7ò,olungare:5herò,praffare:7ò,troncare:5herò,amettere:7ò,ismettere:8ò,itrasmettere:11ò,==andare:3rò,are:3rò,dare:3ò,emettere:7ò,fare:3ò,lenire:5ò,mettere:6ò,omettere:7ò,radere:5ò,ridare:5ò,rifare:5ò,ristare:6ò,rodere:5ò,scadere:6ò,sciare:3erò,sfare:4ò,smettere:7ò,stare:4ò,trasmettere:10ò,troncare:5herò,unire:4ò==ferò:1are,lirò:3e,zerò:1are,tirò:3e,rirò:3e,dirò:3e,sirò:3e,cirò:3e,uirò:3e,girò:3e,eerò:1are,birò:3e,firò:3e,hirò:3e,zirò:3e,mirò:3e,oirò:3e,eirò:3e,virò:3e,inerò:2are,onerò:2are,olerò:2are,iterò:2are,tuerò:2are,urerò:2are,userò:2are,nterò:2are,pperò:2are,amerò:2are,aterò:2are,unerò:2are,ulerò:2are,nserò:2are,trerò:2are,verrò:2nire,bberò:2are,orerò:2are,brerò:2are,prerò:2are,nnerò:2are,rmerò:2are,ilerò:2are,irerò:2are,averò:2are,agerò:2iare,alerò:2are,enerò:2are,anerò:2are,rberò:2are,elerò:2are,oterò:2are,porrò:4e,iperò:2are,terrò:2nere,overò:2are,lterò:2are,blerò:2are,eperò:2are,mmerò:2are,rarrò:4e,nuerò:2are,rserò:2are,iserò:2are,aserò:2are,rlerò:2are,lmerò:2are,apirò:4e,pterò:2are,rpirò:4e,oserò:2are,iberò:2are,frerò:2are,lpirò:4e,epirò:4e,upirò:4e,crerò:2are,plerò:2are,aperò:2are,uberò:2are,lperò:2are,egerò:2iare,dorrò:2lere,omerò:2are,operò:2are,grerò:2are,smerò:2are,varrò:2lere,rperò:2are,cuerò:2are,lserò:2are,dderò:2are,sperò:2are,duerò:2are,ugerò:2iare,oberò:2are,drerò:2are,vrerò:2are,uperò:2are,eserò:2are,parrò:3ere,marrò:2nere,lderò:2are,tmerò:2are,aberò:2are,opirò:4e,vorrò:2lere,allerò:3are,asserò:3are,vererò:3are,ognerò:3are,itterò:3are,bdurrò:5e,errerò:3are,isserò:3are,amperò:3are,arrerò:3are,asterò:3are,lererò:3are,heterò:3are,moderò:3are,agnerò:3are,osterò:3are,osserò:3are,ddurrò:5e,eguerò:3are,pererò:3are,ornerò:3are,tererò:3are,fiderò:3are,ilierò:3are,ancerò:3iare,tiverò:3are,usterò:3are,mererò:3are,iuterò:3are,bererò:3are,leverò:3are,oggerò:3iare,alierò:3are,marerò:3are,meterò:3are,plierò:3are,puterò:3are,nimerò:3are,niderò:3are,noderò:3are,ullerò:3are,uncerò:3iare,parerò:3are,arterò:3are,orterò:3are,simerò:3are,esterò:3are,aggerò:3iare,illerò:3are,soderò:3are,viverò:3are,zererò:3are,bacerò:3iare,baderò:3are,barerò:3are,ficerò:3iare,ercerò:3iare,bigerò:3iare,utterò:3are,usserò:3are,alcerò:3iare,diderò:3are,cererò:3are,ioderò:3are,cimerò:3are,auderò:3are,sererò:3are,muterò:3are,leterò:3are,reterò:3are,ndurrò:5e,futerò:3are,gederò:3are,dererò:3are,nsterò:3are,tumerò:3are,urverò:3are,nererò:3are,nuderò:3are,ignerò:3are,iarerò:3are,figerò:3iare,logerò:3iare,empirò:5e,gererò:3are,larerò:3are,ugnerò:3are,irterò:3are,fumerò:3are,uiderò:3are,urrerò:3are,arnerò:3are,nicerò:3iare,timerò:3are,biderò:3are,odurrò:5e,piderò:3are,fererò:3are,limerò:3are,iscerò:3iare,loderò:3are,arcerò:3iare,mimerò:3are,muderò:3are,blierò:3are,olierò:3are,squerò:3are,pigerò:3iare,carerò:3are,cquerò:3are,luterò:3are,liverò:3are,alverò:3are,ircerò:3iare,cemerò:3are,hederò:3are,hiverò:3are,ruterò:3are,sederò:3are,elcerò:3iare,uscerò:3iare,pumerò:3are,nuterò:3are,suderò:3are,tarerò:3are,adurrò:5e,buterò:3are,urterò:3are,geterò:3are,engerò:3iare,aglierò:4are,iglierò:4are,bonderò:4are,cascerò:4iare,certerò:4are,cetterò:4are,collerò:4are,tellerò:4are,concerò:4iare,corcerò:4iare,corderò:4are,uieterò:4are,uisterò:4are,datterò:4are,dotterò:4are,fetterò:4are,loscerò:4iare,follerò:4are,hinderò:4are,beggerò:4iare,latterò:4are,lerterò:4are,lieterò:4are,lungerò:4are,ternerò:4are,bascerò:4iare,dernerò:4are,heggerò:4iare,nellerò:4are,proderò:4are,ieggerò:4iare,meggerò:4iare,rrederò:4are,rriverò:4are,tonderò:4are,petterò:4are,segnerò:4are,getterò:4are,sorderò:4are,visterò:4are,zarderò:4are,betterò:4are,barderò:4are,benderò:4are,linderò:4are,cotterò:4are,bollerò:4are,botterò:4are,borderò:4are,seggerò:4iare,rinderò:4are,peggerò:4iare,cangerò:4iare,neggerò:4iare,zeggerò:4iare,sellerò:4are,cesserò:4are,uetterò:4are,manderò:4are,mincerò:4iare,menderò:4are,patterò:4are,fesserò:4are,serverò:4are,oliderò:4are,nsumerò:4are,tatterò:4are,ratterò:4are,rollerò:4are,bellerò:4are,cremerò:4are,deggerò:4iare,dedurrò:6e,degnerò:4are,prederò:4are,detterò:4are,irederò:4are,rotterò:4are,erederò:4are,serterò:4are,resserò:4are,anguerò:4are,disterò:4are,vieterò:4are,uellerò:4are,hetterò:4are,fascerò:4iare,gellerò:4are,lotterò:4are,forgerò:4iare,retterò:4are,froderò:4are,gesserò:4are,vernerò:4are,graderò:4are,griderò:4are,guaderò:4are,uarderò:4are,bernerò:4are,regnerò:4are,adicerò:4iare,uglierò:4are,ietterò:4are,nonderò:4are,udicerò:4iare,aliderò:4are,crimerò:4are,lascerò:4iare,legnerò:4are,lesserò:4are,lincerò:4iare,listerò:4are,lorderò:4are,mangerò:4iare,matterò:4are,dellerò:4are,mollerò:4are,monderò:4are,notterò:4are,iomberò:4are,oetterò:4are,priverò:4are,rellerò:4are,risterò:4are,catterò:4are,bomberò:4are,tomberò:4are,tarderò:4are,romberò:4are,roncerò:4are,vescerò:4iare,aetterò:4are,banderò:4are,borrerò:4are,feggerò:4iare,iotterò:4are,roscerò:4iare,sedurrò:6e,sesserò:4are,stemerò:4are,misterò:4are,sonderò:4are,iciderò:4are,aligerò:4iare,tremerò:4are,uciderò:4are,vesserò:4are,idimerò:4are,aleggerò:5iare,lletterò:5are,areggerò:5iare,anetterò:5are,moglierò:5are,oreggerò:5iare,ppellerò:5are,ovellerò:5are,econderò:5are,tteggerò:5iare,ncellerò:5are,rconderò:5are,nteggerò:5iare,rteggerò:5iare,steggerò:5iare,treggerò:5iare,iletterò:5are,mpegnerò:5are,avellerò:5are,lleggerò:5iare,roglierò:5are,rpellerò:5are,voglierò:5are,acellerò:5are,schererò:5are,oleggerò:5iare,breggerò:5iare,ossiderò:5are,esetterò:5are,iesumerò:5are,pinguerò:5are,veglierò:5are,foglierò:5are,poglierò:5are,lteggerò:5iare,cchererò:5are,affonderò:6are,cchiererò:6are,erreggerò:6iare,livellerò:6are,schiererò:6are,uccellerò:6are,veleggerò:6iare,faccenderò:7are,sprofonderò:8are,",
      "second": "e:ai,si:ai,are:erai,ere:rai,iare:erai,nere:rrai,nire:rrai,lere:rrai,cere:rrai,sere:arai,gere:3ai,mere:3ai,uere:3ai,bere:3ai,acare:2herai,hiare:2erai,liare:2erai,aiare:2erai,icare:2herai,rcare:2herai,ccare:2herai,onire:4ai,viare:2erai,unire:4ai,ogare:2herai,piare:2erai,anire:4ai,ecare:2herai,edere:4ai,ndere:4ai,liere:4ai,rrere:4ai,scere:4ai,scare:2herai,biare:2erai,ocare:2herai,egare:2herai,agare:2herai,rgare:2herai,udere:4ai,tiare:2erai,fiare:2erai,oiare:2erai,riare:2erai,rdere:4ai,idere:4ai,inire:4ai,ugare:2herai,diare:2erai,stere:4ai,lvere:4ai,efare:4ai,rcere:4ai,ncere:4ai,icere:4ai,miare:2erai,igare:2herai,ucare:2herai,lcare:2herai,niare:2erai,rnere:4ai,erere:4ai,etere:4ai,acere:4ai,mpere:4ai,ziare:2erai,siare:2erai,utere:4ai,sfare:4ai,llere:4ai,lgare:2herai,rvere:4ai,rnire:4ai,gnire:4ai,evere:4ai,lcere:4ai,uiare:2erai,gnere:4ai,rtere:4ai,ducere:urrai,attere:5ai,radere:5ai,ancare:3herai,ingare:3herai,rivere:5ai,rodere:5ai,uadere:5ai,encare:3herai,vadere:5ai,ottere:5ai,angare:3herai,lenire:5ai,rifare:5ai,essere:5ai,incare:3herai,mettere:etterai,nettere:6ai,educere:3rrai,lettere:6ai,scadere:6ai,tostare:6ai,trafare:6ai,mmettere:7ai,omettere:7ai,traffare:7ai,imettere:7ai,emettere:7ai,rmettere:7ai,olungare:5herai,praffare:7ai,troncare:5herai,amettere:7ai,ismettere:8ai,itrasmettere:11ai,==andare:3rai,are:3rai,dare:3ai,educere:3rrai,emettere:7ai,fare:3ai,lenire:5ai,mettere:6ai,omettere:7ai,radere:5ai,ridare:5ai,rifare:5ai,ristare:6ai,rodere:5ai,scadere:6ai,sciare:3erai,sfare:4ai,smettere:7ai,stare:4ai,trasmettere:10ai,troncare:5herai,unire:4ai==ferai:1are,lirai:3e,zerai:1are,tirai:3e,rirai:3e,dirai:3e,sirai:3e,cirai:3e,uirai:3e,girai:3e,eerai:1are,birai:3e,firai:3e,hirai:3e,zirai:3e,mirai:3e,oirai:3e,eirai:3e,virai:3e,inerai:2are,onerai:2are,olerai:2are,iterai:2are,tuerai:2are,urerai:2are,userai:2are,nterai:2are,pperai:2are,amerai:2are,aterai:2are,unerai:2are,ulerai:2are,nserai:2are,trerai:2are,verrai:2nire,bberai:2are,orerai:2are,brerai:2are,prerai:2are,nnerai:2are,rmerai:2are,ilerai:2are,irerai:2are,averai:2are,agerai:2iare,alerai:2are,enerai:2are,anerai:2are,rberai:2are,elerai:2are,oterai:2are,porrai:4e,iperai:2are,terrai:2nere,overai:2are,lterai:2are,blerai:2are,eperai:2are,mmerai:2are,rarrai:4e,nuerai:2are,rserai:2are,iserai:2are,aserai:2are,rlerai:2are,lmerai:2are,apirai:4e,pterai:2are,rpirai:4e,oserai:2are,iberai:2are,frerai:2are,lpirai:4e,epirai:4e,upirai:4e,crerai:2are,plerai:2are,aperai:2are,uberai:2are,lperai:2are,egerai:2iare,dorrai:2lere,omerai:2are,operai:2are,grerai:2are,smerai:2are,varrai:2lere,rperai:2are,cuerai:2are,lserai:2are,dderai:2are,sperai:2are,duerai:2are,ugerai:2iare,oberai:2are,drerai:2are,vrerai:2are,uperai:2are,eserai:2are,parrai:3ere,marrai:2nere,lderai:2are,tmerai:2are,aberai:2are,opirai:4e,vorrai:2lere,allerai:3are,asserai:3are,vererai:3are,ognerai:3are,itterai:3are,bdurrai:5e,errerai:3are,isserai:3are,amperai:3are,arrerai:3are,asterai:3are,lererai:3are,heterai:3are,moderai:3are,agnerai:3are,osterai:3are,osserai:3are,ddurrai:5e,eguerai:3are,pererai:3are,ornerai:3are,tererai:3are,fiderai:3are,ilierai:3are,ancerai:3iare,tiverai:3are,usterai:3are,mererai:3are,iuterai:3are,bererai:3are,leverai:3are,oggerai:3iare,alierai:3are,marerai:3are,meterai:3are,plierai:3are,puterai:3are,nimerai:3are,niderai:3are,noderai:3are,ullerai:3are,uncerai:3iare,parerai:3are,arterai:3are,orterai:3are,simerai:3are,esterai:3are,aggerai:3iare,illerai:3are,soderai:3are,viverai:3are,zererai:3are,bacerai:3iare,baderai:3are,barerai:3are,ficerai:3iare,ercerai:3iare,bigerai:3iare,utterai:3are,usserai:3are,alcerai:3iare,diderai:3are,cererai:3are,ioderai:3are,cimerai:3are,auderai:3are,sererai:3are,muterai:3are,leterai:3are,reterai:3are,ndurrai:5e,futerai:3are,gederai:3are,dererai:3are,nsterai:3are,tumerai:3are,urverai:3are,nererai:3are,nuderai:3are,ignerai:3are,iarerai:3are,figerai:3iare,logerai:3iare,empirai:5e,gererai:3are,larerai:3are,ugnerai:3are,irterai:3are,fumerai:3are,uiderai:3are,urrerai:3are,arnerai:3are,nicerai:3iare,timerai:3are,biderai:3are,odurrai:5e,piderai:3are,fererai:3are,limerai:3are,iscerai:3iare,loderai:3are,arcerai:3iare,mimerai:3are,muderai:3are,blierai:3are,olierai:3are,squerai:3are,pigerai:3iare,idurrai:5e,carerai:3are,cquerai:3are,luterai:3are,liverai:3are,alverai:3are,ircerai:3iare,cemerai:3are,hederai:3are,hiverai:3are,ruterai:3are,sederai:3are,elcerai:3iare,uscerai:3iare,pumerai:3are,nuterai:3are,suderai:3are,tarerai:3are,adurrai:5e,buterai:3are,urterai:3are,geterai:3are,engerai:3iare,aglierai:4are,iglierai:4are,bonderai:4are,cascerai:4iare,certerai:4are,cetterai:4are,collerai:4are,tellerai:4are,concerai:4iare,corcerai:4iare,corderai:4are,uieterai:4are,uisterai:4are,datterai:4are,dotterai:4are,fetterai:4are,loscerai:4iare,follerai:4are,hinderai:4are,beggerai:4iare,latterai:4are,lerterai:4are,lieterai:4are,lungerai:4are,ternerai:4are,bascerai:4iare,dernerai:4are,heggerai:4iare,nellerai:4are,proderai:4are,ieggerai:4iare,meggerai:4iare,rrederai:4are,rriverai:4are,tonderai:4are,petterai:4are,segnerai:4are,getterai:4are,sorderai:4are,visterai:4are,zarderai:4are,betterai:4are,barderai:4are,benderai:4are,linderai:4are,cotterai:4are,bollerai:4are,botterai:4are,borderai:4are,seggerai:4iare,rinderai:4are,peggerai:4iare,cangerai:4iare,neggerai:4iare,zeggerai:4iare,sellerai:4are,cesserai:4are,uetterai:4are,manderai:4are,mincerai:4iare,menderai:4are,patterai:4are,fesserai:4are,serverai:4are,oliderai:4are,nsumerai:4are,tatterai:4are,ratterai:4are,rollerai:4are,bellerai:4are,cremerai:4are,deggerai:4iare,dedurrai:6e,degnerai:4are,prederai:4are,detterai:4are,irederai:4are,rotterai:4are,erederai:4are,serterai:4are,resserai:4are,anguerai:4are,disterai:4are,vieterai:4are,uellerai:4are,hetterai:4are,fascerai:4iare,gellerai:4are,lotterai:4are,forgerai:4iare,retterai:4are,froderai:4are,gesserai:4are,vernerai:4are,graderai:4are,griderai:4are,guaderai:4are,uarderai:4are,bernerai:4are,regnerai:4are,adicerai:4iare,uglierai:4are,ietterai:4are,nonderai:4are,udicerai:4iare,aliderai:4are,crimerai:4are,lascerai:4iare,legnerai:4are,lesserai:4are,lincerai:4iare,listerai:4are,lorderai:4are,mangerai:4iare,matterai:4are,dellerai:4are,mollerai:4are,monderai:4are,notterai:4are,iomberai:4are,oetterai:4are,priverai:4are,rellerai:4are,risterai:4are,catterai:4are,bomberai:4are,tomberai:4are,tarderai:4are,romberai:4are,roncerai:4are,vescerai:4iare,aetterai:4are,banderai:4are,borrerai:4are,feggerai:4iare,iotterai:4are,roscerai:4iare,sedurrai:6e,sesserai:4are,stemerai:4are,misterai:4are,sonderai:4are,iciderai:4are,aligerai:4iare,tremerai:4are,uciderai:4are,vesserai:4are,idimerai:4are,aleggerai:5iare,lletterai:5are,areggerai:5iare,anetterai:5are,moglierai:5are,oreggerai:5iare,ppellerai:5are,ovellerai:5are,econderai:5are,tteggerai:5iare,ncellerai:5are,rconderai:5are,nteggerai:5iare,rteggerai:5iare,steggerai:5iare,treggerai:5iare,iletterai:5are,mpegnerai:5are,avellerai:5are,lleggerai:5iare,roglierai:5are,rpellerai:5are,voglierai:5are,acellerai:5are,schererai:5are,oleggerai:5iare,breggerai:5iare,ossiderai:5are,esetterai:5are,iesumerai:5are,pinguerai:5are,veglierai:5are,foglierai:5are,poglierai:5are,lteggerai:5iare,cchererai:5are,affonderai:6are,cchiererai:6are,erreggerai:6iare,livellerai:6are,schiererai:6are,uccellerai:6are,veleggerai:6iare,faccenderai:7are,sprofonderai:8are,",
      "third": "e:à,si:à,are:erà,ere:rà,iare:erà,nere:rrà,nire:rrà,lere:rrà,cere:rrà,sere:arà,gere:3à,mere:3à,uere:3à,bere:3à,acare:2herà,hiare:2erà,liare:2erà,aiare:2erà,icare:2herà,rcare:2herà,ccare:2herà,onire:4à,viare:2erà,unire:4à,ogare:2herà,piare:2erà,anire:4à,ecare:2herà,edere:4à,ndere:4à,liere:4à,rrere:4à,scere:4à,scare:2herà,biare:2erà,ocare:2herà,egare:2herà,agare:2herà,rgare:2herà,udere:4à,tiare:2erà,fiare:2erà,oiare:2erà,riare:2erà,rdere:4à,idere:4à,inire:4à,ugare:2herà,diare:2erà,stere:4à,lvere:4à,efare:4à,rcere:4à,ncere:4à,icere:4à,miare:2erà,igare:2herà,ucare:2herà,lcare:2herà,niare:2erà,rnere:4à,erere:4à,etere:4à,acere:4à,mpere:4à,ziare:2erà,siare:2erà,utere:4à,sfare:4à,llere:4à,lgare:2herà,rvere:4à,rnire:4à,gnire:4à,evere:4à,lcere:4à,uiare:2erà,gnere:4à,rtere:4à,attere:5à,radere:5à,ancare:3herà,ingare:3herà,rivere:5à,rodere:5à,uadere:5à,encare:3herà,vadere:5à,ottere:5à,angare:3herà,lenire:5à,rifare:5à,essere:5à,incare:3herà,mettere:etterà,nettere:6à,lettere:6à,scadere:6à,tostare:6à,trafare:6à,mmettere:7à,omettere:7à,traffare:7à,imettere:7à,emettere:7à,rmettere:7à,olungare:5herà,praffare:7à,troncare:5herà,amettere:7à,ismettere:8à,itrasmettere:11à,==andare:3rà,are:3rà,dare:3à,emettere:7à,fare:3à,lenire:5à,mettere:6à,omettere:7à,radere:5à,ridare:5à,rifare:5à,ristare:6à,rodere:5à,scadere:6à,sciare:3erà,sfare:4à,smettere:7à,stare:4à,trasmettere:10à,troncare:5herà,unire:4à==ferà:1are,lirà:3e,zerà:1are,tirà:3e,rirà:3e,dirà:3e,sirà:3e,cirà:3e,uirà:3e,girà:3e,eerà:1are,birà:3e,firà:3e,hirà:3e,zirà:3e,mirà:3e,oirà:3e,eirà:3e,virà:3e,inerà:2are,onerà:2are,olerà:2are,iterà:2are,tuerà:2are,urerà:2are,userà:2are,nterà:2are,pperà:2are,amerà:2are,aterà:2are,unerà:2are,ulerà:2are,nserà:2are,trerà:2are,verrà:2nire,bberà:2are,orerà:2are,brerà:2are,prerà:2are,nnerà:2are,rmerà:2are,ilerà:2are,irerà:2are,averà:2are,agerà:2iare,alerà:2are,enerà:2are,anerà:2are,rberà:2are,elerà:2are,oterà:2are,porrà:4e,iperà:2are,terrà:2nere,overà:2are,lterà:2are,blerà:2are,eperà:2are,mmerà:2are,rarrà:4e,nuerà:2are,rserà:2are,iserà:2are,aserà:2are,rlerà:2are,lmerà:2are,apirà:4e,pterà:2are,rpirà:4e,oserà:2are,iberà:2are,frerà:2are,lpirà:4e,epirà:4e,upirà:4e,crerà:2are,plerà:2are,aperà:2are,uberà:2are,lperà:2are,egerà:2iare,dorrà:2lere,omerà:2are,operà:2are,grerà:2are,smerà:2are,varrà:2lere,rperà:2are,cuerà:2are,lserà:2are,dderà:2are,sperà:2are,duerà:2are,ugerà:2iare,oberà:2are,drerà:2are,vrerà:2are,uperà:2are,eserà:2are,parrà:3ere,marrà:2nere,lderà:2are,tmerà:2are,aberà:2are,opirà:4e,vorrà:2lere,allerà:3are,asserà:3are,vererà:3are,ognerà:3are,itterà:3are,bdurrà:5e,errerà:3are,isserà:3are,amperà:3are,arrerà:3are,asterà:3are,lererà:3are,heterà:3are,moderà:3are,agnerà:3are,osterà:3are,osserà:3are,ddurrà:5e,eguerà:3are,pererà:3are,ornerà:3are,tererà:3are,fiderà:3are,ilierà:3are,ancerà:3iare,tiverà:3are,usterà:3are,mererà:3are,iuterà:3are,bererà:3are,leverà:3are,oggerà:3iare,alierà:3are,marerà:3are,meterà:3are,plierà:3are,puterà:3are,nimerà:3are,niderà:3are,noderà:3are,ullerà:3are,uncerà:3iare,parerà:3are,arterà:3are,orterà:3are,simerà:3are,esterà:3are,aggerà:3iare,illerà:3are,soderà:3are,viverà:3are,zererà:3are,bacerà:3iare,baderà:3are,barerà:3are,ficerà:3iare,ercerà:3iare,bigerà:3iare,utterà:3are,usserà:3are,alcerà:3iare,diderà:3are,cererà:3are,ioderà:3are,cimerà:3are,auderà:3are,sererà:3are,muterà:3are,leterà:3are,reterà:3are,ndurrà:5e,futerà:3are,gederà:3are,dererà:3are,nsterà:3are,tumerà:3are,urverà:3are,nererà:3are,nuderà:3are,ignerà:3are,iarerà:3are,figerà:3iare,logerà:3iare,empirà:5e,gererà:3are,larerà:3are,ugnerà:3are,irterà:3are,fumerà:3are,uiderà:3are,urrerà:3are,arnerà:3are,nicerà:3iare,timerà:3are,biderà:3are,odurrà:5e,piderà:3are,fererà:3are,limerà:3are,iscerà:3iare,loderà:3are,arcerà:3iare,mimerà:3are,muderà:3are,blierà:3are,olierà:3are,squerà:3are,pigerà:3iare,carerà:3are,cquerà:3are,luterà:3are,liverà:3are,alverà:3are,ircerà:3iare,cemerà:3are,hederà:3are,hiverà:3are,ruterà:3are,sederà:3are,elcerà:3iare,uscerà:3iare,pumerà:3are,nuterà:3are,suderà:3are,tarerà:3are,adurrà:5e,buterà:3are,urterà:3are,geterà:3are,engerà:3iare,aglierà:4are,iglierà:4are,bonderà:4are,cascerà:4iare,certerà:4are,cetterà:4are,collerà:4are,tellerà:4are,concerà:4iare,corcerà:4iare,corderà:4are,uieterà:4are,uisterà:4are,datterà:4are,dotterà:4are,fetterà:4are,loscerà:4iare,follerà:4are,hinderà:4are,beggerà:4iare,latterà:4are,lerterà:4are,lieterà:4are,lungerà:4are,ternerà:4are,bascerà:4iare,dernerà:4are,heggerà:4iare,nellerà:4are,proderà:4are,ieggerà:4iare,meggerà:4iare,rrederà:4are,rriverà:4are,tonderà:4are,petterà:4are,segnerà:4are,getterà:4are,sorderà:4are,visterà:4are,zarderà:4are,betterà:4are,barderà:4are,benderà:4are,linderà:4are,cotterà:4are,bollerà:4are,botterà:4are,borderà:4are,seggerà:4iare,rinderà:4are,peggerà:4iare,cangerà:4iare,neggerà:4iare,zeggerà:4iare,sellerà:4are,cesserà:4are,uetterà:4are,manderà:4are,mincerà:4iare,menderà:4are,patterà:4are,fesserà:4are,serverà:4are,oliderà:4are,nsumerà:4are,tatterà:4are,ratterà:4are,rollerà:4are,bellerà:4are,cremerà:4are,deggerà:4iare,dedurrà:6e,degnerà:4are,prederà:4are,detterà:4are,irederà:4are,rotterà:4are,erederà:4are,serterà:4are,resserà:4are,anguerà:4are,disterà:4are,vieterà:4are,uellerà:4are,hetterà:4are,fascerà:4iare,gellerà:4are,lotterà:4are,forgerà:4iare,retterà:4are,froderà:4are,gesserà:4are,vernerà:4are,graderà:4are,griderà:4are,guaderà:4are,uarderà:4are,bernerà:4are,regnerà:4are,adicerà:4iare,uglierà:4are,ietterà:4are,nonderà:4are,udicerà:4iare,aliderà:4are,crimerà:4are,lascerà:4iare,legnerà:4are,lesserà:4are,lincerà:4iare,listerà:4are,lorderà:4are,mangerà:4iare,matterà:4are,dellerà:4are,mollerà:4are,monderà:4are,notterà:4are,iomberà:4are,oetterà:4are,priverà:4are,rellerà:4are,risterà:4are,catterà:4are,bomberà:4are,tomberà:4are,tarderà:4are,romberà:4are,roncerà:4are,vescerà:4iare,aetterà:4are,banderà:4are,borrerà:4are,feggerà:4iare,iotterà:4are,roscerà:4iare,sedurrà:6e,sesserà:4are,stemerà:4are,misterà:4are,sonderà:4are,iciderà:4are,aligerà:4iare,tremerà:4are,uciderà:4are,vesserà:4are,idimerà:4are,aleggerà:5iare,lletterà:5are,areggerà:5iare,anetterà:5are,moglierà:5are,oreggerà:5iare,ppellerà:5are,ovellerà:5are,econderà:5are,tteggerà:5iare,ncellerà:5are,rconderà:5are,nteggerà:5iare,rteggerà:5iare,steggerà:5iare,treggerà:5iare,iletterà:5are,mpegnerà:5are,avellerà:5are,lleggerà:5iare,roglierà:5are,rpellerà:5are,voglierà:5are,acellerà:5are,schererà:5are,oleggerà:5iare,breggerà:5iare,ossiderà:5are,esetterà:5are,iesumerà:5are,pinguerà:5are,veglierà:5are,foglierà:5are,poglierà:5are,lteggerà:5iare,cchererà:5are,affonderà:6are,cchiererà:6are,erreggerà:6iare,livellerà:6are,schiererà:6are,uccellerà:6are,veleggerà:6iare,faccenderà:7are,sprofonderà:8are,",
      "firstPlural": "e:émo,si:emo,are:eremo,ere:remo,rre:3mo,iare:eremo,nere:rremo,nire:rremo,lere:rremo,cere:rremo,lire:4mo,tire:4mo,rire:4mo,dire:4mo,sire:4mo,cire:4mo,gere:4mo,uire:4mo,bire:4mo,fire:4mo,hire:4mo,mere:4mo,zire:4mo,pire:4mo,uere:4mo,mire:4mo,oire:4mo,bere:4mo,eire:4mo,vire:4mo,sere:4mo,acare:2heremo,hiare:2eremo,liare:2eremo,aiare:2eremo,icare:2heremo,rcare:2heremo,ccare:2heremo,onire:5mo,viare:2eremo,unire:5mo,ogare:2heremo,piare:2eremo,anire:5mo,ecare:2heremo,edere:5mo,ndere:5mo,liere:5mo,rrere:5mo,scere:5mo,scare:2heremo,biare:2eremo,ocare:2heremo,egare:2heremo,agare:2heremo,rgare:2heremo,udere:5mo,tiare:2eremo,fiare:2eremo,oiare:2eremo,riare:2eremo,rdere:5mo,idere:5mo,inire:5mo,ugare:2heremo,diare:2eremo,stere:5mo,lvere:5mo,efare:5mo,rcere:5mo,ncere:5mo,icere:5mo,miare:2eremo,igare:2heremo,ucare:2heremo,lcare:2heremo,niare:2eremo,rnere:5mo,erere:5mo,etere:5mo,acere:5mo,mpere:5mo,ziare:2eremo,siare:2eremo,utere:5mo,sfare:5mo,llere:5mo,lgare:2heremo,rvere:5mo,rnire:5mo,ggire:5mo,gnire:5mo,evere:5mo,lcere:5mo,uiare:2eremo,agire:5mo,gnere:5mo,rtere:5mo,attere:6mo,radere:6mo,ancare:3heremo,ingare:3heremo,rivere:6mo,rodere:6mo,uadere:6mo,encare:3heremo,vadere:6mo,ottere:6mo,angare:3heremo,incare:3heremo,mettere:etteremo,nettere:7mo,lettere:7mo,tostare:7mo,trafare:7mo,mmettere:8mo,omettere:8mo,traffare:8mo,imettere:8mo,rmettere:8mo,emettere:8mo,olungare:5heremo,praffare:8mo,troncare:5heremo,amettere:8mo,ismettere:9mo,itrasmettere:12mo,==agire:5mo,andare:3remo,are:3remo,dare:4mo,dire:4mo,emettere:8mo,fare:4mo,lenire:6mo,mettere:7mo,omettere:8mo,radere:6mo,ridare:6mo,rifare:6mo,ristare:7mo,rodere:6mo,scadere:7mo,sciare:3eremo,sfare:5mo,smettere:8mo,stare:5mo,trasmettere:11mo,troncare:5heremo,unire:5mo,re:2mo==feremo:1are,zeremo:1are,eeremo:1are,ineremo:2are,oneremo:2are,oleremo:2are,iteremo:2are,tueremo:2are,ureremo:2are,useremo:2are,nteremo:2are,pperemo:2are,ameremo:2are,ateremo:2are,uneremo:2are,uleremo:2are,nseremo:2are,treremo:2are,verremo:2nire,bberemo:2are,oreremo:2are,breremo:2are,preremo:2are,nneremo:2are,rmeremo:2are,ileremo:2are,ireremo:2are,averemo:2are,ageremo:2iare,aleremo:2are,eneremo:2are,aneremo:2are,rberemo:2are,eleremo:2are,oteremo:2are,porremo:5,iperemo:2are,terremo:2nere,overemo:2are,lteremo:2are,bleremo:2are,eperemo:2are,mmeremo:2are,rarremo:5,nueremo:2are,rseremo:2are,iseremo:2are,aseremo:2are,rleremo:2are,lmeremo:2are,pteremo:2are,oseremo:2are,iberemo:2are,freremo:2are,creremo:2are,pleremo:2are,aperemo:2are,uberemo:2are,lperemo:2are,egeremo:2iare,dorremo:2lere,omeremo:2are,operemo:2are,greremo:2are,smeremo:2are,varremo:2lere,rperemo:2are,cueremo:2are,lseremo:2are,dderemo:2are,speremo:2are,dueremo:2are,ugeremo:2iare,oberemo:2are,dreremo:2are,vreremo:2are,uperemo:2are,eseremo:2are,parremo:3ere,marremo:2nere,lderemo:2are,tmeremo:2are,aberemo:2are,vorremo:2lere,alleremo:3are,asseremo:3are,vereremo:3are,ogneremo:3are,itteremo:3are,bdurremo:6,erreremo:3are,isseremo:3are,amperemo:3are,arreremo:3are,asteremo:3are,lereremo:3are,heteremo:3are,moderemo:3are,agneremo:3are,osteremo:3are,osseremo:3are,ddurremo:6,egueremo:3are,pereremo:3are,orneremo:3are,tereremo:3are,fideremo:3are,ilieremo:3are,anceremo:3iare,tiveremo:3are,usteremo:3are,mereremo:3are,iuteremo:3are,bereremo:3are,leveremo:3are,oggeremo:3iare,alieremo:3are,mareremo:3are,meteremo:3are,plieremo:3are,puteremo:3are,nimeremo:3are,nideremo:3are,noderemo:3are,ulleremo:3are,unceremo:3iare,pareremo:3are,arteremo:3are,orteremo:3are,simeremo:3are,esteremo:3are,aggeremo:3iare,illeremo:3are,soderemo:3are,viveremo:3are,zereremo:3are,baceremo:3iare,baderemo:3are,bareremo:3are,ficeremo:3iare,erceremo:3iare,bigeremo:3iare,utteremo:3are,usseremo:3are,alceremo:3iare,dideremo:3are,cereremo:3are,ioderemo:3are,cimeremo:3are,auderemo:3are,sereremo:3are,muteremo:3are,ompiremo:4ere,leteremo:3are,reteremo:3are,ndurremo:6,futeremo:3are,gederemo:3are,dereremo:3are,nsteremo:3are,tumeremo:3are,urveremo:3are,nereremo:3are,nuderemo:3are,igneremo:3are,iareremo:3are,figeremo:3iare,logeremo:3iare,gereremo:3are,lareremo:3are,ugneremo:3are,irteremo:3are,fumeremo:3are,uideremo:3are,urreremo:3are,arneremo:3are,niceremo:3iare,timeremo:3are,bideremo:3are,odurremo:6,pideremo:3are,fereremo:3are,limeremo:3are,isceremo:3iare,loderemo:3are,arceremo:3iare,mimeremo:3are,muderemo:3are,blieremo:3are,olieremo:3are,squeremo:3are,pigeremo:3iare,careremo:3are,cqueremo:3are,luteremo:3are,liveremo:3are,alveremo:3are,irceremo:3iare,cemeremo:3are,hederemo:3are,hiveremo:3are,ruteremo:3are,sederemo:3are,elceremo:3iare,usceremo:3iare,pumeremo:3are,nuteremo:3are,suderemo:3are,tareremo:3are,adurremo:6,buteremo:3are,urteremo:3are,geteremo:3are,engeremo:3iare,aglieremo:4are,iglieremo:4are,bonderemo:4are,casceremo:4iare,certeremo:4are,cetteremo:4are,colleremo:4are,telleremo:4are,conceremo:4iare,corceremo:4iare,corderemo:4are,uieteremo:4are,uisteremo:4are,datteremo:4are,dotteremo:4are,fetteremo:4are,losceremo:4iare,folleremo:4are,hinderemo:4are,beggeremo:4iare,latteremo:4are,lerteremo:4are,lieteremo:4are,lungeremo:4are,terneremo:4are,basceremo:4iare,derneremo:4are,heggeremo:4iare,nelleremo:4are,proderemo:4are,ieggeremo:4iare,meggeremo:4iare,rrederemo:4are,rriveremo:4are,tonderemo:4are,petteremo:4are,segneremo:4are,getteremo:4are,sorderemo:4are,visteremo:4are,zarderemo:4are,betteremo:4are,barderemo:4are,benderemo:4are,linderemo:4are,cotteremo:4are,bolleremo:4are,botteremo:4are,borderemo:4are,seggeremo:4iare,rinderemo:4are,peggeremo:4iare,cangeremo:4iare,neggeremo:4iare,zeggeremo:4iare,selleremo:4are,cesseremo:4are,uetteremo:4are,manderemo:4are,minceremo:4iare,menderemo:4are,patteremo:4are,fesseremo:4are,serveremo:4are,olideremo:4are,nsumeremo:4are,tatteremo:4are,ratteremo:4are,rolleremo:4are,belleremo:4are,cremeremo:4are,deggeremo:4iare,dedurremo:7,degneremo:4are,prederemo:4are,detteremo:4are,irederemo:4are,rotteremo:4are,erederemo:4are,serteremo:4are,resseremo:4are,angueremo:4are,disteremo:4are,vieteremo:4are,uelleremo:4are,hetteremo:4are,fasceremo:4iare,gelleremo:4are,lotteremo:4are,forgeremo:4iare,retteremo:4are,froderemo:4are,gesseremo:4are,verneremo:4are,graderemo:4are,grideremo:4are,guaderemo:4are,uarderemo:4are,berneremo:4are,regneremo:4are,adiceremo:4iare,uglieremo:4are,ietteremo:4are,nonderemo:4are,udiceremo:4iare,alideremo:4are,crimeremo:4are,lasceremo:4iare,legneremo:4are,lesseremo:4are,linceremo:4iare,listeremo:4are,lorderemo:4are,mangeremo:4iare,matteremo:4are,delleremo:4are,molleremo:4are,monderemo:4are,notteremo:4are,iomberemo:4are,oetteremo:4are,priveremo:4are,relleremo:4are,risteremo:4are,catteremo:4are,bomberemo:4are,tomberemo:4are,tarderemo:4are,romberemo:4are,ronceremo:4are,vesceremo:4iare,aetteremo:4are,banderemo:4are,borreremo:4are,feggeremo:4iare,iotteremo:4are,rosceremo:4iare,sedurremo:7,sesseremo:4are,stemeremo:4are,misteremo:4are,sonderemo:4are,icideremo:4are,aligeremo:4iare,tremeremo:4are,ucideremo:4are,vesseremo:4are,idimeremo:4are,aleggeremo:5iare,lletteremo:5are,areggeremo:5iare,anetteremo:5are,moglieremo:5are,oreggeremo:5iare,ppelleremo:5are,ovelleremo:5are,econderemo:5are,tteggeremo:5iare,ncelleremo:5are,rconderemo:5are,nteggeremo:5iare,rteggeremo:5iare,steggeremo:5iare,treggeremo:5iare,iletteremo:5are,mpegneremo:5are,avelleremo:5are,lleggeremo:5iare,roglieremo:5are,rpelleremo:5are,voglieremo:5are,acelleremo:5are,schereremo:5are,oleggeremo:5iare,breggeremo:5iare,ossideremo:5are,esetteremo:5are,iesumeremo:5are,pingueremo:5are,veglieremo:5are,foglieremo:5are,poglieremo:5are,lteggeremo:5iare,cchereremo:5are,affonderemo:6are,cchiereremo:6are,erreggeremo:6iare,livelleremo:6are,schiereremo:6are,uccelleremo:6are,veleggeremo:6iare,faccenderemo:7are,sprofonderemo:8are,",
      "secondPlural": "e:éte,si:ete,are:erete,ere:rete,rre:3te,iare:erete,nere:rrete,nire:rrete,lere:rrete,cere:rrete,lire:4te,tire:4te,rire:4te,dire:4te,sire:4te,cire:4te,gere:4te,uire:4te,bire:4te,fire:4te,hire:4te,mere:4te,zire:4te,pire:4te,uere:4te,mire:4te,oire:4te,bere:4te,eire:4te,vire:4te,sere:4te,acare:2herete,hiare:2erete,liare:2erete,aiare:2erete,icare:2herete,rcare:2herete,ccare:2herete,onire:5te,viare:2erete,unire:5te,ogare:2herete,piare:2erete,anire:5te,ecare:2herete,edere:5te,ndere:5te,liere:5te,rrere:5te,scere:5te,scare:2herete,biare:2erete,ocare:2herete,egare:2herete,agare:2herete,rgare:2herete,udere:5te,tiare:2erete,fiare:2erete,oiare:2erete,riare:2erete,rdere:5te,idere:5te,inire:5te,ugare:2herete,diare:2erete,stere:5te,lvere:5te,efare:5te,rcere:5te,ncere:5te,icere:5te,miare:2erete,igare:2herete,ucare:2herete,lcare:2herete,niare:2erete,rnere:5te,erere:5te,etere:5te,acere:5te,mpere:5te,ziare:2erete,siare:2erete,utere:5te,sfare:5te,llere:5te,lgare:2herete,rvere:5te,rnire:5te,ggire:5te,gnire:5te,evere:5te,lcere:5te,uiare:2erete,agire:5te,gnere:5te,rtere:5te,attere:6te,radere:6te,ancare:3herete,ingare:3herete,rivere:6te,rodere:6te,uadere:6te,encare:3herete,vadere:6te,ottere:6te,angare:3herete,incare:3herete,mettere:etterete,nettere:7te,lettere:7te,tostare:7te,trafare:7te,mmettere:8te,omettere:8te,traffare:8te,imettere:8te,rmettere:8te,emettere:8te,olungare:5herete,praffare:8te,troncare:5herete,amettere:8te,ismettere:9te,itrasmettere:12te,==agire:5te,andare:3rete,are:3rete,dare:4te,dire:4te,emettere:8te,fare:4te,lenire:6te,mettere:7te,omettere:8te,radere:6te,ridare:6te,rifare:6te,ristare:7te,rodere:6te,scadere:7te,sciare:3erete,sfare:5te,smettere:8te,stare:5te,trasmettere:11te,troncare:5herete,unire:5te,re:2te==ferete:1are,zerete:1are,eerete:1are,inerete:2are,onerete:2are,olerete:2are,iterete:2are,tuerete:2are,urerete:2are,userete:2are,nterete:2are,pperete:2are,amerete:2are,aterete:2are,unerete:2are,ulerete:2are,nserete:2are,trerete:2are,verrete:2nire,bberete:2are,orerete:2are,brerete:2are,prerete:2are,nnerete:2are,rmerete:2are,ilerete:2are,irerete:2are,averete:2are,agerete:2iare,alerete:2are,enerete:2are,anerete:2are,rberete:2are,elerete:2are,oterete:2are,porrete:5,iperete:2are,terrete:2nere,overete:2are,lterete:2are,blerete:2are,eperete:2are,mmerete:2are,rarrete:5,nuerete:2are,rserete:2are,iserete:2are,aserete:2are,rlerete:2are,lmerete:2are,pterete:2are,oserete:2are,iberete:2are,frerete:2are,crerete:2are,plerete:2are,aperete:2are,uberete:2are,lperete:2are,egerete:2iare,dorrete:2lere,omerete:2are,operete:2are,grerete:2are,smerete:2are,varrete:2lere,rperete:2are,cuerete:2are,lserete:2are,dderete:2are,sperete:2are,duerete:2are,ugerete:2iare,oberete:2are,drerete:2are,vrerete:2are,uperete:2are,eserete:2are,parrete:3ere,marrete:2nere,lderete:2are,tmerete:2are,aberete:2are,vorrete:2lere,allerete:3are,asserete:3are,vererete:3are,ognerete:3are,itterete:3are,bdurrete:6,errerete:3are,isserete:3are,amperete:3are,arrerete:3are,asterete:3are,lererete:3are,heterete:3are,moderete:3are,agnerete:3are,osterete:3are,osserete:3are,ddurrete:6,eguerete:3are,pererete:3are,ornerete:3are,tererete:3are,fiderete:3are,ilierete:3are,ancerete:3iare,tiverete:3are,usterete:3are,mererete:3are,iuterete:3are,bererete:3are,leverete:3are,oggerete:3iare,alierete:3are,marerete:3are,meterete:3are,plierete:3are,puterete:3are,nimerete:3are,niderete:3are,noderete:3are,ullerete:3are,uncerete:3iare,parerete:3are,arterete:3are,orterete:3are,simerete:3are,esterete:3are,aggerete:3iare,illerete:3are,soderete:3are,viverete:3are,zererete:3are,bacerete:3iare,baderete:3are,barerete:3are,ficerete:3iare,ercerete:3iare,bigerete:3iare,utterete:3are,usserete:3are,alcerete:3iare,diderete:3are,cererete:3are,ioderete:3are,cimerete:3are,auderete:3are,sererete:3are,muterete:3are,ompirete:4ere,leterete:3are,reterete:3are,ndurrete:6,futerete:3are,gederete:3are,dererete:3are,nsterete:3are,tumerete:3are,urverete:3are,nererete:3are,nuderete:3are,ignerete:3are,iarerete:3are,figerete:3iare,logerete:3iare,gererete:3are,larerete:3are,ugnerete:3are,irterete:3are,fumerete:3are,uiderete:3are,urrerete:3are,arnerete:3are,nicerete:3iare,timerete:3are,biderete:3are,odurrete:6,piderete:3are,fererete:3are,limerete:3are,iscerete:3iare,loderete:3are,arcerete:3iare,mimerete:3are,muderete:3are,blierete:3are,olierete:3are,squerete:3are,pigerete:3iare,carerete:3are,cquerete:3are,luterete:3are,liverete:3are,alverete:3are,ircerete:3iare,cemerete:3are,hederete:3are,hiverete:3are,ruterete:3are,sederete:3are,elcerete:3iare,uscerete:3iare,pumerete:3are,nuterete:3are,suderete:3are,tarerete:3are,adurrete:6,buterete:3are,urterete:3are,geterete:3are,engerete:3iare,aglierete:4are,iglierete:4are,bonderete:4are,cascerete:4iare,certerete:4are,cetterete:4are,collerete:4are,tellerete:4are,concerete:4iare,corcerete:4iare,corderete:4are,uieterete:4are,uisterete:4are,datterete:4are,dotterete:4are,fetterete:4are,loscerete:4iare,follerete:4are,hinderete:4are,beggerete:4iare,latterete:4are,lerterete:4are,lieterete:4are,lungerete:4are,ternerete:4are,bascerete:4iare,dernerete:4are,heggerete:4iare,nellerete:4are,proderete:4are,ieggerete:4iare,meggerete:4iare,rrederete:4are,rriverete:4are,tonderete:4are,petterete:4are,segnerete:4are,getterete:4are,sorderete:4are,visterete:4are,zarderete:4are,betterete:4are,barderete:4are,benderete:4are,linderete:4are,cotterete:4are,bollerete:4are,botterete:4are,borderete:4are,seggerete:4iare,rinderete:4are,peggerete:4iare,cangerete:4iare,neggerete:4iare,zeggerete:4iare,sellerete:4are,cesserete:4are,uetterete:4are,manderete:4are,mincerete:4iare,menderete:4are,patterete:4are,fesserete:4are,serverete:4are,oliderete:4are,nsumerete:4are,tatterete:4are,ratterete:4are,rollerete:4are,bellerete:4are,cremerete:4are,deggerete:4iare,dedurrete:7,degnerete:4are,prederete:4are,detterete:4are,irederete:4are,rotterete:4are,erederete:4are,serterete:4are,resserete:4are,anguerete:4are,disterete:4are,vieterete:4are,uellerete:4are,hetterete:4are,fascerete:4iare,gellerete:4are,lotterete:4are,forgerete:4iare,retterete:4are,froderete:4are,gesserete:4are,vernerete:4are,graderete:4are,griderete:4are,guaderete:4are,uarderete:4are,bernerete:4are,regnerete:4are,adicerete:4iare,uglierete:4are,ietterete:4are,nonderete:4are,udicerete:4iare,aliderete:4are,crimerete:4are,lascerete:4iare,legnerete:4are,lesserete:4are,lincerete:4iare,listerete:4are,lorderete:4are,mangerete:4iare,matterete:4are,dellerete:4are,mollerete:4are,monderete:4are,notterete:4are,iomberete:4are,oetterete:4are,priverete:4are,rellerete:4are,risterete:4are,catterete:4are,bomberete:4are,tomberete:4are,tarderete:4are,romberete:4are,roncerete:4are,vescerete:4iare,aetterete:4are,banderete:4are,borrerete:4are,feggerete:4iare,iotterete:4are,roscerete:4iare,sedurrete:7,sesserete:4are,stemerete:4are,misterete:4are,sonderete:4are,iciderete:4are,aligerete:4iare,tremerete:4are,uciderete:4are,vesserete:4are,idimerete:4are,aleggerete:5iare,lletterete:5are,areggerete:5iare,anetterete:5are,moglierete:5are,oreggerete:5iare,ppellerete:5are,ovellerete:5are,econderete:5are,tteggerete:5iare,ncellerete:5are,rconderete:5are,nteggerete:5iare,rteggerete:5iare,steggerete:5iare,treggerete:5iare,iletterete:5are,mpegnerete:5are,avellerete:5are,lleggerete:5iare,roglierete:5are,rpellerete:5are,voglierete:5are,acellerete:5are,schererete:5are,oleggerete:5iare,breggerete:5iare,ossiderete:5are,esetterete:5are,iesumerete:5are,pinguerete:5are,veglierete:5are,foglierete:5are,poglierete:5are,lteggerete:5iare,cchererete:5are,affonderete:6are,cchiererete:6are,erreggerete:6iare,livellerete:6are,schiererete:6are,uccellerete:6are,veleggerete:6iare,faccenderete:7are,sprofonderete:8are,",
      "thirdPlural": "e:anno,si:anno,are:eranno,ere:ranno,iare:eranno,nere:rranno,nire:rranno,lere:rranno,cere:rranno,sere:aranno,gere:3anno,mere:3anno,uere:3anno,bere:3anno,acare:2heranno,hiare:2eranno,liare:2eranno,aiare:2eranno,icare:2heranno,rcare:2heranno,ccare:2heranno,onire:4anno,viare:2eranno,unire:4anno,ogare:2heranno,piare:2eranno,anire:4anno,ecare:2heranno,edere:4anno,ndere:4anno,liere:4anno,rrere:4anno,scere:4anno,scare:2heranno,biare:2eranno,ocare:2heranno,egare:2heranno,agare:2heranno,rgare:2heranno,udere:4anno,tiare:2eranno,fiare:2eranno,oiare:2eranno,riare:2eranno,rdere:4anno,idere:4anno,inire:4anno,ugare:2heranno,diare:2eranno,stere:4anno,lvere:4anno,efare:4anno,rcere:4anno,ncere:4anno,icere:4anno,miare:2eranno,igare:2heranno,ucare:2heranno,lcare:2heranno,niare:2eranno,rnere:4anno,erere:4anno,etere:4anno,acere:4anno,mpere:4anno,ziare:2eranno,siare:2eranno,utere:4anno,sfare:4anno,llere:4anno,lgare:2heranno,rvere:4anno,rnire:4anno,gnire:4anno,evere:4anno,lcere:4anno,uiare:2eranno,gnere:4anno,rtere:4anno,attere:5anno,radere:5anno,ancare:3heranno,ingare:3heranno,rivere:5anno,rodere:5anno,uadere:5anno,encare:3heranno,vadere:5anno,ottere:5anno,angare:3heranno,lenire:5anno,rifare:5anno,essere:5anno,incare:3heranno,mettere:etteranno,nettere:6anno,lettere:6anno,scadere:6anno,tostare:6anno,trafare:6anno,mmettere:7anno,omettere:7anno,traffare:7anno,imettere:7anno,emettere:7anno,rmettere:7anno,olungare:5heranno,praffare:7anno,troncare:5heranno,amettere:7anno,ismettere:8anno,itrasmettere:11anno,==andare:3ranno,are:3ranno,dare:3anno,emettere:7anno,fare:3anno,gire:3ànno,lenire:5anno,mettere:6anno,omettere:7anno,radere:5anno,ridare:5anno,rifare:5anno,ristare:6anno,rodere:5anno,scadere:6anno,sciare:3eranno,sfare:4anno,smettere:7anno,stare:4anno,trasmettere:10anno,troncare:5heranno,unire:4anno==feranno:1are,liranno:3e,zeranno:1are,tiranno:3e,riranno:3e,diranno:3e,siranno:3e,ciranno:3e,uiranno:3e,giranno:3e,eeranno:1are,biranno:3e,firanno:3e,hiranno:3e,ziranno:3e,miranno:3e,oiranno:3e,eiranno:3e,viranno:3e,ineranno:2are,oneranno:2are,oleranno:2are,iteranno:2are,tueranno:2are,ureranno:2are,useranno:2are,nteranno:2are,pperanno:2are,ameranno:2are,ateranno:2are,uneranno:2are,uleranno:2are,nseranno:2are,treranno:2are,verranno:2nire,bberanno:2are,oreranno:2are,breranno:2are,preranno:2are,nneranno:2are,rmeranno:2are,ileranno:2are,ireranno:2are,averanno:2are,ageranno:2iare,aleranno:2are,eneranno:2are,aneranno:2are,rberanno:2are,eleranno:2are,oteranno:2are,porranno:4e,iperanno:2are,terranno:2nere,overanno:2are,lteranno:2are,bleranno:2are,eperanno:2are,mmeranno:2are,rarranno:4e,nueranno:2are,rseranno:2are,iseranno:2are,aseranno:2are,rleranno:2are,lmeranno:2are,apiranno:4e,pteranno:2are,rpiranno:4e,oseranno:2are,iberanno:2are,freranno:2are,lpiranno:4e,epiranno:4e,upiranno:4e,creranno:2are,pleranno:2are,aperanno:2are,uberanno:2are,lperanno:2are,egeranno:2iare,dorranno:2lere,omeranno:2are,operanno:2are,greranno:2are,smeranno:2are,varranno:2lere,rperanno:2are,cueranno:2are,lseranno:2are,dderanno:2are,speranno:2are,dueranno:2are,ugeranno:2iare,oberanno:2are,dreranno:2are,vreranno:2are,uperanno:2are,eseranno:2are,parranno:3ere,marranno:2nere,lderanno:2are,tmeranno:2are,aberanno:2are,opiranno:4e,vorranno:2lere,alleranno:3are,asseranno:3are,vereranno:3are,ogneranno:3are,itteranno:3are,bdurranno:5e,erreranno:3are,isseranno:3are,amperanno:3are,arreranno:3are,asteranno:3are,lereranno:3are,heteranno:3are,moderanno:3are,agneranno:3are,osteranno:3are,osseranno:3are,ddurranno:5e,egueranno:3are,pereranno:3are,orneranno:3are,tereranno:3are,fideranno:3are,ilieranno:3are,anceranno:3iare,tiveranno:3are,usteranno:3are,mereranno:3are,iuteranno:3are,bereranno:3are,leveranno:3are,oggeranno:3iare,alieranno:3are,mareranno:3are,meteranno:3are,plieranno:3are,puteranno:3are,nimeranno:3are,nideranno:3are,noderanno:3are,ulleranno:3are,unceranno:3iare,pareranno:3are,arteranno:3are,orteranno:3are,simeranno:3are,esteranno:3are,aggeranno:3iare,illeranno:3are,soderanno:3are,viveranno:3are,zereranno:3are,baceranno:3iare,baderanno:3are,bareranno:3are,ficeranno:3iare,erceranno:3iare,bigeranno:3iare,utteranno:3are,usseranno:3are,alceranno:3iare,dideranno:3are,cereranno:3are,ioderanno:3are,cimeranno:3are,auderanno:3are,sereranno:3are,muteranno:3are,leteranno:3are,reteranno:3are,ndurranno:5e,futeranno:3are,gederanno:3are,dereranno:3are,nsteranno:3are,tumeranno:3are,urveranno:3are,nereranno:3are,nuderanno:3are,igneranno:3are,iareranno:3are,figeranno:3iare,logeranno:3iare,empiranno:5e,gereranno:3are,lareranno:3are,ugneranno:3are,irteranno:3are,fumeranno:3are,uideranno:3are,urreranno:3are,arneranno:3are,niceranno:3iare,timeranno:3are,bideranno:3are,odurranno:5e,pideranno:3are,fereranno:3are,limeranno:3are,isceranno:3iare,loderanno:3are,arceranno:3iare,mimeranno:3are,muderanno:3are,blieranno:3are,olieranno:3are,squeranno:3are,pigeranno:3iare,careranno:3are,cqueranno:3are,luteranno:3are,liveranno:3are,alveranno:3are,irceranno:3iare,cemeranno:3are,hederanno:3are,hiveranno:3are,ruteranno:3are,sederanno:3are,elceranno:3iare,usceranno:3iare,pumeranno:3are,nuteranno:3are,suderanno:3are,tareranno:3are,adurranno:5e,buteranno:3are,urteranno:3are,geteranno:3are,engeranno:3iare,aglieranno:4are,iglieranno:4are,bonderanno:4are,casceranno:4iare,certeranno:4are,cetteranno:4are,colleranno:4are,telleranno:4are,conceranno:4iare,corceranno:4iare,corderanno:4are,uieteranno:4are,uisteranno:4are,datteranno:4are,dotteranno:4are,fetteranno:4are,losceranno:4iare,folleranno:4are,hinderanno:4are,beggeranno:4iare,latteranno:4are,lerteranno:4are,lieteranno:4are,lungeranno:4are,terneranno:4are,basceranno:4iare,derneranno:4are,heggeranno:4iare,nelleranno:4are,proderanno:4are,ieggeranno:4iare,meggeranno:4iare,rrederanno:4are,rriveranno:4are,tonderanno:4are,petteranno:4are,segneranno:4are,getteranno:4are,sorderanno:4are,visteranno:4are,zarderanno:4are,betteranno:4are,barderanno:4are,benderanno:4are,linderanno:4are,cotteranno:4are,bolleranno:4are,botteranno:4are,borderanno:4are,seggeranno:4iare,rinderanno:4are,peggeranno:4iare,cangeranno:4iare,neggeranno:4iare,zeggeranno:4iare,selleranno:4are,cesseranno:4are,uetteranno:4are,manderanno:4are,minceranno:4iare,menderanno:4are,patteranno:4are,fesseranno:4are,serveranno:4are,olideranno:4are,nsumeranno:4are,tatteranno:4are,ratteranno:4are,rolleranno:4are,belleranno:4are,cremeranno:4are,deggeranno:4iare,dedurranno:6e,degneranno:4are,prederanno:4are,detteranno:4are,irederanno:4are,rotteranno:4are,erederanno:4are,serteranno:4are,resseranno:4are,angueranno:4are,disteranno:4are,vieteranno:4are,uelleranno:4are,hetteranno:4are,fasceranno:4iare,gelleranno:4are,lotteranno:4are,forgeranno:4iare,retteranno:4are,froderanno:4are,gesseranno:4are,verneranno:4are,graderanno:4are,grideranno:4are,guaderanno:4are,uarderanno:4are,berneranno:4are,regneranno:4are,adiceranno:4iare,uglieranno:4are,ietteranno:4are,nonderanno:4are,udiceranno:4iare,alideranno:4are,crimeranno:4are,lasceranno:4iare,legneranno:4are,lesseranno:4are,linceranno:4iare,listeranno:4are,lorderanno:4are,mangeranno:4iare,matteranno:4are,delleranno:4are,molleranno:4are,monderanno:4are,notteranno:4are,iomberanno:4are,oetteranno:4are,priveranno:4are,relleranno:4are,risteranno:4are,catteranno:4are,bomberanno:4are,tomberanno:4are,tarderanno:4are,romberanno:4are,ronceranno:4are,vesceranno:4iare,aetteranno:4are,banderanno:4are,borreranno:4are,feggeranno:4iare,iotteranno:4are,rosceranno:4iare,sedurranno:6e,sesseranno:4are,stemeranno:4are,misteranno:4are,sonderanno:4are,icideranno:4are,aligeranno:4iare,tremeranno:4are,ucideranno:4are,vesseranno:4are,idimeranno:4are,aleggeranno:5iare,lletteranno:5are,areggeranno:5iare,anetteranno:5are,moglieranno:5are,oreggeranno:5iare,ppelleranno:5are,ovelleranno:5are,econderanno:5are,tteggeranno:5iare,ncelleranno:5are,rconderanno:5are,nteggeranno:5iare,rteggeranno:5iare,steggeranno:5iare,treggeranno:5iare,iletteranno:5are,mpegneranno:5are,avelleranno:5are,lleggeranno:5iare,roglieranno:5are,rpelleranno:5are,voglieranno:5are,acelleranno:5are,schereranno:5are,oleggeranno:5iare,breggeranno:5iare,ossideranno:5are,esetteranno:5are,iesumeranno:5are,pingueranno:5are,veglieranno:5are,foglieranno:5are,poglieranno:5are,lteggeranno:5iare,cchereranno:5are,affonderanno:6are,cchiereranno:6are,erreggeranno:6iare,livelleranno:6are,schiereranno:6are,uccelleranno:6are,veleggeranno:6iare,faccenderanno:7are,sprofonderanno:8are,"
    },
    "conditional": {
      "first": "si:ei,are:erei,ere:rei,rre:3i,iare:erei,nere:rrei,nire:rrei,lere:rrei,cere:rrei,lire:4i,tire:4i,rire:4i,dire:4i,sire:4i,cire:4i,gere:4i,uire:4i,gire:4i,bire:4i,fire:4i,hire:4i,mere:4i,zire:4i,pire:4i,uere:4i,mire:4i,oire:4i,bere:4i,eire:4i,vire:4i,sere:4i,acare:2herei,hiare:2erei,liare:2erei,aiare:2erei,icare:2herei,rcare:2herei,ccare:2herei,onire:5i,viare:2erei,unire:5i,ogare:2herei,piare:2erei,anire:5i,ecare:2herei,ndere:5i,liere:5i,rrere:5i,scere:5i,scare:2herei,biare:2erei,ocare:2herei,egare:2herei,agare:2herei,rgare:2herei,udere:5i,tiare:2erei,fiare:2erei,oiare:2erei,riare:2erei,rdere:5i,idere:5i,inire:5i,ugare:2herei,diare:2erei,stere:5i,lvere:5i,efare:5i,rcere:5i,ncere:5i,icere:5i,miare:2erei,igare:2herei,ucare:2herei,lcare:2herei,niare:2erei,rnere:5i,erere:5i,etere:5i,acere:5i,mpere:5i,ziare:2erei,siare:2erei,utere:5i,sfare:5i,llere:5i,lgare:2herei,rvere:5i,rnire:5i,gnire:5i,evere:5i,uiare:2erei,gnere:5i,rtere:5i,attere:6i,radere:6i,cedere:6i,ancare:3herei,ingare:3herei,rivere:6i,iedere:6i,rodere:6i,redere:6i,uadere:6i,encare:3herei,vadere:6i,ottere:6i,angare:3herei,incare:3herei,mettere:etterei,nettere:7i,lettere:7i,tostare:7i,trafare:7i,mmettere:8i,omettere:8i,traffare:8i,imettere:8i,rmettere:8i,emettere:8i,olungare:5herei,praffare:8i,troncare:5herei,amettere:8i,ismettere:9i,itrasmettere:12i,==andare:3rei,are:3rei,cedere:6i,dare:4i,dire:4i,emettere:8i,fare:4i,ledere:6i,lenire:6i,mettere:7i,omettere:8i,radere:6i,ridare:6i,rifare:6i,ristare:7i,rodere:6i,scadere:7i,sciare:3erei,sfare:5i,smettere:8i,stare:5i,trasmettere:11i,troncare:5herei,unire:5i,re:2i==ferei:1are,zerei:1are,eerei:1are,inerei:2are,onerei:2are,olerei:2are,iterei:2are,tuerei:2are,urerei:2are,userei:2are,nterei:2are,pperei:2are,amerei:2are,aterei:2are,unerei:2are,ulerei:2are,nserei:2are,trerei:2are,verrei:2nire,bberei:2are,orerei:2are,brerei:2are,prerei:2are,nnerei:2are,rmerei:2are,ilerei:2are,irerei:2are,averei:2are,agerei:2iare,alerei:2are,enerei:2are,anerei:2are,rberei:2are,elerei:2are,oterei:2are,porrei:5,iperei:2are,terrei:2nere,overei:2are,lterei:2are,blerei:2are,eperei:2are,mmerei:2are,rarrei:5,nuerei:2are,rserei:2are,iserei:2are,aserei:2are,rlerei:2are,lmerei:2are,pterei:2are,oserei:2are,iberei:2are,frerei:2are,crerei:2are,plerei:2are,aperei:2are,uberei:2are,lperei:2are,egerei:2iare,dorrei:2lere,omerei:2are,operei:2are,ogerei:2iare,grerei:2are,smerei:2are,varrei:2lere,rperei:2are,cuerei:2are,lserei:2are,dderei:2are,sperei:2are,duerei:2are,ugerei:2iare,oberei:2are,drerei:2are,vrerei:2are,uperei:2are,eserei:2are,parrei:3ere,marrei:2nere,lderei:2are,tmerei:2are,aberei:2are,vorrei:2lere,allerei:3are,asserei:3are,vererei:3are,ognerei:3are,itterei:3are,bdurrei:6,errerei:3are,isserei:3are,amperei:3are,arrerei:3are,asterei:3are,lererei:3are,heterei:3are,moderei:3are,agnerei:3are,osterei:3are,osserei:3are,ddurrei:6,eguerei:3are,pererei:3are,ornerei:3are,tererei:3are,fiderei:3are,ilierei:3are,ancerei:3iare,tiverei:3are,usterei:3are,mererei:3are,iuterei:3are,bererei:3are,leverei:3are,oggerei:3iare,alierei:3are,marerei:3are,meterei:3are,plierei:3are,puterei:3are,nimerei:3are,niderei:3are,noderei:3are,ullerei:3are,uncerei:3iare,parerei:3are,arterei:3are,orterei:3are,simerei:3are,esterei:3are,aggerei:3iare,illerei:3are,soderei:3are,viverei:3are,zererei:3are,bacerei:3iare,baderei:3are,barerei:3are,ficerei:3iare,ercerei:3iare,bigerei:3iare,utterei:3are,usserei:3are,diderei:3are,cererei:3are,ioderei:3are,cimerei:3are,auderei:3are,sererei:3are,muterei:3are,ompirei:4ere,leterei:3are,reterei:3are,ndurrei:6,futerei:3are,gederei:3are,dererei:3are,nsterei:3are,tumerei:3are,urverei:3are,nererei:3are,nuderei:3are,ignerei:3are,iarerei:3are,figerei:3iare,gererei:3are,larerei:3are,ugnerei:3are,irterei:3are,fumerei:3are,uiderei:3are,urrerei:3are,arnerei:3are,nicerei:3iare,timerei:3are,biderei:3are,odurrei:6,piderei:3are,fererei:3are,limerei:3are,iscerei:3iare,loderei:3are,arcerei:3iare,mimerei:3are,muderei:3are,blierei:3are,olierei:3are,squerei:3are,pigerei:3iare,carerei:3are,cquerei:3are,luterei:3are,liverei:3are,alverei:3are,ircerei:3iare,cemerei:3are,hederei:3are,hiverei:3are,ruterei:3are,sederei:3are,uscerei:3iare,pumerei:3are,nuterei:3are,suderei:3are,tarerei:3are,adurrei:6,buterei:3are,urterei:3are,geterei:3are,engerei:3iare,aglierei:4are,iglierei:4are,bonderei:4are,cascerei:4iare,certerei:4are,cetterei:4are,collerei:4are,tellerei:4are,concerei:4iare,corcerei:4iare,corderei:4are,uieterei:4are,uisterei:4are,datterei:4are,dotterei:4are,fetterei:4are,loscerei:4iare,follerei:4are,hinderei:4are,beggerei:4iare,latterei:4are,lerterei:4are,lieterei:4are,lungerei:4are,ternerei:4are,bascerei:4iare,dernerei:4are,heggerei:4iare,nellerei:4are,proderei:4are,ieggerei:4iare,meggerei:4iare,rrederei:4are,rriverei:4are,tonderei:4are,petterei:4are,segnerei:4are,getterei:4are,sorderei:4are,visterei:4are,zarderei:4are,betterei:4are,barderei:4are,benderei:4are,linderei:4are,cotterei:4are,bollerei:4are,botterei:4are,borderei:4are,seggerei:4iare,rinderei:4are,peggerei:4iare,cangerei:4iare,neggerei:4iare,zeggerei:4iare,sellerei:4are,cesserei:4are,uetterei:4are,manderei:4are,mincerei:4iare,menderei:4are,patterei:4are,fesserei:4are,serverei:4are,oliderei:4are,nsumerei:4are,tatterei:4are,ratterei:4are,rollerei:4are,bellerei:4are,cremerei:4are,deggerei:4iare,dedurrei:7,degnerei:4are,prederei:4are,detterei:4are,irederei:4are,rotterei:4are,erederei:4are,serterei:4are,resserei:4are,anguerei:4are,disterei:4are,vieterei:4are,uellerei:4are,hetterei:4are,fascerei:4iare,gellerei:4are,lotterei:4are,forgerei:4iare,retterei:4are,froderei:4are,gesserei:4are,vernerei:4are,graderei:4are,griderei:4are,guaderei:4are,uarderei:4are,bernerei:4are,regnerei:4are,adicerei:4iare,uglierei:4are,ietterei:4are,nonderei:4are,udicerei:4iare,aliderei:4are,crimerei:4are,lascerei:4iare,legnerei:4are,lesserei:4are,lincerei:4iare,listerei:4are,lorderei:4are,mangerei:4iare,matterei:4are,dellerei:4are,mollerei:4are,monderei:4are,notterei:4are,iomberei:4are,oetterei:4are,priverei:4are,rellerei:4are,risterei:4are,catterei:4are,bomberei:4are,tomberei:4are,tarderei:4are,romberei:4are,roncerei:4are,vescerei:4iare,aetterei:4are,banderei:4are,borrerei:4are,feggerei:4iare,iotterei:4are,roscerei:4iare,sedurrei:7,sesserei:4are,stemerei:4are,misterei:4are,sonderei:4are,iciderei:4are,aligerei:4iare,tremerei:4are,uciderei:4are,vesserei:4are,idimerei:4are,aleggerei:5iare,lletterei:5are,areggerei:5iare,anetterei:5are,moglierei:5are,oreggerei:5iare,ppellerei:5are,ovellerei:5are,econderei:5are,tteggerei:5iare,ncellerei:5are,rconderei:5are,nteggerei:5iare,rteggerei:5iare,steggerei:5iare,treggerei:5iare,iletterei:5are,mpegnerei:5are,avellerei:5are,lleggerei:5iare,roglierei:5are,rpellerei:5are,voglierei:5are,acellerei:5are,schererei:5are,oleggerei:5iare,breggerei:5iare,ossiderei:5are,esetterei:5are,iesumerei:5are,pinguerei:5are,veglierei:5are,foglierei:5are,poglierei:5are,lteggerei:5iare,cchererei:5are,affonderei:6are,cchiererei:6are,erreggerei:6iare,livellerei:6are,schiererei:6are,uccellerei:6are,veleggerei:6iare,faccenderei:7are,sprofonderei:8are,",
      "second": "si:esti,are:eresti,ere:resti,rre:3sti,iare:eresti,nere:rresti,nire:rresti,lere:rresti,cere:rresti,sere:ti,lire:4sti,tire:4sti,rire:4sti,dire:4sti,sire:4sti,cire:4sti,gere:4sti,uire:4sti,gire:4sti,bire:4sti,fire:4sti,hire:4sti,mere:4sti,zire:4sti,pire:4sti,uere:4sti,mire:4sti,oire:4sti,bere:4sti,eire:4sti,vire:4sti,acare:2heresti,hiare:2eresti,liare:2eresti,aiare:2eresti,icare:2heresti,rcare:2heresti,ccare:2heresti,onire:5sti,viare:2eresti,unire:5sti,ogare:2heresti,piare:2eresti,anire:5sti,ecare:2heresti,ndere:5sti,liere:5sti,rrere:5sti,scere:5sti,scare:2heresti,biare:2eresti,ocare:2heresti,egare:2heresti,agare:2heresti,rgare:2heresti,udere:5sti,tiare:2eresti,fiare:2eresti,oiare:2eresti,riare:2eresti,rdere:5sti,idere:5sti,inire:5sti,ugare:2heresti,diare:2eresti,stere:5sti,lvere:5sti,efare:5sti,rcere:5sti,ncere:5sti,icere:5sti,miare:2eresti,igare:2heresti,ucare:2heresti,lcare:2heresti,niare:2eresti,rnere:5sti,erere:5sti,etere:5sti,acere:5sti,mpere:5sti,ziare:2eresti,siare:2eresti,utere:5sti,sfare:5sti,llere:5sti,lgare:2heresti,rvere:5sti,rnire:5sti,gnire:5sti,evere:5sti,uiare:2eresti,gnere:5sti,rtere:5sti,attere:6sti,radere:6sti,cedere:6sti,ancare:3heresti,ingare:3heresti,rivere:6sti,iedere:6sti,rodere:6sti,redere:6sti,uadere:6sti,encare:3heresti,vadere:6sti,ottere:6sti,angare:3heresti,incare:3heresti,mettere:etteresti,nettere:7sti,lettere:7sti,tostare:7sti,trafare:7sti,mmettere:8sti,omettere:8sti,traffare:8sti,imettere:8sti,rmettere:8sti,emettere:8sti,olungare:5heresti,praffare:8sti,troncare:5heresti,amettere:8sti,ismettere:9sti,itrasmettere:12sti,==andare:3resti,are:3resti,cedere:6sti,dare:4sti,dire:4sti,emettere:8sti,fare:4sti,ledere:6sti,lenire:6sti,mettere:7sti,omettere:8sti,radere:6sti,ridare:6sti,rifare:6sti,ristare:7sti,rodere:6sti,scadere:7sti,sciare:3eresti,sfare:5sti,smettere:8sti,stare:5sti,tessere:7sti,trasmettere:11sti,troncare:5heresti,unire:5sti==feresti:1are,zeresti:1are,eeresti:1are,ineresti:2are,oneresti:2are,oleresti:2are,iteresti:2are,tueresti:2are,ureresti:2are,useresti:2are,nteresti:2are,pperesti:2are,ameresti:2are,ateresti:2are,uneresti:2are,uleresti:2are,nseresti:2are,treresti:2are,verresti:2nire,bberesti:2are,oreresti:2are,breresti:2are,preresti:2are,nneresti:2are,rmeresti:2are,ileresti:2are,ireresti:2are,averesti:2are,ageresti:2iare,aleresti:2are,eneresti:2are,aneresti:2are,rberesti:2are,eleresti:2are,oteresti:2are,porresti:5,iperesti:2are,terresti:2nere,overesti:2are,lteresti:2are,bleresti:2are,eperesti:2are,mmeresti:2are,rarresti:5,nueresti:2are,rseresti:2are,iseresti:2are,aseresti:2are,rleresti:2are,lmeresti:2are,pteresti:2are,oseresti:2are,iberesti:2are,freresti:2are,creresti:2are,pleresti:2are,aperesti:2are,uberesti:2are,lperesti:2are,egeresti:2iare,dorresti:2lere,omeresti:2are,operesti:2are,ogeresti:2iare,greresti:2are,smeresti:2are,varresti:2lere,rperesti:2are,cueresti:2are,lseresti:2are,dderesti:2are,speresti:2are,dueresti:2are,ugeresti:2iare,oberesti:2are,dreresti:2are,vreresti:2are,uperesti:2are,eseresti:2are,parresti:3ere,marresti:2nere,lderesti:2are,tmeresti:2are,aberesti:2are,vorresti:2lere,alleresti:3are,asseresti:3are,vereresti:3are,ogneresti:3are,itteresti:3are,bdurresti:6,erreresti:3are,isseresti:3are,amperesti:3are,arreresti:3are,asteresti:3are,lereresti:3are,heteresti:3are,moderesti:3are,agneresti:3are,osteresti:3are,osseresti:3are,ddurresti:6,egueresti:3are,pereresti:3are,orneresti:3are,tereresti:3are,fideresti:3are,ilieresti:3are,anceresti:3iare,tiveresti:3are,usteresti:3are,mereresti:3are,iuteresti:3are,bereresti:3are,leveresti:3are,oggeresti:3iare,alieresti:3are,mareresti:3are,meteresti:3are,plieresti:3are,puteresti:3are,nimeresti:3are,nideresti:3are,noderesti:3are,ulleresti:3are,unceresti:3iare,pareresti:3are,arteresti:3are,orteresti:3are,simeresti:3are,esteresti:3are,aggeresti:3iare,illeresti:3are,soderesti:3are,viveresti:3are,zereresti:3are,baceresti:3iare,baderesti:3are,bareresti:3are,ficeresti:3iare,erceresti:3iare,bigeresti:3iare,utteresti:3are,usseresti:3are,dideresti:3are,cereresti:3are,ioderesti:3are,cimeresti:3are,auderesti:3are,sereresti:3are,muteresti:3are,ompiresti:4ere,leteresti:3are,reteresti:3are,ndurresti:6,futeresti:3are,gederesti:3are,dereresti:3are,nsteresti:3are,tumeresti:3are,urveresti:3are,nereresti:3are,nuderesti:3are,igneresti:3are,iareresti:3are,figeresti:3iare,gereresti:3are,lareresti:3are,ugneresti:3are,irteresti:3are,fumeresti:3are,uideresti:3are,urreresti:3are,arneresti:3are,niceresti:3iare,timeresti:3are,bideresti:3are,odurresti:6,pideresti:3are,fereresti:3are,limeresti:3are,isceresti:3iare,loderesti:3are,arceresti:3iare,mimeresti:3are,muderesti:3are,blieresti:3are,olieresti:3are,squeresti:3are,pigeresti:3iare,careresti:3are,cqueresti:3are,luteresti:3are,liveresti:3are,alveresti:3are,irceresti:3iare,cemeresti:3are,hederesti:3are,hiveresti:3are,ruteresti:3are,sederesti:3are,usceresti:3iare,pumeresti:3are,nuteresti:3are,suderesti:3are,tareresti:3are,adurresti:6,buteresti:3are,urteresti:3are,geteresti:3are,engeresti:3iare,aglieresti:4are,iglieresti:4are,bonderesti:4are,casceresti:4iare,certeresti:4are,cetteresti:4are,colleresti:4are,telleresti:4are,conceresti:4iare,corceresti:4iare,corderesti:4are,uieteresti:4are,uisteresti:4are,datteresti:4are,dotteresti:4are,fetteresti:4are,losceresti:4iare,folleresti:4are,hinderesti:4are,beggeresti:4iare,latteresti:4are,lerteresti:4are,lieteresti:4are,lungeresti:4are,terneresti:4are,basceresti:4iare,derneresti:4are,heggeresti:4iare,nelleresti:4are,proderesti:4are,ieggeresti:4iare,meggeresti:4iare,rrederesti:4are,rriveresti:4are,tonderesti:4are,petteresti:4are,segneresti:4are,getteresti:4are,sorderesti:4are,visteresti:4are,zarderesti:4are,betteresti:4are,barderesti:4are,benderesti:4are,linderesti:4are,cotteresti:4are,bolleresti:4are,botteresti:4are,borderesti:4are,seggeresti:4iare,rinderesti:4are,peggeresti:4iare,cangeresti:4iare,neggeresti:4iare,zeggeresti:4iare,selleresti:4are,cesseresti:4are,uetteresti:4are,manderesti:4are,minceresti:4iare,menderesti:4are,patteresti:4are,fesseresti:4are,serveresti:4are,olideresti:4are,nsumeresti:4are,tatteresti:4are,ratteresti:4are,rolleresti:4are,belleresti:4are,cremeresti:4are,deggeresti:4iare,dedurresti:7,degneresti:4are,prederesti:4are,detteresti:4are,irederesti:4are,rotteresti:4are,erederesti:4are,serteresti:4are,resseresti:4are,angueresti:4are,disteresti:4are,vieteresti:4are,uelleresti:4are,hetteresti:4are,fasceresti:4iare,gelleresti:4are,lotteresti:4are,forgeresti:4iare,retteresti:4are,froderesti:4are,gesseresti:4are,verneresti:4are,graderesti:4are,grideresti:4are,guaderesti:4are,uarderesti:4are,berneresti:4are,regneresti:4are,adiceresti:4iare,uglieresti:4are,ietteresti:4are,nonderesti:4are,udiceresti:4iare,alideresti:4are,crimeresti:4are,lasceresti:4iare,legneresti:4are,lesseresti:4are,linceresti:4iare,listeresti:4are,lorderesti:4are,mangeresti:4iare,matteresti:4are,delleresti:4are,molleresti:4are,monderesti:4are,notteresti:4are,iomberesti:4are,oetteresti:4are,priveresti:4are,relleresti:4are,risteresti:4are,catteresti:4are,bomberesti:4are,tomberesti:4are,tarderesti:4are,romberesti:4are,ronceresti:4are,vesceresti:4iare,aetteresti:4are,banderesti:4are,borreresti:4are,feggeresti:4iare,iotteresti:4are,rosceresti:4iare,sedurresti:7,sesseresti:4are,stemeresti:4are,misteresti:4are,sonderesti:4are,icideresti:4are,aligeresti:4iare,tremeresti:4are,ucideresti:4are,vesseresti:4are,idimeresti:4are,aleggeresti:5iare,lletteresti:5are,areggeresti:5iare,anetteresti:5are,moglieresti:5are,oreggeresti:5iare,ppelleresti:5are,ovelleresti:5are,econderesti:5are,tteggeresti:5iare,ncelleresti:5are,rconderesti:5are,nteggeresti:5iare,rteggeresti:5iare,steggeresti:5iare,treggeresti:5iare,iletteresti:5are,mpegneresti:5are,avelleresti:5are,lleggeresti:5iare,roglieresti:5are,rpelleresti:5are,voglieresti:5are,acelleresti:5are,schereresti:5are,oleggeresti:5iare,breggeresti:5iare,ossideresti:5are,esetteresti:5are,iesumeresti:5are,pingueresti:5are,veglieresti:5are,foglieresti:5are,poglieresti:5are,lteggeresti:5iare,cchereresti:5are,affonderesti:6are,cchiereresti:6are,erreggeresti:6iare,livelleresti:6are,schiereresti:6are,uccelleresti:6are,veleggeresti:6iare,faccenderesti:7are,sprofonderesti:8are,",
      "third": "si:ebbe,are:erebbe,ere:rebbe,rre:3bbe,iare:erebbe,nere:rrebbe,nire:rrebbe,lere:rrebbe,cere:rrebbe,lire:4bbe,tire:4bbe,rire:4bbe,dire:4bbe,sire:4bbe,cire:4bbe,gere:4bbe,uire:4bbe,gire:4bbe,bire:4bbe,fire:4bbe,hire:4bbe,mere:4bbe,zire:4bbe,pire:4bbe,uere:4bbe,mire:4bbe,oire:4bbe,bere:4bbe,eire:4bbe,vire:4bbe,sere:4bbe,acare:2herebbe,hiare:2erebbe,liare:2erebbe,aiare:2erebbe,icare:2herebbe,rcare:2herebbe,ccare:2herebbe,onire:5bbe,viare:2erebbe,unire:5bbe,ogare:2herebbe,piare:2erebbe,anire:5bbe,ecare:2herebbe,ndere:5bbe,liere:5bbe,rrere:5bbe,scere:5bbe,scare:2herebbe,biare:2erebbe,ocare:2herebbe,egare:2herebbe,agare:2herebbe,rgare:2herebbe,udere:5bbe,tiare:2erebbe,fiare:2erebbe,oiare:2erebbe,riare:2erebbe,rdere:5bbe,idere:5bbe,inire:5bbe,ugare:2herebbe,diare:2erebbe,stere:5bbe,lvere:5bbe,efare:5bbe,rcere:5bbe,ncere:5bbe,icere:5bbe,miare:2erebbe,igare:2herebbe,ucare:2herebbe,lcare:2herebbe,niare:2erebbe,rnere:5bbe,erere:5bbe,etere:5bbe,acere:5bbe,mpere:5bbe,ziare:2erebbe,siare:2erebbe,utere:5bbe,sfare:5bbe,llere:5bbe,lgare:2herebbe,rvere:5bbe,rnire:5bbe,gnire:5bbe,evere:5bbe,uiare:2erebbe,gnere:5bbe,rtere:5bbe,attere:6bbe,radere:6bbe,cedere:6bbe,ancare:3herebbe,ingare:3herebbe,rivere:6bbe,iedere:6bbe,rodere:6bbe,redere:6bbe,uadere:6bbe,encare:3herebbe,vadere:6bbe,ottere:6bbe,angare:3herebbe,incare:3herebbe,mettere:etterebbe,nettere:7bbe,lettere:7bbe,vvivere:7bbe,tostare:7bbe,trafare:7bbe,mmettere:8bbe,omettere:8bbe,traffare:8bbe,imettere:8bbe,rmettere:8bbe,emettere:8bbe,olungare:5herebbe,praffare:8bbe,troncare:5herebbe,amettere:8bbe,ismettere:9bbe,itrasmettere:12bbe,==andare:3rebbe,are:3rebbe,cedere:6bbe,dare:4bbe,dire:4bbe,emettere:8bbe,fare:4bbe,ledere:6bbe,lenire:6bbe,mettere:7bbe,omettere:8bbe,radere:6bbe,ridare:6bbe,rifare:6bbe,ristare:7bbe,rodere:6bbe,scadere:7bbe,sciare:3erebbe,sfare:5bbe,smettere:8bbe,stare:5bbe,trasmettere:11bbe,troncare:5herebbe,unire:5bbe,re:2bbe==ferebbe:1are,zerebbe:1are,eerebbe:1are,inerebbe:2are,onerebbe:2are,olerebbe:2are,iterebbe:2are,tuerebbe:2are,urerebbe:2are,userebbe:2are,nterebbe:2are,pperebbe:2are,amerebbe:2are,aterebbe:2are,unerebbe:2are,ulerebbe:2are,nserebbe:2are,trerebbe:2are,verrebbe:2nire,bberebbe:2are,orerebbe:2are,brerebbe:2are,prerebbe:2are,nnerebbe:2are,rmerebbe:2are,ilerebbe:2are,irerebbe:2are,averebbe:2are,agerebbe:2iare,alerebbe:2are,enerebbe:2are,anerebbe:2are,rberebbe:2are,elerebbe:2are,oterebbe:2are,porrebbe:5,iperebbe:2are,terrebbe:2nere,overebbe:2are,lterebbe:2are,blerebbe:2are,eperebbe:2are,mmerebbe:2are,rarrebbe:5,nuerebbe:2are,rserebbe:2are,iserebbe:2are,aserebbe:2are,rlerebbe:2are,lmerebbe:2are,pterebbe:2are,oserebbe:2are,iberebbe:2are,frerebbe:2are,crerebbe:2are,plerebbe:2are,aperebbe:2are,uberebbe:2are,lperebbe:2are,egerebbe:2iare,dorrebbe:2lere,omerebbe:2are,operebbe:2are,ogerebbe:2iare,grerebbe:2are,smerebbe:2are,varrebbe:2lere,rperebbe:2are,cuerebbe:2are,lserebbe:2are,dderebbe:2are,sperebbe:2are,duerebbe:2are,ugerebbe:2iare,oberebbe:2are,drerebbe:2are,vrerebbe:2are,uperebbe:2are,eserebbe:2are,parrebbe:3ere,marrebbe:2nere,lderebbe:2are,tmerebbe:2are,aberebbe:2are,vorrebbe:2lere,allerebbe:3are,asserebbe:3are,vererebbe:3are,ognerebbe:3are,itterebbe:3are,bdurrebbe:6,errerebbe:3are,isserebbe:3are,amperebbe:3are,arrerebbe:3are,asterebbe:3are,lererebbe:3are,heterebbe:3are,moderebbe:3are,agnerebbe:3are,osterebbe:3are,osserebbe:3are,ddurrebbe:6,eguerebbe:3are,pererebbe:3are,ornerebbe:3are,tererebbe:3are,fiderebbe:3are,ilierebbe:3are,ancerebbe:3iare,tiverebbe:3are,usterebbe:3are,mererebbe:3are,iuterebbe:3are,bererebbe:3are,leverebbe:3are,oggerebbe:3iare,alierebbe:3are,marerebbe:3are,meterebbe:3are,plierebbe:3are,puterebbe:3are,nimerebbe:3are,niderebbe:3are,noderebbe:3are,ullerebbe:3are,uncerebbe:3iare,parerebbe:3are,arterebbe:3are,orterebbe:3are,simerebbe:3are,esterebbe:3are,aggerebbe:3iare,illerebbe:3are,soderebbe:3are,zererebbe:3are,bacerebbe:3iare,baderebbe:3are,barerebbe:3are,ficerebbe:3iare,ercerebbe:3iare,bigerebbe:3iare,utterebbe:3are,usserebbe:3are,diderebbe:3are,cererebbe:3are,ioderebbe:3are,cimerebbe:3are,auderebbe:3are,sererebbe:3are,muterebbe:3are,ompirebbe:4ere,leterebbe:3are,reterebbe:3are,ndurrebbe:6,futerebbe:3are,gederebbe:3are,dererebbe:3are,nsterebbe:3are,tumerebbe:3are,urverebbe:3are,nererebbe:3are,nuderebbe:3are,ignerebbe:3are,iarerebbe:3are,figerebbe:3iare,gererebbe:3are,larerebbe:3are,ugnerebbe:3are,irterebbe:3are,fumerebbe:3are,uiderebbe:3are,urrerebbe:3are,arnerebbe:3are,nicerebbe:3iare,timerebbe:3are,biderebbe:3are,odurrebbe:6,piderebbe:3are,fererebbe:3are,limerebbe:3are,iscerebbe:3iare,loderebbe:3are,arcerebbe:3iare,mimerebbe:3are,muderebbe:3are,blierebbe:3are,olierebbe:3are,squerebbe:3are,pigerebbe:3iare,carerebbe:3are,cquerebbe:3are,luterebbe:3are,liverebbe:3are,alverebbe:3are,ircerebbe:3iare,cemerebbe:3are,hederebbe:3are,hiverebbe:3are,ruterebbe:3are,sederebbe:3are,uscerebbe:3iare,pumerebbe:3are,nuterebbe:3are,suderebbe:3are,tarerebbe:3are,adurrebbe:6,buterebbe:3are,urterebbe:3are,geterebbe:3are,engerebbe:3iare,aglierebbe:4are,iglierebbe:4are,bonderebbe:4are,cascerebbe:4iare,certerebbe:4are,cetterebbe:4are,collerebbe:4are,tellerebbe:4are,concerebbe:4iare,corcerebbe:4iare,corderebbe:4are,uieterebbe:4are,uisterebbe:4are,datterebbe:4are,dotterebbe:4are,fetterebbe:4are,loscerebbe:4iare,follerebbe:4are,hinderebbe:4are,beggerebbe:4iare,latterebbe:4are,lerterebbe:4are,lieterebbe:4are,lungerebbe:4are,ternerebbe:4are,bascerebbe:4iare,dernerebbe:4are,heggerebbe:4iare,nellerebbe:4are,proderebbe:4are,ieggerebbe:4iare,meggerebbe:4iare,rrederebbe:4are,rriverebbe:4are,tonderebbe:4are,petterebbe:4are,segnerebbe:4are,getterebbe:4are,sorderebbe:4are,visterebbe:4are,zarderebbe:4are,betterebbe:4are,barderebbe:4are,benderebbe:4are,linderebbe:4are,cotterebbe:4are,bollerebbe:4are,botterebbe:4are,borderebbe:4are,seggerebbe:4iare,rinderebbe:4are,peggerebbe:4iare,cangerebbe:4iare,neggerebbe:4iare,zeggerebbe:4iare,sellerebbe:4are,cesserebbe:4are,uetterebbe:4are,manderebbe:4are,mincerebbe:4iare,menderebbe:4are,patterebbe:4are,fesserebbe:4are,serverebbe:4are,oliderebbe:4are,nsumerebbe:4are,tatterebbe:4are,ratterebbe:4are,rollerebbe:4are,bellerebbe:4are,cremerebbe:4are,deggerebbe:4iare,dedurrebbe:7,degnerebbe:4are,prederebbe:4are,detterebbe:4are,irederebbe:4are,rotterebbe:4are,erederebbe:4are,serterebbe:4are,resserebbe:4are,anguerebbe:4are,disterebbe:4are,vieterebbe:4are,uellerebbe:4are,hetterebbe:4are,fascerebbe:4iare,gellerebbe:4are,lotterebbe:4are,forgerebbe:4iare,retterebbe:4are,froderebbe:4are,gesserebbe:4are,vernerebbe:4are,graderebbe:4are,griderebbe:4are,guaderebbe:4are,uarderebbe:4are,bernerebbe:4are,regnerebbe:4are,adicerebbe:4iare,uglierebbe:4are,ietterebbe:4are,nonderebbe:4are,udicerebbe:4iare,aliderebbe:4are,crimerebbe:4are,lascerebbe:4iare,legnerebbe:4are,lesserebbe:4are,lincerebbe:4iare,listerebbe:4are,lorderebbe:4are,mangerebbe:4iare,matterebbe:4are,dellerebbe:4are,mollerebbe:4are,monderebbe:4are,notterebbe:4are,iomberebbe:4are,oetterebbe:4are,priverebbe:4are,rellerebbe:4are,risterebbe:4are,catterebbe:4are,bomberebbe:4are,tomberebbe:4are,tarderebbe:4are,romberebbe:4are,roncerebbe:4are,vescerebbe:4iare,aetterebbe:4are,banderebbe:4are,borrerebbe:4are,feggerebbe:4iare,iotterebbe:4are,roscerebbe:4iare,sedurrebbe:7,sesserebbe:4are,stemerebbe:4are,misterebbe:4are,sonderebbe:4are,iciderebbe:4are,aligerebbe:4iare,tremerebbe:4are,uciderebbe:4are,vesserebbe:4are,idimerebbe:4are,aleggerebbe:5iare,lletterebbe:5are,areggerebbe:5iare,anetterebbe:5are,moglierebbe:5are,oreggerebbe:5iare,ppellerebbe:5are,ovellerebbe:5are,econderebbe:5are,tteggerebbe:5iare,ncellerebbe:5are,rconderebbe:5are,nteggerebbe:5iare,rteggerebbe:5iare,steggerebbe:5iare,treggerebbe:5iare,iletterebbe:5are,mpegnerebbe:5are,avellerebbe:5are,lleggerebbe:5iare,roglierebbe:5are,rpellerebbe:5are,voglierebbe:5are,acellerebbe:5are,schererebbe:5are,oleggerebbe:5iare,breggerebbe:5iare,ossiderebbe:5are,esetterebbe:5are,iesumerebbe:5are,pinguerebbe:5are,veglierebbe:5are,foglierebbe:5are,poglierebbe:5are,lteggerebbe:5iare,cchererebbe:5are,affonderebbe:6are,cchiererebbe:6are,erreggerebbe:6iare,livellerebbe:6are,schiererebbe:6are,uccellerebbe:6are,veleggerebbe:6iare,faccenderebbe:7are,sprofonderebbe:8are,",
      "firstPlural": "si:emmo,are:eremmo,ere:remmo,rre:3mmo,iare:eremmo,nere:rremmo,nire:rremmo,lere:rremmo,cere:rremmo,lire:4mmo,tire:4mmo,rire:4mmo,dire:4mmo,sire:4mmo,cire:4mmo,gere:4mmo,uire:4mmo,gire:4mmo,bire:4mmo,fire:4mmo,hire:4mmo,mere:4mmo,zire:4mmo,pire:4mmo,uere:4mmo,mire:4mmo,oire:4mmo,bere:4mmo,eire:4mmo,vire:4mmo,sere:4mmo,acare:2heremmo,hiare:2eremmo,liare:2eremmo,aiare:2eremmo,icare:2heremmo,rcare:2heremmo,ccare:2heremmo,onire:5mmo,viare:2eremmo,unire:5mmo,ogare:2heremmo,piare:2eremmo,anire:5mmo,ecare:2heremmo,ndere:5mmo,liere:5mmo,rrere:5mmo,scere:5mmo,scare:2heremmo,biare:2eremmo,ocare:2heremmo,egare:2heremmo,agare:2heremmo,rgare:2heremmo,udere:5mmo,tiare:2eremmo,fiare:2eremmo,oiare:2eremmo,riare:2eremmo,rdere:5mmo,idere:5mmo,inire:5mmo,ugare:2heremmo,diare:2eremmo,stere:5mmo,lvere:5mmo,efare:5mmo,rcere:5mmo,ncere:5mmo,icere:5mmo,miare:2eremmo,igare:2heremmo,ucare:2heremmo,lcare:2heremmo,niare:2eremmo,rnere:5mmo,erere:5mmo,etere:5mmo,acere:5mmo,mpere:5mmo,ziare:2eremmo,siare:2eremmo,utere:5mmo,sfare:5mmo,llere:5mmo,lgare:2heremmo,rvere:5mmo,rnire:5mmo,gnire:5mmo,evere:5mmo,uiare:2eremmo,gnere:5mmo,rtere:5mmo,attere:6mmo,radere:6mmo,cedere:6mmo,ancare:3heremmo,ingare:3heremmo,rivere:6mmo,iedere:6mmo,rodere:6mmo,redere:6mmo,uadere:6mmo,encare:3heremmo,vadere:6mmo,ottere:6mmo,angare:3heremmo,incare:3heremmo,mettere:etteremmo,nettere:7mmo,lettere:7mmo,tostare:7mmo,trafare:7mmo,mmettere:8mmo,omettere:8mmo,traffare:8mmo,imettere:8mmo,rmettere:8mmo,emettere:8mmo,olungare:5heremmo,praffare:8mmo,troncare:5heremmo,amettere:8mmo,ismettere:9mmo,itrasmettere:12mmo,==andare:3remmo,are:3remmo,cedere:6mmo,dare:4mmo,dire:4mmo,emettere:8mmo,fare:4mmo,ledere:6mmo,lenire:6mmo,mettere:7mmo,omettere:8mmo,radere:6mmo,ridare:6mmo,rifare:6mmo,ristare:7mmo,rodere:6mmo,scadere:7mmo,sciare:3eremmo,sfare:5mmo,smettere:8mmo,stare:5mmo,trasmettere:11mmo,troncare:5heremmo,unire:5mmo,re:2mmo==feremmo:1are,zeremmo:1are,eeremmo:1are,ineremmo:2are,oneremmo:2are,oleremmo:2are,iteremmo:2are,tueremmo:2are,ureremmo:2are,useremmo:2are,nteremmo:2are,pperemmo:2are,ameremmo:2are,ateremmo:2are,uneremmo:2are,uleremmo:2are,nseremmo:2are,treremmo:2are,verremmo:2nire,bberemmo:2are,oreremmo:2are,breremmo:2are,preremmo:2are,nneremmo:2are,rmeremmo:2are,ileremmo:2are,ireremmo:2are,averemmo:2are,ageremmo:2iare,aleremmo:2are,eneremmo:2are,aneremmo:2are,rberemmo:2are,eleremmo:2are,oteremmo:2are,porremmo:5,iperemmo:2are,terremmo:2nere,overemmo:2are,lteremmo:2are,bleremmo:2are,eperemmo:2are,mmeremmo:2are,rarremmo:5,nueremmo:2are,rseremmo:2are,iseremmo:2are,aseremmo:2are,rleremmo:2are,lmeremmo:2are,pteremmo:2are,oseremmo:2are,iberemmo:2are,freremmo:2are,creremmo:2are,pleremmo:2are,aperemmo:2are,uberemmo:2are,lperemmo:2are,egeremmo:2iare,dorremmo:2lere,omeremmo:2are,operemmo:2are,ogeremmo:2iare,greremmo:2are,smeremmo:2are,varremmo:2lere,rperemmo:2are,cueremmo:2are,lseremmo:2are,dderemmo:2are,speremmo:2are,dueremmo:2are,ugeremmo:2iare,oberemmo:2are,dreremmo:2are,vreremmo:2are,uperemmo:2are,eseremmo:2are,parremmo:3ere,marremmo:2nere,lderemmo:2are,tmeremmo:2are,aberemmo:2are,vorremmo:2lere,alleremmo:3are,asseremmo:3are,vereremmo:3are,ogneremmo:3are,itteremmo:3are,bdurremmo:6,erreremmo:3are,isseremmo:3are,amperemmo:3are,arreremmo:3are,asteremmo:3are,lereremmo:3are,heteremmo:3are,moderemmo:3are,agneremmo:3are,osteremmo:3are,osseremmo:3are,ddurremmo:6,egueremmo:3are,pereremmo:3are,orneremmo:3are,tereremmo:3are,fideremmo:3are,ilieremmo:3are,anceremmo:3iare,tiveremmo:3are,usteremmo:3are,mereremmo:3are,iuteremmo:3are,bereremmo:3are,leveremmo:3are,oggeremmo:3iare,alieremmo:3are,mareremmo:3are,meteremmo:3are,plieremmo:3are,puteremmo:3are,nimeremmo:3are,nideremmo:3are,noderemmo:3are,ulleremmo:3are,unceremmo:3iare,pareremmo:3are,arteremmo:3are,orteremmo:3are,simeremmo:3are,esteremmo:3are,aggeremmo:3iare,illeremmo:3are,soderemmo:3are,viveremmo:3are,zereremmo:3are,baceremmo:3iare,baderemmo:3are,bareremmo:3are,ficeremmo:3iare,erceremmo:3iare,bigeremmo:3iare,utteremmo:3are,usseremmo:3are,dideremmo:3are,cereremmo:3are,ioderemmo:3are,cimeremmo:3are,auderemmo:3are,sereremmo:3are,muteremmo:3are,ompiremmo:4ere,leteremmo:3are,reteremmo:3are,ndurremmo:6,futeremmo:3are,gederemmo:3are,dereremmo:3are,nsteremmo:3are,tumeremmo:3are,urveremmo:3are,nereremmo:3are,nuderemmo:3are,igneremmo:3are,iareremmo:3are,figeremmo:3iare,gereremmo:3are,lareremmo:3are,ugneremmo:3are,irteremmo:3are,fumeremmo:3are,uideremmo:3are,urreremmo:3are,arneremmo:3are,niceremmo:3iare,timeremmo:3are,bideremmo:3are,odurremmo:6,pideremmo:3are,fereremmo:3are,limeremmo:3are,isceremmo:3iare,loderemmo:3are,arceremmo:3iare,mimeremmo:3are,muderemmo:3are,blieremmo:3are,olieremmo:3are,squeremmo:3are,pigeremmo:3iare,careremmo:3are,cqueremmo:3are,luteremmo:3are,liveremmo:3are,alveremmo:3are,irceremmo:3iare,cemeremmo:3are,hederemmo:3are,hiveremmo:3are,ruteremmo:3are,sederemmo:3are,usceremmo:3iare,pumeremmo:3are,nuteremmo:3are,suderemmo:3are,tareremmo:3are,adurremmo:6,buteremmo:3are,urteremmo:3are,geteremmo:3are,engeremmo:3iare,aglieremmo:4are,iglieremmo:4are,bonderemmo:4are,casceremmo:4iare,certeremmo:4are,cetteremmo:4are,colleremmo:4are,telleremmo:4are,conceremmo:4iare,corceremmo:4iare,corderemmo:4are,uieteremmo:4are,uisteremmo:4are,datteremmo:4are,dotteremmo:4are,fetteremmo:4are,losceremmo:4iare,folleremmo:4are,hinderemmo:4are,beggeremmo:4iare,latteremmo:4are,lerteremmo:4are,lieteremmo:4are,lungeremmo:4are,terneremmo:4are,basceremmo:4iare,derneremmo:4are,heggeremmo:4iare,nelleremmo:4are,proderemmo:4are,ieggeremmo:4iare,meggeremmo:4iare,rrederemmo:4are,rriveremmo:4are,tonderemmo:4are,petteremmo:4are,segneremmo:4are,getteremmo:4are,sorderemmo:4are,visteremmo:4are,zarderemmo:4are,betteremmo:4are,barderemmo:4are,benderemmo:4are,linderemmo:4are,cotteremmo:4are,bolleremmo:4are,botteremmo:4are,borderemmo:4are,seggeremmo:4iare,rinderemmo:4are,peggeremmo:4iare,cangeremmo:4iare,neggeremmo:4iare,zeggeremmo:4iare,selleremmo:4are,cesseremmo:4are,uetteremmo:4are,manderemmo:4are,minceremmo:4iare,menderemmo:4are,patteremmo:4are,fesseremmo:4are,serveremmo:4are,olideremmo:4are,nsumeremmo:4are,tatteremmo:4are,ratteremmo:4are,rolleremmo:4are,belleremmo:4are,cremeremmo:4are,deggeremmo:4iare,dedurremmo:7,degneremmo:4are,prederemmo:4are,detteremmo:4are,irederemmo:4are,rotteremmo:4are,erederemmo:4are,serteremmo:4are,resseremmo:4are,angueremmo:4are,disteremmo:4are,vieteremmo:4are,uelleremmo:4are,hetteremmo:4are,fasceremmo:4iare,gelleremmo:4are,lotteremmo:4are,forgeremmo:4iare,retteremmo:4are,froderemmo:4are,gesseremmo:4are,verneremmo:4are,graderemmo:4are,grideremmo:4are,guaderemmo:4are,uarderemmo:4are,berneremmo:4are,regneremmo:4are,adiceremmo:4iare,uglieremmo:4are,ietteremmo:4are,nonderemmo:4are,udiceremmo:4iare,alideremmo:4are,crimeremmo:4are,lasceremmo:4iare,legneremmo:4are,lesseremmo:4are,linceremmo:4iare,listeremmo:4are,lorderemmo:4are,mangeremmo:4iare,matteremmo:4are,delleremmo:4are,molleremmo:4are,monderemmo:4are,notteremmo:4are,iomberemmo:4are,oetteremmo:4are,priveremmo:4are,relleremmo:4are,risteremmo:4are,catteremmo:4are,bomberemmo:4are,tomberemmo:4are,tarderemmo:4are,romberemmo:4are,ronceremmo:4are,vesceremmo:4iare,aetteremmo:4are,banderemmo:4are,borreremmo:4are,feggeremmo:4iare,iotteremmo:4are,rosceremmo:4iare,sedurremmo:7,sesseremmo:4are,stemeremmo:4are,misteremmo:4are,sonderemmo:4are,icideremmo:4are,aligeremmo:4iare,tremeremmo:4are,ucideremmo:4are,vesseremmo:4are,idimeremmo:4are,aleggeremmo:5iare,lletteremmo:5are,areggeremmo:5iare,anetteremmo:5are,moglieremmo:5are,oreggeremmo:5iare,ppelleremmo:5are,ovelleremmo:5are,econderemmo:5are,tteggeremmo:5iare,ncelleremmo:5are,rconderemmo:5are,nteggeremmo:5iare,rteggeremmo:5iare,steggeremmo:5iare,treggeremmo:5iare,iletteremmo:5are,mpegneremmo:5are,avelleremmo:5are,lleggeremmo:5iare,roglieremmo:5are,rpelleremmo:5are,voglieremmo:5are,acelleremmo:5are,schereremmo:5are,oleggeremmo:5iare,breggeremmo:5iare,ossideremmo:5are,esetteremmo:5are,iesumeremmo:5are,pingueremmo:5are,veglieremmo:5are,foglieremmo:5are,poglieremmo:5are,lteggeremmo:5iare,cchereremmo:5are,affonderemmo:6are,cchiereremmo:6are,erreggeremmo:6iare,livelleremmo:6are,schiereremmo:6are,uccelleremmo:6are,veleggeremmo:6iare,faccenderemmo:7are,sprofonderemmo:8are,",
      "secondPlural": "si:este,are:ereste,ere:reste,rre:3ste,iare:ereste,nere:rreste,nire:rreste,lere:rreste,cere:rreste,sere:te,lire:4ste,tire:4ste,rire:4ste,dire:4ste,sire:4ste,cire:4ste,gere:4ste,uire:4ste,gire:4ste,bire:4ste,fire:4ste,hire:4ste,mere:4ste,zire:4ste,pire:4ste,uere:4ste,mire:4ste,oire:4ste,bere:4ste,eire:4ste,vire:4ste,acare:2hereste,hiare:2ereste,liare:2ereste,aiare:2ereste,icare:2hereste,rcare:2hereste,ccare:2hereste,onire:5ste,viare:2ereste,unire:5ste,ogare:2hereste,piare:2ereste,anire:5ste,ecare:2hereste,ndere:5ste,liere:5ste,rrere:5ste,scere:5ste,scare:2hereste,biare:2ereste,ocare:2hereste,egare:2hereste,agare:2hereste,rgare:2hereste,udere:5ste,tiare:2ereste,fiare:2ereste,oiare:2ereste,riare:2ereste,rdere:5ste,idere:5ste,inire:5ste,ugare:2hereste,diare:2ereste,stere:5ste,lvere:5ste,efare:5ste,rcere:5ste,ncere:5ste,icere:5ste,miare:2ereste,igare:2hereste,ucare:2hereste,lcare:2hereste,niare:2ereste,rnere:5ste,erere:5ste,etere:5ste,acere:5ste,mpere:5ste,ziare:2ereste,siare:2ereste,utere:5ste,sfare:5ste,llere:5ste,lgare:2hereste,rvere:5ste,rnire:5ste,gnire:5ste,evere:5ste,uiare:2ereste,gnere:5ste,rtere:5ste,attere:6ste,radere:6ste,cedere:6ste,ancare:3hereste,ingare:3hereste,rivere:6ste,iedere:6ste,rodere:6ste,redere:6ste,uadere:6ste,encare:3hereste,vadere:6ste,ottere:6ste,angare:3hereste,incare:3hereste,mettere:ettereste,nettere:7ste,lettere:7ste,tostare:7ste,trafare:7ste,mmettere:8ste,omettere:8ste,traffare:8ste,imettere:8ste,rmettere:8ste,emettere:8ste,olungare:5hereste,praffare:8ste,troncare:5hereste,amettere:8ste,ismettere:9ste,itrasmettere:12ste,==andare:3reste,are:3reste,cedere:6ste,dare:4ste,dire:4ste,emettere:8ste,fare:4ste,ledere:6ste,lenire:6ste,mettere:7ste,omettere:8ste,radere:6ste,ridare:6ste,rifare:6ste,ristare:7ste,rodere:6ste,scadere:7ste,sciare:3ereste,sfare:5ste,smettere:8ste,stare:5ste,tessere:7ste,trasmettere:11ste,troncare:5hereste,unire:5ste==fereste:1are,zereste:1are,eereste:1are,inereste:2are,onereste:2are,olereste:2are,itereste:2are,tuereste:2are,urereste:2are,usereste:2are,ntereste:2are,ppereste:2are,amereste:2are,atereste:2are,unereste:2are,ulereste:2are,nsereste:2are,trereste:2are,verreste:2nire,bbereste:2are,orereste:2are,brereste:2are,prereste:2are,nnereste:2are,rmereste:2are,ilereste:2are,irereste:2are,avereste:2are,agereste:2iare,alereste:2are,enereste:2are,anereste:2are,rbereste:2are,elereste:2are,otereste:2are,porreste:5,ipereste:2are,terreste:2nere,overeste:2are,ltereste:2are,blereste:2are,epereste:2are,mmereste:2are,rarreste:5,nuereste:2are,rsereste:2are,isereste:2are,asereste:2are,rlereste:2are,lmereste:2are,ptereste:2are,osereste:2are,ibereste:2are,frereste:2are,crereste:2are,plereste:2are,apereste:2are,ubereste:2are,lpereste:2are,egereste:2iare,dorreste:2lere,omereste:2are,opereste:2are,ogereste:2iare,grereste:2are,smereste:2are,varreste:2lere,rpereste:2are,cuereste:2are,lsereste:2are,ddereste:2are,spereste:2are,duereste:2are,ugereste:2iare,obereste:2are,drereste:2are,vrereste:2are,upereste:2are,esereste:2are,parreste:3ere,marreste:2nere,ldereste:2are,tmereste:2are,abereste:2are,vorreste:2lere,allereste:3are,assereste:3are,verereste:3are,ognereste:3are,ittereste:3are,bdurreste:6,errereste:3are,issereste:3are,ampereste:3are,arrereste:3are,astereste:3are,lerereste:3are,hetereste:3are,modereste:3are,agnereste:3are,ostereste:3are,ossereste:3are,ddurreste:6,eguereste:3are,perereste:3are,ornereste:3are,terereste:3are,fidereste:3are,iliereste:3are,ancereste:3iare,tivereste:3are,ustereste:3are,merereste:3are,iutereste:3are,berereste:3are,levereste:3are,oggereste:3iare,aliereste:3are,marereste:3are,metereste:3are,pliereste:3are,putereste:3are,nimereste:3are,nidereste:3are,nodereste:3are,ullereste:3are,uncereste:3iare,parereste:3are,artereste:3are,ortereste:3are,simereste:3are,estereste:3are,aggereste:3iare,illereste:3are,sodereste:3are,vivereste:3are,zerereste:3are,bacereste:3iare,badereste:3are,barereste:3are,ficereste:3iare,ercereste:3iare,bigereste:3iare,uttereste:3are,ussereste:3are,didereste:3are,cerereste:3are,iodereste:3are,cimereste:3are,audereste:3are,serereste:3are,mutereste:3are,ompireste:4ere,letereste:3are,retereste:3are,ndurreste:6,futereste:3are,gedereste:3are,derereste:3are,nstereste:3are,tumereste:3are,urvereste:3are,nerereste:3are,nudereste:3are,ignereste:3are,iarereste:3are,figereste:3iare,gerereste:3are,larereste:3are,ugnereste:3are,irtereste:3are,fumereste:3are,uidereste:3are,urrereste:3are,arnereste:3are,nicereste:3iare,timereste:3are,bidereste:3are,odurreste:6,pidereste:3are,ferereste:3are,limereste:3are,iscereste:3iare,lodereste:3are,arcereste:3iare,mimereste:3are,mudereste:3are,bliereste:3are,oliereste:3are,squereste:3are,pigereste:3iare,carereste:3are,cquereste:3are,lutereste:3are,livereste:3are,alvereste:3are,ircereste:3iare,cemereste:3are,hedereste:3are,hivereste:3are,rutereste:3are,sedereste:3are,uscereste:3iare,pumereste:3are,nutereste:3are,sudereste:3are,tarereste:3are,adurreste:6,butereste:3are,urtereste:3are,getereste:3are,engereste:3iare,agliereste:4are,igliereste:4are,bondereste:4are,cascereste:4iare,certereste:4are,cettereste:4are,collereste:4are,tellereste:4are,concereste:4iare,corcereste:4iare,cordereste:4are,uietereste:4are,uistereste:4are,dattereste:4are,dottereste:4are,fettereste:4are,loscereste:4iare,follereste:4are,hindereste:4are,beggereste:4iare,lattereste:4are,lertereste:4are,lietereste:4are,lungereste:4are,ternereste:4are,bascereste:4iare,dernereste:4are,heggereste:4iare,nellereste:4are,prodereste:4are,ieggereste:4iare,meggereste:4iare,rredereste:4are,rrivereste:4are,tondereste:4are,pettereste:4are,segnereste:4are,gettereste:4are,sordereste:4are,vistereste:4are,zardereste:4are,bettereste:4are,bardereste:4are,bendereste:4are,lindereste:4are,cottereste:4are,bollereste:4are,bottereste:4are,bordereste:4are,seggereste:4iare,rindereste:4are,peggereste:4iare,cangereste:4iare,neggereste:4iare,zeggereste:4iare,sellereste:4are,cessereste:4are,uettereste:4are,mandereste:4are,mincereste:4iare,mendereste:4are,pattereste:4are,fessereste:4are,servereste:4are,olidereste:4are,nsumereste:4are,tattereste:4are,rattereste:4are,rollereste:4are,bellereste:4are,cremereste:4are,deggereste:4iare,dedurreste:7,degnereste:4are,predereste:4are,dettereste:4are,iredereste:4are,rottereste:4are,eredereste:4are,sertereste:4are,ressereste:4are,anguereste:4are,distereste:4are,vietereste:4are,uellereste:4are,hettereste:4are,fascereste:4iare,gellereste:4are,lottereste:4are,forgereste:4iare,rettereste:4are,frodereste:4are,gessereste:4are,vernereste:4are,gradereste:4are,gridereste:4are,guadereste:4are,uardereste:4are,bernereste:4are,regnereste:4are,adicereste:4iare,ugliereste:4are,iettereste:4are,nondereste:4are,udicereste:4iare,alidereste:4are,crimereste:4are,lascereste:4iare,legnereste:4are,lessereste:4are,lincereste:4iare,listereste:4are,lordereste:4are,mangereste:4iare,mattereste:4are,dellereste:4are,mollereste:4are,mondereste:4are,nottereste:4are,iombereste:4are,oettereste:4are,privereste:4are,rellereste:4are,ristereste:4are,cattereste:4are,bombereste:4are,tombereste:4are,tardereste:4are,rombereste:4are,roncereste:4are,vescereste:4iare,aettereste:4are,bandereste:4are,borrereste:4are,feggereste:4iare,iottereste:4are,roscereste:4iare,sedurreste:7,sessereste:4are,stemereste:4are,mistereste:4are,sondereste:4are,icidereste:4are,aligereste:4iare,tremereste:4are,ucidereste:4are,vessereste:4are,idimereste:4are,aleggereste:5iare,llettereste:5are,areggereste:5iare,anettereste:5are,mogliereste:5are,oreggereste:5iare,ppellereste:5are,ovellereste:5are,econdereste:5are,tteggereste:5iare,ncellereste:5are,rcondereste:5are,nteggereste:5iare,rteggereste:5iare,steggereste:5iare,treggereste:5iare,ilettereste:5are,mpegnereste:5are,avellereste:5are,lleggereste:5iare,rogliereste:5are,rpellereste:5are,vogliereste:5are,acellereste:5are,scherereste:5are,oleggereste:5iare,breggereste:5iare,ossidereste:5are,esettereste:5are,iesumereste:5are,pinguereste:5are,vegliereste:5are,fogliereste:5are,pogliereste:5are,lteggereste:5iare,ccherereste:5are,affondereste:6are,cchierereste:6are,erreggereste:6iare,livellereste:6are,schierereste:6are,uccellereste:6are,veleggereste:6iare,faccendereste:7are,sprofondereste:8are,",
      "thirdPlural": "si:ebbero,are:erebbero,ere:rebbero,rre:3bbero,iare:erebbero,nere:rrebbero,nire:rrebbero,lere:rrebbero,cere:rrebbero,lire:4bbero,tire:4bbero,rire:4bbero,dire:4bbero,sire:4bbero,cire:4bbero,gere:4bbero,uire:4bbero,gire:4bbero,bire:4bbero,fire:4bbero,hire:4bbero,mere:4bbero,zire:4bbero,pire:4bbero,uere:4bbero,mire:4bbero,oire:4bbero,bere:4bbero,eire:4bbero,vire:4bbero,sere:4bbero,acare:2herebbero,hiare:2erebbero,liare:2erebbero,aiare:2erebbero,icare:2herebbero,rcare:2herebbero,ccare:2herebbero,onire:5bbero,viare:2erebbero,unire:5bbero,ogare:2herebbero,piare:2erebbero,anire:5bbero,ecare:2herebbero,ndere:5bbero,liere:5bbero,rrere:5bbero,scere:5bbero,scare:2herebbero,biare:2erebbero,ocare:2herebbero,egare:2herebbero,agare:2herebbero,rgare:2herebbero,udere:5bbero,tiare:2erebbero,fiare:2erebbero,oiare:2erebbero,riare:2erebbero,rdere:5bbero,idere:5bbero,inire:5bbero,ugare:2herebbero,diare:2erebbero,stere:5bbero,lvere:5bbero,efare:5bbero,rcere:5bbero,ncere:5bbero,icere:5bbero,miare:2erebbero,igare:2herebbero,ucare:2herebbero,lcare:2herebbero,niare:2erebbero,rnere:5bbero,erere:5bbero,etere:5bbero,acere:5bbero,mpere:5bbero,ziare:2erebbero,siare:2erebbero,utere:5bbero,sfare:5bbero,llere:5bbero,lgare:2herebbero,rvere:5bbero,rnire:5bbero,gnire:5bbero,evere:5bbero,uiare:2erebbero,gnere:5bbero,rtere:5bbero,attere:6bbero,radere:6bbero,cedere:6bbero,ancare:3herebbero,ingare:3herebbero,rivere:6bbero,iedere:6bbero,rodere:6bbero,redere:6bbero,uadere:6bbero,encare:3herebbero,vadere:6bbero,ottere:6bbero,angare:3herebbero,incare:3herebbero,mettere:etterebbero,nettere:7bbero,lettere:7bbero,tostare:7bbero,trafare:7bbero,mmettere:8bbero,omettere:8bbero,traffare:8bbero,imettere:8bbero,rmettere:8bbero,emettere:8bbero,olungare:5herebbero,praffare:8bbero,troncare:5herebbero,amettere:8bbero,ismettere:9bbero,itrasmettere:12bbero,==andare:3rebbero,are:3rebbero,cedere:6bbero,dare:4bbero,dire:4bbero,emettere:8bbero,fare:4bbero,ledere:6bbero,lenire:6bbero,mettere:7bbero,omettere:8bbero,radere:6bbero,ridare:6bbero,rifare:6bbero,ristare:7bbero,rodere:6bbero,scadere:7bbero,sciare:3erebbero,sfare:5bbero,smettere:8bbero,stare:5bbero,trasmettere:11bbero,troncare:5herebbero,unire:5bbero,ere:bero==ferebbero:1are,zerebbero:1are,eerebbero:1are,inerebbero:2are,onerebbero:2are,olerebbero:2are,iterebbero:2are,tuerebbero:2are,urerebbero:2are,userebbero:2are,nterebbero:2are,pperebbero:2are,amerebbero:2are,aterebbero:2are,unerebbero:2are,ulerebbero:2are,nserebbero:2are,trerebbero:2are,verrebbero:2nire,bberebbero:2are,orerebbero:2are,brerebbero:2are,prerebbero:2are,nnerebbero:2are,rmerebbero:2are,ilerebbero:2are,irerebbero:2are,averebbero:2are,agerebbero:2iare,alerebbero:2are,enerebbero:2are,anerebbero:2are,rberebbero:2are,elerebbero:2are,oterebbero:2are,porrebbero:5,iperebbero:2are,terrebbero:2nere,overebbero:2are,lterebbero:2are,blerebbero:2are,eperebbero:2are,mmerebbero:2are,rarrebbero:5,nuerebbero:2are,rserebbero:2are,iserebbero:2are,aserebbero:2are,rlerebbero:2are,lmerebbero:2are,pterebbero:2are,oserebbero:2are,iberebbero:2are,frerebbero:2are,crerebbero:2are,plerebbero:2are,aperebbero:2are,uberebbero:2are,lperebbero:2are,egerebbero:2iare,dorrebbero:2lere,omerebbero:2are,operebbero:2are,ogerebbero:2iare,grerebbero:2are,smerebbero:2are,varrebbero:2lere,rperebbero:2are,cuerebbero:2are,lserebbero:2are,dderebbero:2are,sperebbero:2are,duerebbero:2are,ugerebbero:2iare,oberebbero:2are,drerebbero:2are,vrerebbero:2are,uperebbero:2are,eserebbero:2are,parrebbero:3ere,marrebbero:2nere,lderebbero:2are,tmerebbero:2are,aberebbero:2are,vorrebbero:2lere,allerebbero:3are,asserebbero:3are,vererebbero:3are,ognerebbero:3are,itterebbero:3are,bdurrebbero:6,errerebbero:3are,isserebbero:3are,amperebbero:3are,arrerebbero:3are,asterebbero:3are,lererebbero:3are,heterebbero:3are,moderebbero:3are,agnerebbero:3are,osterebbero:3are,osserebbero:3are,ddurrebbero:6,eguerebbero:3are,pererebbero:3are,ornerebbero:3are,tererebbero:3are,fiderebbero:3are,ilierebbero:3are,ancerebbero:3iare,tiverebbero:3are,usterebbero:3are,mererebbero:3are,iuterebbero:3are,bererebbero:3are,leverebbero:3are,oggerebbero:3iare,alierebbero:3are,marerebbero:3are,meterebbero:3are,plierebbero:3are,puterebbero:3are,nimerebbero:3are,niderebbero:3are,noderebbero:3are,ullerebbero:3are,uncerebbero:3iare,parerebbero:3are,arterebbero:3are,orterebbero:3are,simerebbero:3are,esterebbero:3are,aggerebbero:3iare,illerebbero:3are,soderebbero:3are,viverebbero:3are,zererebbero:3are,bacerebbero:3iare,baderebbero:3are,barerebbero:3are,ficerebbero:3iare,ercerebbero:3iare,bigerebbero:3iare,utterebbero:3are,usserebbero:3are,diderebbero:3are,cererebbero:3are,ioderebbero:3are,cimerebbero:3are,auderebbero:3are,sererebbero:3are,muterebbero:3are,ompirebbero:4ere,leterebbero:3are,reterebbero:3are,ndurrebbero:6,futerebbero:3are,gederebbero:3are,dererebbero:3are,nsterebbero:3are,tumerebbero:3are,urverebbero:3are,nererebbero:3are,nuderebbero:3are,ignerebbero:3are,iarerebbero:3are,figerebbero:3iare,gererebbero:3are,larerebbero:3are,ugnerebbero:3are,irterebbero:3are,fumerebbero:3are,uiderebbero:3are,urrerebbero:3are,arnerebbero:3are,nicerebbero:3iare,timerebbero:3are,biderebbero:3are,odurrebbero:6,piderebbero:3are,fererebbero:3are,limerebbero:3are,iscerebbero:3iare,loderebbero:3are,arcerebbero:3iare,mimerebbero:3are,muderebbero:3are,blierebbero:3are,olierebbero:3are,squerebbero:3are,pigerebbero:3iare,carerebbero:3are,cquerebbero:3are,luterebbero:3are,liverebbero:3are,alverebbero:3are,ircerebbero:3iare,cemerebbero:3are,hederebbero:3are,hiverebbero:3are,ruterebbero:3are,sederebbero:3are,uscerebbero:3iare,pumerebbero:3are,nuterebbero:3are,suderebbero:3are,tarerebbero:3are,adurrebbero:6,buterebbero:3are,urterebbero:3are,geterebbero:3are,engerebbero:3iare,aglierebbero:4are,iglierebbero:4are,bonderebbero:4are,cascerebbero:4iare,certerebbero:4are,cetterebbero:4are,collerebbero:4are,tellerebbero:4are,concerebbero:4iare,corcerebbero:4iare,corderebbero:4are,uieterebbero:4are,uisterebbero:4are,datterebbero:4are,dotterebbero:4are,fetterebbero:4are,loscerebbero:4iare,follerebbero:4are,hinderebbero:4are,beggerebbero:4iare,latterebbero:4are,lerterebbero:4are,lieterebbero:4are,lungerebbero:4are,ternerebbero:4are,bascerebbero:4iare,dernerebbero:4are,heggerebbero:4iare,nellerebbero:4are,proderebbero:4are,ieggerebbero:4iare,meggerebbero:4iare,rrederebbero:4are,rriverebbero:4are,tonderebbero:4are,petterebbero:4are,segnerebbero:4are,getterebbero:4are,sorderebbero:4are,visterebbero:4are,zarderebbero:4are,betterebbero:4are,barderebbero:4are,benderebbero:4are,linderebbero:4are,cotterebbero:4are,bollerebbero:4are,botterebbero:4are,borderebbero:4are,seggerebbero:4iare,rinderebbero:4are,peggerebbero:4iare,cangerebbero:4iare,neggerebbero:4iare,zeggerebbero:4iare,sellerebbero:4are,cesserebbero:4are,uetterebbero:4are,manderebbero:4are,mincerebbero:4iare,menderebbero:4are,patterebbero:4are,fesserebbero:4are,serverebbero:4are,oliderebbero:4are,nsumerebbero:4are,tatterebbero:4are,ratterebbero:4are,rollerebbero:4are,bellerebbero:4are,cremerebbero:4are,deggerebbero:4iare,dedurrebbero:7,degnerebbero:4are,prederebbero:4are,detterebbero:4are,irederebbero:4are,rotterebbero:4are,erederebbero:4are,serterebbero:4are,resserebbero:4are,anguerebbero:4are,disterebbero:4are,vieterebbero:4are,uellerebbero:4are,hetterebbero:4are,fascerebbero:4iare,gellerebbero:4are,lotterebbero:4are,forgerebbero:4iare,retterebbero:4are,froderebbero:4are,gesserebbero:4are,vernerebbero:4are,graderebbero:4are,griderebbero:4are,guaderebbero:4are,uarderebbero:4are,bernerebbero:4are,regnerebbero:4are,adicerebbero:4iare,uglierebbero:4are,ietterebbero:4are,nonderebbero:4are,udicerebbero:4iare,aliderebbero:4are,crimerebbero:4are,lascerebbero:4iare,legnerebbero:4are,lesserebbero:4are,lincerebbero:4iare,listerebbero:4are,lorderebbero:4are,mangerebbero:4iare,matterebbero:4are,dellerebbero:4are,mollerebbero:4are,monderebbero:4are,notterebbero:4are,iomberebbero:4are,oetterebbero:4are,priverebbero:4are,rellerebbero:4are,risterebbero:4are,catterebbero:4are,bomberebbero:4are,tomberebbero:4are,tarderebbero:4are,romberebbero:4are,roncerebbero:4are,vescerebbero:4iare,aetterebbero:4are,banderebbero:4are,borrerebbero:4are,feggerebbero:4iare,iotterebbero:4are,roscerebbero:4iare,sedurrebbero:7,sesserebbero:4are,stemerebbero:4are,misterebbero:4are,sonderebbero:4are,iciderebbero:4are,aligerebbero:4iare,tremerebbero:4are,uciderebbero:4are,vesserebbero:4are,idimerebbero:4are,aleggerebbero:5iare,lletterebbero:5are,areggerebbero:5iare,anetterebbero:5are,moglierebbero:5are,oreggerebbero:5iare,ppellerebbero:5are,ovellerebbero:5are,econderebbero:5are,tteggerebbero:5iare,ncellerebbero:5are,rconderebbero:5are,nteggerebbero:5iare,rteggerebbero:5iare,steggerebbero:5iare,treggerebbero:5iare,iletterebbero:5are,mpegnerebbero:5are,avellerebbero:5are,lleggerebbero:5iare,roglierebbero:5are,rpellerebbero:5are,voglierebbero:5are,acellerebbero:5are,schererebbero:5are,oleggerebbero:5iare,breggerebbero:5iare,ossiderebbero:5are,esetterebbero:5are,iesumerebbero:5are,pinguerebbero:5are,veglierebbero:5are,foglierebbero:5are,poglierebbero:5are,lteggerebbero:5iare,cchererebbero:5are,affonderebbero:6are,cchiererebbero:6are,erreggerebbero:6iare,livellerebbero:6are,schiererebbero:6are,uccellerebbero:6are,veleggerebbero:6iare,faccenderebbero:7are,sprofonderebbero:8are,"
    },
    "gerunds": {
      "gerunds": "re:ndo,ire:endo,rre:nendo,rci:ndoci,are:iando,zare:ando,iare:ando,nare:2ndo,care:2ndo,dare:2ndo,lare:2ndo,rare:2ndo,sare:2ndo,vare:2ndo,urre:1cendo,uare:2ndo,gare:2ndo,pare:2ndo,mare:2ndo,bare:2ndo,eare:2ndo,arre:1endo,aare:2ndo,xare:2ndo,kare:2ndo,rsene:ndosene,hiare:3ndo,aiare:3ndo,ciare:3ndo,viare:3ndo,nzare:3ndo,ntare:3ndo,itare:3ndo,piare:3ndo,stare:3ndo,rtare:3ndo,riare:3ndo,etare:3ndo,atare:3ndo,ziare:3ndo,ddire:3cendo,biare:3ndo,ltare:3ndo,rzare:3ndo,utare:3ndo,miare:3ndo,uiare:3ndo,lzare:3ndo,tiare:3ndo,fiare:3ndo,oiare:3ndo,otare:3ndo,diare:3ndo,efare:3cendo,ufare:3ndo,niare:3ndo,ptare:3ndo,siare:3ndo,sfare:3cendo,ofare:3ndo,ftare:3ndo,phare:3ndo,ibere:3vendo,nfare:3ndo,sdire:3cendo,abere:3vendo,rfare:3ndo,ettare:attando,tchare:chando,ottare:4ndo,uffare:4ndo,ittare:4ndo,ozzare:4ndo,attare:4ndo,ezzare:4ndo,iliare:4ndo,agiare:4ndo,uzzare:4ndo,aliare:4ndo,azzare:4ndo,pliare:4ndo,ugiare:4ndo,iffare:4ndo,effare:4ndo,nedire:4cendo,igiare:4ndo,uttare:4ndo,ngiare:4ndo,egiare:4ndo,ogiare:4ndo,empire:4endo,rgiare:4ndo,indire:4cendo,olfare:4ndo,ledire:4cendo,bliare:4ndo,oliare:4ndo,rifare:4cendo,bafare:4ndo,lgiare:4ndo,hifare:4ndo,uliare:4ndo,tifare:4ndo,mettere:ettendo,agliare:5ndo,iettare:5ndo,caffare:5ndo,rettare:5ndo,vettare:5ndo,tizzare:5ndo,ogliare:5ndo,rizzare:5ndo,fettare:5ndo,nizzare:5ndo,gettare:5ndo,aizzare:5ndo,mizzare:5ndo,gizzare:5ndo,lettare:5ndo,oggiare:5ndo,hettare:5ndo,nettare:5ndo,fizzare:5ndo,cizzare:5ndo,hizzare:5ndo,pizzare:5ndo,bizzare:5ndo,pettare:5ndo,aettare:5ndo,aggiare:5ndo,vizzare:5ndo,bettare:5ndo,grafare:5ndo,boglire:5endo,uettare:5ndo,dettare:5ndo,sizzare:5ndo,eizzare:5ndo,dizzare:5ndo,ugliare:5ndo,uizzare:5ndo,terdire:5cendo,egliare:5ndo,malfare:5cendo,iggiare:5ndo,oettare:5ndo,predire:5cendo,zettare:5ndo,settare:5ndo,iaffare:5ndo,calfare:5ndo,taffare:5ndo,trafare:5cendo,bigliare:6ndo,ccettare:6ndo,graffare:6ndo,beggiare:6ndo,olizzare:6ndo,leggiare:6ndo,peggiare:6ndo,reggiare:6ndo,mmettere:6ndo,alizzare:6ndo,heggiare:6ndo,ieggiare:6ndo,rraffare:6ndo,tigliare:6ndo,migliare:6ndo,teggiare:6ndo,cigliare:6ndo,feggiare:6ndo,deggiare:6ndo,seggiare:6ndo,zeggiare:6ndo,clizzare:6ndo,ilizzare:6ndo,omettere:6ndo,sigliare:6ndo,traffare:6cendo,imettere:6ndo,scettare:6ndo,emettere:6ndo,elizzare:6ndo,figliare:6ndo,rigliare:6ndo,pigliare:6ndo,ncettare:6ndo,rmettere:6ndo,veggiare:6ndo,ueggiare:6ndo,ulizzare:6ndo,icettare:6ndo,digliare:6ndo,praffare:6cendo,amettere:6ndo,aneggiare:7ndo,rmeggiare:7ndo,ineggiare:7ndo,oneggiare:7ndo,ellizzare:7ndo,allizzare:7ndo,ismettere:7ndo,mmeggiare:7ndo,umeggiare:7ndo,avigliare:7ndo,gneggiare:7ndo,ameggiare:7ndo,emeggiare:7ndo,lmeggiare:7ndo,eneggiare:7ndo,omeggiare:7ndo,illizzare:7ndo,anneggiare:8ndo,zovigliare:8ndo,inneggiare:7iando,primeggiare:9ndo,otrasmettere:10ndo,itrasmettere:10ndo,==aggrovigliare:11ndo,agiare:4ndo,aizzare:5ndo,bere:2vendo,boglire:5endo,dare:2ndo,dettare:5ndo,dire:2cendo,emettere:6ndo,empire:4endo,fare:2cendo,figliare:6ndo,gettare:5ndo,graffare:6ndo,indire:4cendo,lizzare:5ndo,malfare:5cendo,nettare:5ndo,oliare:4ndo,omettere:6ndo,pigliare:6ndo,predire:5cendo,primeggiare:9ndo,ridire:4cendo,rifare:4cendo,rimeggiare:7iando,rizzare:5ndo,sdire:3cendo,sfare:3cendo,smettere:6ndo,stare:3ndo,tifare:4ndo,trasmettere:9ndo,vigliare:6ndo==unendo:2ire,ngendo:3re,lgendo:3re,nnendo:2ire,ogendo:3re,inendo:2ire,lvendo:3re,umendo:3re,avendo:3re,izando:2zare,imendo:3re,ovendo:3re,otendo:3re,ddendo:3re,bonendo:3ire,cadendo:4re,canendo:3ire,cedendo:4re,endendo:4re,escendo:4re,venendo:3ire,ergendo:4re,iggendo:4re,ludendo:4re,conendo:3ire,monendo:3ire,tenendo:4re,rivendo:4re,sidendo:4re,urgendo:4re,orcendo:4re,eggendo:4re,incendo:4re,iedendo:4re,oscendo:4re,burendo:4re,petendo:4re,iacendo:4re,vivendo:4re,rodendo:4re,ompendo:4re,cucendo:3ire,nquendo:4re,ligendo:4re,erpendo:4re,uadendo:4re,valendo:4re,sigendo:4re,vadendo:4re,ornendo:3ire,gemendo:4re,godendo:4re,ranendo:3ire,ugnendo:3ire,arnendo:3ire,ronendo:3ire,renendo:3ire,ognendo:3ire,ombendo:4re,ignendo:3ire,orgendo:4re,lenendo:3ire,ledendo:4re,licendo:4re,ietendo:4re,ascendo:4re,undendo:4re,manendo:4re,indendo:4re,sedendo:4re,sapendo:4re,iglando:3iare,digendo:4re,cevendo:4re,ionendo:3ire,vanendo:3ire,egnendo:4re,temendo:4re,tacendo:4re,vigendo:4re,battendo:5re,bradendo:5re,correndo:5re,nettendo:5re,sistendo:5re,tollendo:5re,cernendo:5re,hierendo:5re,hiudendo:5re,lettendo:5re,ecidendo:5re,ompiendo:5re,tessendo:5re,inguendo:5re,pondendo:5re,pargendo:5re,credendo:5re,eridendo:5re,trudendo:5re,irigendo:5re,scutendo:5re,perdendo:5re,vellendo:5re,cellendo:5re,elidendo:5re,eradendo:5re,erigendo:5re,pandendo:5re,fervendo:5re,fottendo:5re,fremendo:5re,mbevendo:5re,ncutendo:5re,pettendo:4ire,rcidendo:5re,mettendo:5re,molcendo:5re,mordendo:5re,premendo:5re,egliendo:5re,prudendo:5re,idolendo:5re,hernendo:4ire,bbevendo:5re,tondendo:5re,cogliendo:6re,arridendo:6re,scondendo:6re,truggendo:6re,oncidendo:6re,nfondendo:6re,incidendo:6re,ollidendo:6re,ffondendo:6re,iogliendo:6re,togliendo:6re,dividendo:6re,spellendo:6re,ecattando:2ettare,ntridendo:6re,irridendo:6re,occidendo:6re,opellendo:6re,epellendo:6re,riardendo:6re,ifondendo:6re,stridendo:6re,uccidendo:6re,sfondendo:6re,sorridendo:7re,"
    },
    "pastParticiple": {
      "pastParticiple": "re:to,ere:uto,rre:sto,ire:uto,gere:to,dere:so,rere:so,cere:to,urre:otto,vere:tto,rire:erto,mere:nto,tere:sso,lere:to,nere:sto,lire:2to,tire:2to,sire:2to,cire:2to,uire:2to,gire:2to,bire:2to,fire:2to,hire:2to,arre:1tto,zire:2to,pire:2to,mire:2to,oire:2to,eire:2to,vire:2to,ndere:so,ttere:sso,ggere:tto,imere:esso,mpere:tto,igere:etto,guere:to,ucere:otto,scere:to,gnere:nto,onire:3to,unire:3to,rrire:3to,anire:3to,udire:3to,ddire:2etto,erire:3to,adire:3to,enere:2uto,inire:3to,stere:2ito,efare:3tto,avere:2uto,icere:2uto,rnere:2uto,erere:1sto,acere:2iuto,odire:3to,sfare:3tto,alere:2so,urire:3to,rnire:3to,emere:2uto,gnire:3to,evere:2uto,trire:3to,grire:3to,etere:2uto,arere:2so,gliere:lto,ondere:uso,uovere:osso,ingere:etto,uotere:osso,uocere:otto,ellere:ulso,attere:3uto,cadere:3uto,cedere:3uto,escere:3iuto,algere:3uto,bidire:4to,ondire:4to,andire:4to,nedire:3etto,iarire:4to,oscere:3iuto,lorire:4to,vivere:2ssuto,argere:2so,redere:3uto,bedire:4to,dolere:3uto,dovere:3uto,sigere:1atto,ordire:4to,andere:2so,vorire:4to,iorire:4to,ottere:3uto,godere:3uto,uarire:4to,lidire:4to,pedire:4to,cidire:4to,sprire:4to,indire:3etto,tidire:4to,porire:4to,pidire:4to,midire:4to,gidire:4to,lenire:4to,ledire:3etto,torire:4to,iovere:3uto,sedere:3uto,potere:3uto,vidire:4to,digere:1atto,dimere:1ento,indere:1sso,rifare:4tto,gorire:4to,solere:3ito,volere:3uto,mettere:esso,gredire:5to,pparire:4so,pergere:3so,solvere:3to,tergere:3so,tingere:3to,hiedere:3sto,cingere:3to,mparire:4so,vergere:3so,pondere:2sto,pingere:3to,irimere:2ento,vellere:3to,cellere:3so,mergere:3so,fingere:3to,tridire:5to,aridire:5to,rridire:5to,terdire:4etto,imorire:5to,mingere:3to,pascere:4iuto,predire:4etto,fulgere:3so,verdire:5to,siedere:4uto,lendere:4uto,vendere:4uto,trafare:5tto,tangere:4uto,mmettere:3sso,omettere:3sso,traffare:6tto,evolvere:4uto,imettere:3sso,isparire:5so,emettere:3sso,mpellere:6nte,rmettere:3sso,efiggere:3sso,ivolvere:4to,praffare:6tto,stridere:5uto,amettere:3sso,asparire:5so,ismettere:4sso,infiggere:4sso,itrasmettere:7sso,==adire:3to,algere:3uto,avere:2uto,bere:2vuto,cadere:3uto,cingere:3to,dire:1etto,dolere:3uto,dovere:3uto,emettere:3sso,ergere:2so,ere:3tto,evolvere:4uto,fare:2tto,fingere:3to,gire:2to,godere:3uto,indire:3etto,infiggere:4sso,lenire:4to,mergere:3so,mingere:3to,morire:3to,omettere:3sso,ordire:4to,pascere:4iuto,pendere:4uto,potere:3uto,predire:4etto,redire:4to,ridire:3etto,rifare:4tto,sedere:3uto,sfare:3tto,smettere:3sso,solere:3ito,solvere:3to,sparire:5to,stridere:5uto,tangere:4uto,tergere:3so,tingere:3to,trasmettere:6sso,udire:3to,unire:3to,urgere:3uto,vendere:4uto,vivere:2ssuto,volere:3uto,volvere:3to==aso:1dere,iso:1dere,oto:1gere,oso:1dere,cato:2re,iato:2re,lato:2re,fato:2re,sato:2re,rato:2re,tato:2re,dato:2re,zato:2re,uato:2re,gato:2re,pato:2re,mato:2re,bato:2re,anto:2gere,vato:2re,eato:2re,luso:2dere,urto:2gere,iuso:2dere,usso:1tere,utto:1ggere,ruso:2dere,ulto:2gere,leso:2dere,tuso:2ndere,puto:1ere,buto:1ere,onato:3re,gnato:3re,unato:3re,corso:3rere,derto:3gere,rnato:3re,nnato:3re,litto:2ggere,iunto:3gere,anato:3re,nesso:2ttere,sunto:2mere,torto:3cere,vinto:3cere,mosso:1uovere,piuto:2ere,resso:1imere,punto:3gere,rotto:2mpere,fitto:2ggere,funto:3gere,lesso:2ttere,sorto:3gere,messo:2ttere,morso:3dere,munto:3gere,porto:3gere,tetto:2ggere,iarso:3dere,corto:3gere,cinato:4re,binato:4re,bdotto:2urre,minato:4re,venuto:3ire,ddotto:2urre,finato:4re,ienato:4re,lenato:4re,estito:4re,ainato:4re,eposto:3rre,pposto:3rre,ginato:4re,ostito:4re,critto:3vere,sinato:4re,vinato:4re,vvolto:4gere,linato:4re,ovolto:4gere,cenato:4re,tinato:4re,hinato:4re,mposto:3rre,ndotto:2urre,nvolto:4gere,dinato:4re,rretto:3ggere,menato:4re,iposto:3rre,iretto:2igere,eletto:3ggere,fritto:3ggere,astito:4re,zinato:4re,tenato:4re,uinato:4re,rposto:3rre,odotto:2urre,ustito:4re,gletto:2igere,pinato:4re,genato:4re,penato:4re,oposto:3rre,avolto:4gere,venato:4re,svolto:4gere,essuto:3ere,adotto:2urre,istinto:5guere,dedotto:3urre,diletto:3igere,drenato:5re,esposto:4rre,estinto:5guere,estolto:5lere,frenato:5re,crinato:5re,arinato:5re,ristito:5re,orinato:5re,grinato:5re,osposto:4rre,erenato:5re,riletto:4ggere,brinato:5re,sedotto:3urre,asposto:4rre,urinato:5re,disposto:5rre,"
    }
  };

  // uncompress them
  Object.keys(model$1).forEach(k => {
    Object.keys(model$1[k]).forEach(form => {
      model$1[k][form] = uncompress(model$1[k][form]);
    });
  });

  let { presentTense: presentTense$1, pastTense: pastTense$1, futureTense: futureTense$1, conditional: conditional$1 } = model$1;

  const doEach = function (str, m) {
    return {
      first: convert$1(str, m.first),
      second: convert$1(str, m.second),
      third: convert$1(str, m.third),
      firstPlural: convert$1(str, m.firstPlural),
      secondPlural: convert$1(str, m.secondPlural),
      thirdPlural: convert$1(str, m.thirdPlural),
    }
  };

  const toPresent = (str) => doEach(str, presentTense$1);
  const toPast = (str) => doEach(str, pastTense$1);
  const toFuture = (str) => doEach(str, futureTense$1);
  const toConditional = (str) => doEach(str, conditional$1);
  // console.log(toPast('permettersi'))

  let { gerunds, pastParticiple } = model$1;

  let m$1 = {
    toGerund: gerunds.gerunds,
    fromGerund: reverse$1(gerunds.gerunds),
    toPastParticiple: pastParticiple.pastParticiple,
    fromPastParticiple: reverse$1(pastParticiple.pastParticiple),
  };

  const fromGerund = function (str) {
    return convert$1(str, m$1.fromGerund)
  };
  const toGerund = function (str) {
    return convert$1(str, m$1.toGerund)
  };
  const fromPastParticiple = function (str) {
    return convert$1(str, m$1.fromPastParticiple)
  };
  const toPastParticiple = function (str) {
    return convert$1(str, m$1.toPastParticiple)
  };

  let { presentTense, pastTense, futureTense, conditional } = model$1;

  // =-=-
  const revAll = function (m) {
    return Object.keys(m).reduce((h, k) => {
      h[k] = reverse$1(m[k]);
      return h
    }, {})
  };

  let presentRev = revAll(presentTense);
  let pastRev = revAll(pastTense);
  let futureRev = revAll(futureTense);
  let conditionalRev = revAll(conditional);


  const stripReflexive$1 = function (str) {
    str = str.replace(/arsi$/, 'ar');
    str = str.replace(/ersi$/, 'er');
    str = str.replace(/irsi$/, 'ir');
    return str
  };

  const fromPresent = (str, form) => {
    let forms = {
      'FirstPerson': (s) => convert$1(s, presentRev.first),
      'SecondPerson': (s) => convert$1(s, presentRev.second),
      'ThirdPerson': (s) => convert$1(s, presentRev.third),
      'FirstPersonPlural': (s) => convert$1(s, presentRev.firstPlural),
      'SecondPersonPlural': (s) => convert$1(s, presentRev.secondPlural),
      'ThirdPersonPlural': (s) => convert$1(s, presentRev.thirdPlural),
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return stripReflexive$1(str)
  };

  const fromPast = (str, form) => {
    let forms = {
      'FirstPerson': (s) => convert$1(s, pastRev.first),
      'SecondPerson': (s) => convert$1(s, pastRev.second),
      'ThirdPerson': (s) => convert$1(s, pastRev.third),
      'FirstPersonPlural': (s) => convert$1(s, pastRev.firstPlural),
      'SecondPersonPlural': (s) => convert$1(s, pastRev.secondPlural),
      'ThirdPersonPlural': (s) => convert$1(s, pastRev.thirdPlural),
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return stripReflexive$1(str)
  };

  const fromFuture = (str, form) => {
    let forms = {
      'FirstPerson': (s) => convert$1(s, futureRev.first),
      'SecondPerson': (s) => convert$1(s, futureRev.second),
      'ThirdPerson': (s) => convert$1(s, futureRev.third),
      'FirstPersonPlural': (s) => convert$1(s, futureRev.firstPlural),
      'SecondPersonPlural': (s) => convert$1(s, futureRev.secondPlural),
      'ThirdPersonPlural': (s) => convert$1(s, futureRev.thirdPlural),
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return stripReflexive$1(str)
  };

  const fromConditional = (str, form) => {
    let forms = {
      'FirstPerson': (s) => convert$1(s, conditionalRev.first),
      'SecondPerson': (s) => convert$1(s, conditionalRev.second),
      'ThirdPerson': (s) => convert$1(s, conditionalRev.third),
      'FirstPersonPlural': (s) => convert$1(s, conditionalRev.firstPlural),
      'SecondPersonPlural': (s) => convert$1(s, conditionalRev.secondPlural),
      'ThirdPersonPlural': (s) => convert$1(s, conditionalRev.thirdPlural),
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return stripReflexive$1(str)
  };

  const all$2 = function (str) {
    let arr = [str].concat(
      Object.values(toPresent(str)),
      Object.values(toPast(str)),
      Object.values(toFuture(str)),
      Object.values(toConditional(str)),
    );
    arr.push(toPastParticiple(str));
    arr = arr.filter(s => s);
    arr = new Set(arr);
    return Array.from(arr)
  };

  var verbs$2 = {
    all: all$2,
    toPresent, toPast, toFuture, toConditional,
    fromGerund, toGerund, fromPastParticiple, toPastParticiple,
    fromPresent, fromPast, fromFuture, fromConditional
  };

  let { plural } = model$1.nouns;

  const revPlural$1 = reverse$1(plural);

  const toPlural$1 = (str) => convert$1(str, plural);

  const fromPlural$1 = (str) => convert$1(str, revPlural$1);

  const all$1 = (str) => {
    let plur = toPlural$1(str);
    if (plur === str) {
      return [str]
    }
    return [str, plur]
  };

  var noun = {
    toPlural: toPlural$1, fromPlural: fromPlural$1, all: all$1
  };


  // console.log(toPlural('abboccamento'))
  // console.log(fromPlural('abboccamenti'))
  // console.log(fromPlural('scarpe'))
  // console.log(toPlural('scarpa'))
  // console.log(fromPlural('nuvole'))

  let { fs, mp } = model$1.adjectives;

  const revFemale = reverse$1(fs);
  const revPlural = reverse$1(mp);

  const toFemale = (str) => convert$1(str, fs);
  const toPlural = (str) => convert$1(str, mp);
  const toFemalePlural = (str) => toPlural(toFemale(str));

  const fromFemale = (str) => convert$1(str, revFemale);
  const fromPlural = (str) => convert$1(str, revPlural);

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
    fromFemale, fromPlural,
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
    "Determiner": "true¦altri,gli,i2l1tale,un0;!a;a,i;!l",
    "Pronoun": "true¦ci,esso,io,lAmi8n5quest4su3t1v0;i,o5;i,u0;!a,e,o6;a,o5;a,i;e,o0;i,str0;a,e,i,o;!e0o;!i;e,o0ui;!ro",
    "Adjective": "true¦0:70;1:6V;2:71;3:6Z;4:6J;5:6O;6:74;7:6W;8:68;9:72;A:6T;B:6N;C:62;a67b5Wc4Vd4Ae42f3Og3Hh3Fi2Zl2Pm25n1To1Pp12qu11r0MsZtPuMvDwa4X;ariaKeGiEoD;ca0l2;ce,enBg1ncDsAv1;en9it55;ge4GntErDscovi0t6P;ba0osimi0sa2Cti5T;en6XrD;a0i0A;bi0n9;lter6Imanoi6BnEsDtili6D;c1ua0;ani51ghe5Sifor51;at25eHip8oGrDutt;asEiD;a0Id5Men7onfa0;cu09ver53;ller2riBta0;cn8desc69mGna4SrEsD;si0tA;ma0rD;e3Ii69;i3poC;!aYcWeSfavore6FiPoMpKtFuEvD;aria9e57;d18e,pplem69rrea0;aFel67or8rD;aDutJ;da0gran5T;g59n9tD;a0unit4U;az4ecPiD;na0ra0;ddisfac1lEno5prannaDtto3R;tuC;a5i59u3;nDtua3S;da4YgD;le,o5V;co5Udicen61gu1micirFnEqu3NrDssAttentr4Z;a0ia0;e6tM;co5R;ientDo68rit9;if8;li1pi1;aQeMiDot2;bel0cHnFsDtA;contDorgFult2;ra3;ascDtracc3T;im0V;c5BoD;nDrr1;duDosD;ci3;gFna0pRsEttaDv1I;ngo5C;id1t2;a0g1n2;d4ggiungi3;alunque,est’;aVeTiSluCoMrGuD;bblicEgl4LnD;g1k;a2Zhe;eGiEoD;dutt3Ege3Kmoz47porz47spici1te2Tvinc4;mDncipe;e,o;co3Cdo2Re19fDge54sen0Yve4D;eri3;lGp,rtFsD;s1tD;a0er4Q;an9o3Vua0;a5iDmo3H;go7t8;aneg1Hemonte6rami42;cuUgg0Gna0rD;en4Wse;lesFpa0rEsDtrimon4;s2toC;anor3Vl2rocch4;e,tiB;cMl1LmosessAnli4Rpen,rFsEttenDva0;i3ne;pi9serva3;bi25chestCdi7izzon25mo7;aMeLoEuD;cl0Cz4;biImHrD;dDvege6;-oDoriP;cDriO;cidN;a3Xi7;lia5;pale6wyorke6;sDta0va0;a0c1;aReMiIoFuD;ltimed4nici1CsD;co42ea0;deBl0nDr1t2D;d4t2umD;en1N;cid4gli0HlEnD;eCor;aBiD;a5t2;ccan8diGrEssiBtalD;!l8;canDid2X;ti0;c3KeRoeR;gEnagDrgi7s2XtD;er4;gDic3H;iorD;!e;!aKeIiGoEunD;a5g3D;de3NnDqua1V;diBgitu2D;beCeve,gu5nDve;ea5;gaDssi2Gt23;ti;rDteC;va0;dentifica3mNnGrEstDtalian;ituz2Erutto5;l09revD;er3K;arresta3cIdiHeGfFgEteDusAvF;gr2r30sti7;anne39le6ombr2;er7;sist1;ffer1spensa3vidA;apa1Dli37onfon2E;mFpD;ermea3on0IreD;ndi2Uve2B;in1obilD;e,ia5;ardco5orrD;or;alleHeFiaElac4rD;avit15ec2L;lloblu,ppoB;nDolog8;ia0oL;gDse;gi2;aPeNiJluv4oGrFuD;nDorvi2;eb5zion2;ance6on06;ca0nda0CrD;!liDmida3;ve6;nEsD;ca0ic27;a0e,lD;an19;rDu1L;ra1Gv1;c1llim29;conom8diIgAlettHmerg1piscoGqua24sEtc,xtraterreD;st5;istRponYteD;nu2r1Z;pa0;oCr8;le,tD;or4ri0D;aWeOiGoEuD;a0ca0pli0B;c1r0JtDvuS;aRtri7;aletJfGrigFsD;cDtin9;e1Cipli0H;en9i3;enso5ferD;enD;te,z4;ta0;cJfHmGterFvD;aDoz0R;st2;min2;enz4;iniDorY;ta;en7i0P;ne6rk,ta3;a09ele08him8i04lass8oHrFuD;rDsto11;ve;an4eD;d1sc1;lUmSnErDstitu1;a0r1;cOfMgen4iuga0nLsFtD;a3inuando,raD;en9ttA;eFiDul1;glDst1;ia3;gu1rvatD;riD;ce;az03;in2orD;me;eDorr1;ttA;and2busti3pleDu7;m0Ttam1;lEosD;sa0;aEeg4iD;na5;teC;neFrcoEstercD;en6;l2st2;matograf8se;b5s9;nErDuS;di7;aDt2;de6;aJel,iGoDritann8uon;cElogBrD;ghe6;ca0;dDen7;imensD;io7;biloBsa0tteEvaD;re6;siD;ma0;bru0Kcc0Ed0BeroportAff08g06l01maZnTppRrMsItEutostraDzienD;da0;enFtD;acc2enD;di3;ie6;ceFsiEtC;ra0;mila3st1;nd1;agoBcErog2tiD;gia7st8;aEhitetton8;icJ;de;arten1reD;zza3;a0gHtD;erFiD;cDst2;he;io5;losassoNoG;tor4;ia0; coperto,a5baBimEveoD;la5;enta5;ne6;re;eDi0;vo0;iDlu1;ne;ua0;domi7er1;en9;na0;attiv2esD;si3;bi0;le;an9;te;zze6;se",
    "Preposition": "true¦a9c6d2f1in,molti,ne4p0su5tra;er,rima;ino,ra;a2e1i,o0;po,ve;g7i,l5;!g6i,l4;he,o0;i,l,n0;!tro;!d,g2i,l0;!l0;!a,e,o;li",
    "Cardinal": "true¦cOdFmilEnovPottDquAse9tre2un1vent0ze7;i4otJu3;dFo;!dEnt0;a1otGu0;no;!cinq2d2nHquatt1se0tré;i,tF;ro;ue;d7i,ssaGttF;a0ind6;raEtt0;ord4ro;aCo;ione,le;i2od1ue0;!cen3mB;ici;ci0eci8;a1ot0;to;nn1sset0;te;ove;ento2inqu0;a0e;nta;!m0;ila",
    "Possessive": "true¦mi4n2su1tu0v2;a,e,o4;a,o3;ostr0;a,e,i,o;e0o;!i",
    "FemaleAdjective": "true¦0:A5;1:A1;2:9Y;3:9Q;4:9D;5:9E;6:9B;7:8R;8:9O;9:9U;A:68;B:9I;C:9K;D:8O;a8Hb82c6Id62e5Cf4Sg49i3Qjugosla9l3Dm2Tn2Go24p19qu17r0UsYtPuLvE;aJeHiGoFuE;lcaDo0;ca96lont7;ci2n0olen0si9ttor9L;cch8neEra;ta,z95;liAr8s0;l3FmFniErbanG;ca,ta04vers5C;anEb5iA;a,is3;aLeGi21os9YraFurE;ca,is3;gi1nquil9M;cnHd46leGmpFne5oEr9Ysa;lo8Nri1;e6Zor6N;foDvi9O;i1o8J;rAt3;a07b5Vc04eZfYiUoPpKtFuEvizze5;cc9Jdd69gges6me5preB;aHes4il9FoCraE;nFord3JtE;e8Eig70;a,ie5;mpa0ti1;ag07eGic8GlendiAoE;nt6BrE;ca,ti9;ciEs4;aliz7Nfi1;ciHggett6HlEno5sp5Ytt2Avie3;a,iE;da,s0taE;!r8;al8Cet7;cGgnifi4Umbo87nFsEta;mi1te59;foDgo8Wist5;il86u5;eCortu9B;cHgre0lvagg8man3pGrFttEve5;ece3CiB;ba,e2ia;a66ol0;ca,ond7;ar4eDiFoEu5;l4Nn4X;e3Xi0;c5l3PnE;gu1Zit7ta;aOeMiJoEus4;bus0cc87maFsEtZ;a,s6O;gFnE;a,i1ti1;no8E;c1fles4gFnEpiAstr58t8Qvolu39;nova0o7T;iAo5W;al8Ccipro1lEmo0pubb7Ssid5D;a6ig7Y;diofoDpEra;iApresenta6;aEotid7H;d5Lnt87r0;a03eZiWl44oTrHsicGuE;bblicEli0ra;a,it7;hi1o73;a3eLiIoE;ble4Bd4SfGgr84ibi0lunga0n0pr8s7TteFvE;a0vis0D;i1t0;onA;mFvaE;!ta;ar8i6oge1S;ci4ma2LsGvEz7H;en6iE;a,s0;tig7Eun0;e3lFntific8pMsEve5;i6tuB;ac1i3;aFcEe2ttoC;co7Ke2;n0t0;nul15rEs7Ctrolife5;du0f4CiEs6S;cEfeCo1W;olo4;ci54da2ga2nora7RrFssEtS;a0i9;aFigi2la0tE;en2Oig6M;lle7As6H;bbligatOdiNgg4QlimMmoLnto6BpIrFscu5ttE;a9iB;atMdinaFganiEig1Etod1U;ca,zzat4K;r8ta;eraFpoE;rtu2s0;ia,ti9;gen46niB;pi1;er2;or8;aMeKoGuE;da,merEo9;i1o4;na,rFtE;a,tur2;di1maE;n2ti9;cess7ga6mi1o77rEt0;a,vo4;!poleGr6Bscos0tFziE;on4Ns0;i9ur15;oDta2;aSeMiJoFuE;r7sic5W;deGnFrE;biAfo5J;as3et7tuo4;r2s0;a,nFstEti1;a,er62i1;er7iBor1X;dGlo0Rra,ssi6LtEzza;aEeoro5Cropolita2;fi3Tl5I;e62iE;a22ca,tE;err3A;f5Ugi1n5DrHssiGtE;eEu5;ma3r2;cc8ma;ca0itOm2Yx5Ez5C;aPeKiJoGuE;mEng5D;ino4;mFnE;goEta2;barA;be5gn2Zmi24ngu5Wq0Vri1t3M;gEn0tter7;a0geGiE;sla6tE;tiB;nd7ra;i1r3Lti2vo5B;beCdVgno0llumin50mQnGpote3roDsFtaliE;a1Hca;la5Yo4Gtant2P;aspet1UcMdKedi0fIgen2NnHtEv2M;at0eEiB;n4rE;a,med8na;a0ova6;iEor1R;ni0;iEu4Q;a2ge2r27;er0in0;mFpE;egMortant4Orovvi4;agFeEu1I;d1Un4;in7;en3on2AroelettC;eSiIoGrE;aEe1ig8os4;fi1m1End4Htui0;ti1verE;na6;allLgaJoGuE;di04riEs0;di1;rnFvE;an4Aia2;al4W;ntE;es1;a,orE;os4;neGoFrE;archi1maD;g2Clo3QmetC;ri1ti1;aUerSiNlMoIrFuE;tu5;aFeE;dAs1;zion7;nArEt24;tEza0;iEu4V;fi3Ls47;uiA;loso21nGorFsEt0;i1sa;en2F;anEi0;zi7;ma,rE;a0ovi7;l4mo4ntasErmaceu3sc3H;cieEti1;nti1S;br02cYduXff1IgiziaWlQmPnOpNrLsGtFurEvolut1Fxtraurba2;op15;er2i1ni1rus1;at0e15pHtE;eEi9reB;rEti1;a,na;lici0r3Z;edEoi1ra0;it7;a3i1;erge3ne3K;o6piC;as3eFlE;en3Pit3;ttrFvatE;a,is3F;i1oE;magne3ni1;!na;ca6;cFoE;lo2Ino3S;es3KlesiE;as3;ai1ea;eQiHoGramNuE;bb8raE;!tu5;lo0Tmes3pp8ra0;chia0NfKna3KpIr02sFur2vE;er4i2;abiFcEpe0Ltrut0;og0Tre0;ta0;in0loE;ma3;en36fE;icolto4u4;cis0Cdi0fini6g2li26moFn4ttE;aglK;c1Ug0Ln0V;a0Qe0Ohi0Mi0Hl0DoLrFuE;pa,r2J;ea6iHoFuA;da;a0cEma3ni1;ia0;stEti1;alli2ia2;l02mWnMperLrJsE;iddHmGpicPtE;ie5o4rE;ut6;i1opoli0;et0;ea2pEta;orL;ni2Pta;cMsKtE;adi2emporHinGrE;ar8ovE;er4;ua;anE;ea;eEideN;cu6;lu2Bre0;i1memo1RpFuniE;s0t7;at0eti6lEosi6re4;eEi19;ssEta;a,i9;lFoE;ra0;et6;aEiD;moFndes00sE;si1;ro4;lindCneEvi1;matEti1;ogE;raE;fi1;a5mi1rEu4;ur0O;lEr0;eberriBti1;!lJmpa2noDo3pitIrGsalinFttE;i9o0Q;ga;a,boDdEi1nivo5si1;ia1;al0Q;c1Eda;aNeJiGos4rEuo2;asil0LitanDutE;a,ta;ancFb0Ho0AzanE;ti2;a,one5;lErbe5;ga,lE;a,iE;ca,s0W;roc1sFttE;eCu0;i08sE;a,isE;siBta;bbando1Dc1Cd1Ber18fr14g0Ul0Om0In06p01rPsNtLuGvEzzur5;anEvers7;za0;strHtE;en3oE;mEnoB;a3obil0S;al00ia1;le3mosfeCo11tE;a,en0i9;p5solu0trE;at0ono0Y;ab05bitr7cJistoHmGtiE;coEs3;la0;a0e2oD;cEteP;ra3;ai1hE;eoFitettoD;ni1;loE;gi1;ar8;er0ostoHpE;liFoE;si0;ca0;li1;aMgLiKnJoniBtiFzE;ia2;cFfascE;is0;a,hE;isS;es4ua;ma0;li05;lEto07;i3ogE;a,i1;a5bizGe00i1ministEp8;ra6;ti9;io4;sa;ra;geHie2pi2tE;a,isEra;siB;ma;bCri2;ri1;gJia0onHrE;ar8icoE;la;ia;is3;ti1;iorQrE;esE;si9;va;iFoameE;riE;ca2;na;ea,odinaE;mi1;ca;at0espo0ul0;centua0u0;na0;ta",
    "Condition": "true¦nel caso che,si",
    "Negative": "true¦n0;on,ulla",
    "Noun": "true¦0:4O;1:4V;2:4R;3:4F;4:4D;a4Ib48c3Gd3Be39f2Wg2Li2El23m1On1Io1Dp0Jqua0Ir09sOtDuCv5zucche4W;a9i7o5;ce,l5;o,ta;a0Ideocas2Vs38t5;a,tor4I;l5s4A;i1u35;cc3Yffic3o3B;aDe9itol22r6utt5;'u4i;a5ime2S;ffi1ma,tt5;a0o;mpes2Yn29odo4Fs5;su0t5;a5i,o;!ta;c1s5vo3S;ca,s0Ato;aNcHeFfEiBolAp9quad3Tt6ussid3v5;iluppo,ol2R;a0or41r6udi5;!o;a1Zuttu3P;az3ec0So3D;di,e;gnifi18n6stem5;a,i;da1i2A;i1TorX;c0Mde,gui0me28r5;ie,ra,vo;a8h6o5;n0po;er5ia1J;mo,zo;la,r5tola;i1pa;bb3Kl5ng00;e,ot0;appCe9i5;c7fugia0mborZs6t5vol26;or4rat0;ch3p26tor2Kulta0;er37o;!cla29ddi0g6t5;e,ta;a2Vno;or0resent2F;d3Il2Irtier generaS;aSeLiIlas3Jneuma3JoDr8u5;ls2Cnt5;e5i,o;gg3;an8e7o5;cesLfi2Ng5sp1Uva;et0ram0S;m3z5;zo;l7n25rt6st5te2;a,o;a,i1;i5lo;tec2Yzi2K;a6e5;de,t2;n0Hst2zza;lAr5sce;c7d6i5si1;co29o0R;ue;en0or5;so;le;d2io,l9ni1r6s5;so,to;co,t5;e,i5;!to;cosce2Ie0V;biet08c8gnu4n7perLr5;ec7o5;!log3;e2o2;ch3;a8e7ien1Fom6u5;me2Ht2;e,i;goz3mi1ssu4;s5tu1Vve;ci0To,t2D;aGeEiBo7u5;ro,s5;ei,i1U;dellOn02r16s6t5vimen0;o2to;ai1tr5;a,e;li6s5;ce1Iu1L;arWo1C;r5sY;ca0;cchi0Td2est20go,mHni6p0Yr5tti4;ca,e,i0si1;co,e1F;aBe9i7od6u5;ce,d5;ovi1;b1Un5v14;ea guiKg19;g5sOt0;a,ge,no;cri7st2t6vor5;i,o;o,te;ma;mpAn5;c5iz3;a7en5;ti5;vo;nt03ri1;or0ronW;aEene2i9over4r7u5;i5s0;da;a5i0V;do;ac0Uo7u5;bb0Pras5;si1;c5st2;hi,o;eli1sd0L;aEede11iAlotKo6r5ungo;ecc0Uutti di ma2;gl0TnZr6s5;setY;m5za;a,u0D;gli7l6ne5o2;st2;e,m;!a,o;bbri0Et5;a,t5;o,u09;n5re0TstaO;ri1traN;ati,e8i6ome0Jura5;ta;f5o,va4;et0;mo0Ntenu0;aOeLhi1iJo8r5;istian5uscZ;esi5;mo;lEmAn6per0Ar5;da,o8so;dizioNs6t5;o,rolO;eg5igl3;na;merci6p5;i0lean4uter;an5;te;pa;as5bo;cu4;n6r5;ch3ot0;e2t01;lc3mpiona0n8pit7rne,u6val5;ie2lo;sa;a4o8;c6dida0e,zo5;ni;el5;lo;aAi7o5racc3u1;cBl5;la;r6sc5;ot0;ra;g4r6tta5;glC;ca;no;cqua,driaKlGmDn8pe,ramai1t6u0vversar3;io;lanIt5;i1o;at2dro8ima6s5tibioG;ia;!l5;e domesDi;ni1;al6bi0;to;ri1;a7be6t2;re;ro;!ri1;ti1;co",
    "Adverb": "true¦aZbenYcVdSecc,fRgià,inPlOmLno,oIpDquAs4t1vi0;a,ci06;a1roppo,utto0;!ra;lvolta,n05rdi;e4in,o1pe0ubi04ì;cie,sW;l1pra0t02;!ttut01;o,tZ;conda,mpA;a0i;l0nXsi;e,i;er3i2o1r0ur;esUopr8;co,i;uttosSù;alBsiP;lt1r0ve;a,mai;re;ai,e0olN;gl0no;io;à,ì;die3fine,siEt0vece;anIorG;a,orse,uori;a1ie0;tro;pprima,v5;irca,o0;m0sì;e,unque;!e;bbastanza,cc8ddirittura,lme7nc5ppun9ss3tt1v0;anti;or5raver0;so;ai,i0;eme;h',or0;!a;no;an0;to",
    "PresentTense": "true¦aOdIhFpBs4v0è;o1uo0;i,le;gli0leM;aNoJ;a4i2oIt0;a0iaLo;!i,nAte;a0eH;mo,no,te;!i,n7p0;eEpF;o1u0;oi,ò;ss0teB;a8ia5o8;a0o;!i,n0;no;e2o0;bbia0ve5;mo,te;bba1v0;e,o0;!no;bb1ve0;te;ia0;!mo,no,te",
    "Date": "true¦domani,ieri,oggi",
    "Verb": "true¦avvenuUchiamSdebboRf8stSutilizzaUv0;a,e0ienJ;n1rr0;aBe3à,ò;g3i1n5ut0;a,e,i,o;a0mIsDte,vC;mo,te;aJoJ;a1ec0;eDi;c5i,n4r0te;a2e0à,ò;bbeAi,m0st7te;mo,o;i,n0;no;ci8e0;m6s1v0;a7i,o;s1t0;e,i;e1i0;!mo;!ro;mo;a0o;!mo,no,te;!no;at0;a,i;ta",
    "MaleAdjective": "true¦0:LG;1:L5;2:L3;3:JM;4:KS;5:KX;6:LB;7:K8;8:L2;9:KT;A:LH;B:JW;C:JL;D:J2;E:LI;F:J1;G:LC;H:IM;I:L7;J:K0;K:JJ;L:GJ;M:IZ;aI7bHKcEUdDAeCCfBBgAEi8Hjunior,l83m6On67o5Ip3Wqu3Tr2Vs0Wt0Du06vNzopHG;a03eZiPolOuN;lnera8o0;gaLontF;brAgVnc19olUrtuTsQtPvOziN;a0o3;aIJi9o;a2torC;cOiN;bi2vo;eGSi9o3;a2o3;a,en0;i2oHY;cchiJMlPneOrN;de,gogEEo;ra8to,zM;eECoI8;cAgo,l2SnNriJIs0;o,taEV;brGUffIGgFIl9PmRniPrNti2;banNg5inF;is4o;co,lateGFtFversN;a2itF;a7iN;do,le;a03eWiVoSrOurN;co,is4;aOemDJiNopi5Z;butFpJsE;diNgi1nquilJspar5uGI;toLzEN;ccArOsNzGS;ca7si1;na0rentC5;be6Dmi9pi1;atG1cnDZd9GleSmRneBoQrN;apeu4miOrN;i8orHD;co,na2;loI5ri1;a4pEN;foHviI;cit54lNr9t4;ent5Mi;a1JbD5c19e11fo10i0VnelJo0Hp08qu07tUuOvN;ariaEZeglDizzeB;ccRdQf7Sgges6pN;erNreJ1;!bo,fNioL;icHMlIU;!dG3;esIo3;aXeWiUoH8rQuN;dCpN;eNi9;fJKn9;aOeNiduJumJY;piCNssAt0;biliAnNordinFteHMvagA;ieBo;lGQmN;olA;ri2s3;bi2gnAnNti1;co,dard;al3LiHL;aTeQiPlendi9oN;ntDXrNsa0;co,tiG;eJ9go9Hna0ritE3;ciOrimJKttN;a50ra2;al96fi1;g0ZzN;io3zatura;cialZddisfDKfXgg3XlUnTrSsPttOvN;ie4ra7;e5Ei2;peOtN;aDWeni8;so,t0;do,preD1;oBt4J;enGZfoGDiN;do,tN;arDo;fNiIT;er0iG8;democC4e,isDS;cQgnificaPlenzCmOnNsteEUto;ceBfoHgolHAistBte4;boHYi2m8Ipa4;!tiG;ilMuB;ca0rtuIA;cTdizCgre0lQmpliG0nsPpOrNttimaCVveB;e7io;aIQol0;a0i8;eOvaN;ggDti1;t6zI2;co,ond8W;aVet4hiUiRoOrQuN;ro,sa;lA8mo9nNr3;fNoD0vDQ;it0;at0cGGe92oN;ccNl0;anEo;acciAet0fo3;nda8Ar3;crGNggiGTnNr9tiFJ;itFo,to;a0Ee04iUoPuN;moF1ra2sNvi9;so,ti1;bGJccCmaOsNt0utiG0;eo,sGH;gOnN;i1o,ti1zo;noJ;cVdUgTl56nRpQsNtI9voluzionF;cOer3CpettNtrE1;a8iG;alda0hC;eti6i9;frescAnovaNoma0;bi2to;i9oEN;iGWot0;cFZet6;aVcUgTlSmo0sPtN;roat6tN;ilinESo;iOpN;irA6o4V;deC9st5;a6igC;io13oD6;enEipro1;l2Mt6;diQffiGXgCJpPro,zN;ioBIziN;a2s8X;i9presen87;ca2oN;at6foHteleviI;aOest'ul62oN;!tidM;dH8li82ntE7;a0We0Oi0Kla0Io0BrRsicPuN;bblicNli0ni6ro;itFo;hi1oN;loEWti1;atic2Te01iWoNud5;at6ba8ceduCMdUfSgrG8liE3mRn0pQsOt1MvN;a0enienBToc9KvisB9;peNsiFWta4;ro,t4;orzGDri09;ett5in5;essionNon9;a2is4;igCut6;gionieBmOncipa2vN;a0ilegEPo;arDiOoN;ge4SrdE9;sFKtiG;cQdB5fe57liminaLmPoccupa45sOvNzC;al5en6io;enEiB8tigCun0;a8Gium,uDE;ed5i3;chisFEe4lRntificDpolQrta4HsOtenNveB;tCRzE1;i6sNtuFD;esIi8;aLo3;ac1eGMiN;ti1zi5C;ci9nNuEW;etF;aPccOeNgBo,sa7ttoDI;ga0no,to3;anEoJ;ceKt0;dagoDYlo3nTrNsA;fC6iRman5peQsNtin5vaI;iOoNpicaDB;!na2;a7st5;ndi1KtES;co5Yo5D;sieCSti0;cXffu0lWrRssQtOuCRzN;i5zo;eNriot4;r7ti1;a0eggeBiG;aQiPlaOsimonCtNzDC;ecipanAKi1B;m75to;!gi7;gona8lleJnoi1;li9;a0iCO;bbligato0Acc08di07ffenIgg06k,l05m04n01pXrRsQttNvvDzC;iNo0U;co,mN;a2is71o;cuBsCLti2;a2dinaRgPiNri8todos3;enFJginaN;le,riDX;aniNo1D;co,zz3U;rDto;eraPpN;oNrim5;rtu7s0;io,tiG;es0oN;m6VrN;arDeK;bBXogenC7;eo3f9Aimpi1;et6;er7o3;as91uN;l0pa0;!rD;aZeVoPuN;do,lJmerNoGtriz8X;i1o3;bi2io3rPstalCMtN;eKo,tN;ur7;dOmaN;le,n7;!aDYi1;cess4YgPoOrNt0utrCY;o,vo3;cla72na0;a6l77;polePrD5scos0tNz8L;al65iGuralN;e,is4;oHta7;a0Ke09i03oRuN;ltipJsNto;iOulN;ma7;ca2;bi2ccCdVlSnQrPstrOtiN;va0;uo3;a2bi9tCI;as4etFtN;a7uo3;eOtN;eplici,isCZ;co9P;a,eNu9O;rNs0;a0no;gl1Vli5EnQraco3XsNt9A;erOtN;erCi1o;a8o;iNoLusCY;!mo;ccaHdiVlo36morUnTrRsQtNzA0;allOropoliN;ta7;i1o;chi7siD0;aviNo;glC;si2ta2;a8ia2;co,o,teN;rr7V;cho,es6Ag01lXnWrTsQtN;eNto,uB;ma4rN;ialistica,no;chiOsiN;ccDmo;le,o;cOiNm76roB5zAU;a7no,t21;a0io;ca0ua2;a0eOiNvagD;ncoHzC;dNvoJ;et0uCW;i1nNro;e4iA3;aZeUiToRuN;ci9mi6BngOssuN;o3re14;hiNo;!sBS;ca2gi1nN;gobar9ta7;beBe0miCKngu9Squidi,ri1scDt8B;a2gOn0tN;a2ter32;aD5geOiN;sla6t1H;ndFro;i1r8Gti7;bri9d1Ggno1Fll1Bm0XnWoHpote4rPsNtalM;laCUpi9raelMtN;ant6Xe9T;oHrN;ePiN;lNta8;evA;go82sN;is7JpoN;nsa8;a0Mc0Gd0De0Cf05giAQizia04n00quietAsXtQu0BvNzuppa0;aOer3iN;nci8si8;d5rA7;at0eNiB5rinse1ui6;graCMllRnQrNso;essaOmedDnNo;az67o;nEto;s72zBJ;ett6Nig5;apoLenAMigni16oli0ta8uN;bo4GfN;fici5;atPoNumerevoli;cNva6;enEuo;o,u7G;le,tiva;aRePiWlu5ormaN;le,tiN;co,vo;li8YrN;ioL;lli8nN;ti2;di0r5viBS;efiOiNustr95;a7ca6fe3gB1pe5Fr7Mscus3;ni0;er0lRoNredi8;er5mpPnOraNstit59;ggiA;dizAVscD;iu0le0;iAUu3;deB1spetB3t6ugu6X;barazzAmWpN;aTeRl2EoQrN;eOoN;ba8vvi3;cisa0ss2I;rtant7Gs9R;c95gnNr8P;at63;uNzi5;ri0;aOeNorB5un28;d8Yn3;ginaNtuB;bi2rD;eNustL;ci0gN;a2itN;ti9R;rAto;eOill6Pon7WrN;au9Ti1og7S;a2n4;a0Ie09hiacc8Ni00loZoYrNus3I;aReQigDoN;ssoOttN;es1;!la7;co,z6S;dRfi1ndPs3tNve,zC;iNo,ui0;ficA;e,iN;o3s9B;eKua2;mmo3ti1ve9B;ba2rC;alJganteUoQuN;diziFriOstN;ifiA2o;di1;io3rnal76vN;anNia7;e,iN;le,s90;!s1;lUnPoNrmaHs57;g72lo7UmN;et79;eOtilNui7;e,izD;rNti1;alNi1o3;e,izAF;i9o3;l2Nsso3;a09e05iYlXoTrOuN;nz3TrCso,tuB;aQeOiN;t0voJ;d9ne4qu5s1ttoN;lo3;gi2nces8Y;lA0ndaPrNt6L;ma2tN;e,u90;m9LnEto;es82oscDuor94;dSeBloso6InQorentPsN;iNso;co,o76;e,i7;anziNi0to;ari7U;a0ucC;dePli6HmminiOnome3CrN;mo,o6GroviFti2;le,s0Q;le,ra2;cYlWmTntasQstidCtOvoN;lo3reK;a2i74tN;i8ua2;cieOiNti1;a,o3;nti61;iOosN;is7To;ge8WliaL;lNso;i0o;i2olN;ta6;br0Jc0Fd0Dff0Bg09l03mo01nZpi1quival5rXsQtPuOvN;ent3Bid5olut3P;clid5Trop5T;er7i1ni1rus1;at0clus3MeSilarAo4pQse3BtN;eNiGre7J;rNti1;i,no,o;an3er0lNr33;ici0;cu6mp44nE;edNoi1;itF;ergNne7Aorme,tusiasX;e4i1;!tiGzN;ionA;aReNiE;gAmOttrNva0;i1oH;enN;taL;bo85s4;izMoisN;ta;et6icN;a59i5;ilNuca6;izD;cNlet4o5B;eOlesiN;as4;ll5sIz1X;ai1eo;'oBa14e0PiYoSrQuN;bbDrN;aNo;tuB;aNit0;m3Ks4;lQmOppDrNta0vu0;a0i1mi5;eNinA;ni6Ws4;ce,orN;anEo3;c0Cd0Bf06g05l04na7Qp03rett2GsQvN;erOiN;no,siG;so,t5;aYcVgus06leUoTpRtN;aPintNr12;iNo;!vo;c72nE;a78e78oN;ni8s0;rdi6N;ssi1;og45rNu29;e0iminN;at1B;bili6Sst3V;e0Vin0lo2W;ig5;es6i72;ePfN;iNu3;ci2d5;nItN;to3;at4;en9;bo2c00diZfYg7lWmoUnSpRsPtN;ermi66tN;agl4M;crit6er0iderNtB;a8o3;loreKr15;so,tN;a2ro;cNg3Jn2F;ra4;ega0iNud5;be6Fca0zC;init1Dun0;ca0to;ad5enEiIo4Y;nNta0;no3;a1Ye1Shi1Qi1Ml1JoWrOuN;ba7ltu1Tpo,rC;eTiSoPuN;c3QdNen0;e2o;a0cOnN;i1o3V;cAia0;mi04stMti1;a6mo3;er5inv18l15m0PnXperni5BrSsN;ci5idd20mi1tN;anEiOo3rN;ut6;eBtN;uzW;aQpPrNto;et0ispoN;nd5;or2U;ggC;c0Ddi0f0Agress09n08o07s02tSvN;enOinN;c5to;i5zN;ioN;na2;agCeTinSrN;aOoN;intui6ver3;ddittOffNrDs56;at0;orD;en5Guo;mpNnu0;orN;an2D;apeKePiderOuetN;o,udi32;a0eK;cu6rvN;atoL;sciu0;es3;ua2;iNu3;deN;nz2I;luIre0;i1me00o9pQunN;e,iN;ca8sNtF;ti;aTetSlPoOreNulI;n3Cso;rtam4Ts0;eNi4I;ssNto;iGo;enEi6;ssOtN;i8to;ioneK;rc22sN;ti8;lOoNpeKto;n1Zra0;abo30et6;ol0;aNiH;mo15ndes1ZssNustrofobi1;e,i1;c3Be1lind1InPrcolarOttadi7viN;co,le;e,i;emat16i1;aBmi1rNu3;ur1X;co,lPntOrN;ebNto;ra2;eberri2XluNti1;laL;re;dZlXmWnoHo4pVrRsPtNu0vo;astro0YtN;iGo2X;alinNua2;go;atter0RdPenEiNnivoBo,si1tesM;co,no,sNtateK;ma4;ia1;a0Wo,riccC;po;cNdo,mo,vo;ar0Pis4o30;et0;a06e00iXlWoVrOuN;io,o7;aSevRiQonPuN;s1tN;a2to;zo;llAtanH;e,is28;silMvo;livMtaH;an9u;anc1Gb2AlancDoOzN;an0VzarB;lo0Zn9;llQnNrgamas1;eNig7venu0;dettNfi1;i7o;iNo;co,s1W;g2GnOrNs3;bu0oc1;a2cF;b37c2Qd2Her2Ff24g1Zl1Qm1En0Zp0Sr0Ds06t01uRvNzzurB;an3FvN;eNinc5;ntuNr3;ro3;daZrVstrUtN;en4is4oN;biPmNno1MreK;a4obilN;is4;ogN;raN;fi1;alMia1;eo;eo,le4mosfeQo2QroPtN;eNiGra5ua2;n0so;ce;ri1;ciut0ia4pSsQtN;rNu0;at0oN;no2I;eNicu28olu0ur9;nEr6;irAro;aZbitrFcUgenTia7mRrabb03tiN;coPfNs4;icN;ia2;!la0;a0e7oniN;co,o3;ti7;ai1hN;eoOitettoH;ni1;loN;gi1;bo,ncioN;ne;er0pN;aRicciQliPoOroprNunti0;ia0;si0;ca8;co3;r5ss10;aYgXimaVnToSsCtiOzM;ia7;cPorF;arD;io;hi,o;maJni0A;es3uN;a2o;le,tN;i,o;us0;lNrchi1;i4ogN;hi,i1o;aXbiTe0FicRmiOpiN;!o;nistOreKsN;si8;ra6;heKo;vo2;en11gPzC;io3;so;uo;ro,to;coUfabe4ie7lRpi7tN;ePisNo,ro;siN;mo;rna6;'aper0armAeN;a0gB;ro;li1;gPitan9nos4riN;coJ;lo;iun6rN;esI;fSrN;iPoaN;meN;riN;ca7;no;aQezOida8olN;la0;ioN;na0;ma0scinA;eo,oN;dina0Bnau4;at0doReQiPoNul0;lNra8;esc5;ac5;gua0;meOrmenN;ta0;stiN;ca0;cRi9quOuN;s4to;a4eo;ti1;do;adeWeSidQoOuN;ra0;gli5modA;enE;enN;ta2;so,tN;ta8;bi2;le;mi1;co;bTiOuI;siG;le,tN;a6uaN;le,to;tiG;vo;oNronO;ndAzN;za0;to;anE;te",
    "Conjunction": "true¦aLbenKcIdGeDgrazie a,inCmBn9o7p4qu3s0tuttav8vi5;e1i0;a,ccome;!bbene;ando,inM;er1iutto0rima CuA;stoD;cIò;!p6ss0;ia;e0é;ancDmmeno,p3;a,ent3;fatti,olt2;!d,p0;pu0;re;opo 0unque;c6di;ioè,osí0; c4;c4sì; causa 4ffinc3llora,n0ppena;c1zi0;!c1;he;hé;di",
    "PastTense": "true¦aveFdoveDe9f6pot4s1vol0;eElD;apeDeppCt0;avDe0;mJsEttA;e0é;i,mHr2sCvA;osBu0;!i,mFr0;ono;bb4r0;a0i,o;!no,va0;mo,te;m9s4tt0v2;e7i;m7s2v0;a0i,o;!mo,no,te;s1t0;e,i;e1i0;!mo;!ro;mo",
    "FutureTense": "true¦a2do2potr3s0vorr3;a0tar2;pr1r1;vr0;a1e0à,ò;mo,te;i,nno",
    "ConditionalVerb": "true¦av2dov2pot2s0vor2;a0ta1;p0re1;re0;bbe1i,mmo,st0;e,i;!ro",
    "LastName": "true¦0:32;1:39;2:37;3:2W;4:2C;a38b2Yc2Ld2Be28f22g1Wh1Mi1Hj1Bk14l0Wm0Ln0Ho0Ep04rXsLtGvEwBxAy7zh5;a5ou,u;ng,o;a5eun2Roshi1Hun;ma5ng;da,guc1Wmo24sh1YzaQ;iao,u;a6eb0il5o3right,u;li38s2;gn0lk0ng,tanabe;a5ivaldi;ssilj34zqu1;a8h7i2Do6r5sui,urn0;an,ynisI;lst0Mrr1Rth;at1Romps2;kah0Snaka,ylor;aDchCeBhimizu,iAmi9o8t6u5zabo;ar1lliv27zuD;a5ein0;l20rm0;sa,u3;rn4th;lva,mmo21ngh;mjon4rrano;midt,neid0ulz;ito,n6sa5to;ki;ch1dJtos,z;amAeag1Wi8o6u5;bio,iz;b5dri1JgGj0Qme21osevelt,ux;erts,ins2;c5ve0C;ci,hards2;ir1os;aCe8h6ic5ow1X;asso,hl0;a5illips;m,n1R;ders1Yet7r6t5;e0Lr4;ez,ry;ers;h1Zrk0t5vl4;el,te0H;baAg09liveiZr5;t5w1M;ega,iz;a5eils2guy1Pix2owak,ym1C;gy,ka5var1I;ji5muU;ma;aDeBiAo7u5;ll0n5rr09ssolini,ñ5;oz;lina,oIr5zart;al0Ke5r0S;au,no;hhail4ll0;rci0ssi5y0;!er;eUmmad4r5tsu05;in,tin1;aBe7i5op1uo;n5u;coln,dholm;fe6n0Pr5w0I;oy;bv5v5;re;mmy,rs13u;aAennedy,imu9le0Ko7u6wo5;k,n;mar,znets4;bay5vacs;asX;ra;hn,rl8to,ur,zl4;a9en8ha3imen1o5u3;h5nXu3;an5ns2;ss2;ki0Ds0R;cks2nsse0C;glesi8ke7noue,shik6to,vano5;u,v;awa;da;as;aAe7itchcock,o6u5;!a3b0ghMynh;a3ffmann,rvat;mingw6nde5rM;rs2;ay;ns0ErrPs6y5;asCes;an4hi5;moI;a8il,o7r6u5;o,tierr1;ayli3ub0;m1nzal1;nd5o,rcia;hi;er9is8lor7o6uj5;ita;st0urni0;es;ch0;nand1;d6insteGsposi5vaK;to;is2wards;aBeAi8omin7u5;bo5rand;is;gu1;az,mitr4;ov;lgado,vi;nkula,rw6vi5;es,s;in;aEhAlark9o5;hKl5op0rbyn,x;em6li5;ns;an;!e;an7e6iu,o5ristensFu3we;i,ng,u3w,y;n,on5u3;!g;mpb6rt0st5;ro;ell;aAe7ha3lanco,oyko,r5yrne;ooks,yant;ng;ck6ethov5nnett;en;er,ham;ch,h7iley,rn5;es,i0;er;k,ng;dCl8nd5;ers5r9;en,on,s2;on;eks6iy7var1;ez;ej5;ev;ams",
    "FirstName": "true¦aEblair,cCdevBj8k6lashawn,m3nelly,quinn,re2sh0;ay,e0iloh;a,lby;g1ne;ar1el,org0;an;ion,lo;as8e0r9;ls7nyatta,rry;am0ess1ude;ie,m0;ie;an,on;as0heyenne;ey,sidy;lex1ndra,ubr0;ey;is",
    "MaleName": "true¦0:CB;1:BI;2:BZ;3:BQ;4:B2;5:BW;6:AQ;7:9S;8:BA;9:AU;A:AL;aB1bA5c94d84e7Df6Wg6Eh5Ui5Gj4Jk49l3Pm2Nn2Co27p21qu1Zr19s0Pt05u04v00wNxavi3yGzB;aBor0;cBh8Fne;hCkB;!aAY;ar4ZeAX;ass2i,oCuB;sDu23;nEsDusB;oBsC;uf;ef;at0g;aJeHiCoByaAM;lfgang,odrow;lBn1N;bDey,frBGlB;aA2iB;am,e,s;e86ur;i,nde7sB;!l6t1;de,lCrr5yB;l1ne;lBt3;a90y;aDern1iB;cBha0nce8Trg98va0;ente,t59;lentin48n8Wughn;lyss4Lsm0;aTeOhKiIoErCyB;!l3ro8s1;av9OeBist0oy,um0;nt9Gv53y;bDd7VmBny;!as,mBoharu;aAWie,y;i81y;mBt9;!my,othy;adDeoCia7BomB;!as;!do7K;!de9;dErB;en8FrB;an8EeBy;ll,n8D;!dy;dgh,ic9Rnn3req,ts44;aRcotPeNhJiHoFpenc3tBur1Nylve8Fzym1;anDeBua79;f0phADvBwa78;e56ie;!islaw,l6;lom1nA1uB;leyma8ta;dBl7Hm1;!n6;aDeB;lBrm0;d1t1;h6Qne,qu0Tun,wn,y8;aBbasti0k1Wl40rg3Zth,ymo9G;m9n;!tB;!ie,y;lCmBnti20q4Hul;!mAu4;ik,vato6T;aWeShe90iOoFuCyB;an,ou;b6JdCf9pe6OssB;!elAG;ol2Ty;an,bIcHdGel,geFh0landA7mEnDry,sCyB;!ce;coe,s;!a93nA;an,eo;l3Ir;e4Pg3n6olfo,ri66;co,ky;bAe9S;cBl6;ar5Mc5LhCkB;!ey,ie,y;a83ie;gCid,ub5x,yBza;ansh,nR;g8UiB;na8Qs;ch5Wfa4lDmCndBpha4sh6Sul,ymo6Y;al9Wol2Ay;i9Gon;f,ph;ent2inB;cy,t1;aFeDhilCier60ol,reB;st1;!ip,lip;d99rcy,tB;ar,e2U;b3Rdra6Dt43ul;ctav2Uliv3m94rEsBt7Oum8Sw5;aCc8RvB;al51;ma;i,l49vJ;athJeHiDoB;aBel,l0ma0r2X;h,m;cCg4i3IkB;h6Tola;hol5WkBol5W;!ol5V;al,d,il,ls1vB;il4Z;anBy;!a4i4;aWeTiKoFuCyB;l21r1;hamCr5YstaB;fa,p4F;ed,mF;dibo,e,hamDis1XntCsBussa;es,he;e,y;ad,ed,mB;ad,ed;cGgu4kElDnCtchB;!e7;a77ik;house,o03t1;e,olB;aj;ah,hBk6;a4eB;al,l;hClv2rB;le,ri7v2;di,met;ck,hNlLmOnu4rHs1tDuricCxB;!imilian8Bwe7;e,io;eo,hCi51tB;!eo,hew,ia;eBis;us,w;cDio,k85lCqu6Fsha7tBv2;i2Hy;in,on;!el,oKus;achBcolm,ik;ai,y;amBdi,moud;adB;ou;aReNiMlo2RoIuCyB;le,nd1;cEiDkBth3;aBe;!s;gi,s;as,iaB;no;g0nn6QrenDuBwe7;!iB;e,s;!zo;am,on4;a7Aevi,la4RnDoBst3vi;!nB;!a5Zel;!ny;mCnBr66ur4Swr4S;ce,d1;ar,o4M;aIeDhaled,iBrist4Uu47y3A;er0p,rB;by,k,ollos;en0iEnBrmit,v2;!dCnBt5B;e0Yy;a7ri4M;r,th;na67rBthem;im,l;aYeQiOoDuB;an,liBst2;an,o,us;aqu2eJhnInGrEsB;eChBi7Aue;!ua;!ph;dBge;an,i,on;!aBny;h,s,th4W;!ath4Vie,nA;!l,sBy;ph;an,e,mB;!mA;d,ffGrDsB;sBus;!e;a5IemCmai8oBry;me,ni0O;i6Ty;!e57rB;ey,y;cHd5kGmFrDsCvi3yB;!d5s1;on,p3;ed,od,rBv4L;e4Yod;al,es,is1;e,ob,ub;k,ob,quB;es;aNbrahMchika,gKkeJlija,nuIrGsDtBv0;ai,sB;uki;aBha0i6Ema4sac;ac,iaB;h,s;a,vinBw2;!g;k,nngu51;!r;nacBor;io;im;in,n;aJeFina4UoDuByd55;be24gBmber4BsD;h,o;m3ra32sBwa3W;se2;aDctCitCn4DrB;be1Zm0;or;th;bKlJmza,nIo,rDsCyB;a42d5;an,s0;lEo4ErDuBv6;hi3Zki,tB;a,o;is1y;an,ey;k,s;!im;ib;aQeMiLlenKoIrEuB;illerCsB;!tavo;mo;aDegBov3;!g,orB;io,y;dy,h56nt;nzaBrd1;lo;!n;lbe4Pno,ovan4Q;ne,oDrB;aBry;ld,rd4T;ffr6rge;bri4l5rBv2;la1Yr3Dth,y;aQeNiLlJorr0HrB;anDedBitz;!dAeBri23;ri22;cDkB;!ie,lB;in,yn;esco,isB;!co,zek;etch3oB;yd;d4lBonn;ip;liCng,rnB;an00;pe,x;bi0di;arZdUfrTit0lNmGnFo2rCsteb0th0uge8vBym5zra;an,ere2V;gi,iCnBrol,v2w2;est45ie;c07k;och,rique,zo;aGerFiCmB;aFe2P;lCrB;!h0;!io;s1y;nu4;be09d1iEliDmCt1viBwood;n,s;er,o;ot1Ts;!as,j43sB;ha;a2en;dAg32mEuCwB;a25in;arB;do;o0Su0S;l,nB;est;aYeOiLoErDuCwByl0;ay8ight;a8dl6nc0st2;ag0ew;minFnDri0ugCyB;le;!l03;!a29nBov0;e7ie,y;go,icB;!k;armuCeBll1on,rk;go;id;anIj0lbeHmetri9nFon,rEsDvCwBxt3;ay8ey;en,in;hawn,mo08;ek,ri0F;is,nBv3;is,y;rt;!dB;re;lKmInHrDvB;e,iB;!d;en,iDne7rByl;eBin,yl;l2Vn;n,o,us;!e,i4ny;iBon;an,en,on;e,lB;as;a06e04hWiar0lLoGrEuCyrB;il,us;rtB;!is;aBistobal;ig;dy,lEnCrB;ey,neli9y;or,rB;ad;by,e,in,l2t1;aGeDiByI;fBnt;fo0Ct1;meCt9velaB;nd;nt;rDuCyB;!t1;de;enB;ce;aFeErisCuB;ck;!tB;i0oph3;st3;d,rlBs;eBie;s,y;cBdric,s11;il;lEmer1rB;ey,lCro7y;ll;!os,t1;eb,v2;ar02eUilTlaSoPrCuByr1;ddy,rtI;aJeEiDuCyB;an,ce,on;ce,no;an,ce;nCtB;!t;dCtB;!on;an,on;dCndB;en,on;!foBl6y;rd;bCrByd;is;!by;i8ke;al,lA;nFrBshoi;at,nCtB;!r10;aBie;rd0S;edict,iCjam2nA;ie,y;to;n6rBt;eBy;tt;ey;ar0Xb0Nd0Jgust2hm0Gid5ja0ElZmXnPputsiOrFsaEuCveBya0ziz;ry;gust9st2;us;hi;aIchHi4jun,maFnDon,tBy0;hBu06;ur;av,oB;ld;an,nd0A;el;ie;ta;aq;dGgel05tB;hoEoB;i8nB;!i02y;ne;ny;reBy;!as,s,w;ir,mBos;ar;an,beOd5eIfFi,lEonDphonHt1vB;aMin;on;so,zo;an,en;onCrB;edP;so;c,jaEksandDssaExB;!and3;er;ar,er;ndB;ro;rtH;ni;en;ad,eB;d,t;in;aColfBri0vik;!o;mBn;!a;dFeEraCuB;!bakr,lfazl;hBm;am;!l;allEel,oulaye,ulB;!lCrahm0;an;ah,o;ah;av,on",
    "FemaleName": "true¦0:FV;1:FZ;2:FO;3:FA;4:F9;5:FP;6:EO;7:GC;8:EW;9:EM;A:G8;B:E2;C:G5;D:FL;E:FI;F:ED;aDZbD2cB7dAHe9Ff8Zg8Fh81i7Qj6Sk5Yl4Mm36n2Ro2Op2Dqu2Cr1Ms0Pt03ursu6vUwOyLzG;aJeHoG;e,la,ra;lGna;da,ma;da,ra;as7CeHol1RvG;et9onB8;le0sen3;an8endBMhiB3iG;lInG;if38niGo0;e,f37;a,helmi0lGma;a,ow;aLeIiG;ckCZviG;an9WenFY;da,l8Vnus,rG;nGoni8M;a,iDA;leGnesEA;nDJrG;i1y;aSePhNiMoJrGu6y4;acG1iGu0E;c3na,sG;h9Mta;nHrG;a,i;i9Jya;a5HffaCFna,s5;al3eGomasi0;a,l8Go6Wres1;g7To6VrHssG;!a,ie;eFi,ri7;bNliMmKnIrHs5tGwa0;ia0um;a,yn;iGya;a,ka,s5;a4e4iGmC9ra;!ka;a,t5;at5it5;a04carlet2Xel6MhUiSkye,oQtMuHyG;bFHlvi1;sHzG;an2Set9ie,y;anGi7;!a,e,nG;aEe;aIeG;fGl3CphG;an2;cF6r6;nGphi1;d4ia,ja,ya;er4lv3mon1nGobh74;dy;aKeGirlBKo0y6;ba,e0i6lIrG;iGrBOyl;!d6Z;ia,lBT;ki4nIrHu0w0yG;la,na;i,leAon,ron;a,da,ia,nGon;a,on;bMdLi8lKmIndHrGs5vannaE;aEi0;ra,y;aGi4;nt5ra;lBMome;e,ie;in1ri0;a02eXhViToHuG;by,thBJ;bQcPlOnNsHwe0xG;an95ie,y;aHeGie,lC;ann7ll1marBEtB;lGnn1;iGyn;e,nG;a,d7X;da,i,na;an8;hel53io;bin,erByn;a,cGkki,na,ta;helBYki;ea,iannDWoG;da,n12;an0bIgi0i0nGta,y0;aGee;!e,ta;a,eG;c6CkaE;chGe,i0mo0n5EquCCvDy0;aCBelGi8;!e,le;een2ia0;aMeLhJoIrG;iGudenAV;scil1Uyamva8;lly,rt3;ilome0oebe,ylG;is,lis;arl,ggy,nelope,r6t4;ige,m0Fn4Oo6rvaBAtHulG;a,et9in1;ricGsy,tA8;a,e,ia;ctav3deHfAVlGphAV;a,ga,iv3;l3t9;aQePiJoGy6;eHrG;aEeDma;ll1mi;aKcIkGla,na,s5ta;iGki;!ta;hoB1k8ColG;a,eBG;!mh;ll2na,risF;dIi5QnHo23taG;li1s5;cy,et9;eAiCN;a01ckenz2eViLoIrignayani,uriBFyG;a,rG;a,na,tAR;i4ll9WnG;a,iG;ca,ka,qB3;chOkaNlJmi,nIrGtzi;aGiam;!n8;a,dy,erva,h,n2;a,dIi54lG;iGy;cent,e;red;!e6;ae6el3G;ag4KgKi,lHrG;edi62isFyl;an2iGliF;nGsAL;a,da;!an,han;b08c9Dd06e,g04i03l01nZrKtJuHv6Tx87yGz2;a,bell,ra;de,rG;a,eD;h76il8t2;a,cSgOiJjor2l6Jn2s5tIyG;!aGbe5RjaAlou;m,n9R;a,ha,i0;!aIbAKeHja,lCna,sGt54;!a,ol,sa;!l06;!h,m,nG;!a,e,n1;arIeHie,oGr3Kueri9;!t;!ry;et3IiB;elGi62y;a,l1;dGon,ue6;akranBy;iGlo36;a,ka,n8;a,re,s2;daGg2;!l2W;alCd2elGge,isBFon0;eiAin1yn;el,le;a0Ie08iWoQuKyG;d3la,nG;!a,dHe9RnGsAP;!a,e9Q;a,sAN;aB0cJelIiFlHna,pGz;e,iB;a,u;a,la;iGy;a2Ae,l25n8;is,l1GrHtt2uG;el6is1;aIeHi7na,rG;a6Zi7;lei,n1tB;!in1;aQbPd3lLnIsHv3zG;!a,be4Let9z2;a,et9;a,dG;a,sGy;ay,ey,i,y;a,iaIlG;iGy;a8Fe;!n4G;b7Serty;!n5S;aNda,e0iLla,nKoIslAQtGx2;iGt2;c3t3;la,nGra;a,ie,o4;a,or1;a,gh,laG;!ni;!h,nG;a,d4e,n4O;cNdon7Ri6kes5na,rMtKurIvHxGy6;mi;ern1in3;a,eGie,yn;l,n;as5is5oG;nya,ya;a,isF;ey,ie,y;aZeUhadija,iMoLrIyG;lGra;a,ee,ie;istGy5C;a,en,iGy;!e,n49;ri,urtn99;aMerLl98mIrGzzy;a,stG;en,in;!berlG;eGi,y;e,y;a,stD;!na,ra;el6OiJlInHrG;a,i,ri;d4na;ey,i,l9Ps2y;ra,s5;c8Vi5XlOma6nyakumari,rMss5LtJviByG;!e,lG;a,eG;e,i77;a5EeHhGi3QlCri0y;ar5Cer5Cie,leDr9Ey;!lyn72;a,en,iGl4Vyn;!ma,n32sF;ei71i,l2;a04eVilToMuG;anKdJliGst56;aHeGsF;!nAt0W;!n8W;i2Sy;a,iB;!anLcelCd5Vel70han6HlJni,sHva0yG;a,ce;eGie;fi0lCph4X;eGie;en,n1;!a,e,n37;!i10lG;!i0Z;anLle0nIrHsG;i1Bsi1B;i,ri;!a,el6Oif1SnG;a,et9iGy;!e,f1Q;a,e71iHnG;a,e70iG;e,n1;cLd1mi,nHqueliAsmin2Vvie4yAzG;min7;a7eHiG;ce,e,n1s;!lGsFt06;e,le;inHk2lCquelG;in1yn;da,ta;da,lPmNnMo0rLsHvaG;!na;aHiGob6T;do4;!belGdo4;!a,e,l2H;en1i0ma;a,di4es,gr5Q;el8ogG;en1;a,eAia0o0se;aNeKilHoGyacin1O;ll2rten1I;aHdGlaH;a,egard;ry;ath0XiHlGnrietBrmiAst0X;en25ga;di;il74lKnJrGtt2yl74z6C;iGmo4Fri4G;etG;!te;aEnaE;ey,l2;aYeTiOlMold13rIwG;enGyne19;!dolC;acHetGisel8;a,chD;e,ieG;!la;adys,enGor3yn1Z;a,da,na;aJgi,lHna,ov70selG;a,e,le;da,liG;an;!n0;mZnIorgHrG;ald35i,m2Ttru72;et9i5S;a,eGna;s1Ovieve;briel3Fil,le,rnet,yle;aSePio0loNrG;anHe8iG;da,e8;!cG;esIiGoi0H;n1sG;ca;!ca;!rG;a,en41;lHrnG;!an8;ec3ic3;rHtiGy7;ma;ah,rah;d0FileDkBl00mUn48rRsMtLuKvG;aIelHiG;e,ta;in0Ayn;!ngel2G;geni1la,ni3P;h50ta;meral8peranJtG;eHhGrel6;er;l2Or;za;iGma,nest28yn;cGka,n;a,ka;eJilImG;aGie,y;!liA;ee,i1y;lGrald;da,y;aTeRiMlLma,no4oJsIvG;a,iG;na,ra;a,ie;iGuiG;se;a,en,ie,y;a0c3da,nJsGzaH;aGe;!beG;th;!a,or;anor,nG;!a;in1na;en,iGna,wi0;e,th;aWeKiJoGul2S;lor4Zminiq3Wn2YrGtt2;a,eDis,la,othGthy;ea,y;an09naEonAx2;anPbOde,eNiLja,lImetr3nGsir4S;a,iG;ce,se;a,iHorGphiA;es,is;a,l5H;dGrdG;re;!d4Kna;!b2AoraEra;a,d4nG;!a,e;hl3i0mMnKphn1rHvi1VyG;le,na;a,by,cHia,lG;a,en1;ey,ie;a,et9iG;!ca,el19ka;arGia;is;a0Pe0Mh04i02lUoJrHynG;di,th3;istGy04;al,i0;lOnLrHurG;tn1C;aId26iGn26riA;!nG;a,e,n1;!l1Q;n2sG;tanGuelo;ce,za;eGleD;en,t9;aIeoHotG;il49;!pat4;ir7rIudG;et9iG;a,ne;a,e,iG;ce,sX;a4er4ndG;i,y;aPeMloe,rG;isHyG;stal;sy,tG;aHen,iGy;!an1e,n1;!l;lseHrG;!i7yl;a,y;nLrG;isJlHmG;aiA;a,eGot9;n1t9;!sa;d4el1NtG;al,el1M;cGli3E;el3ilG;e,ia,y;iYlXmilWndVrNsLtGy6;aJeIhGri0;erGleDrCy;in1;ri0;li0ri0;a2FsG;a2Eie;iMlKmeIolHrG;ie,ol;!e,in1yn;lGn;!a,la;a,eGie,y;ne,y;na,sF;a0Ci0C;a,e,l1;isBl2;tlG;in,yn;arb0BeXlVoTrG;andRePiIoHyG;an0nn;nwCok7;an2MdgKg0HtG;n26tG;!aHnG;ey,i,y;ny;etG;!t7;an0e,nG;da,na;i7y;bbi7nG;iBn2;ancGossom,ythe;a,he;aRcky,lin8niBrNssMtIulaEvG;!erlG;ey,y;hHsy,tG;e,i0Zy7;!anG;ie,y;!ie;nGt5yl;adHiG;ce;et9iA;!triG;ce,z;a4ie,ra;aliy29b24d1Lg1Hi19l0Sm0Nn01rWsNthe0uJvIyG;anGes5;a,na;a,r25;drIgusHrG;el3;ti0;a,ey,i,y;hHtrG;id;aKlGt1P;eHi7yG;!n;e,iGy;gh;!nG;ti;iIleHpiB;ta;en,n1t9;an19elG;le;aYdWeUgQiOja,nHtoGya;inet9n3;!aJeHiGmI;e,ka;!mGt9;ar2;!belHliFmT;sa;!le;ka,sGta;a,sa;elGie;a,iG;a,ca,n1qG;ue;!t9;te;je6rea;la;!bHmGstas3;ar3;el;aIberHel3iGy;e,na;!ly;l3n8;da;aTba,eNiKlIma,yG;a,c3sG;a,on,sa;iGys0J;e,s0I;a,cHna,sGza;a,ha,on,sa;e,ia;c3is5jaIna,ssaIxG;aGia;!nd4;nd4;ra;ia;i0nHyG;ah,na;a,is,naE;c5da,leDmLnslKsG;haElG;inGyW;g,n;!h;ey;ee;en;at5g2nG;es;ie;ha;aVdiSelLrG;eIiG;anLenG;a,e,ne;an0;na;aKeJiHyG;nn;a,n1;a,e;!ne;!iG;de;e,lCsG;on;yn;!lG;iAyn;ne;agaJbHiG;!gaI;ey,i7y;!e;il;ah",
    "City": "true¦0:62;1:5U;2:5A;a5Ib4Dc3Ud3Je3Hf3Dg31h2Ui2Qjak36k2Bl1Ym1Fn14o12p0Kqui1Tr0DsYtKuJvEw8y5z3;ag3uri45;abr1reb;a4e3okoha3K;katerin30r3E;moussouk47ng3Noundé;a6e5i3rocl18;ckl25n3;dho4Pnipeg,terth27;ll4xford;rs14sh3;ingt3H;a5i3;c09en3lni5T;na,tia56;duz,lenc1ncouv1Gr3;na,sav1;lan bat1Btrecht;aDbilisi,eBh9i8o7r6u3;nis4r3;in,ku;!i;ipo32ondheim;kyo,ron16ulouse;anj05l2Gmisoa5Cra2;e3imphu; hague,ssaloni28;gucigalpa,h3l av1V;er0r0;i4llinn,mpe4Ongi12r3shk2E;awa s0Etu;chu4Cn0p0G;a7e6h5ingapo4Lkopje,of1ri jayawardenapura kot0Ut3u3Yydn0Bão tomé;oc3uttga2J;col2Pkholm;angh3Aenzh44;oul,ul,v3S;int Al8n3ppo3Braje4Q; 5a'a,t3;iago3o domin35;! del ci3P;jos3salv5;e,é;v3z1X;ad0K;george3john3peters1V;'s;a8eykjav7i6o3;m4s3t4H;ar08e3L;a,e;ad,ga,o de janei2X;ik,ík;b47mallah;aGeEhDiCo7r3ueb3Tyongya3P;a4e3;tor1;g3ia;a,ue;dgori26rt3zn0; 4-au-prin0Qo3;!-no42;elizabe7louis,moresby,of spa3vi3L;in;ls3Brae4E;iladelph1nom pe13oenix;chi29r3tah tik30;th;l5na1Rr3tr2K;amari23i3;gi,s;ermo,ik0S;des0Js3ttawa,uagadoug13;a3Elo;'djame2aBe7gerulm6i4ouakchott,u3;ova d9r-sult0;am3cos1;ey;ud;ssu2w 3;d4taip3york;ei;el0F;goya,iro3Snt2Apl2Ass2Nv0ypyid3;aw;aBba2BeAi9o4u3;mb1Vni1S;gadisc6n4roni,sc3;a,ow;a1Nrov1t3;evideo,real;io;l0n0Qskolc;dellín,lbour2Z;drid,juro (delap-uliga-djarrit),lBn8pu7r5s3;ca3eru;te;ib3se23;or;to;a4chest3dal0Ki2J;er;gua,ma;a15mo,é;'ava2aBi7o5u3vQy0W;anJbia2s3;a2Hsembur1A;mé,nd3s angel1M;on,ra;brev1Rege,longwe,ma4nz,sbon3verpo5;!a;!ss3;ol; 3usan2F;p4v3;allet0Rel24;az,la0Q;aEharCi8laipe7o4rak3uala lump6;ow;be,pavog4si3;ce;ur;da;ev,ga09n3;gsto4sha3;sa;n,wn;k3tum;iv;b8mpa1Qndy,ohsiu1Mra3tmandu,un0V;c3j;hi;l cai0Onche04s4̇zm3;ir;lam27tanb3;ul;a7e5o3; chi mi3ms,nia27ustZ;nh;lsin3rakliX;ki;ifa,m3noi,ra1Kva2;bu29iltU;aCdanBe9h8i6othen5raz,ua3;dalaja20ngzh3;ou;bu25;ac3bBtega,u1Wza;arU;ent;n3or0Jrusalemme ov0C;e0Noa,ève;sk;boro1Blw3;ay;es,r4unaf3;uti;ankfu3ee0D;rt;dmontDindhov0Or3;ev0;a8ha0Yi7o5u3;bl0Jrb0sh3š3;anbe;do3ha;ma;li;c6e4kar,masc3ugavpiZ;o,us;gu,je3;on;ca;aIebu,hDittà d9o3raio02uriti17;lo6n4pen3rk;agh09hag09;akGstan3;ta;g0Nm3;bo;el 3i san mari4;guatema0Bmessi4vatica3;no;co;enn6i4ristchur3;ch;ang m4ca3ttago02șinău;go;ai;i4lga3nber0Spe Irac8striD;ry;ro;aXeOiLogotKr8u3;c5dap6enos air9r3s0;g3sa;as;ar3har3;est;aAi6u3;sse4xell3;es;ls;d4s3;baY;ge3;town;sil1tisla5zzav3;il3;le;va;a,à;rmingh00ss4šk3;ek;au;i9l7r3;g5l3n;in3;!o;en;grad3mop0;e,o;ji3rut;ng;ghdSku,mako,n7r4s3;el,seterA;celo2ranquil3;la;na;dar seri begaw0g5j3;a lu3ul;ka;alo3kok,ui;re;aPbLccKddis abeJhmedHlFmCn9p1qaJs5t3uckland,şg7;e3hens;ne;h3maHunción;dod,g3;ab3;at;kaDt3;ananari3werp;vo;m0s3;terd3;am; kuwait,exandr1geri,maty;ia;ab3;ad;ba;ra;idj0u3; dha3ja;bi;an;lbo4rh3;us;rg",
    "Honorific": "true¦aPbrigadiOcHdGexcellency,fiBjudge,king,liDmaAofficOp6queen,r3s0taoiseach,vice5;e0ultK;c0rgeaC;ond liAretary;abbi,e0;ar0verend; adK;astGr0;eside6i0ofessF;me ministFnce0;!ss;gistrate,r4yC;eld mar3rst l0;ady,i0;eutena0;nt;shB;oct6utchess;aptain,hance4o0;lonel,mmand5ngress1un0;ci2t;m0wom0;an;ll0;or;er;d0yatullah;mir0;al",
    "Person": "true¦ashton kutchRbQcLdJeHgastMhFinez,jDkCleBmAnettIoprah winfrPp8r4s3t2v0;a0irgin maF;lentino rossi,n go3;heresa may,iger woods,yra banks;addam hussain,carlett johanssIlobodan milosevic,uA;ay romano,eese witherspoHo1ush limbau0;gh;d stewart,nald0;inho,o;a0ipI;lmHris hiltC;essiaen,itt romnEubarek;bron james,e;anye west,iefer sutherland,obe bryant;aime,effers8k rowli0;ng;alle ber0itlBulk hogan;ry;ff0meril lagasse,zekiel;ie;a0enzel washingt2ick wolf;lt1nte;ar1lint0ruz;on;dinal wols1son0;! palm2;ey;arack obama,rock;er",
    "Country": "true¦0:34;1:2R;2:36;a2Pb28c1Xd1Ue1Rf1Qg1Hh1Bi11jama33k0Wl0Qm0En07o06pYrQsFt8u6v4wallis et futu1xiānggǎng costa sud della ci1z3éi0Kís1Eösterreich;a20imbabwe;a3enezue2Yiệt nam;nuatu,ticanæ;gNkraji1n3ru01zbe0W;gher0ited states virgin islands;a8hailand0i7o6u3;nis0Mr3valu;ch0k3;meni2s e caic2E;go,ke2Qnga;bet,mor est;gi0Oiw2Xnz2T;aBeAi9lov8oomaali0Lpag1ri lan0Ztat6u3vez0wazi11ão tomé e príncipe,ām2H;da4omi,ri3;name,yah0U;fr2Nn kusini;i 3o di pales2B;baltici,uni0Y;ac1Len0;erra leo14ngapu2H;negRrb0ychelles;ha2Fint 3kartweEmoa0Jn mari0O;kitts and nevis,luc0vincent e grenadi11;e4om2Hu3;an28;gno uni12pubblica 3;centrafr6d3;e3ominicana república domin5;l3mocratica del3; congo;ica1;a8e7ilipin1So3uerto rK;l4rtogal3;lo;inesia3onia pols0D;! francese;nisola ib21rù;ki2pua nuova guinea,ra3;guay;ceano india06m25;a8e6i4o3;rveg0uvelle calédonie;caragua,ger3;!ia;der05p3;al;mib0ur18;a7ela19i18o3yanm0K;ldova,n4zamb3çamb9;ico;gol0t3;eneg0Nserr0Z;c8dagasc0Fl6rtinica martin5urit4yotte como3;re;an0i0Q;ique;a3dive,i,ta;wi,ys0;au,ed8;a0Ze6i3;b3echtenste0S;aKer0iyah3; nordafr1C;sotho,tt3;on0;a5en4ir3osovo,uwait;ghizi2ibaL;ya;laallit nuna0Iza3;ki2;ndonesia un,ra9s3;ol3raele;a di natale christm0Ne 3;c5falkCmar4vergini3; americaL;ianKshall;aym14ook;k,n (persia) īrān3; vici3;no;a6o4rvats3;ka;l3ndur0D;land;i3ya2;ti;aAha1i8olfo di guinea e,re7u3;a5in4yan3;a,e;ea,é bissau;dalupa,m,tema0H;c0na0D;appo3ordania al urdunn;ne;bKmb0;igi,ranc0øroy8;cu4esti vabariik,git3l salv4mirati arabi,tiop0;to;ador;a3omin0B;nmark,wlat qat3;ar;aAe9i7o3uW;lo5morRrea4sta 3;d'avorio,r06;! del nord;mb0;ad,le,na,p3;ro;ch0;m3naUpo verV;bog0erun camero3;on;aGeAh8irmZo7r6u4yelar3;us;lgar0r3;kina faso,undi;asile brasil,unei;liv0snia ed erzegovi1tswa1;utXār3;at;l4n3rmuJ;in;a3gium,ize;u mi3;cro3;nes0;ham4ngladesh,rbad3;os;as;fghane2lHmFn8otear7r3s sudMustral0zerbaigiM;abia saudita,gen4u3;ba;ti1;na;oa;dor8g6t3;arti4igua and barbu3;da;de;o3uil3;la;ra;er3;ica; 5b3;an0;ia;bahrayn,jaza'ir,maghrib,yam4;st3;an",
    "Place": "true¦aHbFcDdCeuropBfco,gAh9i8jfk,kul,l6m4ord,p2s1the 0upEyyz;bronx,hamptons;fo,oho,underland,yd;ek,h0;l,x;a0co,id9uc;libu,nhattan;a0gw,hr;s,x;ax,cn,st;arlem,kg,nd;ay village,reenwich;a,e;en,fw,own1xb;dg,gk,hina0lt;town;cn,e0kk,rooklyn;l air,verly hills;frica,m0sia,tl;erica0s; 0s;centr0meridion0;ale",
    "Region": "true¦a1Xb1Pc1Fd1Aes19f16g10h0Xi0Vj0Tk0Rl0Om0DnXoVpQqNrKsBt8ut7v4w2y0zacatec1Z;o03u0;cat15kX;a0est vi2isconsin,yomi11;rwick1Nshington dc;er1i0;rgin1Q;acruz,mont;ah,tar pradesh;a1e0laxca1Busca9;nnessee,x1P;bas0Jmaulip1OsmI;a5i3o1taf0Mu0ylh11;ffUrrZs0W;me0Yuth 0;cRdQ;ber1Gc0naloa;hu0Qily;n1skatchew0Pxo0;ny; luis potosi,ta catari1G;a0hode6;j0ngp01;asth0Kshahi;inghai,u0;e0intana roo;bec,ensVreta0C;ara3e1rince edward0; isT;i,nnsylv0rnambu01;an12;!na;axa0Ldisha,h0klaho19ntar0reg3x02;io;ayarit,eAo2u0;evo le0nav0J;on;r0tt0Pva scot0V;f5mandy,th0; 0ampton0O;c2d1yo0;rk0M;ako0W;aroli0T;olk;bras0VvaZw0; 1foundland0;! and labrador;brunswick,hamp0Fjers0mexiIyork state;ey;a5i1o0;nta0Lrelos;ch2dlanAn1ss0;issippi,ouri;as geraEneso0K;igOoacO;dhya,harasht02ine,ni2r0ssachusetts;anhao,y0;land;p0toba;ur;anca02e0incoln02ouisia0B;e0iF;ds;a0entucky,hul08;ns06rnata0Bshmir;alis0iangxi;co;daho,llino0owa;is;a1ert0idalDun9;fordS;mpRwaii;ansu,eorgVlou4u0;an1erre0izhou,jarat;ro;ajuato,gdo0;ng;cesterL;lori1uji0;an;da;sex;e3o1uran0;go;rs0;et;lawaDrbyC;a7ea6hi5o0umbrG;ahui3l2nnectic1rsi0ventry;ca;ut;iLorado;la;apDhuahua;ra;l7m0;bridge2peche;a4r3uck0;ingham0;shi0;re;emen,itish columb2;h1ja cal0sque,var1;iforn0;ia;guascalientes,l3r0;izo1kans0;as;na;a1ber0;ta;ba1s0;ka;ma",
    "Currency": "true¦$,aud,bTcRdMeurLfKgbp,hkd,iJjpy,kHlFnis,p8r7s3usd,x2y1z0¢,£,¥,ден,лв,руб,฿,₡,₨,€,₭,﷼;lotyTł;en,uanS;af,of;h0t6;e0il6;k0q0;elN;iel,oubleMp,upeeM;e3ound0;! st0s;er0;lingI;n0soH;ceGn0;ies,y;e0i8;i,mpi7;n,r0wanzaCyatC;!onaBw;ls,nr;ori7ranc9;!o8;en3i2kk,o0;b0ll2;ra5;me4n0rham4;ar3;ad,e0ny;nt1;aht,itcoin0;!s",
    "Ordinal": "true¦cIdDmilBnoAotta9qu5se2t0undEveJ;erzo,re0;dCntI;condo,dBs1tt0;aFiH;saEto;a1in0;d7to;r0ttord6;aAto;ntAvo;no,va8;i0l8;ard7on7;eci7ici1od0;ic5;a0o1;nnov3sse0;tt2;e0inqua0;nt0;esi0;mo",
    "Unit": "true¦bHceFeDfahrenheitIgBhertz,jouleIk8liGm6p4terEy2z1°0µs;c,f,n;b,e1;b,o0;ttA;e0ouceD;rcent,t8;eg7il0³,è9;eAlili8;elvin9ilo1m0;!/h,s;!b6gr1mètre,s;ig2r0;amme5;b,x0;ab2;lsius,ntimè0;tre1;yte0;!s",
    "Infinitive": "true¦0:0LA;1:0L9;2:0KS;3:0KW;4:0L8;5:0L6;6:0L4;7:0K4;8:0KK;9:0JF;A:0J8;B:0IQ;C:0KA;D:0K7;E:0FN;F:0JD;G:0JZ;H:0KH;I:0II;J:0GO;K:0KZ;L:0I3;M:0L2;N:0JN;O:0L5;a0C8b0AQc04Vd00OeYQfX4gVQiQ9lP9mNTnNEoMHpIFquICrC1s3Ht1Eu0WvVzP;aSe5iRoQuP;ccOSfo5ma0;c0JWmGpp0FA;mb0K3ttH;mpPpGvor3;et2il5;a0Ie04iWoPuo2;cTga0lPmi0F2r04ZtH;aQe0gPle0t09Zve0;arBe0;nJCre,tiP;lBz8;a0iP;a0fe3;aEb3ci4diFe2gVlUncTol0JDra0sRtQvPz1;e0i0AR;a0tor1u03J;a0iPta0u05X;o4ta0;e0i0o5;ip0J8leE;e0i5l1;cLd01gZi0JClYnUrRsQtriPzzeE;fi6oXU;ci6sa0ti0;b05Pdi0gQi0AHnPsa0te0;a0ic1;a0e0og4;a0dQe3g1i0tP;a0i5o5;ePi6;mm1re;a0eEle0ocB;e2gPl1;h1ia0;e0o0JI;cUda0gSlRnQrP;a0ca0ia0;a0eEga0i089ta097;ca0e0iAHla0or0FEu2;aPheEi0l1;b0CQre;a0ci4il5;b02cc01di0f00gZlYmXnUrTsPt05A;a0ciUNo5tRuP;caG7fr0BXrP;a0pa0;io4o5;ge0i4la0ta0;ge0iPta0;fPre;i6orF;et2il1;tiFu5;gi09LuaO;fic06Jiz1;ellNRi7;bQiPrR;ca0di0;i0EWrP;ia6;a1Ke17i13o0WrSuP;ba0f093o4rQtP;a0e5;a0bNJna0;a00eZiWoRuP;cPfM;c0HUiA;gl1mbRnQttPva0;a0er0I9o5;a0ca0eE;a0ePiz8;gg1t2;bQl5ncPonMpYOs2t0ANunM;a0e3;o5u2;bb1m08ZpiA;b0Fc0Ed0De0f0Cg0Bi02Ula0JBm09n06p04r03sWttUum0CHvP;aReQi3OolP;ge0ta0ve0;rCsN;gl1lPsa0;ca0i6;a0eP;gg1ne0;a0J7borAcTe0HLfRgre0E6lQm057pPtul5uA;aJi3or0CV;a0o6;eJiRRoP;n7rF;en7i4oPri0BKu3;la0rOZ;re,uG;aPe5iZI;na0sC;c1gug1quill0DUsP;a0corOUfPi0F9por2;eJorF;aYBetKoPu2;n2rN;ge0h0C1;eJfi6ig9uD;e0i0ur0;an4c1iF;al5oc6;c6el0BWg0H0lUma0nTrQsPt03H;a0si07Zta0;ce0m0BQnPreMtu3;a0ePiTK;a0gg1;a0da0i084;et2l0AP;fa0g0EUmb3nQra0tP;o5u0FY;ge0tP;eEin4;d1leZmWnUrRsPt2;a0se0tP;a0imon1;gQmi4rPza0;i0orB;e0iv09V;d0B0e0tP;aTFen4;atBe0pP;ePo0CSra0;ra0s2;fo4gPm0B3trasm041;raMuiA;cTfa4gliSmRn9ppQrPs0I2t0FBvo5;a0da0la0taO;a0ez8;bur0GIpo4;a0uz8;cPe0i2;a0ia0o4;a7Vb7Bc5Pd5Me55f4Qg4Gi48l46m3Xn3Uo2Gp1Gqu1Cr1Bt0Iu01vP;aYeSiRoPuo2;gl1lP;a07We0ge0ta0ve0;a0g4l08Nn0G2ta0;cLgli0AHlTnRrPsNt2z8;gPna0;i4og4;a0de0i0tP;a0o5ra0;a0le0ti0;ga0lPni0r1;ig1u2;b04cc03d02f00gYiciAme0nT9oXpUrTsP;ci2sPtit090ur3;eg08ZiQuP;l2me0r3;d1sK;clTCgeEEroD;erQpP;li07Kor0AX;a0bi0va2K;la0na0;a0geP;l5rC6;fPo5;o6raD;a0divi7;e7h1ia0;affit2ent3iYRliFor015;a0Ce09i07o05rSuP;c6d1fa0pPra0z072;eMiPra0;di0re;aVeTiSoQuP;c6g9sc1t0ES;fi4mb5QnPpi0GJz8;ca0za0;a0de0g0F9l5ng09Ksc1to5z8;ga0ma0pPsC;e0i0AD;b0BOcc0ESda0fa0go7lTm5LnSpRrQsci6t0GBvPz1;ac6e7in0ENol9;iGre;az8pa0;a0go5iRJ;c1la0;c6ia0na0pGrP;ce0di0ia0mi0na0p1;gm09Hl0AYm05Yn9pPra05Sva0z07C;a0end1u5;ccQ9mYSnQrPsse0;eotiGilBmi4za0;d095ta0;bili06Hcc0EFgSl5mGnRpGrPsa0t07WzI;a0e,nP;a06FutH;a0ca0ga0z1;io4l1na0;a03AoCI;aQiP;l5tN;d3gl1li05OrPsC;c1ta0;a0He07i00l0E8oVrRuP;lc1ma0n2tP;a05Bta4;anDeRiQoPuz8;f087loqu1na0vve7;gIz8;ca0g1me0z8;d04Sgl1lSnsIWpo5rRsP;a0sPta0;a0eDU;ca0ge0re,t51;pa0ver0AM;aTcRega05VfDGgQl5nPo086rZD;a0g08Hto4;a0ne0o5;a0cP;a0i03Y;cPgg1na0re,z8;ci6e0;cWd05Sgn08BlUnTrSsRttQzP;ia0z05Y;a0e081i4;a0sa0;a04Gde0eq0CPge0im08Io4pe3;de0ge0n4Nsa0;aPla0;cLga0re;ch1iPu5;alBfi6;cc0DCgl1lTn7rSsRuJv08CzP;iPz04P;a0enN;iFsa0;a0e04Gge0i0la0paOti0;aPleEma0;n6re;bb10c0Xd0Wf0Sg0Pl0Mm0Jn0Ip08r04s00ttVvP;eTrRveP;nPrN;i0zI;aPiQX;ccaRZpp092s2;ni0rL;a0CUeSiQUoQraP;g9r0;lin0AEm00Rp08YsPva04;c023ta0;n7r3;pRtP;aPen5Wit069;n0B3re;eWBiZV;bi0ge0mZXpRrQs037tRCvP;eOo5;eg9i7;asCr0CP;i0pVrP;aPiQG;fMggiV0nnoMZre,sSvP;an8vP;aPe0BYi06U;lu2;se7ta0;eQiUSor07YrP;esCi009;ri0sa0;a0da0nB5;atBiOmP;a0ePini09B;r9tK;a0DTca0da0e02RlPve0;ePiR2;ci2ti6va0;gPna0;et2hVGiP;a0BYo0ACun9;fPis0BD;erZEiQo6riP;g9re;a0t2;disMisMomB;cPiYL;hUMoP;mbe0rJN;aPol0DO;l8r6;eQifMoP;b0B4ccX4da0;l0DKr0CH;aVeTiRoQuP;o060sC;n2r8;cc1nuPs2;i0z8;nNrPtKz8;c1da0;gMIltHnPrW7scGL;ia0t0BX;aPeDit2og08V;cc1nc1;bi5cu3de0gVlUmSnPsteFt0CK;cQda6ghioz8tP;etBonB;e3ronB;bolPp066u5;eEiz8;eURla0AL;il5la0ni02N;aWe5hign1YoUrRuP;aPsc1;lOKrAz8;aPe9AiA;nPva0;a0c04PocL;b0ADccWDla0mPnf1rDz8;b09Yen2i4ma0;mPnc1r3ttaWB;a0b060;a00erZiXoTrQuP;gRJma0;aQePi05Aut2;cc1g0AS;c0B8t2;c0AQde3gRlQnArPtK;a0ma0na0za0;la0ti0;a0g1l1;an6dPgu3la0ni0orH;a0uc1;ra0za0;ccQma0re,sc1ta0vP;il5oJ;hi4ia0;c04d02g01l00mYnWpUque07IrTsRtQvPzI;e3iz1;a0C0ta0;sa0tP;a0upRC;ba0e4ia0peEra0vH;a3e0C5pP;el0C4ia0;sibX0tP;a0eTRi0;bPen2i4pQ4;ia0ra0;c1ezIla0;a0na92reG3ui05N;a0ePim052u09B;nt00Kre;a0ca0er089onAre2;a0eg4oga4rP;a1ucP;cVBi0;a0We0Sh0Mi0Fle3oXrTuP;ci0lRoQrPsa0;a0eEi0;ce0ia0te0;a0BEet2;eRiQoPutFD;c6l5sc1;cchV3t09Jve0;di2po5;cc09Nd05glIl03m01nWorVOpUrQsPt2Rva0;c09Psa0ta0;aRc1da0eEge0rQtP;a0e0B6i6;az8e003;ggiMDre,z8;a0ePi0Api01Uri0;rLt2;cer2fRgQnXAos09BquNCsiOtPvZT;a0en2ra0;e5iu3;esCiP;g9na0;busso5mX5oApPuX0;ar0ANiOor0;a0lPorHpHta0;a0eD;a0el5inLZ;aTmmi00NnSoQpPre,uGvo5;a0i05Ypa0;c6g09Bpe3rP;i4re;de0tLZ;cq087laPma0re;cq086re;eSiP;aPe3fa0oc6uXMva0z8;cc1ffZEmPn2rHt2v05O;az8;da0gg1rP;mHni0za0;g090lRmQ1nQrP;ne0re,v098;de0eE;e3le3;cc68deZMg01l00mZnVpTrRssEAtQvaPz8;l6re;e4o5ta0uJ;aPce3di4i6pa0seEta0;bHFv03K;a0pP;a0el5;dQnPsa0;a0erB;aPe0i0;gl1lB;b1pa0;a0c1da0fi0pi2za0;az8io4l1;a01e00iYloc6oVrQuP;c092d08QfMr3;aSiQoP;do5gl1n8;cTKgPna0;a0l1;cc1i2na0;cc083lQrPs6tt007;n1ra0sa0;l07Cog4;aPgGWla06Drc1zJQ;di0n6;ffeElOY;ci9IdiOgl1iafMlTnSrQtPva0;acLte0;aPba0ca0ra0;gl1z8;ca0da0;lPor04Mza0;a0ot2;b00cZet2gYlTnSpQtPve0z1;isMu3;e0oP;niZ4rH;a0ci0gFUtiZ3zI;a0da0iSpa0tQu2vaP;guarAre;a0eP;l5r07Z;re,va0;g1oF;c2SriYW;b1o2;a4Ve3Xi00oSuP;bQgO1l5mPo2sCt2zK5;i4o03V;a0ri6;d01Yga0l5mVnUsStRvP;e08ZiP;na0s2;a0ea0o5taF;icPo5;a0ch1;cZ1fa0za0;ba0pe0;a33b31c2Kd2Fe2Af24g20l1Wm1Fn11or10p0Ps07tZuXvPz8;alVeRiQolP;a0e0ge0ta0uzIve0;n06Usi2ve0;de0la0nQrPsN;be3i0sa0;dPi0;e0i6;eXDu2;ni0sPtTK;a0ci0;aVeTi3ma0oRrP;aPo07H;e0g9r0smUJt2;c6na0rP;ce0na0re;leVPnP;e0ta0;gl1rA;a05c02e00iZoXpTsa0tQuPveO;cLl2o4sLD;aQo3rP;in9ut069;bi089g4re;arm1eRiQl06GoP;l0Tn7sa0;arFeDn9;cLdi0n7t2;lPna0r9;le070ve0;ca0e7;de0nNrP;ba0vH;aQen7hiar057iacq05BoPri00HuoK;nt3pJte0;lAt2;l05Sna0pe0rJI;aXeViUoSrQuP;d1g4li0;e3Xis5VoP;dD5mTSp01Zva0;ne0r01GsPta0;a0izIse7;an9eDgl1o007re;nCrcPs6te0;orDLuoK;ga0rPsCti0;a0la0ti0;di4gJ2;as05KcZevi6fXgWnVoUsavi0tSun01VvP;eQiP;a0goJ;ni0r02F;a4oPra076;c6m04X;mi4va0;eDo069;agliar02Ah1iova04Xraz1;a071or8rP;an6es6;aQhO4oPres059uo3;glio04Tmi03Pnt3rD5;ra0sa0;a02bZeXi3oVpQuP;gi4ne3oZM;atr1iQroP;ve3;aQccio071nP;g04Cza0;g03Dn9z8;n2rPve0;ch1de0;d1mb3na0sPtK;co5ta0;aQec6oP;c6m04CrC;l8mDP;nQrPs048;ca0e,gi4;da0e0g1;aQePu04P;gQXva0;nc1sP;c1sa0;a0eRi3ov01KuP;aPrKQ;d04SrA;ne3t2;a0eJiTlP9oRran9uP;gPl9sa0;gi0ia0;cHGndZ7rP;ma0ni0;la0ni0oJu2;cSde0lRmQnt3piloDsPvo6;aEUci0se0uF;er9pi03J;abo3eg9;heE;aVIda0eSiQoPu03J;na0t2ve0;cSTme4Mp0Zre,sPven03Z;c04AtribXO;fi03Nre,s2terEM;a03e02h00ic5oRreQuP;ci0o040pe3sa0;a0de0s03Z;g04AlleDmVnSpRrQstPve3;itXIrXI;da0i6re0;ia0ri0;c00UdB6fQgiMFnRTos03Uq0DsPtaW7;eg4ide3;erFor2;anAi028pP;aJenCor0ra0;eBMiP;aFe7u7;de0r6t2ve0;cc1de0l6mPpi1Yri6s6t2va0;a0b1;aPel5ol05Jut2;di0l2sCtteVP;b03c00ddormYMffZgga01ZlYnXpUr7sSttRvP;e0vP;i02Col9;ac6i04B;cN0sP;i1CorC9uRD;pPri0;aPen7;ciUVri0;da0iF;la04Yza0;erFio3;cQqP;uis2;a7en7omp03D;bQiP;li2t02D;asCra04R;a0Lc0Fd0Cf0Ag08i06l05m04n02pZqL2sStQvP;e5isIo6;a0oI1rPtST;ar0ibWIoce7;cin7et2isKolXDpTtQuP;l2sHV;aQitWFrP;in9;re,u3;iQ0onP;de0sabPM;ePli6riQPu2;lVWrPte0;e,i0;a0dPo03I;e0icPX;a0uNA;azIeD;nPte3;seJteg3vXL;a5ge0iZMna0olaPreZE;mXJrB;eJlQDuP;l9ta0;arQdi0iPu01P;ge0mXGre;e,gVVre;aTeSiRlPuMN;amZ4i4uP;de0ta0;de0n00Ita0;de0nK8pXAre;lcXDpi2re;gi0lB;bb0Rc0Ld0Jff0Hg0Blle0Am08n06p03reMsYtUvRzP;ionOUzP;ia0o5;a4vP;e7iP;a0ci4sa0va0;ea0iTHtP;opGrP;apPistH;pi0;a0ch1en2pa0sPtr02D;eRiQoP;da0miO;cu3;g4re4t2;a0e0iN1pP;or2reP;n7sWP;nPto5;icLu001;a0mPpi6;aGKenPZol03G;g3n2;gPio4l1;iRomiQrPuaO;inU9upG;to5;a0ra0uP;gZNnZM;iPor8redA;gu3na0;dPe0iRKu4;o029rB;cPimo5;aRhJZoP;g01FmanAn2pp1rP;c1da0re;pPt2;ez8ri02Q;erc1o00KriviXXu1;aQePie2o2;re5stI;d3gl1liSHnCZ;a38e2Mi25la24o1Ur00uP;bYgnWlVnRrQtPz8;a0reM;a0ga0iSD;ge0i0tQzP;ecL;a0eP;gg1l5;i0lu5sa0;aPe0;la0re;blicXGli6;a1Ge0Oi0MoQuP;de0ri0;c0Gd0Ff0Cg0Ai09l07m04n03pXro8AsTtRvP;a0ePo6ve7;de0ni0;ePocDHrKB;g9n7s2;ciRegTXpeQsiFtP;itTWra0;ra0t2;og00LuD;aDeTiSoQuP;g4lC;ne0rP;re,zI;na0z1;lTBn7;osZIta0unWD;a4e0NoQuP;lDoUH;ve0zI;iPunD;fe3;bi0et2;et2rP;amFeWS;a4eQfeJiPon7uF;la0t2;ri0sCtWN;iDuZ3;a01FeRlaFrPu3;asPea0;ti4;de0sC;meEncip1vP;a0ileg1;a0Fc0Dd0Bf09g07l06m03n02ocHVp00riscalAsTteJWvPz8;aReP;de0nP;i0ti00C;le0ri6;aG7cUeSiRsa0taQuP;me0ppVJ;bi01Bre;d1e7;de0l5nPr006;tHz1;egZKin7riTP;a3ePor0;nsI;asZ5de0o2uIT;eQia0uP;ni0ra0;re,tK;eZXu7;a0iPus2;a0uO3;a0eJiP;gMDsC;a0iPo9G;cTOli9re,spV1;e7iPlu7or6R;de0pi2sa0;ccen4mbo5nnuX9;li4nPti6;de0za0;e2gg1lXmWnVpGrTsQtP;a0eIC;a0izIpUTse7tP;aS4ePiUQu5;gg1rD;ge0pore,re,tP;a0en7;de3e0;ic1pa0;emBi0la0tJvOW;cOSg1na0sFuVD;aXccWeVgUlTnSoQpa0roTMsPttRHzzU5;c1o5;mXUvP;e0igQR;ge0za0;a0o2;ia0l1no3o5;ga0na0t3Z;a0hiQN;cTgRl5nPre,t2z8;a0eEgPiPPta0;e0iSo5;a0e0g1nP;e0uYE;eQiP;ucL;re,voCU;c6d09gg3Hla0n07pa0rSsRtP;e0tP;egolOHi4;a0ca0ta0;c01d00egri4fZiYluUZmWnPFo3petVqFVsStRvP;a7eP;ni0rN;eW3urX8;eQisKonPua7;alBiP9;guiTBve3;ra0ua0;aVYePu2;a0tK;co5oAre;ezIo3;e0o4u3;epSLoPuoK;r5Cte0;aQWd2Cet3iKnXZsPtSJzo5;a0io4;a5i4;c05dro04ga0l03na0pGrXsTtRuCvQzP;iSEz1;en2o02;iIMroW4tP;a0eEi4ui0;c24qWHsQtP;iYVu3;a0eEiP;o4re,va0;aTcP4eNQiONlSod1tP;eQiPoJuJ;ciGre;ciGgg1ne0;a0ot2ucL;fraCgo4lBre;a0eClNIpIK;neE;a0ch1iTH;b0Icc0Gd0Fff0EggetV9l0Cm0An08p05r00sSttPvv1z1;a0eQimTOuP;n7ra0;mH4ne0;aVcUpi2sRtP;a9XePi4rQ9;gg1n2;eQiP;da0ge4;qu1rXGssI;il5u3;n4re;a0bi2diHVecLgRiPla0mN3na0;en2gPna0;i4l1;aPoO;nBsF;e3i4pPri0ta0;oPriKB;ne0r0;dPo3;a0eEu5;aEbrMTetKoP;geneBloD;ez8ia0trP;aEepA5;eGGic1ri0us6;i91o3;asIhiMNi7lu7or3YuP;l2pa0;bQeSXiettWUliPnubi5;a0ga0te3;eSViR5liD;aYeUiToRuP;da0me3oPtriO6;ce0ta0;ce0ia0leEm1JrmIMtP;a0iNDta0;cLdiNCtJ;cessi2gRt2utrIJvP;a0iP;ca0sL;a0li9oz1;r3sRtQuPviD;fraDsT7;a0u8W;a0cPt3;e0on7;a0Ke0Ci03oUuP;da0gRltQnUPoPXra0sR7tP;a0i5ua0;a0ipCI;gPo5ug4;h1i0;biliWdTlSnRrQst3tiW7vPz8;e0imQE;a0d1Ii0mo3si6tiMU;da0itorS4ta0;a0ce0es2la0tipCB;ePiMR;l5rP;a0nB;ta0z8;aWeKgVllDKmUnSra0sPtiD;cQe2Ysa0tPu3;iMLu3;e5h1;aWQge0iP;mBst3;a0etB;l0Fra0;go5u5;diSHgl0Dla0mVnUrSsQtP;odBte0;cPta0u3;e0o5;a7AcaPenAge0i2;n8Hre;a0dQEoFti0zI;orB;c06eRRg04l03mFnXpGrUsQtP;erJ1riUXt0AurH;cRsaQtP;erBi6urU0;c3gg1re;he3;a70cQi0VtP;el5or1;a0h1i7C;ca0dTeL0gSiRoQtePu1S;ca0ne0;mI9v3;ca0e3fL7po5;anUTiMR;a0u6;a0di0eR4ig4trat2;a0gPl1nK0;io3;chiT6ePi4;l5ra0;a0Ce03iXoUuP;bScRmQnDsPtRO;inDsa0t3;a0i4;ci6e0iAra0;riLH;cQda0gPnRErAt2;i6o3ra0;aNBuple2;bTceSevi2mRnc1quQsPtiDvUD;a0c1ta0;eMiA;a0i2o4;nz1re;a0e3ra0;cWde0gTnTHsRvP;a0iP;ga0ta0;iPsa0;na0o4;aMZgQiPna0;fe3ttiF;e0icL;ca0e0;cZg4mXnWpiArVsUtSuRvP;a0orP;a0icL;da0rQW;e0iPra0ta0;na0ta0;cTBsa0t8A;ga0va0;c1gMQ;a0biPen2pJQ;c6re;cT6e3riF;bQ0d52gno3llu51m3QnZpYrUsPtalia4;cICo5pRsa0tP;al5iPrMK;ga0tMJ;ePi3;sAZzI;a0e,onBrP;ad1eNiQoP;busNga0mEUra0;de0gPPta0;notBotB;a3Bc2Ld2Be29f1Tg1Ei1Dl1Cn17o15qu13s0StYumiPOvPzupG;aVeSiRoP;ca0gl1lP;a0ge0ta0ve0;a0d1gi5sLta0zLI;cLi0ntarQrPstiD9tJ;a0ti0;e,ia0;de0gMBlPsa0;e0iA;a0He03i01oYrPui0;aTeU5iSoQuP;de0fo5;dPmGC;ur0;de0ga0sN;lc1pRre,tQvP;e7ve7;teQL;po5rSE;nQrPsAM;bidHpiP3;aKFti0;epiP1mPn9rizKZto5;a0iP0oJ;g3n01rRsP;se0tarP;di0e;aXcUdi0esCfTloqLJna0pSrQse6vP;eRIis2;a0oP;ga0mDW;el5or0re2;aTJeJ;a5eQorP;re0;de0t2;gi0re;de0eJsiJ9ta0;c6gl1rs1sI0vo5;aWcVeUiToSpi3tQuP;d1Pl2;aPitL5rL5;l5re,u3;r9spetN;d1gR2nQSsK;d1gEKri0;e4riLW;ngQpoP;na0ri0;ui4;ad3iP;e2na0si0;lt3nArP;gogT7riO6;aSePoS3;gg1rvQsP;ca0ta0;a0o97;ff1l8mo3;e1ib3;bi0et2mi6zFI;a02e01hi00iXloQIoUrQuP;a1r75;aQesCoP;pGsC;nPsCviAz1;a0di0;bQia0lPmb3rDz8;fa0la0;bi0;alSQganNnQuP;n9r1;ocL;otN;g4lo8QntiSMri0sC;bb1gg1n4rbuO;a02e00iWlUoSrQuP;o6r1;aPeddoSI;d0Mn9;ca0n7rP;ca0ma0na0tu4;ig9uP;en8i0;aRc1eJg9lQnPsLtN;i2ocL;a0t3za0;ccK3mF;rPs2t2;i0ma0o3Tvo3;ma0nDrPstiN5tPI;ci0i4;br1rP;i0pi6;aDeWiSoRuP;ce0g1l9rPstriCV;a0i0re;sCvi4;a0cMVetMNgRrQspPvidPA;etNor0;e,iz8;e0na0;bPnnBt2;i2oRT;a07e04hi03i02l01oVrRuP;ba0lG5nNEpi0rPte0;io7Uva0;eRiQoP;c1s2;mi4na0;mKRsG;gPYlSmRnt3rP;aG9nPo4po3re0;ic1;be0iO0oA;lPpa0;a0eJ;i4u7;amGde0n9pr1ta0;appKMna0oA;de0nPpGra0sKC;dPVeJtP;iQ7ra0;gl1l8mUnTpSrRsPte4vo5z8;i4sa0tP;o4ra0;ce3i6na0ta0;oORpa0;ta0uN;mi4;b62ciM1ff1lRrQspJuP;gu3;ca0iLZ;a0be3za0;aHFb0Li2m0FpP;a09e06i02l01oWrRuP;g4lCn2tP;a0riLU;aticIOeRiQoP;n2vviC;gIme0;ca0g4n7sPzio6V;sIta0;ne0rRsPveJ;sPta0;esCibi9R;re,tP;a0u4;emJPi6o4D;an2ccOOeQgPla0;l1ri0;ga0tP;o6Kri0;di0g4lHOnQrP;a0maQEn1so4vI2;na0sieJ;ccSdroNYlRnQrPs2t2uJzzH;a0en2ti0;a0ta4;a0liL8;a0hJHia0;aSeRiQoP;bB3la0rta5;g3sL;deJMr9tK;gPtriOH;azzi4i4;aZeYiVoUrQuP;ca0r3;aRoQuP;ni0tN;gl1nc1;cc1t2;c6s6ttiGH;ancQbi0onKTzP;zarJ;a0hi0;lPRstiaPRve0;cuc6lQnKPrPsNtKvaO;az8ca0;la0saF;de0mi4st3;ePolat3ra2;aH4nP;tiF6;a0Ye0Rh0Oi0Al09o04rWuP;aRerQfa0iPs2;da0na0z8;i0reE;daRiQl11rPs2ta0;da0enNi0ni0;o5re;gnFWre;aQe0IiPonAugMX;da0gl1;cTdSff1n9FtPva0z1;iQtP;a0ug1;fi6na0;a0i8Kua0;ch1iA;cciEMdSff3mi2nRrgQvK3zzoP;viO;heEoO;f1go5;e0ro4;isCoriJM;aMYb01ng00oWrTt2uP;bi5ca0di6gLAlebMFnRo6ra0stP;appJ2iP;fi6z1;ca0ge0ta0;a0eDLoP;nPvaD;zo5;cQiPst3va0;a0re;a0hPo5;erN8icL;il5;ol5;erQiP;aO9g4;mi0;la0meUnSrmRsPt2;sa0tiP;co5re;i4oO;ePuflAC;raFU;l5re;bLSlQrPsa0tNXu7;anNba0eEri0;lCUopGvP;anB;a0Ve0Si0Jl0Ho08rVuP;ci5gTlSma0nRorPra0stiD;iusPv1;ci0;es2ge0zI;ge0mi4;a0gi0;aXeWiToRuP;ga0i0l5sPt2;c1tLL;da0nP;teE;gQni0zP;io4za0;ge0na0;cc1dAgLVme0na0quGVs6t2;cRg3iQmmGUnPppHWstor4tLOzI;a0ca0ge0tuF;ntLV;asC;c8Fde3gWlVmGQndUrRtP;oPte0;cop1g6Q;aC7bi0g1mPniDUtiD4za0;aPiLVu5;lBre,t2;a1Ae0;go3la0;g1l1;agLYetKir2ot2uP;i0ttKN;aWc6daCDgVlUnSoQrFsPt2u2;a0chiDRsa0;ccPnAri0;a0hGG;aPge0i0ta0;lBnz1;a0ma0osoMt3;ge0l1u3;c6mmeEncD5ta0;cFCli02n7rQsPte0;su3tBN;i0mL6ra0t7Wve0;b01c00gYlXmWntasKFrTsStRvP;el5orP;eEi0;a0i6tu3;ciJYtid1;ci0e,fPneKA;alPuO;leE;a0iliBE;c1lHsAL;l1oP;ci2;e0i5QoltB;bPri6;ri6;c1Id1Fff1EguaOiacu5l18m14n11qui0Yr0UsVtUvP;aSiRoP;ca0lP;ui0ve0;de44nKGra0ta0;cJQde0ngelBpo3;er4ichFM;a0Lc0He0Ei0Co09p00sXtPulI1;as1eUiToSrP;aQoPu7;m89v6Q;da0n1po5r0;lDGrK8;ma0ng6WrGva0;nPr4;de0ua0;ePic6uA;gDOrP;ci2e;aWeUiJPlSoRrQuP;g4n9;i7Zopr1;ne0rFM;e2ic5LoP;de0ra0;di0lD3riPt2;mEYre;n7tr1;nQrP;cBdi0ta0;da0e3;bi0ge0lPme0sKta0;a3ia0;cQgD8mpPn2rciFB;liB7;ra0u2;i0lRoQuP;sa0te0;gi2;aFu7;cerIYge3lH4mi4s3UuP;di0ri0to3;eRge0i9oQra0uP;di0t2;de0ga0m5D;d4Zg9;lib3paQvP;aCHo6;gg1ra0;com1fE8tQuP;clGSme3nc1;ra0usiasF;aQePig3ozIpiIEu5;nAr9tK;nPrBI;a0ciG;aSeRiQog1uP;cub3de0;de0ge0mi4;g9moD9n6va0;bo3rP;gi0;ettI5ig1on7;iQuP;cDLlco3r0;fi6ta0;cQheElPonomB;isC;ePi2;de0lBVpi0ttHY;a3Qe2Fi05oVrSuP;bQce0el5pPra0;li6;b1i2;aQe4iPoD;bb5z8;ga0mmDHpG;cXlWmTnKBpSrPsa0tG3ve6Z;a0mP;en2iP;cLre,ta0;a0p1;aQesHQiP;cF9na0;nAre;a0e0o3;c1e0umDA;a1Xb4Mc1Vf1Og1Ll1Gm1Bp19r14sWt2vP;aUeSiQorPulD;a0z1;de0e2nPsa0;a0co5;de0lB8nHVrPz8;be3ge0s7Uti0;ga0mGri6;a0Ubos6c0Nd0Le0Jfa0g0Hi0Alo6m5Wo07p01qZsVtPubbiEV;aTen7iSoRrPurHE;ar0iPug9;bBFca0;gI5rHT;l5ng4H;c6nz1re;angH1eRiQoPua7;c1da0lC6;mu5pa0;mi4nNppelJMr2ta0;uiP;si0;arHeSiRoQrePu2;g1z8;ne0r0sa0;aHHeDn9;nPrDBt2;de0sa0;bbeECcQno3rP;di4iCH;cuG;dUllu7mp3WnP;cSfCItP;eQosP;si6;g3resC;an2;e3ra2;e5iPreDus2;un9;g4rP;eAta0;a0ePi0;g4t2;eUhTiogHAoRriQuP;sCte0;mi4ve0;lGnPpJr4Ks2;n4TosGU;iu7;n7rF5;g1pproHNrFttP;en7iHM;aSeRiQoP;c6m2Pt2;ge0me0;!da0g9zI;da0ma0z8;aPen7i2EloFor0;na0rN;aSeRiQoP;ra0st3;nA1ssI;n20sFVtKz8;grHnA;aSeQi9uP;i0nDv1;gPt2;g1ua0;ga0n1ta0;eJiQrP;ig4;ta0u4;eUfP;aFerRiPon7;cPda0;ol2;ePi0;nz1;n7t2;a0ePhia3;re,sC;gnosFCloD;ambu5b0Xc0QdH8f0Mg0Kl0Gm0Dn0Ap04r01sVtRvP;as2ia0oP;lAAra0;eQrPta8DurG;ar0;ne0rPs2;ge0io3mi4;c50iTo5tPu3O;aRiQrP;a0eEug9;na0t96;b2Gre;a0de3g4la0na0ra0sK;aQiPoDuF0;de0me0va0;gl1pa0;auTeSiRlo3oQrPu3;eAi3E;ne0rB1si2;la0n9;n7ri0;pe3;ig3oQta0uP;da0nBJ;mi4ta0;anAoP;li0rP;alBde0;eRiPu7;be3mi2nPra0z1;ea0q1Q;ga0re;ePluNna0raAus2;ne3;al6eRiQlPorFrauAun9;etKui0;la0ni0;ca0ri0;aUe7hi4iTlSoQrePur2;sESta0;l5mpAXrP;a0re0;aFi4;de0fDSma0;de0n2pi2;b1el5iPut2;li2;ma0nSrRtPz1;a0tilogP;raM;deEe;n52za0;a4Ge47h3Yi3Kl3Ho04rUuP;cRlQmu5oEEpe0rPstoBC;a0ioCva0;la0mi4;c1iPul1;na0re;apu5eViUoQucP;c1ia0;cQgPl5;io5;ch1iP;a0fig9;a0ti6;a0de0ma0pQsPt2;ce0iF;a0i2;a30c2Zdi5KesisKg2Xi2Vl2Mm1Sn05o03p02rXsPva0z8;a0pVtP;a9LeTiSrQuP;di0ma0;iPui0;gC7n9;pa0t7E;gg1l5r4;ar9i3;az8bEBi6o4rPteE;eRispon7oPuD;bo3de0mP;pe0;da0g9la0re;ia0pE6ri0u5;pe3rP;di4;c15d12f0Tg0Pi81n0OosDIqui0Ns0FtVvP;aliAeSiRoP;ca0gl1lP;a0ge0;nDEta0ve0;ni0rP;ge0sa0ti0;a06e02inCMor01rPun7;aTiSoP;bQl5vP;erK;atK;b6Rre;ccamb1dSfMpp9BrRsPt2vveCQ;sPta0;eg4;e,ia0re;diPi0;re,stingP;ue0;ce0na0;gg1mp5nRstP;a0uP;alB;de0e0ne0ta0;bPg1mi4re,t2;ilB;ac3eUiTolStQuP;l2m7J;a8Dit6ArP;in9ui0;a0iA;de3gl1sK;gPnNrDH;na0ui0;de0s2;etKo2uAR;eRiuQrP;atu5eD;n9ra0;da0g4la0stItCC;aWeUiSl5YoQrPu2;on2;n7rP;ma0ta0;c6da0gPna0s6;ge0u3;rPsCzI;i0ma0;bu5re;an4enCiQoPuBH;le0na0t2;re,vi7zI;eSiRlu7orQret8XuP;pi0sC;da0re0;a0l1ma0ta0;de0nt3pi0rP;ne0ta0;anAb0Ge0Fi0Em07oApQuP;ni6;a03e01iZlWoVrQuP;n9ta0;aSen7iRoP;mPva0;etK;me0;re,vBU;ne0r7As2;eQiPot2;ca0m6Ore;sCta0;aPe0la0re,ta0;ce0n9;nPra0te0;d1et3sa0;g4rPtB9;a0i0ti0;eSiQo5TuP;o5Sta0;na0sP;e3sIu3;d1mo3nQrcPtK;ia4P;da0ta0;nc1sC;n2re;aPi4;c1tK;a0e0lSma0oRpPtiBX;a0evPi0;olB;nBrH;aSeRiQoPu7;ca0qu1;de0ma0;ga0t2zI;bo3re,sCuAzI;nPre;ci7v19;i2liPnosAQ;e0o4;co5e0;bi2diuBJgu5;aPic6o4;ma0n9ssi26uP;di6;a01ba0c00f3gZmAPnXondo5rcStQuPv5R;cc1r5;a0oP;fo4;oQuP;i0la0mnaviDnA;nQscP;ri4T;ci7da0;cisLgPta0;e0u5H;ne0o5;atrBca0;ba2Jnci0Jr5;eWiP;aSeRna0oQta0uP;de0r5;cc1da0sa0;de0re0;cchie3ma0pGrPva0;a0iP;fi6re;re0ta0;ca0de0lWm50nTpGrQsP;el5sa0ti4;a0cQn4ZtP;a0i1E;a0hi29i4;a0na0sQtP;elli4ra0;i0u3;a0eb3ia0;b0QcAKd0Of9Wg0Nl0Km0Hn0Dp04rZsXtUuTvQzzP;a0eEia0;aPil5;lPre;ca0la0;sa0te5;aQtP;a0iACu3;loDp2T;ca0sa0tP;iDra0;aRbQca0ez8iPpi0;a0ca0;onBu3;m9UttP;erB;aWeViQovPp0Tta0;ol9;llSre,tP;aPo5;lBnPre;a0eE;arB;gg1re;ci2re;c9JdiRg1na0sa0tPzo4;arePer9IicL;!l5;da0re;b1i4mi4oAPpPufM;a0eEiP;cLo4re;a0cQe0ib3ma0pPunn1za0;es2;a0ia0o5;a0io4l1;ePu6;n8re;a5ra0;a0Ne0Gi0Bl09o03rTuP;ca0fRgQli4r5sPt2;ca0sa0;ge3ia0;a0fa0;aVev3NiTonSuP;cPli6ni0s6t2;a0iaP;cLre;to5za0;ga0l5nP;a0da0;cc8CmHnPsa0va0;cPdi0;a0o5;cSfonLicRllHmbar20niQrPt5Txa0;bQda0ra0seE;fi6;ot2;cPia0;a0heEia0;aPinAoc6;n4WsfeFte3;aRgQla6Enas7XsPv5C;biOog4ti9M;hello4ia0;da0n6sP;ci6iF;a0ccUfMl4AnRrQstemm1vP;az8er6YicL;c1e,go5linDsaO;da0ePvo0X;a25diPfic7S;ce0re;a0heE;c03da0g4ia0l00nZrUsSttQzP;zi6;aOeP;re,z8;a0c1i0sa0tP;a0o4;aSba0cRda0rP;a0iP;ca0re;ame4ol5;re,t2;ch2Idi0;b2He4lQoc6uPza0;gi4;a0et2;a0cQiP;a0ucL;aPh1;gl1re;b86c6Sd61er60ff5Lg51i50l4Em3Nn34p2Dr1Ms0Yt0Hu0CvUzP;io4zP;aReQiPufM;ma0tN;c6ra0;n4rA;a05e02in6Wo6vP;aZeViQolP;ge0to5ve0;a0cSlRnQs4Hta0va0zP;zi0;a0ce0gh1;i0upG;enAi4;de0le4nQrPz8;a0sa0ti0;i0tP;a0u3;lPmGntaE;e0la0o3;lQrP;e,te0;le0;l5n8r1;di0gu3li0m1Ira0sRtP;en5ToP;m1DrB;cPpi6;ul2;a0tP;a02eZiYorWrRuP;aPti0;lBre;aRez8iP;bPs2;ui0;c6e0r0vP;erC;cPn1;e0iO;g4Bn9ra0va0z8;ccQgg1nPrrHs2;d0Pe0ta0ua0;hi0;c6gl1naOrP;da0e;c08f07o5p05sStP;eQrP;ar0in9;ne0r9;aZeWiUoQuP;eMme0r9;c1da0gg0UlRmQn4pi0rPttiO;bi0dHge0ti0;iOma0;da0ve0;cu3dPeGl5mi5sK;er4O;cQd1g4mb5ntHrPs2t34ve3;i0vi0;onA;gg1l58po3sP;si4;ePi3or2;r9t2;al2iss1;en7iRoQriP;ve0;l2n7;a0uD;a0Eb0Dc0Ad09e47g07ieEm06om05rQti5HzigoP;go5;aZeYiWoQuP;fMggi4Mo5;cc54gTsStQveP;l5n2;a0oP;la0nA;a0sHtH;a0e0;ccPde0nDsLva0;hi0ia0;ca0da0n7s2t3;bRfMmQnPpa0;ca0g1;pi6;at2b1;atB;a0eEonB;i4omPui0;en2;e0i0;a0hiP;tPv1;et2;it3;bes6re;ostroMpPri0;a08e05i02l01oZrQuP;ntHra0;eVoP;ba0cc1da0fTn2pRsQvP;a0vigI;siF;iPr1;a0nq3G;it2ondH;n7sPz8;en2sa0ta0;gg1lla1rPs2;re,ta0;au0Xi6;aQccPgl1opGso5;a0i6;na0ttH;l5nQsPti0z8;anNta0;a0de0;ga0ia0lTn4rQssiP;o4re;a0eQi0tP;a0e22;cLn2;eCta0;alBc06d05e03g02iFnVsTtP;eQiP;ciG;ce7pP;or0;a0iP;a0ma0;aUeTiSoRuP;i0l5nPsa0vo5;c1z1;da0ia0ma0t10ve3;chi5Ada0en2;bb1ga0rHtK;cq2Kff1sG;e0o53uY;lPst11;a0la0;a0icapG;heEo3;a0Cb0Ai6mUniToRpP;liPu2;a0fi6;reE;gg1;st1;a01eZiYoRuP;cLffi0tP;i4o4U;bUdTgl1llHn2PrP;bQtP;a0iz8;a0iP;di0;er4;il1;c6niTra0;nAtP;a0te0;c6eQi4l2OnPra0sCtNz8;et2sHta0;st3;a4CiPu5;a0en2re;lgaFrP;ePi6;!gg1;be08e07fab06ge0i05lSmanRtPza0;ale4erP;a0ca0na0;ac6;aZeViToQuP;ci4de0n04;ca0gQnP;ta4;a0g1;bi0e2nP;ea0;a0gQnPr2sNt2v25;a0ta0;a0geJra0;ri0;cc1ga0pGrPt2;ga0ma0;a0e4ta0;etB;gg1na0re;gg1rP;a0ga0;ta0u2z8;e07gSiRoQuP;ra0z8;g4nB;a0re,ta0;a02et01hi00iVloUrQuaP;n2ta0;aReQoPupG;t2viO;di0ga0;dHpGva0;me3;oSra0uP;di6gQnPs2;ge0ta0;ne0;ga0r4;a2ZnA;ti24;nc1;vo5;a00eYiVlUoTrPumi6;aQePon2;s6t2;nPt1N;ca0ge0;ca0ga0l5nA;ig9o2Uui0;aQbb1da0evo2XgPl12na0o3sCt2;e0ge0;n6ta0;rPt2zI;i0ma0ra0;ccQma0n4re,sPti6;ci4;enAia0;a0ea0;a0Ed01eXiVoRuP;lPna0;a0te3;cLmb3pQrPt2;a0na0;e3ra0;ch1;bi0rP;a0e;gRmpiQrPs6;ge0i0;e0re;ua0;a0eYiVoQuP;ce0r0;bSlRmesQrmPsC;en2i0;ti6;ci0o3;ba0;re,ta0veQzI;io4;ni0;bi2nPst3;sa0tP;a0ra0;g1t2;cUeNquRuP;i0tB;iz8;at2e2iP;e2sP;i0ta0;a0Le0Gh0Ei08l06oTreRuP;cc1di0lPmu5ra0sa0;tu3;di2sP;ce0;c00da0gZlYmVnSppRrQstPva1D;a0uF;a0c1da0ge0pa0re0;a0ia0;c1discQsenNtP;a0en2;en7;ia2oApPu4;ag4;da0;la0tY;lie0;co5;aFima2u7;ma0;aSdRe6gQn9ufM;ge0;l1ne0;e0ia0;c6mbP;el5;e2iP;apGta0u7;ca0de0le3nRrQsNt2;ti0;ch1ta0;de0na0tP;a0ra0ua0;de0lXmGnVpUrTsStPval5;as2tP;a0iP;va0;a0c1;ez8to0G;ar3iOpo4;i0to4;pa0;aPca0da0o3;pp1;bYdXer3iUneDoRrPuC;a7oD;de0;li0mi4rP;ri0ti0;ga0;li2sCtPu3;a0ua0;sa0;i6ur0;a0Ae07i03oVrQuP;fMia0o4;aSev1on8uP;nHsto06tP;i0ti0;a0i0;cc1n6;c6nUrRtQz8;za0;to4;da0rP;aPi0;cc1;aPda0i0;cc1re;gl1nRoQsog4t2;ta0;sc1;a0do5;lQve3;ra0;li0;cXgl1ia0l5ndo4rRsQtK;te0;sa0ta0;bQca0ufM;fa0;aOi6;ca0;gl1;la0;a0ch1i4;na0;ia0;re",
    "Organization": "true¦0:42;a37b2Oc28d20e1Wf1Sg1Kh1Fi1Cj18k16l12m0Sn0Go0Dp07qu06rZsStGuCv9w4y1;amaha,m2ou1w2;gov,tu2P;ca;a3e1orld trade organizati3W;lls fargo,st1;fie20inghou14;l1rner br38;-m0Zgree2Xl street journ22m0Z;an halMeriz3Risa,o1;dafo2Dl1;kswagKvo;bs,kip,n2ps,s1;a tod2Nps;es30i1;lev2Tted natio2Q; mobi2Gaco beOd bLeAgi frida9h3im horto2Pmz,o1witt2S;shiba,y1;ota,s r X;e 1in lizzy;b3carpen2Ydaily ma2Sguess w2holli0rolling st1Ks1w2;mashing pumpki2Kuprem0;ho;ea1lack eyed pe3Ayrds;ch bo1tl0;ys;lPs1;co,la m10;a6e4ieme2Dnp,o2pice gir5ta1ubaru;rbucks,to2J;ny,undgard1;en;a2Nx pisto1;ls;few22insbu23msu1U;.e.m.,adiohead,b6e3oyal 1yan2T;b1dutch she4;ank;/max,aders dige1Cd 1vl2Y;bu1c1Rhot chili peppe2Globst25;ll;c,s;ant2Rizno2B;an5bs,e3fiz21hilip morrBi2r1;emier23octer & gamb1Oudenti12;nk floyd,zza hut;psi24tro1uge07;br2Mchina,n2M; 2ason1Uda2C;ld navy,pec,range juli2xf1;am;us;a9b8e5fl,h4i3o1sa,wa;kia,tre dame,vart1;is;ke,ntendo,ss0J;l,s;c,st1Btflix,w1; 1sweek;kids on the block,york07;a,c;nd1Qs2t1;ional aca2Bo,we0O;a,cXd0M;a9cdonald8e5i3lb,o1tv,yspace;b1Jnsanto,ody blu0t1;ley crue,or0M;crosoft,t1;as,subisN;dica2rcedes1;!-benz;id,re;'s,s;c's milk,tt11z1V;'ore08a3e1g,ittle caesa1H;novo,x1;is,mark; pres5-z-boy,bour party;atv,fc,kk,m1od1H;art;iffy lu0Jo3pmorgan1sa;! cha1;se;hnson & johns1Py d1O;bm,hop,n1tv;g,te1;l,rpol; & m,asbro,ewlett-packaSi3o1sbc,yundai;me dep1n1G;ot;tac1zbollah;hi;eneral 6hq,l5mb,o2reen d0Gu1;cci,ns n ros0;ldman sachs,o1;dye1g09;ar;axo smith kliYencore;electr0Gm1;oto0S;a3bi,da,edex,i1leetwood mac,oFrito-l08;at,nancial1restoU; tim0;cebook,nnie mae;b04sa,u3xxon1; m1m1;ob0E;!rosceptics;aiml08e5isney,o3u1;nkin donuts,po0Tran dur1;an;j,w j1;on0;a,f leppa2peche mode,r spiegXstiny's chi1;ld;rd;aEbc,hBi9nn,o3r1;aigsli5eedence clearwater reviv1ossra03;al;ca c5l4m1o08st03;ca2p1;aq;st;dplLgate;ola;a,sco1tigroup;! systems;ev2i1;ck fil-a,na daily;r0Fy;dbury,pital o1rl's jr;ne;aFbc,eBf9l5mw,ni,o1p,rexiteeV;ei3mbardiJston 1;glo1pizza;be;ng;ack & deckFo2ue c1;roW;ckbuster video,omingda1;le; g1g1;oodriM;cht3e ge0n & jer2rkshire hathaw1;ay;ryG;el;nana republ3s1xt5y5;f,kin robbi1;ns;ic;bWcRdidQerosmith,ig,lKmEnheuser-busDol,pple9r6s3t&t,v2y1;er;is,on;hland1sociated F; o1;il;by4g2m1;co;os; compu2bee1;'s;te1;rs;ch;c,d,erican3t1;!r1;ak; ex1;pre1;ss; 4catel2t1;air;!-luce1;nt;jazeera,qae1;da;as;/dc,a3er,t1;ivisi1;on;demy of scienc0;es;ba,c",
    "SportsTeam": "true¦0:1A;1:1H;2:1G;a1Eb16c0Td0Kfc dallas,g0Ihouston 0Hindiana0Gjacksonville jagua0k0El0Bm01newToQpJqueens parkIreal salt lake,sAt5utah jazz,vancouver whitecaps,w3yW;ashington 3est ham0Rh10;natio1Oredski2wizar0W;ampa bay 6e5o3;ronto 3ttenham hotspur;blue ja0Mrapto0;nnessee tita2xasC;buccanee0ra0K;a7eattle 5heffield0Kporting kansas0Wt3;. louis 3oke0V;c1Frams;marine0s3;eah15ounG;cramento Rn 3;antonio spu0diego 3francisco gJjose earthquak1;char08paA; ran07;a8h5ittsburgh 4ortland t3;imbe0rail blaze0;pirat1steele0;il3oenix su2;adelphia 3li1;eagl1philNunE;dr1;akland 3klahoma city thunder,rlando magic;athle0Mrai3;de0; 3castle01;england 7orleans 6york 3;city fc,g4je0FknXme0Fred bul0Yy3;anke1;ian0D;pelica2sain0C;patrio0Brevolut3;ion;anchester Be9i3ontreal impact;ami 7lwaukee b6nnesota 3;t4u0Fvi3;kings;imberwolv1wi2;rewe0uc0K;dolphi2heat,marli2;mphis grizz3ts;li1;cXu08;a4eicesterVos angeles 3;clippe0dodDla9; galaxy,ke0;ansas city 3nE;chiefs,roya0E; pace0polis colU;astr06dynamo,rockeTtexa2;olden state warrio0reen bay pac3;ke0;.c.Aallas 7e3i05od5;nver 5troit 3;lio2pisto2ti3;ge0;broncZnuggeM;cowbo4maver3;ic00;ys; uQ;arCelKh8incinnati 6leveland 5ol3;orado r3umbus crew sc;api5ocki1;brow2cavalie0india2;bengaWre3;ds;arlotte horAicago 3;b4cubs,fire,wh3;iteB;ea0ulR;diff3olina panthe0; c3;ity;altimore 9lackburn rove0oston 5rooklyn 3uffalo bilN;ne3;ts;cel4red3; sox;tics;rs;oriol1rave2;rizona Ast8tlanta 3;brav1falco2h4u3;nited;aw9;ns;es;on villa,r3;os;c5di3;amondbac3;ks;ardi3;na3;ls",
    "Month": "true¦a5dic3febbra2g1lugl2ma0nov3otto4sett3;gg1rzo;enna0iugno;io;em0;bre;gosto,prile",
    "WeekDay": "true¦domenica,giove1lune1m0sabato,vener1;arte0ercole0;dì"
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
  var parseSymbols = symbols;

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
  const unpack$2 = function (str) {
    const trie = {
      nodes: str.split(';'),
      syms: [],
      symCount: 0
    };
    //process symbols, if they have them
    if (str.match(':')) {
      parseSymbols(trie);
    }
    return toArray$1(trie)
  };

  var traverse = unpack$2;

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
      const arr = traverse(obj[cat]);
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

  var unpack$1 = unpack;

  let misc$1 = {};
  var misc$2 = misc$1;

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
    Object.keys(res).forEach(k => {
      if (!words[res[k]]) {
        words[res[k]] = [tagMap[k], 'PresentTense'];
      }
    });
    // past-tense
    res = verbs$2.toPast(w);
    Object.keys(res).forEach(k => {
      if (!words[res[k]]) {
        words[res[k]] = [tagMap[k], 'PastTense'];
      }
    });
    // future-tense
    res = verbs$2.toFuture(w);
    Object.keys(res).forEach(k => {
      if (!words[res[k]]) {
        words[res[k]] = [tagMap[k], 'FutureTense'];
      }
    });
    // conditonal
    res = verbs$2.toConditional(w);
    Object.keys(res).forEach(k => {
      if (!words[res[k]]) {
        words[res[k]] = [tagMap[k], 'ConditionalVerb'];
      }
    });
    // gerunds
    res = verbs$2.toGerund(w);
    words[res] = words[res] || ['Gerund'];
    // participle
    res = verbs$2.toPastParticiple(w);
    words[res] = words[res] || ['PastParticiple'];
  };

  Object.keys(lexData).forEach(tag => {
    let wordsObj = unpack$1(lexData[tag]);
    Object.keys(wordsObj).forEach(w => {
      words[w] = tag;

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
  Object.keys(model$1).forEach(tense => {
    Object.keys(model$1[tense]).forEach(form => {
      let infs = Object.keys(model$1[tense][form].exceptions);
      infs.forEach(inf => {
        if (!words[inf]) {
          words[inf] = 'Infinitive';
          addVerbs(inf);
          // console.log(inf)
        }
      });
    });
  });


  words = Object.assign({}, words, misc$2);
  // console.log(Object.keys(lexicon).length.toLocaleString(), 'words')
  // console.log(lexicon['suis'])
  var words$1 = words;

  const verbForm = function (term) {
    let want = [
      'FirstPerson',
      'SecondPerson',
      'ThirdPerson',
      'FirstPersonPlural',
      'SecondPersonPlural',
      'ThirdPersonPlural',
    ];
    return want.find(tag => term.tags.has(tag))
  };

  const stripReflexive = function (str) {
    str = str.replace(/arsi$/, 'ar');
    str = str.replace(/ersi$/, 'er');
    str = str.replace(/irsi$/, 'ir');
    return str
  };

  const root = function (view) {
    const { verb, adjective, noun } = view.world.methods.two.transform;
    view.docs.forEach(terms => {
      terms.forEach(term => {
        let str = term.implicit || term.normal || term.text;

        if (term.tags.has('Reflexive')) {
          str = stripReflexive(str);
        }
        // get infinitive form of the verb
        if (term.tags.has('Verb')) {
          let form = verbForm(term);
          if (term.tags.has('Gerund')) {
            term.root = verb.fromGerund(str, form);
          } else if (term.tags.has('ConditionalVerb')) {
            term.root = verb.fromConditional(str, form);
          } else if (term.tags.has('PastParticiple')) {
            term.root = verb.fromPastParticiple(str, form);
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

        // nouns -> singular masculine form
        if (term.tags.has('Noun')) {
          if (term.tags.has('PluralNoun')) {
            str = noun.fromPlural(str);
          }
          term.root = str;
        }

        // nouns -> singular masculine form
        if (term.tags.has('Adjective')) {
          if (term.tags.has('PluralAdjective')) {
            str = adjective.fromPlural(str);
          }
          if (term.tags.has('FemaleAdjective')) {
            str = adjective.fromFemale(str);
          }
          // str = adjective.toRoot(str)
          term.root = str;
        }
      });
    });
    return view
  };
  var root$1 = root;

  var lexicon = {
    methods: {
      two: {
        transform: methods,
      }
    },
    model: {
      one: {
        lexicon: words$1
      }
    },
    compute: {
      root: root$1
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
    Reflexive: {
      is: 'Verb',
    },
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
  var checkRegex$1 = checkRegex;

  const isTitleCase = function (str) {
    return /^[A-ZÄÖÜ][a-zäöü'\u00C0-\u00FF]/.test(str) || /^[A-ZÄÖÜ]$/.test(str)
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
  var titleCase = titleCaseNoun;

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
  var checkYear = tagYear;

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
  var acronym = isAcronym;

  const fallback = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    let term = terms[i];
    if (term.tags.size === 0) {

      if (terms[i - 1]) {
        if (terms[i - 1].tags.has('Auxiliary')) {
          setTag([term], 'Verb', world, false, '2-fallback-verb');
          return
        }
      }

      setTag([term], 'Noun', world, false, '2-fallback');
    }
  };
  var fallback$1 = fallback;

  //sweep-through all suffixes
  const suffixLoop$2 = function (str = '', suffixes = []) {
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
      let tag = suffixLoop$2(term.normal, suffixes);
      if (tag !== null) {
        setTag([term], tag, world, false, '2-suffix');
        term.confidence = 0.7;
        return true
      }
      // try implicit form of word, too
      if (term.implicit) {
        tag = suffixLoop$2(term.implicit, suffixes);
        if (tag !== null) {
          setTag([term], tag, world, false, '2-implicit-suffix');
          term.confidence = 0.7;
          return true
        }
      }
    }
    return null
  };
  var suffixCheck$1 = suffixCheck;

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

  var suffixLoop$1 = suffixLoop;

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
    if (tags.has('Noun') && !tags.has('MaleNoun') && !tags.has('FemaleNoun')) {
      let tag = suffixLoop$1(str, suffixes);
      if (tag) {
        setTag([term], tag, world, false, '2-guess-gender');
      }
    }
  };
  var guessNounGender = nounGender;

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
    if (tags.has('Noun') && !tags.has('PluralNoun')) {
      let tag = checkSuffix$2(term);
      if (tag) {
        setTag([term], tag, world, false, '2-noun-number');
      }
    }
  };
  var guessNounNumber = nounNumber;

  // str = str.replace(/o$/, 'i')//rosso->rossi
  // str = str.replace(/e$/, 'i')//triste -> tristi
  // str = str.replace(/a$/, 'e')//nera -> nere

  const checkSuffix$1 = function (str) {
    let m = 'MaleAdjective';
    let f = 'FemaleAdjective';
    if (str.endsWith('o') || str.endsWith('i')) {
      return m
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
  var guessAdjGender = adjGender;

  const checkSuffix = function (str) {
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
  var guessAdjNumber = adjNumber;

  // 1st pass
  // import guessPlural from './3rd-pass/noun-plural.js'
  // import adjPlural from './3rd-pass/adj-plural.js'
  // import adjGender from './3rd-pass/adj-gender.js'
  // import verbForm from './3rd-pass/verb-form.js'


  // these methods don't care about word-neighbours
  const firstPass = function (terms, world) {
    for (let i = 0; i < terms.length; i += 1) {
      //  is it titlecased?
      let found = titleCase(terms, i, world);
      // try look-like rules
      found = found || checkRegex$1(terms, i, world);
      // turn '1993' into a year
      checkYear(terms, i, world);
    }
  };
  const secondPass = function (terms, world) {
    for (let i = 0; i < terms.length; i += 1) {
      let found = acronym(terms, i, world);
      found = found || suffixCheck$1(terms, i, world);
      // found = found || neighbours(terms, i, world)
      found = found || fallback$1(terms, i, world);
    }
  };

  const thirdPass = function (terms, world) {
    for (let i = 0; i < terms.length; i += 1) {
      guessNounGender(terms, i, world);
      guessNounNumber(terms, i, world);
      guessAdjGender(terms, i, world);
      guessAdjNumber(terms, i, world);
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
  var preTagger$1 = tagger;

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
    [/^#[a-zäöü0-9_\u00C0-\u00FF]{2,}$/i, 'HashTag'],

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
  const ref = 'Reflexive';
  const imp = 'Imperative';
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
      to: nn,
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
      ava: imp,
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
      ort: nn,
    },
    { // four-letter suffixes
      otto: val,
      nove: val,
      mila: val,

      arsi: ref,
      irsi: ref,
      ersi: ref,
      endo: g,
      ando: g,
      ante: jj,
      iere: nn,
      icci: nn,//or adj
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
      vitù: nn,
    },
    { // five-letter suffixes

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
      cesse: imp,
      vesse: imp,
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
      ility: nn,
    },
    {
      // six-letter suffixes
      cinque: val,
      andoci: g,//reflexive gerund
      endoci: g,
      endomi: g,
      icelli: nn,
      icelle: nn,
      erelli: nn,
      erelle: nn,
      grafia: nn,
      ellino: nn,
      itorio: nn,
      logico: jj,
    },
    {
      // seven-letter suffixes
      quattro: val,

      grafico: jj,
      ectomia: nn,
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
      preTagger: preTagger$1
    },
    model: {
      two: model
    },
    hooks: ['preTagger']
  };

  const postTagger$1 = function (doc) {
    doc.match('una [#Verb]', 0).tag('FemaleNoun', 'una-adj');
    doc.match('(un|uno) [#Verb]', 0).tag('MaleNoun', 'uno-adj');
    doc.match('(il|lo|i|gli|uno|la|le|una) [#Verb]', 0).tag('Noun', 'i-adj');
    // noun gender aggrement
    doc.match('(il|lo|i|gli|uno) [#Noun]', 0).tag('MaleNoun', 'm-noun');
    doc.match('(la|le|una) [#Noun]', 0).tag('FemaleNoun', 'f-noun');


    // Come ti chiami?
    doc.match('(mi|ti|si|ci|vi|si) #Verb').tag('Reflexive', 'si-verb');
    // non lavoro
    doc.match('non #Noun').tag('Verb', 'non-verb');
    // in the battle
    doc.match('nella [#Verb]', 0).tag('Noun', 'nella-verb');
    // al negozio
    doc.match('al [#FirstPerson]', 0).tag('Noun', 'al-verb');
    // i ginocchi
    doc.match('i [#Noun]', 0).tag('PluralNoun', 'i-plural');
    // 27° - '27th'
    doc.match('[#Value] °', 0).tag('Ordinal', 'number-ordinal');

    // auxiliary verbs
    // doc.match('[(abbia|abbiamo|abbiano|abbiate|avemmo|avesse|avessero|avessi|avessimo|aveste|avesti|avete|aveva|avevamo|avevano|avevate|avevo|avrà|avrai|avranno|avrebbe|avrei|avremmo|avremo|avreste|avresti|avrete|avrò|ebbe|ebbero|ebbi|ha|hai|hanno|ho)] #Verb', 0).tag('Auxiliary', 'aux-verb')
    // want to x
    // doc.match('[({volere}|{dovere})] #PresentTense', 0).tag('Auxiliary', 'want-aux')


  };
  var postTagger$2 = postTagger$1;

  var postTagger = {
    compute: {
      postTagger: postTagger$2
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
  var find$1 = findVerbs;

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
  var getAdverbs$1 = getAdverbs;

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

  const getRoot$2 = function (view) {
    view.compute('root');
    let str = view.text('root');
    return str
  };

  const parseVerb = function (view) {
    let vb = view.clone();
    // vb.contractions().expand()
    const root = getRoot$2(vb);
    let res = {
      root: root,
      prefix: vb.match('#Prefix'),
      adverbs: getAdverbs$1(vb, root),
      auxiliary: getAuxiliary(vb, root),
      negative: getNegative(vb),
      // phrasal: getPhrasal(root),
    };
    return res
  };
  var parseVerb$1 = parseVerb;

  // import getGrammar from './parse/grammar/index.js'
  // import { getTense } from './lib.js'

  const toArray = function (m) {
    if (!m || !m.isView) {
      return []
    }
    const opts = { normal: true, terms: false, text: false };
    return m.json(opts).map(s => s.normal)
  };

  const toText$2 = function (m) {
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
    let parsed = parseVerb$1(vb);
    vb = vb.clone().toView();
    // const info = getGrammar(vb, parsed)
    return {
      root: parsed.root,
      preAdverbs: toArray(parsed.adverbs.pre),
      postAdverbs: toArray(parsed.adverbs.post),
      auxiliary: toText$2(parsed.auxiliary),
      negative: parsed.negative.found,
      prefix: toText$2(parsed.prefix),
      infinitive: parsed.root,
      // grammar: info,
    }
  };
  var toJSON$1 = toJSON;

  // import getSubject from './parse/getSubject.js'
  // import getGrammar from './parse/grammar/index.js'
  // import toNegative from './conjugate/toNegative.js'
  // import debug from './debug.js'


  // return the nth elem of a doc
  const getNth$4 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  const api$8 = function (View) {
    class Verbs extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Verbs';
      }
      parse(n) {
        return getNth$4(this, n).map(parseVerb$1)
      }
      json(opts, n) {
        let m = getNth$4(this, n);
        let arr = m.map(vb => {
          let json = vb.toView().json(opts)[0] || {};
          json.verb = toJSON$1(vb);
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
        return getNth$4(this, n).map(vb => {
          let parsed = parseVerb$1(vb);
          let root = parsed.root || '';
          return {
            Infinitive: root,
            PastTense: m.toPast(root),
            PresentTense: m.toPresent(root),
            FutureTense: m.toFuture(root),
            Gerund: m.toGerund(root),
            Conditional: m.toConditional(root),
            PastParticiple: m.toPastParticiple(root),
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
      let vb = find$1(this);
      vb = getNth$4(vb, n);
      return new Verbs(this.document, vb.pointer)
    };
  };
  var api$9 = api$8;

  var verbs = {
    api: api$9,
  };

  const findNumbers = function (view) {
    let m = view.match('#Value+');
    //5-8
    m = m.splitAfter('#NumberRange');
    // june 5th 1999
    m = m.splitBefore('#Year');
    return m
  };
  var find = findNumbers;

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
  var tokenize$1 = tokenize;

  const fromText = function (terms) {
    let sum = 0;
    let carry = 0;
    let minus = false;
    // get proper word tokens
    let str = terms.reduce((h, t) => {
      h += t.normal || '';
      return h
    }, '');
    let tokens = tokenize$1(str);
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
  var fromText$1 = fromText;

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
      num = fromText$1(terms);
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
  var parse = parseNumber;

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
  var toText$1 = toText;

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

  var toTextOrdinal$1 = toTextOrdinal;

  const formatNumber = function (parsed, fmt) {
    if (fmt === 'TextOrdinal') {
      let words = toText$1(parsed.num);
      return toTextOrdinal$1(words)
    }
    if (fmt === 'TextCardinal') {
      return toText$1(parsed.num).join('')
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
  var format = formatNumber;

  // return the nth elem of a doc
  const getNth$3 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  const api$6 = function (View) {
    /**   */
    class Numbers extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Numbers';
      }
      parse(n) {
        return getNth$3(this, n).map(parse)
      }
      get(n) {
        return getNth$3(this, n).map(parse).map(o => o.num)
      }
      json(n) {
        let doc = getNth$3(this, n);
        return doc.map(p => {
          let json = p.toView().json(n)[0];
          let parsed = parse(p);
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
        m.forEach(val => {
          let obj = parse(val);
          if (obj.num === null) {
            return
          }
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          let str = format(obj, fmt);
          if (str) {
            val.replaceWith(str, { tags: true });
            val.tag('NumericValue');
          }
        });
        return this
      }
      /** convert to numeric form like 'eight' or 'eighth' */
      toText() {
        let m = this;
        let res = m.map(val => {
          if (val.has('#TextValue')) {
            return val
          }
          let obj = parse(val);
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          let str = format(obj, fmt);
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
          let obj = parse(val);
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#TextValue') ? 'TextCardinal' : 'Cardinal';
          let str = format(obj, fmt);
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
          let obj = parse(val);
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#TextValue') ? 'TextOrdinal' : 'Ordinal';
          let str = format(obj, fmt);
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
          let num = parse(val).num;
          return num === n
        })
      }
      /** return only numbers that are > n*/
      greaterThan(n) {
        return this.filter((val) => {
          let num = parse(val).num;
          return num > n
        })
      }
      /** return only numbers that are < n*/
      lessThan(n) {
        return this.filter((val) => {
          let num = parse(val).num;
          return num < n
        })
      }
      /** return only numbers > min and < max */
      between(min, max) {
        return this.filter((val) => {
          let num = parse(val).num;
          return num > min && num < max
        })
      }
      /** set these number to n */
      set(n) {
        if (n === undefined) {
          return this // don't bother
        }
        if (typeof n === 'string') {
          n = parse(n).num;
        }
        let m = this;
        let res = m.map((val) => {
          let obj = parse(val);
          obj.num = n;
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          if (val.has('#TextValue')) {
            fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          }
          let str = format(obj, fmt);
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
          n = parse(n).num;
        }
        let m = this;
        let res = m.map((val) => {
          let obj = parse(val);
          if (obj.num === null) {
            return val
          }
          obj.num += n;
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          if (obj.isText) {
            fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          }
          let str = format(obj, fmt);
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
      let m = find(this);
      m = getNth$3(m, n);
      return new Numbers(this.document, m.pointer)
    };
    // alias
    View.prototype.values = View.prototype.numbers;
  };
  var api$7 = api$6;

  var numbers = {
    api: api$7
  };

  const getNth$2 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  // get root form of adjective
  const getRoot$1 = function (m) {
    m.compute('root');
    let str = m.text('root');
    return str
  };

  const api$4 = function (View) {
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
  var api$5 = api$4;

  var adjectives = {
    api: api$5,
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

  const api$2 = function (View) {
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
  var api$3 = api$2;

  var nouns = {
    api: api$3,
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
  var api$1 = api;

  var contractions = {
    api: api$1,
  };

  nlp$1.plugin(tokenize$2);
  nlp$1.plugin(tagset);
  nlp$1.plugin(lexicon);
  nlp$1.plugin(preTagger);
  nlp$1.plugin(postTagger);
  nlp$1.plugin(verbs);
  nlp$1.plugin(numbers);
  nlp$1.plugin(adjectives);
  nlp$1.plugin(nouns);
  nlp$1.plugin(contractions);

  const it = function (txt, lex) {
    return nlp$1(txt, lex)
  };

  // copy constructor methods over
  Object.keys(nlp$1).forEach(k => {
    if (nlp$1.hasOwnProperty(k)) {
      it[k] = nlp$1[k];
    }
  });

  // this one is hidden
  Object.defineProperty(it, '_world', {
    value: nlp$1._world,
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
