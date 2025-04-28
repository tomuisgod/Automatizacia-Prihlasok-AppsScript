function onFormSubmit(e) {
  // MailApp.sendEmail('misobuchta@gmail.com', 'test values', JSON.stringify(e));  // sending form contents for debugging
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var targetSheet = sheet.getSheetByName("Platby");

  if (!targetSheet) {
    throw new Error("Hárok 'Platby' neexistuje.");
  }

  var responses = e.values;
  const timestamp = String(Date.now());
  const varsymbol = timestamp.slice(-10);
  const mail = responses[2];
  const payment_subject = get_payment_subject(responses[4]);

  var currentRow = targetSheet.getLastRow() + 1;
  var startCol = 1;
  var currentCol = startCol;

  const oddiely = [];
  const terminy = [];
  const veky = [];
  
  let discount = 0;
  const staffSheet = sheet.getSheetByName("staff_zlavy");
  const staffNames = staffSheet.getRange(1, 1, staffSheet.getLastRow(), 1).getValues().flat().map(p => p.trim());
  const fullDiscountNames = ['Matúš Malina', 'Petra Rubaninská'];

  for (var i = 1; i < responses.length; i++) {
    var value = responses[i];
    targetSheet.getRange(currentRow, currentCol).setValue(value);

let fullDiscount = false; // zapamätáme si, či ide o plné odpustenie platby

for (var i = 1; i < responses.length; i++) {
  var value = responses[i];
  targetSheet.getRange(currentRow, currentCol).setValue(value);

    if (currentCol === 1) {
      oddiely.push(value);
    }

    if (currentCol === 4) {
      const trimmedName = value.trim();
      fullDiscount = false; // predvolene nie

      if (fullDiscountNames.includes(trimmedName)) {
        fullDiscount = true; // bude úplné odpustenie platby
      } else if (staffNames.includes(trimmedName)) {
        discount += 25;
      }
    }

    if (currentCol === 5) { // vek
      if (!fullDiscount) {
        const age = parseInt(value.replace(/[^\d]/g, ''), 10);
        veky.push(age);
      }
    }

    if (currentCol === 9) { // termíny
      if (!fullDiscount) {
        const terminySplit = value.split(',').map(p => p.trim());
        terminy.push(terminySplit);
      }
    }

    currentCol++;

    // Handle submitting payment info
    if (currentCol - 1 === 12) {
      targetSheet.getRange(currentRow, currentCol).setValue(varsymbol);
      Logger.log(`Zapisujem variabilný symbol do riadku ${currentRow}, stĺpca ${currentCol}`);

      var stayDuration = targetSheet.getRange(currentRow, 9).getValue();
      Logger.log(`Termin(y): '${stayDuration}'`);

      if (stayDuration.includes("kratší čas") || stayDuration.includes("Kratší čas")) {
        terminy.pop();  // do not include this person into the calculations
        veky.pop();
        targetSheet.getRange(currentRow, currentCol + 1).setValue("VYRIESIT").setBackground("#ff4040");
        currentCol++; // moving to next cell after writing
        try {
          // sendEmailShortenedTime(mail);
          Logger.log(`sending email about shortened time: ${mail}`);
        } catch (e) {
          Logger.log(`ERROR sending mail to ${mail}: '${e.message}'`);
        }
      }

      if (value === "Nie") {
        const payment = calculate_payment(oddiely, terminy, veky) - discount;

        targetSheet.getRange(currentRow, currentCol + 1).setValue(payment);
        
        try {
          Logger.log(`sending email to ${mail} for payment of ${payment} with var. symbol ${varsymbol}`);
        } catch (e) {
          Logger.log(`ERROR sending mail to ${mail}: '${e.message}'`);
        }
        break;
    }


      // Move to new row after payment per participant
      currentRow++;
      currentCol = startCol;
    }
  }
}

function get_payment_subject(name) {
  return name
    .replace(/^.*\s+/, "")
    .normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
    .replace(/\p{Diacritic}/gu, "")
    .substring(0, 25)
    .toLowerCase() + ` tabor${year}`;
}
}
