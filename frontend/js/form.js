// Auth Check

const token = requireAuth();

// Edit Mode Check 

const urlParams = new URLSearchParams(window.location.search);
const isEditMode = urlParams.get('mode') === 'edit';


// full Form Data

let formData = {
    personal: {},
    family: {},
    education: {},
    skills: [],
    experience: [],
    bloodInfo: null
};

let selectedPhotoFile = null;
let existingPhotoUrl = null;
let currentStep = 1;
const TOTAL_STEPS = 5;


// Page Load  — Edit Mode -- Data Load 

window.addEventListener('DOMContentLoaded', async () => {
    if (isEditMode) {
        await loadExistingData();
        document.getElementById('submitBtn').textContent = 'Update Application';
        document.querySelector('.step-heading').closest('.form-page') // no-op safeguard
    }
});


// Edit Mode-  Data first 

async function loadExistingData() {
    try {
        const data = await fetchProfile(token);

        if (data.application_status !== 'Completed') {
            window.location.href = 'form.html';
            return;
        }

        const { personal, family, siblings, education, skills, experience, bloodInfo } = data;

        // ---------- Personal ----------
        document.getElementById('firstName').value = personal.first_name || '';
        document.getElementById('surname').value = personal.surname || '';
        document.getElementById('gender').value = personal.gender || '';
        document.getElementById('dob').value = personal.dob ? personal.dob.split('T')[0] : '';
        document.getElementById('mobile').value = personal.mobile || '';
        document.getElementById('personalEmail').value = personal.email || '';
        document.getElementById('presentAddress').value = personal.present_address || '';
        document.getElementById('permanentAddress').value = personal.permanent_address || '';

        if (personal.photo_url) {
            existingPhotoUrl = personal.photo_url;
            const photoImg = document.getElementById('photoImg');
            const photoPlaceholder = document.getElementById('photoPlaceholder');
            photoImg.src = `http://localhost:5000${personal.photo_url}`;
            photoImg.style.display = 'block';
            photoPlaceholder.style.display = 'none';
        }

        // ---------- Family + Siblings ----------
        document.getElementById('fatherName').value = family?.father_name || '';
        document.getElementById('fatherOccupation').value = family?.father_occupation || '';
        document.getElementById('fatherMobile').value = family?.father_mobile || '';
        document.getElementById('motherName').value = family?.mother_name || '';
        document.getElementById('motherOccupation').value = family?.mother_occupation || '';
        document.getElementById('motherMobile').value = family?.mother_mobile || '';

        const siblingCount = siblings ? siblings.length : 0;
        document.getElementById('siblingCount').value = siblingCount;
        renderSiblingFields(siblingCount);

        const siblingRows = document.querySelectorAll('.sibling-row');
        siblingRows.forEach((row, i) => {
            if (siblings[i]) {
                row.querySelector('.sibling-name').value = siblings[i].sibling_name;
                row.querySelector('.sibling-relation').value = siblings[i].sibling_relation;
            }
        });

        // ---------- Education ----------
        if (education) {
            document.getElementById('schoolName').value = education.school_name || '';
            document.getElementById('sscBoard').value = education.ssc_board || '';
            document.getElementById('sscGpa').value = education.ssc_gpa ?? '';
            document.getElementById('sscYear').value = education.ssc_year ?? '';
            document.getElementById('collegeName').value = education.college_name || '';
            document.getElementById('hscBoard').value = education.hsc_board || '';
            document.getElementById('hscGpa').value = education.hsc_gpa ?? '';
            document.getElementById('hscYear').value = education.hsc_year ?? '';
            document.getElementById('university').value = education.university || '';
            document.getElementById('department').value = education.department || '';
            document.getElementById('semester').value = education.semester || '';
            document.getElementById('cgpa').value = education.cgpa ?? '';
        }

        // ---------- Skills ----------
        if (skills && skills.length > 0) {
            skills.forEach(skill => {
                addSkillRow();
                const rows = document.querySelectorAll('.skill-row');
                const lastRow = rows[rows.length - 1];
                lastRow.querySelector('.skill-name').value = skill.skill_name;
                lastRow.querySelector('.skill-proficiency').value = skill.proficiency;
            });
        }

        // ---------- Experience ----------
        if (experience && experience.length > 0) {
            experience.forEach(exp => {
                addExperienceRow();
                const rows = document.querySelectorAll('.experience-row');
                const lastRow = rows[rows.length - 1];
                lastRow.querySelector('.exp-company').value = exp.company_name;
                lastRow.querySelector('.exp-position').value = exp.position;
                lastRow.querySelector('.exp-start').value = exp.start_date ? exp.start_date.split('T')[0] : '';

                if (exp.is_current) {
                    lastRow.querySelector('.exp-current').checked = true;
                    lastRow.querySelector('.exp-end').disabled = true;
                } else if (exp.end_date) {
                    lastRow.querySelector('.exp-end').value = exp.end_date.split('T')[0];
                }

                lastRow.querySelector('.exp-desc').value = exp.description || '';
            });
        }

        // ---------- Blood Donation Info ----------
        if (bloodInfo) {
            document.getElementById('bloodGroup').value = bloodInfo.bloodGroup || '';

            if (bloodInfo.bloodGroup && bloodInfo.bloodGroup !== 'Rather not say') {
                donationQuestionWrap.classList.remove('hidden');

                if (bloodInfo.hasDonatedBefore) {
                    document.querySelector('input[name="donatedBefore"][value="yes"]').checked = true;
                    donatedYesWrap.classList.remove('hidden');
                    if (bloodInfo.lastDonationDate) {
                        document.getElementById('lastDonationDate').value = bloodInfo.lastDonationDate.split('T')[0];
                        lastDonationDateInput.dispatchEvent(new Event('change'));
                    }
                } else {
                    document.querySelector('input[name="donatedBefore"][value="no"]').checked = true;
                    donatedNoWrap.classList.remove('hidden');
                    if (bloodInfo.wantsToBeDonor !== null && bloodInfo.wantsToBeDonor !== undefined) {
                        const radioValue = bloodInfo.wantsToBeDonor ? 'yes' : 'no';
                        const radioEl = document.querySelector(`input[name="wantsToBeDonor"][value="${radioValue}"]`);
                        if (radioEl) radioEl.checked = true;
                    }
                }
            }
        }

    } catch (error) {
        console.error('Load Existing Data Error:', error);
    }
}


