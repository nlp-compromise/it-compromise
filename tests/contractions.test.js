import test from 'tape'
import nlp from './_lib.js'
let here = '[it-buildNet] '

test('buildNet:', function (t) {
  let arr = [
    ["all'uscita", ["a", "l", "uscita"]],
    ["all'aeroporto", ["a", "l", "aeroporto"]],
    ["all'entrata", ["a", "l", "entrata"]],
    ["all'opera", ["a", "l", "opera"]],
    ["dell'arte", ["di", "l", "arte"]],
    ["dell'uomo", ["di", "l", "uomo"]],
    ["dell'animale", ["di", "l", "animale"]],
    ["dell'isola", ["di", "l", "isola"]],
    ["dell'oro", ["di", "l", "oro"]],
    ["nell'acqua", ["in", "l", "acqua"]],
    ["nell'aria", ["in", "l", "aria"]],
    ["nell'ombra", ["in", "l", "ombra"]],
    ["nell'istituto", ["in", "l", "istituto"]],
    ["nell'ospedale", ["in", "l", "ospedale"]],
    ["sull'isola", ["su", "l", "isola"]],
    ["sull'albero", ["su", "l", "albero"]],
    ["sull'automobile", ["su", "l", "automobile"]],
    ["sull'uva", ["su", "l", "uva"]],
    ["sull'orologio", ["su", "l", "orologio"]],
    ["coll'ombrello", ["con", "l", "ombrello"]],
    ["coll'amico", ["con", "l", "amico"]],
    ["coll'arte", ["con", "l", "arte"]],
    ["coll'acqua", ["con", "l", "acqua"]],
    ["coll'istinto", ["con", "l", "istinto"]],
    ["dall'aeroporto", ["da", "l", "aeroporto"]],
    ["dall'ufficio", ["da", "l", "ufficio"]],
    ["dall'ospedale", ["da", "l", "ospedale"]],
    ["dall'isola", ["da", "l", "isola"]],
    ["dall'entrata", ["da", "l", "entrata"]],
    ["dall'orologio", ["da", "l", "orologio"]],
    ["dall'arte", ["da", "l", "arte"]],
    ["dall'amico", ["da", "l", "amico"]],
    ["dall'acqua", ["da", "l", "acqua"]],
    ["dall'istinto", ["da", "l", "istinto"]],
    ["dall'uva", ["da", "l", "uva"]],
    ["dall'ombrello", ["da", "l", "ombrello"]],
    ["dall'animale", ["da", "l", "animale"]],
    ["dall'uomo", ["da", "l", "uomo"]],
    ["dall'opera", ["da", "l", "opera"]],
    ["dall'aereo", ["da", "l", "aereo"]],
    ["dall'idea", ["da", "l", "idea"]],
    ["dall'olio", ["da", "l", "olio"]],
    ["dall'istante", ["da", "l", "istante"]],
    ["dall'ingresso", ["da", "l", "ingresso"]],
    ["dall'occhio", ["da", "l", "occhio"]],
    ["dall'orecchio", ["da", "l", "orecchio"]],
    ["dall'onda", ["da", "l", "onda"]],
    ["dall'orso", ["da", "l", "orso"]],
    ["dall'abito", ["da", "l", "abito"]],
    ["nell'educazione", ["in", "l", "educazione"]],
    ["nell'erba", ["in", "l", "erba"]],
    ["all'infinito", ["a", "l", "infinito"]],
    ["all'hotel", ["a", "l", "hotel"]],
    ["sull'altopiano", ["su", "l", "altopiano"]],
    ["sull'Internet", ["su", "l", "internet"]],
    ["dall'università", ["da", "l", "università"]],
    ["dall'industria", ["da", "l", "industria"]],
    ["coll'altro", ["con", "l", "altro"]],
    ["coll'individuo", ["con", "l", "individuo"]],
    ["all'altare", ["a", "l", "altare"]],
    ["all'inizio", ["a", "l", "inizio"]],
    ["dall'elefante", ["da", "l", "elefante"]],
    ["dall'ombra", ["da", "l", "ombra"]],
    ["all'ultimo", ["a", "l", "ultimo"]],
    ["all'opposto", ["a", "l", "opposto"]],
    ["dall'unione", ["da", "l", "unione"]],
    ["dall'oriente", ["da", "l", "oriente"]],
    ["dall'età", ["da", "l", "età"]],
    ["nell'ipotesi", ["in", "l", "ipotesi"]]
  ]

  arr.forEach(a => {
    let [str, out] = a
    let res = nlp(str).json({ normal: true })[0].terms.map(o => o.machine)
    t.deepEqual(res, out, str)
  })
  t.end()
})