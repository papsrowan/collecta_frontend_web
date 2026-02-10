'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function useIsVisible(ref: React.RefObject<Element | null>, once = true) {
  const [isVisible, setIsVisible] = useState(false);
  const hasShown = useRef(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        if (once && hasShown.current) return;
        hasShown.current = true;
        setIsVisible(true);
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, once]);
  return isVisible;
}

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const screenshotsRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  const heroVisible = useIsVisible(heroRef, true);
  const featuresVisible = useIsVisible(featuresRef, true);
  const screenshotsVisible = useIsVisible(screenshotsRef, true);
  const ctaVisible = useIsVisible(ctaRef, true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    const token = localStorage.getItem('token')?.trim();
    if (token) {
      const role = localStorage.getItem('userRole')?.toUpperCase();
      if (role === 'SUPERADMIN') router.replace('/super-admin/dashboard');
      else router.replace('/dashboard');
    }
  }, [mounted, router]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] overflow-x-hidden">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#f8fafc]/80 backdrop-blur-md border-b border-[#e2e8f0]/60 transition-all duration-300">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#3EB881] flex items-center justify-center shadow-lg shadow-[#3EB881]/25">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-bold text-xl text-[#1e293b] tracking-tight">Collecta</span>
          </div>
          <Link
            href="/login"
            className="text-sm font-semibold text-[#3EB881] hover:text-[#2d9d6b] transition-colors px-4 py-2 rounded-lg hover:bg-[#3EB881]/10"
          >
            Connexion
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section
        ref={heroRef}
        className={`pt-28 pb-16 sm:pt-36 sm:pb-24 px-4 sm:px-6 lg:px-8 transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center lg:gap-16">
          <div className="flex-1 text-center lg:text-left">
            <p className="text-[#3EB881] font-semibold text-sm uppercase tracking-wider mb-4">Collecte journalière</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0f172a] tracking-tight leading-[1.1] mb-6">
              Gérez vos collectes en toute simplicité
            </h1>
            <p className="text-lg sm:text-xl text-[#64748b] max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
              Plateforme dédiée aux microfinances pour suivre les versements, les retraits et les comptes de vos clients au quotidien.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#3EB881] text-white font-semibold text-base shadow-lg shadow-[#3EB881]/30 hover:bg-[#2d9d6b] hover:shadow-[#3EB881]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
              >
                Accéder à l&apos;administration
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
          <div className="flex-1 mt-12 lg:mt-0 flex justify-center">
            <div className="landing-float w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border border-[#e2e8f0] bg-[#e2e8f0]">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80"
                alt="Collectrice avec téléphone en main dans un marché - Collecta"
                className="w-full h-full object-cover"
                width={800}
                height={600}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        ref={featuresRef}
        className={`landing-section py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white/60 ${featuresVisible ? 'visible' : ''}`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0f172a] mb-4">Tout ce dont vous avez besoin</h2>
            <p className="text-[#64748b] text-lg max-w-2xl mx-auto">
              Une solution complète pour les agents, les caissiers et les administrateurs des microfinances.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              {
                title: 'Collecte simplifiée',
                desc: 'Enregistrez les versements et suivez les comptes en temps réel depuis le terrain.',
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                ),
              },
              {
                title: 'Suivi en temps réel',
                desc: 'Tableaux de bord et statistiques pour piloter votre activité au quotidien.',
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
              },
              {
                title: 'Multi-microfinances',
                desc: 'Gestion centralisée pour les super-admins et une vue par établissement.',
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                ),
              },
              {
                title: 'Sécurité & traçabilité',
                desc: 'Authentification sécurisée, rôles et historique des opérations.',
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
              },
            ].map((item, i) => (
              <div
                key={item.title}
                className="group rounded-2xl p-6 sm:p-7 bg-white border border-[#e2e8f0] shadow-sm hover:shadow-lg hover:border-[#3EB881]/30 transition-all duration-300"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="w-14 h-14 rounded-xl bg-[#3EB881]/10 text-[#3EB881] flex items-center justify-center mb-5 group-hover:bg-[#3EB881]/20 transition-colors">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-lg text-[#0f172a] mb-2">{item.title}</h3>
                <p className="text-[#64748b] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Découvrez l'application en images */}
      <section
        ref={screenshotsRef}
        className={`landing-section py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#f1f5f9]/50 ${screenshotsVisible ? 'visible' : ''}`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0f172a] mb-4">Découvrez l&apos;application</h2>
            <p className="text-[#64748b] text-lg max-w-2xl mx-auto">
              Quelques écrans clés de Collecta pour visualiser les fonctionnalités au quotidien.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12">
            <div className="rounded-2xl overflow-hidden border border-[#e2e8f0] bg-white shadow-lg">
              <div className="aspect-video bg-[#e2e8f0] overflow-hidden">
                <img
                  src="/images/tableau-de-bord.png"
                  alt="Tableau de bord Collecta - Vue d'ensemble de l'activité"
                  className="w-full h-full object-contain object-top"
                  width={800}
                  height={450}
                />
              </div>
              <div className="p-6">
                <h3 className="font-semibold text-lg text-[#0f172a] mb-2">Tableau de bord</h3>
                <p className="text-[#64748b] text-sm leading-relaxed">
                  Vue d&apos;ensemble de l&apos;activité en un coup d&apos;œil : total des versements et des retraits, frais d&apos;entretien, solde des comptes, versements et retraits du jour, nombre de commerçants et d&apos;agents actifs. Un résumé financier (revenus, sorties, bénéfice net) et les informations sur les comptes permettent de piloter la microfinance au quotidien.
                </p>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden border border-[#e2e8f0] bg-white shadow-lg">
              <div className="aspect-video bg-[#e2e8f0] overflow-hidden">
                <img
                  src="/images/gestion-agents.png"
                  alt="Gestion des agents Collecta"
                  className="w-full h-full object-contain object-top"
                  width={800}
                  height={450}
                />
              </div>
              <div className="p-6">
                <h3 className="font-semibold text-lg text-[#0f172a] mb-2">Gestion des agents</h3>
                <p className="text-[#64748b] text-sm leading-relaxed">
                  Créez et gérez vos agents de collecte : recherche par nom, code, téléphone, zone ou email, ajout d&apos;un nouvel agent. Pour chaque agent, consultation des informations (code, téléphone, zone, objectif mensuel, email) et actions rapides : consulter l&apos;historique d&apos;activité, gérer l&apos;identifiant ou supprimer l&apos;agent.
                </p>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden border border-[#e2e8f0] bg-white shadow-lg">
              <div className="aspect-video bg-[#e2e8f0] overflow-hidden">
                <img
                  src="/images/frais-entretien.png"
                  alt="Gestion des frais d'entretien Collecta"
                  className="w-full h-full object-contain object-top"
                  width={800}
                  height={450}
                />
              </div>
              <div className="p-6">
                <h3 className="font-semibold text-lg text-[#0f172a] mb-2">Gestion des frais d&apos;entretien</h3>
                <p className="text-[#64748b] text-sm leading-relaxed">
                  Définissez un taux global appliqué par défaut à tous les clients (affichage du taux actuel et mise à jour). Vous pouvez aussi attribuer un taux spécifique à un client donné via son numéro de compte : ce taux remplace le taux global pour ce client uniquement, pour une tarification personnalisée.
                </p>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden border border-[#e2e8f0] bg-white shadow-lg">
              <div className="aspect-video bg-[#e2e8f0] overflow-hidden">
                <img
                  src="/images/historique-agent.png"
                  alt="Historique d'activité d'un agent Collecta"
                  className="w-full h-full object-contain object-top"
                  width={800}
                  height={450}
                />
              </div>
              <div className="p-6">
                <h3 className="font-semibold text-lg text-[#0f172a] mb-2">Historique d&apos;activité des agents</h3>
                <p className="text-[#64748b] text-sm leading-relaxed">
                  Suivi détaillé des actions de chaque agent : identité de l&apos;agent (nom, code, zone), filtres par période (date début / date fin) et par type d&apos;activité (tous, versements, clients, KYC). Chaque événement (ex. commerçant ajouté) est affiché avec les détails (nom, téléphone, zone, boutique) et l&apos;horodatage. Export possible en PDF ou Excel pour reporting et audits.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        ref={ctaRef}
        className={`landing-section py-20 sm:py-28 px-4 sm:px-6 lg:px-8 ${ctaVisible ? 'visible' : ''}`}
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="rounded-3xl bg-gradient-to-br from-[#3EB881] to-[#2d9d6b] p-10 sm:p-14 shadow-2xl shadow-[#3EB881]/25">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
              Prêt à gérer vos collectes ?
            </h2>
            <p className="text-white/90 text-lg mb-8 max-w-xl mx-auto">
              Accédez à l&apos;espace d&apos;administration pour commencer à travailler.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-[#3EB881] font-semibold text-base shadow-lg hover:bg-[#f8fafc] hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
            >
              Accéder à l&apos;administration
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact pour accès */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-[#f1f5f9] border-t border-[#e2e8f0]">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-[#64748b] text-sm font-medium mb-2">Pour obtenir un accès à la plateforme</p>
          <p className="text-[#1e293b] font-semibold mb-1">Contactez le directeur commercial</p>
          <p className="text-[#3EB881] font-medium">
            <a href="tel:+237658841880" className="hover:underline">658 84 18 80</a>
            <span className="text-[#94a3b8] mx-2">/</span>
            <a href="tel:+237678942011" className="hover:underline">678 94 20 11</a>
          </p>
          <p className="mt-1">
            <a href="mailto:papsrowan@gmail.com" className="text-[#3EB881] font-medium hover:underline">papsrowan@gmail.com</a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-[#e2e8f0] bg-white/40">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#3EB881] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-semibold text-[#1e293b]">Collecta</span>
          </div>
          <Link
            href="/login"
            className="text-sm font-medium text-[#3EB881] hover:text-[#2d9d6b] transition-colors"
          >
            Connexion administration
          </Link>
        </div>
      </footer>
    </div>
  );
}
