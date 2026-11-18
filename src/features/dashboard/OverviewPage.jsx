import { ArrowRight, ArrowUpRight, BookOpen, Boxes, CircleDot, GitBranch, Layers3, Network, Route, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Badge from '../../components/ui/Badge.jsx';
import { Card, CardHeading } from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import NetworkIllustration from './NetworkIllustration.jsx';

const algorithms = [
  {
    label: '01 / DISTANCE VECTOR',
    title: 'Learn through neighbours.',
    description: 'Follow how routers share distance information with adjacent routers and refine their tables over successive rounds.',
    icon: GitBranch,
    status: 'Interactive in Simulation Studio',
  },
  {
    label: '02 / LINK STATE',
    title: 'See the whole picture.',
    description: 'Explore link-state information, a shared topology database and shortest-path calculations using Dijkstra.',
    icon: Network,
    status: 'Interactive in Simulation Studio',
  },
];

const steps = [
  { n: '01', title: 'Build a topology', text: 'Place routers and connect them with links that have configurable costs.', icon: Boxes },
  { n: '02', title: 'Choose a model', text: 'Select Distance Vector or Link State and inspect the process step by step.', icon: GitBranch },
  { n: '03', title: 'Experiment', text: 'Change the network and understand how routing decisions respond.', icon: Sparkles },
];

export default function OverviewPage() {
  const navigate = useNavigate();

  return (
    <div className="page page-overview">
      <section className="overview-hero">
        <div className="overview-hero-copy">
          <div className="eyebrow"><span className="eyebrow-mark" /> ROUTELAB / LEARNING LABORATORY</div>
          <Badge tone="success" dot>Phase 7 · release hardening</Badge>
          <h1>Understand the route.<br /><span>Not just the result.</span></h1>
          <p className="overview-lede">A visual learning space for exploring how networks make routing decisions. Build a topology, follow the logic, and see the path come together.</p>
          <div className="overview-hero-actions">
            <Button icon={Network} iconRight={ArrowRight} onClick={() => navigate('/studio')}>Open Network Studio</Button>
            <a className="text-link" href="#routing-models">Explore routing models <ArrowUpRight size={15} /></a>
          </div>
          <div className="overview-facts" aria-label="Project scope">
            <div><strong>02</strong><span>routing models</span></div>
            <span className="fact-divider" />
            <div><strong>01</strong><span>shared network model</span></div>
            <span className="fact-divider" />
            <div><strong>∞</strong><span>ways to experiment</span></div>
          </div>
        </div>
        <div className="overview-visual-card">
          <div className="visual-card-head"><span>NETWORK TOPOLOGY / CONCEPT</span><Badge tone="subtle">Preview only</Badge></div>
          <NetworkIllustration />
          <div className="visual-card-foot"><span><span className="legend-node" /> Router node</span><span><span className="legend-link" /> Weighted link</span><span className="visual-foot-note">Open Network Studio to edit</span></div>
        </div>
      </section>

      <section className="scope-strip" aria-label="Current project status">
        <div className="scope-status"><span className="scope-status-icon"><CircleDot size={17} /></span><div><strong>Topology editor available</strong><span>Build and save custom network layouts</span></div></div>
        <div className="scope-next"><span>NEXT MILESTONE</span><strong>Testing & polish</strong><Badge tone="info">Phase 7</Badge></div>
        <Link to="/simulation" className="scope-arrow" aria-label="Open Simulation Studio"><ArrowRight size={18} /></Link>
      </section>

      <section className="content-section" id="routing-models">
        <div className="section-intro">
          <div><div className="eyebrow muted">THE TWO ROUTING APPROACHES</div><h2>Two ways to find a path.</h2></div>
          <p>RouteLab focuses on the two core routing approaches in our Computer Networks project. Both algorithms run against the same saved network model. Follow their event streams, routing-table changes and shortest-path decisions in the Simulation Studio.</p>
        </div>
        <div className="algorithm-grid">
          {algorithms.map((item) => {
            const Icon = item.icon;
            return (
              <Card className="algorithm-card" key={item.label}>
                <div className="algorithm-card-top"><span className="algorithm-label">{item.label}</span><span className="algorithm-icon"><Icon size={19} strokeWidth={1.7} /></span></div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <div className="algorithm-card-bottom"><span>{item.status}</span><ArrowUpRight size={15} /></div>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="content-section how-section">
        <div className="section-intro section-intro-tight">
          <div><div className="eyebrow muted">THE LEARNING FLOW</div><h2>From topology to understanding.</h2></div>
          <span className="section-note">A guided, inspectable workflow.</span>
        </div>
        <div className="steps-grid">
          {steps.map((step) => {
            const Icon = step.icon;
            return <article className="step-card" key={step.n}><div className="step-card-top"><span>{step.n}</span><Icon size={19} strokeWidth={1.7} /></div><h3>{step.title}</h3><p>{step.text}</p></article>;
          })}
        </div>
      </section>

      <section className="content-section scenarios-section">
        <div className="section-intro section-intro-tight">
          <div><div className="eyebrow muted">QUICK-START SCENARIOS</div><h2>Small experiments. Clear ideas.</h2></div>
          <span className="section-note">Packet journeys and before/after link experiments are now interactive.</span>
        </div>
        <div className="scenario-grid">
          <article className="scenario-card">
            <div className="scenario-card-top"><span className="scenario-number">SCENARIO 01</span><Badge tone="success">Available</Badge></div>
            <div className="scenario-icon"><Route size={18} /></div>
            <h3>Find the lowest-cost route</h3>
            <p>Compare a direct connection with a multi-hop path and understand how link costs affect the choice.</p>
          </article>
          <article className="scenario-card">
            <div className="scenario-card-top"><span className="scenario-number">SCENARIO 02</span><Badge tone="success">Available</Badge></div>
            <div className="scenario-icon"><GitBranch size={18} /></div>
            <h3>Respond to a broken link</h3>
            <p>Take a connection offline and inspect how the available route changes across the network.</p>
          </article>
          <article className="scenario-card">
            <div className="scenario-card-top"><span className="scenario-number">SCENARIO 03</span><Badge tone="success">Available</Badge></div>
            <div className="scenario-icon"><Network size={18} /></div>
            <h3>Compare two routing models</h3>
            <p>Use one shared topology to compare how Distance Vector and Link State reach their routing decisions.</p>
          </article>
        </div>
      </section>

      <section className="bottom-grid">
        <Card className="recent-card">
          <CardHeading eyebrow="YOUR WORKSPACE" title="Recent projects" action={<div className="recent-actions"><Button size="sm" variant="secondary" disabled title="Create a project in Network Studio">New project</Button><Button size="sm" variant="ghost" disabled title="Load a sample topology in Network Studio">Load sample</Button></div>} />
          <div className="recent-empty"><div className="recent-empty-icon"><Layers3 size={20} /></div><div><strong>No projects yet</strong><p>Create and save a topology in Network Studio. Your local project library is managed there.</p></div></div>
        </Card>
        <Card className="next-card">
          <div className="next-card-icon"><BookOpen size={18} /></div>
          <div className="eyebrow muted">UP NEXT · PHASE 7</div>
          <h3>Polish and validate RouteLab.</h3>
          <p>The topology builder, routing engines, simulation, packet explorer, failure lab and comparison workspace are implemented. Next, we will run full manual QA, refine responsive behaviour, harden edge cases and prepare the application for deployment.</p>
          <Link to="/compare" className="next-card-link">Open comparison workspace <ArrowRight size={15} /></Link>
        </Card>
      </section>
    </div>
  );
}
