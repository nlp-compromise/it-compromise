import test from 'tape'
import nlp from '../../_lib.js'
const here = '[verb-tense] '

const run = function (t, arr, fn) {
  arr.forEach(a => {
    const [str, want] = a
    const doc = nlp(str)
    doc.verbs()[fn]()
    t.equal(doc.text(), want, here + `${fn}: '${str}' → '${want}'`)
  })
}

test('toPastTense - regular verbs, every person:', function (t) {
  // the past-tense is the imperfetto
  run(t, [
    // -are
    ['io parlo italiano', 'io parlavo italiano'],
    ['tu parli molto', 'tu parlavi molto'],
    ['lei parla italiano', 'lei parlava italiano'],
    ['noi parliamo italiano', 'noi parlavamo italiano'],
    ['voi parlate italiano', 'voi parlavate italiano'],
    ['loro parlano italiano', 'loro parlavano italiano'],
    // -ere
    ['io credo a tutto', 'io credevo a tutto'],
    ['tu vedi il mare', 'tu vedevi il mare'],
    ['lei legge un libro', 'lei leggeva un libro'],
    ['noi viviamo qui', 'noi vivevamo qui'],
    ['voi leggete molto', 'voi leggevate molto'],
    ['loro vedono il mare', 'loro vedevano il mare'],
    // -ire
    ['io dormo bene', 'io dormivo bene'],
    ['tu dormi bene', 'tu dormivi bene'],
    ['il gatto dorme', 'il gatto dormiva'],
    ['noi dormiamo bene', 'noi dormivamo bene'],
    ['voi dormite bene', 'voi dormivate bene'],
    ['loro dormono bene', 'loro dormivano bene'],
    // -isc- verbs
    ['io finisco il lavoro', 'io finivo il lavoro'],
    ['capisco tutto', 'capivo tutto'],
    ['lei capisce tutto', 'lei capiva tutto'],
    ['loro finiscono il lavoro', 'loro finivano il lavoro'],
  ], 'toPastTense')
  t.end()
})

test('toPastTense - irregular verbs:', function (t) {
  run(t, [
    ['sono felice', 'ero felice'],
    ['sei felice', 'eri felice'],
    ['lei è alta', 'lei era alta'],
    ['siamo stanchi', 'eravamo stanchi'],
    ['siete stanchi', 'eravate stanchi'],
    ['loro sono amici', 'loro erano amici'],
    ['ho un cane', 'avevo un cane'],
    ['lei ha un gatto', 'lei aveva un gatto'],
    ['abbiamo fame', 'avevamo fame'],
    ['loro hanno fame', 'loro avevano fame'],
    ['vado a scuola', 'andavo a scuola'],
    ['lei va a casa', 'lei andava a casa'],
    ['andiamo al mare', 'andavamo al mare'],
    ['fa freddo', 'faceva freddo'],
    ['faccio il lavoro', 'facevo il lavoro'],
    ['lei dice la verità', 'lei diceva la verità'],
    ['lui beve acqua', 'lui beveva acqua'],
    ['esco stasera', 'uscivo stasera'],
    ['lei viene domani', 'lei veniva domani'],
    ['non lo so', 'non lo sapevo'],
    ['piove molto', 'pioveva molto'],
    ['i bambini giocano', 'i bambini giocavano'],
    ['Lei mangia una mela.', 'Lei mangiava una mela.'],
  ], 'toPastTense')
  t.end()
})

