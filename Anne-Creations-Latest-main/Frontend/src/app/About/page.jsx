import React from 'react'
import BreadCrum from '@/components/BreadCrum/BreadCrum'
import { Container, Box, Typography, Paper, Grid } from '@mui/material'
import Image from 'next/image'

// ✅ SEO Metadata for Next.js App Router
export const metadata = {
  title: 'About Us | Anne Creations HB',
  description:
    'Learn more about Anne Creations HB — a creative hub specializing in computer embroidery designs that bring elegance and innovation to fashion.',
  keywords: [
    'Anne Creations HB',
    'Embroidery Designs',
    'Computer Embroidery',
    'Fashion Embroidery',
    'Embroidery Boutique',
    'Machine Embroidery',
  ],
  openGraph: {
    title: 'About Us | Anne Creations HB',
    description:
      'Anne Creations HB offers premium computer embroidery designs that inspire creativity and support fashion businesses.',
    url: 'https://www.annecreationshb.com/About',
    siteName: 'Anne Creations HB',
    locale: 'en_IN',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.annecreationshb.com/About',
  },
}

const AboutPage = () => {
  return (
    <>
      <BreadCrum
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'About', href: '/About' },
        ]}
      />

      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #FFEFD5 0%, #FFFFFF 50%, #FFE4B5 100%)',
          minHeight: '100vh',
          '@keyframes slowRotate': {
            from: { transform: 'rotate(0deg)' },
            to: { transform: 'rotate(360deg)' }
          }
        }}
      >
        {/* Dynamic Colorful Background Accents */}
        <Box sx={{ position: 'absolute', top: '-10%', left: '10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(255,183,41,0.3) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(60px)', zIndex: 0 }} />
        <Box sx={{ position: 'absolute', bottom: '5%', right: '5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(233,177,96,0.3) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(60px)', zIndex: 0 }} />
        <Box sx={{ position: 'absolute', top: '40', right: '30%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(49,24,7,0.1) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(40px)', zIndex: 0 }} />

        {/* Decorative Mandalas - Multiple instances with Multiply blend to remove white space */}
        <Box sx={{ position: 'absolute', top: -100, left: -100, opacity: 0.6, pointerEvents: 'none', mixBlendMode: 'multiply', filter: 'saturate(1.8) contrast(1.1)', animation: 'slowRotate 60s linear infinite' }}>
          <Image src="/assets/decor/01.png" alt="decor" width={450} height={450} priority />
        </Box>
        <Box sx={{ position: 'absolute', top: '10%', right: -150, opacity: 0.5, pointerEvents: 'none', mixBlendMode: 'multiply', filter: 'saturate(1.5)', animation: 'slowRotate 80s linear infinite reverse' }}>
          <Image src="/assets/decor/02.png" alt="decor" width={550} height={550} />
        </Box>
        <Box sx={{ position: 'absolute', bottom: '20%', left: -150, opacity: 0.45, pointerEvents: 'none', mixBlendMode: 'multiply', filter: 'saturate(1.4)', animation: 'slowRotate 100s linear infinite' }}>
          <Image src="/assets/decor/03.png" alt="decor" width={500} height={500} />
        </Box>
        <Box sx={{ position: 'absolute', bottom: -50, right: -50, opacity: 0.65, pointerEvents: 'none', mixBlendMode: 'multiply', filter: 'saturate(2) brightness(1.1)', animation: 'slowRotate 70s linear infinite reverse' }}>
          <Image src="/assets/decor/04.png" alt="decor" width={400} height={400} />
        </Box>

        {/* Repeating patterns to fill space and add color */}
        <Box sx={{ position: 'absolute', top: '40%', left: '80%', opacity: 0.35, transform: 'scale(0.8) rotate(30deg)', pointerEvents: 'none', mixBlendMode: 'multiply', filter: 'saturate(1.5)' }}>
          <Image src="/assets/decor/01.png" alt="decor" width={300} height={300} />
        </Box>
        <Box sx={{ position: 'absolute', top: '70%', left: '5%', opacity: 0.3, transform: 'scale(0.7) rotate(-45deg)', pointerEvents: 'none', mixBlendMode: 'multiply', filter: 'saturate(1.6)' }}>
          <Image src="/assets/decor/04.png" alt="decor" width={300} height={300} />
        </Box>
        <Box sx={{ position: 'absolute', top: '5%', left: '40%', opacity: 0.2, transform: 'scale(0.5) rotate(90deg)', pointerEvents: 'none', mixBlendMode: 'multiply' }}>
          <Image src="/assets/decor/03.png" alt="decor" width={200} height={200} />
        </Box>
        <Box sx={{ position: 'absolute', top: '25%', left: '15%', opacity: 0.3, transform: 'scale(0.6) rotate(-30deg)', pointerEvents: 'none', mixBlendMode: 'multiply' }}>
          <Image src="/assets/decor/04.png" alt="decor" width={250} height={250} />
        </Box>
        <Box sx={{ position: 'absolute', top: '60%', right: '10%', opacity: 0.25, transform: 'scale(0.7) rotate(60deg)', pointerEvents: 'none', mixBlendMode: 'multiply' }}>
          <Image src="/assets/decor/02.png" alt="decor" width={300} height={300} />
        </Box>
        <Box sx={{ position: 'absolute', top: '80%', left: '40%', opacity: 0.2, transform: 'scale(0.4) rotate(120deg)', pointerEvents: 'none', mixBlendMode: 'multiply' }}>
          <Image src="/assets/decor/01.png" alt="decor" width={250} height={250} />
        </Box>
        <Box sx={{ position: 'absolute', top: '15%', left: '60%', opacity: 0.15, transform: 'scale(0.5) rotate(-15deg)', pointerEvents: 'none', mixBlendMode: 'multiply' }}>
          <Image src="/assets/decor/03.png" alt="decor" width={200} height={200} />
        </Box>
        <Box sx={{ position: 'absolute', top: '35%', left: '0%', opacity: 0.2, transform: 'scale(0.8) rotate(75deg)', pointerEvents: 'none', mixBlendMode: 'multiply' }}>
          <Image src="/assets/decor/02.png" alt="decor" width={350} height={350} />
        </Box>
        <Box sx={{ position: 'absolute', top: '50%', left: '20%', opacity: 0.15, transform: 'scale(0.6) rotate(-20deg)', pointerEvents: 'none', mixBlendMode: 'multiply', filter: 'blur(1px)' }}>
          <Image src="/assets/decor/01.png" alt="decor" width={200} height={200} />
        </Box>
        <Box sx={{ position: 'absolute', bottom: '15%', right: '40%', opacity: 0.2, transform: 'scale(0.5) rotate(10deg)', pointerEvents: 'none', mixBlendMode: 'multiply' }}>
          <Image src="/assets/decor/04.png" alt="decor" width={250} height={250} />
        </Box>

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 10 }}>
          {/* Header Section */}
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                color: 'var(--secondary)',
                mb: 2,
                fontSize: { xs: '2.5rem', md: '4rem' },
                fontFamily: 'Poppins, sans-serif',
                background: 'linear-gradient(45deg, var(--secondary), var(--primary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              About Anne Creations
            </Typography>
            <Box sx={{ width: 80, height: 4, bgcolor: 'var(--primary)', mx: 'auto', borderRadius: 2 }} />
          </Box>

          {/* Main Content Card */}
          <Paper elevation={0} sx={{ p: { xs: 4, md: 8 }, borderRadius: 6, bgcolor: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(233,177,96,0.2)', mb: 6 }}>
            <Typography variant="body1" sx={{ fontSize: '1.2rem', lineHeight: 1.8, color: '#555', textAlign: 'center', maxWidth: '900px', mx: 'auto' }}>
              <Box component="span" sx={{ color: 'var(--secondary)', fontWeight: 700, fontSize: '1.4rem' }}>Anne Creations HB</Box> specializes in state-of-the-art computer embroidery designs that blend tradition with digital innovation. We provide a curated creative hub where elegance meets efficiency, offering high-quality, production-ready designs that empower boutiques, fashion houses, and individual creators to bring their visions to life with precision and style.
            </Typography>
          </Paper>

          {/* Mission & Vision Grid */}
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 5,
                  height: '100%',
                  borderRadius: 5,
                  bgcolor: '#fff',
                  border: '1px solid #eee',
                  transition: 'transform 0.3s ease',
                  '&:hover': { transform: 'translateY(-10px)', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ width: 50, height: 50, borderRadius: '50%', bgcolor: 'rgba(233,177,96,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2 }}>
                    <Typography sx={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.5rem' }}>M</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'var(--secondary)' }}>Our Mission</Typography>
                </Box>
                <Typography variant="body1" sx={{ color: '#666', fontSize: '1.1rem', lineHeight: 1.6 }}>
                  Our mission is to democratize high-end embroidery by providing affordable, accessible, and masterfully crafted digital designs. We strive to simplify the creative process, ensuring every fashion project—large or small—can be enhanced with the touch of professional elegance.
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 5,
                  height: '100%',
                  borderRadius: 5,
                  bgcolor: '#fff',
                  border: '1px solid #eee',
                  transition: 'transform 0.3s ease',
                  '&:hover': { transform: 'translateY(-10px)', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ width: 50, height: 50, borderRadius: '50%', bgcolor: 'rgba(49,24,7,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2 }}>
                    <Typography sx={{ color: 'var(--secondary)', fontWeight: 800, fontSize: '1.5rem' }}>V</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'var(--secondary)' }}>Our Vision</Typography>
                </Box>
                <Typography variant="body1" sx={{ color: '#666', fontSize: '1.1rem', lineHeight: 1.6 }}>
                  To set the global standard for computer embroidery design excellence. We envision a future where Anne Creations HB is the heartbeat of the fashion industry's creative journey, supporting a community of thriving boutiques and fashion businesses across India and beyond.
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Closing Segment */}
          <Box sx={{ mt: 10, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ fontStyle: 'italic', color: 'var(--primary)', fontWeight: 500 }}>
              "Designing Dreams, One Stitch at a Time."
            </Typography>
          </Box>
        </Container>
      </Box>
    </>
  )
}

export default AboutPage
