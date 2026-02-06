'use client'
import React from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import BreadCrum from '@/components/BreadCrum/BreadCrum';
import englsh_icon from '../../../public/assets/helppage_images/english.png';
import Telugu_icon from '../../../public/assets/helppage_images/telugu.png';
import Hindi_icon from '../../../public/assets/helppage_images/hindi.png';
import Tamil_icon from '../../../public/assets/helppage_images/tamil.png';
import Kannada_icon from '../../../public/assets/helppage_images/kannda.png';
import youtube_img from '../../../public/assets/helppage_images/youtubeimage.png';
import Image from 'next/image';
import { Container } from '@mui/material';
const Page = () => {
  const langagebtn = [
    { id: 1, name: 'English', image: englsh_icon, bgcolor: '#008209' },
    { id: 2, name: 'Telugu', image: Telugu_icon, bgcolor: '#C35B00' },
    { id: 3, name: 'Hindi', image: Hindi_icon, bgcolor: '#6A0084' },
    { id: 4, name: 'Tamil', image: Tamil_icon, bgcolor: '#9D0003' },
    { id: 5, name: 'Kannada', image: Kannada_icon, bgcolor: '#F8A900' },
  ];

  const youtubeImages = Array(10).fill(youtube_img);

  return (
    <>
      <BreadCrum
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Help', href: '/Help' },
        ]}
      />

    <Container className='my-20'>
      
      <h1 className="text-3xl   my-10 text-center font-bold px-4">
        Frequently Asked Questions
      </h1>

        {/* <Tabs>
       
<TabList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-y-8 gap-x-4 justify-between md:flex-nowrap overflow-x-auto overflow-y-hidden my-14">
  {langagebtn.map((item) => (
    <Tab
      key={item.id}
      className="flex justify-center items-center gap-2 px-6 py-2 rounded-md font-semibold cursor-pointer relative transition-all whitespace-nowrap min-w-fit"
      style={{
        backgroundColor: item.bgcolor,
      }}
      selectedClassName="!text-white !shadow-md"
    >
      <Image src={item.image} alt={item.name} />
      <span className="absolute text-black -bottom-5 left-1/2 -translate-x-1/2 text-sm">{item.name}</span>
    </Tab>
  ))}
</TabList>


          
          {langagebtn.map((_, index) => (
            <TabPanel key={index}>
              <div className="mt-6  ">
                <div className="grid grid-cols-2 sm:grid-cols-3  gap-4">
                  {youtubeImages.map((img, idx) => (
                    <div key={idx} className="w-full">
                      <Image
                        src={img}
                        alt={`YouTube thumbnail ${idx + 1}`}
                        className="rounded-md w-full h-auto"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabPanel>
          ))}
        </Tabs> */}
        <h2 className='text-center text-3xl'>Coming Soon</h2>
      </Container>
    </>
  );
};

export default Page;
