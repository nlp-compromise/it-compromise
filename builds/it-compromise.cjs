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
  const expand$1 = function (m) {
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

  const prefix$1 = /^(under|over|mis|re|un|dis|semi|pre|post)-?/;
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
    if (prefix$1.test(word) === true) {
      let stem = word.replace(prefix$1, '');
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
  const expand = function (words) {
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
  var expandLexicon = expand;

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
    { word: `c'è`, out: ['ci', 'è'] },
    { word: `v'è`, out: ['vi', 'è'] },
    { word: `l'ho`, out: ['lo', 'ho'] },
    { word: `l'abbiamo`, out: ['la', 'abbiamo'] },
    { before: `dov`, out: ['dove'] },
    { before: `com`, out: ['come'] },
    { before: `l`, out: ['lo'] },//or la
    { before: `v`, out: ['vi'] },
    { before: `s`, out: ['si'] },
    { before: `m`, out: ['mi'] },
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
  var convert$1 = convert;

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
  var reverse$1 = reverse;

  const prefix = /^([0-9]+)/;

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
    let m = val.match(prefix);
    if (m === null) {
      return val
    }
    let num = Number(m[1]) || 0;
    let pre = key.substring(0, num);
    let full = pre + val.replace(prefix, '');
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
  var uncompress$1 = uncompress;

  // generated in ./lib/models
  var model$1 = {
    "nouns": {
      "plural": {
        "fwd": "1:s¦2:oio,rio,gio,bi,li,ni,hio,ai,fio,si,pio,bio,ti,sio,ei,ci,uio,mio,hi,ze,zi,gi,vi,di,fi,ui¦3:avio,ari,adio,stio,acio,ora,elio,ndio,rzio,rdio,iri,ucio,unio,rpe,alio,rnio,eri¦4:picio,uori,cilio,ranio,ricio,cidio,sodio,rocio,solio,cinio,monio,rolio,licio¦5:eficio,ciolio,rminio¦i:e¦m.:entimetro,illimetri¦1i:no,zo,so,ta,do,mo,bo,ma,vo,eo,po,ea,va,fa¦1hi:ca¦1s:u¦2i:nto,ulo,eto,oro,oto,sto,aro,uto,rro,ero,alo,ilo,uro,dro,bro,apa,ida,quo,iba,pro,urus,zza,ppa,rda,rza,lda,qua,ira,epa,oga,aga,ipa¦2hi:cco,sco,rco,uco,eco,ego¦2s:ho¦3i:atro,mico,nato,nico,mato,pico,etra,naco,atra,roco,tiro,fico,enda,arra,mbra,aura¦3e:arpa¦4hi:arico¦4i:giato,stico,llico,manda,ranza¦5i:ortico",
        "both": "1:ù,è,à,',v,j,c,w,k,f,z,p,n,y,h,x,b,d,t,l,m,g,r¦2:xi,ke,ae,ja,wi,ha,sa,ie,na,oa,ao,ka,aio¦3:hia,zia,nia,ula,pia,gia,ela,tia,mia,ape,oda,kle,eve,tle,poo,ezio,mba,bba,nce,zle,rse,ria,use,sia,dia,gle,loo,cia,oba,lla,lpe,uvio,ive,ise,cce,rcio,era,azio,gne,via,scio,ute,dge,ala,ncio,glio,ccio¦4:gola,cola,toia,sola,uila,pola,iola,tola,sage,pudio,ette,lace,erpa,vice,dozio,medio,voce,come,uche,rola,erre,pizio,unzio,anta,zine,gozio,itra,icro,nage,itre,mare,kage,mono,umbo,nizio,dizio,lizio,naso,viva,cizio,erra,nire,nguo,elta,base,erba,mizio,obra,tuno,nema,stra,vita,fila,rage,sedio,fizio,tizio,hivio¦5:llola,oglia,avola,uvola,lfare,aglia,abato,ttega,totto,eludio,testa,aosta,lennio,notte,antra,olago,vetri,iamme,rludio,palle,anata,iugno,nnaio,legge,stidio,otage,emble,rtita,iesse,emanio,icapo,phane,ificio,amine,olage,sturi,stare,stage,usilio¦5i:evanza,inanza,ultura,attura,ombato,emolio,villio,hiolio,eletro,uennio,ncipio,utonio,ivetto,urbato,ametro,epitio,rnetto,anetto,onetto,gnetto,rillio,ossolo,ometro,parago,nnetto¦5s:ogame,rtage,rtner,ligan,gster,adget,menco,ealer,llage,inero,arrio,lamme,onado¦5ini:eruomo¦5hi:lluogo,mbrico,pelago¦5es:ketch¦4i:igura,sanza,eanza,tanza,atura,canza,vanda,ffiro,binio,spolo,tanio,innio,olico,liato,allio,upolo,ziato,ettro,mpolo,onzio,mviro,riato,irico,tetto,morio,ipolo,ichio,ppolo,detto,retro,metto,uetto,ittto,miato,golio,erico,ibato,bonio,tolio,zetto,hiato,betto,urico,ltico,fetto,cetto,getto,ttico,setto,petto,itrio,ietto,letto,retto,hetto,guato¦4e:ianza¦4hi:alico,sloco,ssaco,atega,etico,elico,acaco,trico,iuoco,ilogo,alogo¦4s:nsor,ogan,eblo,rine,ware,lege,aire¦4ini:luomo¦3i:pada,dura,sura,enza,fato,fago,ublo,vvio,eato,eguo,molo,piro,blio,daco,aico,itro,sico,nvio,enio,ltro,maco,miro,pato,uolo,eolo,utto,nolo,gato,volo,giro,bolo,dato,usio,sato,zolo,stro,rolo,oato,folo,zato,dolo,ttio,lato,rato,colo,iolo,tato,tolo,ntro,golo,atto,iaco,itto,ddio,otto,cato¦3ies:uppy¦3igruppo:capogruppo¦3hi:fuga,vago,cico,pago,fogo,zico,iogo,gogo,lega¦3ei:midio¦3s:oit,yte,log¦3en:ssman,orman¦2i:tua,nga,pos,gro,zoo,rlo,gos,duo,clo,cro,lga,lto,elo,ogo,llo,rto,ito¦2era:lnus¦2hi:lgo,ngo,igo,lco,nco,rgo¦2en:wman,eman¦2s:nk¦2ora:rpus¦2a:uum¦2ireparto:aporeparto¦2icosca:apocosca¦1fondo:iofondo¦1i:ko,fo¦1iservizio:poservizio¦1ipattuglia:popattuglia¦1ifamiglia:pofamiglia¦1iclan:poclan¦1ifondi:sofondo¦l.:umi¦idanza:odanza¦icrociati:ocrociato¦iviri:oviro¦iufficio:oufficio¦istruttura:ostruttura¦isquadra:osquadra¦iscuola:oscuola¦ipopolo:opopolo¦imafia:omafia¦igabinetto:ogabinetto¦idelegazione:odelegazione¦icorrente:ocorrente¦ibanda:obanda",
        "rev": "1:ts,rs,bs,ms¦2:mo,ta,us,no,ga,ue,ges,ss,nos,go,mes,as,is,co,ge,ro,re,le,se,bo,ma,zo,me,nes,ios,ads,ce,oo¦3:uto,ada,ues,sai,aos,odo,ndos,idos,rdo,ste,aze,ate,ato,lio,chos,nto,enus,fti,zza,sos,gua,zze,pli,mos,tsi,lles¦4:solo,kini,tora,asei,endo,raio,ures,kiri,eans,ggio,ales,rcos,otes,iches,thos,iavi,vers,ccio,cores,ilos,lcio,avai,ntes,lisi¦5:vieni,fuori,vanti,vanni,eglia,mondo,mares,aurti,fogli,murai,tetto,tisei,iados,gnosi,otesi¦ostazione:istazione¦1o:ii¦2o:zzi,ssi,smi,rdi,bbi,lbi,tmi,evi,rni,vei,usi,rpi,oghi,ovi,gni,bei,achi,lzi,mei,api,rsi,mpi,rvi,spi,cei,rgi,ppi,lpi,fei,tei,ochi,ebi,lmi,obi,lsi¦2e:ori,oni,cmi,ali,roi,esi,boi¦2a:sti,mmi,gmi,rte¦3o:aini,enti,toi,muli,rini,nimi,lani,nini,ggi,lini,tini,meti,iuti,beri,iani,nani,sivi,tivi,tipi,gani,rivi,sini,unti,enei,buti,reni,visi,cani,cini,bini,hini,tavi,simi,uini,tani,urri,imbi,heri,onni,zini,vidi,rodi,duti,lci,feri,abri,anni,arri,meni,edri,hili,iodi,egi,fili,irchi,guli,meri,fani,audi,ombi,sani,gedi,sumi,pesi,pechi,pini,doi,unei,nuti,ieghi,rupi,izi,vani,uomi,nuchi,bbri,igi,auni,erri,eudi,ropi,fori,arbi,anei,ilei,buli,embi,ridi,uadi,peti,cavi,cisi,tuti,moti,olei,todi,duli,orbi,usei,seni,clei,eani,veti,undi,vuli,nsti,yani,lichi,lipi,arzi,duni,soi,onsi,futi,culi,seti,erzi,gari,luri,nodi,veni,oldi,suti,cuti,rechi,uali,onzi,buri,divi,voti,pani,rnei,buni,livi,gomi,cuni¦3e:anti,ieri,luci,eari,podi,rili,zeni,tumi,lidi,nili,ceri,eadi,pami,cimi,lavi,iugi,tili,suli,nami,iumi,dici,vami,iemi,gumi,heni,uami,gimi,bici,esci,sepi,gili,pedi,eami,lumi,dili,uaci,oidi,raci,nqui,hidi¦3a:temi,iomi,geti,limi,ioti,loti,somi,demi,lemi,zimi,duchi,fomi,oemi,feti,euti,hemi,ribi,remi,aumi,arche,blei,roti,techi,michi,rimi,repi,rogi,ngui,sichi,irmi,nichi¦4o:buoni,ndini,uari,dagi,ffidi,reschi,gosti,abeti,lunni,acidi,uleti,ddoti,idoti,pasti,ratri,aleni,madi,rredi,anati,scari,amani,ggini,sensi,tacchi,dromi,parchi,lsami,lischi,becchi,busti,amini,vacchi,vetti,ricchi,ufali,gusti,amari,dari,netti,onati,nguri,omici,saldi,pperi,apri,rmati,arani,mbali,tnici,scuri,indri,ofoni,bacchi,maschi,odini,pensi,mputi,adini,nubi,tagi,bandi,esodi,orani,edini,sacchi,umini,ttari,rucchi,ugini,urari,ecori,gradi,lfini,sagi,epoli,neschi,sesti,turbi,vari,vieti,ruidi,oqui,pirei,igoni,iteti,oneri,opri,ogeni,risei,iaschi,mondi,iocchi,lauti,manzi,tuoni,tteti,guari,nasi,tondi,cosi,rnati,uanti,aderi,mperi,censi,iuci,ncubi,dugi,tuni,arsi,onaci,otami,tinti,rinti,necchi,tuani,giari,liari,inati,anici,ubri,randi,andri,afoni,hermi,grani,nischi,zadri,prani,areti,ldavi,luschi,fraghi,sposi,oleti,austi,ogini,equi,enici,mbari,adisi,rroci,ccari,tugi,etali,anori,lagi,odori,secchi,upari,conti,efoni,mendi,psodi,egali,tauri,iarmi,icami,hiami,forzi,iposi,acqui,itiri,atiri,birri,cacchi,eicchi,gugi,ibili,ntomi,macchi,offi,ldini,rrisi,fugi,tadi,tormi,tupri,oceri,marchi,cnici,iandi,emici,eatri,pieni,esori,imbri,oreri,neini,monti,avasi,chechi,opici,suoni,eleni,iveri,aceti,rnadi¦4e:denti,obili,grumi,larmi,ltari,ienti,travi,lesti,gneri,ipoti,aviti,alici,eonti,nensi,scami,eteri,trami,rtami,spiti,omani,gnomi,ageni,nfini,oteri,ttami,venni,imini,liami,darmi,eneri,biuli,agini,egami,etami,imiti,nenti,renti,ffari,rgini,rtiri,donti,oriti,iliti,zonti,tobri,areri,zenti,ileni,llami,imati,nsoli,ipiti,esami,uderi,rdoti,ciami,ederi,penti,nteri,ccubi,uenni,eenni,nenni,rnaci,arici,ddomi,ciari,rnici,latti,igini,plati¦4a:lgami,nauti,tleti,inomi,spoti,plomi,lasmi,steti,tasmi,bromi,enomi,rarchi,ucomi,rasmi,ofiti,iatri,garchi,dermi,orami,iarchi,giami,grami,permi,tezzi,oneti,natri,tturi,tarri,rditi,tecchi,tradi,ialdi,nturi,iendi,amati,licchi,sputi,hezzi,atichi,atati,rtati,formi,vatti,ttichi¦5o:rigeni,ccenni,quisti,ffondi,gravi,mbicchi,anacchi,imetri,mmicchi,rresti,atari,erischi,tracchi,uguri,utunni,urieri,lcanti,iciati,ecari,enari,gatari,viari,limici,acicchi,aimani,alibri,ammini,osanti,anneti,lavori,arrubi,atasti,rapici,hioschi,frari,imeli,nemini,otteri,onnati,onari,pendi,imari,ncili,ondoni,nfonti,sorzi,trasti,ocanti,rimani,ecreti,eliri,frici,eposti,ideri,uteri,asteri,lomati,avanzi,sguidi,nsari,irambi,idendi,icili,ccidi,ncomi,isodi,taffi,sempi,sordi,lsari,ilmini,ulari,asari,somini,ocidi,erani,rigori,scopi,raffi,mbarchi,esari,ncanti,ncesti,zzari,icidi,cambi,erari,osari,vrieri,ogori,unari,ordomi,icomi,rsupi,rcuri,allari,ondri,ossidi,etari,fragi,grieri,ocomi,sigeni,zinari,ninari,paveri,strani,ocini,nsieri,erdoni,troli,toleri,linici,osteri,etesti,lemini,rofumi,ostici,verbi,llmini,lateri,doppi,fronti,usori,uiari,coveri,imandi,patri,inghi,ntocchi,iserbi,istori,crari,alari,blocchi,andali,hianti,ioperi,coppi,udieri,mitoni,tenni,uciati,lenzi,abari,temini,oboschi,erperi,ococchi,burbi,ismani,arocchi,utari,orchi,affici,elari,tiari,odischi,illici,ciglia¦5e:ergeni,nuensi,tigeni,ttenti,stiami,alessi,senati,icenti,igenti,rateri,eressi,agnati,esseri,astici,cenati,ertici,vembri,uraghi,refici,cecani,tefici,tanomi,agenti,etenti,litari,mestri,annomi,ulenti,rtesti,utenti,ppiedi,sconti,ntrati,ussari¦5a:matomi,lanomi,politi,onarchi,vociti,ianeti,arotti,llezzi,rrozzi,bbrichi,esciti,oranzi,cletti,urezzi,enditi,anzati,fferti,dinati,istichi,nfitti,pronti,eranzi,rativi,ecluti,iservi,ittimi¦5us:esauri",
        "ex": "2:do,ko,no,re,ds¦3:cda,ego,ozio,via,zoo,zia,agio,pci,pds,psi,sci,sos,qui¦4:auto,boia,conio,euro,file,lama,mega,micio,patio,podio,puma,rave,socio,tizio,vice,vizio,astio,atrio,bacio,cesio,cuoio,fans,nazi,oggi,palio,sari,sufi,dati,ieri,vivi,pari¦5:calcio,cargo,frigo,marzo,metro,mille,panda,promo,rambo,ulema,alibi,avorio,cambio,cappio,cranio,diario,elogio,erario,frocio,occhio,tornio,trans,venti,zombi,tutti,crisi¦6:assolo,biennio,gazebo,idillio,luglio,maggio,ufficio,figlia,scuola,cerchio,cilicio,cocchio,domani,emporio,fischio,gasolio,marchio,mucchio,muschio,ossario,pressi,raschio,rischio,safari,secchio,sicario,silicio,sipario,teschio,bovini¦7:cottage,decennio,dissidio,epinicio,memento,quattro,servizio,silenzio,triennio,griglia,auspicio,batterio,criterio,crocchio,divorzio,epitelio,granchio,incendio,incrocio,obitorio,orecchio,orologio,ralenti,simposio,specchio,spicchio,gemelli¦8:barbecue,didietro,febbraio,intralcio,monopolio,ventennio,famiglia,maniglia,adulterio,auditorio,beneficio,brindisi,coperchio,equlibrio,finocchio,ginocchio,glossario,juniores,maleficio,malocchio,municipio,nevischio,obbrobrio,papocchio,pidocchio,primordio,putiferio,ranocchio,risparmio,risucchio,seminario,sterminio,vaticinio,vituperio,contanti¦9:apripista,baciamano,capolista,capoluogo,colabrodo,crescendo,drugstore,giramondo,lettorato,megastore,oligopolio,ottocento,predominio,bottiglia,avversario,battimani,corollario,crematorio,crocicchio,cronicario,debitucci,dignitario,dormitorio,equilibrio,improperio,inventario,lucernario,matrimonio,mattocchio,mercimonio,necrologio,notiziario,pandemonio,paraocchi,participio,patrimonio,pennacchio,purgatorio,refettorio,repertorio,repulisti,ricettario,sgocciolio,squilibrio,territorio,tirapiedi¦10:capogruppo,capufficio,coprifuoco,disservizio,fondovalle,fuoribordo,fuorigioco,marcantonio,monovolume,parabrezza,parapiglia,retrotreno,senzatetto,settecento,totocalcio,meraviglia,alimentari,ambulatorio,apparecchio,brefotrofio,colluttorio,commentario,commissario,consultorio,depositario,epistolario,falansterio,giradischi,laboratorio,macchinario,pastrocchio,pateracchio,presbiterio,promontorio,robivecchi,saliscendi,semicerchio,spauracchio,vocabolario¦11:bagnasciuga,battistrada,dormiveglia,fuoriclasse,guardacoste,guastafeste,perdigiorno,quarantennio,settantennio,sfollagente,anniversario,armamentario,comprensorio,governicchio,lanciarazzi,mangiapreti,orfanatrofio,orfanotrofio,osservatorio,parabancario,portapacchi,riequilibrio,scarabocchio¦12:quattrocento,disequilibrio,lustrascarpe,montacarichi,portabagagli¦13:lanciagranate,lasciapassare,rompighiaccio,scioglilingua,alzacristalli,guardasigilli¦14:antiterrorismo,poliambulatorio,vicecommissario¦15:contachilometri,antinfiammatorio,antiparassitario,spaventapasseri,strizzacervelli¦2hi:ago,eco,oca¦8i:altimetro,associato,caminetto,colloquio,cuginetto,discepolo,gabinetto,gorgoglio,perimetro,rubinetto,scrutinio,settennio,struttura,avventura,abbandono,ammontare,astronomo,autocrate,avamposto,burocrate,campanaro,carattere,carnefice,condomino,destriero,disordine,frangente,israelita,latifondo,magistero,metronomo,ministero,nocchiero,pesticida,posticipo,ravennate,ricordino,settembre,tassinaro,trapianto,sigaretta,debolezza,dinosauro,abitudine,etichetta¦6hi:apologo,prologo,allocco,alterco,balocco,impacco,ritocco,seracco,ricerca¦9i:assassinio,clarinetto,condominio,cuscinetto,giovinetto,millimetro,parlatorio,scandaglio,scintillio,sfiduciato,tachimetro,trentennio,autostrada,biliardino,caseggiato,cataclisma,conversare,detergente,forestiero,gastronomo,interprete,kilogrammo,masnadiero,metabolita,mezzofondo,panchinaro,pianoforte,rimprovero,settennato,sottofondo,tangentaro,tecnocrate,vacanziero,rientranza,tonnellata¦5s:asset,peone,ratio,score,stage¦3hi:baco,caco,fico,lago,logo,rogo,sugo,arco,buco,duca,muco,orco,anca¦7s:battage,manager¦10i:beneficiato,giardinetto,parchimetro,quadriennio,tavolinetto,trovarobato,condottiero,contropiede,contrordine,marciapiede,molleggiato,parafulmine,presupposto,rinoceronte,telecomando,alternativa,aspettativa,passeggiata¦4i:bivio,detto,fiato,getto,iodio,petto,retro,setto,sodio,tedio,tetto,vetro,vocio,birra,abate,abete,acaro,apice,aroma,asilo,atomo,avere,bando,baule,brano,busto,canto,cenno,censo,cesto,cloro,colle,conte,costo,dente,erede,esame,esodo,fasto,fieno,fondo,frate,fusto,gambo,germe,gesto,gnomo,grado,grano,greto,grumo,gusto,latte,libro,mambo,manto,manzo,marmo,miele,monte,mosto,nuoto,omino,onere,padre,pasto,piede,poeta,ponte,porro,prete,resto,scalo,scopo,scudo,senno,senso,serbo,siero,sisma,sparo,sposo,sputo,suono,tasto,teste,trono,tuono,utero,vanto,verbo,verme,sfida,tenda,morte,porta,prova,mappa,carne,notte,trama,corda,ombra,forma,pelle,fonte,forza,torre,retta,acqua,corte,croce,carta,tazza,guida,dieta,stima,multa,paura,stiva,linea,legge,lente,pinta,quota,fetta,punta,ruota¦9s:bookmaker,campesino,container,supporter¦7i:brevetto,chirurgo,duopolio,ludibrio,presidio,sussidio,zainetto,acrobata,aforisma,agronomo,anticipo,aruspice,baritono,bonifico,cadavere,cimitero,clistere,complice,dicembre,espianto,focolare,geometra,giardino,girasole,impianto,indovino,loggiato,luminare,lupanare,monolite,nonsense,oroscopo,ossimoro,parmense,proclama,protesto,recupero,ricupero,riordino,riquadro,schemino,scorporo,sentiero,sergente,servente,titolare,insalata,condotta,rotolare¦3i:brio,dolo,etto,fato,giro,lato,mago,molo,nolo,odio,olio,polo,tiro,trio,volo,paio,cura,fuga,erba,lega,onda,anno,asse,baro,bene,calo,cane,caso,cero,ceto,cibo,coma,coro,cubo,culo,dado,doge,dono,ente,faro,feto,filo,foro,fumo,gene,goto,inno,lido,lino,lodo,lume,lupo,mare,maso,mimo,modo,moto,mulo,muro,naso,nodo,nome,nume,oste,otre,pane,papa,pene,pepe,pero,peso,peto,pino,pomo,poro,pube,pupo,ramo,remo,rene,riso,seme,seno,sole,tema,tino,tomo,tono,topo,toro,tubo,vaso,vate,veto,vino,viso,voce,voto,base,mano,vita,rete,pace,foto,nave,area,mira,idea,luce,leva,nota,noce,paga,pipa,fase,cose,riva,cima,sede,arma¦6s:broker,charme,hacker,studio¦2oi:bue¦3istazione:capostazione¦6i:cavetto,dominio,fruscio,squadra,rottura,bisonte,borsaro,buttero,cardine,carisma,castoro,cognato,comando,compare,culmine,dattero,diacono,disarmo,dollaro,eremita,fulmine,giubilo,glicine,innesto,maniero,mistero,patrono,pettine,pollice,polline,portico,pronome,provino,pulmino,reclamo,rincaro,scialle,scolaro,sofisma,tendine,termine,turbine,vigneto,vortice,nascita,testata,rivolta,domanda,tariffa¦12i:cinquantennio,xenotrapianto¦4s:club,film,game,list¦8s:commando,computer,pastiche,reporter,skinhead,squatter,teenager¦4hi:cuoco,drago,fuoco,gioco,luogo,plico,becco,bosco,bruco,casco,desco,disco,pacco,picco,sacco,succo,tacco,varco,bocca,tasca,vasca,pesca,mosca¦1ei:dio¦12s:desaparecido¦2i:duo,oro,zio,ala,pro,ano,avo,evo,neo,uno,ape¦5i:esilio,leggio,ovetto,pendio,popolo,prozio,strada,lingua,alloro,altero,asceta,attimo,automa,avanzo,bavero,bolero,budino,camice,cateto,colono,crisma,cristo,danaro,dedalo,denaro,dinaro,domino,dovere,essere,estimo,fluoro,fodero,fronte,fucile,grammo,gregge,lavoro,membro,miasma,ordine,ossido,papero,picaro,podere,pranzo,prisma,riparo,salame,saluto,sapere,scialo,scisma,senato,sfondo,talamo,temine,ussaro,utente,ventre,volere,svolta,classe,durata,flotta,pietra,estate,valuta,visita¦11i:guazzabuglio,quindicennio,contrafforte,contribuente,festivaliero,guerrigliero,lungodegente,megaimpianto,nullafacente,partitocrate,petrodollaro,progestinico,radiocomando,superdollaro,ventiseienne¦1m.:kilometro,centimetro,millimetri¦7hi:monologo,naufrago,acciacco,incarico,ricarico,scirocco,politica¦3ini:uomo¦10s:vaudeville¦9hi:videogioco,reincarico¦4e:torta¦4he:barca¦11a:sopracciglio¦13i:infrastruttura,superburocrate,superministero,consapevolezza¦5hi:blocco,bracco,brocco,chicco,gnocco,sbarco,sbocco,spacco,giacca,carica¦15i:europarlamentare¦8hi:rammarico,discarica¦5e:scarpa"
      }
    },
    "adjectives": {
      "fs": {
        "fwd": "1:a,'¦2rice:itore",
        "both": "1:m,w,d,x,y,h,c,v,u,t,g,k,s,i,l,r,n,e¦2:ff,zz¦3:elo,smo¦4:uomo,ndio,olio,rteo,rolo,ggio¦5:lusso,ddito,opero,ebito,mento,borto¦5':alcun¦3e:stio¦2rice:ttore,etore,atore¦a:o",
        "rev": "1:o¦2:ya,t'¦3:gma,rca,uma¦4:beta,ssia,onna,afia,orma,ezza,anga,rota,iota,vita,ppia,opra¦5:uista,razia,nista,oista,rista,lista,sista,ccita,amita,icida,xista,zista,bella,bista,eista,dista,tista,emita,terra,kista¦3ore:ritrice,titrice¦4ore:onitrice",
        "ex": "4:ocra,spia¦5:sotto,oliva¦6:orsono¦7:apposta,dalmata,sannita¦8:maronita¦9:anticarro,antivento,antidroga,dirigista,intimista¦10:antimostro,antiscasso,antinebbia,antiulcera,antivipera,consumista,contraerea,eteroclita,khatamista¦11:antiscalata,cosmopolita,semplicista¦12:legittimista,qualsivoglia¦13:anticongresso,antisindacato,collettivista¦14:anticonsumista,antiguerriglia,superottimista¦15:clericofascista¦17:antinfortunistico¦19:antidannunzianesimo"
      },
      "mp": {
        "fwd": "1:i¦2:cio,pio,mio,zio,bio,nio,hio,vio,fio,sio¦3:ario,erio,prio,trio¦4:purio¦5:ttorio,itorio¦i:e,o¦1i:ta,da,ea",
        "both": "1:',m,f,w,z,d,y,c,h,v,x,u,t,g,s,k,l,r,n¦2:va,ca,ya,oio,la,aio,ga,ra,za,na,ma,he,ia¦3:glio,ape,que,ogio,edio,use,ugio,igio,elo,smo¦4:fare,vita,sorio,osta,uomo,cita,lata,ndio,olio,rteo,rolo,ggio¦5:ntorio,crime,ltorio,rsono,nline,otorio,ddito,utorio,tione,opero,ggine,ostro,sione,ebito,clone,mento,borto¦3hi:ioco¦2hi:cco,sco,nco¦1hi:go",
        "rev": "1:o,e,a¦2:ki,xi¦4:trui,poli,misi,anzi,pari,oldi,iasi,uori¦5:ebiti¦1o:vi,ci,si,bi,ni,ei,mi¦2e:nti,ili,ali,lci,umi,ipi¦2o:uti,tti,ati,uli,iti,fri,gri,zzi,rfi,rti,lli,lti,eri,ndi,ffi,eti,rri,cui,spi,udi,uri,qui,tui,dri,pli,ochi,pui,lui,tii,lzi,odi,ufi¦3e:ormi,voli,lari,edui,nesi,iori,oidi,roci,hesi,riri,ngui,coni,paci,ebri,enni,maci,deli,neri,caci,moni,vesi,laci,gaci,erii,erdi,mori,lori,ubri,ievi,uaci,ioni,iopi,loni,beni,coci,soli,oavi,desi,loci,vaci¦3o:nci,coli,gidi,cci,fili,mpi,usti,nnui,noli,rdui,ridi,spri,inti,vari,ardi,osti,oari,radi,didi,izi,esti,uoli,grui,sci,igui,pidi,inui,bbri,vidi,tidi,vori,moti,bbi,fidi,dori,aidi,gori,abri,rzi,bidi,goti,ladi,uvi,ropi,egi,nfi,ioli,azi,evri,uoti,mbri,aldi,lidi,uidi,oppi,midi,orii,asti,eppi¦3a:isti,roti,ioti¦4o:efali,iunti,omali,tari,rari,temi,astri,sunti,anori,uari,fari,punti,inzi,funti,bordi,opri,genui,apori,cari,dari,sari,uvoli,atri,ncidi,ronzi,seri,munti,mari,rchi,scidi¦4e:lacri,estri,egesi,liari,eresi,neari,ssoni,olesi,aresi,rensi,censi,cordi,ttoni,plici,etori,ifoni,ovini,ustri,mmuni,clini,nermi,spiti,unari,mbari,rdaci,alesi,troni,clivi,utesi,eraci¦4a:abeti,lmati,icidi,amiti,nniti¦5o:franti,onari,ssidui,viari,nvisti,biari,seari,ziari,eteri,ciari,ulenti,gnari,mmisti,pronti,ntenti,lvisti,niari,enari,evisti,vvisti¦5e:lomani,polidi,finari,ivalvi,apresi,elesti,cleari,lanari,ortesi,uanimi,mbelli,uttori,ulsori,guensi,amensi,nitori,vinari,lanimi,attori,itensi,grandi,allesi,ergini¦5a:raerei,ocliti,roniti",
        "ex": "4:blue,live,regio,ionio,midi,ogni,pario,serio,vario¦5:sotto,esimio,previo,spurio,viario,yuppi¦6:avanti,oleario,sudicio,vanesio¦7:amatorio,fradicio,littorio,urinario¦8:aleatorio,dilatorio,minatorio,moratorio,natatorio,rogatorio,rotatorio,sciatorio,senatorio,venatorio,culinario,meritorio,molitorio,ordinario,parecchio¦9:adulatorio,anticarro,antivento,dittatorio,espiatorio,operatorio,probatorio,trimotore,vessatorio,campanario,cartolario,inibitorio,pontificio,primigenio,proditorio¦10:accusatorio,antidolore,antiscasso,depuratorio,derogatorio,divagatorio,divinatorio,emigratorio,gladiatorio,indagatorio,liberatorio,navigatorio,ondulatorio,revocatorio,superlusso,sfottitorio,transitorio¦11:antimissile,canzonatorio,circolatorio,combinatorio,cospiratorio,declamatorio,denigratorio,diffamatorio,immigratorio,liquidatorio,obbligatorio,preparatorio,provocatorio,respiratorio,antimissili,inquisitorio¦12:allucinatorio,anticipatorio,antinucleare,consacratorio,deregolatorio,dissacratorio,infiammatorio,intimidatorio,sanzionatorio,straordinario¦13:anticongresso,antisindacato,autorizzatorio,mistificatorio,lanciamissili¦14:anticonsumista,antiproiettile,autoesaltatorio,discriminatorio,anticonsumisti,antiproiettili,contraddittorio¦16:antidiffamazione¦17:antilottizzazione,antinfortunistico,autogratificatorio,cardiocircolatorio¦18:anticoncentrazione,autocongratulatorio,autoidentificatorio¦19:antidannunzianesimo¦3hi:poco¦11i:accentratore,annientatore,compensatore,concertatore,conciliatore,confortatore,disciplinare,disgregatore,divisioniste,fallimentare,modificatore,movimentiste,precorritore,propiziatore,purificatore,sovvertitore,vivificatore¦3i:acre,diro,dopo,malo,miro,mite,noto,rado,solo,usto¦13i:agroalimentare,autocondannare,chiarificatore,distruggitrice,riconciliatore,sterilizzatore¦9i:alimentare,comunicate,dilatatore,disattento,elementare,incitatore,placentare,sacrosanto,sonnolento,sottovento¦10i:altrettanto,ausiliatore,commutatore,consolatore,cosmopolita,eliminatore,fraudolento,giudicatore,ingannatore,livellatore,suscitatore,unificatore¦5i:arcade,celere,chiaro,felice,inerte,mutilo,pronto,quanto,semita,spento¦7i:benevolo,irruento,malevolo,marinaro,rampanto,salutare,urlatore,violento¦6i:birbone,cotanto,cruento,inferme,mannaro,oratoro,redento,rivisto,unanime¦4i:breve,ebete,grave,greve,italo,lordo,macro,sacro,tanto,tenue,zuppo¦8i:collinare,incruento,irredento,macilento,migratore,milionare,precipite¦12i:deregolatrice,equilibratore,interrogatore,regolamentare,sanguinolento¦16i:interdisciplinare,interparlamentare"
      }
    },
    "presentTense": {
      "first": {
        "fwd": "o:are,ere,apere¦lgo:gliere¦esco:uscire¦1co:urre¦1io:arere¦1sso:otere¦1o:vire¦1glio:olere¦2go:enire,enere,alere,anere¦2sco:fire¦2o:guire,prire,frire¦2cio:acere¦3o:ucire,ertire¦4o:borrire,sentire",
        "both": "5sco:ientire,mentire,tontire,gantire,ircuire,rostire,lestire,dolcire¦5o:ipartire¦4sco:ortire,ustire,istire,oquire,sprire,astire,ermire,arrire,inuire,iarire,rguire,nnuire¦4o:vestire,fuggire,bollire¦4go:isalire,ssalire¦4co:ledire¦3sco:agire,grire,ltire,ncire,atire,trire,etire,gnire,ocire,urire,rnire,emire,ruire,rcire,tuire,luire,orire,unire,buire,inire,ttire,erire,anire,utire,onire¦3o:mpire¦3co:ddire¦2uco:anicare¦2sco:eire,oire,pire,zire,hire,sire,bire,dire,lire¦2io:parire¦1ggo:arre¦1ngo:orre",
        "rev": "are:ò¦1are:no,fo,ro,zo,so,po,mo,bo,eo¦1re:isco¦1uscire:iesco¦1gliere:elgo¦2are:aco,lio,olo,cco,cio,ito,ogo,eco,nto,eto,ato,ulo,hio,bio,ilo,oco,avo,gio,ago,ego,vio,tio,uto,fio,oto,rio,ugo,lto,dio,nuo,tuo,elo,mio,rlo,alo,nio,pto,lco,ovo,plo,zio,sio,blo,cuo,ddo,duo,uio,ldo¦2ere:rgo,lvo¦2gliere:iolgo,tolgo,colgo¦2mettere:asetto¦3are:baio,bico,itto,ppio,allo,ello,osto,otto,tico,fido,mico,levo,erco,fico,nido,noio,cico,orto,pico,illo,sodo,ordo,ardo,rico,zico,ruco,usco,utto,dido,tigo,iodo,vigo,audo,lico,gedo,nsto,opio,ullo,nudo,asto,sico,enco,spio,irto,nico,usto,uido,buco,arco,modo,uaio,bido,pido,anco,tivo,squo,ipio,vico,cquo,onco,livo,hedo,raio,nodo,rpio¦3rre:bduco,dduco,educo,oduco¦3ere:endo,ungo,cedo,rivo,ingo,inco,iedo,osco,ludo,peto,tengo,eggo,ompo,iggo,cado,nquo,iudo,cuto,erdo,vido,valgo,sigo,rudo,vado,bevo,undo,mango,digo,cevo¦3ire:vengo,apro¦3re:rdico,idico¦4ere:batto,brado,corro,metto,rrido,sisto,ssumo,torco,volgo,lango,ncido,iango,cerno,pondo,resco,ecido,erido,iligo,irimo,ruggo,pando,primo,gligo,ccido,suado,nasco,edimo,cindo,iardo,fulgo,ivivo,combo,premo,trido¦4are:bdico,cetto,uisto,deguo,fetto,hindo,largo,lerto,lungo,prodo,besco,rredo,rrivo,petto,sesto,visto,betto,lindo,rindo,pesto,uetto,mendo,servo,tatto,ratto,mando,testo,iredo,eredo,serto,retto,nesto,udico,bosco,patto,collo,fango,forco,gorgo,nesco,tasco,alido,singo,festo,ndico,lesto,bligo,oetto,ietto,adico,catto,desto,getto,pesco,aetto,bando,carto,rollo,follo,grido,porco,uarto,rinco,bondo¦4rre:onduco,raduco¦4ire:seguo,verto,copro¦4re:cucio¦5are:ccerto,llatto,anetto,pparto,rresto,otondo,econdo,rcondo,nfisco,epredo,ileguo,sdetto,chetto,presto,anduco,redico,omulgo,tristo,imesto,pinguo,prango,uicido¦5ere:frango,nedico,ollido,nnetto,tinguo,orrodo,spello,ndulgo,nfondo,scondo,resumo,epello,fletto,sfondo¦5ire:ssento,ssorbo,isento",
        "ex": "ho:avere¦odo:udire¦esco:uscire¦sono:essere¦3sco:agire,unire¦9sco:appesantire¦2vo:bere¦2co:dire¦4o:dormire,fuggire,mentire,partire,sentire,vestire,battere,bendare,bollare,brigare,cascare,cernere,cherere,coprire,correre,credere,cucire,curvare,destare,dettare,distare,educare,elidere,eredare,erigere,erodere,fervere,follare,fondare,fottere,fremere,frodare,fulgere,gettare,gradare,gridare,guadare,lattare,listare,mandare,mattare,mescere,mestare,mettere,mietere,mollare,mondare,mordere,nascere,nettare,offrire,pascere,pescare,pestare,predare,premere,privare,purgare,restare,salvare,seguire,servire,sondare,tangere,tessere,torcere,vangare,vergare,vertere,vistare,volgere¦5sco:gestire,guarire,muggire,ruggire,sparire¦7sco:impartire¦7co:interdire¦4sco:lenire¦1uoio:morire¦8o:riassorbire,consolidare,dissanguare,sprofondare¦3ò:ridare¦4co:ridire,indurre¦4ò:ristare¦3go:salire,tenere,valere,venire¦6sco:spartire¦8etto:teletrasmettere¦5o:aborrire,adattare,adescare,assidere,avvivare,caducare,chierere,dedicare,desumere,dirigere,flettere,frangere,inondare,irrigare,languire,medicare,ossidare,prestare,riducere,sbrigare,schivare,scuoiare,sfondare,sfottere,smistare,soffrire,stangare¦9o:acconsentire,affaccendare,sopravvivere¦6o:affondare,allettare,arringare,convivere,dilettare,divulgare,effondere,estollere,incurvare,ravvivare,resettare,ricredere,rifondare,rimordere,trucidare¦7o:affrescare,concertare,consentire,diffondere,profondere,propellere¦2o:alare,stare¦3o:algere,aprire,ardere,badare,bucare,cadere,cedere,ducere,fidare,gemere,godere,ledere,levare,licere,lodare,mudare,ondare,ostare,radere,redare,ridere,rigare,risapere,rodare,sedare,spiare,sudare,sumere,temere,ungere,urtare,vivere¦2lgo:cogliere,togliere¦1o:dare,sapere¦2io:parere¦4cio:piacere¦2sso:potere¦2glio:solere,volere¦3io:sparere"
      },
      "second": {
        "fwd": "1:iare,iere¦2:vire¦3:prire,ucire,mpire,guire,frire¦4:orrire,ertire,ormire¦5:sentire,pparire,mparire¦i:ere¦ieni:enire,enere¦esci:uscire¦uoi:otere¦1i:nare,uare,pare,lare,dare,mare,vare,bare,fare,arre,apere¦1ci:urre¦1ni:orre¦3sci:trire",
        "both": "5:isalire,fuggire,bollire,vestire,sparire,ssalire¦5etti:etrasmettere¦5sci:ientire,mentire,ircuire,lestire¦5i:tostare¦5ci:terdire¦4ci:ledire¦4sci:ustire,istire,oquire,sprire,astire,ermire,arrire,iarire,ortire,ostire,antire,olcire¦3sci:grire,ltire,ncire,atire,agire,ruire,etire,gnire,ocire,urire,rnire,emire,rcire,nuire,tuire,luire,orire,unire,buire,inire,ttire,erire,anire,utire,onire¦3i:esiare¦3ci:ddire¦2uchi:anicare¦2sci:eire,oire,pire,zire,hire,sire,fire,bire,dire,lire¦1i:eare,sare,zare,tare,rare¦1hi:gare,care",
        "rev": "olere:uoli¦1enire:vieni¦1re:isci¦1enere:tieni¦1are:ii¦1uscire:iesci¦2are:ini,gni,tui,ami,uni,uli,nni,avi,rbi,eli,ovi,rmi,epi,nui,rli,lmi,ibi,ipi,afi,api,ubi,lpi,smi,cui,ofi,ddi,spi,dui,obi,upi,ldi,tmi,ifi,abi,ufi¦2ere:rgi,ngi,lgi,lvi¦2rre:poni,rai¦2re:dai,tai¦2pere:sai¦3are:gli,alli,uffi,doli,boni,toni,ampi,cci,appi,elli,ordi,ioni,orni,fidi,voli,tivi,uppi,leni,tani,nimi,nidi,noi,simi,coli,mbli,illi,oci,ommi,ardi,effi,loni,toli,lci,didi,iodi,audi,cimi,doni,gedi,soli,agi,roni,tumi,ulli,izi,nudi,meni,pani,reni,levi,irpi,egi,goli,uidi,moli,pali,pili,modi,urvi,ugi,ammi,uai,ceni,timi,poli,foli,pidi,nomi,tili,ozi,geni,goni,squi,dali,zoli,iani,fani,nali,bui,sodi,gali,fili,nvi,sani,cqui,uoni,gomi,livi,azi,cali,cemi,hedi,ippi,gani,ioli,fumi,obbi,temi,iffi,pumi,limi,veni,boli,urpi,gili¦3rre:bduci,dduci,educi,oduci,nduci,aduci¦3ere:endi,iggi,cedi,rivi,iedi,ludi,peti,rimi,ompi,cadi,rigi,iudi,cuti,erdi,vali,sigi,rudi,bevi,undi,vadi,digi,cevi¦3re:idici¦4are:bbai,bondi,colli,degui,ibbi,folli,anci,eggi,oggi,terni,mali,derni,nnodi,ioppi,rredi,rrivi,aggi,sedi,imili,vari,fici,emmi,lindi,rindi,ruci,unni,baci,medi,servi,olidi,empli,ambi,mandi,legui,iredi,eredi,ibbli,figi,logi,mendi,unci,sili,ucili,loppi,ubili,verni,berni,rsoni,ateni,ipri,nici,furi,grani,nondi,arsi,tari,arci,equi,iombi,bombi,tombi,pudi,efoni,iaffi,irci,brani,rolli,gridi,ibili,oqui,toppi,ionfi,ucidi,engi,idimi¦4ere:bradi,corri,ssumi,vinci,ncidi,nosci,llidi,metti,batti,pondi,resci,ecidi,sisti,suadi,torci,tolli,tridi,rridi,gligi,ccidi,rmani,iligi,nasci,edimi,cindi,credi,imani,mordi,cerni,fotti,combi,pandi,premi,ruggi,ividi¦4re:apri,empi¦5are:brevi,casci,coppi,losci,ghindi,llungi,basci,nisti,naffi,pprodi,rabbi,otondi,econdi,rcondi,minci,ncili,onsumi,trari,ilani,sangui,tanzi,ncomi,patri,ropri,nanzi,ocopi,ulebbi,ortali,nceppi,nebri,groppi,nsidi,orbidi,nvidi,rradi,cenzi,arodi,tenzi,corci,iesumi,ifondi,pingui,vesci,borni,rosci,fasci,gonfi,torpi,trani,uicidi,aligi,lasci,rebbi¦5ere:cogli,nnetti,nedici,orrodi,linqui,iogli,togli,nfondi,scondi,cegli,resumi,opelli,epelli,ileggi¦5re:verti,segui,sorbi,copri",
        "ex": "3:agiare,oliare,oziare¦4:ambiare,aprire,baciare,bigiare,cariare,coniare,copiare,cucire,empire,mediare,obliare,ovviare,pigiare,tediare,variare¦5:fuggire,mentire,partire,sentire,vestire,ampliare,berciare,cangiare,cogliere,conciare,coprire,doppiare,dormire,fasciare,forgiare,gloriare,gonfiare,lasciare,linciare,lisciare,mangiare,offrire,pazziare,pisciare,scuoiare,sdraiare,seguire,seppiare,servire,smaniare,soffiare,studiare,togliere,traviare,umiliare¦6:aborrire,bacchiare,fischiare,graffiare,languire,macchiare,mischiare,nicchiare,raschiare,ricopiare,ricucire,rischiare,sgusciare,soffrire,succhiare¦7:dipartire,ripartire,acconciare,adocchiare,angustiare,annebbiare,archiviare,assentire,crocchiare,divorziare,ingabbiare,ingiuriare,orecchiare,rimangiare,risentire,sfiduciare,specchiare,strisciare,strusciare,sussidiare,svecchiare¦8:abbacchiare,accerchiare,ammucchiare,arrischiare,avvinghiare,bevicchiare,bofonchiare,consentire,dissentire,evidenziare,insudiciare,invecchiare,invischiare,presenziare,principiare,riapparire,rimorchiare,rosicchiare,scomparire,soverchiare,stipendiare,strabiliare¦9:riassorbire,accalappiare,canticchiare,cincischiare,dormicchiare,infradiciare,mordicchiare,punzecchiare,rannicchiare,rispecchiare,scoperchiare,sonnecchiare,sparecchiare,sputacchiare,testimoniare¦10:acconsentire,apparecchiare,bruciacchiare,infinocchiare,mangiucchiare¦hai:avere¦odi:udire¦esci:uscire¦sei:essere¦3sci:agire,unire¦6i:allungare,affondare,arraffare,convivere,depredare,effondere,espellere,incarnare,lacrimare,ravvivare¦5sci:arguire,gestire,guarire,muggire,ruggire,sparire¦4i:avviare,deviare,espiare,inviare,ridare,roncare,battere,bendare,bollare,cernere,cherere,correre,credere,cremare,educere,elidere,emanare,eredare,erodere,esalare,fervere,follare,fondare,fottere,fremere,frodare,gabbare,gradare,gridare,guadare,leggere,mandare,mescere,mettere,mietere,mollare,mondare,mordere,nascere,pascere,piacere,planare,poppare,predare,premere,privare,reggere,rombare,ronfare,salvare,scopare,snodare,sondare,tessere,torcere,tremare,vernare,vertere,vincere¦2vi:bere¦2i:dare,alare,amare,sapere¦2ci:dire¦7sci:impartire,intontire¦4ci:indire,ridire¦4sci:lenire¦1uori:morire¦3i:odiare,sciare,spiare,stare,sviare,ardere,badare,cadere,calare,cedere,cenare,cimare,colare,domare,donare,dopare,ducere,fidare,filare,fumare,gemere,godere,ledere,levare,licere,limare,lodare,menare,mimare,molare,mudare,ondare,ornare,palare,penare,radere,redare,remare,ridere,rodare,salare,sanare,sedare,sudare,sumere,temere,valere,venare,vivere,volare¦5ci:predire¦5i:ristare,alienare,assidere,avvivare,chierere,deridere,desumere,eleggere,flettere,limonare,ossidare,riardere,riducere,rivivere,sbandare,schivare,sfondare,trombare¦1uoli:solere¦6sci:spartire¦1uoi:volere,potere¦8i:accapponare,distinguere,sprofondare,trasfondere¦9i:affaccendare,sopravvivere¦15i:contraddistinguere¦7i:correggere,diffondere,estinguere,insaponare,invalidare,profondere,proteggere,rieleggere,riflettere,sorreggere¦2ni:porre¦1ieni:tenere,venire"
      },
      "third": {
        "fwd": "1:apere¦iene:enire,enere¦esce:uscire¦1ce:urre¦1e:vire¦2e:guire,ucire",
        "both": "5sce:ientire,mentire,ircuire,lestire,dolcire¦5ce:terdire¦5e:ipartire¦4e:vestire,isalire,fuggire,bollire,sentire,borrire¦4ce:ledire¦4sce:ustire,istire,oquire,sprire,astire,ermire,arrire,iarire,ortire,ostire,antire¦3sce:grire,ltire,ncire,atire,agire,trire,etire,gnire,ocire,urire,rnire,emire,ruire,rcire,nuire,tuire,luire,orire,unire,buire,inire,ttire,erire,anire,utire,onire¦3e:mpire,ertire,parire¦3ce:ddire¦2e:frire,prire¦2uca:anicare¦2sce:eire,oire,pire,zire,hire,sire,fire,bire,dire,lire¦1e:arre¦1ne:orre¦uole:olere¦uò:otere¦:re",
        "rev": "are:à¦orire:uore¦1enire:viene¦1re:isce¦1enere:tiene¦1uscire:iesce¦1mettere:sette¦2ire:rme,nte,rbe¦3rre:bduce,nduce,educe,oduce,aduce¦3ire:sale,egue,arte,cuce,este¦4ire:angue,serve",
        "ex": "2:sapere¦4:risapere¦ha:avere¦ode:udire¦esce:uscire¦è:essere¦3sce:agire,unire¦5sce:arguire,gestire,guarire,muggire,ruggire,sparire¦5e:assalire¦2ve:bere¦4e:bollire,dormire,fuggire,mentire,partire,sentire,vestire,servire¦1à:dare¦2ce:dire¦7sce:impartire,intontire¦4ce:indire,ridire,addurre¦4sce:lenire¦1uore:morire¦5ce:predire¦8e:riassorbire¦3à:ridare¦4à:ristare¦3e:salire,cucire¦6sce:spartire¦8ette:teletrasmettere¦1iene:tenere,venire"
      },
      "firstPlural": {
        "fwd": "iamo:ere¦1iamo:nare,lare,fare,tare,dare,pare,rare,bare,uare,mare,vare,arre,arere¦1amo:ire,iere¦1niamo:orre¦1ciamo:urre¦1ssiamo:otere¦1gliamo:olere¦2mo:iare¦2ciamo:acere¦2piamo:apere",
        "both": "5ettiamo:etrasmettere¦5ciamo:terdire¦5iamo:llungare¦4ciamo:ledire¦3ciamo:ddire¦1iamo:eare,sare,zare¦1hiamo:gare,care",
        "rev": "2are:iniamo,lliamo,oliamo,itiamo,uriamo,ntiamo,amiamo,gniamo,uliamo,triamo,oriamo,briamo,nniamo,iriamo,aviamo,eliamo,otiamo,oviamo,rmiamo,ltiamo,rliamo,lmiamo,ptiamo,criamo,ipiamo,afiamo,smiamo,ofiamo,ddiamo,duiamo,obiamo,driamo,vriamo,ldiamo,tmiamo,ifiamo,abiamo,ufiamo¦2ere:rgiamo,lgiamo,lviamo¦2rre:poniamo,raiamo¦3are:doniamo,uffiamo,ittiamo,toniamo,ampiamo,astiamo,hetiamo,iatiamo,ietiamo,ioniamo,teriamo,erriamo,fidiamo,filiamo,tiviamo,meriamo,uppiamo,iutiamo,beriamo,ieniamo,leniamo,leviamo,taniamo,luniamo,mariamo,metiamo,putiamo,nimiamo,nidiamo,ianiamo,ortiamo,simiamo,ostiamo,mbliamo,iepiamo,sodiamo,ommiamo,enuiamo,ardiamo,effiamo,loniamo,uttiamo,didiamo,iodiamo,ifriamo,mutiamo,piliamo,mpriamo,cimiamo,futiamo,deriamo,nstiamo,roniamo,repiamo,nudiamo,rubiamo,meniamo,paniamo,urbiamo,reniamo,erbiamo,irpiamo,acuiamo,irtiamo,tumiamo,arbiamo,uatiamo,uidiamo,ratiamo,urriamo,taliamo,paliamo,soniamo,tuniamo,naliamo,modiamo,espiamo,cubiamo,urviamo,ammiamo,ceniamo,egriamo,timiamo,ceriamo,letiamo,nomiamo,utuiamo,geniamo,alpiamo,goniamo,squiamo,daliamo,etuiamo,faniamo,duniamo,aspiamo,galiamo,cariamo,saniamo,cquiamo,uoniamo,foniamo,lutiamo,gomiamo,liviamo,caliamo,capiamo,cemiamo,hediamo,ippiamo,ganiamo,fumiamo,temiamo,iffiamo,nodiamo,pumiamo,upriamo,limiamo,tubiamo,rupiamo,butiamo,urpiamo,getiamo,giliamo¦3rre:bduciamo,dduciamo,nduciamo,educiamo,oduciamo,aduciamo¦3ere:endiamo,orriamo,esciamo,cediamo,teniamo,riviamo,ingiamo,iediamo,ludiamo,petiamo,ompiamo,iggiamo,cadiamo,nquiamo,rimiamo,rigiamo,iudiamo,cutiamo,valiamo,sigiamo,beviamo,vadiamo,undiamo,digiamo,ceviamo¦3re:luiamo,buiamo,ruiamo,ioiamo,ndiciamo,veiamo,idiciamo,lfiamo¦4re:gliamo,runiamo,caniamo,cciamo,uisiamo,hiliamo,nnuiamo,rguiamo,ociamo,tutiamo,veniamo,vviamo,aciamo,lciamo,arpiamo,rcuiamo,patiamo,cepiamo,feriamo,todiamo,iziamo,ogiamo,sibiamo,uariamo,ialiamo,spriamo,ugiamo,tidiamo,losiamo,nibiamo,vosiamo,midiamo,ntuiamo,nviamo,gidiamo,utriamo,rediciamo,egiamo,apriamo,badiamo,empiamo,vaniamo,pediamo,aziamo,iadiamo,agriamo,tupiamo,ppliamo,eltiamo¦4ere:battiamo,bradiamo,rangiamo,iungiamo,mettiamo,ssumiamo,vinciamo,nosciamo,iangiamo,torciamo,nviviamo,pondiamo,ecidiamo,fungiamo,eridiamo,sistiamo,iligiamo,cerniamo,perdiamo,suadiamo,ruggiamo,pandiamo,pungiamo,trudiamo,ncidiamo,gligiamo,ccidiamo,rmaniamo,nasciamo,edimiamo,cindiamo,crediamo,imaniamo,mordiamo,isappiamo,iviviamo,fottiamo,combiamo¦4are:everiamo,bondiamo,bituiamo,certiamo,iappiamo,omuniamo,cordiamo,dattiamo,dobbiamo,deguiamo,operiamo,dorniamo,fettiamo,hindiamo,lattiamo,lertiamo,terniamo,morbiamo,ioppiamo,prodiamo,rrediamo,rriviamo,sestiamo,imiliamo,testiamo,vistiamo,zzeriamo,bettiamo,lindiamo,cottiamo,rindiamo,uettiamo,mandiamo,mendiamo,cretiamo,ngediamo,uistiamo,serviamo,olidiamo,nsumiamo,tattiamo,empliamo,rattiamo,prediamo,giuniamo,leguiamo,irediamo,dettiamo,sertiamo,ibbliamo,ettuiamo,migriamo,ipariamo,ageriamo,oneriamo,lottiamo,torniamo,rettiamo,rustiamo,nestiamo,loppiamo,ubiliamo,verniamo,berniamo,hettiamo,pattiamo,mperiamo,restiamo,carniamo,ateniamo,ceppiamo,festiamo,graniamo,roppiamo,aponiamo,sinuiamo,pretiamo,crimiamo,apidiamo,cheriamo,utiliamo,iettiamo,iombiamo,epariamo,uperiamo,uneriamo,cattiamo,destiamo,gettiamo,bombiamo,aettiamo,bandiamo,braniamo,cappiamo,cartiamo,iaffiamo,ciupiamo,crutiamo,gridiamo,ibiliamo,mistiamo,lveriamo,uartiamo,tappiamo,rnutiamo,toppiamo,rappiamo,icidiamo,pestiamo,bordiamo,ionfiamo,rottiamo,idimiamo¦5re:bbaiamo,reviamo,brutiamo,bortiamo,ccudiamo,ibbiamo,anciamo,eggiamo,ggeriamo,maliamo,mansiamo,mmoniamo,nneriamo,nnoiamo,unciamo,santiamo,oggiamo,aggiamo,sseriamo,sorbiamo,variamo,vertiamo,emmiamo,landiamo,ruciamo,unniamo,mediamo,ncupiamo,efiniamo,glutiamo,eperiamo,tituiamo,igeriamo,copriamo,bbediamo,figiamo,comiamo,sauriamo,serciamo,siliamo,iusciamo,hermiamo,rugniamo,uarniamo,bastiamo,mbibiamo,zarriamo,pauriamo,etosiamo,pigriamo,ziosiamo,acidiamo,anutiamo,niciamo,eboliamo,farciamo,erociamo,ddoliamo,ngeriamo,gantiamo,randiamo,gogliamo,sediamo,arsiamo,tontiamo,rpidiamo,tariamo,rretiamo,bustiamo,isciamo,goziamo,ficiamo,equiamo,rtoriamo,attuiamo,grediamo,seguiamo,bbuiamo,rinziamo,censiamo,nseriamo,bolliamo,icuciamo,fuggiamo,bambiamo,igoriamo,pudiamo,sarciamo,iveriamo,lordiamo,irciamo,candiamo,cuoiamo,foltiamo,marriamo,offiamo,pperiamo,tatuiamo,tordiamo,tudiamo,vestiamo,asaliamo,spariamo,engiamo¦5are:aparriamo,celeriamo,ccettiamo,giustiamo,llettiamo,oderniamo,ppartiamo,rraffiamo,otondiamo,econdiamo,rbottiamo,chieriamo,rcondiamo,llaudiamo,nstatiamo,ntinuiamo,ilettiamo,isperiamo,asperiamo,luttuiamo,ppettiamo,nforniamo,validiamo,giferiamo,olestiamo,rnottiamo,roettiamo,egustiamo,occupiamo,esettiamo,iesumiamo,pinguiamo,ntombiamo,elleriamo,miottiamo,repidiamo,rucidiamo,mpettiamo¦5ere:scondiamo,nediciamo,nfondiamo,nnettiamo,tinguiamo,orrodiamo,iogliamo,togliamo,spelliamo,stolliamo,cegliamo,resumiamo,cogliamo,flettiamo,ileggiamo,dividiamo",
        "ex": "siamo:essere¦1bbiamo:avere¦2viamo:bere¦1iamo:dare¦2ciamo:dire¦4ciamo:indire,ridire,piacere¦5ciamo:predire¦4iamo:roncare,attuare,battere,bendare,bordare,cernere,cherere,credere,cremare,destare,dettare,distare,educere,elidere,emanare,eredare,erodere,esalare,fervere,fondare,fottere,fremere,frodare,fungere,gabbare,gettare,gradare,gridare,guadare,gustare,lattare,laudare,leggere,listare,lordare,lottare,mandare,mattare,mestare,mettere,mietere,migrare,mondare,mordere,mungere,narrare,nascere,nettare,operare,pappare,pascere,perdere,pestare,planare,poppare,predare,premere,privare,prudere,pungere,reggere,restare,ristare,rombare,ronfare,salvare,scopare,situare,sondare,sparare,sperare,stilare,svenare,tangere,tappare,tessere,torcere,tornare,tremare,vernare,vertere,vincere,vistare,zappare¦9mo:abbacchiare,accerchiare,afflosciare,ammucchiare,appropriare,arrischiare,avvinghiare,bevicchiare,bofonchiare,contrariare,distanziare,espropriare,evidenziare,fotocopiare,insudiciare,invecchiare,invischiare,presenziare,principiare,raccoppiare,raccorciare,rimorchiare,rosicchiare,soverchiare,stipendiare,strabiliare,tralasciare¦7amo:abbellire,addolcire,allestire,ammattire,ammollire,ammuffire,appassire,assentire,assortire,avvizzire,diminuire,dipartire,imbellire,imbottire,impartire,inaridire,infittire,ingobbire,insignire,ispessire,premunire,presagire,rabbonire,rifiorire,rifornire,ripartire,risentire,scaturire,schernire,schiarire,scipidire,stabilire¦5iamo:abbonare,adoprare,adottare,apparare,arridere,assidere,avverare,avvivare,chierere,clangere,derapare,desumere,dividere,eleggere,flettere,fucilare,generare,goffrare,imparare,inondare,irridere,limonare,occupare,ossidare,riardere,riducere,sbarrare,sborrare,sbottare,schivare,scolpare,sfondare,sfornare,sgobbare,snobbare,spettare,spremere,stridere,trombare,venerare¦10amo:abbrustolire,acconsentire,approfondire,impensierire,impratichire,indispettire,insospettire,interloquire,prestabilire,rabbrividire¦5amo:abolire,aderire,bandire,candire,cogliere,colpire,condire,coprire,dormire,erudire,farcire,fiorire,fornire,frinire,fuggire,garrire,gestire,gremire,lambire,mentire,muggire,offrire,partire,riunire,ruggire,sancire,seguire,sentire,servire,sfinire,sorbire,sortire,togliere,tossire,tradire,vestire¦6amo:aborrire,assalire,avvilire,chiarire,demolire,esaudire,esordire,esperire,favorire,languire,poltrire,proibire,rifinire,risalire,smentire,soffrire,spartire,stizzire,ubbidire¦10mo:accalappiare,canticchiare,cincischiare,dormicchiare,incominciare,infradiciare,mordicchiare,punzecchiare,rannicchiare,ricominciare,riconciliare,rispecchiare,scoperchiare,sonnecchiare,sparecchiare,sproloquiare,sputacchiare,testimoniare¦8iamo:accapponare,ammanettare,commiserare,dissanguare,intorbidare,prospettare,rattristare,rischiarare,sprofondare,trasfondere¦8mo:accasciare,acconciare,accoppiare,accorciare,adocchiare,ambasciare,amnistiare,angustiare,annaffiare,annebbiare,archiviare,arrabbiare,cominciare,conciliare,contagiare,crocchiare,divorziare,espatriare,estraniare,finanziare,incipriare,ingabbiare,ingiuriare,licenziare,orecchiare,potenziare,ricambiare,rilasciare,rimangiare,rovesciare,scrosciare,sfiduciare,specchiare,squarciare,strusciare,sussidiare,svaligiare,svecchiare¦3amo:adire,udire,unire¦9iamo:affaccendare,rimproverare,sopravvivere¦9amo:affievolire,ammorbidire,arrugginire,disubbidire,impallidire,imputridire,incollerire,incuriosire,infiacchire,ingentilire,inghiottire,intiepidire,intirizzire,ristabilire,spazientire¦6iamo:affondare,allappare,aspettare,assordare,collidere,comparare,effondere,esilarare,infatuare,intridere,ravvivare,repellere,rifondare,rimestare,sorridere,tollerare,ventilare¦7iamo:aggiornare,annoverare,correggere,degenerare,dichiarare,diffondere,discolpare,diseredare,giulebbare,profondere,propellere,prosperare,proteggere,rieleggere,rigenerare,rispettare,sorreggere,sospettare¦4mo:agiare,odiare,oliare,oziare,sciare,spiare,sviare¦2iamo:alare,amare,arare,orare,parere,stare¦5mo:ambiare,bigiare,cariare,coniare,copiare,desiare,deviare,espiare,mediare,obliare,pigiare,tediare,variare¦6mo:ampliare,berciare,cambiare,cangiare,conciare,doppiare,fasciare,forgiare,gloriare,gonfiare,lasciare,linciare,mangiare,marciare,pazziare,plagiare,sdraiare,seppiare,smaniare,traviare,umiliare¦11mo:apparecchiare,bruciacchiare,infinocchiare,mangiucchiare,rincominciare¦8amo:appiattire,applaudire,arricchire,attecchire,consentire,dissentire,imbiondire,imbruttire,impietrire,impoverire,incenerire,ingiallire,inorridire,insaporire,intenerire,intimorire,intristire,rammollire,riapparire,rinverdire,scomparire,seppellire,sgranchire¦4amo:aprire,aulire,capire,cucire,empire,ferire,finire,lenire,morire,munire,ordire,perire,pulire,punire,rapire,sopire,subire,uscire,vagire¦3iamo:ardere,badare,barare,cadere,calare,cedere,cenare,cerare,cibare,cimare,domare,donare,dopare,ducere,errare,fidare,filare,fumare,gemere,godere,ledere,levare,libare,licere,limare,lodare,menare,mimare,mudare,mutare,natare,ondare,ornare,ostare,palare,parare,penare,radere,redare,remare,ridare,rodare,rubare,salare,sanare,sedare,sudare,sumere,tarare,temere,tenere,ungere,urtare,valere,venare,vivere¦7mo:bacchiare,dilaniare,fischiare,graffiare,inebriare,infuriare,inguaiare,insidiare,invidiare,irradiare,macchiare,mischiare,nicchiare,parodiare,raschiare,ricopiare,rischiare,sborniare,scambiare,scoppiare,scorciare,sfasciare,sgonfiare,sgusciare,storpiare,straniare,succhiare,trebbiare¦13mo:contraccambiare¦11amo:disseppellire,rimpicciolire,rincoglionire¦2niamo:porre¦2ssiamo:potere¦3piamo:sapere¦2gliamo:solere,volere"
      },
      "secondPlural": {
        "fwd": "1cete:urre",
        "both": "5ettete:etrasmettere¦1ete:arre¦1nete:orre¦te:re",
        "rev": "3rre:bducete,nducete,oducete,aducete",
        "ex": "siete:essere¦2vete:bere¦4cete:addurre,dedurre,sedurre"
      },
      "thirdPlural": {
        "fwd": "ono:ere¦lgono:gliere¦escono:uscire¦1cono:urre¦1iono:arere¦1nno:apere¦1ono:vire¦2gono:enire,enere,alere,anere¦2ono:guire",
        "both": "5ettono:etrasmettere¦5scono:ientire,mentire,ircuire,lestire,dolcire¦5cono:terdire¦5ono:ipartire¦4ono:vestire,fuggire,bollire,sentire,borrire¦4gono:isalire¦4cono:ledire¦4scono:ustire,istire,oquire,sprire,astire,ermire,arrire,iarire,ortire,ostire,antire¦3scono:grire,ltire,ncire,atire,agire,trire,etire,gnire,ocire,urire,rnire,emire,ruire,rcire,nuire,tuire,luire,orire,unire,buire,inire,ttire,erire,anire,utire,onire¦3ono:mpire,ertire,ucire¦3cono:ddire¦2ciono:acere¦2ono:frire,prire¦2ucano:anicare¦2scono:eire,oire,pire,zire,hire,sire,fire,bire,dire,lire¦2iono:parire¦1gliono:olere¦1ssono:otere¦1ggono:arre¦1ngono:orre¦1no:are",
        "rev": "orire:uoiono¦1ere:dono,vono,mono,nono,pono¦1re:iscono¦1uscire:iescono¦1gliere:elgono¦2rre:ducono¦2ere:rgono,rcono,ncono,erono,etono,quono,igono,utono,mbono¦2gliere:iolgono,tolgono,colgono¦2ire:rmono,ntono,rbono¦2re:danno,tanno¦2pere:sanno¦3ere:attono,ungono,tengono,istono,ingono,oscono,eggono,iggono,valgono,ottono,ulgono,ascono,mangono,ellono,essono¦3ire:vengono,eguono,artono,estono¦3re:ndicono,idicono¦4ere:corrono,rangono,mettono,volgono,iangono,inguono,rescono,nettono,tollono,lettono,ruggono¦4ire:ssalgono,anguono¦4re:redicono¦5ere:nedicono¦5ire:iservono",
        "ex": "hanno:avere¦odono:udire¦escono:uscire¦sono:essere¦3scono:agire,unire¦5scono:arguire,gestire,guarire,muggire,ruggire,sparire¦5gono:assalire¦2vono:bere¦4ono:bollire,dormire,fuggire,mentire,partire,sentire,vestire,correre,educere,mescere,mettere,servire,tangere,vertere,volgere¦2nno:dare,sapere¦2cono:dire¦7scono:impartire,intontire¦4cono:indire,ridire¦4scono:lenire¦1uoiono:morire¦5cono:predire¦8ono:riassorbire¦4nno:ridare¦5nno:ristare¦3gono:salire,tenere,valere,venire¦8nno:sottostare¦6scono:spartire¦3nno:stare¦3ono:algere,ducere,licere,ungere¦5ono:clangere,riducere¦2lgono:cogliere,togliere¦2iono:parere¦3iono:sparere"
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
    "gerunds": {
      "gerunds": {
        "fwd": "endo:ire¦pugnando:espugnare¦verniciando:nverniciare¦1cendo:urre¦1nendo:orre¦4cendo:nedire",
        "both": "5cendo:trafare,terdire¦5ando:ullizzare¦4endo:empire¦4cendo:ledire¦3vendo:abere,ibere¦3cendo:sfare,efare,ddire¦2attando:ecettare¦1endo:arre¦chando:tchare¦ndoci:rci¦ndosene:rsene¦ndo:re",
        "rev": "1ire:hendo,zendo,fendo,oendo,eendo¦1are:iiando¦1espugnare:ipugnando¦1nverniciare:iverniciando¦1mettere:settendo¦2ire:unendo,ntendo,isendo,ilendo,luendo,nnendo,nuendo,prendo,inendo,rbendo,buendo,ulendo,itendo,asendo,cuendo,orendo,atendo,tuendo,ruendo,ibendo,rmendo,drendo,lsendo,osendo,grendo,elendo,trendo,ltendo,bbendo,glendo,frendo,ependo,agendo,nsendo,opendo,upendo,lpendo,ubendo,plendo¦2rre:ponendo¦2re:facendo¦3ire:bonendo,rutendo,bolendo,ortendo,cudendo,volendo,errendo,gerendo,conendo,encendo,monendo,mutendo,assendo,audendo,rguendo,ostendo,salendo,serendo,estendo,venendo,astendo,artendo,arpendo,ferendo,molendo,cucendo,bidendo,aurendo,ercendo,perendo,ornendo,uscendo,ranendo,ugnendo,arnendo,ialendo,arrendo,uttendo,butendo,pedendo,iolendo,ronendo,verendo,renendo,ognendo,nerendo,durendo,arcendo,tolendo,allendo,eguendo,oquendo,midendo,gidendo,garendo,ustendo,pidendo,bedendo,aidendo,ittendo,colendo,badendo,uarendo,ionendo,tivendo,vanendo,ullendo,lenendo,iarendo,nutendo,ancendo,iadendo,turendo,curendo,aggendo,ampendo¦3rre:dducendo,nducendo,oducendo,educendo,aducendo,sducendo¦3re:ndicendo,idicendo¦4ire:bellendo,borrendo,dolcendo,gredendo,mattendo,pparendo,rossendo,ttutendo,vertendo,landendo,mparendo,stodendo,acidendo,servendo,sordendo,rbarendo,iondendo,bottendo,ucidendo,sierendo,acutendo,cherendo,crudendo,ebetendo,erocendo,ddolendo,iottendo,grigendo,signendo,pettendo,verdendo,rretendo,pessendo,mollendo,fuggendo,muggendo,llerendo,ristendo,tossendo,lordendo,hernendo,gradendo,tordendo,sparendo¦4rre:erducendo¦4re:redicendo¦4iare:viglando¦5ire:piattendo,ruvidendo,zzoppendo,eglutendo,ppellendo,stardendo,bufalendo,utridendo,astidendo,accidendo,liardendo,onnolendo,rividendo,ibandendo,ibollendo,mbambendo,ngardendo,itradendo,bbollendo",
        "ex": "spendantendo:impedantire¦inchiocciolendo:rinchiocciolire¦infierendo:rinfierire¦intoppando:rintoppare¦tivalicando:rivalicare¦2vendo:bere¦5endo:boglire,accanire,languire,riordire,scandire¦9cendo:contraffare¦2cendo:dire,fare¦4endo:empire,aderire,bandire,bollire,candire,condire,erudire,fuggire,gradire,gremire,lambire,largire,muggire,riudire,ruggire,servire,tossire,tradire¦4cendo:indire,ridire,rifare,abdurre¦5cendo:malfare,predire¦8iando:pinneggiare¦10ando:raggrovigliare¦11cendo:ricontraffare¦7iando:rimeggiare¦3cendo:sdire,sfare¦8cendo:sopraffare,autoridurre,ribenedire¦8ettendo:teletrasmettere¦2endo:adire,agire,olire,udire,unire¦3endo:ambire,capire,cucire,fedire,ferire,lenire,ordire,orrire,padire,perire,putire,rapire,salire,uscire,venire¦9endo:approfondire,imborghesire¦8endo:impallidire,inviscidire,ringrandire¦6endo:inaridire,rancidire,ricondire¦7endo:infrollire,ingrandire,inorridire¦2nendo:porre¦10endo:rinciprignire"
      }
    },
    "pastParticiple": {
      "pastParticiple": {
        "fwd": "otto:urre,uocere,ucere¦lto:gliere¦so:rere¦tto:ggere,mpere¦osso:uovere,uotere¦to:guere¦nto:gnere¦1so:udere,rdere,undere¦1sso:ettere,indere¦1nto:umere¦1tto:arre¦1to:rcere,ncere,lgere¦1etto:ligere,rigere¦1uto:sere¦2uto:enere,evere¦2to:ungere,ollere,orgere,nascere¦2sto:pondere¦2so:argere,arere¦2ito:stere¦3to:tingere¦4so:sparire",
        "both": "5esso:etrasmettere¦5tto:trafare¦4uto:lendere,vendere¦4so:ifulgere,mparire,pparire¦4etto:terdire,ostringere,enedire¦3to:pingere,cingere,vellere,solvere,dergere¦3tto:efare,sfare¦3sso:efiggere¦3uto:iovere,ottere,volvere,cadere,mpiere,venire,attere¦3etto:ledire¦3so:pandere,cellere¦3iuto:oscere,escere¦3sto:hiedere¦2uto:apere,etere,emere,rnere,icere,edere¦2erto:aprire,oprire¦2ento:edimere,irimere¦2ulso:opellere¦2so:vadere,rodere,alere,uadere,ergere,radere¦2ssuto:vivere¦2iuto:acere¦2tto:rivere¦2to:urgere,rogere,angere¦2etto:ddire¦1uto:bere¦1atto:digere,sigere¦1sto:anere,orre¦1erto:frire¦1sso:utere¦1uso:fondere¦1esso:rimere¦1so:idere,endere¦istretto:estringere¦to:re",
        "rev": "re:nte¦1urre:dotto¦1ere:guto,duto,ciuto,tuto¦1rire:perto¦1uovere:mosso¦1ggere:utto¦1ellere:pulso¦1ire:detto¦1uotere:cosso¦1dere:aso,oso¦1uocere:cotto¦1vere:issuto¦2gliere:colto,celto,iolto¦2ggere:litto,fitto¦2dere:luso,iuso,ruso¦2ttere:nesso,messo,lesso¦2mere:sunto¦2rre:ratto¦2rere:hesto,orso¦2re:fatto¦2igere:iretto,gletto¦2ere:ovuto¦2gere:ulto¦2mpere:rotto¦2ndere:tuso,cisso¦2ucere:idotto¦2gnere:pento¦3gere:iunto,volto,punto,funto,sorto,corto,porto¦3ere:tenuto,bevuto,essuto¦3cere:torto,vinto¦3ggere:rretto,otetto,eletto¦3igere:diletto¦3dere:iarso,morso¦4ere:sistito,icevuto¦4gere:ttinto,ntinto¦4guere:stinto¦4gliere:istolto¦4ggere:ffritto¦5ndere:risposto¦5ire:isparso,asparso",
        "ex": "3uto:algere,cadere,dolere,dovere,godere,potere,urgere,venire,volere,tenere¦2erto:aprire¦4etto:astringere,predire¦2uto:avere¦2vuto:bere¦3sto:cherere¦3to:cingere,fingere,mingere,morire,solvere,tingere,fungere,mungere,porgere,pungere,sorgere,torcere,vincere,volgere¦9tto:contraffare¦1etto:dire¦2so:ergere,ledere,radere,rodere,ardere¦3ulso:espellere,repellere¦2tto:fare,figgere,leggere,reggere,rompere¦1uso:fondere¦7nte:impellere¦3etto:indire,ridire,stringere,diligere¦4sso:infiggere¦2to:nascere,ungere¦4iuto:pascere¦4uto:pendere,tangere,vendere¦4tto:rifare,rileggere¦3tto:sfare,eleggere,friggere¦3ito:solere¦8tto:sopraffare¦5uto:stridere¦2ssuto:vivere¦2lto:cogliere,togliere¦6so:cospargere¦1otto:cuocere,ducere¦2otto:educere¦2etto:erigere¦5to:estollere,prenascere¦2sso:mettere¦3so:mordere,parere¦1osso:muovere¦4to:rinascere,stingere¦5sto:rispondere¦4so:sparere¦2nto:sumere"
      }
    }
  };

  // uncompress them
  Object.keys(model$1).forEach(k => {
    Object.keys(model$1[k]).forEach(form => {
      model$1[k][form] = uncompress$1(model$1[k][form]);
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
    "Determiner": "true¦altri,gli,i2l1questa,tale,un0;!a;!a,i;!l",
    "Pronoun": "true¦ci,esso,io,l9mi7n4questi,su3t1v0;i,o4;i,u0;!a,e,o5;a,o4;e,o0;i,str0;a,e,i,o;!e0o;!i;e,o0ui;!ro",
    "Preposition": "true¦a9c6d2f1in,molti,ne4p0su5tra;er,rima;ino,ra;a2e1i,o0;po,ve;g7i,l5;!g6i,l4;he,o0;i,l,n0;!tro;!d,g2i,l0;!l0;!a,e,o;li",
    "Cardinal": "true¦cOdFmilEnovPottDquAse9tre2un1vent0ze7;i4otJu3;dFo;!dEnt0;a1otGu0;no;!cinq2d2nHquatt1se0tré;i,tF;ro;ue;d7i,ssaGttF;a0ind6;raEtt0;ord4ro;aCo;ione,le;i2od1ue0;!cen3mB;ici;ci0eci8;a1ot0;to;nn1sset0;te;ove;ento2inqu0;a0e;nta;!m0;ila",
    "Possessive": "true¦mi4n2su1tu0v2;a,e,o4;a,o3;ostr0;a,e,i,o;e0o;!i",
    "FemaleAdjective": "true¦0:A5;1:A1;2:9Y;3:9Q;4:9D;5:9E;6:9B;7:8R;8:9O;9:9U;A:68;B:9I;C:9K;D:8O;a8Hb82c6Id62e5Cf4Sg49i3Qjugosla9l3Dm2Tn2Go24p19qu17r0UsYtPuLvE;aJeHiGoFuE;lcaDo0;ca96lont7;ci2n0olen0si9ttor9L;cch8neEra;ta,z95;liAr8s0;l3FmFniErbanG;ca,ta04vers5C;anEb5iA;a,is3;aLeGi21os9YraFurE;ca,is3;gi1nquil9M;cnHd46leGmpFne5oEr9Ysa;lo8Nri1;e6Zor6N;foDvi9O;i1o8J;rAt3;a07b5Vc04eZfYiUoPpKtFuEvizze5;cc9Jdd69gges6me5preB;aHes4il9FoCraE;nFord3JtE;e8Eig70;a,ie5;mpa0ti1;ag07eGic8GlendiAoE;nt6BrE;ca,ti9;ciEs4;aliz7Nfi1;ciHggett6HlEno5sp5Ytt2Avie3;a,iE;da,s0taE;!r8;al8Cet7;cGgnifi4Umbo87nFsEta;mi1te59;foDgo8Wist5;il86u5;eCortu9B;cHgre0lvagg8man3pGrFttEve5;ece3CiB;ba,e2ia;a66ol0;ca,ond7;ar4eDiFoEu5;l4Nn4X;e3Xi0;c5l3PnE;gu1Zit7ta;aOeMiJoEus4;bus0cc87maFsEtZ;a,s6O;gFnE;a,i1ti1;no8E;c1fles4gFnEpiAstr58t8Qvolu39;nova0o7T;iAo5W;al8Ccipro1lEmo0pubb7Ssid5D;a6ig7Y;diofoDpEra;iApresenta6;aEotid7H;d5Lnt87r0;a03eZiWl44oTrHsicGuE;bblicEli0ra;a,it7;hi1o73;a3eLiIoE;ble4Bd4SfGgr84ibi0lunga0n0pr8s7TteFvE;a0vis0D;i1t0;onA;mFvaE;!ta;ar8i6oge1S;ci4ma2LsGvEz7H;en6iE;a,s0;tig7Eun0;e3lFntific8pMsEve5;i6tuB;ac1i3;aFcEe2ttoC;co7Ke2;n0t0;nul15rEs7Ctrolife5;du0f4CiEs6S;cEfeCo1W;olo4;ci54da2ga2nora7RrFssEtS;a0i9;aFigi2la0tE;en2Oig6M;lle7As6H;bbligatOdiNgg4QlimMmoLnto6BpIrFscu5ttE;a9iB;atMdinaFganiEig1Etod1U;ca,zzat4K;r8ta;eraFpoE;rtu2s0;ia,ti9;gen46niB;pi1;er2;or8;aMeKoGuE;da,merEo9;i1o4;na,rFtE;a,tur2;di1maE;n2ti9;cess7ga6mi1o77rEt0;a,vo4;!poleGr6Bscos0tFziE;on4Ns0;i9ur15;oDta2;aSeMiJoFuE;r7sic5W;deGnFrE;biAfo5J;as3et7tuo4;r2s0;a,nFstEti1;a,er62i1;er7iBor1X;dGlo0Rra,ssi6LtEzza;aEeoro5Cropolita2;fi3Tl5I;e62iE;a22ca,tE;err3A;f5Ugi1n5DrHssiGtE;eEu5;ma3r2;cc8ma;ca0itOm2Yx5Ez5C;aPeKiJoGuE;mEng5D;ino4;mFnE;goEta2;barA;be5gn2Zmi24ngu5Wq0Vri1t3M;gEn0tter7;a0geGiE;sla6tE;tiB;nd7ra;i1r3Lti2vo5B;beCdVgno0llumin50mQnGpote3roDsFtaliE;a1Hca;la5Yo4Gtant2P;aspet1UcMdKedi0fIgen2NnHtEv2M;at0eEiB;n4rE;a,med8na;a0ova6;iEor1R;ni0;iEu4Q;a2ge2r27;er0in0;mFpE;egMortant4Orovvi4;agFeEu1I;d1Un4;in7;en3on2AroelettC;eSiIoGrE;aEe1ig8os4;fi1m1End4Htui0;ti1verE;na6;allLgaJoGuE;di04riEs0;di1;rnFvE;an4Aia2;al4W;ntE;es1;a,orE;os4;neGoFrE;archi1maD;g2Clo3QmetC;ri1ti1;aUerSiNlMoIrFuE;tu5;aFeE;dAs1;zion7;nArEt24;tEza0;iEu4V;fi3Ls47;uiA;loso21nGorFsEt0;i1sa;en2F;anEi0;zi7;ma,rE;a0ovi7;l4mo4ntasErmaceu3sc3H;cieEti1;nti1S;br02cYduXff1IgiziaWlQmPnOpNrLsGtFurEvolut1Fxtraurba2;op15;er2i1ni1rus1;at0e15pHtE;eEi9reB;rEti1;a,na;lici0r3Z;edEoi1ra0;it7;a3i1;erge3ne3K;o6piC;as3eFlE;en3Pit3;ttrFvatE;a,is3F;i1oE;magne3ni1;!na;ca6;cFoE;lo2Ino3S;es3KlesiE;as3;ai1ea;eQiHoGramNuE;bb8raE;!tu5;lo0Tmes3pp8ra0;chia0NfKna3KpIr02sFur2vE;er4i2;abiFcEpe0Ltrut0;og0Tre0;ta0;in0loE;ma3;en36fE;icolto4u4;cis0Cdi0fini6g2li26moFn4ttE;aglK;c1Ug0Ln0V;a0Qe0Ohi0Mi0Hl0DoLrFuE;pa,r2J;ea6iHoFuA;da;a0cEma3ni1;ia0;stEti1;alli2ia2;l02mWnMperLrJsE;iddHmGpicPtE;ie5o4rE;ut6;i1opoli0;et0;ea2pEta;orL;ni2Pta;cMsKtE;adi2emporHinGrE;ar8ovE;er4;ua;anE;ea;eEideN;cu6;lu2Bre0;i1memo1RpFuniE;s0t7;at0eti6lEosi6re4;eEi19;ssEta;a,i9;lFoE;ra0;et6;aEiD;moFndes00sE;si1;ro4;lindCneEvi1;matEti1;ogE;raE;fi1;a5mi1rEu4;ur0O;lEr0;eberriBti1;!lJmpa2noDo3pitIrGsalinFttE;i9o0Q;ga;a,boDdEi1nivo5si1;ia1;al0Q;c1Eda;aNeJiGos4rEuo2;asil0LitanDutE;a,ta;ancFb0Ho0AzanE;ti2;a,one5;lErbe5;ga,lE;a,iE;ca,s0W;roc1sFttE;eCu0;i08sE;a,isE;siBta;bbando1Dc1Cd1Ber18fr14g0Ul0Om0In06p01rPsNtLuGvEzzur5;anEvers7;za0;strHtE;en3oE;mEnoB;a3obil0S;al00ia1;le3mosfeCo11tE;a,en0i9;p5solu0trE;at0ono0Y;ab05bitr7cJistoHmGtiE;coEs3;la0;a0e2oD;cEteP;ra3;ai1hE;eoFitettoD;ni1;loE;gi1;ar8;er0ostoHpE;liFoE;si0;ca0;li1;aMgLiKnJoniBtiFzE;ia2;cFfascE;is0;a,hE;isS;es4ua;ma0;li05;lEto07;i3ogE;a,i1;a5bizGe00i1ministEp8;ra6;ti9;io4;sa;ra;geHie2pi2tE;a,isEra;siB;ma;bCri2;ri1;gJia0onHrE;ar8icoE;la;ia;is3;ti1;iorQrE;esE;si9;va;iFoameE;riE;ca2;na;ea,odinaE;mi1;ca;at0espo0ul0;centua0u0;na0;ta",
    "Adjective": "true¦0:70;1:6V;2:71;3:6Z;4:6J;5:6O;6:74;7:6W;8:68;9:72;A:6T;B:6N;C:62;a67b5Wc4Vd4Ae42f3Og3Hh3Fi2Zl2Pm25n1To1Pp12qu11r0MsZtPuMvDwa4X;ariaKeGiEoD;ca0l2;ce,enBg1ncDsAv1;en9it55;ge4GntErDscovi0t6P;ba0osimi0sa2Cti5T;en6XrD;a0i0A;bi0n9;lter6Imanoi6BnEsDtili6D;c1ua0;ani51ghe5Sifor51;at25eHip8oGrDutt;asEiD;a0Id5Men7onfa0;cu09ver53;ller2riBta0;cn8desc69mGna4SrEsD;si0tA;ma0rD;e3Ii69;i3poC;!aYcWeSfavore6FiPoMpKtFuEvD;aria9e57;d18e,pplem69rrea0;aFel67or8rD;aDutJ;da0gran5T;g59n9tD;a0unit4U;az4ecPiD;na0ra0;ddisfac1lEno5prannaDtto3R;tuC;a5i59u3;nDtua3S;da4YgD;le,o5V;co5Udicen61gu1micirFnEqu3NrDssAttentr4Z;a0ia0;e6tM;co5R;ientDo68rit9;if8;li1pi1;aQeMiDot2;bel0cHnFsDtA;contDorgFult2;ra3;ascDtracc3T;im0V;c5BoD;nDrr1;duDosD;ci3;gFna0pRsEttaDv1I;ngo5C;id1t2;a0g1n2;d4ggiungi3;alunque,est’;aVeTiSluCoMrGuD;bblicEgl4LnD;g1k;a2Zhe;eGiEoD;dutt3Ege3Kmoz47porz47spici1te2Tvinc4;mDncipe;e,o;co3Cdo2Re19fDge54sen0Yve4D;eri3;lGp,rtFsD;s1tD;a0er4Q;an9o3Vua0;a5iDmo3H;go7t8;aneg1Hemonte6rami42;cuUgg0Gna0rD;en4Wse;lesFpa0rEsDtrimon4;s2toC;anor3Vl2rocch4;e,tiB;cMl1LmosessAnli4Rpen,rFsEttenDva0;i3ne;pi9serva3;bi25chestCdi7izzon25mo7;aMeLoEuD;cl0Cz4;biImHrD;dDvege6;-oDoriP;cDriO;cidN;a3Xi7;lia5;pale6wyorke6;sDta0va0;a0c1;aReMiIoFuD;ltimed4nici1CsD;co42ea0;deBl0nDr1t2D;d4t2umD;en1N;cid4gli0HlEnD;eCor;aBiD;a5t2;ccan8diGrEssiBtalD;!l8;canDid2X;ti0;c3KeRoeR;gEnagDrgi7s2XtD;er4;gDic3H;iorD;!e;aKeIiGoEunD;a5g3D;de3NnDqua1V;diBgitu2D;beCeve,gu5nDve;ea5;gaDssi2Gt23;ti;rDteC;va0;dentifica3mNnGrEstDtalian;ituz2Erutto5;l09revD;er3K;arresta3cIdiHeGfFgEteDusAvF;gr2r30sti7;anne39le6ombr2;er7;sist1;ffer1spensa3vidA;apa1Dli37onfon2E;mFpD;ermea3on0IreD;ndi2Uve2B;in1obilD;e,ia5;ardco5orrD;or;alleHeFiaElac4rD;avit15ec2L;lloblu,ppoB;nDolog8;ia0oL;gDse;gi2;aPeNiJluv4oGrFuD;nDorvi2;eb5zion2;ance6on06;ca0nda0CrD;!liDmida3;ve6;nEsD;ca0ic27;a0e,lD;an19;rDu1L;ra1Gv1;c1llim29;conom8diIgAlettHmerg1piscoGqua24sEtc,xtraterreD;st5;istRponYteD;nu2r1Z;pa0;oCr8;le,tD;or4ri0D;aWeOiGoEuD;a0ca0pli0B;c1r0JtDvuS;aRtri7;aletJfGrigFsD;cDtin9;e1Cipli0H;en9i3;enso5ferD;enD;te,z4;ta0;cJfHmGterFvD;aDoz0R;st2;min2;enz4;iniDorY;ta;en7i0P;ne6rk,ta3;a09ele08him8i04lass8oHrFuD;rDsto11;ve;an4eD;d1sc1;lUmSnErDstitu1;a0r1;cOfMgen4iuga0nLsFtD;a3inuando,raD;en9ttA;eFiDul1;glDst1;ia3;gu1rvatD;riD;ce;az03;in2orD;me;eDorr1;ttA;and2busti3pleDu7;m0Ttam1;lEosD;sa0;aEeg4iD;na5;teC;neFrcoEstercD;en6;l2st2;matograf8se;b5s9;nErDuS;di7;aDt2;de6;aJel,iGoDritann8uon;cElogBrD;ghe6;ca0;dDen7;imensD;io7;biloBsa0tteEvaD;re6;siD;ma0;bru0Kcc0Ed0BeroportAff08g06l01maZnTppRrMsItEutostraDzienD;da0;enFtD;acc2enD;di3;ie6;ceFsiEtC;ra0;mila3st1;nd1;agoBcErog2tiD;gia7st8;aEhitetton8;icJ;de;arten1reD;zza3;a0gHtD;erFiD;cDst2;he;io5;losassoNoG;tor4;ia0; coperto,a5baBimEveoD;la5;enta5;ne6;re;eDi0;vo0;iDlu1;ne;ua0;domi7er1;en9;na0;attiv2esD;si3;bi0;le;an9;te;zze6;se",
    "Condition": "true¦nel caso che,si",
    "Negative": "true¦n0;on,ulla",
    "Noun": "true¦0:4M;1:4T;2:4P;3:4D;4:4B;a4Gb46c3Ed39e37f2Wg2Li2El23m1On1Io1Dp0Jqua0Ir09sOtDuCv5zucche4U;a9i7o5;ce,l5;o,ta;a0Ideocas2Vs36t5;a,tor4G;l5s48;i1u33;cc3Wffic3o39;aDe9itol22r6utt5;'u4i;a5ime2R;ffi1ma,tt5;a0o;mpes2Wn29odo4Ds5;su0t5;a5i,o;!ta;c1s5vo3Q;ca,s0Ato;aNcHeFfEiBolAp9quad3Rt6ussid3v5;iluppo,ol2P;or3Zr6udi5;!o;a1Zuttu3N;az3ec0So3B;di,e;gnifi18n6stem5;a,i;da1i29;i1TorX;c0Mde,gui0me27r5;ie,ra,vo;a8h6o5;n0po;er5ia1J;mo,zo;la,r5tola;i1pa;bb3Il5ng00;e,ot0;appCe9i5;c7fugia0mborZs6t5vol24;or4rat0;ch3p24tor2Iulta0;er35o;!cla27ddi0g6t5;e,ta;a2Tno;or0resent2D;d3Gl2Grtier generaS;aSeLiIlas3Hneuma3HoDr8u5;ls2Ant5;e5i,o;gg3;an8e7o5;cesLfi2Lg5sp1Sva;et0ram0S;m3z5;zo;l7n23rt6st5te2;a,o;a,i1;i5lo;tec2Wzi2I;a6e5;de,t2;n0Hst2zza;lAr5sce;c7d6i5si1;co27o0R;ue;en0or5;so;le;d2io,l9ni1r6s5;so,to;co,t5;e,i5;!to;cosce2Ge0U;biet08c8gnu4n7perLr5;ec7o5;!log3;e2o2;ch3;a8e7ien1Dom6u5;me2Ft2;e,i;goz3mi1ssu4;s5tu1Tve;ci0Ro,t2B;aGeEiBo7u5;ro,s5;ei,i1S;dellOn02r14s6t5vimen0;o2to;ai1tr5;a,e;li6s5;ce1Gu1J;arWo1A;r5sY;ca0;cchi0Rd2est1Ygo,mHni6p0Wr5tti4;ca,e,i0si1;co,e1D;aBe9i7od6u5;ce,d5;ovi1;b1Sn5v12;ea guiKg17;g5sOt0;a,ge,no;cri7st2t6vor5;i,o;o,te;ma;mpAn5;c5iz3;a7en5;ti5;vo;nt01ri1;or0ronU;aEene2i9over4r7u5;i5s0;da;a5i0T;do;ac0So7u5;bb0Nras5;si1;c5st2;hi,o;eli1sd0J;aDede0Zi9lotIo6r5ungo;ecc0Sutti di ma2;gl0RnXrm6s5;setW;a,u0C;gli7l6ne5o2;st2;e,m;!a,o;bbri0Dt5;a,tu09;n5re0TstaO;ri1traN;ati,e8i6ome0Jura5;ta;f5o,va4;et0;mo0Ntenu0;aOeLhi1iJo8r5;istian5uscZ;esi5;mo;lEmAn6per0Ar5;da,o8so;dizioNs6t5;o,rolO;eg5igl3;na;merci6p5;i0lean4uter;an5;te;pa;as5bo;cu4;n6r5;ch3ot0;e2t01;lc3mpiona0n8pit7rne,u6val5;ie2lo;sa;a4o8;c6dida0e,zo5;ni;el5;lo;aAi7o5racc3u1;cBl5;la;r6sc5;ot0;ra;g4r6tta5;glC;ca;no;cqua,driaKlGmDn8pe,ramai1t6u0vversar3;io;lanIt5;i1o;at2dro8ima6s5tibioG;ia;!l5;e domesDi;ni1;al6bi0;to;ri1;a7be6t2;re;ro;!ri1;ti1;co",
    "Adverb": "true¦aZbenYcVdSecc,fRgià,inPlOmLno,oIpDquAs4t1vi0;a,ci06;a1roppo,utto0;!ra;lvolta,n05rdi;e4in,o1pe0ubi04ì;cie,sW;l1pra0t02;!ttut01;o,tZ;conda,mpA;a0i;l0nXsi;e,i;er3i2o1r0ur;esUopr8;co,i;uttosSù;alBsiP;lt1r0ve;a,mai;re;ai,e0olN;gl0no;io;à,ì;die3fine,siEt0vece;anIorG;a,orse,uori;a1ie0;tro;pprima,v5;irca,o0;m0sì;e,unque;!e;bbastanza,cc8ddirittura,lme7nc5ppun9ss3tt1v0;anti;or5raver0;so;ai,i0;eme;h',or0;!a;no;an0;to",
    "PresentTense": "true¦aOdIhFpBs4v0è;o1uo0;i,le;gli0leM;aNoJ;a4i2oIt0;a0iaLo;!i,nAte;a0eH;mo,no,te;!i,n7p0;eEpF;o1u0;oi,ò;ss0teB;a8ia5o8;a0o;!i,n0;no;e2o0;bbia0ve5;mo,te;bba1v0;e,o0;!no;bb1ve0;te;ia0;!mo,no,te",
    "Date": "true¦domani,ieri,oggi",
    "PastTense": "true¦aveHdoveFeBf8pot6s1vol0;eGlF;apeFeppEt0;a1e0;mLsGttC;t0vD;a,i,o;e0é;i,mHr2sCvA;osBu0;!i,mFr0;ono;bb4r0;a0i,o;!no,va0;mo,te;m9s4tt0v2;e7i;m7s2v0;a0i,o;!mo,no,te;s1t0;e,i;e1i0;!mo;!ro;mo",
    "MaleAdjective": "true¦0:LF;1:L4;2:L2;3:JL;4:KR;5:KW;6:LA;7:K7;8:L1;9:KS;A:LG;B:JV;C:JK;D:J1;E:LH;F:J0;G:LB;H:IL;I:L6;J:JZ;K:JI;L:GJ;M:IY;aI6bHKcEUdDAeCCfBBgAEi8Hjunior,l83m6On67o5Ip3Wqu3Tr2Vs0Wt0Du06vNzopHG;a03eZiPolOuN;lnera8o0;gaLontF;brAgVnc19olUrtuTsQtPvOziN;a0o3;aIIi9o;a2torC;cOiN;bi2vo;eGSi9o3;a2o3;a,en0;i2oHX;cchiJLlPneOrN;de,gogEEo;ra8to,zM;eECoI7;cAgo,l2SnNriJHs0;o,taEV;brGUffIFgFIl9PmRniPrNti2;banNg5inF;is4o;co,lateGFtFversN;a2itF;a7iN;do,le;a03eWiVoSrOurN;co,is4;aOemDJiNopi5Z;butFpJsE;diNgi1nquilJspar5uGI;toLzEN;ccArOsNzGS;ca7si1;na0rentC5;be6Dmi9pi1;atG1cnDZd9GleSmRneBoQrN;apeu4miOrN;i8orHC;co,na2;loI4ri1;a4pEN;foHviI;cit54lNr9t4;ent5Mi;a1JbD5c19e11fo10i0VnelJo0Hp08qu07tUuOvN;ariaEZeglDizzeB;ccRdQf7Sgges6pN;erNreJ0;!bo,fNioL;icHLlIT;!dG3;esIo3;aXeWiUoH7rQuN;dCpN;eNi9;fJJn9;aOeNiduJumJX;piCNssAt0;biliAnNordinFteHLvagA;ieBo;lGPmN;olA;ri2s3;bi2gnAnNti1;co,dard;al3LiHK;aTeQiPlendi9oN;ntDXrNsa0;co,tiG;eJ8go9Hna0ritE3;ciOrimJJttN;a50ra2;al96fi1;g0ZzN;io3zatura;cialZddisfDKfXgg3XlUnTrSsPttOvN;ie4ra7;e5Ei2;peOtN;aDWeni8;so,t0;do,preD1;oBt4J;enGYfoGCiN;do,tN;arDo;fNiIS;er0iG7;democC4e,isDS;cQgnificaPlenzCmOnNsteEUto;ceBfoHgolH9istBte4;boHXi2m8Ipa4;!tiG;ilMuB;ca0rtuI9;cTdizCgre0lQmpliFZnsPpOrNttimaCVveB;e7io;aIPol0;a0i8;eOvaN;ggDti1;t6zI1;co,ond8W;aVet4hiUiRoOrQuN;ro,sa;lA8mo9nNr3;fNoD0vDQ;it0;at0cGFe92oN;ccNl0;anEo;acciAet0fo3;nda8Ar3;crGMggiGSnNr9tiFI;itFo,to;a0Ee04iUoPuN;moF0ra2sNvi9;so,ti1;bGIccCmaOsNt0utiFZ;eo,sGG;gOnN;i1o,ti1zo;noJ;cVdUgTl56nRpQsNtI8voluzionF;cOer3CpettNtrE1;a8iG;alda0hC;eti6i9;frescAnovaNoma0;bi2to;i9oEM;iGVot0;cFYet6;aVcUgTlSmo0sPtN;roat6tN;ilinERo;iOpN;irA6o4V;deC9st5;a6igC;io13oD6;enEipro1;l2Mt6;diQffiGWgCJpPro,zN;ioBIziN;a2s8X;i9presen87;ca2oN;at6foHteleviI;aOest'ul62oN;!tidM;dH7li82ntE6;a0We0Oi0Kla0Io0BrRsicPuN;bblicNli0ni6ro;itFo;hi1oN;loEVti1;atic2Te01iWoNud5;at6ba8ceduCMdUfSgrG7liE2mRn0pQsOt1MvN;a0enienBToc9KvisB9;peNsiFVta4;ro,t4;orzGCri09;ett5in5;essionNon9;a2is4;igCut6;gionieBmOncipa2vN;a0ilegEOo;arDiOoN;ge4SrdE8;sFJtiG;cQdB5fe57liminaLmPoccupa45sOvNzC;al5en6io;enEiB8tigCun0;a8Gium,uDD;ed5i3;chisFDe4lRntificDpolQrta4HsOtenNveB;tCRzE0;i6sNtuFC;esIi8;aLo3;ac1eGLiN;ti1zi5C;ci9nNuEV;etF;aPccOeNgBo,sa7ttoDH;ga0no,to3;anEoJ;ceKt0;dagoDXlo3nTrNsA;fC6iRman5peQsNtin5vaI;iOoNpicaDA;!na2;a7st5;ndi1KtER;co5Yo5D;sieCRti0;cXffu0lWrRssQtOuCQzN;i5zo;eNriot4;r7ti1;a0eggeBiG;aQiPlaOsimonCtNzDB;ecipanAKi1B;m75to;!gi7;gona8lleJnoi1;li9;a0iCN;bbligato0Acc08di07ffenIgg06k,l05m04n01pXrRsQttNvvDzC;iNo0U;co,mN;a2is71o;cuBsCKti2;a2dinaRgPiNri8todos3;enFIginaN;le,riDW;aniNo1D;co,zz3U;rDto;eraPpN;oNrim5;rtu7s0;io,tiG;es0oN;m6VrN;arDeK;bBWogenC6;eo3f9Aimpi1;et6;er7o3;as91uN;l0pa0;!rD;aZeVoPuN;do,lJmerNoGtriz8X;i1o3;bi2io3rPstalCLtN;eKo,tN;ur7;dOmaN;le,n7;!aDXi1;cess4YgPoOrNt0utrCX;o,vo3;cla72na0;a6l77;polePrD4scos0tNz8L;al65iGuralN;e,is4;oHta7;a0Ke09i03oRuN;ltipJsNto;iOulN;ma7;ca2;bi2ccCdVlSnQrPstrOtiN;va0;uo3;a2bi9tCH;as4etFtN;a7uo3;eOtN;eplici,isCY;co9P;a,eNu9O;rNs0;a0no;gl1Vli5EnQraco3XsNt9A;erOtN;erCi1o;a8o;iNoLusCX;!mo;ccaHdiVlo36morUnTrRsQtNzA0;allOropoliN;ta7;i1o;chi7siCZ;aviNo;glC;si2ta2;a8ia2;co,o,teN;rr7V;cho,es6Ag01lXnWrTsQtN;eNto,uB;ma4rN;ialistica,no;chiOsiN;ccDmo;le,o;cOiNm76roB4zAT;a7no,t21;a0io;ca0ua2;a0eOiNvagD;ncoHzC;dNvoJ;et0uCV;i1nNro;e4iA2;aZeUiToRuN;ci9mi6BngOssuN;o3re14;hiNo;!sBR;ca2gi1nN;gobar9ta7;beBe0miCJngu9Rquidi,ri1scDt8B;a2gOn0tN;a2ter32;aD4geOiN;sla6t1H;ndFro;i1r8Gti7;bri9d1Ggno1Fll1Bm0XnWoHpote4rPsNtalM;laCTpi9raelMtN;ant6Xe9S;oHrN;ePiN;lNta8;evA;go82sN;is7JpoN;nsa8;a0Mc0Gd0De0Cf05giAPizia04n00quietAsXtQu0BvNzuppa0;aOer3iN;nci8si8;d5rA6;at0eNiB4rinse1ui6;graCLllRnQrNso;essaOmedDnNo;az67o;nEto;s72zBI;ett6Nig5;apoLenALigni16oli0ta8uN;bo4GfN;fici5;atPoNumerevoli;cNva6;enEuo;o,u7G;le,tiva;aRePiWlu5ormaN;le,tiN;co,vo;li8XrN;ioL;lli8nN;ti2;di0r5viBR;efiOiNustr94;a7ca6fe3gB0pe5Fr7Mscus3;ni0;er0lRoNredi8;er5mpPnOraNstit59;ggiA;dizAUscD;iu0le0;iATu3;deB0spetB2t6ugu6X;barazzAmWpN;aTeRl2EoQrN;eOoN;ba8vvi3;cisa0ss2I;rtant7Gs9Q;c94gnNr8O;at63;uNzi5;ri0;aOeNorB4un28;d8Xn3;ginaNtuB;bi2rD;eNustL;ci0gN;a2itN;ti9Q;rAto;eOill6Pon7VrN;au9Si1og7R;a2n4;a0Ie09hiacc8Mi00loZoYrNus3I;aReQigDoN;ssoOttN;es1;!la7;co,z6S;dRfi1ndPs3tNve,zC;iNo,ui0;ficA;e,iN;o3s9A;eKua2;mmo3ti1ve9A;ba2rC;alJganteUoQuN;diziFriOstN;ifiA1o;di1;io3rnal75vN;anNia7;e,iN;le,s8Z;!s1;lUnPoNrmaHs57;g71lo7TmN;et78;eOtilNui7;e,izD;rNti1;alNi1o3;e,izAE;i9o3;l2Nsso3;a09e05iYlXoTrOuN;nz3TrCso,tuB;aQeOiN;t0voJ;d9ne4qu5s1ttoN;lo3;gi2nces8X;l9ZndaPrNt6K;ma2tN;e,u8Z;m9KnEto;es81oscDuor93;dSeBloso6HnQorentPsN;iNso;co,o75;e,i7;anziNi0to;ari7T;a0ucC;dePli6GmminiOnome3CrN;mo,o6FroviFti2;le,s0Q;le,ra2;cYlWmTntasQstidCtOvoN;lo3reK;a2i73tN;i8ua2;cieOiNti1;a,o3;nti60;iOosN;is7So;ge8VliaL;lNso;i0o;i2olN;ta6;br0Jc0Fd0Dff0Bg09l03mo01nZpi1quival5rXsQtPuOvN;ent3Bid5olut3P;clid5Srop5S;er7i1ni1rus1;at0clus3MeSilarAo4pQse3BtN;eNiGre7I;rNti1;i,no,o;an3er0lNr33;ici0;cu6mp44nE;edNoi1;itF;ergNne79orme,tusiasX;e4i1;!tiGzN;ionA;aReNiE;gAmOttrNva0;i1oH;enN;taL;bo84s4;izMoisN;ta;et6icN;a58i5;ilNuca6;izD;cNlet4o5A;eOlesiN;as4;ll5sIz1X;ai1eo;'oBa14e0PiYoSrQuN;bbDrN;aNo;tuB;aNit0;m3Ks4;lQmOppDrNta0vu0;a0i1mi5;eNinA;ni6Vs4;ce,orN;anEo3;c0Cd0Bf06g05l04na7Pp03rett2GsQvN;erOiN;no,siG;so,t5;aYcVgus06leUoTpRtN;aPintNr12;iNo;!vo;c71nE;a77e77oN;ni8s0;rdi6M;ssi1;og44rNu29;e0iminN;at1B;bili6Rst3U;e0Vin0lo2W;ig5;es6i71;ePfN;iNu3;ci2d5;nItN;to3;at4;en9;bo2c00diZfYg7lWmoUnSpRsPtN;ermi65tN;agl4L;crit6er0iderNtB;a8o3;loreKr15;so,tN;a2ro;cNg3In2F;ra4;ega0iNud5;be6Eca0zC;init1Dun0;ca0to;ad5enEiIo4X;nNta0;no3;a1Ye1Shi1Qi1Ml1JoWrOuN;ba7ltu1Tpo,rC;eTiSoPuN;c3PdNen0;e2o;a0cOnN;i1o3U;cAia0;mi04stMti1;a6mo3;er5inv18l15m0PnXperni5ArSsN;ci5idd20mi1tN;anEiOo3rN;ut6;eBtN;uzW;aQpPrNto;et0ispoN;nd5;or2T;ggC;c0Ddi0f0Agress09n08o07s02tSvN;enOinN;c5to;i5zN;ioN;na2;agCeTinSrN;aOoN;intui6ver3;ddittOffNrDs55;at0;orD;en5Fuo;mpNnu0;orN;an2C;apeKePiderOuetN;o,udi31;a0eK;cu6rvN;atoL;sciu0;es3;ua2;iNu3;deN;nz2H;luIre0;i1me00o9pQunN;e,iN;ca8sNtF;ti;aTetSlPoOreNulI;n3Bso;rtam4Ss0;eNi4H;ssNto;iGo;enEi6;ssOtN;i8to;ioneK;rc21sN;ti8;lOoNpeKto;n1Yra0;abo2Zet6;ol0;aNiH;mo14ndes1YssNustrofobi1;e,i1;c3Ae1lind1HnPrcolarOttadi7viN;co,le;e,i;emat15i1;aBmi1rNu3;ur1W;co,lPntOrN;ebNto;ra2;eberri2WluNti1;laL;re;dZlXmWnoHo4pVrRsPtNu0vo;astro0XtN;iGo2W;alinNua2;go;atter0QdPenEiNnivoBo,si1tesM;co,no,sNtateK;ma4;ia1;a0Vo,riccC;po;cNdo,mo,vo;ar0Ois4o2Z;et0;a05eZiWlVoUrOuN;io,o7;asilMevRiQonPuN;s1tN;a2to;zo;llAtanH;e,is27;livMtaH;an9u;anc1Gb2AlancDoOzN;an0VzarB;lo0Zn9;llQnNrgamas1;eNig7venu0;dettNfi1;i7o;iNo;co,s1W;g2GnOrNs3;bu0oc1;a2cF;b37c2Qd2Her2Ff24g1Zl1Qm1En0Zp0Sr0Ds06t01uRvNzzurB;an3FvN;eNinc5;ntuNr3;ro3;daZrVstrUtN;en4is4oN;biPmNno1MreK;a4obilN;is4;ogN;raN;fi1;alMia1;eo;eo,le4mosfeQo2QroPtN;eNiGra5ua2;n0so;ce;ri1;ciut0ia4pSsQtN;rNu0;at0oN;no2I;eNicu28olu0ur9;nEr6;irAro;aZbitrFcUgenTia7mRrabb03tiN;coPfNs4;icN;ia2;!la0;a0e7oniN;co,o3;ti7;ai1hN;eoOitettoH;ni1;loN;gi1;bo,ncioN;ne;er0pN;aRicciQliPoOroprNunti0;ia0;si0;ca8;co3;r5ss10;aYgXimaVnToSsCtiOzM;ia7;cPorF;arD;io;hi,o;maJni0A;es3uN;a2o;le,tN;i,o;us0;lNrchi1;i4ogN;hi,i1o;aXbiTe0FicRmiOpiN;!o;nistOreKsN;si8;ra6;heKo;vo2;en11gPzC;io3;so;uo;ro,to;coUfabe4ie7lRpi7tN;ePisNo,ro;siN;mo;rna6;'aper0armAeN;a0gB;ro;li1;gPitan9nos4riN;coJ;lo;iun6rN;esI;fSrN;iPoaN;meN;riN;ca7;no;aQezOida8olN;la0;ioN;na0;ma0scinA;eo,oN;dina0Bnau4;at0doReQiPoNul0;lNra8;esc5;ac5;gua0;meOrmenN;ta0;stiN;ca0;cRi9quOuN;s4to;a4eo;ti1;do;adeWeSidQoOuN;ra0;gli5modA;enE;enN;ta2;so,tN;ta8;bi2;le;mi1;co;bTiOuI;siG;le,tN;a6uaN;le,to;tiG;vo;oNronO;ndAzN;za0;to;anE;te",
    "Verb": "true¦avvenuUchiamatTdebboSf8regali,utilizzaUv0;a,e0ienK;n1rr0;aCe3à,ò;g3i1n5ut0;a,e,i,o;a0mJsEte,vD;mo,te;aKoK;a1ec0;eEi;c6i,n5r1t0;e,to;a2e0à,ò;bbeAi,m0st7te;mo,o;i,n0;no;ci8e0;m6s1v0;a7i,o;s1t0;e,i;e1i0;!mo;!ro;mo;a0o;!mo,no,te;!no;a,i;ta",
    "Conjunction": "true¦aLbenKcIdGeDgrazie a,inCmBn9o7p4qu3s0tuttav8vi5;e1i0;a,ccome;!bbene;ando,inM;er1iutto0rima CuA;stoD;cIò;!p6ss0;ia;e0é;ancDmmeno,p3;a,ent3;fatti,olt2;!d,p0;pu0;re;opo 0unque;c6di;ioè,osí0; c4;c4sì; causa 4ffinc3llora,n0ppena;c1zi0;!c1;he;hé;di",
    "FutureTense": "true¦a2do2potr3s0vorr3;a0tar2;pr1r1;vr0;a1e0à,ò;mo,te;i,nno",
    "ConditionalVerb": "true¦av2dov2pot2s0vor2;a0ta1;p0re1;re0;bbe1i,mmo,st0;e,i;!ro",
    "LastName": "true¦0:32;1:39;2:37;3:2W;4:2C;a38b2Yc2Ld2Be28f22g1Wh1Mi1Hj1Bk14l0Wm0Ln0Ho0Ep04rXsLtGvEwBxAy7zh5;a5ou,u;ng,o;a5eun2Roshi1Hun;ma5ng;da,guc1Wmo24sh1YzaQ;iao,u;a6eb0il5o3right,u;li38s2;gn0lk0ng,tanabe;a5ivaldi;ssilj34zqu1;a8h7i2Do6r5sui,urn0;an,ynisI;lst0Mrr1Rth;at1Romps2;kah0Snaka,ylor;aDchCeBhimizu,iAmi9o8t6u5zabo;ar1lliv27zuD;a5ein0;l20rm0;sa,u3;rn4th;lva,mmo21ngh;mjon4rrano;midt,neid0ulz;ito,n6sa5to;ki;ch1dJtos,z;amAeag1Wi8o6u5;bio,iz;b5dri1JgGj0Qme21osevelt,ux;erts,ins2;c5ve0C;ci,hards2;ir1os;aCe8h6ic5ow1X;asso,hl0;a5illips;m,n1R;ders1Yet7r6t5;e0Lr4;ez,ry;ers;h1Zrk0t5vl4;el,te0H;baAg09liveiZr5;t5w1M;ega,iz;a5eils2guy1Pix2owak,ym1C;gy,ka5var1I;ji5muU;ma;aDeBiAo7u5;ll0n5rr09ssolini,ñ5;oz;lina,oIr5zart;al0Ke5r0S;au,no;hhail4ll0;rci0ssi5y0;!er;eUmmad4r5tsu05;in,tin1;aBe7i5op1uo;n5u;coln,dholm;fe6n0Pr5w0I;oy;bv5v5;re;mmy,rs13u;aAennedy,imu9le0Ko7u6wo5;k,n;mar,znets4;bay5vacs;asX;ra;hn,rl8to,ur,zl4;a9en8ha3imen1o5u3;h5nXu3;an5ns2;ss2;ki0Ds0R;cks2nsse0C;glesi8ke7noue,shik6to,vano5;u,v;awa;da;as;aAe7itchcock,o6u5;!a3b0ghMynh;a3ffmann,rvat;mingw6nde5rM;rs2;ay;ns0ErrPs6y5;asCes;an4hi5;moI;a8il,o7r6u5;o,tierr1;ayli3ub0;m1nzal1;nd5o,rcia;hi;er9is8lor7o6uj5;ita;st0urni0;es;ch0;nand1;d6insteGsposi5vaK;to;is2wards;aBeAi8omin7u5;bo5rand;is;gu1;az,mitr4;ov;lgado,vi;nkula,rw6vi5;es,s;in;aEhAlark9o5;hKl5op0rbyn,x;em6li5;ns;an;!e;an7e6iu,o5ristensFu3we;i,ng,u3w,y;n,on5u3;!g;mpb6rt0st5;ro;ell;aAe7ha3lanco,oyko,r5yrne;ooks,yant;ng;ck6ethov5nnett;en;er,ham;ch,h7iley,rn5;es,i0;er;k,ng;dCl8nd5;ers5r9;en,on,s2;on;eks6iy7var1;ez;ej5;ev;ams",
    "FirstName": "true¦aEblair,cCdevBj8k6lashawn,m3nelly,quinn,re2sh0;ay,e0iloh;a,lby;g1ne;ar1el,org0;an;ion,lo;as8e0r9;ls7nyatta,rry;am0ess1ude;ie,m0;ie;an,on;as0heyenne;ey,sidy;lex1ndra,ubr0;ey;is",
    "MaleName": "true¦0:CB;1:BI;2:BZ;3:BQ;4:B2;5:BW;6:AQ;7:9S;8:BA;9:AU;A:AL;aB1bA5c94d84e7Df6Wg6Eh5Ui5Gj4Jk49l3Pm2Nn2Co27p21qu1Zr19s0Pt05u04v00wNxavi3yGzB;aBor0;cBh8Fne;hCkB;!aAY;ar4ZeAX;ass2i,oCuB;sDu23;nEsDusB;oBsC;uf;ef;at0g;aJeHiCoByaAM;lfgang,odrow;lBn1N;bDey,frBGlB;aA2iB;am,e,s;e86ur;i,nde7sB;!l6t1;de,lCrr5yB;l1ne;lBt3;a90y;aDern1iB;cBha0nce8Trg98va0;ente,t59;lentin48n8Wughn;lyss4Lsm0;aTeOhKiIoErCyB;!l3ro8s1;av9OeBist0oy,um0;nt9Gv53y;bDd7VmBny;!as,mBoharu;aAWie,y;i81y;mBt9;!my,othy;adDeoCia7BomB;!as;!do7K;!de9;dErB;en8FrB;an8EeBy;ll,n8D;!dy;dgh,ic9Rnn3req,ts44;aRcotPeNhJiHoFpenc3tBur1Nylve8Fzym1;anDeBua79;f0phADvBwa78;e56ie;!islaw,l6;lom1nA1uB;leyma8ta;dBl7Hm1;!n6;aDeB;lBrm0;d1t1;h6Qne,qu0Tun,wn,y8;aBbasti0k1Wl40rg3Zth,ymo9G;m9n;!tB;!ie,y;lCmBnti20q4Hul;!mAu4;ik,vato6T;aWeShe90iOoFuCyB;an,ou;b6JdCf9pe6OssB;!elAG;ol2Ty;an,bIcHdGel,geFh0landA7mEnDry,sCyB;!ce;coe,s;!a93nA;an,eo;l3Ir;e4Pg3n6olfo,ri66;co,ky;bAe9S;cBl6;ar5Mc5LhCkB;!ey,ie,y;a83ie;gCid,ub5x,yBza;ansh,nR;g8UiB;na8Qs;ch5Wfa4lDmCndBpha4sh6Sul,ymo6Y;al9Wol2Ay;i9Gon;f,ph;ent2inB;cy,t1;aFeDhilCier60ol,reB;st1;!ip,lip;d99rcy,tB;ar,e2U;b3Rdra6Do3Rt43ul;ctav2Uliv3m94rEsBt7Oum8Sw5;aCc8RvB;al51;ma;i,l49vJ;athJeHiDoB;aBel,l0ma0r2X;h,m;cCg4i3IkB;h6Tola;hol5WkBol5W;!ol5V;al,d,il,ls1vB;il4Z;anBy;!a4i4;aWeTiKoFuCyB;l21r1;hamCr5YstaB;fa,p4F;ed,mF;dibo,e,hamDis1XntCsBussa;es,he;e,y;ad,ed,mB;ad,ed;cGgu4kElDnCtchB;!e7;a77ik;house,o03t1;e,olB;aj;ah,hBk6;a4eB;al,l;hClv2rB;le,ri7v2;di,met;ck,hNlLmOnu4rHs1tDuricCxB;!imilian8Bwe7;e,io;eo,hCi51tB;!eo,hew,ia;eBis;us,w;cDio,k85lCqu6Fsha7tBv2;i2Hy;in,on;!el,oKus;achBcolm,ik;ai,y;amBdi,moud;adB;ou;aReNiMlo2RoIuCyB;le,nd1;cEiDkBth3;aBe;!s;gi,s;as,iaB;no;g0nn6QrenDuBwe7;!iB;e,s;!zo;am,on4;a7Aevi,la4RnDoBst3vi;!nB;!a5Zel;!ny;mCnBr66ur4Swr4S;ce,d1;ar,o4M;aIeDhaled,iBrist4Uu47y3A;er0p,rB;by,k,ollos;en0iEnBrmit,v2;!dCnBt5B;e0Yy;a7ri4M;r,th;na67rBthem;im,l;aYeQiOoDuB;an,liBst2;an,o,us;aqu2eJhnInGrEsB;eChBi7Aue;!ua;!ph;dBge;an,i,on;!aBny;h,s,th4W;!ath4Vie,nA;!l,sBy;ph;an,e,mB;!mA;d,ffGrDsB;sBus;!e;a5IemCmai8oBry;me,ni0O;i6Ty;!e57rB;ey,y;cHd5kGmFrDsCvi3yB;!d5s1;on,p3;ed,od,rBv4L;e4Yod;al,es,is1;e,ob,ub;k,ob,quB;es;aNbrahMchika,gKkeJlija,nuIrGsDtBv0;ai,sB;uki;aBha0i6Ema4sac;ac,iaB;h,s;a,vinBw2;!g;k,nngu51;!r;nacBor;io;im;in,n;aJeFina4UoDuByd55;be24gBmber4BsD;h,o;m3ra32sBwa3W;se2;aDctCitCn4DrB;be1Zm0;or;th;bKlJmza,nIo,rDsCyB;a42d5;an,s0;lEo4ErDuBv6;hi3Zki,tB;a,o;is1y;an,ey;k,s;!im;ib;aQeMiLlenKoIrEuB;illerCsB;!tavo;mo;aDegBov3;!g,orB;io,y;dy,h56nt;nzaBrd1;lo;!n;lbe4Pno,ovan4Q;ne,oDrB;aBry;ld,rd4T;ffr6rge;bri4l5rBv2;la1Yr3Dth,y;aQeNiLlJorr0HrB;anDedBitz;!dAeBri23;ri22;cDkB;!ie,lB;in,yn;esco,isB;!co,zek;etch3oB;yd;d4lBonn;ip;liCng,rnB;an00;pe,x;bi0di;arZdUfrTit0lNmGnFo2rCsteb0th0uge8vBym5zra;an,ere2V;gi,iCnBrol,v2w2;est45ie;c07k;och,rique,zo;aGerFiCmB;aFe2P;lCrB;!h0;!io;s1y;nu4;be09d1iEliDmCt1viBwood;n,s;er,o;ot1Ts;!as,j43sB;ha;a2en;dAg32mEuCwB;a25in;arB;do;o0Su0S;l,nB;est;aYeOiLoErDuCwByl0;ay8ight;a8dl6nc0st2;ag0ew;minFnDri0ugCyB;le;!l03;!a29nBov0;e7ie,y;go,icB;!k;armuCeBll1on,rk;go;id;anIj0lbeHmetri9nFon,rEsDvCwBxt3;ay8ey;en,in;hawn,mo08;ek,ri0F;is,nBv3;is,y;rt;!dB;re;lKmInHrDvB;e,iB;!d;en,iDne7rByl;eBin,yl;l2Vn;n,o,us;!e,i4ny;iBon;an,en,on;e,lB;as;a06e04hWiar0lLoGrEuCyrB;il,us;rtB;!is;aBistobal;ig;dy,lEnCrB;ey,neli9y;or,rB;ad;by,e,in,l2t1;aGeDiByI;fBnt;fo0Ct1;meCt9velaB;nd;nt;rDuCyB;!t1;de;enB;ce;aFeErisCuB;ck;!tB;i0oph3;st3;d,rlBs;eBie;s,y;cBdric,s11;il;lEmer1rB;ey,lCro7y;ll;!os,t1;eb,v2;ar02eUilTlaSoPrCuByr1;ddy,rtI;aJeEiDuCyB;an,ce,on;ce,no;an,ce;nCtB;!t;dCtB;!on;an,on;dCndB;en,on;!foBl6y;rd;bCrByd;is;!by;i8ke;al,lA;nFrBshoi;at,nCtB;!r10;aBie;rd0S;edict,iCjam2nA;ie,y;to;n6rBt;eBy;tt;ey;ar0Xb0Nd0Jgust2hm0Gid5ja0ElZmXnPputsiOrFsaEuCveBya0ziz;ry;gust9st2;us;hi;aIchHi4jun,maFnDon,tBy0;hBu06;ur;av,oB;ld;an,nd0A;el;ie;ta;aq;dGgel05tB;hoEoB;i8nB;!i02y;ne;ny;reBy;!as,s,w;ir,mBos;ar;an,beOd5eIfFi,lEonDphonHt1vB;aMin;on;so,zo;an,en;onCrB;edP;so;c,jaEksandDssaExB;!and3;er;ar,er;ndB;ro;rtH;ni;en;ad,eB;d,t;in;aColfBri0vik;!o;mBn;!a;dFeEraCuB;!bakr,lfazl;hBm;am;!l;allEel,oulaye,ulB;!lCrahm0;an;ah,o;ah;av,on",
    "FemaleName": "true¦0:FV;1:FZ;2:FO;3:FA;4:F9;5:FP;6:EO;7:GC;8:EW;9:EM;A:G8;B:E2;C:G5;D:FL;E:FI;F:ED;aDZbD2cB7dAHe9Ff8Zg8Fh81i7Qj6Sk5Yl4Mm36n2Ro2Op2Dqu2Cr1Ms0Pt03ursu6vUwOyLzG;aJeHoG;e,la,ra;lGna;da,ma;da,ra;as7CeHol1RvG;et9onB8;le0sen3;an8endBMhiB3iG;lInG;if38niGo0;e,f37;a,helmi0lGma;a,ow;aLeIiG;ckCZviG;an9WenFY;da,l8Vnus,rG;nGoni8M;a,iDA;leGnesEA;nDJrG;i1y;aSePhNiMoJrGu6y4;acG1iGu0E;c3na,sG;h9Mta;nHrG;a,i;i9Jya;a5HffaCFna,s5;al3eGomasi0;a,l8Go6Wres1;g7To6VrHssG;!a,ie;eFi,ri7;bNliMmKnIrHs5tGwa0;ia0um;a,yn;iGya;a,ka,s5;a4e4iGmC9ra;!ka;a,t5;at5it5;a04carlet2Xel6MhUiSkye,oQtMuHyG;bFHlvi1;sHzG;an2Set9ie,y;anGi7;!a,e,nG;aEe;aIeG;fGl3CphG;an2;cF6r6;nGphi1;d4ia,ja,ya;er4lv3mon1nGobh74;dy;aKeGirlBKo0y6;ba,e0i6lIrG;iGrBOyl;!d6Z;ia,lBT;ki4nIrHu0w0yG;la,na;i,leAon,ron;a,da,ia,nGon;a,on;bMdLi8lKmIndHrGs5vannaE;aEi0;ra,y;aGi4;nt5ra;lBMome;e,ie;in1ri0;a02eXhViToHuG;by,thBJ;bQcPlOnNsHwe0xG;an95ie,y;aHeGie,lC;ann7ll1marBEtB;lGnn1;iGyn;e,nG;a,d7X;da,i,na;an8;hel53io;bin,erByn;a,cGkki,na,ta;helBYki;ea,iannDWoG;da,n12;an0bIgi0i0nGta,y0;aGee;!e,ta;a,eG;c6CkaE;chGe,i0mo0n5EquCCvDy0;aCBelGi8;!e,le;een2ia0;aMeLhJoIrG;iGudenAV;scil1Uyamva8;lly,rt3;ilome0oebe,ylG;is,lis;arl,ggy,nelope,r6t4;ige,m0Fn4Oo6rvaBAtHulG;a,et9in1;ricGsy,tA8;a,e,ia;ctav3deHfAVlGphAV;a,ga,iv3;l3t9;aQePiJoGy6;eHrG;aEeDma;ll1mi;aKcIkGla,na,s5ta;iGki;!ta;hoB1k8ColG;a,eBG;!mh;ll2na,risF;dIi5QnHo23taG;li1s5;cy,et9;eAiCN;a01ckenz2eViLoIrignayani,uriBFyG;a,rG;a,na,tAR;i4ll9WnG;a,iG;ca,ka,qB3;chOkaNlJmi,nIrGtzi;aGiam;!n8;a,dy,erva,h,n2;a,dIi54lG;iGy;cent,e;red;!e6;ae6el3G;ag4KgKi,lHrG;edi62isFyl;an2iGliF;nGsAL;a,da;!an,han;b08c9Dd06e,g04i03l01nZrKtJuHv6Tx87yGz2;a,bell,ra;de,rG;a,eD;h76il8t2;a,cSgOiJjor2l6Jn2s5tIyG;!aGbe5RjaAlou;m,n9R;a,ha,i0;!aIbAKeHja,lCna,sGt54;!a,ol,sa;!l06;!h,m,nG;!a,e,n1;arIeHie,oGr3Kueri9;!t;!ry;et3IiB;elGi62y;a,l1;dGon,ue6;akranBy;iGlo36;a,ka,n8;a,re,s2;daGg2;!l2W;alCd2elGge,isBFon0;eiAin1yn;el,le;a0Ie08iWoQuKyG;d3la,nG;!a,dHe9RnGsAP;!a,e9Q;a,sAN;aB0cJelIiFlHna,pGz;e,iB;a,u;a,la;iGy;a2Ae,l25n8;is,l1GrHtt2uG;el6is1;aIeHi7na,rG;a6Zi7;lei,n1tB;!in1;aQbPd3lLnIsHv3zG;!a,be4Let9z2;a,et9;a,dG;a,sGy;ay,ey,i,y;a,iaIlG;iGy;a8Fe;!n4G;b7Serty;!n5S;aNda,e0iLla,nKoIslAQtGx2;iGt2;c3t3;la,nGra;a,ie,o4;a,or1;a,gh,laG;!ni;!h,nG;a,d4e,n4O;cNdon7Ri6kes5na,rMtKurIvHxGy6;mi;ern1in3;a,eGie,yn;l,n;as5is5oG;nya,ya;a,isF;ey,ie,y;aZeUhadija,iMoLrIyG;lGra;a,ee,ie;istGy5C;a,en,iGy;!e,n49;ri,urtn99;aMerLl98mIrGzzy;a,stG;en,in;!berlG;eGi,y;e,y;a,stD;!na,ra;el6OiJlInHrG;a,i,ri;d4na;ey,i,l9Ps2y;ra,s5;c8Vi5XlOma6nyakumari,rMss5LtJviByG;!e,lG;a,eG;e,i77;a5EeHhGi3QlCri0y;ar5Cer5Cie,leDr9Ey;!lyn72;a,en,iGl4Vyn;!ma,n32sF;ei71i,l2;a04eVilToMuG;anKdJliGst56;aHeGsF;!nAt0W;!n8W;i2Sy;a,iB;!anLcelCd5Vel70han6HlJni,sHva0yG;a,ce;eGie;fi0lCph4X;eGie;en,n1;!a,e,n37;!i10lG;!i0Z;anLle0nIrHsG;i1Bsi1B;i,ri;!a,el6Oif1SnG;a,et9iGy;!e,f1Q;a,e71iHnG;a,e70iG;e,n1;cLd1mi,nHqueliAsmin2Vvie4yAzG;min7;a7eHiG;ce,e,n1s;!lGsFt06;e,le;inHk2lCquelG;in1yn;da,ta;da,lPmNnMo0rLsHvaG;!na;aHiGob6T;do4;!belGdo4;!a,e,l2H;en1i0ma;a,di4es,gr5Q;el8ogG;en1;a,eAia0o0se;aNeKilHoGyacin1O;ll2rten1I;aHdGlaH;a,egard;ry;ath0XiHlGnrietBrmiAst0X;en25ga;di;il74lKnJrGtt2yl74z6C;iGmo4Fri4G;etG;!te;aEnaE;ey,l2;aYeTiOlMold13rIwG;enGyne19;!dolC;acHetGisel8;a,chD;e,ieG;!la;adys,enGor3yn1Z;a,da,na;aJgi,lHna,ov70selG;a,e,le;da,liG;an;!n0;mZnIorgHrG;ald35i,m2Ttru72;et9i5S;a,eGna;s1Ovieve;briel3Fil,le,rnet,yle;aSePio0loNrG;anHe8iG;da,e8;!cG;esIiGoi0H;n1sG;ca;!ca;!rG;a,en41;lHrnG;!an8;ec3ic3;rHtiGy7;ma;ah,rah;d0FileDkBl00mUn48rRsMtLuKvG;aIelHiG;e,ta;in0Ayn;!ngel2G;geni1la,ni3P;h50ta;meral8peranJtG;eHhGrel6;er;l2Or;za;iGma,nest28yn;cGka,n;a,ka;eJilImG;aGie,y;!liA;ee,i1y;lGrald;da,y;aTeRiMlLma,no4oJsIvG;a,iG;na,ra;a,ie;iGuiG;se;a,en,ie,y;a0c3da,nJsGzaH;aGe;!beG;th;!a,or;anor,nG;!a;in1na;en,iGna,wi0;e,th;aWeKiJoGul2S;lor4Zminiq3Wn2YrGtt2;a,eDis,la,othGthy;ea,y;an09naEonAx2;anPbOde,eNiLja,lImetr3nGsir4S;a,iG;ce,se;a,iHorGphiA;es,is;a,l5H;dGrdG;re;!d4Kna;!b2AoraEra;a,d4nG;!a,e;hl3i0mMnKphn1rHvi1VyG;le,na;a,by,cHia,lG;a,en1;ey,ie;a,et9iG;!ca,el19ka;arGia;is;a0Pe0Mh04i02lUoJrHynG;di,th3;istGy04;al,i0;lOnLrHurG;tn1C;aId26iGn26riA;!nG;a,e,n1;!l1Q;n2sG;tanGuelo;ce,za;eGleD;en,t9;aIeoHotG;il49;!pat4;ir7rIudG;et9iG;a,ne;a,e,iG;ce,sX;a4er4ndG;i,y;aPeMloe,rG;isHyG;stal;sy,tG;aHen,iGy;!an1e,n1;!l;lseHrG;!i7yl;a,y;nLrG;isJlHmG;aiA;a,eGot9;n1t9;!sa;d4el1NtG;al,el1M;cGli3E;el3ilG;e,ia,y;iYlXmilWndVrNsLtGy6;aJeIhGri0;erGleDrCy;in1;ri0;li0ri0;a2FsG;a2Eie;iMlKmeIolHrG;ie,ol;!e,in1yn;lGn;!a,la;a,eGie,y;ne,y;na,sF;a0Ci0C;a,e,l1;isBl2;tlG;in,yn;arb0BeXlVoTrG;andRePiIoHyG;an0nn;nwCok7;an2MdgKg0HtG;n26tG;!aHnG;ey,i,y;ny;etG;!t7;an0e,nG;da,na;i7y;bbi7nG;iBn2;ancGossom,ythe;a,he;aRcky,lin8niBrNssMtIulaEvG;!erlG;ey,y;hHsy,tG;e,i0Zy7;!anG;ie,y;!ie;nGt5yl;adHiG;ce;et9iA;!triG;ce,z;a4ie,ra;aliy29b24d1Lg1Hi19l0Sm0Nn01rWsNthe0uJvIyG;anGes5;a,na;a,r25;drIgusHrG;el3;ti0;a,ey,i,y;hHtrG;id;aKlGt1P;eHi7yG;!n;e,iGy;gh;!nG;ti;iIleHpiB;ta;en,n1t9;an19elG;le;aYdWeUgQiOja,nHtoGya;inet9n3;!aJeHiGmI;e,ka;!mGt9;ar2;!belHliFmT;sa;!le;ka,sGta;a,sa;elGie;a,iG;a,ca,n1qG;ue;!t9;te;je6rea;la;!bHmGstas3;ar3;el;aIberHel3iGy;e,na;!ly;l3n8;da;aTba,eNiKlIma,yG;a,c3sG;a,on,sa;iGys0J;e,s0I;a,cHna,sGza;a,ha,on,sa;e,ia;c3is5jaIna,ssaIxG;aGia;!nd4;nd4;ra;ia;i0nHyG;ah,na;a,is,naE;c5da,leDmLnslKsG;haElG;inGyW;g,n;!h;ey;ee;en;at5g2nG;es;ie;ha;aVdiSelLrG;eIiG;anLenG;a,e,ne;an0;na;aKeJiHyG;nn;a,n1;a,e;!ne;!iG;de;e,lCsG;on;yn;!lG;iAyn;ne;agaJbHiG;!gaI;ey,i7y;!e;il;ah",
    "City": "true¦0:62;1:5U;2:5A;a5Ib4Dc3Ud3Je3Hf3Dg31h2Ui2Qjak36k2Bl1Ym1Fn14o12p0Kqui1Tr0DsYtKuJvEw8y5z3;ag3uri45;abr1reb;a4e3okoha3K;katerin30r3E;moussouk47ng3Noundé;a6e5i3rocl18;ckl25n3;dho4Pnipeg,terth27;ll4xford;rs14sh3;ingt3H;a5i3;c09en3lni5T;na,tia56;duz,lenc1ncouv1Gr3;na,sav1;lan bat1Btrecht;aDbilisi,eBh9i8o7r6u3;nis4r3;in,ku;!i;ipo32ondheim;kyo,ron16ulouse;anj05l2Gmisoa5Cra2;e3imphu; hague,ssaloni28;gucigalpa,h3l av1V;er0r0;i4llinn,mpe4Ongi12r3shk2E;awa s0Etu;chu4Cn0p0G;a7e6h5ingapo4Lkopje,of1ri jayawardenapura kot0Ut3u3Yydn0Bão tomé;oc3uttga2J;col2Pkholm;angh3Aenzh44;oul,ul,v3S;int Al8n3ppo3Braje4Q; 5a'a,t3;iago3o domin35;! del ci3P;jos3salv5;e,é;v3z1X;ad0K;george3john3peters1V;'s;a8eykjav7i6o3;m4s3t4H;ar08e3L;a,e;ad,ga,o de janei2X;ik,ík;b47mallah;aGeEhDiCo7r3ueb3Tyongya3P;a4e3;tor1;g3ia;a,ue;dgori26rt3zn0; 4-au-prin0Qo3;!-no42;elizabe7louis,moresby,of spa3vi3L;in;ls3Brae4E;iladelph1nom pe13oenix;chi29r3tah tik30;th;l5na1Rr3tr2K;amari23i3;gi,s;ermo,ik0S;des0Js3ttawa,uagadoug13;a3Elo;'djame2aBe7gerulm6i4ouakchott,u3;ova d9r-sult0;am3cos1;ey;ud;ssu2w 3;d4taip3york;ei;el0F;goya,iro3Snt2Apl2Ass2Nv0ypyid3;aw;aBba2BeAi9o4u3;mb1Vni1S;gadisc6n4roni,sc3;a,ow;a1Nrov1t3;evideo,real;io;l0n0Qskolc;dellín,lbour2Z;drid,ju1QlBn8pu7r5s3;ca3eru;te;ib3se23;or;to;a4chest3dal0Ki2J;er;gua,ma;a15mo,é;'ava2aBi7o5u3vQy0W;anJbia2s3;a2Hsembur1A;mé,nd3s angel1M;on,ra;brev1Rege,longwe,ma4nz,sbon3verpo5;!a;!ss3;ol; 3usan2F;p4v3;allet0Rel24;az,la0Q;aEharCi8laipe7o4rak3uala lump6;ow;be,pavog4si3;ce;ur;da;ev,ga09n3;gsto4sha3;sa;n,wn;k3tum;iv;b8mpa1Qndy,ohsiu1Mra3tmandu,un0V;c3j;hi;l cai0Onche04s4̇zm3;ir;lam27tanb3;ul;a7e5o3; chi mi3ms,nia27ustZ;nh;lsin3rakliX;ki;ifa,m3noi,ra1Kva2;bu29iltU;aCdanBe9h8i6othen5raz,ua3;dalaja20ngzh3;ou;bu25;ac3bBtega,u1Wza;arU;ent;n3or0Jrusalemme ov0C;e0Noa,ève;sk;boro1Blw3;ay;es,r4unaf3;uti;ankfu3ee0D;rt;dmontDindhov0Or3;ev0;a8ha0Yi7o5u3;bl0Jrb0sh3š3;anbe;do3ha;ma;li;c6e4kar,masc3ugavpiZ;o,us;gu,je3;on;ca;aIebu,hDittà d9o3raio02uriti17;lo6n4pen3rk;agh09hag09;akGstan3;ta;g0Nm3;bo;el 3i san mari4;guatema0Bmessi4vatica3;no;co;enn6i4ristchur3;ch;ang m4ca3ttago02șinău;go;ai;i4lga3nber0Spe Irac8striD;ry;ro;aXeOiLogotKr8u3;c5dap6enos air9r3s0;g3sa;as;ar3har3;est;aAi6u3;sse4xell3;es;ls;d4s3;baY;ge3;town;sil1tisla5zzav3;il3;le;va;a,à;rmingh00ss4šk3;ek;au;i9l7r3;g5l3n;in3;!o;en;grad3mop0;e,o;ji3rut;ng;ghdSku,mako,n7r4s3;el,seterA;celo2ranquil3;la;na;dar seri begaw0g5j3;a lu3ul;ka;alo3kok,ui;re;aPbLccKddis abeJhmedHlFmCn9p1qaJs5t3uckland,şg7;e3hens;ne;h3maHunción;dod,g3;ab3;at;kaDt3;ananari3werp;vo;m0s3;terd3;am; kuwait,exandr1geri,maty;ia;ab3;ad;ba;ra;idj0u3; dha3ja;bi;an;lbo4rh3;us;rg",
    "Honorific": "true¦aPbrigadiOcHdGexcellency,fiBjudge,king,liDmaAofficOp6queen,r3s0taoiseach,vice5;e0ultK;c0rgeaC;ond liAretary;abbi,e0;ar0verend; adK;astGr0;eside6i0ofessF;me ministFnce0;!ss;gistrate,r4yC;eld mar3rst l0;ady,i0;eutena0;nt;shB;oct6utchess;aptain,hance4o0;lonel,mmand5ngress1un0;ci2t;m0wom0;an;ll0;or;er;d0yatullah;mir0;al",
    "Person": "true¦ashton kutchRbQcLdJeHgastMhFinez,jDkCleBmAnettIoprah winfrPp8r4s3t2v0;a0irgin maF;lentino rossi,n go3;heresa may,iger woods,yra banks;addam hussain,carlett johanssIlobodan milosevic,uA;ay romano,eese witherspoHo1ush limbau0;gh;d stewart,nald0;inho,o;a0ipI;lmHris hiltC;essiaen,itt romnEubarek;bron james,e;anye west,iefer sutherland,obe bryant;aime,effers8k rowli0;ng;alle ber0itlBulk hogan;ry;ff0meril lagasse,zekiel;ie;a0enzel washingt2ick wolf;lt1nte;ar1lint0ruz;on;dinal wols1son0;! palm2;ey;arack obama,rock;er",
    "Country": "true¦0:34;1:2R;2:36;a2Pb28c1Xd1Ue1Rf1Qg1Hh1Bi11jama33k0Wl0Qm0En07o06pYrQsFt8u6v4wallis et futu1xiānggǎng costa sud della ci1z3éi0Kís1Eösterreich;a20imbabwe;a3enezue2Yiệt nam;nuatu,ticanæ;gNkraji1n3ru01zbe0W;gher0ited states virgin islands;a8hailand0i7o6u3;nis0Mr3valu;ch0k3;meni2s e caic2E;go,ke2Qnga;bet,mor est;gi0Oiw2Xnz2T;aBeAi9lov8oomaali0Lpag1ri lan0Ztat6u3vez0wazi11ão tomé e príncipe,ām2H;da4omi,ri3;name,yah0U;fr2Nn kusini;i 3o di pales2B;baltici,uni0Y;ac1Len0;erra leo14ngapu2H;negRrb0ychelles;ha2Fint 3kartweEmoa0Jn mari0O;kitts and nevis,luc0vincent e grenadi11;e4om2Hu3;an28;gno uni12pubblica 3;centrafr6d3;e3ominicana república domin5;l3mocratica del3; congo;ica1;a8e7ilipin1So3uerto rK;l4rtogal3;lo;inesia3onia pols0D;! francese;nisola ib21rù;ki2pua nuova guinea,ra3;guay;ceano india06m25;a8e6i4o3;rveg0uvelle calédonie;caragua,ger3;!ia;der05p3;al;mib0ur18;a7ela19i18o3yanm0K;ldova,n4zamb3çamb9;ico;gol0t3;eneg0Nserr0Z;c8dagasc0Fl6rtinica martin5urit4yotte como3;re;an0i0Q;ique;a3dive,i,ta;wi,ys0;au,ed8;a0Ze6i3;b3echtenste0S;aKer0iyah3; nordafr1C;sotho,tt3;on0;a5en4ir3osovo,uwait;ghizi2ibaL;ya;laallit nuna0Iza3;ki2;ndonesia un,ra9s3;ol3raele;a di natale christm0Ne 3;c5falkCmar4vergini3; americaL;ianKshall;aym14ook;k,n (persia) īrān3; vici3;no;a6o4rvats3;ka;l3ndur0D;land;i3ya2;ti;aAha1i8olfo di guinea e,re7u3;a5in4yan3;a,e;ea,é bissau;dalupa,m,tema0H;c0na0D;appo3ordania al urdunn;ne;bKmb0;igi,ranc0øroy8;cu4esti vabariik,git3l salv4mirati arabi,tiop0;to;ador;a3omin0B;nmark,wlat qat3;ar;aAe9i7o3uW;lo5morRrea4sta 3;d'avorio,r06;! del nord;mb0;ad,le,na,p3;ro;ch0;m3naUpo verV;bog0erun camero3;on;aGeAh8irmZo7r6u4yelar3;us;lgar0r3;kina faso,undi;asile brasil,unei;liv0snia ed erzegovi1tswa1;utXār3;at;l4n3rmuJ;in;a3gium,ize;u mi3;cro3;nes0;ham4ngladesh,rbad3;os;as;fghane2lHmFn8otear7r3s sudMustral0zerbaigiM;abia saudita,gen4u3;ba;ti1;na;oa;dor8g6t3;arti4igua and barbu3;da;de;o3uil3;la;ra;er3;ica; 5b3;an0;ia;bahrayn,jaza'ir,maghrib,yam4;st3;an",
    "Place": "true¦aHbFcDdCeuropBfco,gAh9i8jfk,kul,l6m4ord,p2s1the 0upEyyz;bronx,hamptons;fo,oho,underland,yd;ek,h0;l,x;a0co,id9uc;libu,nhattan;a0gw,hr;s,x;ax,cn,st;arlem,kg,nd;ay village,reenwich;a,e;en,fw,own1xb;dg,gk,hina0lt;town;cn,e0kk,rooklyn;l air,verly hills;frica,m0sia,tl;erica0s; 0s;centr0meridion0;ale",
    "Region": "true¦a1Xb1Pc1Fd1Aes19f16g10h0Xi0Vj0Tk0Rl0Om0DnXoVpQqNrKsBt8ut7v4w2y0zacatec1Z;o03u0;cat15kX;a0est vi2isconsin,yomi11;rwick1Nshington dc;er1i0;rgin1Q;acruz,mont;ah,tar pradesh;a1e0laxca1Busca9;nnessee,x1P;bas0Jmaulip1OsmI;a5i3o1taf0Mu0ylh11;ffUrrZs0W;me0Yuth 0;cRdQ;ber1Gc0naloa;hu0Qily;n1skatchew0Pxo0;ny; luis potosi,ta catari1G;a0hode6;j0ngp01;asth0Kshahi;inghai,u0;e0intana roo;bec,ensVreta0C;ara3e1rince edward0; isT;i,nnsylv0rnambu01;an12;!na;axa0Ldisha,h0klaho19ntar0reg3x02;io;ayarit,eAo2u0;evo le0nav0J;on;r0tt0Pva scot0V;f5mandy,th0; 0ampton0O;c2d1yo0;rk0M;ako0W;aroli0T;olk;bras0VvaZw0; 1foundland0;! and labrador;brunswick,hamp0Fjers0mexiIyork state;ey;a5i1o0;nta0Lrelos;ch2dlanAn1ss0;issippi,ouri;as geraEneso0K;igOoacO;dhya,harasht02ine,ni2r0ssachusetts;anhao,y0;land;p0toba;ur;anca02e0incoln02ouisia0B;e0iF;ds;a0entucky,hul08;ns06rnata0Bshmir;alis0iangxi;co;daho,llino0owa;is;a1ert0idalDun9;fordS;mpRwaii;ansu,eorgVlou4u0;an1erre0izhou,jarat;ro;ajuato,gdo0;ng;cesterL;lori1uji0;an;da;sex;e3o1uran0;go;rs0;et;lawaDrbyC;a7ea6hi5o0umbrG;ahui3l2nnectic1rsi0ventry;ca;ut;iLorado;la;apDhuahua;ra;l7m0;bridge2peche;a4r3uck0;ingham0;shi0;re;emen,itish columb2;h1ja cal0sque,var1;iforn0;ia;guascalientes,l3r0;izo1kans0;as;na;a1ber0;ta;ba1s0;ka;ma",
    "Currency": "true¦$,aud,bTcRdMeurLfKgbp,hkd,iJjpy,kHlFnis,p8r7s3usd,x2y1z0¢,£,¥,ден,лв,руб,฿,₡,₨,€,₭,﷼;lotyTł;en,uanS;af,of;h0t6;e0il6;k0q0;elN;iel,oubleMp,upeeM;e3ound0;! st0s;er0;lingI;n0soH;ceGn0;ies,y;e0i8;i,mpi7;n,r0wanzaCyatC;!onaBw;ls,nr;ori7ranc9;!o8;en3i2kk,o0;b0ll2;ra5;me4n0rham4;ar3;ad,e0ny;nt1;aht,itcoin0;!s",
    "Ordinal": "true¦cIdDmilBnoAotta9qu5se2t0undEveJ;erzo,re0;dCntI;condo,dBs1tt0;aFiH;saEto;a1in0;d7to;r0ttord6;aAto;ntAvo;no,va8;i0l8;ard7on7;eci7ici1od0;ic5;a0o1;nnov3sse0;tt2;e0inqua0;nt0;esi0;mo",
    "Unit": "true¦bHceFeDfahrenheitIgBhertz,jouleIk8liGm6p4terEy2z1°0µs;c,f,n;b,e1;b,o0;ttA;e0ouceD;rcent,t8;eg7il0³,è9;eAlili8;elvin9ilo1m0;!/h,s;!b6gr1mètre,s;ig2r0;amme5;b,x0;ab2;lsius,ntimè0;tre1;yte0;!s",
    "Infinitive": "true¦0:0LA;1:0L9;2:0KS;3:0KW;4:0L8;5:0L6;6:0L4;7:0K4;8:0KK;9:0JF;A:0J8;B:0IQ;C:0KA;D:0K7;E:0FN;F:0JD;G:0JZ;H:0KH;I:0II;J:0GO;K:0KZ;L:0I3;M:0L2;N:0JN;O:0L5;a0C8b0AQc04Vd00OeYQfX4gVQiQ9lP9mNTnNEoMHpIFquICrC1s3Ht1Eu0WvVzP;aSe5iRoQuP;ccOSfo5ma0;c0JWmGpp0FA;mb0K3ttH;mpPpGvor3;et2il5;a0Ie04iWoPuo2;cTga0lPmi0F2r04ZtH;aQe0gPle0t09Zve0;arBe0;nJCre,tiP;lBz8;a0iP;a0fe3;aEb3ci4diFe2gVlUncTol0JDra0sRtQvPz1;e0i0AR;a0tor1u03J;a0iPta0u05X;o4ta0;e0i0o5;ip0J8leE;e0i5l1;cLd01gZi0JClYnUrRsQtriPzzeE;fi6oXU;ci6sa0ti0;b05Pdi0gQi0AHnPsa0te0;a0ic1;a0e0og4;a0dQe3g1i0tP;a0i5o5;ePi6;mm1re;a0eEle0ocB;e2gPl1;h1ia0;e0o0JI;cUda0gSlRnQrP;a0ca0ia0;a0eEga0i089ta097;ca0e0iAHla0or0FEu2;aPheEi0l1;b0CQre;a0ci4il5;b02cc01di0f00gZlYmXnUrTsPt05A;a0ciUNo5tRuP;caG7fr0BXrP;a0pa0;io4o5;ge0i4la0ta0;ge0iPta0;fPre;i6orF;et2il1;tiFu5;gi09LuaO;fic06Jiz1;ellNRi7;bQiPrR;ca0di0;i0EWrP;ia6;a1Ke17i13o0WrSuP;ba0f093o4rQtP;a0e5;a0bNJna0;a00eZiWoRuP;cPfM;c0HUiA;gl1mbRnQttPva0;a0er0I9o5;a0ca0eE;a0ePiz8;gg1t2;bQl5ncPonMpYOs2t0ANunM;a0e3;o5u2;bb1m08ZpiA;b0Fc0Ed0De0f0Cg0Bi02Ula0JBm09n06p04r03sWttUum0CHvP;aReQi3OolP;ge0ta0ve0;rCsN;gl1lPsa0;ca0i6;a0eP;gg1ne0;a0J7borAcTe0HLfRgre0E6lQm057pPtul5uA;aJi3or0CV;a0o6;eJiRRoP;n7rF;en7i4oPri0BKu3;la0rOZ;re,uG;aPe5iZI;na0sC;c1gug1quill0DUsP;a0corOUfPi0F9por2;eJorF;aYBetKoPu2;n2rN;ge0h0C1;eJfi6ig9uD;e0i0ur0;an4c1iF;al5oc6;c6el0BWg0H0lUma0nTrQsPt03H;a0si07Zta0;ce0m0BQnPreMtu3;a0ePiTK;a0gg1;a0da0i084;et2l0AP;fa0g0EUmb3nQra0tP;o5u0FY;ge0tP;eEin4;d1leZmWnUrRsPt2;a0se0tP;a0imon1;gQmi4rPza0;i0orB;e0iv09V;d0B0e0tP;aTFen4;atBe0pP;ePo0CSra0;ra0s2;fo4gPm0B3trasm041;raMuiA;cTfa4gliSmRn9ppQrPs0I2t0FBvo5;a0da0la0taO;a0ez8;bur0GIpo4;a0uz8;cPe0i2;a0ia0o4;a7Vb7Bc5Pd5Me55f4Qg4Gi48l46m3Xn3Uo2Gp1Gqu1Cr1Bt0Iu01vP;aYeSiRoPuo2;gl1lP;a07We0ge0ta0ve0;a0g4l08Nn0G2ta0;cLgli0AHlTnRrPsNt2z8;gPna0;i4og4;a0de0i0tP;a0o5ra0;a0le0ti0;ga0lPni0r1;ig1u2;b04cc03d02f00gYiciAme0nT9oXpUrTsP;ci2sPtit090ur3;eg08ZiQuP;l2me0r3;d1sK;clTCgeEEroD;erQpP;li07Kor0AX;a0bi0va2K;la0na0;a0geP;l5rC6;fPo5;o6raD;a0divi7;e7h1ia0;affit2ent3iYRliFor015;a0Ce09i07o05rSuP;c6d1fa0pPra0z072;eMiPra0;di0re;aVeTiSoQuP;c6g9sc1t0ES;fi4mb5QnPpi0GJz8;ca0za0;a0de0g0F9l5ng09Ksc1to5z8;ga0ma0pPsC;e0i0AD;b0BOcc0ESda0fa0go7lTm5LnSpRrQsci6t0GBvPz1;ac6e7in0ENol9;iGre;az8pa0;a0go5iRJ;c1la0;c6ia0na0pGrP;ce0di0ia0mi0na0p1;gm09Hl0AYm05Yn9pPra05Sva0z07C;a0end1u5;ccQ9mYSnQrPsse0;eotiGilBmi4za0;d095ta0;bili06Hcc0EFgSl5mGnRpGrPsa0t07WzI;a0e,nP;a06FutH;a0ca0ga0z1;io4l1na0;a03AoCI;aQiP;l5tN;d3gl1li05OrPsC;c1ta0;a0He07i00l0E8oVrRuP;lc1ma0n2tP;a05Bta4;anDeRiQoPuz8;f087loqu1na0vve7;gIz8;ca0g1me0z8;d04Sgl1lSnsIWpo5rRsP;a0sPta0;a0eDU;ca0ge0re,t51;pa0ver0AM;aTcRega05VfDGgQl5nPo086rZD;a0g08Hto4;a0ne0o5;a0cP;a0i03Y;cPgg1na0re,z8;ci6e0;cWd05Sgn08BlUnTrSsRttQzP;ia0z05Y;a0e081i4;a0sa0;a04Gde0eq0CPge0im08Io4pe3;de0ge0n4Nsa0;aPla0;cLga0re;ch1iPu5;alBfi6;cc0DCgl1lTn7rSsRuJv08CzP;iPz04P;a0enN;iFsa0;a0e04Gge0i0la0paOti0;aPleEma0;n6re;bb10c0Xd0Wf0Sg0Pl0Mm0Jn0Ip08r04s00ttVvP;eTrRveP;nPrN;i0zI;aPiQX;ccaRZpp092s2;ni0rL;a0CUeSiQUoQraP;g9r0;lin0AEm00Rp08YsPva04;c023ta0;n7r3;pRtP;aPen5Wit069;n0B3re;eWBiZV;bi0ge0mZXpRrQs037tRCvP;eOo5;eg9i7;asCr0CP;i0pVrP;aPiQG;fMggiV0nnoMZre,sSvP;an8vP;aPe0BYi06U;lu2;se7ta0;eQiUSor07YrP;esCi009;ri0sa0;a0da0nB5;atBiOmP;a0ePini09B;r9tK;a0DTca0da0e02RlPve0;ePiR2;ci2ti6va0;gPna0;et2hVGiP;a0BYo0ACun9;fPis0BD;erZEiQo6riP;g9re;a0t2;disMisMomB;cPiYL;hUMoP;mbe0rJN;aPol0DO;l8r6;eQifMoP;b0B4ccX4da0;l0DKr0CH;aVeTiRoQuP;o060sC;n2r8;cc1nuPs2;i0z8;nNrPtKz8;c1da0;gMIltHnPrW7scGL;ia0t0BX;aPeDit2og08V;cc1nc1;bi5cu3de0gVlUmSnPsteFt0CK;cQda6ghioz8tP;etBonB;e3ronB;bolPp066u5;eEiz8;eURla0AL;il5la0ni02N;aWe5hign1YoUrRuP;aPsc1;lOKrAz8;aPe9AiA;nPva0;a0c04PocL;b0ADccWDla0mPnf1rDz8;b09Yen2i4ma0;mPnc1r3ttaWB;a0b060;a00erZiXoTrQuP;gRJma0;aQePi05Aut2;cc1g0AS;c0B8t2;c0AQde3gRlQnArPtK;a0ma0na0za0;la0ti0;a0g1l1;an6dPgu3la0ni0orH;a0uc1;ra0za0;ccQma0re,sc1ta0vP;il5oJ;hi4ia0;c04d02g01l00mYnWpUque07IrTsRtQvPzI;e3iz1;a0C0ta0;sa0tP;a0upRC;ba0e4ia0peEra0vH;a3e0C5pP;el0C4ia0;sibX0tP;a0eTRi0;bPen2i4pQ4;ia0ra0;c1ezIla0;a0na92reG3ui05N;a0ePim052u09B;nt00Kre;a0ca0er089onAre2;a0eg4oga4rP;a1ucP;cVBi0;a0We0Sh0Mi0Fle3oXrTuP;ci0lRoQrPsa0;a0eEi0;ce0ia0te0;a0BEet2;eRiQoPutFD;c6l5sc1;cchV3t09Jve0;di2po5;cc09Nd05glIl03m01nWorVOpUrQsPt2Rva0;c09Psa0ta0;aRc1da0eEge0rQtP;a0e0B6i6;az8e003;ggiMDre,z8;a0ePi0Api01Uri0;rLt2;cer2fRgQnXAos09BquNCsiOtPvZT;a0en2ra0;e5iu3;esCiP;g9na0;busso5mX5oApPuX0;ar0ANiOor0;a0lPorHpHta0;a0eD;a0el5inLZ;aTmmi00NnSoQpPre,uGvo5;a0i05Ypa0;c6g09Bpe3rP;i4re;de0tLZ;cq087laPma0re;cq086re;eSiP;aPe3fa0oc6uXMva0z8;cc1ffZEmPn2rHt2v05O;az8;da0gg1rP;mHni0za0;g090lRmQ1nQrP;ne0re,v098;de0eE;e3le3;cc68deZMg01l00mZnVpTrRssEAtQvaPz8;l6re;e4o5ta0uJ;aPce3di4i6pa0seEta0;bHFv03K;a0pP;a0el5;dQnPsa0;a0erB;aPe0i0;gl1lB;b1pa0;a0c1da0fi0pi2za0;az8io4l1;a01e00iYloc6oVrQuP;c092d08QfMr3;aSiQoP;do5gl1n8;cTKgPna0;a0l1;cc1i2na0;cc083lQrPs6tt007;n1ra0sa0;l07Cog4;aPgGWla06Drc1zJQ;di0n6;ffeElOY;ci9IdiOgl1iafMlTnSrQtPva0;acLte0;aPba0ca0ra0;gl1z8;ca0da0;lPor04Mza0;a0ot2;b00cZet2gYlTnSpQtPve0z1;isMu3;e0oP;niZ4rH;a0ci0gFUtiZ3zI;a0da0iSpa0tQu2vaP;guarAre;a0eP;l5r07Z;re,va0;g1oF;c2SriYW;b1o2;a4Ve3Xi00oSuP;bQgO1l5mPo2sCt2zK5;i4o03V;a0ri6;d01Yga0l5mVnUsStRvP;e08ZiP;na0s2;a0ea0o5taF;icPo5;a0ch1;cZ1fa0za0;ba0pe0;a33b31c2Kd2Fe2Af24g20l1Wm1Fn11or10p0Ps07tZuXvPz8;alVeRiQolP;a0e0ge0ta0uzIve0;n06Usi2ve0;de0la0nQrPsN;be3i0sa0;dPi0;e0i6;eXDu2;ni0sPtTK;a0ci0;aVeTi3ma0oRrP;aPo07H;e0g9r0smUJt2;c6na0rP;ce0na0re;leVPnP;e0ta0;gl1rA;a05c02e00iZoXpTsa0tQuPveO;cLl2o4sLD;aQo3rP;in9ut069;bi089g4re;arm1eRiQl06GoP;l0Tn7sa0;arFeDn9;cLdi0n7t2;lPna0r9;le070ve0;ca0e7;de0nNrP;ba0vH;aQen7hiar057iacq05BoPri00HuoK;nt3pJte0;lAt2;l05Sna0pe0rJI;aXeViUoSrQuP;d1g4li0;e3Xis5VoP;dD5mTSp01Zva0;ne0r01GsPta0;a0izIse7;an9eDgl1o007re;nCrcPs6te0;orDLuoK;ga0rPsCti0;a0la0ti0;di4gJ2;as05KcZevi6fXgWnVoUsavi0tSun01VvP;eQiP;a0goJ;ni0r02F;a4oPra076;c6m04X;mi4va0;eDo069;agliar02Ah1iova04Xraz1;a071or8rP;an6es6;aQhO4oPres059uo3;glio04Tmi03Pnt3rD5;ra0sa0;a02bZeXi3oVpQuP;gi4ne3oZM;atr1iQroP;ve3;aQccio071nP;g04Cza0;g03Dn9z8;n2rPve0;ch1de0;d1mb3na0sPtK;co5ta0;aQec6oP;c6m04CrC;l8mDP;nQrPs048;ca0e,gi4;da0e0g1;aQePu04P;gQXva0;nc1sP;c1sa0;a0eRi3ov01KuP;aPrKQ;d04SrA;ne3t2;a0eJiTlP9oRran9uP;gPl9sa0;gi0ia0;cHGndZ7rP;ma0ni0;la0ni0oJu2;cSde0lRmQnt3piloDsPvo6;aEUci0se0uF;er9pi03J;abo3eg9;heE;aVIda0eSiQoPu03J;na0t2ve0;cSTme4Mp0Zre,sPven03Z;c04AtribXO;fi03Nre,s2terEM;a03e02h00ic5oRreQuP;ci0o040pe3sa0;a0de0s03Z;g04AlleDmVnSpRrQstPve3;itXIrXI;da0i6re0;ia0ri0;c00UdB6fQgiMFnRTos03Uq0DsPtaW7;eg4ide3;erFor2;anAi028pP;aJenCor0ra0;eBMiP;aFe7u7;de0r6ve0;cc1de0l6mPpi1Yri6s6t2va0;a0b1;aPel5ol05Jut2;di0l2sCtteVP;b03c00ddormYMffZgga01ZlYnXpUr7sSttRvP;e0vP;i02Col9;ac6i04B;cN0sP;i1CorC9uRD;pPri0;aPen7;ciUVri0;da0iF;la04Yza0;erFio3;cQqP;uis2;a7en7omp03D;bQiP;li2t02D;asCra04R;a0Lc0Fd0Cf0Ag08i06l05m04n02pZqL2sStQvP;e5isIo6;a0oI1rPtST;ar0ibWIoce7;cin7et2isKolXDpTtQuP;l2sHV;aQitWFrP;in9;re,u3;iQ0onP;de0sabPM;ePli6riQPu2;lVWrPte0;e,i0;a0dPo03I;e0icPX;a0uNA;azIeD;nPte3;seJteg3vXL;a5ge0iZMna0olaPreZE;mXJrB;eJlQDuP;l9ta0;arQdi0iPu01P;ge0mXGre;e,gVVre;aTeSiRlPuMN;amZ4i4uP;de0ta0;de0n00Ita0;de0nK8pXAre;lcXDpi2re;gi0lB;bb0Rc0Ld0Jff0Hg0Blle0Am08n06p03reMsYtUvRzP;ionOUzP;ia0o5;a4vP;e7iP;a0ci4sa0va0;ea0iTHtP;opGrP;apPistH;pi0;a0ch1en2pa0sPtr02D;eRiQoP;da0miO;cu3;g4re4t2;a0e0iN1pP;or2reP;n7sWP;nPto5;icLu001;a0mPpi6;aGKenPZol03G;g3n2;gPio4l1;iRomiQrPuaO;inU9upG;to5;a0ra0uP;gZNnZM;iPor8redA;gu3na0;dPe0iRKu4;o029rB;cPimo5;aRhJZoP;g01FmanAn2pp1rP;c1da0re;pPt2;ez8ri02Q;erc1o00KriviXXu1;aQePie2o2;re5stI;d3gl1liSHnCZ;a38e2Mi25la24o1Ur00uP;bYgnWlVnRrQtPz8;a0reM;a0ga0iSD;ge0i0tQzP;ecL;a0eP;gg1l5;i0lu5sa0;aPe0;la0re;blicXGli6;a1Ge0Oi0MoQuP;de0ri0;c0Gd0Ff0Cg0Ai09l07m04n03pXro8AsTtRvP;a0ePo6ve7;de0ni0;ePocDHrKB;g9n7s2;ciRegTXpeQsiFtP;itTWra0;ra0t2;og00LuD;aDeTiSoQuP;g4lC;ne0rP;re,zI;na0z1;lTBn7;osZIta0unWD;a4e0NoQuP;lDoUH;ve0zI;iPunD;fe3;bi0et2;et2rP;amFeWS;a4eQfeJiPon7uF;la0t2;ri0sCtWN;iDuZ3;a01FeRlaFrPu3;asPea0;ti4;de0sC;meEncip1vP;a0ileg1;a0Fc0Dd0Bf09g07l06m03n02ocHVp00riscalAsTteJWvPz8;aReP;de0nP;i0ti00C;le0ri6;aG7cUeSiRsa0taQuP;me0ppVJ;bi01Bre;d1e7;de0l5nPr006;tHz1;egZKin7riTP;a3ePor0;nsI;asZ5de0o2uIT;eQia0uP;ni0ra0;re,tK;eZXu7;a0iPus2;a0uO3;a0eJiP;gMDsC;a0iPo9G;cTOli9re,spV1;e7iPlu7or6R;de0pi2sa0;ccen4mbo5nnuX9;li4nPti6;de0za0;e2gg1lXmWnVpGrTsQtP;a0eIC;a0izIpUTse7tP;aS4ePiUQu5;gg1rD;ge0pore,re,tP;a0en7;de3e0;ic1pa0;emBi0la0tJvOW;cOSg1na0sFuVD;aXccWeVgUlTnSoQpa0roTMsPttRHzzU5;c1o5;mXUvP;e0igQR;ge0za0;a0o2;ia0l1no3o5;ga0na0t3Z;a0hiQN;cTgRl5nPre,t2z8;a0eEgPiPPta0;e0iSo5;a0e0g1nP;e0uYE;eQiP;ucL;re,voCU;c6d09gg3Hla0n07pa0rSsRtP;e0tP;egolOHi4;a0ca0ta0;c01d00egri4fZiYluUZmWnPFo3petVqFVsStRvP;a7eP;ni0rN;eW3urX8;eQisKonPua7;alBiP9;guiTBve3;ra0ua0;aVYePu2;a0tK;co5oAre;ezIo3;e0o4u3;epSLoPuoK;r5Cte0;aQWd2Cet3iKnXZsPtSJzo5;a0io4;a5i4;c05dro04ga0l03na0pGrXsTtRuCvQzP;iSEz1;en2o02;iIMroW4tP;a0eEi4ui0;c24qWHsQtP;iYVu3;a0eEiP;o4re,va0;aTcP4eNQiONlSod1tP;eQiPoJuJ;ciGre;ciGgg1ne0;a0ot2ucL;fraCgo4lBre;a0eClNIpIK;neE;a0ch1iTH;b0Icc0Gd0Fff0EggetV9l0Cm0An08p05r00sSttPvv1z1;a0eQimTOuP;n7ra0;mH4ne0;aVcUpi2sRtP;a9XePi4rQ9;gg1n2;eQiP;da0ge4;qu1rXGssI;il5u3;n4re;a0bi2diHVecLgRiPla0mN3na0;en2gPna0;i4l1;aPoO;nBsF;e3i4pPri0ta0;oPriKB;ne0r0;dPo3;a0eEu5;aEbrMTetKoP;geneBloD;ez8ia0trP;aEepA5;eGGic1ri0us6;i91o3;asIhiMNi7lu7or3YuP;l2pa0;bQeSXiettWUliPnubi5;a0ga0te3;eSViR5liD;aYeUiToRuP;da0me3oPtriO6;ce0ta0;ce0ia0leEm1JrmIMtP;a0iNDta0;cLdiNCtJ;cessi2gRt2utrIJvP;a0iP;ca0sL;a0li9oz1;r3sRtQuPviD;fraDsT7;a0u8W;a0cPt3;e0on7;a0Ke0Ci03oUuP;da0gRltQnUPoPXra0sR7tP;a0i5ua0;a0ipCI;gPo5ug4;h1i0;biliWdTlSnRrQst3tiW7vPz8;e0imQE;a0d1Ii0mo3si6tiMU;da0itorS4ta0;a0ce0es2la0tipCB;ePiMR;l5rP;a0nB;ta0z8;aWeKgVllDKmUnSra0sPtiD;cQe2Ysa0tPu3;iMLu3;e5h1;aWQge0iP;mBst3;a0etB;l0Fra0;go5u5;diSHgl0Dla0mVnUrSsQtP;odBte0;cPta0u3;e0o5;a7AcaPenAge0i2;n8Hre;a0dQEoFti0zI;orB;c06eRRg04l03mFnXpGrUsQtP;erJ1riUXt0AurH;cRsaQtP;erBi6urU0;c3gg1re;he3;a70cQi0VtP;el5or1;a0h1i7C;ca0dTeL0gSiRoQtePu1S;ca0ne0;mI9v3;ca0e3fL7po5;anUTiMR;a0u6;a0di0eR4ig4trat2;a0gPl1nK0;io3;chiT6ePi4;l5ra0;a0Ce03iXoUuP;bScRmQnDsPtRO;inDsa0t3;a0i4;ci6e0iAra0;riLH;cQda0gPnRErAt2;i6o3ra0;aNBuple2;bTceSevi2mRnc1quQsPtiDvUD;a0c1ta0;eMiA;a0i2o4;nz1re;a0e3ra0;cWde0gTnTHsRvP;a0iP;ga0ta0;iPsa0;na0o4;aMZgQiPna0;fe3ttiF;e0icL;ca0e0;cZg4mXnWpiArVsUtSuRvP;a0orP;a0icL;da0rQW;e0iPra0ta0;na0ta0;cTBsa0t8A;ga0va0;c1gMQ;a0biPen2pJQ;c6re;cT6e3riF;bQ0d52gno3llu51m3QnZpYrUsPtalia4;cICo5pRsa0tP;al5iPrMK;ga0tMJ;ePi3;sAZzI;a0e,onBrP;ad1eNiQoP;busNga0mEUra0;de0gPPta0;notBotB;a3Bc2Ld2Be29f1Tg1Ei1Dl1Cn17o15qu13s0StYumiPOvPzupG;aVeSiRoP;ca0gl1lP;a0ge0ta0ve0;a0d1gi5sLta0zLI;cLi0ntarQrPstiD9tJ;a0ti0;e,ia0;de0gMBlPsa0;e0iA;a0He03i01oYrPui0;aTeU5iSoQuP;de0fo5;dPmGC;ur0;de0ga0sN;lc1pRre,tQvP;e7ve7;teQL;po5rSE;nQrPsAM;bidHpiP3;aKFti0;epiP1mPn9rizKZto5;a0iP0oJ;g3n01rRsP;se0tarP;di0e;aXcUdi0esCfTloqLJna0pSrQse6vP;eRIis2;a0oP;ga0mDW;el5or0re2;aTJeJ;a5eQorP;re0;de0t2;gi0re;de0eJsiJ9ta0;c6gl1rs1sI0vo5;aWcVeUiToSpi3tQuP;d1Pl2;aPitL5rL5;l5re,u3;r9spetN;d1gR2nQSsK;d1gEKri0;e4riLW;ngQpoP;na0ri0;ui4;ad3iP;e2na0si0;lt3nArP;gogT7riO6;aSePoS3;gg1rvQsP;ca0ta0;a0o97;ff1l8mo3;e1ib3;bi0et2mi6zFI;a02e01hi00iXloQIoUrQuP;a1r75;aQesCoP;pGsC;nPsCviAz1;a0di0;bQia0lPmb3rDz8;fa0la0;bi0;alSQganNnQuP;n9r1;ocL;otN;g4lo8QntiSMri0sC;bb1gg1n4rbuO;a02e00iWlUoSrQuP;o6r1;aPeddoSI;d0Mn9;ca0n7rP;ca0ma0na0tu4;ig9uP;en8i0;aRc1eJg9lQnPsLtN;i2ocL;a0t3za0;ccK3mF;rPs2t2;i0ma0o3Tvo3;ma0nDrPstiN5tPI;ci0i4;br1rP;i0pi6;aDeWiSoRuP;ce0g1l9rPstriCV;a0i0re;sCvi4;a0cMVetMNgRrQspPvidPA;etNor0;e,iz8;e0na0;bPnnBt2;i2oRT;a07e04hi03i02l01oVrRuP;ba0lG5nNEpi0rPte0;io7Uva0;eRiQoP;c1s2;mi4na0;mKRsG;gPYlSmRnt3rP;aG9nPo4po3re0;ic1;be0iO0oA;lPpa0;a0eJ;i4u7;amGde0n9pr1ta0;appKMna0oA;de0nPpGra0sKC;dPVeJtP;iQ7ra0;gl1l8mUnTpSrRsPte4vo5z8;i4sa0tP;o4ra0;ce3i6na0ta0;oORpa0;ta0uN;mi4;b62ciM1ff1lRrQspJuP;gu3;ca0iLZ;a0be3za0;aHFb0Li2m0FpP;a09e06i02l01oWrRuP;g4lCn2tP;a0riLU;aticIOeRiQoP;n2vviC;gIme0;ca0g4n7sPzio6V;sIta0;ne0rRsPveJ;sPta0;esCibi9R;re,tP;a0u4;emJPi6o4D;an2ccOOeQgPla0;l1ri0;ga0tP;o6Kri0;di0g4lHOnQrP;a0maQEn1so4vI2;na0sieJ;ccSdroNYlRnQrPs2t2uJzzH;a0en2ti0;a0ta4;a0liL8;a0hJHia0;aSeRiQoP;bB3la0rta5;g3sL;deJMr9tK;gPtriOH;azzi4i4;aZeYiVoUrQuP;ca0r3;aRoQuP;ni0tN;gl1nc1;cc1t2;c6s6ttiGH;ancQbi0onKTzP;zarJ;a0hi0;lPRstiaPRve0;cuc6lQnKPrPsNtKvaO;az8ca0;la0saF;de0mi4st3;ePolat3ra2;aH4nP;tiF6;a0Ye0Rh0Oi0Al09o04rWuP;aRerQfa0iPs2;da0na0z8;i0reE;daRiQl11rPs2ta0;da0enNi0ni0;o5re;gnFWre;aQe0IiPonAugMX;da0gl1;cTdSff1n9FtPva0z1;iQtP;a0ug1;fi6na0;a0i8Kua0;ch1iA;cciEMdSff3mi2nRrgQvK3zzoP;viO;heEoO;f1go5;e0ro4;isCoriJM;aMYb01ng00oWrTt2uP;bi5ca0di6gLAlebMFnRo6ra0stP;appJ2iP;fi6z1;ca0ge0ta0;a0eDLoP;nPvaD;zo5;cQiPst3va0;a0re;a0hPo5;erN8icL;il5;ol5;erQiP;aO9g4;mi0;la0meUnSrmRsPt2;sa0tiP;co5re;i4oO;ePuflAC;raFU;l5re;bLSlQrPsa0tNXu7;anNba0eEri0;lCUopGvP;anB;a0Ve0Si0Jl0Ho08rVuP;ci5gTlSma0nRorPra0stiD;iusPv1;ci0;es2ge0zI;ge0mi4;a0gi0;aXeWiToRuP;ga0i0l5sPt2;c1tLL;da0nP;teE;gQni0zP;io4za0;ge0na0;cc1dAgLVme0na0quGVs6t2;cRg3iQmmGUnPppHWstor4tLOzI;a0ca0ge0tuF;ntLV;asC;c8Fde3gWlVmGQndUrRtP;oPte0;cop1g6Q;aC7bi0g1mPniDUtiD4za0;aPiLVu5;lBre,t2;a1Ae0;go3la0;g1l1;agLYetKir2ot2uP;i0ttKN;aWc6daCDgVlUnSoQrFsPt2u2;a0chiDRsa0;ccPnAri0;a0hGG;aPge0i0ta0;lBnz1;a0ma0osoMt3;ge0l1u3;c6mmeEncD5ta0;cFCli02n7rQsPte0;su3tBN;i0mL6ra0t7Wve0;b01c00gYlXmWntasKFrTsStRvP;el5orP;eEi0;a0i6tu3;ciJYtid1;ci0e,fPneKA;alPuO;leE;a0iliBE;c1lHsAL;l1oP;ci2;e0i5QoltB;bPri6;ri6;c1Id1Fff1EguaOiacu5l18m14n11qui0Yr0UsVtUvP;aSiRoP;ca0lP;ui0ve0;de44nKGra0ta0;cJQde0ngelBpo3;er4ichFM;a0Lc0He0Ei0Co09p00sXtPulI1;as1eUiToSrP;aQoPu7;m89v6Q;da0n1po5r0;lDGrK8;ma0ng6WrGva0;nPr4;de0ua0;ePic6uA;gDOrP;ci2e;aWeUiJPlSoRrQuP;g4n9;i7Zopr1;ne0rFM;e2ic5LoP;de0ra0;di0lD3riPt2;mEYre;n7tr1;nQrP;cBdi0ta0;da0e3;bi0ge0lPme0sKta0;a3ia0;cQgD8mpPn2rciFB;liB7;ra0u2;i0lRoQuP;sa0te0;gi2;aFu7;cerIYge3lH4mi4s3UuP;di0ri0to3;eRge0i9oQra0uP;di0t2;de0ga0m5D;d4Zg9;lib3paQvP;aCHo6;gg1ra0;com1fE8tQuP;clGSme3nc1;ra0usiasF;aQePig3ozIpiIEu5;nAr9tK;nPrBI;a0ciG;aSeRiQog1uP;cub3de0;de0ge0mi4;g9moD9n6va0;bo3rP;gi0;ettI5ig1on7;iQuP;cDLlco3r0;fi6ta0;cQheElPonomB;isC;ePi2;de0lBVpi0ttHY;a3Qe2Fi05oVrSuP;bQce0el5pPra0;li6;b1i2;aQe4iPoD;bb5z8;ga0mmDHpG;cXlWmTnKBpSrPsa0tG3ve6Z;a0mP;en2iP;cLre,ta0;a0p1;aQesHQiP;cF9na0;nAre;a0e0o3;c1e0umDA;a1Xb4Mc1Vf1Og1Ll1Gm1Bp19r14sWt2vP;aUeSiQorPulD;a0z1;de0e2nPsa0;a0co5;de0lB8nHVrPz8;be3ge0s7Uti0;ga0mGri6;a0Ubos6c0Nd0Le0Jfa0g0Hi0Alo6m5Wo07p01qZsVtPubbiEV;aTen7iSoRrPurHE;ar0iPug9;bBFca0;gI5rHT;l5ng4H;c6nz1re;angH1eRiQoPua7;c1da0lC6;mu5pa0;mi4nNppelJMr2ta0;uiP;si0;arHeSiRoQrePu2;g1z8;ne0r0sa0;aHHeDn9;nPrDBt2;de0sa0;bbeECcQno3rP;di4iCH;cuG;dUllu7mp3WnP;cSfCItP;eQosP;si6;g3resC;an2;e3ra2;e5iPreDus2;un9;g4rP;eAta0;a0ePi0;g4t2;eUhTiogHAoRriQuP;sCte0;mi4ve0;lGnPpJr4Ks2;n4TosGU;iu7;n7rF5;g1pproHNrFttP;en7iHM;aSeRiQoP;c6m2Pt2;ge0me0;!da0g9zI;da0ma0z8;aPen7i2EloFor0;na0rN;aSeRiQoP;ra0st3;nA1ssI;n20sFVtKz8;grHnA;aSeQi9uP;i0nDv1;gPt2;g1ua0;ga0n1ta0;eJiQrP;ig4;ta0u4;eUfP;aFerRiPon7;cPda0;ol2;ePi0;nz1;n7t2;a0ePhia3;re,sC;gnosFCloD;ambu5b0Xc0QdH8f0Mg0Kl0Gm0Dn0Ap04r01sVtRvP;as2ia0oP;lAAra0;eQrPta8DurG;ar0;ne0rPs2;ge0io3mi4;c50iTo5tPu3O;aRiQrP;a0eEug9;na0t96;b2Gre;a0de3g4la0na0ra0sK;aQiPoDuF0;de0me0va0;gl1pa0;auTeSiRlo3oQrPu3;eAi3E;ne0rB1si2;la0n9;n7ri0;pe3;ig3oQta0uP;da0nBJ;mi4ta0;anAoP;li0rP;alBde0;eRiPu7;be3mi2nPra0z1;ea0q1Q;ga0re;ePluNna0raAus2;ne3;al6eRiQlPorFrauAun9;etKui0;la0ni0;ca0ri0;aUe7hi4iTlSoQrePur2;sESta0;l5mpAXrP;a0re0;aFi4;de0fDSma0;de0n2pi2;b1el5iPut2;li2;ma0nSrRtPz1;a0tilogP;raM;deEe;n52za0;a4Ge47h3Yi3Kl3Ho04rUuP;cRlQmu5oEEpe0rPstoBC;a0ioCva0;la0mi4;c1iPul1;na0re;apu5eViUoQucP;c1ia0;cQgPl5;io5;ch1iP;a0fig9;a0ti6;a0de0ma0pQsPt2;ce0iF;a0i2;a30c2Zdi5KesisKg2Xi2Vl2Mm1Sn05o03p02rXsPva0z8;a0pVtP;a9LeTiSrQuP;di0ma0;iPui0;gC7n9;pa0t7E;gg1l5r4;ar9i3;az8bEBi6o4rPteE;eRispon7oPuD;bo3de0mP;pe0;da0g9la0re;ia0pE6ri0u5;pe3rP;di4;c15d12f0Tg0Pi81n0OosDIqui0Ns0FtVvP;aliAeSiRoP;ca0gl1lP;a0ge0;nDEta0ve0;ni0rP;ge0sa0ti0;a06e02inCMor01rPun7;aTiSoP;bQl5vP;erK;atK;b6Rre;ccamb1dSfMpp9BrRsPt2vveCQ;sPta0;eg4;e,ia0re;diPi0;re,stingP;ue0;ce0na0;gg1mp5nRstP;a0uP;alB;de0e0ne0ta0;bPg1mi4re,t2;ilB;ac3eUiTolStQuP;l2m7J;a8Dit6ArP;in9ui0;a0iA;de3gl1sK;gPnNrDH;na0ui0;de0s2;etKo2uAR;eRiuQrP;atu5eD;n9ra0;da0g4la0stItCC;aWeUiSl5YoQrPu2;on2;n7rP;ma0ta0;c6da0gPna0s6;ge0u3;rPsCzI;i0ma0;bu5re;an4enCiQoPuBH;le0na0t2;re,vi7zI;eSiRlu7orQret8XuP;pi0sC;da0re0;a0l1ma0ta0;de0nt3pi0rP;ne0ta0;anAb0Ge0Fi0Em07oApQuP;ni6;a03e01iZlWoVrQuP;n9ta0;aSen7iRoP;mPva0;etK;me0;re,vBU;ne0r7As2;eQiPot2;ca0m6Ore;sCta0;aPe0la0re,ta0;ce0n9;nPra0te0;d1et3sa0;g4rPtB9;a0i0ti0;eSiQo5TuP;o5Sta0;na0sP;e3sIu3;d1mo3nQrcPtK;ia4P;da0ta0;nc1sC;n2re;aPi4;c1tK;a0e0lSma0oRpPtiBX;a0evPi0;olB;nBrH;aSeRiQoPu7;ca0qu1;de0ma0;ga0t2zI;bo3re,sCuAzI;nPre;ci7v19;i2liPnosAQ;e0o4;co5e0;bi2diuBJgu5;aPic6o4;ma0n9ssi26uP;di6;a01ba0c00f3gZmAPnXondo5rcStQuPv5R;cc1r5;a0oP;fo4;oQuP;i0la0mnaviDnA;nQscP;ri4T;ci7da0;cisLgPta0;e0u5H;ne0o5;atrBca0;ba2Jnci0Jr5;eWiP;aSeRna0oQta0uP;de0r5;cc1da0sa0;de0re0;cchie3ma0pGrPva0;a0iP;fi6re;re0ta0;ca0de0lWm50nTpGrQsP;el5sa0ti4;a0cQn4ZtP;a0i1E;a0hi29i4;a0na0sQtP;elli4ra0;i0u3;a0eb3ia0;b0QcAKd0Of9Wg0Nl0Km0Hn0Dp04rZsXtUuTvQzzP;a0eEia0;aPil5;lPre;ca0la0;sa0te5;aQtP;a0iACu3;loDp2T;ca0sa0tP;iDra0;aRbQca0ez8iPpi0;a0ca0;onBu3;m9UttP;erB;aWeViQovPp0Tta0;ol9;llSre,tP;aPo5;lBnPre;a0eE;arB;gg1re;ci2re;c9JdiRg1na0sa0tPzo4;arePer9IicL;!l5;da0re;b1i4mi4oAPpPufM;a0eEiP;cLo4re;a0cQe0ib3ma0pPunn1za0;es2;a0ia0o5;a0io4l1;ePu6;n8re;a5ra0;a0Ne0Gi0Bl09o03rTuP;ca0fRgQli4r5sPt2;ca0sa0;ge3ia0;a0fa0;aVev3NiTonSuP;cPli6ni0s6t2;a0iaP;cLre;to5za0;ga0l5nP;a0da0;cc8CmHnPsa0va0;cPdi0;a0o5;cSfonLicRllHmbar20niQrPt5Txa0;bQda0ra0seE;fi6;ot2;cPia0;a0heEia0;aPinAoc6;n4WsfeFte3;aRgQla6Enas7XsPv5C;biOog4ti9M;hello4ia0;da0n6sP;ci6iF;a0ccUfMl4AnRrQstemm1vP;az8er6YicL;c1e,go5linDsaO;da0ePvo0X;a25diPfic7S;ce0re;a0heE;c03da0g4ia0l00nZrUsSttQzP;zi6;aOeP;re,z8;a0c1i0sa0tP;a0o4;aSba0cRda0rP;a0iP;ca0re;ame4ol5;re,t2;ch2Idi0;b2He4lQoc6uPza0;gi4;a0et2;a0cQiP;a0ucL;aPh1;gl1re;b86c6Sd61er60ff5Lg51i50l4Em3Nn34p2Dr1Ms0Yt0Hu0CvUzP;io4zP;aReQiPufM;ma0tN;c6ra0;n4rA;a05e02in6Wo6vP;aZeViQolP;ge0to5ve0;a0cSlRnQs4Hta0va0zP;zi0;a0ce0gh1;i0upG;enAi4;de0le4nQrPz8;a0sa0ti0;i0tP;a0u3;lPmGntaE;e0la0o3;lQrP;e,te0;le0;l5n8r1;di0gu3li0m1Ira0sRtP;en5ToP;m1DrB;cPpi6;ul2;a0tP;a02eZiYorWrRuP;aPti0;lBre;aRez8iP;bPs2;ui0;c6e0r0vP;erC;cPn1;e0iO;g4Bn9ra0va0z8;ccQgg1nPrrHs2;d0Pe0ta0ua0;hi0;c6gl1naOrP;da0e;c08f07o5p05sStP;eQrP;ar0in9;ne0r9;aZeWiUoQuP;eMme0r9;c1da0gg0UlRmQn4pi0rPttiO;bi0dHge0ti0;iOma0;da0ve0;cu3dPeGl5mi5sK;er4O;cQd1g4mb5ntHrPs2t34ve3;i0vi0;onA;gg1l58po3sP;si4;ePi3or2;r9t2;al2iss1;en7iRoQriP;ve0;l2n7;a0uD;a0Eb0Dc0Ad09e47g07ieEm06om05rQti5HzigoP;go5;aZeYiWoQuP;fMggi4Mo5;cc54gTsStQveP;l5n2;a0oP;la0nA;a0sHtH;a0e0;ccPde0nDsLva0;hi0ia0;ca0da0n7s2t3;bRfMmQnPpa0;ca0g1;pi6;at2b1;atB;a0eEonB;i4omPui0;en2;e0i0;a0hiP;tPv1;et2;it3;bes6re;ostroMpPri0;a08e05i02l01oZrQuP;ntHra0;eVoP;ba0cc1da0fTn2pRsQvP;a0vigI;siF;iPr1;a0nq3G;it2ondH;n7sPz8;en2sa0ta0;gg1lla1rPs2;re,ta0;au0Xi6;aQccPgl1opGso5;a0i6;na0ttH;l5nQsPti0z8;anNta0;a0de0;ga0ia0lTn4rQssiP;o4re;a0eQi0tP;a0e22;cLn2;eCta0;alBc06d05e03g02iFnVsTtP;eQiP;ciG;ce7pP;or0;a0iP;a0ma0;aUeTiSoRuP;i0l5nPsa0vo5;c1z1;da0ia0ma0t10ve3;chi5Ada0en2;bb1ga0rHtK;cq2Kff1sG;e0o53uY;lPst11;a0la0;a0icapG;heEo3;a0Cb0Ai6mUniToRpP;liPu2;a0fi6;reE;gg1;st1;a01eZiYoRuP;cLffi0tP;i4o4U;bUdTgl1llHn2PrP;bQtP;a0iz8;a0iP;di0;er4;il1;c6niTra0;nAtP;a0te0;c6eQi4l2OnPra0sCtNz8;et2sHta0;st3;a4CiPu5;a0en2re;lgaFrP;ePi6;!gg1;be08e07fab06ge0i05lSmanRtPza0;ale4erP;a0ca0na0;ac6;aZeViToQuP;ci4de0n04;ca0gQnP;ta4;a0g1;bi0e2nP;ea0;a0gQnPr2sNt2v25;a0ta0;a0geJra0;ri0;cc1ga0pGrPt2;ga0ma0;a0e4ta0;etB;gg1na0re;gg1rP;a0ga0;ta0u2z8;e07gSiRoQuP;ra0z8;g4nB;a0re,ta0;a02et01hi00iVloUrQuaP;n2ta0;aReQoPupG;t2viO;di0ga0;dHpGva0;me3;oSra0uP;di6gQnPs2;ge0ta0;ne0;ga0r4;a2ZnA;ti24;nc1;vo5;a00eYiVlUoTrPumi6;aQePon2;s6t2;nPt1N;ca0ge0;ca0ga0l5nA;ig9o2Uui0;aQbb1da0evo2XgPl12na0o3sCt2;e0ge0;n6ta0;rPt2zI;i0ma0ra0;ccQma0n4re,sPti6;ci4;enAia0;a0ea0;a0Ed01eXiVoRuP;lPna0;a0te3;cLmb3pQrPt2;a0na0;e3ra0;ch1;bi0rP;a0e;gRmpiQrPs6;ge0i0;e0re;ua0;a0eYiVoQuP;ce0r0;bSlRmesQrmPsC;en2i0;ti6;ci0o3;ba0;re,ta0veQzI;io4;ni0;bi2nPst3;sa0tP;a0ra0;g1t2;cUeNquRuP;i0tB;iz8;at2e2iP;e2sP;i0ta0;a0Le0Gh0Ei08l06oTreRuP;cc1di0lPmu5ra0sa0;tu3;di2sP;ce0;c00da0gZlYmVnSppRrQstPva1D;a0uF;a0c1da0ge0pa0re0;a0ia0;c1discQsenNtP;a0en2;en7;ia2oApPu4;ag4;da0;la0tY;lie0;co5;aFima2u7;ma0;aSdRe6gQn9ufM;ge0;l1ne0;e0ia0;c6mbP;el5;e2iP;apGta0u7;ca0de0le3nRrQsNt2;ti0;ch1ta0;de0na0tP;a0ra0ua0;de0lXmGnVpUrTsStPval5;as2tP;a0iP;va0;a0c1;ez8to0G;ar3iOpo4;i0to4;pa0;aPca0da0o3;pp1;bYdXer3iUneDoRrPuC;a7oD;de0;li0mi4rP;ri0ti0;ga0;li2sCtPu3;a0ua0;sa0;i6ur0;a0Ae07i03oVrQuP;fMia0o4;aSev1on8uP;nHsto06tP;i0ti0;a0i0;cc1n6;c6nUrRtQz8;za0;to4;da0rP;aPi0;cc1;aPda0i0;cc1re;gl1nRoQsog4t2;ta0;sc1;a0do5;lQve3;ra0;li0;cXgl1ia0l5ndo4rRsQtK;te0;sa0ta0;bQca0ufM;fa0;aOi6;ca0;gl1;la0;a0ch1i4;na0;ia0;re",
    "Organization": "true¦0:42;a37b2Oc28d20e1Wf1Sg1Kh1Fi1Cj18k16l12m0Sn0Go0Dp07qu06rZsStGuCv9w4y1;amaha,m2ou1w2;gov,tu2P;ca;a3e1orld trade organizati3W;lls fargo,st1;fie20inghou14;l1rner br38;-m0Zgree2Xl street journ22m0Z;an halMeriz3Risa,o1;dafo2Dl1;kswagKvo;bs,kip,n2ps,s1;a tod2Nps;es30i1;lev2Tted natio2Q; mobi2Gaco beOd bLeAgi frida9h3im horto2Pmz,o1witt2S;shiba,y1;ota,s r X;e 1in lizzy;b3carpen2Ydaily ma2Sguess w2holli0rolling st1Ks1w2;mashing pumpki2Kuprem0;ho;ea1lack eyed pe3Ayrds;ch bo1tl0;ys;lPs1;co,la m10;a6e4ieme2Dnp,o2pice gir5ta1ubaru;rbucks,to2J;ny,undgard1;en;a2Nx pisto1;ls;few22insbu23msu1U;.e.m.,adiohead,b6e3oyal 1yan2T;b1dutch she4;ank;/max,aders dige1Cd 1vl2Y;bu1c1Rhot chili peppe2Globst25;ll;c,s;ant2Rizno2B;an5bs,e3fiz21hilip morrBi2r1;emier23octer & gamb1Oudenti12;nk floyd,zza hut;psi24tro1uge07;br2Mchina,n2M; 2ason1Uda2C;ld navy,pec,range juli2xf1;am;us;a9b8e5fl,h4i3o1sa,wa;kia,tre dame,vart1;is;ke,ntendo,ss0J;l,s;c,st1Btflix,w1; 1sweek;kids on the block,york07;a,c;nd1Qs2t1;ional aca2Bo,we0O;a,cXd0M;a9cdonald8e5i3lb,o1tv,yspace;b1Jnsanto,ody blu0t1;ley crue,or0M;crosoft,t1;as,subisN;dica2rcedes1;!-benz;id,re;'s,s;c's milk,tt11z1V;'ore08a3e1g,ittle caesa1H;novo,x1;is,mark; pres5-z-boy,bour party;atv,fc,kk,m1od1H;art;iffy lu0Jo3pmorgan1sa;! cha1;se;hnson & johns1Py d1O;bm,hop,n1tv;g,te1;l,rpol; & m,asbro,ewlett-packaSi3o1sbc,yundai;me dep1n1G;ot;tac1zbollah;hi;eneral 6hq,l5mb,o2reen d0Gu1;cci,ns n ros0;ldman sachs,o1;dye1g09;ar;axo smith kliYencore;electr0Gm1;oto0S;a3bi,da,edex,i1leetwood mac,oFrito-l08;at,nancial1restoU; tim0;cebook,nnie mae;b04sa,u3xxon1; m1m1;ob0E;!rosceptics;aiml08e5isney,o3u1;nkin donuts,po0Tran dur1;an;j,w j1;on0;a,f leppa2peche mode,r spiegXstiny's chi1;ld;rd;aEbc,hBi9nn,o3r1;aigsli5eedence clearwater reviv1ossra03;al;ca c5l4m1o08st03;ca2p1;aq;st;dplLgate;ola;a,sco1tigroup;! systems;ev2i1;ck fil-a,na daily;r0Fy;dbury,pital o1rl's jr;ne;aFbc,eBf9l5mw,ni,o1p,rexiteeV;ei3mbardiJston 1;glo1pizza;be;ng;ack & deckFo2ue c1;roW;ckbuster video,omingda1;le; g1g1;oodriM;cht3e ge0n & jer2rkshire hathaw1;ay;ryG;el;nana republ3s1xt5y5;f,kin robbi1;ns;ic;bWcRdidQerosmith,ig,lKmEnheuser-busDol,pple9r6s3t&t,v2y1;er;is,on;hland1sociated F; o1;il;by4g2m1;co;os; compu2bee1;'s;te1;rs;ch;c,d,erican3t1;!r1;ak; ex1;pre1;ss; 4catel2t1;air;!-luce1;nt;jazeera,qae1;da;as;/dc,a3er,t1;ivisi1;on;demy of scienc0;es;ba,c",
    "Expression": "true¦ahAb8c6e5f3gu2ma1oh,p0salute,uffa,v2zitto;iantala,u8; va,cché,gari,nnagg8;ai;alla fin3ig0orza;o,uriamoci;ccolo,hi;asp0iao;ita;le0oh,ravo;ah;ia",
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


  words = Object.assign({}, words, misc$2);
  // console.log(Object.keys(lexicon).length.toLocaleString(), 'words')
  // console.log(words['dice'])
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
      ionale: jj,
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
    doc.match('un [#Verb]', 0).tag('MaleNoun', 'uno-adj');

    //  un libro di cucina
    doc.match('(un|uno) #Noun di [#Verb]', 0).tag('Noun', 'un-x-di-vb');

    // phrasal verbs
    doc.match('#Verb (alzata|avanti|dietro|su|fuori|sotto|giu|indietro|dentro|addosso)',).tag('#PhrasalVerb #Particle', 'phrasal');


    // object pronouns
    doc.match('(il|i|una) [#Verb]', 0).tag('Noun', 'i-adj');
    // noun gender aggrement
    doc.match('(il|lo|i|gli) [#Noun]', 0).tag('MaleNoun', 'm-noun');
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
    // essere - to be
    doc.match('[(sono|sei|è|siamo|siete|sonoero|eri|era|eravamo|eravate|erano|fui|fosti|fu|fummo|foste|furono|sarò|sarai|sarà|saremo|sarete|saranno)] #Verb', 0).tag('Auxiliary');

    // Che bello!
    doc.match('^che #Adjective$').tag('Expression', 'che-bello');

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