test('toPastTense - from other tenses:', function (t) {
  run(t, [
    // future
    ['mangerò domani', 'mangiavo domani'],
    ['lei parlerà', 'lei parlava'],
    ['noi andremo al mare', 'noi andavamo al mare'],
    ['loro avranno un cane', 'loro avevano un cane'],
    // already imperfetto - no change
    ['lei parlava', 'lei parlava'],
    ['io parlavo', 'io parlavo'],
    ['ero giovane', 'ero giovane'],
    ['avevo fame', 'avevo fame'],
    // the passato remoto is already in the past
    ['lui parlò ieri', 'lui parlò ieri'],
    ['disse la verità', 'disse la verità'],
    // the passato prossimo is already in the past
    ['ho mangiato', 'ho mangiato'],
    ['abbiamo parlato', 'abbiamo parlato'],
    ['sono andato a casa', 'sono andato a casa'],
    ['lei è andata', 'lei è andata'],
    ['mi sono alzato', 'mi sono alzato'],
    ['lei aveva mangiato', 'lei aveva mangiato'],
    ['ho sempre mangiato la pasta', 'ho sempre mangiato la pasta'],
    ['non ho mai visto il mare', 'non ho mai visto il mare'],
  ], 'toPastTense')
  t.end()
})

test('toPresentTense:', function (t) {
  run(t, [
    // from imperfetto
    ['io parlavo italiano', 'io parlo italiano'],
    ['tu parlavi molto', 'tu parli molto'],
    ['lei parlava', 'lei parla'],
    ['noi parlavamo', 'noi parliamo'],
    ['voi parlavate', 'voi parlate'],
    ['loro parlavano', 'loro parlano'],
    ['ero giovane', 'sono giovane'],
    ['lei era alta', 'lei è alta'],
    ['eravamo stanchi', 'siamo stanchi'],
    ['avevo fame', 'ho fame'],
    ['lei leggeva un libro', 'lei legge un libro'],
    ['il gatto dormiva', 'il gatto dorme'],
    ['capivo tutto', 'capisco tutto'],
    ['andavo a scuola', 'vado a scuola'],
    ['faceva freddo', 'fa freddo'],
    // from passato remoto
    ['lui parlò ieri', 'lui parla ieri'],
    ['disse la verità', 'dice la verità'],
    ['loro andarono via', 'loro vanno via'],
    // from future
    ['mangerò domani', 'mangio domani'],
    ['lei parlerà', 'lei parla'],
    ['noi andremo al mare', 'noi andiamo al mare'],
    ['loro verranno', 'loro vengono'],
    ['farà freddo', 'fa freddo'],
    // already present - no change
    ['io parlo italiano', 'io parlo italiano'],
    ['sono felice', 'sono felice'],
    ['lei mangia una mela', 'lei mangia una mela'],
  ], 'toPresentTense')
  t.end()
})

test('toFutureTense:', function (t) {
  run(t, [
    ['io parlo italiano', 'io parlerò italiano'],
    ['tu parli molto', 'tu parlerai molto'],
    ['lei parla', 'lei parlerà'],
    ['noi parliamo', 'noi parleremo'],
    ['voi parlate', 'voi parlerete'],
    ['loro parlano', 'loro parleranno'],
    ['lei legge un libro', 'lei leggerà un libro'],
    ['il gatto dorme', 'il gatto dormirà'],
    ['io finisco il lavoro', 'io finirò il lavoro'],
    // spelling changes
    ['Lei mangia una mela.', 'Lei mangerà una mela.'],
    ['i bambini giocano', 'i bambini giocheranno'],
    ['pago il conto', 'pagherò il conto'],
    ['cerco il libro', 'cercherò il libro'],
    // irregular future-stems
    ['sono felice', 'sarò felice'],
    ['lei è alta', 'lei sarà alta'],
    ['ho un cane', 'avrò un cane'],
    ['vado a scuola', 'andrò a scuola'],
    ['fa freddo', 'farà freddo'],
    ['lei dice la verità', 'lei dirà la verità'],
    ['lui beve acqua', 'lui berrà acqua'],
    ['lei viene', 'lei verrà'],
    ['non lo so', 'non lo saprò'],
    ['noi viviamo qui', 'noi vivremo qui'],
    ['ci vediamo', 'ci vedremo'],
    ['esco stasera', 'uscirò stasera'],
    // from past
    ['lei parlava', 'lei parlerà'],
    ['ero giovane', 'sarò giovane'],
    ['disse la verità', 'dirà la verità'],
    ['lui parlò ieri', 'lui parlerà ieri'],
    // already future - no change
    ['mangerò domani', 'mangerò domani'],
    ['lei parlerà', 'lei parlerà'],
  ], 'toFutureTense')
  t.end()
})

