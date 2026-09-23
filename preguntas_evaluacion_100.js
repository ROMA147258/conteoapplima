/**
 * Banco oficial de 100 preguntas de capacitación electoral para Personeros de Mesa
 * Elecciones Regionales y Municipales 2026.
 * Basado estrictamente en la Cartilla Oficial y Documento del Personero de Mesa - ONPE.
 * Actualizado con Banco Oficial 3 (Aplicando cambios en verde, eliminando tachados en rojo y reemplazando preguntas lila).
 */
export const QUESTION_BANK = [
  {
    "id": 1,
    "question": "¿Quién es el personero de mesa de sufragio?",
    "options": [
      "Es el ciudadano acreditado por una organización política para presenciar y fiscalizar la votación en una mesa de sufragio.",
      "Es la autoridad encargada de contar las cédulas en lugar del presidente de mesa.",
      "Es el trabajador contratado por la ONPE para guiar a los votantes en la fila.",
      "Es el miembro de seguridad encargado del orden en el local de votación."
    ],
    "answer": 0,
    "explanation": "El personero de mesa representa a su organización política y vela por la transparencia de la votación en la mesa."
  },
  {
    "id": 2,
    "question": "¿Cuáles son los tres momentos principales de la jornada electoral?",
    "options": [
      "Instalación, Sufragio y Escrutinio.",
      "Convocatoria, Campaña y Votación.",
      "Capacitación, Simulacro y Proclamación.",
      "Apertura del local, Desayuno y Cierre del local."
    ],
    "answer": 0,
    "explanation": "La jornada electoral se divide en tres momentos: 1. Instalación, 2. Sufragio y 3. Escrutinio."
  },
  {
    "id": 3,
    "question": "¿A qué hora deben presentarse los miembros de mesa y personeros para la instalación?",
    "options": [
      "A las 7:00 a. m.",
      "A las 8:30 a. m.",
      "A las 9:00 a. m.",
      "A las 6:00 a. m."
    ],
    "answer": 0,
    "explanation": "La instalación de la mesa de sufragio inicia a las 7:00 a. m."
  },
  {
    "id": 4,
    "question": "¿A qué hora inicia el sufragio (la votación de los electores)?",
    "options": [
      "A las 8:00 a. m.",
      "A las 7:00 a. m.",
      "A las 9:00 a. m.",
      "A las 10:00 a. m."
    ],
    "answer": 0,
    "explanation": "El sufragio inicia a las 8:00 a. m., una vez instalada la mesa."
  },
  {
    "id": 5,
    "question": "¿A qué hora concluye el sufragio y se cierran las mesas para iniciar el escrutinio?",
    "options": [
      "A las 5:00 p. m.",
      "A las 4:00 p. m.",
      "A las 6:00 p. m.",
      "A las 7:00 p. m."
    ],
    "answer": 0,
    "explanation": "La votación termina a las 5:00 p. m. Solo votan los electores que ya están dentro del local."
  },
  {
    "id": 6,
    "question": "¿Qué documentos debe presentar el personero de mesa ante el presidente para acreditarse?",
    "options": [
      "Su credencial oficial y su DNI vigente.",
      "Solo su carnet de afiliado al partido.",
      "Solo su partida de nacimiento.",
      "Una carta firmada por el alcalde."
    ],
    "answer": 0,
    "explanation": "El personero debe presentar su credencial otorgada por su organización política y su DNI."
  },
  {
    "id": 7,
    "question": "¿Quiénes NO pueden ser personeros de mesa?",
    "options": [
      "Los candidatos, las autoridades políticas, los miembros de mesa y los miembros de las FF.AA. y PNP en actividad.",
      "Los ciudadanos mayores de 18 años con DNI.",
      "Los afiliados a organizaciones políticas con credencial.",
      "Los vecinos que votan en el mismo distrito."
    ],
    "answer": 0,
    "explanation": "La ley prohíbe que candidatos, autoridades, miembros de mesa o policías/militares en servicio sean personeros."
  },
  {
    "id": 8,
    "question": "¿Puede una organización política tener más de un personero acreditado en la misma mesa al mismo tiempo?",
    "options": [
      "No, solo puede estar presente un personero por cada organización política a la vez.",
      "Sí, pueden estar hasta tres personeros del mismo partido juntos.",
      "Sí, siempre que no hagan ruido.",
      "Sí, si la mesa tiene más de 300 electores."
    ],
    "answer": 0,
    "explanation": "Cada organización política solo puede tener un personero presente en la mesa de sufragio."
  },
  {
    "id": 9,
    "question": "¿Tiene derecho el personero de mesa a firmar el reverso de las cédulas de sufragio durante la instalación?",
    "options": [
      "Sí, si lo desea, puede firmar las cédulas en la cara posterior junto con el presidente de mesa.",
      "No, está totalmente prohibido que el personero toque las cédulas para firmarlas.",
      "Solo si el presidente de mesa no sabe firmar.",
      "Solo si faltan menos de 10 minutos para las 8:00 a. m."
    ],
    "answer": 0,
    "explanation": "Los personeros tienen el derecho opcional de firmar el reverso de las cédulas durante la instalación."
  },
  {
    "id": 10,
    "question": "¿Qué debe hacer el personero si durante la instalación observa que el ánfora contiene papeles o está dañada?",
    "options": [
      "Solicitar a los miembros de mesa que verifiquen que el ánfora esté completamente vacía antes de cerrarla y sellarla.",
      "Llevarse el ánfora a la comisaría.",
      "Romper el ánfora y pedir una caja de cartón.",
      "Guardar silencio hasta el final del conteo."
    ],
    "answer": 0,
    "explanation": "El personero verifica que el ánfora esté vacía y en buen estado antes de que se inicie la votación."
  },
  {
    "id": 11,
    "question": "¿Quiénes firman el Acta de Instalación?",
    "options": [
      "Los tres miembros de mesa (Presidente, Secretario, Tercer Miembro) y los personeros que lo deseen.",
      "Solo el coordinador de la ONPE.",
      "Solo el personero del partido con más votos.",
      "Únicamente el policía que resguarda la puerta."
    ],
    "answer": 0,
    "explanation": "El acta de instalación es firmada obligatoriamente por los miembros de mesa y opcionalmente por los personeros presentes."
  },
  {
    "id": 12,
    "question": "¿Hasta qué hora como máximo puede instalarse una mesa de sufragio si faltan miembros?",
    "options": [
      "Hasta las 12:00 del mediodía.",
      "Hasta las 10:00 a. m.",
      "Hasta las 2:00 p. m.",
      "Hasta las 5:00 p. m."
    ],
    "answer": 0,
    "explanation": "Si una mesa no logra instalarse hasta las 12:00 m., la mesa se declara no instalada."
  },
  {
    "id": 13,
    "question": "¿Quiénes votan primero al comenzar el sufragio a las 7:00 a. m.?",
    "options": [
      "Los miembros de mesa y luego los personeros que votan en esa misma mesa.",
      "Los electores que llegaron primero a la fila.",
      "Los candidatos a la alcaldía.",
      "Los policías y militares de seguridad."
    ],
    "answer": 0,
    "explanation": "Los miembros de la mesa votan en primer lugar, seguidos por los personeros acreditados que votan en esa mesa."
  },
  {
    "id": 14,
    "question": "¿Dónde debe votar el personero de mesa si su mesa de votación original está en otra aula u otro local?",
    "options": [
      "Debe votar en la mesa que le corresponde según su padrón electoral y su DNI.",
      "Puede votar en la mesa donde está cuidando los votos aunque no figure en el padrón.",
      "Puede votar dos veces: en su mesa y en la mesa donde es personero.",
      "El presidente de mesa le agrega manualmente en una hoja aparte."
    ],
    "answer": 0,
    "explanation": "Nadie puede votar en una mesa si no figura en el padrón electoral de esa mesa."
  },
  {
    "id": 15,
    "question": "¿Qué documento debe presentar obligatoriamente el ciudadano para poder votar?",
    "options": [
      "Su Documento Nacional de Identidad (DNI).",
      "Su carnet de conducir o brevete.",
      "Su fotocopia simple de DNI sin foto.",
      "Su recibo de agua o luz."
    ],
    "answer": 0,
    "explanation": "El único documento válido para ejercer el derecho al voto es el DNI."
  },
  {
    "id": 16,
    "question": "¿Puede un elector ingresar a la cámara secreta acompañado por otra persona?",
    "options": [
      "No, el voto es estrictamente secreto e individual, salvo personas con discapacidad que requieran asistencia de su confianza.",
      "Sí, siempre que ingrese con un personero de su confianza.",
      "Sí, los esposos pueden entrar juntos a votar.",
      "Sí, si el presidente de mesa lo acompaña para ver por quién vota."
    ],
    "answer": 0,
    "explanation": "El voto es secreto e individual. Solo personas con discapacidad severa pueden entrar con una persona de su confianza."
  },
  {
    "id": 17,
    "question": "¿Qué tipo de marca es válida en la cédula de votación según la ley electoral?",
    "options": [
      "Una cruz (+) o un aspa (x) cuyo cruce de líneas esté dentro del recuadro del símbolo o fotografía.",
      "Un círculo que encierre todo el recuadro del partido.",
      "Un visto bueno (check) al costado de la foto del candidato.",
      "La firma del votante dentro del recuadro."
    ],
    "answer": 0,
    "explanation": "Solo es válida la marca en forma de cruz (+) o aspa (x) cuya intersección esté dentro del recuadro."
  },
  {
    "id": 18,
    "question": "¿Qué sucede si los trazos de la cruz o aspa sobrepasan ligeramente el recuadro, pero el punto de cruce está adentro?",
    "options": [
      "El voto es VÁLIDO a favor de esa organización política.",
      "El voto es nulo automáticamente.",
      "El voto se convierte en voto en blanco.",
      "Se debe romper la cédula y darle otra al elector."
    ],
    "answer": 0,
    "explanation": "Si el cruce de las líneas está dentro del recuadro, el voto es válido aunque las líneas sobrepasen un poco."
  },
  {
    "id": 19,
    "question": "¿Qué es un voto nulo o viciado?",
    "options": [
      "Es el voto con signos distintos (dibujos, firmas, caritas), marcas fuera de recuadros o marcas a dos partidos diferentes.",
      "Es el voto emitido por una persona mayor de 70 años.",
      "Es el voto de un elector que llegó después de las 8:00 a. m.",
      "Es el voto donde la cruz está perfectamente dibujada dentro del símbolo."
    ],
    "answer": 0,
    "explanation": "Un voto es nulo cuando tiene inscripciones ajenas, signos diferentes a cruz/aspa o marca a dos listas distintas."
  },
  {
    "id": 20,
    "question": "¿Qué es un voto en blanco?",
    "options": [
      "Es la cédula donde el elector no realizó ninguna marca en ninguna opción de votación.",
      "Es una cédula que tiene una marca con lápiz blanco.",
      "Es una cédula que se rompió por error al doblarla.",
      "Es la cédula sobrante que no se utilizó durante el día."
    ],
    "answer": 0,
    "explanation": "El voto en blanco es aquel donde la cédula no tiene ninguna marca realizada por el elector."
  },
  {
    "id": 21,
    "question": "¿Puede el personero de mesa manipular, contar o tocar las cédulas de votación durante el escrutinio?",
    "options": [
      "No, bajo ninguna circunstancia. Solo los miembros de mesa pueden tocar y contar las cédulas.",
      "Sí, el personero puede ayudar a contar si los miembros están cansados.",
      "Sí, el personero debe sostener las cédulas para que todos las vean.",
      "Sí, si tiene guantes quirúrgicos."
    ],
    "answer": 0,
    "explanation": "Está terminantemente prohibido que los personeros toquen o manipulen las cédulas de sufragio."
  },
  {
    "id": 22,
    "question": "¿Qué derecho fundamental tiene el personero durante el escrutinio (conteo de votos)?",
    "options": [
      "Observar el conteo a una distancia adecuada y verificar la calificación de cada voto.",
      "Decidir él solo qué votos valen y cuáles no.",
      "Escribir directamente en el acta con su propio lapicero.",
      "Llevarse las cédulas a su local partidario para recontarlas."
    ],
    "answer": 0,
    "explanation": "El personero tiene derecho a presenciar y fiscalizar el escrutinio a una distancia que permita ver cada cédula."
  },
  {
    "id": 23,
    "question": "¿Cuál es el primer paso que realizan los miembros de mesa al iniciar el escrutinio a las 5:00 p. m.?",
    "options": [
      "Contar las cédulas sin abrirlas y verificar que coincidan con el total de ciudadanos que votaron en el acta de sufragio.",
      "Abrir todas las cédulas rápidamente y separar los votos.",
      "Llenar de inmediato el acta de escrutinio con números estimados.",
      "Guardar el ánfora en la caja sin contar las cédulas."
    ],
    "answer": 0,
    "explanation": "Primero se cuenta el total de cédulas del ánfora para comprobar que coincide con los votantes registrados."
  },
  {
    "id": 24,
    "question": "¿Qué sucede si en el ánfora hay MÁS cédulas que el número de ciudadanos que votaron?",
    "options": [
      "El presidente extrae al azar las cédulas sobrantes sin abrirlas y las destruye de inmediato.",
      "Se anula toda la mesa de sufragio.",
      "Se cuentan todas las cédulas y se aumentan firmas falsas en el padrón.",
      "Los personeros se reparten las cédulas sobrantes."
    ],
    "answer": 0,
    "explanation": "Si hay exceso de cédulas, se extraen al azar tantas cédulas como sobren y se destruyen sin abrirlas."
  },
  {
    "id": 25,
    "question": "¿Qué sucede si en el ánfora hay MENOS cédulas que el número de ciudadanos que votaron?",
    "options": [
      "Se procede al escrutinio con las cédulas existentes y se deja constancia en el campo de observaciones del acta.",
      "Se anula la mesa automáticamente.",
      "Se detiene el conteo y se llama a los electores que ya se fueron.",
      "Se inventan cédulas en blanco para completar el número."
    ],
    "answer": 0,
    "explanation": "Se escrutan las cédulas que hay y se registra la observación en el acta electoral."
  },
  {
    "id": 26,
    "question": "¿Qué documento utilizan los miembros de mesa como borrador antes de llenar el Acta de Escrutinio definitiva?",
    "options": [
      "La Hoja Borrador de Escrutinio proporcionada por la ONPE.",
      "Una servilleta o cuaderno personal de un personero.",
      "La parte de atrás de una cédula de votación.",
      "Un mensaje de WhatsApp en el celular."
    ],
    "answer": 0,
    "explanation": "Se utiliza la Hoja Borrador oficial para realizar los conteos y sumas antes de pasarlos al acta final."
  },
  {
    "id": 27,
    "question": "¿Qué es un voto impugnado?",
    "options": [
      "Es aquel cuya validez es cuestionada por un personero y los miembros de mesa no resuelven por unanimidad.",
      "Es un voto que se rompió al salir del ánfora.",
      "Es el voto emitido por el presidente de mesa.",
      "Es el voto de un elector que llegó a las 4:59 p. m."
    ],
    "answer": 0,
    "explanation": "Si un personero impugna la validez de un voto, se guarda en sobre especial para que lo resuelva el JEE."
  },
  {
    "id": 28,
    "question": "¿Qué organismo electoral es el encargado de resolver los votos impugnados después de la jornada electoral?",
    "options": [
      "El Jurado Electoral Especial (JEE).",
      "La Policía Nacional del Perú.",
      "La Municipalidad Distrital.",
      "El personero de mayor edad."
    ],
    "answer": 0,
    "explanation": "Los votos impugnados son remitidos en sobre especial al Jurado Electoral Especial para su resolución final."
  },
  {
    "id": 29,
    "question": "¿Tiene derecho el personero de mesa a recibir una copia del Acta Electoral al finalizar el escrutinio?",
    "options": [
      "Sí, es un derecho legal fundamental recibir una copia del Acta Electoral completa y firmada por los miembros de mesa.",
      "No, las actas son secretas y solo las puede ver la ONPE.",
      "Solo si paga una tasa en el Banco de la Nación.",
      "Solo el personero del partido que obtuvo el primer lugar."
    ],
    "answer": 0,
    "explanation": "Los personeros tienen derecho a recibir un ejemplar del acta electoral debidamente suscrita por la mesa."
  },
  {
    "id": 30,
    "question": "¿Qué debe hacer el personero inmediatamente después de recibir su copia del Acta Electoral?",
    "options": [
      "Revisar que las cifras coincidan con el conteo, que esté firmada y entregarla o reportarla a su personero de centro de votación.",
      "Guardarla en su casa sin mostrarla a nadie.",
      "Borrar los números de los otros partidos con corrector.",
      "Firmarla en blanco y regalarla a un votante."
    ],
    "answer": 0,
    "explanation": "El acta es la prueba legal del resultado; se debe verificar, cuidar y enviar de inmediato al centro de cómputo partidario."
  },
  {
    "id": 31,
    "question": "¿Está permitido que un personero porte camisetas, gorros o carteles alusivos a su candidato dentro del local?",
    "options": [
      "No, está prohibido hacer propaganda electoral dentro de los locales de votación.",
      "Sí, siempre que la camiseta sea de color claro.",
      "Sí, si mide menos de 1 metro de ancho.",
      "Sí, durante la última hora de la votación."
    ],
    "answer": 0,
    "explanation": "Dentro del local de votación está terminantemente prohibido portar distintivos o hacer propaganda electoral."
  },
  {
    "id": 32,
    "question": "¿Cuál es el único distintivo permitido que puede llevar visible el personero dentro del local de votación?",
    "options": [
      "Su credencial oficial otorgada conforme a las medidas reglamentarias de la ONPE.",
      "Una bandera grande de su partido político.",
      "Un megáfono con el himno de su partido.",
      "Un pin con la foto del candidato a presidente."
    ],
    "answer": 0,
    "explanation": "El personero solo puede portar su credencial oficial de tamaño reglamentario para identificarse."
  },
  {
    "id": 33,
    "question": "¿Puede un personero pedir a los electores que voten por su organización política en la fila de votación?",
    "options": [
      "No, está estrictamente prohibido inducir o pedir el voto dentro del local de votación.",
      "Sí, pero en voz baja para que no escuche el policía.",
      "Sí, solo a sus familiares y amigos.",
      "Sí, entregando volantes pequeños."
    ],
    "answer": 0,
    "explanation": "Inducir el voto en el local de votación es un delito electoral y motivo de expulsión inmediata."
  },
  {
    "id": 34,
    "question": "¿Qué debe hacer el personero si un elector se demora dentro de la cámara secreta?",
    "options": [
      "Mantener la calma y permitir que los miembros de mesa manejen la situación con respeto a la privacidad del voto.",
      "Acercarse a la cámara secreta para ver qué está haciendo.",
      "Entrar a ayudarlo a marcar la cédula.",
      "Gritarle desde la mesa para que se apure."
    ],
    "answer": 0,
    "explanation": "Nadie puede invadir la cámara secreta; los miembros de mesa son los únicos que pueden recordar amablemente el tiempo."
  },
  {
    "id": 35,
    "question": "¿Qué secciones componen el Acta Electoral completa?",
    "options": [
      "Acta de Instalación, Acta de Sufragio y Acta de Escrutinio.",
      "Acta de Convocatoria, Acta de Gastos y Acta de Clausura.",
      "Padrón de afiliados, Lista de útiles y Ficha de votación.",
      "Hoja de reclamos, Lista de miembros y Acta de entrega."
    ],
    "answer": 0,
    "explanation": "El Acta Electoral oficial contiene las tres secciones: Instalación, Sufragio y Escrutinio."
  },
  {
    "id": 36,
    "question": "¿Qué información contiene la sección del Acta de Sufragio?",
    "options": [
      "El total de ciudadanos que votaron, el total de cedulas no utilizadas y las observaciones.",
      "El total de electores votaron.",
      "El número de cédulas rotas únicamente.",
      "La cantidad de policías en el aula."
    ],
    "answer": 0,
    "explanation": "El Acta de Sufragio registra cuántos ciudadanos votaron y cuántos no asistieron a votar."
  },
  {
    "id": 37,
    "question": "¿Qué información contiene la sección del Acta de Escrutinio?",
    "options": [
      "Los votos obtenidos por cada lista de candidatos, los votos en blanco, los votos nulos y los votos impugnados.",
      "Los nombres de todos los votantes del día.",
      "Las firmas de los electores de la fila.",
      "La hora de salida del personal de limpieza."
    ],
    "answer": 0,
    "explanation": "El Acta de Escrutinio refleja los resultados numéricos exactos de la votación para cada lista."
  },
  {
    "id": 38,
    "question": "¿Qué debe hacer el personero si nota un error en la suma de los votos en la Hoja Borrador?",
    "options": [
      "Hacer la observación con respeto antes de que los miembros de mesa pasen los datos al Acta de Escrutinio definitiva.",
      "Esperar a que firmen el acta para luego hacer el reclamo.",
      "Tachar con plumón negro el acta oficial.",
      "Arrebatar la hoja borrador y salir corriendo."
    ],
    "answer": 0,
    "explanation": "El personero debe alertar respetuosamente para corregir las sumas en la hoja borrador antes de llenar el acta final."
  },
  {
    "id": 39,
    "question": "¿Se pueden hacer borrones, tachaduras o usar corrector líquido en el Acta Electoral definitiva?",
    "options": [
      "No, las actas no deben tener enmendaduras ni borrones porque pueden generar observaciones legales.",
      "Sí, se puede tachar y poner liquid paper cuantas veces se quiera.",
      "Sí, siempre que el personero ponga su huella encima.",
      "Sí, si el error es de menos de 10 votos."
    ],
    "answer": 0,
    "explanation": "Las actas deben llenarse con letra clara y sin enmendaduras para evitar que sean observadas por el JEE."
  },
  {
    "id": 40,
    "question": "¿Qué pasa si una organización política no obtuvo ningún voto en una mesa?",
    "options": [
      "Se coloca el número cero (0) o una raya según corresponda en su casillero.",
      "Se deja el casillero completamente vacío y abierto.",
      "Se elimina esa organización del acta rompiendo el papel.",
      "Se le regalan 5 votos de los votos nulos."
    ],
    "answer": 0,
    "explanation": "Se debe consignar el número cero (0) para evitar que personas inescrupulosas agreguen números posteriormente."
  },
  {
    "id": 41,
    "question": "¿Quiénes son los tres miembros que conforman la mesa de sufragio?",
    "options": [
      "Presidente, Secretario y Tercer Miembro.",
      "Personero, Fiscal y Comisario.",
      "Alcalde, Teniente Alcalde y Regidor.",
      "Coordinador de local, Técnico de cómputo y Guardia."
    ],
    "answer": 0,
    "explanation": "La mesa de sufragio está conformada por tres miembros titulares: Presidente, Secretario y Tercer Miembro."
  },
  {
    "id": 42,
    "question": "¿Qué rol cumple el personero frente a las decisiones que toman los miembros de mesa?",
    "options": [
      "El personero es un fiscalizador cívico; no tiene voto en las decisiones, pero puede dejar constancia de sus observaciones e impugnaciones.",
      "El personero manda y ordena a los miembros de mesa lo que deben hacer.",
      "El personero puede expulsar a los miembros de mesa si no le caen bien.",
      "El personero decide el ganador de la mesa."
    ],
    "answer": 0,
    "explanation": "La máxima autoridad en la mesa son los miembros de mesa; el personero vigila, opina y puede impugnar formalmente."
  },
  {
    "id": 43,
    "question": "¿Qué sucede si a las 7:00 a. m. falta uno de los miembros de mesa titulares?",
    "options": [
      "El presidente asume con los suplentes presentes o, en su defecto, con los primeros electores de la fila.",
      "La mesa se cierra y todos los electores se van a su casa.",
      "El personero se sienta a reemplazar al miembro de mesa y cobra el bono.",
      "Se espera hasta las 4:00 p. m. a que llegue el titular."
    ],
    "answer": 0,
    "explanation": "Si faltan titulares, la mesa se completa con los suplentes o electores de la fila; nunca con personeros ni candidatos."
  },
  {
    "id": 44,
    "question": "¿Puede un personero de mesa aceptar ser designado como miembro de mesa suplente de la fila?",
    "options": [
      "No, los personeros de organizaciones políticas están legalmente impedidos de ser miembros de mesa.",
      "Sí, si le pagan el bono de miembro de mesa.",
      "Sí, siempre que no avise a su partido.",
      "Sí, si ningún otro elector quiere asumir."
    ],
    "answer": 0,
    "explanation": "La ley electoral prohíbe expresamente que los personeros asuman como miembros de mesa."
  },
  {
    "id": 45,
    "question": "¿Qué es la lista de electores de una mesa de sufragio?",
    "options": [
      "Es el documento oficial con la relación de ciudadanos habilitados para votar en esa mesa, con sus fotos, y con espacios para registrar su firma e impresión dactilar después de votar.",
      "Es una lista de los vecinos que pagaron sus arbitrios.",
      "Es el padrón de afiliados del partido que ganó las elecciones anteriores.",
      "Es la relación de personas designadas como miembros de mesa y personeros para la jornada electoral."
    ],
    "answer": 0,
    "explanation": "El padrón electoral contiene la lista oficial de todos los ciudadanos habilitados para votar en esa mesa."
  },
  {
    "id": 46,
    "question": "¿Cómo comprueba el secretario que un ciudadano ya emitió su voto en el padrón?",
    "options": [
      "El elector coloca su firma y su huella dactilar en el recuadro que le corresponde en la lista de electores.",
      "El elector le entrega una moneda al secretario.",
      "El elector le realiza una señal al presidente.",
      "El personero marca o tacha el nombre del elector en la lista de electores."
    ],
    "answer": 0,
    "explanation": "El elector debe firmar y poner su huella digital en el padrón electoral tras depositar su voto en el ánfora."
  },
  {
    "id": 47,
    "question": "¿Qué recibe el elector al momento de que le devuelven su DNI tras votar?",
    "options": [
      "Su Documento Nacional de Identidad (DNI) Correcta)*",
      "Un certificado de participación electoral.",
      "Una copia del acta de escrutinio.",
      "Una constancia de haber emitido su voto."
    ],
    "answer": 0,
    "explanation": "Al finalizar el voto, se le entrega su DNI con el holograma oficial pegado como constancia de sufragio."
  },
  {
    "id": 48,
    "question": "¿Qué debe verificar el personero en la camara secreta durante la instalación?",
    "options": [
      "Que este acondicionada y tenga el cartel de candidatos.",
      "Que tenga la información sobre el proceso electoral.",
      "Que este limpia y tenga buena iluminación.",
      "Que tenga las cedulas de sufragio disponibles."
    ],
    "answer": 0,
    "explanation": "La cámara secreta debe estar limpia de propaganda y garantizar el secreto absoluto del voto."
  },
  {
    "id": 49,
    "question": "¿Qué debe hacer un personero si detecta propaganda electoral dentro de la cámara secreta?",
    "options": [
      "Comunicar de inmediato a los miembros de mesa para que retiren la propaganda.",
      "Retirarla directamente sin informar a los miembros de mesa.",
      "Pegar encima propaganda de su propio partido.",
      "Solicitar al elector que vote por otra opción."
    ],
    "answer": 0,
    "explanation": "Se debe comunicar a los miembros de mesa para que retiren de inmediato cualquier material de propaganda."
  },
  {
    "id": 50,
    "question": "¿Puede el elector tomar fotos a su cédula de votación con su teléfono celular dentro de la cámara secreta?",
    "options": [
      "No, está prohibido tomar fotos o grabar el voto para proteger el secreto del sufragio.",
      "Sí, si no muestra su rostro.",
      "Sí, si es para mostrarle a su jefe de trabajo.",
      "Sí, si no publica la imagen."
    ],
    "answer": 0,
    "explanation": "Está prohibido el uso de celulares y cámaras en la cámara secreta para garantizar el voto libre y secreto."
  },
  {
    "id": 51,
    "question": "¿Qué es el cartel de candidatos pegado dentro de la cámara secreta?",
    "options": [
      "Es el documento oficial de la ONPE que muestra las listas y símbolos de todas las organizaciones políticas inscritas.",
      "Es un afiche publicitario pagado por un solo candidato.",
      "Es una lista de los electores que no fueron a votar.",
      "Es un cartel con los nombres de los miembros de mesa."
    ],
    "answer": 0,
    "explanation": "El cartel de candidatos muestra oficialmente a todos los partidos y candidatos participantes en la elección."
  },
  {
    "id": 52,
    "question": "¿Qué debe hacer el personero si nota que el cartel de candidatos de la cámara secreta fue rayado o dañado?",
    "options": [
      "Solicitar a los miembros de mesa y al coordinador de la ONPE que reemplacen el cartel por uno en buen estado.",
      "Rayar también los otros símbolos para que estén iguales.",
      "Retirar el cartel y llevárselo.",
      "No decir nada y seguir mirando."
    ],
    "answer": 0,
    "explanation": "Se debe solicitar el cambio inmediato del cartel de candidatos para no inducir a error a los votantes."
  },
  {
    "id": 53,
    "question": "¿Qué se hace con las cédulas de sufragio que sobraron porque algunos electores no vinieron a votar?",
    "options": [
      "Los miembros de mesa destruyen las cedulas no utilizadas y las colocan en la caja de restos electorales.",
      "Se reparten entre los personeros como recuerdo.",
      "Se llenan con votos a favor del partido que va ganando.",
      "Se desechan fuera del aula de votación."
    ],
    "answer": 0,
    "explanation": "Las cédulas no utilizadas se inutilizan y se guardan en su sobre oficial de material sobrante."
  },
  {
    "id": 54,
    "question": "¿Quién es el encargado de abrir cada cédula y cantar el voto en voz alta durante el escrutinio?",
    "options": [
      "El Presidente de la mesa de sufragio.",
      "El personero con más experiencia.",
      "El vigilante de la puerta del colegio.",
      "Cualquier elector que se quedó a mirar."
    ],
    "answer": 0,
    "explanation": "El Presidente de mesa es el único facultado para desdoblar las cédulas y leer los votos en voz alta."
  },
  {
    "id": 55,
    "question": "¿Qué hace el Secretario de la mesa mientras el Presidente canta los votos?",
    "options": [
      "Anota los votos en la Hoja Borrador de Escrutinio con la verificación del Tercer Miembro y personeros.",
      "Firma las constancias de los electores ausentes.",
      "Se retira temporalmente del aula mientras se realiza el conteo.",
      "Llama por teléfono a sus familiares."
    ],
    "answer": 0,
    "explanation": "El Secretario registra cada voto en la hoja borrador oficial bajo la mirada de los personeros."
  },
  {
    "id": 56,
    "question": "¿Puede un personero pedir que le muestren una cédula si tiene dudas sobre la marca?",
    "options": [
      "Sí, tiene derecho a que el presidente le muestre la cédula a la vista para verificar la marca sin tocarla.",
      "No, el personero no tiene derecho a mirar las cédulas.",
      "Solo si paga una multa al secretario.",
      "Solo si el presidente es de su mismo partido."
    ],
    "answer": 0,
    "explanation": "El personero tiene pleno derecho a visualizar la cédula para comprobar la validez de la marca."
  },
  {
    "id": 57,
    "question": "¿Qué pasa si una cédula tiene una cruz clara en un partido, pero además tiene un insulto escrito a mano?",
    "options": [
      "El voto es NULO (viciado), porque contiene inscripciones ajenas al proceso electoral.",
      "El voto es válido porque la cruz se nota.",
      "El voto vale doble por la emoción del elector.",
      "Se le suma medio voto al partido."
    ],
    "answer": 0,
    "explanation": "Cualquier texto, frase, firma o insulto escrito en la cédula la convierte automáticamente en voto nulo."
  },
  {
    "id": 58,
    "question": "¿Qué pasa si una cédula tiene una marca hecha con un lapicero que no es el oficial de la ONPE?",
    "options": [
      "Si la marca es una cruz o aspa válida, el voto es VÁLIDO. No se anula el voto por el tipo de bolígrafo.",
      "Se anula inmediatamente.",
      "Se manda a la fiscalía para peritaje.",
      "Se considera voto en blanco."
    ],
    "answer": 0,
    "explanation": "La jurisprudencia electoral protege la intención del voto; el tipo o color de tinta no anula el voto si la marca es válida."
  },
  {
    "id": 59,
    "question": "En una cedula de elección municipal provincial y distrital, ¿qué ocurre si el elector marca una organización política en la elección provincial y deja en blanco la elección distrital?",
    "options": [
      "Se considera voto válido en la elección provincial y voto en blanco en la elección distrital, porque ambas elecciones se califican de manera independiente.",
      "Se anula toda la cédula completa.",
      "Se anula la parte provincial y vale la distrital.",
      "El presidente decide a quién darle el voto distrital."
    ],
    "answer": 0,
    "explanation": "Cada columna de votación es independiente: puede ser válida en una y nula o en blanco en la otra."
  },
  {
    "id": 60,
    "question": "¿Cómo se llama el sobre de seguridad donde se guardan las actas electorales para ser llevadas a la ODPE?",
    "options": [
      "Sobre Plomo / Sobre de Seguridad de Actas Oficiales.",
      "Bolsa plástica de supermercado.",
      "Sobre transparente sin sello.",
      "Caja de zapatos."
    ],
    "answer": 0,
    "explanation": "Las actas oficiales se guardan en sobres de seguridad con precintos especiales entregados por la ONPE."
  },
  {
    "id": 61,
    "question": "¿Cuántas actas electorales se llenan y firman como mínimo en cada mesa?",
    "options": [
      "Se llenan las actas electorales para la ODPE, JEE, JNE, ONPE, Fiscalía y las copias para los personeros presentes.",
      "Solo se llena un papel y los demás le sacan copia en fotocopiadora.",
      "Solo se llena una hoja para el presidente de mesa.",
      "Se llenan 100 hojas iguales."
    ],
    "answer": 0,
    "explanation": "Se suscribe el número reglamentario de actas oficiales y las copias que correspondan a los personeros acreditados."
  },
  {
    "id": 62,
    "question": "¿Qué debe hacer el personero si un miembro de mesa se niega a entregarle su copia del Acta Electoral?",
    "options": [
      "Solicitar respetuosamente el cumplimiento de su derecho y acudir al personal de la ONPE y, de ser necesario, al fiscalizador del JNE.",
      "Retirarse del local sin solicitar el acta.",
      "Tomar el ánfora por la fuerza.",
      "Dañar las actas correspondientes a otras organizaciones políticas."
    ],
    "answer": 0,
    "explanation": "El personero acude a los representantes de la ONPE y el JNE presentes para hacer valer su derecho legal al acta."
  },
  {
    "id": 63,
    "question": "¿A qué personas se les debe dar atención preferente en la fila de votación?",
    "options": [
      "A mujeres embarazadas, personas con discapacidad, adultos mayores y personas con niños en brazos.",
      "A los personeros y las personas que lo acompañan.",
      "A los candidatos que lleguen con fotógrafos.",
      "A las personas que tienen prisa por ir al trabajo."
    ],
    "answer": 0,
    "explanation": "La ley establece atención preferente obligatoria a gestantes, adultos mayores y personas con discapacidad."
  },
  {
    "id": 64,
    "question": "¿Puede un elector votar si su DNI ha caducado o vencido recientemente?",
    "options": [
      "Sí, el RENIEC y el JNE disponen que los DNI caducos son válidos para ejercer el derecho al sufragio en la jornada electoral.",
      "No, si el DNI está vencido no puede votar bajo ninguna circunstancia.",
      "Solo si paga una multa en la mesa.",
      "Solo si vota por el partido de gobierno."
    ],
    "answer": 0,
    "explanation": "Para el día de la elección se habilita expresamente el voto con DNI caduco o vencido."
  },
  {
    "id": 65,
    "question": "¿Puede votar una persona que no figura en el padrón electoral de la mesa pero vive al frente del centro de votación?",
    "options": [
      "No. Solo pueden sufragar en la mesa las personas que figuran en su respectiva Lista de Electores.",
      "Sí, si muestra su título de propiedad.",
      "Sí, si todos los miembros de mesa son sus vecinos.",
      "Sí, pagando 10 soles al secretario."
    ],
    "answer": 0,
    "explanation": "El padrón electoral es definitivo y cerrado; nadie que no figure en él puede emitir su voto."
  },
  {
    "id": 66,
    "question": "¿Qué debe hacer el personero si considera que un elector podría estar suplantando la identidad de otra persona?",
    "options": [
      "Impugnar la identidad del elector antes de que este concluya el acto de sufragio.",
      "Esperar hasta que el elector abandone el local para formular el reclamo.",
      "Discutir verbalmente al elector.",
      "Retener por cuenta propia el DNI del elector."
    ],
    "answer": 0,
    "explanation": "La impugnación de identidad se realiza en el momento en que el elector se presenta a la mesa, antes de votar."
  },
  {
    "id": 67,
    "question": "¿Cómo se resuelve una impugnación de identidad de un elector en la mesa?",
    "options": [
      "Los miembros de mesa verifican la identidad del elector y, si la impugnación continúa, aplican el procedimiento previsto para estos casos.",
      "Los electores que se encuentran en la fila deciden mediante votación.",
      "La decisión se adopta al azar.",
      "El personero decide por sí solo si el elector debe ser detenido."
    ],
    "answer": 0,
    "explanation": "Los miembros de mesa verifican las características físicas y datos del DNI con el padrón electoral."
  },
  {
    "id": 68,
    "question": "¿Qué debe hacer el personero si durante el escrutinio se produce un corte de energía eléctrica en el aula?",
    "options": [
      "Solicitar que el material electoral permanezca debidamente resguardado sobre la mesa y que se utilice iluminación de apoyo, evitando cualquier retiro o manipulación indebida",
      "Trasladar las actas fuera del aula.",
      "Aprovechar la oscuridad para marcar cédulas.",
      "Dar por terminado el conteo con los datos que recuerden."
    ],
    "answer": 0,
    "explanation": "Se debe proteger la integridad de las cédulas y actas en la mesa con iluminación de apoyo y presencia de los miembros."
  },
  {
    "id": 69,
    "question": "¿Pueden los miembros de mesa modificar los resultados del acta una vez que ya fue firmada y cerrada?",
    "options": [
      "No. Una vez concluida, firmada y cerrada el acta, los resultados no deben ser modificados en la mesa.",
      "Sí, pueden modificar los números al día siguiente.",
      "Sí, si un personero se lo solicita.",
      "Sí, si encuentran un error una hora después."
    ],
    "answer": 0,
    "explanation": "El acta suscrita y cerrada es un documento público inmodificable; cualquier reclamo posterior se eleva al JEE."
  },
  {
    "id": 70,
    "question": "¿Qué actitud debe mantener el personero ante los miembros de mesa y personeros de otros partidos?",
    "options": [
      "Una conducta respetuosa, firme, educada, cívica y apegada a la normativa electoral.",
      "Una conducta hostil, violenta y prepotente.",
      "Una actitud de burla frente a los resultados de otras organizaciones.",
      "Una actitud indiferente frente a lo que ocurre en la mesa."
    ],
    "answer": 0,
    "explanation": "El personero representa dignamente a su organización con respeto, educación y firmeza técnica y legal."
  },
  {
    "id": 71,
    "question": "¿ Qué datos debe consignar el personero cuando firma el Acta Electoral?",
    "options": [
      "Sus nombres y apellidos, número de DNI y la organización política a la que representa.",
      "Su número de cuenta bancaria y domicilio.",
      "Información personal de sus familiares y correo electrónico.",
      "Únicamente una firma sin ninguna identificación adicional."
    ],
    "answer": 0,
    "explanation": "El personero consigna su nombre completo, DNI y el nombre del partido o movimiento que representa."
  },
  {
    "id": 72,
    "question": "¿Puede un personero abandonar su mesa de sufragio durante el conteo de votos?",
    "options": [
      "No es recomendable; debe permanecer hasta el final del escrutinio para firmar y recibir su copia del Acta Electoral.",
      "Sí, puede irse a las 5:00 p. m.",
      "Sí, es mejor que se vaya antes de que cuenten los votos.",
      "Sí, no hace falta que espere el acta."
    ],
    "answer": 0,
    "explanation": "El momento más crucial es el escrutinio; el personero debe quedarse hasta tener su acta firmada en mano."
  },
  {
    "id": 73,
    "question": "¿Qué debe hacer el personero si observa que una persona intenta votar con un DNI ajeno?",
    "options": [
      "Alertar inmediatamente al presidente de mesa y al personal de la ONPE para impedir la suplantación.",
      "Ayudarlo a firmar el padrón rápido.",
      "Cobrarle una propina para no denunciarlo.",
      "No decir nada para no causar problemas."
    ],
    "answer": 0,
    "explanation": "La suplantación de identidad es un delito grave que el personero debe evitar de inmediato denunciándolo a la mesa."
  },
  {
    "id": 74,
    "question": "¿Puede un personero de mesa presenciar y verificar el acondicionamiento de la cámara secreta antes del inicio del sufragio?",
    "options": [
      "Sí, tiene derecho a ingresar junto a los miembros de mesa para verificar que la cámara secreta esté libre de propaganda electoral y debidamente acondicionada.",
      "No, solo pueden ingresar los efectivos de la Policía Nacional.",
      "No, está prohibido que los personeros observen la cámara secreta en cualquier momento.",
      "Solo si el coordinador de la ONPE le otorga un permiso notarial."
    ],
    "answer": 0,
    "explanation": "El personero tiene el derecho y deber de presenciar la instalación y verificar que la cámara secreta garantice el secreto del voto y esté libre de propaganda."
  },
  {
    "id": 75,
    "question": "¿Quiénes tienen a su cargo el orden y la seguridad en el local de votación?",
    "options": [
      "Los efectivos de las Fuerzas Armadas y de la Policía Nacional, de acuerdo con las funciones de seguridad que les corresponden.",
      "Los personeros de mesa con mayor experiencia.",
      "Los porteros del colegio únicamente.",
      "Los candidatos a regidores."
    ],
    "answer": 0,
    "explanation": "Las Fuerzas Armadas custodian el interior del local y la Policía Nacional el exterior y alrededores."
  },
  {
    "id": 76,
    "question": "¿Pueden los efectivos de las Fuerzas Armadas o de la Policía Nacional decidir si un voto es válido o nulo?",
    "options": [
      "No, las fuerzas de seguridad no tienen ninguna competencia en decisiones electorales; solo resguardan el orden.",
      "Sí, el coronel decide qué votos valen.",
      "Sí, los policías pueden contar las cédulas.",
      "Sí, si hay empate entre los miembros de mesa."
    ],
    "answer": 0,
    "explanation": "Solo los miembros de mesa califican y cuentan los votos. La fuerza pública solo mantiene la seguridad."
  },
  {
    "id": 77,
    "question": "¿Qué se hace con las cédulas de votación escrutadas después de que los votos han sido contados y registrados en el acta?",
    "options": [
      "Las cédulas utilizadas no impugnadas se guardan en el sobre correspondiente, se completa la etiqueta con los datos requeridos, se cierra el sobre y se entrega al personal de la ONPE.",
      "Se destruyen inmediatamente en presencia de los miembros de mesa y personeros.",
      "Se guardan junto con las cédulas que no fueron utilizadas durante la jornada electoral.",
      "Se entregan a los personeros para que puedan realizar posteriormente un nuevo conteo."
    ],
    "answer": 0,
    "explanation": "Las cédulas escrutadas comunes se destruyen inmediatamente en la mesa, preservando únicamente las impugnadas."
  },
  {
    "id": 78,
    "question": "¿Por qué es tan importante que el personero cuide y entregue el Acta Electoral a su partido?",
    "options": [
      "Porque constituye un respaldo documental oficial de los resultados registrados en la mesa y permite a la organización política verificar el cómputo electoral.",
      "Porque sirve como pase de ingreso a actividades institucionales.",
      "Porque es un recuerdo personal para enmarcar.",
      "Porque tiene valor monetario en el banco."
    ],
    "answer": 0,
    "explanation": "El acta oficial es el documento legal con el que la organización política defiende sus resultados ante el jurado."
  },
  {
    "id": 79,
    "question": "¿ Qué deben hacer los miembros de mesa si, al verificar los resultados del escrutinio, detectan que el total de votos emitidos no coincide con el total de ciudadanos que votaron?",
    "options": [
      "Revisar nuevamente las sumas realizadas y, si la diferencia persiste, anotar el hecho en el campo de Observaciones del Acta de Escrutinio.",
      "Modificar el total de ciudadanos que votaron para hacerlo coincidir con la suma de votos.",
      "Anular todos los votos de la mesa y realizar nuevamente la votación.",
      "Dejar la diferencia sin registrar y continuar con el llenado del acta."
    ],
    "answer": 0,
    "explanation": "Los errores de suma se corrigen en el JEE durante el cotejo de actas oficiales y copias de personeros."
  },
  {
    "id": 80,
    "question": "¿Puede el personero tomar fotografías al Acta de Escrutinio terminada y firmada?",
    "options": [
      "Sí, una vez concluido el escrutinio y firmada el acta, es recomendable tomar una foto nítida para transmitir el resultado a su centro de cómputo.",
      "No, tomarle foto al acta firmada es delito.",
      "Solo con permiso escrito de un juez de la Corte Suprema.",
      "Solo si la foto es en blanco y negro."
    ],
    "answer": 0,
    "explanation": "Fotografiar el acta final firmada permite transmitir los resultados de inmediato al centro de monitoreo del partido."
  },
  {
    "id": 81,
    "question": "¿Qué debe hacer el personero si el presidente de mesa no sabe cómo llenar alguna casilla del acta?",
    "options": [
      "Recomendar respetuosamente que solicite la orientación del personal de la ONPE para resolver la duda técnica.",
      "Burlarse del presidente de mesa.",
      "Llenar el acta él mismo sin permiso.",
      "Retirarse del aula sin formular ninguna observación."
    ],
    "answer": 0,
    "explanation": "El personero puede orientar respetuosamente y solicitar el apoyo del personal técnico de la ONPE."
  },
  {
    "id": 82,
    "question": "¿Qué se debe verificar en el Acta Electoral antes de retirarse del aula?",
    "options": [
      "Que los datos y resultados sean legibles, que las sumas sean consistentes, que no existan casilleros indebidamente incompletos y que se encuentren las firmas correspondientes.",
      "Que el papel tenga una característica física determinada.",
      "Que tenga el sello de la comisaría del distrito.",
      "Que el documento incluya firma del personal de ONPE."
    ],
    "answer": 0,
    "explanation": "Se debe revisar minuciosamente la legibilidad, las sumas y las firmas antes de dar por cerrada la mesa."
  },
  {
    "id": 83,
    "question": "¿Qué ocurre si una persona con discapacidad visual acude a votar a la mesa?",
    "options": [
      "Tiene derecho a solicitar la plantilla braille para la cédula o ingresar acompañada por una persona de su entera confianza.",
      "No puede votar y se le pide que se retire.",
      "El personero debe marcar por ella en secreto.",
      "El policía de la puerta entra a marcar por ella."
    ],
    "answer": 0,
    "explanation": "La ONPE provee plantillas braille y permite el voto asistido por una persona de confianza del elector con discapacidad."
  },
  {
    "id": 84,
    "question": "¿Qué debe hacer el personero si observa que un miembro de mesa está visiblemente ebrio o bajo sustancias?",
    "options": [
      "Comunicar de inmediato la situación al personal de la ONPE y a las autoridades competentes para que adopten las medidas correspondientes.",
      "Permitir que continúe ejerciendo sus funciones sin formular ninguna observación.",
      "Pedirle que se retire del aula.",
      "Sentarse en su lugar y firmar por él."
    ],
    "answer": 0,
    "explanation": "Se debe denunciar a las autoridades electorales y fiscales para garantizar la validez y seriedad del acto electoral."
  },
  {
    "id": 85,
    "question": "¿Qué ocurre a las 5:00 p. m. con los electores que ya se encuentran dentro del local de votación?",
    "options": [
      "Se cierran las puertas del local y las personas que ya se encuentran dentro pueden ejercer su derecho al voto.",
      "Se botan a todos los que están en la fila sin importar nada.",
      "Solo votan los cinco primeros de la fila.",
      "Se deja la puerta abierta hasta las 8:00 p. m."
    ],
    "answer": 0,
    "explanation": "A las 5:00 p. m. se cierra el local y se garantiza el sufragio de todos los ciudadanos que se encuentren dentro."
  },
  {
    "id": 86,
    "question": "¿Qué debe hacer el personero si un miembro de mesa comete un error involuntario al sumar o anotar una cifra en la hoja borrador?",
    "options": [
      "Alertar de inmediato y con respeto a los miembros de mesa para que corrijan la cifra antes de transcribirla al Acta Electoral definitiva.",
      "Esperar a que firmen el acta final para luego intentar anular toda la mesa de votación.",
      "Quitarle los documentos al miembro de mesa y escribir él mismo los números.",
      "Guardar silencio y retirarse del aula de votación sin firmar nada."
    ],
    "answer": 0,
    "explanation": "La función de vigilancia activa del personero permite advertir y corregir a tiempo cualquier error en la hoja borrador antes del llenado definitivo del Acta Electoral."
  },
  {
    "id": 87,
    "question": "¿ Qué implica que un personero firme un acta electoral en blanco antes de que concluya el escrutinio?",
    "options": [
      "Constituye una actuación irresponsable y riesgosa; un personero nunca debe firmar un acta en blanco.",
      "Es una práctica adecuada para retirarse antes del cierre.",
      "Es una conducta recomendada por la ONPE.",
      "No genera ningún riesgo porque los datos pueden completarse posteriormente."
    ],
    "answer": 0,
    "explanation": "Bajo ninguna circunstancia se debe firmar un acta en blanco; siempre se firma cuando todos los datos están completos."
  },
  {
    "id": 88,
    "question": "¿Qué es la credencial del personero de mesa?",
    "options": [
      "Es el documento que acredita oficialmente al ciudadano para ejercer funciones como personero ante una mesa de sufragio.",
      "Es un mensaje de texto en el celular sin nombre.",
      "Es una tarjeta de presentación comercial.",
      "Es un documento firmado únicamente por el candidato."
    ],
    "answer": 0,
    "explanation": "La credencial acredita legalmente al personero ante las autoridades de la mesa y la ONPE."
  },
  {
    "id": 89,
    "question": "¿Qué debe hacer el personero si durante el sufragio un elector no sabe cómo doblar su cédula?",
    "options": [
      "El presidente de mesa puede indicarle cómo doblarla, respetando en todo momento el secreto del voto",
      "El personero debe tomar la cédula y doblarla observando el voto.",
      "El elector debe destruir la cédula y solicitar otra.",
      "Un efectivo policial debe ingresar para doblar la cédula."
    ],
    "answer": 0,
    "explanation": "Los miembros de mesa guían al elector respetando siempre la privacidad y el secreto de su decisión."
  },
  {
    "id": 90,
    "question": "¿Qué pasa si un personero llega tarde, por ejemplo a las 9:00 a. m. cuando la mesa ya está instalada?",
    "options": [
      "Puede acreditarse en ese momento y comenzar a cumplir sus funciones a partir de su llegada.",
      "Ya no puede ingresar al local de votación.",
      "Se debe desinstalar la mesa y volver a empezar de cero.",
      "Debe pagar una multa para incorporarse a la jornada."
    ],
    "answer": 0,
    "explanation": "El personero puede incorporarse a la mesa en cualquier momento de la jornada, acreditándose ante el presidente."
  },
  {
    "id": 91,
    "question": "¿Tiene el personero derecho a solicitar que una incidencia o irregularidad observada quede registrada en el Acta Electoral?",
    "options": [
      "Sí. Puede solicitar que sus observaciones o reclamos sean consignados en el espacio correspondiente del acta",
      "No, las actas no permiten escribir ninguna observación.",
      "Solo si los miembros de mesa están de acuerdo con su partido.",
      "Solo pagando un derecho de trámite."
    ],
    "answer": 0,
    "explanation": "El casillero de observaciones del acta está diseñado para asentar formalmente cualquier incidencia relevante."
  },
  {
    "id": 92,
    "question": "¿Qué representa el derecho al sufragio en el Perú?",
    "options": [
      "Es un derecho y un deber cívico de los ciudadanos, conforme a las condiciones establecidas por la Constitución y la legislación electoral..",
      "Es un trámite voluntario exclusivo de los funcionarios públicos.",
      "Es una obligación solo para personas que tienen título profesional.",
      "Es un sorteo de premios organizado por el Estado."
    ],
    "answer": 0,
    "explanation": "El sufragio es un derecho y deber constitucional para todos los ciudadanos peruanos mayores de 18 años."
  },
  {
    "id": 93,
    "question": "¿Qué documento oficial debe recibir y llevarse consigo el personero de mesa al término del escrutinio?",
    "options": [
      "Una copia idéntica y firmada del Acta Electoral (Acta de Escrutinio, Instalación y Sufragio) entregada por los miembros de mesa.",
      "La lista completa del padrón con las firmas y huellas de los electores de la mesa.",
      "El ánfora de sufragio con todas las cédulas contabilizadas.",
      "El sello oficial y el tampón dactilar de la mesa de sufragio."
    ],
    "answer": 0,
    "explanation": "La legislación electoral garantiza el derecho de cada personero de mesa acreditado a recibir una copia auténtica del Acta Electoral firmada por los miembros de mesa."
  },
  {
    "id": 94,
    "question": "¿Cuál es la función del fiscalizador del Jurado Nacional de Elecciones (JNE) en el local de votación?",
    "options": [
      "Fiscalizar el cumplimiento de la normativa electoral y el adecuado desarrollo del proceso dentro del ámbito de sus competencias.",
      "Contar las cédulas de votación junto a los miembros de mesa.",
      "Hacer propaganda para los candidatos regionales.",
      "Revisar las pertenencias personales de los electores."
    ],
    "answer": 0,
    "explanation": "El fiscalizador del JNE vela por el cumplimiento de las normas y la legalidad del proceso en los locales."
  },
  {
    "id": 95,
    "question": "¿Qué debe hacer el personero si encuentra a una persona repartiendo volantes dentro del centro de votación?",
    "options": [
      "Comunicar de inmediato el hecho al fiscalizador del JNE, al personal de la ONPE y, de ser necesario, a las fuerzas del orden.",
      "Pedirle volantes para repartirlos él también.",
      "Quedarse callado para no generar molestias.",
      "Comprarle los volantes para botarlos."
    ],
    "answer": 0,
    "explanation": "Hacer propaganda en el local es un delito electoral; se debe denunciar de inmediato a los fiscalizadores y a la policía/militar."
  },
  {
    "id": 96,
    "question": "¿Qué debe hacer el personero cuando concluye toda la jornada electoral y ya tiene su acta firmada?",
    "options": [
      "Entregar o transmitir de inmediato su acta y reporte a su personero de local de votación.",
      "Publicarla en redes sociales con datos personales borrados.",
      "Romper el acta porque ya terminó la votación.",
      "Retirarse sin reportar los resultados a su organización política."
    ],
    "answer": 0,
    "explanation": "La misión del personero culmina entregando con éxito el acta electoral y los resultados al equipo central de su partido."
  },
  {
    "id": 97,
    "question": "¿Por qué el personero de mesa representa la primera línea de defensa democrática del voto popular?",
    "options": [
      "Porque su presencia, vigilancia y registro de los resultados contribuyen a verificar que la voluntad expresada por los electores sea respetada.",
      "Porque tiene inmunidad diplomática el día de la elección.",
      "Porque recibe una remuneración del Estado por decidir los resultados.",
      "Porque determina qué candidatos continúan en el proceso electoral."
    ],
    "answer": 0,
    "explanation": "El personero cuida la democracia asegurando con transparencia que cada voto emitido sea contado con total fidelidad."
  },
  {
    "id": 98,
    "question": "¿Qué valores y actitudes deben caracterizar a un buen personero de mesa durante la jornada electoral?",
    "options": [
      "Puntualidad, honestidad, firmeza, respeto, concentración y compromiso con el cumplimiento de sus funciones.",
      "Impuntualidad, confrontación con los electores y distracción constante.",
      "Firma de documentos incompletos y abandono anticipado de la mesa.",
      "Pelear con los miembros de mesa por cualquier motivo."
    ],
    "answer": 0,
    "explanation": "La puntualidad, el respeto, la concentración y el civismo garantizan un desempeño impecable en la mesa."
  },
  {
    "id": 99,
    "question": "¿Cómo se califica un voto donde el elector marcó una cruz sobre el símbolo de un partido y no realiza otra marca en la otra elección?",
    "options": [
      "Es un VOTO VÁLIDO a favor de esa organización política en esa elección.",
      "Es un voto nulo por no marcar a las demás organizaciones políticas.",
      "Es un voto en blanco porque faltan otras marcas.",
      "Es un voto observado que debe desercharse."
    ],
    "answer": 0,
    "explanation": "Es el voto válido clásico y reglamentario a favor de la organización política elegida."
  },
  {
    "id": 100,
    "question": "¿Cuál debe ser la principal consigna del personero de mesa al finalizar el escrutinio?",
    "options": [
      "Proteger y defender cada voto con responsabilidad, respeto a la normativa electoral y verificando que cuente con su copia del Acta Electoral debidamente firmada.",
      "Retirarse antes de que concluya el procedimiento para evitar demoras.",
      "Cuestionar sin fundamento todas las decisiones de los miembros de mesa.",
      "Manipular y volver a contar directamente las cédulas sin autorización."
    ],
    "answer": 0,
    "explanation": "Defender cada voto con firmeza cívica, respeto a la ley electoral y con el Acta Oficial firmada en la mano."
  }
];

/**
 * Función para obtener un conjunto de preguntas aleatorias para la evaluación
 * @param {number} count - Cantidad de preguntas requeridas (por defecto 5)
 * @returns {Array} - Lista de preguntas seleccionadas aleatoriamente
 */
export function getRandomQuestions(count = 5) {
  const shuffled = [...QUESTION_BANK];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  // Barajar las alternativas de cada pregunta para mayor aleatoriedad
  return selected.map(q => {
    const originalAnswerText = q.options[q.answer];
    const shuffledOptions = [...q.options];

    for (let i = shuffledOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
    }

    const newAnswerIndex = shuffledOptions.indexOf(originalAnswerText);

    return {
      ...q,
      options: shuffledOptions,
      answer: newAnswerIndex
    };
  });
}
