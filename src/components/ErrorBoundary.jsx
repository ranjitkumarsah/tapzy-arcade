import { Component } from 'react'

// Catches render/runtime errors inside a game so a crash shows a friendly
// fallback (with a way back to the menu) instead of a blank white screen.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Game crashed:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-screen">
          <div className="app-logo">😵</div>
          <h2>Oops — that game hit a snag</h2>
          <p>Sorry about that. Let’s head back to the menu.</p>
          <button className="btn btn-primary" onClick={this.props.onReset}>
            🏠 Back to menu
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
