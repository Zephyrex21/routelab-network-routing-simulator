import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('RouteLab encountered a rendering error:', error, info);
  }

  handleReload = () => window.location.reload();

  render() {
    if (this.state.hasError) {
      return (
        <main className="runtime-error-screen" role="alert">
          <div className="runtime-error-card">
            <span className="runtime-error-icon"><AlertTriangle size={21} /></span>
            <p className="eyebrow muted">ROUTELAB / RECOVERY</p>
            <h1>Something interrupted this workspace.</h1>
            <p>The application hit an unexpected rendering error. Your locally saved projects are not cleared by this screen.</p>
            <button className="button button-primary" type="button" onClick={this.handleReload}>
              <RefreshCw size={14} /> Reload RouteLab
            </button>
            <span className="runtime-error-hint">For details, open the browser console with F12.</span>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
