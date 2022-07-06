const toRoot = function (str) {
  str = str.replace(/a$/, 'o')//to male
  str = str.replace(/e$/, 'a')//nere -> nera
  str = str.replace(/i$/, 'o')//rosso->rossi
  // str = str.replace(/e$/, 'i')//triste -> tristi
  return str
}
export default toRoot