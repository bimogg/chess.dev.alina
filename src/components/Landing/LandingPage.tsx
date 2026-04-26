import { useRef, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import { ShowcaseScene } from '../Scene/ShowcaseScene'
import { PieceModelViewer } from '../Scene/PieceModelViewer'

const FEATURES = [
  {
    num: '01',
    name: '3D-доска',
    desc: 'Иммерсивная шахматная доска с объёмными фигурами, тенями и удобной камерой.',
    visual: 'board',
  },
  {
    num: '02',
    name: 'Stockfish ИИ',
    desc: 'Настоящий шахматный движок — 5 уровней сложности от новичка до эксперта.',
    visual: 'ai',
    isNew: true,
  },
  {
    num: '03',
    name: 'Игра онлайн по ссылке',
    desc: 'Создайте комнату, отправьте ссылку другу — играйте напрямую через P2P. Без серверов.',
    visual: 'mp',
    isNew: true,
  },
  {
    num: '04',
    name: 'AI Coach',
    desc: 'Stockfish разбирает каждый ход после партии: точность, блaндеры, рекомендации.',
    visual: 'coach',
    isNew: true,
  },
  {
    num: '05',
    name: 'Лидерборд по городам',
    desc: 'ELO-рейтинг, топ-игроки, фильтр по вашему городу. Соревнуйтесь с локалом.',
    visual: 'history',
    isNew: true,
  },
  {
    num: '06',
    name: 'Premium-скины',
    desc: 'Pro-аккаунт открывает Gold, Marble и Neon скины фигур. Ваша доска — ваш стиль.',
    visual: 'friend',
    isNew: true,
  },
]

const BOARD_SQUARES = Array.from({ length: 64 }, (_, i) => i)
const FOCUS_SQUARES = new Set([27, 28, 35, 36])
const HISTORY_MOVES = ['1.  Magnus       2210', '2.  Hikaru_AI   2087', '3.  pawn_storm  1923', '4.  queen_sac    1854', '5.  silent_rook 1799']

function FeatureVisual({ visual }: { visual: string }) {
  if (visual === 'board') {
    return (
      <div className="lp-vis-board">
        {BOARD_SQUARES.map(i => (
          <div key={i} className={`lp-vis-sq${(Math.floor(i / 8) + i % 8) % 2 === 0 ? ' lp-vis-sq--light' : ''}`} />
        ))}
      </div>
    )
  }
  if (visual === 'focus') {
    return (
      <div className="lp-vis-board">
        {BOARD_SQUARES.map(i => (
          <div
            key={i}
            className={[
              'lp-vis-sq',
              (Math.floor(i / 8) + i % 8) % 2 === 0 ? 'lp-vis-sq--light' : '',
              FOCUS_SQUARES.has(i) ? 'lp-vis-sq--focus' : '',
            ].join(' ').trim()}
          />
        ))}
      </div>
    )
  }
  if (visual === 'friend') {
    return (
      <div className="lp-vis-friend">
        <span style={{ color: 'rgba(212,168,67,0.18)' }}>♕</span>
        <span style={{ color: 'rgba(0,255,225,0.18)' }}>♚</span>
      </div>
    )
  }
  if (visual === 'ai') {
    return <div className="lp-vis-ai">SF</div>
  }
  if (visual === 'mp') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        <div className="lp-vis-mp">
          <span>♔</span>
          <span style={{ fontSize: '0.6em' }}>↔</span>
          <span>♚</span>
        </div>
        <div className="lp-vis-mp-link">cv-x7k2qm9p</div>
      </div>
    )
  }
  if (visual === 'history') {
    return (
      <div className="lp-vis-history">
        {HISTORY_MOVES.map(m => <span key={m}>{m}</span>)}
      </div>
    )
  }
  if (visual === 'coach') {
    return (
      <div className="lp-vis-coach">
        {['97%','94%','📈','♚×','▲','✓'].map(s => <span key={s}>{s}</span>)}
      </div>
    )
  }
  return null
}

