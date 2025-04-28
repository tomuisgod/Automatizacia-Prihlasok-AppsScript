const rawPaymentData = `...`; // (your rawPaymentData stays same)
const year = "2025";
const iban = "SK6511000000002625738506";
const constsymbol = "8080";

function onFormSubmit(e) {
	// MailApp.sendEmail('misobuchta@gmail.com', 'test values', JSON.stringify(e));  // sending form contents for debugging
	var sheet = SpreadsheetApp.getActiveSpreadsheet();
	var targetSheet = sheet.getSheetByName("Platby");

	if (!targetSheet) {
		Logger.log("Hárok 'Platby' neexistuje.");
		return;
	}

	var responses = e.values;
	const timestamp = String(Date.now());
	const varsymbol = timestamp.slice(-10);
	const mail = responses[2];
	const payment_subject = responses[4]
		.replace(/^.*\s+/, "")
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.substring(0, 25)
		.toLowerCase() + ` tabor${year}`;

	var currentRow = targetSheet.getLastRow() + 1;
	var startCol = 1;
	var currentCol = startCol;

	const oddiely = [];
	const veky = [];

	for (var i = 1; i < responses.length; i++) {
		var value = responses[i];
		targetSheet.getRange(currentRow, currentCol).setValue(value);

		if (currentCol === 1) oddiely.push(value);
		if (currentCol === 5) veky.push(parseInt(value.replace(/[^\d]/g, ''), 10));

		currentCol++;

		// Handle submitting payment info
		if (currentCol - 1 === 12) {
			targetSheet.getRange(currentRow, currentCol).setValue(varsymbol);
			Logger.log(`Zapisujem do riadku ${currentRow}, stĺpca ${currentCol}`);

			var stayDuration = targetSheet.getRange(currentRow, 9).getValue();
			Logger.log(`Termin(y): ${stayDuration}`);

			if (stayDuration.includes("kratší čas") || stayDuration.includes("Kratší čas")) {
				oddiely.pop();
				veky.pop();
				targetSheet.getRange(currentRow, currentCol + 1).setValue("VYRIESIT").setBackground("#ff4040");
				currentCol++;
				try {
					// sendEmailShortenedTime(mail);
					Logger.log(`sending email about shortened time: ${mail}`);
				} catch (e) {
					Logger.log(e.message);
				}
			}

			if (value === "Nie") {
				const payment = calculate_payment(oddiely, veky);
				targetSheet.getRange(currentRow, currentCol + 1).setValue(payment);
				try {
					// sendEmail(payment, varsymbol, payment_subject, mail);
					Logger.log(`sending email to ${mail} for payment of ${payment} with var. symbol ${varsymbol}`);
				} catch (e) {
					Logger.log(e.message);
				}
				break;
			}

			// Move to new row after payment per participant
			currentRow++;
			currentCol = startCol;
		}
	}
}

function calculate_payment(oddiely, veky) {
	let sum = 0;
	if (oddiely.length != veky.length) {
		throw new Error('The oddiely and veky parameters must match in length!');
	}

	let pocet = oddiely.length;

	for (let i = 0; i < oddiely.length; i++) {
		switch (oddiely[i]) {
			case '1. roj včielok Malé ženy':
			case '1. voj vĺčat':
				sum += 75;
				break;

			case '2. oddiel skautiek Čunkšipi čokan':
			case '1. oddiel skautov brata Runca - Strieborného vlka':
				sum += 140 - 10 * (pocet - 1);
				pocet--;
				break;

			case '1. rangersko-roverský oddiel Rangeroveri':
				console.error('not yet implemented');
				return -1;

			case '2. oddiel dospelých a rodín Dinosauri':
				if (veky[i] <= 1) break;
				if (veky[i] <= 6) {
					sum += 35;
				} else if (veky[i] <= 13) {
					sum += 45;
				} else {
					sum += 65
				}
				break;

			default:
				throw new Error(`Unexpected oddiel: '${oddiely[i]}'`);
		}
	}
	return sum;
}

function buildUrl(iban, amount, msg, varsymbol, constsymbol) {
	var baseUrl = "https://www.payme.sk/";
	var params = {
		"V": "1",
		"IBAN": iban,
		"AM": amount,
		"CC": "EUR",
		"PI": `/VS${varsymbol}/SS/KS${constsymbol}`,
		"MSG": msg
	};
	var queryString = Object.keys(params)
		.map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
		.join('&');

	return baseUrl + '?' + queryString;
}

function generateQRCode(url) {
	var response = UrlFetchApp.fetch(url);
	var html = response.getContentText();
	var regex = /data:image\/(png|jpeg|jpg);base64,([A-Za-z0-9+/=]+)/g;
	var decodedImage = Utilities.base64Decode(regex.exec(html)[2]);
	var image = Utilities.newBlob(decodedImage, 'image/png', `registracia${year}.png`);

	return image;
}

function sendEmail(payment, varsymbol, payment_subject, mail) {
	const paymentUrl = buildUrl(iban, payment, payment_subject, varsymbol, constsymbol);

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

		<p>Platbu môžete uhradiť pomocou QR kódu v prílohe alebo cez <a href="${paymentUrl}">payme link</a>.</p>

		<p>Slovenský skauting, 80.zbor Ginko Piešťany</p>

		</body>
		</html>`;

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

		<p>Keďže ste si zvolili možnosť "Na kratší čas", je potrebné skontaktovať táborového vodcu Henrik Drozd ohľadom dohodnutia sumy. Prosíme, aby ste sa mu ozvali čo najskôr, ďakujeme.</p>

		<p>Slovenský skauting, 80.zbor Ginko Piešťany</p>

		</body>
		</html>`;

	MailApp.sendEmail({
to: mail,
subject: `Tábor ${year} | Kratší čas pobytu`,
htmlBody: body
});
}