test('ambiguous person:', function (t) {
  // 'sono' is both first-person, and third-person plural
  run(t, [
    ['sono felice', 'ero felice'],
    ['io sono felice', 'io ero felice'],
    ['io non sono felice', 'io non ero felice'],
    ['loro sono amici', 'loro erano amici'],
    ['loro non sono amici', 'loro non erano amici'],
    ['sono amici', 'erano amici'],
    ['sono stanchi', 'erano stanchi'],
    ['i ragazzi sono stanchi', 'i ragazzi erano stanchi'],
    ['i bambini sono a scuola', 'i bambini erano a scuola'],
    ['sono a scuola', 'ero a scuola'],
  ], 'toPastTense')
  run(t, [
    ['sono felice', 'sarò felice'],
    ['loro sono amici', 'loro saranno amici'],
    ['sono amici', 'saranno amici'],
    ['i ragazzi sono stanchi', 'i ragazzi saranno stanchi'],
  ], 'toFutureTense')
  // 'sono andato' vs 'sono andati'
  run(t, [
    ['sono andato a casa', 'vado a casa'],
    ['sono andati via', 'vanno via'],
    ['loro sono andati via', 'loro vanno via'],
    ['io sono andato via', 'io vado via'],
  ], 'toPresentTense')
  t.end()
})

test('compound verb-phrases:', function (t) {
  // only the finite verb changes
  run(t, [
    ['non voglio andare', 'non volevo andare'],
    ['posso parlare', 'potevo parlare'],
    ['devo studiare', 'dovevo studiare'],
    ['sta piovendo', 'stava piovendo'],
    ['sto mangiando', 'stavo mangiando'],
    ['parlare è facile', 'parlare era facile'],
  ], 'toPastTense')
  run(t, [
    ['stavo mangiando', 'sto mangiando'],
    ['volevo andare', 'voglio andare'],
    ['potevo parlare', 'posso parlare'],
    ['dovevo studiare', 'devo studiare'],
  ], 'toPresentTense')
  run(t, [
    ['non voglio andare', 'non vorrò andare'],
    ['posso parlare', 'potrò parlare'],
    ['devo studiare', 'dovrò studiare'],
    ['stavo mangiando', 'starò mangiando'],
    ['parlare è facile', 'parlare sarà facile'],
  ], 'toFutureTense')
  t.end()
})

test('passato prossimo:', function (t) {
  // 'ho mangiato' collapses into a simple tense
  run(t, [
    ['ho mangiato', 'mangio'],
    ['hai mangiato', 'mangi'],
    ['lei ha mangiato il pane', 'lei mangia il pane'],
    ['abbiamo parlato', 'parliamo'],
    ['avete parlato', 'parlate'],
    ['loro hanno dormito', 'loro dormono'],
    ['lei aveva mangiato', 'lei mangia'],
    ['avrà mangiato', 'mangia'],
    ['Ho mangiato.', 'Mangio.'],
    ['ho mangiato e ho bevuto molto', 'mangio e bevo molto'],
    // with essere
    ['sono andato a casa', 'vado a casa'],
    ['lei è andata', 'lei va'],
    ['siamo arrivati ieri', 'arriviamo ieri'],
    ['lei è venuta', 'lei viene'],
    ['sono stato felice', 'sono felice'],
    // reflexive
    ['mi sono alzato', 'mi alzo'],
  ], 'toPresentTense')
  run(t, [
    ['ho mangiato', 'mangerò'],
    ['abbiamo parlato', 'parleremo'],
    ['sono andato a casa', 'andrò a casa'],
    ['lei è andata', 'lei andrà'],
    ['mi sono alzato', 'mi alzerò'],
    ['lei aveva mangiato', 'lei mangerà'],
    ['sono stato felice', 'sarò felice'],
    ['ho mangiato e ho bevuto molto', 'mangerò e berrò molto'],
    // the futuro anteriore is already in the future
    ['avrà mangiato', 'avrà mangiato'],
    ['avremo parlato', 'avremo parlato'],
  ], 'toFutureTense')
  t.end()
})

