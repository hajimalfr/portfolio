/* ==========================================================================
   js/i18n.js — Bilingue automatique FR / EN selon navigator.language
   ========================================================================== */
(function () {
  const DICT = {
    fr: {
      'nav.cv': 'CV COMPLET',
      'nav.prev': 'Précédent',
      'nav.next': 'Suivant',
      'alt.label': 'COTE',
      'st0.nav': 'Ouverture',
      'st1.nav': 'Impression 3D',
      'st2.nav': 'Voyages',
      'st3.nav': 'Breaking & Tsunami',
      'st4.nav': 'Manifeste & Contact',

      'st0.kicker': 'OUVERTURE',
      'st0.lead':
        '19 ans, étudiant en 1ère année de <strong>BUT Génie Civil – Construction Durable</strong> à l’IUT de Nancy-Brabois (ex-CPGE PCSI au Lycée Loritz). Cap sur un diplôme d’<strong>ingénieur en génie civil</strong>.',
      'st0.ctaExplore': 'Explorer les stations',
      'st0.ctaManifesto': 'Manifeste CAO & CV',
      'st0.idSub': '19 ans · Permis B',
      'st0.kForm': 'FORMATION',
      'st0.vForm': 'BUT GCCD · 1ère année',
      'st0.kInst': 'IUT',
      'st0.kPrev': 'PARCOURS',
      'st0.kGoal': 'OBJECTIF',
      'st0.vGoal': 'Ingénieur Génie Civil',
      'st0.kStage': 'STAGE S2',
      'st0.vStage': '4 sem. · Mai–Juin',
      'st0.avail': 'DISPO STAGE',

      'st1.kicker': 'CONCEPTION & FABRICATION',
      'st1.title': 'Impression 3D<br><span class="accent-text">&amp; Précision utile.</span>',
      'st1.p1':
        'De l’esquisse paramétrique sous <strong>Fusion 360</strong> jusqu’à la pièce imprimée sur <strong>Bambu Lab</strong>, chaque millimètre répond à un usage réel.',
      'st1.p2':
        'La cotation, les tolérances d’assemblage et le prototypage rapide nourrissent directement ma rigueur sur AutoDesk et AutoCAD.',
      'st1.capLeft': 'PROTOTYPAGE PARAMÉTRIQUE',

      'st2.kicker': 'OUVERTURE & MOBILITÉ',
      'st2.title': 'Voyages<br><span class="accent-text">&amp; Horizon international.</span>',
      'st2.p1':
        'Se déplacer, observer d’autres façons de construire et de vivre la ville : les voyages nourrissent ma curiosité technique et mon ouverture culturelle.',
      'st2.p2':
        'Appuyé par un <strong>anglais B2 certifié (First Cambridge)</strong>, j’envisage à terme une carrière d’ingénieur ouverte à l’international.',
      'st2.chip1': 'SECTION EUROPÉENNE',
      'st2.chip2': 'MOBILITÉ INTL.',
      'st2.capLeft': 'CAMBRIDGE FIRST · B2',

      'st3.kicker': 'COLLECTIF & ENGAGEMENT',
      'st3.title': 'Breaking<br><span class="accent-text">&amp; Association Tsunami.</span>',
      'st3.p1':
        'Pratiquant de breaking, <strong>président et cofondateur de l’Association Tsunami</strong> à Nancy depuis 2024 : gestion associative, événements culturels et participation au Relais de la Flamme des JO.',
      'st3.quote':
        '« Rien ne se monte seul : que ce soit au sein de l’Association Tsunami, en session de breaking ou en déplacement, c’est l’énergie du collectif et la confiance entre amis qui donnent du relief à ce que j’entreprends. »',
      'st3.chip1': 'PRÉSIDENT · COFONDATEUR',
      'st3.chip2': 'FLAMME OLYMPIQUE',
      'st3.reset3d': 'RESET 360°',
      'st3.dragHint': 'GLISSER 360° · SURVOLER',

      'cad.tabManifesto': 'Manifeste',
      'cad.tabTrajectory': 'S1 → S6',
      'cad.tabIkigai': 'Ikigai',
      'cad.browser': 'ARBORESCENCE',
      'cad.nReal': 'Réalisation',
      'cad.nUtil': 'Utilité concrète',
      'cad.nDesign': 'Design & Forme',
      'cad.nChoix': 'Choix Génie Civil',
      'cad.noteLabel': "NOTE D'ATELIER",
      'cad.noteDefault':
        'Molette vers le bas pour zoomer · Glisser pour déplacer · Double-clic pour recentrer.',
      'cad.noteReal':
        'Passer du plan à la matière : comprendre comment un objet ou une structure tient dans le réel.',
      'cad.noteUtil':
        'Une forme n’a de valeur durable que si elle répond à un besoin précis et fiable au quotidien.',
      'cad.noteDesign':
        'L’esthétique compte : la justesse des proportions et la clarté technique vont de pair.',
      'cad.noteChoix':
        'Entre esthétique pure et exécution concrète, le génie civil réunit conception et réalité de terrain.',
      'cad.quoteKicker': 'MANIFESTE // GÉNIE CIVIL VS ARCHITECTURE',
      'cad.segDesign': 'Le design d’un objet est une chose très importante pour moi,',
      'cad.segReal': 'mais sa réalisation',
      'cad.segUtil': 'et son utilité concrète me paraissent nécessaires à son appréciation.',
      'cad.segChoix': 'C’est pourquoi j’ai préféré le génie civil à l’architecture.',
      'cad.hudTip': 'MOLETTE = ZOOM · GLISSER = PAN · 2×CLIC = RESET',

      'traj.s1Title': 'Socle GCCD',
      'traj.s1Text':
        'Plans AutoDesk, matériaux, mécanique des structures, topographie et identité pro.',
      'traj.s2Title': 'Stage 4 semaines',
      'traj.s2Text':
        'Suivi de chantier auprès d’un ingénieur travaux pour relier théorie et exécution.',
      'traj.s3Title': 'Cap École d’Ingénieurs',
      'traj.s3Text':
        'Dimensionnement, BIM, stages longs et intégration en école d’ingénieurs (INSA, ESTP, ENTPE).',

      'iki.p1': 'Conception 3D, plans techniques et design fonctionnel.',
      'iki.p2': 'Bases PCSI, AutoDesk, méthode et gestion de collectif.',
      'iki.p3': 'Bâtir durablement des ouvrages utiles et fiables.',
      'iki.p4': '<strong>Ingénieur en génie civil</strong>, ouvert à l’international.',

      'st4.openCv': 'Consulter le CV (A4)',
      'st4.copy': 'COPIER',
      'st4.copied': 'COPIÉ ✓',

      'cv.print': 'Imprimer A4',
      'cv.pdf': 'PDF ↓',
      'cv.close': 'Fermer',
      'cv.profileLabel': 'Profil :',
      'cv.profileText':
        'Étudiant en première année de BUT Génie Civil – Construction Durable, je recherche un stage de 4 semaines (mai-juin) en suivi de chantier auprès d’un ingénieur travaux. Rigoureux, impliqué et doté d’une première expérience concrète en environnement professionnel, je souhaite observer la gestion technique et opérationnelle d’un projet pour consolider mon parcours vers les écoles d’ingénieurs.',
      'cv.expTitle': 'EXPÉRIENCES PROFESSIONNELLES & ASSOCIATIVES',
      'cv.exp1Title': 'Président Associatif — Association Tsunami (Cofondateur)',
      'cv.exp1Meta': 'Nancy | Depuis 2024',
      'cv.exp1L1': 'Gestion financière et organisation d’événements culturels',
      'cv.exp1L2': 'Tâches administratives et coordination d’équipe',
      'cv.exp1L3': 'Participation au Relais de la Flamme des Jeux Olympiques',
      'cv.exp2Title': 'Vendeur en Fromagerie — Les Frères Marchand',
      'cv.exp2Meta': 'Nancy | Juin, Novembre et Décembre 2026 (CDD)',
      'cv.exp2L1': 'Accueil, conseil personnalisé et vente au comptoir de produits laitiers',
      'cv.exp2L2': 'Gestion de la caisse, encaissement et entretien du stand',
      'cv.exp2L3': 'Réassort et respect strict des normes d’hygiène alimentaire',
      'cv.exp3Title': 'Préparateur de Commandes — Auchan Drive',
      'cv.exp3Meta': 'Laxou | Février – Mai 2026',
      'cv.exp3L1': 'Préparation cadencée de commandes via scanneur',
      'cv.exp3L2': 'Réception de la clientèle et chargement des commandes',
      'cv.exp4Title': 'Trieur — Chronopost (Intérim)',
      'cv.exp4Meta': 'Nancy | Janvier 2026',
      'cv.exp4L1': 'Déchargement de camions, utilisation de transpalettes et tri par zone',
      'cv.exp4L2': 'Respect des cadences et des procédures d’acheminement express',
      'cv.exp5Title': 'Opérateur de Production — Elis (CDD)',
      'cv.exp5Meta': 'Nancy | Décembre 2025',
      'cv.exp5L1': 'Tri et contrôle de vêtements industriels dans un environnement cadencé',
      'cv.exp5L2': 'Respect strict des consignes d’hygiène et de sécurité',
      'cv.eduTitle': 'FORMATION',
      'cv.edu1Title': 'BUT Génie Civil – Construction Durable',
      'cv.edu1Meta': 'IUT Nancy-Brabois | Depuis septembre 2026',
      'cv.edu3Title': 'Baccalauréat Général Scientifique',
      'cv.edu3Meta': 'Section Européenne · Mention Assez Bien · Lycée Notre-Dame Saint Sigisbert | 2025',
      'cv.skillsTitle': 'COMPÉTENCES',
      'cv.sk1': 'Maîtrise AutoDesk au niveau avancé',
      'cv.sk2': 'Maîtrise Pack Office au niveau avancé',
      'cv.sk3': 'Respect des consignes et règles de sécurité',
      'cv.sk4': 'Adaptabilité, endurance et fiabilité',
      'cv.sk5': 'Travail en équipe',
      'cv.certTitle': 'CERTIFICATIONS',
      'cv.langTitle': 'LANGUES',
      'cv.lg1': 'Français : langue maternelle',
      'cv.lg2': 'Anglais : niveau avancé attesté (B2)',
      'cv.lg3': 'Espagnol : notions',

      marquee: [
        'VICTOR VALROFF CHHUN',
        'BUT GÉNIE CIVIL & CONSTRUCTION DURABLE',
        'IUT NANCY-BRABOIS',
        'FUSION 360 · BAMBU LAB',
        'ASSOCIATION TSUNAMI'
      ]
    },

    en: {
      'nav.cv': 'FULL RESUME',
      'nav.prev': 'Previous',
      'nav.next': 'Next',
      'alt.label': 'ELEV',
      'st0.nav': 'Opening',
      'st1.nav': '3D Printing',
      'st2.nav': 'Travel',
      'st3.nav': 'Breaking & Tsunami',
      'st4.nav': 'Manifesto & Contact',

      'st0.kicker': 'OPENING',
      'st0.lead':
        '19 years old, 1st-year <strong>Civil Engineering &amp; Sustainable Construction (BUT GCCD)</strong> student at IUT Nancy-Brabois (former CPGE PCSI at Lycée Loritz). Aiming to become a <strong>civil engineer</strong>.',
      'st0.ctaExplore': 'Explore stations',
      'st0.ctaManifesto': 'CAD Manifesto & CV',
      'st0.idSub': '19 y/o · Driver License',
      'st0.kForm': 'DEGREE',
      'st0.vForm': 'BUT Civil Eng. · Year 1',
      'st0.kInst': 'SCHOOL',
      'st0.kPrev': 'PATH',
      'st0.kGoal': 'GOAL',
      'st0.vGoal': 'Civil Engineer',
      'st0.kStage': 'INTERNSHIP',
      'st0.vStage': '4 wks · May–June',
      'st0.avail': 'OPEN TO INTERN',

      'st1.kicker': 'DESIGN & FABRICATION',
      'st1.title': '3D Printing<br><span class="accent-text">&amp; Useful Precision.</span>',
      'st1.p1':
        'From parametric sketches in <strong>Fusion 360</strong> to functional parts printed on <strong>Bambu Lab</strong>, every millimeter serves a real purpose.',
      'st1.p2':
        'Dimensioning, assembly tolerances, and rapid prototyping directly sharpen my drafting accuracy in AutoDesk and AutoCAD.',
      'st1.capLeft': 'PARAMETRIC PROTOTYPING',

      'st2.kicker': 'WORLDVIEW & MOBILITY',
      'st2.title': 'Travel<br><span class="accent-text">&amp; Global Horizon.</span>',
      'st2.p1':
        'Traveling and observing how cities are built and lived in elsewhere fuels both my technical curiosity and cultural openness.',
      'st2.p2':
        'Backed by a <strong>certified B2 English level (Cambridge First)</strong>, I aim to build a civil engineering career open to international projects.',
      'st2.chip1': 'EUROPEAN SECTION',
      'st2.chip2': 'GLOBAL MOBILITY',
      'st2.capLeft': 'CAMBRIDGE FIRST · B2',

      'st3.kicker': 'COLLECTIVE & LEADERSHIP',
      'st3.title': 'Breaking<br><span class="accent-text">&amp; Tsunami Association.</span>',
      'st3.p1':
        'Breaker, <strong>president and co-founder of the Tsunami Association</strong> in Nancy since 2024: administration, cultural events, and participation in the Olympic Torch Relay.',
      'st3.quote':
        '“Nothing is built alone: whether within the Tsunami Association, in a breaking session, or on the road, it is the energy of the collective and trust among friends that give depth to everything I undertake.”',
      'st3.chip1': 'PRESIDENT · CO-FOUNDER',
      'st3.chip2': 'OLYMPIC TORCH RELAY',
      'st3.reset3d': 'RESET 360°',
      'st3.dragHint': 'DRAG 360° · HOVER',

      'cad.tabManifesto': 'Manifesto',
      'cad.tabTrajectory': 'S1 → S6',
      'cad.tabIkigai': 'Ikigai',
      'cad.browser': 'BROWSER TREE',
      'cad.nReal': 'Execution',
      'cad.nUtil': 'Practical Utility',
      'cad.nDesign': 'Design & Form',
      'cad.nChoix': 'Why Civil Eng.',
      'cad.noteLabel': 'WORKSHOP NOTE',
      'cad.noteDefault':
        'Scroll down inside frame to zoom in · Drag to pan · Double-click to reset.',
      'cad.noteReal':
        'Going from drawing to material reality: understanding how a piece or structure actually holds up.',
      'cad.noteUtil':
        'Form earns lasting value only when it solves a concrete, reliable everyday need.',
      'cad.noteDesign':
        'Aesthetics matter: clean proportions and technical clarity reinforce each other.',
      'cad.noteChoix':
        'Between pure aesthetics and concrete buildability, civil engineering bridges design and site reality.',
      'cad.quoteKicker': 'MANIFESTO // CIVIL ENGINEERING VS ARCHITECTURE',
      'cad.segDesign': 'The design of an object matters deeply to me,',
      'cad.segReal': 'but its realization',
      'cad.segUtil': 'and concrete utility feel essential to truly appreciating it.',
      'cad.segChoix': 'That is why I chose civil engineering over architecture.',
      'cad.hudTip': 'WHEEL = ZOOM · DRAG = PAN · 2×CLICK = RESET',

      'traj.s1Title': 'GCCD Foundations',
      'traj.s1Text':
        'AutoDesk drafting, construction materials, structural mechanics, topography, and career focus.',
      'traj.s2Title': '4-Week Internship',
      'traj.s2Text':
        'Site supervision alongside a works engineer in May–June to connect theory with execution.',
      'traj.s3Title': 'Engineering School Track',
      'traj.s3Text':
        'Structural design, BIM, extended internships, and admission to engineering school (INSA, ESTP, ENTPE).',

      'iki.p1': '3D modeling, technical drawings, and functional design.',
      'iki.p2': 'PCSI math/physics base, AutoDesk, method, and team leadership.',
      'iki.p3': 'Building sustainable, useful, and reliable structures.',
      'iki.p4': '<strong>Civil Engineer</strong>, with an international outlook.',

      'st4.openCv': 'View Resume (A4)',
      'st4.copy': 'COPY',
      'st4.copied': 'COPIED ✓',

      'cv.print': 'Print A4',
      'cv.pdf': 'PDF ↓',
      'cv.close': 'Close',
      'cv.profileLabel': 'Profile:',
      'cv.profileText':
        'First-year Civil Engineering & Sustainable Construction (BUT GCCD) student seeking a 4-week site-supervision internship (May–June) alongside a works engineer. Rigorous, committed, and backed by hands-on professional experience, I aim to observe technical and operational project management on my path to engineering school.',
      'cv.expTitle': 'PROFESSIONAL & ASSOCIATIVE EXPERIENCE',
      'cv.exp1Title': 'Association President — Tsunami Association (Co-founder)',
      'cv.exp1Meta': 'Nancy | Since 2024',
      'cv.exp1L1': 'Financial management and cultural event organization',
      'cv.exp1L2': 'Administrative duties and team coordination',
      'cv.exp1L3': 'Participation in the Olympic Torch Relay',
      'cv.exp2Title': 'Cheese Counter Sales Associate — Les Frères Marchand',
      'cv.exp2Meta': 'Nancy | June, Nov & Dec 2026 (Fixed-term)',
      'cv.exp2L1': 'Customer service, tailored advice, and dairy counter sales',
      'cv.exp2L2': 'Cash register management and stand upkeep',
      'cv.exp2L3': 'Restocking and strict food hygiene compliance',
      'cv.exp3Title': 'Order Picker — Auchan Drive',
      'cv.exp3Meta': 'Laxou | Feb – May 2026',
      'cv.exp3L1': 'Fast-paced scanner-based order preparation',
      'cv.exp3L2': 'Customer reception and vehicle loading',
      'cv.exp4Title': 'Parcel Sorter — Chronopost (Temp)',
      'cv.exp4Meta': 'Nancy | Jan 2026',
      'cv.exp4L1': 'Truck unloading, pallet jack handling, and zone sorting',
      'cv.exp4L2': 'Meeting express logistics cadences and procedures',
      'cv.exp5Title': 'Production Operator — Elis (Fixed-term)',
      'cv.exp5Meta': 'Nancy | Dec 2025',
      'cv.exp5L1': 'Sorting and inspection of industrial garments in a paced setting',
      'cv.exp5L2': 'Strict compliance with hygiene and safety protocols',
      'cv.eduTitle': 'EDUCATION',
      'cv.edu1Title': 'BUT Civil Engineering – Sustainable Construction',
      'cv.edu1Meta': 'IUT Nancy-Brabois | Since Sept 2026',
      'cv.edu3Title': 'Scientific High School Baccalaureate',
      'cv.edu3Meta': 'European Section · Honors · Lycée Notre-Dame Saint Sigisbert | 2025',
      'cv.skillsTitle': 'SKILLS',
      'cv.sk1': 'Advanced AutoDesk proficiency',
      'cv.sk2': 'Advanced Microsoft Office proficiency',
      'cv.sk3': 'Strict safety & procedure compliance',
      'cv.sk4': 'Adaptability, stamina, and reliability',
      'cv.sk5': 'Teamwork',
      'cv.certTitle': 'CERTIFICATIONS',
      'cv.langTitle': 'LANGUAGES',
      'cv.lg1': 'French: Native',
      'cv.lg2': 'English: Certified Advanced (B2)',
      'cv.lg3': 'Spanish: Basic',

      marquee: [
        'VICTOR VALROFF CHHUN',
        'CIVIL ENGINEERING & SUSTAINABLE CONSTRUCTION',
        'IUT NANCY-BRABOIS',
        'FUSION 360 · BAMBU LAB',
        'TSUNAMI ASSOCIATION'
      ]
    }
  };

  function detectLang() {
    try {
      const saved = localStorage.getItem('vvc_lang');
      if (saved === 'fr' || saved === 'en') return saved;
    } catch (_) {}
    const navLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    return navLang.startsWith('fr') ? 'fr' : 'en';
  }

  let currentLang = detectLang();

  function renderMarquee(lang) {
    const items = DICT[lang].marquee;
    const html = items.map((t) => `<span>${t}</span><span class="m-star">✦</span>`).join('');
    const s1 = document.getElementById('marqueeSeq1');
    const s2 = document.getElementById('marqueeSeq2');
    if (s1) s1.innerHTML = html;
    if (s2) s2.innerHTML = html;
  }

  function applyLang(lang, persist = false) {
    currentLang = lang === 'fr' ? 'fr' : 'en';
    document.documentElement.lang = currentLang;

    if (persist) {
      try {
        localStorage.setItem('vvc_lang', currentLang);
      } catch (_) {}
    }

    const pack = DICT[currentLang];
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key && pack[key] !== undefined) {
        el.innerHTML = pack[key];
      }
    });

    document.querySelectorAll('.lang-btn').forEach((btn) => {
      const isMatch = btn.getAttribute('data-lang') === currentLang;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-pressed', String(isMatch));
    });

    renderMarquee(currentLang);
    document.dispatchEvent(new CustomEvent('portfolio:langchange', { detail: { lang: currentLang } }));
  }

  window.PortfolioI18n = {
    getLang: () => currentLang,
    t: (key) => (DICT[currentLang] && DICT[currentLang][key]) || key,
    setLang: (lang) => applyLang(lang, true)
  };

  document.addEventListener('DOMContentLoaded', () => {
    applyLang(currentLang, false);
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        applyLang(btn.getAttribute('data-lang'), true);
      });
    });
  });
})();
