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

  const fns$4 = {
    /** add metadata to term objects */
    compute: function (input, options) {
      const { world } = this;
      const compute = world.compute;
      // do one method
      if (typeof input === 'string' && Object.hasOwn(compute, input)) {
        compute[input](this, options);
      }
      // allow a list of methods
      else if (Array.isArray(input)) {
        input.forEach(name => {
          if (Object.hasOwn(world.compute, name)) {
            compute[name](this, options);
          } else {
            console.warn('no compute:', input); // eslint-disable-line
          }
        });
      }
      // allow a custom compute function
      else if (typeof input === 'function') {
        input(this, options);
      } else {
        console.warn('no compute:', input); // eslint-disable-line
      }
      return this
    },
  };

  // wrappers for loops in javascript arrays

  // call the callback with a one-match view
  const wrap$3 = (view, cb) => (ptr, i) => cb(view.update([ptr]), i);

  const forEach = function (cb) {
    this.fullPointer.forEach(wrap$3(this, cb));
    return this
  };

  const map = function (cb, empty) {
    const run = wrap$3(this, cb);
    const res = this.fullPointer.map((ptr, i) => {
      const out = run(ptr, i);
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
    return this.update(this.fullPointer.filter(wrap$3(this, cb)))
  };

  const find$6 = function (cb) {
    const found = this.fullPointer.find(wrap$3(this, cb));
    if (found === undefined) {
      return this.update([])
    }
    return this.update([found])
  };

  const some$1 = function (cb) {
    return this.fullPointer.some(wrap$3(this, cb))
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
  var loops = { forEach, map, filter, find: find$6, some: some$1, random };

  // small helpers shared by the View class and its methods

  // the pointer, or one per sentence for a full document
  const rawPointer = view => view.pointer || view.docs.map((_d, n) => [n]);

  // tag new terms, if the tagger is loaded
  const retag = function (view, computes) {
    view.compute([...computes, 'freeze', 'lexicon']);
    if (view.world.compute.preTagger) {
      view.compute('preTagger');
    }
    view.compute('unfreeze');
    return view
  };

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
      const ptr = rawPointer(this);
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
      return this.update(rawPointer(this).slice(min, max))
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
      if (aPtr.length !== bPtr.length) {
        return false
      }
      // ensure [n, start, end] are all the same
      return aPtr.every((ptr, i) => bPtr[i] && ptr[0] === bPtr[i][0] && ptr[1] === bPtr[i][1] && ptr[2] === bPtr[i][2])
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

  const methods$m = { ...utils, ...fns$4, ...loops };

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
        start ||= 0;
        end ||= (document[n] || []).length;
        //add frozen id, for good-measure
        if (document[n]?.[start]) {
          id ||= document[n][start].id;
          if (document[n][end - 1]) {
            endId ||= document[n][end - 1].id;
          }
        }
        return [n, start, end, id, endId]
      })
    }
    // create a new View, from this one
    update(pointer) {
      const m = new View(this.document, pointer);
      // send the cache down, too?
      if (this._cache && pointer?.length > 0) {
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
      return retag(doc, ['normal'])
    }
    clone() {
      // clone the whole document
      let document = this.document.slice(0); //node 17: structuredClone(document);
      document = document.map(terms => {
        return terms.map(term => {
          term = { ...term };
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
  // subclasses set their own name on their prototype
  View.prototype.viewType = 'View';

  var version$1 = '14.20.0';

  const isObject$2 = function (item) {
    return item && typeof item === 'object' && !Array.isArray(item)
  };

  const isUnsafeKey = key => key === '__proto__' || key === 'constructor' || key === 'prototype';

  // recursive merge of objects
  function mergeDeep(model, plugin) {
    if (isObject$2(plugin)) {
      for (const key in plugin) {
        // prevent prototype pollution
        if (isUnsafeKey(key)) {
          continue
        }
        if (isObject$2(plugin[key])) {
          if (!model[key]) {
            model[key] = {};
          }
          mergeDeep(model[key], plugin[key]); //recursion
        } else if (Array.isArray(plugin[key]) && Array.isArray(model[key])) {
          // a list, like model.one.contractions, is added to - not replaced
          model[key] = model[key].concat(plugin[key]);
        } else {
          model[key] = plugin[key];
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
      model[key] ||= {};
      Object.assign(model[key], plugin[key]);
    }
    return model
  }

  // verb forms, then adjective forms
  const irregularForms = [
    ['pastTense', 'Past'],
    ['presentTense', 'Present'],
    ['gerund', 'Gerund'],
    ['comparative', 'Comparative'],
    ['superlative', 'Superlative'],
  ];

  const addIrregulars = function (model, conj) {
    const m = model.two.models || {};
    Object.keys(conj).forEach(k => {
      irregularForms.forEach(([prop, name]) => {
        const form = conj[k][prop];
        if (!form) {
          return
        }
        if (m['to' + name]) {
          m['to' + name].ex[k] = form;
        }
        if (m['from' + name]) {
          m['from' + name].ex[form] = k;
        }
      });
    });
  };

  const extend = function (plugin, world, View, nlp) {
    // support array of plugins
    if (Array.isArray(plugin)) {
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
    // Notify plugins when replacement creates new terms.
    if (plugin.onReplace) {
      methods.one.onReplace = (methods.one.onReplace || []).concat(plugin.onReplace);
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

  // Shared CLI colors and styles. Plain text when NO_COLOR is set, as the convention asks
  const off = typeof process !== 'undefined' && Object.hasOwn(process.env || {}, 'NO_COLOR');
  const color = code => s => (off ? s : '\x1b[' + code + 'm' + s + '\x1b[0m');

  const green = color(32);
  const red = color(31);
  const blue = color(34);
  const cyan = color(36);
  const yellow = color(33);
  // used by name, from the tagset colors
  const magenta = color(35);
  const dim = color(2);
  const i$1 = color(3);
  const b = color(1);
  const ul = color(4);
  const grey = color(90);

  var cli = /*#__PURE__*/Object.freeze({
    __proto__: null,
    b: b,
    blue: blue,
    cyan: cyan,
    dim: dim,
    green: green,
    grey: grey,
    i: i$1,
    magenta: magenta,
    red: red,
    ul: ul,
    yellow: yellow
  });

  const env = globalThis.process?.env ?? globalThis.env ?? {};
  const debug$2 = { tags: Boolean(env.DEBUG_TAGS) };

  // Capture only the requested terms, and only while tracing.
  const before$1 = term => {
    if (debug$2.tags && (!debug$2.word || debug$2.word === (term.normal || term.text || term.implicit || '').toLowerCase())) {
      return [...term.tags]
    }
    return null
  };

  // Show actual changes, including conflict removals.
  const log = (term, previous, reason = '') => {
    if (!previous) {
      return
    }
    const added = [...term.tags].filter(tag => !previous.includes(tag));
    const removed = previous.filter(tag => !term.tags.has(tag));
    if (!added.length && !removed.length) {
      return
    }
    const text = term.text || term.implicit || '';
    const index = term.index?.join(':') || '?';
    const prefix = debug$2.prefix || '   ';
    if (debug$2.rule !== reason) {
      const headingPrefix = debug$2.prefix ? prefix.replace('│  ', '│ ') : '  ';
      console.log(`${headingPrefix}${dim((reason || 'tag change') + ':')}`); // eslint-disable-line no-console
      debug$2.rule = reason;
    }
    const print = (tags, sign, color) => {
      if (!tags.length) {
        return
      }
      const word = color(`'${text}'`);
      const changes = tags.map(tag => color(`#${tag}`)).join(' ');
      console.log(`${prefix}${color(sign)} ${word} ${dim(index.padEnd(9))} ${changes}`); // eslint-disable-line no-console
    };
    print(removed, '−', red);
    print(added, '+', green);
  };

  debug$2.before = before$1;
  debug$2.log = log;

  // Install only while verbose matching is enabled; restore the original hot path.
  const matchDebug = (world, options) => {
    const one = world.methods.one;
    const match = one.match;
    const parse = one.parseMatch;
    const sources = new WeakMap();
    const word = options.word?.toLowerCase();
    const includesWord = terms =>
      !word || terms.some(term => (term.normal || term.text || term.implicit || '').toLowerCase() === word);

    const parseLogged = function (...args) {
      const regs = parse.apply(this, args);
      sources.set(regs, String(args[0]));
      return regs
    };
    const matchLogged = function (docs, todo, cache) {
      const result = match.call(this, docs, todo, cache);
      const pattern = todo.match || sources.get(todo.regs) || '[parsed pattern]';
      if (options.pattern !== undefined && pattern !== options.pattern) {
        return result
      }
      if (word && !docs.some(includesWord)) {
        return result
      }
      const matches = result.ptrs
        .map(([n, start, end]) => docs[n].slice(start, end))
        .filter(includesWord);
      if (word && result.ptrs.length && !matches.length) {
        return result
      }
      debug$2.rule = undefined;
      const status = result.ptrs.length ? green('✓') : red('✗');
      const spans = matches.map(terms => {
        const text = terms.map(term => term.text || term.implicit).join(' ');
        return `${green("'" + text + "'")} ${dim(terms[0]?.index?.join(':') || '?')}`
      }).join(', ');
      const rule = pattern.length > 80 ? pattern.slice(0, 79) + '…' : pattern;
      const words = spans ? spans + '  ' : ' ---         ';
      console.log(`${debug$2.prefix || '   '}${status} ${words}${dim(i$1(rule))}`); // eslint-disable-line no-console
      return result
    };
    one.parseMatch = parseLogged;
    one.match = matchLogged;
    return () => {
      // Do not overwrite a plugin's replacement installed during tracing.
      if (one.parseMatch === parseLogged) {
        one.parseMatch = parse;
      }
      if (one.match === matchLogged) {
        one.match = match;
      }
    }
  };

  const colorSpec = doc => {
    return doc.docs
      .map((terms, index) => {
        const plain = terms.map(t => t.pre + t.text + t.post).join('').trim();
        const text = dim("'" + plain + "'");
        const spec = doc.update([[index]]).out('spec');
        return text + grey(i$1(spec.slice(plain.length)))
      })
      .join('\n')
  };

  // Trace the actual pipeline once, including the initial tokenized document.
  const hooksDebug = headings => (doc, hooks) => {
    const width = Math.max('tokenize'.length, ...hooks.map(hook => hook.length));
    const snapshot = (hook, nested = false) => {
      const output = colorSpec(doc);
      output.split('\n').forEach((line, index, lines) => {
        if (nested) {
          const branch = index === lines.length - 1 ? ' ╰─' : '│ ';
          console.log(`  ${dim(branch)} ${line}`); // eslint-disable-line no-console
          return
        }
        const label = (index === 0 ? hook : '').padEnd(width);
        console.log(`  ${dim(label)}  ${line}`); // eslint-disable-line no-console
      });
    };
    snapshot('tokenize');
    hooks.forEach(hook => {
      const nested = headings;
      const prefix = debug$2.prefix;
      const rule = debug$2.rule;
      debug$2.rule = undefined;
      if (nested) {
        console.log(`  ${blue(b(ul(hook + ':')))}`); // eslint-disable-line no-console
        debug$2.prefix = dim('   │  ');
      }
      // Restore the log prefix even when a plugin hook throws.
      try {
        doc.compute(hook);
        snapshot(hook, nested);
      } finally {
        debug$2.prefix = prefix;
        debug$2.rule = rule;
      }
    });
  };

  let restoreMatch;

  /** log the decision-making to console */
  const verbose = function (set = true, options = {}) {
    restoreMatch?.();
    restoreMatch = undefined;
    if (set === 'match' || set === true) {
      restoreMatch = matchDebug(this._world, options);
    }
    debug$2.hooks = set === 'hooks' || set === true ? hooksDebug(set === true) : undefined;
    debug$2.word = options.word?.toLowerCase();
    debug$2.contractions = set === 'contractions' || set === true;
    debug$2.rule = undefined;
    debug$2.tags = set === 'tagger' || set === true;
    debug$2.spec = set === 'spec' || set === true;
    return this
  };

  // a plain object - not an array, null, or class instance
  const isObject$1 = val => Object.prototype.toString.call(val) === '[object Object]';

  // internal Term objects are slightly different
  const fromJson = function (json) {
    return json.map(o => {
      return o.terms.map(term => {
        if (Array.isArray(term.tags)) {
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
    if (isObject$1(input) && input.isView) {
      return new View(input.document, input.ptrs)
    }
    // handle json input
    if (Array.isArray(input)) {
      // pre-tokenized array-of-arrays 
      if (Array.isArray(input[0])) {
        const document = preTokenized(input);
        return new View(document)
      }
      // handle json output
      const document = fromJson(input);
      return new View(document)
    }
    return doc
  };

  const world = { ...tmpWrld };
  // the steps to run before (or without) the tagger
  const preTag = ['alias', 'normal', 'machine', 'contractions'];

  const nlp = function nlp(input, lex) {
    if (lex) {
      nlp.addWords(lex);
    }
    const doc = inputs(input, View, world);
    if (input) {
      if (debug$2.hooks) {
        debug$2.hooks(doc, world.hooks);
      } else {
        doc.compute(world.hooks);
      }
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
    if (debug$2.hooks) {
      debug$2.hooks(doc, compute.contractions ? preTag : []);
    } else if (compute.contractions) {
      doc.compute(preTag); //run it if we've got it
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

  // log the decision-making to console
  nlp.verbose = verbose;
  // current library release version
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
        term.tags.forEach(tag => {
          items.add('#' + tag);
        });
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

  var cache$3 = {
    api: addAPI$3,
    compute: compute$6,
    methods: methods$l,
  };

  // visit every term of a nested document: fn(term, terms, t, n)
  const eachTerm = (docs, fn) => {
    for (let n = 0; n < docs.length; n += 1) {
      const terms = docs[n];
      for (let t = 0; t < terms.length; t += 1) {
        fn(terms[t], terms, t, n);
      }
    }
  };

  // uppercase the first letter - todo: support unicode?
  const titleCase$2 = str => str.replace(/^ *[a-z\u00C0-\u00FF]/, x => x.toUpperCase());

  // change the text of every term
  const mapText = function (view, fn) {
    view.termList().forEach(t => {
      t.text = fn(t.text);
    });
    return view
  };

  var caseFns = {
    /** */
    toLowerCase: function () {
      return mapText(this, str => str.toLowerCase())
    },
    /** */
    toUpperCase: function () {
      return mapText(this, str => str.toUpperCase())
    },
    /** */
    toTitleCase: function () {
      return mapText(this, titleCase$2)
    },
    /** */
    toCamelCase: function () {
      eachTerm(this.docs, (t, terms, i) => {
        if (i !== 0) {
          t.text = titleCase$2(t.text);
        }
        if (i !== terms.length - 1) {
          t.post = '';
        }
      });
      return this
    },
  };

  // case logic for the first character of a word
  const isTitleCase$2 = str => /^\p{Lu}[\p{Ll}'’]/u.test(str) || /^\p{Lu}$/u.test(str);
  const toTitleCase$1 = str => str.replace(/^\p{Ll}/u, x => x.toUpperCase());
  const toLowerCase = str => str.replace(/^\p{Lu}/u, x => x.toLowerCase());

  // give a new word the case of the one it replaced: 'Danes' -> 'Dane', 'DANES' -> 'DANE'
  const matchCase$1 = (original, str) => {
    if (original.length > 1 && original === original.toUpperCase() && original !== original.toLowerCase()) {
      return str.toUpperCase()
    }
    return /^\p{Lu}/u.test(original) ? toTitleCase$1(str) : str
  };

  // Heal the edges of a sentence, when its first or last words change.
  // Shared by insert and remove, and by the noun and verb conversions.

  // a capital of its own, not the sentence's - 'Spencer', 'NASA', 'I', or 'Plan B'
  const ownsCapital = function (term) {
    if (term.tags.has('ProperNoun') || term.tags.has('Acronym')) {
      return true
    }
    return term.text.length === 1 || !isTitleCase$2(term.text)
  };

  // the first word of a sentence lends its capital to a new first word
  const passCapital = function (from, to, drop) {
    if (!/^\p{Lu}/u.test(from.text)) {
      return
    }
    to.text = toTitleCase$1(to.text);
    if (drop && !ownsCapital(from)) {
      from.text = toLowerCase(from.text);
    }
  };

  // quotes, brackets and newlines open a phrase, so they stay in front of it
  const passOpening = function (from, to) {
    to.pre = from.pre + to.pre;
    from.pre = '';
  };

  // a bare hyphen joins two words - 'well-fed'
  const isJoiner = post => /^[-–]$/.test(post);

  // "dogs' bowls" - with no opening quote before it, an apostrophe belongs to its word
  const isPossessive = function (terms, i) {
    if (!/^['’]/.test(terms[i].post)) {
      return false
    }
    return !terms.slice(0, i + 1).some(term => /['‘]/.test(term.pre))
  };

  // periods, commas, closing quotes and brackets end a phrase, so they stay behind it
  const passClosing = function (terms, i, to) {
    const from = terms[i];
    // nothing to move, or it is part of the word
    if (!from.post || isJoiner(from.post) || isPossessive(terms, i)) {
      return false
    }
    let post = from.post;
    // the new words may bring their own ending - 'loudly!'
    if (/[.?!…]/.test(to.post)) {
      post = post.replace(/^[.?!…]+/, '');
    }
    to.post = to.post.trimEnd() + post;
    from.post = ' ';
    return true
  };

  // splice an array into an array
  const spliceArr = (parent, index, child) => {
    // tag them as dirty
    child.forEach(term => term.dirty = true);
    if (parent) {
      parent.splice(index, 0, ...child);
    }
    return parent
  };

  // add a space at end, if required
  const endSpace = function (terms) {
    const hasSpace = / $/;
    const hasDash = /[-–—]/;
    const lastTerm = terms.at(-1);
    if (lastTerm && !hasSpace.test(lastTerm.post) && !hasDash.test(lastTerm.post)) {
      lastTerm.post += ' ';
    }
  };

  // put these words before the others
  const cleanPrepend = function (home, ptr, needle, document, agree) {
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
    if (agree) {
      // '"dogs' -> '"the dogs'
      passOpening(home[start], needle[0]);
      // 'Dogs' -> 'The dogs'
      if (start === 0) {
        passCapital(home[start], needle[0], true);
      }
    }
    spliceArr(home, start, needle);
  };

  const cleanAppend = function (home, ptr, needle, document, agree) {
    const [n, , end] = ptr;
    const total = (document[n] || []).length;
    // 'bark.' -> 'bark loudly.'
    const moved = agree && home[end - 1] && passClosing(home, end - 1, needle.at(-1));
    if (!moved && end < total) {
      // in the middle - add trailing space on self
      endSpace(needle);
    } else if (!moved) {
      // at the end - add a space to predecessor
      endSpace(home);
      // is there another sentence after?
      if (document[n + 1]) {
        needle.at(-1).post += ' ';
      }
    }
    spliceArr(home, ptr[2], needle);
    // set new endId
    ptr[4] = needle.at(-1).id;
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

  const pad3 = str => str.padStart(3, '0');

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
    id += i.toString(36).padStart(2, '0');

    // 1 digit random number
    const r = parseInt(Math.random() * 36, 10);
    id += (r).toString(36);

    return term.normal + '|' + id.toUpperCase()
  };

  // setInterval(() => console.log(toId(4, 12)), 100)

  // are we changing part of a contraction? expand it first
  const expandContraction = function (m) {
    if (m.has('@hasContraction') && m.contractions) {
      m.grow('@hasContraction').contractions().expand();
    }
  };

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
    if (Array.isArray(input)) {
      return Array.isArray(input[0]) ? input[0] : input
    }
    return []
  };

  // {agree: false} skips moving any capitals or punctuation
  const insert = function (input, view, prepend, opts = {}) {
    const agree = opts.agree !== false;
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
        expandContraction(view.update([ptr]).firstTerm());
        cleanPrepend(home, ptr, terms, document, agree);
      } else {
        expandContraction(view.update([ptr]).lastTerm());
        cleanAppend(home, ptr, terms, document, agree);
      }
      // harden the pointer
      if (document[n]?.[ptr[1]]) {
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
    return retag(doc, ['id', 'index'])
  };

  const fns$3 = {
    insertAfter: function (input, opts) {
      return insert(input, this, false, opts)
    },
    insertBefore: function (input, opts) {
      return insert(input, this, true, opts)
    },
  };
  fns$3.append = fns$3.insertAfter;
  fns$3.prepend = fns$3.insertBefore;
  fns$3.insert = fns$3.insertAfter;

  const dollarStub = /\$[0-9a-z]+/g;
  const fns$2 = {};

  // doc.replace('foo', (m)=>{})
  const replaceByFn = function (main, fn, keep) {
    const ptrs = [];
    main.forEach((m, i) => {
      const out = m.replaceWith(fn(m, i), keep);
      ptrs.push(...out.fullPointer);
    });
    // a full document needs no new pointer
    if (main.ptrs) {
      main.ptrs = ptrs;
    }
    return main
  };

  // support 'foo $0' replacements, using this match's own groups
  const subDollarSign = function (input, main, [n, start, end]) {
    const groups = main._groups;
    return input.replace(dollarStub, a => {
      const name = a.replace(/\$/, '');
      const ptrs = Object.hasOwn(groups, name) ? groups[name] : [];
      const found = ptrs.find(ptr => ptr[0] === n && ptr[1] >= start && ptr[2] <= end);
      if (found) {
        // any end-punctuation will be moved over from the original
        return main.update([found]).text({ keepEndPunct: false })
      }
      return a
    })
  };

  // remember each match, before we change it
  const getOriginal = function (terms) {
    const last = terms.at(-1);
    return {
      pre: terms[0].pre,
      post: last.post,
      isTitleCase: isTitleCase$2(terms[0].text),
      text: terms[0].text,
      isPossessive: last.tags.has('Possessive'),
      tags: terms.map(term => Array.from(term.tags)),
    }
  };

  // keep any punctuation, and "John's"
  const restoreOriginal = function (terms, original, keep) {
    const last = terms.at(-1);
    if (keep.possessives && original.isPossessive && !last.tags.has('Possessive')) {
      last.text += "'s";
      last.normal += "'s";
      last.tags.add('Possessive');
    }
    // try to keep some pre-punctuation
    if (original.pre) {
      terms[0].pre = original.pre;
    }
    // try to keep any post-punctuation
    if (original.post) {
      // the punctuation may have moved here without its spaces - ' - '
      const post = last.post.trim();
      if (!post || post === original.post.trim()) {
        last.post = original.post;
      }
    }
  };

  fns$2.replaceWith = function (input, keep = {}) {
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
    if (!main.found) {
      return main
    }
    if (typeof input === 'function') {
      return replaceByFn(main, input, keep)
    }
    // each match has its own '$0' text
    if (typeof input === 'string' && input.includes('$') && Object.keys(main._groups).length > 0) {
      const strs = main.fullPointer.map(ptr => subDollarSign(input, main, ptr));
      return replaceByFn(main, (_m, i) => strs[i], keep)
    }
    const originals = main.docs.map(getOriginal);
    // Preserve old Term identities for plugins before insertion/deletion changes the view.
    const replacements =
      this.world.methods.one.onReplace &&
      this.fullPointer.map(([n, start, end]) => ({
        sentence: this.document[n],
        before: new Set(this.document[n]),
        oldTerms: this.document[n].slice(start, end),
      }));
    const original = this.update(this.fullPointer);
    // slide this in
    if (typeof input === 'string') {
      input = this.fromText(input).compute('id');
    }
    // {agree: false} swaps the words, and nothing else
    const agree = keep.agree !== false;
    main.insertAfter(input, { agree });
    // New terms follow each old match; stop at an existing term to separate nearby matches.
    if (replacements) {
      replacements.forEach(group => {
        const start = group.sentence.indexOf(group.oldTerms.at(-1)) + 1;
        group.newTerms = [];
        for (let i = start; i < group.sentence.length && !group.before.has(group.sentence[i]); i += 1) {
          group.newTerms.push(group.sentence[i]);
        }
      });
    }
    // are we replacing part of a contraction?
    if (original.has('@hasContraction') && main.contractions) {
      const more = main.grow('@hasContraction+');
      more.contractions().expand();
    }
    // delete the original terms
    // (we restore the start of the phrase ourselves, below)
    // the new words take the sentence's capital, unless {case: false}
    // (we restore the punctuation ourselves, below)
    main.delete(original, { agree, start: keep.case !== false, end: false }); //science.

    // main now points at only the new terms
    if (agree) {
      main.docs.forEach((terms, i) => restoreOriginal(terms, originals[i], keep));
    }

    // what should we return?
    const m = retag(main.toView(), ['index']);
    // replace any old tags
    if (keep.tags) {
      m.forEach((match, i) => {
        match.terms().forEach((term, k) => term.tagSafe(originals[i].tags[k]));
      });
    }
    // try to co-erce case, too
    if (keep.case) {
      m.docs.forEach((terms, i) => {
        const transformCase = originals[i].isTitleCase ? toTitleCase$1 : toLowerCase;
        // 'DOGS' -> 'CATS'
        terms[0].text = matchCase$1(originals[i].text, transformCase(terms[0].text));
      });
    }
    // Transfer plugin metadata after replacement text, punctuation, and case are finalized.
    if (m.world.methods.one.onReplace) {
      replacements.forEach(({ oldTerms, newTerms }) => {
        m.world.methods.one.onReplace.forEach(fn => fn({ oldTerms, newTerms, document: m.document }));
      });
    }
    return m
  };

  fns$2.replace = function (match, input, keep) {
    if (match && input === undefined) {
      return this.replaceWith(match, keep)
    }
    const m = this.match(match);
    if (!m.found) {
      return this
    }
    this.soften();
    return m.replaceWith(input, keep)
  };

  // Remove only the first qualifying run, matching String.replace without /g.
  const removeRunBefore = (str, run, following) => {
    let i = 0;
    while (i < str.length) {
      if (!run.includes(str[i])) {
        i++;
        continue
      }
      const start = i;
      while (i < str.length && run.includes(str[i])) i++;
      if (i < str.length && following.includes(str[i])) {
        return str.slice(0, start) + str.slice(i)
      }
    }
    return str
  };

  // transfer sentence-ending punctuation
  const repairPunct = function (terms, len) {
    const last = terms.length - 1;
    const from = terms[last];
    const to = terms[last - len];
    if (to && from) {
      to.post += from.post; //this isn't perfect.
      to.post = removeRunBefore(to.post, ' ', '.?!,;:"”)]');
      // don't allow any silly punctuation outcomes like ',!'
      to.post = removeRunBefore(to.post, ',;:', '.?!');
    }
  };

  const pairs$3 = { '(': ')', '[': ']', '"': '"', '“': '”', '‘': '’' };

  // a quote or bracket that opens and closes on the removed words leaves with them - '(loudly)'
  const dropPairs = function (terms, start, end) {
    const first = terms[start];
    const last = terms[end - 1];
    Object.keys(pairs$3).forEach(open => {
      if (first.pre.includes(open) && last.post.includes(pairs$3[open])) {
        first.pre = first.pre.replace(open, '');
        last.post = last.post.replace(pairs$3[open], '');
      }
    });
  };

  // the word before us becomes the end of the phrase - 'bark loudly, and' -> 'bark, and'
  const repairEnd = function (terms, start, end) {
    const prev = terms[start - 1];
    const post = terms[end - 1].post;
    // is there anything to keep, and room to keep it?
    if (prev && /\S/.test(post) && !/\S/.test(prev.post)) {
      prev.post = post;
    }
  };

  // the words after us become the start of the phrase
  const repairStart = function (terms, start, end) {
    const next = terms[end];
    if (!next) {
      return
    }
    // '"the dogs' -> '"dogs'
    passOpening(terms[start], next);
    // 'The dogs' -> 'Dogs'
    if (start === 0) {
      passCapital(terms[start], next);
    }
  };

  // remove terms from document json
  const pluckOut = function (document, nots, opts = {}) {
    nots.forEach(ptr => {
      const [n, start, end] = ptr;
      const len = end - start;
      if (!document[n]) {
        return // weird!
      }
      if (opts.agree !== false) {
        dropPairs(document[n], start, end);
        if (end === document[n].length && end > 1) {
          repairPunct(document[n], len);
        } else if (opts.end !== false) {
          repairEnd(document[n], start, end);
        }
        if (opts.start !== false) {
          repairStart(document[n], start, end);
        }
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
          const lastTerm = terms.at(-1);
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

  // which sentences will have no terms left?
  const getEmptied = function (gonePtrs, document) {
    return Object.keys(gonePtrs).map(Number).filter(n => {
      const count = gonePtrs[n].reduce((sum, no) => sum + no[2] - no[1], 0);
      return document[n] && count >= document[n].length
    })
  };

  // gonePtrs must run from last-to-first, in each sentence
  const fixPointers$1 = function (ptrs, gonePtrs, emptied) {
    ptrs = ptrs.map(ptr => {
      const [n] = ptr;
      const gone = gonePtrs[n] || [];
      gone.forEach(no => {
        const len = no[2] - no[1];
        // does it effect our pointer?
        if (ptr[1] <= no[1] && ptr[2] >= no[2]) {
          ptr[2] -= len;
        } else if (ptr[1] >= no[2]) {
          // terms before our pointer are gone
          ptr[1] -= len;
          ptr[2] -= len;
        }
      });
      // sentences before our pointer are gone
      ptr[0] -= emptied.filter(k => k < n).length;
      // remove old hard-pointers
      ptr[3] = null;
      ptr[4] = null;
      return ptr
    });
    // remove any now-empty pointers
    return ptrs.filter(ptr => ptr[2] - ptr[1] > 0)
  };

  const methods$j = {
    // {agree: false} skips moving any capitals or punctuation
    remove: function (reg, opts) {
      const { indexN } = this.methods.one.pointer;
      // allow .remove({agree: false})
      if (reg && Object.hasOwn(reg, 'agree')) {
        opts = reg;
        reg = undefined;
      }
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
      expandContraction(not);

      let ptrs = self.fullPointer;
      const nots = not.fullPointer.reverse();
      const gonePtrs = indexN(nots);
      const emptied = getEmptied(gonePtrs, this.document);
      // remove them from the actual document)
      const document = pluckOut(this.document, nots, opts);
      // repair our pointers
      ptrs = fixPointers$1(ptrs, gonePtrs, emptied);
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

  // set or append the pre/post of the first/last term of each match
  const setSide = function (view, side, str, concat) {
    view.docs.forEach(terms => {
      const term = side === 'pre' ? terms[0] : terms.at(-1);
      if (concat === true) {
        term[side] += str;
      } else {
        term[side] = str;
      }
    });
    return view
  };

  // put these characters around each match
  const wrap$2 = function (view, start, end) {
    view.docs.forEach(terms => {
      terms[0].pre = start + terms[0].pre;
      const last = terms.at(-1);
      last.post = end + last.post;
    });
    return view
  };

  const methods$i = {
    /** add this punctuation or whitespace before each match: */
    pre: function (str, concat) {
      if (str === undefined && this.found) {
        return this.docs[0][0].pre
      }
      return setSide(this, 'pre', str, concat)
    },

    /** add this punctuation or whitespace after each match: */
    post: function (str, concat) {
      if (str === undefined) {
        const last = this.docs.at(-1);
        return last.at(-1).post
      }
      return setSide(this, 'post', str, concat)
    },

    /** remove whitespace from start/end */
    trim: function () {
      if (!this.found) {
        return this
      }
      const docs = this.docs;
      const start = docs[0][0];
      start.pre = start.pre.trimStart();
      const last = docs.at(-1);
      const end = last.at(-1);
      end.post = end.post.trimEnd();
      return this
    },

    /** connect words with hyphen, and remove whitespace */
    hyphenate: function () {
      //remove whitespace
      eachTerm(this.docs, (t, terms, i) => {
        if (i !== 0) {
          t.pre = '';
        }
        if (terms[i + 1]) {
          t.post = '-';
        }
      });
      return this
    },

    /** remove hyphens between words, and set whitespace */
    dehyphenate: function () {
      const hasHyphen = /[-–—]/;
      //remove whitespace
      eachTerm(this.docs, t => {
        if (hasHyphen.test(t.post)) {
          t.post = ' ';
        }
      });
      return this
    },

    /** add quotations around these matches */
    toQuotations: function (start, end) {
      return wrap$2(this, start || '"', end || '"')
    },

    /** add brackets around these matches */
    toParentheses: function (start, end) {
      return wrap$2(this, start || '(', end || ')')
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

  /** count the # of characters of each match - longest first */
  const length = (a, b) => b.normal.trim().length - a.normal.trim().length;

  /** count the # of terms in each match - most first */
  const wordCount$1 = (a, b) => b.words - a.words;

  /** document order - sentence, then start, then end of each match */
  const sequential = (a, b) => a.pointer[0] - b.pointer[0] || a.pointer[1] - b.pointer[1] || a.pointer[2] - b.pointer[2];

  /** sort by # of duplicates in the document*/
  const byFreq = function (arr) {
    const counts = Object.create(null);
    arr.forEach(o => {
      counts[o.normal] ??= 0;
      counts[o.normal] += 1;
    });
    // sort by freq - most first
    arr.sort((a, b) => counts[b.normal] - counts[a.normal]);
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
    const { docs } = this;
    this.uncache();
    if (typeof input === 'function') {
      return customSort(this, input)
    }
    input ||= 'alpha';
    const ptrs = rawPointer(this);
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
    const ptrs = [].concat(rawPointer(this)).reverse();
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

  // append a new document, somehow
  const combineDocs = function (homeDocs, inputDocs) {
    if (homeDocs.length > 0) {
      // add a space
      const end = homeDocs.at(-1);
      const last = end.at(-1);
      if (!/ /.test(last.post)) {
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
          const at = ptrs.at(-1)[0];
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
      if (Array.isArray(input)) {
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
    if (!ptr || ptr.length === 0) {
      return this
    }
    ptr = ptr.map(a => a.slice(0, 3));
    this.ptrs = ptr;
    return this
  };
  var harden$1 = { harden, soften };

  const methods$g = { ...caseFns, ...fns$3, ...fns$2, ...methods$j, ...methods$i, ...sort$1, ...concat, ...harden$1 };

  const addAPI$2 = function (View) {
    Object.assign(View.prototype, methods$g);
  };

  const compute$5 = {
    id: function (view) {
      eachTerm(view.docs, term => {
        term.id ||= toId(term);
      });
    }
  };

  var change = {
    api: addAPI$2,
    compute: compute$5,
  };

  // one 'word:out words' per line - decoded once into { [key]: word, out: [...] }
  const parse$3 = (str, key) =>
    str
      .trim()
      .split('\n')
      .map(s => {
        const [k, out] = s.trim().split(':');
        return { [key]: k, out: out.split(' ') }
      });

  var contractions$3 = [
    // that's and let's are decided here, before any tagging
    // (step 1 of the 's decision - the list is in 2-two/contraction-two/compute/index.js)
    // simple mappings
    ...parse$3(
      `
@:at
arent:are not
alot:a lot
brb:be right back
cannot:can not
dun:do not
can't:can not
shan't:should not
won't:will not
that's:that is
what's:what is
let's:let us
dunno:do not know
gonna:going to
gotta:have got to
gimme:give me
outta:out of
tryna:trying to
gtg:got to go
im:i am
imma:I will
imo:in my opinion
irl:in real life
ive:i have
rn:right now
tbh:to be honest
wanna:want to
c'mere:come here
c'mon:come on
shoulda:should have
coulda:could have
woulda:would have
musta:must have
tis:it is
twas:it was
y'know:you know
ne'er:never
o'er:over
  `,
      'word'
    ),
    // contraction-part mappings
    ...parse$3(
      `
ll:will
ve:have
re:are
m:am
  `,
      'after'
    ),
    // french contractions - t'aime
    ...parse$3(
      `
c:ce
m:me
n:ne
qu:que
s:se
t:tu
  `,
      'before'
    ),
    // missing apostrophes, apostrophe-d
    ...parse$3(
      `
shouldnt:should not
couldnt:could not
wouldnt:would not
hasnt:has not
wasnt:was not
isnt:is not
cant:can not
dont:do not
wont:will not
howd:how did
whatd:what did
whend:when did
whered:where did
  `,
      'word'
    ),
  ];

  // one entry per line, in a template string
  const toList = str => str.trim().split('\n').map(s => s.trim());

  // ['a', 'b'] → { a: true, b: true }
  const toHash = list => Object.fromEntries(list.map(s => [s, true]));

  // number suffixes that are not units
  // s=1990s, e=18e french/spanish ordinal, er=french 1er, ère/ème=french 2ème
  var numberSuffixes = toHash(toList(`
st
nd
rd
th
am
pm
max
°
s
e
er
ère
ème
`));

  var model$5 = {
    one: {
      contractions: contractions$3,
      numberSuffixes
    }
  };

  // Log decisions before splicing replaces the original term.
  const contractionDebug = (term, expansion) => {
    if (!debug$2.contractions || (debug$2.word && debug$2.word !== (term.normal || term.text).toLowerCase())) {
      return
    }
    debug$2.rule = undefined;
    const result = expansion ? '[' + expansion.map(word => yellow(`'${word}'`)).join(', ') + ']' : 'possessive (kept)';
    console.log(`${debug$2.prefix || '   '}${yellow(JSON.stringify(term.text))} →  ${result}`); // eslint-disable-line no-console
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

  const twoApostrophes = /^(.+)'(t|d|ll)'ve$/;

  // wouldn't've -> would not have,  i'd've -> i would have
  const doubled = function (terms, i) {
    const m = terms[i].normal.match(twoApostrophes);
    if (m === null) {
      return null
    }
    const head = m[1];
    if (m[2] === 'd') {
      return [head, 'would', 'have']
    }
    if (m[2] === 'll') {
      return [head, 'will', 'have']
    }
    // n't've - but can't've, won't've
    if (head === 'can') {
      return ['can', 'not', 'have']
    }
    if (head === 'won') {
      return ['will', 'not', 'have']
    }
    return [head.replace(/n$/, ''), 'not', 'have']
  };

  const hasContraction = /'/;
  const isFeminine = /(e|é|aison|sion|tion)$/;
  const isMasculine = /(age|isme|acle|ege|oire)$/;
  // l' words that end in e, but take le - accents are already stripped
  const masculineE = new Set(['homme', 'arbre', 'espace', 'exemple', 'ordre', 'ange', 'etre', 'ete', 'empire', 'oncle', 'angle', 'article', 'orchestre', 'insecte', 'episode']);
  // l' words that take la, without ending in e
  const feminineEnd = /(eau|tion|sion)$/;
  // the word after the apostrophe
  const getAfter = (terms, i) => terms[i].normal.split(hasContraction)[1];

  // l'amour, l'homme, l'eau
  const preL = (terms, i) => {
    // le/la
    const after = getAfter(terms, i);
    // quick french gender disambig (rough)
    if (after && ((after.endsWith('e') && !masculineE.has(after)) || feminineEnd.test(after))) {
      return ['la', after]
    }
    return ['le', after]
  };

  // d'amerique
  const preD = (terms, i) => {
    const after = getAfter(terms, i);
    // quick guess for noun-agreement (rough)
    if (after && isFeminine.test(after) && !isMasculine.test(after)) {
      return ['du', after]
    } else if (after && after.endsWith('s')) {
      return ['des', after]
    }
    return ['de', after]
  };

  // j'aime
  const preJ = (terms, i) => ['je', getAfter(terms, i)];

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
      if (term.tags.has('PhoneNumber') || phoneNum.test(term.text)) {
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
      if (Object.hasOwn(notUnit, unit)) {
        return null
      }
      return [parts[1], unit] //split it
    }
    return null
  };

  const byApostrophe = /'/;
  const numDash = /^[0-9][^-–—]*[-–—].*?[0-9]/;

  // poor-mans reindexing of this sentence only
  const reIndex = function (terms) {
    terms.forEach((t, i) => {
      if (t.index) {
        t.index[1] = i;
      }
    });
  };

  const byEnd = {
    // ain't
    t: apostropheT,
    // how'd
    d: _apostropheD,
  };

  const byStart = {
    // j'aime
    j: french.preJ,
    // l'amour
    l: french.preL,
    // d'amerique
    d: french.preD,
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

  // turn the words into terms, and put them where the contraction was
  const expand$1 = function (words, view, document, n, i) {
    contractionDebug(document[n][i], words);
    const doc = view.fromText(words.join(' '));
    doc.compute(['id', 'alias']);
    words = doc.docs[0];
    insertContraction(document, [n, i], words);
    return words
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
      const len = terms.length;
      // loop through terms backwards
      for (let i = terms.length - 1; i >= 0; i -= 1) {
        // already expanded - this runs on the whole document, and must be re-runnable
        if (terms[i].implicit) {
          continue
        }
        let before = null;
        let after = null;
        if (byApostrophe.test(terms[i].normal)) {
          const res = terms[i].normal.split(byApostrophe);
          before = res[0];
          after = res[1];
        }
        // wouldn't've, then any known-ones, like 'dunno'
        let words = doubled(terms, i) || knownOnes(list, terms[i], before, after);
        // ['foo', 's']
        if (!words && Object.hasOwn(byEnd, after)) {
          words = byEnd[after](terms, i, world);
        }
        // ['j', 'aime']
        if (!words && Object.hasOwn(byStart, before)) {
          words = byStart[before](terms, i);
        }
        // 'there is' vs 'there has'
        if (before === 'there' && after === 's') {
          words = thereHas(terms, i);
        }
        // actually insert the new terms
        if (words) {
          expand$1(words, view, document, n, i);
          continue
        }
        // '44-2' has special care
        if (numDash.test(terms[i].normal)) {
          words = numberRange(terms, i);
          if (words) {
            words = expand$1(words, view, document, n, i);
            methods.one.setTag(words, 'NumberRange', world); //add custom tag
            // is it a time-range, like '5-9pm'
            if (words[2] && words[2].tags.has('Time')) {
              methods.one.setTag([words[0]], 'Time', world, null, 'time-range');
            }
          }
          continue
        }
        // split-apart '4km'
        words = numberUnit(terms, i, world);
        if (words) {
          words = expand$1(words, view, document, n, i);
          methods.one.setTag([words[1]], 'Unit', world, null, 'contraction-unit');
        }
      }
      // new terms shift the indexes of any terms after them
      if (terms.length !== len) {
        reIndex(terms);
      }
    });
  };

  var compute$4 = { contractions: contractions$2 };

  const plugin$1 = {
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

    eachTerm(view.docs, (t, terms, i) => {
      // basic lexicon lookup
      const word = t.machine || t.normal;

      // test a multi-word
      if (multi[word] !== undefined && terms[i + 1]) {
        const end = i + multi[word] - 1;
        for (let k = end; k > i; k -= 1) {
          const words = terms.slice(i, k + 1);
          const str = words.map(term => term.machine || term.normal).join(' ');
          // lookup frozen lexicon
          if (Object.hasOwn(frozenLex, str)) {
            setTag(words, frozenLex[str], world, false, '1-frozen-multi-lexicon');
            words.forEach(term => (term.frozen = true));
          }
        }
      }
      // test single word
      if (frozenLex[word] !== undefined && Object.hasOwn(frozenLex, word)) {
        setTag([t], frozenLex[word], world, false, '1-freeze-lexicon');
        t.frozen = true;
      }
    });
  };

  const unfreeze = function (view) {
    eachTerm(view.docs, term => {
      delete term.frozen;
    });
    return view
  };
  var compute$3 = { frozen: freeze$1, freeze: freeze$1, unfreeze };

  var freeze = {
    // add .compute('freeze')
    compute: compute$3,

    mutate: world => {
      const methods = world.methods.one;
      // add @isFrozen method
      methods.termMethods.isFrozen = term => term.frozen === true;
      // `.debug('frozen')` is the tags view, which marks frozen terms
      methods.debug.freeze = view => methods.debug.tags(view);
      methods.debug.frozen = methods.debug.freeze;
    },

    api: function (View) {
      // set all terms to reject any desctructive tags
      View.prototype.freeze = function () {
        eachTerm(this.docs, term => {
          term.frozen = true;
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
        if (Object.hasOwn(lexicon, str)) {
          const tag = lexicon[str];
          // 'is off-white' is not the phrasal verb 'is off'.
          if (tag && tag.includes('PhrasalVerb') && words[words.length - 1].post === '-') {
            continue
          }
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

  const prefix$3 = /^(under|over|mis|re|un|dis|semi|pre|post)-?/;
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
    if (lexicon[word] !== undefined && Object.hasOwn(lexicon, word)) {
      setTag([t], lexicon[word], world, false, '1-lexicon');
      return true
    }
    // '#gojetsgo' can be in the lexicon with its hash
    if (t.machine && Object.hasOwn(lexicon, t.normal)) {
      setTag([t], lexicon[t.normal], world, false, '1-lexicon-normal');
      return true
    }
    // lookup aliases in the lexicon
    if (t.alias) {
      const found = t.alias.find(str => Object.hasOwn(lexicon, str));
      if (found) {
        setTag([t], lexicon[found], world, false, '1-lexicon-alias');
        return true
      }
    }
    // prefixing for verbs/adjectives
    if (prefix$3.test(word)) {
      const stem = word.replace(prefix$3, '');
      if (Object.hasOwn(lexicon, stem) && stem.length > 3) {
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
    eachTerm(view.docs, (term, terms, i) => {
      if (term.tags.size === 0) {
        let found = null;
        found ||= multiWord(terms, i, world);
        // lookup known words
        found ||= checkLexicon(terms, i, world);
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
      lex[word] ||= tag;
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
    Object.entries(words).forEach(([k, v]) => {
      if (typeof v === 'string' && v.startsWith('#')) {
        words[k] = v.replace(/^#/, '');
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
        if (goNext[curr] && Object.hasOwn(goNext[curr], word)) {
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

    while (xs.length > 0) {
      const r = xs.shift();
      // for each symbol a such that g(r, a) = s
      const keys = Object.keys(goNext[r]);
      for (let i = 0; i < keys.length; i += 1) {
        const word = keys[i];
        const s = goNext[r][word];
        xs.push(s);
        // set state = f(r)
        n = failTo[r];
        while (n > 0 && !Object.hasOwn(goNext[n], word)) {
          n = failTo[n];
        }
        if (Object.hasOwn(goNext, n)) {
          const fs = goNext[n][word];
          failTo[s] = fs;
          if (endAs[fs]) {
            endAs[s] ||= [];
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
      while (n > 0 && (trie.goNext[n] === undefined || !Object.hasOwn(trie.goNext[n], word))) {
        n = trie.failTo[n] || 0; // (usually back to 0)
      }
      // did we fail?
      if (!Object.hasOwn(trie.goNext[n], word)) {
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
      if (cache.has(words[i])) {
        return false
      }
    }
    return true
  };

  const scan = function (view, trie, opts) {
    let results = [];
    opts.form ||= 'normal';
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

  function api$f (View) {

    /** find all matches in this document */
    View.prototype.lookup = function (input, opts = {}) {
      if (!input) {
        return this.none()
      }
      if (typeof input === 'string') {
        input = [input];
      }
      const trie = isObject$1(input) ? input : buildTrie(input, this.world);
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

  var lookup$1 = {
    api: api$f,
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

  // did they pass-in a compromise object?
  const isView = val => val && isObject$1(val) && val.isView === true;

  const isNet = val => val && isObject$1(val) && val.isNet === true;

  // sweep options when only finding, not tagging
  const noTag = { tagger: false };

  // parse the match-syntax, then run it over the docs
  const doMatch = (view, regs, group, opts, justOne) => {
    regs = parseRegs(regs, opts, view.world);
    return view.methods.one.match(view.docs, { regs, group, justOne }, view._cache)
  };

  // turn match results into a view
  const asView = (view, res) => {
    const { ptrs, byGroup } = fixPointers(res, view.fullPointer);
    const out = view.toView(ptrs);
    out._groups = byGroup;
    return out
  };

  const match$1 = function (regs, group, opts) {
    // support param as view object
    if (isView(regs)) {
      return this.intersection(regs)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, noTag).view.settle()
    }
    return asView(this, doMatch(this, regs, group, opts))
  };

  const matchOne = function (regs, group, opts) {
    // support at view as a param
    if (isView(regs)) {
      return this.intersection(regs).eq(0)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, { tagger: false, matchOne: true }).view
    }
    return asView(this, doMatch(this, regs, group, opts, true))
  };

  const has$3 = function (regs, group, opts) {
    // support view as input
    if (isView(regs)) {
      return this.intersection(regs).fullPointer.length > 0
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, noTag).view.found
    }
    return doMatch(this, regs, group, opts, true).ptrs.length > 0
  };

  // keep only the matches that do (or don't) contain this match
  const ifBy = want => function (regs, group, opts) {
    // support view as input
    if (isView(regs)) {
      return this.filter(m => m.intersection(regs).found === want)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      const m = this.sweep(regs, noTag).view.settle();
      return this.filter(v => v.intersection(m).found === want)
    }
    // otherwise parse the match string
    regs = parseRegs(regs, opts, this.world);
    const todo = { regs, group, justOne: true };
    const cache = this._cache || [];
    const view = this.filter((m, i) => {
      return (this.methods.one.match(m.docs, todo, cache[i]).ptrs.length > 0) === want
    });
    // try to reconstruct the cache
    if (this._cache) {
      view._cache = view.ptrs.map(ptr => cache[ptr[0]]);
    }
    return view
  };

  var match$2 = { matchOne, match: match$1, has: has$3, if: ifBy(true), ifNo: ifBy(false) };

  // the words before (or after) each match, in its sentence
  const lookaround = function (view, isAfter, regs, group, opts) {
    const { indexN } = view.methods.one.pointer;
    const { document } = view;
    const dir = isAfter ? -1 : 1;
    const ptrs = [];
    const byN = indexN(view.fullPointer);
    Object.keys(byN).forEach(k => {
      // check only the earliest (or latest) match in the sentence
      const [n, start, end] = byN[k].sort((a, b) => (a[1] > b[1] ? dir : -dir))[0];
      if (isAfter) {
        if (end < document[n].length) {
          ptrs.push([n, end, document[n].length]);
        }
      } else if (start > 0) {
        ptrs.push([n, 0, start]);
      }
    });
    const words = view.toView(ptrs);
    if (!regs) {
      return words
    }
    return words.match(regs, group, opts)
  };

  // extend each match left (or right), while the terms beside it match
  const growSide = function (view, isRight, regs, group, opts) {
    if (typeof regs === 'string') {
      regs = view.world.methods.one.parseMatch(regs, opts, view.world);
    }
    // ensure matches are beside us
    if (isRight) {
      regs[0].start = true;
    } else {
      regs[regs.length - 1].end = true;
    }
    const ptrs = view.fullPointer;
    view.forEach((m, n) => {
      const more = isRight ? m.after(regs, group) : m.before(regs, group);
      if (more.found) {
        const terms = more.terms();
        if (isRight) {
          ptrs[n][2] += terms.length;
          ptrs[n][4] = null; //remove end-id
        } else {
          ptrs[n][1] -= terms.length;
          ptrs[n][3] = terms.docs[0][0].id;
        }
      }
    });
    return view.update(ptrs)
  };

  // bind a direction to a method
  const side = (fn, flag) => function (regs, group, opts) {
    return fn(this, flag, regs, group, opts)
  };

  const grow = function (regs, group, opts) {
    return this.growRight(regs, group, opts).growLeft(regs, group, opts)
  };

  var lookaround$1 = {
    before: side(lookaround, false),
    after: side(lookaround, true),
    growLeft: side(growSide, false),
    growRight: side(growSide, true),
    grow,
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
      byN[ref[0]] ||= [];
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

  // turn a match-string, array, or view into a view
  const getDoc$1 = (reg, view, group) => {
    if (typeof reg === 'string' || Array.isArray(reg)) {
      return view.match(reg, group)
    }
    if (!reg) {
      return view.none()
    }
    // support pre-parsed reg object
    return reg
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

  const combine = function (left, right) {
    return [left[0], left[1], right[2]]
  };

  const addIds$1 = function (ptr, view) {
    const [n, start, end] = ptr;
    if (view.document[n]?.[start]) {
      ptr[3] ||= view.document[n][start].id;
      if (view.document[n][end - 1]) {
        ptr[4] ||= view.document[n][end - 1].id;
      }
    }
    return ptr
  };

  // split each match, then collect the pieces into pointers
  const split = function (view, m, group, collect) {
    const { splitAll } = view.methods.one.pointer;
    const splits = getDoc$1(m, view, group).fullPointer;
    const all = splitAll(view.fullPointer, splits);
    const res = collect(all).filter(p => p).map(p => addIds$1(p, view));
    return view.update(res)
  };

  const methods$e = {};
  // [before], [match], [after]
  methods$e.splitOn = function (m, group) {
    return split(this, m, group, all => all.flatMap(o => [o.passthrough, o.before, o.match, o.after]))
  };

  // [before], [match after]
  methods$e.splitBefore = function (m, group) {
    return split(this, m, group, all => {
      // repair matches to favor [match, after]
      // - instead of [before, match]
      for (let i = 0; i < all.length; i += 1) {
        // move a before to a preceding after
        if (!all[i].after && all[i + 1]?.before) {
          // ensure it's from the same original sentence
          if (all[i].match && all[i].match[0] === all[i + 1].before[0]) {
            all[i].after = all[i + 1].before;
            delete all[i + 1].before;
          }
        }
      }
      return all.flatMap(o => {
        // a, [x, b]
        if (o.match && o.after) {
          return [o.passthrough, o.before, combine(o.match, o.after)]
        }
        // a, [x], b
        return [o.passthrough, o.before, o.match]
      })
    })
  };

  // [before match], [after]
  methods$e.splitAfter = function (m, group) {
    return split(this, m, group, all => all.flatMap(o => {
      if (o.before && o.match) {
        return [o.passthrough, combine(o.before, o.match), o.after]
      }
      return [o.passthrough, o.before, o.match, o.after]
    }))
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
    lMatch ||= '.$'; //defaults
    rMatch ||= '^.';
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

  const methods$c = { ...match$2, ...lookaround$1, ...methods$e, ...methods$d };
  // aliases
  methods$c.lookBehind = methods$c.before;
  methods$c.lookBefore = methods$c.before;

  methods$c.lookAhead = methods$c.after;
  methods$c.lookAfter = methods$c.after;

  methods$c.notIf = methods$c.ifNo;
  const matchAPI = function (View) {
    Object.assign(View.prototype, methods$c);
  };

  // Split parenthesized match blocks without retrying long rejected prefixes or
  // bodies. Preserve the original grammar, including its greedy capture header.
  const prefix$2 = new Set('!~[^');
  const suffix$1 = new Set('?]+*$~{},0123456789');
  const whitespace$2 = /\s/;

  const splitGroups = str => {
    if (!str.includes('(') || !str.includes(')')) return [str]
    const length = str.length;
    const afterSuffix = new Uint32Array(length + 1);
    const bodyEnd = new Uint32Array(length);
    const captureEnd = new Uint32Array(length);
    afterSuffix[length] = length;
    let close = -1;
    let capture = 0;
    for (let i = length - 1; i >= 0; i--) {
      afterSuffix[i] = suffix$1.has(str[i]) ? afterSuffix[i + 1] : i;
      if (str[i] === ')') close = i;
      if (str[i] === '(' && close >= i + 3 && str[close - 1] !== '\\') {
        const end = afterSuffix[close + 1];
        if (end === length || whitespace$2.test(str[end])) bodyEnd[i] = end;
      }
      // The optional <...> header cannot cross another '<', and prefers the
      // rightmost '>' which is followed by a valid parenthesized block.
      if (str[i] === '<') {
        captureEnd[i] = capture;
        capture = 0;
      } else if (str[i] === '>' && !capture) {
        // the block may be negative - [<name>!(a|b)]
        capture = bodyEnd[str[i + 1] === '!' ? i + 2 : i + 1] || 0;
      }
    }
    const parts = [];
    let previous = 0;
    let i = 0;
    while (i < length) {
      const start = i;
      while (i < length && prefix$2.has(str[i])) i++;
      const end = str[i] === '<' ? captureEnd[i] : bodyEnd[i];
      if (end) {
        parts.push(str.slice(previous, start), str.slice(start, end));
        // The old delimiter consumes one following whitespace character.
        i = end < length ? end + 1 : end;
        previous = i;
      } else if (i === start) {
        i++;
      }
    }
    parts.push(str.slice(previous));
    return parts
  };

  // Split out /regex/ tokens - 'foo /yes/' and not 'foo/no/bar' - in linear time.
  // Has the grammar of this pattern, which rescans the line for each rejected opener:
  // (?:^|\s)([![^]*(?:<[^<]*>)?\/.*?[^\\/]\/[?\]+*$~]*)(?=\s|$)
  const prefix$1 = new Set('![^');
  const suffix = new Set('?]+*$~');
  const newline = new Set('\n\r  '); // what '.' can't cross
  const whitespace$1 = /\s/;

  const splitRegs = str => {
    if (!str.includes('/')) {
      return [str]
    }
    const length = str.length;
    const afterSuffix = new Uint32Array(length + 1);
    const ends = new Uint32Array(length); // a token's end, by its opening '/' or '<'
    afterSuffix[length] = length;
    let close = 0; // the nearest valid closing, for a body starting at i+1
    let capture = 0; // the rightmost valid '>' wins, and it can't cross another '<'
    for (let i = length - 1; i >= 0; i--) {
      if (str[i] === '/') {
        ends[i] = close;
      }
      afterSuffix[i] = suffix.has(str[i]) ? afterSuffix[i + 1] : i;
      if (newline.has(str[i])) {
        close = 0;
      }
      if (str[i + 1] === '/' && str[i] !== '/' && str[i] !== '\\') {
        const end = afterSuffix[i + 2];
        if (end === length || whitespace$1.test(str[end])) {
          close = end;
        }
      }
      if (str[i] === '<') {
        ends[i] = capture;
        capture = 0;
      } else if (str[i] === '>' && !capture && str[i + 1] === '/') {
        capture = ends[i + 1];
      }
    }
    const parts = [];
    let previous = 0;
    // -1 stands in for the '^' start
    for (let i = -1; i < length; i++) {
      if (i === -1 || whitespace$1.test(str[i])) {
        let start = i + 1;
        while (prefix$1.has(str[start])) {
          start++;
        }
        const end = ends[start];
        if (end) {
          parts.push(str.slice(previous, Math.max(i, 0)), str.slice(i + 1, end));
          // the whitespace after this token can also open the next one
          previous = end + 1;
          i = end - 1;
        }
      }
    }
    parts.push(str.slice(previous));
    return parts
  };

  // any whitespace separates terms, the same as the tokenizer
  const byWord = /\s+/;

  const isBlock = str => {
    return /^[![^]*(<[^<]*>)?!?\(/.test(str) && /\)[?\]+*$~{},0-9]*$/.test(str)
  };
  const isReg = str => {
    return /^[![^]*(<[^<]*>)?\//.test(str) && /\/[?\]+*$~]*$/.test(str)
  };
  const never = () => false;

  const cleanUp = function (arr) {
    arr = arr.map(str => str.trim());
    arr = arr.filter(str => str);
    return arr
  };

  const parseBlocks = function (txt, opts = {}) {
    // {noRegex} - slashes are plain characters
    const isRegex = opts.noRegex ? never : isReg;
    // parse by /regex/ first
    const arr = opts.noRegex ? [txt] : splitRegs(txt);
    let res = [];
    // parse by (blocks), next
    arr.forEach(str => {
      if (isRegex(str)) {
        res.push(str);
        return
      }
      res = res.concat(splitGroups(str));
    });
    res = cleanUp(res);
    // split by spaces, now - but not inside (blocks) or /regexes/
    const final = res.flatMap(str => {
      if (isBlock(str) || isRegex(str)) {
        return str
      }
      return str.split(byWord)
    });
    return cleanUp(final)
  };

  const hasMinMax = /\{([0-9]+)?(, *[0-9]*)?\}/;
  const andSign = /&&/;
  // const hasDash = /\p{Letter}[-–—]\p{Letter}/u
  const captureName = /^<\s*([^\s>]+)\s*>/;
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
  // is the token wrapped in these chars, like (foo)
  const wrapped = (str, a, b = a) => start(str) === a && end(str) === b;
  //
  const parseToken = function (w, opts, aliases) {
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
          if (!res) {
            throw new SyntaxError('Invalid named capture: expected [<name> ...]')
          }
          if (res.length >= 2) {
            obj.group = res[1];
            w = w.replace(res[0], '');
          }
        }
      }
      //back-flags
      if (end(w) === '+' && !w.endsWith('\\+')) {
        obj.greedy = true;
        w = stripEnd(w);
      }
      // 'foo*' is zero or more
      if (w !== '*' && end(w) === '*' && !w.endsWith('\\*')) {
        obj.greedy = true;
        obj.optional = true;
        w = stripEnd(w);
      }
      if (start(w) === '!') {
        obj.negative = true;
        // obj.optional = true
        w = stripStart(w);
      }
      //soft-match
      if (wrapped(w, '~') && w.length > 2) {
        w = stripBoth(w);
        obj.fuzzy = true;
        obj.min = opts.fuzzy ?? 0.85;
        if (!/\(/.test(w)) {
          obj.word = w;
          return obj
        }
      }

      //regex - {noRegex} leaves it as a plain word, to avoid redos from user-input
      if (wrapped(w, '/') && w.length > 2 && !opts.noRegex) {
        w = stripBoth(w);
        if (opts.caseSensitive) {
          obj.use = 'text';
        }
        obj.regex = new RegExp(w); //potential vuln - security/detect-non-literal-regexp
        return obj
      }

      // support foo{1,9}
      if (hasMinMax.test(w)) {
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
      if (wrapped(w, '(', ')')) {
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
          return str.split(/\s+/).map(s => parseToken(s, opts, aliases))
        });
        w = '';
      }

      //root/sense overloaded
      if (wrapped(w, '{', '}')) {
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
      if (wrapped(w, '<', '>')) {
        w = stripBoth(w);
        obj.chunk = titleCase$1(w);
        obj.greedy = true;
        return obj
      }
      if (wrapped(w, '%')) {
        w = stripBoth(w);
        obj.switch = w;
        return obj
      }
    }
    //do the actual token content
    if (start(w) === '#') {
      const name = stripStart(w);
      obj.tag = aliases?.[name];
      if (!obj.tag) {
        obj.tag = titleCase$1(name);
        obj.tag = aliases?.[obj.tag] || obj.tag;
      }
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
      w = w.replace('\\+', '+');
      w = w.replace('\\/', '/');
      if (opts.caseSensitive) {
        obj.use = 'text';
      } else {
        w = w.toLowerCase();
      }
      obj.word = w;
    }
    return obj
  };

  // Text recognition, rather than full email/URL validation. Share these rules with
  // the tagger so hyphens in recognized addresses survive tokenization.
  const email = /^[\w.!#$%&'*+/=?^`{|}~-]+@(?:[\w-]+\.)+[a-z]{2,}$/i;
  const explicitUrl = /^(?:https?:(?:\/\/)?|www\.)(?:[a-z0-9-]+\.)+[a-z]{2,}(?::[0-9]+)?(?:[/?#]\S*)?$/i;
  const bareUrl = /^(?:[a-z0-9-]+\.)+(?:com|net|gov|org|ly|edu|info|biz|dev|ru|jp|de|in|uk|br|io|ai)(?::[0-9]+)?(?:[/?#]\S*)?$/i;

  const isWebToken = function (str) {
    if (!str.includes('.')) {
      return false
    }
    let start = 0;
    let end = str.length;
    while (start < end && /[\s("'“‘<]/.test(str[start])) start++;
    while (end > start && /[\s).,!?:;"'”’>]/.test(str[end - 1])) end--;
    const text = str.slice(start, end);
    return email.test(text) || explicitUrl.test(text) || bareUrl.test(text)
  };

  const hasHyphen$1 = function (str, model) {
    const parts = str.split(/[-–—]/);
    if (parts.length <= 1) {
      return false
    }
    if (isWebToken(str)) {
      return false
    }
    const { prefixes, suffixes } = model.one;

    // l-theanine, x-ray
    if (parts[0].length === 1 && /[a-z]/i.test(parts[0])) {
      return false
    }
    //dont split 're-do'
    if (Object.hasOwn(prefixes, parts[0])) {
      return false
    }
    //dont split 'flower-like'
    parts[1] = parts[1].trim().replace(/[.?!]$/, '');
    if (Object.hasOwn(suffixes, parts[1])) {
      return false
    }
    //letter-number 'aug-20'
    const reg = /^([a-z\u00C0-\u00FF`"'/]+)[-–—]([a-z0-9\u00C0-\u00FF].*)/i;
    if (reg.test(str)) {
      return true
    }
    //number-letter '20-aug'
    const reg2 = /^[('"]?([0-9]{1,4})[-–—]([a-z\u00C0-\u00FF`"'/-]+[)'"]?$)/i;
    if (reg2.test(str)) {
      return true
    }
    return false
  };

  const splitHyphens$1 = function (word) {
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

  // match 're-do' -> ['re','do']
  // split them the same way the tokenizer does - 'x-ray' stays one word
  const splitHyphens = function (regs, world) {
    for (let i = regs.length - 1; i >= 0; i -= 1) {
      const reg = regs[i];
      if (reg.word && hasHyphen$1(reg.word, world.model)) {
        let words = reg.word.split(/[-–—]/g);
        words = words.filter(w => w).reverse();
        regs.splice(i, 1);
        words.forEach(w => {
          const obj = { ...reg };
          obj.word = w;
          regs.splice(i, 0, obj);
        });
      }
    }
    return regs
  };

  // add all inflections of this verb/noun/adjective
  const inflect = function (token, world, kind, fallback) {
    const { all } = world.methods.two.transform[kind] || {};
    if (!all) {
      return fallback
    }
    return all(token.root, world.model)
  };

  // explicitly-set POS - '{sweet/adjective}'
  const byPos = { Verb: 'verb', Noun: 'noun', Adjective: 'adjective' };

  // turn '{walk}' into 'walking', 'walked', etc
  const inflectRoot = function (regs, world) {
    // do we have compromise/two?
    regs = regs.map(token => {
      // a reg to convert '{foo}'
      if (token.root) {
        // check if compromise/two is loaded
        if (world.methods.two && world.methods.two.transform) {
          let choices = [];
          if (token.pos) {
            if (Object.hasOwn(byPos, token.pos)) {
              const kind = byPos[token.pos];
              choices = inflect(token, world, kind, kind === 'verb' ? [] : [token.root]);
            }
          } else {
            // do verb/noun/adj by default
            choices = [
              ...inflect(token, world, 'verb', []),
              ...inflect(token, world, 'noun', [token.root]),
              ...inflect(token, world, 'adjective', [token.root]),
            ];
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
    opts ||= {};
    if (typeof input === 'number') {
      input = String(input); //go for it?
    }
    let tokens = parseBlocks(input, opts);
    //turn them into objects
    tokens = tokens.map(str => parseToken(str, opts, world.model.one.tagAliases));
    // '~re-do~'
    tokens = splitHyphens(tokens, world);
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
      if (reg.word !== undefined && !cache.has(reg.word)) {
        return true
      }
      // is the tag missing?
      if (reg.tag !== undefined && !cache.has('#' + reg.tag)) {
        return true
      }
      // are all of the fast-or words missing?
      if (reg.fastOr !== undefined && !anyIntersection(reg.fastOr, cache)) {
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

  const hasHyphen = /^[-–—]$/;
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
    hasHyphen: term => hasHyphen.test(term.post) || hasHyphen.test(term.pre),
    /** a dash separates words - like that */
    hasDash: term => hasDash$1.test(term.post) || hasDash$1.test(term.pre),
    /** is it multiple words combinded */
    hasContraction: term => Boolean(term.implicit),
    /** is it an acronym */
    isAcronym: term => term.tags.has('Acronym'),
    /** does it have any tags */
    isKnown: term => term.tags.size > 0,
    /** uppercase first letter, then a lowercase - also 'Tis */
    isTitleCase: term => /^['\u2019]?\p{Lu}[a-z'\u00C0-\u00FF]/u.test(term.text),
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
      return term.tags.has(reg.tag)
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
      if (reg.regex.global || reg.regex.sticky) {
        const lastIndex = reg.regex.lastIndex;
        try {
          reg.regex.lastIndex = 0;
          return reg.regex.test(str)
        } finally {
          reg.regex.lastIndex = lastIndex;
        }
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
    // each choice is a list of tokens - this term can only test the first one
    if (reg.choices !== undefined) {
      // try to support && operator
      if (reg.operator === 'and') {
        // must match them all
        return reg.choices.every(r => wrapMatch(term, r[0], index, length))
      }
      // or must match one
      return reg.choices.some(r => wrapMatch(term, r[0], index, length))
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

  const getGroup$1 = function (state, term_index) {
    // Most attempts fail without capturing anything.
    if (!state.groups) {
      state.groups = {};
    }
    if (state.groups[state.inGroup]) {
      return state.groups[state.inGroup]
    }
    state.groups[state.inGroup] = {
      start: term_index,
      length: 0,
    };
    return state.groups[state.inGroup]
  };

  // add any terms used since startAt, to the current capture
  const logGroup = function (state, startAt) {
    if (state.hasGroup === true && state.t > startAt) {
      getGroup$1(state, startAt).length += state.t - startAt;
    }
  };

  // test the reg against the term at array-index t
  const matchAt = (state, reg, t) => wrapMatch(state.terms[t], reg, state.start_i + t, state.phrase_length);

  // anchors should not apply to repeated terms
  const noAnchors = reg => ({ ...reg, start: false, end: false });

  // how many terms a match must have - optional and negative regs don't count
  const getMinLength = regs => regs.filter(reg => reg.optional !== true && reg.negative !== true).length;

  // for greedy checking, we no longer care about the reg.start
  // value, and leaving it can cause failures for anchored greedy
  // matches.  ditto for end-greedy matches: we need an earlier non-
  // ending match to succceed until we get to the actual end.
  const getGreedy = function (state, endReg) {
    const reg = noAnchors(state.regs[state.r]);
    const start = state.t;
    for (; state.t < state.terms.length; state.t += 1) {
      // the number of terms we've matched, if we stop here
      const count = state.t - start + 1;
      //stop for next-reg match - unless we're still under our min
      if (endReg && matchAt(state, endReg, state.t)) {
        if (reg.min === undefined || count >= reg.min) {
          return state.t
        }
      }
      // is it max-length now?
      if (reg.max !== undefined && count === reg.max) {
        return state.t
      }
      //stop here
      if (matchAt(state, reg, state.t) === false) {
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
      if (matchAt(state, nextReg, t) === true) {
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
        const tmpReg = { ...reg, end: false };
        if (matchAt(state, tmpReg, state.t) === true) {
          // console.log(`endGreedy ${state.terms[state.t].normal}`)
          return true
        }
      }
    }
    return false
  };

  //support 'unspecific greedy' .* properly
  // its logic is 'greedy until', where it's looking for the next token
  // '.+ foo' means we check for 'foo', indefinetly
  const doAstrix = function (state) {
    const { regs } = state;
    const reg = regs[state.r];

    const skipto = greedyTo(state, regs[state.r + 1]);
    //maybe we couldn't find it
    if (skipto === null || skipto === state.offset) {
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
      if (matchAt(state, cr, t) !== true) {
        return 0
      }
      len += 1;
      // this can be greedy - '(foo+ bar)'
      if (cr.greedy === true) {
        // like getGreedy, anchors should not apply to the repeated terms
        const gr = noAnchors(cr);
        for (let i = t + 1; i < state.terms.length; i += 1) {
          if (matchAt(state, gr, i) !== true) {
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
      if (!Array.isArray(regs)) {
        return 0
      }
      const len = tryChoice(state, regs, skipN);
      if (len > 0) {
        return len
      }
    }
    return 0
  };

  const tryAndBlock = function (state, skipN) {
    let longest = 0;
    // all blocks must match, and we return the greediest match
    const reg = state.regs[state.r];
    const allDidMatch = reg.choices.every(block => {
      //  for multi-word blocks, all must match
      const allWords = block.every((cr, w_index) => {
        const tryTerm = state.t + skipN + w_index;
        if (state.terms[tryTerm] === undefined) {
          return false
        }
        return matchAt(state, cr, tryTerm)
      });
      if (allWords === true && block.length > longest) {
        longest = block.length;
      }
      return allWords
    });
    if (allDidMatch === true) {
      return longest
    }
    return 0
  };

  // match a block, and keep going if it's greedy - '(a b|c)+', '(a && b){2,3}'
  const repeatBlock = function (state, tryBlock) {
    const reg = state.regs[state.r];
    let skipN = tryBlock(state, 0);
    if (skipN === 0 || reg.greedy !== true) {
      return skipN
    }
    const next = state.regs[state.r + 1];
    let count = 1;
    while (count !== reg.max) {
      const t = state.t + skipN;
      const term = state.terms[t];
      const hasMin = reg.min === undefined || count >= reg.min;
      // stop for the next token, like 'foo+ bar'
      if (!term || (next && hasMin && matchAt(state, next, t))) {
        break
      }
      const more = tryBlock(state, skipN);
      if (more === 0) {
        break
      }
      skipN += more;
      count += 1;
    }
    // 'foo{2,3}' was too short
    if (reg.min !== undefined && count < reg.min) {
      return 0
    }
    return skipN
  };

  const doOrBlock$1 = state => repeatBlock(state, tryChoices);
  const doAndBlock$1 = state => repeatBlock(state, tryAndBlock);

  // 'foo? foo' matches are tricky.
  // should this optional token leave its term for the next one?
  const leaveForNext = function (state) {
    const next = state.regs[state.r + 1];
    if (!next || !matchAt(state, next, state.t)) {
      return false
    }
    // but does the next reg match the next term??
    // only skip if it doesn't
    const nextTerm = state.terms[state.t + 1];
    return !nextTerm || !matchAt(state, next, state.t + 1)
  };

  const negGreedy = function (state, reg, nextReg) {
    let skip = 0;
    for (let t = state.t; t < state.terms.length; t += 1) {
      let found = matchAt(state, reg, t);
      // we don't want a match, here
      if (found) {
        break//stop going
      }
      // are we doing 'greedy-to'?
      // - "!foo+ after"  should stop at 'after'
      if (nextReg) {
        found = matchAt(state, nextReg, t);
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
    // '!foo* after' can match nothing, and leave this term for the next token
    if (skip === 0) {
      return reg.optional === true //dead, otherwise
    }
    // did we satisfy min for !foo{min,max}
    if (reg.min && reg.min > skip) {
      return false//dead
    }
    state.t += skip;
    // state.r += 1
    return true
  };

  // a negative block didn't find its terms - that's good news
  const negativeBlock = function (state) {
    const reg = state.regs[state.r];
    const startAt = state.t;
    let alive = true;
    if (reg.greedy === true) {
      // '!(a|b)+' keeps going - anchors should not apply to the repeated terms
      alive = negGreedy(state, noAnchors({ ...reg, negative: false }), state.regs[state.r + 1]);
    } else if (!reg.optional) {
      // but a '!(a b)?' can pass-through without consuming anything
      state.t += 1;
    }
    logGroup(state, startAt);
    return alive
  };

  // shared logic for '(a|b)' or-blocks and '(a && b)' and-blocks
  const makeBlock = tryBlock => function (state) {
    const { regs } = state;
    const reg = regs[state.r];
    const skipNum = tryBlock(state);
    // did we find a match?
    if (skipNum) {
      // handle 'not' logic - but '!(a|b)*' can match nothing
      if (reg.negative === true) {
        return reg.optional === true && reg.greedy === true
      }
      // '(a|b)? a' - go on to the next token, without using this term
      if (reg.optional === true && leaveForNext(state)) {
        return true
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
      return true
    }
    // we didn't find it - for a negative-block, that's good news
    if (reg.negative === true) {
      return negativeBlock(state)
    }
    if (!reg.optional) {
      return null //die
    }
    return true
  };

  // '(a|b)' - match any choice on the term
  var doOrBlock = makeBlock(doOrBlock$1);

  // '(foo && #Noun)' - require all matches on the term
  var doAndBlock = makeBlock(doAndBlock$1);

  // '!foo' should match anything that isn't 'foo'
  // if it matches, return false
  const doNegative = function (state) {
    const { regs } = state;
    const reg = regs[state.r];
    const startAt = state.t;

    // match *anything* but this term
    const tmpReg = { ...reg };
    tmpReg.negative = false; // try removing it

    // found it? if so, we die here
    const found = matchAt(state, tmpReg, state.t);
    if (found) {
      // but '!foo*' can match nothing - '!foo?' stays a lookahead
      return reg.optional === true && reg.greedy === true
    }
    // negative greedy - !foo+  - super hard!
    if (reg.greedy) {
      // like getGreedy, anchors should not apply to the repeated terms
      const alive = negGreedy(state, noAnchors(tmpReg), regs[state.r + 1]);
      logGroup(state, startAt);
      return alive
    }
    // should we skip the term too?
    if (reg.optional) {
      // "before after" - "before !foo? after"
      // does the next reg match the this term?
      const nextReg = regs[state.r + 1];
      if (nextReg) {
        const fNext = matchAt(state, nextReg, state.t);
        if (fNext) {
          return true // leave the term, and any capture, to the next reg
        }
        if (nextReg.optional && regs[state.r + 2]) {
          // ugh. ok,
          // support "!foo? extra? need"
          // but don't scan ahead more than that.
          const fNext2 = matchAt(state, regs[state.r + 2], state.t);
          if (fNext2) {
            return true
          }
        }
      }
    }
    state.t += 1;
    logGroup(state, startAt);
    return true
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
    if (!term.implicit || !state.terms[state.t + 1]?.implicit) {
      return
    }
    // we matched "we've", or @hasContraction - skip over all of its hidden words, [we, have]
    if (reg.word === term.normal || reg.method === 'hasContraction') {
      let next = state.terms[state.t + 1];
      // a hidden word has no text of its own - the next contraction starts at a word that does
      while (next && next.implicit && next.text === '') {
        state.t += 1;
        next = state.terms[state.t + 1];
      }
    }
  };

  // '[foo]' should also be logged as a group
  const setGroup = function (state, startAt) {
    const reg = state.regs[state.r];
    // Get or create capture group
    const g = getGroup$1(state, startAt);
    // Update group - add greedy or increment length
    if (state.t - state.offset > 1 && reg.greedy) {
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
    // go on to the next token, without using this term
    if (reg.optional && leaveForNext(state)) {
      return true
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

  // choose how to consume this reg: a step function, null to die, or undefined to skip it
  const pickStep = function (reg, state) {
    // support 'unspecific greedy' .* properly
    if (reg.anything === true && reg.greedy === true) {
      return doAstrix
    }
    // slow-OR - multi-word OR (a|b|foo bar)
    if (reg.choices !== undefined && reg.operator === 'or') {
      return doOrBlock
    }
    // slow-AND - multi-word AND (#Noun && foo) blocks
    if (reg.choices !== undefined && reg.operator === 'and') {
      return doAndBlock
    }
    // support '.' as any-single
    if (reg.anything === true) {
      // '!.' negative anything should insta-fail
      if (reg.negative) {
        return null
      }
      return simpleMatch
    }
    // support 'foo*$' until the end
    if (isEndGreedy(reg, state) === true) {
      return simpleMatch
    }
    // ok, it doesn't match - but maybe it wasn't *supposed* to?
    if (reg.negative) {
      // we want *anything* but this term
      return doNegative
    }
    // ok, finally test the term-reg
    if (matchAt(state, reg, state.t) === true) {
      return simpleMatch
    }
    //ok who cares, keep going
    if (reg.optional === true) {
      return undefined
    }
    // finally, we die
    return null
  };

  /**
   * try a sequence of match tokens ('regs')
   * on a sequence of terms,
   * starting at this certain term.
   */
  const tryHere = function (terms, regs, start_i, phrase_length, offset = 0) {
    // console.log(`\n\n:start: '${terms[0].text}':`)
    if (offset >= terms.length || regs.length === 0) {
      return null
    }
    // Use the original terms with a cursor instead of copying the remaining
    // sentence at every starting position. origin maps array indices to match
    // pointers; offset marks the beginning of this attempt within the array.
    const origin = start_i - offset;
    const state = {
      t: offset,
      offset: offset,
      terms: terms,
      r: 0,
      regs: regs,
      groups: null,
      start_i: origin,
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
      state.inGroup = state.hasGroup ? reg.group : null;
      //have we run-out of terms?
      if (!state.terms[state.t]) {
        //are all remaining regs optional or negative?
        const alive = regs.slice(state.r).some(remain => !remain.optional);
        if (alive === false) {
          break //done!
        }
        return null // die
      }
      const step = pickStep(reg, state);
      if (step === null) {
        return null
      }
      if (step && !step(state)) {
        return null
      }
    }
    //return our results, as pointers
    const pntr = [null, start_i, state.t + origin];
    if (pntr[1] === pntr[2]) {
      return null //found 0 terms
    }
    const groups = {};
    if (state.groups) {
      Object.keys(state.groups).forEach(k => {
        const o = state.groups[k];
        const start = origin + o.start;
        groups[k] = [null, start, start + o.length];
      });
    }
    return { pointer: pntr, groups: groups }
  };

  // support returning a subset of a match
  // like 'foo [bar] baz' -> bar
  const getGroup = function (res, group) {
    const ptrs = [];
    const byGroup = {};
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
        Object.entries(r.groups).forEach(([k, ptr]) => {
          byGroup[k] ||= [];
          byGroup[k].push(ptr);
        });
      });
    }
    return { ptrs, byGroup }
  };

  // drop any results that contain this match
  const notIf = function (results, not, docs) {
    return results.filter(res => {
      const [n, start, end] = res.pointer;
      const terms = docs[n].slice(start, end);
      return !terms.some((_t, i) => tryHere(terms, not, i, terms.length, i) !== null)
    })
  };

  // Compiled sweeps cache this check; editable public patterns are rechecked.
  const isFixed = regs => regs.every(reg => !reg.optional && !reg.greedy &&
    !reg.negative && !reg.choices && !reg.anything &&
    (reg.word !== undefined || reg.tag !== undefined || reg.switch !== undefined || reg.fastOr !== undefined));

  const fromFixed = (terms, regs, start, length, offset = 0) => {
    if (offset + regs.length > terms.length) {
      return null
    }
    for (let r = 0; r < regs.length; r += 1) {
      const term = terms[offset + r];
      // A literal contraction can consume more than one term.
      if (term.implicit) {
        return tryHere(terms, regs, start, length, offset)
      }
      if (wrapMatch(term, regs[r], start + r, length) !== true) {
        return null
      }
    }
    // Failed attempts never need capture state.
    const groups = {};
    for (let r = 0; r < regs.length; r += 1) {
      const name = regs[r].group;
      if (name) {
        if (!groups[name]) {
          groups[name] = [null, start + r, start + r];
        }
        groups[name][2] += 1;
      }
    }
    return { pointer: [null, start, start + regs.length], groups }
  };

  // make proper pointers
  const addSentence = function (res, n) {
    res.pointer[0] = n;
    Object.keys(res.groups).forEach(k => {
      res.groups[k][0] = n;
    });
    return res
  };

  const handleStart = function (terms, regs, n, attempt) {
    let res = attempt(terms, regs, 0, terms.length);
    if (res) {
      res = addSentence(res, n);
      return res //getGroup([res], group)
    }
    return null
  };

  // ok, here we go.
  const runMatch$1 = function (docs, todo, cache) {
    cache ||= [];
    const { regs, group, justOne, checkFirst } = todo;
    let results = [];
    if (!regs || regs.length === 0) {
      return { ptrs: [], byGroup: {} }
    }
    const attempt = (todo.fixed ?? isFixed(regs)) ? fromFixed : tryHere;

    // Compiled rules carry this value; public parsed patterns can still be edited
    // by callers, so calculate their minimum without caching on the token array.
    let minLength = todo.minLength;
    if (minLength === undefined) {
      minLength = getMinLength(regs);
    }
    docs: for (let n = 0; n < docs.length; n += 1) {
      const terms = docs[n];
      // let index = terms[0].index || []
      // can we skip this sentence?
      if (cache[n] && failFast(regs, cache[n])) {
        continue
      }
      // ^start regs only run once, per phrase
      if (regs[0].start === true) {
        const foundStart = handleStart(terms, regs, n, attempt);
        if (foundStart) {
          results.push(foundStart);
        }
        continue
      }
      //ok, try starting the match now from every term
      for (let i = 0; i < terms.length; i += 1) {
        // ensure it's long-enough
        if (terms.length - i < minLength) {
          break
        }
        // Compiled sweep rules can reject a start before allocating match state.
        if (checkFirst && !wrapMatch(terms[i], regs[0], i, terms.length)) {
          continue
        }
        let res = attempt(terms, regs, i, terms.length, i);
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

  const escapes = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };
  const escapeXml = str => str.replace(/[&<>"']/g, c => escapes[c]);

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
        starts[a] ||= [];
        starts[a].push(tag.start);
        const b = terms.at(-1).id;
        ends[b] ||= [];
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
    eachTerm(this.docs, t => {
      // do a span tag
      if (Object.hasOwn(starts, t.id)) {
        out += starts[t.id].join('');
      }
      out += t.pre || '';
      out += t.text || '';
      if (Object.hasOwn(ends, t.id)) {
        out += ends[t.id].join('');
      }
      out += t.post || '';
    });
    return out
  };
  var html$1 = { html };

  // Walk the trailing punctuation run once, rather than retrying at every offset.
  const endPunctuation = /[,:;)\]*.?~!\u0022\uFF02\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4—-]/;
  const trimEnd = str => {
    let end = str.length;
    while (end > 0 && endPunctuation.test(str[end - 1])) end--;
    return str.slice(0, end)
  };
  const trimStart =
    /^[(['"*~\uFF02\u201C\u2018\u201F\u201B\u201E\u2E42\u201A\u00AB\u2039\u2035\u2036\u2037\u301D\u0060\u301F]+/;

  const punctToKill = /[,:;)('"\uFF02\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4\]]/;
  const isHyphen = /^[-–—]$/;
  const hasSpace = / /;

  // the original text of these terms, with any outer whitespace removed
  const rawText = terms => terms.reduce((str, t) => str + t.pre + t.text + t.post, '').trim();

  const textFromTerms = function (terms, opts, keepSpace = true) {
    let txt = '';
    terms.forEach((t, i) => {
      let pre = t.pre || '';
      let post = t.post || '';
      if (opts.punctuation === 'some') {
        pre = pre.replace(/[,،]/g, '');
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
        post = post.replace(/[,،…]|\.{2,}/g, '');
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
          post = trimEnd(post);
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
      // add an implicit space, for contractions - but not after the last word
      if ((opts.form === 'machine' || opts.form === 'implicit' || opts.form === 'root') && t.implicit && i < terms.length - 1) {
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
      const last = docs.at(-1);
      if (!last.at(-1).tags.has('Emoticon')) {
        text = trimEnd(text);
        // removing a spaced dash leaves its space behind
        if (!opts.keepSpace) {
          text = text.trimEnd();
        }
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

  const some = {
    whitespace: 'some',
    punctuation: 'some',
    unicode: 'some',
  };
  const fmts = {
    text: {
      form: 'text',
    },
    normal: {
      ...some,
      case: 'some',
      form: 'normal',
    },
    machine: {
      ...some,
      keepSpace: false,
      case: 'none',
      form: 'machine',
    },
    root: {
      ...some,
      keepSpace: false,
      case: 'some',
      form: 'root',
    },
    implicit: {
      form: 'implicit',
    }
  };
  fmts.clean = fmts.normal;
  fmts.reduced = fmts.root;

  /* eslint-disable no-bitwise, no-multi-assign */

  // https://github.com/jbt/tiny-hashes/
  const k = [];
  let i = 0;
  for (; i < 64; i++) {
    k[i] = 0 | (Math.sin((i + 1) % Math.PI) * 4294967296);
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

    for (i = j = 0; i < s; i += 16) {
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
              ~~words[i | ([j, 5 * j + 1, 3 * j + 5, 7 * j][a] & 15)]) <<
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

  const defaults$3 = {
    text: true,
    terms: true,
  };

  const opts = { case: 'none', unicode: 'some', form: 'machine', punctuation: 'some' };

  // text in this format, keeping punctuation
  const punct = (terms, fmt) => textFromTerms(terms, { ...fmt, keepPunct: true }, false);

  const fns$1 = {
    text: terms => punct(terms),
    normal: terms => punct(terms, fmts.normal),
    implicit: terms => punct(terms, fmts.implicit),

    machine: terms => textFromTerms(terms, opts, false),
    root: terms => textFromTerms(terms, { ...opts, form: 'root' }, false),

    hash: terms => md5(punct(terms)),

    offset: terms => {
      const len = fns$1.text(terms).length;
      // the text keeps leading punctuation but trims whitespace, so start where the text starts
      const raw = terms[0].pre + terms[0].text;
      const lead = terms[0].pre.length - (raw.length - raw.trimStart().length);
      return {
        index: terms[0].offset.index,
        start: terms[0].offset.start - lead,
        length: len,
      }
    },
    terms: terms => {
      return terms.map(t => ({ ...t, tags: [...t.tags] }))
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
    option ||= {};
    if (typeof option === 'string') {
      option = {};
    }
    option = { ...defaults$3, ...option };
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

  // Output the requested format, or the default tags view
  const debug$1 = function (fmt) {
    const debugMethods = this.methods.one.debug || {};
    if (!fmt || !Object.hasOwn(debugMethods, fmt)) {
      fmt = 'tags';
    }
    debugMethods[fmt](this);
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

  const wrap$1 = function (doc, obj) {
    // index ids to highlight
    const starts = findStarts(doc, obj);
    let text = '';
    doc.docs.forEach((terms, n) => {
      for (let i = 0; i < terms.length; i += 1) {
        const t = terms[i];
        // do a span tag
        if (Object.hasOwn(starts, t.id)) {
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
    return entry.parents.at(-1)
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

  const makeAliases = function (tagSet, registered) {
    const aliases = Object.create(null);
    for (const tag in tagSet) {
      const entry = tagSet[tag];
      // A leading null explicitly keeps the canonical name.
      const preferred = entry.aliases === undefined ? entry.alias : entry.aliases[0];
      if (preferred && registered[preferred] === tag) {
        aliases[tag] = preferred;
      }
    }
    return aliases
  };

  // one line per sentence: '<text> {Tag,Tag,…}'
  const toSpec = function (doc, world) {
    const tagSet = world.model.one.tagSet;
    const aliases = makeAliases(tagSet, world.model.one.tagAliases);
    return doc.docs.map(terms => {
      const text = rawText(terms);
      const tags = terms.map(t => {
        const tag = slotForTerm(t, tagSet);
        return aliases[tag] || tag
      }).join(',');
      return `${text} {${tags}}`
    }).join('\n')
  };

  // sort by frequency
  const topk = function (arr) {
    const counts = new Map();
    arr.forEach(word => {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    });
    const res = Array.from(counts, ([normal, count]) => ({ normal, count }));
    return res.sort((a, b) => b.count - a.count)
  };

  // named output formats
  const outputs = {
    // text formats
    text: view => view.text(),
    normal: view => view.text('normal'),
    root: view => view.text('root'),
    machine: view => view.text('machine'),
    hash: view => md5(view.text()),
    // tagged-sentence format for LLMs (see docs/spec-format.md)
    spec: view => toSpec(view, view.world),
    // json data formats
    json: view => view.json(),
    offset: view => {
      view.compute('offset');
      return view.json({ offset: true })
    },
    array: view => view.docs.map(rawText).filter(str => str),
    // return terms sorted by frequency
    freq: view => topk(view.json({ normal: true }).map(o => o.normal)),
    // some handy ad-hoc outputs
    terms: view => view.docs.flatMap(terms => terms.map(t => t.text).filter(Boolean)),
    tags: view => {
      return view.docs.map(terms => {
        return terms.reduce((h, t) => {
          h[t.implicit || t.normal] = Array.from(t.tags);
          return h
        }, {})
      })
    },
    'best-tag': view => {
      view.compute('tagRank');
      return view.docs
        .map(ts => {
          return ts.map(t => (t.tagRank?.[0] ? `#${t.tagRank[0]}` : '')).join(' ')
        })
        .join('\n')
    },
    debug: view => view.debug(), //allow
  };
  // aliases
  outputs.reduced = outputs.machine;
  outputs.md5 = outputs.hash;
  outputs.offsets = outputs.offset;
  outputs.frequency = outputs.freq;
  outputs.topk = outputs.freq;

  /** some named output formats */
  const out = function (method) {
    // support custom outputs
    if (isObject$1(method)) {
      return wrap$1(this, method)
    }
    if (Object.hasOwn(outputs, method)) {
      return outputs[method](this)
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

  // a dash between two words, like '2025-05-11 - they'
  const spacedDash = /^\s+[-—]\s+$/;

  var text = {
    /** */
    text: function (fmt) {
      let opts = {};
      if (fmt && typeof fmt === 'string' && Object.hasOwn(fmts, fmt)) {
        opts = { ...fmts[fmt] };
      } else if (fmt && isObject$1(fmt)) {
        opts = { ...fmt }; //todo: fixme
      }
      // is it a full document?
      if (opts.keepSpace === undefined && !this.isFull()) {
        //
        opts.keepSpace = false;
      }
      if (opts.keepEndPunct === undefined && this.pointer) {
        const ptr = this.pointer[0];
        const lastTerm = this.docs.at(-1)?.at(-1);
        if (ptr?.[1] || spacedDash.test(lastTerm?.post)) {
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

  const methods$7 = { ...methods$8, ...text, ...methods$9, ...html$1 };

  const addAPI$1 = function (View) {
    Object.assign(View.prototype, methods$7);
  };

  /* eslint-disable no-console */

  const tagString = function (tags, model) {
    if (model.one.tagSet) {
      tags = tags.map(tag => {
        if (!Object.hasOwn(model.one.tagSet, tag)) {
          return tag
        }
        // an unknown color should not break the output
        const paint = cli[model.one.tagSet[tag].color] || blue;
        return paint(tag)
      });
    }
    return tags.join(', ')
  };

  // browser consoles get a collapsible table per sentence
  const showClient = function (view) {
    console.log('%c -=-=- ', 'background-color:#6699cc;');
    view.forEach(m => {
      console.groupCollapsed(m.text());
      const out = m.docs[0].map(t => {
        const text = t.implicit ? '[' + t.implicit + ']' : t.text || '-';
        return { text, tags: '[' + Array.from(t.tags).join(', ') + ']' }
      });
      console.table(out, ['text', 'tags']);
      console.groupEnd();
    });
  };

  const showTags = function (view) {
    if (typeof window !== 'undefined' && window.document) {
      showClient(view);
      return
    }
    const { docs, model } = view;
    if (docs.length === 0) {
      console.log(blue('\n     ──────'));
    }
    docs.forEach(terms => {
      console.log(blue('\n  ╭─────────'));
      terms.forEach(t => {
        const tags = [...(t.tags || [])];
        let text = t.text || '-';
        if (t.sense) {
          text = `{${t.normal}/${t.sense}}`;
        }
        if (t.implicit) {
          text = '[' + t.implicit + ']';
        }
        text = yellow(text);
        let word = "'" + text + "'";
        if (t.frozen === true) {
          word += ' ❄️';
        }
        if (t.reference) {
          const str = view.update([t.reference]).text('normal');
          word += ` - ${dim(i$1('[' + str + ']'))}`;
        }
        word = word.padEnd(18);
        const str = blue('  │ ') + i$1(word) + '  - ' + tagString(tags, model);
        console.log(str);
      });
    });
    console.log('\n');
  };

  /* eslint-disable no-console */

  const colors$1 = { Noun: blue, Verb: green, Adjective: yellow, Pivot: red };

  const showChunks = view => {
    console.log('');
    view.docs.forEach(terms => {
      const out = terms.map(term => {
        const text = term.implicit || term.normal;
        if (Object.hasOwn(colors$1, term.chunk)) {
          return colors$1[term.chunk](text)
        }
        return text
      });
      console.log(out.join(' '), '\n');
    });
    console.log('\n');
  };

  /* eslint-disable no-console */

  // each match on its own line: green, inside its grey sentence, aligned at the middle column
  const width = 55;
  const half = 27;
  const dots = '…';

  // drop words from the outer edge until the side fits, leaving room for an ellipsis
  const fit = (arr, max, fromStart) => {
    let cut = false;
    const size = () => (fromStart ? arr.join('').trimStart() : arr.join('').trimEnd()).length + (cut ? 2 : 0);
    while (arr.length > 0 && size() > max) {
      if (fromStart) {
        arr.shift();
      } else {
        arr.pop();
      }
      cut = true;
    }
    return cut
  };

  // the padded context before the match, the match, and the context after it
  const parts = (terms, start, end) => {
    const arrs = [[], [], []]; // before, match, after
    terms.forEach((t, i) => {
      const str = (t.pre + t.text + t.post).replace(/\s+/g, ' ');
      const arr = arrs[(i >= start ? 1 : 0) + (i >= end ? 1 : 0)];
      // blank terms fold into the word before them
      if (str.trim() === '' && arr.length > 0) {
        arr[arr.length - 1] = (arr.at(-1) + str).replace(/\s+/g, ' ');
      } else {
        arr.push(str);
      }
    });
    const [before, match, after] = arrs;
    const left = (fit(before, half, true) ? dots + ' ' : '') + before.join('').trimStart();
    let mid = match.join('');
    const cutR = fit(after, width - half - mid.length, false);
    const right = after.join('').trimEnd() + (cutR ? ' ' + dots : '');
    if (right === '') {
      mid = mid.trimEnd();
    }
    return [' '.repeat(Math.max(0, half - left.length)) + left, mid, right]
  };

  const showHighlight = function (view) {
    const client = typeof window !== 'undefined' && window.document;
    view.fullPointer.forEach(([n, s, e]) => {
      const [left, mid, right] = parts(view.document[n], s, e);
      if (client) {
        console.log('%c' + left + '%c' + mid + '%c' + right, 'color:grey', 'color:green', 'color:grey');
      } else {
        console.log(grey(left) + green(mid) + (right ? grey(right) : ''));
      }
    });
  };

  const debug = {
    tags: showTags,
    chunks: showChunks,
    highlight: showHighlight,
  };

  const lastBrace = /\{(?=[^{]*$)/; // split on the last { only
  const comment = /\}[ \t]*#(.*)$/s; // an optional '# comment' after the last {tags} block


  // parse the spec output
  const parseLine = function (line = '') {
    let [text, tags] = line.split(lastBrace); // eslint-disable-line prefer-const
    if (tags === undefined) {
      const note = text.match(/\s#(.*)$/s)?.[1] || '';
      // no {tags} block on this line
      return { text: text.replace(/\s#.*$/s, '').trim(), tags: null, comment: note.trim() }
    }
    const note = (tags.match(comment)?.[1] || '').trim();
    tags = tags.replace(comment, '}'); // drop the comment - only ever one, always last
    tags = tags.split(',').map(tag => tag.trim());
    const lastTag = tags[tags.length - 1];
    tags[tags.length - 1] = lastTag.replace(/\}$/, '');
    tags = tags.map(tag => tag.split('|').map(t => t.trim()));
    if (tags.length === 1 && tags[0].length === 1 && tags[0][0] === '') {
      tags = []; // empty '{}'; retain empty slots in nonempty lists
    }
    return { text: text.trim(), tags, comment: note }
  };

  // parse a whole spec into [{ line, text, tags, comment }], skipping blank and comment lines
  const parseSpec = function (spec = '') {
    const list = [];
    spec.split('\n').forEach((str, i) => {
      if (str.trim() && !/^\s*#/.test(str)) {
        list.push({ line: i + 1, ...parseLine(str) });
      }
    });
    return list
  };

  // make a match syntax looping through the arrays of tags
  const toMatchString = function (tags, aliases) {
    // Slots accept tags and '.', never match-syntax quantifiers or groups.
    if (tags.some(slot => slot.some(tag => tag !== '.' && !/^!?#?[a-z][a-z0-9]*$/i.test(tag)))) {
      return null
    }
    return tags.map(arr => {
      arr = arr.map(str => {
        if (str === '.') {
          return '.'
        }
        const negative = str.startsWith('!');
        const tag = str.replace(/^!?#?/, '');
        const prefix = negative ? '!#' : '#';
        return prefix + (aliases[tag] || tag)
      });
      if (arr.length > 1) {
        return `(${arr.join(' && ')})`
      }
      return arr[0]
    }).join(' ')
  };

  // Apply only positive constraints; negatives remain assertions.
  const applyTags = (doc, slots, aliases) => {
    const terms = doc.terms();
    // Tokenization can supply structural tags; literal slots replace them.
    doc.docs.flat().forEach(term => term.tags.clear());
    slots?.forEach((slot, i) => {
      const tags = slot.filter(tag => tag !== '.' && !tag.startsWith('!')).map(tag => {
        tag = tag.replace(/^#/, '');
        return aliases[tag] || tag
      });
      terms.eq(i).tag(tags, 'fromSpec');
    });
  };

  // Diagnostics describe the original parse, before the returned View is mutated.
  const specFailures = (doc, slots, aliases) => {
    const terms = doc.docs.flat();
    const patterns = slots.map(slot => toMatchString([slot], aliases));
    const pattern = toMatchString(slots, aliases);
    if (terms.length === slots.length && pattern !== null && doc.has(pattern)) {
      return [] // valid
    }
    const failures = [];
    if (terms.length !== slots.length) {
      failures.push({
        code: 'length', expected: slots.length, actual: terms.length,
        message: `expected ${slots.length} terms, got ${terms.length}`,
      });
    }
    doc.compute('tagRank');
    slots.forEach((slot, i) => {
      const term = terms[i];
      const actual = term ? Array.from(term.tags) : [];
      const detail = { term: i + 1, word: term?.implicit || term?.text || '', expected: slot, actual };
      if (patterns[i] === null) {
        failures.push({ ...detail, code: 'syntax', message: `term ${i + 1}: invalid slot ${slot.join('|')}` });
        return
      }
      if (!term) {
        return // covered by the length error
      }
      const problems = [];
      slot.forEach(value => {
        if (value === '.') {
          return
        }
        const negative = value.startsWith('!');
        const tag = value.replace(/^!?#?/, '');
        const present = term.tags.has(aliases[tag] || tag);
        if (negative && present) {
          problems.push(`unexpected #${tag}`);
        } else if (!negative && !present) {
          problems.push(`missing #${tag}`);
        }
      });
      if (problems.length > 0) {
        const best = term.tagRank?.[0] || actual.at(-1) || 'Untagged';
        failures.push({
          ...detail, code: 'tags',
          message: `term ${i + 1} '${detail.word}': #${best}, ${problems.join(', ')}`,
        });
      }
    });
    if (failures.length === 0) {
      failures.push({ code: 'match', message: 'tags align, but the sentence pattern did not match' });
    }
    return failures
  };

  const logSpec = (doc, slots, failures, aliases) => {
    const terms = doc.docs.flat();
    const wrong = new Set(failures.filter(failure => failure.term).map(failure => failure.term - 1));
    const invalid = new Set(failures.filter(failure => failure.code === 'syntax').map(failure => failure.term - 1));
    const unmatched = failures.some(failure => failure.code === 'match');
    let visible = 0;
    terms.forEach((term, i) => {
      if (term.text) {
        visible = i;
      }
      // Implicit terms share their visible contraction or number-range token.
      if (wrong.has(i) || i >= slots.length || unmatched) {
        wrong.add(visible);
      }
    });
    const text = terms.map((term, i) => {
      const word = wrong.has(i) && term.text ? red(term.text) : term.text;
      return term.pre + word + term.post
    }).join('').trim();
    const tags = slots.map((slot, i) => {
      const term = terms[i];
      if (!term || invalid.has(i) || unmatched) {
        return red(slot.join('|'))
      }
      return slot.map(value => {
        if (value === '.') {
          return value
        }
        const negative = value.startsWith('!');
        const tag = value.replace(/^!?#?/, '');
        const present = term.tags.has(aliases[tag] || tag);
        return present === negative ? red(value) : value
      }).join('|')
    }).join(',');
    const block = slots.length === 0 ? red('{}') : `{${tags}}`;
    return `${text} ${block}`
  };

  // one ✓ or ✗ line per spec line, for verbose mode
  const logLine = (text, tags, detail) => {
    const block = tags === null ? '' : ` {${tags.map(slot => slot.join('|')).join(',')}}`;
    if (detail) {
      return `${red('✗')} ${text}${dim(block)} - ${red(detail)}`
    }
    return `${green('✓')} ${green(dim(text))}${dim(block)}`
  };

  const fromSpec = function (spec, { tags: tagMode = 'ignore', failures: failureMode = 'ignore', verbose = false } = {}) {
    if (!['ignore', 'use'].includes(tagMode) || !['ignore', 'throw', 'retain', 'log'].includes(failureMode)) {
      throw new Error('Invalid fromSpec options')
    }
    const aliases = this.world().model.one.tagAliases;
    const result = this('');
    result.failures = [];
    parseSpec(spec).forEach(({ line, text, tags }) => {
      const doc = tagMode === 'use' ? this.tokenize(text) : this(text);
      let failures = [];
      if (tags !== null && (tagMode === 'use' || failureMode !== 'ignore')) {
        const count = doc.docs.reduce((sum, terms) => sum + terms.length, 0);
        const pattern = toMatchString(tags, aliases);
        // Assigning slots is unsafe when the shape or syntax is invalid.
        const canApply = count === tags.length && pattern !== null;
        if (tagMode === 'use' && !canApply && failureMode !== 'log') {
          const invalid = specFailures(doc, tags, aliases);
          throw new Error(`${text} - ${invalid.map(failure => failure.message).join('; ')}`)
        }
        if (tagMode === 'use') {
          applyTags(doc, canApply ? tags : null, aliases);
        }
        if (failureMode !== 'ignore') {
          failures = specFailures(doc, tags, aliases)
            .map(failure => ({ line, text, ...failure }));
          result.failures.push(...failures);
        }
      } else if (tagMode === 'use') {
        applyTags(doc, null, aliases);
      }
      const detail = failures.map(failure => failure.message).join('; ');
      if (failureMode === 'log' && failures.length > 0) {
        console.error(logSpec(doc, tags, failures, aliases)); //eslint-disable-line no-console
      } else if (verbose || debug$2.spec) {
        console.log(logLine(text, tags, detail)); //eslint-disable-line no-console
      }
      if (failures.length > 0 && failureMode === 'throw') {
        throw new Error(`${text} - ${detail}`)
      }
      if (failureMode === 'retain' && tags !== null && failures.length === 0) {
        return
      }
      // Preserve the parsed terms and assigned tags, without running hooks twice.
      if (doc.found) {
        const previous = result.document.at(-1)?.at(-1);
        if (previous) {
          previous.post += '\n';
        }
        result.document.push(...doc.docs);
      }
    });
    return result
  };

  // Keep the legacy logging and throwing arguments on the compatibility wrapper.
  const testSpec = function (spec, verbose = true, throwError = false) {
    const result = this.fromSpec(spec, { tags: 'ignore', failures: 'retain', verbose });
    if (throwError && result.failures.length > 0) {
      const failure = result.failures[0];
      throw new Error(`${failure.text} - ${failure.message}`)
    }
    return result
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
        parseSpec,
      },
    },
  };

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
      // look up a sentence, then down one
      for (const k of [n - i, n + i]) {
        if (doc[k]) {
          const index = doc[k].findIndex(term => term.id === id);
          if (index !== -1) {
            return [k, index]
          }
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
      ptr[4] = terms.length > 0 ? terms[terms.length - 1].id : null;
    } else {
      ptr[2] = newEnd + 1; // repair ending pointer, which is exclusive
    }
    return document[n].slice(start, ptr[2])
  };

  /** return a subset of the document, from a pointer */
  const getDoc = function (ptrs, document) {
    let doc = [];
    ptrs.forEach((ptr, i) => {
      if (!ptr) {
        return
      }
      // eslint-disable-next-line prefer-const
      let [n, start, end, id, endId] = ptr;
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
          // the ending may have moved too, if its term still exists
          endId = document[wild[0]].some(term => term.id === endId) ? endId : undefined;
          ptr = [wild[0], wild[1], wild[1] + len, startId, endId];
          ptrs[i] = ptr;
        } else {
          // our start-term was deleted (replaced?) - trust the index, and adopt the term now there
          terms = terms.slice(start, end);
          ptr[3] = terms[0] ? terms[0].id : null;
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
  const termList = docs => docs.flat();

  var methods$6 = {
    one: {
      termList,
      getDoc,
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

  // a new view from the pointers
  const toView = (view, ptrs) => view.toView(addIds(ptrs, view.document));

  // combine our pointers with another view's
  const setOp = fn => function (m) {
    m = getDoc$1(m, this);
    return toView(this, fn(this.fullPointer, m.fullPointer))
  };

  const methods$5 = {};

  // all parts, minus duplicates
  methods$5.union = setOp(getUnion);
  methods$5.and = methods$5.union;

  // only parts they both have
  methods$5.intersection = setOp(getIntersection);

  // only parts of a that b does not have
  methods$5.not = setOp(subtract);
  methods$5.difference = methods$5.not;

  // get opposite of a match
  methods$5.complement = function () {
    return toView(this, subtract(this.all().fullPointer, this.fullPointer))
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

  const api$e = function (View) {

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
            term.index[1] + len
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

  const sets = new WeakMap();
  const empty = new Set();

  // Normalization replaces these arrays when plugins rebuild the tag graph.
  const getTagSet = (tags) => {
    if (!tags || tags.length === 0) {
      return empty
    }
    let set = sets.get(tags);
    if (!set) {
      set = new Set(tags);
      sets.set(tags, set);
    }
    return set
  };

  // strip the '#', then follow any alias
  const resolveTag = (tag, aliases) => {
    tag = tag.replace(/^#/, '');
    return aliases?.[tag] || tag
  };

  // Resolve actions and index hints once, alongside the match expression.
  const resolveAliases = (rule, aliases) => {
    const tag = value => {
      if (Array.isArray(value)) {
        return value.map(tag)
      }
      if (typeof value !== 'string') {
        return value
      }
      return value.trim().split(/ +/).map(name => resolveTag(name, aliases)).join(' ')
    };
    const hook = value => {
      if (typeof value === 'string' && value.startsWith('#')) {
        return '#' + tag(value)
      }
      return value
    };
    if (rule.tag !== undefined) {
      rule.tag = tag(rule.tag);
    }
    if (rule.unTag !== undefined) {
      rule.unTag = tag(rule.unTag);
    }
    if (rule.hook !== undefined) {
      rule.hook = hook(rule.hook);
    }
    if (rule.ifNo !== undefined) {
      rule.ifNo = [rule.ifNo].flat().map(hook);
    }
  };

  // Only precheck required, single-term tokens without special matching steps.
  const canCheck = reg => Boolean(reg && !reg.optional && !reg.negative && !reg.greedy &&
    !reg.choices && !reg.anything && !reg.regex && !reg.method);

  const getBoundary = (reg, boundary) => {
    if (!canCheck(reg) || !reg[boundary]) {
      return null
    }
    return reg
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

  // Only allow hooks that every successful match must contain. In particular,
  // a word inside an optional or negative AND block is not a required hook.
  const hasRequiredHook = function (regs, hook) {
    return regs.some(reg => {
      if (reg.optional || reg.negative) {
        return false
      }
      if (getTokenNeeds(reg) === hook) {
        return true
      }
      return reg.operator === 'and' && reg.choices &&
        reg.choices.some(side => hasRequiredHook(side, hook))
    })
  };

  const getNeeds = function (regs) {
    const needs = [];
    regs.forEach(reg => {
      needs.push(getTokenNeeds(reg));
      // support AND (foo && tag) - but an optional or negative block requires nothing
      if (reg.operator === 'and' && reg.choices && !reg.optional && !reg.negative) {
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

  const parse$2 = function (matches, world) {
    const parseMatch = world.methods.one.parseMatch;
    matches.forEach(obj => {
      resolveAliases(obj, world.model.one.tagAliases);
      obj.regs = parseMatch(obj.match, {}, world);
      obj.fixed = isFixed(obj.regs);
      obj.checkFirst = canCheck(obj.regs[0]);
      obj.startTerm = getBoundary(obj.regs[0], 'start');
      obj.endTerm = getBoundary(obj.regs[obj.regs.length - 1], 'end');
      if (obj.notIf) {
        obj.notIf = parseMatch(obj.notIf, {}, world);
      }
      // cache any requirements up-front 
      obj.needs = getNeeds(obj.regs);
      if (obj.hook !== undefined) {
        if (typeof obj.hook !== 'string' || !obj.needs.includes(obj.hook) || !hasRequiredHook(obj.regs, obj.hook)) {
          throw new Error(`Invalid hook "${obj.hook}" for match "${obj.match}": use a required word, #Tag, or %Switch%.`)
        }
      }
      const { wants, count } = getWants(obj.regs);
      obj.wants = wants;
      obj.minWant = count;
      // get rid of tiny sentences
      obj.minWords = obj.regs.filter(o => !o.optional).length;
      // The matcher excludes negative tokens from its own minimum. Cache that
      // separately rather than changing the sweep's existing length filter.
      obj.minLength = getMinLength(obj.regs);
    });
    return matches
  };

  // Choose one necessary hook per rule. A missing required hook guarantees that
  // the rule cannot match, so broader hooks need not enqueue it as well.
  const buildIndex = function (matches, hooks, hookOrder) {
    const index = Object.create(null);
    const seen = new Set();
    const lastRank = Object.keys(hooks).length;
    matches.forEach((rule, order) => {
      if (seen.has(rule)) {
        return
      }
      seen.add(rule);
      let anchor = null;
      let rank = lastRank;
      for (let i = 0; i < rule.needs.length; i += 1) {
        const key = rule.needs[i];
        // Prefer the hook shared by the fewest rules in this network.
        if (anchor === null || hooks[key].length < hooks[anchor].length) {
          anchor = key;
        }
        rank = Math.min(rank, hookOrder[key]);
      }
      // Explicit hooks have already been checked against required match tokens.
      if (rule.hook !== undefined) {
        anchor = rule.hook;
      }
      // Historically, any earlier matching alternative could determine where
      // this rule ran. Retain that ordering even when using a required anchor.
      const earlier = [...new Set(rule.wants)]
        .filter(key => hookOrder[key] < rank)
        .sort((a, b) => hookOrder[a] - hookOrder[b]);
      const keys = anchor === null ? [...new Set(rule.wants)] : [anchor];
      // The bucket already proves its anchor; check each remaining need once.
      const needs = [...new Set(rule.needs)].filter(key => key !== anchor);
      const entry = { rule, order, rank, earlier, needs, single: keys.length === 1 };
      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        index[key] ||= [];
        index[key].push(entry);
      }
    });
    return index
  };

  // do some indexing on the list of matches
  const buildNet = function (matches, world) {
    // turn match-syntax into json
    matches = parse$2(matches, world);

    // collect by wants and needs
    const hooks = {};
    matches.forEach(obj => {
      // add needs, then wants
      obj.needs.concat(obj.wants).forEach(str => {
        hooks[str] = Array.isArray(hooks[str]) ? hooks[str] : [];
        hooks[str].push(obj);
      });
    });
    // Record enumeration order, including numeric keys, so input-driven lookup
    // can preserve the order in which tag actions have always been applied.
    const hookOrder = Object.create(null);
    Object.keys(hooks).forEach((k, i) => {
      hookOrder[k] = i;
      // remove duplicates
      const already = new Set();
      hooks[k] = hooks[k].filter(obj => {
        if (already.has(obj)) {
          return false
        }
        already.add(obj);
        return true
      });
    });

    // keep all un-cacheable matches (those with no needs) 
    const always = matches.filter(o => o.needs.length === 0 && o.wants.length === 0);
    return {
      hooks,
      hookOrder,
      index: buildIndex(matches, hooks, hookOrder),
      always
    }
  };

  // Reject impossible candidates before allocating and sorting their entries.
  const canMatch = (obj, haves, terms, needs = obj.needs) => {
    const termCount = terms.length;
    if (!(termCount >= obj.minWords)) {
      return false
    }
    for (let j = 0; j < needs.length; j += 1) {
      if (!haves.has(needs[j])) {
        return false
      }
    }
    if (obj.ifNo !== undefined) {
      for (let j = 0; j < obj.ifNo.length; j += 1) {
        if (haves.has(obj.ifNo[j])) {
          return false
        }
      }
    }
    if (obj.wants.length > 0) {
      let count = 0;
      for (let j = 0; j < obj.wants.length; j += 1) {
        if (haves.has(obj.wants[j])) {
          count += 1;
          if (count >= obj.minWant) {
            break
          }
        }
      }
      if (!(count >= obj.minWant)) {
        return false
      }
    }
    // Required anchors must match the sentence boundary, not just occur in it.
    if (termCount && obj.startTerm && !wrapMatch(terms[0], obj.startTerm, 0, termCount)) {
      return false
    }
    if (termCount && obj.endTerm && !wrapMatch(terms[termCount - 1], obj.endTerm, termCount - 1, termCount)) {
      return false
    }
    return true
  };

  // Required anchors narrow the candidate list. Sort surviving entries by their
  // original first matching hook, then their position within that hook's bucket.
  const getIndexed = function (set, index, hookOrder, terms) {
    const found = [];
    const seen = new Set();
    set.forEach(key => {
      const bucket = index[key];
      if (!Array.isArray(bucket)) {
        return
      }
      for (let i = 0; i < bucket.length; i += 1) {
        const entry = bucket[i];
        // Single-bucket entries cannot be encountered twice. Older nets fall back.
        if (entry.single !== true) {
          if (seen.has(entry)) {
            continue
          }
          seen.add(entry);
        }
        if (!canMatch(entry.rule, set, terms, entry.needs)) {
          continue
        }
        let rank = entry.rank;
        for (let j = 0; j < entry.earlier.length; j += 1) {
          const earlier = entry.earlier[j];
          if (set.has(earlier)) {
            rank = hookOrder[earlier];
            break
          }
        }
        if (rank === entry.rank) {
          found.push(entry);
        } else {
          found.push({ rule: entry.rule, rank, order: entry.order });
        }
      }
    });
    found.sort((a, b) => a.rank - b.rank || a.order - b.order);
    return found.map(entry => entry.rule)
  };

  // for each cached-sentence, find a list of possible matches
  const getHooks = function (docCaches, net, document) {
    const { hooks, index, always } = net;
    let { hookOrder } = net;
    // Older compiled nets may not include the precomputed hook order.
    if (!hookOrder) {
      hookOrder = Object.create(null);
      Object.keys(hooks).forEach((k, i) => { hookOrder[k] = i; });
    }
    const lists = docCaches.map((set, n) => {
      if (index) {
        return getIndexed(set, index, hookOrder, document[n])
      }
      const keys = [];
      set.forEach(k => {
        if (typeof hookOrder[k] === 'number') {
          keys.push(k);
        }
      });
      keys.sort((a, b) => hookOrder[a] - hookOrder[b]);
      // Append each rule once, without concatenating and then filtering buckets.
      const maybe = [];
      const already = new Set();
      for (let i = 0; i < keys.length; i += 1) {
        const bucket = hooks[keys[i]];
        for (let j = 0; j < bucket.length; j += 1) {
          const m = bucket[j];
          if (!already.has(m)) {
            already.add(m);
            if (canMatch(m, set, document[n])) {
              maybe.push(m);
            }
          }
        }
      }
      return maybe
    });
    // Apply the same exclusions to unindexed rules, preserving their final position.
    lists.forEach((list, n) => {
      for (let i = 0; i < always.length; i += 1) {
        if (canMatch(always[i], docCaches[n], document[n])) {
          list.push(always[i]);
        }
      }
    });
    return lists
  };

  // finally,
  // actually run these match-statements on the terms
  const runMatch = function (maybeList, document, methods, opts) {
    const results = [];
    for (let n = 0; n < maybeList.length; n += 1) {
      const sentence = [document[n]];
      for (let i = 0; i < maybeList[n].length; i += 1) {
        const m = maybeList[n][i];
        // ok, actually do the work.
        const res = methods.one.match(sentence, m);
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
            results.push({ ...m, pointer: ptr });
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

  const sweep$1 = function (document, net, methods, opts = {}) {
    // find suitable matches to attempt, on each sentence
    const docCache = methods.one.cacheDoc(document);
    // filter candidates before sorting them into execution order
    const maybeList = getHooks(docCache, net, document);

    // now actually run the matches
    const results = runMatch(maybeList, document, methods, opts);
    // console.dir(results, { depth: 5 })
    return results
  };

  // quick check if this tag will require any untagging
  const canBe$1 = function (term, tag, tagSet) {
    if (!Object.hasOwn(tagSet, tag)) {
      return true // everything can be an unknown tag
    }
    const conflicts = getTagSet(tagSet[tag].not);
    if (conflicts.size === 0) {
      return true
    }
    for (const existing of term.tags) {
      if (conflicts.has(existing)) {
        return false
      }
    }
    return true
  };

  // is this tag consistent with the tags they already have?
  const canBe = (terms, tag, model) => terms.every(term => canBe$1(term, tag, model.one.tagSet));

  const tagger$2 = function (list, document, world) {
    const { model, methods } = world;
    const { getDoc, setTag, unTag } = methods.one;
    const looksPlural = methods.two.looksPlural;
    if (list.length === 0) {
      return list
    }
    return list.map(todo => {
      if (!todo.tag && !todo.chunk && !todo.unTag) {
        return
      }
      const reason = todo.reason || todo.match;
      const terms = getDoc([todo.pointer], document)[0];
      let validated;
      // handle 'safe' tag
      if (todo.safe === true) {
        // check for conflicting tags
        if (canBe(terms, todo.tag, model) === false) {
          return
        }
        // dont tag half of a hyphenated word
        if (terms[terms.length - 1].post === '-') {
          return
        }
        // Only an exact single tag was checked by canBe; arrays and shorthand
        // still need their individual checks in setTag.
        if (typeof todo.tag === 'string' && Object.hasOwn(model.one.tagSet, todo.tag)) {
          validated = model.one.tagSet[todo.tag];
        }
      }
      if (todo.tag !== undefined) {
        setTag(terms, todo.tag, world, todo.safe, `[post] '${reason}'`, validated);
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
        unTag(terms, todo.unTag, model.one.tagSet, reason);
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
    bulkTagger: tagger$2
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
    if (tag === 'Noun' || tag === 'Verb') {
      term.chunk = tag;
    }
  };

  // eslint-disable-next-line max-params
  const tagTerm = function (term, tag, tagSet, isSafe, validated, reason) {
    // does it already have this tag?
    if (term.tags.has(tag)) {
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
    const previous = debug$2.tags ? debug$2.before(term) : null;
    // for known tags, do logical dependencies first
    const known = tagSet[tag];
    if (known) {
      // first, we remove any conflicting tags
      if (known !== validated && known.not && known.not.length > 0) {
        const conflicts = getTagSet(known.not);
        for (const existing of term.tags) {
          if (conflicts.has(existing)) {
            // Safe and frozen terms cannot lose conflicting tags.
            if (isSafe === true) {
              return null
            }
            term.tags.delete(existing);
          }
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
    if (previous) {
      debug$2.log(term, previous, reason);
    }
    return true
  };

  // support '#Noun . #Adjective' syntax
  // eslint-disable-next-line max-params
  const multiTag = function (terms, tagString, tagSet, aliases, isSafe, reason) {
    const tags = tagString.split(isMulti);
    terms.forEach((term, i) => {
      const tag = tags[i];
      if (tag) {
        tagTerm(term, resolveTag(tag, aliases), tagSet, isSafe, undefined, reason);
      }
    });
  };

  // add a tag to all these terms
  // Whole-match validation is separate from per-term safety.
  // eslint-disable-next-line max-params
  const setTag = function (terms, tag, world = {}, isSafe, reason, validated) {
    const tagSet = world.model.one.tagSet || {};
    if (!tag) {
      return
    }
    if (Array.isArray(tag)) {
      tag.forEach(tg => setTag(terms, tg, world, isSafe, reason));
      return
    }
    if (typeof tag !== 'string') {
      console.warn(`compromise: Invalid tag '${tag}'`); // eslint-disable-line
      return
    }
    tag = tag.trim();
    // support '#Noun . #Adjective' syntax
    if (isMulti.test(tag)) {
      multiTag(terms, tag, tagSet, world.model.one.tagAliases, isSafe, reason);
      return
    }
    tag = resolveTag(tag, world.model.one.tagAliases);
    for (let i = 0; i < terms.length; i += 1) {
      tagTerm(terms[i], tag, tagSet, isSafe, validated, reason);
    }
  };

  // remove this tag, and its children, from these terms
  const unTag = function (terms, tag, tagSet, reason = 'untag') {
    tag = tag.trim().replace(/^#/, '');
    const children = getTagSet(tagSet[tag]?.children);
    for (let i = 0; i < terms.length; i += 1) {
      const term = terms[i];
      // don't untag anything if term is frozen
      if (term.frozen === true) {
        continue
      }
      const previous = debug$2.tags ? debug$2.before(term) : null;
      // support clearing all tags, with '*'
      if (tag === '*') {
        term.tags.clear();
        if (previous) {
          debug$2.log(term, previous, reason);
        }
        continue
      }
      // removing #Verb should also remove #PastTense
      if (children.size > 0) {
        for (const existing of term.tags) {
          if (children.has(existing)) {
            term.tags.delete(existing);
          }
        }
      }
      term.tags.delete(tag);
      if (previous) {
        debug$2.log(term, previous, reason);
      }
    }
  };

  const validate$1 = function (node) {
    node.children = node.children || [];
    node._cache = node._cache || {};
    node.props = node.props || {};
    node._cache.parents = node._cache.parents || [];
    return node
  };

  // Iterative DFS keeps deep inputs safe and distinguishes shared nodes from cycles.
  const checkCycles = roots => {
    const states = new Map();
    const stack = roots.map(node => [node, false]);
    for (; stack.length > 0;) {
      const [node, done] = stack.pop();
      if (done) {
        states.set(node, 2);
      } else if (states.get(node) === 1) {
        throw new Error('[Grad] - cyclic input')
      } else if (!states.has(node)) {
        states.set(node, 1);
        stack.push([node, true]);
        for (const child of node.children || []) {
          stack.push([child, false]);
        }
      }
    }
    return states.keys()
  };

  // turn parent-index rows into nested json
  const fromArray = function (rows) {
    const index = new Map();
    // addTags allocates these rows for this graph, so initialize them in place.
    rows.forEach(node => {
      validate$1(node);
      index.set(node.id, node);
    });
    const root = validate$1({});
    rows.forEach(node => {
      if (node.parent) {
        if (index.has(node.parent)) {
          const parent = index.get(node.parent);
          delete node.parent; //no-longer needed
          parent.children.push(node);
        } else {
          console.warn(`[Graph] - missing node '${node.parent}'`); // eslint-disable-line no-console
        }
        return
      }
      // no parent, add it to root
      root.children.push(node);
    });
    checkCycles(rows);
    return root
  };

  // [a, a1, b, b1]
  // Visitor-only callers can skip collecting nodes.
  const byDepth = (root, fn, collect = true) => {
    const list = collect ? [] : null;
    const queue = [root];
    for (; queue.length > 0;) {
      // get first
      const node = queue.pop();
      if (collect) {
        list.push(node);
      }
      // add kids to queue
      if (node.children) {
        for (let i = node.children.length - 1; i >= 0; i -= 1) {
          const child = node.children[i];
          if (fn) {
            fn(node, child);
          }
          queue.push(child);
        }
      }
    }
    return list
  };

  // Fresh graph nodes already have empty caches; fill ancestors in root-to-parent order.
  const cacheParents = root => {
    byDepth(root, (parent, child) => {
      if (parent.id) {
        child._cache.parents = parent._cache.parents.concat([parent.id]);
      }
    }, false);
  };

  // addTags supplies only exclusions, additional parents, and these scalar flags.
  const inherit = (props, parent) => {
    if (parent.not) {
      props.not = new Set([...props.not, ...parent.not]);
    }
    if (Array.isArray(parent.also) && (props.also === undefined || Array.isArray(props.also))) {
      props.also = parent.also.concat(props.also || []);
    } else if (props.also === undefined) {
      props.also = parent.also;
    }
    if (props.is === undefined) {
      props.is = parent.is;
    }
    if (props.novel === undefined) {
      props.novel = parent.novel;
    }
    return props
  };

  const fillDown = root => {
    byDepth(root, (parent, child) => {
      child.props = inherit(child.props, parent.props);
    }, false);
  };

  const toArray$2 = function (json) {
    // The tag formatter only reads these graph-owned nodes.
    const nodes = byDepth(json);
    // should we show the root?
    const root = nodes[0];
    if (root && !root.id && Object.keys(root.props).length === 0) {
      nodes.shift();
    }
    return nodes
  };

  // The tag-inheritance subset of grad-school;
  // https://github.com/spencermountain/grad-school

  class Graph {
    constructor(json) {
      Object.defineProperty(this, 'json', {
        enumerable: false,
        value: json,
        writable: true,
      });
    }
    cache() {
      cacheParents(this.json);
      return this
    }
    fillDown() {
      fillDown(this.json);
      return this
    }
    // the graph's nodes, parents first
    toArray() {
      // fillDown changes properties, so the cached graph relationships still hold.
      return toArray$2(this.json)
    }
  }

  const graph = rows => new Graph(fromArray(rows));

  // i just made these up
  const colors = {
    Noun: 'blue',
    Verb: 'green',
    Negative: 'green',
    Date: 'red',
    Value: 'red',
    Adjective: 'magenta',
    Connector: 'cyan',
    Determiner: 'cyan',
    Hyphenated: 'cyan',
    Adverb: 'cyan',
  };

  const getColor = function (node) {
    if (Object.hasOwn(colors, node.id)) {
      return colors[node.id]
    }
    if (Object.hasOwn(colors, node.is)) {
      return colors[node.is]
    }
    const found = node._cache.parents.find(c => colors[c]);
    return colors[found]
  };

  // convert tags to our final format
  const fmt = function (nodes) {
    const res = {};
    const each = fn => Object.keys(res).forEach(fn);
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
        children: [],
        color: getColor(node),
        // Retain the preferred output name for legacy model consumers.
        alias: node.aliases === undefined ? node.alias : node.aliases[0],
        aliases: node.aliases,
      };
    });
    // `also` is another inheritance edge. Resolve its ancestors before building
    // reverse edges, so removing any parent also removes all dependent tags.
    const resolved = new Set();
    const resolving = new Set();
    const resolveParents = function (tag) {
      if (resolved.has(tag)) {
        return res[tag].parents
      }
      if (resolving.has(tag)) {
        throw new Error(`compromise: cyclic tag inheritance at '${tag}'`)
      }
      resolving.add(tag);
      const parents = new Set();
      res[tag].parents.forEach(parent => {
        if (res[parent]) {
          resolveParents(parent).forEach(ancestor => parents.add(ancestor));
        }
        parents.add(parent);
      });
      res[tag].parents = Array.from(parents);
      resolving.delete(tag);
      resolved.add(tag);
      return res[tag].parents
    };
    each(resolveParents);
    each(tag => {
      res[tag].parents.forEach(parent => {
        if (res[parent]) {
          res[parent].children.push(tag);
        }
      });
    });

    // Inherit exclusions through every parent, then exclude all descendants of
    // each conflicting tag. Read a snapshot to keep this independent of order.
    const exclusions = {};
    each(tag => { exclusions[tag] = res[tag].not; });
    each(k => {
      const nots = new Set(exclusions[k]);
      res[k].parents.forEach(parent => {
        for (const not of exclusions[parent] || []) {
          nots.add(not);
        }
      });
      Array.from(nots).forEach(not => {
        if (res[not]) {
          res[not].children.forEach(tag => nots.add(tag));
        }
      });
      res[k].not = Array.from(nots);
      getTagSet(res[k].not);
      getTagSet(res[k].children);
      // Keep accepting custom definitions, but flag impossible combinations once
      // per tag, after both inheritance and reciprocal exclusions are resolved.
      const conflicts = [k, ...res[k].parents].filter(tag => nots.has(tag));
      if (conflicts.length > 0) {
        const names = conflicts.map(tag => `#${tag}`).join(', ');
        console.warn(`compromise: contradictory tag '#${k}' requires and excludes: ${names}`); // eslint-disable-line no-console
      }
    });
    return res
  };

  // Compile once per registration. Real tag names always take precedence.
  const compileAliases = (tags, normalize) => {
    const aliases = Object.create(null);
    Object.keys(tags).forEach(tag => { aliases[tag] = tag; });
    Object.keys(tags).forEach(tag => {
      const entry = tags[tag];
      const names = entry.aliases === undefined ? [entry.alias] : [entry.aliases].flat();
      names.forEach(name => {
        if (name === null || name === undefined) {
          return
        }
        if (typeof name !== 'string' || !/^[\p{L}_][\p{L}\p{M}\p{N}_-]*$/u.test(name)) {
          throw new Error(`compromise: invalid alias for '#${tag}'`)
        }
        // Match strings undergo Unicode normalization before parsing.
        const spellings = normalize ? [name, normalize(name)] : [name];
        spellings.forEach(spelling => {
          if (Object.hasOwn(tags, spelling)) {
            if (spelling !== name && spelling !== tag) {
              throw new Error(`compromise: tag alias '${name}' normalizes to '#${spelling}'`)
            }
            return
          }
          if (aliases[spelling] && aliases[spelling] !== tag) {
            throw new Error(`compromise: duplicate tag alias '${spelling}'`)
          }
          aliases[spelling] = tag;
        });
      });
    });
    return aliases
  };

  const toArr = function (input) {
    if (!input) {
      return []
    }
    if (typeof input === 'string') {
      return [input]
    }
    return input.slice()
  };

  const addImplied = function (tags) {
    const aliases = compileAliases(tags);
    const resolve = tag => aliases[tag] || tag;
    // add an implicit entry for any tag we reference
    const ensure = tag => {
      if (!Object.hasOwn(tags, tag)) {
        tags[tag] = {};
      }
    };
    Object.keys(tags).forEach(k => {
      const o = tags[k];
      // support deprecated fmts
      if (o.isA) {
        o.is = o.isA;
      }
      if (o.notA) {
        o.not = o.notA;
      }
      if (typeof o.is === 'string') {
        o.is = resolve(o.is);
      }
      if (o.also) {
        o.also = toArr(o.also).map(resolve);
      }
      if (o.not) {
        o.not = toArr(o.not).map(resolve);
      }
      // add any implicit 'is' tags
      if (o.is && typeof o.is === 'string') {
        ensure(o.is);
      }
      // Additional parents need entries too, including parents introduced by plugins.
      toArr(o.also).forEach(ensure);
      // add any implicit 'not' tags
      toArr(o.not).forEach(ensure);
    });
    return tags
  };


  const validate = function (tags, already) {
    // Reciprocal links must reach previously registered tags too. Copy entries
    // before normalization so the existing compiled model remains untouched.
    tags = Object.fromEntries(Object.keys({ ...already, ...tags }).map(tag => [tag, { ...already[tag], ...tags[tag] }]));
    tags = addImplied(tags);

    // property validation
    Object.keys(tags).forEach(k => {
      const o = tags[k];
      if (o.aliases !== undefined) {
        o.aliases = toArr(o.aliases);
      }
      o.children = toArr(o.children);
      o.not = toArr(o.not);
      if (o.also) {
        o.also = toArr(o.also);
      }
    });
    // not links are bi-directional
    // add any incoming not tags
    Object.keys(tags).forEach(k => {
      const nots = tags[k].not || [];
      nots.forEach(no => {
        if (tags[no] && tags[no].not && !tags[no].not.includes(k)) {
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
      return { id: k, parent: o.is, props, children: [], alias: o.alias, aliases: o.aliases?.slice() }
    });
    const graph$1 = graph(flatList).cache().fillDown();
    return graph$1.toArray()
  };

  const fromUser = function (tags) {
    Object.entries(tags).forEach(([k, v]) => {
      tags[k] = { ...v, novel: true };
    });
    return tags
  };

  const addTags$1 = function (tags, already) {
    // Normalization owns its definitions, including when callers reuse a tagset.
    tags = Object.fromEntries(Object.entries(tags).map(([tag, definition]) => [tag, { ...definition }]));
    // are these tags internal ones, or user-generated?
    if (Object.keys(already).length > 0) {
      tags = fromUser(tags);
    }
    tags = validate(tags, already);

    // do some basic setting-up
    // 'fill-down' parent logic
    const nodes = compute$1(tags);
    // convert it to our final format
    const res = fmt(nodes);
    return res
  };

  var methods$3 = {
    one: {
      setTag,
      unTag,
      addTags: addTags$1,
      canBe: canBe$1,
    },
  };

  // shared guards - returns the terms to change, or null
  const prep = function (view, input) {
    if (!view.found || !input) {
      return null
    }
    const terms = view.termList();
    if (terms.length === 0) {
      return null
    }
    return terms
  };

  const fns = {
    /** add a given tag, to all these terms */
    tag: function (input, reason = '', isSafe) {
      const terms = prep(this, input);
      if (terms) {
        this.methods.one.setTag(terms, input, this.world, isSafe, reason);
        this.uncache();
      }
      return this
    },

    /** add a given tag, only if it is consistent */
    tagSafe: function (input, reason = '') {
      return this.tag(input, reason, true)
    },

    /** remove a given tag from all these terms */
    unTag: function (input, reason) {
      const terms = prep(this, input);
      if (terms) {
        const { methods, model } = this;
        const { tagSet, tagAliases } = model.one;
        const list = Array.isArray(input) ? input : [input];
        list.forEach(tag => methods.one.unTag(terms, resolveTag(tag.trim(), tagAliases), tagSet, reason));
        this.uncache();
      }
      return this
    },

    /** return only the terms that can be this tag  */
    canBe: function (tag) {
      const { tagSet, tagAliases } = this.model.one;
      tag = resolveTag(tag, tagAliases);
      const canBe = this.methods.one.canBe;
      const nope = [];
      eachTerm(this.document, (term, terms, i, n) => {
        if (!canBe(term, tag, tagSet)) {
          nope.push([n, i, i + 1]);
        }
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
    const world = this.world();
    const { model, methods } = world;
    const tagSet = model.one.tagSet;
    const fn = methods.one.addTags;
    const res = fn(tags, tagSet);
    const aliases = compileAliases(res, name => methods.one.killUnicode(name, world));
    model.one.tagSet = res;
    model.one.tagAliases = aliases;
    return this
  };

  var lib$1 = { addTags };

  const boringTags = new Set(['Auxiliary', 'Possessive']);

  const sortByKids = function (tags, tagSet) {
    tags = tags.sort((a, b) => {
      // (unknown tags are interesting)
      if (boringTags.has(a) || !Object.hasOwn(tagSet, b)) {
        return 1
      }
      if (boringTags.has(b) || !Object.hasOwn(tagSet, a)) {
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
    eachTerm(document, term => {
      const tags = Array.from(term.tags);
      term.tagRank = sortByKids(tags, tagSet);
    });
  };

  var tag = {
    model: {
      one: { tagSet: {}, tagAliases: Object.create(null) }
    },
    compute: {
      tagRank
    },
    methods: methods$3,
    api: tagAPI,
    lib: lib$1
  };

  // Scan punctuation runs once. Searching for an unanchored run followed by
  // whitespace repeatedly rescans long runs that have no following whitespace.
  const stops = new Set('.!?\u203D\u2E18\u203C\u2047\u2048\u2049\u0964\u0965\u061F\u06D4\u0589\u1362\u1367\u104B\u17D4\u3002');
  const cjkStops = new Set('。！？｡');
  const openers$1 = new Set('「『（【〔《〈“');
  const closers = new Set('」』）】〕》〉”');
  const whitespace = /\s/;
  const splitsOnly = /^[.!?‽⸘‼\u2047-\u2049।॥؟۔։።፧။។。]+\s$/;
  const splitsOnlyCjk = /^(?:[.!?‽⸘‼\u2047-\u2049।॥؟۔։።፧။។。！？｡]+\s|[。！？｡]+[」』）】〕》〉”]*)$/;
  const newLine = /((?:\r?\n|\r)+)/;

  const basicSplit = function (text) {
    const all = [];
    const isCjk = /[。！？｡]/.test(text);
    const activeStops = isCjk ? new Set([...stops, ...cjkStops]) : stops;
    for (const line of text.split(newLine)) {
      let start = 0;
      const arr = [];
      const emit = (from, end) => {
        arr.push(line.slice(start, from), line.slice(from, end));
        start = end;
      };
      let i = 0;
      while (i < line.length) {
        if (!activeStops.has(line[i])) {
          i++;
          continue
        }
        const runStart = i;
        while (i < line.length && activeStops.has(line[i])) i++;
        if (i < line.length && whitespace.test(line[i])) {
          emit(runStart, i + 1);
          i++;
          continue
        }
        if (!isCjk) continue
        // A CJK stop ends a sentence without whitespace. Following closing quotes
        // only end it when followed by whitespace, another opener, or end of text.
        let j = runStart;
        while (j < i) {
          if (!cjkStops.has(line[j])) {
            j++;
            continue
          }
          const from = j;
          while (j < i && cjkStops.has(line[j])) j++;
          let end = j;
          while (end < line.length && closers.has(line[end])) end++;
          if (end === j || end === line.length || whitespace.test(line[end]) || openers$1.has(line[end])) {
            emit(from, end);
            if (end > i) i = end;
          }
        }
      }
      arr.push(line.slice(start));
      // Preserve the existing merge behavior, including punctuation-only pieces.
      for (let k = 0; k < arr.length; k++) {
        const next = arr[k + 1];
        if (next && (isCjk ? splitsOnlyCjk : splitsOnly).test(next)) {
          arr[k] += next;
          arr[k + 1] = '';
        }
        if (arr[k]) all.push(arr[k]);
      }
    }
    return all
  };

  // a letter, number, or symbol/emoji in any script - otherwise it's only punctuation
  const hasLetter$2 = /[\p{L}\p{N}\p{So}]/u;
  const hasSomething$1 = /\S/;

  const notEmpty = function (splits) {
    const chunks = [];
    let lead = ''; // whitespace+punctuation, before the first chunk
    for (let i = 0; i < splits.length; i++) {
      const s = splits[i];
      if (s === undefined || s === '') {
        continue
      }
      //this is meaningful whitespace
      if (!hasSomething$1.test(s) || !hasLetter$2.test(s)) {
        //add it to the last one
        if (chunks[chunks.length - 1]) {
          chunks[chunks.length - 1] += s;
          continue
        } else if (splits[i + 1]) {
          //add it to the next one
          lead += s;
          continue
        }
      }
      //else, only whitespace, no terms, no sentence
      chunks.push(lead + s);
      lead = '';
    }
    return chunks
  };

  const hasLetter$1 = /\p{L}/u;

  const hasNewline = function (c) {
    return Boolean(/\n$/.test(c))
  };

  //loop through these chunks, and join the non-sentence chunks back together..
  // (only check the end of the joined text - re-reading it for every chunk is quadratic)
  const smartMerge = function (chunks, world) {
    const isSentence = world.methods.one.tokenize.isSentence;
    const abbrevs = world.model.one.abbreviations || new Set();

    const sentences = [];
    let sentence = '';
    let tail = '';
    let foundLetter = false;
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      sentence += c;
      tail = (tail + c).slice(-64);
      foundLetter ||= hasLetter$1.test(c);
      //should this chunk be combined with the next one?
      if (chunks[i + 1] && !isSentence(tail, abbrevs, foundLetter) && !hasNewline(c)) {
        continue
      }
      //this chunk is a proper sentence..
      if (sentence.length > 0) {
        sentences.push(sentence);
      }
      sentence = '';
      tail = '';
      foundLetter = false;
    }
    return sentences
  };

  // merge embedded quotes into 1 sentence
  // like - 'he said "no!" and left.'
  const MAX_QUOTE = 280; // ¯\_(ツ)_/¯
  const MAX_AHEAD = 5;

  // each opening quote, and the marks that may close it
  // (some marks open a quote in one language, and close it in another)
  // a third mark means 'not an opener, when that one is around'
  // don't support single-quotes for multi-sentences
  const pairs$2 = [
    ['\u0022', '\u0022'], // straight
    ['\uFF02', '\uFF02'], // wide
    ['\u201C', '\u201D', '\u201E'], // english (but it closes a german one)
    ['\u201F', '\u201D'], // reversed
    ['\u201E', '\u201D\u201C'], // polish, german
    ['\u2E42', '\u201D'], // low-reversed
    ['\u201A', '\u2019\u2018'], // low-single, german
    ['\u00AB', '\u00BB'], // french
    ['\u00BB', '\u00AB'], // german
    ['\u2039', '\u203A'], // single
    ['\u203A', '\u2039'], // single, reversed
    ['\u2035', '\u2032'], // prime
    ['\u2036', '\u2033'], // double-prime
    ['\u2037', '\u2034'], // triple-prime
    ['\u301D', '\u301E'], // prime
    ['\u301F', '\u301E'], // low-prime
    ['\u300C', '\u300D'], // corner
    ['\u300E', '\u300F'], // white-corner
  ];

  const count$1 = function (str, chars) {
    let n = 0;
    for (const c of str) {
      if (chars.includes(c)) {
        n += 1;
      }
    }
    return n
  };

  // is there a quotation here, that hasn't closed yet?
  const isOpen = function (str) {
    return pairs$2.some(([open, close, unless]) => {
      const n = count$1(str, open);
      if (n === 0 || (unless && str.includes(unless))) {
        return false
      }
      // the same mark opens and closes
      if (open === close) {
        return n % 2 === 1
      }
      return n > count$1(str, close)
    })
  };

  // allow micro-sentences when inside a quotation, like:
  // the doc said "no sir. i will not beg" and walked away.
  const quoteMerge = function (splits) {
    const arr = [];
    for (let i = 0; i < splits.length; i += 1) {
      let str = splits[i];
      if (isOpen(str)) {
        // look ahead for the sentence that closes it
        let toAdd = '';
        for (let n = i + 1; n < splits.length && n - i <= MAX_AHEAD; n += 1) {
          toAdd += splits[n];
          //make sure it's not too-long
          if (toAdd.length >= MAX_QUOTE) {
            break
          }
          if (!isOpen(str + toAdd)) {
            // merge them all
            str += toAdd;
            i = n;
            break
          }
        }
      }
      arr.push(str);
    }
    return arr
  };

  const MAX_LEN = 250;// ¯\_(ツ)_/¯

  // support unicode variants?
  // https://stackoverflow.com/questions/13535172/list-of-all-unicodes-open-close-brackets
  const hasOpen$2 = /[(\uFF08]/g;
  const hasClosed$2 = /[)\uFF09]/g;
  const mergeParens = function (splits) {
    const arr = [];
    for (let i = 0; i < splits.length; i += 1) {
      const split = splits[i];
      const m = split.match(hasOpen$2);
      if (m !== null && m.length === 1) {
        // look at next sentence, for closing parenthesis
        if (splits[i + 1] && splits[i + 1].length < MAX_LEN) {
          const m2 = splits[i + 1].match(hasClosed$2);
          if (m2 !== null && m.length === 1 && !hasOpen$2.test(splits[i + 1])) {
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
    text ||= '';
    text = String(text);
    // Ensure it 'smells like' a sentence
    if (!text || typeof text !== 'string' || !hasSomething.test(text)) {
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

  const notWord = new Set(toList(`
.
?
!
:
;
-
–
—
--
...
(
)
[
]
"
'
\`
«
»
*
•
`));

  //turn a string into an array of strings (naiive for now, lumped later)
  const splitWords = function (str, model) {
    let result = [];
    let arr = [];
    //start with a naiive split
    str ||= '';
    if (typeof str === 'number') {
      str = String(str);
    }
    if (Array.isArray(str)) {
      return str
    }
    const words = str.split(naiiveSplit);
    for (let i = 0; i < words.length; i++) {
      //split 'one-two'
      if (hasHyphen$1(words[i], model)) {
        arr = arr.concat(splitHyphens$1(words[i]));
        continue
      }
      arr.push(words[i]);
    }
    //greedy merge whitespace+arr to the right
    let carry = '';
    for (let i = 0; i < arr.length; i++) {
      const word = arr[i];
      //if it's more than a whitespace
      if (wordlike.test(word) && !notWord.has(word) && !isBoundary.test(word)) {
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
  const isMark = /\p{Mark}/u;
  const isNumber = /[\p{Number}\p{Currency_Symbol}]/u;
  const hasAcronym = /^[a-z]\.([a-z]\.)+/i;
  const chillin = /[sn]['’]$/;
  // a leading apostrophe that stands for letters - 'tis, 'em, 'cause
  const elision = /^['’](tis|twas|em|cause|til|bout|round)\b/i;
  const isFullNumber = /^[(+\-]?\d+(th|st|nd|rd)?[)+\-]?$/;
  const openers = { ')': '(', ']': '[', '}': '{' };

  // does this closing bracket close one inside the word, like 'foo(bar)'
  const closesInside = function (chars, start, end) {
    const close = chars[end - 1];
    let depth = 0;
    for (let i = start; i < end - 1; i += 1) {
      if (chars[i] === openers[close]) {
        depth += 1;
      } else if (chars[i] === close) {
        depth -= 1;
      }
    }
    return depth > 0
  };

  const normalizePunctuation = function (str, model) {
    // quick lookup for allowed pre/post punctuation
    const { prePunctuation, postPunctuation, emoticons } = model.one;
    const original = str;
    const trimmed = str.trim();
    let pre = '';
    let post = '';
    const chars = Array.from(str);
    let start = 0;
    let end = chars.length;

    // punctuation-only words, like '<3'
    if (Object.hasOwn(emoticons, trimmed)) {
      return { str: trimmed, pre, post: ' ' } //not great
    }

    // Locate the first retained code point without shifting the array.
    while (start < end) {
      const c = chars[start];
      // keep any declared chars
      if (prePunctuation[c] === true) {
        break//keep it
      }
      // keep '+' or '-' only before a number
      if ((c === '+' || c === '-' || c === '(') && isFullNumber.test(trimmed)) {
        break//done
      }
      // start of word
      if (isLetter.test(c) || isNumber.test(c)) {
        break //done
      }
      // keep an elided apostrophe - 'tis
      if ((c === "'" || c === '’') && elision.test(chars.slice(start).join(''))) {
        break//keep it
      }
      // punctuation
      start++;
    }

    // Locate the last retained code point.
    while (end > start) {
      const c = chars[end - 1];
      // keep any declared chars
      if (postPunctuation[c] === true) {
        break//keep it
      }
      // start of word
      if (isLetter.test(c) || isNumber.test(c)) {
        break //done
      }
      // Keep marks attached to letters, but not variation selectors after symbols.
      if (isMark.test(c)) {
        let base = end - 2;
        while (base >= start && isMark.test(chars[base])) {
          base--;
        }
        if (base >= start && isLetter.test(chars[base])) {
          break
        }
        end = base + 1;
        continue
      }
      // F.B.I.
      if (c === '.' && hasAcronym.test(original)) {
        break//keep it
      }
      //  keep s-apostrophe - "flanders'" or "chillin'"
      if (c === "'" && chillin.test(original)) {
        break//keep it
      }
      // keep '+' or ')' only for a number like (800) or 500+
      if ((c === '+' || c === ')') && isFullNumber.test(trimmed)) {
        break//done
      }
      if (Object.hasOwn(openers, c) && closesInside(chars, start, end)) {
        break//keep it
      }
      // punctuation
      end--;
    }
    pre = chars.slice(0, start).join('');
    post = chars.slice(end).join('');
    str = chars.slice(start, end).join('');
    //we went too far..
    if (str === '') {
      // do a very mild parse, and hope for the best.
      let last = original.length;
      while (last > 0 && original[last - 1] === ' ') last--;
      post = original.slice(last);
      str = original.slice(0, last);
      pre = '';
    }
    return { str, pre, post }
  };

  const parseTerm$1 = (txt, model) => {
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
    str ||= '';
    const chars = str.split('');
    chars.forEach((s, i) => {
      if (unicode[s]) {
        chars[i] = unicode[s];
      }
    });
    return chars.join('')
  };

  // Inspect the trailing run once, including when punctuation occurs internally.
  const trimPunctuation = (str, punctuation) => {
    let end = str.length;
    while (end > 0 && punctuation.test(str[end - 1])) end--;
    return str.slice(0, end)
  };

  /** some basic operations on a string to reduce noise */
  const clean = function (str) {
    str ||= '';
    str = str.toLowerCase();
    str = str.trim();
    const original = str;
    //punctuation
    str = trimPunctuation(str, /[,;.!?]/);
    //coerce Unicode ellipses
    str = str.replaceAll('…', '...');
    //en-dash
    str = str.replaceAll('–', '-');
    //strip leading & trailing grammatical punctuation
    if (!/^[:;]/.test(str)) {
      str = trimPunctuation(str, /[",.!:;?)]/);
      str = str.replace(/^['’"(]+/g, '');
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
  const acronyms = [
    /^([A-Z]\.)+[A-Z]?,?$/, //like N.D.A
    /^([a-z]\.)+[a-z]\.?$/, //like c.e.o
    /^[A-Z]\.,?$/, //like 'F.'
    /^[A-Z]{2,}('s|,)?$/, //like NDA
  ];

  const isAcronym$2 = str => acronyms.some(re => re.test(str));

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
  const parse$1 = function (input, world) {
    const { methods, model } = world;
    const { splitSentences, splitTerms, splitWhitespace } = methods.one.tokenize;
    input ||= '';
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
  const hasEllipse = /(?:\u2026|\.{2}) *$/; // '...'
  const hasLetter = /\p{L}/u;
  const hasPeriod = /\. *$/;
  const leadInit = /^\p{Lu}\. $/u; // "W. Kensington"
  // an initial in any alphabet - 'А. С. Пушкин'
  const isInitial = /[ .]\p{Lu}\. *$/u;

  /** does this look like a sentence? - str can be the end of it, if foundLetter is given */
  const isSentence = function (str, abbrevs, foundLetter = hasLetter.test(str)) {
    // must have a letter
    if (foundLetter === false) {
      return false
    }
    // check for 'F.B.I.'
    if (isAcronym$1.test(str) || isInitial.test(str)) {
      return false
    }
    // check for leading initial - "W. Kensington"
    if (str.length === 3 && leadInit.test(str)) {
      return false
    }
    //check for '...'
    if (hasEllipse.test(str)) {
      return false
    }
    const txt = str.replace(/[.!?\u203D\u2E18\u203C\u2047-\u2049] *$/, '');
    const words = txt.split(' ');
    const lastWord = words[words.length - 1].toLowerCase();
    // check for 'Mr.' (and not mr?)
    if (Object.hasOwn(abbrevs, lastWord) && hasPeriod.test(str)) {
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
        splitWhitespace: parseTerm$1,
        fromString: parse$1,
      },
    },
  };

  const aliases$1 = {
    '&': 'and',
    '@': 'at',
    '%': 'percent',
    'plz': 'please',
    'bein': 'being',
  };

  // prob=probably, pron=pronunciation, gal=gallon, fig=figure, lat/lng=latitude/longitude,
  // vol=volume, fm (not am), def=definition, plz=please, ea=each, sec=second, pref=preface,
  // pl=plural, pp=pages, qt=quarter, fr=french, nee=given name at birth, ss=ship or sections,
  // ver=version, fem/masc, eng=engineering/english, adj/vb/rb/inf=grammar, situ/vivo/vitro=in situ..
  // wr=world record
  var misc$4 = toList(`
approx
apt
bc
cyn
eg
esp
est
etc
ex
exp
prob
pron
gal
min
pseud
fig
jd
lat
lng
vol
fm
def
misc
plz
ea
ps
sec
pt
pref
pl
pp
qt
fr
sq
nee
ss
tel
temp
vet
ver
fem
masc
eng
adj
vb
rb
inf
situ
vivo
vitro
wr
`);

  // (not miss, misses)
  var honorifics$1 = toList(`
adj
adm
adv
asst
atty
bldg
brig
capt
cmdr
comdr
cpl
det
dr
esq
gen
gov
hon
jr
llb
lt
maj
messrs
mlle
mme
mr
mrs
ms
mstr
phd
prof
pvt
rep
reps
res
rev
sen
sens
sfc
sgt
sir
sr
supt
surg
`);

  var months = toList(`
jan
feb
mar
apr
jun
jul
aug
sep
sept
oct
nov
dec
`);

  var nouns$3 = toList(`
ad
al
arc
ba
bl
ca
cca
col
corp
ft
fy
ie
lit
ma
md
pd
tce
`);

  var organizations = toList(`
dept
univ
assn
bros
inc
ltd
co
`);

  // streets, then states/provinces (not ct)
  var places = toList(`
rd
st
dist
mt
ave
blvd
cl
cres
hwy
ariz
cal
calif
colo
conn
fla
fl
ga
ida
ia
kan
kans
minn
neb
nebr
okla
penna
penn
pa
dak
tenn
tex
ut
vt
va
wis
wisc
wy
wyo
usafa
alta
ont
que
sask
`);

  // units that are abbreviations too (not ft, gb, pa - ambiguous)
  // dm=decimeter, hr/hrs=hour, dg/cg/mg/µg=grams, lb=pound, oz=ounce, hz=hertz,
  // mps=meters per second, kmph=kilometers per hour, kb/mb/tb/yb=bytes, lx=lux, lm=lumen
  var units = toList(`
dl
ml
gal
qt
pt
tbl
tsp
tbsp
km
dm
cm
mm
mi
td
hr
hrs
kg
hg
dg
cg
mg
µg
lb
oz
sq ft
hz
mps
mph
kmph
kb
mb
tb
lx
lm
fl oz
yb
`);

  // add our abbreviation list to our lexicon
  const list = [
    [misc$4],
    [units, 'Unit'],
    [nouns$3, 'Noun'],
    [honorifics$1, 'Honorific'],
    [months, 'Month'],
    [organizations, 'Organization'],
    [places, 'Place'],
  ];
  // create key-val for sentence-tokenizer
  const abbreviations$1 = {};
  // add them to a future lexicon
  const lexicon$1 = {};

  list.forEach(a => {
    a[0].forEach(w => {
      // sentence abbrevs
      abbreviations$1[w] = true;
      // future-lexicon
      lexicon$1[w] = 'Abbreviation';
      if (a[1] !== undefined) {
        lexicon$1[w] = [lexicon$1[w], a[1]];
      }
    });
  });

  // dashed prefixes that are not independent words
  //  'mid-century', 'pre-history', 'out-lived', 'ex-wife'
  // (not counter, mid, non, over, post, semi, super, ultra, under, whole)
  var prefixes = toHash(toList(`
anti
bi
co
contra
de
extra
infra
inter
intra
macro
micro
mis
mono
multi
peri
pre
pro
proto
pseudo
re
sub
supra
trans
tri
un
out
ex
`));

  // dashed suffixes that are not independent words
  //  'flower-like', 'president-elect'  (not fold)
  var suffixes$1 = toHash(toList(`
like
ish
less
able
elect
type
designate
`));

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

  // zero-width chars
  const zeroWidth = '\u200B\u200C\u200D\uFEFF';

  // punctuation to keep at start of word - #hastag, @atmention, underscore
  // (not +4, -4, .4)
  const prePunctuation = toHash(('#@_°' + zeroWidth).split(''));

  // punctuation to keep at end of word - 88%, underscore, degrees/italian ordinal
  const postPunctuation = toHash(('%_°' + zeroWidth).split(''));

  const emoticons = toHash('<3 </3 <\\3 :^P :^p :^O :^3'.split(' '));

  var model$3 = {
    one: {
      aliases: aliases$1,
      abbreviations: abbreviations$1,
      prefixes,
      suffixes: suffixes$1,
      prePunctuation,
      postPunctuation,
      lexicon: lexicon$1, //give this one forward
      unicode: unicode$1,
      emoticons
    },
  };

  const hasSlash$1 = /\//;
  const hasDomain = /[a-z]\.[a-z]/i;
  const isMath = /[0-9]/;
  // const hasSlash = /[a-z\u00C0-\u00FF] ?\/ ?[a-z\u00C0-\u00FF]/
  // const hasApostrophe = /['’]s$/

  const addAliases = function (term, world) {
    const str = term.normal || term.text || term.machine;
    const aliases = world.model.one.aliases;
    // lookup known aliases like '&'
    if (Object.hasOwn(aliases, str)) {
      term.alias ||= [];
      term.alias.push(aliases[str]);
    }
    // support slashes as aliases
    if (hasSlash$1.test(str) && !hasDomain.test(str) && !isMath.test(str)) {
      const arr = str.split(hasSlash$1);
      // don't split urls and things
      if (arr.length <= 3) {
        arr.forEach(word => {
          word = word.trim();
          if (word !== '') {
            term.alias ||= [];
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
    const counts = Object.create(null);
    eachTerm(docs, term => {
      const word = term.machine || term.normal;
      counts[word] ??= 0;
      counts[word] += 1;
    });
    // add counts on each term
    eachTerm(docs, term => {
      term.freq = counts[term.machine || term.normal];
    });
  };

  // get all character startings in doc
  const offset = function (view) {
    let elapsed = 0;
    let index = 0;
    //start from the actual-top
    eachTerm(view.document, term => {
      term.offset = {
        index: index,
        start: elapsed + term.pre.length,
        length: term.text.length,
      };
      elapsed += term.pre.length + term.text.length + term.post.length;
      index += 1;
    });
  };

  // cheat- add the document's pointer to the terms
  const index = function (view) {
    eachTerm(view.document, (term, terms, t, n) => {
      term.index = [n, t];
    });
  };

  const wordCount = function (view) {
    let n = 0;
    eachTerm(view.docs, term => {
      //skip implicit words
      if (term.normal !== '') {
        n += 1;
        term.wordCount = n;
      }
    });
  };

  // cheat-method for a quick loop
  const termLoop = (view, fn) => eachTerm(view.docs, term => fn(term, view.world));

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
    const lastTerm = docs.at(-1)?.at(-1);
    // if we've already put whitespace, end.
    if (!lastTerm || lastTerm.post) {
      return
    }
    // if we found something
    if (Object.hasOwn(prefixes, lastTerm.normal)) {
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
    const term = docs.at(-1)?.at(-1);
    if (term?.typeahead === true && term.machine) {
      term.text = term.machine;
      term.normal = term.machine;
    }
    return this
  };

  const api$d = function (View) {
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
        if (opts.safe && Object.hasOwn(world.model.one.lexicon, prefix)) {
          continue
        }
        // does it already exist?
        if (Object.hasOwn(existing, prefix)) {
          collisions.push(prefix);
          continue
        }
        if (Object.hasOwn(index, prefix)) {
          collisions.push(prefix);
          continue
        }
        index[prefix] = str;
      }
    });
    // merge with existing prefixes
    index = { ...existing, ...index };
    // remove ambiguous-prefixes
    collisions.forEach((str) => {
      delete index[str];
    });
    return index
  };

  const defaults$2 = {
    safe: true,
    min: 3,
  };

  const prepare = function (words = [], opts = {}) {
    const model = this.model();
    opts = { ...defaults$2, ...opts };
    if (isObject$1(words)) {
      Object.assign(model.one.lexicon, words);
      words = Object.keys(words);
    }
    const prefixes = getPrefixes(words, opts, this.world());
    // manually combine these with any existing prefixes
    Object.keys(prefixes).forEach(str => {
      // explode any overlaps
      if (Object.hasOwn(model.one.typeahead, str)) {
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
    api: api$d,
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
  nlp.plugin(plugin$1); //~6kb
  nlp.extend(tokenize$2); //7kb
  nlp.extend(freeze); //
  nlp.plugin(cache$3); //~1kb
  nlp.extend(lookup$1); //7kb
  nlp.extend(typeahead); //1kb
  nlp.extend(lexicon$2); //1kb
  nlp.extend(sweep); //1kb

  const getWords = function (net) {
    return Object.keys(net.hooks).filter(w => !w.startsWith('#') && !w.startsWith('%'))
  };

  const maybeMatch = function (doc, net) {
    // must have *atleast* one of these words
    const words = getWords(net);
    if (words.length === 0) {
      return doc
    }
    if (!doc._cache) {
      doc.cache();
    }
    const cache = doc._cache;
    // return sentences that have one of our needed words
    return doc.filter((_m, i) => {
      return words.some(str => cache[i].has(str))
    })
  };

  // tokenize first, then only tag sentences required
  const lazy = function (input, reg) {
    let net = reg;
    if (typeof reg === 'string') {
      net = this.buildNet([{ match: reg }]);
    }
    const doc = this.tokenize(input);
    const m = maybeMatch(doc, net);
    if (m.found) {
      m.compute(['index', 'tagger']);
      return m.match(reg)
    }
    return doc.none()
  };

  var lazy$1 = {
    lib: {
      lazy,
    },
  };

  // Preferred alias identifiers holding canonical tag names.
  // NN is the umbrella noun tag; Sing is specifically singular.
  const NN = 'Noun';
  const Sing = 'Singular';
  const Plur = 'Plural';
  const Prop = 'ProperNoun';
  const Pron = 'Pronoun';

  const Adj = 'Adjective';
  const Comp = 'Comparative';
  const Adv = 'Adverb';
  const Det = 'Determiner';

  const Vb = 'Verb';
  const Inf = 'Infinitive';
  const Past = 'PastTense';
  const Ger = 'Gerund';
  const Pres = 'PresentTense';
  const Fut = 'FutureTense';

  const Cop = 'Copula';
  const Phrasal = 'PhrasalVerb';
  const Conj = 'Conjunction';
  const Prep = 'Preposition';
  const Expr = 'Expression';
  const QW = 'QuestionWord';

  const Pers = 'Person';
  const Place = 'Place';
  const Org = 'Organization';
  const First = 'FirstName';
  const Last = 'LastName';
  const MaleName = 'MaleName';
  const FemaleName = 'FemaleName';
  const Uncountable = 'Uncountable';
  const SportsTeam = 'SportsTeam';
  const Country = 'Country';
  const City = 'City';
  const Region = 'Region';

  const Val = 'Value';
  const Card = 'Cardinal';
  const Ord = 'Ordinal';
  const TxtNum = 'TextValue';
  const Numeric = 'NumericValue';
  const RomanNumeral = 'RomanNumeral';
  const Frac = 'Fraction';

  const Date = 'Date';
  const WeekDay = 'WeekDay';
  const Year = 'Year';
  const FinancialQuarter = 'FinancialQuarter';
  const Season = 'Season';
  const Time = 'Time';
  const Timezone = 'Timezone';

  const Connector = 'Connector';
  const Abbr = 'Abbreviation';
  const Acronym = 'Acronym';
  const HashTag = 'HashTag';
  const AtMention = 'AtMention';

  const Emoji = 'Emoji';
  const Emoticon = 'Emoticon';
  const SlashedTerm = 'SlashedTerm';
  const Email = 'Email';
  const PhoneNumber = 'PhoneNumber';
  const Url = 'Url';

  const entity = [Pers, Place, Org];

  var nouns$2 = {
    Noun: {
      aliases: [null, 'NN'],
      not: [Vb, Adj, Adv, Val, Det],
    },
    Singular: {
      aliases: [null, 'Sing', 'SG', 'NN1'],
      is: NN,
      not: [Plur, Uncountable],
    },
    // 'Canada'
    ProperNoun: {
      aliases: ['Prop', 'NNP', 'PROPN', 'NP0'],
      is: NN,
    },
    Person: {
      aliases: [null, 'Pers'],
      is: Sing,
      also: [Prop],
      not: [Place, Org, Date],
    },
    FirstName: {
      aliases: [null, 'First'],
      is: Pers,
    },
    MaleName: {
      is: First,
      not: [FemaleName, Last],
    },
    FemaleName: {
      is: First,
      not: [MaleName, Last],
    },
    LastName: {
      aliases: [null, 'Last'],
      is: Pers,
      not: [First],
    },
    // 'dr.'
    Honorific: {
      aliases: ['Hon'],
      is: Pers,
      not: [First, Last, Val],
    },
    Place: {
      is: Sing,
      not: [Pers, Org],
    },
    Country: {
      is: Place,
      also: [Prop],
      not: [City],
    },
    City: {
      is: Place,
      also: [Prop],
      not: [Country],
    },
    // 'california'
    Region: {
      is: Place,
      also: [Prop],
    },
    Address: {
      aliases: ['Addr'],
      // is: 'Place',
    },
    Organization: {
      aliases: ['Org'],
      is: Prop,
      not: [Pers, Place],
    },
    SportsTeam: {
      aliases: [null, 'Team'],
      is: Org,
    },
    School: {
      is: Org,
    },
    Company: {
      is: Org,
    },
    Plural: {
      aliases: [null, 'Plur', 'NNS', 'PL', 'NN2'],
      is: NN,
      not: [Sing, Uncountable],
    },
    // 'gravity'
    Uncountable: {
      is: NN,
    },
    // 'it'
    Pronoun: {
      aliases: [null, 'Pron', 'PRP', 'PRON'],
      is: NN,
      not: entity,
    },
    // 'swimmer'
    Actor: {
      is: NN,
      not: [Place, Org],
    },
    // walking
    Activity: {
      is: NN,
      not: [Pers, Place],
    },
    // kilometres
    Unit: {
      is: NN,
      not: entity,
    },
    // canadian
    Demonym: {
      aliases: [null, 'Dem'],
      is: NN,
      also: [Prop],
      not: entity,
    },
    // [spencer's] hat
    Possessive: {
      aliases: ['Poss'],
      is: NN,
    },
    // 'yourself'
    Reflexive: {
      aliases: [null, 'Refl'],
      is: Pron,
    },
  };

  var verbs$2 = {
    Verb: {
      aliases: ['Vb', 'V', 'VB'],
      not: [NN, Adj, Adv, Val, Expr],
    },
    // 'he [walks]'
    PresentTense: {
      aliases: ['Pres', 'PRS'],
      is: Vb,
      not: [Past, Fut],
    },
    // 'will [walk]'
    Infinitive: {
      aliases: ['Inf', 'VVI'],
      is: Pres,
      not: [Ger],
    },
    // '[walk] now!'
    Imperative: {
      aliases: ['Imp'],
      is: Vb,
      not: [Past, Ger, Cop],
    },
    // walking
    Gerund: {
      aliases: ['Ger', 'VBG'],
      is: Pres,
      not: [Cop],
    },
    // walked
    PastTense: {
      aliases: ['Past', 'VBD', 'PST'],
      is: Vb,
      not: [Pres, Ger, Fut],
    },
    // will walk
    FutureTense: {
      aliases: ['Fut'],
      is: Vb,
      not: [Pres, Past],
    },
    // is/was
    Copula: {
      aliases: [null, 'Cop'],
      is: Vb,
    },
    // '[could] walk'
    Modal: {
      aliases: [null, 'Mod', 'MD'],
      is: Vb,
      not: [Inf],
    },
    // 'awaken'
    Participle: {
      aliases: [null, 'VBN'],
      is: Past,
    },
    // '[will have had] walked'
    Auxiliary: {
      aliases: ['Aux'],
      is: Vb,
      not: [Past, Pres, Ger, Conj],
    },
    // 'walk out'
    PhrasalVerb: {
      aliases: ['Phrasal', 'PhrV'],
      is: Vb,
    },
    // 'walk [out]'
    Particle: {
      aliases: [null, 'RP'],
      is: Phrasal,
      not: [Past, Pres, Cop, Ger],
    },
    // 'walked by'
    Passive: {
      aliases: [null, 'Pass'],
      is: Vb,
    },
  };

  // Written format is independent of quantity types such as Fraction or Money.
  var values$1 = {
    Value: {
      aliases: ['Val', 'Num'],
      not: [Vb, Adj, Adv],
    },
    Ordinal: {
      aliases: [null, 'Ord'],
      is: Val,
      not: [Card],
    },
    Cardinal: {
      aliases: [null, 'Card', 'CD'],
      is: Val,
      not: [Ord],
    },
    Fraction: {
      aliases: [null, 'Frac'],
      is: Val,
      not: [NN],
    },
    Multiple: {
      aliases: [null, 'Mult'],
      is: TxtNum,
    },
    RomanNumeral: {
      aliases: [null, 'RomNum'],
      is: Card,
    },
    TextValue: {
      aliases: [null, 'TxtNum'],
      is: Val,
      not: [Numeric, RomanNumeral],
    },
    NumericValue: {
      aliases: ['Numeric'],
      is: Val,
      not: [RomanNumeral],
    },
    Money: {
      is: Card,
    },
    Percent: {
      aliases: [null, 'Perc', 'Pct'],
      is: Val,
    },
  };

  // Calendar/clock components are distinct. Holiday and Duration describe spans
  // that can overlap components or one another (for example, 'Christmas Day').
  // Each exclusion pair is declared once; the tag compiler supplies reciprocity.
  var dates$1 = {
    Date: {
      not: [Vb, Adv, Adj],
    },
    Month: {
      is: Date,
      also: [NN],
      not: [WeekDay, Year, FinancialQuarter, Season, Time, Timezone],
    },
    WeekDay: {
      is: Date,
      also: [NN],
      not: [Year, FinancialQuarter, Season, Time, Timezone],
    },
    Year: {
      is: Date,
      not: [RomanNumeral, FinancialQuarter, Season, Time, Timezone],
    },
    FinancialQuarter: {
      is: Date,
      aliases: [null, 'Quarter'],
      not: [Frac, Season, Time, Timezone],
    },
    // 'easter'
    Holiday: {
      is: Date,
      also: [NN],
    },
    // 'summer'
    Season: {
      is: Date,
      not: [Time, Timezone],
    },
    Timezone: {
      is: Date,
      aliases: [null, 'Tz'],
      also: [NN],
      not: [Prop],
    },
    Time: {
      is: Date,
      not: [AtMention, Timezone],
    },
    // 'months'
    Duration: {
      aliases: [null, 'Dur'],
      is: Date,
      also: [NN],
    },
  };

  const anything = [NN, Vb, Adj, Adv, Val, QW];

  var misc$3 = {
    Adjective: {
      aliases: ['Adj', 'JJ', 'ADJ', 'AJ0'],
      not: [NN, Vb, Adv, Val],
    },
    Comparable: {
      is: Adj,
    },
    Comparative: {
      aliases: [null, 'Comp', 'JJR', 'AJC'],
      is: Adj,
    },
    Superlative: {
      aliases: [null, 'Sup', 'JJS', 'AJS'],
      is: Adj,
      not: [Comp],
    },
    NumberRange: {
      aliases: [null, 'NumRange'],
    },
    Adverb: {
      aliases: ['Adv', 'RB', 'ADV'],
      not: [NN, Vb, Adj, Val],
    },

    Determiner: {
      aliases: ['Det', 'DT', 'DET'],
      not: [NN, Vb, Adj, Adv, QW, Conj], //allow 'a' to be a Determiner/Value
    },
    Connector: {
      not: [NN, Vb, Adj, Adv, QW, Det],
    },
    Conjunction: {
      aliases: ['Conj', 'CC'],
      is: Connector,
      not: anything.concat([Prep]),
    },
    Preposition: {
      aliases: ['Prep', 'IN', 'ADP'],
      is: Connector,
      not: [NN, Vb, Adj, Adv, QW, Det, Conj],
    },
    QuestionWord: {
      aliases: [null, 'QW'],
      not: [Det],
    },
    Currency: {
      is: NN,
    },
    Expression: {
      aliases: ['Expr'],
      not: [NN, Adj, Vb, Adv],
    },
    Abbreviation: {
      aliases: ['Abbr'],
    },
    Url: {
      aliases: [null, 'URL'],
      not: [HashTag, Vb, Adj, Val, SlashedTerm, Email, PhoneNumber, AtMention, Emoji, Emoticon],
    },
    PhoneNumber: {
      not: [HashTag, Vb, Adj, Val, AtMention, Emoji, Emoticon],
    },
    HashTag: {},
    AtMention: {
      is: NN,
      not: [HashTag, Emoji, Emoticon],
    },
    Emoji: {
      not: [HashTag, Vb, Adj, Val, Emoticon],
    },
    Emoticon: {
      not: [HashTag, Vb, Adj, Val, SlashedTerm],
    },
    SlashedTerm: {
      not: [Emoticon, Url, Val]
    },
    Email: {
      not: [HashTag, Vb, Adj, Val, PhoneNumber, AtMention, Emoji, Emoticon],
    },
    Acronym: {
      not: [RomanNumeral, Pron, Date],
    },
    Negative: {
      aliases: [null, 'Neg'],
      not: [NN, Adj, Val, Expr],
    },
    Condition: {
      is: Connector,
      aliases: [null, 'Cond'],
      not: [Vb, Adj, NN, Val],
    },
    // existential 'there'
    There: {
      aliases: [null, 'EX'],
      not: [Vb, Adj, NN, Val, Conj, Prep],
    },
    // 'co-wrote'
    Prefix: {
      not: [Abbr, Acronym, Prop],
    },
    // hard-nosed, bone-headed
    Hyphenated: {},
  };

  const allTags = { ...nouns$2, ...verbs$2, ...values$1, ...dates$1, ...misc$3 };

  // Some finders retain the caller's document; others use the selected view's.
  const select = (View, find, originalDocument = false) => function (n) {
    const matches = typeof find === 'string' ? this.match(find) : find(this);
    const selected = matches.getNth(n);
    return new View(originalDocument ? this.document : selected.document, selected.pointer)
  };

  // name the View subclass, and have .update() return it, sharing the match cache
  const keepClass = (Cls, name) => {
    Cls.prototype.viewType = name;
    Cls.prototype.update = function (pointer) {
      const m = new this.constructor(this.document, pointer);
      m._cache = this._cache;
      m.world = this.world;
      return m
    };
  };

  // the json of each match, plus a parsed form under one key
  const jsonWith = (view, n, key, fn) => {
    const opts = typeof n === 'object' ? n : {};
    return view.getNth(n).map(p => {
      const json = p.toView().json(opts)[0];
      json[key] = fn(p);
      return json
    }, [])
  };

  const find$5 = function (doc) {
    let m = doc.splitAfter('@hasComma');
    m = m.match('#Hon+? #Pers+');
    // Spencer's King - but keep 'John Smith's' together
    const poss = m.match('#Poss+').notIf('(his|her)'); //her majesty ...
    m = m.splitAfter(poss);
    return m
  };

  const parse = function (m) {
    const res = {};
    res.firstName = m.match('#First+');
    res.lastName = m.match('#Last+');
    res.honorific = m.match('#Hon+');

    const last = res.lastName;
    const first = res.firstName;
    if (!first.found || !last.found) {
      // let p = m.clone()
      // assume 'Mr Springer', or 'Vice President Springer' is a last-name
      if (!first.found && !last.found && m.has('^#Hon #Hon? .$')) {
        res.lastName = m.match('.$');
        return res
      }
    }
    return res
  };

  // gendered pronouns
  const she = '(she|her|hers)';

  /*
    Important notice - 
    this method makes many assumptions about gender-identity, in-order to assign grammatical gender.
    it should not be used for any other purposes, other than resolving pronouns in english
  */
  const m$4 = 'male';
  const f$3 = 'female';

  // known gendered honorifics
  const honorifics = {
    mr: m$4,
    mrs: f$3,
    miss: f$3,
    madam: f$3,

    // british stuff
    king: m$4,
    queen: f$3,
    duke: m$4,
    duchess: f$3,
    baron: m$4,
    baroness: f$3,
    count: m$4,
    countess: f$3,
    prince: m$4,
    princess: f$3,
    sire: m$4,
    dame: f$3,
    lady: f$3,

    ayatullah: m$4, //i think?

    congressman: m$4,
    congresswoman: f$3,
    'first lady': f$3,

    // marked as non-binary
    mx: null,
  };

  const predictGender = function (parsed, person) {
    const { firstName, honorific } = parsed;
    // use first-name as signal-signal
    if (firstName.has('#FemaleName')) {
      return f$3
    }
    if (firstName.has('#MaleName')) {
      return m$4
    }
    // use honorics as gender-signal
    if (honorific.found) {
      let hon = honorific.text('normal');
      hon = hon.replace(/\./g, ''); //clean it up a bit
      if (Object.hasOwn(honorifics, hon)) {
        return honorifics[hon]
      }
      // her excelency
      if (/^her /.test(hon)) {
        return f$3
      }
      if (/^his /.test(hon)) {
        return m$4
      }
    }
    // offer used-pronouns as a signal
    const after = person.after();
    if (!after.has('#Pers') && after.has('#Pron')) {
      const pro = after.match('#Pron');
      // manual use of gender-neutral
      if (pro.has('(they|their)')) {
        return null
      }
      const hasMasc = pro.has('(he|his)');
      const hasFem = pro.has(she);
      if (hasMasc && !hasFem) {
        return m$4
      }
      if (hasFem && !hasMasc) {
        return f$3
      }
    }
    return null
  };

  const addMethod = function (View) {
    /**
     *
     */
    class People extends View {
      parse(n) {
        return this.getNth(n).map(parse, [])
      }
      json(n) {
        return jsonWith(this, n, 'person', p => {
          // read the names from a copy, without its possessive - "Biden's" → 'biden'
          const tmp = p.clone();
          tmp.possessives().strip();
          const parsed = parse(tmp);
          return {
            firstName: parsed.firstName.text('normal'),
            lastName: parsed.lastName.text('normal'),
            honorific: parsed.honorific.text('normal'),
            presumed_gender: predictGender(parsed, p),
          }
        })
      }
      // used for co-reference resolution only
      presumedMale() {
        return this.filter(m => {
          return m.has('(#MaleName|mr|mister|sr|jr|king|pope|prince|sir)')//todo configure these in .world
        })
      }
      presumedFemale() {
        return this.filter(m => {
          return m.has('(#FemaleName|mrs|miss|queen|princess|madam)')
        })
      }
    }
    keepClass(People, 'People');

    View.prototype.people = select(People, find$5, true);
  };

  const find$4 = function (doc) {
    let m = doc.match('(#Place|#Address)+');

    // split all commas except for 'paris, france'
    let splits = m.match('@hasComma');
    splits = splits.filter(c => {
      // split 'europe, china'
      if (c.has('(asia|africa|europe|america)$')) {
        return true
      }
      // don't split 'paris, france'
      if (c.has('(#City|#Region|#Prop)$') && c.after('^(#Country|#Region)').found) {
        return false
      }
      return true
    });
    m = m.splitAfter(splits);
    return m
  };

  //combine them with .topics() method
  const find$3 = function (n) {
    // builds without the chunker have no .clauses()
    const r = this.clauses ? this.clauses() : this;
    // Find entities and acronyms without duplicating acronyms inside entities.
    let m = r.people();
    m = m.concat(r.places());
    m = m.concat(r.organizations());
    m = m.concat(r.match('#Acronym').ifNo(m));
    m = m.not('(someone|man|woman|mother|brother|sister|father)');
    //return them to normal ordering
    m = m.sort('seq');
    // m = m.unique()
    m = m.getNth(n);
    return m
  };

  const api$c = function (View) {
    View.prototype.topics = find$3;
  };

  const api$b = function (View) {
    addMethod(View);

    View.prototype.places = function (n) {
      const m = find$4(this);
      return m.getNth(n)
    };
    View.prototype.organizations = function (n) {
      const m = this.match('#Org+');
      return m.getNth(n)
    };
    api$c(View);
  };
  var topics = { api: api$b };

  // key order is the order they are redacted in
  const defaults$1 = {
    people: true,
    places: true,
    organizations: true,
    emails: true,
    money: true,
    percentages: true,
    fractions: true,
    phoneNumbers: true,
    atMentions: true,
    acronyms: true,
    urls: true,
    // off by default
    properNouns: false,
    dates: false,
    numbers: false,
    pronouns: false,
  };

  // remove these specific tags when redacting, which may leak information
  const hideTags = {
    people: [MaleName, FemaleName, First, Last],
    places: [City, 'State', Country, Region],
    organizations: [SportsTeam, 'Company', 'School'],
  };
  hideTags.pronouns = [...hideTags.people, ...hideTags.places, ...hideTags.organizations];

  // replace text with blockStr but keep tags
  const redactMatch = function (m, blockStr, keep = true) {
    m = m.notIf('#Redacted');
    m.replaceWith(blockStr, keep);
    m.tag('Redacted');
    return m
  };

  const redact = function (opts = {}, blockStr = '██████████', keep = true) {
    opts = { ...defaults$1, ...opts };
    // each key is also the View method that finds them
    Object.keys(defaults$1).forEach(k => {
      // skip finders that this build or language does not have
      if (opts[k] !== false && this[k]) {
        const m = redactMatch(this[k](), blockStr, keep);
        if (hideTags[k]) {
          m.unTag(hideTags[k]);
        }
      }
    });
    return this
  };

  const plugin = {
    model: {
      one: {
        tagSet: {
          Redacted: true
        }
      }
    },
    api: function (View) {
      View.prototype.redact = redact;
    }
  };

  // remove a regex match from the text of each term
  const stripper = reg => view => {
    eachTerm(view.docs, term => {
      term.text = term.text.replace(reg, '');
      term.normal = term.normal.replace(reg, '');
    });
    return view
  };

  const strip$3 = stripper(/\./g);

  const api$a = function (View) {

    class Acronyms extends View {
      strip() {
        return strip$3(this)
      }
      addPeriods() {
        strip$3(this);
        eachTerm(this.docs, term => {
          // Reuse the sentence period so strip() still preserves punctuation.
          const ending = term.post.startsWith('.') ? '' : '.';
          term.text = term.text.split('').join('.') + ending;
          term.normal = term.normal.split('').join('.') + ending;
        });
        return this
      }
    }
    Acronyms.prototype.viewType = 'Acronyms';

    View.prototype.acronyms = select(Acronyms, '#Acronym');
  };

  // select spans wrapped by paired punctuation held in term.pre / term.post
  const findPairs = (hasOpen, findEnd) => doc => {
    const ptrs = [];
    doc.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        const term = terms[i];
        if (term.pre && hasOpen.test(term.pre)) {
          const end = findEnd(terms, i);
          if (end !== null) {
            const [n, start] = terms[i].index;
            // i and end are relative to this view, but start is not
            ptrs.push([n, start, start + end - i + 1, terms[i].id]);
            i = end;
          }
        }
      }
    });
    return doc.update(ptrs)
  };

  // remove the opening and closing punctuation from each span
  const stripPairs = (hasOpen, hasClosed) => m => {
    m.docs.forEach(terms => {
      terms[0].pre = terms[0].pre.replace(hasOpen, '');
      const last = terms[terms.length - 1];
      last.post = last.post.replace(hasClosed, '');
    });
    return m
  };

  const hasOpen$1 = /\(/;
  const hasClosed$1 = /\)/;

  const findEnd$1 = function (terms, i) {
    for (; i < terms.length; i += 1) {
      if (terms[i].post && hasClosed$1.test(terms[i].post)) {
        return i
      }
    }
    return null
  };

  const find$2 = findPairs(hasOpen$1, findEnd$1);
  const strip$2 = stripPairs(hasOpen$1, hasClosed$1);

  const api$9 = function (View) {
    class Parentheses extends View {
      strip() {
        return strip$2(this)
      }
    }
    Parentheses.prototype.viewType = 'Parentheses';

    View.prototype.parentheses = select(Parentheses, find$2);
  };

  const stripS = stripper(/['’]s$/);
  const leadApostrophe = /^['’]/;

  // spencer's, spencer’s - and the flanders', whose apostrophe is in .post
  const strip$1 = function (view) {
    stripS(view);
    eachTerm(view.docs, t => {
      if (t.text.endsWith('s') && leadApostrophe.test(t.post)) {
        t.post = t.post.replace(leadApostrophe, '');
      }
    });
    return view
  };

  // #Possessive is decided upstream, in steps - the list is in 2-two/contraction-two/compute/index.js
  const find$1 = function (doc) {
    let m = doc.match('#Poss+');
    // expand it to include 'john smith's'
    if (m.has('#Pers')) {
      m = m.growLeft('#Pers+');
    }
    if (m.has('#Place')) {
      m = m.growLeft('#Place+');
    }
    if (m.has('#Org')) {
      m = m.growLeft('#Org+');
    }
    return m
  };


  const api$8 = function (View) {

    class Possessives extends View {
      strip() {
        return strip$1(this)
      }
    }
    Possessives.prototype.viewType = 'Possessives';

    View.prototype.possessives = select(Possessives, find$1);
  };

  /* eslint-disable regexp/no-dupe-characters-character-class */

  const pairs$1 = {
    '\u0022': '\u0022', // 'StraightDoubleQuotes'
    '\uFF02': '\uFF02', // 'StraightDoubleQuotesWide'
    '\u0027': '\u0027', // 'StraightSingleQuotes'
    '\u201C': '\u201D', // 'CommaDoubleQuotes'
    '\u2018': '\u2019', // 'CommaSingleQuotes'
    '\u201F': '\u201D', // 'CurlyDoubleQuotesReversed'
    '\u201B': '\u2019', // 'CurlySingleQuotesReversed'
    '\u201E': '\u201D', // 'LowCurlyDoubleQuotes'
    '\u2E42': '\u201D', // 'LowCurlyDoubleQuotesReversed'
    '\u201A': '\u2019', // 'LowCurlySingleQuotes'
    '\u00AB': '\u00BB', // 'AngleDoubleQuotes' «, »
    '\u2039': '\u203A', // 'AngleSingleQuotes'
    // Prime 'non quotation'
    '\u2035': '\u2032', // 'PrimeSingleQuotes'
    '\u2036': '\u2033', // 'PrimeDoubleQuotes'
    '\u2037': '\u2034', // 'PrimeTripleQuotes'
    // Prime 'quotation' variation
    '\u301D': '\u301E', // 'PrimeDoubleQuotes'
    '\u0060': '\u00B4', // 'PrimeSingleQuotes'
    '\u301F': '\u301E', // 'LowPrimeDoubleQuotesReversed'
  };

  const hasOpen = RegExp('[' + Object.keys(pairs$1).join('') + ']');
  const hasClosed = RegExp('[' + Object.values(pairs$1).join('') + ']');

  const findEnd = function (terms, i) {
    const have = terms[i].pre.match(hasOpen)[0] || '';
    if (!have || !pairs$1[have]) {
      return null
    }
    const want = pairs$1[have];
    for (; i < terms.length; i += 1) {
      if (terms[i].post && terms[i].post.match(want)) {
        return i
      }
    }
    return null
  };

  const find = findPairs(hasOpen, findEnd);
  const strip = stripPairs(hasOpen, hasClosed);

  const api$7 = function (View) {

    class Quotations extends View {
      text(fmt) {
        if (!fmt || fmt === 'text') {
          return super.text({ keepEndPunct: true })
        }
        if (typeof fmt === 'object') {
          return super.text({ keepEndPunct: true, ...fmt })
        }
        return super.text(fmt)
      }
      strip() {
        strip(this);
      }
    }
    Quotations.prototype.viewType = 'Quotations';

    View.prototype.quotations = select(Quotations, find);
  };

  /** return anything tagged as a phone number */
  const phoneNumbers = function (n) {
    let m = this.splitAfter('@hasComma');
    m = m.match('#PhoneNumber+');
    m = m.getNth(n);
    return m
  };

  /** return anything tagged as an address */
  const addresses = function (n) {
    let m = this.match('#Address+');
    m = m.getNth(n);
    return m
  };

  // setup easy helper methods
  const selections = [
    ['hyphenated', '@hasHyphen .'],
    ['hashTags', '#HashTag'],
    ['emails', '#Email'],
    ['emoji', '#Emoji'],
    ['emoticons', '#Emoticon'],
    ['atMentions', '#AtMention'],
    ['urls', '#Url'],
    // ['pronouns', '#Pronoun'],
    ['conjunctions', '#Conj'],
    ['prepositions', '#Prep'],
    ['abbreviations', '#Abbr'],
    ['honorifics', '#Hon'],
  ];

  // aliases
  const aliases = [
    ['emojis', 'emoji'],
    ['atmentions', 'atMentions'],
  ];

  const addMethods = function (View) {
    // add a list of new helper methods
    selections.forEach(a => {
      View.prototype[a[0]] = function (n) {
        const m = this.match(a[1]);
        return typeof n === 'number' ? m.get(n) : m
      };
    });
    View.prototype.phoneNumbers = phoneNumbers;
    View.prototype.addresses = addresses;
    // add aliases
    aliases.forEach(a => {
      View.prototype[a[0]] = View.prototype[a[1]];
    });
  };

  const hasSlash = /\//;

  const api$6 = function (View) {

    class Slashes extends View {
      split() {
        return this.map((m) => {
          const str = m.text();
          const arr = str.split(hasSlash);
          m = m.replaceWith(arr.join(' '));
          return m.growRight('(' + arr.join('|') + ')+')
        })
      }
    }
    Slashes.prototype.viewType = 'Slashes';

    View.prototype.slashes = select(Slashes, '#SlashedTerm');
  };

  var misc$2 = {
    api: function (View) {
      api$a(View);
      api$9(View);
      api$8(View);
      api$7(View);
      addMethods(View);
      api$6(View);
    }
  };

  // a comma, but not a clause break
  const notClause = [
    '@hasComma @hasComma', //fun, cool...
    '(#City && @hasComma) #Country', //'toronto, canada'
    '(#WeekDay && @hasComma) #Date', //'tuesday, march 2nd'
    '(#Date+ && @hasComma) #Val', //'july 6, 1992'
    '(#Adj && @hasComma) #Adj', //nice, pretty
  ];

  const byComma = function (doc, rules) {
    const skip = notClause.concat(rules.notClause || []);
    let commas = doc.match('@hasComma');
    // remove any non-clause uses
    commas = commas.filter(m => {
      // don't split the first word
      if (m.growLeft('.').wordCount() === 1) {
        return false
      }
      // don't split the last word
      if (m.growRight('. .').wordCount() === 1) {
        return false
      }
      const more = m.grow('.'); // grow by 1 word in either direction
      return !skip.some(str => more.has(str))
    });
    return doc.splitAfter(commas)
  };

  // should we split-out a clause (in brackets)?
  const splitParentheses = function (doc) {
    // from the misc plugin
    if (!doc.parentheses) {
      return doc
    }
    let matches = doc.parentheses();
    matches = matches.filter(m => {
      return m.wordCount() >= 3 && m.has('#Verb') && m.has('#NN')
    });
    return doc.splitOn(matches)
  };

  // split-out a long quotion, but not 'inline quotes'.
  const splitQuotes = function (doc) {
    // from the misc plugin
    if (!doc.quotations) {
      return doc
    }
    let matches = doc.quotations();
    matches = matches.filter(m => {
      return m.wordCount() >= 3 && m.has('#Verb') && m.has('#NN')
    });
    return doc.splitOn(matches)
  };

  const clauses$2 = function (n) {
    let found = this;
    // word-rules, like 'but' and 'until', are in the model
    const rules = this.model.three?.clauses || {};

    found = splitParentheses(found);
    found = splitQuotes(found);

    found = byComma(found, rules);

    found = found.splitAfter('(@hasEllipses|@hasSemicolon|@hasDash|@hasColon)');

    // each language's own rules
    const { splitAfter = [], splitBefore = [], splitBeforeGroup = [] } = rules;
    splitAfter.forEach(str => {
      found = found.splitAfter(str);
    });
    splitBefore.forEach(str => {
      found = found.splitBefore(str);
    });
    splitBeforeGroup.forEach(str => {
      const m = found.match(str, 0);
      if (m.found) {
        found = found.splitBefore(m);
      }
    });

    // // misc clause partitions
    // found = found.splitBefore('as well as .')
    // found = found.splitBefore('such as .')
    // found = found.splitBefore('in addition to .')

    // // semicolons, dashes
    // found = found.splitAfter('@hasSemicolon')
    // found = found.splitAfter('@hasDash')

    // //
    // found = found.splitBefore('which (were|are|will)')

    // // he said [...]
    // found = found.splitAfter('#Noun (said|say|says)')

    // passive voice verb - '.. which was robbed is empty'
    // let passive = found.match('#Noun (which|that) (was|is) #Adverb? #PastTense #Adverb?')
    // if (passive.found) {
    //   found = found.splitAfter(passive)
    // }
    // //which the boy robbed
    // passive = found.match('#Noun (which|that) the? #Noun+ #Adverb? #PastTense #Adverb?')
    // if (passive.found) {
    //   found = found.splitAfter(passive)
    // }
    // does there appear to have relative/subordinate clause still?
    // let tooLong = found.filter(d => d.wordCount() > 5 && d.match('#Verb+').length >= 2)
    // if (tooLong.found) {
    //   // and after the ..
    //   found = found.splitBefore('#Conjunction #Preposition')

    //   // let m = tooLong.splitAfter('#Noun .* #Verb .* #Noun+')
    //   // found = found.splitOn(m.eq(0))
    // }
    if (typeof n === 'number') {
      found = found.get(n);
    }
    return found
  };

  const api$5 = function (View) {
    View.prototype.clauses = clauses$2;
  };

  // .clauses() with only its punctuation rules - a language adds its own model.three.clauses
  var clauses$1 = { api: api$5 };

  // a leading '-', or the real minus-sign, or one after a symbol - '$-5'
  const minus = /^\s*[-−]|\P{L}[-−]$/u;
  const signs = /[-−]/g;
  // any currency symbol - '$', '€', '₽'
  const currency = /\p{Sc}/u;

  // a decimal-comma, unless the language's model says otherwise.
  // `ordinal` is regex-source for the ending of a numeric ordinal - '[ºª°]'
  // `loose` reads a lone decimal-mark before three digits as thousands - '7,938'
  // `percent` and `currencies` are the words that follow a number - 'per cento', 'euro'
  const defaults = { decimal: ',', group: '.', ordinal: '', loose: false, percent: [], currencies: [] };

  // the mark that groups thousands can't also be the decimal
  const groupMark = function (group, decimal) {
    if (group !== decimal) {
      return group
    }
    return decimal === '.' ? ',' : '.'
  };

  // '1234567' → '1.234.567'
  const addGroups = function (int, mark) {
    const out = [];
    for (let end = int.length; end > 0; end -= 3) {
      out.unshift(int.slice(Math.max(end - 3, 0), end));
    }
    return out.join(mark)
  };

  // floating-point noise - 0.1 + 0.2. a whole number is already exact,
  // and rounding it to 15 digits would corrupt a 16-digit one
  const tidy$1 = num => (Number.isInteger(num) ? num : Number(num.toPrecision(15)));

  // compile each ordinal-ending once
  const cache$2 = {};
  const isOrdinal = function (suffix, src) {
    if (!src || !suffix) {
      return false
    }
    cache$2[src] = cache$2[src] || new RegExp('^(?:' + src + ')$', 'iu');
    return cache$2[src].test(suffix)
  };

  // digits, and any mark that sits between two of them - '1.234,56', '1 000', "1'000"
  const body = /^[0-9](?:[0-9]|[.,'’\s](?=[0-9]))*/;
  const count = (str, char) => str.split(char).length - 1;

  // which mark is the decimal, and which one groups the thousands?
  // two different marks, or a repeated one, say so themselves - '1.234,56', '1.234.567'
  // a lone '.' or ',' is the only real guess, and the locale makes it
  const findMarks = function (str, locale) {
    const dots = count(str, '.');
    const commas = count(str, ',');
    // a space or an apostrophe is only ever a thousands-group
    const soft = str.match(/[ ']/);
    let decimal = null;
    let group = soft ? soft[0] : null;
    if (dots && commas) {
      // the last one is the decimal
      decimal = str.lastIndexOf(',') > str.lastIndexOf('.') ? ',' : '.';
      group = decimal === ',' ? '.' : ',';
      if (soft) {
        return null
      }
    } else if (dots + commas > 1) {
      group = dots ? '.' : ',';
      if (soft) {
        return null
      }
    } else if (dots + commas === 1) {
      const mark = dots ? '.' : ',';
      const isGroup = /^[1-9][0-9]{0,2}[.,][0-9]{3}$/.test(str);
      const isDecimal = mark === locale.decimal && !(locale.loose && isGroup);
      if (soft || isDecimal || !isGroup) {
        decimal = mark; // '3,5', and '3.5' anywhere
      } else {
        group = mark; // '1.000' where the decimal is a comma
      }
    }
    return { decimal, group }
  };

  // '1.234,56' → 1234.56, or null for something that isn't one number - '1.2.3'
  const toNumber$1 = function (str, marks) {
    let int = str;
    let fraction = '';
    if (marks.decimal) {
      const parts = str.split(marks.decimal);
      if (parts.length !== 2) {
        return null
      }
      int = parts[0];
      fraction = parts[1];
    }
    // thousands come in threes
    if (marks.group) {
      const groups = int.split(marks.group);
      if (groups[0].length > 3 || groups.slice(1).some(s => s.length !== 3)) {
        return null
      }
      int = groups.join('');
    }
    if (!/^[0-9]+$/.test(int) || !/^[0-9]*$/.test(fraction)) {
      return null
    }
    return Number(fraction ? int + '.' + fraction : int)
  };

  /**
   * pull-apart a number written in digits - '-5', '1.234,56 €', '3,5%', '2ª'
   * `pre` is any punctuation that the tokenizer left in front of it - '(-'
   * `locale` is model.two.europeanNumbers
   */
  const read = function (str, pre = '', locale = defaults) {
    const res = {
      num: null,
      prefix: '',
      suffix: '',
      hasComma: false,
      decimal: null,
      group: null,
      ordinal: null,
      currency: null,
      isPercent: false,
      isFraction: false,
    };
    str = String(str).trim();
    const begin = str.search(/[0-9]/);
    if (begin === -1) {
      return res
    }
    let prefix = str.slice(0, begin);
    const raw = str.slice(begin).match(body)[0];
    let suffix = str.slice(begin + raw.length);
    // every kind of space, and both kinds of apostrophe
    let digits = raw.replace(/\s/g, ' ').replace(/’/g, "'");
    // a decimal with nothing in front of it - '.5', ',5'
    const lead = prefix.slice(-1);
    if ((lead === '.' || lead === ',') && /^[0-9]+$/.test(digits)) {
      digits = '0' + lead + digits;
      prefix = prefix.slice(0, -1);
    }
    const marks = findMarks(digits, locale);
    let num = marks ? toNumber$1(digits, marks) : null;
    if (num === null) {
      return res
    }
    // a fraction - '1/2'
    const frac = suffix.match(/^\/([0-9]+)$/);
    if (frac && Number(frac[1]) !== 0) {
      num /= Number(frac[1]);
      suffix = '';
      res.isFraction = true;
    }
    // the sign may be hiding in the punctuation - '(-5)'
    // .. on either side of the currency - '-$5', '$-5' - but not 'covid-19'
    if (minus.test(prefix) || /[-−]$/.test(pre)) {
      num *= -1;
    }
    // a numeric ordinal - '2ª', '5-го', '3e'
    if (isOrdinal(suffix, locale.ordinal)) {
      res.ordinal = suffix;
      suffix = '';
    }
    res.num = num;
    res.prefix = prefix.replace(signs, '');
    res.suffix = suffix;
    res.decimal = marks.decimal;
    res.group = marks.group;
    res.hasComma = marks.group !== null;
    // remember which space it was - a non-breaking one is put back as one
    if (marks.group === ' ') {
      res.group = raw.match(/\s/)[0];
    }
    const money = [res.prefix, suffix].find(s => currency.test(s));
    res.currency = money ? money.trim() : null;
    res.isPercent = /^\s*[%％]/.test(suffix);
    return res
  };

  /**
   * write a number in digits - 1234.5 → '1.234,5'
   * `how` is the result of read(), so a number goes back the way it was found.
   * thousands are only grouped when `how.hasComma` is set
   */
  const write$1 = function (num, how = {}, locale = defaults) {
    if (typeof num !== 'number' || !isFinite(num)) {
      return ''
    }
    num = tidy$1(num);
    let str = String(Math.abs(num));
    // leave '1e+21' alone
    if (/^[0-9]+(?:\.[0-9]+)?$/.test(str)) {
      let decimal = how.decimal || locale.decimal;
      // '7,938' was grouped with a comma, so its decimal is a period
      if (!how.decimal && how.group === decimal) {
        decimal = groupMark(decimal, decimal);
      }
      const parts = str.split('.');
      let int = parts[0];
      const fraction = parts[1];
      if (how.hasComma) {
        int = addGroups(int, groupMark(how.group || locale.group, decimal));
      }
      str = fraction ? int + decimal + fraction : int;
    }
    // the sign goes ahead of any currency - '-$5'
    const sign = num < 0 ? '-' : '';
    return sign + (how.prefix || '') + str + (how.suffix || '')
  };

  const sign = '[-+−]?';
  // '1.234.567,89', or '1234,5' - either mark, the reader sorts-out which is which
  const digits = "(?:[0-9]{1,3}(?:[.,'’][0-9]{3})+(?:[.,][0-9]+)?|[0-9]+(?:[.,][0-9]+)?)";
  // 'R$', 'US$', '€'
  const symbol$1 = '(?:[a-z]{1,2})?\\p{Sc}';

  const cardinal = ['Cardinal', 'NumericValue'];
  const percent$1 = ['Percent', 'Cardinal', 'NumericValue'];
  const money = ['Money', 'Value'];

  // build them once per language
  const cache$1 = new WeakMap();

  /**
   * tagging rules for numbers written in digits, as [regex, tags, example].
   * test them on the term's text, not its 'normal' - which has lost its commas
   */
  const regexes = function (locale = defaults) {
    if (cache$1.has(locale)) {
      return cache$1.get(locale)
    }
    const reg = str => new RegExp('^' + str + '$', 'iu');
    const out = [
      [reg(sign + symbol$1 + ' ?' + sign + digits + '(?:[kmb]|bn)?\\+?'), money, '€5,30'],
      [reg(sign + digits + ' ?' + symbol$1 + '\\+?'), money, '5,30€'],
      [reg(sign + digits + '\\+?'), cardinal, '1.234,56'],
      [reg(sign + '[.,][0-9]+\\+?'), cardinal, ',5'],
      [reg(sign + digits + ' ?[%％]\\+?'), percent$1, '3,5%'],
      [reg(sign + '[.,][0-9]+[%％]'), percent$1, ',5%'],
    ];
    // '2ª', '5-го', '3e'
    if (locale.ordinal) {
      out.push([reg('[0-9]+(?:' + locale.ordinal + ')'), ['Ordinal', 'NumericValue'], 'ordinal']);
    }
    cache$1.set(locale, out);
    return out
  };

  const reason$1 = 'european-number';
  // '€', '₽', 'R$', 'US$'
  const symbol = /^[a-z]{0,2}\p{Sc}$/iu;
  // only in capitals - 'EUR 5', not 'eur'
  const codes = /^(?:EUR|USD|GBP|CHF|JPY|CAD|AUD|BRL|MXN|RUB|CNY)$/;
  const percent = /^[%％]$/;

  const isValue$1 = term => term.tags.has('Value');
  // nothing but a space between this word and the next - not '5, euro'
  const touches = term => /^\s*$/.test(term.post);

  // do these words come next? - 'per cento'
  const hasPhrase = function (terms, i, words) {
    return words.every((w, o) => terms[i + o] && terms[i + o].normal === w && (o === words.length - 1 || touches(terms[i + o])))
  };

  /**
   * a number takes its meaning from the word beside it - '5,30 €', '50 per cento', 'mille euro'.
   * the number is tagged #Money or #Percent, and the word beside it #Currency or #Unit.
   * the words come from the model - { percent: ['per cento'], currencies: ['euro'] }
   */
  const tagNeighbours = function (terms, view) {
    const { world, model, methods } = view;
    const { setTag, unTag } = methods.one;
    const locale = model.two.europeanNumbers;
    const phrases = (locale.percent || []).map(str => str.split(' '));
    const words = new Set(locale.currencies || []);
    const isCurrency = term => term.tags.has('Currency') || symbol.test(term.text) || words.has(term.normal);
    const isCode = term => symbol.test(term.text) || codes.test(term.text);

    for (let i = 0; i < terms.length; i += 1) {
      if (!isValue$1(terms[i]) || terms[i].tags.has('Ordinal')) {
        continue
      }
      // the whole number - '1 000', 'trois cent'
      let end = i;
      while (terms[end + 1] && isValue$1(terms[end + 1]) && touches(terms[end])) {
        end += 1;
      }
      const run = terms.slice(i, end + 1);
      const next = touches(terms[end]) ? terms[end + 1] : null;
      const before = terms[i - 1];
      const phrase = next ? phrases.find(a => hasPhrase(terms, end + 1, a)) : null;
      if (phrase) {
        // 'cento' is not a second number
        const unit = terms.slice(end + 1, end + 1 + phrase.length);
        unTag(unit, 'Value', model.one.tagSet);
        setTag(unit, 'Unit', world, false, reason$1);
        setTag(run, 'Percent', world, false, reason$1);
        end += phrase.length;
      } else if (next && percent.test(next.text)) {
        setTag(run, 'Percent', world, false, reason$1);
        setTag([next], 'Unit', world, false, reason$1);
      } else if (next && (isCurrency(next) || codes.test(next.text))) {
        setTag(run, 'Money', world, false, reason$1);
        setTag([next], 'Currency', world, false, reason$1);
      } else if (before && isCode(before) && touches(before)) {
        // only a symbol goes in front - '€ 5,30', 'CHF 12'
        setTag(run, 'Money', world, false, reason$1);
        setTag([before], 'Currency', world, false, reason$1);
      }
      i = end;
    }
  };

  const reason = 'european-number';
  // leave these to the language's own tagger - '12.05.2020', '15.30', '555-1234'
  // .. and a german ordinal keeps its period outside of the term - '3.'
  const skip$1 = ['Date', 'PhoneNumber', 'NumberRange', 'Ordinal'];

  // tag numbers written in digits, from their raw text - '1.234,56', '3,5%', '5,30€'
  const tagNumbers = function (view) {
    const { world, model, methods } = view;
    const regs = regexes(model.two.europeanNumbers);
    const setTag = methods.one.setTag;
    view.docs.forEach(terms => {
      terms.forEach(term => {
        if (!/[0-9]/.test(term.text) || skip$1.some(tag => term.tags.has(tag))) {
          return
        }
        const found = regs.find(a => a[0].test(term.text));
        if (found) {
          setTag([term], found[1], world, false, reason);
        }
      });
      // '5,30 €', '50 per cento'
      tagNeighbours(terms, view);
    });
  };

  /**
   * numbers written in digits, with a decimal-comma - '1.234,56', '3,5%', '5,30 €'
   * shared across many languages
   * tags them, and adds a reader and writer:
   *   const { read, write } = doc.methods.two.europeanNumbers
   *   const locale = doc.model.two.europeanNumbers
   *   read('1.234,56', term.pre, locale).num // 1234.56
   *   write(1234.56, { hasComma: true }, locale) // '1.234,56'
   * a language sets its own marks in model.two.europeanNumbers - { group: ' ', ordinal: 'er?' }
   * and its own words - { percent: ['per cento'], currencies: ['euro'] } - for '50 per cento', 'mille euro'
   */
  var europeanNumbers = {
    model: { two: { europeanNumbers: { ...defaults, percent: [], currencies: [] } } },
    methods: { two: { europeanNumbers: { read, write: write$1, regexes } } },
    compute: { europeanNumbers: tagNumbers },
    hooks: ['europeanNumbers'],
  };

  // Generated by scripts/pack/index.js; see data/README.md for source files.
  var properNouns = {
    "ProperNoun": "true¦aIbDc8dalhousHe7f5gosford,h4kirby,landsdowne,m2nis,r1s0wembF;herwood,paldiB;iel,othwe1;cgi0ercedes,issy;ll;intBudsB;airview,lorence,ra0;mpt9nco;lmo,uro;a1h0;arlt6es5risti;rl0talina;et4i0;ng;arb3e0;et1nt0rke0;ley;on;ie;bid,jax",
    "Organization": "true¦0:4Q;1:3Z;a3Vb3Dc2Md2Fe2Af25g1Yh1Ri1Nj1Lk1Jl1Gm13n0Ro0Op0Equ0Dr04sStIuDvAw4xiaomi,y2;amaha,mca,ou2wca;gov,tube;a5e3iki2orld trade organization;leaRpedia;lls fargo,st2;field,inghouse;l2rner bros;greens,l street journal,m1C;an halPerizon,isa,o2;dafone,l2;kswagNvo;b5kip,n3ps,s2;a today,ps;esco,i2;lever,ted nations;er,s; mobile,aco beTd bQe8gi fridays,he 4im hortons,mz,o2witter;shiba,y2;ota,s r us;b3carpen3Mdaily ma1holli0s2who;mashing pumpkins,uprem0;ea2lack eyed peas,yrds;ch boys,tl0;l3n3Us2xas instruments;co,la m1F;efonica,us;aCcBe8iemens,mirnoff,np,o6p5quare0Dt2ubaru;a2eer02;rbuc2to1;ks;eci2Cice gir5;ny,undgard2;en;a3x pisto2;ls;g1Wrs;hool1Sientology;feway,insburys,lesforce,msung;adiohead,b9e5o2yanair;man empire,yal 2;b2dutch she5;ank;a4d 2max,vlon;bu2c2Bhot chili peppers,lobster;ll;ders digest,l madrid;c,s;antas,iznos;a9bs,e6fizer,hilip5i4r2;emier 2udential;leagTo1;nk floyd,zza hut; morrCs;psi3tro2ugeot;bras,china,nas;!co;lantir,n2ypal; 3asonic,da2Q;ld navy,pec,range juli3xf2;am;us;aAb9e8fl,h7i6o2sa,vid5wa;k4minat3tre dame,vart2;is;ing1F;ia;ke,ntendo,ssan,vV;l,s;c,stle,tflix,wsweek;a,c;ndos,s3t2;o,west;a,car,daq;aDeAi7lb,o4tv,y2;spa2;ce;b1nsanto,ody blu0t2;ley cr2or0T;ue;c3t2;as,subisM;helin,rosoft;dica3rcedes benz,talli2;ca;id,re;cs milk,ttel,zda;a presse,e2g,ittle caesars; oreal,novo,x2;is,mark,us;atv,fc,kk,lm,m2odak;art;iffy lube,oy division,pmorgan2sa;! chase;bm,hop,k4n2tv;g,te2;l,rpol;ea;a7e6i4o2sbc,yundai;me dep2nda;ot;tac2zbollah;hi;althYwlett pack1V;lliburton,sbro;eneral 6hq,ithub,l5mb,o2reen day,ucci;ldman sachs,o2;dye2gle;ar;axo smith kline,encoZ;electric,m2;otors;a5bi,c barcelo4da,edex,i3leetwood mac,o2rito lay;rd,xcon;at,fa,restone;na;cebook,nnie mae;bay,sa,u5x2;ecutiveYxon2; m2m2;ob1;!rosceptics;aimler,e6isney,o5u2;nkin donu3pont,ran dur2;an;ts;j,w jon0;a,f lepp17ll,peche mode,r spiegel,stiny's chi2;ld;aObc,entrMhIiGloudflaFnn,o4r2;aigsli8eedence clearwater reviv2ossra1;al;cAinba9l7m3n2ors,stco;ferenceJgressionI;ca4merce3p2;aq; bo0Y;st;dplVg2;ate;se;a c2o chanT;ola;re;a,sco2tigroup;! systems;ev3i2;ck fil a,na daily;r2y;on;al2; committee;d3pital o2rls jr;ne;bury,ill2;ac;aFbc,eCfAl6mw,ni,o2p,rexiteeV;ei4mbardiJston 2;glo2pizza;be;ng;o3ue c2;roW;ckbuster video,omingda2;le; g2g2;oodriM;cht3e ge0rkshire hathaw2;ay;el;cardi,idu,nana republ4s2xt6y6;f,kin robbi2;ns;ic;bYcUdidTerosmith,iSlLmFnheuser busEol,ppleBr7s5u4v3y2;er;is,on;di,todesk;hland o1sociated F;il;b4g3m2;co;os;ys; compu2be0;te2;rs;ch;c,d,erican4t2;!r2;ak; ex2;pre2;ss; 6catel3ta2;ir;! lu2;ce2;nt;jazeera,qae2;da;g,rbnb;as;/dc,ademy of scienc0er,tivision2;! blizz2;ard;es;ba",
    "City": "true¦0:75;1:62;2:6H;3:6K;4:5T;5:5M;a6Ab55c4Kd4Ae46f3Yg3Jh3Bi33j2Yk2Gl24m1Nn1Do1Ap0Xq0Vr0Ps06tSuRvMwExiCyAz6;a8h6ibo,urich;a6e6ongsh0;ng3J;greb,nzibar;ang2e6okohama,unfu;katerin3Jrev0;a6n0R;m5n;arsCeBi7roclCu6;h0xi,zhou;c8n6;d6nipeg,terth4;hoek,sor;hita,klow;l65xford;aw;a9e7i6ladivostok,olgograd;en3lnius;nice,r6;o3sailles;lencia,ncouver,r3ughn;lan bator,rumqi,trecht;aGbilisi,eFheEiCoAr8u6;lsa,nis,r6;in,ku;i6ondh64;este,poli;kyo,msk,ronto,ulo6;n,uT;an6jua3l2Vmisoara,ra3;jin,shui; hague,ssaloniki;gucigalpa,hr0l aviv;briz,i7llinn,mpere,ng6rtu,shk2T;ier,sh0;an,chu1n0pei,yu0;aFeEh9kopje,oweto,t8u6;ra6zhou;baya,t;aten is57ockholm,rasbourg,uttgart;an9e7i6;jiazhua1llo1mla,y0;f52n6;ya1zh5;ghai,tou;attle,oul,v46;cramento,int DlCn6o paulo,pporo,rajevo; 8aa,t6;a 6o domingo;a3fe,m1O;antonio,diego,francisco,j6pedro,salvador;o6u0;se;em,t lake city,z27;louis,peters26;aAe9i7o6;me,stov,t5B;ga,o6yadh;! de janeiro;cife,ims,nnes,ykjavik;bat,ip4leigh,nchi,walpindi;ingdao,u6;ez2ito;aGeFhEiDoAr8u7yong6;ya1;ebla,ya1;a6etoria;gue,to;rt6zn0; 6land,o;au prince,elizabeth,said;ls5raeus,tts28;iladelphia,nom penh,oenix;ki1tah tikva;dua,lerZnaji,ris,t6;na,ras;ak46dessa,msk,r7s6ttawa;aka,lo;an,dos;a8ew6ingbo,ovosibirsk,yc; 6castle;delhi,orleans,taipei;g9irobi,n6ples,shv35tchez,v0;ch7ji1t6;es,o1;a1o1;a7o6p4;ya;no,saki;aFeDiAo7u6;mbai,nich,scat;gadishu,nt7s6;cow,ul;evideo,pellier,real;ami,l7nsk,s6;kolc,sissauga;an,waukee;cca,d6lbourne,mphis,ndoza,ssi3;an,ellin,i3;cau,drBkassar,lAn9r6shhad;aca7ib6rakesh,se2N;or;ibo,y;aus,chGdalay,ila;mo;id;aEeBi9o7u6vUy2;anNcknow,dhia3;n6s angeles;d2g beach;brev2Dege,ma6nz,sb2verpool;!ssol; mans,i6;c6pzig;ester; p7g6hore,n0Es vegas,usanne;os;az,lata;aJharHiDlaipeCoArakow,u8y6;iv,o6;to;ala lump4n6;mi1sh0;hima,lkata,pavog4si6wlo2;ce;da;ev,n7r6;kuk,ov;gst2sha6;sa;k6toum;iv;bIdu3llakurichi,mpala,n7ohsiu1ra6unas,waguchi;chi,j;d6o,p4;ahar,y;a8e7i6ohannesW;lin,n0;ddah,rusalem;ip4k6;arta;bad0mphal,nBrkutVs8taYz6;mir,tapala6;pa;fah0l7tanb6;ul;am30i2I;che2d6;ianap2Nore;aBe8o6yder2X; chi mi6ms,nolulu;nh;f7lsin6rakli2;ki;ei;ifa,lifax,mDn6rbin,va3;g9nover,oi;aGdanFenEhDiQlasgCoAraz,u6;a6jrat;dal7ng6yaquil;zhou;ajara,upe;ld coast,then6;burg;ow;ent;eva,oa;sk;lw8n6za;dhi6gtok;nagar;ay;aisal2Aes,o9r7ukuya6;ma;ankfu6esno;rt;rt6sh0; wor7ale6;za;th;d6indhov5l paso,ss5;in6mont2;bur6;gh;aCe9haka,isp4o8resd5u6;b6esseldorf,nkirk,rb0shanbe;ai,lin;ha,nggu0rtmund;hradTl7nv6troit;er;hi;donghJe7kar,l6mascus,r es salaam,ugavpiZ;i0lV;gu,je2;aKebu,hBleve0Wo6raiova,uritiba;lo8n7penhag5r6;doba,k;akLst0W;gVm6;bo;aCen9i7ongqi1ristchur6;ch;ang m8ca6ttago1;go;g7n6;ai;du,zho1;ng6ttogram;ch9sha,zhou;gliari,iAlga9mayenKn7pe town,r6tanP;acDdiff;berra,c6;un;ry;ro;aXeOhLirmingham,oKrAu6;chareUdapeUenos air8r6s0tu0;g6sa;as;es;aAis7usse6;ls;ba7t6;ol;ne;sil9tisla8zzav6;il6;le;va;ia;gota,st2;op7ubaneshw6;ar;al;iDlAng9r6;g5l6n;in;en;aluru,hazi;fa7grade,o horizon6;te;st;ji1rut;ghdad,kGnAot9r8s7yan n4;ur;el,rah;celo3i,ranquilla;ou;du1g7ja lu6;ka;alo7k6;ok;re;ng;ers6u;field;a06b03ccra,ddis ababa,gartala,hmedYizawl,lTmQnIqaba,rFsCt8uck6;la6;nd;he8l6;an6;ta;ns;h6unci2;dod,gab6;at;li6;ngt2;on;a9c6kaPtwerp;hora7o3;na;ge;h8p6;ol6;is;eim;aravati,m0s6;terd6;am; 8buquerq7eppo,giers,ma6;ty;ue;basrah al qadim6mawsil al jadid6;ah;ab6;ad;la;ba;ra;idj0u dha6;bi;an;lbo7rh6;us;rg",
    "Place": "true¦0:4Y;1:50;2:4A;3:4H;4:3O;5:30;6:4Q;a4Mb3Oc31d2Oe2Ef2Cg22h1Qi1Mjapa2Sk1Il19m0Xn0Po0Lp0Br07sVtPuNvLw9y7;a7ork,yz;kutsk,ngtze;aFeEhitDiBo7upatki,ycombe;king,o7;d7l1I;b3Xs7;i4tock;c0UllowbroEn7;c2Ygh2;by,church;ed0ntw3Os2A;ke8r40t7;erf1f1; is0If43;auxhall,irgin is0Lost7;ok;laanbaatar,pto7xb3M;n,wn;aBeotihuacan,h9ive4Go8ruro,sarskoe selo,u7;lum,zigoot;nto,rquay,tt2S;am3e 7orn3N;bronx,hamptons;hiti,j mahal,u1V;aHcotts bluff,eFfo,hEoCpringBt9u7yd2O;dbury,ez,n7;der05set3K;aff1ock2Vr7;atf1oud;hill,w5;ho,uth7; 1Qam27wold;erbroKopping1G;a7ine;f30t0;int lawrence riv6khalin;ayleigh,ed9i7oc26;chmond,o gran4ver7;bend,fr0Esi4; sea,cliffe,hill;aDeAhx,i7ompeii,utn2;c8ne7tcairn; 2Wc0M;kering,t0;k,lh2mbr8n7rth;n1Pzance;oke;cif3Gpahanaumokuakea,r7;k7then0;si4w5;ak9ld t2Jr8x7;f1ley;ange county,f1inoco;mZw5;eAile,o7;r7tt2V;th7wich; 10am1H;gev,uschwanstein,w7; eng8a7h2markKport;rk;land;aAco,e8i7uc;dt26ll17;adow7kong;lands;chu picchu,gadan,iBlAn9ple8r7;kh2; 1Kw5;hattan,sf2J;ibu,t0vern;dstone,n st7;!re7;et;aBeAgw,hr,i7owlSynd06;n7ttle italy;coln memori7dley;al;asi4w3;kefr9mbeth,n7;ca2Mg7sing;f1ley,t0;ont;azan kremlin,e9itchen6o8rasnoyar7ul;sk;re0Xsrae;ns0Ks1X;ax,lf1n8ps7;wiP;d7glew5verness;ian2Aochina;aFeDi8kg,nd,ov7unti2J;d,enweep;gh8llc7;reN;bury,l7;and7;!s;r7yw5;ef1tf1;libu26mp8r7stings;f1lem,row;stead,t0;aFodavari,r7uelph;avenCe7imsW;at Aen7; 8f1Iwi7;ch;acr3valley;britain,lak3;hur7;st;ng3y village;airhavKinancial7ra; district;aCgliBnf19ppiAu9ver8x7;et6f1;glad3t0;rope,st0;ng;nt0;rls1Ms7;t 7;e7si4;nd;aEeCfw,igBo9ryd8u7xb;mfri3nstable,rh2tt0;en;nca1ArcMv6w7;nt0C;by;nh2r7vonport;ry;nuAr7;l8t7;f1moor;ingt0;be;aNdg,eLgk,hElDo7royd0;l8m7rnwall;pt0;c9lingw5osse7;um;ood;he0U;earwat6t;aBel9i7uuk;chen itza,mney rock,n7ricahua;atT;m0Zt7;enh2;mor7rlottetQth2;ro;dar 7ntervilB;grove;ldBmAr7versh2;lis8rizo pla7;in;le;bNpbellf1;weT;a01eQingley,kk,lackOoNr7uckX;aIiCo7;ckt0ok7wns cany0;lyn,s7;i4to7;ne;de;dge8gh7;am,t0;n8t7;own;or7;th;ceb8m7;lPpt0;rid7;ge;ardwalk,lt0;bu7pool,waA;rn;aconsfFdf1lCrAverly9x7;hi7;ll; hills;wi7;ck; air,l7;ingh2;am;ie7;ld;ltimore,rnsl8tters7;ea;ey;bMct0driadic,frica,ginKlHmericas,nBrcAs9tl8ylePzor3;es;!antA;hcroft,ia; de triomphe,t8;adyr,caAdov6tarct7;ic7; oce7;an;st6;er;be8dersh7hambra,list0;ot;rt0;cou7;rt;bot9i7;ngd0;on;sf1;ord",
    "Region": "true¦0:2J;1:2G;2:2P;3:2A;a2Nb2Ac1Wd1Res1Qf1Og1Jh1Fi1Aj16k11l0Ym0Nn07o05pYqUrRsJtEuBverAw6y4zacatecas;akut0ork3u4;cat1kon;a5est 4isconsin,yoming;bengal,virgin0;rwick3shington4;! dc;acruz,mont;dmurt0t4;ah,tar4; 2Ka0X;a6e5laxcala,ripura,u4;scaDva;langa2nnessee,xas;basco,m4smOtar24;aulipas,il nadu;a8elangor,i6o5taf11u4ylhet;ffXrrey,s19;me1Bnora,uth V;ber0c4kkim,naloa;hu1ily;n5rawak,skatchew1xo4;ny; luis potosi,ta catari2;a4hode i9;j4ngpur;asth1shahi;inghai,u4;e4intana roo;bec,en4retaro;sl0E;a8e4unjab;i,n5r4;ak,nambuco;ang,nsylv4;an0;hang,ra4;!na;axaca,disha,h4klahoma,ntar4reg7ss0Ax0F;io;aIeBo6u4;evo le4navut;on;r4tt15va scot0;f6mandy,th4; 4ampton3;caroli2dakota;olk;braska,vada,w4; 6foundland4;! and labrad4;or;brunswick,hamp3jers5mexiTyork4;! state;ey;galPyarit;aAeghalaya,i6o4;nta2r4;dov0elos;ch6dlanDn5ss4zoram;issippi,ouri;as geraPnesota;ig1oac1;dhy12harashtra,ine,lacca,ni5r4ssachusetts;anhao,i el,ylG;p4toba;ur;anca3e4incoln3ouisI;e4iR;ds;a6e5h4omi;aka06ul2;dah,lant1ntucky,rala;bardino,lmyk0nsas,r4;achay,el0nataka;alis6har4iangxi;kh4;and;co;daho,llino7n4owa;d5gush4;et0;ia2;is;a6ert5i4un1;dalFm0D;ford3;mp3rya2waii;ansu,eorg0lou7oa,u4;an4izhou,jarat;ajuato,gdo4;ng;cester3;lori4uji1;da;sex;ageUe7o5uran4;go;rs4;et;lawaMrby3;aFeaEh9o4rimea,umbr0;ahui7l6nnectic5rsi4ventry;ca;ut;ima,orado;la;e5hattisgarh,i4uvash0;apRhuahua;chn5rke4;ss0;ya;ra;lGm4;bridge3peche;a9ihar,r8u4;ck4ryat0;ingham3;shi4;re;emen,itish columb0;h0ja cal8lk7s4v7;hkorto4que;st1;an;ar0;iforn0;ia;dygHguascalientes,lBndhr9r5ss4;am;izo2kans5un4;achal 7;as;na;a 4;pradesh;a6ber5t4;ai;ta;ba5s4;ka;ma;ea",
    "FemaleName": "true¦0:I4;1:I8;2:HG;3:HY;4:HH;5:HL;6:IL;7:IP;8:G8;9:IH;A:G1;B:GZ;C:HQ;D:IE;E:AF;F:HU;G:H1;aFSbEOcCVdC4eARfA9g9Kh92i8Sj7Pk6Rl5Cm3Sn39o36p2Uqu2Tr22s11t0Bu09vZwSxi30yOzH;aLeIineb,oHsof4;e3Df4la,ra;h2iKlIna,ynH;ab,ep;da,ma;da,h2iHra;nab;aJeIing,olACu0vH;et8onCT;le0sen4;el,gmur,n,s89;aMendD6hiCNiH;lJnH;if3TniHo0;e,f3S;helmi0lHma;a,ow;ka0nB;aNeKiHusa5;ck7JkIl8oleAviH;anEenI4;ky,toriAT;da,lma,rHs0;a,nHonica;a,ice;leHnesG9;nHLrH;i1y;g9rHs7;su5te;aXeThQiMoKrHu5y2;acI4iHudy;c4na,sH;hEta;nHr0F;iEya;aJffany,nHs7;a,gtiH;ng;!nEUra;aIeHomasi0;a,lma,o7Pres1;l4ndolwethu;gan,o7NrIssH;!a,ie;eHi,ri6;sa,za;bOlMmKnIrHs7tia0wa0;a7Gyn;iHya;a,ka,s7;arEe2iHm6Nra;!ka;a,iH;a,t7;at7it7;a0Bcarlett,e07hViSkye,neza0oQri,tNuIyH;bil,lvi1;ha,niAsIzH;an39et8ie,y;anHi6;!a,e,nH;aCe;aIeH;fan3l4Wphan5U;cH6r5;fi9KnHphi1;d2ia,ja,ya;er2lv4mon1nIobhan,tH;a,i;dy;aMeIirHo0y5;a,lCU;ba,e0i5lJrH;iHr60yl;!dan;ia,lD7;imaa,ki2nJrIu0w0yH;la,na;i,le9on,ron,yn;aIda,ia,nHon;a,on;!ya;lJrIvH;da,inj;e0ife;en1i0ma;anvi,bLd57har,iBkKlJmInd2rHs7vannaC;aCi0;ant7i2;lCYma,ome;ineh,u2;in1ri0;a03eYhWiToHuthCW;bRcQl7XnPsJwIxH;anAEie,y;an,e0;aIeHie,lD;ann6ll1marCQtA;!lHnn1;iHyn;e,nH;a,dE;da,i,na;hel5Rio;bin,erAyn;a,cIkHmas,nEta,ya;ki,o;h8Bki;ea,iannon,oH;da,n1F;an0bIemEgi0i0nHta,y0;a7Oee;a,eH;cHkaC;a,ca;chIe,i0mo0nHquel,y0;di,ia;ael,elHiB;!e,le;een3ia0;aOeNhKia,oIrH;iscil3Audence;lHrt4;i0ly;iloIoebe,ylH;is,lis;me0;ggy,nelope,r5t2;ige,m0Nn59o5rvati,tIulH;a,et8in1;ricHt4F;a,e,ia;ctav4deIfCCksa0lHphCCumou;a,ga,iv4;l4t8;aTeRiLoIurHy5;!ay,ul;a,eIor,rHur;aCeFma;ll1mi;aLcJharika,kIlaHna,s7ta;!y;a,iDBki;hoGk9HolH;a,e4G;!mh;hir,lHna,rissa;!a,lBD;dLima,nKomi6rges,tH;aHhal3;lHs7;i1ya;cy,et8;e9iECya;a08ckenz3e00iMoJuriel,yH;a,rH;a,iMna,tG;i2llB2nH;a,iH;ca,ka,que;a,cSdori,kaRlMmi,nKrHtzi;aIiH;am;!nB;dy,eHh,n3;nhGrva;aKdJe0ica,lH;iHy;cent,e;red;!gros;!e5;ae5hH;ae5el3T;agan,gNi,lKrH;edith,iIon,yH;em,l;em,ssa;an3iHlisa;nHsBY;a,da;!an,han;b07cADd05e,g03ha,i02ja,l00nZrLsoumeh,tKuIvis,xB0yHz3;bell,ra,soun;d6rH;a,eF;h82ild1t3;a,cTgPiKjor3l7Gn3s7tJwa,yH;!aHbeth,ja9lou;m,nB0;a,ha,in1;!aJbel,eIja,lDna,sHtza;!a,ol,sa;!l1A;!h,m,nH;!a,e,n1;arJeIie,oHr3Yueri8;!t;!ry;et3Wi36;el4Li6Zy;dy,on,ue5;ak,en,iHlory;a,ka,nB;a,re,s3te;daHg3;!len1;alDd3elHge,ison,on0;ei9in1yn;el,le;a0Me0BiWoQuLyH;d4la,nH;!a,dIe2KnHsey;!a,e2J;a,sey;ann,cJel0Ois1lIna,pHz;e,iA;a,u;iHy;a2Oe,ja,l2JnB;is,l1QrItt1HuH;el5is1;aJeIi6na,rH;a9Vi6;lei,n1tA;!in1;aTbb95dSepa,lNnKsJvIzH;!a,beth,et8z3;!ia;a,et8;!a,dH;a,sHy;ay,ey,i,y;a,iJja,lH;iHy;a9Qe;!aH;!nE;ia,ya;!nH;!a,ne;aPda,e0iNjYla,nMoKsJtHx8Ry5;iHt3;c4t4;edi,lC6;la,nHra;a,ie,o2;a,or1;a,gh,laH;!ni;!h,nH;a,d2e,n5K;cOdon0iNkes7mija,na,rMtJurIvHxmi,y5;ern1in4;a,e4Zie,yn;as7iIoH;nya,ya;fa,s7;a,is9R;a,la;ey,ie,y;a01eWhaViNlea,oMrJyH;lHra;a,ee,ie;istHy67;a,en,iHy1E;!e,n55;nul,ri,urtney;aNerMley,mJrHzzy;a,stH;en,in;!berlH;eHi,y;e,y;a,stF;!na,ra;dij1w5;el7LiKlJnIrH;a,i,ri;d2na,za;ey,i,lB6s3y;ra,s7;cey,diatou,ede,iSlQmPrNss6EtKviAyH;!e,lH;a,eH;e,igh;!a68eIhHi4LlDri0y;ar83er83ie,leFrAVy;!lyn89ri0;a,en,iHl5Poli0yn;!ma,nEssa;a5il1;eigh,i,lH;e,ie;a,tl6F;a0AeZiWoOuH;anMdLlHst7U;es,iH;a88eHssa;!n9tH;!a,te;ith,y;a,iA;!anNcelDdMelGhan7HleLni,sIva0yH;a,ce;eHie;fHlDph7K;a,in1;en,n1;i6y;!a,e,n3X;lHng;!ian,lH;!ian;anNle0nKrJsH;ica,sH;!e,ica;i,ri;!a,elGifer,nH;a,et8iHy;!e,fer;a,eJiInH;a,eIiH;e,n1;!t8;cMda,mi,nIque27sminEvie2y9zH;min6;a6eIiH;ce,e,n1s;!lHssa,t0A;e,le;inIk68lDquelH;in1yn;da,ta;da,lPmOnNo0rMsIvaHwo0;!na;aIiHla,obel;do2;belHdo2;!a,e,l34;ati,en1i0ma;di2es,grid;a9elBoge9;a,e9ia0o0se;aQeNiIoHyacinth;da,ll3rtense;lImaH;ri;aIdHlaI;a,egard;ry;ather,iIlHnrietArmi9ster;en2Rga,mi;di;biba,iley,lNnMrJsnItHwa,yley;ice,t3;aa;iHmony,ri4Z;etH;!te;aCnaC;a,ey,l3;a01eViQlOoNrKunJwH;enHyneth;!dolD;ay,el;acieIetHiselB;a,chF;!la;ld1Aogoosh;adys,enHor4ynis;a,da,na;aKgi,lIna,ov85selHta;a,e,le;da,liH;an;!n0;mLnJorgIrH;ald5Ki,m3Btrud6;et8i4U;a,eHna;sis,vieve;ma;bHle,rnet,yG;iIrielH;a,l1;!ja;aTeQiPlorOoz4rH;anJeIiH;da,eB;da,ja;!cH;esIiHoise;n1sca;!ca;a,enc4;en,o0;lIn0rnH;anB;ec4ic4;nArKtHy6;emIiHma,oumaA;ha,ma,n;eh;ah,iBrah,za0;crin,d0Qevi,ileFk0Ol07mXnid,rUsOtNuMvHwa;aKelIiH;!e,ta;inEyn;!a;!ngel4O;geni1nice;hel,ien9ta;mLperanKtH;eIhHrel5;er;l2Zr6;za;a,eralB;iHma,ne4Eyn;cHka,n;a,ka;aPeOiLmH;aIeHie,y;li9;!li9nuH;elG;lHn1;e6iHy;a,e,ja;ly,rald;!nue5;aWeUiNlMma,no2oKsJvH;a,iH;na,ra;a,ie;iHuiH;se;a,en,ie,y;a0c4da,e,f,nMsJzaH;!betHveA;e,h;aHe,ka;!beH;th;!a,or;anor,nH;!a,i;!in1na;ate1Pta;vi;eIiHna,wi0;e,th;l,n;aYeMiLjeneKoH;lores,minique,n39rHtt3;a,eFis,la,othHthy;ea,y;ba;an09naCon9ya;anQbPde,eOiMlJmetr4nHsiree;a,iH;ce,se;a,iIla,orHphi9;es,is;a,lah;dHrdH;re;!dee,na;!b2EoraCraC;a,d2nH;!a,e;hl4i0lal,mNnLphn1rIvi1VyH;le,na;a,by,cIia,lH;a,en1;ey,ie;a,et8iH;!ca,el19ka;arHia;is;a0Qe0Mh04i02lUoJristIynH;di,th4;al,i0;lPnMrIurH;tn1C;aJd2IiHn2Iri9;!nH;a,e,n1;!l3;cepcion,n3sH;tanHuelo;ce,za;eHleF;en,t8;aJeoIotH;ilde;!pat2;ir6rJudH;et8iH;a,ne;a,e,iH;ce,sY;a2er2ndH;i,y;aQeNloe,rH;isJyH;stH;al;sy,tH;a1Men,iHy;an1e,n1;lseIrH;!i6yl;a,y;nMrH;isKlImH;ai9;a,eHot8;n1t8;!sa;d2elGtH;al,elG;cIlH;es8i41;el4ilH;e,ia,y;itlYlXmilWndVrMsKtHy5;aIeIhHri0;er1DleFrDy;ri0;a32sH;a31ie;a,iOlLmeJolIrH;ie,ol;!e,in1yn;lHn;!a,la;a,eIie,otHy;a,ta;ne,y;na,ssa;ace,ice;a,e,l1;isAl3;in,yn;arb0Je02iZlXoUrH;andi6eRiJoIyH;an0nn;nwDoke;an3BdgMgiLtH;ney,tH;!aInH;ey,i,y;ny;d,t8;etH;!t6;an0e,nH;da,na;bbi6glarInH;iAn3;ka;ancHythe;a,he;anca,lja0nH;iAtH;ou;aVcUlinBniArPssOtJulaCvH;!erlH;ey,y;hJsy,tH;e,iHy6;e,na;!anH;ie,y;!ie;nItHyl;ha,ie;adIiH;ce;et8i9;ca,ky;!triH;ce,z;a2o2ra;a2Sb2Md23g1Zi1Qj5l16m0Xn09oi,r04sVtUuOvNwa,yHz2;aKes7gJlIn,seH;!l;in;un;!nH;a,na;a,i2J;drLguJrIsteH;ja;el4;stH;in1;a,ey,y;aahua,he0;hIiya,ja,miAtrH;id;aLlHton;eIi6yH;!n;e,iHy;gh;!nH;ti;iJleIo7piA;ta;en,n1t8;aHelG;!n1J;a01dje5eZgViTjRnKtoHya;inet8nH;el5ia;te;!aKeIiHmJ;e,ka;!mHtt6;ar3;!belIliHmU;sa;!l1;a,eliH;ca;ka,sHta;a,sa;elHie;a,iH;a,ca,n1qH;ue;!tH;a,te;!bImHstasiMya;ar4;el;aLberKeliJiHy;e,l4naH;!ta;a,ja;!ly;hGiIl4nB;da;a,ra;le;aWba,ePiMlKthJyH;a,c4sH;a,on,sa;ea;iHyson;e,son;a,cIn1sHza;a,e,ha,on,sa;e,ia,ja;c4is7jaKksaKna,sJxH;aHia;!nd2;ia,saH;nd2;ra;ia;i0nIyH;ah,na;a,is,naC;la;c7da,leFmNnLsH;haClH;inHyY;g,n;!h;a,o,slH;ey;ee;en;at7g3nIusH;ti0;es;ie;aWdiTelMrH;eJiH;anMenH;a,e,ne;an0;na;!aLeKiIyH;nn;a,n1;a,e;!ne;!iH;de;e,lDsH;on;yn;!lH;i9yn;ne;aKbIiHrL;!e,gaK;ey,i6y;!e;gaH;il;dKliyJradhIs7;ha;ya;ah;a,ya",
    "FirstName": "true¦aTblair,cQdOfrancoZgabMhinaLilya,jHkClBm6ni4quinn,re3s0;h0umit,yd;ay,e0iloh;a,lby;g9ne;co,ko0;!s;a1el0ina,org6;!okuhF;ds,naia,r1tt0xiB;i,y;ion,lo;ashawn,eif,uca;a3e1ir0rM;an;lsFn0rry;dall,yat5;i,sD;a0essIie,ude;i1m0;ie,mG;me;ta;rie0y;le;arcy,ev0;an,on;as1h0;arl8eyenne;ey,sidy;drien,kira,l4nd1ubr0vi;ey;i,r0;a,e0;a,y;ex2f1o0;is;ie;ei,is",
    "LastName": "true¦0:96;1:8Q;2:90;3:8Y;4:8R;5:8I;6:8G;7:8L;8:6N;9:6D;a8Sb7Oc6Nd62e5Wf5Jg4Xh4Fi4Cj45k3Ml37m2Cn23o1Vp1Hquispe,r0Ys0At02vWwMxLyDzA;hAimmerm4L;aAou,u;ng,o;aEeun71iBoAun;koyama,shida;!lA;diAmaz;rim,z;maAng;da,g3Omoto,sAza9;a9hita;iao,u;aFeDiBoAright,u;jcik,lff,ng;lAmm0nkl0sniews9;ki8Hliams25s3;bAiss,lt0;b,er,st0;age,gn0lBtA;anabe,s3;k0sh,tA;ers,on;aCesel6RiAogt;dal,llalAss0valdi;ba,obos;lBn dArgas;en b4Gijk,yk;enzuela,verde;aGeix18hDi1j7oCrBsui,urA;c1n0;an,emblay,ynis9;lstoy,m5rr2th;atch0ill,oA;mArlacius;ps3s3;kah7Anaka,te,var2;aSchNeMhKiImGoEtBuAvoboda,zabo;bot5lliv1zu9;aBeAoica;ele,in1Pphe8vens1H;l7rm0;sa,to,uA;ng,sa;itAyth;!h;lva,mmo8nArbu;at6clair,gh;aAehu,imizu;la,rma;gu6infeld,oh,pulveda,rrano;evi4iltz,miBneid0roed0uAwarz;bert,lz;dBtA;!t,z;!t;h7ito,ka3AlDnAr5sa9to,unders;dBtAz;ana,e,os;b3Kers;as,o;aPeMiJoDuByA;a4oo,u;bio,iz,sA;so,u;bEcha,drigu2gers,jas,mDosevelt,sCtBux,wA;e,li4;ari,h;enb3Bsi;ano,ero;erts0Ni6Z;beiro,cBes,vAzzo;as,e6;ci,hards0K;ag1es,iBut0yA;es,nolds;s,t0;dBmAv4K;os;ic,u;aLeIhGiDoCrAut7;asad,ifti,ochazA;ka;p23rti58well;cBero,nA;as,to;asso,hl0;aAillips;k,m,n4P;a6PeteWna,rAters04;eAic,ki8;i6ra,tz;h66k,rk0tA;el,te6L;bGconnor,g1RlDneill,rBsborne,we8zA;demir,turk;ellana,tAwell;ega,iz;iAs3;vAynyk;ei6;aIrien;aFeEiDoAun2ym1;rBvAwak;ak,otn4I;odahl,ris;cholsNemi,kol5x3;ils3mec;gy,kaAray1sh,varro;jiAmu6shiA;ma;aXcUePiOoFuByeA;rs;lCnBrAssolini;ati,pTray;oz,te3R;d0l0;h1lHnGore,rBsAzart;er,s;aDeCiBrisAt3;!on;!n0C;au,i6no,tti;!l2;roe,tgomery;ina,l0;crachi,ll0;hmeti,iDjia,lBnd2rci0ssiAyer1J;!er;nAo;yk;er,j0;cartBlA;aughl7e1;hy;drigal,eda,i0jerus,kela,mani,nFrCtByA;er,r;ei,ic,su11th5C;iAqu2roqu7ti8;ani,c,nA;!o;cini,n;aNeIiFoDuByA;!nch;k5nAo;d,gu;mbarAp2vr5we;di;!nAu,yanage;coln,dA;b11holm,strom;feChm0Fitn0kaBn7rAwis;oy;!j;bvAvA;re;ine,mmy,ng,u,voie,ws3;aNeMh1iKlIoFrDuBvar1woA;k,n;ce6marA;!a;aAem0ishna,yeziu;m0sniqi,us2F;bay3Rch,vaAwals9;cAl;!ic,s;e7uiveA;rt;eff0kAl5mu6;uchi;ll0nnedy;hn,llDmins9ne,pBstrati,to,ur,yA;a,s0;l1oA;or;oe;aEenDha4oBuA;ng,r5;hnsAn2u4;on,t3;ki8nings;cAnsse8;ks3obs;glesias,keda,l07noTonBshikAto,vanou;awa;escu;aJeIiHjaltal7oCuA;!aAb0gh2ynh;m1ng;a4dz5fCjgaard,k,lBpIrAwe,xha;ak,vat;m2t;er,fm2WmA;ann;ggi8tchcock;ikkila,mingway,nde3Rrre6ss;dz5gen,qGrFsDuCwByA;ashi,es;ki8;gen,ng;ani,hiA;moto;di4p0ris,t;ue;aNeorgMheorghe,iLjonKoFrDuAw3;errAo,zm1;a,eA;ro;ayli4eene,g5iffithAub0;!s;ldCm2nBodA;e,m1;calv2zal2;bAs02;erg;aj,i;bs3l,ordaH;ieva;gnGlDmaCndhi,o,rAshi,uthi0;cAdn0za;ia;ge;eaBlA;agh0i,o;no;e,on;aLerIiFjeldsted,lEoCrBuA;chs,ent2jita,ll0;eem1iedm1;ntaArt7urni0wl0;na;emi4or2;sBtzgeraA;ld;ch0h0;nand2rA;arAei6;a,i;b0rrell;dDinsCsAva8;cobar,pAtrada;inoza,osiJ;te7;er,is3warA;ds;aQeJiHjurhuGoEriscoll,uBvorA;ak;arte,boBmitru,nn,rAtta;and,ic;is;g1he0DtA;to;us;aAcki1Wssanayake,x3;s,z; CbnaBlAmir,rvishi,vi,w1;gado,ic;th;bo0groot,jo4lBsilAvri2;va;a cruz,e3uA;ca;hl,mcevs9nBtta,viA;ds3es,s;iels,kula;ki;a03eYhLiobKlarkJoCrAunningham;awford,ivAuz;elli;hen,lEntDoCrAsta,x;byn,reA;a,ia;ke,p0;i,reras;em1li8;ns;!e;anu;aGeEiu,oAu4we;i,ng,p6uBwAy;!dB;dAng;huD;!n,onAu4;!g;kDnCpm1ttBudhA;ry;erjee,o0O;!d,g;ma,raboA;rty;bDlZng5rA;eghetBnA;a,y;ti;an,otari;cer2lder3mpbeFrCstAvadiX;iAro;llo;doBr,t0uAvalho;so;so,zo;ll;a00eOhLiKlJoHrEuCyA;rFtyA;qi;chan1rA;ke;iem,oAyant;oks,wA;ne;nFruya,su,uchaAyko,z5;rd;anco,ondal;ancLdMshwas;aZoAuiy1;umAwmA;ik;ckJethovIgu,ktGnnOrA;gCisBnascoA;ni;ha;er,mA;anA;!n;asA;hi;en;er,hA;am;b5ch,hKiley,kk0ldw7nFrBshAt2u0;ir;bCnBtlAua;ett;es,i0;ieSosa;dAik;a6yoA;padhyA;ay;ra;k,ng;ic;bbYcosXdVgSkhtTlPnJrFsl1tDyA;aBd7;in;la;chis3kiA;ns3;aCmstro4sl1;an;ng;ujo,ya;dBsaA;ri;eBrA;ews;rs3;on;meiBv2;es;da;arwBuilA;ar;al;ams,l0;er;ta;as",
    "MaleName": "true¦0:GJ;1:FD;2:DD;3:G3;4:D0;5:G9;6:CJ;7:F5;8:EB;9:BL;A:FZ;B:FR;aEQbDMcC9dB5eACf9Lg8Lh7Wi7Kj6Ik63l5Dm40n3Mo3Dp2Zqu2Xr22s1Bt0Pu0Mv0AwRxavi2yHzC;aCor0;cChid,karia,nAC;!hDkC;!ary;!ar72ery;aIevgenBBoEuC;en,rFBsCval;if,uf;nCsef,ussef;aCg;s,tC;an,h0;nCrosDNss08;is,nC;!ick;aPeNiDoCyatt;jciech,lfgang,odrFutR;lFnC;f8IsC;lCt1;ow;bGey,frEhelm,lC;ard,iCy;am,e,s;ed5iC;d,ed;e9ur;i,ndell,rn2sC;!l8t1;lDyC;l1ne;lDtC;!er;ace,y;aKernCXiFladDoC;jtech,lodymyr;!iC;mir,sCY;cFha0ktor,nceDrgil,vC;a0ek;!nC;t,zo;!e4Mtor;lCnce,sily;!entC;in94;lCm6Qri,sm0;riCysses;ch,k;aVeQhMiKoFrDurki,yC;!l2rone,s1;avis,eCist0oy,um0;ntCFvor,y;bFdAImCny;!asDmC;aso,ie,y;!z;ias,y;mCt6;!my,othy;adEeoDiago,omC;!as;!dor8N;!de6;dFrC;ence,rC;ance,eCy;ll,nce;!dy;dgh,ha,iCnn2req,tsuki;chi,ka;aXcotVeShOiLlobod0oKpenc2tEurDvenA0yCzym1;ed,lvest2;aj,esh;anFeDuC;!a9;fan15phE6vCwa9;e6Xie;!islaCl8;v,w;lom1rBuleymane;dDgmund,lCm1yabonga;as,vio;!dhartha,n8;aEeClomo;lCrm0;d1t1;hid,ne,qu1Hun,wn,yne;aDbastiDUkou,lim,pp,rgCth,ymour;e1Bio;m6n;!tC;!ie,y;eed,lFmEnCqib,toshi,ul;dCjay,tino;eep,ro;!iAHkelo,mBQu4;!vatore;aZeUhett,iRoGuDyC;an,ou;b8WdDf6pe9ssC;!elDX;ol00y;an,bLcco,dJel,geIh0lHmGnEry,sDyC;!ce;ario,coe,s;!aCnBG;ld,n;an,eo;a72f;lio,r;e38g2n8olfo,riC;go;bB9eCZ;cCl8;ardo,c7Th4WkCo;!ey,ie,y;cFece,gDid,ubByCza;ansh,n05;gie,iC;nald,s;ep;chid,fa4hHin2jesh,lGmFndEoHpha4sDul,wiri,yC;an,mond;had,m6;alD9olph;iro,on;f,ph;ul;e90inC;cy,t1;aNeKhilIiErCyoF;akash,eC;m,st1;eDoC;tr;rre,tC;er,ro;!ipClip;!p6I;dro,rcy,tC;ar,e98rC;!o7;blo,draig,olo,scal,tri5RulCv86;!ie,o;ctavio,i2lHmGndrej,rFsDtCumAwB;is,to;ama,cAkAm0vCwald;aldo;i,vR;ar,er;aDeksandr,ivC;er,i2;f,v;atNeLguyBiFoC;aDel,l0rC;be9m0;h,m;cFels,g4ilo,kDlC;es,s;!hil,las,olaC;!i,y;hCkColas;olas;al,d,il,ls1vC;ille;e,hanC;!a4i4;aXeUiLoGuDyC;les,r1;hamDrad,staC;fa,pha;ed,mG;dibo,e,hamEises,ntDritz,sCussa;es,he;e,y;ad,ed,mC;ad,ed;cFgu4hai,kElDnato,tchC;!ell;house,o7t1;aere,eBPhail,olaj;ah,hDkC;!ey,y;aDeC;al,l;el,l;hDlv3rC;le,rill,v4M;di,met;ay0c00gn6hWjd,ksim,lTmadZnSrKsXtDuric7OxC;imilB6well;eHhEias,tCus,yas;!eo,hCia7;ew,ias;eDiC;as,eu,s;us,w;j,o;cHiGkFlEquis,shall,tCv3;iCy;!m,n;in,on;el,o7us;ano,o7us;!elCin,o7us;!l5o;fred,ish,ny,u4;acDcoCik;lm;hy;amDdi,esh,mC;oud;adCmad;ou;aulCiej;ay;aXePiNloyd,oJuDyC;le,nd1;cFdEiDkCth2uk;a7e;gi,s,z;ovic,vig,wig;!as,iC;ano,en;g0nnie,renEuCvro,well;!iC;e,s;!zo;am,n6oC;n4r;a9Kevi,land,nHoFst2thaEvC;eCi;nte;bo;nCpold;!a7Sel,id;!nC;a9y;mEnd1rDszlo,urenCwr6C;ce,t;ry,s;ar,be9ont;aMeHhalGiEla6onrad,rCu5Jyle;istCzysztof;i0oph2;er0ngsl8p,rC;il9Vk;ed,id;en0iFnCrmit,v4R;!dDnCt1;eth,y;rick;r,th;cp2mErDspAuC;ri;im,l;al,il;a03eXiVoFuC;an,lCst3;en,iC;an,en,o,us;aQeOhKnIrGsDzC;ef;eDhCiah,ue;!ua;!f,ph;dCge;i,on;!aCny;h,s,th6E;anDnC;!ath6Cie,n6U;!nC;!es;!l,sCy;ph;o,qu3;an,mC;!i,m6N;d,ffFns,rCs6;ald,emDmaine,oCry;me,nimo;iah,y;!ery,rC;ey,y;cKdBkImHrEsDvi2yC;dBs1;on,p2;ed,oDrCvis;ett,od;d,s5W;al,es5Ris1;a,e,oCub;b,v;ob,ques;aRbLgKke4Xlija,onut,rIsEtCv0;ai,suC;ki;aDha0iah,maCsac;el,il;ac,iaC;h,s;a,vinCw3;!g;nacio,or;ai,rahC;im;aReLoIuC;be9gGmFsC;eyDsC;a3e3;in,n;berto;h,o;m2raDsse3wC;ard,ie;c45tio;ath,ctor,iGnDrC;be9man07;drik,rC;iCy2I;!k,que;n0Ptor;bJlImza,nHo,rEsDyC;ato,dB;an,s0;lDold,r2DuCv8;hito,ki,to;an,ey;k,s;!im;ib;a07eZiUlenToQrMuCyorgy;iHnFsC;!taC;f,vC;!e,o;nAtC;er,h2;do,lC;herDlC;auCerP;me;aEegCov2;!g,orC;!io,y;dy,ham;dfr8nzalo,rDttfC;ried;an,d45;!n;acoFlDno,oCuseppe;rgi5vanni;be6Aes,lC;es;mo;oFrC;aDhard,rCt;it,y;ld,rd5;ffErgC;!e7iCy;!os;!r8;bElBrCv3;eCland,r4Dth,y;th;e,ri4;aXeSiQlOorrest,rCyodor;aHedFiC;edDtC;s,z;rich;!d40eri10riC;ck,k;nCs2;cEkC;ie,lC;in,yn;esLisC;!co,zek;etch2oC;ri0yd;d4lConn;ip;deriFliEng,rC;dinaCg6nando;nd5;pe,x;co;bCdi,hd;iEriC;ce,zC;io;an,en,o;benez2dYfrXit0lSmLnIo3rEsteb0th0ugenDvCzra;an,erett,geny;!e;iDnCrol,v3w3;est5ie,st;cCk;!h,k;och,riCzo;co,qC;ue;aHerGiDmC;aGett;lCrh0;!iC;ano,o,s;s1y;nu4;be9d1iEliDm2t1viCwood;n,s;ot2As;!as,jah,ot,sC;ha;a3en;!dGgAmFoDua2PwC;a2Oin;arC;do;oZuZ;ie;a04eTiOmitrNoFrag0uEwDylC;an,l0;ayne,ight;ane,dl8nc0st3;minFnDri0ugCvydGyle;!lF;!ald,nCov0;ell,ie,y;go,iDykC;as;cCk;!k;i,y;armuFetDll1mitri7neCon,rk;sh;er,mAriC;ch;id;andLepak,j0lbe9metri6nIon,rGsEvDwCxt2;ayne,ey;en,in;hawn,moC;nd;ek,riC;ck;is,nC;is,y;rt;re;an,le,mKnIrEvC;e,iC;!d;en,iEnell,rCyl;eCin,yl;l3Zn;n,o,us;!iCny;el,lo;iCon;an,en,on;a0He0Eh04iar0lSoKrFuDyrC;il,us;rtC;!is;aFistC;iaDobC;al;no;ig;dy,lInErC;ey,neliCy;s,us;nEor,rDstaC;nt3;ad;or;by,e,in,l3t1;aHeEiCyde;fCnt,ve;ford,t1;menDt6;us;s,t;rFuDyC;!t1;dCs;e,io;enC;ce;aHeGrisC;!toC;phCs;!eC;!r;st2t;d,rCs;b4leC;s,y;el;cDdrCsA;ic;il;lHmFrC;ey,lDroCy;ll;!o7t1;er1iC;lo;!eb,v3;a06eWilVjorn,laUoSrEuCyr1;ddy,rtKst2;er;aKeFiEuDyC;an,ce,on;ce,no;an,ce;nDtC;!t;dDtC;!on;an,on;dFnC;dDisC;lav;en,on;!foLl8y;bby,gd0rCyd;is;ine,ke;al,lK;nIrC;at,nEtC;!raC;m,nd;aDhaCie;rd;rd5;!iDjam3nCs1;ie,y;to;kaMlazs,nHrC;n8rDtC;!holomew;eCy;tt;ey;dCeD;ar,iC;le;ar1Hb18d11fonso,gust3hm0Xi0Ul07m05nRrGsaFugustEveDyCziz;a0kh0;ry;o,us;hi;ata,chiKiJjun,mHnEon,tCy0;em,hCie,ur5;ur;aDoC;!ld;ud,v;aCin;an,nd5;!el,ki;baCe;ld;aMdHgel5tCwA;hoFoC;iDnC;!i5y;ne;ny;er7rCy;eDzC;ej;!as,i,j,s,w;!s;s,tolC;iCy;!y;ar,iCmAos;ne,r,t;aVbSdBeJfHiGl00onFphonsEt1vC;aPin;on;e,o;so,zo;!sR;!onYrC;ed;c,jaHksFssaHxC;!andC;er,rC;e,os,u;andCei;ar,er,r;ndC;ro;en;eDrecC;ht;rt5;dd3in,n,sC;taC;ir;dDmA;ar;an,en;ad,eC;d,t;in;so;aGi,olErDvC;ik;ian5;f5ph;!o;mCn;!a;dGeFraDuC;!bakr;hCm;am;!l;allEel,oulaye,ulC;!lDrahm0;an;ah;av,on",
    "Person": "true¦0:1Q;a21b1Tc1Hd1Ae14f11g0Zh0Ni0Mj0Jk0Gl0Dm07n04o03pYrOsItCusain bolt,v9w4xzibit,y1;anni,oko on2uji,v1;an,es;en,o;a3ednesday adams,i2o1;lfram,ode;ll ferrell,z khalifa;lt disney,r1;hol,ren;a2i1oltaire;n diesel,rginia wo12;lentino rossi,n gogh;a4h3i2ripp,u1yra banks;lXpac shakur;mba03pper gore;eresa may,or;kashi,t1ylor;um,yana;a4carlett johanss0h3i2lobodan milosevic,noop dogg,ocrates,pider1uperman,wami; man,man;egfried,nbad;akespeare,erlock holmes,ia labeouf;ddam hussain,nt1;a claus,ig8;a9e5i4o2u1za;mi,paul;bin hood,d stew12nald1thko;inho,o;hanna,ngo starr,valdo;ese witherspo0i1mbrandt;ll2nh1;old;ey,y;chmaninoff,ffi,iIshid,y romano;a4e3i2lato,o1uff daddy;cahontas,e;lar,per;le,rX;lmer,ris hilt0;leg,prah winfrey,ra;a2e1iles crane,ostradamus; yo,l5ttie,wmL;pole0s;a5e4i2o1ubarek;by,liere,net,rrissey;randa ju1tt romney;ly;rlin,ssia9;cklemore,rkov,s0ta hari,ya angelou;ady gaga,e1iberace,u;bron james,ch wale1e;sa;anye west,e2iefer suther1obe bryant;land;ats,sha;a2effers0fk,k rowling,rr tolki1;en;ck the ripper,waharlal nehru,y z;liSnez;a7e6i4u1;lk hog2mphrey1saZ;! bog03;an;l1tler;de;dwig,nry 3;ile selassFlle ber4m3rrison1;! 1;ford;id,mond;ry;ast0iannis,o1;odwNtye;ergus0lorence nightingale,r1;an1ederic chopL;s,z;ff5m2nya,ustaTzeki1;el;eril lagasse,i1;le zatop1nem;ek;ie;a5e3i1rake;ck w1ego maradoB;olf;g1mi lovaLnzel washingt0;as;l1nGrth vadO;ai lKt0;a7h4lint0o1thulhu;n1olio;an,fuci1;us;aucIop2ristian baKy1;na;in;millo,ptain beefhe4r1;dinal wols2s0;on;ey;art;a6e3hatt,ing crosby,oFro1;ck,n1;te;ck,nazir bhut2rtil,yon1;ce;to;nksy,rack ob1;ama;l 6r3shton kutch2vril lavig9yn ra1;nd;er;chimed2istot1;le;es;capo3go2paci1;no;re;ne"
  };

  //a hugely-ignorant, and widely subjective transliteration of latin, cryllic, greek unicode characters to english ascii.
  //approximate visual (not semantic or phonetic) relationship between unicode and ascii characters
  //http://en.wikipedia.org/wiki/List_of_Unicode_characters
  //https://docs.google.com/spreadsheet/ccc?key=0Ah46z755j7cVdFRDM1A2YVpwa1ZYWlpJM2pQZ003M0E

  // italian unicode:
  // à, è, é, ì, í, î, ò, ó, ù, ú.
  const compact = {
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
  const unicode = {};
  Object.keys(compact).forEach(function (k) {
    compact[k].split('').forEach(function (s) {
      unicode[s] = k;
    });
  });

  var contractions$1 = [
    { word: `c'è`, out: ['ci', 'è'] },
    { word: `v'è`, out: ['vi', 'è'] },
    { word: `l'ho`, out: ['lo', 'ho'] },
    // a 'before' rule needs three letters after it, so these short ones are spelled-out
    { word: `l'ha`, out: ['lo', 'ha'] },
    { word: `l'è`, out: ['lo', 'è'] },
    { word: `m'ha`, out: ['mi', 'ha'] },
    { word: `m'è`, out: ['mi', 'è'] },
    { word: `t'ho`, out: ['ti', 'ho'] },
    { word: `t'ha`, out: ['ti', 'ha'] },
    { word: `t'è`, out: ['ti', 'è'] },
    { word: `s'è`, out: ['si', 'è'] },
    { word: `c'ha`, out: ['ci', 'ha'] },
    { word: `v'ho`, out: ['vi', 'ho'] },
    { word: `v'ha`, out: ['vi', 'ha'] },
    { word: `n'è`, out: ['ne', 'è'] },
    { word: `dov'è`, out: ['dove', 'è'] },
    { word: `com'è`, out: ['come', 'è'] },
    { word: `cos'è`, out: ['cosa', 'è'] },
    { word: `quand'è`, out: ['quando', 'è'] },
    { word: `qual'è`, out: ['quale', 'è'] },
    { word: `l'abbiamo`, out: ['lo', 'abbiamo'] },
    { before: `c`, out: ['ci'] },//c'era, c'erano
    { before: `d`, out: ['di'] },//d'accordo, d'estate
    { before: `dov`, out: ['dove'] },
    { before: `com`, out: ['come'] },
    { before: `cos`, out: ['cosa'] },//cos'era
    { before: `quand`, out: ['quando'] },//quand'ero
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

  // words that end in a period, but don't end a sentence - 'Dr.'
  // (these replace the english abbreviations, which collide with real words here)
  const toObj = str => Object.fromEntries(str.trim().split(/\s+/).map(w => [w, true]));

  var abbreviations = toObj(`
  sig sigg dott dr prof proff avv ing arch geom rag on sen gen col cap ten mons
  spett egr gent ill
  l'avv l'ing l'on l'arch l'art l’avv l’ing l’on l’arch l’art l'univ l’univ
  kg km cm mm ml min
  vs ed cfr univ pag pagg art artt nn num vol voll fig tab sez lett par es tel ca ecc etc
  lun merc gio ven sab
  feb apr giu lug sett ott nov dic
`);

  var tokenize$1 = {
    mutate: (world) => {
      world.model.one.unicode = unicode;

      world.model.one.contractions = contractions$1;

      // our own abbreviations, for the sentence-parser
      world.model.one.abbreviations = { ...abbreviations };

      // 'que' -> 'quebec'
      delete world.model.one.lexicon.que;
    }
  };

  var version = '0.3.2';

  /*! spencermountain/suffix-thumb 6.1.0 MIT */
  // the four parts of a model, in the order they are packed
  const sections = ['fwd', 'both', 'rev', 'ex'];

  // characters with a meaning in the packed format - words containing these cannot be learned
  const reserved = /[~|:,{}0-9]/;

  const decodeVal = function (key, str) {
    const m = str.match(/^[0-9]+/);
    const n = m ? Number(m[0]) : 0;
    const tail = m ? str.slice(m[0].length) : str;
    return key.slice(0, key.length - n) + tail
  };

  // apply a model to one word:
  //   1. whole-word exceptions
  //   2. the longest suffix with a rule (a rule may match the entire word)
  //   3. the '' rule, if any, as a fallback (a plain append)
  //   4. otherwise, the word is returned unchanged
  const convert = function (str = '', model = {}) {
    if (typeof model === 'string') {
      throw new Error('suffix-thumb: convert expects a model - uncompress() a packed string first')
    }
    const { ex = {}, fwd = {}, both = {} } = model;
    if (Object.hasOwn(ex, str)) {
      return ex[str]
    }
    // longest suffix first - the stem is only cut once a rule matches
    for (let i = 0; i <= str.length; i += 1) {
      const suff = str.slice(i);
      if (Object.hasOwn(fwd, suff)) {
        return str.slice(0, i) + fwd[suff]
      }
      if (Object.hasOwn(both, suff)) {
        return str.slice(0, i) + both[suff]
      }
    }
    return str
  };

  const flipObj = function (obj = {}) {
    return Object.fromEntries(Object.entries(obj).map(([key, val]) => [val, key]))
  };

  // swap the direction of a model
  const reverse = function (model = {}) {
    return {
      reversed: !model.reversed,
      // these two work both ways
      both: flipObj(model.both),
      ex: flipObj(model.ex),
      // and the one-way rules trade places
      fwd: model.rev || {},
      rev: model.fwd || {},
    }
  };

  const invalid = function () {
    throw new Error('suffix-thumb: invalid packed model')
  };

  // suffix-trie → list of keys
  const unpackKeys = function (str, suff = '', out = []) {
    let i = 0;
    do {
      let chain = '';
      while (i < str.length && str[i] !== ',' && str[i] !== '{') {
        chain += str[i];
        i += 1;
      }
      if (reserved.test(chain)) {
        invalid();
      }
      if (str[i] === '{') {
        // find the matching brace
        let depth = 1;
        let j = i + 1;
        while (depth > 0 && j < str.length) {
          if (str[j] === '{') {
            depth += 1;
          } else if (str[j] === '}') {
            depth -= 1;
          }
          j += 1;
        }
        if (depth !== 0 || (j < str.length && str[j] !== ',')) {
          invalid();
        }
        unpackKeys(str.slice(i + 1, j - 1), chain + suff, out);
        i = j;
      } else {
        out.push(chain + suff);
      }
      i += 1; // step over the comma
    } while (i <= str.length)
    return out
  };

  const unpackSection = function (str = '') {
    const obj = Object.create(null);
    if (!str) {
      return { ...obj }
    }
    str.split('|').forEach(group => {
      const i = group.indexOf(':');
      const val = group.slice(0, i);
      const count = val.match(/^[0-9]+/);
      if (i < 0 || !count || reserved.test(val.slice(count[0].length))) {
        invalid();
      }
      unpackKeys(group.slice(i + 1)).forEach(k => {
        if (Number(count[0]) > k.length) {
          invalid();
        }
        obj[k] = decodeVal(k, val);
      });
    });
    return { ...obj }
  };

  // one string → model
  const uncompress = function (str = '') {
    if (typeof str !== 'string' || str[0] === '{') {
      throw new Error('suffix-thumb: uncompress expects a packed string. Models made before v6 must be learned again.')
    }
    const parts = str.split('~');
    // Preserve the empty/default input shorthand for an empty model.
    if (str !== '' && parts.length !== sections.length) {
      invalid();
    }
    const model = {};
    sections.forEach((s, i) => {
      model[s] = unpackSection(parts[i]);
    });
    return model
  };

  // generated in ./lib/models
  var model$1 = {
    "nouns": {
      "plural": "1:io,dillio|1i:o{i{l{gorgog,l,o{t,g,hi,m},b},frusc,voc,mor,dd,vv,nv,ich,roz,onz,bin,inn,tt,it,us},nac,llic,roc},e,a{t{as,ba,e,au,i{m,l,f,oc}},m,ramm,cid,al,metr,ap,ib}|1hi:o{ic{et,ar,tr,br,l,z,c},olog{pr,ap,on}},uca,arca|1e:a{tervist,onet,iet,m{tra,am,som,i,or,ir,l}}|1he:arca{b,m}|0i:l~1i:o{,arag,fag,olog,c{ia,ma,da,i,oli,por,vo,gre},duom},a{t{is,ys,eu,po,io,lo},lg,iatr,lim,zim},egame|9icrociati:ocrociato|1ini:uomo|5iviri:oviro|1oi:bue|1hi:co,go,ega,sfuga|6ifondi:sofondo|2ei:midio|0:s,foto,n,t,à,ù,k|0s:e{air,war,scor,mm,harm,gam,ag,eg,yt,rin,peon,ch,ill},o{onad,mmand,ecid,rri,rati,pesin,iner,menc,h,ebl},u|1ies:y|6ibanda:obanda|6icosca:ocosca|9ifamiglia:ofamiglia|1a:o{ccigli,ginocchi,labbr,uov}|10ipattuglia:opattuglia|6imafia:omafia|7iscuola:oscuola|8isquadra:osquadra|10istruttura:ostruttura|6idanza:odanza|1e:a|9icorrente:ocorrente|12idelegazione:odelegazione|9istazione:apostazione|1he:ca,ga|2e:cia,ggia|10igabinetto:ogabinetto|8ireparto:oreparto|7ipopolo:opopolo|9iservizio:oservizio|8iufficio:oufficio|6fondo:iofondo|7igruppo:ogruppo|5iclan:oclan~1e:i{t{a{ab,pl,cr,fr,ntr,en,agn,venn,im,v},n{,serve,ipia,ica,rca,isco},pre,pare,i{nol,il,or,av,ip,sp,im},or{f,m,c},les,rtes,lat,rdo,ipo},l{so,au,su,iu,i,obi,uci,mie,a,oca},n{i{pett,tend,rd,tud,lic,poll,rg,ag,ig,im,ulm,f},o,muo,quo,e{g,tig,il,b,z,h,p},en{ei,v,u,e,n},oma,ceca,ova,car},gregg,dog,iug,c{a,lu,i{sp,cam,ef,ast,rt,ar,rn,l,d,b},es,no},s{ales,eres,clas,en{u,nons,n,m},e,ba,fa,ra},r{o,nco,a{f,t{l,on,lamen,li},e,nvers,uss,ci,upan,min,mp,ol},e{t{rat,e,lis,o,ra,n},i{,er,rr,or,ss},dav,dov,lv,s,n,vol,sap,c,d,ar},vent,mest,ot,tor,emb,ebb,tob,rti,pad,mad,ig},m{c,ci,gi,no,prono,ddo,u,lar,dar,er,a,ie,se},ro,bo,uragh,d{oi,oli,hi,po,ea,e},ccub,pub,v{a{tr,l,n,i},ne},volp,ep,nqu}|1a:i{t{croba,e{tl,g,sc,an,st,of,o},i{ol,ael,voc,erem,of},as{e,er,i,n},nau},eometr,m{s{i{r{fo,ca,c,p},acl,sof},a{l,mi,t,r}},o{,in,en,lan,uc},au,der,per,a{g,gi,or,cl},m,e,g},sticid,rib,pap}|1o:i{t{eurocra,n{e{m,cc,arg,v,rt,gu,al},a{pi,hi,c,s,u,v},o{c,fr,nf,am},u,i},coli,nfor,quis,cris},l{sso,popo,i{b,as,f,h},a{c,sci,uf,mb,ded,and,eg,et,qu}},n{i{rd{ia,co,io},pulm,lf},o{band,ond,erd,u,arit,mit,ig,atr,diac,of,af,ef},ige,oge,ccen,sen},z{z,an,on,l,r,for},c{ona,i{bonif,aff,port,ill,ed},rro},pes,r{o{cast,ist,es,sim,mod,lav,lu,c,irig,an,corp,f},a{c,pic,gu,gent,gat,tt,ors,b,gi,li,den,an,in,am,ur,p,ll,scol,g},e{mit,i{dott,sent,rest,rigl,ival,r,man,nocch,canz,nad,ud,s},on,oc,fod,ad},alib,memb,up},m{o{on,dr,nt,d,p,g},su,fu,her,a{ls,hi,ic,ot,ecl,tal},ilogram},zo,d{aci,ossi,rre,ge},strof,ticip,oroscop,cqu}|0o:i{l{g,o{gocci,tr,gas,op},idil,si,ci,ime,ite,pa},n{i{rut,atic,oc,sass,dom,rm},o{rcant,ut,ndem,rim,cim},ce,en,uinquen,ema,cra,era,tu},g,crolog,z,orz,c{,ba,i{ausp,f,enef,lef,fr,pin,il}},s{ar,nna,co,mpo},r{o{t{a{mbul,urg,sserv,iamm,crem},lut,fet,sul,i{aud,orm,rr,b},per,on},rens,us,og,mp},a{,ec,ic,anc,cett,ab,emin,cchin,sip,roll,stol,bol},e{t{ul,bat,i,ns,eu},tif,rop,tup,id},pat,ugu,rcu,ib,ub,ob,li,p,ond},com,parm,prem,o,h{c{c{nna,tera,ura,oci,ni,spi,o{mal,cr,tr,n,tt,p,d,ab},e,mu,isu},s{te,fi,vi,ra,mu},er,or,gran},ing},a,d{sor,mor,ci,si,ti,pen,cen,iso,ma,ta,sse,me,te,lu,pu,tu},b{ub,ver,bur,cam,nu},v{hi,bi,ra,u},f{ro,taf,raf,of},p{ci,rtici,co,sem,cap,dop,cop,su},qu}|2o:hi{c{c{gno,be,ne,ose},ter},ieg}|2a:chi{ar{r,n,g,i},du}~1i:e{t{abe,re,con,fron,os,tes,not,esta,li},apic,voc,croc,ass,cos,aver,oner,mar,n{ca,pa,re,temi,termi,turbi},ll{co,scia,pe},ap,legg,nub},o{r{o{,all,cl,p,t},ce,fa,ussa,lib},m{to,ato,gno,gram,gru,ra,re},i{br,tr,legg,pend,z},n{cen,o{col,d,t,tr}},chirurg,mant,senat,scop,verb},a{m{co,scis,sis,ar},al}|1:io{ast,pat,atr,avor,laborator,ces,ch{oc,coc,mar,ris,mas},con,torn,od{,i,p,s},mic,ol,orolog}|2ei:dio|1hi:fico,orco|0:retro|1e:a{st{a,vi,rivi,li},gemm}|1a:dito,paio|1he:lega|0i:alcol"
    },
    "adjectives": {
      "fs": "0:a~0:e|3rice:tore|1e:stio|1a:o~0:trice{gola,gi},a{t{lma,i{ron,nn,am,em,pol,ocl},is,tivis,be,ro,io},raere,icid}|1o:ista{v,mm}~",
      "mp": "1i:e,a|1:io~1i:o{,i{ator{rp,br},st}}|1hi:o{c{n,s,c,io,po,r},g}~1e:i{t{n{a,e,grue,eu,fro},nica,spi,ecipi,for,ner,s{ele,visioni,tri,menti},ebe},l{i,a,evo,iso,mbel,e},v{cli,val,gra,oa,re,ie},rm,anim,um,c{i{fel,pl,gitr,latr},l,a,o},r{o{t{a{tr,br,ns,sol,ll,rl,limin,nn,t,li,zi,ic,lizz,rrog,eg},t,e,rri,ni,rti},i,ls,m,l},lac,le,ene,a{ment,cent,salut,l,n{n,i,la,u},li,ne,cle,b},t,ri,eb,ub},s{e{,apr,ort,ut},en{r,c,it,am,u}},n{loma,giova,rgi,cli,iovi,o{if,ss,tt,b,i,c,m,l,tr},en,be,mu},d{poli,oi,ca,cor,er,gran},edu,ngu,tenu,iop,ip,i}|1o:i{t{n{a{fr,rett,ros,qu,ramp},e{l{ci,u,udo,no,io},red,tov,att,nt,ru,sp}},omi,vis,mmis},l{fi,muti,efa,oma,evo{ben,mal}},m{fer,ani{g,gn}},iac,voc,r{a{mann,rin,hi,av,o},ast},es{c,p,pr,bl,ill,o,t,f},zz,onz,lz}|1a:i{t{lma,i{ron,nn,m,pol,ocl},is,tivis,be,ro,io},raere,icid}|0o:i{gl,prev,uv,tem,c{ontifi,fradi,sudi,n,c,s},r{o{t{,a{t{l,na,t,o},tific},it},s},ete,se,a{,ment{m,ta},rtol,in{ul,ur,d}},at,op,spu},bb,igen,recch,erch,z,ed,nf,mp,g,a,o}~1i:e{acr,migrator,milionar,inferm,mit,nolent},o{tant{,co},ital,mal,les,orator,roc}|1:io{esim,ion,vanes}",
      "fp": "0:tie~1i:e|1e:a|1he:ca,ga|2e:cia~0:stie~"
    },
    "presentTense": {
      "first": "2sco:re,asalire|3o:re{e,rne,i{ert,orr,opr,fr,egu,ngu,orm,v}}|4sso:otere|4io:arere|3cio:acere|3io:ocere|3go:nere|5ngo:gnere|5o:apere|4glio:olere|2co:dire{pre,ne,in}|2o:ucire|6esco:uscire|3co:rre|4o:ersi~3o:re{a,i{boll,t{iat,ves,sen,pen,ipar},utr,apr,fugg,ssorb}}|2co:dire{d,le,ter,s}|5uco:anicare|4io:parire|2ccio:fare{praf,ri}|3cio:nuocere|2o:mpire|7etto:etrasmettere|6lgo:gliere|3go:re{ale,sali,veni}|3ngo:orre|3ggo:arre|5ò:avere|3ò:ttostare~1ere:o{c{nedi,tor,s{cre,me,na,pa,no},idu,vin},ompi,cern,ll{to,e{esp,op,ep,ecc}},tess,t{t{ba,fle,nne,me,fo},sis,mie,pe,cu},corr,d{n{o{ff,nf,asf,sc,p},e,ci,pa,u},a,e{c,cr,i,l,v},o{rr,er,g,pl},mor,iar,er,i{r,ass,c,ll,el,v},lu,iu,ru},tingu,nqu,g{vol,ful,dul,n,r,g,i{ir,er,l,s,d}},romp,m{ri,edi,su,fre,pre,ge},comb,v{cri,vi,pravvi,e,pio,uo,ol,fer}}|3re:isco|1are:o{nfisc,caduc,anduc,hiacci,esent,goffr,d{n{affo,facce,be,me},a{gr,tr,b,gu},gri,ici,uci},g{ul,n{a{pr,f,st,v},lu,rri,si},lar,pur,gor,bli},crim,nsum,iesum,vviv,lev}|4uscire:iesco|2rre:duco|4lere:soglio|3ere:iaccio|2ere:uocio,engo,mango|1re:cucio|3tere:posso|1apere:riso|1ire:o{vert,aborr,copr,ffr,segu,langu,dorm}|3gnere:pengo~3o:re{e{alg,ard,profond,cher,chier,duc,lic,tem,vert},bolla,educa,verga,menti,parti,servi}|5ho:avere|2vo:bere|2co:dire{,ri}|5uoio:morire|4io:parere{,s}|3ò:are{rid,rist}|5o:sapere|2sco:sparire|5odo:udire|6esco:uscire|4glio:volere|6sono:essere|6vado:andare|2ccio:fare|3cio:tacere",
      "second": "2sci:re,asalire|3:re{ia{,iv,av},ie}|3i:re{ia{v,sp,es},e,ar}|4i:ere{av,ap},ersi|2:ire{sal,ert,r{or,pa,op,f},uc,egu,ngu,mp,orm,v}|2ci:nedire|3ci:rre|3ni:orre~3i:are{,llung}|3hi:are{c,g}|5uchi:anicare|5ieni:enere,venire|2:ire{boll,t{iat,ves,sen,pen,ipar},utr,apr,ssorb,fugg}|5uoli:olere|2i:are{ttost,rif,praff}|7etti:etrasmettere|6esci:uscire|2ci:dire{d,le,pre,in,ter,s}|3:viare{re,ov,rin}|5uoi:ere{ot,vol}~0are:i{h{c{c{ba,uta,cia,o{arab,d,cr,n},i{rm,v,t,os,d,n},mu,iu,su,e{r,nz,v,sp,n}},r{cce,pe,ve,mo},is,ras,fon},ving},n{co,timo,bor,un,ila,sma,tra},l{g,i{um,nc,s,ab},ma,amp,ob},a,f{naf,graf,of,gon},ars,nist,ngust,c{,stris,ves,fidu,ba},r{ingiu,nfu,pat,glo,neb,rop,ip,va,ra,nta},d{tipen,rra,se,me,te,aro,si,nvi,pu,tu},z{n{ta,na,e,u},i,vor,o,a},rchiv,trav,equ,oqu,bu,p{p{ala,co,do,se},inci,co,or},parm,emm,com,bb,amb,g{,for,veleg,can,man,en,i{b,al,f,p}},o,cuo}|2are:nfischi|2rre:poni,duci|1are:i{n{cappo,apo,lie,ema},ruol,esent,goffr,d{n{affo,facce,be,me},a{gr,tr,b,gu},re,ge,he,i{gr,oss,ic,uc}},enz{ad,u},lev,vviv,scop,crim,nsum,iesum,obb,lebb}|1ere:i{spegn,cern,man,l{l{to,e{esp,op,ep,ecc}},va},tess,t{t{ba,fle,nne,me,fo},sis,mie,pe,cu},c{s{na,pa,re,me,no},idu,vin,tor,edi,li,uo,a},corr,d{n{o{ff,nf,asf,sc,p},e,ci,pa,u},a,e,cre,o{rr,er,g,pl},mor,iar,er,i{r,ass,c,ll,el,v},lu,iu,ru},v{e,cri,vi,pravvi,pio,uo,ol,fer},tingu,nqu,romp,m{ri,edi,su,fre,pre,ge},comb,g{r,g{i,e{el,il,orr,ot},u},n,l,i}}|0ere:i{gl{co,io,to,ce},comp}|0re:i{sal{s,i},vert,cuc,r{abor,cop,pa{iap,scom,s},ff},segu,langu,emp,dorm}|1rre:trai|1pere:sai|1vere:iai|3re:isci~3i:re{e{ard,profond,cher,chier,duc{,e},egg{l,r},tem,vert},a{boll,sigl,gabb,ronc,sci,sed,spar}}|5hai:avere|2vi:bere|3:iare{car,isc{l,p},macch,ol,pazz}|2i:are{d,rid,st,rist,f}|2ci:dire{,ri}|2:ire{ment,part,serv}|5uori:morire|2sci:sparire|5odi:udire|6sei:essere|6vai:andare",
      "third": "2:re|4:apere|2sce:asalire|2ce:nedire|2e:mpire|3e:vire|3ce:rre|3:rsi~5uca:anicare|3e:re{i{t{iat,sen,pen,ves,er,ipar},uc,r{or,pa,ap,op,f,ut},fugg,sal,boll,orm,egu,ngu,ssorb},ar}|7ette:etrasmettere|2sce:ire|6esce:uscire|2ce:dire{d,le,pre,in,ter,s}|5iene:enere,venire|3ne:orre|5uole:olere|5à:avere|3à:are{ttost,rif,praff}|5uò:otere~0re:a,e{,resc,mesc,iduc,corr,ingu}|0pere:risa|2rre:duce|1re:empie|1ire:serve~5ha:avere|2ve:bere|3à:are{d,rid,rist}|2ce:dire{,ri}|2:ere{duc{,e},par{,s},vert}|3e:tire{men,par}|5uore:morire|4:sapere|2sce:sparire|5ode:udire|6è:essere|6va:andare",
      "firstPlural": "2amo:re|2mo:iare|3iamo:ere,arre|4ssiamo:otere|3amo:iere|3ciamo:acere,rre|4bbiamo:avere|3piamo:apere|4gliamo:olere|2ciamo:nedire|3niamo:orre|4iamo:ersi~3iamo:are{,llung}|3hiamo:are{c,g}|7ettiamo:etrasmettere|2cciamo:fare{praf,ri}|2ciamo:dire{d,le,pre,in,ter,s}|6ociamo:nuocere~2re:iamo{h{c{c{ba,uta,cia,o{arab,d,cr,n},i{rm,v,t,os,d,n},mu,iu,su,e{r,nz,v,sp,n}},r{cce,pe,ve,mo},is,ras,fon},ving},n{timo,co,ila,sma,tra,bor,un},l{g,i{um,nc,s,rab},ma,amp,ob},a,f{naf,graf,of,gon},ars,des,nist,ngust,r{ingiu,nfu,pat,glo,neb,rop,ip,va,ra,nta},c{,hiac,fidu,ves},d{tipen,rra,se,me,te,aro,pu,tu,ussi,nsi,nvi},z{n{ta,na,e,u},i,vor,o,a},v{re,de,rchi,tra,v,or,n,s},bbu,oloqu,equ,p{p{ala,co,do,se},inci,or,co},parm,emm,com,bb,camb,g{for,g,veleg,can,man,en,ta,la,i{b,al,f,p},e,o,u},o}|3re:iamo{ch{nfiac,ric,tec,mprati,gran},n{i{ef,if,sf,gg,fr},rabbo,ncoglio,mmo,nsig,rug,u{r,em,ri,p},ca,va,ve,ifor,her,uar},l{gog,l{gia,bbe,sne,eppe,mmo,bo},o{dd,rust,ab,eb,iev,dem,icci},au,ripu,i{h,v,ab,gent},a{ss,is,as,i},pp},mmuff,lf,s{ppas,tos,pes,ui,cen,man,o{ncuri,zi,et,l,v}},t{t{mma,ia,nfi,zi,spe{di,nso},mbo,hio,mbru},u{br,t,gl,an},r{bo,sso,ve,pa},s{mba,ntri,bu,lle,ge,ve},n{e{s,sm,spazi,p},to,sa,ga,ra},rre,pa,fol,el},r{e{pov,iv,coll,ad,ep,esp,pp,g,nn,cen,ten,ss,ns,si,f},r{abo,ga,za,ma},catu,sau,pau,polt,iet,ut,o{nsap,tim,fav,rt,ifi,ig},cop,ap,sp,a{iapp,scomp,sp,u},ff,pig,ag},c{cu,ius,san,ser,far,sar,ol,ero},d{n{pprofo,io,la,ca,ra},ba,ia,gre,be,pe,to,r{eso,alo,to,ve},u{c,pla,sa,er},i{morb,bb,norr,utr,ar,ac,all,riv,t,iep,rp,ip,m,g}},z{iz{st,tir,vv},rin},u{t{ti,pat,sta,in},seg,rg,lang,l,nn,min,b,rc,r,oq},p{em,ce,ar,ncu,tu,so},herm,dorm,grem,b{ngob,am,sor,i,su},ugg,ag,ve,io}|5are:nfischiamo|5rre:iamo{pon,duc}|4are:iamo{n{cappo,apo,ema,sve,ate},ppart,esent,ager,gifer,goffr,d{n{affo,facce,be,me},gra,tra,gua,re,ge,he,gri,ici,uci},enz{ad,u},lev,vviv,scop,crim,nsum,iesum,b{ob,leb,ci,li}}|4ere:iamo{n{speg,ma,te,cer},l{l{e{esp,op,ep,ecc},to},va},tess,t{t{ba,fle,nne,me,fo},cu,sis,mie,pe},corr,c{idu,s{na,pa,e,no},vin,tor,edi,li,uo},d{n{o{ff,nf,asf,sc,p},e,ci,pa,u},a,e,cre,o{rr,er,g,pl},mor,iar,er,lu,iu,ru,i{r,ass,c,ll,el,v}},v{e,cri,vi,pravvi,pio,uo,ol,fer},tingu,nqu,romp,m{ri,edi,su,fre,pre,ge},comb,g{,g{i,e{el,il,orr,ot},tru}}}|3ere:iamo{gl{co,io,to,ce},comp}|6lere:sogliamo|4rre:traiamo|6tere:possiamo|5ere:iamo{iacc,sapp}|6vere:iabbiamo~2amo:ire{d{a,tra,ban,con,or,u},cap,rap,colp,r{chia{,s},fio,mo,pe},n{fi,for,le,u,mu},imbell,pul,ment,sort,serv,usc}|2mo:iare{ag,amb,car,sp,esp,macch,ol,pazz,od}|3iamo:re{e{ard,profond,cher,chier,duc{,e},egg{l,r},tem,vert},a{bad,rid,sed,boll,sigl,gabb,ronc,spar,ven}}|4bbiamo:avere|2viamo:bere|2ciamo:dire{,ri}|4iamo:parere|4gliamo:volere|6siamo:essere|2cciamo:fare|3ciamo:tacere",
      "secondPlural": "3te:piere,rsi|3cete:rre~2te:re|7ettete:etrasmettere|6ocete:nuocere|3nete:orre|3ete:arre~4rre:ucete|2re:iducete|2ere:ompite~2vete:bere|2te:ducere{,e}|6siete:essere",
      "thirdPlural": "4iono:arere|3gono:nere|3ono:re{rne,orri,ngui,vi}|5ngono:gnere|4nno:avere|2scono:asalire|2cono:nedire|2ono:mpire|3cono:rre|4ono:ersi~2no:re|5ucano:anicare|3ono:re{e,i{t{iat,sen,pen,ves,er,ipar},r{ap,op,f,ut},fugg,orm,boll,egu,ssorb}}|7ettono:etrasmettere|2scono:ire|6escono:uscire|2cono:dire{d,le,pre,in,ter,s}|6lgono:gliere|3gono:re{ale,sali,veni}|3ngono:orre|3ggono:arre|4iono:parire|2ono:ucire|3ciono:cere{a,nuo}|3iono:ocere|4gliono:olere|4ssono:otere|4nno:apere|2nno:are{ttost,rif,praff}~3ere:ono{resc,mesc,iduc,volg,ulg}|4rre:ucono|3ire:ono{borr,serv,angu}|4ere:ngono{e,ma}|5gnere:pengono|3re:empiono|3vere:ianno~3ono:re{e{alg,duc{,e},vert},menti,parti}|5hanno:avere|2vono:bere|2nno:are{d,rid,st,rist,f}|2cono:dire{,ri}|5uoiono:morire|4iono:parere{,s}|2scono:sparire|5odono:udire|6sono:essere|6vanno:andare"
    },
    "pastTense": {
      "first": "2i:re{rraffa,e{lend,sied,god,sig,onnett,iscern,sol}}|3ssi:rre|3si:orre,lere|5si:ere{nd,gu}|4si:ere{and,r,c,g,an,lv,ll}|5ssi:ere{ind,ett}|3i:iere|3vi:arere|5cqui:ascere|4ssi:ere{uc,ut,iv}|5essi:igere|5nsi:gnere|2tti:devolvere|5ebbi:avere|4nsi:umere|7isi:ettersi~2i:re|4si:dere{,ie,le}|5ssi:ggere|2ssi:dire{d,in,ter,pre}|5assi:digere|5essi:primere|4ssi:cedere{on,tro,uc}|6lsi:gliere|6ulsi:pellere|5ensi:dimere|6usi:fondere|6isi:mettere|7isi:etrasmettere|5bbi:scere|3ni:nere,venire|3vi:parire,bevere|3eci:fare{e,raf,s,ri,tra}|3di:cadere|5idi:vedere|3qui:acere|6ocqui:uocere|6uppi:ompere|5eppi:apere|3etti:tostare|2tti:ere{iet,d{e,open,ven,pru,stri},rn,v,em,ncomb,mesc,pasc,nsig}|3li:volere~1ere:ompii|3rre:ssi{du,a}|3cere:idussi|3tere:cussi|3vere:issi{cr,v}|3ndere:cissi|4igere:essi{ir,er,dil,gl}|3ttere:essi{fl,n}|2nere:masi|2ndere:si{e,tu,rispo,co}|2rere:hesi,corsi|2vere:olsi{s,ev}|2gere:si{vol,ul,r,par,n}|2lere:lsi{esto,ve,cce}|2ere:lsi{do,a}|2cere:si{mol,tor,vin}|2dere:si{mor,isper,ar,pan}|3mere:sunsi|2guere:stinsi|3gnere:ensi|2rre:posi|4scere:nacqui~5ebbi:avere|2ssi:dire{,ri}|4ssi:ducere{,e}|3eci:fare|3etti:stare{,ri}|4si:ere{scorg,sting,perd}|2i:re{de{span,pen,se,posse},spari}|2vvi:bere|3iedi:dare{,ri}|2tti:fendere|3vi:parere|6fui:essere",
      "second": "2sti:are{rraff,grid}|3esti:ridare|3cesti:rre|3sti:piere,rsi~2sti:re|2cesti:re{di{d,in,ter,pre},fa{e,raf,s,ri,tra}}|7ettesti:etrasmettere|3esti:tostare,arre|3nesti:orre~3ere:ompisti|5rre:ucesti|3re:iducesti~2cesti:re{di,ridi,fa}|2sti:ducere{,e}|3esti:are{st,rist,d}|2vesti:bere|6fosti:essere",
      "third": "3ò:rraffare|3sse:rre|3se:orre|5se:ere{nd,gu}|2tte:ere{d{open,ven,pru,stri,e},mesc,pasc,nsig,iet,devolv}|4se:ere{and,r,c,g,an,lv,ll}|5sse:ere{ind,ett}|4ì:iere|3ve:arere|5cque:ascere|4sse:ere{uc,ut,iv}|5esse:ere{ig,im}|3é:onnettere|5nse:gnere|5ebbe:avere|4nse:umere|7ise:ettersi~3ò:are|3ì:ire|4se:dere{,ie,le}|5sse:ggere|2sse:dire{d,in,ter,pre}|5asse:digere|4sse:cedere{on,tro,uc}|6lse:gliere|3se:lere{do,a}|6ulse:pellere|5ense:dimere|6use:fondere|6ise:mettere|7ise:etrasmettere|5bbe:scere|3ne:enere,venire|3ve:parire,bevere|3ece:fare{e,raf,s,ri,tra}|3de:cadere|5ide:vedere|3que:acere|6ocque:uocere|6uppe:ompere|5eppe:apere|2tte:re|3ette:tostare|3le:volere|3é:ere{lend,god,sied,t,irim,iscern,sig,ccomb,s}~1iere:ompì|3rre:sse{du,a}|3cere:idusse|3tere:cusse|3vere:isse{cr,v}|3ndere:cisse|4imere:presse|4igere:esse{ir,er,dil,gl}|3ttere:esse{fl,n}|2nere:mase|2ndere:se{e,tu,rispo,co}|2rere:hese,corse|2vere:olse{s,ev}|2gere:se{vol,ul,r,par,n}|2lere:lse{esto,ve,cce}|2cere:se{mol,tor,vin}|2dere:se{mor,isper,ar,pan}|3mere:sunse|2guere:stinse|3gnere:ense|2rre:pose|4scere:nacque~5ebbe:avere|2sse:dire{,ri}|4sse:ducere{,e}|3ece:fare|3ette:stare{,ri}|4se:ere{scorg,sting,perd}|3é:dere{span,pen,se,posse}|3ì:sparire|2vve:bere|3iede:dare{,ri}|2tte:fendere|3ve:parere|6fu:essere",
      "firstPlural": "2mmo:are{rraff,grid}|3emmo:ridare|3cemmo:rre|3mmo:piere,rsi~2mmo:re|2cemmo:re{di{d,in,ter,pre},fa{e,raf,s,ri,tra}}|7ettemmo:etrasmettere|3emmo:tostare,arre|3nemmo:orre~3ere:ompimmo|5rre:ucemmo|3re:iducemmo~2cemmo:re{di,ridi,fa}|2mmo:ducere{,e}|3emmo:are{st,rist,d}|2vemmo:bere|6fummo:essere",
      "secondPlural": "2ste:are{rraff,grid}|3este:ridare|3ceste:rre|3ste:piere,rsi~2ste:re|2ceste:re{di{d,in,ter,pre},fa{e,raf,s,ri,tra}}|7etteste:etrasmettere|3este:tostare,arre|3neste:orre~3ere:ompiste|5rre:uceste|3re:iduceste~2ceste:re{di,ridi,fa}|2ste:ducere{,e}|3este:are{st,rist,d}|2veste:bere|6foste:essere",
      "thirdPlural": "1ono:re{rraffa,e{lend,sied,god,sig,onnett,iscern,sol}}|3ssero:rre|3sero:orre,lere|5sero:ere{nd,gu}|4sero:ere{and,r,c,g,an,lv,ll}|5ssero:ere{ind,ett}|3rono:iere|3vero:arere|5cquero:ascere|4ssero:ere{uc,ut,iv}|5essero:igere|5nsero:gnere|2ttero:devolvere|5ebbero:avere|4nsero:umere|7isero:ettersi~1ono:e|4sero:dere{,ie,le}|5ssero:ggere|2ssero:dire{d,in,ter,pre}|5assero:digere|5essero:primere|4ssero:cedere{on,tro,uc}|6lsero:gliere|6ulsero:pellere|5ensero:dimere|6usero:fondere|6isero:mettere|7isero:etrasmettere|5bbero:scere|3nero:nere,venire|3vero:parire,bevere|3ecero:fare{e,raf,s,ri,tra}|3dero:cadere|5idero:vedere|3quero:acere|6ocquero:uocere|6uppero:ompere|5eppero:apere|3ettero:tostare|2ttero:ere{iet,d{e,open,ven,pru,stri},rn,v,em,ncomb,mesc,pasc,nsig}|3lero:volere~4ere:o{ompiron,lser{do,a}}|5rre:ssero{du,a}|5cere:idussero|5tere:cussero|5vere:issero{cr,v}|5ndere:cissero|6igere:essero{ir,er,dil,gl}|5ttere:essero{fl,n}|4nere:masero|4ndere:sero{e,tu,rispo,co}|4rere:sero{he,cor}|4vere:olsero{s,ev}|4gere:sero{vol,ul,r,par,n}|4lere:lsero{esto,ve,cce}|4cere:sero{mol,tor,vin}|4dere:sero{mor,isper,ar,pan}|5mere:sunsero|4guere:stinsero|5gnere:ensero|4rre:posero|6scere:nacquero~5ebbero:avere|2ssero:dire{,ri}|4ssero:ducere{,e}|3ecero:fare|3ettero:stare{,ri}|4sero:ere{scorg,sting,perd}|1ono:re{spari,de{pen,se,posse}}|2vvero:bere|3iedero:dare{,ri}|2ttero:fendere|3vero:parere|6furono:essere"
    },
    "futureTense": {
      "first": "1ò:re{a{f{raf{t,p},e,tra,s,ri},tost},lle}|3rò:ere{pi,ar}|4rrò:ere{uc,an}|2ò:si~1ò:e,scadere|3erò:are{,llung}|3herò:are{c,g}|7etterò:etrasmettere|4erò:iare{c,g}|4rrò:re{le,ene,veni}|3rò:ere{cad,god,av,viv,ov,ot,ap}~1e:rò{e{gli{co,io,to,ce},spegn,cern,ll{to,e{esp,op,ep,div,sv,ecc}},tess,t{t{ba,fle,nne,me,fo},sis,ver,mie,pe,cu},corr,c{s{na,pa,re,me,no},vin,tor,ia,ta,edi,li,ol},d{n{o{f{if,ef,n,as},sc,p},e,ci,pa,u},bra,sua,va,e{c,cr,i,l},rro,ero,mor,iar,er,i{r,ass,nc,ec,cc,ll,el,v},lu,iu,ru},tingu,nqu,omp,m{pri,iri,edi,su,fre,pre,ge},comb,g{r,g{i,e{iel,il,orr,ot},u},n,l,ro,i{il,gl,r,s,d}},v{cri,be,ce,ol,fer}},ur,por,rar}|3are:erò{d{en{facc,b,m},gri},sum{n,ie}}|3iare:gerò{for,can,man,en}|2ere:ompirò,parrò|3cere:idurrò|3nere:marrò~3rò:andare|1ò:re{e{ard,profond,rad,cher,chier,egg{l,el,r},tem},a{d,rid,f,st,rist}}|4rrò:ducere{,e}|3erò:are{ronc,sci}|6sarò:essere",
      "second": "1ai:re{a{f{raf{t,p},e,tra,s,ri},tost},lle}|3rai:ere{pi,ar}|4rrai:ere{uc,an}|2ai:si~1ai:e,scadere|3erai:are{,llung}|3herai:are{c,g}|7etterai:etrasmettere|4erai:iare{c,g}|4rrai:re{le,ene,veni}|8driurrai:riducere|3rai:ere{cad,god,av,viv,ov,ot,ap}~2e:rai{e{gli{co,io,to,ce},spegn,cern,ll{to,e{esp,op,ep,div,sv,ecc}},tess,t{t{ba,fle,nne,me,fo},sis,ver,mie,pe,cu},corr,c{s{na,pa,re,me,no},vin,tor,ia,ta,edi,li,ol},d{n{o{f{if,ef,n,as},sc,p},e,ci,pa,u},bra,sua,va,e{c,cr,i,l},rro,ero,mor,iar,er,i{r,ass,nc,ec,cc,ll,el,v},lu,iu,ru},tingu,nqu,omp,m{pri,iri,edi,su,fre,pre,ge},comb,g{r,g{i,e{iel,il,orr,ot},u},n,l,ro,i{il,gl,r,s,d}},v{cri,be,ce,ol,fer}},ur,por,rar}|4are:erai{d{en{facc,b,m},gri},sum{n,ie}}|4iare:gerai{for,can,man,en}|3ere:rai{ompi,par}|4nere:marrai~3rai:andare|1ai:re{e{ard,profond,rad,cher,chier,egg{l,el,r},tem},a{d,rid,f,st,rist}}|4rrai:ducere{,e}|3erai:are{ronc,sci}|6sarai:essere",
      "third": "1à:re{a{f{raf{t,p},e,tra,s,ri},tost},lle}|3rà:ere{pi,ar}|4rrà:ere{uc,an}|2à:si~1à:e,scadere|3erà:are{,llung}|3herà:are{c,g}|7etterà:etrasmettere|4erà:iare{c,g}|4rrà:re{le,ene,veni}|3rà:ere{cad,god,av,viv,ov,ot,ap}~1e:rà{e{gli{co,io,to,ce},spegn,cern,ll{to,e{esp,op,ep,div,sv,ecc}},tess,t{t{ba,fle,nne,me,fo},sis,ver,mie,pe,cu},corr,c{s{na,pa,re,me,no},vin,tor,ia,ta,edi,li,ol},d{n{o{f{if,ef,n,as},sc,p},e,ci,pa,u},bra,sua,va,e{c,cr,i,l},rro,ero,mor,iar,er,i{r,ass,nc,ec,cc,ll,el,v},lu,iu,ru},tingu,nqu,omp,m{pri,iri,edi,su,fre,pre,ge},comb,g{r,g{i,e{iel,il,orr,ot},u},n,l,ro,i{il,gl,r,s,d}},v{cri,be,ce,ol,fer}},ur,por,rar}|3are:erà{d{en{facc,b,m},gri},sum{n,ie}}|3iare:gerà{for,can,man,en}|2ere:ompirà,parrà|3cere:idurrà|3nere:marrà~3rà:andare|1à:re{e{ard,profond,rad,cher,chier,egg{l,el,r},tem},a{d,rid,f,st,rist}}|4rrà:ducere{,e}|3erà:are{ronc,sci}|6sarà:essere",
      "firstPlural": "0mo:re{a{f{raf{t,p},e,tra,s,ri},tost},lle}|3remo:ere{pi,ar}|4rremo:ere{uc,an}|2emo:si~0mo:e,scadere|3eremo:are{,llung}|3heremo:are{c,g}|7etteremo:etrasmettere|4eremo:iare{c,g}|4rremo:re{le,ene,veni}|3remo:ere{cad,god,av,viv,ov,ot,ap}~2:remo{e{gli{co,io,to,ce},spegn,cern,ll{to,e{esp,op,ep,div,sv,ecc}},tess,t{t{ba,fle,nne,me,fo},sis,ver,mie,pe,cu},corr,c{s{na,pa,re,me,no},vin,tor,ia,ta,edi,li,ol},d{n{o{f{if,ef,n,as},sc,p},e,ci,pa,u},bra,sua,va,e{c,cr,i,l},rro,ero,mor,iar,er,i{r,ass,nc,ec,cc,ll,el,v},lu,iu,ru},tingu,nqu,omp,m{pri,iri,edi,su,fre,pre,ge},comb,g{r,g{i,e{iel,il,orr,ot},u},n,l,ro,i{il,gl,r,s,d}},v{cri,be,ce,ol,fer}},ur,por,rar}|5are:eremo{d{en{facc,b,m},gri},sum{n,ie}}|5iare:geremo{for,can,man,en}|4ere:remo{ompi,par}|5cere:idurremo|5nere:marremo~3remo:andare|0mo:re{e{ard,profond,rad,cher,chier,egg{l,el,r},tem},a{d,rid,f,st,rist}}|4rremo:ducere{,e}|3eremo:are{ronc,sci}|6saremo:essere",
      "secondPlural": "0te:re{a{f{raf{t,p},e,tra,s,ri},tost},lle}|3rete:ere{pi,ar}|4rrete:ere{uc,an}|2ete:si~0te:e,scadere|3erete:are{,llung}|3herete:are{c,g}|7etterete:etrasmettere|4erete:iare{c,g}|4rrete:re{le,ene,veni}|3rete:ere{cad,god,av,viv,ov,ot,ap}~2:rete{e{gli{co,io,to,ce},spegn,cern,ll{to,e{esp,op,ep,div,sv,ecc}},tess,t{t{ba,fle,nne,me,fo},sis,ver,mie,pe,cu},corr,c{s{na,pa,re,me,no},vin,tor,ia,ta,edi,li,ol},d{n{o{f{if,ef,n,as},sc,p},e,ci,pa,u},bra,sua,va,e{c,cr,i,l},rro,ero,mor,iar,er,i{r,ass,nc,ec,cc,ll,el,v},lu,iu,ru},tingu,nqu,omp,m{pri,iri,edi,su,fre,pre,ge},comb,g{r,g{i,e{iel,il,orr,ot},u},n,l,ro,i{il,gl,r,s,d}},v{cri,be,ce,ol,fer}},ur,por,rar}|5are:erete{d{en{facc,b,m},gri},sum{n,ie}}|5iare:gerete{for,can,man,en}|4ere:rete{ompi,par}|5cere:idurrete|5nere:marrete~3rete:andare|0te:re{e{ard,profond,rad,cher,chier,egg{l,el,r},tem},a{d,rid,f,st,rist}}|4rrete:ducere{,e}|3erete:are{ronc,sci}|6sarete:essere",
      "thirdPlural": "1anno:re{a{f{raf{t,p},e,tra,s,ri},tost},lle}|3ranno:ere{pi,ar}|4rranno:ere{uc,an}|2anno:si~1anno:e,scadere|3eranno:are{,llung}|3heranno:are{c,g}|7etteranno:etrasmettere|4eranno:iare{c,g}|4rranno:re{le,ene,veni}|3ranno:ere{cad,god,av,viv,ov,ot,ap}~4e:ranno{e{gli{co,io,to,ce},spegn,cern,ll{to,e{esp,op,ep,div,sv,ecc}},tess,t{t{ba,fle,nne,me,fo},sis,ver,mie,pe,cu},corr,c{s{na,pa,re,me,no},vin,tor,ia,ta,edi,li,ol},d{n{o{f{if,ef,n,as},sc,p},e,ci,pa,u},bra,sua,va,e{c,cr,i,l},rro,ero,mor,iar,er,i{r,ass,nc,ec,cc,ll,el,v},lu,iu,ru},tingu,nqu,omp,m{pri,iri,edi,su,fre,pre,ge},comb,g{r,g{i,e{iel,il,orr,ot},u},n,l,ro,i{il,gl,r,s,d}},v{cri,be,ce,ol,fer}},ur,por,rar}|6are:eranno{d{en{facc,b,m},gri},sum{n,ie}}|6iare:geranno{for,can,man,en}|5ere:ranno{ompi,par}|6cere:idurranno|6nere:marranno~3ranno:andare|1anno:re{e{ard,profond,rad,cher,chier,egg{l,el,r},tem},a{d,rid,f,st,rist}}|4rranno:ducere{,e}|3eranno:are{ronc,sci}|6saranno:essere"
    },
    "conditional": {
      "first": "0i:re{a{f{raf{t,p},e,tra,s,ri},tost},lle}|3rei:ere{pi,ar}|4rrei:ere{uc,an}|2ei:si~0i:e,scadere|3erei:are{,llung}|3herei:are{c,g}|7etterei:etrasmettere|4erei:iare{c,g}|4rrei:re{le,ene,veni}|3rei:ere{cad,god,ved,av,viv,ov,ot,ap}~1:rei{e{gli{co,io,to,ce},spegn,cern,ll{to,e{esp,op,ep,div,sv,ecc}},tess,t{t{ba,fle,nne,me,fo},sis,ver,mie,pe,cu},corr,c{s{na,pa,re,me,no},vin,tor,ia,ta,edi,li},d{n{o{f{if,ef,n,as},sc,p},e,ci,pa,u},bra,sua,va,e{c,cr,i,l},rro,ero,mor,iar,er,i{r,ass,nc,ec,cc,ll,el,v},lu,iu,ru},tingu,nqu,omp,m{pri,iri,edi,su,fre,pre,ge},comb,g{r,g{i,e{iel,il,orr,ot},u},n,l,i{il,gl,r,s,d}},v{cri,be,ce,ol,fer}},ur,por,rar}|4are:erei{d{en{facc,b,m},gri},sum{n,ie}}|4iare:gerei{for,can,man,en}|3ere:rei{ompi,par}|4cere:idurrei|4nere:marrei~3rei:andare|0i:re{e{ard,profond,rad,cher,chier,egg{l,el,r},tem},a{d,rid,f,st,rist}}|4rrei:ducere{,e}|3erei:are{ronc,sci}|6sarei:essere",
      "second": "0sti:re{a{f{raf{t,p},e,tra,s,ri},tost},lle}|3resti:ere{pi,ar}|4rresti:ere{uc,an}|2esti:si~0sti:e,scadere|3eresti:are{,llung}|3heresti:are{c,g}|7etteresti:etrasmettere|4eresti:iare{c,g}|4rresti:re{le,ene,veni}|3resti:ere{cad,god,ved,av,viv,ov,ot,ap}~3:resti{e{gli{co,io,to,ce},spegn,cern,ll{to,e{esp,op,ep,div,sv,ecc}},tess,t{t{ba,fle,nne,me,fo},sis,ver,mie,pe,cu},corr,c{s{na,pa,re,me,no},vin,tor,ia,ta,edi,li},d{n{o{f{if,ef,n,as},sc,p},e,ci,pa,u},bra,sua,va,e{c,cr,i,l},rro,ero,mor,iar,er,i{r,ass,nc,ec,cc,ll,el,v},lu,iu,ru},tingu,nqu,omp,m{pri,iri,edi,su,fre,pre,ge},comb,g{r,g{i,e{iel,il,orr,ot},u},n,l,i{il,gl,r,s,d}},v{cri,be,ce,ol,fer}},ur,por,rar}|6are:eresti{d{en{facc,b,m},gri},sum{n,ie}}|6iare:geresti{for,can,man,en}|5ere:resti{ompi,par}|6cere:idurresti|6nere:marresti~3resti:andare|0sti:re{e{ard,profond,rad,cher,chier,egg{l,el,r},tem},a{d,rid,f,st,rist}}|4rresti:ducere{,e}|3eresti:are{ronc,sci}|6saresti:essere",
      "third": "0bbe:re{a{f{raf{t,p},e,tra,s,ri},tost},vvive,lle}|3rebbe:ere{pi,ar}|4rrebbe:ere{uc,an}|2ebbe:si~0bbe:e,scadere|3erebbe:are{,llung}|3herebbe:are{c,g}|7etterebbe:etrasmettere|4erebbe:iare{c,g}|4rrebbe:re{le,ene,veni}|3rebbe:ere{cad,god,ved,av,viv,ov,ot,ap}~3:rebbe{e{gli{co,io,to,ce},spegn,cern,ll{to,e{esp,op,ep,div,sv,ecc}},tess,t{t{ba,fle,nne,me,fo},sis,ver,mie,pe,cu},corr,c{s{na,pa,re,me,no},vin,tor,ia,ta,edi,li},d{n{o{f{if,ef,n,as},sc,p},e,ci,pa,u},bra,sua,va,e{c,cr,i,l},rro,ero,mor,iar,er,i{r,ass,nc,ec,cc,ll,el,v},lu,iu,ru},tingu,nqu,omp,m{pri,iri,edi,su,fre,pre,ge},comb,g{r,g{i,e{iel,il,orr,ot},u},n,l,i{il,gl,r,s,d}},v{cri,pravvi,be,ce,ol,fer}},ur,por,rar}|6are:erebbe{d{en{facc,b,m},gri},sum{n,ie}}|6iare:gerebbe{for,can,man,en}|5ere:rebbe{ompi,par}|6cere:idurrebbe|6nere:marrebbe~3rebbe:andare|0bbe:re{e{ard,profond,rad,cher,chier,egg{l,el,r},tem},a{d,rid,f,st,rist}}|4rrebbe:ducere{,e}|3erebbe:are{ronc,sci}|6sarebbe:essere",
      "firstPlural": "0mmo:re{a{f{raf{t,p},e,tra,s,ri},tost},lle}|3remmo:ere{pi,ar}|4rremmo:ere{uc,an}|2emmo:si~0mmo:e,scadere|3eremmo:are{,llung}|3heremmo:are{c,g}|7etteremmo:etrasmettere|4eremmo:iare{c,g}|4rremmo:re{le,ene,veni}|3remmo:ere{cad,god,ved,av,viv,ov,ot,ap}~3:remmo{e{gli{co,io,to,ce},spegn,cern,ll{to,e{esp,op,ep,div,sv,ecc}},tess,t{t{ba,fle,nne,me,fo},sis,ver,mie,pe,cu},corr,c{s{na,pa,re,me,no},vin,tor,ia,ta,edi,li},d{n{o{f{if,ef,n,as},sc,p},e,ci,pa,u},bra,sua,va,e{c,cr,i,l},rro,ero,mor,iar,er,i{r,ass,nc,ec,cc,ll,el,v},lu,iu,ru},tingu,nqu,omp,m{pri,iri,edi,su,fre,pre,ge},comb,g{r,g{i,e{iel,il,orr,ot},u},n,l,i{il,gl,r,s,d}},v{cri,be,ce,ol,fer}},ur,por,rar}|6are:eremmo{d{en{facc,b,m},gri},sum{n,ie}}|6iare:geremmo{for,can,man,en}|5ere:remmo{ompi,par}|6cere:idurremmo|6nere:marremmo~3remmo:andare|0mmo:re{e{ard,profond,rad,cher,chier,egg{l,el,r},tem},a{d,rid,f,st,rist}}|4rremmo:ducere{,e}|3eremmo:are{ronc,sci}|6saremmo:essere",
      "secondPlural": "0ste:re{a{f{raf{t,p},e,tra,s,ri},tost},lle}|3reste:ere{pi,ar}|4rreste:ere{uc,an}|2este:si~0ste:e,scadere|3ereste:are{,llung}|3hereste:are{c,g}|7ettereste:etrasmettere|4ereste:iare{c,g}|4rreste:re{le,ene,veni}|3reste:ere{cad,god,ved,av,viv,ov,ot,ap}~3:reste{e{gli{co,io,to,ce},spegn,cern,ll{to,e{esp,op,ep,div,sv,ecc}},tess,t{t{ba,fle,nne,me,fo},sis,ver,mie,pe,cu},corr,c{s{na,pa,re,me,no},vin,tor,ia,ta,edi,li},d{n{o{f{if,ef,n,as},sc,p},e,ci,pa,u},bra,sua,va,e{c,cr,i,l},rro,ero,mor,iar,er,i{r,ass,nc,ec,cc,ll,el,v},lu,iu,ru},tingu,nqu,omp,m{pri,iri,edi,su,fre,pre,ge},comb,g{r,g{i,e{iel,il,orr,ot},u},n,l,i{il,gl,r,s,d}},v{cri,be,ce,ol,fer}},ur,por,rar}|6are:ereste{d{en{facc,b,m},gri},sum{n,ie}}|6iare:gereste{for,can,man,en}|5ere:reste{ompi,par}|6cere:idurreste|6nere:marreste~3reste:andare|0ste:re{e{ard,profond,rad,cher,chier,egg{l,el,r},tem},a{d,rid,f,st,rist}}|4rreste:ducere{,e}|3ereste:are{ronc,sci}|6sareste:essere",
      "thirdPlural": "0bbero:re{a{f{raf{t,p},e,tra,s,ri},tost},lle}|3rebbero:ere{pi,ar}|4rrebbero:ere{uc,an}|2ebbero:si~0bbero:e,scadere|3erebbero:are{,llung}|3herebbero:are{c,g}|7etterebbero:etrasmettere|4erebbero:iare{c,g}|4rrebbero:re{le,ene,veni}|3rebbero:ere{cad,god,ved,av,viv,ov,ot,ap}~5:rebbero{e{gli{co,io,to,ce},spegn,cern,ll{to,e{esp,op,ep,div,sv,ecc}},tess,t{t{ba,fle,nne,me,fo},sis,ver,mie,pe,cu},corr,c{s{na,pa,re,me,no},vin,tor,ia,ta,edi,li},d{n{o{f{if,ef,n,as},sc,p},e,ci,pa,u},bra,sua,va,e{c,cr,i,l},rro,ero,mor,iar,er,i{r,ass,nc,ec,cc,ll,el,v},lu,iu,ru},tingu,nqu,omp,m{pri,iri,edi,su,fre,pre,ge},comb,g{r,g{i,e{iel,il,orr,ot},u},n,l,i{il,gl,r,s,d}},v{cri,be,ce,ol,fer}},ur,por,rar}|8are:erebbero{d{en{facc,b,m},gri},sum{n,ie}}|8iare:gerebbero{for,can,man,en}|7ere:rebbero{ompi,par}|8cere:idurrebbero|8nere:marrebbero~3rebbero:andare|0bbero:re{e{ard,profond,rad,cher,chier,egg{l,el,r},tem},a{d,rid,f,st,rist}}|4rrebbero:ducere{,e}|3erebbero:are{ronc,sci}|6sarebbero:essere"
    },
    "imperfect": {
      "first": "2vo:rraffare|3vo:piere|3cevo:rre~2vo:re|7ettevo:etrasmettere|2cevo:re{di{d,pre,in,ter},fa{e,raf,s,ri,tra}}|3nevo:orre|3evo:arre~4rre:ucevo|2re:iducevo|2ere:ompivo~2vevo:bere|2cevo:re{di,ridi,fa}|2vo:ducere{,e}|5ro:essere",
      "second": "2vi:rraffare|3vi:piere|3cevi:rre~2vi:re|7ettevi:etrasmettere|2cevi:re{di{d,pre,in,ter},fa{e,raf,s,ri,tra}}|3nevi:orre|3evi:arre~4rre:ucevi|2re:iducevi|2ere:ompivi~2vevi:bere|2cevi:re{di,ridi,fa}|2vi:ducere{,e}|5ri:essere",
      "third": "2va:rraffare|3va:piere|3ceva:rre~2va:re|7etteva:etrasmettere|2ceva:re{di{d,pre,in,ter},fa{e,raf,s,ri,tra}}|3neva:orre|3eva:arre~4rre:uceva|2re:iduceva|2ere:ompiva~2veva:bere|2ceva:re{di,ridi,fa}|2va:ducere{,e}|5ra:essere",
      "firstPlural": "2vamo:rraffare|3vamo:piere|3cevamo:rre~2vamo:re|7ettevamo:etrasmettere|2cevamo:re{di{d,pre,in,ter},fa{e,raf,s,ri,tra}}|3nevamo:orre|3evamo:arre~6rre:ucevamo|4re:iducevamo|4ere:ompivamo~2vevamo:bere|2cevamo:re{di,ridi,fa}|2vamo:ducere{,e}|5ravamo:essere",
      "secondPlural": "2vate:rraffare|3vate:piere|3cevate:rre~2vate:re|7ettevate:etrasmettere|2cevate:re{di{d,pre,in,ter},fa{e,raf,s,ri,tra}}|3nevate:orre|3evate:arre~6rre:ucevate|4re:iducevate|4ere:ompivate~2vevate:bere|2cevate:re{di,ridi,fa}|2vate:ducere{,e}|5ravate:essere",
      "thirdPlural": "2vano:rraffare|3vano:piere|3cevano:rre~2vano:re|7ettevano:etrasmettere|2cevano:re{di{d,pre,in,ter},fa{e,raf,s,ri,tra}}|3nevano:orre|3evano:arre~6rre:ucevano|4re:iducevano|4ere:ompivano~2vevano:bere|2cevano:re{di,ridi,fa}|2vano:ducere{,e}|5rano:essere"
    },
    "subjunctive": {
      "first": "2sca:re,asalire|3:iare|3i:iare{bl,dev,avv,sv,sp,es}|4ia:arere|3ga:nere|3a:re{rne,orri,ngui,vi}|2ca:nedire|2a:mpire|3ca:rre~3i:are{,rraff,llung}|3hi:are{c,g}|5uchi:anicare|3a:re{e,i{t{sen,ves,er,ipar},apr,opr,fr,fugg,orm,boll,egu,iassorb}}|7etta:etrasmettere|6esca:uscire|2ca:dire{d,le,pre,in,ter}|5ieda:sedere|6lga:gliere|3ga:re{ale,sali,veni}|3nga:orre|3gga:arre|4ia:parire|3cia:acere|2ccia:fare{e,raf,s,ri,tra}|2a:ucire|4bbia:avere|3pia:apere|3ia:tostare|4glia:olere|4ssa:otere~0are:i{h{c{c{ba,uta,cia,do,cro,no,i{rm,v,t,os,d,n},mu,iu,su,e{r,nz,v,sp,n}},r{cce,pe,ve,mo},is,ras,fon},ving},n{co,timo,bor,un,ila,sma,tra},l{g,i{um,nc,s,ab},ma,amp},a,f{af,of,en,gon},ars,r{ingiu,nfu,pat,glo,neb,rop,ip,va,ra,nta},nist,ngust,c,d{ncen,pen,aro,si,vi,se,me,te,ra,pu,tu},z{tan,nan,en,i,vor,o,a},v{re,rchi,tra,v,n},equ,oqu,bu,p{p{ala,co,do,se},inci,co,or},emm,com,bb,amb,g,o}|2are:nfischi|1are:i{iaff,ossid,grad,enz{ad,u},scop,obb,lebb}|3re:isca|1ere:a{resc,mesc,iduc,volg,ulg}|2rre:uca|1ire:borra,serva,angua|2ere:nga{e,ma}|1re:empia~3a:re{e{alg,duc{,e},vert},menti,parti}|6vada:andare|2va:bere|3:iare{car,macch,od,ol,pazz}|3ia:are{d,rid,st,rist}|2ca:dire{,ri}|6sia:essere|2ccia:fare|3i:are{gabb,invi,sci,ronc,sed}|3ea:ire|5uoia:morire|4ia:parere{,s}|5ieda:redire|2sca:sparire|5oda:udire",
      "second": "2sca:re,asalire|3:iare|3i:iare{bl,dev,avv,sv,sp,es}|4ia:arere|3ga:nere|3a:re{rne,orri,ngui,vi}|2ca:nedire|2a:mpire|3ca:rre~3i:are{,rraff,llung}|3hi:are{c,g}|5uchi:anicare|3a:re{e,i{t{sen,ves,er,ipar},apr,opr,fr,fugg,orm,boll,egu,iassorb}}|7etta:etrasmettere|6esca:uscire|2ca:dire{d,le,pre,in,ter}|5ieda:sedere|6lga:gliere|3ga:re{ale,sali,veni}|3nga:orre|3gga:arre|4ia:parire|3cia:acere|2ccia:fare{e,raf,s,ri,tra}|2a:ucire|4bbia:avere|3pia:apere|3ia:tostare|4glia:olere|4ssa:otere~0are:i{h{c{c{ba,uta,cia,do,cro,no,i{rm,v,t,os,d,n},mu,iu,su,e{r,nz,v,sp,n}},r{cce,pe,ve,mo},is,ras,fon},ving},n{co,timo,bor,un,ila,sma,tra},l{g,i{um,nc,s,ab},ma,amp},a,f{af,of,en,gon},ars,r{ingiu,nfu,pat,glo,neb,rop,ip,va,ra,nta},nist,ngust,c,d{ncen,pen,aro,si,vi,se,me,te,ra,pu,tu},z{tan,nan,en,i,vor,o,a},v{re,rchi,tra,v,n},equ,oqu,bu,p{p{ala,co,do,se},inci,co,or},emm,com,bb,amb,g,o}|2are:nfischi|1are:i{iaff,ossid,grad,enz{ad,u},scop,obb,lebb}|3re:isca|1ere:a{resc,mesc,iduc,volg,ulg}|2rre:uca|1ire:borra,serva,angua|2ere:nga{e,ma}|1re:empia~3a:re{e{alg,duc{,e},vert},menti,parti}|6vada:andare|2va:bere|3:iare{car,macch,od,ol,pazz}|3ia:are{d,rid,st,rist}|2ca:dire{,ri}|6sia:essere|2ccia:fare|3i:are{gabb,invi,sci,ronc,sed}|3ea:ire|5uoia:morire|4ia:parere{,s}|5ieda:redire|2sca:sparire|5oda:udire",
      "third": "2sca:re,asalire|3:iare|3i:iare{bl,dev,avv,sv,sp,es}|4ia:arere|3ga:nere|3a:re{rne,orri,ngui,vi}|2ca:nedire|2a:mpire|3ca:rre~3i:are{,rraff,llung}|3hi:are{c,g}|5uchi:anicare|3a:re{e,i{t{sen,ves,er,ipar},apr,opr,fr,fugg,orm,boll,egu,iassorb}}|7etta:etrasmettere|6esca:uscire|2ca:dire{d,le,pre,in,ter}|5ieda:sedere|6lga:gliere|3ga:re{ale,sali,veni}|3nga:orre|3gga:arre|4ia:parire|3cia:acere|2ccia:fare{e,raf,s,ri,tra}|2a:ucire|4bbia:avere|3pia:apere|3ia:tostare|4glia:olere|2:nevare|4ssa:otere~0are:i{h{c{c{ba,uta,cia,do,cro,no,i{rm,v,t,os,d,n},mu,iu,su,e{r,nz,v,sp,n}},r{cce,pe,ve,mo},is,ras,fon},ving},n{co,timo,bor,un,ila,sma,tra},l{g,i{um,nc,s,ab},ma,amp},a,f{af,of,en,gon},ars,r{ingiu,nfu,pat,glo,neb,rop,ip,va,ra,nta},nist,ngust,c,d{ncen,pen,aro,si,vi,se,me,te,ra,pu,tu},z{tan,nan,en,i,vor,o,a},v{re,rchi,tra,u,v,n},equ,oqu,bu,p{p{ala,co,do,se},inci,co,or},emm,com,bb,amb,g,o}|2are:nfischi|1are:i{iaff,ossid,grad,enz{ad,u},scop,obb,lebb}|3re:isca|1ere:a{resc,mesc,iduc,volg,ulg}|2rre:uca|1ire:borra,serva,angua|2ere:nga{e,ma}|1re:empia~3a:re{e{alg,duc{,e},vert},menti,parti}|6vada:andare|2va:bere|3:iare{car,macch,od,ol,pazz}|3ia:are{d,rid,st,rist}|2ca:dire{,ri}|6sia:essere|2ccia:fare|3i:are{gabb,invi,sci,ronc,sed}|3ea:ire|5uoia:morire|4ia:parere{,s}|5ieda:redire|2sca:sparire|5oda:udire",
      "firstPlural": "2amo:re|2mo:iare|3iamo:ere,arre|4ssiamo:otere|3amo:iere|4iamo:arere|3ciamo:acere,rre|4bbiamo:avere|3piamo:apere|4gliamo:olere|2ciamo:nedire|3niamo:orre~3iamo:are{,rraff,llung}|3hiamo:are{c,g}|7ettiamo:etrasmettere|2cciamo:fare{raf,e,s,ri,tra}|2ciamo:dire{d,le,pre,in,ter}~2re:iamo{h{c{c{ba,uta,cia,do,cro,no,i{rm,v,t,os,d,n},mu,iu,su,e{r,nz,v,sp,n}},r{cce,pe,ve,mo},is,ras,fon},ving},n{timo,co,ila,sma,tra,bor,un},l{g,i{um,nc,s,rab},ma,amp,ob},a,f{naf,raf,of,en,gon},ars,des,nist,ngust,r{ingiu,nfu,pat,glo,neb,rop,ip,va,ra,nta},c,fiduc,vesc,d{tipen,rra,nse,me,te,aro,pu,tu,ussi,nsi,nvi},z{tan,nan,en,i,vor,o,a},v{re,de,rchi,tra,v,n,s},bbu,oloqu,equ,p{p{ala,co,do,se},inci,or,co},emm,com,bb,camb,g{,for,veleg,can,man,en},o}|3re:iamo{ch{nfiac,ric,tec,mprati,gran},n{i{ef,if,sf,gg,fr},rabbo,ncoglio,mmo,nsig,rug,u{r,em,ri,p},ca,va,ve,ifor,her,uar},l{gog,l{gia,bbe,eppe,mmo,bo},o{dd,rust,ab,eb,iev,dem,icci},au,i{h,v,ab,gent},a{ss,is,as,i},pp},mmuff,lf,s{ppas,tos,pes,ui,cen,man,o{ncuri,zi,et,l,v}},t{t{mma,ia,nfi,spe{di,nso},mbo,hio,mbru},u{br,t,gl,an},r{bo,sso,ve,pa},s{mba,ntri,bu,lle,ge,ve},n{se,sme,spazie,to,sa,ga},rre,pa,fol,el},r{e{pov,iv,coll,ad,ep,esp,pp,g,nn,cen,ten,ss,ns,si,f},r{abo,ga,za,ma},catu,sau,pau,polt,iet,ut,o{nsap,tim,fav,rt,ifi,ig},cop,ap,sp,a{iapp,scomp,sp,u},ff,pig,ag},c{cu,ius,san,ser,far,sar,ol,ero},d{n{pprofo,io,la,ca,ra},tra,ba,ia,gre,be,pe,to,r{eso,alo,to,ve},u{c,pla,sa,er},i{morb,bb,norr,utr,ar,ac,all,riv,t,iep,rp,ip,m,g}},z{iz{st,tir,vv},rin},u{t{ti,pat,ta,n},seg,rg,lang,l,nn,min,b,rc,r,oq},p{em,ce,ar,ncu,tu,so},herm,dorm,grem,b{ngob,am,sor,i,su},ugg,sag,vag,ve,io}|5are:nfischiamo|5rre:iamo{pon,duc}|4are:iamo{n{cappo,apo,ema,sve,ate},ppart,esent,ager,gifer,goffr,d{n{affo,facce,be,me},gra,gua,re,ge,he,gri,ici,uci},enz{ad,u},lev,vviv,scop,crim,nsum,iesum,b{ob,leb,ci,li}}|4ere:iamo{man,ten,cern,l{l{e{esp,op,ep,ecc},to},va},tess,t{t{ba,fle,nne,me,fo},cu,sis,mie,pe},corr,c{idu,s{na,pa,e,no},vin,tor,edi,li,mol},d{n{o{ff,nf,asf,sc,p},e,ci,pa,u},a,e,cre,rro,ero,go,mor,iar,er,lu,iu,ru,i{r,ass,c,ll,el,v}},v{e,cri,vi,pravvi,ol,fer},tingu,nqu,romp,m{ri,edi,su,fre,pre,ge},comb,g{r,g{i,e{el,il,orr,ot},tru},n,l,i{il,r,s,d}}}|3ere:iamo{gl{co,io,to,ce},omp}|6lere:sogliamo|4rre:traiamo|4rere:paiamo|6tere:possiamo|5ere:iamo{piacc,sapp}~2amo:ire{d{a,ban,con,or,u},cap,rap,colp,r{chia{,s},fio,mo,pe},n{fi,for,le,u,mu},imbell,pul,ment,sort,serv,usc}|2mo:iare{amb,assed,od,car,sp,esp,macch,ol,pazz}|3iamo:re{e{ard,profond,cher,chier,duc{,e},egg{l,r},tem,vert},a{bad,rid,sed,boll,gabb,ronc,spar,ven}}|4bbiamo:avere|2viamo:bere|2ciamo:dire{,ri}|6siamo:essere|2cciamo:fare|4gliamo:volere",
      "secondPlural": "2ate:re|2te:iare|3iate:ere,arre|4ssiate:otere|3ate:iere|4iate:arere|3ciate:acere,rre|4bbiate:avere|3piate:apere|4gliate:olere|2ciate:nedire|3niate:orre~3iate:are{,rraff,llung}|3hiate:are{c,g}|7ettiate:etrasmettere|2cciate:fare{raf,e,s,ri,tra}|2ciate:dire{d,le,pre,in,ter}~2re:iate{h{c{c{ba,uta,cia,do,cro,no,i{rm,v,t,os,d,n},mu,iu,su,e{r,nz,v,sp,n}},r{cce,pe,ve,mo},is,ras,fon},ving},n{timo,co,ila,sma,tra,bor,un},l{g,i{um,nc,s,rab},ma,amp,ob},a,f{naf,raf,of,en,gon},ars,des,nist,ngust,r{ingiu,nfu,pat,glo,neb,rop,ip,va,ra,nta},c,fiduc,vesc,d{tipen,rra,nse,me,te,aro,pu,tu,ussi,nsi,nvi},z{tan,nan,en,i,vor,o,a},v{re,de,rchi,tra,v,n,s},bbu,oloqu,equ,p{p{ala,co,do,se},inci,or,co},emm,com,bb,camb,g{,for,veleg,can,man,en},o}|3re:iate{ch{nfiac,ric,tec,mprati,gran},n{i{ef,if,sf,gg,fr},rabbo,ncoglio,mmo,nsig,rug,u{r,em,ri,p},ca,va,ve,ifor,her,uar},l{gog,l{gia,bbe,eppe,mmo,bo},o{dd,rust,ab,eb,iev,dem,icci},au,i{h,v,ab,gent},a{ss,is,as,i},pp},mmuff,lf,s{ppas,tos,pes,ui,cen,man,o{ncuri,zi,et,l,v}},t{t{mma,ia,nfi,spe{di,nso},mbo,hio,mbru},u{br,t,gl,an},r{bo,sso,ve,pa},s{mba,ntri,bu,lle,ge,ve},n{se,sme,spazie,to,sa,ga},rre,pa,fol,el},r{e{pov,iv,coll,ad,ep,esp,pp,g,nn,cen,ten,ss,ns,si,f},r{abo,ga,za,ma},catu,sau,pau,polt,iet,ut,o{nsap,tim,fav,rt,ifi,ig},cop,ap,sp,a{iapp,scomp,sp,u},ff,pig,ag},c{cu,ius,san,ser,far,sar,ol,ero},d{n{pprofo,io,la,ca,ra},tra,ba,ia,gre,be,pe,to,r{eso,alo,to,ve},u{c,pla,sa,er},i{morb,bb,norr,utr,ar,ac,all,riv,t,iep,rp,ip,m,g}},z{iz{st,tir,vv},rin},u{t{ti,pat,ta,n},seg,rg,lang,l,nn,min,b,rc,r,oq},p{em,ce,ar,ncu,tu,so},herm,dorm,grem,b{ngob,am,sor,i,su},ugg,sag,vag,ve,io}|5are:nfischiate|5rre:iate{pon,duc}|4are:iate{n{cappo,apo,ema,sve,ate},ppart,esent,ager,gifer,goffr,d{n{affo,facce,be,me},gra,gua,re,ge,he,gri,ici,uci},enz{ad,u},lev,vviv,scop,crim,nsum,iesum,b{ob,leb,ci,li}}|4ere:iate{man,ten,cern,l{l{e{esp,op,ep,ecc},to},va},tess,t{t{ba,fle,nne,me,fo},cu,sis,mie,pe},corr,c{idu,s{na,pa,e,no},vin,tor,edi,li,mol},d{n{o{ff,nf,asf,sc,p},e,ci,pa,u},a,e,cre,rro,ero,go,mor,iar,er,lu,iu,ru,i{r,ass,c,ll,el,v}},v{e,cri,vi,pravvi,ol,fer},tingu,nqu,romp,m{ri,edi,su,fre,pre,ge},comb,g{r,g{i,e{el,il,orr,ot},tru},n,l,i{il,r,s,d}}}|3ere:iate{gl{co,io,to,ce},omp}|6lere:sogliate|4rre:traiate|4rere:paiate|6tere:possiate|5ere:iate{piacc,sapp}~2ate:ire{d{a,ban,con,or,u},cap,rap,colp,r{chia{,s},fio,mo,pe},n{fi,for,le,u,mu},imbell,pul,ment,sort,serv,usc}|2te:iare{amb,assed,od,car,sp,esp,macch,ol,pazz}|3iate:re{e{ard,profond,cher,chier,duc{,e},egg{l,r},tem,vert},a{bad,rid,sed,boll,gabb,ronc,spar,ven}}|4bbiate:avere|2viate:bere|2ciate:dire{,ri}|6siate:essere|2cciate:fare|4gliate:volere",
      "thirdPlural": "2scano:re,asalire|3no:iare|3ino:avviare|3gano:nere|3ano:re{rne,orri,ngui,vi}|2cano:nedire|2ano:mpire|3cano:rre~3ino:are{,rraff,llung}|3hino:are{c,g}|5uchino:anicare|3ano:re{e,i{t{sen,ves,er,ipar},apr,opr,fr,fugg,orm,boll,egu,iassorb}}|7ettano:etrasmettere|6escano:uscire|2cano:dire{d,le,pre,in,ter}|5iedano:sedere|6lgano:gliere|3gano:re{ale,sali,veni}|3ngano:orre|3ggano:arre|4iano:parire|3ciano:acere|2cciano:fare{e,raf,s,ri,tra}|2ano:ucire|4bbiano:avere|3piano:apere|3iano:tostare|4gliano:olere|2no:nevare|4ssano:otere~2are:ino{h{c{c{ba,uta,cia,do,cro,no,i{rm,v,t,os,d,n},mu,iu,su,e{r,nz,v,sp,n}},r{cce,pe,ve,mo},is,ras,fon},ving},n{co,timo,bor,un,ila,sma,tra},l{g,i{um,nc,s,ab},ma,amp,ob},a,f{af,of,en,gon},ars,des,r{ingiu,nfu,pat,glo,neb,rop,ip,va,ra,nta},nist,ngust,c,d{ncen,pen,aro,si,vi,se,me,te,ra,pu,tu},z{tan,nan,en,i,vor,o,a},v{e,rchi,tra,u,n,v,s},equ,oqu,bu,p{p{ala,co,do,se},inci,co,or},emm,com,bb,amb,g,o}|4are:nfischino|3are:ino{iaff,ossid,grad,enz{ad,u},lev,scop,obb,lebb}|5re:iscano|3ere:ano{resc,mesc,iduc,volg,ulg}|4rre:ucano|3ire:ano{borr,serv,angu}|4ere:ngano{e,ma}|3re:empiano~3ano:re{e{alg,duc{,e},vert},menti,parti}|6vadano:andare|2vano:bere|3no:iare{car,sp,esp,macch,od,ol,pazz}|3iano:are{d,rid,st,rist}|2cano:dire{,ri}|6siano:essere|2cciano:fare|3ino:are{gabb,ronc,sed}|5uoiano:morire|4iano:parere|5iedano:redire|2scano:sparire|5odano:udire"
    },
    "gerunds": {
      "gerunds": "11verniciando:nverniciare|10annoiando:riannoiare|8covando:ricovare|13approssimando:iapprossimare|9ercando:onvincere|2ndo:ere{iconvinc,mb}|3cendo:rre|3nendo:orre|4ndo:tore~2ndo:re|9pugnando:iespugnare|10tivalicando:rivalicare|3iando:inneggiare|4ando:are{raggrovigli,ullizz}|6attando:ecettare|10intoppando:rintoppare|6chando:tchare|3endo:ire,arre|7ettendo:etrasmettere|11spendantendo:impedantire|15inchiocciolendo:rinchiocciolire|2cendo:re{di{d,ne,le,pre,in,ter,s},fa{e,raf{t,p},s,mal,ri,tra}}|10infierendo:rinfierire|2endo:ire{bogl,emp}|2vendo:bere|5ndosene:rsene|3ndoci:rci|1mi:ilassare~11nverniciare:iverniciando|3re:endo{t{bat,et,fot,scu,ncu,sis,pe,ie,o},l{el,tol,ido,va},n{ma,te,cer,eg},c{s,i,mol,in,a,or},corr,hier,bur,d{a{br,er,c,u,v},e{c,cr,i,l,s},n,scon,pan,u{l,hi,tr,pr},i{l,r,div,s,c{on,in,e,oc,uc,r}},riar,per,mor,ro,go,d},i,tess,g,trugg,ingu,nqu,omb,v,mbev,bbev,m,sap,erp,omp}|4ire:endo{pett,ell{b,pp},usc,d{n{pprofo,co,io,a},i{pall,norr,utr,ar}},g{lar,ug,ag,a,gri},tiv,serv,rm,grem}|5rre:endo{pon,duc}~2ndo:ere{ard,ped,rad,c{benedi,du{,e,ri}},cher,par,spar,dol,vol,vert}|2cendo:re{di,ridi,fa}|3iando:rimeggiare"
    },
    "pastParticiple": {
      "pastParticiple": "2to:re{,rraffa,spri}|3ito:stere|6osso:uotere|3uto:ere{d{ca,e,en{op,l,v},pru,stri,go},ic,g{ver,ccor,tan,lan,en,al,vi},eromp,tess}|5so:ndere|4so:ere{and,r,nverg,arg}|3so:arere|5to:ere{nasc,gu}|4to:ere{rc,nc,derg,lv,ll}|5otto:ucere|6etto:ringere|5etto:igere|5nto:gnere|4tto:ivere|4nto:umere|5tto:mpere|6stato:essere|3sto:rre|4otto:urre~4to:gere|3uto:ere,venire|3iuto:cere|6ociuto:nuocere|4ssuto:vivere|4uto:evolvere|3ito:solere|5tto:ggere|6otto:uocere|3etto:dire{d,ne,le,pre,in,ter}|10istretto:estringere|3tto:arre|2tto:fare{e,raf,s,ri,tra}|5atto:igere{s,d}|6lto:gliere|4erto:rire{p,f}|5ento:imere|5sto:ondere|4sto:ere{er,hied,an}|5isto:vedere|4so:ere{d,led,erg,fulg,cell}|3so:parire,alere|6uso:fondere|5sso:ere{ett,ind,figg{in,e}}|5esso:primere|7esso:etrasmettere|6osso:uovere|4sso:utere|6ulso:pellere|2nte:mpellere~2re:ato,ito|2scere:prenato|3ere:sistito|4urre:dotto|4ucere:idotto|3mpere:rotto|4ingere:tretto|4igere:etto{ir,er,dil,gl}|3vere:critto|2vere:solto|2gere:volto,ulto,osparso|2lere:lto{esto,ve}|2cere:torto,vinto|3mere:sunto|2guere:stinto|3gnere:pento|3rre:posto|3ndere:risposto|2ndere:eso,tuso|2rere:corso|2dere:isperso|4uotere:cosso~2vuto:bere|3etto:dire{,ri}|5otto:ducere{,e}|2tto:fare|3to:morire|5to:nascere{,ri}|3so:parere{,s}|3uto:ere{nd{pe,fe,asco,spa},urg,fulg}|2to:sparire|4to:stingere|4so:perdere"
    },
    "presentParticiple": {
      "presentParticiple": "2nte:rraffare|2cente:nedire|2ente:mpire|3cente:rre|3nente:orre~2nte:re|3ente:ire,arre|7ettente:etrasmettere|2cente:re{di{d,le,pre,in,ter},fa{e,raf,s,ri,tra}}|2ente:venire|3iente:apere|3vente:arere~3re:ente{t{bat,et,fot,cu,sis,pe,ie,o},ell,toll,val,n{ma,te,cer,eg},c{idu,s,i,a,or,in},corr,her,hier,d{,pan,i{r,s,c,oll,el,div},mor},i,tess,g,trugg,ingu,nqu,omb,v,m,mp}|4ire:ente{pett,ell{b,pp},usc,d{a{gr,tr,b,i},gre,be,pe,pprofon,ion,an,cu,au,eru,i{,norr,utr,ar,ac},ver,or,to},ugg,ag,serv,rm,grem}|5rre:ente{pon,duc}|4re:empiente~3ente:ire{ad,cond,ud,ven}|2vente:bere|4ziente:consentire|2cente:re{di,ridi,fa}|2nte:ere{dol,vol,duc{,e},ess,vert}|2endo:empire"
    }
  };

  // uncompress them
  Object.keys(model$1).forEach(k => {
    Object.keys(model$1[k]).forEach(form => {
      model$1[k][form] = uncompress(model$1[k][form]);
    });
  });

  // generated from ./data/verbs.jsonl by scripts/gen-irregular.js
  // full tables for verbs with irregular stems,
  // plus irregular past-participles + gerunds for otherwise-regular verbs
  var irregular$1 = {
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
          "siedo",
          "siedi",
          "siede",
          "sediamo",
          "sedete",
          "siedono"
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
          "sieda",
          "sieda",
          "sieda",
          "sediamo",
          "sediate",
          "siedano"
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

  const {
    presentTense: presentTense$1,
    pastTense: pastTense$1,
    futureTense: futureTense$1,
    conditional: conditional$1,
    imperfect: imperfect$1,
    subjunctive: subjunctive$1,
  } = model$1;

  const persons$5 = ['first', 'second', 'third', 'firstPlural', 'secondPlural', 'thirdPlural'];

  const doEach = function (str, m, tense) {
    // known-irregular verb?
    const table = irregular$1.paradigms[str];
    if (table && table[tense]) {
      const res = {};
      persons$5.forEach((p, i) => {
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
    const table = irregular$1.paradigms[str];
    if (table && table.imperfectSubjunctive) {
      const res = {};
      persons$5.forEach((p, i) => {
        res[p] = table.imperfectSubjunctive[i];
      });
      return res
    }
    const stem = str.replace(/are$/, 'a').replace(/ere$/, 'e').replace(/ire$/, 'i');
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

  const { gerunds, pastParticiple, presentParticiple } = model$1;

  const m$3 = {
    toGerund: gerunds.gerunds,
    fromGerund: reverse(gerunds.gerunds),
    toPastParticiple: pastParticiple.pastParticiple,
    fromPastParticiple: reverse(pastParticiple.pastParticiple),
    toPresentParticiple: presentParticiple.presentParticiple,
    fromPresentParticiple: reverse(presentParticiple.presentParticiple),
  };

  // irregular participle/gerund lookups, in both directions
  const toPP = {};
  const fromPP = {};
  const toGer = {};
  const fromGer = {};
  Object.keys(irregular$1.participles).forEach((inf) => {
    toPP[inf] = irregular$1.participles[inf];
    fromPP[irregular$1.participles[inf]] = inf;
  });
  Object.keys(irregular$1.gerunds).forEach((inf) => {
    toGer[inf] = irregular$1.gerunds[inf];
    fromGer[irregular$1.gerunds[inf]] = inf;
  });
  Object.keys(irregular$1.paradigms).forEach((inf) => {
    const p = irregular$1.paradigms[inf];
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
    return convert(str, m$3.fromGerund)
  };
  const toGerund = function (str) {
    if (toGer.hasOwnProperty(str)) {
      return toGer[str]
    }
    return convert(str, m$3.toGerund)
  };
  const fromPastParticiple = function (str) {
    if (fromPP.hasOwnProperty(str)) {
      return fromPP[str]
    }
    return convert(str, m$3.fromPastParticiple)
  };
  const toPastParticiple = function (str) {
    if (toPP.hasOwnProperty(str)) {
      return toPP[str]
    }
    return convert(str, m$3.toPastParticiple)
  };
  const fromPresentParticiple = function (str) {
    return convert(str, m$3.fromPresentParticiple)
  };
  const toPresentParticiple = function (str) {
    return convert(str, m$3.toPresentParticiple)
  };

  const { presentTense, pastTense, futureTense, conditional, imperfect, subjunctive } = model$1;

  // =-=-
  const revAll = function (m) {
    return Object.keys(m).reduce((h, k) => {
      h[k] = reverse(m[k]);
      return h
    }, {})
  };

  const presentRev = revAll(presentTense);
  const pastRev = revAll(pastTense);
  const futureRev = revAll(futureTense);
  const conditionalRev = revAll(conditional);
  const imperfectRev = revAll(imperfect);
  const subjunctiveRev = revAll(subjunctive);

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
    const forms = {
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
    const forms = {
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
    const forms = {
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
    const forms = {
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
    const forms = {
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
    const forms = {
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

  // the italian imperative has no forms of its own, for nearly every verb -
  // it borrows them from the present-tense, and the subjunctive.
  // 'mangia!' (tu), 'mangi!' (Lei), 'mangiamo!' (noi), 'mangiate!' (voi), 'mangino!' (Loro)

  // [tu, voi] - the few verbs with their own forms
  const irregulars$1 = {
    essere: ['sii', 'siate'],
    avere: ['abbi', 'abbiate'],
    sapere: ['sappi', 'sappiate'],
    volere: ['vogli', 'vogliate'],
    dire: ["di'", 'dite'],
    dare: ['dai', 'date'],
    fare: ['fai', 'fate'],
    stare: ['stai', 'state'],
    andare: ['vai', 'andate'],
  };
  // the short forms of these - "da'", "fa'", "sta'", "va'"
  const short = { da: 'dare', di: 'dire', fa: 'fare', sta: 'stare', va: 'andare' };

  const has$2 = (obj, k) => Object.prototype.hasOwnProperty.call(obj, k);

  const toImperative = function (str) {
    const pres = toPresent(str);
    const subj = toSubjunctive(str);
    const res = {
      // 'mangia!' is the third-person, but 'prendi!' is the second
      second: /are$/.test(str) ? pres.third : pres.second,
      third: subj.third,
      firstPlural: pres.firstPlural,
      secondPlural: pres.secondPlural,
      thirdPlural: subj.thirdPlural,
    };
    if (has$2(irregulars$1, str)) {
      res.second = irregulars$1[str][0];
      res.secondPlural = irregulars$1[str][1];
    }
    return res
  };

  // every irregular present-tense and subjunctive form, and its infinitive - 'siedi' -> 'sedere'
  let known$1 = null;
  const fromIrregular$1 = function (str) {
    if (known$1 === null) {
      known$1 = {};
      Object.keys(irregular$1.paradigms).forEach((inf) => {
        const table = irregular$1.paradigms[inf];
        const list = (table.present || []).concat(table.subjunctive || []);
        list.forEach((w) => {
          if (w && !has$2(known$1, w)) {
            known$1[w] = inf;
          }
        });
      });
      Object.keys(irregulars$1).forEach((inf) => {
        irregulars$1[inf].forEach((w) => {
          known$1[w] = inf;
        });
      });
    }
    return has$2(known$1, str) ? known$1[str] : null
  };

  const forms = [
    { key: 'second', from: (s) => [fromPresent(s, 'ThirdPerson'), fromPresent(s, 'SecondPerson')] },
    { key: 'firstPlural', from: (s) => [fromPresent(s, 'FirstPersonPlural')] },
    { key: 'secondPlural', from: (s) => [fromPresent(s, 'SecondPersonPlural')] },
    { key: 'third', from: (s) => [fromSubjunctive(s, 'ThirdPerson')] },
    { key: 'thirdPlural', from: (s) => [fromSubjunctive(s, 'ThirdPersonPlural')] },
  ];

  // find an infinitive whose imperative is this word
  // - pass-in 'isVerb' to only accept infinitives that we know
  const fromImperative = function (str, isVerb) {
    str = str.replace(/’/g, "'");
    const bare = str.replace(/'$/, '');
    if (str !== bare && has$2(short, bare)) {
      return short[bare]
    }
    const isOk = (inf) => Boolean(inf) && inf !== str && /(are|ere|ire|rre)$/.test(inf) && (!isVerb || isVerb(inf));
    const irr = fromIrregular$1(str);
    if (irr && Object.values(toImperative(irr)).includes(str)) {
      return irr
    }
    for (let i = 0; i < forms.length; i += 1) {
      const { key, from } = forms[i];
      const found = from(str).find((inf) => isOk(inf) && toImperative(inf)[key] === str);
      if (found) {
        return found
      }
    }
    return null
  };

  // an imperative, with its object-pronouns attached
  // 'dammelo' -> dare + me + lo, 'guardami' -> guardare + mi, 'andiamoci' -> andare + ci
  const clitics$1 = /(glie(lo|la|li|le|ne)|[mtcvs]e(lo|la|li|le|ne)|gli|lo|la|li|le|ne|mi|ti|ci|vi|si)$/;

  const isInfinitive$4 = function (str, lexicon) {
    if (!has$2(lexicon, str)) {
      return false
    }
    const tags = lexicon[str];
    return tags === 'Infinitive' || (Array.isArray(tags) && tags.includes('Infinitive'))
  };

  // returns the infinitive, and the pronouns - or null
  const parseImperative = function (str, lexicon) {
    const m = str.match(clitics$1);
    if (!m || m.index < 2) {
      return null
    }
    const stem = str.slice(0, m.index);
    const clitic = m[0];
    // these double the consonant of their pronoun - 'dammi', 'dillo', 'facci' - but 'dagli'
    const base = stem.slice(0, -1);
    if (has$2(short, base) && stem.slice(-1) === clitic[0] && clitic !== 'gli') {
      return { root: short[base], clitic }
    }
    if (has$2(short, stem) && /^gli/.test(clitic)) {
      return { root: short[stem], clitic }
    }
    // only the tu, noi and voi forms take a pronoun
    const root = stem.length < 4 ? null : fromImperative(stem, (inf) => isInfinitive$4(inf, lexicon));
    if (!root) {
      return null
    }
    const found = toImperative(root);
    if (![found.second, found.firstPlural, found.secondPlural].includes(stem)) {
      return null
    }
    return { root, clitic }
  };

  // find a conjugated verb in the conjugation table of its infinitive.
  //
  // the reverse-models (fromPresent, fromPast..) each guess at an infinitive,
  // and they need to be told the tense + person, which we often do not know.
  // so try them all, and only keep an infinitive that conjugates back into our word.
  //
  // (this file is the same in each of the *-compromise libraries - the list of tenses is not)

  const persons$4 = ['first', 'second', 'third', 'firstPlural', 'secondPlural', 'thirdPlural'];

  // tenses is a list of { name, to(infinitive), from(word, person) }
  // opts.extra(word) may give more infinitives to try
  const makeLookup = function (tenses, opts = {}) {
    // what an infinitive looks like - 'hablar', 'parlare', 'sprechen'
    const shape = opts.shape || /./;
    const pick = (only) => (only ? tenses.filter((o) => only.includes(o.name)) : tenses);

    // every form of this verb, by tense, and then person
    const table = function (inf, only) {
      const res = {};
      pick(only).forEach((o) => {
        res[o.name] = o.to(inf) || {};
      });
      return res
    };

    // where is this word, in the conjugations of this infinitive?
    const findHits = function (str, inf, only) {
      const forms = table(inf, only);
      const hits = [];
      Object.keys(forms).forEach((tense) => {
        persons$4.forEach((person) => {
          if (forms[tense][person] === str) {
            hits.push({ tense, person });
          }
        });
      });
      return hits
    };

    // every infinitive that has this word as one of its forms
    const candidates = function (str, only) {
      // the word itself may be one - 'wir gehen'
      let roots = shape.test(str) ? [str] : [];
      // any irregular verbs, that the models do not reverse
      if (opts.extra) {
        roots = roots.concat(opts.extra(str) || []);
      }
      pick(only).forEach((o) => {
        persons$4.forEach((person) => {
          // 'rad fahren' -> 'fahren'
          const inf = (o.from(str, person) || '').split(' ').pop();
          if (inf && inf !== str && shape.test(inf)) {
            roots.push(inf);
          }
        });
      });
      roots = roots.filter((s, i) => roots.indexOf(s) === i);
      const found = [];
      roots.forEach((root) => {
        const hits = findHits(str, root, only);
        if (hits.length > 0) {
          found.push({ root, hits });
        }
      });
      return found
    };

    // the best of them - or null
    // - isVerb(infinitive) says if this is a verb that we know. these are preferred.
    // - known: only accept a verb that we know
    // - tenses: only look in these tenses
    const lookup = function (str, options = {}) {
      const isVerb = options.isVerb || (() => false);
      let found = candidates(str, options.tenses);
      found = found.map((o, i) => ({ o, i, known: isVerb(o.root) }));
      if (options.known) {
        found = found.filter((a) => a.known);
      }
      // prefer a real verb - 'pude' is 'poder', not 'pudir'
      found.sort((a, b) => {
        const diff = Number(b.known) - Number(a.known);
        if (diff !== 0) {
          return diff
        }
        // then the shortest - 'sagte' is 'sagen', not 'sagten'
        return a.o.root.length - b.o.root.length || a.i - b.i
      });
      return found.length > 0 ? found[0].o : null
    };

    return { table, findHits, candidates, lookup }
  };

  // the reverse-models take a tag for the person
  const tags$1 = {
    first: 'FirstPerson',
    second: 'SecondPerson',
    third: 'ThirdPerson',
    firstPlural: 'FirstPersonPlural',
    secondPlural: 'SecondPersonPlural',
    thirdPlural: 'ThirdPersonPlural',
  };
  const wrap = (fn) => (str, person) => fn(str, tags$1[person]);

  // the indicative tenses - ('past' is the passato remoto)
  const tenses$1 = [
    { name: 'present', to: toPresent, from: wrap(fromPresent) },
    { name: 'imperfect', to: toImperfect, from: wrap(fromImperfect) },
    { name: 'past', to: toPast, from: wrap(fromPast) },
    { name: 'future', to: toFuture, from: wrap(fromFuture) },
    { name: 'conditional', to: toConditional, from: wrap(fromConditional) },
  ];

  // every form of our irregular verbs - 'vedrò' -> ['vedere']
  let known = null;
  const extra = function (str) {
    if (known === null) {
      known = {};
      Object.keys(irregular$1.paradigms).forEach((inf) => {
        tenses$1.forEach((o) => {
          const forms = irregular$1.paradigms[inf][o.name] || [];
          forms.forEach((w) => {
            if (w) {
              known[w] = known[w] || [];
              known[w].push(inf);
            }
          });
        });
      });
    }
    return Object.prototype.hasOwnProperty.call(known, str) ? known[str] : []
  };

  const { table, findHits, candidates, lookup } = makeLookup(tenses$1, { shape: /(are|ere|ire|rre)$/, extra });

  const all$2 = function (str) {
    let arr = [str].concat(
      Object.values(toPresent(str)),
      Object.values(toPast(str)),
      Object.values(toFuture(str)),
      Object.values(toConditional(str)),
      Object.values(toImperfect(str)),
      Object.values(toSubjunctive(str)),
      Object.values(toImperfectSubjunctive(str)),
      Object.values(toReflexive(str)),
      Object.values(toImperative(str))
    );
    // past-participle, in all four gender/number agreements
    const pp = toPastParticiple(str);
    if (pp) {
      arr.push(pp);
      arr.push(pp.replace(/o$/, 'a'));
      arr.push(pp.replace(/o$/, 'i'));
      arr.push(pp.replace(/o$/, 'e'));
    }
    arr.push(toGerund(str));
    arr.push(toPresentParticiple(str));
    // attached object-pronouns - 'fissarla', 'scriverlo'
    const stem = str.replace(/e$/, '');
    arr = arr.concat([stem + 'lo', stem + 'la', stem + 'li', stem + 'le', stem + 'ne']);
    arr = arr.filter((s) => s);
    arr = new Set(arr);
    return Array.from(arr)
  };

  var verb = {
    all: all$2,
    toPresent,
    toPast,
    toFuture,
    toConditional,
    toImperfect,
    toSubjunctive,
    toImperfectSubjunctive,
    toReflexive,
    toImperative,
    fromImperative,
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
    table,
    findHits,
    candidates,
    lookup,
  };

  // console.log(toPresent('fermarsi'))

  // generated in ./lib/lexicon
  var lexData = {
    "Determiner": "true¦alGciascEdeCgDiBlAmolt9nessEogni,p6qu3t1un0;!a,o;a0ropp5utt7;l4nt6;alche,e0;g8i,l0stC;!lB;arecchi1och0;e,i;!e;a,e,i;!a,e,o;!l;g0i,lle;li;un0;!a;cun1tr0;a,e,i,o;!a,e,i",
    "Pronoun": "true¦cGeEio,lDmAn8ognu7qual5s3t1v0;i,o8;e,i,u0;!a,e,o9;i,u0é;a,e,o7;c0e;osa,u0;no;e,o0;i,str5;e,i0;!a,e0o;!i;ei,i,oro,ui;gli,lla,ss0;a,e,i,o;hi1i0osì,ui;!ò;!unque",
    "Possessive": "true¦loro,mi3n1su0tu0v1;a,e,o3;ostr0;a,e,i,o;a,e0o;!i",
    "Condition": "true¦nel caso che",
    "Conjunction": "true¦:aPde,eBi5o4èoic,é0ìsneb,òr2;hc0n;iz4n1r0;ep;eb,iffa;!dna3nemmen;d1ttafBz0;na; 1ni0;uq;a0opD;mDsuac a;!hc6moccis,nebbes,r0s,uqnud;t3up0;!p0;e0o;!n;lo0nem;ni;! 1na0;!en;am3o0ísoc;p1ts0;iv,ottuip;od;irp; eizarg,i0m,neppa,rolla;sso,vattut",
    "Negative": "true¦mai,n0;essuno,iente,on,ulla",
    "PresentTense": "true¦:aEe8i5o0è,òup;h,i3maiBn0sEts,vJ;a1na5o0;i1sCvH;bbGiDssC;lgE;a1es,ou0vE;p,v;h,s,ts;louv,t0vB;a1e0;is,l8p7t5v2;i0ts;bb0lg6pp5s2ts;a,od;bb5h,i2s0ts;!s0;op;bba,lg1pp0s,ts;as;ov;ed",
    "Date": "true¦domani,ieri,oggi",
    "Noun": "true¦!1:#$%&()*+-./<=>?@[]^_`~:or,ia,er,le,ca,ol,ri,co,tt,ra,la,ti,ta,ma,en,te,to,si,me,es,st,lo;0:7D;1:7B;2:5X;3:6P;4:74;5:6I;6:6H;7:6Z;8:6B;9:6N;a6Xb6Ic5Ad4Ze4Wf4Eg3Xi3Ol3Dm2Pn2Io28p12qua11r0QsXtKuGvAzucche8;aDeCiA)1M;a32deo(s4Ino,s5tA;a,t#$;n1rdu6;(nz2lAs(;i0u5;cc67ffic3niCoA;mAv60;ini,o;+,v%]tà;aKeDit)7rAu-'u9;aAe9i^1T;f1U>,-A;a1o;cn5S&FmpDnda,oCr6sA;su1tA;aZi,o;do6X*0;_5oA;!.&;fo9vis56;c0sAv)5M;(,s5L[;a00cUeQfPiL)di,pJquad6tBus]d3vA;iluppo,)5;aGell2#iFrEudA;?tCiA;!oA;!so;e48i;ad2u-u6;a,+;nza,z4U;az3ec1F$0LoA;rt,sa;gnBnA`09;da0is3O;ifi23#A;a,e,ina;ida,#zo;c18dCgui1^10rA-i>n2;aAie,.,vo;!=;e,$;aDhBoAu2G;n1po;%A$vo;mo,zo;/,rAt)a;i0pa;bb$,l5AnA;gue,=;aIeFiA;cDfug$1mb#so,sCtBvA;is5)5;ardo,#9.t1;ch3p3Lt#43ul=1;%(,o;!c/mo,ddi1gBtA;e,=;al7no;d3gazz55ppA;#1r_?t3X;d8r<% g?%a&;a04eViPl32neu>5SoJrCuA;bb2Jls3UntA;e19i,o;anzo,eFoA;blCc_ZfBgAsp39va;et1.m>;_s32i~;emA;a,i;m3]33zzo;lCmBrtA`45;a,i0;%i0Zodo8;iA~;tAzi4I;ec53i(;aCeBoAzD;gg$;d42t4;nB`4t1zA;za;o,t2;rAsce;cFdEiDsA;i0onA;aAe;!&;c)o,od4H;ue;?1#A;so;cIe],io,lGnFrCsAu6;sAt3J;a1egge8o;+,)2tA;e,iA;!c)a4t3F;i0#ami(;+sce4GeA;`4;e,iA;fi0;biet0UcchiIggi,liHnFp%2rBspA;eda&,i@;eBga4AoA;!~g3;!cA;ch3;e4oA;m1Pre;mpi0o;!o;aDeCoBuA;^8t4;mi,-i;goz3mi0;sBtAziona&;a&,u6;ci5o,t8;aQeKiHoCuA;ro,sA;e7i(;bi&,dDm?t7nCr@,sBtAvim?1;o4[;ai0tr2;do,=gn2;ell7i,o;nBsA;ce/,u6;iMut7;c(3Kdi0l2rEsBzA;zo;i,sA;aAi0;gg3;(1;cchin2eFgo,mQnDppa,rCtA;eA<n2A;>3Mr$&;(,i1]0;iAo;!+,e6;`8;aHeEiCodBuA;dAna;ovi0;br7nAv27;ea guiRg2H;gBsU-Azi23;e6o;a,ge,no;c*BgV`4tAv#7;o,@;>;de2mpHnBsA=l$;)2;cBg&se,iz3sA;a/5egn16;aC?A;<A;vo;nt0R*0;#1ron5;aOeLiDov%9rCuA;%6iAs1;da;ado,i22;aGoCuA;bb1W.sA;]0;cCrnA`4;aAi,o;l1G=;hi,o;c(,r0Y;/1n%Ar>2B;aAe;&;eA/t2Imb2sd1M-7;li0;aOeNiI~t5oDrBuA;ngo,o0tu8;ecc$,u-A;a,i di >4;gl$,n@,rmCsB[A;!g.f$;se-e;aAu/;!gg3;gliDlCneA#i,]0;!sA;tr2;e,m;!a,o;de1W`2;bb*(,migli2ntBtA;a,tu6;as1Z;nBre1YsA;emp3=@;*0t.@;aJeHiEoAu.5;lC^1Knn2-A;#eA;!ssa;ce;fBo,p?Ava9;d?T;et1;moAna8t?u1;c.1M<0;<;a01eYhiXiT/ssSoErAuciJ;iAusc0N;`$nA<0;e]A;mo;gno^,lKmGnBp%15rAs2;da,oDpo,so;dizioDsBtA;o,r)~;egAigl3;na;ni;i0m%ciBpAuF;i1&an9os1ut%;anA;@;azA#Wpa;ioA;ne;e,i0;ascu9bo,eU-BviA;+,&;aAà;di9;avi,+,_2;nBrA;ch3ot1;a,e4t8;ffè,lc3mNnIpGrEs2uCvA;alAo;ie4~;sa;a,e;icA;a,o;elli,itAo;a9oE;cCdida1i,zA;onA;e,i;elA;~;e6pA;iWo;aJiFoDrCuA;+,r8;ro;acc3i=nZ;cHlA;/;cic&t5glie-7r6scA;ot1;.;=;g9mbinCnBrB-aA;glN;(;a,e,i,o;no;cZdr$X%VlSmOnHpFrEtCu[Bvv%sar3;io;!bus;/nUtA;i0o;a>i0che)ogi0$;e,pas]A;ona1;at4droFi>Dn7sB<A;bioO+;$;i,o;!lA;e do^sKi;ni0;alCbi1icBo4;re;a,he,i,o;*0;aBb%A&a1;go,i,o;!*0;eo,op#1;[;<0;+;c#Aqua;do",
    "Verb": "true¦avvenuTdebboSf8ottenne,utilizzaTv0;a,e0ienK;n1rr0;aCe3à,ò;g3i1n5ut0;a,e,i,o;a0mJsEte,vD;mo,te;aKoK;a1ec0;eEi;!c6i,n5r1t0;e,to;a2e0à,ò;bbeAi,m0st7te;mo,o;i,n0;no;ci8e0;m6s1v0;a7i,o;s1t0;e,i;e1i0;!mo;!ro;mo;a0o;!mo,no,te;!no;ta",
    "PastTense": "true¦aveHdoveFeBf8pot6s1vol0;eGlF;apeFeppEt0;a1e0;mLsGttC;t0vD;a,i,o;e0é;i,mHr2sCvA;osBu0;!i,mFr0;ono;bb4r0;a0i,o;!no,va0;mo,te;m9s4tt0v2;e7i;m7s2v0;a0i,o;!mo,no,te;s1t0;e,i;e1i0;!mo;!ro;mo",
    "Adjective": "true¦:!1:#$%&()*+./<=>?@[]^_`~:et,ne,ts,re,na,ar,ro,se,id,il,rt,tn,ir,mi,er,tt,ni,em,om,no,oc;0:6M;1:6I;2:6P;3:5L;4:68;5:5R;cte,eCit$+1kBlAn9o8p5*6s,[ut,ulboll0N’%eE;f,i6]m,r*h;gg15lgim;d(u]2Zt&p~ la;a/ati,epo,oub;at^,eb;nup,rad;c6Dd67h5Kl1Vm1Rn1Kpic]1r0Ts06t8uqnula7v6;aw,e/,/,ruc;uq;a>avs,n6+lec,t>cs;aOe6i%.;)2QcKdIgGiElu6Ematelpm0nDrAss5%is8u7v6;iv,&f;ges4Nlffa,ti%0;e6n0sa;!e1];e7_,*c6;!>,n0;da,ff.2M;#ra25im?,op?;cipso1l6p6;as;g@,i6nup,&me;r.,v;@c,i+r,$cs6;a,.;af7]v,od,s6;an,@c,u;!s.dos;cca[a,d(m0gorra,iHlFnCrBssap,t6un#+,vi[a1H;/im,lus4n9or,r5s6;!aved,e7it(,o6;cric,[os;r,to1;ac,_;bmog2ellPg3A;g@,i6oiznuf;fn0m6;ode1r#ed;o6rap;cric,v;gge6rav,v*uf;llM(ip;e7$6;cr#sic,tinuta%;c(rf,dNgev*n,hgMiLk*ywen,lInBr8=_eip,v7zz6;~s,urba;/1Io$g;a6ehgnu;rr6vab;ef;aBeAgolob,i8$iv,o6;g)a,libab,pp6;aig;c,d`l,r6s+m,%elap;ot;d_,s;bZd,lim;ap7l6;ag;!en;lgup,n#a;otr5*b;a(c,e7(l6;]f,o,ri;vs;aGbeDo7%@r#6ug/;!)txe;cdrah,i6`s,s$f.,[ur27;gg9r#6;lu,n7s6;e,op;a,i;am,ep;l7n6;uf;ec;eK/HlBn9t$m6;elp7/6;a,laf;m0pus;/6_l5ul;l0pics.;a,l#s,o6;c9ev8gn6p,s;a6is;!i<,[Z;la;es,i<n3ricimes,sum;i6ucC;bo6m;m?,n;lcun,n/;i9$7ossasolg6;(;c.es,r6=3;ep;f7l6;c2`;fa;i7*f6;ed,i7n0;(6rp;nu;aYg2Si9l8ove6;dol,g6n(g2*vafs;a,e1;eb4_;b7de,ga,?sor3ss#,t6v~s3;asr3(c&m,tat;aKi6_?,ulos;cHdDgCm#,nB&9s6%ubm0;&v@7+6;cca;!ri;fe1p6;@;#to,op?;>.,nuigg);ev@p8n6;#6of`c2;ta;!?;so6ud6;`c4;cifit$di,dimC^&p?,iAli?ssa,r9s$psQt8v&sso,zz6;@6/itu;ppa;ad,n0+rra2;=~s4ucY;cc)=4lgi33r6;av;*f;br3c1Td1Ne1Kf`i<,g1Ii0Vm0Qn08p07rWsStJu8v6;an,e6o,ral;.^,o.^;dEge,sBt6;>,*p9s#,t6;)7e6;cn0go1;=0;!o&a;iv,+s7u6;!];!_o;!iv6;.2;a%,eg3ibXn6ot,s5tela.;e7o6;rf,zziV;dicco9i*8m6;i6un_;csan4g*s4t$s;-d7d7;!-d6;*n,us;a8r6sol0;ev6od;s)t;b,n;eCips,oAt8u6;lp,t6;an(rpos,tur%;n3s6;a,ehcG;c,t6;sap,t1C;b8]m,s,t6;al6tel;!l0;/;ap,icinum,~sipe;aMeLiG$Eo7&6um0;f2v2;g/5i7m6;*;di&m,ga%,<n#tRs$m.iBz6;a8o7*po1uti6;%i;mo1vR;nn0tiv)g;cPi6;b,<;d8f,grVmo7ps,<tod,%6;#2;dda,n;r6utig`l;ac,o;p,r;!ig0L;i7r6;#,o(rR;cEs6;#t6sL;ab;cRdOgell0hccorrNnKrCvulf,z6;aps,$6un;m9`p8&ff7%i8uq6;es;.;+;ed;eBot6;a9i6t3;d6rr#;e,$rp6;?;ma,uqe;gan6s;am;a7eg6o?<8;!n0;rc;ap;),e?tlCic7n6;_;im;alg,]vo1;@,uin0;<;rr7s6;um;us;)%Ai7$iza,u6;ac,ef;l7m)6;ip;os;!otua;adBcAi8o7s6ud;if;f,v;ss6tr3;el;ob;]s;ev;c6gnul;c4ePi6+d#;dNfIgGlEmDnCpit,rAs9t6;/5(,s6;itT;op;if,salc;oN[6;ele;accGc#,(t>b,o[#ihcO;ihc,o`ce;bb6latE;up;am,olo6;eg;)gotamen9i6;ce7t$i6;cs;ps;ic;^;rg;>;a8io(mu,(rg)7o%6;uc;%;c7m6;on;ra;aDi6~e1;lpud,<6v;av&9i7_,tudo1;rp;cn6de;iv;sn0;~;n8pac2uq6;ol;];#",
    "Imperative": "true¦vai",
    "Infinitive": "true¦:!1:#$%&()*+-./<=>?@[]^_`~:ir,ni,ra,id,ar,ts,na,oc,er,se,ca,la,ba,sa,ed,pa,rt,or,am,ta,ro,ap;0:0I4;1:0HB;2:0HY;3:0G0;4:0I1;5:0GY;6:0GV;7:0I8;8:0ED;9:0H7;A:0HV;B:0GP;C:0GX;D:0ES;E:0FE;F:0GB;G:0BE;H:0HJ;I:0HW;J:0C1;K:0GK;L:0HC;a0J2eNiMo0J2;l%f,s%f;lr0J1n%f,rM;aBUe5Ai03rM;aZe6oOudM;a5=,da,eM#,nV8]6J;!d,r,s;cc(,i6pMt7;!eUiGmSoRpOr0GVsM;!a5e,&Mop;!e3$;aMo4us0BX;!rMtZY;f,tn1v8;rp2tt8;i,+M;!?,#,s;d,rp,t*;d-,[M;!eG#,n1o3sMt0CU;!a,e,&;a4Rb4Lc4Cd3Fev0f3Eg3Ah36l2Pm2Ln22o21p1Ur11s0Ut08uSvQzM;n#WCzM;~BiM;r3T),vM;$,va;asn7resM;!#,>;b#t00cZgVlTnSqolr0GBrPtM;a9i)M$,_p;eGi,nDoMus;c2rp,s;f1P)M;i,$,oM;!c2;imCS*;fM&,ove;!?,fa,#,nD;esN*l,%M;!d-;!e,nDo3rAsM;e,us;a,ric;-,n1s&2_;~04Xe06l05n01ov,rXsUtOuM;lgKnMrb=,t_;ac0%9;aQepsPiNoMurb29;bBgibs,ihg0;f0uqs,zM;!za;&0os0;ip@,mI;abBeN#tM]%,ub]ri;$,t(;cHg,l<,vHS;~OevNoM;=,ma5s0AI;&,nDrAv0BR;!iGm7Js;aOeMot0up@;izaFm4p,%ug,sM;!e3#,nTBs0AV;gig0%g,.p@;^s,evs,ofs;/,p@,rri;ab,iuqRnQoOsM;~01Zepsi,oM;r%,t;iMl1QteipBvren0;ruc0zeJV;^IecQ4;/,-,$,rAsE;a0BeZffo4gYoWpUrRtPuM;aNcs,d0rp,tM;aWX%p;p0FW.;eMin,lop,n1un;ipBv0;aNetZ4obM;a,=;b,g,ms,zzib0FR;a2oM>0;!cJ7;givn7if0E0l0CRmMpQ9t%p,vaf4;!it0;^BDipB;da,fUgSiRllL5nPpOsNte3ug,vM;#,opB;$PM>;!eGp8.;eMi,*;c0t0;f0snOT;gM&,$;el<,us;!a5e7YfM#,nDo3r0EF>5;a,&,oM;!rp,s;iC9pMug;m+0DK@2sM;!a5&;aQeO#,l0C9mNos099p(tt(,rJuM;cnD);ac,e4Z+;cMr9;ce,-,n1rA;cMr;!usu;c,ig;a02eVgUiSoRrOuM;!#,m095p,rbM;!=,mi;aug,eNoM;f2t;c,h6;bXEilgoK8mI@c0rd1B;fMggur%,rf;!?2#,s;is0urg;l,vM;!e3iQn5EoMFrePs,vM;aMos;!rM;p8tn1;p,t0;d4Dr;cHr9vM;!oi0Os;(b,-g,&-,ov,rM;ehNoM;d0AM);cs,g;a00epes,gog`0iXlRoOpNuM;a,p2;m1pus;bNdde03HicciKQmKp,tMveiffa;surb=,umI;a,?0;aQeOoM;bMmmaC;!b8#,s;bMns,ppes0AM;=,mi;f,ig0;=)Nhcin*,tnMvM2;eg0;!e3#;i)ebBmrNAsM;!a5#,>;cMgav0;cNi_HM*M;ibBrgs;aFIet0DQ#%;!aOgM%le;a03BuM;f0C0m,r;!-,r0CQ.3v;fumI<6;!a0Gd0Ee08iZ<m,nVoUrOsEuM;!aMcHre,)1;!lpZD.;aPeOoM;!<bs,sM);e,>;t0v07K;!ilgaM)0CH;gn7;!)uc;aNi,oM;c,fNGibB;bY4c4lb,rM;b,g0;bS/0g#RllQmPpNrM)af0v#bb(;!a0`0tupB;eMi6r0DBu9;it0;it0u0;~B;ri;bu09K`Mu;mIt0;bQ<m,neb,pOrM;!gMp;-,ga,o3>5;mi,sM;!e,#;bo09Do;aM-;!r0CM;!b7ibs,rM;g02Mt0CB;lTnS]I3rQsNuM;c0AZrds;!e7uM;!#M;!ouf;aMe.;f05Tm,s7;as,iv;aug4odda;b04DiQmaPrMus;epus,oM;f,sM;!>2;!bm7l;bBda,l<,$,o3.;[,ug;(t64b62c5Ed3Jg28i21l1Sm1Jn17p10r0Ts.0St05u02vM;a00eZiSloPoMref;d2ip0AImNumM;!#,m1o3s;#,m1o3;sNvM;!a5e02S#,$,s,va;!-,#,s06M;rcsNvM;!#,n1vaN7;!aOeTZiN$,oM;cric,tt8;!d,r;!rM;t,v8;bBc7;!eneb,#;g$)Mq$lK;e,&M;!d05Q;al,e06inAnAo03rev01sisZtNucM;$,s3H;abWeMof4;lfUmNnnM;a,+4W;!a5eMJiGmQoOrAsM;!(tM&;!elet,#;!*m,rMtt8;pZKt6O;a,i,oM;c4s;!eG#,uneg;!=,iGmD]0B6s;eMnDrAs08M;!d,+,r;!a,o[M;n1.;cNp,ucM;rep2s2;rAs2;f,im,pM;!-,#,m1;!#,tWG;~4eRr+M;!cPeT0#,nOreNsM;!a5&,*5;p2t0;iC+;a,o4;hc2ihc,sim;aReOm]Muc;!e,&,o3rM;et0i,+;cNrM;!);-,rA;c,r,s2;^WetRgOne0AHopNrecM;!es,n1sL;?,#,mDpo,s2E;aip0BBeFiNuM;igAKp;c09Np68r)SOtTS;!?,#,nPrOs05TtMu*m;aMo;![03P;~W7ep;^,+;!#,rA;eSiOo3usM;!eSAn1sM;a2us;d-,rM.;?,&,pM;eGmMpo4.;i,+0AG;g,rMt;f,p4;aS?,lOoM;c,d09Ms,vM;!#,neb,s;eMotBY;cce,pNvM;!a,&,s;-,mi,o3.;!c,vM;!e3iHK$,va;lgOpmM;eM+;!da,#;eOoM;cMicsCUt068;!/C#,$;cs03Uvs;aip,g0Ki0Hl0DnW]%,rM;~sRRePoNuM;!s03M;c02Up4sM;!#,$,>;!da,mPpsOtNvM;!&,n1;!?,>;!a;!e2mM;i,os;aYeFiSuM;!f09LigNm,pM;!m1.;!gMnMKsE;aMos;!rM;!p8;cQf,m,pOr)NtM;!$,s,_;!a,-,#,n1+;!?,&2sM;!-,iGos;!/,-,$;!ipNlc,rfMt;!fa,#,$;!#,mM;#,+;a,ovNuM;d0fAX;!(t4#,nMopJs,va2;iQX+4;dD9ffa,lNr0JsMv;e,*5;e,gen,&02V;(tWeTiOuM;r)Ms;!?,&;fOlfNrfM;!f8;fa,$;!a5e3fa,ic]c,nM;i,+4;lNrMto3;!e,&,`UG;!e2#;!#,t8;a1Be0Yi0PnZoVrUuM;ag,ihcRlNrM;p,t3H;cOeNlM;a,i04Q+;!d,rp;cUW-086nD.;!cM#,n7sL;aCos;a2epVOomF0;gOlpNrM;!e,r1;mi,.;!(9;a0AeTicsSoNutM;n1to;c>PfNps#M;!r1;!fM#,nDo3>5;e,&;!n;!-07R;cYfXlE7pUrStNvM;!(8I#,s;!e3nNo3`p,s15tM;a045os;iM+;!(f,rMtt8;p8v8;!pM%;!aMI#,mD@Cr8;!?,iNo3@2sM;!iGos;d,liv;!fo,&;/2$,sM;!aDFiMo6;dMr;!#,nWX;cs,ps05Irp;cQlPrNs019uqn1v&M;!dus,n1;!?,rMtXN;a,i,os;e,l1;cOeNnM;iP7o00E;d,r071;a,o,u;cUiSl,rc2sQvM;!(tXFe3iGo3vM;aM]p4;!rM;!t0;!e3#,sM;aHZop053;hc2r,sM;e3#;!cOeN#,nD]Mr05R;p,t-;d,r06Ot*;a,e,us;cPrOusNvM;e,$,rA;rAsE;!=,t;!/2?,#,s;a06e05i03lom,$v01oZ`tXsPuM;dMl2;!da,eM#,$;!r,s;aQeOonM;g1+M;!#,sL;m,rcM;!/,?,#,n7;nMp;!e3iM;b,r;!#,n1sM_;!e,&;c,d,n,uM;c04Cn;!aMe,#,n1va;!r9;deMl;neb,rp;l,r;iMt4W;gI0pM;!m1sL;!m+M;c8$;#,_;b05Xc00MdYDeY2fXDgVZiNJlJVmIMnEEpDIr9Os8At35u2Pv22xob,zM;l1Xn1Rr1NzM;a1Ee18iOoNuM;ga,ilgat,$ms,p,rF;b=,c,gW3ihg$s,m,r9;a,bmo5c13d12enegomo,h6l0Bm08n02rUtMug,vaST;aPeNl+af,oMrEJ_,uH;npi,pi;=f<,fo3mim,nom,rcn1tM;$s,.*;fne,lov,mMpmis,rcomKvi3;eNgi9m(d,oMua5;%,s,tua;let,t;!aRdODePf,&0oNps,tM;acic,s;<v,mem,@v,rret,snoFtM;inom,ua;nPPtMvlop4;>m,t(J;glov,ilimaf,lMtn?es;lRTog-;aQn?0oNreM;dom,t(f;brJga,l1mNrMt$s;c$s,i;?,%;g`2mu,v<g;alc-,elop,iNoM;d8n+e;$m,tto;aTeg*ve,iOliuqQFoM;bMcEUponom,vepl1;atem,mis;bNre9tM;alov,ref,u2;aMisnes,omPJ;snops-,tM;n1s04Y;brev,co03dP4e02gel,iZm`YnTrQtOuM;siv,tM;nup,.04E_;iMot,sop;gEpJv7;~,eNomKtMu_n;nec,uen;bil,neg;aPep,iOoNretM;$,.;iz(,srA;f,m#c;!c;f,n;cNrMzi0;et^,)ud0;eFiffu,os,reAU;di,r;f,l;otem,%d*9;iMolev,`.;d0lbbup;lo,mQpPrNt_b2vM;&,s,va;ac033pMt_;!@,sL;aTE@04Ms;&,s;bm]9cP8gSipRlovs,mPnOpNrMugs,veb;ab03S&,+4`6;(9mi,s;gihgs,%9;aMma;ih6r9;!m7o6s;a6eiF;eOoM;fMms;!f(,n7s;fs,h6t4;aOeNip049]M;!bVJ);dac4ulf0;dQLrNvaM;!rp8;eFp;aMif0;!bNcOP#,nM;i,$;!b8m7s;a04e01iT<s,oPrMu&a1;al,eMucWH;nTOsM;!e3#,n1so;c4dev,ig,nOrM;pMt2;!#,m1@ZL;-,#,$C;h6<s,rSs>p,tMvvaC;l1nPom,s019tM;aNeM;ggPOibo;!c021#,sE;a)8eM;c0ve3;?,p,%;lMn;!eDQ#,lM;a,os2;bs,c010iOl,rM;b,gM;!ga,s;hc4;/ve,d00gXnUqStM;aQeprAiPnecHtMum;a,eMulf;cMffe;ce;=2s;f0t;/M-eF$pCJ>p;ics2<i6n*;etNiM;s0tn1;.,_;eNnM;assEi8P;da,lE;(g,ivOI;a4Ne4Gi3Kl3An24o20p1Zr1Ps12tVuM;bi5ce.,fTiSlPmOn%9pMr6t;!-,mMsL;a,i,+;!a5m1rA;!aMc-;s,vM;!#,oUJrepus,s,vaD5;a,f2;-,n1;a0KeZiVoOuM;b8Sl,rM;!b,e,f4;!bRcQdPimmi6lOnNppJrM;gga,&,t;!*,rA;!f,<bs,pm1%p;!a,#,n1;iob,s;!`b,s;b=,d,fMg,ls,p,z;!fMoFA;aMos;!bus;as,b04c03d02f01g00hXiVlTmu,nS]ip,pQrPsOtNug$c,vMzzeF;-b,ic,s;!iJV;!-,>C;!c,fXT;maz,o6@ihc0sM;!a,e,iGo92;!^I;eot,&,lMot,u6;aLL+;bSFhcM$,o3ppo6;cip,rec,sif;cMga5;cMite,*b;~Boif;!gosV4#,o3;fa,&,$XK;!$,sE;/,r001;<b,mM;ags,o5;!=ScRda,hc,iQlRHmPpOrMtnKGuqH;ab,bBfs,g,tM;!#,<m,n1;!mD;!`f;h6pMK;!/C#,s2;ic,r%;!a05eYiTnDoOuM;gMigga,rf;!eIMsE;!cPpOrNs,tM;!t8;c0%;!mD@,s;!/,sL;d,l,ms,rOuqNvM;!],rZHva;/2nJY;!tM;!_C;dRfQlom,m2nPpOrNsUDtM;!?,nDo3_;!p0D%;!lJmet,@;$,uf;!i*m,$;!#,oF;b00BpBrNtMug,vK;!acH;p8tn1v8;aUeRilf,oNuM;!cK;cs,fnJJmIpM.;!?,#,mDpNsM;!a61e,*5;aCos,us;cNl<,sM;&,sE;!/,nWV;cQAp@,uqs;ac,o;bOd,lip,nNp2rWQuMv;n,q,r,v4;!eHOnV8;!as;a0NeWiVoOuM;!igMpZ5;!gaC;cQmPrM;fNpM;!mi,@;faCn1;!a5#,ma,r8s;!/CiMs;dn-,r;c9Ef;cHdVJi0Bl09mW%pVsStPuq-f,vM;!aN&2$9CoMs,va;d,r%;p4%6;!#,nNsM_;!o4;i,+7J;(,eM>;!rpM;!#,@C;mi,@;aWeViTmSoQrNuM;a,cod;ef,oM;dMt;!da2;c,f,gM;%,s;(ER+;c,des,lMrepsX2vom;pm1;c,lpBrc0s;dnof,lM;!og-;!lMoiv;aCobs;bIn*,`V4z~;cOiMllim,mIugga,v;h6pM;!a5mi,p8;!?,$V0;aToPuM;cNm,@tJsM;eC#,nDsus;co,sua;cNvM;!a5#,$,s;iGDsM;!a2;b7f>,ms,p@,sM;!e,#,>;a0Gb0Fc09d06g03hcXBl00mXnWpSrRsP_l,ugesOvM;!eMnDs,va;!il,l;!rA;!e,iv2*5opK.cM;en;^,em,iFri,t;acO-Nice3<Mm1so;cs,p;c,);!eG;if0;iNoM`d;g,v;!lY3;a,iM;bM/f;a2?,issopBom;a,&,+NrugM;#,$;!.;da,eM;!m,rM;cQUe;!aQce,ePilOnDogaf,resNsusM;!-,#;e,.;ef,l8p.;ll8r;pJt;aFI?06`,ud;!rbs;fo3gev,hcWFiQlpPmIop,rMssRUuqH;!cMges,prWB;eMn1;d,s;m1.,ucol;l<,uqMvL;!/,$;!d,f4iNlEmilcHn,rdiTM)MugMZ;n1+;fTHmMP;a0Ve0Ti0Pl0Nn0Jo0Gr0CsPuM;!aN=,cMf7#,m,n*;/,#,sV8;c,p;a02eViRoOuM;b,cMl,ms,r;n1sE;cs,dNps,rM;g0%;da,$;!bOfNlMmEWr;ce,g;!e3fa;aPXus;cRfQgPWlPps,rNsMv;!sopWK;etT2g0pM);!pRV;!pm1;nTJo3;!&,o3;bQcPlOmKXpNrg0t,uqM;no6s;!a5-tlo,#,r8s,yb;!crus,#,l1;!(f,$,s;!=2#;evNoM;b3Ts;!(tFHiMn1r5Kva;d,gret,r;!c,d,iNpMr%,t;!#,sNL;hc,ruc;aOeM;d5NpM;!#,mFKsL;!c4mI[;af,upM;!mi,o3;ce3f,l,vM;!a5&,vM;aCoM;rpB;<pHLpMt;!p8s;b,cOg,n,rNtM8vM;a5$;!b,f5V;/,n7;a3Ab34c32dauqH0e20f1Zg1Ti1No0Yp0Vr0Nt06uMvo*m;a03brJc00dZf,gXiVmPSpUsStM;!aQi5lucHnevva,`t,sPtM;aNe9SiMo,ur)2;p,r6;c,f,rf;!~,im;m,n,s;em,imLEnec,sMu;ef;!?,@;=,gM;!nSC;a,ifMuaOJ;!e3f(,n1sSQ;!$,rA;!/,isNo3sM;!a5o;!>QK;!)M;-,$;al01e00iZlYnUsM;aSeRiPoOuM;lMrf;!li,rA;ig,mLrp;g-,$mM;!mQ7;^JCdR2hc`,uqes;cO3n;eNi,+M;!$Cs2;!bus,cMdda,#,vs;!/,nD;ifNYo0;b%,c<c-;nepKMprAr%;!odi;aSePoOuM;bUIsM;sus,us;b4vaz;!=,fQAs,tM;$,tM;a,osQX;b4gs,n,pJQ;mNoMu9;da,s;et,+2;!b08c07d06f05g04i00lWmVnUpRrQtPuOvM;!al,?,&,rM;ef0;cn7;inom,s7ua.;ep,ri;aNrM;+0;sO3ve;giU1oQJ;!an0e0N&,`m;aOoNpM;?,mi,.;c4dQ4;cHvH8;fOggNlgMretK;em,im;^,ep;fa2s;lof,ol;!rAs;!a,o;/,?,lude,nHFs;alM]r1;e2l1;!da,gQlKmPpsNsKtMvRU;!#,s,_;!aMeCi,$,oFK;![;!#,ma;!gaC#;aQeOiMol;mMnK;!e,mi;l<Ct$M;!-,sE;mErf;fog,icTJ;a,b0Mc0Kd0Hf0Eg0Dhc0Ci0Al08m06n02pWsiVtSvMzza;ePloO$,oMva;c7n*,rM;pm7;ps2;bT9sM;!rA>;alb,iNlM$;a,uda;-,lbo;mm1;mPoOreFsNuM;~KcRs,tiv;!a.,&,o3;!da,i6+;etMi,+;!s,to;eN*,o.,umM;-,#;gMv;!?,#;olgga,unM;!e,n1;cs,ecLVlM;e6ot;hcM*m;/ihc,s;cuz,>m4;a.,gub;fiFiM;cMgel,lo3;?,ov;isNnop,oM;f4m;?,&,nBT>;!aJE$Mr4N;![,s;ilSH<LGmogs,reviG;asMe.,ul;n1>m;ac,elec,iPmMucule;eNit,oM;!da,gIJ;m7s;lMv;!ac,iuqe,$;!b,cn7ihcPli.,mIpMt4v;!eNiMmD@,sL;r,uqe;rp,s;!&,s2;a0Fe0Ei0Al07m02o01pSrQsOuM;ccoMi6%5;!e3sE;aM-c0;n*,r;a6i)e,+HuM;su,tK;aRecKVi6oOuM;livMrggaCz0;s,va;cHip@,lNp,rg0tMz;s,t(;ag;cNihcQKl<,m,p,rMt4z;d,gga,);&*,$,s;cs,d;aNoM;p,z;cNic0l,),vM;&,va;!/,s;aDAoM;cMps;!$,sL;cNp,%r9ssEtM;o-e9s98;et%p,itM*me,s;*,sop;is>,p,rc;c4rM;!?,%;a3Je3Ag2Ui1Bn17oYrOuM;daCigEl<,mGJrb=,t`M;f0pB;aUePoMut;!da,fHAiHLtM;!#,n1sM;!(f;bi,dPtNvM;!og2s;e,<,$,sM;e,+;omI;c0);b=,c/t,d0Sf0Rg0Qi00lZmil,pYrXsVtNuMznJ;b=,s2t;!?,#,nRsPtM;aNobM;=,s;g,r9;!aM;b,c0;acHiM;!ps;!#,rM;epB;dog,eF+JHps,t;as0mat,pFJ;c,lehgib;g07lgN6pmJsZ)XzM;aUeQiOnMom2W`po3ulov7;as,eMuf;m,vv8;dMrf,sop2;da,n1;fOlNpMrEs;si;es,l1;fa,n1rA;!lMrf,);-,l1;eMu;gn1uq;aCQel,ivSnPsM;~BIeNimM;&,m1;rpBsso;a6eM;mMpJS;&7;!-;aOiM;rpPGvvM;]p@;c4r,);a%p;elet2otic;!#,nMrA;ab=,+;aOeMit$t,os>;cMpP8tnet;!/JF;c6RdOSffa,g0p@,so,zza;a13b12c0Xd0Uf0Tg0Ohc0Ml0Jm06p04r01sYtRuOvMzzag^B;&,oMva;d0r;gMq0;!nM;asIB;aR*lov,sPtNuM;mIr6;aMep4;m,p;(co3eM#p7o;c,d;l,p,rg;ac0eNomele,>M;cs,s>;d,l;aNb4c0g-AoMu;!i6;f0m;(,oMs;!rp;!aXesL4iVluUmToQreOuM;lMr;!li;g,tM;!?2s;=,dINgs,nM;!?,#,*M;rp8;acHN+;c,f;le,rcM;$,sE;.2tn1;a3cNleMub;ccu,tnec;eG$;!/M?,$;fs,m;^Bgivoip,#o,rNuM;<b,m7;aMevs;!mM;e,#;faCnL0]9;(g,ep,n(g,rM;a6oM;!bus,#,+4sE;aP/v,ivOo[~,rec,>NuM;c,l<;fK8[;!vaJ7;b=,m;=,m1rut;mI[;aZeUiRoOuM;gum,pM;!#,mi,o3.;gNlobs,sM;!ibNQ;a,rev4;d0hgN<m,rMsKvs;f,gE;!g8;dB0gnDl,pmiJXrPsM;!&,n0P>M;!rM;!tn1;!pB;b,daug2fJl,m,pm+M)2;!/2;cTgisso,iSlQmPp90rNtMv4;acDO;!a,d,esMf;!s(;!ac%b,iG;aMevva,i3Q<;!b,t<;<,p;!s0;fUgods,iSlp,mRpQrPs2tNvM;!(;ipJnMs,tuF;~B#,olDG;bs,f,gDC);!a5&,mi;e,o3;<ti,pM;!@,s;at,o3;a0Ne0Ki0Al08m05o03rT>Rt7uM;fPih6l,ps,sOtMz;n(f,sM;+LQ;e7n1;!o3s;gMisutne,lp;`;aUeQif,oM;!fM;!?,iNnDsM;!a5*5;nu,r;fMh6;!fNnM;i,+2;a2os;!i5Ll<,sE;d,gas,lpEnM;!em,*;aNoM;gs,sG5;if0m,rgo3;aMif,+;c,ps;cUdiv,lTm,*2rSsOtMzza;lu,$,sK8tM;igel,o;aOeN*,soM;rp7O;demBrc;ib,ps;!/l;!bus,l1;!a5?,n1;cs,f>NrM)is;!c,t4;lb;!c7d,fRgQiPlNrMslKUtt];!b,&,t;!cM;!/,eGo3.;cs,hc2;<Is;!fG0$,s;a35b33cic7e2Vgis,i2Ol1AoZpmeL9rV>5uM;aim,bTcSdRga1lQmPpO.,tM;(Msop;gn1;(c,i9+;e,isHT`f,ucKF;lup,u;a,no;aie,eF$,ric;aG9maLH;aOo,uM;!b,iM;c,hc;ic,pJDt;b0Vc0Kd0Hfu0Gg0Ci06m04p01sZtUuTvQzM;nOzM;aMur;ps,r;ep,&o6]ig;!aNega,iMnDr8s,un*C;cs,r;c0tE4;r%,s;a6-gs,iOlovva,nN]Msu,to5;!%,s;(,ev4]b;moM@c2r9tDZ;gg(;a,?,iMn1],submo6u;!p6F;()e,-6i*m,opN@M;[0;#,s;!e5iMmi;c(,);aQcNgMhcc#6v;gu,]c;cM#bs,su;oMurds;g4ns;t_gs,ug;aim,ett13iOnMogiz%,reb,s,um;aMog;ip,r9;c,p4rfs;[0s,z;!nM]bs;ep,ib=,oM;d,ic;!atVcTeZiQlJnOoig,sMungaip;!aMem2;p,[;(b,ivM;!&,s;ev,m`f,rNtM;%,.g;ep,t^4P;a6oM;cIYz;net,so;i5mae3;a0Ue03iToPuM;c,n*,rNtM;>5;!f;bOcNfFGg0m84p,rM;!c4tn1;!/,?,$,oto3%b,s;!ig;cUgTpRrQs>,tOuqNvaM;c,fs;*5s;$6sM;!&,$;b,t4;mMs;az;is,$g;av,of7so;b0Ac08d06g04m03n00pXrTsRtNud,vM;af,iDU]%,re6;(ffa,lOnNrMs1;^,oF;^s,up;as,+H;!eM;c,rp;aOeMig,)(,ubmat;h4AtM;<s,nJto5;tnJ;pMrHYs;aM+;!cs;aNnM;ep4;!g*m;(Jeg;aMgus;lf;oMubs;cs,m;aMcu,nJ;m,rfs;!?,#,mMr1;aicHiz;bPf,g,ip,p,r9)OvM;!aMva;!cHK;!i,$EX;!a5=,mi,s;bPcuf,fOgivBMmis>,pNsKtM;nev,s,um;!?,mD;!?,fa,#,$,o3s;is,uM;ig,nM;bo;b,cRgQm,*,pPrOtuNvMz;!-,#,s;ac,t;euq,r1;!a5s;!nF2rus,sL;!sM;im;biMmes>;rd;bJcOdAg-,i6m6DnMpDQsG5t`mB;ac0gMi;es,up;!rGUs;a7Zb7Sc5Xd5Kel0f5Fg3Ah2Dl17m14n0Yo0Wp0Qr0Fs0E)0Du09v04zM;a00eFiXnOoN`vEzaM;c,p,r;!gDR;aSeOunM;eM#,*,o3;d,rp;cil,diOlis,reN.3tM;nes,op;ffE;ve;$fM)L;!+;fu,lK$,po3tNvM;!es;suig;d,ps,rMs;gM);!$C;a5ePiO$C`Ns,ulEvM;aCNo;uf;hc%;d,l<,rb=;bOqM;esso,olM;l1]F;=C;inIug*;a)e,?,*,%t0sif>;aUbe0c,eToRpPtNuM;f0ig0;~Ms;m7.;ic0]pM;@,.;lg,tM;%m,s,tiv;s,t^;c,rGItnev0vM;!a,s;!ic$3me6oPpM`9sEW;al5Yes,oM;c54dM;!d(;cMrp@;!#,otof;g0ig,nM),u6;!*;aQnulJoPrM;epBoM;bs,tM;!_;c,mi)et;lEms,r)EJ;e3meN+ne,%M;ps7;dnev,)eb;a0Qbo,ec,gRiNo,pIucM;uc;bOcMffa,mu,.;imod,nM;+2;(9omI;a05ev04iSoNuM;b%g0f%f,t_p;f4g`DTmOps,rNvM;nDs;bFUt;ma,rM;eg;bVcUdabs,f,mosTpRrQsnCUttoPvM;!(NoM;rgga,zzog;^,em;bBs>;bs,g,o,);!acH#,mM@;i,o6;!>C;/,`t_;=,sM;ib;!r8s2;bZcYdXf,m4*tWpVrUsreb,tQuOvM;!aM;bB[;gMq4;e,g(,u;!#,$,rOs,tM;aM?;!b;at;!abs,?;%Fs;_;*6;!/b,$,s;=,rDYs;!mI;cPgM;gN$M;r,vva;ev,um;cSnofob,rQsM;(,iM;c$c,f83mNrBTvM;en,$;!mi;^,eMom7;cDUpo6v8;a04e01iUoQuM;iMl%p,mIngadaug,s2;/Ng*M;ip,m;b4ip;!=%6da,nMrc;(NiM;f0g0;gs;d`m,ggRhQmrPnOpN`val,sMtnJveb;],sot;!mJ;!n(;od;coig;el;nn8ps2rNvMznup;!$,s;~D0o;bECd7icurb,leFm,p,rNtM;abs,uF;g,i9;a1Pe1MgTiQnOole,`f,uM;b,d0f7gMtt(g;*5;aMev;c,m2r%;b,fN<Mp;vs;fe;a16ePoMu;f4lNpM;!@;<,s;b11d10ff0Yh0Ri0Pl0Im0Gn0Ap09r00sXtNv,zzM;ac,ev;lUnRrPsN_M;!p,[;ef,oM;!c,p;~,oM;c,s;acrem,it,oNuM;p,s;c,rf;ov;rM>p;a6oM;b,s;aTbmo,oQrOtMu6;eMsK;&0;eMo6;ug;cs,mNpMvaf;met,`p;a,ur;g,ma,p;ac,maDVres;aPe6nOoM`t;rMv~;d~,t;ad,i;ip,m,tMv;ipJ;i3maif,rM;a,o;aRev,&,lPoM;bmis,gettA#tNn,s,ve/M;ip;ev;aMiv;f%f,g,p4;!v7;hM%;cco;cOgM;av,rM;og;cOe2nM%p,s;aM];!if;as,eb,ob;aMebs;ih6;no,%d;<,mo5;g0iSmo,piuqe,rPsNt*vM;!va;!>M;!m;!oNtM;lo;c2Lf;p4v;livi3rM;f4pM;!sL;!da,lp,sEtn1;fMnog4;aMos;nMrg;i,nM;a,i;(XeUiSnPoNuM;p7);!rM;~;eMi;c0pM;i9m1;cHsM)af,v0;e3$,sus;mNsMt;$,>;!#,m1;!ri;a1Ec0Oi0Il0Gn06o05rYsPuM;diNrM;b,c;fs;!aRevQiPoOuM;gs,rM;f,);g*,ib=,lffa,mJr6;l,p,r9;];!bNcHf4lM;!a5#;!ma;aQeNibs,+M;/Cs;bNmM;m1s;!b(;m,uM;qs;b,fs,rc45ss5Fv;aQiOoNunM;e1I#,*50o3;c9XrbB;l,m+M;!#,$C;gPic,lM[;!iMs;bMr;!]AGs;ga2s;aMes,uF;c4f,[11;dPfNmop,nrM;ev,+0;eneb,fM$;o,u;aMus0;rf0;aZeWiRoOuM;bs,c9Gic,rMs;c,t;b4cs,d,g,ihc,rNtrM;acH;p@,%;ms,pPrN)M;~,ib;@M%;cc(;mi,]9s;rNtM;`6;f4t0;cWfVihTlSnRp9XrOtNvM;+H;!es,s;bN`b=,tM;!n7s;!=2mi,s;im,ob=;!<2os,s,u6;cs,gM;!ga;fa,n7r8Qs;!#,o3s;bMp;!m1;bPmM;aMes;!cM;!c3H#,s;aNeMiffa,ud;d,n*,[;g0r%,s2O;b9Kllop@,p@,rMug0;ds;a0Te0Ki0Clu0Bn06oXrSuM;fPiNrMs;f,r1;csMn1;a,o3;!a5#tnM;ec;alPeNogMup;$,s;b<,)Mv;op;!<;fTiSlPrMv;!=,d,eNo3rM;a,et0i,us;!d;aNipe7<,oMs;mo;&,tJ;gg44;fa,s;aPiNulM;!&,<,o3;lreb,ps,rMsul;%,);f0rF),v;mo3vE;do3lbSps,rRtOvM;anMel;!mu1V;iNsM;ac,ev0i,uf;l,m;!b4ri,t0;bo,o;ipSlQnOrMs;f4gMp,);es,ga,n1sE;!=,nM;a,#;!eG#,lMs;a,+6H;!#,mi,sM;!iG;c,d0ip,lQm,pPrNvM;!&,]ig,s;d,fM;fus,uan;!#,o3@;eF&,<;!(06e03fWiVlUnSoQsNuM;b,g,t4;!iM;dM_s;!d8os;r)o@,solM;if;oMui5;c,i5r;og0;h6r,t;aPeb,ins,uM;bNicHlb,mJrMt,zza;ab=,%,t;!=,s;!iNrM;p8%,tn1;abs,h6;pu9rNuM;qil,s>;(,p,rWtup;gM);elet,oM;littMtof;ad;b,di,lUmrAnQrOsuNtM;(,];an;a,cMea,ual;!#,o3;ilNrMuc0;ot;?,<,oM;tt8;cuM<;ne;!a1Rd1Pe1Ni15l0Yn09o01rQsLuM;aNm,n77sM;!a5.;lMrfK;!l1;aReQoM;bOcNl,sM;>;/C#,n1sL;!=,>5;ms;bOtNugMzza;!av<s,#,s;!#,_;!mM;ob;cSiQl,m+PnOrNssM;aC&;!f,p@;*,s;!/,$,s;hcMrA;!$;/,s;a03eWiUoNuM;cric;!bQcOfNif,m,$,rg,s4HtM;!]%;!fa,#,]p4Zs;eMric;f,s05;agM=;av;hgMlb,rb;ga;b,cQmOrNtM;!s,_;em;!e,mM;aC+;/ffa,ivM;va;!bQ#,mM;!a5?,iGoM;cMd;!c(,#;d,r;bMs;(5F;aNosM;!>;cNsM;!n7;/,sM;!#M;!e3;br5IcZdnJfWlUnTpSrRsQuMv(g0;gNqM;il;!elM;et;so;!g4;al,e5;*;avMosn1;!nD;!fMn1s;a,&;ac;aOiNuM;l,[;us;rg;gn1h6ps,rMs;!e1D&,p55r0E;a,-fM#;!f(;b,ib,rMug;gM&,)30;!?,ga;a4Sc3Ue3Ni0Pl0Kn0Bo01rVsOuM;b0IdMig,rb;ac,e,*m;aRePiOobNuM;b,ffo,rb;mi,sL;fn1;=Mda,n0Zp2rf09;%;c2l,t0;aOeNoM;f0ps;c2m,t<;!bMc,m2M$,p,v;bMmi,s;a,os;fTig,lQuPvM;!a,eNiuMnDo3;qe;!#,r;f0ig;!lNsM;a5&;a,+;fM$,s;a,os,us;aOeNi5]Muig;!t4;le;bs,iO<Fm,rM);b41fM%;!fa,n7;bNfM;!fa,s;!mi,s;aMos,uc0;cOfKvM;!aM;c4[;!/,#;b2Gc29d21f14gol,l0Qm0On0Lp0Ir05s01tOvNzzM;ab,ip,u9;en2;aWeViUneS`RsM;aPemNif8onM;gaEo3;&,odM;!da;m2t*f;cs,v;mEtM;ua;rc;ll8n%f;fMrp;!fa;#,],rOsotMum;$M;!sE;om;aSbRoPrOtM;sMun;al,&;ab;c2tM;-;af,=f,ur;cPmNvM;e3&;a,mM;(;!c(v8#,$,s;os;m(Npoz,re0sM;!ec0ua;!%;^,rNumM;+4;of;a,i0ufM;fa;avXbVleUpNuM;rb;-,iQmDpO.,uM;d,)M;es;a,us;i,+;[,tlM;om,um;bs;bMup;up;!a5;ol;eneb,fa5iM;c0Ed0Cl08n03rZsXtNvM;iv;(UnRon,rPsOtM;-,uM;rf;im,uig;ec,oM;f,m;aNeM;di;s,uq;!g;<f,n0QrevE>lc;&;aNbMcRev,olg,teTup;ul;iMp;hc;aPgOoMu;b,pMsrAt;as;^,is;ip,v;auqOpmM;a,esM;!e;!#,s;e,in,oM;c1Jm;~MeF;!@7;eb;!(4=,eSnQuM;aOigM;!e3ga;rp;lc;eMi;m,v2;d,m,ps,rp;cP*OsM;aMev;ib,r9;ic;aiFipMul;@,s;ps;rMu;abM;=;cRfKicHrPsNtnM;^;!rM;et0;!p0H%;?;!/;a04e02iYoPuM;cM[4);abB;mi;bRcs,iPlOrNtM;!#,n7s;cs,&,%;ab,b4;cs,f,h6;cs;!a5=,miCs;!r;[;bmOc,fNlc,mIpMs.;!mi,@,s;!n1;al;b0Pl,p,s,),zM;za;b,iYlXmI*mWpVrTtOvM;(9ib;);!$,sL_M;!#,rM;tn1;+;!&;b,tM;s,_;mi,s;<;!p;cHf;/;bOc,d$s,#bNlp,nMp,v;ot0;bu,u;!=;a0Bb07i06mo02oZrPuM;c0rNtM;!it;!?;aTeQomIutM;!rAsM;^,&;ep;ma;/Ns2;!#;.;b4g;!s;lg0rpM;@;$;bNip,rMtn7;!t;!m7;#;c,l;ag,eluOoM;dMgs,ns;da;ig;ic,llM;is;af;lrM;aM&;d,f",
    "Reflexive": "true¦farsi",
    "FemaleNoun": "true¦:e0id5;c5d4llep,maf,nrac,rdam,t2v0;a0en;ihc,n;es,ne0ton;g,m;ihcara;o0ul;rc,v",
    "Singular": "true¦:e0;cDdihcara,lCmBn9r6se5t2v0;a0en;ihc,n;es,n0ton;e0o4;d,g,m;ap,m;am,da1o0;if,uc;m,p;a0rac;c,p;af,on,uif;as,lep,os;o0ul;rc,v",
    "PluralNoun": "true¦arachidi",
    "MaleNoun": "true¦:e0;l7m6na5r3se2tn0;ed,o0;m,p;ap,m;am,dap,o0;if,uc;c,p;on,uif;as,os",
    "FutureTense": "true¦a2do2potr3s0vorr3;a0tar2;pr1r1;vr0;a1e0à,ò;mo,te;i,nno",
    "ConditionalVerb": "true¦av2dov2pot2s0vor2;a0ta1;p0re1;re0;bbe1i,mmo,st0;e,i;!ro",
    "Preposition": "true¦a9co7d3f2in,ne1p0su6tra;er,rima;gAi,l8;ino,ra;a2el0i,opo;!l0;!a,o;!g5i,l3;i,l,n0;!tro;!d,g2i,l0;!l0;!a,e,o;li",
    "Adverb": "true¦:!1:#$%&():ni,na,tt,ce,lo,uq;'hc$,a06c&,eYiUnTo7r6sitarg,à5ì4ù0;i0ss2;g0p;!g0;al;l,s;ig,l;oc$,up;cKiI(s,nDpportCr9s7t0;ibus,(m,n3s2t0;os,ut0;!re05tarpos;eFo%uip;a0uV;cca,t0);!lW#;revar%a,se0;da,ps;evvZt0;eid0la5;!#;!rup;!em3i1rot0;#,ta;civ,f0s0;rep;!la;hc&rap,lgem,rpo0;rp;&,op;eb,is;a2drEl1$modopod,op,r0s1t$va6);agam,eitne(v,ouf;a);mro,ssa;&vGi&ps,m5n4r3srof,%onE)nu1vo0;!d,rtla;moc,vo0;!d;pmFt(;eb,ifB;eis0oc;#,sa;cric,dnocBiv,m7#%am6r3t0),z$tsabba;(vl1so0;ppa;at;es2o1p0u%iridda;os;!c6#f,%ut;ats;ir1mos0;#;pp0;ad;es;$",
    "Expression": "true¦:a6etulas,h3i1o0éhcc9;aic,g1locce,ttiz,varb;aug,comairug0he;if;a1o0;!b;elb,up;ffu,i1latnaip,ti0v 2zrof;nif allaf,psac;ggann0ha;am",
    "Cardinal": "true¦cQdHmilEnovRottDqu9se8tre1uAvent0ze6;i3otLu2;!dHnt0;a1otJu0;no;!cinq2d2nKquatt1se0tré;i,tI;ro;ue;dAssaJttI;a1i0;nd8;raGtt0;ord6ro;aEo;i0le;ardo,on0;e,i;i2od1ue0;!cen3mB;ici;ci0eci8;a1ot0;to;nn1sset0;te;ove;ento2inqu0;a0e;nta;!m0;ila",
    "Ordinal": "true¦:o0;dnocGmi1n9t0vatto,zret;niDraDsF;ced,rp,se0ttE;cid9drai8l8noi8t0vonna2;n2t0;essa0o0;icid;a1e0;c,rt,v;ra5ss7tt1uqnic,v0;on;es,o;lim;e2n0od,rotta1;i0u;uq;rt,s;es",
    "Unit": "true¦bHceFeDfahrenheitIgBhertz,jouleIk8liGm6p4terEy2z1°0µs;c,f,n;b,e1;b,o0;ttA;e0ouceD;rcent,t8;eg7il0³,è9;eAlili8;elvin9ilo1m0;!/h,s;!b6gr1mètre,s;ig2r0;amme5;b,x0;ab2;lsius,ntimè0;tre1;yte0;!s",
    "Month": "true¦a5dic3febbra2g1lugl2ma0nov3otto4sett3;gg1rzo;enna0iugno;io;em0;bre;gosto,prile",
    "WeekDay": "true¦:acinemod,otabas,ìd0;e0renev;locrem,nul,tram,voig",
    "MaleAdjective": "true¦:!1:#$%&()*+-./<=>?@[]^_`~:ts,re,ar,er,ni,se,ne,na,ir,ra,el,et,mi,ep,or,om,il,ro,em,rt,iv,id;0:JB;1:KK;2:JE;3:HZ;4:KU;5:K2;6:H1;7:K0;8:JZ;9:KO;A:KN;B:KW;C:K9;D:J2;E:GQ;F:JY;G:JR;H:KR;aKRdKOeDJiCUko,muime0oJrIulb;>us,oinuj;bCRc9Pd96e8Ug8Shc4i7Pl7Fm6Zn5Yp5Xr5Fs3Lt0Uu0RvLzI;nJzI;ap,eGot;am?,?b;iIl5oun;rp,s0AtIv;aZiVnU@e,rT)RtKuI;cesIlove;e,n2;aLeJ-cs6uI;do0r#EB;cEffe,ggo90lIpsEr3to0;es,l2;!c,&,(,oI;~%,rI;p,t&;!gI;gus,~;essa,o9;eve0iCEuigga;=0nKsDt>Jut(I;!?HJ;-,m2;if6up;cP&c,gen,lOmrA6nMrKtIv05zzin1Q;iIlocH*s&pp%;ba,lauq;>o,oI.n,#i(mma;ball2c6;!gGW$I;tla,vog;&,sig/;iIude;d1fKD;av$p,iQluH9*OsKuI;ba,lcI;n2);ap,eI;ccJlH5rgIssD;ga,o0;e,us;fIt1;fo,~;c6vI;!/<I~;!oA4;cJgibma,lfrILnIq,tEN;iGT+;on1;a0Xe0Ui0Jl0Fn0Ao08r04sZtMuI;ac,b.b,ca,ffap,iKloJm,*I#a,vod;tn2v*b;ssa,ve;cson7TpmDN;aSeMiKoJuI;icsa,rb;dEr;fnoArI;cs,d,f;dKf$p,ihAn,ps7rI;!~8r2#I;!-;ac,dJeI;l4*b;is2us;da,fIiAm,pm2r#a,),t1;f64lo,s~d7;av,eLim,oJuI;b?,g+,ig8;csan,pI;po,s3;d@,no;eIo48;c8ff7pIs6;aI);!'lla;m&,nIuv;!gi;as,eKiJo0uI;f6)0;f,p3#3vn2;lItta,urc;!o`;a,oJuI;cco,da;c,f,iApFvnI;i2oA;cQdOlNnLrKsJtnIutaG;>,uF8;!iuqs,oF7;efe0uap=;egH6ifI;!ed8(;lHos8up;eIn2;d,(;eCU[pI;=,);[,lpmG2*v,rIuDM;cIgF;n2s3;c0Nd0Mg0Ji0Fl0Dm0Bn04?c,p02rVsUtSuRvOzI;nMzI;iIobba;laJnI;ag];ice9$*g;ava,?bba;/e,iJoI$sE;nnErp;rp,t@;geda8tiba;ad,ei9iI*mr0Fod,s4Ut>sa1;lib15=l;iceBPnFo9s&FT;apNdauq,eLgKoJucI;ca,issa;bale,d,l2;!<1;b[6dIgCNps3;iD0@;es,s3;puz1uccoI;!e0;gNiL(,oI]t,ut]f5V;en,izI;eI~nBMnFH]4R;ffa,lF;d]Iff%,lc1m$t6ps;!bus1s3;ab,>=,~1;aIi+,onE.;!ffa;am,loffa,ocI.p;it.,l5;bb%.,cKd^=,g/`i0lgaJrIz`;av1p?DW;bs,tt6;caihg,?c;eIi45;ip,lI;!ed;if,la11nof;ap,ca8YiIn4ofs,r4ud/4;d6fi#uig,lK#I;^Iif7;odda;ed,pm2;e19i18lHn16oVrSsKuI;fIihc,lc1N;!f3n2;aOeLif,oJuI;csA1r;dot],rI;!g;lDWnnJrpI#;ed,);a,oc;b,rg;aAeIoA;p,vI;~,(,?DNva;c0P/o,fANi05l01mZnYrPssag,tMuIv$n;r#@,ssul,tI;nIr`;/at,oI;m,s;eip,ip&CsItef3;e4oc,ugI;!s3;bmo,ePoL#KuI;ap,me0t*vI;va;as3;giKlJmI;alc,ur;av,od;r,v;dCHis*p,mun,*g;/ev,gog$v,imul,+d;af,&c,mI;og;ad+AeKoI;cIgi9pDtt&f,vH;%im,i$p;g,p;cYdXgUhTlgSn@RoQrNsMzI;aKe0iI*lBo;bma,dFlIv;am,ed;ps,rg;aFU+;e#im,oJuI;c,f;lg,tt`;ig,n;is.p,.;`a$m,og];csE;aCLgaJiI;do0l&,#e0;r2t+v;i#H+Go;cIudif;-p5oI;m,r;cJiIs`;cciBXtH;iAus;ap),eI;d,m=,t1;ce0vvo90;cca,f8Dps7rCBtI;(,ta;aYcas,eSgRoQpsa,rPtNuI;cKd,e,p,taI;mIrud;!e0=;is,sI;!o;n6sIuen;ed,inB;azzib,uzza;'d,n7vinr5;am,/la,ip;b[,cnBgg/,iLm,nKp3Tsim,tJvIzz`s;!es,op;(,);!<;f,nI#2;%Coigi0;c,ihc,ma,r;poz,uc;aVeTgSiN+m]n,oub,rIut]ppo;eKutI;icIton;at;d@,~o,tI;aCSe,(,);g-ap,hc)m,pla,.LtIu*g,v3;al,nI)d+lc,tede*b;azib,eI;g.,]if;c,m;ed,i*b;iIm.,rF;la,p;b03cXiPlossoGmNrMsLtIv;eJ[op?t^,noI;l,m;bit,l4G;!ip;#,v7;lusum,oIu;r,tto;dOlL.BIsK#-c,vJzI;e*v,ige,+;[ob,oig;<r5$p;aJe%si,iI;cBs%b;r#ua,ti;itouq,(;iJsI;ecn%f,ot;nKrIs)m;^aIfa;!d]n,?fa;^od,$p2;ru,uc;eViIl5on4X$f,u#D;nTr$b/ec,sMtI;luK(,tI;iIo;gCCr4;!'#euq;en*,sI;am,iIo0;d+GhLlleb,=0+8Ts@HtIv&b;lJnI;atr6U<D;a,@;cDgnul;im,o+;!rI;pus,#e;amo+,/l9KlOoJpiIud-C;_,tlum;cKgnBngaJvI;/4-f;m?,ps;cip,iIsu(m;dErga;aJeIiuqn%t,un;b,ns;f,ig,t^;a$po,bbud,c0Hd^0Gg0Ehc0Dlgevs,p0CrNub,vMziI;lJtn&rI;ot;atan,iI;de,t*g;e0vo;aNes,oI;s`4JtI;aJt~dI;%9N;co4GgiI(m-8Arips&;lbbo;c+b,dnZiX=0nTrQs4JtIv;eMiIno7Eub-t;c[bbup,de$,l7nIs9T;as,uI;!mI;=,oc;-JnI;alp,@;po0;e4BoJtI;ib.,n2;it+,no;iIoizulovE;d]JgIru;am=,-o;!%C;v?$f,zI;~uig,n45;egg/,ocF;!ma,pod;cev,s4;avl4&,gaIiG;s,vlF;!r9S;ciss4ifitnD+lib,r4sI;[,n5Volf;ud;av,nIo3Z.l;[as5ul;d[cSnLp?SrJsIta,uqca;?,so;acl5be,oIua;mr4pr2;aJegoI[itt&,odi;mo;rJtnI;a#i,o9;opm<J$tI;~^,t7;!n2;ue;d&f,iRl5nN@LrJuI;n,rc;aIos,ussa;bognol,s,t;ocI;!s;aKeJoI;fo0ib;c3m&t,puC;lb,tiga;br@,cOd*l9gElLmKpJrbi,vI;`,ur;%,-,si,uC;it,u;av,eg,laIos;p,uI;qs;aIs`,ul;!lp;ai2Gc2De2CiO+N?pic&,rMsI;amag$b,eJurI;b,te;d<,iz[Drf,tI;+gig,toG;o9ut;ib,#;a24bof?#ualc,d21f1Sg1Ghc1Fl1Cm14n0Uo0Tp0Sr0Ks0ItI;a0Ae06i04lec,n02o01.,sOtJuI;ano18>a$t;aLeJoI;!-tap;cs,lce,pI;so0;d3t;aS^od,iKonJuI;ca,r;ga;cl5lMm,nLrKtIug(l;+I.,ua;uq;<t%5?$t,ut;abru,oiss87;aJiI;b@1J#;&,n]ig,rutan;i)lcce,lIn@,rd;e,oA;ac,cisp,g,);am?,eI;di,tua;lIm;a+,op;!bafla,g$*,`7lta,nJop,tI;ap,nBopi,);eIg4;g,rf;isa,mKpmBrJ#Iuqca,vlF;!o0;c@edl1Kp;<Km%d,oJrIs4Wu%t;of1;lp3tua;!sB;r5sI;alcoen,/s3ot;dOeMiLoKtI;^It/e;mBoL;d,fl7ttip;l,tas;fs@ta,mun,nI#i;eg;i,(lic;e,it;n5R$;aPiOoIte;c(l4/LfJi,m.,n5rItt<ihc.;c,i,tt/e;/<,nBoI;~%;opI;an;c,lc;m?,tI;ob;aLeKiWoI$t,s2tE;noIta;ce,r#a;dacca,lD;lK(dI;!oI;$a;si;bib,cic,lJoIu%di;bmBcla,tt5;at^,eb;iS.+;aS<2Tla#on,oLrI;e*,uI;riIt[;hc;gad>,lI;!a+,oI;ciLeKiJnI;c<,?c;b,sif;g,t;sp;m,_;%gMenLiJoI;r#at5solif;ce9lo0ng4t*icsI;!a8C;eb;!oI;cs3eg,ibJm6rUtI;ame(c,of;otua;-uig,ol^,rI;on;lc;c.,l,rbe;c,ic,rg,s(_1;alDes,-,oI;iArI;ab;dr5lliJn@6rI;bu,#ua;di;%a,r6L;c[p<l@,diuq[,ggas,hXloW(m,pma,rQss?,tI;aNnKsiI;lIn4A;aic7;apic<.p,ei*JiI;#3;vo0;-aI=V;vs;aIcVe#e;dnocFiznLlocric,(g-o,p,$JsIv;)cen;ttI;/;a(f;gnBve$mun1;cKgI;nul,oI;laK;cKitJ+I;ib;+;ev,-;as;[;c67d65l24m]*,n20r1HtJvI;aG&b;i1EnI]f,s-t;a0GeI;%tta,c08d01gZiWlUm-pTnRrNsLtJuI;lf1q&f;e41op,$v3sisIt^o0;&,$p;eIsa;!rp;aJeIoif;(,oc8;c,pI;pa,s%t;am$p,iI;mo0t$p;po;avIlecce;e0iuqe;cIlg0Qm]d,*4Bzap3J;iffIs2;e,us8;[Iru;gen,~,l4C;aNece0iMnJuI;l6rp;eIops-r2;pIrpr7;~1;ff3ve;c6v1;aLeK(vJon1)I;loL]ulf;n2va;d,r;f>uCiI;da;ta;c0Ad06g04iZlXm.lWnQpuccoe0rNsLtIv/-27zz%ab=;eiuq1rJsI;~,oc;op=;>,s&I;<1#;ali),b`,ipJoI;lOngi;sa;gaCiLoiI;s)JzoI;me;rp=;csaffa,mI;od;la;l-b,oI;c(v,=C;ccaLggIlibN;%J&ussI;ul;oc1;ihA;avI/e,ig;%C;noJ@I;occa;bIf;ba;av,cJifiIs&fnE;ngis1taG;ip,oI;iArc,t;le,m;aOoJ#uI;lli;iK(m,pas1tI;aI~%t;de0v$08;lgim,$I;f1pus;gS[RlL(=le0tI;[im,*mI;al.p,eI;le;oJpme),uI;d@,llec;cIg0VpD;atte9/@,~nJrI;ic;>$p;imH;lov;a00iJ*l7oI;icn%a,rr4;duteuRtuI;?;a14ed13iSlof,oI;b6veI;caPdaGhcima,noiOpMrKtI;atIon;-5;ediKimma,oI;lp6no,tua,vH;aIl2;sn2;g%,ssa1B;ip;bRcQgOhcs4mNnK$Cs*m,tI;atrDnI$f,so,t7u8;af1eg;aIi3U;voI;ig;is,u;aI`;rf;af,iff3;aUiIon;c(v1d&c1llaf1nSrrRsMtI;a0XsJtHuI;cs3;eIis&V;g,mm2;`8*LsJuaI;lp;eIimma,op0M;lf;r0Ps8;<,o;e21ops3;!b?p0Hc00difZnWrPsnopsNtIvonnE;iKs8teI;cca,psE;-;rIve1;ri;&I;!ri;eJoI;da,m^;dKnJsI;im;ev,luv;is6;ed;igam=,ogI;%I;ap;fa;cLiI;lJnIta0;um2;ppa;>=;ef,urc;bolg,c1Re1Qg1Oi12m0Zn0Fpic(0r06s05tQuI;daGgu,nOsNtI;iL*Kr`,tI;aI/l0M;!f;ve;ba,ri9;ac,s&gn2;am,+;af,/,iU*Kr@JuI;rb;!=;dPiNmJ(I;tn2;!aIi$9urC;dnJt]I;pm2;of;bI];ma;!icI;ca;g3v;~;$vP;b&PeNg00oMtKuI;deco0gua1r,tI;an8luc;a<,nMte9uI;en;!m;cs`,def,talI;inu;ec;a00^o*f,iWoiI;gUsRzI;aOecNiLnJuti#I;oc8;eIuf;vn2;d%t,_I;un;ce;nrIr;<1;acJsI;efo0;co;&;giKmI;-c,rI;<;];b,=ttF;iJ]I;f8n;+,tto;cWdrUnol2rRzI;i1nJ.Iz%;m,p;aNeI;diKsJtD;op;);fn2s&I;!p;#7;>J@I#ud1;^;=;o=0;rp;e9ifKos,$mm2uI;rc;oc;fu,itKrI;>I;us;.;/I;!li;di,l,r;iIol;d%,poJsI;um;_;+GrM;rg;aQiLoI;lJrI;ef,ta;ev;ff7lI;ef8pmF;es;!(;os;ciKdJp5v`;ac;ua;fJpsrI;>;fe;rIus;ad+Con;#;ci00dZisaXloWrutazza9sTtIvitaizi1;inR(c1sI;aisutOiI;=tM(KoJzzI;%;ge;mmI;ef;to;*;(;if;?,uA;cs;ps;`;tnH;af;@;fJ#[ai$t4;am;ingB;is",
    "FemaleAdjective": "true¦:!1:#$%&()*+-./<=>?@[]^_`~:na,re,ro,or,ni,op,ir,em,ts,et,ps,se,ar,es,ep,el,il,ne,om,ra,is,am;0:5Y;1:9Y;2:9V;3:AE;4:7G;5:AH;a6;bAJc6Gd63e5Pg5Li4Ll4Fm3Wn2Zpuc,r2Is1StYuWv6zz+;aUi6oun;rp,sLt6;aEiD]ve1^e,%/,<Ct8u6;c>6love;e,n0;a8e7u6;do1r-0;ffe,ggo18ll0;!c;!ggus;mi1(fed,s)4Jte26;cAerc,gen,l9m%n,n8r6t]<rpp=,von4zzin0S;?o,o6_n,-i(mma;m+m0val;!g?mi,$vog;er,sig@;ifing`,ude;iB]f2s6ulcn0;ap,e6;cc8l1Xr6;g6/e;ga,o1;e,us;ced,v6;!@.;lsoguj,tto;ci/0di<r,n6;eg4i2J#;a08e05iZlXnToRrNsEt8u6;ca,d$p,lo6rb,ttab;ssa,ve;aAe7if,ur6;b,-2;dd7f$p,ggos,n,/os,r6to1;idK-*;`0us;!da,ip,pm0r-a,<,t4;av,ed^,i8o7u6;b&,ig;csan,ppo;c9l7m,n6ssab,ud4ve1x_m,zan;imulli,um0;a6os;icos,noizan,tip3;`um,saf6;!it#;auq,e6oc;c7p6;a,oc;!(;mer,n6/eCuv;!gi;e7i6o1u0V;p2v;l6tta;!oiv;a,)>,u6;da;bio1c[/e,deAics,l8n7s6ut=g;!)pa,s2W;eg^i1if4u;o6up;p^s0s;d,(;l0O]v,r6;c6g>;n0s2;cSgRiPlNmMnJ&c,pma-,rDssap,tBut]cca,v9z6;#va,%f,zi6;laice/,n6;ag%;@e,i1o6;n(r,rp;i6nocs,te/a4ummi;bas2m[;aAdauq,e8o7$6;!f;d,l0;d`n0p6;m.,s2;ihc2p>;id%,(,o7%igga,ut%f6;!s;d#bba,en;i#,o(r,_;o6_p;cit5si;c&c,d+mi,ga,lga6;bs,tted;@,nulo1;ci/,i6#m,_m;fit%f,l6;ed,p6;m0pa;eTiRlaf,]QoErCs7u6;ff2ihc;ab,e8if,o6ur;b,dot%,r6;!g,ollaig;l6n#,/,-;f*,pm0;acs,ev6;id,(,&0G;iBloAmaf,(9r7t6utn^,v$n;lociff2s0;+un,o6;g*,lod,malc;mul,ug#s;ci$p,p);cc&,f~,gi9r8z6;e1ib6;ma;e-im,ottiv,uc;ler,t6;<1;d,mmi,t4;ce6vv&pmi;d,rp;r6t;pm0;aLbmu,cXeDoC/a,ruzza,u6;c9d,p,t6;a6uf;m6rud;!e1;`,s6;!o;nos,vinr3;bCf[&t?,gg@,iBmAn8t7v6zzivs;!>,);(,<;!.,o6;c#ib,ss&;!us;n69-0;[,$b;c,ihc,ma,r;!aLeJged,iC#m%n,oBr6ut%ppo;e7u6;id,tton;d^,ido,t6;a6e,(,<;m,p;n,ub;cBdaAg*ap,llatJpla,r44t6v2;al,n6<d#lc;azib,e6;l6%if;as;tn0;iv;cip,gid4i6m5$s;la,p;bruLcGdap,er0gap,i8m7pm3r-,t6;e45[)&t+,nol;&,u;dCgi1Hl9s$p,t7voig,z6;e]v,ige,#,_m;si6;rc;a7i6;c`,s=b;r5Wti;+,itouq,(;i6sot;l8n$p0r6ss+;+a6fa;!&fa;bbuper,g#;!=txe;erLi6on28$f,u-);nIr$b@ec,sAt6;lu8(,t6;>,i6o;g@,_m;!n?;eCs6;~,?,i6o1;d#rg,h8lleb,#voig,ssab,t6;av@e,la,#t%pmi,r6;of;cit#,gn6;ul;d+,n];im,o6;mo,#;p7t6;<;us;@lAl9o6;c7g(s,nga6s;m&,/;cip,*ga;aig,eb,iuq#rt;=ap;a$po,bbud,c02d+01g00hccZpYr7ve1zi6;ge;a8>,o6po1;sivvo1ta6;g[bbo,%;dnRiOmi1nIrEsBt6v;e9i6nolov;c[bbup,de$,los,n6%nFs$vinu;as,u6;!m0;icos,n^;$v7<c6;en;va;e7ga,t6um;ib5n0;n6ttH;im;i7oiz6;=f,ulov*;d%8g6;~6i%;mi;!=-;v&r7z6;iduig,#(f;ef;egg6oc>;@;ma,pod;ev;gavl>,*g;!$t4;c`sFifitn);ud;po;l8n7ola#,r6;al;[as3ul;eb;nCpo9r6;be,ea,o6;mr6pr0;~;]6rue;tr6;ap;a6eg^o,g[,odi;r7tn6;a-i,)s;)m.7$t6;id+,tos;!n0;oc;deHiDl3noA_7u6;n,rc;b6t;m6ogn6;ol;f7t6;&;!o1;b%m,dn@/,g*,l8mu,p7u6;lf,q[;=,*;av,os;rf;!ai33c30erg,iC#B&picAr9s6;e6urte;d.,rf,tn6;agig,ec.t>;)s,ut;er;ib;a2Rba5d2L.o1f26g1Thc1Rl1Gm16n0Ro$,p0Pr09s07t6vic;aXeSiRlQnMoLs7t6uec~_f;at,[le;aH+Gi6;cl3lBm,n8rut,t6ug(l;#6_;uq;a7@le,o6;ga;bru,mu;a8i6;b^6-;otua;er,n%ig,rutan;od;i<lcce,l6n^,t#f;e,ocs,p;ac,g;a7e6;di,tua;!m6;>,&;ec;la#,m,rc;!g$9iv8lYn7),t6;)i,<;eg,g~&t04ic;os;];m8pe,r6-;co6p;med,t0R;e9m=8o7%f4;(;lp2rc,tua;d,g;lbo1t6;~,s`;if6r3saZ;!at+;bJd(lic,eEiCo9t6;+oeg,t@e6;!&6;di;.,t6;s,t6;ip;l,p6;me;bi,f7m6]g,ttab;un;i$p,s6;!^6;ta;eg6;la;e,it,m[o;$;aHeGiF#tiEo6te,u;br3eBf9m5n3r6tt.ihc5;c,i,t6;te6;le;@.,nToid6;=;l)6;an;rb;lc;cs;cluv,g7m6;&,rT;%;aCen,iVo8rYs7t6;*;`,oc;c,no7ta6;!#;ce,rt6;sa;l7(d6;!o$a;si;aEbC.otB`ab,lAo6;bm8t6;so6t3;pa;`;at+,eb;si5;b6ib;up;c6ti;ov;iHr=6;eg;aH.Uol9ru6;ri7t6;[;hc;aCo6;c9e8fr7ib,nc6%.Vtno;.;^;g,hc5t;e,i6;sp;#;m,rt;=gCi7osol6;if;c8t]ics6;!atn6;af;ap,e6;/;!itAo6;cs2eg,mQt6;~en6of;ic;id;=6;-;rp;+,*uAo7r6;on;*7l6;+;?;ig;c5l,rbe;rg;al7>,*,&6;ab;);dr3n^8r6;-6;ua;ed;ac;a5r6;>;_",
    "Currency": "true¦$,aud,bScQdLeurKfJgbp,hkd,iIjpy,kGlFnis,p8r7s3usd,x2y1z0¢,£,¥,ден,лв,руб,฿,₡,₨,€,₭,﷼;lotySł;en,uanR;af,of;h0t6;e0il6;k0q0;elM;iel,oubleLp,upeeL;e3ound0;! st0s;er0;lingH;n0soG;ceFn0;ies,y;empi7i7;n,r0wanzaCyatC;!onaBw;ls,nr;ori7ranc9;!os;en3i2kk,o0;b0ll2;ra5;me4n0rham4;ar3;ad,e0ny;nt1;aht,itcoin0;!s",
    "SportsTeam": "true¦!2;:!1:#$%&()*+-/<=>?@[]^_`~:na,al,ts,no,et,er,ar,ra,ti,la,ro,ni, o, s, e,ma,c ,it,el,ap,lo;$liv &%a,c1Ud(inu 1Oe1K&i1Go[nyd 1Fr1Ds6t5xos 3y0zzaj hatu;-]0x$ag $;eko%,ffidHre%e0sas#k g=t<ps;ci_,h1M;d) 17(ihw0;!>1H;aehWc`mi /)t&m;$/d cf,buc1Ec^12d0Ye0Jfeihc0Ig=k0Hk08l00m*?06nQoNpac(ihw revuoc#v,r7t2y0;a0obwoc0D;j@ulb7rF;e2~c?i~pGn0oirt`17;aig 0iasV;k1LoG;ggunJj1Jkcor 12m0Rn0; nylkoorb,<h (tol+hc;aEe2o0ups>i&t#0K;ir+w (a% ned~g,tp*0;>t&<t;\\g\\h 10\\j\\e>Abmi9c` 8d7e#ccub6g2ht#p a=~1i/vacNk0lee%0C=+mZppil]5vor nrubkc$b,w)01z$b li*9;$3c` yab ne)g;+c;dod1^E#r 0+h]0B;k+p?neeuq,saxI;! 0;s_eg#?ol; yab `[t;i*0MnuosR;a#id=;t d#lt<p;csic#rf06;eb0Rugaj@lliv&skcaj;c&rb1r%a0;! 0J; revn3;a5ev*00i3o0us xineohp,worb7;c/f Uil0%ip0; -ort0;ed;hp~d0ksd)04l+m0wtQ; i[im;cilep2id=1-t@essenn0x( 0B;(; d#lev_c;?#_< 0R;a2l0;ib>/ffub,ub 0;d)0Mo0C;gnebXn0yorE;id+]0o^anU;aAs0;iuol .0;%;c2wah0; Caes0;@lttaes;abd&[id3i1u0;b@ekuawlim;nkJrevam0;?$/d;! a0;&zi+;>tnem*cBiv3; y-c?as#k;ek#yDiAkauqht+e@soj8l6rd`4t*ip3v0;*b 1~wrebm^0; atoY;atnZ; hgrubst-p;! 0;ogeid2;gae Koi<0; )om^/b; n0;as;kco5l0;lihp0zzirg?ihpmem;! E;! kS;)2ipa1+ziw0; &tg=hsaw;r>d*oN; ^an=c=c;_hta2lec0;! 0;&%ob; d#lkao;ednuht y-]amoh$ko,upstoh [hn(t0;ot;&%uoh;nu 1tu~v)0; d#lgne G;aihpled$i0;hp;k$ t/s /),rif0;>0;gaci0;hc;.c.d,at1dleiffehs,_%ac9[h %ew,re%eh0;c#m;n2o0;senn0;im;$ta;f y-c1igam>d#l<,s w)c?ubmu0;~c; k0;<y 0;wen",
    "Organization": "true¦!2;!1:#$%()*: & ,johnson,s ,er,al,ck;aKbIcHfEgun%n rosGhD$#$,lBm8n4proct(#gamble,quiznoLr3sainsbuJth1u\\c,v0w)-mart;isa,olvo;e 0in lizzy;gues%who,rolling stonD;.e.m.,e/max;a1ew 0;kid%on the blo*,york9;sa,t0;ion) academy of scienc8o;ac'%milk,cdon)d1(cedes0;!-benz;'s,s;'ore),a0;-z-boy,bour party;#m,ewlett-pa*ard;inanci)0rito-lay; tim0;es;arl'%jr,hi* fil-a;en#j(0la*#de*(;ry1;bc,lcatel-lucent,nheus(-busch,pplebee0rby0t&t;'s",
    "Honorific": "true¦:dnerevTePgnik,hOibbar,lHnDr8sse7tn1y0;cnellecxe,dal t4raterc5;a0ediseQuG;egr3netueil0;! 0;dnoc1t0;srH;es;cJhctud;e3o0;ll1ssefoIt0yG;cod,sap;ecnahc,icnu6;ciffo,dnamm5idagirb,tsinim emiF;a0eeuq,iatpac;m0tlus;ows0s0;sergn1;a1enol0;oc;hsram2rimda0;! 0;eciv,ra7;! dle0;if;allutaya,caesioat;c1gduj,tartsig0;am;ni0;rp;er",
    "Person": "true¦c0dante,jaime,rush limbaugh,sung,tiger woods,virgin mary;arson palmer,ruz",
    "Country": "true¦:!1:#$%&*+-./<=>?@[]^_`~:na, a,la,ni,ra,ac,ci,re,ar,il,al,in,it,le,en,ab,ne,ru,ta,om;0:2F;a18birhgam %,d10e0Mh0Ki0Ek0Bl09m07nUoHrEs9t5u2yaug1æ#-t3ù.p;a*p,u_;a2%vut,`un1;av;c0ssib é&ug;a2eb1iawuk,se r~1;?;anun t<%=Yr1;.sCāR;a3d#lsi &griv se`ts det>u,el@hcyes,iv[ d# sttik2Ho2u1;?24*@yb;=,-+ e sRd]*b,r~oc;m1&p<ip,_dnoh;ah],tsirhc e%`n id$0S;a2eg>,i'azaj %,oda1;uce,v%s @;csagad0m#ym,`q t=wWyorøf;cBg9htosel,irova'd 2Zl8n4r2saf$&k_b,t1vosok;>u onger,tige;g[e1pic;tn~;a3i1;-v 1*m #s;hay09nārī )ais.p( #Q;b<,id& o#eco;ewt*kas,%gotrop;noc @d$-1ot,_bmessul;l0Yt/c~ed0X;an~,i1;bmaz~,r ot.up;a3i2nud_ %$i#droYo1u$is[od&,y/h] %;bag,o.m+ nu.m+;ets^thce<,^b;dus sa,igi].za,m9t1wiat;s2u1;hb;ayah,e#hgfa,i1;k2^m1zihgG;k_t;a1ebzu,igat;p,z1;ak;ay %,o,y+Y;a1uig@b;n tệiv,ug;a1is/b elisa9%hsK;g[es,pS;a2ii*bav ?see,oocT*mn1;ad;ri;ba* ?/ime,-t%b5dnu_b,[u4gif,l0moJ&suk #dJt1w0L;]i2i1ubD;ah,nu3;rik;rb; i00;-er.tsö,sed=gn1;];$e&ug id oflog,dD>odé%c el@vuon,lCmanAn4picnírp e émot oãs,r2sec#rf$ise&lop,uqi1vidl0wb]miz,z<eb;bmaç~,&t*m$-&tr0;ié,o1;moc ettoy0pN;a4ida^rg e t^c&v10#i3o1;el$r.Mppa1;ig;*mB;-.ma 1yZ;a~as,i&g.v9;ir1;us;e/8ic;?*t#,.v op+;a7#l1ron @d$eroc;izaws,k%f3l2.d1sí;[;oh; e1;lo1;si;ic;bu1A-10d0Te0Qgnot,iOkMlJma#p,n8o7p6r3t2uga*cZvodl~,y1;i%amoos,^k;iduas$ibaAl0;ahas,rod#,up1;agn1;is;o_e,u%daF;mās,*etoa;a6gaps,i1utuf te s<%w;c4j/ku,t1vogez. de$>sG;^g2se%p id o1;`ts;*;!$l@d dus$tsoc gnǎggnāix;-1hg,wstBy7;&mod$-lbúper$#-&mod1rf/t^c1;$-l1;bbup1;er;ame`2e1liug#,og#;kot,uz[ev;ug;#l irs,s1;lop$>ol8`vrh;bWcTd#liaht,gQhcOlMnDpo?e,r8s2v<1zevs;ob;[2y1;=0;=em,<3or-m1;! u1;=eb,_U;op;agl4e1;b<,g2hg1;nu;>;ub;a3eCo1;dec0tt1;el;b5m4t2zn1;at;i_0;am;or,rib;%;/tsua,ogn1;~;ca1ec,rS;vols;evr2obm1;+;on;eI#rf,ul1; t&1;as;im4m2r1;es;a1olN;g,z;an;ot;&ug1rJ;!$voun$up1;ap;an5#4u1;b*b d#$ug?2mr1;eb;#;gu,ur;+,e1;rg;amaj,&mod,r1; 7e5fad1;ron 1us;hayib2s>1;ut;<;bi$los>1ma;ep;ats1;oc;c,*",
    "Region": "true¦:a0dnalsi drawde ecnirp,erihskroy htron,orerreug,rimhsak;i0natnom,rap,yhdam;nigr0rotc0;iv",
    "City": "true¦:!1:#$%&()*+./<=>:am,ra,an,ir,la,na,re,uo,ro,ag,le,ar,av;a0Ld0Je08h06i01k00luZmut$hk,nRoFrDs9t7u4wadiypy%,y2zud>,àtogob,é0;dn+Il#,mo0soj )s;l,t oãs;bse.m 0We0;main,ndys;a0dn#tak,hpmiht,og+d/a+,*s#,ănișihc;eIss0;%,ib;ab/şa,iawuk (,se0tohcka+n;$cub,vo emme(su*g;'1e0i+l 0P;&tsac,l<xuK;eg.eg0nhoj0; tnias;i0od>(s;kilQmżi;bAc9d=glIg00i7k#Wn4r2t1v0;i$n%at),on-o0I;.p,up#;iac li,k+ss+m0uj#;ay;acit>0Fi0;hcLl0r# )s i0F;bVrB;csid/om,$0;sor;issem0As#ad;al#,&#=E;a5ehg%epoc,iaps fo 07ot4wot0íl<dem,óicnuX;e0sgnA;erf,g0;di0.E;rb;limGsuT;poml0*het,tlus-r6ve*,w/eb &es $dnE;eb;es,jnC;ekšib,ívajkyer;g&3h<d >o2l0no.m,*g(,sinut,tuf%uf,ugnA;/0id;ik;un;ap;all#=,tr0;ep;b8cn&p-ua-Qlic <d og7n5r2t1vèn0wgnolJ;eg;acsLtok =up%ed$wayaj &s;=1*tess0;ab;ah;a0eta,o.b/;babm,itneiv;ait)s;)š0ok;ud;a&,u0;mlu*gn,s awa$t;'%VbTcPgNiHjuba,kasGlBm8n5r1t0ug%Avus;$caTtel(B;a0dnol;in1m0;sa;oh;a1emajd'n,obs0;il;ib8va'l;%1il,loccots,o0;dod,r;#;#etaug2iv 1<0;v al;trD; <0;d àttic;ul;a6fos,pa,r3soc2v0;asr0orn7;>;in;b/az,d)xe0;(;a0et6&;rp;c2&ogd1s0;om;op;ad;eba sidda,u0;ig;as",
    "Place": "true¦am3bcn,den,fco,i2jfk,la1ord,phl,s0;fo,yd;s,x;cn,st;erica 0s;centr0meridion0;ale",
    "FirstName": "true¦nelly",
    "LastName": "true¦:gnaw,iYnOoMrLv9yrrep,z0;e0oñum;dnanre6hcnas,lazn5m5n4pol,r2u0;g0qzF;irdor,nimod;a0ep,imar,reitug;us,vE;emij,itr8;og;f,h;e6o0;damm4l3n1rt0stenzuk;ep,imid;a0ojmArims;sah,vi;iahhim,vap,zC;am;j0yi3;e1liss0;av;r6ske0;la;etsof,olyat;narr0rtsac;es;e3iwrad,oss0;lr1nahoj,re0;dna;ak;s0yugn;n2r0;al,ed0;ep,na;ah,e0;j,tsirhc;ccir,ssem",
    "MaleName": "true¦:aZbob,dnalevelc,eTfuosuoy,iPkJlGmehtak,nCo9qa8r7s5t3urahomot,werd,x2y0;aj,b5d0htan,kcor,nnos;de,nar;am,er;cidenNn0senrE;arg,ek;allad,ollo0sO;rik;adyh,evned,ime;istupa,ugnnuB;crId0el,geid,llud7mle,tanCvatsug;erfla,na0;lro,mra;a2e1hguav,itsua,os0;am,irrO;mye,rrJ;amon,droj,ed,itsirH;ladnek,op,r1zaflu0;ba;ae;c3i1narf,r8u0;ni;las,n0;im;a0in,u9;j,m;ahcal2gre,la,naja,ohs1ro,v0y;ad,el;eb;am;cnal,d4i2n1ss0tep;ej;ad,eg;j,lra0;hc;aw;kihci,muuy,ri,t0;a2u0;os,r0;ah;n0ra;ak,ih",
    "FemaleName": "true¦:aLeDi7koorb,l4m3n2oKsunTtelracs,y0;bur,dna0st8trebil;rb,s;evar,ref;ossolb,utat;a1ezah,i0raep;ag,rva;r8tsyrc;crUmim,n4r2t0;sir2t0;ap;amukaynak,dua,e0;hc;ayangirm,ot;c5d4i3leirbag,n2sile,tte0;l0nP;oc;airLims1;brab,loj,xid;aj;arg,lud,nero0;lf;dJeHiEjed,lDmla,n6r4s1t0yG;aner,er,ive,narkadnFsirt;i0set;!l0;!e;a0im,od;mas,t;aira5e4i2od1r0;ev;!al;!latac,m,ra0;c,m;gomi,la,r;!m;ed,iw,ue;cr1l0rolg;a,ec;am;b,rd0;na;avmayirp,e1i0leme;!le;l,v"
  };

  /* eslint-disable no-empty */
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
    for (; places > 0; places--) {
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
    const reSymbol = /^([0-9A-Z]+):([0-9A-Z]+)$/;
    for (let i = 0; i < t.nodes.length; i++) {
      if (!t.nodes[i].includes(':')) {
        break
      }
      const m = reSymbol.exec(t.nodes[i]);
      if (!m || m[0].length !== t.nodes[i].length || encoding.fromAlphaCode(m[1]) !== i) {
        throw new SyntaxError('Invalid efrt packed data: symbol definition')
      }
      t.syms.push(encoding.fromAlphaCode(m[2]));
    }
    t.symCount = t.syms.length;
    t.nodes = t.nodes.slice(t.symCount);
    if (t.nodes.length === 0 || t.syms.some((index) => !Number.isSafeInteger(index) || index >= t.nodes.length)) {
      throw new SyntaxError('Invalid efrt packed data: symbol target')
    }
  };

  const unescapeLabel = function (text) {
    return text.replace(/\\([\s\S]|$)/g, (match, char) => {
      if (char === '\\') {
        return '\\'
      }
      if (char >= 'a' && char <= 'j') {
        return String(char.charCodeAt(0) - 97)
      }
      throw new SyntaxError('Invalid efrt packed data: label escape')
    })
  };

  const dictionary = function (trie) {
    if (!trie.nodes[0].startsWith('!1:')) {
      return
    }
    const header = trie.nodes.shift().split(':');
    const tokens = Array.from(header[1]);
    const fragments = (header[2] || '').split(',');
    if (header.length !== 3 || tokens.length === 0 || tokens.length !== fragments.length ||
      new Set(tokens).size !== tokens.length || trie.nodes.length === 0 ||
      tokens.some((token) => token.length !== 1 || token.charCodeAt(0) < 33 ||
        token.charCodeAt(0) > 126 || /[A-Za-z0-9,;!:|]/.test(token) ||
        (trie.versioned && token === '\\')) ||
      fragments.some((text) => !text || /[A-Z0-9,;!:|¦]/.test(text))) {
      throw new SyntaxError('Invalid efrt packed data: fragment dictionary')
    }
    trie.dictionary = Object.create(null);
    for (let i = 0; i < tokens.length; i++) {
      trie.dictionary[tokens[i]] = trie.versioned ? unescapeLabel(fragments[i]) : fragments[i];
    }
  };

  // References are either absolute (symbol) or relative (1 - based)
  const indexFromRef = function (trie, ref, index) {
    const dnode = encoding.fromAlphaCode(ref);
    const target = dnode < trie.symCount ? trie.syms[dnode] : index + dnode + 1 - trie.symCount;
    // The encoder emits nodes in topological order. Every edge must point
    // forward, which also rules out cycles before expansion starts.
    if (!Number.isSafeInteger(target) || target <= index || target >= trie.nodes.length) {
      throw new SyntaxError('Invalid efrt packed data: node reference')
    }
    return target
  };

  const parseNodes = function (trie) {
    return trie.nodes.map((node, index) => {
      if (node === '' && trie.nodes.length !== 1) {
        throw new SyntaxError('Invalid efrt packed data: empty node')
      }
      const terminal = node[0] === '!';
      const body = terminal ? node.slice(1) : node;
      const edges = [];
      // Match only at the current offset. Searching later positions would
      // repeatedly rescan a long malformed fragment before rejecting it.
      const token = /([^A-Z0-9,;!:|¦]+)([A-Z0-9]+|,|$)/y;
      for (let offset = 0; offset < body.length; offset = token.lastIndex) {
        const match = token.exec(body);
        if (!match || match.index !== offset || (match[2] === ',' && token.lastIndex === body.length)) {
          throw new SyntaxError('Invalid efrt packed data: node syntax')
        }
        const ref = match[2];
        const label = trie.versioned ? unescapeLabel(match[1]) : match[1];
        const text = trie.dictionary ? Array.from(label,
          (char) => trie.dictionary[char] || char).join('') : label;
        edges.push({
          text,
          target: ref === '' || ref === ',' ? -1 : indexFromRef(trie, ref, index)
        });
      }
      return { terminal, edges }
    })
  };

  const toArray$1 = function (trie) {
    const nodes = parseNodes(trie);
    const all = [];
    const stack = [{ index: 0, pref: '', edge: -1 }];
    for (; stack.length > 0;) {
      const frame = stack[stack.length - 1];
      const node = nodes[frame.index];
      if (frame.edge === -1) {
        if (node.terminal) {
          all.push(frame.pref);
        }
        frame.edge = 0;
      }
      if (frame.edge === node.edges.length) {
        stack.pop();
        continue
      }
      const edge = node.edges[frame.edge++];
      const word = frame.pref + edge.text;
      if (edge.target === -1) {
        all.push(word);
      } else {
        stack.push({ index: edge.target, pref: word, edge: -1 });
      }
    }
    return all
  };

  //PackedTrie - Trie traversal of the Trie packed-string representation.
  const unpack$1 = function (str, versioned = false) {
    const trie = {
      nodes: str.split(';'),
      syms: [],
      symCount: 0,
      versioned
    };
    dictionary(trie);
    //process symbols, if they have them
    if (str.match(':')) {
      symbols(trie);
    }
    return toArray$1(trie)
  };

  const unpack = function (str) {
    if (str === '' || str === null || str === undefined) {
      return {}
    }
    if (typeof str !== 'string') {
      throw new TypeError('efrt unpack expects a string')
    }
    //turn the weird string into a key-value object again
    const obj = str.split('|').reduce((h, s) => {
      const arr = s.split('¦');
      if (arr.length !== 2 || Object.prototype.hasOwnProperty.call(h, arr[0])) {
        throw new SyntaxError('Invalid efrt packed data: category separator or duplicate category')
      }
      h[arr[0]] = arr[1];
      return h
    }, Object.create(null));
    const all = {};
    Object.keys(obj).forEach(function (cat) {
      let data = obj[cat];
      const versioned = data.startsWith('!2;');
      if (versioned) {
        data = data.slice(3);
        if (!data || data === ':') {
          throw new SyntaxError('Invalid efrt packed data: missing versioned trie')
        }
      }
      const reversed = data[0] === ':';
      const arr = unpack$1(reversed ? data.slice(1) : data, versioned);
      //special case, for botched-boolean
      if (cat === 'true') {
        cat = true;
      }
      for (let i = 0; i < arr.length; i++) {
        const k = reversed ? Array.from(arr[i]).reverse().join('') : arr[i];
        if (Object.prototype.hasOwnProperty.call(all, k)) {
          if (Array.isArray(all[k]) === false) {
            if (all[k] !== cat) {
              all[k] = [all[k], cat];
            }
          } else if (!all[k].includes(cat)) {
            all[k].push(cat);
          }
        } else {
          Object.defineProperty(all, k, {
            value: cat,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }
    });
    return all
  };

  const { fs, mp, fp } = model$1.adjectives;

  const revFemale = reverse(fs);
  const revPlural$1 = reverse(mp);
  const revFemalePlural = reverse(fp);

  const toFemale = (str) => convert(str, fs);
  const toPlural$1 = (str) => convert(str, mp);
  // female-singular -> female-plural model ('bella' -> 'belle')
  const toFemalePlural = (str) => convert(toFemale(str), fp);

  const fromFemale = (str) => convert(str, revFemale);
  const fromPlural$1 = (str) => convert(str, revPlural$1);
  // 'meravigliose' -> 'meraviglioso'
  const fromFemalePlural$1 = (str) => fromFemale(convert(str, revFemalePlural));

  const all$1 = function (str) {
    const arr = [
      str,
      toFemale(str),
      toPlural$1(str),
      toFemalePlural(str),
    ].filter(s => s);
    return arr
  };

  var adjective = {
    all: all$1,
    toFemale, toPlural: toPlural$1, toFemalePlural,
    fromFemale, fromPlural: fromPlural$1, fromFemalePlural: fromFemalePlural$1,
  };

  // "ridicola",
  // "ridicoli",
  // "ridicole"
  // console.log(toFemale(toPlural("ridicolo")))
  // console.log(toPlural("ridicolo"))

  const misc$1 = {};

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

  // a bare 'Verb' says less than a conjugation does - 'faranno'
  // .. and so does a tense with no person - 'sapevo'
  const bare = new Set(['Verb', 'PastTense', 'PresentTense']);
  const isEmpty = (w) => !words[w] || bare.has(words[w]);

  // these are nothing else - (but 'abbi' is also in our list of names)
  const ownImperatives = new Set(['sii', 'abbi', 'sappi', 'vogli']);

  const addVerbs = function (w) {
    // do present-tense
    let res = verb.toPresent(w);
    Object.keys(res).forEach((k) => {
      if (isEmpty(res[k])) {
        words[res[k]] = [tagMap[k], 'PresentTense'];
      }
    });
    // past-tense
    res = verb.toPast(w);
    Object.keys(res).forEach((k) => {
      if (isEmpty(res[k])) {
        words[res[k]] = [tagMap[k], 'PastTense'];
      }
    });
    // future-tense
    res = verb.toFuture(w);
    Object.keys(res).forEach((k) => {
      if (isEmpty(res[k])) {
        words[res[k]] = [tagMap[k], 'FutureTense'];
      }
    });
    // conditonal
    res = verb.toConditional(w);
    Object.keys(res).forEach((k) => {
      if (isEmpty(res[k])) {
        words[res[k]] = [tagMap[k], 'ConditionalVerb'];
      }
    });
    // imperfect
    res = verb.toImperfect(w);
    Object.keys(res).forEach((k) => {
      if (isEmpty(res[k])) {
        words[res[k]] = [tagMap[k], 'ImperfectVerb'];
      }
    });
    // imperfect
    res = verb.toSubjunctive(w);
    Object.keys(res).forEach((k) => {
      if (isEmpty(res[k])) {
        words[res[k]] = [tagMap[k], 'Subjunctive'];
      }
    });
    // imperatives are present-tense forms, but for a few - 'sii', 'abbi', 'sappi'
    res = verb.toImperative(w)
    ;['second', 'secondPlural'].forEach((k) => {
      if (res[k] && !/'/.test(res[k]) && (isEmpty(res[k]) || ownImperatives.has(res[k]))) {
        words[res[k]] = ['Imperative'];
      }
    });
    // gerunds
    res = verb.toGerund(w);
    words[res] = words[res] || ['Gerund'];
    // participle, in all gender/number agreements - fondato/a/i/e
    res = verb.toPastParticiple(w);
    if (res) {
      words[res] = words[res] || ['PastParticiple'];
      const fem = res.replace(/o$/, 'a');
      const plur = res.replace(/o$/, 'i');
      const femPlur = res.replace(/o$/, 'e');
      words[fem] = words[fem] || ['PastParticiple'];
      words[plur] = words[plur] || ['PastParticiple'];
      words[femPlur] = words[femPlur] || ['PastParticiple'];
    }
    // present participle
    res = verb.toPresentParticiple(w);
    words[res] = words[res] || ['PresentParticiple'];
  };

  // process 'Infinitive' last, so its generated conjugations
  // never shadow words from the curated lists (eg 'pizza')
  const tagList = Object.keys(lexData).sort((a, b) => {
    if (a === 'Infinitive') return 1
    if (b === 'Infinitive') return -1
    return 0
  });
  tagList.forEach((tag) => {
    const wordsObj = unpack(lexData[tag]);
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
  // console.log(Object.keys(lexicon).length.toLocaleString(), 'words')
  // console.log(words['dice'])
  // names of people and places, shared by every language - our own words win
  Object.keys(properNouns).forEach(tag => {
    Object.keys(unpack(properNouns[tag])).forEach(w => {
      words[w] = words[w] || tag;
    });
  });

  // rule-based noun inflection - the suffix-model only knows what is in its data

  // [singular, plural]
  const pairs = [
    ['uomo', 'uomini'],
    ['dio', 'dei'],
    ['bue', 'buoi'],
    ['tempio', 'templi'],
    ['moglie', 'mogli'],
    ['superficie', 'superfici'],
    ['effigie', 'effigi'],
    ['mille', 'mila'],
    // feminine, but not '-e'
    ['mano', 'mani'],
    ['ala', 'ali'],
    ['arma', 'armi'],
    // masculine singular, feminine '-a' plural
    ['dito', 'dita'],
    ['uovo', 'uova'],
    ['braccio', 'braccia'],
    ['labbro', 'labbra'],
    ['ginocchio', 'ginocchia'],
    ['sopracciglio', 'sopracciglia'],
    ['ciglio', 'ciglia'],
    ['lenzuolo', 'lenzuola'],
    ['osso', 'ossa'],
    ['paio', 'paia'],
    ['miglio', 'miglia'],
    ['centinaio', 'centinaia'],
    ['migliaio', 'migliaia'],
    ['grido', 'grida'],
    ['corno', 'corna'],
    ['orecchio', 'orecchie'],
    // masculine '-ga', without the 'h'
    ['belga', 'belgi'],
  ];
  const irregular = { toPlural: {}, fromPlural: {} };
  pairs.forEach(a => {
    irregular.toPlural[a[0]] = a[1];
    irregular.fromPlural[a[1]] = a[0];
  });
  // both plurals are used - 'i ginocchi', 'gli ossi'
  Object.assign(irregular.fromPlural, {
    ginocchi: 'ginocchio', ossi: 'osso', bracci: 'braccio', cigli: 'ciglio', orecchi: 'orecchio', gridi: 'grido', corni: 'corno'
  });

  // truncations, and other nouns that never change
  const same = new Set([
    'foto', 'auto', 'moto', 'radio', 'cinema', 'video', 'stereo', 'frigo', 'euro', 'zoo',
    'serie', 'specie', 'carie', 'barbarie', 'progenie',
    'gorilla', 'boia', 'vaglia', 'sosia', 'koala', 'panda', 'delta', 'cobra', 'puma',
    'bici', 'brindisi', 'eclissi', 'ellissi', 'sintassi', 'prassi', 'alibi', 'taxi'
  ]);

  // greek feminine nouns in '-i' never change - 'le crisi', 'le analisi'
  const greekI = /(crisi|lisi|^tesi|ipotesi|sintesi|protesi|parentesi|gnosi|genesi|oasi|enfasi|(metr|necr|acr|megal|tend)opoli)$/;

  // loanwords, stressed endings, greek '-i' nouns and monosyllables - 'film', 'città', 'crisi', 're'
  const isInvariable = function (str) {
    if (same.has(str) || greekI.test(str)) {
      return true
    }
    if (!/[aeio]$/.test(str)) {
      return true
    }
    // 're', 'gru', 'sci'
    return /^[^aeiouàèéìòù]*[aeiou]$/.test(str)
  };

  // masculine nouns in '-a' - mostly greek
  const maleSuffix$1 =
    /([iy]sta|gramma|dramma|framma|emma|ema|oma|sma|gma|iatra|[nirg]arca|cida|nauta|crata|peuta)$/;
  const maleWords = new Set([
    'amalgama', 'clima', 'coma', 'comma', 'enzima', 'pachiderma', 'panorama', 'pigiama', 'proclama', 'sperma', 'trauma',
    'tema', 'schema', 'idioma', 'assioma', 'plasma',
    'poeta', 'profeta', 'atleta', 'pianeta', 'asceta', 'esteta', 'esegeta', 'apologeta', 'analfabeta',
    'pilota', 'copilota', 'patriota', 'compatriota', 'despota', 'idiota',
    'eremita', 'israelita', 'metabolita', 'metropolita', 'neofita', 'ovocita', 'parassita', 'gesuita',
    'acrobata', 'pirata', 'cineasta', 'entusiasta', 'ginnasta', 'pederasta',
    'papa', 'duca', 'granduca', 'collega', 'stratega', 'geometra', 'scriba', 'transfuga', 'monarca'
  ]);
  const femaleWords = new Set(['pista', 'lista', 'vista', 'rivista', 'conquista', 'intervista', 'svista', 'provvista', 'asma', 'crema', 'gemma', 'flemma', 'maremma', 'soma', 'chioma']);

  // ..but these are people, of either gender - 'la collega', 'le atlete'
  const epicene = /(ista|asta|iatra|cida|nauta|peuta|collega|atleta|[il]ota|bata|beta)$/;

  // is this '-a' noun masculine? - gender is 'm', 'f' or undefined
  const isMaleA = function (str, gender) {
    if (femaleWords.has(str)) {
      return false
    }
    // 'la turista' -> 'le turiste'
    if (gender === 'f' && epicene.test(str)) {
      return false
    }
    return gender === 'm' || maleWords.has(str) || maleSuffix$1.test(str) || /^(vice)?capo./.test(str)
  };

  // 'ragazza' -> 'ragazze'
  const femalePlural = function (str) {
    // 'banca' -> 'banche'
    if (/[cg]a$/.test(str)) {
      return str.replace(/a$/, 'he')
    }
    // 'arancia' -> 'arance', but stressed 'allergia', 'nostalgia', 'scia' -> 'allergie'
    if (/[aeiou].*([^aeiourl][cg]|rc)ia$/.test(str)) {
      return str.replace(/ia$/, 'e')
    }
    return str.replace(/a$/, 'e')
  };

  // 'ragazze' -> 'ragazza'
  const fromFemalePlural = function (str) {
    // 'banche' -> 'banca'
    if (/[cg]he$/.test(str)) {
      return str.replace(/he$/, 'a')
    }
    // 'arance' -> 'arancia'
    if (/[cg]e$/.test(str)) {
      return str.replace(/e$/, 'ia')
    }
    return str.replace(/e$/, 'a')
  };

  // 'poeta' -> 'poeti', 'collega' -> 'colleghi'
  const malePlural = function (str) {
    if (/[cg]a$/.test(str)) {
      return str.replace(/a$/, 'hi')
    }
    return str.replace(/a$/, 'i')
  };

  // the singular of an '-i' plural, where its ending says so - 'lezioni', 'attrici', 'origini'
  const singularE$1 = /(ion|tric|[ai]gin|tudin)i$/;

  const { plural } = model$1.nouns;

  const revPlural = reverse(plural);

  // gender is an optional hint - 'm' or 'f'
  const toPlural = (str, gender) => {
    if (irregular.toPlural.hasOwnProperty(str)) {
      return irregular.toPlural[str]
    }
    // 'film', 'città', 'crisi' - and any other noun in '-i'
    if (isInvariable(str) || str.endsWith('i')) {
      return str
    }
    // the model is mostly masculine nouns - so '-a' nouns are done by rule
    if (str.endsWith('a')) {
      if (!isMaleA(str, gender)) {
        return femalePlural(str)
      }
      // 'capobanda' -> 'capibanda'
      const res = convert(str, plural);
      return res.endsWith('i') || res.endsWith('a') ? res : malePlural(str)
    }
    return convert(str, plural)
  };

  // words that the lexicon knows as a singular noun, or as an adjective that can be one - 'il giovane'
  const isNoun$1 = /^(Noun|Singular|MaleNoun|FemaleNoun)$/;
  const isAdj = /^(Noun|Singular|MaleNoun|FemaleNoun|MaleAdjective|Adjective)$/;
  const has$1 = (str, reg) => words.hasOwnProperty(str) && [].concat(words[str]).some((tag) => reg.test(tag));
  const isKnown = (str) => has$1(str, isNoun$1);
  // 'problema', but not 'casa'
  const isKnownA = (str) => maleWords.has(str) || (isKnown(str) && isMaleA(str));

  // an '-i' plural does not say what its singular ends in - 'libri' -> 'libro', 'cani' -> 'cane', 'poeti' -> 'poeta'
  // if we know only one of them as a word, use it
  const findKnown = function (str, gender) {
    const stem = str.slice(0, -1);
    // 'banchi' -> 'banco', 'colleghi' -> 'collega'
    const hard = stem.replace(/([cg])h$/, '$1');
    const found = [];
    // 'giovane' - but 'le case' is 'casa', before it is 'i casi', and 'tedesche' is no singular
    if (hard === stem && has$1(stem + 'e', isAdj) && !(isKnown(stem + 'a') && !isMaleA(stem + 'a'))) {
      found.push(stem + 'e');
    }
    // a feminine '-i' plural is an '-e' noun
    if (gender !== 'f') {
      found.push(...[hard + 'o', stem + 'io'].filter(isKnown));
      // 'pirati' -> 'pirata', but 'collega' is 'colleghi'
      if (isKnownA(hard + 'a') && !/[cg]$/.test(stem)) {
        found.push(hard + 'a');
      }
    }
    return found.length === 1 ? found[0] : null
  };

  const fromPlural = (str, gender) => {
    if (irregular.fromPlural.hasOwnProperty(str)) {
      return irregular.fromPlural[str]
    }
    if (isInvariable(str)) {
      return str
    }
    // an '-e' plural is a feminine '-a' noun - but 'i college' are not
    if (str.endsWith('e')) {
      return gender === 'm' ? str : fromFemalePlural(str)
    }
    if (!str.endsWith('i')) {
      return str
    }
    // 'zii' -> 'zio'
    if (str.endsWith('ii')) {
      return str.replace(/i$/, 'o')
    }
    // 'giovani' -> 'giovane'
    const known = findKnown(str, gender);
    if (known) {
      return known
    }
    // 'lezioni' -> 'lezione', 'le chiavi' -> 'chiave'
    if (singularE$1.test(str) || gender === 'f') {
      return str.replace(/i$/, 'e')
    }
    const res = convert(str, revPlural);
    // the reversed model can miss - 'uovm'
    return /[aeo]$/.test(res) ? res : str.replace(/i$/, 'o')
  };

  const all = (str) => {
    const plur = toPlural(str);
    if (plur === str) {
      return [str]
    }
    return [str, plur]
  };

  var noun = {
    isMaleA,
    toPlural,
    fromPlural,
    all
  };

  var methods = {
    verb,
    noun,
    adjective,
  };

  const verbForm = function (term) {
    const want = [
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
  Object.keys(irregular$1.paradigms).forEach((inf) => {
    const p = irregular$1.paradigms[inf];
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
  Object.keys(irregular$1.participles).forEach((inf) => {
    const pp = irregular$1.participles[inf];
    if (!irregularRoots.hasOwnProperty(pp)) {
      irregularRoots[pp] = inf;
    }
  });
  Object.keys(irregular$1.gerunds).forEach((inf) => {
    const ger = irregular$1.gerunds[inf];
    if (!irregularRoots.hasOwnProperty(ger)) {
      irregularRoots[ger] = inf;
    }
  });

  // a hint for the noun inflector - 'le chiavi' is 'chiave'
  const nounGender$1 = function (term) {
    if (term.tags.has('FemaleNoun')) {
      return 'f'
    }
    return term.tags.has('MaleNoun') ? 'm' : undefined
  };

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

  // the tagger's tense + person are often a guess, and so is the infinitive we get from them.
  // if it does not conjugate back into our word, look for a known verb that does
  const checkRoot = function (str, guess, world) {
    const verb = world.methods.two.transform.verb;
    if (guess && guess !== str && verb.findHits(str, guess).length > 0) {
      return guess
    }
    const lexicon = world.model.one.lexicon;
    const isVerb = (inf) => lexicon.hasOwnProperty(inf) && [].concat(lexicon[inf]).includes('Infinitive');
    const found = verb.lookup(str, { isVerb, known: true });
    return found ? found.root : guess
  };

  // 'porto' is the participle of 'porgere', but with a person, it is 'io porto' - from 'portare'
  const isOther = function (term, str, inf, verb) {
    return Boolean(verbForm(term)) && !term.tags.has('PastParticiple') && verb.findHits(str, inf).length === 0
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
          const form = verbForm(term) || guessForm(str);
          // 'dammelo' is 'dare'
          const lexicon = view.world.model.one.lexicon;
          const imp = term.tags.has('Imperative') ? parseImperative(str, lexicon) : null;
          const bare = term.tags.has('Imperative') && !imp ? fromImperative(str, (inf) => lexicon[inf] === 'Infinitive') : null;
          if (imp || bare) {
            term.root = imp ? imp.root : bare;
          } else if (irregularRoots.hasOwnProperty(str) && !isOther(term, str, irregularRoots[str], verb)) {
            term.root = irregularRoots[str];
          } else if (term.tags.has('Infinitive')) {
            // an infinitive may carry a pronoun suffix - 'vederlo'
            const inf = stripReflexive(str);
            term.root = irregularRoots.hasOwnProperty(inf) ? irregularRoots[inf] : inf;
          } else if (term.tags.has('Gerund')) {
            term.root = verb.fromGerund(str, form);
          } else if (term.tags.has('ConditionalVerb')) {
            term.root = checkRoot(str, verb.fromConditional(str, form), view.world);
          } else if (term.tags.has('PastParticiple')) {
            const masc = masculineParticiple(str);
            term.root = irregularRoots.hasOwnProperty(masc)
              ? irregularRoots[masc]
              : verb.fromPastParticiple(masc, form);
          } else if (term.tags.has('ImperfectVerb')) {
            term.root = checkRoot(str, verb.fromImperfect(str, form), view.world);
          } else if (term.tags.has('Subjunctive')) {
            term.root = verb.fromSubjunctive(str, form);
          } else if (term.tags.has('PresentTense')) {
            term.root = checkRoot(str, verb.fromPresent(str, form), view.world);
          } else if (term.tags.has('PastTense')) {
            term.root = checkRoot(str, verb.fromPast(str, form), view.world);
          } else if (term.tags.has('FutureTense')) {
            term.root = checkRoot(str, verb.fromFuture(str, form), view.world);
          } else {
            term.root = checkRoot(str, verb.fromPresent(str, form), view.world);
          }
        }

        // nouns -> singular form
        if (term.tags.has('Noun')) {
          if (term.tags.has('PluralNoun')) {
            str = noun.fromPlural(str, nounGender$1(term));
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

  // only our own tags, and what differs from the shared tagset - see ../plugin.js
  var nouns$1 = {
    Noun: {
      aliases: [null, 'Nome', 'Sostantivo'],
    },
    Singular: {
      aliases: [null, 'Singolare'],
      not: ['PluralNoun'],
    },
    ProperNoun: {
      aliases: [null, 'NomeProprio'],
    },
    Person: {
      aliases: [null, 'Persona'],
    },
    FirstName: {
      aliases: [null, 'NomeDiBattesimo'],
    },
    MaleName: {
      aliases: [null, 'NomeMaschile'],
    },
    FemaleName: {
      aliases: [null, 'NomeFemminile'],
    },
    LastName: {
      aliases: [null, 'Cognome'],
    },
    Honorific: {
      aliases: [null, 'Titolo'],
      is: 'Noun',
    },
    Place: {
      aliases: [null, 'Luogo'],
    },
    Country: {
      aliases: [null, 'Paese'],
    },
    City: {
      aliases: [null, 'Città'],
    },
    Region: {
      aliases: [null, 'Regione'],
    },
    Address: {
      aliases: [null, 'Indirizzo'],
    },
    Organization: {
      aliases: [null, 'Organizzazione'],
    },
    SportsTeam: {
      aliases: [null, 'Squadra'],
    },
    School: {
      aliases: [null, 'Scuola'],
    },
    Company: {
      aliases: [null, 'Azienda'],
    },
    PluralNoun: {
      aliases: [null, 'SostantivoPlurale'],
      is: 'Noun',
      not: ['Singular'],
    },
    Uncountable: {
      aliases: [null, 'NonNumerabile'],
    },
    Pronoun: {
      aliases: [null, 'Pronome'],
    },
    Actor: {
      not: ['Person', 'Place', 'Organization'],
    },
    Activity: {
      aliases: [null, 'Attività'],
    },
    Unit: {
      aliases: [null, 'Unità'],
    },
    Demonym: {
      aliases: [null, 'Demonimo'],
    },
    Possessive: {
      aliases: [null, 'Possessivo'],
    },
    MaleNoun: {
      aliases: [null, 'SostantivoMaschile'],
      is: 'Noun',
      not: ['FemaleNoun'],
    },
    FemaleNoun: {
      aliases: [null, 'SostantivoFemminile'],
      is: 'Noun',
      not: ['MaleNoun'],
    },
  };

  // only our own tags, and what differs from the shared tagset - see ../plugin.js
  var verbs$1 = {
    Verb: {
      aliases: [null, 'Verbo'],
    },
    PresentTense: {
      aliases: [null, 'Presente'],
      not: ['PastTense'],
    },
    Infinitive: {
      aliases: [null, 'Infinito'],
    },
    Imperative: {
      aliases: [null, 'Imperativo'],
      is: 'Infinitive',
      not: undefined,
    },
    Gerund: {
      aliases: [null, 'Gerundio'],
    },
    PastTense: {
      aliases: [null, 'Passato'],
      not: ['PresentTense', 'Gerund'],
    },
    Copula: {
    },
    Reflexive: {
      aliases: [null, 'Riflessivo'],
      is: undefined,
    },
    Modal: {
      aliases: [null, 'Modale'],
    },
    PerfectTense: {
      aliases: [null, 'PassatoProssimo'],
      is: 'Verb',
      not: ['Gerund'],
    },
    Pluperfect: {
      aliases: [null, 'Trapassato'],
      is: 'Verb',
    },
    Participle: {
      aliases: [null, 'Participio'],
    },
    PhrasalVerb: {
    },
    Particle: {
    },
    Auxiliary: {
      aliases: [null, 'Ausiliare'],
    },
    PresentParticiple: {
      aliases: [null, 'ParticipioPresente'],
      is: 'PresentTense',
      not: ['PastTense', 'FutureTense'],
    },
    PastParticiple: {
      aliases: [null, 'ParticipioPassato'],
      is: 'PastTense',
      not: ['PresentTense', 'FutureTense'],
    },
    PastSimple: {
      aliases: [null, 'PassatoRemoto'],
      is: 'PastTense',
      not: ['PresentTense', 'FutureTense'],
    },
    ConditionalVerb: {
      aliases: [null, 'Condizionale'],
      is: 'Verb',
    },
    ImperfectVerb: {
      aliases: [null, 'Imperfetto'],
      is: 'Verb',
    },
    Subjunctive: {
      aliases: [null, 'Congiuntivo'],
      is: 'Verb',
    },
    FutureTense: {
      aliases: [null, 'Futuro'],
      not: ['PresentTense', 'PastTense', 'Gerund'],
    },
    FirstPerson: {
      aliases: [null, 'PrimaPersona'],
      is: 'Verb',
      not: ['SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural'],
    },
    SecondPerson: {
      aliases: [null, 'SecondaPersona'],
      is: 'Verb',
      not: ['FirstPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural'],
    },
    ThirdPerson: {
      aliases: [null, 'TerzaPersona'],
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural'],
    },
    FirstPersonPlural: {
      aliases: [null, 'PrimaPersonaPlurale'],
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'SecondPersonPlural', 'ThirdPersonPlural'],
    },
    SecondPersonPlural: {
      aliases: [null, 'SecondaPersonaPlurale'],
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'ThirdPersonPlural'],
    },
    ThirdPersonPlural: {
      aliases: [null, 'TerzaPersonaPlurale'],
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural'],
    },
  };

  // only our own tags, and what differs from the shared tagset - see ../plugin.js
  var values = {
    Value: {
      aliases: [null, 'Numero'],
    },
    Ordinal: {
      aliases: [null, 'Ordinale'],
    },
    Cardinal: {
      aliases: [null, 'Cardinale'],
    },
    Fraction: {
      aliases: [null, 'Frazione'],
    },
    Multiple: {
      aliases: [null, 'Multiplo'],
    },
    RomanNumeral: {
      aliases: [null, 'NumeroRomano'],
      not: ['TextValue'],
    },
    TextValue: {
      aliases: [null, 'Numerale'],
      not: ['NumericValue'],
    },
    NumericValue: {
      aliases: [null, 'Numerico'],
      not: ['TextValue'],
    },
    Money: {
      aliases: [null, 'Denaro'],
    },
    Percent: {
      aliases: [null, 'Percentuale'],
    },
  };

  // only our own tags, and what differs from the shared tagset - see ../plugin.js
  var dates = {
    Date: {
      aliases: [null, 'Data'],
    },
    Month: {
      aliases: [null, 'Mese'],
      is: 'Singular',
      also: ['Date'],
      not: ['Year', 'WeekDay', 'Time'],
    },
    WeekDay: {
      aliases: [null, 'GiornoDellaSettimana'],
      is: 'Noun',
      also: ['Date'],
      not: undefined,
    },
    Year: {
      aliases: [null, 'Anno'],
      not: ['RomanNumeral'],
    },
    FinancialQuarter: {
      aliases: [null, 'Trimestre'],
      not: 'Fraction',
    },
    Holiday: {
      aliases: [null, 'Festività'],
    },
    Season: {
      aliases: [null, 'Stagione'],
      not: undefined,
    },
    Timezone: {
      aliases: [null, 'FusoOrario'],
      is: 'Noun',
      also: ['Date'],
    },
    Time: {
      aliases: [null, 'Ora'],
      not: ['AtMention'],
    },
    Duration: {
      aliases: [null, 'Durata'],
      is: 'Noun',
      also: ['Date'],
    },
  };

  // only our own tags, and what differs from the shared tagset - see ../plugin.js
  var misc = {
    Adjective: {
      aliases: [null, 'Aggettivo'],
    },
    Comparable: {
      aliases: [null, 'Comparabile'],
    },
    Comparative: {
      aliases: [null, 'Comparativo'],
    },
    Superlative: {
      aliases: [null, 'Superlativo'],
    },
    MaleAdjective: {
      aliases: [null, 'AggettivoMaschile'],
      is: 'Adjective',
      not: ['FemaleAdjective'],
    },
    FemaleAdjective: {
      aliases: [null, 'AggettivoFemminile'],
      is: 'Adjective',
      not: ['MaleAdjective'],
    },
    PluralAdjective: {
      aliases: [null, 'AggettivoPlurale'],
      is: 'Adjective',
    },
    NumberRange: {
      aliases: [null, 'IntervalloNumerico'],
    },
    Adverb: {
      aliases: [null, 'Avverbio'],
    },
    Determiner: {
      aliases: [null, 'Determinante', 'Articolo'],
    },
    Conjunction: {
      aliases: [null, 'Congiunzione'],
      is: undefined,
      not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'Value', 'QuestionWord'],
    },
    Preposition: {
      aliases: [null, 'Preposizione'],
      is: undefined,
      not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord'],
    },
    QuestionWord: {
      aliases: [null, 'Interrogativo'],
    },
    Currency: {
      aliases: [null, 'Valuta'],
    },
    Expression: {
      aliases: [null, 'Interiezione'],
    },
    Abbreviation: {
      aliases: [null, 'Abbreviazione'],
    },
    Url: {
      not: ['HashTag', 'PhoneNumber', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
    },
    PhoneNumber: {
      aliases: [null, 'Telefono'],
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
    },
    HashTag: {
    },
    AtMention: {
      aliases: [null, 'Menzione'],
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
      aliases: [null, 'Acronimo'],
      not: ['PluralNoun', 'RomanNumeral'],
    },
    Negative: {
      aliases: [null, 'Negazione'],
      not: ['Noun', 'Adjective', 'Value'],
    },
    Condition: {
      aliases: [null, 'Condizione'],
      is: undefined,
    },
  };

  const ours = Object.assign({}, nouns$1, verbs$1, values, dates, misc);

  // start from the shared tagset, then apply our own tags and changes
  const tags = { ...allTags };

  Object.keys(ours).forEach(tag => {
    const en = tags[tag];
    if (!en) {
      tags[tag] = ours[tag];
      return
    }
    // our aliases lead, so the first one stays the preferred name - then the english ones, like #NN
    const aliases = (ours[tag].aliases || [null]).concat((en.aliases || []).filter(str => str));
    tags[tag] = { ...en, ...ours[tag], aliases };
  });

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
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    const { regexText, regexNormal, regexNumbers } = world.model.two;
    const normal = term.machine || term.normal;
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

  const isTitleCase$1 = function (str) {
    return /^[A-ZÄÖÜ][a-z'\u00C0-\u00FF]/.test(str) || /^[A-ZÄÖÜ]$/.test(str)
  };

  // add a noun to any non-0 index titlecased word, with no existing tag
  const titleCaseNoun = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    // don't over-write any tags
    if (term.tags.size > 0) {
      return
    }
    // skip first-word, for now
    if (i === 0) {
      return
    }
    if (isTitleCase$1(term.text)) {
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
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    if (term.tags.has('NumericValue') && term.tags.has('Cardinal') && term.normal.length === 4) {
      const num = Number(term.normal);
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
    const str = term.text;
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
    const setTag = world.methods.one.setTag;
    const term = terms[i];
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
    const setTag = world.methods.one.setTag;
    const term = terms[i];
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
      const suffix = str.substring(len - i, len);
      if (suffixes[suffix.length].hasOwnProperty(suffix) === true) {
        const tag = suffixes[suffix.length][suffix];
        // console.log(suffix)
        return tag
      }
    }
    return null
  };
  // decide tag from the ending of the word
  const suffixCheck = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const suffixes = world.model.two.suffixPatterns;
    const term = terms[i];
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
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    if (term.tags.size > 0) {
      return null
    }
    // an unknown prefixed compound takes the tags of its base word
    const pre = term.normal.match(prefix);
    if (pre) {
      const base = term.normal.slice(pre[0].length);
      const lexicon = world.model.one.lexicon || {};
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
      const lexicon = world.model.one.lexicon || {};
      if (lexicon[term.normal + 'e'] === 'Infinitive') {
        setTag([term], 'Infinitive', world, false, '2-truncated-infinitive');
        return true
      }
    }
    return null
  };

  // an unknown word that is an imperative + its pronouns - 'dammelo', 'guardami'
  const imperative = function (terms, i, world) {
    const term = terms[i];
    if (term.tags.size > 0 || term.normal.length < 5) {
      return null
    }
    const found = parseImperative(term.normal, world.model.one.lexicon || {});
    if (found) {
      world.methods.one.setTag([term], 'Imperative', world, false, '2-imperative-clitic');
      return true
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
      const suffix = str.substring(len - i, len);
      if (suffixes[suffix.length].hasOwnProperty(suffix) === true) {
        const tag = suffixes[suffix.length][suffix];
        return tag
      }
    }
    return null
  };

  const f$2 = 'FemaleNoun';
  const m$2 = 'MaleNoun';

  // https://en.wiktionary.org/wiki/Category:Italian_feminine_suffixes

  /*








  */

  const suffixes = [
    null,
    {
      'a': f$2,
      'o': m$2,
      'i': m$2,
      // '-e' is either - 'il fiume', 'la notte'
    },
    // two
    {
      'tà': f$2,
      'tù': f$2,
      'ie': f$2,
    },
    // three
    {
      // 'are': m,
      'ese': m$2,
      'ile': m$2,
      'oma': m$2,
      'one': m$2,
      'ore': m$2,
      // 'are': f,
      'ime': f$2,
      'ite': f$2,
      'ame': m$2,
      'ale': m$2,
      'ere': m$2,
      'ice': f$2,
    },
    //four
    {
      'cida': m$2,
      'iere': m$2,
      'ista': m$2,
      'eide': f$2,
      'poli': f$2,
      'essa': f$2,
      'ione': f$2,

    },
    // five
    {
      'crate': f$2,
      'gione': f$2,
      // 'mante': f,
      'opoli': f$2,
      'ptosi': f$2,
      // 'mante': m,
      'nauta': m$2,
      // 'monarca', but not 'barca'
      'narca': m$2,
      'iarca': m$2,
      'rarca': m$2,
      'garca': m$2,
      // 'crate': m,
      'trice': f$2,
      'igine': f$2,
      'udine': f$2,
    },
    //six
    {
      'cinesi': f$2,
    },
    {}
  ];

  const nounGender = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    const tags = term.tags;
    const str = term.normal || term.implicit || '';
    if (tags.has('Noun') && !tags.has('Pronoun') && !tags.has('MaleNoun') && !tags.has('FemaleNoun')) {
      // 'il poeta', 'il clima' - before '-a' says feminine
      const isMaleA = str.endsWith('a') && world.methods.two.transform.noun.isMaleA(str);
      const tag = isMaleA ? m$2 : suffixLoop(str, suffixes);
      if (tag) {
        setTag([term], tag, world, false, '2-guess-gender');
      }
    }
  };

  //  -o  (masculine) ->  -i in the plural, 
  //  -a  (feminine), -> -e in the plural.
  //  -e  (either gender) -> -i in the plural.

  // endings of singular '-e' nouns - 'stazione', 'studente', 'attrice'
  const singularE = /(ione|tore|sore|ente|ante|trice|udine|igine|iere)$/;
  // most '-ie' are plurals of '-ia' ('famiglie', 'storie') - these are not
  const singularIe = new Set(['moglie', 'serie', 'specie', 'superficie', 'carie', 'barbarie', 'progenie', 'effigie']);

  const isSingularE = (str) => singularIe.has(str) || singularE.test(str);

  const checkSuffix$2 = function (term) {
    const str = term.normal || term.implicit || '';
    if (str.endsWith('i') || str.endsWith('che') || str.endsWith('ghe')) {
      return 'PluralNoun'
    }
    if (isSingularE(str)) {
      return 'Singular'
    }
    // a bare '-e' is more often a plural - 'mele', 'case'
    if (str.endsWith('e') && !term.tags.has('MaleNoun')) {
      return 'PluralNoun'
    }
    if (str.endsWith('o') || str.endsWith('a')) {
      return 'Singular'
    }
    return null
  };

  const nounNumber = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    const tags = term.tags;
    if (tags.has('Noun') && !tags.has('Pronoun') && !tags.has('PluralNoun') && !tags.has('Singular')) {
      const tag = checkSuffix$2(term);
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
    const m = 'MaleAdjective';
    const f = 'FemaleAdjective';
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
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    const tags = term.tags;
    const str = term.normal || term.implicit || '';
    if (tags.has('Adjective') && !tags.has('MaleAdjective') && !tags.has('FemaleAdjective')) {
      const tag = checkSuffix$1(str);
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
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    const tags = term.tags;
    const str = term.normal || term.implicit || '';
    if (tags.has('Adjective') && !tags.has('PluralAdjective')) {
      const tag = checkSuffix(str);
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
      found = found || imperative(terms, i, world);
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


  const tagger$1 = function (view) {
    const world = view.world;
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
      preTagger: tagger$1
    },
    model: {
      two: model
    },
    hooks: ['preTagger']
  };

  // verbs that build their passato prossimo with 'essere' - 'sono andato'
  // (any other participle after 'essere' is a passive, or an adjective - 'è amato')
  var essereVerbs = new Set([
    'accadere', 'andare', 'apparire', 'arrivare', 'arrossire', 'avvenire', 'bastare', 'cadere', 'capitare',
    'costare', 'crescere', 'dimagrire', 'dipendere', 'divenire', 'diventare', 'durare', 'emergere', 'entrare',
    'esistere', 'essere', 'fuggire', 'giungere', 'guarire', 'impazzire', 'ingrassare', 'intervenire', 'invecchiare',
    'morire', 'nascere', 'parere', 'partire', 'pervenire', 'piacere', 'restare', 'rientrare', 'rimanere',
    'ritornare', 'riuscire', 'salire', 'scappare', 'scendere', 'scomparire', 'sembrare', 'sorgere', 'sparire',
    'stare', 'succedere', 'svenire', 'tornare', 'uscire', 'venire',
  ]);

  // compound tenses, with something between the auxiliary and its participle
  // 'ho sempre [mangiato]', 'lei è già [partita]', 'non ho mai [visto]'
  // - the participle is often mis-read as a noun, an adjective, or a present-tense verb

  const avere = new Set([
    'ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno', 'avevo', 'avevi', 'aveva', 'avevamo', 'avevate', 'avevano',
    'ebbi', 'avesti', 'ebbe', 'avemmo', 'aveste', 'ebbero', 'avrò', 'avrai', 'avrà', 'avremo', 'avrete', 'avranno',
    'abbia', 'abbiano', 'avessi', 'avesse', 'avessimo', 'avessero', 'avrei', 'avresti', 'avrebbe', 'avremmo',
    'avreste', 'avrebbero', 'avere', 'aver',
  ]);
  const essere = new Set([
    'sono', 'sei', 'è', 'siamo', 'siete', 'ero', 'eri', 'era', 'eravamo', 'eravate', 'erano', 'fui', 'fosti', 'fu',
    'fummo', 'foste', 'furono', 'sarò', 'sarai', 'sarà', 'saremo', 'sarete', 'saranno', 'sia', 'siano', 'fossi',
    'fosse', 'fossimo', 'fossero', 'sarei', 'saresti', 'sarebbe', 'saremmo', 'sareste', 'sarebbero', 'essere',
  ]);
  // words that go in the middle
  const fillers$1 = new Set(['sempre', 'mai', 'già', 'ancora', 'appena', 'anche', 'più', 'proprio', 'spesso', 'solo', 'quasi', 'pure', 'ormai', 'davvero']);
  const reflexives$1 = new Set(['mi', 'ti', 'si', 'ci', 'vi']);
  const persons$3 = ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural'];

  // every irregular participle, mapped back to its infinitive
  let irregulars = null;
  const fromIrregular = function (str) {
    if (irregulars === null) {
      irregulars = {};
      Object.keys(irregular$1.participles || {}).forEach((inf) => {
        irregulars[irregular$1.participles[inf]] = inf;
      });
      Object.keys(irregular$1.paradigms || {}).forEach((inf) => {
        const pp = irregular$1.paradigms[inf].pastParticiple;
        if (typeof pp === 'string' && !irregulars.hasOwnProperty(pp)) {
          irregulars[pp] = inf;
        }
      });
    }
    return irregulars.hasOwnProperty(str) ? irregulars[str] : null
  };

  const isInfinitive$3 = function (str, lexicon) {
    if (!lexicon.hasOwnProperty(str)) {
      return false
    }
    const tags = lexicon[str];
    return tags === 'Infinitive' || (Array.isArray(tags) && tags.includes('Infinitive'))
  };

  // the infinitive of this participle, in any agreement - 'partita' -> 'partire'
  const fromParticiple$1 = function (str, world) {
    if (!/[ts][oaie]$/.test(str)) {
      return null
    }
    const verb = world.methods.two.transform.verb;
    const masc = str.replace(/[aie]$/, 'o');
    const found = fromIrregular(masc);
    if (found) {
      return found
    }
    const inf = verb.fromPastParticiple(masc);
    if (inf && inf !== masc && isInfinitive$3(inf, world.model.one.lexicon) && verb.toPastParticiple(inf) === masc) {
      return inf
    }
    return null
  };

  const word = (term) => (term.text === '' && term.implicit ? term.implicit : term.normal);

  const tagCompounds = function (doc) {
    const world = doc.world;
    const { setTag, unTag } = world.methods.one;
    doc.docs.forEach((terms) => {
      terms.forEach((term, i) => {
        const str = word(term);
        const isAvere = avere.has(str);
        if ((!isAvere && !essere.has(str)) || !term.tags.has('Verb')) {
          return
        }
        // skip over any adverbs
        let n = i + 1;
        while (terms[n] && (fillers$1.has(terms[n].normal) || terms[n].tags.has('Adverb') || terms[n].tags.has('Negative'))) {
          n += 1;
        }
        const next = terms[n];
        if (!next) {
          return
        }
        const inf = fromParticiple$1(next.normal, world);
        if (!inf) {
          return
        }
        // with 'essere', only some verbs are a compound tense - 'è partita', 'si è alzato'
        if (!isAvere) {
          // skip back over the host of a contraction - "s'è alzato"
          const before = terms[i - 1] || {};
          if (!essereVerbs.has(inf) && !reflexives$1.has(before.implicit || before.normal)) {
            return
          }
        }
        if (!next.tags.has('PastParticiple')) {
          persons$3.forEach((tag) => unTag([next], tag, world.model.one.tagSet));
          setTag([next], ['Verb', 'PastParticiple'], world, false, 'compound-participle');
        }
        setTag([term], 'Auxiliary', world, false, 'compound-aux');
      });
    });
  };

  // a word that the lexicon only knows as an adjective is the noun of its phrase,
  // when it follows a determiner and no noun follows it
  // 'i [medici]', 'un [italiano]', 'i [ricchi] e i [poveri]', 'dei [giovani]'
  // - but not 'i giovani studenti', or 'gli studenti giovani'

  const m$1 = 'MaleNoun';
  const f$1 = 'FemaleNoun';
  const s = 'Singular';
  const p = 'PluralNoun';

  // the gender and number that each noun-introducer gives its noun
  const dets = {};
  const add = (str, gender, number) => {
    str.split(' ').forEach((w) => {
      dets[w] = [gender, number];
    });
  };
  // articles, and preposition+article contractions
  add('il lo un uno del dello al allo nel nello sul sullo dal dallo col', m$1, s);
  add('la una della alla nella sulla dalla', f$1, s);
  add('i gli dei degli ai agli nei negli sui sugli dai dagli coi', m$1, p);
  add('le delle alle nelle sulle dalle', f$1, p);
  // demonstratives - 'quello' and 'quelli' are left out, they are pronouns before an adjective ('quello rosso')
  add('questo quel', m$1, s);
  add('questa quella', f$1, s);
  add('questi quei quegli', m$1, p);
  add('queste quelle', f$1, p);
  // quantifiers - 'tutti' and 'pochi' are left out, they often sit before a real adjective ('sono tutti felici')
  add('nessun ciascun', m$1, s);
  add('nessuna ciascuna', f$1, s);
  add('alcuni molti', m$1, p);
  add('alcune molte', f$1, p);
  add('ogni qualche', null, s);
  // possessives - 'i miei [cari]'
  add('mio tuo suo nostro vostro', m$1, s);
  add('mia tua sua nostra vostra', f$1, s);
  add('miei tuoi suoi nostri vostri', m$1, p);
  add('mie tue sue nostre vostre', f$1, p);
  add('loro', null, null);
  // elided forms, split-up by the tokenizer - "l'italiano", "un'italiana", "quell'altro"
  const elided$2 = {
    lo: [null, s],
    l: [null, s],
    una: [f$1, s],
    questo: [null, s],
    quello: [null, s],
  };

  // the gender + number of the determiner, if it is one
  const getDet = function (term) {
    if (!term || term.tags.has('Verb')) {
      return null
    }
    // the clitic in 'lo vedo', and 'ne', 'ci' are pronouns - but 'mio' is tagged as one, too
    if (term.tags.has('Pronoun') && !term.tags.has('Possessive')) {
      return null
    }
    if (term.implicit) {
      return elided$2.hasOwnProperty(term.implicit) ? elided$2[term.implicit] : null
    }
    return dets.hasOwnProperty(term.normal) ? dets[term.normal] : null
  };

  // would this word be the noun of the phrase, instead?
  const isHead = function (term) {
    if (!term) {
      return false
    }
    const tags = term.tags;
    // 'il vecchio mi ha detto' - a clitic is not the head of this phrase
    if (tags.has('Pronoun') && !tags.has('Possessive')) {
      return false
    }
    // 'i giovani studenti', 'la bella italiana', 'i primi due'
    return tags.has('Noun') || tags.has('Adjective') || tags.has('Value')
  };

  const tagNounAdjectives = function (doc) {
    const world = doc.world;
    const setTag = world.methods.one.setTag;
    doc.docs.forEach((terms) => {
      terms.forEach((term, i) => {
        if (!term.tags.has('Adjective')) {
          return
        }
        const det = getDet(terms[i - 1]);
        if (!det || isHead(terms[i + 1])) {
          return
        }
        const wasFemale = term.tags.has('FemaleAdjective');
        setTag([term], 'Noun', world, false, 'det-adj-noun');
        // 'le giovani', 'dei ricchi' - agree with the determiner
        const [gender, number] = det;
        if (gender || wasFemale) {
          setTag([term], gender || f$1, world, false, 'det-adj-gender');
        }
        if (number) {
          setTag([term], number, world, false, 'det-adj-number');
        }
        // otherwise, go by the ending of the word
        nounGender(terms, i, world);
        nounNumber(terms, i, world);
      });
    });
  };

  // imperatives that look like something else
  const persons$2 = ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural'];
  // 'dagli il libro' - give him the book
  const daForms = new Set(['dagli', 'dalle', 'dallo', 'dalla']);
  const afterDa = new Set(['il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'a', 'subito', 'tu', 'tutto', 'questo', 'questa']);

  const isInfinitive$2 = function (str, lexicon) {
    const tags = Object.prototype.hasOwnProperty.call(lexicon, str) ? lexicon[str] : null;
    return tags === 'Infinitive' || (Array.isArray(tags) && tags.includes('Infinitive'))
  };

  const tagImperatives = function (doc) {
    const world = doc.world;
    const { setTag, unTag } = world.methods.one;
    const lexicon = world.model.one.lexicon;
    const tag = function (term, reason) {
      persons$2.concat(['PastParticiple', 'PastTense']).forEach((t) => unTag([term], t, world.model.one.tagSet));
      term.tags.clear();
      setTag([term], 'Imperative', world, false, reason);
    };
    doc.docs.forEach((terms) => {
      const term = terms[0];
      const next = terms[1];
      if (!term || term.implicit !== undefined) {
        return
      }
      const str = term.normal;
      if (term.tags.has('Imperative')) {
        return
      }
      // 'dagli il libro', 'dalle un bacio'
      if (daForms.has(str) && next && afterDa.has(next.normal)) {
        tag(term, 'da-imperative');
        return
      }
      // 'fermati!', 'alzati subito' - also the plural participles of these verbs
      if (/[aie]ti$/.test(str) && (term.tags.has('PastParticiple') || !term.tags.has('Verb'))) {
        const found = parseImperative(str, lexicon);
        const isObject = next && (next.tags.has('Determiner') || next.tags.has('Noun'));
        if (found && found.clitic === 'ti' && !isObject) {
          tag(term, 'reflexive-imperative');
          return
        }
      }
      // 'Mangia la pasta!', 'Andiamo!' - a present-tense form, in an exclamation
      const last = terms[terms.length - 1];
      if (/!/.test(last.post) && term.tags.has('PresentTense') && !term.tags.has('Auxiliary') && !term.tags.has('Infinitive')) {
        const root = fromImperative(str, (inf) => isInfinitive$2(inf, lexicon));
        if (root) {
          tag(term, 'exclamation-imperative');
        }
      }
    });
  };

  // many verb-forms are also a noun or an adjective - 'cucina', 'porto', 'gioco', 'vive', 'sale'
  // and the lexicon gives them to the noun.
  // when a sentence has no verb at all, look for one of these, in a place where a verb goes.

  const subjects$2 = new Set(['io', 'tu', 'lui', 'lei', 'egli', 'ella', 'noi', 'voi', 'loro']);
  // 'non [vive]', 'mi [porto]', 'dove [vivi]'
  const before = new Set([
    'non', 'mi', 'ti', 'si', 'ci', 'vi', 'ne', 'dove', 'come', 'quando', 'perché', 'cosa', 'chi', 'quanto', 'anche',
    'sempre', 'spesso', 'oggi', 'domani', 'ora', 'adesso', 'qui',
  ]);
  // 'di giorno', 'di solito'
  const diWords = new Set(['giorno', 'notte', 'sera', 'mattina', 'pomeriggio', 'solito', 'più', 'meno', 'rado', 'nuovo', 'corsa', 'fretta']);
  const joins = new Set(['e', 'o', 'ma', 'poi']);
  const tenses = { present: 'PresentTense', imperfect: 'ImperfectVerb', future: 'FutureTense' };
  const persons$1 = {
    first: 'FirstPerson',
    second: 'SecondPerson',
    third: 'ThirdPerson',
    firstPlural: 'FirstPersonPlural',
    secondPlural: 'SecondPersonPlural',
    thirdPlural: 'ThirdPersonPlural',
  };
  const nonFinite = ['Infinitive', 'Gerund', 'PastParticiple', 'PresentParticiple'];

  const isInfinitive$1 = function (str, lexicon) {
    const tags = Object.prototype.hasOwnProperty.call(lexicon, str) ? lexicon[str] : null;
    return tags === 'Infinitive' || (Array.isArray(tags) && tags.includes('Infinitive'))
  };
  const isFinite$2 = (term) => term.tags.has('Verb') && term.tags.size > 1 && !nonFinite.some((tag) => term.tags.has(tag));
  const isNoun = (term) => Boolean(term) && term.tags.has('Noun') && !term.tags.has('Pronoun');
  // something that a verb can lead into - 'porto [il] libro', 'gioco [a] calcio', 'vive [qui]'
  const isObject = function (term) {
    return Boolean(term) && (term.tags.has('Determiner') || term.tags.has('Preposition') || term.tags.has('Adverb') || term.tags.has('Value'))
  };

  const homographVerbs = function (doc) {
    const world = doc.world;
    const lexicon = world.model.one.lexicon;
    const verb = world.methods.two.transform.verb;
    const isVerb = (inf) => isInfinitive$1(inf, lexicon);
    const lookup = function (term) {
      // a verb with no tense is only a guess - 'non [mente]'
      const isGuess = term.tags.has('Verb') && term.tags.size === 1;
      if (term.implicit !== undefined || !(isGuess || term.tags.has('Noun') || term.tags.has('Adjective'))) {
        return null
      }
      if (term.tags.has('Verb') && !isGuess) {
        return null
      }
      if (term.tags.has('Pronoun') || term.normal.length < 3) {
        return null
      }
      return verb.lookup(term.normal, { isVerb, known: true, tenses: Object.keys(tenses) })
    };
    const tag = function (term, hit, reason) {
      term.tags.clear();
      world.methods.one.setTag([term], ['Verb', tenses[hit.tense], persons$1[hit.person]], world, false, reason);
    };
    doc.docs.forEach((terms) => {
      if (terms.some(isFinite$2)) {
        return
      }
      let person = null;
      for (let i = 0; i < terms.length; i += 1) {
        const term = terms[i];
        const prev = terms[i - 1];
        const next = terms[i + 1];
        const found = lookup(term);
        if (!found) {
          continue
        }
        // one more verb, for the same subject - 'lavoro di giorno e [studio] di notte'
        if (person !== null) {
          const hit = found.hits.find((o) => o.person === person);
          if (hit && prev && joins.has(prev.normal)) {
            tag(term, hit, 'homograph-verb-and');
          }
          continue
        }
        let hit = null;
        if (!prev) {
          // 'Porto il libro.', 'Gioco a calcio.'
          // .. but 'Lavoro di squadra' is a noun-phrase, unlike 'Lavoro di notte'
          const after = terms[i + 2];
          const isOf = next && next.normal === 'di' && !(after && diWords.has(after.normal));
          hit = isObject(next) && !isOf ? found.hits[0] : null;
        } else if (subjects$2.has(prev.normal) || before.has(prev.normal)) {
          // 'lei vive a Roma', 'non vive più qui', 'dove vivi?'
          hit = found.hits[0];
        } else if (isNoun(prev) && isObject(next)) {
          // 'mia madre cucina la cena', 'il gatto sale sull'albero'
          hit = found.hits.find((o) => o.person === 'third' || o.person === 'thirdPlural');
        }
        if (hit) {
          tag(term, hit, 'homograph-verb');
          person = hit.person;
        }
      }
    });
  };

  // lo / la / le / gli / l' are articles, and are also object-pronouns
  // - 'le leggi' is 'the laws', and 'you read them'
  // so when the next word has a verb-form, and may also be a noun, choose between them:
  //  1. can it follow this article at all? - 'gli parli', 'lo porta', 'le porto', 'la studio' can not
  //  2. is it a noun that we know, of the gender that the article wants? - 'le stazioni', but not 'le vedi'
  //  3. what is around it? - 'tu le leggi' and 'le leggi il giornale', but 'con le leggi' and 'le leggi sono chiare'
  //     - and when nothing says otherwise, a known noun after its article is the noun.
  //  4. if we do not know it as a noun, 'la mangia' stays as matches.js left it - but 'la vede', 'la mangiò',
  //     'lei la mangia' and 'la sente cantare' are verbs.

  const m = 'm';
  const f = 'f';
  // [gender, isPlural]
  const articles$1 = { lo: [m, false], la: [f, false], le: [f, true], gli: [m, true] };
  // "l'acquisto" - an elision gives no gender
  const elided$1 = [null, false];

  // nouns that the lexicon gives to a verb - 'sbaglio', and its plural 'sbagli'
  // only words that can follow lo/gli/l' are here - 'il conto' and 'i conti' are never a pronoun
  const maleNouns =
    'abbaglio abbaio abbandono abbozzo abbraccio abbuono abisso abito abuso accenno accento acciacco acconto ' +
    'accumulo acquisto addebito addobbo affanno affetto affido affitto affresco affronto aggancio aggettivo ' +
    'agguato agio aiuto alito allaccio allarme alloggio almanacco alterco ambiente ammasso anello animo annuncio ' +
    'annunzio anticipo apostrofo appalto appello appiglio appoggio apporto approccio approdo appunto arbitro ' +
    'architetto archivio arco arredo arresto arrivo arrosto articolo ascolto asfalto aspetto assaggio assalto ' +
    'assassino assedio assegno assetto assillo attacco attracco attrezzo augurio aumento avallo avanzo avvento ' +
    'avvio avviso azzardo elenco elogio encomio entusiasmo equipaggio equivoco esercito esilio esito espatrio ' +
    'esproprio imballo imbarazzo imbarco imbocco imbroglio impaccio impacco impasto impatto impegno impero ' +
    'impianto impiccio impiego impulso incaglio incanto incasso incastro incendio inchino inciampo incontro ' +
    'incrocio incubo indice indirizzo individuo indugio ingaggio inganno ingegno ingombro ingorgo ingresso ' +
    'ingrosso innesco innesto insulto intaglio intarsio intento interesse intonaco intralcio intreccio intrigo ' +
    'inventario invio invito involto obbligo oblio odio odore olezzo oltraggio omaggio ordine orgoglio orlo ' +
    'ormeggio ossequio ostacolo ozio sbadiglio sbaglio sballo sbalzo sbando sbarco sblocco sbocco sbuffo scalo ' +
    'scambio scampo scandaglio scarabocchio scarto scasso scatto scavo schiaffo schiamazzo schianto schifo ' +
    'schiocco schizzo sciopero scippo scivolo scolo scompiglio sconcerto scongiuro scontrino scontro scoppio ' +
    'scorcio scotto scrocco scrollo scroscio sdegno sfascio sfoggio sfogo sfondo sfratto sfregio sgambetto sgarro ' +
    'sgelo sgombero sgomento sguardo slancio smalto smercio snodo spaccio spacco sparo spasimo spasso spavento ' +
    'spiazzo spicchio spicco spiffero spigolo spillo spirito sportello sposo spreco spruzzo spunto squarcio ' +
    'squillo stacco stagno stallo stampo starnuto stento sterzo stile stimolo stipendio stormo storno straccio ' +
    'stralcio strappo strascico strazio strepito strillo striscio stucco svago svincolo svolazzo urlo urto uso ' +
    'utilizzo zampillo zelo zimbello zoccolo zufolo';
  // .. and the feminine ones - also the '-e' nouns that the lexicon has no gender for
  const femaleNouns =
    'arma base botte decade dote eclissi effigie esca faccia frangia frode legge lode noce ode pace parete reggia ' +
    'rete riserva rivale sala sdraio sede serva stringa suola torcia trave valle vernice veste voglia';
  // feminine '-a' plurals of masculine nouns, that are also a verb - 'le mura', 'le urla'
  const pluralA = new Set(['mura', 'urla', 'risa', 'strida', 'fila', 'membra']);

  // endings that make a noun - 'le condizioni', 'gli argomenti'
  const femaleSuffix = /(ione|gine|udine|trice)$/;
  const maleSuffix = /(mento|tore|sore)$/;

  // 'lo' and 'gli' are only articles before these - 'lo sbaglio', 'gli zii', 'lo gnomo'
  const impure = /^(s[^aeiouàèéìòù]|[zxyjwh]|gn|ps|pn|i[aeiou])/;
  const vowel = /^[aeiouàèéìòù]/;

  const subjects$1 = { io: 'FirstPerson', tu: 'SecondPerson', lui: 'ThirdPerson', lei: 'ThirdPerson', egli: 'ThirdPerson', ella: 'ThirdPerson', noi: 'FirstPersonPlural', voi: 'SecondPersonPlural', loro: 'ThirdPersonPlural' };
  const persons = ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural'];
  // 'me lo dai', 'non le leggi'
  const beforeVerb = new Set(['non', 'me', 'te', 'ce', 've']);
  // 'tutte le leggi'
  const beforeNoun = new Set(['tutto', 'tutta', 'tutti', 'tutte', 'entrambi', 'entrambe', 'ambedue']);
  // 'le luci della città'
  const ofWords = new Set(['di', 'del', 'dello', 'della', 'dei', 'degli', 'delle']);
  // 'gli sbagli [si] pagano', 'le leggi [non] servono', 'la porta [la] chiudo io'
  const skip = new Set(['non', 'si', 'ci', 'mi', 'ti', 'vi', 'ne', 'lo', 'la', 'li', 'le', 'gli']);
  const lookupTenses = { present: 'PresentTense', imperfect: 'ImperfectVerb', future: 'FutureTense' };
  const lookupPersons = { first: 'FirstPerson', second: 'SecondPerson', third: 'ThirdPerson', firstPlural: 'FirstPersonPlural', secondPlural: 'SecondPersonPlural', thirdPlural: 'ThirdPersonPlural' };

  const has = (obj, k) => Object.prototype.hasOwnProperty.call(obj, k);
  // the word of a term - the parts of "l'acquisto" keep theirs in .implicit
  const getStr = (term) => (term.implicit !== undefined ? term.implicit : term.normal);
  const isTitleCase = (str) => str.charAt(0) !== str.charAt(0).toLowerCase();
  const hasPunct = (term) => /[,;:.!?]/.test(term.post || '');
  const isAdverb = (term) => term.tags.has('Adverb') || term.tags.has('Negative') || term.tags.has('Date');
  const isFinite$1 = (term) => term.tags.has('Verb') && !term.tags.has('Infinitive') && !term.tags.has('Gerund');

  const getArticle = function (term) {
    if (term.implicit !== undefined) {
      return term.implicit === 'lo' && /^l['’]/.test(term.normal) ? elided$1 : null
    }
    return has(articles$1, term.normal) ? articles$1[term.normal] : null
  };

  // both forms of our nouns, with their gender
  let nounForms = null;
  const getForms = function (toPlural) {
    if (nounForms === null) {
      nounForms = { singular: {}, plural: {} };
      const add = (str, gender) => {
        str.split(' ').forEach((w) => {
          nounForms.singular[w] = gender;
          nounForms.plural[toPlural(w, gender)] = gender;
        });
      };
      add(maleNouns, m);
      add(femaleNouns, f);
    }
    return nounForms
  };

  // could this word follow this article? - by its first sound, and by its ending
  const canFollow = function (art, str, noun) {
    const [gender, isPlural] = art;
    if (art === elided$1) {
      return !str.endsWith('i') || isInvariable(str)
    }
    // 'gli parli', 'lo vedo'
    if (gender === m && !impure.test(str) && !vowel.test(str)) {
      return false
    }
    if (isInvariable(str)) {
      return true
    }
    if (isPlural) {
      // 'gli uffici', 'le case', 'le luci' - and 'le paia', 'le mura'
      const ending = gender === m ? /i$/ : /[ei]$/;
      return ending.test(str) || (gender === f && (pluralA.has(str) || noun.fromPlural(str, f) !== str))
    }
    // 'lo sbaglio', 'lo studente', 'lo schema', 'la faccia', 'la parete'
    return gender === m ? !str.endsWith('i') : /[ae]$/.test(str)
  };

  const tagsOf = (str, lexicon) => (has(lexicon, str) ? [].concat(lexicon[str]) : []);
  const isNounTag = /^(Noun|Singular|MaleNoun|FemaleNoun)$/;
  const isAdjTag = /Adjective$/;
  const isVerbTag = /^(FirstPerson|SecondPerson|ThirdPerson|FirstPersonPlural|SecondPersonPlural|ThirdPersonPlural|Subjunctive|Imperative)$/;

  // is this a noun that we know, in the gender of the article? returns its gender, or '?'
  const findNoun = function (art, str, world) {
    const [gender, isPlural] = art;
    const noun = world.methods.two.transform.noun;
    const lexicon = world.model.one.lexicon;
    const agrees = (g) => (gender === null || g === gender ? g : null);
    // 1. our own list
    const forms = getForms(noun.toPlural)[isPlural ? 'plural' : 'singular'];
    if (has(forms, str)) {
      return agrees(forms[str])
    }
    if (isPlural && pluralA.has(str)) {
      return agrees(f)
    }
    // 2. an ending
    const singular = isPlural ? noun.fromPlural(str, gender) : str;
    if (femaleSuffix.test(singular)) {
      return agrees(f)
    }
    if (maleSuffix.test(singular)) {
      return agrees(m)
    }
    // 3. the lexicon
    const tags = tagsOf(singular, lexicon);
    if (!tags.some((tag) => isNounTag.test(tag))) {
      return null
    }
    // 'le paia' is the plural of 'il paio'
    if (isPlural && gender === f && str.endsWith('a')) {
      return f
    }
    if (tags.includes('FemaleNoun') || tags.includes('MaleNoun')) {
      return agrees(tags.includes('FemaleNoun') ? f : m)
    }
    if (singular.endsWith('o')) {
      return agrees(m)
    }
    if (singular.endsWith('a')) {
      return agrees(noun.isMaleA(singular) ? m : f)
    }
    // an '-e' noun is either - 'le reti', but 'le conti' and 'le ordini' are verbs
    return gender === f ? null : '?'
  };

  // 'le stesse', 'la forte' - an adjective that we know, standing-in for its noun
  const isAdjective = function (art, str, world) {
    const singular = art[1] ? world.methods.two.transform.noun.fromPlural(str, art[0]) : str;
    return tagsOf(singular, world.model.one.lexicon).some((tag) => isAdjTag.test(tag))
  };

  // the verb that this word may be - as a list of tags
  const findVerb = function (term, str, world) {
    const lexicon = world.model.one.lexicon;
    if (term.tags.has('Verb')) {
      return Array.from(term.tags)
    }
    const tags = tagsOf(str, lexicon);
    if (tags.some((tag) => isVerbTag.test(tag))) {
      return ['Verb'].concat(tags)
    }
    // 'telefono', 'porta', 'studio' - nouns in the lexicon
    if (str.length < 3 || !(term.tags.has('Noun') || term.tags.has('Adjective')) || term.tags.has('Pronoun')) {
      return null
    }
    const isVerb = (inf) => tagsOf(inf, lexicon).includes('Infinitive');
    const found = world.methods.two.transform.verb.lookup(str, { isVerb, known: true, tenses: Object.keys(lookupTenses) });
    if (!found) {
      return null
    }
    // one tense, and each person that it may be
    const tense = found.hits[0].tense;
    const hits = found.hits.filter((o) => o.tense === tense);
    return ['Verb', lookupTenses[tense]].concat(hits.map((o) => lookupPersons[o.person]))
  };

  // 'tu le leggi', 'non lo sbaglio' - words that an object-pronoun follows
  const verbBefore = function (prev, verb) {
    if (!prev || hasPunct(prev)) {
      return false
    }
    const str = getStr(prev);
    if (beforeVerb.has(str)) {
      return true
    }
    if (!has(subjects$1, str)) {
      return false
    }
    // 'io le leggi' is not a verb - but a subjunctive is every person
    const found = persons.filter((tag) => verb.includes(tag));
    return found.length === 0 || verb.includes('Subjunctive') || found.includes(subjects$1[str])
  };

  // 'con le leggi', 'tutti gli uffici', 'vedo le luci' - words that a noun-phrase follows
  const nounBefore = function (prev) {
    if (!prev || hasPunct(prev)) {
      return false
    }
    return prev.tags.has('Preposition') || prev.tags.has('Verb') || beforeNoun.has(getStr(prev))
  };

  // 'gli sbagli si pagano', 'le stazioni oggi sono chiuse' - is the verb of the sentence further along?
  const verbAfter = function (terms, i) {
    let n = i + 1;
    while (n < terms.length && (isAdverb(terms[n]) || skip.has(getStr(terms[n])))) {
      n += 1;
    }
    return n < terms.length && isFinite$1(terms[n])
  };

  // what do the words after it say?
  const lookAfter = function (terms, i) {
    if (hasPunct(terms[i])) {
      return 'Noun'
    }
    const next = terms[i + 1];
    if (!next) {
      return 'Noun'
    }
    const str = getStr(next);
    // 'le leggi tu?'
    if (has(subjects$1, str)) {
      return 'Verb'
    }
    // 'le luci della città'
    if (ofWords.has(str)) {
      return 'Noun'
    }
    // 'le leggi il giornale', 'le offri due caffè', 'lo senti cantare'
    if (next.tags.has('Determiner') || next.tags.has('Value') || next.tags.has('Possessive') || next.tags.has('Infinitive') || next.tags.has('Gerund')) {
      return 'Verb'
    }
    // 'lo sbaglio sempre' - but 'le stazioni oggi sono chiuse'
    return isAdverb(next) && !verbAfter(terms, i) ? 'Verb' : 'Noun'
  };

  const tagArticles = function (doc) {
    const world = doc.world;
    const setTag = world.methods.one.setTag;
    const lexicon = world.model.one.lexicon;
    const noun = world.methods.two.transform.noun;

    const toNoun = function (terms, i, art, gender) {
      const term = terms[i + 1];
      terms[i].tags.clear();
      setTag([terms[i]], 'Determiner', world, false, 'article-noun');
      term.tags.clear();
      const tags = ['Noun', art[1] ? 'PluralNoun' : 'Singular'];
      const g = art[0] || gender;
      if (g === m || g === f) {
        tags.push(g === m ? 'MaleNoun' : 'FemaleNoun');
      }
      setTag([term], tags, world, false, 'article-noun');
      nounGender(terms, i + 1, world);
    };
    const toVerb = function (terms, i, verb) {
      terms[i].tags.clear();
      setTag([terms[i]], 'Pronoun', world, false, 'clitic-verb');
      terms[i + 1].tags.clear();
      setTag([terms[i + 1]], verb, world, false, 'clitic-verb');
    };

    doc.docs.forEach((terms) => {
      for (let i = 0; i < terms.length - 1; i += 1) {
        const art = getArticle(terms[i]);
        const term = terms[i + 1];
        const isVerb = term.tags.has('Verb');
        const isNoun = term.tags.has('Noun') && !isVerb;
        // 'gli Usa', 'la Stampa' are names
        if (!art || !(isVerb || isNoun) || term.tags.has('Pronoun') || isTitleCase(term.text)) {
          continue
        }
        const str = getStr(term);
        const verb = findVerb(term, str, world);
        if (!verb) {
          continue
        }
        const prev = terms[i - 1];
        const gender = findNoun(art, str, world);
        // 'mangiano le mele', 'con le leggi' - no pronoun goes here
        const isPhrase = nounBefore(prev);
        const isForm = tagsOf(str, lexicon).some((tag) => isVerbTag.test(tag));
        // 'la ama' would be "l'ama" - but our own .expand() writes 'lo amico'
        const notElided = art !== elided$1 && !art[1] && vowel.test(str) && isForm;
        // 'gli parla', 'le porto', 'la studio' - no noun fits here
        if (notElided || !canFollow(art, str, noun)) {
          if (isNoun && !isPhrase) {
            toVerb(terms, i, verb);
          }
          continue
        }
        if (gender) {
          // a noun that we know, after its article
          if (verbBefore(prev, verb)) {
            // 'lei la porta', but 'lei la porta la chiude'
            if (isNoun && !verbAfter(terms, i + 1)) {
              toVerb(terms, i, verb);
            }
          } else if (isVerb && (isPhrase || lookAfter(terms, i + 1) === 'Noun')) {
            toNoun(terms, i, art, gender);
          }
          continue
        }
        // a verb-form that we do not know as a noun - 'la vede', 'le piace', 'la mangiò'
        if (isNoun && isForm && !isPhrase && !isAdjective(art, str, world)) {
          // only the '-are' verbs make a noun of themselves - 'la firma', 'la visita'
          const isThird = verb.includes('ThirdPerson') && ((verb.includes('PresentTense') && str.endsWith('e')) || /[òìé]$/.test(str));
          const next = terms[i + 2];
          if (isThird || (!verbAfter(terms, i + 1) && (verbBefore(prev, verb) || (next && next.tags.has('Infinitive'))))) {
            toVerb(terms, i, verb);
          }
        }
      }
    });
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

  // 'non lo so', 'non ne ho'
  const objectPronouns = '(lo|la|le|li|gli|ne|mi|ti|si|ci|vi|me|te|ce|ve)';
  // verb-forms that are rarely a noun, after 'lo/la/le/gli'
  const finiteVerb =
    '(#FirstPerson|#SecondPerson|#FirstPersonPlural|#SecondPersonPlural|#ThirdPersonPlural|#ImperfectVerb|#FutureTense|#ConditionalVerb)';

  // the noun of "l'amica" has no text of its own
  const notElided = (m) => m.docs[0][0].text !== '';

  const postTagger$1 = function (doc) {
    // a word after an article is a noun - 'la pizza', 'il potere'
    doc.match(`${articles} [#Verb]`, 0).ifNo(coreVerbs).tag('Noun', 'art-noun');
    doc.match(`${prepArticles} [#Verb]`, 0).ifNo(coreVerbs).tag('Noun', 'prep-art-noun');
    doc.match(`${otherDets} [#Verb]`, 0).ifNo(coreVerbs).tag('Noun', 'det-noun');
    // ..but 'lo vedo', 'la mangiavo' - only a third-person form looks like a noun ('la porta', 'la legge')
    doc.match(`${articleClitics} [#Verb]`, 0).ifNo(coreVerbs).ifNo(finiteVerb).tag('Noun', 'art-clitic-noun');
    // ..unless an object follows - 'le offro un caffè', 'lo vede la sera'
    doc.match(`${articleClitics} [#Noun] (un|uno|una|il|lo|la|i|gli|le|mi|ti|ci|vi)`, 0).tag('PresentTense', 'clitic-verb');
    // 'lo vedo' - the clitic before a verb is a pronoun
    doc.match(`[${articleClitics}] #Verb`, 0).tag('Pronoun', 'clitic-pron');
    // ..and choose again, by the noun, its agreement with the article, and the words around it - 'le stazioni', 'gli parla'
    tagArticles(doc);
    // words that are something else, without an article - "l'ora", 'la specie', 'i guai', 'gli dei'
    doc.match(`(l|lo|la|un|una|che|ogni|qualche|questa|quella|stessa|mezzo|mezza|${prepArticles}) [ora]`, 0).tag(['Noun', 'FemaleNoun', 'Singular'], 'art-ora');
    doc.match(`(#Determiner|${prepArticles}) [specie]`, 0).tag(['Noun', 'FemaleNoun'], 'art-specie');
    doc.match('(#Determiner|#Preposition|#Possessive|#Adjective|#Value) [guai]', 0).tag(['Noun', 'MaleNoun', 'PluralNoun'], 'art-guai');
    doc.match('(gli|degli|agli|dagli|negli|sugli|quegli) [dei]', 0).tag(['Noun', 'MaleNoun', 'PluralNoun'], 'gli-dei');
    // 'i medici', 'un italiano' - an adjective after a determiner, with no noun after it, is the noun
    tagNounAdjectives(doc);
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

    // noun gender aggrement - but the l' of "l'amica" says nothing
    doc.match('(il|lo|i|gli) [#Noun]', 0).filter(notElided).tag('MaleNoun', 'm-noun');
    doc.match('(la|le|una) [#Noun]', 0).tag('FemaleNoun', 'f-noun');

    // 'vi arrabbiate' - a word right after a reflexive clitic is its verb
    doc.match('(mi|ti|si|ci|vi) [#Adjective]', 0).tag('PresentTense', 'clitic-verb-guess');
    // 'voi finite il lavoro' - subject pronoun + misread adjective
    doc.match('(io|tu|noi|voi) [#Adjective]', 0).ifNo('(stesso|stessa|stessi|stesse|due|tre)').tag('PresentTense', 'pron-verb-guess');
    // Come ti chiami? - the clitic pronoun gets the Reflexive tag
    doc.match('[(mi|ti|si|ci|vi)] #Verb', 0).tag('Reflexive', 'si-verb');
    // non lavoro
    doc.match('non [#Noun]', 0).ifNo(objectPronouns).tag('Verb', 'non-verb');
    // non lo so - but not the object-pronoun before it
    doc.match(`non [${objectPronouns}] #Verb`, 0).tag('Pronoun', 'non-clitic-verb');
    // i ginocchi
    doc.match('(i|gli|le) [#Noun]', 0).tag('PluralNoun', 'i-plural');
    // lo studente, una lezione
    doc.match('(il|lo|la|l|un|uno|una|ogni|qualche) [#Noun]', 0).ifNo('#Pronoun').tag('Singular', 'il-singular');
    // an '-e' plural is feminine - 'due mele'
    doc.match('#PluralNoun').filter((m) => /[^i]e$/.test(m.docs[0][0].normal)).tag('FemaleNoun', 'e-plural');
    // 27° - '27th'
    doc.match('[#Value] °', 0).tag('Ordinal', 'number-ordinal');

    // 'uno' and 'sei' are also number-words
    // standalone - 'uno'
    doc.match('^[(uno|sei)]$', 0).tag(['TextValue', 'Cardinal'], 'lone-number');
    // 'alle sei', 'le sei di sera', 'da sei anni' - six, after a preposition or an article
    doc.match('(#Preposition|le|ore) [sei]', 0).tag(['TextValue', 'Cardinal'], 'prep-sei');
    // 'Dai una mano' - 'dai' is a preposition with its article, so no article can follow it
    doc.match('[dai] (un|una|uno|il|lo|la|le|gli|i|tutto|sempre|molto|troppo|retta|fastidio)', 0).tag(['Verb', 'PresentTense', 'SecondPerson'], 'dai-verb');
    doc.match('(tu|non|mi|ti|ci|gli|lo|la|li|ne|me|te|ce) [dai]', 0).tag(['Verb', 'PresentTense', 'SecondPerson'], 'tu-dai');
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

    // 'ho sempre mangiato', 'è già partita' - a participle, further along
    tagCompounds(doc);

    // 'fallo subito!' - do it, not 'the foul'
    doc.match('^[fallo] (#Adverb|tu|voi|pure)', 0).tag('Imperative', 'fallo-imperative');

    // 'fermati!', 'dagli il libro', 'Mangia la pasta!'
    tagImperatives(doc);

    // 'mia madre [cucina] la cena', '[Porto] il libro'
    homographVerbs(doc);

    // Che bello!
    doc.match('^che #Adjective$').tag('Expression', 'che-bello');
  };

  // the whole tagging process, for re-tagging text after a change
  const tagger = view => view.compute(['freeze', 'lexicon', 'preTagger', 'europeanNumbers', 'postTagger', 'unfreeze']);

  var postTagger = {
    compute: {
      postTagger: postTagger$1,
      tagger
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
    const toVerbs = m.match('(#PresentTense|#PastTense) #Infinitive');
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
    const res = {
      pre: vb.none(),
      post: vb.none(),
    };
    if (!vb.has('#Adverb')) {
      return res
    }
    // pivot on the main verb
    const parts = vb.splitOn(root);
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
    const parts = vb.splitBefore(root);
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
    const m = view.not('(#Auxiliary|#Adverb|#Negative)');
    return m.text('root')
  };

  const parseVerb = function (view) {
    const vb = view.clone();
    // vb.contractions().expand()
    const root = getRoot$2(vb);
    const res = {
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
    const parsed = parseVerb(vb);
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

  // re-conjugate a verb-phrase into another tense, in-place
  // 'io parlo' -> 'io parlavo' -> 'io parlerò'
  //
  // only the finite verb is changed - 'voglio andare' -> 'volevo andare'
  // and its grammatical person is kept - 'parliamo' -> 'parleremo'
  // italian drops its subject pronouns, so the person is read from the verb itself
  //
  // the past-tense is the imperfetto, which is always a one-word substitution.
  // (the passato prossimo needs avere/essere, and agreement with the subject)


  const personTags = {
    first: 'FirstPerson',
    second: 'SecondPerson',
    third: 'ThirdPerson',
    firstPlural: 'FirstPersonPlural',
    secondPlural: 'SecondPersonPlural',
    thirdPlural: 'ThirdPersonPlural',
  };

  const tenseTags = {
    present: 'PresentTense',
    imperfect: 'ImperfectVerb',
    future: 'FutureTense',
  };

  const subjects = {
    io: 'first',
    tu: 'second',
    lui: 'third',
    lei: 'third',
    egli: 'third',
    ella: 'third',
    esso: 'third',
    essa: 'third',
    noi: 'firstPlural',
    voi: 'secondPlural',
    loro: 'thirdPlural',
    essi: 'thirdPlural',
    esse: 'thirdPlural',
  };

  // object-pronouns sit between the subject and its verb - 'io non lo so'
  const clitics = new Set(['mi', 'ti', 'si', 'ci', 'vi', 'lo', 'la', 'li', 'le', 'gli', 'ne', 'me', 'te', 'se', 'ce', 've', 'glielo', 'gliela', 'glieli', 'gliele', 'gliene']);
  const reflexives = new Set(['mi', 'ti', 'si', 'ci', 'vi']);
  // other words allowed between a subject and its verb - 'io non parlavo mai'
  const fillers = new Set(['non', 'mai', 'già', 'anche', 'sempre', 'ancora', 'più', 'proprio', 'spesso', 'solo', 'appena', 'quasi', 'pure', 'ormai', 'davvero']);

  // verb-forms that are not an indicative tense
  const skipTags = ['Infinitive', 'Gerund', 'PastParticiple', 'Participle', 'PresentParticiple', 'Imperative', 'Subjunctive', 'ConditionalVerb'];

  // the second half of a contraction has no text of its own - the 'è' in "c'è"
  const isHidden = (term) => term.text === '' && typeof term.implicit === 'string';
  // .. and the first half holds the text for both - "c'è"
  const isHost = (term) => Boolean(term) && term.text !== '' && typeof term.implicit === 'string';

  const getWord = (term) => (isHidden(term) ? term.implicit : term.normal);

  // the infinitive of 'mangiato', and its agreements - 'mangiata', 'mangiati', 'mangiate'
  const fromParticiple = function (term, methods) {
    if (!term.tags.has('Verb') || !term.root) {
      return null
    }
    const str = getWord(term).replace(/[aie]$/, 'o');
    if (term.tags.has('PastParticiple') || methods.toPastParticiple(term.root) === str) {
      return term.root
    }
    // the tagger can miss these - 'hanno dormito'
    const root = methods.fromPastParticiple(str);
    if (root && root !== str && methods.toPastParticiple(root) === str) {
      return root
    }
    return null
  };

  const isInfinitive = function (str, lexicon) {
    const tags = lexicon.hasOwnProperty(str) ? lexicon[str] : null;
    return tags === 'Infinitive' || (Array.isArray(tags) && tags.includes('Infinitive'))
  };

  // which tense + person is this word?
  const parseTerm = function (term, methods, lexicon) {
    const str = getWord(term);
    // the clitic of a contraction - the "c'" in "c'è"
    if (!str || isHost(term)) {
      return null
    }
    if (!term.tags.has('Verb') || clitics.has(str) || skipTags.some((tag) => term.tags.has(tag))) {
      return null
    }
    const root = term.root;
    // find the word in its own conjugation table
    const hits = root && root !== str ? methods.findHits(str, root) : [];
    if (hits.length > 0) {
      return { root, hits }
    }
    // the tagger's guess at the tense was wrong - look for a verb that we know
    return methods.lookup(str, { isVerb: (inf) => isInfinitive(inf, lexicon), known: true })
  };

  const isFiller = (term) => clitics.has(term.implicit || term.normal) || fillers.has(term.normal);

  // look backwards for a subject - 'io non lo [so]'
  const getSubject = function (terms, i) {
    for (let k = i - 1; k >= 0; k -= 1) {
      const term = terms[k];
      if (subjects.hasOwnProperty(term.normal)) {
        return subjects[term.normal]
      }
      if (!isFiller(term)) {
        // 'i ragazzi [sono]'
        if (term.tags.has('Noun') && !term.tags.has('Pronoun')) {
          return term.tags.has('PluralNoun') ? 'thirdPlural' : 'third'
        }
        return null
      }
    }
    return null
  };

  // 'sono' is both first-person, and third-person plural
  const choosePerson = function (hits, terms, i, end) {
    const found = hits.map((o) => o.person).filter((p, k, arr) => arr.indexOf(p) === k);
    if (found.length === 1) {
      return found[0]
    }
    const subj = getSubject(terms, i);
    if (subj && found.includes(subj)) {
      return subj
    }
    // 'ci sono molti gatti' - there are
    const before = terms[i - 1];
    if (before && (before.implicit || before.normal) === 'ci' && found.includes('thirdPlural')) {
      return 'thirdPlural'
    }
    // look for a plural after it - 'sono amici', 'sono andati'
    if (found.includes('thirdPlural')) {
      let next = terms[i + 1];
      for (let k = i + 1; k < end && next && isFiller(next); k += 1) {
        next = terms[k + 1];
      }
      if (next && (next.tags.has('PluralNoun') || (/i$/.test(next.normal) && (next.tags.has('Adjective') || next.tags.has('Verb'))))) {
        return 'thirdPlural'
      }
    }
    return found[0]
  };

  // 'Parlo' -> 'Parlavo'
  const matchCase = function (str, orig) {
    orig = orig || '';
    if (orig.length > 1 && orig === orig.toUpperCase() && orig !== orig.toLowerCase()) {
      return str.toUpperCase()
    }
    if (orig && orig[0] !== orig[0].toLowerCase()) {
      return str[0].toUpperCase() + str.slice(1)
    }
    return str
  };

  // 'ho sempre [mangiato]' - find the participle of a compound tense
  const findParticiple = function (terms, index, methods) {
    for (let i = index + 1; i < terms.length; i += 1) {
      const term = terms[i];
      if (fromParticiple(term, methods)) {
        return i
      }
      if (!term.tags.has('Adverb') && !term.tags.has('Negative') && !fillers.has(term.normal)) {
        return null
      }
    }
    return null
  };

  const startsVowel = /^h?[aeiouàèéìòù]/;
  // the object-pronoun agrees with the participle - "l'ho vista" -> 'la vedo'
  const objects = { o: 'lo', a: 'la', i: 'li', e: 'le' };

  // put a new word into a contraction - "c'è" -> "c'era", or 'ci sarà'
  const setHidden = function (terms, i, str, participle) {
    const host = terms[i - 1];
    const term = terms[i];
    const [before] = host.text.split(/['’]/);
    // "l'ama", "t'amavo" and "c'era" stay elided
    // but "s'è alzato" is 'si alza', and "dov'è" is 'dove abita'
    const isClitic = /^[lmtsvn]$/i.test(before);
    const keep = isClitic ? !participle || /^l$/i.test(before) : /^[eè]/.test(str);
    if (keep && startsVowel.test(str)) {
      // still elided - "c'era"
      host.text = before + "'" + str;
      host.normal = host.text.toLowerCase();
      term.implicit = str;
      term.machine = str;
    } else {
      // write it out in full - 'ci sarà'
      let full = host.implicit;
      if (before.toLowerCase() === 'l' && participle) {
        full = objects[participle.normal.slice(-1)] || full;
      }
      host.text = matchCase(full, before);
      host.normal = full;
      host.post = ' ';
      delete host.implicit;
      delete host.machine;
      term.text = str;
      term.normal = str;
      delete term.implicit;
      delete term.machine;
    }
    host.dirty = true;
    term.dirty = true;
  };

  // words that lose their vowel before 'è'
  const elided = { ci: 'c', dove: 'dov', come: 'com', cosa: 'cos' };

  // 'ci è' is always written "c'è"
  const elide = function (terms, i) {
    const host = terms[i - 1];
    const term = terms[i];
    if (!host || !elided.hasOwnProperty(host.normal) || host.post !== ' ' || isHost(host)) {
      return
    }
    // "c'era", but only "dov'è" and "com'è"
    if (host.normal === 'ci' ? !/^[eè]/.test(term.normal) : term.normal !== 'è') {
      return
    }
    const full = host.normal;
    host.implicit = full;
    host.machine = full;
    host.text = host.text.slice(0, elided[full].length) + "'" + term.text.toLowerCase();
    host.normal = host.text.toLowerCase();
    host.post = '';
    term.implicit = term.normal;
    term.machine = term.normal;
    term.text = '';
    term.normal = '';
    host.dirty = true;
    term.dirty = true;
  };

  const oldTags = ['PresentTense', 'PastTense', 'ImperfectVerb', 'FutureTense', 'Auxiliary'].concat(Object.values(personTags));

  // change this verb-phrase, and return its new finite verb
  const convertOne = function (view, n, span, want) {
    const methods = view.methods.two.transform.verb;
    const [start, end] = span;
    // the whole sentence, as we look outside of the verb-phrase
    view.update([[n]]).compute('root');
    const terms = view.document[n];
    // the first conjugated verb in the phrase is the finite one
    let index = null;
    let parsed = null;
    for (let i = start; i < end; i += 1) {
      parsed = parseTerm(terms[i], methods, view.model.one.lexicon);
      if (parsed) {
        index = i;
        break
      }
    }
    if (!parsed) {
      return null
    }
    const term = terms[index];
    const tenses = parsed.hits.map((o) => o.tense);
    // the conditional is a mood, not a tense - 'parlerei'
    if (tenses.every((t) => t === 'conditional')) {
      return null
    }
    const person = choosePerson(parsed.hits, terms, index, end);
    let root = parsed.root;
    // is it a compound tense? - 'ho mangiato', 'sono andato', 'mi sono alzato'
    let participle = null;
    if (root === 'avere' || root === 'essere') {
      participle = findParticiple(terms, index, methods);
      if (participle !== null && root === 'essere') {
        const before = terms[index - 1];
        const isReflexive = Boolean(before) && reflexives.has(before.implicit || before.normal);
        // otherwise, it's a passive - 'è amato'
        if (!essereVerbs.has(fromParticiple(terms[participle], methods)) && !isReflexive) {
          participle = null;
        }
      }
    }
    if (participle !== null) {
      // 'ho mangiato' and 'avevo mangiato' are already in the past
      if (want === 'imperfect') {
        return null
      }
      // 'avrò mangiato' is already in the future
      if (want === 'future' && tenses.includes('future')) {
        return null
      }
      // collapse it to a simple tense - 'ho mangiato' -> 'mangio'
      root = fromParticiple(terms[participle], methods);
    } else if (tenses.includes(want) || (want === 'imperfect' && tenses.includes('past'))) {
      // already there
      return null
    }
    const str = methods.table(root, [want])[want][person];
    if (!str) {
      return null
    }
    const at = (i, len) => view.update([[n, i, i + (len || 1)]]);
    const tags = ['Verb', tenseTags[want], personTags[person]];
    if (isHidden(term)) {
      // "c'è" -> "c'era", "l'ho visto" -> 'lo vedo'
      setHidden(terms, index, str, participle === null ? null : terms[participle]);
      const { setTag, unTag } = view.methods.one;
      oldTags.forEach((tag) => unTag([term], tag, view.model.one.tagSet));
      setTag([term], tags, view.world, false, 'to-' + want);
    } else if (participle === index + 1) {
      // 'ho mangiato' -> 'mangio'
      at(index, 2).replaceWith(matchCase(str, term.text));
      participle = null;
    } else {
      at(index).replaceWith(matchCase(str, term.text));
    }
    // 'ho sempre mangiato' -> 'mangio sempre'
    if (participle !== null) {
      // keep any punctuation after it
      const post = view.document[n][participle].post;
      at(participle).remove();
      view.document[n][participle - 1].post = post;
    }
    const found = view.document[n][index];
    if (!isHidden(term)) {
      // the new word may not be in our lexicon
      at(index).tag(tags, 'to-' + want);
      elide(view.document[n], index);
    }
    return found
  };

  const convertTo = function (view, want) {
    // pointers go stale as we add + remove words, so hold onto the terms themselves
    const phrases = [];
    view.forEach((vb) => {
      const ptr = vb.fullPointer[0];
      if (ptr) {
        phrases.push({ n: ptr[0], terms: (vb.docs[0] || []).slice() });
      }
    });
    phrases.forEach((phrase) => {
      const terms = view.document[phrase.n];
      // some of them may be removed already - 'ho sempre [mangiato]'
      const found = phrase.terms.map((term) => terms.indexOf(term)).filter((i) => i !== -1);
      if (found.length === 0) {
        phrase.terms = [];
        return
      }
      const span = [Math.min(...found), Math.max(...found) + 1];
      const old = terms.slice(span[0], span[1]);
      const res = convertOne(view, phrase.n, span, want);
      if (res) {
        // whatever is left of the phrase, and the new verb
        const now = view.document[phrase.n];
        phrase.terms = old.filter((term) => now.includes(term)).concat([res]);
      }
    });
    // return what is left of each verb-phrase
    const ptrs = [];
    phrases.forEach((phrase) => {
      const terms = view.document[phrase.n];
      const found = phrase.terms.map((term) => terms.indexOf(term)).filter((i) => i !== -1);
      if (found.length > 0) {
        ptrs.push([phrase.n, Math.min(...found), Math.max(...found) + 1]);
      }
    });
    return view.update(ptrs)
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
        return getNth$4(this, n).map(parseVerb, [])
      }
      json(opts, n) {
        const m = getNth$4(this, n);
        const arr = m.map((vb) => {
          const json = vb.toView().json(opts)[0] || {};
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
      /** 'parlavo' -> 'parlo' */
      toPresentTense(n) {
        return convertTo(getNth$4(this, n), 'present')
      }
      /** 'parlo' -> 'parlavo' (imperfetto) */
      toPastTense(n) {
        return convertTo(getNth$4(this, n), 'imperfect')
      }
      /** 'parlo' -> 'parlerò' */
      toFutureTense(n) {
        return convertTo(getNth$4(this, n), 'future')
      }
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
          const parsed = parseVerb(vb);
          const root = parsed.root || '';
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
        const m = new Verbs(this.document, pointer);
        m._cache = this._cache; // share this full thing
        return m
      }
    }
    View.prototype.verbs = function (n) {
      let vb = findVerbs(this);
      vb = getNth$4(vb, n);
      return new Verbs(this.document, vb.pointer)
    };
  };

  var verbs = {
    api: api$4,
  };

  const isValue = term => term.tags.has('Value');

  // 'meno cinque' is -5
  // .. but not 'più o meno cinque' (about five), or 'le sei meno cinque' (five to six)
  const withMinus = function (m) {
    const ptrs = m.fullPointer.map(ptr => {
      const [n, start, end] = ptr;
      const terms = m.document[n];
      const sign = terms[start - 1];
      const before = terms[start - 2];
      if (!sign || sign.normal !== 'meno' || /\S/.test(sign.post)) {
        return ptr
      }
      if (before && (before.normal === 'o' || isValue(before))) {
        return ptr
      }
      return [n, start - 1, end]
    });
    return m.update(ptrs)
  };

  const findNumbers = function (view) {
    let m = view.match('#Value+');
    //5-8
    m = m.splitAfter('#NumberRange');
    // june 5th 1999
    m = m.splitBefore('#Year');
    return withMinus(m)
  };

  const data = {
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
  let ends = ['cento', 'mille', 'milione', 'milioni', 'miliardi', 'tré', 'mila', 'seiesimo', 'dodicesimo', 'decimo'];

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
      const [num, card, ord, ord2] = a;
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

  const multiples$1 = {
    mila: 1000,
    // plurals - 'due milioni'
    milioni: 1000000,
    miliardi: 1000000000,
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
    const tokens = [];
    let going = true;
    while (going) {
      const found = ends.find(end => str.endsWith(end));
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
    const str = terms.reduce((h, t) => {
      h += t.normal || '';
      return h
    }, '');
    const tokens = tokenize(str);
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
        const mult = multiples$1[w] || 1;
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

  // floating-point noise - 0.1 + 0.2 - but a whole number is already exact
  const tidy = num => (Number.isInteger(num) ? num : Number(num.toPrecision(15)));

  const isNumeric = term => /[0-9]/.test(term.text);

  // read digits with the shared european-numbers plugin - '1.234,56', '-5', '3,5%'
  const fromNumber = function (terms, m) {
    const { read } = m.methods.two.europeanNumbers;
    const locale = m.model.two.europeanNumbers;
    const pre = terms[0].pre;
    // thousands may be split-up by a space - '1 000'
    const res = read(terms.map(t => t.text).join(' '), pre, locale);
    if (res.num !== null || terms.length === 1) {
      return res
    }
    return read(terms[0].text, pre, locale)
  };

  const parseNumber = function (m) {
    let terms = m.docs[0];
    const isText = m.has('#TextValue');
    // a written-out sign - 'meno 5', 'meno cinque'
    const isMinus = terms.length > 1 && terms[0].normal === 'meno';
    if (isMinus) {
      terms = terms.slice(1);
    }
    // any digits come first - '2,5 milioni'
    const split = terms.findIndex(t => !isNumeric(t));
    const digits = split === -1 ? terms : terms.slice(0, split);
    const words = split === -1 ? [] : terms.slice(split);
    let res = { num: null, prefix: '', suffix: '', hasComma: false };
    if (digits.length > 0) {
      res = fromNumber(digits, m);
    }
    if (isText) {
      const num = fromText(words);
      // '2,5 milioni' is 2.5 * 1,000,000
      if (res.num !== null && num) {
        res.num = tidy(res.num * num);
      } else {
        res.num = num;
      }
    }
    if (isMinus && res.num) {
      res.num *= -1;
    }
    return {
      hasComma: res.hasComma,
      prefix: res.prefix,
      num: res.num,
      suffix: res.suffix,
      // how the digits were written
      decimal: res.decimal,
      group: res.group,
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
    const have = [];
    multiples.forEach(a => {
      if (num >= a[0]) {
        const howmany = Math.floor(working / a[0]);
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
    const words = [];
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
      words.push('meno ');
      num = Math.abs(num);
    }
    // handle multiples
    const found = getMagnitudes(num);
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
      const res = twoDigit(obj.num);
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
    const last = words[words.length - 1];
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

  const { write } = europeanNumbers.methods.two.europeanNumbers;

  const formatNumber = function (parsed, fmt) {
    if (fmt === 'TextOrdinal') {
      const words = toText(parsed.num);
      return toTextOrdinal(words)
    }
    if (fmt === 'TextCardinal') {
      return toText(parsed.num).join('')
    }
    // numeric format - 107 -> '107°'
    if (fmt === 'Ordinal') {
      return String(parsed.num) + '°'
    }
    // digits go back the way they were found - '1.234,5', '5,3€'
    // .. but a unit is its own (implicit) term - '9km'
    const suffix = /\p{L}/u.test(parsed.suffix || '') ? '' : parsed.suffix;
    return write(parsed.num, { ...parsed, suffix })
  };

  // return the nth elem of a doc
  const getNth$3 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  // accept a number, or an italian number as a string - 'otto' or '8'
  const toNum = function (view, n) {
    if (typeof n !== 'string') {
      return n
    }
    const m = view.fromText(n).numbers();
    // the whole string must be one number
    if (m.length !== 1 || m.text('normal') !== m.all().text('normal')) {
      return null
    }
    const num = parseNumber(m).num;
    return typeof num === 'number' && !isNaN(num) ? num : null
  };

  // the new text has its own sign, so remove one left in the punctuation - '-|3,5'
  const dropSign = function (val) {
    const term = val.docs[0][0];
    term.pre = term.pre.replace(/[-−]$/, '');
  };

  const api$3 = function (View) {
    /**   */
    class Numbers extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Numbers';
      }
      parse(n) {
        return getNth$3(this, n).map(parseNumber, [])
      }
      get(n) {
        return getNth$3(this, n).map(parseNumber, []).map(o => o.num)
      }
      json(opts, n) {
        // support .json(n) and .json(opts, n)
        if (typeof opts === 'number') {
          n = opts;
          opts = undefined;
        }
        const doc = getNth$3(this, n);
        return doc.map(p => {
          const json = p.toView().json(opts)[0] || {};
          const parsed = parseNumber(p);
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
        const m = this.if('#TextValue');
        const res = m.map(val => {
          const obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          const fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          const str = formatNumber(obj, fmt);
          if (str) {
            dropSign(val);
            val.replaceWith(str, { tags: true });
            val.tag('NumericValue');
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      /** convert to numeric form like 'eight' or 'eighth' */
      toText() {
        const m = this;
        const res = m.map(val => {
          if (val.has('#TextValue')) {
            return val
          }
          const obj = parseNumber(val);
          // there are no words for '3,5'
          if (obj.num === null || !Number.isInteger(obj.num)) {
            return val
          }
          const fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          const str = formatNumber(obj, fmt);
          if (str) {
            dropSign(val);
            val.replaceWith(str, { tags: true });
            val.tag('TextValue');
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      /** convert ordinal to cardinal form, like 'eight', or '8' */
      toCardinal() {
        const m = this;
        const res = m.map(val => {
          if (!val.has('#Ordinal')) {
            return val
          }
          const obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          const fmt = val.has('#TextValue') ? 'TextCardinal' : 'Cardinal';
          const str = formatNumber(obj, fmt);
          if (str) {
            dropSign(val);
            val.replaceWith(str, { tags: true });
            val.tag('Cardinal');
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      /** convert cardinal to ordinal form, like 'eighth', or '8th' */
      toOrdinal() {
        const m = this;
        const res = m.map(val => {
          if (val.has('#Ordinal')) {
            return val
          }
          const obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          const fmt = val.has('#TextValue') ? 'TextOrdinal' : 'Ordinal';
          const str = formatNumber(obj, fmt);
          if (str) {
            dropSign(val);
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
          const num = parseNumber(val).num;
          return num === n
        })
      }
      /** return only numbers that are > n*/
      greaterThan(n) {
        return this.filter((val) => {
          const num = parseNumber(val).num;
          return num > n
        })
      }
      /** return only numbers that are < n*/
      lessThan(n) {
        return this.filter((val) => {
          const num = parseNumber(val).num;
          return num < n
        })
      }
      /** return only numbers > min and < max */
      between(min, max) {
        return this.filter((val) => {
          const num = parseNumber(val).num;
          return num > min && num < max
        })
      }
      /** set these number to n */
      set(n) {
        if (n === undefined) {
          return this // don't bother
        }
        n = toNum(this, n);
        if (typeof n !== 'number') {
          return this // not a number
        }
        const m = this;
        const res = m.map((val) => {
          const obj = parseNumber(val);
          obj.num = n;
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          if (val.has('#TextValue')) {
            fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          }
          const str = formatNumber(obj, fmt);
          if (str) {
            dropSign(val);
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
        n = toNum(this, n);
        if (typeof n !== 'number' || n === 0) {
          return this // not a number
        }
        const m = this;
        const res = m.map((val) => {
          const obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          obj.num += n;
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          if (obj.isText) {
            fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          }
          const str = formatNumber(obj, fmt);
          if (str) {
            dropSign(val);
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
        n = toNum(this, n);
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
        const m = new Numbers(this.document, pointer);
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
    api: api$3,
    // the shared european-numbers plugin reads '1.234,56' - these are our ordinals: '2ª', '3°'
    model: {
      two: {
        europeanNumbers: {
          ordinal: '\\.?[ºª°]',
          // the words beside a number - '50 %', '5,30 €'
          percent: ['per cento', 'percento'],
          currencies: ['euro', 'dollaro', 'dollari', 'sterlina', 'sterline', 'franco', 'franchi', 'lira', 'lire'],
        },
      },
    },
  };

  const getNth$2 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  // get root form of adjective
  const getRoot$1 = function (m) {
    m.compute('root');
    const str = m.text('root');
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
          const str = getRoot$1(m);
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
    const str = m.text('root');
    // let isPlural = m.has('#PluralNoun')
    // if (isPlural) {
    //   return transform.adjective.fromPlural(str)
    // }
    return str
  };

  // the noun of an elision has no text of its own - "l'amica"
  const getText = function (m, fmt) {
    return m.text(fmt) || m.docs[0][0].implicit || ''
  };

  // ..it is written inside its article
  const replace = function (m, str) {
    const term = m.docs[0][0];
    if (term.text || !term.implicit) {
      return m.replaceWith(str)
    }
    const [n, i] = m.fullPointer[0];
    const host = m.document[n].slice(0, i).reverse().find((t) => t.text);
    if (host) {
      host.text = host.text.replace(/(['’]).*$/, '$1' + str);
      host.normal = host.normal.replace(/'.*$/, "'" + str);
      term.implicit = str;
      term.machine = str;
      delete term.root;
    }
    return m
  };

  // a hint for the inflector - 'la turista' vs 'il turista'
  const getGender = function (m) {
    if (m.has('#FemaleNoun')) {
      return 'f'
    }
    if (m.has('#MaleNoun')) {
      return 'm'
    }
    return undefined
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
          const str = getText(m);
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
        return getNth$1(this, n).if('#PluralNoun')
      }
      toPlural(n) {
        const methods = this.methods.two.transform.noun;
        return getNth$1(this, n).if('#Singular').map(m => {
          const str = getRoot(m);
          const plural = methods.toPlural(str, getGender(m));
          replace(m, plural);
          return m.tag('PluralNoun', 'toPlural')
        })
      }
      toSingular(n) {
        const methods = this.methods.two.transform.noun;
        return getNth$1(this, n).if('#PluralNoun').map(m => {
          // nb: the root of a plural noun is already singular - so use the word itself
          const str = getText(m, 'normal');
          const singular = methods.fromPlural(str, getGender(m));
          replace(m, singular);
          return m.tag('Singular', 'toSingular')
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

  const titleCase = /^\p{Lu}[\p{Ll}'’]/u; //uppercase, then lowercase

  const toTitleCase = function (str = '') {
    return str.replace(/^\p{Ll}/u, x => x.toUpperCase())
  };

  // the elided article in "dell'amico" is stored as a bare 'l'
  const fullForm = { l: 'lo' };

  const api = function (View) {
    /**   */
    class Contractions extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Contraction';
      }

      /** write the elided forms out in full - "c'è" -> 'ci è' */
      expand() {
        this.docs.forEach(terms => {
          const isTitleCase = titleCase.test(terms[0].text);
          terms.forEach((t, i) => {
            if (typeof t.implicit !== 'string') {
              return
            }
            t.text = Object.hasOwn(fullForm, t.implicit) ? fullForm[t.implicit] : t.implicit;
            delete t.implicit;
            // add whitespace
            if (i < terms.length - 1 && t.post === '') {
              t.post += ' ';
            }
            // flag it as dirty
            t.dirty = true;
          });
          // keep the first word title-cased
          if (isTitleCase) {
            terms[0].text = toTitleCase(terms[0].text);
          }
        });
        this.compute('normal'); //re-set normalized text
        return this
      }
      // overloaded - keep Contraction class
      update(pointer) {
        const m = new Contractions(this.document, pointer);
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

  // italian word-rules for .clauses() - the method itself comes from compromise/shared
  const clauses = {
    // a comma, but not a clause break
    notClause: [
      '@hasComma (e|ed|o|od) .', // grande, e forte
    ],
    // split a clause after these
    splitAfter: [
      '^#Pron (disse|dice)', // lui disse
      '^#Pron ha detto',
    ],
    // split a clause before these
    splitBefore: [
      '(disse|dice) #Prop$',
      '. . se .{4}', // ... se fosse così
      'e mentre',
      'ora che',
      'da quando',
      '(sebbene|benché)',
      'anche se',
      'mentre', // while, whereas
      'come se',
      'finché',
    ],
    // split a clause before the [captured] word
    splitBeforeGroup: [
      '#Verb .* [ma] .* #Verb', // è buono ma è ..
      'se .{2,9} [allora] .', // se è questo allora quello
    ],
  };

  var clauseRules = {
    model: { three: { clauses } },
  };

  nlp.plugin(tokenize$1);
  nlp.plugin(tagset);
  nlp.plugin(lexicon);
  nlp.plugin(preTagger);
  // tags '1.234,56' and '5,30€' from their raw text
  nlp.plugin(europeanNumbers);
  nlp.plugin(postTagger);
  nlp.plugin(verbs);
  nlp.plugin(numbers);
  nlp.plugin(adjectives);
  nlp.plugin(nouns);
  nlp.plugin(contractions);

  // language-neutral plugins, shared with compromise
  nlp.plugin(lazy$1); // nlp.lazy() - only tags the sentences that may match
  nlp.plugin(misc$2); // .parentheses(), .quotations(), .acronyms(), .emails() ...
  nlp.plugin(clauses$1); // .clauses() - split on punctuation, and our rules below
  nlp.plugin(clauseRules);
  nlp.plugin(topics); // .people(), .places(), .organizations(), .topics()
  nlp.plugin(plugin); // .redact()

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
    const env = typeof process === 'undefined' ? self.env || {} : process.env; //use window, in browser
    env.DEBUG_TAGS = set === 'tagger' || set === true ? true : '';
    env.DEBUG_MATCH = set === 'match' || set === true ? true : '';
    env.DEBUG_CHUNKS = set === 'chunker' || set === true ? true : '';
    return this
  };
  it.version = version;

  return it;

}));
