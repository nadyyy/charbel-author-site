/**
 * Design: Minimalist Luxury
 * - Clean layout with generous whitespace
 * - Serif typography for the author's name and section titles
 * - Gold accents for emphasis
 * - Contemplative, literary tone
 */

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      {/* Page Title */}
      <section className="pt-8 pb-8 md:pt-10 md:pb-10">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <h1 className="serif-title text-4xl md:text-5xl text-black">About the Author</h1>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-16 md:pb-24">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          {/* Biography */}
          <div className="mb-16 md:mb-24">
            <div className="gold-divider mb-8"></div>
            <h2 className="serif-title text-4xl md:text-5xl text-black mb-8">
              Charbel Abdallah
            </h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12 items-start">
  {/* Image */}
  <div className="md:col-span-1 flex justify-center md:justify-start">
    <img
      src="/bg/signing.png"
      alt="Charbel Abdallah at book signing"
      className="w-full max-w-[260px] md:max-w-none rounded-sm
        grayscale
        opacity-90
        shadow-[0_18px_36px_rgba(0,0,0,0.18)]"
    />
  </div>

  {/* First paragraph */}
  <div className="md:col-span-2 pt-0 md:pt-0 space-y-5">
  <p className="sans-body text-gray-700 text-lg leading-relaxed">
    Charbel Abdallah is a medical student and writer whose work lives at the intersection of precision and vulnerability. Trained in science and drawn to language, he writes as someone who has learned to observe closely—bodies, silences, losses, and the things people rarely say aloud.
  </p>

  <p className="sans-body text-gray-700 text-lg leading-relaxed">
    His poetry explores grief, identity, devotion, and endurance, often moving between restraint and intensity. Rather than offering answers, his writing lingers in questions, in the spaces left behind by love and absence.
  </p>

  <p className="sans-body text-gray-700 text-lg leading-relaxed">
    Charbel writes not to explain the world, but to stay with it.
  </p>
</div>

</div>


<div className="space-y-6 sans-body text-gray-700 text-lg leading-relaxed">

              <p>
                His literary journey began with a sense of raw honesty and survival. Anchored by the semicolon symboll—a mark of continuation and pause—<span className="text-[#d4af37] font-semibold"> Carrefour</span> navigates darkness and storytelling with unflinching vulnerability. It is a visual and emotional journey that speaks to those who have felt lost and found themselves again.
              </p>
              <p>
                His second collection, <span className="text-[#d4af37] font-semibold">Soldier Poet King</span>, shifts toward a deep exploration of identity and impermanence. This work confronts what fades and what endures, presenting a poetic meditation on power, loss, and the human condition.
              </p>
              <p>
                With his upcoming third collection, <span className="text-[#d4af37] font-semibold">Encore</span>, Charbel continues to push the boundaries of contemporary poetry, exploring themes of memory, longing, and artistic legacy.
              </p>
              <p>
                Beyond the page, Charbel's work resonates with readers who seek meaning in the spaces between words. His writing is a balm for the fractured soul—a reminder that poetry, in its essence, is the art of making the invisible visible.
              </p>
            </div>
            <div className="gold-divider mt-8"></div>
          </div>

          {/* Philosophy */}
          <div className="mb-16 md:mb-24">
            <h3 className="serif-title text-3xl md:text-4xl text-black mb-8">
              Philosophy
            </h3>
            <div className="space-y-6 sans-body text-gray-700 text-lg leading-relaxed">
              <p>
                Charbel believes that poetry is not merely an art form—it is a way of witnessing the world. His work challenges readers to confront their own truths, to sit with discomfort, and to find beauty in the broken places.
              </p>
              <p>
                Each collection is a deliberate act of creation, where every word is chosen with intention. The minimalist aesthetic of his work reflects a deeper philosophy: that sometimes, less is more, and silence speaks louder than noise.
              </p>
            </div>
          </div>

          {/* Key Themes */}
          <div>
            <h3 className="serif-title text-3xl md:text-4xl text-black mb-8">
              Key Themes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "Identity & Impermanence",
                  description: "Exploring what makes us who we are and how we change over time.",
                },
                {
                  title: "Resilience & Survival",
                  description: "The human capacity to endure, adapt, and find meaning in struggle.",
                },
                {
                  title: "Introspection & Emotion",
                  description: "Deep dives into the inner landscape of human experience.",
                },
                {
                  title: "Memory & Legacy",
                  description: "How we remember, what we leave behind, and what endures.",
                },
              ].map((theme, index) => (
                <div key={index} className="border-l-2 border-[#d4af37] pl-6">
                  <h4 className="serif-title text-xl text-black mb-3">
                    {theme.title}
                  </h4>
                  <p className="sans-body text-gray-600 leading-relaxed">
                    {theme.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="bg-gray-50 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <div className="gold-divider mb-8"></div>
          <blockquote className="serif-title text-3xl md:text-4xl text-black italic mb-6">
            "Poetry that speaks, stories that remain."
          </blockquote>
          <p className="sans-body text-gray-600 text-lg">
            — The guiding principle of Charbel Abdallah's work
          </p>
          <div className="gold-divider mt-8"></div>
        </div>
      </section>
    </div>
  );
}
