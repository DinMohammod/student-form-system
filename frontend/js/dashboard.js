const token = requireAuth();

async function loadDashboard() {
    try {
        const data = await fetchProfile(token);

        const user = data.user;
        const status = data.application_status;

        document.getElementById('welcomeHeading').textContent = `Welcome, ${user.username}`;
        // Admin হলে "Admin Panel" Link দেখানো
        if (user.role === 'admin') {
            document.getElementById('adminPanelLink').classList.remove('hidden');
        }

        const statusChip = document.getElementById('statusChip');
        const statusText = document.getElementById('statusText');

        if (status === 'Completed') {
            statusChip.classList.add('completed');
            statusText.textContent = 'Completed';
        } else {
            statusText.textContent = 'Not Started';
        }

        const applicationDesc = document.getElementById('applicationDesc');
        const actionBtn = document.getElementById('actionBtn');

        if (status === 'Completed') {
            applicationDesc.textContent = 'Your application has been successfully submitted. You can view the complete details below.';
            actionBtn.textContent = 'Edit Application';
            actionBtn.onclick = () => {
                window.location.href = 'form.html?mode=edit';
            };

            document.querySelectorAll('.progress-row').forEach(row => {
                row.classList.add('done');
                row.querySelector('.progress-icon').textContent = '✔';
            });

            
            renderFullProfile(data);
            document.getElementById('profileView').classList.remove('hidden');

            
            document.getElementById('viewCvBtn').classList.remove('hidden');

        } else {
            applicationDesc.textContent = 'Complete your application with personal, family, and educational information.';
            actionBtn.textContent = 'Start Application';
            actionBtn.onclick = () => {
                window.location.href = 'form.html';
            };
        }

        document.getElementById('profileName').textContent = user.username;
        document.getElementById('profileEmail').textContent = user.email;

        const joinedDate = new Date(user.created_at);
        document.getElementById('profileJoined').textContent = joinedDate.toLocaleDateString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric'
        });

    } catch (error) {
        console.error('Dashboard Load Error:', error);
        logout();
    }
}


// Full Profile View 
function renderFullProfile(data) {
    const { personal, family, siblings, education, skills, experience } = data;

    //  Header (Photo + Name) 
    const photoImg = document.getElementById('viewPhoto');
    const photoPlaceholder = document.getElementById('viewPhotoPlaceholder');

    if (personal.photo_url) {
        photoImg.src = `http://localhost:5000${personal.photo_url}`;
        photoImg.style.display = 'block';
        photoPlaceholder.style.display = 'none';
    }

    document.getElementById('viewFullName').textContent = `${personal.first_name} ${personal.surname}`;
    document.getElementById('viewTagline').textContent = education?.department
        ? `${education.department}, ${education.university || ''}`
        : 'Student';

    // Personal 
    document.getElementById('viewGender').textContent = personal.gender;
    document.getElementById('viewDob').textContent = formatDate(personal.dob);
    document.getElementById('viewMobile').textContent = personal.mobile;
    document.getElementById('viewEmail').textContent = personal.email;
    document.getElementById('viewPresentAddress').textContent = personal.present_address || '—';
    document.getElementById('viewPermanentAddress').textContent = personal.permanent_address || '—';

    //  Family 
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

    //  Education 
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

    //  Skills
    const skillsList = document.getElementById('viewSkillsList');
    const skillsEmpty = document.getElementById('skillsEmpty');
    if (skills && skills.length > 0) {
        skillsList.innerHTML = skills.map(s =>
            `<span class="chip"><strong>${s.skill_name}</strong> — ${s.proficiency}</span>`
        ).join('');
    } else {
        skillsEmpty.classList.remove('hidden');
    }

    //Experience
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

    // ---------- Blood Donation Info ----------
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


// Date Format Helper

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

loadDashboard();


// Account Dropdown Toggle 
const accountTrigger = document.getElementById('accountTrigger');
const accountDropdown = document.getElementById('accountDropdown');

accountTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    accountDropdown.classList.toggle('hidden');
    accountTrigger.classList.toggle('open');
});

document.addEventListener('click', (e) => {
    if (!accountDropdown.contains(e.target) && !accountTrigger.contains(e.target)) {
        accountDropdown.classList.add('hidden');
        accountTrigger.classList.remove('open');
    }
});

// Logout Button 
document.getElementById('logoutMenuBtn').addEventListener('click', () => {
    logout();
});