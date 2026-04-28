import { useRef, useEffect, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { ShowcaseScene } from '../Scene/ShowcaseScene'
import { PieceModelViewer } from '../Scene/PieceModelViewer'
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
} as const

const WHY_ITEMS = [
  {
    num: '01',
    title: 'Иммерсивный 3D-движок',
    desc: 'Не плоская доска — настоящие GLB-модели фигур, тени, освещение, свободная камера. Ощущение реальной шахматной партии прямо в браузере.',
  },
  {
    num: '02',
    title: 'Сильный ИИ + AI-разбор',
    desc: 'Stockfish на 5 уровнях сложности и пост-игровой анализ — это не игрушка для убийства времени, а инструмент для настоящего прогресса.',
  },
  {
    num: '03',
    title: 'Онлайн по ссылке',
    desc: 'Игра по ссылке через Supabase Realtime. Комната синхронизирует ходы между устройствами.',
  },
]

const PIECES = [
  {
    pieceKey: 'king',
    name: 'КОРОЛЬ',
    desc: 'Главная фигура партии. Ходит на одну клетку в любом направлении. Когда королю угрожает взятие — это шах. Задача каждого игрока — защитить своего короля.',
    statLabel: 'Статус',
    stat: 'Незаменим',
  },
  {
    pieceKey: 'queen',
    name: 'ФЕРЗЬ',
    desc: 'Самая мощная фигура на доске. Ходит на любое расстояние по горизонтали, вертикали и диагонали. Определяет исход большинства современных партий.',
    statLabel: 'Ценность',
    stat: '9 пешек',
  },
  {
    pieceKey: 'rook',
    name: 'ЛАДЬЯ',
    desc: 'Ходит по горизонтали и вертикали на любое расстояние. Участвует в рокировке с королём. Особенно сильна на открытых линиях и в эндшпиле.',
    statLabel: 'Ценность',
    stat: '5 пешек',
  },
  {
    pieceKey: 'bishop',
    name: 'СЛОН',
    desc: 'Дальнобойная диагональная фигура. Один слон контролирует светлые клетки, другой — тёмные. В паре слоны создают мощное давление по всей доске.',
    statLabel: 'Ценность',
    stat: '3 пешки',
  },
  {
    pieceKey: 'knight',
    name: 'КОНЬ',
    desc: 'Единственная фигура, перепрыгивающая через другие. Ходит буквой «Г». Незаменим в закрытых позициях и неожиданных тактических комбинациях.',
    statLabel: 'Ценность',
    stat: '3 пешки',
  },
  {
    pieceKey: 'pawn',
    name: 'ПЕШКА',
    desc: 'Самая многочисленная фигура. Ходит вперёд, бьёт по диагонали. Достигнув последней горизонтали, превращается в любую фигуру — чаще всего в ферзя.',
    statLabel: 'Превращение',
    stat: 'В любую фигуру',
  },
]

export function LandingPage() {
  const [lang, setLang] = useState<'en' | 'ru'>('en')
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

  return (
    <div className="lp" ref={lpRef}>

      {/* ── NAV ── */}
      <nav className="lp-nav">
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
          <p className="lp-hero-sub">3D Chess Platform</p>
          <div className="lp-hero-cta">
            <button ref={startGameButtonRef} className="lp-btn-hero-primary" onClick={goToSetup}>
              <VariableProximity
                label="Start Game"
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
          <div className="lp-section-header">
            <h2 className="lp-section-title">Фигуры</h2>
            <p className="lp-section-sub">Шесть фигур. Бесконечные возможности.</p>
          </div>
        </div>
        <div className="lp-pieces-grid">
          {PIECES.map((p, i) => (
            <div
              key={p.name}
              className="lp-piece-card"
              style={{ '--pc-delay': `${i * 0.07}s` } as React.CSSProperties}
            >
              <div className="lp-piece-card-visual">
                <PieceModelViewer pieceKey={p.pieceKey} />
              </div>
              <div className="lp-piece-card-info">
                <div className="lp-piece-card-top">
                  <p className="lp-piece-card-name">{p.name}</p>
                  <p className="lp-piece-card-desc">{p.desc}</p>
                </div>
                <div className="lp-piece-card-stat">
                  <span className="lp-piece-card-stat-label">{p.statLabel}</span>
                  <span className="lp-piece-card-stat-val">{p.stat}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY ── */}
      <section className="lp-why">
        <div className="lp-container">
          <div className="lp-section-header">
            <h2 className="lp-section-title">Почему ChessVerse</h2>
          </div>
          <div className="lp-why-grid">
            {WHY_ITEMS.map(w => (
              <div key={w.num} className="lp-why-item">
                <div className="lp-why-num">{w.num}</div>
                <div className="lp-why-title">{w.title}</div>
                <div className="lp-why-desc">{w.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta">
        <h2 className="lp-cta-title">Готовы сделать первый ход?</h2>
        <p className="lp-cta-sub">
          Быстрый старт партии по ссылке и AI-разбор в браузере.
        </p>
        <button className="lp-btn-primary" onClick={goToSetup}>
          Начать игру
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
