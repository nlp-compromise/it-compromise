import test from 'tape'
import nlp from '../../_lib.js'
const here = '[it-sentence-rules] '

// each line is one text - a '|' marks where one sentence ends, and the next begins
const run = function (t, cases) {
  cases
    .split('\n')
    .map(str => str.trim())
    .filter(str => str)
    .forEach(str => {
      const want = str.split('|').map(s => s.trim())
      const text = want.join(' ')
      t.deepEqual(nlp(text).fullSentences().out('array'), want, here + text)
    })
  t.end()
}

test('abbreviations:', function (t) {
  run(
    t,
    `
    Il sig. Rossi è arrivato. | La sig.ra Bianchi no.
    Il dott. Bianchi lavora qui.
    L'ing. Neri lavora a Milano.
    Ho parlato con l'avv. Gallo ieri.
    Ho letto pag. 5 del libro.
    Spett. Ditta, vi scrivo oggi.
    Egr. Sig. Rossi, le scrivo.
    Nel 300 a.C. a Roma. | Poi no.
    La S.p.A. ha chiuso. | Peccato.
    Vedi pag. 5, art. 3, n. 7.
    Per es. questo. | O p. es. quello.
    Il prof. Verdi e la prof.ssa Neri.
    Nato il 3 gen. 1990. | Morto il 5 sett. 2020.
    Il sen. Rossi parla. | Ascolta.
    La dott.ssa Conti visita il lun. e il gio. mattina.
    Gent. Sig.ra Ferrari, la ringrazio.
    Ill. Prof. Marini, le scrivo per chiedere.
    Il gen. Cadorna comandava le truppe.
    Il col. Moretti e il cap. Fontana arrivarono.
    L’on. Russo ha votato contro.
    Mons. Ricci celebrò la messa.
    L'arch. Piano ha progettato l'edificio.
    Il geom. Costa e il rag. Greco lavorano insieme.
    Cfr. vol. 2, cap. 4, pagg. 10-12.
    Vedi fig. 3 e tab. 5 a pag. 20.
    Tel. 02 1234567, ore 9-18.
    Costa ca. 50 euro al mese.
    Juventus vs. Milan si gioca domani.
    La ditta F.lli Rossi S.r.l. è fallita.
    Roma fu fondata nel 753 a.C. da Romolo.
    Nel 79 d.C. il Vesuvio eruttò. | Pompei fu distrutta.
    G. Verdi nacque nel 1813. | Morì nel 1901.
    Lo scrisse A. Manzoni nel 1827.
    N.B. il negozio è chiuso lunedì.
    P.S. ti voglio bene.
    Il 3 feb. e il 5 apr. sono festivi.
    In ott. o in nov. forse.
    A dic. nevica spesso.
    Sez. 3, lett. b del regolamento.
    S. Francesco nacque ad Assisi.
    V. anche il par. 4.
    Art. 3 della Costituzione.
    Ed. Mondadori, 2010.
    Via G. Garibaldi 5, Torino.
    P.zza Duomo è bellissima. | Andiamoci.
    Il n. 5 è il mio preferito.
    Num. verde 800 123456.
    Ho comprato pane, latte, ecc. Poi sono tornato.
    Ha preso tutto, ecc. Non resta niente.
    Ci servono farina, uova, zucchero, ecc. Hai tutto?
  `
  )
})

test('not abbreviations:', function (t) {
  run(
    t,
    `
    Vado al mar. | Fa caldo.
    Sono io. | Ciao.
    Tu ed io. | Basta.
    Via Roma 5, tel. 555. | Chiama.
    Ho un ago. | Cucio io.
    Bevo il tè. | Tu bevi il caffè.
    Lui dice di sì. | Lei dice di no.
    Vado su. | Tu resta giù.
    Non lo so. | Chiedi a lui.
    Ho sete. | Dammi acqua.
    Lei è qui. | Lui è là.
    È già sera. | Andiamo a casa.
    Abita al sud. | Lavora al nord.
    Mi piace il mare. | A te no.
    Ha 20 anni. | Suo fratello ne ha 25.
    Costa 3,50 euro. | È poco.
    È nato nel 1990. | È morto nel 2020.
    Arrivo alle 10. | Parto alle 12.
    Fa così. | Fidati.
    Che bel re. | Viva il re.
    Sto con te. | Sempre.
    Vieni da me. | Ti aspetto.
    Parla con noi. | Ti ascoltiamo.
    Il cane è su. | Il gatto è giù.
    Prendo il bus. | Tu prendi il tram.
    Visita www.esempio.it per saperne di più. | Grazie.
    Il file note.txt è vuoto. | Cancellalo.
    La versione 2.0 è uscita. | È veloce.
  `
  )
})

