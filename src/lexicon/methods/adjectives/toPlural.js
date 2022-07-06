const toPlural = function (str) {
  str = str.replace(/o$/, 'i')//rosso->rossi
  str = str.replace(/e$/, 'i')//triste -> tristi
  str = str.replace(/a$/, 'e')//nera -> nere
  return str
}
export default toPlural