const WHY_ITEMS = [
  {
    num: '01',
    title: 'Иммерсивный 3D-движок',
    desc: 'Не плоская доска — настоящие GLB-модели фигур, тени, освещение, свободная камера. Ощущение реальной шахматной партии прямо в браузере.',
  },
  {
    num: '02',
    title: 'Серьёзный ИИ + AI Coach',
    desc: 'Stockfish 16 на 5 уровнях сложности и пост-игровой анализ — это не игрушка для убийства времени, а инструмент для настоящего прогресса.',
  },
  {
    num: '03',
    title: 'P2P без сервера',
    desc: 'Мультиплеер через WebRTC — ваши ходы идут напрямую другу, минуя нас. Это и приватнее, и быстрее, и не требует ничего настраивать.',
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
    appTheme, toggleAppTheme, openProUpgrade, openAuthModal, profile, isPro,
  } = useGameStore()
  const lpRef              = useRef<HTMLDivElement>(null)
  const featuresSectionRef = useRef<HTMLElement>(null)
  const featuresRef        = useRef<(HTMLDivElement | null)[]>([])
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

  useEffect(() => {
    const root   = lpRef.current
    const slides = featuresRef.current.filter((el): el is HTMLDivElement => el !== null)
    if (!root || !slides.length) return
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('lp-feat-slide--visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, root }
    )
    slides.forEach(slide => observer.observe(slide))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="lp" ref={lpRef}>

      {/* ── NAV ── */}
      <nav className="lp-nav">
        <span className="lp-nav-logo">
          Chess<span className="lp-red">Verse</span> 3D
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
          <button className="lp-nav-theme" onClick={toggleAppTheme} title="Toggle theme">
            {appTheme === 'dark' ? '🌙' : '☀️'}
          </button>
          <button className="lp-btn-sm" onClick={goToSetup}>
            Играть
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">

        <div className="lp-hero-left">
          <p className="lp-hero-label">NFACTORIAL &bull; 2 ТУР</p>
          <h1 className="lp-hero-title">
            <span className="lp-hero-title-main">ChessVerse</span>
            <span className="lp-hero-title-3d">3D</span>
          </h1>
          <p className="lp-hero-sub">
            Иммерсивные 3D-шахматы с настоящим Stockfish, AI Coach
            и онлайн-игрой по ссылке. Прямо в браузере.
          </p>
          <div className="lp-hero-cta">
            <button className="lp-btn-hero-primary" onClick={goToSetup}>
              Начать игру
            </button>
            <button className="lp-btn-hero-ghost" onClick={goToMultiplayerLobby}>
              ✦ Играть с другом
            </button>
            <button className="lp-btn-hero-ghost" onClick={openProUpgrade}>
              ★ Pro
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

      {/* ── FEATURES ── */}
      <section className="lp-feats" ref={featuresSectionRef}>
        {FEATURES.map((f, i) => (
          <div
            key={f.num}
            className="lp-feat-slide"
            ref={el => { featuresRef.current[i] = el }}
          >
            <div className="lp-feat-slide-line" />

            <div className="lp-feat-slide-left">
              <div className="lp-feat-slide-inner">
                <span className="lp-feat-slide-num">{f.num}</span>
                <h3 className="lp-feat-slide-name">
                  {f.name}
                  {f.isNew && <span className="lp-new">NEW</span>}
                </h3>
                <p className="lp-feat-slide-desc">{f.desc}</p>
              </div>
            </div>

            <div className="lp-feat-slide-right">
              <FeatureVisual visual={f.visual} />
            </div>
          </div>
        ))}
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
            <h2 className="lp-section-title">Почему ChessVerse 3D</h2>
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
          Бесплатно. Без серверов. Прямо в браузере.
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
        <span className="lp-footer-mid">Создано Алиной · nFactorial 2 тур</span>
        <span className="lp-footer-stack">React · Three.js · Stockfish · PeerJS · Supabase</span>
      </footer>

    </div>
  )
}
