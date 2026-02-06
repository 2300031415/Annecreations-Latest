'use client';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '@/i18n';

export default function I18nProvider({ children }) {
    const { i18n } = useTranslation();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Wait for i18n to be initialized
        if (i18n.isInitialized) {
            setIsReady(true);
        } else {
            i18n.on('initialized', () => {
                setIsReady(true);
            });
        }

        return () => {
            i18n.off('initialized');
        };
    }, [i18n]);

    if (!isReady) {
        return <div>Loading...</div>;
    }

    return children;
}
