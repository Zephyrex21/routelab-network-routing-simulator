import {
  Activity, ArrowRight, ArrowUpRight, BarChart3, GitBranch, Network, Route,
  ShieldAlert, Waypoints, Moon, Sun, Sparkles,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Brand from '../../components/layout/Brand.jsx';
import Button from '../../components/ui/Button.jsx';
import IconButton from '../../components/ui/IconButton.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { useTheme } from '../../app/ThemeProvider.jsx';
import NetworkIllustration from './NetworkIllustration.jsx';

const features = [
  { icon: Waypoints, number: '01', title: 'Design a network', description: 'Build a weighted topology with routers, links and configurable connection costs.', to: '/lab/studio', label: 'Open Network Studio' },
  { icon: Activity, number: '02', title: 'Follow every decision', description: 'Step through Distance Vector updates, LSA flooding and Dijkstra calculations.', to: '/lab/simulation', label: 'Explore simulations' },
  { icon: Route, number: '03', title: 'Trace a packet journey', description: 'See how each router chooses its next hop and forwards a conceptual packet.', to: '/lab/packets', label: 'Open Packet Explorer' },
  { icon: ShieldAlert, number: '04', title: 'Experiment with failures', description: 'Disable a link or change its cost, then inspect how available routes respond.', to: '/lab/failures', label: 'Run an experiment' },
  { icon: BarChart3, number: '05', title: 'Compare routing models', description: 'Compare route costs, reachability, next hops and algorithm-specific work metrics.', to: '/lab/compare', label: 'Compare algorithms' },
  { icon: GitBranch, number: '06', title: 'Understand the logic', description: 'Inspect routing tables and the events that explain how a route was selected.', to: '/lab/simulation', label: 'Explore routing logic' },
];

export default function PublicHomePage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const ThemeIcon = theme === 'dark' ? Sun : Moon;

  return (
    <div className="public-site">
      <header className="public-header">
        <div className="public-header-inner">
          <Link to="/" className="public-brand" aria-label="RouteLab home"><Brand /></Link>
          <nav className="public-nav" aria-label="Main navigation">
            <a href="#features">Explore</a>
            <a href="#algorithms">Routing models</a>
            <a href="#workflow">How it works</a>
          </nav>
          <div className="public-header-actions">
            <IconButton icon={ThemeIcon} label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} onClick={toggleTheme} />
            <Button size="sm" icon={ArrowUpRight} onClick={() => navigate('/lab/studio')}>Enter the lab</Button>
          </div>
        </div>
      </header>

      <main className="public-main">
        <section className="public-hero">
          <div className="public-hero-copy">
            <div className="public-kicker"><span className="eyebrow-mark" /> COMPUTER NETWORKS / INTERACTIVE LEARNING LAB</div>
            <Badge tone="success" dot>Explore routing, visually</Badge>
            <h1>See how networks <span>find their way.</span></h1>
            <p className="public-hero-description">Build a network, follow routing decisions step by step, and watch packets find their way across connected routers. RouteLab makes the logic behind Distance Vector and Link State easier to see.</p>
            <div className="public-hero-actions">
              <Button size="lg" icon={Network} iconRight={ArrowRight} onClick={() => navigate('/lab/studio')}>Go to the lab</Button>
              <a href="#features" className="public-secondary-link">Explore the experience <ArrowUpRight size={16} /></a>
            </div>
            <div className="public-proof-row" aria-label="Project scope">
              <div><strong>02</strong><span>routing models</span></div>
              <span className="public-proof-divider" />
              <div><strong>06</strong><span>learning workspaces</span></div>
              <span className="public-proof-divider" />
              <div><strong>20</strong><span>routers per topology</span></div>
            </div>
          </div>

          <div className="public-visual-wrap">
            <div className="public-visual-glow" />
            <div className="public-visual-window">
              <div className="public-window-bar">
                <div className="public-window-dots"><i /><i /><i /></div>
                <span>ROUTELAB / NETWORK STUDIO</span>
                <Badge tone="subtle">Interactive preview</Badge>
              </div>
              <div className="public-window-canvas">
                <NetworkIllustration />
                <div className="public-canvas-caption"><span className="public-live-dot" /> Weighted network topology</div>
              </div>
              <div className="public-window-footer">
                <span><i className="public-legend-router" /> Routers</span>
                <span><i className="public-legend-link" /> Weighted links</span>
                <span className="public-window-meta">Build · simulate · understand</span>
              </div>
            </div>
            <div className="public-floating-note"><span className="public-floating-icon"><Activity size={17} /></span><div><strong>Routing, made visible.</strong><span>From topology to next hop.</span></div></div>
          </div>
        </section>

        <section className="public-value-strip" aria-label="RouteLab project scope">
          <div><span className="public-value-mark"><Network size={18} /></span><div><strong>One shared topology</strong><span>Both models use the same network input</span></div></div>
          <div><span className="public-value-mark"><Activity size={18} /></span><div><strong>Step-by-step learning</strong><span>Inspect events, tables and route choices</span></div></div>
          <div><span className="public-value-mark"><Sparkles size={18} /></span><div><strong>Safe experiments</strong><span>Change links without losing your baseline</span></div></div>
        </section>

        <section className="public-section" id="features">
          <div className="public-section-heading">
            <div><span className="public-section-kicker">THE ROUTELAB WORKSPACE</span><h2>Everything you need to <span>understand the route.</span></h2></div>
            <p>Move from building a network to inspecting the decisions routers make. Each workspace focuses on one part of the routing process.</p>
          </div>
          <div className="public-feature-grid">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link to={feature.to} className="public-feature-card" key={feature.number}>
                  <div className="public-feature-top"><span>{feature.number}</span><span className="public-feature-icon"><Icon size={19} strokeWidth={1.8} /></span></div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  <span className="public-feature-link">{feature.label} <ArrowUpRight size={15} /></span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="public-section public-algorithms" id="algorithms">
          <div className="public-section-heading public-section-heading-tight">
            <div><span className="public-section-kicker">TWO ROUTING APPROACHES</span><h2>Different ideas. <span>One destination.</span></h2></div>
            <p>Explore how the two classic routing approaches learn about a network and calculate paths to destinations.</p>
          </div>
          <div className="public-algorithm-grid">
            <article className="public-algorithm-card">
              <div className="public-algorithm-icon"><GitBranch size={21} /></div>
              <span className="public-algorithm-index">01 / DISTANCE VECTOR</span>
              <h3>Learn from your neighbours.</h3>
              <p>Routers exchange distance information with their directly connected neighbours and iteratively refine their routing tables using the Bellman-Ford recurrence.</p>
              <Link to="/lab/simulation">Explore Distance Vector <ArrowRight size={15} /></Link>
            </article>
            <article className="public-algorithm-card public-algorithm-card-accent">
              <div className="public-algorithm-icon"><Network size={21} /></div>
              <span className="public-algorithm-index">02 / LINK STATE</span>
              <h3>Build the bigger picture.</h3>
              <p>Routers distribute link-state information, build a topology database and calculate shortest paths using Dijkstra's algorithm.</p>
              <Link to="/lab/simulation">Explore Link State <ArrowRight size={15} /></Link>
            </article>
          </div>
          <p className="public-model-note">RouteLab is an educational simulator inspired by core Distance Vector and Link State concepts. It does not claim to implement complete production RIP or OSPF deployments.</p>
        </section>

        <section className="public-section public-workflow" id="workflow">
          <div className="public-section-heading public-section-heading-tight">
            <div><span className="public-section-kicker">A SIMPLE LEARNING FLOW</span><h2>Build. <span>Run. Understand.</span></h2></div>
            <p>Start with a topology and let the routing process unfold. You control the experiment and can inspect each result.</p>
          </div>
          <div className="public-workflow-steps">
            <article><span>01</span><h3>Build your network</h3><p>Add routers, connect links and assign costs in Network Studio.</p></article>
            <article><span>02</span><h3>Run a routing model</h3><p>Choose an algorithm and follow its updates, advertisements and calculations.</p></article>
            <article><span>03</span><h3>Experiment with routes</h3><p>Trace a packet, change a link and compare the resulting routing decisions.</p></article>
          </div>
        </section>

        <section className="public-final-cta">
          <div><span className="public-section-kicker">READY TO EXPLORE?</span><h2>Make the invisible <span>part of the picture.</span></h2><p>Open the lab and start experimenting with network routing.</p></div>
          <Button size="lg" icon={Network} iconRight={ArrowRight} onClick={() => navigate('/lab/studio')}>Enter RouteLab</Button>
        </section>
      </main>

      <footer className="public-footer">
        <Link to="/" className="public-brand"><Brand /></Link>
        <span>Computer Networks learning laboratory</span>
        <span>Routing, made visible.</span>
      </footer>
    </div>
  );
}
