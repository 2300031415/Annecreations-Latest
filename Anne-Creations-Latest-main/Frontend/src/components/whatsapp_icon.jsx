import React from 'react'
import Whatsap_icon from "../../public/whatsapp.png"
import Image from 'next/image'
import { whatsappUrl } from '@/app/page'
import { FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa";

const whatsapp_icon = () => {
  const socialIcons = [
    { href: "https://www.facebook.com/AnneCreations.HB", color: '#1877F2', icon: <FaFacebook size={24} color="#1877F2" /> },
    { href: "https://www.instagram.com/annecreations.hb", color: '#E4405F', icon: <FaInstagram size={24} color="#E4405F" /> },
    { href: "https://www.youtube.com/@annecreationHB/", color: '#FF0000', icon: <FaYoutube size={24} color="#FF0000" /> },
  ];

  return (
    <div className="fixed bottom-50 right-5 z-50 flex flex-col gap-3 items-center">
      {socialIcons.map((item, index) => (
        <a
          key={index}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="w-[42px] h-[42px] bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        >
          {item.icon}
        </a>
      ))}

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
      >
        <Image
          src={Whatsap_icon}
          alt="WhatsApp"
          width={42}
          height={42}
        />
      </a>
    </div>
  )
}

export default whatsapp_icon
