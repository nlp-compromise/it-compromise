// abbreviations, and the other language-specific parts of the sentence-parser
// (these replace the english abbreviations, which collide with real words here)
const toObj = str => Object.fromEntries(str.trim().split(/\s+/).map(w => [w, true]))

export default {
  // these go before a name, a number or a letter ('Dr. X', 'fig. A'), and never end a sentence
  titles: toObj(`
    sig sigg dott dr prof proff avv ing arch geom rag on sen gen col cap ten mons
    spett egr gent ill
    vs ed cfr univ p v
    pag pagg art artt n nn num vol voll fig tab sez lett par
  `),
  // these end a sentence, when a capital comes next
  abbreviations: toObj(`
    es tel ca ecc etc
    lun merc gio ven sab
    feb apr giu lug sett ott nov dic
  `),
  // 'ago' is a real word - 'ho un ago.'
  conditional: /\d (?:ago|mar)\. *$/i,
  // longer ones, that end a sentence when a capital comes next
  enders: ['[ad]\\.C', 'S\\.p\\.A', 'S\\.r\\.l', '[ap]\\.m'],
  // '5 kg.'
  units: ['kg', 'km', 'cm', 'mm', 'ml', 'g', 'm', 'l', 'h', 'min'],
  // words that begin a new sentence, and are never a name - 'Habla con el Dr. Él sabe.'
  starters: `Lui Lei Loro Io Tu Noi Voi Poi Dopo Allora Ma No Sì Era Fu Sono Ha Ho Non
    Suo Sua Mio Mia Mi Si Nessuno Niente Tutto Tutti
    Oggi Ieri Domani Ora Adesso Qui Qua Anche Quando Se Come Che Chi Dove Per`.split(/\s+/),
  quotes: [['«', '»'], ['“', '”'], ['"', '"'], ['(', ')']],
  ellipsis: true,
}