test('passive is not a past-tense:', function (t) {
  // 'essere' + participle is only a passato prossimo for some verbs
  run(t, [
    ['il libro è letto da tutti', 'il libro era letto da tutti'],
    ['la porta è chiusa', 'la porta era chiusa'],
    ['viene amato', 'veniva amato'],
  ], 'toPastTense')
  run(t, [
    ['il libro è letto da tutti', 'il libro sarà letto da tutti'],
    ['la porta è chiusa', 'la porta sarà chiusa'],
    ['viene amato', 'verrà amato'],
    ['è stato visto', 'sarà visto'],
  ], 'toFutureTense')
  run(t, [
    ['il libro era letto da tutti', 'il libro è letto da tutti'],
    ['è stato visto', 'è visto'],
  ], 'toPresentTense')
  t.end()
})

test('clitics and reflexives stay put:', function (t) {
  run(t, [
    ['mi alzo presto', 'mi alzavo presto'],
    ['si lava le mani', 'si lavava le mani'],
    ['non lo so', 'non lo sapevo'],
    ['ti amo', 'ti amavo'],
    ['ci vediamo', 'ci vedevamo'],
    ['te lo dico', 'te lo dicevo'],
  ], 'toPastTense')
  run(t, [
    ['mi alzo presto', 'mi alzerò presto'],
    ['si lava le mani', 'si laverà le mani'],
    ['ti amo', 'ti amerò'],
    ['te lo dico', 'te lo dirò'],
  ], 'toFutureTense')
  run(t, [
    ['mi alzavo presto', 'mi alzo presto'],
    ['si lavava le mani', 'si lava le mani'],
    ['ti amavo', 'ti amo'],
  ], 'toPresentTense')
  t.end()
})

test('leaves non-indicative verbs alone:', function (t) {
  const arr = [
    'parlare', // infinitive
    'mangiando', // gerund
    'parlerei', // conditional
    'lei parlerebbe', // conditional
    'che tu venga', // subjunctive
    'il gatto nero', // no verb
    '',
  ]
  arr.forEach(str => {
    ;['toPastTense', 'toPresentTense', 'toFutureTense'].forEach(fn => {
      const doc = nlp(str)
      doc.verbs()[fn]()
      t.equal(doc.text(), str, here + `${fn}: no-change '${str}'`)
    })
  })
  // only the indicative verb changes
  run(t, [['voglio che tu venga', 'volevo che tu venga']], 'toPastTense')
  run(t, [['voglio che tu venga', 'vorrò che tu venga']], 'toFutureTense')
  t.end()
})

test('punctuation and case:', function (t) {
  run(t, [
    ['Parli italiano?', 'Parlavi italiano?'],
    ['Lei mangia il pane!', 'Lei mangiava il pane!'],
    ['Parlo italiano.', 'Parlavo italiano.'],
    ['PARLO italiano', 'PARLAVO italiano'],
    ['Lui non mangia carne.', 'Lui non mangiava carne.'],
    ['Lei mangia il pane, beve acqua, e dorme.', 'Lei mangiava il pane, beveva acqua, e dormiva.'],
    ['Parlo italiano. Lei mangia il pane, e beve acqua.', 'Parlavo italiano. Lei mangiava il pane, e beveva acqua.'],
    ['"Ho fame", dice lei.', '"Avevo fame", diceva lei.'],
  ], 'toPastTense')
  run(t, [
    ['Parli italiano?', 'Parlerai italiano?'],
    ['PARLO italiano', 'PARLERÒ italiano'],
    ['Parlo italiano. Lei mangia il pane, e beve acqua.', 'Parlerò italiano. Lei mangerà il pane, e berrà acqua.'],
  ], 'toFutureTense')
  t.end()
})

