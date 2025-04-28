const participantName = responses[4];
payment = applyDiscountIfEligible(participantName, stayDuration, payment);


function applyDiscountIfEligible(participantName, stayDuration, payment) {
	const discountNames = [
		"Tomáš Lovrant", // <- add actual names eligible for discount
		"Michal Buchman"
	];

	const isFullStay = !(stayDuration.includes("kratší čas") || stayDuration.includes("Kratší čas"));
	const isEligible = discountNames.includes(name.trim());

	if (isEligible && isFullStay) {
		return payment - 25;
	}
	return payment;
}
