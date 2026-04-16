/**
 * RYOUSHI — Main Scroll Engine
 * GSAP ScrollTrigger + Lenis smooth scroll + section mood sync
 */

document.addEventListener('DOMContentLoaded', () => {

    // ============================================
    // 1. GSAP ScrollTrigger Registration
    // ============================================
    gsap.registerPlugin(ScrollTrigger);

    // ============================================
    // 1.5 3D Glass Tilt Effect
    // ============================================
    const tiltElements = document.querySelectorAll('.glass-panel');
    tiltElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -4; // max 4 deg
            const rotateY = ((x - centerX) / centerX) * 4;
            
            el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        
        el.addEventListener('mouseleave', () => {
            el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            // let CSS transition handle it
            setTimeout(() => {
                if(!el.matches(':hover')) el.style.transform = '';
            }, 300);
        });
    });

    // ============================================
    // 2. Scroll Progress Bar
    // ============================================
    const progressBar = document.getElementById('scrollProgress');
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        if (progressBar) {
            progressBar.style.width = progress + '%';
        }
    });

    // ============================================
    // 3. Navbar Scroll Effect
    // ============================================
    const nav = document.getElementById('mainNav');
    if (nav) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        });
    }

    // ============================================
    // 4. Smooth Scroll for Nav Links
    // ============================================
    document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                const navHeight = document.getElementById('mainNav')?.offsetHeight || 70;
                const targetY = target.offsetTop - navHeight;
                window.scrollTo({ top: targetY, behavior: 'smooth' });
            }
        });
    });

    // Brand link
    const brandLink = document.querySelector('.ryoushi-brand');
    if (brandLink) {
        brandLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ============================================
    // 5. Active Nav State Sync (IntersectionObserver)
    // ============================================
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a[data-section]');

    // Active nav highlight — scroll-position based (works for any section height)
    const updateActiveNav = () => {
        const navHeight = document.getElementById('mainNav')?.offsetHeight || 70;
        let currentSection = '';
        
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            // If the section top is above roughly 1/3rd of the viewport height, it is the active one
            if (rect.top <= window.innerHeight / 3 && rect.bottom >= navHeight) {
                currentSection = section.id;
            }
        });

        navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.section === currentSection);
        });
    };

    window.addEventListener('scroll', updateActiveNav, { passive: true });
    updateActiveNav(); // run once on load

    // ============================================
    // 6. Section Heading Clip-Path Reveals
    // ============================================
    const sectionHeadings = document.querySelectorAll('.section-heading');
    
    const headingObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
                entry.target.classList.add('revealed');
            }
        });
    }, { threshold: 0.2, rootMargin: '0px 0px -50px 0px' });

    sectionHeadings.forEach(heading => headingObserver.observe(heading));

    // ============================================
    // 7. Fade-Up & Stagger Animations
    // ============================================
    const fadeElements = document.querySelectorAll('.fade-up, .stagger-children, .slide-left, .slide-right');
    
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

    fadeElements.forEach(el => fadeObserver.observe(el));

    // ============================================
    // 8. Glass Panel Hover Glare Effect
    // ============================================
    const glassPanels = document.querySelectorAll('.glass-panel');
    glassPanels.forEach(panel => {
        panel.addEventListener('mousemove', (e) => {
            const rect = panel.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            panel.style.setProperty('--mouse-x', `${x}px`);
            panel.style.setProperty('--mouse-y', `${y}px`);
        });
    });

    // ============================================
    // 9. Team Card 3D Tilt
    // ============================================
    const tiltCards = document.querySelectorAll('[data-tilt]');
    
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            
            const tiltX = (y - 0.5) * 8; // degrees
            const tiltY = (x - 0.5) * -8;

            card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        });
    });

    // ============================================
    // 10. Ambient Overlay Sync (via ScrollTrigger)
    // ============================================
    const moodSections = [
        { selector: '#hero', mood: 'arrival', ambient: 'rgba(255, 26, 51, 0.02)' },
        { selector: '#about', mood: 'origin', ambient: 'rgba(153, 0, 17, 0.08)' },
        { selector: '#problem', mood: 'fracture', ambient: 'rgba(255, 0, 51, 0.15)' },
        { selector: '#solution', mood: 'constellation', ambient: 'rgba(204, 0, 102, 0.1)' },
        { selector: '#research', mood: 'lab', ambient: 'rgba(102, 0, 255, 0.06)' },
        { selector: '#team', mood: 'architects', ambient: 'rgba(51, 0, 170, 0.12)' },
        { selector: '#contact', mood: 'horizon', ambient: 'rgba(255, 26, 51, 0.02)' }
    ];

    moodSections.forEach(({ selector, mood, ambient }) => {
        const el = document.querySelector(selector);
        if (!el) return;

        ScrollTrigger.create({
            trigger: el,
            start: 'top 60%',
            end: 'bottom 40%',
            onEnter: () => {
                const overlay = document.getElementById('ambient-overlay');
                if(overlay) gsap.to(overlay, { backgroundColor: ambient, duration: 2.5, ease: 'power2.inOut' });
            },
            onEnterBack: () => {
                const overlay = document.getElementById('ambient-overlay');
                if(overlay) gsap.to(overlay, { backgroundColor: ambient, duration: 2.5, ease: 'power2.inOut' });
            }
        });
    });

    // ============================================
    // 11. GSAP Section Animations (scroll-triggered)
    // ============================================

    // Encrypted Text Reveal for Section Titles
    const cryptChars = '!<>-_\\\\/[]{}—=+*^?#_';
    
    function scrambleText(element, finalString) {
        let iterations = 0;
        const interval = setInterval(() => {
            element.textContent = finalString.split('').map((char, index) => {
                if (char === ' ') return ' ';
                if (index < iterations) return finalString[index];
                return cryptChars[Math.floor(Math.random() * cryptChars.length)];
            }).join('');
            
            if (iterations >= finalString.length) {
                clearInterval(interval);
            }
            iterations += 1/3; // Setup speed
        }, 30);
    }

    document.querySelectorAll('.section-title').forEach(title => {
        const originalText = title.textContent;
        // Optional: pre-fill with random chars immediately to avoid layout jumps if hidden
        
        ScrollTrigger.create({
            trigger: title,
            start: 'top 85%',
            onEnter: () => scrambleText(title, originalText)
        });
    });

    // Hero — gentle parallax (only starts fading after 20% scroll)
    gsap.to('#hero .hero-content', {
        y: -40,
        opacity: 0.5,
        scrollTrigger: {
            trigger: '#hero',
            start: '20% top',
            end: 'bottom top',
            scrub: 1.5
        }
    });

    // Problem cards — staggered slide
    gsap.utils.toArray('.gap-card').forEach((card, i) => {
        gsap.from(card, {
            x: i % 2 === 0 ? -60 : 60,
            opacity: 0,
            duration: 0.8,
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            }
        });
    });

    // Solution panel — scale up
    gsap.from('.solution-panel', {
        scale: 0.9,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.solution-panel',
            start: 'top 80%',
            toggleActions: 'play none none reverse'
        }
    });

    // Research cards — staggered fade
    gsap.utils.toArray('.research-card').forEach((card, i) => {
        gsap.from(card, {
            y: 40,
            opacity: 0,
            duration: 0.6,
            delay: i * 0.1,
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            }
        });
    });

    // Product feature cards — staggered fade
    gsap.utils.toArray('.product-feature-card').forEach((card, i) => {
        gsap.from(card, {
            y: 30,
            opacity: 0,
            duration: 0.6,
            delay: i * 0.1,
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            }
        });
    });

    // Team cards — rise up
    gsap.utils.toArray('.team-card').forEach((card, i) => {
        gsap.from(card, {
            y: 60,
            opacity: 0,
            duration: 0.8,
            delay: i * 0.15,
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            }
        });
    });

    // Section dividers — width reveal
    gsap.utils.toArray('.section-divider').forEach(div => {
        gsap.from(div, {
            width: 0,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: div,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            }
        });
    });

});