test('tags of the new verb:', function (t) {
  let doc = nlp('io parlo italiano')
  doc.verbs().toPastTense()
  t.equal(doc.has('parlavo'), true, here + 'new word is matchable')
  t.equal(doc.match('parlavo').has('#ImperfectVerb'), true, here + 'past #ImperfectVerb')
  t.equal(doc.match('parlavo').has('#FirstPerson'), true, here + 'past #FirstPerson')
  t.equal(doc.match('parlavo').has('#PresentTense'), false, here + 'past not #PresentTense')

  doc = nlp('loro mangiavano il pane')
  doc.verbs().toFutureTense()
  t.equal(doc.match('mangeranno').has('#FutureTense'), true, here + 'future #FutureTense')
  t.equal(doc.match('mangeranno').has('#ThirdPersonPlural'), true, here + 'future #ThirdPersonPlural')
  t.equal(doc.match('mangeranno').has('#ImperfectVerb'), false, here + 'future not #ImperfectVerb')

  doc = nlp('tu parlavi')
  doc.verbs().toPresentTense()
  t.equal(doc.match('parli').has('#PresentTense'), true, here + 'present #PresentTense')
  t.equal(doc.match('parli').has('#SecondPerson'), true, here + 'present #SecondPerson')
  t.equal(doc.match('parli').has('#ImperfectVerb'), false, here + 'present not #ImperfectVerb')
  // the root is still found
  t.equal(doc.verbs().conjugate()[0].FutureTense.second, 'parlerai', here + 'conjugate after transform')
  t.end()
})

test('return value:', function (t) {
  let doc = nlp('ho mangiato il pane e lei beve acqua. Loro parlano.')
  let m = doc.verbs().toFutureTense()
  t.equal(m.viewType, 'Verbs', here + 'returns a Verbs view')
  t.deepEqual(m.out('array'), ['mangerò', 'berrà', 'parleranno.'], here + 'returns the new verbs')
  t.equal(doc.text(), 'mangerò il pane e lei berrà acqua. Loro parleranno.', here + 'changes the document')

  // chainable
  doc = nlp('io parlo e lei mangia')
  m = doc.verbs().toPastTense().toFutureTense().toPresentTense().toPastTense()
  t.equal(doc.text(), 'io parlavo e lei mangiava', here + 'chained')
  t.deepEqual(m.out('array'), ['parlavo', 'mangiava'], here + 'chained result')

  // round-trips
  const arr = ['io parlo italiano', 'lei mangia una mela', 'loro vivono qui', 'ho un cane', 'sono felice', 'vado a scuola', 'non lo so', 'i ragazzi sono stanchi']
  arr.forEach(str => {
    doc = nlp(str)
    doc.verbs().toPastTense()
    doc.verbs().toPresentTense()
    t.equal(doc.text(), str, here + `past round-trip '${str}'`)
    doc.verbs().toFutureTense()
    doc.verbs().toPresentTense()
    t.equal(doc.text(), str, here + `future round-trip '${str}'`)
  })
  t.end()
})

