const token = requireAuth();

// URL থেকে ?id=... বের করা (যেমন admin-user-detail.html?id=7)
const urlParams = new URLSearchParams(window.location.search);
const studentId = urlParams.get('id');

async function init() {
    if (!studentId) {
        alert('কোনো Student Select করা হয়নি');
        window.location.href = 'admin-users.html';
        return;
    }

    try {
        const [profileData, historyData] = await Promise.all([
            fetchUserProfileById(token, studentId),
            fetchUserHistory(token, studentId)
        ]);

        renderHeader(profileData);

        if (profileData.application_status === 'Completed') {
            renderFullProfile(profileData);
        } else {
            document.getElementById('profileView').innerHTML =
                '<p class="admin-empty">এই Student এখনো Application Submit করেনি।</p>';
        }

        renderHistory(historyData.history);

    } catch (error) {
        console.error('Admin Detail Load Error:', error.message);
        alert('Data আনতে সমস্যা হয়েছে');
        window.location.href = 'admin-users.html';
    }
}

// ---------- Header (Name + Status) ----------
function renderHeader(data) {
    const name = data.personal
        ? `${data.personal.first_name} ${data.personal.surname}`
        : data.user.username;

    document.getElementById('studentNameHeading').textContent = name;

    const statusChip = document.getElementById('statusChip');
    const statusText = document.getElementById('statusText');

    if (data.application_status === 'Completed') {
        statusChip.classList.add('completed');
        statusText.textContent = 'Completed';
    } else {
        statusText.textContent = 'Not Started';
    }
}

