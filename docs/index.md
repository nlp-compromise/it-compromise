# it-compromise

`it-compromise` è una libreria JavaScript per analizzare testo in italiano.

Divide il testo italiano in frasi e parole, e assegna a ogni parola un tag con la sua parte del discorso.
Si possono poi selezionare parti del documento, un po' come con un'espressione regolare, oppure trasformarle.

La libreria è abbastanza piccola da funzionare nel browser, funziona offline e non ha dipendenze.
È basata su regole ed è configurabile. Prende decisioni rapide e «abbastanza buone», senza usare un modello neurale.

È una versione italiana della [libreria inglese](https://github.com/spencermountain/compromise/) originale.

```bash
npm install it-compromise
```

```js
import nlp from 'it-compromise'

const doc = nlp('Lei vende conchiglie sulla spiaggia.')
doc.match('#Verbo').text() // 'vende'
```

oppure nel browser:

```html
<script src="https://unpkg.com/it-compromise"></script>
```

### Documentazione

- [Set di tag](./tagset.md)
- [Sintassi dei pattern](./match.md)
- [API](./api.md)
- [Contribuire](./contributing.md)

### Come funziona

Il testo viene diviso in una lista di frasi, ognuna delle quali è una lista di termini:

```
Sentence [
  Term { text: 'Lei', pre: '', post: ' ', normal: 'lei', tags: ['Noun', 'Pronoun'] },
  Term { text: 'vende', pre: '', post: ' ', normal: 'vende', tags: ['Verb', 'ThirdPerson', 'PresentTense'] },
  ...
]
```

- `text` è la parola così come è stata scritta
- `pre` e `post` sono gli spazi e la punteggiatura che la circondano
- `normal` è una versione ripulita, usata per le ricerche
- `tags` sono i suoi [tag grammaticali](./tagset.md)

Questi dati si ottengono con `.json()`:

```js
const doc = nlp('Lei vende conchiglie sulla spiaggia.')
doc.json()
// [{ terms: [{ text: 'Lei', tags: ['Noun', 'Pronoun'], ... }, ...] }]
```

### Selezionare

Per selezionare parti del documento, si usa `.match()`:

```js
const doc = nlp('Lei vende conchiglie sulla spiaggia.')
const m = doc.match('#Pronome vende .')
m.text() // 'Lei vende conchiglie'
m.json() // [{ text: 'Lei vende conchiglie', terms: [...] }]

doc.has('#Verbo #Nome') // true
doc.match('#Nome').out('array') // ['Lei', 'conchiglie', 'spiaggia.']
```

Vedi la [sintassi dei pattern](./match.md) per tutto quello che un pattern può fare, e il [set di tag](./tagset.md) per l'elenco dei tag supportati.

### Trasformare

Le parti del documento si possono trasformare, e la modifica si applica al documento originale:

```js
const doc = nlp('Lei vende conchiglie sulla spiaggia.')
doc.match('conchiglie').replaceWith('costumi da bagno')
doc.text() // 'Lei vende costumi da bagno sulla spiaggia.'
```

Ci sono anche selezioni già pronte, come `.verbs()`, `.nouns()` e `.numbers()`, che hanno metodi propri, come `.conjugate()` o `.add()`:

```js
const doc = nlp('Lei vende conchiglie sulla spiaggia.')
doc.nouns().length // 3 ('Lei', 'conchiglie', 'spiaggia')
doc.nouns().isPlural().text() // 'conchiglie'
doc.match('conchiglie').nouns().conjugate()
// [{ plural: 'conchiglie', singular: 'conchiglia' }]

const doc2 = nlp('Ho quaranta euro.')
doc2.numbers().add(10)
doc2.text() // 'Ho cinquanta euro.'
```

Queste selezioni cambiano da una lingua all'altra. Vedi l'[API](./api.md) per quelle di questa libreria.

### Da sapere

**Ogni metodo restituisce una vista.** Una vista è una selezione di termini nel documento. `nlp(testo)` è una vista dell'intero documento, e `.match()` ne restituisce una più piccola. Quasi tutti i metodi restituiscono una vista, quindi si possono concatenare. Con `.all()` si torna all'intero documento.

**Le trasformazioni modificano il documento stesso.** La vista restituita da una trasformazione contiene solo la selezione, quindi il risultato va letto dal documento originale:

```js
const doc = nlp('Lei vende conchiglie sulla spiaggia.')
doc.match('conchiglie').replaceWith('sassolini').text() // 'sassolini' (solo la selezione)
doc.text() // 'Lei vende sassolini sulla spiaggia.'
```

Per non toccare l'originale, si lavora su una copia con `.clone()`:

```js
const doc = nlp('Lei vende conchiglie sulla spiaggia.')
const copia = doc.clone()
copia.match('conchiglie').remove()
copia.text() // 'Lei vende sulla spiaggia.'
doc.text() // 'Lei vende conchiglie sulla spiaggia.'
```

**Un pattern non attraversa le frasi.**

```js
nlp('Questo è tutto. Ritorno a Winnipeg!').has('tutto ritorno') // false
```

**Un tag sconosciuto non trova nulla, senza dare errore.** Se una ricerca torna vuota, controlla il tag nel [set di tag](./tagset.md), e usa `doc.debug()` per vedere i tag assegnati a ogni parola.

### Configurazione

Se una parola ha il tag sbagliato, o manca, la puoi fornire tu:

```js
// per un solo documento
nlp('kermit ha salutato', { kermit: 'NomeDiBattesimo' }).match('#NomeDiBattesimo').text() // 'kermit'

// per tutti i documenti
nlp.addWords({ kermit: 'NomeDiBattesimo' })
```

I tag devono venire dal [set di tag](./tagset.md), oppure essere aggiunti con `nlp.addTags()`.

Un plugin può aggiungere insieme parole, tag e nuovi metodi:

```js
nlp.plugin({
  words: { kermit: 'NomeDiBattesimo' },
  tags: { Muppet: { isA: 'Persona' } },
  api: (View) => {
    View.prototype.esclama = function () {
      return this.post('!')
    }
  }
})

const doc = nlp('ciao a tutti')
doc.match('tutti').esclama()
doc.text() // 'ciao a tutti!'
```