// Step Switch 

function goToStep(targetStep) {
    if (targetStep > currentStep) {
        const isValid = validateStep(currentStep);
        if (!isValid) return;
        saveStepData(currentStep);
    }

    document.querySelectorAll('.form-step').forEach(section => {
        section.classList.remove('active');
    });

    document.getElementById('step' + targetStep).classList.add('active');

    document.querySelectorAll('.step-item').forEach(item => {
        const stepNum = parseInt(item.dataset.step);
        item.classList.remove('active', 'done');

        if (stepNum === targetStep) {
            item.classList.add('active');
        } else if (stepNum < targetStep) {
            item.classList.add('done');
        }
    });

    currentStep = targetStep;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


// Photo Upload Handle

const photoInput = document.getElementById('photoInput');
const photoImg = document.getElementById('photoImg');
const photoPlaceholder = document.getElementById('photoPlaceholder');
const photoError = document.getElementById('photoError');

photoInput.addEventListener('change', () => {
    const file = photoInput.files[0];
    photoError.textContent = '';

    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
        photoError.textContent = 'শুধু JPG/PNG Image দাও';
        photoInput.value = '';
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        photoError.textContent = ' The photo can be a maximum of 5MB.';
        photoInput.value = '';
        return;
    }

    selectedPhotoFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
        photoImg.src = e.target.result;
        photoImg.style.display = 'block';
        photoPlaceholder.style.display = 'none';
    };
    reader.readAsDataURL(file);
});

// Present Address Same as Permanent Checkbox

const sameAddressCheckbox = document.getElementById('sameAddress');
const presentAddressField = document.getElementById('presentAddress');
const permanentAddressField = document.getElementById('permanentAddress');

sameAddressCheckbox.addEventListener('change', () => {
    if (sameAddressCheckbox.checked) {
        permanentAddressField.value = presentAddressField.value;
        permanentAddressField.disabled = true;
    } else {
        permanentAddressField.disabled = false;
    }
});

presentAddressField.addEventListener('input', () => {
    if (sameAddressCheckbox.checked) {
        permanentAddressField.value = presentAddressField.value;
    }
});


// ==========================================
// Blood Group এবং Donation Logic
// ==========================================
const bloodGroupSelect = document.getElementById('bloodGroup');
const donationQuestionWrap = document.getElementById('donationQuestionWrap');
const donatedYesWrap = document.getElementById('donatedYesWrap');
const donatedNoWrap = document.getElementById('donatedNoWrap');
const lastDonationDateInput = document.getElementById('lastDonationDate');
const availabilityMessage = document.getElementById('availabilityMessage');

bloodGroupSelect.addEventListener('change', () => {
    const value = bloodGroupSelect.value;

    if (!value || value === 'Rather not say') {
        donationQuestionWrap.classList.add('hidden');
    } else {
        donationQuestionWrap.classList.remove('hidden');
    }
});

