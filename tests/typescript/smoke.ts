// Compile-time consumer test. This file is never executed.
import nlp from 'it-compromise'

const doc = nlp('venticinque libri')
const text: string = doc.text()
const nouns = doc.match('#Noun')
nouns.tag('Checked').out('array')

const tokens = nlp.tokenize('un testo breve')
const version: string = nlp.version

// @ts-expect-error input text must be a string
nlp(25)

export { nouns, text, tokens, version }
