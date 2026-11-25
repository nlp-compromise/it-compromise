// an audit of common nouns, in every plural class - used by singular-audit.test.js, and tests/_hmm/noun-audit.hmm.js
// gender | singular / plural
//  - 'mf' is a masculine singular with a feminine plural
//  - '?' means the bare word is ambiguous without its article - 'i parti' or 'le parti', 'il turista' or 'la turista'
//  - '*' means the tagger does not see a noun in this phrase, yet - these are tested in tests/_hmm
const list = `
m il libro / i libri
m il ragazzo / i ragazzi
m il gatto / i gatti
m il tavolo / i tavoli
m il treno / i treni
m il giorno / i giorni
m l'anno / gli anni
m il bambino / i bambini
m il letto / i letti
m il vino / i vini
m il piatto / i piatti
m il prezzo / i prezzi
m il mondo / i mondi
m il lavoro / i lavori
m il posto / i posti
m il momento / i momenti
m il gruppo / i gruppi
m il numero / i numeri
m il governo / i governi
m il secolo / i secoli
m il teatro / i teatri
m il museo / i musei
m il cavallo / i cavalli
m il fratello / i fratelli
m il coltello / i coltelli
m il vestito / i vestiti
m il biglietto / i biglietti
m il regalo / i regali
m il soldato / i soldati
m il naso / i nasi
m l'albero / gli alberi
m l'aereo / gli aerei
m l'uccello / gli uccelli
m lo zaino / gli zaini
m il sogno / i sogni
m il corpo / i corpi
m il muro / i muri
m il pomodoro / i pomodori
m il tesoro / i tesori
m il motivo / i motivi
m il cielo / i cieli
m il topo / i topi
m il lupo / i lupi
m il nonno / i nonni
m il marito / i mariti
m il palazzo / i palazzi
m il quadro / i quadri
m il campo / i campi
m il minuto / i minuti
m il suono / i suoni
m il popolo / i popoli
m il ricordo / i ricordi
m il pensiero / i pensieri
m il bagno / i bagni
m il giardino / i giardini
m il telefono / i telefoni
m lo scherzo / gli scherzi
m lo sguardo / gli sguardi
m il ramo / i rami
m l'atomo / gli atomi
m il sintomo / i sintomi
m il grammo / i grammi
m il chilogrammo / i chilogrammi
m l'organismo / gli organismi
m il meccanismo / i meccanismi
m l'acquisto / gli acquisti
f la casa / le case
f la ragazza / le ragazze
f la donna / le donne
f la scuola / le scuole
f la strada / le strade
f la porta / le porte
f la finestra / le finestre
f la sedia / le sedie
f la lettera / le lettere
f la parola / le parole
f la penna / le penne
f la macchina / le macchine
f la settimana / le settimane
f la sera / le sere
f l'ora / le ore
f la persona / le persone
f la famiglia / le famiglie
f la storia / le storie
f la sorella / le sorelle
f la figlia / le figlie
f la zia / le zie
f la cucina / le cucine
f la camera / le camere
f la chiesa / le chiese
f la piazza / le piazze
f la montagna / le montagne
f l'isola / le isole
f la stella / le stelle
f la testa / le teste
f la gamba / le gambe
f la spalla / le spalle
f la mela / le mele
f la birra / le birre
f la carta / le carte
f la domanda / le domande
f la risposta / le risposte
f l'idea / le idee
f l'azienda / le aziende
f l'erba / le erbe
f la guerra / le guerre
f la terra / le terre
f la vita / le vite
f la malattia / le malattie
f la rosa / le rose
f la scarpa / le scarpe
f la borsa / le borse
f la squadra / le squadre
f la lingua / le lingue
f l'acqua / le acque
f la pizza / le pizze
m il cane / i cani
m il padre / i padri
m il fiore / i fiori
m il mare / i mari
m il nome / i nomi
m il paese / i paesi
m il mese / i mesi
m il fiume / i fiumi
m il ponte / i ponti
m il pane / i pani
m il pesce / i pesci
m il sole / i soli
m il piede / i piedi
m il dente / i denti
m il cuore / i cuori
m il colore / i colori
m il dottore / i dottori
m il professore / i professori
m lo studente / gli studenti
m il cameriere / i camerieri
m il giornale / i giornali
m l'animale / gli animali
m l'ospedale / gli ospedali
m il canale / i canali
m il fucile / i fucili
m il ristorante / i ristoranti
m il cantante / i cantanti
m l'insegnante / gli insegnanti
m il presidente / i presidenti
m il cliente / i clienti
m il parente / i parenti
m l'attore / gli attori
m lo scrittore / gli scrittori
m il direttore / i direttori
m il motore / i motori
m il signore / i signori
m l'errore / gli errori
m il valore / i valori
m il leone / i leoni
m il limone / i limoni
m il bicchiere / i bicchieri
m il carabiniere / i carabinieri
m il confine / i confini
m il monte / i monti
m il generale / i generali
m il maiale / i maiali
m il giovane / i giovani
m il nipote / i nipoti
m l'elefante / gli elefanti
m il serpente / i serpenti
m il continente / i continenti
m l'incidente / gli incidenti
m l'ambiente / gli ambienti
m il sapone / i saponi
m il cognome / i cognomi
m il pallone / i palloni
m il campione / i campioni
m il padrone / i padroni
m il bastone / i bastoni
m il rumore / i rumori
m l'odore / gli odori
m il sapore / i sapori
m l'esame / gli esami
m l'ospite / gli ospiti
m l'abitante / gli abitanti
m il comandante / i comandanti
f la chiave / le chiavi
f la notte / le notti
f la madre / le madri
f la nave / le navi
f la neve / le nevi
f la luce / le luci
f la voce / le voci
f la croce / le croci
f la carne / le carni
f la classe / le classi
f la legge / le leggi
f la morte / le morti ?
f la parte / le parti ?
f l'arte / le arti ?
f la mente / le menti ?
f la gente / le genti
f la torre / le torri
f la volpe / le volpi
f l'ape / le api
f la tigre / le tigri
f la lezione / le lezioni
f la stazione / le stazioni
f la nazione / le nazioni
f la regione / le regioni
f la ragione / le ragioni
f la stagione / le stagioni
f la televisione / le televisioni
f l'opinione / le opinioni
f la canzone / le canzoni
f la prigione / le prigioni
f la decisione / le decisioni
f l'unione / le unioni
f la passione / le passioni
f l'attrice / le attrici
f la scrittrice / le scrittrici
f la radice / le radici
f la cornice / le cornici
f l'abitudine / le abitudini
f l'origine / le origini
f l'immagine / le immagini
f la base / le basi
f la fase / le fasi
f la frase / le frasi
f la febbre / le febbri
f la polvere / le polveri
f la pelle / le pelli
f la valle / le valli ?
f la corte / le corti ?
f la fonte / le fonti
f la rete / le reti
f la parete / le pareti
f la nube / le nubi
f la capitale / le capitali
f la lente / le lenti ?
f la corrente / le correnti
f la sorgente / le sorgenti
f l'estate / le estati
f la botte / le botti ?
f la lite / le liti
f la fine / le fini
f la vocale / le vocali
f la moglie / le mogli
f la superficie / le superfici
f l'effigie / le effigi
f la cantante / le cantanti
f l'insegnante / le insegnanti
f la nipote / le nipoti
m il banco / i banchi
m il fuoco / i fuochi
m il gioco / i giochi
m il cuoco / i cuochi
m il parco / i parchi
m il bosco / i boschi
m il disco / i dischi
m il tedesco / i tedeschi
m il pacco / i pacchi
m il sacco / i sacchi
m il buco / i buchi
m il fico / i fichi
m l'arco / gli archi
m il palco / i palchi
m il turco / i turchi
m il fianco / i fianchi
m il tronco / i tronchi
m il succo / i succhi
m il tacco / i tacchi
m il trucco / i trucchi
m lo scacco / gli scacchi
m il baco / i bachi
m il cieco / i ciechi
m il carico / i carichi
m l'incarico / gli incarichi
m il valico / i valichi
m il lago / i laghi
m l'albergo / gli alberghi
m il luogo / i luoghi
m il fungo / i funghi
m l'ago / gli aghi
m il drago / i draghi
m il mago / i maghi
m il sugo / i sughi
m lo spago / gli spaghi
m il castigo / i castighi
m l'obbligo / gli obblighi
m il dialogo / i dialoghi
m il catalogo / i cataloghi
m il prologo / i prologhi
m il monologo / i monologhi
m l'epilogo / gli epiloghi
m l'amico / gli amici
m il nemico / i nemici
m il medico / i medici
m il greco / i greci
m il porco / i porci
m il meccanico / i meccanici
m il sindaco / i sindaci
m il monaco / i monaci
m il politico / i politici
m il critico / i critici
m il tecnico / i tecnici
m il fisico / i fisici
m il chimico / i chimici
m il matematico / i matematici
m il classico / i classici
m il comico / i comici
m lo storico / gli storici
m il cattolico / i cattolici
m il portico / i portici
m il parroco / i parroci
m l'equivoco / gli equivoci
m il farmaco / i farmaci
m l'austriaco / gli austriaci
m il maniaco / i maniaci
m il traffico / i traffici
m il mosaico / i mosaici
m l'antibiotico / gli antibiotici
m l'asparago / gli asparagi
m lo psicologo / gli psicologi
m il biologo / i biologi
m il teologo / i teologi
m il sociologo / i sociologi
m il cardiologo / i cardiologi
m l'archeologo / gli archeologi
m il geologo / i geologi
m l'astrologo / gli astrologi
f l'amica / le amiche
f la banca / le banche
f la barca / le barche
f la mucca / le mucche
f l'oca / le oche
f la bocca / le bocche
f la tasca / le tasche
f la giacca / le giacche
f la domenica / le domeniche
f la fabbrica / le fabbriche
f la musica / le musiche
f la formica / le formiche
f la fatica / le fatiche
f la ricerca / le ricerche
f la tecnica / le tecniche
f la politica / le politiche
f la basilica / le basiliche
f la biblioteca / le biblioteche
f la discoteca / le discoteche
f la bistecca / le bistecche
f la pesca / le pesche
f la mosca / le mosche
f la vasca / le vasche
f la paga / le paghe
f la riga / le righe
f la bottega / le botteghe
f la strega / le streghe
f la droga / le droghe
f la lega / le leghe
f la piaga / le piaghe
f la targa / le targhe
f la spiga / le spighe
f la collega / le colleghe ?
m il collega / i colleghi
m il duca / i duchi
m il monarca / i monarchi
m il patriarca / i patriarchi
f l'arancia / le arance
f la faccia / le facce
f la pioggia / le piogge
f la spiaggia / le spiagge
f la freccia / le frecce
f la roccia / le rocce
f la doccia / le docce
f la buccia / le bucce
f la goccia / le gocce
f la guancia / le guance
f la provincia / le province
f la treccia / le trecce
f la caccia / le cacce
f la traccia / le tracce
f la quercia / le querce
f la torcia / le torce
f la mancia / le mance
f la pancia / le pance
f la lancia / le lance
f la bilancia / le bilance
f la pronuncia / le pronunce
f la denuncia / le denunce
f la striscia / le strisce
f la fascia / le fasce
f l'ascia / le asce
f la coscia / le cosce
f la frangia / le frange
f la loggia / le logge
f la reggia / le regge
f la scheggia / le schegge
f la focaccia / le focacce
f la minaccia / le minacce
f la camicia / le camicie
f la valigia / le valigie
f la ciliegia / le ciliegie
f la farmacia / le farmacie
f la bugia / le bugie
f l'allergia / le allergie
f la magia / le magie
f la strategia / le strategie
f l'energia / le energie
f la nostalgia / le nostalgie
f la chirurgia / le chirurgie
f la socia / le socie
f la scia / le scie
f l'acacia / le acacie
m lo zio / gli zii
m il pendio / i pendii
m il rinvio / i rinvii
m l'invio / gli invii
m il mormorio / i mormorii
m l'addio / gli addii
m il leggio / i leggii
m il ronzio / i ronzii
m il fruscio / i fruscii
m il figlio / i figli
m il negozio / i negozi
m l'ufficio / gli uffici
m lo studio / gli studi
m il viaggio / i viaggi
m l'orologio / gli orologi
m il bacio / i baci
m l'occhio / gli occhi
m lo specchio / gli specchi
m il formaggio / i formaggi
m il foglio / i fogli
m il coniglio / i conigli
m il consiglio / i consigli
m l'esempio / gli esempi
m il premio / i premi
m il desiderio / i desideri
m il criterio / i criteri
m il territorio / i territori
m il laboratorio / i laboratori
m l'armadio / gli armadi
m lo stadio / gli stadi
m il raggio / i raggi
m il villaggio / i villaggi
m il messaggio / i messaggi
m il personaggio / i personaggi
m il parcheggio / i parcheggi
m l'operaio / gli operai
m il calendario / i calendari
m il dizionario / i dizionari
m il salario / i salari
m l'orario / gli orari
m il cucchiaio / i cucchiai
m il macellaio / i macellai
m il fornaio / i fornai
m il notaio / i notai
m il ghiacciaio / i ghiacciai
m il guaio / i guai
m il corridoio / i corridoi
m il rasoio / i rasoi
m il vizio / i vizi
m il servizio / i servizi
m l'esercizio / gli esercizi
m lo spazio / gli spazi
m l'inizio / gli inizi
m il giudizio / i giudizi
m il silenzio / i silenzi
m il dubbio / i dubbi
m il cambio / i cambi
m lo sbaglio / gli sbagli
m il bagaglio / i bagagli
m il bersaglio / i bersagli
m il giglio / i gigli
m il dominio / i domini
m il matrimonio / i matrimoni
m il patrimonio / i patrimoni
m l'olio / gli oli
m l'edificio / gli edifici
m il sacrificio / i sacrifici
m il beneficio / i benefici
m il calcio / i calci
m il ghiaccio / i ghiacci
m il laccio / i lacci
m il riccio / i ricci
m l'abbraccio / gli abbracci
m il secchio / i secchi
m il vecchio / i vecchi
m il cerchio / i cerchi
m il rischio / i rischi
m il fischio / i fischi
m il maschio / i maschi
m il mucchio / i mucchi
m il finocchio / i finocchi
m il coperchio / i coperchi
m il marchio / i marchi ?
m l'elogio / gli elogi
m il collegio / i collegi
m il privilegio / i privilegi
m il naufragio / i naufragi
m il contagio / i contagi
m il rifugio / i rifugi
m il turista / i turisti
f la turista / le turiste ?
m l'artista / gli artisti
f un'artista / le artiste ?
m il giornalista / i giornalisti
f la giornalista / le giornaliste ?
m il dentista / i dentisti
m l'autista / gli autisti
m il pianista / i pianisti
m il farmacista / i farmacisti
m il regista / i registi
m il ciclista / i ciclisti
m il barista / i baristi
m lo specialista / gli specialisti
m il protagonista / i protagonisti
m il tassista / i tassisti
m il musicista / i musicisti
m il comunista / i comunisti
m l'ottimista / gli ottimisti
m il problema / i problemi
m il tema / i temi
m il sistema / i sistemi
m il programma / i programmi
m il poema / i poemi
m il dramma / i drammi
m il clima / i climi
m il diploma / i diplomi
m lo schema / gli schemi
m il teorema / i teoremi
m il dilemma / i dilemmi
m il panorama / i panorami
m il telegramma / i telegrammi
m il diagramma / i diagrammi
m il fantasma / i fantasmi
m il prisma / i prismi
m il trauma / i traumi
m l'aroma / gli aromi
m il cromosoma / i cromosomi
m l'enigma / gli enigmi
m il dogma / i dogmi
m il pigiama / i pigiami
m lo stemma / gli stemmi
m il profeta / i profeti
m il poeta / i poeti
m il pianeta / i pianeti
m l'atleta / gli atleti
m il pilota / i piloti
m il pirata / i pirati
m il papa / i papi
m l'idiota / gli idioti
m il patriota / i patrioti
m il pediatra / i pediatri
m lo psichiatra / gli psichiatri
m l'astronauta / gli astronauti
f la città / le città
m il caffè / i caffè
m il re / i re
m il film / i film
m il bar / i bar
f la crisi / le crisi
f l'analisi / le analisi
f la foto / le foto
f l'auto / le auto
f la moto / le moto
f la radio / le radio
f la serie / le serie
f la specie / le specie
f la carie / le carie
f l'università / le università
f la virtù / le virtù
f la tribù / le tribù
f la gru / le gru
m lo sport / gli sport
m il computer / i computer
m l'autobus / gli autobus
m il tram / i tram
m lo yogurt / gli yogurt
m l'hotel / gli hotel
m il gas / i gas
m il quiz / i quiz
f la tesi / le tesi
f l'ipotesi / le ipotesi
f la sintesi / le sintesi
f la diagnosi / le diagnosi
f la parentesi / le parentesi
f la paralisi / le paralisi
f l'oasi / le oasi
f l'eclissi / le eclissi
f la metropoli / le metropoli
m il brindisi / i brindisi
m il cinema / i cinema
m il video / i video
m l'euro / gli euro
m lo zoo / gli zoo
f la bici / le bici
m lo sci / gli sci
m il tè / i tè
m il menù / i menù
m il papà / i papà
m il sofà / i sofà
m il lunedì / i lunedì
f la libertà / le libertà
f la qualità / le qualità
f l'attività / le attività
f l'età / le età
f la novità / le novità
f la società / le società
f la verità / le verità
f la possibilità / le possibilità
m il gorilla / i gorilla
m il boia / i boia
m il koala / i koala
m il panda / i panda
m il delta / i delta
m l'uomo / gli uomini
m il dio / gli dei
m il semidio / i semidei
m il bue / i buoi
m il tempio / i templi
m il belga / i belgi
f la mano / le mani
f l'ala / le ali
f l'arma / le armi
mf l'uovo / le uova
mf il dito / le dita
mf il braccio / le braccia
mf il ginocchio / le ginocchia
mf il labbro / le labbra
mf il paio / le paia
mf l'osso / le ossa
mf il lenzuolo / le lenzuola
mf il miglio / le miglia
mf il centinaio / le centinaia
mf il migliaio / le migliaia
mf il ciglio / le ciglia
mf il sopracciglio / le sopracciglia
mf il grido / le grida
mf il corno / le corna
mf l'orecchio / le orecchie
mf il carcere / le carceri
fm l'eco / gli echi`

export default list.trim().split('\n').map((line) => {
  const [, g, one, many, amb] = line.match(/^(\S+) (.+) \/ (.+?)( \?)?$/)
  const parse = (str, gender) => {
    const [, hmm, art, noun] = str.match(/^(\*?)(\S+?['\s])(\S+)$/)
    return { str: art + noun, art, noun, gender, hmm: hmm === '*' }
  }
  return { singular: parse(one, g[0]), plural: parse(many, g[1] || g[0]), ambiguous: Boolean(amb) }
})