test('questions and exclamations:', function (t) {
  run(
    t,
    `
    Come stai? | Io sto bene.
    Che bello! | Mi piace tanto.
    Cosa? | Come? | Quando?
    Davvero?! | Non ci credo!
    E tu? | Io no.
    Ciao! | Come ti chiami?
    No! | Assolutamente no!
    Aspetta… Arrivo subito.
    Non so... Forse domani.
    Non so... forse domani.
    Beh… vedremo. | Ciao!
  `
  )
})

test('quotations and dialogue:', function (t) {
  run(
    t,
    `
    Disse: «No. Non vengo.» Poi uscì.
    Ha detto: "Non lo so." Poi è uscito.
    (Non lo so.) Forse domani.
    «Dove sei?», chiese. | Nessuno rispose.
    Lei disse: “Non posso.” Lui insistette.
    Mi ha detto "ciao" ed è andato via. | Non è tornato.
    Pensò (per un attimo) a lei. | Poi continuò.
    Disse: «No. Mai. Non voglio. Basta così.» Poi tacque.
    «Buongiorno.» Entrò.
    «È finita», disse lei. | Lui pianse.
    Sussurrò: «Zitto. Sta dormendo.» Uscimmo piano.
  `
  )
})

test('harder cases:', function (t) {
  run(
    t,
    `
    Sono le 5 p.m. Andiamo.
    Lavora alla Fiat S.p.A. Vive a Torino.
    «Sì.» «No.»
    Pesa 3 kg. di farina.
    Pesa 3 kg. Misura 2 m.
    1. Apri la porta. | 2. Entra.
    Chi? | Io?
    Abita in via Roma n. 5. | Vieni.
    Papa Giovanni Paolo II. | Era polacco.
    Lo ha scritto J. R. R. Tolkien. | È famoso.
    Parla con il dott. Lui sa.
    Vedi pag. 12. | Vedi anche pag. 15.
    ‘Ciao’, disse. | ‘Addio’, rispose.
    Ha corso 5 km. Poi ha dormito.
    Nato in feb. Morto in dic.
    Aperto dal lun. al ven. Chiuso la domenica.
    Roma, 50 a.C. Cesare regna.
    È il sig. No, è la sig.ra.
    Il mio tel. è 555. | Chiamami.
    No. | Sì. | Forse.
    «No», disse. | «Sì», risposi.
    Mi disse: «Vieni». | Andai.
    Il bambino gridò: «Mamma!». | Nessuno venne.
    Lavora alla Rossi S.r.l. Guadagna bene.
    Vedi fig. 3. | Vedi anche fig. 4.
    Aspetta 5 min. davanti alla porta.
    Aspetta 5 min. Poi parte.
    Andiamo! | Presto! | È tardi.
    Sì? | No? | Deciditi.
    Ecco l'art. 5. | Leggilo.
    Guadagna ca. 2000. | È poco.
    Cfr. Rossi 2020. | Vedi anche Bianchi.
    Ed. Einaudi, Torino.
    Il gen. Rossi è morto. | Viva il gen.
    Via Roma, n. 5. | Milano.
  `
  )
})

test('longer texts:', function (t) {
  run(
    t,
    `
    Vedi la fig. A e la tab. B in allegato.
    È nel vol. II dell’opera.
    Consulta il cap. IV e l’art. XII.
    Il Sig. Lo Russo è arrivato.
    L’Univ. di Bologna è antica.
    Il dott. Rossi e la dott.ssa Bianchi sono arrivati alle 17 in ospedale. | Poi hanno operato il paziente. | Tutto è andato bene.
    L’azienda è stata fondata nel 1950. | Oggi ha ca. 500 dipendenti. | Nel 2023 ha fatturato 80 milioni.
    È arrivato alle 7. | Non c’era nessuno. | Allora ha aspettato fino alle 8. | Poi se n’è andato.
    Dante nacque nel 1265 a Firenze. | Morì a Ravenna nel 1321.
    È alto 1,80 m. Lei è alta 1,65 m.
    Il pacco pesa 2 kg. La spedizione costa 5 euro.
    Che sorpresa! | Quando sei arrivato? | Non ti aspettavo prima di domani.
    Parli con l’avv. Lui la aiuterà.
    Il testo è a pag. 5. | Leggilo con calma.
    Aperto dal lun. al ven. dalle 8 alle 17. | Chiuso la domenica.
  `
  )
})
