# API

`it-compromise` è costruito sulla libreria inglese [compromise](https://github.com/spencermountain/compromise/), e ne condivide i metodi di base. Funzionano allo stesso modo in tutte le lingue.

Quasi tutti i metodi restituiscono una nuova **vista** (una selezione del documento), quindi si possono concatenare:

```js
nlp(testo).match('#Nome').first().text()
```

I metodi che accettano un `match` usano la [sintassi dei pattern](./match.md).

## Metodi di base

_(disponibili su ogni vista)_

### Utilità

- **`.found`** _[getter]_ — questa vista contiene qualcosa?
- **`.docs`** _[getter]_ — la lista degli oggetti termine di questa vista
- **`.document`** _[getter]_ — l'intero testo analizzato
- **`.pointer`** _[getter]_ — gli indici della vista corrente
- **`.fullPointer`** _[getter]_ — gli indici espliciti della vista corrente
- **`.methods`** _[getter]_ — accesso ai metodi interni della libreria
- **`.model`** _[getter]_ — accesso ai dati interni della libreria
- **`.hooks`** _[getter]_ — quali metodi compute vengono eseguiti in automatico
- **`.isView`** _[getter]_ — permette di riconoscere un oggetto compromise
- **`.length`** _[getter]_ — il numero di risultati nella vista
- **`.update(pointer)`** — crea una nuova vista, a partire da questo documento
- **`.toView(pointer)`** — trasforma una vista Verb o Noun in una vista normale
- **`.fromText(text)`** — crea un nuovo documento
- **`.termList()`** — alias di .docs
- **`.compute(method)`** — esegue un'operazione con nome sul documento
- **`.clone(shallow?)`** — copia il documento in profondità, senza lasciare riferimenti

### Cicli

- **`.forEach(fn)`** — esegue una funzione su ogni risultato, come documento a sé
- **`.map(fn, emptyResult?)`** — passa ogni risultato a una funzione, e crea un nuovo documento
- **`.filter(fn)`** — tiene solo i risultati per cui la funzione restituisce true
- **`.find(fn)`** — restituisce un documento con solo il primo risultato che corrisponde
- **`.some(fn)`** — restituisce true se almeno un risultato corrisponde
- **`.random(n?)`** — estrae a caso una parte dei risultati

### Accesso

- **`.terms(n?)`** — divide i risultati in singoli termini
- **`.groups(name?)`** — recupera un gruppo di cattura con nome
- **`.eq(n)`** — usa solo l'n-esimo risultato
- **`.first(n?)`** — usa solo il primo o i primi risultati
- **`.last(n?)`** — usa solo l'ultimo o gli ultimi risultati
- **`.firstTerms()`** — la prima parola di ogni risultato
- **`.lastTerms()`** — l'ultima parola di ogni risultato
- **`.slice(start, end?)`** — prende una parte dei risultati
- **`.all()`** — restituisce l'intero documento originale («zoom indietro»)
- **`.fullSentences()`** — restituisce la frase originale completa di ogni risultato
- **`.none()`** — restituisce una vista vuota
- **`.isDoc(view?)`** — queste due viste sono dello stesso documento?
- **`.wordCount()`** — conta il numero di termini

### Ricerca

- **`.match(match, group?, options?)`** — restituisce le parti del documento che corrispondono al pattern
- **`.matchOne(match, group?, options?)`** — restituisce solo il primo risultato
- **`.has(match, group?, options?)`** — restituisce true o false: questo pattern è presente?
- **`.if(match, group?, options?)`** — tiene solo i risultati che contengono questo pattern
- **`.ifNo(match, group?, options?)`** — scarta i risultati che contengono questo pattern
- **`.before(match, group?, options?)`** — restituisce i termini prima di ogni risultato
- **`.after(match, group?, options?)`** — restituisce i termini dopo ogni risultato
- **`.lookBehind(match, group?, options?)`** — alias di .before()
- **`.lookBefore(match, group?, options?)`** — alias di .before()
- **`.lookAhead(match, group?, options?)`** — alias di .after()
- **`.lookAfter(match, group?, options?)`** — alias di .after()
- **`.growLeft(match, group?, options?)`** — aggiunge alla vista i termini corrispondenti subito prima
- **`.growRight(match, group?, options?)`** — aggiunge alla vista i termini corrispondenti subito dopo
- **`.grow(match, group?, options?)`** — estende la vista con i termini corrispondenti a sinistra o a destra
- **`.sweep(match, opts?)`** — applica al documento una serie di pattern compilati
- **`.splitOn(match?, group?)`** — divide il risultato in tre parti: prima, il pattern, e dopo
- **`.splitBefore(match?, group?)`** — divide subito prima di ogni pattern trovato
- **`.splitAfter(match?, group?)`** — divide subito dopo ogni pattern trovato
- **`.split(match?, group?)`** — alias di .splitAfter()

### Maiuscole e minuscole

- **`.toLowerCase()`** — mette tutte le lettere in minuscolo
- **`.toUpperCase()`** — mette tutte le lettere in maiuscolo
- **`.toTitleCase()`** — mette in maiuscolo la prima lettera di ogni termine
- **`.toCamelCase()`** — toglie gli spazi e mette la maiuscola a ogni termine

### Inserimento

- **`.concat(input)`** — aggiunge questi elementi alla fine
- **`.insertBefore(input)`** — aggiunge queste parole prima di ogni risultato
- **`.prepend(input)`** — alias di .insertBefore()
- **`.insertAfter(text)`** — aggiunge queste parole dopo ogni risultato
- **`.append(text)`** — alias di .insertAfter()
- **`.insert(text)`** — alias di .insertAfter()
- **`.remove(match)`** — rimuove del tutto questi termini dal documento
- **`.delete(match)`** — alias di .remove()
- **`.replace(from, to?, keep?)`** — cerca un pattern e lo sostituisce con un nuovo contenuto
- **`.replaceWith(to, keep?)`** — sostituisce la selezione con un nuovo contenuto
- **`.unique()`** — rimuove i risultati duplicati
- **`.reverse()`** — inverte l'ordine dei risultati, ma non quello delle parole
- **`.sort(method?)`** — riordina i risultati (sul posto)
<!-- - **`.normalize(options?)`** — ripulisce vari aspetti delle parole -->

### Spazi e punteggiatura

- **`.pre(str?, concat?)`** — aggiunge questa punteggiatura o questo spazio prima di ogni risultato
- **`.post(str?, concat?)`** — aggiunge questa punteggiatura o questo spazio dopo ogni risultato
- **`.trim()`** — rimuove gli spazi all'inizio e alla fine
- **`.hyphenate()`** — unisce le parole con un trattino, e toglie gli spazi
- **`.dehyphenate()`** — toglie i trattini tra le parole, e rimette gli spazi
- **`.deHyphenate()`** — alias di .dehyphenate()
- **`.toQuotations(start?, end?)`** — mette le selezioni tra virgolette
- **`.toQuotation(start?, end?)`** — alias di .toQuotations()
- **`.toParentheses(start?, end?)`** — mette le selezioni tra parentesi

### Output

- **`.text(options?)`** — restituisce il documento come testo
- **`.json(options?)`** — restituisce i metadati desiderati del documento
- **`.debug()`** — stampa in modo leggibile il documento corrente e i suoi tag
- **`.out(format?)`** — alcuni formati di output con nome
- **`.html(toHighlight)`** — produce una stringa html, con dei tag attorno ai pattern trovati
- **`.wrap(matches)`** — produce un output personalizzato attorno ai pattern trovati

### Puntatori

- **`.union(match)`** — restituisce tutti i risultati, senza duplicati
- **`.and(match)`** — alias di .union()
- **`.intersection(match)`** — restituisce solo i risultati in comune
- **`.not(match, options?)`** — restituisce tutti i risultati tranne questo
- **`.difference(match, options?)`** — alias di .not()
- **`.complement(match)`** — restituisce tutto ciò che non è nei risultati
- **`.settle(match)`** — rimuove le sovrapposizioni tra i risultati

### Tag

- **`.tag(tag, reason?)`** — assegna questo tag a tutti i termini
- **`.tagSafe(tag, reason?)`** — assegna il tag solo se è compatibile con i tag attuali
- **`.unTag(tag, reason?)`** — toglie questo tag dai termini
- **`.canBe(tag)`** — restituisce solo i termini che possono avere questo tag

### Cache

- **`.cache(options?)`** — congela lo stato attuale del documento, per guadagnare velocità
- **`.uncache(options?)`** — sblocca lo stato del documento, così che possa essere trasformato
- **`.freeze()`** — impedisce che i tag attuali vengano rimossi
- **`.unfreeze()`** — permette di modificare i tag attuali [predefinito]

### Liste di parole

- **`.lookup(trie, opts?)`** — ricerca rapida di una lista di parole
- **`.autoFill()`** — completa gli inizi di parola, in base al dizionario di completamento automatico

<!--
## Metodi del tagger

- **`.confidence()`** — misura media della sicurezza dei tag
- **`.swap(fromLemma, toLemma, guardTag?)`** — sostituisce in modo intelligente le forme di una radice
-->

## Selezioni

Le selezioni sono ricerche già pronte, come `.verbs()` o `.numbers()`, che restituiscono una vista con metodi aggiuntivi propri.
Sono scritte per ogni lingua: quelle disponibili qui non sono le stesse dell'inglese.

### `.nouns()`

- **`.nouns()`** — restituisce i nomi del documento
- **`.nouns().conjugate()`** — dà il singolare e il plurale di ogni nome
- **`.nouns().isPlural()`** — restituisce solo i nomi al plurale
- **`.nouns().toPlural()`** — mette i nomi al plurale
- **`.nouns().toSingular()`** — mette i nomi al singolare

### `.verbs()`

- **`.verbs()`** — restituisce i verbi del documento
- **`.verbs().conjugate()`** — dà tutte le coniugazioni di ogni verbo

### `.adjectives()`

- **`.adjectives()`** — restituisce gli aggettivi del documento
- **`.adjectives().conjugate()`** — dà il maschile, il femminile e i plurali di ogni aggettivo

### `.numbers()`

- **`.numbers()`** — restituisce i numeri, scritti in cifre o in lettere
- **`.values()`** — alias di .numbers()
- **`.numbers().get()`** — restituisce il valore numerico di ogni numero
- **`.numbers().units()`** — restituisce l'unità che segue ogni numero
- **`.numbers().toNumber()`** — scrive i numeri in cifre (`40`)
- **`.numbers().toText()`** — scrive i numeri in lettere (`quaranta`)
- **`.numbers().toCardinal()`** — trasforma in numero cardinale (`quaranta`)
- **`.numbers().toOrdinal()`** — trasforma in numero ordinale (`quarantesimo`)
- **`.numbers().isCardinal()`** — restituisce solo i numeri cardinali
- **`.numbers().isOrdinal()`** — restituisce solo i numeri ordinali
- **`.numbers().isEqual(n)`** — restituisce solo i numeri uguali a n
- **`.numbers().greaterThan(n)`** — restituisce solo i numeri maggiori di n
- **`.numbers().lessThan(n)`** — restituisce solo i numeri minori di n
- **`.numbers().between(min, max)`** — restituisce solo i numeri compresi tra min e max
- **`.numbers().json(n?)`** — restituisce i metadati di ogni numero (o solo dell'n-esimo), con il valore interpretato
- **`.numbers().set(n)`** — sostituisce ogni numero con n, dato come numero o come testo (`8`, `'8'`, `'otto'`)
- **`.numbers().add(n)`** — aggiunge n a ogni numero (numero o testo)
- **`.numbers().subtract(n)`** — sottrae n da ogni numero (numero o testo)
- **`.numbers().increment()`** — aggiunge 1 a ogni numero
- **`.numbers().decrement()`** — sottrae 1 da ogni numero

### `.contractions()`

- **`.contractions()`** — restituisce le forme contratte o elise, come «l'amico» o «c'è»
- **`.contractions().expand()`** — le scrive per esteso: «c'è» → «ci è», «l'amico» → «lo amico», «dell'amico» → «di lo amico». L'articolo eliso diventa sempre «lo», senza accordo di genere; le preposizioni articolate senza apostrofo («della», «nel») non vengono toccate

## Metodi del costruttore

_(chiamati sull'oggetto `nlp` importato, non su una vista)_

- **`nlp.tokenize(text, lexicon?)`** — analizza il testo senza eseguire il tagger
- **`nlp.plugin(plugin)`** — aggiunge un plugin di compromise
- **`nlp.extend(plugin)`** — alias di nlp.plugin()
- **`nlp.addWords(words, isFrozen?)`** — aggiunge nuove parole al lessico interno
- **`nlp.addTags(tags)`** — aggiunge nuovi tag al set di tag
- **`nlp.parseMatch(match, opts?)`** — trasforma un pattern in json
- **`nlp.buildNet(matches)`** — compila un insieme di pattern in una forma più veloce, per .sweep()
- **`nlp.buildTrie(words)`** — compila una lista di parole in una forma più veloce, per .lookup()
- **`nlp.typeahead(words)`** — aggiunge parole al dizionario di completamento automatico
- **`nlp.world()`** — accesso ai dati interni della libreria
- **`nlp.model()`** — accesso ai dati linguistici della libreria
- **`nlp.methods()`** — accesso ai metodi interni della libreria
- **`nlp.hooks()`** — quali funzioni compute vengono eseguite in automatico
- **`nlp.verbose(toLog?)`** — stampa le decisioni del tagger, per il debug
- **`nlp.version`** — la versione semver della libreria
