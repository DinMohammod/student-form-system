// ==========================================
// Next Available Date এবং isAvailable Calculate করা
// ==========================================
function calculateAvailability(lastDonationDate) {
    const DAYS_TO_WAIT = 120;

    const lastDonation = new Date(lastDonationDate);
    const nextAvailableDate = new Date(lastDonation);
    nextAvailableDate.setDate(nextAvailableDate.getDate() + DAYS_TO_WAIT);

    const today = new Date();
    const isAvailable = today >= nextAvailableDate;

    return { nextAvailableDate, isAvailable };
}

module.exports = { calculateAvailability };