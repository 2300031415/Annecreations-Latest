'use client';
import React from 'react';
import { useTranslation } from 'react-i18next';

const AnnouncementStrip = () => {
    const { t } = useTranslation();
    const text = t('home.announcement');

    return (
        <div className="w-full">
            {/* Marquee Section */}
            <div className="py-3 overflow-hidden relative bg-white">
                <div
                    className="flex whitespace-nowrap text-[var(--secondary)] font-semibold gap-8"
                    style={{
                        animation: 'scroll-left 20s linear infinite',
                    }}
                >
                    {/* Duplicate text enough times to fill screen and loop smoothly */}
                    {[...Array(4)].map((_, i) => (
                        <span key={i} className="inline-block">
                            {text} &nbsp; &bull; &nbsp;
                        </span>
                    ))}
                </div>
            </div>

            {/* Thick Divider Bar */}
            <div className="w-full h-[10px] bg-[var(--primary)]"></div>
        </div>
    );
};

export default AnnouncementStrip;