document.querySelectorAll('input[name="donatedBefore"]').forEach(radio => {
    radio.addEventListener('change', () => {
        if (radio.value === 'yes') {
            donatedYesWrap.classList.remove('hidden');
            donatedNoWrap.classList.add('hidden');
        } else {
            donatedNoWrap.classList.remove('hidden');
            donatedYesWrap.classList.add('hidden');
        }
    });
});

lastDonationDateInput.addEventListener('change', () => {
    if (!lastDonationDateInput.value) {
        availabilityMessage.classList.add('hidden');
        return;
    }

    const { isAvailable, nextAvailableDate, daysLeft } = calculateAvailabilityPreview(lastDonationDateInput.value);

    availabilityMessage.classList.remove('hidden');

    if (isAvailable) {
        availabilityMessage.className = 'availability-box eligible';
        availabilityMessage.textContent = "✅ You're eligible to donate again right now!";
    } else {
        availabilityMessage.className = 'availability-box waiting';
        const formattedDate = nextAvailableDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        availabilityMessage.textContent = `⏳ Available again in ${daysLeft} days (on ${formattedDate})`;
    }
});

function calculateAvailabilityPreview(lastDonationDateStr) {
    const DAYS_TO_WAIT = 120;
    const lastDonation = new Date(lastDonationDateStr);
    const nextAvailableDate = new Date(lastDonation);
    nextAvailableDate.setDate(nextAvailableDate.getDate() + DAYS_TO_WAIT);

    const today = new Date();
    const isAvailable = today >= nextAvailableDate;
    const daysLeft = Math.ceil((nextAvailableDate - today) / (1000 * 60 * 60 * 24));

    return { isAvailable, nextAvailableDate, daysLeft: daysLeft > 0 ? daysLeft : 0 };
}


// Validation

function validateStep(step) {
    if (step === 1) {
        const firstName = document.getElementById('firstName').value.trim();
        const surname = document.getElementById('surname').value.trim();
        const gender = document.getElementById('gender').value;
        const dob = document.getElementById('dob').value;
        const mobile = document.getElementById('mobile').value.trim();
        const email = document.getElementById('personalEmail').value.trim();
        const presentAddress = document.getElementById('presentAddress').value.trim();
        const permanentAddress = document.getElementById('permanentAddress').value.trim();

        if (!firstName || !surname || !gender || !dob || !mobile || !email || !presentAddress || !permanentAddress) {
            showStepError('step1Error', 'Fill up all field');
            return false;
        }

        clearStepError('step1Error');
        return true;
    }

    if (step === 2) {
        const fatherName = document.getElementById('fatherName').value.trim();
        const motherName = document.getElementById('motherName').value.trim();

        if (!fatherName || !motherName) {
            showStepError('step2Error', 'Give me your father and mother name');
            return false;
        }

        const siblingRows = document.querySelectorAll('.sibling-row');
        for (const row of siblingRows) {
            const name = row.querySelector('.sibling-name').value.trim();
            const relation = row.querySelector('.sibling-relation').value.trim();
            if (!name || !relation) {
                showStepError('step2Error', 'Provide the names and relationships of all siblings.');
                return false;
            }
        }

        clearStepError('step2Error');
        return true;
    }

    if (step === 3) {
        const schoolName = document.getElementById('schoolName').value.trim();
        const collegeName = document.getElementById('collegeName').value.trim();
        const university = document.getElementById('university').value.trim();

        if (!schoolName || !collegeName || !university) {
            showStepError('step3Error', 'Give me your School, College, University');
            return false;
        }

        clearStepError('step3Error');
        return true;
    }

    if (step === 4) {
        const skillRows = document.querySelectorAll('.skill-row');
        for (const row of skillRows) {
            const name = row.querySelector('.skill-name').value.trim();
            const proficiency = row.querySelector('.skill-proficiency').value;
            if (!name || !proficiency) {
                showStepError('step4Error', 'When adding a skill, provide both the name and the proficiency.');
                return false;
            }
        }

        clearStepError('step4Error');
        return true;
    }

    if (step === 5) {
        const expRows = document.querySelectorAll('.experience-row');
        for (const row of expRows) {
            const company = row.querySelector('.exp-company').value.trim();
            const position = row.querySelector('.exp-position').value.trim();
            const startDate = row.querySelector('.exp-start').value;
            if (!company || !position || !startDate) {
                showStepError('step5Error', 'When adding experience, provide the Company, Position, and Start Date.');
                return false;
            }
        }

        clearStepError('step5Error');
        return true;
    }

    return true;
}

