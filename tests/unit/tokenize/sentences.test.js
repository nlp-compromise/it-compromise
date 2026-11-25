import test from 'tape'
import nlp from '../../_lib.js'
const here = '[it-sentences] '
nlp.verbose(false)

test('sentences:', function (t) {
  const arr = [
    // terminators
    ['Sono andato a Roma. Poi sono tornato.', ['Sono andato a Roma.', 'Poi sono tornato.']],
    ['Come stai? Molto bene! Grazie.', ['Come stai?', 'Molto bene!', 'Grazie.']],
    ['Che ore sono? Sono le tre. Grazie!', ['Che ore sono?', 'Sono le tre.', 'Grazie!']],
    ['Davvero?! Non ci credo.', ['Davvero?!', 'Non ci credo.']],
    ['Che bello!!! Davvero??', ['Che bello!!!', 'Davvero??']],
    ['Perché? Perché no!', ['Perché?', 'Perché no!']],
    ['Uno. Due. Tre.', ['Uno.', 'Due.', 'Tre.']],
    ['Sì. No. Forse.', ['Sì.', 'No.', 'Forse.']],
    ['Primo: studia. Secondo: dormi.', ['Primo: studia.', 'Secondo: dormi.']],
    [`Roma è la capitale d'Italia. Milano è più grande?`, [`Roma è la capitale d'Italia.`, 'Milano è più grande?']],
    [`L'amico è arrivato. C'è anche Maria.`, [`L'amico è arrivato.`, `C'è anche Maria.`]],
    // not terminators
    ['Mi piace il caffè', ['Mi piace il caffè']],
    ['Ho visto Marco, Luca e Anna.', ['Ho visto Marco, Luca e Anna.']],
    ['la città è bella; il mare è blu.', ['la città è bella; il mare è blu.']],
    ['Ha detto: vengo domani.', ['Ha detto: vengo domani.']],
    ['Marco – il mio amico – è qui.', ['Marco – il mio amico – è qui.']],
    // ellipses
    ['Piove... molto', ['Piove... molto']],
    ['Mah... non so. Vedremo.', ['Mah... non so.', 'Vedremo.']],
    // quotations
    ['«Vieni qui!» disse Maria. Poi uscì.', ['«Vieni qui!» disse Maria.', 'Poi uscì.']],
    ['«Dove vai?» chiese Luca. «A casa.»', ['«Dove vai?» chiese Luca.', '«A casa.»']],
    // abbreviations
    ['Il prof. Rossi insegna qui.', ['Il prof. Rossi insegna qui.']],
    ['Ho parlato con la prof.ssa Bianchi ieri.', ['Ho parlato con la prof.ssa Bianchi ieri.']],
    ['La sig.ra Verdi non è qui.', ['La sig.ra Verdi non è qui.']],
    ['Vedi fig. 3 per i dettagli.', ['Vedi fig. 3 per i dettagli.']],
    ['Lavora per la F.I.A.T. da anni.', ['Lavora per la F.I.A.T. da anni.']],
    ['Abita in p.zza Garibaldi. È bello.', ['Abita in p.zza Garibaldi.', 'È bello.']],
    // 'ecc.' is an abbreviation, so it never ends a sentence (like 'etc.' in english)
    ['Ha comprato pane, latte, ecc. Poi è tornato a casa.', ['Ha comprato pane, latte, ecc. Poi è tornato a casa.']],
    ['Frutta, verdura, ecc. sono in offerta.', ['Frutta, verdura, ecc. sono in offerta.']],
    // numbers
    ['Costa 3,50 euro. Lo compro.', ['Costa 3,50 euro.', 'Lo compro.']],
    ['Costa 3.50 euro. Va bene.', ['Costa 3.50 euro.', 'Va bene.']],
    ['Costa 1.000 euro al mese.', ['Costa 1.000 euro al mese.']],
    ['Sono le 15.30. Andiamo!', ['Sono le 15.30.', 'Andiamo!']],
    ['È nato nel 1990. Vive a Roma.', ['È nato nel 1990.', 'Vive a Roma.']],
    ['Versione 2.0.1 è uscita. Scaricala!', ['Versione 2.0.1 è uscita.', 'Scaricala!']],
    // urls + emails
    ['www.esempio.it è un sito. Visitalo.', ['www.esempio.it è un sito.', 'Visitalo.']],
    ['Scrivi a mario@esempio.it oggi. Grazie.', ['Scrivi a mario@esempio.it oggi.', 'Grazie.']],
    // newlines
    ['Ciao!\n\nCome stai?', ['Ciao!', 'Come stai?']],
    ['Lista della spesa\nPane e latte', ['Lista della spesa', 'Pane e latte']],
    // extra whitespace
    ['Ciao   mondo.  Come  va?', ['Ciao   mondo.', 'Come  va?']],
  ]
  arr.forEach(a => {
    const [str, want] = a
    const doc = nlp(str)
    t.deepEqual(doc.fullSentences().out('array'), want, here + JSON.stringify(str))
    t.equal(doc.text(), str, here + 'roundtrip ' + JSON.stringify(str))
  })
  t.end()
})

test('sentence api:', function (t) {
  const doc = nlp('Sono andato a Roma. Poi sono tornato? Sì!')
  t.equal(doc.length, 3, here + 'doc length')
  t.equal(doc.eq(1).text(), 'Poi sono tornato?', here + 'eq(1)')
  t.equal(doc.first().text(), 'Sono andato a Roma.', here + 'first()')
  t.equal(doc.last().text(), 'Sì!', here + 'last()')
  t.equal(doc.match('tornato').fullSentences().text(), 'Poi sono tornato?', here + 'fullSentences() of a match')
  t.equal(doc.if('roma').length, 1, here + 'if()')
  t.equal(doc.ifNo('roma').length, 2, here + 'ifNo()')
  t.deepEqual(doc.json().map(o => o.text), ['Sono andato a Roma.', 'Poi sono tornato?', 'Sì!'], here + 'json text')
  t.end()
})
