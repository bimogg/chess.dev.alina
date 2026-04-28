import { useRef, useEffect, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { ShowcaseScene } from '../Scene/ShowcaseScene'
import { PieceModelViewer } from '../Scene/PieceModelViewer'
import { WhyBoardTopScene } from '../Scene/WhyBoardTopScene'
import VariableProximity from './VariableProximity'
import { FeaturesFloatingPieces } from './FeaturesFloatingPieces'

const FEATURES = [
  {
    name: { en: '3D Board', ru: '3D-доска' },
    desc: {
      en: 'Volumetric pieces, soft shadows, and a comfortable camera.',
      ru: 'Объёмные фигуры, тени и удобная камера.',
    },
  },
  {
    name: { en: 'Play with a Friend', ru: 'Игра с другом' },
    desc: { en: 'Local match on a single device.', ru: 'Локальная партия на одном устройстве.' },
  },
  {
    name: { en: 'Play vs AI', ru: 'Игра против ИИ' },
    desc: { en: 'Local AI that always makes legal moves.', ru: 'Локальный ИИ делает легальные ходы.' },
  },
  {
    name: { en: 'Focus Mode', ru: 'Режим фокуса' },
    desc: { en: 'Highlights legal moves for beginners.', ru: 'Подсветка допустимых ходов для новичков.' },
  },
]

const COPY = {
  navFeatures: { en: 'Features', ru: 'Возможности' },
  navLeaderboard: { en: 'Leaderboard', ru: 'Лидерборд' },
  navOnline: { en: 'Online', ru: 'Онлайн' },
  navSignIn: { en: 'Sign In', ru: 'Войти' },
  navPlay: { en: 'Play', ru: 'Играть' },
  featuresTitle: { en: 'Features', ru: 'Возможности' },
  featuresSub: {
    en: 'Everything you need for a modern 3D chess experience',
    ru: 'Всё, что нужно для современной 3D-игры',
  },
  heroSub: { en: '3D Chess Platform', ru: '3D Шахматная Платформа' },
  startGame: { en: 'Start Game', ru: 'Начать игру' },
  piecesTitle: { en: 'Pieces', ru: 'Фигуры' },
  piecesSub: {
    en: 'Six pieces. Infinite possibilities.',
    ru: 'Шесть фигур. Бесконечные возможности.',
  },
  whyTitle: { en: 'Why ChessVerse', ru: 'Почему ChessVerse' },
  ctaTitle: { en: 'Ready to make your first move?', ru: 'Готовы сделать первый ход?' },
  ctaSub: {
    en: 'Quick game start via link and AI analysis in your browser.',
    ru: 'Быстрый старт партии по ссылке и AI-разбор в браузере.',
  },
  ctaButton: { en: 'Start Game', ru: 'Начать игру' },
} as const

const WHY_ITEMS = [
  {
    num: '01',
    title: { en: 'Immersive 3D Engine', ru: 'Иммерсивный 3D-движок' },
    desc: {
      en: 'Not a flat board: real GLB piece models, shadows, lighting, and a free camera. It feels like a real chess match right in your browser.',
      ru: 'Не плоская доска — настоящие GLB-модели фигур, тени, освещение, свободная камера. Ощущение реальной шахматной партии прямо в браузере.',
    },
  },
  {
    num: '02',
    title: { en: 'Strong AI + Post-game Analysis', ru: 'Сильный ИИ + AI-разбор' },
    desc: {
      en: 'Stockfish with 5 difficulty levels and post-game analysis. Not just a time-killer, but a tool for real improvement.',
      ru: 'Stockfish на 5 уровнях сложности и пост-игровой анализ — это не игрушка для убийства времени, а инструмент для настоящего прогресса.',
    },
  },
  {
    num: '03',
    title: { en: 'Online by Link', ru: 'Онлайн по ссылке' },
    desc: {
      en: 'Play via link with Supabase Realtime. The room syncs moves instantly between devices.',
      ru: 'Игра по ссылке через Supabase Realtime. Комната синхронизирует ходы между устройствами.',
    },
  },
]

const PIECES = [
  {
    pieceKey: 'king',
    name: { en: 'KING', ru: 'КОРОЛЬ' },
    desc: {
      en: 'The key piece in the game. Moves one square in any direction. If the king is under attack, it is check. Your main goal is to keep your king safe.',
      ru: 'Главная фигура партии. Ходит на одну клетку в любом направлении. Когда королю угрожает взятие — это шах. Задача каждого игрока — защитить своего короля.',
    },
    statLabel: { en: 'Status', ru: 'Статус' },
    stat: { en: 'Essential', ru: 'Незаменим' },
  },
  {
    pieceKey: 'queen',
    name: { en: 'QUEEN', ru: 'ФЕРЗЬ' },
    desc: {
      en: 'The most powerful piece on the board. Moves any number of squares horizontally, vertically, or diagonally. Often decides the outcome of modern games.',
      ru: 'Самая мощная фигура на доске. Ходит на любое расстояние по горизонтали, вертикали и диагонали. Определяет исход большинства современных партий.',
    },
    statLabel: { en: 'Value', ru: 'Ценность' },
    stat: { en: '9 pawns', ru: '9 пешек' },
  },
  {
    pieceKey: 'rook',
    name: { en: 'ROOK', ru: 'ЛАДЬЯ' },
    desc: {
      en: 'Moves any number of squares horizontally or vertically. Participates in castling with the king. Especially strong on open files and in endgames.',
      ru: 'Ходит по горизонтали и вертикали на любое расстояние. Участвует в рокировке с королём. Особенно сильна на открытых линиях и в эндшпиле.',
    },
    statLabel: { en: 'Value', ru: 'Ценность' },
    stat: { en: '5 pawns', ru: '5 пешек' },
  },
  {
    pieceKey: 'bishop',
    name: { en: 'BISHOP', ru: 'СЛОН' },
    desc: {
      en: 'A long-range diagonal piece. One bishop controls light squares, the other controls dark squares. Together they create strong pressure across the board.',
      ru: 'Дальнобойная диагональная фигура. Один слон контролирует светлые клетки, другой — тёмные. В паре слоны создают мощное давление по всей доске.',
    },
    statLabel: { en: 'Value', ru: 'Ценность' },
    stat: { en: '3 pawns', ru: '3 пешки' },
  },
  {
    pieceKey: 'knight',
    name: { en: 'KNIGHT', ru: 'КОНЬ' },
    desc: {
      en: 'The only piece that can jump over others. Moves in an L-shape. Extremely useful in closed positions and unexpected tactical combinations.',
      ru: 'Единственная фигура, перепрыгивающая через другие. Ходит буквой «Г». Незаменим в закрытых позициях и неожиданных тактических комбинациях.',
    },
    statLabel: { en: 'Value', ru: 'Ценность' },
    stat: { en: '3 pawns', ru: '3 пешки' },
  },
  {
    pieceKey: 'pawn',
    name: { en: 'PAWN', ru: 'ПЕШКА' },
    desc: {
      en: 'The most numerous piece. Moves forward, captures diagonally. Upon reaching the last rank, it can promote to any piece, most often a queen.',
      ru: 'Самая многочисленная фигура. Ходит вперёд, бьёт по диагонали. Достигнув последней горизонтали, превращается в любую фигуру — чаще всего в ферзя.',
    },
    statLabel: { en: 'Promotion', ru: 'Превращение' },
    stat: { en: 'Any piece', ru: 'В любую фигуру' },
  },
]

export function LandingPage() {
  const [lang, setLang] = useState<'en' | 'ru'>(() => {
    if (typeof window === 'undefined') return 'en'
    const saved = window.localStorage.getItem('cv_lang')
    return saved === 'ru' ? 'ru' : 'en'
  })
  const [navBgTheme, setNavBgTheme] = useState<'dark' | 'light'>('dark')
  const {
    goToSetup, savedGames, loadGame,
    goToMultiplayerLobby, goToLeaderboard, goToProfile,
    openAuthModal, profile, isPro,
  } = useGameStore()
  const lpRef              = useRef<HTMLDivElement>(null)
  const featuresSectionRef = useRef<HTMLElement>(null)
  const piecesRef          = useRef<HTMLElement>(null)
  const startGameButtonRef = useRef<HTMLButtonElement>(null)

  const scrollToFeatures = () =>
    featuresSectionRef.current?.scrollIntoView({ behavior: 'smooth' })

  useEffect(() => {
    const root    = lpRef.current
    const section = piecesRef.current
    if (!root || !section) return
    const cards = Array.from(section.querySelectorAll<HTMLElement>('.lp-piece-card'))
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('lp-piece-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, root }
    )
    cards.forEach(card => observer.observe(card))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const root = lpRef.current
    const updateNavThemeByBackground = () => {
      const nav = document.querySelector<HTMLElement>('.lp-nav')
      if (!nav) return

      const rect = nav.getBoundingClientRect()
      const probeX = Math.min(window.innerWidth - 1, Math.max(0, rect.left + rect.width / 2))
      const probeY = Math.min(window.innerHeight - 1, Math.max(0, rect.bottom - 2))
      const stack = document.elementsFromPoint(probeX, probeY) as HTMLElement[]
      const contentEl = stack.find(node => !node.closest('.lp-nav')) ?? null
      if (!contentEl) return

      const section = contentEl.closest('.lp-hero, .lp-feats, .lp-pieces, .lp-why, .lp-cta, .lp-footer')
      const isDarkSection =
        !!section?.classList.contains('lp-hero') || !!section?.classList.contains('lp-cta')

      setNavBgTheme(isDarkSection ? 'dark' : 'light')
    }

    updateNavThemeByBackground()
    root?.addEventListener('scroll', updateNavThemeByBackground, { passive: true })
    window.addEventListener('scroll', updateNavThemeByBackground, { passive: true })
    window.addEventListener('resize', updateNavThemeByBackground)

    return () => {
      root?.removeEventListener('scroll', updateNavThemeByBackground)
      window.removeEventListener('scroll', updateNavThemeByBackground)
      window.removeEventListener('resize', updateNavThemeByBackground)
    }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-ui-lang', lang)
    document.documentElement.setAttribute('lang', lang === 'ru' ? 'ru' : 'en')
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('cv_lang', lang)
      window.dispatchEvent(new Event('cv-lang-change'))
    }
  }, [lang])

  return (
    <div className="lp" ref={lpRef}>

      {/* ── NAV ── */}
      <nav className={`lp-nav ${navBgTheme === 'dark' ? 'nav--dark-bg' : 'nav--light-bg'}`}>
        <span className="lp-nav-logo">
          Chess<span className="lp-red">Verse</span>
        </span>
        <div className="lp-nav-right">
          <button className="lp-nav-link" onClick={scrollToFeatures}>
            {COPY.navFeatures[lang]}
          </button>
          <button className="lp-nav-link" onClick={goToLeaderboard}>
            {COPY.navLeaderboard[lang]}
          </button>
          <button className="lp-nav-link" onClick={goToMultiplayerLobby}>
            {COPY.navOnline[lang]}
          </button>
          <button
            className="lp-nav-lang"
            onClick={() => setLang(prev => (prev === 'en' ? 'ru' : 'en'))}
            aria-label="Switch language"
            title={lang === 'en' ? 'Switch to Russian' : 'Switch to English'}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2a10 10 0 1 0 10 10A10.01 10.01 0 0 0 12 2Zm7.93 9h-3.06a15.9 15.9 0 0 0-1.13-5.06A8.03 8.03 0 0 1 19.93 11ZM12 4.03c.83 1.08 2.16 3.34 2.8 6.97H9.2C9.84 7.37 11.17 5.11 12 4.03ZM4.07 13h3.06a15.9 15.9 0 0 0 1.13 5.06A8.03 8.03 0 0 1 4.07 13ZM7.13 11H4.07a8.03 8.03 0 0 1 4.19-5.06A15.9 15.9 0 0 0 7.13 11Zm1.07 2h5.6c-.64 3.63-1.97 5.89-2.8 6.97-.83-1.08-2.16-3.34-2.8-6.97Zm7.54 5.06A15.9 15.9 0 0 0 16.87 13h3.06a8.03 8.03 0 0 1-4.19 5.06Z" />
            </svg>
            <span>{lang.toUpperCase()}</span>
          </button>
          {profile ? (
            <button className="lp-btn-sm" onClick={goToProfile}>
              {profile.username} {isPro && '★'}
            </button>
          ) : (
            <button className="lp-btn-sm" onClick={openAuthModal}>
              {COPY.navSignIn[lang]}
            </button>
          )}
          <button className="lp-btn-sm" onClick={goToSetup}>
            {COPY.navPlay[lang]}
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-head">
          <h1 className="lp-hero-title">
            <span className="lp-hero-title-main">ChessVerse</span>
          </h1>
          <p className="lp-hero-sub">{COPY.heroSub[lang]}</p>
          <div className="lp-hero-cta">
            <button ref={startGameButtonRef} className="lp-btn-hero-primary" onClick={goToSetup}>
              <VariableProximity
                label={COPY.startGame[lang]}
                className="lp-start-game-proximity"
                fromFontVariationSettings="'wght' 520, 'opsz' 14"
                toFontVariationSettings="'wght' 1000, 'opsz' 38"
                containerRef={startGameButtonRef}
                radius={110}
                falloff="linear"
              />
            </button>
          </div>
        </div>
        <div className="lp-hero-scene">
          <ShowcaseScene />
        </div>
      </section>

      {/* ── SAVED GAMES ── */}
      {savedGames.length > 0 && (
        <div className="lp-resume-strip">
          <span className="lp-resume-label">Продолжить партию</span>
          <div className="lp-resume-games">
            {savedGames.slice(0, 3).map(g => (
              <button key={g.id} className="lp-resume-btn" onClick={() => loadGame(g.id)}>
                <span>{g.moves} ходов</span>
                <span className="lp-resume-date">{g.date}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── FEATURES ── compact 2×3 grid, single screen ── */}
      <section
        id="features"
        className="lp-feats"
        ref={featuresSectionRef}
        aria-labelledby="features-heading"
      >
        <FeaturesFloatingPieces />
        <div className="lp-container">
          <div className="lp-feats-heading-wrap">
            <div className="lp-section-header lp-feats-header">
              <div className="lp-feats-heading-row">
                <h2 id="features-heading" className="lp-section-title lp-feats-title">
                  {COPY.featuresTitle[lang]}
                </h2>
                <div className="lp-feats-heading-rule-wrap" aria-hidden="true">
                  <span className="lp-feats-heading-rule" />
                </div>
              </div>
              <p id="features-sub" className="lp-section-sub lp-feats-sub">
                {COPY.featuresSub[lang]}
              </p>
            </div>
          </div>

          <div className="lp-feats-grid">
            {FEATURES.slice(0, 4).map((f, i) => (
              <div key={`feat-${i}-${f.name.en}`} className="lp-feat-card">
                <div className="lp-feat-card-kicker">0{i + 1}</div>
                <h3 className="lp-feat-card-name">{f.name[lang]}</h3>
                <p className="lp-feat-card-desc">{f.desc[lang]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PIECES SHOWCASE ── */}
      <section className="lp-pieces" ref={piecesRef}>
        <div className="lp-container">
          <div className="lp-section-header lp-pieces-header">
            <div className="lp-pieces-heading-row">
              <h2 className="lp-section-title lp-pieces-title">{COPY.piecesTitle[lang]}</h2>
              <div className="lp-pieces-heading-rule-wrap" aria-hidden="true">
                <span className="lp-pieces-heading-rule" />
              </div>
            </div>
            <p className="lp-section-sub lp-pieces-sub">{COPY.piecesSub[lang]}</p>
          </div>
        </div>
        <div className="lp-pieces-grid">
          {PIECES.map((p, i) => (
            <div
              key={p.pieceKey}
              className="lp-piece-card"
              style={{ '--pc-delay': `${i * 0.07}s` } as React.CSSProperties}
            >
              <div className="lp-piece-card-visual">
                <PieceModelViewer pieceKey={p.pieceKey} />
              </div>
              <div className="lp-piece-card-info">
                <div className="lp-piece-card-top">
                  <p className="lp-piece-card-name">{p.name[lang]}</p>
                  <p className="lp-piece-card-desc">{p.desc[lang]}</p>
                </div>
                <div className="lp-piece-card-stat">
                  <span className="lp-piece-card-stat-label">{p.statLabel[lang]}</span>
                  <span className="lp-piece-card-stat-val">{p.stat[lang]}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY ── */}
      <section className="lp-why">
        <div className="lp-container">
          <div className="lp-why-layout">
            <div className="lp-why-visual" aria-hidden="true">
              <div className="lp-why-visual-canvas">
                <WhyBoardTopScene />
              </div>
            </div>

            <div className="lp-why-content">
              <div className="lp-section-header">
                <h2 className="lp-section-title">{COPY.whyTitle[lang]}</h2>
              </div>
              <div className="lp-why-list">
                {WHY_ITEMS.map(w => (
                  <div key={w.num} className="lp-why-item">
                    <div className="lp-why-num">{w.num}</div>
                    <div className="lp-why-title">{w.title[lang]}</div>
                    <div className="lp-why-desc">{w.desc[lang]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta">
        <h2 className="lp-cta-title">{COPY.ctaTitle[lang]}</h2>
        <p className="lp-cta-sub">{COPY.ctaSub[lang]}</p>
        <button className="lp-btn-primary" onClick={goToSetup}>
          {COPY.ctaButton[lang]}
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <span className="lp-footer-logo">
          Chess<span className="lp-red">Verse</span> 3D
        </span>
        <span className="lp-footer-stack">React · Three.js · Stockfish · Supabase</span>
      </footer>

    </div>
  )
}