function showStepError(elementId, text) {
    document.getElementById(elementId).textContent = text;
}

function clearStepError(elementId) {
    document.getElementById(elementId).textContent = '';
}


// Step Data Save 

function saveStepData(step) {
    if (step === 1) {
        formData.personal = {
            first_name: document.getElementById('firstName').value.trim(),
            surname: document.getElementById('surname').value.trim(),
            gender: document.getElementById('gender').value,
            dob: document.getElementById('dob').value,
            mobile: document.getElementById('mobile').value.trim(),
            email: document.getElementById('personalEmail').value.trim(),
            present_address: document.getElementById('presentAddress').value.trim(),
            permanent_address: document.getElementById('permanentAddress').value.trim()
        };

        // ---------- Blood Donation Info ----------
        const bloodGroupValue = document.getElementById('bloodGroup').value;

        if (!bloodGroupValue) {
            formData.bloodInfo = null;
        } else if (bloodGroupValue === 'Rather not say') {
            formData.bloodInfo = { bloodGroup: bloodGroupValue };
        } else {
            const donatedBeforeRadio = document.querySelector('input[name="donatedBefore"]:checked');
            const hasDonatedBefore = donatedBeforeRadio ? donatedBeforeRadio.value === 'yes' : false;

            if (hasDonatedBefore) {
                formData.bloodInfo = {
                    bloodGroup: bloodGroupValue,
                    hasDonatedBefore: true,
                    lastDonationDate: document.getElementById('lastDonationDate').value || null
                };
            } else {
                const wantsRadio = document.querySelector('input[name="wantsToBeDonor"]:checked');
                formData.bloodInfo = {
                    bloodGroup: bloodGroupValue,
                    hasDonatedBefore: false,
                    wantsToBeDonor: wantsRadio ? wantsRadio.value === 'yes' : false
                };
            }
        }
    }

    if (step === 2) {
        const siblings = [];
        document.querySelectorAll('.sibling-row').forEach(row => {
            siblings.push({
                name: row.querySelector('.sibling-name').value.trim(),
                relation: row.querySelector('.sibling-relation').value.trim()
            });
        });

        formData.family = {
            father_name: document.getElementById('fatherName').value.trim(),
            father_occupation: document.getElementById('fatherOccupation').value.trim(),
            father_mobile: document.getElementById('fatherMobile').value.trim(),
            mother_name: document.getElementById('motherName').value.trim(),
            mother_occupation: document.getElementById('motherOccupation').value.trim(),
            mother_mobile: document.getElementById('motherMobile').value.trim(),
            siblings: siblings
        };
    }

    if (step === 3) {
        formData.education = {
            school_name: document.getElementById('schoolName').value.trim(),
            ssc_board: document.getElementById('sscBoard').value.trim(),
            ssc_gpa: parseFloat(document.getElementById('sscGpa').value) || null,
            ssc_year: parseInt(document.getElementById('sscYear').value) || null,
            college_name: document.getElementById('collegeName').value.trim(),
            hsc_board: document.getElementById('hscBoard').value.trim(),
            hsc_gpa: parseFloat(document.getElementById('hscGpa').value) || null,
            hsc_year: parseInt(document.getElementById('hscYear').value) || null,
            university: document.getElementById('university').value.trim(),
            department: document.getElementById('department').value.trim(),
            semester: document.getElementById('semester').value.trim(),
            cgpa: parseFloat(document.getElementById('cgpa').value) || null
        };
    }

    if (step === 4) {
        const skills = [];
        document.querySelectorAll('.skill-row').forEach(row => {
            skills.push({
                skill_name: row.querySelector('.skill-name').value.trim(),
                proficiency: row.querySelector('.skill-proficiency').value
            });
        });
        formData.skills = skills;
    }

    if (step === 5) {
        const experience = [];
        document.querySelectorAll('.experience-row').forEach(row => {
            const isCurrent = row.querySelector('.exp-current').checked;
            experience.push({
                company_name: row.querySelector('.exp-company').value.trim(),
                position: row.querySelector('.exp-position').value.trim(),
                start_date: row.querySelector('.exp-start').value,
                end_date: isCurrent ? null : row.querySelector('.exp-end').value || null,
                is_current: isCurrent,
                description: row.querySelector('.exp-desc').value.trim()
            });
        });
        formData.experience = experience;
    }
}


// Sibling Dynamic Field

const siblingCountInput = document.getElementById('siblingCount');
const siblingContainer = document.getElementById('siblingContainer');

