(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.frCompromise = factory());
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
    // let cache = this._cache || []
    let res = ptrs.map((ptr, i) => {
      let view = this.update([ptr]);
      // view._cache = cache[i]
      return cb(view, i)
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
    // let cache = this._cache || []
    ptrs = ptrs.filter((ptr, i) => {
      let view = this.update([ptr]);
      // view._cache = cache[i]
      return cb(view, i)
    });
    let res = this.update(ptrs); //TODO: keep caches automatically
    // res._cache = ptrs.map(ptr => cache[ptr[0]])
    return res
  };

  const find = function (cb) {
    let ptrs = this.fullPointer;
    // let cache = this._cache || []
    let found = ptrs.find((ptr, i) => {
      let view = this.update([ptr]);
      // view._cache = cache[i]
      return cb(view, i)
    });
    return this.update([found])
  };

  const some = function (cb) {
    let ptrs = this.fullPointer;
    // let cache = this._cache || []
    return ptrs.some((ptr, i) => {
      let view = this.update([ptr]);
      // view._cache = cache[i]
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
      let cache = this._cache || [];
      if (!ptr) {
        ptr = this.docs.map((_doc, i) => [i]);
      }
      if (ptr[n]) {
        let view = this.update([ptr[n]]);
        view._cache = cache[n];
        return view
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
  var api$b = methods$m;

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
      if (m._cache && pointer && pointer.length > 1) {
        // only if it's full
        let cache = [];
        pointer.forEach(ptr => {
          if (ptr.length === 1) {
            cache.push(m._cache[ptr[0]]);
          }
          // let [n, start, end] = ptr
          // if (start === 0 && this.document[n][end - 1] && !this.document[n][end]) {
          //   console.log('=-=-=-= here -=-=-=-')
          // }
        });
        m._cache = cache;
      }
      m.world = this.world;
      return m
    }
    // create a new View, from this one
    toView(pointer) {
      if (pointer === undefined) {
        pointer = this.pointer;
      }
      let m = new View(this.document, pointer);
      // m._cache = this._cache // share this full thing
      return m
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
  Object.assign(View.prototype, api$b);
  var View$1 = View;

  var version$1 = '14.3.1';

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

  const extend = function (plugin, world, View, nlp) {
    const { methods, model, compute, hooks } = world;
    if (plugin.methods) {
      mergeQuick(methods, plugin.methods);
    }
    if (plugin.model) {
      mergeDeep(model, plugin.model);
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
  var api$a = addAPI$3;

  var compute$7 = {
    cache: function (view) {
      view._cache = view.methods.one.cacheDoc(view.document);
    }
  };

  var cache$1 = {
    api: api$a,
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
  let start$1 = 0;

  const pad3 = (str) => {
    str = str.length < 3 ? '0' + str : str;
    return str.length < 3 ? '0' + str : str
  };

  const toId = function (term) {
    let [n, i] = term.index || [0, 0];
    start$1 += 1;
    var now = start$1;
    now = parseInt(now, 10);

    //don't overflow time
    now = now > 46655 ? 46655 : now;
    //don't overflow sentences
    n = n > 46655 ? 46655 : n;
    // //don't overflow terms
    i = i > 1294 ? 1294 : i;

    // 3 digits for time
    let id = pad3(now.toString(36));
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
    if (m.has('@hasContraction')) {//&& m.after('^.').has('@hasContraction')
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
      return input.clone().docs[0] //assume one sentence
    }
    //allow an array of terms, too
    if (isArray$7(input)) {
      return isArray$7(input[0]) ? input[0] : input
    }
    return []
  };

  const insert = function (input, view, prepend) {
    const { document, world } = view;
    // insert words at end of each doc
    let ptrs = view.fullPointer;
    let selfPtrs = view.fullPointer;
    view.forEach((m, i) => {
      let ptr = m.fullPointer[0];
      let [n] = ptr;
      // add-in the words
      let home = document[n];
      let terms = getTerms(input, world);
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
      // two modes:
      //  - a. remove self, from full parent
      let self = this.all();
      let not = this;
      //  - b. remove a match, from self
      if (reg) {
        self = this;
        not = this.match(reg);
      }
      // is it part of a contraction?
      if (self.has('@hasContraction') && self.contractions) {
        let more = self.grow('@hasContraction');
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
      if (!reg) {
        this.ptrs = [];
        return self.none()
      }
      // self._cache = null
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

  var whitespace$1 = methods$i;

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
  const reverse = function () {
    let ptrs = this.pointer || this.docs.map((_d, n) => [n]);
    ptrs = [].concat(ptrs);
    ptrs = ptrs.reverse();
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

  var sort$1 = { unique, reverse, sort };

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

  const methods$g = Object.assign({}, caseFns, insert$1, replace, remove, whitespace$1, sort$1, concat, harden$1);

  const addAPI$2 = function (View) {
    Object.assign(View.prototype, methods$g);
  };
  var api$9 = addAPI$2;

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
    api: api$9,
    compute: compute$6,
  };

  var contractions$3 = [
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

  var model$5 = { one: { contractions: contractions$3 } };

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
    tmp.compute('lexicon');
    if (tmp.world.compute.preTagger) {
      tmp.compute('preTagger');
    }
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
    doc.compute('id');
    return doc.docs[0]
  };

  //really easy ones
  const contractions$1 = (view) => {
    let { world, document } = view;
    const { model, methods } = world;
    let list = model.one.contractions || [];
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
              methods.one.setTag([words[0]], 'Time', world);
            }
            reTag(document[n], view, i, words.length);
          }
        }
      }
    });
  };
  var contractions$2 = contractions$1;

  var compute$4 = { contractions: contractions$2 };

  const plugin = {
    model: model$5,
    compute: compute$4,
    hooks: ['contractions'],
  };
  var contractions = plugin;

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
  const firstPass$1 = function (view) {
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
    lexicon: firstPass$1
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

  var lexicon$3 = {
    model: model$4,
    methods: methods$f,
    compute: compute$3,
    lib: lib$5,
    hooks: ['lexicon']
  };

  // edited by Spencer Kelly
  // credit to https://github.com/BrunoRB/ahocorasick by Bruno Roberto Búrigo.

  const tokenize$3 = function (phrase, world) {
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
      let words = tokenize$3(phrase, world);
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

  function api$8 (View) {

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
    compile: function (input) {
      const trie = build(input, this.world());
      return compress$1(trie)
    }
  };

  var lookup = {
    api: api$8,
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
    // support param as string
    if (typeof regs === 'string') {
      regs = one.killUnicode(regs, this.world);
      regs = one.parseMatch(regs, opts, this.world);
    }
    let todo = { regs, group };
    let res = one.match(this.docs, todo, this._cache);
    let { ptrs, byGroup } = fixPointers(res, this.fullPointer);
    let view = this.toView(ptrs);
    view._groups = byGroup;
    // try to keep some of the cache
    // if (this._cache) {
    //   view._cache = view.ptrs.map(ptr => {
    //     if (isFull(ptr, this.document)) {
    //       return this._cache[ptr[0]]
    //     }
    //     return null
    //   })
    // }
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
    if (typeof regs === 'string') {
      regs = one.killUnicode(regs, this.world);
      regs = one.parseMatch(regs, opts, this.world);
    }
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
    if (typeof regs === 'string') {
      regs = one.killUnicode(regs, this.world);
      regs = one.parseMatch(regs, opts, this.world);
    }
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
    if (typeof regs === 'string') {
      regs = one.killUnicode(regs, this.world);
      regs = one.parseMatch(regs, opts, this.world);
    }
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
    if (typeof regs === 'string') {
      regs = one.killUnicode(regs, this.world);
      regs = one.parseMatch(regs, opts, this.world);
    }
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
  var api$7 = matchAPI;

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

      //machine/sense overloaded
      if (start(w) === '{' && end(w) === '}') {
        w = stripBoth(w);
        if (/\//.test(w)) {
          obj.sense = w;
          obj.greedy = true;
        } else {
          obj.machine = w;
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
  const hasDash$1 = / [-–—] /;

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

  // '!foo' should match anything that isn't 'foo'
  // if it matches, return false
  const doNegative = function (state) {
    const { regs } = state;
    let reg = regs[state.r];
    let tmpReg = Object.assign({}, reg);
    tmpReg.negative = false; // try removing it
    let foundNeg = matchTerm(state.terms[state.t], tmpReg, state.start_i + state.t, state.phrase_length);
    if (foundNeg === true) {
      return null //bye!
    }
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
      // ok, finally test the term-reg
      let hasMatch = matchTerm(state.terms[state.t], reg, state.start_i + state.t, state.phrase_length);
      if (hasMatch === true) {
        let alive = simpleMatch$1(state);
        if (!alive) {
          return null
        }
        continue
      }
      // ok, it doesn't match - but maybe it wasn't *supposed* to?
      if (reg.negative) {
        let alive = doNegative$1(state);
        if (!alive) {
          return null
        }
      }
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
    api: api$7,
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

  const toJSON = function (view, option) {
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
      let res = toJSON(this, n);
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

  const toText = function (term) {
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
          text += toText(t);
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
        opts = Object.assign({}, fmt, opts);//todo: fixme
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
  var api$6 = addAPI$1;

  var output = {
    api: api$6,
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

  const max$1 = 4;

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
  var api$5 = addAPI;

  var pointers = {
    methods: methods$6,
    api: api$5,
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

  const api$3 = function (View) {

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
  var api$4 = api$3;

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

  const parse = function (matches, world) {
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

  var parse$1 = parse;

  // do some indexing on the list of matches
  const compile = function (matches, world) {
    // turn match-syntax into json
    matches = parse$1(matches, world);

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

  var buildNet = compile;

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
        if (obj.ifNo !== undefined && obj.ifNo.some(no => docCache[n].has(no)) === true) {
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
  const runMatch = function (maybeList, document, methods, opts) {
    let results = [];
    for (let n = 0; n < maybeList.length; n += 1) {
      for (let i = 0; i < maybeList[n].length; i += 1) {
        let m = maybeList[n][i];
        // ok, actually do the work.
        let res = methods.one.match([document[n]], m);
        // found something.
        if (res.ptrs.length > 0) {
          // let index=document[n][0].index
          res.ptrs.forEach(ptr => {
            ptr[0] = n; // fix the sentence pointer
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

    // maybeList.forEach((arr, i) => {
    //   let txt = document[i].map(t => t.text).join(' ')
    //   console.log(`==== ${txt} ====`)
    //   arr.forEach(m => {
    //     console.log(`    - ${m.match}`)
    //   })
    // })

    // now actually run the matches
    let results = runMatch$1(maybeList, document, methods, opts);
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
    if (list.length === 0) {
      return list
    }
    // some logging for debugging
    const env = typeof process === 'undefined' || !process.env ? self.env || {} : process.env;
    if (env.DEBUG_TAGS) {
      console.log(`\n\n  \x1b[32m→ ${list.length} post-tagger:\x1b[0m`); //eslint-disable-line
    }
    return list.map(todo => {
      if (!todo.tag && !todo.chunk) {
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
        if (terms.length === 1 && todo.tag === 'Noun') {
          if (terms[0].text && terms[0].text.match(/..s$/) !== null) {
            setTag(terms, 'Plural', world, todo.safe, 'quick-plural');
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
    buildNet,
    bulkMatch,
    bulkTagger
  };

  var sweep = {
    lib: lib$2,
    api: api$4,
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
    // now it's dirty
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

  const e=function(e){return e.children=e.children||[],e._cache=e._cache||{},e.props=e.props||{},e._cache.parents=e._cache.parents||[],e._cache.children=e._cache.children||[],e},t=/^ *(#|\/\/)/,n=function(t){let n=t.trim().split(/->/),r=[];n.forEach((t=>{r=r.concat(function(t){if(!(t=t.trim()))return null;if(/^\[/.test(t)&&/\]$/.test(t)){let n=(t=(t=t.replace(/^\[/,"")).replace(/\]$/,"")).split(/,/);return n=n.map((e=>e.trim())).filter((e=>e)),n=n.map((t=>e({id:t}))),n}return [e({id:t})]}(t));})),r=r.filter((e=>e));let i=r[0];for(let e=1;e<r.length;e+=1)i.children.push(r[e]),i=r[e];return r[0]},r=(e,t)=>{let n=[],r=[e];for(;r.length>0;){let e=r.pop();n.push(e),e.children&&e.children.forEach((n=>{t&&t(e,n),r.push(n);}));}return n},i=e=>"[object Array]"===Object.prototype.toString.call(e),c=e=>(e=e||"").trim(),s=function(c=[]){return "string"==typeof c?function(r){let i=r.split(/\r?\n/),c=[];i.forEach((e=>{if(!e.trim()||t.test(e))return;let r=(e=>{const t=/^( {2}|\t)/;let n=0;for(;t.test(e);)e=e.replace(t,""),n+=1;return n})(e);c.push({indent:r,node:n(e)});}));let s=function(e){let t={children:[]};return e.forEach(((n,r)=>{0===n.indent?t.children=t.children.concat(n.node):e[r-1]&&function(e,t){let n=e[t].indent;for(;t>=0;t-=1)if(e[t].indent<n)return e[t];return e[0]}(e,r).node.children.push(n.node);})),t}(c);return s=e(s),s}(c):i(c)?function(t){let n={};t.forEach((e=>{n[e.id]=e;}));let r=e({});return t.forEach((t=>{if((t=e(t)).parent)if(n.hasOwnProperty(t.parent)){let e=n[t.parent];delete t.parent,e.children.push(t);}else console.warn(`[Grad] - missing node '${t.parent}'`);else r.children.push(t);})),r}(c):(r(s=c).forEach(e),s);var s;},h=e=>"[31m"+e+"[0m",o=e=>"[2m"+e+"[0m",l=function(e,t){let n="-> ";t&&(n=o("→ "));let i="";return r(e).forEach(((e,r)=>{let c=e.id||"";if(t&&(c=h(c)),0===r&&!e.id)return;let s=e._cache.parents.length;i+="    ".repeat(s)+n+c+"\n";})),i},a=function(e){let t=r(e);t.forEach((e=>{delete(e=Object.assign({},e)).children;}));let n=t[0];return n&&!n.id&&0===Object.keys(n.props).length&&t.shift(),t},p={text:l,txt:l,array:a,flat:a},d=function(e,t){return "nested"===t||"json"===t?e:"debug"===t?(console.log(l(e,!0)),null):p.hasOwnProperty(t)?p[t](e):e},u=e=>{r(e,((e,t)=>{e.id&&(e._cache.parents=e._cache.parents||[],t._cache.parents=e._cache.parents.concat([e.id]));}));},f=(e,t)=>(Object.keys(t).forEach((n=>{if(t[n]instanceof Set){let r=e[n]||new Set;e[n]=new Set([...r,...t[n]]);}else {if((e=>e&&"object"==typeof e&&!Array.isArray(e))(t[n])){let r=e[n]||{};e[n]=Object.assign({},t[n],r);}else i(t[n])?e[n]=t[n].concat(e[n]||[]):void 0===e[n]&&(e[n]=t[n]);}})),e),j=/\//;class g{constructor(e={}){Object.defineProperty(this,"json",{enumerable:!1,value:e,writable:!0});}get children(){return this.json.children}get id(){return this.json.id}get found(){return this.json.id||this.json.children.length>0}props(e={}){let t=this.json.props||{};return "string"==typeof e&&(t[e]=!0),this.json.props=Object.assign(t,e),this}get(t){if(t=c(t),!j.test(t)){let e=this.json.children.find((e=>e.id===t));return new g(e)}let n=((e,t)=>{let n=(e=>"string"!=typeof e?e:(e=e.replace(/^\//,"")).split(/\//))(t=t||"");for(let t=0;t<n.length;t+=1){let r=e.children.find((e=>e.id===n[t]));if(!r)return null;e=r;}return e})(this.json,t)||e({});return new g(n)}add(t,n={}){if(i(t))return t.forEach((e=>this.add(c(e),n))),this;t=c(t);let r=e({id:t,props:n});return this.json.children.push(r),new g(r)}remove(e){return e=c(e),this.json.children=this.json.children.filter((t=>t.id!==e)),this}nodes(){return r(this.json).map((e=>(delete(e=Object.assign({},e)).children,e)))}cache(){return (e=>{let t=r(e,((e,t)=>{e.id&&(e._cache.parents=e._cache.parents||[],e._cache.children=e._cache.children||[],t._cache.parents=e._cache.parents.concat([e.id]));})),n={};t.forEach((e=>{e.id&&(n[e.id]=e);})),t.forEach((e=>{e._cache.parents.forEach((t=>{n.hasOwnProperty(t)&&n[t]._cache.children.push(e.id);}));})),e._cache.children=Object.keys(n);})(this.json),this}list(){return r(this.json)}fillDown(){var e;return e=this.json,r(e,((e,t)=>{t.props=f(t.props,e.props);})),this}depth(){u(this.json);let e=r(this.json),t=e.length>1?1:0;return e.forEach((e=>{if(0===e._cache.parents.length)return;let n=e._cache.parents.length+1;n>t&&(t=n);})),t}out(e){return u(this.json),d(this.json,e)}debug(){return u(this.json),d(this.json,"debug"),this}}const _=function(e){let t=s(e);return new g(t)};_.prototype.plugin=function(e){e(this);};

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
  var api$2 = tagAPI;

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
    api: api$2,
    lib: lib$1
  };

  const initSplit = /(\S.+?[.!?\u203D\u2E18\u203C\u2047-\u2049])(?=\s|$)/g; //!TODO: speedup this regex
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
        all.push(arr[o]);
      }
    }
    return all
  };
  var basicSplit$1 = basicSplit;

  const isAcronym$2 = /[ .][A-Z]\.? *$/i;
  const hasEllipse = /(?:\u2026|\.{2,}) *$/;
  const hasLetter$1 = /\p{L}/u;

  /** does this look like a sentence? */
  const isSentence = function (str, abbrevs) {
    // must have a letter
    if (hasLetter$1.test(str) === false) {
      return false
    }
    // check for 'F.B.I.'
    if (isAcronym$2.test(str) === true) {
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

  //(Rule-based sentence boundary segmentation) - chop given text into its proper sentences.
  // Ignore periods/questions/exclamations used in acronyms/abbreviations/numbers, etc.
  //regs-
  const hasSomething = /\S/;
  const startWhitespace = /^\s+/;
  const hasLetter = /[a-z0-9\u00C0-\u00FF\u00a9\u00ae\u2000-\u3300\ud000-\udfff]/i;

  const splitSentences = function (text, model) {
    let abbrevs = model.one.abbreviations || new Set();
    text = text || '';
    text = String(text);
    let sentences = [];
    // First do a greedy-split..
    let chunks = [];
    // Ensure it 'smells like' a sentence
    if (!text || typeof text !== 'string' || hasSomething.test(text) === false) {
      return sentences
    }
    // cleanup unicode-spaces
    text = text.replace('\xa0', ' ');
    // Start somewhere:
    let splits = basicSplit$1(text);
    // Filter-out the crap ones
    for (let i = 0; i < splits.length; i++) {
      let s = splits[i];
      if (s === undefined || s === '') {
        continue
      }
      //this is meaningful whitespace
      if (hasSomething.test(s) === false || hasLetter.test(s) === false) {
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
    //detection of non-sentence chunks:
    //loop through these chunks, and join the non-sentence chunks back together..
    for (let i = 0; i < chunks.length; i++) {
      let c = chunks[i];
      //should this chunk be combined with the next one?
      if (chunks[i + 1] && isSentence$1(c, abbrevs) === false) {
        chunks[i + 1] = c + (chunks[i + 1] || '');
      } else if (c && c.length > 0) {
        //this chunk is a proper sentence..
        sentences.push(c);
        chunks[i] = '';
      }
    }
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
  var sentence = splitSentences;

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

  let notWord = ['.', '?', '!', ':', ';', '-', '–', '—', '--', '...', '(', ')', '[', ']', '"', "'", '`'];
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
  var term = splitWords;

  //all punctuation marks, from https://en.wikipedia.org/wiki/Punctuation
  //we have slightly different rules for start/end - like #hashtags.
  const startings =
    /^[ \n\t.[\](){}⟨⟩:,،、‒–—―…!‹›«»‐\-?‘’;/⁄·&*•^†‡°¡¿※№÷×ºª%‰+−=‱¶′″‴§~|‖¦©℗®℠™¤₳฿\u0022\uFF02\u0027\u201C\u201F\u201B\u201E\u2E42\u201A\u2035\u2036\u2037\u301D\u0060\u301F]+/;
  const endings =
    /[ \n\t.'[\](){}⟨⟩:,،、‒–—―…!‹›«»‐\-?‘’;/⁄·&*@•^†‡°¡¿※#№÷×ºª‰+−=‱¶′″‴§~|‖¦©℗®℠™¤₳฿\u0022\uFF02\u201D\u00B4\u301E]+$/;
  const hasApostrophe$1 = /['’]/;
  const hasAcronym = /^[a-z]\.([a-z]\.)+/i;
  const minusNumber = /^[-+.][0-9]/;
  const shortYear = /^'[0-9]{2}/;

  const normalizePunctuation = function (str) {
    let original = str;
    let pre = '';
    let post = '';
    // number cleanups
    str = str.replace(startings, found => {
      pre = found;
      // support '-40'
      if ((pre === '-' || pre === '+' || pre === '.') && minusNumber.test(str)) {
        pre = '';
        return found
      }
      // support years like '97
      if (pre === `'` && shortYear.test(str)) {
        pre = '';
        return found
      }
      return ''
    });
    str = str.replace(endings, found => {
      post = found;
      // keep s-apostrophe - "flanders'" or "chillin'"
      if (hasApostrophe$1.test(found) && /[sn]['’]$/.test(original) && hasApostrophe$1.test(pre) === false) {
        post = post.replace(hasApostrophe$1, '');
        return `'`
      }
      //keep end-period in acronym
      if (hasAcronym.test(str) === true) {
        post = post.replace(/\./, '');
        return '.'
      }
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
  var tokenize$2 = normalizePunctuation;

  const parseTerm = txt => {
    // cleanup any punctuation as whitespace
    let { str, pre, post } = tokenize$2(txt);
    const parsed = {
      text: str,
      pre: pre,
      post: post,
      tags: new Set(),
    };
    return parsed
  };
  var whitespace = parseTerm;

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

  const isAcronym$1 = function (str) {
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
    if (isAcronym$1(str)) {
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

  // turn a string input into a 'document' json format
  const fromString = function (input, world) {
    const { methods, model } = world;
    const { splitSentences, splitTerms, splitWhitespace } = methods.one.tokenize;
    input = input || '';
    // split into sentences
    let sentences = splitSentences(input, model);
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

  var methods$2 = {
    one: {
      killUnicode: killUnicode$1,
      tokenize: {
        splitSentences: sentence,
        splitTerms: term,
        splitWhitespace: whitespace,
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
    'mister',
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
    'surg',
    //miss
    //misses
  ];

  var months = ['jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec'];

  var nouns$1 = [
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
    'ft', //ambiguous
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
    'gb', //ambig
    'tb', //terabyte
    'lx', //lux
    'lm', //lumen
    'pa', //ambig
    'fl oz', //

    'yb',
  ];

  // add our abbreviation list to our lexicon
  let list = [
    [misc$2],
    [units, 'Unit'],
    [nouns$1, 'Noun'],
    [honorifics, 'Honorific'],
    [months, 'Month'],
    [organizations, 'Organization'],
    [places, 'Place'],
  ];
  // create key-val for sentence-tokenizer
  let abbreviations = {};
  // add them to a future lexicon
  let lexicon$2 = {};

  list.forEach(a => {
    a[0].forEach(w => {
      // sentence abbrevs
      abbreviations[w] = true;
      // future-lexicon
      lexicon$2[w] = 'Abbreviation';
      if (a[1] !== undefined) {
        lexicon$2[w] = [lexicon$2[w], a[1]];
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
  var suffixes = {
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
  let compact = {
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
    u: 'µÙÚÛÜùúûüŨũŪūŬŭŮůŰűŲųƯưƱƲǓǔǕǖǗǘǙǚǛǜȔȕȖȗɄΰμυϋύ',
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

  var model$3 = {
    one: {
      aliases: aliases$1,
      abbreviations,
      prefixes,
      suffixes,
      lexicon: lexicon$2, //give this one forward
      unicode: unicode$1,
    },
  };

  const hasSlash = /\//;
  const hasDomain = /[a-z]\.[a-z]/i;
  const isMath = /[0-9]/;
  // const hasSlash = /[a-z\u00C0-\u00FF] ?\/ ?[a-z\u00C0-\u00FF]/
  // const hasApostrophe = /['’]s$/

  const addAliases = function (term, world) {
    let str = term.normal || term.text;
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

  var tokenize$1 = {
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

  const api = function (View) {
    View.prototype.autoFill = autoFill;
  };
  var api$1 = api;

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
    api: api$1,
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
  nlp$1.plugin(contractions); //~6kb
  nlp$1.extend(tokenize$1); //7kb
  nlp$1.plugin(cache$1); //~1kb
  nlp$1.extend(lookup); //7kb
  nlp$1.extend(typeahead); //1kb
  nlp$1.extend(lexicon$3); //1kb
  nlp$1.extend(sweep); //1kb

  var tokenize = {};

  var version = '0.0.1';

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

  const toArray$1 = function (txt) {
    const pipe = /\|/;
    return txt.split(/,/).map(str => {
      let a = str.split(pipe);
      return expand(a[0], a[1])
    })
  };

  const uncompress = function (model = {}) {
    model = Object.assign({}, model);

    // compress fwd rules
    model.rules = toArray$1(model.rules);
    model.rules = indexRules(model.rules);

    // compress reverse rules
    if (model.rev) {
      model.rev = toArray$1(model.rev);
      model.rev = indexRules(model.rev);
    }

    // compress exceptions
    model.exceptions = toArray$1(model.exceptions);
    model.exceptions = model.exceptions.reduce((h, a) => {
      h[a[0]] = a[1];
      return h
    }, {});
    return model
  };
  var uncompress$1 = uncompress;

  // console.log(expand('fixture', '6ing'))
  // console.log(toArray('heard|4'))

  // generated in ./lib/models
  var model$1 = {
    "presentTense": {
      "first": {
        "rules": "borrire|4o,cestire|4o,enavere|2ò,ompire|4o,iuscire|1esco,terdire|5co,avenire|4go,anguire|4o,aladire|5co,alliare|3o,iacere|3cio,lagere|3gio,emorire|2uoio,evenire|4go,pparire|3io,ibere|3vo,dormire|4o,idovere|2evo,isalire|4go,iudire|1odo,iuliare|3o,mbuiare|3o,atchare|1cho,rignere|2ngo,bullire|1ollo,raudire|2odo,ssalire|4go,sdire|3co,rvenire|4go,aledire|5co,manere|3go,aprire|3o,enedire|5co,empire|4o,escire|3o,svenire|4go,trabere|5vo,parere|2io,mparire|3io,addire|4co,potere|2sso,fuggire|4o,offrire|4o,cucire|4o,ivenire|4go,coprire|4o,sapere|1o,vvenire|4go,valere|3go,olere|1glio,nvenire|4go,sentire|4o,vestire|4o,seguire|4o,trarre|3ggo,tenere|3go,gliere|lgo,durre|2co,porre|2ngo,ire|1sco,ere|o,are|o,irci|o,erci|o",
        "exceptions": "adsorbire|6o,avere|ho,avvertire|6o,bere|2vo,boglire|5o,bullizzare|6o,contradire|8co,convertire|7o,decarbonizzare|10o,dipartire|6o,dire|2co,disparire|5io,disservire|7o,divertire|6o,ebere|3vo,esserci|sono,impecettare|5atto,impedantire|spendantisco,interconvertire|12o,intormentire|9o,invertire|6o,manicare|3uco,mensilizzare|10o,mentire|4o,morire|1uoio,paleggiare|5io,partire|4o,pervertire|7o,pinneggiare|8io,plaudire|5o,preavvertire|9o,prevertire|7o,provenire|6go,raggrovigliare|10o,rattralciare|9io,riassorbire|8o,riavvertire|8o,ribollire|6o,riconvertire|9o,ridare|3ò,ridire|4co,riespugnare|2pugno,rimeggiare|7io,rimorire|3uoio,rimpecettare|6atto,rinchiocciolire|inchiocciolisco,rinverniciare|2vernicio,rinvertire|7o,ripartire|6o,risovvertire|9o,ristare|4ò,rivalicare|tivalico,salire|3go,sbaldire|7isco,sbarbarire|8o,sbellicare|9o,scombugliare|8o,scoraggire|7o,scovrire|5o,servire|4o,smorire|2uoio,sobbollire|7o,sovvertire|7o,teletrasmettere|8etto,udire|odo,venire|3go,aborrire|5o,accendere|6o,algere|3o,ardere|3o,assidere|5o,astergere|6o,astraggere|7o,battere|4o,benedicere|7o,cherere|4o,chierere|5o,compire|5o,dedurre|4co,desumere|5o,distraggere|8o,dormirci|4o,ducere|3o,effondere|6o,elidere|4o,empire|4o,eradere|4o,ergere|3o,erigere|4o,erodere|4o,escire|3o,esimere|4o,fremere|4o,indurre|4co,intrasentire|9o,languire|5o,lecere|3o,ledere|3o,licere|3o,metterci|4o,mietere|4o,mingere|4o,offrire|4o,palliare|4o,parere|2io,pedere|3o,piacere|4cio,potere|2sso,prenderci|5o,presapere|4o,raccendere|7o,radere|3o,reddere|4o,redurre|4co,riaccendere|8o,riardere|5o,ricidere|5o,ridere|3o,riducere|5o,riescire|5o,risapere|3o,riudire|2odo,sapere|1o,sbattere|5o,sedurre|4co,sentirci|4o,serpere|4o,soffrire|5o,solere|2glio,sopravvivere|9o,sottraggere|8o,strignere|4ngo,sumere|3o,tangere|4o,temere|3o,tergere|4o,traggere|5o,turgere|4o,ungere|3o,urgere|3o,vertere|4o,vivere|3o,volere|2glio",
        "rev": "bduco|3rre,brado|4ere,ccesto|5ire,ccigno|5ere,quiesco|6ere,dergo|4ere,dsorbo|5ire,hilisco|4re,ttollo|5ere,oriduco|5rre,ullizo|5zare,lango|4ere,omburo|5ere,mpletto|6ere,tradico|5re,robatto|6ere,roverto|6ere,onvergo|6ere,onvivo|5ere,orrodo|5ere,rbonizo|6zare,erido|4ere,etergo|5ere,irimo|4ere,iscerpo|6ere,ispaio|4rire,isservo|6ire,ivergo|5ere,stollo|5ere,oriesco|3uscire,ioisco|3re,mbevo|4ere,ncendo|5ere,ncuto|4ere,ndulgo|5ere,tercido|6ere,terdico|5re,nveisco|4re,aladico|5re,almetto|6ere,anuco|2icare,ilizzao|6re,egligo|5ere,alegio|4giare,erduco|4rre,erplimo|6ere,laggio|3ere,reposso|4tere,resummo|6ere,roludo|5ere,ropello|6ere,rosumo|5ere,roviglo|6iare,edigo|4ere,edimo|4ere,iappaio|5rire,assorbo|6ire,icompio|6ere,idico|3re,idormo|5ire,idevo|2overe,iempio|5re,iergo|4ere,ipugno|1espugnare,ioffro|5ire,ipeto|4ere,iposso|3tere,iscoto|5ere,isento|5ire,isiedo|5ere,itemo|4ere,itergo|5ere,itraggo|6ere,ivivo|4ere,ivoglio|3lere,dirisco|3e,arbario|6re,llicaro|6e,alfisco|4re,usciulo|6iare,ombuglo|6iare,combuo|5iare,coraggo|6ire,corgo|4ere,cracho|3tchare,obbollo|6ire,offero|5ere,offondo|6ere,rabbevo|6ere,oprasso|6apere,orrado|5ere,pengo|4ere,traso|4apere,avoglio|3lere,ubbollo|3ullire,uffondo|6ere,uffulco|6ere,pplisco|4re,rasetto|3mettere,nsfondo|6ere,rasduco|5rre,asfondo|6ere,raspaio|5rere,raodo|2udire,cilisco|4re,llido|4ere,ssento|5ire,ombatto|6ere,tundo|4ere,fungo|4ere,elinquo|6ere,epello|5ere,ibatto|5ere,iparto|5ire,sdico|3re,ispegno|6ere,svoglio|3lere,sigo|3ere,pecatto|3ettare,pigno|4ere,delisco|4re,dirigo|5ere,glisco|3re,trido|4ere,aledico|5re,mango|3ere,diligo|5ere,emetto|5ere,resumo|5ere,adduco|4rre,apro|3ire,enedico|5re,competo|6ere,espello|6ere,fervo|4ere,gemo|3ere,mesco|4ere,pasco|4ere,splendo|6ere,traduco|5rre,fotto|4ere,ffolco|5ere,rrido|4ere,conduco|5rre,addico|4re,eludo|4ere,mordo|4ere,scuto|4ere,suado|4ere,spando|5ere,plodo|4ere,vado|3ere,combo|4ere,tilisco|4re,rilisco|4re,ermetto|6ere,ccido|4ere,iio|1are,nasco|4ere,abbatto|6ere,compaio|5rire,fuggo|4ire,godo|3ere,porgo|4ere,ricevo|5ere,onsento|6ire,lludo|4ere,ffisco|3re,ncido|4ere,salgo|3ire,sorgo|4ere,surgo|4ere,ulisco|3re,fulgo|4ere,ecido|4ere,piango|5ere,fingo|4ere,spondo|5ere,iffondo|6ere,imetto|5ere,ascondo|6ere,cucio|4re,perdo|4ere,tolgo|2gliere,rametto|6ere,scindo|5ere,muoio|1orire,scelgo|3gliere,premo|4ere,colgo|2gliere,alisco|3re,bilisco|4re,ssumo|4ere,divido|5ere,cado|3ere,rudo|3ere,mungo|4ere,chiedo|5ere,sciolgo|4gliere,copro|4ire,credo|4ere,bevo|2re,spergo|5ere,visco|2re,struggo|6ere,vilisco|4re,fletto|5ere,nfondo|5ere,vendo|4ere,pungo|4ere,tesso|4ere,valgo|3ere,nnetto|5ere,stringo|6ere,roduco|4rre,misco|2re,spargo|5ere,stinguo|6ere,mergo|4ere,fendo|4ere,frango|5ere,tingo|4ere,cerno|4ere,vesto|4ire,smetto|5ere,chiudo|5ere,seguo|4ire,nosco|4ere,rompo|4ere,cludo|4ere,cresco|5ere,torco|4ere,traggo|3rre,vinco|4ere,pendo|4ere,cingo|4ere,scendo|5ere,sisto|4ere,verto|4ire,primo|4ere,ometto|5ere,pingo|4ere,gisco|2re,rendo|4ere,eggo|3ere,mmetto|5ere,iungo|4ere,tengo|3ere,olvo|3ere,cedo|3ere,corro|4ere,zisco|2re,cisco|2re,bisco|2re,iggo|3ere,olisco|3re,scrivo|5ere,olgo|3ere,vengo|3ire,llisco|3re,pisco|2re,tendo|4ere,sisco|2re,hisco|2re,pongo|2rre,uisco|2re,nisco|2re,tisco|2re,disco|2re,risco|2re,o|are,enò|2avere,ò|are"
      },
      "second": {
        "rules": "bbicare|4hi,borrire|5,cestire|5,olciare|4,eluiare|4,mpliare|4,issiare|4,enavere|3i,ompire|4i,laniare|4,logiare|4,iuscire|1esci,terdire|5ci,avenire|2ieni,radiare|4,anguire|5,aladire|5ci,iggiare|4,alliare|3,rodiare|4,emorire|2uori,evenire|2ieni,umolare|4,pparire|5,ibere|3vi,dormire|5,idovere|2evi,ilegare|4hi,iudire|1odi,modiare|4,olgiare|4,abicare|4hi,iuliare|3,mbuiare|3,atchare|1chi,ulciare|4,orpiare|4,bullire|1olli,blocare|4hi,raviare|4,reviare|4,bbuiare|4,iviare|3,rocare|3hi,ssalire|5,unniare|4,oquiare|4,endiare|4,sdire|3ci,tongare|4hi,ulgare|3hi,lencare|4hi,ivocare|4hi,tasiare|4,raniare|4,orviare|4,peciare|4,concare|4hi,maniare|4,arsiare|4,rvenire|2ieni,aledire|5ci,vicare|3hi,bliare|3,cipiare|4,ovocare|4hi,aprire|4,enedire|5ci,mparire|5,empire|4,escire|4,svenire|2ieni,uliare|3,moncare|4hi,trabere|5vi,uggiare|4,mpiare|3,esciare|4,rniare|3,ioncare|4hi,addire|4ci,elegare|4hi,elciare|4,rgiare|3,potere|1uoi,evocare|4hi,fuggire|5,giocare|4hi,offrire|5,incare|3hi,rbicare|4hi,llocare|4hi,negare|3hi,oniare|3,cucire|4,copiare|4,segare|3hi,udiare|3,usciare|4,tiare|2,agiare|3,ivenire|2ieni,focare|3hi,uocare|3hi,ggare|2hi,oliare|3,coprire|5,volere|1uoi,sapere|2i,uciare|3,nchiare|4,llegare|4hi,vvenire|2ieni,igiare|3,egiare|3,idiare|3,isciare|4,egliare|4,micare|3hi,ingare|3hi,nvenire|2ieni,osciare|4,ugiare|3,sentire|5,miare|2,ngiare|3,vestire|5,ghiare|3,oggiare|4,ediare|3,seguire|5,ociare|3,zzicare|4hi,nicare|3hi,iegare|3hi,angare|3hi,rchiare|4,rciare|3,oiare|2,sicare|3hi,aciare|3,picare|3hi,aiare|2,regare|3hi,iliare|3,asciare|4,ugliare|4,ucare|2hi,trarre|3i,ppiare|3,tenere|1ieni,ugare|2hi,gliere|3,fiare|2,schiare|4,iciare|3,cicare|3hi,ancare|3hi,durre|2ci,ecare|2hi,rgare|2hi,acare|2hi,lcare|2hi,dicare|3hi,aggiare|4,agare|2hi,rcare|2hi,igare|2hi,ricare|3hi,ogare|2hi,ticare|3hi,biare|2,licare|3hi,nciare|3,riare|2,scare|2hi,porre|2ni,agliare|4,ziare|2,cciare|3,ccare|2hi,ficare|3hi,ire|1sci,ere|i,are|i,irci|1,erci|i",
        "exceptions": "abbacchiare|8,abbatacchiare|10,abbigliare|7,abbozzacchiare|11,abbrigliare|8,abbruciacchiare|12,accaneggiare|9,accapigliare|9,accareggiare|9,accavalciare|9,accavigliare|9,accigliare|7,acconigliare|9,adocchiare|7,adsorbire|7,affattucchiare|11,affigliare|7,aggricchiare|9,aggrovigliare|10,agucchiare|7,albeggiare|7,aleggiare|6,alleggiare|7,alpeggiare|7,amareggiare|8,ammanigliare|9,ammogliare|7,ammonticchiare|11,ammucchiare|8,amoreggiare|8,ancheggiare|8,annodicchiare|10,anticheggiare|10,apparecchiare|10,apparigliare|9,appigliare|7,archeggiare|8,arieggiare|7,armeggiare|7,arpeggiare|7,arroncare|6hi,arruncigliare|10,artigliare|7,aspreggiare|8,asseggiare|7,assimigliare|9,assomigliare|9,assottigliare|10,asteggiare|7,atteggiare|7,attorcigliare|10,attortigliare|10,attroncare|7hi,avere|hai,avocare|4hi,avvertire|7,avviticchiare|10,avvogliare|7,bacchiare|6,bambineggiare|10,bamboleggiare|10,beccheggiare|9,beccucchiare|9,beffeggiare|8,begare|3hi,bere|2vi,bevicchiare|8,biancheggiare|10,biondeggiare|9,bisbigliare|8,bizantineggiare|12,boccheggiare|9,boglire|5,borbogliare|8,bordeggiare|8,borseggiare|8,brandeggiare|9,brogliare|6,bruciacchiare|10,bucacchiare|8,buffoneggiare|10,bullizzare|6i,calciare|5,caldeggiare|8,campeggiare|8,campicchiare|9,candeggiare|8,canneggiare|8,cannoneggiare|10,canticchiare|9,capeggiare|7,capitaneggiare|11,carreggiare|8,carteggiare|8,catoneggiare|9,cazzeggiare|8,classicheggiare|12,comunisteggiare|12,consigliare|8,conteggiare|8,contradire|8ci,convertire|8,convocare|6hi,convogliare|8,corricchiare|9,corseggiare|8,corteggiare|8,costeggiare|8,costicchiare|9,crocchiare|7,danneggiare|8,dardeggiare|8,dare|2i,decarbonizzare|10i,defogliare|7,destreggiare|9,dileggiare|7,dilungare|6hi,dipartire|7,dire|2ci,disimbrogliare|11,disormeggiare|10,disparire|7,dispogliare|8,disservire|8,dissomigliare|10,disviare|5,diteggiare|7,divertire|7,dormicchiare|9,dottoreggiare|10,drappeggiare|9,ebere|3vi,echeggiare|7,epicureggiare|10,esserci|sei,falciare|5,favoleggiare|9,favoreggiare|9,festeggiare|8,fiammeggiare|9,fiancheggiare|10,figliare|5,fileggiare|7,filosofeggiare|11,fiorentineggiare|13,fiscaleggiare|10,focheggiare|8,folgoreggiare|10,folleggiare|8,foracchiare|8,franceseggiare|11,frascheggiare|10,fraseggiare|8,frivoleggiare|10,frondeggiare|9,fronteggiare|9,fumeggiare|7,furoreggiare|9,galleggiare|8,gareggiare|7,gatteggiare|8,germogliare|8,giganteggiare|10,gigioneggiare|10,giovaneggiare|10,giuracchiare|9,gorgheggiare|9,gorgogliare|8,gozzovigliare|10,gracchiare|7,grandeggiare|9,grigliare|6,guerreggiare|9,idoleggiare|8,imbottigliare|10,imbrigliare|8,imbrogliare|8,imbroncare|7hi,impapocchiare|10,impastocchiare|11,impecettare|5atti,impedantire|spendantisci,impennacchiare|11,impidocchiare|10,impigliare|7,incavigliare|9,indietreggiare|11,indire|4ci,infinocchiare|10,inneggiare|7,interconvertire|13,interfogliare|10,intormentire|10,intralciare|8,invecchiare|8,inveggiare|7,invertire|7,invocare|5hi,invogliare|7,italianeggiare|11,labbreggiare|9,ladroneggiare|10,lampeggiare|8,langueggiare|9,largheggiare|9,latineggiare|9,latteggiare|8,lavoracchiare|10,lavoricchiare|10,lavorucchiare|10,lazzeggiare|8,legare|3hi,leggicchiare|9,leggiucchiare|10,lenteggiare|8,leopardeggiare|11,lingueggiare|9,locare|3hi,lumeggiare|7,lussureggiare|10,lustreggiare|9,macchiare|6,madreggiare|8,madrigaleggiare|12,maestraleggiare|12,mammoleggiare|10,maneggiare|7,mangiucchiare|10,manicare|3uchi,maramaldeggiare|12,mareggiare|7,marmoreggiare|10,marzeggiare|8,matrigneggiare|11,matteggiare|8,mazzapicchiare|11,mensilizzare|10i,mentire|5,meravigliare|9,mercanteggiare|11,metaforeggiare|11,misticheggiare|11,molleggiare|8,mondaneggiare|10,moraleggiare|9,mordicchiare|9,morire|1uori,mormoracchiare|11,mormoreggiare|10,morsecchiare|9,morseggiare|8,morsicchiare|9,mostreggiare|9,motteggiare|8,naturaleggiare|11,negreggiare|8,nereggiare|7,nicchiare|6,ninfeggiare|8,nodeggiare|7,noleggiare|7,novelleggiare|10,occhieggiare|9,ocheggiare|7,ombreggiare|8,ondeggiare|7,oracoleggiare|10,orecchiare|7,origliare|6,ormeggiare|7,ossequiare|7,osteggiare|7,ovviare|4,ozieggiare|7,pacchiare|6,padreggiare|8,padroneggiare|10,paganeggiare|9,paleggiare|5i,palleggiare|8,palpeggiare|8,panneggiare|8,parcheggiare|9,pareggiare|7,pargoleggiare|10,parlucchiare|9,parteggiare|8,particolareggiare|14,partire|5,passeggiare|8,pasteggiare|8,pastigliare|8,patteggiare|8,pazzeggiare|8,pedaleggiare|9,pedanteggiare|10,pelacchiare|8,pennelleggiare|11,personeggiare|10,pervertire|8,petrarcheggiare|12,pettegoleggiare|12,piacevoleggiare|12,piaciucchiare|10,pianeggiare|8,piangiucchiare|11,piazzeggiare|9,pigliare|5,pignoleggiare|10,pirateggiare|9,pispigliare|8,pitagoreggiare|11,plaudire|6,poeteggiare|8,politicheggiare|12,poltroneggiare|11,pompeggiare|8,porporeggiare|10,posteggiare|8,preavvertire|10,predire|5ci,prevertire|8,primeggiare|8,prodeggiare|8,proeggiare|7,profeteggiare|10,prolungare|7hi,proseggiare|8,provenire|4ieni,provenzaleggiare|13,prueggiare|7,punteggiare|8,puntigliare|8,punzecchiare|9,purpureggiare|10,puttaneggiare|10,puzzacchiare|9,puzzicchiare|9,radicaleggiare|11,raggrovigliare|10,ragionacchiare|11,rallungare|7hi,rameggiare|7,rancheggiare|9,randeggiare|8,rannicchiare|9,rappigliare|8,rassimigliare|10,rassomigliare|10,rassottigliare|11,ravviare|5,remeggiare|7,riaffogliare|9,riammogliare|9,riammucchiare|10,riapparecchiare|12,riassorbire|9,riassottigliare|12,riavvertire|9,riavviticchiare|12,ribaldeggiare|10,ribollire|7,riconsigliare|10,riconvertire|10,riconvocare|8hi,riconvogliare|10,ridacchiare|8,ridanneggiare|10,ridare|4i,ridicchiare|8,ridicoleggiare|11,ridire|4ci,riecheggiare|9,riespugnare|2pugni,rifalciare|7,rifesteggiare|10,rifiammeggiare|11,rifigliare|7,rigalleggiare|10,rigermogliare|10,rigracchiare|9,rilampeggiare|10,rimacchiare|8,rimaneggiare|9,rimbrigliare|9,rimbrogliare|9,rimorire|3uori,rimpecettare|6atti,rinchiocciolire|inchiocciolisci,rinverniciare|2vernici,rinvertire|8,rinviare|5,rinvogliare|8,ripalpeggiare|10,ripareggiare|9,ripartire|7,ripatteggiare|10,ripicchiare|8,ripigliare|7,risaccheggiare|11,risbadigliare|10,risimigliare|9,risomigliare|9,risovvertire|10,rispecchiare|9,rispogliare|8,ristare|5i,risucchiare|8,ritaglieggiare|11,ritroncare|7hi,rivagheggiare|10,rivaleggiare|9,rivalicare|tivalichi,romanzeggiare|10,rosicchiare|8,rosseggiare|8,roteggiare|7,rotondeggiare|10,rovigliare|7,rubacchiare|8,ruffianeggiare|11,rumoreggiare|9,saccheggiare|9,salmeggiare|8,satireggiare|9,sbacchiare|7,sbaciucchiare|10,sbadacchiare|9,sbadigliare|8,sbaldire|7isci,sbandeggiare|9,sbarbarire|8,sbatacchiare|9,sbavicchiare|9,sbavigliare|8,sbeffeggiare|9,sbellicare|9hi,sbevacchiare|9,sbevicchiare|9,sbevucchiare|9,sbirreggiare|9,sbrigliare|7,sbrogliare|7,sbroncare|6hi,scacchiare|7,scalciare|6,scapecchiare|9,scapigliare|8,scapocchiare|9,scarabocchiare|11,scaracchiare|9,scarmigliare|9,scarseggiare|9,scatricchiare|10,sceneggiare|8,scheggiare|7,scherzeggiare|10,schiaffeggiare|11,scimmieggiare|10,sciupacchiare|10,scombugliare|8,scompigliare|9,sconocchiare|9,sconsigliare|9,scorbacchiare|10,scoreggiare|8,scornacchiare|10,scovrire|6,scribacchiare|10,scricchiare|8,scrivacchiare|10,scrivicchiare|10,scrivucchiare|10,scrupoleggiare|11,sdottoreggiare|11,secolareggiare|11,segnoreggiare|10,sermoneggiare|10,serpeggiare|8,servire|5,sfogliare|6,sfolgoreggiare|11,sforacchiare|9,sfotticchiare|10,sgranocchiare|10,sgrovigliare|9,signoreggiare|10,simboleggiare|10,simigliare|7,simoneggiare|9,slalomeggiare|10,slegare|4hi,slungare|5hi,smangiucchiare|11,smerigliare|8,smorire|2uori,sobbollire|8,socrateggiare|10,soleggiare|7,solere|1uoli,solfeggiare|8,someggiare|7,somigliare|7,sonnacchiare|9,sonnecchiare|9,sornacchiare|9,sorrecchiare|9,sorseggiare|8,sorteggiare|8,sottigliare|8,sottostare|8i,sovvertire|8,spadroneggiare|11,spalleggiare|9,spannocchiare|10,sparacchiare|9,sparecchiare|9,sparigliare|8,spazieggiare|9,specchiare|7,spelacchiare|9,spennacchiare|10,spernacchiare|10,spidocchiare|9,spogliare|6,spuleggiare|8,spumeggiare|8,sputacchiare|9,stampigliare|9,stare|3i,stentacchiare|10,stigliare|6,stiracchiare|9,strafalciare|9,stralciare|7,strigliare|7,stroncare|6hi,studiacchiare|10,succhiare|6,sunteggiare|8,svecchiare|7,svillaneggiare|11,sviticchiare|9,taccheggiare|9,taglieggiare|9,tambureggiare|10,tasteggiare|8,tedescheggiare|11,teletrasmettere|8etti,temporeggiare|10,tenoreggiare|9,tesoreggiare|9,timoneggiare|9,timpaneggiare|10,tinteggiare|8,tiranneggiare|10,tondeggiare|8,toneggiare|7,tonneggiare|8,torcigliare|8,torreggiare|8,tortigliare|8,tortoreggiare|10,toscaneggiare|10,tossicchiare|9,traccheggiare|10,traslocare|7hi,tratteggiare|9,traudire|otradi,trilleggiare|9,trogliare|6,troncare|5hi,troneggiare|8,ubicare|4hi,udire|odi,universaleggiare|13,urtacchiare|8,urticchiare|8,vagabondeggiare|12,vagheggiare|8,vampeggiare|8,vaneggiare|7,vangheggiare|9,veggiare|5,veleggiare|7,vendicchiare|9,venducchiare|9,venire|1ieni,verdeggiare|8,vergheggiare|9,vermigliare|8,verseggiare|8,vetrioleggiare|11,vezzeggiare|8,vigliare|5,vigoreggiare|9,villaneggiare|10,villeggiare|8,virgoleggiare|10,vivacchiare|8,vocare|3hi,volicchiare|8,volpeggiare|8,volteggiare|8,zampeggiare|8,zoppeggiare|8,abbisciare|7,aborrire|6,accendere|6i,ambiare|4,ampiare|4,ampliare|5,apporre|4ni,ardere|3i,assidere|5i,aunghiare|6,autoproteggere|11i,avariare|5,battere|4i,benedicere|7i,bigiare|4,cangiare|5,cariare|4,cherere|4i,chierere|5i,compire|5i,coniare|4,copiare|4,correggere|7i,desumere|5i,direggere|6i,disaccoppiare|10,dormirci|5,ducere|3i,educere|4i,effondere|6i,eleggere|5i,elidere|4i,empire|4,eradere|4i,ereggere|5i,erodere|4i,escire|4,escoriare|6,esimere|4i,fischiare|6,flangiare|6,fremere|4i,gloriare|5,inebriare|6,ingiuriare|7,iniziare|5,intrasentire|10,irradiare|6,istoriare|6,languire|6,lecere|3i,ledere|3i,leggere|4i,licere|3i,linciare|5,lisciare|5,maschiare|6,mazziare|5,meriare|4,meschiare|6,metterci|4i,mietere|4i,nascere|4i,obbliare|5,obliare|4,offrire|5,oliare|3,oppiare|4,opporre|4ni,otriare|4,pazziare|5,pedere|3i,periziare|6,pisciare|5,porre|2ni,prenderci|5i,proteggere|7i,raccendere|7i,raccoppiare|8,radere|3i,ragghiare|6,raschiare|6,razziare|5,reddere|4i,reggere|4i,riaccendere|8i,riaccoppiare|9,riardere|5i,ricidere|5i,ricomparire|9,riconiare|6,ricorreggere|9i,ridere|3i,riducere|5i,riescire|6,rileggere|6i,ringhiare|6,riudire|2odi,sarchiare|6,sartiare|5,sbattere|5i,sbisciare|6,sborniare|6,sciampiare|7,scomparire|8,scorreggere|8i,scudisciare|8,sentirci|5,seppiare|5,seriare|4,serpere|4i,sfiare|3,sgabbiare|6,sgraffiare|7,smaniare|5,soffrire|6,sopporre|5ni,sopravvivere|9i,sorreggere|7i,spoliare|5,sproteggere|8i,striare|4,strisciare|7,sumere|3i,svariare|5,temere|3i,tonchiare|6,torchiare|6,traggere|5i,traviare|5,tronfiare|6,ungere|3i,vengiare|5,vertere|4i,vivere|3i,vociare|4",
        "rev": "bbacchi|7are,bbiosci|7are,bbrusti|7are,bradi|4ere,ccappi|6are,cessori|7are,ccesti|6re,ccigni|5ere,dsorbi|6re,dunghi|6are,ttucchi|7are,fflosci|7are,ggranfi|7are,gricchi|7are,gucchi|6are,lchimi|6are,llelui|6are,lloppi|6are,mnisti|6are,ngari|5are,ngosci|6are,ngusti|6are,rchivi|6are,rrabbi|6are,sfissi|6are,ttolli|5ere,ttorni|6are,vvinchi|7are,ccucchi|7are,enai|3vere,estemmi|7are,ofonchi|7are,orbogli|7are,ullizi|5zare,admi|4are,icchiri|7are,omburi|5ere,missari|7are,ompendi|7are,mpletti|6ere,onsorzi|7are,ontrari|7are,robatti|6ere,roverti|6ere,onvivi|5ere,rricchi|7are,orrodi|5ere,rbonizi|6zare,efoli|5are,eridi|4ere,ilani|5are,irimi|4ere,iscerpi|6ere,ispari|6re,isservi|7re,isvi|4are,ivari|5are,ivorzi|6are,omicili|7are,rmicchi|7are,ffigi|5are,logi|4are,sfoli|5are,stolli|5ere,videnzi|7are,alcidi|6are,otocopi|7are,oriesci|3uscire,uracchi|7are,tapponi|5rre,orgogli|7are,mbesti|6are,mbevi|4ere,mperni|6are,ncendi|5ere,ncipri|6are,nciuci|6are,ncuti|4ere,ndemani|7are,ndizi|5are,nghebbi|7are,ngobbi|6are,nguai|5are,nsidi|5are,tercidi|6ere,terfoli|7are,terponi|5rre,ventari|7are,nvetri|6are,nvidi|5are,oricchi|7are,orucchi|7are,ggicchi|7are,iscivi|6are,ussuri|6are,almetti|6ere,anuchi|2icare,artori|6are,apicchi|7are,ilizzai|6re,rsecchi|7are,rsicchi|7are,ssequi|6are,ttri|4are,agai|4are,alegi|4giare,rlucchi|7are,arodi|5are,erfidi|6are,ermani|5ere,erplimi|6ere,iaci|3ere,lagi|3ere,eeleggi|6ere,renasci|6ere,residi|6are,restigi|7are,resummi|6ere,ivilegi|7are,roemi|5are,roludi|5ere,ropelli|6ere,ropizi|6are,rosumi|5ere,roverbi|7are,nzecchi|7are,zzicchi|7are,accenci|7are,onacchi|7are,edimi|4ere,iappari|7re,assorbi|7re,icompii|6ere,icopi|5are,icri|4are,idormi|6re,idevi|2overe,ieleggi|6ere,iempi|5re,ipugni|1espugnare,ifischi|7are,igraffi|7are,imacchi|7are,imani|4ere,inasci|5ere,invi|4are,invili|6are,ioffri|6re,iopponi|5rre,ipeti|4ere,ipicchi|7are,iscoti|5ere,isenti|6re,isiedi|5ere,isparmi|7are,isucchi|7are,itemi|4ere,itraggi|6ere,ivivi|4ere,osicchi|7are,ubacchi|7are,alari|5are,almodi|6are,dirisci|3e,baldori|7are,barbari|7re,licarhi|5e,evacchi|7are,bigonci|7are,biluci|6are,bisori|6are,bolgi|5are,brici|5are,apecchi|7are,tricchi|7are,cempi|5are,chinci|6are,upacchi|7are,ompisci|7are,onocchi|7are,rbacchi|7are,cosci|5are,crachi|3tchare,ibacchi|7are,cricchi|7are,crosci|6are,cuffi|5are,drai|4are,equenzi|7are,fiduci|6are,foci|4are,forbici|7are,fruculi|7are,fruguli|7are,gargi|5are,gorbi|5are,anocchi|7are,ilenzi|6are,infoni|6are,obbolli|7re,offeri|5ere,offondi|6ere,nnecchi|7are,rabbevi|6ere,orradi|5ere,rrecchi|7are,ttraggi|6ere,nnocchi|7are,pazi|4are,pengi|4ere,utacchi|7are,tabbi|5are,tipendi|7are,iracchi|7are,torpi|5are,trabili|7are,trigni|5ere,diacchi|7are,ubbolli|3ullire,uffondi|6ere,uffulci|6ere,ussidi|6are,valigi|6are,rasetti|3mettere,stimoni|7are,nsfondi|6ere,asfondi|6ere,raspari|6ere,reppi|5are,rinci|5are,rtacchi|7are,endemmi|7are,nducchi|7are,icari|5are,olicchi|7are,erocopi|7are,bigli|5are,zzacchi|7are,brevi|5are,ccerchi|7are,nigli|5are,debbi|5are,llidi|4ere,mmucchi|7are,pai|3are,rischi|6are,sembi|5are,ssenti|6re,straggi|6ere,tedi|4are,vvinghi|7are,cacchi|6are,ncischi|7are,loqui|5are,ombatti|6ere,tundi|4ere,operchi|7are,fungi|4ere,elinqui|6ere,epelli|5ere,ibatti|5ere,iparti|6re,iponi|3rre,ispegni|6ere,comi|4are,patri|5are,strani|6are,orvi|4are,apocchi|7are,pecatti|3ettare,pigni|4ere,fradici|7are,ubbi|4are,nsudici|7are,tarsi|5are,tridi|4ere,vecchi|6are,nvischi|7are,fizi|4are,vvi|3are,elacchi|7are,emetti|5ere,senzi|5are,resumi|5ere,supponi|5rre,rincipi|7are,abbui|5are,nicchi|6are,insedi|6are,morchi|6are,abbai|5are,apri|4re,arrangi|7are,assali|6re,assedi|6are,calunni|7are,competi|6ere,concili|7are,dacchi|6are,dai|2re,enfi|4are,esili|5are,espelli|6ere,estasi|6are,fervi|4ere,forgi|5are,gemi|3ere,gracchi|7are,impeci|6are,infuri|6are,ingabbi|7are,intelai|7are,pasci|4ere,pigi|4are,sazi|4are,badigli|7are,scoppi|6are,soffi|5are,specchi|7are,splendi|6ere,studi|5are,vucchi|6are,fotti|4ere,ffolci|5ere,raponi|4rre,licenzi|7are,rebbi|5are,ripudi|6are,bruci|5are,calappi|7are,dazi|4are,docchi|6are,figli|5are,fliggi|5ere,granchi|7are,mosci|5are,nebbi|5are,arecchi|7are,rridi|4ere,ovesci|6are,medi|4are,onsigli|7are,overchi|7are,eludi|4ere,mordi|4ere,tenzi|5are,scuti|4ere,spogli|6are,suadi|4ere,spandi|5ere,plodi|4ere,vadi|3ere,tizi|4are,nnacchi|7are,mici|4are,combi|4ere,croci|5are,sabbi|5are,ermetti|6ere,ugghi|5are,ozi|3are,ccidi|4ere,puoi|1otere,ezi|3are,abbatti|6ere,umili|5are,fuggi|5re,godi|3ere,gonfi|5are,mangi|5are,stai|3re,rnacchi|7are,vizi|4are,imponi|4rre,ricevi|5ere,cigli|5are,onsenti|7re,doppi|5are,lludi|4ere,mobili|6are,mogli|5are,ncidi|4ere,dicchi|6are,soci|4are,fici|4are,vicchi|6are,ecidi|4ere,finanzi|7are,oponi|3rre,spondi|5ere,fogli|5are,lizi|4are,ferenzi|7are,iffondi|6ere,imetti|5ere,ascondi|6ere,cuci|4re,perdi|4ere,togli|5ere,oracchi|7are,rametti|6ere,cominci|7are,scindi|5ere,muori|1orire,scegli|6ere,friggi|5ere,premi|4ere,usci|4are,iai|3are,cogli|5ere,conci|5are,agi|3are,ibbi|4are,razi|4are,naffi|5are,propri|6are,ssumi|4ere,vogli|5are,dividi|5ere,cadi|3ere,rudi|3ere,mungi|4ere,chiedi|5ere,sciogli|7ere,copri|5re,credi|4ere,regi|4are,vuoi|1olere,bevi|2re,sai|2pere,nunzi|5are,eponi|3rre,struggi|6ere,rogli|5are,fletti|5ere,nfondi|5ere,stanzi|6are,vendi|4ere,pungi|4ere,tessi|4ere,rapponi|5rre,vali|3ere,componi|5rre,rnici|5are,iucchi|6are,cambi|5are,egli|4are,nnetti|5ere,stingui|6ere,fendi|4ere,mischi|6are,ugi|3are,ticchi|6are,cerni|4ere,vesti|5re,smetti|5ere,vigli|5are,chiudi|5ere,nunci|5are,segui|5re,igi|2ere,rigli|5are,pigli|5are,nosci|4ere,rompi|4ere,cludi|4ere,tigli|5are,migli|5are,torci|4ere,vinci|4ere,rci|3are,oi|2are,pendi|4ere,aci|3are,lci|3are,scendi|5ere,sisti|4ere,verti|5re,primi|4ere,ometti|5ere,esci|3ere,angi|3ere,anci|4are,sponi|3rre,asci|4are,ugli|4are,rendi|4ere,dici|2re,figgi|4ere,mmetti|5ere,trai|3rre,iungi|4ere,tieni|1enere,olvi|3ere,cedi|3ere,corri|4ere,duci|2rre,scrivi|5ere,vieni|1enire,tendi|4ere,lgi|2ere,rgi|2ere,ingi|3ere,agli|4are,cci|3are,ghi|1are,ggi|3are,chi|1are,isci|1re,i|are,ggrumol|7are,l|1iare,combu|5iare"
      },
      "third": {
        "rules": "cestire|4e,enavere|2à,ompire|4e,iuscire|1esce,terdire|5ce,avenire|2iene,anguire|4e,aladire|5ce,alliare|3a,emorire|2uore,evenire|2iene,ibere|3ve,dormire|4e,idovere|2eve,isalire|4e,iudire|1ode,iuliare|3a,mbuiare|3a,atchare|1cha,bullire|1olle,raudire|2ode,borrire|4e,pparire|4e,ssalire|4e,sdire|3ce,rvenire|2iene,aledire|5ce,aprire|3e,enedire|5ce,empire|4e,escire|3e,svenire|2iene,trabere|5ve,mparire|4e,addire|4ce,potere|1uò,fuggire|4e,offrire|4e,cucire|3e,ivenire|2iene,coprire|4e,sapere|2,vvenire|2iene,olere|uole,nvenire|2iene,vestire|4e,sentire|4e,seguire|4e,trarre|3e,tenere|1iene,durre|2ce,porre|2ne,ire|1sce,re|,irci|e,erci|1",
        "exceptions": "adsorbire|6e,avere|ha,avvertire|6e,bere|2ve,boglire|5e,bollire|4e,bullizzare|6a,contradire|8ce,convertire|7e,dare|1à,decarbonizzare|10a,dipartire|6e,dire|2ce,disparire|6e,disservire|7e,divertire|6e,ebere|3ve,esserci|c'è,impecettare|5atta,impedantire|spendantisce,indire|4ce,interconvertire|12e,intormentire|9e,invertire|6e,manicare|3uca,mensilizzare|10a,mentire|4e,morire|1uore,paleggiare|5ia,partire|4e,pervertire|7e,pinneggiare|8ia,plaudire|5e,preavvertire|9e,predire|5ce,prevertire|7e,provenire|4iene,raggrovigliare|10a,rattralciare|9ia,riassorbire|8e,riavvertire|8e,ribollire|6e,riconvertire|9e,ridare|3à,ridire|4ce,riespugnare|2pugna,rimeggiare|7ia,rimorire|3uore,rimpecettare|6atta,rinchiocciolire|inchiocciolisce,rinverniciare|2vernicia,rinvertire|7e,ripartire|6e,riservire|6e,risovvertire|9e,ristare|4à,rivalicare|tivalica,salire|3e,sbaldire|7isce,sbarbarire|8a,sbellicare|9a,scombugliare|8a,scoraggire|7e,scovrire|5e,servire|4e,smorire|2uore,sobbollire|7e,sovvertire|7e,teletrasmettere|8ette,udire|ode,venire|1iene,benedicere|8,compire|5e,dormirci|4e,ducere|4,educere|5,escire|3e,licere|4,metterci|5,palliare|4a,prenderci|6,presapere|5,riducere|6,riescire|5e,risapere|4,sapere|2,sentirci|4e",
        "rev": "enà|2avere,à|are,ulliza|5zare,rboniza|6zare,anuca|2icare,ilizzaa|6re,alegia|4giare,rovigla|6iare,ipugna|1espugnare,arbaria|6re,llicara|6e,usciula|6iare,ombugla|6iare,combua|5iare,cracha|3tchare,oprassa|7pere,trasa|5pere,pecatta|3ettare,iia|1are,a|1re,ispare|5ire,iverte|5ire,oriesce|3uscire,ece|3re,erverte|6ire,iace|4re,laude|4ire,reverte|6ire,ibeve|3re,idorme|5ire,ideve|2overe,iode|1udire,dirisce|3e,coragge|6ire,covre|4ire,ubbolle|3ullire,rasette|3mettere,raode|2udire,borre|4ire,sorbe|4ire,elinque|7re,mane|4re,appare|5ire,empie|4re,trabeve|5re,parte|4ire,serve|4ire,combe|5re,bolle|4ire,compare|6ire,fugge|4ire,offre|4ire,lce|3re,sale|3ire,cuce|3ire,muore|1orire,vverte|5ire,nverte|5ire,asce|4re,tesse|5re,vale|4re,uole|olere,gne|3re,pre|2ire,lle|3re,stingue|7re,cerne|5re,este|3ire,nosce|5re,gue|2ire,ente|3ire,torce|5re,vince|5re,pe|2re,esce|4re,dice|2re,trae|3rre,tiene|1enere,ie|2re,duce|2rre,viene|1enire,re|2re,me|2re,pone|2rre,ve|2re,te|2re,ge|2re,de|2re,isce|1re,può|1otere"
      },
      "firstPlural": {
        "rules": "bbicare|4hiamo,olciare|5mo,eluiare|5mo,mpliare|5mo,laniare|5mo,logiare|5mo,terdire|5ciamo,aladire|5ciamo,iggiare|5mo,alliare|3amo,iacere|3ciamo,lagere|3giamo,umolare|5mo,ibere|3viamo,idovere|3bbiamo,ilegare|4hiamo,olgiare|5mo,abicare|4hiamo,iuliare|3amo,mbuiare|3amo,atchare|1chiamo,ulciare|5mo,bullire|1olliamo,blocare|4hiamo,bbuiare|5mo,rocare|3hiamo,unniare|5mo,oquiare|5mo,sdire|3ciamo,tongare|4hiamo,ulgare|3hiamo,lencare|4hiamo,ivocare|4hiamo,raniare|5mo,peciare|5mo,concare|4hiamo,maniare|5mo,aledire|5ciamo,vicare|3hiamo,bliare|4mo,ovocare|4hiamo,enedire|5ciamo,uliare|4mo,moncare|4hiamo,trabere|5viamo,uggiare|5mo,rniare|4mo,avere|1bbiamo,ioncare|4hiamo,addire|4ciamo,elegare|4hiamo,elciare|5mo,rgiare|4mo,potere|2ssiamo,evocare|4hiamo,giocare|4hiamo,incare|3hiamo,rbicare|4hiamo,llocare|4hiamo,negare|3hiamo,oniare|4mo,segare|3hiamo,tiare|3mo,focare|3hiamo,uocare|3hiamo,ggare|2hiamo,oliare|4mo,sapere|3piamo,uciare|4mo,agiare|4mo,nchiare|5mo,llegare|4hiamo,igiare|4mo,egiare|4mo,olere|1gliamo,egliare|5mo,micare|3hiamo,ingare|3hiamo,siare|3mo,ugiare|4mo,miare|3mo,ngiare|4mo,ghiare|4mo,oggiare|5mo,ociare|4mo,zzicare|4hiamo,iegare|3hiamo,angare|3hiamo,nicare|3hiamo,rchiare|5mo,rciare|4mo,oiare|3mo,sicare|3hiamo,aciare|4mo,picare|3hiamo,aiare|3mo,regare|3hiamo,iliare|4mo,ugliare|5mo,trarre|3iamo,ucare|2hiamo,viare|3mo,ugare|2hiamo,fiare|3mo,schiare|5mo,iere|1amo,iciare|4mo,cicare|3hiamo,ancare|3hiamo,durre|2ciamo,ecare|2hiamo,rgare|2hiamo,acare|2hiamo,lcare|2hiamo,dicare|3hiamo,diare|3mo,aggiare|5mo,piare|3mo,agare|2hiamo,rcare|2hiamo,igare|2hiamo,ricare|3hiamo,ogare|2hiamo,ticare|3hiamo,biare|3mo,licare|3hiamo,nciare|4mo,riare|3mo,sciare|4mo,scare|2hiamo,porre|2niamo,agliare|5mo,ziare|3mo,cciare|4mo,ccare|2hiamo,ficare|3hiamo,ire|1amo,ere|iamo,are|iamo,irci|1amo,erci|iamo",
        "exceptions": "abbacchiare|9mo,abbatacchiare|11mo,abbigliare|8mo,abbozzacchiare|12mo,abbrigliare|9mo,abbruciacchiare|13mo,accaneggiare|10mo,accapigliare|10mo,accareggiare|10mo,accavalciare|10mo,accavigliare|10mo,accigliare|8mo,acconigliare|10mo,adocchiare|8mo,affattucchiare|12mo,affigliare|8mo,aggricchiare|10mo,aggrovigliare|11mo,agucchiare|8mo,albeggiare|8mo,aleggiare|7mo,alleggiare|8mo,alpeggiare|8mo,amareggiare|9mo,ammanigliare|10mo,ammogliare|8mo,ammonticchiare|12mo,ammucchiare|9mo,amoreggiare|9mo,ancheggiare|9mo,annodicchiare|11mo,anticheggiare|11mo,apparecchiare|11mo,apparigliare|10mo,appigliare|8mo,archeggiare|9mo,arieggiare|8mo,armeggiare|8mo,arpeggiare|8mo,arroncare|6hiamo,arruncigliare|11mo,artigliare|8mo,aspreggiare|9mo,asseggiare|8mo,assimigliare|10mo,assomigliare|10mo,assottigliare|11mo,asteggiare|8mo,atteggiare|8mo,attorcigliare|11mo,attortigliare|11mo,attroncare|7hiamo,avocare|4hiamo,avviticchiare|11mo,avvogliare|8mo,bacchiare|7mo,bambineggiare|11mo,bamboleggiare|11mo,beccheggiare|10mo,beccucchiare|10mo,beffeggiare|9mo,begare|3hiamo,bere|2viamo,bevicchiare|9mo,biancheggiare|11mo,biondeggiare|10mo,bisbigliare|9mo,bizantineggiare|13mo,boccheggiare|10mo,borbogliare|9mo,bordeggiare|9mo,borseggiare|9mo,brandeggiare|10mo,brogliare|7mo,bruciacchiare|11mo,bucacchiare|9mo,buffoneggiare|11mo,bullizzare|6iamo,calciare|6mo,caldeggiare|9mo,campeggiare|9mo,campicchiare|10mo,candeggiare|9mo,canneggiare|9mo,cannoneggiare|11mo,canticchiare|10mo,capeggiare|8mo,capitaneggiare|12mo,carreggiare|9mo,carteggiare|9mo,catoneggiare|10mo,cazzeggiare|9mo,classicheggiare|13mo,comunisteggiare|13mo,consigliare|9mo,conteggiare|9mo,contradire|8ciamo,convocare|6hiamo,convogliare|9mo,corricchiare|10mo,corseggiare|9mo,corteggiare|9mo,costeggiare|9mo,costicchiare|10mo,crocchiare|8mo,danneggiare|9mo,dardeggiare|9mo,decarbonizzare|10iamo,defogliare|8mo,destreggiare|10mo,dileggiare|8mo,dilungare|6hiamo,dire|2ciamo,disimbrogliare|12mo,disormeggiare|11mo,dispogliare|9mo,dissomigliare|11mo,diteggiare|8mo,dormicchiare|10mo,dottoreggiare|11mo,drappeggiare|10mo,ebere|3viamo,echeggiare|8mo,epicureggiare|11mo,esserci|siamo,falciare|6mo,favoleggiare|10mo,favoreggiare|10mo,festeggiare|9mo,fiammeggiare|10mo,fiancheggiare|11mo,figliare|6mo,fileggiare|8mo,filosofeggiare|12mo,fiorentineggiare|14mo,fiscaleggiare|11mo,focheggiare|9mo,folgoreggiare|11mo,folleggiare|9mo,foracchiare|9mo,franceseggiare|12mo,frascheggiare|11mo,fraseggiare|9mo,frivoleggiare|11mo,frondeggiare|10mo,fronteggiare|10mo,fumeggiare|8mo,furoreggiare|10mo,galleggiare|9mo,gareggiare|8mo,gatteggiare|9mo,germogliare|9mo,giganteggiare|11mo,gigioneggiare|11mo,giovaneggiare|11mo,giuracchiare|10mo,gorgheggiare|10mo,gorgogliare|9mo,gozzovigliare|11mo,gracchiare|8mo,grandeggiare|10mo,grigliare|7mo,guerreggiare|10mo,idoleggiare|9mo,imbottigliare|11mo,imbrigliare|9mo,imbrogliare|9mo,imbroncare|7hiamo,impapocchiare|11mo,impastocchiare|12mo,impecettare|5attiamo,impedantire|spendantiamo,impennacchiare|12mo,impidocchiare|11mo,impigliare|8mo,incavigliare|10mo,indietreggiare|12mo,indire|4ciamo,infinocchiare|11mo,inneggiare|8mo,interfogliare|11mo,intralciare|9mo,invecchiare|9mo,inveggiare|8mo,invocare|5hiamo,invogliare|8mo,italianeggiare|12mo,labbreggiare|10mo,ladroneggiare|11mo,lampeggiare|9mo,langueggiare|10mo,largheggiare|10mo,latineggiare|10mo,latteggiare|9mo,lavoracchiare|11mo,lavoricchiare|11mo,lavorucchiare|11mo,lazzeggiare|9mo,legare|3hiamo,leggicchiare|10mo,leggiucchiare|11mo,lenteggiare|9mo,leopardeggiare|12mo,lingueggiare|10mo,locare|3hiamo,lumeggiare|8mo,lussureggiare|11mo,lustreggiare|10mo,macchiare|7mo,madreggiare|9mo,madrigaleggiare|13mo,maestraleggiare|13mo,mammoleggiare|11mo,maneggiare|8mo,mangiucchiare|11mo,maramaldeggiare|13mo,mareggiare|8mo,marmoreggiare|11mo,marzeggiare|9mo,matrigneggiare|12mo,matteggiare|9mo,mazzapicchiare|12mo,mensilizzare|10iamo,meravigliare|10mo,mercanteggiare|12mo,metaforeggiare|12mo,misticheggiare|12mo,molleggiare|9mo,mondaneggiare|11mo,moraleggiare|10mo,mordicchiare|10mo,mormoracchiare|12mo,mormoreggiare|11mo,morsecchiare|10mo,morseggiare|9mo,morsicchiare|10mo,mostreggiare|10mo,motteggiare|9mo,naturaleggiare|12mo,negreggiare|9mo,nereggiare|8mo,nicchiare|7mo,ninfeggiare|9mo,nodeggiare|8mo,noleggiare|8mo,novelleggiare|11mo,occhieggiare|10mo,ocheggiare|8mo,ombreggiare|9mo,ondeggiare|8mo,oracoleggiare|11mo,orecchiare|8mo,origliare|7mo,ormeggiare|8mo,ossequiare|8mo,osteggiare|8mo,ozieggiare|8mo,pacchiare|7mo,padreggiare|9mo,padroneggiare|11mo,paganeggiare|10mo,paleggiare|5iamo,palleggiare|9mo,palpeggiare|9mo,panneggiare|9mo,parcheggiare|10mo,pareggiare|8mo,parere|2iamo,pargoleggiare|11mo,parlucchiare|10mo,parteggiare|9mo,particolareggiare|15mo,passeggiare|9mo,pasteggiare|9mo,pastigliare|9mo,patteggiare|9mo,pazzeggiare|9mo,pedaleggiare|10mo,pedanteggiare|11mo,pelacchiare|9mo,pennelleggiare|12mo,personeggiare|11mo,petrarcheggiare|13mo,pettegoleggiare|13mo,piacevoleggiare|13mo,piaciucchiare|11mo,pianeggiare|9mo,piangiucchiare|12mo,piazzeggiare|10mo,pigliare|6mo,pignoleggiare|11mo,pirateggiare|10mo,pispigliare|9mo,pitagoreggiare|12mo,poeteggiare|9mo,politicheggiare|13mo,poltroneggiare|12mo,pompeggiare|9mo,porporeggiare|11mo,posteggiare|9mo,predire|5ciamo,primeggiare|9mo,prodeggiare|9mo,proeggiare|8mo,profeteggiare|11mo,prolungare|7hiamo,proseggiare|9mo,provenzaleggiare|14mo,prueggiare|8mo,punteggiare|9mo,puntigliare|9mo,punzecchiare|10mo,purpureggiare|11mo,puttaneggiare|11mo,puzzacchiare|10mo,puzzicchiare|10mo,radicaleggiare|12mo,raggrovigliare|10amo,ragionacchiare|12mo,rallungare|7hiamo,rameggiare|8mo,rancheggiare|10mo,randeggiare|9mo,rannicchiare|10mo,rappigliare|9mo,rassimigliare|11mo,rassomigliare|11mo,rassottigliare|12mo,remeggiare|8mo,riaffogliare|10mo,riammogliare|10mo,riammucchiare|11mo,riapparecchiare|13mo,riassottigliare|13mo,riavviticchiare|13mo,ribaldeggiare|11mo,riconsigliare|11mo,riconvocare|8hiamo,riconvogliare|11mo,ridacchiare|9mo,ridanneggiare|11mo,ridicchiare|9mo,ridicoleggiare|12mo,ridire|4ciamo,riecheggiare|10mo,riespugnare|2pugniamo,rifalciare|8mo,rifesteggiare|11mo,rifiammeggiare|12mo,rifigliare|8mo,rigalleggiare|11mo,rigermogliare|11mo,rigracchiare|10mo,rilampeggiare|11mo,rimacchiare|9mo,rimaneggiare|10mo,rimbrigliare|10mo,rimbrogliare|10mo,rimpecettare|6attiamo,rinchiocciolire|inchioccioliamo,rinverniciare|2verniciamo,rinvogliare|9mo,ripalpeggiare|11mo,ripareggiare|10mo,ripatteggiare|11mo,ripicchiare|9mo,ripigliare|8mo,risaccheggiare|12mo,risbadigliare|11mo,risimigliare|10mo,risomigliare|10mo,rispecchiare|10mo,rispogliare|9mo,risucchiare|9mo,ritaglieggiare|12mo,ritroncare|7hiamo,rivagheggiare|11mo,rivaleggiare|10mo,rivalicare|tivalichiamo,romanzeggiare|11mo,rosicchiare|9mo,rosseggiare|9mo,roteggiare|8mo,rotondeggiare|11mo,rovigliare|8mo,rubacchiare|9mo,ruffianeggiare|12mo,rumoreggiare|10mo,saccheggiare|10mo,salmeggiare|9mo,satireggiare|10mo,sbacchiare|8mo,sbaciucchiare|11mo,sbadacchiare|10mo,sbadigliare|9mo,sbaldire|7iamo,sbandeggiare|10mo,sbatacchiare|10mo,sbavicchiare|10mo,sbavigliare|9mo,sbeffeggiare|10mo,sbellicare|9hiamo,sbevacchiare|10mo,sbevicchiare|10mo,sbevucchiare|10mo,sbirreggiare|10mo,sbrigliare|8mo,sbrogliare|8mo,sbroncare|6hiamo,scacchiare|8mo,scalciare|7mo,scapecchiare|10mo,scapigliare|9mo,scapocchiare|10mo,scarabocchiare|12mo,scaracchiare|10mo,scarmigliare|10mo,scarseggiare|10mo,scatricchiare|11mo,sceneggiare|9mo,scheggiare|8mo,scherzeggiare|11mo,schiaffeggiare|12mo,scimmieggiare|11mo,sciupacchiare|11mo,scombugliare|8amo,scompigliare|10mo,sconocchiare|10mo,sconsigliare|10mo,scorbacchiare|11mo,scoreggiare|9mo,scornacchiare|11mo,scribacchiare|11mo,scricchiare|9mo,scrivacchiare|11mo,scrivicchiare|11mo,scrivucchiare|11mo,scrupoleggiare|12mo,sdottoreggiare|12mo,secolareggiare|12mo,segnoreggiare|11mo,sermoneggiare|11mo,serpeggiare|9mo,sfogliare|7mo,sfolgoreggiare|12mo,sforacchiare|10mo,sfotticchiare|11mo,sgranocchiare|11mo,sgrovigliare|10mo,signoreggiare|11mo,simboleggiare|11mo,simigliare|8mo,simoneggiare|10mo,slalomeggiare|11mo,slegare|4hiamo,slungare|5hiamo,smangiucchiare|12mo,smerigliare|9mo,socrateggiare|11mo,soleggiare|8mo,solfeggiare|9mo,someggiare|8mo,somigliare|8mo,sonnacchiare|10mo,sonnecchiare|10mo,sornacchiare|10mo,sorrecchiare|10mo,sorseggiare|9mo,sorteggiare|9mo,sottigliare|9mo,spadroneggiare|12mo,spalleggiare|10mo,spannocchiare|11mo,sparacchiare|10mo,sparecchiare|10mo,sparigliare|9mo,spazieggiare|10mo,specchiare|8mo,spelacchiare|10mo,spennacchiare|11mo,spernacchiare|11mo,spidocchiare|10mo,spogliare|7mo,spuleggiare|9mo,spumeggiare|9mo,sputacchiare|10mo,stampigliare|10mo,stentacchiare|11mo,stigliare|7mo,stiracchiare|10mo,strafalciare|10mo,stralciare|8mo,strigliare|8mo,stroncare|6hiamo,studiacchiare|11mo,succhiare|7mo,sunteggiare|9mo,svecchiare|8mo,svillaneggiare|12mo,sviticchiare|10mo,taccheggiare|10mo,taglieggiare|10mo,tambureggiare|11mo,tasteggiare|9mo,tedescheggiare|12mo,teletrasmettere|8ettiamo,temporeggiare|11mo,tenoreggiare|10mo,tesoreggiare|10mo,timoneggiare|10mo,timpaneggiare|11mo,tinteggiare|9mo,tiranneggiare|11mo,tondeggiare|9mo,toneggiare|8mo,tonneggiare|9mo,torcigliare|9mo,torreggiare|9mo,tortigliare|9mo,tortoreggiare|11mo,toscaneggiare|11mo,tossicchiare|10mo,traccheggiare|11mo,traslocare|7hiamo,tratteggiare|10mo,trilleggiare|10mo,trogliare|7mo,troncare|5hiamo,troneggiare|9mo,ubicare|4hiamo,universaleggiare|14mo,urtacchiare|9mo,urticchiare|9mo,vagabondeggiare|13mo,vagheggiare|9mo,vampeggiare|9mo,vaneggiare|8mo,vangheggiare|10mo,veggiare|6mo,veleggiare|8mo,vendicchiare|10mo,venducchiare|10mo,verdeggiare|9mo,vergheggiare|10mo,vermigliare|9mo,verseggiare|9mo,vetrioleggiare|12mo,vezzeggiare|9mo,vigliare|6mo,vigoreggiare|10mo,villaneggiare|11mo,villeggiare|9mo,virgoleggiare|11mo,vivacchiare|9mo,vocare|3hiamo,volicchiare|9mo,volpeggiare|9mo,volteggiare|9mo,zampeggiare|9mo,zoppeggiare|9mo,abbattere|6iamo,abbreviare|8mo,abbrividire|9amo,abbrostire|8amo,abbrustiare|9mo,abbrutire|7amo,abbruttire|8amo,abbuzzire|7amo,abolire|5amo,aborrire|6amo,abortire|6amo,abradere|5iamo,accalappiare|10mo,accambiare|8mo,accappiare|8mo,accendere|6iamo,accerchiare|9mo,accessoriare|10mo,accestire|7amo,accignere|6iamo,acciocchire|9amo,acciucchire|9amo,accludere|6iamo,accogliere|7amo,acconciare|8mo,accondiscendere|12iamo,acconsentire|10amo,accorciare|8mo,accorrere|6iamo,accrescere|7iamo,accudire|6amo,acquiescere|8iamo,acuire|4amo,addebbiare|8mo,addivenire|8amo,addocilire|8amo,addoppiare|8mo,aderire|5amo,adire|3amo,adsorbire|7amo,adunghiare|8mo,afferire|6amo,affievolire|9amo,affiggere|6iamo,affiochire|8amo,affliggere|7iamo,aggiucchire|9amo,aggiungere|7iamo,aggradire|7amo,aggranchiare|10mo,aggrandire|8amo,aggranfiare|9mo,aggredire|7amo,agguerrire|8amo,alidire|5amo,alleggerire|9amo,alleluiare|8mo,allestire|7amo,allidere|5iamo,allocchire|8amo,alloppiare|8mo,alludere|5iamo,ambiare|5mo,ammalinconire|11amo,ammattire|7amo,ammettere|6iamo,ammiserire|8amo,ammobiliare|9mo,ammonire|6amo,ammuffire|7amo,ammutolire|8amo,amnistiare|8mo,ampiare|5mo,ampliare|6mo,ancidere|5iamo,angariare|7mo,angustiare|8mo,annaffiare|8mo,annebbiare|8mo,annettere|6iamo,annitrire|7amo,annobilire|8amo,anteporre|6niamo,anticonoscere|10iamo,antivenire|8amo,appartenere|8iamo,appassire|7amo,appendere|6iamo,appesantire|9amo,appesire|6amo,appetire|6amo,appiacevolire|11amo,appiccolire|9amo,applaudire|8amo,apporre|4niamo,appratire|7amo,apprendere|7iamo,appropriare|9mo,archiviare|8mo,ardere|3iamo,arrabbiare|8mo,arrangiare|8mo,arrendere|6iamo,arricchire|8amo,arridere|5iamo,arrischiare|9mo,arrugginire|9amo,arruvidire|8amo,ascendere|6iamo,ascondere|6iamo,ascrivere|6iamo,asfissiare|8mo,assalire|6amo,assediare|7mo,asseguire|7amo,assembiare|8mo,assentire|7amo,asserire|6amo,asservire|7amo,assidere|5iamo,assistere|6iamo,assorbire|7amo,assortire|7amo,assumere|5iamo,astenere|5iamo,astraggere|7iamo,attecchire|8amo,attendere|6iamo,attenere|5iamo,attollere|6iamo,attorniare|8mo,aulire|4amo,aunghiare|7mo,autodistruggere|12iamo,autogestire|9amo,autoproteggere|11iamo,autosostenere|10iamo,avariare|6mo,avere|1bbiamo,avvenire|6amo,avvertire|7amo,avvinchiare|9mo,avvinghiare|9mo,avvizzire|7amo,bandire|5amo,battere|4iamo,benavere|4bbiamo,benedicere|7iamo,bestemmiare|9mo,bianchire|7amo,bigiare|5mo,bipartire|7amo,blandire|6amo,bofonchiare|9mo,boglire|5amo,brandire|6amo,breviare|6mo,brunire|5amo,cambiare|6mo,candire|5amo,cangiare|6mo,capire|4amo,cariare|5mo,carpire|5amo,censire|5amo,cernere|4iamo,cherere|4iamo,chiarire|6amo,chiedere|5iamo,chierere|5iamo,cincischiare|10mo,circoncidere|9iamo,circonflettere|11iamo,circonfondere|10iamo,circonscrivere|11iamo,circonvenire|10amo,circoscrivere|10iamo,circostanziare|12mo,circuire|6amo,codecidere|7iamo,coesistere|7iamo,cofinanziare|10mo,cogestire|7amo,cogliere|5amo,cognoscere|7iamo,coincidere|7iamo,collidere|6iamo,colludere|6iamo,colpire|5amo,combattere|7iamo,comburere|6iamo,cominciare|8mo,commettere|7iamo,compartire|8amo,compendiare|9mo,competere|6iamo,compire|5amo,complettere|8iamo,comporre|5niamo,compravendere|10iamo,comprendere|8iamo,comprimere|7iamo,compromettere|10iamo,compungere|7iamo,concernere|7iamo,conciare|6mo,conciliare|8mo,concludere|7iamo,concorrere|7iamo,concrescere|8iamo,concupire|7amo,condescendere|10iamo,condire|5amo,condiscendere|10iamo,condividere|8iamo,conferire|7amo,configgere|7iamo,confliggere|8iamo,confondere|7iamo,congiungere|8iamo,coniare|5mo,connettere|7iamo,conoscere|6iamo,conseguire|8amo,consentire|8amo,consistere|7iamo,consorziare|9mo,construire|8amo,contendere|7iamo,contenere|6iamo,contessere|7iamo,contraccambiare|13mo,contraddistinguere|15iamo,contrapporre|9niamo,contravvenire|11amo,controbattere|10iamo,controproporre|11niamo,controrispondere|13iamo,controvertere|10iamo,convenire|7amo,convertire|8amo,convivere|6iamo,coperchiare|9mo,copiare|5mo,coprire|5amo,correggere|7iamo,correre|4iamo,corrispondere|10iamo,corrodere|6iamo,corrompere|7iamo,coscrivere|7iamo,costituire|8amo,costruire|7amo,costudire|7amo,coverchiare|9mo,credere|4iamo,crescere|5iamo,crocefiggere|9iamo,crocifiggere|9iamo,crucifiggere|9iamo,dattiloscrivere|12iamo,debbiare|6mo,decernere|6iamo,decidere|5iamo,decomporre|7niamo,decomprimere|9iamo,decorrere|6iamo,decostruire|9amo,decrescere|7iamo,deferire|6amo,defiggere|6iamo,definire|6amo,deflettere|7iamo,defoliare|7mo,defungere|6iamo,deglutire|7amo,delinquere|7iamo,deludere|5iamo,demolire|6amo,demordere|6iamo,deostruire|8amo,depellere|6iamo,deperire|6amo,deporre|4niamo,depotenziare|10mo,deprimere|6iamo,dereferenziare|12mo,deridere|5iamo,descrivere|7iamo,desiare|5mo,desistere|6iamo,desorbire|7amo,destituire|8amo,destruggere|8iamo,desumere|5iamo,detenere|5iamo,deviare|5mo,dibattere|6iamo,difendere|6iamo,differenziare|11mo,differire|7amo,diffinire|7amo,diffondere|7iamo,digerire|6amo,digiungere|7iamo,dilaniare|7mo,dimettere|6iamo,diminuire|7amo,dimungere|6iamo,dipartire|7amo,dipendere|6iamo,diporre|4niamo,direggere|6iamo,dirimere|5iamo,dirompere|6iamo,dirugginire|9amo,disaccoppiare|11mo,disapprendere|10iamo,disascondere|9iamo,disattendere|9iamo,discendere|7iamo,discernere|7iamo,discerpere|7iamo,dischiedere|8iamo,disciogliere|9amo,discommettere|10iamo,discomporre|8niamo,disconcludere|10iamo,disconfiggere|10iamo,discongiungere|11iamo,disconnettere|10iamo,disconoscere|9iamo,disconvenire|10amo,discoprire|8amo,discorrere|7iamo,discoscendere|10iamo,discredere|7iamo,discrescere|8iamo,discrivere|7iamo,discutere|6iamo,disgiungere|8iamo,disiare|5mo,disilludere|8iamo,disimprimere|9iamo,disinserire|9amo,disintendere|9iamo,disinvestire|10amo,dismettere|7iamo,disostruire|9amo,disparire|7amo,dispegnere|7iamo,dispendere|7iamo,disperdere|7iamo,disporre|5niamo,dispromettere|10iamo,disrompere|7iamo,dissentire|8amo,disseppellire|11amo,disservire|8amo,dissuadere|7iamo,distanziare|9mo,distendere|7iamo,distinguere|8iamo,distogliere|8amo,distraggere|8iamo,distruggere|8iamo,disubbidire|9amo,disvolere|5gliamo,divariare|7mo,divenire|6amo,divertire|7amo,dividere|5iamo,divorziare|8mo,domiciliare|9mo,doppiare|6mo,dormirci|5amo,ducere|3iamo,educere|4iamo,effondere|6iamo,elargire|6amo,eleggere|5iamo,elidere|4iamo,eludere|4iamo,emettere|5iamo,empire|4amo,emungere|5iamo,eradere|4iamo,ereggere|5iamo,erodere|4iamo,erompere|5iamo,erudire|5amo,esaudire|6amo,esaurire|6amo,escire|4amo,escludere|6iamo,escoriare|7mo,escutere|5iamo,eseguire|6amo,esercire|6amo,esfoliare|7mo,esiliare|6mo,esimere|4iamo,esistere|5iamo,esordire|6amo,espandere|6iamo,espatriare|8mo,espellere|6iamo,esperire|6amo,espiare|5mo,esplodere|6iamo,esporre|4niamo,esprimere|6iamo,espropriare|9mo,espungere|6iamo,estasiare|7mo,estendere|6iamo,estinguere|7iamo,estollere|6iamo,estraniare|8mo,estromettere|9iamo,evidenziare|9mo,falcidiare|8mo,favorire|6amo,fedecommettere|11iamo,fendere|4iamo,ferire|4amo,fervere|4iamo,fidecommettere|11iamo,figgere|4iamo,finanziare|8mo,finire|4amo,fiorire|5amo,fischiare|7mo,flangiare|7mo,flettere|5iamo,forbire|5amo,forgiare|6mo,fornire|5amo,fotocomporre|9niamo,fotocopiare|9mo,fottere|4iamo,fraintendere|9iamo,framettere|7iamo,frammettere|8iamo,frammischiare|11mo,frapporre|6niamo,fremere|4iamo,friggere|5iamo,frinire|5amo,fuggire|5amo,fungere|4iamo,funghire|6amo,fuoriuscire|9amo,garantire|7amo,garrire|5amo,georeferenziare|13mo,gestire|5amo,ghermire|6amo,giungere|5iamo,giustapporre|9niamo,gloriare|6mo,gonfiare|6mo,granire|5amo,gremire|5amo,grugnire|6amo,gualcire|6amo,guarnire|6amo,havere|2bbiamo,illanguidire|10amo,illeggiadrire|11amo,illividire|8amo,illudere|5iamo,imbaldanzire|10amo,imbandire|7amo,imbarbarire|9amo,imbastardire|10amo,imbastire|7amo,imbellire|7amo,imbestialire|10amo,imbestiare|8mo,imbevere|5iamo,imbiondire|8amo,imbizzarrire|10amo,imbizzire|7amo,imbolsire|7amo,imbonire|6amo,imbroncire|8amo,imbruttire|8amo,imbufalire|8amo,imbutire|6amo,immalinconire|11amo,immettere|6iamo,immischiare|9mo,immiserire|8amo,immucidire|8amo,impallidire|9amo,impartire|7amo,impaurire|7amo,impensierire|10amo,impermalire|9amo,imperniare|8mo,impicciolire|10amo,impiccolire|9amo,impietosire|9amo,impignere|6iamo,impigrire|7amo,implodere|6iamo,impoltronire|10amo,imporre|4niamo,impoverire|8amo,impratichire|10amo,imprendere|7iamo,impresciuttire|12amo,impreziosire|10amo,imprimere|6iamo,impromettere|9iamo,improsciuttire|12amo,imputridire|9amo,impuzzire|7amo,impuzzolentire|12amo,inacerbire|8amo,inacidire|7amo,inacutire|7amo,inaffiare|7mo,inaridire|7amo,inasinire|7amo,incadaverire|10amo,incallire|7amo,incalorire|8amo,incancherire|10amo,incancrenire|10amo,incanutire|8amo,incaparbire|9amo,incarognire|9amo,incartapecorire|13amo,incattivire|9amo,incendere|6iamo,incenerire|8amo,inchiedere|7iamo,incidere|5iamo,inciprignire|10amo,incischiare|9mo,inciuchire|8amo,includere|6iamo,incogliere|7amo,incollerire|9amo,incombere|6iamo,incominciare|10mo,incorrere|6iamo,increscere|7iamo,incretinire|9amo,incrudire|7amo,incupire|6amo,incuriosire|9amo,incutere|5iamo,indebolire|8amo,indemaniare|9mo,indispettire|10amo,indisporre|7niamo,indolcire|7amo,indolenzire|9amo,inebetire|7amo,inebriare|7mo,inerire|5amo,infanatichire|11amo,infeltrire|8amo,inferire|6amo,inferocire|8amo,infiacchire|9amo,infierire|7amo,infiggere|6iamo,infingardire|10amo,infiochire|8amo,infistolire|9amo,infittire|7amo,inflaccidire|10amo,inflettere|7iamo,infliggere|7iamo,infoltire|7amo,infondere|6iamo,infradiciare|10mo,inframettere|9iamo,inframmettere|10iamo,inframmischiare|13mo,infrapporre|8niamo,infreddolire|10amo,infrollire|8amo,infuriare|7mo,ingabbiare|8mo,ingagliardire|11amo,ingelosire|8amo,ingentilire|9amo,ingerire|6amo,inghebbiare|9mo,inghiottire|9amo,ingiallire|8amo,ingigantire|9amo,ingiungere|7iamo,ingiuriare|8mo,ingobbiare|8mo,ingoffire|7amo,ingolosire|8amo,ingracilire|9amo,ingrandire|8amo,ingraziosire|10amo,ingrigire|7amo,ingrullire|8amo,iniziare|6mo,innaffiare|8mo,inodiare|6mo,inorgoglire|9amo,inorridire|8amo,insabbiare|8mo,insaporire|8amo,inscrivere|7iamo,insecchire|8amo,insediare|7mo,inseguire|7amo,inselvatichire|12amo,inserire|6amo,inserpentire|10amo,insidiare|7mo,insignire|7amo,insistere|6iamo,insolentire|9amo,insonnolire|9amo,insordire|7amo,insospettire|10amo,inspessire|8amo,insterilire|9amo,instituire|8amo,instupidire|9amo,insudiciare|9mo,insuperbire|9amo,intendere|6iamo,intenerire|8amo,intepidire|8amo,intercambiare|11mo,intercidere|8iamo,intercludere|9iamo,interconnettere|12iamo,interconvertire|13amo,intercorrere|9iamo,interferire|9amo,interfoliare|10mo,interloquire|10amo,intermettere|9iamo,interporre|7niamo,interpungere|9iamo,interrompere|9iamo,interscambiare|12mo,intervenire|9amo,intessere|6iamo,intiepidire|9amo,intimidire|8amo,intimorire|8amo,intirizzire|9amo,intisichire|9amo,intontire|7amo,intormentire|10amo,intorpidire|9amo,intramettere|9iamo,intraprendere|10iamo,intrasentire|10amo,intrattenere|9iamo,intravenire|9amo,intravvenire|10amo,intridere|6iamo,intristire|8amo,intromettere|9iamo,introvertire|10amo,intuire|5amo,intumidire|8amo,inumidire|7amo,invelenire|8amo,invenire|6amo,inventariare|10mo,inverdire|7amo,inverminire|9amo,invertire|7amo,investire|7amo,invetriare|8mo,invidiare|7mo,invigliacchire|12amo,invigorire|8amo,inviperire|8amo,invischiare|9mo,inviscidire|9amo,involgarire|9amo,inzotichire|9amo,irradiare|7mo,irrancidire|9amo,irretire|6amo,irridere|5iamo,irrobustire|9amo,irrompere|6iamo,irrugginire|9amo,irruvidire|8amo,ischeletrire|10amo,iscrivere|6iamo,ispessire|7amo,isterilire|8amo,istituire|7amo,istoriare|7mo,istruire|6amo,istupidire|8amo,lambire|5amo,languire|6amo,largire|5amo,lecere|3iamo,ledere|3iamo,leggere|4iamo,lenire|4amo,licenziare|8mo,licere|3iamo,linciare|6mo,lussuriare|8mo,malmettere|7iamo,mangiare|6mo,manimettere|8iamo,manomettere|8iamo,manoscrivere|9iamo,mantenere|6iamo,manutenere|7iamo,marciare|6mo,marimettere|8iamo,martoriare|8mo,maschiare|7mo,mazziare|6mo,mentire|5amo,meriare|5mo,mescere|4iamo,meschiare|7mo,metterci|4iamo,mietere|4iamo,minuire|5amo,mischiare|7mo,misconoscere|9iamo,miscredere|7iamo,misprendere|8iamo,mobiliare|7mo,mordere|4iamo,morire|4amo,mugghiare|7mo,muggire|5amo,mulcire|5amo,mungere|4iamo,munire|4amo,nascere|4iamo,nascondere|7iamo,obbliare|6mo,obliare|5mo,occidere|5iamo,occludere|6iamo,occorrere|6iamo,odiare|4mo,offendere|6iamo,offerire|6amo,offrire|5amo,oliare|4mo,omettere|5iamo,ommettere|6iamo,oppiare|5mo,opporre|4niamo,opprimere|6iamo,ordire|4amo,ostruire|6amo,otriare|5mo,ottenere|5iamo,ovideporre|7niamo,padire|4amo,parodiare|7mo,partenere|6iamo,partire|5amo,partorire|7amo,pascere|4iamo,pattovire|7amo,pattuire|6amo,pazziare|6mo,pedere|3iamo,pendere|4iamo,percorrere|7iamo,perdere|4iamo,perfidiare|8mo,perire|4amo,periziare|7mo,permanere|6iamo,permettere|7iamo,permischiare|10mo,perplimere|7iamo,perseguire|8amo,persistere|7iamo,persuadere|7iamo,pertenere|6iamo,pervenire|7amo,pervertire|8amo,piacere|4ciamo,piatire|5amo,piroscindere|9iamo,plagere|4giamo,plaudire|6amo,poltrire|6amo,porre|2niamo,portendere|7iamo,posporre|5niamo,potenziare|8mo,potere|2ssiamo,preavvertire|10amo,precidere|6iamo,precludere|7iamo,precognoscere|10iamo,precomprimere|10iamo,preconoscere|9iamo,precorrere|7iamo,precostituire|11amo,predefinire|9amo,predigerire|9amo,predisporre|8niamo,preeleggere|8iamo,preesistere|8iamo,preferire|7amo,prefiggere|7iamo,prefinanziare|11mo,prefinire|7amo,prefiorire|8amo,preintendere|9iamo,preludere|6iamo,premere|4iamo,premettere|7iamo,premonire|7amo,premorire|7amo,premunire|7amo,prenascere|7iamo,prenderci|5iamo,preporre|5niamo,prepotere|5ssiamo,presapere|6piamo,prescegliere|9amo,prescindere|8iamo,prescrivere|8iamo,presenziare|9mo,presidiare|8mo,prestabilire|10amo,presumere|6iamo,presummere|7iamo,presupporre|8niamo,pretendere|7iamo,preterire|7amo,pretermettere|10iamo,pretessere|7iamo,prevendere|7iamo,prevenire|7amo,prevertire|8amo,principiare|9mo,privilegiare|10mo,procombere|7iamo,proferire|7amo,profferire|8amo,progredire|8amo,proibire|6amo,proludere|6iamo,promettere|7iamo,propellere|7iamo,propendere|7iamo,proporre|5niamo,prorompere|7iamo,prosciogliere|10amo,proscrivere|8iamo,proseguire|8amo,prostendere|8iamo,prostituire|9amo,prosumere|6iamo,proteggere|7iamo,protendere|7iamo,provenire|7amo,proverbiare|9mo,pulire|4amo,pungere|4iamo,punire|4amo,putire|4amo,quintessenziare|13mo,rabbattere|7iamo,rabbellire|8amo,rabbonire|7amo,rabbrividire|10amo,raccenciare|9mo,raccendere|7iamo,raccerchiare|10mo,raccogliere|8amo,racconciare|9mo,raccoppiare|9mo,raccorciare|9mo,raddolcire|8amo,raddoppiare|9mo,radere|3iamo,radioassistere|11iamo,radiodiffondere|12iamo,radiotrasmettere|13iamo,raffievolire|10amo,raffittire|8amo,raggentilire|10amo,ragghiare|7mo,raggiungere|8iamo,raggranchiare|11mo,rammeschinire|11amo,rammorbidire|10amo,rancidire|7amo,rannobilire|9amo,rappiccinire|10amo,rappicciolire|11amo,rappiccolire|10amo,rapprendere|8iamo,rappropriare|10mo,raschiare|7mo,rassumere|6iamo,rattenere|6iamo,rattepidire|9amo,rattiepidire|10amo,rattrappire|9amo,raumiliare|8mo,ravvigorire|9amo,razziare|6mo,reassumere|7iamo,rebbiare|6mo,recensire|7amo,recidere|5iamo,recludere|6iamo,reddere|4iamo,redimere|5iamo,redolire|6amo,referenziare|10mo,reflettere|7iamo,reggere|4iamo,regredire|7amo,reimmettere|8iamo,reimprimere|8iamo,reinscrivere|9iamo,reinsediare|9mo,reinserire|8amo,reinvestire|9amo,relinquere|7iamo,remorchiare|9mo,rendere|4iamo,repellere|6iamo,reperire|6amo,reporre|4niamo,reprimere|6iamo,rescindere|7iamo,resistere|6iamo,respondere|7iamo,restituire|8amo,resumere|5iamo,retentire|7amo,retrovendere|9iamo,riabbattere|8iamo,riabbellire|9amo,riaccalappiare|12mo,riaccendere|8iamo,riaccoppiare|10mo,riaccorciare|10mo,riaccrescere|9iamo,riagguerrire|10amo,riammettere|8iamo,riammobiliare|11mo,riammollire|9amo,riammonire|8amo,riannaffiare|10mo,riannebbiare|10mo,riannettere|8iamo,riapparire|8amo,riappassire|9amo,riappendere|8iamo,riapplaudire|10amo,riapprendere|9iamo,riappropriare|11mo,riardere|5iamo,riarrangiare|10mo,riascendere|8iamo,riassalire|8amo,riassediare|9mo,riasserire|8amo,riassorbire|9amo,riassumere|7iamo,riattendere|8iamo,riavvertire|9amo,riavvinghiare|11mo,ribadire|6amo,ribandire|7amo,ribattere|6iamo,ribollire|7amo,ribrunire|7amo,ricambiare|8mo,ricernere|6iamo,ricetrasmettere|12iamo,richiedere|7iamo,ricidere|5iamo,ricogliere|7amo,ricombattere|9iamo,ricominciare|10mo,ricommettere|9iamo,ricomparire|9amo,ricompetere|8iamo,ricompiere|7amo,ricomporre|7niamo,ricomprendere|10iamo,ricomprimere|9iamo,ricompromettere|12iamo,riconciare|8mo,riconciliare|10mo,riconcorrere|9iamo,ricondire|7amo,riconfiggere|9iamo,riconfondere|9iamo,ricongiungere|10iamo,riconiare|7mo,riconnettere|9iamo,riconoscere|8iamo,riconsentire|10amo,riconvenire|9amo,riconvertire|10amo,ricopiare|7mo,ricoprire|7amo,ricorreggere|9iamo,ricorrere|6iamo,ricostituire|10amo,ricostruire|9amo,ricredere|6iamo,ricrescere|7iamo,ricrocifiggere|11iamo,ridefinire|8amo,rideporre|6niamo,ridescrivere|9iamo,ridifendere|8iamo,ridiffondere|9iamo,ridiminuire|9amo,ridiscendere|9iamo,ridiscernere|9iamo,ridisciogliere|11amo,ridiscorrere|9iamo,ridiscutere|8iamo,ridisporre|7niamo,ridistendere|9iamo,ridistinguere|10iamo,ridistogliere|10amo,ridistruggere|10iamo,ridivenire|8amo,ridividere|7iamo,ridormire|7amo,ridovere|4bbiamo,riducere|5iamo,rieleggere|7iamo,riempire|6amo,riescire|6amo,riescludere|8iamo,rieseguire|8amo,riesiliare|8mo,riespandere|8iamo,riespellere|8iamo,riesplodere|8iamo,riesporre|6niamo,riespropriare|11mo,riestasiare|9mo,riestendere|8iamo,riestinguere|9iamo,rifavorire|8amo,rifendere|6iamo,riferire|6amo,rifervere|6iamo,rifiggere|6iamo,rifinanziare|10mo,rifiorire|7amo,rifischiare|9mo,riflettere|7iamo,riforbire|7amo,riforgiare|8mo,rifornire|7amo,rifriggere|7iamo,rifronzire|8amo,rifuggire|7amo,righermire|8amo,rigiungere|7iamo,rigonfiare|8mo,rigraffiare|9mo,rigrugnire|8amo,riguarnire|8amo,riguernire|8amo,rileggere|6iamo,rimanere|5iamo,rimangiare|8mo,rimbaldanzire|11amo,rimbaldire|8amo,rimbambinire|10amo,rimbambire|8amo,rimbambolire|10amo,rimbarbarire|10amo,rimbastire|8amo,rimbecillire|10amo,rimbiondire|9amo,rimbricconire|11amo,rimbruttire|9amo,rimescere|6iamo,rimettere|6iamo,rimischiare|9mo,rimmelensire|10amo,rimminchionire|12amo,rimorchiare|9mo,rimordere|6iamo,rimorire|6amo,rimpatriare|9mo,rimpaurire|8amo,rimpazzire|8amo,rimpiccinire|10amo,rimpicciolire|11amo,rimpiccolire|10amo,rimpietosire|10amo,rimpigrire|8amo,rimpoltronire|11amo,rimpoverire|9amo,rimpratichire|11amo,rimpresciuttire|13amo,rimprimere|7iamo,rimpulizzire|10amo,rimputridire|10amo,rimugghiare|9mo,rimuggire|7amo,rimungere|6iamo,rimunire|6amo,rinacerbire|9amo,rinascere|6iamo,rinascondere|9iamo,rincalorire|9amo,rincarognire|10amo,rincattivire|10amo,rinchiedere|8iamo,rinciprignire|11amo,rincitrullire|11amo,rinciuchire|9amo,rincoglionire|11amo,rincollerire|10amo,rincominciare|11mo,rincorbellire|11amo,rincrescere|8iamo,rincretinire|10amo,rincrudire|8amo,rincupire|7amo,rindolcire|8amo,rindurire|7amo,rinfichisecchire|14amo,rinficosecchire|13amo,rinfingardire|11amo,rinfittire|8amo,rinfondere|7iamo,rinfradiciare|11mo,rinfuriare|8mo,ringabbiare|9mo,ringagliardire|12amo,ringentilire|10amo,ringhiare|7mo,ringhiottire|10amo,ringiallire|9amo,ringiovanire|10amo,ringiovenire|10amo,ringrandire|9amo,ringrinzire|9amo,ringrullire|9amo,rinnaffiare|9mo,rinsabbiare|9mo,rinsalvatichire|13amo,rinsanire|7amo,rinsecchire|9amo,rinselvatichire|13amo,rinserire|7amo,rinsudiciare|10mo,rinsuperbire|10amo,rintendere|7iamo,rintenerire|9amo,rintepidire|9amo,rintiepidire|10amo,rintimidire|9amo,rintontire|8amo,rintorpidire|10amo,rintristire|9amo,rinumidire|8amo,rinvelenire|9amo,rinvenire|7amo,rinverdire|8amo,rinverminire|10amo,rinvertire|8amo,rinvestire|8amo,rinviliare|8mo,rinviperire|9amo,rinvischiare|10mo,rinvivire|7amo,rioffendere|8iamo,rioffrire|7amo,riopporre|6niamo,riordire|6amo,ripartire|7amo,ripartorire|9amo,ripascere|6iamo,riperdere|6iamo,ripetere|5iamo,ripire|4amo,ripolire|6amo,riporre|4niamo,ripotere|4ssiamo,ripremere|6iamo,riprendere|7iamo,ripretendere|9iamo,riprincipiare|11mo,ripromettere|9iamo,riproporre|7niamo,ripulire|6amo,ripungere|6iamo,rirendere|6iamo,rirompere|6iamo,risapere|5piamo,risbaldire|8amo,riscegliere|8amo,riscendere|7iamo,rischiare|7mo,risciogliere|9amo,riscolpire|8amo,riscommettere|10iamo,riscoppiare|9mo,riscoprire|8amo,riscorrere|7iamo,riscrivere|7iamo,riscurire|7amo,risentire|7amo,riseppellire|10amo,risiedere|6iamo,risoggiungere|10iamo,risorbire|7amo,risospendere|9iamo,risottomettere|11iamo,risovvenire|9amo,risovvertire|10amo,risparmiare|9mo,rispegnere|7iamo,risplendere|8iamo,rispondere|7iamo,rispremere|7iamo,ristabilire|9amo,ristarnutire|10amo,ristecchire|9amo,ristendere|7iamo,ristrettire|9amo,ristruggere|8iamo,risuggerire|9amo,risvenire|7amo,ritemere|5iamo,ritendere|6iamo,ritenere|5iamo,ritessere|6iamo,ritossire|7amo,ritradire|7amo,ritraggere|7iamo,ritrascrivere|10iamo,ritrasferire|10amo,ritrasgredire|11amo,ritrasmettere|10iamo,ritrasporre|8niamo,riudire|5amo,riumiliare|8mo,riungere|5iamo,riunire|5amo,riuscire|6amo,rivendere|6iamo,rivenire|6amo,riverire|6amo,rivestire|7amo,rivivere|5iamo,rivolere|4gliamo,rompere|4iamo,rugghiare|7mo,ruggire|5amo,sabbiare|6mo,saglire|5amo,salariare|7mo,salmodiare|8mo,sancire|5amo,sapere|3piamo,sarchiare|7mo,sartiare|6mo,sbadire|5amo,sbaldanzire|9amo,sbaldoriare|9mo,sbalordire|8amo,sbarbarire|8amo,sbasire|5amo,sbastire|6amo,sbattere|5iamo,sbaudire|6amo,sbiadire|6amo,sbigonciare|9mo,sbigottire|8amo,sbisoriare|8mo,sbizzarrire|9amo,sbizzire|6amo,sbolgiare|7mo,sborniare|7mo,sbozzacchire|10amo,scalappiare|9mo,scalterire|8amo,scaltrire|7amo,scambiare|7mo,scandire|6amo,scaturire|7amo,scegliere|6amo,scempiare|7mo,scendere|5iamo,scernere|5iamo,scheletrire|9amo,schernire|7amo,schinciare|8mo,sciampiare|8mo,scindere|5iamo,sciogliere|7amo,scipidire|7amo,scognoscere|8iamo,scommettere|8iamo,scomparire|8amo,scomporre|6niamo,sconciare|7mo,sconcludere|8iamo,sconfiggere|8iamo,sconfondere|8iamo,scongiungere|9iamo,sconnettere|8iamo,sconoscere|7iamo,sconsentire|9amo,scontessere|8iamo,sconvenire|8amo,scoperchiare|10mo,scoppiare|7mo,scoprire|6amo,scorciare|7mo,scorreggere|8iamo,scorrere|5iamo,scoscendere|8iamo,scoverchiare|10mo,scovrire|6amo,scratchare|4chiamo,scredere|5iamo,screscere|6iamo,scrivere|5iamo,scuffiare|7mo,sdilinquire|9amo,sdoppiare|7mo,secernere|6iamo,seguire|5amo,sembiare|6mo,sentenziare|9mo,sentirci|5amo,sepellire|7amo,seppellire|8amo,seppiare|6mo,sequenziare|9mo,seriare|5mo,serpere|4iamo,servire|5amo,servoassistere|11iamo,sfavorire|7amo,sfendere|5iamo,sfiare|4mo,sfiduciare|8mo,sfinire|5amo,sfoltire|6amo,sforbiciare|9mo,sfottere|5iamo,sfriggere|6iamo,sfruculiare|9mo,sfruguliare|9mo,sfuggire|6amo,sgabbiare|7mo,sgagliardire|10amo,sgargiare|7mo,sgonfiare|7mo,sgorbiare|7mo,sgradire|6amo,sgraffiare|8mo,sgranchiare|9mo,sgualcire|7amo,sguarnire|7amo,sguernire|7amo,silenziare|8mo,sinfoniare|8mo,singultire|8amo,smangiare|7mo,smaniare|6mo,smentire|6amo,smettere|5iamo,sminuire|6amo,smobiliare|8mo,smorire|5amo,smortire|6amo,smungere|5iamo,snebbiare|7mo,snellire|6amo,sobbollire|8amo,soccombere|7iamo,soccorrere|7iamo,sofferere|6iamo,soffolcere|7iamo,soffondere|7iamo,soffriggere|8iamo,soffrire|6amo,soggiungere|8iamo,solere|2gliamo,sommettere|7iamo,soppellire|8amo,soppendere|7iamo,sopperire|7amo,sopporre|5niamo,sopprimere|7iamo,soprabbevere|9iamo,sopraccorrere|10iamo,sopraccrescere|11iamo,sopraggiungere|11iamo,sopraintendere|11iamo,soprammettere|10iamo,soprantendere|10iamo,sopraporre|7niamo,soprapporre|8niamo,soprapprendere|11iamo,soprascrivere|10iamo,sopraspendere|10iamo,soprassapere|9piamo,sopravvenire|10amo,sopravvivere|9iamo,soprintendere|10iamo,sorgiungere|8iamo,sorprendere|8iamo,sorradere|6iamo,sorreggere|7iamo,sorridere|6iamo,sortire|5amo,soscrivere|7iamo,sospendere|7iamo,sospignere|7iamo,sostanziare|9mo,sostenere|6iamo,sostituire|8amo,sottendere|7iamo,sottintendere|10iamo,sottodividere|10iamo,sottoesporre|9niamo,sottomettere|9iamo,sottoporre|7niamo,sottoscrivere|10iamo,sottraggere|8iamo,soverchiare|9mo,sovraesporre|9niamo,sovraggiungere|11iamo,sovraimporre|9niamo,sovraintendere|11iamo,sovrapporre|8niamo,sovrascorrere|10iamo,sovrascrivere|10iamo,sovresporre|8niamo,sovrimporre|8niamo,sovrintendere|10iamo,sovvenire|7amo,sovvertire|8amo,spandere|5iamo,spartire|6amo,spazientire|9amo,spedantire|8amo,spendere|5iamo,spengere|5iamo,sperdere|5iamo,spessire|6amo,spiare|4mo,spigrire|6amo,splendere|6iamo,spoliare|6mo,spoltrire|7amo,spoltronire|9amo,sporre|3niamo,spremere|5iamo,spromettere|8iamo,sproteggere|8iamo,squarciare|8mo,squittire|7amo,srugginire|8amo,stabbiare|7mo,stabilire|7amo,stanziare|7mo,statuire|6amo,stendere|5iamo,sterilire|7amo,sternutire|8amo,stinguere|6iamo,stipendiare|9mo,stizzire|6amo,stogliere|6amo,stordire|6amo,stormire|6amo,storpiare|7mo,strabiliare|9mo,stramortire|9amo,straniare|7mo,strasapere|7piamo,stravolere|6gliamo,striare|5mo,stridere|5iamo,strignere|6iamo,striminzire|9amo,struggere|6iamo,suadere|4iamo,subbullire|4olliamo,subire|4amo,sublicenziare|11mo,subsistere|7iamo,succidere|6iamo,suddistinguere|11iamo,suddividere|8iamo,suffiggere|7iamo,suffolcere|7iamo,suffondere|7iamo,suffulcere|7iamo,suggerire|7amo,sumere|3iamo,supporre|5niamo,susseguire|8amo,sussidiare|8mo,sussistere|7iamo,sussumere|6iamo,svaligiare|8mo,svampire|6amo,svanire|5amo,svariare|6mo,svelenire|7amo,svendere|5iamo,svestire|6amo,svigorire|7amo,svolere|3gliamo,tallire|5amo,telediffondere|11iamo,teleradiotrasmettere|17iamo,temere|3iamo,tendere|4iamo,tenere|3iamo,tessere|4iamo,testimoniare|10mo,tinnire|5amo,togliere|5amo,tonchiare|7mo,torchiare|7mo,tossire|5amo,tradire|5amo,trafiggere|7iamo,traggere|5iamo,tramettere|7iamo,tramischiare|10mo,tramortire|8amo,transcendere|9iamo,transcorrere|9iamo,transcrivere|9iamo,transferire|9amo,transfondere|9iamo,transire|6amo,transporre|7niamo,transubstanziare|14mo,transustanziare|13mo,traporre|5niamo,trapporre|6niamo,trapungere|7iamo,trarompere|7iamo,trasalire|7amo,trascegliere|9amo,trascendere|8iamo,trascorrere|8iamo,trascrivere|8iamo,trasferire|8amo,trasfondere|8iamo,trasgredire|9amo,trasmettere|8iamo,trasparere|7iamo,trasporre|6niamo,trasricchire|10amo,trattenere|7iamo,traudire|6amo,travestire|8amo,traviare|6mo,trebbiare|7mo,treppiare|7mo,trinciare|7mo,tripartire|8amo,tronfiare|7mo,ubbidire|6amo,ubidire|5amo,uccidere|5iamo,udire|3amo,uggire|4amo,ulire|3amo,umidire|5amo,umiliare|6mo,ungere|3iamo,unire|3amo,uscire|4amo,usucapire|7amo,uzzolire|6amo,vagire|4amo,vendemmiare|9mo,vendere|4iamo,vengiare|6mo,vertere|4iamo,vestire|5amo,vicariare|7mo,videoscrivere|10iamo,videotrasmettere|13iamo,vigorire|6amo,vilipendere|8iamo,vivere|3iamo,vociare|5mo,volere|2gliamo,vomire|4amo,xerocopiare|9mo,zittire|5amo",
        "rev": "dibiamo|4re,raliamo|4re,himiamo|5re,nnuiamo|4re,admiamo|5re,hiriamo|5re,sariamo|5re,rariamo|5re,todiamo|4re,suniamo|4re,figiamo|5re,logiamo|5re,sibiamo|4re,ioiamo|3re,bibiamo|4re,hesiamo|4re,ipriamo|5re,iuciamo|5re,diziamo|5re,tidiamo|4re,guaiamo|5re,vosiamo|4re,ragiamo|4re,nveiamo|4re,civiamo|5re,zzaiamo|3re,odriamo|4re,udriamo|4re,ttriamo|5re,agaiamo|5re,aidiamo|4re,sagiamo|4re,tigiamo|5re,oemiamo|5re,piziamo|5re,umolamo|5re,eagiamo|4re,oagiamo|4re,icriamo|5re,saviamo|4re,cotiamo|3ere,arhiamo|2e,luciamo|5re,irciamo|5re,riciamo|5re,ombuamo|4iare,draiamo|5re,fociamo|5re,paziamo|5re,ppliamo|4re,eltiamo|4re,bbaiamo|5re,bbuiamo|5re,cetiamo|4re,enciamo|4re,paiamo|4re,rguiamo|4re,tediamo|5re,unniamo|5re,oquiamo|5re,patiamo|4re,undiamo|3ere,nibiamo|4re,bediamo|4re,comiamo|5re,orviamo|5re,uariamo|4re,peciamo|5re,spriamo|4re,deliamo|4re,ubbiamo|5re,arsiamo|5re,elaiamo|5re,gidiamo|4re,fiziamo|5re,apriamo|4re,enfiamo|5re,gemiamo|3ere,inviamo|5re,pigiamo|5re,pudiamo|5re,saziamo|5re,offiamo|5re,tudiamo|5re,tupiamo|4re,fruiamo|4re,ruciamo|5re,daziamo|5re,mediamo|5re,sviamo|4re,vadiamo|3ere,tiziamo|5re,pediamo|4re,miciamo|5re,rociamo|5re,oziamo|4re,utriamo|4re,eziamo|4re,ceviamo|3ere,godiamo|3ere,viziamo|5re,sociamo|5re,sopiamo|4re,vviamo|4re,ficiamo|5re,liziamo|5re,cuciamo|4re,arciamo|4re,lamo|1iare,iaiamo|4re,ibbiamo|5re,raziamo|5re,viliamo|4re,erciamo|5re,cadiamo|3ere,rudiamo|3ere,regiamo|5re,beviamo|2re,agiamo|4re,unziamo|5re,valiamo|3ere,niciamo|5re,egliamo|5re,uisiamo|4re,cepiamo|4re,ibuiamo|4re,ugiamo|4re,iudiamo|3ere,unciamo|5re,igiamo|2ere,orciamo|3ere,inciamo|3ere,oiamo|3re,aciamo|4re,lciamo|4re,luiamo|3re,angiamo|3ere,anciamo|5re,ugliamo|5re,diciamo|2re,traiamo|3rre,olviamo|3ere,cediamo|3ere,duciamo|2rre,lgiamo|2ere,sciamo|4re,rgiamo|2ere,ingiamo|3ere,agliamo|5re,cciamo|4re,ghiamo|1are,ggiamo|4re,chiamo|1are,iamo|are"
      },
      "secondPlural": {
        "rules": "ompire|4ete,alliare|3ate,ibere|3vete,iuliare|3ate,mbuiare|3ate,atchare|1chate,bullire|1ollite,trabere|5vete,raggere|2ete,trarre|3ete,durre|2cete,porre|2nete,re|te,rci|te",
        "exceptions": "bere|2vete,bullizzare|6ate,decarbonizzare|10ate,ebere|3vete,esserci|siete,impecettare|5attate,impedantire|spendantite,mensilizzare|10ate,paleggiare|5iate,pinneggiare|8iate,raggrovigliare|10ate,rattralciare|9iate,riespugnare|2pugnate,rimeggiare|7iate,rimpecettare|6attate,rinchiocciolire|inchiocciolite,rinverniciare|2verniciate,rivalicare|tivalicate,sbaldire|7ite,sbarbarire|8ate,sbellicare|9ate,scombugliare|8ate,strabenedire|10cete,teletrasmettere|8ettete,astraggere|5ete,autoridurre|8cete,compire|5ete,dedurre|4cete,distraggere|6ete,dormirci|5te,metterci|5te,palliare|4ate,prenderci|6te,redurre|4cete,sciusciuliare|9ate,sedurre|4cete,sentirci|5te,sottraggere|6ete,subbullire|4ollite,traggere|3ete",
        "rev": "bducete|3rre,llizate|4zare,onizate|4zare,izzaate|4re,rducete|3rre,viglate|4iare,ibevete|3re,itraete|4ggere,ldirite|4e,bariate|4re,icarate|4e,buglate|4iare,ombuate|4iare,rachate|2tchare,settete|1mettere,sducete|3rre,dducete|3rre,aducete|3rre,abevete|3re,iiate|1are,nducete|3rre,oducete|3rre,traete|3rre,ponete|2rre,te|re"
      },
      "thirdPlural": {
        "rules": "cestire|4ono,enavere|3nno,ompire|4ono,iuscire|1escono,terdire|5cono,avenire|4gono,anguire|4ono,aladire|5cono,alliare|3ano,iacere|3ciono,lagere|3giono,emorire|2uoiono,evenire|4gono,ibere|3vono,dormire|4ono,idovere|2evono,isalire|4gono,iudire|1odono,iuliare|3ano,mbuiare|3ano,atchare|1chano,rignere|2ngono,bullire|1ollono,raudire|2odono,borrire|4ono,pparire|3iono,ssalire|4gono,sdire|3cono,rvenire|4gono,aledire|5cono,manere|3gono,aprire|3ono,enedire|5cono,empire|4ono,escire|3ono,svenire|4gono,trabere|5vono,mparire|3iono,addire|4cono,potere|2ssono,fuggire|4ono,offrire|4ono,parere|2iono,cucire|4ono,ivenire|4gono,coprire|4ono,sapere|2nno,vvenire|4gono,valere|3gono,olere|1gliono,nvenire|4gono,vestire|4ono,sentire|4ono,seguire|4ono,trarre|3ggono,tenere|3gono,gliere|lgono,durre|2cono,porre|2ngono,ire|1scono,ere|ono,are|1no,irci|ono,erci|ono",
        "exceptions": "adsorbire|6ono,avere|hanno,avvertire|6ono,bere|2vono,boglire|5ono,bollire|4ono,bullizzare|6ano,contradire|8cono,convertire|7ono,dare|2nno,decarbonizzare|10ano,dipartire|6ono,dire|2cono,disparire|5iono,disservire|7ono,divertire|6ono,ebere|3vono,esserci|sono,impecettare|5attano,impedantire|spendantiscono,indire|4cono,interconvertire|12ono,intormentire|9ono,invertire|6ono,manicare|3ucano,mensilizzare|10ano,mentire|4ono,morire|1uoiono,paleggiare|5iano,partire|4ono,pervertire|7ono,pinneggiare|8iano,plaudire|5ono,preavvertire|9ono,predire|5cono,prevertire|7ono,provenire|6gono,raggrovigliare|10ano,rattralciare|9iano,riassorbire|8ono,riavvertire|8ono,ribollire|6ono,riconvertire|9ono,ridare|4nno,ridire|4cono,riespugnare|2pugnano,rimeggiare|7iano,rimorire|3uoiono,rimpecettare|6attano,rinchiocciolire|inchioccioliscono,rinverniciare|2verniciano,rinvertire|7ono,ripartire|6ono,riservire|6ono,risovvertire|9ono,ristare|5nno,rivalicare|tivalicano,salire|3gono,sbaldire|7iscono,sbarbarire|8ano,sbellicare|9ano,scombugliare|8ano,scoraggire|7ono,scovrire|5ono,servire|4ono,smorire|2uoiono,sobbollire|7ono,sottostare|8nno,sovvertire|7ono,stare|3nno,teletrasmettere|8ettono,udire|odono,venire|3gono,attrarre|5ggono,autocontrarre|10ggono,benedicere|7ono,contrarre|6ggono,decontrarre|8ggono,dormirci|4ono,ducere|3ono,educere|4ono,escire|3ono,estrarre|5ggono,fuoriuscire|5escono,licere|3ono,metterci|4ono,palliare|4ano,parere|2iono,prenderci|5ono,protrarre|6ggono,rattrarre|6ggono,retrarre|5ggono,riattrarre|7ggono,ricompiere|7ono,ricontrarre|8ggono,ridormire|6ono,riducere|5ono,riescire|5ono,riestrarre|7ggono,sciusciuliare|9ano,sentirci|4ono,sparere|3iono,strignere|4ngono,subbullire|4ollono,trasparere|6iono",
        "rev": "enanno|3vere,llizano|4zare,onizano|4zare,econo|2ere,anucano|2icare,izzaano|4re,acciono|2ere,aggiono|2ere,laudono|4ire,viglano|4iare,ibevono|3re,idevono|2overe,iodono|1udire,bariano|4re,icarano|4e,buglano|4iare,ombuano|4iare,covrono|4ire,rachano|2tchare,settono|1mettere,raodono|2udire,borrono|4ire,sorbono|4ire,inquono|4ere,mangono|3ere,danno|2re,abevono|3re,mpiono|3re,partono|4ire,servono|4ire,combono|4ere,iiano|1are,possono|2tere,bollono|4ire,fuggono|4ire,offrono|4ire,stanno|3re,lcono|2ere,salgono|3ire,cuciono|4re,tolgono|2gliere,muoiono|1orire,celgono|2gliere,colgono|2gliere,iolgono|2gliere,ascono|3ere,sanno|2pere,paiono|2rire,tessono|4ere,valgono|3ere,ogliono|1lere,prono|2ire,llono|2ere,inguono|4ere,estono|3ire,noscono|4ere,guono|2ire,entono|3ire,torcono|4ere,vincono|4ere,pono|1ere,nono|1ere,escono|3ere,dicono|2re,tengono|3ere,ducono|2rre,rono|1ere,vengono|3ire,mono|1ere,pongono|2rre,vono|1ere,tono|1ere,gono|1ere,dono|1ere,iscono|1re,ano|1re"
      }
    }
  };

  // uncompress them
  Object.keys(model$1).forEach(k => {
    Object.keys(model$1[k]).forEach(form => {
      model$1[k][form] = uncompress$1(model$1[k][form]);
    });
  });

  let { presentTense } = model$1;
  // =-=-

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

  const toPresent = (str) => doEach(str, presentTense);
  // const toPast = (str) => doEach(str, pastTense)
  // const toFuture = (str) => doEach(str, futureTense)
  // const toConditional = (str) => doEach(str, conditional)



  var conjugate = {
    toPresent,
    // toPast,
    // toFuture,
    // toConditional,
  };

  // import toRoot from './verbs/toRoot.js'
  // import toSingular from './nouns/toSingular.js'
  // import toPlural from './nouns/toPlural.js'
  // import toMasculine from './nouns/toMasculine.js'
  // import { adjToMasculine, adjToSingular } from './adjectives/toRoot.js'
  // import { fromGerund, toGerund } from './verbs/gerund.js'


  var methods = {
    verb: {
      conjugate,
      // toRoot,
      // fromGerund,
      // toGerund
    },
    noun: {
      // toPlural,
      // toSingular,
      // toMasculine,
    },
    adjective: {
      // adjToMasculine,
      // adjToSingular
    }
  };

  // generated in ./lib/lexicon
  var lexData = {
    "Article": "true¦i0l;!l",
    "Pronoun": "true¦ci,esso,gli,io,l8mi6no4su3t1v0;i,o3;i,u0;!a,e,o4;a,o3;i,str0;a,e,i,o;!e0o;!i;a,e,o0ui;!ro",
    "Preposition": "true¦a4co3d1f0in,ne2per,su4t0;ra;a2e0i;g4i,l2;i,l,n;!g2i,l0;!l0;!a,e,o;li",
    "Possessive": "true¦mi4n2su1tu0v2;a,e,o4;a,o3;ostr0;a,e,i,o;e0o;!i",
    "FemaleName": "true¦0:FX;1:G1;2:FQ;3:FC;4:FB;5:FR;6:EQ;7:EO;8:GE;9:EY;A:GA;B:E4;C:G7;D:FN;E:FK;F:EF;aE1bD3cB7dAHe9Ff90g8Gh82i7Rj6Tk5Zl4Nm37n2So2Pp2Equ2Dr1Ns0Pt03ursu6vUwOyLzG;aJeHoG;e,la,ra;lGna;da,ma;da,ra;as7DeHol1SvG;et7onB8;le0sen3;an9endBMhiB3iG;lInG;if39niGo0;e,f38;a,helmi0lGma;a,ow;aLeIiG;ckD0viG;an9WenG0;da,l8Vnus,rG;a,nGoniD2;a,iDC;leGnesEC;nDLrG;i1y;aSePhNiMoJrGu6y4;acG3iGu0E;c3na,sG;h9Mta;nHrG;a,i;i9Jya;a5IffaCGna,s5;al3eGomasi0;a,l8Go6Xres1;g7Uo6WrHssG;!a,ie;eFi,ri8;bNliMmKnIrHs5tGwa0;ia0um;a,yn;iGya;a,ka,s5;a4e4iGmCAra;!ka;a,t5;at5it5;a05carlet2Ye04hUiSkye,oQtMuHyG;bFJlvi1;e,sHzG;an2Tet7ie,y;anGi8;!a,e,nG;aEe;aIeG;fGl3DphG;an2;cF8r6;nGphi1;d4ia,ja,ya;er4lv3mon1nGobh75;dy;aKeGirlBLo0y6;ba,e0i6lIrG;iGrBPyl;!d70;ia,lBV;ki4nIrHu0w0yG;la,na;i,leAon,ron;a,da,ia,nGon;a,on;l5Yre0;bMdLi9lKmIndHrGs5vannaE;aEi0;ra,y;aGi4;nt5ra;lBNome;e,ie;in1ri0;a02eXhViToHuG;by,thBK;bQcPlOnNsHwe0xG;an94ie,y;aHeGie,lC;ann8ll1marBFtB;!lGnn1;iGyn;e,nG;a,d7W;da,i,na;an9;hel53io;bin,erByn;a,cGkki,na,ta;helBZki;ea,iannDXoG;da,n12;an0bIgi0i0nGta,y0;aGee;!e,ta;a,eG;cARkaE;chGe,i0mo0n5EquCDvDy0;aCCelGi9;!e,le;een2ia0;aMeLhJoIrG;iGudenAW;scil1Uyamva9;lly,rt3;ilome0oebe,ylG;is,lis;arl,ggy,nelope,r6t4;ige,m0Fn4Oo6rvaBBtHulG;a,et7in1;ricGsy,tA8;a,e,ia;ctav3deHfAWlGphAW;a,ga,iv3;l3t7;aQePiJoGy6;eHrG;aEeDma;ll1mi;aKcIkGla,na,s5ta;iGki;!ta;hoB2k8BolG;a,eBH;!mh;ll2na,risF;dIi5PnHo23taG;li1s5;cy,et7;eAiCO;a01ckenz2eViLoIrignayani,uriBGyG;a,rG;a,na,tAS;i4ll9XnG;a,iG;ca,ka,qB4;a,chOkaNlJmi,nIrGtzi;aGiam;!n9;a,dy,erva,h,n2;a,dIi9JlG;iGy;cent,e;red;!e6;ae6el3G;ag4KgKi,lHrG;edi61isFyl;an2iGliF;nGsAM;a,da;!an,han;b08c9Ed06e,g04i03l01nZrKtJuHv6Sx87yGz2;a,bell,ra;de,rG;a,eD;h75il9t2;a,cSgOiJjor2l6In2s5tIyG;!aGbe5QjaAlou;m,n9S;a,ha,i0;!aIbALeHja,lCna,sGt53;!a,ol,sa;!l06;!h,m,nG;!a,e,n1;arIeHie,oGr3Kueri7;!t;!ry;et3IiB;elGi61y;a,l1;dGon,ue6;akranBy;iGlo36;a,ka,n9;a,re,s2;daGg2;!l2W;alCd2elGge,isBGon0;eiAin1yn;el,le;a0Ie08iWoQuKyG;d3la,nG;!a,dHe9SnGsAQ;!a,e9R;a,sAO;aB1cJelIiFlHna,pGz;e,iB;a,u;a,la;iGy;a2Ae,l25n9;is,l1GrHtt2uG;el6is1;aIeHi8na,rG;a6Zi8;lei,n1tB;!in1;aQbPd3lLnIsHv3zG;!a,be4Ket7z2;a,et7;a,dG;a,sGy;ay,ey,i,y;a,iaIlG;iGy;a8Ge;!n4F;b7Terty;!n5R;aNda,e0iLla,nKoIslARtGx2;iGt2;c3t3;la,nGra;a,ie,o4;a,or1;a,gh,laG;!ni;!h,nG;a,d4e,n4N;cNdon7Si6kes5na,rMtKurIvHxGy6;mi;ern1in3;a,eGie,yn;l,n;as5is5oG;nya,ya;a,isF;ey,ie,y;aZeUhadija,iMoLrIyG;lGra;a,ee,ie;istGy5B;a,en,iGy;!e,n48;ri,urtn9A;aMerLl99mIrGzzy;a,stG;en,in;!berlG;eGi,y;e,y;a,stD;!na,ra;el6PiJlInHrG;a,i,ri;d4na;ey,i,l9Qs2y;ra,s5;c8Wi5XlOma6nyakumari,rMss5LtJviByG;!e,lG;a,eG;e,i78;a5EeHhGi3PlCri0y;ar5Cer5Cie,leDr9Fy;!lyn73;a,en,iGl4Uyn;!ma,n31sF;ei72i,l2;a04eVilToMuG;anKdJliGst56;aHeGsF;!nAt0W;!n8X;i2Ry;a,iB;!anLcelCd5Vel71han6IlJni,sHva0yG;a,ce;eGie;fi0lCph4X;eGie;en,n1;!a,e,n36;!i10lG;!i0Z;anLle0nIrHsG;i5Qsi5Q;i,ri;!a,el6Pif1RnG;a,et7iGy;!e,f1P;a,e72iHnG;a,e71iG;e,n1;cLd1mi,nHqueliAsmin2Uvie4yAzG;min8;a8eHiG;ce,e,n1s;!lGsFt06;e,le;inHk2lCquelG;in1yn;da,ta;da,lPmNnMo0rLsHvaG;!na;aHiGob6U;do4;!belGdo4;!a,e,l2G;en1i0ma;a,di4es,gr5R;el9ogG;en1;a,eAia0o0se;aNeKilHoGyacin1N;ll2rten1H;aHdGlaH;a,egard;ry;ath0WiHlGnrietBrmiAst0W;en24ga;di;il75lKnJrGtt2yl75z6D;iGmo4Fri4G;etG;!te;aEnaE;ey,l2;aYeTiOlMold12rIwG;enGyne18;!dolC;acHetGisel9;a,chD;e,ieG;!la;adys,enGor3yn1Y;a,da,na;aJgi,lHna,ov71selG;a,e,le;da,liG;an;!n0;mYnIorgHrG;ald35i,m2Stru73;et7i5T;a,eGna;s1Nvieve;briel3Fil,le,rnet,yle;aReOio0loMrG;anHe9iG;da,e9;!cG;esHiGoi0G;n1s3V;!ca;!rG;a,en43;lHrnG;!an9;ec3ic3;rHtiGy8;ma;ah,rah;d0FileDkBl00mUn4ArRsMtLuKvG;aIelHiG;e,ta;in0Ayn;!ngel2H;geni1la,ni3R;h52ta;meral9peranJtG;eHhGrel6;er;l2Pr;za;iGma,nest29yn;cGka,n;a,ka;eJilImG;aGie,y;!liA;ee,i1y;lGrald;da,y;aTeRiMlLma,no4oJsIvG;a,iG;na,ra;a,ie;iGuiG;se;a,en,ie,y;a0c3da,nJsGzaH;aGe;!beG;th;!a,or;anor,nG;!a;in1na;en,iGna,wi0;e,th;aWeKiJoGul2U;lor51miniq3Yn30rGtt2;a,eDis,la,othGthy;ea,y;an09naEonAx2;anPbOde,eNiLja,lImetr3nGsir4U;a,iG;ce,se;a,iHorGphiA;es,is;a,l5J;dGrdG;re;!d4Mna;!b2CoraEra;a,d4nG;!a,e;hl3i0mMnKphn1rHvi1WyG;le,na;a,by,cHia,lG;a,en1;ey,ie;a,et7iG;!ca,el1Aka;arGia;is;a0Qe0Mh04i02lUoJrHynG;di,th3;istGy04;al,i0;lOnLrHurG;tn1D;aId28iGn28riA;!nG;a,e,n1;!l1S;n2sG;tanGuelo;ce,za;eGleD;en,t7;aIeoHotG;il4B;!pat4;ir8rIudG;et7iG;a,ne;a,e,iG;ce,sX;a4er4ndG;i,y;aPeMloe,rG;isHyG;stal;sy,tG;aHen,iGy;!an1e,n1;!l;lseHrG;!i8yl;a,y;nLrG;isJlHmG;aiA;a,eGot7;n1t7;!sa;d4el1PtG;al,el1O;cHlG;es7i3F;el3ilG;e,ia,y;iYlXmilWndVrNsLtGy6;aJeIhGri0;erGleDrCy;in1;ri0;li0ri0;a2GsG;a2Fie;a,iMlKmeIolHrG;ie,ol;!e,in1yn;lGn;!a,la;a,eGie,y;ne,y;na,sF;a0Di0D;a,e,l1;isBl2;tlG;in,yn;arb0CeYianXlVoTrG;andRePiIoHyG;an0nn;nwCok8;an2NdgKg0ItG;n27tG;!aHnG;ey,i,y;ny;etG;!t8;an0e,nG;da,na;i8y;bbi8nG;iBn2;ancGossom,ythe;a,he;ca;aRcky,lin9niBrNssMtIulaEvG;!erlG;ey,y;hHsy,tG;e,i0Zy8;!anG;ie,y;!ie;nGt5yl;adHiG;ce;et7iA;!triG;ce,z;a4ie,ra;aliy29b24d1Lg1Hi19l0Sm0Nn01rWsNthe0uJvIyG;anGes5;a,na;a,r25;drIgusHrG;el3;ti0;a,ey,i,y;hHtrG;id;aKlGt1P;eHi8yG;!n;e,iGy;gh;!nG;ti;iIleHpiB;ta;en,n1t7;an19elG;le;aYdWeUgQiOja,nHtoGya;inet7n3;!aJeHiGmI;e,ka;!mGt7;ar2;!belHliFmT;sa;!le;ka,sGta;a,sa;elGie;a,iG;a,ca,n1qG;ue;!t7;te;je6rea;la;!bHmGstas3;ar3;el;aIberHel3iGy;e,na;!ly;l3n9;da;aTba,eNiKlIma,ta,yG;a,c3sG;a,on,sa;iGys0J;e,s0I;a,cHna,sGza;a,ha,on,sa;e,ia;c3is5jaIna,ssaIxG;aGia;!nd4;nd4;ra;ia;i0nHyG;ah,na;a,is,naE;c5da,leDmLnslKsG;haElG;inGyW;g,n;!h;ey;ee;en;at5g2nG;es;ie;ha;aVdiSelLrG;eIiG;anLenG;a,e,ne;an0;na;aKeJiHyG;nn;a,n1;a,e;!ne;!iG;de;e,lCsG;on;yn;!lG;iAyn;ne;agaJbHiG;!gaI;ey,i8y;!e;il;ah",
    "Condition": "true¦nel caso che,se",
    "FirstName": "true¦aEblair,cCdevBj8k6lashawn,m3nelly,quinn,re2sh0;ay,e0iloh;a,lby;g1ne;ar1el,org0;an;ion,lo;as8e0r9;ls7nyatta,rry;am0ess1ude;ie,m0;ie;an,on;as0heyenne;ey,sidy;lex1ndra,ubr0;ey;is",
    "LastName": "true¦0:34;1:3B;2:39;3:2Y;4:2E;5:30;a3Bb31c2Od2Ee2Bf25g1Zh1Pi1Kj1Ek17l0Zm0Nn0Jo0Gp05rYsMtHvFwCxBy8zh6;a6ou,u;ng,o;a6eun2Uoshi1Kun;ma6ng;da,guc1Zmo27sh21zaR;iao,u;a7eb0il6o3right,u;li3Bs2;gn0lk0ng,tanabe;a6ivaldi;ssilj37zqu1;a9h8i2Go7r6sui,urn0;an,ynisJ;lst0Prr1Uth;at1Uomps2;kah0Vnaka,ylor;aEchDeChimizu,iBmiAo9t7u6zabo;ar1lliv2AzuE;a6ein0;l23rm0;sa,u3;rn4th;lva,mmo24ngh;mjon4rrano;midt,neid0ulz;ito,n7sa6to;ki;ch1dLtos,z;amBeag1Zi9o7u6;bio,iz,sD;b6dri1MgIj0Tme24osevelt,ssi,ux;erts,ins2;c6ve0F;ci,hards2;ir1os;aEeAh8ic6ow20;as6hl0;so;a6illips;m,n1T;ders5et8r7t6;e0Nr4;ez,ry;ers;h21rk0t6vl4;el,te0J;baBg0Blivei01r6;t6w1O;ega,iz;a6eils2guy5ix2owak,ym1E;gy,ka6var1K;ji6muW;ma;aEeCiBo8u6;ll0n6rr0Bssolini,ñ6;oz;lina,oKr6zart;al0Me6r0U;au,no;hhail4ll0;rci0ssi6y0;!er;eWmmad4r6tsu07;in6tin1;!o;aCe8i6op1uo;n6u;coln,dholm;fe7n0Qr6w0J;oy;bv6v6;re;mmy,rs5u;aBennedy,imuAle0Lo8u7wo6;k,n;mar,znets4;bay6vacs;asY;ra;hn,rl9to,ur,zl4;aAen9ha3imen1o6u3;h6nYu3;an6ns2;ss2;ki0Es5;cks2nsse0D;glesi9ke8noue,shik7to,vano6;u,v;awa;da;as;aBe8itchcock,o7u6;!a3b0ghNynh;a3ffmann,rvat;mingw7nde6rN;rs2;ay;ns5rrQs7y6;asDes;an4hi6;moJ;a9il,o8r7u6;o,tierr1;ayli3ub0;m1nzal1;nd6o,rcia;hi;erAis9lor8o7uj6;ita;st0urni0;es;ch0;nand1;d7insteHsposi6vaL;to;is2wards;aCeBi9omin8u6;bo6rand;is;gu1;az,mitr4;ov;lgado,vi;nkula,rw7vi6;es,s;in;aFhBlarkAo6;h5l6op0rbyn,x;em7li6;ns;an;!e;an8e7iu,o6ristens5u3we;i,ng,u3w,y;!n,on6u3;!g;mpb7rt0st6;ro;ell;aBe8ha3lanco,oyko,r6yrne;ooks,yant;ng;ck7ethov5nnett;en;er,ham;ch,h8iley,rn6;es,i0;er;k,ng;dDl9nd6;ers6rA;en,on,s2;on;eks7iy8var1;ez;ej6;ev;ams",
    "Determiner": "true¦li,un0;!a,o",
    "MaleName": "true¦0:CD;1:BK;2:C1;3:BS;4:B4;5:BY;6:AS;7:9U;8:BC;9:AW;A:AN;aB3bA7c96d86e7Ff6Xg6Fh5Vi5Hj4Kk4Al3Qm2On2Do28p22qu20r1As0Qt06u05v00wNxavi3yGzB;aBor0;cBh8Hne;hCkB;!aB0;ar50eAZ;ass2i,oCuB;sDu24;nEsDusB;oBsC;uf;ef;at0g;aJeHiCoByaAO;lfgang,odrow;lBn1O;bDey,frBIlB;aA4iB;am,e,s;e88ur;i,nde7sB;!l6t1;de,lCrr5yB;l1ne;lBt3;a92y;aEern1iB;cCha0nceBrg9Ava0;!nt;ente,t59;lentin48n8Xughn;lyss4Lsm0;aTeOhKiIoErCyB;!l3ro8s1;av9PeBist0oy,um0;nt9Hv53y;bDd7WmBny;!as,mBoharu;aAXie,y;i82y;mBt9;!my,othy;adDeoCia7ComB;!as;!do7L;!de9;dErB;en8GrB;an8FeBy;ll,n8E;!dy;dgh,ic9Snn3req,ts44;aRcotPeNhJiHoFpenc3tBur1Nylve8Gzym1;anDeBua7A;f0phAEvBwa79;e56ie;!islaw,l6;lom1nA2uB;leyma8ta;dBl7Im1;!n6;aDeB;lBrm0;d1t1;h6Rne,qu0Tun,wn,y8;aBbasti0k1Wl40rg3Zth,ymo9H;m9n;!tB;!ie,y;lCmBnti20q4Hul;!mAu4;ik,vato6U;aWeShe91iOoFuCyB;an,ou;b6KdCf9pe6PssB;!elAH;ol2Ty;an,bIcHdGel,geFh0landA8mEnDry,sCyB;!ce;coe,s;!a94nA;an,eo;l3Ir;e4Pg3n6olfo,ri67;co,ky;bAe9T;cBl6;ar5Nc5MhCkBo;!ey,ie,y;a84ie;gCid,ub5x,yBza;ansh,nR;g8ViB;na8Rs;ch5Xfa4lDmCndBpha4sh6Tul,ymo6Z;al9Xol2Ay;i9Hon;f,ph;ent2inB;cy,t1;aFeDhilCier61ol,reB;st1;!ip,lip;d9Arcy,tB;ar,e2U;b3Rdra6Et43ul;ctav2Uliv3m95rEsBt7Pum8Tw5;aCc8SvB;al52;ma;i,l49vJ;athJeHiDoB;aBel,l0ma0r2X;h,m;cCg4i3IkB;h6Uola;hol5XkBol5X;!ol5W;al,d,il,ls1vB;il50;anBy;!a4i4;aWeTiKoFuCyB;l21r1;hamCr5ZstaB;fa,p4G;ed,mF;dibo,e,hamDis1XntCsBussa;es,he;e,y;ad,ed,mB;ad,ed;cGgu4kElDnCtchB;!e7;a78ik;house,o03t1;e,olB;aj;ah,hBk6;a4eB;al,l;hClv2rB;le,ri7v2;di,met;ck,hNlLmOnu4rHs1tDuricCxB;!imilian8Cwe7;e,io;eo,hCi52tB;!eo,hew,ia;eBis;us,w;cDio,k86lCqu6Gsha7tBv2;i2Hy;in,on;!el,oKus;achBcolm,ik;ai,y;amBdi,moud;adB;ou;aReNiMlo2RoIuCyB;le,nd1;cEiDkBth3;aBe;!s;gi,s;as,iaB;no;g0nn6RrenDuBwe7;!iB;e,s;!zo;am,on4;a7Bevi,la4SnDoBst3vi;!nB;!a60el;!ny;mCnBr67ur4Twr4T;ce,d1;ar,o4N;aIeDhaled,iBrist4Vu48y3B;er0p,rB;by,k,ollos;en0iEnBrmit,v2;!dCnBt5C;e0Yy;a7ri4N;r,th;na68rBthem;im,l;aYeQiOoDuB;an,liBst2;an,o,us;aqu2eJhnInGrEsB;eChBi7Bue;!ua;!ph;dBge;an,i,on;!aBny;h,s,th4X;!ath4Wie,nA;!l,sBy;ph;an,e,mB;!mA;d,ffGrDsB;sBus;!e;a5JemCmai8oBry;me,ni0O;i6Uy;!e58rB;ey,y;cHd5kGmFrDsCvi3yB;!d5s1;on,p3;ed,od,rBv4M;e4Zod;al,es,is1;e,ob,ub;k,ob,quB;es;aNbrahMchika,gKkeJlija,nuIrGsDtBv0;ai,sB;uki;aBha0i6Fma4sac;ac,iaB;h,s;a,vinBw2;!g;k,nngu52;!r;nacBor;io;im;in,n;aJeFina4VoDuByd56;be25gBmber4CsD;h,o;m3ra33sBwa3X;se2;aDctCitCn4ErB;be20m0;or;th;bKlJmza,nIo,rDsCyB;a43d5;an,s0;lEo4FrDuBv6;hi40ki,tB;a,o;is1y;an,ey;k,s;!im;ib;aQeMiLlenKoIrEuB;illerCsB;!tavo;mo;aDegBov3;!g,orB;io,y;dy,h57nt;nzaBrd1;lo;!n;lbe4Qno,ovan4R;ne,oDrB;aBry;ld,rd4U;ffr6rge;bri4l5rBv2;la1Zr3Eth,y;aReNiLlJorr0IrB;anDedBitz;!dAeBri24;ri23;cDkB;!ie,lB;in,yn;esJisB;!co,zek;etch3oB;yd;d4lBonn;ip;deriDliCng,rnB;an01;pe,x;co;bi0di;arZdUfrTit0lNmGnFo2rCsteb0th0uge8vBym5zra;an,ere2V;gi,iCnBrol,v2w2;est45ie;c07k;och,rique,zo;aGerFiCmB;aFe2P;lCrB;!h0;!io;s1y;nu4;be09d1iEliDmCt1viBwood;n,s;er,o;ot1Ts;!as,j43sB;ha;a2en;!dAg32mEuCwB;a25in;arB;do;o0Su0S;l,nB;est;aYeOiLoErDuCwByl0;ay8ight;a8dl6nc0st2;ag0ew;minFnDri0ugCyB;le;!l03;!a29nBov0;e7ie,y;go,icB;!k;armuCeBll1on,rk;go;id;anIj0lbeHmetri9nFon,rEsDvCwBxt3;ay8ey;en,in;hawn,mo08;ek,ri0F;is,nBv3;is,y;rt;!dB;re;lKmInHrDvB;e,iB;!d;en,iDne7rByl;eBin,yl;l2Vn;n,o,us;!e,i4ny;iBon;an,en,on;e,lB;as;a06e04hWiar0lLoGrEuCyrB;il,us;rtB;!is;aBistobal;ig;dy,lEnCrB;ey,neli9y;or,rB;ad;by,e,in,l2t1;aGeDiByI;fBnt;fo0Ct1;meCt9velaB;nd;nt;rDuCyB;!t1;de;enB;ce;aFeErisCuB;ck;!tB;i0oph3;st3;d,rlBs;eBie;s,y;cBdric,s11;il;lEmer1rB;ey,lCro7y;ll;!os,t1;eb,v2;ar02eUilTlaSoPrCuByr1;ddy,rtI;aJeEiDuCyB;an,ce,on;ce,no;an,ce;nCtB;!t;dCtB;!on;an,on;dCndB;en,on;!foBl6y;rd;bCrByd;is;!by;i8ke;al,lA;nFrBshoi;at,nCtB;!r10;aBie;rd0S;!edict,iCjam2nA;ie,y;to;n6rBt;eBy;tt;ey;ar0Xb0Nd0Jgust2hm0Gid5ja0ElZmXnPputsiOrFsaEuCveBya0ziz;ry;gust9st2;us;hi;aIchHi4jun,maFnDon,tBy0;hBu06;ur;av,oB;ld;an,nd0A;el;ie;ta;aq;dGgel05tB;hoEoB;i8nB;!i02y;ne;ny;reBy;!as,s,w;ir,mBos;ar;an,beOd5eIfFi,lEonDphonHt1vB;aMin;on;so,zo;an,en;onCrB;edP;so;c,jaEksandDssaExB;!and3;er;ar,er;ndB;ro;rtH;ni;en;ad,eB;d,t;in;aColfBri0vik;!o;mBn;!a;dFeEraCuB;!bakr,lfazl;hBm;am;!l;allEel,oulaye,ulB;!lCrahm0;an;ah,o;ah;av,on",
    "Cardinal": "true¦cOdFmilCnovPottBqu8se7tre1unHvent0;i3otQu2;!diHnt0;a1otOu0;no;!cinq1d1nIquattro,se0tré;i,tG;ue;diBi,ssaIttH;a0in8;raGtt0;or6ro;aEo;i0le;ardo,on0;e,i;i2o1ue0;!cenAmila;di1;ci1e0;ci;a0ot6;nn1sset0;te;ove;en2inqu0;a0e;nta;to",
    "City": "true¦0:62;1:5U;2:5A;a5Ib4Dc3Ud3Je3Hf3Dg31h2Ui2Qjak36k2Bl1Ym1Fn14o12p0Kqui1Tr0DsYtKuJvEw8y5z3;ag3uri45;abr1reb;a4e3okoha3K;katerin30r3E;moussouk47ng3Noundé;a6e5i3rocl18;ckl25n3;dho4Pnipeg,terth27;ll4xford;rs14sh3;ingt3H;a5i3;c09en3lni5T;na,tia56;duz,lenc1ncouv1Gr3;na,sav1;lan bat1Btrecht;aDbilisi,eBh9i8o7r6u3;nis4r3;in,ku;!i;ipo32ondheim;kyo,ron16ulouse;anj05l2Gmisoa5Cra2;e3imphu; hague,ssaloni28;gucigalpa,h3l av1V;er0r0;i4llinn,mpe4Ongi12r3shk2E;awa s0Etu;chu4Cn0p0G;a7e6h5ingapo4Lkopje,of1ri jayawardenapura kot0Ut3u3Yydn0Bão tomé;oc3uttga2J;col2Pkholm;angh3Aenzh44;oul,ul,v3S;int Al8n3ppo3Braje4Q; 5a'a,t3;iago3o domin35;! del ci3P;jos3salv5;e,é;v3z1X;ad0K;george3john3peters1V;'s;a8eykjav7i6o3;m4s3t4H;ar08e3L;a,e;ad,ga,o de janei2X;ik,ík;b47mallah;aGeEhDiCo7r3ueb3Tyongya3P;a4e3;tor1;g3ia;a,ue;dgori26rt3zn0; 4-au-prin0Qo3;!-no42;elizabe7louis,moresby,of spa3vi3L;in;ls3Brae4E;iladelph1nom pe13oenix;chi29r3tah tik30;th;l5na1Rr3tr2K;amari23i3;gi,s;ermo,ik0S;des0Js3ttawa,uagadoug13;a3Elo;'djame2aBe7gerulm6i4ouakchott,u3;ova d9r-sult0;am3cos1;ey;ud;ssu2w 3;d4taip3york;ei;el0F;goya,iro3Snt2Apl2Ass2Nv0ypyid3;aw;aBba2BeAi9o4u3;mb1Vni1S;gadisc6n4roni,sc3;a,ow;a1Nrov1t3;evideo,real;io;l0n0Qskolc;dellín,lbour2Z;drid,juro (delap-uliga-djarrit),lBn8pu7r5s3;ca3eru;te;ib3se23;or;to;a4chest3dal0Ki2J;er;gua,ma;a15mo,é;'ava2aBi7o5u3vQy0W;anJbia2s3;a2Hsembur1A;mé,nd3s angel1M;on,ra;brev1Rege,longwe,ma4nz,sbon3verpo5;!a;!ss3;ol; 3usan2F;p4v3;allet0Rel24;az,la0Q;aEharCi8laipe7o4rak3uala lump6;ow;be,pavog4si3;ce;ur;da;ev,ga09n3;gsto4sha3;sa;n,wn;k3tum;iv;b8mpa1Qndy,ohsiu1Mra3tmandu,un0V;c3j;hi;l cai0Onche04s4̇zm3;ir;lam27tanb3;ul;a7e5o3; chi mi3ms,nia27ustZ;nh;lsin3rakliX;ki;ifa,m3noi,ra1Kva2;bu29iltU;aCdanBe9h8i6othen5raz,ua3;dalaja20ngzh3;ou;bu25;ac3bBtega,u1Wza;arU;ent;n3or0Jrusalemme ov0C;e0Noa,ève;sk;boro1Blw3;ay;es,r4unaf3;uti;ankfu3ee0D;rt;dmontDindhov0Or3;ev0;a8ha0Yi7o5u3;bl0Jrb0sh3š3;anbe;do3ha;ma;li;c6e4kar,masc3ugavpiZ;o,us;gu,je3;on;ca;aIebu,hDittà d9o3raio02uriti17;lo6n4pen3rk;agh09hag09;akGstan3;ta;g0Nm3;bo;el 3i san mari4;guatema0Bmessi4vatica3;no;co;enn6i4ristchur3;ch;ang m4ca3ttago02șinău;go;ai;i4lga3nber0Spe Irac8striD;ry;ro;aXeOiLogotKr8u3;c5dap6enos air9r3s0;g3sa;as;ar3har3;est;aAi6u3;sse4xell3;es;ls;d4s3;baY;ge3;town;sil1tisla5zzav3;il3;le;va;a,à;rmingh00ss4šk3;ek;au;i9l7r3;g5l3n;in3;!o;en;grad3mop0;e,o;ji3rut;ng;ghdSku,mako,n7r4s3;el,seterA;celo2ranquil3;la;na;dar seri begaw0g5j3;a lu3ul;ka;alo3kok,ui;re;aPbLccKddis abeJhmedHlFmCn9p1qaJs5t3uckland,şg7;e3hens;ne;h3maHunción;dod,g3;ab3;at;kaDt3;ananari3werp;vo;m0s3;terd3;am; kuwait,exandr1geri,maty;ia;ab3;ad;ba;ra;idj0u3; dha3ja;bi;an;lbo4rh3;us;rg",
    "Honorific": "true¦aPbrigadiOcHdGexcellency,fiBjudge,king,liDmaAofficOp6queen,r3s0taoiseach,vice5;e0ultK;c0rgeaC;ond liAretary;abbi,e0;ar0verend; adK;astGr0;eside6i0ofessF;me ministFnce0;!ss;gistrate,r4yC;eld mar3rst l0;ady,i0;eutena0;nt;shB;oct6utchess;aptain,hance4o0;lonel,mmand5ngress1un0;ci2t;m0wom0;an;ll0;or;er;d0yatullah;mir0;al",
    "Person": "true¦ashton kutchSbRcMdKeIgastNhGinez,jEkDleCmBnettJoAp8r4s3t2v0;a0irgin maG;lentino rossi,n go3;heresa may,iger woods,yra banks;addam hussain,carlett johanssJlobodan milosevic,uB;ay romano,eese witherspoIo1ush limbau0;gh;d stewart,nald0;inho,o;a0ipJ;lmIris hiltD;prah winfrFra;essiaen,itt romnEubarek;bron james,e;anye west,iefer sutherland,obe bryant;aime,effers8k rowli0;ng;alle ber0itlBulk hogan;ry;ff0meril lagasse,zekiel;ie;a0enzel washingt2ick wolf;lt1nte;ar1lint0ruz;on;dinal wols1son0;! palm2;ey;arack obama,rock;er",
    "Country": "true¦0:37;1:2U;a2Qb29c1Yd1Ve1Sf1Rg1Ih1Ci12jama35k0Xl0Rm0En07o06pYrQsEt7u5v3wallis et futu1xiānggǎng costa sud della ci1z2éi0Lís1Fösterreich;a21imbabwe;a2enezue30iệt nam;nuatu,ticanæ;gan2Vkraji1n2ru01zbe0X;gher0ited states virgin islands;a7hailand0i6o5u2;nis0Nr2valu;ch0k2;meni31s e caic2F;go,ke2Snga;bet,mor est;gi0Piw2Znz2V;aBeAi9lov8oomaali0Mpag1ri lan10tat6u3v2wazi12ão tomé e príncipe,ām2J;ez0izze2P;da3omi,ri2;name,yah0U;fr2On kusini;i 2o di pales2C;baltici,uni0Y;ac1Len0;erra leo14ngapu2I;negQrb0ychelles;ha2Gint 2kartweDmoa0Jn mari0O;kitts and nevis,luc0vincent e grenadi11;e3om2Iu2;an29ssa;gno uni12pubblica 2;centrafr5d2;e2ominicana república domin4;l2mocratica del2; congo;ica1;a7e6ilipin1So2uerto rM;l3rtogal2;lo;inesia2onia pols0D;! francese;nisola ib22rù;ki27pua nuova guinea,ra2;guay;ceano india06m26;a7e5i3o2;rveg0uvelle calédonie;caragua,ger2;!ia;der05p2;al;mib0ur18;a7e5i18o2yanm0K;ldova,n2zamb5çamb9;gol0t2;eneg0Oserr10;la15ss2;ico;c7dagasc0El5rtinica martin4urit3yotte como2;re;an0i0P;ique;a2dive,i,ta;wi,ys0;au,ed7;a0Ye5i2;b2echtenste0R;aJer0iyah2; nordafr1C;sotho,tt2;on0;a4en3ir2osovo,uwait;ghizi1DibaK;ya;laallit nuna0Hza2;ki1A;ndonesia un,ra8s2t0Q;ol2raele;a di natale christm0Me 2;c4falkBmar3vergini2; americaK;ianJshall;aym14ook;k,n (persia) īrān2; vici2;no;a5o3rvats2;ka;l2ndur0C;land;i2ya0V;ti;a9ha1i7olfo di guinea e,re6u2;a4in3yan2;a,e;ea,é bissau;dalupa,m,tema0H;c0na0D;appo2ordania al urdunn;ne;bJmb0;igi,ranc0øroy7;cu3esti vabariik,git2l salv3mirati arabi,tiop0;to;ador;a2omin0B;nmark,wlat qat2;ar;a9e8i6o2uW;lo4morQrea3sta 2;d'avorio,r06;! del nord;mb0;ad,le,na,p2;ro;ch0;m2naUpo verV;bog0erun camero2;on;aFe9h7irmZo6r5u3yelar2;us;lgar0r2;kina faso,undi;asile brasil,unei;liv0snia ed erzegovi1tswa1;utXār2;at;l3n2rmuJ;in;a2gium,ize;u mi2;cro2;nes0;ham3ngladesh,rbad2;os;as;fghaneLlHmFn8otear7r3s sudMustr2zerbaigiM;al0;abia saudita,gen3u2;ba;ti1;na;oa;dor7g5t2;arti3igua and barbu2;da;de;o2uil2;la;ra;er2;ica; 4b2;an0;ia;bahrayn,jaza'ir,maghrib,yam3;st2;an",
    "Place": "true¦aHbFcDdCeuropBfco,gAh9i8jfk,kul,l6m4ord,p2s1the 0upEyyz;bronx,hamptons;fo,oho,underland,yd;ek,h0;l,x;a0co,id9uc;libu,nhattan;a0gw,hr;s,x;ax,cn,st;arlem,kg,nd;ay village,reenwich;a,e;en,fw,own1xb;dg,gk,hina0lt;town;cn,e0kk,rooklyn;l air,verly hills;frica,m0sia,tl;erica0s; 0s;centr0meridion0;ale",
    "Region": "true¦0:1T;1:22;a20b1Sc1Id1Des1Cf19g13h10i0Xj0Vk0Tl0Qm0FnZoXpSqPrMsDtAut9v6w4y2zacatec22;o05u2;cat18kZ;a2est vi4isconsin,yomi14;rwick0shington dc;er3i2;rgin1T;acruz,mont;ah,tar pradesh;a3e2laxca1EuscaB;nnessee,x1S;bas0Lmaulip1RsmK;a7i5o3taf0Pu2ylh14;ffWrr01s0Z;me11no1Buth 2;cTdS;ber1Jc2naloa;hu0Tily;n3skatchew0Sxo2;ny; luis potosi,ta catari1;a2hode8;j2ngp03;asth0Nshahi;inghai,u2;e2intana roo;bec,ensXreta0F;ara5e3rince edward2; isV;i,nnsylv2rnambu03;an15;!na;axa0Odisha,h2klaho1Cntar2reg5x05;io;ayarit,eCo4u2;evo le2nav0M;on;r2tt0Sva scot0Y;f7mandy,th2; 2ampton0;c4d3yo2;rk0;ako0Z;aroli1;olk;bras0Yva02w2; 3foundland2;! and labrador;brunswick,hamp0jers2mexiKyork state;ey;a7i3o2;nta1relos;ch4dlanCn3ss2;issippi,ouri;as geraHneso0N;igRoacR;dhya,harasht05ine,ni4r2ssachusetts;anhao,y2;land;p2toba;ur;anca0e2incoln0ouis9;e2iI;ds;a2entucky,hul1;ns09rnata0Eshmir;alis2iangxi;co;daho,llino3nd2owa;ia1;is;a3ert2idalFunB;ford0;mp0waii;ansu,eorgXlou6u2;an3erre2izhou,jarat;ro;ajuato,gdo2;ng;cester0;lori3uji2;an;da;sex;e5o3uran2;go;rs2;et;lawaFrby0;a9ea8hi7o2umbrI;ahui5l4nnectic3rsi2ventry;ca;ut;iNorado;la;apFhuahua;ra;l9m2;bridge0peche;a6r5uck2;ingham0;shi2;re;emen,itish columb4;h3ja cal2sque,var3;iforn2;ia;guascalientes,l5r2;izo1kans2;as;na;a3ber2;ta;ba3s2;ka;ma",
    "Currency": "true¦$,aud,bTcRdMeurLfKgbp,hkd,iJjpy,kHlFnis,p8r7s3usd,x2y1z0¢,£,¥,ден,лв,руб,฿,₡,₨,€,₭,﷼;lotyTł;en,uanS;af,of;h0t6;e0il6;k0q0;elN;iel,oubleMp,upeeM;e3ound0;! st0s;er0;lingI;n0soH;ceGn0;ies,y;e0i8;i,mpi7;n,r0wanzaCyatC;!onaBw;ls,nr;ori7ranc9;!o8;en3i2kk,o0;b0ll2;ra5;me4n0rham4;ar3;ad,e0ny;nt1;aht,itcoin0;!s",
    "Ordinal": "true¦cDd8mil6nono,ottavo,prGqu2se1t0und9veE;erzo,red8;condo,d7s3ttE;a1in0;d5to;r0ttord4;to;i0l8;ard7on7;ec7ici1od0;ic5;a0o1;nnov3sse0;tt2;e0inqua0;nt0;es0;imo",
    "Unit": "true¦bHceFeDfahrenheitIgBhertz,jouleIk8liGm6p4terEy2z1°0µs;c,f,n;b,e1;b,o0;ttA;e0ouceD;rcent,t8;eg7il0³,è9;eAlili8;elvin9ilo1m0;!/h,s;!b6gr1mètre,s;ig2r0;amme5;b,x0;ab2;lsius,ntimè0;tre1;yte0;!s",
    "Infinitive": "true¦0:19Y;1:19W;2:19U;3:19F;4:19X;5:19J;6:19O;7:16V;8:18G;9:190;A:18N;B:18M;C:19D;D:15N;E:17P;F:19K;G:183;H:18J;I:175;J:0YE;K:14N;L:17H;M:195;N:12G;O:17F;P:134;a0YXb0WYc0PQd0JDe0H0f0F2g0DQhandic18Ni05Ikil05Hl04Fm01Yn01Eo005pV8quV4rEOs42t1Mu19vYw18Nxerocop1zQ;aVeUiToRuQ;cc15Xfo5;c0U4l5n14UoEppQ;e8i6;mb186po5;c6la0pG;mpQpp19R;a0e0Y3il5og4;a0Se0FiYoRuQ;l0OOo2;cUga0lQmi2ra0ta0;aSe0gRpe8tQve0;a0e8u3;ar7e0;n158re,t0U3;aQia0;b68l7re;a8b3ci4d02e2g01lZncZ1ol0UHrYsWtUvQz1;aRe0iQ;fi6s0N1;cQnC;ch1iz9;aQt12Bu0HH;liz1m14D;iQta0uJ;o4ta0;a0gXTil7tuJ;iIlQ;a0XXe8;i5l1o12R;eoQiE;cQregi139sc0TRtelFA;hQomuOD;at2iaE;do18Rg01i0T8l00nWrRs0DQtriQz044;fi6o0XP;bJde8gTiImi19DnSri4sRtQ;e0icJ;a0e8iI;a0Z0ic1;a0e0he8oAV;a0dRe3g1i0tQ;a197i5;eQic014;mm1re;ar08Oe0X1i4li6oc7;e2l1;cWgUio5lTnRp023rQs03Yti158;ca0ia0;e8gQiIta0;a0he0WW;e0i6or7u2;aQhe8i0l1;bond0WRre;a0il5u0S7;b01cc00di0ffi0RYg4lZmXnTrSsQt0SY;a0ciQto5urG;o5re;b14Gge0V9i4la0ta186;gSiQta0;fQre,vers004;i6orE;e0uO;an135iQ;diIl1;tracentri0TTu5;eRKiA;biPrDP;a1Ue16i12o0WrTuQ;f18DmulRo4rQte5;a0bRHge0;a0t15G;aZeYiToRucQ;ca0iC;gl1l5mb12UnQpicJtt0T5va0;ca0e8;an0Z5bTe0VRfo5l5mesZIn0VUon186pSseRt0X7vQ;el5iJ;ca0zH;arLli6ud1;o5u2;bb1c6m0SYpiCs6;b0Hc0GdDOf0Fgu0V6i4la140m0Cn08p06r05sXttVuUvQ;aReQia0olD;rFsL;gl1lQsa0;ca0i6;di0m153;a0eQ;gg1ne0;aWborCcUd0X7fSgDDlo6mRog4pQvo5;aKi3or0ZQ;etNig3oCu2;eKi08MoQ;nArE;enAi4oQri0YKu3;lo3r0QX;li0nC;re,uG;aQe5i0WRpo5un2;na0sF;g0Z2quill123sQ;anCco14Xfl0XBiRrice0YDuQ;ma0sta0R9;ge0re,st0T4;a0GSba13DeQisMon2u2;sQtN;co5ta0;fi6igDo3uB;an4c1ol5;al5e0oc6;c6g158l02DnUrRsQtJ;a0c02Fsi0;cRea0mOna0re8tQ;o10Eu3;e0h1;al7ch1deWFe8fa0;fa0mSnRp7raL3tQ;il5o5u13X;ge0te8;o0VDpa0VD;cn0Cd0Ble04m01n00oZrTsQ;aRse0tiQ;fi6mon1;re,ur7;eb3gUmRrQzi01A;emo2iIor7;i4oQ;re0XPsQ;alCt0N0;e0iv0WL;log119r7;cHde0eWOo0ZWta0zo4;at7e0pQ;eQor0Z4ra0;ra0s2;coUdQXgQWmTrRtrasQ;m0P5p12U;adiotrQRiQ;ce0XCsST;at7et3;mQntr0UL;anCuLB;esch0YVia0;ic7ol0YR;bZcXgWleVmbuUn0BDppTrRsQut0D8;s14Ot0U6;a0da0if167ma0pa0s1tQ;a169u166;a0e2;r0U2sF;b11Vn2;ga0li0U0;cQi2;a0he8;ac6u7;a9Xb92c74d6Xe6Hf60g5Ni5Dkat0QPl59m4Xn4So2Tp1Oqu1Kr1It0Nu02vQ;aZeViRolQuo2;a12Kge0ta0;a0co5gSlRnQo0RSs0COt0TN;a0co5;la0U8upG;na0oK;cMgl1l0UQnRrQsLz9;gi4n05Q;a0de0i0tQ;a0IKra0;ga0lQmDZnta8pa0r1sa0;ig1u2;aAb04c02d01ff00gBPiciCme0n0BVo0AJpVrTsQ;ci2sQ;eg0VEiQur3;d1sN;fa0ge5rQ;aRYisRUoB;erRpQ;li0ZMor0XDu3;aRraRVvQ;a0UIisH;re,vv0RF;onAraBuUU;a0diviA;a0cQ;eAh1i0PQ;aUb1conceAde02Ce0KUi0lSoQurb10Y;do3rQ;di4na0;iQo6;ce0OWma0;f0LWpp0VU;a0Ce09i05o03rSuQ;c6d1fa0pQta0z0T2;i0ra0;aUeBiToRuQ;gDmeVEsc1ttu0K2;fi4loBmbo4nQz9;ca0za0;de0g11Pmp12TnDsc1to5z9;bUcc1loCnTpRriGsci0RNt10EvQ;in12FolD;aQiom11Npa0;r5z9;go5ia0;e0il1uz9;c6pGrQz9;ce0di0ic7na0p1;gm11SlSm0PHngRpQra0va0z0ZR;a0end1u5;e0ue0;a0et2iz9la0;cco4l5m0C9nRrQ;iAXmi4pa0ra0;de0og0RVta0;bWcc10Gf14DgVl5mGnUpGrStRzQ;io4z13Z;al7iz9ui0;e,nQ;az9ut143;a0ca0dard7ga0;gi0l1na0;b1iAOu5;aQug0V8;di6gH;aRiQ;l0C5nt11I;d3gl1liIma0rQsF;c1ta0;a0Le09i01l11VoWrRuQ;l0FMm0RWnt12Ep08KrBtacM;aTeRigHoQuz9;f0V2loqu1na0posi2vin0N3;ca0gQme0z9;iQOna0;nBz9;d0Q8et7gl1lRns0PIrQs0Y9;ca0ge0zH;et2iRtrQvUV;i0o10O;a0t0WL;aWcUeTgo5llaSnDom10KrQuEz0RQ;aQi0M0;l7nt7re;cc0Z8re;ga0t3;cQi4;a0io5;cVTgg1n0XXre,z9;cZdYlXnWrUtQz9;ra0tQ;aQi4;cQre;ol0Y7;a0gQs0JA;e0iu3;de0na0zo5;aZBla0;anLi0;ch1iQo5u5;al7fi6;cc0Z6dXg05Cia0lVmEnUrTsFto5ur12XvOzQ;iQz0NZ;a0SUeQ;gg1nL;a06Ie12Hge0i0FVla0ti0;c1de0ta4;aQca0l0QV;n6re;el5ro0RA;b1Mc1Jd1Iff1Ggg1Fl1Bm18n17p0Nr0Js0Ett04vQ;erMi0VTrSvQ;eQolD;n0JGrL;aQeXi083;bb0TVcYdXeWffVi0Ul0HQmodu5ppoUrisP3sQut0MW;cStQ;aQer9iE;mGre;or0LWri0TI;po5r0;a0ZDol5;c0DQsp0V4;imeP2oF;aWca0AS;eXiWoQr0S2;al0HFcaUesp0V0f0JBl0EAm0L2pSraOWsQti10Mut0MLva0RK;c0MPtQvilYF;a0er9iE;aQor0;ga0sF;pitJ;l7nt104;nQr3;de0t3;pStQ;an0HEenQit0RZ;e0ta0;eQi0JX;nAt2;bi0ge0mSHpSrRse8t0PQvQ;e122o5;egDiA;asFr0ZT;i0p08rQ;aSeQi078;ccQdiIle119;eAi2;bb03cc01ddo2e00ggYiXliWnno0R8ppVrri117sTtt0OGvQ;an9in0ZFvQ;a0QWe0YPiQ;n0ZDve0;sQtamG;a0Z9eg4;aBr0ZI;mOn0MC;nn0O0;iuQra10Y;di6nD;c0CPdiIle10W;a09SoQres0Z4;m098r0KQ;e0SBonC;eKor2ri0K2;da0et2necMor7;at7e8i11EmQ;a0eQi0QL;rDtN;ar7ca0eSfRlQub0LFve0;az9e87uc0WV;e8i2;c7gg1nn7re;ettiv0VQh0DOi85o5;erEia0oQriFE;ca0l0YQ;a0om7;cQiJ;hEUoQ;mbe0r0K9;bQil5ran9;al9ol109;aTiSoQ;bQcc0EUda0;ba0i07G;da0f10S;tu3zi0GR;aWeViToRuQ;nDt0XQ;bili0V5c0KKnQri0t2;ca0e2ta0;l0EWnuz9sQt7;ce5ta0;nLtN;cMgTlt10DnSrRsc0W7tQz9;e0F2to4;gi0N5r10Bt0YH;ia0t0YG;n0TFri0;aSeBiRogBuQ;ma6nB;ng0XHt2;bb3cc1nc1v7;bi5eGgXlVmUnRrinBstemaZ9tQ;i0ua0;cr0O2daca0Q1gRi0U2on0SVtQ;et7on7;hi00Tol0V2;bE3me04Mp0XDu5;ic7lQ;a0X0og7;il5nQ;iIo0TB;aZe5hiaYiul043oVrSuQ;aQinza102sc1;r0WXz9;aRiCoQ;mEppo4sF;di0ff1mma0WPn0U7pp0KSsF;b0WRcc0DUmQnf1rBz9;b0WDen2iQ;na0ta0;cc1ia0;bb1gliYXmb0XWnRrQsa0tta0DQ;bu0ZSg1;c1na0;a03e02iYoVrRuQ;gXVma0na0;ang04VeRi0QKuQ;cul1t2;cc1dCgQna0;a0Z4ia0;c1g0WDlRnd0KErQtN;a0YYbYCna0za0;go0SPla0ti0;bSdRgu3la0Z0ni0oQ;ci4nCr0Z7;a0uc1;b1ra0;de3mmin0XAr9;ccRld0XPma0rQs0LV;f09Yi4;enChi4;c03d02g00lZmWnUpSrRss0GJtQzH;a0XVo0L2to0DP;ba0e4iJmo0NJpeOHra0vi0;a3pQ;el0YFia0;il7sQti0;ib0J7or7uJ;b3iRpQ;it0WEliI;cH0na0;c1ezH;a0nQreBui0QU;aJZo0S4;a0e07Gur0;a0ca0er0R3oQ;l0TNnC;eViUoTrQ;aRuQ;cc0COma0;ia0mm0VV;ga4n0J6ra0tt04A;pGOre;g4maniJ;a13e10h0Ri0KlerU9oWrSuQ;ffi4lQo1r0YCsa0;a0X7ta0;atcQIeSiRo0PLuQ;po0MTta0;sti0U6t0W0ve0;de0ma0z1;c0Cd0WCglHl0Am06nVor0ETpUrRsc0W8tQvo5;i6om7ta0;a8c1da0e8ge0nX6o4rRtQza0;a0e0WZ;e0ib0V9;a0UVerMi02Tpi0WZri0;cYfWgUn0GUos0VUqu0KUsTtSvQ;e0V4oQ;ca0lD;en2ra0ur0V0;enLi0Y5o5;eQiu0FW;g4la0;esFiQor2;gDna0;aQia0orC;re,te4;bSm0GJpQuCU;aQenFi0XXle2or0;g4ri0;ac1i4usIF;arXElQma0p0XL;a0eB;c0TSuzWG;aUmmiTnSoRpQuGvo5;a0iPpa0;c6g0VNli4pe3;de0t07N;e8ot2;cq0UOlQma0re;ba0la0;eViQ;aRdHeQfa0oc6uAva0z9;na0r0T9;cc1ff0LCm020n2ri0vQ;aQiz9;cc1rC;da0gg1m0UJrQ;mQni0za0;i0og0KQ;g0V9lSEma0nRrQve3;ne0pa0;de0e8t3;cc1de0JQffa5g08l06m05n02pXrTtSvaQzzL7;lQre;ca0la0;ena0VSuK;avOi0LBmi0X4og4pi4rSse8tQ;aQel5o0VQ;b0UZre,v0IC;el5io5oz9;aTeSiRo5pQ;a0ell0T6;gl1ta0;st3z9;ccHre;a0WVc0USdQn0B8sa0t79;aQi0;gl1l7;b1pa0uf0WP;a0c1da0f0WIpQtKza0;a0eFRi2;io4li0W9;a08e07i02lMIoYrSuQ;c0J6d0UKgi0JQllZ4rQz9;o0JBra0;aTec6iRoQ;d0HEn6;ga0llucOTnQ;a0d0UF;cc0UKi2ma0nQ;a0c0S7d0UD;bi4ccSlRrQtt0VZzz0H9;d0URn1ra0sa0;g1l0GY;a0i0H6;aTeSlRrQsc1t2zzZ1;bo4c1iPP;a0JPen6;ca0l5n4;di0ncYZ;f0W3r2;cc00dZfa0gl1iYlWmbag1nTrRttQu5va08Y;a0W4e0SP;aQba0SOd0UGra0;gl1z9;cRdQ;a0ie3;aH1h0U2;dQe0PPlJXorPu0W1z0UB;an0R1or1;af0VTon0TZ;acMi08O;a4el5h0TX;bo2c00et2gZlUnTpRrchi0U6tQz1;e0HRir0O9ol5u3;e0oQ;niIr0VH;a0ci0guiL9it7tiI;aSda0iRm0MZpa0t0U1u2vaQ;gu0IQre;fi6n7re,va0;mQre;elec6o1;g1oE;c01NrQ;aQiI;l7mOre;aEBeD8i06oUuQ;ba0UTffia0JQgSmRo2rJsQt2zz0G8;c0TApa0sa0;i4o0OJ;gi0na0uE;bo00dZga0mXnWra0sVtTvQ;eRiQ;na0s2;n2sc1;oQtaE;la0n0II;icN2o5se8;c0FXfa0za0;anQba0pe0;iz9ti0MKz0IW;a0e0ia0;ra0t7;aATbAKc8Yd8Ee7Xf7Eg70l6Pm5Hn3Jo3Ep2Mq47r2Ls0Ut06u03vSzQ;apGoQza0;l5p0M6;aXeUiSoQuo2;ga0lQmi2ta0;a0ge0t0FNuzHve0;b3n0SDra0si2tJvQ;e0iI;la0nRrQsLt2;be3i0nTIsa0;d02Ki0ti5;c0QTgRlQnBr6;e8i6or7u2;he8l1;brRdi0mBEnQr0QFs0O4t0EO;ge0i0;ia6;a0Ae06i0C9ma0o03rSuQ;al7f0UDo4rQ;a0ba0;aTeSiRoQ;n6va0;nc08Pta0;ma0piC;dVnqu049pi0JFr0sRt2vQ;aFerF;cSfRgQm0CT;reP;eKorE;i4ri0KZ;i0ur0;c6mX2na0rRsQ;a0si0;ce0mOna0tu3;lSmQn0BBsse0;e0pQ;es2ra0;efo4;gliRppQrRNs0QW;a0ez9;a0e8uz9;a1Db1Bc11druEFe0Xf0Wg0Ui0So0Kp0Bqu09sa0tWuTvQ;eQia0;gl1nQ;i0to5;gQl2o4pp0MKssUI;geQ;l5ri0;aZeYiWoVrRuQ;c6pi0z0HL;aSiRoQut0R3;fi4pi0S6;nDto5z9;mY0pG;pGr0PW;lQma0ra0;iz9la0;cc0RJm013nA;biRcc0PCg4mGpGrQ;e,nuL;li0PV;aQil5;d3sF;aWeUiTl0R0oSrQ;anBe0BSoQ;f0K8na0;gl1lve3nAr6sa0;a4cc1eBffe3go5nD;cMdi0g0LArQt2;a0imOpe3;cc0P0lErQvOz9;ge0pa0SZ;ciJff1ggiWlUmmTpi0rSspRttQvveH8;er3om0BI;enAi0AO;bi0ge0p0FG;a0i0I2;ca0leQve0;ci2ti6va0;oBunD;eAgQsteE;il5niI;oQriCu0OL;cc06Kmb0P4rB;av02Lor9;c0G6gSl05SmRnLp02Oq02NrQ;ra0v0SB;b3i4;a0na0ui2;aYeg0QFhiViUoQri0JBuK;lSmu7CnRpQ;p1ri0;gGWtZSv0EF;a0pi0;acq0PEnt02Bog0QA;aQz9;cc1rQ;a0e,i0;gl1lCpGri6t2;aQu6;di0S6gl1;ccYAlRnQpe0r0LPz1;a0guB6;a0da0i0ta0u2va0;alleg3om085;a0Ce06i04la03o00rRuQ;bb0KVd1g4llu5n2rB;aXeViUoQ;c0BLd0HAfSgRnu0FEp0KHsZOt0EBvQ;a0o6;et2r0KZ;a4onCuE;nDRs0N3v0OZ;cipi2di6ga0mX0nApa3sQt0PM;en2ta0;n9ti6;l0MJnde3pRrQsa0;ge0re,ta0;o5pa0;ca0sE;aQcch0G4eBg1t0P5z0FM;l5niIstr0PI;c6ggLFnUrSsRtQz9;e0ti4;a0ca0ta0;ceQdo4p0CRsegui2;pi0;et3sa0;ciIga0lpGXrRsQtLZ;ce0sa0;aRe8tQ;i0oK;meVOre;bbliBccuI5ffTno3pSrRss0B4ttQ;a0im7u3;di0PZg0MWiO;e3p0JPta0;enAus6;a1Lc11d0Ye0Wf0Qg0Hn0Fo0Eq0Ds09t00uYvSzQ;aSOuQ;cc0MNpG;aUeSiRoQ;gl1lt0BU;a0goKlMYpeKsMta0;le0NUrQ;di0mi0NTnPQti0;nBsa0;mQnc1tK;e3iP;aXeUiToRrQ;e0PFisLo4;m0NLna6pGrQs01B;bid0QHpiP;eNEmiPnD;g3la1nRrrQ;a0oB;de0eK;s0E6vo5;aSeRoz9uQ;dPCpNV;g4lO4ri0;bb1c6lCng015po4;uad3;biWZma0rmJtiI;aQeBo0PQ;ff1l9mo3;aXeWhiOQiUoSrQ;aQosFul0PL;nPsFviC;ia0lQrBz9;fa0la0;al0PHoQ;i0O3va0N2;mEnti0PF;bb1gg1lluz0L8rOM;aUervo3iToRraQur1;dOVn6;ca0rQs0CO;ma0na0;amEeKlP4ngP3o3;g0M5ma0nBrP8;gQt2vi6;a0oz1;ebi2ir7oRuQ;g1ri0;l0JDsF;a01e00hiYiXoUrRuQ;l0DCo3pi0r0P3;eRoQudPI;c1s2;s05Cti0MK;c6gl0SlRmi0D3nt3rQ;a8da0nOFo4po3;lPMpa0;amGprig0MGuc0NQ;na0oQuA;ccio0OSda0;nt3pGr0LO;lWnVppUrSsRtQva0;e4tPS;a0sa0t3;a0ce3og0M9tQ;a0o0NZ;a0u0NY;a5ta0;c8BoK;cMKr3sQviB;ce0pK;a0Sb0He0Ei0Cm0Ao06pSuQ;ggQni0ra0ta0;h1i0;a00eZiUoSrQutriP;atQDescQCigHoQ;n2ve3;lQrpo3veK;pa0tQF;aTccReto02AgKnQom0LSuE;g0LZza0;iQo0O6;ni0o0O5;ga0lQLstr0IHt2z9;c0DBlli0NGn4t3;c1UgQYlRnQr09Dst0IFuKz0JW;a0ta4;la0ma0;dSlRn07UrQst3ti0O1z9;ch1de0i0mo3si6;es2t02S;e3u5;elen01XinchQ;io0LG;glIEl02Qra0sQ;ch1u3;diZ7gg1mRna0ri2sQtN;cDLta0;b3o3;aYellR9iXoWrSuQ;ca0sQ;so5ta0;aSiRo0OBuQ;na0tL;c0HZgl1;cc1n6t2;c6m0L1rFsc0MDt2;an6onP;c0CKlQmYXrbaKsL;dR5la0za0;cTnSpGrRsQ;c0JNti6;ch1gi4i2;da0eDAg1;cHZi4;aWeUiToSuQ;cG7sQ;inBt3;cJda0rC;be3ma0tiB;c6gQsFva0;a0ge0;cSmRnc1sQ;c1sa0tVZ;b0Uen2pe8;e3riE;a01eZherRWiXoWrTuQ;aRiQs2;da0z9;d0LFrQZs2;aRiConCuQ;fo5g0KE;cMff1t2;cc01Dnf1;o6ra0uQ;lREnDra0;me0ne3rmQt2;i4o0NC;lQre,s062;le8opG;a05e03iYlXoUrRuQ;gLEl005ma0sRY;eRigDuQ;ga0l5s2tt03F;dCga0quO;cX3de3gg1lgo3mOndVWrQtog0AI;aCDbi0es2g1mQni0tiI;a1Iu5;ag0KYetNui0;aTc6gSlRn9UoQrEsMu2;c6ri0;a0t3;l1u3;mme8ta0;c0DYnArQsT2;i0m07Fra0ve0;bbV2lRsc1vQ;el5oK;c1l0MI;c05d04l03m02n01pi0CXqui00rDsTtiSvQ;aQo6;c0JQngTGpo3;ch0KQ;aVcl04UeUil1oTpSsRtQuE;as1enAiTPr0C5;ic6;anAlo3or0EFropr1ug4;ne3r2;g0C9rXM;cU8l2mi4;lUFpa8;f1t3;anUNenCig3pi0;abo3egD;iIu6;ci2he8;a08da0e05iUoRr7uQ;bi2ce0r0;mRrQta0;a0mi0;aVHi4;cZfYgi2leg0J6mXp44re,sRvQ;amGen0JCo3;cSeg4pu2tQ;ac6enAil5og0JZrQ;ib0BSugD;er0E7hRiQor057;og0JWp07S;iuA;e8Ein0BOo0FN;enAf01Z;ol0EB;co3fi0IPno0B6p0ECre,sRtQ;er0B5ta0;c060i4ta0;n0A2re;a11e0Yhi0Wi0Tlas04GoUrRuQ;ci0KGr0L0sa0;eRiQol5;sta07Lti6;a0de0pa0s0J6;diIg0JIl0Lm0FnUpTrRstQva0;it0BBr01D;da0i6o4reQ;gDre;ia0ri0;c07d05f01gZi032os0J0qu030sWtSvQ;aliCe9Oin0IZoQ;ca0gl1;aSor4rQ;aQol5;dPr0t2;re,t2;ac3eRiQol02Pul2;de3gl1;g4nL;eQiW6reB;da0g4la0;eSiQl0AVo02ZrBHu2;c6da0gQna0s6;ge0u3;rEsFzH;an4enFiQur0;re,zH;eRiQor045;a0l1ma0;nt3pi0;bUi08Am03FpRuQ;ni6;aRe03Li0GNor0rQu2;a0o03B;gi4t2;atNi4;a0lRma0oQti0K0;n7ri0;eBo6;ar5nDonRrcoQta0;la0nC;ca0do5;aQeAna0;c05Fma0;de0l02TnRrQt2ve0;c05Kne0;a0su3;cc1de0lWmVnUpitTrSsRtQva05V;eg05Zt09A;sa0tiB;da0i6;a09Zo5;al7c0I5diCta0;a0b1mi4;a0cQib3p06Ju06Iza0;a0iQo5;fi6t3;aVeTol0JDrRuQ;ca0r5s06Pt2;aEon0I6uQ;c1ni0;c6l5neQre;di0fi6;c1di0g4lRnPrQs0FGt07Y;at2bi6;de8e4la0ta0za0;b1Ic19d14ff0Zg0Vl0Qm0Ln0Fp08r06sZttWuVvvRzzQ;an4ec6;al5eSiQolD;a0ci4li0nQs0E5t05W;ce0gh1;le4n2rLz9;gu3mO;ac6eRiQor0H8r097;nDva0z9;nAr3;cVf0AAp0HNsQ;aTeSi2OoQu025;c1gg0HLlQpi0rUAt09U;da0ve0;d1mb5ri0s2t2;gg1l2po3;iuBol2;de0gi4mQrang1ti036;a0on7;pQri0;aTenAiSl0B7o8rQunt0HN;esFoQ;da0pr1s0B0va0;a4cc0EYgH;c1l2rQs0BA;ecMi0;iEnQ;aTeSoRuQ;nc1vo5;da0ia0;bb1tN;cq0G1ff1sG;a0i6mQ;aSetNi3oQucM;bQd0G9gl1l0I6ni0r0FQ;il1;la0n0GXt0ED;imOlQte3za0;aSeRin03GoQunB;ca0gg1;n2t2;cc1rBt2;gQi2;a063iRra0HZuQ;an2erK;o0DZus2;a0H7eTiSoRrQ;at0GGet2on2;gl1l5nC;bb1da0la0t2;r0GHzH;ag1dRoQ;mb3pe3r4t2;eRoQ;lo3rmOsF;n2st3;cRquQut7;art038is0FI;aVeThi0GHiuf0I5lSoQre0FSuF;c6l5m0G1pp1rQs2z9;c1da0;aEima2;nQr2t2;de0na0t3;l0GVmGpar3sa0t2;bRiQ;li2t0H2;aRel0H9oQra0GM;c6na0t0DH;ia0ndo4sFtN;al7bb1c0Nd0Lf0Kg0Hi07l06m04nAp01qu1sUtRum0F1vQ;isHo6;enLi01NrQtiI;ar0ib07LoQ;aFYceAda2g057v0FL;c5JeViUpTtQusSW;aRit07IrQ;inD;re,u3;iZFoXU;na0sN;ca0t2;eRli6or0ri006uQ;g4ta0;l07Gr0ER;a0e8iQuW1;ga0xa0;a4QeBinqYJ;mWnQte3;cTdSf0FGga8iziJn03Qolt3sQtrod06Pv06R;eQtaEQ;d1ri0;ir7uVQ;arQoWU;ce3i6na0;b1HpQ;a3iQor2riZS;an2eB;a0CZge0iRna0olaQreP;mOrGN;ma0onJst3;eUEr3Fu2;aQde0iT2up09V;ma0re;aTeSiRlQuOO;am0BGi4uA;de0nDr00Pta0;de0nU7pi0;pit01Ore;bb1Hc19d0Xff0Tg0Mll0Km0En0Bp01sTtRvviQzioAB;ci4lCRsa0va0;e7iItQ;acc0GAiz9rYB;a0ch1ie3pWsStreQ;llQ;a0i4;al2eSiRoQ;da0mi0GLt06X;cu3;g4mb3re4s2;a0et2ol5;a02Gi0F9pQ;aXiUrQun2;eRoQ;pr1s086;nAsQ;an2en2sa0;a4ccQgl1;a0iQo0FK;ca0ni0o0FJ;ciIllot0ED;ciPdRnQto5;icMobi0FGuvo5;e8om7;az9e8iImSpQ;i02VoQ;l5na0;aOAeRoQ;d0DDl0FArPO;mo3nZ4schi0CV;aQen2ig4;cc1rB;gQio4l1na0;iTlu0B4o0B2rQu02Y;a0F6iRoQupG;t2vi0FT;cc1nz0FJ;a0ra0uQ;n0B3s2;a0ECerEiSor9rQ;at0DLeQ;dCna0t2;gu3la0na0tL;d00e0iQu4;a0caYoQ;aWcom0CHdVgUlocJmTtQ;eleRrQ;asmY2;fo4g02U;ar6;ra0FBuiC;iffVH;ssisNtUJ;l07Sre;ol08Ur7;cRem7imo5quQ;e2is2;eUhiSiab0EDoQ;c6g0D4m0C4nQpp1rc1s2z9;so5;oQuA;ccT0;nAr2;o0BXriAGuQ;f0EXia0;aRiQot09I;eta01GntesseYP;drQliIntiNGsF;a0et2ie02Eup07R;a3Pe2Yi2Hl2Eo22rZsicYuQ;bblic09DgnaWlVnSpazz0CXrRsRBtQz9;i0ri0ta035;ga0iI;g3Wi0tRzQ;ecMo4;a0e8uJ;i0lu5sa0;la0re;anJhiaJ0ol070;a1Re0Ji0GoRuQ;de0e8;c0Bd0Ae094f08gr07i06l05m04n03p00roBEsVtSvQ;a0enQinXMo6;i0za02S;eRoc02LrQ;ar0uA;gDnAs2;a0cTegSpeRtQ;er4it044;ra0t2;g1ui0;iuBri053;aReQi4or0ug4;l045nA;gaNIla0;os0AWu01L;etNozHulB;et08WiIunB;bi0et2;amEeP;a4eQi5ondMS;ri0ssiTWt06G;e8ur0;eRlaErQu3;as095ea0;de0ss2M;l5me8nRvQ;aCPileg1;cip1;a0Vc0Qd0Nf0Jg0HiJ1l0Gm0Cn0Bo0Ap07r01sUtSvQz9;a03OenQ;de0i0ti0D1;eQr0CU;nArmW8s2;aVcUeSsa0taRuQ;me0pp064;bi0CUmGre;gna5lQQnQr0CV;t0D9z1;eg0BFri04B;gi0pe0;aUeRisQ;calC;frRgQ;i073o5;ige3;ffredC;a3eRigmOoQ;r0te0;nsH;ccuGrTK;as0AQde0o2;eSoRuQ;ni0ra0;ni0ri0;di2re,sWUtN;e0CCi09U;a0iQus2;a0uWY;aSeKiQorE;gDnQoKsF;aWMi0;bbL3zH;a0eRiQo026;ca0geKliDre,sp05B;fi09Ns080ter024;ariTeAiSluAoQ;gnWEmpi5nQrVXstit02H;fPViz9os0A9;de0pi2;ca0z9;ccXXl9OnnuWCvvQ;erLiF;li4n9ti6;et00gg1lYmLOnXpWrUsRtQ;aVDe6X;a0iRp04ZtQ;a0da2e8sincr006u5;tVWzH;fir7ge0pore,re,tQzH;a0enA;ol6Ppa0;de3za0;ar7em7iPYtrQvY7;i0o00K;e8ic7;aQurJ;cRUg1na0sQti4;ma0ti00B;a03cc00eBgZlYmOn00FoWpHJrTsRtQz003;ago059oc6ta0;c1o5pQ;i0C0o5;aI6oQ;et2scQ;inA;mbaQta0;g0BYre;o2uc6;ia0l1no004;a0hQ;et2iQ;a0ot2;ceRg05Xll0AEnQti0z6E;a0e8ge0iIt0B8;re,voZY;c6d0Egg5Hla0n0CptZDrUsTtQz9;rarcHQtQ;egQi4;olZE;a0ca0s06Bta0;ag3c04d03e02f00gZiYlu058mXn07Oo3pVsTtSvQ;aAeQ;ni0rL;e03Mr0AKur088;cru2egui039isNonQuaA;al7e8iI;etQliTX;ra0ua0;a03HetNisMu2;co5fraFod7re;iu3;ezHorQ;a0ma0;g4Nn4;e0o4urET;eRoQ;la0rU9;nTBpi0;a00Pd04nelZAsQzo5;a0io4;aQe0onJ;g03AlYRnH3;cR4d0Kg0IiPl0Dn0BpGr01sXtUupu5vSzQ;iOzQ;e8ia0;eQimO;n2sa0;en2ro06WtQ;e8i4uQ;gl1i0;cSq07PsRtQ;e8or7;a0e8i0;e0o5;aVcUeTgoYUkWHlaSod1tQziJ;eciGiQoK;colar02Yre;mOre;gg1re;eWDhe8;cadu2fSgRlQmeERn6re;iz9lH4;o4ra0A8;fi4raF;nY4oraQ;mi6;aTeSiRle8pQ;a0e8i2;fi6na0;l5sa0;re,tJ;aQi4;n02Ire;el5i0rQ;e8oYB;b0Wcc0Td0Sff0Rggett0Ql0Om0Mn0Kp0Hr08sYttUvRzQ;iXSon7;aRerclQv1;oc6;l7ri4Qt2;an7eneSimRob3r1uQ;nAra0;aZHiz9;b3re;a0cYpXsUtQ;aSeRrQ;ac7ui0;gg1n2;co5re;eRiQ;da0ge4tXA;qu1r08UssH;edJi2;il5u5;aXbi2che036di087eWgaViSla0mXAna0p07CrQtogPCza0;a0iQ;pi5re;eRgBIna0zzQ;on2;ntaZ0;n7sE;cMz9;coXIre;aRe3i4pQsWXta0zH;i023or0riRRug4;c03Nl7;dQo3;a0e8u5;b028etNoQ;gene7loB;ez9iCPogWDtrQ;a8epVJ;iv03GuJ;enAic1ri0us6;ia0or03E;asHhie8ideRluAorS2uQ;l2pa0;ntJre;bJ5iQli055nubi5;e047urB;a01eXiUoSuQ;cMJmQo2tK;er036;biF6de8le8mi24rmaYCta0veQ;llWGra0;cRdiInQtroF;fe8na0;ch1he5;bul7cr44gSol00VrRt2uQvr44;trJ;ba0e8;liDoz1re8;pGrVsTtRuQviBziMD;fraBsT0;a0urQ;al00R;al7cQt3;e0onA;c3UraQ;re,tRO;a17e0Vi0GoXuQ;da0f01Fg6AlUmmiInSra0seJtQ;a0iQua0;la0z9;e3ge0iQ;cipJre,zH;i4tQ;a0iplexa0;bS1c07d04l02nYrTsStQz9;i078oQte8;mecc03Kr7;chet03DtrVP;al00AdTf02Gi0mo3pSsQ;e8icQ;a0ch1;ha0;e0icM;ca0dSetRoQta0uQM;cr04RloBpQZsilla04HttonB;ar76iz9;aBOiJ;a0eQlVFtLP;s2t2;eQiIu5;ll020rQ;a0n7;ci6;aYAcro02eNg01lZmXnVrESsStQxa0;iQra07D;c7ga0z9;cRsa0tQu3;icDFu3;e5h1reA;a06RchHerJge0iQui0;atKTm7;a0eQ;ogUJt7;it1IlQ;an2imSD;l0Xra0;filQminiatKNn7;ma0t3;a0cc02Od1lKFm00nYrVsTtQ;aQod7te0;fQll7n7st042;iHGorZD;cQsa8t02M;e0ia0o5;cRge0iQl04W;a0diMPgg1ta0;anCYiI;a0di6oEtQzH;i0o061;or017;c0Kdr0JestraUYg0Gl0EmmoUYn07r00sUtQ;eSriRtQu3;a0e8o4;co5gUW;m03OriJ;cUsRtQ;er7i6ur03B;aRiQ;fi6m7;c3gg1;he3ol010;cA1e8gTiSmorYTocRtQze8;elS5ir7;chi4;n00Sta0;aRiQ;naVX;ri4;ca0dVe8gTiSoRteYDuQ;al7ca0teYC;mOOscQCv3;ca0fSF;an04EiQ;a0ucM;a0ri4u6;ePgiuPYig4me4tQ;a0r053;gRnQ;a0et7iI;io3;e8igaU4;ad14cSeRiQ;na0ul5;l5ra0;hi025;a0Ce05iXoUuQ;c3mSppOZsQ;inBsQtrTH;a0uYS;e8i4;botEEcRda0gQrCtt002;ga0o3;aV7uple2;bBQceWevi2f2gniImVnTofPKrYAsRtQv03Dz9;iBogST;ciQta0;a0v1;c1eQgue8iz9ka0;ar4V;a0i2o4;nz1re;c6de0gUmm02DnTsRtaEvQ;a0iB;iQsa0;na0o4;i0te8;aUTge0iQna0;fe3ttimZL;b03c02droTDic7m01n00pZrWsVtTuSvRzQ;ze8;a0o3;da0rPM;iQra0tSS;nXDta0;c1tD4;gRingQ;ectDO;he8i0;iCpa0;cT8gUIiz9;a0biLNen2i4pSK;ca0e3riE;bXUiJ;le3;b01Yd7Sg7Qll7Om5Kn09on7p05rYsStQ;aliQe3;anX0;cORlUomQGpSsa0tQ;iQor1rU9u16;ga0tuKC;eQi3;sHQzH;am7;iCon7rQ;aUeTiSoRuQ;viP;busLga0mKCra0;de0gXMta0;ggJ5ti0;d1gg1;ertrU8nSoQ;st019tQ;e6iz9;ot7;a4Tc3Od3Eeb3Df2Lg22i21n1Xo1Vqu1Ts1Bt0Bu0AvUzQ;a5LepGoSuQ;ccQpG;a0he3;l03Ut58;a03eWiToQ;ca0gl1lQ;gQta0;aKe0;a0d1gliacc01YlRpeKscQta0;h1iP;upG;cMgVi0lUnSrRstiQ;ga0re;di0ti0;i0tarQ;e,ia0;a0e00G;g1l1;de0lQsa0;e0iC;miPtNK;a0Ne05i02oYrRuQ;b01Hi0miPrgiP;aTe020iSoRuQ;de0fo5;dSNi2mLWnXU;ca0de0pGsL;lRpQre,s010tSG;po5r011;aZ4c1l7Q;m000nSrQsDQ;bQpiP;a0id02V;a6ti0;eRmQnDrizY6to5;a0iPoK;piP;g3l05n03rQs2;cZdi0fa01LiOLlYmLJnaXpUrSsRvQ;eZTis2;caK1e6;a0oQ;ga0mIX;eRoQre2unD;la0r0;l5nO1;l7ziIN;a01CoqSH;aJTeAiAluAoQ;lQrLV;leB;de0eQsiIta0;b3ri0;aQletKU;ia0re;bWHc6gl1rQsQ2vo5;la0s1;a04c03eZiYoVpUtSuQ;d17ff5g4l2pQss37;erD5;aQil5raC;l5u3;esFMi3;l000nRrQspetLz9;di0ge0;no01Hor7;d1gZ2la0nZ8sN;cc00Bd1gSlRrQva0;i0pZV;vat3E;a0na0ui0;a006e4riSV;bb1ccMPlRpoQ;na0ri0;a0da0;ad3iQ;e2na0;cu5d1lt3nCrQ;gog014pZRriP;aCKeSoQ;cQva0;en2u7;rvoF2s6va0;bi0et2mi6ziaRF;a05e03hi02i00lZoXrSuQ;aQbb1rgi2;iY2ldrZVn2;aSiRoQug4;mEpGsF;gi0;ci00SnQsFtiLBz2Q;a0di0;bC8fURloESmQrBz9;b3ma0;es7oY8;al00NgTFoiZAuQ;l5CnDr1;a1otLrlY9;gnN8loEMmEnQri0sF;e3ti00J;bb1gRn4rQ;bu017;g1li0A;a0Ee0Ci05l02oZrRuQ;o6r1;aSeddo00DoQ;l00CnQ;zo5;dTmmSnQs6;cQge0;eFioF;etNisM;ic1;iXPlLnArQsF;ca0maQna0;re,t7;aRetNigDuQ;en9i0;cciPzH;aVgDlUnSoQrEsZYtL;cQra0;cLChi0;gQocM;arP;a0za0;ccYPlZ8mEs6;bb3ltKrQs2uC;i0oU1vo3;gWNma0nRrQstiPtXI;ci0i4;at1Pga0;eLr1;aBeXiUoTraSuQ;g1lDrQstES;a0i0re;ca0ga0;lTSra0sFvi4;cUQetTEg4rRspQviduaPXz1;etLor0;e,iz9;bQman1nn7;i2oZD;a0De09hi06i05l04oXrSuQ;ba0lNMnKPrQte0;ioDCva0;avZ5eTiSoc1uQ;dQs6;eZ7i0;mi4na0;mOsFJtiWR;c6lUmTnSrQ;a8da0nQo4po3re0;a0ic1;ca0t3;be0iN6oC;lQon4;a0eK;i4uA;amGde0e5nDonK3pr1sMta0ucXSviYW;aReAna0oQuA;da0st3;ppXMvMM;de0llKWnRpGrQt2;nKGot2;d4NeKsa0tQ;iYRra0;daveKgl1l05m04n02pZrUsStQviZE;e4raEtQ;ivi0;el5i4sa0tQ;el5o4;i6na0ogW5rTtQ;aRoQ;cc1na0;pecoKre;oz9;arRpQrX7su5;ot2uXQ;bi0e;a5cQna0ta0uL;heKreVW;e3ic1mi4;ci4li0oKza0;b7TcVlUmiCnWUrTsSuRzzQ;ur3;gu3;iVQpKta0;ca0gOiP;a0bD5vJG;er9JiPuL;b15i2m0YpQ;a0Le0Hi07l06o01rTuQ;g4nLtRzzQ;i0olWE;a0riP;atWeSiRoQ;n2scUvviF;gHme0;ca0g4nAsRzQ;ioBT;cQsHta0;iutL;icWK;lSma2pGrQssibi4XveK;po3re,tQ;a0u4;li4pa0tQve3;roV5;emOi6o3;aXccWdocMeUgTlRngQomV1uE;e0ua0;a0laQ;ccTP;l1ri0;ga0tQ;oBDrXS;a0ioXAoXA;ga0lQn2st3t2;laWL;cMFdSgo5la0nRpa0rQs2t3;a0la0meE4so4vNQ;naXAsieK;anLiRZ;cc00gZlWnVpUrTstRtQuKveFzzXK;ac6ta0;a0iWEoQ;cMia0;a0en2rM4ti0;ocMpi4;a0ia0na0ta4;a0ca0lQma0uC;a0iQ;di0na0;i4l1;a0hVLia0;aUeTiSoRuQ;ciPn7;bHJla0rta5;g3l5seK;deP5rDtN;gQlinR2triH5;azzi4i4;a06e03iZoXrSuQ;ca0dV6faWJllQr3s2ti0;et2o4;aTeVUiSoRuQ;nWXtL;da0gl1n6;gl1llanSD;cJMt2;c6lAErgheAEscUttQzziE;a0i9U;aRbi0et2onPzzQ;arKi0;c6ncQ;a0hi0;c6llRstiaQve0;li0re;et2i0;cVlTmSndHSrRstQvaWT;arPi0;az9baKca0i5;bo5;dQla0saE;anRS;a0uc6;eggiadKuQ;de0st3;i4YnQ;o3uC;eTolSrQ;a2oQ;ge4l7;at3e8;aM4nTTolOS;a0Ve0Nh0Ii09l07o05rUuQ;aQerPJiCs2;daRl6rQs2ta0z9;da0i0ni0;g4re;aReQiCoc6ugT4;c7mi0;dXfUnTtQvBV;iQta0;cQfi6;c1o5;de8i0;fQi2;a0iQ;a0re;a0i0uJ;cc1de0ff3nQog5rg22vTAzzoviVX;f1go5;asFisFoQ;bJriP0;gXn4oVrUuQ;bi5di6lSnR5raV7stQ;appOAiQ;fi6z1;ebSJ;a0ovaB;cGHi0st3vaQ;ne8re;an1SioJX;eSiQ;aU6gQrlSH;liotQRna0;rQtt7;mi0;lVmUneAIomeTrRsQttUZ;sa0ti0;arch7mQ;an7i4oVC;tr7;e0iI2ma0;aQiI;re,tPV;bUlSmb7rRssBGt1EvQ;az9;ba0e8ri0;lQopGvQT;a0e8ic7o4;ba0el5;a1Ce17i0Ul0Po0CrXuQ;ciVgUl7XmTnSoriusOKrRsQ;tiB;a0oO5;es2ge0zH;a0e8iB;a0gi0;la0na0;aWeViToRuQ;ga0i0st26ttB1;da0l5nQ;de8te8;endzo4gQni0voJ0zH;ge0na0;dCgQNme0na0quOsa0t2;cH7iWmmUnSpGsQtern7zH;c0Qe8tQ;aUKor4;cesN0gQtuE;e0ia0;eQisM;n2tNz9;ntS8;c01de3g00lYmOnXrVsTtQ;oQte0;coQgHQ;mpMUp1;forQsEE;a0i5;aTNg1mQniODtiIza0;aJXiE0;d2YolMK;gQlI0;orHZ;g1na0;al7he8;agTeSir2ot2uQ;iQor7ttR2;di2Ire,ta0;mmR3tN;el5ra0;a00br3Vc6dZgYlXnVoSrEsQ;cQsa0;alMBh1;cRrQ;eH0i0;ca0i4;aQge0i0land7;l7nz1;a0e8ma0osofHJt3;ge0l1;aG4el7;c6mmHGncQta0;he8;cKMdTlSmminDNnArRsQudJ;te8;i0mE2ra0tDLve0;i4Lt3;a0e8I;bZciYlXmiliO7nWrVsciUtSvQxa0;el5oQ;le8rGZ;i6tQ;or7u3;a0st7;ci0nePZ;at7tasPY;c1lSXs9F;li2;b1Du5;bra7c1Xd1Tff1Rg1Qi1Pl1Em18n14picuMAqu10r0Ws01tXuWvQ;aTiRoQ;ca0lJV;deCRnQLra0sQta0;ce3;cQ0de0ngQpo3;el7;fEJrope7;erSiQ;chQXmQ;olL7;i1Bn7;a0Fc0De0Ci0Ao08p00sZtRuQ;be3l2ma0;eUiToSrQ;aQem7inse6uA;n1r0;lIKrQ7;ng9PrG;nArQ;iQnaI9;fi6or7;erci,ic6;aWeViUlTorKCrRuQ;g4nD;iB0oQ;b3pr1;ic81o3;a0ra0;lI8ri0;nAtr1;ne3rQ;c7di0ta0;bi0ge0lQsNta0;a3ia0;c3gHWmp5Kn2rciK0;lABoQuN;gi2m1r1;cTgSlMFmi4sRuQ;di0ri0to3;pe3;e3i2;erOR;adSed7Lge0iDoRpi6ra0uQ;di0t2;de0ga0ic7m7Xt7;e0i6;al7iQ;d9ClRpaMGvQ;aHOo6;ib3;com1erg7fStRuQ;me3nc1;ra0usiasE;at7ia0;anUbTeSig3ozHpi0uQ;lQnD;a0sH;nCrDtN;ri6;a0ciG;aZeUiTlSog1uQ;cQde0i0;iCub3;en7;de0mi4;gDmeTn6ttrQva0;iRoQ;coagu5l7;fi6z9;ntLY;bo3stJY;acu5et2;emETuJ;eGEiQlGTonA;ciOg1nD;iSuQ;cQl2O;a0e0;fi6ta0;cShe8lRonQ;om7;isF;eQi2;de0pi0ttNT;a5Ye3Ei05oXrTuQ;bi2ce0eRpJKraQ;miIre;l5t2;aRe4iQ;bb5z9;ga0mmNPpQ;pe8;gWlVmTnQ5pSrRsa0tQ;a0toJO;a0miPV;a0p1;aQesN5i4;nCre;ciIlL5;a0mNG;a2WcFQesKTf2Tg2Ql2Nm2In2Hp2Fr29sWte8vQ;aUeSiRorQulB;a0z1;de0e2nKQ;nNFrQ;ge0siIti0;ga0mGri6;a1LbriBc1Ade19e16f15g13i0JleBm0Io0Ep08q3IsYtSuQv1;bQmanKLni0sa0;biP;aUenAiToSrQurMU;ar0iQugD;bFQnD;gNVrNI;l5ng70;c6nz1re;aYeUiSoRuQ;aAggNQ;c1lGMmiPSn4tter3;gQmu5pa0;il5;cDAmi4nLpSqRrQs2zH;ta0vi0;ueJE;pelOW;la0ngMN;aKeTieBoSrQu2;eQoporzH;g1z9;gl1r0sa0;nFrQ;a0de0ge0;bbSno3rRsQ;s6UtrF5;di4gL1iOme8;ePliB;al2etN;denMOm06nQ;c03du3Of02g01i00nXqWsUtRvQ;esLolD;aFeRosQ;si6;nAr8R;eKtQ;al5;ui4;aResQ;ca0ta0;mo3;bi0;an4ra4;es2lazHorE;aQen41ros2;gl1n2;bRpQ;a3eg4ri7D;al5roOQ;iQreB;unD;aEiC;cRdu6g4rQ;ba0eCta0;ci2;g4t2;aZeXhiWiVoSrRuQ;ci0te0;eAiDT;lRnQpKr6Ms2;n6ZosLZveLA;o3pa0;nDogMApA6;eAuA;de0nArQt2ve3;ne0pe0;de0l9n2ri6to5;bi05c01e3ff1EggreBlZmYnXppVrUsTtQvvS;om7tQ;enArQ;ez9;c47t3;cHma0ti7V;an4li6rQ;enAoNC;co3;a0bigL0i4o3;be3lQ;in8K;cRerKPidQ;a0i8R;en2oQ;pp1rC;li2tKT;aUeTiSoRuQ;gEPpa0;m3Rt2;ge0me0;!da0zH;ma0sG;aQenAinDor0;na0rL;am7oc7BuIS;eSiRoQ;ra0st3;nD7ssH;nQr7tNz9;a0ti6;aReQiDui0;gKDt2;ce3ga0n1piCva0zH;eKiRrQ;ig4;tJu4;enAfQ;aEeKiQonA;da0ni0;g30lQmC8;iz9ogHL;a27b26c1SdM5f1Mg1Ji1Fl1Bm12n0Uos0Sp0Iq0Gr0BsZtTumiKFvQ;as2iQolDU;a0taQ;l7mHL;asFeToSrRtaQ;gl1re;on7uA;na0s5L;ne0rQs2;ge0mi4;a00cZeXiWoUquaEtQu5D;aRiQorFKre8;na0tCH;b6Sgi2LlHBre,tQ;al7iz9;lQn89;a0fo3;a0de3g4ra0sN;lQnsib6NssuJ;ezH;olHAriDB;crJlH3;aTeQiAoBuJ9;feRgolamOquiQs2K;si0;re63;pa0tt7;uaQ;liI;eYi5lo3oVrRuQ;ra0ta0;aLIeRiQ;me0va0;ca0da0ssQ;ur7;lQrDYte5T;ar7iQv7Z;m7YtEU;nJri0z9;siQtrBQ;da0ge4;aVeBiUoSuQ;cQda0;leGN;ccQmi4;io5;cotGEtriI;turJziQ;fi6onJ;aXeWiUoQ;crISdu5lRnQrJtiKZ;etG5iz9;i0tQ;ipEF;lQnerJsIYt7;itGB;n2rDti5;gnEDnC;eg1OiQocJuA;bRnQra0z1;ea0q2H;a0e3;fi6ndQon7;ic7uQ;stQ;riJ;as3YeRlQna0us2;obJuL;ne3;aUeTiSlRoQrammOunD;rEsfori5;azHo3ui0;ni0scJ;ca0neERri0zH;l6scist7;a02e00iZlaYoSrQ;esIIiQ;m0Ip2t2;diIlUmpSnRrQstrAN;a0re0ti6;dizHge5tes34;artQi5;imO;la0on7;ma0s3G;de0f3maAE;de0le3ntQrCV;raAC;de0ffeinF4lciIrbossi5;el5ut2;ciHXm2KtQ;tiJU;nSrRttiloQ;g7Usc4P;de8e;n89za0;a5Se5Fh54i4Gl49o04rTuQ;ba0ciJ4lRmu5rQstoP;a0ioFva0;la0mi4;aZeWiSoQ;cQl5nD2;ch1es17ifigD;mSoconceRstQti6vI3;a64iFU;nt3;inJ;a0de0ma0pRsQ;ce0pa0;a0i2;c6pu5;a3Sc3Rd3Qedi2fina3Pg3Mi3IkiIl38m2Cn0Do0Bp08rXsQva0;a0pVtQ;a0e8iRrQuE;inDui0;pa0tuQ;i0ziQ;onJ;arDerDi3;bHNi6nZo4rQte8;eUispToRuQ;ga0s6;bo3de0mQ;pe0;onA;da0gDre,sQ;poQ;nsQ;ab3L;a0iI;erMiRolim5DpHCrQu5;i0od8Q;a0nc7I;pe3rQ;di4;c1Ed1Cf14g0Yi0Xn0WosGVqu0Vs0OtXvQ;eTiSoQ;ca0lQ;a0ge0ve0;nGRta0ve0;nRrQ;ge0ti0;i0zH;a0Fe0Ain08orGNrQurFW;aYiXoQ;bVda2fUin30l5mi4no2proTque8JrepBVsQ;ofRtQ;amGer9;fit2;pBFva0;irE;atNila6A;b8Ls2;ccaXddiVppUrTsRttaQvveFO;c6re;sQta0;eg4;e,ia0re;or0un2;re,stingQ;ue0;mb1;geQua0;n2re;gg1mpTnSsQ;se0tQ;a0uJ;de0e0ta0;e3la0;b2Gg1in4Ami4re,t2;aVeUiToRtaA7uQ;l2ma0;c1lQ;a0iC;de3gl1sN;g8RnLrHI;c3pev1H;is2;etNuDD;a0uB;eUiuTlRrQ;atu5eB;oQuD8;ba0me3;nDra0;da0la0;aWeUiTl7NoRrQu2;i6on2;nArQ;ma0ta0;c6da0gu3nDs6;de3rQsFt2zH;i0ma0;bu5;an4enFiQo4ur0;re,scFFzH;ate4eViUlTorSreRuQ;l6pi0;sF4tC2;da0re0;aEuA;a0l1ma0o4ta0;de0lSnt3pi0rRtQ;tuJ;ne0ta0;eb3;anCb0Ii0Hm0ApRuniQ;ca0st9R;a03e02i01lXoWrSuQ;lFnDtQ;a0er7;a0enAiSoQ;mQva0;etN;me0;r8Ys2;eRiQ;ca0mO;sQta0;siI;anDla0ta0;nFte0;gi4rStQ;iQta0;b0Xre;a0i0tiQ;mentJ;eTiQu2;na0sQ;e3sQ;ar1io4;d1mo3nRrQtN;ciJ;da0ta0;c7nc1;aRi4uQ;re0;c1tN;a0lUma0oSpQtiFR;evQi0;ol7;n7rQ;a0iCW;aTeRiAo6uQ;de0t2;ga0ttQzH;iv7;bo3sFuCzH;bOnQta0;ciAteQ;rQs2;esF;esLi2liRnQ;osDL;e0o4;nz1;eciAiI;co5;bi2cQgu5l7r2;erF6;aSimCYoQ;na0rQ;oform7u3;cso4ma0nDssiRuQ;di6;cQfi6;he8iz9;ar5ba0c08e6f3lind3m07n04on03rcSta0uRvQ;il7;cc1la0rE;oRuQ;i0mnaviB;la0nRscQ;ri6A;ciVdUfSvQ;eCAolQ;ge0ve0;lQonAulD;etNui0;a0ur0;de0nD;do5;ciRgQt45;e0uD9;n4sM;a0en2;aTcSisbRlQ;iz9osti5;ea0;a0hD3;la0tr7;at2eYiQ;aTcchir1eSliIn9GoQuA;cciQda0sa0;a0o5;de0re0;cRma0pGriQva0z9;fi6re;chQ;ie3;rQta0;at9Be0;ca0de0l00mYnTrRsQ;el5sa0ti4;a0cQne0tiI;a0h1;a0tQ;el0CimSrQup7D;a47iQ;fuB;et3;enBTpQ;en4;a0eb3lQ;ofa4;c0Td0Rg0Ql0Lm0Jn0Eol8Xp0Ar01sZtUuTvRzzQ;a0e8ot2;aQil5;l6re;sa0te5zH;alTeRo2HraEtQ;ol6Yu3;ch7gQna0t01;or7;iz9oB;ca0sa0tQuJ;iBra0;aVbon8He4iTo2pi0re8tQ;eQol8Q;gg1lQ;li4;a0caQ;re,tur8C;c1XmeRttQ;er7;ll7;e8iRovQpD9ta0;olD;ll8Gre,taQ;l7ne8re;al7cBIdSg1nRon7tQ;a0icM;a0e8ibJo1V;e8iQ;da0re;b1e3mi4pQufDD;a0e8io4;a0cTde8eSma0pRuQza0;nn1;es2;fD8t2;a0i6Go5;io4l1;eQu6;n9re;a0c1;a14e0Ti0Cl0Ao06rZuRypQ;asF;a0caCIffWlTrRsQt2;ca0sa0;at2la0oQriI;crA5;iRlQ;iz9o4;ca0na0;a0er7o18;aViUoTuQ;cRli6ni0s6tQ;al7ta0;a0iaC7;gl1nAW;ga0l5nC;ca0ma0va0;ccSfonMgBYic8VllCFmbRo2rQ;b8Ud0Ise8;arC;he8ia0;aQinCufCH;nPs2te3;a01ciclALdo4e00for6gZlaYna0oUparLsRtuEv6IzaQ;nti0T;bRc8Ne6sa0tQ;en2iB2rBL;iCEoB1;degSgRnQsint5A;de8;raC8;raC;nc1;hellBSia0;nnJ;ncSsQ;ciQiE;a0ca0;hQi6;e8i0;aZccXffWga0la0nTrRstemm1vQ;icM;c1e,luscQsaBZ;on7;a2Rda0eQmeri2;diQfic7W;ce0re;a0e8;a0heQucM;gg1t2;re,tiI;a0c06da04g4l03mb00nZrUsStRzQ;zi6;te89;a0i0tQ;a0i3Ro4;a0bRcQda0ri6ufBI;ol5;aRiQ;ca0fi6;gl1r7;al7di0;iRoQ;le8;ne8;bA1c71e4la0z9P;lQre;uc6;cQia0;aB8hQ;et2ia0;bA1c89d7Herotra7Ff6Tg5Xi5Wl53m4An3Hp2Sr21s1At0Tu07vWzQ;iendJo2zQ;aSeRoppAVuQ;fB0r3;c6ra0;n4rC;al7;aZe0iotrasp79o6vQ;amGeTiQolD;a0ci4g4lRnQs5BtAOva0z61;a7Hce0gh1;i0upG;lTnRrQz9;a0ti0;i0tQ;a0u3;a0e4;l5n9r1;gu0Ali0mOreo5s09toQ;c04di02g01mati26no00pXriWsoTtraRvaQ;lu2;piQsp6V;an2;mmiRsQ;te2Q;ni48;dSz9;roQubb3A;dQtegD;ur0;mi4;esL;cQstrugD;hia3;er7NoQ;ntrRrQ;re5;ar0;cul2pi6;mOra0;om7r05tQ;ac6e01i00oWrSuQ;aQt9R;l7re;aRez9ibQon6;ui0;c6pGr0vQ;erF;lSrQ;cQti9T;e0i9S;le0;c7nDra0v7z9;cc7Vd1gg1nRrQs2;ga0ra0za0;de0e0ta0ua0zH;of7;c0Cf0Bp09sUtQ;eSrQ;ar0inDoQ;loB;gg1ne0rD;a03eYiWoRuQ;c6me0rD;c1da0gg7HlTmSna0rRtQ;ti9D;bi0da0ti0;a0i9Bma0;ca0ut7ve0;bi5cu3de0eQl5mi5om6EsN;ma0pa0;cTd1gSmbRnQri0s2ve3;na0ti0;la0ra0;na0ui0;ca0onCu3;et2gg1l6Bpo3ssi4;eQi3or2re8;rDt2;al2;enAiRoQriS;l2nA;olQuB;ve0;a0Ebit3c09de0g08i07m06om5Zp05rSsi7HtiRzigoQ;go5;co5gl1;a00eZiXoSuQ;bi4gQviP;gi5L;cTga0n6sStRveQ;l5sc1;onC;s8Ct8C;ca0hi0;ccQde0f8GnBsMva0;hi0ia0;da0s2;bb1ff4GmQz9;pi6;e8o4;a0e8on7;an7e8;i4omOui0;aiThQua0;e8iQ;bQv1;ug1;c7z9;bQre;es6iz9;o0DpQri0;a05e03i00lZoXrRuQ;nt6Era0;aLeUoQ;cc1da0fSpr1sRvQ;a0vigH;siE;it2onP;nAz9;gg1rQs2;re,ta0;auPi6;aRcc3IeCn9oQ;m4KpG;cevo6Zna0tL;l5nArt7sQz9;anL;ci0SnVrSsQ;siQ;o4re;a0ecMi0tQ;a0eQ;ne0;et2na0;coGlTsta2;a0Ec0De0Ag07iEnZonYtQ;eViSolRropQ;iz9om0E;og7;cQda2;hQiG;e8iz9;ceApQ;or0;im7;aWeUiToRuQ;i0l5nc1sa0vo5;bi6Cda0ia0tQve3;a0to5;chi6Ada0en2;bb1ga0ri0tN;te0;ff1sa0;ar1eRlQo5u04;ic7;li6;lRm7stQ;et7;a0la0;he8o3;grSl7mRtQ;em3Tom7ra0;orf7;amE;a0Fb0Der29mUniToSpQ;liQu2;a0fi6;re8;st1;a01eYiWoSuQ;cMfQsa0t66;fi0;d3Qgl1i4l5Nn3MrQsc1;bQti0;a0iP;di0;c6nQra0;iZu2;lEnRtQzz5Y;a0te0;ci0;c6eVi4liTnSra0ssRtQz9;asFti0;a0i4P;et2ni0si0t4E;a0nQ;co2V;st3;a1UiQ;a0en2re;lgaErQ;eQi6;!gg1;a0b0Gc0Ce8fabet0Bge0i0AlTmanSoge4pe8tQza0;ale4erQ;a0ca0na0;ac6;a05e00iYoVuQ;cTde0mRnQpa0vH;a0ga0;aQi4;ca0re;ch3Mi4;cRgQnta4pp1;a0g1;a0c3M;b3cc1de0e2nQ;da0ea0;a0gSlu1nRrQsLt2v1D;g7ta0;a0ta0;a0gQor7;eKia0;cc1ga0pGrBt2;e4mO;a0iz9;alShiQol7;miQ;a0z9;in7;eQi6;gg1ra0;u2z9;e0KgUiToSrRuQ;cMra0z9;ar7;g4n7;a0re,ta0;a0Be0Ahi08i04l01o00rTuQ;aRerK;ri0;gl1n2rC;aVeUiSoRuQ;ma0pG;mEnCvi4N;cc1nQ;zi0;di0ga0;f4GnMti36va0z1;mi2N;oRuQ;ti4;me3;oSra0uQ;di6nQs2;ge0ta0;ga0r4;aQnC;cc1da0ia0;tt15;l5nRr11tQ;to4;c1gQ;he3;mi4vo5;fSrQ;icQ;an7;a03e02iYlVoTrRumQ;a0i6;anDeQitt1Uon2;dCn29s6;ca0g0OlQnCr9;la0ta0;igDoQui0;sc1;ge0;aSbb1da0eRlQna0oc1Wt2;a0ia0;na0vo2Y;n6ta0;r1Nt2zH;ccTgSlCma0n4rd1IsRtQ;i6tu3;ci4;ot2;enChi4ia0;i4spQ;or2;a0Fd00eXiWoTuQ;lRnQsa0;a0gh1;a0te3;cMmb3n2pRrQt2;a0na0;e3ra0;re,u2J;g08rQs6;ge0iQ;re,z9;az1e02iYoRuQ;a0r0;bVci2BgUlTmRsFttQ;o3ri4;anCesQ;ti6;c2Oo3;a0l1;ba0;a1Het3mSre,tRveQzH;ni0;a0i24;anC;bi2ciEnQst3;sa0ta0;cqQt2;ua0;c03e01i00quTrQut7;omQ;at7;iz9;aTer0FiQ;eRsQ;i0ta0;s00ta0;dRreQ;!l5;er4;diI;tiI;fi6;a0Oe0Ih0Gi0Al07oUreSuQ;di0lQmu5sa0;tu3;di2sQ;ce0;g01lZmXnSpp1rRs2tQz9;o4tiE;c1d0Ere0;c1discTsRtO;en2;enL;ti0;enA;ia2oCpQu4;ag4;la0tQ;el5;lie0;aRiE;ma0;ma0ra0;aUglHoRuf1KvQ;et2;ccRtQ;to5;hi0;b0Oia0;e2iQ;apG;ca0de0le3nUpGrQssor1t2;cQta0;hiQi4;a0el5;pa0;de0sa0ta0;f16gHl02mpa01nZpUrTsc1taSvQ;alQez9;c1la0;r3s2;ez9na0toS;ar3pSrQ;et2iQ;cc1;iQo4;a0et2;a0e8i0to4;gg1;na0re;app1;io4;alie4bZdYeXiVoTrQuF;aAoB;ga0;de0;li0mi4rQ;ri0ti0;et2li2sFtQu3;a0ua0;n2r3;i6ur0;a0Ce09i05oYrRurQ;at2;acVev1iUon9uQ;ni0sQti0;toQ;li0;za0;va0;c1ia0;ccVnTr3ttSzzaQ;cMre;ch1;i4o4;aQda0i0;cc1re;a0o4;aCca0gl1nRsQt2;c1og4;a0do5;da0;llRve3;ra0;a0i0;c03da0gl1ia0lZmbi4nYrTsFtQ;te0uffo5;la0;sa0;bRca0ra0ufQ;fa0;aRi6;ca0;gl1;ca0do4;lRuQ;gi4;a0i4ot2;ta0;a0ch1i4;ia0;na0;re",
    "Organization": "true¦0:43;a38b2Pc29d21e1Xf1Tg1Lh1Gi1Dj19k17l13m0Sn0Go0Dp07qu06rZsStFuBv8w3y1;amaha,m0Xou1w0X;gov,tu2Q;a3e1orld trade organizati3Y;lls fargo,st1;fie22inghou16;l1rner br3A;-m11gree2Zl street journ24m11;an halNeriz3Tisa,o1;dafo2Fl1;kswagLvo;bs,kip,n2ps,s1;a tod2Pps;es32i1;lev2Vted natio2S; mobi2Iaco bePd bMeAgi frida9h3im horto2Rmz,o1witt2U;shiba,y1;ota,s r Y;e 1in lizzy;b3carpen30daily ma2Uguess w2holli0rolling st1Ms1w2;mashing pumpki2Muprem0;ho;ea1lack eyed pe3Cyrds;ch bo1tl0;ys;l2s1;co,la m12;efoni07us;a6e4ieme2Enp,o2pice gir5ta1ubaru;rbucks,to2K;ny,undgard1;en;a2Ox pisto1;ls;few23insbu24msu1V;.e.m.,adiohead,b6e3oyal 1yan2U;b1dutch she4;ank;/max,aders dige1Dd 1vl2Z;bu1c1Shot chili peppe2Hlobst26;ll;c,s;ant2Sizno2C;an5bs,e3fiz22hilip morrBi2r1;emier24octer & gamb1Pudenti13;nk floyd,zza hut;psi25tro1uge08;br2Nchina,n2N; 2ason1Vda2D;ld navy,pec,range juli2xf1;am;us;a9b8e5fl,h4i3o1sa,wa;kia,tre dame,vart1;is;ke,ntendo,ss0K;l,s;c,st1Ctflix,w1; 1sweek;kids on the block,york08;a,c;nd1Rs2t1;ional aca2Co,we0P;a,cYd0N;aAcdonald9e5i3lb,o1tv,yspace;b1Knsanto,ody blu0t1;ley crue,or0N;crosoft,t1;as,subisO;dica3rcedes2talli1;ca;!-benz;id,re;'s,s;c's milk,tt11z1V;'ore08a3e1g,ittle caesa1H;novo,x1;is,mark; pres5-z-boy,bour party;atv,fc,kk,m1od1H;art;iffy lu0Jo3pmorgan1sa;! cha1;se;hnson & johns1Py d1O;bm,hop,n1tv;g,te1;l,rpol; & m,asbro,ewlett-packaSi3o1sbc,yundai;me dep1n1G;ot;tac1zbollah;hi;eneral 6hq,l5mb,o2reen d0Gu1;cci,ns n ros0;ldman sachs,o1;dye1g09;ar;axo smith kliYencore;electr0Gm1;oto0S;a3bi,da,edex,i1leetwood mac,oFrito-l08;at,nancial1restoU; tim0;cebook,nnie mae;b04sa,u3xxon1; m1m1;ob0E;!rosceptics;aiml08e5isney,o3u1;nkin donuts,po0Tran dur1;an;j,w j1;on0;a,f leppa2peche mode,r spiegXstiny's chi1;ld;rd;aEbc,hBi9nn,o3r1;aigsli5eedence clearwater reviv1ossra03;al;ca c5l4m1o08st03;ca2p1;aq;st;dplLgate;ola;a,sco1tigroup;! systems;ev2i1;ck fil-a,na daily;r0Fy;dbury,pital o1rl's jr;ne;aFbc,eBf9l5mw,ni,o1p,rexiteeV;ei3mbardiJston 1;glo1pizza;be;ng;ack & deckFo2ue c1;roW;ckbuster video,omingda1;le; g1g1;oodriM;cht3e ge0n & jer2rkshire hathaw1;ay;ryG;el;nana republ3s1xt5y5;f,kin robbi1;ns;ic;bWcRdidQerosmith,ig,lKmEnheuser-busDol,pple9r6s3t&t,v2y1;er;is,on;hland1sociated F; o1;il;by4g2m1;co;os; compu2bee1;'s;te1;rs;ch;c,d,erican3t1;!r1;ak; ex1;pre1;ss; 4catel2t1;air;!-luce1;nt;jazeera,qae1;da;as;/dc,a3er,t1;ivisi1;on;demy of scienc0;es;ba,c",
    "SportsTeam": "true¦0:1A;1:1H;2:1G;a1Eb16c0Td0Kfc dallas,g0Ihouston 0Hindiana0Gjacksonville jagua0k0El0Bm01newToQpJqueens parkIreal salt lake,sAt5utah jazz,vancouver whitecaps,w3yW;ashington 3est ham0Rh10;natio1Oredski2wizar0W;ampa bay 6e5o3;ronto 3ttenham hotspur;blue ja0Mrapto0;nnessee tita2xasC;buccanee0ra0K;a7eattle 5heffield0Kporting kansas0Wt3;. louis 3oke0V;c1Frams;marine0s3;eah15ounG;cramento Rn 3;antonio spu0diego 3francisco gJjose earthquak1;char08paA; ran07;a8h5ittsburgh 4ortland t3;imbe0rail blaze0;pirat1steele0;il3oenix su2;adelphia 3li1;eagl1philNunE;dr1;akland 3klahoma city thunder,rlando magic;athle0Mrai3;de0; 3castle01;england 7orleans 6york 3;city fc,g4je0FknXme0Fred bul0Yy3;anke1;ian0D;pelica2sain0C;patrio0Brevolut3;ion;anchester Be9i3ontreal impact;ami 7lwaukee b6nnesota 3;t4u0Fvi3;kings;imberwolv1wi2;rewe0uc0K;dolphi2heat,marli2;mphis grizz3ts;li1;cXu08;a4eicesterVos angeles 3;clippe0dodDla9; galaxy,ke0;ansas city 3nE;chiefs,roya0E; pace0polis colU;astr06dynamo,rockeTtexa2;olden state warrio0reen bay pac3;ke0;.c.Aallas 7e3i05od5;nver 5troit 3;lio2pisto2ti3;ge0;broncZnuggeM;cowbo4maver3;ic00;ys; uQ;arCelKh8incinnati 6leveland 5ol3;orado r3umbus crew sc;api5ocki1;brow2cavalie0india2;bengaWre3;ds;arlotte horAicago 3;b4cubs,fire,wh3;iteB;ea0ulR;diff3olina panthe0; c3;ity;altimore 9lackburn rove0oston 5rooklyn 3uffalo bilN;ne3;ts;cel4red3; sox;tics;rs;oriol1rave2;rizona Ast8tlanta 3;brav1falco2h4u3;nited;aw9;ns;es;on villa,r3;os;c5di3;amondbac3;ks;ardi3;na3;ls",
    "Conjunction": "true¦aKbenJcHdFeCgrazie a,inBmAn8o6p3qu2s0tuttav7vi4;ebbene,i0;a,ccome;ando,inM;er1iutto0rima CuA;stoD;cIò;!p6ss0;ia;e0é;ancDmmeno,p3;a,ent3;fatti,olt2;!p0;pu0;re;opo 0unque;c6di;ioè,osí0; c4;c4sì; causa 4ffinc3llora,n0ppena;c1zi0;!c1;he;hé;di",
    "Date": "true¦domani,ieri,oggi",
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

  const toArray = function (trie) {
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
    return toArray(trie)
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
      if (tag === 'Infinitive') {
        // do future-tense
        // let res = conjugate.futureTense(w)
        // Object.keys(res).forEach(k => {
        //   if (!words[res[k]]) {
        //     words[res[k]] = [tagMap[k], 'FutureTense']
        //   }
        // })
        // // do present-tense
        let res = conjugate.toPresent(w);
        Object.keys(res).forEach(k => {
          if (!words[res[k]]) {
            words[res[k]] = [tagMap[k], 'PresentTense'];
          }
        });
        // // do imperfect mood
        // res = conjugate.imperfect(w)
        // Object.keys(res).forEach(k => words[res[k]] = 'Verb')
        // // past-participle
        // let out = conjugate.pastParticiple(w)
        // words[out] = 'PastTense'
      }
    });
  });

  let lexicon$1 = Object.assign({}, words, misc$1);
  // console.log(Object.keys(lexicon).length.toLocaleString(), 'words')
  // console.log(lexicon['suis'])
  var words$1 = lexicon$1;

  // import root from './compute/root.js'


  var lexicon = {
    methods: {
      two: {
        transform: {
          methods,
          // toRoot
        }
      }
    },
    model: {
      one: {
        lexicon: words$1
      }
    },
    compute: {
      // root: root
    }
  };

  const entity = ['Person', 'Place', 'Organization'];

  var nouns = {
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

  var verbs = {
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

  let tags = Object.assign({}, nouns, verbs, values, dates, misc);

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
      setTag([term], 'Noun', world, false, '2-fallback');
    }
  };
  var fallback$1 = fallback;

  //sweep-through all suffixes
  const suffixLoop = function (str = '', suffixes = []) {
    const len = str.length;
    let max = 7;
    if (len <= max) {
      max = len - 1;
    }
    for (let i = max; i > 1; i -= 1) {
      let suffix = str.substr(len - i, len);
      if (suffixes[suffix.length].hasOwnProperty(suffix) === true) {
        // console.log(suffix)
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
      let tag = suffixLoop(term.normal, suffixes);
      if (tag !== null) {
        setTag([term], tag, world, false, '2-suffix');
        term.confidence = 0.7;
        return true
      }
      // try implicit form of word, too
      if (term.implicit) {
        tag = suffixLoop(term.implicit, suffixes);
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

  // 1st pass
  // // 3rd
  // import guessNounGender from './3rd-pass/noun-gender.js'
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

  // const thirdPass = function (terms, world) {
  //   for (let i = 0; i < terms.length; i += 1) {
  //     guessNounGender(terms, i, world)
  //     guessPlural(terms, i, world)
  //     adjPlural(terms, i, world)
  //     adjGender(terms, i, world)
  //     verbForm(terms, i, world)
  //   }
  // }


  const tagger = function (view) {
    let world = view.world;
    view.docs.forEach(terms => {
      firstPass(terms, world);
      secondPass(terms, world);
      // thirdPass(terms, world)
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
    [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?(st|nd|rd|r?th)$/, ['Ordinal', 'NumericValue'], '53rd'],
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
  // const nn = 'Noun'
  // const vb = 'Verb'
  // const jj = 'Adjective'
  // const cond = 'Conditional'
  // const fut = 'FutureTense'
  // const inf = 'Infinitive'
  // const g = 'Gerund'
  const ref = 'Reflexive';
  // const first = 'FirstPerson'

  var suffixPatterns = [
    null,
    {
      // one-letter suffixes
    },
    {
      // two-letter suffixes
    },
    {
      // three-letter suffixes
    },
    { // four-letter suffixes
      arsi: ref,
      irsi: ref,
      ersi: ref
    },
    { // five-letter suffixes
      mente: rb
    },
    {
      // six-letter suffixes
    },
    {
      // seven-letter suffixes
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


    // Come ti chiami?
    doc.match('(mi|ti|si|ci|vi|si) #Verb').tag('Reflexive', 'si-verb');

  };
  var postTagger$2 = postTagger$1;

  var postTagger = {
    compute: {
      postTagger: postTagger$2
    },
    hooks: ['postTagger']
  };

  // import nlp from 'compromise/one'

  nlp$1.plugin(tokenize);
  nlp$1.plugin(tagset);
  nlp$1.plugin(lexicon);
  nlp$1.plugin(preTagger);
  nlp$1.plugin(postTagger);

  const it = function (txt, lex) {
    let doc = nlp$1(txt, lex);
    return doc
  };

  it.world = nlp$1.world;
  it.model = nlp$1.model;
  it.methods = nlp$1.methods;
  it.tokenize = nlp$1.tokenize;
  it.plugin = nlp$1.plugin;
  it.extend = nlp$1.extend;


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
