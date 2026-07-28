const token = requireAuth();

let currentMode = null; // 'pro' অথবা 'bio'
let profileData = null; // Backend থেকে আসা Data এখানে Cache থাকবে

// ==========================================
// Page Load হওয়ার সাথে সাথে Data Fetch করা
// ==========================================
async function init() {
    try {
        profileData = await fetchProfile(token);

        if (profileData.application_status !== 'Completed') {
            alert('তুমি এখনো Application Submit করোনি');
            window.location.href = 'dashboard.html';
            return;
        }

    } catch (error) {
        console.error('CV Load Error:', error);
        alert('Data Load করতে সমস্যা হয়েছে');
        window.location.href = 'dashboard.html';
    }
}

init();

// ==========================================
// Mode বেছে নেওয়া (Pro CV / Bio Data)
// ==========================================
document.getElementById('proCvBtn').addEventListener('click', () => {
    setMode('pro');
});

document.getElementById('bioDataBtn').addEventListener('click', () => {
    setMode('bio');
});

document.getElementById('switchModeBtn').addEventListener('click', () => {
    setMode(currentMode === 'pro' ? 'bio' : 'pro');
});

function setMode(mode) {
    currentMode = mode;

    document.getElementById('modeSelectorWrap').classList.add('hidden');
    document.getElementById('cvPage').classList.remove('hidden');

    const familySection = document.getElementById('cvFamilySection');
    const currentModeLabel = document.getElementById('currentModeLabel');

    if (mode === 'bio') {
        familySection.style.display = 'block';
        currentModeLabel.textContent = 'Bio Data';
    } else {
        familySection.style.display = 'none';
        currentModeLabel.textContent = 'Pro CV';
    }

    renderCV(profileData);
}

// ==========================================
// CV Data রেন্ডার করা
// ==========================================
function renderCV(data) {
    const { user, personal, family, siblings, education, skills, experience } = data;

    // ---------- Header ----------
    const cvPhoto = document.getElementById('cvPhoto');
    const cvPhotoPlaceholder = document.getElementById('cvPhotoPlaceholder');

    if (personal.photo_url) {
        cvPhoto.src = `http://localhost:5000${personal.photo_url}`;
        cvPhoto.style.display = 'block';
        cvPhotoPlaceholder.style.display = 'none';
    }

    document.getElementById('cvName').textContent = `${personal.first_name} ${personal.surname}`;
    document.getElementById('cvTagline').textContent = education?.department
        ? `${education.department} Student, ${education.university || ''}`
        : 'Student';

    document.getElementById('cvEmail').textContent = personal.email;
    document.getElementById('cvMobile').textContent = personal.mobile;

    // ---------- Personal ----------
    document.getElementById('cvGender').textContent = personal.gender;
    document.getElementById('cvBloodGroup').textContent =(data.bloodInfo && data.bloodInfo.bloodGroup) ? data.bloodInfo.bloodGroup : '—';
    document.getElementById('cvDob').textContent = formatDate(personal.dob);
    document.getElementById('cvPresentAddress').textContent = personal.present_address || '—';
    document.getElementById('cvPermanentAddress').textContent = personal.permanent_address || '—';

    // ---------- Family (শুধু Bio Data Mode-এ Populate করলেই চলবে, কারণ Hidden থাকলে দেখা যাবে না) ----------
    document.getElementById('cvFatherName').textContent = family?.father_name || '—';
    document.getElementById('cvFatherOccupation').textContent = family?.father_occupation || '—';
    document.getElementById('cvMotherName').textContent = family?.mother_name || '—';
    document.getElementById('cvMotherOccupation').textContent = family?.mother_occupation || '—';

    const siblingsWrap = document.getElementById('cvSiblingsWrap');
    const siblingsList = document.getElementById('cvSiblingsList');
    if (siblings && siblings.length > 0) {
        siblingsList.innerHTML = siblings.map(s =>
            `<span class="cv-chip"><strong>${s.sibling_name}</strong> — ${s.sibling_relation}</span>`
        ).join('');
        siblingsWrap.style.display = 'block';
    } else {
        siblingsWrap.style.display = 'none';
    }

    // ---------- Education ----------
    if (education) {
        document.getElementById('cvSscSchool').textContent = education.school_name || '—';
        document.getElementById('cvSscDetail').textContent =
            `${education.ssc_board || ''} Board · GPA ${education.ssc_gpa ?? '—'} · Passed ${education.ssc_year ?? '—'}`;

        document.getElementById('cvHscCollege').textContent = education.college_name || '—';
        document.getElementById('cvHscDetail').textContent =
            `${education.hsc_board || ''} Board · GPA ${education.hsc_gpa ?? '—'} · Passed ${education.hsc_year ?? '—'}`;

        document.getElementById('cvUniversity').textContent = education.university || '—';
        document.getElementById('cvUgDetail').textContent =
            `${education.department || ''} · Semester ${education.semester || '—'} · CGPA ${education.cgpa ?? '—'}`;
    }

    // ---------- Skills ----------
    const skillsSection = document.getElementById('cvSkillsSection');
    const skillsList = document.getElementById('cvSkillsList');
    if (skills && skills.length > 0) {
        skillsList.innerHTML = skills.map(s =>
            `<span class="cv-chip"><strong>${s.skill_name}</strong> — ${s.proficiency}</span>`
        ).join('');
        skillsSection.style.display = 'block';
    } else {
        skillsSection.style.display = 'none';
    }

    // ---------- Experience ----------
    const experienceSection = document.getElementById('cvExperienceSection');
    const experienceList = document.getElementById('cvExperienceList');
    if (experience && experience.length > 0) {
        experienceList.innerHTML = experience.map(exp => {
            const duration = exp.is_current
                ? `${formatDate(exp.start_date)} — Present`
                : `${formatDate(exp.start_date)} — ${formatDate(exp.end_date)}`;

            return `
                <div class="cv-exp-item">
                    <div class="cv-exp-top">
                        <span class="cv-exp-position">${exp.position}</span>
                        <span class="cv-exp-duration">${duration}</span>
                    </div>
                    <div class="cv-exp-company">${exp.company_name}</div>
                    ${exp.description ? `<div class="cv-exp-desc">${exp.description}</div>` : ''}
                </div>
            `;
        }).join('');
        experienceSection.style.display = 'block';
    } else {
        experienceSection.style.display = 'none';
    }
}

// ==========================================
// Date Format Helper
// ==========================================
function formatDate(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ==========================================
// PDF Download
// ==========================================
document.getElementById('downloadPdfBtn').addEventListener('click', () => {
    const btn = document.getElementById('downloadPdfBtn');
    btn.disabled = true;
    btn.textContent = 'Generating PDF...';

    const cvElement = document.getElementById('cvPage');
    const fileName = `CV_${profileData.personal.first_name}_${profileData.personal.surname}_${currentMode === 'bio' ? 'BioData' : 'ProCV'}.pdf`;

    const options = {
        margin: 0,
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(options).from(cvElement).save().then(() => {
        btn.disabled = false;
        btn.textContent = 'Download PDF';
    });
});