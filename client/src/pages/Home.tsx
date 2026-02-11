import { Link } from "wouter";
import { Button } from "@/components/ui/button";

//import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Design: Minimalist Luxury
 * - Hero section with black background and gold accents
 * - Large serif typography for poetic impact
 * - Ample whitespace and breathing room
 * - Featured book image with subtle depth
 */


export default function Home() {
  
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  //let { user, loading, error, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
     <section className="relative bg-black text-white overflow-hidden min-h-screen">
        <div
        
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url('https://private-us-east-1.manuscdn.com/sessionFile/5WxZdV4zNmF3bedF3xFCRC/sandbox/IYlzEXRHrmilflWhNMdt9w-img-4_1770681376000_na1fn_aG9tZS1mZWF0aGVyLXdyaXRpbmc.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvNVd4WmRWNHpObUYzYmVkRjN4RkNSQy9zYW5kYm94L0lZbHpFWFJIcm1pbGZsV2hOTWR0OXctaW1nLTRfMTc3MDY4MTM3NjAwMF9uYTFmbl9hRzl0WlMxbVpXRjBhR1Z5TFhkeWFYUnBibWMucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=DcllF9AY91V40oOda1YfOfgOjBQcCHpfxu6P07nTZS2CFXPzQ7ROFBwI8VkIFtQpo4tiHKFCDYAnxSmi9gdWJHra5AH9~3eRQH4~tr86kuwrpxMmy-YikWVxbnPgYChvEGjLtKpg6xYZWeAlGgevCznGbCP-OpfhEMGf~XyQPNNrX8-vQm-mNoPvd5KncTM8Igf8WdSOthEWClU40Mv8vkDJVQ7GZjrIAc9ThNEDKcp283J-NhaEPW~fRq7gVxMxGcnYydpJ0gczL2T7UcPh6D07Yq6ZwvTAnq39Lbi98cEPuHiFUAjMTTLipLmlhmRjalk4JpxITs~9aEbd0PwHig__')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        ></div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="space-y-6">
              <h1 className="serif-title text-5xl md:text-6xl leading-tight">
                Charbel
                <br />
                <span className="text-[#d4af37]">Abdallah</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 font-light italic">
                "Poetry that speaks, stories that remain."
              </p>
              <p className="sans-body text-gray-300 leading-relaxed max-w-md">
                Welcome to the literary world of Charbel Abdallah, where words weave introspection, emotion, and resilience. Explore collections that resonate across silence and noise alike.
              </p>
              <div className="flex gap-4 pt-4">
                <Link href="/books" className="inline-block">
                  <Button
                    className="bg-[#d4af37] text-black hover:bg-white transition-colors font-medium px-8 py-3"
                  >
                    Explore Books
                  </Button>
                </Link>
                <Link href="/contact" className="inline-block">
                  <Button
                    variant="outline"
                    className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black transition-colors font-medium px-8 py-3"
                  >
                    Get in Touch
                  </Button>
                </Link>
              </div>
            </div>

         {/* Featured Book Image */}
<div className="flex justify-center md:justify-end items-start pt-24 md:pt-5">

  <div className="relative w-full max-w-[280px] md:max-w-[340px] -mt-0 md:-mt-0">
    {/* book thickness / spine illusion */}
    <div className="absolute inset-y-0 -right-2 w-2 bg-[#d4af37]/40 rounded-r-sm" />

    {/* subtle shadow plane (not a block) */}
    <div className="absolute inset-0 rounded-sm shadow-[0_50px_100px_rgba(0,0,0,0.75)]" />

    {/* ambient glow */}
    <div
      className="absolute -inset-16"
      style={{
        background:
          "radial-gradient(circle at 60% 40%, rgba(212,175,55,0.22), transparent 70%)",
      }}
    />

    <img
      src="/books/encore.png"
      alt="Encore — upcoming poetry collection"
      className="relative z-10 w-full h-auto rounded-sm bg-black"
    />

    {/* anticipation label */}
    <div className="absolute -top-10 left-1/2 -translate-x-1/2">

      <span className="text-[12px] uppercase tracking-[0.37em] font-bold text-[#d4af37]">
  Coming Soon
</span>

    </div>
  </div>
</div>


          </div>
        </div>
      </section>

      {/* Featured Quote Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <div className="gold-divider mb-8"></div>
          <blockquote className="serif-title text-3xl md:text-4xl text-black mb-6 italic">
            "Tell me why all people fade and only I remain…"
          </blockquote>
          <p className="sans-body text-gray-600 text-lg">
            — From <span className="text-[#d4af37] font-semibold">Soldier Poet King</span>
          </p>
          <div className="gold-divider mt-8"></div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <h2 className="serif-title text-4xl md:text-5xl text-black mb-6">
            Discover His Works
          </h2>
          <p className="sans-body text-gray-700 text-lg mb-8 max-w-2xl mx-auto">
            Three collections of poetry and prose that explore the depths of human experience, from resilience to introspection.
          </p>
          <Link href="/books">
            <Button className="bg-black text-white hover:bg-[#d4af37] hover:text-black transition-colors font-medium px-8 py-3">
              View All Books
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
