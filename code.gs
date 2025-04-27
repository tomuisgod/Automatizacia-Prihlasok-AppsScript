const rawPaymentData = `1. oddiel skautov brata Runca 		140 €	130 €	120 €	110 €	100 € 90 €	80 €	70 €	60 €	50 €	40 €	30 €
1. roj včielok		40 €	20 €	40 €	20 €	20 €	5 €	20 €	5 €	10 €	5 €	10 €	5 €
1. voj vĺčat		40 €	20 €	40 €	20 €	20 €	5 €	20 €	5 €	10 €	5 €	10 €	5 €
2. oddiel skautiek Čunkšipi čokan		140 €	130 €	120 €	110 €	100 € 90 €	80 €	70 €	60 €	50 €	40 €	30 €
1. oddiel dospelých a priaznivcov		25 €	20 €	25 €	20 €	25 €	20 €	25 €	20 €	25 €	20 €	25 €	20 €
1. rangersko roverský oddiel		35 €	20 €	35 €	20 €	35 €	20 €	35 €	20 €	35 €	20 €	35 €	20 €
2. oddiel dospelých a rodín Dinosaury		30 €	20 €	30 €	20 €	15 €	5 €	15 €	5 €	10 €	5 €	10 €	5 €`;
const year = "2025"
const iban = "SK6511000000002625738506"
const constsymbol = "8080"

// Oddiel |	E-mail | Tel. číslo na ZZ	| Meno a priezvisko | Vek |	Veľkost trička | špecifické požiadavky na jedlo |	Zdravotné obmedzenia | lieky | Termín pobytu |	Poznámka	| potvrdenie o platbe |	Pridať súrodenca

function onFormSubmit(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var targetSheet = sheet.getSheetByName("Platby");

  if (!targetSheet) {
    Logger.log("Hárok 'Platby' neexistuje.");
    return;
  }

  var responses = e.values;
  const timestamp = String(Date.now())
  const varsymbol = timestamp.slice(-10)

  var currentRow = targetSheet.getLastRow() + 1; // Začíname na prvom voľnom riadku
  var startCol = 1; // Začíname v stĺpci A
  var currentCol = startCol;

  const oddiely = new Array();
  const veky = new Array();

  for (var i = 1; i < responses.length; i++) { // Preskočíme časovú pečiatku
    var value = responses[i];
    targetSheet.getRange(currentRow, currentCol).setValue(value);

    if (currentCol === 1) {
      oddiely.push(value);
    }
    if (currentCol === 5) {
      veky.push(parseInt(value.replace(/[^\d]/g, ''), 10));
    }
    
    currentCol++;

    if (value === "Áno") {
      // Ak je odpoveď Áno, zapíšeme variabilný symbol a skočíme na nový riadok
      targetSheet.getRange(currentRow, currentCol).setValue(varsymbol);
      currentRow++;
      currentCol = startCol;
    } 
    if (currentCol - 1 === 12 && value === "Nie") {
      // Ak je odpoveď Nie a nachádza sa v stĺpci L (12)
      Logger.log(currentCol)
      Logger.log(varsymbol)
      try {
        targetSheet.getRange(currentRow, currentCol).setValue(varsymbol);
        break;

      } catch(e) {
        Logger.log("ERROR: " + e.message)
      }
      Logger.log("Zapisujem do riadku " + currentRow + ", stĺpca " + currentCol);
    }
  }

  const payment = calculate_payment(oddiely, veky);
  const mail = responses[2]
  Logger.log(mail)
  targetSheet.getRange(currentRow, 14).setValue(payment);
  const payment_subject = responses[4].replace(/^.*\s+/, "").normalize("NFD").replace(/\p{Diacritic}/gu, "").substring(0, 25).toLowerCase() + ` tabor${year}`
  sendEmail(payment, varsymbol, payment_subject, mail)
}

