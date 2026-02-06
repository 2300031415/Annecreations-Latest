'use client';

import React, { useEffect, useState } from 'react';
import { Container, Tabs, Tab } from '@mui/material';
import BreadCrum from '@/components/BreadCrum/BreadCrum';
import MyProfile from './MyProfile';
import OrderHistory from './OrderHistory';
import DesignRequests from './DesignRequests';
import Downloads from './Downloads';
import PropTypes from 'prop-types';
import ChangePassword from './ChangePassword';
import RecentlyViewed from './RecentlyViewed';
import { useSearchParams } from 'next/navigation';
import { getTitleCase } from '@/lib/helpers';
import { useRouter } from 'next/navigation';
import { useOrderStore } from '@/Store/orders';

// Tab panel component
function TabPanel({ children, value, current }) {
  return (
    <div hidden={value !== current} role="tabpanel">
      {value === current && <div className="w-full">{children}</div>}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  value: PropTypes.string.isRequired,
  current: PropTypes.string.isRequired,
};

// Tab configuration (explicit, stable)
const tabConfig = [
  { label: 'My Profile', key: 'profile', component: <MyProfile /> },
  { label: 'Change Password', key: 'changePassword', component: <ChangePassword /> },
  { label: 'Order History', key: 'orders', component: <OrderHistory /> },
  { label: 'Design Requests', key: 'requests', component: <DesignRequests /> },
  { label: 'Downloads', key: 'downloads', component: <Downloads /> },
  { label: 'Recently Viewed', key: 'history', component: <RecentlyViewed /> },
];

export default function AccountTabs() {
  const [tabKey, setTabKey] = useState('profile');
  const searchParams = useSearchParams();
  const router = useRouter();
  const setCurrentPage = useOrderStore((state) => state.setCurrentPage);

  // On load, set tab from URL query
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const foundTab = tabConfig.find((tab) => tab.key === tabParam);
    if (foundTab) setTabKey(foundTab.key);
  }, [searchParams]);

  // Reset pagination when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [tabKey, setCurrentPage]);

  const handleChange = (_, newValue) => {
    router.push(`/Profile?tab=${newValue}`)
  };

  return (
    <>
      <BreadCrum
        crumbs={[
          { label: 'Home', href: '/' },
          { label: getTitleCase(tabKey), href: `/Profile?tab=${tabKey}` },
        ]}
      />

      <Container className="my-20">
        <div className="flex flex-col lg:flex-row w-full gap-0">
          {/* Sidebar Tabs */}
          <div className="w-full h-fit lg:w-1/4 border-2 border-[var(--primary)] rounded-md">
            <p className="border-b-2 border-[var(--primary)] text-center text-transparent bg-clip-text bg-[linear-gradient(to_left,_#996E19_10%,_var(--primary))] font-bold py-3">
              Account
            </p>

            <Tabs
              orientation={
                typeof window !== 'undefined' && window.innerWidth < 1024
                  ? 'horizontal'
                  : 'vertical'
              }
              value={tabKey}
              onChange={handleChange}
              variant="scrollable"
              sx={{
                '.MuiTabs-indicator': { display: 'none' },
              }}
            >
              {tabConfig.map((tab) => (
                <Tab
                  key={tab.key}
                  label={tab.label}
                  value={tab.key}
                  sx={{
                    textAlign: 'left',
                    color: '#000',
                    alignItems: 'flex-start',
                    px: 2,
                    '&.Mui-selected': {
                      color: 'var(--primary)',
                      fontWeight: 'bold',
                    },
                  }}
                />
              ))}
            </Tabs>
          </div>

          {/* Tab Content */}
          <div className="w-full">
            {tabConfig.map((tab) => (
              <TabPanel key={tab.key} value={tabKey} current={tab.key}>
                {tab.component}
              </TabPanel>
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}
