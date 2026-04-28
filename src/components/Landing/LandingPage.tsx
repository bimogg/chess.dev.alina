import { useRef, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import { ShowcaseScene } from '../Scene/ShowcaseScene'
import { PieceModelViewer } from '../Scene/PieceModelViewer'

const FEATURES = [
  { name: '3D-доска',       desc: 'Объёмные фигуры, тени и удобная камера.' },
  { name: 'Игра с другом',  desc: 'Локальная партия на одном устройстве.' },
  { name: 'Игра против ИИ', desc: 'Локальный ИИ делает легальные ходы.' },
  { name: 'Режим фокуса',   desc: 'Подсветка допустимых ходов для новичков.' },
  { name: 'История партий', desc: 'Сохранение ходов и завершённых игр.' },
  { name: 'AI-разбор',      desc: 'Разбор ошибок и сильных ходов после партии.' },
]

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
  const {
    goToSetup, savedGames, loadGame,
    goToMultiplayerLobby, goToLeaderboard, goToProfile,
    appTheme, toggleAppTheme, openAuthModal, profile, isPro,
  } = useGameStore()
  const lpRef              = useRef<HTMLDivElement>(null)
  const featuresSectionRef = useRef<HTMLElement>(null)
  const piecesRef          = useRef<HTMLElement>(null)

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
            Возможности
          </button>
          <button className="lp-nav-link" onClick={goToLeaderboard}>
            Лидерборд
          </button>
          <button className="lp-nav-link" onClick={goToMultiplayerLobby}>
            Онлайн
          </button>
          {profile ? (
            <button className="lp-btn-sm" onClick={goToProfile}>
              {profile.username} {isPro && '★'}
            </button>
          ) : (
            <button className="lp-btn-sm" onClick={openAuthModal}>
              Войти
            </button>
          )}
          <button className="lp-nav-theme" onClick={toggleAppTheme} title="Переключить тему">
            {appTheme === 'dark' ? '🌙' : '☀️'}
          </button>
          <button className="lp-btn-sm" onClick={goToSetup}>
            Играть
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
            <button className="lp-btn-hero-primary" onClick={goToSetup}>
              Start Game
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
      <section className="lp-feats" ref={featuresSectionRef}>
        <div className="lp-container">
          <div className="lp-section-header">
            <h2 className="lp-section-title">Возможности</h2>
            <p className="lp-section-sub">Всё, что нужно для современной 3D-игры</p>
          </div>

          <div className="lp-feats-grid">
            {FEATURES.map((f, i) => (
              <div key={f.name} className="lp-feat-card">
                <div className="lp-feat-card-kicker">0{i + 1}</div>
                <h3 className="lp-feat-card-name">{f.name}</h3>
                <p className="lp-feat-card-desc">{f.desc}</p>
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
