import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Shield, Trophy, Users, Rocket, Cpu, Calendar, Star } from 'lucide-react';

const MiningServerLanding = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Increasing Mining Power',
      desc: 'Boost hash rate easily with smart upgrades.',
      icon: Zap,
    },
    {
      title: 'Security & Reliability',
      desc: 'Strict security policies and high uptime.',
      icon: Shield,
    },
    {
      title: 'Achievement Board',
      desc: 'Daily challenges and rewards to accelerate your progress.',
      icon: Trophy,
    },
    {
      title: 'Referral System',
      desc: 'Invite friends to get additional benefits.',
      icon: Users,
    },
  ];

  const steps = [
    { title: 'Start Session', desc: 'Begin mining with a single tap.', icon: Rocket },
    { title: 'Upgrade Performance', desc: 'Upgrade power and duration.', icon: Cpu },
    { title: 'Book/Benefit', desc: 'Exchange rewards or book services.', icon: Calendar },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Bolt Mining',
    url: `${window.location.origin}/`,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${window.location.origin}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <div className="min-h-screen text-foreground">
      <Helmet>
        <title>Bolt Mining | Start and Reward Yourself</title>
        <meta name="description" content="Start BOLT mining now using brand primary colors. Upgrade power and duration, achieve goals and get rewards." />
        <link rel="canonical" href={`${window.location.origin}/`} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>


      <main>
        {/* Hero */}
        <section className="relative pt-40 pb-24 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute -top-24 -left-24 w-[480px] h-[480px] rounded-full bg-primary/15 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 w-[520px] h-[520px] rounded-full bg-secondary/15 blur-3xl" />
          </div>

          <div className="container max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-6 animate-fade-in">
                <Badge className="bg-primary/15 text-primary border border-primary/30">New Version</Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-orbitron font-extrabold leading-tight">
                  Start Your Journey in
                  <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Bolt Mining</span>
                </h1>
                <p className="text-muted-foreground text-lg md:text-xl">
                  A completely new interface with the site's primary theme. Control mining, upgrade your abilities, and start earning rewards easily.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className="h-12 px-6 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => navigate('/dashboard')}
                  >
                    Start Now
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 px-6 border-secondary text-secondary hover:bg-secondary/10"
                    onClick={() => navigate('/mining')}
                  >
                    Go to Mining Page
                  </Button>
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-secondary" />
                    <span className="text-sm text-muted-foreground">Smooth Experience</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">Security & Reliability</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <Card className="border-primary/30 bg-card/80 backdrop-blur animate-fade-in">
                  <CardContent className="p-6 md:p-8">
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'Hash Rate', value: '150 TH/s', Icon: Zap },
                        { label: 'Session Duration', value: '48 hours', Icon: Calendar },
                        { label: 'Security', value: 'Advanced', Icon: Shield },
                        { label: 'Achievements', value: '+25 rewards', Icon: Trophy },
                      ].map((item, i) => (
                        <div key={i} className="rounded-lg border border-primary/20 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <item.Icon className="w-4 h-4 text-primary" />
                            <span className="text-xs text-muted-foreground">{item.label}</span>
                          </div>
                          <div className="text-lg font-semibold">{item.value}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 flex gap-3">
                      <Link to="/premium-packages" className="w-full">
                        <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                          Premium Packages
                        </Button>
                      </Link>
                      <Link to="/elite-addons" className="w-full">
                        <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">
                          Elite Add-ons
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16">
          <div className="container max-w-6xl">
            <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-orbitron font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Why Bolt Mining?
              </h2>
              <p className="text-muted-foreground mt-2">Essential features with modern and fast experience</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((f, idx) => (
                <Card key={idx} className="border-border/60 bg-card/70 hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-md bg-primary/15 text-primary grid place-items-center border border-primary/30 mb-4">
                      <f.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold mb-1">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-orbitron font-extrabold">How Does the Platform Work?</h2>
              <p className="text-muted-foreground mt-2">3 simple steps to get started</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {steps.map((s, idx) => (
                <Card key={idx} className="bg-card/80 border-border/60">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-md bg-secondary/15 text-secondary grid place-items-center border border-secondary/30 mb-4">
                      <s.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold mb-1">{s.title}</h3>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-8">
              <Button className="h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => navigate('/mining')}>
                Start Mining Session Now
              </Button>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="container max-w-6xl">
            <Card className="bg-gradient-to-r from-primary/15 via-background to-secondary/15 border border-primary/30">
              <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-2xl md:text-3xl font-orbitron font-extrabold mb-2">Ready to Upgrade?</h3>
                  <p className="text-muted-foreground">Explore the upgrade center and get maximum performance.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <Link to="/upgrade-center" className="w-full md:w-auto">
                    <Button className="w-full md:w-auto bg-secondary text-secondary-foreground hover:bg-secondary/90">Upgrade Center</Button>
                  </Link>
                  <Link to="/server-store" className="w-full md:w-auto">
                    <Button variant="outline" className="w-full md:w-auto border-primary text-primary hover:bg-primary/10">Server Store</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default MiningServerLanding;
