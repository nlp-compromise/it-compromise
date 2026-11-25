// rule-based noun inflection - the suffix-model only knows what is in its data

// [singular, plural]
const pairs = [
  ['uomo', 'uomini'],
  ['dio', 'dei'],
  ['bue', 'buoi'],
  ['tempio', 'templi'],
  ['moglie', 'mogli'],
  ['superficie', 'superfici'],
  // feminine, but not '-e'
  ['mano', 'mani'],
  ['ala', 'ali'],
  ['arma', 'armi'],
  // masculine singular, feminine '-a' plural
  ['dito', 'dita'],
  ['uovo', 'uova'],
  ['braccio', 'braccia'],
  ['labbro', 'labbra'],
  ['ginocchio', 'ginocchia'],
  ['sopracciglio', 'sopracciglia'],
  ['ciglio', 'ciglia'],
  ['lenzuolo', 'lenzuola'],
  ['osso', 'ossa'],
  ['paio', 'paia'],
  ['miglio', 'miglia'],
  ['centinaio', 'centinaia'],
  ['migliaio', 'migliaia'],
  // masculine '-ga', without the 'h'
  ['belga', 'belgi'],
]
const irregular = { toPlural: {}, fromPlural: {} }
pairs.forEach(a => {
  irregular.toPlural[a[0]] = a[1]
  irregular.fromPlural[a[1]] = a[0]
})
// both plurals are used - 'i ginocchi', 'gli ossi'
Object.assign(irregular.fromPlural, { ginocchi: 'ginocchio', ossi: 'osso', bracci: 'braccio', cigli: 'ciglio' })

// truncations, and other nouns that never change
const same = new Set([
  'foto', 'auto', 'moto', 'radio', 'cinema', 'video', 'stereo', 'frigo', 'euro', 'zoo',
  'serie', 'specie', 'carie', 'barbarie', 'progenie',
  'gorilla', 'boia', 'vaglia', 'sosia', 'koala', 'panda'
])

// loanwords, stressed endings, '-i' nouns and monosyllables - 'film', 'città', 'crisi', 're'
const isInvariable = function (str) {
  if (same.has(str)) {
    return true
  }
  if (!/[aeio]$/.test(str)) {
    return true
  }
  // 're', 'gru', 'sci'
  return /^[^aeiouàèéìòù]*[aeiou]$/.test(str)
}

// masculine nouns in '-a' - mostly greek
const maleSuffix =
  /([iy]sta|gramma|dramma|framma|emma|ema|oma|sma|gma|iatra|[nirg]arca|cida|nauta|crata|peuta)$/
const maleWords = new Set([
  'amalgama', 'clima', 'coma', 'comma', 'enzima', 'pachiderma', 'panorama', 'pigiama', 'proclama', 'sperma', 'trauma',
  'tema', 'schema', 'idioma', 'assioma', 'plasma',
  'poeta', 'profeta', 'atleta', 'pianeta', 'asceta', 'esteta', 'esegeta', 'apologeta', 'analfabeta',
  'pilota', 'copilota', 'patriota', 'compatriota', 'despota', 'idiota',
  'eremita', 'israelita', 'metabolita', 'metropolita', 'neofita', 'ovocita', 'parassita', 'gesuita',
  'acrobata', 'pirata', 'cineasta', 'entusiasta', 'ginnasta', 'pederasta',
  'papa', 'duca', 'granduca', 'collega', 'stratega', 'geometra', 'scriba', 'transfuga', 'monarca'
])
const femaleWords = new Set(['pista', 'lista', 'vista', 'rivista', 'conquista', 'intervista', 'svista', 'provvista', 'asma', 'crema', 'gemma', 'flemma', 'maremma', 'soma', 'chioma'])

// greek feminine nouns in '-i' never change - 'le crisi', 'le analisi'
const greekI = /(crisi|lisi|^tesi|ipotesi|sintesi|protesi|parentesi|gnosi|genesi|oasi|enfasi|opoli)$/

// is this '-a' noun masculine? - gender is 'm', 'f' or undefined
const isMaleA = function (str, gender) {
  if (femaleWords.has(str)) {
    return false
  }
  // 'la turista' -> 'le turiste'
  if (gender === 'f' && str.endsWith('ista')) {
    return false
  }
  return gender === 'm' || maleWords.has(str) || maleSuffix.test(str) || /^(vice)?capo./.test(str)
}

// 'ragazza' -> 'ragazze'
const femalePlural = function (str) {
  // 'banca' -> 'banche'
  if (/[cg]a$/.test(str)) {
    return str.replace(/a$/, 'he')
  }
  // 'arancia' -> 'arance', but stressed 'allergia' -> 'allergie'
  if (/[^aeiour][cg]ia$/.test(str) || /rcia$/.test(str)) {
    return str.replace(/ia$/, 'e')
  }
  return str.replace(/a$/, 'e')
}

// 'ragazze' -> 'ragazza'
const fromFemalePlural = function (str) {
  // 'banche' -> 'banca'
  if (/[cg]he$/.test(str)) {
    return str.replace(/he$/, 'a')
  }
  // 'arance' -> 'arancia'
  if (/[cg]e$/.test(str)) {
    return str.replace(/e$/, 'ia')
  }
  return str.replace(/e$/, 'a')
}

// 'poeta' -> 'poeti', 'collega' -> 'colleghi'
const malePlural = function (str) {
  if (/[cg]a$/.test(str)) {
    return str.replace(/a$/, 'hi')
  }
  return str.replace(/a$/, 'i')
}

export { greekI, irregular, isInvariable, isMaleA, femalePlural, fromFemalePlural, malePlural }
