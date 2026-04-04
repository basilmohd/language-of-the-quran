import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  BookOpen,
  Flame,
  Star,
  Trophy,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

const LEVELS = [
  { number: 1, title: 'The Building Blocks', subtitle: 'Ism (Nouns)', description: 'Gender, number, definiteness, and Idhafah constructions.' },
  { number: 2, title: 'The Engine', subtitle: "Fi'l (Verbs)", description: 'Past and present conjugation, suffix/prefix tables, attached pronouns.' },
  { number: 3, title: 'The Connectors', subtitle: 'Harf (Particles)', description: 'Prepositions, negation particles, and emphasis words.' },
  { number: 4, title: 'The Root System', subtitle: 'Sarf', description: 'The 10 verb families (أوزان) and morphological pattern recognition.' },
  { number: 5, title: 'Sentence Anatomy', subtitle: 'Nahw', description: 'Nominal vs verbal sentences, word-order rules, and I\'rab.' },
  { number: 6, title: 'Contextual Reading', subtitle: 'Full Passages', description: 'Complete passage comprehension and the rhetorical beauty of the Quran.' },
];

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Grammar-first approach',
    description: 'Learn the system, not just the vocabulary. Based on the Bayyinah Dream curriculum and Madinah Book.',
  },
  {
    icon: Star,
    title: '350 high-frequency words',
    description: 'The words that appear most in the Quran — mastering them unlocks 80–85% reading comprehension.',
  },
  {
    icon: Flame,
    title: 'Daily streaks & XP',
    description: 'Stay motivated with streaks, experience points, and badges — built for consistent daily practice.',
  },
  {
    icon: Trophy,
    title: 'No hearts. No failure.',
    description: 'Wrong answer? See the explanation and try again. Learning, not testing. Unlimited attempts always.',
  },
];

export function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-semibold text-slate-800 text-lg">
            The Language of the Quran
          </span>
          <Button disabled className="cursor-not-allowed opacity-60">
            Sign in
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <Badge variant="secondary" className="mb-6 text-sm font-medium bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-50">
          Free to start · 6 levels · 350 words
        </Badge>

        <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 leading-tight mb-6">
          Understand the Quran,
          <br />
          <span className="text-teal-600">word by word.</span>
        </h1>

        <p className="text-lg text-slate-500 max-w-xl mx-auto mb-8 leading-relaxed">
          You can recite it. Now learn what it means. A grammar-first,
          gamified course built for English-speaking Muslims who want to
          understand Classical Arabic — not just memorise it.
        </p>

        {/* Arabic verse showcase */}
        <div className="inline-block bg-stone-50 border border-slate-200 rounded-xl px-8 py-5 mb-10">
          <p
            dir="rtl"
            lang="ar"
            className="text-3xl text-slate-800 leading-loose mb-2"
            style={{ fontFamily: 'Noto Naskh Arabic, serif' }}
          >
            ٱقْرَأْ بِٱسْمِ رَبِّكَ ٱلَّذِى خَلَقَ
          </p>
          <p className="text-sm text-slate-400 mt-1">
            "Read in the name of your Lord who created" — Al-Alaq 96:1
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Button
            size="lg"
            disabled
            className="bg-teal-600 hover:bg-teal-700 text-white px-8 cursor-not-allowed opacity-60"
          >
            Start Learning Free
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
          <p className="text-xs text-slate-400">
            Sign-in coming soon
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="bg-stone-50 border-y border-slate-200 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-10">
            Built differently
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="border-slate-200 bg-white shadow-none">
                <CardContent className="pt-6 pb-5">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-teal-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2 text-sm">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            A complete curriculum in 6 levels
          </h2>
          <p className="text-slate-500 text-sm">
            Structured from the ground up — each level builds on the last.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LEVELS.map((level) => (
            <div
              key={level.number}
              className="flex gap-4 p-4 rounded-xl border border-slate-200 bg-white"
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-teal-600 text-white text-sm font-bold flex items-center justify-center">
                {level.number}
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{level.title}</p>
                <p className="text-xs text-teal-600 font-medium mb-1">{level.subtitle}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{level.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-teal-600 py-14">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Ready to understand the Quran?
          </h2>
          <p className="text-teal-100 mb-6 text-sm">
            Free to start. No credit card required.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-teal-100 text-xs mb-8">
            {['Grammar-first', 'No hearts/lives', 'Earn XP & badges', '350 core words'].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {item}
              </span>
            ))}
          </div>
          <Button
            size="lg"
            variant="secondary"
            disabled
            className="bg-white text-teal-700 hover:bg-teal-50 px-8 font-semibold cursor-not-allowed opacity-75"
          >
            Get Started Free
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
          <p className="text-teal-200 text-xs mt-3">Sign-in coming soon</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span className="text-sm font-medium text-slate-700">
            The Language of the Quran
          </span>
          <span className="text-xs text-slate-400">
            Built for those who recite — and want to understand.
          </span>
        </div>
      </footer>
    </div>
  );
}

export default Home;
