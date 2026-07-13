/* eslint-disable no-console */
// generate src/01-one/lexicon/methods/verbs/irregular.js from verbs.jsonl
//   node scripts/gen-irregular.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

const jsonl = fs.readFileSync(path.join(root, 'verbs.jsonl'), 'utf8')
  .split(/\n/).filter(s => s).map(s => JSON.parse(s))
const byWord = {}
jsonl.forEach(o => { byWord[o.word] = o })

// verbs with irregular present/future/etc - full paradigm tables
const PARADIGM_VERBS = [
  'essere', 'avere', 'stare', 'fare', 'dire', 'andare', 'venire', 'dare',
  'sapere', 'potere', 'volere', 'dovere', 'bere', 'uscire', 'rimanere',
  'scegliere', 'tenere', 'morire', 'salire', 'porre', 'tradurre', 'produrre',
  'piacere', 'togliere', 'cogliere', 'spegnere', 'vedere', 'vivere', 'valere',
  'cadere', 'sedere', 'tacere', 'trarre', 'condurre', 'ridurre', 'apparire', 'parere',
]

const clean = (s) => {
  if (!s) return null
  s = s.replace(/^che (io|tu|lei\/lui|lui|lei|noi|voi|loro) /, '')
  s = s.replace(/^(io|tu|lei\/lui|lui|lei|noi|voi|loro) /, '')
  s = s.split('/')[0].trim()
  return s
}
const six = (arr) => {
  if (!arr || arr.length !== 6) return null
  return arr.map(clean)
}

let paradigms = {}
let missing = []
for (let w of PARADIGM_VERBS) {
  let o = byWord[w]
  if (!o) { missing.push(w); continue }
  let p = {
    present: six(o['Indicativo Presente']),
    imperfect: six(o['Indicativo Imperfetto']),
    past: six(o['Indicativo Passato remoto']),
    future: six(o['Indicativo Futuro semplice']),
    conditional: six(o['Condizionale Presente']),
    subjunctive: six(o['Congiuntivo Presente']),
    imperfectSubjunctive: six(o['Congiuntivo Imperfetto']),
    pastParticiple: clean((o['Participio Passato'] || [])[0]),
    gerund: clean((o['Gerundio Presente'] || [])[0]),
  }
  // drop null slots
  Object.keys(p).forEach(k => { if (!p[k]) delete p[k] })
  paradigms[w] = p
}
console.error('missing from jsonl:', missing.join(', ') || '(none)')

// where wiktionary lists a rarer variant first, prefer the standard form
paradigms.dovere.past = ['dovetti', 'dovesti', 'dovette', 'dovemmo', 'doveste', 'dovettero']
paradigms.dovere.subjunctive = ['debba', 'debba', 'debba', 'dobbiamo', 'dobbiate', 'debbano']

// verbs with irregular past-participles / gerunds (all 1,998 verbs checked)
const regularPP = (inf) => inf.replace(/are$/, 'ato').replace(/ere$/, 'uto').replace(/ire$/, 'ito')
const regularGer = (inf) => inf.replace(/are$/, 'ando').replace(/(ere|ire)$/, 'endo')

let participles = {}
let gerunds = {}
for (let o of jsonl) {
  let pp = clean((o['Participio Passato'] || [])[0])
  if (pp && /(are|ere|ire|rre)$/.test(o.word) && pp !== regularPP(o.word)) {
    participles[o.word] = pp
  }
  let ger = clean((o['Gerundio Presente'] || [])[0])
  if (ger && /(are|ere|ire|rre)$/.test(o.word) && ger !== regularGer(o.word)) {
    gerunds[o.word] = ger
  }
}
console.error('irregular participles:', Object.keys(participles).length)
console.error('irregular gerunds:', Object.keys(gerunds).length)

const out = `// generated from ./verbs.jsonl by scripts/gen-irregular.js
// full tables for verbs with irregular stems,
// plus irregular past-participles + gerunds for otherwise-regular verbs
export default ${JSON.stringify({ paradigms, participles, gerunds }, null, 2)}
`
fs.writeFileSync(path.join(root, 'src/01-one/lexicon/methods/verbs/irregular.js'), out)
console.error('wrote irregular.js')
