import test from 'tape'
import nlp from './_lib.js'
let here = '[root-match] '
nlp.verbose(false)

test('root-match:', function (t) {
  let arr = [
    // present tense
    ["agguanto", "{agguantare}"],
    ["agguanti", "{agguantare}"],
    ["agguanta", "{agguantare}"],
    ["agguantiamo", "{agguantare}"],
    ["agguantate", "{agguantare}"],
    ["agguantano", "{agguantare}"],
    // gerunds
    ["abbancando", "{abbancare}"],
    ["abbandonando", "{abbandonare}"],
    ["abbarbagliando", "{abbarbagliare}"],
    // past-participle
    ["abbaruffato", "abbaruffare"],
    // past-tense
    ["vociai", "{vociare}"],
    ["vociasti", "{vociare}"],
    ["vociò", "{vociare}"],
    ["vociammo", "{vociare}"],
    ["vociaste", "{vociare}"],
    ["vociarono", "{vociare}"],
    // future-tense
    ["trasporrò", "{trasporre}"],
    ["trasporrai", "{trasporre}"],
    ["trasporrà", "{trasporre}"],
    ["trasporremo", "{trasporre}"],
    ["trasporrete", "{trasporre}"],
    ["trasporranno", "{trasporre}"],
    // conditional
    ["ammasserei", "{ammassare}"],
    ["ammasseresti", "{ammassare}"],
    ["ammasserebbe", "{ammassare}"],
    ["ammasseremmo", "{ammassare}"],
    ["ammassereste", "{ammassare}"],
    ["ammasserebbero", "{ammassare}"],
    // gerund
    ["ventilando", "{ventilare}"],
    ["verbalizzando", "{verbalizzare}"],
  ]
  arr.forEach(function (a) {
    let [str, match] = a
    let doc = nlp(str).compute('root')
    let tags = doc.json()[0].terms.map(term => term.tags[0])
    let msg = `'${(str + "' ").padEnd(20, ' ')}  - '${tags.join(', ')}'`
    t.equal(doc.has(match), true, here + msg)
  })
  t.end()
})
