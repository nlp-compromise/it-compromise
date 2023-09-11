import test from 'tape'
import nlp from '../_lib.js'
let here = '[pronoun-suffixes] '
nlp.verbose(false)

test('pronoun-root:', function (t) {
  let arr = [
    // pronoun suffixes
    // [`parlandone`, `{parlare}`],
    [`vederlo`, `{vedere}`],
    ['mangiarlo', '{mangiare}'],
    ['prenderla', '{prendere}'],
    ['sentirsi', '{sentire}'],
    ['lavarsi', '{lavare}'],
    ['guardarci', '{guardare}'],
    ['ascoltarla', '{ascoltare}'],
    ['toccarlo', '{toccare}'],
    ['comprarlo', '{comprare}'],
    ['usarla', '{usare}'],
    ['mettersi', '{mettere}'],
    ['dormirci', '{dormire}'],
    ['scriverele', '{scrivere}'],
    ['chiedergli', '{chiedere}'],
    ['diregli', '{dire}'],
    ['portarla', '{portare}'],
    ['leggerele', '{leggere}'],
    ['finirlo', '{finire}'],
    ['credereci', '{credere}'],
    ['vederci', '{vedere}'],
    ['farla', '{fare}'],
    ['amargli', '{amare}'],
    ['studiarselo', '{studiare}'],
    ['beverlo', '{bere}'],
    ['viverla', '{vivere}'],
    ['aprirlo', '{aprire}']

    // [``,`{}`],
    // [``,`{}`],
  ]
  arr.forEach(function (a) {
    let [str, match] = a
    let doc = nlp(str).compute('root')
    t.equal(doc.has(match), true, here + a.join(' '))
  })
  t.end()
})
