'use client';
import React from 'react';
import { IoLogoGooglePlaystore } from "react-icons/io5";
import { FaApple, FaWhatsapp, FaFacebook, FaInstagram, FaPinterest, FaYoutube } from "react-icons/fa";
import { MdOutlineEmail } from "react-icons/md";
import { Container } from '@mui/material';
import { whatsappUrl } from '@/app/page';

import Link from 'next/link';

const Footer = () => {
  const list = [
    { id: 1, name: 'Home', link: '/' },
    { id: 2, name: 'About', link: '/About' },
    { id: 3, name: 'Categories', link: '/Category' },
    { id: 4, name: 'Contact Us', link: '/Contactus' },
  ];

  const supportLinks = [
    { id: 6, name: 'Help', link: "/Help" },
    { id: 7, name: 'Terms & Conditions', link: "/terms_conditions" },
    { id: 8, name: "Privacy Policy", link: "/privacypolicy" },
    { id: 9, name: "Delivery Information", link: "/DeliveryInfo" },
    { id: 10, name: "Returns and Cancellations", link: "/return" },
  ];

  const socialIcons = [
    { href: "https://www.facebook.com/AnneCreations.HB", color: 'var(--secondary)', icon: <FaFacebook size={22} /> },
    { href: "https://www.instagram.com/annecreations.hb", color: 'var(--secondary)', icon: <FaInstagram size={22} /> },
    { href: "https://in.pinterest.com/Annecreationshb9/", color: 'var(--secondary)', icon: <FaPinterest size={22} /> },
    { href: "https://www.youtube.com/@annecreationHB/", color: 'var(--secondary)', icon: <FaYoutube size={22} /> },
    { href: "https://www.whatsapp.com/channel/0029VaE0dx99Bb60W0dWpv2o", color: 'var(--secondary)', icon: <FaWhatsapp size={22} /> },
  ];

  return (
    <footer className="w-full overflow-hidden mt-20 font-[600] text-[var(--secondary)]">
      {/* Top Section */}
      <div className="bg-[var(--primary)] py-10 px-4">
        <Container>
          <div className="flex w-full flex-col lg:flex-row flex-wrap justify-between text-[var(--secondary)]">

            {/* Column 1: Logo & Description */}
            <div className="w-full lg:w-[30%] space-y-4">
              <img src="/assets/logo.svg" alt="Anne Creations Logo" className="w-[150px] h-auto max-w-full" />
              <p className="text-sm">
                Anne Creations HB is a leading company in South India for embroidery design support
                for single-needle and multi-needle machines.
              </p>

              {/* App Store Buttons with Hover Popover */}
              <div className="flex flex-wrap gap-4">
                <div className="relative group">
                  <a
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] rounded-lg"
                  >
                    <FaApple size={30} color="var(--secondary)" />
                    <div className="text-sm">
                      <p className="text-[12px]">Download on the</p>
                      <p className="text-[18px] font-bold">App Store</p>
                    </div>
                  </a>
                  {/* Popover */}
                  <div className="pointer-events-none absolute top-full left-0 mt-2 w-max px-3 py-2 bg-black text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                    Available soon
                  </div>
                </div>

                <div className="relative group">
                  <a
                    href="https://play.google.com/store/apps/details?id=com.embroidery.annecreations&hl=en-US"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] rounded-lg"
                  >
                    <IoLogoGooglePlaystore size={30} color="var(--secondary)" />
                    <div className="text-sm">
                      <p className="text-[12px]">Get it on</p>
                      <p className="text-[18px] font-bold">Play Store</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="w-full sm:w-1/2 lg:w-[15%]">
              <h3 className="font-bold text-lg my-4">Quick Links</h3>
              <ul className="space-y-2">
                {list.map((item) => (
                  <li key={item.id}>
                    <Link href={item.link} className="hover:underline text-md">{item.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Support */}
            <div className="w-full sm:w-1/2 lg:w-[20%]">
              <h3 className="font-bold text-lg my-4">Support</h3>
              <ul className="space-y-2">
                {supportLinks.map((item) => (
                  <li key={item.id}>
                    <Link href={item.link} className="hover:underline text-md">{item.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Contact Us */}
            <div className="w-full lg:w-[20%]">
              <h3 className="font-bold text-lg my-4">Contact Us</h3>
              <ul className="space-y-2 text-md">
                <li className="flex items-center gap-2 hover:opacity-75 transition">
                  <FaWhatsapp size={22} color="var(--secondary)" />
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    +91 995191 6767
                  </a>
                </li>

                <li className="flex items-center gap-2 hover:opacity-75 transition">
                  <a
                    href="mailto:support@annecreationshb.com"
                    className="hover:underline flex items-center"
                  >
                    <MdOutlineEmail size={22} color="var(--secondary)" className='mr-3' /> support@annecreationshb.com
                  </a>
                </li>

                <li className="pt-4 font-semibold">Follow Us</li>
                <li className="flex gap-3">
                  {socialIcons.map((item, index) => (
                    <a
                      key={index}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:opacity-75 transition"
                    >
                      {item.icon}
                    </a>
                  ))}
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </div>

      {/* Bottom Bar */}
      <div className="bg-[var(--secondary)] py-4">
        <Container>
          <div className="flex flex-col sm:flex-row  items-center gap-2 text-sm text-[var(--primary)] text-center">
            <span>© 2025 Annecreations. All rights reserved.</span>

          </div>
        </Container>
      </div>
    </footer>
  );
};

export default Footer;
