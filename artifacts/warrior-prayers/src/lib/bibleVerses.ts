export interface BibleVerse {
  reference: string;
  text: string;
}

interface MultilingualVerse {
  pt: BibleVerse;
  en: BibleVerse;
  es: BibleVerse;
}

export const BIBLE_VERSES: MultilingualVerse[] = [
  {
    pt: { reference: "1 Tessalonicenses 5:17", text: "Orem sem cessar." },
    en: { reference: "1 Thessalonians 5:17", text: "Pray continually." },
    es: { reference: "1 Tesalonicenses 5:17", text: "Oren sin cesar." },
  },
  {
    pt: { reference: "Romanos 12:12", text: "Perseverem na oração." },
    en: { reference: "Romans 12:12", text: "Be faithful in prayer." },
    es: { reference: "Romanos 12:12", text: "Perseveren en la oración." },
  },
  {
    pt: { reference: "Colossenses 4:2", text: "Dediquem-se à oração, vigiando com gratidão." },
    en: { reference: "Colossians 4:2", text: "Devote yourselves to prayer, being watchful and thankful." },
    es: { reference: "Colosenses 4:2", text: "Dedíquense a la oración, velando en ella con acción de gracias." },
  },
  {
    pt: { reference: "Efésios 6:18", text: "Orem em todo tempo no Espírito." },
    en: { reference: "Ephesians 6:18", text: "Pray in the Spirit on all occasions." },
    es: { reference: "Efesios 6:18", text: "Oren en el Espíritu en todo momento." },
  },
  {
    pt: { reference: "Lucas 18:1", text: "Jesus ensinou que devemos orar sempre e nunca desanimar." },
    en: { reference: "Luke 18:1", text: "Jesus taught that we should always pray and not give up." },
    es: { reference: "Lucas 18:1", text: "Jesús enseñó que siempre debemos orar y no desmayar." },
  },
  {
    pt: { reference: "Mateus 26:41", text: "Vigiai e orai para não cair em tentação." },
    en: { reference: "Matthew 26:41", text: "Watch and pray so that you will not fall into temptation." },
    es: { reference: "Mateo 26:41", text: "Velad y orad para que no caigáis en tentación." },
  },
  {
    pt: { reference: "Marcos 14:38", text: "O espírito está pronto, mas a carne é fraca." },
    en: { reference: "Mark 14:38", text: "The spirit is willing, but the flesh is weak." },
    es: { reference: "Marcos 14:38", text: "El espíritu a la verdad está dispuesto, pero la carne es débil." },
  },
  {
    pt: { reference: "1 Pedro 4:7", text: "Sejam sóbrios e vigilantes em oração." },
    en: { reference: "1 Peter 4:7", text: "Be alert and of sober mind so that you may pray." },
    es: { reference: "1 Pedro 4:7", text: "Sed sobrios y velad en oración." },
  },
  {
    pt: { reference: "Tiago 5:16", text: "A oração do justo é poderosa e eficaz." },
    en: { reference: "James 5:16", text: "The prayer of a righteous person is powerful and effective." },
    es: { reference: "Santiago 5:16", text: "La oración eficaz del justo puede mucho." },
  },
  {
    pt: { reference: "Mateus 21:22", text: "Tudo o que pedirem em oração, crendo, receberão." },
    en: { reference: "Matthew 21:22", text: "If you believe, you will receive whatever you ask for in prayer." },
    es: { reference: "Mateo 21:22", text: "Todo lo que pidiereis en oración, creyendo, lo recibiréis." },
  },
  {
    pt: { reference: "Marcos 11:24", text: "Creiam que receberam o que pediram em oração." },
    en: { reference: "Mark 11:24", text: "Believe that you have received what you asked for in prayer." },
    es: { reference: "Marcos 11:24", text: "Todo lo que pidiereis orando, creed que lo recibiréis." },
  },
  {
    pt: { reference: "João 14:13-14", text: "Jesus promete responder pedidos feitos em Seu nome." },
    en: { reference: "John 14:13-14", text: "Jesus promises to answer requests made in His name." },
    es: { reference: "Juan 14:13-14", text: "Jesús promete responder las peticiones hechas en Su nombre." },
  },
  {
    pt: { reference: "João 15:7", text: "Permanecer em Cristo fortalece nossas orações." },
    en: { reference: "John 15:7", text: "Remaining in Christ strengthens our prayers." },
    es: { reference: "Juan 15:7", text: "Permanecer en Cristo fortalece nuestras oraciones." },
  },
  {
    pt: { reference: "João 16:23-24", text: "Peçam em nome de Jesus, para que a alegria seja completa." },
    en: { reference: "John 16:23-24", text: "Ask in Jesus' name, so that your joy may be complete." },
    es: { reference: "Juan 16:23-24", text: "Pedid en el nombre de Jesús, para que vuestro gozo sea cumplido." },
  },
  {
    pt: { reference: "1 João 5:14-15", text: "Deus nos ouve quando pedimos segundo a Sua vontade." },
    en: { reference: "1 John 5:14-15", text: "God hears us when we ask according to His will." },
    es: { reference: "1 Juan 5:14-15", text: "Dios nos oye cuando pedimos conforme a Su voluntad." },
  },
  {
    pt: { reference: "Jeremias 33:3", text: "Deus convida: clame a Ele e Ele responderá." },
    en: { reference: "Jeremiah 33:3", text: "God invites: call to Him and He will answer." },
    es: { reference: "Jeremías 33:3", text: "Dios invita: clama a Él y Él responderá." },
  },
  {
    pt: { reference: "Salmo 50:15", text: "Clame a Deus no dia da angústia." },
    en: { reference: "Psalm 50:15", text: "Call on God in the day of trouble." },
    es: { reference: "Salmo 50:15", text: "Clama a Dios en el día de la angustia." },
  },
  {
    pt: { reference: "Salmo 34:17", text: "O Senhor ouve o clamor dos justos." },
    en: { reference: "Psalm 34:17", text: "The Lord hears the cry of the righteous." },
    es: { reference: "Salmo 34:17", text: "El Señor oye el clamor de los justos." },
  },
  {
    pt: { reference: "Salmo 18:6", text: "Deus ouve o clamor em meio à aflição." },
    en: { reference: "Psalm 18:6", text: "God heard the cry in the midst of affliction." },
    es: { reference: "Salmo 18:6", text: "Dios oye el clamor en medio de la aflicción." },
  },
  {
    pt: { reference: "Salmo 120:1", text: "Na angústia, clamei ao Senhor, e Ele me ouviu." },
    en: { reference: "Psalm 120:1", text: "In my distress I called to the Lord, and He answered me." },
    es: { reference: "Salmo 120:1", text: "En mi angustia clamé al Señor, y Él me respondió." },
  },
  {
    pt: { reference: "Jonas 2:2", text: "Mesmo no fundo da aflição, Deus ouve a oração." },
    en: { reference: "Jonah 2:2", text: "Even in the depths of affliction, God hears prayer." },
    es: { reference: "Jonás 2:2", text: "Aun en lo profundo de la aflicción, Dios oye la oración." },
  },
  {
    pt: { reference: "Filipenses 4:6-7", text: "Apresente tudo a Deus em oração, e a paz dEle guardará seu coração." },
    en: { reference: "Philippians 4:6-7", text: "Present everything to God in prayer, and His peace will guard your heart." },
    es: { reference: "Filipenses 4:6-7", text: "Presentad vuestras peticiones a Dios en oración, y Su paz guardará vuestros corazones." },
  },
  {
    pt: { reference: "Hebreus 4:16", text: "Podemos nos aproximar com confiança do trono da graça." },
    en: { reference: "Hebrews 4:16", text: "Let us approach God's throne of grace with confidence." },
    es: { reference: "Hebreos 4:16", text: "Acerquémonos confiadamente al trono de la gracia para alcanzar misericordia." },
  },
  {
    pt: { reference: "2 Crônicas 20:12", text: "Quando não sabemos o que fazer, podemos colocar os olhos em Deus." },
    en: { reference: "2 Chronicles 20:12", text: "When we do not know what to do, we can set our eyes on God." },
    es: { reference: "2 Crónicas 20:12", text: "Cuando no sabemos qué hacer, podemos poner nuestros ojos en Dios." },
  },
  {
    pt: { reference: "Salmo 65:2", text: "Deus é aquele que ouve a oração." },
    en: { reference: "Psalm 65:2", text: "God is the one who hears prayer." },
    es: { reference: "Salmo 65:2", text: "Dios es aquel que oye la oración." },
  },
  {
    pt: { reference: "Salmo 66:19-20", text: "Deus ouve e atende a voz da oração." },
    en: { reference: "Psalm 66:19-20", text: "God has heard and answered the voice of my prayer." },
    es: { reference: "Salmo 66:19-20", text: "Dios ha oído y atendido la voz de mi oración." },
  },
  {
    pt: { reference: "Salmo 116:1-2", text: "Amo o Senhor, porque Ele ouviu a minha voz." },
    en: { reference: "Psalm 116:1-2", text: "I love the Lord, for He heard my voice." },
    es: { reference: "Salmo 116:1-2", text: "Amo al Señor, pues ha oído mi voz." },
  },
  {
    pt: { reference: "Provérbios 15:8", text: "A oração dos retos é prazer para o Senhor." },
    en: { reference: "Proverbs 15:8", text: "The prayer of the upright pleases the Lord." },
    es: { reference: "Proverbios 15:8", text: "La oración de los rectos es el deleite del Señor." },
  },
  {
    pt: { reference: "Provérbios 15:29", text: "O Senhor ouve a oração dos justos." },
    en: { reference: "Proverbs 15:29", text: "The Lord hears the prayer of the righteous." },
    es: { reference: "Proverbios 15:29", text: "El Señor oye la oración de los justos." },
  },
  {
    pt: { reference: "Isaías 65:24", text: "Antes mesmo de clamarem, Deus responde." },
    en: { reference: "Isaiah 65:24", text: "Before they call, God will answer." },
    es: { reference: "Isaías 65:24", text: "Antes que clamen, Dios responderá." },
  },
  {
    pt: { reference: "1 Pedro 3:12", text: "Os olhos do Senhor estão sobre os justos, e Seus ouvidos atentos às suas orações." },
    en: { reference: "1 Peter 3:12", text: "The eyes of the Lord are on the righteous, and His ears are attentive to their prayer." },
    es: { reference: "1 Pedro 3:12", text: "Los ojos del Señor están sobre los justos, y Sus oídos atentos a sus oraciones." },
  },
  {
    pt: { reference: "Mateus 6:6", text: "O Pai vê em secreto e recompensa." },
    en: { reference: "Matthew 6:6", text: "The Father sees in secret and rewards." },
    es: { reference: "Mateo 6:6", text: "El Padre ve en lo secreto y recompensa." },
  },
  {
    pt: { reference: "Hebreus 11:6", text: "Quem se aproxima de Deus precisa crer que Ele existe e recompensa os que O buscam." },
    en: { reference: "Hebrews 11:6", text: "Those who come to God must believe that He exists and rewards those who earnestly seek Him." },
    es: { reference: "Hebreos 11:6", text: "Quien se acerca a Dios debe creer que Él existe y que recompensa a los que le buscan." },
  },
  {
    pt: { reference: "Tiago 1:5-6", text: "Peça sabedoria a Deus com fé, sem duvidar." },
    en: { reference: "James 1:5-6", text: "Ask God for wisdom with faith, without doubting." },
    es: { reference: "Santiago 1:5-6", text: "Pide sabiduría a Dios con fe, sin dudar." },
  },
  {
    pt: { reference: "Mateus 7:7-8", text: "Peça, busque e bata; Deus responde aos que O procuram." },
    en: { reference: "Matthew 7:7-8", text: "Ask, seek and knock; God responds to those who seek Him." },
    es: { reference: "Mateo 7:7-8", text: "Pedid, buscad y llamad; Dios responde a los que le buscan." },
  },
  {
    pt: { reference: "Lucas 11:9-10", text: "Quem pede recebe, quem busca encontra, quem bate vê a porta se abrir." },
    en: { reference: "Luke 11:9-10", text: "Everyone who asks receives; whoever seeks finds; to him who knocks, the door will be opened." },
    es: { reference: "Lucas 11:9-10", text: "El que pide recibe, el que busca encuentra, y al que llama se le abrirá." },
  },
  {
    pt: { reference: "Marcos 9:24", text: "Senhor, eu creio; ajuda-me na minha falta de fé." },
    en: { reference: "Mark 9:24", text: "Lord, I believe; help me overcome my unbelief." },
    es: { reference: "Marcos 9:24", text: "Señor, creo; ayuda mi incredulidad." },
  },
  {
    pt: { reference: "Mateus 17:20", text: "A fé, mesmo pequena como um grão de mostarda, move montanhas." },
    en: { reference: "Matthew 17:20", text: "Faith as small as a mustard seed can move mountains." },
    es: { reference: "Mateo 17:20", text: "La fe, aunque pequeña como un grano de mostaza, mueve montañas." },
  },
  {
    pt: { reference: "João 11:41-42", text: "Jesus agradece ao Pai porque sabe que Ele sempre O ouve." },
    en: { reference: "John 11:41-42", text: "Jesus thanks the Father, knowing He always hears Him." },
    es: { reference: "Juan 11:41-42", text: "Jesús agradece al Padre sabiendo que Él siempre le oye." },
  },
  {
    pt: { reference: "1 Timóteo 2:1", text: "Devemos fazer súplicas, orações, intercessões e ações de graças por todos." },
    en: { reference: "1 Timothy 2:1", text: "We should make supplications, prayers, intercessions, and thanksgivings for all people." },
    es: { reference: "1 Timoteo 2:1", text: "Debemos hacer súplicas, oraciones, intercesiones y acciones de gracias por todos." },
  },
  {
    pt: { reference: "Efésios 1:16-18", text: "Paulo ora para que os cristãos recebam sabedoria e revelação." },
    en: { reference: "Ephesians 1:16-18", text: "Paul prays for believers to receive wisdom and revelation." },
    es: { reference: "Efesios 1:16-18", text: "Pablo ora para que los creyentes reciban sabiduría y revelación." },
  },
  {
    pt: { reference: "Efésios 3:14-19", text: "Paulo ora para que a igreja seja fortalecida no amor de Cristo." },
    en: { reference: "Ephesians 3:14-19", text: "Paul prays for the church to be strengthened in Christ's love." },
    es: { reference: "Efesios 3:14-19", text: "Pablo ora para que la iglesia sea fortalecida en el amor de Cristo." },
  },
  {
    pt: { reference: "Colossenses 1:9-12", text: "Paulo ora para que os irmãos cresçam no conhecimento da vontade de Deus." },
    en: { reference: "Colossians 1:9-12", text: "Paul prays for brothers to grow in the knowledge of God's will." },
    es: { reference: "Colosenses 1:9-12", text: "Pablo ora para que los hermanos crezcan en el conocimiento de la voluntad de Dios." },
  },
  {
    pt: { reference: "2 Tessalonicenses 1:11-12", text: "Oração para que Deus cumpra Seus propósitos na vida dos irmãos." },
    en: { reference: "2 Thessalonians 1:11-12", text: "Prayer for God to fulfill His purposes in the lives of brothers." },
    es: { reference: "2 Tesalonicenses 1:11-12", text: "Oración para que Dios cumpla Sus propósitos en la vida de los hermanos." },
  },
  {
    pt: { reference: "Tiago 5:14-15", text: "Os presbíteros devem orar pelos enfermos." },
    en: { reference: "James 5:14-15", text: "The elders should pray over the sick." },
    es: { reference: "Santiago 5:14-15", text: "Los presbíteros deben orar por los enfermos." },
  },
  {
    pt: { reference: "Jó 42:10", text: "Deus restaurou Jó enquanto ele orava por seus amigos." },
    en: { reference: "Job 42:10", text: "God restored Job while he was praying for his friends." },
    es: { reference: "Job 42:10", text: "Dios restauró a Job mientras oraba por sus amigos." },
  },
  {
    pt: { reference: "Números 6:24-26", text: "Bênção sacerdotal: oração de bênção sobre o povo." },
    en: { reference: "Numbers 6:24-26", text: "Priestly blessing: a prayer of blessing over the people." },
    es: { reference: "Números 6:24-26", text: "Bendición sacerdotal: oración de bendición sobre el pueblo." },
  },
  {
    pt: { reference: "Mateus 6:13", text: "Ore para ser livre do mal." },
    en: { reference: "Matthew 6:13", text: "Pray to be delivered from evil." },
    es: { reference: "Mateo 6:13", text: "Ora para ser librado del mal." },
  },
  {
    pt: { reference: "Salmo 91:15", text: "Deus responde ao clamor e está conosco na angústia." },
    en: { reference: "Psalm 91:15", text: "God answers the cry and is with us in distress." },
    es: { reference: "Salmo 91:15", text: "Dios responde al clamor y está con nosotros en la angustia." },
  },
  {
    pt: { reference: "Salmo 141:2", text: "Que a oração suba como incenso diante de Deus." },
    en: { reference: "Psalm 141:2", text: "May prayer rise like incense before God." },
    es: { reference: "Salmo 141:2", text: "Que la oración suba como incienso ante Dios." },
  },
  {
    pt: { reference: "2 Tessalonicenses 3:1-3", text: "Orem para que a Palavra avance e para que Deus livre do mal." },
    en: { reference: "2 Thessalonians 3:1-3", text: "Pray that the Word advances and God delivers from evil." },
    es: { reference: "2 Tesalonicenses 3:1-3", text: "Oren para que la Palabra avance y Dios libre del mal." },
  },
  {
    pt: { reference: "João 17:15", text: "Jesus orou para que o Pai guardasse os discípulos do mal." },
    en: { reference: "John 17:15", text: "Jesus prayed for the Father to keep the disciples from evil." },
    es: { reference: "Juan 17:15", text: "Jesús oró para que el Padre guardara a los discípulos del mal." },
  },
  {
    pt: { reference: "Salmo 5:1-3", text: "Pela manhã, apresente sua oração a Deus e espere com confiança." },
    en: { reference: "Psalm 5:1-3", text: "In the morning, present your prayer to God and wait in confidence." },
    es: { reference: "Salmo 5:1-3", text: "Por la mañana, presenta tu oración a Dios y espera con confianza." },
  },
  {
    pt: { reference: "Salmo 17:6", text: "Clame a Deus, pois Ele inclina os ouvidos." },
    en: { reference: "Psalm 17:6", text: "Call to God, for He inclines His ear to hear." },
    es: { reference: "Salmo 17:6", text: "Clama a Dios, pues Él inclina Sus oídos." },
  },
  {
    pt: { reference: "Salmo 5:3", text: "Pela manhã, apresente sua oração ao Senhor." },
    en: { reference: "Psalm 5:3", text: "In the morning, present your prayer to the Lord." },
    es: { reference: "Salmo 5:3", text: "Por la mañana, presenta tu oración al Señor." },
  },
  {
    pt: { reference: "Salmo 63:1", text: "Busque a Deus com sede e desejo profundo." },
    en: { reference: "Psalm 63:1", text: "Seek God with thirst and deep longing." },
    es: { reference: "Salmo 63:1", text: "Busca a Dios con sed y profundo anhelo." },
  },
  {
    pt: { reference: "Daniel 6:10", text: "Daniel orava três vezes ao dia, mesmo sob ameaça." },
    en: { reference: "Daniel 6:10", text: "Daniel prayed three times a day, even under threat." },
    es: { reference: "Daniel 6:10", text: "Daniel oraba tres veces al día, aun bajo amenaza." },
  },
  {
    pt: { reference: "Marcos 1:35", text: "Jesus se retirava de madrugada para orar." },
    en: { reference: "Mark 1:35", text: "Jesus got up early in the morning to pray." },
    es: { reference: "Marcos 1:35", text: "Jesús se levantaba de madrugada para orar." },
  },
  {
    pt: { reference: "Lucas 5:16", text: "Jesus se retirava para lugares solitários e orava." },
    en: { reference: "Luke 5:16", text: "Jesus often withdrew to solitary places to pray." },
    es: { reference: "Lucas 5:16", text: "Jesús se retiraba a lugares solitarios para orar." },
  },
  {
    pt: { reference: "Lucas 6:12", text: "Jesus passou a noite orando antes de escolher os discípulos." },
    en: { reference: "Luke 6:12", text: "Jesus spent the night in prayer before choosing His disciples." },
    es: { reference: "Lucas 6:12", text: "Jesús pasó la noche orando antes de elegir a Sus discípulos." },
  },
  {
    pt: { reference: "Atos 3:1", text: "Pedro e João subiam ao templo na hora da oração." },
    en: { reference: "Acts 3:1", text: "Peter and John went up to the temple at the hour of prayer." },
    es: { reference: "Hechos 3:1", text: "Pedro y Juan subían al templo en la hora de la oración." },
  },
  {
    pt: { reference: "Salmo 55:17", text: "De tarde, de manhã e ao meio-dia, o salmista orava." },
    en: { reference: "Psalm 55:17", text: "Evening, morning, and noon, the psalmist cried out to God." },
    es: { reference: "Salmo 55:17", text: "Tarde, mañana y al mediodía, el salmista oraba." },
  },
  {
    pt: { reference: "2 Crônicas 7:14", text: "Se o povo se humilhar, orar e se converter, Deus ouvirá e sarará a terra." },
    en: { reference: "2 Chronicles 7:14", text: "If the people humble themselves, pray and turn from their ways, God will hear and heal their land." },
    es: { reference: "2 Crónicas 7:14", text: "Si el pueblo se humilla, ora y se convierte, Dios oirá y sanará la tierra." },
  },
  {
    pt: { reference: "Salmo 32:5-6", text: "Confessar o pecado abre caminho para o perdão." },
    en: { reference: "Psalm 32:5-6", text: "Confessing sin opens the way for forgiveness." },
    es: { reference: "Salmo 32:5-6", text: "Confesar el pecado abre el camino al perdón." },
  },
  {
    pt: { reference: "Salmo 51:1-12", text: "Davi ora por misericórdia, purificação e restauração." },
    en: { reference: "Psalm 51:1-12", text: "David prays for mercy, cleansing, and restoration." },
    es: { reference: "Salmo 51:1-12", text: "David ora por misericordia, purificación y restauración." },
  },
  {
    pt: { reference: "Daniel 9:3-5", text: "Daniel ora com jejum, confissão e arrependimento." },
    en: { reference: "Daniel 9:3-5", text: "Daniel prays with fasting, confession, and repentance." },
    es: { reference: "Daniel 9:3-5", text: "Daniel ora con ayuno, confesión y arrepentimiento." },
  },
  {
    pt: { reference: "Neemias 1:4-11", text: "Neemias ora confessando os pecados do povo." },
    en: { reference: "Nehemiah 1:4-11", text: "Nehemiah prays confessing the sins of the people." },
    es: { reference: "Nehemías 1:4-11", text: "Nehemías ora confesando los pecados del pueblo." },
  },
  {
    pt: { reference: "Lucas 18:13-14", text: "O publicano ora humildemente: Deus, tem misericórdia de mim." },
    en: { reference: "Luke 18:13-14", text: "The tax collector prays humbly: God, have mercy on me." },
    es: { reference: "Lucas 18:13-14", text: "El publicano ora humildemente: Dios, ten misericordia de mí." },
  },
  {
    pt: { reference: "Atos 8:22", text: "Arrependa-se e ore ao Senhor." },
    en: { reference: "Acts 8:22", text: "Repent and pray to the Lord." },
    es: { reference: "Hechos 8:22", text: "Arrepiéntete y ora al Señor." },
  },
  {
    pt: { reference: "1 João 1:9", text: "Deus é fiel e justo para perdoar quando confessamos nossos pecados." },
    en: { reference: "1 John 1:9", text: "God is faithful and just to forgive when we confess our sins." },
    es: { reference: "1 Juan 1:9", text: "Dios es fiel y justo para perdonar cuando confesamos nuestros pecados." },
  },
  {
    pt: { reference: "Mateus 7:7", text: "Peçam, busquem e batam; Deus se revela aos que O procuram." },
    en: { reference: "Matthew 7:7", text: "Ask, seek and knock; God reveals Himself to those who seek Him." },
    es: { reference: "Mateo 7:7", text: "Pedid, buscad y llamad; Dios se revela a los que le buscan." },
  },
  {
    pt: { reference: "Jeremias 29:12-13", text: "Quando vocês clamarem e orarem a Deus, Ele os ouvirá; quando O buscarem de todo o coração, O encontrarão." },
    en: { reference: "Jeremiah 29:12-13", text: "When you call and pray to God, He will hear; when you seek Him with all your heart, you will find Him." },
    es: { reference: "Jeremías 29:12-13", text: "Cuando clamen y oren a Dios, Él los oirá; cuando le busquen de todo corazón, le encontrarán." },
  },
  {
    pt: { reference: "Filipenses 4:6-7", text: "Não viva dominado pela ansiedade; leve tudo a Deus em oração, com gratidão, e receba a paz que vem dEle." },
    en: { reference: "Philippians 4:6-7", text: "Do not be anxious about anything; bring everything to God in prayer with thanksgiving, and His peace will guard your heart." },
    es: { reference: "Filipenses 4:6-7", text: "No estéis afanosos; llevad todo a Dios en oración, con gratitud, y recibiréis Su paz." },
  },
  {
    pt: { reference: "Hebreus 4:16", text: "Aproxime-se de Deus com confiança, porque há graça e socorro disponível." },
    en: { reference: "Hebrews 4:16", text: "Approach God with confidence, because grace and help are available." },
    es: { reference: "Hebreos 4:16", text: "Acercaos a Dios con confianza, porque hay gracia y auxilio disponibles." },
  },
  {
    pt: { reference: "Tiago 5:16", text: "A oração feita com fé tem grande poder diante de Deus." },
    en: { reference: "James 5:16", text: "Prayer made in faith has great power before God." },
    es: { reference: "Santiago 5:16", text: "La oración hecha con fe tiene gran poder delante de Dios." },
  },
  {
    pt: { reference: "Salmo 34:4", text: "Busquei o Senhor, e Ele me respondeu; livrou-me de todos os meus temores." },
    en: { reference: "Psalm 34:4", text: "I sought the Lord, and He answered me; He delivered me from all my fears." },
    es: { reference: "Salmo 34:4", text: "Busqué al Señor, y Él me respondió; me libró de todos mis temores." },
  },
];

export function getRandomVerse(lang: string): BibleVerse {
  const item = BIBLE_VERSES[Math.floor(Math.random() * BIBLE_VERSES.length)];
  return item[lang as keyof MultilingualVerse] ?? item.en;
}

export function getVerseByIndex(index: number, lang: string): BibleVerse {
  const item = BIBLE_VERSES[index % BIBLE_VERSES.length];
  return item[lang as keyof MultilingualVerse] ?? item.en;
}

export const VERSE_COUNT = BIBLE_VERSES.length;
