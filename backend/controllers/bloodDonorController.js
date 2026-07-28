const BloodDonor = require('../models/BloodDonor');
const { calculateAvailability } = require('../utils/bloodDonorHelper');

// ==========================================
// Blood Donor Info Save/Update করা
// (Personal Information Submit/Update-এর সাথে একসাথে Call হবে)
// ==========================================
const saveBloodDonorInfo = async (user_id, bloodData) => {
    // bloodData আসবে Frontend থেকে, এরকম Structure-এ:
    // { bloodGroup, hasDonatedBefore, lastDonationDate, wantsToBeDonor }

    if (!bloodData || !bloodData.bloodGroup) {
        return; // Blood Group না দিলে কিছু করার দরকার নেই
    }

    let dataToSave = {
        user_id,
        bloodGroup: bloodData.bloodGroup
    };

    // "Rather not say" হলে বাকি সব Field Empty থাকবে
    if (bloodData.bloodGroup === 'Rather not say') {
        dataToSave.hasDonatedBefore = false;
        dataToSave.lastDonationDate = null;
        dataToSave.nextAvailableDate = null;
        dataToSave.isAvailable = null;
        dataToSave.wantsToBeDonor = null;
    } else {
        dataToSave.hasDonatedBefore = bloodData.hasDonatedBefore;

        if (bloodData.hasDonatedBefore === true) {
            // আগে Donate করেছে — Date থেকে Calculate করা
            const { nextAvailableDate, isAvailable } = calculateAvailability(bloodData.lastDonationDate);

            dataToSave.lastDonationDate = bloodData.lastDonationDate;
            dataToSave.nextAvailableDate = nextAvailableDate;
            dataToSave.isAvailable = isAvailable;
            dataToSave.wantsToBeDonor = null;
        } else {
            // আগে Donate করেনি — Donor হতে চায় কিনা Save করা
            dataToSave.lastDonationDate = null;
            dataToSave.nextAvailableDate = null;
            dataToSave.isAvailable = null;
            dataToSave.wantsToBeDonor = bloodData.wantsToBeDonor;
        }
    }

    // আগে থেকে Document থাকলে Update, না থাকলে নতুন তৈরি (Upsert)
    await BloodDonor.findOneAndUpdate(
        { user_id: user_id },
        dataToSave,
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
};

// ==========================================
// Blood Donor Info আনা (Dashboard/CV-এর জন্য)
// ==========================================
const getBloodDonorInfo = async (user_id) => {
    const donorInfo = await BloodDonor.findOne({ user_id: user_id });
    return donorInfo;
};

module.exports = { saveBloodDonorInfo, getBloodDonorInfo };