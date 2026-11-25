import test from 'tape'
import nlp from '../../_lib.js'
const here = '[imperative] '

test('toImperative:', function (t) {
  const verb = nlp.world().methods.two.transform.verb
  // [tu, Lei, noi, voi, Loro]
  const arr = [
    ['mangiare', ['mangia', 'mangi', 'mangiamo', 'mangiate', 'mangino']],
    ['parlare', ['parla', 'parli', 'parliamo', 'parlate', 'parlino']],
    ['prendere', ['prendi', 'prenda', 'prendiamo', 'prendete', 'prendano']],
    ['dormire', ['dormi', 'dorma', 'dormiamo', 'dormite', 'dormano']],
    ['finire', ['finisci', 'finisca', 'finiamo', 'finite', 'finiscano']],
    ['venire', ['vieni', 'venga', 'veniamo', 'venite', 'vengano']],
    ['sedere', ['siedi', 'sieda', 'sediamo', 'sedete', 'siedano']],
    // these have forms of their own
    ['essere', ['sii', 'sia', 'siamo', 'siate', 'siano']],
    ['avere', ['abbi', 'abbia', 'abbiamo', 'abbiate', 'abbiano']],
    ['sapere', ['sappi', 'sappia', 'sappiamo', 'sappiate', 'sappiano']],
    ['andare', ['vai', 'vada', 'andiamo', 'andate', 'vadano']],
    ['fare', ['fai', 'faccia', 'facciamo', 'fate', 'facciano']],
    ['dare', ['dai', 'dia', 'diamo', 'date', 'diano']],
    ['dire', ["di'", 'dica', 'diciamo', 'dite', 'dicano']],
  ]
  arr.forEach(function (a) {
    const [inf, want] = a
    const res = verb.toImperative(inf)
    const got = [res.second, res.third, res.firstPlural, res.secondPlural, res.thirdPlural]
    t.deepEqual(got, want, here + `toImperative ${inf}`)
  })
  t.end()
})

test('fromImperative:', function (t) {
  const verb = nlp.world().methods.two.transform.verb
  const arr = [
    ['mangia', 'mangiare'],
    ['mangiate', 'mangiare'],
    ['prendi', 'prendere'],
    ['finisci', 'finire'],
    ['andiamo', 'andare'],
    ['vieni', 'venire'],
    ['siedi', 'sedere'],
    ['sii', 'essere'],
    ['siate', 'essere'],
    ['abbi', 'avere'],
    ['sappi', 'sapere'],
    ["va'", 'andare'],
    ["fa'", 'fare'],
    ["di'", 'dire'],
    ['venga', 'venire'],
    ['parlino', 'parlare'],
  ]
  arr.forEach(function (a) {
    const [str, inf] = a
    t.equal(verb.fromImperative(str), inf, here + `fromImperative ${str}`)
  })
  // these are not imperatives
  ;['sono', 'ho', 'piove', 'mangiato'].forEach((str) => {
    t.equal(verb.fromImperative(str), null, here + `'${str}' is no imperative`)
  })
  t.end()
})

test('imperative tags:', function (t) {
  const arr = [
    // forms of their own
    ['Sii gentile', 'essere'],
    ['abbi pazienza', 'avere'],
    ['sappi che ti amo', 'sapere'],
    // reflexives, that are also participles
    ['Fermati!', 'fermare'],
    ['Alzati subito', 'alzare'],
    ['Svegliati!', 'svegliare'],
    ['siediti', 'sedere'],
    ['Siediti qui.', 'sedere'],
    // .. or prepositions
    ['dagli il libro', 'dare'],
    ['dalle un bacio', 'dare'],
    // a present-tense form, in an exclamation
    ['Mangia la pasta!', 'mangiare'],
    ['Andiamo!', 'andare'],
    ['Guarda!', 'guardare'],
    ['Vieni qui!', 'venire'],
    ['Prendi questo!', 'prendere'],
  ]
  arr.forEach(function (a) {
    const [str, root] = a
    const doc = nlp(str).compute('root')
    t.equal(doc.has('^#Imperative'), true, here + `'${str}' is imperative`)
    t.equal(doc.has(`^{${root}}`), true, here + `'${str}' root is ${root}`)
  })
  const not = [
    'Mangia la pasta.',
    'Sono felice!',
    'Ho fame!',
    'dagli amici',
    'dalle otto',
    'sono alzati',
    'Fermati i lavori, tornarono a casa',
    'i vestiti',
    'Che bello!',
  ]
  not.forEach(function (str) {
    t.equal(nlp(str).has('#Imperative'), false, here + `'${str}' has no imperative`)
  })
  t.end()
})

test('imperatives keep their tense:', function (t) {
  const arr = ['Mangia la pasta!', 'Fermati!', 'siediti', 'Sii gentile', 'dagli il libro', 'Andiamo!']
  ;['toPastTense', 'toPresentTense', 'toFutureTense'].forEach((fn) => {
    arr.forEach((str) => {
      const doc = nlp(str)
      doc.verbs()[fn]()
      t.equal(doc.text(), str, here + `${fn}: '${str}'`)
    })
  })
  t.end()
})