siblingCountInput.addEventListener('input', () => {
    const count = parseInt(siblingCountInput.value) || 0;
    renderSiblingFields(count);
});

function renderSiblingFields(count) {
    siblingContainer.innerHTML = '';

    for (let i = 1; i <= count; i++) {
        const row = document.createElement('div');
        row.className = 'sibling-row';
        row.innerHTML = `
            <div class="field">
                <label>Sibling ${i} Name</label>
                <input type="text" class="sibling-name" placeholder="Name">
            </div>
            <div class="field">
                <label>Sibling ${i} Relation</label>
                <input type="text" class="sibling-relation" placeholder="Brother / Sister">
            </div>
        `;
        siblingContainer.appendChild(row);
    }
}

// Skills Dynamic Field

const skillContainer = document.getElementById('skillContainer');

function addSkillRow() {
    const row = document.createElement('div');
    row.className = 'dynamic-row skill-row';
    row.innerHTML = `
        <button type="button" class="remove-row-btn" onclick="this.parentElement.remove()">Remove</button>
        <div class="field-grid">
            <div class="field">
                <label>Skill Name</label>
                <input type="text" class="skill-name" placeholder="JavaScript">
            </div>
            <div class="field">
                <label>Proficiency</label>
                <select class="skill-proficiency">
                    <option value="">Select</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                </select>
            </div>
        </div>
    `;
    skillContainer.appendChild(row);
}


// Experience Dynamic Field

const experienceContainer = document.getElementById('experienceContainer');

function addExperienceRow() {
    const row = document.createElement('div');
    row.className = 'dynamic-row experience-row';
    row.innerHTML = `
        <button type="button" class="remove-row-btn" onclick="this.parentElement.remove()">Remove</button>
        <div class="field-grid">
            <div class="field field-full">
                <label>Company Name</label>
                <input type="text" class="exp-company" placeholder="ABC Ltd.">
            </div>
            <div class="field">
                <label>Position</label>
                <input type="text" class="exp-position" placeholder="Junior Developer">
            </div>
            <div class="field">
                <label>Start Date</label>
                <input type="date" class="exp-start">
            </div>
            <div class="field">
                <label>End Date</label>
                <input type="date" class="exp-end">
            </div>
            <div class="field field-full">
                <div class="exp-current-row">
                    <input type="checkbox" class="exp-current" onchange="toggleCurrentJob(this)">
                    <label style="margin:0;">এখনো এখানে কাজ করছি (Currently Working)</label>
                </div>
            </div>
            <div class="field field-full">
                <label>Description</label>
                <textarea class="exp-desc" rows="2" placeholder="তোমার দায়িত্ব সংক্ষেপে লিখো"></textarea>
            </div>
        </div>
    `;
    experienceContainer.appendChild(row);
}

function toggleCurrentJob(checkbox) {
    const row = checkbox.closest('.experience-row');
    const endDateField = row.querySelector('.exp-end');
    if (checkbox.checked) {
        endDateField.value = '';
        endDateField.disabled = true;
    } else {
        endDateField.disabled = false;
    }
}




async function submitApplication() {
    const isValid = validateStep(5);
    if (!isValid) return;

    saveStepData(5);

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = isEditMode ? 'Updating...' : 'Submitting...';

    try {
        const fd = new FormData();

        fd.append('personal', JSON.stringify(formData.personal));
        fd.append('family', JSON.stringify(formData.family));
        fd.append('education', JSON.stringify(formData.education));
        fd.append('skills', JSON.stringify(formData.skills));
        fd.append('experience', JSON.stringify(formData.experience));

        if (formData.bloodInfo) {
            fd.append('bloodInfo', JSON.stringify(formData.bloodInfo));
        }

        if (selectedPhotoFile) {
            fd.append('photo', selectedPhotoFile);
        }

        const url = isEditMode ? `${API_BASE}/form/update` : `${API_BASE}/form/submit`;
        const method = isEditMode ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: fd
        });

        const data = await response.json();

        if (!response.ok) {
            showStepError('step5Error', data.message || 'Submit করতে সমস্যা হয়েছে');
            submitBtn.disabled = false;
            submitBtn.textContent = isEditMode ? 'Update Application' : 'Submit Application';
            return;
        }

        window.location.href = isEditMode ? 'dashboard.html' : 'success.html';

    } catch (error) {
        console.error('Submit Error:', error);
        showStepError('step5Error', 'Server-এর সাথে Connect করা যাচ্ছে না');
        submitBtn.disabled = false;
        submitBtn.textContent = isEditMode ? 'Update Application' : 'Submit Application';
    }
}