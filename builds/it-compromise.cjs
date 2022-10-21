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

  var version$1 = '14.6.0';

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
    // add a space
    let end = homeDocs[homeDocs.length - 1];
    let last = end[end.length - 1];
    if (/ /.test(last.post) === false) {
      last.post += ' ';
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
    home.document = combineDocs(home.document, input.document);
    return home.all()
  };

  var concat = {
    // add string as new match/sentence
    concat: function (input) {
      const { methods, document, world } = this;
      // parse and splice-in new terms
      if (typeof input === 'string') {
        let json = methods.one.tokenize.fromString(input, world);
        let ptrs = this.fullPointer;
        let lastN = ptrs[ptrs.length - 1][0];
        spliceArr(document, lastN + 1, json);
        return this.compute('index')
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
    let terms = methods.one.tokenize.splitTerms(phrase, model).map(methods.one.tokenize.splitWhitespace);
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
        obj.id = w;
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
            obj.num = split[2];
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
      return reg.fastOr.has(term.implicit) || reg.fastOr.has(term.normal) || reg.fastOr.has(term.text) || reg.fastOr.has(term.machine)
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
      whitespace: 'some',
      punctuation: 'some',
      case: 'none',
      unicode: 'some',
      form: 'machine',
    },
    root: {
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
          text = '{' + t.sense + '}';
        }
        if (t.implicit) {
          text = '[' + t.implicit + ']';
        }
        text = cli$1.yellow(text);
        let word = "'" + text + "'";
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
    out: out,
  };

  var out$1 = methods$8;

  const isObject$1 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  var text = {
    /** */
    text: function (fmt) {
      let opts = {
        keepSpace: true,
        keepPunct: true,
      };
      if (fmt && typeof fmt === 'string' && fmts$1.hasOwnProperty(fmt)) {
        opts = Object.assign({}, fmts$1[fmt]);
      } else if (fmt && isObject$1(fmt)) {
        opts = Object.assign({}, opts, fmt);//todo: fixme
      }
      if (this.pointer) {
        opts.keepSpace = false;
        let ptr = this.pointer[0];
        if (ptr && ptr[1]) {
          opts.keepPunct = false;
        } else {
          opts.keepPunct = true;
        }
      } else {
        opts.keepPunct = true;
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
            //       // console.log(no)
            //       if (terms.find(t => t.normal === no || t.tags.has(no))) {
            //         // console.log('+' + no)
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
        if (todo.tag === 'Noun') {
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

  const allowBefore = [
    '#', //#hastag
    '@', //@atmention
    '_',//underscore
    // '\\-',//-4  (escape)
    '+',//+4
    '.',//.4
  ];
  const allowAfter = [
    '%',//88%
    '_',//underscore
    '°',//degrees, italian ordinal
    // '\'',// \u0027
  ];

  //all punctuation marks, from https://en.wikipedia.org/wiki/Punctuation
  let beforeReg = new RegExp(`[${allowBefore.join('')}]+$`, '');
  let afterReg = new RegExp(`^[${allowAfter.join('')}]+`, '');

  //we have slightly different rules for start/end - like #hashtags.
  const endings = /[\p{Punctuation}\s]+$/u;
  const startings = /^[\p{Punctuation}\s]+/u;
  const hasApostrophe$1 = /['’]/;
  const hasAcronym = /^[a-z]\.([a-z]\.)+/i;
  const shortYear = /^'[0-9]{2}/;
  const isNumber = /^-[0-9]/;

  const normalizePunctuation = function (str) {
    let original = str;
    let pre = '';
    let post = '';
    // adhoc cleanup for pre
    str = str.replace(startings, found => {
      // punctuation symboles like '@' to allow at start of term
      let m = found.match(beforeReg);
      if (m) {
        pre = found.replace(beforeReg, '');
        return m
      }
      // support years like '97
      if (pre === `'` && shortYear.test(str)) {
        pre = '';
        return found
      }
      // support prefix negative signs like '-45'
      if (found === '-' && isNumber.test(str)) {
        return found
      }
      pre = found; //keep it
      return ''
    });
    // ad-hoc cleanup for post 
    str = str.replace(endings, found => {
      // punctuation symboles like '@' to allow at start of term
      let m = found.match(afterReg);
      if (m) {
        post = found.replace(afterReg, '');
        return m
      }

      // keep s-apostrophe - "flanders'" or "chillin'"
      if (hasApostrophe$1.test(found) && /[sn]['’]$/.test(original) && hasApostrophe$1.test(pre) === false) {
        post = post.replace(hasApostrophe$1, '');
        return `'`
      }
      //keep end-period in acronym
      if (hasAcronym.test(str) === true) {
        post = found.replace(/^\./, '');
        return '.'
      }
      post = found;//keep it
      return ''
    });
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

  const parseTerm = txt => {
    // cleanup any punctuation as whitespace
    let { str, pre, post } = tokenize$4(txt);
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
      terms = terms.map(splitWhitespace);
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
  let list = [
    [misc$2],
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

  var model$3 = {
    one: {
      aliases: aliases$1,
      abbreviations,
      prefixes,
      suffixes: suffixes$1,
      lexicon: lexicon$1, //give this one forward
      unicode: unicode$3,
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

  var version = '0.1.0';

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

  // index rules by last-char
  const indexRules = function (rules) {
    let byChar = {};
    rules.forEach((a) => {
      let suff = a[0] || '';
      let char = suff[suff.length - 1] || '';
      byChar[char] = byChar[char] || [];
      byChar[char].push(a);
    });
    return byChar
  };

  const prefix = /^([0-9]+)/;

  const expand = function (key = '', val = '') {
    val = String(val);
    let m = val.match(prefix);
    if (m === null) {
      return [key, val]
    }
    let num = Number(m[1]) || 0;
    let pre = key.substring(0, num);
    let full = pre + val.replace(prefix, '');
    return [key, full]
  };

  const toArray$2 = function (txt) {
    const pipe = /\|/;
    return txt.split(/,/).map(str => {
      let a = str.split(pipe);
      return expand(a[0], a[1])
    })
  };

  const uncompress = function (model = {}) {
    model = Object.assign({}, model);

    // compress fwd rules
    model.rules = toArray$2(model.rules);
    model.rules = indexRules(model.rules);

    // compress reverse rules
    if (model.rev) {
      model.rev = toArray$2(model.rev);
      model.rev = indexRules(model.rev);
    }

    // compress exceptions
    model.exceptions = toArray$2(model.exceptions);
    model.exceptions = model.exceptions.reduce((h, a) => {
      h[a[0]] = a[1];
      return h
    }, {});
    return model
  };
  var uncompress$1 = uncompress;

  // console.log(expand('fixture', '6ing'))
  // console.log(toArray('heard|4'))

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

  // generated in ./lib/models
  var model$1 = {
    "nouns": {
      "plural": {
        "rules": "ffaire|6s,ailamme|7s,arbecue|7,attage|6s,eige|4s,nestare|7,ridge|5,yte|3s,lophane|7,ampagne|7,harme|5s,ollege|6s,tagocce|7,ruise|5,atabase|7,iesse|5,ivenire|7,ugstore|7,nsemble|7,dovalle|7,iclasse|7,rilegge|7,olpe|4,dacoste|7,tafeste|7,afiamme|7,granate|7,passare|7,ngomare|7,ascarpe|7,aitre|5,arine|5s,gastore|7,ronotte|7,ovolume|7,ouse|4,arterre|7,astiche|7s,eluche|6,ercome|6,taborse|7,rtavoce|7,uzzle|5,eggae|5,portage|7s,sidence|7,scatole|7,eguente|2g.,lagente|7,huttle|6,zzaneve|7,urplace|7,ackle|5,tasette|7,deville|7s,deogame|7s,deotape|7,elfare|6,ankee|5s,amine|5,llage|5s,tive|4,ware|4s,ingle|5,ze|2,agazine|7,vice|4,ute|3,palle|5,ke|2,ie|2,age|3,e|i,cionado|7s,ggeggio|6,lterco|5hi,tifurto|7,rchivio|6,rmadio|5,ssedio|5,stio|3,usilio|5,vorio|4,acio|3,agaglio|6,arrio|5s,sofondo|1ifondi,rsaglio|6,scevico|6hi,ttegaio|6,mpesino|7s,opopolo|ipopolo,poluogo|7,abinero|7s,esio|3,spuglio|6,irco|3hi,labrodo|7,ommando|7s,mpendio|6,ultorio|6,nvoglio|6,opeco|4hi,rifuoco|7,rdoglio|6,escendo|7,ecennio|6,eclivio|6,elirio|5,emanio|5,emiurgo|6hi,arecido|7s,idietro|7,ileggio|6,spendio|6,issidio|6,stinguo|7,iofondo|1fondo,mporio|5,astidio|6,ebbraio|7,rmaglio|6,ccanaso|7,lamenco|7s,ribordo|7,rigioco|7,antuomo|6ini,anglio|5,rbuglio|6,asolio|5,azebo|5,ennaio|6,rmoglio|6,innasio|6,iogo|3hi,ramondo|7,iugno|5,ranchio|6,uaio|3,malteco|6hi,fondaio|6,nzaglio|6,dillio|5,gloo|4,dezzaio|6,mpervio|6,ncendio|6,nciucio|6,ortunio|6,ntarsio|6,umbo|4,imono|5,ratorio|6,ogorio|5,ombrico|6hi,ngolago|7,acho|4s,anubrio|6,antonio|6,arsupio|6,icro|4,llennio|6,scuglio|6,condrio|6,onologo|6hi,nopolio|6,egozio|5,unzio|4,gopolio|6,mbelico|6hi,paco|3hi,rmeggio|6,ssequio|6,alio|3,lleggio|6,igiorno|7,etrolio|6,izzico|5hi,oboviro|2iviri,ontorio|6,udico|4hi,ueblo|5s,uattro|6,ertorio|6,rotreno|7,igoglio|6,asuglio|6,inghio|5,sveglio|6,ovescio|6,abato|5,erdozio|6,natorio|6,coglio|5,emidio|4ei,zatetto|7,tecento|7,fogo|3hi,cciolio|6,hampoo|6,ilenzio|6,lletico|6hi,onaglio|6,pago|3hi,preco|4hi,oloquio|6,tereo|5,erminio|6,torpio|5,rascico|6hi,truscio|6,tudio|5s,bbuglio|6,peruomo|6ini,rassaco|6hi,ornio|4,ocalcio|7,rasloco|6hi,richeco|6hi,urco|3hi,briaco|5hi,espaio|5,ideo|4,olgo|3hi,cciglio|6a,ergo|3hi,matorio|6,lago|3hi,oleggio|6,ieco|3hi,amaio|4,oscio|4,prio|3,elio|3,ntuno|5,ttorio|5,cilio|4,guaglio|6,orzio|4,icapo|5,ranio|4,agogo|4hi,iscio|4,maturgo|6hi,pisodio|6,ordio|4,frago|4hi,caio|3,rocio|4,iluomo|5ini,osio|3,broglio|6,conscio|6,medio|4,gatorio|6,ruglio|5,caco|3hi,neggio|5,stadio|5,eriggio|6,icipio|5,vaio|3,obrio|4,ocento|6,areggio|6,ugo|2hi,ntotto|6,epilogo|6hi,ezio|3,iloquio|6,luogo|4hi,ipendio|6,gioco|4hi,baglio|5,sorio|4,avio|3,vaglio|5,alcio|4,alogo|4hi,luvio|4,logio|4,empio|4,atrio|4,vago|3hi,heggio|5,oggio|4,peggio|5,itorio|5,urio|3,ao|2,orgo|3hi,seggio|5,uco|2hi,ppio|3,uoco|3hi,taglio|5,argo|3hi,ascio|4,udio|3,monio|4,igo|2hi,iego|3hi,librio|5,ugio|3,cinio|4,raglio|5,mio|2,scopio|5,rchio|4,azio|3,rcio|3,iaio|3,arco|3hi,fio|2,igio|3,schio|4,arico|4hi,teggio|5,raio|3,lco|2hi,laio|3,cidio|4,erio|3,ngo|2hi,naio|3,taio|3,egio|3,nco|2hi,bio|2,agio|3,ncio|3,oio|2,iglio|4,cchio|4,izio|3,icio|3,sco|2hi,cco|2hi,ccio|3,aggio|4,ario|3,o|i,chorman|5en,nessman|5en,apoclan|2iclan,ntleman|5en,ooligan|7s,howman|4en,logan|5s,n|1,ripista|7,asciuga|7,azooka|6,oa|2,pobanda|1ibanda,pocosca|1icosca,pomafia|1imafia,oscuola|iscuola,arovita|7,wattora|7,inema|5,obra|4,ollega|5hi,civerba|7,vviva|5,xtra|4,otha|4,ranata|6,rdaroba|7,antra|5,itra|4,inja|4,llaosta|7,abrezza|7,iatesta|7,bottega|7,abba|4,ilingua|7,herpa|5,tratega|6hi,rodanza|1idanza,stacoda|7,ansfuga|6hi,ltra|4,carpa|4e,orta|3e,glianza|6e,erla|4,istrada|7,gala|4,ila|3,elta|4,partita|7,amba|4,scala|5,ula|3,anta|4,stra|4,ela|3,erra|4,lla|3,era|3,ola|3,ca|1hi,sa|2,na|2,ia|2,a|i,sset|4s,xploit|6s,adget|5s,t|1,tseller|7s,okmaker|7s,roker|5s,ntainer|7s,ealer|5s,angster|7s,eader|5s,artner|6s,ponsor|6s,quatter|7s,pporter|7s,eenager|7s,r|1,log|3s,g|1,ntinuum|6a,m|1,orpus|3ora,ogos|3i,esaurus|5i,opos|3i,ulnus|3era,s|1,j|1,ink|3s,k|1,enu|3s,ketch|5es,h|1,kinhead|7s,tandard|7s,d|1,olumi|2l.,i|1,u'|2,uppy|3ies,y|1,v|1,è|1,ù|1,ow|2,z|1,f|1,x|1,b|1,c|1,p|1,l|1,à|1",
        "exceptions": "ago|2hi,ambulatorio|10,antico|5hi,antiterrorismo|14,apologo|6hi,assolo|6,auto|4,baco|3hi,baciamano|9,biennio|6,bue|2oi,buio|3,capocorrente|3icorrente,capodelegazione|3idelegazione,capofamiglia|3ifamiglia,capogabinetto|3igabinetto,capogruppo|10,capolista|9,capopattuglia|3ipattuglia,caporeparto|3ireparto,caposervizio|3iservizio,caposquadra|3isquadra,capostazione|3istazione,capostruttura|3istruttura,capoufficio|3iufficio,capufficio|10,cardiochirurgo|13hi,cargo|5,cda|3,ceco|3hi,centimetro|1m.,club|4s,computer|8s,conio|4,dio|1ei,do|2,drago|4hi,eco|2hi,ego|3,eloquio|6,euro|4,fico|3hi,file|4,film|4s,foglio|5,frigo|5,game|4s,guscio|5,hacker|6s,indio|5s,intrico|6hi,killer|6s,kilometro|1m.,ko|2,lama|4,lettorato|9,list|4s,logo|3hi,luglio|6,maggio|6,manager|7s,marzo|5,mega|4,meglio|6,memento|7,metro|5,mille|5,millimetri|1m.,neurochirurgo|12hi,no|2,omologo|6hi,orco|3hi,orgoglio|7,ozio|3,panda|5,patio|4,pendaglio|8,peone|5s,piano|5,plico|4hi,podio|4,poliambulatorio|14,porno|5,predominio|9,prologo|6hi,promo|5,puma|4,quarantennio|11,rambo|5,ratio|5s,rave|4,re|2,reporter|8s,rogo|3hi,rompighiaccio|13,saio|3,score|5s,scudocrociato|4icrociati,socio|4,sporco|5hi,stage|5s,triennio|7,turbo|5,ulema|5,uomo|3ini,uscio|4,valico|5hi,vicecapogruppo|7igruppo,zoo|3,barca|4he,abate|4i,abete|4i,accessorio|9,agio|3,agrume|5i,alibi|5,alimentari|10,alzacristalli|13,analfabeta|9i,antinfiammatorio|15,apice|4i,armamentario|11,aroma|4i,artigliere|9i,asse|3i,astio|4,atrio|4,auditorio|8,auspicio|7,avere|4i,avorio|5,bacio|4,bancarottiere|12i,battente|7i,batterio|7,bene|3i,bicchiere|8i,binario|6,binomio|6,bolide|5i,burocrate|8i,cafone|5i,calice|5i,camice|5i,cane|3i,canottiere|9i,cappio|5,cardine|6i,carisma|6i,carpentiere|10i,cavaliere|8i,cementiere|9i,cesio|4,clima|4i,cocchio|6,cocchiere|8i,codice|5i,colle|4i,coma|3i,combattente|10i,comma|4i,commentario|10,consigliere|10i,contachilometri|15,conte|4i,conversare|9i,cotonificio|10,cranio|5,crematorio|9,crisma|5i,crocchio|7,culmine|6i,cuoio|4,debitucci|9,demente|6i,documentario|11,doge|3i,dolente|6i,domani|6,dormitorio|9,dovere|5i,elettrocardiogramma|18i,elogio|5,empio|4,ente|3i,erede|4i,eremita|6i,esordio|6,europarlamentare|15i,extraparlamentare|16i,fenicio|6,finanziere|9i,fine|3i,fischio|6,folle|4i,fonogramma|9i,forte|4i,fotogramma|9i,frate|4i,frocio|5,fronte|5i,gasolio|6,gene|3i,geranio|6,germe|4i,giroscopio|9,gonfio|5,granchio|7,grande|5i,gregge|5i,guardasigilli|13,ideogramma|9i,idillio|6,interrogatorio|13,laboratorio|10,latte|4i,legale|5i,ligure|5i,livore|5i,lunario|6,macchinario|10,male|3i,malocchio|8,mare|3i,marcantonio|10,marchio|6,maschio|6,mastice|6i,mestiere|7i,miasma|5i,micio|4,microscopio|10,miele|4i,mini|4,molle|4i,montacarichi|12,monte|4i,movente|6i,mucchio|6,muone|4i,muschio|6,nazi|4,nome|3i,nonsense|7i,nume|3i,obitorio|7,occhio|5,odore|4i,oggi|4,ologramma|8i,onere|4i,onore|4i,ordine|5i,orologio|7,oste|3i,otre|3i,padre|4i,palio|4,pallore|6i,pane|3i,paniere|6i,papa|3i,parlamentare|11i,parrucchiere|11i,pastore|6i,pateracchio|10,pci|3,pene|3i,pesce|4i,pettine|6i,pioniere|7i,pirata|5i,pistacchio|9,podere|5i,polline|6i,ponte|4i,portabagagli|12,premio|5,pressi|6,prisma|5i,prode|4i,programma|8i,pronome|6i,psi|3,pube|3i,purgatorio|9,ragioniere|9i,ralenti|7,raschio|6,rene|3i,repulisti|9,ribelle|6i,rigore|5i,ringhio|6,rischio|6,romanziere|9i,rude|3i,saccente|7i,salame|5i,salice|5i,sanatorio|8,sapere|5i,sari|4,saudita|6i,savio|4,scacchiere|9i,sci|3,scialle|6i,scisma|5i,secchio|6,seme|3i,servente|7i,sestiere|7i,settario|7,sgocciolio|9,sicario|6,sipario|6,sisma|4i,soffio|5,sofisma|6i,sole|3i,solone|5i,sorcio|5,spedizioniere|12i,spicchio|7,sterminio|8,strizzacervelli|15,sufi|4,superburocrate|13i,tale|3i,telefinanziere|13i,temine|5i,tendine|6i,termine|6i,territorio|9,teschio|6,teste|4i,timore|5i,torchio|6,tornio|5,torpore|6i,tritone|6i,turbine|6i,ufficio|6,vate|3i,vecchio|6,venti|5,ventre|5i,verdone|6i,verme|4i,vicario|6,vigore|5i,visone|5i,voce|3i,volere|5i,vortice|6i,zombi|5,scarpa|5e,ala|2i,base|3i,ape|2i,birra|4i,nascita|6i,svolta|5i,sfida|4i,classe|5i,tenda|4i,durata|5i,tutti|5,prova|4i,flotta|5i,testata|6i,qui|3,giacca|5hi,vita|3i,mappa|4i,carne|4i,mamma|4i,madre|4i,bocca|4hi,rete|3i,notte|4i,trama|4i,tasca|4hi,ricerca|6hi,entrate|6i,corda|4i,ombra|4i,nave|3i,vista|4i,pelle|4i,fonte|4i,forza|4i,estate|5i,squadra|6i,torre|4i,vasca|4hi,acqua|4i,ieri|4,area|3i,mira|3i,cura|3i,condotta|7i,coordinata|9i,valuta|5i,crisi|5,croce|4i,carta|4i,tazza|4i,domanda|6i,discarica|8hi,guida|4i,dieta|4i,stima|4i,fuga|3i,pesca|4hi,multa|4i,paura|4i,mosca|4hi,figura|5i,oca|2hi,stiva|4i,erba|3i,anca|3hi,idea|3i,bussare|6i,linea|4i,legge|4i,etichetta|8i,vivi|4,leva|3i,lega|3i,nota|3i,noce|3i,origine|6i,pari|4,pipa|3i,pinta|4i,gamma|4i,portata|6i,radice|5i,quota|4i,fase|3i,le impostazioni|15,cose|3i,fetta|4i,riva|3i,imposta|6i,cima|3i,visita|5i,vittima|6i,sede|3i,passeggiata|10i,arma|3i,onda|3i,ruota|4i",
        "rev": "udinari|7o,cmi|2e,crobati|6a,dulteri|7o,ffini|4e,fluenti|6e,forismi|6a,grari|5o,lbori|4e,lfieri|5e,lergeni|6e,lveari|5e,malgami|6a,anuensi|6e,montari|6e,rivieni|7,nfibi|5o,nnuari|6o,ntigeni|6e,isemiti|6a,hitravi|6e,rchivi|6o,rdori|4e,rmadi|5o,ruspici|6e,sceti|4a,ssianti|6e,ssedi|5o,istenti|6e,tleti|4a,accanti|6e,udaci|4e,usili|5o,siliari|7o,didatti|6a,utomi|4a,vverbi|6o,nchieri|6e,arbieri|6e,sifondi|1ofondo,ttimani|7,auli|3e,elgi|3a,enefici|7o,ficiari|7o,ensanti|6e,enzeni|5e,estiami|6e,celesti|6e,idoni|4e,ikini|5,isonti|5e,isturi|6,itumi|4e,occali|5e,onsai|5,acciali|6e,conieri|6e,reviari|7o,rindisi|7,canieri|6e,urloni|5e,tafuori|7,ciaviti|6e,adaveri|6e,doscopi|7o,alessi|5e,almanti|6e,alvari|6o,urifici|7o,aleonti|6e,runensi|6e,delieri|6e,nnibali|6e,antieri|6e,zonieri|6e,aparbi|6o,apri|4o,ratteri|6e,rcinomi|6a,arneadi|6e,arnieri|6e,ascami|5e,sellari|7o,assieri|6e,aclismi|6a,ateteri|6e,atrami|5e,elibi|4e,llulari|6e,moniali|6e,ertami|5e,esenati|6e,altroni|6e,iarpami|6e,ifrari|6o,imeli|5o,ineasti|6a,ircensi|6e,ivili|4e,langori|6e,listeri|6e,ficenti|6e,ognomi|5e,llageni|6e,olleghi|5a,luttori|7o,ilitoni|6e,ompari|5e,rensori|7o,omuni|4e,oncili|6o,oncimi|5e,onclavi|6e,ducenti|6e,enzieri|6e,onfini|5e,oniugi|5e,onnubi|6o,onsorti|6e,onsorzi|7o,sultori|7o,ontagi|6o,traenti|6e,afforti|6e,ontrari|7o,ibuenti|6e,rordini|6e,operchi|7o,ordoni|5e,rollari|7o,orridoi|7o,orrieri|6e,rtisoni|6e,tumisti|6a,rateri|5e,retesi|5e,riteri|6o,ocicchi|7o,omosomi|6a,onicari|7o,uneesi|5e,upoloni|6e,ustodi|5e,eboli|4e,ecenni|6o,eclivi|6o,eformi|5e,nquenti|6e,eliri|5o,emani|5o,tifrici|7o,esideri|7o,espoti|5a,euteri|6o,iademi|5a,aframmi|6a,icembri|6e,novenni|6e,ffusori|6e,iplomi|5a,isonori|6e,sordini|6e,pensari|7o,issidi|6o,ivari|5o,iverbi|6o,ivorzi|6o,ganieri|6e,omicili|7o,iovanni|7,oghieri|6e,ubbi|4o,ccidi|5o,difici|6o,ettroni|6e,matomi|5a,mpori|5o,usiasti|6a,nzimi|4a,pinici|6o,stolari|7o,pitaffi|7o,piteli|6o,ibristi|6a,qulibri|7o,otomani|6e,sempi|5o,emplari|6e,ercenti|6e,spropri|7o,steti|4a,tiopi|4e,ansteri|7o,aldoni|5e,alsari|6o,igliari|6e,miliari|6e,antasmi|6a,araoni|5e,astidi|6o,ervori|5e,ibromi|5a,duciari|7o,rmatari|7o,laconi|5e,ocolari|6e,ogliami|6e,olclori|6e,olklori|6e,ondali|5e,restali|6e,fettari|7o,rmulari|7o,orzieri|6e,ragori|5e,fortesi|6e,rasari|6o,talieri|6e,ucili|4e,ulgori|5e,endarmi|6e,enocidi|7o,enomi|4a,eometri|6a,erarchi|5a,esuiti|5a,innasi|6o,nasiali|6e,innasti|6a,iovani|5e,adischi|7,irasoli|6e,iudici|5e,tizieri|6e,laucomi|6a,licini|5e,lucosi|6o,olfoni|5e,rnicchi|7o,racili|5e,raffi|5o,natieri|6e,ravami|5e,regari|6o,embiuli|6e,uardoni|6e,arakiri|7,oclasti|6a,becilli|6e,mberbi|5e,mmagini|6e,mmani|4e,mpervi|6o,postori|6e,presari|7o,properi|7o,ncendi|6o,nciuci|6o,ncroci|6o,rizzari|7o,nfami|4e,nfelici|6e,fortuni|7o,nsiemi|5e,nsigni|5e,nsonni|5e,ntarsi|6o,teressi|6e,ventari|7o,pocriti|6a,raeliti|6a,iwi|3,acunari|6e,iarazzi|7,anguori|6e,vavetri|7,egumi|4e,etami|4e,icheni|5e,imiti|4e,infomi|5a,nguisti|6a,iquami|5e,iquori|5e,obbysti|6a,ocatari|7o,ogoi|3s,ogori|5o,cernari|7o,ugubri|5e,upanari|6e,drigali|6e,agnati|5e,aiali|4e,alefici|7o,altesi|5e,alvagi|6o,iapreti|7,anuali|5e,anubri|6o,arasmi|5a,arsupi|6o,artiri|5e,todonti|6e,ttocchi|7o,ecenati|6e,ievisti|6a,ediocri|6e,elanomi|6a,ercanti|6e,rcimoni|7o,ercuri|6o,aboliti|6a,teoriti|6e,opoliti|6a,iliti|4e,illenni|7o,ocondri|7o,itomani|6e,ilifici|7o,onarchi|5a,onoliti|6e,onopoli|7o,onsoni|5e,scoviti|6a,ufloni|5e,ufti|4,unicipi|7o,tandoni|6e,tuatari|7o,crologi|7o,ozianti|6e,eofiti|5a,eutroni|6e,evischi|7o,yorkesi|6e,omadi|4e,rvegesi|6e,ovembri|6e,unzi|4o,uraghi|5e,bici|3e,boi|2e,igarchi|5a,igopoli|7o,pifici|6o,natrofi|7o,izzonti|6e,ssequi|6o,ttobri|5e,agenari|7o,vociti|5a,hidermi|6a,aesi|3e,aesoni|5e,ndemoni|7o,nnoloni|6e,anorami|6a,apocchi|7o,bancari|7o,normali|6e,raocchi|7,rassiti|6a,araurti|7,areri|4e,armensi|6e,aroloni|6e,artenti|6e,rticipi|7o,rtitoni|6e,assanti|6e,ticceri|6e,trocchi|7o,riarchi|5a,avesi|4e,derasti|6a,ndolari|6e,nnacchi|7o,riscopi|7o,scecani|6e,sticidi|6a,etroli|6o,ezzenti|6e,ianeti|5a,noforti|6e,idocchi|7o,iduisti|6a,montesi|6e,ietroni|6e,igiami|5a,iromani|6e,oemi|3a,oeti|3a,etileni|6e,opileni|6e,ollici|5e,ompieri|6e,ontieri|6e,achiavi|7,tafogli|7,apacchi|7,avalori|7,edomini|7o,sbiteri|7o,stanomi|6e,rimati|5e,rimordi|7o,rincipi|6e,ipianti|6e,obiviri|2oviro,roclami|6a,ssoroni|6e,rofeti|5a,rogrami|6a,grammmi|6a,ettenti|6e,montori|7o,pulsori|6e,roverbi|7o,inciali|6e,ulsanti|6e,utiferi|7o,nquisti|6a,stuanti|6e,reddori|6e,anocchi|7o,vennati|6e,eami|3e,clusori|7o,fettori|7o,rattari|7o,iquiari|7o,pertori|7o,baltoni|6e,cettari|7o,ceventi|6e,attieri|6e,imorchi|7o,ceronti|6e,isparmi|7o,isucchi|7o,ivecchi|7,osoni|4e,uderi|4e,zzoloni|6e,cerdoti|6e,acrari|6o,crifici|7o,afari|5,alari|5o,iscendi|7,amurai|6,angui|4e,guinari|7o,llitari|6e,telliti|6e,caffali|6e,calpori|6e,abocchi|7o,cempi|5o,chemi|4a,acquoni|6e,ciami|4e,ciiti|4a,coppi|5o,corci|5o,cribi|4a,dentari|7o,eguaci|5e,eminari|7o,erpenti|6e,ttembri|6e,finteri|6e,ilenzi|6o,llabari|7o,imposi|6o,rotroni|6e,odali|4e,offici|5e,olerti|5e,olventi|6e,rgibili|6e,rannomi|6e,rrisoni|6e,simanti|6e,uracchi|7o,passeri|7,pecchi|6o,permi|4a,acoloni|6e,lungoni|6e,ioventi|6e,pumanti|6e,adristi|6a,uallori|6e,torpi|5o,rateghi|5a,tregoni|6e,tupori|5e,ublimi|5e,uburbi|6o,uccubi|5e,unniti|5a,erstiti|6e,ertesti|6e,pplenti|6e,riffari|7o,axi|3,axisti|5a,nocrati|6e,egrammi|6a,empli|5,enaci|4e,endoni|5e,enori|4e,enutari|7o,eoremi|5a,epori|4e,sorieri|6e,hesauri|6us,rapiedi|7,opoi|3s,icomani|6e,otali|4e,nsfughi|5a,raumi|4a,ionfali|6e,ozkisti|6a,ubifici|7o,ubolari|6e,urgori|5e,urpi|3e,utsi|4,riaconi|6e,ruguagi|7o,tensili|6e,aticini|7o,egetali|6e,elari|5o,entisei|7,seienni|6e,treenni|6e,tunenni|6e,erbali|5e,ersanti|6e,iavai|5,tnamiti|6a,incenti|6e,isceri|5e,isconti|6e,terbesi|6e,ituperi|7o,abolari|7o,olgari|5e,lontari|7o,erifici|7o,semblei|6a,volezzi|6a,carotti|6a,ellezzi|6a,evandi|5a,aroti|4a,garetti|6a,arrozzi|6a,olci|3e,natri|4a,bbrichi|5a,oresti|5a,ornaci|5e,resciti|6a,hitarri|6a,iotechi|5a,erditi|5a,i altri|7,isposti|6a,ivolti|5a,curezzi|6a,nsalati|6a,enditi|5a,di mari|6e,stecchi|5a,ietri|4a,empesti|6a,acrimi|5a,erduri|5a,ialdi|4a,bolezzi|6a,nalisi|6,vanzati|6a,hiunqui|6e,venturi|6a,lleanzi|6a,ddomi|4e,a aerei|6a,fferti|5a,ziendi|5a,hiamati|6a,sanzi|4a,licchi|4a,ulturi|5a,isciari|6e,repi|3a,istichi|5a,erciali|6e,rogi|3a,isputi|5a,iagnosi|7,ttativi|6a,inanzi|5a,mpronti|6a,ariffi|5a,a guidi|6a,potesi|6,peranzi|6a,itudini|6e,ingui|4a,nghezzi|6a,di viti|6a,ellatti|6e,usichi|4a,inori|4e,rrativi|6a,litichi|5a,ratichi|5a,roposti|6a,oceduri|6a,atati|4a,ncipali|6e,rachidi|6e,levanzi|6a,ecluti|5a,iservi|5a,ntranzi|6a,iliali|5e,peciali|6e,ociali|5e,tringi|5a,tatui|4a,irmi|3a,ravatti|6a,emplati|6e,ecnichi|5a,nellati|6a,attichi|5a,niformi|6e,rusti|4a,quari|5o,dagi|4o,gravi|5o,ironi|4e,rgoni|4e,versari|7o,ipodi|4e,geti|3a,recchi|6o,rili|3e,edianti|6e,natari|6o,eisti|4a,benti|4e,teroidi|6e,onauti|5a,icolari|6e,tocrati|6e,alconi|5e,enieri|5e,rconi|4e,aroni|4e,cuori|4e,estiari|7o,ancori|5e,ecari|5o,ienni|5o,llenari|7o,gegneri|6e,pedi|3e,otrofi|6o,retoni|5e,gadieri|6e,ratesi|5e,erieri|5e,anili|4e,ndori|4e,nonieri|6e,pitoni|5e,proni|4e,eifici|6o,avanti|6,amisti|5a,monieri|6e,ilici|5o,uroni|4e,icali|4e,inomani|6e,statari|7o,evoli|4e,merci|5o,acenti|5e,mplici|5e,primari|7o,sulenti|6e,altari|5e,piloti|5a,ituenti|6e,ttami|4e,amanti|5e,crimini|6e,piaceri|6e,ocenti|5e,rinari|6o,ellenti|6e,plasmi|5a,blemi|4a,igrammi|6a,pisodi|6o,valenti|6e,patri|5o,rrestri|6e,legnami|6e,emori|4e,inocchi|7o,iumi|3e,novisti|6a,ssili|4e,cesi|3e,ilieri|5e,ossari|6o,mmisti|5a,duchi|3a,ginari|6o,petenti|6e,fedeli|5e,ludi|4o,medi|4o,preti|4e,golari|5e,anifici|7o,arici|4e,rosari|6o,egami|4e,iatari|6o,minari|5e,degenti|6e,orenni|5e,affari|5e,costumi|6e,gimi|3e,mifici|6o,oneti|4a,arci|4o,argini|5e,trimoni|7o,lomani|5e,stadi|5o,eloni|4e,cenari|6o,ilitari|6e,ondiali|6e,signori|6e,atali|4e,obri|4o,essuali|6e,orari|5o,pedali|5e,fulmini|6e,epi|2e,lagi|4o,llami|4e,ceneri|5e,allarmi|6e,esuli|4e,rapeuti|6a,udori|4e,gili|3e,ntali|4e,doppi|5o,lescopi|7o,soi|3o,eggenti|6e,ioloni|5e,esami|4e,ervisti|6a,avisti|5a,ezi|3o,ederi|4e,edili|4e,mestri|5e,cerchi|6o,dei|1io,verdi|4e,favori|5e,mili|3e,generi|5e,carceri|6e,indici|5e,utenti|5e,oraci|4e,ripudi|6o,tezzi|4a,suri|3a,chiesti|6a,canzi|4a,oranzi|5a,icletti|6a,michi|3a,padi|3a,rnici|4e,stradi|5a,pagi|3a,zesi|3e,imisti|5a,lianti|5e,agrammi|6a,iomi|3a,imali|4e,cloni|4e,eroi|3e,rtieri|5e,senti|4e,rtori|4e,uguri|5o,omisti|5a,nconi|4e,esseri|5e,aglieri|6e,locali|5e,nipoti|5e,asoni|4e,ollori|5e,ardieri|6e,rsoni|4e,broni|4e,alci|4o,rristi|5a,hiali|4e,oisti|4a,itali|4e,omanti|5e,viali|4e,spiti|4e,amori|4e,missari|7o,ittenti|6e,ngenti|5e,tolari|5e,ndieri|5e,idori|4e,uloni|4e,aisti|4a,ergenti|6e,luvi|4o,sagi|4o,banti|4e,apori|4e,comi|4o,emisti|5a,asori|4e,datari|6o,atoni|4e,leoni|4e,ggianti|6e,estori|5e,ortali|5e,nitenti|6e,paci|3e,erari|5o,vertici|6e,ettieri|6e,fragi|5o,ozi|3o,voloni|5e,potenti|6e,consoli|6e,agenti|5e,uenni|4e,formi|4a,scenti|5e,obili|4e,tuari|5o,uci|2e,temi|3a,droni|4e,ormisti|6a,iloni|4e,efici|4e,iesi|3e,ntenari|7o,ipiti|4e,rroni|4e,zali|3e,rtoni|4e,stroni|5e,voni|3e,eali|3e,ntasei|6,ioti|3a,pendi|5o,abili|4e,piedi|4e,poteri|5e,iventi|5e,otoni|4e,ziali|4e,uilibri|7o,gmi|2a,riali|4e,loqui|5o,etori|4e,adoni|4e,ifoni|4e,sconi|4e,ocini|5o,drammi|5a,ziari|5o,panti|4e,ficiali|6e,tturi|4a,stanzi|5a,ltori|4e,zanti|4e,mieri|4e,tifici|6o,vieri|4e,ffoni|4e,lumi|3e,zzieri|5e,umori|4e,tristi|5a,danti|4e,cambi|5o,rsori|4e,emmi|3a,dicenni|6e,agoni|4e,mesi|3e,diari|5o,uomini|3o,ugi|3o,edoni|4e,iatri|4a,aturi|4a,tuali|4e,rori|3e,fisti|4a,bisti|4a,ensori|5e,cconi|4e,boni|3e,olori|4e,toloni|5e,inieri|5e,alori|4e,azi|3o,fanti|4e,cieri|4e,hesi|3e,cianti|5e,histi|4a,sali|3e,tenni|4e,igi|3o,olieri|5e,icidi|5o,iconi|4e,ssoni|4e,ivisti|5a,llieri|5e,otori|4e,ganti|4e,uristi|5a,vali|3e,pisti|4a,igenti|5e,stoni|4e,tili|3e,isori|4e,gisti|4a,zisti|4a,iori|3e,desi|3e,oristi|5a,etari|5o,utori|4e,aloni|4e,ntori|4e,resi|3e,eristi|5a,egi|3o,itari|5o,nenti|4e,aristi|5a,nanti|4e,lesi|3e,dari|4o,toi|3o,zoni|3e,renti|4e,cisti|4a,poni|3e,sci|3o,sisti|4a,disti|4a,icanti|5e,nci|3o,ionari|6o,ntoni|4e,noni|3e,eroni|4e,lanti|4e,ssori|4e,rali|3e,moni|3e,ienti|4e,tanti|4e,lloni|4e,enzi|3a,izi|3o,nesi|3e,ranti|4e,ttoni|4e,nali|3e,denti|4e,tisti|4a,ttori|4e,ai|2o,gli|3o,itori|4e,listi|4a,nisti|4a,cci|3o,ggi|3o,ioni|3e,hi|o,atori|4e,i|o,ffaires|6,ionados|6,logs|3,ytes|3,pesinos|6,bineros|6,lubs|3,mmandos|6,recidos|6,ilms|3,amencos|6,eaders|5,inks|3,achos|4,enus|3,stiches|6,ueblos|5,cores|4,ketches|5,inheads|6,ponsors|6,andards|6,evilles|6,ankees|5,uppies|3y,ners|3,wares|4,gans|3,nagers|5,nes|2,lers|3,kers|3,ts|1,mes|2,ios|2,ters|3,ges|2,s|1,chormen|5an,nessmen|5an,apiclan|2oclan,ntlemen|5an,howmen|4an,n|1,pibanda|1obanda,picosca|1ocosca,pimafia|1omafia,iscuola|oscuola,ntinuua|6m,orpora|3us,ridanza|1odanza,ulnera|3us,cciglia|6o,a|1,ipopolo|opopolo,pifondo|2ofondo,igruppo|ogruppo,o|1,j|1,egg\\.|2uente,oll\\.|2umi,u'|2,orte|3a,arche|3a,glianze|6a,e|1,v|1,è|1,ù|1,ow|2,h|1,z|1,f|1,x|1,b|1,c|1,d|1,k|1,p|1,y|1,m|1,l|1,à|1,g|1,t|1,r|1"
      }
    },
    "adjectives": {
      "fs": {
        "rules": "iaborto|7,inaggio|7,ticarro|7,cemento|7,sterolo|7,ngresso|7,icorteo|7,anesimo|7,idebito|7,tifurto|7,ntigelo|7,iamento|7,nopolio|7,imostro|7,ncendio|7,otaggio|7,iscasso|7,ciopero|7,ndacato|7,ntiuomo|7,tivento|7,ampo|4,reddito|7,maggio|6,rsono|5,tacchio|7,remio|5,estio|4e,meraldo|7,erlusso|7,ango|4,ismo|4,o|a,cretore|4rice,cultore|4rice,ntore|2rice,omotore|4rice,utore|2rice,ttore|2rice,itore|2rice,atore|2rice,e|1,ezz|3,ew|2,ff|2,ualcun|6',n|1,ent'|4,u|1,v|1,op|2,im|2,s|1,x|1,g|1,d|1,y|1,c|1,h|1,k|1,t|1,i|1,l|1,r|1,a|1",
        "exceptions": "antinfortunistico|17,bimotore|5rice,meglio|6,motore|3rice,peggio|6,radio|5,sotto|5,turbo|5,apposta|7,calcolatore|8rice,consolatore|8rice,isolatore|6rice,livellatore|8rice,manipolatore|9rice,ocra|4,oliva|5,pirata|6,regolatore|7rice,rivelatore|7rice,rosa|4,saudita|7,sobillatore|8rice,speculatore|8rice,spia|4,ultra|5,urlatore|5rice,ventilatore|8rice,viola|5",
        "rev": "ocrazia|7,tidogma|7,tidonna|7,tidroga|7,rriglia|7,timafia|7,inebbia|7,riforma|7,scalata|7,siccita|7,ichezza|7,iulcera|7,valanga|7,ivipera|7,didatta|7,nomista|7,airota|6,traerea|7,opolita|7,almata|6,sivista|7,roclita|7,xtra|4,istrada|7,esuita|6,olpista|7,oclasta|7,pocrita|7,sabella|7,tamista|7,atoneta|7,aronita|7,aya|3,nomarca|7,timedia|7,cifista|7,rassita|7,erla|4,iuma|4,fortuna|7,ivoglia|7,abbia|5,ciita|5,eppia|5,toterra|7,tzkista|7,ssia|4,sumista|7,semita|6,tivista|7,bista|5,gista|5,vita|4,nnita|5,sopra|5,lfabeta|7,uista|5,oista|5,xista|5,tnamita|7,hista|5,timista|7,ormista|7,eista|5,iota|4,icida|5,cista|5,sista|5,dista|5,zista|5,tista|5,rista|5,nista|5,lista|5,a|o,eatrice|3ore,litrice|3ore,retrice|3ore,uitrice|3ore,datrice|3ore,pitrice|3ore,estie|4o,vitrice|3ore,ultrice|3ore,citrice|3ore,ntrice|2ore,satrice|3ore,bitrice|3ore,sitrice|3ore,ritrice|3ore,ditrice|3ore,utrice|2ore,nitrice|3ore,titrice|3ore,matrice|3ore,motrice|3ore,vatrice|3ore,zatrice|3ore,gatrice|3ore,natrice|3ore,iatrice|3ore,tatrice|3ore,ttrice|2ore,ratrice|3ore,catrice|3ore,e|1,ezz|3,ew|2,ff|2,ualcun'|6,ent'|4,u|1,v|1,op|2,im|2,s|1,x|1,g|1,d|1,y|1,c|1,h|1,k|1,t|1,n|1,i|1,l|1,r|1,o|1"
      },
      "mp": {
        "rules": "eatorio|6,iaborto|7,inaggio|7,ticarro|7,cemento|7,sterolo|7,ngresso|7,icorteo|7,anesimo|7,idebito|7,tifurto|7,ntigelo|7,iamento|7,nopolio|7,imostro|7,ncendio|7,otaggio|7,iscasso|7,ciopero|7,ndacato|7,ntiuomo|7,tivento|7,lutorio|6,zatorio|6,uio|2,oppio|4,iatorio|6,ioco|3hi,datorio|6,ampo|4,reddito|7,otorio|5,maggio|6,rsono|5,atrio|4,tacchio|7,remio|5,retorio|6,batorio|6,adio|4,meraldo|7,obrio|4,purio|4,torpio|5,erlusso|7,ultorio|6,ango|4,anesio|5,satorio|6,ittorio|6,proprio|6,nio|2,oio|2,ntorio|5,matorio|6,mio|2,catorio|6,erio|3,dio|2,glio|3,mpio|3,bio|2,tatorio|6,gatorio|6,onfio|4,chio|3,rco|2hi,vio|2,itorio|5,latorio|6,nco|2hi,sorio|4,natorio|6,ismo|4,aio|2,cco|2hi,gio|2,go|1hi,zio|2,cio|2,sco|2hi,ario|3,o|i,ticlone|7,icosche|7,idolore|7,lusione|7,iettile|7,ruggine|7,ustione|7,lue|3,ouse|4,adre|4,nline|5,alunque|7,enape|5,lacrime|7,ttofare|7,ankee|5,azione|6,e|i,scalata|7,siccita|7,ichezza|7,pposta|6,istrada|7,aya|3,nomarca|7,cra|3,liva|4,irata|5,osa|3,lvavita|7,toterra|7,ltra|4,na|2,ga|2,era|3,sopra|5,ma|2,la|2,ia|2,a|i,ezz|3,ew|2,ff|2,ent'|4,u|1,v|1,op|2,im|2,s|1,x|1,g|1,d|1,y|1,c|1,h|1,k|1,t|1,n|1,i|1,l|1,r|1",
        "exceptions": "antico|5hi,anticipatorio|12,anticonsumista|14,antimissile|11,antinfortunistico|17,antinucleare|12,bieco|4hi,carico|5hi,consacratorio|12,cospiratorio|11,dissacratorio|12,emigratorio|10,immigratorio|11,live|4,meglio|6,moratorio|8,novantenne|10,peggio|6,poco|3hi,preparatorio|11,respiratorio|11,sangue|6,sessantenne|11,settantenne|11,sotto|5,trimotore|9,turbo|5,ubriaco|6hi,accessorio|9,acre|3i,adulatorio|9,affine|5i,allettante|9i,allucinatorio|12,amatorio|7,anticonsumisti|14,antimissili|11,autocongratulatorio|18,autoesaltatorio|14,autogratificatorio|17,autoidentificatorio|18,autorizzatorio|13,avanti|6,binario|6,bonario|6,buio|3,cafone|5i,canzonatorio|11,cardiocircolatorio|17,cartario|7,censorio|7,circolatorio|11,combattente|10i,combinatorio|11,consumista|9i,convenevole|10i,credente|7i,davanti|7,declamatorio|11,denigratore|10i,deregolatorio|12,derogatorio|10,dilatorio|8,dilettante|9i,discriminatorio|14,disinfettante|12i,dittatorio|9,divagatorio|10,divinatorio|10,divisioniste|11i,documentario|11,dolente|6i,doppio|5,ebete|4i,elaboratore|10i,esimio|5,esploratore|10i,fenicio|6,fine|3i,folle|4i,forte|4i,fradicio|7,frammentario|11,futile|5i,giovane|6i,grave|4i,immane|5i,indolente|8i,intimidatorio|12,ionio|4,ispiratore|9i,lampante|7i,lanciamissili|13,liquidatore|10i,maschio|6,midi|4,migratore|8i,milionare|8i,militare|7i,mini|4,miscredente|10i,mite|3i,molitorio|8,movimentiste|11i,natatorio|8,nolente|6i,notorio|6,obbligatorio|11,ogni|4,oleario|6,ondulatorio|10,paramilitare|11i,pario|4,pontificio|9,pretorio|7,previo|5,revocatorio|10,riparatore|9i,ristoratore|10i,rogatorio|8,rotante|6i,rovente|6i,rude|3i,salutare|7i,sanatorio|8,sanzionatorio|12,saudita|6i,savio|4,senatorio|8,sensorio|7,serio|4,silente|6i,spurio|5,stampante|8i,sudicio|6,svenevole|8i,tenue|4i,testamentario|12,tracotante|9i,uditorio|7,unanime|6i,urinario|7,utile|4i,valevole|7i,vanesio|6,vecchio|6,vedente|6i,venatorio|8,vitale|5i,volente|6i,votante|6i,yuppi|5",
        "rev": "inevoli|6e,usatori|7o,grari|5o,lacri|4e,leatori|7o,ltrui|5,mbedui|5e,nfibi|5o,nnonari|7o,ipatori|7o,idebiti|7,onopoli|7,iettili|7,polidi|5e,rcadi|4e,gentari|7o,ssianti|6e,olutori|7o,stemi|5o,troci|4e,dannari|6e,nferiri|6e,didatti|6a,nomisti|6a,vilenti|6e,eigi|3e,ficiari|7o,icipiti|6e,ifronti|6e,inomi|5o,ipedi|4e,irboni|5e,ivalvi|5e,gognoni|6e,rutali|5e,airoti|5a,labresi|6e,ambiari|7o,mpanari|7o,antori|5e,aparbi|6o,apresi|5e,zzevoli|6e,rtolari|7o,aseari|6o,sellari|7o,eleri|4e,elesti|5e,elibi|4e,cuitali|6e,oitali|5e,omitali|6e,missori|7o,onsorti|6e,sulenti|6e,andieri|6e,traerei|6a,ntumaci|6e,orinzi|6o,rridori|6e,opoliti|6a,reatori|6e,remisi|6,ulinari|7o,ustodi|5e,almati|5a,eboli|4e,eclivi|6o,egeneri|6e,eleteri|7o,latrici|6e,sivisti|6a,fensori|6e,ffusori|6e,igitali|6e,ppianti|6e,ispari|6,gitrici|6e,olciari|7o,trinari|7o,latanti|6e,dili|3e,gemoni|5e,quanimi|6e,questri|6e,cretori|6e,piatori|7o,lodenti|6e,tensori|6e,rocliti|6a,xtri|3a,eroci|4e,erventi|6e,eudali|5e,duciari|7o,ifoni|4e,osofali|6e,ognari|6o,rancesi|6e,riserii|6e,esuiti|5a,dinieri|6e,iovini|5e,olpisti|6a,ffianti|6e,regari|6o,oclasti|6a,llusori|7o,llustri|6e,becilli|6e,mbelli|5e,mberbi|5e,mpervi|6o,nclini|5e,ncolumi|6e,gruenti|6e,nermi|4e,nerti|4e,nfami|4e,mmatori|7o,nnevoli|6e,nglesi|5e,nsigni|5e,solenti|6e,nsonni|5e,nutili|5e,pocriti|6a,aki|3,tamisti|6a,acustri|6e,bertari|7o,ibrari|6o,ievi|3e,iguri|4e,ombari|5e,altesi|5e,iasoldi|7,vratori|6e,atoneti|6a,arci|4o,aroniti|6a,arzi|4o,aschili|6e,acranti|6e,axi|3,ediocri|6e,eritori|7o,inori|4e,scoviti|6a,pulsori|6e,urari|5o,useanti|6e,yorkesi|6e,aguensi|6e,omadi|4e,stili|4e,vvi|3o,cifisti|6a,alustri|6e,namensi|6e,rassiti|6a,arecchi|7o,cipanti|6e,atri|4o,cuniari|7o,edestri|6e,rentori|7o,montesi|6e,impanti|6e,luvi|4o,oltroni|6e,avalori|7,ecipiti|6e,recoci|5e,cursori|6e,iminari|6e,ndisoli|6e,rimari|6o,imigeni|7o,obatori|7o,roclivi|6e,rodi|3e,oditori|7o,ulsanti|6e,lvinari|6e,llanimi|6e,zolenti|6e,alsiasi|7,lmutesi|6e,dentori|6e,educi|4e,ovisori|6e,ibelli|5e,ceventi|6e,iedenti|6e,posanti|6e,scatoli|6e,otatori|7o,bacuori|7,uspanti|6e,guinari|7o,telliti|6e,azi|3o,attanti|6e,ciiti|4a,ottanti|6e,cultori|6e,olevoli|6e,emiseri|7o,ipedali|6e,ttitori|7o,lvestri|6e,oavi|3e,obri|4o,offici|5e,olerti|5e,ommari|6o,overchi|7o,ioventi|6e,nitensi|6e,torpi|5o,ottenti|6e,tralci|6o,azianti|6e,ublimi|5e,uicidi|6o,erstiti|6e,pplenti|6e,sultori|7o,amponi|5e,enaci|4e,raetili|6e,intori|6o,icomani|6e,nseunti|6e,nsitori|7o,chianti|6e,ionfali|6e,tzkisti|6a,ruci|3e,urpi|3e,cellesi|6e,erdoni|5e,ergini|5e,ersanti|6e,ssatori|7o,erinari|7o,icari|5o,ivaci|4e,olgari|5e,airesi|5e,zzesi|4e,tratori|6e,dolci|4e,utanti|5e,lomani|5e,rvegesi|6e,semiti|5a,iranti|5e,daci|3e,nfinari|6e,tradali|6e,iendali|6e,imevoli|6e,revi|3e,loni|3e,rensi|4e,fari|4o,rcensi|5e,tivisti|6a,nsatori|6e,planari|6e,muni|3e,cratori|7o,ittori|6o,iratori|7o,ituenti|6e,bisti|4a,bitali|5e,attoni|5e,beni|3e,vianti|5e,ettali|5e,nanzi|5,gisti|4a,ompenti|6e,etanti|5e,rtenti|5e,ssari|5o,bratori|6e,aranti|5e,iopi|3e,rrestri|6e,laci|3e,gaci|3e,allesi|5e,oppanti|6e,enitali|6e,ovevoli|6e,ginari|6o,memori|5e,mortali|6e,propri|6o,dubbi|5o,felici|5e,enzali|5e,ospiti|5e,olventi|6e,bancari|7o,medi|4o,lontari|7o,ecari|5o,atenti|5e,oi|2o,ritali|5e,cupanti|6e,cipi|3e,boanti|5e,otali|4e,nniti|4a,cortesi|6e,dentari|7o,grandi|5e,loquaci|6e,pesanti|6e,veloci|5e,raci|3e,dinari|6o,gili|3e,lfabeti|6a,pestri|5e,uisti|4a,nsanti|5e,cedenti|6e,oisti|4a,xisti|4a,orari|5o,tnamiti|6a,trari|5o,rdenti|5e,uratori|6e,benti|4e,iesi|3e,nuanti|5e,traenti|6e,gheresi|6e,histi|4a,apaci|4e,pitali|5e,ebri|3e,branti|5e,linari|5e,moventi|6e,etenti|5e,essori|5e,ettenti|6e,cordi|4e,eguenti|6e,rtili|4e,deli|3e,uttanti|6e,rimenti|6e,cevoli|5e,vesi|3e,ltanti|5e,mesi|3e,nili|3e,etali|4e,tuanti|5e,ttari|5o,ntili|4e,nitenti|6e,curanti|6e,rianti|5e,fanti|4e,ubri|3e,timisti|6a,gli|3o,utari|5o,fluenti|6e,mpi|3o,ormisti|6a,eisti|4a,viari|5o,coni|3e,onevoli|6e,ntanti|5e,ioti|3a,pevoli|5e,quenti|5e,isori|5o,utori|4e,ittenti|6e,ievoli|5e,diari|5o,verdi|4e,bali|3e,onfi|4o,odali|4e,unari|4e,nci|3o,stali|4e,assoni|5e,matori|5e,senti|4e,tranti|5e,icidi|4a,motori|5e,olesi|4e,pali|3e,erari|5o,ementi|5e,iventi|5e,banti|4e,eratori|6e,cili|3e,ttili|4e,caci|3e,vatori|5e,atili|4e,gevoli|5e,cianti|5e,oidi|3e,uari|4o,eari|3e,aresi|4e,olori|4e,ngui|3e,llenti|5e,adenti|5e,zzatori|6e,enari|5o,alesi|4e,atari|5o,rtanti|5e,mili|3e,idali|4e,ziari|5o,granti|5e,plici|4e,potenti|6e,ssanti|5e,dari|4o,valenti|6e,cisti|4a,sisti|4a,ioni|3e,vili|3e,devoli|5e,disti|4a,udenti|5e,etari|5o,atali|4e,lianti|5e,sali|3e,vanti|4e,hevoli|5e,rmali|4e,zisti|4a,tisti|4a,sci|3o,gatori|5e,sili|3e,vali|3e,entari|5e,iori|3e,ai|2o,manti|4e,imali|4e,liari|4e,ganti|4e,identi|5e,gali|3e,oranti|5e,natori|5e,itanti|5e,hesi|3e,istenti|6e,eali|3e,latori|5e,tevoli|5e,rili|3e,ormi|3e,desi|3e,iatori|5e,eranti|5e,revoli|5e,zanti|4e,risti|4a,danti|4e,tatori|5e,ionari|6o,ttori|4e,gi|2o,ndenti|5e,stanti|5e,catori|5e,nenti|4e,gianti|5e,izi|3o,enni|3e,itori|4e,canti|4e,cci|3o,itari|5o,renti|4e,nesi|3e,lanti|4e,nanti|4e,ienti|4e,genti|4e,ntali|4e,cali|3e,nisti|4a,listi|4a,centi|4e,uali|3e,lari|3e,rali|3e,hi|o,iali|3e,nali|3e,bili|3e,i|o,ezz|3,ew|2,ff|2,ent'|4,u|1,v|1,op|2,im|2,s|1,x|1,g|1,d|1,y|1,c|1,h|1,k|1,t|1,n|1,l|1,r|1,e|1,a|1,o|1"
      }
    },
    "presentTense": {
      "first": {
        "rules": "borrire|4o,ssalire|4go,ormire|3o,terdire|5co,anguire|4o,aledire|5co,anicare|2uco,iacere|3cio,otere|1sso,isalire|4go,ervire|3o,pparire|3io,mparire|3io,addire|4co,manere|3go,aprire|3o,bollire|4o,cucire|4o,empire|4o,sapere|1o,offrire|4o,olere|1glio,parere|2io,uscire|esco,fuggire|4o,valere|3go,coprire|4o,vestire|4o,sentire|4o,vertire|4o,seguire|4o,gliere|lgo,trarre|3ggo,durre|2co,tenere|3go,venire|3go,porre|2ngo,ire|1sco,ere|o,are|o",
        "exceptions": "avere|ho,bere|2vo,dipartire|6o,dire|2co,disparire|5io,mentire|4o,morire|1uoio,partire|4o,riassorbire|8o,ridare|3ò,ridire|4co,ripartire|6o,ristare|4ò,salire|3go,teletrasmettere|8etto,trasparire|6io,udire|odo,aborrire|5o,accendere|6o,algere|3o,ardere|3o,assidere|5o,cherere|4o,chierere|5o,dedurre|4co,desumere|5o,dormire|4o,ducere|3o,effondere|6o,elidere|4o,ergere|3o,erigere|4o,erodere|4o,espellere|6o,fervere|4o,fingere|4o,fremere|4o,gemere|3o,godere|3o,indurre|4co,languire|5o,ledere|3o,licere|3o,mescere|4o,mietere|4o,mingere|4o,mungere|4o,offrire|4o,parere|2io,pascere|4o,piacere|4cio,potere|2sso,profondere|7o,radere|3o,riaccendere|8o,ridere|3o,risapere|3o,sapere|1o,sedurre|4co,sentire|4o,servire|4o,soffrire|5o,solere|2glio,sopravvivere|9o,sparere|3io,sumere|3o,tangere|4o,temere|3o,tessere|4o,ungere|3o,urgere|3o,uscire|esco,vertere|4o,vivere|3o,volere|2glio",
        "rev": "bduco|3rre,brado|4ere,dduco|3rre,dergo|4ere,uffisco|4re,ssurgo|5ere,enedico|6ere,lango|4ere,ollido|5ere,onvergo|6ere,onvivo|5ere,orrodo|5ere,elinquo|6ere,erido|4ere,iffondo|6ere,irigo|4ere,irimo|4ere,ivergo|5ere,stollo|5ere,ioisco|3re,mbevo|4ere,ncendo|5ere,ndulgo|5ere,terdico|5re,nveisco|4re,aledico|5re,anuco|2icare,egligo|5ere,ttundo|5ere,resumo|5ere,ropello|6ere,edigo|4ere,edimo|4ere,epello|5ere,iardo|4ere,assorbo|6ire,ibollo|5ire,icevo|4ere,idico|3re,iduco|4ere,isento|5ire,ivivo|4ere,alfisco|4re,corgo|4ere,obbollo|6ire,rasetto|3mettere,raduco|4rre,asfondo|6ere,onsento|6ire,spergo|5ere,ssento|5ire,peto|3ere,piango|5ere,nfondo|5ere,addico|4re,ispondo|6ere,spargo|5ere,fungo|4ere,iparto|5ire,sciolgo|4gliere,perdo|4ere,suado|4ere,tolgo|2gliere,sigo|3ere,spando|5ere,riesco|2uscire,combo|4ere,trido|4ere,ascondo|6ere,ccido|4ere,mango|3ere,diligo|5ere,scelgo|3gliere,scindo|5ere,apro|3ire,assumo|5ere,conduco|5rre,credo|4ere,cucio|4re,empio|4re,fletto|5ere,fulgo|4ere,mordo|4ere,splendo|6ere,fotto|4ere,porgo|4ere,premo|4ere,divido|5ere,frango|5ere,rrido|4ere,salgo|3ire,tergo|4ere,iedo|3ere,ncido|4ere,pungo|4ere,stinguo|6ere,ecido|4ere,fendo|4ere,cuto|3ere,rudo|3ere,vado|3ere,misco|2re,cingo|4ere,sorgo|4ere,roduco|4rre,nasco|4ere,fuggo|4ire,vendo|4ere,colgo|2gliere,nnetto|5ere,tingo|4ere,cado|3ere,mergo|4ere,valgo|3ere,cresco|5ere,gisco|2re,stringo|6ere,zisco|2re,nosco|4ere,cerno|4ere,copro|4ire,vesto|4ire,batto|4ere,scendo|5ere,paio|2rire,chisco|3re,verto|4ire,vinco|4ere,pingo|4ere,chiudo|5ere,pendo|4ere,torco|4ere,primo|4ere,seguo|4ire,rompo|4ere,cisco|2re,sisto|4ere,olvo|3ere,giungo|5ere,rendo|4ere,scrivo|5ere,traggo|3rre,ludo|3ere,bisco|2re,volgo|4ere,pisco|2re,cedo|3ere,corro|4ere,sisco|2re,tengo|3ere,vengo|3ire,tendo|4ere,ggo|2ere,metto|4ere,lisco|2re,pongo|2rre,nisco|2re,uisco|2re,tisco|2re,disco|2re,risco|2re,o|are,ò|are"
      },
      "second": {
        "rules": "reviare|4,borrire|5,hiviare|4,ssalire|5,ormire|4,lencare|4hi,arsiare|4,terdire|5ci,radiare|4,anguire|5,aledire|5ci,anicare|2uchi,rodiare|4,otere|uoi,cipiare|4,pparire|5,isalire|5,esciare|4,mparire|5,ervire|4,tostare|5i,endiare|4,orpiare|4,raviare|4,rincare|4hi,osciare|4,stiare|3,oiare|2,ingare|3hi,uciare|3,baciare|4,addire|4ci,ulgare|3hi,aprire|4,bollire|5,cucire|4,empire|4,udiare|3,sapere|2i,usciare|4,offrire|5,aiare|2,miare|2,copiare|4,uscire|esci,idiare|3,isciare|4,uiare|2,fuggire|5,angare|3hi,rgare|2hi,fiare|2,ediare|3,ociare|3,lciare|3,coprire|5,vestire|5,ppiare|3,sentire|5,vertire|5,iciare|3,asciare|4,rciare|3,ugare|2hi,ucare|2hi,seguire|5,acare|2hi,ecare|2hi,ancare|3hi,lcare|2hi,niare|2,rcare|2hi,gliere|3,biare|2,trarre|3i,durre|2ci,scare|2hi,tenere|1ieni,riare|2,igare|2hi,venire|1ieni,agare|2hi,ziare|2,ocare|2hi,ogare|2hi,nciare|3,egare|2hi,porre|2ni,cciare|3,hiare|2,ccare|2hi,liare|2,icare|2hi,giare|2,ire|1sci,ere|i,are|i",
        "exceptions": "avere|hai,bere|2vi,dare|2i,dipartire|7,dire|2ci,disparire|7,indire|4ci,mentire|5,morire|1uori,ovviare|4,partire|5,predire|5ci,prolungare|7hi,riassorbire|9,ridare|4i,ridire|4ci,rinviare|5,ripartire|7,ristare|5i,solere|1uoli,stare|3i,stroncare|6hi,teletrasmettere|8etti,trasparire|8,troncare|5hi,udire|odi,volere|1uoi,aborrire|6,accendere|6i,ampliare|5,apporre|4ni,ardere|3i,assidere|5i,bigiare|4,cangiare|5,cariare|4,cherere|4i,chierere|5i,coniare|4,copiare|4,crocchiare|7,desumere|5i,doppiare|5,dormire|5,ducere|3i,educere|4i,effondere|6i,eleggere|5i,elidere|4i,erodere|4i,espellere|6i,fervere|4i,fischiare|6,forgiare|5,fremere|4i,gemere|3i,gloriare|5,godere|3i,graffiare|6,ingiuriare|7,languire|6,ledere|3i,leggere|4i,licere|3i,linciare|5,lisciare|5,macchiare|6,mietere|4i,mischiare|6,mungere|4i,obliare|4,offrire|5,oliare|3,opporre|4ni,pascere|4i,pazziare|5,pigiare|4,pisciare|5,porre|2ni,potere|1uoi,profondere|7i,radere|3i,raschiare|6,reggere|4i,riaccendere|8i,ridere|3i,riducere|5i,scomparire|8,sentire|5,seppiare|5,servire|5,smaniare|5,soffrire|6,sopravvivere|9i,strisciare|7,succhiare|6,sumere|3i,tediare|4,temere|3i,tessere|4i,traviare|5,umiliare|5,ungere|3i,uscire|esci,vertere|4i,vivere|3i",
        "rev": "bbai|4are,bbrevi|6are,bradi|4ere,calappi|7are,ccerchi|7are,docchi|6are,ffibbi|6are,fflosci|7are,mmali|5are,mmucchi|7are,mnisti|6are,ngusti|6are,nnaffi|6are,nnebbi|6are,nnoi|4are,rchivi|6are,rrabbi|6are,ssali|5re,ssedi|5are,vvinghi|7are,enedici|6ere,erci|4are,evicchi|7are,ofonchi|7are,ciacchi|7are,ruci|4are,alunni|6are,nticchi|7are,ncischi|7are,ollidi|5ere,ontrari|7are,onvivi|5ere,orrodi|5ere,elinqui|6ere,eridi|4ere,iffondi|6ere,ilani|5are,irimi|4ere,ispari|6re,istanzi|7are,ivorzi|6are,rmicchi|7are,ffigi|5are,logi|4are,ncomi|5are,sili|4are,spatri|6are,stolli|5ere,videnzi|7are,inanzi|6are,otocopi|7are,tapponi|5rre,mbevi|4ere,ncendi|5ere,ncipri|6are,nebri|5are,inocchi|7are,fradici|7are,nfuri|5are,ngabbi|6are,nguai|5are,nsedi|5are,nsidi|5are,nsudici|7are,ntarsi|6are,terponi|5rre,ventari|7are,nvidi|5are,nvischi|7are,rradi|5are,icenzi|6are,giucchi|7are,anuchi|2icare,rdicchi|7are,ssequi|6are,ttundi|5ere,vvi|3are,arodi|5are,ermani|5ere,iaci|3ere,otenzi|6are,resenzi|7are,resumi|5ere,rincipi|7are,ropelli|6ere,roteggi|6ere,nzecchi|7are,abbui|5are,edimi|4ere,epelli|5ere,iappari|7re,iardi|4ere,assorbi|7re,ibolli|6re,icevi|4ere,icopi|5are,ieleggi|6ere,ileggi|5ere,imani|4ere,imorchi|7are,invi|4are,ipudi|5are,isali|5re,isenti|6re,ivivi|4ere,osicchi|7are,ovesci|6are,birci|5are,borni|5are,operchi|7are,crosci|6are,cuoi|4are,drai|4are,fiduci|6are,obbolli|7re,offi|4are,uoli|olere,nnecchi|7are,overchi|7are,roloqui|7are,utacchi|7are,tipendi|7are,torpi|5are,trabili|7are,tudi|4are,ussidi|6are,valigi|6are,rasetti|3mettere,stimoni|7are,asfondi|6ere,raspari|7re,rebbi|5are,engi|4are,bacchi|6are,conci|5are,onsenti|7re,propri|6are,rischi|6are,ssenti|6re,fici|4are,emmi|4are,baci|4are,medi|4are,peti|3ere,nfondi|5ere,rapponi|5rre,orreggi|6ere,ispondi|6ere,fungi|4ere,iparti|6re,iponi|3rre,sciogli|7ere,perdi|4ere,suadi|4ere,togli|5ere,struggi|6ere,spandi|5ere,strani|6are,riesci|2uscire,combi|4ere,rnici|5are,ugi|3are,tridi|4ere,vecchi|6are,arci|4are,ascondi|6ere,ozi|3are,ccidi|4ere,scegli|6ere,supponi|5rre,nicchi|6are,scindi|5ere,apri|4re,assumi|5ere,concili|7are,credi|4ere,cuci|4re,dai|2re,empi|4re,fletti|5ere,mangi|5are,mordi|4ere,sai|2pere,specchi|7are,splendi|6ere,azi|3are,fotti|4ere,gonfi|5are,usci|4are,premi|4ere,dividi|5ere,coppi|5are,corci|5are,eponi|3rre,recchi|6are,rridi|4ere,vari|4are,iedi|3ere,ncidi|4ere,pungi|4ere,agi|3are,stingui|6ere,ecidi|4ere,fendi|4ere,cuti|3ere,rudi|3ere,vadi|3ere,nasci|4ere,oponi|3rre,fuggi|5re,stai|3re,vendi|4ere,cogli|5ere,nnetti|5ere,nunci|5are,mponi|3rre,cadi|3ere,izi|3are,vali|3ere,cominci|7are,oci|3are,lci|3are,ambi|4are,nosci|4ere,cerni|4ere,copri|5re,vesti|5re,batti|4ere,scendi|5ere,esci|3ere,verti|5re,vinci|4ere,chiudi|5ere,sponi|3rre,egi|3are,asci|4are,angi|3ere,pendi|4ere,torci|4ere,primi|4ere,segui|5re,rompi|4ere,dici|2re,anci|4are,sisti|4ere,olvi|3ere,igi|2ere,giungi|5ere,rendi|4ere,iggi|3ere,scrivi|5ere,trai|3rre,duci|2rre,ludi|3ere,cedi|3ere,corri|4ere,tieni|1enere,vieni|1enire,lgi|2ere,tendi|4ere,ingi|3ere,metti|4ere,rgi|2ere,cci|3are,gli|3are,ggi|3are,isci|1re,hi|are,i|are"
      },
      "third": {
        "rules": "borrire|4e,ssalire|4e,ormire|3e,terdire|5ce,anguire|4e,aledire|5ce,anicare|2uca,otere|uò,isalire|4e,pparire|4e,mparire|4e,addire|4ce,aprire|3e,cucire|3e,empire|4e,sapere|2,servire|4e,offrire|4e,olere|uole,uscire|esce,bollire|4e,fuggire|4e,coprire|4e,vestire|4e,vertire|4e,sentire|4e,seguire|4e,trarre|3e,durre|2ce,tenere|1iene,venire|1iene,porre|2ne,ire|1sce,re|",
        "exceptions": "avere|ha,bere|2ve,dare|1à,dipartire|6e,dire|2ce,disparire|6e,indire|4ce,mentire|4e,morire|1uore,partire|4e,predire|5ce,riassorbire|8e,ridare|3à,ridire|4ce,ripartire|6e,ristare|4à,salire|3e,teletrasmettere|8ette,trasparire|7e,udire|ode,ducere|4,educere|5,licere|4,risapere|4,sapere|2,uscire|esce",
        "rev": "borre|4ire,enedice|7re,elinque|7re,ispare|5ire,iverte|5ire,orme|3ire,uore|orire,erverte|6ire,iace|4re,assorbe|6ire,iduce|5re,rasette|3mettere,esse|4re,raspare|6ire,vverte|5ire,nverte|5ire,riesce|2uscire,combe|5re,mane|4re,appare|5ire,cuce|3ire,empie|4re,serve|4ire,compare|6ire,offre|4ire,uole|olere,sale|3ire,stingue|7re,parte|4ire,bolle|4ire,fugge|4ire,vale|4re,lle|3re,asce|4re,nosce|5re,cerne|5re,veste|4ire,esce|4re,vince|5re,pre|2ire,torce|5re,rompe|5re,ente|3ire,dice|2re,gue|2ire,glie|4re,trae|3rre,duce|2rre,tiene|1enere,viene|1enire,re|2re,me|2re,ve|2re,pone|2rre,te|2re,ge|2re,de|2re,isce|1re,anuca|2icare,a|1re,uò|otere,à|are"
      },
      "firstPlural": {
        "rules": "lencare|4hiamo,terdire|5ciamo,aledire|5ciamo,arere|1iamo,iacere|3ciamo,otere|1ssiamo,rincare|4hiamo,ingare|3hiamo,addire|4ciamo,ulgare|3hiamo,sapere|3piamo,olere|1gliamo,angare|3hiamo,rgare|2hiamo,ugare|2hiamo,ucare|2hiamo,acare|2hiamo,ecare|2hiamo,ancare|3hiamo,lcare|2hiamo,rcare|2hiamo,gliere|3amo,trarre|3iamo,durre|2ciamo,scare|2hiamo,igare|2hiamo,agare|2hiamo,ocare|2hiamo,ogare|2hiamo,egare|2hiamo,porre|2niamo,ccare|2hiamo,icare|2hiamo,ire|1amo,iare|2mo,ere|iamo,are|iamo",
        "exceptions": "avere|1bbiamo,bere|2viamo,dire|2ciamo,indire|4ciamo,predire|5ciamo,prolungare|7hiamo,ridire|4ciamo,stroncare|6hiamo,teletrasmettere|8ettiamo,troncare|5hiamo,abbacchiare|9mo,abbattere|6iamo,abbellire|7amo,abbrustolire|10amo,abbrutire|7amo,abolire|5amo,aborrire|6amo,abortire|6amo,abradere|5iamo,accalappiare|10mo,accendere|6iamo,accerchiare|9mo,accogliere|7amo,acconciare|8mo,accondiscendere|12iamo,acconsentire|10amo,accoppiare|8mo,accorciare|8mo,accorrere|6iamo,addivenire|8amo,aderire|5amo,adire|3amo,adocchiare|8mo,affievolire|9amo,afflosciare|9mo,aggiungere|7iamo,aggredire|7amo,alleggerire|9amo,allestire|7amo,ammansire|7amo,ammattire|7amo,ammettere|6iamo,ammollire|7amo,ammonire|6amo,ammorbidire|9amo,ammucchiare|9mo,ammuffire|7amo,amnistiare|8mo,ampliare|6mo,angustiare|8mo,annaffiare|8mo,annebbiare|8mo,annerire|6amo,annettere|6iamo,anteporre|6niamo,apparecchiare|11mo,appartenere|8iamo,appassire|7amo,appendere|6iamo,appesantire|9amo,appiattire|8amo,applaudire|8amo,apporre|4niamo,apprendere|7iamo,approfondire|10amo,appropriare|9mo,archiviare|8mo,ardere|3iamo,arrabbiare|8mo,arricchire|8amo,arridere|5iamo,arrischiare|9mo,arrugginire|9amo,ascendere|6iamo,ascondere|6iamo,ascrivere|6iamo,assalire|6amo,assediare|7mo,assentire|7amo,asserire|6amo,assidere|5iamo,assistere|6iamo,assorbire|7amo,assortire|7amo,assumere|5iamo,astenere|5iamo,attecchire|8amo,attendere|6iamo,attenere|5iamo,aulire|4amo,avvenire|6amo,avvertire|7amo,avvinghiare|9mo,avvizzire|7amo,bacchiare|7mo,bandire|5amo,battere|4iamo,benedicere|7iamo,berciare|6mo,bevicchiare|9mo,bigiare|5mo,blandire|6amo,bofonchiare|9mo,bruciacchiare|11mo,candire|5amo,cangiare|6mo,canticchiare|10mo,capire|4amo,cariare|5mo,cernere|4iamo,cherere|4iamo,chiarire|6amo,chierere|5iamo,cincischiare|10mo,circoncidere|9iamo,circoscrivere|10iamo,cogliere|5amo,coincidere|7iamo,collidere|6iamo,colpire|5amo,combattere|7iamo,cominciare|8mo,commettere|7iamo,comporre|5niamo,comprendere|8iamo,comprimere|7iamo,compromettere|10iamo,compungere|7iamo,concernere|7iamo,conciare|6mo,conciliare|8mo,concorrere|7iamo,concupire|7amo,condire|5amo,conferire|7amo,confondere|7iamo,congiungere|8iamo,coniare|5mo,connettere|7iamo,conseguire|8amo,consentire|8amo,consistere|7iamo,contendere|7iamo,contenere|6iamo,contraddistinguere|15iamo,contrapporre|9niamo,contravvenire|11amo,controbattere|10iamo,convenire|7amo,convertire|8amo,convivere|6iamo,copiare|5mo,coprire|5amo,correggere|7iamo,correre|4iamo,corrispondere|10iamo,corrodere|6iamo,costituire|8amo,credere|4iamo,crocchiare|8mo,decidere|5iamo,decorrere|6iamo,deferire|6amo,definire|6amo,defungere|6iamo,deglutire|7amo,demolire|6amo,deperire|6amo,deporre|4niamo,deprimere|6iamo,deridere|5iamo,descrivere|7iamo,desiare|5mo,desistere|6iamo,destituire|8amo,desumere|5iamo,detenere|5iamo,deviare|5mo,difendere|6iamo,differire|7amo,diffondere|7iamo,digerire|6amo,dilaniare|7mo,dimettere|6iamo,diminuire|7amo,dipartire|7amo,dipendere|6iamo,diporre|4niamo,dirimere|5iamo,disattendere|9iamo,discendere|7iamo,discernere|7iamo,disciogliere|9amo,disconnettere|10iamo,discoprire|8amo,discorrere|7iamo,disgiungere|8iamo,dismettere|7iamo,disparire|7amo,disporre|5niamo,dissentire|8amo,disseppellire|11amo,dissuadere|7iamo,distanziare|9mo,distendere|7iamo,distinguere|8iamo,distogliere|8amo,distruggere|8iamo,disubbidire|9amo,divenire|6amo,divertire|7amo,dividere|5iamo,divorziare|8mo,doppiare|6mo,dormicchiare|10mo,dormire|5amo,ducere|3iamo,educere|4iamo,effondere|6iamo,eleggere|5iamo,elidere|4iamo,emettere|5iamo,erodere|4iamo,erudire|5amo,esaudire|6amo,esaurire|6amo,eseguire|6amo,esercire|6amo,esistere|5iamo,esordire|6amo,espandere|6iamo,espatriare|8mo,espellere|6iamo,esperire|6amo,espiare|5mo,esporre|4niamo,esprimere|6iamo,espropriare|9mo,espungere|6iamo,estendere|6iamo,estinguere|7iamo,estollere|6iamo,estraniare|8mo,evidenziare|9mo,favorire|6amo,fendere|4iamo,ferire|4amo,fervere|4iamo,finanziare|8mo,finire|4amo,fiorire|5amo,fischiare|7mo,flettere|5iamo,forgiare|6mo,fornire|5amo,fotocopiare|9mo,fottere|4iamo,fraintendere|9iamo,fremere|4iamo,frinire|5amo,fungere|4iamo,garrire|5amo,gemere|3iamo,gestire|5amo,ghermire|6amo,giungere|5iamo,giustapporre|9niamo,gloriare|6mo,godere|3iamo,gonfiare|6mo,graffiare|7mo,gremire|5amo,grugnire|6amo,guarnire|6amo,imbastire|7amo,imbellire|7amo,imbevere|5iamo,imbiondire|8amo,imbizzarrire|10amo,imbottire|7amo,imbruttire|8amo,immettere|6iamo,impallidire|9amo,impartire|7amo,impaurire|7amo,impensierire|10amo,impietosire|9amo,impietrire|8amo,impigrire|7amo,imporre|4niamo,impoverire|8amo,impratichire|10amo,imprendere|7iamo,impreziosire|10amo,imprimere|6iamo,imputridire|9amo,inacidire|7amo,inaridire|7amo,incanutire|8amo,incendere|6iamo,incenerire|8amo,incidere|5iamo,incollerire|9amo,incombere|6iamo,incominciare|10mo,incorrere|6iamo,incuriosire|9amo,indebolire|8amo,indispettire|10amo,indisporre|7niamo,inebriare|7mo,inferire|6amo,inferocire|8amo,infiacchire|9amo,infinocchiare|11mo,infittire|7amo,infondere|6iamo,infradiciare|10mo,infreddolire|10amo,infuriare|7mo,ingabbiare|8mo,ingentilire|9amo,ingerire|6amo,inghiottire|9amo,ingiallire|8amo,ingigantire|9amo,ingiungere|7iamo,ingiuriare|8mo,ingobbire|7amo,ingrandire|8amo,inorgoglire|9amo,inorridire|8amo,insaporire|8amo,inscrivere|7iamo,insediare|7mo,inseguire|7amo,inserire|6amo,insidiare|7mo,insignire|7amo,insistere|6iamo,insospettire|10amo,insudiciare|9mo,intendere|6iamo,intenerire|8amo,intercorrere|9iamo,interloquire|10amo,interporre|7niamo,intervenire|9amo,intiepidire|9amo,intimorire|8amo,intirizzire|9amo,intontire|7amo,intorpidire|9amo,intraprendere|10iamo,intrattenere|9iamo,intridere|6iamo,intristire|8amo,intromettere|9iamo,invecchiare|9mo,inventariare|10mo,invertire|7amo,investire|7amo,invidiare|7mo,invischiare|9mo,irradiare|7mo,irretire|6amo,irridere|5iamo,irrobustire|9amo,iscrivere|6iamo,ispessire|7amo,istituire|7amo,lambire|5amo,languire|6amo,ledere|3iamo,leggere|4iamo,lenire|4amo,licenziare|8mo,licere|3iamo,linciare|6mo,macchiare|7mo,mangiare|6mo,mangiucchiare|11mo,manomettere|8iamo,mantenere|6iamo,manutenere|7iamo,marciare|6mo,mentire|5amo,mettere|4iamo,mietere|4iamo,mischiare|7mo,mordere|4iamo,mordicchiare|10mo,morire|4amo,mungere|4iamo,munire|4amo,nascere|4iamo,nascondere|7iamo,nicchiare|7mo,obliare|5mo,occidere|5iamo,occorrere|6iamo,odiare|4mo,offendere|6iamo,offrire|5amo,oliare|4mo,omettere|5iamo,opporre|4niamo,opprimere|6iamo,ordire|4amo,orecchiare|8mo,ottenere|5iamo,parere|2iamo,parodiare|7mo,partire|5amo,partorire|7amo,pascere|4iamo,pattuire|6amo,pazziare|6mo,pendere|4iamo,percorrere|7iamo,perire|4amo,permanere|6iamo,permettere|7iamo,perseguire|8amo,persistere|7iamo,persuadere|7iamo,pertenere|6iamo,pervenire|7amo,pervertire|8amo,piacere|4ciamo,pigiare|5mo,poltrire|6amo,porre|2niamo,portendere|7iamo,posporre|5niamo,potenziare|8mo,potere|2ssiamo,precidere|6iamo,precorrere|7iamo,predisporre|8niamo,preferire|7amo,premere|4iamo,premettere|7iamo,premunire|7amo,prenascere|7iamo,prendere|5iamo,preporre|5niamo,prescegliere|9amo,prescrivere|8iamo,presenziare|9mo,prestabilire|10amo,presumere|6iamo,presupporre|8niamo,pretendere|7iamo,prevenire|7amo,principiare|9mo,proferire|7amo,profondere|7iamo,progredire|8amo,promettere|7iamo,propellere|7iamo,propendere|7iamo,proporre|5niamo,proseguire|8amo,prostituire|9amo,proteggere|7iamo,protendere|7iamo,provenire|7amo,pulire|4amo,pungere|4iamo,punire|4amo,punzecchiare|10mo,rabbonire|7amo,rabbrividire|10amo,raccogliere|8amo,raccoppiare|9mo,raccorciare|9mo,radere|3iamo,raggiungere|8iamo,raggrinzire|9amo,rammollire|8amo,rannicchiare|10mo,rapire|4amo,rapprendere|8iamo,raschiare|7mo,recensire|7amo,recidere|5iamo,redimere|5iamo,reggere|4iamo,regredire|7amo,reinserire|8amo,rendere|4iamo,repellere|6iamo,reperire|6amo,reprimere|6iamo,rescindere|7iamo,resistere|6iamo,restituire|8amo,riaccendere|8iamo,riapparire|8amo,riappendere|8iamo,riardere|5iamo,riassorbire|9amo,riassumere|7iamo,ribadire|6amo,ribattere|6iamo,ribollire|7amo,ricogliere|7amo,ricominciare|10mo,ricomporre|7niamo,riconciliare|10mo,ricongiungere|10iamo,ricopiare|7mo,ricoprire|7amo,ricorrere|6iamo,ricostituire|10amo,ricredere|6iamo,ridefinire|8amo,ridivenire|8amo,riducere|5iamo,rieleggere|7iamo,riferire|6amo,rifinire|6amo,rifiorire|7amo,riflettere|7iamo,rifornire|7amo,rileggere|6iamo,rimanere|5iamo,rimangiare|8mo,rimbambire|8amo,rimettere|6iamo,rimorchiare|9mo,rimordere|6iamo,rimpicciolire|11amo,rinascere|6iamo,rincoglionire|11amo,rincominciare|11mo,rinverdire|8amo,rinvigorire|9amo,ripartire|7amo,riporre|4niamo,riprendere|7iamo,riproporre|7niamo,risalire|6amo,risapere|5piamo,rischiare|7mo,riscoprire|8amo,riscrivere|7iamo,risentire|7amo,rispecchiare|10mo,risplendere|8iamo,rispondere|7iamo,ristabilire|9amo,ritenere|5iamo,ritrasmettere|10iamo,riunire|5amo,rivendere|6iamo,rivenire|6amo,riverire|6amo,rivestire|7amo,rivivere|5iamo,rosicchiare|9mo,rovesciare|8mo,sancire|5amo,sapere|3piamo,sbalordire|8amo,sbattere|5iamo,sbizzarrire|9amo,sborniare|7mo,scandire|6amo,scaturire|7amo,scegliere|6amo,scendere|5iamo,scernere|5iamo,schermire|7amo,schernire|7amo,schiarire|7amo,sciare|4mo,scindere|5iamo,sciogliere|7amo,scipidire|7amo,scommettere|8iamo,scomparire|8amo,scomporre|6niamo,sconnettere|8iamo,scoperchiare|10mo,scoppiare|7mo,scoprire|6amo,scorciare|7mo,scorrere|5iamo,scoscendere|8iamo,scrivere|5iamo,scrosciare|8mo,secernere|6iamo,seguire|5amo,sentire|5amo,seppellire|8amo,seppiare|6mo,servire|5amo,sfiduciare|8mo,sfinire|5amo,sfoltire|6amo,sfottere|5iamo,sgonfiare|7mo,sgranchire|8amo,sgusciare|7mo,smaniare|6mo,smarrire|6amo,smentire|6amo,smettere|5iamo,sobbollire|8amo,soccombere|7iamo,soccorrere|7iamo,soffrire|6amo,soggiungere|8iamo,solere|2gliamo,sommettere|7iamo,sonnecchiare|10mo,sopire|4amo,sopperire|7amo,sopprimere|7iamo,sopraggiungere|11iamo,sopravvenire|10amo,sopravvivere|9iamo,soprintendere|10iamo,sorbire|5amo,sorprendere|8iamo,sorreggere|7iamo,sorridere|6iamo,sortire|5amo,sospendere|7iamo,sostenere|6iamo,sostituire|8amo,sottendere|7iamo,sottintendere|10iamo,sottomettere|9iamo,sottoporre|7niamo,sottoscrivere|10iamo,soverchiare|9mo,sovrapporre|8niamo,sovrintendere|10iamo,sovvenire|7amo,sovvertire|8amo,spandere|5iamo,sparecchiare|10mo,spartire|6amo,spaurire|6amo,spazientire|9amo,specchiare|8mo,spendere|5iamo,spiare|4mo,splendere|6iamo,spremere|5iamo,sproloquiare|10mo,sputacchiare|10mo,squarciare|8mo,stabilire|7amo,statuire|6amo,stendere|5iamo,stipendiare|9mo,stizzire|6amo,stordire|6amo,strabiliare|9mo,straniare|7mo,stridere|5iamo,struggere|6iamo,strusciare|8mo,subire|4amo,succhiare|7mo,suddividere|8iamo,suggerire|7amo,sumere|3iamo,supporre|5niamo,susseguire|8amo,sussidiare|8mo,sussistere|7iamo,svaligiare|8mo,svecchiare|8mo,svendere|5iamo,svestire|6amo,sviare|4mo,tediare|5mo,temere|3iamo,tendere|4iamo,tenere|3iamo,tessere|4iamo,testimoniare|10mo,togliere|5amo,tossire|5amo,tradire|5amo,tramettere|7iamo,trasalire|7amo,trascendere|8iamo,trascorrere|8iamo,trascrivere|8iamo,trasferire|8amo,trasfondere|8iamo,trasgredire|9amo,trasmettere|8iamo,trasparire|8amo,trasporre|6niamo,trattenere|7iamo,travestire|8amo,traviare|6mo,trebbiare|7mo,ubbidire|6amo,uccidere|5iamo,udire|3amo,umiliare|6mo,ungere|3iamo,unire|3amo,vagire|4amo,vendere|4iamo,vertere|4iamo,vestire|5amo,vivere|3iamo,volere|2gliamo",
        "rev": "bbaiamo|5re,reviamo|5re,caniamo|4re,cudiamo|4re,uisiamo|4re,olciamo|4re,ibbiamo|5re,maliamo|5re,hiliamo|4re,nnuiamo|4re,rguiamo|4re,tutiamo|4re,viliamo|4re,ruciamo|5re,unniamo|5re,arpiamo|4re,rcuiamo|4re,rariamo|5re,todiamo|4re,nquiamo|3ere,figiamo|5re,logiamo|5re,comiamo|5re,sibiamo|4re,siliamo|5re,ioiamo|3re,uariamo|4re,ialiamo|4re,bibiamo|4re,spriamo|4re,ipriamo|5re,tidiamo|4re,losiamo|4re,guaiamo|5re,nibiamo|4re,vosiamo|4re,arsiamo|5re,ntuiamo|4re,nveiamo|4re,gidiamo|4re,utriamo|4re,equiamo|5re,undiamo|3ere,sagiamo|4re,oibiamo|4re,bbuiamo|5re,ceviamo|3ere,vaniamo|4re,pudiamo|5re,iadiamo|4re,irciamo|5re,alfiamo|4re,draiamo|5re,agriamo|4re,offiamo|5re,orpiamo|5re,tudiamo|5re,tupiamo|4re,ppliamo|4re,eltiamo|4re,engiamo|5re,oiamo|3re,vviamo|4re,ficiamo|5re,emmiamo|5re,baciamo|5re,mediamo|5re,patiamo|4re,petiamo|3ere,bediamo|4re,erdiamo|3ere,niciamo|5re,ugiamo|4re,midiamo|4re,oziamo|4re,apriamo|4re,cuciamo|4re,empiamo|4re,inviamo|5re,aziamo|4re,runiamo|4re,variamo|5re,iediamo|3ere,agiamo|4re,cutiamo|3ere,rudiamo|3ere,vadiamo|3ere,arciamo|4re,usciamo|4re,pediamo|4re,isciamo|5re,unciamo|5re,cepiamo|4re,cadiamo|3ere,iziamo|4re,valiamo|3ere,ociamo|4re,ibuiamo|4re,lciamo|4re,ambiamo|5re,osciamo|3ere,ruiamo|3re,uggiamo|4re,esciamo|3ere,inciamo|3ere,iudiamo|3ere,egiamo|4re,asciamo|5re,luiamo|3re,angiamo|3ere,orciamo|3ere,ompiamo|3ere,diciamo|2re,anciamo|5re,olviamo|3ere,igiamo|2ere,iggiamo|3ere,traiamo|3rre,duciamo|2rre,ludiamo|3ere,cediamo|3ere,lgiamo|2ere,ingiamo|3ere,rgiamo|2ere,cciamo|4re,gliamo|4re,ggiamo|4re,hiamo|are,iamo|are"
      },
      "secondPlural": {
        "rules": "trarre|3ete,durre|2cete,porre|2nete,re|te",
        "exceptions": "bere|2vete,teletrasmettere|8ettete,dedurre|4cete,sedurre|4cete",
        "rev": "bducete|3rre,dducete|3rre,settete|1mettere,aducete|3rre,nducete|3rre,oducete|3rre,traete|3rre,ponete|2rre,te|re"
      },
      "thirdPlural": {
        "rules": "borrire|4ono,ssalire|4gono,ormire|3ono,terdire|5cono,anguire|4ono,aledire|5cono,anicare|2ucano,iacere|3ciono,otere|1ssono,isalire|4gono,tostare|5nno,pparire|3iono,mparire|3iono,addire|4cono,manere|3gono,aprire|3ono,cucire|4ono,empire|4ono,sapere|2nno,servire|4ono,offrire|4ono,olere|1gliono,parere|2iono,uscire|escono,bollire|4ono,fuggire|4ono,valere|3gono,coprire|4ono,vestire|4ono,vertire|4ono,sentire|4ono,seguire|4ono,gliere|lgono,trarre|3ggono,durre|2cono,tenere|3gono,venire|3gono,porre|2ngono,ire|1scono,ere|ono,are|1no",
        "exceptions": "avere|hanno,bere|2vono,dare|2nno,dipartire|6ono,dire|2cono,disparire|5iono,indire|4cono,mentire|4ono,morire|1uoiono,partire|4ono,predire|5cono,riassorbire|8ono,ridare|4nno,ridire|4cono,ripartire|6ono,ristare|5nno,salire|3gono,stare|3nno,teletrasmettere|8ettono,trasparire|6iono,udire|odono,avvertire|6ono,benedicere|7ono,convertire|7ono,divertire|6ono,ducere|3ono,educere|4ono,invertire|6ono,licere|3ono,parere|2iono,pervertire|7ono,sovvertire|7ono,sparere|3iono,uscire|escono",
        "rev": "borrono|4ire,inquono|4ere,ormono|3ire,anucano|2icare,uoiono|orire,acciono|2ere,ossono|1tere,sorbono|4ire,iducono|4ere,settono|1mettere,essono|3ere,iolgono|2gliere,tolgono|2gliere,iescono|1uscire,combono|4ere,mangono|3ere,celgono|2gliere,cuciono|4re,empiono|4re,sanno|2pere,servono|4ire,offrono|4ire,ogliono|1lere,salgono|3ire,inguono|4ere,partono|4ire,bollono|4ire,fuggono|4ire,colgono|2gliere,valgono|3ere,llono|2ere,ascono|3ere,noscono|4ere,cernono|4ere,anno|1re,vestono|4ire,escono|3ere,paiono|2rire,vincono|4ere,prono|2ire,torcono|4ere,rompono|4ere,entono|3ire,dicono|2re,guono|2ire,raggono|2rre,ducono|2rre,tengono|3ere,vengono|3ire,rono|1ere,mono|1ere,vono|1ere,pongono|2rre,tono|1ere,gono|1ere,dono|1ere,iscono|1re,ano|1re"
      }
    },
    "pastTense": {
      "first": {
        "rules": "cellere|3si,tollere|3si,lettere|2ssi,terdire|5ssi,olcere|2si,condere|2si,uocere|ocqui,tundere|2si,edigere|2assi,edimere|2ensi,tostare|4etti,pegnere|2nsi,trafare|4eci,pparire|4vi,hiedere|3si,mparire|4vi,addire|4ssi,pondere|2si,vellere|3si,manere|2si,cindere|2ssi,sapere|1eppi,cedere|2ssi,inguere|2si,rodere|2si,cadere|3di,cutere|2ssi,sfare|2eci,ducere|2ssi,nascere|2cqui,rdere|1si,solvere|3si,valere|3si,pellere|1ulsi,efare|2eci,igere|essi,sumere|2nsi,vincere|3si,adere|1si,torcere|3si,acere|2qui,primere|2essi,rompere|1uppi,fondere|1usi,gliere|lsi,scere|bbi,trarre|3ssi,durre|2ssi,tenere|3ni,rere|si,ivere|1ssi,venire|3ni,idere|1si,udere|1si,ggere|ssi,mettere|1isi,porre|2si,endere|1si,gere|si,re|i",
        "exceptions": "accadere|&#8212;,avere|ebbi,contraffare|8eci,dire|2ssi,disparire|6vi,dolere|3si,espandere|5si,fare|1eci,indire|4ssi,ledere|2si,predire|5ssi,ridire|4ssi,rifare|3eci,ristare|4etti,sopraffare|7eci,stare|2etti,teletrasmettere|8isi,trasparire|7vi,volere|3li,ardere|2si,ducere|2ssi,educere|3ssi,erigere|2essi,estinguere|5si,estollere|5si,flettere|3ssi,leggere|2ssi,molcere|3si,reggere|2ssi,rileggere|4ssi,scorgere|4si",
        "rev": "ssisi|3dere,ssursi|4gere,hesi|2rere,ollisi|4dere,iressi|2igere,spansi|4dere,ndulsi|4gere,ascosi|4ndere,eglessi|3igere,ocqui|uocere,ttusi|3ndere,rotessi|4ggere,edassi|2igere,edensi|2imere,iarsi|3dere,idussi|3cere,pensi|2gnere,trasisi|4mettere,olli|2ere,flissi|3ggere,istinsi|5guere,orressi|4ggere,risposi|5ndere,sparsi|4gere,sciolsi|4gliere,tolsi|2gliere,strussi|4ggere,masi|2nere,dilessi|3igere,scelsi|3gliere,scissi|3ndere,chiesi|4dere,elessi|3ggere,fulsi|3gere,morsi|3dere,seppi|1apere,frissi|3ggere,porsi|3gere,divisi|4dere,cessi|2dere,rosi|2dere,caddi|3ere,cussi|2tere,elsi|2lere,sorsi|3gere,nacqui|2scere,stetti|2are,colsi|2gliere,solsi|3vere,vissi|2vere,valsi|3ere,pulsi|1ellere,parvi|3ire,risi|2dere,sunsi|2mere,vinsi|3cere,fissi|2ggere,asi|1dere,dissi|2re,torsi|3cere,acqui|2ere,pressi|2imere,ruppi|1ompere,cisi|2dere,fusi|1ondere,bbi|scere,scrissi|4vere,trassi|3rre,dussi|2rre,volsi|3gere,tenni|3ere,corsi|3rere,ersi|2gere,feci|1are,venni|3ire,usi|1dere,misi|1ettere,posi|2rre,esi|1ndere,nsi|1gere,i|re"
      },
      "second": {
        "rules": "terdire|5cesti,tostare|4esti,trafare|5cesti,addire|4cesti,sfare|3cesti,efare|3cesti,trarre|3esti,durre|2cesti,porre|2nesti,re|sti",
        "exceptions": "accadere|&#8212;,contraffare|9cesti,dire|2cesti,fare|2cesti,indire|4cesti,predire|5cesti,ridire|4cesti,rifare|4cesti,ristare|4esti,sopraffare|8cesti,stare|2esti,teletrasmettere|8ettesti,abdurre|4cesti,addurre|4cesti,condurre|5cesti,dedurre|4cesti,indurre|4cesti,introdurre|7cesti,produrre|5cesti,ricondurre|7cesti,riprodurre|7cesti,sedurre|4cesti,tradurre|5cesti",
        "rev": "stesti|2are,dicesti|2re,traesti|3rre,facesti|2re,ponesti|2rre,sti|re"
      },
      "third": {
        "rules": "cellere|3se,tollere|3se,lettere|2sse,terdire|5sse,olcere|2se,uocere|ocque,edigere|2asse,edimere|2ense,tostare|4ette,pegnere|2nse,trafare|4ece,pparire|4ve,hiedere|3se,mparire|4ve,addire|4sse,vellere|3se,manere|2se,cindere|2sse,piovere|4ve,sapere|1eppe,cedere|2sse,inguere|2se,rodere|2se,cutere|2sse,sfare|2ece,ducere|2sse,nascere|2cque,rdere|1se,solvere|3se,valere|3se,pellere|1ulse,cadere|3de,efare|2ece,igere|esse,sumere|2nse,vincere|3se,adere|1se,torcere|3se,acere|2que,primere|2esse,rompere|1uppe,fondere|1use,gliere|lse,scere|bbe,trarre|3sse,durre|2sse,tenere|3ne,rere|se,ivere|1sse,venire|3ne,idere|1se,udere|1se,ggere|sse,mettere|1ise,porre|2se,ndere|se,gere|se,ire|ì,are|ò",
        "exceptions": "arrogere|&#8212;,avere|ebbe,contraffare|8ece,dire|2sse,disparire|6ve,dolere|3se,espandere|5se,fare|1ece,indire|4sse,ledere|2se,predire|5sse,ridire|4sse,rifare|3ece,ristare|4ette,solere|4tte,sopraffare|7ece,spandere|5é,spiovere|5é,stare|2ette,teletrasmettere|8ise,trasparire|7ve,volere|3le,ardere|2se,ducere|2sse,educere|3sse,erigere|2esse,estinguere|5se,estollere|5se,flettere|3sse,leggere|2sse,molcere|3se,reggere|2sse,rileggere|4sse,scorgere|4se",
        "rev": "ssise|3dere,ssurse|4gere,hese|2rere,ollise|4dere,iresse|2igere,spanse|4dere,ndulse|4gere,ascose|4ndere,eglesse|3igere,ocque|uocere,ttuse|3ndere,rotesse|4ggere,edasse|2igere,edense|2imere,iarse|3dere,idusse|3cere,olette|3re,pense|2gnere,trasise|4mettere,olle|2ere,flisse|3ggere,istinse|5guere,orresse|4ggere,rispose|5ndere,sparse|4gere,sciolse|4gliere,tolse|2gliere,strusse|4ggere,mase|2nere,dilesse|3igere,scelse|3gliere,scisse|3ndere,chiese|4dere,elesse|3ggere,fulse|3gere,morse|3dere,piovve|4ere,seppe|1apere,frisse|3ggere,porse|3gere,divise|4dere,cesse|2dere,rose|2dere,cusse|2tere,else|2lere,sorse|3gere,nacque|2scere,stette|2are,colse|2gliere,solse|3vere,visse|2vere,valse|3ere,pulse|1ellere,cadde|3ere,parve|3ire,rise|2dere,sunse|2mere,vinse|3cere,fisse|2ggere,ase|1dere,disse|2re,torse|3cere,acque|2ere,presse|2imere,ruppe|1ompere,cise|2dere,fuse|1ondere,bbe|scere,scrisse|4vere,trasse|3rre,dusse|2rre,volse|3gere,tenne|3ere,corse|3rere,erse|2gere,fece|1are,venne|3ire,use|1dere,mise|1ettere,pose|2rre,ese|1ndere,nse|1gere,é|ere,ì|ire,ò|are"
      },
      "firstPlural": {
        "rules": "terdire|5cemmo,tostare|4emmo,trafare|5cemmo,addire|4cemmo,sfare|3cemmo,efare|3cemmo,trarre|3emmo,durre|2cemmo,porre|2nemmo,re|mmo",
        "exceptions": "accadere|&#8212;,contraffare|9cemmo,dire|2cemmo,fare|2cemmo,indire|4cemmo,predire|5cemmo,ridire|4cemmo,rifare|4cemmo,ristare|4emmo,sopraffare|8cemmo,stare|2emmo,teletrasmettere|8ettemmo,abdurre|4cemmo,addurre|4cemmo,condurre|5cemmo,dedurre|4cemmo,indurre|4cemmo,introdurre|7cemmo,produrre|5cemmo,ricondurre|7cemmo,riprodurre|7cemmo,sedurre|4cemmo,tradurre|5cemmo",
        "rev": "stemmo|2are,dicemmo|2re,traemmo|3rre,facemmo|2re,ponemmo|2rre,mmo|re"
      },
      "secondPlural": {
        "rules": "terdire|5ceste,tostare|4este,trafare|5ceste,addire|4ceste,sfare|3ceste,efare|3ceste,trarre|3este,durre|2ceste,porre|2neste,re|ste",
        "exceptions": "accadere|&#8212;,contraffare|9ceste,dire|2ceste,fare|2ceste,indire|4ceste,predire|5ceste,ridire|4ceste,rifare|4ceste,ristare|4este,sopraffare|8ceste,stare|2este,teletrasmettere|8etteste,abdurre|4ceste,addurre|4ceste,condurre|5ceste,dedurre|4ceste,indurre|4ceste,introdurre|7ceste,produrre|5ceste,ricondurre|7ceste,riprodurre|7ceste,sedurre|4ceste,tradurre|5ceste",
        "rev": "steste|2are,diceste|2re,traeste|3rre,faceste|2re,poneste|2rre,ste|re"
      },
      "thirdPlural": {
        "rules": "cellere|3sero,tollere|3sero,lettere|2ssero,terdire|5ssero,olcere|2sero,uocere|ocquero,edigere|2assero,edimere|2ensero,tostare|4ettero,pegnere|2nsero,trafare|4ecero,pparire|4vero,hiedere|3sero,mparire|4vero,addire|4ssero,vellere|3sero,pandere|3sero,manere|2sero,cindere|2ssero,sapere|1eppero,cedere|2ssero,inguere|2sero,rodere|2sero,cutere|2ssero,sfare|2ecero,ducere|2ssero,nascere|2cquero,rdere|1sero,solvere|3sero,valere|3sero,pellere|1ulsero,cadere|3dero,efare|2ecero,igere|essero,sumere|2nsero,vincere|3sero,adere|1sero,torcere|3sero,acere|2quero,primere|2essero,rompere|1uppero,fondere|1usero,gliere|lsero,scere|bbero,trarre|3ssero,durre|2ssero,tenere|3nero,rere|sero,ivere|1ssero,venire|3nero,idere|1sero,udere|1sero,ggere|ssero,mettere|1isero,porre|2sero,ndere|sero,gere|sero,re|1ono",
        "exceptions": "arrogere|&#8212;,avere|ebbero,contraffare|8ecero,dire|2ssero,disparire|6vero,dolere|3sero,fare|1ecero,indire|4ssero,ledere|2sero,piovere|4vero,predire|5ssero,ridire|4ssero,rifare|3ecero,ripiovere|6vero,ristare|4ettero,sopraffare|7ecero,stare|2ettero,teletrasmettere|8isero,trasparire|7vero,volere|3lero,ardere|2sero,contraddistinguere|13sero,correggere|5ssero,corrispondere|8sero,diligere|3essero,dirigere|3essero,distinguere|6sero,ducere|2ssero,educere|3ssero,eleggere|3ssero,erigere|2essero,estinguere|5sero,estollere|5sero,flettere|3ssero,friggere|3ssero,leggere|2ssero,molcere|3sero,nascere|2cquero,negligere|4essero,prediligere|6essero,prenascere|5cquero,prescegliere|6lsero,reggere|2ssero,riducere|4ssero,rieleggere|5ssero,rileggere|4ssero,rinascere|4cquero,rispondere|5sero,scegliere|3lsero,scorgere|4sero,soffriggere|6ssero,sorreggere|5ssero",
        "rev": "ssisero|3dere,sursero|3gere,hesero|2rere,llisero|3dere,dulsero|3gere,scosero|3ndere,ocquero|uocere,ttusero|3ndere,tessero|2ggere,dassero|1igere,densero|1imere,iarsero|3dere,pensero|2gnere,asisero|2mettere,ollero|2ere,lissero|2ggere,hiesero|3dere,parsero|3gere,iolsero|2gliere,tolsero|2gliere,russero|2ggere,ivisero|3dere,pansero|3dere,masero|2nere,iovvero|3ere,cissero|2ndere,fulsero|3gere,morsero|3dere,seppero|1apere,porsero|3gere,cessero|2dere,rosero|2dere,cussero|2tere,elsero|2lere,sorsero|3gere,tettero|1are,colsero|2gliere,solsero|3vere,vissero|2vere,valsero|3ere,pulsero|1ellere,caddero|3ere,parvero|3ire,risero|2dere,sunsero|2mere,vinsero|3cere,fissero|2ggere,asero|1dere,dissero|2re,torsero|3cere,acquero|2ere,ressero|1imere,ruppero|1ompere,cisero|2dere,fusero|1ondere,bbero|scere,rissero|2vere,rassero|2rre,dussero|2rre,volsero|3gere,tennero|3ere,corsero|3rere,ersero|2gere,fecero|1are,vennero|3ire,usero|1dere,misero|1ettere,posero|2rre,esero|1ndere,nsero|1gere,rono|1e"
      }
    },
    "futureTense": {
      "first": {
        "rules": "ompiere|4rò,ecadere|4rò,overe|2rò,lencare|4herò,otere|2rò,icadere|4rò,esciare|3erò,tostare|6ò,trafare|6ò,rincare|4herò,osciare|3erò,ingare|3herò,uciare|2erò,baciare|3erò,ulgare|3herò,olere|1rrò,manere|2rrò,sapere|3rò,usciare|3erò,parere|3rò,sfare|4ò,ducere|2rrò,isciare|3erò,vivere|3rò,valere|2rrò,angare|3herò,rgare|2herò,ociare|2erò,efare|4ò,lciare|2erò,iciare|2erò,asciare|3erò,rciare|2erò,ugare|2herò,ucare|2herò,acare|2herò,ecare|2herò,ancare|3herò,lcare|2herò,rcare|2herò,scare|2herò,tenere|2rrò,igare|2herò,venire|2rrò,agare|2herò,ocare|2herò,ogare|2herò,nciare|2erò,egare|2herò,cciare|2erò,ccare|2herò,rre|2ò,icare|2herò,giare|1erò,ire|2ò,ere|2ò,are|erò",
        "exceptions": "accadere|&#8212;,andare|3rò,avere|2rò,cadere|3rò,contraffare|10ò,dare|3ò,fare|3ò,godere|3rò,prolungare|7herò,ridare|5ò,rifare|5ò,ristare|6ò,sopraffare|9ò,stare|4ò,stroncare|6herò,teletrasmettere|8etterò,troncare|5herò,accendere|8ò,accogliere|9ò,accondiscendere|14ò,annettere|8ò,ardere|5ò,ascendere|8ò,ascondere|8ò,assidere|7ò,bigiare|3erò,cangiare|4erò,cherere|6ò,chierere|7ò,cogliere|7ò,confondere|9ò,connettere|9ò,contraddistinguere|17ò,correggere|9ò,desumere|7ò,diffondere|9ò,discendere|9ò,disciogliere|11ò,disconnettere|12ò,distinguere|10ò,distogliere|10ò,divellere|8ò,dolere|2rrò,ducere|2rrò,eccellere|8ò,educere|3rrò,effondere|8ò,eleggere|7ò,elidere|6ò,erodere|6ò,espellere|8ò,estinguere|9ò,fervere|6ò,flettere|7ò,forgiare|4erò,fremere|6ò,gemere|5ò,incendere|8ò,infondere|8ò,ledere|5ò,leggere|6ò,licere|5ò,linciare|4erò,mietere|6ò,mungere|6ò,nascondere|9ò,pascere|6ò,pigiare|3erò,prescegliere|11ò,presumere|8ò,profondere|9ò,propellere|9ò,proteggere|9ò,raccogliere|10ò,radere|5ò,reggere|6ò,repellere|8ò,riaccendere|10ò,ricogliere|9ò,ridere|5ò,rieleggere|9ò,riflettere|9ò,rileggere|8ò,scegliere|8ò,scendere|7ò,sciogliere|9ò,sconnettere|10ò,scoscendere|10ò,sorreggere|9ò,spegnere|7ò,sumere|5ò,svellere|7ò,temere|5ò,tessere|6ò,togliere|7ò,trascendere|10ò,trasfondere|10ò,ungere|5ò,vertere|6ò,volere|2rrò",
        "rev": "braderò|6e,loscerò|4iare,ndrò|2are,rrogerò|6e,edicerò|6e,ercerò|3iare,lliderò|6e,ompirò|4ere,rroderò|6e,inquerò|6e,eriderò|6e,irimerò|6e,ffigerò|4iare,logerò|3iare,tollerò|6e,mbeverò|6e,olcerò|5e,tunderò|6e,otrò|2ere,edimerò|6e,iarderò|6e,iceverò|6e,idurrò|3cere,vescerò|4iare,bircerò|4iare,caderò|5e,roscerò|4iare,aligerò|4iare,engerò|3iare,concerò|4iare,ssumerò|6e,ucerò|2iare,bacerò|3iare,peterò|5e,ponderò|6e,fungerò|6e,perderò|6e,suaderò|6e,ruggerò|6e,ividerò|6e,panderò|6e,comberò|6e,ugerò|2iare,triderò|6e,arcerò|3iare,cciderò|6e,marrò|2nere,cinderò|6e,crederò|6e,mangerò|4iare,morderò|6e,saprò|3ere,lenderò|6e,fotterò|6e,uscerò|3iare,parrò|3ere,premerò|6e,corcerò|4iare,rriderò|6e,iederò|5e,nciderò|6e,pungerò|6e,agerò|2iare,eciderò|6e,fenderò|6e,cuterò|5e,ruderò|5e,vaderò|5e,iscerò|3iare,nascerò|6e,venderò|6e,nuncerò|4iare,drò|1ere,mincerò|4iare,varrò|2lere,ocerò|2iare,lcerò|2iare,noscerò|6e,cernerò|6e,batterò|6e,escerò|5e,vrò|1ere,vincerò|6e,icerò|2iare,hiuderò|6e,egerò|2iare,ascerò|3iare,angerò|5e,penderò|6e,torcerò|6e,acerò|4e,primerò|6e,romperò|6e,ancerò|3iare,sisterò|6e,olverò|5e,igerò|4e,iungerò|6e,renderò|6e,iggerò|5e,criverò|6e,luderò|5e,cederò|5e,correrò|6e,terrò|2nere,verrò|2nire,lgerò|4e,tenderò|6e,arò|2e,ingerò|5e,metterò|6e,rgerò|4e,ccerò|2iare,rrò|2e,ggerò|2iare,herò|are,irò|2e,erò|are"
      },
      "second": {
        "rules": "ompiere|4rai,ecadere|4rai,overe|2rai,lencare|4herai,otere|2rai,icadere|4rai,esciare|3erai,tostare|6ai,trafare|6ai,rincare|4herai,osciare|3erai,ingare|3herai,uciare|2erai,baciare|3erai,ulgare|3herai,olere|1rrai,ducere|2rrai,manere|2rrai,sapere|3rai,usciare|3erai,parere|3rai,sfare|4ai,isciare|3erai,vivere|3rai,valere|2rrai,angare|3herai,rgare|2herai,ociare|2erai,efare|4ai,lciare|2erai,iciare|2erai,asciare|3erai,rciare|2erai,ugare|2herai,ucare|2herai,acare|2herai,ecare|2herai,ancare|3herai,lcare|2herai,rcare|2herai,scare|2herai,tenere|2rrai,igare|2herai,venire|2rrai,agare|2herai,ocare|2herai,ogare|2herai,nciare|2erai,egare|2herai,cciare|2erai,ccare|2herai,rre|2ai,icare|2herai,giare|1erai,ire|2ai,ere|2ai,are|erai",
        "exceptions": "accadere|&#8212;,andare|3rai,avere|2rai,cadere|3rai,contraffare|10ai,dare|3ai,fare|3ai,godere|3rai,prolungare|7herai,ridare|5ai,riducere|driurrai,rifare|5ai,ristare|6ai,sopraffare|9ai,stare|4ai,stroncare|6herai,teletrasmettere|8etterai,troncare|5herai,abbattere|8ai,abradere|7ai,accendere|8ai,accogliere|9ai,acconciare|6erai,accondiscendere|14ai,accorciare|6erai,accorrere|8ai,afflosciare|7erai,aggiungere|9ai,ammettere|8ai,annettere|8ai,appendere|8ai,apprendere|9ai,ardere|5ai,arridere|7ai,ascendere|8ai,ascondere|8ai,ascrivere|8ai,assidere|7ai,assistere|8ai,assumere|7ai,attendere|8ai,battere|6ai,benedicere|9ai,bigiare|3erai,cangiare|4erai,cernere|6ai,cherere|6ai,chierere|7ai,circoncidere|11ai,circoscrivere|12ai,cogliere|7ai,coincidere|9ai,collidere|8ai,combattere|9ai,cominciare|6erai,commettere|9ai,comprendere|10ai,comprimere|9ai,compromettere|12ai,compungere|9ai,concernere|9ai,conciare|4erai,concorrere|9ai,confondere|9ai,congiungere|10ai,connettere|9ai,consistere|9ai,contendere|9ai,contraddistinguere|17ai,controbattere|12ai,correggere|9ai,correre|6ai,corrispondere|12ai,corrodere|8ai,credere|6ai,decidere|7ai,decorrere|8ai,defungere|8ai,deprimere|8ai,deridere|7ai,descrivere|9ai,desistere|8ai,desumere|7ai,difendere|8ai,diffondere|9ai,dimettere|8ai,dipendere|8ai,dirimere|7ai,disattendere|11ai,discendere|9ai,discernere|9ai,disciogliere|11ai,disconnettere|12ai,discorrere|9ai,disgiungere|10ai,dismettere|9ai,dissuadere|9ai,distendere|9ai,distinguere|10ai,distogliere|10ai,divellere|8ai,dolere|2rrai,ducere|2rrai,eccellere|8ai,educere|3rrai,effondere|8ai,eleggere|7ai,elidere|6ai,emettere|7ai,erodere|6ai,esistere|7ai,espandere|8ai,espellere|8ai,esprimere|8ai,espungere|8ai,estendere|8ai,estinguere|9ai,estollere|8ai,fendere|6ai,fervere|6ai,flettere|7ai,forgiare|4erai,fottere|6ai,fraintendere|11ai,fremere|6ai,fungere|6ai,gemere|5ai,giungere|7ai,immettere|8ai,imprendere|9ai,imprimere|8ai,incendere|8ai,incidere|7ai,incombere|8ai,incominciare|8erai,incorrere|8ai,infondere|8ai,ingiungere|9ai,inscrivere|9ai,insistere|8ai,intendere|8ai,intercorrere|11ai,intraprendere|12ai,intridere|8ai,intromettere|11ai,irridere|7ai,iscrivere|8ai,ledere|5ai,leggere|6ai,licere|5ai,linciare|4erai,mangiare|4erai,manomettere|10ai,mettere|6ai,mietere|6ai,mordere|6ai,mungere|6ai,nascere|6ai,nascondere|9ai,occidere|7ai,occorrere|8ai,offendere|8ai,omettere|7ai,opprimere|8ai,pascere|6ai,pendere|6ai,percorrere|9ai,permettere|9ai,persistere|9ai,persuadere|9ai,pigiare|3erai,portendere|9ai,precidere|8ai,precorrere|9ai,premere|6ai,premettere|9ai,prenascere|9ai,prendere|7ai,prescegliere|11ai,prescrivere|10ai,presumere|8ai,pretendere|9ai,profondere|9ai,promettere|9ai,propellere|9ai,propendere|9ai,proteggere|9ai,protendere|9ai,pungere|6ai,raccogliere|10ai,raccorciare|7erai,radere|5ai,raggiungere|10ai,rapprendere|10ai,recidere|7ai,redimere|7ai,reggere|6ai,rendere|6ai,repellere|8ai,reprimere|8ai,rescindere|9ai,resistere|8ai,riaccendere|10ai,riappendere|10ai,riardere|7ai,riassumere|9ai,ribattere|8ai,ricogliere|9ai,ricominciare|8erai,ricongiungere|12ai,ricorrere|8ai,ricredere|8ai,ridere|5ai,rieleggere|9ai,riflettere|9ai,rileggere|8ai,rimangiare|6erai,rimettere|8ai,rimordere|8ai,rinascere|8ai,rincominciare|9erai,riprendere|9ai,riscrivere|9ai,risplendere|10ai,rispondere|9ai,ritrasmettere|12ai,rivendere|8ai,rovesciare|6erai,sbattere|7ai,scegliere|8ai,scendere|7ai,scernere|7ai,scindere|7ai,sciogliere|9ai,scommettere|10ai,sconnettere|10ai,scorciare|5erai,scorrere|7ai,scoscendere|10ai,scrivere|7ai,scrosciare|6erai,secernere|8ai,sfottere|7ai,smettere|7ai,soccombere|9ai,soccorrere|9ai,soggiungere|10ai,sommettere|9ai,sopprimere|9ai,sopraggiungere|13ai,soprintendere|12ai,sorprendere|10ai,sorreggere|9ai,sorridere|8ai,sospendere|9ai,sottendere|9ai,sottintendere|12ai,sottomettere|11ai,sottoscrivere|12ai,sovrintendere|12ai,spandere|7ai,spegnere|7ai,spendere|7ai,splendere|8ai,spremere|7ai,stendere|7ai,stridere|7ai,sumere|5ai,sussistere|9ai,svaligiare|6erai,svellere|7ai,svendere|7ai,temere|5ai,tendere|6ai,tessere|6ai,togliere|7ai,tramettere|9ai,trascendere|10ai,trascorrere|10ai,trascrivere|10ai,trasfondere|10ai,trasmettere|10ai,uccidere|7ai,ungere|5ai,vendere|6ai,vertere|6ai,volere|2rrai",
        "rev": "ndrai|2are,rogerai|5e,ercerai|3iare,ompirai|4ere,nquerai|5e,figerai|3iare,logerai|3iare,beverai|5e,olcerai|5e,underai|5e,otrai|2ere,ceverai|5e,ircerai|3iare,caderai|5e,engerai|3iare,ucerai|2iare,bacerai|3iare,peterai|5e,erderai|5e,uggerai|5e,viderai|5e,ugerai|2iare,arcerai|3iare,marrai|2nere,saprai|3ere,uscerai|3iare,parrai|3ere,iederai|5e,agerai|2iare,cuterai|5e,ruderai|5e,vaderai|5e,iscerai|3iare,uncerai|3iare,drai|1ere,varrai|2lere,ocerai|2iare,lcerai|2iare,oscerai|5e,escerai|5e,vrai|1ere,incerai|5e,icerai|2iare,iuderai|5e,egerai|2iare,ascerai|3iare,angerai|5e,orcerai|5e,acerai|4e,omperai|5e,ancerai|3iare,olverai|5e,igerai|4e,iggerai|5e,luderai|5e,cederai|5e,terrai|2nere,verrai|2nire,lgerai|4e,arai|2e,ingerai|5e,rgerai|4e,ccerai|2iare,rrai|2e,ggerai|2iare,herai|are,irai|2e,erai|are"
      },
      "third": {
        "rules": "ompiere|4rà,ecadere|4rà,lencare|4herà,otere|2rà,icadere|4rà,esciare|3erà,tostare|6à,trafare|6à,rincare|4herà,ccadere|4rà,osciare|3erà,ingare|3herà,uciare|2erà,baciare|3erà,ulgare|3herà,olere|1rrà,manere|2rrà,sapere|3rà,usciare|3erà,parere|3rà,sfare|4à,ducere|2rrà,isciare|3erà,vivere|3rà,valere|2rrà,angare|3herà,rgare|2herà,ociare|2erà,efare|4à,lciare|2erà,iciare|2erà,asciare|3erà,rciare|2erà,ugare|2herà,ucare|2herà,acare|2herà,ecare|2herà,ancare|3herà,lcare|2herà,rcare|2herà,scare|2herà,tenere|2rrà,igare|2herà,venire|2rrà,agare|2herà,ocare|2herà,ogare|2herà,nciare|2erà,egare|2herà,cciare|2erà,ccare|2herà,rre|2à,icare|2herà,giare|1erà,ire|2à,ere|2à,are|erà",
        "exceptions": "andare|3rà,avere|2rà,cadere|3rà,consumere|&#8212;,contraffare|10à,dare|3à,dovere|3rà,fare|3à,godere|3rà,prolungare|7herà,ridare|5à,rifare|5à,ristare|6à,sopraffare|9à,stare|4à,stroncare|6herà,teletrasmettere|8etterà,troncare|5herà,accendere|8à,accogliere|9à,accondiscendere|14à,annettere|8à,ardere|5à,ascendere|8à,ascondere|8à,assidere|7à,bigiare|3erà,cangiare|4erà,cherere|6à,chierere|7à,cogliere|7à,confondere|9à,connettere|9à,contraddistinguere|17à,correggere|9à,desumere|7à,diffondere|9à,discendere|9à,disciogliere|11à,disconnettere|12à,distinguere|10à,distogliere|10à,divellere|8à,dolere|2rrà,ducere|2rrà,eccellere|8à,educere|3rrà,effondere|8à,eleggere|7à,elidere|6à,erodere|6à,espellere|8à,estinguere|9à,fervere|6à,flettere|7à,forgiare|4erà,fremere|6à,gemere|5à,incendere|8à,infondere|8à,ledere|5à,leggere|6à,licere|5à,linciare|4erà,mietere|6à,mungere|6à,nascondere|9à,pascere|6à,pigiare|3erà,prescegliere|11à,presumere|8à,profondere|9à,propellere|9à,proteggere|9à,raccogliere|10à,radere|5à,reggere|6à,repellere|8à,riaccendere|10à,ricogliere|9à,ridere|5à,rieleggere|9à,riflettere|9à,rileggere|8à,scegliere|8à,scendere|7à,sciogliere|9à,sconnettere|10à,scoscendere|10à,sorreggere|9à,spegnere|7à,sumere|5à,svellere|7à,temere|5à,tessere|6à,togliere|7à,trascendere|10à,trasfondere|10à,ungere|5à,vertere|6à,volere|2rrà",
        "rev": "braderà|6e,loscerà|4iare,ndrà|2are,rrogerà|6e,edicerà|6e,ercerà|3iare,lliderà|6e,ompirà|4ere,rroderà|6e,inquerà|6e,eriderà|6e,irimerà|6e,ffigerà|4iare,logerà|3iare,tollerà|6e,mbeverà|6e,olcerà|5e,tunderà|6e,otrà|2ere,edimerà|6e,iarderà|6e,iceverà|6e,idurrà|3cere,vescerà|4iare,bircerà|4iare,caderà|5e,roscerà|4iare,aligerà|4iare,engerà|3iare,concerà|4iare,ssumerà|6e,ucerà|2iare,bacerà|3iare,peterà|5e,ponderà|6e,fungerà|6e,perderà|6e,suaderà|6e,ruggerà|6e,ividerà|6e,panderà|6e,comberà|6e,ugerà|2iare,triderà|6e,arcerà|3iare,cciderà|6e,marrà|2nere,cinderà|6e,crederà|6e,mangerà|4iare,morderà|6e,saprà|3ere,lenderà|6e,fotterà|6e,uscerà|3iare,parrà|3ere,premerà|6e,corcerà|4iare,rriderà|6e,iederà|5e,nciderà|6e,pungerà|6e,agerà|2iare,eciderà|6e,fenderà|6e,cuterà|5e,ruderà|5e,vaderà|5e,iscerà|3iare,nascerà|6e,pioverà|6e,venderà|6e,nuncerà|4iare,mincerà|4iare,varrà|2lere,ocerà|2iare,lcerà|2iare,noscerà|6e,cernerà|6e,batterà|6e,drà|1ere,escerà|5e,vrà|1ere,vincerà|6e,icerà|2iare,hiuderà|6e,egerà|2iare,ascerà|3iare,angerà|5e,penderà|6e,torcerà|6e,acerà|4e,primerà|6e,romperà|6e,ancerà|3iare,sisterà|6e,olverà|5e,igerà|4e,iungerà|6e,renderà|6e,iggerà|5e,criverà|6e,luderà|5e,cederà|5e,correrà|6e,terrà|2nere,verrà|2nire,lgerà|4e,tenderà|6e,arà|2e,ingerà|5e,metterà|6e,rgerà|4e,ccerà|2iare,rrà|2e,ggerà|2iare,herà|are,irà|2e,erà|are"
      },
      "firstPlural": {
        "rules": "ompiere|4remo,ecadere|4remo,overe|2remo,lencare|4heremo,otere|2remo,icadere|4remo,esciare|3eremo,tostare|7mo,trafare|7mo,rincare|4heremo,osciare|3eremo,ingare|3heremo,uciare|2eremo,baciare|3eremo,ulgare|3heremo,olere|1rremo,manere|2rremo,sapere|3remo,usciare|3eremo,parere|3remo,sfare|5mo,ducere|2rremo,isciare|3eremo,vivere|3remo,valere|2rremo,angare|3heremo,rgare|2heremo,ociare|2eremo,efare|5mo,lciare|2eremo,iciare|2eremo,asciare|3eremo,rciare|2eremo,ugare|2heremo,ucare|2heremo,acare|2heremo,ecare|2heremo,ancare|3heremo,lcare|2heremo,rcare|2heremo,scare|2heremo,tenere|2rremo,igare|2heremo,venire|2rremo,agare|2heremo,ocare|2heremo,ogare|2heremo,nciare|2eremo,egare|2heremo,cciare|2eremo,ccare|2heremo,rre|3mo,icare|2heremo,giare|1eremo,ire|3mo,ere|3mo,are|eremo",
        "exceptions": "accadere|&#8212;,andare|3remo,avere|2remo,cadere|3remo,contraffare|11mo,dare|4mo,fare|4mo,gire|3émo,godere|3remo,ire|2émo,prolungare|7heremo,ridare|6mo,rifare|6mo,ristare|7mo,sopraffare|10mo,stare|5mo,stroncare|6heremo,teletrasmettere|8etteremo,troncare|5heremo,abbattere|9mo,abradere|8mo,accasciare|6eremo,accedere|8mo,accendere|9mo,accogliere|10mo,acconciare|6eremo,accondiscendere|15mo,accorciare|6eremo,accorrere|9mo,accrescere|10mo,affliggere|10mo,afflosciare|7eremo,affrangere|10mo,agganciare|6eremo,aggiungere|10mo,alludere|8mo,ambasciare|6eremo,ammettere|9mo,annettere|9mo,annunciare|6eremo,antecedere|10mo,appendere|9mo,apprendere|10mo,ardere|6mo,arridere|8mo,arrogere|8mo,ascendere|9mo,ascondere|9mo,ascrivere|9mo,assidere|8mo,assistere|9mo,assolvere|9mo,assumere|8mo,astringere|10mo,attendere|9mo,attingere|9mo,attorcere|9mo,avvincere|9mo,baciare|3eremo,battere|7mo,benedicere|10mo,berciare|4eremo,bigiare|3eremo,bilanciare|6eremo,cangiare|4eremo,cedere|6mo,cernere|7mo,cherere|7mo,chiedere|8mo,chierere|8mo,chiudere|8mo,cingere|7mo,circoncidere|12mo,circoscrivere|13mo,clangere|8mo,cogliere|8mo,cognoscere|10mo,coincidere|10mo,collidere|9mo,colludere|9mo,combaciare|6eremo,combattere|10mo,cominciare|6eremo,commettere|10mo,competere|9mo,compiangere|11mo,compiere|5remo,comprendere|11mo,comprimere|10mo,compromettere|13mo,compungere|10mo,concedere|9mo,concernere|10mo,conciare|4eremo,concludere|10mo,concorrere|10mo,confondere|10mo,congiungere|11mo,connettere|10mo,conoscere|9mo,consistere|10mo,contendere|10mo,contorcere|10mo,contraddistinguere|18mo,controbattere|13mo,convincere|10mo,correggere|10mo,correre|7mo,corrispondere|13mo,corrodere|9mo,corrompere|10mo,costringere|11mo,credere|7mo,crescere|8mo,crocifiggere|12mo,decedere|8mo,decidere|8mo,decorrere|9mo,decrescere|10mo,defungere|9mo,delinquere|10mo,deludere|8mo,deprimere|9mo,deridere|8mo,descrivere|10mo,desistere|9mo,desumere|8mo,devolvere|9mo,difendere|9mo,diffondere|10mo,dimettere|9mo,dipendere|9mo,dipingere|9mo,dirimere|8mo,dirompere|9mo,disattendere|12mo,discendere|10mo,discernere|10mo,dischiudere|11mo,disciogliere|12mo,disconnettere|13mo,disconoscere|12mo,discorrere|10mo,discutere|9mo,disgiungere|11mo,dismettere|10mo,disperdere|10mo,dissolvere|10mo,dissuadere|10mo,distendere|10mo,distinguere|11mo,distogliere|11mo,distorcere|10mo,distruggere|11mo,divellere|9mo,dividere|8mo,dolere|2rremo,ducere|2rremo,eccedere|8mo,eccellere|9mo,educere|3rremo,effigiare|5eremo,effondere|9mo,eleggere|8mo,elidere|7mo,elogiare|4eremo,eludere|7mo,emettere|8mo,enunciare|5eremo,erodere|7mo,erompere|8mo,escludere|9mo,escutere|8mo,esistere|8mo,espandere|9mo,espellere|9mo,esprimere|9mo,espungere|9mo,estendere|9mo,estinguere|10mo,estollere|9mo,estorcere|9mo,estrudere|9mo,evadere|7mo,evincere|8mo,evolvere|8mo,fasciare|4eremo,fendere|7mo,fervere|7mo,figgere|7mo,fingere|7mo,flettere|8mo,forgiare|4eremo,fottere|7mo,fraintendere|12mo,frangere|8mo,fremere|7mo,friggere|8mo,fungere|7mo,gemere|6mo,giungere|8mo,illudere|8mo,imbevere|8mo,immettere|9mo,imprendere|10mo,imprimere|9mo,incedere|8mo,incendere|9mo,incidere|8mo,incingere|9mo,includere|9mo,incombere|9mo,incominciare|8eremo,incorrere|9mo,incutere|8mo,infiggere|9mo,infliggere|10mo,infondere|9mo,infrangere|10mo,ingiungere|10mo,inscrivere|10mo,insistere|9mo,intendere|9mo,intercedere|11mo,intercorrere|12mo,interrompere|12mo,intingere|9mo,intraprendere|13mo,intridere|9mo,intromettere|12mo,intrudere|9mo,invadere|8mo,irridere|8mo,irrompere|9mo,iscrivere|9mo,lanciare|4eremo,lasciare|4eremo,ledere|6mo,leggere|7mo,licere|6mo,linciare|4eremo,lisciare|4eremo,mangiare|4eremo,manomettere|11mo,marciare|4eremo,mescere|7mo,mettere|7mo,mietere|7mo,mingere|7mo,molcere|7mo,mordere|7mo,mungere|7mo,nascere|7mo,nascondere|10mo,occidere|8mo,occludere|9mo,occorrere|9mo,offendere|9mo,omettere|8mo,opprimere|9mo,ottundere|9mo,pascere|7mo,pendere|7mo,percorrere|10mo,perdere|7mo,permettere|10mo,persistere|10mo,persuadere|10mo,pervadere|9mo,piangere|8mo,pigiare|3eremo,pisciare|4eremo,portendere|10mo,precedere|9mo,precidere|9mo,precludere|10mo,precorrere|10mo,prefiggere|10mo,premere|7mo,premettere|10mo,prenascere|10mo,prendere|8mo,prescegliere|12mo,prescrivere|11mo,presumere|9mo,pretendere|10mo,procedere|9mo,profondere|10mo,promettere|10mo,pronunciare|7eremo,propellere|10mo,propendere|10mo,prorompere|10mo,proteggere|10mo,protendere|10mo,prudere|7mo,pungere|7mo,racchiudere|11mo,raccogliere|11mo,raccorciare|7eremo,radere|6mo,raggiungere|11mo,rapprendere|11mo,recedere|8mo,recidere|8mo,recingere|9mo,recludere|9mo,redimere|8mo,reggere|7mo,rendere|7mo,repellere|9mo,reprimere|9mo,rescindere|10mo,resistere|9mo,respingere|10mo,restringere|11mo,retrocedere|11mo,riaccendere|11mo,riagganciare|8eremo,riappendere|11mo,riardere|8mo,riassumere|10mo,ribattere|9mo,ricedere|8mo,ricevere|8mo,richiedere|10mo,ricogliere|10mo,ricominciare|8eremo,ricongiungere|13mo,riconoscere|11mo,ricorrere|9mo,ricredere|9mo,ricrescere|10mo,ridere|6mo,ridipingere|11mo,riducere|4rremo,rieleggere|10mo,riflettere|10mo,rilanciare|6eremo,rilasciare|6eremo,rileggere|9mo,rimangiare|6eremo,rimettere|9mo,rimordere|9mo,rinascere|9mo,rinchiudere|11mo,rincominciare|9eremo,rincrescere|11mo,rinunciare|6eremo,ripetere|8mo,riprendere|10mo,riscrivere|10mo,risiedere|9mo,risolvere|9mo,rispingere|10mo,risplendere|11mo,rispondere|10mo,ristringere|11mo,ritorcere|9mo,ritrasmettere|13mo,rivendere|9mo,rivincere|9mo,rivolvere|9mo,rompere|7mo,rovesciare|6eremo,sbattere|8mo,sbilanciare|7eremo,sbirciare|5eremo,scadere|7mo,scegliere|9mo,scendere|8mo,scernere|8mo,schiudere|9mo,scindere|8mo,sciogliere|10mo,scommettere|11mo,sconfiggere|11mo,sconnettere|11mo,sconoscere|10mo,scorciare|5eremo,scorrere|8mo,scoscendere|11mo,scrivere|8mo,scrosciare|6eremo,secernere|9mo,sfasciare|5eremo,sfottere|8mo,sganciare|5eremo,sgusciare|5eremo,slanciare|5eremo,smettere|8mo,socchiudere|11mo,soccombere|10mo,soccorrere|10mo,soffriggere|11mo,soggiungere|11mo,solvere|7mo,sommettere|10mo,sopprimere|10mo,sopraggiungere|14mo,soprintendere|13mo,sorprendere|11mo,sorreggere|10mo,sorridere|9mo,sospendere|10mo,sospingere|10mo,sottendere|10mo,sottintendere|13mo,sottomettere|12mo,sottoscrivere|13mo,sovrintendere|13mo,spandere|8mo,spegnere|8mo,spendere|8mo,spingere|8mo,splendere|9mo,spremere|8mo,squarciare|6eremo,stendere|8mo,stingere|8mo,storcere|8mo,stravincere|11mo,stridere|8mo,stringere|9mo,strisciare|6eremo,struggere|9mo,strusciare|6eremo,succedere|9mo,suddividere|11mo,sumere|6mo,sussistere|10mo,svaligiare|6eremo,svellere|8mo,svendere|8mo,tangere|7mo,temere|6mo,tendere|7mo,tessere|7mo,tingere|7mo,togliere|8mo,torcere|7mo,trafiggere|10mo,tralasciare|7eremo,tramettere|10mo,trascendere|11mo,trascorrere|11mo,trascrivere|11mo,trasfondere|11mo,trasmettere|11mo,uccidere|8mo,ungere|6mo,vendere|7mo,vengiare|4eremo,vertere|7mo,vincere|7mo,volere|2rremo,volvere|7mo",
        "rev": "ndremo|2are,otremo|2ere,uceremo|2iare,irémo|2e,ugeremo|2iare,marremo|2nere,sapremo|3ere,parremo|3ere,ageremo|2iare,dremo|1ere,varremo|2lere,oceremo|2iare,lceremo|2iare,vremo|1ere,iceremo|2iare,egeremo|2iare,aceremo|5,igeremo|5,terremo|2nere,verremo|2nire,lgeremo|5,aremo|3,rgeremo|5,cceremo|2iare,rremo|3,ggeremo|2iare,heremo|are,iremo|3,eremo|are"
      },
      "secondPlural": {
        "rules": "ompiere|4rete,ecadere|4rete,overe|2rete,lencare|4herete,otere|2rete,icadere|4rete,esciare|3erete,tostare|7te,trafare|7te,rincare|4herete,osciare|3erete,ingare|3herete,uciare|2erete,baciare|3erete,ulgare|3herete,olere|1rrete,manere|2rrete,sapere|3rete,usciare|3erete,parere|3rete,sfare|5te,ducere|2rrete,isciare|3erete,vivere|3rete,valere|2rrete,angare|3herete,rgare|2herete,ociare|2erete,efare|5te,lciare|2erete,iciare|2erete,asciare|3erete,rciare|2erete,ugare|2herete,ucare|2herete,acare|2herete,ecare|2herete,ancare|3herete,lcare|2herete,rcare|2herete,scare|2herete,tenere|2rrete,igare|2herete,venire|2rrete,agare|2herete,ocare|2herete,ogare|2herete,nciare|2erete,egare|2herete,cciare|2erete,ccare|2herete,rre|3te,icare|2herete,giare|1erete,ire|3te,ere|3te,are|erete",
        "exceptions": "accadere|&#8212;,andare|3rete,avere|2rete,cadere|3rete,contraffare|11te,dare|4te,fare|4te,gire|3éte,godere|3rete,ire|2éte,prolungare|7herete,ridare|6te,rifare|6te,ristare|7te,sopraffare|10te,stare|5te,stroncare|6herete,teletrasmettere|8etterete,troncare|5herete,abbattere|9te,abradere|8te,accasciare|6erete,accedere|8te,accendere|9te,accogliere|10te,acconciare|6erete,accondiscendere|15te,accorciare|6erete,accorrere|9te,accrescere|10te,affliggere|10te,afflosciare|7erete,affrangere|10te,agganciare|6erete,aggiungere|10te,alludere|8te,ambasciare|6erete,ammettere|9te,annettere|9te,annunciare|6erete,antecedere|10te,appendere|9te,apprendere|10te,ardere|6te,arridere|8te,arrogere|8te,ascendere|9te,ascondere|9te,ascrivere|9te,assidere|8te,assistere|9te,assolvere|9te,assumere|8te,astringere|10te,attendere|9te,attingere|9te,attorcere|9te,avvincere|9te,baciare|3erete,battere|7te,benedicere|10te,berciare|4erete,bigiare|3erete,bilanciare|6erete,cangiare|4erete,cedere|6te,cernere|7te,cherere|7te,chiedere|8te,chierere|8te,chiudere|8te,cingere|7te,circoncidere|12te,circoscrivere|13te,clangere|8te,cogliere|8te,cognoscere|10te,coincidere|10te,collidere|9te,colludere|9te,combaciare|6erete,combattere|10te,cominciare|6erete,commettere|10te,competere|9te,compiangere|11te,compiere|5rete,comprendere|11te,comprimere|10te,compromettere|13te,compungere|10te,concedere|9te,concernere|10te,conciare|4erete,concludere|10te,concorrere|10te,confondere|10te,congiungere|11te,connettere|10te,conoscere|9te,consistere|10te,contendere|10te,contorcere|10te,contraddistinguere|18te,controbattere|13te,convincere|10te,correggere|10te,correre|7te,corrispondere|13te,corrodere|9te,corrompere|10te,costringere|11te,credere|7te,crescere|8te,crocifiggere|12te,decedere|8te,decidere|8te,decorrere|9te,decrescere|10te,defungere|9te,delinquere|10te,deludere|8te,deprimere|9te,deridere|8te,descrivere|10te,desistere|9te,desumere|8te,devolvere|9te,difendere|9te,diffondere|10te,dimettere|9te,dipendere|9te,dipingere|9te,dirimere|8te,dirompere|9te,disattendere|12te,discendere|10te,discernere|10te,dischiudere|11te,disciogliere|12te,disconnettere|13te,disconoscere|12te,discorrere|10te,discutere|9te,disgiungere|11te,dismettere|10te,disperdere|10te,dissolvere|10te,dissuadere|10te,distendere|10te,distinguere|11te,distogliere|11te,distorcere|10te,distruggere|11te,divellere|9te,dividere|8te,dolere|2rrete,ducere|2rrete,eccedere|8te,eccellere|9te,educere|3rrete,effigiare|5erete,effondere|9te,eleggere|8te,elidere|7te,elogiare|4erete,eludere|7te,emettere|8te,enunciare|5erete,erodere|7te,erompere|8te,escludere|9te,escutere|8te,esistere|8te,espandere|9te,espellere|9te,esprimere|9te,espungere|9te,estendere|9te,estinguere|10te,estollere|9te,estorcere|9te,estrudere|9te,evadere|7te,evincere|8te,evolvere|8te,fasciare|4erete,fendere|7te,fervere|7te,figgere|7te,fingere|7te,flettere|8te,forgiare|4erete,fottere|7te,fraintendere|12te,frangere|8te,fremere|7te,friggere|8te,fungere|7te,gemere|6te,giungere|8te,illudere|8te,imbevere|8te,immettere|9te,imprendere|10te,imprimere|9te,incedere|8te,incendere|9te,incidere|8te,incingere|9te,includere|9te,incombere|9te,incominciare|8erete,incorrere|9te,incutere|8te,infiggere|9te,infliggere|10te,infondere|9te,infrangere|10te,ingiungere|10te,inscrivere|10te,insistere|9te,intendere|9te,intercedere|11te,intercorrere|12te,interrompere|12te,intingere|9te,intraprendere|13te,intridere|9te,intromettere|12te,intrudere|9te,invadere|8te,irridere|8te,irrompere|9te,iscrivere|9te,lanciare|4erete,lasciare|4erete,ledere|6te,leggere|7te,licere|6te,linciare|4erete,lisciare|4erete,mangiare|4erete,manomettere|11te,marciare|4erete,mescere|7te,mettere|7te,mietere|7te,mingere|7te,molcere|7te,mordere|7te,mungere|7te,nascere|7te,nascondere|10te,occidere|8te,occludere|9te,occorrere|9te,offendere|9te,omettere|8te,opprimere|9te,ottundere|9te,pascere|7te,pendere|7te,percorrere|10te,perdere|7te,permettere|10te,persistere|10te,persuadere|10te,pervadere|9te,piangere|8te,pigiare|3erete,pisciare|4erete,portendere|10te,precedere|9te,precidere|9te,precludere|10te,precorrere|10te,prefiggere|10te,premere|7te,premettere|10te,prenascere|10te,prendere|8te,prescegliere|12te,prescrivere|11te,presumere|9te,pretendere|10te,procedere|9te,profondere|10te,promettere|10te,pronunciare|7erete,propellere|10te,propendere|10te,prorompere|10te,proteggere|10te,protendere|10te,prudere|7te,pungere|7te,racchiudere|11te,raccogliere|11te,raccorciare|7erete,radere|6te,raggiungere|11te,rapprendere|11te,recedere|8te,recidere|8te,recingere|9te,recludere|9te,redimere|8te,reggere|7te,rendere|7te,repellere|9te,reprimere|9te,rescindere|10te,resistere|9te,respingere|10te,restringere|11te,retrocedere|11te,riaccendere|11te,riagganciare|8erete,riappendere|11te,riardere|8te,riassumere|10te,ribattere|9te,ricedere|8te,ricevere|8te,richiedere|10te,ricogliere|10te,ricominciare|8erete,ricongiungere|13te,riconoscere|11te,ricorrere|9te,ricredere|9te,ricrescere|10te,ridere|6te,ridipingere|11te,riducere|4rrete,rieleggere|10te,riflettere|10te,rilanciare|6erete,rilasciare|6erete,rileggere|9te,rimangiare|6erete,rimettere|9te,rimordere|9te,rinascere|9te,rinchiudere|11te,rincominciare|9erete,rincrescere|11te,rinunciare|6erete,ripetere|8te,riprendere|10te,riscrivere|10te,risiedere|9te,risolvere|9te,rispingere|10te,risplendere|11te,rispondere|10te,ristringere|11te,ritorcere|9te,ritrasmettere|13te,rivendere|9te,rivincere|9te,rivolvere|9te,rompere|7te,rovesciare|6erete,sbattere|8te,sbilanciare|7erete,sbirciare|5erete,scadere|7te,scegliere|9te,scendere|8te,scernere|8te,schiudere|9te,scindere|8te,sciogliere|10te,scommettere|11te,sconfiggere|11te,sconnettere|11te,sconoscere|10te,scorciare|5erete,scorrere|8te,scoscendere|11te,scrivere|8te,scrosciare|6erete,secernere|9te,sfasciare|5erete,sfottere|8te,sganciare|5erete,sgusciare|5erete,slanciare|5erete,smettere|8te,socchiudere|11te,soccombere|10te,soccorrere|10te,soffriggere|11te,soggiungere|11te,solvere|7te,sommettere|10te,sopprimere|10te,sopraggiungere|14te,soprintendere|13te,sorprendere|11te,sorreggere|10te,sorridere|9te,sospendere|10te,sospingere|10te,sottendere|10te,sottintendere|13te,sottomettere|12te,sottoscrivere|13te,sovrintendere|13te,spandere|8te,spegnere|8te,spendere|8te,spingere|8te,splendere|9te,spremere|8te,squarciare|6erete,stendere|8te,stingere|8te,storcere|8te,stravincere|11te,stridere|8te,stringere|9te,strisciare|6erete,struggere|9te,strusciare|6erete,succedere|9te,suddividere|11te,sumere|6te,sussistere|10te,svaligiare|6erete,svellere|8te,svendere|8te,tangere|7te,temere|6te,tendere|7te,tessere|7te,tingere|7te,togliere|8te,torcere|7te,trafiggere|10te,tralasciare|7erete,tramettere|10te,trascendere|11te,trascorrere|11te,trascrivere|11te,trasfondere|11te,trasmettere|11te,uccidere|8te,ungere|6te,vendere|7te,vengiare|4erete,vertere|7te,vincere|7te,volere|2rrete,volvere|7te",
        "rev": "ndrete|2are,otrete|2ere,ucerete|2iare,iréte|2e,ugerete|2iare,marrete|2nere,saprete|3ere,parrete|3ere,agerete|2iare,drete|1ere,varrete|2lere,ocerete|2iare,lcerete|2iare,vrete|1ere,icerete|2iare,egerete|2iare,acerete|5,igerete|5,terrete|2nere,verrete|2nire,lgerete|5,arete|3,rgerete|5,ccerete|2iare,rrete|3,ggerete|2iare,herete|are,irete|3,erete|are"
      },
      "thirdPlural": {
        "rules": "ompiere|4ranno,ecadere|4ranno,lencare|4heranno,otere|2ranno,icadere|4ranno,esciare|3eranno,tostare|6anno,trafare|6anno,rincare|4heranno,ccadere|4ranno,osciare|3eranno,ingare|3heranno,uciare|2eranno,baciare|3eranno,ulgare|3heranno,olere|1rranno,manere|2rranno,sapere|3ranno,usciare|3eranno,parere|3ranno,sfare|4anno,ducere|2rranno,isciare|3eranno,vivere|3ranno,valere|2rranno,angare|3heranno,rgare|2heranno,ociare|2eranno,efare|4anno,lciare|2eranno,iciare|2eranno,asciare|3eranno,rciare|2eranno,ugare|2heranno,ucare|2heranno,acare|2heranno,ecare|2heranno,ancare|3heranno,lcare|2heranno,rcare|2heranno,scare|2heranno,tenere|2rranno,igare|2heranno,venire|2rranno,agare|2heranno,ocare|2heranno,ogare|2heranno,nciare|2eranno,egare|2heranno,cciare|2eranno,ccare|2heranno,rre|2anno,icare|2heranno,giare|1eranno,ire|2anno,ere|2anno,are|eranno",
        "exceptions": "andare|3ranno,avere|2ranno,bisognare|&#8212;,cadere|3ranno,contraffare|10anno,dare|3anno,dovere|3ranno,fare|3anno,gire|3ànno,godere|3ranno,prolungare|7heranno,ridare|5anno,rifare|5anno,ristare|6anno,sopraffare|9anno,stare|4anno,stroncare|6heranno,teletrasmettere|8etteranno,troncare|5heranno,abbattere|8anno,abbonacciare|8eranno,abbracciare|7eranno,abradere|7anno,accartocciare|9eranno,accasciare|6eranno,accedere|7anno,accendere|8anno,accogliere|9anno,acconciare|6eranno,accondiscendere|14anno,accorciare|6eranno,accorrere|8anno,accrescere|9anno,adergere|7anno,affacciare|6eranno,affliggere|9anno,afflosciare|7eranno,affrangere|9anno,agganciare|6eranno,agghiacciare|8eranno,aggiungere|9anno,agiare|2eranno,albeggiare|6eranno,aleggiare|5eranno,algere|5anno,allacciare|6eranno,alloggiare|6eranno,alludere|7anno,amareggiare|7eranno,ambasciare|6eranno,ammettere|8anno,amoreggiare|7eranno,ancheggiare|7eranno,annettere|8anno,annunciare|6eranno,antecedere|9anno,appartenere|7rranno,appendere|8anno,appoggiare|6eranno,apprendere|9anno,approcciare|7eranno,ardere|5anno,arieggiare|6eranno,armeggiare|6eranno,arricciare|6eranno,arridere|7anno,arrogere|7anno,ascendere|8anno,ascondere|8anno,ascrivere|8anno,aspergere|8anno,assaggiare|6eranno,assidere|7anno,assistere|8anno,associare|5eranno,assolvere|8anno,assumere|7anno,assurgere|8anno,astenere|4rranno,astergere|8anno,astringere|9anno,atteggiare|6eranno,attendere|8anno,attenere|4rranno,attingere|8anno,attorcere|8anno,avvincere|8anno,avvolgere|8anno,baciare|3eranno,battere|6anno,beccheggiare|8eranno,benedicere|9anno,beneficiare|7eranno,berciare|4eranno,bigiare|3eranno,bilanciare|6eranno,bisticciare|7eranno,boccheggiare|8eranno,bocciare|4eranno,borseggiare|7eranno,bruciare|4eranno,cacciare|4eranno,calciare|4eranno,campeggiare|7eranno,cangiare|4eranno,capeggiare|6eranno,capitaneggiare|10eranno,capovolgere|10anno,cazzeggiare|7eranno,cedere|5anno,cernere|6anno,cherere|6anno,chiedere|7anno,chierere|7anno,chiocciare|6eranno,chiudere|7anno,cingere|6anno,circoncidere|11anno,circoscrivere|12anno,ciucciare|5eranno,clangere|7anno,cogliere|7anno,cognoscere|9anno,coincidere|9anno,collidere|8anno,colludere|8anno,combaciare|6eranno,combattere|9anno,cominciare|6eranno,commettere|9anno,competere|8anno,compiacere|9anno,compiangere|10anno,compiere|5ranno,comprendere|10anno,comprimere|9anno,compromettere|12anno,compungere|9anno,concedere|8anno,concernere|9anno,conciare|4eranno,concludere|9anno,concorrere|9anno,confondere|9anno,congiungere|10anno,connettere|9anno,conoscere|8anno,consistere|9anno,contagiare|6eranno,conteggiare|7eranno,contendere|9anno,contenere|5rranno,contorcere|9anno,contraddistinguere|17anno,controbattere|12anno,convergere|9anno,convincere|9anno,convolgere|9anno,correggere|9anno,correre|6anno,corrispondere|12anno,corrodere|8anno,corrompere|9anno,corteggiare|7eranno,cospargere|9anno,costeggiare|7eranno,costringere|10anno,credere|6anno,crescere|7anno,crocifiggere|11anno,danneggiare|7eranno,dardeggiare|7eranno,decedere|7anno,decidere|7anno,decorrere|8anno,decrescere|9anno,defungere|8anno,delinquere|9anno,deludere|7anno,deprimere|8anno,deridere|7anno,descrivere|9anno,desistere|8anno,destreggiare|8eranno,desumere|7anno,detenere|4rranno,detergere|8anno,devolvere|8anno,difendere|8anno,diffondere|9anno,diligere|7anno,dimettere|8anno,dipendere|8anno,dipingere|8anno,dirigere|7anno,dirimere|7anno,dirompere|8anno,disattendere|11anno,discendere|9anno,discernere|9anno,dischiudere|10anno,disciogliere|11anno,disconnettere|12anno,disconoscere|11anno,discorrere|9anno,discutere|8anno,disgiungere|10anno,dismettere|9anno,disperdere|9anno,dispiacere|9anno,dispregiare|7eranno,dissociare|6eranno,dissolvere|9anno,dissuadere|9anno,distendere|9anno,distinguere|10anno,distogliere|10anno,distorcere|9anno,distruggere|10anno,divellere|8anno,divergere|8anno,dividere|7anno,dolere|2rranno,ducere|2rranno,eccedere|7anno,eccellere|8anno,echeggiare|6eranno,educere|3rranno,effigiare|5eranno,effondere|8anno,eleggere|7anno,elidere|6anno,elogiare|4eranno,eludere|6anno,emergere|7anno,emettere|7anno,enunciare|5eranno,equipaggiare|8eranno,equivalere|6rranno,ergere|5anno,erigere|6anno,erodere|6anno,erompere|7anno,escludere|8anno,escutere|7anno,esigere|6anno,esistere|7anno,espandere|8anno,espellere|8anno,esprimere|8anno,espungere|8anno,estendere|8anno,estinguere|9anno,estollere|8anno,estorcere|8anno,estrudere|8anno,evadere|6anno,evincere|7anno,evolvere|7anno,falciare|4eranno,fasciare|4eranno,favoreggiare|8eranno,fendere|6anno,fervere|6anno,festeggiare|7eranno,fiammeggiare|8eranno,fiancheggiare|9eranno,figgere|6anno,fingere|6anno,flettere|7anno,foggiare|4eranno,forgiare|4eranno,fottere|6anno,fraintendere|11anno,frangere|7anno,fregiare|4eranno,fremere|6anno,friggere|7anno,fronteggiare|8eranno,fulgere|6anno,fungere|6anno,galleggiare|7eranno,gareggiare|6eranno,gemere|5anno,ghiacciare|6eranno,giacere|6anno,giungere|7anno,gocciare|4eranno,gorgheggiare|8eranno,guerreggiare|8eranno,illudere|7anno,imbevere|7anno,imbracciare|7eranno,immergere|8anno,immettere|8anno,impacciare|6eranno,imprendere|9anno,imprimere|8anno,incedere|7anno,incendere|8anno,incidere|7anno,incingere|8anno,includere|8anno,incombere|8anno,incominciare|8eranno,incoraggiare|8eranno,incorniciare|8eranno,incorrere|8anno,incrociare|6eranno,incutere|7anno,indietreggiare|10eranno,indugiare|5eranno,indulgere|8anno,infiggere|8anno,infliggere|9anno,infondere|8anno,infradiciare|8eranno,infrangere|9anno,ingaggiare|6eranno,ingiungere|9anno,inscrivere|9anno,insistere|8anno,insorgere|8anno,insudiciare|7eranno,intendere|8anno,intercedere|10anno,intercorrere|11anno,interfacciare|9eranno,interrompere|11anno,intingere|8anno,intralciare|7eranno,intraprendere|12anno,intrattenere|8rranno,intrecciare|7eranno,intridere|8anno,intromettere|11anno,intrudere|8anno,invadere|7anno,invalere|4rranno,involgere|8anno,irridere|7anno,irrompere|8anno,iscrivere|8anno,lampeggiare|7eranno,lanciare|4eranno,lasciare|4eranno,ledere|5anno,leggere|6anno,licere|5anno,linciare|4eranno,lisciare|4eranno,maneggiare|6eranno,mangiare|4eranno,manomettere|10anno,mantenere|5rranno,manutenere|6rranno,marciare|4eranno,massaggiare|7eranno,mercanteggiare|10eranno,mergere|6anno,mescere|6anno,mettere|6anno,mietere|6anno,minacciare|6eranno,mingere|6anno,molcere|6anno,mordere|6anno,mungere|6anno,nascere|6anno,nascondere|9anno,negligere|8anno,noleggiare|6eranno,occhieggiare|8eranno,occidere|7anno,occludere|8anno,occorrere|8anno,offendere|8anno,officiare|5eranno,oltraggiare|7eranno,ombreggiare|7eranno,omettere|7anno,ondeggiare|6eranno,opprimere|8anno,ormeggiare|6eranno,osteggiare|6eranno,ottenere|4rranno,ottundere|8anno,padroneggiare|9eranno,palleggiare|7eranno,parcheggiare|8eranno,pareggiare|6eranno,parere|3ranno,pascere|6anno,passeggiare|7eranno,patteggiare|7eranno,pendere|6anno,percorrere|9anno,perdere|6anno,permanere|5rranno,permettere|9anno,persistere|9anno,persuadere|9anno,pertenere|5rranno,pervadere|8anno,pettegoleggiare|11eranno,piacere|6anno,piacevoleggiare|11eranno,piaggiare|5eranno,pianeggiare|7eranno,piangere|7anno,pigiare|3eranno,piovere|6anno,pisciare|4eranno,plagiare|4eranno,poggiare|4eranno,porgere|6anno,porporeggiare|9eranno,portendere|9anno,posteggiare|7eranno,precedere|8anno,precidere|8anno,precludere|9anno,precorrere|9anno,prediligere|10anno,prefiggere|9anno,pregiare|4eranno,premere|6anno,premettere|9anno,prenascere|9anno,prendere|7anno,prescegliere|11anno,prescrivere|10anno,presumere|8anno,pretendere|9anno,prevalere|5rranno,primeggiare|7eranno,privilegiare|8eranno,procedere|8anno,profondere|9anno,promettere|9anno,pronunciare|7eranno,propellere|9anno,propendere|9anno,prorompere|9anno,proteggere|9anno,protendere|9anno,prudere|6anno,pungere|6anno,punteggiare|7eranno,racchiudere|10anno,raccogliere|10anno,raccorciare|7eranno,radere|5anno,raggiare|4eranno,raggiungere|10anno,rapprendere|10anno,recedere|7anno,recidere|7anno,recingere|8anno,recludere|8anno,redigere|7anno,redimere|7anno,reggere|6anno,rendere|6anno,repellere|8anno,reprimere|8anno,rescindere|9anno,resistere|8anno,respingere|9anno,restringere|10anno,retrocedere|10anno,riabbracciare|9eranno,riaccendere|10anno,riagganciare|8eranno,riallacciare|8eranno,riappendere|10anno,riardere|7anno,riassumere|9anno,riavvolgere|10anno,ribattere|8anno,ricacciare|6eranno,ricedere|7anno,ricevere|7anno,richiedere|9anno,ricogliere|9anno,ricominciare|8eranno,ricongiungere|12anno,riconoscere|10anno,ricorrere|8anno,ricredere|8anno,ricrescere|9anno,ridere|5anno,ridipingere|10anno,riducere|4rranno,riecheggiare|8eranno,rieleggere|9anno,riflettere|9anno,rifulgere|8anno,rilanciare|6eranno,rilasciare|6eranno,rileggere|8anno,rimanere|4rranno,rimangiare|6eranno,rimettere|8anno,rimordere|8anno,rinascere|8anno,rinchiudere|10anno,rincominciare|9eranno,rincrescere|10anno,rinunciare|6eranno,ripetere|7anno,ripiovere|8anno,riprendere|9anno,riscrivere|9anno,risiedere|8anno,risolvere|8anno,risorgere|8anno,rispingere|9anno,risplendere|10anno,rispondere|9anno,ristringere|10anno,ritenere|4rranno,ritorcere|8anno,ritrasmettere|12anno,rivaleggiare|8eranno,rivendere|8anno,rivincere|8anno,rivolgere|8anno,rivolvere|8anno,rompere|6anno,rovesciare|6eranno,rumoreggiare|8eranno,saccheggiare|8eranno,saggiare|4eranno,sbattere|7anno,sbilanciare|7eranno,sbirciare|5eranno,sbocciare|5eranno,sbucciare|5eranno,scacciare|5eranno,scadere|6anno,scalciare|5eranno,scarseggiare|8eranno,scegliere|8anno,scendere|7anno,sceneggiare|7eranno,scernere|7anno,scheggiare|6eranno,schiacciare|7eranno,schiaffeggiare|10eranno,schiudere|8anno,scindere|7anno,sciogliere|9anno,scocciare|5eranno,scommettere|10anno,sconfiggere|10anno,sconnettere|10anno,sconoscere|9anno,sconvolgere|10anno,scoraggiare|7eranno,scorciare|5eranno,scoreggiare|7eranno,scorgere|7anno,scorrere|7anno,scortecciare|8eranno,scoscendere|10anno,scrivere|7anno,scrosciare|6eranno,sculacciare|7eranno,secernere|8anno,selciare|4eranno,serpeggiare|7eranno,setacciare|6eranno,sfasciare|5eranno,sfiduciare|6eranno,sfociare|4eranno,sfottere|7anno,sfrecciare|6eranno,sfregiare|5eranno,sganciare|5eranno,sgusciare|5eranno,simboleggiare|9eranno,slacciare|5eranno,slanciare|5eranno,smettere|7anno,socchiudere|10anno,soccombere|9anno,soccorrere|9anno,soffriggere|10anno,soggiacere|9anno,soggiungere|10anno,soleggiare|6eranno,solvere|6anno,sommergere|9anno,sommettere|9anno,sopprimere|9anno,sopraggiungere|13anno,soprintendere|12anno,sorgere|6anno,sorprendere|10anno,sorreggere|9anno,sorridere|8anno,sorseggiare|7eranno,sorteggiare|7eranno,sospendere|9anno,sospingere|9anno,sostenere|5rranno,sottacere|8anno,sottendere|9anno,sottintendere|12anno,sottomettere|11anno,sottoscrivere|12anno,sovrintendere|12anno,spacciare|5eranno,spalleggiare|8eranno,spandere|7anno,sparere|4ranno,spargere|7anno,spegnere|7anno,spendere|7anno,spergere|7anno,spiaggiare|6eranno,spingere|7anno,spiovere|7anno,splendere|8anno,sporgere|7anno,spregiare|5eranno,spremere|7anno,squarciare|6eranno,stacciare|5eranno,stendere|7anno,stingere|7anno,storcere|7anno,stracciare|6eranno,stravincere|10anno,stravolgere|10anno,stridere|7anno,stringere|8anno,strisciare|6eranno,struggere|8anno,strusciare|6eranno,succedere|8anno,suddividere|10anno,sumere|5anno,sunteggiare|7eranno,sussistere|9anno,svaligiare|6eranno,svellere|7anno,svendere|7anno,svolgere|7anno,tacere|5anno,tangere|6anno,temere|5anno,temporeggiare|9eranno,tendere|6anno,tenere|2rranno,tergere|6anno,tessere|6anno,tingere|6anno,tinteggiare|7eranno,togliere|7anno,torcere|6anno,tracciare|5eranno,trafiggere|9anno,tralasciare|7eranno,tramettere|9anno,trangugiare|7eranno,transigere|9anno,trascendere|10anno,trascorrere|10anno,trascrivere|10anno,trasfondere|10anno,trasmettere|10anno,tratteggiare|8eranno,trattenere|6rranno,travolgere|9anno,troneggiare|7eranno,uccidere|7anno,ungere|5anno,urgere|5anno,vagheggiare|7eranno,valere|2rranno,vaneggiare|6eranno,veleggiare|6eranno,vendere|6anno,vengiare|4eranno,vergere|6anno,verniciare|6eranno,vertere|6anno,vetrioleggiare|10eranno,vezzeggiare|7eranno,viaggiare|5eranno,villeggiare|7eranno,vincere|6anno,vociare|3eranno,volere|2rranno,volgere|6anno,volteggiare|7eranno,volvere|6anno",
        "rev": "ndranno|2are,irànno|2e,otranno|2ere,apranno|2ere,dranno|1ere,vranno|1ere,erranno|1nire,aranno|2e,rranno|2e,heranno|are,iranno|2e,eranno|are"
      }
    },
    "conditional": {
      "first": {
        "rules": "ompiere|4rei,ecadere|4rei,overe|2rei,lencare|4herei,otere|2rei,icadere|4rei,esciare|3erei,tostare|7i,trafare|7i,rincare|4herei,osciare|3erei,ingare|3herei,uciare|2erei,baciare|3erei,ulgare|3herei,olere|1rrei,manere|2rrei,sapere|3rei,usciare|3erei,parere|3rei,sfare|5i,ducere|2rrei,isciare|3erei,vivere|3rei,valere|2rrei,angare|3herei,rgare|2herei,ociare|2erei,efare|5i,lciare|2erei,iciare|2erei,vedere|3rei,asciare|3erei,rciare|2erei,ugare|2herei,ucare|2herei,acare|2herei,ecare|2herei,ancare|3herei,lcare|2herei,rcare|2herei,scare|2herei,tenere|2rrei,igare|2herei,venire|2rrei,agare|2herei,ocare|2herei,ogare|2herei,nciare|2erei,egare|2herei,cciare|2erei,ccare|2herei,rre|3i,icare|2herei,giare|1erei,ire|3i,ere|3i,are|erei",
        "exceptions": "accadere|&#8212;,andare|3rei,avere|2rei,cadere|3rei,contraffare|11i,dare|4i,fare|4i,godere|3rei,prolungare|7herei,ridare|6i,rifare|6i,ristare|7i,sopraffare|10i,stare|5i,stroncare|6herei,teletrasmettere|8etterei,troncare|5herei,abbattere|9i,abradere|8i,accendere|9i,accogliere|10i,acconciare|6erei,accondiscendere|15i,accorciare|6erei,accorrere|9i,afflosciare|7erei,aggiungere|10i,ammettere|9i,annettere|9i,appendere|9i,apprendere|10i,ardere|6i,arridere|8i,ascendere|9i,ascondere|9i,ascrivere|9i,assidere|8i,assistere|9i,assumere|8i,attendere|9i,battere|7i,benedicere|10i,bigiare|3erei,cangiare|4erei,cernere|7i,cherere|7i,chierere|8i,circoncidere|12i,circoscrivere|13i,cogliere|8i,coincidere|10i,collidere|9i,combattere|10i,cominciare|6erei,commettere|10i,comprendere|11i,comprimere|10i,compromettere|13i,compungere|10i,concernere|10i,conciare|4erei,concorrere|10i,confondere|10i,congiungere|11i,connettere|10i,consistere|10i,contendere|10i,contraddistinguere|18i,controbattere|13i,correggere|10i,correre|7i,corrispondere|13i,corrodere|9i,credere|7i,decidere|8i,decorrere|9i,defungere|9i,deprimere|9i,deridere|8i,descrivere|10i,desistere|9i,desumere|8i,difendere|9i,diffondere|10i,dimettere|9i,dipendere|9i,dirimere|8i,disattendere|12i,discendere|10i,discernere|10i,disciogliere|12i,disconnettere|13i,discorrere|10i,disgiungere|11i,dismettere|10i,dissuadere|10i,distendere|10i,distinguere|11i,distogliere|11i,divellere|9i,dolere|2rrei,ducere|2rrei,eccellere|9i,educere|3rrei,effondere|9i,eleggere|8i,elidere|7i,emettere|8i,erodere|7i,esistere|8i,espandere|9i,espellere|9i,esprimere|9i,espungere|9i,estendere|9i,estinguere|10i,estollere|9i,fendere|7i,fervere|7i,flettere|8i,forgiare|4erei,fottere|7i,fraintendere|12i,fremere|7i,fungere|7i,gemere|6i,giungere|8i,immettere|9i,imprendere|10i,imprimere|9i,incendere|9i,incidere|8i,incombere|9i,incominciare|8erei,incorrere|9i,infondere|9i,ingiungere|10i,inscrivere|10i,insistere|9i,intendere|9i,intercorrere|12i,intraprendere|13i,intridere|9i,intromettere|12i,irridere|8i,iscrivere|9i,ledere|6i,leggere|7i,licere|6i,linciare|4erei,mangiare|4erei,manomettere|11i,mettere|7i,mietere|7i,mordere|7i,mungere|7i,nascere|7i,nascondere|10i,occidere|8i,occorrere|9i,offendere|9i,omettere|8i,opprimere|9i,pascere|7i,pendere|7i,percorrere|10i,permettere|10i,persistere|10i,persuadere|10i,pigiare|3erei,portendere|10i,precidere|9i,precorrere|10i,premere|7i,premettere|10i,prenascere|10i,prendere|8i,prescegliere|12i,prescrivere|11i,presumere|9i,pretendere|10i,profondere|10i,promettere|10i,propellere|10i,propendere|10i,proteggere|10i,protendere|10i,pungere|7i,raccogliere|11i,raccorciare|7erei,radere|6i,raggiungere|11i,rapprendere|11i,recidere|8i,redimere|8i,reggere|7i,rendere|7i,repellere|9i,reprimere|9i,rescindere|10i,resistere|9i,riaccendere|11i,riappendere|11i,riardere|8i,riassumere|10i,ribattere|9i,ricogliere|10i,ricominciare|8erei,ricongiungere|13i,ricorrere|9i,ricredere|9i,ridere|6i,rieleggere|10i,riflettere|10i,rileggere|9i,rimangiare|6erei,rimettere|9i,rimordere|9i,rinascere|9i,rincominciare|9erei,riprendere|10i,riscrivere|10i,risplendere|11i,rispondere|10i,ritrasmettere|13i,rivendere|9i,rovesciare|6erei,sbattere|8i,scegliere|9i,scendere|8i,scernere|8i,scindere|8i,sciogliere|10i,scommettere|11i,sconnettere|11i,scorciare|5erei,scorrere|8i,scoscendere|11i,scrivere|8i,scrosciare|6erei,secernere|9i,sfottere|8i,smettere|8i,soccombere|10i,soccorrere|10i,soggiungere|11i,sommettere|10i,sopprimere|10i,sopraggiungere|14i,soprintendere|13i,sorprendere|11i,sorreggere|10i,sorridere|9i,sospendere|10i,sottendere|10i,sottintendere|13i,sottomettere|12i,sottoscrivere|13i,sovrintendere|13i,spandere|8i,spegnere|8i,spendere|8i,splendere|9i,spremere|8i,stendere|8i,stridere|8i,sumere|6i,sussistere|10i,svaligiare|6erei,svellere|8i,svendere|8i,temere|6i,tendere|7i,tessere|7i,togliere|8i,tramettere|10i,trascendere|11i,trascorrere|11i,trascrivere|11i,trasfondere|11i,trasmettere|11i,uccidere|8i,ungere|6i,vendere|7i,vertere|7i,volere|2rrei",
        "rev": "ndrei|2are,ercerei|3iare,ompirei|4ere,nquerei|6,figerei|3iare,logerei|3iare,beverei|6,underei|6,otrei|2ere,ceverei|6,idurrei|3cere,ircerei|3iare,caderei|6,engerei|3iare,ucerei|2iare,bacerei|3iare,peterei|6,erderei|6,uggerei|6,viderei|6,ugerei|2iare,arcerei|3iare,marrei|2nere,saprei|3ere,uscerei|3iare,parrei|3ere,iederei|6,agerei|2iare,cuterei|6,ruderei|6,vaderei|6,iscerei|3iare,uncerei|3iare,varrei|2lere,ocerei|2iare,lcerei|2iare,oscerei|6,escerei|6,vrei|1ere,incerei|6,icerei|2iare,iuderei|6,egerei|2iare,ascerei|3iare,angerei|6,orcerei|6,acerei|5,omperei|6,ancerei|3iare,olverei|6,igerei|5,iggerei|6,drei|1ere,luderei|6,cederei|6,terrei|2nere,verrei|2nire,lgerei|5,arei|3,ingerei|6,rgerei|5,ccerei|2iare,rrei|3,ggerei|2iare,herei|are,irei|3,erei|are"
      },
      "second": {
        "rules": "ompiere|4resti,ecadere|4resti,overe|2resti,lencare|4heresti,otere|2resti,icadere|4resti,esciare|3eresti,tostare|7sti,trafare|7sti,rincare|4heresti,osciare|3eresti,ingare|3heresti,uciare|2eresti,baciare|3eresti,ulgare|3heresti,olere|1rresti,manere|2rresti,sapere|3resti,usciare|3eresti,parere|3resti,sfare|5sti,ducere|2rresti,isciare|3eresti,vivere|3resti,valere|2rresti,angare|3heresti,rgare|2heresti,ociare|2eresti,efare|5sti,lciare|2eresti,iciare|2eresti,vedere|3resti,asciare|3eresti,rciare|2eresti,ugare|2heresti,ucare|2heresti,acare|2heresti,ecare|2heresti,ancare|3heresti,lcare|2heresti,rcare|2heresti,scare|2heresti,tenere|2rresti,igare|2heresti,venire|2rresti,agare|2heresti,ocare|2heresti,ogare|2heresti,nciare|2eresti,egare|2heresti,cciare|2eresti,ccare|2heresti,rre|3sti,icare|2heresti,giare|1eresti,ire|3sti,ere|3sti,are|eresti",
        "exceptions": "accadere|&#8212;,andare|3resti,avere|2resti,cadere|3resti,contraffare|11sti,dare|4sti,fare|4sti,godere|3resti,prolungare|7heresti,ridare|6sti,rifare|6sti,ristare|7sti,sopraffare|10sti,stare|5sti,stroncare|6heresti,teletrasmettere|8etteresti,troncare|5heresti,abbattere|9sti,abbonacciare|8eresti,abbracciare|7eresti,abradere|8sti,accartocciare|9eresti,accasciare|6eresti,accedere|8sti,accendere|9sti,accogliere|10sti,acconciare|6eresti,accondiscendere|15sti,accorciare|6eresti,accorrere|9sti,accrescere|10sti,adergere|8sti,affacciare|6eresti,affliggere|10sti,afflosciare|7eresti,affrangere|10sti,agganciare|6eresti,agghiacciare|8eresti,aggiungere|10sti,agiare|2eresti,albeggiare|6eresti,aleggiare|5eresti,algere|6sti,allacciare|6eresti,alloggiare|6eresti,alludere|8sti,amareggiare|7eresti,ambasciare|6eresti,ammettere|9sti,amoreggiare|7eresti,ancheggiare|7eresti,annettere|9sti,annunciare|6eresti,antecedere|10sti,appartenere|7rresti,appendere|9sti,appoggiare|6eresti,apprendere|10sti,approcciare|7eresti,ardere|6sti,arieggiare|6eresti,armeggiare|6eresti,arricciare|6eresti,arridere|8sti,ascendere|9sti,ascondere|9sti,ascrivere|9sti,aspergere|9sti,assaggiare|6eresti,assidere|8sti,assistere|9sti,associare|5eresti,assolvere|9sti,assumere|8sti,assurgere|9sti,astenere|4rresti,astergere|9sti,astringere|10sti,atteggiare|6eresti,attendere|9sti,attenere|4rresti,attingere|9sti,attorcere|9sti,avvincere|9sti,avvolgere|9sti,baciare|3eresti,battere|7sti,beccheggiare|8eresti,benedicere|10sti,beneficiare|7eresti,berciare|4eresti,bigiare|3eresti,bilanciare|6eresti,bisticciare|7eresti,boccheggiare|8eresti,bocciare|4eresti,borseggiare|7eresti,bruciare|4eresti,cacciare|4eresti,calciare|4eresti,campeggiare|7eresti,cangiare|4eresti,capeggiare|6eresti,capitaneggiare|10eresti,capovolgere|11sti,cazzeggiare|7eresti,cedere|6sti,cernere|7sti,cherere|7sti,chiedere|8sti,chierere|8sti,chiocciare|6eresti,chiudere|8sti,cingere|7sti,circoncidere|12sti,circoscrivere|13sti,ciucciare|5eresti,clangere|8sti,cogliere|8sti,cognoscere|10sti,coincidere|10sti,collidere|9sti,colludere|9sti,combaciare|6eresti,combattere|10sti,cominciare|6eresti,commettere|10sti,competere|9sti,compiacere|10sti,compiangere|11sti,compiere|5resti,comprendere|11sti,comprimere|10sti,compromettere|13sti,compungere|10sti,concedere|9sti,concernere|10sti,conciare|4eresti,concludere|10sti,concorrere|10sti,confondere|10sti,congiungere|11sti,connettere|10sti,conoscere|9sti,consistere|10sti,contagiare|6eresti,conteggiare|7eresti,contendere|10sti,contenere|5rresti,contorcere|10sti,contraddistinguere|18sti,controbattere|13sti,convergere|10sti,convincere|10sti,convolgere|10sti,correggere|10sti,correre|7sti,corrispondere|13sti,corrodere|9sti,corrompere|10sti,corteggiare|7eresti,cospargere|10sti,costeggiare|7eresti,costringere|11sti,credere|7sti,crescere|8sti,crocifiggere|12sti,danneggiare|7eresti,dardeggiare|7eresti,decedere|8sti,decidere|8sti,decorrere|9sti,decrescere|10sti,defungere|9sti,delinquere|10sti,deludere|8sti,deprimere|9sti,deridere|8sti,descrivere|10sti,desistere|9sti,destreggiare|8eresti,desumere|8sti,detenere|4rresti,detergere|9sti,devolvere|9sti,difendere|9sti,diffondere|10sti,diligere|8sti,dimettere|9sti,dipendere|9sti,dipingere|9sti,dirigere|8sti,dirimere|8sti,dirompere|9sti,disattendere|12sti,discendere|10sti,discernere|10sti,dischiudere|11sti,disciogliere|12sti,disconnettere|13sti,disconoscere|12sti,discorrere|10sti,discutere|9sti,disgiungere|11sti,dismettere|10sti,disperdere|10sti,dispiacere|10sti,dispregiare|7eresti,dissociare|6eresti,dissolvere|10sti,dissuadere|10sti,distendere|10sti,distinguere|11sti,distogliere|11sti,distorcere|10sti,distruggere|11sti,divellere|9sti,divergere|9sti,dividere|8sti,dolere|2rresti,ducere|2rresti,eccedere|8sti,eccellere|9sti,echeggiare|6eresti,educere|3rresti,effigiare|5eresti,effondere|9sti,eleggere|8sti,elidere|7sti,elogiare|4eresti,eludere|7sti,emergere|8sti,emettere|8sti,enunciare|5eresti,equipaggiare|8eresti,equivalere|6rresti,ergere|6sti,erigere|7sti,erodere|7sti,erompere|8sti,escludere|9sti,escutere|8sti,esigere|7sti,esistere|8sti,espandere|9sti,espellere|9sti,esprimere|9sti,espungere|9sti,estendere|9sti,estinguere|10sti,estollere|9sti,estorcere|9sti,estrudere|9sti,evadere|7sti,evincere|8sti,evolvere|8sti,falciare|4eresti,fasciare|4eresti,favoreggiare|8eresti,fendere|7sti,fervere|7sti,festeggiare|7eresti,fiammeggiare|8eresti,fiancheggiare|9eresti,figgere|7sti,fingere|7sti,flettere|8sti,foggiare|4eresti,forgiare|4eresti,fottere|7sti,fraintendere|12sti,frangere|8sti,fregiare|4eresti,fremere|7sti,friggere|8sti,fronteggiare|8eresti,fulgere|7sti,fungere|7sti,galleggiare|7eresti,gareggiare|6eresti,gemere|6sti,ghiacciare|6eresti,giacere|7sti,giungere|8sti,gocciare|4eresti,gorgheggiare|8eresti,guerreggiare|8eresti,illudere|8sti,imbevere|8sti,imbracciare|7eresti,immergere|9sti,immettere|9sti,impacciare|6eresti,imprendere|10sti,imprimere|9sti,incedere|8sti,incendere|9sti,incidere|8sti,incingere|9sti,includere|9sti,incombere|9sti,incominciare|8eresti,incoraggiare|8eresti,incorniciare|8eresti,incorrere|9sti,incrociare|6eresti,incutere|8sti,indietreggiare|10eresti,indugiare|5eresti,indulgere|9sti,infiggere|9sti,infliggere|10sti,infondere|9sti,infradiciare|8eresti,infrangere|10sti,ingaggiare|6eresti,ingiungere|10sti,inscrivere|10sti,insistere|9sti,insorgere|9sti,insudiciare|7eresti,intendere|9sti,intercedere|11sti,intercorrere|12sti,interfacciare|9eresti,interrompere|12sti,intingere|9sti,intralciare|7eresti,intraprendere|13sti,intrattenere|8rresti,intrecciare|7eresti,intridere|9sti,intromettere|12sti,intrudere|9sti,invadere|8sti,invalere|4rresti,involgere|9sti,irridere|8sti,irrompere|9sti,iscrivere|9sti,lampeggiare|7eresti,lanciare|4eresti,lasciare|4eresti,ledere|6sti,leggere|7sti,licere|6sti,linciare|4eresti,lisciare|4eresti,maneggiare|6eresti,mangiare|4eresti,manomettere|11sti,mantenere|5rresti,manutenere|6rresti,marciare|4eresti,massaggiare|7eresti,mercanteggiare|10eresti,mergere|7sti,mescere|7sti,mettere|7sti,mietere|7sti,minacciare|6eresti,mingere|7sti,mordere|7sti,mungere|7sti,nascere|7sti,nascondere|10sti,negligere|9sti,noleggiare|6eresti,occhieggiare|8eresti,occidere|8sti,occludere|9sti,occorrere|9sti,offendere|9sti,officiare|5eresti,oltraggiare|7eresti,ombreggiare|7eresti,omettere|8sti,ondeggiare|6eresti,opprimere|9sti,ormeggiare|6eresti,osteggiare|6eresti,ottenere|4rresti,ottundere|9sti,padroneggiare|9eresti,palleggiare|7eresti,parcheggiare|8eresti,pareggiare|6eresti,parere|3resti,pascere|7sti,passeggiare|7eresti,patteggiare|7eresti,pendere|7sti,percorrere|10sti,perdere|7sti,permanere|5rresti,permettere|10sti,persistere|10sti,persuadere|10sti,pertenere|5rresti,pervadere|9sti,pettegoleggiare|11eresti,piacere|7sti,piacevoleggiare|11eresti,piaggiare|5eresti,pianeggiare|7eresti,piangere|8sti,pigiare|3eresti,pisciare|4eresti,plagiare|4eresti,poggiare|4eresti,porgere|7sti,porporeggiare|9eresti,portendere|10sti,posteggiare|7eresti,precedere|9sti,precidere|9sti,precludere|10sti,precorrere|10sti,prediligere|11sti,prefiggere|10sti,pregiare|4eresti,premere|7sti,premettere|10sti,prenascere|10sti,prendere|8sti,prescegliere|12sti,prescrivere|11sti,presumere|9sti,pretendere|10sti,prevalere|5rresti,primeggiare|7eresti,privilegiare|8eresti,procedere|9sti,profondere|10sti,promettere|10sti,pronunciare|7eresti,propellere|10sti,propendere|10sti,prorompere|10sti,proteggere|10sti,protendere|10sti,prudere|7sti,pungere|7sti,punteggiare|7eresti,racchiudere|11sti,raccogliere|11sti,raccorciare|7eresti,radere|6sti,raggiare|4eresti,raggiungere|11sti,rapprendere|11sti,recedere|8sti,recidere|8sti,recingere|9sti,recludere|9sti,redigere|8sti,redimere|8sti,reggere|7sti,rendere|7sti,repellere|9sti,reprimere|9sti,rescindere|10sti,resistere|9sti,respingere|10sti,restringere|11sti,retrocedere|11sti,riabbracciare|9eresti,riaccendere|11sti,riagganciare|8eresti,riallacciare|8eresti,riappendere|11sti,riardere|8sti,riassumere|10sti,riavvolgere|11sti,ribattere|9sti,ricacciare|6eresti,ricedere|8sti,ricevere|8sti,richiedere|10sti,ricogliere|10sti,ricominciare|8eresti,ricongiungere|13sti,riconoscere|11sti,ricorrere|9sti,ricredere|9sti,ricrescere|10sti,ridere|6sti,ridipingere|11sti,riducere|4rresti,riecheggiare|8eresti,rieleggere|10sti,riflettere|10sti,rifulgere|9sti,rilanciare|6eresti,rilasciare|6eresti,rileggere|9sti,rimanere|4rresti,rimangiare|6eresti,rimettere|9sti,rimordere|9sti,rinascere|9sti,rinchiudere|11sti,rincominciare|9eresti,rincrescere|11sti,rinunciare|6eresti,ripetere|8sti,riprendere|10sti,riscrivere|10sti,risiedere|9sti,risolvere|9sti,risorgere|9sti,rispingere|10sti,risplendere|11sti,rispondere|10sti,ristringere|11sti,ritenere|4rresti,ritorcere|9sti,ritrasmettere|13sti,rivaleggiare|8eresti,rivendere|9sti,rivincere|9sti,rivolgere|9sti,rivolvere|9sti,rompere|7sti,rovesciare|6eresti,rumoreggiare|8eresti,saccheggiare|8eresti,saggiare|4eresti,sbattere|8sti,sbilanciare|7eresti,sbirciare|5eresti,sbocciare|5eresti,sbucciare|5eresti,scacciare|5eresti,scadere|7sti,scalciare|5eresti,scarseggiare|8eresti,scegliere|9sti,scendere|8sti,sceneggiare|7eresti,scernere|8sti,scheggiare|6eresti,schiacciare|7eresti,schiaffeggiare|10eresti,schiudere|9sti,scindere|8sti,sciogliere|10sti,scocciare|5eresti,scommettere|11sti,sconfiggere|11sti,sconnettere|11sti,sconoscere|10sti,sconvolgere|11sti,scoraggiare|7eresti,scorciare|5eresti,scoreggiare|7eresti,scorgere|8sti,scorrere|8sti,scortecciare|8eresti,scoscendere|11sti,scrivere|8sti,scrosciare|6eresti,sculacciare|7eresti,secernere|9sti,selciare|4eresti,serpeggiare|7eresti,setacciare|6eresti,sfasciare|5eresti,sfiduciare|6eresti,sfociare|4eresti,sfottere|8sti,sfrecciare|6eresti,sfregiare|5eresti,sganciare|5eresti,sgusciare|5eresti,simboleggiare|9eresti,slacciare|5eresti,slanciare|5eresti,smettere|8sti,socchiudere|11sti,soccombere|10sti,soccorrere|10sti,soffriggere|11sti,soggiacere|10sti,soggiungere|11sti,soleggiare|6eresti,solvere|7sti,sommergere|10sti,sommettere|10sti,sopprimere|10sti,sopraggiungere|14sti,soprintendere|13sti,sorgere|7sti,sorprendere|11sti,sorreggere|10sti,sorridere|9sti,sorseggiare|7eresti,sorteggiare|7eresti,sospendere|10sti,sospingere|10sti,sostenere|5rresti,sottacere|9sti,sottendere|10sti,sottintendere|13sti,sottomettere|12sti,sottoscrivere|13sti,sovrintendere|13sti,spacciare|5eresti,spalleggiare|8eresti,spandere|8sti,sparere|4resti,spargere|8sti,spegnere|8sti,spendere|8sti,spergere|8sti,spiaggiare|6eresti,spingere|8sti,splendere|9sti,sporgere|8sti,spregiare|5eresti,spremere|8sti,squarciare|6eresti,stacciare|5eresti,stendere|8sti,stingere|8sti,storcere|8sti,stracciare|6eresti,stravincere|11sti,stravolgere|11sti,stridere|8sti,stringere|9sti,strisciare|6eresti,struggere|9sti,strusciare|6eresti,succedere|9sti,suddividere|11sti,sumere|6sti,sunteggiare|7eresti,sussistere|10sti,svaligiare|6eresti,svellere|8sti,svendere|8sti,svolgere|8sti,tacere|6sti,tangere|7sti,temere|6sti,temporeggiare|9eresti,tendere|7sti,tenere|2rresti,tergere|7sti,tessere|7sti,tingere|7sti,tinteggiare|7eresti,togliere|8sti,torcere|7sti,tracciare|5eresti,trafiggere|10sti,tralasciare|7eresti,tramettere|10sti,trangugiare|7eresti,transigere|10sti,trascendere|11sti,trascorrere|11sti,trascrivere|11sti,trasfondere|11sti,trasmettere|11sti,tratteggiare|8eresti,trattenere|6rresti,travolgere|10sti,troneggiare|7eresti,uccidere|8sti,ungere|6sti,urgere|6sti,vagheggiare|7eresti,valere|2rresti,vaneggiare|6eresti,veleggiare|6eresti,vendere|7sti,vengiare|4eresti,vergere|7sti,verniciare|6eresti,vertere|7sti,vetrioleggiare|10eresti,vezzeggiare|7eresti,viaggiare|5eresti,villeggiare|7eresti,vincere|7sti,vociare|3eresti,volere|2rresti,volgere|7sti,volteggiare|7eresti,volvere|7sti",
        "rev": "ndresti|2are,otresti|2ere,apresti|2ere,vresti|1ere,dresti|1ere,erresti|1nire,aresti|3,rresti|3,heresti|are,iresti|3,eresti|are"
      },
      "third": {
        "rules": "ompiere|4rebbe,nvivere|4rebbe,ecadere|4rebbe,lencare|4herebbe,otere|2rebbe,icadere|4rebbe,ivivere|4rebbe,esciare|3erebbe,tostare|7bbe,trafare|7bbe,rincare|4herebbe,ccadere|4rebbe,osciare|3erebbe,ingare|3herebbe,uciare|2erebbe,baciare|3erebbe,ulgare|3herebbe,olere|1rrebbe,manere|2rrebbe,sapere|3rebbe,usciare|3erebbe,parere|3rebbe,sfare|5bbe,ducere|2rrebbe,isciare|3erebbe,valere|2rrebbe,angare|3herebbe,rgare|2herebbe,ociare|2erebbe,efare|5bbe,lciare|2erebbe,iciare|2erebbe,vedere|3rebbe,asciare|3erebbe,rciare|2erebbe,ugare|2herebbe,ucare|2herebbe,acare|2herebbe,ecare|2herebbe,ancare|3herebbe,lcare|2herebbe,rcare|2herebbe,scare|2herebbe,tenere|2rrebbe,igare|2herebbe,venire|2rrebbe,agare|2herebbe,ocare|2herebbe,ogare|2herebbe,nciare|2erebbe,egare|2herebbe,cciare|2erebbe,ccare|2herebbe,rre|3bbe,icare|2herebbe,giare|1erebbe,ire|3bbe,ere|3bbe,are|erebbe",
        "exceptions": "andare|3rebbe,arrogere|&#8212;,avere|2rebbe,cadere|3rebbe,contraffare|11bbe,dare|4bbe,dovere|3rebbe,fare|4bbe,godere|3rebbe,prolungare|7herebbe,ridare|6bbe,rifare|6bbe,ristare|7bbe,sopraffare|10bbe,stare|5bbe,stroncare|6herebbe,teletrasmettere|8etterebbe,troncare|5herebbe,vivere|3rebbe,abbattere|9bbe,abbonacciare|8erebbe,abbracciare|7erebbe,abradere|8bbe,accartocciare|9erebbe,accasciare|6erebbe,accedere|8bbe,accendere|9bbe,accogliere|10bbe,acconciare|6erebbe,accondiscendere|15bbe,accorciare|6erebbe,accorrere|9bbe,accrescere|10bbe,adergere|8bbe,affacciare|6erebbe,affliggere|10bbe,afflosciare|7erebbe,affrangere|10bbe,agganciare|6erebbe,agghiacciare|8erebbe,aggiungere|10bbe,agiare|2erebbe,albeggiare|6erebbe,aleggiare|5erebbe,algere|6bbe,allacciare|6erebbe,alloggiare|6erebbe,alludere|8bbe,amareggiare|7erebbe,ambasciare|6erebbe,ammettere|9bbe,amoreggiare|7erebbe,ancheggiare|7erebbe,annettere|9bbe,annunciare|6erebbe,antecedere|10bbe,appartenere|7rrebbe,appendere|9bbe,appoggiare|6erebbe,apprendere|10bbe,approcciare|7erebbe,ardere|6bbe,arieggiare|6erebbe,armeggiare|6erebbe,arricciare|6erebbe,arridere|8bbe,ascendere|9bbe,ascondere|9bbe,ascrivere|9bbe,aspergere|9bbe,assaggiare|6erebbe,assidere|8bbe,assistere|9bbe,associare|5erebbe,assolvere|9bbe,assumere|8bbe,assurgere|9bbe,astenere|4rrebbe,astergere|9bbe,astringere|10bbe,atteggiare|6erebbe,attendere|9bbe,attenere|4rrebbe,attingere|9bbe,attorcere|9bbe,avvincere|9bbe,avvolgere|9bbe,baciare|3erebbe,battere|7bbe,beccheggiare|8erebbe,benedicere|10bbe,beneficiare|7erebbe,berciare|4erebbe,bigiare|3erebbe,bilanciare|6erebbe,bisticciare|7erebbe,boccheggiare|8erebbe,bocciare|4erebbe,borseggiare|7erebbe,bruciare|4erebbe,cacciare|4erebbe,calciare|4erebbe,campeggiare|7erebbe,cangiare|4erebbe,capeggiare|6erebbe,capitaneggiare|10erebbe,capovolgere|11bbe,cazzeggiare|7erebbe,cedere|6bbe,cernere|7bbe,cherere|7bbe,chiedere|8bbe,chierere|8bbe,chiocciare|6erebbe,chiudere|8bbe,cingere|7bbe,circoncidere|12bbe,circoscrivere|13bbe,ciucciare|5erebbe,clangere|8bbe,cogliere|8bbe,cognoscere|10bbe,coincidere|10bbe,collidere|9bbe,colludere|9bbe,combaciare|6erebbe,combattere|10bbe,cominciare|6erebbe,commettere|10bbe,competere|9bbe,compiacere|10bbe,compiangere|11bbe,compiere|5rebbe,comprendere|11bbe,comprimere|10bbe,compromettere|13bbe,compungere|10bbe,concedere|9bbe,concernere|10bbe,conciare|4erebbe,concludere|10bbe,concorrere|10bbe,confondere|10bbe,congiungere|11bbe,connettere|10bbe,conoscere|9bbe,consistere|10bbe,contagiare|6erebbe,conteggiare|7erebbe,contendere|10bbe,contenere|5rrebbe,contorcere|10bbe,contraddistinguere|18bbe,controbattere|13bbe,convergere|10bbe,convincere|10bbe,convolgere|10bbe,correggere|10bbe,correre|7bbe,corrispondere|13bbe,corrodere|9bbe,corrompere|10bbe,corteggiare|7erebbe,cospargere|10bbe,costeggiare|7erebbe,costringere|11bbe,credere|7bbe,crescere|8bbe,crocifiggere|12bbe,danneggiare|7erebbe,dardeggiare|7erebbe,decedere|8bbe,decidere|8bbe,decorrere|9bbe,decrescere|10bbe,defungere|9bbe,delinquere|10bbe,deludere|8bbe,deprimere|9bbe,deridere|8bbe,descrivere|10bbe,desistere|9bbe,destreggiare|8erebbe,desumere|8bbe,detenere|4rrebbe,detergere|9bbe,devolvere|9bbe,difendere|9bbe,diffondere|10bbe,diligere|8bbe,dimettere|9bbe,dipendere|9bbe,dipingere|9bbe,dirigere|8bbe,dirimere|8bbe,dirompere|9bbe,disattendere|12bbe,discendere|10bbe,discernere|10bbe,dischiudere|11bbe,disciogliere|12bbe,disconnettere|13bbe,disconoscere|12bbe,discorrere|10bbe,discutere|9bbe,disgiungere|11bbe,dismettere|10bbe,disperdere|10bbe,dispiacere|10bbe,dispregiare|7erebbe,dissociare|6erebbe,dissolvere|10bbe,dissuadere|10bbe,distendere|10bbe,distinguere|11bbe,distogliere|11bbe,distorcere|10bbe,distruggere|11bbe,divellere|9bbe,divergere|9bbe,dividere|8bbe,dolere|2rrebbe,ducere|2rrebbe,eccedere|8bbe,eccellere|9bbe,echeggiare|6erebbe,educere|3rrebbe,effigiare|5erebbe,effondere|9bbe,eleggere|8bbe,elidere|7bbe,elogiare|4erebbe,eludere|7bbe,emergere|8bbe,emettere|8bbe,enunciare|5erebbe,equipaggiare|8erebbe,equivalere|6rrebbe,ergere|6bbe,erigere|7bbe,erodere|7bbe,erompere|8bbe,escludere|9bbe,escutere|8bbe,esigere|7bbe,esistere|8bbe,espandere|9bbe,espellere|9bbe,esprimere|9bbe,espungere|9bbe,estendere|9bbe,estinguere|10bbe,estollere|9bbe,estorcere|9bbe,estrudere|9bbe,evadere|7bbe,evincere|8bbe,evolvere|8bbe,falciare|4erebbe,fasciare|4erebbe,favoreggiare|8erebbe,fendere|7bbe,fervere|7bbe,festeggiare|7erebbe,fiammeggiare|8erebbe,fiancheggiare|9erebbe,figgere|7bbe,fingere|7bbe,flettere|8bbe,foggiare|4erebbe,forgiare|4erebbe,fottere|7bbe,fraintendere|12bbe,frangere|8bbe,fregiare|4erebbe,fremere|7bbe,friggere|8bbe,fronteggiare|8erebbe,fulgere|7bbe,fungere|7bbe,galleggiare|7erebbe,gareggiare|6erebbe,gemere|6bbe,ghiacciare|6erebbe,giacere|7bbe,giungere|8bbe,gocciare|4erebbe,gorgheggiare|8erebbe,guerreggiare|8erebbe,illudere|8bbe,imbevere|8bbe,imbracciare|7erebbe,immergere|9bbe,immettere|9bbe,impacciare|6erebbe,imprendere|10bbe,imprimere|9bbe,incedere|8bbe,incendere|9bbe,incidere|8bbe,incingere|9bbe,includere|9bbe,incombere|9bbe,incominciare|8erebbe,incoraggiare|8erebbe,incorniciare|8erebbe,incorrere|9bbe,incrociare|6erebbe,incutere|8bbe,indietreggiare|10erebbe,indugiare|5erebbe,indulgere|9bbe,infiggere|9bbe,infliggere|10bbe,infondere|9bbe,infradiciare|8erebbe,infrangere|10bbe,ingaggiare|6erebbe,ingiungere|10bbe,inscrivere|10bbe,insistere|9bbe,insorgere|9bbe,insudiciare|7erebbe,intendere|9bbe,intercedere|11bbe,intercorrere|12bbe,interfacciare|9erebbe,interrompere|12bbe,intingere|9bbe,intralciare|7erebbe,intraprendere|13bbe,intrattenere|8rrebbe,intrecciare|7erebbe,intridere|9bbe,intromettere|12bbe,intrudere|9bbe,invadere|8bbe,invalere|4rrebbe,involgere|9bbe,irridere|8bbe,irrompere|9bbe,iscrivere|9bbe,lampeggiare|7erebbe,lanciare|4erebbe,lasciare|4erebbe,ledere|6bbe,leggere|7bbe,licere|6bbe,linciare|4erebbe,lisciare|4erebbe,maneggiare|6erebbe,mangiare|4erebbe,manomettere|11bbe,mantenere|5rrebbe,manutenere|6rrebbe,marciare|4erebbe,massaggiare|7erebbe,mercanteggiare|10erebbe,mergere|7bbe,mescere|7bbe,mettere|7bbe,mietere|7bbe,minacciare|6erebbe,mingere|7bbe,mordere|7bbe,mungere|7bbe,nascere|7bbe,nascondere|10bbe,negligere|9bbe,noleggiare|6erebbe,occhieggiare|8erebbe,occidere|8bbe,occludere|9bbe,occorrere|9bbe,offendere|9bbe,officiare|5erebbe,oltraggiare|7erebbe,ombreggiare|7erebbe,omettere|8bbe,ondeggiare|6erebbe,opprimere|9bbe,ormeggiare|6erebbe,osteggiare|6erebbe,ottenere|4rrebbe,ottundere|9bbe,padroneggiare|9erebbe,palleggiare|7erebbe,parcheggiare|8erebbe,pareggiare|6erebbe,parere|3rebbe,pascere|7bbe,passeggiare|7erebbe,patteggiare|7erebbe,pendere|7bbe,percorrere|10bbe,perdere|7bbe,permanere|5rrebbe,permettere|10bbe,persistere|10bbe,persuadere|10bbe,pertenere|5rrebbe,pervadere|9bbe,pettegoleggiare|11erebbe,piacere|7bbe,piacevoleggiare|11erebbe,piaggiare|5erebbe,pianeggiare|7erebbe,piangere|8bbe,pigiare|3erebbe,piovere|7bbe,pisciare|4erebbe,plagiare|4erebbe,poggiare|4erebbe,porgere|7bbe,porporeggiare|9erebbe,portendere|10bbe,posteggiare|7erebbe,precedere|9bbe,precidere|9bbe,precludere|10bbe,precorrere|10bbe,prediligere|11bbe,prefiggere|10bbe,pregiare|4erebbe,premere|7bbe,premettere|10bbe,prenascere|10bbe,prendere|8bbe,prescegliere|12bbe,prescrivere|11bbe,presumere|9bbe,pretendere|10bbe,prevalere|5rrebbe,primeggiare|7erebbe,privilegiare|8erebbe,procedere|9bbe,profondere|10bbe,promettere|10bbe,pronunciare|7erebbe,propellere|10bbe,propendere|10bbe,prorompere|10bbe,proteggere|10bbe,protendere|10bbe,prudere|7bbe,pungere|7bbe,punteggiare|7erebbe,racchiudere|11bbe,raccogliere|11bbe,raccorciare|7erebbe,radere|6bbe,raggiare|4erebbe,raggiungere|11bbe,rapprendere|11bbe,recedere|8bbe,recidere|8bbe,recingere|9bbe,recludere|9bbe,redigere|8bbe,redimere|8bbe,reggere|7bbe,rendere|7bbe,repellere|9bbe,reprimere|9bbe,rescindere|10bbe,resistere|9bbe,respingere|10bbe,restringere|11bbe,retrocedere|11bbe,riabbracciare|9erebbe,riaccendere|11bbe,riagganciare|8erebbe,riallacciare|8erebbe,riappendere|11bbe,riardere|8bbe,riassumere|10bbe,riavvolgere|11bbe,ribattere|9bbe,ricacciare|6erebbe,ricedere|8bbe,ricevere|8bbe,richiedere|10bbe,ricogliere|10bbe,ricominciare|8erebbe,ricongiungere|13bbe,riconoscere|11bbe,ricorrere|9bbe,ricredere|9bbe,ricrescere|10bbe,ridere|6bbe,ridipingere|11bbe,riducere|4rrebbe,riecheggiare|8erebbe,rieleggere|10bbe,riflettere|10bbe,rifulgere|9bbe,rilanciare|6erebbe,rilasciare|6erebbe,rileggere|9bbe,rimanere|4rrebbe,rimangiare|6erebbe,rimettere|9bbe,rimordere|9bbe,rinascere|9bbe,rinchiudere|11bbe,rincominciare|9erebbe,rincrescere|11bbe,rinunciare|6erebbe,ripetere|8bbe,ripiovere|9bbe,riprendere|10bbe,riscrivere|10bbe,risiedere|9bbe,risolvere|9bbe,risorgere|9bbe,rispingere|10bbe,risplendere|11bbe,rispondere|10bbe,ristringere|11bbe,ritenere|4rrebbe,ritorcere|9bbe,ritrasmettere|13bbe,rivaleggiare|8erebbe,rivendere|9bbe,rivincere|9bbe,rivolgere|9bbe,rivolvere|9bbe,rompere|7bbe,rovesciare|6erebbe,rumoreggiare|8erebbe,saccheggiare|8erebbe,saggiare|4erebbe,sbattere|8bbe,sbilanciare|7erebbe,sbirciare|5erebbe,sbocciare|5erebbe,sbucciare|5erebbe,scacciare|5erebbe,scadere|7bbe,scalciare|5erebbe,scarseggiare|8erebbe,scegliere|9bbe,scendere|8bbe,sceneggiare|7erebbe,scernere|8bbe,scheggiare|6erebbe,schiacciare|7erebbe,schiaffeggiare|10erebbe,schiudere|9bbe,scindere|8bbe,sciogliere|10bbe,scocciare|5erebbe,scommettere|11bbe,sconfiggere|11bbe,sconnettere|11bbe,sconoscere|10bbe,sconvolgere|11bbe,scoraggiare|7erebbe,scorciare|5erebbe,scoreggiare|7erebbe,scorgere|8bbe,scorrere|8bbe,scortecciare|8erebbe,scoscendere|11bbe,scrivere|8bbe,scrosciare|6erebbe,sculacciare|7erebbe,secernere|9bbe,selciare|4erebbe,serpeggiare|7erebbe,setacciare|6erebbe,sfasciare|5erebbe,sfiduciare|6erebbe,sfociare|4erebbe,sfottere|8bbe,sfrecciare|6erebbe,sfregiare|5erebbe,sganciare|5erebbe,sgusciare|5erebbe,simboleggiare|9erebbe,slacciare|5erebbe,slanciare|5erebbe,smettere|8bbe,socchiudere|11bbe,soccombere|10bbe,soccorrere|10bbe,soffriggere|11bbe,soggiacere|10bbe,soggiungere|11bbe,soleggiare|6erebbe,solvere|7bbe,sommergere|10bbe,sommettere|10bbe,sopprimere|10bbe,sopraggiungere|14bbe,sopravvivere|12bbe,soprintendere|13bbe,sorgere|7bbe,sorprendere|11bbe,sorreggere|10bbe,sorridere|9bbe,sorseggiare|7erebbe,sorteggiare|7erebbe,sospendere|10bbe,sospingere|10bbe,sostenere|5rrebbe,sottacere|9bbe,sottendere|10bbe,sottintendere|13bbe,sottomettere|12bbe,sottoscrivere|13bbe,sovrintendere|13bbe,spacciare|5erebbe,spalleggiare|8erebbe,spandere|8bbe,sparere|4rebbe,spargere|8bbe,spegnere|8bbe,spendere|8bbe,spergere|8bbe,spiaggiare|6erebbe,spingere|8bbe,spiovere|8bbe,splendere|9bbe,sporgere|8bbe,spregiare|5erebbe,spremere|8bbe,squarciare|6erebbe,stacciare|5erebbe,stendere|8bbe,stingere|8bbe,storcere|8bbe,stracciare|6erebbe,stravincere|11bbe,stravolgere|11bbe,stridere|8bbe,stringere|9bbe,strisciare|6erebbe,struggere|9bbe,strusciare|6erebbe,succedere|9bbe,suddividere|11bbe,sumere|6bbe,sunteggiare|7erebbe,sussistere|10bbe,svaligiare|6erebbe,svellere|8bbe,svendere|8bbe,svolgere|8bbe,tacere|6bbe,tangere|7bbe,temere|6bbe,temporeggiare|9erebbe,tendere|7bbe,tenere|2rrebbe,tergere|7bbe,tessere|7bbe,tingere|7bbe,tinteggiare|7erebbe,togliere|8bbe,torcere|7bbe,tracciare|5erebbe,trafiggere|10bbe,tralasciare|7erebbe,tramettere|10bbe,trangugiare|7erebbe,transigere|10bbe,trascendere|11bbe,trascorrere|11bbe,trascrivere|11bbe,trasfondere|11bbe,trasmettere|11bbe,tratteggiare|8erebbe,trattenere|6rrebbe,travolgere|10bbe,troneggiare|7erebbe,uccidere|8bbe,ungere|6bbe,urgere|6bbe,vagheggiare|7erebbe,valere|2rrebbe,vaneggiare|6erebbe,veleggiare|6erebbe,vendere|7bbe,vengiare|4erebbe,vergere|7bbe,verniciare|6erebbe,vertere|7bbe,vetrioleggiare|10erebbe,vezzeggiare|7erebbe,viaggiare|5erebbe,villeggiare|7erebbe,vincere|7bbe,vociare|3erebbe,volere|2rrebbe,volgere|7bbe,volteggiare|7erebbe,volvere|7bbe",
        "rev": "ndrebbe|2are,otrebbe|2ere,aprebbe|2ere,vrebbe|1ere,drebbe|1ere,errebbe|1nire,arebbe|3,rrebbe|3,herebbe|are,irebbe|3,erebbe|are"
      },
      "firstPlural": {
        "rules": "ompiere|4remmo,ecadere|4remmo,overe|2remmo,lencare|4heremmo,otere|2remmo,icadere|4remmo,esciare|3eremmo,tostare|7mmo,trafare|7mmo,rincare|4heremmo,osciare|3eremmo,ingare|3heremmo,uciare|2eremmo,baciare|3eremmo,ulgare|3heremmo,olere|1rremmo,manere|2rremmo,sapere|3remmo,usciare|3eremmo,parere|3remmo,sfare|5mmo,ducere|2rremmo,isciare|3eremmo,vivere|3remmo,valere|2rremmo,angare|3heremmo,rgare|2heremmo,ociare|2eremmo,efare|5mmo,lciare|2eremmo,iciare|2eremmo,vedere|3remmo,asciare|3eremmo,rciare|2eremmo,ugare|2heremmo,ucare|2heremmo,acare|2heremmo,ecare|2heremmo,ancare|3heremmo,lcare|2heremmo,rcare|2heremmo,scare|2heremmo,tenere|2rremmo,igare|2heremmo,venire|2rremmo,agare|2heremmo,ocare|2heremmo,ogare|2heremmo,nciare|2eremmo,egare|2heremmo,cciare|2eremmo,ccare|2heremmo,rre|3mmo,icare|2heremmo,giare|1eremmo,ire|3mmo,ere|3mmo,are|eremmo",
        "exceptions": "accadere|&#8212;,andare|3remmo,avere|2remmo,cadere|3remmo,contraffare|11mmo,dare|4mmo,fare|4mmo,godere|3remmo,prolungare|7heremmo,ridare|6mmo,rifare|6mmo,ristare|7mmo,sopraffare|10mmo,stare|5mmo,stroncare|6heremmo,teletrasmettere|8etteremmo,troncare|5heremmo,abbattere|9mmo,abbonacciare|8eremmo,abbracciare|7eremmo,abradere|8mmo,accartocciare|9eremmo,accasciare|6eremmo,accedere|8mmo,accendere|9mmo,accogliere|10mmo,acconciare|6eremmo,accondiscendere|15mmo,accorciare|6eremmo,accorrere|9mmo,accrescere|10mmo,adergere|8mmo,affacciare|6eremmo,affliggere|10mmo,afflosciare|7eremmo,affrangere|10mmo,agganciare|6eremmo,agghiacciare|8eremmo,aggiungere|10mmo,agiare|2eremmo,albeggiare|6eremmo,aleggiare|5eremmo,algere|6mmo,allacciare|6eremmo,alloggiare|6eremmo,alludere|8mmo,amareggiare|7eremmo,ambasciare|6eremmo,ammettere|9mmo,amoreggiare|7eremmo,ancheggiare|7eremmo,annettere|9mmo,annunciare|6eremmo,antecedere|10mmo,appartenere|7rremmo,appendere|9mmo,appoggiare|6eremmo,apprendere|10mmo,approcciare|7eremmo,ardere|6mmo,arieggiare|6eremmo,armeggiare|6eremmo,arricciare|6eremmo,arridere|8mmo,ascendere|9mmo,ascondere|9mmo,ascrivere|9mmo,aspergere|9mmo,assaggiare|6eremmo,assidere|8mmo,assistere|9mmo,associare|5eremmo,assolvere|9mmo,assumere|8mmo,assurgere|9mmo,astenere|4rremmo,astergere|9mmo,astringere|10mmo,atteggiare|6eremmo,attendere|9mmo,attenere|4rremmo,attingere|9mmo,attorcere|9mmo,avvincere|9mmo,avvolgere|9mmo,baciare|3eremmo,battere|7mmo,beccheggiare|8eremmo,benedicere|10mmo,beneficiare|7eremmo,berciare|4eremmo,bigiare|3eremmo,bilanciare|6eremmo,bisticciare|7eremmo,boccheggiare|8eremmo,bocciare|4eremmo,borseggiare|7eremmo,bruciare|4eremmo,cacciare|4eremmo,calciare|4eremmo,campeggiare|7eremmo,cangiare|4eremmo,capeggiare|6eremmo,capitaneggiare|10eremmo,capovolgere|11mmo,cazzeggiare|7eremmo,cedere|6mmo,cernere|7mmo,cherere|7mmo,chiedere|8mmo,chierere|8mmo,chiocciare|6eremmo,chiudere|8mmo,cingere|7mmo,circoncidere|12mmo,circoscrivere|13mmo,ciucciare|5eremmo,clangere|8mmo,cogliere|8mmo,cognoscere|10mmo,coincidere|10mmo,collidere|9mmo,colludere|9mmo,combaciare|6eremmo,combattere|10mmo,cominciare|6eremmo,commettere|10mmo,competere|9mmo,compiacere|10mmo,compiangere|11mmo,compiere|5remmo,comprendere|11mmo,comprimere|10mmo,compromettere|13mmo,compungere|10mmo,concedere|9mmo,concernere|10mmo,conciare|4eremmo,concludere|10mmo,concorrere|10mmo,confondere|10mmo,congiungere|11mmo,connettere|10mmo,conoscere|9mmo,consistere|10mmo,contagiare|6eremmo,conteggiare|7eremmo,contendere|10mmo,contenere|5rremmo,contorcere|10mmo,contraddistinguere|18mmo,controbattere|13mmo,convergere|10mmo,convincere|10mmo,convolgere|10mmo,correggere|10mmo,correre|7mmo,corrispondere|13mmo,corrodere|9mmo,corrompere|10mmo,corteggiare|7eremmo,cospargere|10mmo,costeggiare|7eremmo,costringere|11mmo,credere|7mmo,crescere|8mmo,crocifiggere|12mmo,danneggiare|7eremmo,dardeggiare|7eremmo,decedere|8mmo,decidere|8mmo,decorrere|9mmo,decrescere|10mmo,defungere|9mmo,delinquere|10mmo,deludere|8mmo,deprimere|9mmo,deridere|8mmo,descrivere|10mmo,desistere|9mmo,destreggiare|8eremmo,desumere|8mmo,detenere|4rremmo,detergere|9mmo,devolvere|9mmo,difendere|9mmo,diffondere|10mmo,diligere|8mmo,dimettere|9mmo,dipendere|9mmo,dipingere|9mmo,dirigere|8mmo,dirimere|8mmo,dirompere|9mmo,disattendere|12mmo,discendere|10mmo,discernere|10mmo,dischiudere|11mmo,disciogliere|12mmo,disconnettere|13mmo,disconoscere|12mmo,discorrere|10mmo,discutere|9mmo,disgiungere|11mmo,dismettere|10mmo,disperdere|10mmo,dispiacere|10mmo,dispregiare|7eremmo,dissociare|6eremmo,dissolvere|10mmo,dissuadere|10mmo,distendere|10mmo,distinguere|11mmo,distogliere|11mmo,distorcere|10mmo,distruggere|11mmo,divellere|9mmo,divergere|9mmo,dividere|8mmo,dolere|2rremmo,ducere|2rremmo,eccedere|8mmo,eccellere|9mmo,echeggiare|6eremmo,educere|3rremmo,effigiare|5eremmo,effondere|9mmo,eleggere|8mmo,elidere|7mmo,elogiare|4eremmo,eludere|7mmo,emergere|8mmo,emettere|8mmo,enunciare|5eremmo,equipaggiare|8eremmo,equivalere|6rremmo,ergere|6mmo,erigere|7mmo,erodere|7mmo,erompere|8mmo,escludere|9mmo,escutere|8mmo,esigere|7mmo,esistere|8mmo,espandere|9mmo,espellere|9mmo,esprimere|9mmo,espungere|9mmo,estendere|9mmo,estinguere|10mmo,estollere|9mmo,estorcere|9mmo,estrudere|9mmo,evadere|7mmo,evincere|8mmo,evolvere|8mmo,falciare|4eremmo,fasciare|4eremmo,favoreggiare|8eremmo,fendere|7mmo,fervere|7mmo,festeggiare|7eremmo,fiammeggiare|8eremmo,fiancheggiare|9eremmo,figgere|7mmo,fingere|7mmo,flettere|8mmo,foggiare|4eremmo,forgiare|4eremmo,fottere|7mmo,fraintendere|12mmo,frangere|8mmo,fregiare|4eremmo,fremere|7mmo,friggere|8mmo,fronteggiare|8eremmo,fulgere|7mmo,fungere|7mmo,galleggiare|7eremmo,gareggiare|6eremmo,gemere|6mmo,ghiacciare|6eremmo,giacere|7mmo,giungere|8mmo,gocciare|4eremmo,gorgheggiare|8eremmo,guerreggiare|8eremmo,illudere|8mmo,imbevere|8mmo,imbracciare|7eremmo,immergere|9mmo,immettere|9mmo,impacciare|6eremmo,imprendere|10mmo,imprimere|9mmo,incedere|8mmo,incendere|9mmo,incidere|8mmo,incingere|9mmo,includere|9mmo,incombere|9mmo,incominciare|8eremmo,incoraggiare|8eremmo,incorniciare|8eremmo,incorrere|9mmo,incrociare|6eremmo,incutere|8mmo,indietreggiare|10eremmo,indugiare|5eremmo,indulgere|9mmo,infiggere|9mmo,infliggere|10mmo,infondere|9mmo,infradiciare|8eremmo,infrangere|10mmo,ingaggiare|6eremmo,ingiungere|10mmo,inscrivere|10mmo,insistere|9mmo,insorgere|9mmo,insudiciare|7eremmo,intendere|9mmo,intercedere|11mmo,intercorrere|12mmo,interfacciare|9eremmo,interrompere|12mmo,intingere|9mmo,intralciare|7eremmo,intraprendere|13mmo,intrattenere|8rremmo,intrecciare|7eremmo,intridere|9mmo,intromettere|12mmo,intrudere|9mmo,invadere|8mmo,invalere|4rremmo,involgere|9mmo,irridere|8mmo,irrompere|9mmo,iscrivere|9mmo,lampeggiare|7eremmo,lanciare|4eremmo,lasciare|4eremmo,ledere|6mmo,leggere|7mmo,licere|6mmo,linciare|4eremmo,lisciare|4eremmo,maneggiare|6eremmo,mangiare|4eremmo,manomettere|11mmo,mantenere|5rremmo,manutenere|6rremmo,marciare|4eremmo,massaggiare|7eremmo,mercanteggiare|10eremmo,mergere|7mmo,mescere|7mmo,mettere|7mmo,mietere|7mmo,minacciare|6eremmo,mingere|7mmo,mordere|7mmo,mungere|7mmo,nascere|7mmo,nascondere|10mmo,negligere|9mmo,noleggiare|6eremmo,occhieggiare|8eremmo,occidere|8mmo,occludere|9mmo,occorrere|9mmo,offendere|9mmo,officiare|5eremmo,oltraggiare|7eremmo,ombreggiare|7eremmo,omettere|8mmo,ondeggiare|6eremmo,opprimere|9mmo,ormeggiare|6eremmo,osteggiare|6eremmo,ottenere|4rremmo,ottundere|9mmo,padroneggiare|9eremmo,palleggiare|7eremmo,parcheggiare|8eremmo,pareggiare|6eremmo,parere|3remmo,pascere|7mmo,passeggiare|7eremmo,patteggiare|7eremmo,pendere|7mmo,percorrere|10mmo,perdere|7mmo,permanere|5rremmo,permettere|10mmo,persistere|10mmo,persuadere|10mmo,pertenere|5rremmo,pervadere|9mmo,pettegoleggiare|11eremmo,piacere|7mmo,piacevoleggiare|11eremmo,piaggiare|5eremmo,pianeggiare|7eremmo,piangere|8mmo,pigiare|3eremmo,pisciare|4eremmo,plagiare|4eremmo,poggiare|4eremmo,porgere|7mmo,porporeggiare|9eremmo,portendere|10mmo,posteggiare|7eremmo,precedere|9mmo,precidere|9mmo,precludere|10mmo,precorrere|10mmo,prediligere|11mmo,prefiggere|10mmo,pregiare|4eremmo,premere|7mmo,premettere|10mmo,prenascere|10mmo,prendere|8mmo,prescegliere|12mmo,prescrivere|11mmo,presumere|9mmo,pretendere|10mmo,prevalere|5rremmo,primeggiare|7eremmo,privilegiare|8eremmo,procedere|9mmo,profondere|10mmo,promettere|10mmo,pronunciare|7eremmo,propellere|10mmo,propendere|10mmo,prorompere|10mmo,proteggere|10mmo,protendere|10mmo,prudere|7mmo,pungere|7mmo,punteggiare|7eremmo,racchiudere|11mmo,raccogliere|11mmo,raccorciare|7eremmo,radere|6mmo,raggiare|4eremmo,raggiungere|11mmo,rapprendere|11mmo,recedere|8mmo,recidere|8mmo,recingere|9mmo,recludere|9mmo,redigere|8mmo,redimere|8mmo,reggere|7mmo,rendere|7mmo,repellere|9mmo,reprimere|9mmo,rescindere|10mmo,resistere|9mmo,respingere|10mmo,restringere|11mmo,retrocedere|11mmo,riabbracciare|9eremmo,riaccendere|11mmo,riagganciare|8eremmo,riallacciare|8eremmo,riappendere|11mmo,riardere|8mmo,riassumere|10mmo,riavvolgere|11mmo,ribattere|9mmo,ricacciare|6eremmo,ricedere|8mmo,ricevere|8mmo,richiedere|10mmo,ricogliere|10mmo,ricominciare|8eremmo,ricongiungere|13mmo,riconoscere|11mmo,ricorrere|9mmo,ricredere|9mmo,ricrescere|10mmo,ridere|6mmo,ridipingere|11mmo,riducere|4rremmo,riecheggiare|8eremmo,rieleggere|10mmo,riflettere|10mmo,rifulgere|9mmo,rilanciare|6eremmo,rilasciare|6eremmo,rileggere|9mmo,rimanere|4rremmo,rimangiare|6eremmo,rimettere|9mmo,rimordere|9mmo,rinascere|9mmo,rinchiudere|11mmo,rincominciare|9eremmo,rincrescere|11mmo,rinunciare|6eremmo,ripetere|8mmo,riprendere|10mmo,riscrivere|10mmo,risiedere|9mmo,risolvere|9mmo,risorgere|9mmo,rispingere|10mmo,risplendere|11mmo,rispondere|10mmo,ristringere|11mmo,ritenere|4rremmo,ritorcere|9mmo,ritrasmettere|13mmo,rivaleggiare|8eremmo,rivendere|9mmo,rivincere|9mmo,rivolgere|9mmo,rivolvere|9mmo,rompere|7mmo,rovesciare|6eremmo,rumoreggiare|8eremmo,saccheggiare|8eremmo,saggiare|4eremmo,sbattere|8mmo,sbilanciare|7eremmo,sbirciare|5eremmo,sbocciare|5eremmo,sbucciare|5eremmo,scacciare|5eremmo,scadere|7mmo,scalciare|5eremmo,scarseggiare|8eremmo,scegliere|9mmo,scendere|8mmo,sceneggiare|7eremmo,scernere|8mmo,scheggiare|6eremmo,schiacciare|7eremmo,schiaffeggiare|10eremmo,schiudere|9mmo,scindere|8mmo,sciogliere|10mmo,scocciare|5eremmo,scommettere|11mmo,sconfiggere|11mmo,sconnettere|11mmo,sconoscere|10mmo,sconvolgere|11mmo,scoraggiare|7eremmo,scorciare|5eremmo,scoreggiare|7eremmo,scorgere|8mmo,scorrere|8mmo,scortecciare|8eremmo,scoscendere|11mmo,scrivere|8mmo,scrosciare|6eremmo,sculacciare|7eremmo,secernere|9mmo,selciare|4eremmo,serpeggiare|7eremmo,setacciare|6eremmo,sfasciare|5eremmo,sfiduciare|6eremmo,sfociare|4eremmo,sfottere|8mmo,sfrecciare|6eremmo,sfregiare|5eremmo,sganciare|5eremmo,sgusciare|5eremmo,simboleggiare|9eremmo,slacciare|5eremmo,slanciare|5eremmo,smettere|8mmo,socchiudere|11mmo,soccombere|10mmo,soccorrere|10mmo,soffriggere|11mmo,soggiacere|10mmo,soggiungere|11mmo,soleggiare|6eremmo,solvere|7mmo,sommergere|10mmo,sommettere|10mmo,sopprimere|10mmo,sopraggiungere|14mmo,soprintendere|13mmo,sorgere|7mmo,sorprendere|11mmo,sorreggere|10mmo,sorridere|9mmo,sorseggiare|7eremmo,sorteggiare|7eremmo,sospendere|10mmo,sospingere|10mmo,sostenere|5rremmo,sottacere|9mmo,sottendere|10mmo,sottintendere|13mmo,sottomettere|12mmo,sottoscrivere|13mmo,sovrintendere|13mmo,spacciare|5eremmo,spalleggiare|8eremmo,spandere|8mmo,sparere|4remmo,spargere|8mmo,spegnere|8mmo,spendere|8mmo,spergere|8mmo,spiaggiare|6eremmo,spingere|8mmo,splendere|9mmo,sporgere|8mmo,spregiare|5eremmo,spremere|8mmo,squarciare|6eremmo,stacciare|5eremmo,stendere|8mmo,stingere|8mmo,storcere|8mmo,stracciare|6eremmo,stravincere|11mmo,stravolgere|11mmo,stridere|8mmo,stringere|9mmo,strisciare|6eremmo,struggere|9mmo,strusciare|6eremmo,succedere|9mmo,suddividere|11mmo,sumere|6mmo,sunteggiare|7eremmo,sussistere|10mmo,svaligiare|6eremmo,svellere|8mmo,svendere|8mmo,svolgere|8mmo,tacere|6mmo,tangere|7mmo,temere|6mmo,temporeggiare|9eremmo,tendere|7mmo,tenere|2rremmo,tergere|7mmo,tessere|7mmo,tingere|7mmo,tinteggiare|7eremmo,togliere|8mmo,torcere|7mmo,tracciare|5eremmo,trafiggere|10mmo,tralasciare|7eremmo,tramettere|10mmo,trangugiare|7eremmo,transigere|10mmo,trascendere|11mmo,trascorrere|11mmo,trascrivere|11mmo,trasfondere|11mmo,trasmettere|11mmo,tratteggiare|8eremmo,trattenere|6rremmo,travolgere|10mmo,troneggiare|7eremmo,uccidere|8mmo,ungere|6mmo,urgere|6mmo,vagheggiare|7eremmo,valere|2rremmo,vaneggiare|6eremmo,veleggiare|6eremmo,vendere|7mmo,vengiare|4eremmo,vergere|7mmo,verniciare|6eremmo,vertere|7mmo,vetrioleggiare|10eremmo,vezzeggiare|7eremmo,viaggiare|5eremmo,villeggiare|7eremmo,vincere|7mmo,vociare|3eremmo,volere|2rremmo,volgere|7mmo,volteggiare|7eremmo,volvere|7mmo",
        "rev": "ndremmo|2are,otremmo|2ere,apremmo|2ere,vremmo|1ere,dremmo|1ere,erremmo|1nire,aremmo|3,rremmo|3,heremmo|are,iremmo|3,eremmo|are"
      },
      "secondPlural": {
        "rules": "ompiere|4reste,ecadere|4reste,overe|2reste,lencare|4hereste,otere|2reste,icadere|4reste,esciare|3ereste,tostare|7ste,trafare|7ste,rincare|4hereste,osciare|3ereste,ingare|3hereste,uciare|2ereste,baciare|3ereste,ulgare|3hereste,olere|1rreste,manere|2rreste,sapere|3reste,usciare|3ereste,parere|3reste,sfare|5ste,ducere|2rreste,isciare|3ereste,vivere|3reste,valere|2rreste,angare|3hereste,rgare|2hereste,ociare|2ereste,efare|5ste,lciare|2ereste,iciare|2ereste,vedere|3reste,asciare|3ereste,rciare|2ereste,ugare|2hereste,ucare|2hereste,acare|2hereste,ecare|2hereste,ancare|3hereste,lcare|2hereste,rcare|2hereste,scare|2hereste,tenere|2rreste,igare|2hereste,venire|2rreste,agare|2hereste,ocare|2hereste,ogare|2hereste,nciare|2ereste,egare|2hereste,cciare|2ereste,ccare|2hereste,rre|3ste,icare|2hereste,giare|1ereste,ire|3ste,ere|3ste,are|ereste",
        "exceptions": "accadere|&#8212;,andare|3reste,avere|2reste,cadere|3reste,contraffare|11ste,dare|4ste,fare|4ste,godere|3reste,prolungare|7hereste,ridare|6ste,rifare|6ste,ristare|7ste,sopraffare|10ste,stare|5ste,stroncare|6hereste,teletrasmettere|8ettereste,troncare|5hereste,abbattere|9ste,abbonacciare|8ereste,abbracciare|7ereste,abradere|8ste,accartocciare|9ereste,accasciare|6ereste,accedere|8ste,accendere|9ste,accogliere|10ste,acconciare|6ereste,accondiscendere|15ste,accorciare|6ereste,accorrere|9ste,accrescere|10ste,adergere|8ste,affacciare|6ereste,affliggere|10ste,afflosciare|7ereste,affrangere|10ste,agganciare|6ereste,agghiacciare|8ereste,aggiungere|10ste,agiare|2ereste,albeggiare|6ereste,aleggiare|5ereste,algere|6ste,allacciare|6ereste,alloggiare|6ereste,alludere|8ste,amareggiare|7ereste,ambasciare|6ereste,ammettere|9ste,amoreggiare|7ereste,ancheggiare|7ereste,annettere|9ste,annunciare|6ereste,antecedere|10ste,appartenere|7rreste,appendere|9ste,appoggiare|6ereste,apprendere|10ste,approcciare|7ereste,ardere|6ste,arieggiare|6ereste,armeggiare|6ereste,arricciare|6ereste,arridere|8ste,ascendere|9ste,ascondere|9ste,ascrivere|9ste,aspergere|9ste,assaggiare|6ereste,assidere|8ste,assistere|9ste,associare|5ereste,assolvere|9ste,assumere|8ste,assurgere|9ste,astenere|4rreste,astergere|9ste,astringere|10ste,atteggiare|6ereste,attendere|9ste,attenere|4rreste,attingere|9ste,attorcere|9ste,avvincere|9ste,avvolgere|9ste,baciare|3ereste,battere|7ste,beccheggiare|8ereste,benedicere|10ste,beneficiare|7ereste,berciare|4ereste,bigiare|3ereste,bilanciare|6ereste,bisticciare|7ereste,boccheggiare|8ereste,bocciare|4ereste,borseggiare|7ereste,bruciare|4ereste,cacciare|4ereste,calciare|4ereste,campeggiare|7ereste,cangiare|4ereste,capeggiare|6ereste,capitaneggiare|10ereste,capovolgere|11ste,cazzeggiare|7ereste,cedere|6ste,cernere|7ste,cherere|7ste,chiedere|8ste,chierere|8ste,chiocciare|6ereste,chiudere|8ste,cingere|7ste,circoncidere|12ste,circoscrivere|13ste,ciucciare|5ereste,clangere|8ste,cogliere|8ste,cognoscere|10ste,coincidere|10ste,collidere|9ste,colludere|9ste,combaciare|6ereste,combattere|10ste,cominciare|6ereste,commettere|10ste,competere|9ste,compiacere|10ste,compiangere|11ste,compiere|5reste,comprendere|11ste,comprimere|10ste,compromettere|13ste,compungere|10ste,concedere|9ste,concernere|10ste,conciare|4ereste,concludere|10ste,concorrere|10ste,confondere|10ste,congiungere|11ste,connettere|10ste,conoscere|9ste,consistere|10ste,contagiare|6ereste,conteggiare|7ereste,contendere|10ste,contenere|5rreste,contorcere|10ste,contraddistinguere|18ste,controbattere|13ste,convergere|10ste,convincere|10ste,convolgere|10ste,correggere|10ste,correre|7ste,corrispondere|13ste,corrodere|9ste,corrompere|10ste,corteggiare|7ereste,cospargere|10ste,costeggiare|7ereste,costringere|11ste,credere|7ste,crescere|8ste,crocifiggere|12ste,danneggiare|7ereste,dardeggiare|7ereste,decedere|8ste,decidere|8ste,decorrere|9ste,decrescere|10ste,defungere|9ste,delinquere|10ste,deludere|8ste,deprimere|9ste,deridere|8ste,descrivere|10ste,desistere|9ste,destreggiare|8ereste,desumere|8ste,detenere|4rreste,detergere|9ste,devolvere|9ste,difendere|9ste,diffondere|10ste,diligere|8ste,dimettere|9ste,dipendere|9ste,dipingere|9ste,dirigere|8ste,dirimere|8ste,dirompere|9ste,disattendere|12ste,discendere|10ste,discernere|10ste,dischiudere|11ste,disciogliere|12ste,disconnettere|13ste,disconoscere|12ste,discorrere|10ste,discutere|9ste,disgiungere|11ste,dismettere|10ste,disperdere|10ste,dispiacere|10ste,dispregiare|7ereste,dissociare|6ereste,dissolvere|10ste,dissuadere|10ste,distendere|10ste,distinguere|11ste,distogliere|11ste,distorcere|10ste,distruggere|11ste,divellere|9ste,divergere|9ste,dividere|8ste,dolere|2rreste,ducere|2rreste,eccedere|8ste,eccellere|9ste,echeggiare|6ereste,educere|3rreste,effigiare|5ereste,effondere|9ste,eleggere|8ste,elidere|7ste,elogiare|4ereste,eludere|7ste,emergere|8ste,emettere|8ste,enunciare|5ereste,equipaggiare|8ereste,equivalere|6rreste,ergere|6ste,erigere|7ste,erodere|7ste,erompere|8ste,escludere|9ste,escutere|8ste,esigere|7ste,esistere|8ste,espandere|9ste,espellere|9ste,esprimere|9ste,espungere|9ste,estendere|9ste,estinguere|10ste,estollere|9ste,estorcere|9ste,estrudere|9ste,evadere|7ste,evincere|8ste,evolvere|8ste,falciare|4ereste,fasciare|4ereste,favoreggiare|8ereste,fendere|7ste,fervere|7ste,festeggiare|7ereste,fiammeggiare|8ereste,fiancheggiare|9ereste,figgere|7ste,fingere|7ste,flettere|8ste,foggiare|4ereste,forgiare|4ereste,fottere|7ste,fraintendere|12ste,frangere|8ste,fregiare|4ereste,fremere|7ste,friggere|8ste,fronteggiare|8ereste,fulgere|7ste,fungere|7ste,galleggiare|7ereste,gareggiare|6ereste,gemere|6ste,ghiacciare|6ereste,giacere|7ste,giungere|8ste,gocciare|4ereste,gorgheggiare|8ereste,guerreggiare|8ereste,illudere|8ste,imbevere|8ste,imbracciare|7ereste,immergere|9ste,immettere|9ste,impacciare|6ereste,imprendere|10ste,imprimere|9ste,incedere|8ste,incendere|9ste,incidere|8ste,incingere|9ste,includere|9ste,incombere|9ste,incominciare|8ereste,incoraggiare|8ereste,incorniciare|8ereste,incorrere|9ste,incrociare|6ereste,incutere|8ste,indietreggiare|10ereste,indugiare|5ereste,indulgere|9ste,infiggere|9ste,infliggere|10ste,infondere|9ste,infradiciare|8ereste,infrangere|10ste,ingaggiare|6ereste,ingiungere|10ste,inscrivere|10ste,insistere|9ste,insorgere|9ste,insudiciare|7ereste,intendere|9ste,intercedere|11ste,intercorrere|12ste,interfacciare|9ereste,interrompere|12ste,intingere|9ste,intralciare|7ereste,intraprendere|13ste,intrattenere|8rreste,intrecciare|7ereste,intridere|9ste,intromettere|12ste,intrudere|9ste,invadere|8ste,invalere|4rreste,involgere|9ste,irridere|8ste,irrompere|9ste,iscrivere|9ste,lampeggiare|7ereste,lanciare|4ereste,lasciare|4ereste,ledere|6ste,leggere|7ste,licere|6ste,linciare|4ereste,lisciare|4ereste,maneggiare|6ereste,mangiare|4ereste,manomettere|11ste,mantenere|5rreste,manutenere|6rreste,marciare|4ereste,massaggiare|7ereste,mercanteggiare|10ereste,mergere|7ste,mescere|7ste,mettere|7ste,mietere|7ste,minacciare|6ereste,mingere|7ste,mordere|7ste,mungere|7ste,nascere|7ste,nascondere|10ste,negligere|9ste,noleggiare|6ereste,occhieggiare|8ereste,occidere|8ste,occludere|9ste,occorrere|9ste,offendere|9ste,officiare|5ereste,oltraggiare|7ereste,ombreggiare|7ereste,omettere|8ste,ondeggiare|6ereste,opprimere|9ste,ormeggiare|6ereste,osteggiare|6ereste,ottenere|4rreste,ottundere|9ste,padroneggiare|9ereste,palleggiare|7ereste,parcheggiare|8ereste,pareggiare|6ereste,parere|3reste,pascere|7ste,passeggiare|7ereste,patteggiare|7ereste,pendere|7ste,percorrere|10ste,perdere|7ste,permanere|5rreste,permettere|10ste,persistere|10ste,persuadere|10ste,pertenere|5rreste,pervadere|9ste,pettegoleggiare|11ereste,piacere|7ste,piacevoleggiare|11ereste,piaggiare|5ereste,pianeggiare|7ereste,piangere|8ste,pigiare|3ereste,pisciare|4ereste,plagiare|4ereste,poggiare|4ereste,porgere|7ste,porporeggiare|9ereste,portendere|10ste,posteggiare|7ereste,precedere|9ste,precidere|9ste,precludere|10ste,precorrere|10ste,prediligere|11ste,prefiggere|10ste,pregiare|4ereste,premere|7ste,premettere|10ste,prenascere|10ste,prendere|8ste,prescegliere|12ste,prescrivere|11ste,presumere|9ste,pretendere|10ste,prevalere|5rreste,primeggiare|7ereste,privilegiare|8ereste,procedere|9ste,profondere|10ste,promettere|10ste,pronunciare|7ereste,propellere|10ste,propendere|10ste,prorompere|10ste,proteggere|10ste,protendere|10ste,prudere|7ste,pungere|7ste,punteggiare|7ereste,racchiudere|11ste,raccogliere|11ste,raccorciare|7ereste,radere|6ste,raggiare|4ereste,raggiungere|11ste,rapprendere|11ste,recedere|8ste,recidere|8ste,recingere|9ste,recludere|9ste,redigere|8ste,redimere|8ste,reggere|7ste,rendere|7ste,repellere|9ste,reprimere|9ste,rescindere|10ste,resistere|9ste,respingere|10ste,restringere|11ste,retrocedere|11ste,riabbracciare|9ereste,riaccendere|11ste,riagganciare|8ereste,riallacciare|8ereste,riappendere|11ste,riardere|8ste,riassumere|10ste,riavvolgere|11ste,ribattere|9ste,ricacciare|6ereste,ricedere|8ste,ricevere|8ste,richiedere|10ste,ricogliere|10ste,ricominciare|8ereste,ricongiungere|13ste,riconoscere|11ste,ricorrere|9ste,ricredere|9ste,ricrescere|10ste,ridere|6ste,ridipingere|11ste,riducere|4rreste,riecheggiare|8ereste,rieleggere|10ste,riflettere|10ste,rifulgere|9ste,rilanciare|6ereste,rilasciare|6ereste,rileggere|9ste,rimanere|4rreste,rimangiare|6ereste,rimettere|9ste,rimordere|9ste,rinascere|9ste,rinchiudere|11ste,rincominciare|9ereste,rincrescere|11ste,rinunciare|6ereste,ripetere|8ste,riprendere|10ste,riscrivere|10ste,risiedere|9ste,risolvere|9ste,risorgere|9ste,rispingere|10ste,risplendere|11ste,rispondere|10ste,ristringere|11ste,ritenere|4rreste,ritorcere|9ste,ritrasmettere|13ste,rivaleggiare|8ereste,rivendere|9ste,rivincere|9ste,rivolgere|9ste,rivolvere|9ste,rompere|7ste,rovesciare|6ereste,rumoreggiare|8ereste,saccheggiare|8ereste,saggiare|4ereste,sbattere|8ste,sbilanciare|7ereste,sbirciare|5ereste,sbocciare|5ereste,sbucciare|5ereste,scacciare|5ereste,scadere|7ste,scalciare|5ereste,scarseggiare|8ereste,scegliere|9ste,scendere|8ste,sceneggiare|7ereste,scernere|8ste,scheggiare|6ereste,schiacciare|7ereste,schiaffeggiare|10ereste,schiudere|9ste,scindere|8ste,sciogliere|10ste,scocciare|5ereste,scommettere|11ste,sconfiggere|11ste,sconnettere|11ste,sconoscere|10ste,sconvolgere|11ste,scoraggiare|7ereste,scorciare|5ereste,scoreggiare|7ereste,scorgere|8ste,scorrere|8ste,scortecciare|8ereste,scoscendere|11ste,scrivere|8ste,scrosciare|6ereste,sculacciare|7ereste,secernere|9ste,selciare|4ereste,serpeggiare|7ereste,setacciare|6ereste,sfasciare|5ereste,sfiduciare|6ereste,sfociare|4ereste,sfottere|8ste,sfrecciare|6ereste,sfregiare|5ereste,sganciare|5ereste,sgusciare|5ereste,simboleggiare|9ereste,slacciare|5ereste,slanciare|5ereste,smettere|8ste,socchiudere|11ste,soccombere|10ste,soccorrere|10ste,soffriggere|11ste,soggiacere|10ste,soggiungere|11ste,soleggiare|6ereste,solvere|7ste,sommergere|10ste,sommettere|10ste,sopprimere|10ste,sopraggiungere|14ste,soprintendere|13ste,sorgere|7ste,sorprendere|11ste,sorreggere|10ste,sorridere|9ste,sorseggiare|7ereste,sorteggiare|7ereste,sospendere|10ste,sospingere|10ste,sostenere|5rreste,sottacere|9ste,sottendere|10ste,sottintendere|13ste,sottomettere|12ste,sottoscrivere|13ste,sovrintendere|13ste,spacciare|5ereste,spalleggiare|8ereste,spandere|8ste,sparere|4reste,spargere|8ste,spegnere|8ste,spendere|8ste,spergere|8ste,spiaggiare|6ereste,spingere|8ste,splendere|9ste,sporgere|8ste,spregiare|5ereste,spremere|8ste,squarciare|6ereste,stacciare|5ereste,stendere|8ste,stingere|8ste,storcere|8ste,stracciare|6ereste,stravincere|11ste,stravolgere|11ste,stridere|8ste,stringere|9ste,strisciare|6ereste,struggere|9ste,strusciare|6ereste,succedere|9ste,suddividere|11ste,sumere|6ste,sunteggiare|7ereste,sussistere|10ste,svaligiare|6ereste,svellere|8ste,svendere|8ste,svolgere|8ste,tacere|6ste,tangere|7ste,temere|6ste,temporeggiare|9ereste,tendere|7ste,tenere|2rreste,tergere|7ste,tessere|7ste,tingere|7ste,tinteggiare|7ereste,togliere|8ste,torcere|7ste,tracciare|5ereste,trafiggere|10ste,tralasciare|7ereste,tramettere|10ste,trangugiare|7ereste,transigere|10ste,trascendere|11ste,trascorrere|11ste,trascrivere|11ste,trasfondere|11ste,trasmettere|11ste,tratteggiare|8ereste,trattenere|6rreste,travolgere|10ste,troneggiare|7ereste,uccidere|8ste,ungere|6ste,urgere|6ste,vagheggiare|7ereste,valere|2rreste,vaneggiare|6ereste,veleggiare|6ereste,vendere|7ste,vengiare|4ereste,vergere|7ste,verniciare|6ereste,vertere|7ste,vetrioleggiare|10ereste,vezzeggiare|7ereste,viaggiare|5ereste,villeggiare|7ereste,vincere|7ste,vociare|3ereste,volere|2rreste,volgere|7ste,volteggiare|7ereste,volvere|7ste",
        "rev": "ndreste|2are,otreste|2ere,apreste|2ere,vreste|1ere,dreste|1ere,erreste|1nire,areste|3,rreste|3,hereste|are,ireste|3,ereste|are"
      },
      "thirdPlural": {
        "rules": "ompiere|4rebbero,ecadere|4rebbero,lencare|4herebbero,otere|2rebbero,icadere|4rebbero,esciare|3erebbero,tostare|7bbero,trafare|7bbero,rincare|4herebbero,ccadere|4rebbero,osciare|3erebbero,ingare|3herebbero,uciare|2erebbero,baciare|3erebbero,ulgare|3herebbero,olere|1rrebbero,manere|2rrebbero,sapere|3rebbero,usciare|3erebbero,parere|3rebbero,sfare|5bbero,ducere|2rrebbero,isciare|3erebbero,piovere|6anno,vivere|3rebbero,valere|2rrebbero,angare|3herebbero,rgare|2herebbero,ociare|2erebbero,efare|5bbero,lciare|2erebbero,iciare|2erebbero,vedere|3rebbero,asciare|3erebbero,rciare|2erebbero,ugare|2herebbero,ucare|2herebbero,acare|2herebbero,ecare|2herebbero,ancare|3herebbero,lcare|2herebbero,rcare|2herebbero,scare|2herebbero,tenere|2rrebbero,igare|2herebbero,venire|2rrebbero,agare|2herebbero,ocare|2herebbero,ogare|2herebbero,nciare|2erebbero,egare|2herebbero,cciare|2erebbero,ccare|2herebbero,rre|3bbero,icare|2herebbero,giare|1erebbero,ire|3bbero,ere|3bbero,are|erebbero",
        "exceptions": "andare|3rebbero,arrogere|&#8212;,avere|2rebbero,cadere|3rebbero,contraffare|11bbero,dare|4bbero,dovere|3rebbero,fare|4bbero,godere|3rebbero,nevare|3eranno,prolungare|7herebbero,ridare|6bbero,rifare|6bbero,ristare|7bbero,sopraffare|10bbero,stare|5bbero,stroncare|6herebbero,teletrasmettere|8etterebbero,troncare|5herebbero,abbacare|5herebbero,abbacchiare|8erebbero,abbacinare|7erebbero,abbagliare|7erebbero,abbaiare|5erebbero,abballare|6erebbero,abbandonare|8erebbero,abbarbagliare|10erebbero,abbarbicare|8herebbero,abbarcare|6herebbero,abbaruffare|8erebbero,abbassare|6erebbero,abbattere|9bbero,abbellire|9bbero,abbeverare|7erebbero,abbigliare|7erebbero,abbinare|5erebbero,abbindolare|8erebbero,abbisognare|8erebbero,abbittare|6erebbero,abboccare|6herebbero,abbonacciare|8erebbero,abbonare|5erebbero,abbondare|6erebbero,abbonire|8bbero,abbottonare|8erebbero,abbozzare|6erebbero,abbracciare|7erebbero,abbreviare|7erebbero,abbronzare|7erebbero,abbrunire|9bbero,abbrustolire|12bbero,abbrutire|9bbero,abdicare|5herebbero,abdurre|7bbero,aberrare|5erebbero,abilitare|6erebbero,abissare|5erebbero,abitare|4erebbero,abituare|5erebbero,abiurare|5erebbero,abolire|7bbero,abominare|6erebbero,aborrire|8bbero,abortire|8bbero,abradere|8bbero,abrogare|5herebbero,abusare|4erebbero,accadere|5rebbero,accalappiare|9erebbero,accampare|6erebbero,accanire|8bbero,accantonare|8erebbero,accaparrare|8erebbero,accapponare|8erebbero,accarezzare|8erebbero,accartocciare|9erebbero,accasciare|6erebbero,accatastare|8erebbero,accavallare|8erebbero,accecare|5herebbero,accedere|8bbero,accelerare|7erebbero,accendere|9bbero,accentare|6erebbero,accerchiare|8erebbero,accertare|6erebbero,accettare|6erebbero,acchetare|6erebbero,acchiappare|8erebbero,acciuffare|7erebbero,acclamare|6erebbero,accogliere|10bbero,accollare|6erebbero,accoltellare|9erebbero,accomiatare|8erebbero,accomodare|7erebbero,accompagnare|9erebbero,accomunare|7erebbero,acconciare|6erebbero,accondiscendere|15bbero,acconsentire|12bbero,accontentare|9erebbero,accoppiare|7erebbero,accorciare|6erebbero,accordare|6erebbero,accorrere|9bbero,accostare|6erebbero,accreditare|8erebbero,accrescere|10bbero,accudire|8bbero,acculturare|8erebbero,accumulare|7erebbero,accusare|5erebbero,acquietare|7erebbero,acquisire|9bbero,acquistare|7erebbero,acutizzare|7erebbero,adattare|5erebbero,addebitare|7erebbero,addensare|6erebbero,addentare|6erebbero,addestrare|7erebbero,addire|6bbero,additare|5erebbero,addivenire|6rrebbero,addizionare|8erebbero,addobbare|6erebbero,addolcire|9bbero,addolorare|7erebbero,addomesticare|10herebbero,addossare|6erebbero,addurre|7bbero,adeguare|5erebbero,adergere|8bbero,aderire|7bbero,adescare|5herebbero,adire|5bbero,adocchiare|7erebbero,adombrare|6erebbero,adoperare|6erebbero,adoprare|5erebbero,adorare|4erebbero,adornare|5erebbero,adottare|5erebbero,adulare|4erebbero,adulterare|7erebbero,adunare|4erebbero,affaccendare|9erebbero,affacciare|6erebbero,affamare|5erebbero,affannare|6erebbero,affascinare|8erebbero,affaticare|7herebbero,affermare|6erebbero,afferrare|6erebbero,affettare|6erebbero,affezionare|8erebbero,affiancare|7herebbero,affiatare|6erebbero,affibbiare|7erebbero,affidare|5erebbero,affievolire|11bbero,affilare|5erebbero,affiliare|6erebbero,affinare|5erebbero,affittare|6erebbero,affliggere|10bbero,afflosciare|7erebbero,affluire|8bbero,affocare|5herebbero,affogare|5herebbero,affollare|6erebbero,affondare|6erebbero,affrangere|10bbero,affrescare|7herebbero,affrontare|7erebbero,affumicare|7herebbero,agevolare|6erebbero,agganciare|6erebbero,aggettivare|8erebbero,agghiacciare|8erebbero,agghindare|7erebbero,aggiogare|6herebbero,aggiornare|7erebbero,aggirare|5erebbero,aggiudicare|8herebbero,aggiungere|10bbero,aggiuntare|7erebbero,aggiustare|7erebbero,agglomerare|8erebbero,aggravare|6erebbero,aggredire|9bbero,aggregare|6herebbero,aggrovigliare|10erebbero,aggruppare|7erebbero,agguantare|7erebbero,agiare|2erebbero,agire|5bbero,agitare|4erebbero,agognare|5erebbero,agonizzare|7erebbero,agurare|4erebbero,aguzzare|5erebbero,aiutare|4erebbero,aizzare|4erebbero,alare|2erebbero,albeggiare|6erebbero,alberare|5erebbero,aleggiare|5erebbero,alfabetizzare|10erebbero,algere|6bbero,alienare|5erebbero,alimentare|7erebbero,allacciare|6erebbero,allagare|5herebbero,allappare|6erebbero,allargare|6herebbero,allattare|6erebbero,alleare|4erebbero,allegare|5herebbero,alleggerire|11bbero,allenare|5erebbero,allentare|6erebbero,allertare|6erebbero,allestire|9bbero,allettare|6erebbero,allevare|5erebbero,alleviare|6erebbero,allietare|6erebbero,allineare|6erebbero,allocare|5herebbero,allogare|5herebbero,alloggiare|6erebbero,allontanare|8erebbero,allucinare|7erebbero,alludere|8bbero,allunare|5erebbero,allungare|6erebbero,almanaccare|8herebbero,altalenare|7erebbero,alterare|5erebbero,altercare|6herebbero,alternare|6erebbero,alzare|3erebbero,amalgamare|7erebbero,amare|2erebbero,amareggiare|7erebbero,amaricare|6herebbero,ambasciare|6erebbero,ambiare|4erebbero,ambientare|7erebbero,ambire|6bbero,ammaccare|6herebbero,ammaestrare|8erebbero,ammainare|6erebbero,ammaliare|6erebbero,ammanettare|8erebbero,ammansire|9bbero,ammantare|6erebbero,ammarare|5erebbero,ammassare|6erebbero,ammattire|9bbero,ammazzare|6erebbero,ammetare|5erebbero,ammettere|9bbero,ammiccare|6herebbero,amministrare|9erebbero,ammirare|5erebbero,ammodernare|8erebbero,ammogliare|7erebbero,ammollire|9bbero,ammonire|8bbero,ammontare|6erebbero,ammorbare|6erebbero,ammorbidire|11bbero,ammucchiare|8erebbero,ammuffire|9bbero,amnistiare|7erebbero,amoreggiare|7erebbero,ampliare|5erebbero,amplificare|8herebbero,amputare|5erebbero,analizzare|7erebbero,ancheggiare|7erebbero,ancorare|5erebbero,anelare|4erebbero,anellare|5erebbero,anestetizzare|10erebbero,angustiare|7erebbero,animare|4erebbero,annaffiare|7erebbero,annebbiare|7erebbero,annegare|5herebbero,annerire|8bbero,annettere|9bbero,annichilire|11bbero,annidare|5erebbero,annientare|7erebbero,annodare|5erebbero,annoiare|5erebbero,annotare|5erebbero,annoverare|7erebbero,annuire|7bbero,annullare|6erebbero,annunciare|6erebbero,annusare|5erebbero,annuvolare|7erebbero,antecedere|10bbero,anteporre|9bbero,anticipare|7erebbero,appannare|6erebbero,apparare|5erebbero,apparecchiare|10erebbero,apparire|8bbero,appartare|6erebbero,appartenere|7rrebbero,appassionare|9erebbero,appassire|9bbero,appellare|6erebbero,appendere|9bbero,appesantire|11bbero,appezzare|6erebbero,appianare|6erebbero,appiattire|10bbero,appiccare|6herebbero,appiccicare|8herebbero,appioppare|7erebbero,applaudire|10bbero,applicare|6herebbero,appoggiare|6erebbero,apporre|7bbero,apportare|6erebbero,appostare|6erebbero,apprendere|10bbero,apprezzare|7erebbero,approcciare|7erebbero,approdare|6erebbero,approfittare|9erebbero,approfondire|12bbero,appropriare|8erebbero,approssimare|9erebbero,approvare|6erebbero,approvvigionare|12erebbero,appuntare|6erebbero,appurare|5erebbero,aprire|6bbero,arabescare|7herebbero,arare|2erebbero,arbitrare|6erebbero,archiviare|7erebbero,ardere|6bbero,arginare|5erebbero,argomentare|8erebbero,arguire|7bbero,arieggiare|6erebbero,armare|3erebbero,armeggiare|6erebbero,armonizzare|8erebbero,aromatizzare|9erebbero,arrabbiare|7erebbero,arraffare|6erebbero,arrampicare|8herebbero,arredare|5erebbero,arrestare|6erebbero,arricchire|10bbero,arricciare|6erebbero,arridere|8bbero,arringare|6herebbero,arrischiare|8erebbero,arrivare|5erebbero,arroccare|6herebbero,arrogare|5herebbero,arrossare|6erebbero,arrossire|9bbero,arrostare|6erebbero,arrostire|9bbero,arrotondare|8erebbero,arrovellare|8erebbero,arrugginire|11bbero,articolare|7erebbero,arzigogolare|9erebbero,ascendere|9bbero,asciugare|6herebbero,ascoltare|6erebbero,ascondere|9bbero,ascrivere|9bbero,asfaltare|6erebbero,aspergere|9bbero,aspettare|6erebbero,aspirare|5erebbero,asportare|6erebbero,assaggiare|6erebbero,assalire|8bbero,assaltare|6erebbero,assaporare|7erebbero,assassinare|8erebbero,assecondare|8erebbero,assediare|6erebbero,assegnare|6erebbero,assemblare|7erebbero,assentire|9bbero,asserire|8bbero,assestare|6erebbero,asseverare|7erebbero,assicurare|7erebbero,assidere|8bbero,assiepare|6erebbero,assillare|6erebbero,assimilare|7erebbero,assistere|9bbero,associare|5erebbero,assodare|5erebbero,assoggettare|9erebbero,assolvere|9bbero,assomigliare|9erebbero,assommare|6erebbero,assorbire|9bbero,assordare|6erebbero,assortire|9bbero,assottigliare|10erebbero,assuefare|9bbero,assumere|8bbero,assurgere|9bbero,astenere|4rrebbero,astergere|9bbero,astrarre|8bbero,astringere|10bbero,attaccare|6herebbero,attecchire|10bbero,atteggiare|6erebbero,attendere|9bbero,attenere|4rrebbero,attentare|6erebbero,attenuare|6erebbero,atterrare|6erebbero,attestare|6erebbero,attingere|9bbero,attirare|5erebbero,attizzare|6erebbero,attorcere|9bbero,attorcigliare|10erebbero,attraccare|7herebbero,attrarre|8bbero,attraversare|9erebbero,attrezzare|7erebbero,attribuire|10bbero,attualizzare|9erebbero,attuare|4erebbero,attutire|8bbero,augurare|5erebbero,aulire|6bbero,aumentare|6erebbero,auscultare|7erebbero,auspicare|6herebbero,automatizzare|10erebbero,autorizzare|8erebbero,avallare|5erebbero,avanzare|5erebbero,avariare|5erebbero,avocare|4herebbero,avvampare|6erebbero,avvelenare|7erebbero,avvenire|4rrebbero,avventare|6erebbero,avventurare|8erebbero,avverare|5erebbero,avvertire|9bbero,avvezzare|6erebbero,avviare|4erebbero,avvicinare|7erebbero,avvilire|8bbero,avviluppare|8erebbero,avvinare|5erebbero,avvincere|9bbero,avvinghiare|8erebbero,avvisare|5erebbero,avvistare|6erebbero,avvitare|5erebbero,avvivare|5erebbero,avvizzire|9bbero,avvolgere|9bbero,azzannare|6erebbero,azzardare|6erebbero,azzeccare|6herebbero,azzerare|5erebbero,azzuffare|6erebbero,baccagliare|8erebbero,bacchiare|6erebbero,baciare|3erebbero,badare|3erebbero,bagnare|4erebbero,balbettare|7erebbero,balenare|5erebbero,ballare|4erebbero,balzare|4erebbero,bandire|7bbero,barare|3erebbero,barcollare|7erebbero,bardare|4erebbero,barricare|6herebbero,basare|3erebbero,basire|6bbero,bastare|4erebbero,bastonare|6erebbero,battere|7bbero,battezzare|7erebbero,bazzicare|6herebbero,beare|2erebbero,beccare|4herebbero,beccheggiare|8erebbero,beffare|4erebbero,belare|3erebbero,bendare|4erebbero,benedicere|10bbero,benedire|8bbero,beneficare|7herebbero,beneficiare|7erebbero,berciare|4erebbero,bersagliare|8erebbero,bestemmiare|8erebbero,bevicchiare|8erebbero,biascicare|7herebbero,biasimare|6erebbero,bighellonare|9erebbero,bigiare|3erebbero,bilanciare|6erebbero,bisbigliare|8erebbero,bisticciare|7erebbero,bivaccare|6herebbero,blandire|8bbero,blaterare|6erebbero,blindare|5erebbero,boccheggiare|8erebbero,bocciare|4erebbero,bofonchiare|8erebbero,boicottare|7erebbero,bollare|4erebbero,bollire|7bbero,bombardare|7erebbero,borbottare|7erebbero,bordare|4erebbero,borseggiare|7erebbero,bramare|4erebbero,bravare|4erebbero,brigare|4herebbero,brillare|5erebbero,brindare|5erebbero,brontolare|7erebbero,brucare|4herebbero,bruciacchiare|10erebbero,bruciare|4erebbero,brulicare|6herebbero,brunire|7bbero,bruscare|5herebbero,bruttare|5erebbero,bucare|3herebbero,bufare|3erebbero,buffare|4erebbero,bulinare|5erebbero,burlare|4erebbero,buscare|4herebbero,bussare|4erebbero,buttare|4erebbero,cacare|3herebbero,cacciare|4erebbero,cadenzare|6erebbero,caducare|5herebbero,cagionare|6erebbero,cagliare|5erebbero,calare|3erebbero,calcare|4herebbero,calciare|4erebbero,calcolare|6erebbero,calmare|4erebbero,calpestare|7erebbero,calunniare|7erebbero,calzare|4erebbero,cambiare|5erebbero,camminare|6erebbero,campare|4erebbero,campeggiare|7erebbero,campionare|7erebbero,camuffare|6erebbero,cancellare|7erebbero,candidare|6erebbero,candire|7bbero,cangiare|4erebbero,cannare|4erebbero,cantare|4erebbero,canticchiare|9erebbero,capeggiare|6erebbero,capillarizzare|11erebbero,capire|6bbero,capitalizzare|10erebbero,capitaneggiare|10erebbero,capitare|5erebbero,capovolgere|11bbero,captare|4erebbero,caratterizzare|11erebbero,carbonizzare|9erebbero,cariare|4erebbero,caricare|5herebbero,carpire|7bbero,cascare|4herebbero,cassare|4erebbero,castigare|6herebbero,castrare|5erebbero,catalogare|7herebbero,catturare|6erebbero,causare|4erebbero,cautelare|6erebbero,cavalcare|6herebbero,cavare|3erebbero,cavillare|6erebbero,cazzare|4erebbero,cazzeggiare|7erebbero,cecare|3herebbero,cedere|6bbero,celare|3erebbero,celebrare|6erebbero,cenare|3erebbero,centellinare|9erebbero,centrare|5erebbero,cerare|3erebbero,cercare|4herebbero,cerchiare|6erebbero,cernere|7bbero,certificare|8herebbero,cesellare|6erebbero,cessare|4erebbero,cestinare|6erebbero,cherere|7bbero,chetare|4erebbero,chiacchierare|10erebbero,chiamare|5erebbero,chiappare|6erebbero,chiarificare|9herebbero,chiarire|8bbero,chiavare|5erebbero,chiedere|8bbero,chierere|8bbero,chinare|4erebbero,chiocciare|6erebbero,chiodare|5erebbero,chiosare|5erebbero,chiudere|8bbero,ciarlare|5erebbero,cibare|3erebbero,cicatrizzare|9erebbero,ciccare|4herebbero,cifrare|4erebbero,cimare|3erebbero,cimentare|6erebbero,cincischiare|9erebbero,cingere|7bbero,cinguettare|8erebbero,cintare|4erebbero,ciondolare|7erebbero,circolare|6erebbero,circoncidere|12bbero,circondare|7erebbero,circoscrivere|13bbero,circuire|8bbero,circumnavigare|11herebbero,citare|3erebbero,ciucciare|5erebbero,clamare|4erebbero,clangere|8bbero,classificare|9herebbero,claudicare|7herebbero,clonare|4erebbero,coabitare|6erebbero,coagulare|6erebbero,coccolare|6erebbero,codificare|7herebbero,cogitare|5erebbero,cogliere|8bbero,coglionare|7erebbero,cognoscere|10bbero,coincidere|10bbero,colare|3erebbero,collaborare|8erebbero,collassare|7erebbero,collaudare|7erebbero,collazionare|9erebbero,collegare|6herebbero,collezionare|9erebbero,collidere|9bbero,collocare|6herebbero,colludere|9bbero,colmare|4erebbero,colonizzare|8erebbero,colorare|5erebbero,colorire|8bbero,colpevolizzare|11erebbero,colpire|7bbero,coltivare|6erebbero,comandare|6erebbero,combaciare|6erebbero,combattere|10bbero,combinare|6erebbero,cominciare|6erebbero,commediare|7erebbero,commemorare|8erebbero,commendare|7erebbero,commentare|7erebbero,commercializzare|13erebbero,commettere|10bbero,comminare|6erebbero,commiserare|8erebbero,commissionare|10erebbero,commutare|6erebbero,comparare|6erebbero,comparire|9bbero,compatire|9bbero,compattare|7erebbero,compensare|7erebbero,competere|9bbero,compiacere|10bbero,compiangere|11bbero,compiere|5rebbero,compilare|6erebbero,compitare|6erebbero,completare|7erebbero,complicare|7herebbero,complimentare|10erebbero,comporre|8bbero,comportare|7erebbero,compostare|7erebbero,comprare|5erebbero,comprendere|11bbero,comprimere|10bbero,compromettere|13bbero,comprovare|7erebbero,compungere|10bbero,computare|6erebbero,comunicare|7herebbero,concedere|9bbero,concentrare|8erebbero,concepire|9bbero,concernere|10bbero,concertare|7erebbero,conciare|4erebbero,conciliare|7erebbero,concimare|6erebbero,concitare|6erebbero,concludere|10bbero,concordare|7erebbero,concorrere|10bbero,concretare|7erebbero,concretizzare|10erebbero,concupire|9bbero,condannare|7erebbero,condensare|7erebbero,condire|7bbero,condizionare|9erebbero,condonare|6erebbero,condurre|8bbero,confabulare|8erebbero,conferire|9bbero,confermare|7erebbero,confessare|7erebbero,confezionare|9erebbero,conficcare|7herebbero,confidare|6erebbero,configurare|8erebbero,confiscare|7herebbero,confluire|9bbero,confondere|10bbero,conformare|7erebbero,confortare|7erebbero,confrontare|8erebbero,confutare|6erebbero,congedare|6erebbero,congelare|6erebbero,congiungere|11bbero,congiurare|7erebbero,congratulare|9erebbero,congregare|7herebbero,coniare|4erebbero,coniugare|6herebbero,connettere|10bbero,connumerare|8erebbero,conoscere|9bbero,conquistare|8erebbero,consacrare|7erebbero,consegnare|7erebbero,conseguire|10bbero,consentire|10bbero,conservare|7erebbero,considerare|8erebbero,consigliare|8erebbero,consistere|10bbero,consolare|6erebbero,consolidare|8erebbero,constare|5erebbero,constatare|7erebbero,consultare|7erebbero,consumare|6erebbero,contabilizzare|11erebbero,contagiare|6erebbero,contaminare|8erebbero,contare|4erebbero,contattare|7erebbero,conteggiare|7erebbero,contemplare|8erebbero,contendere|10bbero,contenere|5rrebbero,contentare|7erebbero,contestare|7erebbero,contestualizzare|13erebbero,continuare|7erebbero,contorcere|10bbero,contraccambiare|12erebbero,contraddire|11bbero,contraddistinguere|18bbero,contrapporre|12bbero,contrare|5erebbero,contrariare|8erebbero,contrarre|9bbero,contrassegnare|11erebbero,contrastare|8erebbero,contrattare|8erebbero,contravvenire|9rrebbero,contribuire|11bbero,controbattere|13bbero,controllare|8erebbero,convenire|5rrebbero,convergere|10bbero,convertire|10bbero,convincere|10bbero,convitare|6erebbero,convivere|6rebbero,convocare|6herebbero,convolare|6erebbero,convolgere|10bbero,cooperare|6erebbero,coordinare|7erebbero,copiare|4erebbero,coppellare|7erebbero,coprire|7bbero,copulare|5erebbero,corbellare|7erebbero,coricare|5herebbero,coronare|5erebbero,corredare|6erebbero,correggere|10bbero,correre|7bbero,corrispondere|13bbero,corroborare|8erebbero,corrodere|9bbero,corrompere|10bbero,corrugare|6herebbero,corteggiare|7erebbero,cosare|3erebbero,cospargere|10bbero,cospirare|6erebbero,costare|4erebbero,costeggiare|7erebbero,costipare|6erebbero,costituire|10bbero,costringere|11bbero,costruire|9bbero,costumare|6erebbero,covare|3erebbero,crapulare|6erebbero,creare|3erebbero,credere|7bbero,cremare|4erebbero,crepare|4erebbero,crepitare|6erebbero,crescere|8bbero,criticare|6herebbero,crocchiare|7erebbero,crocifiggere|12bbero,crollare|5erebbero,cucinare|5erebbero,cucire|6bbero,cullare|4erebbero,culminare|6erebbero,cumulare|5erebbero,curare|3erebbero,curiosare|6erebbero,curvare|4erebbero,custodire|9bbero,dannare|4erebbero,danneggiare|7erebbero,danzare|4erebbero,dardeggiare|7erebbero,dattilografare|11erebbero,deambulare|7erebbero,debellare|6erebbero,debuttare|6erebbero,decadere|5rebbero,decedere|8bbero,decidere|8bbero,decifrare|6erebbero,decimare|5erebbero,declamare|6erebbero,decollare|6erebbero,decorare|5erebbero,decorrere|9bbero,decrescere|10bbero,dedicare|5herebbero,dedurre|7bbero,defalcare|6herebbero,defecare|5herebbero,deferire|8bbero,definire|8bbero,defluire|8bbero,deformare|6erebbero,defungere|9bbero,degenerare|7erebbero,deglutire|9bbero,degnare|4erebbero,degustare|6erebbero,delegare|5herebbero,deliberare|7erebbero,delineare|6erebbero,delinquere|10bbero,delirare|5erebbero,deliziare|6erebbero,deludere|8bbero,demandare|6erebbero,demolire|8bbero,demoralizzare|10erebbero,denominare|7erebbero,denudare|5erebbero,deperire|8bbero,depilare|5erebbero,deplorare|6erebbero,deporre|7bbero,deportare|6erebbero,depredare|6erebbero,deprimere|9bbero,depurare|5erebbero,derapare|5erebbero,deridere|8bbero,derogare|5herebbero,derubare|5erebbero,descrivere|10bbero,desiare|4erebbero,desiderare|7erebbero,designare|6erebbero,desirare|5erebbero,desistere|9bbero,desolare|5erebbero,destabilizzare|11erebbero,destare|4erebbero,destinare|6erebbero,destituire|10bbero,destreggiare|8erebbero,desumere|8bbero,detenere|4rrebbero,detergere|9bbero,determinare|8erebbero,detestare|6erebbero,dettagliare|8erebbero,dettare|4erebbero,devastare|6erebbero,deviare|4erebbero,devolvere|9bbero,dialogare|6herebbero,dichiarare|7erebbero,difendere|9bbero,diffamare|6erebbero,differire|9bbero,diffidare|6erebbero,diffondere|10bbero,digerire|8bbero,digiunare|6erebbero,digrignare|7erebbero,dilagare|5herebbero,dilaniare|6erebbero,dileguare|6erebbero,dilettare|6erebbero,diligere|8bbero,diluire|7bbero,diluviare|6erebbero,dimenare|5erebbero,dimenticare|8herebbero,dimettere|9bbero,dimezzare|6erebbero,diminuire|9bbero,dimissionare|9erebbero,dimorare|5erebbero,dimostrare|7erebbero,dipanare|5erebbero,dipartire|9bbero,dipendere|9bbero,dipingere|9bbero,diporre|7bbero,diramare|5erebbero,dire|4bbero,diredare|5erebbero,direzionare|8erebbero,dirigere|8bbero,dirimere|8bbero,dirompere|9bbero,dirottare|6erebbero,disapprovare|9erebbero,disarmare|6erebbero,disattendere|12bbero,discendere|10bbero,discernere|10bbero,dischiudere|11bbero,disciogliere|12bbero,disciplinare|9erebbero,discolpare|7erebbero,disconnettere|13bbero,disconoscere|12bbero,discoprire|10bbero,discordare|7erebbero,discorrere|10bbero,discostare|7erebbero,discriminare|9erebbero,discutere|9bbero,disdegnare|7erebbero,disdettare|7erebbero,disegnare|6erebbero,diseredare|7erebbero,disertare|6erebbero,disfare|7bbero,disgiungere|11bbero,disgregare|7herebbero,disimpegnare|9erebbero,disincantare|9erebbero,disinteressare|11erebbero,disintossicare|11herebbero,dismettere|10bbero,disobbedire|11bbero,disonorare|7erebbero,disordinare|8erebbero,disorientare|9erebbero,disparire|9bbero,dispensare|7erebbero,disperare|6erebbero,disperdere|10bbero,dispiacere|10bbero,dispiegare|7herebbero,disporre|8bbero,disposare|6erebbero,dispregiare|7erebbero,disprezzare|8erebbero,disputare|6erebbero,dissanguare|8erebbero,disseminare|8erebbero,dissentire|10bbero,disseppellire|13bbero,dissertare|7erebbero,dissimulare|8erebbero,dissipare|6erebbero,dissociare|6erebbero,dissolvere|10bbero,dissuadere|10bbero,distaccare|7herebbero,distanziare|8erebbero,distare|4erebbero,distendere|10bbero,distillare|7erebbero,distinguere|11bbero,distogliere|11bbero,distorcere|10bbero,distrarre|9bbero,distribuire|11bbero,distruggere|11bbero,disturbare|7erebbero,disubbidire|11bbero,divagare|5herebbero,divampare|6erebbero,divaricare|7herebbero,divellere|9bbero,divenire|4rrebbero,diventare|6erebbero,divergere|9bbero,diversificare|10herebbero,divertire|9bbero,dividere|8bbero,divietare|6erebbero,divinare|5erebbero,divorare|5erebbero,divorziare|7erebbero,divulgare|6herebbero,dolere|2rrebbero,domandare|6erebbero,domare|3erebbero,domesticare|8herebbero,dominare|5erebbero,donare|3erebbero,dondolare|6erebbero,dopare|3erebbero,doppiare|5erebbero,dorare|3erebbero,dormicchiare|9erebbero,dormire|7bbero,dosare|3erebbero,dotare|3erebbero,dragare|4herebbero,drammatizzare|10erebbero,drenare|4erebbero,dribblare|6erebbero,drizzare|5erebbero,dubitare|5erebbero,ducere|2rrebbero,duellare|5erebbero,duplicare|6herebbero,durare|3erebbero,eccedere|8bbero,eccellere|9bbero,eccepire|8bbero,eccettuare|7erebbero,eccitare|5erebbero,echeggiare|6erebbero,eclissare|6erebbero,economizzare|9erebbero,edificare|6herebbero,editare|4erebbero,educare|4herebbero,educere|3rrebbero,edulcorare|7erebbero,effigiare|5erebbero,effondere|9bbero,eiaculare|6erebbero,elaborare|6erebbero,eleggere|8bbero,elencare|5herebbero,elevare|4erebbero,elidere|7bbero,eliminare|6erebbero,elogiare|4erebbero,elucubrare|7erebbero,eludere|7bbero,emanare|4erebbero,emancipare|7erebbero,emendare|5erebbero,emergere|8bbero,emettere|8bbero,emigrare|5erebbero,emozionare|7erebbero,empire|6bbero,emulare|4erebbero,encomiare|6erebbero,enfatizzare|8erebbero,enfiare|4erebbero,entrare|4erebbero,entusiasmare|9erebbero,enumerare|6erebbero,enunciare|5erebbero,equilibrare|8erebbero,equipaggiare|8erebbero,equiparare|7erebbero,equivalere|6rrebbero,equivocare|7herebbero,eredare|4erebbero,ereditare|6erebbero,ergere|6bbero,erigere|7bbero,erodere|7bbero,erogare|4herebbero,erompere|8bbero,errare|3erebbero,erudire|7bbero,eruttare|5erebbero,esacerbare|7erebbero,esagerare|6erebbero,esalare|4erebbero,esaltare|5erebbero,esaminare|6erebbero,esasperare|7erebbero,esaudire|8bbero,esaurire|8bbero,esautorare|7erebbero,esclamare|6erebbero,escludere|9bbero,escogitare|7erebbero,escutere|8bbero,esecrare|5erebbero,eseguire|8bbero,esemplificare|10herebbero,esentare|5erebbero,esercire|8bbero,esercitare|7erebbero,esibire|7bbero,esigere|7bbero,esilarare|6erebbero,esiliare|5erebbero,esistere|8bbero,esitare|4erebbero,esonerare|6erebbero,esorcizzare|8erebbero,esordire|8bbero,esortare|5erebbero,espandere|9bbero,espatriare|7erebbero,espellere|9bbero,esperire|8bbero,espiare|4erebbero,espirare|5erebbero,esplicare|6herebbero,esplicitare|8erebbero,esplorare|6erebbero,esporre|7bbero,esportare|6erebbero,esprimere|9bbero,espropriare|8erebbero,espugnare|6erebbero,espungere|9bbero,essiccare|6herebbero,estendere|9bbero,esternare|6erebbero,estinguere|10bbero,estirpare|6erebbero,estollere|9bbero,estorcere|9bbero,estraniare|7erebbero,estrarre|8bbero,estrudere|9bbero,esultare|5erebbero,etichettare|8erebbero,evacuare|5erebbero,evadere|7bbero,evangelizzare|10erebbero,evaporare|6erebbero,evidenziare|8erebbero,evincere|8bbero,evirare|4erebbero,evitare|4erebbero,evocare|4herebbero,evolvere|8bbero,fabbricare|7herebbero,facilitare|7erebbero,falciare|4erebbero,fallare|4erebbero,fallire|7bbero,falsare|4erebbero,falsificare|8herebbero,familiarizzare|11erebbero,fantasticare|9herebbero,farcire|7bbero,farneticare|8herebbero,fasciare|4erebbero,faticare|5herebbero,fatturare|6erebbero,favellare|6erebbero,favoreggiare|8erebbero,favorire|8bbero,fecondare|6erebbero,felicitare|7erebbero,fendere|7bbero,ferire|6bbero,fermare|4erebbero,fermentare|7erebbero,ferrare|4erebbero,fertilizzare|9erebbero,fervere|7bbero,festeggiare|7erebbero,fiaccare|5herebbero,fiammeggiare|8erebbero,fiancheggiare|9erebbero,fiatare|4erebbero,ficcare|4herebbero,fidanzare|6erebbero,fidare|3erebbero,figgere|7bbero,figliare|5erebbero,filare|3erebbero,filmare|4erebbero,filosofare|7erebbero,filtrare|5erebbero,finalizzare|8erebbero,finanziare|7erebbero,fingere|7bbero,finire|6bbero,fioccare|5herebbero,fiorire|7bbero,firmare|4erebbero,fischiare|6erebbero,fissare|4erebbero,flagellare|7erebbero,flettere|8bbero,flirtare|5erebbero,flottare|5erebbero,fluire|6bbero,fluttuare|6erebbero,focalizzare|8erebbero,foderare|5erebbero,foggiare|4erebbero,folgorare|6erebbero,follare|4erebbero,fomentare|6erebbero,fondare|4erebbero,forare|3erebbero,forgiare|4erebbero,formalizzare|9erebbero,formare|4erebbero,formicolare|8erebbero,fornicare|6herebbero,fornire|7bbero,fortificare|8herebbero,forzare|4erebbero,fotocopiare|8erebbero,fotografare|8erebbero,fottere|7bbero,fracassare|7erebbero,fraintendere|12bbero,frammentare|8erebbero,frangere|8bbero,frantumare|7erebbero,frastornare|8erebbero,frazionare|7erebbero,freddare|5erebbero,fregare|4herebbero,fregiare|4erebbero,fremere|7bbero,frenare|4erebbero,frequentare|8erebbero,frettare|5erebbero,friggere|8bbero,frignare|5erebbero,frinire|7bbero,frizionare|7erebbero,frodare|4erebbero,fronteggiare|8erebbero,frugare|4herebbero,fruire|6bbero,frustare|5erebbero,frustrare|6erebbero,fruttare|5erebbero,fucilare|5erebbero,fugare|3herebbero,fuggire|7bbero,fulgere|7bbero,fulminare|6erebbero,fumare|3erebbero,funestare|6erebbero,fungere|7bbero,funzionare|7erebbero,fuoriuscire|11bbero,furare|3erebbero,fustigare|6herebbero,gabbare|4erebbero,gallare|4erebbero,galleggiare|7erebbero,galoppare|6erebbero,galvanizzare|9erebbero,garbare|4erebbero,gareggiare|6erebbero,garrire|7bbero,gelare|3erebbero,gemere|6bbero,generalizzare|10erebbero,generare|5erebbero,germinare|6erebbero,germogliare|8erebbero,gessare|4erebbero,gestire|7bbero,gettare|4erebbero,ghermire|8bbero,ghiacciare|6erebbero,ghignare|5erebbero,giacere|7bbero,giocare|4herebbero,giocolare|6erebbero,gioire|6bbero,giostrare|6erebbero,giovare|4erebbero,girare|3erebbero,girovagare|7herebbero,giubilare|6erebbero,giudicare|6herebbero,giulebbare|7erebbero,giungere|8bbero,giuntare|5erebbero,giurare|4erebbero,giustapporre|12bbero,giustificare|9herebbero,giustiziare|8erebbero,glissare|5erebbero,gloriare|5erebbero,glorificare|8herebbero,gocciare|4erebbero,goffrare|5erebbero,gonfiare|5erebbero,gongolare|6erebbero,gorgheggiare|8erebbero,governare|6erebbero,gozzovigliare|10erebbero,gradare|4erebbero,gradire|7bbero,graffiare|6erebbero,grandinare|7erebbero,gratificare|8herebbero,grattare|5erebbero,gravare|4erebbero,gremire|7bbero,gridare|4erebbero,grugnire|8bbero,guadagnare|7erebbero,guadare|4erebbero,guardare|5erebbero,guarire|7bbero,guarnire|8bbero,guastare|5erebbero,guatare|4erebbero,guerreggiare|8erebbero,guidare|4erebbero,gustare|4erebbero,ibernare|5erebbero,idealizzare|8erebbero,ideare|3erebbero,identificare|9herebbero,idolatrare|7erebbero,idratare|5erebbero,ignorare|5erebbero,illudere|8bbero,illustrare|7erebbero,imbacuccare|8herebbero,imballare|6erebbero,imbalsamare|8erebbero,imbarazzare|8erebbero,imbarcare|6herebbero,imbastire|9bbero,imbavagliare|9erebbero,imbellire|9bbero,imbestialire|12bbero,imbevere|8bbero,imbiancare|7herebbero,imbianchire|11bbero,imbibire|8bbero,imbiondire|10bbero,imbizzarrire|12bbero,imboccare|6herebbero,imboscare|6herebbero,imbottigliare|10erebbero,imbottire|9bbero,imbracciare|7erebbero,imbrattare|7erebbero,imbrogliare|8erebbero,imbrunire|9bbero,imbruttire|10bbero,imbucare|5herebbero,imburrare|6erebbero,imitare|4erebbero,immagazzinare|10erebbero,immaginare|7erebbero,immatricolare|10erebbero,immedesimare|9erebbero,immergere|9bbero,immettere|9bbero,immigrare|6erebbero,immobilizzare|10erebbero,immolare|5erebbero,immortalare|8erebbero,impaccare|6herebbero,impacchettare|10erebbero,impacciare|6erebbero,impalare|5erebbero,impallidire|11bbero,impanare|5erebbero,impantanare|8erebbero,imparare|5erebbero,imparentare|8erebbero,impartire|9bbero,impastare|6erebbero,impattare|6erebbero,impaurire|9bbero,impazzare|6erebbero,impazzire|9bbero,impedire|8bbero,impegnare|6erebbero,impennare|6erebbero,impensierire|12bbero,imperare|5erebbero,impersonare|8erebbero,imperversare|9erebbero,impiantare|7erebbero,impiccare|6herebbero,impiegare|6herebbero,impietosire|11bbero,impietrire|10bbero,impigliare|7erebbero,impigrire|9bbero,impilare|5erebbero,implementare|9erebbero,implicare|6herebbero,implorare|6erebbero,imporre|7bbero,importare|6erebbero,importunare|8erebbero,impossibilitare|12erebbero,impoverire|10bbero,impratichire|12bbero,imprecare|6herebbero,impregnare|7erebbero,imprendere|10bbero,impressionare|10erebbero,imprestare|7erebbero,impreziosire|12bbero,imprigionare|9erebbero,imprimere|9bbero,improntare|7erebbero,improvvisare|9erebbero,impugnare|6erebbero,imputare|5erebbero,imputridire|11bbero,inabissare|7erebbero,inacidire|9bbero,inalare|4erebbero,inalberare|7erebbero,inarcare|5herebbero,inaridire|9bbero,inasprire|9bbero,inaugurare|7erebbero,incagliare|7erebbero,incalzare|6erebbero,incamminare|8erebbero,incantare|6erebbero,incanutire|10bbero,incaricare|7herebbero,incarnare|6erebbero,incartare|6erebbero,incasinare|7erebbero,incassare|6erebbero,incastonare|8erebbero,incatenare|7erebbero,incedere|8bbero,incendere|9bbero,incendiare|7erebbero,incenerire|10bbero,incentivare|8erebbero,incentrare|7erebbero,inceppare|6erebbero,inchiappettare|11erebbero,inchinare|6erebbero,inchiodare|7erebbero,inciampare|7erebbero,incidere|8bbero,incingere|9bbero,incipriare|7erebbero,incitare|5erebbero,inclinare|6erebbero,includere|9bbero,incollare|6erebbero,incollerire|11bbero,incombere|9bbero,incominciare|8erebbero,incomodare|7erebbero,incontrare|7erebbero,incoraggiare|8erebbero,incorniciare|8erebbero,incoronare|7erebbero,incorporare|8erebbero,incorrere|9bbero,incrementare|9erebbero,increspare|7erebbero,incriminare|8erebbero,incrinare|6erebbero,incrociare|6erebbero,incubare|5erebbero,inculare|5erebbero,inculcare|6herebbero,incuneare|6erebbero,incuriosire|11bbero,incurvare|6erebbero,incutere|8bbero,indagare|5herebbero,indebitare|7erebbero,indebolire|10bbero,indennizzare|9erebbero,indicare|5herebbero,indicizzare|8erebbero,indietreggiare|10erebbero,indignare|6erebbero,indire|6bbero,indirizzare|8erebbero,indispettire|12bbero,indisporre|10bbero,individuare|8erebbero,indossare|6erebbero,indovinare|7erebbero,indugiare|5erebbero,indulgere|9bbero,indurare|5erebbero,indurire|8bbero,indurre|7bbero,industrializzare|13erebbero,inebriare|6erebbero,infamare|5erebbero,infangare|6herebbero,infarcire|9bbero,infarinare|7erebbero,infastidire|11bbero,infatuare|6erebbero,inferire|8bbero,inferocire|10bbero,infervorare|8erebbero,infestare|6erebbero,infiacchire|11bbero,infiammare|7erebbero,infiggere|9bbero,infilare|5erebbero,infilzare|6erebbero,infinocchiare|10erebbero,infittire|9bbero,infliggere|10bbero,influenzare|8erebbero,influire|8bbero,infondere|9bbero,inforcare|6herebbero,informare|6erebbero,infornare|6erebbero,infradiciare|8erebbero,infrangere|10bbero,infreddolire|12bbero,infuocare|6herebbero,infuriare|6erebbero,ingabbiare|7erebbero,ingaggiare|6erebbero,ingannare|6erebbero,ingarbugliare|10erebbero,ingelosire|10bbero,ingentilire|11bbero,ingerire|8bbero,ingessare|6erebbero,inghiottire|11bbero,ingiallire|10bbero,ingigantire|11bbero,ingiungere|10bbero,ingiuriare|7erebbero,inglobare|6erebbero,ingobbire|9bbero,ingombrare|7erebbero,ingorgare|6herebbero,ingozzare|6erebbero,ingranare|6erebbero,ingrandire|10bbero,ingrassare|7erebbero,ingroppare|7erebbero,ingrossare|7erebbero,inguaiare|6erebbero,ingurgitare|8erebbero,inibire|7bbero,iniettare|6erebbero,inimicare|6herebbero,inizializzare|10erebbero,iniziare|5erebbero,innamorare|7erebbero,innervosire|11bbero,innescare|6herebbero,innovare|5erebbero,inoltrare|6erebbero,inondare|5erebbero,inorgoglire|11bbero,inorridire|10bbero,inquadrare|7erebbero,inquietare|7erebbero,inquinare|6erebbero,insaponare|7erebbero,insaporire|10bbero,inscenare|6erebbero,inscrivere|10bbero,insediare|6erebbero,insegnare|6erebbero,inseguire|9bbero,inserire|8bbero,insidiare|6erebbero,insignire|9bbero,insinuare|6erebbero,insistere|9bbero,insorgere|9bbero,insospettire|12bbero,inspirare|6erebbero,installare|7erebbero,instaurare|7erebbero,insudiciare|7erebbero,insultare|6erebbero,intaccare|6herebbero,intagliare|7erebbero,intarsiare|7erebbero,intasare|5erebbero,intascare|6herebbero,intavolare|7erebbero,integrare|6erebbero,intendere|9bbero,intenerire|10bbero,intensificare|10herebbero,intentare|6erebbero,intercedere|11bbero,intercorrere|12bbero,interdire|9bbero,interfacciare|9erebbero,interloquire|12bbero,interpellare|9erebbero,interporre|10bbero,interpretare|9erebbero,interrare|6erebbero,interrogare|8herebbero,interrompere|12bbero,intersecare|8herebbero,intervenire|7rrebbero,intervistare|9erebbero,intestare|6erebbero,intiepidire|11bbero,intimare|5erebbero,intimidire|10bbero,intimorire|10bbero,intingere|9bbero,intirizzire|11bbero,intitolare|7erebbero,intonacare|7herebbero,intontire|9bbero,intorbidare|8erebbero,intorbidire|11bbero,intorpidire|11bbero,intossicare|8herebbero,intralciare|7erebbero,intrappolare|9erebbero,intraprendere|13bbero,intrare|4erebbero,intrattenere|8rrebbero,intravedere|8rebbero,intrecciare|7erebbero,intridere|9bbero,intristire|10bbero,introdurre|10bbero,intromettere|12bbero,intrudere|9bbero,intrufolare|8erebbero,intuire|7bbero,inumidire|9bbero,invadere|8bbero,invalere|4rrebbero,invalidare|7erebbero,invasare|5erebbero,invecchiare|8erebbero,inveire|7bbero,inventare|6erebbero,inventariare|9erebbero,invertire|9bbero,investigare|8herebbero,investire|9bbero,inviare|4erebbero,invidiare|6erebbero,invischiare|8erebbero,invitare|5erebbero,invocare|5herebbero,invogliare|7erebbero,involgere|9bbero,involtare|6erebbero,inzuppare|6erebbero,ipnotizzare|8erebbero,ipotizzare|7erebbero,ironizzare|7erebbero,irradiare|6erebbero,irretire|8bbero,irridere|8bbero,irrigare|5herebbero,irrigidire|10bbero,irritare|5erebbero,irrobustire|11bbero,irrogare|5herebbero,irrompere|9bbero,irrorare|5erebbero,iscrivere|9bbero,ispessire|9bbero,ispezionare|8erebbero,ispirare|5erebbero,issare|3erebbero,istigare|5herebbero,istituire|9bbero,istruire|8bbero,laccare|4herebbero,lacerare|5erebbero,lacrimare|6erebbero,lamare|3erebbero,lambiccare|7herebbero,lambire|7bbero,lamentare|6erebbero,lampare|4erebbero,lampeggiare|7erebbero,lanciare|4erebbero,languire|8bbero,lapidare|5erebbero,lasciare|4erebbero,lastricare|7herebbero,latitare|5erebbero,latrare|4erebbero,lattare|4erebbero,laudare|4erebbero,laureare|5erebbero,lavare|3erebbero,lavorare|5erebbero,leccare|4herebbero,ledere|6bbero,legalizzare|8erebbero,legare|3herebbero,leggere|7bbero,legiferare|7erebbero,legittimare|8erebbero,legnare|4erebbero,lenire|6bbero,lesinare|5erebbero,lesionare|6erebbero,lessare|4erebbero,levare|3erebbero,levigare|5herebbero,libare|3erebbero,liberare|5erebbero,licenziare|7erebbero,licere|6bbero,lievitare|6erebbero,limare|3erebbero,limitare|5erebbero,limonare|5erebbero,linciare|4erebbero,lineare|4erebbero,lisciare|4erebbero,listare|4erebbero,litigare|5herebbero,livellare|6erebbero,localizzare|8erebbero,locare|3herebbero,locupletare|8erebbero,lodare|3erebbero,logorare|5erebbero,lordare|4erebbero,lottare|4erebbero,lucrare|4erebbero,luminare|5erebbero,lusingare|6herebbero,lussare|4erebbero,lustrare|5erebbero,macchiare|6erebbero,macchinare|7erebbero,macellare|6erebbero,macerare|5erebbero,macinare|5erebbero,maggiorare|7erebbero,magnare|4erebbero,magnificare|8herebbero,maledire|8bbero,malignare|6erebbero,maltrattare|8erebbero,mancare|4herebbero,mandare|4erebbero,manducare|6herebbero,maneggiare|6erebbero,manganellare|9erebbero,mangiare|4erebbero,mangiucchiare|10erebbero,manicare|5herebbero,manifestare|8erebbero,manomettere|11bbero,manovrare|6erebbero,mantenere|5rrebbero,manutenere|6rrebbero,marcare|4herebbero,marciare|4erebbero,marcire|7bbero,marinare|5erebbero,maritare|5erebbero,mascherare|7erebbero,massacrare|7erebbero,massaggiare|7erebbero,masterizzare|9erebbero,masticare|6herebbero,masturbare|7erebbero,materializzare|11erebbero,matricolare|8erebbero,mattare|4erebbero,maturare|5erebbero,mediare|4erebbero,medicare|5herebbero,memorizzare|8erebbero,menare|3erebbero,mendicare|6herebbero,menomare|5erebbero,mentire|7bbero,menzionare|7erebbero,mercanteggiare|10erebbero,mergere|7bbero,meritare|5erebbero,mescere|7bbero,mescolare|6erebbero,mestare|4erebbero,metodizzare|8erebbero,mettere|7bbero,miagolare|6erebbero,mietere|7bbero,migliorare|7erebbero,migrare|4erebbero,militare|5erebbero,millantare|7erebbero,mimare|3erebbero,mimetizzare|8erebbero,minacciare|6erebbero,minare|3erebbero,mingere|7bbero,minimizzare|8erebbero,mirare|3erebbero,miscelare|6erebbero,mischiare|6erebbero,missare|4erebbero,misturare|6erebbero,misurare|5erebbero,mitigare|5herebbero,mobilizzare|8erebbero,modellare|6erebbero,moderare|5erebbero,modernizzare|9erebbero,modificare|7herebbero,modulare|5erebbero,molare|3erebbero,molestare|6erebbero,mollare|4erebbero,moltiplicare|9herebbero,mondare|4erebbero,montare|4erebbero,mordere|7bbero,mordicchiare|9erebbero,mormorare|6erebbero,morsicare|6herebbero,mostrare|5erebbero,motivare|5erebbero,mozzare|4erebbero,mudare|3erebbero,muggire|7bbero,multare|4erebbero,mungere|7bbero,munire|6bbero,murare|3erebbero,mutare|3erebbero,mutilare|5erebbero,mutuare|4erebbero,narrare|4erebbero,nascere|7bbero,nascondere|10bbero,nastrare|5erebbero,natare|3erebbero,naturalizzare|10erebbero,naufragare|7herebbero,nauseare|5erebbero,navigare|5herebbero,negare|3herebbero,negligere|9bbero,negoziare|6erebbero,nettare|4erebbero,neutralizzare|10erebbero,nevicare|5herebbero,nicchiare|6erebbero,nidificare|7herebbero,noleggiare|6erebbero,nominare|5erebbero,normalizzare|9erebbero,notare|3erebbero,numerare|5erebbero,nuotare|4erebbero,nutrire|7bbero,obbedire|8bbero,obbligare|6herebbero,obiettare|6erebbero,obiettivare|8erebbero,obliare|4erebbero,obliterare|7erebbero,obnubilare|7erebbero,occasionare|8erebbero,occhieggiare|8erebbero,occidere|8bbero,occludere|9bbero,occorrere|9bbero,occultare|6erebbero,occupare|5erebbero,odiare|3erebbero,odorare|4erebbero,offendere|9bbero,officiare|5erebbero,offrire|7bbero,offuscare|6herebbero,oggettivare|8erebbero,olezzare|5erebbero,oliare|3erebbero,oltraggiare|7erebbero,oltrepassare|9erebbero,ombreggiare|7erebbero,omettere|8bbero,omogeneizzare|10erebbero,omologare|6herebbero,ondare|3erebbero,ondeggiare|6erebbero,ondulare|5erebbero,onorare|4erebbero,operare|4erebbero,opinare|4erebbero,opporre|7bbero,opprimere|9bbero,optare|3erebbero,orare|2erebbero,orbitare|5erebbero,ordinare|5erebbero,ordire|6bbero,orecchiare|7erebbero,organizzare|8erebbero,orgasmare|6erebbero,orientare|6erebbero,originare|6erebbero,origliare|6erebbero,orinare|4erebbero,orlare|3erebbero,ormare|3erebbero,ormeggiare|6erebbero,ornare|3erebbero,osare|2erebbero,oscillare|6erebbero,ospitare|5erebbero,ossequiare|7erebbero,osservare|6erebbero,ossessionare|9erebbero,ossidare|5erebbero,ossigenare|7erebbero,ostacolare|7erebbero,ostare|3erebbero,osteggiare|6erebbero,ostentare|6erebbero,ostruire|8bbero,ottenere|4rrebbero,ottimare|5erebbero,ottimizzare|8erebbero,ottundere|9bbero,otturare|5erebbero,ovviare|4erebbero,oziare|3erebbero,pacare|3herebbero,pacificare|7herebbero,padroneggiare|9erebbero,pagare|3herebbero,palare|3erebbero,palesare|5erebbero,palleggiare|7erebbero,palpare|4erebbero,palpitare|6erebbero,pappare|4erebbero,parafrasare|8erebbero,paragonare|7erebbero,paralizzare|8erebbero,parare|3erebbero,parcheggiare|8erebbero,pareggiare|6erebbero,parere|3rebbero,parlamentare|9erebbero,parlare|4erebbero,parodiare|6erebbero,partecipare|8erebbero,partire|7bbero,partorire|9bbero,pascere|7bbero,pascolare|6erebbero,pasquare|5erebbero,passare|4erebbero,passeggiare|7erebbero,passire|7bbero,patire|6bbero,patrocinare|8erebbero,patteggiare|7erebbero,pattinare|6erebbero,pattuire|8bbero,paventare|6erebbero,pazientare|7erebbero,pazziare|5erebbero,peccare|4herebbero,pedalare|5erebbero,peggiorare|7erebbero,pelare|3erebbero,penalizzare|8erebbero,penare|3erebbero,pendere|7bbero,pendolare|6erebbero,pensare|4erebbero,pensionare|7erebbero,penzolare|6erebbero,percepire|9bbero,percorrere|10bbero,perdere|7bbero,perdonare|6erebbero,perdurare|6erebbero,peregrinare|8erebbero,perfezionare|9erebbero,perforare|6erebbero,pericolare|7erebbero,perire|6bbero,perlustrare|8erebbero,permanere|5rrebbero,permettere|10bbero,permutare|6erebbero,pernottare|7erebbero,perorare|5erebbero,perpetrare|7erebbero,perpetuare|7erebbero,perseguire|10bbero,perseguitare|9erebbero,persistere|10bbero,personalizzare|11erebbero,personificare|10herebbero,persuadere|10bbero,pertenere|5rrebbero,perturbare|7erebbero,pervadere|9bbero,pervenire|5rrebbero,pervertire|10bbero,pesare|3erebbero,pescare|4herebbero,pestare|4erebbero,pettegolare|8erebbero,pettegoleggiare|11erebbero,pettinare|6erebbero,piacere|7bbero,piacevoleggiare|11erebbero,piagare|4herebbero,piaggiare|5erebbero,piallare|5erebbero,pianare|4erebbero,pianeggiare|7erebbero,piangere|8bbero,pianificare|8herebbero,piantare|5erebbero,piccare|4herebbero,picchiare|6erebbero,piegare|4herebbero,pigiare|3erebbero,pigliare|5erebbero,pilotare|5erebbero,piombare|5erebbero,pipare|3erebbero,piroettare|7erebbero,pisciare|4erebbero,pisolare|5erebbero,pittare|4erebbero,pizzicare|6herebbero,placare|4herebbero,plagiare|4erebbero,planare|4erebbero,plasmare|5erebbero,poggiare|4erebbero,polemizzare|8erebbero,poltrire|8bbero,polverizzare|9erebbero,ponderare|6erebbero,popolare|5erebbero,poppare|4erebbero,porgere|7bbero,porporeggiare|9erebbero,porre|5bbero,portare|4erebbero,portendere|10bbero,posare|3erebbero,posizionare|8erebbero,posporre|8bbero,postare|4erebbero,posteggiare|7erebbero,postulare|6erebbero,potare|3erebbero,potenziare|7erebbero,potere|3rebbero,pralinare|6erebbero,pranzare|5erebbero,praticare|6herebbero,preaccennare|9erebbero,precedere|9bbero,precidere|9bbero,precipitare|8erebbero,precludere|10bbero,precorrere|10bbero,predare|4erebbero,predicare|6herebbero,prediligere|11bbero,predire|7bbero,predisporre|11bbero,predominare|8erebbero,preferire|9bbero,prefiggere|10bbero,prefissare|7erebbero,pregare|4herebbero,pregiare|4erebbero,pregiudicare|9herebbero,pregustare|7erebbero,prelevare|6erebbero,premere|7bbero,premettere|10bbero,premunire|9bbero,premurare|6erebbero,prenascere|10bbero,prendere|8bbero,prenotare|6erebbero,preoccupare|8erebbero,preparare|6erebbero,prepensionare|10erebbero,preporre|8bbero,preriscaldare|10erebbero,presagire|9bbero,prescegliere|12bbero,prescrivere|11bbero,presentare|7erebbero,presentire|10bbero,presenziare|8erebbero,preservare|7erebbero,pressare|5erebbero,prestabilire|12bbero,prestare|5erebbero,presumere|9bbero,presupporre|11bbero,pretendere|10bbero,prevalere|5rrebbero,prevedere|6rebbero,prevenire|5rrebbero,preventivare|9erebbero,prezzare|5erebbero,primeggiare|7erebbero,principiare|8erebbero,privare|4erebbero,privilegiare|8erebbero,procedere|9bbero,processare|7erebbero,proclamare|7erebbero,procrastinare|10erebbero,procreare|6erebbero,procurare|6erebbero,produrre|8bbero,profanare|6erebbero,proferire|9bbero,profetizzare|9erebbero,profilare|6erebbero,profondere|10bbero,programmare|8erebbero,progredire|10bbero,proibire|8bbero,proiettare|7erebbero,promettere|10bbero,promozionare|9erebbero,promulgare|7herebbero,pronosticare|9herebbero,pronunciare|7erebbero,propagare|6herebbero,propellere|10bbero,propendere|10bbero,propinare|6erebbero,proporre|8bbero,propugnare|7erebbero,prorogare|6herebbero,prorompere|10bbero,prosciugare|8herebbero,proseguire|10bbero,prosperare|7erebbero,prospettare|8erebbero,prostituire|11bbero,proteggere|10bbero,protendere|10bbero,protestare|7erebbero,protocollare|9erebbero,protrarre|9bbero,provare|4erebbero,provenire|5rrebbero,provocare|6herebbero,provvedere|7rebbero,prudere|7bbero,pubblicare|7herebbero,pubblicizzare|10erebbero,pugnalare|6erebbero,pugnare|4erebbero,pulire|6bbero,pullulare|6erebbero,pulsare|4erebbero,pungere|7bbero,punire|6bbero,puntare|4erebbero,punteggiare|7erebbero,punzecchiare|9erebbero,purgare|4herebbero,purificare|7herebbero,putrefare|9bbero,puzzare|4erebbero,quadrare|5erebbero,qualificare|8herebbero,quantificare|9herebbero,quietare|5erebbero,quotare|4erebbero,rabbonire|9bbero,rabbrividire|12bbero,rabbuiare|6erebbero,racchiudere|11bbero,raccogliere|11bbero,raccomandare|9erebbero,raccoppiare|8erebbero,raccorciare|7erebbero,racimolare|7erebbero,raddrizzare|8erebbero,radere|6bbero,radiare|4erebbero,radicare|5herebbero,radunare|5erebbero,raffigurare|8erebbero,raffinare|6erebbero,rafforzare|7erebbero,raffreddare|8erebbero,raggiare|4erebbero,raggirare|6erebbero,raggiungere|11bbero,raggiuntare|8erebbero,raggomitolare|10erebbero,raggrinzire|11bbero,raggruppare|8erebbero,ragionare|6erebbero,ragliare|5erebbero,rallentare|7erebbero,rammaricare|8herebbero,rammendare|7erebbero,rammentare|7erebbero,rammollire|10bbero,rampicare|6herebbero,rannicchiare|9erebbero,rannuvolare|8erebbero,rantolare|6erebbero,rapinare|5erebbero,rapire|6bbero,rapprendere|11bbero,rappresentare|10erebbero,rarefare|8bbero,rasare|3erebbero,raschiare|6erebbero,raspare|4erebbero,rassegnare|7erebbero,rasserenare|8erebbero,rassicurare|8erebbero,rassodare|6erebbero,rassomigliare|10erebbero,rastrellare|8erebbero,ratificare|7herebbero,rattristare|8erebbero,ravvicinare|8erebbero,ravvisare|6erebbero,ravvivare|6erebbero,razionalizzare|11erebbero,realizzare|7erebbero,recapitare|7erebbero,recare|3herebbero,recedere|8bbero,recensire|9bbero,recepire|8bbero,recidere|8bbero,recingere|9bbero,recitare|5erebbero,reclamare|6erebbero,reclamizzare|9erebbero,reclinare|6erebbero,recludere|9bbero,recuperare|7erebbero,redare|3erebbero,redigere|8bbero,redimere|8bbero,refutare|5erebbero,regalare|5erebbero,reggere|7bbero,registrare|7erebbero,regnare|4erebbero,regolamentare|10erebbero,regolare|5erebbero,regolarizzare|10erebbero,regredire|9bbero,reinserire|10bbero,reiterare|6erebbero,relazionare|8erebbero,relegare|5herebbero,remare|3erebbero,remunerare|7erebbero,rendere|7bbero,repellere|9bbero,reperire|8bbero,replicare|6herebbero,reprimere|9bbero,reputare|5erebbero,rescindere|10bbero,resettare|6erebbero,resistere|9bbero,respingere|10bbero,respirare|6erebbero,responsabilizzare|14erebbero,restare|4erebbero,restaurare|7erebbero,restituire|10bbero,restringere|11bbero,resuscitare|8erebbero,retrarre|8bbero,retribuire|10bbero,retrocedere|11bbero,rettificare|8herebbero,revisionare|8erebbero,revocare|5herebbero,riabbassare|8erebbero,riabbracciare|9erebbero,riabilitare|8erebbero,riabituare|7erebbero,riaccadere|7rebbero,riaccendere|11bbero,riaccompagnare|11erebbero,riacquistare|9erebbero,riaddormentare|11erebbero,riaffermare|8erebbero,riagganciare|8erebbero,riallacciare|8erebbero,rialzare|5erebbero,rianimare|6erebbero,riapparire|10bbero,riappendere|11bbero,riaprire|8bbero,riardere|8bbero,riascoltare|8erebbero,riassicurare|9erebbero,riassorbire|11bbero,riassumere|10bbero,riattaccare|8herebbero,riattivare|7erebbero,riavvicinare|9erebbero,riavvolgere|11bbero,ribadire|8bbero,ribaltare|6erebbero,ribattere|9bbero,ribattezzare|9erebbero,ribellare|6erebbero,ribollire|9bbero,ributtare|6erebbero,ricacciare|6erebbero,ricadere|5rebbero,ricalcare|6herebbero,ricamare|5erebbero,ricambiare|7erebbero,ricapitolare|9erebbero,ricaricare|7herebbero,ricattare|6erebbero,ricavare|5erebbero,ricedere|8bbero,ricercare|6herebbero,ricettare|6erebbero,ricevere|8bbero,richiamare|7erebbero,richiedere|10bbero,ricogliere|10bbero,ricollegare|8herebbero,ricominciare|8erebbero,ricompensare|9erebbero,ricomporre|10bbero,ricomprare|7erebbero,riconciliare|9erebbero,ricondurre|10bbero,riconfermare|9erebbero,riconfortare|9erebbero,ricongiungere|13bbero,riconoscere|11bbero,riconquistare|10erebbero,riconsegnare|9erebbero,riconsiderare|10erebbero,ricontare|6erebbero,ricontattare|9erebbero,ricopiare|6erebbero,ricoprire|9bbero,ricordare|6erebbero,ricoricare|7herebbero,ricorrere|9bbero,ricostituire|12bbero,ricostruire|11bbero,ricreare|5erebbero,ricredere|9bbero,ricrescere|10bbero,ricucire|8bbero,ricusare|5erebbero,riddare|4erebbero,ridefinire|10bbero,ridere|6bbero,ridestare|6erebbero,rideterminare|10erebbero,ridicolizzare|10erebbero,ridimensionare|11erebbero,ridipingere|11bbero,ridire|6bbero,ridistribuire|13bbero,ridivenire|6rrebbero,ridiventare|8erebbero,riducere|4rrebbero,riecheggiare|8erebbero,rielaborare|8erebbero,rieleggere|10bbero,riempire|8bbero,rientrare|6erebbero,riepilogare|8herebbero,riesaminare|8erebbero,riesumare|6erebbero,rievocare|6herebbero,riferire|8bbero,rifilare|5erebbero,rifinire|8bbero,rifiorire|9bbero,rifiutare|6erebbero,riflettere|10bbero,rifluire|8bbero,rifocillare|8erebbero,rifondare|6erebbero,riformare|6erebbero,rifornire|9bbero,rifuggire|9bbero,rifulgere|9bbero,rigare|3herebbero,rigenerare|7erebbero,rigettare|6erebbero,rigirare|5erebbero,riguadagnare|9erebbero,riguardare|7erebbero,rilanciare|6erebbero,rilasciare|6erebbero,rilassare|6erebbero,rilegare|5herebbero,rileggere|9bbero,rilevare|5erebbero,rimandare|6erebbero,rimanere|4rrebbero,rimangiare|6erebbero,rimarginare|8erebbero,rimasticare|8herebbero,rimbalzare|7erebbero,rimbambire|10bbero,rimboccare|7herebbero,rimbombare|7erebbero,rimborsare|7erebbero,rimembrare|7erebbero,rimenare|5erebbero,rimescolare|8erebbero,rimestare|6erebbero,rimettere|9bbero,rimirare|5erebbero,rimontare|6erebbero,rimorchiare|8erebbero,rimordere|9bbero,rimpiazzare|8erebbero,rimpicciolire|13bbero,rimpinguare|8erebbero,rimpinzare|7erebbero,rimproverare|9erebbero,rinascere|9bbero,rincarare|6erebbero,rincasare|6erebbero,rinchiudere|11bbero,rincoglionire|13bbero,rincominciare|9erebbero,rincontrare|8erebbero,rincrescere|11bbero,rincuorare|7erebbero,rinevicare|7herebbero,rinfrancare|8herebbero,ringiovanire|12bbero,rinnegare|6herebbero,rinnovare|6erebbero,rintombare|7erebbero,rinunciare|6erebbero,rinverdire|10bbero,rinviare|5erebbero,rinvigorire|11bbero,riordinare|7erebbero,riorganizzare|10erebbero,ripagare|5herebbero,riparare|5erebbero,ripartire|9bbero,ripassare|6erebbero,ripatire|8bbero,ripensare|6erebbero,ripescare|6herebbero,ripetere|8bbero,ripiegare|6herebbero,riporre|7bbero,riportare|6erebbero,riposare|5erebbero,riprendere|10bbero,ripresentare|9erebbero,ripristinare|9erebbero,riprodurre|10bbero,riproporre|10bbero,riprovare|6erebbero,ripudiare|6erebbero,ripugnare|6erebbero,risalire|8bbero,risaltare|6erebbero,risanare|5erebbero,risapere|5rebbero,risarcire|9bbero,riscaldare|7erebbero,riscattare|7erebbero,rischiarare|8erebbero,rischiare|6erebbero,risciacquare|9erebbero,riscontrare|8erebbero,riscoprire|10bbero,riscrivere|10bbero,risentire|9bbero,riservare|6erebbero,riservire|9bbero,risiedere|9bbero,risollevare|8erebbero,risolvere|9bbero,risorgere|9bbero,rispecchiare|9erebbero,rispedire|9bbero,rispettare|7erebbero,rispiegare|7herebbero,rispingere|10bbero,risplendere|11bbero,rispolverare|9erebbero,rispondere|10bbero,risposare|6erebbero,rissare|4erebbero,ristabilire|11bbero,ristagnare|7erebbero,ristorare|6erebbero,ristringere|11bbero,ristrutturare|10erebbero,risultare|6erebbero,risuonare|6erebbero,risvegliare|8erebbero,ritagliare|7erebbero,ritardare|6erebbero,ritelefonare|9erebbero,ritenere|4rrebbero,ritentare|6erebbero,ritirare|5erebbero,ritmare|4erebbero,ritoccare|6herebbero,ritonare|5erebbero,ritorcere|9bbero,ritornare|6erebbero,ritrarre|8bbero,ritrasmettere|13bbero,ritrattare|7erebbero,ritrovare|6erebbero,riunire|7bbero,riuscire|8bbero,riutilizzare|9erebbero,rivaleggiare|8erebbero,rivalutare|7erebbero,rivedere|5rebbero,rivelare|5erebbero,rivendere|9bbero,rivendicare|8herebbero,rivenire|4rrebbero,riverberare|8erebbero,riverire|8bbero,riversare|6erebbero,rivestire|9bbero,rivincere|9bbero,rivisitare|7erebbero,rivivere|5rebbero,rivolare|5erebbero,rivolgere|9bbero,rivoltare|6erebbero,rivoluzionare|10erebbero,rivolvere|9bbero,rizzare|4erebbero,rodare|3erebbero,rogare|3herebbero,rombare|4erebbero,rompere|7bbero,roncare|4erebbero,ronfare|4erebbero,ronzare|4erebbero,rosicare|5herebbero,rosicchiare|8erebbero,rosolare|5erebbero,rotolare|5erebbero,rottamare|6erebbero,rovesciare|6erebbero,rovinare|5erebbero,rovistare|6erebbero,rubare|3erebbero,ruggire|7bbero,ruminare|5erebbero,rumoreggiare|8erebbero,ruotare|4erebbero,russare|4erebbero,ruttare|4erebbero,ruzzolare|6erebbero,sabotare|5erebbero,saccheggiare|8erebbero,sacrificare|8herebbero,saettare|5erebbero,saggiare|4erebbero,sagomare|5erebbero,salare|3erebbero,saldare|4erebbero,salire|6bbero,salivare|5erebbero,salpare|4erebbero,saltare|4erebbero,saltellare|7erebbero,salutare|5erebbero,salvaguardare|10erebbero,salvare|4erebbero,sanare|3erebbero,sancire|7bbero,sanguinare|7erebbero,santificare|8herebbero,sapere|3rebbero,saponificare|9herebbero,saporare|5erebbero,saporire|8bbero,saturare|5erebbero,saziare|4erebbero,sbadigliare|8erebbero,sbagliare|6erebbero,sbaiaffare|7erebbero,sballare|5erebbero,sballottare|8erebbero,sbalordire|10bbero,sbalzare|5erebbero,sbancare|5herebbero,sbandare|5erebbero,sbaragliare|8erebbero,sbarazzare|7erebbero,sbarbare|5erebbero,sbarrare|5erebbero,sbattere|8bbero,sbavare|4erebbero,sbiadire|8bbero,sbiancare|6herebbero,sbilanciare|7erebbero,sbirciare|5erebbero,sbizzarrire|11bbero,sbloccare|6herebbero,sboccare|5herebbero,sbocciare|5erebbero,sbollentare|8erebbero,sborniare|6erebbero,sborrare|5erebbero,sborsare|5erebbero,sbottare|5erebbero,sbottonare|7erebbero,sbraitare|6erebbero,sbranare|5erebbero,sbrigare|5herebbero,sbrinare|5erebbero,sbrodolare|7erebbero,sbucare|4herebbero,sbucciare|5erebbero,sbudellare|7erebbero,sburrare|5erebbero,scacciare|5erebbero,scadenzare|7erebbero,scadere|7bbero,scagionare|7erebbero,scagliare|6erebbero,scalare|4erebbero,scalciare|5erebbero,scaldare|5erebbero,scalfire|8bbero,scalpitare|7erebbero,scalzare|5erebbero,scambiare|6erebbero,scampare|5erebbero,scandagliare|9erebbero,scandalizzare|10erebbero,scandire|8bbero,scannare|5erebbero,scansare|5erebbero,scapare|4erebbero,scappare|5erebbero,scaraventare|9erebbero,scaricare|6herebbero,scarseggiare|8erebbero,scartare|5erebbero,scaturire|9bbero,scavalcare|7herebbero,scavare|4erebbero,scazzare|5erebbero,scegliere|9bbero,scellerare|7erebbero,scemare|4erebbero,scendere|8bbero,sceneggiare|7erebbero,scernere|8bbero,schedare|5erebbero,scheggiare|6erebbero,schermire|9bbero,schernire|9bbero,scherzare|6erebbero,schiacciare|7erebbero,schiaffare|7erebbero,schiaffeggiare|10erebbero,schiamazzare|9erebbero,schiantare|7erebbero,schiarire|9bbero,schiavizzare|9erebbero,schierare|6erebbero,schifare|5erebbero,schioccare|7herebbero,schiudere|9bbero,schivare|5erebbero,schizzare|6erebbero,sciacquare|7erebbero,sciamare|5erebbero,sciare|3erebbero,scimmiottare|9erebbero,scindere|8bbero,scintillare|8erebbero,scioccare|6herebbero,sciogliere|10bbero,scioperare|7erebbero,scipare|4erebbero,scipidire|9bbero,scippare|5erebbero,sciupare|5erebbero,scivolare|6erebbero,scoccare|5herebbero,scocciare|5erebbero,scodellare|7erebbero,scoglionare|8erebbero,scolare|4erebbero,scollare|5erebbero,scollegare|7herebbero,scolpare|5erebbero,scolpire|8bbero,scombussolare|10erebbero,scommettere|11bbero,scomparire|10bbero,scompigliare|9erebbero,scomporre|9bbero,scomunicare|8herebbero,sconfessare|8erebbero,sconfiggere|11bbero,sconfinare|7erebbero,scongelare|7erebbero,scongiurare|8erebbero,sconnettere|11bbero,sconoscere|10bbero,sconquassare|9erebbero,sconsigliare|9erebbero,scontentare|8erebbero,scontrare|6erebbero,sconvolgere|11bbero,scoordinare|8erebbero,scopare|4erebbero,scoperchiare|9erebbero,scopiazzare|8erebbero,scoppiare|6erebbero,scoppiettare|9erebbero,scoprire|8bbero,scoraggiare|7erebbero,scorciare|5erebbero,scordare|5erebbero,scoreggiare|7erebbero,scorgere|8bbero,scorrere|8bbero,scortare|5erebbero,scortecciare|8erebbero,scoscendere|11bbero,scottare|5erebbero,scritturare|8erebbero,scrivere|8bbero,scrollare|6erebbero,scrosciare|6erebbero,scrutare|5erebbero,sculacciare|7erebbero,scuoiare|5erebbero,scurare|4erebbero,scurire|7bbero,scusare|4erebbero,sdegnare|5erebbero,sdoganare|6erebbero,sdraiare|5erebbero,sdrucciolare|9erebbero,secare|3herebbero,seccare|4herebbero,secernere|9bbero,secondare|6erebbero,sedare|3erebbero,sedentarizzare|11erebbero,sedurre|7bbero,segare|3herebbero,segnalare|6erebbero,segnare|4erebbero,segregare|6herebbero,seguire|7bbero,seguitare|6erebbero,selciare|4erebbero,selezionare|8erebbero,sembrare|5erebbero,seminare|5erebbero,semplificare|9herebbero,sensibilizzare|11erebbero,sentire|7bbero,separare|5erebbero,seppellire|10bbero,seppiare|5erebbero,serbare|4erebbero,serenare|5erebbero,serpeggiare|7erebbero,serrare|4erebbero,servire|7bbero,sessare|4erebbero,setacciare|6erebbero,sezionare|6erebbero,sfacchinare|8erebbero,sfamare|4erebbero,sfare|5bbero,sfasciare|5erebbero,sferzare|5erebbero,sfidare|4erebbero,sfiduciare|6erebbero,sfigurare|6erebbero,sfilare|4erebbero,sfinire|7bbero,sfiorare|5erebbero,sfiorire|8bbero,sfociare|4erebbero,sfogare|4herebbero,sfogliare|6erebbero,sfollare|5erebbero,sfoltire|8bbero,sfondare|5erebbero,sforare|4erebbero,sfornare|5erebbero,sforzare|5erebbero,sfottere|8bbero,sfrecciare|6erebbero,sfregare|5herebbero,sfregiare|5erebbero,sfrigolare|7erebbero,sfruttare|6erebbero,sfuggire|8bbero,sfumare|4erebbero,sgambettare|8erebbero,sganciare|5erebbero,sgattaiolare|9erebbero,sgelare|4erebbero,sgobbare|5erebbero,sgocciolare|8erebbero,sgomberare|7erebbero,sgombrare|6erebbero,sgomentare|7erebbero,sgominare|6erebbero,sgonfiare|6erebbero,sgorgare|5herebbero,sgozzare|5erebbero,sgranare|5erebbero,sgranchire|10bbero,sgridare|5erebbero,sguazzare|6erebbero,sgusciare|5erebbero,sibilare|5erebbero,sigillare|6erebbero,significare|8herebbero,sillabare|6erebbero,simboleggiare|9erebbero,simbolizzare|9erebbero,simpatizzare|9erebbero,simulare|5erebbero,sincronizzare|10erebbero,sindacare|6herebbero,singhiozzare|9erebbero,sintetizzare|9erebbero,sintonizzare|9erebbero,sistemare|6erebbero,situare|4erebbero,slacciare|5erebbero,slanciare|5erebbero,slegare|4herebbero,slittare|5erebbero,smagrire|8bbero,smaltare|5erebbero,smaltire|8bbero,smaniare|5erebbero,smantellare|8erebbero,smarrire|8bbero,smascherare|8erebbero,smentire|8bbero,smettere|8bbero,sminuzzare|7erebbero,smistare|5erebbero,smontare|5erebbero,sniffare|5erebbero,snobbare|5erebbero,snocciolare|8erebbero,snodare|4erebbero,sobbalzare|7erebbero,sobbollire|10bbero,socchiudere|11bbero,soccombere|10bbero,soccorrere|10bbero,socializzare|9erebbero,soddisfare|10bbero,sodomizzare|8erebbero,soffermare|7erebbero,soffiare|5erebbero,soffocare|6herebbero,soffriggere|11bbero,soffrire|8bbero,sogghignare|8erebbero,soggiacere|10bbero,soggiogare|7herebbero,soggiungere|11bbero,sognare|4erebbero,solcare|4herebbero,soleggiare|6erebbero,sollecitare|8erebbero,solleticare|8herebbero,sollevare|6erebbero,solvere|7bbero,somatizzare|8erebbero,somigliare|7erebbero,sommare|4erebbero,sommergere|10bbero,sommettere|10bbero,somministrare|10erebbero,sondare|4erebbero,sonnecchiare|9erebbero,sopire|6bbero,sopperire|9bbero,sopportare|7erebbero,sopprimere|10bbero,sopraggiungere|14bbero,soprannominare|11erebbero,sopravanzare|9erebbero,sopravvalutare|11erebbero,sopravvenire|8rrebbero,sopravvivere|9rebbero,soprintendere|13bbero,sorbire|7bbero,sorgere|7bbero,sormontare|7erebbero,sorpassare|7erebbero,sorprendere|11bbero,sorreggere|10bbero,sorridere|9bbero,sorseggiare|7erebbero,sorteggiare|7erebbero,sortire|7bbero,sorvegliare|8erebbero,sorvolare|6erebbero,sospendere|10bbero,sospettare|7erebbero,sospingere|10bbero,sospirare|6erebbero,sostantivare|9erebbero,sostenere|5rrebbero,sostentare|7erebbero,sostituire|10bbero,sottacere|9bbero,sottendere|10bbero,sotterrare|7erebbero,sottintendere|13bbero,sottolineare|9erebbero,sottomettere|12bbero,sottoporre|10bbero,sottoscrivere|13bbero,sottostare|10bbero,sottovalutare|10erebbero,sottrarre|9bbero,soverchiare|8erebbero,sovraccaricare|11herebbero,sovrapporre|11bbero,sovrastare|7erebbero,sovrintendere|13bbero,sovvenire|5rrebbero,sovvenzionare|10erebbero,sovvertire|10bbero,spaccare|5herebbero,spacciare|5erebbero,spagliare|6erebbero,spalancare|7herebbero,spalare|4erebbero,spalleggiare|8erebbero,spandere|8bbero,sparare|4erebbero,sparecchiare|9erebbero,sparere|4rebbero,spargere|8bbero,sparire|7bbero,sparlare|5erebbero,spartire|8bbero,spassare|5erebbero,spaurire|8bbero,spaventare|7erebbero,spaziare|5erebbero,spazientire|11bbero,spazzare|5erebbero,spazzolare|7erebbero,specchiare|7erebbero,specializzare|10erebbero,specificare|8herebbero,speculare|6erebbero,spedire|7bbero,spegnere|8bbero,spelagare|6herebbero,spelare|4erebbero,spellare|5erebbero,spendere|8bbero,spennare|5erebbero,sperare|4erebbero,spergere|8bbero,spettare|5erebbero,spettinare|7erebbero,spezzare|5erebbero,spiaccicare|8herebbero,spiaggiare|6erebbero,spianare|5erebbero,spiare|3erebbero,spiazzare|6erebbero,spiccare|5herebbero,spiegare|5herebbero,spigolare|6erebbero,spillare|5erebbero,spingere|8bbero,spirare|4erebbero,splendere|9bbero,spodestare|7erebbero,spogliare|6erebbero,spolverare|7erebbero,spolverizzare|10erebbero,sponsorizzare|10erebbero,sporcare|5herebbero,sporgere|8bbero,sposare|4erebbero,spostare|5erebbero,sprangare|6herebbero,sprecare|5herebbero,spregiare|5erebbero,spremere|8bbero,sprezzare|6erebbero,sprigionare|8erebbero,sprofondare|8erebbero,sproloquiare|9erebbero,spronare|5erebbero,spruzzare|6erebbero,spumare|4erebbero,spuntare|5erebbero,sputacchiare|9erebbero,squadrare|6erebbero,squagliare|7erebbero,squalificare|9herebbero,squarciare|6erebbero,squartare|6erebbero,squassare|6erebbero,sradicare|6herebbero,stabilire|9bbero,stabilizzare|9erebbero,staccare|5herebbero,stacciare|5erebbero,stagliare|6erebbero,stagnare|5erebbero,stallare|5erebbero,stampare|5erebbero,stanare|4erebbero,stancare|5herebbero,stangare|5herebbero,stappare|5erebbero,starnazzare|8erebbero,starnutare|7erebbero,starnutire|10bbero,statuire|8bbero,stazionare|7erebbero,stellare|5erebbero,stemperare|7erebbero,stendere|8bbero,stentare|5erebbero,sterilizzare|9erebbero,sterminare|7erebbero,stigmatizzare|10erebbero,stilare|4erebbero,stillare|5erebbero,stimare|4erebbero,stimolare|6erebbero,stingere|8bbero,stipare|4erebbero,stipendiare|8erebbero,stipulare|6erebbero,stirare|4erebbero,stivare|4erebbero,stizzire|8bbero,stoccare|5herebbero,stoppare|5erebbero,storcere|8bbero,stordire|8bbero,stornare|5erebbero,storpiare|6erebbero,strabiliare|8erebbero,stracciare|6erebbero,strafare|8bbero,strangolare|8erebbero,straniare|6erebbero,strapazzare|8erebbero,strappare|6erebbero,straripare|7erebbero,strascicare|8herebbero,strattonare|8erebbero,stravedere|7rebbero,stravincere|11bbero,stravolgere|11bbero,stregare|5herebbero,stridere|8bbero,strigliare|7erebbero,stringere|9bbero,strisciare|6erebbero,stritolare|7erebbero,strizzare|6erebbero,strofinare|7erebbero,stronzare|6erebbero,strozzare|6erebbero,struggere|9bbero,strusciare|6erebbero,strutturare|8erebbero,stuccare|5herebbero,studiare|5erebbero,stufare|4erebbero,stupefare|9bbero,stupire|7bbero,stuprare|5erebbero,stuzzicare|7herebbero,subaffittare|9erebbero,subentrare|7erebbero,subire|6bbero,sublimare|6erebbero,subordinare|8erebbero,succedere|9bbero,succhiare|6erebbero,sudare|3erebbero,suddividere|11bbero,suffragare|7herebbero,suggellare|7erebbero,suggerire|9bbero,suicidare|6erebbero,sumere|6bbero,sunteggiare|7erebbero,suolare|4erebbero,suonare|4erebbero,superare|5erebbero,supervalutare|10erebbero,supplicare|7herebbero,supplire|8bbero,supporre|8bbero,supportare|7erebbero,surgelare|6erebbero,surrogare|6herebbero,suscitare|6erebbero,susseguire|10bbero,sussidiare|7erebbero,sussistere|10bbero,sussurrare|7erebbero,svagare|4herebbero,svaligiare|6erebbero,svalutare|6erebbero,svariare|5erebbero,svecchiare|7erebbero,svegliare|6erebbero,svelare|4erebbero,svellere|8bbero,sveltire|8bbero,svenare|4erebbero,svendere|8bbero,svenire|3rrebbero,sventare|5erebbero,sventrare|6erebbero,sverginare|7erebbero,svernare|5erebbero,svestire|8bbero,svezzare|5erebbero,sviare|3erebbero,svignare|5erebbero,sviluppare|7erebbero,svincolare|7erebbero,svolare|4erebbero,svolazzare|7erebbero,svolgere|8bbero,svoltare|5erebbero,svuotare|5erebbero,taccare|4herebbero,tacere|6bbero,tacitare|5erebbero,tagliare|5erebbero,tangere|7bbero,tappare|4erebbero,tarare|3erebbero,tardare|4erebbero,tartagliare|8erebbero,tassare|4erebbero,tastare|4erebbero,tediare|4erebbero,telegrafare|8erebbero,teleguidare|8erebbero,telematizzare|10erebbero,tematizzare|8erebbero,temere|6bbero,temperare|6erebbero,tempestare|7erebbero,temporeggiare|9erebbero,temprare|5erebbero,tendere|7bbero,tenere|2rrebbero,tentare|4erebbero,tergere|7bbero,tergiversare|9erebbero,terminare|6erebbero,terrorizzare|9erebbero,tesare|3erebbero,tessere|7bbero,testimoniare|9erebbero,tifare|3erebbero,tingere|7bbero,tinteggiare|7erebbero,tirare|3erebbero,titolare|5erebbero,titubare|5erebbero,toccare|4herebbero,togliere|8bbero,tollerare|6erebbero,torcere|7bbero,tormentare|7erebbero,tornare|4erebbero,torrefare|9bbero,torturare|6erebbero,tosare|3erebbero,tossire|7bbero,totalizzare|8erebbero,traballare|7erebbero,traboccare|7herebbero,tracannare|7erebbero,tracciare|5erebbero,tradire|7bbero,tradurre|8bbero,trafficare|7herebbero,trafiggere|10bbero,trafugare|6herebbero,trainare|5erebbero,tralasciare|7erebbero,tramandare|7erebbero,tramare|4erebbero,tramettere|10bbero,tramontare|7erebbero,tramutare|6erebbero,trangugiare|7erebbero,tranquillare|9erebbero,tranquillizzare|12erebbero,transigere|10bbero,trapanare|6erebbero,trapassare|7erebbero,trapelare|6erebbero,trapiantare|8erebbero,trarre|6bbero,trarupare|6erebbero,trasalire|9bbero,trasbordare|8erebbero,trascendere|11bbero,trascinare|7erebbero,trascorrere|11bbero,trascrivere|11bbero,trascurare|7erebbero,trasferire|10bbero,trasfigurare|9erebbero,trasfondere|11bbero,trasformare|8erebbero,trasgredire|11bbero,traslocare|7herebbero,trasmettere|11bbero,trasparire|10bbero,traspirare|7erebbero,trasporre|9bbero,trasportare|8erebbero,trattare|5erebbero,tratteggiare|8erebbero,trattenere|6rrebbero,traumatizzare|10erebbero,travagliare|8erebbero,travalcare|7herebbero,travalicare|8herebbero,travasare|6erebbero,traversare|7erebbero,travestire|10bbero,traviare|5erebbero,travolgere|10bbero,trebbiare|6erebbero,tremare|4erebbero,tremolare|6erebbero,trepidare|6erebbero,tribolare|6erebbero,tributare|6erebbero,trillare|5erebbero,trincare|5herebbero,trionfare|6erebbero,triplicare|7herebbero,tritare|4erebbero,triturare|6erebbero,trogliare|6erebbero,trombare|5erebbero,trombizzare|8erebbero,troneggiare|7erebbero,trottare|5erebbero,trottolare|7erebbero,trovare|4erebbero,truccare|5herebbero,trucidare|6erebbero,tuffare|4erebbero,tuonare|4erebbero,turare|3erebbero,turbare|4erebbero,turbinare|6erebbero,tutelare|5erebbero,ubbidire|8bbero,ubriacare|6herebbero,uccellare|6erebbero,uccellinare|8erebbero,uccidere|8bbero,ufficializzare|11erebbero,ululare|4erebbero,umiliare|5erebbero,ungere|6bbero,unificare|6herebbero,uniformare|7erebbero,unire|5bbero,untare|3erebbero,urgere|6bbero,urinare|4erebbero,urlare|3erebbero,urtare|3erebbero,usare|2erebbero,usciolare|6erebbero,uscire|6bbero,ustolare|5erebbero,usurpare|5erebbero,utilizzare|7erebbero,vacare|3herebbero,vacillare|6erebbero,vagabondare|8erebbero,vagare|3herebbero,vagheggiare|7erebbero,vagire|6bbero,vagliare|5erebbero,valere|2rrebbero,valicare|5herebbero,valorizzare|8erebbero,valutare|5erebbero,vaneggiare|6erebbero,vangare|4herebbero,vanificare|7herebbero,vantare|4erebbero,varcare|4herebbero,variare|4erebbero,vedere|3rebbero,vedovare|5erebbero,vegetare|5erebbero,vegliare|5erebbero,veicolare|6erebbero,velare|3erebbero,veleggiare|6erebbero,velocizzare|8erebbero,venare|3erebbero,vendemmiare|8erebbero,vendere|7bbero,vendicare|6herebbero,venerare|5erebbero,vengiare|4erebbero,venire|2rrebbero,ventilare|6erebbero,verbalizzare|9erebbero,vergare|4herebbero,vergere|7bbero,vergognare|7erebbero,verificare|7herebbero,vernare|4erebbero,verniciare|6erebbero,versare|4erebbero,vertere|7bbero,vessare|4erebbero,vestire|7bbero,vetrificare|8herebbero,vetrioleggiare|10erebbero,vezzeggiare|7erebbero,viaggiare|5erebbero,vibrare|4erebbero,vicinare|5erebbero,vidimare|5erebbero,vietare|4erebbero,vigilare|5erebbero,vigliare|5erebbero,villeggiare|7erebbero,vincere|7bbero,vincolare|6erebbero,violare|4erebbero,violentare|7erebbero,virare|3erebbero,visionare|6erebbero,visitare|5erebbero,vistare|4erebbero,visualizzare|9erebbero,vituperare|7erebbero,vivere|3rebbero,vivificare|7herebbero,viziare|4erebbero,vocare|3herebbero,vociare|3erebbero,vogare|3herebbero,volantinare|8erebbero,volare|3erebbero,volatilizzare|10erebbero,volere|2rrebbero,volgarizzare|9erebbero,volgere|7bbero,voltare|4erebbero,volteggiare|7erebbero,volvere|7bbero,vomitare|5erebbero,vorare|3erebbero,votare|3erebbero,vuotare|4erebbero,zampettare|7erebbero,zampillare|7erebbero,zappare|4erebbero,zelare|3erebbero,zimbellare|7erebbero,zoccolare|6erebbero,zoppicare|6herebbero,zuccherare|7erebbero,zufolare|5erebbero",
        "rev": "veranno|3e"
      }
    },
    "gerunds": {
      "gerunds": {
        "rules": "terdire|5cendo,aledire|5cendo,enedire|5cendo,ibere|3vendo,atchare|1chando,trafare|5cendo,darsene|2ndosene,empire|4endo,trabere|5vendo,addire|4cendo,sfare|3cendo,efare|3cendo,trarre|3endo,durre|2cendo,porre|2nendo,ire|endo,re|ndo,erci|1ndoci",
        "exceptions": "bere|2vendo,boglire|5endo,bullizzare|6ando,contraffare|9cendo,dire|2cendo,fare|2cendo,impecettare|5attando,impedantire|spendantendo,indire|4cendo,malfare|5cendo,pinneggiare|8iando,predire|5cendo,raggrovigliare|10ando,ricontraffare|11cendo,ridire|4cendo,riespugnare|2pugnando,rifare|4cendo,rimeggiare|7iando,rimpecettare|6attando,rinchiocciolire|inchiocciolendo,rinfierire|infierendo,rintoppare|intoppando,rinverniciare|2verniciando,rivalicare|tivalicando,sdire|3cendo,sopraffare|8cendo,teletrasmettere|8ettendo,abbellire|6endo,abdurre|4cendo,aborrire|5endo,addire|4cendo,addolcire|6endo,addurre|4cendo,adire|2endo,affievolire|8endo,aggredire|6endo,ammattire|6endo,ammollire|6endo,apparire|5endo,appiacevolire|10endo,appiattire|7endo,approfondire|9endo,arruvidire|7endo,autoprodurre|9cendo,autoridurre|8cendo,avvertire|6endo,bandire|4endo,blandire|5endo,bollire|4endo,candire|4endo,capire|3endo,circondurre|8cendo,comparire|6endo,condire|4endo,condurre|5cendo,contraddire|9cendo,convertire|7endo,coprodurre|7cendo,dedurre|4cendo,disacidire|7endo,disparire|6endo,disseppellire|10endo,disservire|7endo,divertire|6endo,empire|4endo,erudire|4endo,esordire|5endo,fedire|3endo,fuggire|4endo,gradire|4endo,gremire|4endo,imbastardire|9endo,imbellire|6endo,imbiondire|7endo,imbottire|6endo,immucidire|7endo,impallidire|8endo,impedire|5endo,impensierire|9endo,imputridire|8endo,inacidire|6endo,inacutire|6endo,inaridire|6endo,incancherire|9endo,incrudire|6endo,indispettire|9endo,indolcire|6endo,indurre|4cendo,infingardire|9endo,inflaccidire|9endo,infreddolire|9endo,infrollire|7endo,ingagliardire|10endo,inghiottire|8endo,ingrandire|7endo,ingrigire|6endo,inorridire|7endo,insordire|6endo,insospettire|9endo,inspessire|7endo,interdire|7cendo,intristire|7endo,introdurre|7cendo,inverdire|6endo,invertire|6endo,inviscidire|8endo,irruvidire|7endo,ispessire|6endo,languire|5endo,largire|4endo,maledire|6cendo,muggire|4endo,olire|2endo,ordire|3endo,orrire|3endo,padire|3endo,perdurre|5cendo,pervertire|7endo,preavvertire|9endo,produrre|5cendo,progredire|7endo,putire|3endo,rabbrividire|9endo,raddolcire|7endo,rammollire|7endo,rancidire|6endo,rapire|3endo,regredire|6endo,reintrodurre|9cendo,riabbellire|8endo,riammollire|8endo,riapparire|7endo,riavvertire|8endo,ribandire|6endo,ribenedire|8cendo,ribere|4vendo,ribollire|6endo,ricondire|6endo,ricondurre|7cendo,ricontraddire|11cendo,riconvertire|9endo,riempire|6endo,rifuggire|6endo,rimbellire|7endo,rimbiondire|8endo,rimputridire|9endo,rimuggire|6endo,rincrudire|7endo,rindolcire|7endo,rinfingardire|10endo,ringhiottire|9endo,ringrandire|8endo,rintristire|8endo,rinverdire|7endo,rinvertire|7endo,riordire|5endo,riprodurre|7cendo,riseppellire|9endo,riservire|6endo,risovvertire|9endo,rispedire|6endo,ritradire|6endo,ritradurre|7cendo,ritrasgredire|10endo,riudire|4endo,ruggire|4endo,sbalordire|7endo,scandire|5endo,schernire|6endo,scomparire|7endo,sedurre|4cendo,seppellire|7endo,servire|4endo,sfuggire|5endo,sgagliardire|9endo,sgradire|5endo,sobbollire|7endo,sovvertire|7endo,spedire|4endo,stordire|5endo,strabere|6vendo,trabere|5vendo,tradire|4endo,tradurre|5cendo,trasdurre|6cendo,trasgredire|8endo,trasparire|7endo,udire|2endo",
        "rev": "rutendo|3ire,canendo|3ire,cudendo|3ire,derendo|3ire,annendo|3ire,encendo|3ire,mutendo|3ire,rguendo|3ire,ostendo|3ire,tutendo|3ire,oppendo|3ire,asendo|2ire,lizando|3zare,arpendo|3ire,rcuendo|3ire,todendo|3ire,lutendo|3ire,molendo|3ire,ercendo|3ire,ioendo|2ire,ranendo|3ire,adrendo|3ire,ialendo|3ire,olsendo|3ire,hesendo|3ire,falendo|3ire,butendo|3ire,renendo|3ire,betendo|3ire,tidendo|3ire,rocendo|3ire,obbendo|3ire,oglendo|3ire,nolendo|3ire,oquendo|3ire,nveendo|3ire,garendo|3ire,retendo|3ire,ustendo|3ire,aidendo|3ire,iglando|3iare,vanendo|3ire,ullendo|3ire,ancendo|3ire,iadendo|3ire,turendo|3ire,achando|1tchare,aggendo|3ire,ubendo|2ire,pplendo|3ire,ampendo|3ire,bonendo|3ire,tolendo|3ire,bolendo|3ire,errendo|3ire,ulendo|2ire,itendo|2ire,bedendo|3ire,ornendo|3ire,ugnendo|3ire,uarendo|3ire,barendo|3ire,ognendo|3ire,tivendo|3ire,lerendo|3ire,delendo|3ire,durendo|3ire,ittendo|3ire,ignendo|3ire,gidendo|3ire,ffrendo|3ire,giiando|2are,badendo|3ire,ionendo|3ire,curendo|3ire,uisendo|3ire,conendo|3ire,monendo|3ire,assendo|3ire,ossendo|3ire,astendo|3ire,iarendo|3ire,olpendo|3ire,cucendo|3ire,uscendo|3ire,arnendo|3ire,iolendo|3ire,colendo|3ire,grendo|2ire,ronendo|3ire,nutendo|3ire,lenendo|3ire,ambendo|3ire,sopendo|3ire,ortendo|3ire,nsendo|2ire,nerendo|3ire,nuendo|2ire,audendo|3ire,salendo|3ire,upendo|2ire,aurendo|3ire,arrendo|3ire,verendo|3ire,ltendo|2ire,agendo|2ire,fendo|1ire,atendo|2ire,ibuendo|3ire,ibendo|2ire,rmendo|2ire,allendo|3ire,arcendo|3ire,uttendo|3ire,midendo|3ire,gerendo|3ire,bidendo|3ire,cependo|3ire,pidendo|3ire,serendo|3ire,artendo|3ire,perendo|3ire,ruendo|2ire,osendo|2ire,trendo|2ire,prendo|2ire,eguendo|3ire,rbendo|2ire,ferendo|3ire,unendo|2ire,estendo|3ire,tuendo|2ire,luendo|2ire,ilendo|2ire,traendo|3rre,zendo|1ire,inendo|2ire,ntendo|2ire,venendo|3ire,facendo|2re,orendo|2ire,chendo|2ire,ponendo|2rre,ndo|re,ndosene|rsene,endoci|1rci"
      }
    },
    "pastParticiple": {
      "pastParticiple": {
        "rules": "enedire|4etto,herere|2sto,ompiere|4uto,vergere|3so,pargere|3so,irimere|2ento,cellere|3so,pandere|3so,tollere|3to,terdire|4etto,aledire|4etto,edigere|2atto,edimere|2ento,fulgere|3so,combere|4uto,pegnere|2nto,trafare|5tto,essere|3uto,pparire|4so,pergere|3so,icere|2uto,hiedere|3sto,mparire|4so,addire|3etto,pondere|2sto,volvere|3uto,vellere|3to,olere|2uto,sigere|1atto,evere|2uto,etere|2uto,manere|2sto,cindere|2sso,aprire|2erto,sapere|3uto,lendere|4uto,fottere|4uto,offrire|3erto,parere|3so,tergere|3so,ringere|1etto,inguere|2to,rodere|2so,cutere|2sso,sfare|3tto,ducere|1otto,pellere|1ulso,nascere|2to,cuocere|1otto,piovere|4uto,vendere|4uto,rdere|1so,solvere|3to,vivere|2ssuto,mergere|3so,valere|3so,cuotere|1osso,cadere|3uto,efare|3tto,muovere|1osso,rompere|2tto,igere|etto,coprire|3erto,emere|2uto,battere|4uto,sumere|2nto,vincere|3to,adere|1so,torcere|3to,acere|2iuto,primere|2esso,sistere|4ito,fondere|1uso,gliere|lto,crivere|3tto,trarre|3tto,durre|1otto,scere|2iuto,correre|3so,venire|3uto,nere|1uto,edere|2uto,ggere|tto,udere|1so,idere|1so,ettere|1sso,porre|2sto,ndere|so,gere|to,re|to",
        "exceptions": "algere|3uto,avere|2uto,bere|2vuto,contraffare|9tto,dire|1etto,disparire|6so,dovere|3uto,ergere|2so,fare|2tto,godere|3uto,impellere|7nte,indire|3etto,infiggere|4sso,ledere|2so,morire|3to,pendere|4uto,potere|3uto,predire|4etto,prefiggere|5sso,restringere|1istretto,ridire|3etto,rifare|4tto,solere|3ito,sopraffare|8tto,stridere|5uto,tangere|4uto,teletrasmettere|8esso,trasparire|7so,urgere|3uto,ardere|2so,corrispondere|8sto,ducere|1otto,educere|2otto,erigere|2etto,estinguere|5to,estollere|5to,nascere|2to,parere|3so,prenascere|5to,reggere|2tto,rinascere|4to,rispondere|5sto,sparere|4so",
        "rev": "derto|3gere,rroto|3gere,ssurto|4gere,hesto|2rere,osparso|5gere,iretto|2igere,ccelso|4lere,spanso|4dere,ndulto|4gere,egletto|3igere,ttuso|3ndere,rotetto|4ggere,edatto|2igere,iarso|3dere,idotto|2ucere,ifulso|4gere,corto|3gere,pento|2gnere,rasesso|3mettere,flitto|3ggere,istinto|5guere,orretto|4ggere,evoluto|4vere,ento|imere,sciolto|4gliere,tolto|2gliere,strutto|4ggere,velto|3lere,satto|1igere,fisso|2ggere,masto|2nere,diletto|3igere,scelto|3gliere,scisso|3ndere,chiesto|4dere,morso|3dere,fritto|3ggere,porto|3gere,stretto|3ingere,roso|2dere,cusso|2tere,pulso|1ellere,sorto|3gere,cotto|1uocere,colto|2gliere,solto|3vere,vissuto|2vere,fitto|2ggere,letto|2ggere,valso|3ere,cosso|1uotere,mosso|1uovere,rotto|2mpere,parso|3ire,sunto|2mere,vinto|3cere,aso|1dere,torto|3cere,presso|2imere,sistito|4ere,fuso|1ondere,detto|1ire,erto|rire,scritto|4vere,tratto|3rre,dotto|1urre,erso|2gere,volto|3gere,fatto|2re,corso|3rere,venuto|3ire,ciuto|1ere,uso|1dere,iso|1dere,esso|1ttere,posto|2rre,nto|1gere,eso|1ndere,uto|ere,to|re,ellente|4re"
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

  const all$1 = function (str) {
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
    all: all$1,
    toPresent, toPast, toFuture, toConditional,
    fromGerund, toGerund, fromPastParticiple, toPastParticiple,
    fromPresent, fromPast, fromFuture, fromConditional
  };

  let { plural } = model$1.nouns;

  const revPlural$1 = reverse$1(plural);

  const toPlural$1 = (str) => convert$1(str, plural);

  const fromPlural$1 = (str) => convert$1(str, revPlural$1);

  var noun = {
    toPlural: toPlural$1, fromPlural: fromPlural$1,
    all: toPlural$1
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
    "Article": "true¦gli,i1la,un0;!a;!l",
    "Pronoun": "true¦ci,esso,io,lAmi8n5quest4su3t1v0;i,o5;i,u0;!a,e,o6;a,o5;a,i;e,o0;i,str0;a,e,i,o;!e0o;!i;e,o0ui;!ro",
    "Adjective": "true¦0:6Z;1:6U;2:70;3:6Y;4:6I;5:6N;6:73;7:6V;8:67;9:71;A:6S;B:6M;C:61;a66b5Vc4Ud49e41f3Ng3Gh3Ei2Yl2Om24n1So1Op12qu11r0MsZtPuMvDwa4W;ariaKeGiEoD;ca0l2;ce,enBg1ncDsAv1;en9it54;ge4FntErDscovi0t6O;ba0osimi0sa2Bti5S;en6WrD;a0i0A;bi0n9;lter6Hmanoi6AnEsDtili6C;c1ua0;ani50ghe5Rifor50;at24eHip8oGrDutt;asEiD;a0Id5Len7onfa0;cu09ver52;ller2riBta0;cn8desc68mGna4RrEsD;si0tA;ma0rD;e3Hi68;i3poC;!aYcWeSfavore6EiPoMpKtFuEvD;aria9e56;d17e,pplem68rrea0;aFel66or8rD;aDutJ;da0gran5S;g58n9tD;a0unit4T;az4ecPiD;na0ra0;ddisfac1lEno5prannaDtto3Q;tuC;a5i58u3;nDtua3R;da4XgD;le,o5U;co5Tdicen60gu1micirFnEqu3MrDssAttentr4Y;a0ia0;e6tM;co5Q;ientDo67rit9;if8;li1pi1;aQeMiDot2;bel0cHnFsDtA;contDorgFult2;ra3;ascDtracc3S;im0U;c5AoD;nDrr1;duDosD;ci3;gFna0pQsEttaDv1H;ngo5B;id1t2;a0g1n2;d4ggiungi3;alunque,est’;aUeSiRluCoLrGuD;bblicEgl4KnD;g1k;a2Yhe;eFiEoD;dutt3Dge3Jmoz46porz46spici1te2Svinc4;me,ncipe;co3Cdo2Re19fDge54sen0Yve4D;eri3;lGp,rtFsD;s1tD;a0er4Q;an9o3Vua0;a5iDmo3H;go7t8;aneg1Hemonte6rami42;cuUgg0Gna0rD;en4Wse;lesFpa0rEsDtrimon4;s2toC;anor3Vl2rocch4;e,tiB;cMl1LmosessAnli4Rpen,rFsEttenDva0;i3ne;pi9serva3;bi25chestCdi7izzon25mo7;aMeLoEuD;cl0Cz4;biImHrD;dDvege6;-oDoriP;cDriO;cidN;a3Xi7;lia5;pale6wyorke6;sDta0va0;a0c1;aReMiIoFuD;ltimed4nici1CsD;co42ea0;deBl0nDr1t2D;d4t2umD;en1N;cid4gli0HlEnD;eCor;aBiD;a5t2;ccan8diGrEssiBtalD;!l8;canDid2X;ti0;c3KeRoeR;gEnagDrgi7s2XtD;er4;gDic3H;iorD;!e;!aKeIiGoEunD;a5g3D;de3NnDqua1V;diBgitu2D;beCeve,gu5nDve;ea5;gaDssi2Gt23;ti;rDteC;va0;dentifica3mNnGrEstDtalian;ituz2Erutto5;l09revD;er3K;arresta3cIdiHeGfFgEteDusAvF;gr2r30sti7;anne39le6ombr2;er7;sist1;ffer1spensa3vidA;apa1Dli37onfon2E;mFpD;ermea3on0IreD;ndi2Uve2B;in1obilD;e,ia5;ardco5orrD;or;alleHeFiaElac4rD;avit15ec2L;lloblu,ppoB;nDolog8;ia0oL;gDse;gi2;aPeNiJluv4oGrFuD;nDorvi2;eb5zion2;ance6on06;ca0nda0CrD;!liDmida3;ve6;nEsD;ca0ic27;a0e,lD;an19;rDu1L;ra1Gv1;c1llim29;conom8diIgAlettHmerg1piscoGqua24sEtc,xtraterreD;st5;istRponYteD;nu2r1Z;pa0;oCr8;le,tD;or4ri0D;aWeOiGoEuD;a0ca0pli0B;c1r0JtDvuS;aRtri7;aletJfGrigFsD;cDtin9;e1Cipli0H;en9i3;enso5ferD;enD;te,z4;ta0;cJfHmGterFvD;aDoz0R;st2;min2;enz4;iniDorY;ta;en7i0P;ne6rk,ta3;a09ele08him8i04lass8oHrFuD;rDsto11;ve;an4eD;d1sc1;lUmSnErDstitu1;a0r1;cOfMgen4iuga0nLsFtD;a3raD;en9ttA;eFiDul1;glDst1;ia3;gu1rvatD;riD;ce;az03;in2orD;me;eDorr1;ttA;and2busti3pleDu7;m0Ttam1;lEosD;sa0;aEeg4iD;na5;teC;neFrcoEstercD;en6;l2st2;matograf8se;b5s9;nErDuS;di7;aDt2;de6;aJel,iGoDritann8uon;cElogBrD;ghe6;ca0;dDen7;imensD;io7;biloBsa0tteEvaD;re6;siD;ma0;bru0Kcc0Ed0BeroportAff08g06l01maZnTppRrMsItEutostraDzienD;da0;enFtD;acc2enD;di3;ie6;ceFsiEtC;ra0;mila3st1;nd1;agoBcErog2tiD;gia7st8;aEhitetton8;icJ;de;arten1reD;zza3;a0gHtD;erFiD;cDst2;he;io5;losassoNoG;tor4;ia0;a5baBimEveoD;la5;enta5;ne6;re;eDi0;vo0;iDlu1;ne;ua0;domi7er1;en9;na0;attiv2esD;si3;bi0;le;an9;te;zze6;se",
    "Preposition": "true¦a9c6d2f1in,molti,ne4p0su5tra;er,rima;ino,ra;a2e1i,o0;po,ve;g7i,l5;!g6i,l4;he,o0;i,l,n0;!tro;!d,g2i,l0;!l0;!a,e,o;li",
    "Cardinal": "true¦cPdGmilEnovQottDquAse9tre2un1vent0ze7;i4otKu3;dGo;!dFnt0;a1otHu0;no;!cinq2d2nIquatt1se0tré;i,tG;ro;ue;d8i,ssaHttG;a0ind7;raFtt0;ord5ro;aDo;i0le;ardo,one;i2od1ue0;!cen3mB;ici;ci0eci8;a1ot0;to;nn1sset0;te;ove;ento2inqu0;a0e;nta;!m0;ila",
    "Possessive": "true¦mi4n2su1tu0v2;a,e,o4;a,o3;ostr0;a,e,i,o;e0o;!i",
    "FemaleAdjective": "true¦0:A5;1:A1;2:9Y;3:9Q;4:9D;5:9E;6:9B;7:8R;8:9O;9:9U;A:68;B:9I;C:9K;D:8O;a8Hb82c6Id62e5Cf4Sg49i3Qjugosla9l3Dm2Tn2Go24p19qu17r0UsYtPuLvE;aJeHiGoFuE;lcaDo0;ca96lont7;ci2n0olen0si9ttor9L;cch8neEra;ta,z95;liAr8s0;l3FmFniErbanG;ca,ta04vers5C;anEb5iA;a,is3;aLeGi21os9YraFurE;ca,is3;gi1nquil9M;cnHd46leGmpFne5oEr9Ysa;lo8Nri1;e6Zor6N;foDvi9O;i1o8J;rAt3;a07b5Vc04eZfYiUoPpKtFuEvizze5;cc9Jdd69gges6me5preB;aHes4il9FoCraE;nFord3JtE;e8Eig70;a,ie5;mpa0ti1;ag07eGic8GlendiAoE;nt6BrE;ca,ti9;ciEs4;aliz7Nfi1;ciHggett6HlEno5sp5Ytt2Avie3;a,iE;da,s0taE;!r8;al8Cet7;cGgnifi4Umbo87nFsEta;mi1te59;foDgo8Wist5;il86u5;eCortu9B;cHgre0lvagg8man3pGrFttEve5;ece3CiB;ba,e2ia;a66ol0;ca,ond7;ar4eDiFoEu5;l4Nn4X;e3Xi0;c5l3PnE;gu1Zit7ta;aOeMiJoEus4;bus0cc87maFsEtZ;a,s6O;gFnE;a,i1ti1;no8E;c1fles4gFnEpiAstr58t8Qvolu39;nova0o7T;iAo5W;al8Ccipro1lEmo0pubb7Ssid5D;a6ig7Y;diofoDpEra;iApresenta6;aEotid7H;d5Lnt87r0;a03eZiWl44oTrHsicGuE;bblicEli0ra;a,it7;hi1o73;a3eLiIoE;ble4Bd4SfGgr84ibi0lunga0n0pr8s7TteFvE;a0vis0D;i1t0;onA;mFvaE;!ta;ar8i6oge1S;ci4ma2LsGvEz7H;en6iE;a,s0;tig7Eun0;e3lFntific8pMsEve5;i6tuB;ac1i3;aFcEe2ttoC;co7Ke2;n0t0;nul15rEs7Ctrolife5;du0f4CiEs6S;cEfeCo1W;olo4;ci54da2ga2nora7RrFssEtS;a0i9;aFigi2la0tE;en2Oig6M;lle7As6H;bbligatOdiNgg4QlimMmoLnto6BpIrFscu5ttE;a9iB;atMdinaFganiEig1Etod1U;ca,zzat4K;r8ta;eraFpoE;rtu2s0;ia,ti9;gen46niB;pi1;er2;or8;aMeKoGuE;da,merEo9;i1o4;na,rFtE;a,tur2;di1maE;n2ti9;cess7ga6mi1o77rEt0;a,vo4;!poleGr6Bscos0tFziE;on4Ns0;i9ur15;oDta2;aSeMiJoFuE;r7sic5W;deGnFrE;biAfo5J;as3et7tuo4;r2s0;a,nFstEti1;a,er62i1;er7iBor1X;dGlo0Rra,ssi6LtEzza;aEeoro5Cropolita2;fi3Tl5I;e62iE;a22ca,tE;err3A;f5Ugi1n5DrHssiGtE;eEu5;ma3r2;cc8ma;ca0itOm2Yx5Ez5C;aPeKiJoGuE;mEng5D;ino4;mFnE;goEta2;barA;be5gn2Zmi24ngu5Wq0Vri1t3M;gEn0tter7;a0geGiE;sla6tE;tiB;nd7ra;i1r3Lti2vo5B;beCdVgno0llumin50mQnGpote3roDsFtaliE;a1Hca;la5Yo4Gtant2P;aspet1UcMdKedi0fIgen2NnHtEv2M;at0eEiB;n4rE;a,med8na;a0ova6;iEor1R;ni0;iEu4Q;a2ge2r27;er0in0;mFpE;egMortant4Orovvi4;agFeEu1I;d1Un4;in7;en3on2AroelettC;eSiIoGrE;aEe1ig8os4;fi1m1End4Htui0;ti1verE;na6;allLgaJoGuE;di04riEs0;di1;rnFvE;an4Aia2;al4W;ntE;es1;a,orE;os4;neGoFrE;archi1maD;g2Clo3QmetC;ri1ti1;aUerSiNlMoIrFuE;tu5;aFeE;dAs1;zion7;nArEt24;tEza0;iEu4V;fi3Ls47;uiA;loso21nGorFsEt0;i1sa;en2F;anEi0;zi7;ma,rE;a0ovi7;l4mo4ntasErmaceu3sc3H;cieEti1;nti1S;br02cYduXff1IgiziaWlQmPnOpNrLsGtFurEvolut1Fxtraurba2;op15;er2i1ni1rus1;at0e15pHtE;eEi9reB;rEti1;a,na;lici0r3Z;edEoi1ra0;it7;a3i1;erge3ne3K;o6piC;as3eFlE;en3Pit3;ttrFvatE;a,is3F;i1oE;magne3ni1;!na;ca6;cFoE;lo2Ino3S;es3KlesiE;as3;ai1ea;eQiHoGramNuE;bb8raE;!tu5;lo0Tmes3pp8ra0;chia0NfKna3KpIr02sFur2vE;er4i2;abiFcEpe0Ltrut0;og0Tre0;ta0;in0loE;ma3;en36fE;icolto4u4;cis0Cdi0fini6g2li26moFn4ttE;aglK;c1Ug0Ln0V;a0Qe0Ohi0Mi0Hl0DoLrFuE;pa,r2J;ea6iHoFuA;da;a0cEma3ni1;ia0;stEti1;alli2ia2;l02mWnMperLrJsE;iddHmGpicPtE;ie5o4rE;ut6;i1opoli0;et0;ea2pEta;orL;ni2Pta;cMsKtE;adi2emporHinGrE;ar8ovE;er4;ua;anE;ea;eEideN;cu6;lu2Bre0;i1memo1RpFuniE;s0t7;at0eti6lEosi6re4;eEi19;ssEta;a,i9;lFoE;ra0;et6;aEiD;moFndes00sE;si1;ro4;lindCneEvi1;matEti1;ogE;raE;fi1;a5mi1rEu4;ur0O;lEr0;eberriBti1;!lJmpa2noDo3pitIrGsalinFttE;i9o0Q;ga;a,boDdEi1nivo5si1;ia1;al0Q;c1Eda;aNeJiGos4rEuo2;asil0LitanDutE;a,ta;ancFb0Ho0AzanE;ti2;a,one5;lErbe5;ga,lE;a,iE;ca,s0W;roc1sFttE;eCu0;i08sE;a,isE;siBta;bbando1Dc1Cd1Ber18fr14g0Ul0Om0In06p01rPsNtLuGvEzzur5;anEvers7;za0;strHtE;en3oE;mEnoB;a3obil0S;al00ia1;le3mosfeCo11tE;a,en0i9;p5solu0trE;at0ono0Y;ab05bitr7cJistoHmGtiE;coEs3;la0;a0e2oD;cEteP;ra3;ai1hE;eoFitettoD;ni1;loE;gi1;ar8;er0ostoHpE;liFoE;si0;ca0;li1;aMgLiKnJoniBtiFzE;ia2;cFfascE;is0;a,hE;isS;es4ua;ma0;li05;lEto07;i3ogE;a,i1;a5bizGe00i1ministEp8;ra6;ti9;io4;sa;ra;geHie2pi2tE;a,isEra;siB;ma;bCri2;ri1;gJia0onHrE;ar8icoE;la;ia;is3;ti1;iorQrE;esE;si9;va;iFoameE;riE;ca2;na;ea,odinaE;mi1;ca;at0espo0ul0;centua0u0;na0;ta",
    "Condition": "true¦nel caso che,si",
    "Negative": "true¦n0;essuno,iente,on,ulla",
    "Adverb": "true¦aZbenYcVdSecc,fRgià,inPlOmLno,oIpDquAs4t1vi0;a,ci06;a1roppo,utto0;!ra;lvolta,n05rdi;e4in,o1pe0ubi04ì;cie,sW;l1pra0t02;!ttut01;o,tZ;conda,mpA;a0i;l0nXsi;e,i;er3i2o1r0ur;esUopr8;co,i;uttosSù;alBsiP;lt1r0ve;a,mai;re;ai,e0olN;gl0no;io;à,ì;die3fine,siEt0vece;anIorG;a,orse,uori;a1ie0;tro;pprima,v5;irca,o0;m0sì;e,unque;!e;bbastanza,cc8ddirittura,lme7nc5ppun9ss3tt1v0;anti;or5raver0;so;ai,i0;eme;h',or0;!a;no;an0;to",
    "PresentTense": "true¦aOdIhFpBs4v0è;o1uo0;i,le;gli0leM;aNoJ;a4i2oIt0;a0iaLo;!i,nAte;a0eH;mo,no,te;!i,n7p0;eEpF;o1u0;oi,ò;ss0teB;a8ia5o8;a0o;!i,n0;no;e2o0;bbia0ve5;mo,te;bba1v0;e,o0;!no;bb1ve0;te;ia0;!mo,no,te",
    "Date": "true¦domani,ieri,oggi",
    "Noun": "true¦0:16;1:1G;a1Abattagl19c0Yd0Xe0Wf0Sg0Jin0Il0Bm02n00operZpMrIs9t6v2;a0Qi3ol2;o,ta;sta,t2;a,tor15;e2itol0Craffi1;odo19st2;a,i,o;c8e7i5paz10quad02t2vilup9;a0or10r3udi2;!o;a09utQ;gnifiUstem2;a,i;de,gui0rie;a10o2;po;appor0eg05i2;c3s2tor04;pet0ulta0;erJo;aAer9ia7las0Vo5r2untW;em0Mo2;ces0Dg2;et0ramma;litec0Prt2s0t01;a,i1;n2zza;o,te;ioSsi1;lcosce0Kni1r2;co,t2;e,i2;!to;a,e;a2emi1omi,ume04;tuA;a6e4ili05o3usi2;ca;dellEnIrte,s09vimen0;r2sK;ca0;cchina,estXni3r2;e,si1;co,e2;ra;a6e5i4od3u2;ce,d2;ovi1;bQveS;gge,sA;to,vor2;i,o;caYizR;ae9en8i5over4ra3ui2;da;do;no;oc3uras2;si1;hi,o;ere;li1;at0edeOigli4or2;m2za;a,ula;!a,o;nKreL;ati,emoKomeI;a7ent6hi1o2;n3perGr2;so;dizi6sigl8t2;o,ro4;ro;lc5mpiona0nz3usa,va2;llo;oni;to;io;ia;dria7la6mal6n4ram3t2;lan6ti1;ai1;dro2imali,tibio4;ni1;ri1;ti1;co",
    "Verb": "true¦avvenuUchiamSdebboRf8stSutilizzaUv0;a,e0ienJ;n1rr0;aBe3à,ò;g3i1n5ut0;a,e,i,o;a0mIsDte,vC;mo,te;aJoJ;a1ec0;eDi;c5i,n4r0te;a2e0à,ò;bbeAi,m0st7te;mo,o;i,n0;no;ci8e0;m6s1v0;a7i,o;s1t0;e,i;e1i0;!mo;!ro;mo;a0o;!mo,no,te;!no;at0;a,i;ta",
    "MaleAdjective": "true¦0:LG;1:L5;2:L3;3:JM;4:KS;5:KX;6:LB;7:K8;8:L2;9:KT;A:LH;B:JW;C:JL;D:J2;E:LI;F:J1;G:LC;H:IM;I:L7;J:K0;K:JJ;L:GJ;M:IZ;aI7bHKcEUdDAeCCfBBgAEi8Hjunior,l83m6On67o5Ip3Wqu3Tr2Vs0Wt0Du06vNzopHG;a03eZiPolOuN;lnera8o0;gaLontF;brAgVnc19olUrtuTsQtPvOziN;a0o3;aIJi9o;a2torC;cOiN;bi2vo;eGSi9o3;a2o3;a,en0;i2oHY;cchiJMlPneOrN;de,gogEEo;ra8to,zM;eECoI8;cAgo,l2SnNriJIs0;o,taEV;brGUffIGgFIl9PmRniPrNti2;banNg5inF;is4o;co,lateGFtFversN;a2itF;a7iN;do,le;a03eWiVoSrOurN;co,is4;aOemDJiNopi5Z;butFpJsE;diNgi1nquilJspar5uGI;toLzEN;ccArOsNzGS;ca7si1;na0rentC5;be6Dmi9pi1;atG1cnDZd9GleSmRneBoQrN;apeu4miOrN;i8orHD;co,na2;loI5ri1;a4pEN;foHviI;cit54lNr9t4;ent5Mi;a1JbD5c19e11fo10i0VnelJo0Hp08qu07tUuOvN;ariaEZeglDizzeB;ccRdQf7Sgges6pN;erNreJ1;!bo,fNioL;icHMlIU;!dG3;esIo3;aXeWiUoH8rQuN;dCpN;eNi9;fJKn9;aOeNiduJumJY;piCNssAt0;biliAnNordinFteHMvagA;ieBo;lGQmN;olA;ri2s3;bi2gnAnNti1;co,dard;al3LiHL;aTeQiPlendi9oN;ntDXrNsa0;co,tiG;eJ9go9Hna0ritE3;ciOrimJKttN;a50ra2;al96fi1;g0ZzN;io3zatura;cialZddisfDKfXgg3XlUnTrSsPttOvN;ie4ra7;e5Ei2;peOtN;aDWeni8;so,t0;do,preD1;oBt4J;enGZfoGDiN;do,tN;arDo;fNiIT;er0iG8;democC4e,isDS;cQgnificaPlenzCmOnNsteEUto;ceBfoHgolHAistBte4;boHYi2m8Ipa4;!tiG;ilMuB;ca0rtuIA;cTdizCgre0lQmpliG0nsPpOrNttimaCVveB;e7io;aIQol0;a0i8;eOvaN;ggDti1;t6zI2;co,ond8W;aVet4hiUiRoOrQuN;ro,sa;lA8mo9nNr3;fNoD0vDQ;it0;at0cGGe92oN;ccNl0;anEo;acciAet0fo3;nda8Ar3;crGNggiGTnNr9tiFJ;itFo,to;a0Ee04iUoPuN;moF1ra2sNvi9;so,ti1;bGJccCmaOsNt0utiG0;eo,sGH;gOnN;i1o,ti1zo;noJ;cVdUgTl56nRpQsNtI9voluzionF;cOer3CpettNtrE1;a8iG;alda0hC;eti6i9;frescAnovaNoma0;bi2to;i9oEN;iGWot0;cFZet6;aVcUgTlSmo0sPtN;roat6tN;ilinESo;iOpN;irA6o4V;deC9st5;a6igC;io13oD6;enEipro1;l2Mt6;diQffiGXgCJpPro,zN;ioBIziN;a2s8X;i9presen87;ca2oN;at6foHteleviI;aOest'ul62oN;!tidM;dH8li82ntE7;a0We0Oi0Kla0Io0BrRsicPuN;bblicNli0ni6ro;itFo;hi1oN;loEWti1;atic2Te01iWoNud5;at6ba8ceduCMdUfSgrG8liE3mRn0pQsOt1MvN;a0enienBToc9KvisB9;peNsiFWta4;ro,t4;orzGDri09;ett5in5;essionNon9;a2is4;igCut6;gionieBmOncipa2vN;a0ilegEPo;arDiOoN;ge4SrdE9;sFKtiG;cQdB5fe57liminaLmPoccupa45sOvNzC;al5en6io;enEiB8tigCun0;a8Gium,uDE;ed5i3;chisFEe4lRntificDpolQrta4HsOtenNveB;tCRzE1;i6sNtuFD;esIi8;aLo3;ac1eGMiN;ti1zi5C;ci9nNuEW;etF;aPccOeNgBo,sa7ttoDI;ga0no,to3;anEoJ;ceKt0;dagoDYlo3nTrNsA;fC6iRman5peQsNtin5vaI;iOoNpicaDB;!na2;a7st5;ndi1KtES;co5Yo5D;sieCSti0;cXffu0lWrRssQtOuCRzN;i5zo;eNriot4;r7ti1;a0eggeBiG;aQiPlaOsimonCtNzDC;ecipanAKi1B;m75to;!gi7;gona8lleJnoi1;li9;a0iCO;bbligato0Acc08di07ffenIgg06k,l05m04n01pXrRsQttNvvDzC;iNo0U;co,mN;a2is71o;cuBsCLti2;a2dinaRgPiNri8todos3;enFJginaN;le,riDX;aniNo1D;co,zz3U;rDto;eraPpN;oNrim5;rtu7s0;io,tiG;es0oN;m6VrN;arDeK;bBXogenC7;eo3f9Aimpi1;et6;er7o3;as91uN;l0pa0;!rD;aZeVoPuN;do,lJmerNoGtriz8X;i1o3;bi2io3rPstalCMtN;eKo,tN;ur7;dOmaN;le,n7;!aDYi1;cess4YgPoOrNt0utrCY;o,vo3;cla72na0;a6l77;polePrD5scos0tNz8L;al65iGuralN;e,is4;oHta7;a0Ke09i03oRuN;ltipJsNto;iOulN;ma7;ca2;bi2ccCdVlSnQrPstrOtiN;va0;uo3;a2bi9tCI;as4etFtN;a7uo3;eOtN;eplici,isCZ;co9P;a,eNu9O;rNs0;a0no;gl1Vli5EnQraco3XsNt9A;erOtN;erCi1o;a8o;iNoLusCY;!mo;ccaHdiVlo36morUnTrRsQtNzA0;allOropoliN;ta7;i1o;chi7siD0;aviNo;glC;si2ta2;a8ia2;co,o,teN;rr7V;cho,es6Ag01lXnWrTsQtN;eNto,uB;ma4rN;ialistica,no;chiOsiN;ccDmo;le,o;cOiNm76roB5zAU;a7no,t21;a0io;ca0ua2;a0eOiNvagD;ncoHzC;dNvoJ;et0uCW;i1nNro;e4iA3;aZeUiToRuN;ci9mi6BngOssuN;o3re14;hiNo;!sBS;ca2gi1nN;gobar9ta7;beBe0miCKngu9Squidi,ri1scDt8B;a2gOn0tN;a2ter32;aD5geOiN;sla6t1H;ndFro;i1r8Gti7;bri9d1Ggno1Fll1Bm0XnWoHpote4rPsNtalM;laCUpi9raelMtN;ant6Xe9T;oHrN;ePiN;lNta8;evA;go82sN;is7JpoN;nsa8;a0Mc0Gd0De0Cf05giAQizia04n00quietAsXtQu0BvNzuppa0;aOer3iN;nci8si8;d5rA7;at0eNiB5rinse1ui6;graCMllRnQrNso;essaOmedDnNo;az67o;nEto;s72zBJ;ett6Nig5;apoLenAMigni16oli0ta8uN;bo4GfN;fici5;atPoNumerevoli;cNva6;enEuo;o,u7G;le,tiva;aRePiWlu5ormaN;le,tiN;co,vo;li8YrN;ioL;lli8nN;ti2;di0r5viBS;efiOiNustr95;a7ca6fe3gB1pe5Fr7Mscus3;ni0;er0lRoNredi8;er5mpPnOraNstit59;ggiA;dizAVscD;iu0le0;iAUu3;deB1spetB3t6ugu6X;barazzAmWpN;aTeRl2EoQrN;eOoN;ba8vvi3;cisa0ss2I;rtant7Gs9R;c95gnNr8P;at63;uNzi5;ri0;aOeNorB5un28;d8Yn3;ginaNtuB;bi2rD;eNustL;ci0gN;a2itN;ti9R;rAto;eOill6Pon7WrN;au9Ti1og7S;a2n4;a0Ie09hiacc8Ni00loZoYrNus3I;aReQigDoN;ssoOttN;es1;!la7;co,z6S;dRfi1ndPs3tNve,zC;iNo,ui0;ficA;e,iN;o3s9B;eKua2;mmo3ti1ve9B;ba2rC;alJganteUoQuN;diziFriOstN;ifiA2o;di1;io3rnal76vN;anNia7;e,iN;le,s90;!s1;lUnPoNrmaHs57;g72lo7UmN;et79;eOtilNui7;e,izD;rNti1;alNi1o3;e,izAF;i9o3;l2Nsso3;a09e05iYlXoTrOuN;nz3TrCso,tuB;aQeOiN;t0voJ;d9ne4qu5s1ttoN;lo3;gi2nces8Y;lA0ndaPrNt6L;ma2tN;e,u90;m9LnEto;es82oscDuor94;dSeBloso6InQorentPsN;iNso;co,o76;e,i7;anziNi0to;ari7U;a0ucC;dePli6HmminiOnome3CrN;mo,o6GroviFti2;le,s0Q;le,ra2;cYlWmTntasQstidCtOvoN;lo3reK;a2i74tN;i8ua2;cieOiNti1;a,o3;nti61;iOosN;is7To;ge8WliaL;lNso;i0o;i2olN;ta6;br0Jc0Fd0Dff0Bg09l03mo01nZpi1quival5rXsQtPuOvN;ent3Bid5olut3P;clid5Trop5T;er7i1ni1rus1;at0clus3MeSilarAo4pQse3BtN;eNiGre7J;rNti1;i,no,o;an3er0lNr33;ici0;cu6mp44nE;edNoi1;itF;ergNne7Aorme,tusiasX;e4i1;!tiGzN;ionA;aReNiE;gAmOttrNva0;i1oH;enN;taL;bo85s4;izMoisN;ta;et6icN;a59i5;ilNuca6;izD;cNlet4o5B;eOlesiN;as4;ll5sIz1X;ai1eo;'oBa14e0PiYoSrQuN;bbDrN;aNo;tuB;aNit0;m3Ks4;lQmOppDrNta0vu0;a0i1mi5;eNinA;ni6Ws4;ce,orN;anEo3;c0Cd0Bf06g05l04na7Qp03rett2GsQvN;erOiN;no,siG;so,t5;aYcVgus06leUoTpRtN;aPintNr12;iNo;!vo;c72nE;a78e78oN;ni8s0;rdi6N;ssi1;og45rNu29;e0iminN;at1B;bili6Sst3V;e0Vin0lo2W;ig5;es6i72;ePfN;iNu3;ci2d5;nItN;to3;at4;en9;bo2c00diZfYg7lWmoUnSpRsPtN;ermi66tN;agl4M;crit6er0iderNtB;a8o3;loreKr15;so,tN;a2ro;cNg3Jn2F;ra4;ega0iNud5;be6Fca0zC;init1Dun0;ca0to;ad5enEiIo4Y;nNta0;no3;a1Ye1Shi1Qi1Ml1JoWrOuN;ba7ltu1Tpo,rC;eTiSoPuN;c3QdNen0;e2o;a0cOnN;i1o3V;cAia0;mi04stMti1;a6mo3;er5inv18l15m0PnXperni5BrSsN;ci5idd20mi1tN;anEiOo3rN;ut6;eBtN;uzW;aQpPrNto;et0ispoN;nd5;or2U;ggC;c0Ddi0f0Agress09n08o07s02tSvN;enOinN;c5to;i5zN;ioN;na2;agCeTinSrN;aOoN;intui6ver3;ddittOffNrDs56;at0;orD;en5Guo;mpNnu0;orN;an2D;apeKePiderOuetN;o,udi32;a0eK;cu6rvN;atoL;sciu0;es3;ua2;iNu3;deN;nz2I;luIre0;i1me00o9pQunN;e,iN;ca8sNtF;ti;aTetSlPoOreNulI;n3Cso;rtam4Ts0;eNi4I;ssNto;iGo;enEi6;ssOtN;i8to;ioneK;rc22sN;ti8;lOoNpeKto;n1Zra0;abo30et6;ol0;aNiH;mo15ndes1ZssNustrofobi1;e,i1;c3Be1lind1InPrcolarOttadi7viN;co,le;e,i;emat16i1;aBmi1rNu3;ur1X;co,lPntOrN;ebNto;ra2;eberri2XluNti1;laL;re;dZlXmWnoHo4pVrRsPtNu0vo;astro0YtN;iGo2X;alinNua2;go;atter0RdPenEiNnivoBo,si1tesM;co,no,sNtateK;ma4;ia1;a0Wo,riccC;po;cNdo,mo,vo;ar0Pis4o30;et0;a06e00iXlWoVrOuN;io,o7;aSevRiQonPuN;s1tN;a2to;zo;llAtanH;e,is28;silMvo;livMtaH;an9u;anc1Gb2AlancDoOzN;an0VzarB;lo0Zn9;llQnNrgamas1;eNig7venu0;dettNfi1;i7o;iNo;co,s1W;g2GnOrNs3;bu0oc1;a2cF;b37c2Qd2Her2Ff24g1Zl1Qm1En0Zp0Sr0Ds06t01uRvNzzurB;an3FvN;eNinc5;ntuNr3;ro3;daZrVstrUtN;en4is4oN;biPmNno1MreK;a4obilN;is4;ogN;raN;fi1;alMia1;eo;eo,le4mosfeQo2QroPtN;eNiGra5ua2;n0so;ce;ri1;ciut0ia4pSsQtN;rNu0;at0oN;no2I;eNicu28olu0ur9;nEr6;irAro;aZbitrFcUgenTia7mRrabb03tiN;coPfNs4;icN;ia2;!la0;a0e7oniN;co,o3;ti7;ai1hN;eoOitettoH;ni1;loN;gi1;bo,ncioN;ne;er0pN;aRicciQliPoOroprNunti0;ia0;si0;ca8;co3;r5ss10;aYgXimaVnToSsCtiOzM;ia7;cPorF;arD;io;hi,o;maJni0A;es3uN;a2o;le,tN;i,o;us0;lNrchi1;i4ogN;hi,i1o;aXbiTe0FicRmiOpiN;!o;nistOreKsN;si8;ra6;heKo;vo2;en11gPzC;io3;so;uo;ro,to;coUfabe4ie7lRpi7tN;ePisNo,ro;siN;mo;rna6;'aper0armAeN;a0gB;ro;li1;gPitan9nos4riN;coJ;lo;iun6rN;esI;fSrN;iPoaN;meN;riN;ca7;no;aQezOida8olN;la0;ioN;na0;ma0scinA;eo,oN;dina0Bnau4;at0doReQiPoNul0;lNra8;esc5;ac5;gua0;meOrmenN;ta0;stiN;ca0;cRi9quOuN;s4to;a4eo;ti1;do;adeWeSidQoOuN;ra0;gli5modA;enE;enN;ta2;so,tN;ta8;bi2;le;mi1;co;bTiOuI;siG;le,tN;a6uaN;le,to;tiG;vo;oNronO;ndAzN;za0;to;anE;te",
    "Conjunction": "true¦aLbenKcIdGeDgrazie a,inCmBn9o7p4qu3s0tuttav8vi5;e1i0;a,ccome;!bbene;ando,inM;er1iutto0rima CuA;stoD;cIò;!p6ss0;ia;e0é;ancDmmeno,p3;a,ent3;fatti,olt2;!d,p0;pu0;re;opo 0unque;c6di;ioè,osí0; c4;c4sì; causa 4ffinc3llora,n0ppena;c1zi0;!c1;he;hé;di",
    "PastTense": "true¦aveFdoveDe9f6pot4s1vol0;eElD;apeDeppCt0;avDe0;mJsEttA;e0é;i,mHr2sCvA;osBu0;!i,mFr0;ono;bb4r0;a0i,o;!no,va0;mo,te;m9s4tt0v2;e7i;m7s2v0;a0i,o;!mo,no,te;s1t0;e,i;e1i0;!mo;!ro;mo",
    "FutureTense": "true¦a2do2potr3s0vorr3;a0tar2;pr1r1;vr0;a1e0à,ò;mo,te;i,nno",
    "ConditionalVerb": "true¦av2dov2pot2s0vor2;a0ta1;p0re1;re0;bbe1i,mmo,st0;e,i;!ro",
    "LastName": "true¦0:32;1:39;2:37;3:2W;4:2C;a38b2Yc2Ld2Be28f22g1Wh1Mi1Hj1Bk14l0Wm0Ln0Ho0Ep04rXsLtGvEwBxAy7zh5;a5ou,u;ng,o;a5eun2Roshi1Hun;ma5ng;da,guc1Wmo24sh1YzaQ;iao,u;a6eb0il5o3right,u;li38s2;gn0lk0ng,tanabe;a5ivaldi;ssilj34zqu1;a8h7i2Do6r5sui,urn0;an,ynisI;lst0Mrr1Rth;at1Romps2;kah0Snaka,ylor;aDchCeBhimizu,iAmi9o8t6u5zabo;ar1lliv27zuD;a5ein0;l20rm0;sa,u3;rn4th;lva,mmo21ngh;mjon4rrano;midt,neid0ulz;ito,n6sa5to;ki;ch1dJtos,z;amAeag1Wi8o6u5;bio,iz;b5dri1JgGj0Qme21osevelt,ux;erts,ins2;c5ve0C;ci,hards2;ir1os;aCe8h6ic5ow1X;asso,hl0;a5illips;m,n1R;ders1Yet7r6t5;e0Lr4;ez,ry;ers;h1Zrk0t5vl4;el,te0H;baAg09liveiZr5;t5w1M;ega,iz;a5eils2guy1Pix2owak,ym1C;gy,ka5var1I;ji5muU;ma;aDeBiAo7u5;ll0n5rr09ssolini,ñ5;oz;lina,oIr5zart;al0Ke5r0S;au,no;hhail4ll0;rci0ssi5y0;!er;eUmmad4r5tsu05;in,tin1;aBe7i5op1uo;n5u;coln,dholm;fe6n0Pr5w0I;oy;bv5v5;re;mmy,rs13u;aAennedy,imu9le0Ko7u6wo5;k,n;mar,znets4;bay5vacs;asX;ra;hn,rl8to,ur,zl4;a9en8ha3imen1o5u3;h5nXu3;an5ns2;ss2;ki0Ds0R;cks2nsse0C;glesi8ke7noue,shik6to,vano5;u,v;awa;da;as;aAe7itchcock,o6u5;!a3b0ghMynh;a3ffmann,rvat;mingw6nde5rM;rs2;ay;ns0ErrPs6y5;asCes;an4hi5;moI;a8il,o7r6u5;o,tierr1;ayli3ub0;m1nzal1;nd5o,rcia;hi;er9is8lor7o6uj5;ita;st0urni0;es;ch0;nand1;d6insteGsposi5vaK;to;is2wards;aBeAi8omin7u5;bo5rand;is;gu1;az,mitr4;ov;lgado,vi;nkula,rw6vi5;es,s;in;aEhAlark9o5;hKl5op0rbyn,x;em6li5;ns;an;!e;an7e6iu,o5ristensFu3we;i,ng,u3w,y;n,on5u3;!g;mpb6rt0st5;ro;ell;aAe7ha3lanco,oyko,r5yrne;ooks,yant;ng;ck6ethov5nnett;en;er,ham;ch,h7iley,rn5;es,i0;er;k,ng;dCl8nd5;ers5r9;en,on,s2;on;eks6iy7var1;ez;ej5;ev;ams",
    "FirstName": "true¦aEblair,cCdevBj8k6lashawn,m3nelly,quinn,re2sh0;ay,e0iloh;a,lby;g1ne;ar1el,org0;an;ion,lo;as8e0r9;ls7nyatta,rry;am0ess1ude;ie,m0;ie;an,on;as0heyenne;ey,sidy;lex1ndra,ubr0;ey;is",
    "Determiner": "true¦altri,li,tale",
    "MaleName": "true¦0:CB;1:BI;2:BZ;3:BQ;4:B2;5:BW;6:AQ;7:9S;8:BA;9:AU;A:AL;aB1bA5c94d84e7Df6Wg6Eh5Ui5Gj4Jk49l3Pm2Nn2Co27p21qu1Zr19s0Pt05u04v00wNxavi3yGzB;aBor0;cBh8Fne;hCkB;!aAY;ar4ZeAX;ass2i,oCuB;sDu23;nEsDusB;oBsC;uf;ef;at0g;aJeHiCoByaAM;lfgang,odrow;lBn1N;bDey,frBGlB;aA2iB;am,e,s;e86ur;i,nde7sB;!l6t1;de,lCrr5yB;l1ne;lBt3;a90y;aDern1iB;cBha0nce8Trg98va0;ente,t59;lentin48n8Wughn;lyss4Lsm0;aTeOhKiIoErCyB;!l3ro8s1;av9OeBist0oy,um0;nt9Gv53y;bDd7VmBny;!as,mBoharu;aAWie,y;i81y;mBt9;!my,othy;adDeoCia7BomB;!as;!do7K;!de9;dErB;en8FrB;an8EeBy;ll,n8D;!dy;dgh,ic9Rnn3req,ts44;aRcotPeNhJiHoFpenc3tBur1Nylve8Fzym1;anDeBua79;f0phADvBwa78;e56ie;!islaw,l6;lom1nA1uB;leyma8ta;dBl7Hm1;!n6;aDeB;lBrm0;d1t1;h6Qne,qu0Tun,wn,y8;aBbasti0k1Wl40rg3Zth,ymo9G;m9n;!tB;!ie,y;lCmBnti20q4Hul;!mAu4;ik,vato6T;aWeShe90iOoFuCyB;an,ou;b6JdCf9pe6OssB;!elAG;ol2Ty;an,bIcHdGel,geFh0landA7mEnDry,sCyB;!ce;coe,s;!a93nA;an,eo;l3Ir;e4Pg3n6olfo,ri66;co,ky;bAe9S;cBl6;ar5Mc5LhCkB;!ey,ie,y;a83ie;gCid,ub5x,yBza;ansh,nR;g8UiB;na8Qs;ch5Wfa4lDmCndBpha4sh6Sul,ymo6Y;al9Wol2Ay;i9Gon;f,ph;ent2inB;cy,t1;aFeDhilCier60ol,reB;st1;!ip,lip;d99rcy,tB;ar,e2U;b3Rdra6Dt43ul;ctav2Uliv3m94rEsBt7Oum8Sw5;aCc8RvB;al51;ma;i,l49vJ;athJeHiDoB;aBel,l0ma0r2X;h,m;cCg4i3IkB;h6Tola;hol5WkBol5W;!ol5V;al,d,il,ls1vB;il4Z;anBy;!a4i4;aWeTiKoFuCyB;l21r1;hamCr5YstaB;fa,p4F;ed,mF;dibo,e,hamDis1XntCsBussa;es,he;e,y;ad,ed,mB;ad,ed;cGgu4kElDnCtchB;!e7;a77ik;house,o03t1;e,olB;aj;ah,hBk6;a4eB;al,l;hClv2rB;le,ri7v2;di,met;ck,hNlLmOnu4rHs1tDuricCxB;!imilian8Bwe7;e,io;eo,hCi51tB;!eo,hew,ia;eBis;us,w;cDio,k85lCqu6Fsha7tBv2;i2Hy;in,on;!el,oKus;achBcolm,ik;ai,y;amBdi,moud;adB;ou;aReNiMlo2RoIuCyB;le,nd1;cEiDkBth3;aBe;!s;gi,s;as,iaB;no;g0nn6QrenDuBwe7;!iB;e,s;!zo;am,on4;a7Aevi,la4RnDoBst3vi;!nB;!a5Zel;!ny;mCnBr66ur4Swr4S;ce,d1;ar,o4M;aIeDhaled,iBrist4Uu47y3A;er0p,rB;by,k,ollos;en0iEnBrmit,v2;!dCnBt5B;e0Yy;a7ri4M;r,th;na67rBthem;im,l;aYeQiOoDuB;an,liBst2;an,o,us;aqu2eJhnInGrEsB;eChBi7Aue;!ua;!ph;dBge;an,i,on;!aBny;h,s,th4W;!ath4Vie,nA;!l,sBy;ph;an,e,mB;!mA;d,ffGrDsB;sBus;!e;a5IemCmai8oBry;me,ni0O;i6Ty;!e57rB;ey,y;cHd5kGmFrDsCvi3yB;!d5s1;on,p3;ed,od,rBv4L;e4Yod;al,es,is1;e,ob,ub;k,ob,quB;es;aNbrahMchika,gKkeJlija,nuIrGsDtBv0;ai,sB;uki;aBha0i6Ema4sac;ac,iaB;h,s;a,vinBw2;!g;k,nngu51;!r;nacBor;io;im;in,n;aJeFina4UoDuByd55;be24gBmber4BsD;h,o;m3ra32sBwa3W;se2;aDctCitCn4DrB;be1Zm0;or;th;bKlJmza,nIo,rDsCyB;a42d5;an,s0;lEo4ErDuBv6;hi3Zki,tB;a,o;is1y;an,ey;k,s;!im;ib;aQeMiLlenKoIrEuB;illerCsB;!tavo;mo;aDegBov3;!g,orB;io,y;dy,h56nt;nzaBrd1;lo;!n;lbe4Pno,ovan4Q;ne,oDrB;aBry;ld,rd4T;ffr6rge;bri4l5rBv2;la1Yr3Dth,y;aQeNiLlJorr0HrB;anDedBitz;!dAeBri23;ri22;cDkB;!ie,lB;in,yn;esco,isB;!co,zek;etch3oB;yd;d4lBonn;ip;liCng,rnB;an00;pe,x;bi0di;arZdUfrTit0lNmGnFo2rCsteb0th0uge8vBym5zra;an,ere2V;gi,iCnBrol,v2w2;est45ie;c07k;och,rique,zo;aGerFiCmB;aFe2P;lCrB;!h0;!io;s1y;nu4;be09d1iEliDmCt1viBwood;n,s;er,o;ot1Ts;!as,j43sB;ha;a2en;dAg32mEuCwB;a25in;arB;do;o0Su0S;l,nB;est;aYeOiLoErDuCwByl0;ay8ight;a8dl6nc0st2;ag0ew;minFnDri0ugCyB;le;!l03;!a29nBov0;e7ie,y;go,icB;!k;armuCeBll1on,rk;go;id;anIj0lbeHmetri9nFon,rEsDvCwBxt3;ay8ey;en,in;hawn,mo08;ek,ri0F;is,nBv3;is,y;rt;!dB;re;lKmInHrDvB;e,iB;!d;en,iDne7rByl;eBin,yl;l2Vn;n,o,us;!e,i4ny;iBon;an,en,on;e,lB;as;a06e04hWiar0lLoGrEuCyrB;il,us;rtB;!is;aBistobal;ig;dy,lEnCrB;ey,neli9y;or,rB;ad;by,e,in,l2t1;aGeDiByI;fBnt;fo0Ct1;meCt9velaB;nd;nt;rDuCyB;!t1;de;enB;ce;aFeErisCuB;ck;!tB;i0oph3;st3;d,rlBs;eBie;s,y;cBdric,s11;il;lEmer1rB;ey,lCro7y;ll;!os,t1;eb,v2;ar02eUilTlaSoPrCuByr1;ddy,rtI;aJeEiDuCyB;an,ce,on;ce,no;an,ce;nCtB;!t;dCtB;!on;an,on;dCndB;en,on;!foBl6y;rd;bCrByd;is;!by;i8ke;al,lA;nFrBshoi;at,nCtB;!r10;aBie;rd0S;edict,iCjam2nA;ie,y;to;n6rBt;eBy;tt;ey;ar0Xb0Nd0Jgust2hm0Gid5ja0ElZmXnPputsiOrFsaEuCveBya0ziz;ry;gust9st2;us;hi;aIchHi4jun,maFnDon,tBy0;hBu06;ur;av,oB;ld;an,nd0A;el;ie;ta;aq;dGgel05tB;hoEoB;i8nB;!i02y;ne;ny;reBy;!as,s,w;ir,mBos;ar;an,beOd5eIfFi,lEonDphonHt1vB;aMin;on;so,zo;an,en;onCrB;edP;so;c,jaEksandDssaExB;!and3;er;ar,er;ndB;ro;rtH;ni;en;ad,eB;d,t;in;aColfBri0vik;!o;mBn;!a;dFeEraCuB;!bakr,lfazl;hBm;am;!l;allEel,oulaye,ulB;!lCrahm0;an;ah,o;ah;av,on",
    "FemaleName": "true¦0:FV;1:FZ;2:FO;3:FA;4:F9;5:FP;6:EO;7:GC;8:EW;9:EM;A:G8;B:E2;C:G5;D:FL;E:FI;F:ED;aDZbD2cB7dAHe9Ff8Zg8Fh81i7Qj6Sk5Yl4Mm36n2Ro2Op2Dqu2Cr1Ms0Pt03ursu6vUwOyLzG;aJeHoG;e,la,ra;lGna;da,ma;da,ra;as7CeHol1RvG;et9onB8;le0sen3;an8endBMhiB3iG;lInG;if38niGo0;e,f37;a,helmi0lGma;a,ow;aLeIiG;ckCZviG;an9WenFY;da,l8Vnus,rG;nGoni8M;a,iDA;leGnesEA;nDJrG;i1y;aSePhNiMoJrGu6y4;acG1iGu0E;c3na,sG;h9Mta;nHrG;a,i;i9Jya;a5HffaCFna,s5;al3eGomasi0;a,l8Go6Wres1;g7To6VrHssG;!a,ie;eFi,ri7;bNliMmKnIrHs5tGwa0;ia0um;a,yn;iGya;a,ka,s5;a4e4iGmC9ra;!ka;a,t5;at5it5;a04carlet2Xel6MhUiSkye,oQtMuHyG;bFHlvi1;sHzG;an2Set9ie,y;anGi7;!a,e,nG;aEe;aIeG;fGl3CphG;an2;cF6r6;nGphi1;d4ia,ja,ya;er4lv3mon1nGobh74;dy;aKeGirlBKo0y6;ba,e0i6lIrG;iGrBOyl;!d6Z;ia,lBT;ki4nIrHu0w0yG;la,na;i,leAon,ron;a,da,ia,nGon;a,on;bMdLi8lKmIndHrGs5vannaE;aEi0;ra,y;aGi4;nt5ra;lBMome;e,ie;in1ri0;a02eXhViToHuG;by,thBJ;bQcPlOnNsHwe0xG;an95ie,y;aHeGie,lC;ann7ll1marBEtB;lGnn1;iGyn;e,nG;a,d7X;da,i,na;an8;hel53io;bin,erByn;a,cGkki,na,ta;helBYki;ea,iannDWoG;da,n12;an0bIgi0i0nGta,y0;aGee;!e,ta;a,eG;c6CkaE;chGe,i0mo0n5EquCCvDy0;aCBelGi8;!e,le;een2ia0;aMeLhJoIrG;iGudenAV;scil1Uyamva8;lly,rt3;ilome0oebe,ylG;is,lis;arl,ggy,nelope,r6t4;ige,m0Fn4Oo6rvaBAtHulG;a,et9in1;ricGsy,tA8;a,e,ia;ctav3deHfAVlGphAV;a,ga,iv3;l3t9;aQePiJoGy6;eHrG;aEeDma;ll1mi;aKcIkGla,na,s5ta;iGki;!ta;hoB1k8ColG;a,eBG;!mh;ll2na,risF;dIi5QnHo23taG;li1s5;cy,et9;eAiCN;a01ckenz2eViLoIrignayani,uriBFyG;a,rG;a,na,tAR;i4ll9WnG;a,iG;ca,ka,qB3;chOkaNlJmi,nIrGtzi;aGiam;!n8;a,dy,erva,h,n2;a,dIi54lG;iGy;cent,e;red;!e6;ae6el3G;ag4KgKi,lHrG;edi62isFyl;an2iGliF;nGsAL;a,da;!an,han;b08c9Dd06e,g04i03l01nZrKtJuHv6Tx87yGz2;a,bell,ra;de,rG;a,eD;h76il8t2;a,cSgOiJjor2l6Jn2s5tIyG;!aGbe5RjaAlou;m,n9R;a,ha,i0;!aIbAKeHja,lCna,sGt54;!a,ol,sa;!l06;!h,m,nG;!a,e,n1;arIeHie,oGr3Kueri9;!t;!ry;et3IiB;elGi62y;a,l1;dGon,ue6;akranBy;iGlo36;a,ka,n8;a,re,s2;daGg2;!l2W;alCd2elGge,isBFon0;eiAin1yn;el,le;a0Ie08iWoQuKyG;d3la,nG;!a,dHe9RnGsAP;!a,e9Q;a,sAN;aB0cJelIiFlHna,pGz;e,iB;a,u;a,la;iGy;a2Ae,l25n8;is,l1GrHtt2uG;el6is1;aIeHi7na,rG;a6Zi7;lei,n1tB;!in1;aQbPd3lLnIsHv3zG;!a,be4Let9z2;a,et9;a,dG;a,sGy;ay,ey,i,y;a,iaIlG;iGy;a8Fe;!n4G;b7Serty;!n5S;aNda,e0iLla,nKoIslAQtGx2;iGt2;c3t3;la,nGra;a,ie,o4;a,or1;a,gh,laG;!ni;!h,nG;a,d4e,n4O;cNdon7Ri6kes5na,rMtKurIvHxGy6;mi;ern1in3;a,eGie,yn;l,n;as5is5oG;nya,ya;a,isF;ey,ie,y;aZeUhadija,iMoLrIyG;lGra;a,ee,ie;istGy5C;a,en,iGy;!e,n49;ri,urtn99;aMerLl98mIrGzzy;a,stG;en,in;!berlG;eGi,y;e,y;a,stD;!na,ra;el6OiJlInHrG;a,i,ri;d4na;ey,i,l9Ps2y;ra,s5;c8Vi5XlOma6nyakumari,rMss5LtJviByG;!e,lG;a,eG;e,i77;a5EeHhGi3QlCri0y;ar5Cer5Cie,leDr9Ey;!lyn72;a,en,iGl4Vyn;!ma,n32sF;ei71i,l2;a04eVilToMuG;anKdJliGst56;aHeGsF;!nAt0W;!n8W;i2Sy;a,iB;!anLcelCd5Vel70han6HlJni,sHva0yG;a,ce;eGie;fi0lCph4X;eGie;en,n1;!a,e,n37;!i10lG;!i0Z;anLle0nIrHsG;i1Bsi1B;i,ri;!a,el6Oif1SnG;a,et9iGy;!e,f1Q;a,e71iHnG;a,e70iG;e,n1;cLd1mi,nHqueliAsmin2Vvie4yAzG;min7;a7eHiG;ce,e,n1s;!lGsFt06;e,le;inHk2lCquelG;in1yn;da,ta;da,lPmNnMo0rLsHvaG;!na;aHiGob6T;do4;!belGdo4;!a,e,l2H;en1i0ma;a,di4es,gr5Q;el8ogG;en1;a,eAia0o0se;aNeKilHoGyacin1O;ll2rten1I;aHdGlaH;a,egard;ry;ath0XiHlGnrietBrmiAst0X;en25ga;di;il74lKnJrGtt2yl74z6C;iGmo4Fri4G;etG;!te;aEnaE;ey,l2;aYeTiOlMold13rIwG;enGyne19;!dolC;acHetGisel8;a,chD;e,ieG;!la;adys,enGor3yn1Z;a,da,na;aJgi,lHna,ov70selG;a,e,le;da,liG;an;!n0;mZnIorgHrG;ald35i,m2Ttru72;et9i5S;a,eGna;s1Ovieve;briel3Fil,le,rnet,yle;aSePio0loNrG;anHe8iG;da,e8;!cG;esIiGoi0H;n1sG;ca;!ca;!rG;a,en41;lHrnG;!an8;ec3ic3;rHtiGy7;ma;ah,rah;d0FileDkBl00mUn48rRsMtLuKvG;aIelHiG;e,ta;in0Ayn;!ngel2G;geni1la,ni3P;h50ta;meral8peranJtG;eHhGrel6;er;l2Or;za;iGma,nest28yn;cGka,n;a,ka;eJilImG;aGie,y;!liA;ee,i1y;lGrald;da,y;aTeRiMlLma,no4oJsIvG;a,iG;na,ra;a,ie;iGuiG;se;a,en,ie,y;a0c3da,nJsGzaH;aGe;!beG;th;!a,or;anor,nG;!a;in1na;en,iGna,wi0;e,th;aWeKiJoGul2S;lor4Zminiq3Wn2YrGtt2;a,eDis,la,othGthy;ea,y;an09naEonAx2;anPbOde,eNiLja,lImetr3nGsir4S;a,iG;ce,se;a,iHorGphiA;es,is;a,l5H;dGrdG;re;!d4Kna;!b2AoraEra;a,d4nG;!a,e;hl3i0mMnKphn1rHvi1VyG;le,na;a,by,cHia,lG;a,en1;ey,ie;a,et9iG;!ca,el19ka;arGia;is;a0Pe0Mh04i02lUoJrHynG;di,th3;istGy04;al,i0;lOnLrHurG;tn1C;aId26iGn26riA;!nG;a,e,n1;!l1Q;n2sG;tanGuelo;ce,za;eGleD;en,t9;aIeoHotG;il49;!pat4;ir7rIudG;et9iG;a,ne;a,e,iG;ce,sX;a4er4ndG;i,y;aPeMloe,rG;isHyG;stal;sy,tG;aHen,iGy;!an1e,n1;!l;lseHrG;!i7yl;a,y;nLrG;isJlHmG;aiA;a,eGot9;n1t9;!sa;d4el1NtG;al,el1M;cGli3E;el3ilG;e,ia,y;iYlXmilWndVrNsLtGy6;aJeIhGri0;erGleDrCy;in1;ri0;li0ri0;a2FsG;a2Eie;iMlKmeIolHrG;ie,ol;!e,in1yn;lGn;!a,la;a,eGie,y;ne,y;na,sF;a0Ci0C;a,e,l1;isBl2;tlG;in,yn;arb0BeXlVoTrG;andRePiIoHyG;an0nn;nwCok7;an2MdgKg0HtG;n26tG;!aHnG;ey,i,y;ny;etG;!t7;an0e,nG;da,na;i7y;bbi7nG;iBn2;ancGossom,ythe;a,he;aRcky,lin8niBrNssMtIulaEvG;!erlG;ey,y;hHsy,tG;e,i0Zy7;!anG;ie,y;!ie;nGt5yl;adHiG;ce;et9iA;!triG;ce,z;a4ie,ra;aliy29b24d1Lg1Hi19l0Sm0Nn01rWsNthe0uJvIyG;anGes5;a,na;a,r25;drIgusHrG;el3;ti0;a,ey,i,y;hHtrG;id;aKlGt1P;eHi7yG;!n;e,iGy;gh;!nG;ti;iIleHpiB;ta;en,n1t9;an19elG;le;aYdWeUgQiOja,nHtoGya;inet9n3;!aJeHiGmI;e,ka;!mGt9;ar2;!belHliFmT;sa;!le;ka,sGta;a,sa;elGie;a,iG;a,ca,n1qG;ue;!t9;te;je6rea;la;!bHmGstas3;ar3;el;aIberHel3iGy;e,na;!ly;l3n8;da;aTba,eNiKlIma,yG;a,c3sG;a,on,sa;iGys0J;e,s0I;a,cHna,sGza;a,ha,on,sa;e,ia;c3is5jaIna,ssaIxG;aGia;!nd4;nd4;ra;ia;i0nHyG;ah,na;a,is,naE;c5da,leDmLnslKsG;haElG;inGyW;g,n;!h;ey;ee;en;at5g2nG;es;ie;ha;aVdiSelLrG;eIiG;anLenG;a,e,ne;an0;na;aKeJiHyG;nn;a,n1;a,e;!ne;!iG;de;e,lCsG;on;yn;!lG;iAyn;ne;agaJbHiG;!gaI;ey,i7y;!e;il;ah",
    "City": "true¦0:62;1:5U;2:5A;a5Ib4Dc3Ud3Je3Hf3Dg31h2Ui2Qjak36k2Bl1Ym1Fn14o12p0Kqui1Tr0DsYtKuJvEw8y5z3;ag3uri45;abr1reb;a4e3okoha3K;katerin30r3E;moussouk47ng3Noundé;a6e5i3rocl18;ckl25n3;dho4Pnipeg,terth27;ll4xford;rs14sh3;ingt3H;a5i3;c09en3lni5T;na,tia56;duz,lenc1ncouv1Gr3;na,sav1;lan bat1Btrecht;aDbilisi,eBh9i8o7r6u3;nis4r3;in,ku;!i;ipo32ondheim;kyo,ron16ulouse;anj05l2Gmisoa5Cra2;e3imphu; hague,ssaloni28;gucigalpa,h3l av1V;er0r0;i4llinn,mpe4Ongi12r3shk2E;awa s0Etu;chu4Cn0p0G;a7e6h5ingapo4Lkopje,of1ri jayawardenapura kot0Ut3u3Yydn0Bão tomé;oc3uttga2J;col2Pkholm;angh3Aenzh44;oul,ul,v3S;int Al8n3ppo3Braje4Q; 5a'a,t3;iago3o domin35;! del ci3P;jos3salv5;e,é;v3z1X;ad0K;george3john3peters1V;'s;a8eykjav7i6o3;m4s3t4H;ar08e3L;a,e;ad,ga,o de janei2X;ik,ík;b47mallah;aGeEhDiCo7r3ueb3Tyongya3P;a4e3;tor1;g3ia;a,ue;dgori26rt3zn0; 4-au-prin0Qo3;!-no42;elizabe7louis,moresby,of spa3vi3L;in;ls3Brae4E;iladelph1nom pe13oenix;chi29r3tah tik30;th;l5na1Rr3tr2K;amari23i3;gi,s;ermo,ik0S;des0Js3ttawa,uagadoug13;a3Elo;'djame2aBe7gerulm6i4ouakchott,u3;ova d9r-sult0;am3cos1;ey;ud;ssu2w 3;d4taip3york;ei;el0F;goya,iro3Snt2Apl2Ass2Nv0ypyid3;aw;aBba2BeAi9o4u3;mb1Vni1S;gadisc6n4roni,sc3;a,ow;a1Nrov1t3;evideo,real;io;l0n0Qskolc;dellín,lbour2Z;drid,juro (delap-uliga-djarrit),lBn8pu7r5s3;ca3eru;te;ib3se23;or;to;a4chest3dal0Ki2J;er;gua,ma;a15mo,é;'ava2aBi7o5u3vQy0W;anJbia2s3;a2Hsembur1A;mé,nd3s angel1M;on,ra;brev1Rege,longwe,ma4nz,sbon3verpo5;!a;!ss3;ol; 3usan2F;p4v3;allet0Rel24;az,la0Q;aEharCi8laipe7o4rak3uala lump6;ow;be,pavog4si3;ce;ur;da;ev,ga09n3;gsto4sha3;sa;n,wn;k3tum;iv;b8mpa1Qndy,ohsiu1Mra3tmandu,un0V;c3j;hi;l cai0Onche04s4̇zm3;ir;lam27tanb3;ul;a7e5o3; chi mi3ms,nia27ustZ;nh;lsin3rakliX;ki;ifa,m3noi,ra1Kva2;bu29iltU;aCdanBe9h8i6othen5raz,ua3;dalaja20ngzh3;ou;bu25;ac3bBtega,u1Wza;arU;ent;n3or0Jrusalemme ov0C;e0Noa,ève;sk;boro1Blw3;ay;es,r4unaf3;uti;ankfu3ee0D;rt;dmontDindhov0Or3;ev0;a8ha0Yi7o5u3;bl0Jrb0sh3š3;anbe;do3ha;ma;li;c6e4kar,masc3ugavpiZ;o,us;gu,je3;on;ca;aIebu,hDittà d9o3raio02uriti17;lo6n4pen3rk;agh09hag09;akGstan3;ta;g0Nm3;bo;el 3i san mari4;guatema0Bmessi4vatica3;no;co;enn6i4ristchur3;ch;ang m4ca3ttago02șinău;go;ai;i4lga3nber0Spe Irac8striD;ry;ro;aXeOiLogotKr8u3;c5dap6enos air9r3s0;g3sa;as;ar3har3;est;aAi6u3;sse4xell3;es;ls;d4s3;baY;ge3;town;sil1tisla5zzav3;il3;le;va;a,à;rmingh00ss4šk3;ek;au;i9l7r3;g5l3n;in3;!o;en;grad3mop0;e,o;ji3rut;ng;ghdSku,mako,n7r4s3;el,seterA;celo2ranquil3;la;na;dar seri begaw0g5j3;a lu3ul;ka;alo3kok,ui;re;aPbLccKddis abeJhmedHlFmCn9p1qaJs5t3uckland,şg7;e3hens;ne;h3maHunción;dod,g3;ab3;at;kaDt3;ananari3werp;vo;m0s3;terd3;am; kuwait,exandr1geri,maty;ia;ab3;ad;ba;ra;idj0u3; dha3ja;bi;an;lbo4rh3;us;rg",
    "Honorific": "true¦aPbrigadiOcHdGexcellency,fiBjudge,king,liDmaAofficOp6queen,r3s0taoiseach,vice5;e0ultK;c0rgeaC;ond liAretary;abbi,e0;ar0verend; adK;astGr0;eside6i0ofessF;me ministFnce0;!ss;gistrate,r4yC;eld mar3rst l0;ady,i0;eutena0;nt;shB;oct6utchess;aptain,hance4o0;lonel,mmand5ngress1un0;ci2t;m0wom0;an;ll0;or;er;d0yatullah;mir0;al",
    "Person": "true¦ashton kutchRbQcLdJeHgastMhFinez,jDkCleBmAnettIoprah winfrPp8r4s3t2v0;a0irgin maF;lentino rossi,n go3;heresa may,iger woods,yra banks;addam hussain,carlett johanssIlobodan milosevic,uA;ay romano,eese witherspoHo1ush limbau0;gh;d stewart,nald0;inho,o;a0ipI;lmHris hiltC;essiaen,itt romnEubarek;bron james,e;anye west,iefer sutherland,obe bryant;aime,effers8k rowli0;ng;alle ber0itlBulk hogan;ry;ff0meril lagasse,zekiel;ie;a0enzel washingt2ick wolf;lt1nte;ar1lint0ruz;on;dinal wols1son0;! palm2;ey;arack obama,rock;er",
    "Country": "true¦0:34;1:2R;2:36;a2Pb28c1Xd1Ue1Rf1Qg1Hh1Bi11jama33k0Wl0Qm0En07o06pYrQsFt8u6v4wallis et futu1xiānggǎng costa sud della ci1z3éi0Kís1Eösterreich;a20imbabwe;a3enezue2Yiệt nam;nuatu,ticanæ;gNkraji1n3ru01zbe0W;gher0ited states virgin islands;a8hailand0i7o6u3;nis0Mr3valu;ch0k3;meni2s e caic2E;go,ke2Qnga;bet,mor est;gi0Oiw2Xnz2T;aBeAi9lov8oomaali0Lpag1ri lan0Ztat6u3vez0wazi11ão tomé e príncipe,ām2H;da4omi,ri3;name,yah0U;fr2Nn kusini;i 3o di pales2B;baltici,uni0Y;ac1Len0;erra leo14ngapu2H;negRrb0ychelles;ha2Fint 3kartweEmoa0Jn mari0O;kitts and nevis,luc0vincent e grenadi11;e4om2Hu3;an28;gno uni12pubblica 3;centrafr6d3;e3ominicana república domin5;l3mocratica del3; congo;ica1;a8e7ilipin1So3uerto rK;l4rtogal3;lo;inesia3onia pols0D;! francese;nisola ib21rù;ki2pua nuova guinea,ra3;guay;ceano india06m25;a8e6i4o3;rveg0uvelle calédonie;caragua,ger3;!ia;der05p3;al;mib0ur18;a7ela19i18o3yanm0K;ldova,n4zamb3çamb9;ico;gol0t3;eneg0Nserr0Z;c8dagasc0Fl6rtinica martin5urit4yotte como3;re;an0i0Q;ique;a3dive,i,ta;wi,ys0;au,ed8;a0Ze6i3;b3echtenste0S;aKer0iyah3; nordafr1C;sotho,tt3;on0;a5en4ir3osovo,uwait;ghizi2ibaL;ya;laallit nuna0Iza3;ki2;ndonesia un,ra9s3;ol3raele;a di natale christm0Ne 3;c5falkCmar4vergini3; americaL;ianKshall;aym14ook;k,n (persia) īrān3; vici3;no;a6o4rvats3;ka;l3ndur0D;land;i3ya2;ti;aAha1i8olfo di guinea e,re7u3;a5in4yan3;a,e;ea,é bissau;dalupa,m,tema0H;c0na0D;appo3ordania al urdunn;ne;bKmb0;igi,ranc0øroy8;cu4esti vabariik,git3l salv4mirati arabi,tiop0;to;ador;a3omin0B;nmark,wlat qat3;ar;aAe9i7o3uW;lo5morRrea4sta 3;d'avorio,r06;! del nord;mb0;ad,le,na,p3;ro;ch0;m3naUpo verV;bog0erun camero3;on;aGeAh8irmZo7r6u4yelar3;us;lgar0r3;kina faso,undi;asile brasil,unei;liv0snia ed erzegovi1tswa1;utXār3;at;l4n3rmuJ;in;a3gium,ize;u mi3;cro3;nes0;ham4ngladesh,rbad3;os;as;fghane2lHmFn8otear7r3s sudMustral0zerbaigiM;abia saudita,gen4u3;ba;ti1;na;oa;dor8g6t3;arti4igua and barbu3;da;de;o3uil3;la;ra;er3;ica; 5b3;an0;ia;bahrayn,jaza'ir,maghrib,yam4;st3;an",
    "Place": "true¦aHbFcDdCeuropBfco,gAh9i8jfk,kul,l6m4ord,p2s1the 0upEyyz;bronx,hamptons;fo,oho,underland,yd;ek,h0;l,x;a0co,id9uc;libu,nhattan;a0gw,hr;s,x;ax,cn,st;arlem,kg,nd;ay village,reenwich;a,e;en,fw,own1xb;dg,gk,hina0lt;town;cn,e0kk,rooklyn;l air,verly hills;frica,m0sia,tl;erica0s; 0s;centr0meridion0;ale",
    "Region": "true¦a1Xb1Pc1Fd1Aes19f16g10h0Xi0Vj0Tk0Rl0Om0DnXoVpQqNrKsBt8ut7v4w2y0zacatec1Z;o03u0;cat15kX;a0est vi2isconsin,yomi11;rwick1Nshington dc;er1i0;rgin1Q;acruz,mont;ah,tar pradesh;a1e0laxca1Busca9;nnessee,x1P;bas0Jmaulip1OsmI;a5i3o1taf0Mu0ylh11;ffUrrZs0W;me0Yuth 0;cRdQ;ber1Gc0naloa;hu0Qily;n1skatchew0Pxo0;ny; luis potosi,ta catari1G;a0hode6;j0ngp01;asth0Kshahi;inghai,u0;e0intana roo;bec,ensVreta0C;ara3e1rince edward0; isT;i,nnsylv0rnambu01;an12;!na;axa0Ldisha,h0klaho19ntar0reg3x02;io;ayarit,eAo2u0;evo le0nav0J;on;r0tt0Pva scot0V;f5mandy,th0; 0ampton0O;c2d1yo0;rk0M;ako0W;aroli0T;olk;bras0VvaZw0; 1foundland0;! and labrador;brunswick,hamp0Fjers0mexiIyork state;ey;a5i1o0;nta0Lrelos;ch2dlanAn1ss0;issippi,ouri;as geraEneso0K;igOoacO;dhya,harasht02ine,ni2r0ssachusetts;anhao,y0;land;p0toba;ur;anca02e0incoln02ouisia0B;e0iF;ds;a0entucky,hul08;ns06rnata0Bshmir;alis0iangxi;co;daho,llino0owa;is;a1ert0idalDun9;fordS;mpRwaii;ansu,eorgVlou4u0;an1erre0izhou,jarat;ro;ajuato,gdo0;ng;cesterL;lori1uji0;an;da;sex;e3o1uran0;go;rs0;et;lawaDrbyC;a7ea6hi5o0umbrG;ahui3l2nnectic1rsi0ventry;ca;ut;iLorado;la;apDhuahua;ra;l7m0;bridge2peche;a4r3uck0;ingham0;shi0;re;emen,itish columb2;h1ja cal0sque,var1;iforn0;ia;guascalientes,l3r0;izo1kans0;as;na;a1ber0;ta;ba1s0;ka;ma",
    "Currency": "true¦$,aud,bTcRdMeurLfKgbp,hkd,iJjpy,kHlFnis,p8r7s3usd,x2y1z0¢,£,¥,ден,лв,руб,฿,₡,₨,€,₭,﷼;lotyTł;en,uanS;af,of;h0t6;e0il6;k0q0;elN;iel,oubleMp,upeeM;e3ound0;! st0s;er0;lingI;n0soH;ceGn0;ies,y;e0i8;i,mpi7;n,r0wanzaCyatC;!onaBw;ls,nr;ori7ranc9;!o8;en3i2kk,o0;b0ll2;ra5;me4n0rham4;ar3;ad,e0ny;nt1;aht,itcoin0;!s",
    "Ordinal": "true¦cIdDmilBnoAotta9priLqu5se2t0undEveJ;erzo,re0;dCntI;condo,dBs1tt0;aFiH;saEto;a1in0;d7to;r0ttord6;aAto;ntAvo;no,va8;i0l8;ard7on7;eci7ici1od0;ic5;a0o1;nnov3sse0;tt2;e0inqua0;nt0;esi0;mo",
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

  var misc$1 = {



  };

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


  words = Object.assign({}, words, misc$1);
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
      esimo: ['TextValue', 'Ordinal'],

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
    doc.match('[(abbia|abbiamo|abbiano|abbiate|avemmo|avesse|avessero|avessi|avessimo|aveste|avesti|avete|aveva|avevamo|avevano|avevate|avevo|avrà|avrai|avranno|avrebbe|avrei|avremmo|avremo|avreste|avresti|avrete|avrò|ebbe|ebbero|ebbi|ha|hai|hanno|ho)] #Verb', 0).tag('Auxiliary', 'aux-verb');

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
    m = m.not('#Reflexive$');
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
      [1, 'uno', 'primo'],
      [2, 'due', 'secondo'],
      [3, 'tre', 'terzo'],
      [4, 'quattro', 'quarto'],
      [5, 'cinque', 'quinto'],
      [6, 'sei', 'sesto'],
      [7, 'sette', 'settimo'],
      [8, 'otto', 'ottavo'],
      [9, 'nove', 'nono'],
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
      [1000000000, 'miliardo', 'miliardesimo']
    ]
  };


  const toCardinal = {};
  const toOrdinal = {};
  const toNumber = {};
  // add 'quarantuno'
  data.tens.forEach(a => {
    let str = a[1].replace(/[ia]$/, 'uno');
    data.ones.push([a[0] + 1, str, str]);
    str = a[1].replace(/[ia]$/, '');
    toNumber[str] = a[0]; //'vent' = 20
  });


  Object.keys(data).forEach(k => {
    data[k].forEach(a => {
      let [num, card, ord] = a;
      toCardinal[ord] = card;
      toNumber[card] = num;
      toOrdinal[card] = ord;
    });
  });
  toNumber['tré'] = 3;
  toNumber['mila'] = 1000;
  toNumber['zero'] = 0;

  // list end-strings, for tokenization
  let ends = ['cento', 'mille', 'milione', 'tré', 'mila'];
  data.ones.forEach(a => {
    ends.push(a[1]);
  });
  data.tens.forEach(a => {
    ends.push(a[1]);
  });
  data.hundreds.forEach(a => {
    ends.push(a[1]);
  });
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
    mila: 1000
  };
  data.multiples.forEach(a => {
    multiples$1[a[1]] = a[0];
  });

  // 'dieci|mila'
  toOrdinal['mila'] = 'millesimo';

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
      } else {
        console.log('missing', w);
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

  const formatNumber = function (parsed, fmt) {
    if (fmt === 'TextOrdinal') {
      let words = toText$1(parsed.num);
      if (words.length === 2 && words[0] === 'dieci' && words[1] === 'mila') {
        return 'decimillesimo'
      }
      // only convert the last word
      let last = words[words.length - 1];
      if (toOrdinal.hasOwnProperty(last)) {
        words[words.length - 1] = toOrdinal[last];
      }
      return words.join('')
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

  it.world = () => nlp$1.world();


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