test('nth verb only:', function (t) {
  let doc = nlp('io parlo e lei mangia')
  doc.verbs().toPastTense(1)
  t.equal(doc.text(), 'io parlo e lei mangiava', here + 'toPastTense(1)')
  doc = nlp('io parlo e lei mangia')
  doc.verbs(0).toFutureTense()
  t.equal(doc.text(), 'io parlerò e lei mangia', here + 'verbs(0)')
  doc = nlp('io parlo e lei mangia')
  doc.verbs().toPastTense(5)
  t.equal(doc.text(), 'io parlo e lei mangia', here + 'out-of-range')
  // only the matched part of the document
  doc = nlp('io parlo. lei mangia.')
  doc.eq(1).verbs().toPastTense()
  t.equal(doc.text(), 'io parlo. lei mangiava.', here + 'second sentence only')
  // an empty match
  const none = nlp('la casa rossa').match('foo').verbs()
  t.equal(none.toPastTense().found, false, here + 'empty toPastTense')
  t.equal(none.toFutureTense().length, 0, here + 'empty toFutureTense')
  t.end()
})

test('compound tense, with an adverb in the middle:', function (t) {
  // already in the past
  run(t, [
    ['ho sempre mangiato la pasta', 'ho sempre mangiato la pasta'],
    ['non ho mai visto il mare', 'non ho mai visto il mare'],
    ['lei è già partita', 'lei è già partita'],
    ['siamo appena arrivati', 'siamo appena arrivati'],
  ], 'toPastTense')
  // the new verb takes the place of the auxiliary
  run(t, [
    ['ho sempre mangiato la pasta', 'mangio sempre la pasta'],
    ['non ho mai visto il mare', 'non vedo mai il mare'],
    ['Non ho mai visto il mare.', 'Non vedo mai il mare.'],
    ['Ho sempre mangiato.', 'Mangio sempre.'],
    ['lei è già partita', 'lei parte già'],
    ['abbiamo anche parlato', 'parliamo anche'],
    ['ho già finito', 'finisco già'],
    ['siamo appena arrivati', 'arriviamo appena'],
    ['ha sempre lavorato', 'lavora sempre'],
    ['non ha ancora mangiato', 'non mangia ancora'],
    ['è sempre stato così', 'è sempre così'],
  ], 'toPresentTense')
  run(t, [
    ['ho sempre mangiato la pasta', 'mangerò sempre la pasta'],
    ['non ho mai visto il mare', 'non vedrò mai il mare'],
    ['Ho sempre mangiato.', 'Mangerò sempre.'],
    ['lei è già partita', 'lei partirà già'],
    ['abbiamo anche parlato', 'parleremo anche'],
    ['non ha ancora mangiato', 'non mangerà ancora'],
    ['è sempre stato così', 'sarà sempre così'],
  ], 'toFutureTense')
  // an adjective is not a participle
  run(t, [
    ['sono molto stanco', 'ero molto stanco'],
    ['la porta è sempre chiusa', 'la porta era sempre chiusa'],
  ], 'toPastTense')
  // both verbs are found, and returned once
  const doc = nlp('ho sempre mangiato la pasta e lei beve acqua')
  const m = doc.verbs().toFutureTense()
  t.deepEqual(m.out('array'), ['mangerò', 'berrà'], here + 'split-compound return value')
  t.equal(doc.text(), 'mangerò sempre la pasta e lei berrà acqua', here + 'split-compound text')
  t.end()
})

