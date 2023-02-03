import test from 'tape'
import nlp from './_lib.js'
let here = '[it-verb-forms] '
nlp.verbose(false)

test('ferbs:', function (t) {
  let arr = [
    // Presente
    ['colmo', '#Verb'],//io 
    ['colmi', '#Verb'],//tu 
    ['colma', '#Verb'],//lei/lui 
    ['colmiamo', '#Verb'],//noi 
    ['colmate', '#Verb'],//voi 
    ['colmano', '#Verb'],//loro 
    // Imperfetto
    ['colmavo', '#Verb'],//io 
    ['colmavi', '#Verb'],//tu 
    ['colmava', '#Verb'],//lei/lui 
    ['colmavamo', '#Verb'],//noi 
    ['colmavate', '#Verb'],//voi 
    ['colmavano', '#Verb'],//loro 
    // Passato remoto
    ['colmai', '#Verb'],//io 
    ['colmasti', '#Verb'],//tu 
    ['colmò', '#Verb'],//lei/lui 
    ['colmammo', '#Verb'],//noi 
    ['colmaste', '#Verb'],//voi 
    ['colmarono', '#Verb'],//loro 
    // Futuro semplice
    ['colmerò', '#Verb'],//io 
    ['colmerai', '#Verb'],//tu 
    ['colmerà', '#Verb'],//lei/lui 
    ['colmeremo', '#Verb'],//noi 
    ['colmerete', '#Verb'],//voi 
    ['colmeranno', '#Verb'],//loro 
    // Passato prossimo
    ['ho colmato', '#Verb #Verb'],//io 
    ['hai colmato', '#Verb #Verb'],//tu 
    ['ha colmato', '#Verb #Verb'],//lei/lui 
    ['abbiamo colmato', '#Verb #Verb'],//noi 
    ['avete colmato', '#Verb #Verb'],//voi 
    ['hanno colmato', '#Verb #Verb'],//loro 
    // Trapassato prossimo
    ['avevo colmato', '#Verb #Verb'],//io 
    ['avevi colmato', '#Verb #Verb'],//tu 
    ['aveva colmato', '#Verb #Verb'],//lei/lui 
    ['avevamo colmato', '#Verb #Verb'],//noi 
    ['avevate colmato', '#Verb #Verb'],//voi 
    ['avevano colmato', '#Verb #Verb'],//loro 
    // Trapassato remoto
    ['ebbi colmato', '#Verb #Verb'],//io 
    ['avesti colmato', '#Verb #Verb'],//tu 
    ['ebbe colmato', '#Verb #Verb'],//lei/lui 
    ['avemmo colmato', '#Verb #Verb'],//noi 
    ['aveste colmato', '#Verb #Verb'],//voi 
    ['ebbero colmato', '#Verb #Verb'],//loro 
    // Futuro anteriore
    ['avrò colmato', '#Verb #Verb'],//io 
    ['avrai colmato', '#Verb #Verb'],//tu 
    ['avrà colmato', '#Verb #Verb'],//lei/lui 
    ['avremo colmato', '#Verb #Verb'],//noi 
    ['avrete colmato', '#Verb #Verb'],//voi 
    ['avranno colmato', '#Verb #Verb'],//loro 
    // CONGIUNTIVOPresente
    ['che io colmi', '#Preposition #Pronoun #Verb'],//io 
    ['che tu colmi', '#Preposition #Pronoun #Verb'],//tu 
    ['che lui colmi', '#Preposition #Pronoun #Verb'],//lei/lui 
    ['che noi colmiamo', '#Preposition #Pronoun #Verb'],//noi 
    ['che voi colmiate', '#Preposition #Pronoun #Verb'],//voi 
    ['che loro colmino', '#Preposition #Pronoun #Verb'],//loro 
    // Passato
    // ['che abbia colmato', '#Preposition #Pronoun #Verb'],//io 
    // ['che abbia colmato', '#Preposition #Pronoun #Verb'],//tu 
    // ['che abbia colmato', '#Preposition #Pronoun #Verb'],//lei/lui 
    // ['che abbiamo colmato', '#Preposition #Pronoun #Verb'],//noi 
    // ['che abbiate colmato', '#Preposition #Pronoun #Verb'],//voi 
    // ['che abbiano colmato', '#Preposition #Pronoun #Verb'],//loro 
    // Imperfetto
    // ['che colmassi', '#Pronoun #Verb'],//io 
    // ['che colmassi', '#Pronoun #Verb'],//tu 
    // ['che colmasse', '#Pronoun #Verb'],//lei/lui 
    // ['che colmassimo', '#Pronoun #Verb'],//noi 
    // ['che colmaste', '#Pronoun #Verb'],//voi 
    // ['che colmassero', '#Pronoun #Verb'],//loro 
    // Trapassato
    ['che avessi colmato', '#Preposition #Verb #Verb'],//io 
    ['che avessi colmato', '#Preposition #Verb #Verb'],//tu 
    ['che avesse colmato', '#Preposition #Verb #Verb'],//lei/lui 
    ['che avessimo colmato', '#Preposition #Verb #Verb'],//noi 
    ['che aveste colmato', '#Preposition #Verb #Verb'],//voi 
    ['che avessero colmato', '#Preposition #Verb #Verb'],//loro 
    // CONDIZIONALEPresente

    ['colmerei', '#Verb'],//io 
    ['colmeresti', '#Verb'],//tu 
    ['colmerebbe', '#Verb'],//lei/lui 
    ['colmeremmo', '#Verb'],//noi 
    ['colmereste', '#Verb'],//voi 
    ['colmerebbero', '#Verb'],//loro 
    // Passato
    ['avrei colmato', '#Verb #Verb'],//io 
    ['avresti colmato', '#Verb #Verb'],//tu 
    ['avrebbe colmato', '#Verb #Verb'],//lei/lui 
    ['avremmo colmato', '#Verb #Verb'],//noi 
    ['avreste colmato', '#Verb #Verb'],//voi 
    ['avrebbero colmato', '#Verb #Verb'],//loro 
    // IMPERATIVO PRESENTE
    ['colma', '#Verb'],
    ['colmi', '#Verb'],
    ['colmiamo', '#Verb'],
    ['colmate', '#Verb'],
    ['colmino', '#Verb'],
    // GERUNDIO
    // Presente
    ['colmando', '#Gerund'],
    // Passato
    ['avendo colmato', '#Verb #Verb'],
    // INFINITO PRESENTE
    ['colmare', '#Verb'],
    // PARTICIPIO
    // Presente
    ['colmante', '#Verb'],
    // Passato
    ['colmato', '#Verb']
  ]
  arr.forEach(function (a) {
    let [str, match] = a
    let doc = nlp(str)//.compute('tagRank')
    let tags = doc.json()[0].terms.map(term => term.tags[0])
    let msg = `'${(str + "' ").padEnd(20, ' ')}  - '${tags.join(', ')}'`
    let m = doc.match(match)
    t.equal(m.text(), doc.text(), here + msg + ' ' + a[1])
  })
  t.end()
})
