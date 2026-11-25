import test from 'tape'
import nlp from '../../_lib.js'
const here = '[conjugate] '
nlp.verbose(false)

test('adj-conjugate:', function (t) {
  // let all = ["ricreativo", "ricreativa", "ricreativi", "ricreative"]
  let all = ["riferibile", "riferibile", "riferibili", "riferibili"]
  t.deepEqual(Object.values(nlp(all[0]).adjectives().conjugate()[0]), all, here + 'from-male')
  t.deepEqual(Object.values(nlp(all[1]).adjectives().conjugate()[0]), all, here + 'from-female')
  t.deepEqual(Object.values(nlp(all[2]).adjectives().conjugate()[0]), all, here + 'from-plural')
  t.deepEqual(Object.values(nlp(all[3]).adjectives().conjugate()[0]), all, here + 'from-female-plural')

  all = ['meraviglioso', 'meravigliosa', 'meravigliosi', 'meravigliose']
  t.deepEqual(Object.values(nlp(all[0]).adjectives().conjugate()[0]), all, here + 'from-male')
  t.deepEqual(Object.values(nlp(all[1]).adjectives().conjugate()[0]), all, here + 'from-female')
  t.deepEqual(Object.values(nlp(all[2]).adjectives().conjugate()[0]), all, here + 'from-plural')
  t.deepEqual(Object.values(nlp(all[3]).adjectives().conjugate()[0]), all, here + 'from-female-plural')
  t.end()
})

test('noun-conjugate:', function (t) {
  let all = ["insalata", "insalate"]
  let o = nlp(all[0]).nouns().conjugate()[0]
  t.deepEqual([o.singular, o.plural], all, here + 'from-sing')
  o = nlp(all[1]).nouns().conjugate()[0]
  t.deepEqual([o.singular, o.plural], all, here + 'from-plural')

  all = ["arachide", "arachidi"]
  o = nlp(all[0]).nouns().conjugate()[0]
  t.deepEqual([o.singular, o.plural], all, here + 'from-sing')

  all = ["salsiccia", "salsicce"]
  o = nlp(all[0]).nouns().conjugate()[0]
  t.deepEqual([o.singular, o.plural], all, here + 'from-sing')
  t.end()
})

test('verb-conjugate:', function (t) {
  const all = ["ascendo", "ascendi", "ascende", "ascendiamo", "ascendete", "ascendono"]
  t.deepEqual(Object.values(nlp(all[0]).verbs().conjugate()[0].PresentTense), all, here + 'from-first')
  t.deepEqual(Object.values(nlp(all[1]).verbs().conjugate()[0].PresentTense), all, here + 'from-2nd')
  t.deepEqual(Object.values(nlp(all[2]).verbs().conjugate()[0].PresentTense), all, here + 'from-3d')
  t.deepEqual(Object.values(nlp(all[3]).verbs().conjugate()[0].PresentTense), all, here + 'from-1p')
  t.deepEqual(Object.values(nlp(all[4]).verbs().conjugate()[0].PresentTense), all, here + 'from-2p')
  t.deepEqual(Object.values(nlp(all[5]).verbs().conjugate()[0].PresentTense), all, here + 'from-3p')
  t.end()
})

test('passato-remoto:', function (t) {
  const past = (inf) => Object.values(nlp(inf).verbs().conjugate()[0].PastTense)
  // regular -ere verbs, which our model used to send down an irregular path ('cresi')
  const arr = [
    ['credere', ['credetti', 'credesti', 'credette', 'credemmo', 'credeste', 'credettero']],
    ['vendere', ['vendetti', 'vendesti', 'vendette', 'vendemmo', 'vendeste', 'vendettero']],
    ['temere', ['temetti', 'temesti', 'temette', 'tememmo', 'temeste', 'temettero']],
    ['ricevere', ['ricevetti', 'ricevesti', 'ricevette', 'ricevemmo', 'riceveste', 'ricevettero']],
    ['cedere', ['cedetti', 'cedesti', 'cedette', 'cedemmo', 'cedeste', 'cedettero']],
    ['ripetere', ['ripetei', 'ripetesti', 'ripeté', 'ripetemmo', 'ripeteste', 'ripeterono']],
    ['battere', ['battei', 'battesti', 'batté', 'battemmo', 'batteste', 'batterono']],
    ['godere', ['godei', 'godesti', 'godé', 'godemmo', 'godeste', 'goderono']],
    ['esistere', ['esistei', 'esistesti', 'esisté', 'esistemmo', 'esisteste', 'esisterono']],
    ['potere', ['potei', 'potesti', 'poté', 'potemmo', 'poteste', 'poterono']],
    ['dovere', ['dovetti', 'dovesti', 'dovette', 'dovemmo', 'doveste', 'dovettero']],
    // irregular ones, that were missing
    ['perdere', ['persi', 'perdesti', 'perse', 'perdemmo', 'perdeste', 'persero']],
    ['tenere', ['tenni', 'tenesti', 'tenne', 'tenemmo', 'teneste', 'tennero']],
    ['aprire', ['aprii', 'apristi', 'aprì', 'aprimmo', 'apriste', 'aprirono']],
    // irregular ones, that must stay as they were
    ['prendere', ['presi', 'prendesti', 'prese', 'prendemmo', 'prendeste', 'presero']],
    ['chiudere', ['chiusi', 'chiudesti', 'chiuse', 'chiudemmo', 'chiudeste', 'chiusero']],
    ['scrivere', ['scrissi', 'scrivesti', 'scrisse', 'scrivemmo', 'scriveste', 'scrissero']],
    ['mettere', ['misi', 'mettesti', 'mise', 'mettemmo', 'metteste', 'misero']],
    ['leggere', ['lessi', 'leggesti', 'lesse', 'leggemmo', 'leggeste', 'lessero']],
    ['vedere', ['vidi', 'vedesti', 'vide', 'vedemmo', 'vedeste', 'videro']],
    ['essere', ['fui', 'fosti', 'fu', 'fummo', 'foste', 'furono']],
    ['avere', ['ebbi', 'avesti', 'ebbe', 'avemmo', 'aveste', 'ebbero']],
    // the other conjugations
    ['parlare', ['parlai', 'parlasti', 'parlò', 'parlammo', 'parlaste', 'parlarono']],
    ['dormire', ['dormii', 'dormisti', 'dormì', 'dormimmo', 'dormiste', 'dormirono']],
  ]
  arr.forEach(a => {
    t.deepEqual(past(a[0]), a[1], here + 'passato remoto - ' + a[0])
  })
  // .. and back to the infinitive
  t.equal(nlp('lui credette').compute('root').has('{credere}'), true, here + 'credette root')
  t.equal(nlp('loro vendettero').compute('root').has('{vendere}'), true, here + 'vendettero root')
  t.end()
})