// ---------- Full Profile View (dashboard.js এর মতোই) ----------
function renderFullProfile(data) {
    const { personal, family, siblings, education, skills, experience } = data;

    document.getElementById('viewGender').textContent = personal.gender;
    document.getElementById('viewDob').textContent = formatDate(personal.dob);
    document.getElementById('viewMobile').textContent = personal.mobile;
    document.getElementById('viewEmail').textContent = personal.email;
    document.getElementById('viewPresentAddress').textContent = personal.present_address || '—';
    document.getElementById('viewPermanentAddress').textContent = personal.permanent_address || '—';

    document.getElementById('viewFatherName').textContent = family?.father_name || '—';
    document.getElementById('viewFatherOccupation').textContent = family?.father_occupation || '—';
    document.getElementById('viewMotherName').textContent = family?.mother_name || '—';
    document.getElementById('viewMotherOccupation').textContent = family?.mother_occupation || '—';

    const siblingsWrap = document.getElementById('viewSiblingsWrap');
    const siblingsList = document.getElementById('viewSiblingsList');
    if (siblings && siblings.length > 0) {
        siblingsList.innerHTML = siblings.map(s =>
            `<span class="chip"><strong>${s.sibling_name}</strong> — ${s.sibling_relation}</span>`
        ).join('');
    } else {
        siblingsWrap.style.display = 'none';
    }

    if (education) {
        document.getElementById('viewSscSchool').textContent = education.school_name || '—';
        document.getElementById('viewSscDetail').textContent =
            `${education.ssc_board || ''} · GPA ${education.ssc_gpa ?? '—'} · ${education.ssc_year ?? '—'}`;

        document.getElementById('viewHscCollege').textContent = education.college_name || '—';
        document.getElementById('viewHscDetail').textContent =
            `${education.hsc_board || ''} · GPA ${education.hsc_gpa ?? '—'} · ${education.hsc_year ?? '—'}`;

        document.getElementById('viewUniversity').textContent = education.university || '—';
        document.getElementById('viewUgDetail').textContent =
            `${education.department || ''} · Semester ${education.semester || '—'} · CGPA ${education.cgpa ?? '—'}`;
    }

    const skillsList = document.getElementById('viewSkillsList');
    const skillsEmpty = document.getElementById('skillsEmpty');
    if (skills && skills.length > 0) {
        skillsList.innerHTML = skills.map(s =>
            `<span class="chip"><strong>${s.skill_name}</strong> — ${s.proficiency}</span>`
        ).join('');
    } else {
        skillsEmpty.classList.remove('hidden');
    }

    const experienceList = document.getElementById('viewExperienceList');
    const experienceEmpty = document.getElementById('experienceEmpty');
    if (experience && experience.length > 0) {
        experienceList.innerHTML = experience.map(exp => {
            const duration = exp.is_current
                ? `${formatDate(exp.start_date)} — Present`
                : `${formatDate(exp.start_date)} — ${formatDate(exp.end_date)}`;

            return `
                <div class="exp-entry">
                    <div class="exp-entry-top">
                        <span class="exp-position">${exp.position}</span>
                        <span class="exp-duration">${duration}</span>
                    </div>
                    <div class="exp-company">${exp.company_name}</div>
                    ${exp.description ? `<div class="exp-description">${exp.description}</div>` : ''}
                </div>
            `;
        }).join('');
    } else {
        experienceEmpty.classList.remove('hidden');
    }

    // Blood Donation
    const bloodInfoCard = document.getElementById('bloodInfoCard');
    const bloodGroupDisplay = document.getElementById('bloodGroupDisplay');
    const donorStatusWrap = document.getElementById('donorStatusWrap');
    const donorStatusDisplay = document.getElementById('donorStatusDisplay');
    const bloodAvailabilityBox = document.getElementById('bloodAvailabilityBox');

    if (data.bloodInfo && data.bloodInfo.bloodGroup) {
        bloodInfoCard.classList.remove('hidden');
        bloodGroupDisplay.textContent = data.bloodInfo.bloodGroup;

        if (data.bloodInfo.bloodGroup === 'Rather not say') {
            donorStatusWrap.style.display = 'none';
        } else if (data.bloodInfo.hasDonatedBefore) {
            donorStatusWrap.style.display = 'flex';
            donorStatusDisplay.textContent = 'Previous Donor';

            bloodAvailabilityBox.classList.remove('hidden');

            if (data.bloodInfo.isAvailable) {
                bloodAvailabilityBox.className = 'blood-status-box eligible';
                bloodAvailabilityBox.textContent = "✅ Available to donate right now";
            } else {
                const nextDate = new Date(data.bloodInfo.nextAvailableDate);
                const formattedDate = nextDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
                bloodAvailabilityBox.className = 'blood-status-box waiting';
                bloodAvailabilityBox.textContent = `⏳ Available again on ${formattedDate}`;
            }
        } else {
            donorStatusWrap.style.display = 'flex';
            donorStatusDisplay.textContent = data.bloodInfo.wantsToBeDonor ? 'Willing to Donate' : 'Not Interested';

            if (data.bloodInfo.wantsToBeDonor) {
                bloodAvailabilityBox.classList.remove('hidden');
                bloodAvailabilityBox.className = 'blood-status-box interested';
                bloodAvailabilityBox.textContent = "📋 Listed as a potential first-time donor";
            }
        }
    }
}

// ---------- Activity History Timeline ----------
const ACTION_LABELS = {
    REGISTER: '📝 Account তৈরি করেছে',
    LOGIN: '🔑 Login করেছে',
    FORM_SUBMIT: '✅ Form Submit করেছে',
    FORM_UPDATE: '✏️ Form Update করেছে',
    APPLICATION_DELETE: '🗑️ Application Delete করেছে',
    ACCOUNT_DELETE: '❌ Account Delete করেছে'
};

function renderHistory(history) {
    const timeline = document.getElementById('historyTimeline');

    if (!history || history.length === 0) {
        timeline.innerHTML = '<p class="admin-empty">কোনো Activity পাওয়া যায়নি</p>';
        return;
    }

    timeline.innerHTML = history.map(log => {
        const label = ACTION_LABELS[log.action_type] || log.action_type;
        const time = new Date(log.created_at).toLocaleString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        return `
            <div class="timeline-item">
                <span class="timeline-icon"></span>
                <div>
                    <div class="timeline-text">${label}</div>
                    <div class="timeline-time">${time}</div>
                </div>
            </div>
        `;
    }).join('');
}

// ---------- Date Format Helper ----------
function formatDate(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

init();