// -o, the ending changes to –i in the plural.
// -a, the ending changes to –e in the plural.
// -e, the ending changes to –i in the plural.
// -ca, the ending changes to –che in the plural. 
// -ga, the ending changes to -ghe in the plural.
let rules = [
  ['ca', 'che'],
  ['ga', 'ghe'],
  ['e', 'i'],
  ['a', 'e'],
  ['o', 'i'],
]
const fromPlural = function (str) {
  return str
}
const toPlural = function (str) {
  return str
}
export { fromPlural, toPlural }