'use client'
import React, { useState } from 'react'
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Drawer,
} from '@mui/material'
import { FaBars } from 'react-icons/fa'
import Logo from './Logo'
import LanguageSelector from './LanguageSelector'
import ProfileMenu from './ProfileMenu'

import Link from 'next/link'
import { usePathname } from 'next/navigation';

const Header_links = () => {
  const [profileAnchorEl, setProfileAnchorEl] = useState(null)
  const pathname = usePathname();

  const handleProfileClick = (event) => {
    setProfileAnchorEl(event.currentTarget)
  }

  const handleProfileClose = () => {
    setProfileAnchorEl(null)
  }

  const isActive = (path) => pathname === path;
  const linkClass = (path) => `font-semibold no-underline text-base transition-all pb-1 ${isActive(path)
    ? 'text-[var(--secondary)] border-b-2 border-[var(--secondary)]'
    : 'text-[var(--secondary)] hover:opacity-75'
    }`;

  return (
    <AppBar
      position="static"
      sx={{ bgcolor: 'var(--card-bg)', color: 'var(--text)', boxShadow: 'none' }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: '0 !important', minHeight: '64px' }}>
        {/* Left: Logo + Name + Nav Links */}
        <Box display="flex" alignItems="center" gap={3}>
          {/* Branding */}
          <Link href="/" className="flex items-center gap-2 no-underline">
            <Logo />
            <Box>
              <span className="block text-2xl font-bold text-[var(--secondary)] leading-none">
                Anne Creations
              </span>
              <span className="hidden md:block text-xs text-[var(--secondary)] font-semibold tracking-wider uppercase mt-1">
                Embroidery Designs
              </span>
            </Box>
          </Link>

          {/* Nav Links - Desktop */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3, ml: 4 }}>
            <Link href="/" className={linkClass('/')}>
              Home
            </Link>
            <Link href="/About" className={linkClass('/About')}>
              About Us
            </Link>
            <Link href="/Contactus" className={linkClass('/Contactus')}>
              Contact Us
            </Link>
            <Link href="/Help" className={linkClass('/Help')}>
              Help
            </Link>
          </Box>
        </Box>

        {/* Right: Language + Profile */}
        <Box display="flex" alignItems="center">
          <LanguageSelector />
          <ProfileMenu
            anchorEl={profileAnchorEl}
            handleClick={handleProfileClick}
            handleClose={handleProfileClose}
          />
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header_links