function calculate_payment(oddiely, veky) {
	let sum = 0;
	if (oddiely.length != veky.length) {
		throw new Error('The oddiely and veky parameters must be of the same length and correspond to each other!');
	}

  let pocet = oddiely.length;

	for (i = 0; i < oddiely.length; i++) {
		switch (oddiely[i]) {
			case '1. roj včielok Malé ženy':
			case '1. voj vĺčat': {
        Logger.log("vav");
				sum += 75;
				break;
			}

			case '2. oddiel skautiek Čunkšipi čokan':
			case '1. oddiel skautov brata Runca - Strieborného vlka': {
        Logger.log("skauti");
				sum += 140 - 10 * (pocet - 1);
        pocet--;
				break;
			}

			case '1. rangersko-roverský oddiel Rangeroveri': {
				console.error('not yet implemented');
				return -1;
			}

			case '2. oddiel dospelých a rodín Dinosauri': {
        Logger.log("rodinky");
				if (veky[i] <= 1) {
					break;
				}

				if (veky[i] <= 6) {
					sum += 35;
					break;
				}

				sum += 65;
				break;
			}

			default: {
				throw new Error(`Unexpected string for oddiel specification: '${oddiely[i]}`);
			}
		}
	}

	return sum;
}

function buildUrl(iban, amount, msg, varsymbol, constsymbol) {
  var baseUrl = "https://www.payme.sk/";
  
  // Parametre
  var params = {
    "V": "1",
    "IBAN": iban,
    "AM": amount,
    "CC": "EUR",
    "PI": `/VS${varsymbol}/SS/KS${constsymbol}`,
    "MSG": msg
  };
  var queryString = [];
  for (var key in params) {
    if (params.hasOwnProperty(key)) {
      queryString.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
    }
  }
  if (queryString.length > 0) {
    baseUrl += '?' + queryString.join('&');
  }
  return baseUrl;
}

function generateQRCode(url) {
  var response = UrlFetchApp.fetch(url);
  var html = response.getContentText(); 
  var regex = /data:image\/(png|jpeg|jpg);base64,([A-Za-z0-9+/=]+)/g;
  var decodedImage = Utilities.base64Decode(regex.exec(html)[2]);
  var image = Utilities.newBlob(decodedImage, 'image/png', `registracia${year}.png`);
  
  return image
}

function sendEmail(payment, varsymbol, payment_subject, mail) {
  const paymentUrl = buildUrl(iban, payment, payment_subject, varsymbol, constsymbol)
  // table += "</table>"
  var body = `
<html>
<head>
<style>
table, th, td {
  padding-left: 5pt;
  padding-right: 5pt;
  border: 1px solid black;
  border-collapse: collapse;
}
</style>
</head>
<body>

<h1>Zdar,</h1>
<p>ďakujeme ti za registráciu na skautský tábor.</p>

<p>Súčet za všetkých členov je teda <b>${payment} &euro;</b>. Prosíme o uhradenie tohto členského poplatku do 3 pracovných dní v <b>jednej splátke naraz za všetkých členov</b> s nasledovnými parametrami platby:</p>
<table>
<tr><td>Číslo účtu</td><td>${iban}</td></tr>
<tr><td>Variabilný symbol</td><td><b>${varsymbol}</b></td></tr>
<tr><td>Konštantný symbol</td><td>${constsymbol}</td></tr>
<tr><td>Správa pre príjemcu</td><td>${payment_subject}</td></tr>
</table>

<p>Platbu môžete uhradiť pomocou QR kódu, ktorý je v prílohe tohoto mailu, alebo aj cez <a href=${paymentUrl}>payme link</a>.</p>

Slovenský skauting, 80.zbor Ginko Piešťany

</body>
</html>`;
console.log(mail)
console.log(body)
  MailApp.sendEmail({
    to: mail,
    subject: `Tábor ${year}`,
    htmlBody: body,
    attachments: [generateQRCode(paymentUrl)]
  });
}

function sendEmailShortenedTime(mail) {
  var body = `
<html>
<head>
<style>
table, th, td {
  padding-left: 5pt;
  padding-right: 5pt;
  border: 1px solid black;
  border-collapse: collapse;
}
</style>
</head>
<body>

<h1>Zdar,</h1>
<p>ďakujeme ti za registráciu na skautský tábor.</p>

<p>Keďže Ste si zvolili možnosť "Na kratší čas", tak je potrebné, <b>aby Ste sa ozvali táborovému vodcovi pre vyriešenie sumy - Henrik Drozd.</b> Prosíme teda o bezodkladné skontaktovanie, ďakujeme.</p>

Slovenský skauting, 80.zbor Ginko Piešťany

</body>
</html>`;
  
  MailApp.sendEmail({
    to: mail,
    subject: `Tábor ${year}`,
    htmlBody: body
  });
}

