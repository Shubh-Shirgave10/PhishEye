document.addEventListener('DOMContentLoaded', () => {
    console.log('Phisheye About Page Loaded');

    // Initialize Lucide Icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // --- Navigation Panel Logic ---
    const backBtn = document.getElementById('backBtn');
    const userMenuBtn = document.getElementById('userMenuBtn');
    const navPanel = document.getElementById('navPanel');
    const panelItems = document.querySelectorAll('.panel-item[data-tab]');

    if (backBtn) {
        backBtn.onclick = () => {
            if (window.history.length > 1) window.history.back();
            else window.location.href = '../Dashboard/dashboard.html';
        };
    }

    userMenuBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        navPanel.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (navPanel && !navPanel.contains(e.target) && userMenuBtn && !userMenuBtn.contains(e.target)) {
            navPanel.classList.add('hidden');
        }
    });

    // --- POPULATE USER INFO ---
    const userEmail = localStorage.getItem('user_email');
    if (userEmail) {
        const initial = userEmail.charAt(0).toUpperCase();
        const avatars = document.querySelectorAll('.user-avatar');
        avatars.forEach(avatar => avatar.textContent = initial);

        const panelName = document.querySelector('.panel-user-name');
        const panelEmail = document.querySelector('.panel-user-email');
        if (panelName) panelName.textContent = userEmail.split('@')[0];
        if (panelEmail) panelEmail.textContent = userEmail;
    }

    panelItems.forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.getAttribute('data-tab');
            if (tab === 'dashboard') window.location.href = '../Main_Dash/mainDash.html';
            else if (tab === 'history') window.location.href = '../History/history.html';
            else if (tab === 'settings') window.location.href = '../setting/settings.html';
            else if (tab === 'quickscan') window.location.href = '../QuickScan/quickscan.html';
            else if (tab === 'about') navPanel.classList.add('hidden');
        });
    });

    // Logout
    document.querySelector('.logout')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('token');
            window.location.href = '../login-page/login.html';
        }
    });

    // --- 3D CUBE INTERACTION ---
    const cube = document.querySelector('.cube');
    const scene = document.querySelector('.scene');

    if (cube) {
        cube.addEventListener('click', () => {
            cube.classList.toggle('grid-view');

            // Optional: Pause animation when in grid view (handled by CSS, but good for logic)
            if (cube.classList.contains('grid-view')) {
                console.log('Cube expanded to grid');
            } else {
                console.log('Cube returned to rotation');
            }
        });
    }

    // --- TEAM MEMBER DATA ---
    const teamData = {
        alex: {
            name: "Shubham Shirgave",
            role: "Cybersecurity Specialist",
            bio: "Shubham has over 10 years of experience in ethical hacking and network security. He leads the threat detection algorithms at Phisheye.",
            email: "shubhamshirgave@gmail.com",
            photo: "https://github.com/Shubh-Shirgave10.png",
            socials: [
                { platform: "LinkedIn", url: "https://www.linkedin.com/in/shubham-shirgave-207424300/", iconClass: "fa-brands fa-linkedin-in" },
                { platform: "GitHub", url: "https://github.com/Shubh-Shirgave10", iconClass: "fa-brands fa-github" }
            ]
        },
        sarah: {
            name: "Yash Naik",
            role: "Security Analyst",
            bio: "Yash specializes in social engineering patterns and phishing trends. Her research powers our AI's predictive capabilities.",
            email: "yashnaik@gmail.com",
            photo: "https://github.com/yashnaik70.png",
            socials: [
                { platform: "LinkedIn", url: "https://www.linkedin.com/in/yash-naik-312888395/", iconClass: "fa-brands fa-linkedin-in" },
                { platform: "Github", url: "https://github.com/yashnaik70", iconClass: "fa-brands fa-github" }
            ]
        },
        mike: {
            name: "Mahek Killedar",
            role: "Lead Frontend Dev",
            bio: "Mahek is passionate about creating intuitive and secure user interfaces. He ensures that security doesn't come at the cost of usability.",
            email: "mahekkilledar@gmail.com",
            photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mahek&style=circle&backgroundColor=b6e3f4",
            socials: [
                { platform: "LinkedIn", url: "https://www.linkedin.com/in/mahek-killedar-b35654276/", iconClass: "fa-brands fa-linkedin-in" },
                { platform: "Github", url: "https://github.com/", iconClass: "fa-brands fa-github" }
            ]
        },
        emily: {
            name: "Pratiksha Patil",
            role: "Full Stack Engineer",
            bio: "Pratiksha architects the scalable infrastructure behind Phisheye. She loves optimizing database queries and API response times.",
            email: "pratikshapatil@gmail.com",
            photo: "https://media.licdn.com/dms/image/v2/D5603AQG-pkQOhsNobA/profile-displayphoto-shrink_200_200/B56ZS7hCaYHwAY-/0/1738312789114?e=1774483200&v=beta&t=75vFaAMbd9x1NF3OfSsxYUJv293WT78q96Y5O1nulXw",
            socials: [
                { platform: "LinkedIn", url: "https://www.linkedin.com/in/pratiksha-patil-190205300/", iconClass: "fa-brands fa-linkedin-in" },
                { platform: "Github", url: "https://github.com/", iconClass: "fa-brands fa-github" }
            ]
        }
    };

    // --- MODAL LOGIC ---
    const modal = document.getElementById('member-modal');
    const closeModal = document.querySelector('.close-modal');
    const modalName = document.getElementById('modal-name');
    const modalRole = document.getElementById('modal-role');
    const modalBio = document.getElementById('modal-bio');
    const modalEmail = document.getElementById('modal-email');
    const modalPhoto = document.querySelector('.modal-photo');
    const modalSocials = document.getElementById('modal-socials');

    // Open Modal
    document.querySelectorAll('.team-card').forEach(card => {
        card.addEventListener('click', () => {
            const memberId = card.getAttribute('data-member');
            const member = teamData[memberId];

            if (member) {
                modalName.textContent = member.name;
                modalRole.textContent = member.role;
                modalBio.textContent = member.bio;
                modalEmail.textContent = `Contact ${member.name.split(' ')[0]}`;
                modalEmail.href = `mailto:${member.email}`;
                modalPhoto.style.backgroundImage = `url('${member.photo}')`;

                // Clear and populate socials with ICONS
                modalSocials.innerHTML = '';
                if (member.socials) {
                    member.socials.forEach(social => {
                        const link = document.createElement('a');
                        link.href = social.url;
                        link.className = 'modal-social-link';
                        link.target = "_blank";

                        // Create Icon Element
                        const icon = document.createElement('i');
                        icon.className = social.iconClass;

                        link.appendChild(icon);
                        modalSocials.appendChild(link);
                    });
                }

                modal.style.display = 'block';
            }
        });
    });

    // Close Modal
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});
