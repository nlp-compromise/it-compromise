// words that end in a period, but don't end a sentence - 'Dr.'
// (these replace the english abbreviations, which collide with real words here)
const toObj = str => Object.fromEntries(str.trim().split(/\s+/).map(w => [w, true]))

export default toObj(`
  sig sigg dott dr prof proff avv ing arch geom rag on sen gen col cap ten mons
  spett egr gent ill
  l'avv l'ing l'on l'arch l'art l’avv l’ing l’on l’arch l’art l'univ l’univ
  kg km cm mm ml min
  vs ed cfr univ pag pagg art artt nn num vol voll fig tab sez lett par es tel ca ecc etc
  lun merc gio ven sab
  feb apr giu lug sett ott nov dic
`)