test('contractions:', function (t) {
  // the elision is kept, before a vowel
  run(t, [
    ["c'è un gatto", "c'era un gatto"],
    ["C'è un gatto.", "C'era un gatto."],
    ["non c'è nessuno", "non c'era nessuno"],
    ["t'amo", "t'amavo"],
    ["ce l'ho", "ce l'avevo"],
    ["c'era una volta", "c'era una volta"],
    ["l'ho visto", "l'ho visto"],
  ], 'toPastTense')
  run(t, [
    ["c'era una volta", "c'è una volta"],
    ["C'era un gatto.", "C'è un gatto."],
    ["c'erano molti", 'ci sono molti'],
    ["t'amavo", "t'amo"],
  ], 'toPresentTense')
  // .. and written out in full, before a consonant
  run(t, [
    ["c'è un gatto", 'ci sarà un gatto'],
    ["C'è un gatto.", 'Ci sarà un gatto.'],
    ["non c'è nessuno", 'non ci sarà nessuno'],
    ["c'erano molti", 'ci saranno molti'],
    ["t'amo", "t'amerò"],
    ["ce l'ho", "ce l'avrò"],
  ], 'toFutureTense')
  // 'ci è' is always elided
  run(t, [
    ['ci sarà una festa', "c'è una festa"],
    ['Ci sarà una festa.', "C'è una festa."],
    ['non ci sarà nessuno', "non c'è nessuno"],
    ['ci sono molti gatti', 'ci sono molti gatti'],
  ], 'toPresentTense')
  run(t, [
    ['ci sarà una festa', "c'era una festa"],
    ['ci sono molti gatti', "c'erano molti gatti"],
  ], 'toPastTense')
  // the object-pronoun agrees with the participle
  run(t, [
    ["l'ho visto", 'lo vedo'],
    ["l'ho vista", 'la vedo'],
    ["l'ha mangiata", 'la mangia'],
    ["l'aveva detto", 'lo dice'],
    ["non l'ho mai visto", 'non lo vedo mai'],
    ["L'ho visto.", 'Lo vedo.'],
  ], 'toPresentTense')
  run(t, [
    ["l'ho visto", 'lo vedrò'],
    ["l'ho vista", 'la vedrò'],
    ["l'ha mangiata", 'la mangerà'],
    ["non l'ho mai visto", 'non lo vedrò mai'],
  ], 'toFutureTense')
  // a noun's article is not touched
  run(t, [["l'amico è qui", "l'amico era qui"]], 'toPastTense')
  run(t, [["l'amico è qui", "l'amico sarà qui"]], 'toFutureTense')

  // round-trips
  const arr = ["c'è un gatto", "non c'è nessuno", "C'è un gatto.", "t'amo", "ce l'ho"]
  arr.forEach(str => {
    const doc = nlp(str)
    doc.verbs().toFutureTense()
    doc.verbs().toPresentTense()
    t.equal(doc.text(), str, here + `future round-trip '${str}'`)
    doc.verbs().toPastTense()
    doc.verbs().toPresentTense()
    t.equal(doc.text(), str, here + `past round-trip '${str}'`)
  })
  // the new words are still matchable
  let doc = nlp("c'è un gatto")
  doc.verbs().toFutureTense()
  t.equal(doc.has('ci sarà un gatto'), true, here + 'expanded match')
  t.equal(doc.match('sarà').has('#FutureTense'), true, here + 'expanded tag')
  doc = nlp("c'è un gatto")
  doc.verbs().toPastTense()
  t.equal(doc.has('ci era un gatto'), true, here + 'elided match')
  t.equal(doc.has('#ImperfectVerb'), true, here + 'elided tag')
  t.equal(doc.has('#PresentTense'), false, here + 'elided old tag')
  t.end()
})

test('verbs the tagger used to miss:', function (t) {
  // a first-person verb after 'lo/la/le/gli' is not a noun
  run(t, [
    ['lo vedo', 'lo vedevo'],
    ['io lo vedo', 'io lo vedevo'],
    ['la conosco', 'la conoscevo'],
    ['gli parlo', 'gli parlavo'],
    ['non la mangio', 'non la mangiavo'],
    ['le canto una canzone', 'le cantavo una canzone'],
  ], 'toPastTense')
  run(t, [
    ['te lo dicevo', 'te lo dico'],
    ['la mangiavo', 'la mangio'],
    ['lo vedevi', 'lo vedi'],
  ], 'toPresentTense')
  run(t, [
    ['lo vedo', 'lo vedrò'],
    ['te lo dicevo', 'te lo dirò'],
    ['non la mangio', 'non la mangerò'],
  ], 'toFutureTense')
  t.end()
})
