import { Component } from 'react'

// Vangt fouten in de render/effect-fase op zodat we nooit een wit scherm
// krijgen, maar een leesbare melding (handig om snel te debuggen).
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('App-fout:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
            padding: 40,
            background: '#060b14',
            color: '#e6edf6',
            fontFamily: 'system-ui, sans-serif',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: 40 }}>⚓💥</div>
          <h2 style={{ margin: 0 }}>Er ging iets mis bij het laden</h2>
          <pre
            style={{
              maxWidth: 760,
              whiteSpace: 'pre-wrap',
              color: '#f87171',
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.3)',
              borderRadius: 10,
              padding: 16,
              fontSize: 13,
              textAlign: 'left'
            }}
          >
            {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}
